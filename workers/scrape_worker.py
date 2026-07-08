"""
Nimblize - Competitor Scrape Worker
Runs every 72 hours (via cron or Celery beat).
Fetches URLs from PostgreSQL competitor_targets table, scrapes pages,
and submits raw text to the LangGraph pipeline for processing.

Schedule: 0 */72 * * * (every 72 hours)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import time
import httpx
from bs4 import BeautifulSoup
from backend.agents.langgraph_orchestrator import run_pipeline
from backend.db.postgres import get_connection

SCRAPE_INTERVAL_HOURS = 72
REQUEST_TIMEOUT = 15
USER_AGENT = (
    "Mozilla/5.0 (compatible; NimblizeBot/4.2; +https://nimblize.ai/bot)"
)


def fetch_competitor_urls() -> list[dict]:
    """Load active competitor URLs from the database."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT competitor_domain, source_url FROM competitor_parents "
                "WHERE is_active = TRUE ORDER BY last_checked_at ASC LIMIT 50;"
            )
            return [dict(row) for row in cur.fetchall()]


def scrape_page(url: str) -> str:
    """Fetch and parse plain text from a competitor URL."""
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        resp = client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove script and style blocks
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def run_scrape_cycle() -> None:
    """Execute one full scrape cycle over all active competitor URLs."""
    targets = fetch_competitor_urls()
    print(f"[ScrapeWorker] 🔍 Starting cycle: {len(targets)} targets.")

    for target in targets:
        url = target.get("source_url")
        domain = target.get("competitor_domain", "unknown")

        if not url:
            print(f"[ScrapeWorker] ⚠️  No URL for {domain}. Skipping.")
            continue

        try:
            print(f"[ScrapeWorker] → Scraping: {url}")
            raw_text = scrape_page(url)

            if len(raw_text.strip()) < 100:
                print(f"[ScrapeWorker] ⚠️  Too little content from {url}. Skipping.")
                continue

            # Submit to the full LangGraph pipeline
            result = run_pipeline(raw_text=raw_text)
            print(
                f"[ScrapeWorker] ✅ {domain} → Pipeline status: {result.get('status')} "
                f"| RAGAS: {result.get('ragas_scores', {})}"
            )

        except Exception as e:
            print(f"[ScrapeWorker] ❌ Error scraping {url}: {e}")
            continue

        # Polite crawl delay
        time.sleep(2)

    print("[ScrapeWorker] ✅ Scrape cycle complete.")


if __name__ == "__main__":
    run_scrape_cycle()
