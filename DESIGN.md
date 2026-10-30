# FrontDesk AI - Design System Manifesto & Style Guide (DESIGN.md)

> **MANDATORY RULE**: Har UI kaam se pehle `DESIGN.md` aur design tokens follow karo. Hardcoded font-size, color, ya ad-hoc spacing mat use karo. Always use Tailwind tokens or CSS variables.

---

## 🎨 Theme: "Enterprise SaaS Light Luxury" (Stripe / Linear Light / Resend Aesthetic)
- **Primary Canvas**: Clean White (`#FFFFFF`) with subtle alternating sections (`#F8FAFC`, `#F1F5F9`)
- **Card / Surface**: Pure White (`#FFFFFF`) with ultra-fine neutral borders (`#E2E8F0` / `rgba(226, 232, 240, 0.8)`) and multi-layered diffused soft shadows.
- **Brand Voice Accent**: Clinical Teal & Jade (`#0D9488`, `#0F766E`, `#14B8A6`) - gives deep healthcare credibility, freshness, and calmness.
- **Secondary Accent**: High-Trust Electric Sapphire (`#0284C7`, `#0369A1`) - AI intelligence & telemetry.
- **Warning / Alert**: Amber Warmth (`#D97706`, `#F59E0B`)
- **Text Hierarchy**:
  - `text-slate-900` (`#0F172A`) - Primary headings, high contrast, crisp font weight
  - `text-slate-700` (`#334155`) - Body text, high legibility
  - `text-slate-500` (`#64748B`) - Secondary captions & metadata
- **Typography**: Primary Display & Body: `Manrope` (Clean Swiss neo-grotesque like Stripe / FinTech), Monospace: `JetBrains Mono`

---

## 📐 Design Tokens Reference

### 1. Light Colors Scale
| Token | Hex / Value | Purpose |
|---|---|---|
| `bg-canvas` | `#FFFFFF` | Primary page background |
| `bg-canvas-subtle` | `#F8FAFC` | Alternating section background |
| `bg-surface` | `#FFFFFF` | Card & container surface |
| `bg-surface-elevated` | `#FFFFFF` | Modals, floating widgets, popovers |
| `accent-teal` | `#0D9488` | Primary CTA, active telephone status, voice indicators |
| `accent-sapphire` | `#0284C7` | Telemetry badges, secondary highlights |
| `border-subtle` | `#E2E8F0` | Elegant 1px borders |
| `border-glow` | `rgba(13, 148, 136, 0.3)` | Active focus & hover border |
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
