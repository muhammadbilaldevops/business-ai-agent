"""Explicit model bootstrap. Normal application startup never downloads assets."""

import argparse
import subprocess
from pathlib import Path

from localops.config import Settings
from localops.llm.ollama_client import OllamaClient


def main():
    p = argparse.ArgumentParser()
    p.add_argument(
        "--pull", action="store_true", help="Explicitly download the configured Ollama model"
    )
    p.add_argument(
        "--semantic", action="store_true", help="Explicitly download BGE embeddings and reranker"
    )
    a = p.parse_args()
    s = Settings()
    print("Ollama status:", OllamaClient(s).health())
    if a.pull:
        subprocess.run(["ollama", "pull", s.model], check=True)
    if a.semantic:
        from sentence_transformers import CrossEncoder, SentenceTransformer

        models = Path("data/models")
        models.mkdir(parents=True, exist_ok=True)
        SentenceTransformer("BAAI/bge-small-en-v1.5").save(str(models / "bge-small-en-v1.5"))
        CrossEncoder("BAAI/bge-reranker-base").save(str(models / "bge-reranker-base"))
    print(
        "Configure LOCALOPS_MODE=ollama after the model is available. Semantic paths are documented in .env.example."
    )


if __name__ == "__main__":
    main()
