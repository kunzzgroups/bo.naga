(function(){
  'use strict';

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
  const MAIN_GROUP_KEYS=new Set(['main_reports_group','main_accounting_group','main_brands_group','main_admin_group']);

  let menuCache=[];
  let selectedIds=new Set();
  let scope='bo';
  let filterQuery='';
  let openGroups=new Set();

  const listEl=document.getElementById('mrcCheckList');
  const nameEl=document.getElementById('mrcRoleName');
  const statusEl=document.getElementById('mrcStatus');
  const formEl=document.getElementById('mrcForm');

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function msg(text,cls){if(statusEl){statusEl.textContent=text||'';statusEl.className='upload-status mt-3 '+(cls||'');}}
  async function api(url,opt){const res=await fetch(url,opt||{});const j=await res.json().catch(()=>({}));if(!res.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  function slugify(name){return String(name||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||('role_'+Date.now());}

  function isMainMenu(m){
    const parent=String((m&&m.parentKey)||'').trim().toLowerCase();
    const key=String((m&&m.menuKey)||'').trim().toLowerCase();
    const url=String((m&&m.url)||'').trim().toLowerCase().replace(/^\.\//,'');
    if(MAIN_GROUP_KEYS.has(parent)||parent.startsWith('main_')) return true;
    if(key.startsWith('main_')||key.startsWith('main-')) return true;
    if(/^main[-_]/.test(url)||url.startsWith('main-')) return true;
    return false;
  }
  function menusForScope(s){
    const wantMain=String(s||scope)==='main';
    return (menuCache||[]).filter(m=>isMainMenu(m)===wantMain);
  }
  function groupMenus(menus){
    const groups={};
    menus.forEach(m=>{const key=(m.parentKey||'').trim()||'root';(groups[key]||(groups[key]=[])).push(m);});
    Object.values(groups).forEach(rows=>rows.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||''))));
    return Object.keys(groups).sort((a,b)=>{
      const ai=GROUP_ORDER.indexOf(a),bi=GROUP_ORDER.indexOf(b);
      return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);
    }).map(key=>({key,rows:groups[key]}));
  }
  function groupMeta(key){
    const live=(window.BO_MENU_GROUP_META&&window.BO_MENU_GROUP_META[key])||{};
    const fallback=GROUP_META[key]||{};
    const title=live.title||fallback.title||String(key||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    return {
      title,
      icon:live.icon||fallback.icon||'bi-folder2-open',
      blurb:GROUP_BLURB[key]||'Sidebar category menus'
    };
  }
  function menuFile(m){
    return String((m&&m.url)||'').trim().replace(/^\.\//,'').split('/').pop().split('#')[0].toLowerCase();
  }
  function menuBadge(m){
    const key=String((m&&m.menuKey)||'').toLowerCase();
    const url=String((m&&m.url)||'').toLowerCase();
    if(/root|master|super/.test(key)||/root-control/.test(url)) return {text:'ROOT',cls:'is-super'};
    if(/log|audit|lock|whitelist/.test(key)) return {text:'AUDIT',cls:'is-audit'};
    if(/permission|access|admin_user|^admin$/.test(key)) return {text:'AUTH',cls:'is-auth'};
    if(/report|dashboard|overview|stat|history/.test(key+url)) return {text:'GET',cls:'is-get'};
    if(/setting|config|customize|display|brand|timezone|social|compliance/.test(key)) return {text:'CONFIG',cls:'is-config'};
    return {text:'CRUD',cls:'is-crud'};
  }
  function leadingNumber(title){
    const m=String(title||'').trim().match(/^(\d+)[.、\s]/);
    return m?m[1]:'';
  }

  function expandAdminAliases(ids){
    const idSet=new Set((ids||[]).map(Number).filter(Number.isFinite));
    const byKey={};
    (menuCache||[]).forEach(function(m){
      const key=String(m.menuKey||'').toLowerCase();
      const id=Number(m.id);
      if(key&&Number.isFinite(id)) byKey[key]=id;
    });
    const mainId=byKey.main_admin_detail||byKey.admin_detail;
    const adminId=byKey.admin;
    if(mainId&&idSet.has(mainId)&&adminId) idSet.add(adminId);
    if(adminId&&idSet.has(adminId)&&mainId) idSet.add(mainId);
    return Array.from(idSet);
  }

  function updateScopeCounts(){
    const mainEl=document.getElementById('mrcScopeMainCount');
    const boEl=document.getElementById('mrcScopeBoCount');
    if(mainEl) mainEl.textContent=String(menusForScope('main').length);
    if(boEl) boEl.textContent=String(menusForScope('bo').length);
  }

  function updateChrome(){
    const scoped=menusForScope(scope);
    const total=scoped.length;
    const selected=scoped.filter(m=>selectedIds.has(String(m.id))).length;
    const pill=document.getElementById('mrcSelectedPill');
    if(pill) pill.textContent=selected+' / '+total+' Selected';

    const name=(nameEl&&nameEl.value.trim())||'Untitled Role';
    const footerName=document.getElementById('mrcFooterName');
    const ready=document.getElementById('mrcReadyBadge');
    const hint=document.getElementById('mrcFooterHint');
    if(footerName) footerName.textContent=name;
    const ok=!!(nameEl&&nameEl.value.trim())&&selected>0;
    if(ready){
      ready.textContent=ok?'READY TO SAVE':'DRAFT';
      ready.classList.toggle('is-ready',ok);
    }
    if(hint){
      hint.textContent=ok
        ?('Configured with '+selected+' permission'+(selected===1?'':'s')+' assigned.')
        :'Configure a role name and permissions to continue.';
    }
    updateScopeCounts();
  }

  function visibleGroups(){
    const scoped=menusForScope(scope);
    const q=String(filterQuery||'').trim().toLowerCase();
    return groupMenus(scoped).map(g=>{
      let rows=g.rows.slice();
      if(q){
        rows=rows.filter(m=>{
          const hay=`${m.title||''} ${m.url||''} ${m.menuKey||''} ${m.parentKey||''}`.toLowerCase();
          return hay.includes(q);
        });
      }
      return {...g,rows};
    }).filter(g=>g.rows.length);
  }

  function syncGroupToggles(){
    document.querySelectorAll('#mrcCheckList [data-permission-group]').forEach(group=>{
      const items=[...group.querySelectorAll('.mp-menu-card input')];
      const toggle=group.querySelector('[data-group-toggle]');
      if(!toggle) return;
      const checked=items.filter(x=>x.checked).length;
      toggle.checked=items.length>0&&checked===items.length;
      toggle.indeterminate=checked>0&&checked<items.length;
      const count=group.querySelector('[data-group-count]');
      if(count) count.textContent=checked+' / '+items.length+' Selected';
      items.forEach(input=>{
        const card=input.closest('.mp-menu-card');
        if(card) card.classList.toggle('is-checked',input.checked);
      });
    });
  }

  function renderMatrix(){
    if(!listEl) return;
    const groups=visibleGroups();
    if(!groups.length){
      listEl.innerHTML='<div class="permission-empty">'+(filterQuery?'No menus match this filter.':(scope==='main'?'No Main menus found.':'No BO menus found.'))+'</div>';
      updateChrome();
      return;
    }
    listEl.innerHTML=groups.map(g=>{
      const meta=groupMeta(g.key);
      const checked=g.rows.filter(m=>selectedIds.has(String(m.id))).length;
      const open=openGroups.has(g.key)||!!filterQuery;
      const num=leadingNumber(meta.title);
      return '<section class="mp-group'+(open?' is-open':'')+'" data-permission-group="'+esc(g.key)+'">'+
        '<div class="mp-group-head">'+
          '<button type="button" class="mp-group-toggle" data-mrc-accordion aria-expanded="'+(open?'true':'false')+'">'+
            '<i class="bi bi-chevron-down mp-chevron" aria-hidden="true"></i>'+
            '<span class="mp-group-icon"><i class="bi '+esc(meta.icon)+'"></i></span>'+
            '<span class="mp-group-copy"><strong>'+esc(meta.title)+'</strong><small>'+esc(meta.blurb)+'</small></span>'+
          '</button>'+
          '<div class="mp-group-side">'+
            '<span class="mp-group-count" data-group-count>'+checked+' / '+g.rows.length+' Selected</span>'+
            '<label class="mp-group-select"><input type="checkbox" data-group-toggle="'+esc(g.key)+'"><span>Select Group</span></label>'+
          '</div>'+
        '</div>'+
        '<div class="mp-group-body" '+(open?'':'hidden')+'>'+
          '<div class="mp-menu-grid">'+g.rows.map((m,i)=>{
            const badge=menuBadge(m);
            const on=selectedIds.has(String(m.id));
            const rawTitle=String(m.title||'');
            const numbered=num&&!/^\d+(\.\d+)?[.\s]/.test(rawTitle)?(num+'.'+(i+1)+' '+rawTitle):rawTitle;
            return '<label class="mp-menu-card'+(on?' is-checked':'')+'">'+
              '<input type="checkbox" value="'+esc(m.id)+'" '+(on?'checked':'')+'>'+
              '<span class="mp-menu-card-main"><b>'+esc(numbered)+'</b><small>/'+esc(String(m.url||'').replace(/^\.?\//,''))+'</small></span>'+
              '<em class="mp-menu-badge '+badge.cls+'">'+esc(badge.text)+'</em>'+
            '</label>';
          }).join('')+'</div>'+
        '</div>'+
      '</section>';
    }).join('');
    syncGroupToggles();
    updateChrome();
  }

  function setScope(next){
    const s='bo';
    if(s===scope) return;
    scope=s;
    openGroups=new Set();
    document.querySelectorAll('[data-mrc-scope]').forEach(btn=>{
      const on=btn.getAttribute('data-mrc-scope')===scope;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    if(window.BO_SEG_BOUNCE) window.BO_SEG_BOUNCE.sync(document.getElementById('mrcScope'));
    if(!listEl){renderMatrix();return;}
    const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduceMotion){renderMatrix();return;}
    listEl.classList.remove('is-entering');
    listEl.classList.add('is-swapping');
    window.setTimeout(function(){
      renderMatrix();
      listEl.classList.remove('is-swapping');
      listEl.classList.add('is-entering');
      window.setTimeout(function(){listEl.classList.remove('is-entering');},320);
    },140);
  }

  function setGroupOpen(group,open){
    if(!group) return;
    const key=group.getAttribute('data-permission-group');
    group.classList.toggle('is-open',open);
    const btn=group.querySelector('[data-mrc-accordion]');
    if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
    const body=group.querySelector('.mp-group-body');
    if(body) body.hidden=!open;
    if(open) openGroups.add(key); else openGroups.delete(key);
  }

  async function loadMenus(){
    const user=BO_AUTH.user?BO_AUTH.user():{};
    const roleType=String(user.roleType||'').toUpperCase();
    const platform=roleType==='ROOT'||roleType==='MASTER'||roleType==='MAIN'||user.brandId==null;
    const url=platform&&BO_AUTH.menuListAllUrl?BO_AUTH.menuListAllUrl():BO_AUTH.menuListUrl();
    const j=await api(url,{headers:{...BO_AUTH.authHeader()}});
    menuCache=(j.data||[]).filter(m=>Number(m.status==null?1:m.status)===1);
  }

  async function saveRole(e){
    e.preventDefault();
    const name=(nameEl&&nameEl.value.trim())||'';
    const ids=expandAdminAliases([...selectedIds].map(Number));
    if(!name){msg('Role name is required.','error');nameEl&&nameEl.focus();return;}
    if(!ids.length){msg('Please select at least one menu permission.','error');return;}
    const top=null;
    const bottom=document.getElementById('mrcSaveBottom');
    [bottom].forEach(b=>{if(b)b.disabled=true;});
    msg('Saving role and permissions...','');
    try{
      const payload={name,code:slugify(name),remark:'',status:1};
      const saved=await api(BO_AUTH.roleSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});
      let roleId=saved.data?.id;
      if(!roleId){
        const roles=await api(BO_AUTH.roleListUrl(),{headers:{...BO_AUTH.authHeader()}});
        const rows=Array.isArray(roles.data)?roles.data:[];
        roleId=rows.find(r=>r.code===payload.code)?.id;
      }
      if(!roleId) throw new Error('Role saved but role ID was not returned.');
      const menuSave=await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})});
      const persisted=(menuSave.data?.menuIds||[]).map(Number).filter(Number.isFinite);
      const missing=ids.filter(id=>!new Set(persisted).has(id));
      if(missing.length) throw new Error('Some selected menu permissions were rejected by the API.');
      msg('Role created successfully.','success');
      setTimeout(function(){ location.href='main-merchant-roles.html?roleId='+encodeURIComponent(String(roleId)); },450);
    }catch(err){
      msg(String(err&&err.message||'Unable to save role.'),'error');
      [bottom].forEach(b=>{if(b)b.disabled=false;});
    }
  }

  document.addEventListener('change',function(e){
    if(e.target.matches('#mrcCheckList [data-group-toggle]')){
      const group=e.target.closest('[data-permission-group]');
      group.querySelectorAll('.mp-menu-card input').forEach(x=>{
        x.checked=e.target.checked;
        if(x.checked) selectedIds.add(String(x.value)); else selectedIds.delete(String(x.value));
      });
      syncGroupToggles();updateChrome();
    }
    if(e.target.matches('#mrcCheckList .mp-menu-card input')){
      const id=String(e.target.value);
      if(e.target.checked) selectedIds.add(id); else selectedIds.delete(id);
      syncGroupToggles();updateChrome();
    }
  });

  document.addEventListener('click',function(e){
    const accordion=e.target.closest('[data-mrc-accordion]');
    if(accordion){
      const group=accordion.closest('.mp-group');
      if(group) setGroupOpen(group,!group.classList.contains('is-open'));
    }
    const scopeBtn=e.target.closest('[data-mrc-scope]');
    if(scopeBtn) setScope(scopeBtn.getAttribute('data-mrc-scope')||'main');
  });

  document.getElementById('mrcSelectAll')?.addEventListener('click',function(){
    menusForScope(scope).forEach(m=>selectedIds.add(String(m.id)));
    renderMatrix();
  });
  document.getElementById('mrcDeselectAll')?.addEventListener('click',function(){
    menusForScope(scope).forEach(m=>selectedIds.delete(String(m.id)));
    renderMatrix();
  });
  document.getElementById('mrcExpandAll')?.addEventListener('click',function(){
    const groups=[...document.querySelectorAll('#mrcCheckList .mp-group')];
    const openCount=groups.filter(g=>g.classList.contains('is-open')).length;
    const makeOpen=openCount<groups.length;
    groups.forEach(g=>setGroupOpen(g,makeOpen));
  });

  let filterTimer=null;
  document.getElementById('mrcFilter')?.addEventListener('input',function(e){
    clearTimeout(filterTimer);
    filterTimer=setTimeout(function(){
      filterQuery=e.target.value||'';
      renderMatrix();
    },160);
  });
  nameEl&&nameEl.addEventListener('input',updateChrome);
  formEl&&formEl.addEventListener('submit',saveRole);

  document.addEventListener('DOMContentLoaded',async function(){
    try{
      await api(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.ACCESS_BOOTSTRAP,{headers:{...BO_AUTH.authHeader()}});
    }catch(e){}
    try{
      await loadMenus();
      renderMatrix();
      if(window.BO_SEG_BOUNCE) window.BO_SEG_BOUNCE.sync(document.getElementById('mrcScope'));
    }catch(err){
      if(listEl) listEl.innerHTML='<div class="permission-empty text-danger">'+esc(err.message||'Load menus failed')+'</div>';
      msg(err.message||'Load menus failed','error');
    }
  });
})();
