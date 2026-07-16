(function(){
  function pageButtons(current,total){
    total=Math.max(1,Number(total)||1); current=Math.max(1,Math.min(Number(current)||1,total));
    const pages=[]; const add=n=>{if(n>=1&&n<=total&&!pages.includes(n))pages.push(n);};
    add(1); for(let n=current-2;n<=current+2;n++) add(n); add(total); pages.sort((a,b)=>a-b);
    let html='<div class="smart-pagination" role="navigation" aria-label="Table pagination">';
    html+='<button type="button" class="smart-page first" data-page="1" '+(current<=1?'disabled':'')+' title="First page"><i class="bi bi-chevron-bar-left"></i></button>';
    let prev=0; pages.forEach(n=>{if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis">…</span>'; html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>'; prev=n;});
    html+='<button type="button" class="smart-page last" data-page="'+total+'" '+(current>=total?'disabled':'')+' title="Last page"><i class="bi bi-chevron-bar-right"></i></button>';
    html+='</div><span class="smart-page-summary">Page '+current+' / '+total+'</span>'; return html;
  }

  const createForm = document.getElementById('createAdminForm');
  const createStatus = document.getElementById('createAdminStatus');
  const createBtn = document.getElementById('createAdminBtn');
  const tbody = document.getElementById('adminTableBody');
  const mobileCards = document.getElementById('adminMobileCards');
  const editModal = document.getElementById('adminEditModal');
  const editForm = document.getElementById('editAdminForm');
  const searchInput = document.getElementById('adminSearchInput');
  const roleFilter = document.getElementById('adminRoleFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const searchBtn = document.getElementById('searchAdminBtn');
  const resetBtn = document.getElementById('resetAdminSearchBtn');
  const cancelBtn = document.getElementById('cancelCreateAdminBtn');
  const exportBtn = document.getElementById('exportAdminBtn');
  const pageSizeEl = document.getElementById('adminPageSize');
  const prevBtn = document.getElementById('adminPrevPage');
  const nextBtn = document.getElementById('adminNextPage');
  const pageNoEl = document.getElementById('adminPageNo');
  const infoEl = document.getElementById('adminTableInfo');
  const countBadge = document.getElementById('adminCountBadge');
  const selectAll = document.getElementById('adminSelectAll');
  let editingId = null;
  let roleMap = {};
  let allAdmins = [];
  let filteredAdmins = [];
  let currentPage = 1;

  function setStatus(el, message, type){
    if(!el) return;
    el.textContent = message || '';
    el.className = 'upload-status mb-3 ' + (type || '');
  }

  function dt(value){
    if(!value) return '-';
    try{
      const d = new Date(value);
      if(isNaN(d.getTime())) return String(value).replace('T',' ').replace(/\.\d+.*$/,'');
      const pad = n => String(n).padStart(2,'0');
      return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
    }catch(e){ return String(value || '-'); }
  }

  function shortDt(value){
    const s = dt(value);
    return s === '-' ? '-' : s.replace(' ', '<br>');
  }

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function initials(row){
    const name = String(row.displayName || row.username || 'A').trim();
    return (name.substring(0,2) || 'AD').toUpperCase();
  }

  function roleName(row){
    return roleMap[String(row.roleId)] || row.roleName || row.role || (Number(row.roleId) === 1 ? 'Super Admin' : 'Admin');
  }

  async function apiJson(url, options){
    const res = await fetch(url, options || {});
    const json = await res.json().catch(() => ({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }

  async function loadRoles(){
    try{
      const json = await apiJson(BO_AUTH.roleListUrl(), {headers:{...BO_AUTH.authHeader()}});
      const rows = Array.isArray(json.data) ? json.data : [];
      roleMap = {};
      rows.forEach(r => roleMap[String(r.id)] = r.name || r.code);
      const html = rows.map(r => '<option value="'+esc(r.id)+'">'+esc(r.name || r.code)+'</option>').join('') || '<option value="1">Super Admin</option>';
      ['newAdminRole','editAdminRole'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML = html; });
      if(roleFilter){ roleFilter.innerHTML = '<option value="">All Roles</option>' + html; }
      const pg = document.getElementById('newAdminPermissionGroup');
      if(pg){ pg.innerHTML = '<option value="">Select permission group (optional)</option>' + html; }
    }catch(e){
      ['newAdminRole','editAdminRole'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML = '<option value="1">Super Admin</option><option value="2">Admin</option>'; });
    }
  }

  function updateStats(rows){
    const total = rows.length;
    const active = rows.filter(r => Number(r.status) === 1).length;
    const disabled = total - active;
    const today = new Date().toISOString().slice(0,10);
    const loginToday = rows.filter(r => String(r.lastLoginAt || r.lastLogin || '').slice(0,10) === today).length;
    const set = (id,val) => { const el=document.getElementById(id); if(el) el.textContent = val; };
    set('adminStatTotal', total);
    set('adminStatActive', active);
    set('adminStatDisabled', disabled);
    set('adminStatLoginToday', loginToday);
  }

  function applyFilters(){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const role = roleFilter && roleFilter.value || '';
    const status = statusFilter && statusFilter.value || '';
    filteredAdmins = allAdmins.filter(row => {
      const hay = [row.username, row.displayName, roleName(row)].join(' ').toLowerCase();
      if(q && !hay.includes(q)) return false;
      if(role && String(row.roleId || '') !== String(role)) return false;
      if(status !== '' && String(row.status == null ? 1 : row.status) !== String(status)) return false;
      return true;
    });
    currentPage = 1;
    renderAdmins();
  }

  function renderAdmins(){
    if(!tbody) return;
    const pageSize = Number(pageSizeEl && pageSizeEl.value || 10);
    const total = filteredAdmins.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * pageSize;
    const rows = filteredAdmins.slice(start, start + pageSize);
    if(countBadge) countBadge.textContent = total + ' Account' + (total === 1 ? '' : 's');
    if(pageNoEl) pageNoEl.innerHTML = pageButtons(currentPage, totalPages);
    if(infoEl) infoEl.textContent = total ? ('Showing '+(start+1)+' to '+(start+rows.length)+' of '+total+' entries') : 'Showing 0 to 0 of 0 entries';
    if(prevBtn) prevBtn.disabled = currentPage <= 1;
    if(nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No admin found.</td></tr>';
      if(mobileCards) mobileCards.innerHTML = '';
      return;
    }
    const currentId = Number((BO_AUTH.user() || {}).id);
    tbody.innerHTML = rows.map(row => {
      const active = Number(row.status) === 1;
      const current = Number(row.id) === currentId;
      return '<tr>'+
        '<td class="admin-check-col"><input type="checkbox" class="admin-row-check" value="'+esc(row.id)+'"></td>'+
        '<td><div class="admin-cell-user"><span class="admin-avatar">'+esc(initials(row))+'</span><div><b>'+esc(row.username)+'</b> '+(current?'<span class="current-login-pill">Current Login</span>':'')+'<br><small>'+esc(row.username)+'</small></div></div></td>'+
        '<td>'+esc(row.displayName || row.username || '-')+'</td>'+
        '<td><span class="role-pill '+(roleName(row).toLowerCase().includes('super')?'super':'')+'">'+esc(roleName(row))+'</span></td>'+
        '<td><span class="admin-status-pill '+(active?'active':'disabled')+'"><i></i>'+(active?'Active':'Disabled')+'</span></td>'+
        '<td>'+shortDt(row.lastLoginAt || row.lastLogin || row.loginAt)+'</td>'+
        '<td>'+shortDt(row.createdAt || row.created_at)+'</td>'+
        '<td><div class="user-row-actions admin-actions"><button class="icon-action admin-edit-btn" title="Edit" data-id="'+esc(row.id)+'" data-row=\''+JSON.stringify(row).replace(/'/g,'&#39;')+'\'><i class="bi bi-pencil"></i></button><button class="icon-action danger admin-delete-btn" title="Delete" type="button"><i class="bi bi-trash"></i></button></div></td>'+
      '</tr>';
    }).join('');
    if(mobileCards){
      mobileCards.innerHTML = rows.map(row => '<div class="member-card admin-mobile-card"><div class="member-card-head"><h3>'+esc(row.username)+'</h3><span class="admin-status-pill '+(Number(row.status)===1?'active':'disabled')+'"><i></i>'+(Number(row.status)===1?'Active':'Disabled')+'</span></div><div class="member-grid"><span>Display Name</span><b>'+esc(row.displayName || '-')+'</b><span>Role</span><b>'+esc(roleName(row))+'</b><span>Created</span><b>'+esc(dt(row.createdAt || row.created_at))+'</b></div><button class="clean-btn primary admin-edit-btn" data-id="'+esc(row.id)+'" data-row=\''+JSON.stringify(row).replace(/'/g,'&#39;')+'\'>Edit</button></div>').join('');
    }
  }

  async function loadAdmins(){
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8">Loading admin accounts...</td></tr>';
    try{
      const json = await apiJson(BO_AUTH.adminListUrl(), {headers: {...BO_AUTH.authHeader()}});
      allAdmins = Array.isArray(json.data) ? json.data : [];
      updateStats(allAdmins);
      filteredAdmins = allAdmins.slice();
      renderAdmins();
    }catch(err){
      tbody.innerHTML = '<tr><td colspan="8" class="text-danger">'+esc(err.message || 'Load admin failed')+'</td></tr>';
    }
  }

  createForm && createForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const pass = document.getElementById('newAdminPassword').value;
    const confirm = document.getElementById('newAdminConfirmPassword').value;
    if(pass !== confirm){ setStatus(createStatus, 'Confirm password does not match.', 'error'); return; }
    createBtn.disabled = true;
    setStatus(createStatus, 'Creating admin...', '');
    try{
      const json = await apiJson(BO_AUTH.createAdminUrl(), {
        method: 'POST', headers: {'Content-Type':'application/json', ...BO_AUTH.authHeader()},
        body: JSON.stringify({
          username: document.getElementById('newAdminUsername').value.trim(),
          displayName: document.getElementById('newAdminDisplayName').value.trim(),
          password: pass,
          status: Number(document.getElementById('newAdminStatus').value || 1),
          roleId: Number(document.getElementById('newAdminRole').value || 1),
          remark: (document.getElementById('newAdminRemark') || {}).value || ''
        })
      });
      setStatus(createStatus, json.message || 'Admin created successfully', 'success');
      createForm.reset();
      const rc = document.getElementById('adminRemarkCount'); if(rc) rc.textContent = '0';
      await loadAdmins();
      closeCreateAdmin();
    }catch(err){ setStatus(createStatus, err.message || 'Create admin failed', 'error'); }
    finally{ createBtn.disabled = false; }
  });


  const createModal = document.getElementById('adminCreateModal');
  const openCreateBtn = document.getElementById('openCreateAdminBtn');
  function openCreateAdmin(){ createForm && createForm.reset(); setStatus(createStatus,'',''); const rc=document.getElementById('adminRemarkCount'); if(rc) rc.textContent='0'; createModal && createModal.classList.add('show'); }
  function closeCreateAdmin(){ createModal && createModal.classList.remove('show'); }
  openCreateBtn && openCreateBtn.addEventListener('click', openCreateAdmin);
  document.querySelectorAll('[data-close-create-admin]').forEach(btn => btn.addEventListener('click', closeCreateAdmin));
  createModal && createModal.addEventListener('click', e => { if(e.target === createModal) closeCreateAdmin(); });

  function openEdit(btn){
    let row = {};
    try{ row = JSON.parse(btn.getAttribute('data-row') || '{}'); }catch(err){}
    editingId = row.id;
    document.getElementById('editAdminUsername').value = row.username || '';
    document.getElementById('editAdminDisplayName').value = row.displayName || '';
    document.getElementById('editAdminStatus').value = String(row.status == null ? 1 : row.status);
    document.getElementById('editAdminRole').value = String(row.roleId || 1);
    document.getElementById('editAdminPassword').value = '';
    setStatus(document.getElementById('editAdminStatusMsg'), '', '');
    editModal && editModal.classList.add('show');
  }

  document.addEventListener('click', function(e){
    const edit = e.target.closest && e.target.closest('.admin-edit-btn');
    if(edit){ openEdit(edit); return; }
    const del = e.target.closest && e.target.closest('.admin-delete-btn');
    if(del){ alert('Delete API is not available for this page yet.'); return; }
    const toggle = e.target.closest && e.target.closest('[data-toggle-password]');
    if(toggle){ const id = toggle.getAttribute('data-toggle-password'); const input = document.getElementById(id); if(input){ input.type = input.type === 'password' ? 'text' : 'password'; } }
  });

  editForm && editForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!editingId) return;
    const statusEl = document.getElementById('editAdminStatusMsg');
    setStatus(statusEl, 'Saving admin...', '');
    try{
      const json = await apiJson(BO_AUTH.adminUpdateUrl(editingId), {
        method: 'POST', headers: {'Content-Type':'application/json', ...BO_AUTH.authHeader()},
        body: JSON.stringify({
          username: document.getElementById('editAdminUsername').value.trim(),
          displayName: document.getElementById('editAdminDisplayName').value.trim(),
          status: Number(document.getElementById('editAdminStatus').value || 1),
          roleId: Number(document.getElementById('editAdminRole').value || 1),
          password: document.getElementById('editAdminPassword').value
        })
      });
      setStatus(statusEl, json.message || 'Admin updated successfully', 'success');
      if(Number(editingId) === Number((BO_AUTH.user() || {}).id) && json.data){ BO_AUTH.saveUser(json.data); }
      await loadAdmins();
    }catch(err){ setStatus(statusEl, err.message || 'Update admin failed', 'error'); }
  });

  searchBtn && searchBtn.addEventListener('click', applyFilters);
  searchInput && searchInput.addEventListener('keydown', e => { if(e.key === 'Enter') applyFilters(); });
  resetBtn && resetBtn.addEventListener('click', () => { if(searchInput) searchInput.value=''; if(roleFilter) roleFilter.value=''; if(statusFilter) statusFilter.value=''; applyFilters(); });
  cancelBtn && cancelBtn.addEventListener('click', closeCreateAdmin);
  pageSizeEl && pageSizeEl.addEventListener('change', () => { currentPage = 1; renderAdmins(); });
  prevBtn && prevBtn.addEventListener('click', () => { currentPage--; renderAdmins(); });
  nextBtn && nextBtn.addEventListener('click', () => { currentPage++; renderAdmins(); });
  pageNoEl && pageNoEl.addEventListener('click', e => { const b=e.target.closest('[data-page]'); if(!b)return; const pageSize=Number(pageSizeEl&&pageSizeEl.value||10); const totalPages=Math.max(1,Math.ceil(filteredAdmins.length/pageSize)); const n=Number(b.dataset.page); if(n>=1&&n<=totalPages&&n!==currentPage){currentPage=n;renderAdmins();} });
  selectAll && selectAll.addEventListener('change', () => document.querySelectorAll('.admin-row-check').forEach(cb => cb.checked = selectAll.checked));
  const remark = document.getElementById('newAdminRemark');
  remark && remark.addEventListener('input', () => { const rc=document.getElementById('adminRemarkCount'); if(rc) rc.textContent = remark.value.length; });
  exportBtn && exportBtn.addEventListener('click', () => {
    const csv = [['Username','Display Name','Role','Status','Last Login','Created']].concat(filteredAdmins.map(r => [r.username||'', r.displayName||'', roleName(r), Number(r.status)===1?'Active':'Disabled', dt(r.lastLoginAt||r.lastLogin), dt(r.createdAt||r.created_at)]));
    const blob = new Blob([csv.map(row => row.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'admin-accounts.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  });

  (async function(){ await loadRoles(); await loadAdmins(); })();
})();
