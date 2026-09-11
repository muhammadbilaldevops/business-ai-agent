import re
from pathlib import Path

from fastapi import HTTPException


def safe_filename(name: str) -> str:
    if (
        not name
        or len(name) > 180
        or name in {".", ".."}
        or re.search(r"[/\\\x00-\x1f\x7f:]", name)
        or Path(name).name != name
    ):
        raise HTTPException(400, "Invalid filename")
    return name


def limit_bytes(content: bytes, maximum: int):
    if not content:
        raise HTTPException(400, "File is empty")
    if len(content) > maximum:
        raise HTTPException(413, "File exceeds configured size limit")


def safe_path(root: Path, relative: str) -> Path:
    candidate = (root / relative).resolve()
    if not candidate.is_relative_to(root.resolve()) or candidate == root.resolve():
        raise HTTPException(400, "Path must remain inside the workspace")
    return candidate
