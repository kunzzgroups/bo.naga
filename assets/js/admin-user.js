(function(){
  const createForm = document.getElementById('createAdminForm');
  const createStatus = document.getElementById('createAdminStatus');
  const createBtn = document.getElementById('createAdminBtn');
  const tbody = document.getElementById('adminTableBody');
  const refreshBtn = document.getElementById('refreshAdminBtn');
  const editModal = document.getElementById('adminEditModal');
  const editForm = document.getElementById('editAdminForm');
  let editingId = null;
  let roleMap = {};

  function setStatus(el, message, type){
    if(!el) return;
    el.textContent = message || '';
    el.className = 'upload-status mb-3 ' + (type || '');
  }

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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
      roleMap = {}; rows.forEach(r => roleMap[String(r.id)] = r.name || r.code);
      const html = rows.map(r => '<option value="'+esc(r.id)+'">'+esc(r.name || r.code)+'</option>').join('');
      ['newAdminRole','editAdminRole'].forEach(id => { const el=document.getElementById(id); if(el) el.innerHTML = html || '<option value="1">Super Admin</option>'; });
    }catch(e){}
  }

  async function loadAdmins(){
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading admin accounts...</td></tr>';
    try{
      const json = await apiJson(BO_AUTH.adminListUrl(), {headers: {...BO_AUTH.authHeader()}});
      const rows = Array.isArray(json.data) ? json.data : [];
      if(!rows.length){ tbody.innerHTML = '<tr><td colspan="6">No admin found.</td></tr>'; return; }
      tbody.innerHTML = rows.map(row => {
        const active = Number(row.status) === 1;
        return '<tr>'+
          '<td><b>'+esc(row.username)+'</b><br><small>'+esc(row.displayName || row.username)+'</small></td>'+
          '<td><span class="badge '+(active?'text-bg-success':'text-bg-secondary')+'">'+(active?'Active':'Inactive')+'</span><br><small>'+esc(roleMap[String(row.roleId)] || ('Role #'+(row.roleId||1)))+'</small></td>'+
          '<td>'+esc(row.createdAt || '-')+'</td>'+
          '<td>'+esc(row.updatedAt || '-')+'</td>'+
          '<td>'+ (Number(row.id) === Number((BO_AUTH.user() || {}).id) ? '<span class="badge text-bg-primary">Current login</span>' : '') +'</td>'+
          '<td><button class="clean-btn primary admin-edit-btn" data-id="'+esc(row.id)+'" data-row=\''+JSON.stringify(row).replace(/'/g,'&#39;')+'\'><i class="bi bi-pencil-square"></i> Edit</button></td>'+
        '</tr>';
      }).join('');
    }catch(err){
      tbody.innerHTML = '<tr><td colspan="6" class="text-danger">'+esc(err.message || 'Load admin failed')+'</td></tr>';
    }
  }

  createForm && createForm.addEventListener('submit', async function(e){
    e.preventDefault();
    createBtn.disabled = true;
    setStatus(createStatus, 'Creating admin...', '');
    try{
      const json = await apiJson(BO_AUTH.createAdminUrl(), {
        method: 'POST',
        headers: {'Content-Type':'application/json', ...BO_AUTH.authHeader()},
        body: JSON.stringify({
          username: document.getElementById('newAdminUsername').value.trim(),
          displayName: document.getElementById('newAdminDisplayName').value.trim(),
          password: document.getElementById('newAdminPassword').value,
          status: Number(document.getElementById('newAdminStatus').value || 1),
          roleId: Number(document.getElementById('newAdminRole').value || 1)
        })
      });
      setStatus(createStatus, json.message || 'Admin created successfully', 'success');
      createForm.reset();
      await loadAdmins();
    }catch(err){
      setStatus(createStatus, err.message || 'Create admin failed', 'error');
    }finally{
      createBtn.disabled = false;
    }
  });

  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('.admin-edit-btn');
    if(!btn) return;
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
  });

  editForm && editForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!editingId) return;
    const statusEl = document.getElementById('editAdminStatusMsg');
    setStatus(statusEl, 'Saving admin...', '');
    try{
      const json = await apiJson(BO_AUTH.adminUpdateUrl(editingId), {
        method: 'POST',
        headers: {'Content-Type':'application/json', ...BO_AUTH.authHeader()},
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
    }catch(err){
      setStatus(statusEl, err.message || 'Update admin failed', 'error');
    }
  });

  refreshBtn && refreshBtn.addEventListener('click', loadAdmins);
  (async function(){ await loadRoles(); await loadAdmins(); })();
})();
