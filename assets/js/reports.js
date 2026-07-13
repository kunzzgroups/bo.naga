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
    if(!select || select.dataset.roundedReady==='1' || select.multiple || select.size>1 || select.closest('.rounded-select-wrap')) return;
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
