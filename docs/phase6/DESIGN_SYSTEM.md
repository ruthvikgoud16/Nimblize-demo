# Nimblize Studio — Design System (v1.0)

**Project:** Nimblize Studio AI SaaS  
**Design Persona:** Minimalist, High-Performance, Technical, Developer-Centric  
**Inspiration:** Vercel, Linear, Cursor, Perplexity  

---

## 1. Brand Identity

*   **Product Name:** Nimblize Studio
*   **Tagline:** Decoupled Prompt Registry & Orchestrated AI Ingestion
*   **Brand Personality:** Crisp, highly responsive, mathematically clean, dark-mode focused.
*   **Mission:** Empower engineers to catalog, validate, optimize, and orchestrate AI prompts and agent pipelines without manual code updates.

---

## 2. Color Palette (Dark Theme First)

```
Background:  [#020617] (Slate 950 - Deepest Obsidian)
Cards/Panels:[#0B0F19] (Slate 900 Modified - Smooth Surface)
Borders:     [#1E293B] (Slate 800 - Minimal Division)
Primary:     [#6366F1] (Indigo 500 - Highlight / Core CTA)
Accent:      [#8B5CF6] (Violet 500 - Secondary Focus)
Text High:   [#FAFAFA] (Zinc 50 - High Contrast Headers)
Text Low:    [#A1A1AA] (Zinc 400 - Secondary Descriptive Labels)
```

### Semantic Status Tokens
- **Success / Ingress:** `#10B981` (Emerald 500)
- **Warning / HITL Review:** `#F59E0B` (Amber 500)
- **Error / DLQ Terminal:** `#EF4444` (Rose 500)

---

## 3. Typography Scale

*   **Main Interface Font:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
*   **Code & Editor Font:** `JetBrains Mono`, `Fira Code`, `Courier New`, `monospace` (for Prompt Templates, YAML syntax highlighting, and CLI Console output)

### Scale Mappings
| Token Name | Font Size | Line Height | Font Weight | Usage |
|---|---|---|---|---|
| **Display 1** | 36px (2.25rem) | 44px | 700 (Bold) | Core landing metrics / Brand marks |
| **Heading 1** | 24px (1.5rem) | 32px | 600 (SemiBold) | Page headers / Primary modules |
| **Heading 2** | 18px (1.125rem) | 26px | 600 (SemiBold) | Section headers / Panel cards |
| **Body Large** | 16px (1rem) | 24px | 400 (Regular) | Primary text content / Inputs |
| **Body Standard** | 14px (0.875rem) | 20px | 400 (Regular) | General dashboard labels / Badges |
| **Code Standard** | 13px (0.8125rem)| 18px | 450 (Medium) | YAML parameters / Token counts |
| **Caption** | 12px (0.75rem) | 16px | 500 (Medium) | Tooltips / Metadata tags |

---

## 4. Spacing System (Base 8px Grid)

All layouts, paddings, margins, and gaps follow a strict 8px multiplier grid to maintain visual alignment:

```
4px  (0.25rem) - Subtle Padding (Badges, icon gaps)
8px  (0.5rem)  - Standard Padding (Inner card margins)
12px (0.75rem) - Medium Padding (Inputs, list items gap)
16px (1rem)    - Section Grid Gap (Layout grid columns, inner card spacing)
24px (1.5rem)  - Outer Padding (Sidebar panel padding, container margins)
32px (2rem)    - Page Header Margin (Space between header and main grid)
48px (3rem)    - Layout Section Gap
64px (4rem)    - Hero / Frame Margins
```

---

## 5. Border Radius & Shadows (Elevation)

### Border Radius
*   `rounded-sm`: 4px (Buttons, badges, tag chips)
*   `rounded-md`: 8px (Outer dialogs, input fields, dropdown menus)
*   `rounded-lg`: 12px (Dashboard panels, prompt playground containers)

### Shadows & Inner Borders
Instead of heavy shadows which degrade dark mode interfaces, Nimblize Studio uses **subtle inner borders** combined with soft blurred background shadows:
*   **Default Card:** Border `1px solid #1E293B` (Slate 800) with no shadow.
*   **Interactive Hover Card:** Border transitions to `1px solid #334155` (Slate 700) with a soft bottom shadow: `0 4px 12px -2px rgba(0, 0, 0, 0.3)`.
*   **Active Popover / Dialog:** Border `1px solid #6366F1` (Indigo 500) with deep background blur: `backdrop-filter: blur(12px)`.

---

## 6. Icons & Motion Design

*   **Icon Family:** Lucide Icons (clean, 1.5px stroke weight, round cap joints).
*   **Transition Speeds:**
    - Standard hover states: `150ms ease-out`
    - Modal/dialog popups: `200ms cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
    - Code execution load bars: `300ms linear` progress fills
