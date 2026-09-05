(function(){
  'use strict';

  const PAGE_SIZE = 10;
  const tbody = document.getElementById('masTableBody');
  const infoEl = document.getElementById('masTableInfo');
  const pagerEl = document.getElementById('masPager');
  const searchEl = document.getElementById('masSearch');
  const eventTypeEl = document.getElementById('masEventType');
  const statusEl = document.getElementById('masStatus');
  const fromEl = document.getElementById('masFrom');
  const toEl = document.getElementById('masTo');
  const resetBtn = document.getElementById('masReset');
  const detailModal = document.getElementById('masDetailModal');
  const detailTitle = document.getElementById('masDetailTitle');
  const detailSub = document.getElementById('masDetailSub');
  const detailGrid = document.getElementById('masDetailGrid');
  const detailRaw = document.getElementById('masDetailRaw');

  let allEvents = [];
  let filtered = [];
  let currentPage = 1;
  let category = 'all';

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pickerState = { view: new Date(), selectingStart: true, mode: 'days', yearPageStart: new Date().getFullYear() - 5 };

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function apiBase(){
    return (window.API_CONFIG && API_CONFIG.BASE_URL) || (window.API_BASE || '');
  }

  async function apiJson(url, opt){
    const r = await fetch(url, Object.assign({
      headers: Object.assign({}, BO_AUTH.authHeader(), { 'Cache-Control': 'no-cache' }),
      cache: 'no-store'
    }, opt || {}));
    const j = await r.json().catch(() => ({}));
    if(!r.ok || j.status === 'error') throw new Error(j.message || 'Request failed');
    return j;
  }

  function parseDate(v){
    if(!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function pad2(n){ return String(n).padStart(2, '0'); }

  function formatTime(d){
    if(!d) return { time: '—', date: '—' };
    return {
      time: pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()),
      date: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    };
  }

  function initials(name){
    const s = String(name || '').trim();
    if(!s) return '?';
    const parts = s.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
    if(parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }

  function prettyAction(action){
    return String(action || '-')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function classifyOpAction(action){
    const a = String(action || '').toLowerCase();
    if(/credit|balance|wallet|adjust|payout|deposit|withdraw/.test(a)) return 'credit';
    if(/role|permission|menu|access|authz|grant|revoke/.test(a)) return 'permission';
    if(/suspend|activate|password|create.?admin|update.?admin|delete.?admin|account|user|login|logout/.test(a)) return 'account';
    return 'account';
  }

  function opDetailText(row){
    try{
      const j = JSON.parse(row.afterJson || '{}');
      const rich = String(row.detail || '').trim();
      if(rich) return rich;
      if(j.path) return String(j.method || 'OP') + ' ' + j.path;
    }catch(e){}
    return row.detail || row.action || '—';
  }

  function opSuccess(row){
    try{
      const j = JSON.parse(row.afterJson || '{}');
      if(j.success === false) return false;
    }catch(e){}
    return true;
  }

  function mapLogin(row){
    const at = parseDate(row.loginAt || row.createdAt);
    const failed = String(row.status || '').toUpperCase() === 'FAILED';
    const title = failed ? 'Login blocked' : 'Admin login';
    const subtitle = failed
      ? (row.failureReason || 'Authentication failed')
      : 'Successful console sign-in';
    return {
      id: 'login-' + (row.id || (row.username + '-' + (row.loginAt || ''))),
      source: 'login',
      category: failed ? 'security' : 'account',
      eventType: failed ? 'security' : 'login',
      at: at,
      adminName: row.displayName || row.username || 'Unknown',
      username: row.username || '',
      roleLabel: row.roleName || row.role || 'Merchant',
      title: title,
      subtitle: subtitle,
      target: failed ? 'Auth Gateway' : 'Admin Console',
      ip: row.ipAddress || '—',
      location: row.location || row.city || row.country || '—',
      status: failed ? 'blocked' : 'success',
      tone: failed ? 'danger' : 'cyan',
      detail: {
        Time: row.loginAt || '—',
        Username: row.username || '—',
        'Display Name': row.displayName || '—',
        Status: failed ? 'Blocked' : 'Success',
        IP: row.ipAddress || '—',
        'User Agent': row.userAgent || '—',
        Reason: row.failureReason || '—'
      },
      raw: row
    };
  }

  function mapOperation(row){
    const ok = opSuccess(row);
    const cat = classifyOpAction(row.action);
    const title = prettyAction(row.action);
    const subtitle = opDetailText(row);
    const target = row.entityType
      ? (prettyAction(row.entityType) + (row.entityId != null ? ': #' + row.entityId : ''))
      : 'System';
    return {
      id: 'op-' + (row.id || (row.actor + '-' + row.createdAt + '-' + row.action)),
      source: 'operation',
      category: cat,
      eventType: cat,
      at: parseDate(row.createdAt),
      adminName: row.actor || 'SYSTEM',
      username: row.actor || '',
      roleLabel: row.roleName || 'Operator',
      title: title,
      subtitle: subtitle,
      target: target,
      ip: row.ipAddress || '—',
      location: row.location || '—',
      status: ok ? 'success' : 'failed',
      tone: ok ? (cat === 'permission' ? 'success' : 'cyan') : 'danger',
      detail: {
        Time: row.createdAt || '—',
        Actor: row.actor || 'SYSTEM',
        Action: row.action || '—',
        Entity: row.entityType || '—',
        'Entity ID': row.entityId != null ? String(row.entityId) : '—',
        IP: row.ipAddress || '—',
        Detail: subtitle,
        Status: ok ? 'Success' : 'Failed'
      },
      raw: row
    };
  }

  async function loadOperations(){
    const base = apiBase();
    const q = new URLSearchParams({ entityType: 'ADMIN_OPERATION', page: '0', size: '200' });
    try{
      const data = await apiJson(base + '/api/admin/rebate/audit?' + q).then(j => j.data || j);
      const rows = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
      return rows.map(mapOperation);
    }catch(e){
      return [];
    }
  }

  async function loadLogins(){
    try{
      const j = await apiJson(BO_AUTH.adminLoginLogsUrl());
      const rows = Array.isArray(j.data) ? j.data : [];
      return rows.map(mapLogin);
    }catch(e){
      throw e;
    }
  }

  function ymd(d){
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function niceDate(v){
    if(!v) return '';
    const a = String(v).split('-');
    return a.length === 3 ? a[2] + '/' + a[1] + '/' + a[0] : v;
  }
  function startOfWeek(d){
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay());
    return x;
  }
  function endOfWeek(d){
    const x = startOfWeek(d);
    x.setDate(x.getDate() + 6);
    return x;
  }
  function presetRange(key){
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let a = new Date(day), b = new Date(day);
    if(key === 'yesterday'){ a.setDate(a.getDate() - 1); b = new Date(a); }
    if(key === 'thisWeek'){ a = startOfWeek(day); b = endOfWeek(day); }
    if(key === 'lastWeek'){ a = startOfWeek(day); a.setDate(a.getDate() - 7); b = new Date(a); b.setDate(b.getDate() + 6); }
    if(key === 'thisMonth'){ a = new Date(day.getFullYear(), day.getMonth(), 1); b = new Date(day.getFullYear(), day.getMonth() + 1, 0); }
    if(key === 'lastMonth'){ a = new Date(day.getFullYear(), day.getMonth() - 1, 1); b = new Date(day.getFullYear(), day.getMonth(), 0); }
    if(key === 'thisYear'){ a = new Date(day.getFullYear(), 0, 1); b = new Date(day.getFullYear(), 11, 31); }
    if(key === 'lastYear'){ a = new Date(day.getFullYear() - 1, 0, 1); b = new Date(day.getFullYear() - 1, 11, 31); }
    return [ymd(a), ymd(b)];
  }
  function markPreset(name){
    document.querySelectorAll('[data-mas-range-preset]').forEach(b => b.classList.remove('active'));
    if(name){
      const el = document.querySelector('[data-mas-range-preset="' + name + '"]');
      if(el) el.classList.add('active');
    }
  }
  function updateDateLabel(){
    const label = document.getElementById('masDateLabel');
    if(!label || !fromEl || !toEl) return;
    const f = fromEl.value || '';
    const t = toEl.value || '';
    label.textContent = f && t
      ? niceDate(f) + ' – ' + niceDate(t)
      : f ? niceDate(f) + ' – Select end date'
      : 'Select date range';
  }
  function renderCalendar(){
    const monthBtn = document.getElementById('masCalMonth');
    const yearBtn = document.getElementById('masCalYear');
    const monthGrid = document.getElementById('masCalMonthGrid');
    const yearGrid = document.getElementById('masCalYearGrid');
    const dayView = document.getElementById('masCalDayView');
    const days = document.getElementById('masCalDays');
    if(!monthBtn || !yearBtn || !monthGrid || !yearGrid || !dayView || !days) return;

    monthBtn.innerHTML = MONTHS[pickerState.view.getMonth()] + ' <i class="bi bi-chevron-down"></i>';
    yearBtn.innerHTML = pickerState.view.getFullYear() + ' <i class="bi bi-chevron-down"></i>';
    monthGrid.innerHTML = MONTHS.map((m, i) =>
      '<button type="button" data-mas-month="' + i + '" class="' + (i === pickerState.view.getMonth() ? 'active' : '') + '">' + m + '</button>'
    ).join('');
    yearGrid.innerHTML = Array.from({ length: 12 }, (_, i) => pickerState.yearPageStart + i).map(y =>
      '<button type="button" data-mas-year="' + y + '" class="' + (y === pickerState.view.getFullYear() ? 'active' : '') + '">' + y + '</button>'
    ).join('');
    monthGrid.classList.toggle('show', pickerState.mode === 'months');
    yearGrid.classList.toggle('show', pickerState.mode === 'years');
    dayView.classList.toggle('hide', pickerState.mode !== 'days');

    const y0 = pickerState.view.getFullYear();
    const m = pickerState.view.getMonth();
    const first = new Date(y0, m, 1);
    const last = new Date(y0, m + 1, 0);
    const start = first.getDay();
    const total = last.getDate();
    const from = fromEl && fromEl.value || '';
    const to = toEl && toEl.value || '';
    let html = '';
    const prevLast = new Date(y0, m, 0).getDate();
    for(let i = 0; i < start; i++) html += '<button type="button" class="muted" disabled>' + (prevLast - start + i + 1) + '</button>';
    for(let d = 1; d <= total; d++){
      const val = ymd(new Date(y0, m, d));
      const inRange = from && to && val >= from && val <= to;
      const isEdge = val === from || val === to;
      html += '<button type="button" data-mas-day="' + val + '" class="' + (inRange ? 'in-range ' : '') + (isEdge ? 'selected' : '') + '">' + d + '</button>';
    }
    for(let i = 1; i <= 42 - start - total; i++) html += '<button type="button" class="muted" disabled>' + i + '</button>';
    days.innerHTML = html;
  }
  function setRange(from, to, preset, reload){
    if(fromEl) fromEl.value = from || '';
    if(toEl) toEl.value = to || '';
    markPreset(preset || '');
    updateDateLabel();
    renderCalendar();
    if(reload !== false) applyFilters();
  }
  function initDatePicker(){
    const trigger = document.getElementById('masDateTrigger');
    const picker = document.getElementById('masRangePicker');
    if(!trigger || !picker || !fromEl || !toEl) return;

    const [a, b] = presetRange('today');
    pickerState.view = new Date(a + 'T00:00:00');
    setRange(a, b, 'today', false);

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      picker.classList.toggle('show');
      pickerState.mode = 'days';
      renderCalendar();
    });
    document.addEventListener('click', e => {
      if(!e.target.closest('.mas-date-field')) picker.classList.remove('show');
    });
    document.querySelectorAll('[data-mas-range-preset]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const key = btn.getAttribute('data-mas-range-preset');
        const [x, y] = presetRange(key);
        pickerState.view = new Date(x + 'T00:00:00');
        pickerState.selectingStart = true;
        setRange(x, y, key, true);
        picker.classList.remove('show');
      });
    });
    const prev = document.getElementById('masCalPrev');
    const next = document.getElementById('masCalNext');
    const monthBtn = document.getElementById('masCalMonth');
    const yearBtn = document.getElementById('masCalYear');
    const monthGrid = document.getElementById('masCalMonthGrid');
    const yearGrid = document.getElementById('masCalYearGrid');
    const days = document.getElementById('masCalDays');

    prev && (prev.onclick = e => {
      e.stopPropagation();
      if(pickerState.mode === 'years') pickerState.yearPageStart -= 12;
      else pickerState.view.setMonth(pickerState.view.getMonth() - 1);
      renderCalendar();
    });
    next && (next.onclick = e => {
      e.stopPropagation();
      if(pickerState.mode === 'years') pickerState.yearPageStart += 12;
      else pickerState.view.setMonth(pickerState.view.getMonth() + 1);
      renderCalendar();
    });
    monthBtn && (monthBtn.onclick = e => {
      e.stopPropagation();
      pickerState.mode = pickerState.mode === 'months' ? 'days' : 'months';
      renderCalendar();
    });
    yearBtn && (yearBtn.onclick = e => {
      e.stopPropagation();
      pickerState.yearPageStart = pickerState.view.getFullYear() - 5;
      pickerState.mode = pickerState.mode === 'years' ? 'days' : 'years';
      renderCalendar();
    });
    monthGrid && (monthGrid.onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-mas-month]');
      if(!b) return;
      pickerState.view.setMonth(Number(b.getAttribute('data-mas-month')));
      pickerState.mode = 'days';
      renderCalendar();
    });
    yearGrid && (yearGrid.onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-mas-year]');
      if(!b) return;
      pickerState.view.setFullYear(Number(b.getAttribute('data-mas-year')));
      pickerState.mode = 'months';
      renderCalendar();
    });
    days && (days.onclick = e => {
      e.stopPropagation();
      const b = e.target.closest('[data-mas-day]');
      if(!b) return;
      const val = b.getAttribute('data-mas-day');
      if(!fromEl.value || (fromEl.value && toEl.value) || val < fromEl.value){
        fromEl.value = val;
        toEl.value = '';
        pickerState.selectingStart = false;
        markPreset('');
        updateDateLabel();
        renderCalendar();
        return;
      }
      toEl.value = val;
      pickerState.selectingStart = true;
      markPreset('');
      updateDateLabel();
      renderCalendar();
      picker.classList.remove('show');
      applyFilters();
    });
  }

  function dayBounds(fromYmd, toYmd){
    if(!fromYmd || !toYmd) return null;
    const start = new Date(fromYmd + 'T00:00:00');
    const end = new Date(toYmd + 'T23:59:59.999');
    if(isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return { start, end };
  }

  function updateKpis(events){
    const totalEl = document.getElementById('masStatTotal');
    const deltaEl = document.getElementById('masStatTotalDelta');
    const alertsEl = document.getElementById('masStatAlerts');
    const alertsMeta = document.getElementById('masStatAlertsMeta');
    const sessionsEl = document.getElementById('masStatSessions');
    const sessionsMeta = document.getElementById('masStatSessionsMeta');

    const now = Date.now();
    const d7 = now - 7 * 24 * 60 * 60 * 1000;
    const d14 = now - 14 * 24 * 60 * 60 * 1000;
    const d1 = now - 24 * 60 * 60 * 1000;

    const total = events.length;
    const last7 = events.filter(e => e.at && e.at.getTime() >= d7).length;
    const prev7 = events.filter(e => e.at && e.at.getTime() >= d14 && e.at.getTime() < d7).length;
    let deltaText = '—';
    let deltaClass = 'mas-kpi-meta';
    if(prev7 > 0){
      const pct = Math.round(((last7 - prev7) / prev7) * 100);
      deltaText = (pct >= 0 ? '+' : '') + pct + '% vs last 7 days';
      deltaClass = 'mas-kpi-meta ' + (pct >= 0 ? 'is-success' : 'is-danger');
    }else if(last7 > 0){
      deltaText = '+' + last7 + ' in last 7 days';
      deltaClass = 'mas-kpi-meta is-success';
    }

    const alerts = events.filter(e => e.status === 'blocked' || e.status === 'failed').length;
    const sessionUsers = new Set(
      events
        .filter(e => e.source === 'login' && e.status === 'success' && e.at && e.at.getTime() >= d1)
        .map(e => String(e.username || e.adminName).toLowerCase())
        .filter(Boolean)
    );

    if(totalEl) totalEl.textContent = total.toLocaleString();
    if(deltaEl){ deltaEl.className = deltaClass; deltaEl.textContent = deltaText; }
    if(alertsEl) alertsEl.textContent = String(alerts);
    if(alertsMeta){
      alertsMeta.className = 'mas-kpi-meta' + (alerts ? ' is-danger' : '');
      alertsMeta.textContent = alerts ? (alerts + ' need review') : 'No active alerts';
    }
    if(sessionsEl) sessionsEl.textContent = String(sessionUsers.size);
    if(sessionsMeta){
      sessionsMeta.innerHTML = '<i></i> ' + sessionUsers.size + ' active now';
    }

    const catAll = document.getElementById('masCatAll');
    if(catAll) catAll.textContent = String(total);
  }

  function applyFilters(){
    const q = (searchEl && searchEl.value || '').trim().toLowerCase();
    const eventType = eventTypeEl && eventTypeEl.value || '';
    const status = statusEl && statusEl.value || '';
    const bounds = dayBounds(fromEl && fromEl.value, toEl && toEl.value);

    filtered = allEvents.filter(e => {
      if(category !== 'all' && e.category !== category) return false;
      if(bounds){
        if(!e.at) return false;
        const t = e.at.getTime();
        if(t < bounds.start.getTime() || t > bounds.end.getTime()) return false;
      }
      if(eventType && e.eventType !== eventType && !(eventType === 'security' && e.category === 'security')) return false;
      if(status && e.status !== status) return false;
      if(q){
        const hay = [e.adminName, e.username, e.title, e.subtitle, e.target, e.ip].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
    currentPage = 1;
    renderTable();
  }

  function pageButtons(current, total){
    total = Math.max(1, Number(total) || 1);
    current = Math.max(1, Math.min(Number(current) || 1, total));
    const pages = [];
    const add = n => { if(n >= 1 && n <= total && !pages.includes(n)) pages.push(n); };
    add(1);
    for(let n = current - 2; n <= current + 2; n++) add(n);
    add(total);
    pages.sort((a, b) => a - b);
    let html = '';
    html += '<button type="button" class="smart-page nav-text" data-page="' + Math.max(1, current - 1) + '" ' + (current <= 1 ? 'disabled' : '') + '>Previous</button>';
    let prev = 0;
    pages.forEach(n => {
      if(prev && n - prev > 1) html += '<span class="smart-page-ellipsis">…</span>';
      html += '<button type="button" class="smart-page ' + (n === current ? 'active' : '') + '" data-page="' + n + '" ' + (n === current ? 'aria-current="page"' : '') + '>' + n + '</button>';
      prev = n;
    });
    html += '<button type="button" class="smart-page nav-text" data-page="' + Math.min(total, current + 1) + '" ' + (current >= total ? 'disabled' : '') + '>Next</button>';
    return html;
  }

  function renderTable(){
    if(!tbody) return;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);

    if(pagerEl) pagerEl.innerHTML = pageButtons(currentPage, totalPages);
    if(infoEl){
      infoEl.textContent = total
        ? ('Showing ' + (start + 1) + ' to ' + (start + rows.length) + ' of ' + total.toLocaleString() + ' records')
        : 'Showing 0 to 0 of 0 records';
    }

    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="7" class="mad-empty">No audit events found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((e, idx) => {
      const td = formatTime(e.at);
      const blocked = e.status === 'blocked' || e.status === 'failed';
      const statusLabel = e.status === 'blocked' ? 'Blocked' : (e.status === 'failed' ? 'Failed' : 'Success');
      const statusClass = e.status === 'blocked' ? 'is-blocked' : (e.status === 'failed' ? 'is-failed' : 'is-success');
      const dotClass = e.tone === 'danger' ? 'is-danger' : (e.tone === 'success' ? 'is-success' : '');
      const avClass = idx % 2 ? ' is-alt' : '';
      return '<tr class="' + (blocked ? 'is-blocked' : '') + '" data-event-id="' + esc(e.id) + '">' +
        '<td><div class="mas-time"><b>' + esc(td.time) + '</b><small>' + esc(td.date) + '</small></div></td>' +
        '<td><div class="mas-admin"><span class="mas-avatar' + avClass + '">' + esc(initials(e.adminName)) + '</span>' +
          '<div class="mas-admin-copy"><b>' + esc(e.adminName) + '</b><small>' + esc(e.roleLabel) + '</small></div></div></td>' +
        '<td><div class="mas-event"><span class="mas-dot ' + dotClass + '"></span>' +
          '<div class="mas-event-copy"><b>' + esc(e.title) + '</b><small>' + esc(e.subtitle) + '</small></div></div></td>' +
        '<td><span class="mas-target" title="' + esc(e.target) + '">' + esc(e.target) + '</span></td>' +
        '<td><div class="mas-ip"><b>' + esc(e.ip) + '</b><small><i class="bi bi-geo-alt-fill"></i> ' + esc(e.location) + '</small></div></td>' +
        '<td><span class="mas-status ' + statusClass + '"><i></i>' + statusLabel + '</span></td>' +
        '<td><button type="button" class="mas-view" data-mas-view="' + esc(e.id) + '">View <i class="bi bi-chevron-right"></i></button></td>' +
      '</tr>';
    }).join('');
  }

  function findEvent(id){
    return allEvents.find(e => e.id === id) || filtered.find(e => e.id === id);
  }

  function openDetail(id){
    const e = findEvent(id);
    if(!e || !detailModal) return;
    if(detailTitle) detailTitle.textContent = e.title || 'Event Details';
    if(detailSub) detailSub.textContent = (e.adminName || '') + (e.at ? ' · ' + e.at.toLocaleString() : '');
    if(detailGrid){
      const entries = Object.entries(e.detail || {});
      detailGrid.innerHTML = entries.map(([k, v]) =>
        '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>'
      ).join('');
    }
    if(detailRaw){
      try{
        detailRaw.hidden = false;
        detailRaw.textContent = JSON.stringify(e.raw || {}, null, 2);
      }catch(err){
        detailRaw.hidden = true;
      }
    }
    detailModal.classList.add('show');
    detailModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeDetail(){
    if(!detailModal) return;
    detailModal.classList.remove('show');
    detailModal.setAttribute('aria-hidden', 'true');
    if(!document.querySelector('.modal-clean.show')) document.body.classList.remove('modal-open');
  }

  async function loadAll(){
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="mad-empty">Loading audit events...</td></tr>';
    try{
      let loginErr = null;
      const [logins, ops] = await Promise.all([
        loadLogins().catch(err => { loginErr = err; return []; }),
        loadOperations()
      ]);
      if(!logins.length && !ops.length && loginErr) throw loginErr;
      allEvents = logins.concat(ops).filter(Boolean);
      allEvents.sort((a, b) => {
        const ta = a.at ? a.at.getTime() : 0;
        const tb = b.at ? b.at.getTime() : 0;
        return tb - ta;
      });
      updateKpis(allEvents);
      applyFilters();
    }catch(err){
      allEvents = [];
      filtered = [];
      updateKpis([]);
      if(pagerEl) pagerEl.innerHTML = pageButtons(1, 1);
      if(infoEl) infoEl.textContent = 'Showing 0 to 0 of 0 records';
      if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="mad-empty text-danger">' + esc(err.message || 'Load audit failed') + '</td></tr>';
    }
  }

  document.querySelectorAll('[data-mas-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      category = btn.getAttribute('data-mas-cat') || 'all';
      document.querySelectorAll('[data-mas-cat]').forEach(b => {
        b.classList.toggle('is-active', b === btn);
      });
      applyFilters();
    });
  });

  let searchTimer = null;
  searchEl && searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 200);
  });
  eventTypeEl && eventTypeEl.addEventListener('change', applyFilters);
  statusEl && statusEl.addEventListener('change', applyFilters);
  resetBtn && resetBtn.addEventListener('click', () => {
    if(searchEl) searchEl.value = '';
    if(eventTypeEl) eventTypeEl.value = '';
    if(statusEl) statusEl.value = '';
    const [a, b] = presetRange('today');
    pickerState.view = new Date(a + 'T00:00:00');
    pickerState.selectingStart = true;
    setRange(a, b, 'today', false);
    category = 'all';
    document.querySelectorAll('[data-mas-cat]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-mas-cat') === 'all');
    });
    applyFilters();
  });

  initDatePicker();

  pagerEl && pagerEl.addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if(!b || b.disabled) return;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const n = Number(b.dataset.page);
    if(n >= 1 && n <= totalPages && n !== currentPage){
      currentPage = n;
      renderTable();
    }
  });

  tbody && tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-mas-view]');
    if(!btn) return;
    openDetail(btn.getAttribute('data-mas-view'));
  });

  document.querySelectorAll('[data-mas-close]').forEach(btn => btn.addEventListener('click', closeDetail));
  detailModal && detailModal.addEventListener('click', e => { if(e.target === detailModal) closeDetail(); });

  if(pagerEl) pagerEl.innerHTML = pageButtons(1, 1);
  loadAll();
})();
