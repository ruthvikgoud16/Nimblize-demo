# Figma File Structure

This document outlines how the official Nimblize Studio Figma file should be organized to ensure a clean handoff to engineering.

## Pages Hierarchy

1. **Cover**
   - Project thumbnail, status (WIP, Ready for Dev), and date.
2. **Read Me & Handoff**
   - Quick links to this documentation.
   - Change log.
3. **Design Tokens (Variables)**
   - Do not use physical frames for colors; use Figma Variables (Local Variables).
   - Collections: `Colors`, `Spacing`, `Radii`.
   - Modes: `Light`, `Dark`.
4. **Typography Scale**
   - Text Styles mapped to UI elements (H1-H6, Body, Mono, Badges).
5. **Component Library (The Source of Truth)**
   - All interactive components (Buttons, Inputs, Badges, Dropdowns).
   - Complex components (Prompt Cards, Timeline items).
   - Include auto-layout, variants (Hover, Active, Focus, Disabled), and component properties.
6. **Icons & Assets**
   - Lucide React icon set SVG imports.
   - Logos and structural assets.
7. **Screen: Dashboard (`/`)**
   - Desktop, Tablet, Mobile frames.
8. **Screen: Prompt Library (`/library`)**
   - Default Grid, Filtered State, Empty State.
   - Overlays: Drawer open, Comparison modal open.
9. **Screen: Playground (`/playground`)**
   - Pre-run state, Loading state, Evaluated state.
10. **Screen: Automation Studio (`/automation`)**
    - Idle state, Running state, Error state.
11. **Screen: Evaluation (`/evaluation`)**
12. **Screen: Reports & Workflow**
13. **Archive**
    - Old iterations.

## Auto Layout Rules

- **Use Auto Layout Everywhere:** Never position elements absolutely unless they are decorative or strict overlays (like a badge ping).
- **Spacing Variables:** Always bind Auto Layout spacing and padding to the Spacing variables (e.g., gap: `var(--space-4)`).
- **Responsive Resizing:** Ensure frames use "Fill container" and "Hug contents" appropriately so components stretch properly when resized.

## Naming Conventions

- **Components:** PascalCase (e.g., `PromptCard`, `MetricWidget`).
- **Variants:** lowercase (e.g., `state=hover`, `theme=dark`).
- **Frames/Screens:** Desktop / [Page Name] - [State] (e.g., `Desktop / Library - Filtered`).
