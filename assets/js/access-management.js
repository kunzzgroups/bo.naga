(function(){
  const page = document.body.dataset.accessPage;
  const roleStatusEl = document.getElementById('accessStatus');
  const GROUP_META = {
    root:{title:'Main Menu',icon:'bi-grid'}, access:{title:'Access Control',icon:'bi-shield-lock'},
    wallet:{title:'Wallet Management',icon:'bi-wallet2'}, report:{title:'Report',icon:'bi-bar-chart-line'},
    game:{title:'Game Management',icon:'bi-controller'}, bonus:{title:'Bonus Management',icon:'bi-gift'},
    design:{title:'Design',icon:'bi-palette'}, setting:{title:'Setting',icon:'bi-gear'}, support:{title:'Support',icon:'bi-headset'}
  };
  const GROUP_ORDER=['root','access','wallet','report','game','bonus','design','setting','support'];
  let menuCache=[];
  let roleCache=[];
  const currentAdmin = (window.BO_AUTH && BO_AUTH.user) ? BO_AUTH.user() : {};
  const masterAdmin = currentAdmin && (currentAdmin.masterAdmin === true || Number(currentAdmin.masterAdmin) === 1 || String(currentAdmin.roleType||'').toUpperCase()==='MASTER');

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function msg(el,text,cls){if(el){el.textContent=text||'';el.className='upload-status '+(cls||'');}}
  async function api(url,opt){const res=await fetch(url,opt||{});const j=await res.json().catch(()=>({}));if(!res.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  async function bootstrap(){try{await api(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.ACCESS_BOOTSTRAP,{headers:{...BO_AUTH.authHeader()}});}catch(e){}}
  async function fetchRoles(){const j=await api(BO_AUTH.roleListUrl(),{headers:{...BO_AUTH.authHeader()}});return j.data||[];}
  async function fetchMenus(){const j=await api(BO_AUTH.menuListUrl(),{headers:{...BO_AUTH.authHeader()}});return (j.data||[]).filter(m=>Number(m.status==null?1:m.status)===1);}
  async function fetchRoleMenuIds(roleId){const j=await api(BO_AUTH.roleMenusUrl(roleId),{headers:{...BO_AUTH.authHeader()}});return j.data?.menuIds||[];}

  function groupMenus(menus){
    const groups={};
    menus.forEach(m=>{const key=(m.parentKey||'').trim()||'root';(groups[key]||(groups[key]=[])).push(m);});
    Object.values(groups).forEach(rows=>rows.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||''))));
    return Object.keys(groups).sort((a,b)=>{const ai=GROUP_ORDER.indexOf(a),bi=GROUP_ORDER.indexOf(b);return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);}).map(key=>({key,rows:groups[key]}));
  }
  function renderPermissionGroups(selected){
    const box=document.getElementById('checkList'); if(!box)return;
    const set=new Set((selected||[]).map(String));
    box.innerHTML=groupMenus(menuCache).map(g=>{
      const meta=GROUP_META[g.key]||{title:g.key.replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),icon:'bi-folder2-open'};
      return `<section class="permission-group" data-permission-group="${esc(g.key)}">
        <div class="permission-group-head"><div class="permission-group-title"><i class="bi ${esc(meta.icon)}"></i><span>${esc(meta.title)}</span></div><label class="permission-group-toggle"><input type="checkbox" data-group-toggle="${esc(g.key)}"> Select group</label></div>
        <div class="permission-menu-grid">${g.rows.map(m=>`<label class="permission-item"><input type="checkbox" value="${esc(m.id)}" ${set.has(String(m.id))?'checked':''}><span><b><i class="bi ${esc(m.icon||'bi-circle')} me-1"></i>${esc(m.title)}</b><small>${esc(m.url)}${m.parentKey?' / '+esc(m.parentKey):''}</small></span></label>`).join('')}</div>
      </section>`;
    }).join('')||'<div class="permission-empty">No active menu found.</div>';
    syncGroupToggles();
  }
  function syncGroupToggles(){document.querySelectorAll('[data-permission-group]').forEach(group=>{const items=[...group.querySelectorAll('.permission-item input')],toggle=group.querySelector('[data-group-toggle]');if(!toggle)return;const checked=items.filter(x=>x.checked).length;toggle.checked=items.length>0&&checked===items.length;toggle.indeterminate=checked>0&&checked<items.length;});}
  function slugify(name){return String(name||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('group_'+Date.now());}

  function openModal(){const m=document.getElementById('roleCreateModal');m?.classList.add('show');document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('name')?.focus(),50);}
  function closeModal(){const m=document.getElementById('roleCreateModal');m?.classList.remove('show');document.body.classList.remove('modal-open');msg(roleStatusEl,'','');}
  function resetModal(){document.getElementById('accessForm')?.reset();document.getElementById('roleEditId').value='';document.getElementById('roleEditCode').value='';document.getElementById('roleModalTitle').textContent='Add Permission Group';document.getElementById('roleModalSubtitle').textContent='Enter a group name and select its menu permissions.';renderPermissionGroups([]);msg(roleStatusEl,'','');}
  async function openCreate(){resetModal();openModal();}
  async function openEdit(roleId){
    const role=roleCache.find(r=>String(r.id)===String(roleId)); if(!role)return;
    const editableBrandOwner = masterAdmin && Number(role.systemRole)===1 && String(role.roleType||'').toUpperCase()==='BRAND_OWNER';
    if(Number(role.systemRole)===1 && !editableBrandOwner){msg(roleStatusEl,'This system role is protected.','error');return;}
    resetModal();document.getElementById('roleEditId').value=role.id;document.getElementById('roleEditCode').value=role.code||'';document.getElementById('name').value=role.name||'';
    document.getElementById('roleModalTitle').textContent=editableBrandOwner?'Brand Owner Access':'Edit Permission Group';document.getElementById('roleModalSubtitle').textContent=editableBrandOwner?'Master-controlled menus for this branding. Checked menus appear in the Brand Owner sidebar and are enforced by the API.':'Update the group name or its menu permissions.';
    openModal();msg(roleStatusEl,'Loading permissions...','');
    try{renderPermissionGroups(await fetchRoleMenuIds(role.id));msg(roleStatusEl,'','');}catch(e){msg(roleStatusEl,e.message,'error');}
  }

  async function loadRoleList(){
    const body=document.getElementById('accessTableBody'), cards=document.getElementById('roleMobileCards'); if(!body)return;
    try{
      roleCache=await fetchRoles();
      const details=await Promise.all(roleCache.map(async r=>{try{return {...r,permissionCount:(await fetchRoleMenuIds(r.id)).length};}catch(e){return {...r,permissionCount:0};}}));
      document.getElementById('roleCountBadge').textContent=`${details.length} Group${details.length===1?'':'s'}`;
      body.innerHTML=details.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td><span class="role-code-pill">${esc(r.code)}</span><small style="display:block;margin-top:4px;color:#667085">${esc(r.roleType||'CUSTOM')}</small></td><td><span class="role-permission-count"><i class="bi bi-shield-check"></i>${r.permissionCount} Menu${r.permissionCount===1?'':'s'}</span></td><td>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td>${Number(r.systemRole)===1?(masterAdmin&&String(r.roleType||'').toUpperCase()==='BRAND_OWNER'?'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-sliders"></i> Edit Access</button>':'<span class="status-pill active">Protected</span>'):'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> Edit</button>'}</td></tr>`).join('')||'<tr><td colspan="5">No permission group found.</td></tr>';
      if(cards)cards.innerHTML=details.map(r=>`<article class="member-mobile-card role-mobile-card"><div class="member-card-head"><div><strong>${esc(r.name)}</strong><small>${esc(r.code)}</small></div>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</div><div class="member-card-grid"><div><span>Permissions</span><b>${r.permissionCount} Menus</b></div></div>${Number(r.systemRole)===1&&!masterAdmin?'<span class="status-pill active">Protected</span>':'<button class="clean-btn role-edit-btn w-100" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> '+(Number(r.systemRole)===1?'Edit Access':'Edit Group')+'</button>'}</article>`).join('');
    }catch(e){body.innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`;if(cards)cards.innerHTML='';}
  }

  async function saveRole(e){
    e.preventDefault();
    const btn=document.getElementById('saveRoleBtn'), name=document.getElementById('name').value.trim(), editId=document.getElementById('roleEditId').value, oldCode=document.getElementById('roleEditCode').value;
    const ids=[...document.querySelectorAll('#checkList .permission-item input:checked')].map(x=>Number(x.value));
    if(!name){msg(roleStatusEl,'Group name is required.','error');return;}
    if(!ids.length){msg(roleStatusEl,'Please select at least one menu permission.','error');return;}
    btn.disabled=true;msg(roleStatusEl,'Saving group and permissions...','');
    try{
      const payload={name,code:editId?(oldCode||slugify(name)):slugify(name),remark:'',status:1};if(editId)payload.id=Number(editId);
      const saved=await api(BO_AUTH.roleSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});
      let roleId=saved.data?.id||editId;
      if(!roleId){const roles=await fetchRoles();roleId=roles.find(r=>r.code===payload.code)?.id;}
      if(!roleId)throw new Error('Role saved but role ID was not returned.');
      await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      msg(roleStatusEl,editId?'Group updated successfully.':'Group created successfully.','success');await loadRoleList();setTimeout(closeModal,500);
    }catch(err){
      const raw=String(err?.message||'Unable to save the permission group.');
      const friendly=/duplicate entry|constraint|could not execute statement|sql \[/i.test(raw)
        ? 'Unable to update permissions. Please refresh and try again.'
        : raw;
      msg(roleStatusEl,friendly,'error');
    }finally{btn.disabled=false;}
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-group-toggle]')){const group=e.target.closest('[data-permission-group]');group.querySelectorAll('.permission-item input').forEach(x=>x.checked=e.target.checked);syncGroupToggles();}
    if(e.target.matches('.permission-item input'))syncGroupToggles();
  });
  document.addEventListener('click',e=>{
    if(e.target.closest('#openRoleModalBtn'))openCreate();
    const edit=e.target.closest('[data-edit-role]');if(edit)openEdit(edit.dataset.editRole);
    if(e.target.closest('[data-close-role-modal]'))closeModal();
    if(e.target.id==='roleCreateModal')closeModal();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('roleCreateModal')?.classList.contains('show'))closeModal();});
  document.addEventListener('DOMContentLoaded',async()=>{
    await bootstrap();
    if(page==='role'){
      try{menuCache=await fetchMenus();renderPermissionGroups([]);await loadRoleList();}catch(e){msg(roleStatusEl,e.message,'error');}
      document.getElementById('accessForm').onsubmit=saveRole;
      document.getElementById('selectAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=true);syncGroupToggles();};
      document.getElementById('clearAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=false);syncGroupToggles();};
    }
    if(page==='account-lock')loadAccountLock();
  });

  async function loadAccountLock(){const body=document.getElementById('lockTableBody');try{const rows=(await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}})).data||[];body.innerHTML=rows.map(m=>`<tr><td><b>${esc(m.username)}</b><br><small>${esc(m.fullName||m.mobile)}</small></td><td>${m.locked==1?'<span class="status-pill off">Locked</span>':'<span class="status-pill active">Normal</span>'}</td><td><button class="clean-btn" data-lock-id="${m.id}" data-lock="${m.locked==1?0:1}">${m.locked==1?'Unlock':'Lock'}</button></td></tr>`).join('')||'<tr><td colspan="3">No member.</td></tr>';}catch(e){body.innerHTML='<tr><td colspan="3">'+esc(e.message)+'</td></tr>';}}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-lock-id]');if(!b)return;await api(BO_AUTH.memberUpdateUrl(b.dataset.lockId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})});loadAccountLock();});
})();
