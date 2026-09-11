from pathlib import Path
from fastapi import HTTPException

def safe_filename(name: str) -> str:
    candidate = Path(name or "upload").name
    if candidate != name or candidate in {"", ".", ".."}:
        raise HTTPException(400, "Invalid filename")
    return candidate

def limit_bytes(content: bytes, maximum: int) -> None:
    if not content:
        raise HTTPException(400, "File is empty")
    if len(content) > maximum:
        raise HTTPException(413, "File exceeds configured size limit")
