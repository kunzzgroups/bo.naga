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
      tbody.innerHTML = '<tr><td colspan="8" class="mad-empty">No providers found.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(row => {
      const markCls = row.mark ? (' is-' + row.mark) : '';
      return '<tr>' +
        '<td><div class="mpv-name"><span class="mpv-mark' + markCls + '">' + esc(row.initials) + '</span>' +
          '<div class="mpv-name-copy"><b>' + esc(row.name) +
          (row.verified ? ' <i class="bi bi-patch-check-fill mpv-verified" title="Verified"></i>' : '') +
          '</b><small>' + esc(row.desc) + '</small></div></div></td>' +
        '<td><span class="mpv-id">' + esc(row.id) + '</span></td>' +
        '<td><span class="mpv-type ' + typeClass(row.type) + '"><i class="bi ' + typeIcon(row.type) + '" aria-hidden="true"></i>' + esc(row.typeLabel) + '</span></td>' +
        '<td><span class="mpv-status is-' + esc(row.status) + '"><i></i>' + esc(statusLabel(row.status)) + '</span></td>' +
        '<td><span class="mpv-env' + (row.env === 'sandbox' ? ' is-sandbox' : '') + '">' +
          (row.env === 'sandbox' ? 'Sandbox' : 'Production') + '</span></td>' +
        '<td><div class="mpv-sync-cell"><b>' + esc(row.syncRel) + '</b><small>' + esc(row.syncUtc) + '</small></div></td>' +
        '<td><div class="mpv-creator"><span class="mpv-creator-ava">' + esc(creatorInitials(row.creator)) + '</span>' +
          '<div><b>' + esc(row.creator) + '</b><small>' + esc(row.role) + '</small></div></div></td>' +
        '<td><div class="mpv-actions">' +
          '<button class="mad-icon-btn" type="button" title="View"><i class="bi bi-eye"></i></button>' +
          '<button class="mad-icon-btn" type="button" title="Edit"><i class="bi bi-pencil"></i></button>' +
          '<button class="mad-icon-btn" type="button" title="Settings"><i class="bi bi-sliders"></i></button>' +
          '<button class="mad-icon-btn is-danger" type="button" title="Disable"><i class="bi bi-slash-circle"></i></button>' +
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

  // export only — Add Provider is a link to create page
  exportBtn && exportBtn.addEventListener('click', () => {
    const csv = [['Provider Name', 'Provider ID', 'Integration Type', 'Status', 'Environment', 'Last Sync', 'Created By']]
      .concat(filtered.map(r => [r.name, r.id, r.typeLabel, statusLabel(r.status), r.env, r.syncRel + ' / ' + r.syncUtc, r.creator]));
    const blob = new Blob([csv.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'providers.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  });

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

  allRows = [];
  updateCounts();
  applyFilters();
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
