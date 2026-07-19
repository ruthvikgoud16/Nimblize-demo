# Motion & Animation Guidelines

Animation in Nimblize Studio must feel purposeful, snappy, and deeply integrated into the interaction model. It should never feel decorative or slow down the user's workflow.

## Core Principles
1. **Snappy & Responsive:** Animations must fire immediately upon interaction.
2. **Subtle & Refined:** Use subtle scale and opacity shifts rather than dramatic movements.
3. **Spatial Awareness:** Elements should animate from their logical origin (e.g., Drawers slide in from the edge, Dialogs scale up from the center).
4. **Accessible:** Respect `prefers-reduced-motion` at the global CSS/Framer level.

## Timing & Easing Curves

### Easing Variables
- `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)` (Used for entering elements)
- `--ease-in-expo`: `cubic-bezier(0.7, 0, 0.84, 0)` (Used for exiting elements)
- `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` (Used for state transitions)

### Durations
- **Micro-interactions (Hover, Active, Focus):** `150ms` (0.15s)
- **Enter/Exit Transitions (Cards, Badges, Tooltips):** `200ms` (0.2s)
- **Layout Transitions (Drawers, Dialogs, Viewport changes):** `300ms` (0.3s)
- **Complex Orchestrations (Staggered lists, Pipeline execution):** `500ms` (0.5s)

## Standard Interaction Patterns

### 1. Hover States (Buttons & Cards)
- **Action:** Mouse enters element.
- **Animation:** `scale: 1.02` (for large cards) or `scale: 1.05` (for icon buttons).
- **Duration:** 150ms.
- **Easing:** `ease-out-expo`.

### 2. Press States
- **Action:** Mouse down on interactive element.
- **Animation:** `scale: 0.97` or `scale: 0.95`.
- **Duration:** 100ms.

### 3. Page Transitions
- **Action:** Route change.
- **Animation:** Fade in (`opacity: 0 -> 1`) and slide up slightly (`y: 10px -> 0`).
- **Duration:** 300ms.

### 4. Staggered Entrance (Lists & Grids)
- **Action:** Component mounts (e.g., Prompt Library Grid, Dashboard Metrics).
- **Parent Container:** `staggerChildren: 0.05` (50ms delay between each child).
- **Child Element:** `opacity: 0 -> 1`, `y: 15px -> 0`.
- **Easing:** `ease-out-expo`.

### 5. Drawer / Sidebar Toggle
- **Action:** Opening the Prompt Preview Drawer or expanding the Mobile Sidebar.
- **Animation:** `x: 100% -> 0` (Right drawer) or `x: -100% -> 0` (Left sidebar).
- **Overlay:** Fade `bg-black/80` from `opacity: 0 -> 1`.
- **Duration:** 300ms.

### 6. Pipeline Execution (Automation Studio)
- **Action:** Clicking "Run Pipeline".
- **Animation:** 
  1. Nodes transition from 'idle' (gray) to 'running' (primary color).
  2. A loading spinner icon rotates continuously (`repeat: Infinity`, `duration: 2s`, `ease: linear`).
  3. Progress lines between nodes animate their width (`width: 0% -> 100%`) using `ease-in-out`.
  4. Node transitions to 'completed' (success color) with a subtle pop (`scale: 1.1 -> 1.0`).

### 7. Skeleton Loaders
- **Action:** Waiting for data.
- **Animation:** Shimmer effect passing from left to right.
- **CSS Class:** `animate-pulse` or custom linear gradient shimmer.

## Reduced Motion
Ensure all Framer Motion components fall back to instant transitions if the user's OS specifies reduced motion:
```javascript
// Example check logic conceptually integrated into the app
const prefersReducedMotion = useReducedMotion();
// Apply transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }
```
