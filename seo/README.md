# Nimblize SEO intelligence

This package is the Phase 7 SEO bounded context. The page 33 sample demo runs today: clone, run the pipeline, inspect the dataset, reproduce the model, open `/seo`, read why a recommendation exists, and see the before/after experiment. Live Search Console upsert, robots-aware crawl, and CrUX/PageSpeed persistence are in this increment. The production checklist stays open until the account inputs below are supplied.

Section 33 of the build guide is the checklist and the official resource list: Google Search Central and Search Essentials, the Google SEO Starter Guide, Search Console documentation, structured data documentation, the PageSpeed Insights API, and one vendor guide. Ahrefs is the default vendor. Semrush uses the same import shape when that is the subscription you already pay for.

## Decisions already made

These are not open questions.

- The ranker lives in `seo/`. The old Studio app stays in the repo and is not this ranker. The API prefix is `/api/seo`. The UI is Next.js at `/seo` and bypasses `AuthProvider`. There is no Streamlit app.
- `y_top10` is 1 when the Search Console average position on day D+28 is at most 10, for `type=web`, `device=MOBILE`, and the primary country (default `usa`). Same-day position, clicks, impressions, and CTR are leaky and are not features.
- Before a model exists, the score is `0.35 demand + 0.25 business relevance + 0.25 headroom + 0.15 expected value`. It contains no ranking probability. After a model exists, the guide weights are `0.25 / 0.20 / 0.30 / 0.15 / 0.10`. A noindex, robots block, or status of 500 or higher is P0 and sorts above both scores.
- Logistic regression serves until the histogram gradient booster's test PR-AUC is at least the logistic PR-AUC plus 0.03 and precision at 10 does not fall. Embeddings are LSA. `bge-m3` loads only when `SEO_EMBEDDING_MODEL` is set. Field vitals come from CrUX. Lab scores come from PageSpeed Insights. A failed API call is not stored as zeros.
- The later vendor for referring domains is Ahrefs. There is no link-scheme automation, no neural net, and no learning-to-rank in this build.
- Production requests need `Authorization: Bearer <SEO_API_TOKEN>`. If `ENV=production` and the token is unset, the API returns 500. A local demo with the token unset stays open.
- Search Console uses the refresh token when `SEO_GSC_REFRESH_TOKEN`, `SEO_GSC_CLIENT_ID`, and `SEO_GSC_CLIENT_SECRET` are set. Otherwise it uses `SEO_GSC_ACCESS_TOKEN`.
- The hosting target is Vercel for the Next.js app and Render plus Postgres for the API. That deploy is not wired in this increment. The running store is SQLite. `seo/schema.sql` is the Postgres DDL.
- The default recommendation owner is `seo-team`.

The previous Studio app under `frontend/src/app` (prompt library, playground, CIMS) is the earlier internship build. It is not this system. The new API does not call it.

## What a run produces

Search Console style observations go through validation, a technical parse, corpus TF-IDF plus LSA, lagged features, a time-ordered Top-10 model, the opportunity score, and the recommendation rules. Results land in `seo/data/nimblize_seo.db` and `seo/data/processed/`.

The label is Top 10 on day D+28 for mobile web in the site's primary country. Same-day position, clicks, impressions, and CTR are not model inputs. Lagged values are.

The model-free score is `0.35 demand + 0.25 business relevance + 0.25 headroom + 0.15 expected value`. It contains no model probability. After a model exists, the guide weights are `0.25 / 0.20 / 0.30 / 0.15 / 0.10`. A noindex, robots block, or 5xx is P0 and sorts above both scores.

Logistic regression is the baseline. A histogram gradient booster replaces it only when test PR-AUC improves by at least 0.03 and precision at 10 does not fall.

## Run it

```bash
python3 -m pip install -r seo/requirements.txt
python3 -m seo.pipeline
python3 -m unittest discover -s seo/tests -t /workspace
python3 -m uvicorn seo.api.app:app --port 8000
```

Then, in `frontend`:

```bash
npm run dev
```

Open [http://localhost:3000/seo](http://localhost:3000/seo). The section 25 screens are Overview, Queue, Technical, Content, Competitors, Rankings, Recommendations, Experiments, and Model. The queue links to the evidence for one keyword and page.

`seo/data/processed/features.csv` is the inspectable dataset. `seo/data/processed/model_card.json` is the evaluation record. Running the pipeline again reproduces both.

The sample property is `www.nimblize.ai` with weekly mobile observations through 2026-10-12. It exists so the demo runs before credentials are issued. It is labeled `source=sample-generator`.

## Live collection

These commands do not fill missing data with zeros. If a credential is absent the job is recorded as failed and the last good rows stay.

```bash
SEO_GSC_ACCESS_TOKEN=... python3 -m seo.jobs
python3 -c "from seo.jobs import run_job; run_job('search_console_refresh')"
```

| Variable | Used by |
| --- | --- |
| `SEO_GSC_SITE_URL` | Search Console property. Default `sc-domain:nimblize.ai` |
| `SEO_GSC_REFRESH_TOKEN` | Long-lived Google OAuth refresh token |
| `SEO_GSC_CLIENT_ID` | OAuth client id, required with the refresh token |
| `SEO_GSC_CLIENT_SECRET` | OAuth client secret, required with the refresh token |
| `SEO_GSC_ACCESS_TOKEN` | Short-lived token used when no refresh token is set |
| `SEO_GOOGLE_API_KEY` | PageSpeed Insights v5 and the Chrome UX Report API |
| `SEO_PRIORITY_URL` | URL for the daily performance jobs |
| `SEO_CRAWL_URLS` | Comma-separated allowlist for the weekly crawl |
| `SEO_ROBOTS_TXT_PATH` | Optional robots.txt file. A disallow is stored and not fetched |
| `SEO_API_TOKEN` | Required bearer token when `ENV=production` |
| `SEO_DB_PATH` | Override the SQLite file used by a local run |
| `SEO_PRIMARY_COUNTRY` | ISO-3 country. Default `usa` |

Search Console dates are requested through three days ago. Dimensions are date, query, page, device, and country, filtered to mobile and the primary country (`usa` in the sample). Field Core Web Vitals (LCP, INP, CLS) come from CrUX. PageSpeed supplies the lab diagnostics.

Set `ENV=production` and `SEO_API_TOKEN` before exposing the API. Without the token, local demo routes stay open so a clone can run.

## Schedule

`python3 -m seo.jobs` prints the cadence from the guide: daily Search Console and performance, weekly crawl and opportunity report, monthly drift review.

## What we need from you

The architecture decisions are already made. These are the only inputs that have to come from the Nimblize account:

The Search Console property is `sc-domain:nimblize.ai`. That domain property includes `www`, the apex host, and the other Nimblize subdomains. Set `SEO_GSC_SITE_URL` only when the verified property string in Search Console is different.

1. A Google OAuth client id, client secret, and refresh token with Search Console read access for `sc-domain:nimblize.ai`.
2. A Google API key with the PageSpeed Insights API and the Chrome UX Report API enabled, plus the priority URL to measure.
3. Confirm Ahrefs versus Semrush if you already pay for one. The default vendor is Ahrefs.
4. The primary country, if it is not the United States. Use the ISO-3 code Search Console expects, such as `usa`.
5. The sitemap URL and the crawl host allowlist.
6. Hosting confirmation if it should differ from Vercel for the Next.js app and Render plus Postgres for the API and worker.
7. The human owner name for recommendations, if it should differ from `seo-team`.

A live Search Console pull is stored with `source=search-console`. The sample generator refuses to overwrite those rows.

## Reading a recommendation

The queue row is the decision. The page view is the evidence: Search Console history, the technical parse, semantic scores, competitor gaps, internal-link suggestions, referring domains, and the model contributions. The experiment page compares the 28 days before a change with the 28 days after it and labels the result an association, not proof of cause.
