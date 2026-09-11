import re
from dataclasses import dataclass
from localops.store import db

@dataclass
class Evidence:
    document_id: str
    filename: str
    excerpt: str
    score: int

def _terms(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]{3,}", text.lower()))

def search(query: str, limit: int = 4) -> list[Evidence]:
    wanted = _terms(query)
    with db() as connection:
        rows = connection.execute("SELECT id, filename, content FROM documents").fetchall()
    findings = []
    for row in rows:
        score = len(wanted & _terms(row["content"]))
        if score:
            findings.append(Evidence(row["id"], row["filename"], row["content"][:500], score))
    return sorted(findings, key=lambda item: item.score, reverse=True)[:limit]
