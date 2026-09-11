"""AST allowlist plus a resource-bounded, network/file-disabled DuckDB subprocess."""

import json
import math
import multiprocessing
import re
from pathlib import Path

import sqlglot
from fastapi import HTTPException
from sqlglot import exp

from localops.rag.loaders import load_table

ALLOWED_FUNCTIONS = {
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "ROUND",
    "ABS",
    "COALESCE",
    "CAST",
    "TRY_CAST",
    "LOWER",
    "UPPER",
    "LENGTH",
    "SUBSTRING",
    "DATE_TRUNC",
    "YEAR",
    "MONTH",
    "STRFTIME",
    "NULLIF",
}


def validate_sql(query: str) -> str:
    if not query.strip() or len(query) > 4000:
        raise HTTPException(400, "Use a SQL query of 1–4000 characters")
    try:
        statements = sqlglot.parse(query, read="duckdb")
    except sqlglot.errors.ParseError as exc:
        raise HTTPException(400, "Invalid SQL syntax") from exc
    if len(statements) != 1 or not isinstance(statements[0], exp.Select):
        raise HTTPException(400, "Only one SELECT query is allowed")
    node = statements[0]
    for child in node.walk():
        if isinstance(child, (exp.Command, exp.DDL, exp.DML, exp.Into, exp.Join, exp.With)):
            raise HTTPException(400, "DDL, writes, joins, and CTEs are disabled")
        if isinstance(child, exp.Table) and (
            not isinstance(child.this, exp.Identifier)
            or child.name.lower() != "dataset"
            or child.db
            or child.catalog
        ):
            raise HTTPException(400, "Only the uploaded dataset table can be queried")
        if isinstance(child, exp.Func):
            name = (
                child.name.upper() if isinstance(child, exp.Anonymous) else child.sql_name().upper()
            )
            if name not in ALLOWED_FUNCTIONS:
                raise HTTPException(400, f"Function {name} is not allowlisted")
    if not list(node.find_all(exp.Table)):
        raise HTTPException(400, "Query must read the dataset table")
    return node.sql(dialect="duckdb")


def _query_worker(send, columns: list[str], rows: list[dict], query: str):
    import duckdb

    connection = None
    try:
        connection = duckdb.connect(
            ":memory:",
            config={
                "enable_external_access": False,
                "allow_unsigned_extensions": False,
                "autoinstall_known_extensions": False,
                "autoload_known_extensions": False,
                "threads": 1,
                "memory_limit": "128MB",
                "python_enable_replacements": False,
            },
        )
        numeric = {
            c: all(
                str(row[c]).strip() == "" or re.fullmatch(r"-?\d+(\.\d+)?", str(row[c]))
                for row in rows
            )
            and any(str(row[c]).strip() for row in rows)
            for c in columns
        }

        def quoted(c):
            return '"' + c.replace('"', '""') + '"'

        definition = ",".join(
            quoted(c) + (" DOUBLE" if numeric[c] else " VARCHAR") for c in columns
        )
        connection.execute("CREATE TABLE dataset (" + definition + ")")
        values = [
            [(float(row[c]) if row[c] != "" else None) if numeric[c] else row[c] for c in columns]
            for row in rows
        ]
        connection.executemany(
            "INSERT INTO dataset VALUES (" + ",".join("?" for _ in columns) + ")", values
        )
        cursor = connection.execute("SELECT * FROM (" + query + ") AS bounded LIMIT 500")
        names = [c[0] for c in cursor.description]
        output = [
            {
                c: (None if isinstance(v, float) and not math.isfinite(v) else v)
                for c, v in zip(names, row)
            }
            for row in cursor.fetchall()
        ]
        send.send(
            {"columns": names, "rows": json.loads(json.dumps(output, default=str)), "limit": 500}
        )
    except Exception:
        send.send({"error": "Query failed. Check column names and data types."})
    finally:
        if connection:
            connection.close()
        send.close()


def query_rows(columns: list[str], rows: list[dict], query: str, timeout: float = 5) -> dict:
    query = validate_sql(query)
    context = multiprocessing.get_context("spawn")
    receive, send = context.Pipe(duplex=False)
    process = context.Process(target=_query_worker, args=(send, columns, rows, query), daemon=True)
    process.start()
    send.close()
    try:
        if not receive.poll(timeout):
            raise HTTPException(408, "Query timed out")
        try:
            result = receive.recv()
        except EOFError as exc:
            raise HTTPException(422, "Query worker could not complete") from exc
        if "error" in result:
            raise HTTPException(422, result["error"])
        return result
    finally:
        receive.close()
        process.join(0.1)
        if process.is_alive():
            process.terminate()
            process.join(1)


def safe_query(dataset_path: Path, query: str) -> dict:
    columns, rows = load_table(dataset_path.name, dataset_path.read_bytes())
    return query_rows(columns, rows, query)
