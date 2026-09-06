(function(){
  'use strict';

  const PAGE_SIZE = 7;
  const tbody = document.getElementById('mpvTableBody');
  const searchInput = document.getElementById('mpvSearchInput');
  const typeFilter = document.getElementById('mpvTypeFilter');
  const envFilter = document.getElementById('mpvEnvFilter');
  const resetBtn = document.getElementById('mpvResetBtn');
  const exportBtn = document.getElementById('mpvExportBtn');
  const addBtn = document.getElementById('mpvAddBtn');
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

  function pageButtons(page, totalPages){
    const max = Math.max(1, totalPages);
    let html = '<button type="button" class="mad-page-btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>Previous</button>';
    for(let i = 1; i <= max; i++){
      if(max > 7 && Math.abs(i - page) > 2 && i !== 1 && i !== max){
        if(i === 2 || i === max - 1) html += '<span class="mad-page-ellipsis">…</span>';
        continue;
      }
      html += '<button type="button" class="mad-page-btn' + (i === page ? ' is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="mad-page-btn" data-page="' + (page + 1) + '"' + (page >= max ? ' disabled' : '') + '>Next</button>';
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

  addBtn && addBtn.addEventListener('click', () => {
    if(window.BO_DIALOG && BO_DIALOG.alert){
      BO_DIALOG.alert('Add Provider form will connect to the provider API next. This screen is the executive list shell.', { title: 'Add Provider', type: 'info' });
    } else {
      alert('Add Provider — coming next.');
    }
  });

  if(window.BO_SEG_BOUNCE){
    window.BO_SEG_BOUNCE.mountAll();
  }

  allRows = [];
  updateCounts();
  applyFilters();
  updateSyncLabel();
  setInterval(updateSyncLabel, 15000);
})();
