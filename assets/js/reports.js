document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('reportSidebar');
  let overlay = document.getElementById('reportOverlay') || document.querySelector('.sidebar-overlay,.sidebar-backdrop');

  // Create overlay if an older page forgot to include it.
  if (!overlay && sidebar) {
    overlay = document.createElement('div');
    overlay.id = 'reportOverlay';
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('data-close-sidebar', '');
    sidebar.insertAdjacentElement('afterend', overlay);
  }

  const openSidebar = () => {
    if (!sidebar) return;
    sidebar.classList.add('show');
    overlay && overlay.classList.add('show');
    document.body.classList.add('sidebar-open');
  };

  const closeSidebar = () => {
    if (!sidebar) return;
    sidebar.classList.remove('show');
    overlay && overlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  };

  document.querySelectorAll('[data-open-sidebar], .hamb').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Mobile: hamburger is a true toggle, so tapping again closes the drawer.
      if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('show')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  });

  document.querySelectorAll('[data-close-sidebar], .sidebar-overlay, .sidebar-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
    });
  });

  document.querySelectorAll('.report-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth < 992) closeSidebar();
    });
  });

  // Sidebar group accordion: keep current section open and make every section clickable.
  document.querySelectorAll('.nav-group').forEach(group => {
    const list = group.querySelector('.nav-group-list');
    if (list && (list.classList.contains('show') || list.querySelector('.active'))) {
      group.classList.add('open');
      list.classList.add('show');
    }
  });

  document.querySelectorAll('.nav-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const group = btn.closest('.nav-group');
      const list = group && group.querySelector('.nav-group-list');
      if (!group || !list) return;
      const willOpen = !group.classList.contains('open');
      group.classList.toggle('open', willOpen);
      list.classList.toggle('show', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  // Profile dropdown: support both custom profile menu and Bootstrap-like dropdown markup.
  const closeProfiles = () => {
    document.querySelectorAll('.report-profile-menu.show, .dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
  };

  document.querySelectorAll('[data-profile-toggle], .profile-mini, .report-profile-btn, .dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let menu = null;
      const wrap = btn.closest('.report-profile-wrap,.dropdown');
      if (wrap) menu = wrap.querySelector('.report-profile-menu,.dropdown-menu');
      if (!menu) return;
      const shouldOpen = !menu.classList.contains('show');
      closeProfiles();
      menu.classList.toggle('show', shouldOpen);
    });
  });

  document.addEventListener('click', closeProfiles);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeProfiles();
      document.querySelectorAll('.modal-clean.show').forEach(m => m.classList.remove('show'));
    }
  });

  // Segment buttons active state.
  document.querySelectorAll('.seg button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement?.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Shared modal open/close for pages with modal actions.
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(btn.dataset.openModal);
      target && target.classList.add('show');
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.closest('.modal-clean')?.classList.remove('show');
    });
  });
  document.querySelectorAll('.modal-clean').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });
});


(function(){
  function closeAllProfileMenus(except){
    document.querySelectorAll('.dropdown-menu.show, .report-profile-menu.show').forEach(function(menu){
      if(menu !== except){
        menu.classList.remove('show');
        var wrap = menu.closest('.dropdown,.report-profile-wrap');
        if(wrap) wrap.classList.remove('open');
      }
    });
  }
  function findProfileButton(target){
    return target && target.closest && target.closest('[data-profile-toggle], .profile-mini, .report-profile-btn');
  }
  function handleProfileClick(e){
    var btn = findProfileButton(e.target);
    if(!btn) return;
    var wrap = btn.closest('.dropdown,.report-profile-wrap');
    var menu = wrap && wrap.querySelector('.dropdown-menu,.report-profile-menu');
    if(!menu) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var willOpen = !menu.classList.contains('show');
    closeAllProfileMenus(menu);
    menu.classList.toggle('show', willOpen);
    wrap.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }
  document.addEventListener('click', handleProfileClick, true);
  document.addEventListener('touchstart', handleProfileClick, {capture:true, passive:false});
  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('.dropdown,.report-profile-wrap,.dropdown-menu,.report-profile-menu')) return;
    closeAllProfileMenus();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeAllProfileMenus(); });
})();

// Desktop mini sidebar: click hamburger to collapse/restore, hover rail to slide out.
(function(){
  function isDesktop(){ return window.matchMedia('(min-width: 992px)').matches; }
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('[data-open-sidebar], .hamb');
    if(!btn || !isDesktop()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    document.body.classList.toggle('sidebar-mini');
    var sidebar = document.getElementById('reportSidebar');
    var overlay = document.getElementById('reportOverlay');
    if(sidebar) sidebar.classList.remove('show');
    if(overlay) overlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }, true);

  window.addEventListener('resize', function(){
    if(!isDesktop()) document.body.classList.remove('sidebar-mini');
  });
})();

// Global table action icon normalizer.
(function(){
  const actionMap = {
    'view': ['bi-eye','is-view'],
    'edit': ['bi-pencil','is-edit'],
    'delete': ['bi-trash','is-delete'],
    'remove': ['bi-trash','is-delete'],
    'ledger': ['bi-journal-text','is-ledger'],
    'adjust': ['bi-sliders','is-adjust'],
    'approve': ['bi-check-lg','is-approve'],
    'reject': ['bi-x-lg','is-reject'],
    'lock': ['bi-lock','is-edit'],
    'unlock': ['bi-unlock','is-approve']
  };
  function normalize(root){
    (root || document).querySelectorAll('.report-table tbody td:last-child a, .report-table tbody td:last-child button').forEach(function(btn){
      if(btn.classList.contains('bo-icon-action')) return;
      const raw=(btn.textContent || '').trim().replace(/\s+/g,' ').toLowerCase();
      const key=Object.keys(actionMap).find(function(k){ return raw === k || raw.startsWith(k+' '); });
      if(!key) return;
      const cfg=actionMap[key];
      btn.classList.add('bo-icon-action',cfg[1]);
      btn.setAttribute('title',key.charAt(0).toUpperCase()+key.slice(1));
      btn.setAttribute('aria-label',key.charAt(0).toUpperCase()+key.slice(1));
      btn.innerHTML='<i class="bi '+cfg[0]+'" aria-hidden="true"></i>';
    });
  }
  function boot(){
    normalize(document);
    new MutationObserver(function(mutations){
      mutations.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType===1) normalize(n); }); });
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

// Unified summary-card icons and secondary descriptions.
(function(){
  const iconRules=[
    [/user|member|admin|account/i,'bi-people'],[/active|online/i,'bi-person-check'],[/deposit|wallet|balance|credit/i,'bi-wallet2'],
    [/downline|referral|network/i,'bi-diagram-3'],[/commission|win|bet|profit|loss/i,'bi-graph-up-arrow'],[/disabled|locked/i,'bi-lock'],
    [/month|today|login|new/i,'bi-clock-history'],[/provider/i,'bi-hdd-network'],[/withdraw|transfer/i,'bi-arrow-left-right']
  ];
  function decorate(card,index){
    if(card.querySelector('.bo-summary-icon')) return;
    const text=(card.textContent||'').trim();
    const match=iconRules.find(r=>r[0].test(text));
    const icon=(match&&match[1])||['bi-people','bi-person-check','bi-wallet2','bi-clock-history'][index%4];
    const node=document.createElement('div');node.className='bo-summary-icon';node.innerHTML='<i class="bi '+icon+'"></i>';card.prepend(node);
    const spans=card.querySelectorAll(':scope > span');
    if(!card.querySelector('.bo-summary-note')){
      const note=document.createElement('div');note.className='bo-summary-note';
      const label=spans[0] ? spans[0].textContent.trim() : '';
      note.textContent=/wallet|balance/i.test(label)?'Current total':/active|online/i.test(label)?'Currently active':/deposit/i.test(label)?'All time deposits':/bet/i.test(label)?'All time bets':/commission/i.test(label)?'All time earned':'Overview total';
      card.appendChild(note);
    }
  }
  function run(root){
    (root||document).querySelectorAll('.quick-stats:not(.user-stats) .metric,.manage-summary .manage-card').forEach(decorate);
  }
  function boot(){run(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)run(n)}))).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* Unified rounded native-select replacement. Delayed so page-specific controls initialize first. */
(function(){
  function enhanceSelect(select){
    if(!select || select.dataset.noRounded==='1' || select.dataset.roundedReady==='1' || select.multiple || select.size>1 || select.closest('.rounded-select-wrap')) return;
    if(select.disabled && !select.options.length) return;
    select.dataset.roundedReady='1';
    const wrap=document.createElement('div'); wrap.className='rounded-select-wrap';
    select.parentNode.insertBefore(wrap,select); wrap.appendChild(select);
    const btn=document.createElement('button'); btn.type='button'; btn.className='rounded-select-btn';
    const menu=document.createElement('div'); menu.className='rounded-select-menu';
    wrap.appendChild(btn); wrap.appendChild(menu);
    function label(){ const o=select.options[select.selectedIndex]; return o ? o.textContent.trim() : 'Select'; }
    function render(){
      btn.innerHTML='<span>'+escapeHtml(label())+'</span><i class="bi bi-chevron-down"></i>';
      menu.innerHTML='';
      Array.from(select.options).forEach(function(opt){
        const item=document.createElement('button'); item.type='button'; item.className='rounded-select-option'+(opt.selected?' active':'');
        item.textContent=opt.textContent; item.disabled=opt.disabled;
        item.addEventListener('click',function(){ select.value=opt.value; select.dispatchEvent(new Event('change',{bubbles:true})); close(); });
        menu.appendChild(item);
      });
    }
    function close(){ menu.classList.remove('show'); btn.classList.remove('open'); }
    btn.addEventListener('click',function(e){ e.stopPropagation(); const open=!menu.classList.contains('show'); document.querySelectorAll('.rounded-select-menu.show').forEach(m=>m.classList.remove('show')); document.querySelectorAll('.rounded-select-btn.open').forEach(b=>b.classList.remove('open')); if(open){menu.classList.add('show');btn.classList.add('open');} });
    select.addEventListener('change',render);
    new MutationObserver(render).observe(select,{childList:true,subtree:true,attributes:true});
    render();
  }
  function escapeHtml(v){return String(v||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function run(){ document.querySelectorAll('select').forEach(enhanceSelect); }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(run,20);});
  document.addEventListener('click',function(e){if(!e.target.closest('.rounded-select-wrap')){document.querySelectorAll('.rounded-select-menu.show').forEach(m=>m.classList.remove('show'));document.querySelectorAll('.rounded-select-btn.open').forEach(b=>b.classList.remove('open'));}});
  new MutationObserver(function(){setTimeout(run,0);}).observe(document.documentElement,{childList:true,subtree:true});
})();


<<<<<<< HEAD
/* Global standardized alert modal: replaces browser alert() across the BO. */
(function(){
  let modal, titleEl, messageEl, iconEl, okButton;
  function classify(text){
    const value=String(text||'').toLowerCase();
    if(/delete|deleted|remove|removed|trash/.test(value)) return {type:'delete',title:'Deleted',icon:'bi-trash3'};
    if(/fail|failed|error|invalid|missing|not available|unable|denied/.test(value)) return {type:'error',title:'Error',icon:'bi-exclamation-triangle'};
    if(/success|saved|updated|done|completed|approved|rejected|sent|created/.test(value)) return {type:'success',title:'Success',icon:'bi-check-circle'};
    if(/warning|please|select|choose|required/.test(value)) return {type:'warning',title:'Attention',icon:'bi-exclamation-circle'};
    return {type:'info',title:'Notification',icon:'bi-info-circle'};
  }
=======
/* Global styled alert modal: replaces browser alert() across the BO. */
(function(){
  let modal, message, okButton;
>>>>>>> f6f474b4792d289fa81f7a4d34e0d9b91257e665
  function ensure(){
    if(modal) return;
    modal=document.createElement('div');
    modal.className='bo-alert-modal';
    modal.setAttribute('aria-hidden','true');
<<<<<<< HEAD
    modal.innerHTML='<div class="bo-alert-backdrop"></div><div class="bo-alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="boAlertTitle"><div class="bo-alert-head"><div class="bo-alert-icon"><i class="bi bi-info-circle"></i></div><div class="bo-alert-copy"><h3 id="boAlertTitle">Notification</h3><div class="bo-alert-message"></div></div></div><div class="bo-alert-actions"><button type="button" class="bo-alert-ok">OK</button></div></div>';
    document.body.appendChild(modal);
    titleEl=modal.querySelector('#boAlertTitle'); messageEl=modal.querySelector('.bo-alert-message'); iconEl=modal.querySelector('.bo-alert-icon i'); okButton=modal.querySelector('.bo-alert-ok');
=======
    modal.innerHTML='<div class="bo-alert-backdrop"></div><div class="bo-alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="boAlertTitle"><div class="bo-alert-icon"><i class="bi bi-info-circle"></i></div><div class="bo-alert-copy"><h3 id="boAlertTitle">Notification</h3><div class="bo-alert-message"></div></div><button type="button" class="bo-alert-ok">OK</button></div>';
    document.body.appendChild(modal);
    message=modal.querySelector('.bo-alert-message'); okButton=modal.querySelector('.bo-alert-ok');
>>>>>>> f6f474b4792d289fa81f7a4d34e0d9b91257e665
    const close=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true');};
    okButton.addEventListener('click',close);
    modal.querySelector('.bo-alert-backdrop').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))close();});
  }
<<<<<<< HEAD
  window.alert=function(text){
    ensure(); const c=classify(text); modal.dataset.type=c.type; titleEl.textContent=c.title; iconEl.className='bi '+c.icon; messageEl.textContent=String(text??''); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); setTimeout(()=>okButton.focus(),0);
  };
})();


/* Global standardized confirmation and input dialogs. */
(function(){
  let modal, titleEl, messageEl, iconEl, warningEl, inputWrap, inputEl, okBtn, cancelBtn, resolver;
=======
  window.alert=function(text){ensure();message.textContent=String(text??'');modal.classList.add('show');modal.setAttribute('aria-hidden','false');setTimeout(()=>okButton.focus(),0);};
})();


/* Global styled confirmation and input dialogs. Use BO_DIALOG.confirm()/prompt() instead of native browser dialogs. */
(function(){
  let modal, titleEl, messageEl, inputWrap, inputEl, okBtn, cancelBtn, resolver;
>>>>>>> f6f474b4792d289fa81f7a4d34e0d9b91257e665
  function ensure(){
    if(modal) return;
    modal=document.createElement('div');
    modal.className='bo-dialog-modal';
    modal.setAttribute('aria-hidden','true');
<<<<<<< HEAD
    modal.innerHTML='<div class="bo-dialog-backdrop"></div><div class="bo-dialog-box" role="dialog" aria-modal="true" aria-labelledby="boDialogTitle"><button type="button" class="bo-dialog-close" aria-label="Close"><i class="bi bi-x-lg"></i></button><div class="bo-dialog-head"><div class="bo-dialog-icon"><i class="bi bi-question-circle"></i></div><div class="bo-dialog-copy"><h3 id="boDialogTitle">Confirm Action</h3><div class="bo-dialog-message"></div></div></div><div class="bo-dialog-warning"><i class="bi bi-exclamation-triangle"></i><span>This action cannot be undone.</span></div><label class="bo-dialog-input-wrap"><span class="bo-dialog-input-label">Admin remark</span><input type="text" class="bo-dialog-input" autocomplete="off"></label><div class="bo-dialog-actions"><button type="button" class="bo-dialog-cancel">Cancel</button><button type="button" class="bo-dialog-ok">Confirm</button></div></div>';
    document.body.appendChild(modal);
    titleEl=modal.querySelector('#boDialogTitle'); messageEl=modal.querySelector('.bo-dialog-message'); iconEl=modal.querySelector('.bo-dialog-icon i'); warningEl=modal.querySelector('.bo-dialog-warning'); inputWrap=modal.querySelector('.bo-dialog-input-wrap'); inputEl=modal.querySelector('.bo-dialog-input'); okBtn=modal.querySelector('.bo-dialog-ok'); cancelBtn=modal.querySelector('.bo-dialog-cancel');
=======
    modal.innerHTML='<div class="bo-dialog-backdrop"></div><div class="bo-dialog-box" role="dialog" aria-modal="true" aria-labelledby="boDialogTitle"><button type="button" class="bo-dialog-close" aria-label="Close"><i class="bi bi-x-lg"></i></button><div class="bo-dialog-icon"><i class="bi bi-question-circle"></i></div><div class="bo-dialog-copy"><h3 id="boDialogTitle">Confirm Action</h3><div class="bo-dialog-message"></div></div><label class="bo-dialog-input-wrap"><span class="bo-dialog-input-label">Admin remark</span><input type="text" class="bo-dialog-input" autocomplete="off"></label><div class="bo-dialog-actions"><button type="button" class="bo-dialog-cancel">Cancel</button><button type="button" class="bo-dialog-ok">Confirm</button></div></div>';
    document.body.appendChild(modal);
    titleEl=modal.querySelector('#boDialogTitle'); messageEl=modal.querySelector('.bo-dialog-message'); inputWrap=modal.querySelector('.bo-dialog-input-wrap'); inputEl=modal.querySelector('.bo-dialog-input'); okBtn=modal.querySelector('.bo-dialog-ok'); cancelBtn=modal.querySelector('.bo-dialog-cancel');
>>>>>>> f6f474b4792d289fa81f7a4d34e0d9b91257e665
    function finish(value){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); const r=resolver; resolver=null; if(r) r(value); }
    okBtn.addEventListener('click',()=>finish(inputWrap.classList.contains('show')?inputEl.value:true));
    cancelBtn.addEventListener('click',()=>finish(inputWrap.classList.contains('show')?null:false));
    modal.querySelector('.bo-dialog-close').addEventListener('click',()=>finish(inputWrap.classList.contains('show')?null:false));
    modal.querySelector('.bo-dialog-backdrop').addEventListener('click',()=>finish(inputWrap.classList.contains('show')?null:false));
    inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();okBtn.click();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show')){e.preventDefault();cancelBtn.click();}});
  }
<<<<<<< HEAD
  function inferType(o){
    const value=((o.title||'')+' '+(o.message||'')+' '+(o.confirmText||'')).toLowerCase();
    if(/delete|remove|trash/.test(value)) return 'delete';
    if(/reject|forfeit|reset|disable|recall/.test(value)) return 'warning';
    if(o.input) return 'input';
    if(/sync|approve|confirm|continue|save|update|add/.test(value)) return 'confirm';
    return 'confirm';
  }
  function iconFor(type){return {delete:'bi-trash3',warning:'bi-exclamation-triangle',input:'bi-pencil-square',confirm:'bi-question-circle'}[type]||'bi-question-circle';}
  function open(options){
    ensure(); const o=options||{}; const type=o.type||inferType(o); modal.dataset.type=type;
    titleEl.textContent=o.title||'Confirm Action'; messageEl.textContent=String(o.message||''); iconEl.className='bi '+(o.icon||iconFor(type));
    okBtn.textContent=o.confirmText||'Confirm'; cancelBtn.textContent=o.cancelText||'Cancel';
    warningEl.classList.toggle('show',type==='delete'); warningEl.querySelector('span').textContent=o.warningText||'This action cannot be undone.';
    inputWrap.classList.toggle('show',!!o.input);
    if(o.input){ inputWrap.querySelector('.bo-dialog-input-label').textContent=o.inputLabel||'Remark'; inputEl.value=o.defaultValue||''; inputEl.placeholder=o.placeholder||''; }
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    return new Promise(resolve=>{resolver=resolve;setTimeout(()=>o.input?inputEl.focus():okBtn.focus(),0);});
  }
=======
  function open(options){ ensure(); const o=options||{}; titleEl.textContent=o.title||'Confirm Action'; messageEl.textContent=String(o.message||''); okBtn.textContent=o.confirmText||'Confirm'; cancelBtn.textContent=o.cancelText||'Cancel'; inputWrap.classList.toggle('show',!!o.input); if(o.input){ inputWrap.querySelector('.bo-dialog-input-label').textContent=o.inputLabel||'Remark'; inputEl.value=o.defaultValue||''; inputEl.placeholder=o.placeholder||''; } modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); return new Promise(resolve=>{resolver=resolve;setTimeout(()=>o.input?inputEl.focus():okBtn.focus(),0);}); }
>>>>>>> f6f474b4792d289fa81f7a4d34e0d9b91257e665
  window.BO_DIALOG={
    confirm(message,options){return open(Object.assign({message:message,input:false},options||{}));},
    prompt(message,defaultValue,options){return open(Object.assign({message:message,input:true,defaultValue:defaultValue||''},options||{}));}
  };
})();
