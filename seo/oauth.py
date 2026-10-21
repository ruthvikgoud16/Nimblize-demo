"""One-time Search Console consent. The client secret stays in the environment."""

from __future__ import annotations

import os
from urllib.parse import urlencode

from seo.config import GSC_REDIRECT_URI, GSC_SCOPE, load_local_env
from seo.collectors import refresh_google_token


def authorization_url(redirect_uri: str | None = None, client_id: str | None = None) -> str:
    load_local_env()
    client_id = client_id or os.getenv("SEO_GSC_CLIENT_ID")
    if not client_id:
        raise RuntimeError("SEO_GSC_CLIENT_ID is not configured")
    query = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri or os.getenv("SEO_GSC_REDIRECT_URI", GSC_REDIRECT_URI),
        "response_type": "code",
        "scope": GSC_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    })
    return "https://accounts.google.com/o/oauth2/v2/auth?" + query


def exchange_code(code: str, redirect_uri: str | None = None, opener=None) -> str:
    """Exchange one consent code. Returns the refresh token and does not print the secret."""
    load_local_env()
    client_id = os.getenv("SEO_GSC_CLIENT_ID")
    client_secret = os.getenv("SEO_GSC_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("SEO_GSC_CLIENT_ID and SEO_GSC_CLIENT_SECRET are required")
    from seo.collectors import _request

    payload = _request(
        "https://oauth2.googleapis.com/token",
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri or os.getenv("SEO_GSC_REDIRECT_URI", GSC_REDIRECT_URI),
        },
        {},
        opener or __import__("urllib.request", fromlist=["urlopen"]).urlopen,
        form=True,
    )
    refresh = payload.get("refresh_token")
    if not refresh:
        raise RuntimeError("Google token response did not include a refresh token")
    return str(refresh)


def access_token_from_refresh(opener=None) -> str:
    load_local_env()
    client_id = os.getenv("SEO_GSC_CLIENT_ID")
    client_secret = os.getenv("SEO_GSC_CLIENT_SECRET")
    refresh = os.getenv("SEO_GSC_REFRESH_TOKEN")
    if not client_id or not client_secret or not refresh:
        raise RuntimeError("Search Console refresh credentials are incomplete")
    if opener is None:
        return refresh_google_token(client_id, client_secret, refresh)
    return refresh_google_token(client_id, client_secret, refresh, opener)


def main() -> None:
    print(authorization_url())


if __name__ == "__main__":
    main()
