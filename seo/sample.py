"""Deterministic sample property.

The generator is the dataset a developer inspects when no Search Console
credential is configured. Live collection never writes this file over a failure.
"""

from __future__ import annotations

import math
import random
from datetime import date, timedelta
from typing import Any

SITE_ID = "site-nimblize"
SITE_URL = "https://www.nimblize.ai/"
END = date(2026, 10, 12)

PAGES: list[dict[str, Any]] = [
    {
        "id": "page-platform",
        "url": "https://www.nimblize.ai/platform",
        "title": "Nimblize Platform",
        "h1": "The Nimblize platform",
        "quality": 0.62,
        "indexable": True,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 2,
        "ref_domains": 18,
        "lcp_ms": 2200,
        "inp_ms": 170,
        "cls": 0.06,
        "word_count": 860,
        "body": (
            "Nimblize is an AI automation platform for operations teams. "
            "The platform coordinates workflows, human approval, and reporting."
        ),
    },
    {
        "id": "page-blog",
        "url": "https://www.nimblize.ai/blog/ai-automation",
        "title": "What is an AI automation platform?",
        "h1": "AI automation platform explained",
        "quality": 0.48,
        "indexable": True,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 4,
        "ref_domains": 9,
        "lcp_ms": 1900,
        "inp_ms": 140,
        "cls": 0.04,
        "word_count": 1200,
        "body": (
            "An AI automation platform connects business workflows. "
            "This guide explains evaluation, rollout, and measurement."
        ),
    },
    {
        "id": "page-product",
        "url": "https://www.nimblize.ai/product/competitor-intelligence",
        "title": "Competitor intelligence software",
        "h1": "Competitor intelligence software",
        "quality": 0.57,
        "indexable": True,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 1,
        "ref_domains": 11,
        "lcp_ms": 2000,
        "inp_ms": 150,
        "cls": 0.05,
        "word_count": 540,
        "body": "Competitor intelligence software for tracking rival pages and keywords.",
    },
    {
        "id": "page-docs",
        "url": "https://www.nimblize.ai/docs/search-console",
        "title": "Search Console setup",
        "h1": "Search Console opportunity queue",
        "quality": 0.7,
        "indexable": False,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 5,
        "ref_domains": 4,
        "lcp_ms": 1600,
        "inp_ms": 120,
        "cls": 0.02,
        "word_count": 700,
        "body": "How the Search Console opportunity queue is measured and reviewed.",
    },
    {
        "id": "page-compare",
        "url": "https://www.nimblize.ai/compare/speed",
        "title": "SEO ranking prediction",
        "h1": "SEO ranking prediction",
        "quality": 0.5,
        "indexable": True,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 6,
        "ref_domains": 22,
        "lcp_ms": 4300,
        "inp_ms": 540,
        "cls": 0.22,
        "word_count": 980,
        "body": (
            "SEO ranking prediction using Search Console history, technical health, "
            "and content coverage. Includes methodology, limits, and evaluation."
        ),
    },
    {
        "id": "page-customers",
        "url": "https://www.nimblize.ai/customers",
        "title": "Customer stories",
        "h1": "Customer stories",
        "quality": 0.35,
        "indexable": True,
        "status": 200,
        "robots_blocked": False,
        "internal_links": 0,
        "ref_domains": 7,
        "lcp_ms": 1800,
        "inp_ms": 130,
        "cls": 0.03,
        "word_count": 400,
        "body": "Stories from operations teams using Nimblize.",
    },
]

KEYWORDS: list[dict[str, Any]] = [
    {"id": "kw-ai", "text": "ai automation platform", "intent": "commercial", "business_relevance": 0.92, "difficulty": 46, "volume": 2400},
    {"id": "kw-ci", "text": "competitor intelligence software", "intent": "commercial", "business_relevance": 0.88, "difficulty": 51, "volume": 1800},
    {"id": "kw-seo", "text": "seo ranking prediction", "intent": "informational", "business_relevance": 0.70, "difficulty": 33, "volume": 880},
    {"id": "kw-gsc", "text": "search console opportunity queue", "intent": "informational", "business_relevance": 0.64, "difficulty": 18, "volume": 320},
]

# keyword id -> page ids that legitimately receive impressions
PAIRS: dict[str, list[str]] = {
    "kw-ai": ["page-platform", "page-blog"],
    "kw-ci": ["page-product", "page-customers"],
    "kw-seo": ["page-compare", "page-docs"],
    "kw-gsc": ["page-docs", "page-platform"],
}

LINKS: list[tuple[str, str]] = [
    ("page-blog", "page-platform"),
    ("page-customers", "page-product"),
]

COMPETITORS: list[dict[str, Any]] = [
    {
        "keyword_id": "kw-ai",
        "url": "https://competitor.example/ai-automation",
        "position": 3.2,
        "ref_domains": 140,
        "body": (
            "implementation timeline security review change log workflow audit "
            "human approval rollout plan integration checklist"
        ),
    },
    {
        "keyword_id": "kw-ci",
        "url": "https://competitor.example/intelligence",
        "position": 4.1,
        "ref_domains": 210,
        "body": (
            "battlecard win loss pricing intelligence alert cadence source provenance "
            "analyst workflow evidence export"
        ),
    },
    {
        "keyword_id": "kw-seo",
        "url": "https://competitor.example/ranking",
        "position": 5.0,
        "ref_domains": 90,
        "body": (
            "time aware validation leakage feature registry confidence calibration "
            "experiment log search console horizon"
        ),
    },
    {
        "keyword_id": "kw-gsc",
        "url": "https://competitor.example/search-console",
        "position": 6.4,
        "ref_domains": 40,
        "body": "query page date device country inspection index coverage sitemap freshness",
    },
]

EXPERIMENT = {
    "id": "exp-platform-title",
    "keyword_id": "kw-ai",
    "page_id": "page-platform",
    "change_date": None,  # filled from the weekly calendar
    "change_type": "title",
    "old_version": "Nimblize Platform",
    "new_version": "AI automation platform for mid-market teams",
    "reason": "Query impressions were high and the title did not repeat the query language.",
    "owner": "seo-team",
    "expected_outcome": "Higher CTR and a stronger Top-10 rate after 28 days.",
    "week_index": 16,
}


def calendar() -> list[date]:
    return [END - timedelta(days=7 * (23 - i)) for i in range(24)]


def page_html(page: dict[str, Any], title: str | None = None) -> str:
    robots = "noindex,follow" if not page["indexable"] else "index,follow"
    jsonld = ""
    if page["id"] == "page-platform":
        jsonld = '<script type="application/ld+json">{"@type":"SoftwareApplication","name":"Nimblize"}</script>'
    return (
        "<!doctype html><html><head>"
        f"<title>{title or page['title']}</title>"
        f'<link rel="canonical" href="{page["url"]}">'
        f'<meta name="robots" content="{robots}">'
        f"{jsonld}</head><body><h1>{page['h1']}</h1><p>{page['body']}</p>"
        + "".join(f'<a href="https://www.nimblize.ai/{dst}">related</a>' for src, dst in [] )
        + "</body></html>"
    )


def build_rows() -> dict[str, Any]:
    """Return observations, audits, and the experiment measured from those rows."""
    rng = random.Random(7)
    days = calendar()
    change_day = days[EXPERIMENT["week_index"]]
    pages = {p["id"]: p for p in PAGES}
    keywords = {k["id"]: k for k in KEYWORDS}
    observations: list[dict[str, Any]] = []
    audits: list[dict[str, Any]] = []

    for week, day in enumerate(days):
        for page in PAGES:
            title = page["title"]
            quality = page["quality"]
            if page["id"] == "page-platform" and day >= change_day:
                title = EXPERIMENT["new_version"]
                quality = 0.8
            audits.append({
                "page_id": page["id"],
                "audited_at": day.isoformat(),
                "url": page["url"],
                "status": page["status"],
                "indexable": page["indexable"] and day >= date.min,
                "robots_blocked": page["robots_blocked"],
                "canonical": page["url"],
                "title": title,
                "h1": page["h1"],
                "body": page["body"],
                "html": page_html(page, title),
                "word_count": page["word_count"],
                "internal_links": page["internal_links"],
                "ref_domains": page["ref_domains"],
                "lcp_ms": page["lcp_ms"],
                "inp_ms": page["inp_ms"],
                "cls": page["cls"],
                "quality": quality,
            })
        for keyword_id, page_ids in PAIRS.items():
            keyword = keywords[keyword_id]
            for page_id in page_ids:
                page = pages[page_id]
                quality = 0.8 if page_id == "page-platform" and day >= change_day else page["quality"]
                noise = rng.gauss(0, 1.4)
                position = min(48.0, max(1.2, 20 - 16 * quality + noise))
                if not page["indexable"]:
                    position = min(48.0, position + 8)
                base_ctr = max(0.004, min(0.3, 0.25 / position))
                ctr_penalty = 0.35 if page_id == "page-platform" else 1.0
                ctr = base_ctr * ctr_penalty
                share = 0.22 if position <= 10 else 0.12 if position <= 20 else 0.04
                impressions = int(keyword["volume"] * share * (0.85 + rng.random() * 0.3))
                impressions = max(impressions, 0)
                clicks = int(impressions * ctr)
                observations.append({
                    "site_id": SITE_ID,
                    "keyword_id": keyword_id,
                    "keyword": keyword["text"],
                    "page_id": page_id,
                    "url": page["url"],
                    "obs_date": day.isoformat(),
                    "device": "MOBILE",
                    "country": "usa",
                    "search_type": "web",
                    "position": round(position, 2),
                    "clicks": clicks,
                    "impressions": impressions,
                    "ctr": round(clicks / impressions, 4) if impressions else None,
                    "intent": keyword["intent"],
                    "business_relevance": keyword["business_relevance"],
                    "difficulty": keyword["difficulty"],
                    "volume": keyword["volume"],
                    "source": "sample-generator",
                    "collected_at": day.isoformat() + "T18:00:00-07:00",
                    "quality": round(quality, 3),
                })

    experiment = dict(EXPERIMENT)
    experiment["change_date"] = change_day.isoformat()
    return {
        "site": {"id": SITE_ID, "domain": "www.nimblize.ai", "url": SITE_URL, "primary_country": "usa"},
        "pages": PAGES,
        "keywords": KEYWORDS,
        "links": LINKS,
        "competitors": COMPETITORS,
        "observations": observations,
        "audits": audits,
        "experiment": experiment,
        "dates": [d.isoformat() for d in days],
    }


def trailing_demand(impressions: list[float]) -> float:
    total = sum(impressions)
    return max(0.0, min(1.0, math.log1p(total) / math.log1p(10000)))
