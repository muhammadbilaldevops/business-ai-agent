# orchestration

`graph.py` routes requests, retrieves evidence, computes analytics, stages actions and resumes durable human approvals. SQLite checkpoints are separate from the business database. Test with `pytest tests/integration/test_workflows.py`.
