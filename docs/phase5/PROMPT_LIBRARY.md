# Prompt Library

**Project:** Nimblize — Phase 5  
**Status:** 🔲 Not Started  
**Last Updated:** 2026-07-19  

---

## Overview

This document catalogues all LLM prompt templates used across the Nimblize platform. Each prompt is versioned, tagged with its target model, and linked to its corresponding pipeline stage.

Prompt template files are stored in: `assets/prompts/`

---

## Prompt Registry

| ID | Name | Pipeline Stage | Model | Version | Status |
|---|---|---|---|---|---|
| — | — | — | — | — | 🔲 Pending |

> Prompts will be added here as they are engineered and validated.

---

## Template Schema

Each prompt template should follow this structure:

```yaml
id: PROMPT_XXX
name: "<Descriptive Name>"
version: "1.0.0"
model: "<target model identifier>"
pipeline_stage: "<extraction | strategy | evaluation | recommendation>"
description: "<Purpose and expected behavior>"
input_variables:
  - name: "<variable_name>"
    type: "<string | list | object>"
    description: "<What this variable represents>"
output_schema: "<Expected output format or Pydantic model reference>"
tags:
  - "<tag1>"
  - "<tag2>"
```

---

## Versioning Policy

- **Major** (`X.0.0`): Breaking changes to input/output schema
- **Minor** (`0.X.0`): Behavioral improvements, new few-shot examples
- **Patch** (`0.0.X`): Wording tweaks, typo fixes

All prompt changes must be logged in `CHANGELOG.md`.

---

## Quality Criteria

- [ ] Each prompt has a unique ID and semantic version
- [ ] Input variables are explicitly typed and documented
- [ ] Expected output schema is defined
- [ ] At least 3 test cases per prompt (happy path, edge case, failure case)
- [ ] RAGAS evaluation score ≥ 0.85 on test set

---

*Prompts will be populated during the Prompt Engineering milestone.*
