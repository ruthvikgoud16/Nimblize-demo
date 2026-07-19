# Visual Asset Index — Nimblize Phase 5

**Project:** Nimblize — Phase 5  
**Document:** Visual Assets & Diagrams Index  
**Status:** 🟢 Verified  
**Last Updated:** 2026-07-19  

---

## 1. Overview

This document serves as the master index for all visual diagrams, sequence flows, architectural blueprints, and execution flowcharts in Phase 5 of Nimblize.

---

## 2. Architecture & Sequence Diagrams Index

| Diagram Title | Asset Format | Primary Location | Description |
|---|---|---|---|
| **CIMS End-to-End Flowchart** | Mermaid Code / Diagram | [AUTOMATION_WORKFLOW.md#1-workflow-definition](../AUTOMATION_WORKFLOW.md) | High-level data flowchart showing triggers, extraction, caching, RAG retrieval, strategy generation, RAGAS quality gate, and alerting. |
| **System Component Integration Architecture** | Mermaid Code / Diagram | [WORKFLOW_ARCHITECTURE.md#1-system-component-architecture](../WORKFLOW_ARCHITECTURE.md) | Detailed architectural diagram showing FastAPI, Presidio, LangGraph, Redis, pgvector, and SendGrid/Slack API integration. |
| **CIMS Execution Sequence Flow** | Mermaid Sequence Diagram | [WORKFLOW_SEQUENCE.md#1-pipeline-execution-sequence](../WORKFLOW_SEQUENCE.md) | Step-by-step sequence diagram tracing request lifecycle from user trigger to notification dispatch. |

---

## 3. Visual Rendering Specifications

- **Diagram Engine:** Mermaid.js (native Markdown rendering supported on GitHub / Antigravity IDE)
- **Visual Theme:** Dark theme / Slate blue high-contrast node styling
- **Source Files:**
  - `docs/phase5/WORKFLOW_ARCHITECTURE.md`
  - `docs/phase5/WORKFLOW_SEQUENCE.md`
  - `docs/phase5/AUTOMATION_WORKFLOW.md`
