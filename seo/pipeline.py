"""End-to-end rebuild of the page 33 demo path."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from seo import store
from seo.crawl import parse_html
from seo.features import assemble, feature_matrix
from seo.model import explain, predict_probability, train_models
from seo.recommend import confidence, guide_score, matching_rules, model_free_score, priority_value
from seo.sample import build_rows
from seo.validate import validate_observations

ROOT = Path(__file__).resolve().parent


def _bucket(position: float) -> str:
    if position <= 3:
        return "top3"
    if position <= 10:
        return "4-10"
    if position <= 20:
        return "11-20"
    return "21+"


def _measure(frame: pd.DataFrame, experiment: dict) -> dict:
    change = pd.Timestamp(experiment["change_date"])
    mask = (frame["keyword_id"] == experiment["keyword_id"]) & (frame["page_id"] == experiment["page_id"])
    rows = frame.loc[mask].sort_values("obs_date")
    before = rows[(rows["obs_date"] < change) & (rows["obs_date"] >= change - pd.Timedelta(days=28))]
    after = rows[(rows["obs_date"] >= change) & (rows["obs_date"] < change + pd.Timedelta(days=28))]
    return {
        **experiment,
        "url": rows["url"].iloc[0],
        "keyword": rows["keyword"].iloc[0],
        "position_before": round(float(before["position"].mean()), 2) if len(before) else None,
        "position_after": round(float(after["position"].mean()), 2) if len(after) else None,
        "clicks_before": int(before["clicks"].sum()) if len(before) else 0,
        "clicks_after": int(after["clicks"].sum()) if len(after) else 0,
        "result_kind": "association",
    }


def _drift(frame: pd.DataFrame, names: list[str], train_end: str) -> list[dict]:
    train = frame[frame["obs_date"] <= pd.Timestamp(train_end)]
    recent_day = frame["obs_date"].max()
    recent = frame[frame["obs_date"] == recent_day]
    rows = []
    for name in names:
        train_median = float(train[name].median())
        recent_median = float(recent[name].median())
        base = abs(train_median) if abs(train_median) > 1e-6 else 1.0
        change = (recent_median - train_median) / base
        rows.append({
            "feature": name,
            "train_median": round(train_median, 4),
            "recent_median": round(recent_median, 4),
            "relative_change": round(float(change), 4),
            "flagged": abs(change) >= 0.5,
        })
    return rows


def run() -> dict:
    started = datetime.now(timezone.utc).isoformat()
    bundle = build_rows()
    kept, quarantined = validate_observations(bundle["observations"])
    if quarantined:
        raise RuntimeError(f"sample generator produced {len(quarantined)} invalid rows")
    bundle["observations"] = kept
    frame = assemble(bundle)
    matrix, names = feature_matrix(frame)
    trained = train_models(frame, matrix, names)
    latest_day = frame["obs_date"].max()
    latest = frame[frame["obs_date"] == latest_day].copy()
    medians: dict[str, float] = {}
    for bucket, group in latest.groupby(latest["position"].map(_bucket)):
        medians[bucket] = float(group["ctr"].median())

    primary: dict[str, str] = {}
    for keyword_id, group in latest.groupby("keyword_id"):
        indexable = group[group["indexable"] == True]  # noqa: E712
        pool = indexable if len(indexable) else group
        primary[keyword_id] = str(pool.sort_values("clicks", ascending=False)["url"].iloc[0])

    opportunities = []
    for row in latest.itertuples(index=False):
        series = frame[(frame["keyword_id"] == row.keyword_id) & (frame["page_id"] == row.page_id)]
        probability = predict_probability(trained["model"], pd.Series(row._asdict()), names)
        competitor = next(
            (item for item in bundle["competitors"] if item["keyword_id"] == row.keyword_id),
            {"url": "", "position": None, "ref_domains": 0, "body": ""},
        )
        signals = row._asdict()
        signals["bucket_median_ctr"] = medians.get(_bucket(row.position))
        signals["cannibalization"] = int((latest["keyword_id"] == row.keyword_id).sum()) > 1
        signals["is_primary"] = row.url == primary[row.keyword_id]
        signals["primary_url"] = primary[row.keyword_id]
        signals["authority_gap"] = competitor["ref_domains"] - row.ref_domains
        signals["probability"] = probability
        rules = matching_rules(signals)
        top = rules[0]
        band = "P0" if any(rule["priority"] == "P0" for rule in rules) else top["priority"]
        free = model_free_score(signals)
        score = guide_score(signals, probability)
        conf = confidence(int(row.n_obs), fresh_days=0)
        parsed = parse_html(row.url, row.html, int(row.status))
        suggestions = []
        for source, target in bundle["links"]:
            if target == row.page_id:
                source_page = next(page for page in bundle["pages"] if page["id"] == source)
                suggestions.append({"from": source_page["url"], "reason": "Existing contextual link in the site graph."})
        if row.internal_links < 3:
            for page in bundle["pages"]:
                if page["id"] != row.page_id and page["indexable"]:
                    suggestions.append({"from": page["url"], "reason": "Related indexable page with room to add a contextual link."})
                    break
        evidence = {
            "search_console": [
                {
                    "date": item.obs_date.date().isoformat(),
                    "position": item.position,
                    "clicks": int(item.clicks),
                    "impressions": int(item.impressions),
                    "ctr": item.ctr,
                }
                for item in series.tail(8).itertuples(index=False)
            ],
            "technical": {
                "status": parsed["status"],
                "indexable": parsed["indexable"],
                "canonical": parsed["canonical"],
                "robots": parsed["robots"],
                "title": parsed["title"],
                "h1": parsed["h1"],
                "jsonld_count": parsed["jsonld_count"],
                "lcp_ms": row.lcp_ms,
                "inp_ms": row.inp_ms,
                "cls": row.cls,
            },
            "semantic": {
                "title_relevance": row.title_relevance,
                "heading_relevance": row.heading_relevance,
                "semantic_similarity": row.semantic_similarity,
                "topic_coverage": row.topic_coverage,
                "missing_topics": list(row.missing_topics),
            },
            "competitor": {
                "url": competitor["url"],
                "position": competitor["position"],
                "ref_domains": competitor["ref_domains"],
                "authority_gap": signals["authority_gap"],
            },
            "internal_links": {"inbound": int(row.internal_links), "suggestions": suggestions[:3]},
            "authority": {"referring_domains": int(row.ref_domains)},
            "model": {
                "probability": round(probability, 4),
                "reasons": explain(trained["model"], pd.Series(row._asdict()), names, trained["medians"]),
                "model_free_score": free,
            },
            "rules": rules,
        }
        opportunities.append({
            "id": f"{row.keyword_id}:{row.page_id}",
            "keyword_id": row.keyword_id,
            "keyword": row.keyword,
            "page_id": row.page_id,
            "url": row.url,
            "position": row.position,
            "impressions": float(row.impressions_lag_28 or 0),
            "ctr": row.ctr,
            "probability": round(probability, 4),
            "model_free_score": free,
            "opportunity_score": score,
            "confidence": conf,
            "priority": band,
            "bottleneck": top["bottleneck"],
            "action": top["action"],
            "effort": top["effort"],
            "status": "Suggested",
            "evidence": evidence,
            "_sort": priority_value(band, score, conf, top["effort"]),
        })
    opportunities.sort(key=lambda item: item["_sort"])
    for item in opportunities:
        item.pop("_sort")

    experiment = _measure(frame, bundle["experiment"])
    run_id = "run-" + started.replace(":", "").replace("+00:00", "Z")
    latest_audits = []
    for page in bundle["pages"]:
        audit = next(row for row in reversed(bundle["audits"]) if row["page_id"] == page["id"])
        parsed = parse_html(audit["url"], audit["html"], audit["status"])
        latest_audits.append({
            **audit,
            "robots": parsed["robots"],
            "jsonld_count": parsed["jsonld_count"],
            "canonical": parsed["canonical"],
            "indexable": parsed["indexable"],
            "title": parsed["title"],
            "h1": parsed["h1"],
        })
    finished = datetime.now(timezone.utc).isoformat()
    snapshot = {
        "run_id": run_id,
        "started_at": started,
        "finished_at": finished,
        "site": bundle["site"],
        "pages": bundle["pages"],
        "keywords": bundle["keywords"],
        "observations": [
            {**row, "obs_date": row["obs_date"]}
            for row in bundle["observations"]
        ],
        "audits_latest": latest_audits,
        "opportunities": opportunities,
        "experiments": [experiment],
        "drift": _drift(frame, names, trained["train_end"]),
        "model": {
            "version": f"{trained['serving_name']}-{trained['train_end']}",
            "feature_version": "registry-v1",
            "serving_name": trained["serving_name"],
            "promoted_boosting": trained["promoted_boosting"],
            "trained_through": trained["train_end"],
            "metrics": trained["metrics"],
            "labeled_rows": trained["labeled_rows"],
            "positive_rate": trained["positive_rate"],
            "test_rows": trained["test_rows"],
            "created_at": finished,
        },
    }
    processed = ROOT / "data" / "processed"
    processed.mkdir(parents=True, exist_ok=True)
    export = frame.copy()
    export["obs_date"] = export["obs_date"].dt.date.astype(str)
    export["missing_topics"] = export["missing_topics"].apply(lambda value: "|".join(value))
    keep = [column for column in export.columns if column not in ("html", "body")]
    export[keep].to_csv(processed / "features.csv", index=False)
    with (processed / "model_card.json").open("w", encoding="utf-8") as handle:
        json.dump(snapshot["model"], handle, indent=2)
    connection = store.connect()
    store.replace_snapshot(connection, snapshot)
    connection.close()
    return snapshot


def main() -> None:
    snapshot = run()
    model = snapshot["model"]
    print(
        f"run {snapshot['run_id']} serving={model['serving_name']} "
        f"boosting_promoted={model['promoted_boosting']} opportunities={len(snapshot['opportunities'])}"
    )
    print(json.dumps(model["metrics"], indent=2))


if __name__ == "__main__":
    main()
