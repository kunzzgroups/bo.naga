(function(){
  try{(JSON.parse(localStorage.getItem('bo_menu_group_meta_v1')||'[]')||[]).forEach(function(g){if(window.BO_MENU_GROUP_META&&g.groupKey)window.BO_MENU_GROUP_META[g.groupKey]={title:g.title,icon:g.icon,sortOrder:g.sortOrder};});}catch(e){}
  const page = document.body.dataset.accessPage;
  const roleStatusEl = document.getElementById('accessStatus');
  const GROUP_META = {
    root:{title:'Main Menu',icon:'bi-grid'}, access:{title:'Access Control',icon:'bi-shield-lock'},
    wallet:{title:'Wallet Management',icon:'bi-wallet2'}, agent_management_group:{title:'Agent Management',icon:'bi-person-workspace'}, report:{title:'Report',icon:'bi-bar-chart-line'},
    game:{title:'Game Management',icon:'bi-controller'}, bonus:{title:'Bonus Management',icon:'bi-gift'},
    design:{title:'Design',icon:'bi-palette'}, setting:{title:'Setting',icon:'bi-gear'}, support:{title:'Support',icon:'bi-headset'},
    main_reports_group:{title:'Reports',icon:'bi-file-earmark-bar-graph'}, main_accounting_group:{title:'Accounting & Provider Ops',icon:'bi-cash-stack'}, main_brands_group:{title:'Brands',icon:'bi-buildings'},
    main_admin_group:{title:'Admin',icon:'bi-shield-lock'}
  };
  const GROUP_ORDER=['root','main_reports_group','main_accounting_group','main_brands_group','main_admin_group','access','wallet','agent_management_group','report','game','bonus','design','setting','support'];
  const GROUP_BLURB={
    root:'Top-level pages and entry points',
    access:'Roles, menus, logs, and security gates',
    wallet:'Member funds, deposits, and payouts',
    agent_management_group:'Agent ops, commission, and settlement',
    report:'Operational and performance reports',
    game:'Providers, catalogues, and game ops',
    bonus:'Promotions, rebate, and VIP',
    design:'Site layout and creative surfaces',
    setting:'Frontend and compliance settings',
    support:'Live chat and support tools',
    main_reports_group:'MAIN executive reports',
    main_accounting_group:'Accounting and provider ops',
    main_brands_group:'Brand portfolio controls',
    main_admin_group:'MAIN administrator accounts and access'
  };
  let menuCache=[];
  let roleCache=[];
  let editingRoleType='';
  let mpBaselineIds=[];
  let mpWorkingIds=null; // Set<string> — full selection across Main/BO scopes
  let mpFilterQuery='';
  let mpScope='main'; // 'main' | 'bo'
  let mpOpenGroups=null; // null = all open (first render)
  const MAIN_GROUP_KEYS=new Set(['main_reports_group','main_accounting_group','main_brands_group','main_admin_group']);
  const GROUP_DESC=[
    [/dashboard|overview/i,'Core metrics, operational overviews & monitor charts'],
    [/admin/i,'Administrator accounts, roles & security gates'],
    [/access|permission|role/i,'System user profiles, menu endpoints, ACL & audit tracking'],
    [/business|operation/i,'Customer channels, providers, promotional banners & support'],
    [/account|settle|finance/i,'Provider balances, reconciliations & payout audit records'],
    [/report|analytic/i,'Aggregated transactional reports, Win/Lose figures & exports'],
    [/wallet/i,'Member funds, deposits, withdrawals & payment configuration'],
    [/agent/i,'Agent hierarchy, commission, settlement & payout'],
    [/game/i,'Providers, categories, game catalogue & effects'],
    [/bonus|promo/i,'Promotions, rebate programs & VIP tiers'],
    [/design|layout|site/i,'Site layout, sections & creative surfaces'],
    [/setting|config/i,'Frontend display, compliance & system settings'],
    [/support|chat/i,'Live chat rooms & template messages'],
    [/brand/i,'Brand portfolio, ownership & configuration']
  ];
  function pickByTitle(list,title,key){
    const hay=`${title||''} ${key||''}`;
    const hit=list.find(([re])=>re.test(hay));
    return hit?hit[1]:'';
  }
  function leadingNumber(title){
    const m=String(title||'').trim().match(/^(\d+)[.、\s]/);
    return m?m[1]:'';
  }
  const currentAdmin = (window.BO_AUTH && BO_AUTH.user) ? BO_AUTH.user() : {};
  const currentRoleType = String(currentAdmin?.roleType||'').toUpperCase();
  const mainAdmin = currentRoleType==='MAIN';
  // Role type is authoritative here. Do not let legacy/stale boolean flags make a MAIN
  // account behave like MASTER and expose protected platform roles.
  const rootAdmin = currentAdmin && !mainAdmin && (currentRoleType==='ROOT' || (Number(currentAdmin.id)===1 && currentAdmin.brandId==null));
  const masterAdmin = currentAdmin && !mainAdmin && !rootAdmin && currentRoleType==='MASTER';
  const platformRoleAdmin = currentAdmin && (rootAdmin || masterAdmin || mainAdmin || currentAdmin.brandId == null);
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
  function expandAdminMenuAliases(ids){
    // /auth/admin/create still authorizes on legacy menuKey `admin`.
    // MAIN Admin → Details (`main_admin_detail`) is the executive UI grant.
    // Keep both ids in sync whenever either is selected so create/list APIs work.
    const idSet=new Set((ids||[]).map(Number).filter(Number.isFinite));
    const byKey={};
    (menuCache||[]).forEach(function(m){
      const key=String(m.menuKey||'').toLowerCase();
      const id=Number(m.id);
      if(key && Number.isFinite(id)) byKey[key]=id;
    });
    const mainId=byKey.main_admin_detail||byKey.admin_detail;
    const adminId=byKey.admin;
    if(mainId && idSet.has(mainId) && adminId) idSet.add(adminId);
    if(adminId && idSet.has(adminId) && mainId) idSet.add(mainId);
    return Array.from(idSet);
  }

  function groupMenus(menus){
    const groups={};
    menus.forEach(m=>{const key=(m.parentKey||'').trim()||'root';(groups[key]||(groups[key]=[])).push(m);});
    Object.values(groups).forEach(rows=>rows.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||''))));
    return Object.keys(groups).sort((a,b)=>{const ai=GROUP_ORDER.indexOf(a),bi=GROUP_ORDER.indexOf(b);return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);}).map(key=>({key,rows:groups[key]}));
  }

  function isMainMenu(m){
    const parent=String((m&&m.parentKey)||'').trim().toLowerCase();
    const key=String((m&&m.menuKey)||'').trim().toLowerCase();
    const url=String((m&&m.url)||'').trim().toLowerCase().replace(/^\.\//,'');
    if(MAIN_GROUP_KEYS.has(parent) || parent.startsWith('main_')) return true;
    if(key.startsWith('main_') || key.startsWith('main-')) return true;
    if(/^main[-_]/.test(url) || url.startsWith('main-')) return true;
    return false;
  }
  function menusForScope(scope){
    const wantMain=String(scope||mpScope)==='main';
    return (menuCache||[]).filter(m=>isMainMenu(m)===wantMain);
  }
  function syncWorkingFromDom(){
    const roleOn=!!document.getElementById('menuPermissionRoleId')?.value;
    if(!roleOn){ mpWorkingIds=null; return; }
    if(!(mpWorkingIds instanceof Set)) mpWorkingIds=new Set();
    document.querySelectorAll('#menuPermissionCheckList .mp-menu-card input').forEach(input=>{
      const id=String(input.value);
      if(input.checked) mpWorkingIds.add(id);
      else mpWorkingIds.delete(id);
    });
  }
  function currentSelectionIds(){
    syncWorkingFromDom();
    return [...(mpWorkingIds instanceof Set ? mpWorkingIds : [])].map(Number).filter(Number.isFinite);
  }
  function setMpScope(scope){
    const next=scope==='bo'?'bo':'main';
    if(next===mpScope) return;
    syncWorkingFromDom();
    mpScope=next;
    document.querySelectorAll('[data-mp-scope]').forEach(btn=>{
      const on=btn.getAttribute('data-mp-scope')===mpScope;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    mpOpenGroups=null;
    const roleOn=!!document.getElementById('menuPermissionRoleId')?.value;
    const ids=roleOn ? currentSelectionIds() : (mpWorkingIds instanceof Set ? [...mpWorkingIds].map(Number) : []);
    renderMenuPermissionMatrix(ids);
    if(roleOn) document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=false);
    else document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=true);
  }

  function currentPageFile(){
    return String(location.pathname||'').split('/').pop().toLowerCase()||'';
  }
  function menuFile(m){
    return String((m&&m.url)||'').trim().replace(/^\.\//,'').split('/').pop().split('#')[0].toLowerCase();
  }
  function menuBadge(m){
    const file=menuFile(m);
    const key=String((m&&m.menuKey)||'').toLowerCase();
    const url=String((m&&m.url)||'').toLowerCase();
    if(file && file===currentPageFile()) return {text:'CURRENT',cls:'is-current'};
    if(/root|master|super/.test(key)||/root-control/.test(url)) return {text:'SUPER',cls:'is-super'};
    if(/^role$|role_|roles/.test(key)) return {text:'ROLES',cls:'is-roles'};
    if(/log|audit|lock|whitelist/.test(key)) return {text:'AUDIT',cls:'is-audit'};
    if(/permission|access|admin_user|^admin$/.test(key)) return {text:'AUTH',cls:'is-auth'};
    if(/live_chat|livechat_room|^livechat$/.test(key)) return {text:'OP',cls:'is-op'};
    if(/online|realtime|real_time|main-dashboard/.test(key+url)) return {text:'LIVE',cls:'is-live'};
    if(/slider|banner|image|template|layout|section/.test(key)) return {text:'WRITE',cls:'is-write'};
    if(/report|dashboard|overview|stat|history|log/.test(key)) return {text:'GET',cls:'is-get'};
    if(/setting|config|customize|display|brand|timezone|social|compliance/.test(key)) return {text:'CONFIG',cls:'is-config'};
    return {text:'CRUD',cls:'is-crud'};
  }
  function groupMeta(key){
    const live=(window.BO_MENU_GROUP_META&&window.BO_MENU_GROUP_META[key])||{};
    const fallback=GROUP_META[key]||{};
    const title=live.title||fallback.title||String(key||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    return {
      title,
      icon:live.icon||fallback.icon||'bi-folder2-open',
      blurb:pickByTitle(GROUP_DESC,title,key)||GROUP_BLURB[key]||'Sidebar category menus',
      num:leadingNumber(title)
    };
  }

  function renderPermissionGroupsInto(boxId,selected){
    const box=document.getElementById(boxId); if(!box)return;
    if(boxId==='menuPermissionCheckList'){
      renderMenuPermissionMatrix(selected);
      return;
    }
    const set=new Set((selected||[]).map(String));
    // Always render the complete active Menu Management catalogue for every editable role.
    // ROOT decides the permission assignment; role type must not silently hide menu choices.
    const visibleMenus=menuCache;
    box.innerHTML=groupMenus(visibleMenus).map(g=>{
      const meta=groupMeta(g.key);
      return `<section class="permission-group" data-permission-group="${esc(g.key)}">
        <div class="permission-group-head"><div class="permission-group-title"><i class="bi ${esc(meta.icon)}"></i><span>${esc(meta.title)}</span></div><label class="permission-group-toggle"><input type="checkbox" data-group-toggle="${esc(g.key)}"> Select group</label></div>
        <div class="permission-menu-grid">${g.rows.map(m=>`<label class="permission-item"><input type="checkbox" value="${esc(m.id)}" ${set.has(String(m.id))?'checked':''}><span><b><i class="bi ${esc(m.icon||'bi-circle')} me-1"></i>${esc(m.title)}</b><small>${esc(m.url)}${m.parentKey?' / '+esc(m.parentKey):''}</small></span></label>`).join('')}</div>
      </section>`;
    }).join('')||'<div class="permission-empty">No active menu found.</div>';
    syncGroupToggles();
  }

  function renderMenuPermissionMatrix(selected){
    const box=document.getElementById('menuPermissionCheckList'); if(!box)return;
    const set=new Set((selected||[]).map(String));
    if(document.getElementById('menuPermissionRoleId')?.value){
      mpWorkingIds=new Set(set);
    }
    const q=String(mpFilterQuery||'').trim().toLowerCase();
    const scoped=menusForScope(mpScope);
    const groups=groupMenus(scoped).map(g=>{
      const rows=q?g.rows.filter(m=>{
        const hay=`${m.title||''} ${m.url||''} ${m.menuKey||''} ${m.parentKey||''}`.toLowerCase();
        return hay.includes(q);
      }):g.rows.slice();
      return {...g,rows};
    }).filter(g=>g.rows.length);
    if(!groups.length){
      const emptyMsg=q
        ? 'No menus match this filter.'
        : (mpScope==='main' ? 'No Main menus found.' : 'No BO menus found.');
      box.innerHTML=`<div class="permission-empty">${emptyMsg}</div>`;
      syncGroupToggles();
      updateMenuPermissionChrome();
      return;
    }
    if(mpOpenGroups===null){
      mpOpenGroups=new Set();
    }
    box.innerHTML=groups.map(g=>{
      const meta=groupMeta(g.key);
      const checked=g.rows.filter(m=>set.has(String(m.id))).length;
      const open=!!q || mpOpenGroups.has(g.key);
      return `<section class="mp-group${open?' is-open':''}" data-permission-group="${esc(g.key)}">
        <div class="mp-group-head">
          <button type="button" class="mp-group-toggle" data-mp-accordion aria-expanded="${open?'true':'false'}">
            <i class="bi bi-chevron-down mp-chevron" aria-hidden="true"></i>
            <span class="mp-group-icon"><i class="bi ${esc(meta.icon)}"></i></span>
            <span class="mp-group-copy">
              <strong>${esc(meta.title)}</strong>
              <small>${esc(meta.blurb)}</small>
            </span>
          </button>
          <div class="mp-group-side">
            <span class="mp-group-count" data-group-count>${checked} / ${g.rows.length} Selected</span>
            <label class="mp-group-select"><input type="checkbox" data-group-toggle="${esc(g.key)}"><span>Select Group</span></label>
          </div>
        </div>
        <div class="mp-group-body" ${open?'':'hidden'}>
          <div class="mp-menu-grid">${g.rows.map((m,i)=>{
            const badge=menuBadge(m);
            const on=set.has(String(m.id));
            const isCurrent=badge.cls==='is-current';
            const rawTitle=String(m.title||'');
            const numbered=meta.num && !/^\d+(\.\d+)?[.\s]/.test(rawTitle) ? `${meta.num}.${i+1} ${rawTitle}` : rawTitle;
            return `<label class="mp-menu-card${on?' is-checked':''}${isCurrent?' is-current':''}">
              <input type="checkbox" value="${esc(m.id)}" ${on?'checked':''}>
              <span class="mp-menu-card-main">
                <b>${esc(numbered)}</b>
                <small>/${esc(String(m.url||'').replace(/^\.?\//,''))}</small>
              </span>
              <em class="mp-menu-badge ${badge.cls}">${esc(badge.text)}</em>
            </label>`;
          }).join('')}</div>
        </div>
      </section>`;
    }).join('');
    syncGroupToggles();
    updateMenuPermissionChrome();
  }

  function renderPermissionGroups(selected){renderPermissionGroupsInto('checkList',selected);}
  function syncGroupToggles(){
    document.querySelectorAll('[data-permission-group]').forEach(group=>{
      const items=[...group.querySelectorAll('.permission-item input, .mp-menu-card input')];
      const toggle=group.querySelector('[data-group-toggle]');
      if(!toggle)return;
      const checked=items.filter(x=>x.checked).length;
      toggle.checked=items.length>0&&checked===items.length;
      toggle.indeterminate=checked>0&&checked<items.length;
      const count=group.querySelector('[data-group-count]');
      if(count) count.textContent=`${checked} / ${items.length} Selected`;
      items.forEach(input=>{
        const card=input.closest('.mp-menu-card');
        if(card) card.classList.toggle('is-checked',input.checked);
      });
    });
  }

  function selectedMenuPermissionIds(){
    return currentSelectionIds();
  }
  function idsEqual(a,b){
    const aa=[...a].map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
    const bb=[...b].map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
    return aa.length===bb.length&&aa.every((v,i)=>v===bb[i]);
  }
  function dirtyCount(){
    const now=new Set(currentSelectionIds().map(String));
    const base=new Set(mpBaselineIds.map(String));
    let n=0;
    now.forEach(id=>{if(!base.has(id)) n++;});
    base.forEach(id=>{if(!now.has(id)) n++;});
    return n;
  }
  function setMenuPermissionControlsEnabled(on){
    ['menuPermissionFilter','menuPermissionToggleAll','menuPermissionSelectAll','menuPermissionClearAll']
      .forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!on;});
    // Main / BO scope stays clickable so users can browse either catalogue before selecting a role.
  }
  function roleOptionLabel(role,selected){
    const name=String(role?.name||role?.code||'Role').trim();
    return selected?`${name} (Selected)`:name;
  }
  function syncRoleSelectLabels(selectedId){
    const select=document.getElementById('menuPermissionRoleSelect');
    if(!select) return;
    [...select.options].forEach(opt=>{
      if(!opt.value){opt.textContent='Select role...';return;}
      const role=roleCache.find(r=>String(r.id)===String(opt.value));
      if(!role) return;
      opt.textContent=roleOptionLabel(role,String(opt.value)===String(selectedId||''));
    });
  }
  function updateScopeCounts(){
    const mainEl=document.getElementById('menuPermissionScopeMainCount');
    const boEl=document.getElementById('menuPermissionScopeBoCount');
    if(mainEl) mainEl.textContent=String(menusForScope('main').length);
    if(boEl) boEl.textContent=String(menusForScope('bo').length);
  }
  function updateMenuPermissionChrome(){
    const roleId=document.getElementById('menuPermissionRoleId')?.value||'';
    const role=roleCache.find(r=>String(r.id)===String(roleId));
    const total=menuCache.length;
    const assigned=roleId ? currentSelectionIds().length : 0;
    const pill=document.getElementById('menuPermissionAssignedPill');
    const pillText=document.getElementById('menuPermissionAssignedText');
    const footer=document.getElementById('menuPermissionFooter');
    const footerRole=document.getElementById('menuPermissionFooterRole');
    const footerDirty=document.getElementById('menuPermissionFooterDirty');
    const reset=document.getElementById('menuPermissionResetBtn');
    const save=document.getElementById('saveMenuPermissionBtn');
    syncRoleSelectLabels(roleId);
    updateScopeCounts();
    if(pill&&pillText){
      if(roleId){
        pill.hidden=false;
        const mainCount=menusForScope('main').filter(m=>mpWorkingIds&&mpWorkingIds.has(String(m.id))).length;
        const boCount=menusForScope('bo').filter(m=>mpWorkingIds&&mpWorkingIds.has(String(m.id))).length;
        pillText.textContent=`Assigned: ${assigned} / ${total} Menus · Main ${mainCount} · BO ${boCount}`;
      }else{
        pill.hidden=true;
      }
    }
    if(footer){
      footer.hidden=!roleId;
      document.body.classList.toggle('mp-footer-visible',!!roleId);
      if(footerRole) footerRole.textContent=roleId?(role?.name||role?.code||'Role'):'—';
      const dirty=roleId?dirtyCount():0;
      if(footerDirty){
        footerDirty.textContent=dirty?`${dirty} change${dirty===1?'':'s'} pending verification`:'No pending changes';
        footerDirty.classList.toggle('is-dirty',dirty>0);
      }
      if(reset) reset.disabled=!dirty;
      if(save) save.disabled=!roleId;
    }
  }
  function setGroupOpen(group,open){
    if(!group) return;
    const key=group.getAttribute('data-permission-group');
    group.classList.toggle('is-open',open);
    const btn=group.querySelector('[data-mp-accordion]');if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
    const body=group.querySelector('.mp-group-body');if(body)body.hidden=!open;
    if(open) mpOpenGroups.add(key); else mpOpenGroups.delete(key);
  }
  function slugify(name){return String(name||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('group_'+Date.now());}

  function openModal(){const m=document.getElementById('roleCreateModal');m?.classList.add('show');document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('name')?.focus(),50);}
  function closeModal(){const m=document.getElementById('roleCreateModal');m?.classList.remove('show');document.body.classList.remove('modal-open');msg(roleStatusEl,'','');}
  function resetModal(){
    document.getElementById('accessForm')?.reset();
    document.getElementById('roleEditId').value='';
    document.getElementById('roleEditCode').value='';
    const title=document.getElementById('roleModalTitle');
    const sub=document.getElementById('roleModalSubtitle');
    if(title) title.textContent=page==='menu-permission'?'Add Role':'Add Permission Group';
    if(sub) sub.textContent=page==='menu-permission'
      ?'Enter a role name and select its menu permissions.'
      :'Enter a group name and select its menu permissions.';
    renderPermissionGroups([]);
    msg(roleStatusEl,'','');
  }
  async function openCreate(){editingRoleType='';resetModal();openModal();}
  async function openEdit(roleId){
    const role=roleCache.find(r=>String(r.id)===String(roleId)); if(!role)return;
    editingRoleType=String(role.roleType||'').toUpperCase();
    const systemRole = Number(role.systemRole)===1;
    const roleType = String(role.roleType||'').toUpperCase();
    const editableSystemRole = systemRole && ((rootAdmin && roleType!=='ROOT') || (masterAdmin && roleType==='BRAND_OWNER') || (mainAdmin && (roleType==='MASTER' || roleType==='MAIN')));
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
      body.innerHTML=details.map(r=>{const rt=String(r.roleType||'').toUpperCase();const sys=Number(r.systemRole)===1;const canEditSystem=sys&&((rootAdmin&&rt!=='ROOT')||(masterAdmin&&rt==='BRAND_OWNER')||(mainAdmin&&(rt==='MASTER'||rt==='MAIN')));const action=sys?(canEditSystem?'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-sliders"></i> Edit Access</button>':'<span class="status-pill active">Protected</span>'):'<button class="clean-btn role-edit-btn" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> Edit</button>';return `<tr><td><b>${esc(r.name)}</b></td><td><span class="role-code-pill">${esc(r.code)}</span><small style="display:block;margin-top:4px;color:#667085">${esc(r.roleType||'CUSTOM')}</small></td><td><span class="role-permission-count"><i class="bi bi-shield-check"></i>${r.permissionCount} Menu${r.permissionCount===1?'':'s'}</span></td><td>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td>${action}</td></tr>`;}).join('')||'<tr><td colspan="5">No permission group found.</td></tr>';
      if(cards)cards.innerHTML=details.map(r=>{const rt=String(r.roleType||'').toUpperCase();const sys=Number(r.systemRole)===1;const canEditSystem=sys&&((rootAdmin&&rt!=='ROOT')||(masterAdmin&&rt==='BRAND_OWNER')||(mainAdmin&&(rt==='MASTER'||rt==='MAIN')));const action=sys?(canEditSystem?'<button class="clean-btn role-edit-btn w-100" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-sliders"></i> Edit Access</button>':'<span class="status-pill active">Protected</span>'):'<button class="clean-btn role-edit-btn w-100" type="button" data-edit-role="'+esc(r.id)+'"><i class="bi bi-pencil-square"></i> Edit Group</button>';return `<article class="member-mobile-card role-mobile-card"><div class="member-card-head"><div><strong>${esc(r.name)}</strong><small>${esc(r.code)}</small></div>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</div><div class="member-card-grid"><div><span>Permissions</span><b>${r.permissionCount} Menus</b></div></div>${action}</article>`;}).join('');
    }catch(e){body.innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`;if(cards)cards.innerHTML='';}
  }

  function canEditRoleMenus(role){
    const rt=String(role?.roleType||'').toUpperCase();
    const sys=Number(role?.systemRole)===1;
    if(!sys)return true;
    if(rootAdmin)return rt!=='ROOT';
    if(masterAdmin)return rt==='BRAND_OWNER';
    // If ROOT granted Menu Permission to MAIN/Boss, MAIN may manage the MASTER
    // menu access as well as its own MAIN role. ROOT and BRAND_OWNER stay protected.
    const currentRoleId=Number(currentAdmin?.roleId||currentAdmin?.adminRoleId||0);
    if(mainAdmin){
      if(rt==='MASTER') return true;
      return rt==='MAIN' && (!currentRoleId || Number(role?.id)===currentRoleId);
    }
    return false;
  }

  async function loadMenuPermissionWorkspace(){
    const select=document.getElementById('menuPermissionRoleSelect');
    const list=document.getElementById('menuPermissionCheckList');
    if(!select||!list)return;
    try{
      roleCache=await fetchRoles();
      const editable=roleCache.filter(r=>{
        const rt=String(r?.roleType||'').toUpperCase();
        const sys=Number(r?.systemRole)===1;
        if(mainAdmin && sys && rt!=='MAIN' && rt!=='MASTER') return false;
        return canEditRoleMenus(r);
      });
      select.innerHTML='<option value="">Select role...</option>'+editable.map(r=>`<option value="${esc(r.id)}">${esc(roleOptionLabel(r,false))}</option>`).join('');
      mpBaselineIds=[];
      mpWorkingIds=null;
      mpFilterQuery='';
      mpScope='main';
      document.querySelectorAll('[data-mp-scope]').forEach(btn=>{
        const on=btn.getAttribute('data-mp-scope')==='main';
        btn.classList.toggle('is-active',on);
        btn.setAttribute('aria-selected',on?'true':'false');
      });
      const filter=document.getElementById('menuPermissionFilter');if(filter)filter.value='';
      renderMenuPermissionMatrix([]);
      document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=true);
      setMenuPermissionControlsEnabled(false);
      updateMenuPermissionChrome();
      const hint=document.getElementById('menuPermissionRoleHint');
      if(hint)hint.textContent=editable.length?'Select a role to load its assigned menus.':'No editable permission group is available for this account.';
      let preselect='';
      try{ preselect=String(new URLSearchParams(location.search||'').get('roleId')||''); }catch(e){}
      if(preselect && editable.some(r=>String(r.id)===preselect)){
        select.value=preselect;
        await loadSelectedMenuPermissionRole(preselect);
        try{ history.replaceState({},'', 'menu-permission.html'); }catch(e){}
      }
    }catch(e){msg(document.getElementById('menuPermissionStatus'),e.message,'error');}
  }

  async function loadSelectedMenuPermissionRole(roleId){
    const status=document.getElementById('menuPermissionStatus');
    const hidden=document.getElementById('menuPermissionRoleId');
    if(hidden)hidden.value=roleId||'';
    if(!roleId){
      mpBaselineIds=[];
      mpWorkingIds=null;
      mpFilterQuery='';
      const filter=document.getElementById('menuPermissionFilter');if(filter)filter.value='';
      renderMenuPermissionMatrix([]);
      document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=true);
      setMenuPermissionControlsEnabled(false);
      updateMenuPermissionChrome();
      msg(status,'','');
      return;
    }
    const role=roleCache.find(r=>String(r.id)===String(roleId));
    if(!role||!canEditRoleMenus(role)){msg(status,'This role is protected.','error');return;}
    msg(status,'Loading menu permissions...','');
    try{
      const selected=await fetchRoleMenuIds(role.id);
      mpBaselineIds=selected.map(Number).filter(Number.isFinite);
      mpWorkingIds=new Set(mpBaselineIds.map(String));
      mpOpenGroups=null;
      renderMenuPermissionMatrix(mpBaselineIds);
      document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=false);
      setMenuPermissionControlsEnabled(true);
      updateMenuPermissionChrome();
      msg(status,'','');
    }catch(e){msg(status,e.message,'error');}
  }

  function resetMenuPermissionChanges(){
    mpWorkingIds=new Set(mpBaselineIds.map(String));
    renderMenuPermissionMatrix(mpBaselineIds);
    document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=false);
    updateMenuPermissionChrome();
    msg(document.getElementById('menuPermissionStatus'),'Changes discarded.','');
  }

  async function saveMenuPermissions(e){
    e.preventDefault();
    const roleId=document.getElementById('menuPermissionRoleId').value;
    const status=document.getElementById('menuPermissionStatus');
    const btn=document.getElementById('saveMenuPermissionBtn');
    const ids=expandAdminMenuAliases(currentSelectionIds());
    if(!roleId){msg(status,'Please select a role.','error');return;}
    btn.disabled=true;msg(status,'Saving menu permissions...','');
    try{
      const saved=await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      const persisted=(saved.data?.menuIds||[]).map(Number).filter(Number.isFinite);
      const persistedSet=new Set(persisted);
      const missing=ids.filter(id=>!persistedSet.has(id));
      if(missing.length)throw new Error('Some selected menu permissions were rejected by the API.');
      mpBaselineIds=persisted;
      mpWorkingIds=new Set(persisted.map(String));
      renderMenuPermissionMatrix(persisted);
      document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=false);
      updateMenuPermissionChrome();
      msg(status,'Menu permissions saved successfully.','success');
    }catch(err){msg(status,String(err?.message||'Unable to save menu permissions.'),'error');}
    finally{btn.disabled=false;updateMenuPermissionChrome();}
  }

  async function saveRole(e){
    e.preventDefault();
    const btn=document.getElementById('saveRoleBtn'), name=document.getElementById('name').value.trim(), editId=document.getElementById('roleEditId').value, oldCode=document.getElementById('roleEditCode').value;
    const ids=expandAdminMenuAliases([...document.querySelectorAll('#checkList .permission-item input:checked')].map(x=>Number(x.value)));
    if(!name){msg(roleStatusEl,'Group name is required.','error');return;}
    if(!ids.length){msg(roleStatusEl,'Please select at least one menu permission.','error');return;}
    btn.disabled=true;msg(roleStatusEl,'Saving group and permissions...','');
    try{
      const payload={name,code:editId?(oldCode||slugify(name)):slugify(name),remark:'',status:1};if(editId)payload.id=Number(editId);
      const editingRole=editId?roleCache.find(r=>String(r.id)===String(editId)):null;
      const protectedSystemEdit=!!(editingRole&&Number(editingRole.systemRole)===1);
      let roleId=editId;
      // System Role Access changes menu mappings only. Never rewrite protected role metadata
      // (name/code/type/status) just to update its permissions.
      if(!protectedSystemEdit){
        const saved=await api(BO_AUTH.roleSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});
        roleId=saved.data?.id||editId;
        if(!roleId){const roles=await fetchRoles();roleId=roles.find(r=>r.code===payload.code)?.id;}
      }
      if(!roleId)throw new Error('Role saved but role ID was not returned.');
      const menuSave=await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      const persisted=(menuSave.data?.menuIds||[]).map(Number).filter(Number.isFinite);
      const requestedSet=new Set(ids.map(Number));
      const persistedSet=new Set(persisted);
      const missing=[...requestedSet].filter(id=>!persistedSet.has(id));
      if(missing.length){
        throw new Error('Some selected MAIN menu permissions were rejected by the API. Please deploy the matching Spring Boot permission fix and save again.');
      }
      msg(roleStatusEl,editId?'Group updated successfully.':'Group created successfully.','success');
      if(page==='menu-permission'){
        await loadMenuPermissionWorkspace();
        const select=document.getElementById('menuPermissionRoleSelect');
        if(select && roleId){
          select.value=String(roleId);
          await loadSelectedMenuPermissionRole(String(roleId));
        }
      }else{
        await loadRoleList();
      }
      setTimeout(closeModal,500);
    }catch(err){
      const raw=String(err?.message||'Unable to save the permission group.');
      const friendly=/duplicate entry|constraint|could not execute statement|sql \[/i.test(raw)
        ? 'Unable to update permissions. Please refresh and try again.'
        : raw;
      msg(roleStatusEl,friendly,'error');
    }finally{btn.disabled=false;}
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-group-toggle]')){
      const group=e.target.closest('[data-permission-group]');
      group.querySelectorAll('.permission-item input, .mp-menu-card input').forEach(x=>x.checked=e.target.checked);
      syncGroupToggles();
      if(document.body.dataset.accessPage==='menu-permission'){
        syncWorkingFromDom();
        updateMenuPermissionChrome();
      }
    }
    if(e.target.matches('.permission-item input, .mp-menu-card input')){
      syncGroupToggles();
      if(document.body.dataset.accessPage==='menu-permission'){
        syncWorkingFromDom();
        updateMenuPermissionChrome();
      }
    }
  });
  document.addEventListener('click',e=>{
    if(e.target.closest('#openRoleModalBtn'))openCreate();
    const edit=e.target.closest('[data-edit-role]');if(edit)openEdit(edit.dataset.editRole);
    if(e.target.closest('[data-close-role-modal]'))closeModal();
    if(e.target.id==='roleCreateModal')closeModal();
    const accordion=e.target.closest('[data-mp-accordion]');
    if(accordion){
      const group=accordion.closest('.mp-group');
      if(group) setGroupOpen(group,!group.classList.contains('is-open'));
    }
  });
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(document.getElementById('roleCreateModal')?.classList.contains('show'))closeModal();});
  document.addEventListener('DOMContentLoaded',async()=>{
    await bootstrap();
    if(page==='role'){
      try{menuCache=await fetchMenus();renderPermissionGroups([]);await loadRoleList();}catch(e){msg(roleStatusEl,e.message,'error');}
      document.getElementById('accessForm').onsubmit=saveRole;
      document.getElementById('selectAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=true);syncGroupToggles();};
      document.getElementById('clearAllPermission').onclick=()=>{document.querySelectorAll('#checkList .permission-item input').forEach(x=>x.checked=false);syncGroupToggles();};
    }
    if(page==='menu-permission'){
      try{menuCache=await fetchMenus();await loadMenuPermissionWorkspace();}catch(e){msg(document.getElementById('menuPermissionStatus'),e.message,'error');}
      const form=document.getElementById('menuPermissionForm');if(form)form.onsubmit=saveMenuPermissions;
      const select=document.getElementById('menuPermissionRoleSelect');if(select)select.onchange=()=>loadSelectedMenuPermissionRole(select.value);
      const filter=document.getElementById('menuPermissionFilter');
      if(filter){
        filter.addEventListener('input',()=>{
          syncWorkingFromDom();
          mpFilterQuery=filter.value||'';
          const roleOn=!!document.getElementById('menuPermissionRoleId')?.value;
          renderMenuPermissionMatrix(roleOn ? currentSelectionIds() : []);
          if(roleOn) document.querySelectorAll('#menuPermissionCheckList input').forEach(x=>x.disabled=false);
        });
      }
      document.querySelectorAll('[data-mp-scope]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          if(btn.disabled) return;
          setMpScope(btn.getAttribute('data-mp-scope')||'main');
        });
      });
      document.getElementById('menuPermissionToggleAll')?.addEventListener('click',()=>{
        const groups=[...document.querySelectorAll('#menuPermissionCheckList .mp-group')];
        const openCount=groups.filter(g=>g.classList.contains('is-open')).length;
        const makeOpen=openCount < groups.length/2;
        groups.forEach(g=>setGroupOpen(g,makeOpen));
      });
      document.getElementById('menuPermissionSelectAll')?.addEventListener('click',()=>{
        document.querySelectorAll('#menuPermissionCheckList .mp-menu-card input:not(:disabled)').forEach(x=>x.checked=true);
        syncGroupToggles();syncWorkingFromDom();updateMenuPermissionChrome();
      });
      document.getElementById('menuPermissionClearAll')?.addEventListener('click',()=>{
        document.querySelectorAll('#menuPermissionCheckList .mp-menu-card input:not(:disabled)').forEach(x=>x.checked=false);
        syncGroupToggles();syncWorkingFromDom();updateMenuPermissionChrome();
      });
      document.getElementById('menuPermissionResetBtn')?.addEventListener('click',resetMenuPermissionChanges);
    }
    if(page==='account-lock')loadAccountLock();
  });

  async function loadAccountLock(){const body=document.getElementById('lockTableBody');try{const rows=(await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}})).data||[];body.innerHTML=rows.map(m=>`<tr><td><b>${esc(m.username)}</b><br><small>${esc(m.fullName||m.mobile)}</small></td><td>${m.locked==1?'<span class="status-pill off">Locked</span>':'<span class="status-pill active">Normal</span>'}</td><td><button class="clean-btn" data-lock-id="${m.id}" data-lock="${m.locked==1?0:1}">${m.locked==1?'Unlock':'Lock'}</button></td></tr>`).join('')||'<tr><td colspan="3">No member.</td></tr>';}catch(e){body.innerHTML='<tr><td colspan="3">'+esc(e.message)+'</td></tr>';}}
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-lock-id]');if(!b)return;await api(BO_AUTH.memberUpdateUrl(b.dataset.lockId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})});loadAccountLock();});
})();
