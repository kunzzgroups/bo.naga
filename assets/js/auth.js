(function(){
  function api(pathKey){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }
  function initials(name){
    name = (name || 'A').trim();
    return (name.charAt(0) || 'A').toUpperCase();
  }
  function displayName(user){ return (user && (user.displayName || user.username)) || 'Admin'; }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function pageName(){
    return (location.pathname || '').split('/').pop() || 'index.html';
  }

  const GROUP_META = {
    access: { title: 'Access Control', icon: 'bi-shield-lock' },
    game: { title: 'Game Management', icon: 'bi-controller' },
    bonus: { title: 'Bonus Management', icon: 'bi-gift' }
  };

  // Used only when backend has not returned menu data yet.
  // Normal sidebar is rendered from /auth/admin/me => user.menus.
  const FALLBACK_MENUS = [
    {menuKey:'user', title:'User Management', url:'index.html', icon:'bi-people', parentKey:'', sortOrder:10},
    {menuKey:'admin', title:'Admin Management', url:'admin-user.html', icon:'bi-shield-lock', parentKey:'', sortOrder:20},
    {menuKey:'role', title:'Role', url:'role.html', icon:'bi-person-badge', parentKey:'access', sortOrder:30},
    {menuKey:'menu_permission', title:'Menu Permission', url:'menu-permission.html', icon:'bi-menu-button-wide', parentKey:'access', sortOrder:33},
    {menuKey:'account_lock', title:'Account Lock', url:'account-lock.html', icon:'bi-lock', parentKey:'access', sortOrder:34},
    {menuKey:'language', title:'Language & Translation', url:'language.html', icon:'bi-translate', parentKey:'', sortOrder:40},
    {menuKey:'image', title:'Image To URL', url:'image-to-url.html', icon:'bi-image', parentKey:'', sortOrder:50},
    {menuKey:'slider', title:'Slider Banner', url:'slider.html', icon:'bi-images', parentKey:'', sortOrder:60},
    {menuKey:'game_category', title:'Game Category', url:'game-category.html', icon:'bi-grid-3x3-gap', parentKey:'game', sortOrder:70},
    {menuKey:'game_sub_category', title:'Game Sub Category', url:'game-sub-category.html', icon:'bi-diagram-3', parentKey:'game', sortOrder:71},
    {menuKey:'game', title:'Game', url:'game.html', icon:'bi-joystick', parentKey:'game', sortOrder:72},
    {menuKey:'bonus_title', title:'Bonus Title', url:'bonus-category-title.html', icon:'bi-gift', parentKey:'bonus', sortOrder:80},
    {menuKey:'bonus_item', title:'Bonus Item', url:'bonus-category-item.html', icon:'bi-gift-fill', parentKey:'bonus', sortOrder:81},
    {menuKey:'site_customize', title:'Site Customize', url:'site-customize.html', icon:'bi-palette', parentKey:'', sortOrder:90},
    {menuKey:'layout_section', title:'Layout Section', url:'layout-section.html', icon:'bi-code-square', parentKey:'', sortOrder:91}
  ];

  function normalizeMenu(m){
    return {
      id: m && m.id,
      menuKey: String((m && (m.menuKey || m.key)) || ''),
      title: String((m && (m.title || m.name)) || 'Menu'),
      url: String((m && (m.url || m.href)) || '#'),
      icon: String((m && m.icon) || 'bi-circle'),
      parentKey: String((m && m.parentKey) || ''),
      sortOrder: Number((m && m.sortOrder) || 0),
      status: Number((m && (m.status == null ? 1 : m.status)))
    };
  }

  function menuLinkHtml(m, isSub){
    const href = esc(m.url || '#');
    const active = pageName() === (m.url || '').split('/').pop();
    const cls = (isSub ? 'report-sub ' : '') + (active ? 'active' : '');
    return '<a href="' + href + '" class="' + cls.trim() + '" data-menu-key="' + esc(m.menuKey) + '">' +
      '<span><i class="bi ' + esc(m.icon || 'bi-circle') + ' me-2"></i>' + esc(m.title) + '</span></a>';
  }

  window.BO_AUTH = {
    tokenKey: 'bo_admin_token',
    userKey: 'bo_admin_user',
    token: function(){ return localStorage.getItem(this.tokenKey) || ''; },
    user: function(){ try { return JSON.parse(localStorage.getItem(this.userKey) || '{}'); } catch(e){ return {}; } },
    save: function(json){ localStorage.setItem(this.tokenKey, json.token || ''); localStorage.setItem(this.userKey, JSON.stringify(json.data || {})); },
    saveUser: function(user){ localStorage.setItem(this.userKey, JSON.stringify(user || {})); this.renderProfile(); this.renderSidebar(user); },
    logout: function(){ localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); window.location.href = 'login.html'; },
    requireLogin: function(){ if(!this.token() && !location.pathname.endsWith('/login.html')) window.location.href = 'login.html'; },
    authHeader: function(){ return this.token() ? {'Authorization':'Bearer ' + this.token()} : {}; },
    loginUrl: function(){ return api('AUTH_ADMIN_LOGIN'); },
    createAdminUrl: function(){ return api('AUTH_ADMIN_CREATE'); },
    adminMeUrl: function(){ return api('AUTH_ADMIN_ME'); },
    adminListUrl: function(){ return api('AUTH_ADMIN_LIST'); },
    adminUpdateUrl: function(id){ return api('AUTH_ADMIN_UPDATE') + '/' + id; },
    profileUpdateUrl: function(){ return api('AUTH_ADMIN_PROFILE_UPDATE'); },
    changePasswordUrl: function(){ return api('AUTH_ADMIN_CHANGE_PASSWORD'); },
    roleListUrl: function(){ return api('ROLE_LIST'); },
    roleSaveUrl: function(){ return api('ROLE_SAVE'); },
    menuListUrl: function(){ return api('MENU_LIST'); },
    menuSaveUrl: function(){ return api('MENU_SAVE'); },
    roleMenusUrl: function(roleId){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROLE_MENU_GET + '/' + roleId + '/menus'; },
    memberListUrl: function(){ return api('MEMBER_LIST'); },
    memberCreateUrl: function(){ return api('MEMBER_CREATE'); },
    memberUpdateUrl: function(id){ return api('MEMBER_UPDATE') + '/' + id; },
    refreshMe: async function(){
      if(!this.token()) return null;
      try{
        const res = await fetch(this.adminMeUrl(), {headers: {...this.authHeader()}});
        const json = await res.json().catch(() => ({}));
        if(res.ok && json.status !== 'error' && json.data){ this.saveUser(json.data); return json.data; }
        if(json.message === 'Unauthorized') this.logout();
      }catch(e){}
      const user = this.user();
      this.renderSidebar(user);
      return user;
    },
    applyMenuPermission: function(user){
      // Backward compatible function name. Sidebar is now fully rendered from allowed menus.
      this.renderSidebar(user || this.user());
    },
    renderSidebar: function(user){
      const nav = document.querySelector('.report-nav');
      if(!nav) return;
      user = user || this.user();
      let menus = Array.isArray(user.menus) ? user.menus : [];
      if(!menus.length && !this.token()) menus = FALLBACK_MENUS;
      if(!menus.length) return;

      menus = menus.map(normalizeMenu).filter(m => m.status === 1 && m.url && m.url !== '#')
        .sort((a,b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

      const top = [];
      const groups = {};
      menus.forEach(m => {
        if(m.parentKey){
          if(!groups[m.parentKey]) groups[m.parentKey] = [];
          groups[m.parentKey].push(m);
        }else{
          top.push(m);
        }
      });

      const activePage = pageName();
      let html = '';
      top.forEach(m => { html += menuLinkHtml(m, false); });
      Object.keys(groups).sort((a,b) => {
        const minA = Math.min.apply(null, groups[a].map(x => x.sortOrder));
        const minB = Math.min.apply(null, groups[b].map(x => x.sortOrder));
        return minA - minB;
      }).forEach(key => {
        const items = groups[key].sort((a,b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
        const meta = GROUP_META[key] || {title: key.replace(/[_-]+/g,' ').replace(/\b\w/g, c => c.toUpperCase()), icon: 'bi-folder'};
        const isOpen = items.some(m => activePage === (m.url || '').split('/').pop());
        html += '<div class="nav-group ' + (isOpen ? 'open' : '') + '" data-menu-group="' + esc(key) + '">' +
          '<button type="button" class="nav-group-btn" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
          '<span><i class="bi ' + esc(meta.icon) + ' me-2"></i>' + esc(meta.title) + '</span><i class="bi bi-chevron-down"></i></button>' +
          '<div class="nav-group-list ' + (isOpen ? 'show' : '') + '">' + items.map(m => menuLinkHtml(m, true)).join('') + '</div></div>';
      });
      nav.innerHTML = html;
    },
    bindDynamicSidebarEvents: function(){
      document.addEventListener('click', function(e){
        const btn = e.target.closest && e.target.closest('.nav-group-btn');
        if(btn){
          e.preventDefault();
          const group = btn.closest('.nav-group');
          const list = group && group.querySelector('.nav-group-list');
          if(!group || !list) return;
          const willOpen = !group.classList.contains('open');
          group.classList.toggle('open', willOpen);
          list.classList.toggle('show', willOpen);
          btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
          return;
        }
        const link = e.target.closest && e.target.closest('.report-nav a[href]');
        if(link && window.innerWidth < 992){
          document.getElementById('reportSidebar')?.classList.remove('show');
          document.getElementById('reportOverlay')?.classList.remove('show');
          document.body.classList.remove('sidebar-open');
        }
      });
    },
    renderProfile: function(){
      const user = this.user();
      const name = displayName(user);
      document.querySelectorAll('[data-admin-name]').forEach(el => el.textContent = name);
      document.querySelectorAll('[data-admin-username]').forEach(el => el.textContent = user.username || 'admin');
      document.querySelectorAll('[data-admin-avatar]').forEach(el => el.textContent = initials(name));
    },
    profileHtml: function(){
      const user = this.user();
      const name = displayName(user);
      return '<div class="report-profile-wrap">' +
        '<button class="report-profile-btn" type="button" data-profile-toggle>' +
        '<span class="report-avatar" data-admin-avatar>' + initials(name) + '</span><span data-admin-name>' + esc(name) + '</span><i class="bi bi-chevron-down small"></i>' +
        '</button>' +
        '<div class="report-profile-menu">' +
        '<div class="head"><b data-admin-name>' + esc(name) + '</b><small data-admin-username>' + esc(user.username || 'admin') + '</small></div>' +
        '<a href="profile.html"><i class="bi bi-person"></i>Profile</a>' +
        '<a href="change-password.html"><i class="bi bi-key"></i>Change Password</a>' +
        '<a class="danger" href="#logout" data-bo-logout><i class="bi bi-box-arrow-right"></i>Logout</a>' +
        '</div></div>';
    },
    injectProfile: function(){
      document.querySelectorAll('[data-bo-profile]').forEach(el => { el.innerHTML = this.profileHtml(); });
      this.renderProfile();
    }
  };

  if(!location.pathname.endsWith('/login.html')) window.BO_AUTH.requireLogin();

  document.addEventListener('DOMContentLoaded', function(){
    if(location.pathname.endsWith('/login.html')) return;
    window.BO_AUTH.injectProfile();
    window.BO_AUTH.bindDynamicSidebarEvents();
    window.BO_AUTH.renderSidebar(window.BO_AUTH.user());
    window.BO_AUTH.refreshMe();
    document.addEventListener('click', function(e){
      const logout = e.target.closest && e.target.closest('[data-bo-logout]');
      if(logout){ e.preventDefault(); window.BO_AUTH.logout(); }
    });
  });
})();
