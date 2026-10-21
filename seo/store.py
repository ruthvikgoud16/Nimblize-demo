"""SQLite store for the clone-and-run path.

The table list is the production schema. This module speaks SQLite so a
checkout runs without a database server. Point a Postgres migration at these
tables before exposing the API; do not reuse the old app's SQLite fallback.
"""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("SEO_DB_PATH", ROOT / "data" / "nimblize_seo.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    primary_country TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    title TEXT
);
CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL UNIQUE,
    intent TEXT,
    business_relevance REAL,
    difficulty REAL,
    volume REAL
);
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    url TEXT NOT NULL,
    obs_date TEXT NOT NULL,
    device TEXT NOT NULL,
    country TEXT NOT NULL,
    search_type TEXT NOT NULL,
    position REAL,
    clicks INTEGER,
    impressions INTEGER,
    ctr REAL,
    source TEXT NOT NULL,
    collected_at TEXT,
    run_id TEXT,
    UNIQUE (keyword_id, page_id, obs_date, device, country, search_type)
);
CREATE TABLE IF NOT EXISTS technical_audits (
    page_id TEXT NOT NULL,
    audited_at TEXT NOT NULL,
    status INTEGER,
    indexable INTEGER,
    canonical TEXT,
    title TEXT,
    h1 TEXT,
    robots TEXT,
    lcp_ms REAL,
    inp_ms REAL,
    cls REAL,
    internal_links INTEGER,
    word_count INTEGER,
    jsonld_count INTEGER,
    PRIMARY KEY (page_id, audited_at)
);
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    keyword_id TEXT,
    keyword TEXT,
    page_id TEXT,
    url TEXT,
    position REAL,
    impressions REAL,
    ctr REAL,
    probability REAL,
    model_free_score REAL,
    opportunity_score REAL,
    confidence REAL,
    priority TEXT,
    bottleneck TEXT,
    action TEXT,
    effort REAL,
    status TEXT,
    evidence_json TEXT
);
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    keyword_id TEXT,
    page_id TEXT,
    url TEXT,
    keyword TEXT,
    change_date TEXT,
    change_type TEXT,
    old_version TEXT,
    new_version TEXT,
    reason TEXT,
    owner TEXT,
    expected_outcome TEXT,
    position_before REAL,
    position_after REAL,
    clicks_before INTEGER,
    clicks_after INTEGER,
    result_kind TEXT
);
CREATE TABLE IF NOT EXISTS models (
    version TEXT PRIMARY KEY,
    feature_version TEXT,
    serving_name TEXT,
    promoted_boosting INTEGER,
    trained_through TEXT,
    metrics_json TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id TEXT PRIMARY KEY,
    job_name TEXT,
    status TEXT,
    started_at TEXT,
    finished_at TEXT,
    message TEXT,
    rows_out INTEGER
);
CREATE TABLE IF NOT EXISTS drift (
    feature TEXT PRIMARY KEY,
    train_median REAL,
    recent_median REAL,
    relative_change REAL,
    flagged INTEGER
);
"""


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db(connection: sqlite3.Connection) -> None:
    connection.executescript(SCHEMA)
    connection.commit()


def replace_snapshot(connection: sqlite3.Connection, snapshot: dict[str, Any]) -> None:
    init_db(connection)
    for table in ("opportunities", "experiments", "models", "drift", "pages", "keywords", "sites", "technical_audits", "observations"):
        connection.execute(f"DELETE FROM {table}")
    site = snapshot["site"]
    connection.execute(
        "INSERT INTO sites (id, domain, url, primary_country) VALUES (?, ?, ?, ?)",
        (site["id"], site["domain"], site["url"], site["primary_country"]),
    )
    for page in snapshot["pages"]:
        connection.execute(
            "INSERT INTO pages (id, site_id, url, title) VALUES (?, ?, ?, ?)",
            (page["id"], site["id"], page["url"], page["title"]),
        )
    for keyword in snapshot["keywords"]:
        connection.execute(
            "INSERT INTO keywords (id, text, intent, business_relevance, difficulty, volume) VALUES (?, ?, ?, ?, ?, ?)",
            (keyword["id"], keyword["text"], keyword["intent"], keyword["business_relevance"], keyword["difficulty"], keyword["volume"]),
        )
    for row in snapshot["observations"]:
        connection.execute(
            """INSERT INTO observations
            (keyword_id, page_id, url, obs_date, device, country, search_type, position, clicks, impressions, ctr, source, collected_at, run_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                row["keyword_id"], row["page_id"], row["url"], row["obs_date"], row["device"], row["country"],
                row["search_type"], row["position"], row["clicks"], row["impressions"], row["ctr"],
                row["source"], row["collected_at"], snapshot["run_id"],
            ),
        )
    for audit in snapshot["audits_latest"]:
        connection.execute(
            """INSERT INTO technical_audits
            (page_id, audited_at, status, indexable, canonical, title, h1, robots, lcp_ms, inp_ms, cls, internal_links, word_count, jsonld_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                audit["page_id"], audit["audited_at"], audit["status"], int(audit["indexable"]), audit["canonical"],
                audit["title"], audit["h1"], audit.get("robots", ""), audit["lcp_ms"], audit["inp_ms"], audit["cls"],
                audit["internal_links"], audit["word_count"], audit.get("jsonld_count", 0),
            ),
        )
    for item in snapshot["opportunities"]:
        connection.execute(
            """INSERT INTO opportunities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item["id"], item["keyword_id"], item["keyword"], item["page_id"], item["url"], item["position"],
                item["impressions"], item["ctr"], item["probability"], item["model_free_score"], item["opportunity_score"],
                item["confidence"], item["priority"], item["bottleneck"], item["action"], item["effort"], item["status"],
                json.dumps(item["evidence"]),
            ),
        )
    for item in snapshot["experiments"]:
        connection.execute(
            """INSERT INTO experiments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item["id"], item["keyword_id"], item["page_id"], item["url"], item["keyword"], item["change_date"],
                item["change_type"], item["old_version"], item["new_version"], item["reason"], item["owner"],
                item["expected_outcome"], item["position_before"], item["position_after"], item["clicks_before"],
                item["clicks_after"], item["result_kind"],
            ),
        )
    model = snapshot["model"]
    connection.execute(
        "INSERT INTO models VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            model["version"], model["feature_version"], model["serving_name"], int(model["promoted_boosting"]),
            model["trained_through"], json.dumps(model["metrics"]), model["created_at"],
        ),
    )
    for row in snapshot["drift"]:
        connection.execute(
            "INSERT INTO drift VALUES (?, ?, ?, ?, ?)",
            (row["feature"], row["train_median"], row["recent_median"], row["relative_change"], int(row["flagged"])),
        )
    connection.execute(
        "INSERT OR REPLACE INTO pipeline_runs VALUES (?, ?, ?, ?, ?, ?, ?)",
        (snapshot["run_id"], "sample-pipeline", "succeeded", snapshot["started_at"], snapshot["finished_at"], "sample property rebuilt", len(snapshot["opportunities"])),
    )
    connection.commit()


def rows(connection: sqlite3.Connection, sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    return [dict(row) for row in connection.execute(sql, params).fetchall()]
