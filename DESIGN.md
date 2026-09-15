---
name: Backoffice Admin Panel
description: Charcoal + Amber control terminal for brand operators — light cream continuum (locked), dark warm-charcoal continuum, amber accents.
colors:
  primary-light: "#D97706"
  primary-deep-light: "#B45309"
  primary-bright-light: "#F59E0B"
  secondary-light: "#2563EB"
  success-light: "#12B76A"
  danger-light: "#991B1B"
  text-light: "#18191C"
  text-secondary-light: "#27272A"
  muted-light: "#71717A"
  placeholder-light: "#78716C"
  bg-light: "#FFF1DC"
  surface-light: "#FFF8EB"
  border-light: "#EADCC8"
  sidebar-light: "#FFE8CC"
  canvas-left-light: "#FFE8CC"
  canvas-right-light: "#FFF8EB"
  tip-bg-light: "#FFF8EB"
  tip-text-light: "#6b360c"
  money-positive-light: "#B45309"
  primary-dark: "#F59E0B"
  primary-deep-dark: "#D97706"
  success-dark: "#10B981"
  danger-dark: "#F87171"
  text-dark: "#F5F5F4"
  text-secondary-dark: "#E7E5E4"
  muted-dark: "#A1A1AA"
  bg-dark: "#2C2E38"
  surface-dark: "#383A46"
  border-dark: "rgba(255,255,255,0.10)"
  sidebar-dark: "#3A3226"
  canvas-left-dark: "#3A3226"
  canvas-right-dark: "#2C2E38"
  tip-bg-dark: "#40424E"
  money-positive-dark: "#F59E0B"
  accent-on-dark: "#2A2C36"
typography:
  ui:
    fontFamily: "ui-sans-serif, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  sidebar-l1:
    fontWeight: 800
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  control: "8px"
  card: "16px"
  pill: "999px"
  nav: "10px"
  avatar-topbar: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# Design System — Charcoal + Amber

**Source of truth for all BO UI going forward.** Reference implementation: Admin Detail (`data-access-page="main_admin_detail"`).

Former **Deep Navy Cyan** (`#123B66` / `#21A6D7` / `#072647` / `#08131F`) is **retired**. Do not reintroduce navy/cyan as brand identity.

## Overview

Backoffice is a desktop-first ops panel. Visual world: **Charcoal structure + Amber interaction**.

- Light: orange→cream canvas continuum; warm cream sidebar; listing panels `#FFF8EB`. **Form pages use a layer ladder** (lift `#FFFCF7` → well `#F5EBDC` → nested `#F0E4D0`) — never one flat cream. **Locked 2026-09-14.**
- Dark: warm charcoal→cool charcoal continuum; soft surfaces (not dead black); amber neon accents.

### Light mode surfaces (locked — copy exactly)

User-confirmed on Dashboard main pane (topbar + canvas + cards). Do not regress to `#FFFFFF` or near-white ivory `#FFFCF8`.

| Role | Hex | Notes |
|------|-----|-------|
| Sidebar (opaque) | `#FFE8CC` | Warmest peach; covers content when expanded |
| Canvas / `--bo-bg` | `#FFF1DC` | Cream under panels |
| Continuum L→R | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` | Canvas only; `background-attachment: fixed` |
| Surface / topbar / listing cards | `#FFF8EB` | Same cream as tip bg |
| Form section lift (Create/Edit) | `#FFFCF7` | Brighter than canvas; never flatten to one cream |
| Form border (Create/Edit) | `#DCC9A8` | Stronger than listing `#EADCC8` |
| Border (listing / default) | `#EADCC8` | Warm separator |
| Control well (inputs / currency) | `#F5EBDC` | Deeper cream inset |
| Nested well (privileges / security) | `#F0E4D0` | One step deeper than control well |
| Locked / readonly well | `#EDE4D4` | Non-editable fields |
| Accent-on (text on amber fill) | `#FFFFFF` | Only place pure white is allowed |

Reference CSS: `main-dashboard-executive.css` light tokens.

Theme toggle: `data-bo-theme` / `localStorage.bo_theme`. Prefer `--bo-*` tokens over hard-coded hex in new work.

> Token names `--bo-navy` / `--bo-cyan` remain in CSS for compatibility but now map to **neutral text / amber accent**, not navy/cyan hues.

## Colors

### Brand roles

| Role | Light | Dark |
|------|-------|------|
| Primary (CTA, active, focus) | `#D97706` | `#F59E0B` |
| Primary deep (hover / money+) | `#B45309` | `#D97706` |
| Bright amber (highlights) | `#F59E0B` | `#FBBF24` |
| Secondary (info / rare) | `#2563EB` | `#D97706` |
| Success | `#12B76A` | `#10B981` |
| Danger | `#991B1B` | `#F87171` |
| Accent-on (text on primary fill) | `#FFFFFF` | `#2A2C36` |

### Surfaces & text

| Role | Light | Dark |
|------|-------|------|
| Canvas / `--bo-bg` | `#FFF1DC` (warm cream under panels) | `#2C2E38` |
| Surface / cards / topbar | `#FFF8EB` cream (no ivory / no `#FFFFFF`) | `#383A46` |
| Border | `#EADCC8` | `rgba(255,255,255,.10)` |
| Text | `#18191C` | `#F5F5F4` |
| Text secondary | `#27272A` | `#E7E5E4` |
| Muted / time | `#71717A` | `#A1A1AA` |
| Control well | `#F5EBDC` | `rgba(255,255,255,.06)` |
| Placeholder | `#78716C` (on cream wells) | `#A1A1AA` |

### Sidebar & canvas continuum

**Rule:** Only the **canvas** does sidebar→page transition. Sidebar itself is **opaque** (covers content when expanded). Panels/tables stay solid surface.

| Mode | Sidebar fill | Continuum (L→R, ~96px past sidebar) |
|------|--------------|-------------------------------------|
| Light | `#FFE8CC` | `#FFE8CC` → `#FFF1DC` → `#FFF3E0` → `#FFF6E8` → `#FFF8EB` |
| Dark | `#3A3226` | `#3A3226` → `#342E28` → `#2F2E32` → `#2D2E36` → `#2C2E38` |

Sidebar edge rail: 2px amber gradient (`#F59E0B` → `#D97706`).  
Nav L1 weight: `font-weight: 800`. Light nav text/icons: `#6b360c`.

**Desktop flyout (`.nav-group-list`)** — light `#FFF8EB` (never `#fff`; beat `reports.css`). Dark `#383A46` + `rgba(255,255,255,.14)` border.

**L2 active (`.report-sub.active`) — locked**  
Cream chip `#FFFBEB`→`#FEF3C7` + amber frame `#D97706` + soft amber shadow. Dark: amber/charcoal chip + `rgba(245,158,11,.55)` border · text `#FBBF24`.  
Hover = soft wash only (no frame). Do not use flat active wash. Full tables: `.interface-design/system.md` → Patterns → Sidebar nav.

### CSS token map (compatibility)

| Token | Light | Dark |
|-------|-------|------|
| `--bo-navy` | `#18191C` | `#F5F5F4` |
| `--bo-cyan` | `#D97706` | `#F59E0B` |
| `--bo-cyan-deep` | `#B45309` | `#D97706` |
| `--bo-ui-blue` | `#D97706` | `#F59E0B` |
| `--bo-sidebar-active` | `#D97706` | `#F59E0B` |
| `--bo-sidebar-active-bg` | `#FFE8CC` | `rgba(245,158,11,.14)` |
| `--bo-cyan-tint` | `rgba(217,119,6,.12)` | `rgba(245,158,11,.16)` |

### Components (color + locked chrome)

Every row is **Light | Dark**. Full measurements + hover/active live in `.interface-design/system.md` → Patterns (Coverage checklist).

| Element | Light | Dark |
|---------|-------|------|
| Primary CTA | amber gradient `#FBBF24`→`#F59E0B`→`#EA8608`, text white, border `#E8901A` | `#FBBF24`→`#F59E0B`→`#D97706`, text `#2A2C36`, border `#F59E0B` |
| Primary hover | reverse lift `#FCD34D`→`#FBBF24`→`#F59E0B`→`#EA8608` | reverse `#FDE68A`→`#FBBF24`→`#F59E0B` |
| Ghost / Export | `#FFFCF7`→`#F5EBDC`→`#EDE4D4`, border `#DCC9A8`, text `#18191C` (form) · listing `#FFF8EB`→`#F3E8D6` | `#4A4C58`→`#383A46`→`#2C2E38`, text `#F5F5F4` |
| Ghost hover (Create Role Back/Cancel) | reverse cream · border `#E0D0B8` · lift (no amber fill) | reverse charcoal · lift |
| Hover tip | `#FFF8EB` + amber border, text `#6b360c`, radius `8px` (icon tips may be pill) | `#40424E` + amber border, text `#F5F5F4` |
| Money positive / zero | `#B45309` / `#71717A` | `#F59E0B` / `#A1A1AA` |
| Modal panel / close / scrim | cream panel · close well `#F5EBDC` · scrim `rgba(15,23,42,.55)` | `#383A46` · charcoal close · same scrim |
| Tabs active | text `#18191C` · underline `#D97706` | text `#F4F4F5` · underline `#F59E0B` |
| Filter bar / search | surface · `#EADCC8` · icon `#57534E` | charcoal · white/14 · muted icon |
| Status pills (Active/Suspend) | cream 3D thumb · green/red dots | charcoal 3D · neon dots |
| Permission group (open) | cream `#FFFCF7` · head `#FFF8EB`→`#FFF1DC` · amber border | cool `#383A46` · open head `#40424E` · body `#2C2E38` · amber border only |
| Permission card | surface `#FFF8EB` · hover `#FFFCF7` · checked `#FFF8EB` · current `#FFF1DC` | `#2A2C36` · hover `#32343E` · checked/current amber tint only |
| Roles sticky footer Save/Cancel | Primary + Ghost 3D · h `38px` | amber Primary (dark text) + charcoal Ghost |
| Data table panel border | `#EADCC8` | `rgba(255,255,255,.14)` |
| Data table header text | `#3F3F46` / `700` | `#E7E5E4` / `700` |
| Data table cell / muted | `#374151` · muted/time `#57534E` | `#F5F5F4` · muted/time `#D4D4D8` |
| Data table row divider | `#F0E6D8` | `rgba(255,255,255,.12)` |
| Table footer bar | surface · cream top border · info `#57534E` | charcoal · white/14 edge · info `#D4D4D8` |
| Table pager inactive | `#F3F4F6` / `#9CA3AF` | `#383A46` / `#A1A1AA` + white/12 border |
| Table pager active | amber 3D gradient · white label · soft lift | amber 3D · text `#2A2C36` · amber glow |
| Action icons | `#57534E` · hover amber | `#D4D4D8` · hover amber |
| Modal close | well `#F5EBDC` · border `#EADCC8` · icon `#57534E` | charcoal well · light icon |
| Sidebar flyout panel | `#FFF8EB` · warm border | `#383A46` · `rgba(255,255,255,.14)` |
| Sidebar L1 active | cream gradient + left amber bar | amber glow chip + left amber bar |
| Sidebar L2 active | `#FFFBEB`→`#FEF3C7` + border `#D97706` | amber/charcoal chip + border `rgba(245,158,11,.55)` · text `#FBBF24` |
| Create / Edit section card | lift `#FFFCF7` · border `#DCC9A8` · warm shadow · **3px amber left rail** | `--bo-surface` |
| Create / Edit inputs | `#F5EBDC` · border `#DCC9A8` · placeholder `#78716C` | `#2A2C36` · `rgba(255,255,255,.12)` |
| Create / Edit nested well | `#F0E4D0` (privileges / policy / security) | faint wash |
| Create / Edit locked field | `#EDE4D4` · text `#57534E` | charcoal wash |
| Create / Edit status seg | track `#EDE4D4` · active `#FFFCF7` | charcoal |
| Create / Edit sticky footer | `#FFFCF7` · border `#DCC9A8` · stronger warm shadow | translucent charcoal |
| Roles / Create Role text inputs + Role select | surface `#FFF8EB` · border `#EADCC8` · placeholder `#78716C` (not muddy well `#F5EBDC`) | `#2A2C36` |
| Create Role chips (Select All / Clear) | surface `#FFF8EB` · border `#EADCC8` · Toggle All amber wash | charcoal · amber wash |
| Create Role Ghost (Back / Cancel) | 3D `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · hover reverse cream (no amber fill) | charcoal 3D gradient |

### Topbar chrome (locked — all pages)

Order: **Theme toggle** → divider → **User Name + avatar**.

**Theme toggle (`.bo-theme-btn`)**  
`36×36`, radius `8px`, transparent fill. Light: border `rgba(24,25,28,.18)`, icon `#3F3F46`. Dark: border `rgba(245,158,11,.4)`, icon `#F59E0B`. Hover dark → `#FBBF24`. Focus outline `#D97706`.

**User Name (`.bo-account-link`)**  
No bordered pill / no gear. Name `14px/700` (`#18191C` light · `#FFFFFF` dark). Role `11px` mono (`#71717A` light · `#F59E0B` dark). Avatar `40×40` radius `12px`: light `#D97706` / white icon; dark `#F59E0B` / `#2A2C36` icon + amber glow. Hover avatar: `#B45309` / `#FBBF24`.

### Buttons (locked metrics)

| Spec | Value |
|------|-------|
| Radius | `8px` |
| Height | `36px` default · `40px` modal · `42px` filter Reset/Add |
| Weight | `700` |
| Classes | Primary: `.mad-btn-primary` / `.mad-btn-navy` / `.bo-ui-button-primary` (all amber). Ghost: `.mad-btn-ghost` / Export |
| Motion | hover `-1px` · active `+1px` |
| Focus | amber 2px outline |

Do not freestyle topbar account chips or primary fills (no navy/cyan primary). Full tables live in `.interface-design/system.md` → Patterns.

### Permission matrix (Roles & Permissions)

Light: open groups use cream/amber wash; cards `#FFF8EB` → deeper cream on hover/checked/current.  
Dark: cool charcoal only (`#383A46` / `#40424E` / `#2C2E38` / `#2A2C36`) — **no** full-panel amber wash; amber only on borders, icons, counts, checked/current tint.  
Reference CSS: `menu-permission-executive.css`. Full tables in `.interface-design/system.md` → Patterns → Permission matrix.

### Data tables (Admin — locked dark contrast)

Dark panel border `rgba(255,255,255,.14)`; row line `.12`; header `#E7E5E4`; cell `#F5F5F4`; muted/time `#D4D4D8`.  
Never leave light cream borders unscoped, or use dark header `#71717A` / ultra-faint `.06` dividers.  
**Light muted on cream:** use `#57534E` (not `#9CA3AF` / `#A1A1AA` — too faint). Placeholders `#78716C`. Modal close cream well.  
**Footer pager:** light inactive slate `#F3F4F6`/`#9CA3AF`; dark inactive charcoal; **active** = amber 3D in both modes (dark label `#2A2C36`). Full table: `.interface-design/system.md` → Patterns → Data tables / Table footer pager.

### Create / Edit Admin — form hierarchy (locked)

Do **not** paint every surface the same cream. Use a **layer ladder** so the eye finds sections and the Save CTA:

| Layer | Light | Role |
|-------|-------|------|
| Canvas continuum | `#FFE8CC`→`#FFF8EB` | Atmosphere only |
| Section card (`.mac-section`) | lift `#FFFCF7` · border `#DCC9A8` · warm shadow · **3px amber left rail** | Primary content frame |
| Control well (inputs) | `#F5EBDC` · border `#DCC9A8` | Editable fields inset into card |
| Nested well (privileges / policy / security) | `#F0E4D0` | Subordinate grouping |
| Chip / tag / status active | `#FFFCF7` | Lifted controls |
| Locked / readonly | `#EDE4D4` · text `#57534E` | Non-editable |
| Ghost buttons | cream Export gradient `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · border `#DCC9A8` | Secondary actions |
| Primary CTA | amber gradient | **Focal action** (Save / Create) |

Section head: bottom hairline `#EADCC8` + amber icon tile. Help `#57534E` · placeholder `#78716C`.  
Pages: `main-admin-create.html`, `main-admin-edit.html` (+ shared `.mac-*` CSS).  
Never cool `#fff` / `#FBFCFE` / `#F1F5F9` chrome. Full table: `.interface-design/system.md` → Patterns → Forms.

### Create Role (Role Name input — locked)

Light: Role Name + `.mp-search` / `#mrcFilter` + chips = surface `#FFF8EB` · border `#EADCC8` (not muddy well `#F5EBDC`). **Toggle All** = amber wash `rgba(217,119,6,.12)`.  
**Buttons (立体):** Back / Cancel = Ghost cream gradient `#FFFCF7`→`#F5EBDC`→`#EDE4D4` + lift shadow; **shared hover** = reverse cream `#FFF8EB`→`#F3E8D6` · border `#E0D0B8` · lift (no amber fill wash). Save Role = Primary amber 3D. Hover lift / active press.  
Dark: Ghost charcoal gradient; Primary amber with dark text `#2A2C36`. CSS: `main-admin-role-create.css`.

### Roles & Permissions filter (`.mp-search` / `#menuPermissionFilter` — locked)

**List page** (`menu-permission.html`): filter matches Role select — surface `#FFF8EB` · border `#EADCC8` · icon `#57534E` · placeholder `#78716C` (frame + input, incl. disabled). Height `42px` · input text `13.5px/500`.  
**Create Role** (`main-admin-role-create.html`): Role Name + filter both surface `#FFF8EB` (same family as list controls). Role Name `14px/600` · label `11.5px/800` uppercase.  
Always beat `reports.css` `#fff!important`. Dark: charcoal well `#2A2C36`. CSS: `menu-permission-executive.css` + `main-admin-role-create.css`.

### Role select dropdown (`.rounded-select-*` — locked)

Native `<select>` is hidden; `reports.js` builds `.rounded-select-wrap` / `-btn` / `-menu` / `-option`. Spec from Roles page CSS:

| Part | Light | Dark |
|------|-------|------|
| Trigger `.rounded-select-btn` | bg `#FFF8EB` · border `#EADCC8` · `40px` · `13.5px/600` · radius `8px` | bg `#2A2C36` · `--bo-border` |
| Open / focus | border `#D97706` · ring `0 0 0 3px rgba(217,119,6,.14)` | border amber · ring `rgba(245,158,11,.18)` |
| Menu panel | surface `#FFF8EB` · border `--bo-border` · radius `8px` · soft shadow · pad `6px` | surface `#383A46` · deep shadow |
| Option default | transparent · text `--bo-text` · weight `700` · radius `8px` | text secondary |
| Option hover | wash `--bo-cyan-tint` · text `--bo-cyan-deep` | `rgba(245,158,11,.14)` · text primary |
| Option active / selected | same as hover (light) | fill `#F59E0B` · text `#2A2C36` |
| Scrollbar (WebKit) | thumb `#98A2B3` → hover `#667085` · `4px` pill · **no** arrow buttons | thumb `#F59E0B` → `#D97706` |
| Label `.mp-role-label` | `11px/800` · tracking `.08em` · uppercase · `--bo-navy` | same weight · light text |

Do not paint options with cool blue/cyan. Attention shake (`.is-attention`) is motion-only when validation fails.

### Roles typography (quick scale)

| Element | Size / weight |
|---------|----------------|
| Create Role page title | `28px/800` · tracking `-0.03em` |
| Page subtitle / help | `13.5px/500` muted · help `12.5px` |
| Card title (`.mrc-card-head h3`) | `16px/800` |
| Field label (Role Name / ROLE…) | `11–11.5px/800` uppercase |
| Filter / Role select text | `13.5px` |
| Toolbar chips / Ghost / Primary | `12.5–13px/700–800` |
| Sticky footer status pill | `10.5px/800` uppercase |

### Merchant Detail — migrated 2026-09-15

The whole merchant family now runs Charcoal + Amber: `main-merchant-detail.html`, `-create`, `-settlement`, `-security`, `-profit`, `-profit-record`, `-repayments` (all `data-access-page="main_merchant_detail"`).
Page CSS: `assets/css/main-merchant-detail-executive.css` — **must load after `main-admin-detail-executive.css`**, because the legacy Deep Navy Cyan block in that file also matches this page and these rules win on equal specificity by source order.

Recipe used (reuse it for the remaining `main-merchant-*` pages):

- Scope: `body.main-admin-detail-page[data-access-page="main_merchant_detail"]` — mirrors how the Admin block scopes itself. It reaches the whole merchant family (detail, create, security, profit, profit-record, repayments, settlement) while leaving `main-merchant-roles.html` / `main-merchant-role-create.html` alone: they share the data attribute but load the Roles & Permissions stylesheets, not this file. Specificity is unchanged from the page-class form.
- The rescoped Charcoal block covers shared chrome (canvas, sidebar, topbar, tabs, filters, table, footer, pager, buttons, modals, tips). Admin create/edit-only rules are dropped; they cannot match this page.
- Components with no Admin Detail counterpart were hand-written: `.mad-status-chip` / `.mad-status-dot` (given the `.mad-status` pill treatment so both lists read alike), `.mad-merchant-icon-btn` + its tooltip, and the `.mac-currency-*` / `.mac-provider-*` chrome.
- The edit workspace (`#madEditWorkspace`) and the modals need their own block: their legacy rules are **ID-scoped**, so the class-scoped block cannot reach them, and the prefix carries `body.standardized-listing-page` to outbid the `button.mac-currency-add-btn` variants.
- `main-merchant-create.html` renders the same form vocabulary but **outside** `#madEditWorkspace`, so the ID-scoped block misses it entirely — that is why a separate `.mac-section`-scoped layer exists. It also needs the create/edit **layer ladder**, which the initial rescope dropped (those rules are scoped to `.main-admin-create-page` and could not match Merchant Detail). `main-merchant-repayments.html` carries the same class and shares it.
- **Expect a specificity fight.** The legacy file pins several merchant controls with long selectors — `... .report-content .mac-field .mac-input-group.is-prefix > input:not([type="checkbox"]):not([type="radio"]):not([type="file"])` is ten class-levels. Plain `.mac-section .form-control` loses to it. Where a control is a unique ID, two IDs in the selector settle it outright (see the `#madProviderMarkup` / `#madCurrencyModalCode` rules). Do not "simplify" those selectors without re-measuring.
- **Date-range selection UX (`main-merchant-report.js` + this family's stylesheet).** A range must read as ONE strip: without `gap:0` on `.ref-cal-days` a range is a row of unrelated chips. Edges are solid amber with only the outer corners rounded, so the band flows out of them; the middle is a flat wash. After the first click the anchor is marked immediately and hovering previews the whole span (`is-start` / `is-end` / `is-preview`).
  Two traps found while building it:
  - An earlier block in this file sets `background:transparent!important` on every day cell at (0,4,3). It silently killed the amber fill of the selected edges. Restating a fill needs a prefix at (0,6,3) or higher — see the stacked body classes in the "make the range read as ONE strip" block.
  - `renderCalendar()` replaces the day grid's innerHTML, so a click on a day reaches `document` with a **detached** target. The outside-click handler then read that as a click outside the picker and closed it — the second click of a range was impossible. Calendar clicks now call `stopPropagation()`.
- The shared **date-range picker** is already styled for amber in `main-dashboard-executive.css` (19 rules). Rescope them instead of re-deriving: `.main-dashboard-page` → the merchant family and `.main-exec-date-field` → `.ref-date-field` (both pages carry the latter), so one set serves the Dashboard and the merchant reports. Base (unselected) calendar cells come from `reports.css` as `#F7F9FC` / white and need their own rules — the Dashboard only restyled the selected states.
- **There are THREE picker implementations, not one.** `main-merchant-report.js` (`data-report-day` — settlement/balance/transactions/main_merchant_report), `main-merchant-security.js` (`data-mas-day`) and `main-merchant-profit.js` (`data-mpr-day`) each carry their own `renderCalendar`, hover wiring and click branches. The strip/after-first-click UX landed in the report picker first; the other two were ported on 2026-09-15 so all three now emit the same class contract (`in-range` / `selected` / `is-start` / `is-end` / `is-preview`). Keep that contract identical — one stylesheet styles all three, and a picker that emits only `in-range selected` renders as two rounded pills with a flat connector instead of one strip.
- **Editing a shared `.js`/`.css` without bumping its `?v=` makes the fix look broken.** The browser keys the HTTP cache on the full URL, so a page (or preview harness) pinning the old version keeps executing the previous file — a verification run then reports "no requests / no change" while the server is serving the new code. Bump `?v=` in every referencing page in the same pass; the merchant stylesheet references were unified to `1.4.2` across 14 pages for this reason.
- `main-merchant-balance.html`, `main-merchant-transactions.html` and `main_merchant_report.html` are **migrated as of 2026-09-15** through the Report family block below, not through this file — they load `main-merchant-report-executive.css` for their `.mmr-*` / `.settlement-*` deltas, and their picker shares the report family's scope.
- Page-scoped legacy files (`main-merchant-profit.css`, `main-merchant-profit-record.css`, `main-merchant-repayments.css`) carry their own navy token blocks (`--mpr-*`, `--mprr-*`, `--mprd-*`, `#FFFFFF` surfaces, `#F5F8FB` canvases). Those pages are in the family by `data-access-page`, so the shared block covers their shell and the token layer flips most of their content; only hard-coded leftovers inside the page-scoped classes needed extra rules.
- Beware a mechanical rescope: swapping only `.main-dashboard-page` in a selector like `body.main-dashboard-page …` leaves a stray `body` and produces the invalid `bodybody…`, which silently makes every rule in that group inert. Grep for `bodybody` after any scripted rescope.
- `main-merchant-settlement.html` is in the family by `data-access-page` even though its sidebar key is a report key, so it inherits the whole block by linking the file. Its `.mre-*` report chrome lives in `main-merchant-report-executive.css`.
- The modal scrims (`.modal-clean.mad-modal`, `.sidebar-overlay`) keep a dark translucent `rgba(15,23,42,.55)` in both themes. That is a backdrop, not chrome, and reads as neutral — leave it.

**Row avatar (2026-09-15 — merchant AND admin, unified).** The tile is a neutral index marker, not a colour-coded one: light `#F5EBDC` / `#6b360c`, dark `#2A2C36` / `#E7E5E4`. The every-third-row tint is **deleted** — it encoded row position, not data, and a colour that means nothing teaches the eye to ignore the ones that do (the Status pill, the money columns). Colour survives on exactly one avatar variant: a **suspended** row (`#FEE2E2` / `#B91C1C` light, `rgba(239,68,68,.14)` / `#FCA5A5` dark), which agrees with the Status pill instead of contradicting it. Initials come from the company **name** (`avatarInitials()` in `main-merchant-detail.js`), not the code — the code is already printed beside the tile, so repeating it made a 40×40 saturated block carry no information.
**Unified across both families.** The same treatment is applied to the Admin list (`main-admin-detail.html`) in `main-admin-detail-executive.css`, where one thing differs: `.is-self` is **kept amber** because on that page it means "this is your own account" — that is real information, so the neutral rule is written `:not(.is-self)` and the amber tile survives. Its previous every-third-row sky tint is deleted there too, which also removes the light-only-rule leak into dark mode recorded above.

A different component, and already consistent: **`.mas-avatar`** on the Security & Audit pages reads `--bo-cyan-tint` / `--bo-cyan-deep` in light and `rgba(245,158,11,.16)` / `#FBBF24` in dark, so it sits on the amber palette. The `.is-alt` class its JS still applies on every other row is **already neutralised** — a later override block gives `.mas-avatar` and `.mas-avatar.is-alt` the same wash, so it does not encode row position. Its shape is `12px`, not the legacy `50%` circle; a later block sets the radius. The only difference left from the list tile is that it carries a wash at all, which is one quiet tint rather than an encoding, so it is defensible as-is. Decide separately if it should go fully neutral.

### Report family — migrated 2026-09-15

The five Report pages now run Charcoal + Amber: `main-win-lose-report.html`, `main_provider_report.html`, `main_merchant_report.html`, `main-merchant-balance.html`, `main-merchant-transactions.html`.

Page CSS, both loaded **last** (after `bo-account-chip.css`):

| File | Covers |
|------|--------|
| `assets/css/main-report-charcoal.css` | Tokens, canvas continuum, sidebar/topbar, tabs, filter bar, scope bar, currency segment, table, footer, pager, buttons, modals, tips, date-range picker, and the `.mre-*` shell |
| `assets/css/main-report-charcoal-content.css` | In-panel content: `.mmr-*` merchant cell, `.wl-*` win-lose rows, `.settlement-*` ledger + form, KPI strips, panel wrappers, the two provider-report modals |

- **Scope: one `:is()` list, not five selector copies.** `body.main-admin-detail-page:is([data-access-page="main_report"], …)` — the five `data-access-page` values. It carries one class-level more than either legacy scope (`body.main-report-exec-page`, `body.main-admin-detail-page`), so it wins on specificity; load order is belt and braces. The shell file was produced by **mechanically rescoping `main-merchant-detail-executive.css`** (`[data-access-page="main_merchant_detail"]` → that `:is()` list), which is why it is a 4 973-line file whose foreign-page sections are inert but present: a rescope that can be diffed 1:1 against its source is worth more than a pruned one.
- **Neither legacy shell file is edited.** `main-provider-report-executive.css` and `main-merchant-report-executive.css` are also loaded by `main-merchant-settlement.html` and `main-provider-credentials.html`, which carry `main-merchant-report-page`; retinting either in place would repaint pages outside this migration.
- **Three defects of long standing, fixed by the retint** (all five pages): `.mre-table tfoot` was pinned `display:none!important`, so the total row both loaders un-hide never rendered; every `.mad-page-size-select` inside a `.mad-footer` was hidden, so "Show N / page" had an invisible control the JS still bound; and `.value-positive` / `.value-negative` sit on the `<td>`, so the rescoped `.mad-table td{color:…!important}` out-ranked them and the pos/neg money columns rendered as plain text in **both** themes.
- **Dark mode needs `!important` parity, not just specificity.** `main-provider-report-executive.css` pins the date trigger's hover/focus ring to a literal `rgba(33,166,215,.18)` shadow at (0,4,2) `!important`; the cyan survives a token remap because it is not a `var()`. The counterpart in this family's file matches at (0,6,2) `!important`. Same shape for the calendar's `.in-range` / `:hover` washes and the preset rail. `bo-ui-standard.css` carries the same literal for `.ref-range-trigger:hover/:focus` at (0,1,1) `!important`.
- **`.value-positive` / `.value-negative` stay green/red.** That pair is this family's own semantic convention (the provider/brand tables' GGR and margin columns), and the token layer repaints it to the locked `--bo-success` / `--bo-danger`. The amber "money positive" row in the components table governs `.mad-money` and the Win/Lose column (`.mmr-wl.is-pos`), which is where a win/lose figure is read as money rather than as a signed result.
- **The Win/Lose picker differs by design.** `main-win-lose-report.html` runs the shared `main-exec-date-range.js`, which emits only `in-range` / `selected` (no `is-start` / `is-end` / `is-preview`), so it gets the flat amber band with rounded selected edges — not the one-strip treatment. That module is shared with four pages outside this family, so porting the class contract belongs to its own decision.
- **Known leftovers, deliberately not touched.** `main-win-lose-report.html` still links `main-merchant-report-executive.css`, whose scope (`body.main-merchant-report-page`) can never match it — a dead `<link>`, left in place rather than silently deleted. The provider report's settlement / brand / history panels have **no `[data-report-tab]` element in the markup**, so `setupTabs()` never runs and those three panels are unreachable through the UI (pre-existing; the panels and their CSS are correct, they simply have no switcher). The pill thumb ships `border-radius:999px` — inherited from the migrated merchant family, and it disagrees with the `8px` recorded in the components table; the family's value was kept for consistency between the two.


Traps found while migrating:

- `reports.css` `.report-content input{background-color:#fff!important}` paints any workspace field the page CSS does not explicitly cover pure white. Light chrome is cream only — cover inputs with the control well `#F5EBDC`, locked `#EDE4D4`.
- The shared light rule `.mad-table tbody tr:nth-child(3n) .mad-avatar` is *not* light-scoped, so it outbids the charcoal dark `.mad-avatar` rule and drops a near-white `#E0F2FE` chip onto the dark canvas on every third row. **Admin Detail still has this defect.**
- Topbar counters (`.bo-header-counter`, `reports-dashboard-original.css`) are hard-coded `#fff` and stay white in dark. They only render for non-`MAIN` roles, so they are invisible on a Main Account login.

## Typography

System UI stack. Hierarchy via weight + color. Sidebar L1 = `800`. Tabular nums for money/time; mono for credit/time cells and topbar role.

### Provider family — migrated 2026-09-15

`main-provider-detail.html`, `main-provider-credentials.html`, `main-provider-health.html` now run Charcoal + Amber.

- Files: `assets/css/main-provider-family-executive.css` (shared shell — the Admin Detail block rescued and rescoped) plus one page file each: `main-provider-{detail,credentials,health}-executive.css`.
- **Scope is a marker class.** All three bodies carry `main-provider-family-page`, so the family prefix is `body.main-admin-detail-page.main-provider-family-page` — (0,2,1), which beats the legacy navy token blocks at (0,1,1) and, on source order, the credentials page's merchant-report rules at (0,2,1). The marker is deliberate: `main-provider-detail-page` sits on two of the three pages and all five provider pages share `data-access-page="main_provider_detail"`, so neither can isolate one page. Page files narrow it further: `:not(.main-report-exec-page)` for detail, `.main-report-exec-page[data-report-view="settlement"]` for credentials, `.main-provider-stub-page` for health.
- `main-provider-create.html` (`main-provider-create-page`) and `main-provider-endpoints.html` (`main-provider-integration-page`) are **not** migrated and still share `main-provider-executive.css` — so that file is left untouched by this migration.
- Credentials is painted by two other families at once: `main-merchant-report-executive.css` (79 matching rules — it carries `main-merchant-report-page` + `data-report-view="settlement"`) and `main-provider-report-executive.css` (55). Anything that must win regardless of load order carries its three body classes plus the data attribute.
- Credentials' two pickers come from `assets/js/main-provider-settlement-ledger.js` — a fourth calendar implementation, now defaulting to **This Month** and emitting the locked strip contract (`in-range` / `selected` / `is-start` / `is-end` / `is-preview`) with hover preview and first-click-stays-open, like the other three.

Three inherited defects fixed with page-scoped overrides (the shared files were read, never edited):

- **Page-size select hidden** on credentials and health: `main-admin-detail-executive.css:1108-1112` declares `.mad-footer .rounded-select-wrap{display:none!important}`, which hits the wrapper `reports.js` injects around `#settlementPageSize` / `#mpaPageSize` — the control was unusable while its "Show … / page" label stayed on screen.
- **Responsive table** on health (two independent breaks): `…:671-676` and `…:707-716` hide only `th` for some columns, so the header slid off the body; and `…:1331-1360` switches to a card layout keyed to `tr.mad-row` / `td[data-label]`, neither of which `main-provider-activity.js` emits. Fixed by keeping a real table at every width. **Restoring `thead`/`tbody`/`th`/`td` is not enough — the row level is blockified too, so `tr` must be forced back to `display:table-row`**; without it each row lands in its own anonymous table (measured 379px header/cell offset at a 980px viewport).
- **Modal head/foot dividers**: `reports.css` paints `.modal-clean-head` / `.modal-clean-foot` with the cool `--line` token, and neither the Admin Detail block nor the merchant block migrated that layer (they style `.mad-modal-*` and `.modal-clean-close/-panel`). On charcoal the divider read as a light seam in **both** themes; now warm `#EADCC8` / `rgba(255,255,255,.14)`.

Inherited-but-inert, do not "fix" without checking: `--bo-secondary:#2563EB` is declared by all three family files and consumed by none; the `.mad-role.is-support|is-tech|is-regional` chips keep the reference's `#DBEAFE`/`#1D4ED8` palette and no `.mad-role` element exists on these pages.

Verification: per-element colour sweep (canvas, sidebar, topbar, content, modals, both pickers) in light and dark — 0 retired or saturated-blue hits on all three pages. Credentials pickers checked for default range, first-click-stays-open, hover strip and refetch (`month=2026-09`); health table checked aligned (`maxLeftDelta 0`) at 1440/1270/1190/980/420px with its page-size popover opening in-viewport.



Follow-up (same day) — the two picker defects found in review:

- **The health page now uses the family date-range picker.** It carried two native `input[type=date]` fields; it now has the same `.ref-*` markup as its siblings (`#reportDateTrigger` / `#reportRangePicker` / `#reportCal*`, 8 presets), driven by new code in `main-provider-activity.js`. The request window is unchanged (`from` / `to` on `/admin/main/provider-activity`) and it defaults to **This Month** with the strip contract, so all four provider pages read alike. That makes **five** copies of the calendar in the repo — a shared driver is the eventual cleanup.
- **The credentials ledger panel was clipped.** `main-provider-report-executive.css:125` anchors it `right:0;left:auto` while `reports.css:3595` pins the field to 292px, so the 390px panel hung 98px to the LEFT of its trigger (measured panel.x 223 vs field.x 321) and the nearest clipping ancestor (`.mad-panel`, `overflow:hidden`, x=304) cut the entire preset rail off. The merchant reference and every other page anchor left (panel.x == field.x), so the credentials file now anchors left — inside `@media(min-width:768px)`, because below that `reports.css` turns the picker into a fixed sheet (`position:fixed; top:96px`) and a page-level `left:0` would flatten it to the viewport edge. Flush-left at mobile is what the merchant pages already do, so it was left alone rather than diverging.
- **The picker treatment lives in the family file now.** The Admin Detail block never carried the calendar rules — they sit in `main-dashboard-executive.css` and were ported per family — which is why the shared file gained a rescoped copy of the merchant file's verified picker + strip sections (trigger, rail, panel, head/week/month/year grids, day cells, hover, `is-start` / `is-end` / `is-preview`).

## Layout

Shell: sidebar + sticky topbar + main. One job per section. Touch targets ≥44px on coarse pointers.

## Elevation & Depth

Light: form pages use the **layer ladder** (lifted cards + warm shadow + amber rail). Listing tables: 1px border + soft warm shadow. Dark: surface lift via border; soft charcoal shadows only. Focus rings: amber (`rgba(217,119,6,.18)` / `rgba(245,158,11,.18)`).

## Shapes

Action controls / theme toggle `8px`, cards `16px`, topbar avatar `12px`, chart hover tip `.trend-tip` `8px`, pills/switches `999px`, nav ~`10px`.

## Do's and Don'ts

**Do**
- Keep light/dark parity when changing colors.
- Use continuum on canvas only; keep sidebar opaque; keep panels solid.
- Prefer `--bo-*` tokens; treat `--bo-cyan*` as amber.
- Copy Admin Detail topbar (theme + User Name) and Primary/Ghost button recipes on every migrated page.
- Override legacy light canvas (`reports.css` `.report-body{background:#f5f7fb!important}`) on every dark page, or white frames will leak.

**Don't**
- Reintroduce Deep Navy Cyan (`#123B66`, `#21A6D7`, `#072647`, `#08131F`, `#0B1626`, `#0F1F33`).
- Purple-on-white / indigo marketing gradients as product identity.
- Dead pure black (`#000` / `#0A0A0B`) for dark canvas.
- Muddy full-page orange wash under table panels.
- Flatten Create/Edit forms to one cream (skip the layer ladder / amber rail).
- Cool `#fff` / `#FBFCFE` / `#F1F5F9` chrome on cream form pages.
- Invent a different User Name pill, theme-toggle size, or primary gradient per page.
- Assume writing tokens in MD alone paints the page — CSS must implement and win specificity wars.
