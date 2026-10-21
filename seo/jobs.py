"""Scheduled jobs from guide section 26.

`python -m seo.jobs` records the cadence. A named job runs only when its
credential is present. A missing credential is a failed run, not a zero fill.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

from seo import store
from seo.collectors import CollectionError, fetch_crux, fetch_pagespeed, fetch_search_console

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


def run_job(name: str) -> dict:
    if name == "opportunity_report" or name == "drift_review":
        from seo.pipeline import run
        snapshot = run()
        return {"status": "succeeded", "rows": len(snapshot["opportunities"])}
    if name == "search_console_refresh":
        token = os.getenv("SEO_GSC_ACCESS_TOKEN")
        site = os.getenv("SEO_GSC_SITE_URL")
        if not token or not site:
            _record(name, "failed", "SEO_GSC_ACCESS_TOKEN and SEO_GSC_SITE_URL are required. Previous observations were kept.")
            raise CollectionError("Search Console credentials are not configured")
        end = datetime.now(timezone.utc).date() - timedelta(days=3)
        start = end - timedelta(days=28)
        rows = fetch_search_console(site, token, start.isoformat(), end.isoformat())
        _record(name, "succeeded", "search console page fetched", len(rows))
        return {"status": "succeeded", "rows": len(rows)}
    if name in {"crux_priority", "pagespeed_priority"}:
        key = os.getenv("SEO_GOOGLE_API_KEY")
        target = os.getenv("SEO_PRIORITY_URL")
        if not key or not target:
            _record(name, "failed", "SEO_GOOGLE_API_KEY and SEO_PRIORITY_URL are required. Previous audits were kept.")
            raise CollectionError("PageSpeed/CrUX credentials are not configured")
        if name == "crux_priority":
            payload = fetch_crux(target, key)
        else:
            payload = fetch_pagespeed(target, key)
        _record(name, "succeeded", payload["source"], 1)
        return {"status": "succeeded", "rows": 1, "payload": payload}
    if name == "technical_crawl":
        _record(name, "failed", "Set SEO_CRAWL_URLS to an allowlist before the weekly crawl runs.")
        raise CollectionError("crawl allowlist is empty")
    raise CollectionError(f"unknown job {name}")


def main() -> None:
    for item in SCHEDULE:
        print(f"{item['cadence']:8} {item['name']}")


if __name__ == "__main__":
    main()
