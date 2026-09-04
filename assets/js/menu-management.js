(function(){
  let rows=[],groups=[];
  let activePanel='MAIN';
  const PANEL_KEY='bo_menu_mgmt_panel';
  const MAIN_GROUP_KEYS=new Set(['root','main_reports_group','main_accounting_group','main_brands_group']);
  const $=id=>document.getElementById(id);
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function slug(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100);}
  async function api(url,opt){const r=await fetch(url,opt||{}),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  function status(id,text,type){const e=$(id);if(!e)return;e.textContent=text||'';e.className='upload-status '+(type||'');}
  function groupName(k){if(!k)return 'Main Menu';const g=groups.find(x=>String(x.groupKey)===String(k));return g?g.title:String(k).replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}

  function isMainGroupKey(key){
    const k=String(key||'').trim().toLowerCase();
    if(!k) return false;
    return MAIN_GROUP_KEYS.has(k) || k.startsWith('main_');
  }

  /** MAIN = executive panel sidebar; BO = brand ops sidebar. */
  function menuPanel(m){
    const explicit=String((m&&(m.panel||m.side||m.scope))||'').trim().toUpperCase();
    if(explicit==='MAIN'||explicit==='BO') return explicit;
    const parent=String((m&&m.parentKey)||'').trim().toLowerCase();
    const key=String((m&&m.menuKey)||'').trim().toLowerCase();
    const url=String((m&&m.url)||'').trim().replace(/^\.\//,'').toLowerCase();
    if(isMainGroupKey(parent)) return 'MAIN';
    if(key.startsWith('main_')||key==='root_control') return 'MAIN';
    if(url.startsWith('main-')||url==='root-control.html') return 'MAIN';
    return 'BO';
  }

  function filteredMenus(){
    return rows.filter(m=>menuPanel(m)===activePanel);
  }

  function filteredGroups(){
    return groups.filter(g=>{
      const key=String(g.groupKey||'').trim().toLowerCase();
      const isMain=isMainGroupKey(key);
      return activePanel==='MAIN' ? isMain : !isMain;
    });
  }

  function syncTabUi(){
    document.querySelectorAll('[data-menu-panel]').forEach(btn=>{
      const on=btn.getAttribute('data-menu-panel')===activePanel;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    const sub=$('menuModalSub');
    if(sub){
      sub.textContent=activePanel==='MAIN'
        ? 'Create a permission record for the MAIN sidebar.'
        : 'Create a permission record for the BO sidebar.';
    }
    const mainN=rows.filter(m=>menuPanel(m)==='MAIN').length;
    const boN=rows.filter(m=>menuPanel(m)==='BO').length;
    if($('menuTabMainCount')) $('menuTabMainCount').textContent=String(mainN);
    if($('menuTabBoCount')) $('menuTabBoCount').textContent=String(boN);
  }

  function normalizePanel(panel){
    return String(panel||'').toUpperCase()==='BO' ? 'BO' : 'MAIN';
  }

  function setPanel(panel){
    activePanel=normalizePanel(panel);
    try{sessionStorage.setItem(PANEL_KEY,activePanel);}catch(e){}
    syncTabUi();
    render();
    renderGroupSelect();
  }

  function renderGroupSelect(selected){
    const sel=$('menuParent');
    if(!sel) return;
    const value=selected==null?sel.value:String(selected);
    const opts=filteredGroups().filter(g=>Number(g.status)===1)
      .sort((a,b)=>Number(a.sortOrder||100)-Number(b.sortOrder||100)||String(a.title).localeCompare(String(b.title)));
    const emptyLabel=activePanel==='MAIN'?'MAIN top-level':'BO top-level';
    sel.innerHTML='<option value="">'+esc(emptyLabel)+'</option>'+
      opts.map(g=>`<option value="${esc(g.groupKey)}">${esc(g.title)}</option>`).join('');
    if(value && [...sel.options].some(o=>o.value===value)) sel.value=value;
    else sel.value='';
  }

  function render(){
    const list=filteredMenus();
    syncTabUi();
    $('menuCountBadge').textContent=`${list.length} Menu${list.length===1?'':'s'}`;
    $('menuTableBody').innerHTML=list.map(m=>`<tr><td><div class="menu-name-cell"><i class="bi ${esc(m.icon||'bi-circle')}"></i><div><b>${esc(m.title)}</b><small>${esc(m.menuKey)}</small></div></div></td><td><span class="menu-url-code">${esc(m.url)}</span></td><td>${esc(groupName(m.parentKey))}</td><td>${Number(m.sortOrder||0)}</td><td>${Number(m.status)===1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td><div class="d-flex gap-2 flex-wrap"><button class="clean-btn" data-edit-menu="${esc(m.id)}"><i class="bi bi-pencil-square"></i> Edit</button><button class="clean-btn danger" data-delete-menu="${esc(m.id)}" title="Delete menu"><i class="bi bi-trash3"></i> Delete</button></div></td></tr>`).join('')||'<tr><td colspan="6">No menu records found.</td></tr>';
    $('menuMobileCards').innerHTML=list.map(m=>`<article class="member-mobile-card menu-mobile-card"><div class="member-card-head"><div class="menu-name-cell"><i class="bi ${esc(m.icon||'bi-circle')}"></i><div><strong>${esc(m.title)}</strong><small>${esc(m.menuKey)}</small></div></div>${Number(m.status)===1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</div><div class="member-card-grid"><div><span>Page URL</span><b>${esc(m.url)}</b></div><div><span>Group</span><b>${esc(groupName(m.parentKey))}</b></div><div><span>Sort</span><b>${Number(m.sortOrder||0)}</b></div></div><div class="d-flex gap-2"><button class="clean-btn flex-grow-1" data-edit-menu="${esc(m.id)}"><i class="bi bi-pencil-square"></i> Edit Menu</button><button class="clean-btn danger" data-delete-menu="${esc(m.id)}"><i class="bi bi-trash3"></i> Delete</button></div></article>`).join('');
  }

  function renderGroups(){
    const body=$('groupTableBody');
    if(!body) return;
    const list=filteredGroups().sort((a,b)=>Number(a.sortOrder||100)-Number(b.sortOrder||100)||String(a.title).localeCompare(String(b.title)));
    body.innerHTML=list.map(g=>`<tr><td><div class="menu-name-cell"><i class="bi ${esc(g.icon||'bi-folder')}"></i><div><b>${esc(g.title)}</b><small>${Number(g.systemGroup)===1?'Preloaded':'Custom'}</small></div></div></td><td><span class="menu-url-code">${esc(g.groupKey)}</span></td><td>${Number(g.sortOrder||100)}</td><td>${Number(g.status)===1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td><td><button class="clean-btn" data-edit-group="${esc(g.id)}"><i class="bi bi-pencil-square"></i> Edit</button> <button class="clean-btn" data-delete-group="${esc(g.id)}"><i class="bi bi-trash"></i></button></td></tr>`).join('')||`<tr><td colspan="5">No ${esc(activePanel)} menu groups found.</td></tr>`;
  }

  async function loadGroups(){
    const j=await api(BO_AUTH.menuGroupListAllUrl(),{headers:{...BO_AUTH.authHeader()}});
    groups=j.data||[];
    renderGroupSelect();
    renderGroups();
    try{localStorage.setItem('bo_menu_group_meta_v1',JSON.stringify(groups.filter(g=>Number(g.status)===1)));}catch(e){}
  }

  async function load(){
    try{
      await loadGroups();
      const j=await api(BO_AUTH.menuListAllUrl(),{headers:{...BO_AUTH.authHeader()}});
      rows=(j.data||[]).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
      render();
    }catch(e){
      $('menuTableBody').innerHTML=`<tr><td colspan="6">${esc(e.message)}</td></tr>`;
    }
  }

  function preview(){
    $('menuPreviewTitle').textContent=$('menuTitle').value.trim()||'Menu Title';
    $('menuPreviewIcon').className='bi '+($('menuIcon').value.trim()||'bi-circle');
  }

  function reset(){
    $('menuForm').reset();
    $('menuId').value='';
    $('menuSort').value='100';
    $('menuStatus').value='1';
    $('menuModalTitle').textContent='Add Menu';
    renderGroupSelect('');
    status('menuFormStatus','','');
    preview();
  }

  function open(){
    $('menuModal').classList.add('show');
    document.body.classList.add('modal-open');
    setTimeout(()=>$('menuTitle').focus(),60);
  }

  function close(){
    $('menuModal').classList.remove('show');
    document.body.classList.remove('modal-open');
    status('menuFormStatus','','');
  }

  function edit(id){
    const m=rows.find(x=>String(x.id)===String(id));
    if(!m) return;
    const panel=menuPanel(m);
    if(panel!==activePanel) setPanel(panel);
    reset();
    $('menuId').value=m.id;
    $('menuTitle').value=m.title||'';
    $('menuKey').value=m.menuKey||'';
    $('menuUrl').value=m.url||'';
    $('menuIcon').value=m.icon||'';
    renderGroupSelect(m.parentKey||'');
    $('menuSort').value=Number(m.sortOrder||0);
    $('menuStatus').value=String(Number(m.status)==1?1:0);
    $('menuModalTitle').textContent='Edit Menu';
    preview();
    open();
  }

  async function save(e){
    e.preventDefault();
    const btn=$('saveMenuBtn');
    let parentKey=$('menuParent').value;
    // Keep new MAIN top-level items classifiable: if MAIN tab + empty group + not already main_* url/key, nudge via menuKey prefix only when needed is too invasive — require main_* group OR main- url.
    const payload={
      id:$('menuId').value||null,
      title:$('menuTitle').value.trim(),
      menuKey:slug($('menuKey').value||$('menuTitle').value),
      url:$('menuUrl').value.trim(),
      icon:$('menuIcon').value.trim()||'bi-circle',
      parentKey:parentKey,
      sortOrder:Number($('menuSort').value||0),
      status:Number($('menuStatus').value)
    };
    if(!payload.title||!payload.menuKey||!payload.url){
      status('menuFormStatus','Please complete Menu Title, Menu Key and Page URL.','error');
      return;
    }
    const classified=menuPanel(payload);
    if(classified!==activePanel){
      status(
        'menuFormStatus',
        activePanel==='MAIN'
          ? 'This menu would land on the BO tab. Use a main_* group, or a main-*.html / main_* key.'
          : 'This menu would land on the MAIN tab. Use a non-main_* group (or clear group) and a non-main URL/key.',
        'error'
      );
      return;
    }
    btn.disabled=true;
    status('menuFormStatus','Saving menu...','');
    try{
      const j=await api(BO_AUTH.menuSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});
      status('menuFormStatus',j.message||'Menu saved successfully.','success');
      await load();
      setTimeout(close,450);
    }catch(err){
      status('menuFormStatus',err.message,'error');
    }finally{
      btn.disabled=false;
    }
  }

  async function menuDelete(id){
    const m=rows.find(x=>String(x.id)===String(id));
    if(!m) return;
    let yes=false;
    if(window.BO_DIALOG&&typeof BO_DIALOG.confirm==='function'){
      yes=await BO_DIALOG.confirm(`Delete menu "${m.title}"?\n\nThis permanently removes the menu record and its role/menu permission assignments.`,{title:'Delete Menu',confirmText:'Delete',type:'danger'});
    }else{
      yes=window.confirm(`Delete menu "${m.title}"?\n\nThis permanently removes the menu record and its role/menu permission assignments.`);
    }
    if(!yes) return;
    try{
      const url=String(BO_AUTH.menuSaveUrl()).replace(/\/save(?:\?.*)?$/,'')+'/'+encodeURIComponent(id)+'/delete';
      await api(url,{method:'POST',headers:{...BO_AUTH.authHeader()}});
      await load();
    }catch(err){
      window.BO_DIALOG&&BO_DIALOG.alert?BO_DIALOG.alert(err.message,{title:'Delete Menu Failed',type:'danger'}):alert(err.message);
    }
  }

  function groupReset(){
    $('groupForm').reset();
    $('groupId').value='';
    $('groupSort').value='100';
    $('groupStatus').value='1';
    if(activePanel==='MAIN'&&!$('groupKey').value){
      // Suggest main_ prefix so new groups stay on MAIN tab
    }
    status('groupFormStatus','','');
  }

  function groupOpen(){
    renderGroups();
    groupReset();
    $('groupModal').classList.add('show');
    document.body.classList.add('modal-open');
    setTimeout(()=>$('groupTitle').focus(),60);
  }

  function groupClose(){
    $('groupModal').classList.remove('show');
    document.body.classList.remove('modal-open');
    status('groupFormStatus','','');
  }

  function groupEdit(id){
    const g=groups.find(x=>String(x.id)===String(id));
    if(!g) return;
    groupReset();
    $('groupId').value=g.id;
    $('groupTitle').value=g.title||'';
    $('groupKey').value=g.groupKey||'';
    $('groupIcon').value=g.icon||'';
    $('groupSort').value=Number(g.sortOrder||100);
    $('groupStatus').value=String(Number(g.status)===1?1:0);
  }

  async function groupSave(e){
    e.preventDefault();
    const btn=$('saveGroupBtn');
    let groupKey=slug($('groupKey').value||$('groupTitle').value);
    if(activePanel==='MAIN'&&!isMainGroupKey(groupKey)){
      groupKey='main_'+groupKey.replace(/^main_/,'');
      $('groupKey').value=groupKey;
    }
    if(activePanel==='BO'&&isMainGroupKey(groupKey)){
      status('groupFormStatus','BO groups cannot use a main_* / root key. Rename the Group Key.','error');
      return;
    }
    const payload={
      id:$('groupId').value||null,
      title:$('groupTitle').value.trim(),
      groupKey:groupKey,
      icon:$('groupIcon').value.trim()||'bi-folder',
      sortOrder:Number($('groupSort').value||100),
      status:Number($('groupStatus').value)
    };
    if(!payload.title||!payload.groupKey){
      status('groupFormStatus','Please complete Group Title and Group Key.','error');
      return;
    }
    btn.disabled=true;
    status('groupFormStatus','Saving menu group...','');
    try{
      await api(BO_AUTH.menuGroupSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});
      await loadGroups();
      await load();
      groupReset();
      status('groupFormStatus','Menu group saved successfully.','success');
    }catch(err){
      status('groupFormStatus',err.message,'error');
    }finally{
      btn.disabled=false;
    }
  }

  async function groupDelete(id){
    const g=groups.find(x=>String(x.id)===String(id));
    if(!g) return;
    if(!confirm(`Delete menu group "${g.title}"?\n\nThe group can only be deleted when no menu is assigned to it.`)) return;
    try{
      await api(BO_AUTH.menuGroupDeleteUrl(id),{method:'POST',headers:{...BO_AUTH.authHeader()}});
      await loadGroups();
      await load();
      status('groupFormStatus','Menu group deleted.','success');
    }catch(err){
      status('groupFormStatus',err.message,'error');
    }
  }

  document.addEventListener('DOMContentLoaded',function(){
    try{
      const saved=sessionStorage.getItem(PANEL_KEY);
      if(saved==='BO'||saved==='MAIN') activePanel=saved;
    }catch(e){}

    document.querySelectorAll('[data-menu-panel]').forEach(btn=>{
      btn.addEventListener('click',()=>setPanel(btn.getAttribute('data-menu-panel')));
    });

    $('openMenuModalBtn')?.addEventListener('click',()=>{reset();open();});
    $('refreshMenuBtn')?.addEventListener('click',load);
    $('menuForm')?.addEventListener('submit',save);
    document.querySelectorAll('[data-close-menu-modal]').forEach(x=>x.addEventListener('click',close));
    $('menuModal')?.addEventListener('click',e=>{if(e.target===$('menuModal'))close();});
    $('manageGroupsBtn')?.addEventListener('click',groupOpen);
    $('groupForm')?.addEventListener('submit',groupSave);
    $('resetGroupFormBtn')?.addEventListener('click',groupReset);
    document.querySelectorAll('[data-close-group-modal]').forEach(x=>x.addEventListener('click',groupClose));
    $('groupModal')?.addEventListener('click',e=>{if(e.target===$('groupModal'))groupClose();});
    $('menuTitle')?.addEventListener('input',function(){if(!$('menuId').value)$('menuKey').value=slug(this.value);preview();});
    $('menuIcon')?.addEventListener('input',preview);
    $('groupTitle')?.addEventListener('input',function(){
      if(!$('groupId').value){
        let k=slug(this.value);
        if(activePanel==='MAIN'&&k&&!isMainGroupKey(k)) k='main_'+k;
        $('groupKey').value=k;
      }
    });
    document.addEventListener('click',e=>{
      const me=e.target.closest('[data-edit-menu]');if(me)edit(me.dataset.editMenu);
      const md=e.target.closest('[data-delete-menu]');if(md)menuDelete(md.dataset.deleteMenu);
      const ge=e.target.closest('[data-edit-group]');if(ge)groupEdit(ge.dataset.editGroup);
      const gd=e.target.closest('[data-delete-group]');if(gd)groupDelete(gd.dataset.deleteGroup);
    });
    syncTabUi();
    load();
  });
})();
