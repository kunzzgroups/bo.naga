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

**Padding and title (2026-09-15).** `.report-topbar` is `padding:10px 20px` on every page — the Dashboard's value, which `reports.css` now carries as the base (`12px 20px` before) so no page needs its own rule. The mobile variants (`padding:10px 12px`, and the `max-width:700px` `8px 10px` for `.standardized-listing-page`) are unchanged, as is the mini-sidebar `padding-left:20px`.

**No page carries a subtitle.** The `.user-title-wrap` block is the icon tile plus a single `<h1>`: the lead `<p>` ("Manage administrator credentials, …") was removed from 118 pages in the same pass. `main-merchant-detail.js` still queries that `<p>` (its `setPageChrome()` swaps the lead between list and edit wording) — the lookup is null-guarded, so it is simply inert now; wire it back if the lead ever returns.

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

**Transaction listing table** (`body.bo-wallet-tx`): peach-cream zebra light `#FFF8EB` / `#FFF1DC` · thead `#FFE8CC`; dark zebra `#3A3C48` / `#434653` · thead `#1F2128` (deeper than body) — **same zebra rhythm** · **no pure white** · square thead corners · cell `bold` · PENDING orange. Tokens `--bo-table-*` in `bo-wallet-transaction-amber.css`. Full table: `.interface-design/system.md` → Patterns → Data tables → Transaction listing table.

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

### Transaction listing family (`body.bo-wallet-tx`)

Sidebar **3. Transaction** pages use listing chrome: filter/select = surface `#FFF8EB` (not form well `#F5EBDC`); dark selected option = `#F59E0B` / `#2A2C36`; pager = mad-pager slate inactive + amber active; **date range popover** = cream panel `12px` · preset active wash `#FFF1DC`/`#B45309` (never solid CTA) · ghost month/year head · divider shadow into calendar; **table frame** = Admin Detail `.mad-panel` (viewport-locked · inner scroll · `table-layout:fixed` · radius `8px`); **table zebra** = light `#FFF8EB`/`#FFF1DC` · dark `#3A3C48`/`#434653` · head light `#FFE8CC` / dark `#1F2128` · **no pure white** · thead corners square · cell `bold` · PENDING orange / APPROVED green / REJECTED red. CSS: `bo-wallet-transaction-amber.css`. Full notes: `.interface-design/system.md` → Layout → Transaction family + Patterns → Date range picker / Data tables (Transaction listing table).

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

**Modal mount point and action-row states (2026-09-16, user-reported on Merchant Detail).** Two
defects, both invisible to a colour sweep and to a static read of the stylesheet.

- **A modal must be a child of `<body>`, not of `main`.** `main.report-main` carries
  `position:relative; z-index:1`, so it is a **stacking context at z-index 1**. A modal nested
  inside it can raise its own `z-index` to `30000` and still paint *below* the sidebar
  (`z-index:1040`, or `1000` once the `:has(.mad-modal.show)` rule lowers it) — the sidebar sat
  fully lit over the scrim while the topbar and content were correctly dimmed. Measured on the
  user's screenshot: the sidebar sampled exactly `#FFE8CC` (undimmed) while the topbar sampled
  `#FFF8EB` under `rgba(15,23,42,.55)`. Fixed by moving the three modals in
  `main-merchant-detail.html` out of `</main>`/`.report-shell` to body level — which is where
  the reference page `main-admin-detail.html` already puts them. No CSS or JS depended on the
  old nesting (every reference is `getElementById`).
  **Still unfixed on two pages:** `main-admin-security.html` and `main-merchant-security.html`
  mount their `masDetailModal` inside `main` and have the same symptom.
- **An ID-level default rule silences every class-level `:hover`.** The credit modal's Cancel
  carried a resting-state rule at two IDs
  (`html:not([data-bo-theme="dark"]) body #madCreditModal #madCreditForm .mad-btn-ghost`), which
  out-ranks *any* `:hover` at class level — so Cancel had no hover feedback at all in light and
  only a text-colour change in dark. The hover/active steps now carry the same two IDs. This is
  DESIGN.md's own "ID level" trap (see trap 3 in the opt-in layers) surfacing inside a family
  file: when a control is pinned by an ID, its state changes belong at the same level.
- **The credit/reclaim action row is contested across two files.** `main-admin-detail-executive.css`
  still holds a navy-era block for `.mac-adjust-panel .mad-modal-actions .mad-btn-*` at (0,5,1)
  `!important` — including `background:#0E2F52` on the primary's **hover** and a literal cyan
  `rgba(33,166,215,.45)` on the ghost's. The family's amber rules for the same buttons sit at
  (0,4,1), so they won every state *except* hover: Confirm Top Up rendered correct amber at rest
  and turned navy `#0E2F52` on hover (the user's screenshot was the hover state). The locked
  states are now stated in `main-merchant-detail-executive.css` at (0,5,1) / (0,6,1) so they win
  on specificity rather than load order. Verified by hovering with a real mouse move and reading
  `getComputedStyle`, both themes — `getComputedStyle` without a hover cannot see this class of
  defect, and neither can a search for cool hues (the resting state is correct).
  **Outstanding on the admin page:** `main-admin-detail.html`'s own Adjust Credit modal
  (`macAdjustModal`) still measures hover `#0E2F52` — the same legacy block, same cause.

**Record Amount currency group — settlement (2026-09-16, user-reported).** The `.msr-amount-group`
control in `main-merchant-settlement.html` was the last navy-era `.msr-*` component on a migrated
page. Measured resting state on the live site: shell `#FFFFFF` (pure white) on a cool-grey
`#D0D5DD` border, the MYR segment on the **canvas** cream `#FFF1DC`, the inner input on the control
well — three unrelated surfaces in one 42px control, with a white hairline visible between them
because the inner halves render 40px inside a 42px shell. Its focus ring was a **literal cyan**
(`box-shadow:0 0 0 3px rgba(33,166,215,.12)`, `border-color:var(--bo-cyan,#21A6D7)`).

- **This one is a copy-paste miss, not a new derivation.** `main-provider-credentials-executive.css:607-682`
  already carried the correct retint for the *same* Record Amount dialog (Provider Credentials has
  the same control), values and all. Settlement was simply never given its copy. The fix in
  `main-merchant-detail-executive.css` copies those values rather than re-deriving them — when a
  component exists on two pages, read the one that is already right.
- **Where the fix goes matters.** The `.msr-*` rules live in `main-merchant-report-executive.css`,
  which is shared with `main_merchant_report` / `main-merchant-balance` /
  `main-merchant-transactions` / `main-provider-credentials` — retinting it in place would repaint
  four pages outside this page. The override therefore sits in the merchant family file, scoped
  `body.main-admin-detail-page[data-access-page="main_merchant_detail"]`, which is the only
  `.msr-amount-group` page carrying that attribute value. The selectors carry `.msr-payment-fields`
  as well, because the rule being beaten
  (`.msr-payment-fields .msr-amount-group.mac-input-group`) sits at (0,4,1) and the plain
  `.msr-amount-group` form only reaches (0,3,1).
- **A pinned control width and a narrower column.** `reports.css` pins the shared date trigger to
  `260px`; `.msr-payment-row` gave the date column `232px`, so the trigger overhung its own column
  by 28px **into the amount field** — which is what made the two fields read as colliding. 260px is
  this page's documented control width, so the column was widened to the trigger, not the reverse.
- **Native number steppers** sat under the right-aligned value. The family already hides them on
  merchant amount inputs (`main-admin-detail-executive.css:6881`), so the same rule was extended
  here rather than inventing a spacing fix.

Verified: computed colour of shell / addon / input / divider / placeholder in both themes, plus the
focus state (amber `#D97706` + `rgba(217,119,6,.12)`, divider following to amber) and a cool-hue
sweep over the whole dialog — **0 hits in both themes**, and the two controls measure the same
height with the date trigger flush inside its column.
Note the **date field stays on its own locked recipe** (`#FFF8EB` / `#EADCC8`) while the amount sits
on the control well (`#F5EBDC` / `#F0E4D0`): that difference is the documented date-picker trigger
recipe, not a miss — the same page's Remark textarea is on the well, so the amount group now agrees
with the field it belongs to.

**Repayments-due counter clipped by the button it sits on (2026-09-16, user-reported on Merchant
Profit).** `#mprRepayBadge` — the red count on the topbar repay link — rendered as a red **wedge**
at the button's corner with a half-cut digit. The badge's own box was correct the whole time
(17px pill, `place-items:center`, digit centred to 0.05px); what was wrong was that
`main-merchant-detail-executive.css` puts `overflow:hidden!important` on every `.bo-theme-btn`
(locked toggle chrome, there to keep the toggle's icon inside the rounded square), and the repay
link reuses that class for its geometry. A corner badge overhangs by design, so it was clipped to
the part inside the button.

- **The tell is that the visible red is not the badge box.** Measured on the user's screenshot the
  "1" sat ~2px up-and-right of the red shape's centre — which reads as a centring bug and is not
  one. Before "fixing" an off-centre badge digit, compare the digit against the badge's *box*, not
  against the painted region: a clipped badge and an off-centre digit look identical in a
  screenshot.
- Fixed with an exception beside the clipper
  (`… .bo-theme-btn:not`-style scoping is not enough here — the badge button needs the geometry and
  only the clip removed, so it is a follow-up rule at `.bo-theme-btn.mpr-repay-btn`, (0,4,1)
  against the base's (0,3,1), so load order cannot decide it). The theme toggle keeps
  `overflow:hidden` — verified after the change.
- The badge's own sizing was also made font-independent: `line-height:14px` inside an 18px box let
  the digit's vertical position follow the font's ascent/descent (it drifted up to 2px at some
  zoom levels). `line-height:1` + the grid centring pins it — measured `dy` 0.05px for `1`, `12`
  and `99+`. Size is now `17px` at `top/right:-7px` (so it sits on the corner rather than over the
  glyph), digit `10.5px/800` — the locked scale's smallest size, matching the status pill.
- Verified both themes: badge renders whole, ring is `#FFF8EB` light / `#383A46` dark, overhang
  6.2px, 5.8px of clear space to the theme toggle, still inside the topbar.
- **Not changed, and worth a decision later:** the repay link is visually a twin of the theme
  toggle (same 36×36 cream rounded square, same 18px icon) and it sits in a topbar that already
  reads as a row of similar rounded squares, so the red counter is the only thing marking it as an
  alert. Giving the button itself an alert tone when a count exists (the documented danger recipe,
  `#FEF3F2` / `rgba(239,51,64,.35)` / `#B42318`) would make it read without the badge, but that
  touches the locked topbar cluster and was left for the owner to call.

**The Action column clips on a laptop — `min-width` is inert under `table-layout:fixed` (2026-09-16,
user-reported on Merchant Profit).** On a 1551px window (the user's laptop: a 1939px screenshot is
1.25× DPR, so the CSS viewport is 1939/1.25) the ledger's last column cut the edit/delete buttons
off at the panel edge.

- **The cause is a declaration that never applied.** `main-merchant-profit.css` protected the column
  with `width:6%; min-width:88px` — but every listing table in this system is
  `table-layout:fixed` (locked: DESIGN.md → Data tables), and in fixed layout a cell's `min-width`
  is **ignored entirely**: the column takes `6%` of the table and shrinks with everything else.
  Measured content box for the action cell: 55px at 1551, 39px at 1280, 31px at 1152 — against a
  68px requirement (two 40px icon buttons), clipped by the panel's `overflow:hidden`. The panel's
  vertical-scroll frame is untouched, so there was nothing to scroll: it simply cut.
- **The fix is a px `width`, not a percentage and not `min-width`.** In fixed layout a px width IS
  honoured, and the percentage columns absorb the difference. `width:88px` (the value the old
  `min-width` always meant) holds the column at exactly 88px from 1551 down to 1152 — content box
  70px against 68px needed, 9px right gap, no clipping, no horizontal scrollbar. A percentage
  cannot do this job: the column needs ~7.1% at a 1551 window but ~10.1% at 1152, so any single
  percentage either wastes space or clips at the narrow end.
  **Rule: a column that carries fixed-width controls needs a px width and `table-layout:fixed` is
  what makes that safe. Do not "protect" such a column with `min-width` — under fixed layout it is
  silently inert, which is worse than no protection because it reads as handled.**
- Verified 1918 / 1551 / 1440 / 1366 / 1280 / 1152: column 88px (95 at 1918), content fits with a
  9px gap, the `Action` header is not clipped, and the wrap gains no horizontal scroll.

**Modal mount point — the rest of the pages (2026-09-16, third report of the same defect).** The
user hit this class three times (`main-merchant-detail`, then `menu-management`), so the whole repo
was swept instead of waiting for the next report. **Nine pages still mounted modals inside
`main.report-main`** and were moved to body level:

`admin-user`, `compliance-policy`, `menu-management`, `payment-gateway`, `payment-method`, `role`,
`social`, `main-admin-security`, `main-merchant-security`

(sweep: any page whose first `.modal-clean` container sits before `</main>`). The move is the same
one recorded above — cut the modal block out of `</main>`/`.report-shell` and paste it after the
shell's closing `</div>` — and every page was then checked in the browser: modal's parent is `BODY`
and `document.elementFromPoint()` at the sidebar's centre returns the scrim, not `report-nav`.

**Two traps in doing it mechanically — both cost a pass:**

- **A modal container's opening tag can share a line with its own panel**, e.g.
  `admin-user.html` had `<div class="modal-clean admin-create-modal" id="adminCreateModal"><div class="modal-clean-panel …">`.
  A line filter that excludes lines containing `panel` (to skip `-panel`/`-close`/`-body`
  sub-elements) therefore **skips that container entirely** — the sweep reported one modal on
  `admin-user` and missed the other. The browser check caught it (`adminCreateModal` still
  `parent: MAIN`). **Do not identify modal containers by a text filter on one line; count
  `.modal-clean` elements in the DOM** (and filter sub-elements by class, not by substring).
- **A slice that re-includes the line you already emitted duplicates the closing tags.** The first
  attempt at `admin-user` produced two `</main>` and 79/80 divs. Always assert **equal `<div` and
  `</div` counts inside the moved block *and* across the whole file** after the write — the
  in-block balance alone was true both times, and only the file-level count revealed the
  double-emit. `git checkout -- <page>` restored it and the second attempt passed.

Method that worked, per page: locate the first container and the last non-blank line before
`</main>`; assert in-block div balance; assert the shell's closing `</div>` follows `</main>`;
rewrite as `head + [</main>, </div>] + note + block + tail`; then re-assert whole-file tag balance.
Two pages needed their closing tags handled by hand because `</main>` and the shell `</div>` sat on
**one line** (`payment-gateway.html`: `</main></div>`), which also defeats a `line == '</main>'`
test — match with `in`, not `==`.

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

**No report tab strip on the two pages — 2026-09-15.** `main-win-lose-report.html` and `main_provider_report.html` no longer carry `.mad-tabs.mre-tabs`: the strip's only job was cross-linking the two, and `permission-tabs.js` (`el.hidden = !ok` from the role's menus) already reduced it to a single tab for a role that has one of the two pages but not the other — a lone label for the page you are already on. `main_merchant_report.html` keeps its two links, so the pair is still reachable from the Report family's own chrome and from the sidebar. Where a strip does remain, it now collapses when every tab is hidden (`:has()` guard in the shell file), instead of holding a 47px row.

**The date control sits in the filter row — 2026-09-15.** Moved out of `.mre-scope-bar` and into `.mad-filters` as its **first** child, before the search frame, on both pages (a pure move: every `#…From` / `#…Trigger` / `#…CalDays` id stays unique, so `getElementById` and both pickers' wiring are untouched). The scope bar is left carrying `CURRENCY` only. Two consequences worth keeping:

- The shared control is pinned to a fixed `260px` (`reports.css` sizes `.ref-range-wrap` **and** `.ref-range-trigger`, and the legacy shell sizes them again) while the wrapper around it may shrink — so the trigger used to overhang its own column and paint **over** the search frame once the row ran out of width. Measured `overlapSearch: true` at 1440 and 1280 CSS px, which is what a ~1900px window shows at Windows 125% scaling.
- **The five controls and the status pills share one line, by policy** (a folded control row was read as a broken layout, and so was a pills-only line). The bar is `flex-wrap:nowrap`, so the row *tightens* instead of folding — measured one line at every width from **1400 to 1932**, with no overlap, no overflow and no clipped date label. Wrap returns below 1400 (`@media (max-width:1399.98px)`), where the five controls can no longer fit: they then keep their own row together, pills above. Do not "fix" a wrap threshold by tuning numbers — folding is decided on the items' *hypothetical* (basis) sizes, so a threshold tuned against one window is a guess about that window only; nowrap plus shrinkable items is what makes the behaviour width-independent.
  Where the width comes from: the **search box is the shock absorber** (basis `100px`, floor `96px`, capped `168px` — it ellipsises its own placeholder), the **date control keeps `236px`** so its fixed-format label never clips, the **pills give up breathing room but not content** (track gap `4px`, pill padding `0 10px`), and the two filter selects sit at their natural `160px`.
  Two pins in the old stack have to be beaten deliberately, both found the hard way:
  - `.mre-search` is pinned by `main-provider-report-executive.css` at `flex:0 1 280px!important; min-width:180px!important` — a stylesheet `!important` with **no** `!important` on our side leaves the search on a 280px basis, which folds the row ~180px earlier than it needs to.
  - `.rounded-select-wrap` **cannot be narrowed from CSS at all**: `reports.js` writes `width / min-width / max-width / flex:0 0 160px !important` **inline** on the wrapper it builds, and inline important outranks any stylesheet important. Any further tightening has to come from the search, the date control, the pills, or `reports.js` itself.
- Anything that styles the date field by its old position (`.mre-scope-bar .ref-date-field`) no longer applies; the rules that matter are keyed on `.mre-period-group` and `.mre-date-field`, which travel with the markup.

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

### Date-range picker (one component — reference: `main-merchant-profit.html`)

**Reference page: `main-merchant-profit.html`.** Open its picker and measure it; the tables below are what it computes, element by element, in both themes. Report pages and the Dashboard are already on these values — `main-report-charcoal.css` (report family) and `main-dashboard-executive.css` (Dashboard) carry them for their scopes. **Change one, change the other**, then re-measure all three pages: `main-merchant-profit.html`, `main-dashboard.html`, a report page (`main-win-lose-report.html` is the quickest).

Markup: `.ref-date-field > .ref-range-wrap > .ref-range-trigger` + `.ref-range-picker` (rail, calendar head, `.ref-cal-week`, `.ref-cal-days`, month/year grids). Any page that already uses these classes only needs the CSS below and the pin bump.

| Part | Light | Dark |
|------|-------|------|
| Field (`.ref-date-field`) | width is **per page** (see below) | — |
| Trigger `.ref-range-trigger` | bg `--bo-surface` `#FFF8EB` · border 1px `--bo-border` `#EADCC8` · radius `10px` · text `--bo-text` `#18191C` · `13px/700` · h `42px` | bg `#2A2C36` · border `rgba(255,255,255,.12)` · text `--bo-text` `#F5F5F4` |
| Panel `.ref-range-picker` | bg `--bo-surface` `#FFF8EB` · border `--bo-border` `#EADCC8` · radius `12px` · **`box-shadow: 0 12px 30px rgba(60,48,32,.14)`** | bg `#383A46` · border `rgba(255,255,255,.14)` · radius `12px` · **`box-shadow: 0 16px 38px rgba(0,0,0,.4)`** |
| Calendar well `.ref-range-calendar` | transparent (the panel shows through) | bg `--bo-surface` `#383A46` (opaque) |
| Rail `.ref-range-presets` | bg `--bo-surface` · border `--bo-border` · width `112px` · pad `8px 0` · **same `box-shadow` as the panel** | bg `#383A46` · border `rgba(255,255,255,.14)` · same shadow as the panel |
| Rail item | transparent · text `#374151` · `12px/900` · pad `9px 12px` | text `#E7E5E4` |
| Rail item **active** | **solid** `#D97706` · label white | **solid** `#F59E0B` · label **white** |
| Head buttons (`.ref-cal-head button`, `.ref-head-pick`) | transparent · text `#374151` · the reference box carries a 1px transparent border | transparent · text `#E7E5E4` |
| Month / year grid item **active** | **plain** — transparent · text `#374151` | `#F59E0B` · label white |
| Week row `.ref-cal-week span` | `#71717A` · `11px/900` | `#A1A1AA` |
| Day cell | transparent · `#374151` · `12px/800` | transparent · `#E7E5E4` |
| Day cell, other month (`.muted`) | transparent · `#57534E` | `#A1A1AA` |
| Day cell hover | wash `rgba(217,119,6,.16)` · text `#B45309` | wash `rgba(245,158,11,.16)` · text white |
| In-range day (`.in-range`) | wash `rgba(217,119,6,.14)` · text `#B45309` | wash `rgba(245,158,11,.18)` · text `#FBBF24` |
| Range edge (`.selected`) | `#D97706` · label white · radius `8px` | `#F59E0B` · label `#2A2C36` · radius `8px` |
| Day grid `.ref-cal-days` | **`gap:0`** — cells touch, so the band is continuous | same |

**Per page, NOT part of the design** — do not "unify" these: the **control width** (settlement `260px`, report pages `236px` in a five-control filter row, Dashboard its own), the **preset list** (the Dashboard also offers `Last 7 Days`, and the rail is simply taller for it), and therefore the panel/rail **height**.

#### The band must read as ONE strip — which rules apply depends on the script

- Emits `is-start` / `is-end` / `is-preview`: `main-merchant-report.js`, `main-merchant-profit.js`, `main-merchant-security.js`, `main-provider-settlement-ledger.js`. Strip rules keyed on those classes apply directly.
- Emits only `in-range` / `selected`: `main-exec-date-range.js` (Win/Lose report, transaction history, accounting due, settlement report) and `main-dashboard.js` (Dashboard). The same strip is built without the edge classes: `.selected.in-range:not(.is-start):not(.is-end)` with `:is(:first-child,:not(.in-range)+*)` for the left outer corner and `:is(:last-child,:has(+ button:not(.in-range)))` for the right, plus the both-cases rule for a single-day range. **Without those three rules a range renders as two rounded pills joined by a flat connector.**

#### Traps that cost a pass each

1. **Some values are inherited, not the family rule's.** In dark the active preset label is **white** on the reference, but the family rule says `#2A2C36` — a page-level rule with *higher specificity* wins there. Reading the family stylesheet alone gives the wrong answer; always read `getComputedStyle` on the reference page.
2. **`!important` parity is not enough — check the weight too.** `main-dashboard-executive.css` pins `.ref-cal-head button{border:0!important}` at (0,2,2); matching the reference's transparent border needs `border:1px solid transparent!important` **and** a selector that out-ranks it (`.ref-cal-head button.ref-head-pick`).
3. **`reports.css` pins the bases**: the panel is `#fff`, the rail `#f8fafc`, the day cells `#fff` / `#F7F9FC`, hover `#eef3ff`, muted `#cbd5e1`, and the field/trigger widths at `390 / 292 / 195px` across media queries. Everything that must survive it carries `!important`, and light-only rules use the `html:not([data-bo-theme="dark"])` prefix (a shorter selector loses to those pins).
4. **The day grid needs `gap:0`**; the base sets `3px` and the band then breaks up into chips. The cell width follows from it, which is why the grid is a reliable tell in a screenshot.
5. **Audits: compare a border colour only where the border has width.** Cells with `border:0` still report a colour (the text colour), and a reference box may carry a transparent border — both produce phantom differences. Same for the panel/rail height, which depends on the preset count.
6. **A shared `.js`/`.css` edit needs its `?v=` bumped in every referencing page in the same pass** — several passes here were verified against a cached stylesheet and reported "no change".

#### Recipe for a page you have not touched

1. Look at the picker's driver (see the two contracts above) and note the field/`.ref-range-wrap` width policy for that page's row.
2. Link `main-report-charcoal.css` (or add the values to that page's own family file, like the Dashboard does) **after** every legacy sheet, then the panel/rail/day/hover/in-range/edge/shadow rules listed above, mode-split with `html:not([data-bo-theme="dark"])` / `html[data-bo-theme="dark"]`, `!important` on anything `reports.css` or a legacy block also sets.
3. Add the range-edge rules for the class contract that page's script emits, including `gap:0` on `.ref-cal-days`.
4. Bump the pin in that page.
5. Verify by measuring the reference and the new page side by side, both themes, on: trigger, panel, calendar well, rail, rail item + active, head buttons, week row, muted day, in-range day, edge day, month active, day-grid `gap`, panel/rail `box-shadow`. Ignore the per-page quantities from the list above. Light and dark should both come back empty.

**Resolved 2026-09-16 — the picker is uniform across all ten pages that carry it.** Two
inconsistencies were closed, both found by comparing `getComputedStyle` ACROSS pages rather than
by any colour audit:

- The active rail item was a **wash** on `main-merchant-balance.html` (the picker's rail buttons
  also carry `.rounded-select-option`, and the enhanced-select rule for that class paints `active`
  as a wash — with a `html:not([data-bo-theme="dark"])` prefix, one class-level above an
  unprefixed family selector, so a later unprefixed restatement lost).
- The dark label was **white** on `main-admin-security.html` and `main-merchant-security.html`
  where every other page (including the reference) measures `#2A2C36`.

Both are invisible to a colour sweep — the values are amber in every case — and invisible to a
review by eye at screenshot scale. They were only visible as a *disagreement across pages*.
**When a component appears on many pages, diff its computed style between them; that comparison
finds a class of defect nothing else does.**

Superseded note (kept for history): `main-merchant-settlement.html` painted the active rail item as a **wash** (`rgba(217,119,6,.16)` / `rgba(245,158,11,.2)`) instead of the solid fill — a page-scoped rule in `main-merchant-detail-executive.css`, not this contract. One rule to remove if the family should be fully uniform.
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

- **A pill set without `bo-seg-bounce` renders with no frame at all.** The family's active-pill fill is drawn by the shared `.bo-seg-thumb`, not by the pill: `main-merchant-detail-executive.css` sets `.mad-pill.is-active{background:transparent}` and puts the cream/charcoal raised chip in `.mad-pills.bo-seg > .bo-seg-thumb`. `main-merchant-profit.html` carried `.mad-pills` but never loaded `bo-seg-bounce.css`/`.js`, so its filter pills fell back to an unstyled grey chip while every other pill-bearing merchant page looked right. Both files are wired there now; the thumb is created by the script (`ensureThumb`) and positioned by `sync()`, which runs on mount, on resize and on any mutation of the track (class/text), so counts and clicks keep it aligned.

## Layout

Shell: sidebar + sticky topbar + main. One job per section. Touch targets ≥44px on coarse pointers.

## Elevation & Depth

Light: form pages use the **layer ladder** (lifted cards + warm shadow + amber rail). Listing tables: 1px border + soft warm shadow. Dark: surface lift via border; soft charcoal shadows only. Focus rings: amber (`rgba(217,119,6,.18)` / `rgba(245,158,11,.18)`).

## Shapes

Action controls / theme toggle `8px`, cards `16px`, topbar avatar `12px`, chart hover tip `.trend-tip` `8px`, pills/switches `999px`, nav ~`10px`.

### Opt-in `bo-charcoal` layers — the mechanism for every remaining page (2026-09-15)

The twenty-odd pages documented above migrate family by family, each with its own rescoped copy
of the charcoal block. The remaining pages do not share those families and mostly do not speak
the `.mad-*` vocabulary at all, so they migrate through **three shared layers plus a marker
class** instead:

| File | Covers |
|------|--------|
| `assets/css/bo-charcoal-shell.css` | Mechanical rescope of `main-merchant-detail-executive.css` (875 prefixes, weight-preserving) — shell chrome (canvas, sidebar, topbar, tabs, filter bar, table, footer, pager, buttons, modals, tips) and the `.mad-*` content vocabulary |
| `assets/css/bo-charcoal-legacy.css` | The `reports.css` and "standard" vocabularies the unmigrated pages actually use: `.filter-card .table-card .summary-card .report-table .metric .quick-stats .field .seg .notice .table-wrap .clean-btn .standard-list-card .standard-data-table .table-footer .entries-control .pagination-clean .page-btn .user-toolbar .user-metric .permission-* .main-mod-* .settlement-*`, plus the filter-row controls, panel surfaces, icon buttons, the date-range trigger, empty states, and the Bootstrap table variables |
| `assets/css/bo-charcoal-primitives.css` | Components that had no owner or several contradictory ones: `.bo-ui-button*`, `.mad-btn*` (no base rule existed), Bootstrap and `.modal-clean*` / `.mad-modal*` / page modal families, `.rounded-select-*` (three to four competing definitions), `.bo-seg-thumb`, tips, the whole date-range picker, a toast primitive, switches, checkboxes, uploads |

**Scope and safety.** Every rule is keyed to a `bo-charcoal` marker class that is added to a
page's `<body>` only when that page is migrated. Nothing repaints until a page opts in, so the
blast radius of a shared layer is exactly the set of pages that carry the marker. The layers load
after every legacy stylesheet on the page; the rescope keeps its source's specificity exactly
(one class-level replaces one attribute-level), which is what lets the verified amber rules
transfer unchanged.

**Per-page recipe.** Add `bo-charcoal bo-account-chip` to `<body>`; append `bo-account-chip.css`,
`bo-charcoal-shell.css`, `bo-charcoal-legacy.css`, `bo-charcoal-primitives.css` after the last
`assets/css` link; put the locked theme toggle in `.report-actions` with `[data-bo-profile]` as a
direct sibling (both `auth.js` and `agent-portal.js` overwrite that element's `innerHTML`, and
`bo-account-chip.css` keys on the direct-child step); add `bo-theme.js` + `bo-account-chip.js`.
**Most of the remaining pages had no theme toggle at all**, so dark mode was simply unreachable
on them — `data-bo-theme` was never written.

### Traps this migration found (each cost a pass)

1. **A malformed `:is()` list can make a whole family inert.** `main-report-charcoal.css` had four
   `data-access-page` values concatenated without commas, so they formed one impossible compound
   selector — 1307 rules never matched. `main-merchant-transactions.html` was documented as
   migrated and still rendered the retired navy. If a migrated page shows legacy chrome, check the
   scope selector before anything else.
2. **`bootstrap.min.css` is cross-origin.** Its rules never appear in a same-origin style audit,
   and no page selector out-ranks `.table > :not(caption) > * > *` cleanly. That is why white
   `<th>`/`<td>` survived every attempt to name table classes. Bootstrap drives every table colour
   from custom properties, so the fix is `--bs-table-bg` / `--bs-table-color` /
   `--bs-table-border-color` / `--bs-table-striped-*` / `--bs-table-hover-*` (and `--bs-body-bg`,
   `--bs-border-color`, the `.btn` set) on `.table` — one rule, every Bootstrap table.
3. **`!important` parity is not enough; ID level is.** `bo-ui-standard.css` guards its filter row
   with `body:not(#bo-filter-standard-off):not(#bo-filter-standard-legacy)` — two ID-level `:not()`
   steps whose stated purpose is to out-rank "every legacy page-level filter rule". A class-level
   `!important` ties on importance and loses on specificity, so the locked layer mirrors the shape
   with two ID steps and more class weight. `bo-charcoal-off` on `<body>` is the opt-in escape.
4. **A mechanical retint must be value-driven, not list-driven.** The locked palette contains no
   cool-hued value in either theme — light's only blue is the documented "Secondary (info / rare)"
   that nothing should paint with, and dark's secondary is amber — so *every* cool-hued literal is
   wrong. A hand-written value list kept missing 3-digit `#fff`, `#65728B`, `#DFE6F0` and the
   `#FBFCFE` header tints. Classify each value by measured HSL instead: near-white → surface,
   light tint → border, grey text → muted, dark → ink, saturated → accent; keep a wash's alpha;
   migrate a neutral only where it is a surface, since a plain white label on an amber fill is the
   locked accent-on.
5. **The first declaration in a rule is easy to skip.** Splitting a block on `;` yields a first
   fragment that begins with `{`, so a `^property:` regex misses it — and first position is where
   `background:#fff` usually sits. Grep the *file* for surviving cool values after a retint; do not
   trust the transform's own report.
6. **A page that rewrites its own document defeats an inline probe.** `provider-detail.html`
   dropped the injected harness from the DOM. Such a page has to be checked by screenshot.
7. **A page that redirects on API failure cannot be measured in place, and unmeasurable is not clean.**
   `agent-portal.js` wraps its whole shell build in one try/catch: any error removes the token and
   assigns `location.href = 'agent-login.html'`. Two consequences. First, the failure is silent —
   nothing is logged, so a broken stub looks identical to a working one. Second, the probe leaves
   with the old document, so the sweep reports "no report" and the whole family reads as having
   nothing to fix. `Location.prototype.href` is not configurable in Chrome, so navigation cannot be
   blocked from an injected script. The workable method is to drop that one script from the sweep
   copy (`VERIFY_STRIP`) so the page stays put and its CSS can be measured, and to **report the
   stripped list with the result**, because whatever that script builds — the sidebar nav, the
   account chip — is then unverified. Counting such a page as clean would be a lie; counting it as
   broken is also wrong. It is a third state and must be reported as one. Note also that the stub
   has to answer each endpoint with a shape the page can actually consume: `portalMenuKeys` holds
   permission keys rather than page keys (`reports`/`products`/`provider_detail`/
   `player_game_report` → `bet_report`, `finance` → `wallet`, `withdraw` → `settlement`), and a
   response used both as a profile object and as a list has to satisfy both.
8. **An audit only answers the question it asks, and both of these lived in the channel it did not ask about.**
   Two defects survived a clean sweep and were found by eye, in the same family of mistake:

   - **A painted `background-image` is invisible to a computed-colour check.** The login page wrote
     `background:#F5EBDC url(login-background-v2.png)`: `background-color` measured warm and passed,
     while the 1.9 MB artwork painted a cold grey geometric field over the whole viewport. The rule
     now: report every element whose `background-image` is painted and is not a gradient (a data-URI
     SVG chevron on a native `<select>` is the one legitimate case), and look at the artwork itself.
   - **"Is anything cool left?" cannot see amber replaced by grey.** A classifier bug in the retint
     mapped every mid-lightness saturated cool colour to warm grey `#57534E`, producing grey primary
     CTAs, grey active tabs, grey selected calendar days. A warm grey is not a cool value, so the
     answer stayed "nothing cool" while the amber was simply gone. The rule now: grey is never a
     **fill** on an accent slot in the locked system, so an accent-named control with a `#57534E`
     fill or border is a defect **regardless of the colour counters** — and in the transform, test
     saturation before lightness, because a saturated cool colour is an accent whatever its value.

   Both were green on every gate the harness had. That is the useful part: a passing check is
   evidence about one property, not about the page. Sweep, then look at the screenshots.
9. **Verification must wait on a condition, not a delay.** Under load a probe that sweeps a fixed
   time after `load` can measure a half-styled page and report the retired palette as a defect (or
   hide a real one) — the same page flipped between 0 and 157 hits across runs. Wait until every
   declared stylesheet is present and `readyState` is `complete`, and emit the stylesheet counts, a
    canvas canary and `readyState` so a partial render is visible rather than believed.
10. **Two of my own rules can fight each other, and the loser is silent.** `bo-charcoal-legacy.css`
   painted a generic `.clean-btn` ghost at (0,4,2) `!important`, while `.bo-ui-button-primary` — the
   class `bo-ui-standard.js` adds by label to every "Create / Save / Search" button — carried the
   amber CTA at (0,3,1) `!important`. The ghost therefore out-ranked the primary **by one
   class-level**, and on User Management the "Create User" CTA rendered as a ghost: transparent
   fill, ink label, warm border, no amber anywhere. Nothing flagged it, because "amber" and "ghost"
   are both legitimate locked appearances, and the six counters only look for *foreign* colours.
   Two rules: a base rule in this layer must `:not()` the modifier classes it knows about
   (`:not(.primary):not(.bo-ui-button-primary):not(.mad-btn-primary):not(.mad-btn-navy)`) rather than
   rely on load order; and a primary restatement should carry the `body:not(#bo-charcoal-off)` ID so
   the outcome cannot depend on which file happens to sit later. **Looking for a ghost is the only
   check that finds this** — measure `background-image`, because a gradient never appears in
   `background-color`.
11. **The standard filter row has its own shape, and it is not a defect to "unify" it.** The
   `.bo-filter-row` vocabulary used by ~100 pages takes its `42px` height, `11px` radius and
   `12px/700` text from `bo-ui-standard.css`'s own tokens (`--bo-filter-radius:11px`, and
   `font-size:12px!important;font-weight:700!important` on the select), applied to the input frame,
   the select and the Reset button alike. DESIGN.md's components table records `8px` radius and
   `13.5px` text for the *other* filter row (`.mad-filters`, merchant/admin families) — the two are
   different components, and trap-free cross-page comparison will keep flagging the difference.
   Per the precedent recorded for the pill thumb (`999px` vs the table's `8px`: **the family value
   was kept for internal consistency**), the standard row keeps its own values. This has now been
   re-derived three times; it is written down so it does not happen a fourth.
12. **A regex in injected code is eaten before Chrome sees it.** The probe is delivered through a
   template literal, so `\w`, `\s`, `\d` and `\(` lose their backslash on the way in. A
   specificity scorer built on `/#[\w-]+/g` silently counted nothing and reported `sp=0` for every
   rule — a *plausible-looking* dump that would have justified any conclusion. Seventh occurrence of
   this mistake; the durable fix is to write no regexes in injected code at all (`indexOf`, `split`,
   `charAt`), and to sanity-check a new probe field against a case whose answer is already known.

13. **A page that redirects to another page is not the page you measured.** The twelve
   `agent-*.html` portal pages redirect an unauthenticated visitor to `agent-login.html`, and the
   stub does not change that: `--dump-dom` returns *agent-login's* document — title "Agent Portal
   Login", `login.css` in the head, no `report-shell`, and no probe report at all, because the
   probe refuses to emit on a half-built page (trap 9). So the batch-4 "clean" readings for those
   twelve are **not reproducible and should be treated as unverified**, and the screenshots for
   them show the login gate rather than the page. Anything added to their markup — including the
   theme toggle this migration adds to every adopted page — does not survive the portal's own
   render. Verify those pages in a browser with a session, not with this harness.
14. **A pixel audit has three built-in false positives; check them before believing it.** Sweeping
   the screenshots for cool-hued pixels flagged (a) the dark-theme canvas, whose locked
   `#2C2E36`/`#2A2C36` really does sit at hue ~232°, (b) **subpixel antialiasing fringes** — 368
   saturated blue pixels against 413 saturated orange ones in one title band, a signature that is
   rendering, not styling, and (c) genuine images (`site-customize`'s uploaded favicon, casino and
   currency artwork). Confirm a cluster is chrome before calling it a defect: sample the pixels
   around it, and read the *darkest* pixel of a text run, which is the declared colour.
15. **Batch D's off-scale radii.** `login.css` had drifted to 11/18/20/22px against a locked set of
   8 / 10 / 12 / 16 / 999. Normalised: both icon tiles (34px `.auth-brand-mark` on login, 62/56px
   `.auth-icon` on agent-login) take the avatar value 12px because they are one role on sibling
   pages; `.upload-status` takes 8px like the other small surfaces; the small-screen `.auth-card`
   keeps the locked 16px instead of growing to 22px. `.auth-subtitle` also gained
   `text-wrap:balance`, which removed a single-word second line. **`login.css` is referenced by two
   pages at two different versions** (`login.html` 1.0.4 and `agent-login.html` 1.0.3) — bump both.

### Adopted so far (2026-09-15)

`main-report`, `main-settlement-report`, the `main-provider-{balance,settlement,transactions,
create,endpoints}` pages, the `main-accounting-{report,settlement,due}` pages,
`main-transaction-history`, `main-balance-{adjustment,overview}`, `main-stat-detail`, `brand-*`,
`menu-management`, `index`, `online-users`, `admin-user`, `account-lock`, `admin-login-log`,
`admin-operation-log`, `role`, `root-control`, `profile`, `ip-whitelist-security`,
`compliance-policy`, the member wallet / deposit / withdrawal and `wallet-ledger` pages,
`bulk-adjustment`, `bulk-bonus-adjustment`, `duplicate-ip`, the rebate family, the VIP family,
the payment pages, the legacy provider pages, `player-provider-session`, `bank-deposit-usage`,
the game-ranking reports, `spin2-management`, `wbet-bet-limit`, `rebate-management`,
`vip-management`, `casino-overview-report`.

Verified by sweeping every rendered element's computed colour on the page in both themes —
0 retired values, 0 cool-hue hits, 0 cool-white surfaces.

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

**Menu Management panel tabs — the selected panel was invisible (2026-09-16, user-reported).** The
MAIN / BO segmented control at the top of `menu-management.html` rendered as two identical cream
cards: measured fill `#FFF8EB`, border `1px #EADCC8`, colour `#18191C` on **the active and the
inactive tab alike**. Only the icon colour and the small count pill hinted at which panel was
selected — the raised chip that is supposed to mark it was on both.

- **Cause: `bo-ui-standard.js` classifies buttons by their label.** It added
  `.bo-ui-button`/`.bo-ui-button-secondary` to both tabs, and `bo-charcoal-primitives.css` then
  paints every `.bo-ui-button-secondary` as a cream surface button. That rule carries the same
  class count as the tab rules in `menu-management-executive.css` and the charcoal layer loads
  later, so it won every state and flattened the selection. Same family as the documented ghost
  out-ranking a primary (trap 10 in the opt-in layers).
- **Naming one bo-ui class is not enough.** `.menu-panel-tab.bo-ui-button` only *ties* with the
  primitives layer and loses on source order — which produced a half-fixed state where the fill
  went transparent but the 1px border stayed. The tabs always carry **both** classes, so the
  selectors name both (`.bo-ui-button.bo-ui-button-secondary`), which wins outright.
- **`:not(.active)` on the unselected block is load-bearing.** Without it the base also matches the
  selected tab, and being stated after the selected block it wins their shared declarations —
  measured: the selected tab's amber label came back muted in dark mode. That is DESIGN.md's
  trap-10 rule again, and it is why the base blocks are state-qualified rather than colour-only.
- **A `background-color` win is not a background win.** The state rules above still lost the fill to
  a later `.bo-ui-button-secondary` declaration that **no readable stylesheet accounts for** —
  `bootstrap.min.css` is cross-origin, so a `cssRules` sweep cannot see it and "which rule wins"
  cannot always be enumerated. Clearing `background-image` explicitly in both branches settled it.
  When a computed-colour fix does not take, clear the shorthand and the image too before assuming
  the selector lost.
- **Verification needed a real click.** A Playwright locator click on the tab timed out (the control
  was not actionable under the stub) and a coordinate click did not register, so the state was
  checked by calling the page's **own** handler — `document.getElementById('menuTabBo').click()` —
  and re-reading computed styles in a separate evaluate. Reading only the initial paint is not
  enough here: the first read races the page's own async render and reports the fill on the wrong
  tab. After a click the states track correctly in both directions, both themes.
- Result: selected = raised cream (`#FFF8EB` light / `#2A2C36` dark — the same segmented recipe as
  `.nm-status-btn` in the New/Edit Menu modal) + amber label + amber icon + amber count wash;
  unselected = transparent on the track + muted, no border. The Refresh / New Menu buttons are
  untouched. `menu-management-executive.css` 2.1.6 → 2.2.1.
- **Left alone for the owner to call:** the `2 Groups · 9 Menus` badge still wears the full amber
  accent (wash + `rgba(217,119,6,.30)` border + `#B45309` text), i.e. the same accent as the primary
  CTA, for a static read-out — it is the loudest thing in the row. That treatment comes from the
  **shared** `bo-charcoal-legacy.css` rule for `.users-found-badge` ("Count badge, ledger
  multi-select trigger…"), so demoting it on this page alone would diverge from every other page
  that shows one; it should be a repo-wide decision.

**Sidebar "lock" did not survive a page change (2026-09-16, user-reported on merchant Roles).** The
user reported that after clicking through to Roles & Permissions the sidebar would not stay locked.
The button was not broken: clicking the hamburger does toggle `body.sidebar-mini` and the rail
measures 280px → **72px** (verified). The class was simply **never persisted** — so collapsing the
sidebar and then clicking a submenu link landed you on a page with a full-width sidebar again, which
reads exactly as "the lock doesn't work".

- Fixed in `assets/js/reports.js` with `localStorage.bo_sidebar_mini`: read and applied at script
  execution (the script is at the end of the body, so the class lands before first paint and there is
  no expanded flash), written on every toggle, and re-applied when the viewport returns to desktop —
  the resize handler only ever *stripped* the class, so the state was lost for good once you dipped
  below the 992px desktop threshold.
- Verified end to end in the browser: fresh load 280 / lock 72 + pref `1` / **navigate to another
  page → still 72** / navigate back → 72 / unlock → pref `0` and 280 after the next load.
- The state is one global preference, not per-page: a user who locks the sidebar keeps it locked
  everywhere until they unlock. That is the intent (it is a personal layout preference), but it is
  worth knowing that a support report of "the sidebar is stuck as icons" is now this key, and the
  recovery is one more click on the hamburger.
- **Pin hygiene, same trap as the stylesheets:** `reports.js` was referenced by **147 pages at two
  different versions** (`1.0.25` ×141, `1.0.26` ×6). Unifying them matters more than usual here,
  because a page left on the old pin silently keeps the *unpersisted* behaviour and the bug looks
  like it only happens on some pages. All references moved to `1.0.27` in the same pass.

**Sidebar highlighted the wrong item on Merchant Roles / Security (2026-09-16, user-reported).** On
`main-merchant-roles.html` as a MAIN account, the sidebar marked **3.1 Merchants** as current while
the page was Roles & Permissions, and the Merchant flyout showed the same wrong chip.

- **Cause: an over-broad drill-down alias in `sidebarActivePage()` (`auth.js:111`).** The active L2
  item is matched by **filename** (`pageFile(sidebarActivePage()) === pageFile(m.url)`), and that
  function aliases Merchant drill-downs to `main-merchant-detail.html` so a child page keeps the
  Merchant item lit. The list included `main-merchant-roles.html`, `main-merchant-role-create.html`
  and `main-merchant-security.html` — but Roles & Permissions (3.2) and Security & Audit (3.4) have
  **their own Merchant submenu entries**, so the alias pointed the highlight at a *different* page
  than the one you were on. **The admin side already had this right** — `main-admin-security.html`
  was never aliased to `main-admin-detail.html`, and `main-admin-role-create.html` maps to
  `menu-permission.html` (its own family) rather than to the detail page. The merchant list simply
  over-included; it now matches the admin shape: the two pages keep their own entries, and
  `main-merchant-role-create.html` follows its parent (`main-merchant-roles.html`).
- **Do not "fix" this in the second alias site.** `auth.js:~254` maps the same filenames to
  `main-merchant-detail.html` for **permission** inheritance, not for highlighting — that one is
  deliberate and was left alone. Two lists, same filenames, opposite intent.
- **`main-merchant-visibility.js` is the reason these three pages exist for MAIN only.** It deletes
  the roles/security/role-create links and redirects those pages to the merchant list for
  **non-MAIN/ROOT** users, so for a delegated admin the "Merchants" highlight was correct all along —
  which is why the alias looked right when it was written. It only misfires for MAIN/ROOT, the one
  case where those pages are actually reachable.
- Verified by swapping a stubbed copy in **at the real filename** (the verify harness serves every
  page as `.tmp-v-<name>`, so no page can ever match a menu URL and the highlight is untestable
  that way) and reading the rendered nav: the active item is now `main-merchant-roles.html`. The
  original file was restored immediately after; its only diff is the version pins.
- Pins: `auth.js` was at **three** different versions (`1.0.61` ×126, `1.0.62` ×2, `1.0.63` ×8, plus
  a date-style `20260907` ×2) — unified to `1.0.64` across all 138 pages.

### Table zebra on the MAIN panel pages (2026-09-16, owner request)

"All tables on the main pages must have zebra." They did not: measured on
`main-admin-detail` / `main-merchant-detail` / `main-merchant-profit`, every body row was
`background: transparent` on one panel colour, separated only by hairlines — a wide row was hard
to follow across. Only the report family (a faint amber wash) and the transaction family
(`bo-wallet-transaction-amber.css`) had any rhythm.

- **New shared layer: `assets/css/bo-table-zebra.css`**, linked as the **last** stylesheet on the
  27 `main-*` / `main_*.html` pages that actually contain a `<table>` (12 more have none and were
  left alone). The scope is the link, not the selector — that is what keeps the blast radius at
  exactly those pages.
- **Values are the locked ones**, so every listing in the panel now stripes alike:
  light odd `#FFF8EB` / even `#FFF1DC` / hover `#FFE8CC`; dark odd `#3A3C48` / even `#434653` /
  hover `#444654`. These are the `--bo-table-*` values from
  `.interface-design/system.md` → Patterns → Data tables → Transaction listing table, re-declared
  as `--bo-zebra-*` in this layer. The report family's own faint amber wash (`rgba(217,119,6,.045)`)
  loses to this by specificity, so the family no longer has a second, different rhythm.
- **The stripe is painted on the cells, not on the `<tr>`.** A row background is covered by any
  cell that sets its own — the hover rules, `.value-positive`/`.value-negative`, the avatar tints —
  whereas painting the cells makes the stripe the base layer those sit on. It also keeps the
  `border-collapse` hairlines crisp.
- **Hover is restated inside this layer, after the stripes.** The pages' own `tr:hover td` rules sit
  at a lower specificity than the striping here, and a stripe that out-ranks the hover is how a
  table stops feeling interactive. Verified with a real mouse move: light row `#FFF1DC` → `#FFE8CC`,
  dark `#3A3C48`/`#434653` → `#444654`, both matching the locked hover token.
- **Semantic rows keep their meaning.** `.is-suspended-row` is excluded from the stripes *and* its
  cells are cleared, because its red tint is painted on the `<tr>` — clearing the cells lets it
  through (verified: cells measure transparent, the row tint still shows). `.total` is excluded but
  deliberately **not** cleared: its fill lives on the `td` (`tr.total td`), so a transparent
  override would have erased the total row. The single colspan empty-state row (`:has(> td.mad-empty)`)
  is not striped.
- Verified both themes on four pages across three families: `main-admin-detail`,
  `main-merchant-detail`, `main-merchant-profit`, `main_merchant_report` — odd/even alternate to the
  exact token values, hover intact, suspended row intact.
