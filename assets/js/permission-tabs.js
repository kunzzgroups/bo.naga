(function(){
  'use strict';
  function base(v){ return String(v||'').split('?')[0].split('#')[0].split('/').pop(); }
  function isRoot(u){ return !!(u && (u.rootAdmin===true || Number(u.rootAdmin)===1 || String(u.roleType||'').toUpperCase()==='ROOT')); }
  function allowedSet(){
    var u=(window.BO_AUTH&&typeof BO_AUTH.user==='function')?BO_AUTH.user():null;
    var set=new Set();
    if(isRoot(u)){ set.add('*'); return set; }
    var menus=Array.isArray(u&&u.menus)?u.menus:[];
    menus.forEach(function(m){ if(Number(m.status==null?1:m.status)!==1)return; var u0=base(m.url||m.href); if(u0)set.add(u0); });
    return set;
  }
  function apply(){
    var allowed=allowedSet(), root=allowed.has('*');
    document.querySelectorAll('[data-permission-url]').forEach(function(el){
      var urls=String(el.getAttribute('data-permission-url')||'').split(',').map(base).filter(Boolean);
      var ok=root || urls.some(function(u){ return allowed.has(u); });
      el.hidden=!ok;
      el.setAttribute('aria-hidden',ok?'false':'true');
    });
  }
  window.BO_PERMISSION_TABS={apply:apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
