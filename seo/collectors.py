"""Live collectors. A failed call raises. It does not invent zero-value rows."""

from __future__ import annotations

import json
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen


class CollectionError(RuntimeError):
    pass


def refresh_google_token(client_id: str, client_secret: str, refresh_token: str, opener: Callable = urlopen) -> str:
    """Exchange a long-lived refresh token. A failed exchange raises and writes nothing."""
    payload = _request(
        "https://oauth2.googleapis.com/token",
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        {},
        opener,
        form=True,
    )
    token = payload.get("access_token")
    if not token:
        raise CollectionError("Google token response did not include an access token")
    return str(token)


def _request(url: str, payload: dict | None, headers: dict[str, str], opener: Callable = urlopen, form: bool = False) -> dict:
    if payload is None:
        data = None
    elif form:
        data = urlencode(payload).encode()
        headers = {**headers, "Content-Type": "application/x-www-form-urlencoded"}
    else:
        data = json.dumps(payload).encode()
    request = Request(url, data=data, headers=headers)
    try:
        with opener(request, timeout=60) as response:
            raw = response.read().decode()
            status = getattr(response, "status", 200)
    except HTTPError as exc:
        raise CollectionError(f"{url} returned {exc.code}") from exc
    except URLError as exc:
        raise CollectionError(f"{url} unreachable") from exc
    if status >= 400:
        raise CollectionError(f"{url} returned {status}")
    return json.loads(raw or "{}")


def fetch_search_console(
    site_url: str,
    access_token: str,
    start_date: str,
    end_date: str,
    country: str = "usa",
    opener: Callable = urlopen,
) -> list[dict[str, Any]]:
    """Guide section 23. Dimensions include device and country so the label is not mixed."""
    endpoint = (
        "https://www.googleapis.com/webmasters/v3/sites/"
        + quote(site_url, safe="")
        + "/searchAnalytics/query"
    )
    rows: list[dict[str, Any]] = []
    start_row = 0
    while True:
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["date", "query", "page", "device", "country"],
            "type": "web",
            "rowLimit": 25000,
            "startRow": start_row,
            "dimensionFilterGroups": [{
                "groupType": "and",
                "filters": [
                    {"dimension": "country", "operator": "equals", "expression": country},
                    {"dimension": "device", "operator": "equals", "expression": "MOBILE"},
                ],
            }],
        }
        payload = _request(
            endpoint,
            body,
            {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            opener,
        )
        batch = payload.get("rows") or []
        for row in batch:
            keys = row.get("keys") or []
            impressions = row.get("impressions")
            clicks = row.get("clicks")
            rows.append({
                "obs_date": keys[0] if len(keys) > 0 else None,
                "keyword": keys[1] if len(keys) > 1 else None,
                "url": keys[2] if len(keys) > 2 else None,
                "device": keys[3] if len(keys) > 3 else None,
                "country": keys[4] if len(keys) > 4 else None,
                "search_type": "web",
                "clicks": clicks,
                "impressions": impressions,
                "ctr": row.get("ctr") if impressions else None,
                "position": row.get("position"),
                "source": "search-console",
            })
        if len(batch) < 25000:
            return rows
        start_row += 25000


def fetch_pagespeed(target_url: str, api_key: str, strategy: str = "mobile", opener: Callable = urlopen) -> dict[str, Any]:
    params = [("url", target_url), ("strategy", strategy), ("key", api_key)]
    for category in ("performance", "seo", "accessibility"):
        params.append(("category", category))
    endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + urlencode(params)
    payload = _request(endpoint, None, {}, opener)
    categories = (((payload.get("lighthouseResult") or {}).get("categories")) or {})
    return {
        "url": target_url,
        "strategy": strategy,
        "source": "pagespeed-insights",
        "performance_score": ((categories.get("performance") or {}).get("score")),
        "seo_score": ((categories.get("seo") or {}).get("score")),
        "accessibility_score": ((categories.get("accessibility") or {}).get("score")),
    }


def fetch_crux(target_url: str, api_key: str, opener: Callable = urlopen) -> dict[str, Any]:
    endpoint = "https://chromeuxreport.googleapis.com/v1/records:queryRecord?" + urlencode({"key": api_key})
    payload = _request(endpoint, {"url": target_url, "formFactor": "PHONE"}, {"Content-Type": "application/json"}, opener)
    metrics = ((payload.get("record") or {}).get("metrics")) or {}

    def p75(name: str) -> float | None:
        metric = metrics.get(name) or {}
        percentiles = metric.get("percentiles") or {}
        return percentiles.get("p75")

    return {
        "url": target_url,
        "source": "crux",
        "form_factor": "PHONE",
        "lcp_ms": p75("largest_contentful_paint"),
        "inp_ms": p75("interaction_to_next_paint"),
        "cls": p75("cumulative_layout_shift"),
    }
