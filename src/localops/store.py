import sqlite3
from contextlib import contextmanager
from localops.config import settings

@contextmanager
def db():
    connection = sqlite3.connect(settings.data_dir / "localops.db")
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, filename TEXT, content TEXT)")
        connection.execute("CREATE TABLE IF NOT EXISTS approvals (id TEXT PRIMARY KEY, action_type TEXT, payload TEXT, status TEXT)")
        connection.execute("CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, event TEXT, detail TEXT)")
        yield connection
        connection.commit()
    finally:
        connection.close()
