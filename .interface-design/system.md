# Design System — Backoffice Executive Panel

Locked theme for this product. Do not invent alternate palettes.

## Direction

**Product:** Backoffice Executive Panel (admin / SaaS dashboard)
**Personality:** Modern, Strong, SaaS — Precision & Density with enterprise trust
**Theme name:** Deep Navy Cyan
**Foundation:** Cool navy + cyan accent
**Depth:** Light = soft card shadow + 1px border · Dark = borders / surface lift only (no heavy shadows)
**Signature:** Light sidebar `#072647` · Dark sidebar `#08131F` (matches canvas) + cyan active nav (`#21A6D7`), Overview head + profit KPI row leading every executive view

## Intent

- **Who:** Brand / ops executives scanning profit and trends, not designers browsing demos
- **Task:** Date-scoped KPIs → drill into Business / Accounting / Report
- **Feel:** Calm control room — dense, trustworthy, high contrast on navy, never playful purple-gradient SaaS defaults

## Rejected defaults

- Purple-on-white / indigo gradients
- Warm cream (`#F4F1EA`) + terracotta editorial look
- Inter / Roboto / Arial as display identity
- Generic `#2864ed` BO blue (legacy `bo-ui-standard`) — superseded by Deep Navy Cyan
- Marketing-card collage layouts in the first viewport

---

## Tokens

### Brand (shared light + dark)

| Token | Hex | Role |
|-------|-----|------|
| `--bo-navy` | `#123B66` | Brand, primary text emphasis |
| `--bo-cyan` | `#21A6D7` | Active nav, links, primary CTA, focus ring |
| `--bo-success` | `#12B76A` | Positive deltas (`+100% vs last period`) |
| `--bo-danger` | `#EF3340` | Errors, logout emphasis, destructive |

### Light mode

| Token | Hex | Role |
|-------|-----|------|
| `--bo-bg` | `#F5F8FB` | Main content background |
| `--bo-surface` | `#FFFFFF` | Cards, panels, topbar surfaces |
| `--bo-border` | `#E2E7F0` | Card / input borders |
| `--bo-text` | `#11203A` | Primary text / KPI values |
| `--bo-text-secondary` | `#1C2942` | Section titles, labels |
| `--bo-muted` | `#657187` | Meta, currency suffix, captions |
| `--bo-sidebar-bg` | `#072647` | Sidebar |
| `--bo-sidebar-text` | `#FFFFFF` | Sidebar labels |
| `--bo-sidebar-active` | `#21A6D7` | Active menu highlight |

### Dark mode

| Token | Hex | Role |
|-------|-----|------|
| `--bo-bg` | `#08131F` | Main content background |
| `--bo-surface` | `#102030` | Cards / elevated panels |
| `--bo-border` | `rgba(255,255,255,0.08)` | Subtle separators |
| `--bo-text` | `#F5F8FB` | Primary text |
| `--bo-text-secondary` | `#D0D7E2` | Titles / secondary |
| `--bo-muted` | `#8A95A8` | Captions / meta |
| `--bo-sidebar-bg` | `#08131F` | Sidebar (matches canvas / dark mock) |
| `--bo-sidebar-text` | `#FFFFFF` | Sidebar labels |
| `--bo-sidebar-active` | `#21A6D7` | Active menu highlight |

### Chart series (Trend Chart)

| Series | Hex | Notes |
|--------|-----|-------|
| Merchant Profit | `#1688F8` | Dashed line |
| Game Profit | `#8248E9` | Solid line |
| Net Profit | `#16B45D` | Solid line + soft area fill |

### Spacing

Base: `4px`  
Scale: `4, 8, 10, 12, 14, 16, 18, 20, 24, 32`  
Page padding (exec): `20px 24px` desktop · tighten on short viewports

### Radius

| Use | Value |
|-----|-------|
| Inputs / date trigger | `10–11px` |
| Cards (KPI / trend) | `16px` |
| Nav active pill | `10–12px` |
| Icon wells | `12px` square (Overview KPI) |

### Typography

- **UI / labels:** system stack OK for density; prefer weight + color for hierarchy over size jumps
- **Page toolbar:** date range left-aligned (no Overview title / subtitle)
- **KPI value:** ~`26px` / `800` / tight tracking / `tabular-nums`
- **KPI label:** ~`11px` / `700` / uppercase / tracked
- **Section title:** ~`16px` / `800`
- **Meta / caption / delta:** `11–12px` / `500–650` / muted
- Ratio: ~`1.25` from 14px body

### Depth

| Mode | Strategy |
|------|----------|
| Light | `1px` border `#E2E7F0` + soft shadow `0 2px 8px rgba(26,45,80,.018)`; hover may lift slightly |
| Dark | Surface `#102030` on bg `#08131F`; prefer border over shadow |

---

## Layout

- **Shell:** Left sidebar + topbar (hamburger, theme, user) + main
- **Overview head:** Date range trigger left-aligned where title used to sit (never inside a KPI card)
- **No Mix bar:** Do not show Merchant/Game share mix under KPIs
- **Sidebar width:** Content-serving rail (~240–280px); mini-rail supported
- **Executive dashboard focal point:** Overview → 3 KPI cards → Profit Trend
- **First viewport:** Brand/sidebar + Overview head + KPIs + chart only — no promo clutter

---

## Patterns

### Sidebar nav

- Background: light `--bo-sidebar-bg` `#072647` · dark `#08131F`
- Item: white/muted text; active = cyan `#21A6D7` fill or highlight
- Logout: bottom of sidebar; danger-leaning (red), not cyan

### Topbar

- Light: surface white / near-bg; Dark: surface `#102030` or transparent over bg
- User chip right-aligned; hamburger left
- Single theme button left of the user chip: sun in light, click to moon (dark), click again to sun
- Date range lives in the Overview head, not here

### KPI / profit card

- Padding: `20px 22px 16px` · radius `16px` · min-height ~`148px`
- Layout: one row `[icon | label+value | sparkline]` · hairline rule · delta footer
- Label stacked above value beside the icon; sparkline right-aligned in the same band
- Series-colored icon wells and delta dots; up/down pct uses success/danger, flat uses secondary text
- Grid: 3 columns desktop → 1 column mobile
- Subtle rise animation on load; hover lifts card

### Trend card

- Same card chrome as KPI
- Header: title + subtitle left; legend right (Merchant dashed / Game + Net solid)
- Hover tooltip: dark navy popover with date, net, merchant/game breakdown, growth %
- Chart height ~`360px` desktop; preserve responsive min-heights from `main-dashboard-executive.css`

### Buttons (align toward BO filters)

- Primary: fill `--bo-cyan` or `--bo-navy` (prefer cyan for interactive CTA, navy for brand chrome)
- Height: `42px` filter actions · radius `11px`
- Secondary: surface + `--bo-border`

### Forms / filters

- Follow `bo-ui-standard.css` geometry; **retoken colors** to Deep Navy Cyan when restyling (replace legacy `--bo-ui-blue: #2864ed`)

---

## Accessibility

- Maintain WCAG AA contrast: cyan on navy for active nav; light text on dark surfaces
- Focus ring: cyan `#21A6D7` (or 2px outline with offset)
- Respect `prefers-reduced-motion`; keep motion to subtle hover/load only

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Deep Navy Cyan locked | User-confirmed brand for light + dark | 2026-09-03 |
| Light sidebar `#072647` · Dark sidebar `#08131F` | Dark rail matches reference mock / canvas | 2026-09-03 |
| Dark cards `#102030` on `#08131F` | Elevation without heavy shadows | 2026-09-03 |
| Cyan `#21A6D7` for active/CTA | Distinct from navy chrome; readable on navy | 2026-09-03 |
| interface-design as primary skill | Dashboard/admin craft + system memory | 2026-09-03 |
| frontend-design as secondary | Anti-slop polish only; must not override tokens | 2026-09-03 |
| Overview mock layout locked | Title+date head, square KPI icons, deltas, no Mix | 2026-09-03 |
| Chart: Merchant dashed · Net solid+fill | Matches Overview reference | 2026-09-03 |
| Brands Business page color-aligned | Same Deep Navy Cyan tokens as Overview; legacy `#2563eb` / purple title icon retired on Brands | 2026-09-03 |
| Brands light/dark via `bo_theme` | Same key + sun/moon toggle as Overview; dark surfaces `#102030` on `#08131F` | 2026-09-03 |

## Agent rules

1. Always read this file before UI work on this repo.
2. Never substitute another palette “for taste.”
3. `frontend-design` may refine typography, hierarchy, and micro-detail — **not** brand hex values.
4. When adding tokens in CSS, prefer names like `--bo-navy`, `--bo-cyan`, `--bo-bg`, `--bo-surface`.
5. Offer to update this file when a pattern is reused 2+ times with stable measurements.
