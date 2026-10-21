"""Feature matrix. Same-day position, clicks, impressions, and CTR are not features."""

from __future__ import annotations

import math
import re
from collections import defaultdict
from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from seo.config import FEATURES

_TOKEN = re.compile(r"[a-z0-9]+")


def tokens(text: str) -> set[str]:
    return set(_TOKEN.findall((text or "").lower()))


def overlap(left: str, right: str) -> float:
    a, b = tokens(left), tokens(right)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a)


def top_terms(text: str, limit: int = 8) -> list[str]:
    counts: dict[str, int] = defaultdict(int)
    for token in _TOKEN.findall((text or "").lower()):
        if len(token) < 4:
            continue
        counts[token] += 1
    return [term for term, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:limit]]


class CorpusEncoder:
    """TF-IDF fit on the page corpus, then a small LSA space. Not fit on one pair."""

    def __init__(self) -> None:
        self.vectorizer = TfidfVectorizer(stop_words="english", min_df=1)
        self.svd = TruncatedSVD(n_components=8, random_state=7)
        self._ready = False

    def fit(self, documents: list[str]) -> None:
        matrix = self.vectorizer.fit_transform(documents or [""])
        components = min(8, max(2, matrix.shape[1] - 1), matrix.shape[0] - 1)
        self.svd = TruncatedSVD(n_components=max(2, components), random_state=7)
        self.svd.fit(matrix)
        self._ready = True

    def semantic(self, left: str, right: str) -> float:
        if not self._ready:
            return 0.0
        matrix = self.vectorizer.transform([left or "", right or ""])
        vectors = self.svd.transform(matrix)
        score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        if math.isnan(score):
            return 0.0
        return float(max(0.0, min(1.0, (score + 1) / 2)))


def topic_coverage(page_text: str, competitor_text: str) -> tuple[float, list[str]]:
    terms = top_terms(competitor_text, 8)
    if not terms:
        return 0.0, []
    page_tokens = tokens(page_text)
    missing = [term for term in terms if term not in page_tokens]
    covered = (len(terms) - len(missing)) / len(terms)
    return covered, missing


def speed_score(lcp_ms: float, inp_ms: float, cls: float) -> float:
    lcp_penalty = min(1.0, max(0.0, (lcp_ms - 1000) / 4000))
    inp_penalty = min(1.0, max(0.0, (inp_ms - 100) / 500))
    cls_penalty = min(1.0, max(0.0, cls / 0.25))
    return round(1 - (0.5 * lcp_penalty + 0.3 * inp_penalty + 0.2 * cls_penalty), 4)


def assemble(bundle: dict[str, Any]) -> pd.DataFrame:
    """Join observations to the audit on that date and add lagged, known-at-D features."""
    audits = pd.DataFrame(bundle["audits"])
    obs = pd.DataFrame(bundle["observations"])
    frame = obs.merge(audits, on=["page_id", "url"], suffixes=("", "_audit"))
    # audited_at matches obs_date in the sample. Live crawls use the latest audit at or before D.
    frame = frame[frame["audited_at"] == frame["obs_date"]].copy()

    documents = [row["body"] for row in bundle["audits"] if row["audited_at"] == bundle["dates"][-1]]
    documents += [row["body"] for row in bundle["competitors"]]
    encoder = CorpusEncoder()
    encoder.fit(documents)
    competitors = {row["keyword_id"]: row for row in bundle["competitors"]}

    semantic_scores = []
    coverages = []
    missing_topics = []
    title_scores = []
    heading_scores = []
    for row in frame.itertuples(index=False):
        competitor = competitors.get(row.keyword_id, {"body": "", "ref_domains": 0, "url": "", "position": None})
        covered, missing = topic_coverage(f"{row.title} {row.h1} {row.body}", competitor["body"])
        semantic_scores.append(encoder.semantic(row.keyword, f"{row.title} {row.h1} {row.body}"))
        coverages.append(round(covered, 4))
        missing_topics.append(missing)
        title_scores.append(round(overlap(row.keyword, row.title), 4))
        heading_scores.append(round(overlap(row.keyword, row.h1), 4))

    frame["title_relevance"] = title_scores
    frame["heading_relevance"] = heading_scores
    frame["semantic_similarity"] = semantic_scores
    frame["topic_coverage"] = coverages
    frame["missing_topics"] = missing_topics
    frame["speed_score"] = [
        speed_score(lcp, inp, cls)
        for lcp, inp, cls in zip(frame["lcp_ms"], frame["inp_ms"], frame["cls"])
    ]
    frame["indexed"] = frame["indexable"].astype(int)
    frame["intent_commercial"] = (frame["intent"] == "commercial").astype(int)
    frame["intent_informational"] = (frame["intent"] == "informational").astype(int)
    frame["intent_transactional"] = (frame["intent"] == "transactional").astype(int)

    frame["obs_date"] = pd.to_datetime(frame["obs_date"])
    frame = frame.sort_values(["keyword_id", "page_id", "obs_date"])
    grouped = frame.groupby(["keyword_id", "page_id"], group_keys=False)
    frame["position_lag_7"] = grouped["position"].shift(1)
    frame["position_lag_28"] = grouped["position"].shift(4)
    frame["position_delta_28"] = frame["position_lag_7"] - frame["position_lag_28"]
    frame["ctr_lag_28"] = grouped["ctr"].shift(1)
    frame["impressions_lag_28"] = grouped["impressions"].transform(
        lambda series: series.shift(1).rolling(4, min_periods=1).sum()
    )
    frame["log_impressions_lag_28"] = np.log1p(frame["impressions_lag_28"])
    frame["n_obs"] = grouped.cumcount()
    frame["position_future_28"] = grouped["position"].shift(-4)
    frame["y_top10"] = np.where(
        frame["position_future_28"].isna(),
        np.nan,
        (frame["position_future_28"] <= 10).astype(float),
    )
    frame.attrs["encoder"] = encoder
    return frame


def feature_matrix(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    missing = [name for name in FEATURES if name not in frame.columns]
    if missing:
        raise RuntimeError(f"feature registry columns missing: {missing}")
    leaked = [name for name in FEATURES if name in ("position", "clicks", "impressions", "ctr")]
    if leaked:
        raise RuntimeError(f"leaky columns in the feature registry: {leaked}")
    return frame[FEATURES].astype(float), FEATURES
