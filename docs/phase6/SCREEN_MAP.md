# Nimblize Studio — Screen Map & Wireframes (ASCII)

**Project:** Nimblize Studio AI SaaS  
**Objective:** Detailed screen layouts, content grids, and wireframe blueprints.  

---

## Page 1: Dashboard Overview

Displays live platform health, vector counts, and ingestion streams.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)              [Env: Production] [Notif] [Profile]   |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  Studio Overview                                           |
|                  |  Live platform metrics and active CIMS streams.            |
| - Dashboard [A]  |                                                            |
| - Library        |  +--------------+ +--------------+ +--------------+        |
| - Playground     |  | Prompts      | | pgvector     | | Cache Rate   |        |
| - Automation     |  | 29 Templates | | 1,248 Chunks | | 72% Hits     |        |
| - Evaluation     |  +--------------+ +--------------+ +--------------+        |
| - HITL Review    |                                                            |
| - Settings       |  +------------------------------+ +---------------------+  |
|                  |  | CIMS Execution Timeline      | | Category Share    |  |
|                  |  | [19:00:10] Ingestion Trigger | | - CA: 5 Prompts   |  |
|                  |  | [19:00:12] PII Scrub [PASS]  | | - SEO: 5 Prompts  |  |
|                  |  | [19:00:15] pgvector Retrieval| | - PR: 3 Prompts   |  |
|                  |  | [19:00:20] RAGAS Gate [0.79] | | - MR: 3 Prompts   |  |
|                  |  |   --> Paused: Sent to HITL   | | - CS: 3 Prompts   |  |
|                  |  +------------------------------+ +---------------------+  |
+------------------+------------------------------------------------------------+
```

---

## Page 2: Prompt Library Catalog

A central registry cataloguing the 29 versioned prompt templates.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)                                                    |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  Prompt Library                                            |
|                  |  Manage and filter the 29 YAML templates.                   |
| - Dashboard      |                                                            |
| - Library [A]    |  [ All ] [ Competitor ] [ SEO ] [ Customer ] [ Report ]    |
| - Playground     |                                                            |
| - Automation     |  +------------------+ +------------------+ +--------------+ |
| - Evaluation     |  | SEO-001          | | CA-001           | | PR-001       | |
| - HITL Review    |  | SEO Strategy     | | Data Ingest      | | Product Rec  | |
| - Settings       |  | Model: gpt-4o    | | Model: gpt-4mini | | Model: gpt-4 | |
|                  |  | Version: v1.1.0  | | Version: v1.1.0  | | Ver: v1.0.0  | |
|                  |  +------------------+ +------------------+ +--------------+ |
+------------------+------------------------------------------------------------+
```

---

## Page 3: Prompt Playground

Split-screen parameter tuner and YAML editor.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)                                                    |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  Playground: SEO-001 (SEO Strategy)   [Run Test] [Save v1.1.1] |
|                  |                                                            |
| - Dashboard      |  +--------------------------+ +--------------------------+ |
| - Library        |  | YAML Prompt Editor       | | Ingestion Output Logs    | |
| - Playground [A] |  |                          | |                          | |
| - Automation     |  | id: "SEO-001"            | | Rendered Prompt:         | |
| - Evaluation     |  | recommended_model: gpt-4 | | "Analyze marketing gaps  | |
| - HITL Review    |  | temperature: 0.4         | | for competitor domain..."| |
| - Settings       |  | prompt_template: |       | |                          | |
|                  |  |   Analyze {{ domain }}.. | | JSON Response Payload:   | |
|                  |  |                          | | { "market_gap": "SEO"..} | |
|                  |  +--------------------------+ +--------------------------+ |
+------------------+------------------------------------------------------------+
```

---

## Page 4: CIMS Automation Studio

Visual graph mapping pipeline execution stages.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)                                                    |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  Automation Workflow Studio               [Manual Trigger] |
|                  |                                                            |
| - Dashboard      |  CIMS Pipeline Sequence Node Map                           |
| - Library        |                                                            |
| - Playground     |  [Trigger Ingest] ➔ [Presidio Scrub] ➔ [Redis Cache Check]  |
| - Automation [A] |                                     |                      |
| - Evaluation     |                                     v (Cache Miss)         |
| - HITL Review    |  [Slack Notification] 🔐 [RAGAS Gate] 💻 [pgvector RAG]    |
| - Settings       |         ^                     |                            |
|                  |         |                     v (Low Score)                |
|                  |         +--------------- [HITL Queue]                      |
+------------------+------------------------------------------------------------+
```

---

## Page 5: Evaluation & SLA Center

RAGAS benchmark dashboard displaying model scores.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)                                                    |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  Evaluation & SLA Benchmarks                               |
|                  |  Multi-temperature RAGAS validation metrics.               |
| - Dashboard      |                                                            |
| - Library        |  +-------------------------------------------------------+ |
| - Playground     |  | Prompt ID | Temp | Faithfulness | Recall | Status     | |
| - Automation     |  |-----------|------|--------------|--------|------------| |
| - Evaluation [A] |  | SEO-001   | 0.2  | 0.94         | 0.88   | 🟢 PASS    | |
| - HITL Review    |  | SEO-001   | 0.8  | 0.74         | 0.82   | 🔴 FAIL    | |
| - Settings       |  +-------------------------------------------------------+ |
+------------------+------------------------------------------------------------+
```

---

## Page 6: HITL Review Queue

Console for evaluating flagged outputs.

### 📐 ASCII Wireframe Layout

```
+-------------------------------------------------------------------------------+
| [Logo] Search... (Cmd + K)                   [Approve Ingress] [Reject / Run] |
+-------------------------------------------------------------------------------+
| (AppSidebar)     |  HITL Review: RankVantage (Score: 0.79)                    |
|                  |                                                            |
| - Dashboard      |  +--------------------------+ +--------------------------+ |
| - Library        |  | Redacted Raw Text        | | Generated Strategy       | |
| - Playground     |  |                          | |                          | |
| - Automation     |  | RankVantage operates a   | | market_gap_analysis:     | |
| - Evaluation     |  | B2B SaaS platform in     | | "Underserves mid-market  | |
| - HITL Review [A]|  | <LOCATION> targeting     | | B2B analytics track..."  | |
| - Settings       |  | mid-market resellers.    | |                          | |
|                  |  +--------------------------+ +--------------------------+ |
+------------------+------------------------------------------------------------+
```
