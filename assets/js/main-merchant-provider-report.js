/* Provider Report — the drill-down page: one merchant's providers.

   Opened from the Merchant List's row eye (main-provider-merchant-list.html) with
   `?brandId=…&from=…&to=…&currency=…&back=…`, and rendered from the same endpoint the report
   reads, `/admin/main/reports/provider-settlement`: its `brands` rows are one per
   (merchant, provider), so filtering them by `brandId` and grouping by `providerCode` gives
   this merchant's provider lines with the report's own money columns - turnover / house result
   (Gross Amount) / merchant receivable / pay to provider / company margin / bets.
   `Back to list` returns to the Merchant List it came from (through `back`), which itself leads
   back to the Provider Report.

   The twin of this page is main-provider-merchant-list.html (one provider -> its merchants);
   this is the same block read the other way round. Owner: "应该是merchant的provider report吧
   单独的". */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const money = (v) => Number(v || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  /* The copy hands numbers to the spreadsheet, not strings: the page's own sums are floats, so a
     pasted total could read 519.5799999999999 against the page's 519.58 (measured). Two decimals,
     exactly what the page shows. */
  const n2 = (v) => Math.round(Number(v || 0) * 100) / 100;
  const count = (v) => Number(v || 0).toLocaleString('en-MY');
  const MARKS = ['', 'teal', 'violet', 'amber', 'rose', 'slate'];

  const params = new URLSearchParams(location.search);
  const brandId = String(params.get('brandId') || '').trim();
  const merchantNameParam = params.get('merchantName') || '';
  /* `let`, not `const`: the range is editable on this page (MAIN_DATE_RANGE), so these move with
     the picker - the query, the heading and Back to list all follow them. */
  let from = params.get('from') || '';
  let to = params.get('to') || '';
  const backParam = params.get('back') || '';
  let currency = String(params.get('currency') || '').toUpperCase();

  let merchant = null;
  let providers = [];
  let loadSeq = 0;

  async function api(path) {
    const r = await fetch(API_CONFIG.BASE_URL + path, {
      headers: { ...BO_AUTH.authHeader(), 'X-Brand-Id': '1' },
      cache: 'no-store'
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.status === 'error') throw Error(j.message || 'Request failed');
    return j.data ?? j;
  }

  function addDay(v) {
    const a = String(v || '').split('-').map(Number);
    if (a.length !== 3 || !a[0]) return v;
    return new Date(Date.UTC(a[0], a[1] - 1, a[2] + 1)).toISOString().slice(0, 10);
  }

  function periodLabel() {
    return from && to ? `${from} ~ ${to}` : (from || to || '—');
  }

  /* The way back is the way in: `back` is the Merchant List this eye was clicked on, so the chain
     Provider Report -> Merchant List -> this page unwinds one step at a time. Without it the
     report itself is the parent. */
  function backHref() {
    /* The range comes back up the chain: whatever period is set here is the one the page behind
       this one (the Merchant List, or the report) returns to. */
    const apply = (u) => {
      if (from) u.searchParams.set('from', from);
      if (to) u.searchParams.set('to', to);
      return u.toString();
    };
    if (backParam && /^[^:]*\.html(\?|$)/.test(backParam)) {
      try {
        const u = new URL(backParam, location.href);
        if (u.origin === location.origin) return apply(u);
      } catch (e) { /* fall through to the report */ }
    }
    return apply(new URL('main_provider_report.html', location.href));
  }

  function initials(name, code) {
    const raw = String(name || code || 'MC').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    const c = String(code || raw).replace(/[^A-Za-z0-9]/g, '');
    return (c.substring(0, 2) || 'MC').toUpperCase();
  }

  function markClass(i) {
    const m = MARKS[i % MARKS.length];
    return m ? (' is-' + m) : '';
  }

  /* The Game Category column reads the same way the report's own does
     (`main-provider-report.js:101-114`): a hint from the row's fields when there is one, and the
     same brandCount heuristic when there is not - which is the usual case, because the
     `brands` rows carry no category at all and the aggregated `providers` row may not either
     (owner, on this page: "没有 game category" - every row read `—`). Copying the derivation, not
     the raw field, is what keeps the two pages showing the same word. */
  function categoryKey(x) {
    const hint = String(x.category || x.gameCategory || x.providerType || x.desc || '').toLowerCase();
    if (/live/.test(hint) && /slot/.test(hint)) return 'mixed';
    if (/live|casino/.test(hint)) return 'live';
    if (/sport/.test(hint)) return 'sports';
    if (/slot/.test(hint)) return 'slots';
    const brands = Number(x.brandCount || 0);
    if (brands >= 4) return 'mixed';
    if (brands >= 2) return 'live';
    return 'slots';
  }

  function categoryLabel(key) {
    return ({ slots: 'Slots', live: 'Live Casino', sports: 'Sports', mixed: 'Slots & Live Casino' })[key] || 'Game Provider';
  }

  function tierKey(x) {
    const t = x.tier ?? x.merchantTier ?? x.brandTier ?? x.level ?? x.planType;
    const s = String(t || '').toLowerCase();
    if (s === 'wl' || /white\s*label|vip\s*label|whitelabel/.test(s)) return 'wl';
    if (t === 1 || t === '1' || /tier\s*1|enterprise/.test(s)) return '1';
    if (t === 2 || t === '2' || /tier\s*2|premium|growth/.test(s)) return '2';
    if (t === 3 || t === '3' || /tier\s*3|standard/.test(s)) return '3';
    return '3';
  }

  function tierLabel(key) {
    return ({
      1: 'Tier 1 Enterprise',
      2: 'Tier 2 Premium',
      3: 'Tier 3 Standard',
      wl: 'White Label VIP'
    })[key] || 'Tier 3 Standard';
  }

  function amountHtml(v) {
    const n = Number(v || 0);
    const cls = n > 0 ? 'is-pos' : n < 0 ? 'is-neg' : 'is-flat';
    const sign = n > 0 ? '+' : '';
    return `<span class="mre-ggr ${cls}"><b>${sign}${money(n)}</b></span>`;
  }

  /* The provider's own page - the BO's Provider Win/Loss Report, filtered to this provider and
     carrying this page as its way back, which is the same step the merchant page's provider rows
     take. */
  function providerReportUrl(p) {
    const u = new URL('casino-provider-winloss-report.html', location.href);
    u.searchParams.set('providerCode', p.code || '');
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    u.searchParams.set('back', location.pathname + location.search);
    return u.toString();
  }

  function summaryCard(label, value, hint) {
    return `<div class="report-summary-card">
      <small>${esc(label)}</small>
      <strong>${value}</strong>
      ${hint ? `<span>${esc(hint)}</span>` : ''}
    </div>`;
  }

  /* ---------- the table's own copy / download, as the report's other panels have ---------- */

  function tableRows() {
    return providers.map((p) => [
      p.name, p.code, p.category, n2(p.turnover), n2(p.gross), n2(p.receivable), n2(p.payable), n2(p.margin), p.bets
    ]);
  }

  /* The paste starts at the table itself: the Period / Merchant / Tier / Currency row that used to
     head it is not wanted in the spreadsheet (owner: "这个被框中的部分我不要被copy到"). The page
     and the CSV's file name still carry which merchant and which range this is. */
  function excelRows() {
    const lines = [
      ['Provider', 'Provider Code', 'Game Category', 'Turnover', 'Gross Amount', 'Merchant Receivable', 'Pay to Provider', 'Company Margin', 'Bets']
    ];
    tableRows().forEach((r) => lines.push(r));
    lines.push(['Total', '', '', n2(merchant?.turnover), n2(merchant?.gross), n2(merchant?.receivable), n2(merchant?.payable), n2(merchant?.margin), merchant?.bets || 0]);
    return lines;
  }

  function toTsv(lines) {
    return lines.map((row) => row.map((v) => {
      const s = String(v ?? '');
      if (/[\t\n\r"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join('\t')).join('\r\n');
  }

  function toCsv(lines) {
    return lines.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  function flashCopyBtn(btn, ok) {
    if (!btn) return;
    const label = btn.innerHTML;
    btn.classList.toggle('is-copied', ok);
    btn.innerHTML = ok
      ? '<i class="bi bi-check2" aria-hidden="true"></i> Copied'
      : '<i class="bi bi-x-lg" aria-hidden="true"></i> Copy failed';
    setTimeout(() => {
      btn.classList.remove('is-copied');
      btn.innerHTML = label;
    }, 1400);
  }

  async function copyForExcel(btn) {
    try {
      await copyText(toTsv(excelRows()));
      flashCopyBtn(btn, true);
    } catch (e) {
      console.error(e);
      flashCopyBtn(btn, false);
    }
  }

  function downloadCsv() {
    const lines = [
      ['Provider', 'Code', 'Game Category', 'Turnover', 'Gross Amount', 'Merchant Receivable', 'Pay to Provider', 'Company Margin', 'Bets'],
      ...tableRows()
    ];
    const blob = new Blob(['\ufeff' + toCsv(lines)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `provider-report-${merchant?.code || brandId || 'merchant'}-${from}-${to}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  /* ---------- render ---------- */

  function renderHead() {
    const name = merchant?.name || merchantNameParam || (brandId ? `Merchant #${brandId}` : 'No merchant selected');
    if ($('mprName')) {
      $('mprName').innerHTML = `${esc(name)}${merchant?.code ? ` <span class="mmr-code">#${esc(merchant.code)}</span>` : ''}`;
    }
    if ($('mprMark')) $('mprMark').textContent = initials(merchant?.name || merchantNameParam, merchant?.code || brandId);
    if ($('mprMeta')) {
      $('mprMeta').textContent = merchant
        ? [merchant.tierLabel, `${count(providers.length)} provider${providers.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')
        : '—';
    }
    if ($('mprCurrency')) $('mprCurrency').textContent = `(${currency})`;
    if ($('mprBack')) $('mprBack').href = backHref();
    if (name && brandId) document.title = `${name} · Provider Report`;
  }

  function renderSummary() {
    const box = $('mprSummary');
    if (!box) return;
    /* No merchant (no `brandId`, or one the report does not know in this period) leaves no tiles
       to show; the strip would otherwise keep its padding as an empty band. */
    if (!merchant) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.style.display = '';
    box.innerHTML = [
      summaryCard('Gross Amount', amountHtml(merchant.gross), merchant.turnover ? `${money(merchant.turnover)} turnover` : ''),
      summaryCard('Provider Payable', money(merchant.payable), merchant.turnover ? `${money(payableShare())}% of turnover` : ''),
      summaryCard('Company Margin', amountHtml(merchant.margin), ''),
      summaryCard('Merchant Receivable', amountHtml(merchant.receivable), ''),
      summaryCard('Providers', count(providers.length), merchant.bets ? `${count(merchant.bets)} bets` : '')
    ].join('');
  }

  /* What the merchant pays the providers per unit of turnover - against gross it would be
     meaningless, because the gross column is a win/loss figure that can sit near zero while the
     payable stays large. */
  function payableShare() {
    const turnover = Math.abs(Number(merchant?.turnover || 0));
    return turnover ? Math.abs(Number(merchant.payable || 0)) / turnover * 100 : 0;
  }

  function renderTable() {
    const tbody = $('mprRows');
    if (!tbody) return;
    if (!brandId) {
      tbody.innerHTML = '<tr><td colspan="9" class="mad-empty">No merchant was passed to this page — open it from the Merchant List\'s eye.</td></tr>';
      return;
    }
    if (!providers.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="mad-empty">No provider rows for this merchant in the selected period.</td></tr>';
      return;
    }
    tbody.innerHTML = providers.map((p) => {
      const same = String(p.name || '').toUpperCase() === String(p.code || '').toUpperCase();
      const codeLabel = p.code && !same ? `#${p.code}` : '';
      return `<tr>
        <td>
          <div class="mre-provider">
            <span class="mre-mark${p.mark}" aria-hidden="true">${esc(p.initials)}</span>
            <div class="mre-provider-copy">
              <b>${esc(p.name)}</b>
              ${codeLabel ? `<span class="mre-code">${esc(codeLabel)}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="mre-category">${esc(p.category || '—')}</td>
        <td class="mre-num"><b>${money(p.turnover)}</b></td>
        <td class="mre-num">${amountHtml(p.gross)}</td>
        <td class="mre-num"><b>${money(p.receivable)}</b></td>
        <td class="mre-num"><b>${money(p.payable)}</b></td>
        <td class="mre-num">${amountHtml(p.margin)}</td>
        <td class="mre-num"><b>${count(p.bets)}</b></td>
        <td><div class="mre-actions mad-actions">
          <a class="mad-icon-btn mpr-provider-open" href="${esc(providerReportUrl(p))}" title="View provider report" aria-label="View provider report"><i class="bi bi-eye" aria-hidden="true"></i></a>
        </div></td>
      </tr>`;
    }).join('');
  }

  function render() {
    renderHead();
    renderSummary();
    renderTable();
    if ($('mprTurnover')) $('mprTurnover').textContent = money(merchant?.turnover || 0);
    if ($('mprHint')) {
      $('mprHint').textContent = providers.length
        ? `Turnover & settlement · ${providers.length} provider${providers.length === 1 ? '' : 's'} · ready for Excel`
        : 'Turnover & settlement';
    }
    if ($('mprCopy')) $('mprCopy').disabled = !providers.length;
    if ($('mprCsv')) $('mprCsv').disabled = !providers.length;
  }

  /* The report's own normalisation, read per provider: every raw row is one (merchant, provider)
     pair, so a group is this merchant's whole line for that provider. */
  function providerFromRows(code, rows) {
    const first = rows[0] || {};
    const t = { turnover: 0, gross: 0, receivable: 0, payable: 0, margin: 0, bets: 0 };
    rows.forEach((x) => {
      t.turnover += Number(x.turnover || 0);
      t.gross += Number(x.houseResult || 0);
      t.receivable += Number(x.brandCharge || 0);
      t.payable += Number(x.providerPayableShare ?? x.upstreamProviderPayable ?? 0);
      t.margin += Number(x.platformMargin ?? x.providerMargin ?? 0);
      t.bets += Number(x.betCount || x.txnCount || 0);
    });
    return {
      code,
      name: first.providerName || first.vendorName || code,
      ...t
    };
  }

  async function load() {
    const seq = ++loadSeq;
    try {
      if ($('mprRows')) {
        $('mprRows').innerHTML = '<tr><td colspan="9" class="mad-empty">Loading providers…</td></tr>';
      }
      const [d, directory] = await Promise.all([
        api('/admin/main/reports/provider-settlement' + apiQuery()),
        api('/admin/merchants').catch(() => api('/admin/brands').catch(() => []))
      ]);
      if (seq !== loadSeq) return;
      const rows = (d.brands || []).filter(
        (x) => String(x.brandId ?? x.merchantId ?? x.id ?? '') === brandId
      );
      const meta = (Array.isArray(directory) ? directory : (directory?.rows || directory?.items || []))
        .find((m) => String(m.id ?? m.brandId ?? '') === brandId) || {};
      const globalByCode = new Map(
        (d.providers || []).map((x) => [String(x.providerCode || '').toUpperCase(), x])
      );

      const byProvider = new Map();
      rows.forEach((x) => {
        const code = String(x.providerCode || x.vendorCode || '').trim();
        if (!code) return;
        const key = code.toUpperCase();
        if (!byProvider.has(key)) byProvider.set(key, []);
        byProvider.get(key).push(x);
      });

      providers = [...byProvider.entries()]
        .map(([key, list], i) => {
          const p = providerFromRows(key, list);
          const global = globalByCode.get(key) || {};
          return {
            ...p,
            /* The provider's own row wins where it exists (it carries brandCount, which the
               heuristic needs); without one the pair's fields answer. */
            category: categoryLabel(categoryKey({ ...list[0], ...global })),
            name: p.name || global.providerName || key,
            mark: markClass(i),
            initials: initials(p.name || global.providerName, key)
          };
        })
        .sort((a, b) => b.turnover - a.turnover);

      const totals = providers.reduce((a, p) => {
        a.turnover += p.turnover;
        a.gross += p.gross;
        a.receivable += p.receivable;
        a.payable += p.payable;
        a.margin += p.margin;
        a.bets += p.bets;
        return a;
      }, { turnover: 0, gross: 0, receivable: 0, payable: 0, margin: 0, bets: 0 });

      const seed = rows[0] || {};
      const code = String(meta.code || meta.brandCode || seed.brandCode || seed.merchantCode || '');
      const name = meta.name || meta.brandName || seed.brandName || seed.merchantName || merchantNameParam || '';
      const known = !!(rows.length || meta.id || name);
      merchant = known ? {
        id: brandId,
        code,
        name: name || code || `Merchant #${brandId}`,
        tierLabel: tierLabel(tierKey({ ...seed, ...meta })),
        ...totals
      } : null;

      render();
    } catch (e) {
      console.error(e);
      providers = [];
      merchant = null;
      renderHead();
      renderSummary();
      const msg = /failed to fetch|networkerror|load failed/i.test(String(e.message || ''))
        ? 'Unable to reach server. Start local API on :8080 or open the BO on the same host as /api.'
        : (e.message || 'Unable to load the provider report');
      if ($('mprRows')) {
        $('mprRows').innerHTML = `<tr><td colspan="9" class="mad-empty text-danger">${esc(msg)}</td></tr>`;
      }
      if ($('mprTurnover')) $('mprTurnover').textContent = money(0);
    }
  }

  function apiQuery() {
    return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(addDay(to))}`;
  }

  /* The same date field its twins carry: `main-exec-date-range.js` reads `from`/`to` from the URL
     and calls back on every change, so the range can be moved here instead of a level up. */
  function setupRange() {
    if (!window.MAIN_DATE_RANGE) return;
    MAIN_DATE_RANGE.init({
      prefix: 'mpr',
      defaultPreset: 'today',
      onChange: (a, b) => {
        from = a; to = b;
        const u = new URL(location.href);
        if (a) u.searchParams.set('from', a);
        if (b) u.searchParams.set('to', b);
        history.replaceState(null, '', u);
        load();
      }
    });
  }

  function setup() {
    BO_AUTH.requireLogin();
    currency = String(
      params.get('currency')
      || window.BO_MAIN_CURRENCY?.code?.()
      || sessionStorage.getItem('bo_main_report_currency')
      || 'MYR'
    ).toUpperCase();
    if ($('mprCurrency')) $('mprCurrency').textContent = `(${currency})`;
    setupRange();
    $('mprCopy')?.addEventListener('click', () => copyForExcel($('mprCopy')));
    $('mprCsv')?.addEventListener('click', downloadCsv);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
