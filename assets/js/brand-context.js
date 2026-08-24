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
  function isMaster(){const u=cachedAdmin();return !!(u.rootAdmin||u.masterAdmin||String(u.roleType||'').toUpperCase()==='ROOT'||String(u.roleType||'').toUpperCase()==='MASTER');}
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
      const id=localStorage.getItem(KEY);if(id&&!headers.has('X-Brand-Id'))headers.set('X-Brand-Id',id);
      if(String(url).indexOf('/api/auth/admin/login')===-1){const t=token();if(t&&!headers.has('Authorization'))headers.set('Authorization','Bearer '+t);}
      init.headers=headers;
    }
    return originalFetch(input,init);
  };
  async function context(force){
    if(!force){const cached=readCache();if(cached)return cached;if(contextPromise)return contextPromise;}
    const run=(async()=>{
      const headers=new Headers(); const t=token(); if(t)headers.set('Authorization','Bearer '+t);
      const id=localStorage.getItem(KEY); if(id)headers.set('X-Brand-Id',id);
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
    if(!d.master && d.adminBrandId){localStorage.setItem(KEY,String(d.adminBrandId));}
    else if(!localStorage.getItem(KEY))localStorage.setItem(KEY,String(d.activeBrandId||1));
    const host=document.querySelector('[data-bo-profile], .report-actions'); if(!host)return;
    const old=document.getElementById('boBrandSwitcher'); if(old)old.remove();
    const wrap=document.createElement('div');wrap.id='boBrandSwitcher';wrap.style.cssText='display:flex;align-items:center;gap:7px;margin-right:10px;flex:0 0 auto';
    const label=document.createElement('span');label.textContent='Brand';label.style.cssText='font-size:11px;font-weight:800;color:#64748b';wrap.appendChild(label);
    const sel=document.createElement('select');sel.style.cssText='min-width:170px;height:36px;border:1px solid #d7deea;border-radius:9px;padding:0 9px;background:#fff;font-weight:700';
    brands.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=(b.name||b.code)+' (#'+b.id+')';sel.appendChild(o);});
    const active=d.master?(Number(localStorage.getItem(KEY)||d.activeBrandId||1)||1):(Number(d.adminBrandId||d.activeBrandId||1)||1);
    sel.value=String(active);sel.disabled=!d.master;sel.title=d.master?'Switch the entire BO to another branding':'Brand Owner is locked to this branding';sel.onchange=()=>set(sel.value);wrap.appendChild(sel);host.prepend(wrap);
    document.documentElement.dataset.boBrandId=String(active);
    document.documentElement.dataset.boMaster=d.master?'1':'0';
    window.dispatchEvent(new CustomEvent('bo:brand-context',{detail:d}));
  }
  window.BO_BRAND={key:KEY,activeId,isMaster,set,context,mount,invalidate};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>mount(false),30));
})();
