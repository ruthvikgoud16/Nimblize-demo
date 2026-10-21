"""Live collection must not wipe Search Console rows or invent audits."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from urllib.error import URLError

from fastapi.testclient import TestClient

from seo import store
from seo.collectors import CollectionError, refresh_google_token
from seo.config import FEATURES, LEAKY_COLUMNS
from seo.crawl import FetchError, crawl_allowlist, fetch_url, robots_allowed
from seo.jobs import run_job


class _Body:
    def __init__(self, raw: bytes, status: int = 200):
        self._raw = raw
        self.status = status

    def read(self) -> bytes:
        return self._raw

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def _opener(raw: bytes):
    def opener(request, timeout=60):
        return _Body(raw)

    return opener


class LivePath(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self._env = {
            key: os.environ.get(key)
            for key in (
                "SEO_DB_PATH",
                "SEO_GSC_SITE_URL",
                "SEO_GSC_ACCESS_TOKEN",
                "SEO_GSC_REFRESH_TOKEN",
                "SEO_GSC_CLIENT_ID",
                "SEO_GSC_CLIENT_SECRET",
                "SEO_GOOGLE_API_KEY",
                "SEO_PRIORITY_URL",
                "SEO_CRAWL_URLS",
                "SEO_ROBOTS_TXT_PATH",
                "SEO_API_TOKEN",
                "ENV",
            )
        }
        os.environ["SEO_DB_PATH"] = str(Path(self.tmp.name) / "seo.db")
        for key in self._env:
            if key != "SEO_DB_PATH":
                os.environ.pop(key, None)

    def tearDown(self):
        for key, value in self._env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        self.tmp.cleanup()

    def _row(self, position: float = 8.0):
        return {
            "keyword": "ai automation platform",
            "url": "https://www.nimblize.ai/platform",
            "obs_date": "2026-10-01",
            "device": "MOBILE",
            "country": "usa",
            "search_type": "web",
            "position": position,
            "clicks": 4,
            "impressions": 100,
            "ctr": 0.04,
        }

    def _ingest(self, position: float = 8.0) -> dict:
        connection = store.connect()
        result = store.ingest_search_console(connection, [self._row(position)], "run-test", "https://www.nimblize.ai/")
        connection.close()
        return result

    def _live(self) -> int:
        connection = store.connect()
        count = store.live_observation_count(connection)
        connection.close()
        return count

    def test_ingest_upserts_and_quarantines(self):
        first = self._ingest(8.0)
        self.assertEqual(first["kept"], 1)
        second = self._ingest(6.5)
        self.assertEqual(second["kept"], 1)
        self.assertEqual(self._live(), 1)
        connection = store.connect()
        position = connection.execute("SELECT position FROM observations").fetchone()["position"]
        connection.close()
        self.assertEqual(position, 6.5)
        bad = dict(self._row())
        bad["obs_date"] = "2026-10-02"
        bad["position"] = 140
        connection = store.connect()
        result = store.ingest_search_console(connection, [bad], "run-bad", "https://www.nimblize.ai/")
        connection.close()
        self.assertEqual(result["quarantined"], 1)
        self.assertEqual(self._live(), 1)

    def test_failed_refresh_keeps_rows(self):
        self._ingest()
        os.environ["SEO_GSC_SITE_URL"] = "https://www.nimblize.ai/"
        os.environ["SEO_GSC_ACCESS_TOKEN"] = "token"

        def broken(request, timeout=60):
            raise URLError("down")

        with self.assertRaises(CollectionError):
            run_job("search_console_refresh", opener=broken)
        self.assertEqual(self._live(), 1)

    def test_opportunity_report_and_snapshot_refuse_live_rows(self):
        self._ingest()
        with self.assertRaises(CollectionError):
            run_job("opportunity_report")
        connection = store.connect()
        with self.assertRaises(RuntimeError):
            store.replace_snapshot(connection, {})
        connection.close()
        self.assertEqual(self._live(), 1)

    def test_api_does_not_seed_over_live_rows(self):
        self._ingest()
        from seo.api.app import app

        client = TestClient(app)
        response = client.get("/api/seo/keywords/opportunities")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["opportunities"], [])
        self.assertEqual(self._live(), 1)

    def test_robots_skip_and_token_refresh(self):
        robots = "User-agent: *\nDisallow: /admin\n"
        self.assertFalse(robots_allowed("https://www.nimblize.ai/admin", robots))
        self.assertTrue(robots_allowed("https://www.nimblize.ai/platform", robots))
        with self.assertRaises(FetchError):
            fetch_url("https://www.nimblize.ai/admin", robots_txt=robots)
        called = []

        def fetcher(url):
            called.append(url)
            return {"url": url, "status": 200, "indexable": True, "links": [], "word_count": 10, "jsonld_count": 0, "title": "Platform", "h1": "Platform", "canonical": url, "robots": ""}

        crawled = crawl_allowlist(
            ["https://www.nimblize.ai/admin", "https://www.nimblize.ai/platform"],
            robots,
            fetcher,
        )
        self.assertEqual(called, ["https://www.nimblize.ai/platform"])
        self.assertEqual(crawled[0]["skipped"], "robots")
        self.assertEqual(refresh_google_token("id", "secret", "refresh", _opener(b'{"access_token":"ya29.test"}')), "ya29.test")
        with self.assertRaises(CollectionError):
            refresh_google_token("id", "secret", "refresh", _opener(b"{}"))

    def test_crux_and_crawl_persist(self):
        os.environ["SEO_GOOGLE_API_KEY"] = "key"
        os.environ["SEO_PRIORITY_URL"] = "https://www.nimblize.ai/platform"
        raw = b'{"record":{"metrics":{"largest_contentful_paint":{"percentiles":{"p75":1800}},"interaction_to_next_paint":{"percentiles":{"p75":120}},"cumulative_layout_shift":{"percentiles":{"p75":0.05}}}}}'
        result = run_job("crux_priority", opener=_opener(raw))
        self.assertEqual(result["status"], "succeeded")
        robots = Path(self.tmp.name) / "robots.txt"
        robots.write_text("User-agent: *\nDisallow: /admin\n", encoding="utf-8")
        os.environ["SEO_ROBOTS_TXT_PATH"] = str(robots)
        os.environ["SEO_CRAWL_URLS"] = "https://www.nimblize.ai/admin,https://www.nimblize.ai/platform"

        def fetcher(url):
            if "/admin" in url:
                raise AssertionError("disallowed URL was fetched")
            return {
                "url": url,
                "status": 200,
                "indexable": True,
                "title": "Platform",
                "h1": "Platform",
                "canonical": url,
                "robots": "index,follow",
                "links": ["/customers"],
                "word_count": 120,
                "jsonld_count": 1,
            }

        crawl = run_job("technical_crawl", fetcher=fetcher)
        self.assertEqual(crawl["rows"], 1)
        connection = store.connect()
        rows = store.rows(
            connection,
            """SELECT pages.url AS url, technical_audits.indexable AS indexable,
            technical_audits.lcp_ms AS lcp_ms, technical_audits.title AS title
            FROM pages JOIN technical_audits ON pages.id = technical_audits.page_id""",
        )
        connection.close()
        by_url = {row["url"]: row for row in rows}
        self.assertEqual(by_url["https://www.nimblize.ai/platform"]["lcp_ms"], 1800)
        self.assertEqual(by_url["https://www.nimblize.ai/platform"]["title"], "Platform")
        self.assertEqual(by_url["https://www.nimblize.ai/admin"]["indexable"], 0)

    def test_feature_registry_matches_config(self):
        import yaml

        registry = yaml.safe_load((Path(__file__).resolve().parents[1] / "feature_registry.yaml").read_text(encoding="utf-8"))
        self.assertEqual(registry["features"], FEATURES)
        self.assertEqual(registry["forbidden"], LEAKY_COLUMNS)
        self.assertEqual(registry["version"], "registry-v1")


if __name__ == "__main__":
    unittest.main()
