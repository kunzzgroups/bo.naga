(function(){
  let page = 1;
  let totalPages = 1;
  let totalElements = 0;
  let pageSize = 20;
  let lastRows = [];
  let activeListController = null;
  let lockedAutoSize = null;
  let autofitReloading = false;
  let autofitSettled = false;

  /* MD Show N: - · 10 · 20 · 50 · 100 · All (− = auto-fit, All = 10000) */
  function tableBodyScroll(){
    return document.querySelector('.provider-transaction-page .table-card > .table-wrap')
      || document.querySelector('.table-card .table-wrap')
      || document.querySelector('.table-wrap');
  }
  function measureAutoPageSize(){
    const scroll = tableBodyScroll();
    if (!scroll) return 12;
    const head = scroll.querySelector('thead');
    const headH = head ? Math.ceil(head.getBoundingClientRect().height) : 44;
    const avail = Math.max(0, Math.floor(scroll.clientHeight) - headH);
    const sample = scroll.querySelector('tbody tr td');
    const rowH = sample ? Math.max(44, Math.round(sample.getBoundingClientRect().height)) : 44;
    return Math.max(5, Math.min(200, Math.floor(avail / rowH) || 12));
  }
  function autoFitPageSize(){
    if (lockedAutoSize != null) return lockedAutoSize;
    lockedAutoSize = measureAutoPageSize();
    return lockedAutoSize;
  }
  function clearLockedAutoSize(){
    lockedAutoSize = null;
    autofitSettled = false;
  }
  function isAutoPageSize(raw){
    const v = String(raw ?? '-').trim();
    return v === '' || v === '-' || /^auto$/i.test(v);
  }
  function resolvePageSize(raw){
    const el = $('txSize');
    const v = String(raw != null ? raw : (el && el.value) || '-').trim();
    if (isAutoPageSize(v)) return autoFitPageSize();
    if (/^all$/i.test(v)) return 10000;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : autoFitPageSize();
  }
  function publishPagerMeta(total, size){
    const card = document.querySelector('.provider-transaction-page .table-card') || document.querySelector('.table-card');
    if (!card) return;
    const t = Number(total);
    if (Number.isFinite(t) && t >= 0) card.dataset.boTotal = String(t);
    else delete card.dataset.boTotal;
    const n = Number(size);
    if (Number.isFinite(n) && n > 0) card.dataset.boPageSize = String(n);
    else delete card.dataset.boPageSize;
    card.dataset.boPage = String(page);
    const auto = isAutoPageSize($('txSize')?.value);
    card.toggleAttribute('data-bo-autofit', auto);
    const wrap = tableBodyScroll();
    if (wrap) wrap.toggleAttribute('data-bo-autofit', auto);
    if (!auto) resetEvenFill();
  }

  function isPlaceholderRow(tr){
    const cells = tr.querySelectorAll('td');
    if (cells.length <= 1) return true;
    const text = (tr.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return !text || text === 'loading...' || text.startsWith('no records') || text.startsWith('unable');
  }

  function resetEvenFill(){
    const body = $('txBody');
    const table = body?.closest('table');
    if (!body || !table) return;
    table.classList.remove('bo-tx-evenfill');
    table.style.height = '';
    body.querySelectorAll('tr.bo-table-fill').forEach(r => r.remove());
    [...body.querySelectorAll('tr')].forEach(tr => {
      tr.style.height = '';
      tr.querySelectorAll('td').forEach(td => { td.style.height = ''; td.style.minHeight = ''; });
    });
  }

  /* Show `-`: leftover gap smaller than one row → stretch rows evenly (Deposit / VIP EXP). */
  function bodyAvail(scroll){
    if (!scroll) return 0;
    const head = scroll.querySelector('thead');
    const headH = head ? Math.ceil(head.getBoundingClientRect().height) : 0;
    return Math.max(0, Math.floor(scroll.clientHeight) - headH);
  }

  /* Post-paint settle: first measure often over-counts (rowH too small) → Showing N ≠ visible rows. */
  function settleAutofitFromPaint(){
    if (autofitReloading || autofitSettled) return;
    if (!isAutoPageSize($('txSize')?.value)) return;
    const scroll = tableBodyScroll();
    const body = $('txBody');
    if (!scroll || !body) return;
    resetEvenFill();
    void scroll.offsetHeight;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!rows.length) return;
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    const rowH = Math.max(38, Math.round(natural / rows.length) || 44);
    const overflow = scroll.scrollHeight > scroll.clientHeight + 1 || natural > avail + 1;
    let target = Math.max(5, Math.min(200, Math.floor(avail / rowH) || rows.length));
    if (overflow) target = Math.max(5, Math.min(target, rows.length - 1));
    const reloadAt = (size) => {
      lockedAutoSize = size;
      pageSize = size;
      page = 1;
      autofitReloading = true;
      return Promise.resolve(load()).finally(() => {
        autofitReloading = false;
        verifyAndLock();
      });
    };
    const verifyAndLock = () => {
      requestAnimationFrame(() => {
        const sc = tableBodyScroll();
        if (sc && sc.scrollHeight > sc.clientHeight + 1 && lockedAutoSize > 5) {
          reloadAt(Math.max(5, lockedAutoSize - 1));
          return;
        }
        autofitSettled = true;
        evenFillRowHeights();
      });
    };
    if (target === rows.length) {
      lockedAutoSize = rows.length;
      pageSize = lockedAutoSize;
      verifyAndLock();
      return;
    }
    reloadAt(target);
  }

  function evenFillRowHeights(){
    const body = $('txBody');
    const scroll = tableBodyScroll();
    const table = body?.closest('table');
    if (!body || !scroll || !table) return;
    resetEvenFill();
    if (!isAutoPageSize($('txSize')?.value)) return;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!rows.length) return;
    void table.offsetHeight;
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    const rowH = Math.max(38, Math.round(natural / rows.length) || 44);
    const gap = avail - natural;
    /* Stretch leftover seam only — grow/shrink is settleAutofitFromPaint. */
    if (natural > avail + 1 || gap < 2 || gap >= rowH) return;
    const base = Math.floor(avail / rows.length);
    let rem = avail - (base * rows.length);
    if (base <= 0) return;
    rows.forEach(tr => {
      const h = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
      tr.style.height = h + 'px';
      tr.querySelectorAll('td').forEach(td => { td.style.height = h + 'px'; });
    });
    table.classList.add('bo-tx-evenfill');
    table.style.height = Math.floor(scroll.clientHeight) + 'px';
    if (scroll.scrollHeight > scroll.clientHeight) {
      const over = scroll.scrollHeight - scroll.clientHeight;
      const shrink = Math.ceil(over / rows.length) || 1;
      rows.forEach(tr => {
        const h = Math.max(rowH, (parseFloat(tr.style.height) || base) - shrink);
        tr.style.height = h + 'px';
        tr.querySelectorAll('td').forEach(td => { td.style.height = h + 'px'; });
      });
      table.style.height = Math.max(0, Math.floor(scroll.clientHeight) - over) + 'px';
    }
  }

  function scheduleEvenFill(){
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (isAutoPageSize($('txSize')?.value) && !autofitSettled) {
        settleAutofitFromPaint();
        return;
      }
      evenFillRowHeights();
    }));
  }

  function bindEvenFillObserver(){
    const scroll = tableBodyScroll();
    if (!scroll || scroll._boEvenFillObs) return;
    scroll._boEvenFillObs = new ResizeObserver(() => {
      clearTimeout(scroll._boEvenFillTimer);
      scroll._boEvenFillTimer = setTimeout(() => {
        if (!isAutoPageSize($('txSize')?.value)) return;
        clearLockedAutoSize();
        pageSize = resolvePageSize();
        page = 1;
        load();
      }, 120);
    });
    scroll._boEvenFillObs.observe(scroll);
  }

  /* VIP EXP Log specimen: First · Prev · pages · Next · Last */
  function renderPages(){
    const w = $('txPagination');
    if (!w) return;
    const total = Math.max(1, Number(totalPages) || 1);
    const current = Math.max(1, Math.min(Number(page) || 1, total));
    const pages = [];
    const add = n => { if (n >= 1 && n <= total && !pages.includes(n)) pages.push(n); };
    add(1);
    for (let n = current - 2; n <= current + 2; n++) add(n);
    add(total);
    pages.sort((a, b) => a - b);
    let html = '';
    html += '<button type="button" class="smart-page first" data-page="1" ' + (current <= 1 ? 'disabled' : '') + ' title="First page" aria-label="First page"><i class="bi bi-chevron-bar-left" aria-hidden="true"></i></button>';
    html += '<button type="button" data-page="' + (current - 1) + '" ' + (current <= 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
    let prev = 0;
    pages.forEach(n => {
      if (prev && n - prev > 1) html += '<span class="smart-page-ellipsis" aria-hidden="true">…</span>';
      html += '<button type="button" class="' + (n === current ? 'active' : '') + '" data-page="' + n + '" ' + (n === current ? 'aria-current="page"' : '') + '>' + n + '</button>';
      prev = n;
    });
    html += '<button type="button" data-page="' + (current + 1) + '" ' + (current >= total ? 'disabled' : '') + ' aria-label="Next page">›</button>';
    html += '<button type="button" class="smart-page last" data-page="' + total + '" ' + (current >= total ? 'disabled' : '') + ' title="Last page" aria-label="Last page"><i class="bi bi-chevron-bar-right" aria-hidden="true"></i></button>';
    w.innerHTML = html;
  }

  function renderInfo(rowCount){
    const info = $('txPageInfo');
    if (!info) return;
    const from = totalElements && rowCount ? ((page - 1) * pageSize + 1) : 0;
    const to = totalElements ? Math.min((page - 1) * pageSize + rowCount, totalElements) : 0;
    info.textContent = 'Showing ' + from + ' to ' + to + ' of ' + totalElements + ' entries';
  }

  const $ = (id) => document.getElementById(id);

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function money(v){
    const n = Number(v || 0);
    return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function dt(v){ return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-'); }

  function endpoint(key){
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key];
  }

  async function get(url, signal){
    const res = await fetch(url, { headers: { ...BO_AUTH.authHeader() }, signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json.data || {};
  }

  function readList(data){ return data.items || data.list || data.content || data.rows || []; }
  function readTotalPages(data){ return Number(data.totalPages || data.pages || 1) || 1; }
  function readTotalElements(data){ return Number(data.totalElements || data.total || data.count || readList(data).length) || 0; }

  const TX_TYPE_RE = /^(LAUNCH|CREATE_PLAYER|BALANCE|DEPOSIT|WITHDRAW|GAME_LIST|TRANSFER|GET_BALANCE|LOGIN|REGISTER|PULL_LOG)(_[A-Z0-9]+)*$/i;

  function applyKeyword(p, raw){
    const kw = String(raw || '').trim();
    if (!kw) return;
    if (/^\d+$/.test(kw)) {
      p.set('memberId', kw);
      return;
    }
    if (TX_TYPE_RE.test(kw) || kw.includes('_')) {
      p.set('txType', kw.toUpperCase());
      return;
    }
    p.set('providerCode', kw.toUpperCase());
  }

  function query(){
    const p = new URLSearchParams();
    const map = {
      txStatus: 'status',
      txFrom: 'from',
      txTo: 'to'
    };
    Object.keys(map).forEach(id => {
      const el = $(id);
      if (el && el.value && el.value.trim()) p.set(map[id], el.value.trim());
    });
    applyKeyword(p, $('txKeyword') && $('txKeyword').value);
    pageSize = resolvePageSize();
    p.set('page', page);
    p.set('size', String(pageSize));
    return p.toString();
  }

  function pretty(v){
    if (v == null || v === '') return '-';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    const s = String(v);
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch(e) { return s; }
  }

  function jsonValue(v, preserveString){
    if (v == null || v === '') return null;
    if (typeof v === 'object') return v;
    const s = String(v);
    if (preserveString) return s;
    try { return JSON.parse(s); } catch(e) { return s; }
  }

  function buildFullDebugJson(x){
    const data = x || {};
    return {
      transaction: {
        id: data.id ?? null,
        memberId: data.memberId ?? data.member_id ?? null,
        providerCode: data.providerCode ?? data.provider_code ?? null,
        transactionType: data.txType ?? data.tx_type ?? null,
        amount: data.amount ?? null,
        status: data.status ?? null,
        httpStatus: data.httpStatus ?? data.http_status ?? null,
        createdAt: data.createdAt ?? data.created_at ?? null
      },
      apiUrl: data.apiUrl ?? data.api_url ?? data.url ?? null,
      requestPayload: jsonValue(data.requestPayload ?? data.request_payload),
      responsePayload: jsonValue(data.responsePayload ?? data.response_payload),
      requestHeaders: jsonValue(data.requestHeaders ?? data.request_headers),
      signaturePlainText: data.signaturePlainText ?? data.signature_plain_text ?? null,
      generatedSignature: data.generatedSignature ?? data.generated_signature ?? null,
      exactRawJsonUsedForSigning: jsonValue(data.rawJson ?? data.raw_json, true),
      errorMessage: data.errorMessage ?? data.error_message ?? null
    };
  }

  function setFullDebugJson(x){
    const el = $('txFullDebugJson');
    if (!el) return;
    el.textContent = JSON.stringify(buildFullDebugJson(x), null, 2);
  }

  async function copyText(text){
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('Copy failed');
  }

  function statusBadge(status){
    const s = String(status || '-').toUpperCase();
    let cls = 'status-pill';
    if (s === 'SUCCESS' || s === 'APPROVED') cls = 'status-pill is-success';
    else if (s === 'FAILED' || s === 'ERROR' || s === 'REJECTED') cls = 'status-pill off';
    else if (s === 'PENDING') cls = 'status-pill';
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  window.showProviderTxPayload = async function(i){
    const summary = lastRows[i] || {};
    const modalEl = $('txPayloadModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    if ($('txPayloadMeta')) $('txPayloadMeta').textContent = 'ID ' + (summary.id || '-') + ' · ' + (summary.providerCode || '-') + ' · ' + (summary.txType || '-');
    if ($('txApiUrl')) $('txApiUrl').textContent = pretty(summary.apiUrl || summary.url || '');
    if ($('txRequestPayload')) $('txRequestPayload').textContent = 'Loading payload...';
    if ($('txResponsePayload')) $('txResponsePayload').textContent = 'Loading payload...';
    if ($('txRequestHeaders')) $('txRequestHeaders').textContent = 'Loading headers...';
    if ($('txSignaturePlainText')) $('txSignaturePlainText').textContent = 'Loading signature input...';
    if ($('txGeneratedSignature')) $('txGeneratedSignature').textContent = 'Loading signature...';
    if ($('txRawJson')) $('txRawJson').textContent = 'Loading raw JSON...';
    if ($('txErrorMessage')) $('txErrorMessage').textContent = 'Loading payload...';
    if ($('txFullDebugJson')) $('txFullDebugJson').textContent = 'Loading full debug JSON...';
    modal.show();
    try {
      const x = await get(endpoint('PROVIDER_WALLET_TRANSACTION_LIST').replace(/\/list$/, '') + '/' + encodeURIComponent(summary.id));
      if ($('txPayloadMeta')) $('txPayloadMeta').textContent = 'ID ' + (x.id || '-') + ' · ' + (x.providerCode || '-') + ' · ' + (x.txType || '-');
      if ($('txApiUrl')) $('txApiUrl').textContent = pretty(x.apiUrl || x.url || '');
      if ($('txRequestPayload')) $('txRequestPayload').textContent = pretty(x.requestPayload || x.request_payload || '');
      if ($('txResponsePayload')) $('txResponsePayload').textContent = pretty(x.responsePayload || x.response_payload || '');
      if ($('txRequestHeaders')) $('txRequestHeaders').textContent = pretty(x.requestHeaders || x.request_headers || '');
      if ($('txSignaturePlainText')) $('txSignaturePlainText').textContent = pretty(x.signaturePlainText || x.signature_plain_text || '');
      if ($('txGeneratedSignature')) $('txGeneratedSignature').textContent = pretty(x.generatedSignature || x.generated_signature || '');
      if ($('txRawJson')) $('txRawJson').textContent = pretty(x.rawJson || x.raw_json || '');
      if ($('txErrorMessage')) $('txErrorMessage').textContent = pretty(x.errorMessage || x.error_message || '');
      setFullDebugJson(x);
    } catch (e) {
      if ($('txRequestPayload')) $('txRequestPayload').textContent = '-';
      if ($('txResponsePayload')) $('txResponsePayload').textContent = '-';
      if ($('txRequestHeaders')) $('txRequestHeaders').textContent = '-';
      if ($('txSignaturePlainText')) $('txSignaturePlainText').textContent = '-';
      if ($('txGeneratedSignature')) $('txGeneratedSignature').textContent = '-';
      if ($('txRawJson')) $('txRawJson').textContent = '-';
      if ($('txErrorMessage')) $('txErrorMessage').textContent = e.message || 'Unable to load payload';
      setFullDebugJson({
        ...summary,
        apiUrl: summary.apiUrl || summary.api_url || summary.url || null,
        errorMessage: e.message || 'Unable to load payload'
      });
    }
  };

  async function load(){
    if (activeListController) activeListController.abort();
    activeListController = new AbortController();
    const controller = activeListController;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try{
      $('txBody').innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Loading...</td></tr>';
      const data = await get(endpoint('PROVIDER_WALLET_TRANSACTION_LIST') + '?' + query(), controller.signal);
      lastRows = readList(data);
      totalPages = readTotalPages(data);
      totalElements = readTotalElements(data);
      publishPagerMeta(totalElements, pageSize);
      $('txBody').innerHTML = lastRows.length ? lastRows.map((x,i) => `
        <tr>
          <td>${esc(x.id)}</td>
          <td>${esc(x.memberId || x.member_id || '')}</td>
          <td><b>${esc(x.providerCode || x.provider_code || '-')}</b></td>
          <td>${esc(x.txType || x.tx_type || '-')}</td>
          <td>${money(x.amount)}</td>
          <td>${statusBadge(x.status)}</td>
          <td>${esc(x.httpStatus || x.http_status || '-')}</td>
          <td><span class="pwt-url" title="${esc(x.apiUrl || x.api_url || '')}">${esc(x.apiUrl || x.api_url || '-')}</span></td>
          <td>${esc(dt(x.createdAt || x.created_at))}</td>
          <td><button class="clean-btn pwt-payload-btn" type="button" onclick="showProviderTxPayload(${i})"><i class="bi bi-braces"></i> Payload</button></td>
        </tr>`).join('') : '<tr><td colspan="10" class="text-center py-4 text-muted">No records</td></tr>';
      renderPages();
      renderInfo(lastRows.length);
      if (!autofitReloading) scheduleEvenFill();
    }catch(e){
      if (e && e.name === 'AbortError') return;
      $('txBody').innerHTML = '<tr><td colspan="10" class="text-danger text-center py-4">' + esc(e.message) + '</td></tr>';
      totalElements = 0;
      totalPages = 1;
      renderPages();
      renderInfo(0);
      resetEvenFill();
    }finally{
      clearTimeout(timeout);
      if (activeListController === controller) activeListController = null;
    }
  }

  function runSearch(){
    page = 1;
    load();
  }

  document.addEventListener('DOMContentLoaded', () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    pageSize = resolvePageSize();
    let keywordTimer = 0;
    const kick = () => { clearTimeout(keywordTimer); keywordTimer = setTimeout(runSearch, 350); };
    $('txKeyword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); clearTimeout(keywordTimer); runSearch(); }
    });
    $('txKeyword')?.addEventListener('input', kick);
    $('txStatus')?.addEventListener('change', runSearch);
    $('txFrom')?.addEventListener('change', runSearch);
    $('txTo')?.addEventListener('change', runSearch);
    $('txSize')?.addEventListener('change', () => {
      clearLockedAutoSize();
      pageSize = resolvePageSize();
      runSearch();
    });
    $('txPagination')?.addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      const n = Number(b.dataset.page);
      if (n >= 1 && n <= totalPages && n !== page) { page = n; load(); }
    });
    $('txCopyDebugJson')?.addEventListener('click', async () => {
      const btn = $('txCopyDebugJson');
      const source = $('txFullDebugJson')?.textContent || '';
      if (!source || source === '-' || source.startsWith('Loading')) return;
      const original = btn ? btn.innerHTML : '';
      try {
        await copyText(source);
        if (btn) btn.innerHTML = '<i class="bi bi-check2"></i> Copied';
      } catch (e) {
        if (btn) btn.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Copy failed';
      } finally {
        if (btn) setTimeout(() => { btn.innerHTML = original; }, 1400);
      }
    });
    window.addEventListener('resize', () => {
      if (!isAutoPageSize($('txSize')?.value)) return;
      clearTimeout(window._pwtAutoFitTimer);
      window._pwtAutoFitTimer = setTimeout(() => {
        clearLockedAutoSize();
        runSearch();
      }, 180);
    });
    bindEvenFillObserver();
    load();
  });
})();
