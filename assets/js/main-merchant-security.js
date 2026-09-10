(function(){
  'use strict';

  const tbody = document.getElementById('masTableBody');
  const infoEl = document.getElementById('masTableInfo');
  const tableWrap = document.querySelector('.mas-table-wrap');
  const tableScroll = document.getElementById('masTableScroll') || document.querySelector('.mas-table-body-scroll');
  const panelEl = document.querySelector('.mas-panel');
  const searchEl = document.getElementById('masSearch');
  const eventTypeEl = document.getElementById('masEventType');
  const merchantEl = document.getElementById('masMerchantFilter');
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
  let category = 'all';
  let resizeTimer = null;

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

  const SENSITIVE_KEY = /password|passwd|token|secret|signature|api.?key|authorization|auth|pin|credential/i;
  const NOISE_KEY = /url|uri|endpoint|image|logo|icon|header|payload|body|raw|json|request|response|user.?agent|cookie|html|content/i;
  const HIGHLIGHT_KEY = /^(id|name|code|type|status|mode|amount|balance|role|username|email|environment|env|category|wallet|currency|enabled|active|success|method|provider|merchant|brand|admin|action)$|(_|^)(name|code|type|status|mode|amount|balance|role|env|environment|wallet|currency|id)$/i;

  function safeParseJson(v){
    if(v == null || v === '') return null;
    if(typeof v === 'object') return v;
    try{ return JSON.parse(v); }catch(e){ return null; }
  }

  function prettyLabel(key){
    return String(key || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function leafKey(path){
    const parts = String(path || '').split(/[.\s/]+/).filter(Boolean);
    return parts[parts.length - 1] || path;
  }

  function displayKey(key){
    const s = String(key || '').trim();
    if(!s) return 'Field';
    if(s.length <= 28 && (s.match(/[\s._/-]/g) || []).length <= 3) return prettyLabel(s);
    return prettyLabel(leafKey(s));
  }

  function shortVal(v, max){
    const limit = max || 36;
    if(v == null) return '—';
    if(typeof v === 'boolean') return v ? 'true' : 'false';
    if(typeof v === 'object'){
      try{ v = JSON.stringify(v); }catch(e){ return '…'; }
    }
    const s = String(v).replace(/\s+/g, ' ').trim();
    if(!s) return '—';
    if(SENSITIVE_KEY.test(s) && s.length > 12) return '••••';
    return s.length > limit ? s.slice(0, limit - 1) + '…' : s;
  }

  function flattenPairs(obj, prefix, out){
    if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return out || [];
    out = out || [];
    Object.keys(obj).forEach(k => {
      const path = prefix ? prefix + '.' + k : k;
      const v = obj[k];
      if(v != null && typeof v === 'object' && !Array.isArray(v)) flattenPairs(v, path, out);
      else out.push([path, v]);
    });
    return out;
  }

  function parseDetailPairs(text){
    const raw = String(text || '').trim();
    if(!raw) return [];
    const asJson = safeParseJson(raw);
    if(asJson && typeof asJson === 'object' && !Array.isArray(asJson)){
      if(asJson.fields && typeof asJson.fields === 'object') return flattenPairs(asJson.fields);
      return flattenPairs(asJson);
    }
    const pairs = [];
    const re = /([A-Za-z][\w.\s/-]{0,40}?)\s*=\s*([^,;]+?)(?=(?:\s*,\s*|\s*;\s*|\s+[A-Za-z][\w.\s/-]{0,40}?=)|$)/g;
    let m;
    while((m = re.exec(raw))){
      const k = m[1].replace(/\s+/g, ' ').trim();
      const v = m[2].replace(/\s+/g, ' ').trim();
      if(k) pairs.push([k, v]);
    }
    return pairs;
  }

  function isHighlightKey(key){
    const leaf = leafKey(key);
    if(SENSITIVE_KEY.test(key) || SENSITIVE_KEY.test(leaf)) return false;
    if(NOISE_KEY.test(key) || NOISE_KEY.test(leaf)) return false;
    return HIGHLIGHT_KEY.test(leaf) || HIGHLIGHT_KEY.test(key);
  }

  function valuesEqual(a, b){
    if(a === b) return true;
    if(a == null || b == null) return a == b;
    if(typeof a === 'object' || typeof b === 'object'){
      try{ return JSON.stringify(a) === JSON.stringify(b); }catch(e){ return false; }
    }
    return String(a) === String(b);
  }

  function businessObject(j){
    if(!j || typeof j !== 'object') return null;
    if(j.fields && typeof j.fields === 'object') return j.fields;
    if(j.before && typeof j.before === 'object') return j.before;
    if(j.after && typeof j.after === 'object') return j.after;
    if(j.data && typeof j.data === 'object' && !Array.isArray(j.data)) return j.data;
    const keys = Object.keys(j);
    if(keys.length && keys.every(k => /^(method|path|success|status|message|timestamp|durationMs|requestId)$/i.test(k))) return null;
    return j;
  }

  function diffPairs(before, after){
    const a = flattenPairs(before || {});
    const bMap = {};
    flattenPairs(after || {}).forEach(([k, v]) => { bMap[k] = v; });
    const aMap = {};
    a.forEach(([k, v]) => { aMap[k] = v; });
    const keys = Array.from(new Set(Object.keys(aMap).concat(Object.keys(bMap))));
    const changes = [];
    keys.forEach(k => {
      if(SENSITIVE_KEY.test(k) || SENSITIVE_KEY.test(leafKey(k))) return;
      if(NOISE_KEY.test(k) || NOISE_KEY.test(leafKey(k))) return;
      if(!(k in aMap)) changes.push({ key: k, from: undefined, to: bMap[k], kind: 'add' });
      else if(!(k in bMap)) changes.push({ key: k, from: aMap[k], to: undefined, kind: 'remove' });
      else if(!valuesEqual(aMap[k], bMap[k])) changes.push({ key: k, from: aMap[k], to: bMap[k], kind: 'change' });
    });
    changes.sort((x, y) => Number(isHighlightKey(y.key)) - Number(isHighlightKey(x.key)));
    return changes;
  }

  function formatChangeBits(changes, limit){
    const max = limit || 3;
    const bits = changes.slice(0, max).map(c => {
      const label = displayKey(c.key);
      if(c.kind === 'add') return label + ': ' + shortVal(c.to);
      if(c.kind === 'remove') return label + ' removed';
      return label + ': ' + shortVal(c.from, 20) + ' → ' + shortVal(c.to, 20);
    });
    if(changes.length > max) bits.push('+' + (changes.length - max) + ' more');
    return bits.join(' · ');
  }

  function pickHighlightBits(pairs, limit){
    const max = limit || 3;
    const scored = pairs
      .filter(([k, v]) => v != null && String(v).trim() !== '' && isHighlightKey(k))
      .map(([k, v]) => ({ k, v, score: /name|code/i.test(leafKey(k)) ? 2 : 1 }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, max).map(x => displayKey(x.k) + ' ' + shortVal(x.v, 28));
  }

  function actionVerb(action){
    const a = String(action || '').toLowerCase();
    if(/^create|add|insert/.test(a)) return 'Created';
    if(/^update|edit|modify|patch|save/.test(a)) return 'Updated';
    if(/^delete|remove|destroy/.test(a)) return 'Deleted';
    if(/^suspend|disable|block/.test(a)) return 'Suspended';
    if(/^activate|enable|unblock/.test(a)) return 'Activated';
    if(/login/.test(a)) return 'Signed in';
    if(/logout/.test(a)) return 'Signed out';
    if(/credit|adjust|deposit|withdraw|payout/.test(a)) return 'Adjusted';
    return prettyAction(action);
  }

  function opDetailText(row){
    const before = businessObject(safeParseJson(row.beforeJson));
    const afterFull = safeParseJson(row.afterJson);
    const after = businessObject(afterFull);

    if(before && after){
      const changes = diffPairs(before, after);
      if(changes.length) return formatChangeBits(changes, 3);
      return 'No field changes';
    }

    const detailPairs = parseDetailPairs(row.detail);
    if(before && detailPairs.length){
      const afterFromDetail = {};
      detailPairs.forEach(([k, v]) => { afterFromDetail[k] = v; });
      const changes = diffPairs(before, afterFromDetail);
      if(changes.length) return formatChangeBits(changes, 3);
    }

    if(detailPairs.length){
      const bits = pickHighlightBits(detailPairs, 3);
      if(bits.length){
        const verb = actionVerb(row.action);
        if(/^(Created|Deleted|Suspended|Activated)/.test(verb)) return verb + ' · ' + bits.join(' · ');
        if(verb === 'Updated') return 'Set ' + bits.join(' · ');
        return bits.join(' · ');
      }
    }

    if(afterFull && afterFull.path){
      const path = String(afterFull.path).replace(/^\/api\//, '/');
      return String(afterFull.method || 'OP') + ' ' + shortVal(path, 48);
    }

    const rich = String(row.detail || '').trim();
    if(rich){
      const oneLine = rich.replace(/\s+/g, ' ');
      return oneLine.length > 72 ? oneLine.slice(0, 71) + '…' : oneLine;
    }
    return actionVerb(row.action);
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
      merchantId: row.brandId == null ? null : Number(row.brandId),
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
    let merchantId = row.brandId == null ? null : Number(row.brandId);
    if(!merchantId){
      try{
        const j = JSON.parse(row.afterJson || '{}');
        merchantId = Number(j.brandId || j.merchantId || 0) || null;
        if(!merchantId && j.path){ const m=String(j.path).match(/\/(?:brands|merchants)\/(\d+)/); if(m) merchantId=Number(m[1]); }
      }catch(e){}
    }
    const fullDetail = String(row.detail || '').trim();
    const detailMap = {
      Time: row.createdAt || '—',
      Actor: row.actor || 'SYSTEM',
      Action: row.action || '—',
      Entity: row.entityType || '—',
      'Entity ID': row.entityId != null ? String(row.entityId) : '—',
      IP: row.ipAddress || '—',
      Summary: subtitle,
      Status: ok ? 'Success' : 'Failed'
    };
    if(fullDetail && fullDetail !== subtitle && fullDetail.length <= 160){
      detailMap.Detail = fullDetail;
    }
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
      detail: detailMap,
      merchantId: merchantId,
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

  async function loadMerchants(){
    if(!merchantEl) return;
    try{
      const j=await apiJson(apiBase() + '/api/admin/merchants');
      const rows=Array.isArray(j.data)?j.data:[];
      merchantEl.innerHTML='<option value="">All Merchants</option>'+rows.map(b=>'<option value="'+b.id+'">'+esc(b.name||'')+' ('+esc(b.code||'')+')</option>').join('');
      const qp=new URLSearchParams(location.search).get('merchantId'); if(qp) merchantEl.value=qp;
    }catch(e){ merchantEl.innerHTML='<option value="">All Merchants</option>'; }
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
    const merchantId = merchantEl && merchantEl.value || '';
    const bounds = dayBounds(fromEl && fromEl.value, toEl && toEl.value);

    const baseFiltered = allEvents.filter(e => {
      if(merchantId && String(e.merchantId || '') !== String(merchantId)) return false;
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

    const catAll = document.getElementById('masCatAll');
    if(catAll) catAll.textContent = String(baseFiltered.length);

    filtered = baseFiltered.filter(e => {
      if(category !== 'all' && e.category !== category) return false;
      return true;
    });
    renderTable();
  }

  function fitTableArea(){
    if(!tableWrap || !panelEl) return 0;
    const footer = panelEl.querySelector('.mad-footer');
    const footerH = footer ? Math.max(footer.getBoundingClientRect().height, 52) : 56;
    const top = tableWrap.getBoundingClientRect().top;
    const avail = Math.floor(window.innerHeight - top - footerH - 8);
    const h = Math.max(180, avail);
    tableWrap.style.height = h + 'px';
    tableWrap.style.maxHeight = h + 'px';
    if(tableScroll){
      tableScroll.style.height = '';
      tableScroll.style.maxHeight = '';
    }
    return h;
  }

  function renderTable(){
    if(!tbody) return;
    const total = filtered.length;
    const rows = filtered;

    if(infoEl){
      infoEl.textContent = total
        ? ('Showing ' + total.toLocaleString() + ' records')
        : 'Showing 0 records';
    }

    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="7" class="mad-empty">No audit events found.</td></tr>';
      fitTableArea();
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

    fitTableArea();
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
      await loadMerchants();
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
      if(infoEl) infoEl.textContent = 'Showing 0 records';
      if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="mad-empty text-danger">' + esc(err.message || 'Load audit failed') + '</td></tr>';
      fitTableArea();
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

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitTableArea, 120);
  });

  tbody && tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-mas-view]');
    if(!btn) return;
    openDetail(btn.getAttribute('data-mas-view'));
  });

  document.querySelectorAll('[data-mas-close]').forEach(btn => btn.addEventListener('click', closeDetail));
  detailModal && detailModal.addEventListener('click', e => { if(e.target === detailModal) closeDetail(); });

  fitTableArea();
  loadAll().then(() => requestAnimationFrame(fitTableArea));
})();
