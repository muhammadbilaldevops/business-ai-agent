from typing import TypedDict


class AgentState(TypedDict, total=False):
    user_query: str
    conversation_id: str
    run_id: str
    intent: str
    dataset_id: str | None
    citations: list[dict]
    analytics: dict | None
    approval: dict | None
    trajectory: list[str]
    final_answer: str
    iteration_count: int
    error: str | None
