"""Environment-driven settings; construction never downloads models."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    data_dir: Path = field(
        default_factory=lambda: Path(os.getenv("LOCALOPS_DATA_DIR", "data/runtime"))
    )
    mode: str = field(default_factory=lambda: os.getenv("LOCALOPS_MODE", "extractive"))
    ollama_url: str = field(
        default_factory=lambda: os.getenv("LOCALOPS_OLLAMA_URL", "http://127.0.0.1:11434")
    )
    model: str = field(default_factory=lambda: os.getenv("LOCALOPS_MODEL", "llama3.1:8b"))
    embedding_path: str = field(default_factory=lambda: os.getenv("LOCALOPS_EMBEDDING_PATH", ""))
    reranker_path: str = field(default_factory=lambda: os.getenv("LOCALOPS_RERANKER_PATH", ""))
    stt_path: str = field(default_factory=lambda: os.getenv("LOCALOPS_STT_PATH", ""))
    tts_model: str = field(default_factory=lambda: os.getenv("LOCALOPS_TTS_MODEL", ""))
    tts_voices: str = field(default_factory=lambda: os.getenv("LOCALOPS_TTS_VOICES", ""))
    api_key: str = field(default_factory=lambda: os.getenv("LOCALOPS_API_KEY", ""))
    gemini_api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-3.7-flash"))
    allowed_origins: tuple[str, ...] = field(default_factory=lambda: tuple(
        x.strip().rstrip("/") for x in os.getenv("LOCALOPS_ALLOWED_ORIGINS", "").split(",") if x.strip()
    ))
    max_upload_bytes: int = 10 * 1024 * 1024
    max_text_chars: int = 1_000_000
    max_rows: int = 10_000
    chunk_size: int = 1000
    chunk_overlap: int = 150
    query_timeout: float = 5.0
    llm_timeout: float = 60.0
    max_iterations: int = 12

    def __post_init__(self):
        if self.mode not in {"extractive", "ollama", "gemini"}:
            raise ValueError("LOCALOPS_MODE must be extractive, ollama, or gemini")
        if os.getenv("RENDER") and not self.api_key:
            raise ValueError("LOCALOPS_API_KEY is required for the hosted private workspace")
        for origin in self.allowed_origins:
            parsed_origin = urlparse(origin)
            if parsed_origin.scheme not in {"https", "http"} or not parsed_origin.netloc or parsed_origin.path or parsed_origin.query or parsed_origin.fragment or parsed_origin.username:
                raise ValueError("Allowed origins must be exact HTTP(S) origins")
        parsed = urlparse(self.ollama_url)
        if parsed.scheme != "http" or parsed.hostname not in {
            "localhost",
            "127.0.0.1",
            "::1",
            "ollama",
        }:
            raise ValueError("Ollama must use an explicitly local HTTP host")
        if parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError("Invalid local Ollama URL")
        if self.model.endswith(":cloud"):
            raise ValueError("Cloud models are not supported")
        self.data_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
