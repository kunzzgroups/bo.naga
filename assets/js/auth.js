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
  function displayMenuTitle(title){
    const cleaned = String(title || '')
      .replace(/^\s*\d+[\.\)]\s*/, '')
      .replace(/\bBussiness\b/gi, 'Business')
      .trim();
    return cleaned || String(title || 'Menu');
  }
  function pageName(){
    return (location.pathname || '').split('/').pop() || 'index.html';
  }
  function sidebarActivePage(){
    const p=pageName();
    if(p==='main-balance-adjustment.html') return 'main-balance-overview.html';
    if(p==='brand-detail.html') return 'brand-management.html';
    if(p==='provider-detail.html') return 'main-accounting-report.html';
    return p;
  }

  const GROUP_META = window.BO_MENU_GROUP_META = {
    access: { title: 'Access Control', icon: 'bi-shield-lock' },
    game: { title: 'Game Management', icon: 'bi-controller' },
    bonus: { title: 'Bonus Management', icon: 'bi-gift' },
    support: { title: 'Support', icon: 'bi-headset' },
    wallet: { title: 'Wallet Management', icon: 'bi-wallet2' },
    setting: { title: 'Setting', icon: 'bi-gear' },
    report: { title: 'Report', icon: 'bi-wallet2' },
    agent_management_group: { title: 'Agent Management', icon: 'bi-person-workspace' },
    main_reports_group: { title: 'Reports', icon: 'bi-file-earmark-bar-graph', sortOrder: 30 },
    main_accounting_group: { title: 'Accounting & Provider Ops', icon: 'bi-cash-stack', sortOrder: 40 },
    main_brands_group: { title: 'Brands', icon: 'bi-buildings', sortOrder: 50 }
  };

  // Used only when backend has not returned menu data yet.
  // Normal sidebar is rendered from /auth/admin/me => user.menus.
  const FALLBACK_MENUS = [
    {menuKey:'root_control', title:'Root Control', url:'root-control.html', icon:'bi-shield-fill-check', parentKey:'', sortOrder:5},
    {menuKey:'brand_overview', title:'Brand Overview', url:'brand-overview.html', icon:'bi-bar-chart-line-fill', parentKey:'report', sortOrder:5.5},
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
    {menuKey:'bank_deposit_usage', title:'Bank Deposit Usage', url:'bank-deposit-usage.html', icon:'bi-bar-chart-line', parentKey:'wallet', sortOrder:15.1},
    {menuKey:'referral', title:'Referral Network', url:'referral.html', icon:'bi-diagram-3', parentKey:'wallet', sortOrder:16},
    {menuKey:'agent_management', title:'Agent Management', url:'agent-management.html', icon:'bi-person-workspace', parentKey:'wallet', sortOrder:16.5},
    {menuKey:'provider_session', title:'Provider Sessions', url:'player-provider-session.html', icon:'bi-box-arrow-up-right', parentKey:'wallet', sortOrder:14},
    {menuKey:'provider_bet_report', title:'Provider Bet Report', url:'provider-bet-report.html', icon:'bi-graph-up-arrow', parentKey:'wallet', sortOrder:15},
    {menuKey:'wbet_bet_limit', title:'WBET Bet Limit', url:'wbet-bet-limit.html', icon:'bi-sliders', parentKey:'wallet', sortOrder:16},
    {menuKey:'provider_wallet_transaction', title:'Provider Transactions', url:'provider-wallet-transaction.html', icon:'bi-journal-text', parentKey:'wallet', sortOrder:16},
    {menuKey:'admin', title:'Admin Management', url:'admin-user.html', icon:'bi-shield-lock', parentKey:'', sortOrder:20},
    {menuKey:'brand_management', title:'Branding Management', url:'brand-management.html', icon:'bi-buildings', parentKey:'', sortOrder:21},
    {menuKey:'role', title:'Role & Menu Permission', url:'role.html', icon:'bi-person-badge', parentKey:'access', sortOrder:30},
    {menuKey:'menu_management', title:'Menu Management', url:'menu-management.html', icon:'bi-list-check', parentKey:'access', sortOrder:31},
    {menuKey:'admin_login_log', title:'Admin Login Log', url:'admin-login-log.html', icon:'bi-clock-history', parentKey:'access', sortOrder:32},
    {menuKey:'admin_operation_log', title:'Admin Operation Log', url:'admin-operation-log.html', icon:'bi-journal-text', parentKey:'access', sortOrder:33},
    {menuKey:'account_lock', title:'Account Lock', url:'account-lock.html', icon:'bi-lock', parentKey:'access', sortOrder:34},
    {menuKey:'ip_whitelist_security', title:'IP Whitelist Security', url:'ip-whitelist-security.html', icon:'bi-shield-lock-fill', parentKey:'access', sortOrder:35},
    {menuKey:'live_chat', title:'Live Chat', url:'livechat.html', icon:'bi-chat-dots', parentKey:'support', sortOrder:55},
    {menuKey:'livechat_template', title:'Template Messages', url:'livechat-template.html', icon:'bi-chat-square-text', parentKey:'support', sortOrder:56},
    {menuKey:'language', title:'Language & Translation', url:'language.html', icon:'bi-translate', parentKey:'', sortOrder:40},
    {menuKey:'image', title:'Image To URL', url:'image-to-url.html', icon:'bi-image', parentKey:'', sortOrder:50},
    {menuKey:'slider', title:'Slider Banner', url:'slider.html', icon:'bi-images', parentKey:'', sortOrder:60},
    {menuKey:'game_provider', title:'Provider', url:'game-provider.html', icon:'bi-hdd-network', parentKey:'game', sortOrder:69},
    {menuKey:'game_category', title:'Game Category', url:'game-category.html', icon:'bi-grid-3x3-gap', parentKey:'game', sortOrder:70},
    {menuKey:'game_sub_category', title:'Game Sub Category', url:'game-sub-category.html', icon:'bi-diagram-3', parentKey:'game', sortOrder:71},
    {menuKey:'game', title:'Game', url:'game.html', icon:'bi-joystick', parentKey:'game', sortOrder:72},
    {menuKey:'animation_effect', title:'Animation Effect', url:'animation-effect.html', icon:'bi-stars', parentKey:'game', sortOrder:73},
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
    {menuKey:'advertisement_popup', title:'Advertisement Popup', url:'advertisement-popup.html', icon:'bi-window-stack', parentKey:'setting', sortOrder:94},
    {menuKey:'social', title:'Social', url:'social.html', icon:'bi-share', parentKey:'setting', sortOrder:92},
    {menuKey:'compliance_policy', title:'Compliance Policy', url:'compliance-policy.html', icon:'bi-file-earmark-lock', parentKey:'setting', sortOrder:93},
    {menuKey:'timezone_setting', title:'Timezone Setting', url:'timezone-setting.html', icon:'bi-globe2', parentKey:'setting', sortOrder:94}
  ];

  try{(JSON.parse(localStorage.getItem('bo_menu_group_meta_v1')||'[]')||[]).forEach(function(g){const key=String(g.groupKey||'').trim();if(key)GROUP_META[key]={title:String(g.title||key),icon:String(g.icon||'bi-folder'),sortOrder:Number(g.sortOrder||100)};});}catch(e){}

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
    const active = sidebarActivePage() === (m.url || '').split('/').pop();
    const cls = (isSub ? 'report-sub ' : '') + (active ? 'active' : '');
    return '<a href="' + href + '" class="' + cls.trim() + '" data-menu-key="' + esc(m.menuKey) + '">' +
      '<span><i class="bi ' + esc(m.icon || 'bi-circle') + ' me-2"></i>' + esc(displayMenuTitle(m.title)) + '</span></a>';
  }

  window.BO_AUTH = {
    tokenKey: 'bo_admin_token',
    userKey: 'bo_admin_user',
    token: function(){ return localStorage.getItem(this.tokenKey) || ''; },
    user: function(){ try { return JSON.parse(localStorage.getItem(this.userKey) || '{}'); } catch(e){ return {}; } },
    save: function(json){ localStorage.setItem(this.tokenKey, json.token || ''); localStorage.setItem(this.userKey, JSON.stringify(json.data || {})); try{sessionStorage.setItem('bo_admin_me_refreshed_at',String(Date.now()));}catch(e){} },
    saveUser: function(user){ localStorage.setItem(this.userKey, JSON.stringify(user || {})); this.renderProfile(); this.renderSidebar(user); },
    logout: function(){ localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); try{ sessionStorage.removeItem('bo_operation_login_marker'); sessionStorage.removeItem('bo_operation_login_played'); sessionStorage.removeItem('bo_admin_me_refreshed_at'); sessionStorage.removeItem('bo_brand_context_cache_v3'); }catch(e){} window.location.href = 'login.html'; },
    requireLogin: function(){ if(!this.token() && !location.pathname.endsWith('/login.html')) window.location.href = 'login.html'; },
    allowedMenus: function(user){
      user = user || this.user();
      const isRoot = !!(user && (user.rootAdmin === true || String(user.roleType || '').toUpperCase() === 'ROOT'));
      const rootOnlyMenus = new Set(['menu_management','root_control']);
      return (Array.isArray(user && user.menus) ? user.menus : [])
        .map(normalizeMenu)
        .filter(function(m){
          if(!(m.status === 1 && m.url && m.url !== '#' && m.menuKey !== 'menu_permission')) return false;
          if(!isRoot && rootOnlyMenus.has(String(m.menuKey || '').toLowerCase())) return false;
          return true;
        })
        .sort(function(a,b){ return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title); });
    },
    landingPage: function(user){
      user = user || this.user();
      const menus = this.allowedMenus(user);
      // ROOT-configured menu sort order is authoritative for every role, including MAIN/Boss.
      // Do not impose a frontend MAIN landing-page allowlist/order.
      return menus.length ? menus[0].url : 'login.html';
    },
    enforcePageAccess: function(user){
      let current = pageName();
      // Agent detail inherits Agents access. Agent Management sub-pages keep their
      // own permission so a Master can be granted Commission/Settlement/etc.
      // independently. Legacy agent_management permission remains a fallback below.
      if(current === 'agent-detail.html') current = 'agent-management.html';
      // Brand Detail is a drill-down of Brand Management and has no separate sidebar permission.
      // Inherit Brand Management access so MAIN/Boss users with Brands permission are not redirected.
      if(current === 'brand-detail.html') current = 'brand-management.html';
      if(current === 'provider-detail.html') current = 'main-accounting-report.html';
      if(current === 'main-balance-adjustment.html') current = 'main-balance-overview.html';
      // Agent Performance Detail is a drill-down page of Agent Performance Report.
      // It has no separate sidebar/menu permission, so inherit the report permission
      // instead of redirecting the user to their landing page.
      if(current === 'agent-performance-detail.html') current = 'agent-performance-report.html';
      const agentChildPages = new Set([
        'agent-commission-admin.html','agent-settlement-admin.html','agent-reimbursement-admin.html',
        'agent-payout-admin.html','agent-promotion-admin.html'
      ]);
      const requestedAgentChild = agentChildPages.has(pageName());
      if(current === 'main-stat-detail.html'){
        let source = '';
        try { source = String(new URLSearchParams(location.search || '').get('source') || 'overview').toLowerCase(); } catch(e) {}
        current = (source && source !== 'overview') ? 'main-accounting-report.html' : 'main-dashboard.html';
      }
      const alwaysAllowed = ['profile.html','change-password.html','rebate-management.html','animation-effect.html'];
      if(alwaysAllowed.indexOf(current) !== -1) return true;
      const menus = this.allowedMenus(user);
      if(!menus.length){
        this.logout();
        return false;
      }
      let allowed = menus.some(function(m){ return (m.url || '').split('/').pop() === current; });
      // Backward compatibility: older roles may only have the original
      // agent_management menu. That parent permission is allowed to open the new
      // Agent Management child pages, while newly configured roles can grant each
      // child page separately.
      if(!allowed && requestedAgentChild){
        allowed = menus.some(function(m){ return String(m.menuKey || '').toLowerCase() === 'agent_management'; });
      }
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
    roleListAllUrl: function(){ return API_CONFIG.BASE_URL + (API_CONFIG.ENDPOINTS.ROLE_LIST_ALL || "/admin/access/roles/all"); },
    roleSaveUrl: function(){ return api('ROLE_SAVE'); },
    menuListUrl: function(){ return api('MENU_LIST'); },
    menuListAllUrl: function(){ return api('MENU_LIST_ALL'); },
    menuSaveUrl: function(){ return api('MENU_SAVE'); },
    menuGroupListUrl: function(){ return api('MENU_GROUP_LIST'); },
    menuGroupListAllUrl: function(){ return api('MENU_GROUP_LIST_ALL'); },
    menuGroupSaveUrl: function(){ return api('MENU_GROUP_SAVE'); },
    menuGroupDeleteUrl: function(id){ return api('MENU_GROUP_DELETE') + '/' + id + '/delete'; },
    roleMenusUrl: function(roleId){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROLE_MENU_GET + '/' + roleId + '/menus'; },
    memberListUrl: function(){ return api('MEMBER_LIST'); },
    memberCreateUrl: function(){ return api('MEMBER_CREATE'); },
    memberUpdateUrl: function(id){ return api('MEMBER_UPDATE') + '/' + id; },
    loadMenuGroups: async function(){
      if(!this.token()) return [];
      try{
        const res=await fetch(this.menuGroupListUrl(),{headers:{...this.authHeader()},cache:'no-store'});
        const json=await res.json().catch(function(){return {};});
        if(!res.ok||json.status==='error')return [];
        const list=Array.isArray(json.data)?json.data:[];
        list.forEach(function(g){
          const key=String(g.groupKey||'').trim(); if(!key)return;
          GROUP_META[key]={title:String(g.title||key),icon:String(g.icon||'bi-folder'),sortOrder:Number(g.sortOrder||100)};
        });
        try{localStorage.setItem('bo_menu_group_meta_v1',JSON.stringify(list));}catch(e){}
        return list;
      }catch(e){return [];}
    },
    refreshMe: async function(force){
      if(!this.token()) return null;
      const cached=this.user();
      let last=0;try{last=Number(sessionStorage.getItem('bo_admin_me_refreshed_at')||0);}catch(e){}
      // Menus/profile are already stored after login. Revalidate periodically instead of
      // firing /auth/admin/me on every single BO page navigation.
      if(!force && cached && cached.username && Array.isArray(cached.menus) && Date.now()-last<30000){
        await this.loadMenuGroups();this.renderSidebar(cached);this.enforcePageAccess(cached);return cached;
      }
      try{
        const res = await fetch(this.adminMeUrl(), {headers: {...this.authHeader()}});
        const json = await res.json().catch(() => ({}));
        if(res.ok && json.status !== 'error' && json.data){try{sessionStorage.setItem('bo_admin_me_refreshed_at',String(Date.now()));}catch(e){} await this.loadMenuGroups();this.saveUser(json.data); this.enforcePageAccess(json.data); return json.data; }
        if(json.message === 'Unauthorized') this.logout();
      }catch(e){}
      this.renderSidebar(cached);
      this.enforcePageAccess(cached);
      return cached;
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

      // Bank Deposit Usage is an independent permission controlled by Master.


      // Advertisement Popup is a companion frontend-configuration page. Keep it visible
      // immediately for admins that already have frontend/site customization access.
      if(menus.some(m => ['site_customize','frontend_display'].includes(String(m.menuKey||'')))
          && !menus.some(m => String(m.menuKey||'') === 'advertisement_popup')){
        menus = menus.concat([{menuKey:'advertisement_popup', title:'Advertisement Popup', url:'advertisement-popup.html', icon:'bi-window-stack', parentKey:'setting', sortOrder:94, status:1}]);
      }

      if(String(user.roleType||'').toUpperCase()==='MAIN'){
        // ROOT Menu Management + Role/Menu Permission are the source of truth.
        // Never synthesize, expand, or silently grant MAIN/Boss child menus here.
        // A configured parent access row (url '#') controls its matching group and
        // every actual child page must also be explicitly assigned to the role.
        const assigned = menus.map(normalizeMenu);
        const grantedKeys = new Set(assigned.map(m=>String(m.menuKey||'').trim().toLowerCase()));
        menus = assigned.filter(function(m){
          const parent = String(m.parentKey||'').trim().toLowerCase();
          if(parent && /^main_.+_group$/.test(parent)){
            const accessKey = parent.replace(/_group$/, '_access');
            if(!grantedKeys.has(accessKey)) return false;
          }
          return true;
        });
      }

      // Backward compatibility for older databases that only have the single
      // agent_management permission. Once Agent Management submenu records exist in
      // Menu Management, the database is the source of truth and nothing is injected.
      // This prevents the same submenu from being rendered twice after an admin adds
      // Agents / Commission / Settlement / Reimbursement / Payout / Promotion manually.
      const hasAgentManagementPermission = menus.some(m => String(m.menuKey||'').toLowerCase()==='agent_management');
      const hasDbAgentManagementChildren = menus.some(m => String(m.parentKey||'').toLowerCase()==='agent_management_group');
      if(hasAgentManagementPermission && !hasDbAgentManagementChildren){
        menus = menus.filter(m => String(m.menuKey||'').toLowerCase()!=='agent_management').concat([
          {menuKey:'agent_management',title:'Agents',url:'agent-management.html',icon:'bi-people',parentKey:'agent_management_group',sortOrder:22,status:1},
          {menuKey:'agent_commission',title:'Commission',url:'agent-commission-admin.html',icon:'bi-percent',parentKey:'agent_management_group',sortOrder:22.1,status:1},
          {menuKey:'agent_settlement',title:'Settlement',url:'agent-settlement-admin.html',icon:'bi-receipt',parentKey:'agent_management_group',sortOrder:22.2,status:1},
          {menuKey:'agent_reimbursement',title:'Reimbursement / Ad Claim',url:'agent-reimbursement-admin.html',icon:'bi-file-earmark-arrow-up',parentKey:'agent_management_group',sortOrder:22.3,status:1},
          {menuKey:'agent_payout',title:'Withdraw / Payout',url:'agent-payout-admin.html',icon:'bi-cash-stack',parentKey:'agent_management_group',sortOrder:22.4,status:1},
          {menuKey:'agent_promotion',title:'Promotion',url:'agent-promotion-admin.html',icon:'bi-megaphone',parentKey:'agent_management_group',sortOrder:22.5,status:1}
        ]);
      }

      // Defensive de-duplication: one logical menu is rendered once even if legacy
      // seed data and a newly-created DB record overlap. Prefer the DB/user.menus
      // entry encountered first and compare by menuKey, then URL as a fallback.
      {
        const seenMenuKeys = new Set();
        const seenUrls = new Set();
        menus = menus.filter(function(m){
          const key = String(m && m.menuKey || '').trim().toLowerCase();
          const url = String(m && m.url || '').trim().toLowerCase();
          if(key && seenMenuKeys.has(key)) return false;
          if(url && url !== '#' && seenUrls.has(url)) return false;
          if(key) seenMenuKeys.add(key);
          if(url && url !== '#') seenUrls.add(url);
          return true;
        });
      }

      const isRootSidebar = !!(user && (user.rootAdmin === true || String(user.roleType || '').toUpperCase() === 'ROOT'));
      const rootOnlySidebarMenus = new Set(['menu_management','root_control']);
      menus = menus.map(normalizeMenu).filter(m => m.status === 1 && m.url && m.url !== '#' && m.menuKey !== 'menu_permission' && (isRootSidebar || !rootOnlySidebarMenus.has(String(m.menuKey || '').toLowerCase())))
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

      const activePage = sidebarActivePage();
      let html = '';
      top.forEach(m => { html += menuLinkHtml(m, false); });
      Object.keys(groups).sort((a,b) => {
        const metaA=GROUP_META[a]||{}, metaB=GROUP_META[b]||{};
        const groupA=Number(metaA.sortOrder); const groupB=Number(metaB.sortOrder);
        if(Number.isFinite(groupA)&&Number.isFinite(groupB)&&groupA!==groupB)return groupA-groupB;
        const minA = Math.min.apply(null, groups[a].map(x => x.sortOrder));
        const minB = Math.min.apply(null, groups[b].map(x => x.sortOrder));
        return minA - minB;
      }).forEach(key => {
        const items = groups[key].sort((a,b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
        const meta = GROUP_META[key] || {title: key.replace(/[_-]+/g,' ').replace(/\b\w/g, c => c.toUpperCase()), icon: 'bi-folder'};
        const isOpen = items.some(m => activePage === (m.url || '').split('/').pop());
        html += '<div class="nav-group ' + (isOpen ? 'open' : '') + '" data-menu-group="' + esc(key) + '">' +
          '<button type="button" class="nav-group-btn" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
          '<span><i class="bi ' + esc(meta.icon) + ' me-2"></i>' + esc(displayMenuTitle(meta.title)) + '</span><i class="bi bi-chevron-down"></i></button>' +
          '<div class="nav-group-list ' + (isOpen ? 'show' : '') + '">' + items.map(m => menuLinkHtml(m, true)).join('') + '</div></div>';
      });
      nav.innerHTML = html;

      // Account actions live outside the menu permission tree. Logout is always
      // available at the bottom of the BO sidebar and does not alter ROOT-managed menus.
      const sidebar = nav.closest('.report-sidebar');
      if(sidebar){
        let footer = sidebar.querySelector('.bo-sidebar-account-footer');
        if(!footer){
          footer = document.createElement('div');
          footer.className = 'bo-sidebar-account-footer';
          sidebar.appendChild(footer);
        }
        footer.innerHTML = '<a class="bo-sidebar-logout" href="#logout" data-bo-logout title="Logout"><i class="bi bi-box-arrow-right"></i><span>Logout</span></a>';
      }
    },
    bindDynamicSidebarEvents: function(){
      // Some legacy pages call this explicitly while auth.js also initializes it
      // on DOMContentLoaded. Bind only once; duplicate delegated listeners would
      // toggle an accordion open and immediately closed on the same click.
      if(window.__boDynamicSidebarEventsBound) return;
      window.__boDynamicSidebarEventsBound = true;
      function positionSidebarFlyout(group){
        if(!group || window.innerWidth < 992) return;
        const btn = group.querySelector('.nav-group-btn');
        const sidebar = group.closest('.report-sidebar');
        const list = group.querySelector('.nav-group-list');
        if(!btn || !sidebar || !list) return;
        const br = btn.getBoundingClientRect();
        const sr = sidebar.getBoundingClientRect();
        const left = Math.max(8, Math.round(sr.right + 2));
        let top = Math.max(12, Math.round(br.top));
        group.style.setProperty('--bo-sidebar-flyout-left', left + 'px');
        group.style.setProperty('--bo-sidebar-flyout-top', top + 'px');
        requestAnimationFrame(function(){
          const h = Math.min(list.scrollHeight || 0, Math.max(120, window.innerHeight - 24));
          if(top + h > window.innerHeight - 12){
            top = Math.max(12, window.innerHeight - h - 12);
            group.style.setProperty('--bo-sidebar-flyout-top', Math.round(top) + 'px');
          }
        });
      }
      const sidebarFlyoutHoverTimers = new WeakMap();
      function closeSidebarFlyoutImmediately(group){
        if(!group) return;
        const timer = sidebarFlyoutHoverTimers.get(group);
        if(timer) clearTimeout(timer);
        sidebarFlyoutHoverTimers.delete(group);
        // Suppress any fade/slide frame while switching groups. This guarantees
        // the old flyout is gone before the next flyout is painted.
        group.classList.add('bo-flyout-instant-hide');
        group.classList.remove('bo-flyout-hover', 'open');
        group.querySelector('.nav-group-list')?.classList.remove('show');
        group.querySelector('.nav-group-btn')?.setAttribute('aria-expanded','false');
        // Force the hidden state now, then release the helper class next frame.
        void group.offsetWidth;
        requestAnimationFrame(function(){ group.classList.remove('bo-flyout-instant-hide'); });
      }
      function openSidebarFlyoutOnHover(group){
        if(!group || window.innerWidth < 992 || !group.closest('.report-sidebar')) return;

        const previous = window.__boSidebarActiveFlyout;
        if(previous && previous !== group) closeSidebarFlyoutImmediately(previous);
        document.querySelectorAll('.report-sidebar .nav-group').forEach(function(other){
          if(other !== group && other !== previous && (other.classList.contains('bo-flyout-hover') || other.classList.contains('open'))){
            closeSidebarFlyoutImmediately(other);
          }
        });

        const pending = sidebarFlyoutHoverTimers.get(group);
        if(pending) clearTimeout(pending);
        sidebarFlyoutHoverTimers.delete(group);
        window.__boSidebarActiveFlyout = group;
        positionSidebarFlyout(group);
        group.classList.remove('bo-flyout-instant-hide');
        group.classList.add('bo-flyout-hover');
      }
      function scheduleSidebarFlyoutHoverClose(group){
        if(!group || window.innerWidth < 992) return;
        const pending = sidebarFlyoutHoverTimers.get(group);
        if(pending) clearTimeout(pending);
        const timer = setTimeout(function(){
          sidebarFlyoutHoverTimers.delete(group);
          const list = group.querySelector('.nav-group-list');
          if(group.matches(':hover') || (list && list.matches(':hover'))) return;
          group.classList.remove('bo-flyout-hover');
          if(window.__boSidebarActiveFlyout === group) window.__boSidebarActiveFlyout = null;
        }, 260);
        sidebarFlyoutHoverTimers.set(group, timer);
      }
      document.addEventListener('mouseover', function(e){
        if(window.innerWidth < 992) return;
        const group = e.target.closest && e.target.closest('.report-sidebar .nav-group');
        if(group) openSidebarFlyoutOnHover(group);
      });
      document.addEventListener('mouseout', function(e){
        if(window.innerWidth < 992) return;
        const group = e.target.closest && e.target.closest('.report-sidebar .nav-group');
        if(!group) return;
        const next = e.relatedTarget;
        if(next && group.contains(next)) return;
        scheduleSidebarFlyoutHoverClose(group);
      });
      document.addEventListener('click', function(e){
        const btn = e.target.closest && e.target.closest('.nav-group-btn');
        if(btn){
          e.preventDefault();
          const group = btn.closest('.nav-group');
          const list = group && group.querySelector('.nav-group-list');
          if(!group || !list) return;
          if(window.innerWidth >= 992){
            // Desktop flyouts are hover-only. Clicking a main menu must never pin
            // the flyout open or make the next page load with the flyout visible.
            // Keep the current hover flyout in place and let submenu links navigate.
            positionSidebarFlyout(group);
            group.classList.remove('open');
            list.classList.remove('show');
            btn.setAttribute('aria-expanded','false');
            return;
          }
          // Mobile/tablet keeps the original accordion click behaviour.
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
      const brandId=Number(localStorage.getItem('bo_active_brand_id')||1)||1;
      const stateKey='bo_operation_notification_state_v4_b'+brandId;
      const set=function(selector,value){document.querySelectorAll(selector).forEach(function(el){el.textContent=Number(value||0).toLocaleString();});};
      try{
        const cached=JSON.parse(localStorage.getItem(stateKey)||'null');
        if(cached){set('[data-header-new-members]',cached.members);set('[data-header-pending-deposit]',cached.deposit);set('[data-header-pending-withdraw]',cached.withdraw);}
      }catch(e){}
      // operation-global-notification.js owns the live counter refresh. Avoid three
      // extra list requests (including a full member list) on every BO page load.
      if(window.BO_OPERATION_NOTIFICATION_CONTROL&&typeof window.BO_OPERATION_NOTIFICATION_CONTROL.refresh==='function'){
        window.BO_OPERATION_NOTIFICATION_CONTROL.refresh();return;
      }
      try{
        const res=await fetch(api('OPERATION_NOTIFICATION_SUMMARY'),{headers:{...this.authHeader()},cache:'no-store'});
        const json=await res.json().catch(function(){return {};});
        if(!res.ok||json.status==='error')return;
        const d=(json&&json.data)||{};set('[data-header-new-members]',d.members);set('[data-header-pending-deposit]',d.deposit);set('[data-header-pending-withdraw]',d.withdraw);
      }catch(e){}
    },
    profileHtml: function(){
      const user = this.user();
      const name = displayName(user);
      const counters = String(user.roleType||'').toUpperCase()==='MAIN' ? '' : this.headerCountersHtml();
      return counters + '<a class="bo-account-link" href="profile.html" title="Account settings" aria-label="Open account settings">' +
        '<span class="report-avatar" data-admin-avatar>' + initials(name) + '</span>' +
        '<span class="bo-account-name" data-admin-name>' + esc(name) + '</span>' +
        '<i class="bi bi-gear bo-account-setting-icon" aria-hidden="true"></i>' +
        '</a>';
    },
    injectProfile: function(){
      document.querySelectorAll('[data-bo-profile]').forEach(el => { el.innerHTML = this.profileHtml(); });
      this.renderProfile();
      this.loadHeaderCounters();
      if(window.BO_BRAND&&typeof window.BO_BRAND.mount==='function') setTimeout(function(){ window.BO_BRAND.mount(); },0);
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
