"""
Nimblize - PostgreSQL + pgvector Schema
Run this file once during infrastructure initialization (Week 1).

Provisions:
  - competitor_parents: stores macro parent chunks (1024 tokens)
  - competitor_children: stores granular child chunks (256 tokens) + 1536-dim embeddings
  - strategy_reports: persists Agent 2 output reports
  - manual_review_queue: HITL dashboard records for flagged payloads

HNSW Index:
  - m=16 (max node connections), ef_construction=64 (index build precision)
  - Uses vector_cosine_ops for cosine distance queries
"""

SCHEMA_SQL = """
-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Parent Chunks: Macro-level competitor content (1024 tokens)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_parents (
    parent_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_domain VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    source_url      TEXT,
    content_hash    VARCHAR(64) NOT NULL UNIQUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_parents_domain ON competitor_parents(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_parents_active  ON competitor_parents(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- Child Chunks: Granular data points (256 tokens) + Vector Embeddings (1536-dim)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_children (
    child_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id       UUID REFERENCES competitor_parents(parent_id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    embedding       VECTOR(1536) NOT NULL,
    chunk_index     INTEGER NOT NULL,
    content_hash    VARCHAR(64) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '72 hours'),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for sub-15ms cosine distance queries
CREATE INDEX IF NOT EXISTS idx_children_embedding ON competitor_children
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_children_active  ON competitor_children(is_active);
CREATE INDEX IF NOT EXISTS idx_children_expires ON competitor_children(expires_at);
CREATE INDEX IF NOT EXISTS idx_children_parent  ON competitor_children(parent_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Extracted Competitor Profiles (Agent 1 output)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_profiles (
    profile_id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id                     UUID NOT NULL,
    competitor_domain               VARCHAR(255) NOT NULL,
    targeted_seo_keywords           JSONB DEFAULT '[]',
    estimated_monthly_organic_traffic INTEGER,
    monetization_infrastructure     JSONB DEFAULT '[]',
    affiliate_networks_detected     JSONB DEFAULT '[]',
    status                          VARCHAR(50) DEFAULT 'VERIFIED_PRODUCTION',
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_domain ON competitor_profiles(competitor_domain);

-- ─────────────────────────────────────────────────────────────────────────────
-- Strategy Reports (Agent 2 output)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategy_reports (
    report_id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id                 UUID NOT NULL,
    competitor_domain           VARCHAR(255) NOT NULL,
    market_gap_analysis         TEXT,
    recommended_seo_targets     JSONB DEFAULT '[]',
    affiliate_opportunity_score FLOAT CHECK (affiliate_opportunity_score BETWEEN 0.0 AND 1.0),
    dashboard_recommendations   JSONB DEFAULT '[]',
    generated_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- HITL Manual Review Queue
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manual_review_queue (
    review_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id         UUID NOT NULL,
    ragas_scores        JSONB NOT NULL,
    composite_score     FLOAT NOT NULL,
    raw_payload         JSONB NOT NULL,
    assigned_evaluator  VARCHAR(255) DEFAULT 'Aastha Shukla',
    status              VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP WITH TIME ZONE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- User Settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
    key                 VARCHAR(100) PRIMARY KEY,
    value               JSONB DEFAULT '{}',
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Prompt Favorites
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_favorites (
    prompt_id           VARCHAR(50) PRIMARY KEY,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- System Notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_notifications (
    id                  VARCHAR(50) PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    timestamp           VARCHAR(50) NOT NULL,
    read                BOOLEAN DEFAULT FALSE,
    type                VARCHAR(50) DEFAULT 'info',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Playground Executions & Evaluations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playground_history (
    id                  VARCHAR(50) PRIMARY KEY,
    prompt_id           VARCHAR(50) NOT NULL,
    prompt_name         VARCHAR(255) NOT NULL,
    timestamp           VARCHAR(50) NOT NULL,
    variables           JSONB NOT NULL DEFAULT '{}',
    response            TEXT NOT NULL,
    metrics             JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Nightly maintenance: soft-expire stale vectors (run via cron at 02:00 UTC)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_stale_vectors()
RETURNS void AS $$
BEGIN
    UPDATE competitor_children
    SET is_active = FALSE
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE;

    DELETE FROM competitor_children
    WHERE is_active = FALSE
      AND expires_at < (CURRENT_TIMESTAMP - INTERVAL '7 days');

    RAISE NOTICE 'Stale vector cleanup complete at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- RBAC roles (compatible with PostgreSQL < 14)
DO $$ BEGIN CREATE ROLE app_gateway;     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE agent_worker;    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE hitl_dashboard;  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON competitor_children TO app_gateway;
GRANT INSERT ON competitor_children, competitor_parents TO app_gateway;

GRANT SELECT, INSERT, UPDATE ON competitor_parents, competitor_children,
    competitor_profiles, strategy_reports TO agent_worker;

GRANT SELECT, UPDATE ON manual_review_queue TO hitl_dashboard;
"""

if __name__ == "__main__":
    import psycopg2
    import os

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(SCHEMA_SQL)
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Nimblize database schema provisioned successfully.")
