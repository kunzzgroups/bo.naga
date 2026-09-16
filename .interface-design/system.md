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
| `--bo-control-well` | `#F5EBDC` | `rgba(255,255,255,.06)` / dark inputs `#2A2C36` | Control wells, tracks, chips — **no longer the input fill** (2026-09-16: inputs are `#FFF8EB`, see Forms) |
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
- **Roles / Create Role scale:** page title `28px/800` · card title `16px/800` · field label `11–11.5px/800` uppercase · body/filter `13.5px` · chips/buttons `12.5–13px/700–800` · status pill `10.5px/800` uppercase · topbar name `14px/700` · topbar role `11px` mono

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

### Transaction family (sidebar category 3 — listing)

Classic BO listing shells (`reports.css` + `bo-ui-standard.css`), **not** MAIN executive pages.

| Item | Value |
|------|-------|
| Scope | `body.bo-wallet-tx` |
| CSS | `assets/css/bo-wallet-transaction-amber.css` (load after `bo-ui-standard`) |
| Pages | `member-deposit`, `member-withdraw`, `member-wallet`, `wallet-ledger`, `bulk-adjustment`, `bank-deposit-usage`, `bulk-bonus-adjustment`, `payment-method` |
| Filter / select recipe | **Admin listing chrome** + **Role select dropdown** — surface `#FFF8EB` · border `#EADCC8` · radius `8px` · never form well `#F5EBDC` |
| Dark select selected | solid `#F59E0B` · text `#2A2C36` (same as Role select) |
| Pager | **Table footer pager** (`.mad-pager`) — light inactive slate `#F3F4F6`/`#9CA3AF`; dark charcoal inactive; amber 3D active |
| Date range | **Date range picker** pattern (preset wash, ghost head, cream panel) — see Patterns |
| Filter titles | Hidden on listing filters (placeholder + value carry meaning) |
| Deposit / Withdraw tabs | `.bo-tx-tabs` / `.bo-tx-tab` — **Status filter pills** recipe (`.mad-pill`) · order Deposit → Withdraw → All · cream thumb + green/red dots · counts `(n)` from header pending |
| Hover / focus / open | Same as Merchant Profit + Role select: border `#D97706` + `0 0 0 3px rgba(217,119,6,.14)` (dark: `#F59E0B` + `rgba(245,158,11,.18)`). Inputs, selects, date triggers — one recipe. Idle chrome must not kill the ring. |
| Table frame | **Same as Admin Detail `.mad-panel`** — viewport-locked panel · inner scroll · `table-layout:fixed` · radius `8px` · no nested `.table-wrap` border · footer pins to panel bottom |
| Table light paint | **Transaction listing table** (peach-cream zebra — no pure white) — see Patterns → Data tables |
| Table dark paint | Same zebra rhythm: odd `#3A3C48` · even `#434653` · head `#1F2128` (deeper than body) — never flat slab |
| Row Approve / Reject / Ledger | `.bo-tx-action-btn` **26×26** · icon `15px` · padding `0` · radius `6px` · light: control-well chip `#F5EBDC`/`#EADCC8` · dark: charcoal well `#2A2C36`/`white/14` · semantic icon (approve `#067647` · reject `#B42318` · ledger muted) · hover success/danger wash. Ledger uses `a.bo-tx-action-btn.is-ledger` — **not** reports `.bo-icon-action` |
| Status pills | **PENDING** orange · **APPROVED** green · **REJECTED** red — see Patterns → Data tables → Status pills |
| Filtered total bar | **Removed** on Deposit / Withdraw — do not restore `.approval-total-bar` |
| Pending metrics strip | **Removed** on Deposit / Withdraw — do not restore Pending Count / Pending Amount metrics above the table |

#### Deposit / Withdraw page chrome (locked)

Reference pages: `member-deposit.html` · `member-withdraw.html`. Same shell; Withdraw adds Remark + Ledger.

| Part | Spec |
|------|------|
| Body | `body.bo-wallet-tx.deposit-approval-page` / `.withdraw-approval-page` — keep this class; charcoal shells must **not** replace it |
| Bank capacity strip | `#depositBankCards` / `#withdrawBankCards` · `.deposit-bank-card-stats` · grid `auto-fit` / `minmax(220px,1fr)` on wide · cream card · letter mark · amount · max-amount meter |
| Toolbar | Inside `.table-card` → `.deposit-inline-filter` → `.bo-tx-toolbar`: **left** `.bo-tx-tabs.bo-seg` · **right** `.bo-tx-filter-controls` (date range + keyword + status) |
| Filter strip | **No** Reset / Search / Page Size in the filter row — page size lives in footer only (`#depositSize` / `#withdrawSize` stay hidden) |
| Columns (Deposit) | Date · Member · Amount · **Bank** (header label, not Method) · Reference · Status · Processed · Action |
| Columns (Withdraw) | Date · Member · Amount · Bank · Reference · Remark · Status · Processed · Action |
| Member cell | Username only (no nested bank line) |
| Bank cell | Bold `BankName (account)` via `formatMethodLabel` / `formatBankLabel` |
| Remark (Withdraw) | Player remark only — **no** `Admin: …` sub-line under the cell |
| DATE cell | `.bo-tx-datetime` · day + time spans · `title` = full datetime — see Responsive |

#### Deposit / Withdraw responsive (1920 → 375)

Preserve colors / hierarchy / business logic; change width, stack, and density only. CSS lives in `bo-wallet-transaction-amber.css` (Deposit + Withdraw shared). Target audit: **1920 · 1440 · 1280 · 1024 · 768 · 390 · 375**. Never page-level horizontal overflow — table scrolls inside `.bo-tx-table-body`.

| Breakpoint | Behavior |
|------------|----------|
| ≤1456 | **DATE** shows calendar day only (`.bo-tx-datetime-time{display:none}`) · hover/`title` still shows full `YYYY-MM-DD HH:mm:ss` |
| ≤1280 | Bank cards → **one-row horizontal snap strip** (do not wrap into 2–3 tall rows) · toolbar **column**: tabs row then filters row (`flex-flow: row nowrap` on filters) · table `min-width` ~980–1080 · cells `overflow:hidden` + ellipsis · `.bo-tx-table-body` scrolls x/y · table-card keeps `min-height` so ledger rows stay reachable |
| ≤1024 | Filters may wrap · hide topbar subtitle + account meta text · bank cards stay strip |
| ≤768 | Compact bank strip · hide **Processed** (Deposit col 7 / Withdraw col 8) · Withdraw also hide **Remark** (col 6) · stronger table-card / body `min-height` · approval modal `#bankApprovalPopup` full-bleed |
| ≤575 / 390 / 375 | Hide header **Members/Deposit/Withdraw** counters · hide title icon · filters stack full-width · hide **Reference** (+ Remark/Processed as above) · action hit area ≥36px · touch fields `min-height:44px` |

Head/body column sync: body `scroll` sets `.bo-tx-table-head` `scrollLeft` (Deposit + Withdraw JS).

#### Payment Method Config (locked)

Reference: `payment-method.html` · `body.bo-wallet-tx.payment-method-page`. Same Transaction listing table / pager / status pills as Deposit.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + `bo-wallet-transaction-amber.css` (not charcoal shell) |
| Panel | `.pm-list-card` = viewport-locked `.table-card` · toolbar strip · inner `.table-wrap` scroll · footer pager |
| Toolbar | Right-aligned Ghost `Bank Deposit Usage` / `Refresh` + primary amber `Create Payment Method` (no left title badge) |
| Columns | Order · Type · Display (name + subtitle) · Details · QR · Status · Action |
| QR | Amber `.bo-tx-link` **View** (never default blue) · `-` when empty |
| Status | `.status-pill.active` ACTIVE · `.status-pill.off` INACTIVE |
| Action | `.bo-tx-action-btn` **26×26** · Edit `is-edit` (amber well) · Delete `is-reject` (danger) |
| Create | Opens **full page** `payment-method-create.html?from=config` (not modal) |

#### Bank Deposit Usage (locked)

Reference: `bank-deposit-usage.html` · `body.bo-wallet-tx.bank-deposit-usage-page`. Companion to Payment Method.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS + `bank-deposit-usage.css` (not charcoal) |
| Filters | Inline inside `.bank-usage-list-card` toolbar **left** · date range + keyword only · **no Reset / Search** (change date or type to refresh · Refresh button reloads) · **filter titles hidden** |
| Summary | **Removed** — do not restore `.usage-summary-grid` metric cards |
| Panel | Viewport-locked · toolbar filters left + Ghost `Payment Method Config` / `Refresh` right · no title badge · no link underline |
| Table | Peach-cream zebra · square thead · `table-layout:fixed` · inner scroll · never page overflow |
| Status | `.status-pill.active` / `.off` (same as Payment Method) |
| Meter | Track `#F5EBDC` · fill `#B45309` · warn `#F59E0B` · over `#EF4444` |

#### Create / Edit Payment Method (locked)

Reference: `payment-method-create.html` · `body.bo-wallet-tx.payment-method-create-page`. Full-page form (not modal). **Colors match Create Admin Account** layer ladder. Inherits menu permission from Bank Deposit Usage or Payment Method Config via `?from=usage|config`.

**Layer ladder (required — same as Create Admin):**

| Layer | Hex | Notes |
|-------|-----|-------|
| Canvas | continuum `#FFE8CC`→`#FFF8EB` | Atmosphere only |
| Section card `.pmc-card` | `#FFFCF7` · border `#DCC9A8` · warm shadow · **3px amber gradient rail** | Primary frame — never flat `#FFF8EB` |
| Input / select / textarea / dropzone | `#FFF8EB` · border `#DCC9A8` · placeholder `#78716C` | Surface rung (not muddy `#F5EBDC`) |
| Section head | hairline `#EADCC8` · title `#18191C` · icon `#B45309` | |
| Labels | `#27272A` · required `*` `#B42318` | |
| Sticky footer `.pmc-sticky-footer` | `#FFFCF7` · border `#DCC9A8` · `0 -12px 32px rgba(120,80,20,.12)` | Viewport-fixed · main column only |
| Ghost Cancel / Back | `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · border `#DCC9A8` | |
| Primary Create / Save | amber 3D · check icon · white label | |

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS + `payment-method-create.css` (not charcoal shell) |
| Width | **Full main column** · no centered `max-width` column · cards span content width |
| Sections | 5 cards · Create Admin lift recipe · focus amber ring `rgba(217,119,6,.16)` |
| Grid | `.pm-grid-4` → 4 / 3 / 2 / 1 cols at 1280 / 1024 / 768 |
| Sticky footer | **Viewport-fixed** · `left: var(--sidebar-w)` · `right:0` · `bottom:0` · does **not** cover sidebar · mini → `left: var(--rail-w)` · ≤991 → `left:0` |
| Footer actions | Right-aligned Ghost `Cancel` + amber Primary · h `40px` |
| Content pad | Bottom pad ≥`96px` so last card clears the fixed bar |
| Dark | Card `#383A46` · input `#2A2C36` · footer translucent charcoal · Ghost charcoal 3D |

Do **not** flatten cards + inputs to one cream, or use recessed `#F5EBDC` wells on this page.

#### Bulk Adjustment / Bulk Bonus Adjustment (locked)

Reference: `bulk-adjustment.html` · `bulk-bonus-adjustment.html` · `body.bo-wallet-tx.bulk-adjustment-page` / `.bulk-bonus-adjustment-page`. Operation shell (not a single listing `table-card`).

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS + `bulk-member-operation.css` + `bulk-adjustment-import.css` + charcoal layers + FOUC |
| Content scroll | `.report-content` **overflow:auto** (override listing `overflow:hidden`) — panels stack vertically |
| Mode tabs | `.bulk-mode-switch` / `.bulk-mode-btn` — **Status filter pills** recipe · cream 3D active · **never** cool blue `#1f5fe7` / `#f3f6fb` |
| Panels | `.bulk-panel` / `.bulk-import-card` — surface `#FFF8EB` · border `#EADCC8` · radius `8px` · soft warm shadow |
| Inputs | listing surface `#FFF8EB` · border `#EADCC8` · height `40px` · amber focus ring · labels `11.5px/800` uppercase |
| Summary chips | surface tile + uppercase label + tabular value (KPI strip density) |
| Tables | peach-cream zebra · thead `#FFE8CC` / dark `#1F2128` · square corners · money `#B45309` / `#F59E0B` |
| Primary CTA | Search / Validate / Submit / Execute = amber Primary · Clear / Download / Export = Ghost |
| Dropzone | dashed `#EADCC8` · amber hover/drag · icon amber (not cool gray) |
| Status pills | valid/success green · warning/skipped orange · error/failed red · duplicate muted (Transaction status family) |

Theme: FOUC + `#boThemeToggle` sibling of `[data-bo-profile]` + `bo-theme.js`.

---

## Patterns

### Sidebar nav

- Opaque fill matching continuum left stop (`#FFE8CC` light · `#3A3226` dark)
- L1 text/icons light: `#6b360c` · weight `800`
- L1 active: cream chip + **left amber bar** (not the L2 frame)
- Logout: danger red, not amber

#### L1 group button — `.nav-group-btn` (locked light/dark)

| State | Light | Dark |
|-------|-------|------|
| Default text/icon | `#6b360c` · weight `800` | light text on warm charcoal sidebar |
| Hover | soft wash `rgba(255,243,224,.78)` | soft `rgba(255,255,255,.05)` |
| **Active** | cream gradient `#FFF8EF`→`#FFE8CC`→`#FFF3E0` + **3px left amber bar** `#FBBF24`→`#D97706` | amber/charcoal glow chip + **2px left amber bar** + soft amber inset |
| Logout `.bo-sidebar-logout` | text `#B42318` · danger wash hover | danger red (not amber) |
| Close / collapse `.close-side` | light chip on sidebar | charcoal chip |

L1 active uses a **left bar**, not the L2 bordered frame. Opaque sidebar fill: light `#FFE8CC` · dark `#3A3226` (continuum left stop). Token `--bo-sidebar-bg` may read `#2A2C36` in some blocks — prefer continuum left stop for paint.

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
| Default | text/icon `#6b360c` · transparent | text `rgba(255,255,255,.72)` |
| Hover | soft wash `rgba(217,119,6,.10)` · **no** amber frame | `rgba(255,255,255,.05)` · no frame |
| **Active (locked)** | cream chip + amber frame (below) | amber/charcoal chip + amber frame (below) |

**Active chip (copy exactly — Admin Detail reference)**  
Do **not** use flat `rgba(217,119,6,.12)` wash alone for active (that was the wrong Roles/Dashboard look).

| Spec | Light | Dark |
|------|-------|------|
| Background | `linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)` | `linear-gradient(180deg, rgba(245,158,11,.18), rgba(43,37,33,.92))` |
| Border | `1px solid #D97706` (`--bo-sidebar-active`) | `1px solid rgba(245,158,11,.55)` |
| Text / icon | `#6b360c` | `#FBBF24` |
| Shadow | `0 0 0 1px rgba(245,158,11,.12), 0 4px 14px rgba(217,119,6,.12)` | amber glow + inset highlight |
| `::after` rail | none (`display:none`) | none |

Shared on: Dashboard, Roles & Permissions, Administrators, Security & Audit.

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

#### Header counters — `.bo-header-counter` (Transaction / ops chrome)

Neat amber chips (Members / Deposit / Withdraw). One icon language — no purple / green / orange rainbow.

| Spec | Light | Dark |
|------|-------|------|
| Chip | `#FFFCF7` · border `#EADCC8` · height `40px` · radius `8px` · pad `4px 12px 4px 4px` | well `#2A2C36` · border `white/16` (separates from topbar `#383A46`) |
| Icon tile | `32×32` · radius `6px` · amber wash · icon `#D97706` | amber wash · icon `#FBBF24` |
| Label | `10px/700` uppercase · `#57534E` | `#D4D4D8` |
| Value | `15px/800` tabular · `#18191C` | `#F5F5F4` |
| Hover / focus | border `#D97706` + amber ring | border `#F59E0B` + amber ring |

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
| Default fill | Form Ghost: `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · Listing may use `#FFF8EB`→`#F3E8D6` | `#4A4C58`→`#383A46`→`#2C2E38` |
| Border | `#DCC9A8` (form) / `#EADCC8` (listing) | `rgba(255,255,255,.12–.14)` |
| Label | `#18191C` | `#F5F5F4` |
| Hover (Create Role Back/Cancel — locked) | reverse cream `#FFF8EB`→`#F3E8D6` · border `#E0D0B8` · lift `-1px` · **no** amber fill wash | reverse charcoal · lift · **no** amber border wash |
| Hover (listing Export) | reverse gradient · slightly stronger border | reverse · border `rgba(255,255,255,.18)` |
| Active | press `+1px` · deeper cream `#FFF1DC`→`#EADCC8` | press into `#383A46`→`#2C2E38` |

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

- Inputs: dark soft charcoal `#2A2C36` on dark; light `#FFF8EB` on light — the panel surface, read by its `#DCC9A8` border rather than by a darker fill. **Never** `#FFFFFF` chrome, and no longer the recessed `#F5EBDC` well (owner-directed 2026-09-16: "全站 main 的输入框背景 = #FFF8EB")
- Focus: amber ring (never cyan) — e.g. `0 0 0 3px rgba(217,119,6,.12)`
- **Create/Edit hierarchy:** never one flat cream — use the layer ladder below so Save CTA and sections read clearly

#### Create / Edit Admin Account — light form hierarchy

Reference: Charcoal block + `.mac-*` / `.mae-*` in `main-admin-detail-executive.css` (`main-admin-create.html`, `main-admin-edit.html`).

**Layer ladder (required):**

| Layer | Hex | Notes |
|-------|-----|-------|
| Canvas | continuum `#FFE8CC`→`#FFF8EB` | Atmosphere only |
| Section card | `#FFFCF7` · border `#DCC9A8` · warm shadow · **3px amber left rail** | Primary frame |
| Input | `#FFF8EB` · border `#DCC9A8` · placeholder `#78716C` | Editable; the border separates it from the card, not a darker fill |
| Nested well | `#F0E4D0` | Privileges / policy / security |
| Chip / status active | `#FFFCF7` | Lifted controls |
| Locked field | `#EDE4D4` · text `#57534E` | Readonly username |
| Ghost buttons | `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · border `#DCC9A8` | Secondary |
| Primary CTA | amber gradient | Focal action |

| Element | Light | Dark |
|---------|-------|------|
| Section (`.mac-section`) | `#FFFCF7` · border `#DCC9A8` · warm shadow · amber rail | `--bo-surface` |
| Inputs | `#FFF8EB` · border `#DCC9A8` · placeholder `#78716C` | `#2A2C36` |
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
| Role Name input (`.mrc-field .form-control`) | surface `#FFF8EB` · border `#EADCC8` · `14px/600` · amber focus ring | `#2A2C36` · amber focus |
| Search (`.mrc-search` / `#mrcFilter`) | surface `#FFF8EB` (= Role Name) · icon `#57534E` · placeholder `#78716C` | charcoal `#2A2C36` |
| Chips Select All / Clear | surface `#FFF8EB` · border `#EADCC8` · `13px/700` · height `34px` | charcoal well |
| Toggle All (`.mrc-chip-btn.is-accent`) | amber wash `rgba(217,119,6,.12)` · never cool cyan | `rgba(245,158,11,.16)` |
| Back / Cancel (`.mrc-btn-ghost`) | 3D Ghost `#FFFCF7`→`#F5EBDC`→`#EDE4D4` · height `40px` · `13px/700` · shared hover reverse cream | charcoal 3D + reverse hover |
| Save Role (`.mrc-btn-primary`) | 3D Primary amber · height `40px` · `13px/800` · white label (dark: text `#2A2C36`) | amber 3D |
| Role Information card (`.mrc-card`) | surface `#FFF8EB` · radius `8px` | `--bo-surface` |
| Page title | `28px/800` | same weight |
| Field label | `11.5px/800` uppercase · muted | muted |

#### Role select dropdown (Roles list — `.rounded-select-*`)

Native select hidden; enhancer builds custom control. Reference: `menu-permission-executive.css`.

| Part | Light | Dark |
|------|-------|------|
| Trigger | `#FFF8EB` · border `#EADCC8` · `40px` · `13.5px/600` · `8px` radius | `#2A2C36` |
| Open / focus | border `#D97706` · `0 0 0 3px rgba(217,119,6,.14)` | amber border + `rgba(245,158,11,.18)` ring |
| Menu | surface · border · `8px` · soft shadow · pad `6px` | surface · deep shadow |
| Option hover | `--bo-cyan-tint` · text `--bo-cyan-deep` | `rgba(245,158,11,.14)` |
| Option selected (dark) | — | fill `#F59E0B` · text `#2A2C36` |
| Scrollbar thumb | `#98A2B3` / hover `#667085` · `4px` pill · no arrows | `#F59E0B` / `#D97706` |
| Field label | `11px/800` uppercase · tracking `.08em` | same |

#### Date range picker (`.bo-range-*` / `.ref-range-*` — locked)

Two-pane popover: left presets · right calendar. Reference: Transaction / Merchant Profit listing. Kill `reports.css` cool gray/blue (`#f8fafc` / `#eef2ff` / `#5061f5`).

| Part | Light | Dark |
|------|-------|------|
| Panel | bg `#FFF8EB` · border `#EADCC8` · radius **`12px`** · warm shadow `0 18px 40px rgba(92,74,48,.16)` | bg `#383A46` · border white/14 · deep shadow |
| Preset rail | **same** cream as panel (not darker sand) · hairline `#EADCC8` | same surface · hairline white/10 |
| Preset idle | text `#18191C` · `13px/700` · transparent | `#F5F5F4` |
| Preset hover | wash `rgba(217,119,6,.10)` · text `#B45309` | wash `rgba(245,158,11,.14)` · `#FBBF24` |
| **Preset active** | wash `#FFF1DC` · text `#B45309` · **never** solid amber + white | wash `rgba(245,158,11,.16)` · `#FBBF24` · never solid fill |
| Head (month/year/arrows) | **ghost** — transparent · no border · charcoal `#18191C` / `700` | transparent · `#F5F5F4` |
| Head hover | wash `rgba(217,119,6,.10)` · `#B45309` · no focus ring | wash · `#FBBF24` |
| Week labels | `#78716C` · `11px/700` | `#A8A29E` |
| Day idle | `#18191C` · `700` · radius `8px` | `#F5F5F4` |
| Day muted (other month) | `#C4B5A0` | `#78716C` |
| Day hover | same as preset hover | same as preset hover |
| Day start / end | solid `#D97706` · text `#fff` (calendar selection) | solid `#F59E0B` · text `#2A2C36` |
| Day in-range | `rgba(217,119,6,.12)` · text `#B45309` | `rgba(245,158,11,.18)` · `#FBBF24` |
| Month / year grid active | same as **preset active** (wash, not solid) | same |

**Do not** paint preset `.active` like Primary CTA. Solid amber is reserved for calendar day endpoints (and Role select dark selected option).

#### Roles toolbar / footer extras

| Element | Spec |
|---------|------|
| Filter `.mp-search` | height `42px` · surface `#FFF8EB` · icon `#57534E` · placeholder `#78716C` |
| Tool chips `.mp-tool-btn` | `12px/700` · height `32px` · surface; `.is-accent` = amber wash |
| Add Role | Primary CTA 3D (Buttons spec) · `12.5px/700` |
| Delete Role | danger wash · border `rgba(239,51,64,.28)` · text `#B42318` · height `42px` |
| Save / Cancel footer | Primary + Ghost 3D · `12.5px` · height `38–40px` |
| Assigned pill | success wash · green dot |

### Data tables (Admin Management — locked contrast)

Reference: `main-admin-detail.html` / `main-admin-security.html` + Charcoal block in `main-admin-detail-executive.css` (`.mad-panel` / `.mad-table` / `.mad-table-wrap`).

**Rule:** Scope light cream borders under `html:not([data-bo-theme="dark"])` so they never leak into dark. Dark must set full `border` / `border-bottom` (not only `border-*-color`), or cream edges “跑掉.”

**Fixed frame (locked — Admin Detail):** Listing tables use a viewport-locked panel, not a page that grows with rows.

| Spec | Value |
|------|-------|
| Shell | `.report-main` = `100dvh` flex column · `overflow:hidden` |
| Panel | `.mad-panel` / Transaction `.table-card` = `flex:1` · `min-height:0` · `overflow:hidden` · radius **`8px`** · single outer border |
| Scroll | `.mad-table-wrap` / `.table-wrap` = `flex:1` · `overflow-y:auto` · **no** nested border/radius |
| Table | `table-layout:fixed` · `width:100%` · `border-collapse:collapse` |
| Header | sticky top inside wrap · surface bg · bottom hairline |
| Footer | pager / total bar `flex:0` · top hairline · pins to panel bottom (`margin-top:auto`) |

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
| Filter bar / footer edge | cream border `#EADCC8` | `rgba(255,255,255,.14)` |
| Footer bar (`.mad-footer`) | bg surface `#FFF8EB` · top border cream | bg `#383A46` · top border white/14 |
| Footer info text | `#57534E` · `12.5px/600` | `#D4D4D8` / muted |
| Search / form placeholder | `#78716C` on cream wells | `#A1A1AA` |
| Modal close (`.modal-clean-close`) | `#F5EBDC` · border `#EADCC8` · icon `#57534E` | charcoal well · light icon |

#### Table footer pager (`.mad-pager` — locked light/dark)

Reference: Charcoal block in `main-admin-detail-executive.css` (+ merchant twin). Classes: `.mad-pager .smart-page` / `button`. Metrics: min-width `40px` · height `36px` · radius `8px` · `13px/700`.

| State | Light | Dark |
|-------|-------|------|
| Default (inactive page) | bg `#F3F4F6` · text `#9CA3AF` · no border | bg `#383A46` · border `rgba(255,255,255,.12)` · text `#A1A1AA` |
| Hover (not active) | bg `#E5E7EB` · text `#374151` | bg `#444654` · border white/18 · text `#E7E5E4` |
| Active (current page) | amber 3D `#FBBF24`→`#F59E0B`→`#D97706` · border `#D97706` · text `#fff` · soft amber lift + inset | same amber 3D · border `#F59E0B` · text `#2A2C36` · stronger amber glow |
| Disabled | muted grey (opacity kept readable) | bg `#2A2C36` · border white/06 · text `#52525B` |
| Ellipsis | muted / placeholder | muted |

Light inactive stays cool slate (not cream) so the amber active page reads as the only warm signal in the pager row. Dark inactive is charcoal surface — never cream. Do not use navy/cyan for active.

Do **not** use dark header `#71717A` or row borders `rgba(255,255,255,.06–.08)` — fails contrast on `#383A46`.

#### Transaction listing table — light + dark (locked)

Reference: Deposit / Withdraw (`body.bo-wallet-tx`) + `bo-wallet-transaction-amber.css` tokens `--bo-table-*`. **Both themes locked.** Same rhythm: **odd / even zebra** (never flat slab). Light: peach-cream family — **never pure white**. Dark: charcoal zebra + **deep thead** — never all `#383A46`, never lifted head `#40424E`.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--bo-table-paper` | `#FFF8EB` | `#383A46` | Panel / wrap / table canvas |
| `--bo-table-head` | `#FFE8CC` | `#1F2128` | Sticky thead — dark is **deeper** than body (not a lift) |
| `--bo-table-row` | `#FFF8EB` | `#3A3C48` | Odd rows |
| `--bo-table-row-alt` | `#FFF1DC` | `#434653` | Even rows (locked) |
| `--bo-table-hover` | `#FFE8CC` | `#444654` | Row hover |
| `--bo-table-line` | `#EADCC8` | `rgba(255,255,255,.12)` | Hairlines · cell borders |
| `--bo-table-chip` | `#F5EBDC` | `#2A2C36` | Action button wells |

| Spec | Light | Dark |
|------|-------|------|
| Thead | bg `#FFE8CC` · text `#6b360c` · `11px` / **`bold` (700)** · uppercase · tracking `.04em` · sticky | bg `#1F2128` · text `#E7E5E4` · same metrics |
| Thead corners | **`border-radius: 0`** on first/last `th` (kill `reports.css` `11px` top radii) | same |
| Body cell | text `#18191C` · `13px` / **`bold` (700)** — pin `font-weight: bold` (never UA `bolder`) | text `#F5F5F4` · same weight |
| Cell padding | `10px 12px` · first/last column `16px` inset | same |
| Vertical rules | soft `rgba(107,54,12,.06–.08)` · last column no right border | `rgba(255,255,255,.06)` |
| Action `.bo-tx-action-btn` | well `#F5EBDC` · border `#EADCC8` · approve `#067647` · reject `#B42318` | well `#2A2C36` · border white/14 · approve `#6EE7B7` · reject `#F87171` |
| Filter strip inside `.table-card` | bg row cream · bottom hairline `#EADCC8` | bg row charcoal · white/12 hairline |
| Footer pager strip | bg `#FFF8EB` · top hairline `#EADCC8` | bg `#383A46` · white/12 |
| Do **not** | muddy yellow parchment · pure white zebra · Filtered Total Amount bar | flat single-tone rows · lifted thead `#40424E` · cool gray/blue zebra |

#### Status pills (Transaction listing)

Bare `.status-pill` = PENDING · `.active` = APPROVED · `.off` = REJECTED.

| State | Light | Dark |
|-------|-------|------|
| PENDING | bg `#FFEDD5` · text `#EA580C` · border orange/35 | bg amber/20 · text `#FBBF24` · border amber/35 |
| APPROVED `.active` | bg `#DCFCE7` · text `#166534` | bg success/18 · text `#6EE7B7` |
| REJECTED `.off` | bg `#FEE2E2` · text `#B91C1C` | bg danger/18 · text `#F87171` |

### Date / time tips

| Spec | Light | Dark |
|------|-------|------|
| Chart tip `.trend-tip` | bg `#FFF8EB` · text `#6b360c` · border amber/28 · radius **`8px`** | bg `#40424E` · text `#F5F5F4` · border amber/35 · **`8px`** |
| Icon / float tip `[data-tip]` / `.mad-float-tip` | same cream / charcoal colors · may use **pill** radius `999px` | same |
| Never | navy `#0F1F33` tip | navy tip |

### Admin listing chrome (filters / tabs / row chrome — locked light/dark)

Reference: Charcoal block `main-admin-detail-executive.css` (`data-access-page="main_admin_detail|main_admin_security"`). Merchant twin: `main-merchant-detail-executive.css`.

#### Tabs — `.mad-tab`

| State | Light | Dark |
|-------|-------|------|
| Default | muted text | muted / secondary |
| Active / current | text `#18191C` · **amber underline** `#D97706` | text `#F4F4F5` · underline `#F59E0B` (amber bar only — label stays neutral, not `#FBBF24`) |
| Hover | slightly stronger text | slightly stronger text |

#### Filter bar — `.mad-filter-bar` / `.mad-search` / filter selects

| Part | Light | Dark |
|------|-------|------|
| Bar | surface `#FFF8EB` · bottom border `#EADCC8` | surface `#383A46` · bottom `rgba(255,255,255,.14)` |
| Search frame `.mad-search` | surface · border `#EADCC8` · icon `#57534E` · input transparent/cream · placeholder `#78716C` | charcoal well · muted icon · placeholder `#A1A1AA` |
| Filter select / rounded trigger | cream surface · amber focus ring | `#2A2C36` · amber focus |
| Reset / secondary action | height `42px` · Ghost/surface | charcoal Ghost |
| Bulk delete | `#FEF3F2` / border danger/35 / text `#B42318` | danger wash / `#FF8A90` |

#### Status filter pills — `.mad-pill` / `.bo-seg-thumb`

| State | Light | Dark |
|-------|-------|------|
| Track | transparent · gap `6px` | same |
| Thumb / active pill | cream 3D `#FFF8EB`→`#F3E8D6` · radius `8px` · height `36px` | charcoal 3D thumb |
| Active dots (Active/Suspend) | green `#059669` / red `#DC2626` | neon green / red on dark |
| Inactive | muted text | muted `#A1A1AA` |

#### Row chrome — avatar / status / role / money

| Part | Light | Dark |
|------|-------|------|
| Admin `.mad-avatar` | cool indigo tile `#EEF2FF`/`#3730A3` · **self** amber `#FEF3C7`/`#B45309` | charcoal `#383A46`/`#A1A1AA` · self amber tint |
| Merchant `.mad-avatar` | **neutral** `#F5EBDC`/`#6b360c` · suspended red only | `#2A2C36`/`#E7E5E4` · suspended red wash |
| Status active | `#D1FAE5` / `#047857` | green wash / bright green |
| Status suspended | `#FEE2E2` / `#B91C1C` | red wash / `#FCA5A5` |
| Role pills (Admin) | semantic pastels (super purple, risk red, …) | semantic dark washes |
| Money + | `#B45309` | `#F59E0B` |
| Money 0 | `#71717A` | `#A1A1AA` |
| `.mad-you` self badge | `#FEF3C7` / `#B45309` | amber wash / `#F59E0B` |

### Modals (locked light/dark)

| Part | Light | Dark |
|------|-------|------|
| Scrim | `rgba(15,23,42,.55)` (neutral backdrop — both modes) | same |
| Panel `.mad-modal-panel` / `.modal-clean-panel` | cream / surface · warm border | `#383A46` · `rgba(255,255,255,.10)` |
| z-index | `30000` (above sidebar) | same |
| Close `.modal-clean-close` | well `#F5EBDC` · border `#EADCC8` · icon `#57534E` | charcoal well · light icon |
| Fields | control well `#F5EBDC` · placeholder `#78716C` · amber focus | `#2A2C36` · `#A1A1AA` · amber focus |
| Footer actions | Ghost + Primary 3D (Buttons spec) · height `40px` | charcoal Ghost + amber Primary (dark text `#2A2C36`) |
| Adjust-credit summary well | nested cream | `#2A2C36` |

Mount modals under `body`, not inside `main`.

### Permission matrix (Roles & Permissions — locked)

Reference: `menu-permission.html` + `assets/css/menu-permission-executive.css` (also `main-merchant-roles`, `main-*-role-create`). Classes: `.mp-group` / `.mp-group-head` / `.mp-group-body` / `.mp-menu-card`.

**Principle**

| Mode | Panel surfaces | Amber role |
|------|----------------|------------|
| Light | Cream / amber **wash** on open group + selected cards | Borders, icons, accents, CTA |
| Dark | Cool **charcoal** only — no full-panel amber/brown wash | Borders, icons, counts, checked/current tint only |

Never paint dark matrix groups with cream gradients or muddy amber fills; that reads brown and muddy.

#### Control card / toolbar — `.mp-control-card` / `.mp-toolbar`

| Part | Light | Dark |
|------|-------|------|
| Control card | surface `#FFF8EB` · border `#EADCC8` · radius `8px` · pad `18px` | `--bo-surface` · white/10 border |
| Role label | `11px/800` uppercase · `#18191C` | light text |
| Role select | see Role select dropdown | see Role select |
| Delete Role | danger wash · border `rgba(239,51,64,.28)` · text `#B42318` · h `42px` | danger wash · `#FF8A90` |
| Scope track `.mp-scope` | cream well · border `#EADCC8` | `rgba(255,255,255,.06)` |
| Scope btn active | amber wash + amber icon | amber tint + `#F59E0B` icon |
| Tool chips `.mp-tool-btn` | surface · h `32px` · `12px/700` | charcoal · muted |
| Tool `.is-accent` | amber wash | amber wash |
| Add Role | Primary CTA 3D · `12.5px/700` | Primary dark (text `#2A2C36`) |
| Filter `.mp-search` | surface `#FFF8EB` · h `42px` · icon `#57534E` · placeholder `#78716C` | `#2A2C36` · `#A1A1AA` |

#### Open group — `.mp-group.is-open`

| Spec | Light | Dark |
|------|-------|------|
| Group bg | `#FFFCF7` | `#383A46` |
| Border | `rgba(217,119,6,.45)` + soft amber ring | Default `rgba(255,255,255,.10)` · open `rgba(245,158,11,.28)` |
| Shadow | soft lift | none |
| Head | gradient `#FFF8EB` → `#FFF1DC` · bottom border `rgba(217,119,6,.22)` | `#40424E` · bottom `rgba(245,158,11,.22)` |
| Body | `#FFFCF7` | `#2C2E38` |
| Icon chip | surface + border `rgba(217,119,6,.35)` · icon `#D97706` | `#2A2C36` + border `rgba(245,158,11,.35)` · icon `#F59E0B` |
| Count pill | meta / amber | `rgba(245,158,11,.16)` / `#FBBF24` |

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
| Badges `.mp-menu-badge` | current amber fill/white · super cream/`#B45309` · neutral `#F4F4F5`/`#52525B` | prefer amber/charcoal variants — no cool blue |

#### Sticky footer — `.mp-footer` (list Save/Cancel)

| Part | Light | Dark |
|------|-------|------|
| Bar | surface · top border · soft up-shadow | charcoal surface · white/10 |
| Meta / role name | muted · strong `#18191C` | muted · strong `#F5F5F4` |
| Dirty hint | `--bo-cyan-deep` amber | amber bright |
| Cancel `.mp-btn-ghost` | cream 3D Ghost · h `38px` · reverse-cream hover | charcoal 3D Ghost |
| Save `.mp-btn-save` | amber 3D Primary · h `38px` · white label | amber 3D · text `#2A2C36` |

#### Create Role sticky footer / page chrome — `.mrc-*`

| Part | Light | Dark |
|------|-------|------|
| Page title | `28px/800` | same |
| Card `.mrc-card` | surface `#FFF8EB` · radius **`8px`** (tighter than listing `16px`) | `--bo-surface` |
| Card icon tile | amber tint / charcoal | amber tint |
| Sticky footer `.mrc-sticky-footer` | surface · top border · warm up-shadow | charcoal · white/10 |
| Footer icon | amber tint `40px` tile | amber wash |
| Status `.mrc-ready` | well `#F5EBDC` · `10.5px/800` uppercase | charcoal well |
| Status `.is-ready` | green `#ECFDF3` / `#027A48` | green wash |
| Back / Cancel / Save | Ghost + Primary 3D · h `40px` (Buttons + Create Role specs) | charcoal Ghost + amber Primary |

### Coverage checklist (every slot · Light | Dark)

Use this when reviewing a page. Each row must exist as a Light|Dark table (or token) above — if CSS ships it and this list has no home, update MD before shipping.

| Zone | Must document |
|------|----------------|
| Shell | continuum, sidebar fill, L1/L2, logout, flyout |
| Topbar | surface, theme btn, user name/avatar, hamb, page title icon |
| Tabs | default / active underline |
| Filters | bar, search, selects, reset, bulk delete, status pills |
| Cards / frames | listing panel, form section lift, Roles control card, Create Role card, Create Payment Method cards |
| Sticky footers | Roles / Create Role / Create Payment Method (`.pmc-sticky-footer`) |
| Fields | listing surface inputs vs form wells, placeholders, focus rings, locked |
| Date range picker | cream panel, preset wash active, ghost head, day endpoints solid |
| Buttons | Primary, Ghost (+ shared hover), secondary, danger, pager, chips |
| Table | panel, header, cells, dividers, hover, money, status, avatar, footer, pager |
| Transaction table (locked L|D) | `--bo-table-*` zebra · deep dark head `#1F2128` · square thead · bold cells · PENDING orange · action wells · no Filtered Total |
| Modals | scrim, panel, close, fields, footer actions |
| KPI strip | tile, label, value, note, grid (Report family — see below) |
| Roles | control card, select, scope, toolbar, matrix group/card, badges, sticky footer |
| Create Role | title, cards, inputs, chips, ghost/primary, sticky footer status |
| Create Payment Method | full-page form, wells, sticky footer Cancel + Create/Save |

### Report family KPI strip (`.report-summary-grid`, `.mre-history-kpis`)

One recipe serves both strips — the brand / balance summary grid and the provider report's transaction-history KPIs. Tiles are `.report-summary-card` / `.settlement-summary-card`.

| Part | Light | Dark |
|------|-------|------|
| Tile | `#FFF8EB` · `1px solid #EADCC8` · radius `14px` · pad `16px` · `--bo-shadow` | `#383A46` · `1px solid rgba(255,255,255,.14)` |
| Label (`small`) | `11.5px/800` uppercase `.06em` · `#57534E` | `#D4D4D8` |
| Value (`strong`) | `22px/800` · `-.02em` · tabular-nums · `#18191C` | `#F5F5F4` |
| Note (`span`) | `11px/600` · `#57534E` | `#D4D4D8` |

Grid `repeat(5,minmax(0,1fr))`, gap `12px`. **No per-tile accent rail and no icon chip** — a read-out strip keeps amber on interaction, matching the merchant KPI chips (`.mpr-mini`, `.mas-kpi`). CSS: `main-report-charcoal-content.css`; the rest of the Report family is documented in `DESIGN.md` → Report family — migrated 2026-09-15.


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
| Create Role Ghost hover = reverse cream (shared Back/Cancel); no amber fill wash | User: Back vs Cancel hover must match; yellow wash felt wrong | 2026-09-15 |
| Role select dropdown (rounded-select) documented | Options/scrollbar/focus were shipped in CSS but missing from MD | 2026-09-15 |
| `--bo-control-well` light = `#F5EBDC` (not `#F0EFEA`) | Align token table with locked cream well | 2026-09-15 |
| Table footer pager light/dark states documented | CSS already split; MD only had footer edge/info before | 2026-09-15 |
| Full chrome inventory: tabs, filters, pills, row chrome, modals, Roles toolbar/footer, Create Role footer — all Light\|Dark | User: every slot/frame/button must be classified light vs dark in MD | 2026-09-15 |
| Transaction listing filters = surface `#FFF8EB` (not form well `#F5EBDC`); dark selected option = solid amber | Align `bo-wallet-tx` to renewed listing / Role select MD | 2026-09-15 |
| Light surfaces = cream `#FFF8EB` locked (no ivory / no pure white) | User confirmed Dashboard light main pane (topbar + canvas + cards) 2026-09-14 | 2026-09-14 |
| Dark table: stronger borders + lighter text | User: dark Admin table borders “跑掉”; headers/cells too close to charcoal bg | 2026-09-14 |
| L2 flyout active = cream chip + amber frame | User: Roles flat wash wrong; Admin Detail bordered chip correct — unify all pages | 2026-09-14 |
| Merchant Detail migrated to Charcoal + Amber (new `assets/css/main-merchant-detail-executive.css`, scoped to `.main-admin-detail-page.main-merchant-detail-page`, loads after the shared file) | Page still ran retired navy; matches Admin Detail reference. Scope by page class, not `data-access-page` — 8 pages share `main_merchant_detail` | 2026-09-15 |
| Merchant family runs the Charcoal block: scope widened to `body.main-admin-detail-page[data-access-page="main_merchant_detail"]`; `main-merchant-create.html` migrated | One block serves the whole family (detail/create/security/profit/profit-record/repayments/settlement); roles pages share the attribute but load a different stylesheet, so they stay untouched | 2026-09-15 |
| Merchant row avatar = neutral tile `#F5EBDC` / `#2A2C36`; every-third-row tint deleted; colour only on suspended rows; initials from the company name | User approved. The tint encoded row position, not data, and the indigo tile repeated the code printed beside it. Admin Detail keeps the old vocabulary | 2026-09-15 |
| Date range picker: preset active = amber wash + amber text; ghost head; cream panel `12px` | User locked to listing reference (not solid amber preset / not filled well head) | 2026-09-15 |
| Transaction table frame = Admin Detail mad-panel (viewport-locked, inner scroll, table-layout fixed) | User: Deposit table 框 must match main-admin-detail fixed frame | 2026-09-15 |
| Transaction table light paint = peach-cream zebra (`#FFF8EB`/`#FFF1DC`/`#FFE8CC` head) · no pure white · thead corners square · cell weight `bold` · PENDING orange | User: white rows刺眼; muddy parchment 违和; then locked cream family | 2026-09-15 |
| Transaction table dark = zebra `#3A3C48`/`#434653` · deep head `#1F2128` · status pills · action wells locked to MD | User: dark even row → `#434653`; was `#252730` | 2026-09-15 |
| Deposit/Withdraw Filtered Total Amount bar removed | User: 这个部分我不要 | 2026-09-15 |
| Deposit/Withdraw page chrome locked: bank cards strip · tabs left + inline filters right · Bank `Name (account)` · no Reset/Search in filter · action 26×26 · no Pending metrics | User aligned Withdraw to Deposit shell | 2026-09-16 |
| Deposit/Withdraw responsive 1920→375: bank strip · stacked toolbar · scrollable table · ≤1456 DATE day-only + hover time · hide secondary columns on tablet/phone | User: mid widths messy / table too short / DATE ellipsis | 2026-09-16 |
| Withdraw Remark cell = player text only (no `Admin:` sub-line) | User: 这个也帮我移除 | 2026-09-16 |
| Bulk Adjustment / Bulk Bonus migrated to `bo-wallet-tx` · mode tabs = Status filter pills (no cool blue) · peach-cream zebra · listing inputs · Full Light\|Dark in page CSS | User: 根据 MD 调整 Bulk Adjustment | 2026-09-16 |

### Opt-in layers for pages outside the migrated families

Family-by-family migration (each family with its own rescoped copy of the charcoal block) covers
the pages documented in `DESIGN.md`. Every other page migrates through a `bo-charcoal` marker
class on `<body>` plus three shared layers loaded last:

| Layer | Owns |
|-------|------|
| `bo-charcoal-shell.css` | Shell chrome + the `.mad-*` vocabulary (mechanical rescope of the merchant family block) |
| `bo-charcoal-legacy.css` | The `reports.css` / "standard" vocabularies: listing cards, `.report-table`, `.metric`, `.clean-btn`, `.standard-*`, pagers, `.user-toolbar`, the permission matrix, the `.main-mod-*` / `.settlement-*` deltas, plus the **Bootstrap table variables** and the two-ID guard that out-ranks `bo-ui-standard.css`'s filter-row authority layer |
| `bo-charcoal-primitives.css` | Components with no owner: `.bo-ui-button*`, `.mad-btn*`, Bootstrap and custom modal families, `.rounded-select-*`, `.bo-seg-thumb`, tips, the date-range picker, a toast primitive, switches, checkboxes, uploads |

Nothing repaints until a page carries the marker, so a shared layer's blast radius is exactly the
pages that opted in. A page that opts in must also ship the locked topbar chrome — most of them had
no theme toggle at all, so dark mode was unreachable there.

Two consequences worth keeping in mind when reviewing a page:

- **Scope selectors are load-bearing.** A migrated page showing legacy chrome usually means its
  scope selector is wrong or malformed, not that a rule is missing — a single missing comma in a
  family `:is()` list made 1307 rules inert.
- **A cool-hued value is always a defect**, in both modes: the locked palette has no cool hue. That
  makes an audit mechanical — sweep every rendered element's computed colour — and it also makes a
  *mechanical* retint correct, which is how the page-scoped sheets were migrated. Compare rendered
  colours, never selector text: Bootstrap's table cells, ID-scoped legacy rules and anything the
  family blocks never re-declared are all invisible to a grep.

## Agent rules

1. Always read `DESIGN.md` and this file before UI work on this repo.
2. Never substitute another palette “for taste.” Never restore Deep Navy Cyan.
3. `frontend-design` may refine typography, hierarchy, and micro-detail — **not** brand hex values, topbar chrome, or locked button gradients.
4. When adding CSS tokens, prefer `--bo-*` names; map accents through amber (`--bo-cyan` = amber).
5. Offer to update this file when a pattern is reused 2+ times with stable measurements.
6. New pages must follow Charcoal + Amber; migrate legacy navy/cyan pages toward these tokens when touched.
7. **Unify chrome:** every page’s Theme toggle, User Name block, Primary CTA, and Ghost/Export must match the Topbar + Buttons specs above — do not freestyle.
8. **Dark mode must beat legacy CSS:** `reports.css` still has `.report-body{background:#f5f7fb!important}`. Page CSS must override body/html/canvas with equal-or-higher specificity + `!important`, or white frames will leak around dark cards. Never assume MD tokens alone paint the canvas.
9. **Permission matrix dual wash:** light = cream/amber group wash; dark = cool charcoal surfaces only (amber accents, never muddy amber panel fill). Copy from Patterns → Permission matrix.
10. **No pure white in light chrome:** canvas end, topbar, and panels use cream `#FFF8EB` (continuum → `#FFF6E8` → `#FFF8EB`). Keep `#FFFFFF` only for text-on-amber (`--bo-accent-on`). Do not settle for near-white ivory (`#FFFCF8`) on Dashboard main pane.
11. **Dark data tables:** outer/row borders ≥ `rgba(255,255,255,.12–.14)`; header text `#E7E5E4`; cells `#F5F5F4`; muted/time `#D4D4D8`. **Transaction listing** (`body.bo-wallet-tx`): zebra odd `#3A3C48` / even `#434653` · thead `#1F2128` (deeper than body — never lifted `#40424E`). Scope light cream table CSS with `html:not([data-bo-theme="dark"])`. Copy from Patterns → Data tables → Transaction listing table.
12. **Sidebar L2 active:** cream gradient `#FFFBEB`→`#FEF3C7` + `1px` amber border `#D97706` (dark: amber-tinted chip + `rgba(245,158,11,.55)` border). Never flat amber wash only. Beat `reports.css` flyout `#fff`. Copy from Patterns → Sidebar nav.
13. **Every new chrome needs Light|Dark:** before shipping a frame/button/slot, add or update a two-column table in this file (see Coverage checklist). Do not leave “dark inherits” undocumented.
