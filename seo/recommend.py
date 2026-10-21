"""Opportunity scores and the deterministic recommendation rules."""

from __future__ import annotations

import math
from typing import Any

from seo.config import (
    CLS_POOR,
    CTR_IMPRESSIONS_MIN,
    EFFORT,
    GUIDE_WEIGHTS,
    INP_POOR_MS,
    INTERNAL_LINKS_MIN,
    LCP_POOR_MS,
    MODEL_FREE_WEIGHTS,
    RELEVANCE_MIN,
    TOPIC_COVERAGE_MAX,
)


def clip(value: float) -> float:
    return max(0.0, min(1.0, value))


def demand(impressions_lag_28: float | None) -> float:
    if impressions_lag_28 is None or (isinstance(impressions_lag_28, float) and math.isnan(impressions_lag_28)):
        return 0.0
    return clip(math.log1p(float(impressions_lag_28)) / math.log1p(10000))


def headroom(position_lag_28: float | None) -> float:
    if position_lag_28 is None or (isinstance(position_lag_28, float) and math.isnan(position_lag_28)):
        return 0.3
    position = float(position_lag_28)
    if 4 <= position <= 20:
        return clip((position - 4) / 16)
    if position < 4:
        return 0.15
    return clip(1 - (position - 20) / 40)


def confidence(n_obs: int, fresh_days: int, calibration: float = 0.75) -> float:
    sample = min(1.0, n_obs / 50)
    freshness = 1.0 if fresh_days <= 7 else 0.5 if fresh_days <= 28 else 0.2
    return round(sample * freshness * calibration, 4)


def model_free_score(signals: dict[str, Any]) -> float:
    demand_n = demand(signals.get("impressions_lag_28"))
    relevance = float(signals.get("business_relevance") or 0)
    room = headroom(signals.get("position_lag_28"))
    expected = relevance * demand_n
    weights = MODEL_FREE_WEIGHTS
    return round(
        weights["demand"] * demand_n
        + weights["business_relevance"] * relevance
        + weights["headroom"] * room
        + weights["expected_value"] * expected,
        4,
    )


def guide_score(signals: dict[str, Any], probability: float) -> float:
    demand_n = demand(signals.get("impressions_lag_28"))
    relevance = float(signals.get("business_relevance") or 0)
    room = headroom(signals.get("position_lag_28"))
    expected = relevance * demand_n
    weights = GUIDE_WEIGHTS
    return round(
        weights["demand"] * demand_n
        + weights["business_relevance"] * relevance
        + weights["ranking_probability"] * probability
        + weights["headroom"] * room
        + weights["expected_value"] * expected,
        4,
    )


def _ctr_is_weak(signals: dict[str, Any]) -> bool:
    impressions = signals.get("impressions_lag_28") or 0
    ctr = signals.get("ctr")
    median = signals.get("bucket_median_ctr")
    if impressions < CTR_IMPRESSIONS_MIN or ctr is None or median in (None, 0):
        return False
    return float(ctr) < 0.5 * float(median)


def matching_rules(signals: dict[str, Any]) -> list[dict[str, Any]]:
    """Guide section 18. First rule is the bottleneck. P0 is a technical blocker."""
    rules: list[dict[str, Any]] = []
    if (not signals.get("indexable")) or signals.get("robots_blocked") or int(signals.get("status") or 200) >= 500:
        rules.append({
            "priority": "P0",
            "bottleneck": "indexing",
            "action": "Review indexing configuration immediately. This page is noindex, blocked, or returning a server error.",
            "effort": EFFORT["indexing"],
        })
    if (
        float(signals.get("lcp_ms") or 0) > LCP_POOR_MS
        or float(signals.get("inp_ms") or 0) > INP_POOR_MS
        or float(signals.get("cls") or 0) > CLS_POOR
    ):
        rules.append({
            "priority": "P1",
            "bottleneck": "speed",
            "action": "Mobile field data is past a Core Web Vitals threshold. Open a ticket for LCP, INP, or CLS before writing more copy.",
            "effort": EFFORT["speed"],
        })
    if signals.get("cannibalization") and not signals.get("is_primary"):
        rules.append({
            "priority": "P1",
            "bottleneck": "cannibalization",
            "action": f"Two indexable URLs earn impressions for this query. Set {signals.get('primary_url')} as the primary page.",
            "effort": EFFORT["cannibalization"],
        })
    if _ctr_is_weak(signals):
        rules.append({
            "priority": "P1",
            "bottleneck": "title",
            "action": "Review the title and snippet. Impressions are high and CTR is under half the position-bucket median.",
            "effort": EFFORT["title"],
        })
    relevance = max(float(signals.get("semantic_similarity") or 0), float(signals.get("title_relevance") or 0))
    if relevance >= RELEVANCE_MIN and float(signals.get("topic_coverage") or 1) < TOPIC_COVERAGE_MAX:
        missing = ", ".join(signals.get("missing_topics") or []) or "the missing subtopics"
        rules.append({
            "priority": "P1",
            "bottleneck": "content",
            "action": f"Expand useful subtopics that competing pages cover: {missing}.",
            "effort": EFFORT["content"],
        })
    if int(signals.get("internal_links") or 0) < INTERNAL_LINKS_MIN and signals.get("indexable"):
        rules.append({
            "priority": "P2",
            "bottleneck": "links",
            "action": "Add contextual internal links from related pages. Relevant inbound links are below 3.",
            "effort": EFFORT["links"],
        })
    if float(signals.get("authority_gap") or 0) > 50 and signals.get("indexable"):
        rules.append({
            "priority": "P2",
            "bottleneck": "authority",
            "action": "Competitors have more referring domains on this query. Propose an original asset. Outreach stays manual.",
            "effort": EFFORT["authority"],
        })
    if not rules:
        rules.append({
            "priority": "P3",
            "bottleneck": "monitor",
            "action": "Monitor. No high-confidence action from the current evidence.",
            "effort": EFFORT["monitor"],
        })
    return rules


def priority_value(band: str, score: float, conf: float, effort: float) -> tuple[int, float]:
    order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    density = (score * conf) / max(effort, 0.25)
    return order[band], -density
