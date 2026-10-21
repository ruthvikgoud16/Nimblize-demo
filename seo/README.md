# Nimblize SEO intelligence

This package implements the whole Phase 7 build guide: all 33 numbered sections in the PDF. Section 33 is the final checklist and the official resource list. It is the standard the build is checked against. It is not a separate guide.

The official resources named in section 33 are Google Search Central and Search Essentials, the Google SEO Starter Guide, Search Console documentation, structured data documentation, the PageSpeed Insights API, and one vendor guide. Ahrefs is the default vendor. Semrush uses the same import shape when that is the subscription you already have.

Section 32 is the demo flow inside that guide: clone, configure credentials, run the pipeline, inspect the dataset, reproduce the model, open the dashboard, see why a recommendation exists, and measure what happened after it. The sample property proves that flow before live credentials exist.

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
python3 -m unittest discover -s seo/tests -t .
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
SEO_GSC_ACCESS_TOKEN=... SEO_GSC_SITE_URL=https://www.nimblize.ai/ python3 -m seo.jobs
python3 -c "from seo.jobs import run_job; run_job('search_console_refresh')"
```

| Variable | Used by |
| --- | --- |
| `SEO_GSC_SITE_URL` | Exact Search Console property URL |
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

1. The exact Search Console property URL (`sc-domain:` or the `https` property string).
2. A Google OAuth client id, client secret, and refresh token with Search Console read access for that property.
3. A Google API key with the PageSpeed Insights API and the Chrome UX Report API enabled, plus the priority URL to measure.
4. Confirmation if you already pay for Semrush. Ahrefs is the default vendor for referring domains and keyword exports.
5. The primary country, if it is not the United States. Use the ISO-3 code Search Console expects, such as `usa`.
6. The sitemap URL and the crawl host allowlist.
7. Hosting confirmation if it should differ from Vercel for the Next.js app and Render plus Postgres for the API and worker.
8. The human owner name for recommendations, if it should differ from `seo-team`.

A live Search Console pull is stored with `source=search-console`. The sample generator refuses to overwrite those rows.

## Reading a recommendation

The queue row is the decision. The page view is the evidence: Search Console history, the technical parse, semantic scores, competitor gaps, internal-link suggestions, referring domains, and the model contributions. The experiment page compares the 28 days before a change with the 28 days after it and labels the result an association, not proof of cause.
