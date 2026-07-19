# Nimblize Studio — Frontend Implementation Roadmap

**Project:** Nimblize Studio AI SaaS  
**Objective:** Phase 6 Frontend Development Milestones & Routing Specs  

---

## 1. Technology Stack
To achieve a high-performance, developer-centric interface that matches Vercel and Linear, the frontend stack uses:
- **Framework:** Next.js (App Router, React Server Components)
- **Styling:** TailwindCSS (following standard tokens in `docs/phase6/DESIGN_SYSTEM.md`)
- **Core Components:** Radix UI primitives (packaged via Shadcn UI)
- **Visual Charts:** Recharts (responsive line, pie, and bar charts)
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Text Diff Viewer:** `react-diff-viewer-continued`

---

## 2. Route Hierarchy Mapping

The Next.js App Router layout aligns with the 6 core pages:

```
app/
├── layout.tsx                     # Global AppSidebar + Top Navbar wrapper
├── page.tsx                       # Dashboard Overview page (/dashboard)
├── library/
│   ├── page.tsx                   # Prompt Catalog Grid (/library)
│   └── [id]/
│       └── page.tsx               # Prompt Playground / Parameter Tuner (/library/SEO-001)
├── automation/
│   └── page.tsx                   # CIMS Automation Studio Visual Editor (/automation)
├── evaluation/
│   └── page.tsx                   # RAGAS metrics & SLA Charts (/evaluation)
├── review/
│   └── page.tsx                   # HITL Manual Review Queue list (/review)
│   └── [reviewId]/
│       └── page.tsx               # Review Console Workspace (/review/rev-123)
└── settings/
    └── page.tsx                   # Environment Variables & Provider config (/settings)
```

---

## 3. Development Milestones

### 🏗️ Milestone 1: Framework Setup & Main Layout (Loop 1)
*   **Tasks:**
    - Initialize Next.js project using `npx create-next-app@latest`.
    - Configure `tailwind.config.js` with the brand colors and typography scale.
    - Build the collapsible Left Navigation Sidebar (`AppSidebar`) and Top Navbar (`AppNavbar`).
*   **Success Criteria:** Home page loads with responsive side-nav, top-search bar, and correct color themes.

### 📁 Milestone 2: Prompt Catalog & Playground (Loop 2)
*   **Tasks:**
    - Build the Prompt Library catalog page using the responsive `PromptCard` grid.
    - Implement filter tabs for prompt categories.
    - Integrate the Monaco YAML editor on the details page.
    - Connect sliders for Model Configuration (Temperature/Max Tokens).
*   **Success Criteria:** 29 prompt templates list correctly, filter tabs segment prompts, and code editor renders.

### ⚙️ Milestone 3: CIMS Automation Studio (Loop 3)
*   **Tasks:**
    - Implement the CIMS node sequence visualizer.
    - Nodes should change status color dynamically (e.g. flashing warning when enqueued for review).
    - Develop the scheduled crawlers logs panel and manual trigger webhook input card.
*   **Success Criteria:** End-to-end flowchart renders, manual runs can be triggered, and mock timeline logs update dynamically.

### ⚖️ Milestone 4: SLA Center & HITL Console (Loop 4)
*   **Tasks:**
    - Render the multi-temperature RAGAS score table.
    - Add Recharts line charts mapping historical SLA metric compliance.
    - Build the HITL diff comparison workspace (Redacted vs Raw text side-by-side).
    - Connect thestrategic parameters editor form.
*   **Success Criteria:** Table cells color-code dynamically based on score thresholds, and diff comparison renders properly.

### 🚀 Milestone 5: API Integration & Observability (Loop 5)
*   **Tasks:**
    - Bind the Next.js routes to the FastAPI gateway endpoints (Auth, CIMS execution, cache checks).
    - Connect Sentry client-side exception tracking.
    - Finalize build packaging and execute the production release freeze.
*   **Success Criteria:** Live API endpoints populate the dashboard metrics, Sentry collects errors, and build compiles successfully without warnings.
