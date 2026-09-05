(function(){
  'use strict';

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

  const tbody = document.getElementById('madTableBody');
  const editModal = document.getElementById('madEditModal');
  const editForm = document.getElementById('madEditForm');
  const searchInput = document.getElementById('madSearchInput');
  const roleFilter = document.getElementById('madRoleFilter');
  const resetBtn = document.getElementById('madResetBtn');
  const exportBtn = document.getElementById('madExportBtn');
  const PAGE_SIZE = 10;
  const pageNoEl = document.getElementById('madPager');
  const infoEl = document.getElementById('madTableInfo');
  const syncLabel = document.getElementById('madSyncLabel');

  let editingId = null;
  let roleMap = {};
  let allAdmins = [];
  let filteredAdmins = [];
  let currentPage = 1;
  let statusPill = 'all';
  let lastSyncedAt = null;

  if(editModal){ editModal.classList.remove('show'); editModal.setAttribute('aria-hidden', 'true'); }
  document.body.classList.remove('modal-open');

  function setStatus(el, message, type){
    if(!el) return;
    el.textContent = message || '';
    el.className = 'upload-status mb-3 ' + (type || '');
  }

  function dt(value){
    if(!value) return '-';
    try{
      const d = new Date(value);
      if(isNaN(d.getTime())) return String(value).replace('T', ' ').replace(/\.\d+.*$/, '');
      const pad = n => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }catch(e){ return String(value || '-'); }
  }

  function relativeSync(from){
    if(!from) return 'Synced just now';
    const sec = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
    if(sec < 8) return 'Synced just now';
    if(sec < 60) return 'Synced ' + sec + 's ago';
    const min = Math.floor(sec / 60);
    if(min < 60) return 'Synced ' + min + 'm ago';
    return 'Synced ' + Math.floor(min / 60) + 'h ago';
  }

  function updateSyncLabel(){
    if(!syncLabel) return;
    syncLabel.innerHTML = '<i class="bi bi-arrow-repeat" aria-hidden="true"></i> ' + relativeSync(lastSyncedAt);
  }

  function relativeTime(value){
    if(!value) return '-';
    const d = new Date(value);
    if(isNaN(d.getTime())) return '-';
    const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if(sec < 45) return 'Just now';
    if(sec < 3600) return Math.floor(sec / 60) + ' mins ago';
    if(sec < 86400) return Math.floor(sec / 3600) + ' hrs ago';
    if(sec < 86400 * 7) return Math.floor(sec / 86400) + ' days ago';
    return dt(value);
  }

  function timeOnly(value){
    if(!value) return '-';
    try{
      const d = new Date(value);
      if(isNaN(d.getTime())) return '-';
      const pad = n => String(n).padStart(2, '0');
      return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }catch(e){ return '-'; }
  }

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function initials(row){
    const name = String(row.displayName || row.username || 'A').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if(parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return (name.substring(0, 2) || 'AD').toUpperCase();
  }

  function roleName(row){
    return roleMap[String(row.roleId)] || row.roleName || row.role || (Number(row.roleId) === 1 ? 'Super Admin' : 'Admin');
  }

  function companyName(row){
    return row.companyName || row.company || row.brandName || roleName(row) || '-';
  }

  function countryName(row){
    return row.countryName || row.country || row.countryCode || '-';
  }

  function roleTone(name){
    const n = String(name || '').toLowerCase();
    if(n.includes('regional')) return 'is-regional';
    if(n.includes('super') || n.includes('root') || n.includes('master')) return 'is-super';
    if(n.includes('partner')) return 'is-partner';
    if(n.includes('risk')) return 'is-risk';
    if(n.includes('tech')) return 'is-tech';
    if(n.includes('merchant') || n.includes('brand') || n.includes('sub')) return 'is-merchant';
    return '';
  }

  function isActive(row){
    return Number(row.status == null ? 1 : row.status) === 1;
  }

  function creditBalance(row){
    const v = row.creditBalance != null ? row.creditBalance : (row.credit != null ? row.credit : null);
    if(v == null || v === '') return '-';
    const n = Number(v);
    if(isNaN(n)) return esc(String(v));
    return n.toLocaleString('en-US');
  }

  function lastActive(row){
    return row.lastActiveAt || row.lastActive || row.lastLoginAt || row.lastLogin || row.loginAt || '';
  }

  function lastLogout(row){
    return row.lastLogoutAt || row.lastLogout || '';
  }

  function uidLabel(row){
    if(row.uid) return '#' + String(row.uid).replace(/^#/, '');
    return '#UID-' + (row.id != null ? row.id : '-');
  }

  function emailLabel(row){
    return row.email || '';
  }

  function isViewerRoot(viewer){
    viewer = viewer || BO_AUTH.user() || {};
    return viewer.rootAdmin === true || Number(viewer.rootAdmin) === 1 || String(viewer.roleType || '').toUpperCase() === 'ROOT' || (Number(viewer.id) === 1 && viewer.brandId == null);
  }

  async function apiJson(url, options){
    const res = await fetch(url, options || {});
    const json = await res.json().catch(() => ({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }

  async function loadRoles(brandId){
    try{
      const current = BO_AUTH.user() || {};
      const headers = { ...BO_AUTH.authHeader() };
      if(brandId) headers['X-Brand-Id'] = String(brandId);
      const json = await apiJson(BO_AUTH.roleListUrl(), { headers });
      let rows = Array.isArray(json.data) ? json.data : [];
      if(current.rootAdmin){
        rows = brandId
          ? rows.filter(r => Number(r.brandId) === Number(brandId) && !['MASTER', 'ROOT'].includes(String(r.roleType || '').toUpperCase()))
          : rows.filter(r => r.brandId == null && String(r.roleType || '').toUpperCase() === 'MASTER');
      }else{
        rows = rows.filter(r => !['MASTER', 'ROOT'].includes(String(r.roleType || 'CUSTOM').toUpperCase()));
      }
      roleMap = Object.assign(roleMap, Object.fromEntries(rows.map(r => [String(r.id), r.name || r.code])));
      const html = rows.map(r => '<option value="' + esc(r.id) + '">' + esc(r.name || r.code) + (r.roleType === 'BRAND_OWNER' ? ' (Owner)' : '') + '</option>').join('')
        || '<option value="">No role available for this selection</option>';
      ['madEditRole'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = html; });
      if(roleFilter) roleFilter.innerHTML = '<option value="">All Companies</option>' + html;
      return rows;
    }catch(e){
      ['madEditRole'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = '<option value="">Unable to load roles</option>'; });
      return [];
    }
  }

  function updatePillCounts(){
    const total = allAdmins.length;
    const active = allAdmins.filter(isActive).length;
    const suspended = total - active;
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    set('madCountAll', total);
    set('madCountActive', active);
    set('madCountSuspended', suspended);
  }

  function applyFilters(){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const role = roleFilter && roleFilter.value || '';
    filteredAdmins = allAdmins.filter(row => {
      const hay = [row.username, row.displayName, row.email, uidLabel(row), roleName(row)].join(' ').toLowerCase();
      if(q && !hay.includes(q)) return false;
      if(role && String(row.roleId || '') !== String(role)) return false;
      const active = isActive(row);
      if(statusPill === 'active' && !active) return false;
      if(statusPill === 'suspended' && active) return false;
      return true;
    });
    currentPage = 1;
    renderAdmins();
  }

  function renderAdmins(){
    if(!tbody) return;
    const pageSize = PAGE_SIZE;
    const total = filteredAdmins.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * pageSize;
    const rows = filteredAdmins.slice(start, start + pageSize);
    if(pageNoEl) pageNoEl.innerHTML = pageButtons(currentPage, totalPages);
    if(infoEl){
      infoEl.textContent = total
        ? ('Showing ' + (start + 1) + ' to ' + (start + rows.length) + ' of ' + total + ' merchants')
        : 'Showing 0 to 0 of 0 merchants';
    }
    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="10" class="mad-empty">No merchants found.</td></tr>';
      return;
    }
    const currentId = Number((BO_AUTH.user() || {}).id);
    const viewerRoot = isViewerRoot();
    tbody.innerHTML = rows.map(row => {
      const active = isActive(row);
      const current = Number(row.id) === currentId;
      const protectedRoot = Number(row.id) === 1 && !viewerRoot;
      const company = companyName(row);
      const country = countryName(row);
      const credit = creditBalance(row);
      const logout = lastLogout(row);
      const email = emailLabel(row);
      const rowAttr = JSON.stringify(row).replace(/'/g, '&#39;');
      return '<tr>' +
        '<td><div class="mad-user"><span class="mad-avatar">' + esc(initials(row)) + '</span><div class="mad-user-copy"><b>' + esc(row.displayName || row.username || '-') + (current ? ' · You' : '') + '</b><div class="mad-user-meta"><span class="mad-uid">' + esc(uidLabel(row)) + '</span>' + (email ? '<span class="mad-email">' + esc(email) + '</span>' : '') + '</div></div></div></td>' +
        '<td><span class="mad-role ' + roleTone(company) + '">' + esc(company) + '</span></td>' +
        '<td>' + esc(country) + '</td>' +
        '<td class="mad-money">' + (credit === '-' ? '<span class="mad-muted">-</span>' : credit) + '</td>' +
        '<td>' + esc(relativeTime(lastActive(row))) + '</td>' +
        '<td><span class="mad-status ' + (active ? 'is-active' : 'is-suspended') + '"><i></i>' + (active ? 'Active' : 'Suspended') + '</span></td>' +
        '<td>' + esc(row.createdByName || row.createdByUsername || row.createdBy || row.creator || '-') + '</td>' +
        '<td class="mad-time">' + esc(timeOnly(row.lastLoginAt || row.lastLogin || row.loginAt)) + '</td>' +
        '<td class="mad-time">' + (logout ? esc(timeOnly(logout)) : '<span class="mad-muted">-</span>') + '</td>' +
        '<td><div class="mad-actions">' + (protectedRoot
          ? '<span class="mad-status is-active" title="Root account cannot be modified by non-root merchants">Protected</span>'
          : '<button class="mad-icon-btn mad-edit-btn" type="button" title="Edit" data-id="' + esc(row.id) + '" data-row=\'' + rowAttr + '\'><i class="bi bi-pencil"></i></button>' +
            '<button class="mad-icon-btn mad-key-btn" type="button" title="Reset password" data-id="' + esc(row.id) + '" data-row=\'' + rowAttr + '\'><i class="bi bi-key"></i></button>' +
            '<button class="mad-icon-btn is-danger mad-toggle-btn" type="button" title="' + (active ? 'Suspend' : 'Activate') + '" data-id="' + esc(row.id) + '" data-status="' + (active ? 0 : 1) + '"><i class="bi bi-' + (active ? 'slash-circle' : 'check-circle') + '"></i></button>') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  async function loadBrandOptions(){
    const editSel = document.getElementById('madEditBrand');
    const user = BO_AUTH.user() || {};
    if(!user.masterAdmin){
      const bid = user.brandId || '';
      const label = 'Current Branding' + (bid ? ' (#' + bid + ')' : '');
      const html = '<option value="' + esc(bid) + '">' + esc(label) + '</option>';
      if(editSel){ editSel.innerHTML = html; editSel.disabled = true; }
      await loadRoles(bid);
      return;
    }
    try{
      const r = await fetch(API_CONFIG.BASE_URL + (API_CONFIG.ENDPOINTS.BRAND_LIST || '/admin/brands'), { headers: { ...BO_AUTH.authHeader() } });
      const j = await r.json();
      const rows = Array.isArray(j.data) ? j.data : [];
      const html = (user.rootAdmin ? '<option value="">Master / Platform</option>' : '<option value="">Select Branding</option>') +
        rows.map(x => '<option value="' + x.id + '">' + esc(x.name || x.code) + ' (#' + x.id + ')</option>').join('');
      if(editSel) editSel.innerHTML = html;
      const active = (window.BO_BRAND && BO_BRAND.activeId ? BO_BRAND.activeId() : 1);
      await loadRoles(user.rootAdmin ? null : active);
    }catch(e){
      await loadRoles(null);
    }
  }

  async function loadAdmins(){
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" class="mad-empty">Loading merchants...</td></tr>';
    try{
      const json = await apiJson(BO_AUTH.adminListUrl(), { headers: { ...BO_AUTH.authHeader() } });
      allAdmins = Array.isArray(json.data) ? json.data : [];
      lastSyncedAt = new Date();
      updateSyncLabel();
      updatePillCounts();
      applyFilters();
    }catch(err){
      allAdmins = [];
      filteredAdmins = [];
      currentPage = 1;
      if(pageNoEl) pageNoEl.innerHTML = pageButtons(1, 1);
      if(infoEl) infoEl.textContent = 'Showing 0 to 0 of 0 merchants';
      tbody.innerHTML = '<tr><td colspan="10" class="mad-empty text-danger">' + esc(err.message || 'Load merchant failed') + '</td></tr>';
    }
  }

  function closeEditAdmin(){
    if(editModal){ editModal.classList.remove('show'); editModal.setAttribute('aria-hidden', 'true'); }
    if(!document.querySelector('.modal-clean.show')) document.body.classList.remove('modal-open');
  }

  async function openEdit(btn){
    let row = {};
    try{ row = JSON.parse(btn.getAttribute('data-row') || '{}'); }catch(err){}
    editingId = row.id;
    document.getElementById('madEditUsername').value = row.username || '';
    document.getElementById('madEditDisplayName').value = row.displayName || '';
    document.getElementById('madEditStatus').value = String(row.status == null ? 1 : row.status);
    if(document.getElementById('madEditBrand')) document.getElementById('madEditBrand').value = row.brandId == null ? '' : String(row.brandId);
    if(row.brandId) await loadRoles(Number(row.brandId));
    else if((BO_AUTH.user() || {}).rootAdmin) await loadRoles(null);
    document.getElementById('madEditRole').value = String(row.roleId || '');
    document.getElementById('madEditPassword').value = '';
    setStatus(document.getElementById('madEditFormStatus'), '', '');
    if(editModal){ editModal.classList.add('show'); editModal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); }
  }

  editForm && editForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!editingId) return;
    const statusEl = document.getElementById('madEditFormStatus');
    setStatus(statusEl, 'Saving admin...', '');
    try{
      const json = await apiJson(BO_AUTH.adminUpdateUrl(editingId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...BO_AUTH.authHeader() },
        body: JSON.stringify({
          username: document.getElementById('madEditUsername').value.trim(),
          displayName: document.getElementById('madEditDisplayName').value.trim(),
          status: Number(document.getElementById('madEditStatus').value || 1),
          roleId: document.getElementById('madEditRole').value ? Number(document.getElementById('madEditRole').value) : null,
          brandId: document.getElementById('madEditBrand') && document.getElementById('madEditBrand').value ? Number(document.getElementById('madEditBrand').value) : null,
          password: document.getElementById('madEditPassword').value
        })
      });
      setStatus(statusEl, json.message || 'Admin updated successfully', 'success');
      if(Number(editingId) === Number((BO_AUTH.user() || {}).id) && json.data) BO_AUTH.saveUser(json.data);
      await loadAdmins();
    }catch(err){ setStatus(statusEl, err.message || 'Update admin failed', 'error'); }
  });

  document.querySelectorAll('[data-mad-close-edit]').forEach(btn => btn.addEventListener('click', closeEditAdmin));
  editModal && editModal.addEventListener('click', e => { if(e.target === editModal) closeEditAdmin(); });

  document.querySelectorAll('[data-mad-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      statusPill = btn.getAttribute('data-mad-status') || 'all';
      document.querySelectorAll('[data-mad-status]').forEach(b => {
        b.classList.toggle('is-active', b === btn);
      });
      applyFilters();
    });
  });

  document.addEventListener('click', function(e){
    const edit = e.target.closest && e.target.closest('.mad-edit-btn, .mad-key-btn');
    if(edit){
      if(Number(edit.dataset.id) === 1 && !isViewerRoot()){ BO_DIALOG.alert('Root admin account is protected.'); return; }
      openEdit(edit).then(function(){
        if(edit.classList.contains('mad-key-btn')){
          const pass = document.getElementById('madEditPassword');
          if(pass){ pass.focus(); pass.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        }
      });
      return;
    }
    const del = e.target.closest && e.target.closest('.mad-delete-btn');
    if(del){
      const id = Number(del.dataset.id || 0);
      const currentId = Number((BO_AUTH.user() || {}).id || 0);
      if(!id){ BO_DIALOG.alert('Missing admin ID'); return; }
      if(id === 1 && !isViewerRoot()){ BO_DIALOG.alert('Root admin account is protected.'); return; }
      if(id === currentId){ BO_DIALOG.alert('You cannot delete the admin account currently logged in.'); return; }
      (async()=>{
        if(!(await BO_DIALOG.confirm('Delete this merchant account?', { title: 'Delete Merchant', confirmText: 'Delete' }))) return;
        try{
          const json = await apiJson(BO_AUTH.adminDeleteUrl(id), { method: 'POST', headers: { ...BO_AUTH.authHeader() } });
          await BO_DIALOG.alert(json.message || 'Admin deleted successfully');
          await loadAdmins();
        }catch(err){ await BO_DIALOG.alert(err.message || 'Delete admin failed'); }
      })();
      return;
    }
    const toggle = e.target.closest && e.target.closest('.mad-toggle-btn');
    if(toggle){
      const id = Number(toggle.dataset.id || 0);
      const nextStatus = Number(toggle.dataset.status);
      if(!id) return;
      if(id === 1 && !isViewerRoot()){ BO_DIALOG.alert('Root admin account is protected.'); return; }
      const row = allAdmins.find(r => Number(r.id) === id);
      if(!row) return;
      (async()=>{
        try{
          await apiJson(BO_AUTH.adminUpdateUrl(id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...BO_AUTH.authHeader() },
            body: JSON.stringify({
              username: row.username,
              displayName: row.displayName || row.username,
              status: nextStatus,
              roleId: row.roleId != null ? Number(row.roleId) : null,
              brandId: row.brandId != null ? Number(row.brandId) : null,
              password: ''
            })
          });
          await loadAdmins();
        }catch(err){ await BO_DIALOG.alert(err.message || 'Update status failed'); }
      })();
      return;
    }
    const eye = e.target.closest && e.target.closest('[data-toggle-password]');
    if(eye){
      const id = eye.getAttribute('data-toggle-password');
      const input = document.getElementById(id);
      if(input) input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

  let searchTimer = null;
  searchInput && searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 220);
  });
  searchInput && searchInput.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); applyFilters(); } });
  roleFilter && roleFilter.addEventListener('change', applyFilters);
  resetBtn && resetBtn.addEventListener('click', () => {
    if(searchInput) searchInput.value = '';
    if(roleFilter) roleFilter.value = '';
    statusPill = 'all';
    document.querySelectorAll('[data-mad-status]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-mad-status') === 'all');
    });
    applyFilters();
  });
  pageNoEl && pageNoEl.addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if(!b || b.disabled) return;
    const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / PAGE_SIZE));
    const n = Number(b.dataset.page);
    if(n >= 1 && n <= totalPages && n !== currentPage){ currentPage = n; renderAdmins(); }
  });

  exportBtn && exportBtn.addEventListener('click', () => {
    const csv = [['Merchant', 'Display Name', 'Company', 'Country', 'Credit Balance', 'Status', 'Created By', 'Last Login', 'Last Logout', 'Created']]
      .concat(filteredAdmins.map(r => [
        r.username || '',
        r.displayName || '',
        companyName(r),
        countryName(r),
        r.creditBalance != null ? r.creditBalance : (r.credit != null ? r.credit : ''),
        isActive(r) ? 'Active' : 'Suspended',
        r.createdByName || r.createdByUsername || r.createdBy || r.creator || '',
        dt(r.lastLoginAt || r.lastLogin),
        dt(lastLogout(r)),
        dt(r.createdAt || r.created_at)
      ]));
    const blob = new Blob([csv.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merchant-accounts.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  });

  const editBrandEl = document.getElementById('madEditBrand');
  editBrandEl && editBrandEl.addEventListener('change', () => { loadRoles(editBrandEl.value ? Number(editBrandEl.value) : null); });

  setInterval(updateSyncLabel, 15000);

  if(pageNoEl) pageNoEl.innerHTML = pageButtons(1, 1);

  (async function(){
    await loadBrandOptions();
    await loadAdmins();
  })();
})();
