"""Dataset checks from guide section 5. Failed inputs are quarantined, never zero-filled."""

from __future__ import annotations

from collections import Counter
from typing import Any


class ValidationError(ValueError):
    pass


def normalize_url(url: str) -> str:
    base = url.split("#", 1)[0]
    if "?" in base:
        path, query = base.split("?", 1)
        kept = [
            part for part in query.split("&")
            if part and not part.startswith(("utm_", "gclid=", "fbclid="))
        ]
        base = path if not kept else path + "?" + "&".join(kept)
    if len(base) > len("https://") and base.endswith("/"):
        base = base[:-1]
    return base


def validate_observations(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Drop duplicate grain and impossible values. A null metric stays null."""
    seen: Counter[tuple] = Counter()
    kept: list[dict[str, Any]] = []
    quarantined: list[dict[str, Any]] = []
    for row in rows:
        grain = (
            row.get("keyword_id"),
            normalize_url(str(row.get("url", ""))),
            row.get("obs_date"),
            row.get("device"),
            row.get("country"),
            row.get("search_type"),
        )
        seen[grain] += 1
        reason = None
        if seen[grain] > 1:
            reason = "duplicate keyword-page-date grain"
        elif row.get("impressions") is not None and row["impressions"] < 0:
            reason = "negative impressions"
        elif row.get("position") is not None and not (1 <= float(row["position"]) <= 100):
            reason = "position outside 1-100"
        elif row.get("ctr") is not None and not (0 <= float(row["ctr"]) <= 1):
            reason = "ctr outside 0-1"
        if reason:
            quarantined.append({**row, "quarantine_reason": reason})
            continue
        clean = dict(row)
        clean["url"] = grain[1]
        if clean.get("impressions") in (None, ""):
            clean["ctr"] = None
        kept.append(clean)
    return kept, quarantined
