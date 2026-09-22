/* Agent Performance Detail — the drill-down of the Agent Performance Report.
   Brought onto the family design (2026-09-22): the page is now marked
   `bo-report-family`, so it gets the locked frame, the split/pinned head, the lineless
   listing table, the Panel-pill scrollbars, the three-slot footer and the locked ladder.

   Two things this page needed of its own:
   1. Its KPI tiles were `<div class="perf-kpi">` — a class no stylesheet in this repo has
      ever defined — so the strip rendered as raw inline text ("TurnoverRM 1,385,271.50Valid
      bet" stacked down the page). They are now the family's `.quick-stats .metric` tile,
      the same markup `agent-performance-report.js` emits, carrying no note line (owner:
      "卡片的那些提示词就不需要了吧").
   2. It had no pagination at all: 40 records rendered into one 2468px panel and the whole
      document scrolled (3225px against a 950px viewport). It now has the listing footer —
      page size, info, ladder — on the listing's page-size semantics, exactly as on 8.11. */
(function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>Number(v||0).toLocaleString('en-US');
const API=String(API_CONFIG.BASE_URL||'').replace(/\/+$/,'');
function url(p){if(/\/api$/i.test(API)&&/^\/api\//i.test(p))p=p.replace(/^\/api/i,'');return API+p}
async function req(p){const r=await fetch(url(p),{headers:{...BO_AUTH.authHeader()}}),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data}
function dt(v){return String(v||'').replace('T',' ').slice(0,19)||'-'}

/* The family's KPI tile — the same markup `agent-performance-report.js` emits. */
function card(icon,label,value){return `<div class="metric"><div class="bo-summary-icon"><i class="bi ${icon}"></i></div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`}

/* ---------------------------------------------------------------------------
   Pagination — the LISTING logic, identical to the other report pages
   (`pagination-standardizer.js` → resolvePageSize, `agent-performance-report.js`):
     `-` / blank / `auto`  →  FIT the rows to the panel
     `All`                 →  everything
     a number              →  that number
   The record list is already client-side (the API returns the whole period), so fitting
   costs no request: it is measured from a painted row and corrected once.
   --------------------------------------------------------------------------- */
let allRows=[],page=1,sizeLock=null,settleSteps=0;
function isAutoSize(){const v=$('detailSize')?String($('detailSize').value):'-';return v===''||v==='-'||/^auto$/i.test(v)}
function measureFit(){
  const wrap=document.querySelector('.table-card .table-wrap');
  if(!wrap)return null;
  const head=wrap.querySelector('thead');
  const headH=head?Math.ceil(head.getBoundingClientRect().height):0;
  const cell=wrap.querySelector('tbody tr td');
  if(!cell)return null;
  const rowH=Math.max(34,Math.round(cell.getBoundingClientRect().height))||41;
  return Math.max(5,Math.min(200,Math.floor((Math.floor(wrap.clientHeight)-headH)/rowH)||20));
}
function pageSize(){
  const v=$('detailSize')?String($('detailSize').value):'-';
  if(/^all$/i.test(v))return 0;
  if(isAutoSize()){
    if(sizeLock==null){const m=measureFit();if(m==null)return 20;sizeLock=m}
    return sizeLock;
  }
  const n=Number(v);
  return n>0?n:20;
}
function pagerNumbers(cur,total){
  const out=[];const add=n=>{if(n>=1&&n<=total&&out.indexOf(n)<0)out.push(n)};
  add(1);for(let n=cur-2;n<=cur+2;n++)add(n);add(total);
  return out.sort((a,b)=>a-b);
}
/* The locked ladder anatomy: First · Previous · numbered window (±2, always 1 and the
   last, gaps > 1 collapsed to an ellipsis) · Next · Last, all on `.smart-page` chrome. */
function paintPager(totalPages){
  const host=$('detailPager');if(!host)return;
  const cur=page;
  const rung=(label,icon,target,off,cls)=>`<button type="button" class="${cls}" data-detail-page="${target}" ${off?'disabled':''} title="${label}" aria-label="${label}"><i class="bi ${icon}" aria-hidden="true"></i></button>`;
  let html=rung('First page','bi-chevron-bar-left',1,cur<=1,'smart-page first');
  html+=rung('Previous page','bi-chevron-left',cur-1,cur<=1,'smart-page nav-text');
  let prev=0;
  pagerNumbers(cur,totalPages).forEach(n=>{
    if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis" aria-hidden="true">\u2026</span>';
    html+=`<button type="button" class="smart-page${n===cur?' active':''}" data-detail-page="${n}" aria-label="Page ${n}"${n===cur?' aria-current="page"':''}>${n}</button>`;
    prev=n;
  });
  html+=rung('Next page','bi-chevron-right',cur+1,cur>=totalPages,'smart-page nav-text');
  html+=rung('Last page','bi-chevron-bar-right',totalPages,cur>=totalPages,'smart-page last');
  host.innerHTML=html;
}
function totalPagesFor(size,total){return size?Math.max(1,Math.ceil(total/size)):1}
function renderRows(){
  const body=$('detailRows');if(!body)return;
  const size=pageSize(),total=allRows.length,pages=totalPagesFor(size,total);
  if(page>pages)page=pages;
  if(page<1)page=1;
  const start=size?(page-1)*size:0;
  const slice=size?allRows.slice(start,start+size):allRows;
  body.innerHTML=slice.length?slice.map(x=>`<tr><td>${esc(dt(x.settlementAt))}</td><td><b>${esc(x.playerName||x.playerId)}</b><small class="d-block">#${esc(x.playerId)}</small></td><td>${esc(x.providerCode||'-')}</td><td>${esc(x.gameName||x.gameCode||'-')}</td><td>RM ${money(x.totalBet)}</td><td>RM ${money(x.validBet)}</td><td>RM ${money(x.totalWin)}</td><td class="${Number(x.playerPL||0)>=0?'perf-pos':'perf-neg'}">RM ${money(x.playerPL)}</td></tr>`).join(''):'<tr><td colspan="8" class="perf-empty">No betting records for this period.</td></tr>';
  const from=total?start+1:0;
  const to=size?Math.min(start+size,total):total;
  $('detailShowing').textContent=`Showing ${num(from)} to ${num(to)} of ${num(total)} entries`;
  paintPager(pages);
  settleFit();
}
/* The fit, settled against what was actually painted.
   A single pre-paint measurement is not reliable here: on the first render there is no row to
   measure, and the panel's own height is still moving as the KPI strip and the ops grid take
   theirs. Measured on the real page, that first estimate came out one row too many (5 rows in a
   212px panel at 54px each ⇒ `scrollHeight 269 > clientHeight 212`, i.e. the panel scrolled at the
   default), and a horizontal scrollbar appearing afterwards shifts the body height again.
   This is the same "measure the rows actually painted, then grow or shrink" approach
   `operations-report.js` uses for the same reason, and it converges in at most three passes. */
function settleFit(){
  if(!isAutoSize())return;
  const wrap=document.querySelector('.table-card .table-wrap');
  if(!wrap)return;
  const painted=wrap.querySelectorAll('tbody tr').length;
  if(!painted||settleSteps>=3)return;
  /* A row's own box, not `scrollHeight / painted`: `scrollHeight` is clamped to `clientHeight`
     whenever the rows do NOT overflow, so after an upward correction it reads as if every row
     were taller than it is and the next pass drops one row too many (measured: 3 rows in a
     212px panel became 2, leaving 54px of dead panel). */
  const firstRow=wrap.querySelector('tbody tr');
  const rowH=firstRow?Math.max(34,Math.round(firstRow.getBoundingClientRect().height)):54;
  const target=Math.max(1,Math.min(200,Math.floor(wrap.clientHeight/rowH)));
  if(target===(pageSize()||1))return;
  settleSteps++;
  sizeLock=target;
  page=1;
  renderRows();
}

/* The eight-card financial readout is a disclosure, not a permanent block — it is the tallest thing
   on the page and it is reference, not the reason the page was opened. The choice persists, because
   it is a preference about the panel's height.
   The control lives in the page's own header row (owner: "放上去一点 too much gap"): as its own row it
   cost a full band plus two 16px gaps, and it read as a floating chip between the KPI strip and the
   table. The cards still open where they were, between the KPI strip and the table, so the reading
   order (headline numbers, then their breakdown, then the records) is unchanged.
   Toggling RE-FITS the table: this page is viewport-locked, so collapsing the block hands ~270px to
   the table panel and the fitted row count has to be re-derived, not left at the old size. */
const OPS_KEY = 'bo_perf_detail_ops_open';
function opsOpen(){try{return localStorage.getItem(OPS_KEY) === '1'}catch(e){return false}}
function setOpsOpen(open, refit){
  const panel=$('detailOpsPanel'), btn=$('detailOpsToggle');
  if(!panel||!btn)return;
  /* Both elements carry `data-open`: the CSS keys the chevron off the button and the grid's
     display off the panel, and they are no longer parent and child. */
  panel.setAttribute('data-open', open?'1':'0');
  btn.setAttribute('data-open', open?'1':'0');
  btn.setAttribute('aria-expanded', open?'true':'false');
  if(refit){try{localStorage.setItem(OPS_KEY, open?'1':'0')}catch(e){}}
  if(refit&&isAutoSize()){sizeLock=null;settleSteps=0;page=1;renderRows()}
}

async function init(){
  BO_AUTH.requireLogin();
  await BO_AUTH.refreshMe();
  const p=new URLSearchParams(location.search),id=p.get('agentId'),brand=p.get('brandId')||'',from=p.get('from')||new Date().toISOString().slice(0,10),to=p.get('to')||from;
  if(!id){location.href='agent-performance-report.html';return}
  const qs=new URLSearchParams({agentId:id,from,to});
  if(brand)qs.set('brandId',brand);
  const [r,b]=await Promise.all([
    req('/api/admin/reports/agent-performance?'+qs),
    req('/api/admin/reports/agent-performance/'+encodeURIComponent(id)+'/bets?'+new URLSearchParams({...(brand?{brandId:brand}:{}),from,to}))
  ]);
  const a=(r.rows||[])[0]||{};
  $('detailName').textContent=`${a.agentCode||('Agent #'+id)} · ${a.agentName||''}`;
  $('detailSubtitle').textContent=`${r.brand?.brandName||''} · ${from} - ${to}`;
  $('detailKpis').innerHTML=
    card('bi-people','Players',num(a.totalPlayers))+
    card('bi-coin','Turnover','RM '+money(a.turnover))+
    card('bi-graph-up-arrow','House Profit','RM '+money(a.houseProfit))+
    card('bi-cash-stack','Deposit','RM '+money(a.depositAmount))+
    card('bi-cash-coin','Withdraw','RM '+money(a.withdrawAmount))+
    card('bi-gift','Bonus / Settlement','RM '+money(Number(a.bonusAmount||0)+Number(a.settlementAmount||0)));
  $('detailOps').innerHTML=[['Deposit','RM '+money(a.depositAmount),num(a.depositCount)+' transaction(s)'],['Withdraw','RM '+money(a.withdrawAmount),num(a.withdrawCount)+' transaction(s)'],['Bonus Given','RM '+money(a.bonusAmount),'Agent players'],['Player Win','RM '+money(a.playerWin),'Players won'],['Player Loss','RM '+money(a.playerLoss),'Players lost'],['Settlement Paid','RM '+money(a.settlementAmount),'Agent settlement'],['Pending Settlement','RM '+money(a.pendingSettlement),'Awaiting processing'],['Available Balance','RM '+money(a.availableBalance),'Agent wallet']].map(x=>`<div class="perf-op"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
  allRows=b.rows||[];
  /* The stored preference is applied BEFORE the first paint, so the fit is measured against the
     panel the reader will actually see — applying it afterwards would fit rows to the expanded
     height and then collapse the block out from under them. */
  setOpsOpen(opsOpen(), false);
  renderRows();
  $('detailOpsToggle').addEventListener('click',()=>setOpsOpen($('detailOpsToggle').getAttribute('data-open')!=='1', true));
  $('detailBack').onclick=()=>history.length>1?history.back():location.href='agent-performance-report.html';
  $('detailSize').addEventListener('change',()=>{sizeLock=null;settleSteps=0;page=1;renderRows()});
  $('detailPager').addEventListener('click',e=>{
    const btn=e.target.closest('[data-detail-page]');
    if(!btn||btn.disabled)return;
    const n=Number(btn.dataset.detailPage),pages=totalPagesFor(pageSize(),allRows.length);
    if(!(n>=1)||n>pages||n===page)return;
    page=n;renderRows();
  });
  /* In auto mode the fit follows the panel, as on the family's other pages. */
  let fitT=0;
  window.addEventListener('resize',()=>{if(!isAutoSize())return;clearTimeout(fitT);fitT=setTimeout(()=>{sizeLock=null;settleSteps=0;page=1;renderRows()},250)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(e=>BO_DIALOG.alert(e.message,{title:'Agent Performance',type:'error'})));
else init().catch(e=>BO_DIALOG.alert(e.message,{title:'Agent Performance',type:'error'}));
})();
