
(function(){
  let page=1,totalPages=1;
  function pageButtons(current,total){
    total=Math.max(1,Number(total)||1); current=Math.max(1,Math.min(Number(current)||1,total));
    const pages=[]; const add=n=>{if(n>=1&&n<=total&&!pages.includes(n))pages.push(n);};
    add(1); for(let n=current-2;n<=current+2;n++) add(n); add(total); pages.sort((a,b)=>a-b);
    let html='<div class="smart-pagination" role="navigation" aria-label="Table pagination">';
    html+='<button type="button" class="smart-page first" data-page="1" '+(current<=1?'disabled':'')+' title="First page"><i class="bi bi-chevron-bar-left"></i></button>';
    let prev=0; pages.forEach(n=>{if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis">…</span>'; html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>'; prev=n;});
    html+='<button type="button" class="smart-page last" data-page="'+total+'" '+(current>=total?'disabled':'')+' title="Last page"><i class="bi bi-chevron-bar-right"></i></button>';
    html+='</div><span class="smart-page-summary">Page '+current+' / '+total+'</span>'; return html;
  }

  let memberMap = {};
  const $=id=>document.getElementById(id);
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function money(v){const n=Number(v||0);return (Number.isFinite(n)?n:0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function dt(v){return window.BO_FORMAT&&window.BO_FORMAT.dateTime?window.BO_FORMAT.dateTime(v):(v?String(v).replace('T',' ').slice(0,19):'-');}
  function memberName(x){
    const direct = x.username||x.memberUsername||x.memberName||x.mobile||x.memberMobile;
    if(direct) return direct;
    const m = memberMap[String(x.memberId||'')];
    return (m && (m.username||m.mobile||m.name||m.fullName)) || x.memberId || '-';
  }
  async function loadMemberMap(){
    try{
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_LIST, {headers:{...BO_AUTH.authHeader()}});
      const json = await res.json().catch(()=>({}));
      const rows = Array.isArray(json.data) ? json.data : (json.data && Array.isArray(json.data.content) ? json.data.content : []);
      memberMap = {};
      rows.forEach(m=>{ const id = m.id || m.memberId || m.userId; if(id != null) memberMap[String(id)] = m; });
    }catch(e){ memberMap = {}; }
  }
  function endpoint(key){return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key];}
  async function get(url){const res=await fetch(url,{headers:{...BO_AUTH.authHeader()}});const json=await res.json().catch(()=>({}));if(!res.ok||json.status==='error')throw new Error(json.message||'Request failed');return json.data||{};}
  function readList(data){return data.items||data.list||data.content||data.rows||[];}
  function readTotalPages(data){return Number(data.totalPages||data.pages||1)||1;}
  function setPager(prefix){const el=$(prefix+'Pager'); if(el) el.innerHTML=pageButtons(page,totalPages); const prev=$(prefix+'PrevBtn'),next=$(prefix+'NextBtn'); if(prev)prev.disabled=page<=1;if(next)next.disabled=page>=totalPages;}

  function query(){const p=new URLSearchParams();['MemberId','ProviderCode','GameId','Status','From','To'].forEach(k=>{const el=$('session'+k); if(el&&el.value.trim()) p.set(k.charAt(0).toLowerCase()+k.slice(1),el.value.trim());});p.set('page',page);p.set('size','20');return p.toString();}
  async function load(){try{const data=await get(endpoint('PLAYER_PROVIDER_SESSION_LIST')+'?'+query());const rows=readList(data);totalPages=readTotalPages(data);$('sessionBody').innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.id)}</td><td><b>${esc(memberName(x))}</b><br><small>ID: ${esc(x.memberId||'-')}</small></td><td>${esc(x.providerCode)}</td><td>${esc(x.gameName||x.gameCode||x.gameId||'-')}</td><td>${esc(x.launchType||'-')}</td><td>${money(x.transferAmount)}</td><td>${money(x.transferBackAmount)}</td><td><span class="badge ${x.status==='OPEN'?'text-bg-success':'text-bg-secondary'}">${esc(x.status)}</span></td><td>${esc(dt(x.startedAt||x.createdAt))}</td><td>${esc(dt(x.endedAt))}</td></tr>`).join(''):'<tr><td colspan="10">No records</td></tr>';setPager('session');}catch(e){$('sessionBody').innerHTML='<tr><td colspan="10" class="text-danger">'+esc(e.message)+'</td></tr>';}}
  document.addEventListener('DOMContentLoaded',()=>{BO_AUTH.requireLogin();BO_AUTH.renderProfile&&BO_AUTH.renderProfile();BO_AUTH.renderSidebar&&BO_AUTH.renderSidebar();$('sessionSearchBtn')?.addEventListener('click',()=>{page=1;loadMemberMap().finally(load);});$('sessionPrevBtn')?.addEventListener('click',()=>{if(page>1){page--;load();}});$('sessionNextBtn')?.addEventListener('click',()=>{if(page<totalPages){page++;load();}});$('sessionPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;const n=Number(b.dataset.page);if(n>=1&&n<=totalPages&&n!==page){page=n;load();}});loadMemberMap().finally(load);});
})();
