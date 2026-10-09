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
  const num = (v) => Number(v || 0).toLocaleString('en-MY');
  const MARKS = ['', 'teal', 'violet', 'amber', 'rose', 'slate'];

  let merchants = [];
  let merchantMeta = [];
  let filtered = [];
  let page = 1;
  let showAll = false;
  let autoPageSize = null;
  let resizeTimer = null;

  function isAutoPageSize(value){
    const v = String(value == null ? '-' : value).trim();
    return v === '' || v === '-' || /^auto$/i.test(v);
  }

  function measureAutoPageSize(){
    const wrap = document.querySelector('.wl-scroll-table');
    if(!wrap) return 10;
    const head = wrap.querySelector('thead');
    const sample = wrap.querySelector('tbody tr:not(.mad-empty):not(.wl-total)');
    const rowHeight = sample ? Math.max(36, Math.round(sample.getBoundingClientRect().height)) : 52;
    const available = Math.max(0, Math.floor(wrap.clientHeight) - (head ? Math.ceil(head.getBoundingClientRect().height) : 0));
    return Math.max(5, Math.min(200, Math.floor(available / rowHeight) || 10));
  }

  function pageSize() {
    const raw = String($('wlPageSize')?.value || '-').trim();
    if(/^all$/i.test(raw)){
      showAll = true;
      return Math.max(filtered.length, 1);
    }
    showAll = false;
    if(isAutoPageSize(raw)){
      if(autoPageSize == null) autoPageSize = measureAutoPageSize();
      return autoPageSize;
    }
    return Math.max(1, Number(raw) || 10);
  }
  let statusPill = 'active';
  let searchQ = '';
  let currency = 'MYR';
  let range = null;

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

  function qs() {
    const [a, b] = range.get();
    return `?from=${encodeURIComponent(a)}&to=${encodeURIComponent(addDay(b))}`;
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

  function merchantStatus(x, meta) {
    const s = String(
      meta?.status ?? meta?.brandStatus ?? x.status ?? x.brandStatus ?? x.merchantStatus ?? ''
    ).toLowerCase();
    if (s === 'suspended' || s === 'suspend' || s === 'disabled' || s === '0' || s === '2') {
      return 'suspended';
    }
    if (s === 'active' || s === '1' || s === 'enabled') return 'active';
    return Number(x.turnover || x.totalBet || 0) === 0 ? 'suspended' : 'active';
  }

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
    const txns = Number(x.betCount || x.txnCount || x.transactionCount || 0);
    return { bet, valid, inn, out: Math.max(out, 0), wl, txns };
  }

  function normalizeMerchants(brandRows, accountingRows) {
    const meta = new Map((merchantMeta || []).map((x) => [String(x.id ?? x.brandId ?? ''), x]));
    const acc = new Map((accountingRows || []).map((x) => [String(x.brandId ?? x.id ?? ''), x]));
    const grouped = new Map();

    (brandRows || []).forEach((x) => {
      const id = x.brandId ?? x.merchantId ?? x.id ?? x.brandCode ?? x.merchantCode ?? x.code ?? '';
      const key = String(id);
      let g = grouped.get(key);
      if (!g) {
        g = {
          id,
          brandCode: x.brandCode || x.merchantCode || x.code || '',
          brandName: x.brandName || x.merchantName || x.name || '',
          totalBet: 0,
          validBet: 0,
          totalIn: 0,
          totalOut: 0,
          winLose: 0,
          txns: 0,
          providers: new Map(),
          seed: x
        };
        grouped.set(key, g);
      }

      const m = metricFromRow(x);
      g.totalBet += m.bet;
      g.validBet += m.valid;
      g.totalIn += m.inn;
      g.totalOut += m.out;
      g.winLose += m.wl;
      g.txns += m.txns;

      const pCode = String(x.providerCode || x.vendorCode || '').trim();
      if (pCode) {
        let p = g.providers.get(pCode);
        if (!p) {
          p = {
            code: pCode,
            name: x.providerName || x.vendorName || pCode,
            totalBet: 0,
            validBet: 0,
            totalIn: 0,
            totalOut: 0,
            winLose: 0,
            txns: 0,
            status: String(x.providerStatus || x.status || 'active').toLowerCase()
          };
          g.providers.set(pCode, p);
        }
        p.totalBet += m.bet;
        p.validBet += m.valid;
        p.totalIn += m.inn;
        p.totalOut += m.out;
        p.winLose += m.wl;
        p.txns += m.txns;
      }
    });

    // Enrich with accounting brands when settlement has no brand×provider rows
    (accountingRows || []).forEach((x) => {
      const id = x.brandId ?? x.id ?? x.brandCode ?? '';
      const key = String(id);
      if (!key || grouped.has(key)) return;
      const m = metricFromRow({
        turnover: x.turnover,
        totalBet: x.turnover,
        validBet: x.turnover,
        houseResult: x.netGamingResult,
        betCount: x.betCount
      });
      grouped.set(key, {
        id,
        brandCode: x.brandCode || '',
        brandName: x.brandName || '',
        totalBet: m.bet,
        validBet: m.valid,
        totalIn: m.inn,
        totalOut: m.out,
        winLose: m.wl,
        txns: m.txns,
        providers: new Map(),
        seed: x
      });
    });

    // Currency is a merchant-level dimension. The report APIs can return rows for all
    // merchants even when a MAIN report currency is selected, so use the merchant
    // directory as the source of truth for which merchants belong to that currency.
    // Also seed matching merchants with zero values so (for example) a USD merchant
    // with no bets in the period still appears instead of showing MYR merchants.
    const selectedCurrency = String(currency || 'MYR').toUpperCase();
    const directoryById = new Map();
    (merchantMeta || []).forEach((m) => {
      const id = m.id ?? m.brandId ?? m.merchantId ?? '';
      if (id === '' || id == null) return;
      directoryById.set(String(id), m);
    });

    for (const [key] of [...grouped.entries()]) {
      const m = directoryById.get(String(key));
      if (!m) continue;
      const merchantCurrency = String(
        m.currency ?? m.currencyCode ?? m.primaryCurrency ?? m.baseCurrency ?? 'MYR'
      ).toUpperCase();
      if (merchantCurrency !== selectedCurrency) grouped.delete(key);
    }

    (merchantMeta || []).forEach((m) => {
      const id = m.id ?? m.brandId ?? m.merchantId ?? '';
      if (id === '' || id == null) return;
      const merchantCurrency = String(
        m.currency ?? m.currencyCode ?? m.primaryCurrency ?? m.baseCurrency ?? 'MYR'
      ).toUpperCase();
      if (merchantCurrency !== selectedCurrency) return;
      const key = String(id);
      if (grouped.has(key)) return;
      grouped.set(key, {
        id,
        brandCode: m.code || m.brandCode || m.merchantCode || '',
        brandName: m.name || m.brandName || m.merchantName || '',
        totalBet: 0,
        validBet: 0,
        totalIn: 0,
        totalOut: 0,
        winLose: 0,
        txns: 0,
        providers: new Map(),
        seed: m
      });
    });

    return [...grouped.values()].map((g, i) => {
      const m = meta.get(String(g.id)) || {};
      const a = acc.get(String(g.id)) || {};
      const code = String(m.code || m.brandCode || g.brandCode || '');
      const name = m.name || m.brandName || g.brandName || a.brandName || code || '—';
      const tier = tierKey({ ...g.seed, ...m, ...a });
      const status = merchantStatus(g.seed, m);
      const validBet = Number(g.validBet || 0);
      const winLose = Number(g.winLose || 0);
      const providers = [...g.providers.values()]
        .map((p, pi) => ({
          ...p,
          mark: markClass(pi),
          initials: initials(p.name, p.code),
          winLosePct: p.validBet ? (p.winLose / p.validBet * 100) : 0,
          share: g.totalBet ? (p.totalBet / g.totalBet * 100) : 0,
          active: !/maint|suspend|disable|0|2/.test(String(p.status || ''))
        }))
        .sort((a, b) => b.totalBet - a.totalBet);

      return {
        id: g.id,
        code,
        name,
        initials: initials(name, code),
        mark: markClass(i),
        tier,
        tierLabel: tierLabel(tier),
        status,
        totalBet: Number(g.totalBet || 0),
        validBet,
        totalIn: Number(g.totalIn || 0),
        totalOut: Number(g.totalOut || 0),
        winLose,
        winLosePct: validBet ? (winLose / validBet * 100) : 0,
        txns: Number(g.txns || 0),
        providers,
        consumed: providers.reduce((s, p) => s + p.validBet, 0) || validBet
      };
    }).sort((a, b) => b.totalBet - a.totalBet);
  }

  function updateCurrencyLabels() {
    document.querySelectorAll('.mre-cur-label').forEach((el) => {
      el.textContent = `(${currency})`;
    });
  }

  function updateCounts() {
    const total = merchants.length;
    const active = merchants.filter((r) => r.status === 'active').length;
    const suspended = merchants.filter((r) => r.status === 'suspended').length;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('wlCountAll', total);
    set('wlCountActive', active);
    set('wlCountSuspended', suspended);
  }

  function pageButtons(cur, total) {
    total = Math.max(1, Number(total) || 1);
    cur = Math.max(1, Math.min(Number(cur) || 1, total));
    const pages = [];
    const addPage = (n) => { if (n >= 1 && n <= total && !pages.includes(n)) pages.push(n); };
    addPage(1);
    for (let n = cur - 2; n <= cur + 2; n++) addPage(n);
    addPage(total);
    pages.sort((a, b) => a - b);
    let html = `<button type="button" class="smart-page first" data-page="1"${cur <= 1 ? ' disabled' : ''} title="First page" aria-label="First page"><i class="bi bi-chevron-bar-left" aria-hidden="true"></i></button>`
      + `<button type="button" class="smart-page nav-text" data-page="${Math.max(1, cur - 1)}"${cur <= 1 ? ' disabled' : ''}>Previous</button>`;
    let prev = 0;
    pages.forEach((n) => {
      if (prev && n - prev > 1) html += '<span class="smart-page-ellipsis">…</span>';
      html += `<button type="button" class="smart-page${n === cur ? ' active' : ''}" data-page="${n}"${n === cur ? ' aria-current="page"' : ''}>${n}</button>`;
      prev = n;
    });
    html += `<button type="button" class="smart-page nav-text" data-page="${Math.min(total, cur + 1)}"${cur >= total ? ' disabled' : ''}>Next</button>`
      + `<button type="button" class="smart-page last" data-page="${total}"${cur >= total ? ' disabled' : ''} title="Last page" aria-label="Last page"><i class="bi bi-chevron-bar-right" aria-hidden="true"></i></button>`;
    return html;
  }

  function winLoseHtml(v) {
    const n = Number(v || 0);
    const cls = n > 0 ? 'is-pos' : n < 0 ? 'is-neg' : 'is-flat';
    const sign = n > 0 ? '+' : '';
    return `<span class="mmr-wl wl-wl ${cls}"><b>${sign}${money(n)}</b></span>`;
  }

  /* The eye leaves the list: one merchant's provider consumption on a page of its own
     (main-win-lose-merchant.html). The link carries the range and the filters actually in
     effect, so that page's `Back to list` returns to this view rather than to the defaults. */
  function drillUrl(row) {
    const u = new URL('main-win-lose-merchant.html', location.href);
    const [a, b] = range ? range.get() : ['', ''];
    if (row.id != null) u.searchParams.set('brandId', String(row.id));
    if (a) u.searchParams.set('from', a);
    if (b) u.searchParams.set('to', b);
    if (currency) u.searchParams.set('currency', currency);
    if (statusPill) u.searchParams.set('pill', statusPill);
    const tier = $('wlTierFilter')?.value || '';
    if (tier) u.searchParams.set('tier', tier);
    const st = $('wlStatusFilter')?.value || '';
    if (st) u.searchParams.set('status', st);
    const term = ($('wlSearchInput')?.value || '').trim();
    if (term) u.searchParams.set('q', term);
    return u.toString();
  }

  /* One writer for the pill row — the click, the Reset button and the pill a drill-down hands
     back all go through it, so the three can never disagree about which pill is lit. */
  function syncStatusPills(value) {
    statusPill = value;
    document.querySelectorAll('[data-wl-status]').forEach((b) => {
      const on = b.getAttribute('data-wl-status') === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function applyFilters() {
    const q = searchQ.trim().toLowerCase();
    const tier = $('wlTierFilter')?.value || '';
    const st = $('wlStatusFilter')?.value || '';
    filtered = merchants.filter((row) => {
      if (statusPill !== 'all' && row.status !== statusPill) return false;
      if (st && row.status !== st) return false;
      if (tier && row.tier !== tier) return false;
      if (q) {
        const hay = [row.name, row.code, row.tierLabel].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    page = 1;
    render();
  }

  function syncScrollMode() {
    const wrap = document.querySelector('.wl-scroll-table');
    const panel = document.querySelector('.mre-panel[data-report-panel="winlose"]');
    // Unlock internal max-height when showing many/all rows so the page scrolls
    const pageScroll = showAll || pageSize() >= 20;
    if (wrap) wrap.classList.toggle('is-page-scroll', pageScroll);
    if (panel) panel.classList.toggle('is-page-scroll', pageScroll);
  }

  function render() {
    updateCurrencyLabels();
    const tbody = $('wlRows');
    const foot = $('wlFoot');
    const pager = $('wlPager');
    const info = $('wlInfo');
    if (!tbody) return;

    const total = filtered.length;
    const perPage = pageSize();
    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / perPage) || 1);
    if (page > totalPages) page = totalPages;
    const start = showAll ? 0 : (page - 1) * perPage;
    const rows = filtered.slice(start, start + (showAll ? total : perPage));
    const end = total ? Math.min(start + rows.length, total) : 0;

    syncScrollMode();

    if (pager) {
      pager.hidden = false;
      pager.removeAttribute('hidden');
      pager.style.display = '';
      pager.innerHTML = showAll
        ? `<button type="button" class="smart-page nav-text" disabled>Previous</button>
           <button type="button" class="smart-page active" disabled aria-current="page">1</button>
           <button type="button" class="smart-page nav-text" disabled>Next</button>`
        : pageButtons(page, totalPages);
    }
    if (info) {
      info.textContent = total
        ? (showAll
          ? `Showing all ${total} merchants`
          : `Showing ${start + 1} to ${end} of ${total} merchants`)
        : 'Showing 0 to 0 of 0 merchants';
    }

    const sumBet = filtered.reduce((s, r) => s + r.totalBet, 0);
    const sumValid = filtered.reduce((s, r) => s + r.validBet, 0);
    const sumIn = filtered.reduce((s, r) => s + r.totalIn, 0);
    const sumOut = filtered.reduce((s, r) => s + r.totalOut, 0);
    const sumWl = filtered.reduce((s, r) => s + r.winLose, 0);

    if ($('wlTotalBet')) $('wlTotalBet').textContent = money(sumBet);
    if ($('wlTotalValid')) $('wlTotalValid').textContent = money(sumValid);
    if ($('wlTotalIn')) $('wlTotalIn').textContent = money(sumIn);
    if ($('wlTotalOut')) $('wlTotalOut').textContent = money(sumOut);
    if ($('wlTotalWinLose')) {
      const el = $('wlTotalWinLose');
      el.innerHTML = winLoseHtml(sumWl);
      el.classList.toggle('is-pos', sumWl > 0);
      el.classList.toggle('is-neg', sumWl < 0);
    }
    if (foot) foot.hidden = !total;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="mad-empty">No merchant win/lose data for this date range.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((r) => {
      const key = String(r.id || r.code || r.name);
      const codeLabel = r.code ? (`#${r.code}`) : '';
      const txnLabel = r.txns ? (`${num(r.txns)} txns`) : '';
      return `<tr class="wl-row">
        <td>
          <div class="wl-merchant">
            <span class="mmr-mark${r.mark}">${esc(r.initials)}</span>
            <div class="mmr-merchant-copy">
              <b>${esc(r.name)}${codeLabel ? ` <span class="mmr-code">${esc(codeLabel)}</span>` : ''}</b>
              <small>${esc(r.tierLabel)}</small>
            </div>
          </div>
        </td>
        <td class="mre-num"><b>${money(r.totalBet)}</b></td>
        <td class="mre-num"><b>${money(r.validBet)}</b></td>
        <td class="mre-num"><div class="mmr-stack"><b>${money(r.totalIn)}</b>${txnLabel ? `<small>${esc(txnLabel)}</small>` : ''}</div></td>
        <td class="mre-num"><b>${money(r.totalOut)}</b></td>
        <td class="mre-num">${winLoseHtml(r.winLose)}</td>
        <td><div class="mre-actions mad-actions">
          <button type="button" class="wl-expand mad-icon-btn" data-wl-open="${esc(drillUrl(r))}" title="View provider consumption" aria-label="View provider consumption"><i class="bi bi-eye" aria-hidden="true"></i></button>
        </div></td>
      </tr>`;
    }).join('');
  }

  let reportLoadSeq = 0;
  async function load() {
    const loadSeq = ++reportLoadSeq;
    try {
      if ($('wlRows')) {
        $('wlRows').innerHTML = '<tr><td colspan="7" class="mad-empty">Loading win/lose report…</td></tr>';
      }
      if ($('wlFoot')) $('wlFoot').hidden = true;

      const [settlement, accounting, directory] = await Promise.all([
        api('/admin/main/reports/provider-settlement' + qs()),
        api('/admin/main/reports/accounting' + qs()).catch(() => ({ brands: [] })),
        api('/admin/merchants').catch(() => api('/admin/brands').catch(() => []))
      ]);

      merchantMeta = Array.isArray(directory)
        ? directory
        : (directory?.rows || directory?.items || []);
      merchants = normalizeMerchants(settlement.brands || [], accounting.brands || []);
      updateCounts();
      applyFilters();
    } catch (e) {
      console.error(e);
      merchants = [];
      filtered = [];
      updateCounts();
      const msg = /failed to fetch|networkerror|load failed/i.test(String(e.message || ''))
        ? 'Unable to reach server. Start local API on :8080 or open the BO on the same host as /api.'
        : (e.message || 'Unable to load win/lose report');
      if ($('wlRows')) {
        $('wlRows').innerHTML = `<tr><td colspan="7" class="mad-empty text-danger">${esc(msg)}</td></tr>`;
      }
      if ($('wlFoot')) $('wlFoot').hidden = true;
      if ($('wlInfo')) $('wlInfo').textContent = 'Showing 0 to 0 of 0 merchants';
      if ($('wlPager')) $('wlPager').innerHTML = '';
    }
  }

  function exportCsv() {
    const [a, b] = range.get();
    const head = [
      'Merchant', 'Code', 'Tier', 'Status',
      'Total Bet', 'Total ValidBet', 'Total In', 'Total Out', 'Total Win/Lose', 'Win/Lose %',
      'Provider', 'Provider Bet', 'Provider ValidBet', 'Provider In', 'Provider Out', 'Provider Win/Lose', 'Share %'
    ];
    const lines = [head];
    filtered.forEach((r) => {
      if (!r.providers.length) {
        lines.push([
          r.name, r.code, r.tierLabel, r.status,
          r.totalBet, r.validBet, r.totalIn, r.totalOut, r.winLose, r.winLosePct.toFixed(2),
          '', '', '', '', '', '', ''
        ]);
        return;
      }
      r.providers.forEach((p) => {
        lines.push([
          r.name, r.code, r.tierLabel, r.status,
          r.totalBet, r.validBet, r.totalIn, r.totalOut, r.winLose, r.winLosePct.toFixed(2),
          p.name, p.totalBet, p.validBet, p.totalIn, p.totalOut, p.winLose, p.share.toFixed(2)
        ]);
      });
    });
    const blob = new Blob(
      [lines.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')],
      { type: 'text/csv;charset=utf-8' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `win-lose-${a}-${b}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  function setup() {
    BO_AUTH.requireLogin();
    currency = window.BO_MAIN_CURRENCY?.code?.()
      || sessionStorage.getItem('bo_main_report_currency')
      || 'MYR';
    currency = String(currency).toUpperCase();
    updateCurrencyLabels();

    range = MAIN_DATE_RANGE.init({
      prefix: 'winLose',
      defaultPreset:'today',
      onChange: () => load()
    });

    /* The drill-down's Back to list hands the whole view back: from/to are read by
       main-exec-date-range.js itself, the four filters here. */
    const url = new URLSearchParams(location.search);
    if (url.get('pill')) syncStatusPills(url.get('pill'));
    if (url.get('tier')) $('wlTierFilter').value = url.get('tier');
    if (url.get('status')) $('wlStatusFilter').value = url.get('status');
    if (url.get('q')) {
      $('wlSearchInput').value = url.get('q');
      searchQ = url.get('q');
    }

    document.querySelectorAll('[data-wl-status]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncStatusPills(btn.getAttribute('data-wl-status') || 'all');
        applyFilters();
      });
    });

    let searchTimer = null;
    $('wlSearchInput')?.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQ = $('wlSearchInput').value || '';
        applyFilters();
      }, 180);
    });
    $('wlSearchInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchQ = $('wlSearchInput').value || '';
        applyFilters();
      }
    });
    $('wlTierFilter')?.addEventListener('change', applyFilters);
    $('wlStatusFilter')?.addEventListener('change', applyFilters);

    $('wlResetBtn')?.addEventListener('click', () => {
      if ($('wlSearchInput')) $('wlSearchInput').value = '';
      if ($('wlTierFilter')) $('wlTierFilter').value = '';
      if ($('wlStatusFilter')) $('wlStatusFilter').value = '';
      searchQ = '';
      syncStatusPills('active');
      applyFilters();
    });

    $('wlPager')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled || showAll) return;
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize()) || 1);
      const n = Number(btn.dataset.page);
      if (n >= 1 && n <= totalPages && n !== page) {
        page = n;
        render();
      }
    });

    $('wlPageSize')?.addEventListener('change', () => {
      autoPageSize = null;
      page = 1;
      render();
    });

    window.addEventListener('resize', () => {
      if(!isAutoPageSize($('wlPageSize')?.value)) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        autoPageSize = null;
        render();
      }, 120);
    });

    document.addEventListener('click', (e) => {
      const cur = e.target.closest?.('[data-currency]');
      if (cur && cur.closest('.mre-currency-seg')) {
        currency = cur.getAttribute('data-currency') || currency;
        updateCurrencyLabels();
      }
    });

    $('wlRows')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-wl-open]');
      if (!btn) return;
      e.preventDefault();
      location.href = btn.getAttribute('data-wl-open');
    });

    $('reportExport')?.addEventListener('click', exportCsv);

    load().then(() => requestAnimationFrame(() => {
      if(isAutoPageSize($('wlPageSize')?.value)){
        autoPageSize = null;
        page = 1;
        render();
      }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
