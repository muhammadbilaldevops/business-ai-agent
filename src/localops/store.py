"""SQLite transactions and forward-only schema migration, independent of graph memory."""

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from localops.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS knowledge(id TEXT PRIMARY KEY, filename TEXT NOT NULL, content TEXT NOT NULL, chunks TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS datasets(id TEXT PRIMARY KEY, filename TEXT NOT NULL, columns_json TEXT NOT NULL, rows_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE, role TEXT NOT NULL, content TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY, tool TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', run_id TEXT, result TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_events(id INTEGER PRIMARY KEY, event TEXT NOT NULL, entity_id TEXT NOT NULL, request_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS messages_conversation ON messages(conversation_id,id);
CREATE INDEX IF NOT EXISTS requests_status ON requests(status);
"""


class Store:
    def __init__(self, path: Path):
        self.path = path
        with self.connect() as c:
            c.executescript(SCHEMA)
            if not c.execute("SELECT 1 FROM schema_version WHERE version=1").fetchone():
                # Preserve original foundation uploads. They can be re-indexed through the UI.
                legacy = c.execute(
                    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='documents'"
                ).fetchone()
                if legacy:
                    for row in c.execute("SELECT id, filename, content FROM documents").fetchall():
                        c.execute(
                            "INSERT OR IGNORE INTO knowledge(id,filename,content,chunks) VALUES(?,?,?,?)",
                            (*tuple(row), "[]"),
                        )
                c.execute("INSERT INTO schema_version VALUES(1)")

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def rows(self, sql: str, parameters: tuple = ()) -> list[dict]:
        with self.connect() as c:
            return [dict(r) for r in c.execute(sql, parameters).fetchall()]

    def audit(self, event: str, entity_id: str, request_id: str = "") -> None:
        with self.connect() as c:
            c.execute(
                "INSERT INTO audit_events(event,entity_id,request_id) VALUES(?,?,?)",
                (event, entity_id, request_id),
            )

    def message(self, conversation_id: str, role: str, content: str, metadata: dict | None = None):
        with self.connect() as c:
            c.execute(
                "INSERT OR IGNORE INTO conversations(id,title) VALUES(?,?)",
                (conversation_id, content[:80]),
            )
            c.execute(
                "INSERT INTO messages(conversation_id,role,content,metadata) VALUES(?,?,?,?)",
                (conversation_id, role, content, json.dumps(metadata or {})),
            )


@contextmanager
def db():
    """Compatibility helper for integrations importing the original store."""
    with Store(settings.data_dir / "localops.db").connect() as connection:
        yield connection
