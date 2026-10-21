"""Page 33 acceptance checks: the pipeline, the rules, and the API."""

from __future__ import annotations

import json
import unittest
from urllib.error import URLError

from fastapi.testclient import TestClient

from seo.collectors import CollectionError, fetch_crux, fetch_pagespeed, fetch_search_console
from seo.config import FEATURES, GUIDE_WEIGHTS, LEAKY_COLUMNS, MODEL_FREE_WEIGHTS
from seo.crawl import parse_html
from seo.pipeline import run
from seo.recommend import guide_score, matching_rules, model_free_score
from seo.validate import validate_observations


class Contracts(unittest.TestCase):
    def test_weights_and_leakage(self):
        self.assertAlmostEqual(sum(GUIDE_WEIGHTS.values()), 1.0)
        self.assertAlmostEqual(sum(MODEL_FREE_WEIGHTS.values()), 1.0)
        self.assertNotIn("ranking_probability", MODEL_FREE_WEIGHTS)
        self.assertEqual(set(FEATURES).intersection(LEAKY_COLUMNS), set())

    def test_noindex_is_p0_before_content(self):
        rules = matching_rules({
            "indexable": False,
            "status": 200,
            "robots_blocked": False,
            "lcp_ms": 1000,
            "inp_ms": 100,
            "cls": 0.01,
            "semantic_similarity": 0.9,
            "title_relevance": 0.9,
            "topic_coverage": 0.1,
            "missing_topics": ["timeline"],
            "internal_links": 0,
            "impressions_lag_28": 5000,
            "ctr": 0.01,
            "bucket_median_ctr": 0.08,
        })
        self.assertEqual(rules[0]["priority"], "P0")
        self.assertEqual(rules[0]["bottleneck"], "indexing")

    def test_model_free_score_ignores_probability(self):
        signals = {"impressions_lag_28": 2000, "business_relevance": 0.8, "position_lag_28": 12}
        self.assertEqual(model_free_score(signals), model_free_score({**signals, "probability": 0.99}))
        self.assertGreater(guide_score(signals, 0.9), guide_score(signals, 0.1))

    def test_parser_sees_noindex_and_canonical(self):
        parsed = parse_html(
            "https://www.nimblize.ai/docs/search-console",
            "<html><head><title>Search Console setup</title>"
            '<link rel="canonical" href="https://www.nimblize.ai/docs/search-console">'
            '<meta name="robots" content="noindex,follow"></head><body><h1>Queue</h1></body></html>',
            200,
        )
        self.assertFalse(parsed["indexable"])
        self.assertEqual(parsed["canonical"], "https://www.nimblize.ai/docs/search-console")

    def test_failed_collection_does_not_invent_rows(self):
        def broken(request, timeout=60):
            raise URLError("down")

        with self.assertRaises(CollectionError):
            fetch_search_console("https://www.nimblize.ai/", "token", "2026-09-01", "2026-10-01", opener=broken)
        with self.assertRaises(CollectionError):
            fetch_pagespeed("https://www.nimblize.ai/platform", "key", opener=broken)
        with self.assertRaises(CollectionError):
            fetch_crux("https://www.nimblize.ai/platform", "key", opener=broken)

    def test_validator_quarantines_duplicates_and_keeps_nulls(self):
        row = {
            "keyword_id": "kw",
            "url": "https://www.nimblize.ai/platform?utm_source=x",
            "obs_date": "2026-10-01",
            "device": "MOBILE",
            "country": "usa",
            "search_type": "web",
            "position": 8,
            "clicks": None,
            "impressions": None,
            "ctr": None,
        }
        kept, quarantined = validate_observations([row, dict(row)])
        self.assertEqual(len(kept), 1)
        self.assertEqual(len(quarantined), 1)
        self.assertIsNone(kept[0]["ctr"])
        self.assertNotIn("utm_source", kept[0]["url"])


class Page33Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot = run()

    def test_queue_explains_every_row(self):
        self.assertGreaterEqual(len(self.snapshot["opportunities"]), 6)
        for item in self.snapshot["opportunities"]:
            self.assertIn(item["priority"], {"P0", "P1", "P2", "P3"})
            self.assertTrue(item["action"])
            evidence = item["evidence"]
            self.assertIn("search_console", evidence)
            self.assertIn("technical", evidence)
            self.assertIn("semantic", evidence)
            self.assertIn("competitor", evidence)
            self.assertIn("internal_links", evidence)
            self.assertIn("model", evidence)
            self.assertTrue(evidence["model"]["reasons"])

    def test_experiment_is_an_association(self):
        experiment = self.snapshot["experiments"][0]
        self.assertEqual(experiment["result_kind"], "association")
        self.assertLess(experiment["position_after"], experiment["position_before"])
        self.assertGreater(experiment["clicks_after"], experiment["clicks_before"])

    def test_serving_model_reports_time_aware_metrics(self):
        metrics = self.snapshot["model"]["metrics"][self.snapshot["model"]["serving_name"]]
        self.assertIn("pr_auc", metrics)
        self.assertGreater(metrics["pr_auc"], 0.5)

    def test_api_demo_flow(self):
        from seo.api.app import app

        client = TestClient(app)
        health = client.get("/health")
        self.assertEqual(health.status_code, 200)
        queue = client.get("/api/seo/keywords/opportunities")
        self.assertEqual(queue.status_code, 200)
        first = queue.json()["opportunities"][0]
        self.assertEqual(first["priority"], "P0")
        audit = client.get(f"/api/seo/pages/{first['page_id']}/audit", params={"keyword_id": first["keyword_id"]})
        self.assertEqual(audit.status_code, 200)
        self.assertIn("evidence", audit.json())
        experiments = client.get("/api/seo/experiments")
        self.assertEqual(experiments.json()["experiments"][0]["result_kind"], "association")
        model = client.get("/api/seo/models/current")
        self.assertIn("pr_auc", json.dumps(model.json()["metrics"]))
        done = client.post(f"/api/seo/recommendations/{first['id']}/complete")
        self.assertEqual(done.json()["status"], "Implemented")
        from seo import store
        connection = store.connect()
        events = store.rows(connection, "SELECT to_status FROM recommendation_events WHERE recommendation_id = ?", (first["id"],))
        connection.close()
        self.assertEqual(events[-1]["to_status"], "Implemented")
        boards = client.get("/api/seo/boards")
        self.assertEqual(boards.status_code, 200)
        self.assertIn("technical", boards.json())
        self.assertGreater(boards.json()["overview"]["p0"], 0)
        blocked = client.get("/api/seo/keywords/opportunities", headers={"Authorization": "Bearer wrong"})
        # Token is not configured in test, so the demo route stays open.
        self.assertEqual(blocked.status_code, 200)


if __name__ == "__main__":
    unittest.main()
