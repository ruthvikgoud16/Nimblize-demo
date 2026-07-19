# Prompt Library — Nimblize Phase 5

**Project:** Nimblize  
**Phase:** 5 — AI Assets & Automation  
**Version:** 1.0.0  
**Total Prompts:** 26  
**Last Updated:** 2026-07-19  

---

## Overview

This document catalogues all LLM prompt templates used across the Nimblize platform. Each prompt is versioned, tagged with its target model, and linked to its corresponding pipeline stage. Prompt template files are stored as individual YAML files under `assets/prompts/<category>/`.

---

## Folder Structure

```
assets/prompts/
├── competitor_analysis/
│   ├── CA-001_competitor_data_extraction.yaml
│   ├── CA-002_competitor_swot_analysis.yaml
│   ├── CA-003_competitor_pricing_intelligence.yaml
│   ├── CA-004_competitor_tech_stack_detection.yaml
│   └── CA-005_self_correction_error_recovery.yaml
├── seo_analysis/
│   ├── SEO-001_seo_strategy_generation.yaml
│   ├── SEO-002_keyword_gap_analysis.yaml
│   ├── SEO-003_onpage_seo_audit.yaml
│   ├── SEO-004_backlink_profile_analysis.yaml
│   └── SEO-005_content_gap_identifier.yaml
├── product_recommendation/
│   ├── PR-001_semantic_product_recommendation.yaml
│   ├── PR-002_affiliate_product_matching.yaml
│   └── PR-003_recommendation_summarizer.yaml
├── feature_comparison/
│   ├── FC-001_feature_comparison_matrix.yaml
│   ├── FC-002_technology_differentiator_analysis.yaml
│   └── FC-003_user_experience_comparison.yaml
├── market_research/
│   ├── MR-001_market_landscape_analysis.yaml
│   ├── MR-002_trend_detection_forecasting.yaml
│   └── MR-003_tam_sam_som_market_sizing.yaml
├── customer_support/
│   ├── CS-001_hitl_review_summarizer.yaml
│   ├── CS-002_incident_triage_assistant.yaml
│   └── CS-003_user_query_intent_classifier.yaml
├── report_generation/
│   ├── RG-001_pipeline_performance_report.yaml
│   ├── RG-002_competitor_intelligence_digest.yaml
│   ├── RG-003_quality_assurance_report.yaml
│   └── RG-004_notification_alert_composer.yaml
└── executive_summary/
    ├── ES-001_stakeholder_executive_summary.yaml
    ├── ES-002_weekly_status_update.yaml
    └── ES-003_roi_impact_analysis.yaml
```

---

## Naming Convention

```
<CATEGORY_PREFIX>-<NNN>_<descriptive_name>.yaml
```

| Prefix | Category |
|---|---|
| `CA` | Competitor Analysis |
| `SEO` | SEO Analysis |
| `PR` | Product Recommendation |
| `FC` | Feature Comparison |
| `MR` | Market Research |
| `CS` | Customer Support |
| `RG` | Report Generation |
| `ES` | Executive Summary |

**Rules:**
- IDs are zero-padded to 3 digits (e.g., `CA-001`)
- Filenames use snake_case after the ID
- One prompt per file — no multi-prompt YAML files

---

## Prompt Index

### Competitor Analysis (5 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| CA-001 | Competitor Data Extraction | gpt-4o-mini | 0.0 | Core Agent 1: extract structured competitor data from raw text |
| CA-002 | Competitor SWOT Analysis | gpt-4o | 0.3 | Generate SWOT analysis from extracted competitor intelligence |
| CA-003 | Competitor Pricing Intelligence | gpt-4o-mini | 0.0 | Extract pricing tiers, models, and monetization structures |
| CA-004 | Competitor Tech Stack Detection | gpt-4o-mini | 0.0 | Identify frontend, backend, and analytics technologies |
| CA-005 | Self-Correction Error Recovery | gpt-4o-mini | 0.0 | Retry prompt feeding validation errors back for self-correction |

### SEO Analysis (5 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| SEO-001 | SEO Strategy Generation | gpt-4o | 0.4 | Core Agent 2: produce strategy report with market gaps and keyword targets |
| SEO-002 | Keyword Gap Analysis | gpt-4o | 0.3 | Identify keyword gaps between Nimblize and competitors |
| SEO-003 | On-Page SEO Audit | gpt-4o-mini | 0.1 | Audit competitor page SEO: titles, meta, headings, content quality |
| SEO-004 | Backlink Profile Analysis | gpt-4o | 0.2 | Analyze backlink quality, anchor distribution, and link opportunities |
| SEO-005 | Content Gap Identifier | gpt-4o | 0.4 | Find content opportunities by comparing topic coverage |

### Product Recommendation (3 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| PR-001 | Semantic Product Recommendation | gpt-4o-mini | 0.5 | Transform pgvector search results into personalized recommendations |
| PR-002 | Affiliate Product Matching | gpt-4o | 0.4 | Match user intent with affiliate products, score monetization |
| PR-003 | Recommendation Summarizer | gpt-4o-mini | 0.6 | Generate concise recommendation summaries for email/dashboard/notifications |

### Feature Comparison (3 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| FC-001 | Feature Comparison Matrix | gpt-4o | 0.2 | Structured feature-by-feature comparison with availability scoring |
| FC-002 | Technology Differentiator Analysis | gpt-4o | 0.3 | Analyze architecture and infrastructure moat advantages |
| FC-003 | User Experience Comparison | gpt-4o | 0.4 | Compare UX workflows, onboarding, and dashboard design |

### Market Research (3 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| MR-001 | Market Landscape Analysis | gpt-4o | 0.4 | Synthesize competitor data into market landscape overview |
| MR-002 | Trend Detection & Forecasting | gpt-4o | 0.5 | Detect emerging trends and forecast market direction |
| MR-003 | TAM/SAM/SOM Market Sizing | gpt-4o | 0.3 | Estimate addressable market using competitor data as proxies |

### Customer Support (3 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| CS-001 | HITL Review Summarizer | gpt-4o-mini | 0.2 | Summarize flagged payloads for human review with action recommendations |
| CS-002 | Incident Triage Assistant | gpt-4o-mini | 0.1 | Categorize and triage pipeline errors with resolution steps |
| CS-003 | User Query Intent Classifier | gpt-4o-mini | 0.0 | Route user queries to the correct pipeline endpoint |

### Report Generation (4 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| RG-001 | Pipeline Performance Report | gpt-4o | 0.3 | Generate comprehensive performance reports with KPIs and recommendations |
| RG-002 | Competitor Intelligence Digest | gpt-4o | 0.4 | Weekly/monthly digest of new profiles, changes, and strategic highlights |
| RG-003 | Quality Assurance Report | gpt-4o | 0.2 | Analyze RAGAS results with failure patterns and calibration advice |
| RG-004 | Notification Alert Composer | gpt-4o-mini | 0.2 | Multi-channel alert formatting for Slack, email, and PagerDuty |

### Executive Summary (3 prompts)

| ID | Name | Model | Temp | Purpose |
|---|---|---|---|---|
| ES-001 | Stakeholder Executive Summary | gpt-4o | 0.4 | C-suite/board-level briefing with key findings and strategic implications |
| ES-002 | Weekly Status Update | gpt-4o-mini | 0.3 | Concise status update for team leads with metrics and blockers |
| ES-003 | ROI Impact Analysis | gpt-4o | 0.3 | Quantify business impact vs. manual processes for stakeholder buy-in |

---

## Versioning Strategy

### Semantic Versioning

All prompts follow [Semantic Versioning 2.0.0](https://semver.org/):

| Version Part | When to Increment | Example |
|---|---|---|
| **Major** (`X.0.0`) | Breaking changes to input/output schema | `1.0.0` → `2.0.0`: Added required input variable |
| **Minor** (`0.X.0`) | Behavioral improvements, new few-shot examples | `1.0.0` → `1.1.0`: Added edge case example |
| **Patch** (`0.0.X`) | Wording tweaks, typo fixes, minor adjustments | `1.0.0` → `1.0.1`: Fixed typo in system prompt |

### Version Tracking

- Each YAML file contains a `version` field with the current semantic version
- All version changes are logged in `docs/phase5/CHANGELOG.md`
- Git tags may be used for major library milestones (e.g., `prompt-lib-v1.0`)

### Model Version Pinning

- Prompts specify a `recommended_model` — the model version tested and validated against
- When OpenAI releases model updates, prompts must be re-evaluated before updating the model field
- Previous model versions should be noted in the `notes` field during migration

---

## Template Schema

Every prompt YAML file follows this standardized schema:

```yaml
# Required Fields
id: "XX-NNN"                          # Unique prompt identifier
category: "category_name"             # Category directory name
name: "Human-Readable Name"           # Display name
version: "X.Y.Z"                      # Semantic version
purpose: "Description of purpose"     # What this prompt does

# Model Configuration
recommended_model: "gpt-4o | gpt-4o-mini"
temperature: 0.0 - 1.0               # Model temperature
max_tokens: 500 - 4000               # Maximum output tokens

# I/O Definition
input_variables:                      # List of required inputs
  - name: "variable_name"
    type: "string | object | array"
    description: "What this input represents"

output_schema:                        # Expected output structure
  type: "json"
  fields:
    - name: "field_name"
      type: "data_type"
      description: "Field purpose"

# Prompt Content
prompt_template: |                    # The actual prompt text
  System instructions and user template
  with {{ variable_name }} placeholders

# Validation Data
example_input: |                      # Sample input for testing
example_output: |                     # Expected output for the sample input

# Metadata
notes: "Implementation notes"         # Usage notes, caveats, dependencies
tags:                                 # Searchable tags
  - "tag1"
  - "tag2"
```

---

## Best Practices

### 1. Prompt Engineering

- **Be explicit about rules** — numbered operational parameters prevent model drift
- **Include few-shot examples** — at least 1 example per prompt; 3 for complex tasks
- **Set guard rails** — explicitly state what the model should NOT do
- **Use `NOT_DETECTED`** over `null` — provides clearer signal for downstream validation
- **Pin temperature** — document why each temperature was chosen

### 2. Temperature Guidelines

| Temperature | Use Case | Examples |
|---|---|---|
| `0.0` | Deterministic extraction, classification | CA-001, CA-005, CS-003 |
| `0.1-0.2` | Technical audits, triage, alerting | SEO-003, CS-002, RG-004 |
| `0.3-0.4` | Analytical reports, strategy, comparisons | SEO-001, FC-001, ES-001 |
| `0.5-0.6` | Creative copy, recommendations, summaries | PR-001, PR-003, MR-002 |

### 3. Testing

- Every prompt MUST include `example_input` and `example_output`
- Target 3 test cases per prompt: happy path, edge case, failure case
- Run RAGAS evaluation on extraction and strategy prompts (target ≥ 0.85)
- Document test results in `EVALUATION_REPORT.md`

### 4. Maintenance

- Review all prompts quarterly for model version compatibility
- Log every change in `docs/phase5/CHANGELOG.md`
- Re-evaluate prompts when switching model providers
- Monitor production prompt performance via Prometheus/Grafana dashboards

### 5. Cost Optimization

- Use `gpt-4o-mini` for deterministic tasks (extraction, classification, alerting)
- Reserve `gpt-4o` for complex analytical tasks (strategy, market research, executive summaries)
- Leverage semantic caching to avoid redundant LLM calls for similar queries
- Set `max_tokens` conservatively — don't allocate 4000 tokens for a 500-token output

---

## Pipeline Integration Map

Shows which prompts correspond to existing pipeline components:

```
┌─────────────────────────────────────────────────────────────┐
│                    NIMBLIZE PIPELINE                        │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ PII      │    │ Agent 1      │    │ Agent 2          │  │
│  │ Filter   │───▶│ CA-001       │───▶│ SEO-001          │  │
│  │          │    │ CA-005 retry │    │                  │  │
│  └──────────┘    └──────────────┘    └────────┬─────────┘  │
│                                               │             │
│                                    ┌──────────▼──────────┐ │
│                                    │ RAGAS Evaluator      │ │
│                                    │ RG-003 (QA report)   │ │
│                                    └──────────┬──────────┘ │
│                         ┌─────────────────────┤            │
│                    ┌────▼────┐          ┌─────▼──────┐     │
│                    │ Persist │          │ HITL Queue  │     │
│                    │ (DB)    │          │ CS-001      │     │
│                    └─────────┘          │ RG-004      │     │
│                                         └─────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ B2C Recommendation: PR-001, PR-002, PR-003          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Analytics Layer: RG-001, RG-002, ES-001, ES-002     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Strategic Layer: CA-002, CA-003, CA-004, SEO-002,   │  │
│  │   SEO-003, SEO-004, SEO-005, FC-*, MR-*, ES-003    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

*This document was generated as part of Phase 5 Loop 2. Prompts will be integrated into the application in a subsequent engineering loop.*
