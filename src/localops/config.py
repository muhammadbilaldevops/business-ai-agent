from dataclasses import dataclass
from pathlib import Path
import os

@dataclass(frozen=True)
class Settings:
    data_dir: Path = Path(os.getenv("LOCALOPS_DATA_DIR", "data"))
    ollama_url: str = os.getenv("LOCALOPS_OLLAMA_URL", "http://localhost:11434")
    model: str = os.getenv("LOCALOPS_MODEL", "llama3.1:8b")
    max_upload_bytes: int = int(os.getenv("LOCALOPS_MAX_UPLOAD_BYTES", "10485760"))

    def __post_init__(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        (self.data_dir / "documents").mkdir(exist_ok=True)
        (self.data_dir / "datasets").mkdir(exist_ok=True)

settings = Settings()
