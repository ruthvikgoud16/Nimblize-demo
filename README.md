# Nimblize Phase 4 — Production Implementation

**Domain:** AI & Automation | **Version:** 4.2.0-PROD
**Domain Leader:** Aastha Shukla
**CTO & Co-Founder:** Anshul Sinha
**Target Organization:** Nimblize
**Document Classification:** Production-Ready Engineering Blueprint

---

📄 **[Nimblize Future Implementation & Production Roadmap (PDF)](Nimblize_Future_Implementation_Roadmap.pdf)** — Architecture recommendations, scaling strategies, and proposed enhancements beyond Phase 4.

---

## 1. Project Overview

Nimblize is a high-performance competitor intelligence and product recommendation platform. This repository contains the Phase 4 production-ready implementation, providing:
* **B2B Growth Ecosystem:** An automated SEO intelligence pipeline that crawls competitor websites, extracts structured SEO and monetization indicators via Agentic self-correcting loops, runs LLM-as-a-judge quality evaluations (RAGAS), and gates results through strict confidence levels.
* **B2C Product Recommendation Engine:** Sub-15ms semantic recommendation capabilities powered by hierarchical parent-child chunking and HNSW vector similarity search over PostgreSQL pgvector, optimized with Redis semantic caches.

---

## 2. System Architecture

```mermaid
graph TD
    User([User / Client])
    Gateway[FastAPI Gateway]
    Auth[JWT Auth & Redis Rate Limiter]
    Cache[Redis Semantic Cache]
    Orchestrator[LangGraph Orchestrator]
    PII[Presidio PII Redaction]
    Agent1[Agent 1: Extraction Specialist]
    Agent2[Agent 2: Strategy Generator]
    Ragas[RAGAS Evaluator]
    DB[(PostgreSQL + pgvector)]
    Queue[Redis Notification Queue]
    Worker[Notification Worker]
    Slack[Slack Webhook]
    Sendgrid[SendGrid Email]
    PagerDuty[PagerDuty Incident]

    User -->|API Requests| Gateway
    Gateway --> Auth
    Auth -->|Check Cache| Cache
    Cache -->|Cache Hit| User
    Cache -->|Cache Miss| Orchestrator
    Orchestrator --> PII
    PII --> Agent1
    Agent1 -->|Self-Correction Loop / Retry| Agent1
    Agent1 --> Agent2
    Agent2 --> Ragas
    Ragas -->|Composite Score >= 0.85| DB
    Ragas -->|Composite Score < 0.85| Queue
    Queue --> Worker
    Worker --> Slack
    Worker --> Sendgrid
    Worker --> PagerDuty
    Worker -->|Log HITL| DB
```

---

## 3. LangGraph Execution Flow

```mermaid
stateDiagram-v2
    [*] --> PII_Filter
    PII_Filter --> Extraction
    Extraction --> Validation
    state Validation <<choice>>
    Validation --> Strategy : Successful Extraction
    Validation --> Extraction : Schema Error (Retry < 3)
    Validation --> Dead_Letter : Retry >= 3
    
    Strategy --> Evaluate
    Evaluate --> Confidence_Gate
    state Confidence_Gate <<choice>>
    Confidence_Gate --> Persist : RAGAS Score >= 0.85
    Confidence_Gate --> Queue_HITL : RAGAS Score < 0.85

    Persist --> [*]
    Queue_HITL --> [*]
    Dead_Letter --> [*]
```

---

## 4. Installation & Setup

### Prerequisites
* Docker & Docker Compose
* Python 3.12 (if running locally)
* PostgreSQL (with pgvector extension) & Redis (if running locally)

### Step-by-Step Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd nimblize
   ```
2. Create and configure your environment file:
   ```bash
   cp .env.example .env
   # Edit .env and supply your OPENAI_API_KEY and other credentials.
   ```
3. Set up a local Python virtual environment (if running without Docker):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python -m spacy download en_core_web_lg
   ```

---

## 5. Environment Variables

Configure these values in your `.env` file:

| Variable | Description | Default | Required |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI API Key for models and embeddings | - | **Yes** |
| `POSTGRES_PASSWORD` | Database password for PostgreSQL | `nimblize_dev` | No |
| `DATABASE_URL` | Full PostgreSQL connection URL | `postgresql://nimblize:nimblize_dev@postgres:5432/nimblize` | No |
| `REDIS_HOST` | Redis host address | `redis` (Docker) / `localhost` | No |
| `REDIS_PORT` | Redis port number | `6379` | No |
| `JWT_SECRET` | Secret key for generating JWT tokens | `nimblize-dev-secret` | **Yes (Prod)** |
| `ENV` | Environment identifier | `production` / `development` | No |
| `SLACK_WEBHOOK_URL` | Webhook URL for HITL Slack notifications | - | No |
| `SENDGRID_API_KEY` | SendGrid API Key for HITL email alerts | - | No |
| `PAGERDUTY_ROUTING_KEY` | PagerDuty integration key for incidents | - | No |

---

## 6. Running with Docker Compose

To build and start the entire production container stack:
```bash
# 1. Start database and cache first to allow healthchecks to succeed
docker compose up postgres redis -d

# 2. Wait 10 seconds, then run database migrations and schema provision
docker compose run --rm api python backend/db/schema.sql.py

# 3. Spin up all remaining services (API, Workers, Telemetry stack)
docker compose up --build -d
```

### Container Endpoints
* **FastAPI Gateway:** http://localhost:8000
* **API Swagger Documentation:** http://localhost:8000/docs
* **Prometheus Metrics Exporter:** http://localhost:9090
* **Grafana Dashboards:** http://localhost:3000 (Credentials: `admin` / `nimblize_admin`)
* **OTel Collector (gRPC):** http://localhost:4317

---

## 7. Running the API Locally (Development Mode)

If you prefer to run individual components locally:
```bash
# Start local Redis and Postgres services
# Then run:
source .venv/bin/activate

# 1. Provision the local database schema
python backend/db/schema.sql.py

# 2. Start the FastAPI gateway server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start the notification queue worker in a separate shell
python workers/notification_worker.py
```

---

## 8. Live Demo Walkthrough Flow

You can run our automated validation script to verify all pipelines in action:
```bash
./scripts/demo_test.sh http://localhost:8000
```

The script exercises these four core flows:

1. **Happy Path (Automatic Approval):**
   * Raw input containing rich competitor text (e.g. `RankVantage`) is sent.
   * Microsoft Presidio automatically redacts any PII.
   * Agent 1 extracts structured competitor statistics on the first try.
   * Agent 2 generates a qualitative strategic gap analysis report.
   * RAGAS score passes the `0.85` threshold.
   * Profile is saved in `competitor_profiles` and strategic insights in `strategy_reports`.
   
2. **HITL Review Queue Path (Low Confidence):**
   * Short or highly ambiguous competitor text is sent.
   * Extraction succeeds but RAGAS evaluation scores fall below `0.85`.
   * State machine flags the payload and triggers `node_queue_hitl`.
   * Job is enqueued in Redis; background notification worker dispatches alerts and logs the event to the `manual_review_queue` table.
   
3. **Dead-Letter Path (Failed Extraction):**
   * Unstructured garbage input (e.g. random noise) is sent.
   * Agent 1 Pydantic parsing fails and feeds the validation trace back into the model.
   * After 3 retries, the orchestrator terminates the loop and routes the payload to `DEAD_LETTER`.

4. **B2C Semantic Cache and Recommendation:**
   * A B2C recommendation query is submitted.
   * The system computes a semantic hash and checks the Redis cache.
   * On cache miss, it embeds the query and runs a pgvector similarity search over PostgreSQL.
   * The results are cached in Redis. Submitting a similar query again results in a sub-millisecond Cache Hit.
