"""Scheduled jobs from guide section 26.

`python -m seo.jobs` records the cadence. A named job runs only when its
credential is present. A missing credential is a failed run, not a zero fill.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse
from urllib.request import urlopen

from seo import store
from seo.collectors import CollectionError, fetch_crux, fetch_pagespeed, fetch_search_console
from seo.config import GSC_SITE_URL
from seo.crawl import FetchError, crawl_allowlist

SCHEDULE = [
    {"name": "search_console_refresh", "cadence": "daily"},
    {"name": "crux_priority", "cadence": "daily"},
    {"name": "pagespeed_priority", "cadence": "daily"},
    {"name": "technical_crawl", "cadence": "weekly"},
    {"name": "opportunity_report", "cadence": "weekly"},
    {"name": "drift_review", "cadence": "monthly"},
]


def _record(job_name: str, status: str, message: str, rows_out: int = 0) -> None:
    now = datetime.now(timezone.utc).isoformat()
    connection = store.connect()
    store.init_db(connection)
    connection.execute(
        "INSERT OR REPLACE INTO pipeline_runs VALUES (?, ?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), job_name, status, now, now, message, rows_out),
    )
    connection.commit()
    connection.close()


def _token(opener: Callable | None = None) -> str:
    refresh = os.getenv("SEO_GSC_REFRESH_TOKEN")
    if refresh:
        client_id = os.getenv("SEO_GSC_CLIENT_ID")
        client_secret = os.getenv("SEO_GSC_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise CollectionError("SEO_GSC_CLIENT_ID and SEO_GSC_CLIENT_SECRET are required with a refresh token")
        from seo.collectors import refresh_google_token
        if opener is None:
            return refresh_google_token(client_id, client_secret, refresh)
        return refresh_google_token(client_id, client_secret, refresh, opener)
    token = os.getenv("SEO_GSC_ACCESS_TOKEN")
    if not token:
        raise CollectionError("Search Console credentials are not configured")
    return token


def _robots_body() -> str | None:
    path = os.getenv("SEO_ROBOTS_TXT_PATH")
    if not path:
        return None
    file = Path(path)
    if not file.is_file():
        raise CollectionError(f"SEO_ROBOTS_TXT_PATH does not exist: {path}")
    return file.read_text(encoding="utf-8")


def run_job(name: str, *, opener: Callable | None = None, fetcher: Callable[..., dict[str, Any]] | None = None) -> dict:
    if name == "opportunity_report" or name == "drift_review":
        connection = store.connect()
        live = store.live_observation_count(connection)
        connection.close()
        if live:
            _record(name, "failed", "Live Search Console rows are stored. The sample rebuild was not run.")
            raise CollectionError("refusing to overwrite live observations with the sample generator")
        from seo.pipeline import run
        snapshot = run()
        return {"status": "succeeded", "rows": len(snapshot["opportunities"])}
    if name == "search_console_refresh":
        site = os.getenv("SEO_GSC_SITE_URL", GSC_SITE_URL).strip()
        if not site:
            _record(name, "failed", "SEO_GSC_SITE_URL is required. Previous observations were kept.")
            raise CollectionError("Search Console site URL is not configured")
        try:
            token = _token(opener)
        except CollectionError as exc:
            _record(name, "failed", str(exc) + " Previous observations were kept.")
            raise
        end = datetime.now(timezone.utc).date() - timedelta(days=3)
        start = end - timedelta(days=28)
        try:
            fetched = fetch_search_console(
                site,
                token,
                start.isoformat(),
                end.isoformat(),
                os.getenv("SEO_PRIMARY_COUNTRY", "usa"),
                opener=opener or urlopen,
            )
        except CollectionError as exc:
            _record(name, "failed", str(exc) + " Previous observations were kept.")
            raise
        collected_at = datetime.now(timezone.utc).isoformat()
        for row in fetched:
            row["collected_at"] = collected_at
        run_id = "gsc-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        connection = store.connect()
        result = store.ingest_search_console(connection, fetched, run_id, site)
        connection.close()
        _record(name, "succeeded", "search console rows upserted", result["kept"])
        return {"status": "succeeded", **result}
    if name in {"crux_priority", "pagespeed_priority"}:
        key = os.getenv("SEO_GOOGLE_API_KEY")
        target = os.getenv("SEO_PRIORITY_URL")
        if not key or not target:
            _record(name, "failed", "SEO_GOOGLE_API_KEY and SEO_PRIORITY_URL are required. Previous audits were kept.")
            raise CollectionError("PageSpeed/CrUX credentials are not configured")
        fetch = fetch_crux if name == "crux_priority" else fetch_pagespeed
        try:
            payload = fetch(target, key, opener=opener) if opener else fetch(target, key)
        except CollectionError as exc:
            _record(name, "failed", str(exc) + " Previous audits were kept.")
            raise
        connection = store.connect()
        if name == "crux_priority":
            store.record_audit(connection, target, {
                "lcp_ms": payload.get("lcp_ms"),
                "inp_ms": payload.get("inp_ms"),
                "cls": payload.get("cls"),
                "vitals_source": "crux",
            })
        else:
            store.record_audit(connection, target, {
                "performance_score": payload.get("performance_score"),
                "seo_score": payload.get("seo_score"),
                "accessibility_score": payload.get("accessibility_score"),
                "vitals_source": "pagespeed",
            })
        connection.close()
        _record(name, "succeeded", payload["source"], 1)
        return {"status": "succeeded", "rows": 1, "payload": payload}
    if name == "technical_crawl":
        urls = [item.strip() for item in os.getenv("SEO_CRAWL_URLS", "").split(",") if item.strip()]
        if not urls:
            _record(name, "failed", "Set SEO_CRAWL_URLS to an allowlist before the weekly crawl runs.")
            raise CollectionError("crawl allowlist is empty")
        try:
            robots_txt = _robots_body()
            crawled = crawl_allowlist(urls, robots_txt, fetcher)
        except (CollectionError, FetchError) as exc:
            _record(name, "failed", str(exc) + " Previous audits were kept.")
            raise CollectionError(str(exc)) from exc
        connection = store.connect()
        kept = 0
        for item in crawled:
            if item.get("skipped") == "robots":
                store.record_audit(connection, item["url"], {"indexable": False, "robots": "disallow", "vitals_source": "robots"})
                continue
            if item.get("skipped"):
                continue
            host = urlparse(item["url"]).netloc
            internal = sum(1 for link in item.get("links") or [] if urlparse(link).netloc in ("", host))
            store.record_audit(connection, item["url"], {
                "status": item.get("status"),
                "indexable": item.get("indexable"),
                "canonical": item.get("canonical") or None,
                "title": item.get("title") or None,
                "h1": item.get("h1") or None,
                "robots": item.get("robots") or None,
                "internal_links": internal,
                "word_count": item.get("word_count"),
                "jsonld_count": item.get("jsonld_count"),
                "vitals_source": "crawl",
            })
            kept += 1
        connection.close()
        _record(name, "succeeded", "allowlisted crawl stored", kept)
        return {"status": "succeeded", "rows": kept}
    raise CollectionError(f"unknown job {name}")


def main() -> None:
    for item in SCHEDULE:
        print(f"{item['cadence']:8} {item['name']}")


if __name__ == "__main__":
    main()
