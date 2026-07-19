# Changelog — Nimblize Phase 5 Prompt Library

All notable changes to the Prompt Library are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
prompts follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.0] — 2026-07-19

### Changed

#### CA-001 — Competitor Data Extraction (1.0.0 → 1.1.0)
- **Added:** Negative constraints (rules 4-6) preventing fabrication, estimation, and inference
- **Added:** EDGE CASES section handling ambiguous domains, vague traffic figures, and implied keywords
- **Added:** Second few-shot example demonstrating NOT_DETECTED and empty array handling on minimal input
- **Reason:** Temperature sensitivity analysis revealed hallucination risk at T>0.5 — model inferred keywords not explicitly stated in source text
- **Improvement:** Ambiguous input handling now explicit; NOT_DETECTED coverage comprehensive

#### SEO-001 — SEO Strategy Generation (1.0.0 → 1.1.0)
- **Added:** ANTI-HALLUCINATION CONSTRAINTS section (5 explicit rules)
- **Added:** Evidence citation requirement for all recommendations
- **Added:** List length caps: max 6 SEO targets, max 5 dashboard recommendations
- **Reason:** At T=0.8, model fabricated search volume numbers (e.g., "8.1K monthly search volume") not present in input; unbounded list growth at higher temperatures
- **Improvement:** Fabricated statistics eliminated; output size predictable and bounded

#### CS-003 — User Query Intent Classifier (1.0.0 → 1.1.0)
- **Added:** Explicit ENDPOINT MAPPING table (intent → API route)
- **Added:** FALLBACK RULE: confidence below 0.6 triggers UNKNOWN classification
- **Added:** 5 inline few-shot examples spanning all intent categories + UNKNOWN edge case
- **Added:** Confidence calibration instruction
- **Reason:** Model inferred endpoints without deterministic mapping; no handling for ambiguous or empty queries
- **Improvement:** Deterministic routing guaranteed; edge case coverage comprehensive

#### RG-004 — Notification Alert Composer (1.0.0 → 1.1.0)
- **Added:** SEVERITY MAPPING table with 5 severity rules keyed on event type + metric thresholds
- **Added:** SLA response time expectations per severity level (15 min → 24 hours)
- **Added:** Rule 6: generate all three channel formats in every response
- **Reason:** Inconsistent severity assignment across runs; partial channel generation when only one channel specified
- **Improvement:** SLA-driven severity classification; complete multi-channel output guaranteed

---

## [v1.0.0] — 2026-07-19

### Added

#### Competitor Analysis (5 prompts)
- `CA-001` — Competitor Data Extraction: Core Agent 1 extraction engine
- `CA-002` — Competitor SWOT Analysis: Strategic SWOT from extracted intelligence
- `CA-003` — Competitor Pricing Intelligence: Pricing tier and monetization extraction
- `CA-004` — Competitor Tech Stack Detection: Frontend/backend/analytics technology identification
- `CA-005` — Self-Correction Error Recovery: Retry prompt for Pydantic validation failures

#### SEO Analysis (5 prompts)
- `SEO-001` — SEO Strategy Generation: Core Agent 2 strategy report engine
- `SEO-002` — Keyword Gap Analysis: Keyword opportunity identification
- `SEO-003` — On-Page SEO Audit: Page-level SEO quality assessment
- `SEO-004` — Backlink Profile Analysis: Backlink quality and opportunity analysis
- `SEO-005` — Content Gap Identifier: Content coverage comparison and planning

#### Product Recommendation (3 prompts)
- `PR-001` — Semantic Product Recommendation: pgvector search result augmentation
- `PR-002` — Affiliate Product Matching: Monetization-aware product matching
- `PR-003` — Recommendation Summarizer: Multi-channel recommendation formatting

#### Feature Comparison (3 prompts)
- `FC-001` — Feature Comparison Matrix: Structured feature-by-feature comparison
- `FC-002` — Technology Differentiator Analysis: Architecture moat assessment
- `FC-003` — User Experience Comparison: UX workflow comparison and scoring

#### Market Research (3 prompts)
- `MR-001` — Market Landscape Analysis: Multi-competitor market overview
- `MR-002` — Trend Detection & Forecasting: Emerging trend identification
- `MR-003` — TAM/SAM/SOM Market Sizing: Bottom-up market estimation

#### Customer Support (3 prompts)
- `CS-001` — HITL Review Summarizer: Flagged payload summarization
- `CS-002` — Incident Triage Assistant: Pipeline error categorization and triage
- `CS-003` — User Query Intent Classifier: Intent classification for request routing

#### Report Generation (4 prompts)
- `RG-001` — Pipeline Performance Report: KPI and quality metric reporting
- `RG-002` — Competitor Intelligence Digest: Weekly/monthly intelligence digest
- `RG-003` — Quality Assurance Report: RAGAS evaluation analysis
- `RG-004` — Notification Alert Composer: Multi-channel alert formatting

#### Executive Summary (3 prompts)
- `ES-001` — Stakeholder Executive Summary: C-suite competitive intelligence briefing
- `ES-002` — Weekly Status Update: Team-level status communication
- `ES-003` — ROI Impact Analysis: Business case quantification

### Infrastructure
- Established `assets/prompts/<category>/` directory structure (8 categories)
- Defined naming convention: `<PREFIX>-<NNN>_<snake_case_name>.yaml`
- Created `docs/phase5/PROMPT_LIBRARY.md` with full index and best practices
- Established YAML template schema with 14 required fields per prompt

---

*This changelog tracks all modifications to the Nimblize Prompt Library.*
