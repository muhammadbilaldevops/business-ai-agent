import json
from pathlib import Path

from localops.evaluation.runner import evaluate

if __name__ == "__main__":
    result = evaluate(Path("tests/evaluation/datasets/golden.json"))
    Path("docs/evaluation-results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k != "results"}, indent=2))
    raise SystemExit(0 if result["passed"] == result["cases"] else 1)
