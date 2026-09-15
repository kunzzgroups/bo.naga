# Design System — Backoffice Admin Panel

Locked theme for this product. Do not invent alternate palettes.

## Direction

**Product:** Backoffice Admin Panel (admin / SaaS dashboard)  
**Personality:** Modern ops terminal — precision, density, enterprise trust  
**Theme name:** Charcoal + Amber  
**Foundation:** Soft charcoal structure + amber interaction  
**Depth:** Light = 1px border + soft warm shadow · Dark = borders / soft surface lift (no dead black)  
**Signature:**  
- Light: orange→cream canvas continuum · opaque sidebar `#FFE8CC` · listing surface `#FFF8EB` · **form layer ladder** (`#FFFCF7` → `#F5EBDC` → `#F0E4D0`) · amber active (**locked**)  
- Dark: warm charcoal→cool charcoal continuum · opaque sidebar `#3A3226` · amber neon active  

**Reference implementation:** Admin Detail pages (`data-access-page="main_admin_detail"`); light cream chrome confirmed on Dashboard (`main-dashboard.html`); form hierarchy on Create/Edit Admin.

### Light mode (locked 2026-09-14)

Do not use pure white `#FFFFFF` or ivory `#FFFCF8` for canvas / topbar / panels. Do not flatten Create/Edit forms to one cream.

| Role | Hex |
|------|-----|
| Sidebar | `#FFE8CC` |
| `--bo-bg` | `#FFF1DC` |
| Continuum | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` |
| `--bo-surface` (topbar, listing cards) | `#FFF8EB` |
| Form section lift | `#FFFCF7` |
| Form border | `#DCC9A8` |
| `--bo-border` (listing) | `#EADCC8` |
| Control well | `#F5EBDC` |
| Nested well | `#F0E4D0` |
| Locked / readonly | `#EDE4D4` |
| Accent-on only | `#FFFFFF` |

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
| `--bo-bg` | `#FFF1DC` | `#2C2E38` | Page canvas base (warm cream) |
| `--bo-surface` | `#FFF8EB` | `#383A46` | Cards, panels, topbar (cream — not ivory/white) |
| `--bo-border` | `#EADCC8` | `rgba(255,255,255,.10)` | Separators / inputs |
| `--bo-text` | `#18191C` | `#F5F5F4` | Primary text |
| `--bo-text-secondary` | `#27272A` | `#E7E5E4` | Secondary text |
| `--bo-muted` | `#71717A` | `#A1A1AA` | Meta, time, captions |
| `--bo-control-well` | `#F0EFEA` | `rgba(255,255,255,.06)` | Input wells |
| `--bo-placeholder` | `#78716C` | `#A1A1AA` | Placeholders on cream / charcoal wells |

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
| Light | `#FFE8CC` | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` |
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
| Tip radius | `8px` | `8px` |
| Money positive | `#B45309` | `#F59E0B` |
| Ghost / Export gradient | soft gray | `#4A4C58` → `#383A46` → `#2C2E38` |
| Modal z-index | `30000` (above sidebar / flyout) | same |

### Spacing

Base: `4px`  
Scale: `4, 8, 10, 12, 14, 16, 18, 20, 24, 32`

### Radius

| Use | Value |
|-----|-------|
| Action buttons / theme toggle / filter controls | `8px` (locked Admin chrome) |
| Cards / panels | `16px` |
| Nav items | `10px` |
| Avatar (topbar) | `12px` |
| Pills / switches | `999px` |
| Chart hover tip (`.trend-tip`) | `8px` |

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

- Opaque fill matching continuum left stop (`#FFE8CC` light · `#3A3226` dark)
- L1 text/icons light: `#6b360c` · weight `800`
- L1 active: cream chip + **left amber bar** (not the L2 frame)
- Logout: danger red, not amber — footer must **not** stay white (see Logout below)

#### L1 active — cream chip + left amber pill (locked)

Do **not** use only `box-shadow: inset 3px 0 0 …` on top-level `a.active`. Category pages (Transaction, Admin, Merchant…) mark the open group via `.nav-group.open` / `:has(.report-sub.active)`, not a top-level `.active` link.

**Must match all of these selectors (light + dark):**
- `.report-nav > a:not(.report-sub).active`
- `.nav-group.open > .nav-group-btn`
- `.nav-group:has(.report-sub.active) > .nav-group-btn`
- `.nav-group.bo-flyout-hover:has(.report-sub.active) > .nav-group-btn`

| Spec | Light | Dark |
|------|-------|------|
| Fill | `linear-gradient(135deg, #FFF8EF 0%, #FFE8CC 48%, #FFF3E0 100%)` | `linear-gradient(90deg, rgba(245,158,11,.16) → transparent)` |
| Soft ring / lift | inset top highlight + `0 0 0 1px rgba(217,119,6,.18)` + soft amber shadow | inset amber lines + soft glow |
| Radius | `10px` | `8px` |
| Text / icons | `#6b360c` · opacity `1` | `#FBBF24` · amber drop-shadow on icons |
| Left bar `::before` | `left:0; top/bottom:7px; width:3px; border-radius:999px` · `linear-gradient(180deg,#FBBF24→#D97706)` · soft amber glow | `top/bottom:8px; width:2px` · `#FDE68A→#F59E0B→#D97706` · stronger glow |

#### L1 idle / hover

| State | Light | Dark |
|-------|-------|------|
| Idle | transparent · text/icons `#6b360c` | transparent · text `rgba(255,255,255,.86)` · icons `rgba(255,255,255,.7)` |
| Hover | soft cream wash `rgba(255,243,224,.78)` · text/icons stay `#6b360c` · **no** left bar | **same amber chip as L1 active** (below) · **no** left bar required on hover |

**Dark L1 hover (locked — user reference 2026-09-15)**  
Same signal as dark active, applied on `:hover` / `:focus-visible` / `.bo-flyout-hover > .nav-group-btn`:

| Spec | Value |
|------|-------|
| Fill | `linear-gradient(90deg, rgba(245,158,11,.16) 0%, rgba(245,158,11,.05) 45%, transparent 100%)` |
| Text / icons / chevron | `#FBBF24` · icons `filter: drop-shadow(0 0 8px rgba(245,158,11,.65))` |
| Shadow | inset amber lines + `0 0 28px rgba(245,158,11,.12)` |
| Radius | `8px` |
| Text shadow | `0 0 18px rgba(245,158,11,.45)` |

**Reject:** grey wash `rgba(255,255,255,.04)` + white/near-white label; BO blue `#1d4ed8` on icons (from `reports.css` `.report-nav a:hover i`). Always override `i`, `span i`, and `.bi-chevron-down` on L1 hover.

#### Desktop flyout panel — `.nav-group-list`

`reports.css` sets desktop flyout `background:#fff!important`. Page CSS must beat it with equal-or-higher specificity (include `.report-nav > .nav-group > .nav-group-list`).

| Spec | Light | Dark |
|------|-------|------|
| Panel bg | `#FFF8EB` | `#383A46` |
| Panel border | `1px solid rgba(92,74,48,.12)` | `1px solid rgba(255,255,255,.14)` |
| Panel shadow | warm soft lift | `0 16px 40px rgba(0,0,0,.35)` |

#### L2 item — `.report-sub` / `.nav-group-list a`

| State | Light | Dark |
|-------|-------|------|
| Default | text/icon `#6b360c` · transparent | text `rgba(255,255,255,.62–.72)` · icons `rgba(255,255,255,.55)` |
| Hover | soft wash `rgba(255,243,224,.72)` · **no** amber frame · icons `#6b360c` | soft wash `rgba(255,255,255,.05)` · **no** frame · icons `#FBBF24` + amber glow |
| **Active (locked)** | cream chip + amber frame (below) | amber/charcoal chip + amber frame (below) |

**Icon color is not inherited from the link alone.** `reports.css` sets `.report-nav a:hover i,.report-nav a.active i{color:#1d4ed8}` — higher specificity on the `i` wins unless page CSS targets `a.report-sub:hover i`, `a.report-sub.active i`, `a.report-sub.active:hover i`, and `span i` explicitly.

| Mode | Idle icon | Hover icon | Active / active:hover icon |
|------|-----------|------------|----------------------------|
| Light | `#6b360c` | `#6b360c` | `#6b360c` |
| Dark | `rgba(255,255,255,.55)` | `#FBBF24` + amber drop-shadow | `#FBBF24` + amber drop-shadow |

Never leave hover icons as BO blue `#1d4ed8`, cyan, or (in dark) plain white without amber.

**Active chip (copy exactly — Admin Detail reference)**  
Do **not** use flat `rgba(217,119,6,.12)` wash alone for active (that was the wrong Roles/Dashboard look). Also kill legacy `::after` left rails (`content:none; display:none`).

| Spec | Light | Dark |
|------|-------|------|
| Background | `linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)` | `linear-gradient(180deg, rgba(245,158,11,.18), rgba(43,37,33,.92))` |
| Border | `1px solid #D97706` (`--bo-sidebar-active`) | `1px solid rgba(245,158,11,.55)` |
| Text / icon | `#6b360c` · weight `800` | `#FBBF24` · weight `800` |
| Shadow | `0 0 0 1px rgba(245,158,11,.12), 0 4px 14px rgba(217,119,6,.12)` | amber glow + inset highlight |
| `::after` rail | none (`display:none`) | none |

#### Logout footer — `.bo-sidebar-account-footer` / `.bo-sidebar-logout`

`bo-ui-standard.css` sets `.bo-sidebar-account-footer{background:#fff}` — on cream/charcoal sidebars this reads as a **white strip** at the bottom. Always override on Charcoal + Amber pages:

| Spec | Light | Dark |
|------|-------|------|
| Footer bg | `transparent` (show sidebar cream) | `transparent` |
| Footer border-top | `1px solid rgba(92,74,48,.1)` | `1px solid rgba(255,255,255,.08)` |
| Logout label | `#B42318` | `#FF8A90` |
| Logout icon | `#D92D20` | `#F87171` |
| Logout fill | `rgba(255,255,255,.45)` + soft danger border | transparent |
| Logout hover | `#FEF3F2` wash · `#912018` | danger wash + soft red glow |

Never restyle Logout as amber — danger red is the locked signal.

Shared on: Dashboard, Roles & Permissions, Administrators, Security & Audit, **Merchant family**, **Transaction (wallet) family**.

#### Transaction family (BO listing — not MAIN executive)

Sidebar category **3. Transaction** uses classic listing shells (`reports.css`), not `main-*-executive` pages.

| Item | Value |
|------|-------|
| Scope class | `body.bo-wallet-tx` |
| CSS | `assets/css/bo-wallet-transaction-amber.css` (load after `bo-ui-standard` / `bo-targeted-fixes`) |
| Pages | `member-deposit.html`, `member-withdraw.html`, `member-wallet.html`, `wallet-ledger.html`, `bulk-adjustment.html`, `bank-deposit-usage.html`, `bulk-bonus-adjustment.html` |
| Theme | FOUC (`bo_theme` → `data-bo-theme`) + `#boThemeToggle` + `assets/js/bo-theme.js` |

**Wiring pitfalls (hit during Transaction port):**
1. **Theme toggle vs profile:** `auth.js` does `el.innerHTML = profileHtml()` on `[data-bo-profile]`. Put `#boThemeToggle` as a **sibling** inside `.report-actions`, never as a child of `[data-bo-profile]`.
2. **L1 active selectors:** open Transaction with a child page selected — if only `a.active` is styled, **3. Transaction** stays idle. Include `.nav-group.open` / `:has(.report-sub.active)`.
3. **Logout white strip:** beat `.bo-sidebar-account-footer{background:#fff}` from `bo-ui-standard.css`.
4. **Flyout white panel:** beat `reports.css` flyout `#fff!important` with `.report-nav > .nav-group > .nav-group-list`.
5. **Do not** theme MAIN Merchant/Provider/Report pages under this class — wrong scope.
6. **L2 light icon hover blue:** `reports.css` `.report-nav a:hover i{color:#1d4ed8}` — override L2 `i` / `span i` for idle, `:hover`, `.active`, `.active:hover` to `#6b360c`.
7. **L2 dark icon hover:** must be `#FBBF24` + amber glow (Merchant recipe), **not** white `rgba(255,255,255,.92)` and not BO blue. Same for `.active:hover i`.
8. **L1 dark hover chip:** user locked full amber chip (same as dark active) — text/icons/chevron `#FBBF24`, amber gradient wash. Do **not** use grey wash + white label. Override `i`, `span i`, `.bi-chevron-down` on `:hover` / `.bo-flyout-hover`.
9. **Search stays `#2864ed`:** `bo-ui-standard.css` locks `.bo-filter-search-button` with `body:not(#bo-filter-standard-off):not(#bo-filter-standard-legacy) …` — `:not(#id)` counts as an **ID** in specificity. Beat it with the same `:not(#…)` pair **plus** `body.bo-wallet-tx`, not only `body.bo-wallet-tx .bo-filter-search-button`.
10. **Metric icon rainbow:** `reports.css` paints `.bo-summary-icon` nth-child blue / green / purple. On Transaction pages force amber washes (`rgba(217,119,6,.12)` / `#D97706`) for all summary icons.
11. **Dark white selects:** same `:not(#id)` lock forces `.rounded-select-btn` / filter inputs to `#fff`. Override with matching specificity + dark `#2A2C36` wells. Also redefine `--bo-tx-well` / `--bo-tx-well-border` under `html[data-bo-theme="dark"] body.bo-wallet-tx` — otherwise the shared cream-well rule keeps `#F5EBDC` with light `--bo-text` (unreadable Status / Page Size). Theme `.rounded-select-menu` / `.rounded-select-option` and table `tbody` so empty tables are not a white slab.
12. **Select option indigo:** `bo-ui-standard.css` locks `.report-main .bo-filter-row .rounded-select-option:hover/.active` to `#eef2ff` / `#4f46e5!important`. Beat with `body.bo-wallet-tx` + `.report-main .bo-filter-row` (and optional `:not(#…)` pair). Spec: **Forms → Select / dropdown options**.
13. **Date-range cool blue:** `reports.css` paints `.bo-range-presets` `#f8fafc`, day hover `#eef2ff`, selected `#5061f5`, month/year active blue gradient. Retheme per **Forms → Date-range popover**.
14. **Filter field titles:** Transaction listing filters hide Date Range / Search / Status / Page Size labels (placeholder + value carry meaning). Keep `align-items:center` on the row after labels are removed.
15. **Filter control radius:** Radius table locks filter controls at `8px` — beat `bo-ui-standard` / `reports.css` `10–11px` on `.rounded-select-btn` / `.bo-range-trigger` / filter inputs.

### Topbar (locked chrome — copy exactly)

**Surface**

| Mode | Topbar bg |
|------|-----------|
| Light | solid `#FFF8EB` |
| Dark | solid `#383A46` |

**Layout (right cluster, L→R):** Theme toggle (`.bo-theme-btn`) → 1px divider → User Name / profile (`.bo-account-link`)

Do not invent alternate topbar account pills, bordered username chips, or navy theme icons.

#### Theme toggle — `.bo-theme-btn`

| Spec | Light | Dark |
|------|-------|------|
| Size | `36×36` (`flex: 0 0 36px`) | same |
| Radius | `8px` | same |
| Border | `1px solid rgba(24,25,28,.18)` | `1px solid rgba(245,158,11,.4)` |
| Background | `transparent` | `transparent` |
| Icon color | `#3F3F46` | `#F59E0B` |
| Icon size | `18px` (both sun/moon in same slot; `[hidden]` only fades) | same |
| Hover | bg `rgba(24,25,28,.05)` · border `rgba(24,25,28,.28)` · color `#18191C` | bg `rgba(245,158,11,.10)` · border `#F59E0B` · color `#FBBF24` |
| Focus | `outline: 2px solid #D97706; outline-offset: 2px` | same amber |

Storage / attribute: `localStorage.bo_theme` + `html[data-bo-theme="light|dark"]`.

#### User Name / profile — `.bo-account-link`

**Structure:** text meta (`.bo-account-meta`) left of avatar (`.report-avatar`). No gear icon (`.bo-account-setting-icon` hidden). No bordered pill around the whole control.

| Spec | Light | Dark |
|------|-------|------|
| Wrapper | transparent · no border · no radius · no shadow · gap `12px` | same |
| Name `.bo-account-name` | `14px` / `700` / `#18191C` · max-width `160px` ellipsis | `#FFFFFF` |
| Role `.bo-account-role` | `11px` / `500` / `#71717A` · mono stack | `#F59E0B` |
| Avatar size | `40×40` · radius `12px` | same |
| Avatar fill | `#D97706` · icon `#FFFFFF` | `#F59E0B` · icon `#2A2C36` + amber glow shadow |
| Avatar hover | `#B45309` | `#FBBF24` |
| Divider before profile | `1px × 28px` `rgba(24,25,28,.12)` | `rgba(255,255,255,.12)` |

### Buttons (locked — Admin Detail reference)

**Shared metrics (page actions / chrome / modal footers)**

| Spec | Value |
|------|-------|
| Base height | `36px` (filter Reset / Add Currency / Bulk Delete may be `42px`) |
| Modal action height | `40px` |
| Padding | `0 14px` (modal `0 16px`) |
| Radius | `8px` |
| Font | `12.5–13px` / weight `700` |
| Gap (icon+label) | `6–8px` |
| Motion | hover `translateY(-1px)` · active `translateY(1px)` · ease ~`0.14s` |
| Focus | `outline: 2px solid` amber (`--bo-cyan` / `#D97706`) · offset `2px` |

**Classes:** Primary = `.mad-btn-primary` / `.mad-btn-navy` / `.bo-ui-button-primary` (alias; all amber). Ghost / Export = `.mad-btn-ghost` / `#madExportBtn`. Never restore navy fill as primary.

#### Primary CTA

| State | Light | Dark |
|-------|-------|------|
| Default fill | `linear-gradient(180deg, #FBBF24 0%, #F59E0B 42%, #EA8608 100%)` | `linear-gradient(180deg, #FBBF24 0%, #F59E0B 45%, #D97706 100%)` |
| Border | `#E8901A` | `#F59E0B` |
| Label | `#FFFFFF` | `#2A2C36` |
| Shadow | soft amber lift + inset top highlight | charcoal lift + amber glow + inset |
| Hover fill | `linear-gradient(0deg, #FCD34D → #FBBF24 → #F59E0B → #EA8608)` | `linear-gradient(0deg, #FDE68A → #FBBF24 → #F59E0B)` |
| Hover border | `#F59E0B` | `#FBBF24` |
| Active fill | `linear-gradient(180deg, #F59E0B → #EA8608)` | `linear-gradient(180deg, #F59E0B → #D97706)` |

#### Ghost / Export

| State | Light | Dark |
|-------|-------|------|
| Default fill | `linear-gradient(180deg, #FFF8EB → #F3E8D6)` | `linear-gradient(180deg, #4A4C58 → #383A46 → #2C2E38)` |
| Border | `#EADCC8` | `rgba(255,255,255,.12)` |
| Label | `#18191C` | `#F5F5F4` |
| Hover | reverse gradient · border `#D6D1C7` | reverse gradient · border `rgba(255,255,255,.18)` · label `#FFFFFF` |
| Active | `#F9FAFB → #E5E7EB` | `#383A46 → #2C2E38` |

#### Secondary / default `.mad-btn` (non-primary, non-ghost)

| Spec | Light / Dark |
|------|----------------|
| Fill | `--bo-surface` |
| Border | `--bo-border` |
| Label | `--bo-text-secondary` |
| Hover | amber tint `--bo-cyan-tint` · border `rgba(217,119,6,.45)` · text `--bo-text` |

#### Danger (bulk delete)

| Spec | Light | Dark |
|------|-------|------|
| Fill / border / text | `#FEF3F2` / `rgba(239,51,64,.35)` / `#B42318` | danger wash / `rgba(239,51,64,.4)` / `#FF8A90` |

### Forms

- Inputs: dark soft charcoal `#2A2C36` on dark; light well `#F5EBDC` on light — **never** `#FFFFFF` chrome
- Focus: amber ring (never cyan) — e.g. `0 0 0 3px rgba(217,119,6,.12)`
- **Create/Edit hierarchy:** never one flat cream — use the layer ladder below so Save CTA and sections read clearly

#### Select / dropdown options (`.rounded-select-*` — locked)

Shared recipe for filter selects, pagination “Show / Page Size”, Status, and any enhanced `.rounded-select-wrap` menu.  
**Reference:** Admin Detail filters in `main-admin-detail-executive.css`; Transaction listing copies the same tokens via `bo-wallet-transaction-amber.css`.

**Never** use indigo/lavender defaults (`#eef2ff` / `#4f46e5`), cool gray menu panels (`#f8fafc`), or pure white option slabs.

| Part | Spec |
|------|------|
| Classes | Trigger `.rounded-select-btn` · panel `.rounded-select-menu` · row `.rounded-select-option` (+ `.active` / `.is-active`) |
| Option radius | `8px` |
| Option weight | `700` |
| Menu padding | `6px` |
| Trigger open / focus | border `--bo-cyan` · ring `0 0 0 3px rgba(217,119,6,.14)` |

| Element / state | Light | Dark |
|-----------------|-------|------|
| Trigger (closed) | well `#F5EBDC` (or listing `#FFF8EB`) · border `#EADCC8` · text `--bo-text` | `#2A2C36` · `rgba(255,255,255,.14)` · `#F5F5F4` |
| Menu panel | surface `#FFF8EB` · border `#EADCC8` · warm shadow | `#383A46` · `rgba(255,255,255,.14)` · deep charcoal shadow |
| Option idle | `transparent` · text `--bo-text` (`#18191C`) | `transparent` · text `#F5F5F4` / `--bo-text-secondary` |
| Option hover | wash `--bo-cyan-tint` `rgba(217,119,6,.12)` · text `--bo-cyan-deep` `#B45309` | wash `rgba(245,158,11,.12–.16)` · text `#FBBF24` |
| Option active / selected | same as hover: `--bo-cyan-tint` · `--bo-cyan-deep` | wash `rgba(245,158,11,.18)` · text `#FBBF24` |

**Scope notes**

- Idle options stay **transparent** on the cream/charcoal menu — do not force `#fff` per-row fills.
- Hover and active share the amber tint (Admin Detail); do not invent a second selected color.
- Listing pages that load `bo-ui-standard.css` must beat `.report-main .bo-filter-row .rounded-select-option:hover/.active` indigo locks (see Transaction pitfall 12).

#### Date-range popover (`.bo-range-*` — locked companion)

Same Charcoal + Amber family when a page uses the shared date-range control.

| Element / state | Light | Dark |
|-----------------|-------|------|
| Popover | `#FFF8EB` · border `#EADCC8` | `#383A46` · `rgba(255,255,255,.14)` |
| Preset rail | `#FFF1DC` · border `#EADCC8` | `#2A2C36` |
| Preset hover | `--bo-cyan-tint` · `--bo-cyan-deep` | amber wash · `#FBBF24` |
| Preset / day / month-year active | fill `--bo-cyan` (`#D97706`) · label `#FFFFFF` | fill `#F59E0B` · label `#2A2C36` |
| Day in-range | `rgba(245,158,11,.14)` · text `--bo-cyan-deep` | `rgba(245,158,11,.18)` · `#FBBF24` |

Never `#5061f5` / `#eef2ff` / blue month-year gradients from `reports.css`.

#### Create / Edit Admin Account — light form hierarchy

Reference: Charcoal block + `.mac-*` / `.mae-*` in `main-admin-detail-executive.css` (`main-admin-create.html`, `main-admin-edit.html`).

**Layer ladder (required):**

| Layer | Hex | Notes |
|-------|-----|-------|
| Canvas | continuum `#FFE8CC`→`#FFF8EB` | Atmosphere only |
| Section card | `#FFFCF7` · border `#DCC9A8` · warm shadow · **3px amber left rail** | Primary frame |
| Input well | `#F5EBDC` · border `#DCC9A8` · placeholder `#78716C` | Editable inset |
| Nested well | `#F0E4D0` | Privileges / policy / security |
| Chip / status active | `#FFFCF7` | Lifted controls |
| Locked field | `#EDE4D4` · text `#57534E` | Readonly username |
| Ghost buttons | `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · border `#DCC9A8` | Secondary |
| Primary CTA | amber gradient | Focal action |

| Element | Light | Dark |
|---------|-------|------|
| Section (`.mac-section`) | `#FFFCF7` · border `#DCC9A8` · warm shadow · amber rail | `--bo-surface` |
| Inputs | `#F5EBDC` · border `#DCC9A8` · placeholder `#78716C` | `#2A2C36` |
| Privilege / policy / security nested | `#F0E4D0` | faint wash |
| Locked username | `#EDE4D4` · text `#57534E` | charcoal wash |
| Status seg track | `#EDE4D4` · active pill `#FFFCF7` | charcoal |
| Sticky footer | `#FFFCF7` · border `#DCC9A8` · stronger warm shadow | translucent charcoal |
| Section head | hairline `#EADCC8` + amber icon tile · title `#18191C` | charcoal |
| Help text | `#57534E` | muted |

Do **not** flatten all layers to one cream, or leave cool `#fff` / `#FBFCFE` / `#F1F5F9` wells.

#### Create Role (`main-admin-role-create.html` / `main-merchant-role-create.html`)

Reference: `main-admin-role-create.css` (must beat `reports.css` `.report-content input { background-color:#fff!important }`).

| Element | Light | Dark |
|---------|-------|------|
| Role Name input (`.mrc-field .form-control`) | surface `#FFF8EB` · border `#EADCC8` · amber focus | `#2A2C36` · `rgba(255,255,255,.12)` · amber focus |
| Search (`.mp-search` list) | surface `#FFF8EB` (= Role select) · border `#EADCC8` · icon `#57534E` · placeholder `#78716C` | charcoal well |
| Search (`.mrc-search` Create Role) | surface `#FFF8EB` (= Role Name) · border `#EADCC8` | charcoal well `#2A2C36` |
| Ghost / Select All / Clear / Back | surface `#FFF8EB` · border `#EADCC8` | charcoal well |
| Create Role Back / Cancel (`.mrc-btn-ghost`) | 3D Ghost `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · border `#DCC9A8` · lift shadow | charcoal gradient + lift |
| Create Role Save (`.mrc-btn-primary`) | 3D Primary `#FBBF24`→`#F59E0B`→`#EA8608` · border `#E8901A` · amber shadow | amber gradient · text `#2A2C36` |
| Toggle All (`.mrc-chip-btn.is-accent`) | amber wash `rgba(217,119,6,.12)` · never cool cyan | amber wash `rgba(245,158,11,.16)` |
| Role Information card (`.mrc-card`) | surface `#FFF8EB` | `--bo-surface` |

### Data tables (Admin Management — locked contrast)

Reference: `main-admin-detail.html` / `main-admin-security.html` + Charcoal block in `main-admin-detail-executive.css` (`.mad-panel` / `.mad-table` / `.mad-table-wrap`).

**Rule:** Scope light cream borders under `html:not([data-bo-theme="dark"])` so they never leak into dark. Dark must set full `border` / `border-bottom` (not only `border-*-color`), or cream edges “跑掉.”

| Spec | Light | Dark |
|------|-------|------|
| Panel / wrap bg | `#FFF8EB` | `#383A46` |
| Panel outer border | `#EADCC8` | `1px solid rgba(255,255,255,.14)` |
| Header text (`.mad-table th`) | `#3F3F46` / weight `700` | `#E7E5E4` / weight `700` |
| Header bottom border | `#EADCC8` | `1px solid rgba(255,255,255,.14)` |
| Body cell text (`.mad-table td`) | `#374151` | `#F5F5F4` |
| Row divider | `#F0E6D8` | `1px solid rgba(255,255,255,.12)` |
| Row hover | `#FFF1DC` | `rgba(255,255,255,.05)` |
| Muted / time / email / detail | `#57534E` (never `#9CA3AF` / `#A1A1AA` on cream) | `#D4D4D8` (never `#71717A` / `#A1A1AA` on charcoal) |
| Money zero | `#71717A` | `#A1A1AA` |
| Username emphasis | `#18191C` | `#F5F5F4` |
| Action icons | `#57534E` · hover amber | `#D4D4D8` · hover amber |
| Filter bar / footer edge | cream border | `rgba(255,255,255,.14)` |
| Footer info text | `#57534E` | `#D4D4D8` |
| Search / form placeholder | `#78716C` on cream wells | `#A1A1AA` |
| Modal close (`.modal-clean-close`) | `#F5EBDC` · border `#EADCC8` · icon `#57534E` | charcoal well · light icon |

Do **not** use dark header `#71717A` or row borders `rgba(255,255,255,.06–.08)` — fails contrast on `#383A46`.

### Date / time tips

- Light cream tip or dark charcoal tip per mode above — never navy `#0F1F33`

### Permission matrix (Roles & Permissions — locked)

Reference: `menu-permission.html` + `assets/css/menu-permission-executive.css` (also `main-merchant-roles`, `main-*-role-create`). Classes: `.mp-group` / `.mp-group-head` / `.mp-group-body` / `.mp-menu-card`.

**Principle**

| Mode | Panel surfaces | Amber role |
|------|----------------|------------|
| Light | Cream / amber **wash** on open group + selected cards | Borders, icons, accents, CTA |
| Dark | Cool **charcoal** only — no full-panel amber/brown wash | Borders, icons, counts, checked/current tint only |

Never paint dark matrix groups with cream gradients or muddy amber fills; that reads brown and muddy.

#### Open group — `.mp-group.is-open`

| Spec | Light | Dark |
|------|-------|------|
| Group bg | `#FFFCF7` | `#383A46` |
| Border | `rgba(217,119,6,.45)` + soft amber ring | Default `rgba(255,255,255,.10)` · open `rgba(245,158,11,.28)` |
| Shadow | soft lift | none |
| Head | gradient `#FFF8EB` → `#FFF1DC` · bottom border `rgba(217,119,6,.22)` | `#40424E` · bottom `rgba(245,158,11,.22)` |
| Body | `#FFFCF7` | `#2C2E38` |
| Icon chip | surface + border `rgba(217,119,6,.35)` · icon `#D97706` | `#2A2C36` + border `rgba(245,158,11,.35)` · icon `#F59E0B` |

Collapsed group (dark): same cool `#383A46` surface, white/10 border — not cream.

#### Menu cards — `.mp-menu-card`

| State | Light | Dark |
|-------|-------|------|
| Default | `#FFF8EB` (surface) · border `#EADCC8` / `--bo-border` | `#2A2C36` · `rgba(255,255,255,.10)` |
| Hover | bg `#FFFCF7` · border `rgba(217,119,6,.5)` | bg `#32343E` · border `rgba(245,158,11,.35)` |
| Checked | bg `#FFF8EB` · border `rgba(217,119,6,.4)` | bg `rgba(245,158,11,.10)` · border `rgba(245,158,11,.40)` |
| Current | bg `#FFF1DC` · border `#D97706` + soft ring | bg `rgba(245,158,11,.14)` · border `#F59E0B` |
| Title | `--bo-navy` / charcoal | `#F5F5F4` |
| Meta (checked/current) | `#B45309` | `#A1A1AA` (muted; amber stays on border) |
| Accent checkbox | `accent-color: --bo-cyan` (amber) | same |

#### Related chrome on same pages

- Tabs `.mad-tab.is-active`: amber underline / `#FBBF24` label (dark)
- Add Role: Primary CTA amber 3D gradient (locked Buttons spec)
- Group count pill (dark): `rgba(245,158,11,.16)` / `#FBBF24`
- Filter search `.mp-search` / `#menuPermissionFilter`: **list + Create Role** = surface `#FFF8EB` · border `#EADCC8` · icon `#57534E` · placeholder `#78716C` (Create Role Role Name same). Never muddy well `#F5EBDC` on these fields; dark well `#2A2C36`

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
| Topbar theme btn + User Name + Primary/Ghost buttons locked | Prevent page-to-page drift; specs from Admin Detail CSS | 2026-09-14 |
| Action control radius `8px` (not 10px) | Match shipped Admin chrome | 2026-09-14 |
| Permission matrix: light cream wash / dark cool charcoal | User locked Roles & Permissions open-group look; dark avoids muddy amber panel | 2026-09-14 |
| Create Role Role Name + filter = surface `#FFF8EB` (not well `#F5EBDC`) | User: Create Role inputs still looked muddy vs card | 2026-09-15 |
| Light surfaces = cream `#FFF8EB` locked (no ivory / no pure white) | User confirmed Dashboard light main pane (topbar + canvas + cards) 2026-09-14 | 2026-09-14 |
| Dark table: stronger borders + lighter text | User: dark Admin table borders “跑掉”; headers/cells too close to charcoal bg | 2026-09-14 |
| L2 flyout active = cream chip + amber frame | User: Roles flat wash wrong; Admin Detail bordered chip correct — unify all pages | 2026-09-14 |
| Merchant Detail migrated to Charcoal + Amber (new `assets/css/main-merchant-detail-executive.css`, scoped to `.main-admin-detail-page.main-merchant-detail-page`, loads after the shared file) | Page still ran retired navy; matches Admin Detail reference. Scope by page class, not `data-access-page` — 8 pages share `main_merchant_detail` | 2026-09-15 |
| Merchant family runs the Charcoal block: scope widened to `body.main-admin-detail-page[data-access-page="main_merchant_detail"]`; `main-merchant-create.html` migrated | One block serves the whole family (detail/create/security/profit/profit-record/repayments/settlement); roles pages share the attribute but load a different stylesheet, so they stay untouched | 2026-09-15 |
| Merchant row avatar = neutral tile `#F5EBDC` / `#2A2C36`; every-third-row tint deleted; colour only on suspended rows; initials from the company name | User approved. The tint encoded row position, not data, and the indigo tile repeated the code printed beside it. Admin Detail keeps the old vocabulary | 2026-09-15 |
| Transaction (wallet) family → `body.bo-wallet-tx` + `bo-wallet-transaction-amber.css` | User: sidebar category 3. Transaction only (Deposit/Withdraw/Wallet/Ledger/Bulk…), not MAIN Merchant/Provider. Same Charcoal + Amber chrome as Admin Detail | 2026-09-15 |
| L1 active = cream chip + `::before` amber pill; must cover `.nav-group.open` / `:has(.report-sub.active)` | User reference: Admin-style L1. Styling only `a.active` left Transaction category idle while a child page was open | 2026-09-15 |
| Logout footer bg `transparent` (beat `bo-ui-standard` `#fff`) | User screenshot: white Logout strip on cream sidebar | 2026-09-15 |
| Theme toggle sibling of `[data-bo-profile]`, never inside it | `auth.js` replaces profile host `innerHTML` and would wipe `#boThemeToggle` | 2026-09-15 |
| L2 light hover icons = `#6b360c` (beat `reports.css` `#1d4ed8`) | User: 3.2 New Withdraw icon turned blue on hover | 2026-09-15 |
| L2 dark hover/active icons = `#FBBF24` + amber glow | User: dark L2 hover icon color wrong; white/blue leak vs Merchant amber series | 2026-09-15 |
| L1 dark hover = full amber chip (same as dark active) | User reference screenshot: gold label/icons + amber wash, not grey wash + white | 2026-09-15 |

## Agent rules

1. Always read `DESIGN.md` and this file before UI work on this repo.
2. Never substitute another palette “for taste.” Never restore Deep Navy Cyan.
3. `frontend-design` may refine typography, hierarchy, and micro-detail — **not** brand hex values, topbar chrome, or locked button gradients.
4. When adding CSS tokens, prefer `--bo-*` names; map accents through amber (`--bo-cyan` = amber).
5. Offer to update this file when a pattern is reused 2+ times with stable measurements.
6. New pages must follow Charcoal + Amber; migrate legacy navy/cyan pages when touched.
7. **Unify chrome:** every page’s Theme toggle, User Name block, Primary CTA, and Ghost/Export must match the Topbar + Buttons specs above — do not freestyle.
8. **Dark mode must beat legacy CSS:** `reports.css` still has `.report-body{background:#f5f7fb!important}`. Page CSS must override body/html/canvas with equal-or-higher specificity + `!important`, or white frames will leak around dark cards. Never assume MD tokens alone paint the canvas.
9. **Permission matrix dual wash:** light = cream/amber group wash; dark = cool charcoal surfaces only (amber accents, never muddy amber panel fill). Copy from Patterns → Permission matrix.
10. **No pure white in light chrome:** canvas end, topbar, and panels use cream `#FFF8EB` (continuum → `#FFF6E8` → `#FFF8EB`). Keep `#FFFFFF` only for text-on-amber (`--bo-accent-on`). Do not settle for near-white ivory (`#FFFCF8`) on Dashboard main pane. Also beat sidebar Logout footer `#fff` from `bo-ui-standard.css`.
11. **Dark data tables:** outer/row borders ≥ `rgba(255,255,255,.12–.14)`; header `#E7E5E4`; cells `#F5F5F4`; muted/time `#D4D4D8`. Scope light cream table CSS with `html:not([data-bo-theme="dark"])`. Copy from Patterns → Data tables.
12. **Sidebar L2 active:** cream gradient `#FFFBEB`→`#FEF3C7` + `1px` amber border `#D97706` (dark: amber-tinted chip + `rgba(245,158,11,.55)` border). Never flat amber wash only. Beat `reports.css` flyout `#fff`. Copy from Patterns → Sidebar nav.
13. **Sidebar L1 active:** cream chip + left amber `::before` pill. Always include `.nav-group.open` / `:has(.report-sub.active)` — not only top-level `a.active`.
14. **Transaction listing pages:** use `body.bo-wallet-tx` + `bo-wallet-transaction-amber.css`. Do not hang MAIN Merchant/Provider/Report executive classes on these pages.
15. **Theme toggle placement:** `#boThemeToggle` must be a sibling of `[data-bo-profile]` inside `.report-actions` (auth overwrites profile host HTML).
16. **Beat `reports.css` nav icon blue:** always set L1/L2 `a:hover i` / `a.active i` / `span i` / chevron explicitly. Light L2 = `#6b360c`; dark L1/L2 hover+active = `#FBBF24`.
17. **Dark L1 hover:** full amber chip (gradient + `#FBBF24` label/icons/chevron), same family as dark L1 active — never grey wash + white text.
