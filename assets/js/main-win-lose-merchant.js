/* Win/Lose Report — the drill-down page: one merchant's provider consumption.

   Opened from the list's eye with `?brandId=…&from=…&to=…` (plus `pill`/`tier`/`status`/`q`,
   the list's own filters) and rendered from the same endpoint the list reads:
   `/admin/main/reports/provider-settlement`. `Back to list` hands the range and those filters
   back to main-win-lose-report.html, which restores them on boot — the two pages share one
   workspace state, which is the point of a drill-down.

   This is the block that used to expand inline on the list (main-win-lose-report.js), moved
   to a page of its own: the same table, the same Copy report / CSV actions. */
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
  const MARKS = ['', 'teal', 'violet', 'amber', 'rose', 'slate'];

  const params = new URLSearchParams(location.search);
  const brandId = params.get('brandId') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
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

  /* The way back is the way in: the list reads from/to (main-exec-date-range.js reads them
     from the URL) and the four filters below, so the operator lands on the rows the eye was
     clicked on rather than on the list's defaults. A `back` parameter wins - it is the page
     that linked here (the Provider Report's merchant list, whose own eye opens this page), so
     each step of the chain unwinds one at a time. */
  function backHref() {
    const back = params.get('back') || '';
    if (back && /^[^:]*\.html(\?|$)/.test(back)) {
      try {
        const u = new URL(back, location.href);
        if (u.origin === location.origin) return u.toString();
      } catch (e) { /* fall through to the list */ }
    }
    const u = new URL('main-win-lose-report.html', location.href);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    ['pill', 'tier', 'status', 'q'].forEach((k) => {
      const v = params.get(k);
      if (v) u.searchParams.set(k, v);
    });
    return u.toString();
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

  function tierKey(x) {
    const t = x.tier ?? x.merchantTier ?? x.brandTier ?? x.level ?? x.planType;
    const s = String(t || '').toLowerCase();
    if (s === 'wl' || /white\s*label|vip\s*label|whitelabel/.test(s)) return 'wl';
    if (t === 1 || t === '1' || /tier\s*1|enterprise/.test(s)) return '1';
    if (t === 2 || t === '2' || /tier\s*2|premium|growth/.test(s)) return '2';
    if (t === 3 || t === '3' || /tier\s*3|standard/.test(s)) return '3';
    const charge = Math.abs(Number(x.brandCharge || x.turnover || x.totalBet || 0));
    if (charge >= 1000000) return '1';
    if (charge >= 100000) return '2';
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

  /* Same normalisation as the list's row: one metric shape for a brand row, whoever wrote it. */
  function metricFromRow(x) {
    const bet = Number(x.totalBet != null ? x.totalBet : (x.turnover || 0));
    const valid = Number(
      x.validBet != null ? x.validBet : (x.totalValidBet != null ? x.totalValidBet : bet)
    );
    const wl = Number(
      x.houseResult != null
        ? x.houseResult
        : (x.winLose != null ? x.winLose : (x.totalWinLose != null ? x.totalWinLose : (x.netGamingResult || 0)))
    );
    const out = Number(x.totalOut != null ? x.totalOut : Math.max(valid - wl, 0));
    const inn = Number(x.totalIn != null ? x.totalIn : (out + wl));
    return { bet, valid, inn, out: Math.max(out, 0), wl, txns: Number(x.betCount || x.txnCount || 0) };
  }

  function winLoseHtml(v) {
    const n = Number(v || 0);
    const cls = n > 0 ? 'is-pos' : n < 0 ? 'is-neg' : 'is-flat';
    const sign = n > 0 ? '+' : '';
    return `<span class="mmr-wl wl-wl ${cls}"><b>${sign}${money(n)}</b></span>`;
  }

  function shareHtml(pct) {
    const n = Math.max(0, Math.min(100, Number(pct) || 0));
    return `<div class="wl-share-cell" title="${money(n)}%">
      <b>${money(n)}%</b>
      <span class="wl-share-track" aria-hidden="true"><i style="width:${n.toFixed(2)}%"></i></span>
    </div>`;
  }

  /* The provider's own report: the BO's Provider Win/Loss Report (`casino-provider-winloss-report.html`),
     opened filtered to this provider - that page reads `providerCode` into its daily-row filter and
     takes the range from the URL, so the table is this provider's day-by-day bet / win-loss. */
  function providerReportUrl(p) {
    const u = new URL('casino-provider-winloss-report.html', location.href);
    u.searchParams.set('providerCode', p.code || '');
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    /* One step back: this page with its own state, so its `Back to list` still leads to the
       report list, and the operator returns to the merchant they were inspecting. */
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

  /* ---------- the table's own copy / download, as the list's block had ---------- */

  /* The paste starts at the table itself: this used to be headed by a
     Period / Merchant / Merchant Code / Currency row, which the operator does not want in the
     spreadsheet (owner: "这个被框中的部分我不要被copy到"). The page - and the CSV's file name -
     still carry which merchant and which range this is. */
  function excelRows() {
    const lines = [
      ['Provider', 'Total Bet', 'Total ValidBet', 'Total In', 'Total Out', 'Win/Lose']
    ];
    providers.forEach((p) => {
      lines.push([p.code || p.name || '', n2(p.totalBet), n2(p.validBet), n2(p.totalIn), n2(p.totalOut), n2(p.winLose)]);
    });
    lines.push(['Total', n2(merchant?.totalBet), n2(merchant?.validBet), n2(merchant?.totalIn), n2(merchant?.totalOut), n2(merchant?.winLose)]);
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
      ['Provider', 'Total Bet', 'Valid Bet', 'Total In', 'Total Out', 'Win/Lose', 'Share %'],
      ...providers.map((p) => [p.code || p.name || '', p.totalBet, p.validBet, p.totalIn, p.totalOut, p.winLose, p.share.toFixed(2)])
    ];
    const blob = new Blob(['\ufeff' + toCsv(lines)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `provider-consumption-${merchant?.code || brandId || 'merchant'}-${from}-${to}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  /* ---------- render ---------- */

  function renderHead() {
    const name = merchant?.name || (brandId ? `Merchant #${brandId}` : 'No merchant selected');
    if ($('wlmName')) {
      $('wlmName').innerHTML = `${esc(name)}${merchant?.code ? ` <span class="mmr-code">#${esc(merchant.code)}</span>` : ''}`;
    }
    if ($('wlmMark')) $('wlmMark').textContent = initials(merchant?.name, merchant?.code || brandId);
    if ($('wlmTier')) $('wlmTier').textContent = merchant ? merchant.tierLabel : '—';
    if ($('wlmPeriodText')) $('wlmPeriodText').textContent = periodLabel();
    if ($('wlmCurrency')) $('wlmCurrency').textContent = `(${currency})`;
    if ($('wlmStatus')) {
      const suspended = merchant?.status === 'suspended';
      $('wlmStatus').classList.toggle('is-active', !suspended);
      $('wlmStatus').classList.toggle('is-suspended', suspended);
      if ($('wlmStatusText')) $('wlmStatusText').textContent = merchant ? (suspended ? 'Suspended' : 'Active') : '—';
    }
    if ($('wlmBack')) $('wlmBack').href = backHref();
    if (merchant?.name) document.title = `${merchant.name} · Provider Consumption`;
  }

  function renderSummary() {
    const box = $('wlmSummary');
    if (!box) return;
    /* No merchant (no `brandId`, or one the directory does not know) leaves no tiles to show;
       the strip keeps its 14px/4px padding as an empty band otherwise (measured 18px tall). */
    if (!merchant) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.style.display = '';
    box.innerHTML = [
      summaryCard('Total Bet', money(merchant.totalBet), txnHint(merchant.txns)),
      summaryCard('Total ValidBet', money(merchant.validBet), validRateHint(merchant)),
      summaryCard('Total In', money(merchant.totalIn), ''),
      summaryCard('Total Out', money(merchant.totalOut), ''),
      summaryCard('Total Win/Lose', winLoseHtml(merchant.winLose), merchant.winLosePct ? `${money(merchant.winLosePct)}% of valid bet` : '')
    ].join('');
  }

  function txnHint(txns) {
    return txns ? `${Number(txns).toLocaleString('en-MY')} txns` : '';
  }

  function validRateHint(row) {
    return row.totalBet ? `${money(row.validBet / row.totalBet * 100)}% of bet` : '';
  }

  function renderTable() {
    const tbody = $('wlmRows');
    if (!tbody) return;
    if (!brandId) {
      tbody.innerHTML = '<tr><td colspan="8" class="mad-empty">No merchant was passed to this page — open it from the Win/Lose Report\'s eye.</td></tr>';
      return;
    }
    if (!providers.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="mad-empty">No provider-level rows for this merchant in the selected period.</td></tr>';
      return;
    }
    tbody.innerHTML = providers.map((p) => {
      const same = String(p.name || '').toUpperCase() === String(p.code || '').toUpperCase();
      const codeLabel = p.code && !same ? `#${p.code}` : '';
      const status = p.active ? 'is-on' : 'is-off';
      return `<tr>
        <td>
          <div class="wl-provider">
            <span class="wl-prov-mark${p.mark} ${status}" aria-hidden="true">${esc(p.initials)}</span>
            <div class="wl-provider-copy">
              <b>${esc(p.name)}</b>
              ${codeLabel ? `<span class="wl-pcode">${esc(codeLabel)}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="mre-num"><b>${money(p.totalBet)}</b></td>
        <td class="mre-num"><b>${money(p.validBet)}</b></td>
        <td class="mre-num"><b>${money(p.totalIn)}</b></td>
        <td class="mre-num"><b>${money(p.totalOut)}</b></td>
        <td class="mre-num">${winLoseHtml(p.winLose)}</td>
        <td class="mre-num">${shareHtml(p.share)}</td>
        <td><div class="mre-actions mad-actions">
          <a class="mad-icon-btn wlm-provider-open" href="${esc(providerReportUrl(p))}" title="View provider report" aria-label="View provider report"><i class="bi bi-eye" aria-hidden="true"></i></a>
        </div></td>
      </tr>`;
    }).join('');
  }

  function render() {
    renderHead();
    renderSummary();
    renderTable();
    const consumed = providers.reduce((s, p) => s + p.validBet, 0) || merchant?.validBet || 0;
    if ($('wlmConsumed')) $('wlmConsumed').textContent = money(consumed);
    if ($('wlmHint')) {
      $('wlmHint').textContent = providers.length
        ? `Turnover & 消耗分数 · ${providers.length} provider${providers.length === 1 ? '' : 's'} · ready for Excel`
        : 'Turnover & 消耗分数';
    }
    if ($('wlmCopy')) $('wlmCopy').disabled = !providers.length;
    if ($('wlmCsv')) $('wlmCsv').disabled = !providers.length;
  }

  async function load() {
    const seq = ++loadSeq;
    try {
      if ($('wlmRows')) {
        $('wlmRows').innerHTML = '<tr><td colspan="8" class="mad-empty">Loading providers…</td></tr>';
      }
      const [settlement, directory] = await Promise.all([
        api('/admin/main/reports/provider-settlement' + apiQuery()),
        api('/admin/merchants').catch(() => api('/admin/brands').catch(() => []))
      ]);
      if (seq !== loadSeq) return;
      const meta = (Array.isArray(directory) ? directory : (directory?.rows || directory?.items || []))
        .find((m) => String(m.id ?? m.brandId ?? '') === String(brandId)) || {};
      const rows = (settlement.brands || []).filter(
        (x) => String(x.brandId ?? x.merchantId ?? x.id ?? '') === String(brandId)
      );
      const seed = rows[0] || {};
      const code = String(meta.code || meta.brandCode || seed.brandCode || seed.merchantCode || '');
      const name = meta.name || meta.brandName || seed.brandName || seed.merchantName || '';
      const tier = tierKey({ ...seed, ...meta });

      const totals = { bet: 0, valid: 0, inn: 0, out: 0, wl: 0, txns: 0 };
      const byProvider = new Map();
      rows.forEach((x) => {
        const m = metricFromRow(x);
        totals.bet += m.bet; totals.valid += m.valid; totals.inn += m.inn; totals.out += m.out; totals.wl += m.wl; totals.txns += m.txns;
        const pCode = String(x.providerCode || x.vendorCode || '').trim();
        if (!pCode) return;
        let p = byProvider.get(pCode);
        if (!p) {
          p = {
            code: pCode,
            name: x.providerName || x.vendorName || pCode,
            status: x.status,
            totalBet: 0, validBet: 0, totalIn: 0, totalOut: 0, winLose: 0
          };
          byProvider.set(pCode, p);
        }
        p.totalBet += m.bet; p.validBet += m.valid; p.totalIn += m.inn; p.totalOut += m.out; p.winLose += m.wl;
      });

      const raw = String(meta.status ?? meta.brandStatus ?? seed.status ?? seed.brandStatus ?? '').toLowerCase();
      const status = raw === 'suspended' || raw === 'suspend' || raw === 'disabled' || raw === '0' || raw === '2'
        ? 'suspended'
        : (rows.length || meta.id ? 'active' : 'suspended');

      merchant = rows.length || meta.id || name ? {
        id: brandId,
        code,
        name: name || code || `Merchant #${brandId}`,
        tier,
        tierLabel: tierLabel(tier),
        status,
        totalBet: totals.bet,
        validBet: totals.valid,
        totalIn: totals.inn,
        totalOut: totals.out,
        winLose: totals.wl,
        winLosePct: totals.valid ? (totals.wl / totals.valid * 100) : 0,
        txns: totals.txns
      } : null;

      providers = [...byProvider.values()]
        .map((p, i) => ({
          ...p,
          mark: markClass(i),
          initials: initials(p.name, p.code),
          share: totals.bet ? (p.totalBet / totals.bet * 100) : 0,
          active: !/maint|suspend|disable|0|2/.test(String(p.status || ''))
        }))
        .sort((a, b) => b.totalBet - a.totalBet);

      render();
    } catch (e) {
      console.error(e);
      providers = [];
      merchant = null;
      renderHead();
      renderSummary();
      const msg = /failed to fetch|networkerror|load failed/i.test(String(e.message || ''))
        ? 'Unable to reach server. Start local API on :8080 or open the BO on the same host as /api.'
        : (e.message || 'Unable to load provider consumption');
      if ($('wlmRows')) {
        $('wlmRows').innerHTML = `<tr><td colspan="8" class="mad-empty text-danger">${esc(msg)}</td></tr>`;
      }
      if ($('wlmConsumed')) $('wlmConsumed').textContent = money(0);
    }
  }

  function apiQuery() {
    const to2 = addDay(to);
    return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to2)}`;
  }

  function setup() {
    BO_AUTH.requireLogin();
    currency = String(
      params.get('currency')
      || window.BO_MAIN_CURRENCY?.code?.()
      || sessionStorage.getItem('bo_main_report_currency')
      || 'MYR'
    ).toUpperCase();
    if ($('wlmCurrency')) $('wlmCurrency').textContent = `(${currency})`;
    $('wlmCopy')?.addEventListener('click', () => copyForExcel($('wlmCopy')));
    $('wlmCsv')?.addEventListener('click', downloadCsv);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
