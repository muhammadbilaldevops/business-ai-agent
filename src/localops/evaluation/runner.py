"""A transparent deterministic evaluation; never substitutes for live model evaluation."""

import json
import platform
import statistics
import tempfile
import time
from pathlib import Path

from localops.agents.supervisor import classify
from localops.config import Settings
from localops.rag.chunking import chunk_text
from localops.services import Services


def evaluate(dataset: Path) -> dict:
    cases = json.loads(dataset.read_text())
    timings = []
    records = []
    with tempfile.TemporaryDirectory() as folder:
        svc = Services(Settings(data_dir=Path(folder), mode="extractive"))
        try:
            for key, text in {
                "refund": "Refunds are available within 30 days with proof of purchase.",
                "delivery": "Escalate delivery delays after 7 business days.",
                "onboarding": "Employee onboarding starts with orientation and security training.",
            }.items():
                chunks = chunk_text(text, document_id=key, filename=key + ".md", page=None)
                with svc.store.connect() as c:
                    c.execute(
                        "INSERT INTO knowledge(id,filename,content,chunks) VALUES(?,?,?,?)",
                        (key, key + ".md", text, json.dumps(chunks)),
                    )
            for case in cases:
                start = time.perf_counter()
                intent = classify(case["input"])
                sources = svc.retriever.search(case["input"]) if intent == "knowledge" else []
                timings.append((time.perf_counter() - start) * 1000)
                ids = [s["document_id"] for s in sources]
                passed = intent == case["intent"] and (
                    case.get("source") in ids
                    if case.get("source")
                    else not ids
                    if case.get("abstain")
                    else True
                )
                records.append(
                    {"input": case["input"], "passed": passed, "intent": intent, "sources": ids}
                )
        finally:
            svc.close()
    return {
        "mode": "extractive",
        "scope": "Routing and lexical source recall; no generative faithfulness or voice measurement",
        "python": platform.python_version(),
        "machine": platform.machine(),
        "cases": len(records),
        "passed": sum(r["passed"] for r in records),
        "pass_rate": sum(r["passed"] for r in records) / len(records),
        "latency_ms": {
            "p50": statistics.median(timings),
            "p95": sorted(timings)[min(len(timings) - 1, int(len(timings) * 0.95))],
        },
        "results": records,
    }
