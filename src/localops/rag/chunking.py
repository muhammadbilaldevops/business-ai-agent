"""Deterministic boundary-aware chunks, with stable source offsets and page metadata."""

import re


def chunk_text(text: str, size: int = 1000, overlap: int = 150, **metadata) -> list[dict]:
    if size < 32 or overlap < 0 or overlap >= size:
        raise ValueError("Require size >= 32 and 0 <= overlap < size")
    text = text.replace("\r\n", "\n").replace("\x00", "").strip()
    result: list[dict] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            for separator in ("\n\n", "\n", ". ", " "):
                boundary = text.rfind(separator, start + size // 2, end)
                if boundary > start:
                    end = boundary + len(separator)
                    break
        headings = re.findall(r"^#{1,6}\s+(.+)$", text[:end], re.M)
        result.append(
            {
                **metadata,
                "text": text[start:end],
                "chunk_index": len(result),
                "offset": start,
                "section": headings[-1] if headings else "",
            }
        )
        if end == len(text):
            break
        start = max(start + 1, end - overlap)
    return result
