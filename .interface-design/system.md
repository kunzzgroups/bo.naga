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
| `--bo-control-well` | `#F5EBDC` | `rgba(255,255,255,.06)` / dark inputs `#2A2C36` | Input wells (cream — never `#F0EFEA` / `#fff`) |
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
4. Amber 2px edge rail on sidebar right edge (light `::before` · dark `::after`; dark also paints a faint grid on `::before`).
5. L1 nav labels: `font-weight: 800`. Light L1 color: `#6b360c`. Dark L1 default `rgba(255,255,255,.86)`.
6. Shell source: `assets/css/bo-charcoal-shell.css` — page CSS must not repaint sidebar fill/L1/L2/flyout.

### Tips / money / chrome

| Element | Light | Dark |
|---------|-------|------|
| Hover tip bg | `#FFF8EB` | `#40424E` |
| Hover tip text | `#6b360c` | `#F5F5F4` |
| Hover tip border | `rgba(217,119,6,.28)` | `rgba(245,158,11,.35)` |
| Tip radius | Chart `.trend-tip` **`8px`** · datetime / float / icon tips **`999px` pill** | same |
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
| Datetime / float / icon tip (`.mad-float-tip` · `.wl-time-tip` · Last Login) | `999px` pill |

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
| Filter / select recipe | **Listing filter controls (locked)** — height **`36px`** · radius **`8px`** · gap **`10px`** · surface `#FFF8EB` · border `#EADCC8` · never form well `#F5EBDC` · Type multi = Role select option chrome |
| Dark select selected | solid `#F59E0B` · text `#2A2C36` (same as Role select) |
| Pager | **Table footer pager** (`.mad-pager` / `.page-btn`) — layout: left `Show N` · **center** `Showing…` · right First/Prev/pages/Next/Last · light inactive slate `#F3F4F6`/`#9CA3AF`; dark charcoal inactive; amber 3D active |
| Date range | **Date range picker** pattern (preset wash, ghost head, cream panel) — listing trigger height **`36px`** · width ~`240px` — see Patterns |
| Filter titles | Hidden on listing filters (placeholder + value carry meaning) |
| Filter Page Size | **Not** in the filter row — footer `Show N entries` only (Deposit / Withdraw / Wallet Ledger / Member Wallet / Rebate Management). Options **`-` · `10` · `20` · `50` · `100` · `All`**. **Default selected = `-`** (never pre-select `20`). Chrome = **Role select** recipe: trigger surface `#FFF8EB` / border `#EADCC8` / **`36px`** · menu open upward · options amber wash hover · dark selected solid `#F59E0B`/`#2A2C36` — never form well `#F5EBDC`. `-` = auto-fit / default rows · `All` = 10000 |
| Deposit / Withdraw tabs | `.bo-tx-tabs` / `.bo-tx-tab` — **Status filter pills** recipe · order Deposit → Withdraw → All · cream **capsule** thumb (`999px`) + muted idle dots · green/red only when selected · counts `(n)` · requires `bo-seg-bounce` |
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
| Filter controls | **Listing filter controls (locked)** — height **`36px`** · gap **`10px`** · radius **`8px`** · date **`240px`** · keyword **`140px`** · status **`150px`** · surface `#FFF8EB` / `#EADCC8` (same as Wallet Ledger specimen) |
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
| Modal | Form wells `#F5EBDC` · focus amber ring · full-bleed ≤768 |

#### Bank Deposit Usage (locked)

Reference: `bank-deposit-usage.html` · `body.bo-wallet-tx.bank-deposit-usage-page`. Companion to Payment Method.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS + `bank-deposit-usage.css` (not charcoal) |
| Filters | Inline toolbar · **left** `.bo-tx-tabs.bo-seg` **Active → Suspend → All** — locked **Status filter pills** specimen (cream capsule thumb · muted idle dots · green/red only when selected · All has no dot · counts `(n)` · `bo-seg-bounce`) · **right** date range + keyword + `Create` + `Refresh` · **no** Payment Method Config · **no** Reset / Search |
| Summary | **Removed** — do not restore `.usage-summary-grid` metric cards |
| Panel | Viewport-locked · tabs left + filters/actions right · no title badge · no link underline |
| Table | Peach-cream zebra · square thead · `table-layout:fixed` · inner scroll · never page overflow |
| Status | `.status-pill.active` **Active** · `.status-pill.off` **Suspend** · click to toggle |
| Action | `.bo-tx-action-btn` **26×26** · **View** `is-view` (eye · QR open in new tab · disabled when no QR) · Edit `is-edit` · Delete `is-reject` |
| Pager | Footer `.bo-usage-pager-host` · `.smart-pagination` / `.smart-page` (mad-pager amber active) · client page size **10** |
| Meter | Track `#F5EBDC` · fill `#B45309` · warn `#F59E0B` · over `#EF4444` |

Theme: FOUC + `#boThemeToggle` sibling of `[data-bo-profile]` + `bo-theme.js`.

#### Bulk Adjustment / Bulk Bonus (locked)

Reference: `bulk-adjustment.html` · `bulk-bonus-adjustment.html` · `body.bo-wallet-tx.bulk-adjustment-page` / `.bulk-bonus-adjustment-page` · `bulk-member-operation.css`.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS + `bulk-member-operation.css` (not charcoal) |
| Mode tabs | Manual Selection · Excel / XLSX Upload — family segment chrome |
| Manual split | `.bulk-operation-layout` — **Select Members `60%`** (`3fr`) · **Configure `40%`** (`2fr` · min `280px`) · stacks to `1fr` on narrow |
| Search | `.mad-search.bulk-member-search` — listing surface recipe |
| Panel scrollbars | **Panel pill scrollbar** on `.member-picker-list` **and** `.selected-table tbody` · light chocolate `#8B6B4A` / hover `#5C4A30` · dark `#F59E0B` / hover `#D97706` · **`6px`** · no arrows |

#### Panel pill scrollbar (Bulk · Wallet Ledger)

Thin pill · **no** end arrows. Webkit only — **do not** set `scrollbar-width` / `scrollbar-color` to a coloured pair (Chromium then paints OS arrows and ignores `::-webkit-scrollbar`). Firefox: `@supports not selector(::-webkit-scrollbar)` with `scrollbar-width:thin` + matching `scrollbar-color`.

Applies to:
- Bulk `.member-picker-list` · `.selected-table tbody`
- Wallet Ledger `.table-card > .table-wrap` (horizontal) · `#ledgerTypeOptions` (type menu)
- Member Wallet Provider Detail modal `#providerWalletDetailModal .table-wrap` (vertical)

| Part | Light | Dark |
|------|-------|------|
| Width / height | **`6px`** | **`6px`** |
| Thumb | chocolate `#8B6B4A` | `#F59E0B` |
| Thumb hover | deep chocolate `#5C4A30` | `#D97706` |
| Track / buttons | transparent · `::-webkit-scrollbar-button{display:none;height:0}` | same |

**Do not** use cool slate `#98A2B3` / `#667085` on these cream panels — light must read warm chocolate. **Do not** use zinc `#71717A` / `#A1A1AA` for dark. Role select menus keep their own slate light thumb (see Role select). Listing table body scrollbars on Deposit/Withdraw (`.bo-tx-table-body`, 14px + end arrows) are a different recipe — do not copy here.

Theme: FOUC + `#boThemeToggle` sibling of `[data-bo-profile]` + `bo-theme.js`.

#### Wallet Ledger (locked)

Reference: `wallet-ledger.html` · `body.bo-wallet-tx.wallet-ledger-page` · `bo-wallet-transaction-amber.css`.
**Specimen for listing filter control size** — measure here; other Transaction listing pages unify to the same metrics.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` (not `bo-charcoal`) + amber CSS · FOUC theme script |
| Filter strip | Inside `.table-card` → `.filter-card.wallet-inline-filter` · pad `10px 14px` · bottom hairline `#EADCC8` · **no** Page Size in row |
| Filter controls | **Listing filter controls (locked)** — see Patterns · date `240px` · Member/Provider `140px` · Type `150px` · Reset/Search `auto` (content + `0 12px`) |
| Type multi-select | Trigger = listing control chrome · menu/options = **Role select** option recipe (cream · amber wash hover · dark selected solid amber) |
| Table wrap | `.table-card > .table-wrap` horizontal scroll · **Panel pill scrollbar** (chocolate light / amber dark · **`6px`** · no arrows) |
| Type menu scroll | `#ledgerTypeOptions` — same pill recipe |
| Wallet Ledger Created/Posted | Cell = **`DD/MM/YYYY`** · hover cream pill `.wl-time-tip` = **`HH:MM:SS`** · **no arrow / beak** · `999px` · pad `7px 14px` · cream `#FFF8EB` / text `#6b360c` · fixed escape overflow |
| Hover in strip | Reset/Search: **no** `translateY(-1px)` / upward shadow (flush under `.table-card` top border) |
| Footer Show N | Same as **Deposit** — options `-` · `10` · `20` · `50` · `100` · `All` via hidden `#ledgerSize` · Role select cream chrome · open upward · bold options · amber wash selected |

Theme: FOUC + `#boThemeToggle` sibling of `[data-bo-profile]` + `bo-theme.js`.

#### Member Wallet (locked)

Reference: `member-wallet.html` · `body.bo-wallet-tx.member-wallet-page` · same Transaction listing chrome as Wallet Ledger.

| Part | Spec |
|------|------|
| Shell | `bo-wallet-tx` + amber CSS · FOUC theme script |
| KPI strip | 4 `.metric` tiles (Main / Provider / Total Bet / Net Win-Loss) · Member Wallet KPI specimen (icon chip amber wash) |
| Filter strip | Inside `.table-card` → `.filter-card.wallet-inline-filter` · keyword only + Reset/Search · **no** Page Size in row |
| Filter controls | **Listing filter controls (locked)** — keyword **`280px`** (min `220` · max `360` · flex grow) · Reset/Search `auto` · `36px` / `8px` · no hover lift |
| Member cell | Username only (no `ID: …` sub-line) |
| Action | `.bo-tx-action-btn` **26×26** · Ledger `is-ledger` · Adjust `is-edit` |
| Table | Split `.bo-tx-table-head` (fixed) + `.bo-tx-table-body` (scroll) · panel pill scrollbar on body · colgroup sync |
| Footer Show N | Same as Deposit — `-` · `10` · `20` · `50` · `100` · `All` via hidden `#walletSize` |

Theme: FOUC + `#boThemeToggle` sibling of `[data-bo-profile]` + `bo-theme.js`.

---

## Patterns

### Listing filter controls (locked — Wallet Ledger specimen)

**Canonical size for Transaction listing filters** (`.bo-filter-row` / `.wallet-inline-filter` / Deposit–Withdraw inline toolbar). Reference: `wallet-ledger.html` filter strip. **Do not** ship `42px` / `11px` radius on these rows going forward — beat `bo-ui-standard` `--bo-filter-height:42px` with the amber layer.

| Spec | Value |
|------|-------|
| Height | **`36px`** · `min/max-height:36px` · `box-sizing:border-box` |
| Radius | **`8px`** (not `11px`) |
| Row gap | **`10px`** |
| Strip padding | `10px 14px` (inline-in-table-card) |
| Surface | `#FFF8EB` · border `#EADCC8` · never form well `#F5EBDC` |
| Text | inputs `12px/700` · date trigger `13px/700` · buttons `12.5px/800` |
| Control pad | `0 12px` |
| Focus / open | border `#D97706` + `0 0 0 3px rgba(217,119,6,.14)` (dark: `#F59E0B` + `rgba(245,158,11,.18)`) |
| Labels | Hidden (placeholder + value) |

| Control | Width (desktop) |
|---------|-----------------|
| Date range trigger | `240px` (flex `0 0 240px` · min `220`) |
| Text input (Member / Provider / keyword) | `140px` |
| Type multi / select-like | `150px` |
| Page size | **Not in filter row** — footer only |
| Reset / Search | `width:auto` · `flex:0 0 auto` · pad `0 12px` |

**Buttons in the strip:** Ghost Reset + Primary Search — same **`36px`** · listing Ghost / Primary 3D fills · **no** hover lift when the strip sits flush under a panel top border.

**Out of scope (keep their own heights until migrated):** Roles `.mp-search` / Role select trigger on `menu-permission` · MAIN executive `.mad-filters` · modal footers (`40px`). When those listing-adjacent filters are next touched, bring them to **`36px`**.

### Sidebar nav

Source of truth: `assets/css/bo-charcoal-shell.css` (shared shell). Do not invent alternate fills from page CSS.

#### Shell chrome — `.report-sidebar`

| Spec | Light | Dark |
|------|-------|------|
| Fill (opaque paint) | `#FFE8CC` | `#3A3226` (continuum left stop; token `--bo-sidebar-bg` may still read `#2A2C36` — prefer paint stop) |
| Border-right | `1px solid rgba(92,74,48,.14)` | `1px solid rgba(245,158,11,.22)` |
| Text | `#6b360c` | `#FFFFFF` |
| Expanded / mini-hover shadow | `18px 0 40px rgba(60,48,32,.14)` | `18px 0 40px rgba(0,0,0,.35)` |
| Edge rail | `::before` 2px · `#F59E0B`→`#D97706` · opacity `.75` | `::after` 2px · `#FBBF24`→`#F59E0B`→`#D97706` · opacity `.85`; `::before` = faint grid texture |
| Brand `.report-brand` | text `#6b360c` · bottom `rgba(92,74,48,.1)` · small `10px/700` opacity `.78` | text `#FFFFFF` · bottom `rgba(245,158,11,.18)` · small amber `rgba(245,158,11,.78)` + soft glow |
| Close `.close-side` | bg `rgba(255,255,255,.55)` · border `rgba(92,74,48,.12)` · `#6b360c` | bg `rgba(255,255,255,.1)` · `#fff` |
| Account footer | transparent · top `rgba(92,74,48,.1)` · **height `--bo-shell-foot-h` (`68px`)** · pad `10px` · flex center | transparent · top `rgba(255,255,255,.08)` · same height token |
| Logout `.bo-sidebar-logout` | text `#B42318` · icon `#D92D20` · bg `rgba(255,255,255,.45)` · border `rgba(180,35,24,.12)` · hover `#912018` on `rgba(254,243,242,.95)` | text `#FF8A90` · icon `#F87171` · transparent · hover white on `rgba(248,113,113,.1)` + red ring |
| Page sticky footers | **Same `--bo-shell-foot-h`** · flush to main bottom · top hairline aligns with Account footer divider (e.g. Frontend Display `.fd-save-bar`) | same |
| Nav slab `.report-nav` | transparent · pad `12px 10px 10px` · gap `3px` · **no** nested glass | same pad · transparent |

Never put `backdrop-filter` / `isolation` on `.report-sidebar` — it clips the desktop L2 flyout (`position:fixed`).

#### L1 — `.nav-group-btn` / top-level `a:not(.report-sub)` (locked)

| State | Light | Dark |
|-------|-------|------|
| Default | text/icon `#6b360c` · weight `800` · radius `10px` · transparent · icons opacity `.72` | text `rgba(255,255,255,.86)` · icons `rgba(255,255,255,.7)` · weight `800` |
| Hover / flyout-hover | wash `rgba(255,243,224,.78)` · soft lift `0 1px 2px rgba(60,48,32,.05)` | wash `rgba(255,255,255,.04)` · text `rgba(255,255,255,.95)` · icon hover `#FBBF24` |
| **Active / open / has-active-child** | gradient `135deg #FFF8EF → #FFE8CC → #FFF3E0` · inset white + ring `rgba(217,119,6,.18)` + lift `0 6px 16px rgba(217,119,6,.12)` · **3px left bar** `#FBBF24`→`#D97706` + soft amber glow | gradient `90deg rgba(245,158,11,.16) → .05 → transparent` · text `#FBBF24` · amber inset + glow · **2px left bar** `#FDE68A`→`#F59E0B`→`#D97706` · icon drop-shadow |

L1 active = **left amber bar**, never the L2 bordered frame.
<<<<<<< HEAD
=======

**Duplicate menu URLs:** the same page may appear under two groups (e.g. `wallet-ledger.html` as Transaction Record + Member Wallet Ledger). Active chip / open L1 belongs to the **first** match in menu sort order only — never highlight both parents.
>>>>>>> feature/member

#### Desktop flyout panel — `.nav-group-list`

`reports.css` sets desktop flyout `background:#fff!important`. Shell must beat it (include `.report-nav > .nav-group > .nav-group-list`).

| Spec | Light | Dark |
|------|-------|------|
| Panel bg | `#FFF8EB` | `#383A46` |
| Panel border | `1px solid rgba(92,74,48,.12)` | `1px solid rgba(255,255,255,.14)` |
| Panel shadow | `0 12px 32px rgba(60,48,32,.14)` | `0 16px 40px rgba(0,0,0,.35)` |

#### L2 — `.report-sub` (inline nav + flyout)

Two light active chips ship in CSS — copy the matching selector, do **not** flatten to a single wash.

| State | Light | Dark |
|-------|-------|------|
| Default | text/icon `#6b360c` · transparent · radius `9px` · border transparent | text `rgba(255,255,255,.62–.68)` · icons `rgba(255,255,255,.55)` |
| Hover (inline) | wash `rgba(255,243,224,.72)` · **no** frame | `rgba(255,255,255,.05)` · text `.92` · no frame |
| Hover (flyout) | wash `rgba(217,119,6,.08)` · **no** frame | same as inline dark hover |
| **Active — inline** `.report-nav a.report-sub.active` | `135deg #FFF8EF → #FFE8CC` · border `1px solid rgba(217,119,6,.28)` · shadow `0 4px 12px rgba(217,119,6,.1)` · text `#6b360c` | `180deg rgba(245,158,11,.18) → rgba(43,37,33,.92)` · border `rgba(245,158,11,.55)` · text `#FBBF24` · amber ring/glow + inset |
| **Active — flyout** `.nav-group-list a.report-sub.active` | `180deg #FFFBEB → #FEF3C7` · border `1px solid #D97706` (`--bo-sidebar-active`) · shadow `0 0 0 1px rgba(245,158,11,.12), 0 4px 14px rgba(217,119,6,.12)` · text `#6b360c` | same dark chip as inline |
| Active `::after` rail | none (`display:none`) | none |

Do **not** use flat `rgba(217,119,6,.12)` wash alone for active. Shared on: Dashboard, Roles & Permissions, Administrators, Security & Audit, and every page on `bo-charcoal-shell.css`.

### Topbar (locked chrome — copy exactly)

**Specimen:** Deposit Approval topbar (`member-deposit.html` · `body.bo-wallet-tx`) — user-confirmed 2026-09-17.

**Surface**

| Mode | Topbar bg | Height (Transaction / Approval) |
|------|-----------|----------------------------------|
| Light | solid `#FFF8EB` | `64px` (`--bo-header-h`) · pad-y `0` · items centered |
| Dark | solid `#383A46` | same |

**Full anatomy (L→R)**

| Zone | Contents |
|------|----------|
| Left | `.hamb` → `.user-title-wrap` = `.user-title-icon` + `h1` (+ lead `<p>` on Deposit/Withdraw Approval only) |
| Right `.report-actions` | `.bo-theme-btn` → `[data-bo-profile]` (optional `.bo-header-counters` + `.bo-account-link`) |

**Right cluster order (L→R):** Theme toggle → **Members / Deposit / Withdraw** counters (non-`MAIN` only, injected by `auth.js`) → 1px divider (`[data-bo-profile]::before`) → User Name / profile.

Do not invent alternate topbar account pills, bordered username chips, navy theme icons, or rainbow counter icons.

#### Page title — `.user-title-wrap`

| Spec | Light | Dark / notes |
|------|-------|--------------|
| Icon `.user-title-icon` | amber wash / border · glyph `--bo-cyan` (`#D97706`) · ~`36×36` · radius `10–12px` | charcoal wash · amber glyph |
| Title `h1` | `22px/900` · `#18191C` (Approval pages may use text token; hide overflow with ellipsis) | `#F5F5F4` |
| Lead `p` | Approval only · `12px/500` · `#57534E` / `--bo-muted` · one line | muted · **hide ≤768** |
| Admin / most listings | **no** lead `<p>` | title + icon only |

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

#### Header counters — `.bo-header-counter` (ops chrome · Deposit Approval specimen)

Members / Deposit / Withdraw chips. Charcoal+amber family with **per-chip identity** — no purple / green / cool rainbow. Hidden for `roleType === MAIN`.

| Spec | Light | Dark |
|------|-------|------|
| Chip | `#FFFCF7` · border `#EADCC8` · height **`48px`** · radius **`10px`** · pad `5px 14px 5px 5px` · min-width `118px` · gap `10px` | well `#2A2C36` · border `white/16` |
| Icon tile | **`38×38`** · radius `8px` · glyph `18px` | same size |
| Icon · Members | wash `rgba(24,25,28,.08)` · glyph `#18191C` | wash `white/10` · glyph `#F5F5F4` |
| Icon · Deposit | wash `rgba(217,119,6,.18)` · glyph `#D97706` | wash `rgba(245,158,11,.20)` · glyph `#FBBF24` |
| Icon · Withdraw | wash `rgba(180,83,9,.14)` · glyph `#B45309` | wash `rgba(217,119,6,.18)` · glyph `#F59E0B` |
| Label `small` | `11px/800` uppercase · tracking `.06em` · Members `#44403C` · Deposit `#B45309` · Withdraw `#92400E` | Members `#D4D4D8` · Deposit `#FBBF24` · Withdraw `#F59E0B` |
| Value `b` | `18px/800` tabular · `#18191C` | `#F5F5F4` |
| Hover / focus | border `#D97706` · bg `#FFF8EB` · ring `0 0 0 3px rgba(217,119,6,.14)` | border `#F59E0B` · bg `#32343F` · amber ring |
| ≤1199 | icon-only square `46×46` (label/value collapse) | same |

Links: Members → `index.html` · Deposit → `member-deposit.html` · Withdraw → `member-withdraw.html`. Counts from operation-notification summary.

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
| Divider before profile host | `1px × 28px` `rgba(24,25,28,.12)` on `[data-bo-profile]::before` | `rgba(255,255,255,.14)` |

### Buttons (locked — Admin Detail reference)

**Shared metrics (page actions / chrome / modal footers)**

| Spec | Value |
|------|-------|
| Base height | **`36px`** (listing filters / page chrome). Modal actions `40px`. Danger Delete Role may stay `42px` until that toolbar is migrated |
| Modal action height | `40px` |
| Padding | `0 12–14px` (listing filter buttons `0 12px` · modal `0 16px`) |
| Radius | `8px` |
| Font | `12.5–13px` / weight `700–800` |
| Gap (icon+label) | `6–8px` |
| Motion | hover `translateY(-1px)` · active `translateY(1px)` · ease ~`0.14s` — **except** flush inline filter strips (Wallet Ledger): no lift |
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

- Inputs: dark soft charcoal `#2A2C36` on dark; light well `#F5EBDC` on light — **never** `#FFFFFF` chrome
- Focus: amber ring (never cyan) — e.g. `0 0 0 3px rgba(217,119,6,.12)`
- **Create/Edit hierarchy:** never one flat cream — use the layer ladder below so Save CTA and sections read clearly

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
| Scrollbar thumb | `#98A2B3` / hover `#667085` · `4px` pill · no arrows (menu only — Bulk/Wallet panels use chocolate **`6px`**) | `#F59E0B` / `#D97706` |
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

Reference: Charcoal block in `main-admin-detail-executive.css` (+ merchant twin). Classes: `.mad-pager .smart-page` / `button` / listing `.page-btn`. Metrics: min-width `40px` · height `36px` · radius `8px` · `13px/700`.

**Layout (listing — locked).** Specimen: Manual Rebate Approval / Rebate Management (`.mra-table-footer` / `.rebate-table-footer`). Grid `1fr auto 1fr` — **Showing centered**.

| Slot | Content |
|------|---------|
| Left | `Show [N] entries` — options **`-` · `10` · `20` · `50` · `100` · `All`** (Deposit contract). **Default = `-` selected** (`-` = auto-fit / default; never ship with `20` pre-selected) |
| Center | `Showing X to Y of Z entries` — horizontally centered in the footer strip |
| Right | Pager controls, packed to the end |

**Pager controls (order locked):** First (`bi-chevron-bar-left`) · Previous (`bi-chevron-left`) · page number buttons · Next (`bi-chevron-right`) · Last (`bi-chevron-bar-right`). Active page = amber 3D. Disabled First/Prev on page 1; disabled Next/Last on last page / empty.

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
| Icon / float tip `[data-tip]` / `.mad-float-tip` / Last Login | cream `#FFF8EB` · text `#6b360c` · border `rgba(217,119,6,.28)` · shadow `0 8px 22px rgba(60,48,32,.16)` · pad `7px 14px` · **`999px` pill** · beak arrow | `#40424E` · `#F5F5F4` · border `rgba(245,158,11,.35)` · shadow `0 12px 28px rgba(0,0,0,.35)` · **`999px`** |
| Wallet Ledger Created/Posted `.wl-time-tip` | Cell date `DD/MM/YYYY` · tip time `HH:MM:SS` · cream pill · **no arrow** · `position:fixed` | same |
| Never | navy `#0F1F33` tip · native `title` inside overflow-hidden tables | navy tip |

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
| Filter select / rounded trigger | cream surface · amber focus ring · height **`36px`** (listing) | `#2A2C36` · amber focus |
| Reset / secondary action | height **`36px`** · Ghost/surface (listing) | charcoal Ghost |
| Bulk delete | `#FEF3F2` / border danger/35 / text `#B42318` | danger wash / `#FF8A90` |

Transaction listing / Wallet Ledger: use **Listing filter controls (locked)** — not the old `42px` / `11px` `bo-ui-standard` tokens.

#### Status filter pills — `.mad-pill` / `.bo-tx-tab` + `.bo-seg-thumb` (locked)

Reference specimen: Active / Suspend / All on Bank Deposit Usage (and Admin Detail / Deposit–Withdraw family). **Do not** invent a different chip style.

**Anatomy**

| Part | Spec |
|------|------|
| Track | `.mad-pills.bo-seg` or `.bo-tx-tabs.bo-seg` · transparent · `inline-flex` · gap `6px` · `position:relative` · `overflow:visible` |
| Thumb | `.bo-seg-thumb` (from `bo-seg-bounce`) draws the **only** selected frame — pills themselves stay transparent when `.is-active` |
| Order (status) | **Active → Suspend → All** |
| Order (Deposit family) | Deposit → Withdraw → All (same chrome; green/red dots on first two) |
| Counts | `.bo-tx-tab-count` / `.mad-pill-count` · tabular nums · wrapped as `(n)` via `::before`/`::after` |
| Motion | `bo-seg-bounce.css` + `BO_SEG_BOUNCE.mount(...)` — without the thumb script the selected frame disappears |

**Selected chip (thumb)**

| Spec | Light | Dark |
|------|-------|------|
| Fill | lift cream `linear-gradient(180deg, #FFFCF7 0%, #FFF8EB 55%, #F3E8D6 100%)` — **lighter than** toolbar `#FFF8EB` so the chip reads | charcoal 3D `#383A46`→`#2A2C36` |
| Border | `1px solid #E0D0B8` | `1px solid rgba(255,255,255,.14)` |
| Shadow | `0 1px 2px rgba(24,25,28,.08), 0 2px 8px rgba(92,74,48,.10)` | soft dark lift |
| Radius | **`999px`** (capsule — matches specimen) | same |
| Height | `36px` (full track height) | same |

**Tab label states**

| State | Light | Dark |
|-------|-------|------|
| Idle text | muted `#71717A` · weight `700` · `12.5px` · height `36px` · pad `0 14px` · radius `999px` · **no fill** | muted `#A1A1AA` |
| Selected text | ink `#18191C` · weight `700` · fill **transparent** (thumb shows through) | `#F5F5F4` |
| Hover (not selected) | soft wash `rgba(24,25,28,.04)` · text slightly stronger | soft white/5 wash |

**Status dots (`::before` — 6×6 circle)**

| Tab | Idle (not selected) | Selected (`.is-active`) |
|-----|---------------------|-------------------------|
| **Active** | muted slate `#B8C0CC` | green `#059669` (dark: `#34D399`) |
| **Suspend** | muted lavender-grey `#C4C0D0` | red `#DC2626` (dark: `#F87171`) |
| **All** | **no dot** | **no dot** |

Deposit / Withdraw reuse the same recipe: Deposit = green when selected · Withdraw = red when selected · All = no dot.

**Do not**

- Paint selected fill on the button itself (breaks bounce thumb)
- Put a red/green dot on idle Suspend/Active (idle stays muted grey)
- Add a dot to All
- Use cool blue / pure white chips
- Ship tabs without `bo-seg-bounce` when the track has class `bo-seg`

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

#### Form datetime popover (`.rebate-dt-*` — locked)

**Specimen:** Rebate Management · Add/Edit Rebate Rule · Start At / End At (`rebate-management.html` + `rebate-management-craft.css` + `rebate-management.js`).

**Do not** use native `<input type="datetime-local">` chrome (OS blue / Chinese locale picker). Hide the native control; drive value through a custom trigger + popover.

**Layout (compact · side-by-side):**

```
┌ summary (selected · Clear) ─────────┐
│ calendar (left) │ Hour/Min rail     │
│                 │ (▲ value ▼)       │
├ Today ───────────────────── Done ───┤
```

| Spec | Value |
|------|-------|
| Pop size | ~`348×293` · radius `12px` · body grid `1fr 86px` |
| Calendar | Short month label · day cells `28×28` pill · selected solid amber · today soft amber wash (not outline-only) · weeks = only as many as needed (not fixed 6) |
| Time rail | Hour + Min stacked · steppers for fine nudge · **value click = quick pick** |
| Quick pick | Overlay covers body · Hour `00–23` 6-col grid · Min chips `:00/:15/:30/:45` + `00–59` grid · back chevron · Esc closes pick first |
| Foot | Ghost `Today` · Primary `Done` · height compact (~`26–28` pad) |
| Trigger | Form well (ladder) · display `DD/MM/YYYY HH:mm` · empty = “Select date & time” |

| Part | Light | Dark |
|------|-------|------|
| Pop panel | `#FFF8EB` · border `#EADCC8` · soft warm shadow | `#383A46` · white/12 · deep shadow |
| Summary strip | `#FFFCF7` · bottom hairline · text `#18191C` · Clear muted | `#2A2C36` · text `#F5F5F4` · Clear `#A1A1AA` |
| Calendar / rail split | hairline `#EADCC8` · rail bg `#FFFCF7` | white/10 · rail `#2A2C36` |
| Day selected | solid `#D97706` · text `#fff` | solid `#F59E0B` · text `#18191C` |
| Day today (not selected) | text `#D97706` · wash `rgba(217,119,6,.08)` | text `#FBBF24` · wash amber/12 |
| Step value | well `#FFF8EB` · border `#EADCC8` · pick caret hint | `#383A46` · white/12 |
| Pick overlay | `#FFF8EB` · selected chip/opt solid amber | `#383A46` · selected `#F59E0B` / text `#18191C` |
| Done | Primary amber (Buttons) | Primary dark · text `#18191C` |

**Rejected:** tall vertical stack · scroll drums with OS scrollbars · amber outline lens on time · native datetime blue chrome · clicking the value only nudges ±1 (must open pick).

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
| Cards / frames | listing panel, form section lift, Roles control card, Create Role card |
| Fields | listing surface inputs vs form wells, placeholders, focus rings, locked |
| Date range picker | cream panel, preset wash active, ghost head, day endpoints solid |
| Form datetime popover | `.rebate-dt-*` side-by-side compact · value click → hour/min grid · no native datetime chrome |
| Buttons | Primary, Ghost (+ shared hover), secondary, danger, pager, chips |
| Table | panel, header, cells, dividers, hover, money, status, avatar, footer, pager |
| Transaction table (locked L|D) | `--bo-table-*` zebra · deep dark head `#1F2128` · square thead · bold cells · PENDING orange · action wells · no Filtered Total |
| Modals | scrim, panel, close, fields, footer actions, **form datetime popover** |
| KPI strip | tile, label, value, note, grid (Report family — see below) |
| KPI summary card (listing) | `.metric` + `.bo-summary-icon` — Member Wallet specimen (icon chip + type metrics) |
| Roles | control card, select, scope, toolbar, matrix group/card, badges, sticky footer |
| Create Role | title, cards, inputs, chips, ghost/primary, sticky footer status |

### KPI summary card — listing (`.quick-stats .metric`, Member Wallet specimen)

Icon readout tile for Transaction listing / `bo-wallet-tx` pages. Markup: `.metric` → `.bo-summary-icon` (injected) + `span` label + `strong` value + `.bo-summary-note`. **Not** the Report-family strip below (that strip has no icon chip).

| Part | Light | Dark |
|------|-------|------|
| Tile | `#FFF8EB` · `1px solid #EADCC8` · radius **`16px`** · pad **`16px 18px`** · min-h **`104px`** · `--bo-shadow` | `#383A46` · `1px solid rgba(255,255,255,.10)` · same pad/radius/min-h · shadow none |
| Grid | `52px minmax(0,1fr)` · **`column-gap: 24px`** · align center | same |
| Icon well | `52×52` · `50%` · bg `rgba(217,119,6,.12)` · border `rgba(217,119,6,.18)` · glyph `#D97706` / `22px` | bg `rgba(245,158,11,.16)` · border `rgba(245,158,11,.28)` · glyph `#FBBF24` |
| Label (`span`) | `12px` / `800` · `#57534E` · lh `1.2` | `#D4D4D8` |
| Value (`strong`) | `23px` / `900` · `#18191C` · lh `1.05` · margin `2px 0` | `#F5F5F4` |
| Note (`.bo-summary-note`) | `11px` / `600` · `#71717A` · lh `1.2` | `#A1A1AA` |
| Strip | `repeat(4,minmax(0,1fr))` · gap `14px` · **↔ table-card `16px`** · ≤1024 → 2 · ≤575 → 1 | same |

**Listing vertical rhythm:** `.report-content` flex `gap:16px` between KPI strip and `.table-card`. Filter strip pad `14px 16px` + bottom hairline, then thead. Do not use `12px` here.

**Never** `gap: unset` after `column-gap` (clears icon↔text space). Amber icons only — no green/purple rainbow wells. CSS: `reports.css` + `bo-wallet-transaction-amber.css`.

**User Management** (`.user-metric`): same locked specimen — radius `16px` · pad `16px 18px` · min-h `104px` · icon `52×52` amber wash · gap `24px` · label (`small`) `12px/800` · value `23px/900` · note (`span`) `11px/600`. CSS: `bo-charcoal-legacy.css`.

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
| Sidebar MD synced to `bo-charcoal-shell.css` | Documented shell fill/rail/brand/close/logout + L1 + inline vs flyout L2 active (`#FFF8EF`→`#FFE8CC` vs `#FFFBEB`→`#FEF3C7`); dark L1 hover `.04` | 2026-09-17 |
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
| Bulk panel pill scrollbar locked: light chocolate `#8B6B4A` / hover `#5C4A30` · dark `#F59E0B` / `#D97706` · **`6px`** · no arrows · webkit only (never cool slate / zinc) | User: scrollbar 再粗一点点；was `4px` | 2026-09-17 |
| Wallet Ledger = `bo-wallet-tx` · table-wrap + type menu use Panel pill chocolate scrollbar · Type dropdown retired cool blue | User: Wallet Ledger scrollbar 跟着 MD | 2026-09-17 |
| Sidebar active chip: first matching menu URL only (wallet-ledger under Transaction wins over Member duplicate) | User: Wallet Ledger sidebar 跟着 MD；Member 不应同时高亮 | 2026-09-17 |
| **Listing filter controls locked at `36px` / radius `8px` / gap `10px`** (Wallet Ledger specimen) — date `240` · inputs `140` · Type `150` · Reset/Search auto · no Page Size in filter row · no hover lift in flush strips | User: 按钮和框大小更新进 MD，之后统一用这个大小 | 2026-09-17 |
| Wallet Ledger Created/Posted = cell `DD/MM/YYYY` · cream pill tip `HH:MM:SS` · **no arrow** (图一标准 hover) | User: 图一无箭头；图二有箭头错；格子显示日期 | 2026-09-17 |
| Footer **Show N entries** = Deposit contract (`-` · `10` · `20` · `50` · `100` · `All` · Role select cream · `#ledgerSize`) | User: 跟 new deposit 一样，写进 MD | 2026-09-17 |
| Deposit/Withdraw toolbar filters = listing MD geometry (`36px` · gap `10` · date `240` · keyword `140` · status `150`) | User: 这里的框的大小跟着 MD 的来调 | 2026-09-17 |
| Bulk Manual split = Select Members **60%** · Configure **40%** (`3fr` / `2fr`) | User: 左边 60% · 右边红框 40% | 2026-09-17 |
| Panel pill scrollbar thickness **`6px`** (was `4px`) — Bulk · Wallet Ledger · Livechat | User: scrollbar 再粗一点点 · 更新 MD | 2026-09-17 |
| **Member Wallet** aligned to listing MD — no Page Size in filter · footer `#walletSize` · action 26×26 wells · username-only Member cell · panel pill scrollbar | User: 用MD来调整这些东西 | 2026-09-17 |
| **Topbar anatomy locked** (Deposit Approval specimen): left hamb + icon + title (+ Approval lead) · right theme → Members/Deposit/Withdraw counters `48×`/`10px` · User Name + avatar · height `64px` | User: 把表头的部分更新进 MD | 2026-09-17 |
| **Shell foot band** `--bo-shell-foot-h:68px` — Account footer + page sticky footers share height so Logout hairline aligns with Save bar top | User: 表尾和 logout 上方的线对齐 | 2026-09-19 |
| **Listing table footer layout locked** — left `Show N` · **center** `Showing…` · right First/Prev/pages/Next/Last (amber active) · grid `1fr auto 1fr` (Rebate Management specimen; supersedes prior right-grouped Showing) | User: Showing 要居中；更新 MD | 2026-09-20 |
| Footer Show N **default = `-`** (options `-` · `10` · `20` · `50` · `100` · `All`; never pre-select `20`) | User: show 要默认是 -；写进 MD | 2026-09-20 |
| **Rebate Rule modal** = Create/Edit Admin form ladder — section `#FFFCF7` + 3px amber rail · input wells `#F5EBDC`/`#DCC9A8` (not listing `#FFF8EB`) · sticky foot Ghost+Primary `40px` · rate grid 4-col | User: /interface-design 调整 Add Rebate Rule | 2026-09-20 |
| Charcoal topbar height locked `64px` / pad-y `0` (Deposit specimen); Show N select `line-height:normal` (fix height/line-height clip) | User: 表头要跟着MD来调整，表尾的show 框数字看不完全 | 2026-09-20 |
| Manual Rebate footer Show N = **Role select** (`.rounded-select-*`) · open upward · cream · amber wash selected · dark solid `#F59E0B`/`#2A2C36` — never native blue | User: 下来选项的设计也不对，可以看MD来调整 | 2026-09-20 |
| **Form datetime popover** (Rebate Start/End At) locked — side-by-side compact ~`348×293` · calendar + Hour/Min steppers · **click value → quick-pick grid** (`:00/:15/:30/:45` + full mins) · never native `datetime-local` chrome | User: 左右排 · 不要那么大 · 要快速选择 · 更新进 MD | 2026-09-20 |
| Rebate dark workbench: kill `.rebate-chrome` / `.rebate-tabs` card frame (legacy `#2A2C36`+border) — transparent tabs + table borderless on charcoal canvas | User: dark mode 不要有这种背景框 | 2026-09-20 |

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
7. **Unify chrome:** every page’s Theme toggle, header counters (when present), User Name block, Primary CTA, and Ghost/Export must match the Topbar + Buttons specs above — do not freestyle.
8. **Dark mode must beat legacy CSS:** `reports.css` still has `.report-body{background:#f5f7fb!important}`. Page CSS must override body/html/canvas with equal-or-higher specificity + `!important`, or white frames will leak around dark cards. Never assume MD tokens alone paint the canvas.
9. **Permission matrix dual wash:** light = cream/amber group wash; dark = cool charcoal surfaces only (amber accents, never muddy amber panel fill). Copy from Patterns → Permission matrix.
10. **No pure white in light chrome:** canvas end, topbar, and panels use cream `#FFF8EB` (continuum → `#FFF6E8` → `#FFF8EB`). Keep `#FFFFFF` only for text-on-amber (`--bo-accent-on`). Do not settle for near-white ivory (`#FFFCF8`) on Dashboard main pane.
<<<<<<< HEAD
11. **Dark data tables:** outer/row borders ≥ `rgba(255,255,255,.12–.14)`; header `#E7E5E4`; cells `#F5F5F4`; muted/time `#D4D4D8`. Scope light cream table CSS with `html:not([data-bo-theme="dark"])`. Copy from Patterns → Data tables.
=======
11. **Dark data tables:** outer/row borders ≥ `rgba(255,255,255,.12–.14)`; header text `#E7E5E4`; cells `#F5F5F4`; muted/time `#D4D4D8`. **Transaction listing** (`body.bo-wallet-tx`): zebra odd `#3A3C48` / even `#434653` · thead `#1F2128` (deeper than body — never lifted `#40424E`). Scope light cream table CSS with `html:not([data-bo-theme="dark"])`. Copy from Patterns → Data tables → Transaction listing table.
>>>>>>> feature/member
12. **Sidebar L2 active:** inline = `#FFF8EF`→`#FFE8CC` + border `rgba(217,119,6,.28)`; flyout = `#FFFBEB`→`#FEF3C7` + border `#D97706`. Dark both: amber/charcoal chip + `rgba(245,158,11,.55)`. Never flat amber wash only. Beat `reports.css` flyout `#fff`. Copy from Patterns → Sidebar nav (shell CSS).
13. **Every new chrome needs Light|Dark:** before shipping a frame/button/slot, add or update a two-column table in this file (see Coverage checklist). Do not leave “dark inherits” undocumented.
