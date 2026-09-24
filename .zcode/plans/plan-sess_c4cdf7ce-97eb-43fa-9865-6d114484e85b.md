## Design read (per the loaded skill)

**Reading this as: a dense internal admin backoffice for operators** — a dashboard/data-table product, which `design-taste-frontend` explicitly puts out of scope in its §13. So I am taking only its transferable parts: the **Shape Consistency Lock** (one radius system), the **Colour Consistency Lock** (one accent), the **Form Contrast Check**, and the anti-slop/a11y discipline. Its hero, bento, marquee and motion machinery does not apply here. Dials for this surface, reasoned from the brief: `DESIGN_VARIANCE 2` (predictable, operator-facing), `MOTION 2` (hover/active feedback only), `VISUAL_DENSITY 9` (cockpit).

## The one standard (measured on `bonus-category-title.html`, already in `reports.css` at HEAD)

- The field **is** the frame: `1px solid #EADCC8`, radius `8px`, height `36px`, padding `0 12px`, `display:flex; align-items:center; gap:8px`, fill `#FFF8EB` light / `#2A2C36` + `rgba(255,255,255,.12)` border in dark.
- The magnifier sits **inside** the frame as a flex child: 15px, `#78716C`.
- The inner input is borderless, `padding:0`, `height:100%`, `flex:1 1 auto`, 12px/700.
- Focus: `border-color:#D97706` + `box-shadow:0 0 0 3px rgba(217,119,6,.14)`.
- The field must be wide enough for its own placeholder (the 260px lesson: "Search username or display name" is 199px at 12px/700).

## Work plan

**0. Take the wheel from the in-flight agent.** A background agent is mid-flight on this task (harness built, audit run, nothing committed — no tracked file is newer than `4e0730ac`). Step one is to stop it or absorb its findings, so only one writer touches the tree.

**1. Sync with `main` and set the WIP aside.** `origin/main` is now **3 commits ahead**; AGENTS.md requires a rebase before pushing. The tree also holds the colleague's 15 uncommitted rail files, so: back them up (`.tmp-wip/` already holds patched copies), `git checkout HEAD --` them plus the ~150 pin-churn pages, then `git fetch && git rebase origin/main`. Conflicts are resolved by hand — the new upstream commits may touch the same pages, and "take mine" is not acceptable for someone else's work.

**2. Move the captions out of the fields** (~7 pages: `agent-management`, `bank-deposit-usage`, `agent-promotion-admin`, `provider-bet-report`, `manual-rebate-approval`, `admin-login-log` ×2, `index.html`). The caption becomes a `<label for>` **above** the field (or the input gains an `aria-label`), leaving the input the field's sole content. This is the whole markup change: once the `.field` has no `> label` child, the CSS already in `reports.css` (`.field:has(> input[placeholder*="earch" i]):not(:has(> label))` plus its `::before` magnifier) hands it the standard frame and icon automatically — one mechanism, no per-page CSS.

**3. Verify, per page, with measurement rather than assertion.**
- Re-run the site audit over all 51 pages that carry a search input (`.tmp-ac-review/measure-search.py`): **zero visible deviations** except the two exclusions below. Extend the probe to read `getComputedStyle(field, '::before').content` so it can see the CSS-drawn glyph (today it reports `icon: null`, which is blind to it).
- Screenshot every page I restructure (light) plus two in dark: frame 36/8, magnifier visible, caption above, placeholder **not** clipped, no double frame, no reflow damage to the filter row.
- Contrast, measured: placeholder and focus ring against the field fill, WCAG AA (4.5:1 body).
- Accessibility: every search input has an accessible name (visible `<label for>` or `aria-label`); the magnifier is decorative and must not be announced.

**4. Gate.** Family gate green in both themes (`verify-preview.py light` / `dark` → `PROBLEM PAGES: 0 of 13`), with the existing `searchField` assertions still covering 36px / radius 8 / `1px #DCC9A8` / `0 12px` / 12px/700 / no icon element.

**5. Commit, stamp, push.** Commit only my files (never `git add -A` while their work is on disk), then `scripts/stamp-asset-pins.py` with the WIP set aside and a separate pin commit, then push to `kunzzit01/dev` (rebasing if `main` moved again). Restore the colleague's 15 files afterwards and verify they still contain both the rail feature and my search blocks.

**6. Record in DESIGN.md**: the pass, the measured before/after, the two exclusions, and the skill's scope decision.

## Deliberate exclusions (your call, recorded, not silently skipped)

- `layout-section.html`'s 28px `.layout-find-query` (a compact find bar inside a code editor).
- `main-provider-health.html`'s filter toolbar (a row of filters, not a search well).

## Acceptance

Every search control on the site renders one design — 36px, radius 8px, `1px #EADCC8` frame, 15px `#78716C` magnifier inside, borderless input, amber focus ring — in light and dark, with zero measured deviations apart from the two exclusions; no clipped placeholder anywhere; AA contrast on placeholder and focus ring; every input accessibly named; family gate 0 of 13 in both themes; the colleague's work intact and uncommitted; everything pushed on `kunzzit01/dev` on top of a current `main`.

## Risks I will watch

- Moving captions can reflow a dense filter row — every changed page gets a screenshot, not a guess.
- `reports.css` is one of the colleague's WIP files: my two blocks live inside their diff, so I patch their aside copy in the same step (as done previously) rather than losing either side.
- The audit is blind to CSS-drawn glyphs unless I extend it (step 3), so "no icon" would otherwise read as a pass.
