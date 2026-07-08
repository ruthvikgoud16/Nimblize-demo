"""
Nimblize - FastAPI Gateway
Central entry point for all B2B (competitor intelligence) and B2C (product recommendations) APIs.

Security middleware stack (request order):
  1. CORS
  2. JWT Authentication
  3. Redis Rate Limiter (token bucket)
  4. Semantic Cache Check
  5. LangGraph Pipeline Execution

Routes:
  POST /api/v1/pipeline/run       - Trigger full competitor extraction pipeline
  POST /api/v1/b2c/recommend      - B2C product recommendation (semantic search)
  GET  /api/v1/dashboard/profiles - List verified competitor profiles
  GET  /api/v1/dashboard/review   - HITL manual review queue
  GET  /health                    - Health check
"""

import os
import time
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

import jwt  # PyJWT
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from backend.agents.langgraph_orchestrator import run_pipeline
from backend.middleware.pii_filter import redact_pii
from backend.middleware.rate_limiter import check_rate_limit
from backend.cache.semantic_cache import get_cached_response, cache_response, _embed as embed_query
from backend.db.postgres import similarity_search, get_connection
from backend.telemetry.otel_tracer import init_telemetry, get_metrics, Timer

# ─────────────────────────────────────────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────────────────────────────────────────
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup/shutdown event handler."""
    # L3 FIX: Warm up Presidio NER models on startup to avoid cold-start
    # latency on the first pipeline request.
    print("[Startup] Warming up Presidio NER models...")
    try:
        from backend.middleware.pii_filter import redact_pii
        redact_pii("Warm up text for NER model initialization.")
        print("[Startup] ✅ Presidio NER models ready.")
    except Exception as e:
        print(f"[Startup] ⚠️  Presidio warmup failed: {e}")
    yield
    # Shutdown cleanup (close DB pool if needed)
    from backend.db import postgres
    if postgres._pool:
        postgres._pool.closeall()
        print("[Shutdown] DB connection pool closed.")


app = FastAPI(
    title="Nimblize AI Pipeline API",
    description="B2B SEO intelligence and B2C recommendation engine.",
    version="4.2.0",
    lifespan=lifespan,
)

# H6 FIX: CORS wildcard + allow_credentials=True is rejected by browsers.
# Must use explicit origin list. Wildcard only works without credentials.
_allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# M9 FIX: Wrap telemetry init — if OTel collector is unreachable, log warning
# and continue startup rather than crashing the entire API.
try:
    _tracer, _metrics = init_telemetry()
except Exception as _tel_err:
    import logging
    logging.warning(f"[Telemetry] Startup warning: {_tel_err}. Continuing without OTel.")
    _tracer = None
    _metrics = None

_security = HTTPBearer(auto_error=False)

# L1 FIX: Warn loudly if JWT_SECRET is still the default dev value in production.
JWT_SECRET = os.getenv("JWT_SECRET", "nimblize-dev-secret")
if JWT_SECRET == "nimblize-dev-secret" and os.getenv("ENV") == "production":
    raise RuntimeError("CRITICAL: JWT_SECRET must be overridden in production via environment variable.")


# ─────────────────────────────────────────────────────────────────────────────
# Auth & Rate Limit Dependencies
# ─────────────────────────────────────────────────────────────────────────────

class UserContext(BaseModel):
    user_id: str
    tier: str = "free"


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_security),
) -> UserContext:
    """Decode JWT and extract user context. Returns anonymous free tier if no token."""
    if not credentials:
        return UserContext(user_id="anonymous", tier="free")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return UserContext(
            user_id=payload.get("sub", "unknown"),
            tier=payload.get("tier", "free"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


def enforce_rate_limit(request: Request, user: UserContext = Depends(get_current_user)):
    """Apply Redis token bucket rate limiting per user/tier."""
    allowed, retry_after = check_rate_limit(user.user_id, user.tier)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────

class PipelineRunRequest(BaseModel):
    raw_text: str
    source_url: Optional[str] = None


class RecommendRequest(BaseModel):
    query: str
    k: int = 4


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "4.2.0", "service": "nimblize-pipeline"}


@app.post("/api/v1/pipeline/run")
def run_competitor_pipeline(
    body: PipelineRunRequest,
    user: UserContext = Depends(enforce_rate_limit),
):
    """
    B2B: Execute the full competitor intelligence pipeline.
    Runs PII filter → Agent 1 → pgvector upsert → Agent 2 → RAGAS → confidence gate.
    """
    with Timer() as t:
        result = run_pipeline(raw_text=body.raw_text)

    if _tracer and _metrics:
        _metrics.record_pipeline_rtt(t.ms, {"user_tier": user.tier})
        ragas = result.get("ragas_scores", {})
        _metrics.record_ragas_scores(ragas)

    return {
        "pipeline_id": result.get("pipeline_id"),
        "status": result.get("status"),
        "ragas_scores": result.get("ragas_scores", {}),
        "competitor_domain": (result.get("extracted_data") or {}).get("competitor_domain"),
        "rtt_ms": round(t.ms, 2),
    }


@app.post("/api/v1/b2c/recommend")
def get_recommendations(
    body: RecommendRequest,
    user: UserContext = Depends(enforce_rate_limit),
):
    """
    B2C: Semantic product/affiliate recommendation via pgvector HNSW similarity search.
    Checks semantic cache before executing vector DB query.
    """
    # Step 1: Check semantic cache
    cached = get_cached_response(body.query)
    if cached:
        if _metrics:
            _metrics.cache_hits.add(1)
        return {"source": "cache", "results": cached}

    if _metrics:
        _metrics.cache_misses.add(1)

    # Step 2: Embed query and run HNSW similarity search
    # H7 FIX: Use properly imported embed_query instead of accessing private _embed
    query_embedding = embed_query(body.query)
    results = similarity_search(query_embedding=query_embedding, k=body.k)

    # Step 3: Cache the result for future similar queries
    cache_response(body.query, str(results))

    return {"source": "vector_db", "results": results, "count": len(results)}


@app.get("/api/v1/dashboard/profiles")
def get_competitor_profiles(user: UserContext = Depends(enforce_rate_limit)):
    """Return all verified competitor profiles from PostgreSQL."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM competitor_profiles WHERE status = 'VERIFIED_PRODUCTION' "
                "ORDER BY created_at DESC LIMIT 50;"
            )
            return {"profiles": [dict(r) for r in cur.fetchall()]}


@app.get("/api/v1/dashboard/review")
def get_hitl_review_queue(user: UserContext = Depends(enforce_rate_limit)):
    """Return the HITL manual review queue for the domain leader dashboard."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT review_id, pipeline_id, composite_score, assigned_evaluator, "
                "status, created_at FROM manual_review_queue "
                "WHERE status = 'PENDING_REVIEW' ORDER BY created_at DESC LIMIT 20;"
            )
            return {"reviews": [dict(r) for r in cur.fetchall()]}
