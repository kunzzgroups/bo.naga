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
