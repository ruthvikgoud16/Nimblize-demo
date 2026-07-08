"""
Nimblize - LangGraph Orchestrator
Manages the full Agent 1 → Validation → Agent 2 → RAGAS Evaluation state machine.

FIX C1/C2/C3: LangGraph StateGraph requires a TypedDict, not a Pydantic BaseModel.
              Node functions receive and return plain dicts that are merged into state.
FIX H1: OpenAI client is created lazily inside run_pipeline() — not at import time.

State transitions:
  START → pii_filter → extraction → validate_schema
    ├─ (repair)       → extraction (loop-back, max 3 times)
    ├─ (dead_letter)  → END
    └─ (strategy)     → strategy → evaluate → confidence_gate
         ├─ (approved) → persist → END
         └─ (review)   → queue_hitl → END
"""

import os
from typing import Literal, Optional, Dict, Any, List, TypedDict

from langgraph.graph import StateGraph, END

from backend.schemas.competitor import PayloadStatus
from backend.agents.extraction_agent import run_extraction_agent
from backend.agents.strategy_agent import run_strategy_agent
from backend.evaluation.ragas_evaluator import evaluate_with_ragas
from backend.queues.redis_queue import push_notification_job
from backend.middleware.pii_filter import redact_pii
from backend.db.postgres import upsert_competitor, persist_strategy_report


# ─────────────────────────────────────────────────────────────────────────────
# C1 FIX: State must be a TypedDict — LangGraph merges node return dicts
# into this typed structure. Pydantic BaseModel is NOT compatible.
# ─────────────────────────────────────────────────────────────────────────────
class PipelineState(TypedDict, total=False):
    pipeline_id: str
    raw_text: str
    cleaned_text: Optional[str]
    extracted_data: Optional[Dict[str, Any]]
    strategy_report: Optional[Dict[str, Any]]
    validation_errors: List[str]
    extraction_attempts: int
    ragas_scores: Dict[str, float]
    status: str
    assigned_evaluator: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
# Node Implementations — all receive/return plain dicts
# ─────────────────────────────────────────────────────────────────────────────

def node_pii_filter(state: PipelineState) -> dict:
    """Strip PII from raw text before sending to external LLMs."""
    cleaned = redact_pii(state["raw_text"])
    print(f"[PII Filter] ✅ PII redaction complete for pipeline: {state.get('pipeline_id')}")
    return {"cleaned_text": cleaned}


def node_extraction(state: PipelineState) -> dict:
    """Run Agent 1. Increment attempt counter."""
    # H1 FIX: Create OpenAI client here or use lazy singleton, not at module level
    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    try:
        payload = run_extraction_agent(state["cleaned_text"], client)
        return {
            "extracted_data": payload,
            "extraction_attempts": state.get("extraction_attempts", 0) + 1,
            "validation_errors": [],
        }
    except RuntimeError as e:
        return {
            "extracted_data": None,
            "extraction_attempts": state.get("extraction_attempts", 0) + 1,
            "validation_errors": [str(e)],
        }


def node_strategy(state: PipelineState) -> dict:
    """Run Agent 2 on the validated competitor payload."""
    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    report = run_strategy_agent(state["extracted_data"], client)
    return {"strategy_report": report}


def node_evaluate(state: PipelineState) -> dict:
    """Compute RAGAS scores: Faithfulness, Answer Relevance, Context Recall."""
    scores = evaluate_with_ragas(
        context=state.get("cleaned_text", ""),
        extracted=state.get("extracted_data"),
        strategy=state.get("strategy_report"),
    )
    print(f"[RAGAS] Scores: {scores}")
    return {"ragas_scores": scores}


def node_persist(state: PipelineState) -> dict:
    """Write approved payload to PostgreSQL production tables."""
    upsert_competitor(state["extracted_data"])
    persist_strategy_report(state["strategy_report"])
    print(f"[DB] ✅ Pipeline {state.get('pipeline_id')} persisted to production.")
    return {"status": PayloadStatus.VERIFIED_PRODUCTION.value}


def node_queue_hitl(state: PipelineState) -> dict:
    """Push low-confidence payload to Redis notification queue."""
    ragas_scores = state.get("ragas_scores", {})
    # C3 FIX: state is a plain dict here — use dict access, not .model_dump()
    score = sum(ragas_scores.values()) / max(len(ragas_scores), 1)
    push_notification_job(
        pipeline_id=state.get("pipeline_id", "unknown"),
        score=score,
        payload=dict(state),   # plain dict, safe to pass
    )
    print(
        f"[Queue] ⚠️  Pipeline {state.get('pipeline_id')} flagged (score={score:.2f}). "
        f"Queued for HITL review."
    )
    return {
        "status": PayloadStatus.FLAGGED_FOR_HUMAN_REVIEW.value,
        "assigned_evaluator": "Aastha Shukla",
    }


def node_dead_letter(state: PipelineState) -> dict:
    """Route to dead-letter queue after 3 failed extraction attempts."""
    print(
        f"[Dead Letter] ❌ Pipeline {state.get('pipeline_id')} failed extraction "
        f"after {state.get('extraction_attempts', 0)} attempts."
    )
    return {"status": PayloadStatus.DEAD_LETTER.value}


# ─────────────────────────────────────────────────────────────────────────────
# Conditional Edge Routers
# H5 FIX: dead_letter check must come BEFORE success check to avoid
#         off-by-one (loop fires at attempt 4 instead of 3).
# ─────────────────────────────────────────────────────────────────────────────

def route_after_extraction(
    state: PipelineState,
) -> Literal["repair", "dead_letter", "strategy"]:
    attempts = state.get("extraction_attempts", 0)
    if state.get("extracted_data") is not None:
        return "strategy"
    # H5 FIX: check dead_letter BEFORE allowing another repair loop
    if attempts >= 3:
        return "dead_letter"
    return "repair"


def route_after_evaluation(
    state: PipelineState,
) -> Literal["approved", "review"]:
    THRESHOLD = 0.85
    ragas_scores = state.get("ragas_scores", {})
    if not ragas_scores:
        return "review"
    mean_score = sum(ragas_scores.values()) / len(ragas_scores)
    return "approved" if mean_score >= THRESHOLD else "review"


# ─────────────────────────────────────────────────────────────────────────────
# Graph Assembly
# ─────────────────────────────────────────────────────────────────────────────

def build_pipeline_graph():
    # C1 FIX: Use TypedDict (PipelineState), not Pydantic model
    graph = StateGraph(PipelineState)

    # Add nodes
    graph.add_node("pii_filter", node_pii_filter)
    graph.add_node("extraction", node_extraction)
    graph.add_node("strategy", node_strategy)
    graph.add_node("evaluate", node_evaluate)
    graph.add_node("persist", node_persist)
    graph.add_node("queue_hitl", node_queue_hitl)
    graph.add_node("dead_letter", node_dead_letter)

    # Entry point
    graph.set_entry_point("pii_filter")

    # Linear edges
    graph.add_edge("pii_filter", "extraction")
    graph.add_edge("strategy", "evaluate")
    graph.add_edge("persist", END)
    graph.add_edge("queue_hitl", END)
    graph.add_edge("dead_letter", END)

    # Conditional: after extraction
    graph.add_conditional_edges(
        "extraction",
        route_after_extraction,
        {
            "repair": "extraction",
            "dead_letter": "dead_letter",
            "strategy": "strategy",
        },
    )

    # Conditional: after RAGAS evaluation
    graph.add_conditional_edges(
        "evaluate",
        route_after_evaluation,
        {
            "approved": "persist",
            "review": "queue_hitl",
        },
    )

    return graph.compile()


# Compiled graph singleton
nimblize_pipeline = build_pipeline_graph()


def run_pipeline(raw_text: str) -> PipelineState:
    """
    Execute the full Nimblize pipeline for a single scraped document.

    Args:
        raw_text: Raw competitor page content.

    Returns:
        Final PipelineState dict after graph execution.
    """
    import uuid
    initial_state: PipelineState = {
        "pipeline_id": str(uuid.uuid4()),
        "raw_text": raw_text,
        "cleaned_text": None,
        "extracted_data": None,
        "strategy_report": None,
        "validation_errors": [],
        "extraction_attempts": 0,
        "ragas_scores": {},
        "status": "PENDING",
        "assigned_evaluator": None,
    }
    # C2 FIX: invoke() returns a dict — return it directly, no Pydantic reconstruction
    return nimblize_pipeline.invoke(initial_state)
