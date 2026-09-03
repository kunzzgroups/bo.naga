(function(){
  try{(JSON.parse(localStorage.getItem('bo_menu_group_meta_v1')||'[]')||[]).forEach(function(g){if(window.BO_MENU_GROUP_META&&g.groupKey)window.BO_MENU_GROUP_META[g.groupKey]={title:g.title,icon:g.icon,sortOrder:g.sortOrder};});}catch(e){}
  const page = document.body.dataset.accessPage;
  const roleStatusEl = document.getElementById('accessStatus');
  const GROUP_META = {
    root:{title:'Main Menu',icon:'bi-grid'}, access:{title:'Access Control',icon:'bi-shield-lock'},
    wallet:{title:'Wallet Management',icon:'bi-wallet2'}, agent_management_group:{title:'Agent Management',icon:'bi-person-workspace'}, report:{title:'Report',icon:'bi-bar-chart-line'},
    game:{title:'Game Management',icon:'bi-controller'}, bonus:{title:'Bonus Management',icon:'bi-gift'},
    design:{title:'Design',icon:'bi-palette'}, setting:{title:'Setting',icon:'bi-gear'}, support:{title:'Support',icon:'bi-headset'},
    main_reports_group:{title:'Reports',icon:'bi-file-earmark-bar-graph'}, main_accounting_group:{title:'Accounting & Provider Ops',icon:'bi-cash-stack'}, main_brands_group:{title:'Brands',icon:'bi-buildings'}
  };
  const GROUP_ORDER=['root','main_reports_group','main_accounting_group','main_brands_group','access','wallet','agent_management_group','report','game','bonus','design','setting','support'];
  let menuCache=[];
  let roleCache=[];
  let editingRoleType='';
  const currentAdmin = (window.BO_AUTH && BO_AUTH.user) ? BO_AUTH.user() : {};
  const rootAdmin = currentAdmin && (currentAdmin.rootAdmin === true || Number(currentAdmin.rootAdmin) === 1 || String(currentAdmin.roleType||'').toUpperCase()==='ROOT' || (Number(currentAdmin.id)===1 && currentAdmin.brandId==null));
  const masterAdmin = currentAdmin && !rootAdmin && (currentAdmin.masterAdmin === true || Number(currentAdmin.masterAdmin) === 1 || String(currentAdmin.roleType||'').toUpperCase()==='MASTER');
  const platformRoleAdmin = currentAdmin && (rootAdmin || masterAdmin || currentAdmin.brandId == null);
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function msg(el,text,cls){if(el){el.textContent=text||'';el.className='upload-status '+(cls||'');}}
  async function api(url,opt){const res=await fetch(url,opt||{});const j=await res.json().catch(()=>({}));if(!res.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  async function bootstrap(){try{await api(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.ACCESS_BOOTSTRAP,{headers:{...BO_AUTH.authHeader()}});}catch(e){}}
  async function fetchRoles(){
    // Root/platform Role Management must show the roles that already exist in DB,
    // including legacy rows whose brand_id was populated before multi-brand normalization.
    const primary = platformRoleAdmin && BO_AUTH.roleListAllUrl ? BO_AUTH.roleListAllUrl() : BO_AUTH.roleListUrl();
    let j=await api(primary,{headers:{...BO_AUTH.authHeader()}});
    let rows=Array.isArray(j.data)?j.data:[];
    // Backward-compatible retry for deployments where /roles/all is not available yet.
    if(!rows.length && primary!==BO_AUTH.roleListUrl()){
      try{j=await api(BO_AUTH.roleListUrl(),{headers:{...BO_AUTH.authHeader()}});rows=Array.isArray(j.data)?j.data:[];}catch(e){}
    }
    return rows;
  }

  async function fetchMenus(){
    const url=platformRoleAdmin&&BO_AUTH.menuListAllUrl?BO_AUTH.menuListAllUrl():BO_AUTH.menuListUrl();
    const j=await api(url,{headers:{...BO_AUTH.authHeader()}});
    return (j.data||[]).filter(m=>Number(m.status==null?1:m.status)===1);
  }
  async function fetchRoleMenuIds(roleId){const j=await api(BO_AUTH.roleMenusUrl(roleId),{headers:{...BO_AUTH.authHeader()}});return j.data?.menuIds||[];}

  function groupMenus(menus){
    const groups={};
    menus.forEach(m=>{const key=(m.parentKey||'').trim()||'root';(groups[key]||(groups[key]=[])).push(m);});
    Object.values(groups).forEach(rows=>rows.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||''))));
    return Object.keys(groups).sort((a,b)=>{const ai=GROUP_ORDER.indexOf(a),bi=GROUP_ORDER.indexOf(b);return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);}).map(key=>({key,rows:groups[key]}));
  }
  function renderPermissionGroupsInto(boxId,selected){
    const box=document.getElementById(boxId); if(!box)return;
    const set=new Set((selected||[]).map(String));
    // Always render the complete active Menu Management catalogue for every editable role.
    // ROOT decides the permission assignment; role type must not silently hide menu choices.
    const visibleMenus=menuCache;
    box.innerHTML=groupMenus(visibleMenus).map(g=>{
      const meta=GROUP_META[g.key]||{title:g.key.replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),icon:'bi-folder2-open'};
      return `<section class="permission-group" data-permission-group="${esc(g.key)}">
        <div class="permission-group-head"><div class="permission-group-title"><i class="bi ${esc(meta.icon)}"></i><span>${esc(meta.title)}</span></div><label class="permission-group-toggle"><input type="checkbox" data-group-toggle="${esc(g.key)}"> Select group</label></div>
        <div class="permission-menu-grid">${g.rows.map(m=>`<label class="permission-item"><input type="checkbox" value="${esc(m.id)}" ${set.has(String(m.id))?'checked':''}><span><b><i class="bi ${esc(m.icon||'bi-circle')} me-1"></i>${esc(m.title)}</b><small>${esc(m.url)}${m.parentKey?' / '+esc(m.parentKey):''}</small></span></label>`).join('')}</div>
      </section>`;
    }).join('')||'<div class="permission-empty">No active menu found.</div>';
    syncGroupToggles();
  }
  function renderPermissionGroups(selected){renderPermissionGroupsInto('checkList',selected);}
  function syncGroupToggles(){document.querySelectorAll('[data-permission-group]').forEach(group=>{const items=[...group.querySelectorAll('.permission-item input')],toggle=group.querySelector('[data-group-toggle]');if(!toggle)return;const checked=items.filter(x=>x.checked).length;toggle.checked=items.length>0&&checked===items.length;toggle.indeterminate=checked>0&&checked<items.length;});}
  function slugify(name){return String(name||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('group_'+Date.now());}

  function openModal(){const m=document.getElementById('roleCreateModal');m?.classList.add('show');document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('name')?.focus(),50);}
  function closeModal(){const m=document.getElementById('roleCreateModal');m?.classList.remove('show');document.body.classList.remove('modal-open');msg(roleStatusEl,'','');}
  function resetModal(){document.getElementById('accessForm')?.reset();document.getElementById('roleEditId').value='';document.getElementById('roleEditCode').value='';document.getElementById('roleModalTitle').textContent='Add Permission Group';document.getElementById('roleModalSubtitle').textContent='Enter a group name and select its menu permissions.';renderPermissionGroups([]);msg(roleStatusEl,'','');}
  async function openCreate(){editingRoleType='';resetModal();openModal();}
  async function openEdit(roleId){
    const role=roleCache.find(r=>String(r.id)===String(roleId)); if(!role)return;
    editingRoleType=String(role.roleType||'').toUpperCase();
    const systemRole = Number(role.systemRole)===1;
    const roleType = String(role.roleType||'').toUpperCase();
    const editableSystemRole = systemRole && ((rootAdmin && roleType!=='ROOT') || (masterAdmin && roleType==='BRAND_OWNER'));
    if(systemRole && !editableSystemRole){msg(roleStatusEl,'This system role is protected.','error');return;}
    resetModal();document.getElementById('roleEditId').value=role.id;document.getElementById('roleEditCode').value=role.code||'';document.getElementById('name').value=role.name||'';
    document.getElementById('roleModalTitle').textContent=editableSystemRole?'System Role Access':'Edit Permission Group';document.getElementById('roleModalSubtitle').textContent=editableSystemRole?'Update the menu access for this system role. The role code/type remains protected.':'Update the group name or its menu permissions.';
    openModal();msg(roleStatusEl,'Loading permissions...','');
    try{let selected=await fetchRoleMenuIds(role.id);renderPermissionGroups(selected);msg(roleStatusEl,'','');}catch(e){msg(roleStatusEl,e.message,'error');}
  }

  async function loadRoleList(){
    const body=document.getElementById('accessTableBody'), cards=document.getElementById('roleMobileCards'); if(!body)return;
    try{
      roleCache=await fetchRoles();
      const details=await Promise.all(roleCache.map(async r=>{try{return {...r,permissionCount:(await fetchRoleMenuIds(r.id)).length};}catch(e){return {...r,permissionCount:0};}}));
      document.getElementById('roleCountBadge').textContent=`${details.length} Group${details.length===1?'':'s'}`;
      body.innerHTML=details.map(r=>{const rt=String(r.roleType||'').toUpperCase();const sys=Number(r.systemRole)===1;const canEditSystem=sys&&((rootAdmin&&rt!=='ROOT')||(masterAdmin&&rt==='BRAND_OWNER'));const action=sys?(canEditSystem?'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-sliders"></i> Edit Access</button>':'<span class="status-pill active">Protected</span>'):'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> Edit</button>';return `<tr><td><b>${esc(r.name)}</b></td><td><span class="role-code-pill">${esc(r.code)}</span><small style="display:block;margin-top:4px;color:#667085">${esc(r.roleType||'CUSTOM')}</small></td><td><span class="role-permission-count"><i class="bi bi-shield-check"></i>${r.permissionCount} Menu${r.permissionCount===1?'':'s'}</span></td><td>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td>${action}</td></tr>`;}).join('')||'<tr><td colspan="5">No permission group found.</td></tr>';
      if(cards)cards.innerHTML=details.map(r=>{const rt=String(r.roleType||'').toUpperCase();const sys=Number(r.systemRole)===1;const canEditSystem=sys&&((rootAdmin&&rt!=='ROOT')||(masterAdmin&&rt==='BRAND_OWNER'));const action=sys?(canEditSystem?'<button class="clean-btn role-edit-btn w-100" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-sliders"></i> Edit Access</button>':'<span class="status-pill active">Protected</span>'):'<button class="clean-btn role-edit-btn w-100" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> Edit Group</button>';return `<article class="member-mobile-card role-mobile-card"><div class="member-card-head"><div><strong>${esc(r.name)}</strong><small>${esc(r.code)}</small></div>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</div><div class="member-card-grid"><div><span>Permissions</span><b>${r.permissionCount} Menus</b></div></div>${action}</article>`;}).join('');
    }catch(e){body.innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`;if(cards)cards.innerHTML='';}
  }

  function canEditRoleMenus(role){
    const rt=String(role?.roleType||'').toUpperCase();
    const sys=Number(role?.systemRole)===1;
    if(!sys)return true;
    if(rootAdmin)return rt!=='ROOT';
    if(masterAdmin)return rt==='BRAND_OWNER';
    return false;
  }

  function openMenuPermissionModal(){
    document.getElementById('menuPermissionModal')?.classList.add('show');
    document.body.classList.add('modal-open');
  }
  function closeMenuPermissionModal(){
    document.getElementById('menuPermissionModal')?.classList.remove('show');
    document.body.classList.remove('modal-open');
    msg(document.getElementById('menuPermissionStatus'),'','');
  }
  async function openMenuPermissionEditor(roleId){
    const role=roleCache.find(r=>String(r.id)===String(roleId)); if(!role)return;
    if(!canEditRoleMenus(role)){msg(document.getElementById('menuPermissionStatus'),'This system role is protected.','error');return;}
    document.getElementById('menuPermissionRoleId').value=role.id;
    document.getElementById('menuPermissionRoleName').value=(role.name||'')+(role.code?' ('+role.code+')':'');
    document.getElementById('menuPermissionModalTitle').textContent='Menu Permission - '+(role.name||role.code||'Role');
    renderPermissionGroupsInto('menuPermissionCheckList',[]);
    openMenuPermissionModal();
    msg(document.getElementById('menuPermissionStatus'),'Loading permissions...','');
    try{const selected=await fetchRoleMenuIds(role.id);renderPermissionGroupsInto('menuPermissionCheckList',selected);msg(document.getElementById('menuPermissionStatus'),'','');}
    catch(e){msg(document.getElementById('menuPermissionStatus'),e.message,'error');}
  }
  async function loadMenuPermissionList(){
    const body=document.getElementById('menuPermissionTableBody'),cards=document.getElementById('menuPermissionMobileCards'); if(!body)return;
    try{
      roleCache=await fetchRoles();
      const details=await Promise.all(roleCache.map(async r=>{try{return {...r,permissionCount:(await fetchRoleMenuIds(r.id)).length};}catch(e){return {...r,permissionCount:0};}}));
      const badge=document.getElementById('menuPermissionCountBadge');if(badge)badge.textContent=`${details.length} Role${details.length===1?'':'s'}`;
      const actionHtml=r=>canEditRoleMenus(r)?`<button class="clean-btn role-edit-btn" type="button" data-edit-menu-permission="${esc(r.id)}"><i class="bi bi-sliders"></i> Manage Menus</button>`:'<span class="status-pill active">Protected</span>';
      body.innerHTML=details.map(r=>`<tr><td><b>${esc(r.name)}</b></td><td><span class="role-code-pill">${esc(r.code)}</span><small style="display:block;margin-top:4px;color:#667085">${esc(r.roleType||'CUSTOM')}</small></td><td><span class="role-permission-count"><i class="bi bi-shield-check"></i>${r.permissionCount} Menu${r.permissionCount===1?'':'s'}</span></td><td>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td>${actionHtml(r)}</td></tr>`).join('')||'<tr><td colspan="5">No role found.</td></tr>';
      if(cards)cards.innerHTML=details.map(r=>`<article class="member-mobile-card role-mobile-card"><div class="member-card-head"><div><strong>${esc(r.name)}</strong><small>${esc(r.code)}</small></div>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</div><div class="member-card-grid"><div><span>Permissions</span><b>${r.permissionCount} Menus</b></div></div>${canEditRoleMenus(r)?`<button class="clean-btn role-edit-btn w-100" type="button" data-edit-menu-permission="${esc(r.id)}"><i class="bi bi-sliders"></i> Manage Menus</button>`:'<span class="status-pill active">Protected</span>'}</article>`).join('');
    }catch(e){body.innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`;if(cards)cards.innerHTML='';}
  }
  async function saveMenuPermissions(e){
    e.preventDefault();
    const roleId=document.getElementById('menuPermissionRoleId').value;
    const status=document.getElementById('menuPermissionStatus');
    const btn=document.getElementById('saveMenuPermissionBtn');
    const ids=[...document.querySelectorAll('#menuPermissionCheckList .permission-item input:checked')].map(x=>Number(x.value));
    if(!roleId){msg(status,'Role is required.','error');return;}
    btn.disabled=true;msg(status,'Saving menu permissions...','');
    try{
      const saved=await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      const persisted=(saved.data?.menuIds||[]).map(Number).filter(Number.isFinite);
      const missing=ids.filter(id=>!new Set(persisted).has(id));
      if(missing.length)throw new Error('Some selected menu permissions were rejected by the API.');
      msg(status,'Menu permissions saved successfully.','success');await loadMenuPermissionList();setTimeout(closeMenuPermissionModal,500);
    }catch(err){msg(status,String(err?.message||'Unable to save menu permissions.'),'error');}
    finally{btn.disabled=false;}
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
      const menuSave=await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      const persisted=(menuSave.data?.menuIds||[]).map(Number).filter(Number.isFinite);
      const requestedSet=new Set(ids.map(Number));
      const persistedSet=new Set(persisted);
      const missing=[...requestedSet].filter(id=>!persistedSet.has(id));
      if(missing.length){
        throw new Error('Some selected MAIN menu permissions were rejected by the API. Please deploy the matching Spring Boot permission fix and save again.');
      }
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
    const menuEdit=e.target.closest('[data-edit-menu-permission]');if(menuEdit)openMenuPermissionEditor(menuEdit.dataset.editMenuPermission);
    if(e.target.closest('[data-close-role-modal]'))closeModal();
    if(e.target.closest('[data-close-menu-permission-modal]'))closeMenuPermissionModal();
    if(e.target.id==='roleCreateModal')closeModal();
    if(e.target.id==='menuPermissionModal')closeMenuPermissionModal();
  });
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(document.getElementById('roleCreateModal')?.classList.contains('show'))closeModal();if(document.getElementById('menuPermissionModal')?.classList.contains('show'))closeMenuPermissionModal();});
  document.addEventListener('DOMContentLoaded',async()=>{
    await bootstrap();
    if(page==='role'){
      try{menuCache=await fetchMenus();renderPermissionGroups([]);await loadRoleList();}catch(e){msg(roleStatusEl,e.message,'error');}
      document.getElementById('accessForm').onsubmit=saveRole;
      document.getElementById('selectAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=true);syncGroupToggles();};
      document.getElementById('clearAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=false);syncGroupToggles();};
    }
    if(page==='menu-permission'){
      try{menuCache=await fetchMenus();await loadMenuPermissionList();}catch(e){msg(document.getElementById('menuPermissionStatus'),e.message,'error');}
      const form=document.getElementById('menuPermissionForm');if(form)form.onsubmit=saveMenuPermissions;
      const all=document.getElementById('menuPermissionSelectAll');if(all)all.onclick=()=>{document.querySelectorAll('#menuPermissionCheckList .permission-item input').forEach(x=>x.checked=true);syncGroupToggles();};
      const clear=document.getElementById('menuPermissionClearAll');if(clear)clear.onclick=()=>{document.querySelectorAll('#menuPermissionCheckList .permission-item input').forEach(x=>x.checked=false);syncGroupToggles();};
    }
    if(page==='account-lock')loadAccountLock();
  });

  async function loadAccountLock(){const body=document.getElementById('lockTableBody');try{const rows=(await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}})).data||[];body.innerHTML=rows.map(m=>`<tr><td><b>${esc(m.username)}</b><br><small>${esc(m.fullName||m.mobile)}</small></td><td>${m.locked==1?'<span class="status-pill off">Locked</span>':'<span class="status-pill active">Normal</span>'}</td><td><button class="clean-btn" data-lock-id="${m.id}" data-lock="${m.locked==1?0:1}">${m.locked==1?'Unlock':'Lock'}</button></td></tr>`).join('')||'<tr><td colspan="3">No member.</td></tr>';}catch(e){body.innerHTML='<tr><td colspan="3">'+esc(e.message)+'</td></tr>';}}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-lock-id]');if(!b)return;await api(BO_AUTH.memberUpdateUrl(b.dataset.lockId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})});loadAccountLock();});
})();
