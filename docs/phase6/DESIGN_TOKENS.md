# Design Tokens (Figma Global Variables)

These tokens serve as the foundation for the Nimblize Studio UI. They must be mapped exactly in the Figma Variables panel and subsequently mirrored in `globals.css` and `tailwind.config.ts`.

## Color Palette

### Base Scale (Indigo/Violet)
- `--indigo-50`: `#eef2ff`
- `--indigo-100`: `#e0e7ff`
- `--indigo-200`: `#c7d2fe`
- `--indigo-300`: `#a5b4fc`
- `--indigo-400`: `#818cf8`
- `--indigo-500`: `#6366f1`
- `--indigo-600`: `#4f46e5`
- `--indigo-700`: `#4338ca`
- `--indigo-800`: `#3730a3`
- `--indigo-900`: `#312e81`
- `--indigo-950`: `#1e1b4b`

### Semantic Colors (Light Mode)
- `--background`: `#ffffff`
- `--foreground`: `#09090b`
- `--card`: `#ffffff`
- `--card-foreground`: `#09090b`
- `--popover`: `#ffffff`
- `--popover-foreground`: `#09090b`
- `--primary`: `#4f46e5` (indigo-600)
- `--primary-foreground`: `#ffffff`
- `--secondary`: `#f4f4f5`
- `--secondary-foreground`: `#18181b`
- `--muted`: `#f4f4f5`
- `--muted-foreground`: `#71717a`
- `--accent`: `#f4f4f5`
- `--accent-foreground`: `#18181b`
- `--destructive`: `#ef4444`
- `--destructive-foreground`: `#ffffff`
- `--warning`: `#f59e0b`
- `--warning-foreground`: `#ffffff`
- `--success`: `#10b981`
- `--success-foreground`: `#ffffff`
- `--border`: `#e4e4e7`
- `--input`: `#e4e4e7`
- `--ring`: `#4f46e5`

### Semantic Colors (Dark Mode)
- `--background`: `#09090b`
- `--foreground`: `#fafafa`
- `--card`: `#09090b`
- `--card-foreground`: `#fafafa`
- `--popover`: `#09090b`
- `--popover-foreground`: `#fafafa`
- `--primary`: `#6366f1` (indigo-500)
- `--primary-foreground`: `#ffffff`
- `--secondary`: `#27272a`
- `--secondary-foreground`: `#fafafa`
- `--muted`: `#27272a`
- `--muted-foreground`: `#a1a1aa`
- `--accent`: `#27272a`
- `--accent-foreground`: `#fafafa`
- `--destructive`: `#7f1d1d`
- `--destructive-foreground`: `#fca5a5`
- `--warning`: `#78350f`
- `--warning-foreground`: `#fcd34d`
- `--success`: `#064e3b`
- `--success-foreground`: `#6ee7b7`
- `--border`: `#27272a`
- `--input`: `#27272a`
- `--ring`: `#6366f1`

## Typography

### Font Families
- **Sans-Serif (Primary):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `sans-serif`
- **Monospace (Code/Variables):** `JetBrains Mono`, `Fira Code`, `Consolas`, `monospace`

### Font Sizes & Leading
- `--text-xs`: `0.75rem` (12px), Line Height: `1rem` (16px)
- `--text-sm`: `0.875rem` (14px), Line Height: `1.25rem` (20px)
- `--text-base`: `1rem` (16px), Line Height: `1.5rem` (24px)
- `--text-lg`: `1.125rem` (18px), Line Height: `1.75rem` (28px)
- `--text-xl`: `1.25rem` (20px), Line Height: `1.75rem` (28px)
- `--text-2xl`: `1.5rem` (24px), Line Height: `2rem` (32px)
- `--text-3xl`: `1.875rem` (30px), Line Height: `2.25rem` (36px)

### Font Weights
- **Regular:** 400 (Body text, descriptions)
- **Medium:** 500 (Buttons, badges, secondary headers)
- **Semibold:** 600 (Card titles, page headers)
- **Bold:** 700 (Primary metrics, key highlights)

## Spacing (8px Grid System)

- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1rem` (16px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2rem` (32px)
- `--space-12`: `3rem` (48px)
- `--space-16`: `4rem` (64px)

## Border Radius

- `--radius-sm`: `0.125rem` (2px)
- `--radius-md`: `0.375rem` (6px)
- `--radius-lg`: `0.5rem` (8px)
- `--radius-xl`: `0.75rem` (12px)
- `--radius-2xl`: `1rem` (16px)
- `--radius-full`: `9999px`

## Elevation & Shadows

- **Light Mode Shadows:**
  - `--shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
  - `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
  - `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **Dark Mode Shadows:** Rely heavily on inner borders and subtle background color shifts (`bg-muted/50`) rather than deep drop shadows. Glow effects (`box-shadow: 0 0 15px rgba(99, 102, 241, 0.2)`) can be used for active focus states.

## Opacity & Blurs

- **Glassmorphism (Backgrounds):** `rgba(255,255,255,0.7)` (Light) / `rgba(9,9,11,0.7)` (Dark)
- **Backdrop Blur:** `backdrop-blur-md` (12px blur radius) for Top Navigation and Command Palette overlays.
