# Nimblize Studio Design System

This document outlines the overarching brand identity, visual language, and design principles for Nimblize Studio. It is the foundation for the Phase 6 Figma Sprint.

## 1. Brand Identity

**Product Name:** Nimblize Studio  
**Tagline:** Production-grade AI prompt engineering and orchestration.  
**Mission:** To provide engineering teams with a deterministic, observable, and reliable environment for developing and evaluating LLM prompts.  
**Brand Personality:** Professional, precise, technical, developer-centric, unobtrusive.

## 2. Visual Language & Aesthetics

Nimblize Studio aims to match the caliber of tools like Vercel, Linear, and Cursor.
- **Dark-Mode First (but Light-Mode Supported):** The default environment is a deep, immersive dark mode utilizing extremely dark slate/blue tones (e.g., `#09090b` for backgrounds).
- **Subtle Accents:** Core brand color is a vibrant Indigo/Violet (`#4f46e5`). It is used sparingly for primary actions, active states, and focus rings.
- **High Information Density:** The UI must support complex data (YAML, logs, metrics) without feeling cluttered. Use borders (`border-border`) and subtle background shifts (`bg-card`, `bg-muted`) instead of heavy drop shadows to separate content.
- **Glassmorphism:** Use blurred translucent backgrounds (`backdrop-blur-md`, `bg-background/80`) for sticky headers, command palettes, and floating elements to provide depth without solid occlusion.

## 3. Design Principles

1. **Content is King:** The interface should recede. Prompts, code, and evaluation metrics are the primary focus.
2. **Speed & Efficiency:** Every action should feel instantaneous. Rely heavily on keyboard shortcuts (`Cmd+K` command palette, `Cmd+S` save, `Cmd+Enter` execute).
3. **Deterministic Feedback:** Never leave the user guessing. Clear loading states (skeletons, spinners), success toasts, and error boundaries must be strictly implemented.
4. **Consistency:** A button must look like a button everywhere. Use the strictly defined UI Component catalog. Avoid ad-hoc styling.

## 4. Accessibility Rules

- **Contrast:** Ensure all text passes WCAG 2.1 AA requirements (minimum 4.5:1 ratio for normal text). Muted text must still be readable against dark backgrounds.
- **Focus Rings:** All interactive elements must have a visible focus state (`focus-visible:ring-1 focus-visible:ring-ring`). Do not disable outlines without providing a visual alternative.
- **Keyboard Navigation:** The entire application, especially the Prompt Library and Workflow Explorer, must be fully navigable via keyboard (`Tab`, `Enter`, `Space`, `Arrow Keys`).
- **Screen Readers:** Use semantic HTML and appropriate ARIA labels for non-text interactive elements (e.g., icon-only buttons).

## 5. Layout Hierarchy

- **Global Navigation (Sidebar):** Left-aligned vertical sidebar containing primary routes (Dashboard, Library, Playground, Automation, etc.). Collapsible to icon-only mode to maximize workspace.
- **Contextual Header (Topbar):** Contains page title, breadcrumbs, search/command trigger, environment selectors, and global actions.
- **Main Content Area:** The central workspace. Utilizes flexible grids and split-panes (for Playground/Workflows).
- **Contextual Drawers/Panels (Right side):** Used for inspecting details (Prompt Preview, Node Logs, Evaluation Details) without losing context of the main view.
