# Responsive work — review brief

Everything below was done in one session, on `kunzzit01/dev`, page by page, always
measure → change → re-measure. Only the listed files were staged per commit; the
branch also contains another session's commits (see *Not mine* at the end).

Target: every list page usable at **1917 / 1560 / 1440 / 1280 / 1024 / 834 / 768**
(desktop, 13" laptop, iPad landscape, iPad portrait). "Fits" means: table not wider than
its card, no cell or header clipped, no element past the card, no horizontal page scroll.

---

## 1. Method (why the numbers in this document exist)

- Pages are served by `scripts/dev-harness.js` (fake but shape-correct API data), so a page
  can be measured with rows in it without touching the real backend.
- `scripts/lib/headless-cdp.js` — a ~120-line Chrome DevTools driver, no dependencies
  (Node's global WebSocket). Chrome path overridable with `CHROME_PATH`.
- **Before every change**: per-column widths, `scrollWidth` vs `clientWidth` per header and
  per body cell, and the box that scrolls. **After**: the same numbers at all seven widths.
- No change was made "because it looked wrong" — each one names the measured number that
  forced it, and the comment in the CSS records both.

## 2. Tooling added (review these first)

| file | what it does |
|---|---|
| `scripts/table-fit-audit.js` | sweeps every page in the repo that contains a `<table>` (116), at 1440/1280/1024/768, and classifies: fits / scroll / **CLIP** (content unreachable). Resumes from `.tmp-table-audit.json`, rewrites `TABLE-AUDIT.md`, `--verify` exits 1 while anything is CLIP. |
| `scripts/lib/headless-cdp.js` | the driver it needs. |
| `TABLE-AUDIT.md` | generated report: totals, per-page table at four widths, plus each table's computed `min-width` (which is where the written floors show up). |
| `assets/css/online-users-responsive.css` | new page sheet (only `online-users.html` links it). |

**The audit's first version was wrong and that matters for review.** It classified a page
CLIP when a clipped wrapper could not be scrolled — but the wide-listing pattern here puts a
head table in `overflow:hidden` above a body table in `overflow-x:auto`, with a scroll
listener mirroring `body.scrollLeft` onto the head. `overflow:hidden` is still a
*programmatic* scroll container, so the head did follow the body; measured
`body.scrollLeft = 260` → head 260. The probe now scrolls the nearest scrolling sibling and
only calls a box unreachable if it did not follow. That took the CLIP list from 14 to **0**
and is why "content unreachable" is no longer the top of the queue — plain horizontal
scrolling is.

## 3. Pages changed

Sizes are viewport widths; "hidden" is the px of table content behind the card's scroller.

### 3.1 `index.html` (User Management) — 57f31f3f, aa0f49fa
- Filter bar was 108px tall for 36px of controls: the filter grid measured 922 against a
  row of 1254 and the buttons needed 326+12 — 6px over, so they wrapped. One row now at
  ≥1470 (`flex:1 1 700px` on the grid, the search box gives the surplus back).
- Table: `min-width:1560px` was written, not content — 12 columns need 1118. Floor removed,
  **widths by `data-col` name** (the columns come and go through the Columns menu, so
  `nth-child` would size the wrong one), headers wrap.
- **Columns by screen**: 12 / 10 (≤1439) / 6 (≤1225), driven from the registry in
  `member-management.js`; the Columns menu still offers all twelve.
- Two clamp bugs found at 1024: `measureAutoPageSize()` had `Math.max(5, …)` (288px of rows
  in a 213px scroller — the last row was cut in half), and `reports.css` hides
  `.desktop-only` below 1200, which took the **column picker** with it — the only way back
  to the hidden columns, so it stays.
- Measured: 12/10/6 columns, 0 hidden, 0 clipped at 768…1917.

### 3.2 `livechat.html` — 1aa190bb
- Below 992 the shell unstacks, so inbox **and** thread were both on screen: at 768 the
  room card started at y=476 with 680px of messages under it.
- Master-detail: `data-lc-pane="inbox|room"` on the shell, Back button in the room head
  (only rendered where the panes are exclusive; hidden above 992). `selectConversation()`
  sets the pane; a document-level delegated click handles Back, guarded by a window slot.
- Frame keeps its full-height column below 992 (that half lives in `bo-shell.css`, next to
  the block that used to let this page scroll): content column 706 → 936 at 768, composer
  pinned, thread scrolls inside itself.
- Inbox rows below 1280: the duplicated username prefix in the preview is dropped (the row
  is avatar+copy+time in a 245px item, which left the copy 108px).

### 3.3 `rebate-management.html` — babf09de, ef8352a6, 71e35d32
- Order column 56 → 136… (headers no longer truncated: Order 76, Status 136).
- Tab pills were 40–41px (padding-driven) against 36px action buttons → 36 / 12.5px / 700.
- **Show "-" = fit**: floor removed (`Math.max(5, …)` kept 5 rows where 3 fit — a promise to
  overflow), average row height no longer rounded up, plus a `ResizeObserver` on the body
  (expanding the settlement panel took the body 388 → 125px while the row count stayed 6).
  Bound through a window slot because the router re-runs the file.
- Card: dark had **no card at all** (an earlier block painted `.standard-list-card`
  transparent), light stacked a 16px card around a 14px table. Both themes now one surface,
  8px, no inner frame — the construction `.table-card` uses on the approved pages.
- One radius for the page: KPI 12 → 8, schedule 16 → 8 (it carries
  `.standard-list-card`, whose `!important` 16 never lost), cycle cards 10 → 8 (headers 9 → 7).

### 3.4 `manual-rebate-approval.html` — f8c5cfa5
- Show "-" asked for 20 rows flat → 3–13 rows fitted per screen (server-paged, so the count
  takes one extra request: ask, measure a painted row, ask once more; bounded).
- The current page button was grey when the list was empty (`renderPager` marks "1" current
  **and** disabled; `.page-btn:disabled{opacity:.45}` washed the amber out). Fixed in
  `rebate-pages.css` so the cache key moves for 8 rebate pages, not 36.

### 3.5 `rebate-log.html` / `daily-rebate-report.html` — 266125dc, 3a7cff7a
- No "-" option at all (20 rows flat) → fit added (rebate-log's own JS; the daily report
  shares the script and only needed the option + the table class).
- 12 columns at 107px each: PROVIDER / CATEGORY (146), TOTAL VALID BET (114), EFFECTIVE RATE
  (109) ran into their neighbours and a CLAIM LOCKED badge spilled into REFERENCE → px
  recipe, sum 1284 of the 1286 available, 0 clipped headers and 0 clipped cells on both.
- Room measured: 890 → 6 rows, 812 → 5, 700 → 3, 1100 → 10; no page scroll at any.

### 3.6 `bank-deposit-usage.html` — 0b71826d
- The **floor grew as the window shrank**: base `min-width:1480px`, overridden only at
  ≥1025 (1240) and ≤768 (780) — so 769–1024 kept 1480 against a 750 frame: **730px hidden**.
- Ladder by content: 11 columns (≥1480) / 10 (1440) / 9 (1280) / 7 (≤1100) — Daily
  Threshold, then Transaction Range, then Account and Net Used / Max. Widths in px (percent
  widths made a reduced set still ask 77% of the table and the headings ellipsised).
- Toolbar: at ≤1280 the filter row claimed `width:100%` (bo-ui-standard, two id steps) so
  the buttons wrapped for no reason — 157 → 109px, and at ≤1100 the keyword box gives 150px
  so the buttons share the line.

### 3.7 `payment-gateway.html` — a01a7bb5
- 6 columns are percentages (24/26/18/10/12/10). At 1024 the table is 750 and 24% leaves the
  logo+name 180 against the 192 it needs — the "logo and name squeezed together" report.
- Below 1025: px widths (Gateway 196 / URL 186 / Caps 106 / Channels 78 / Status 86 /
  Action 66 = 718 of 732). URL keeps the room because it is one token — with the new shared
  wrap rule a narrow column broke it mid-word (`https://s.s1pay.sit / e`).

### 3.8 `admin-operation-log.html` — 326dab03
- `min-width:1200px` at every width (36 / 196 / 452 / 470 hidden).
- **Result column 3px narrower than its own badge** (need 99, width 96) → 104.
- Ladder: 7 columns / floor 1186 (≥1480), 1166 (1440, exact), 6 at 1280 (−Module), 5 at 1024
  (−IP), 4 at ≤829 (−Admin). Details is a `td.detail-cell`, so the shared two-line clamp
  keeps rows at 56px while the column goes to 88px.
- New body class `.admin-operation-log-page` because the sheet is shared with seven other
  access-control pages — theirs are untouched (cache keys only).

### 3.9 `online-users.html` — 249a656a
- Shares `.user-main-table` with User Management, pinned at 1560 by `bo-charcoal-legacy`
  (stated twice, light + `html[data-bo-theme="dark"]`). Twelve columns measure 1559, so the
  floor mattered below ~1820: 274 hidden at 1560, 394 at 1440, 810 at 1024.
- New page sheet with three `:not(#id)` steps (two steps lost in dark mode): 12 / 9 / 8 / 6
  columns by width, each width a measured need in px.
- Second fault: the action row ran 146px past the card at 1024 (right 1146 vs 1000) — Export
  and User Management cut off with nothing to scroll → wraps inside the card.

### 3.10 Three pages from the audit's P0 — 1695ad2a
`main-admin-security` and `main-merchant-security` (`.mas-table` floor 820: the body scrolled
while the **head** clipped, so the last heading was cut and would not have travelled with the
body — six columns now share the 732 a 1024 frame has, headings wrap) and
`main-merchant-detail` (floor 1180, 22px wider than a 1440 frame; name/content-sized now).

## 4. Conventions these commits follow

- **px, not percentages**, once a column set becomes conditional: a reduced set with
  percentage widths still asks for its share of the *original* table width.
- **`:not(#id)` steps** to outrank the standardizers (`bo-ui-standard.css`,
  `bo-charcoal-legacy.css`, `bo-wallet-transaction-amber.css` state these widths with two
  steps and `!important`). Every such selector names a never-matching id; the comment says
  which file it is fighting.
- **Column dropping, documented per page**: which columns go, at which width, and why those
  (what the page is *read for*). Nothing is dropped without that note.
- **Pins**: only the sheets a commit touches are re-hashed; each commit lists the pages it
  re-pinned. `check-asset-pins` reports 12 stale references, all pre-existing on main.
- **Scoping**: page sheets where a sheet is shared (`online-users-responsive.css`,
  `.admin-operation-log-page`), so a fix for one page cannot silently restyle others.

## 5. Project state at the end

`TABLE-AUDIT.md` (116 pages, four widths). The middle column is the same tree after the audit
stopped calling the head/body pattern CLIP (§2) — those 14 pages moved into the scroll buckets,
which is why those counts rise before they fall:

| state | first sweep | after the method fix | now |
|---|---|---|---|
| CLIP (unreachable) | 14 | **0** | **0** |
| scroll at 1440 or 1280 (laptop) | 24 | 30 | **26** |
| scroll only at ≤1024 (tablet) | 19 | 24 | **24** |
| fits at every width | 59 | 62 | **66** |

Pages that moved to "fits everywhere" since the sweep: `member-deposit`, `bank-deposit-usage`,
`admin-operation-log`, `online-users`, `main-admin-security`, `main-merchant-security`,
`main-merchant-detail` (and `payment-gateway`, which the sweep already counted as fitting — its
bug was inside a cell, not the table; that class of bug is not what the audit measures).

Also made responsive without changing their audit row: `index` (User Management), `livechat`,
`rebate-management` (table at ≥1440), `rebate-log`, `daily-rebate-report`,
`manual-rebate-approval`, `bulk-adjustment`, `bulk-bonus-adjustment`.

## 6. Known trade-offs / deliberate non-changes

- **Tablets lose columns** on wide tables (7 of 11 on bank-deposit-usage, 6 of 12 on
  online-users). That is the price of no horizontal scroll; each drop is documented and
  reversible by changing one media query.
- **online-users timestamp** wraps to three lines at tablet widths (its column is 93px, the
  header's own need). Forcing `nowrap` would clip it or add the horizontal scroll back.
  Proper fix is JS: show the date, keep the time in a tooltip (the member-deposit date cell
  already works that way).
- **Not touched**: the Main panel's own shell, the agent portal, card layouts for phones
  (`member-card-list` still switches at 576 only), and the 24 pages that still scroll on a
  tablet-only width (a real pass, not a floor fix).
- **A 1560 window on online-users** previously scrolled 274px; it now shows 9 columns. The
  12-column view returns at 1820.

## 7. How to check any of it

```bash
node scripts/dev-harness.js 8125            # fake-data server the measurements used
node scripts/table-fit-audit.js --report    # TABLE-AUDIT.md from the cached sweep
node scripts/table-fit-audit.js --verify    # exit 1 while any page is CLIP
node scripts/check-asset-pins.js            # 12 stale refs, all pre-existing
node scripts/check-shell-drift.js           # OK
node scripts/check-global-collisions.js     # OK
```

Spot-check in a browser at 1440 / 1024 / 768: `index.html`, `livechat.html`,
`bank-deposit-usage.html`, `admin-operation-log.html`, `online-users.html`,
`payment-gateway.html` — dark and light.

## 8. Commits (this session, in order)

```
babf09de  Rebate Management: Order/Status column widths, 36px tab pills, a fit that actually fits
ef8352a6  Rebate Management: the table card the other pages have, in both themes
71e35d32  Rebate Management: one radius — 8px on the KPI strip, the schedule card and its cycles
f8c5cfa5  Rebate Approval: Show "-" fits the screen, and the current page is not greyed
266125dc  Rebate Log: Show "-" fits the screen, and the twelve columns stop overlapping
3a7cff7a  Daily Rebate Report: Show "-" as well; the other three pages already fit
1aa190bb  Live Chat: a tablet gets one pane at a time, and the thread fills the screen
57f31f3f  User Management: the filter bar is one row again
aa0f49fa  User Management: a table that fits a tablet, a 13" laptop and a desktop
079a7bf6  Responsive audit: every list page measured at 1440 / 1280 / 1024 / 768
1695ad2a  P0 follow-up: three pages fit by removing their floor, and CLIP was a false alarm
c73aadd2  Deposit Approval: toolbar, bank cards and table at laptop and tablet widths
d306e120  Bulk Adjustment: the member-picker buttons stop stretching on a tablet
0b71826d  Bank Deposit Usage: the floor stops growing as the window shrinks
a01a7bb5  Payment Gateway: the name column stops losing pixels at tablet widths
326dab03  Admin Operation Log: the seven columns fit, and SUCCESS stops clipping
249a656a  Online Users: twelve columns fit a laptop and a tablet again
```

**Not mine** (a second session working in the same clone, interleaved): `56f46383`,
`c952b09f`, `09a0b0f5` (rebate audit/batches/reconciliation + time-zone radius),
`3a39de16` (account avatar), `8b15162d` (promotion bonus buttons), `bf92a554` + `6eb2948f`
(shared header wrap / cell wrap + `detail-clamp`). Those two shared rules are what several of
my later fixes rely on; nothing of mine edits their files.
