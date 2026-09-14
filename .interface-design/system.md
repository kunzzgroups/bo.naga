# Design System — Backoffice Admin Panel

Locked theme for this product. Do not invent alternate palettes.

## Direction

**Product:** Backoffice Admin Panel (admin / SaaS dashboard)  
**Personality:** Modern ops terminal — precision, density, enterprise trust  
**Theme name:** Charcoal + Amber  
**Foundation:** Soft charcoal structure + amber interaction  
**Depth:** Light = 1px border + soft warm shadow · Dark = borders / soft surface lift (no dead black)  
**Signature:**  
- Light: orange→white canvas continuum · opaque sidebar `#FFE8CC` · amber active  
- Dark: warm charcoal→cool charcoal continuum · opaque sidebar `#3A3226` · amber neon active  

**Reference implementation:** Admin Detail pages (`data-access-page="main_admin_detail"`).

## Intent

- **Who:** Brand / ops executives scanning accounts, roles, credits — not designers browsing demos  
- **Task:** Manage admins → adjust credit → audit security  
- **Feel:** Calm charcoal room with amber signals — never navy/cyan identity, never playful purple SaaS defaults  

## Rejected defaults (retired)

- **Deep Navy Cyan** (fully retired): `#123B66`, `#21A6D7`, `#1B94C2`, `#072647`, `#08131F`, `#102030`, `#0B1626`, `#0F1F33`, `#243B55`
- Purple-on-white / indigo gradients
- Warm cream (`#F4F1EA`) + terracotta editorial look as a *marketing* default (warm continuum is intentional brand here — use documented amber tokens only)
- Inter / Roboto / Arial as display identity
- Generic `#2864ed` BO blue
- Dead black canvas (`#000` / `#0A0A0B`)

---

## Tokens

### Brand (shared roles)

| Role | Light | Dark |
|------|-------|------|
| Primary CTA / active / focus | `#D97706` | `#F59E0B` |
| Primary deep / hover | `#B45309` | `#D97706` |
| Bright amber | `#F59E0B` | `#FBBF24` |
| Secondary (rare info) | `#2563EB` | `#D97706` |
| Success | `#12B76A` | `#10B981` |
| Danger | `#991B1B` | `#F87171` |
| Accent-on (on primary fill) | `#FFFFFF` | `#2A2C36` |

### Surfaces & text

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--bo-bg` | `#F7F6F3` | `#2C2E38` | Page canvas base |
| `--bo-surface` | `#FFFFFF` | `#383A46` | Cards, panels, topbar |
| `--bo-border` | `#E4E4E7` | `rgba(255,255,255,.10)` | Separators / inputs |
| `--bo-text` | `#18191C` | `#F5F5F4` | Primary text |
| `--bo-text-secondary` | `#27272A` | `#E7E5E4` | Secondary text |
| `--bo-muted` | `#71717A` | `#A1A1AA` | Meta, time, captions |
| `--bo-control-well` | `#F0EFEA` | `rgba(255,255,255,.06)` | Input wells |
| `--bo-placeholder` | `#A1A1AA` | `#71717A` | Placeholders |

### Compatibility aliases (names kept, hues changed)

| Token | Light | Dark | Meaning now |
|-------|-------|------|-------------|
| `--bo-navy` | `#18191C` | `#F5F5F4` | Primary text / emphasis (not navy) |
| `--bo-cyan` | `#D97706` | `#F59E0B` | Amber accent (not cyan) |
| `--bo-cyan-deep` | `#B45309` | `#D97706` | Amber deep |
| `--bo-ui-blue` | `#D97706` | `#F59E0B` | Same as primary amber |
| `--bo-sidebar-active` | `#D97706` | `#F59E0B` | Active nav |
| `--bo-sidebar-active-bg` | `#FFE8CC` | `rgba(245,158,11,.14)` | Active nav fill |
| `--bo-cyan-tint` | `rgba(217,119,6,.12)` | `rgba(245,158,11,.16)` | Soft amber wash |

### Sidebar & canvas continuum

| Mode | Opaque sidebar | Canvas L→R (~96px past sidebar edge) |
|------|----------------|--------------------------------------|
| Light | `#FFE8CC` | `#FFE8CC` → `#FFF1DC` → `#FFF8EB` → `#FFFCF7` → `#FFFFFF` |
| Dark | `#3A3226` | `#3A3226` → `#342E28` → `#2F2E32` → `#2D2E36` → `#2C2E38` |

Rules:

1. Continuum lives on **html/canvas** only (`background-attachment: fixed`).
2. Sidebar is **opaque** (never transparent when expanded over content).
3. Panels / tables stay **solid** `--bo-surface` (never tinted by continuum wash).
4. Amber 2px edge rail on sidebar right edge.
5. L1 nav labels: `font-weight: 800`. Light L1 color: `#6b360c`.

### Tips / money / chrome

| Element | Light | Dark |
|---------|-------|------|
| Hover tip bg | `#FFF8EB` | `#40424E` |
| Hover tip text | `#6b360c` | `#F5F5F4` |
| Hover tip border | `rgba(217,119,6,.28)` | `rgba(245,158,11,.35)` |
| Tip radius | `999px` | `8–999px` (prefer pill on light) |
| Money positive | `#B45309` | `#F59E0B` |
| Ghost / Export gradient | soft gray | `#4A4C58` → `#383A46` → `#2C2E38` |
| Modal z-index | `30000` (above sidebar / flyout) | same |

### Spacing

Base: `4px`  
Scale: `4, 8, 10, 12, 14, 16, 18, 20, 24, 32`

### Radius

| Use | Value |
|-----|-------|
| Inputs / buttons | `10px` |
| Cards / panels | `16px` |
| Nav items | `10px` |
| Pills / switches / light tips | `999px` |

### Typography

- UI: system stack; hierarchy via weight + color
- Sidebar L1: `800`
- Money / time: tabular nums; mono OK for dense cells

### Depth

| Mode | Strategy |
|------|----------|
| Light | 1px `#E4E4E7` + soft warm shadow |
| Dark | Surface `#383A46` on canvas `#2C2E38`; prefer border over heavy shadow |

---

## Layout

- Shell: left sidebar + topbar + main
- Sidebar width: `--sidebar-w` (~280px); mini-rail `--rail-w` (~72px)
- Modals: append under `body` (outside `report-shell` / `main`) so backdrop covers sidebar
- First viewport: no marketing collage; one job per section

---

## Patterns

### Sidebar nav

- Opaque fill matching continuum left stop
- Active: amber text/fill + left amber bar
- Logout: danger red, not amber

### Topbar

- Light: solid `#FFFFFF`
- Dark: solid `#383A46`
- Theme toggle left of profile

### Buttons

- Primary: amber gradient CTA
- Ghost: soft charcoal/gray gradient (dark) or light gray (light)
- Height ~42px filters · radius ~10px

### Forms

- Inputs: dark soft charcoal `#2A2C36` on dark; light well `#F0EFEA` / surface white on light
- Focus: amber ring (never cyan)

### Date / time tips

- Light cream tip or dark charcoal tip per mode above — never navy `#0F1F33`

---

## Accessibility

- Maintain WCAG AA: amber on charcoal / dark text on cream
- Focus ring: amber outline with soft glow
- Respect `prefers-reduced-motion`

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Charcoal + Amber locked as product system | User confirmed Admin trial as final light+dark identity | 2026-09-14 |
| Deep Navy Cyan fully retired | Replaced by Admin continuum system | 2026-09-14 |
| Canvas-only continuum | Avoid muddy wash under panels; sidebar stays opaque | 2026-09-14 |
| Light tip cream / dark tip charcoal | Replace navy tooltips | 2026-09-14 |
| Keep `--bo-cyan*` token names | Compatibility; values are amber | 2026-09-14 |
| Admin Detail = reference implementation | Roll out to remaining pages using this file | 2026-09-14 |

## Agent rules

1. Always read `DESIGN.md` and this file before UI work on this repo.
2. Never substitute another palette “for taste.” Never restore Deep Navy Cyan.
3. `frontend-design` may refine typography, hierarchy, and micro-detail — **not** brand hex values.
4. When adding CSS tokens, prefer `--bo-*` names; map accents through amber (`--bo-cyan` = amber).
5. Offer to update this file when a pattern is reused 2+ times with stable measurements.
6. New pages must follow Charcoal + Amber; migrate legacy navy/cyan pages toward these tokens when touched.
