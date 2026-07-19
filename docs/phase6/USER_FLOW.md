# User Flows

This document maps the primary user journeys through Nimblize Studio. Figma prototypes should link these flows directly.

## Flow 1: Prompt Discovery & Execution
**Goal:** Find a specific prompt, review it, and test it in the playground.
1. **Home/Dashboard:** User lands on Dashboard. Sees "SEO Strategy Gen" in Recent Activity or clicks "Browse Prompts" in Quick Actions.
2. **Prompt Library:** User navigates to `/library`.
3. **Search & Filter:** User types "SEO" in the search bar. The grid filters instantly.
4. **Preview Drawer:** User clicks the `SEO-001` prompt card. A right-side drawer slides in showing YAML, tags, and metrics.
5. **Launch Playground:** User clicks "Open in Playground" from the drawer.
6. **Playground Editor:** User is taken to `/playground`. The prompt is pre-selected.
7. **Configure:** User fills in the `domain` variable input dynamically generated from the YAML.
8. **Execute:** User clicks "Run Prompt".
9. **Results:** A loading state appears, followed by the simulated LLM output and RAGAS evaluation scorecard.

## Flow 2: Pipeline Orchestration & Monitoring
**Goal:** Trigger a data pipeline and monitor its execution.
1. **Navigation:** User clicks "Automation" in the sidebar.
2. **Automation Studio:** User lands on `/automation`. Sees the visual node graph.
3. **Trigger:** User clicks "Run Pipeline" button in the header.
4. **Execution Animation:** The first node (Webhook Trigger) turns blue and spins. Lines between nodes fill with progress.
5. **Monitoring:** User clicks the "LLM Generation" node while it's running. The right-side "Runtime Logs" panel updates to show real-time streaming logs.
6. **Completion:** The pipeline finishes. Nodes turn green (Success). The duration is displayed on each node.

## Flow 3: Evaluation Analysis
**Goal:** Review the quality of recent prompt executions.
1. **Navigation:** User clicks "Evaluation" in the sidebar.
2. **Evaluation Dashboard:** User sees high-level metric cards (e.g., 94.2% SLA).
3. **Trend Analysis:** User hovers over the 30-day Quality Trend bar chart to view specific day metrics.
4. **Detailed Review:** User looks at the "Recent Evaluations" table, sorting by "Fail" to investigate low-scoring outputs (e.g., Score: 0.74).

## Flow 4: Architecture Exploration
**Goal:** Understand how the Nimblize system fits together.
1. **Navigation:** User clicks "Workflow Explorer".
2. **Interactive Diagram:** User sees a sprawling, interactive system architecture map.
3. **Inspect:** User clicks the "Redis Semantic Cache" node.
4. **Details:** A panel opens explaining the cache TTL, hit rates, and the related Python backend files.
