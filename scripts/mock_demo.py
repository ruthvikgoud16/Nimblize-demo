#!/usr/bin/env python3
"""
Nimblize Phase 4 — Mock Pipeline Runner
Simulates the entire LangGraph state machine, Agent 1 & Agent 2 execution, 
RAGAS evaluation scoring, PII redaction, self-correction/retry loops, 
PostgreSQL persistence, and Redis queue/HITL routing.

Run this script to preview the exact console flows without requiring 
PostgreSQL, Redis, or an active OpenAI API key.
"""

import sys
import os
import uuid
import time
from typing import Dict, Any, List

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ─────────────────────────────────────────────────────────────────────────────
# 1. Mock Infrastructure Layers
# ─────────────────────────────────────────────────────────────────────────────
class MockRedis:
    def __init__(self, *args, **kwargs):
        self.db = {}
    def get(self, key):
        return self.db.get(key)
    def set(self, key, value, *args, **kwargs):
        self.db[key] = value
        return True
    def setex(self, key, time, value):
        self.db[key] = value
        return True
    def rpush(self, key, value):
        if key not in self.db:
            self.db[key] = []
        self.db[key].append(value)
        return len(self.db[key])
    def blpop(self, keys, timeout=0):
        return None
    def evalsha(self, *args, **kwargs):
        return [1, 29] # Allowed, 29 tokens left
    def script_load(self, *args, **kwargs):
        return "mock_sha"
    def keys(self, pattern):
        return [k for k in self.db.keys() if k.startswith(pattern.replace("*", ""))]

class MockCursor:
    def execute(self, *args, **kwargs):
        pass
    def fetchall(self):
        return []
    def close(self):
        pass

class MockConnection:
    def cursor(self):
        return MockCursor()
    def commit(self):
        pass
    def rollback(self):
        pass
    def close(self):
        pass

class MockPool:
    def getconn(self):
        return MockConnection()
    def putconn(self, conn):
        pass
    def closeall(self):
        pass

# Apply mocks to redis and psycopg2 before importing pipeline modules
import sys
from unittest.mock import MagicMock

sys.modules['redis'] = MagicMock()
sys.modules['redis'].Redis = MockRedis

sys.modules['psycopg2'] = MagicMock()
sys.modules['psycopg2'].connect = lambda *args, **kwargs: MockConnection()
sys.modules['psycopg2.pool'] = MagicMock()
sys.modules['psycopg2.pool'].ThreadedConnectionPool = lambda *args, **kwargs: MockPool()

# Mock pgvector
sys.modules['pgvector'] = MagicMock()
sys.modules['pgvector.psycopg2'] = MagicMock()

# Now import the pipeline components
from backend.middleware.pii_filter import redact_pii
from backend.schemas.competitor import PayloadStatus

# ─────────────────────────────────────────────────────────────────────────────
# 2. Seed Inputs
# ─────────────────────────────────────────────────────────────────────────────
SEED_SUCCESS = """
RankVantage operates a B2B SaaS marketing analytics platform targeting enterprise clients. They rank for keywords including 'SaaS attribution dashboard', 'B2B marketing ROI', and 'enterprise campaign analytics'. SimilarWeb estimates 120,000 monthly organic visits. Revenue is generated through software licensing (annual contracts) and a partner program via Impact Radius. They also operate an affiliate program through ShareASale for mid-market resellers. CEO: John Smith (john.smith@rankvantage.com, +1-512-555-0147).
"""

SEED_HITL = """
We are the best company in the world. Everything is amazing. Buy our services now. Low price and fast shipping guaranteed!
"""

SEED_GARBAGE = """
xkcd random noise $$## no structure here 12345 beep boop
"""

# ─────────────────────────────────────────────────────────────────────────────
# 3. Flow Simulators
# ─────────────────────────────────────────────────────────────────────────────

def run_successful_flow():
    pipeline_id = str(uuid.uuid4())
    print(f"\n{'='*76}")
    print(f"  FLOW 1: SUCCESSFUL PIPELINE RUN (RankVantage)")
    print(f"  Pipeline ID: {pipeline_id}")
    print(f"{'='*76}")
    
    # Node 1: PII Filter
    print(f"\n[Step 1/6] Running node: pii_filter")
    cleaned_text = redact_pii(SEED_SUCCESS)
    print(f"  Original PII: john.smith@rankvantage.com, +1-512-555-0147")
    print(f"  Cleaned text: ... CEO: John Smith (<EMAIL_ADDRESS>, <PHONE_NUMBER>).")
    
    # Node 2: Extraction (Agent 1)
    print(f"\n[Step 2/6] Running node: extraction (Agent 1)")
    print("  [Agent 1] Analyzing text under gpt-4o-mini structured output contract...")
    extracted_data = {
        "competitor_domain": "RankVantage",
        "targeted_seo_keywords": ["SaaS attribution dashboard", "B2B marketing ROI", "enterprise campaign analytics"],
        "estimated_monthly_organic_traffic": 120000,
        "monetization_infrastructure": ["software licensing", "partner program"],
        "affiliate_networks_detected": ["Impact Radius", "ShareASale"]
    }
    print(f"  [Agent 1] ✅ Extraction succeeded on attempt 1 for domain: RankVantage")
    print(f"  Extracted Data:\n    - Domain: {extracted_data['competitor_domain']}\n    - Traffic: {extracted_data['estimated_monthly_organic_traffic']} visits/mo\n    - Keywords: {extracted_data['targeted_seo_keywords']}")

    # Node 3: Strategy (Agent 2)
    print(f"\n[Step 3/6] Running node: strategy (Agent 2)")
    print("  [Agent 2] Synthesizing strategic insights via gpt-4o...")
    strategy_report = {
        "competitor_domain": "RankVantage",
        "market_gap_analysis": "RankVantage has a strong footprint in enterprise SaaS keyword attribution but leaves an open niche for mid-market and reseller-specific attribution models. Their monetization rely heavily on annual contracts, creating an opportunity for a transactional monthly self-serve alternative.",
        "recommended_seo_targets": ["mid-market SaaS attribution", "self-serve marketing ROI tool", "reseller campaign analytics"],
        "affiliate_opportunity_score": 0.85,
        "dashboard_recommendations": ["Build comparative dashboard for reseller programs", "Incorporate transactional attribution templates"]
    }
    print(f"  [Agent 2] ✅ Strategy report generated for: {strategy_report['competitor_domain']}")
    print(f"  Affiliate Opportunity Score: {strategy_report['affiliate_opportunity_score']}")
    
    # Node 4: Evaluation (RAGAS)
    print(f"\n[Step 4/6] Running node: evaluate (RAGAS LLM-as-a-judge)")
    ragas_scores = {
        "faithfulness": 0.96,
        "answer_relevancy": 0.94,
        "context_recall": 0.92
    }
    composite = sum(ragas_scores.values()) / len(ragas_scores)
    print(f"  [RAGAS] ✅ PASS | Domain: RankVantage | Faithfulness={ragas_scores['faithfulness']:.2f} | Relevancy={ragas_scores['answer_relevancy']:.2f} | Recall={ragas_scores['context_recall']:.2f} | Composite={composite:.2f}")

    # Node 5: Confidence Gate
    print(f"\n[Step 5/6] Confidence Gate Router")
    print(f"  Composite Score ({composite:.2f}) >= Threshold (0.85)")
    print(f"  Decision: ROUTING TO PERSIST NODE")

    # Node 6: Persist
    print(f"\n[Step 6/6] Running node: persist")
    print(f"  [DB] ✅ Ingesting competitor profile into PostgreSQL 'competitor_profiles'...")
    print(f"  [DB] ✅ Saving strategy report into PostgreSQL 'strategy_reports'...")
    print(f"  [DB] ✅ Pipeline {pipeline_id} persisted to production.")
    print(f"\n  Final Pipeline Status: {PayloadStatus.VERIFIED_PRODUCTION.value}")


def run_hitl_flow():
    pipeline_id = str(uuid.uuid4())
    print(f"\n{'='*76}")
    print(f"  FLOW 2: HIGH-CONFIDENCE FAILURE → HITL ROUTE")
    print(f"  Pipeline ID: {pipeline_id}")
    print(f"{'='*76}")
    
    # Node 1: PII Filter
    print(f"\n[Step 1/6] Running node: pii_filter")
    print(f"  [PII Filter] ✅ PII redaction complete for pipeline: {pipeline_id}")
    
    # Node 2: Extraction (Agent 1)
    print(f"\n[Step 2/6] Running node: extraction (Agent 1)")
    extracted_data = {
        "competitor_domain": "NOT_DETECTED",
        "targeted_seo_keywords": [],
        "estimated_monthly_organic_traffic": "NOT_DETECTED",
        "monetization_infrastructure": [],
        "affiliate_networks_detected": []
    }
    print(f"  [Agent 1] ✅ Extraction completed with warnings: Domain is 'NOT_DETECTED'")
    
    # Node 3: Strategy (Agent 2)
    print(f"\n[Step 3/6] Running node: strategy (Agent 2)")
    strategy_report = {
        "competitor_domain": "NOT_DETECTED",
        "market_gap_analysis": "Minimal competitive signal detected. The input text contains sales copy with no structure or data points regarding traffic, SEO targets, or monetization vectors.",
        "recommended_seo_targets": [],
        "affiliate_opportunity_score": 0.0,
        "dashboard_recommendations": []
    }
    print(f"  [Agent 2] ✅ Strategy report generated with empty insights.")

    # Node 4: Evaluation (RAGAS)
    print(f"\n[Step 4/6] Running node: evaluate (RAGAS LLM-as-a-judge)")
    ragas_scores = {
        "faithfulness": 0.45,
        "answer_relevancy": 0.50,
        "context_recall": 0.60
    }
    composite = sum(ragas_scores.values()) / len(ragas_scores)
    print(f"  [RAGAS] ⚠️  FAIL | Domain: NOT_DETECTED | Faithfulness={ragas_scores['faithfulness']:.2f} | Relevancy={ragas_scores['answer_relevancy']:.2f} | Recall={ragas_scores['context_recall']:.2f} | Composite={composite:.2f}")
    
    # Node 5: Confidence Gate
    print(f"\n[Step 5/6] Confidence Gate Router")
    print(f"  Composite Score ({composite:.2f}) < Threshold (0.85)")
    print(f"  Decision: ROUTING TO QUEUE_HITL NODE")

    # Node 6: Queue HITL
    print(f"\n[Step 6/6] Running node: queue_hitl")
    print(f"  [Queue] ⚠️  Pipeline {pipeline_id} flagged (score={composite:.2f}). Queuing for HITL review.")
    print(f"  [Queue] 📥 Notification job enqueued in Redis queue 'nimblize:notification_queue'.")
    print(f"  [NotificationWorker] Dispatched Slack webhook alert to channel #nimblize-alerts ✅")
    print(f"  [NotificationWorker] Dispatched SendGrid email notification to aastha@nimblize.ai ✅")
    print(f"  [DB] ✅ Logged HITL review record to 'manual_review_queue' table:")
    print(f"    - Review ID: {str(uuid.uuid4())}")
    print(f"    - Assigned Reviewer: Aastha Shukla")
    print(f"    - Pipeline Score: {composite:.2f}")
    print(f"\n  Final Pipeline Status: {PayloadStatus.FLAGGED_FOR_HUMAN_REVIEW.value}")


def run_dead_letter_flow():
    pipeline_id = str(uuid.uuid4())
    print(f"\n{'='*76}")
    print(f"  FLOW 3: RETRY LOOP EXHAUSTION → DEAD LETTER ROUTE")
    print(f"  Pipeline ID: {pipeline_id}")
    print(f"{'='*76}")
    
    # Node 1: PII Filter
    print(f"\n[Step 1/4] Running node: pii_filter")
    print(f"  [PII Filter] ✅ PII redaction complete.")

    # Node 2: Extraction loop (Agent 1 validation retries)
    print(f"\n[Step 2/4] Running node: extraction (Agent 1)")
    print("  [Agent 1] Attempt 1/3: Parsing input schema...")
    print("  [Agent 1] ⚠️  Attempt 1/3 failed: ValidationError: 'competitor_domain' field missing.")
    
    print("\n  [Agent 1] Attempt 2/3: Self-correction retry...")
    print("  [Agent 1] ⚠️  Attempt 2/3 failed: ValidationError: 'estimated_monthly_organic_traffic' must be int.")
    
    print("\n  [Agent 1] Attempt 3/3: Self-correction retry...")
    print("  [Agent 1] ⚠️  Attempt 3/3 failed: ValidationError: Could not extract valid schema structure.")
    
    print(f"\n[Step 3/4] Extraction Route Decision")
    print("  Attempts (3) >= Max Retries (3)")
    print("  Decision: ROUTING TO DEAD_LETTER NODE")

    # Node 4: Dead Letter
    print(f"\n[Step 4/4] Running node: dead_letter")
    print(f"  [Dead Letter] ❌ Pipeline {pipeline_id} failed extraction after 3 attempts.")
    print(f"  [Queue] 💀 Job pushed to Redis Dead Letter Queue 'nimblize:dead_letter_queue'.")
    print(f"\n  Final Pipeline Status: {PayloadStatus.DEAD_LETTER.value}")


# ─────────────────────────────────────────────────────────────────────────────
# Main Runner
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run_successful_flow()
    time.sleep(1)
    run_hitl_flow()
    time.sleep(1)
    run_dead_letter_flow()
