"""Technical parser from guide section 6.

The HTTP fetcher adds timeouts and retries. Parsing is separate so a saved
HTML body can be reprocessed without fetching it again.
"""

from __future__ import annotations

import time
from typing import Any, Callable

import httpx
from lxml import html as lhtml


class FetchError(RuntimeError):
    pass


def parse_html(url: str, body: str, status: int = 200) -> dict[str, Any]:
    document = lhtml.fromstring(body or "<html></html>")
    title_nodes = document.xpath("//title/text()")
    title = " ".join(t.strip() for t in title_nodes if t.strip())
    h1s = [t.strip() for t in document.xpath("//h1//text()") if t.strip()]
    canonicals = document.xpath('//link[@rel="canonical"]/@href')
    robots = " ".join(document.xpath('//meta[translate(@name,"ROBOTS","robots")="robots"]/@content')).lower()
    jsonld = document.xpath('//script[@type="application/ld+json"]/text()')
    text = " ".join(t.strip() for t in document.xpath("//body//text()") if t.strip())
    links = document.xpath("//a[@href]/@href")
    indexable = status < 400 and "noindex" not in robots
    return {
        "url": url,
        "status": status,
        "title": title,
        "h1": h1s[0] if h1s else "",
        "h1_count": len(h1s),
        "canonical": canonicals[0] if canonicals else "",
        "robots": robots,
        "indexable": indexable,
        "jsonld_count": len(jsonld),
        "text": text,
        "word_count": len(text.split()),
        "links": links,
        "broken_title": title == "",
    }


def fetch_url(url: str, client: httpx.Client | None = None, attempts: int = 3) -> dict[str, Any]:
    """Fetch one allowlisted URL. Failures raise. They do not become empty 200s."""
    owns = client is None
    client = client or httpx.Client(timeout=20.0, headers={"User-Agent": "NimblizeSEOResearch/1.0"})
    try:
        last_error: Exception | None = None
        for attempt in range(attempts):
            try:
                response = client.get(url, follow_redirects=True)
                parsed = parse_html(str(response.url), response.text, response.status_code)
                parsed["fetched"] = True
                return parsed
            except httpx.HTTPError as exc:
                last_error = exc
                time.sleep(0.2 * (attempt + 1))
        raise FetchError(f"fetch failed for {url}") from last_error
    finally:
        if owns:
            client.close()


def allowlisted(url: str, hosts: set[str]) -> bool:
    from urllib.parse import urlparse
    return urlparse(url).netloc in hosts
