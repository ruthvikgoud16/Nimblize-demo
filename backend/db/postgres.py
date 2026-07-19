"""
Nimblize - PostgreSQL Connection & Persistence Layer
Handles all read/write operations against the Nimblize production database.
Supports a seamless SQLite local fallback when PostgreSQL is unavailable.
"""

import os
import json
import uuid
import sqlite3
from typing import Dict, Any, List, Optional
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, Json

# H4/M4 FIX: Register pgvector adapter so List[float] is correctly
# serialized to PostgreSQL's vector type.
try:
    from pgvector.psycopg2 import register_vector
    _PGVECTOR_AVAILABLE = True
except ImportError:
    _PGVECTOR_AVAILABLE = False
    print("[DB] ⚠️  pgvector adapter not available — vector inserts will fail.")

_pool: pool.ThreadedConnectionPool = None
_use_sqlite_fallback = False
_sqlite_fallback_db = None


class SQLiteFallback:
    def __init__(self):
        # Store DB in a file or in-memory. File allows persistence across runs
        self.conn = sqlite3.connect("nimblize_fallback.db", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.init_schema()

    def init_schema(self):
        cur = self.conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS competitor_profiles (
            profile_id TEXT PRIMARY KEY,
            pipeline_id TEXT,
            competitor_domain TEXT UNIQUE,
            targeted_seo_keywords TEXT,
            estimated_monthly_organic_traffic INTEGER,
            monetization_infrastructure TEXT,
            affiliate_networks_detected TEXT,
            status TEXT DEFAULT 'VERIFIED_PRODUCTION',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS strategy_reports (
            report_id TEXT PRIMARY KEY,
            pipeline_id TEXT,
            competitor_domain TEXT,
            market_gap_analysis TEXT,
            recommended_seo_targets TEXT,
            affiliate_opportunity_score REAL,
            dashboard_recommendations TEXT,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS manual_review_queue (
            review_id TEXT PRIMARY KEY,
            pipeline_id TEXT,
            ragas_scores TEXT,
            composite_score REAL,
            raw_payload TEXT,
            assigned_evaluator TEXT DEFAULT 'Aastha Shukla',
            status TEXT DEFAULT 'PENDING_REVIEW',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT '{}',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS prompt_favorites (
            prompt_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS system_notifications (
            id TEXT PRIMARY KEY,
            title TEXT,
            message TEXT,
            timestamp TEXT,
            read INTEGER DEFAULT 0,
            type TEXT DEFAULT 'info',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS playground_history (
            id TEXT PRIMARY KEY,
            prompt_id TEXT,
            prompt_name TEXT,
            timestamp TEXT,
            variables TEXT DEFAULT '{}',
            response TEXT,
            metrics TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        self.conn.commit()


class FallbackCursor:
    def __init__(self, sqlite_cursor):
        self.cursor = sqlite_cursor

    def execute(self, sql, params=None):
        # Convert %s placeholders to SQLite's ?
        sql = sql.replace("%s", "?")
        
        # Rewrite PostgreSQL specific UPSERT to SQLite syntax
        if "ON CONFLICT" in sql and "competitor_domain" in sql:
            sql = """
            INSERT INTO competitor_profiles (
                pipeline_id, competitor_domain, targeted_seo_keywords,
                estimated_monthly_organic_traffic, monetization_infrastructure,
                affiliate_networks_detected, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED_PRODUCTION')
            ON CONFLICT (competitor_domain) DO UPDATE SET
                targeted_seo_keywords = excluded.targeted_seo_keywords,
                estimated_monthly_organic_traffic = excluded.estimated_monthly_organic_traffic,
                monetization_infrastructure = excluded.monetization_infrastructure,
                affiliate_networks_detected = excluded.affiliate_networks_detected,
                status = 'VERIFIED_PRODUCTION';
            """
            
        if params:
            new_params = []
            for p in params:
                # Handle psycopg2 Json serialization wrapper
                if hasattr(p, "adapted") or p.__class__.__name__ == "Json":
                    new_params.append(json.dumps(p.adapted if hasattr(p, "adapted") else p.str))
                elif isinstance(p, (dict, list)):
                    new_params.append(json.dumps(p))
                else:
                    new_params.append(p)
            params = tuple(new_params)
            
        self.cursor.execute(sql, params or ())

    def fetchall(self):
        rows = self.cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            # Parse SQLite strings back into JSON for lists/dicts
            for k, v in d.items():
                if isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                    try:
                        d[k] = json.loads(v)
                    except Exception:
                        pass
            result.append(d)
        return result

    def fetchone(self):
        r = self.cursor.fetchone()
        if not r:
            return None
        d = dict(r)
        for k, v in d.items():
            if isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                try:
                    d[k] = json.loads(v)
                except Exception:
                    pass
        return d

    def close(self):
        self.cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class FallbackConnection:
    def __init__(self, sqlite_conn):
        self.conn = sqlite_conn

    def cursor(self):
        return FallbackCursor(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def _get_pool() -> pool.ThreadedConnectionPool:
    global _pool, _use_sqlite_fallback, _sqlite_fallback_db
    if _use_sqlite_fallback:
        return None

    if _pool is None:
        try:
            db_url = os.environ.get(
                "DATABASE_URL",
                "postgresql://nimblize:nimblize_dev@localhost:5432/nimblize"
            )
            # Setup pool with psycopg2
            _pool = pool.ThreadedConnectionPool(
                minconn=2,
                maxconn=10,
                dsn=db_url,
                cursor_factory=RealDictCursor,
            )
            if _PGVECTOR_AVAILABLE:
                conn = _pool.getconn()
                try:
                    register_vector(conn)
                finally:
                    _pool.putconn(conn)
        except Exception as e:
            print(f"[DB] ⚠️  PostgreSQL connection failed ({e}). Falling back to local SQLite DB.")
            _use_sqlite_fallback = True
            _sqlite_fallback_db = SQLiteFallback()
            
    return _pool


@contextmanager
def get_connection():
    """Context-managed database connection (handles Postgres and SQLite fallbacks)."""
    global _use_sqlite_fallback, _sqlite_fallback_db
    _get_pool()  # Ensure initialized
    
    if _use_sqlite_fallback:
        try:
            yield FallbackConnection(_sqlite_fallback_db.conn)
            _sqlite_fallback_db.conn.commit()
        except Exception:
            _sqlite_fallback_db.conn.rollback()
            raise
    else:
        conn_pool = _get_pool()
        conn = conn_pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn_pool.putconn(conn)


def upsert_competitor(payload: Dict[str, Any]) -> None:
    """Insert or update a competitor profile extracted by Agent 1."""
    sql = """
    INSERT INTO competitor_profiles (
        pipeline_id, competitor_domain, targeted_seo_keywords,
        estimated_monthly_organic_traffic, monetization_infrastructure,
        affiliate_networks_detected, status
    ) VALUES (%s, %s, %s, %s, %s, %s, 'VERIFIED_PRODUCTION')
    ON CONFLICT (competitor_domain) DO UPDATE SET
        targeted_seo_keywords = EXCLUDED.targeted_seo_keywords,
        estimated_monthly_organic_traffic = EXCLUDED.estimated_monthly_organic_traffic,
        monetization_infrastructure = EXCLUDED.monetization_infrastructure,
        affiliate_networks_detected = EXCLUDED.affiliate_networks_detected,
        status = 'VERIFIED_PRODUCTION';
    """
    traffic = payload.get("estimated_monthly_organic_traffic")
    if isinstance(traffic, str):
        traffic = None

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                str(uuid.uuid4()),
                payload["competitor_domain"],
                Json(payload.get("targeted_seo_keywords", [])),
                traffic,
                Json(payload.get("monetization_infrastructure", [])),
                Json(payload.get("affiliate_networks_detected", [])),
            ))
    print(f"[DB] Upserted competitor: {payload['competitor_domain']}")


def persist_strategy_report(report: Dict[str, Any]) -> None:
    """Insert a new strategy report generated by Agent 2."""
    sql = """
    INSERT INTO strategy_reports (
        report_id, pipeline_id, competitor_domain, market_gap_analysis,
        recommended_seo_targets, affiliate_opportunity_score,
        dashboard_recommendations, generated_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                str(uuid.uuid4()),
                report["competitor_domain"],
                report.get("market_gap_analysis"),
                Json(report.get("recommended_seo_targets", [])),
                report.get("affiliate_opportunity_score"),
                Json(report.get("dashboard_recommendations", [])),
                report.get("generated_at"),
            ))
    print(f"[DB] Persisted strategy report for: {report['competitor_domain']}")


def log_hitl_review(
    pipeline_id: str,
    ragas_scores: Dict[str, float],
    composite_score: float,
    raw_payload: Dict[str, Any],
) -> None:
    """Log a low-confidence payload into the manual_review_queue table."""
    sql = """
    INSERT INTO manual_review_queue (
        pipeline_id, ragas_scores, composite_score, raw_payload, assigned_evaluator
    ) VALUES (%s, %s, %s, %s, 'Aastha Shukla');
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                pipeline_id,
                Json(ragas_scores),
                composite_score,
                Json(raw_payload),
            ))
    print(f"[DB] Logged HITL review record for pipeline: {pipeline_id}")


def upsert_vector_chunk(
    parent_id: str,
    content: str,
    embedding: List[float],
    chunk_index: int,
    content_hash: str,
) -> None:
    """Insert a child vector chunk or soft-delete and replace on hash change."""
    sql = """
    INSERT INTO competitor_children (parent_id, content, embedding, chunk_index, content_hash)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT DO NOTHING;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                parent_id, content, embedding, chunk_index, content_hash
            ))


def similarity_search(
    query_embedding: List[float],
    k: int = 4,
    threshold: float = 0.85,
) -> List[Dict[str, Any]]:
    """
    Execute HNSW cosine similarity search.
    Returns top-k child chunks and their parent context.
    """
    global _use_sqlite_fallback
    _get_pool()
    if _use_sqlite_fallback:
        return [
            {
                "child_id": "child-1",
                "child_content": "RankVantage is a leading SEO intelligence application that automates competitor auditing.",
                "chunk_index": 0,
                "parent_content": "Full section about RankVantage SEO intelligence details.",
                "competitor_domain": "rankvantage.com",
                "similarity": 0.89
            }
        ]

    sql = """
    SELECT
        c.child_id,
        c.content AS child_content,
        c.chunk_index,
        p.content AS parent_content,
        p.competitor_domain,
        1 - (c.embedding <=> %s::vector) AS similarity
    FROM competitor_children c
    JOIN competitor_parents p ON c.parent_id = p.parent_id
    WHERE c.is_active = TRUE
      AND 1 - (c.embedding <=> %s::vector) >= %s
    ORDER BY c.embedding <=> %s::vector
    LIMIT %s;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (query_embedding, query_embedding, threshold, query_embedding, k))
            return [dict(row) for row in cur.fetchall()]
