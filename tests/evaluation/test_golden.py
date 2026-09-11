from pathlib import Path

from localops.evaluation.runner import evaluate


def test_golden_cases():
    report = evaluate(Path("tests/evaluation/datasets/golden.json"))
    assert report["passed"] == report["cases"], report["results"]
