"""FastAPI surface from guide section 24, mounted at /api/seo."""

from __future__ import annotations

import json
import os
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from seo import store
from seo.pipeline import run

app = FastAPI(title="Nimblize SEO Intelligence", version="7.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("SEO_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _guard(authorization: str | None) -> None:
    token = os.getenv("SEO_API_TOKEN")
    if os.getenv("ENV") == "production" and not token:
        raise HTTPException(status_code=500, detail="SEO_API_TOKEN must be set when ENV=production.")
    if token and authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="Missing or invalid bearer token.")


def _db():
    if not store.DB_PATH.exists():
        run()
    connection = store.connect()
    store.init_db(connection)
    if connection.execute("SELECT COUNT(*) AS n FROM opportunities").fetchone()["n"] == 0:
        connection.close()
        run()
        connection = store.connect()
    return connection


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "nimblize-seo", "version": "7.0.0"}


@app.get("/api/seo/sites/{site_id}/overview")
def overview(site_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        site = connection.execute("SELECT * FROM sites WHERE id = ?", (site_id,)).fetchone()
        if site is None:
            raise HTTPException(status_code=404, detail="Unknown site.")
        model = connection.execute("SELECT * FROM models").fetchone()
        counts = {
            "opportunities": connection.execute("SELECT COUNT(*) AS n FROM opportunities").fetchone()["n"],
            "experiments": connection.execute("SELECT COUNT(*) AS n FROM experiments").fetchone()["n"],
            "observations": connection.execute("SELECT COUNT(*) AS n FROM observations").fetchone()["n"],
        }
        return {"site": dict(site), "model": dict(model) if model else None, "counts": counts}
    finally:
        connection.close()


@app.get("/api/seo/keywords/opportunities")
def opportunities(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        items = store.rows(connection, "SELECT * FROM opportunities")
        items.sort(key=lambda item: ({"P0": 0, "P1": 1, "P2": 2, "P3": 3}[item["priority"]], -item["opportunity_score"]))
        for item in items:
            item.pop("evidence_json", None)
        return {"opportunities": items}
    finally:
        connection.close()


@app.get("/api/seo/pages/{page_id}/audit")
def audit(page_id: str, keyword_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        row = connection.execute(
            "SELECT * FROM opportunities WHERE page_id = ? AND keyword_id = ?",
            (page_id, keyword_id),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="No opportunity for that page and keyword.")
        payload = dict(row)
        payload["evidence"] = json.loads(payload.pop("evidence_json"))
        return payload
    finally:
        connection.close()


@app.post("/api/seo/predictions/ranking")
def predict(body: dict[str, str], authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """Inference only. This route does not crawl or train."""
    _guard(authorization)
    connection = _db()
    try:
        row = connection.execute(
            "SELECT * FROM opportunities WHERE page_id = ? AND keyword_id = ?",
            (body.get("page_id"), body.get("keyword_id")),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="No scored row for that page and keyword.")
        model = connection.execute("SELECT * FROM models").fetchone()
        return {
            "page_id": row["page_id"],
            "keyword_id": row["keyword_id"],
            "probability": row["probability"],
            "confidence": row["confidence"],
            "model_version": model["version"],
            "feature_version": model["feature_version"],
        }
    finally:
        connection.close()


@app.get("/api/seo/recommendations")
def recommendations(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        items = store.rows(
            connection,
            "SELECT id, keyword, url, priority, bottleneck, action, effort, status FROM opportunities",
        )
        return {"recommendations": items}
    finally:
        connection.close()


@app.post("/api/seo/recommendations/{recommendation_id}/complete")
def complete(recommendation_id: str, authorization: str | None = Header(default=None)) -> dict[str, str]:
    _guard(authorization)
    connection = _db()
    try:
        found = connection.execute("SELECT id, status FROM opportunities WHERE id = ?", (recommendation_id,)).fetchone()
        if found is None:
            raise HTTPException(status_code=404, detail="Unknown recommendation.")
        connection.execute("UPDATE opportunities SET status = ? WHERE id = ?", ("Implemented", recommendation_id))
        connection.commit()
        return {"id": recommendation_id, "status": "Implemented", "previous": found["status"]}
    finally:
        connection.close()


@app.get("/api/seo/experiments")
def experiments(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        return {"experiments": store.rows(connection, "SELECT * FROM experiments")}
    finally:
        connection.close()


@app.get("/api/seo/models/current")
def current_model(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _guard(authorization)
    connection = _db()
    try:
        model = connection.execute("SELECT * FROM models").fetchone()
        drift = store.rows(connection, "SELECT * FROM drift")
        runs = store.rows(connection, "SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT 10")
        payload = dict(model)
        payload["metrics"] = json.loads(payload.pop("metrics_json"))
        payload["drift"] = drift
        payload["runs"] = runs
        return payload
    finally:
        connection.close()
