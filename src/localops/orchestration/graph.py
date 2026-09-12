"""Explicit LangGraph routing; persisted interrupt before every mutating action."""

import json
import re
import sqlite3
import threading
from uuid import uuid4

from fastapi import HTTPException
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from localops.agents.state import AgentState
from localops.agents.supervisor import classify
from localops.analytics import query_rows
from localops.llm.ollama_client import SYSTEM, OllamaClient
from localops.llm.gemini_client import GeminiClient


class Agent:
    def __init__(self, store, retriever, registry, settings):
        self.store, self.retriever, self.registry, self.settings = (
            store,
            retriever,
            registry,
            settings,
        )
        self.llm = GeminiClient(settings) if settings.mode == "gemini" else OllamaClient(settings)
        self.lock = threading.RLock()
        self.events = threading.local()
        self.connection = sqlite3.connect(
            settings.data_dir / "checkpoints.sqlite", check_same_thread=False
        )
        builder = StateGraph(AgentState)
        builder.add_node("supervisor", self.supervisor)
        builder.add_node("knowledge_agent", self.knowledge)
        builder.add_node("analyst_agent", self.analytics)
        builder.add_node("action_agent", self.prepare)
        builder.add_node("human_approval", self.approval)
        builder.add_node("general", self.general)
        builder.add_edge(START, "supervisor")
        builder.add_conditional_edges(
            "supervisor",
            lambda s: s["intent"],
            {
                "knowledge": "knowledge_agent",
                "analytics": "analyst_agent",
                "action": "action_agent",
                "multi_step": "analyst_agent",
                "general": "general",
            },
        )
        builder.add_conditional_edges(
            "analyst_agent", lambda s: "action_agent" if s["intent"] == "multi_step" else END
        )
        builder.add_edge("action_agent", "human_approval")
        builder.add_edge("human_approval", END)
        builder.add_edge("knowledge_agent", END)
        builder.add_edge("general", END)
        self.graph = builder.compile(checkpointer=SqliteSaver(self.connection))

    def step(self, state, node, **updates):
        count = state.get("iteration_count", 0) + 1
        if count > self.settings.max_iterations:
            raise HTTPException(422, "Agent iteration limit reached")
        return {
            **updates,
            "trajectory": state.get("trajectory", []) + [node],
            "iteration_count": count,
        }

    def supervisor(self, s):
        return self.step(
            s, "supervisor", intent=classify(s["user_query"], bool(s.get("dataset_id")))
        )

    def model_answer(self, s, context):
        history = self.store.rows(
            "SELECT role,content FROM messages WHERE conversation_id=? ORDER BY id DESC LIMIT 7",
            (s["conversation_id"],),
        )
        history = list(reversed(history))
        if history and history[-1]["role"] == "user":
            history = history[:-1]
        messages = [{"role": "system", "content": SYSTEM}] + history
        messages.append({"role": "user", "content": json.dumps({
            "question": s["user_query"], "untrusted_evidence": context,
        })})
        pieces = []
        for item in self.llm.stream(messages):
            token = item.get("message", {}).get("content", "")
            pieces.append(token)
            if getattr(self.events, "emit", None):
                self.events.emit(token)
        answer = "".join(pieces)
        if not answer.strip():
            raise HTTPException(503, "The model returned an empty response")
        return answer

    def general(self, s):
        answer = self.model_answer(s, "") if self.settings.mode == "gemini" else "Hello. Ask about an uploaded document, analyze a dataset, or create a task for approval."
        return self.step(s, "general", final_answer=answer)

    def knowledge(self, s):
        citations = self.retriever.search(s["user_query"])
        context = "\n\n".join(
            f"[{i + 1}] {c['filename']}: {c['excerpt']}" for i, c in enumerate(citations)
        )
        answer = "I do not have sufficient local evidence to answer that. Upload a relevant document or ask a more specific question."
        if self.settings.mode == "gemini" or (citations and self.settings.mode == "ollama"):
            answer = self.model_answer(s, context)
        elif citations:
            answer = "Relevant source excerpts (extractive mode; no language model):\n\n" + context
        return self.step(s, "knowledge_agent", citations=citations, final_answer=answer)

    def analytics(self, s):
        rows = self.store.rows(
            "SELECT * FROM datasets"
            + (" WHERE id=?" if s.get("dataset_id") else " ORDER BY created_at DESC"),
            (s["dataset_id"],) if s.get("dataset_id") else (),
        )
        if not rows:
            return self.step(
                s,
                "analyst_agent",
                final_answer="Upload a CSV or XLSX dataset in Analytics first.",
                analytics=None,
            )
        selected = rows[0]
        if not s.get("dataset_id"):
            hint = "inventory" if re.search(r"inventory|stock", s["user_query"], re.I) else "sales"
            selected = next((r for r in rows if hint in r["filename"].lower()), selected)
        columns, data = json.loads(selected["columns_json"]), json.loads(selected["rows_json"])
        lower = {c.lower(): c for c in columns}

        def q(c):
            return '"' + c.replace('"', '""') + '"'

        sql = "SELECT * FROM dataset LIMIT 10"
        if "stock" in lower and "reorder_level" in lower:
            sql = f"SELECT * FROM dataset WHERE {q(lower['stock'])} < {q(lower['reorder_level'])}"
        elif "revenue" in lower:
            if "month" in lower:
                sql = f"SELECT {q(lower['month'])}, SUM({q(lower['revenue'])}) AS revenue FROM dataset GROUP BY {q(lower['month'])} ORDER BY {q(lower['month'])}"
            else:
                sql = f"SELECT SUM({q(lower['revenue'])}) AS revenue, COUNT(*) AS rows FROM dataset"
        result = query_rows(columns, data, sql, self.settings.query_timeout)
        result.update(dataset_id=selected["id"], filename=selected["filename"], query=sql)
        answer = f"Computed {len(result['rows'])} result rows from {selected['filename']}. These are descriptive results; the data alone does not establish causes."
        return self.step(s, "analyst_agent", analytics=result, final_answer=answer)

    def prepare(self, s):
        tool = "create_report" if "report" in s["user_query"].lower() else "create_task"
        payload = {"title": s["user_query"][:200]}
        if tool == "create_report":
            payload["content"] = (
                "# Operations report\n\n"
                + s.get("final_answer", "Prepared from your request.")
                + "\n\n"
                + json.dumps(s.get("analytics") or {}, indent=2)
            )
        else:
            payload["description"] = s["user_query"]
        approval = self.registry.request(tool, payload, s["run_id"])
        return self.step(
            s,
            "action_agent",
            approval=approval,
            final_answer="Please review this action in Approvals. Nothing has been executed yet.",
        )

    def approval(self, s):
        decision = interrupt(s["approval"])
        result = self.registry.decide(s["approval"]["approval_id"], bool(decision))
        return self.step(
            s,
            "human_approval",
            approval=result,
            final_answer="Action completed in your local workspace."
            if result["executed"]
            else "Action rejected. No task or report was created.",
        )

    def run(self, query, conversation_id, dataset_id=None, emit=None):
        with self.lock:
            self.events.emit = emit
            run_id = str(uuid4())
            self.store.message(conversation_id, "user", query)
            state = self.graph.invoke(
                {
                    "user_query": query,
                    "conversation_id": conversation_id,
                    "run_id": run_id,
                    "dataset_id": dataset_id,
                    "citations": [],
                    "analytics": None,
                    "approval": None,
                    "trajectory": [],
                    "iteration_count": 0,
                },
                config={
                    "configurable": {"thread_id": run_id},
                    "recursion_limit": self.settings.max_iterations,
                },
            )
            response = self.response(state)
            self.store.message(conversation_id, "assistant", response["answer"], response)
            return response

    def resume(self, approval_id, approved):
        with self.lock:
            rows = self.store.rows("SELECT * FROM requests WHERE id=?", (approval_id,))
            if not rows:
                raise HTTPException(404, "Approval not found")
            row = rows[0]
            if row["status"] != "pending" or not row["run_id"]:
                return self.registry.decide(approval_id, approved)
            result = self.graph.invoke(
                Command(resume=approved),
                config={
                    "configurable": {"thread_id": row["run_id"]},
                    "recursion_limit": self.settings.max_iterations,
                },
            )
            response = self.response(result)
            self.store.message(result["conversation_id"], "assistant", response["answer"], response)
            return result["approval"]

    def response(self, s):
        return {
            "answer": s.get("final_answer", ""),
            "citations": s.get("citations", []),
            "analytics": s.get("analytics"),
            "approval": s.get("approval"),
            "trajectory": s.get("trajectory", []),
            "conversation_id": s["conversation_id"],
            "mode": self.settings.mode,
        }

    def close(self):
        self.connection.close()
