#!/usr/bin/env node
/* Responsive audit of every list page in this repo: is the table's content reachable at laptop and tablet widths?

   For each page that contains a <table>, and each of 1440 / 1280 / 1024 / 768 px, this measures the table's own
   width against the box that holds it and reports one of three states:

     ✓       everything fits
     scroll  the content is wider than the box, but the box can be scrolled - reachable, ugly
     CLIP    the content is wider than the box and the box cannot be scrolled - the right-hand columns are
             simply unreachable. `wallet-ledger.html` was this: a 2056px table inside a 1018px overflow:hidden
             container. A horizontal scrollbar would have been the lesser bug.

   It also prints the table's computed `min-width`: where that is a fixed 1080/1240/1560px, the width is a
   number written into CSS rather than the content, which is the cheapest thing to fix (see index.html, whose
   1560px floor is now a column-by-column recipe).

   Pages are served by scripts/dev-harness.js (start it first: `node scripts/dev-harness.js 8125`). Pages the
   harness has no fake data for render their empty state, so a ✓ on those means "the empty table fits" - the
   report marks them as provisional.

   usage:
     node scripts/table-fit-audit.js                 # measure what is not cached yet, then write TABLE-AUDIT.md
     node scripts/table-fit-audit.js --report        # rewrite the report from the cache, measure nothing
     node scripts/table-fit-audit.js --verify        # exit 1 if any page is CLIP, print the list
     node scripts/table-fit-audit.js 20              # measure at most 20 pages this run (resumes next time)

   The cache is .tmp-table-audit.json (.gitignore already excludes .tmp-*). */
'use strict';
const fs = require('fs');
const path = require('path');
const cdp = require('./lib/headless-cdp.js');

const CACHE = '.tmp-table-audit.json';
const REPORT = 'TABLE-AUDIT.md';
const WIDTHS = [1440, 1280, 1024, 768];
const HEIGHT = 900;
const BASE = process.env.BO_AUDIT_BASE || 'http://127.0.0.1:8125';
const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const verify = args.includes('--verify');
const limit = Number(args.find((a) => /^\d+$/.test(a))) || Infinity;

const PAGES = fs.readdirSync(path.join(__dirname, '..'))
  .filter((f) => f.endsWith('.html') && !f.startsWith('_') && fs.readFileSync(path.join(__dirname, '..', f), 'utf8').includes('<table'))
  .sort();

const PROBE = `
  return (async () => {
    const out = [];
    for (const t of document.querySelectorAll('table')) {
      if (!t.offsetParent) continue;
      const r = t.getBoundingClientRect();
      if (r.width < 40) continue;
      let el = t.parentElement, box = null;
      while (el && el !== document.documentElement) {
        const c = getComputedStyle(el);
        if (/auto|scroll/.test(c.overflowX) || /hidden|clip/.test(c.overflowX) || /hidden|clip/.test(c.overflow)) {
          box = el; break;
        }
        el = el.parentElement;
      }
      const cs = getComputedStyle(t);
      const item = {
        tableW: Math.round(r.width),
        cols: t.querySelectorAll('thead th').length || t.querySelectorAll('tbody tr:first-child td').length,
        minW: cs.minWidth,
        boxW: box ? box.clientWidth : null,
        hidden: box ? Math.max(0, box.scrollWidth - box.clientWidth) : 0,
        canScroll: box ? /auto|scroll/.test(getComputedStyle(box).overflowX) : true,
        synced: false,
        noData: !!t.querySelector('tbody td.table-empty, tbody td[colspan]'),
      };
      /* A head table whose wrapper clips can still be reached: the wide listing pattern mounts a head wrapper with
         overflow:hidden above a body wrapper with overflow-x:auto, and a scroll listener mirrors body.scrollLeft
         onto the head. Test it - scroll the nearest scrolling sibling and see whether the clipped box followed -
         instead of calling it unreachable on its overflow value alone. */
      if (box && item.hidden > 0 && !item.canScroll) {
        let scope = box.parentElement, scroller = null, hops = 0;
        while (scope && hops++ < 4 && !scroller) {
          scroller = [...scope.querySelectorAll('*')].find((n) => {
            const c = getComputedStyle(n);
            return /auto|scroll/.test(c.overflowX) && n.scrollWidth > n.clientWidth + 1;
          }) || null;
          scope = scope.parentElement;
        }
        if (scroller) {
          const before = box.scrollLeft;
          scroller.scrollLeft = 200;
          await new Promise((done) => setTimeout(done, 150));
          item.synced = box.scrollLeft !== before;
          scroller.scrollLeft = 0;
          await new Promise((done) => setTimeout(done, 60));
        }
      }
      out.push(item);
    }
    return {
      docOver: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      tables: out.slice(0, 3),
      worst: out.reduce((a, x) => (x.hidden > (a ? a.hidden : 0) ? x : a), null),
    };
  })()
`;

const stateAt = (rec, w) => {
  const r = rec[w];
  if (!r) return { state: 'ERR', n: 0 };
  const hidden = Math.max(r.docOver, r.worst ? r.worst.hidden : 0);
  if (!hidden) return { state: 'ok', n: 0 };
  const reachable = r.docOver > 0 ? false : (r.worst ? (r.worst.canScroll || r.worst.synced) : true);
  return { state: reachable ? 'scroll' : 'clip', n: hidden };
};

function summarize(data) {
  const rows = [];
  for (const [page, rec] of Object.entries(data)) {
    const cells = WIDTHS.map((w) => stateAt(rec, w));
    const worst = cells.some((c) => c.state === 'clip') ? 'clip'
      : cells.some((c) => c.state === 'scroll') ? 'scroll'
      : cells.some((c) => c.state === 'ERR') ? 'ERR' : 'ok';
    const t = WIDTHS.map((w) => rec[w] && rec[w].worst).find(Boolean) || null;
    const provisional = WIDTHS.every((w) => !rec[w] || !rec[w].tables.length || (rec[w].worst && rec[w].worst.noData));
    rows.push({ page, cells, worst, cols: t ? t.cols : null, minW: t ? t.minW : null, provisional });
  }
  const rank = (r) => {
    const i = r.cells.findIndex((c) => c.state !== 'ok');
    return i < 0 ? 99 : i;
  };
  const sum = (r) => r.cells.reduce((s, c) => s + c.n, 0);
  const byWorstFirst = (a, b) => rank(a) - rank(b) || sum(b) - sum(a);
  return {
    rows,
    p0: rows.filter((r) => r.worst === 'clip').sort(byWorstFirst),
    p1: rows.filter((r) => r.worst === 'scroll' && (r.cells[0].state !== 'ok' || r.cells[1].state !== 'ok')).sort(byWorstFirst),
    p2: rows.filter((r) => r.worst === 'scroll' && r.cells[0].state === 'ok' && r.cells[1].state === 'ok').sort(byWorstFirst),
    ok: rows.filter((r) => r.worst === 'ok').sort((a, b) => a.page.localeCompare(b.page)),
    err: rows.filter((r) => r.worst === 'ERR'),
  };
}

function markdown(s) {
  const fmt = (r) => r.cells.map((c) => (c.state === 'ok' ? '✓' : (c.state === 'clip' ? 'CLIP ' : 'scroll ') + c.n)).join(' | ');
  const first = (r) => WIDTHS[r.cells.findIndex((c) => c.state !== 'ok')] ?? '—';
  const line = (r) => `| \`${r.page}\` | ${r.cols ?? '?'} | ${r.minW && r.minW !== '0px' ? r.minW : '—'} | ${fmt(r)} | ${first(r)} |`;
  const head = '| page | cols | hard min-width | 1440 \\| 1280 \\| 1024 \\| 768 | first broken |\n|---|---|---|---|---|';
  const h = '| page | cols | hard min-width | 1440 \\| 1280 \\| 1024 \\| 768 | first broken |\n|---|---|---|---|---|';
  return `# List-page responsive audit

Generated by \`node scripts/table-fit-audit.js\` — a headless-Chrome sweep of every page in this repo that contains
a \`<table>\` (${s.rows.length} pages), at 1440 / 1280 / 1024 / 768 px wide and 900 px tall, dark theme. Pages the
local fake-data server does not answer render their empty state, so a ✓ there means "the empty table fits"; those
rows are marked *(empty)* in the last section and their ✓ is provisional.

- **CLIP** — the table is wider than its container, the container cannot be scrolled by the user, AND scrolling the
  page's other scroll box does not move it: the columns on the right are unreachable. The wide-listing pattern in
  this repo mounts a head wrapper with overflow:hidden above a body wrapper that scrolls, and a scroll listener
  mirrors body.scrollLeft onto the head, so the test scrolls the nearest scrolling sibling and checks whether the
  clipped box followed before calling it unreachable.
- **scroll** — the content is wider, but reachable by dragging a horizontal scrollbar.
- **hard min-width** — the table's computed \`min-width\`. Where that is a fixed 1080/1240/1560px the width is a
  number written into CSS, not the content, which is the cheapest kind to remove.

## Totals

| state | pages |
|---|---|
| CLIP (unreachable) | ${s.p0.length} |
| scroll at 1440 or 1280 (laptop) | ${s.p1.length} |
| scroll only at 1024 / 768 (tablet) | ${s.p2.length} |
| fits at every width | ${s.ok.length} |
${s.err.length ? `| could not load | ${s.err.length} |\n` : ''}
## P0 — clipped, content unreachable

${s.p0.length ? head + '\n' + s.p0.map(line).join('\n') : '_None._ Every table wider than its box can be reached, in its own box or through the head/body mirror.'}

## P1 — horizontal scroll on a laptop (1440 / 1280)

${h}
${s.p1.map(line).join('\n')}

## P2 — horizontal scroll only on a tablet (1024 / 768)

${h}
${s.p2.map(line).join('\n')}

## Fits at every width

${s.ok.map((r) => '`' + r.page + '`' + (r.provisional ? ' *(empty)*' : '')).join(', ')}
`;
}

(async () => {
  const dir = path.join(__dirname, '..');
  const data = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const todo = reportOnly ? [] : PAGES.filter((p) => !data[p]).slice(0, limit);

  if (todo.length) {
    const b = await cdp.launch({ width: WIDTHS[0], height: HEIGHT });
    const page = await b.newPage();
    try {
      for (const file of todo) {
        const rec = {};
        for (const w of WIDTHS) {
          await page.setViewport(w, HEIGHT, 1);
          let ok = true;
          try { await page.goto(`${BASE}/${file}?theme=dark`, { waitFor: "document.querySelector('table')", timeout: 9000 }); }
          catch { ok = false; }
          await cdp.sleep(260);
          rec[w] = ok ? await page.evaluate(PROBE).catch(() => null) : null;
        }
        data[file] = rec;
        fs.writeFileSync(path.join(dir, CACHE), JSON.stringify(data));
        const s = summarize({ [file]: rec }).rows[0];
        console.log(file.padEnd(36), WIDTHS.map((w, i) => `${w}=${s.cells[i].state === 'ok' ? 'ok' : s.cells[i].state + ':' + s.cells[i].n}`).join(' '));
      }
    } finally { await b.close(); }
  }

  const summary = summarize(data);
  const p0list = summary.p0.map((r) => { const i = r.cells.findIndex((c) => c.state !== 'ok'); return `${r.page} (${r.cells[i].n}px at ${WIDTHS[i]}px)`; });
  console.log(`\nmeasured ${Object.keys(data).length}/${PAGES.length} pages · CLIP ${summary.p0.length} · laptop-scroll ${summary.p1.length} · tablet-scroll ${summary.p2.length} · fits ${summary.ok.length}`);
  if (summary.p0.length) console.log('CLIP:\n  ' + p0list.join('\n  '));

  if (!verify) {
    fs.writeFileSync(path.join(dir, REPORT), markdown(summary));
    console.log(`wrote ${REPORT}`);
  }
  if (verify && summary.p0.length) process.exit(1);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
