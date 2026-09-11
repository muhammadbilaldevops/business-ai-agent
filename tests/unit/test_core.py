import pytest
from fastapi import HTTPException

from localops.agents.supervisor import classify
from localops.analytics import validate_sql
from localops.rag.chunking import chunk_text
from localops.rag.retriever import reciprocal_rank_fusion
from localops.security.validation import safe_filename, safe_path


@pytest.mark.parametrize(
    "name", ["../secret", "..\\secret", "a/b", "a\\b", "a\x00b", ".", "..", "C:secret", ""]
)
def test_reject_bad_names(name):
    with pytest.raises(HTTPException):
        safe_filename(name)


def test_chunking_deterministic():
    text = "# Policy\n\n" + ("Evidence-backed operations. " * 200)
    chunks = chunk_text(text, 100, 20, document_id="a", page=2)
    assert chunks == chunk_text(text, 100, 20, document_id="a", page=2)
    assert all(len(c["text"]) <= 100 for c in chunks)
    assert chunks[-1]["offset"] + len(chunks[-1]["text"]) == len(text.strip())
    assert all(c["page"] == 2 for c in chunks)
    assert all(b["offset"] <= a["offset"] + len(a["text"]) for a, b in zip(chunks, chunks[1:]))


@pytest.mark.parametrize("size,overlap", [(10, 0), (100, 100), (100, -1)])
def test_invalid_chunk_parameters(size, overlap):
    with pytest.raises(ValueError):
        chunk_text("x", size, overlap)


def test_fusion():
    assert (
        reciprocal_rank_fusion([[1, 2], [2, 1]])[0][1]
        == reciprocal_rank_fusion([[1, 2], [2, 1]])[1][1]
    )
    assert reciprocal_rank_fusion([[1, 2], [2]])[0][0] == 2


@pytest.mark.parametrize(
    "query,intent",
    [
        ("refund policy", "knowledge"),
        ("Analyze sales", "analytics"),
        ("Create a follow-up task", "action"),
        ("Generate a sales report", "multi_step"),
        ("hello", "general"),
    ],
)
def test_routes(query, intent):
    assert classify(query) == intent


def test_path_escape(tmp_path):
    with pytest.raises(HTTPException):
        safe_path(tmp_path, "../secret")


@pytest.mark.parametrize(
    "sql",
    [
        "SELECT * FROM read_csv('/etc/passwd')",
        "SELECT * FROM dataset; DROP TABLE dataset",
        "DELETE FROM dataset",
        "SELECT * FROM range(9999999999)",
        "SELECT * FROM dataset d JOIN dataset e ON true",
        "WITH a AS (SELECT * FROM dataset) SELECT * FROM a",
        "SELECT getenv('HOME') FROM dataset",
        "SELECT * FROM '/etc/passwd'",
        "SELECT * INTO 'x' FROM dataset",
        "SELECT * FROM other",
    ],
)
def test_sql_deny(sql):
    with pytest.raises(HTTPException):
        validate_sql(sql)


def test_sql_accept():
    assert "SUM" in validate_sql("SELECT SUM(revenue) FROM dataset")
