(function(){'use strict';const base=window.API_BASE||'', $=id=>document.getElementById(id);let page=0,lastPage=0;const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const money=v=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4});async function request(url){const r=await fetch(url,{headers:Object.assign({},window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{}, {'Cache-Control':'no-cache, no-store'})});const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Unable to load rebate records');return j.data;}function status(v){const ok=['AVAILABLE','CREDITED','COMPLETED'].includes(String(v).toUpperCase());return '<span class="standard-status '+(ok?'active':'inactive')+'"><i></i>'+esc(String(v||'-').replaceAll('_',' '))+'</span>';}function renderPager(d){const total=d.totalPages||0,current=d.number||0;lastPage=Math.max(0,total-1);let h='<button class="page-btn" '+(current<=0?'disabled':'')+' data-page="'+(current-1)+'"><i class="bi bi-chevron-left"></i></button>';for(let i=Math.max(0,current-2);i<=Math.min(total-1,current+2);i++)h+='<button class="page-btn '+(i===current?'active':'')+'" data-page="'+i+'">'+(i+1)+'</button>';h+='<button class="page-btn" '+(current>=total-1||!total?'disabled':'')+' data-page="'+(current+1)+'"><i class="bi bi-chevron-right"></i></button>';$('pager').innerHTML=h;}/* The three sum tiles are page-level totals: they used to be summed from the rows of the page on
   screen, so changing "Show N entries" changed them (owner's rule: 带有卡片的 total 显示所有). One
   unpaged call with the same member/provider/status filters paints them; the table keeps its page. */
async function loadAllTimeTotals(){
  const q=new URLSearchParams({page:0,size:'10000'});
  const member=$('memberFilter').value.trim(),provider=$('providerFilter').value.trim(),statusFilter=$('statusFilter').value;
  if(member)q.set('memberId',member);
  if(provider)q.set('provider',provider);
  if(statusFilter)q.set('status',statusFilter);
  try{
    const d=await request(base+'/api/admin/rebate/logs?'+q)||{};
    const rows=Array.isArray(d.content)?d.content:(Array.isArray(d.rows)?d.rows:[]);
    $('sumValidBet').textContent=money(rows.reduce((a,x)=>a+Number(x.totalValidBet||0),0));
    $('sumEligible').textContent=money(rows.reduce((a,x)=>a+Number(x.eligibleValidBet||0),0));
    $('sumRebate').textContent=money(rows.reduce((a,x)=>a+Number(x.rebateAmount||0),0));
  }catch(e){/* leave the strip rather than show a partial total */}
}
let rebateLoadSeq=0;/* Show entries "-" = FIT, the recipe the rest of the rebate family uses: as many rows as this screen can show,
   so the list is never scrolled. This card grows with its rows and the PAGE is what scrolls, so the room is not
   the wrapper's height - it is the viewport minus what sits above the table (measured: 354px of summary strip,
   card head and filters) minus the footer and the content padding below the table, minus the table head. It
   cannot be derived from document.scrollHeight: while the page is shorter than the viewport that value IS the
   viewport, so `scrollHeight - wrap.bottom` grows every round the list shrinks on - measured, it walked 20 -> 3.
   The list is server-paged, so the count takes one extra request: ask, measure a painted row, ask once more.
   The largest count seen NOT to overflow is remembered (fitState.max) and floors every later estimate, which is
   what stops 6/7 from swapping places when the room is within a few pixels of a whole row. Bounded the same way
   as the other two pages: asking twice for the same count is refused, four corrections per two seconds at most. */
const fitState={lock:null,last:null,n:0,t:0,max:null};
const isAutoSize=()=>{const v=String($('pageSize').value??'-').trim();return v===''||v==='-'||/^auto$/i.test(v);};
function fitWrapEl(){const b=$('logRows');return b?b.closest('.standard-table-wrap'):null;}
function fitRows(){const b=$('logRows');return b?[...b.querySelectorAll('tr')].filter(r=>r.querySelectorAll('td').length>2):[];}
function fitRoom(){
  const wrap=fitWrapEl();if(!wrap)return 0;
  const card=wrap.closest('.standard-list-card')||wrap.parentElement;
  const head=wrap.querySelector('thead'),wr=wrap.getBoundingClientRect(),cr=card.getBoundingClientRect();
  const below=Math.max(0,Math.round(cr.bottom-wr.bottom));                       /* footer + card padding */
  const pad=parseFloat(getComputedStyle(card.parentElement||card).paddingBottom)||0;
  return Math.max(0,Math.round(window.innerHeight-wr.top-below-pad-(head?head.getBoundingClientRect().height:0)));
}
function fitWant(){
  const rows=fitRows(),room=fitRoom();if(!rows.length||room<=0)return null;
  const rowH=rows.reduce((s,x)=>s+x.getBoundingClientRect().height,0)/rows.length;
  return Math.max(1,Math.min(200,Math.floor(room/Math.max(30,rowH))));
}
function resolveSize(){if(!isAutoSize())return Number($('pageSize').value||20);return fitState.lock||20;}
function settleFit(requested,painted){
  if(!isAutoSize()){fitState.lock=null;fitState.last=null;fitState.max=null;return;}
  if(painted>1){
    const over=document.documentElement.scrollHeight>window.innerHeight+1;
    fitState.max=over?Math.min(fitState.max==null?painted-1:fitState.max,painted-1)
                     :Math.max(fitState.max==null?painted:fitState.max,painted);
  }
  const room=fitWant();if(room==null)return;
  let want=Math.max(1,painted<requested?Math.min(room,painted):room);
  if(fitState.max!=null)want=Math.max(1,Math.min(want,fitState.max));
  if(want===painted){fitState.lock=want;return;}
  if(want===fitState.lock)return;
  const now=Date.now();fitState.n=now-fitState.t<2000?fitState.n+1:1;fitState.t=now;
  if(fitState.n>4||fitState.last===want)return;
  fitState.last=want;fitState.lock=want;load();
}
function bindFit(){
  if(window.__boRebateLogFit){try{window.__boRebateLogFit.stop();}catch(e){}window.__boRebateLogFit=null;}
  let t=0;
  const kick=()=>{if(!isAutoSize()||fitState.lock==null)return;fitState.max=null;const w=fitWant();if(w==null||w===fitState.lock||w===fitRows().length)return;fitState.last=null;fitState.lock=w;load();};
  const later=()=>{clearTimeout(t);t=setTimeout(kick,180);};
  let ro=null;const wrap=fitWrapEl();
  if(wrap&&window.ResizeObserver){ro=new ResizeObserver(later);ro.observe(wrap);}
  window.addEventListener('resize',later);
  window.__boRebateLogFit={stop(){clearTimeout(t);if(ro)ro.disconnect();window.removeEventListener('resize',later);}};
}
async function load(){const loadSeq=++rebateLoadSeq;const size=resolveSize(),q=new URLSearchParams({page,size});const member=$('memberFilter').value.trim(),provider=$('providerFilter').value.trim(),statusFilter=$('statusFilter').value;if(member)q.set('memberId',member);if(provider)q.set('provider',provider);if(statusFilter)q.set('status',statusFilter);$('logRows').innerHTML='<tr><td colspan="12" class="table-empty">Loading...</td></tr>';try{const d=await request(base+'/api/admin/rebate/logs?'+q)||{};if(loadSeq!==rebateLoadSeq)return;const rows=d.content||[];$('logRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.periodDate||'-')+'</td><td><div class="table-primary">#'+esc(x.memberId||'-')+'</div></td><td><div class="table-primary">'+esc(x.providerCode||'-')+'</div><small>'+esc(x.gameCategory||'UNKNOWN')+'</small></td><td>'+money(x.totalValidBet)+'</td><td class="positive">'+money(x.eligibleValidBet)+'</td><td class="warning">'+money(x.lockedValidBet)+'</td><td>'+money(x.providerRate)+'%</td><td>'+money(x.vipRate)+'%</td><td><b>'+money(x.effectiveRate)+'%</b><small>'+esc((x.combinationMode||'').replaceAll('_',' '))+'</small></td><td><b>'+money(x.rebateAmount)+'</b></td><td>'+status(x.status)+'</td><td class="reference-cell">'+esc(x.referenceNo||'-')+'</td></tr>').join(''):'<tr><td colspan="12" class="table-empty">No rebate records found.</td></tr>';const from=d.numberOfElements?d.number*size+1:0,to=d.number*size+(d.numberOfElements||0);$('showing').textContent='Showing '+from+' to '+to+' of '+(d.totalElements||0)+' entries';$('sumRecords').textContent=Number(d.totalElements||0).toLocaleString('en-US');/* sumValidBet/sumEligible/sumRebate are painted by loadAllTimeTotals (all time). */renderPager(d);settleFit(size,rows.length);}catch(e){if(loadSeq!==rebateLoadSeq)return;$('logRows').innerHTML='<tr><td colspan="12" class="table-empty">'+esc(e.message)+'</td></tr>';$('pager').innerHTML='';if(window.BO_DIALOG)BO_DIALOG.alert(e.message,{title:'Unable to Load Rebate Log',type:'error'});}}$('pager').onclick=e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;const n=Number(b.dataset.page);if(n<0||n>lastPage)return;page=n;load();};$('pageSize').onchange=()=>{page=0;load();};$('searchLog').onclick=()=>{page=0;load();};$('refreshLog').onclick=load;$('resetLog').onclick=()=>{$('memberFilter').value='';$('providerFilter').value='';$('statusFilter').value='';page=0;load();};bindFit();load();loadAllTimeTotals();})();
