# Automation Workflow Specification — Nimblize Phase 5

**Project:** Nimblize — Phase 5  
**Milestone:** 3 (Automation Workflow)  
**Status:** 🟢 Designed (Frozen for Implementation)  
**Last Updated:** 2026-07-19  

---

## 1. Workflow Definition: Competitor Intelligence & Strategy Pipeline (CIMS)

The **Competitor Intelligence & Strategy Pipeline (CIMS)** is the core automated workflow of the Nimblize platform. It orchestrates unstructured data extraction, semantic search retrieval, strategic SEO generation, RAGAS quality evaluation, and multi-channel notification.

```
 TRIGGER (Cron / API Event)
  │
  ▼
 [1. Redaction & Extraction] ──▶ (Fail) ──▶ [Self-Correction CA-005] ──▶ (3x Fail) ──▶ [Dead Letter Queue]
  │
  ▼
 [2. Semantic Cache Lookup] ───▶ (Hit) ───▶ [Cached Output Persistence]
  │ (Miss)
  ▼
 [3. RAG Context Retrieval]
  │
  ▼
 [4. Strategic Report Gen] ──▶ [SEO-001 Strategy Generation]
  │
  ▼
 [5. RAGAS Quality Gate] ────▶ (<0.85 Score) ──▶ [HITL Queue CS-001]
  │ (≥0.85 Score)
  ▼
 [6. Report Persistence & Alerts] ──▶ [Slack/Email/PagerDuty Alerts RG-004]
```

### Specifications Table

| Attribute | Specification Details |
|---|---|
| **Workflow Name** | Competitor Intelligence & Strategy Pipeline (CIMS) |
| **Purpose** | Automate B2B/B2C competitor analysis, SEO gap identification, and strategy recommendations using a multi-agent system. |
| **Triggers** | 1. **Scheduled:** Periodic cron trigger every 72 hours for active domains.<br>2. **Event-Driven:** Webhook trigger fired when a scrape worker completes a raw crawl.<br>3. **On-Demand:** User-initiated analysis query from the FastAPI web interface. |
| **Input Payload** | `{"pipeline_id": "uuid", "competitor_url": "string", "raw_content": "string", "initiator": "string", "bypass_cache": boolean}` |
| **Output Payload** | `{"pipeline_id": "uuid", "status": "COMPLETED | FLAGGED_FOR_REVIEW", "composite_ragas_score": float, "report_url": "string"}` |
| **Dependencies** | FastAPI gateway, Scrapy/Puppeteer scraper queue, Redis Semantic Cache, LangGraph runtime, PostgreSQL (pgvector), SendGrid & Slack APIs. |
| **Human Review Points** | 1. Flagged strategy reports with RAGAS score < 0.85 are routed to the Human-in-the-Loop (HITL) queue for reviewer action (Approve/Regenerate).<br>2. Verification of extracted pricing intelligence before publishing B2C affiliate tables. |
| **Completion Criteria** | Validated Strategy Report successfully persisted in PostgreSQL, and notification successfully dispatched to Slack/Email. |

---

## 2. Failure Handling & Exception Matrix

The CIMS workflow incorporates robust exception handling, retry budgets, and fallbacks at every stage of the pipeline:

| Stage | Failure Condition | Impact | Recovery / Mitigation / Fallback |
|---|---|---|---|
| **PII Redaction** | Presidio API Timeout | High | Fallback to regex-based anonymization; log warning but proceed. |
| **Extraction** | Schema Validation Failure | High | Trigger `CA-005` (Self-Correction) retry. Pass error trace as model context. Maximum 3 retries, then route to Dead Letter Queue (DLQ). |
| **Semantic Cache** | Redis Connection Lost | Low | Bypass cache lookup; perform full LLM generation; trigger circuit breaker. |
| **RAG Retrieval** | Empty Vector Results | Medium | Fallback to keyword matching on PG database; if still empty, mark RAG context as `NOT_AVAILABLE`. |
| **Strategy Gen** | LLM Timeout / Rate Limit | High | Retry with exponential backoff (initial wait 1s, backoff factor 2, max retries 4); if failed, fallback to `gpt-4o-mini` backup endpoint. |
| **Quality Gate** | RAGAS Score < 0.85 | High | Route pipeline state to `FLAGGED_FOR_HUMAN_REVIEW` status; post Slack/PagerDuty notification using `RG-004`. |
| **Alerting** | Slack API Error | Low | Fallback to SendGrid email; queue failed Slack alert in Redis retry queue (max 5 attempts). |

---

## 3. Workflow Prompts Mapping

This table maps every stage of the pipeline execution to its active prompt template:

| Step | Workflow Stage | Target Model | Recommended Temp | Prompt ID | Prompt Template Filename |
|---|---|---|---|---|---|
| **1** | Request Classification | gpt-4o-mini | 0.0 | **CS-003** | `CS-003_user_query_intent_classifier.yaml` |
| **2** | Competitor Data Extraction | gpt-4o-mini | 0.0 | **CA-001** | `CA-001_competitor_data_extraction.yaml` |
| **3** | Extraction Recovery (Retry) | gpt-4o-mini | 0.0 | **CA-005** | `CA-005_self_correction_error_recovery.yaml` |
| **4** | Tech Stack Audit | gpt-4o-mini | 0.0 | **CA-004** | `CA-004_competitor_tech_stack_detection.yaml` |
| **5** | Pricing Isolation | gpt-4o-mini | 0.0 | **CA-003** | `CA-003_competitor_pricing_intelligence.yaml` |
| **6** | Strategy Report Generation | gpt-4o | 0.4 | **SEO-001** | `SEO-001_seo_strategy_generation.yaml` |
| **7** | Keyword Gap Identification | gpt-4o | 0.3 | **SEO-002** | `SEO-002_keyword_gap_analysis.yaml` |
| **8** | Content Opportunity mapping | gpt-4o | 0.4 | **SEO-005** | `SEO-005_content_gap_identifier.yaml` |
| **9** | SWOT Generation | gpt-4o | 0.3 | **CA-002** | `CA-002_competitor_swot_analysis.yaml` |
| **10** | Feature Matrix Compilation | gpt-4o | 0.2 | **FC-001** | `FC-001_feature_comparison_matrix.yaml` |
| **11** | UX/Workflow Review | gpt-4o | 0.4 | **FC-003** | `FC-003_user_experience_comparison.yaml` |
| **12** | Market Landscape Synthesis | gpt-4o | 0.4 | **MR-001** | `MR-001_market_landscape_analysis.yaml` |
| **13** | TAM/SAM/SOM Sizing | gpt-4o | 0.3 | **MR-003** | `MR-003_tam_sam_som_market_sizing.yaml` |
| **14** | Affiliate Offer Matching | gpt-4o | 0.4 | **PR-002** | `PR-002_affiliate_product_matching.yaml` |
| **15** | RAGAS Quality Analytics | gpt-4o | 0.2 | **RG-003** | `RG-003_quality_assurance_report.yaml` |
| **16** | HITL Review Context | gpt-4o-mini | 0.2 | **CS-001** | `CS-001_hitl_review_summarizer.yaml` |
| **17** | Alert Dispatch Composer | gpt-4o-mini | 0.2 | **RG-004** | `RG-004_notification_alert_composer.yaml` |
| **18** | Stakeholder Briefing (TL;DR) | gpt-4o | 0.4 | **ES-001** | `ES-001_stakeholder_executive_summary.yaml` |

---

## 4. Success Metrics & KPIs

To measure the operational efficiency and quality of the CIMS workflow, we establish the following key performance indicators:

| KPI Metric | Target SLA / Benchmark | Collection Mechanism |
|---|---|---|
| **E2E Completion Time** | < 12 seconds (P95) | OpenTelemetry spans (FastAPI to alerts) |
| **RAGAS Composite Score** | ≥ 0.85 | RAGAS Evaluator log metrics |
| **Self-Correction Success** | ≥ 92% recovery on retry 1 | LangGraph execution tracker |
| **Dead Letter Rate (DLQ)** | < 1% of total runs | DLQ message count / total runs |
| **Semantic Cache Hit Rate**| ≥ 35% of requests | Redis cache metric counters |
| **HITL Escalation Rate** | < 5% of processed runs | Review queue count / total runs |
| **Prompt Execution Cost** | < $0.015 per run | OpenAI usage API tokens tracker |
| **Validation Schema Pass Rate** | 100% adherence to Pydantic | Pydantic validation interceptor |

---

*This document is the master specification for Phase 5 automation. Implementation of the triggers and runners will proceed in Milestone 3 Loop 3.1.*
