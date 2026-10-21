"""Baseline logistic regression and a gradient-boosted challenger."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, precision_recall_fscore_support
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from seo.config import PROMOTION_AP_GAIN


def _split_dates(dates: list[pd.Timestamp]) -> tuple[set, set, set]:
    ordered = sorted(set(dates))
    train_end = max(1, int(len(ordered) * 0.6))
    val_end = max(train_end + 1, int(len(ordered) * 0.8))
    return set(ordered[:train_end]), set(ordered[train_end:val_end]), set(ordered[val_end:])


def _metrics(y_true: np.ndarray, probabilities: np.ndarray) -> dict[str, float]:
    labels = (probabilities >= 0.5).astype(int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, labels, average="binary", zero_division=0
    )
    return {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "pr_auc": round(float(average_precision_score(y_true, probabilities)), 4) if y_true.sum() else 0.0,
        "brier": round(float(brier_score_loss(y_true, probabilities)), 4),
    }


def precision_at_k(y_true: np.ndarray, probabilities: np.ndarray, k: int) -> float:
    if len(y_true) == 0:
        return 0.0
    k = min(k, len(y_true))
    order = np.argsort(-probabilities)[:k]
    return float(y_true[order].mean())


def train_models(frame: pd.DataFrame, matrix: pd.DataFrame, names: list[str]) -> dict[str, Any]:
    labeled = frame["y_top10"].notna()
    dates = frame.loc[labeled, "obs_date"].tolist()
    train_dates, val_dates, test_dates = _split_dates(dates)
    y = frame.loc[labeled, "y_top10"].astype(int).to_numpy()
    x = matrix.loc[labeled]
    date_values = frame.loc[labeled, "obs_date"]
    train_mask = date_values.isin(train_dates).to_numpy()
    val_mask = date_values.isin(val_dates).to_numpy()
    test_mask = date_values.isin(test_dates).to_numpy()
    if train_mask.sum() < 20 or test_mask.sum() < 5:
        raise RuntimeError("not enough time-ordered rows to train")

    logistic = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced")),
    ])
    booster = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("classifier", HistGradientBoostingClassifier(max_depth=3, learning_rate=0.08, max_iter=120, random_state=7)),
    ])
    logistic.fit(x.loc[train_mask], y[train_mask])
    booster.fit(x.loc[train_mask], y[train_mask])

    report = {}
    probabilities = {}
    for name, model in (("logistic", logistic), ("boosting", booster)):
        test_prob = model.predict_proba(x.loc[test_mask])[:, 1]
        probabilities[name] = test_prob
        report[name] = _metrics(y[test_mask], test_prob)
        report[name]["precision_at_k"] = round(precision_at_k(y[test_mask], test_prob, min(10, int(test_mask.sum()))), 4)
        if val_mask.sum():
            report[name]["val_pr_auc"] = round(float(average_precision_score(y[val_mask], model.predict_proba(x.loc[val_mask])[:, 1])), 4)

    promote = (
        report["boosting"]["pr_auc"] >= report["logistic"]["pr_auc"] + PROMOTION_AP_GAIN
        and report["boosting"]["precision_at_k"] >= report["logistic"]["precision_at_k"]
    )
    serving_name = "boosting" if promote else "logistic"
    serving = booster if promote else logistic
    return {
        "model": serving,
        "logistic": logistic,
        "booster": booster,
        "serving_name": serving_name,
        "promoted_boosting": promote,
        "metrics": report,
        "feature_names": names,
        "medians": x.median(numeric_only=True).to_dict(),
        "train_end": str(max(train_dates).date()),
        "test_rows": int(test_mask.sum()),
        "labeled_rows": int(labeled.sum()),
        "positive_rate": round(float(y.mean()), 4),
    }


def predict_probability(model: Any, row: pd.Series, names: list[str]) -> float:
    values = pd.DataFrame([{name: row.get(name) for name in names}])
    return float(model.predict_proba(values)[0, 1])


def explain(model: Any, row: pd.Series, names: list[str], medians: dict[str, float]) -> list[dict[str, float | str]]:
    """Signed reasons. Logistic uses coefficients. The booster uses median gaps."""
    if "classifier" in getattr(model, "named_steps", {}) and hasattr(model.named_steps["classifier"], "coef_"):
        transformed = model.named_steps["scale"].transform(
            model.named_steps["imputer"].transform(pd.DataFrame([{name: row.get(name) for name in names}]))
        )[0]
        contributions = model.named_steps["classifier"].coef_[0] * transformed
        order = np.argsort(-np.abs(contributions))[:5]
        return [
            {"feature": names[int(index)], "contribution": round(float(contributions[index]), 4)}
            for index in order
        ]
    gaps = []
    for name in names:
        median = medians.get(name, 0.0) or 0.0
        value = row.get(name)
        if value is None or (isinstance(value, float) and math_isnan(value)):
            continue
        gaps.append((abs(float(value) - float(median)), name, round(float(value) - float(median), 4)))
    gaps.sort(reverse=True)
    return [{"feature": name, "contribution": delta} for _, name, delta in gaps[:5]]


def math_isnan(value: float) -> bool:
    return isinstance(value, float) and np.isnan(value)
