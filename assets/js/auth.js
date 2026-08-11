(function(){
  // Apply the authenticated admin identity to every BO API request. This keeps
  // legacy pages covered by the central Spring Boot admin-operation audit trail
  // without changing each working page one by one.
  (function installAdminAuditHeaders(){
    if(window.__boAdminAuditFetchInstalled || !window.fetch) return;
    window.__boAdminAuditFetchInstalled = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function(input, init){
      init = init ? Object.assign({}, init) : {};
      let url = '';
      try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch(e){}
      let isApi = false;
      try {
        const absolute = new URL(url, location.href);
        const configuredBase = window.API_CONFIG && API_CONFIG.BASE_URL ? new URL(API_CONFIG.BASE_URL, location.href) : null;
        isApi = absolute.pathname.indexOf('/api/') !== -1 && (!configuredBase || absolute.origin === configuredBase.origin);
      } catch(e) { isApi = String(url).indexOf('/api/') !== -1; }
      if(isApi && String(url).indexOf('/api/auth/admin/login') === -1){
        const headers = new Headers(init.headers || (input && input.headers) || {});
        const token = localStorage.getItem('bo_admin_token') || '';
        let user = {};
        try { user = JSON.parse(localStorage.getItem('bo_admin_user') || '{}'); } catch(e){}
        if(token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
        if(user && user.username && !headers.has('X-Admin-Username')) headers.set('X-Admin-Username', String(user.username));
        if(!headers.has('X-Request-Id')) headers.set('X-Request-Id', 'bo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10));

        // Attach a compact, sanitized business context so the backend audit log can
        // say exactly which game/member/configuration was changed. This is metadata
        // only and never changes the original request body or API behavior.
        try {
          const method = String(init.method || (input && input.method) || 'GET').toUpperCase();
          if(method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && !headers.has('X-Admin-Audit-Context')){
            const sensitive = /password|token|authorization|secret|signature|api.?key|transaction.?password|pin/i;
            const useful = {};
            const put = function(k,v){
              if(!k || sensitive.test(k) || v == null || v === '' || typeof v === 'object') return;
              const text = String(v);
              useful[k] = text.length > 300 ? text.slice(0,300) : text;
            };
            const body = init.body;
            if(typeof body === 'string'){
              try {
                const parsed = JSON.parse(body);
                if(parsed && typeof parsed === 'object' && !Array.isArray(parsed)) Object.keys(parsed).forEach(k=>put(k, parsed[k]));
              } catch(e){}
            } else if(window.FormData && body instanceof FormData){
              body.forEach((v,k)=>{ if(!(window.File && v instanceof File)) put(k,v); });
            } else if(window.URLSearchParams && body instanceof URLSearchParams){
              body.forEach((v,k)=>put(k,v));
            }
            const absolute = new URL(url, location.href);
            const context = {
              page: (document.title || '').trim(),
              pathname: absolute.pathname,
              fields: useful
            };
            const raw = JSON.stringify(context);
            if(raw.length < 6000) headers.set('X-Admin-Audit-Context', encodeURIComponent(raw));
          }
        } catch(e){}
        init.headers = headers;
      }
      return nativeFetch(input, init);
    };
  })();
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
    bonus: { title: 'Bonus Management', icon: 'bi-gift' },
    support: { title: 'Support', icon: 'bi-headset' },
    wallet: { title: 'Wallet Management', icon: 'bi-wallet2' },
    setting: { title: 'Setting', icon: 'bi-gear' },
    report: { title: 'Report', icon: 'bi-wallet2' }
  };

  // Used only when backend has not returned menu data yet.
  // Normal sidebar is rendered from /auth/admin/me => user.menus.
  const FALLBACK_MENUS = [
    {menuKey:'user', title:'User Management', url:'index.html', icon:'bi-people', parentKey:'', sortOrder:10},
    {menuKey:'online_users', title:'Online Users', url:'online-users.html', icon:'bi-wifi', parentKey:'', sortOrder:10.5},
    {menuKey:'duplicate_ip', title:'Duplicate IP Checker', url:'duplicate-ip.html', icon:'bi-diagram-3', parentKey:'', sortOrder:11},
    {menuKey:'highest_turnover_games', title:'Highest Turnover Games', url:'highest-turnover-games.html', icon:'bi-graph-up-arrow', parentKey:'', sortOrder:12},
    {menuKey:'frequently_played_games', title:'Frequently Played Games', url:'frequently-played-games.html', icon:'bi-controller', parentKey:'', sortOrder:13},
    {menuKey:'member_wallet', title:'Member Wallet Listing', url:'member-wallet.html', icon:'bi-wallet2', parentKey:'wallet', sortOrder:11},
    {menuKey:'wallet_ledger', title:'Wallet Ledger', url:'wallet-ledger.html', icon:'bi-receipt', parentKey:'wallet', sortOrder:12},
    {menuKey:'bulk_adjustment', title:'Bulk Adjustment', url:'bulk-adjustment.html', icon:'bi-wallet2', parentKey:'wallet', sortOrder:12.1},
    {menuKey:'bulk_bonus_adjustment', title:'Bulk Bonus Adjustment', url:'bulk-bonus-adjustment.html', icon:'bi-gift', parentKey:'wallet', sortOrder:12.2},
    {menuKey:'member_deposit', title:'Deposit Approval', url:'member-deposit.html', icon:'bi-bank', parentKey:'wallet', sortOrder:13},
    {menuKey:'member_withdraw', title:'Withdraw Approval', url:'member-withdraw.html', icon:'bi-cash-coin', parentKey:'wallet', sortOrder:14},
    {menuKey:'payment_method', title:'Payment Method Config', url:'payment-method.html', icon:'bi-credit-card', parentKey:'wallet', sortOrder:15},
    {menuKey:'referral', title:'Referral Network', url:'referral.html', icon:'bi-diagram-3', parentKey:'wallet', sortOrder:16},
    {menuKey:'provider_session', title:'Provider Sessions', url:'player-provider-session.html', icon:'bi-box-arrow-up-right', parentKey:'wallet', sortOrder:14},
    {menuKey:'provider_bet_report', title:'Provider Bet Report', url:'provider-bet-report.html', icon:'bi-graph-up-arrow', parentKey:'wallet', sortOrder:15},
    {menuKey:'wbet_bet_limit', title:'WBET Bet Limit', url:'wbet-bet-limit.html', icon:'bi-sliders', parentKey:'wallet', sortOrder:16},
    {menuKey:'provider_wallet_transaction', title:'Provider Transactions', url:'provider-wallet-transaction.html', icon:'bi-journal-text', parentKey:'wallet', sortOrder:16},
    {menuKey:'admin', title:'Admin Management', url:'admin-user.html', icon:'bi-shield-lock', parentKey:'', sortOrder:20},
    {menuKey:'role', title:'Role & Menu Permission', url:'role.html', icon:'bi-person-badge', parentKey:'access', sortOrder:30},
    {menuKey:'menu_management', title:'Menu Management', url:'menu-management.html', icon:'bi-list-check', parentKey:'access', sortOrder:31},
    {menuKey:'admin_login_log', title:'Admin Login Log', url:'admin-login-log.html', icon:'bi-clock-history', parentKey:'access', sortOrder:32},
    {menuKey:'admin_operation_log', title:'Admin Operation Log', url:'admin-operation-log.html', icon:'bi-journal-text', parentKey:'access', sortOrder:33},
    {menuKey:'account_lock', title:'Account Lock', url:'account-lock.html', icon:'bi-lock', parentKey:'access', sortOrder:34},
    {menuKey:'live_chat', title:'Live Chat', url:'livechat.html', icon:'bi-chat-dots', parentKey:'support', sortOrder:55},
    {menuKey:'livechat_template', title:'Template Messages', url:'livechat-template.html', icon:'bi-chat-square-text', parentKey:'support', sortOrder:56},
    {menuKey:'language', title:'Language & Translation', url:'language.html', icon:'bi-translate', parentKey:'', sortOrder:40},
    {menuKey:'image', title:'Image To URL', url:'image-to-url.html', icon:'bi-image', parentKey:'', sortOrder:50},
    {menuKey:'slider', title:'Slider Banner', url:'slider.html', icon:'bi-images', parentKey:'', sortOrder:60},
    {menuKey:'game_provider', title:'Provider', url:'game-provider.html', icon:'bi-hdd-network', parentKey:'game', sortOrder:69},
    {menuKey:'game_category', title:'Game Category', url:'game-category.html', icon:'bi-grid-3x3-gap', parentKey:'game', sortOrder:70},
    {menuKey:'game_sub_category', title:'Game Sub Category', url:'game-sub-category.html', icon:'bi-diagram-3', parentKey:'game', sortOrder:71},
    {menuKey:'game', title:'Game', url:'game.html', icon:'bi-joystick', parentKey:'game', sortOrder:72},
    {menuKey:'bonus_title', title:'Bonus Title', url:'bonus-category-title.html', icon:'bi-gift', parentKey:'bonus', sortOrder:80},
    {menuKey:'bonus_item', title:'Bonus Item', url:'bonus-category-item.html', icon:'bi-gift-fill', parentKey:'bonus', sortOrder:81},
    {menuKey:'promotion_bonus', title:'Promotion Bonus', url:'promotion.html', icon:'bi-gift', parentKey:'bonus', sortOrder:82},
    {menuKey:'rebate_management', title:'Rebate Management', url:'rebate-management.html', icon:'bi-percent', parentKey:'bonus', sortOrder:83},
    {menuKey:'manual_rebate_approval', title:'Manual Rebate Approval', url:'manual-rebate-approval.html', icon:'bi-check2-square', parentKey:'bonus', sortOrder:85},
    {menuKey:'rebate_log', title:'Rebate Log', url:'rebate-log.html', icon:'bi-journal-check', parentKey:'bonus', sortOrder:84},
    {menuKey:'promotion_debug', title:'Promotion Debug', url:'promotion-debug.html', icon:'bi-bug', parentKey:'bonus', sortOrder:83},
    {menuKey:'vip_management', title:'VIP Management', url:'vip-management.html', icon:'bi-gem', parentKey:'bonus', sortOrder:84},
    {menuKey:'vip_exp_log', title:'VIP EXP Log', url:'vip-exp-log.html', icon:'bi-clock-history', parentKey:'bonus', sortOrder:85},
    {menuKey:'vip_reward_log', title:'VIP Reward Log', url:'vip-reward-log.html', icon:'bi-cash-stack', parentKey:'bonus', sortOrder:86},
    {menuKey:'vip_worker_settings', title:'VIP Worker Settings', url:'vip-worker-settings.html', icon:'bi-clock-history', parentKey:'bonus', sortOrder:87},
    {menuKey:'site_customize', title:'Site Customize', url:'site-customize.html', icon:'bi-palette', parentKey:'', sortOrder:90},
    {menuKey:'layout_section', title:'Layout Section', url:'layout-section.html', icon:'bi-code-square', parentKey:'', sortOrder:91},
    {menuKey:'frontend_display', title:'Frontend Display', url:'frontend-display.html', icon:'bi-display', parentKey:'setting', sortOrder:91},
    {menuKey:'social', title:'Social', url:'social.html', icon:'bi-share', parentKey:'setting', sortOrder:92},
    {menuKey:'compliance_policy', title:'Compliance Policy', url:'compliance-policy.html', icon:'bi-file-earmark-lock', parentKey:'setting', sortOrder:93},
    {menuKey:'timezone_setting', title:'Timezone Setting', url:'timezone-setting.html', icon:'bi-globe2', parentKey:'setting', sortOrder:94}
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
    logout: function(){ localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); try{ sessionStorage.removeItem('bo_operation_login_marker'); sessionStorage.removeItem('bo_operation_login_played'); }catch(e){} window.location.href = 'login.html'; },
    requireLogin: function(){ if(!this.token() && !location.pathname.endsWith('/login.html')) window.location.href = 'login.html'; },
    allowedMenus: function(user){
      user = user || this.user();
      return (Array.isArray(user && user.menus) ? user.menus : [])
        .map(normalizeMenu)
        .filter(function(m){ return m.status === 1 && m.url && m.url !== '#' && m.menuKey !== 'menu_permission'; })
        .sort(function(a,b){ return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title); });
    },
    landingPage: function(user){
      const menus = this.allowedMenus(user);
      return menus.length ? menus[0].url : 'login.html';
    },
    enforcePageAccess: function(user){
      const current = pageName();
      const alwaysAllowed = ['profile.html','change-password.html','rebate-management.html','rebate-log.html','manual-rebate-approval.html', 'timezone-setting.html', 'win-lose-report.html', 'online-users.html', 'daily-rebate-report.html'];
      if(alwaysAllowed.indexOf(current) !== -1) return true;
      const menus = this.allowedMenus(user);
      if(!menus.length){
        this.logout();
        return false;
      }
      const allowed = menus.some(function(m){ return (m.url || '').split('/').pop() === current; });
      if(!allowed){
        const landing = this.landingPage(user);
        if(landing && landing !== current) window.location.replace(landing);
        return false;
      }
      return true;
    },
    authHeader: function(){ return this.token() ? {'Authorization':'Bearer ' + this.token()} : {}; },
    loginUrl: function(){ return api('AUTH_ADMIN_LOGIN'); },
    createAdminUrl: function(){ return api('AUTH_ADMIN_CREATE'); },
    adminMeUrl: function(){ return api('AUTH_ADMIN_ME'); },
    adminListUrl: function(){ return api('AUTH_ADMIN_LIST'); },
    adminLoginLogsUrl: function(){ return api('AUTH_ADMIN_LOGIN_LOGS'); },
    adminUpdateUrl: function(id){ return api('AUTH_ADMIN_UPDATE') + '/' + id; },
    adminDeleteUrl: function(id){ return api('AUTH_ADMIN_DELETE') + '/' + id; },
    profileUpdateUrl: function(){ return api('AUTH_ADMIN_PROFILE_UPDATE'); },
    changePasswordUrl: function(){ return api('AUTH_ADMIN_CHANGE_PASSWORD'); },
    roleListUrl: function(){ return api('ROLE_LIST'); },
    roleSaveUrl: function(){ return api('ROLE_SAVE'); },
    menuListUrl: function(){ return api('MENU_LIST'); },
    menuListAllUrl: function(){ return api('MENU_LIST_ALL'); },
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
        if(res.ok && json.status !== 'error' && json.data){ this.saveUser(json.data); this.enforcePageAccess(json.data); return json.data; }
        if(json.message === 'Unauthorized') this.logout();
      }catch(e){}
      const user = this.user();
      this.renderSidebar(user);
      this.enforcePageAccess(user);
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

      menus = menus.map(normalizeMenu).filter(m => m.status === 1 && m.url && m.url !== '#' && m.menuKey !== 'menu_permission')
        .map(m => m.menuKey === 'role' ? Object.assign({}, m, {title:'Role & Menu Permission'}) : m)
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
      // Some legacy pages call this explicitly while auth.js also initializes it
      // on DOMContentLoaded. Bind only once; duplicate delegated listeners would
      // toggle an accordion open and immediately closed on the same click.
      if(window.__boDynamicSidebarEventsBound) return;
      window.__boDynamicSidebarEventsBound = true;
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
    headerCountersHtml: function(){
      return '<div class="bo-header-counters" data-bo-header-counters>' +
        '<a class="bo-header-counter" href="index.html" data-operation-notification-ack="members" title="New members registered today" aria-label="New members registered today">' +
          '<span class="bo-header-counter-icon members"><i class="bi bi-person-plus"></i></span>' +
          '<span class="bo-header-counter-text"><small>Members</small><b data-header-new-members>0</b></span>' +
        '</a>' +
        '<a class="bo-header-counter" href="member-deposit.html" data-operation-notification-ack="wallet" title="Pending deposit requests" aria-label="Pending deposit requests">' +
          '<span class="bo-header-counter-icon deposit"><i class="bi bi-wallet2"></i></span>' +
          '<span class="bo-header-counter-text"><small>Deposit</small><b data-header-pending-deposit>0</b></span>' +
        '</a>' +
        '<a class="bo-header-counter" href="member-withdraw.html" data-operation-notification-ack="wallet" title="Pending withdrawal requests" aria-label="Pending withdrawal requests">' +
          '<span class="bo-header-counter-icon withdraw"><i class="bi bi-arrow-left-right"></i></span>' +
          '<span class="bo-header-counter-text"><small>Withdraw</small><b data-header-pending-withdraw>0</b></span>' +
        '</a>' +
      '</div>';
    },
    countFromListResponse: function(json){
      const data = json && json.data;
      if(Array.isArray(data)) return data.length;
      if(data && data.pagination && data.pagination.totalElements != null) return Number(data.pagination.totalElements) || 0;
      if(data && data.totalElements != null) return Number(data.totalElements) || 0;
      if(data && Array.isArray(data.content)) return data.content.length;
      return 0;
    },
    loadHeaderCounters: async function(){
      if(!this.token()) return;
      const headers = {...this.authHeader()};
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth()+1).padStart(2,'0');
      const d = String(today.getDate()).padStart(2,'0');
      const todayKey = y+'-'+m+'-'+d;
      const set = function(selector, value){ document.querySelectorAll(selector).forEach(function(el){ el.textContent = Number(value || 0).toLocaleString(); }); };
      const safeJson = async function(url){
        const res = await fetch(url,{headers:headers});
        const json = await res.json().catch(function(){ return {}; });
        if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
        return json;
      };
      try{
        const json = await safeJson(this.memberListUrl());
        const data = json && json.data;
        const rows = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
        const count = rows.filter(function(row){
          const raw = row && (row.createdAt || row.registerDate || row.created_at);
          if(!raw) return false;
          return String(raw).replace('T',' ').slice(0,10) === todayKey;
        }).length;
        set('[data-header-new-members]', count);
      }catch(e){ set('[data-header-new-members]', 0); }
      try{
        const json = await safeJson(api('MEMBER_DEPOSIT_LIST') + '?status=PENDING&page=1&size=1');
        set('[data-header-pending-deposit]', this.countFromListResponse(json));
      }catch(e){ set('[data-header-pending-deposit]', 0); }
      try{
        const json = await safeJson(api('MEMBER_WITHDRAW_LIST') + '?status=PENDING&page=1&size=1');
        set('[data-header-pending-withdraw]', this.countFromListResponse(json));
      }catch(e){ set('[data-header-pending-withdraw]', 0); }
    },
    profileHtml: function(){
      const user = this.user();
      const name = displayName(user);
      return this.headerCountersHtml() + '<div class="report-profile-wrap">' +
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
      this.loadHeaderCounters();
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
