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
  function sidebarActivePage(){
    const p=pageName();
    if(p==='main-balance-adjustment.html') return 'main-balance-overview.html';
    if(p==='main-provider-settlement.html' || p==='main-provider-balance.html' || p==='main-provider-transactions.html') return 'main_provider_report.html';
    if(p==='main-merchant-settlement.html' || p==='main-merchant-balance.html' || p==='main-merchant-transactions.html') return 'main_merchant_report.html';
    if(p==='brand-detail.html') return 'brand-management.html';
    if(p==='provider-detail.html') return 'main-accounting-report.html';
    // Gateway Transactions is a drill-down of Payment Gateway and uses the same DB menu permission.
    if(p==='payment-gateway-transactions.html') return 'payment-gateway.html';
    // Merchant module drill-downs keep the Merchant sidebar item highlighted.
    if(p==='main-merchant-create.html' || p==='main-merchant-credit.html' || p==='main-merchant-security.html' || p==='main-merchant-roles.html' || p==='main-merchant-role-create.html' || p==='main-merchant-profit.html' || p==='main-merchant-profit-record.html' || p==='merchant-profit.html'){
      return 'main-merchant-detail.html';
    }
    // Admin module drill-downs keep the Admin Details item highlighted.
    if(p==='main-admin-create.html' || p==='main-admin-edit.html' || p==='main-admin-credit.html'){
      return 'main-admin-detail.html';
    }
    return p;
  }

  // Sidebar group metadata is loaded from the database only via /admin/access/menu-groups.
  // Do not define, seed or repair sidebar groups in frontend code.
  const GROUP_META = window.BO_MENU_GROUP_META = {};

  function canonicalMenuUrl(menuKey, rawUrl){
    // Database Menu Management is authoritative. Never rewrite a configured menu URL in the sidebar.
    return String(rawUrl || '').trim();
  }

  function normalizeMenu(m){
    const menuKey = String((m && (m.menuKey || m.key)) || '');
    return {
      id: m && m.id,
      menuKey: menuKey,
      title: String((m && (m.title || m.name)) || 'Menu'),
      url: canonicalMenuUrl(menuKey, (m && (m.url || m.href)) || '#'),
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
      '<span><i class="bi ' + esc(m.icon || 'bi-circle') + ' me-2"></i>' + esc(m.title) + '</span></a>';
  }

  window.BO_AUTH = {
    tokenKey: 'bo_admin_token',
    userKey: 'bo_admin_user',
    token: function(){ return localStorage.getItem(this.tokenKey) || ''; },
    user: function(){ try { return JSON.parse(localStorage.getItem(this.userKey) || '{}'); } catch(e){ return {}; } },
    save: function(json){ localStorage.setItem(this.tokenKey, json.token || ''); localStorage.setItem(this.userKey, JSON.stringify(json.data || {})); try{sessionStorage.setItem('bo_admin_me_refreshed_at',String(Date.now()));}catch(e){} },
    saveUser: function(user){ localStorage.setItem(this.userKey, JSON.stringify(user || {})); this.renderProfile(); this.renderSidebar(user); },
    logout: function(){ try{ const t=localStorage.getItem(this.tokenKey); if(t) fetch(API_CONFIG.BASE_URL + '/auth/admin/logout',{method:'POST',headers:{'Authorization':'Bearer '+t},keepalive:true}).catch(()=>{}); }catch(e){} localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); try{ sessionStorage.removeItem('bo_operation_login_marker'); sessionStorage.removeItem('bo_operation_login_played'); sessionStorage.removeItem('bo_admin_me_refreshed_at'); sessionStorage.removeItem('bo_brand_context_cache_v3'); }catch(e){} window.location.href = 'login.html'; },
    requireLogin: function(){
      if(!this.token() && !location.pathname.endsWith('/login.html')){
        // Preserve the BO page the admin explicitly requested. Previously a direct
        // visit such as payment-gateway.html was lost when login.html opened, because
        // admin-login.js always sent the user to the first sidebar menu after login.
        // Keep only a local BO path (no origin) and let the destination page run the
        // normal ROOT-managed menu permission check after authentication.
        try{
          const requested=(location.pathname||'').split('/').pop() + (location.search||'') + (location.hash||'');
          if(requested && !/^login\.html(?:[?#]|$)/i.test(requested)) sessionStorage.setItem('bo_login_return_to',requested);
        }catch(e){}
        window.location.href = 'login.html';
      }
    },
    allowedMenus: function(user){
      user = user || this.user();
      // ROOT Menu Management + Role/Menu Permission are authoritative.
      // Do not hide a menu here based on role type after ROOT explicitly assigned it.
      return (Array.isArray(user && user.menus) ? user.menus : [])
        .map(normalizeMenu)
        .filter(function(m){
          return m.status === 1 && m.url && m.url !== '#';
        })
        .sort(function(a,b){ return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title); });
    },
    landingPage: function(user){
      user = user || this.user();
      const menus = this.allowedMenus(user);
      // ROOT-configured menu sort order is authoritative for every role, including MAIN/Boss.
      // Do not impose a frontend MAIN landing-page allowlist/order.
      return menus.length ? menus[0].url : 'profile.html';
    },
    enforcePageAccess: function(user){
      user = user || this.user();
      // ROOT is the unrestricted platform owner. ROOT must never depend on
      // admin_role_menu assignments to open BO pages; role/menu assignments are
      // for accounts that ROOT manages (MASTER/MAIN/brand/custom roles). Backend
      // authorization already treats ROOT as unrestricted as well.
      const roleType = String((user && user.roleType) || '').toUpperCase();
      if((user && user.rootAdmin === true) || roleType === 'ROOT') return true;
      let current = pageName();
      // Agent detail inherits Agents access. Agent Management sub-pages keep their
      // own permission so a Master can be granted Commission/Settlement/etc.
      // independently. Legacy agent_management permission remains a fallback below.
      if(current === 'agent-detail.html') current = 'agent-management.html';
      // Brand Detail is a drill-down of Brand Management and has no separate sidebar permission.
      // Inherit Brand Management access so MAIN/Boss users with Brands permission are not redirected.
      if(current === 'brand-detail.html') current = 'brand-management.html';
      if(current === 'provider-detail.html') current = 'main-accounting-report.html';
      // Transaction history is intentionally a separate page, but it inherits the
      // Payment Gateway menu selected in ROOT Role/Menu Permission. No new hardcoded
      // permission/menu row is required for this drill-down.
      if(current === 'payment-gateway-transactions.html') current = 'payment-gateway.html';
      if(current === 'main-balance-adjustment.html') current = 'main-balance-overview.html';
      // Agent Performance Detail is a drill-down page of Agent Performance Report.
      // It has no separate sidebar/menu permission, so inherit the report permission
      // instead of redirecting the user to their landing page.
      if(current === 'agent-performance-detail.html') current = 'agent-performance-report.html';
      // Create/Edit Admin / Security & Audit are drill-downs of Main Admin Detail.
      // Admin Credit Control page is retired; old bookmarks redirect via main-admin-credit.html.
      if(current === 'main-admin-create.html') current = 'main-admin-detail.html';
      if(current === 'main-admin-edit.html') current = 'main-admin-detail.html';
      if(current === 'main-admin-credit.html') current = 'main-admin-detail.html';
      if(current === 'main-admin-security.html') current = 'main-admin-detail.html';
      if(current === 'main-admin-role-create.html') current = 'menu-permission.html';
      // Merchant create / security / roles are drill-downs of Main Merchant Detail.
      // Merchant Credit Control page is retired; old bookmarks redirect via main-merchant-credit.html.
      if(current === 'main-merchant-create.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-credit.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-security.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-roles.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-role-create.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-profit.html') current = 'main-merchant-detail.html';
      if(current === 'main-merchant-profit-record.html') current = 'main-merchant-detail.html';
      if(current === 'merchant-profit.html') current = 'main-merchant-detail.html';
      const agentChildPages = new Set([
        'agent-commission-admin.html','agent-settlement-admin.html','agent-reimbursement-admin.html',
        'agent-payout-admin.html','agent-promotion-admin.html'
      ]);
      const requestedAgentChild = agentChildPages.has(pageName());
      const requestedMainAdminDetail = pageName() === 'main-admin-detail.html' || pageName() === 'main-admin-create.html' || pageName() === 'main-admin-edit.html';
      const requestedMainMerchantDetail = pageName() === 'main-merchant-detail.html' || pageName() === 'main-merchant-create.html' || pageName() === 'main-merchant-credit.html' || pageName() === 'main-merchant-security.html' || pageName() === 'main-merchant-roles.html' || pageName() === 'main-merchant-role-create.html' || pageName() === 'main-merchant-profit.html' || pageName() === 'main-merchant-profit-record.html' || pageName() === 'merchant-profit.html';
      if(current === 'main-stat-detail.html'){
        let source = '';
        try { source = String(new URLSearchParams(location.search || '').get('source') || 'overview').toLowerCase(); } catch(e) {}
        current = (source && source !== 'overview') ? 'main-accounting-report.html' : 'main-dashboard.html';
      }
      const alwaysAllowed = ['profile.html','change-password.html','rebate-management.html','animation-effect.html'];
      if(alwaysAllowed.indexOf(current) !== -1) return true;
      const menus = this.allowedMenus(user);
      if(!menus.length){
        // A valid authenticated admin may temporarily have no assigned BO menu (for example
        // a legacy delegated CS account while ROOT permissions are being adjusted). Do not
        // destroy the valid session and bounce back to login; keep the account signed in on
        // the always-available profile page until a menu is assigned.
        if(current !== 'profile.html') window.location.replace('profile.html');
        return current === 'profile.html';
      }
      let allowed = menus.some(function(m){ return (m.url || '').split('/').pop() === current; });
      // Backward compatibility: older roles may only have the original
      // agent_management menu. That parent permission is allowed to open the new
      // Agent Management child pages, while newly configured roles can grant each
      // child page separately.
      if(!allowed && requestedAgentChild){
        allowed = menus.some(function(m){ return String(m.menuKey || '').toLowerCase() === 'agent_management'; });
      }
      // MAIN Admin Detail inherits legacy Admin Management permission when the
      // dedicated main_admin_detail menu row is not yet assigned.
      if(!allowed && requestedMainAdminDetail){
        allowed = menus.some(function(m){
          const key = String(m.menuKey || '').toLowerCase();
          return key === 'admin' || key === 'main_admin_detail' || key === 'admin_detail';
        });
      }
      if(!allowed && requestedMainMerchantDetail){
        allowed = menus.some(function(m){
          const key = String(m.menuKey || '').toLowerCase();
          return key === 'main_merchant_detail' || key === 'merchant_detail' || key === 'merchant';
        });
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
    roleDeleteUrl: function(id){ return api('ROLE_DELETE') + '/' + id + '/delete'; },
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
        Object.keys(GROUP_META).forEach(function(key){ delete GROUP_META[key]; });
        list.forEach(function(g){
          const key=String(g.groupKey||'').trim(); if(!key)return;
          GROUP_META[key]={title:String(g.title||key),icon:String(g.icon||'bi-folder'),sortOrder:Number(g.sortOrder||0),status:Number(g.status==null?1:g.status)};
        });
        return list;
      }catch(e){return [];}
    },
    refreshMe: async function(force){
      if(!this.token()) return null;
      const cached=this.user();
      try{
        // Always re-read the authoritative DB-backed menu assignment. Menu parent/order/permission
        // changes made by ROOT must be reflected immediately after navigation/refresh.
        const [res] = await Promise.all([
          fetch(this.adminMeUrl(), {headers: {...this.authHeader()}, cache:'no-store'}),
          this.loadMenuGroups()
        ]);
        const json = await res.json().catch(() => ({}));
        if(res.ok && json.status !== 'error' && json.data){
          this.saveUser(json.data);
          this.enforcePageAccess(json.data);
          return json.data;
        }
        if(json.message === 'Unauthorized') this.logout();
      }catch(e){}
      // Keep profile/session usable on a transient request failure, but never rebuild or
      // inject sidebar definitions from frontend code.
      if(cached && cached.username) this.enforcePageAccess(cached);
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
      const sourceMenus = Array.isArray(user && user.menus) ? user.menus : [];

      // Database-only sidebar: no hardcoded fallback menus, injected pages, role filters,
      // menu renaming, parent repair or frontend permission overrides.
      const menus = sourceMenus.map(normalizeMenu)
        .filter(function(m){
          if(m.status !== 1 || !m.url || m.url === '#') return false;
          // Admin / Merchant Credit Control pages are retired — keep Adjust/Add Credit on list pages.
          const file = String(m.url || '').split('/').pop().split('?')[0].toLowerCase();
          const key = String(m.menuKey || '').toLowerCase();
          if(file === 'main-admin-credit.html' || key === 'main_admin_credit' || key === 'admin_credit') return false;
          if(file === 'main-merchant-credit.html' || key === 'main_merchant_credit' || key === 'merchant_credit') return false;
          return true;
        })
        .sort(function(a,b){ return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title); });

      if(!menus.length){
        nav.innerHTML='';
        return;
      }

      const top=[];
      const groups={};
      menus.forEach(function(m){
        const parent=String(m.parentKey||'').trim();
        if(parent){
          if(!groups[parent]) groups[parent]=[];
          groups[parent].push(m);
        }else{
          top.push(m);
        }
      });

      // Render top-level pages and DB menu groups in one shared sort sequence.
      // Group order/title/icon come only from the menu_group table response.
      const roots=[];
      top.forEach(function(m){ roots.push({kind:'menu',sortOrder:m.sortOrder,title:m.title,menu:m}); });
      Object.keys(groups).forEach(function(key){
        const meta=GROUP_META[key]||{};
        const items=groups[key].sort(function(a,b){return a.sortOrder-b.sortOrder||a.title.localeCompare(b.title);});
        const configuredSort=Number(meta.sortOrder);
        const minChild=items.length?Math.min.apply(null,items.map(function(x){return Number(x.sortOrder)||0;})):0;
        roots.push({
          kind:'group',
          key:key,
          sortOrder:Number.isFinite(configuredSort)?configuredSort:minChild,
          title:String(meta.title||key),
          icon:String(meta.icon||'bi-folder'),
          items:items
        });
      });
      roots.sort(function(a,b){ return Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.title||'').localeCompare(String(b.title||'')); });

      const activePage=sidebarActivePage();
      let html='';
      roots.forEach(function(root){
        if(root.kind==='menu'){
          html+=menuLinkHtml(root.menu,false);
          return;
        }
        const isOpen=root.items.some(function(m){return activePage===(m.url||'').split('/').pop();});
        html+='<div class="nav-group '+(isOpen?'open':'')+'" data-menu-group="'+esc(root.key)+'">'+
          '<button type="button" class="nav-group-btn" aria-expanded="'+(isOpen?'true':'false')+'">'+
          '<span><i class="bi '+esc(root.icon)+' me-2"></i>'+esc(root.title)+'</span><i class="bi bi-chevron-down"></i></button>'+
          '<div class="nav-group-list '+(isOpen?'show':'')+'">'+root.items.map(function(m){return menuLinkHtml(m,true);}).join('')+'</div></div>';
      });
      nav.innerHTML=html;

      const sidebar=nav.closest('.report-sidebar');
      if(sidebar){
        let footer=sidebar.querySelector('.bo-sidebar-account-footer');
        if(!footer){footer=document.createElement('div');footer.className='bo-sidebar-account-footer';sidebar.appendChild(footer);}
        footer.innerHTML='<a class="bo-sidebar-logout" href="#logout" data-bo-logout title="Logout"><i class="bi bi-box-arrow-right"></i><span>Logout</span></a>';
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
        const left = Math.max(8, Math.round(sr.right + 6));
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
      function dismissSidebarFlyout(group){
        if(!group) return;
        const timer = sidebarFlyoutHoverTimers.get(group);
        if(timer) clearTimeout(timer);
        sidebarFlyoutHoverTimers.delete(group);
        group.classList.add('bo-flyout-instant-hide');
        group.classList.remove('bo-flyout-hover', 'open');
        group.querySelector('.nav-group-list')?.classList.remove('show');
        group.querySelector('.nav-group-btn')?.setAttribute('aria-expanded','false');
        void group.offsetWidth;
        requestAnimationFrame(function(){ group.classList.remove('bo-flyout-instant-hide'); });
        if(window.__boSidebarActiveFlyout === group) window.__boSidebarActiveFlyout = null;
      }
      function closeAllSidebarFlyouts(){
        document.querySelectorAll('.report-sidebar .nav-group.bo-flyout-hover').forEach(dismissSidebarFlyout);
        window.__boSidebarActiveFlyout = null;
      }
      window.BO_SIDEBAR = window.BO_SIDEBAR || {};
      window.BO_SIDEBAR.closeAllFlyouts = closeAllSidebarFlyouts;
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
        if(window.__boSidebarActiveFlyout === group) window.__boSidebarActiveFlyout = null;
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
          dismissSidebarFlyout(group);
        }, 90);
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
        // Still moving toward the fixed flyout (outside the parent box) — keep open.
        if(next && next.closest && next.closest('.report-sidebar .nav-group-list')){
          const nextGroup = next.closest('.nav-group');
          if(nextGroup === group) return;
        }
        scheduleSidebarFlyoutHoverClose(group);
      });
      document.addEventListener('pointerdown', function(e){
        if(window.innerWidth < 992) return;
        if(e.target.closest && e.target.closest('.report-sidebar')) return;
        closeAllSidebarFlyouts();
      });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape') closeAllSidebarFlyouts();
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
    // Sidebar is intentionally rendered only after fresh DB-backed /me + menu-group data returns.
    window.BO_AUTH.refreshMe(true);
    document.addEventListener('click', function(e){
      const logout = e.target.closest && e.target.closest('[data-bo-logout]');
      if(logout){ e.preventDefault(); window.BO_AUTH.logout(); }
    });
  });
})();
