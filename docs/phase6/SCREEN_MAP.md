# Screen Map & Layout Anatomy

This document defines the structural composition of every screen in Nimblize Studio across breakpoints.

## Global Layout Anatomy (AppShell)
- **Desktop (>1024px):** 
  - Left Sidebar (240px width, collapsible to 64px).
  - Sticky Topbar (64px height) with breadcrumbs and actions.
  - Scrollable Main Content Area.
- **Tablet (768px - 1024px):**
  - Left Sidebar collapses to icon-only (64px) by default.
  - Sticky Topbar.
- **Mobile (<768px):**
  - Hidden Sidebar.
  - Sticky Topbar with a Hamburger menu icon.
  - Hamburger opens a full-screen or slide-out Drawer containing navigation.

## 1. Dashboard (`/`)
- **Header:** Welcome message, Date/Time.
- **Top Row:** 4 Metric Cards (Prompts, Vector Chunks, Cache Hit Rate, SLA).
- **Middle Row (Split):**
  - Left (66%): Execution Timeline (vertical stepper).
  - Right (33%): Category Distribution (horizontal progress bars).
- **Bottom Row (Split):**
  - Left (50%): Quick Actions Grid.
  - Right (50%): Recent Activity Feed.

## 2. Prompt Library (`/library`)
- **Header:** Title, "Compare", "New Prompt" buttons.
- **Category Overview:** 4 cards showing aggregate stats (count, average quality) per category.
- **Toolbar:** Search Input (left), Filter/Sort/View Toggles (right).
- **Grid:** Responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop) of `PromptCard` components.
- **Overlay:** `PromptPreviewDrawer` slides from the right.
- **Overlay:** `PromptComparison` opens as a wide, center-screen Dialog.

## 3. Prompt Playground (`/playground`)
- **Header:** Title, "Save as Draft", "Run Prompt" buttons.
- **Layout:** Responsive Split-Pane.
  - **Left Pane (Configuration):**
    - Prompt selector dropdown.
    - Model/Temp indicators.
    - Split vertically: Top half is YAML Source (read-only), Bottom half is Variables (input forms).
  - **Right Pane (Execution):**
    - Output console (streams text).
    - Bottom half: RAGAS Evaluation scorecard grid.
  - *Mobile behavior:* Stacks vertically.

## 4. Automation Studio (`/automation`)
- **Header:** Title, "Run Pipeline" button.
- **Layout:** Responsive Split-Pane.
  - **Left Pane:** Pipeline Graph (vertical list of connected nodes).
  - **Right Pane:** Runtime Logs console.

## 5. Evaluation Dashboard (`/evaluation`)
- **Header:** Title, "Filters", "Export" buttons.
- **Top Row:** 4 Evaluation specific Metric Cards.
- **Bottom Row (Split):**
  - Left (66%): Quality Trend Chart (bar chart).
  - Right (33%): Recent Evaluations Table (scrollable list).

## 6. Reports Center (`/reports`)
- **Header:** Title, Search/Filter.
- **Grid/Table:** List of reports with PDF/Markdown icons.
- **Overlay:** Markdown viewer side-drawer.

## 7. Workflow Explorer (`/workflow`)
- **Layout:** Full-bleed canvas for interactive node mapping. Floating control palette for zoom/pan.
