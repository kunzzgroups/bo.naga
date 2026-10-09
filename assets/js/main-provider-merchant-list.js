/* Provider Report — the drill-down page: one provider's merchant list.

   Opened from the provider rows' eye on main_provider_report.html with
   `?providerCode=…&providerName=…&category=…&from=…&to=…&currency=…&back=…`, and rendered from
   the same endpoint that report reads, `/admin/main/reports/provider-settlement`: its `brands`
   rows are one per (merchant, provider), so filtering them by `providerCode` and grouping by
   `brandId` gives this provider's merchant list with the report's own money columns -
   turnover / house result / merchant receivable / pay to provider / company margin / bets.
   `Back to list` hands the range back to the report, which restores it on boot.

   The counterpart page is main-win-lose-merchant.html (one merchant -> its providers); this is
   the same block, read the other way round. Owner: "期望跳转页面 Provider Report 点击 眼睛 >
   跳转去 Merchant List 独立页面". */
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
  const count = (v) => Number(v || 0).toLocaleString('en-MY');
  const MARKS = ['', 'teal', 'violet', 'amber', 'rose', 'slate'];

  const params = new URLSearchParams(location.search);
  const providerCode = String(params.get('providerCode') || '').trim();
  const providerNameParam = params.get('providerName') || '';
  const categoryParam = params.get('category') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const backParam = params.get('back') || '';
  let currency = String(params.get('currency') || '').toUpperCase();

  let provider = null;
  let merchants = [];
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

  /* The way back is the way in: the report reads from/to from the URL, so the operator lands on
     the provider rows the eye was clicked on rather than on the report's defaults. `back` is the
     report's own URL (it carries `?merchant=` when the report was opened filtered by a merchant),
     so a link that came from somewhere else in the chain still unwinds one step at a time. */
  function backHref() {
    if (backParam && /^[^:]*\.html(\?|$)/.test(backParam)) {
      try {
        const u = new URL(backParam, location.href);
        if (u.origin === location.origin) return u.toString();
      } catch (e) { /* fall through to the report */ }
    }
    const u = new URL('main_provider_report.html', location.href);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    return u.toString();
  }

  function initials(name, code) {
    const raw = String(name || code || 'PV').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    const c = String(code || raw).replace(/[^A-Za-z0-9]/g, '');
    return (c.substring(0, 2) || 'PV').toUpperCase();
  }

  function markClass(i) {
    const m = MARKS[i % MARKS.length];
    return m ? (' is-' + m) : '';
  }

  function amountHtml(v) {
    const n = Number(v || 0);
    const cls = n > 0 ? 'is-pos' : n < 0 ? 'is-neg' : 'is-flat';
    const sign = n > 0 ? '+' : '';
    return `<span class="mre-ggr ${cls}"><b>${sign}${money(n)}</b></span>`;
  }

  /* The merchant's own page - its provider consumption - with this page as its way back, so the
     chain list -> merchant -> provider -> merchant list unwinds one step at a time. */
  function merchantPageUrl(m) {
    const u = new URL('main-win-lose-merchant.html', location.href);
    u.searchParams.set('brandId', m.id);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    u.searchParams.set('currency', currency);
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
    return merchants.map((m) => [
      m.name, m.code, m.turnover, m.gross, m.receivable, m.payable, m.margin, m.bets
    ]);
  }

  function excelRows() {
    const lines = [
      ['Period', 'Provider', 'Provider Code', 'Category', 'Currency'],
      [periodLabel(), provider?.name || '', provider?.code || providerCode, provider?.category || '', currency],
      [],
      ['Merchant', 'Merchant Code', 'Turnover', 'Gross Amount', 'Merchant Receivable', 'Pay to Provider', 'Company Margin', 'Bets']
    ];
    tableRows().forEach((r) => lines.push(r));
    lines.push(['Total', '', provider?.turnover || 0, provider?.gross || 0, provider?.receivable || 0, provider?.payable || 0, provider?.margin || 0, provider?.bets || 0]);
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
      ['Merchant', 'Code', 'Turnover', 'Gross Amount', 'Merchant Receivable', 'Pay to Provider', 'Company Margin', 'Bets'],
      ...tableRows()
    ];
    const blob = new Blob(['\ufeff' + toCsv(lines)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `merchant-list-${provider?.code || providerCode || 'provider'}-${from}-${to}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  /* ---------- render ---------- */

  function renderHead() {
    const name = provider?.name || providerNameParam || (providerCode ? `Provider ${providerCode}` : 'No provider selected');
    if ($('pmlName')) {
      $('pmlName').innerHTML = `${esc(name)}${provider?.code ? ` <span class="mmr-code">#${esc(provider.code)}</span>` : ''}`;
    }
    if ($('pmlMark')) $('pmlMark').textContent = initials(provider?.name || providerNameParam, provider?.code || providerCode);
    if ($('pmlMeta')) {
      $('pmlMeta').textContent = provider
        ? [provider.category, `${count(merchants.length)} merchant${merchants.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')
        : '—';
    }
    if ($('pmlPeriodText')) $('pmlPeriodText').textContent = periodLabel();
    if ($('pmlCurrency')) $('pmlCurrency').textContent = `(${currency})`;
    if ($('pmlBack')) $('pmlBack').href = backHref();
    if (name && providerCode) document.title = `${provider?.code || providerCode} · Merchant List`;
  }

  function renderSummary() {
    const box = $('pmlSummary');
    if (!box) return;
    /* No provider (no `providerCode`, or one the report does not know in this period) leaves no
       tiles to show; the strip would otherwise keep its 14px/4px padding as an empty band. */
    if (!provider) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.style.display = '';
    box.innerHTML = [
      summaryCard('Gross Amount', amountHtml(provider.gross), provider.turnover ? `${money(provider.turnover)} turnover` : ''),
      summaryCard('Provider Payable', money(provider.payable), provider.turnover ? `${money(payableShare())}% of turnover` : ''),
      summaryCard('Company Margin', amountHtml(provider.margin), ''),
      summaryCard('Merchant Receivable', amountHtml(provider.receivable), ''),
      summaryCard('Merchants', count(merchants.length), provider.bets ? `${count(provider.bets)} bets` : '')
    ].join('');
  }

  /* What the provider is paid per unit of turnover - the report's own rate, read off this
     provider's row. Against gross it would be meaningless: the gross column is a win/loss
     figure that can sit near zero while the payable stays large (measured 369% before this). */
  function payableShare() {
    const turnover = Math.abs(Number(provider?.turnover || 0));
    return turnover ? Math.abs(Number(provider.payable || 0)) / turnover * 100 : 0;
  }

  function renderTable() {
    const tbody = $('pmlRows');
    if (!tbody) return;
    if (!providerCode) {
      tbody.innerHTML = '<tr><td colspan="8" class="mad-empty">No provider was passed to this page — open it from the Provider Report\'s eye.</td></tr>';
      return;
    }
    if (!merchants.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="mad-empty">No merchants used this provider in the selected period.</td></tr>';
      return;
    }
    tbody.innerHTML = merchants.map((m) => {
      const same = String(m.name || '').toUpperCase() === String(m.code || '').toUpperCase();
      const codeLabel = m.code && !same ? `#${m.code}` : '';
      return `<tr>
        <td>
          <div class="mre-provider">
            <span class="mre-mark${m.mark}" aria-hidden="true">${esc(m.initials)}</span>
            <div class="mre-provider-copy">
              <b>${esc(m.name)}</b>
              ${codeLabel ? `<span class="mre-code">${esc(codeLabel)}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="mre-num"><b>${money(m.turnover)}</b></td>
        <td class="mre-num">${amountHtml(m.gross)}</td>
        <td class="mre-num"><b>${money(m.receivable)}</b></td>
        <td class="mre-num"><b>${money(m.payable)}</b></td>
        <td class="mre-num">${amountHtml(m.margin)}</td>
        <td class="mre-num"><b>${count(m.bets)}</b></td>
        <td><div class="mre-actions mad-actions">
          <a class="mad-icon-btn pml-merchant-open" href="${esc(merchantPageUrl(m))}" title="View merchant records" aria-label="View merchant records"><i class="bi bi-eye" aria-hidden="true"></i></a>
        </div></td>
      </tr>`;
    }).join('');
  }

  function render() {
    renderHead();
    renderSummary();
    renderTable();
    if ($('pmlTurnover')) $('pmlTurnover').textContent = money(provider?.turnover || 0);
    if ($('pmlHint')) {
      $('pmlHint').textContent = merchants.length
        ? `Turnover & settlement · ${merchants.length} merchant${merchants.length === 1 ? '' : 's'} · ready for Excel`
        : 'Turnover & settlement';
    }
    if ($('pmlCopy')) $('pmlCopy').disabled = !merchants.length;
    if ($('pmlCsv')) $('pmlCsv').disabled = !merchants.length;
  }

  /* The report's own normalisation, read per merchant: every raw row is one (merchant, provider)
     pair, so a group is that merchant's whole share of this provider. */
  function merchantFromRows(brandId, rows) {
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
    const code = String(first.brandCode || first.merchantCode || '');
    const name = first.brandName || first.merchantName || (code || `Merchant #${brandId}`);
    return { id: brandId, name, code, ...t };
  }

  async function load() {
    const seq = ++loadSeq;
    try {
      if ($('pmlRows')) {
        $('pmlRows').innerHTML = '<tr><td colspan="8" class="mad-empty">Loading merchants…</td></tr>';
      }
      const d = await api('/admin/main/reports/provider-settlement' + apiQuery());
      if (seq !== loadSeq) return;
      const code = providerCode.toUpperCase();
      const rows = (d.brands || []).filter(
        (x) => String(x.providerCode || x.vendorCode || '').trim().toUpperCase() === code
      );
      const providerRow = (d.providers || []).find(
        (x) => String(x.providerCode || '').trim().toUpperCase() === code
      ) || {};

      const byBrand = new Map();
      rows.forEach((x) => {
        const id = String(x.brandId ?? x.merchantId ?? x.id ?? '');
        if (!id) return;
        if (!byBrand.has(id)) byBrand.set(id, []);
        byBrand.get(id).push(x);
      });

      merchants = [...byBrand.entries()]
        .map(([id, list], i) => {
          const m = merchantFromRows(id, list);
          return {
            ...m,
            mark: markClass(i),
            initials: initials(m.name, m.code || id)
          };
        })
        .sort((a, b) => b.turnover - a.turnover);

      const totals = merchants.reduce((a, m) => {
        a.turnover += m.turnover;
        a.gross += m.gross;
        a.receivable += m.receivable;
        a.payable += m.payable;
        a.margin += m.margin;
        a.bets += m.bets;
        return a;
      }, { turnover: 0, gross: 0, receivable: 0, payable: 0, margin: 0, bets: 0 });

      /* The header's numbers are the report's own row for this provider when it is there (so the
         two pages cannot disagree), and the merchant rows' sums otherwise. */
      const known = !!(providerRow.providerCode || rows.length);
      provider = known ? {
        code: providerRow.providerCode || rows[0]?.providerCode || providerCode,
        name: providerNameParam || providerRow.providerName || rows[0]?.providerName || providerCode,
        category: categoryParam || providerRow.gameCategory || providerRow.categoryLabel || providerRow.category || rows[0]?.gameCategory || '',
        turnover: providerRow.turnover != null ? Number(providerRow.turnover) : totals.turnover,
        gross: providerRow.houseResult != null ? Number(providerRow.houseResult) : totals.gross,
        payable: providerRow.upstreamProviderPayable != null ? Number(providerRow.upstreamProviderPayable) : totals.payable,
        margin: providerRow.providerMargin != null ? Number(providerRow.providerMargin) : totals.margin,
        receivable: providerRow.brandCharge != null ? Number(providerRow.brandCharge) : totals.receivable,
        bets: totals.bets
      } : null;

      render();
    } catch (e) {
      console.error(e);
      merchants = [];
      provider = null;
      renderHead();
      renderSummary();
      const msg = /failed to fetch|networkerror|load failed/i.test(String(e.message || ''))
        ? 'Unable to reach server. Start local API on :8080 or open the BO on the same host as /api.'
        : (e.message || 'Unable to load the merchant list');
      if ($('pmlRows')) {
        $('pmlRows').innerHTML = `<tr><td colspan="8" class="mad-empty text-danger">${esc(msg)}</td></tr>`;
      }
      if ($('pmlTurnover')) $('pmlTurnover').textContent = money(0);
    }
  }

  function apiQuery() {
    return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(addDay(to))}`;
  }

  function setup() {
    BO_AUTH.requireLogin();
    currency = String(
      params.get('currency')
      || window.BO_MAIN_CURRENCY?.code?.()
      || sessionStorage.getItem('bo_main_report_currency')
      || 'MYR'
    ).toUpperCase();
    if ($('pmlCurrency')) $('pmlCurrency').textContent = `(${currency})`;
    $('pmlCopy')?.addEventListener('click', () => copyForExcel($('pmlCopy')));
    $('pmlCsv')?.addEventListener('click', downloadCsv);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
