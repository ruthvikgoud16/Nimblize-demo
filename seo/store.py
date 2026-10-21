"""SQLite store for the clone-and-run path.

The table list is the production schema. This module speaks SQLite so a
checkout runs without a database server. Point a Postgres migration at these
tables before exposing the API; do not reuse the old app's SQLite fallback.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
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
    performance_score REAL,
    seo_score REAL,
    accessibility_score REAL,
    vitals_source TEXT,
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
CREATE TABLE IF NOT EXISTS recommendation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    recorded_at TEXT NOT NULL
);
"""


def db_path() -> Path:
    return Path(os.environ.get("SEO_DB_PATH", ROOT / "data" / "nimblize_seo.db"))


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db(connection: sqlite3.Connection) -> None:
    connection.executescript(SCHEMA)
    present = {row["name"] for row in connection.execute("PRAGMA table_info(technical_audits)")}
    for name, kind in (
        ("performance_score", "REAL"),
        ("seo_score", "REAL"),
        ("accessibility_score", "REAL"),
        ("vitals_source", "TEXT"),
    ):
        if name not in present:
            connection.execute(f"ALTER TABLE technical_audits ADD COLUMN {name} {kind}")
    connection.commit()


def replace_snapshot(connection: sqlite3.Connection, snapshot: dict[str, Any]) -> None:
    init_db(connection)
    if live_observation_count(connection):
        raise RuntimeError("refusing to overwrite live Search Console observations with the sample generator")
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


def ingest_search_console(connection: sqlite3.Connection, collected: list[dict[str, Any]], run_id: str, site_url: str) -> dict[str, int]:
    """Upsert a successful Search Console pull. Callers must not call this after a failed pull."""
    from urllib.parse import urlparse

    from seo.validate import normalize_url, validate_observations

    init_db(connection)
    host = urlparse(site_url).netloc or site_url
    connection.execute(
        "INSERT OR IGNORE INTO sites (id, domain, url, primary_country) VALUES (?, ?, ?, ?)",
        ("site-live", host, site_url, os.getenv("SEO_PRIMARY_COUNTRY", "usa")),
    )
    prepared = []
    for row in collected:
        keyword = (row.get("keyword") or "").strip()
        url = row.get("url") or ""
        if not keyword or not url or not row.get("obs_date"):
            continue
        normalized = normalize_url(url)
        prepared.append({
            "keyword_id": "kw-" + _slug(keyword),
            "keyword": keyword,
            "page_id": "page-" + _digest(normalized),
            "url": normalized,
            "obs_date": row["obs_date"],
            "device": row.get("device") or "MOBILE",
            "country": (row.get("country") or "usa").lower(),
            "search_type": row.get("search_type") or "web",
            "position": row.get("position"),
            "clicks": row.get("clicks"),
            "impressions": row.get("impressions"),
            "ctr": row.get("ctr"),
            "source": "search-console",
            "collected_at": row.get("collected_at"),
        })
    kept, quarantined = validate_observations(prepared)
    for row in kept:
        connection.execute(
            "INSERT OR IGNORE INTO keywords (id, text, intent, business_relevance, difficulty, volume) VALUES (?, ?, ?, ?, ?, ?)",
            (row["keyword_id"], row["keyword"], "unknown", 0.5, None, None),
        )
        connection.execute(
            "INSERT OR IGNORE INTO pages (id, site_id, url, title) VALUES (?, ?, ?, ?)",
            (row["page_id"], "site-live", row["url"], None),
        )
        connection.execute(
            """INSERT INTO observations
            (keyword_id, page_id, url, obs_date, device, country, search_type, position, clicks, impressions, ctr, source, collected_at, run_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(keyword_id, page_id, obs_date, device, country, search_type)
            DO UPDATE SET position=excluded.position, clicks=excluded.clicks, impressions=excluded.impressions,
            ctr=excluded.ctr, source=excluded.source, collected_at=excluded.collected_at, run_id=excluded.run_id""",
            (
                row["keyword_id"], row["page_id"], row["url"], row["obs_date"], row["device"], row["country"],
                row["search_type"], row["position"], row["clicks"], row["impressions"], row["ctr"],
                row["source"], row["collected_at"], run_id,
            ),
        )
    connection.commit()
    return {"kept": len(kept), "quarantined": len(quarantined)}


def live_observation_count(connection: sqlite3.Connection) -> int:
    init_db(connection)
    return int(connection.execute("SELECT COUNT(*) AS n FROM observations WHERE source = 'search-console'").fetchone()["n"])


def _slug(text: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:80] or "unknown"


def _digest(text: str) -> str:
    import hashlib
    return hashlib.sha1(text.encode()).hexdigest()[:12]


_AUDIT_FIELDS = (
    "status",
    "indexable",
    "canonical",
    "title",
    "h1",
    "robots",
    "lcp_ms",
    "inp_ms",
    "cls",
    "internal_links",
    "word_count",
    "jsonld_count",
    "performance_score",
    "seo_score",
    "accessibility_score",
    "vitals_source",
)


def _ensure_live_page(connection: sqlite3.Connection, url: str) -> tuple[str, str]:
    from urllib.parse import urlparse

    from seo.validate import normalize_url

    normalized = normalize_url(url)
    host = urlparse(normalized).netloc or "live"
    connection.execute(
        "INSERT OR IGNORE INTO sites (id, domain, url, primary_country) VALUES (?, ?, ?, ?)",
        ("site-live", host, f"https://{host}/", os.getenv("SEO_PRIMARY_COUNTRY", "usa")),
    )
    page_id = "page-" + _digest(normalized)
    connection.execute(
        "INSERT OR IGNORE INTO pages (id, site_id, url, title) VALUES (?, ?, ?, ?)",
        (page_id, "site-live", normalized, None),
    )
    return page_id, normalized


def record_audit(connection: sqlite3.Connection, url: str, fields: dict[str, Any], audited_at: str | None = None) -> str:
    """Merge one day's audit. Fields the caller omits stay as they were."""
    init_db(connection)
    page_id, _normalized = _ensure_live_page(connection, url)
    day = audited_at or datetime.now(timezone.utc).date().isoformat()
    incoming = {key: value for key, value in fields.items() if key in _AUDIT_FIELDS and value is not None}
    if "indexable" in incoming:
        incoming["indexable"] = int(bool(incoming["indexable"]))
    existing = connection.execute(
        "SELECT * FROM technical_audits WHERE page_id = ? AND audited_at = ?",
        (page_id, day),
    ).fetchone()
    if existing is not None and incoming.get("vitals_source") and existing["vitals_source"] not in (None, "", incoming["vitals_source"]):
        incoming["vitals_source"] = f"{existing['vitals_source']}+{incoming['vitals_source']}"
    if existing is None:
        payload = {name: None for name in _AUDIT_FIELDS}
        payload.update(incoming)
        payload["page_id"] = page_id
        payload["audited_at"] = day
        columns = ["page_id", "audited_at", *_AUDIT_FIELDS]
        connection.execute(
            f"INSERT INTO technical_audits ({', '.join(columns)}) VALUES ({', '.join('?' for _ in columns)})",
            tuple(payload[column] for column in columns),
        )
    elif incoming:
        assignments = ", ".join(f"{key} = ?" for key in incoming)
        connection.execute(
            f"UPDATE technical_audits SET {assignments} WHERE page_id = ? AND audited_at = ?",
            tuple(incoming[key] for key in incoming) + (page_id, day),
        )
    if incoming.get("title"):
        connection.execute(
            "UPDATE pages SET title = ? WHERE id = ? AND (title IS NULL OR title = '')",
            (incoming["title"], page_id),
        )
    connection.commit()
    return page_id


def record_recommendation_event(connection: sqlite3.Connection, recommendation_id: str, from_status: str | None, to_status: str) -> None:
    init_db(connection)
    connection.execute(
        "INSERT INTO recommendation_events (recommendation_id, from_status, to_status, recorded_at) VALUES (?, ?, ?, ?)",
        (recommendation_id, from_status, to_status, datetime.now(timezone.utc).isoformat()),
    )
    connection.commit()
