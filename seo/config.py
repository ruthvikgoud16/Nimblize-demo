"""Locked contracts from the Phase 7 guide. Change weights here, not inside the model."""

from __future__ import annotations

import os
from pathlib import Path

FEATURES = [
    "title_relevance",
    "heading_relevance",
    "semantic_similarity",
    "topic_coverage",
    "word_count",
    "internal_links",
    "ref_domains",
    "speed_score",
    "indexed",
    "log_impressions_lag_28",
    "ctr_lag_28",
    "position_lag_28",
    "position_delta_28",
    "difficulty",
    "business_relevance",
    "intent_commercial",
    "intent_informational",
    "intent_transactional",
]

# Forbidden as inputs to a D+28 Top-10 label. Same-day outcomes leak the answer.
LEAKY_COLUMNS = ["position", "clicks", "impressions", "ctr", "position_future_28", "y_top10"]

# Model-free baseline. It must not contain ranking probability (guide sections 7 and 14).
MODEL_FREE_WEIGHTS = {
    "demand": 0.35,
    "business_relevance": 0.25,
    "headroom": 0.25,
    "expected_value": 0.15,
}

# Guide section 16. Used only after a serving model exists.
GUIDE_WEIGHTS = {
    "demand": 0.25,
    "business_relevance": 0.20,
    "ranking_probability": 0.30,
    "headroom": 0.15,
    "expected_value": 0.10,
}

EFFORT = {
    "indexing": 1,
    "title": 3,
    "content": 5,
    "links": 2,
    "speed": 3,
    "authority": 8,
    "cannibalization": 3,
    "monitor": 1,
}

# Cuts are project decisions. The guide names the conditions and leaves the numbers open.
CTR_IMPRESSIONS_MIN = 1000
RELEVANCE_MIN = 0.55
TOPIC_COVERAGE_MAX = 0.60
INTERNAL_LINKS_MIN = 3
LCP_POOR_MS = 2500
INP_POOR_MS = 200
CLS_POOR = 0.1
PROMOTION_AP_GAIN = 0.03
LABEL_HORIZON_DAYS = 28
PRIMARY_COUNTRY = "usa"
PRIMARY_DEVICE = "MOBILE"
# Domain property covers www, the apex host, and every subdomain and protocol.
GSC_SITE_URL = "sc-domain:nimblize.ai"
# Keyword ideas, difficulty, and referring domains come from Ahrefs exports.
VENDOR = "ahrefs"
GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
GSC_REDIRECT_URI = "http://127.0.0.1:8765/"


def load_local_env() -> None:
    """Load gitignored .env values without overriding the process environment."""
    roots = [Path(__file__).resolve().parents[1], Path.cwd()]
    seen: set[Path] = set()
    for root in roots:
        path = (root / ".env").resolve()
        if path in seen or not path.is_file():
            continue
        seen.add(path)
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()
