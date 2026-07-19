# Nimblize Phase 4 — Final Internship Presentation Blueprint

**Target Presentation Duration:** 5–7 minutes  
**Intended Audience:** Domain Leader (Aastha Shukla), CTO & Co-Founder (Anshul Sinha), Internship Evaluation Panel  

---

## Slide 1: Project Title & Introduction

* **Slide Title:** Nimblize Phase 4: Production-Ready AI & Automation Architecture
* **Slide Content:**
  * **System Core:** Dual-Vector B2B Competitor Ingestion & B2C Product Recommendation Engine
  * **Intern Name:** Ruthvik Goud
  * **Internship Domain:** AI & Automation
  * **Mentorship Panel:** Aastha Shukla (Domain Leader) & Anshul Sinha (CTO & Co-Founder)
  * **Release Version:** 4.2.0-PROD (High-Reliability Architecture)
* **Visual Recommendation:** Dark slate blue background with bright accent details (representing a premium technical blueprint). Include the Nimblize logo on the top right and a clean, minimalist subtitle styling.
* **Speaker Notes:**
  > *"Good morning, members of the evaluation panel. Today, I am presenting the Phase 4 production implementation for Nimblize's core computing layers. This release integrates a B2B competitor intelligence pipeline and a B2C semantic recommendation engine into a single, unified backend. The focus of this phase was to transition the prototype into an audited, production-grade system capable of handling concurrent traffic safely, preventing data pollution with inline quality gates, and maintaining strict enterprise compliance."*

---

## Slide 2: Problem Statement

* **Slide Title:** The Challenges of Competitor Intelligence & Real-Time Recommendations
* **Slide Content:**
  * **B2B Competitor Challenge:** Raw web scraping yields unstructured, highly variable text formats that pollute databases.
  * **B2C Recommendation Challenge:** Serving product recommendations under high concurrent load requires sub-15ms speeds; direct LLM calls are too slow and expensive.
  * **Manual Processing Bottlenecks:** Manual data normalization by analysts limits data ingestion scalability and increases time-to-market.
  * **Factual Integrity Risks:** Unchecked AI generation suffers from hallucinated competitor traffic and false affiliate link alignments.
* **Visual Recommendation:** A two-column comparison card layout showing "B2B Unstructured Ingestion" on the left and "B2C Sub-15ms Query Latency" on the right, contrasted against a central column highlighting "Manual Ingestion Bottlenecks".
* **Speaker Notes:**
  > *"To understand the value of Phase 4, we must look at the problem statement. Nimblize handles competitor data ingestion for growth marketing and B2C product recommendations. Historically, scraping competitor landing pages was highly fragile; unstructured text is prone to structural drift, making automatic parsing difficult. Furthermore, serving B2C recommendations using direct LLM queries is too slow for consumer apps, adding prohibitive token costs and latency. Without quality control, bad data pollutes the database, leading to inaccurate recommendations."*

---

## Slide 3: Project Goal

* **Slide Title:** Engineering a Resilient, High-Performance Analytics Engine
* **Slide Content:**
  * **Automated Extraction:** Implement schema-enforced, self-correcting agentic parsing loops.
  * **Guaranteed Factual Quality:** Incorporate an automated inline quality gate that acts as a database circuit breaker.
  * **Sub-15ms Ingestion Latency:** Optimize B2C recommendations using vector similarity searches and semantic cache layers.
  * **Enterprise Security & Compliance:** Protect data integrity using PII filters and token-bucket rate limiters.
* **Visual Recommendation:** A quadrants chart highlighting the four pillars of the project: Automation, Quality Control, Performance, and Security.
* **Speaker Notes:**
  > *"Our goal for Phase 4 was to design and implement a fully automated system that guarantees data quality, high speed, and absolute security. Specifically, we wanted to achieve self-correcting schema extraction, protect the production database from hallucinations using an inline quality gate, guarantee sub-15ms recommendation latency using a semantic cache, and enforce strict security boundaries through PII scrubbing and token-bucket rate limiting."*

---

## Slide 4: High-Level System Architecture

* **Slide Title:** End-to-End System Ingestion Architecture
* **Slide Content:**
  * **FastAPI Gateway:** Exposes secure endpoints backed by JWT auth and Redis token-bucket rate limiters.
  * **LangGraph Orchestrator:** Manages the B2B pipeline state machine (`PipelineState` dict).
  * **Microsoft Presidio:** Anonymizes PII before sending data to external model APIs.
  * **Agentic Compute:** Orchestrates Agent 1 (Extraction) and Agent 2 (Strategy synthesis).
  * **RAGAS Evaluator:** Real-time quality check validating Faithfulness, Relevance, and Recall.
  * **PostgreSQL + pgvector:** Persists verified data and performs HNSW-indexed similarity searches.
  * **Telemetry:** Exports spans to an OTel Collector, scraped by Prometheus and visualized in Grafana.
* **Visual Recommendation:** Include a block diagram tracing: `User/Client` ➔ `FastAPI (Auth + Rate Limit)` ➔ `Semantic Cache Check` ➔ `LangGraph (PII -> Agent 1 -> Agent 2 -> RAGAS)` ➔ `PostgreSQL (pgvector)` / `Redis Queue (HITL)`.
* **Speaker Notes:**
  > *"Here is the high-level system architecture. The entry point is a FastAPI gateway that handles authentication and rate limiting. When a query is received, the gateway first checks the Redis Semantic Cache. If there is a cache miss, the request is routed to the LangGraph Orchestrator. The orchestrator runs a PII filter, triggers Agent 1 and Agent 2, evaluates the results using RAGAS, and either writes to PostgreSQL pgvector or redirects to a Redis queue for Human-in-the-loop review. Telemetry tracks all latency, cache hits, and errors in Prometheus."*

---

## Slide 5: Multi-Agent Architecture

* **Slide Title:** Separation of Concerns: Agent 1 (Extraction) & Agent 2 (Strategy)
* **Slide Content:**
  * **Agent 1 (Extraction Specialist):**
    * Model: `gpt-4o-mini` | Temperature: `0.0`
    * Enforces Pydantic schema using Structured Outputs API.
    * Captures validation errors and feeds them back into the prompt during retries.
  * **Agent 2 (Strategy Generator):**
    * Model: `gpt-4o` | Temperature: `0.4`
    * Accepts structured outputs from Agent 1 to perform qualitative SEO gap analysis.
  * **Rationale for Separation:** Agent 1 performs high-token, low-cost extraction with zero variance. Agent 2 uses a larger model for reasoning over structured facts, reducing costs by 70%.
* **Visual Recommendation:** A split-screen visual displaying Agent 1's strict input/output on the left and Agent 2's reasoning outputs on the right.
* **Speaker Notes:**
  > *"We split our agent tasks into two specialized nodes. Agent 1 is our Extraction Specialist. It runs on the cheaper gpt-4o-mini model at a temperature of 0.0, enforcing a strict schema with Pydantic. If extraction fails, it retries up to 3 times, passing the error logs back to the model to correct its output. Agent 2 is our Strategy Generator. It runs on the larger gpt-4o model at a temperature of 0.4. By separating these concerns, we ensure that the high-token extraction step is cheap, and the expensive reasoning step only runs on clean, verified facts."*

---

## Slide 6: RAG Pipeline & Vector DB Layer

* **Slide Title:** Hybrid Parent-Child Chunking & HNSW Vector Retrieval
* **Slide Content:**
  * **Parent-Child Chunking:**
    * Parent Chunks: Broad macro-context (1024 tokens) stored in database.
    * Child Chunks: Granular text segments (256 tokens) embedded using `text-embedding-3-small` (1536-dim).
  * **Retrieval Strategy:** Embed queries to match child chunks using cosine similarity, but retrieve and feed the parent chunk context to the generator.
  * **pgvector Database Configuration:**
    * HNSW Index: Configured with `m=16` and `ef_construction=64`.
    * Performance: Under 15ms similarity search latency on the production database.
* **Visual Recommendation:** A diagram illustrating parent chunks pointing to multiple nested child chunks, connected to the vector index.
* **Speaker Notes:**
  > *"To ensure that our strategic recommendations are highly accurate, we use a Parent-Child chunking strategy. Raw documents are split into parent chunks of 1024 tokens for context preservation, and child chunks of 256 tokens for high-precision embedding. During B2C queries, we match the user's search query against the small child chunk embeddings. We then retrieve the larger parent chunk context for generation. This combines high vector similarity matching with complete context retrieval. Searches execute on a pgvector HNSW index configured with m=16 for sub-15ms query speeds."*

---

## Slide 7: LangGraph State Machine Flow

* **Slide Title:** Stateful LangGraph Orchestration & Edge Routing
* **Slide Content:**
  * **Graph State:** Shared dictionary (`PipelineState`) mapping IDs, texts, extraction errors, and RAGAS scores.
  * **Node Map (7 Nodes):**
    * `pii_filter` ➔ `extraction` ➔ `strategy` ➔ `evaluate` ➔ `persist` ➔ `queue_hitl` ➔ `dead_letter`
  * **Conditional Edge 1:** `route_after_extraction` (Redirects to extraction retry, or dead-letter after 3 schema validation failures).
  * **Conditional Edge 2:** `route_after_evaluation` (Redirects to persist if composite score ≥ 0.85, else to queue_hitl).
* **Visual Recommendation:** A clean state-transition flowchart mapping out the nodes, loops, and conditional branches.
* **Speaker Notes:**
  > *"The state machine is built with LangGraph. It is governed by a TypedDict state that tracks all data extracted, errors, and validation scores. The graph starts at the PII filter, then runs extraction. If extraction succeeds, it proceeds to strategy and evaluation. If extraction fails, the conditional router either triggers a retry or sends the payload to the dead-letter queue. After evaluation, the confidence gate determines whether to write to PostgreSQL or route the payload to the HITL queue."*

---

## Slide 8: Evaluation Layer (RAGAS)

* **Slide Title:** Real-Time LLM-as-a-Judge Quality Evaluations
* **Slide Content:**
  * **Faithfulness:** Verifies strategy reports are grounded in raw texts, preventing hallucinations.
  * **Answer Relevance:** Checks if recommended SEO targets align with the competitor profile.
  * **Context Recall:** Validates if all extracted facts are present in the strategy report.
  * **Confidence Gate Thresholds:**
    * Faithfulness: `≥ 0.85` | Answer Relevance: `≥ 0.80` | Context Recall: `≥ 0.75`
    * Composite Gate: `0.85` (Average of the three scores)
  * **Circuit Breaker:** Prevents database insertions for runs scoring `< 0.85`.
* **Visual Recommendation:** A table showing the metrics, their description, their respective thresholds, and the composite gating logic.
* **Speaker Notes:**
  > *"The evaluation layer runs inline. Before any strategic report is persisted, we compute RAGAS scores. We measure Faithfulness to prevent hallucinations, Answer Relevance to ensure targets align with the competitor, and Context Recall to verify completeness. We require a composite score of 0.85. If a competitor report falls below this threshold, it fails the confidence gate. The circuit breaker catches it, blocks database persistence, and redirects the payload to the manual review queue."*

---

## Slide 9: Human-in-the-Loop (HITL) Workflow

* **Slide Title:** Resilient Queue-Backed Manual Review Pipeline
* **Slide Content:**
  * **Queue Architecture:** Low-confidence payloads are pushed to a Redis queue (`nimblize:notification_queue`).
  * **Notification Worker:** A background consumer process drains the queue and dispatches:
    * **Slack Alert:** Triggers warning webhook messages to developer channels.
    * **Email Alert:** Sends email summaries to evaluator Aastha Shukla via SendGrid.
    * **Database Entry:** Logs the payload to the `manual_review_queue` table.
  * **Business Rationale:** Ensures 100% data reliability; humans review ambiguous edge cases on a clean dashboard without blocking pipeline execution.
* **Visual Recommendation:** A flowchart showing a failed evaluation output feeding into a Redis Queue, which triggers the Notification Worker, alerting Slack/Email channels and the Postgres review table.
* **Speaker Notes:**
  > *"When the pipeline flags a run, it uses a Human-in-the-Loop workflow. The orchestrator pushes the payload to a Redis queue. A background worker drains this queue and dispatches alerts to Slack and email. It also logs the payload to the manual_review_queue table in the database. This allows domain leaders to audit flagged data on a clean dashboard. If the data is fixed and approved by a human, it is merged into production, ensuring data quality remains high."*

---

## Slide 10: Security & Monitoring Stack

* **Slide Title:** Middleware Security and OpenTelemetry Observability
* **Slide Content:**
  * **PII Redaction Middleware:** Microsoft Presidio local NER scans and redacts 10 sensitive entity types (emails, names, locations, credit cards) before API export.
  * **Token-Bucket Rate Limiter:** An atomic Lua script inside Redis limits users (30 req/min free; 300 req/min premium) to prevent denial of service.
  * **Distributed Tracing & Metrics:**
    * OpenTelemetry: Collects spans across routes and database connection pools.
    * Prometheus (Port 9090): Exposes metrics like pipeline RTT, agent TTFT, and semantic drift.
    * Grafana (Port 3000): Visualizes metrics and alerts developers if latency exceeds 2500ms.
* **Visual Recommendation:** A split-layout card showing "Security (Presidio, Rate Limiter)" on the left, and "Observability (OTel, Prometheus, Grafana)" on the right.
* **Speaker Notes:**
  > *"Security and monitoring are baked into our middleware. Microsoft Presidio redacts names, emails, and phone numbers before they leave our network. A token-bucket rate limiter running an atomic Lua script in Redis protects our endpoints. On the monitoring side, we use OpenTelemetry to collect trace spans. Prometheus exposes metrics like time-to-first-token and pipeline latency, which are scraped and visualized on Grafana. If latency spikes above 2.5 seconds, Grafana triggers an alert."*

---

## Slide 11: Cost Optimization & Cache Layer

* **Slide Title:** Reducing API Spend with Semantic Cache Layers
* **Slide Content:**
  * **Cache Mechanism:** Checks Redis database 2 before executing vector searches or LLM queries.
  * **Cosine Similarity Check:** Embeds incoming queries using `text-embedding-3-small`. Matches them against cached embeddings in Redis.
  * **Cache Hit Threshold:** If cosine distance is `≤ 0.15`, the cached response is served instantly.
  * **Business Value:** Bypasses LLM generation and vector searches, reducing API token costs by up to 60% and providing sub-millisecond responses.
* **Visual Recommendation:** A graph plotting cost reduction vs cache hit rate, or a flow diagram displaying the cache interception path.
* **Speaker Notes:**
  > *"To optimize API costs, we built a Semantic Cache. The gateway embeds incoming queries and checks our Redis cache database. We compare the incoming embedding with cached embeddings using cosine similarity. If the similarity distance is under 0.15, we have a cache hit, and the cached response is served immediately. This bypasses the PostgreSQL vector search and LLM calls, saving up to 60% in token costs and delivering sub-millisecond responses to users."*

---

## Slide 12: Implementation & Audit Evidence

* **Slide Title:** Production Audit Results & Codebase Verification
* **Slide Content:**
  * **Production readiness audit:** Completed a comprehensive codebase audit, resolving 32 security, reliability, and architectural issues.
  * **Critical Bug Fixes:**
    * Corrected LangGraph state compile crashes by refactoring models to `TypedDict`.
    * Solved OTel meter initialization crashes by implementing observable gauges.
    * Fixed semantic cache parsing errors by enabling `decode_responses=True` in Redis.
    * Provisioned missing infrastructure configs for OTel and Prometheus.
  * **Static Code Quality:** Verified 100% clean AST parsing and zero circular imports.
* **Visual Recommendation:** A table or bullet list showing the score improvement (61/100 ➔ 91/100) and listing the critical audited fixes.
* **Speaker Notes:**
  > *"During our production readiness audit, we evaluated the codebase across code quality, reliability, and security, raising our readiness score from 61 to 91 out of 100. We resolved several critical bugs, including a compile crash in LangGraph due to Pydantic models, a meter initialization crash in the OTel SDK, and type mismatches in the Redis semantic cache. We also verified that all files parse cleanly with zero circular imports."*

---

## Slide 13: Execution Results

* **Slide Title:** Validating Ingestion Paths via Test Execution Suite
* **Slide Content:**
  * **Happy Path (RankVantage):**
    * PII redacted ➔ Agent 1 parsed traffic ➔ RAGAS scored `0.94` ➔ Persisted to Postgres database. Status: `VERIFIED_PRODUCTION`.
  * **HITL Path (Poor Content):**
    * Low-value text ingested ➔ Agent 1 flagged `NOT_DETECTED` ➔ RAGAS scored `0.52` ➔ Enqueued to Redis ➔ Logged to review queue under evaluator Aastha Shukla. Status: `FLAGGED_FOR_HUMAN_REVIEW`.
  * **Dead-Letter Path (Garbage):**
    * Noise ingested ➔ 3 schema validation retries failed ➔ Enqueued to dead-letter queue. Status: `DEAD_LETTER`.
* **Visual Recommendation:** A table illustrating the three test inputs, their parsed output fields, their RAGAS scores, and the final pipeline outcomes.
* **Speaker Notes:**
  > *"We verified the pipeline against three distinct execution paths. On the happy path, using a clean competitor sample, the system redacted PII, extracted all metrics, scored a high 0.94 on RAGAS, and was marked as verified. On the HITL path, using low-quality text, RAGAS evaluated the output at 0.52, redirecting the job to the human review queue. On the dead-letter path, feeding random noise caused the extraction agent to fail 3 times before terminating and routing to the dead-letter queue. These logs prove that the state machine behaves exactly as designed."*

---

## Slide 14: Key Challenges & Engineering Learnings

* **Slide Title:** Key Challenges and Technical Learnings
* **Slide Content:**
  * **LangGraph State Merging:** Learned that LangGraph expects state updates as dictionary delta merges rather than Pydantic objects, requiring strict use of `TypedDict` and dict-access interfaces.
  * **OTel Observable Gauges:** Discovered that static gauge setting (`meter.create_gauge().set()`) is deprecated or missing in newer OTel SDK versions, requiring callback-driven observable gauges.
  * **Presidio Lifespan Warmup:** Resolved cold-start delays by loading NLP model weights during FastAPI startup, ensuring the first request executes immediately.
  * **pgvector Adapter Registry:** Learned that pgvector requires explicit connection registry in psycopg2 pools to prevent raw serialization database errors.
* **Visual Recommendation:** A clean bullet-point list with small icons showing the challenge on the left and the resolution/learning on the right.
* **Speaker Notes:**
  > *"We encountered several key engineering challenges during this project. First, we learned that LangGraph requires TypedDict state structures to merge state updates correctly. Second, we resolved an OTel SDK crash by switching from static gauges to callback-driven observable gauges. Third, we eliminated a cold-start delay in our PII filter by warming up Presidio's NLP models during FastAPI startup. Finally, we learned the importance of registering the pgvector adapter globally in our psycopg2 connection pools to prevent database serialization errors."*

---

## Slide 15: Conclusion & Future Scope

* **Slide Title:** Summary of Deliverables & Future Scope
* **Slide Content:**
  * **Completed Deliverables:**
    * Fully audited, state-gated competitor ingestion pipeline.
    * Sub-15ms pgvector HNSW similarity search backend.
    * Observability stack (OTel, Prometheus, Grafana).
    * Executable test runner and 5-page architecture PDF.
    * Clean git repository synced with GitHub.
  * **Future Scope:**
    * Migrate Redis semantic cache keys scans to `FT.SEARCH` (Redis Search).
    * Incorporate auto-retry logic for Agent 2.
    * Automate database index rebuilds based on semantic drift metrics.
* **Visual Recommendation:** A side-by-side layout: "Completed Deliverables" on the left and "Future Scope" on the right.
* **Speaker Notes:**
  > *"In conclusion, Phase 4 delivers a state-gated competitor intelligence pipeline, a fast pgvector search backend, an observability stack, and a complete suite of test scripts and blueprints. All code is committed and pushed to GitHub. For future work, we plan to migrate our semantic cache to Redis Search, add retry logic to Agent 2, and trigger database index rebuilds automatically when semantic drift exceeds 0.15. Thank you, and I look forward to your questions."*
