-- Production schema for the SEO intelligence store.
-- Local runs use the same tables in SQLite via seo/store.py.

CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    primary_country TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id),
    url TEXT NOT NULL UNIQUE,
    title TEXT
);

CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL UNIQUE,
    intent TEXT,
    business_relevance DOUBLE PRECISION,
    difficulty DOUBLE PRECISION,
    volume DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS observations (
    id BIGSERIAL PRIMARY KEY,
    keyword_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    url TEXT NOT NULL,
    obs_date DATE NOT NULL,
    device TEXT NOT NULL,
    country TEXT NOT NULL,
    search_type TEXT NOT NULL,
    position DOUBLE PRECISION,
    clicks INTEGER,
    impressions INTEGER,
    ctr DOUBLE PRECISION,
    source TEXT NOT NULL,
    collected_at TIMESTAMPTZ,
    run_id TEXT,
    UNIQUE (keyword_id, page_id, obs_date, device, country, search_type)
);

CREATE TABLE IF NOT EXISTS technical_audits (
    page_id TEXT NOT NULL,
    audited_at DATE NOT NULL,
    status INTEGER,
    indexable BOOLEAN,
    canonical TEXT,
    title TEXT,
    h1 TEXT,
    robots TEXT,
    lcp_ms DOUBLE PRECISION,
    inp_ms DOUBLE PRECISION,
    cls DOUBLE PRECISION,
    internal_links INTEGER,
    word_count INTEGER,
    jsonld_count INTEGER,
    PRIMARY KEY (page_id, audited_at)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    keyword_id TEXT,
    keyword TEXT,
    page_id TEXT,
    url TEXT,
    position DOUBLE PRECISION,
    impressions DOUBLE PRECISION,
    ctr DOUBLE PRECISION,
    probability DOUBLE PRECISION,
    model_free_score DOUBLE PRECISION,
    opportunity_score DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    priority TEXT,
    bottleneck TEXT,
    action TEXT,
    effort DOUBLE PRECISION,
    status TEXT,
    evidence_json JSONB
);

CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    keyword_id TEXT,
    page_id TEXT,
    url TEXT,
    keyword TEXT,
    change_date DATE,
    change_type TEXT,
    old_version TEXT,
    new_version TEXT,
    reason TEXT,
    owner TEXT,
    expected_outcome TEXT,
    position_before DOUBLE PRECISION,
    position_after DOUBLE PRECISION,
    clicks_before INTEGER,
    clicks_after INTEGER,
    result_kind TEXT
);

CREATE TABLE IF NOT EXISTS models (
    version TEXT PRIMARY KEY,
    feature_version TEXT,
    serving_name TEXT,
    promoted_boosting BOOLEAN,
    trained_through DATE,
    metrics_json JSONB,
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id TEXT PRIMARY KEY,
    job_name TEXT,
    status TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    message TEXT,
    rows_out INTEGER
);

CREATE TABLE IF NOT EXISTS drift (
    feature TEXT PRIMARY KEY,
    train_median DOUBLE PRECISION,
    recent_median DOUBLE PRECISION,
    relative_change DOUBLE PRECISION,
    flagged BOOLEAN
);
