
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
  function num(v){const n=Number(String(v==null?0:v).replace(/,/g,''));return Number.isFinite(n)?n:0;}
  function money(v){return num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
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
  function readList(data){return data.items||data.list||data.content||data.rows||(Array.isArray(data)?data:[]);}
  function readTotalPages(data){return Number((data.pagination&&data.pagination.totalPages)||data.totalPages||data.pages||1)||1;}
  function setPager(){const el=$('betPager'); if(el) el.innerHTML=pageButtons(page,totalPages); const prev=$('betPrevBtn'),next=$('betNextBtn'); if(prev)prev.disabled=page<=1;if(next)next.disabled=page>=totalPages;}
  function setFromUrl(){const sp=new URLSearchParams(location.search); if(sp.get('memberId') && $('betMemberId')) $('betMemberId').value=sp.get('memberId');}

  function sessionQuery(){
    const p=new URLSearchParams();
    const memberId=$('betMemberId')?.value.trim(); if(memberId) p.set('memberId', memberId);
    const provider=$('betProviderCode')?.value.trim(); if(provider) p.set('providerCode', provider);
    const game=$('betGameCode')?.value.trim(); if(game){ p.set('gameId', game); p.set('gameCode', game); }
    const from=$('betFrom')?.value.trim(); if(from) p.set('from', from);
    const to=$('betTo')?.value.trim(); if(to) p.set('to', to);
    p.set('page',page); p.set('size','20');
    return p.toString();
  }

  function toBetRow(x){
    const bet = num(x.betAmount ?? x.transferAmount ?? x.amount ?? 0);
    const back = num(x.winAmount ?? x.transferBackAmount ?? x.payoutAmount ?? 0);
    const net = x.netAmount != null ? num(x.netAmount) : (back - bet);
    return {
      id: x.id,
      memberId: x.memberId,
      memberUsername: x.memberUsername || x.username || x.mobile,
      providerCode: x.providerCode || x.provider,
      gameName: x.gameName || x.gameCode || x.gameId || '-',
      betId: x.providerBetId || x.betId || x.providerTxId || x.txId || x.roundId || (x.id || '-'),
      eventType: x.eventType || x.status || 'SESSION',
      betAmount: bet,
      validBetAmount: x.validBetAmount != null ? x.validBetAmount : bet,
      winAmount: back,
      netAmount: net,
      createdAt: x.createdAt || x.startedAt || x.betTime,
      endedAt: x.endedAt
    };
  }

  async function load(){
    try{
      const data=await get(endpoint('PROVIDER_BET_REPORT_LIST')+'?'+sessionQuery());
      const rows=readList(data).map(toBetRow);
      totalPages=readTotalPages(data);
      $('betBody').innerHTML=rows.length?rows.map(x=>`<tr>
        <td>${esc(x.id)}</td>
        <td><b>${esc(memberName(x))}</b><br><small>ID: ${esc(x.memberId||'-')}</small></td>
        <td>${esc(x.providerCode)}</td>
        <td>${esc(x.gameName||'-')}</td>
        <td>${esc(x.betId||'-')}</td>
        <td>${esc(x.eventType||'-')}</td>
        <td>${money(x.betAmount)}</td>
        <td>${money(x.validBetAmount)}</td>
        <td>${money(x.winAmount)}</td>
        <td><b class="${num(x.netAmount)<0?'text-danger':'text-success'}">${money(x.netAmount)}</b></td>
        <td>${esc(dt(x.createdAt||x.endedAt))}</td>
      </tr>`).join(''):'<tr><td colspan="11">No records</td></tr>';
      setPager();
    }catch(e){$('betBody').innerHTML='<tr><td colspan="11" class="text-danger">'+esc(e.message)+'</td></tr>';}
  }
  document.addEventListener('DOMContentLoaded',()=>{BO_AUTH.requireLogin();BO_AUTH.renderProfile&&BO_AUTH.renderProfile();BO_AUTH.renderSidebar&&BO_AUTH.renderSidebar();setFromUrl();$('betSearchBtn')?.addEventListener('click',()=>{page=1;loadMemberMap().finally(load);});$('betPrevBtn')?.addEventListener('click',()=>{if(page>1){page--;load();}});$('betNextBtn')?.addEventListener('click',()=>{if(page<totalPages){page++;load();}});$('betPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;const n=Number(b.dataset.page);if(n>=1&&n<=totalPages&&n!==page){page=n;load();}});loadMemberMap().finally(load);});
})();
