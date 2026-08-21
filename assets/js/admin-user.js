(function(){
  function pageButtons(current,total){
    total=Math.max(1,Number(total)||1); current=Math.max(1,Math.min(Number(current)||1,total));
    const pages=[]; const add=n=>{if(n>=1&&n<=total&&!pages.includes(n))pages.push(n);};
    add(1); for(let n=current-2;n<=current+2;n++) add(n); add(total); pages.sort((a,b)=>a-b);
    let html='';
    html+='<button type="button" class="smart-page first" data-page="1" '+(current<=1?'disabled':'')+' title="First page"><i class="bi bi-chevron-bar-left"></i></button>';
    let prev=0; pages.forEach(n=>{if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis">…</span>'; html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>'; prev=n;});
    html+='<button type="button" class="smart-page last" data-page="'+total+'" '+(current>=total?'disabled':'')+' title="Last page"><i class="bi bi-chevron-bar-right"></i></button>';
    return html;
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
  const pageNoEl = document.getElementById('adminPager');
  const infoEl = document.getElementById('adminTableInfo');
  const countBadge = document.getElementById('adminCountBadge');
  const selectAll = document.getElementById('adminSelectAll');
  let editingId = null;
  let roleMap = {};
  let allAdmins = [];
  let filteredAdmins = [];
  let currentPage = 1;

  // Defensive initial state: neither Create nor Edit modal may open by itself.
  [document.getElementById('adminCreateModal'), editModal].forEach(function(modal){
    if(modal){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
  });
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

  async function loadRoles(brandId){
    try{
      const headers={...BO_AUTH.authHeader()};
      if(brandId) headers['X-Brand-Id']=String(brandId);
      const json = await apiJson(BO_AUTH.roleListUrl(), {headers});
      const rows = (Array.isArray(json.data) ? json.data : []).filter(r=>String(r.roleType||'CUSTOM').toUpperCase()!=='MASTER');
      roleMap = Object.assign(roleMap, Object.fromEntries(rows.map(r=>[String(r.id),r.name||r.code])));
      const html = rows.map(r => '<option value="'+esc(r.id)+'">'+esc(r.name || r.code)+(r.roleType==='BRAND_OWNER'?' (Owner)':'')+'</option>').join('') || '<option value="">No role available for this branding</option>';
      ['newAdminRole','editAdminRole'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML = html; });
      if(roleFilter){ roleFilter.innerHTML = '<option value="">All Roles</option>' + html; }
      const pg = document.getElementById('newAdminPermissionGroup'); if(pg) pg.innerHTML = '<option value="">Select permission group (optional)</option>' + html;
      return rows;
    }catch(e){
      ['newAdminRole','editAdminRole'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML = '<option value="">Unable to load branding roles</option>'; });
      return [];
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
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No admin found.</td></tr>';
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
        '<td><b>'+esc(row.createdByName || row.createdByUsername || row.createdBy || row.creator || '-')+'</b></td>'+
        '<td><div class="user-row-actions admin-actions"><button class="icon-action admin-edit-btn" title="Edit" data-id="'+esc(row.id)+'" data-row=\''+JSON.stringify(row).replace(/'/g,'&#39;')+'\'><i class="bi bi-pencil"></i></button><button class="icon-action danger admin-delete-btn" title="Delete" type="button" data-id="'+esc(row.id)+'"><i class="bi bi-trash"></i></button></div></td>'+
      '</tr>';
    }).join('');
    if(mobileCards){
      mobileCards.innerHTML = rows.map(row => '<div class="member-card admin-mobile-card"><div class="member-card-head"><h3>'+esc(row.username)+'</h3><span class="admin-status-pill '+(Number(row.status)===1?'active':'disabled')+'"><i></i>'+(Number(row.status)===1?'Active':'Disabled')+'</span></div><div class="member-grid"><span>Display Name</span><b>'+esc(row.displayName || '-')+'</b><span>Role</span><b>'+esc(roleName(row))+'</b><span>Created</span><b>'+esc(dt(row.createdAt || row.created_at))+'</b><span>Created By</span><b>'+esc(row.createdByName || row.createdByUsername || row.createdBy || row.creator || '-')+'</b></div><div class="admin-mobile-actions"><button class="clean-btn primary admin-edit-btn" data-id="'+esc(row.id)+'" data-row=\''+JSON.stringify(row).replace(/'/g,'&#39;')+'\'>Edit</button><button class="clean-btn danger admin-delete-btn" data-id="'+esc(row.id)+'">Delete</button></div></div>').join('');
    }
  }

  async function loadBrandOptions(){
    const newSel=document.getElementById('newAdminBrand'), editSel=document.getElementById('editAdminBrand');
    if(!newSel&&!editSel)return;
    const user=BO_AUTH.user()||{};
    if(!user.masterAdmin){
      const bid=user.brandId||''; const label='Current Branding'+(bid?' (#'+bid+')':'');
      const html='<option value="'+esc(bid)+'">'+esc(label)+'</option>';
      if(newSel){newSel.innerHTML=html;newSel.disabled=true;} if(editSel){editSel.innerHTML=html;editSel.disabled=true;}
      await loadRoles(bid); return;
    }
    try{
      const r=await fetch(API_CONFIG.BASE_URL+(API_CONFIG.ENDPOINTS.BRAND_LIST||'/admin/brands'),{headers:{...BO_AUTH.authHeader()}});const j=await r.json();const rows=Array.isArray(j.data)?j.data:[];
      const html='<option value="">Select Branding</option>'+rows.map(x=>'<option value="'+x.id+'">'+esc(x.name||x.code)+' (#'+x.id+')</option>').join('');
      if(newSel)newSel.innerHTML=html;if(editSel)editSel.innerHTML=html;
      const active=(window.BO_BRAND&&BO_BRAND.activeId?BO_BRAND.activeId():1); if(newSel&&rows.some(x=>Number(x.id)===Number(active)))newSel.value=String(active);
      await loadRoles(newSel&&newSel.value?Number(newSel.value):active);
    }catch(e){}
  }

  async function loadAdmins(){
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9">Loading admin accounts...</td></tr>';
    try{
      const json = await apiJson(BO_AUTH.adminListUrl(), {headers: {...BO_AUTH.authHeader()}});
      allAdmins = Array.isArray(json.data) ? json.data : [];
      updateStats(allAdmins);
      filteredAdmins = allAdmins.slice();
      renderAdmins();
    }catch(err){
      tbody.innerHTML = '<tr><td colspan="9" class="text-danger">'+esc(err.message || 'Load admin failed')+'</td></tr>';
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
      const currentUser=BO_AUTH.user()||{}; const brandEl=document.getElementById('newAdminBrand');
      if(currentUser.masterAdmin && (!brandEl||!brandEl.value)) throw new Error('Please select the branding for this administrator.');
      if(!document.getElementById('newAdminRole').value) throw new Error('Please select a branding role.');
      const json = await apiJson(BO_AUTH.createAdminUrl(), {
        method: 'POST', headers: {'Content-Type':'application/json', ...BO_AUTH.authHeader()},
        body: JSON.stringify({
          username: document.getElementById('newAdminUsername').value.trim(),
          displayName: document.getElementById('newAdminDisplayName').value.trim(),
          password: pass,
          status: Number(document.getElementById('newAdminStatus').value || 1),
          roleId: document.getElementById('newAdminRole').value ? Number(document.getElementById('newAdminRole').value) : null,
          brandId: document.getElementById('newAdminBrand') && document.getElementById('newAdminBrand').value ? Number(document.getElementById('newAdminBrand').value) : null,
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
  function openCreateAdmin(){ createForm && createForm.reset(); setStatus(createStatus,'',''); const rc=document.getElementById('adminRemarkCount'); if(rc) rc.textContent='0'; if(editModal){ editModal.classList.remove('show'); editModal.setAttribute('aria-hidden','true'); } if(createModal){ createModal.classList.add('show'); createModal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); } }
  function closeCreateAdmin(){ if(createModal){ createModal.classList.remove('show'); createModal.setAttribute('aria-hidden','true'); } if(!document.querySelector('.modal-clean.show')) document.body.classList.remove('modal-open'); }
  openCreateBtn && openCreateBtn.addEventListener('click', openCreateAdmin);
  document.querySelectorAll('[data-close-create-admin]').forEach(btn => btn.addEventListener('click', closeCreateAdmin));
  createModal && createModal.addEventListener('click', e => { if(e.target === createModal) closeCreateAdmin(); });

  async function openEdit(btn){
    let row = {};
    try{ row = JSON.parse(btn.getAttribute('data-row') || '{}'); }catch(err){}
    editingId = row.id;
    document.getElementById('editAdminUsername').value = row.username || '';
    document.getElementById('editAdminDisplayName').value = row.displayName || '';
    document.getElementById('editAdminStatus').value = String(row.status == null ? 1 : row.status);
    if(document.getElementById('editAdminBrand')) document.getElementById('editAdminBrand').value = row.brandId == null ? '' : String(row.brandId);
    if(row.brandId) await loadRoles(Number(row.brandId));
    document.getElementById('editAdminRole').value = String(row.roleId || '');
    document.getElementById('editAdminStatus').dispatchEvent(new Event('change', {bubbles:true}));
    document.getElementById('editAdminRole').dispatchEvent(new Event('change', {bubbles:true}));
    document.getElementById('editAdminPassword').value = '';
    setStatus(document.getElementById('editAdminStatusMsg'), '', '');
    if(createModal){ createModal.classList.remove('show'); createModal.setAttribute('aria-hidden','true'); }
    if(editModal){ editModal.classList.add('show'); editModal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); }
  }

  document.addEventListener('click', function(e){
    const edit = e.target.closest && e.target.closest('.admin-edit-btn');
    if(edit){ openEdit(edit); return; }
    const del = e.target.closest && e.target.closest('.admin-delete-btn');
    if(del){
      const id=Number(del.dataset.id||0);
      const currentId=Number((BO_AUTH.user()||{}).id||0);
      if(!id){ BO_DIALOG.alert('Missing admin ID'); return; }
      if(id===currentId){ BO_DIALOG.alert('You cannot delete the admin account currently logged in.'); return; }
      (async()=>{
        if(!(await BO_DIALOG.confirm('Delete this administrator account?', {title:'Delete Administrator',confirmText:'Delete'}))) return;
        try{ const json=await apiJson(BO_AUTH.adminDeleteUrl(id),{method:'POST',headers:{...BO_AUTH.authHeader()}}); await BO_DIALOG.alert(json.message||'Admin deleted successfully'); await loadAdmins(); }
        catch(err){ await BO_DIALOG.alert(err.message||'Delete admin failed'); }
      })();
      return;
    }
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
          roleId: document.getElementById('editAdminRole').value ? Number(document.getElementById('editAdminRole').value) : null,
          brandId: document.getElementById('editAdminBrand') && document.getElementById('editAdminBrand').value ? Number(document.getElementById('editAdminBrand').value) : null,
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

  const newBrandEl=document.getElementById('newAdminBrand');
  const editBrandEl=document.getElementById('editAdminBrand');
  newBrandEl && newBrandEl.addEventListener('change',()=>{ if(newBrandEl.value) loadRoles(Number(newBrandEl.value)); });
  editBrandEl && editBrandEl.addEventListener('change',()=>{ if(editBrandEl.value) loadRoles(Number(editBrandEl.value)); });
  (async function(){ await loadBrandOptions(); await loadAdmins(); })();
})();
