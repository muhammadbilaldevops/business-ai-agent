import re
from pathlib import Path
import duckdb
from fastapi import HTTPException

FORBIDDEN = re.compile(r"\b(drop|delete|update|insert|alter|attach|install|load|copy|create|replace)\b", re.I)

def safe_query(dataset_path: Path, query: str) -> dict:
    statement = query.strip().rstrip(";")
    if not statement.lower().startswith(("select", "with")) or FORBIDDEN.search(statement):
        raise HTTPException(400, "Only a single read-only SELECT or WITH query is permitted")
    if ";" in statement:
        raise HTTPException(400, "Multiple statements are not permitted")
    connection = duckdb.connect(":memory:")
    try:
        connection.execute("CREATE VIEW dataset AS SELECT * FROM read_csv_auto(?)", [str(dataset_path)])
        result = connection.execute(f"SELECT * FROM ({statement}) AS bounded LIMIT 500")
        columns = [item[0] for item in result.description]
        return {"columns": columns, "rows": [dict(zip(columns, row)) for row in result.fetchall()]}
    finally:
        connection.close()
