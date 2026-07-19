# Nimblize Studio — UI Component Inventory & 21st.dev Mapping

**Project:** Nimblize Studio AI SaaS  
**Objective:** Clean, reusable component definitions mapped to industry-standard UI libraries.  

---

## 1. Global Navigation & Layout Components

### Collapsible Sidebar (`AppSidebar`)
*   **Figma Location:** Left Panel (Global Frame)
*   **Purpose:** Exposes primary routes (Dashboard, Library, Automation, Evaluation, Review Queue, Settings).
*   **UI Library Map:** Shadcn UI `Sidebar` component.
*   **Customization:** Minimalist dark border (`border-r border-slate-800`), active route highlighted with soft indigo border on the left (`before:border-l-2 before:border-indigo-500`).

### Top Navigation Bar (`AppNavbar`)
*   **Figma Location:** Top Panel (Global Frame)
*   **Purpose:** Houses global search trigger, active environment status badge, notifications dropdown, and user profile drawer.
*   **UI Library Map:** Shadcn UI `NavigationMenu`.
*   **Customization:** Backdrop blur glass styling (`bg-slate-950/80 backdrop-blur-md`).

---

## 2. Core Dashboard Components

### Metric Status Card (`MetricCard`)
*   **Figma Location:** Dashboard Overview Row 1
*   **Purpose:** Displays high-level platform health metrics (Prompt counts, pgvector counts, Cache hit rates).
*   **UI Library Map:** Shadcn UI `Card` with `CardHeader`, `CardTitle`, and `CardContent`.
*   **Customization:** Top-accent lines colored according to status (e.g. emerald top line for 100% SLA compliance).

### Live Ingestion Timeline (`ExecutionTimeline`)
*   **Figma Location:** Dashboard Overview Row 2
*   **Purpose:** Renders a vertical step-by-step progress checklist for the active CIMS ingestion process.
*   **UI Library Map:** Custom Timeline component built with TailwindCSS lists.
*   **Customization:** Vertically connected dots that fill with color as stages (`TRIGGER` ➔ `PII_FILTER` ➔ `CACHE` ➔ `RAG_RETRIEVAL` ➔ `EXTRACTION` ➔ `STRATEGY` ➔ `RAGAS_EVALUATION` ➔ `PERSISTENCE`) execute.

---

## 3. Prompt Library Components

### Prompt Card (`PromptCard`)
*   **Figma Location:** Prompt Library Page Catalog
*   **Purpose:** Card-based template overview showing ID, Name, Model, Category, and active version tag.
*   **UI Library Map:** 21st.dev Premium Card layout or Shadcn UI `Card`.
*   **Customization:** Gray hover highlight (translates background from slate-950 to slate-900). Hover triggers a subtle scale expansion.

---

## 4. Prompt Playground Components

### YAML Prompt Editor (`PromptEditor`)
*   **Figma Location:** Playground Page Left Panel
*   **Purpose:** Live code block editor allowing users to modify YAML properties.
*   **UI Library Map:** `@monaco-editor/react` (configured to dark theme).
*   **Customization:** Custom YAML keywords highlight (e.g. id, version, output_schema color-coded).

### Model Config Panel (`ModelSettings`)
*   **Figma Location:** Playground Page Right Drawer
*   **Purpose:** Slider adjustments for LLM call configurations.
*   **UI Library Map:** Shadcn UI `Slider` (for Temperature scale 0.0 - 1.0) and `Select` (for model selector).

---

## 5. Evaluation & HITL Review Components

### SLA Comparison Grid (`BenchmarkTable`)
*   **Figma Location:** Evaluation Center Page Row 1
*   **Purpose:** A detailed grid showing RAGAS scores across multiple temperatures.
*   **UI Library Map:** Shadcn UI `Table`.
*   **Customization:** Cells are color-coded based on thresholds (emerald text for score `>= 0.85`, amber for `< 0.85`).

### Dual Ingestion Text Diff (`PIIComparePanel`)
*   **Figma Location:** HITL Review Page Left Panel
*   **Purpose:** Shows scraped raw text alongside redacted PII text to audit Microsoft Presidio performance.
*   **UI Library Map:** `react-diff-viewer-continued` (configured in split-view dark mode).

---

## 6. Command Palette & Alerts

### Global Search Command Palette (`CommandPalette`)
*   **Figma Location:** Triggered globally via `Cmd + K` or navbar search click.
*   **Purpose:** Quickly jump to prompts by ID, run automation, or navigate pages.
*   **UI Library Map:** Shadcn UI `Command` dialog.

### Toast Status Alert (`ToastAlert`)
*   **Figma Location:** Appears in the bottom-right corner during asynchronous actions.
*   **Purpose:** Notification trigger alerts for CIMS success or RAGAS gate failures.
*   **UI Library Map:** Shadcn UI `useToast` hooks.
