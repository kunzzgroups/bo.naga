(function(){
  'use strict';

  const PAGE_SIZE = 7;
  const tbody = document.getElementById('mpvTableBody');
  const searchInput = document.getElementById('mpvSearchInput');
  const typeFilter = document.getElementById('mpvTypeFilter');
  const envFilter = document.getElementById('mpvEnvFilter');
  const resetBtn = document.getElementById('mpvResetBtn');
  const exportBtn = document.getElementById('mpvExportBtn');
  const pageNoEl = document.getElementById('mpvPager');
  const infoEl = document.getElementById('mpvTableInfo');
  const syncLabel = document.getElementById('mpvSyncLabel');
  const activeBadge = document.getElementById('mpvActiveBadge');

  let statusPill = 'all';
  let currentPage = 1;
  let allRows = [];
  let filtered = [];
  let syncedAt = Date.now();

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function creatorInitials(name){
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if(parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return (String(name || 'PR').substring(0, 2) || 'PR').toUpperCase();
  }

  function typeClass(type){
    if(type === 'aggregator') return 'is-aggregator';
    if(type === 'transfer') return 'is-transfer';
    return '';
  }

  function typeIcon(type){
    if(type === 'aggregator') return 'bi-diagram-3';
    if(type === 'transfer') return 'bi-arrow-left-right';
    return 'bi-lightning-charge';
  }

  function statusLabel(s){
    if(s === 'maintenance') return 'Maintenance';
    if(s === 'suspended') return 'Suspended';
    return 'Active';
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

  function updateSyncLabel(){
    if(!syncLabel) return;
    const mins = Math.max(0, Math.floor((Date.now() - syncedAt) / 60000));
    const text = mins < 1 ? 'Synced just now' : ('Synced ' + mins + ' min ago');
    syncLabel.innerHTML = '<i class="bi bi-arrow-repeat" aria-hidden="true"></i> ' + text;
  }

  function updateCounts(){
    const total = allRows.length;
    const active = allRows.filter(r => r.status === 'active').length;
    const maintenance = allRows.filter(r => r.status === 'maintenance').length;
    const suspended = allRows.filter(r => r.status === 'suspended').length;
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    set('mpvCountAll', total);
    set('mpvCountActive', active);
    set('mpvCountMaintenance', maintenance);
    set('mpvCountSuspended', suspended);
    if(activeBadge) activeBadge.textContent = active + ' Active';
  }

  function applyFilters(){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const type = typeFilter && typeFilter.value || '';
    const env = envFilter && envFilter.value || '';
    filtered = allRows.filter(row => {
      if(statusPill !== 'all' && row.status !== statusPill) return false;
      if(type && row.type !== type) return false;
      if(env && row.env !== env) return false;
      if(q){
        const hay = [row.name, row.id, row.typeLabel, row.desc].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
    currentPage = 1;
    render();
  }

  function render(){
    if(!tbody) return;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);
    if(pageNoEl) pageNoEl.innerHTML = pageButtons(currentPage, totalPages);
    if(infoEl){
      infoEl.textContent = total
        ? ('Showing ' + (start + 1) + ' to ' + (start + rows.length) + ' of ' + total + ' providers')
        : 'Showing 0 to 0 of 0 providers';
    }
    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="7" class="mad-empty">No providers found.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(row => {
      const markCls = row.mark ? (' is-' + row.mark) : '';
      const rate = row.providerRate != null && row.providerRate !== ''
        ? (String(row.providerRate).endsWith('%') ? row.providerRate : (row.providerRate + '%'))
        : '—';
      return '<tr>' +
        '<td><div class="mpv-name"><span class="mpv-mark' + markCls + '">' + esc(row.initials || creatorInitials(row.name)) + '</span>' +
          '<div class="mpv-name-copy"><b>' + esc(row.name) +
          (row.verified ? ' <i class="bi bi-patch-check-fill mpv-verified" title="Verified"></i>' : '') +
          '</b>' + (row.desc ? '<small>' + esc(row.desc) + '</small>' : '') + '</div></div></td>' +
        '<td>' + esc(row.currency || '—') + '</td>' +
        '<td>' + esc(rate) + '</td>' +
        '<td>' + esc(row.settlement || '—') + '</td>' +
        '<td><span class="mpv-status is-' + esc(row.status) + '"><i></i>' + esc(statusLabel(row.status)) + '</span></td>' +
        '<td>' + esc(row.outstanding || '—') + '</td>' +
        '<td><div class="mpv-actions">' +
          '<button class="mad-icon-btn" type="button" title="More"><i class="bi bi-three-dots"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  document.querySelectorAll('[data-mpv-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      statusPill = btn.getAttribute('data-mpv-status') || 'all';
      document.querySelectorAll('[data-mpv-status]').forEach(b => {
        b.classList.toggle('is-active', b === btn);
      });
      applyFilters();
    });
  });

  let searchTimer = null;
  searchInput && searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 180);
  });
  searchInput && searchInput.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); applyFilters(); }
  });
  typeFilter && typeFilter.addEventListener('change', applyFilters);
  envFilter && envFilter.addEventListener('change', applyFilters);
  resetBtn && resetBtn.addEventListener('click', () => {
    if(searchInput) searchInput.value = '';
    if(typeFilter) typeFilter.value = '';
    if(envFilter) envFilter.value = '';
    statusPill = 'all';
    document.querySelectorAll('[data-mpv-status]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-mpv-status') === 'all');
    });
    applyFilters();
  });

  pageNoEl && pageNoEl.addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if(!b || b.disabled) return;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const n = Number(b.dataset.page);
    if(n >= 1 && n <= totalPages && n !== currentPage){
      currentPage = n;
      render();
    }
  });

  // export only
  exportBtn && exportBtn.addEventListener('click', () => {
    const csv = [['Provider', 'Currency', 'Provider Rate', 'Settlement', 'Status', 'Outstanding']]
      .concat(filtered.map(r => {
        const rate = r.providerRate != null && r.providerRate !== ''
          ? (String(r.providerRate).endsWith('%') ? r.providerRate : (r.providerRate + '%'))
          : '';
        return [r.name, r.currency || '', rate, r.settlement || '', statusLabel(r.status), r.outstanding || ''];
      }));
    const blob = new Blob([csv.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'providers.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  });

  const CATEGORY_LABELS = {
    SLOT: 'Slot', LIVE: 'Live', SPORTS: 'Sports',
    FISH: 'Fishing', LOTTERY: 'Lottery', ESPORTS: 'E-Sports'
  };

  function markColor(code){
    const colors = ['teal', 'violet', 'amber', 'rose', 'slate'];
    let h = 0;
    const s = String(code || '');
    for(let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % colors.length;
    return colors[h];
  }

  function consumeCreatedProvider(){
    let raw;
    try{ raw = sessionStorage.getItem('mpv_last_created'); }catch(e){ return; }
    if(!raw) return;
    try{ sessionStorage.removeItem('mpv_last_created'); }catch(e){}
    let data;
    try{ data = JSON.parse(raw); }catch(e){ return; }
    const code = String(data.code || '').toUpperCase();
    const name = String(data.name || '').trim();
    if(!code || !name || allRows.some(r => String(r.id || '').toUpperCase() === code)) return;
    const category = String(data.category || '');
    const percent = Number(data.percent);
    const currency = String(data.currency || 'MYR');
    const remark = String(data.remark || '');
    const rateLabel = Number.isInteger(percent) ? String(percent) : String(percent).replace(/\.?0+$/, '');
    allRows.unshift({
      id: code,
      name,
      initials: creatorInitials(name),
      mark: markColor(code),
      desc: remark || (CATEGORY_LABELS[category] || category),
      currency,
      providerRate: rateLabel,
      settlement: 'Monthly',
      status: 'active',
      outstanding: currency + '0',
      category,
      remark
    });
    syncedAt = Date.now();
  }

  function measureLabelWidth(text, reference){
    const canvas = measureLabelWidth._c || (measureLabelWidth._c = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    if(!ctx) return String(text || '').length * 7;
    const cs = getComputedStyle(reference || document.body);
    ctx.font = [cs.fontStyle, cs.fontVariant, cs.fontWeight, cs.fontSize, cs.fontFamily].filter(Boolean).join(' ');
    return Math.ceil(ctx.measureText(String(text || '').trim()).width);
  }

  function sizeFilterSelect(select){
    if(!select || !select.options || !select.options.length) return;
    const wrap = select.closest('.rounded-select-wrap');
    const btn = wrap && wrap.querySelector('.rounded-select-btn');
    const ref = btn || select;
    const labels = Array.from(select.options).map(o => String(o.textContent || o.label || '').trim()).filter(Boolean);
    if(!labels.length) return;
    const widest = Math.max.apply(null, labels.map(label => measureLabelWidth(label, ref)));
    /* left pad 14 + right pad/chevron ~38 + breathing room 8 */
    const width = Math.max(120, widest + 60);
    if(wrap){
      wrap.style.setProperty('width', width + 'px', 'important');
      wrap.style.setProperty('min-width', width + 'px', 'important');
      wrap.style.setProperty('max-width', width + 'px', 'important');
      wrap.style.setProperty('flex', '0 0 ' + width + 'px', 'important');
      if(btn){
        btn.style.setProperty('width', width + 'px', 'important');
        btn.style.setProperty('min-width', width + 'px', 'important');
      }
      const menu = wrap.querySelector('.rounded-select-menu');
      if(menu){
        menu.style.setProperty('min-width', width + 'px', 'important');
        menu.style.setProperty('width', 'max-content', 'important');
      }
    }else{
      select.style.setProperty('width', width + 'px', 'important');
      select.style.setProperty('min-width', width + 'px', 'important');
    }
  }

  function sizeProviderFilterSelects(){
    sizeFilterSelect(typeFilter);
    sizeFilterSelect(envFilter);
  }

  if(window.BO_SEG_BOUNCE){
    window.BO_SEG_BOUNCE.mountAll();
  }

  async function api(path){
    const base=String((window.API_CONFIG&&window.API_CONFIG.BASE_URL)||'').replace(/\/$/,'');
    if(!base) throw Error('API base URL is not configured');
    const r=await fetch(base+path,{headers:{...BO_AUTH.authHeader(),'X-Brand-Id':'1'},cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error') throw Error(j.message||'Request failed');
    return j.data??j;
  }
  function listOf(d){ return Array.isArray(d)?d:(d.rows||d.items||d.content||d.list||d.providers||[]); }
  function providerKey(x){ return String(x.code??x.providerCode??x.id??x.providerId??'').toUpperCase(); }
  function settlementKey(x){ return String(x.counterpartyKey??x.providerCode??x.providerId??'').toUpperCase(); }
  function currencyOf(x){ return String(x.currency??x.defaultCurrency??x.settlementCurrency??'MYR').toUpperCase(); }
  function providerStatus(x){
    const raw=String(x.status??(x.enabled===false?0:x.enabled)??1).toLowerCase();
    if(raw==='maintenance'||raw==='2') return 'maintenance';
    if(raw==='suspended'||raw==='disabled'||raw==='0'||raw==='false') return 'suspended';
    return 'active';
  }
  async function loadProviders(){
    if(tbody) tbody.innerHTML='<tr><td colspan="7" class="mad-empty">Loading providers...</td></tr>';
    try{
      const providersData=await api('/admin/providers').catch(()=>api('/admin/main/providers')).catch(()=>api('/admin/game-provider/list'));
      const now=new Date(), month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
      const settlements=await api('/admin/main/settlements?month='+encodeURIComponent(month)).catch(()=>({rows:[]}));
      const sr=listOf(settlements).filter(x=>/provider/i.test(String(x.counterpartyType||x.entityType||'')));
      const byProvider=new Map();
      sr.forEach(x=>{ const k=settlementKey(x); if(!k)return; const a=byProvider.get(k)||[]; a.push(x); byProvider.set(k,a); });
      allRows=listOf(providersData).map(x=>{
        const key=providerKey(x), related=byProvider.get(key)||[];
        const cur=currencyOf(x);
        const outstanding=related.reduce((n,r)=>n+Number(r.balanceAmount||0),0);
        const due=related.reduce((n,r)=>n+Number(r.totalDue||0),0);
        const paid=related.reduce((n,r)=>n+Number(r.paidAmount||0),0);
        const rate=x.providerRate??x.rate??x.settlementRate??x.costPercent??x.defaultChargePercent??'';
        return {id:key||x.id,name:x.name||x.providerName||key||'Provider',initials:(key||x.name||'PR').slice(0,2),desc:x.description||x.category||x.providerType||'',currency:cur,providerRate:rate,settlement:related.length?(paid.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+' / '+due.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})):'—',status:providerStatus(x),outstanding:cur+' '+outstanding.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),type:String(x.type||x.providerType||'direct').toLowerCase(),typeLabel:x.type||x.providerType||'Direct',env:String(x.environment||x.env||'production').toLowerCase(),verified:true};
      });
      consumeCreatedProvider(); syncedAt=Date.now(); updateCounts(); applyFilters(); updateSyncLabel();
    }catch(e){ allRows=[]; filtered=[]; updateCounts(); if(tbody)tbody.innerHTML='<tr><td colspan="7" class="mad-empty text-danger">'+esc(e.message)+'</td></tr>'; if(infoEl)infoEl.textContent='Unable to load providers'; }
  }

  BO_AUTH.requireLogin();
  loadProviders();
  updateSyncLabel();
  sizeProviderFilterSelects();
  requestAnimationFrame(sizeProviderFilterSelects);
  setTimeout(sizeProviderFilterSelects, 0);
  setTimeout(sizeProviderFilterSelects, 50);
  setTimeout(sizeProviderFilterSelects, 200);

  const filtersRoot = document.querySelector('.mad-filters');
  if(filtersRoot && typeof MutationObserver !== 'undefined'){
    const mo = new MutationObserver(function(){ sizeProviderFilterSelects(); });
    mo.observe(filtersRoot, { childList: true, subtree: true });
  }

  setInterval(updateSyncLabel, 15000);
})();
