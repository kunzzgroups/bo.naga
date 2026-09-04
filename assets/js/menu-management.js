(function(){
  let rows=[],groups=[];
  let activePanel='MAIN';
  let nmMode='group'; // 'item' | 'group'
  let returnToItemAfterGroup=false;
  const PANEL_KEY='bo_menu_mgmt_panel';
  const MAIN_GROUP_KEYS=new Set(['root','main_reports_group','main_accounting_group','main_brands_group']);
  const $=id=>document.getElementById(id);
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function slug(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100);}
  async function api(url,opt){const r=await fetch(url,opt||{}),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  function status(id,text,type){const e=$(id);if(!e)return;e.textContent=text||'';e.className='upload-status '+(type||'');}
  function groupName(k){if(!k)return 'Top-level';const g=groups.find(x=>String(x.groupKey)===String(k));return g?g.title:String(k).replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}

  function isMainGroupKey(key){
    const k=String(key||'').trim().toLowerCase();
    if(!k) return false;
    return MAIN_GROUP_KEYS.has(k) || k.startsWith('main_');
  }

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
    updateLivePreview();
  }

  function renderGroupSelect(selected){
    const sel=$('menuParent');
    if(!sel) return;
    const value=selected==null?sel.value:String(selected);
    const opts=filteredGroups().filter(g=>Number(g.status)===1)
      .sort((a,b)=>Number(a.sortOrder||100)-Number(b.sortOrder||100)||String(a.title).localeCompare(String(b.title)));
    sel.innerHTML='<option value="">Top-level</option>'+
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

  async function loadGroups(){
    const j=await api(BO_AUTH.menuGroupListAllUrl(),{headers:{...BO_AUTH.authHeader()}});
    groups=j.data||[];
    renderGroupSelect();
    try{localStorage.setItem('bo_menu_group_meta_v1',JSON.stringify(groups.filter(g=>Number(g.status)===1)));}catch(e){}
  }

  async function load(){
    try{
      await loadGroups();
      const j=await api(BO_AUTH.menuListAllUrl(),{headers:{...BO_AUTH.authHeader()}});
      rows=(j.data||[]).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
      render();
      updateLivePreview();
    }catch(e){
      $('menuTableBody').innerHTML=`<tr><td colspan="6">${esc(e.message)}</td></tr>`;
    }
  }

  function syncItemIconPreview(){
    const preview=$('menuIconPreview');
    if(preview) preview.className='bi '+($('menuIcon')?.value.trim()||'bi-circle');
  }
  function syncGroupIconPreview(){
    const preview=$('groupIconPreview');
    if(preview) preview.className='bi '+($('groupIcon')?.value.trim()||'bi-folder');
  }

  function setNmMode(mode, opts){
    nmMode=mode==='group'?'group':'item';
    document.querySelectorAll('[data-nm-mode]').forEach(btn=>{
      const on=btn.getAttribute('data-nm-mode')===nmMode;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    const groupForm=$('nmGroupForm');
    const itemForm=$('nmItemForm');
    if(groupForm) groupForm.hidden=nmMode!=='group';
    if(itemForm) itemForm.hidden=nmMode!=='item';
    const hint=$('nmModeHint');
    if(hint){
      hint.textContent=nmMode==='group'
        ? 'Add a collapsible first-level sidebar category (e.g. Finance, Merchants).'
        : 'Add a page under a group with route URL and permission key.';
    }
    const title=$('nmModalTitle');
    const sub=$('nmModalSub');
    const saveLabel=$('nmSaveLabel');
    const editingMenu=!!$('menuId')?.value;
    if(title) title.textContent=editingMenu&&nmMode==='item'?'Edit Menu':'New Menu';
    if(sub) sub.textContent='Add a sidebar category or page. Live preview shows hierarchy on the right.';
    if(saveLabel){
      if(nmMode==='group') saveLabel.textContent='Create Group';
      else saveLabel.textContent=editingMenu?'Save Menu':'Create Menu';
    }
    if(!(opts&&opts.skipPreview)) updateLivePreview();
  }

  function mockRow(opts){
    const {icon,title,isNew,badge,indent,chevron}=opts;
    const cls=['nm-mock-item',indent?'nm-mock-sub':'',isNew?'is-new':''].filter(Boolean).join(' ');
    const chev=chevron!==false?`<i class="bi bi-chevron-right nm-mock-chevron" aria-hidden="true"></i>`:'';
    return `<div class="${cls}"><i class="bi ${esc(icon||'bi-folder')}"></i><span>${esc(title)}</span>${badge?`<em>${esc(badge)}</em>`:''}${chev}</div>`;
  }

  function windowAround(list,index,max){
    const n=Math.max(3,max||5);
    if(list.length<=n) return list;
    let start=Math.max(0,index-Math.floor((n-1)/2));
    let end=start+n;
    if(end>list.length){end=list.length;start=Math.max(0,end-n);}
    return list.slice(start,end);
  }

  // Mirror auth.js sidebar roots for the active MAIN/BO panel only
  // (top-level menus + groups that actually have children in that panel).
  function buildPanelRootEntries(){
    const menus=filteredMenus().filter(m=>{
      if(Number(m.status)!==1) return false;
      const url=String(m.url||'').trim();
      return url && url!=='#';
    });
    const top=[];
    const byParent={};
    menus.forEach(m=>{
      const pk=String(m.parentKey||'').trim();
      if(pk) (byParent[pk]=byParent[pk]||[]).push(m);
      else top.push(m);
    });
    const metaMap=(typeof window!=='undefined'&&window.BO_MENU_GROUP_META)||{};
    const entries=[];
    top.forEach(m=>{
      entries.push({
        kind:'item',
        title:m.title,
        icon:m.icon||'bi-circle',
        sortOrder:Number(m.sortOrder||0)
      });
    });
    Object.keys(byParent).forEach(key=>{
      const g=groups.find(x=>String(x.groupKey)===String(key));
      const meta=metaMap[key]||{};
      let sort=Number(g&&g.sortOrder);
      if(!Number.isFinite(sort)) sort=Number(meta.sortOrder);
      if(!Number.isFinite(sort)){
        sort=Math.min.apply(null,byParent[key].map(x=>Number(x.sortOrder||0)));
      }
      entries.push({
        kind:'group',
        groupKey:key,
        title:(g&&g.title)||meta.title||groupName(key),
        icon:(g&&g.icon)||meta.icon||'bi-folder',
        sortOrder:sort
      });
    });
    return entries.sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
  }

  function updateLivePreview(){
    const box=$('nmSidebarPreview');
    const meta=$('nmPreviewMeta');
    if(!box) return;
    const panelLabel=activePanel==='BO'?'BO sidebar':'MAIN sidebar';

    if(nmMode==='group'){
      const title=$('groupTitle')?.value.trim()||'New Group';
      const icon=$('groupIcon')?.value.trim()||'bi-folder';
      const key=$('groupKey')?.value.trim()||slug(title)||'new_group';
      const sort=Number($('groupSort')?.value);
      const draftSort=Number.isFinite(sort)?sort:100;
      const draft={__new:true,kind:'group',title,icon,groupKey:key,sortOrder:draftSort};
      const list=buildPanelRootEntries().concat([draft])
        .sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
      const idx=list.findIndex(g=>g.__new);
      const shown=windowAround(list,Math.max(0,idx),5);
      box.innerHTML=shown.map(g=>g.__new
        ? mockRow({icon,title,isNew:true,badge:'NEW GROUP'})
        : mockRow({icon:g.icon||'bi-folder',title:g.title})
      ).join('')||mockRow({icon,title,isNew:true,badge:'NEW GROUP'});
      if(meta){
        meta.innerHTML=`<div><span>Panel</span><b>${esc(panelLabel)}</b></div>
          <div><span>Group key</span><code>${esc(key)}</code></div>
          <div><span>Level</span><b>Collapsible container (no page URL)</b></div>`;
      }
      return;
    }

    const title=$('menuTitle')?.value.trim()||'New Menu';
    const icon=$('menuIcon')?.value.trim()||'bi-circle';
    const key=$('menuKey')?.value.trim()||slug(title)||'new_menu';
    const parentKey=$('menuParent')?.value||'';
    const parent=groups.find(g=>String(g.groupKey)===String(parentKey));
    const sort=Number($('menuSort')?.value);
    const draftSort=Number.isFinite(sort)?sort:100;
    const draft={__new:true,title,icon,menuKey:key,parentKey,sortOrder:draftSort};

    if(parent){
      const siblings=filteredMenus().filter(m=>String(m.parentKey||'')===String(parentKey)&&Number(m.status)===1)
        .concat([draft])
        .sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
      const idx=siblings.findIndex(m=>m.__new);
      const shown=windowAround(siblings,idx,4);
      let html=mockRow({icon:parent.icon||'bi-folder',title:parent.title});
      html+=shown.map(m=>m.__new
        ? mockRow({icon,title,isNew:true,badge:'NEW',indent:true,chevron:false})
        : mockRow({icon:m.icon||'bi-circle',title:m.title,indent:true,chevron:false})
      ).join('');
      box.innerHTML=html;
    }else{
      const list=buildPanelRootEntries().concat([{__new:true,kind:'item',title,icon,sortOrder:draftSort}])
        .sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')));
      const idx=list.findIndex(m=>m.__new);
      const shown=windowAround(list,Math.max(0,idx),5);
      box.innerHTML=(shown.length?shown:[{__new:true}]).map(m=>m.__new
        ? mockRow({icon,title,isNew:true,badge:'NEW'})
        : mockRow({icon:m.icon||'bi-circle',title:m.title})
      ).join('');
    }
    if(meta){
      meta.innerHTML=`<div><span>Panel</span><b>${esc(panelLabel)}</b></div>
        <div><span>Parent</span><b>${esc(parent?parent.title:'Top-level')}</b></div>
        <div><span>Permission key</span><code>${esc(key)}</code></div>
        <div><span>URL</span><code>${esc($('menuUrl')?.value.trim()||'—')}</code></div>`;
    }
  }

  function resetItemForm(){
    $('nmItemForm')?.reset();
    if($('menuId')) $('menuId').value='';
    if($('menuSort')) $('menuSort').value='100';
    if($('menuStatus')) $('menuStatus').value='1';
    document.querySelectorAll('[data-menu-status]').forEach(btn=>{
      btn.classList.toggle('active',btn.getAttribute('data-menu-status')==='1');
    });
    renderGroupSelect('');
    status('menuFormStatus','','');
    syncItemIconPreview();
  }

  function resetGroupForm(){
    $('nmGroupForm')?.reset();
    if($('groupId')) $('groupId').value='';
    if($('groupSort')) $('groupSort').value='100';
    if($('groupStatus')) $('groupStatus').value='1';
    document.querySelectorAll('[data-group-status]').forEach(btn=>{
      btn.classList.toggle('active',btn.getAttribute('data-group-status')==='1');
    });
    status('groupFormStatus','','');
    syncGroupIconPreview();
  }

  function clearCurrent(){
    if(nmMode==='group') resetGroupForm();
    else resetItemForm();
    updateLivePreview();
  }

  function openModal(mode){
    setNmMode(mode||'item');
    $('newMenuModal')?.classList.add('show');
    document.body.classList.add('modal-open');
    setTimeout(()=>{
      if(nmMode==='group') $('groupTitle')?.focus();
      else $('menuTitle')?.focus();
    },60);
  }

  function closeModal(){
    $('newMenuModal')?.classList.remove('show');
    document.body.classList.remove('modal-open');
    status('menuFormStatus','','');
    status('groupFormStatus','','');
    returnToItemAfterGroup=false;
  }

  function openNew(){
    returnToItemAfterGroup=false;
    resetItemForm();
    resetGroupForm();
    openModal('group');
    updateLivePreview();
  }

  function edit(id){
    const m=rows.find(x=>String(x.id)===String(id));
    if(!m) return;
    const panel=menuPanel(m);
    if(panel!==activePanel) setPanel(panel);
    resetItemForm();
    resetGroupForm();
    $('menuId').value=m.id;
    $('menuTitle').value=m.title||'';
    $('menuKey').value=m.menuKey||'';
    $('menuUrl').value=m.url||'';
    $('menuIcon').value=m.icon||'';
    renderGroupSelect(m.parentKey||'');
    $('menuSort').value=Number(m.sortOrder||0);
    $('menuStatus').value=String(Number(m.status)==1?1:0);
    document.querySelectorAll('[data-menu-status]').forEach(btn=>{
      btn.classList.toggle('active',btn.getAttribute('data-menu-status')===String(Number(m.status)==1?1:0));
    });
    syncItemIconPreview();
    openModal('item');
    updateLivePreview();
  }

  async function saveItem(){
    const btn=$('nmSaveBtn');
    const payload={
      id:$('menuId').value||null,
      title:$('menuTitle').value.trim(),
      menuKey:slug($('menuKey').value||$('menuTitle').value),
      url:$('menuUrl').value.trim(),
      icon:$('menuIcon').value.trim()||'bi-circle',
      parentKey:$('menuParent').value,
      sortOrder:Number($('menuSort').value||0),
      status:Number($('menuStatus').value)
    };
    if(!payload.title||!payload.menuKey||!payload.url){
      status('menuFormStatus','Please complete Menu Title, Permission Key and Page URL.','error');
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
      setTimeout(closeModal,450);
    }catch(err){
      status('menuFormStatus',err.message,'error');
    }finally{
      btn.disabled=false;
    }
  }

  async function saveGroup(){
    const btn=$('nmSaveBtn');
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
      status('groupFormStatus','Menu group saved successfully.','success');
      await loadGroups();
      await load();
      if(returnToItemAfterGroup){
        returnToItemAfterGroup=false;
        resetGroupForm();
        renderGroupSelect(payload.groupKey);
        setNmMode('item');
        status('menuFormStatus','Group created. Continue with the menu item.','success');
      }else{
        setTimeout(closeModal,450);
      }
    }catch(err){
      status('groupFormStatus',err.message,'error');
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

  document.addEventListener('DOMContentLoaded',function(){
    try{
      const saved=sessionStorage.getItem(PANEL_KEY);
      if(saved==='BO'||saved==='MAIN') activePanel=saved;
    }catch(e){}

    document.querySelectorAll('[data-menu-panel]').forEach(btn=>{
      btn.addEventListener('click',()=>setPanel(btn.getAttribute('data-menu-panel')));
    });

    document.querySelectorAll('[data-nm-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(btn.getAttribute('data-nm-mode')==='group') returnToItemAfterGroup=false;
        setNmMode(btn.getAttribute('data-nm-mode'));
      });
    });

    $('openMenuModalBtn')?.addEventListener('click',openNew);
    $('refreshMenuBtn')?.addEventListener('click',load);
    document.querySelectorAll('[data-close-nm]').forEach(x=>x.addEventListener('click',closeModal));
    $('newMenuModal')?.addEventListener('click',e=>{if(e.target===$('newMenuModal'))closeModal();});
    $('nmSaveBtn')?.addEventListener('click',()=>{ if(nmMode==='group') saveGroup(); else saveItem(); });
    $('nmSwitchToGroup')?.addEventListener('click',()=>{
      returnToItemAfterGroup=true;
      resetGroupForm();
      setNmMode('group');
      $('groupTitle')?.focus();
    });

    document.querySelectorAll('[data-group-status]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=btn.getAttribute('data-group-status');
        if($('groupStatus')) $('groupStatus').value=v;
        document.querySelectorAll('[data-group-status]').forEach(b=>b.classList.toggle('active',b===btn));
        updateLivePreview();
      });
    });
    document.querySelectorAll('[data-menu-status]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=btn.getAttribute('data-menu-status');
        if($('menuStatus')) $('menuStatus').value=v;
        document.querySelectorAll('[data-menu-status]').forEach(b=>b.classList.toggle('active',b===btn));
        updateLivePreview();
      });
    });

    $('menuTitle')?.addEventListener('input',function(){
      if(!$('menuId').value) $('menuKey').value=slug(this.value);
      updateLivePreview();
    });
    $('menuKey')?.addEventListener('input',updateLivePreview);
    $('menuUrl')?.addEventListener('input',updateLivePreview);
    $('menuParent')?.addEventListener('change',updateLivePreview);
    $('menuIcon')?.addEventListener('input',()=>{syncItemIconPreview();updateLivePreview();});
    $('menuSort')?.addEventListener('input',updateLivePreview);
    $('menuSort')?.addEventListener('change',updateLivePreview);
    $('groupTitle')?.addEventListener('input',function(){
      if(!$('groupId').value){
        let k=slug(this.value);
        if(activePanel==='MAIN'&&k&&!isMainGroupKey(k)) k='main_'+k;
        $('groupKey').value=k;
      }
      updateLivePreview();
    });
    $('groupKey')?.addEventListener('input',updateLivePreview);
    $('groupIcon')?.addEventListener('input',()=>{syncGroupIconPreview();updateLivePreview();});
    $('groupSort')?.addEventListener('input',updateLivePreview);
    $('groupSort')?.addEventListener('change',updateLivePreview);

    document.addEventListener('click',e=>{
      const me=e.target.closest('[data-edit-menu]');if(me)edit(me.dataset.editMenu);
      const md=e.target.closest('[data-delete-menu]');if(md)menuDelete(md.dataset.deleteMenu);
    });

    setNmMode('group',{skipPreview:true});
    syncTabUi();
    load();
  });
})();
