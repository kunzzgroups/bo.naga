(function(){
  'use strict';
  const KEY='bo_active_brand_id';
  const CACHE_KEY='bo_brand_context_cache_v3';
  const CACHE_TTL_MS=15000;
  const originalFetch=window.fetch.bind(window);
  let contextPromise=null;
  function token(){return localStorage.getItem('bo_admin_token')||localStorage.getItem('admin_token')||'';}
  function tokenKey(){const t=token();return t?t.slice(-24):'';}
  function activeId(){return Number(localStorage.getItem(KEY)||1)||1;}
  function cachedAdmin(){try{return JSON.parse(localStorage.getItem('bo_admin_user')||'{}')||{};}catch(e){return {};}}
  function platformAdmin(u){u=u||cachedAdmin();const role=String(u.roleType||'').toUpperCase();return !!(u.rootAdmin||u.masterAdmin||role==='ROOT'||role==='MASTER');}
  function isMaster(){return platformAdmin(cachedAdmin());}
  function tenantBrandId(u){
    u=u||cachedAdmin();
    if(!token()||platformAdmin(u))return 0;
    const id=Number(u.brandId||u.adminBrandId||0);
    return Number.isFinite(id)&&id>0?id:0;
  }
  function pinTenantBrandFromCache(){
    const id=tenantBrandId();
    if(!id)return 0;
    const current=Number(localStorage.getItem(KEY)||0);
    if(current!==id){
      localStorage.setItem(KEY,String(id));
      try{sessionStorage.removeItem(CACHE_KEY);}catch(e){}
      try{sessionStorage.removeItem('bo_online_users_cache');}catch(e){}
    }
    return id;
  }
  // Brand-admin pages load several modules immediately. Pin the tenant brand synchronously
  // from the authenticated user cached at login before any page module can read a stale
  // bo_active_brand_id left by another BO session. The backend remains authoritative too.
  pinTenantBrandFromCache();
  function readCache(){
    try{
      const x=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if(!x||Date.now()-Number(x.at||0)>CACHE_TTL_MS||x.tokenKey!==tokenKey()||Number(x.requestBrandId||1)!==activeId())return null;
      return x.data||null;
    }catch(e){return null;}
  }
  function writeCache(data){try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),tokenKey:tokenKey(),requestBrandId:activeId(),data:data}));}catch(e){}}
  function invalidate(){contextPromise=null;try{sessionStorage.removeItem(CACHE_KEY);}catch(e){}}
  function isBoApiRequest(raw){
    try{
      const u=new URL(typeof raw==='string'?raw:(raw&&raw.url)||'',location.href);
      const base=(window.API_CONFIG&&API_CONFIG.BASE_URL)?new URL(API_CONFIG.BASE_URL,location.href):null;
      return u.pathname.indexOf('/api/')===0 && (!base||u.origin===base.origin);
    }catch(e){return false;}
  }
  window.fetch=function(input,init){
    init=init?Object.assign({},init):{};
    let url='';try{url=typeof input==='string'?input:((input&&input.url)||'');}catch(e){}
    // Tenant/auth headers must never leak to Firebase, Google APIs or CDNs.
    // Firestore uses fetch internally and custom BO headers can break CORS.
    if(isBoApiRequest(input)){
      const headers=new Headers(init.headers||(input&&input.headers)||{});
      const pinned=tenantBrandId();const id=pinned||Number(localStorage.getItem(KEY)||0);if(id&&!headers.has('X-Brand-Id'))headers.set('X-Brand-Id',String(id));
      if(String(url).indexOf('/api/auth/admin/login')===-1){const t=token();const currentAuth=String(headers.get('Authorization')||'').trim();if(t&&(!currentAuth||/^Bearer\s*$/i.test(currentAuth)))headers.set('Authorization','Bearer '+t);}
      init.headers=headers;
    }
    return originalFetch(input,init);
  };
  async function context(force){
    if(!force){const cached=readCache();if(cached)return cached;if(contextPromise)return contextPromise;}
    const run=(async()=>{
      const headers=new Headers(); const t=token(); if(t)headers.set('Authorization','Bearer '+t);
      const pinned=tenantBrandId(); const id=pinned||Number(localStorage.getItem(KEY)||0); if(id)headers.set('X-Brand-Id',String(id));
      const r=await originalFetch(API_CONFIG.BASE_URL+(API_CONFIG.ENDPOINTS.BRAND_CONTEXT||'/admin/brands/context'),{headers,cache:'no-store'});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||j.status==='error')throw new Error(j.message||'Unable to load brand context');
      if(j&&j.data)writeCache(j);
      return j;
    })();
    contextPromise=run;
    try{return await run;}finally{contextPromise=null;}
  }
  function set(id){const next=String(Number(id)||1);localStorage.setItem(KEY,next);invalidate();try{sessionStorage.removeItem('bo_online_users_cache');}catch(e){} location.reload();}
  async function mount(force){
    if(!token())return;
    let j;try{j=await context(!!force);}catch(e){return;} if(!j||j.status==='error'||!j.data)return;
    const d=j.data,brands=Array.isArray(d.brands)?d.brands:[];
    if(!d.master && d.adminBrandId){const next=String(d.adminBrandId);if(localStorage.getItem(KEY)!==next){localStorage.setItem(KEY,next);invalidate();}}
    else if(!localStorage.getItem(KEY))localStorage.setItem(KEY,String(d.activeBrandId||1));
    // Brand scope stays active for every API request, but brand switching is intentionally
    // NOT rendered in the common top header. Root changes brand context from Root Control only;
    // Master and brand admins never receive a header brand dropdown.
    const old=document.getElementById('boBrandSwitcher'); if(old)old.remove();
    const active=d.master?(Number(localStorage.getItem(KEY)||d.activeBrandId||1)||1):(Number(d.adminBrandId||d.activeBrandId||1)||1);
    document.documentElement.dataset.boBrandId=String(active);
    document.documentElement.dataset.boMaster=d.master?'1':'0';
    window.dispatchEvent(new CustomEvent('bo:brand-context',{detail:d}));
  }
  function open(id,url){const next=String(Number(id)||1);localStorage.setItem(KEY,next);invalidate();try{sessionStorage.removeItem('bo_online_users_cache');}catch(e){} location.href=url||'dashboard.html';}
  window.BO_BRAND={key:KEY,activeId,isMaster,set,open,context,mount,invalidate};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>mount(false),30));
})();
