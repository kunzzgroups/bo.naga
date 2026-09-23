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
    const sampleRow = [...(scroll.querySelectorAll('tbody tr') || [])].find(tr => !isPlaceholderRow(tr));
    const sample = sampleRow || scroll.querySelector('tbody tr td');
    /* Prefer natural row height; floor(avail/44) under-counts when rows are ~40px → leaves a spare entry on page 2. */
    const rowH = sample
      ? Math.max(36, Math.min(48, Math.round(sample.getBoundingClientRect().height) || 40))
      : 40;
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

  /* Geometry beats scrollHeight — overflow-y:hidden + sticky thead can report equal heights
     while the last row is still half-clipped (the bug in the screenshot). */
  function lastRowClipped(scroll, rows){
    if (!scroll || !rows || !rows.length) return false;
    const last = rows[rows.length - 1];
    const wrapBox = scroll.getBoundingClientRect();
    const rowBox = last.getBoundingClientRect();
    return rowBox.bottom > wrapBox.bottom + 0.5;
  }

  function autofitOverflows(scroll, rows){
    if (!scroll) return false;
    if (scroll.scrollHeight > scroll.clientHeight + 1) return true;
    if (!rows || !rows.length) return false;
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    if (natural > avail + 1) return true;
    return lastRowClipped(scroll, rows);
  }

  function shrinkAutofitIfOverflow(){
    if (autofitReloading) return;
    if (!isAutoPageSize($('txSize')?.value)) return;
    const scroll = tableBodyScroll();
    const body = $('txBody');
    if (!scroll || !body) return;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!autofitOverflows(scroll, rows)) return;
    if (lockedAutoSize == null || lockedAutoSize <= 5) return;
    lockedAutoSize = Math.max(5, lockedAutoSize - 1);
    pageSize = lockedAutoSize;
    page = 1;
    autofitSettled = false;
    autofitReloading = true;
    Promise.resolve(load()).finally(() => {
      autofitReloading = false;
      requestAnimationFrame(() => {
        if (autofitOverflows(tableBodyScroll(), [...($('txBody')?.querySelectorAll('tr') || [])].filter(tr => !isPlaceholderRow(tr))) && lockedAutoSize > 5) {
          shrinkAutofitIfOverflow();
          return;
        }
        autofitSettled = true;
        evenFillRowHeights();
      });
    });
  }

  /* If first measure under-counted (e.g. rowH too tall), grow until one more would clip. */
  function growAutofitIfRoom(){
    if (autofitReloading || !autofitSettled) return;
    if (!isAutoPageSize($('txSize')?.value)) return;
    if (lockedAutoSize == null) return;
    if (totalElements <= lockedAutoSize) return;
    const scroll = tableBodyScroll();
    const body = $('txBody');
    if (!scroll || !body) return;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!rows.length || autofitOverflows(scroll, rows)) return;
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    const rowH = Math.max(36, Math.round(natural / rows.length) || 40);
    const gap = avail - natural;
    if (gap < rowH - 1) return;
    const next = Math.min(200, lockedAutoSize + 1, totalElements);
    if (next <= lockedAutoSize) return;
    lockedAutoSize = next;
    pageSize = lockedAutoSize;
    page = 1;
    autofitSettled = false;
    autofitReloading = true;
    Promise.resolve(load()).finally(() => {
      autofitReloading = false;
      requestAnimationFrame(() => {
        const painted = [...($('txBody')?.querySelectorAll('tr') || [])].filter(tr => !isPlaceholderRow(tr));
        if (autofitOverflows(tableBodyScroll(), painted)) {
          shrinkAutofitIfOverflow();
          return;
        }
        autofitSettled = true;
        evenFillRowHeights();
        growAutofitIfRoom();
      });
    });
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
    const overflow = autofitOverflows(scroll, rows);
    /* Floor only — never keep a row that overflow:hidden would clip. */
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
        const bodyEl = $('txBody');
        const painted = bodyEl
          ? [...bodyEl.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr))
          : [];
        if (autofitOverflows(sc, painted) && lockedAutoSize > 5) {
          reloadAt(Math.max(5, lockedAutoSize - 1));
          return;
        }
        autofitSettled = true;
        evenFillRowHeights();
        growAutofitIfRoom();
      });
    };
    if (target === rows.length) {
      lockedAutoSize = rows.length;
      pageSize = lockedAutoSize;
      verifyAndLock();
      return;
    }
    /* Prefer growing when paint shows spare space for another row and more entries exist. */
    if (target > rows.length && totalElements > rows.length) {
      reloadAt(Math.min(target, totalElements));
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
    /* Overflow: too many rows for viewport — drop one (Show `-` must not clip). */
    if (natural > avail + 1 || lastRowClipped(scroll, rows)) {
      shrinkAutofitIfOverflow();
      return;
    }
    /* After settle: stretch any leftover (incl. gap ≥ one row when no more rows will load). */
    if (gap < 2) return;
    if (!autofitSettled && gap >= rowH) return;
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
    if (scroll.scrollHeight > scroll.clientHeight || lastRowClipped(scroll, rows)) {
      const over = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
      const shrink = Math.ceil(over / rows.length) || 1;
      rows.forEach(tr => {
        const h = Math.max(rowH, (parseFloat(tr.style.height) || base) - shrink);
        tr.style.height = h + 'px';
        tr.querySelectorAll('td').forEach(td => { td.style.height = h + 'px'; });
      });
      table.style.height = Math.max(0, Math.floor(scroll.clientHeight) - over) + 'px';
      if (lastRowClipped(scroll, rows)) shrinkAutofitIfOverflow();
    }
  }

  function scheduleEvenFill(){
    requestAnimationFrame(() => requestAnimationFrame(() => {
      paintDarkFilterControls();
      if (isAutoPageSize($('txSize')?.value) && !autofitSettled) {
        settleAutofitFromPaint();
        return;
      }
      evenFillRowHeights();
      shrinkAutofitIfOverflow();
      growAutofitIfRoom();
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
    const block = el.closest('.payload-block');
    if (block) {
      block.classList.remove('is-loading');
      block.classList.toggle('is-empty', !el.textContent || el.textContent === '-');
    }
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

  function setPayloadMeta(id, provider, type){
    const el = $('txPayloadMeta');
    if (!el) return;
    const chips = [];
    chips.push('<span class="pwt-meta-chip"><span class="pwt-meta-k">ID</span> ' + esc(id || '-') + '</span>');
    chips.push('<span class="pwt-meta-chip">' + esc(provider || '-') + '</span>');
    chips.push('<span class="pwt-meta-chip">' + esc(type || '-') + '</span>');
    el.innerHTML = chips.join('');
  }

  function fillPayloadBox(id, value, opts){
    const el = $(id);
    if (!el) return;
    const loading = !!(opts && opts.loading);
    const text = loading
      ? String((opts && opts.loadingText) || 'Loading…')
      : pretty(value);
    el.textContent = text;
    const block = el.closest('.payload-block');
    if (!block) return;
    block.classList.toggle('is-loading', loading);
    const empty = !loading && (text === '-' || text === '');
    block.classList.toggle('is-empty', empty);
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
    setPayloadMeta(summary.id, summary.providerCode || summary.provider_code, summary.txType || summary.tx_type);
    fillPayloadBox('txApiUrl', summary.apiUrl || summary.url || '', { loading: true, loadingText: 'Loading…' });
    fillPayloadBox('txRequestPayload', null, { loading: true, loadingText: 'Loading payload…' });
    fillPayloadBox('txResponsePayload', null, { loading: true, loadingText: 'Loading payload…' });
    fillPayloadBox('txRequestHeaders', null, { loading: true, loadingText: 'Loading headers…' });
    fillPayloadBox('txSignaturePlainText', null, { loading: true, loadingText: 'Loading signature input…' });
    fillPayloadBox('txGeneratedSignature', null, { loading: true, loadingText: 'Loading signature…' });
    fillPayloadBox('txRawJson', null, { loading: true, loadingText: 'Loading raw JSON…' });
    fillPayloadBox('txErrorMessage', null, { loading: true, loadingText: 'Loading…' });
    fillPayloadBox('txFullDebugJson', null, { loading: true, loadingText: 'Loading full debug JSON…' });
    modal.show();
    try {
      const x = await get(endpoint('PROVIDER_WALLET_TRANSACTION_LIST').replace(/\/list$/, '') + '/' + encodeURIComponent(summary.id));
      setPayloadMeta(x.id, x.providerCode || x.provider_code, x.txType || x.tx_type);
      fillPayloadBox('txApiUrl', x.apiUrl || x.api_url || x.url || '');
      fillPayloadBox('txRequestPayload', x.requestPayload || x.request_payload || '');
      fillPayloadBox('txResponsePayload', x.responsePayload || x.response_payload || '');
      fillPayloadBox('txRequestHeaders', x.requestHeaders || x.request_headers || '');
      fillPayloadBox('txSignaturePlainText', x.signaturePlainText || x.signature_plain_text || '');
      fillPayloadBox('txGeneratedSignature', x.generatedSignature || x.generated_signature || '');
      fillPayloadBox('txRawJson', x.rawJson || x.raw_json || '');
      fillPayloadBox('txErrorMessage', x.errorMessage || x.error_message || '');
      setFullDebugJson(x);
    } catch (e) {
      fillPayloadBox('txApiUrl', summary.apiUrl || summary.api_url || summary.url || '');
      fillPayloadBox('txRequestPayload', '');
      fillPayloadBox('txResponsePayload', '');
      fillPayloadBox('txRequestHeaders', '');
      fillPayloadBox('txSignaturePlainText', '');
      fillPayloadBox('txGeneratedSignature', '');
      fillPayloadBox('txRawJson', '');
      fillPayloadBox('txErrorMessage', e.message || 'Unable to load payload');
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
      $('txBody').innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Loading...</td></tr>';
      const data = await get(endpoint('PROVIDER_WALLET_TRANSACTION_LIST') + '?' + query(), controller.signal);
      lastRows = readList(data);
      totalPages = readTotalPages(data);
      totalElements = readTotalElements(data);
      publishPagerMeta(totalElements, pageSize);
      $('txBody').innerHTML = lastRows.length ? lastRows.map((x,i) => `
        <tr>
          <td>${esc(x.id)}</td>
          <td><b>${esc(x.providerCode || x.provider_code || '-')}</b></td>
          <td>${esc(x.txType || x.tx_type || '-')}</td>
          <td>${money(x.amount)}</td>
          <td>${statusBadge(x.status)}</td>
          <td>${esc(x.httpStatus || x.http_status || '-')}</td>
          <td><span class="pwt-url" title="${esc(x.apiUrl || x.api_url || '')}">${esc(x.apiUrl || x.api_url || '-')}</span></td>
          <td>${esc(dt(x.createdAt || x.created_at))}</td>
          <td><button class="clean-btn pwt-payload-btn" type="button" onclick="showProviderTxPayload(${i})"><i class="bi bi-braces"></i> Payload</button></td>
        </tr>`).join('') : '<tr><td colspan="9" class="text-center py-4 text-muted">No records</td></tr>';
      renderPages();
      renderInfo(lastRows.length);
      if (!autofitReloading) scheduleEvenFill();
    }catch(e){
      if (e && e.name === 'AbortError') return;
      $('txBody').innerHTML = '<tr><td colspan="9" class="text-danger text-center py-4">' + esc(e.message) + '</td></tr>';
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

  function paintDarkFilterControls(){
    const dark = document.documentElement.getAttribute('data-bo-theme') === 'dark';
    const el = document.getElementById('txKeyword');
    if (!el) return;
    const keys = [
      'background', 'background-color', 'background-image', 'border', 'border-color',
      'color', '-webkit-text-fill-color', 'caret-color', 'box-shadow', 'color-scheme',
      '-webkit-appearance', 'appearance'
    ];
    if (!dark) {
      keys.forEach(k => el.style.removeProperty(k));
      return;
    }
    el.style.setProperty('background', '#2A2C36', 'important');
    el.style.setProperty('background-color', '#2A2C36', 'important');
    el.style.setProperty('background-image', 'none', 'important');
    el.style.setProperty('border', '1px solid rgba(255,255,255,.14)', 'important');
    el.style.setProperty('color', '#F5F5F4', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#F5F5F4', 'important');
    el.style.setProperty('caret-color', '#F5F5F4', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('color-scheme', 'dark', 'important');
    el.style.setProperty('-webkit-appearance', 'none', 'important');
    el.style.setProperty('appearance', 'none', 'important');
    document.querySelectorAll('.provider-transaction-page .pwt-url').forEach(node => {
      node.style.setProperty('color', '#FFFFFF', 'important');
    });
  }

  function ensureDarkFilterStyleSheet(){
    if (document.getElementById('pwt-dark-runtime-css')) return;
    const s = document.createElement('style');
    s.id = 'pwt-dark-runtime-css';
    s.textContent = [
      'html[data-bo-theme="dark"] body.provider-transaction-page #txKeyword{',
      'background:#2A2C36!important;background-color:#2A2C36!important;background-image:none!important;',
      'border:1px solid rgba(255,255,255,.14)!important;color:#F5F5F4!important;',
      '-webkit-text-fill-color:#F5F5F4!important;caret-color:#F5F5F4!important;',
      'color-scheme:dark!important;box-shadow:none!important;',
      '-webkit-appearance:none!important;appearance:none!important}',
      'html[data-bo-theme="dark"] body.provider-transaction-page #txKeyword::placeholder{',
      'color:#A1A1AA!important;-webkit-text-fill-color:#A1A1AA!important;opacity:1!important}',
      'html[data-bo-theme="dark"] body.provider-transaction-page .pwt-url{color:#FFFFFF!important}'
    ].join('');
    document.documentElement.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    ensureDarkFilterStyleSheet();
    paintDarkFilterControls();
    /* bo-ui-standard classifies filters after us — repaint a few times so cream cannot stick */
    [0, 50, 150, 400, 1000].forEach(ms => setTimeout(paintDarkFilterControls, ms));
    new MutationObserver(paintDarkFilterControls).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bo-theme']
    });
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
