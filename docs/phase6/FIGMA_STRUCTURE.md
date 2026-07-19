# Nimblize Studio — Figma File Architecture & Grids

**Project:** Nimblize Studio AI SaaS  
**File Setup:** High-Fidelity UI Layout Blueprint  

---

## 1. Responsive Viewport Grids

The Figma workspace is organized around three primary viewport scales with responsive column grids:

### 🖥️ Desktop Frame (1440px width)
*   **Columns:** 12 Columns (Center aligned)
*   **Gutter:** 24px
*   **Margin:** 64px (outer page boundaries)
*   **Sidebar Navigation:** 240px static width (collapsible to 64px icon-only state)
*   **Layout grid usage:** 12-column grid spans the remaining 1136px width.

### 📱 Tablet Frame (768px width)
*   **Columns:** 8 Columns
*   **Gutter:** 16px
*   **Margin:** 32px
*   **Sidebar Navigation:** Transformed to a collapsible bottom navigation bar or top-bar hamburger drawer.

### 📱 Mobile Frame (375px width)
*   **Columns:** 4 Columns
*   **Gutter:** 12px
*   **Margin:** 16px
*   **Navigation:** Floating bottom navbar with quick-access home, prompt library, and execution center.

---

## 2. Layer & Frame Naming Conventions

To maintain pixel-perfect cleanliness for future code conversion, the Figma layer tree strictly avoids "Frame 239" type auto-names and uses standardized tokens:

```
[Layout] App-Container
  ├── [Layout] Sidebar-Global (left panel)
  └── [Layout] App-Main-Scrollable (right workspace)
        ├── [Layout] Topbar-Header
        │     ├── [Component] Global-Search-Trigger
        │     ├── [Component] Env-Badge
        │     └── [Component] Notification-Badge
        └── [Layout] Page-Content-Wrapper
              ├── [Layout] Page-Header
              ├── [Layout] Statistics-Grid (3-4 columns card wrapper)
              └── [Layout] Content-Split-Grid (dual panel layouts)
```

---

## 3. Figma Page Structure Blueprint

The Figma project file is split into the following pages to categorize deliverables:

### Page 1: 🎨 Design System Tokens & Foundations
*   Color tokens (light/dark values), typography styles, border radius components.
*   Primitives: Buttons (Primary, Secondary, Ghost, Icon), Input blocks, Badges, Tooltips.

### Page 2: 📊 Dashboard Frame
*   Main entry point. Contains:
    - **Header:** "Studio Overview" status panel.
    - **Row 1:** 4 metric cards (Active Prompt Templates: 29 | PGVector Context Chunks: 1,248 | Cache Hit Rate: 72% | RAGAS SLA Compliance: 94.2%).
    - **Row 2:** Dual-column split. Left column (9-span): Live CIMS Pipeline Ingestion Monitor (visual timeline of execution steps). Right column (3-span): Category Distribution pie chart (8 categories).

### Page 3: 📁 Prompt Library Catalog Frame
*   Overview of the 29 prompts. Contains:
    - **Top Bar:** Search field and Filter Tabs (All, Competitor Analysis, SEO, Recommendations, Customer Support, etc.).
    - **Card Grid:** 3-column card array. Each card shows the prompt ID (`SEO-001`), name (`SEO Strategy Generation`), version (`v1.1.0`), recommended model (`gpt-4o`), and a small category badge.

### Page 4: 🧪 Prompt Playground Frame
*   Split-screen interactive environment:
    - **Left Panel (50%):** YAML prompt template editor with syntax highlighting, input variables parameter forms, and model settings panel (temperature slider, max tokens field).
    - **Right Panel (50%):** Execution output JSON panel, detailing rendered text, mock or live execution logs, and output schemas.

### Page 5: ⚙️ CIMS Automation Studio Frame
*   Visual workflow builder mapping the pipeline stage sequence:
    - `Trigger Ingestion` ➔ `Presidio PII Scrub` ➔ `Redis Cache Check` ➔ `pgvector Context Ingress` ➔ `Agent 1 Parse` ➔ `Agent 2 Synthesis` ➔ `RAGAS Evaluation Gate` ➔ `Publishing Router`.
    - Nodes are expandable to show details (e.g. RAGAS node lists Faithfulness metric limits).

### Page 6: ⚖️ Evaluation & SLA Center Frame
*   Detailed reports from RAGAS:
    - Multi-temperature assessment matrix table comparing Faithfulness, Relevancy, and Context Recall scores at 0.2, 0.5, and 0.8 temperatures.
    - Line chart mapping RAGAS score history over the past 30 days.

### Page 7: 👤 HITL Review Console Frame
*   A dual-panel screen optimized for manual review:
    - **Left Panel:** Scraped raw text side-by-side with PII-redacted text.
    - **Right Panel:** Strategic report parameters fields (extracted domains, gap lists, affiliate scores) with a slider to manually adjust the score and buttons: `Approve and Persist` and `Re-run Ingestion`.
