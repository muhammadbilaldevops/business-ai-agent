"""Explicit sample-data loading through the API; does not overwrite existing files."""

import argparse
import os
from pathlib import Path

import httpx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    headers = (
        {"Authorization": "Bearer " + os.getenv("LOCALOPS_API_KEY", "")}
        if os.getenv("LOCALOPS_API_KEY")
        else {}
    )
    with httpx.Client(base_url=args.url, headers=headers, timeout=30, trust_env=False) as client:
        existing = {d["filename"] for d in client.get("/api/documents").raise_for_status().json()}
        existing |= {
            d["filename"] for d in client.get("/api/analytics/datasets").raise_for_status().json()
        }
        for file in (Path(__file__).resolve().parents[1] / "data/samples").iterdir():
            if file.suffix not in {".md", ".csv"} or file.name in existing:
                continue
            endpoint = "/api/analytics/upload" if file.suffix == ".csv" else "/api/documents/upload"
            response = client.post(endpoint, files={"file": (file.name, file.read_bytes())})
            response.raise_for_status()
            print("Loaded", file.name)


if __name__ == "__main__":
    main()
