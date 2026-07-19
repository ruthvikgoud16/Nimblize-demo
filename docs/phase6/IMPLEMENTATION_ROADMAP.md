# Frontend Implementation Roadmap

This document translates the Figma Design Sprint into actionable development phases for the engineering team.

## Phase A: Foundation & Architecture (Loop 1.0)
*Status: Architecture established.*
1. Initialize Next.js 15 App Router.
2. Configure Tailwind CSS v4 and map all `DESIGN_TOKENS.md` into `globals.css` and `tailwind.config.ts`.
3. Set up `next-themes` for Light/Dark mode toggling.
4. Build the `AppShell`, `AppSidebar`, and `TopNavbar` components.
5. Create the global `mock-data.ts` repository to isolate state.

## Phase B: Component Library Engineering
*Status: Core components mapped.*
1. Install base-ui primitives via shadcn/ui.
2. Implement core atoms (Buttons, Inputs, Badges, Cards).
3. Implement complex UI widgets (MetricCard, ExecutionTimeline) using Framer Motion according to `MOTION_GUIDELINES.md`.
4. Enforce strict TypeScript typing for all props.

## Phase C: Page Implementation (Loop 2.0 & Ultimate Loop)
*Status: Ready for execution.*
1. **Prompt Library:** Implement the grid, filtering logic, and `PromptPreviewDrawer`.
2. **Playground:** Build the split-pane layout, variable parsing, and mock execution simulation.
3. **Automation Studio:** Create the interactive `PipelineGraph` and runtime log viewer.
4. **Evaluation:** Render charts and metric tables.
5. **Reports & Workflow:** Add the final routes and interactive canvas elements.

## Phase D: Backend Integration (Future Phase)
1. Replace `mock-data.ts` with React Server Components (RSC) fetching from the FastAPI backend.
2. Connect the Playground to the live LLM gateway.
3. Connect Automation Studio to the live Kafka/Redis queue events.
4. Implement WebSocket connections for live logs.

## Engineering Standards
- **Zero "any" Types:** Strict TypeScript is mandatory.
- **Component Colocation:** Keep components close to their routes unless reused globally.
- **Client vs Server:** Default to Server Components. Use `"use client"` only when React state (`useState`) or Framer Motion requires it.
- **No Inline Styles:** Use Tailwind classes and `cn()` utility exclusively.
