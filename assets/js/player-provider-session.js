
(function(){
  let page=1,totalPages=1;
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
  function setPager(prefix){const el=$(prefix+'Pager'); if(el) el.textContent='Page '+page+' / '+totalPages;}

  function query(){const p=new URLSearchParams();['MemberId','ProviderCode','GameId','Status','From','To'].forEach(k=>{const el=$('session'+k); if(el&&el.value.trim()) p.set(k.charAt(0).toLowerCase()+k.slice(1),el.value.trim());});p.set('page',page);p.set('size','20');return p.toString();}
  async function load(){try{const data=await get(endpoint('PLAYER_PROVIDER_SESSION_LIST')+'?'+query());const rows=readList(data);totalPages=readTotalPages(data);$('sessionBody').innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.id)}</td><td><b>${esc(memberName(x))}</b><br><small>ID: ${esc(x.memberId||'-')}</small></td><td>${esc(x.providerCode)}</td><td>${esc(x.gameName||x.gameCode||x.gameId||'-')}</td><td>${esc(x.launchType||'-')}</td><td>${money(x.transferAmount)}</td><td>${money(x.transferBackAmount)}</td><td><span class="badge ${x.status==='OPEN'?'text-bg-success':'text-bg-secondary'}">${esc(x.status)}</span></td><td>${esc(dt(x.startedAt||x.createdAt))}</td><td>${esc(dt(x.endedAt))}</td></tr>`).join(''):'<tr><td colspan="10">No records</td></tr>';setPager('session');}catch(e){$('sessionBody').innerHTML='<tr><td colspan="10" class="text-danger">'+esc(e.message)+'</td></tr>';}}
  document.addEventListener('DOMContentLoaded',()=>{BO_AUTH.requireLogin();BO_AUTH.renderProfile&&BO_AUTH.renderProfile();BO_AUTH.renderSidebar&&BO_AUTH.renderSidebar();$('sessionSearchBtn')?.addEventListener('click',()=>{page=1;loadMemberMap().finally(load);});$('sessionPrevBtn')?.addEventListener('click',()=>{if(page>1){page--;load();}});$('sessionNextBtn')?.addEventListener('click',()=>{if(page<totalPages){page++;load();}});loadMemberMap().finally(load);});
})();
