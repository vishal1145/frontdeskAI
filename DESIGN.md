# FrontDesk AI - Design System Manifesto & Style Guide (DESIGN.md)

> **MANDATORY RULE**: Har UI kaam se pehle `DESIGN.md` aur design tokens follow karo. Hardcoded font-size, color, ya ad-hoc spacing mat use karo. Always use Tailwind tokens or CSS variables.

---

## 🎨 Theme: "Enterprise SaaS Light Luxury" (Stripe / Linear Light / Resend Aesthetic)
- **Primary Canvas**: Clean White (`#FFFFFF`) with subtle alternating sections (`#F8FAFC`, `#F1F5F9`)
- **Card / Surface**: Pure White (`#FFFFFF`) with ultra-fine neutral borders (`#E2E8F0` / `rgba(226, 232, 240, 0.8)`) and multi-layered diffused soft shadows.
- **Brand Voice Accent**: Logo Azure (`#1570E0`, `#2B8AF7`, `#174C96`) - primary CTAs, active states, brand emphasis. Defined in `frontend/design-tokens.js`.
- **Secondary Accent**: Glow Cyan (`#60F7FC`, `#48E7FD`) - decorative highlights only.
- **Warning / Alert**: Amber Warmth (`#D97706`, `#F59E0B`)
- **Text Hierarchy**:
  - `text-slate-900` (`#0F172A`) - Primary headings, high contrast, crisp font weight
  - `text-slate-700` (`#334155`) - Body text, high legibility
  - `text-slate-500` (`#64748B`) - Secondary captions & metadata
- **Typography**: One typeface: `Hanken Grotesk`. Sizes and weights are managed in `frontend/design-tokens.js`, see Typography Tokens below.

---

## 📐 Design Tokens Reference

**Token file: `frontend/design-tokens.js`.** Change colours, typography and shadows there only. Tailwind and the `--fd-*` CSS variables are both built from it.

In JSX use token classes (`text-ink`, `bg-blue-600`), never `text-[#0E1A2E]`. In `index.css` use `theme('colors.blue.600')`, with quotes.

| Change | Token | Example use |
|---|---|---|
| Colour | `colors` (`tint` holds extra shades) | `text-ink`, `border-slate-900/[0.16]`, `theme('colors.blue.600 / 0.2')` |
| Text size | `fontSize` | `text-13`, `theme('fontSize.13')` |
| Letter spacing | `letterSpacing` | `tracking-wide-60` |
| Line height | `lineHeight` | `leading-ratio-140` |
| Spacing | `spacing` | `p-s-18`, `theme('spacing.s-18')` |
| Radius | `borderRadius` | `rounded-14` |
| Animation | `animation`, `keyframes` | `animate-marquee` |
| Canvas and inline styles | import `colors`, `withAlpha`, `rgbChannels` | `withAlpha(colors.ink.DEFAULT, 0.4)` |

Do not write arbitrary values like `text-[13px]` or `rounded-[14px]`. Add a token first.

### 1. Light Colors Scale
| Token | Hex / Value | Purpose |
|---|---|---|
| `bg-canvas` | `#FFFFFF` | Primary page background |
| `bg-canvas-subtle` | `#F8FAFC` | Alternating section background |
| `bg-surface` | `#FFFFFF` | Card & container surface |
| `bg-surface-elevated` | `#FFFFFF` | Modals, floating widgets, popovers |
| `brand` | `#1570E0` | Primary CTA, active telephone status, voice indicators |
| `brand-vivid` | `#2B8AF7` | Secondary highlights |
| `border-subtle` | `#E2E8F0` | Elegant 1px borders |
| `border-glow` | `rgba(72, 231, 253, 0.55)` | Active focus & hover border |
| `text-primary` | `#0F172A` | Major headings (Slate 900) |
| `text-secondary` | `#334155` | Paragraph body (Slate 700) |
| `text-muted` | `#64748B` | Meta information (Slate 500) |

### 2. Multi-Layer Diffused Shadows (10-Year Senior Designer Quality)
- `shadow-card-subtle`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
- `shadow-card-elevated`: `0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`
- `shadow-card-hover`: `0 20px 35px -10px rgba(13, 148, 136, 0.12), 0 10px 15px -3px rgba(15, 23, 42, 0.05)`
- `shadow-teal-glow`: `0 8px 25px -4px rgba(13, 148, 136, 0.35)`

### 3. Micro-Animations & Interactivity
- `animate-float`: Subtle 6s floating breathing effect
- `animate-wave-bar`: Smooth audio bar frequency oscillation (height 20% to 95%)
- `animate-pulse-subtle`: Gentle breathing ring for live voice status
- `transition-all duration-200 ease-out`: Snappy tactile feel on all buttons and cards

### 4. Typography Tokens
All values live in `frontend/design-tokens.js`.

- **Family**: use `var(--fd-font-sans)` or `font-sans`. To change the font, edit `font` (name and `googleFontsUrl`); `vite.config.js` loads it into the page. No second typeface.
- **Weights**: `--fd-weight-normal` 400, `--fd-weight-medium` 500, `--fd-weight-semibold` 600, `--fd-weight-bold` 700, `--fd-weight-extrabold` 800. `font-medium`, `font-semibold` and similar classes read these.
- **Sizes**: `fontSize` holds the size and line height behind `text-xs` to `text-6xl`.
- **Letter spacing**: `--fd-letter-spacing` is the page default.

New UI uses these classes. Do not add new arbitrary sizes like `text-[13px]`.

### 5. Text Categories (Header / Subheader / Content)
Each category has its own tokens in `typography` in `frontend/design-tokens.js`: `fontFamily`, `fontSize`, `fontWeight`, `color`, `lineHeight`, `letterSpacing`, `textTransform`.

| Category | Applies to |
|---|---|
| `header` | `h1`, `h2`, hero and section titles |
| `subheader` | `h3` to `h6`, lead paragraphs, eyebrow pills, intro lines |
| `content` | Paragraphs, lists, tables, labels, inputs, general text. Not buttons or links |
| `button` | Buttons |
| `link` | Links |

- `null` keeps the current design. No CSS is generated for it.
- Any other value overrides that property across the whole category, including utility classes.
- A set value creates a variable such as `--fd-header-font-size`.
