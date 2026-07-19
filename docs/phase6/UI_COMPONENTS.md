# UI Component Catalog

This document defines the exact UI components used in Nimblize Studio. It maps Figma components to their code equivalents (shadcn/ui, 21st.dev, and custom implementations).

## Core Primitives (shadcn/ui & base-ui)

- **Button:** 
  - Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
  - Sizes: `default`, `sm`, `lg`, `icon`.
- **Input & Textarea:** Standard form fields with defined focus rings and disabled states.
- **Badge:** Status indicators. Variants: `default`, `secondary`, `outline`, `destructive`. (Custom colors applied via utilities for warning/success).
- **Card:** Container for metrics, forms, and prompt templates. Uses `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Dropdown Menu:** Context menus and filters.
- **Dialog & Sheet:** 
  - `Dialog` (Modal): Used for center-screen focus tasks (e.g., Prompt Comparison, Command Palette).
  - `Sheet` (Drawer): Used for side-panel inspections (e.g., Prompt Preview).
- **Tabs:** For switching between views (e.g., YAML vs. Variables in Playground).
- **Scroll Area:** Custom scrollbars matching the OS aesthetic.
- **Separator:** Visual dividers (`<hr />` equivalent).
- **Skeleton:** Loading placeholders.
- **Tooltip:** Hover labels for icon buttons and truncated text.

## Complex / Custom Components

- **AppShell & Navigation:**
  - `AppSidebar`: The collapsible main navigation.
  - `TopNavbar`: The glassmorphic top header.
  - `CommandPalette`: `Cmd+K` global search dialog utilizing `cmdk`.
- **Dashboard Widgets:**
  - `MetricCard`: Displays KPI with trend indicator and icon.
  - `ExecutionTimeline`: Vertical steps representing pipeline stages.
  - `CategoryChart`: Distribution visualizations.
- **Prompt Library:**
  - `PromptCard`: Animated grid item displaying prompt metadata, quality score, and tags.
  - `CategoryOverview`: Animated summary cards at the top of the library.
- **Playground & Automation:**
  - `SplitPane`: Resizable layout separating editor and execution results.
  - `PipelineGraph`: Interactive flowchart representing execution nodes (Webhook -> LLM -> Validation).

## States to Design in Figma

Every component must have variants for the following states:
1. **Default (Light & Dark)**
2. **Hover**
3. **Active / Pressed**
4. **Focus (Focus-visible ring)**
5. **Disabled (Opacity 50%, unclickable)**
6. **Loading (Spinner or Skeleton representation)**
