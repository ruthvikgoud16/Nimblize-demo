"""Ahrefs exports. The vendor is fixed. A missing file is a failed import, not a guessed metric."""

from __future__ import annotations

import csv
from datetime import datetime, timezone
from io import StringIO
from typing import Any

KEYWORD_FIELDS = {
    "keyword": "keyword",
    "volume": "volume",
    "kd": "difficulty",
    "keyword difficulty": "difficulty",
    "difficulty": "difficulty",
    "position": "position",
    "url": "url",
    "current url": "url",
}
REFERRING_FIELDS = {
    "referring domain": "domain",
    "domain": "domain",
    "target": "url",
    "url": "url",
    "target url": "url",
}


def _rows(csv_text: str, aliases: dict[str, str]) -> list[dict[str, str]]:
    reader = csv.DictReader(StringIO(csv_text.lstrip("\ufeff")))
    if not reader.fieldnames:
        return []
    mapping = {name: aliases.get(name.strip().lower(), "") for name in reader.fieldnames}
    parsed = []
    for raw in reader:
        item = {}
        for source, target in mapping.items():
            if target and raw.get(source) not in (None, ""):
                item[target] = raw[source].strip()
        if item:
            parsed.append(item)
    return parsed


def parse_keywords(csv_text: str) -> list[dict[str, str]]:
    return [row for row in _rows(csv_text, KEYWORD_FIELDS) if row.get("keyword")]


def parse_referring_domains(csv_text: str) -> list[dict[str, str]]:
    return [row for row in _rows(csv_text, REFERRING_FIELDS) if row.get("domain")]


def _number(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    cleaned = value.replace(",", "").replace("%", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def apply_keywords(connection: Any, rows: list[dict[str, str]]) -> int:
    from seo.store import _slug, init_db

    init_db(connection)
    kept = 0
    for row in rows:
        keyword = row["keyword"].strip()
        if not keyword:
            continue
        keyword_id = "kw-" + _slug(keyword)
        difficulty = _number(row.get("difficulty"))
        volume = _number(row.get("volume"))
        connection.execute(
            """INSERT INTO keywords (id, text, intent, business_relevance, difficulty, volume)
            VALUES (?, ?, 'unknown', 0.5, ?, ?)
            ON CONFLICT(text) DO UPDATE SET
            difficulty = COALESCE(excluded.difficulty, keywords.difficulty),
            volume = COALESCE(excluded.volume, keywords.volume)""",
            (keyword_id, keyword, difficulty, volume),
        )
        kept += 1
    connection.commit()
    return kept


def apply_referring_domains(connection: Any, rows: list[dict[str, str]], target_url: str) -> int:
    from seo.store import init_db

    init_db(connection)
    domains = {row["domain"].lower() for row in rows}
    if not domains:
        return 0
    connection.execute(
        """INSERT INTO authority_snapshots (source, url, ref_domains, imported_at)
        VALUES ('ahrefs', ?, ?, ?)""",
        (target_url, len(domains), datetime.now(timezone.utc).isoformat()),
    )
    connection.commit()
    return len(domains)
