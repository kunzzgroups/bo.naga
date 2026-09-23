(function(){
  let page = 1;
  let totalPages = 1;
  let totalElements = 0;
  let lastResolved = 0;
  let lockedAutoSize = null;
  let autofitReloading = false;
  let autofitSettled = false;
  let memberMap = {};

  const $ = id => document.getElementById(id);

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function money(v){
    const n = Number(v || 0);
    return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function dt(v){
    return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-');
  }
  function memberName(x){
    const direct = x.username || x.memberUsername || x.memberName || x.mobile || x.memberMobile;
    if (direct) return direct;
    const m = memberMap[String(x.memberId || '')];
    return (m && (m.username || m.mobile || m.name || m.fullName)) || x.memberId || '-';
  }
  function statusPill(status){
    const value = String(status || '').toUpperCase();
    const cls = value === 'OPEN' ? 'status-pill active' : (value === 'CLOSED' ? 'status-pill is-closed' : 'status-pill');
    return '<span class="' + cls + '">' + esc(value || '-') + '</span>';
  }

  function tableScroll(){ return document.querySelector('.provider-session-page .table-wrap'); }
  function isAutoPageSize(raw){
    const v = String(raw ?? ($('sessionSize') && $('sessionSize').value) ?? '-').trim();
    return v === '' || v === '-' || /^auto$/i.test(v);
  }
  function isPlaceholderRow(tr){
    const t = (tr && tr.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return !t || /loading|no records|request failed|unable/.test(t);
  }
  function syncScrollMode(){
    const auto = isAutoPageSize();
    document.body.classList.toggle('is-autofit', auto);
    const wrap = tableScroll();
    const card = $('sessionTableCard');
    if (wrap) wrap.toggleAttribute('data-bo-autofit', auto);
    if (card) card.toggleAttribute('data-bo-autofit', auto);
    if (!auto) resetEvenFill();
  }
  function lockPageSizeChrome(){
    const sel = $('sessionSize');
    if (!sel) return;
    const wrap = sel.closest('.rounded-select-wrap');
    const host = sel.closest('.entries-control');
    if (host){
      host.style.removeProperty('width');
      host.style.removeProperty('min-width');
      host.style.removeProperty('max-width');
      host.style.removeProperty('flex');
      host.style.removeProperty('--bo-select-width');
    }
    if (wrap){
      wrap.style.setProperty('width', '72px', 'important');
      wrap.style.setProperty('min-width', '72px', 'important');
      wrap.style.setProperty('max-width', '72px', 'important');
      wrap.style.setProperty('flex', '0 0 72px', 'important');
    }
  }
  function clearLockedAutoSize(){
    lockedAutoSize = null;
    autofitSettled = false;
  }
  function naturalRowHeight(scroll){
    const sample = scroll && scroll.querySelector('tbody tr:not(.bo-table-fill) td');
    /* Member cell is 2-line (name + ID) — floor against a taller minimum. */
    return sample ? Math.max(52, Math.round(sample.getBoundingClientRect().height)) : 56;
  }
  function measureAutoPageSize(){
    const scroll = tableScroll();
    if (!scroll || scroll.clientHeight < 80) return 10;
    const head = scroll.querySelector('thead');
    const headH = head ? Math.ceil(head.getBoundingClientRect().height) : 44;
    const avail = Math.max(0, Math.floor(scroll.clientHeight) - headH);
    const rowH = naturalRowHeight(scroll);
    return Math.max(5, Math.min(200, Math.floor(avail / rowH) || 10));
  }
  function autoFitPageSize(){
    if (lockedAutoSize != null) return lockedAutoSize;
    lockedAutoSize = measureAutoPageSize();
    return lockedAutoSize;
  }
  function resolvedSize(){
    const raw = String(($('sessionSize') && $('sessionSize').value) || '-').trim();
    if (/^all$/i.test(raw)) return 10000;
    if (isAutoPageSize(raw)) return autoFitPageSize();
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : autoFitPageSize();
  }
  function resetEvenFill(){
    const body = $('sessionBody');
    const table = body && body.closest('table');
    if (!body || !table) return;
    table.classList.remove('bo-tx-evenfill');
    table.style.height = '';
    body.querySelectorAll('tr.bo-table-fill').forEach(r => r.remove());
    [...body.querySelectorAll('tr')].forEach(tr => {
      tr.style.height = '';
      tr.querySelectorAll('td').forEach(td => { td.style.height = ''; td.style.minHeight = ''; });
    });
  }
  function bodyAvail(scroll){
    if (!scroll) return 0;
    const head = scroll.querySelector('thead');
    const headH = head ? Math.ceil(head.getBoundingClientRect().height) : 0;
    return Math.max(0, Math.floor(scroll.clientHeight) - headH);
  }
  function settleAutofitFromPaint(){
    if (autofitReloading || autofitSettled) return;
    if (!isAutoPageSize()) return;
    const scroll = tableScroll();
    const body = $('sessionBody');
    if (!scroll || !body) return;
    resetEvenFill();
    void scroll.offsetHeight;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!rows.length){ autofitSettled = true; return; }
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    const rowH = Math.max(52, Math.round(natural / rows.length) || 56);
    const overflow = scroll.scrollHeight > scroll.clientHeight + 1 || natural > avail + 1;
    let target = Math.max(5, Math.min(200, Math.floor(avail / rowH) || rows.length));
    if (overflow) target = Math.max(5, Math.min(target, rows.length - 1));

    const verifyAndLock = () => {
      requestAnimationFrame(() => {
        const sc = tableScroll();
        if (sc && sc.scrollHeight > sc.clientHeight + 1 && lockedAutoSize > 5){
          lockedAutoSize = Math.max(5, lockedAutoSize - 1);
          lastResolved = lockedAutoSize;
          autofitReloading = true;
          Promise.resolve(load()).finally(() => { autofitReloading = false; verifyAndLock(); });
          return;
        }
        autofitSettled = true;
        evenFillRowHeights();
      });
    };

    if (target === rows.length){
      lockedAutoSize = rows.length;
      lastResolved = lockedAutoSize;
      verifyAndLock();
      return;
    }
    lockedAutoSize = target;
    lastResolved = target;
    page = 1;
    autofitReloading = true;
    Promise.resolve(load()).finally(() => { autofitReloading = false; verifyAndLock(); });
  }
  function evenFillRowHeights(){
    const body = $('sessionBody');
    const scroll = tableScroll();
    const table = body && body.closest('table');
    if (!body || !scroll || !table) return;
    resetEvenFill();
    if (!isAutoPageSize()) return;
    const rows = [...body.querySelectorAll('tr')].filter(tr => !isPlaceholderRow(tr));
    if (!rows.length) return;
    void table.offsetHeight;
    const avail = bodyAvail(scroll);
    const natural = rows.reduce((sum, tr) => sum + Math.ceil(tr.getBoundingClientRect().height), 0);
    const rowH = Math.max(52, Math.round(natural / rows.length) || 56);
    const gap = avail - natural;
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
    table.style.height = (avail + (scroll.querySelector('thead') ? Math.ceil(scroll.querySelector('thead').getBoundingClientRect().height) : 0)) + 'px';
    if (scroll.scrollHeight > scroll.clientHeight){
      const over = scroll.scrollHeight - scroll.clientHeight;
      const shrink = Math.ceil(over / rows.length) || 1;
      rows.forEach(tr => {
        const h = Math.max(rowH, (parseFloat(tr.style.height) || base) - shrink);
        tr.style.height = h + 'px';
        tr.querySelectorAll('td').forEach(td => { td.style.height = h + 'px'; });
      });
    }
  }
  function scheduleEvenFill(){
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (isAutoPageSize() && !autofitSettled){
        settleAutofitFromPaint();
        return;
      }
      evenFillRowHeights();
    }));
  }

  function pageButtons(current, total){
    total = Math.max(1, Number(total) || 1);
    current = Math.max(1, Math.min(Number(current) || 1, total));
    const pages = [];
    const add = n => { if (n >= 1 && n <= total && pages.indexOf(n) < 0) pages.push(n); };
    add(1);
    for (let n = current - 2; n <= current + 2; n++) add(n);
    add(total);
    pages.sort((a,b) => a - b);
    const nav = (n, label, cls, disabled) => '<button type="button" class="smart-page ' + cls + '" data-page="' + n + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
    let html = nav(1, '<i class="bi bi-chevron-bar-left" aria-hidden="true"></i>', 'first', current <= 1);
    html += nav(Math.max(1, current - 1), '‹', 'prev', current <= 1);
    let prev = 0;
    pages.forEach(n => {
      if (prev && n - prev > 1) html += '<span class="smart-page-ellipsis" aria-hidden="true">…</span>';
      html += '<button type="button" class="smart-page' + (n === current ? ' active' : '') + '" data-page="' + n + '"' + (n === current ? ' aria-current="page"' : '') + '>' + n + '</button>';
      prev = n;
    });
    html += nav(Math.min(total, current + 1), '›', 'next', current >= total);
    html += nav(total, '<i class="bi bi-chevron-bar-right" aria-hidden="true"></i>', 'last', current >= total);
    return html;
  }
  function renderInfo(rowCount){
    const info = $('sessionPageInfo');
    if (!info) return;
    const size = lastResolved || resolvedSize();
    const from = totalElements && rowCount ? ((page - 1) * size) + 1 : 0;
    const to = totalElements ? Math.min(((page - 1) * size) + rowCount, totalElements) : 0;
    info.textContent = 'Showing ' + from + ' to ' + to + ' of ' + totalElements + ' entries';
    const card = $('sessionTableCard');
    if (card){
      card.dataset.boTotal = String(totalElements);
      card.dataset.boPage = String(page);
      card.dataset.boPageSize = String(size);
    }
  }
  function setPager(){
    const el = $('sessionPager');
    if (el) el.innerHTML = pageButtons(page, totalPages);
  }

  async function loadMemberMap(){
    try{
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_LIST, {headers:{...BO_AUTH.authHeader()}});
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json.data) ? json.data : (json.data && Array.isArray(json.data.content) ? json.data.content : []);
      memberMap = {};
      rows.forEach(m => { const id = m.id || m.memberId || m.userId; if (id != null) memberMap[String(id)] = m; });
    }catch(e){ memberMap = {}; }
  }
  function endpoint(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }
  async function get(url){
    const res = await fetch(url, {headers:{...BO_AUTH.authHeader()}});
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json.data || {};
  }
  function readList(data){ return data.items || data.list || data.content || data.rows || []; }
  function readTotalPages(data){ return Number(data.totalPages || data.pages || 1) || 1; }
  function readTotal(data, rows){
    const n = Number(data.totalElements ?? data.total ?? data.totalCount ?? data.count);
    if (Number.isFinite(n) && n >= 0) return n;
    const pages = readTotalPages(data);
    if (pages <= 1) return rows.length;
    return pages * (lastResolved || rows.length);
  }
  function query(){
    const p = new URLSearchParams();
    const from = $('sessionFrom');
    const to = $('sessionTo');
    const status = $('sessionStatus');
    if (from && from.value.trim()) p.set('from', from.value.trim());
    if (to && to.value.trim()) p.set('to', to.value.trim());
    if (status && status.value.trim()) p.set('status', status.value.trim());
    const raw = (($('sessionKeyword') && $('sessionKeyword').value) || '').trim();
    if (raw){
      p.set('keyword', raw);
      if (/^\d+$/.test(raw)) p.set('memberId', raw);
      else if (/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(raw)) p.set('providerCode', raw);
      else p.set('gameId', raw);
    }
    lastResolved = resolvedSize();
    p.set('page', page);
    p.set('size', String(lastResolved));
    return p.toString();
  }
  function rowHtml(x){
    return '<tr>'
      + '<td>' + esc(x.id) + '</td>'
      + '<td class="ps-member"><b>' + esc(memberName(x)) + '</b><small>ID ' + esc(x.memberId || '-') + '</small></td>'
      + '<td>' + esc(x.providerCode || '-') + '</td>'
      + '<td>' + esc(x.gameName || x.gameCode || x.gameId || '-') + '</td>'
      + '<td>' + esc(x.launchType || '-') + '</td>'
      + '<td class="ps-money">' + money(x.transferAmount) + '</td>'
      + '<td class="ps-money">' + money(x.transferBackAmount) + '</td>'
      + '<td>' + statusPill(x.status) + '</td>'
      + '<td>' + esc(dt(x.startedAt || x.createdAt)) + '</td>'
      + '<td>' + esc(dt(x.endedAt)) + '</td>'
      + '</tr>';
  }
  async function load(){
    const body = $('sessionBody');
    syncScrollMode();
    try{
      const data = await get(endpoint('PLAYER_PROVIDER_SESSION_LIST') + '?' + query());
      const rows = readList(data);
      totalPages = readTotalPages(data);
      totalElements = readTotal(data, rows);
      if (page > totalPages) page = totalPages;
      body.innerHTML = rows.length
        ? rows.map(rowHtml).join('')
        : '<tr><td class="ps-empty" colspan="10">No records</td></tr>';
      setPager();
      renderInfo(rows.length);
      if (!autofitReloading) scheduleEvenFill();
    }catch(e){
      totalElements = 0;
      body.innerHTML = '<tr><td class="ps-error" colspan="10">' + esc(e.message) + '</td></tr>';
      setPager();
      renderInfo(0);
      resetEvenFill();
    }
  }
  function search(){
    page = 1;
    clearLockedAutoSize();
    load();
  }
  function go(n){
    const next = Number(n);
    if (next >= 1 && next <= totalPages && next !== page){ page = next; load(); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    let keywordTimer = 0;
    let rangeTimer = 0;
    const scheduleSearch = () => {
      clearTimeout(rangeTimer);
      rangeTimer = setTimeout(search, 0);
    };
    $('sessionFrom')?.addEventListener('change', scheduleSearch);
    $('sessionTo')?.addEventListener('change', scheduleSearch);
    $('sessionStatus')?.addEventListener('change', search);
    $('sessionKeyword')?.addEventListener('input', () => {
      clearTimeout(keywordTimer);
      keywordTimer = setTimeout(search, 350);
    });
    $('sessionKeyword')?.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(keywordTimer);
      search();
    });
    $('sessionSize')?.addEventListener('change', () => {
      clearLockedAutoSize();
      syncScrollMode();
      lockPageSizeChrome();
      search();
    });
    $('sessionSize')?.addEventListener('bo:select-sync', lockPageSizeChrome);
    syncScrollMode();
    lockPageSizeChrome();
    requestAnimationFrame(() => requestAnimationFrame(lockPageSizeChrome));
    $('sessionPager')?.addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      go(b.dataset.page);
    });
    let sizeTimer = 0;
    const scroll = tableScroll();
    if (scroll && !scroll._boEvenFillObs){
      scroll._boEvenFillObs = new ResizeObserver(() => {
        if (!isAutoPageSize()) return;
        clearTimeout(sizeTimer);
        sizeTimer = setTimeout(() => {
          const prev = lockedAutoSize;
          clearLockedAutoSize();
          const next = autoFitPageSize();
          syncScrollMode();
          if (next !== prev){ page = 1; load(); }
          else scheduleEvenFill();
        }, 32);
      });
      scroll._boEvenFillObs.observe(scroll);
    }
    window.addEventListener('resize', () => {
      if (!isAutoPageSize()) return;
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => {
        const prev = lockedAutoSize;
        clearLockedAutoSize();
        const next = autoFitPageSize();
        if (next !== prev){ page = 1; load(); }
        else scheduleEvenFill();
      }, 200);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => loadMemberMap().finally(load)));
  });
})();
