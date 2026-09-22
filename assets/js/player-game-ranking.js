(function(){
  let page=0,totalPages=0,totalElements=0,loading=false,lastFit=0,resizeT=0;
  const COLS=10;
  const $=id=>document.getElementById(id), esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const dt=v=>window.BO_FORMAT?.dateTime?BO_FORMAT.dateTime(v):(v?String(v).replace('T',' ').slice(0,19):'-');
  function endpoint(){return window.GAME_RANKING_MODE==='frequent'?API_CONFIG.ENDPOINTS.FREQUENT_GAME_PLAYERS:API_CONFIG.ENDPOINTS.HIGHEST_TURNOVER_PLAYERS;}
  /* Footer "Show N entries" (locked listing recipe): "-" = auto-fit — the trigger always paints
     "-" and the row count is whatever the viewport can show, so the page does not scroll;
     "All" = the locked 10000 ceiling and the page may scroll; a number is that size.
     The panel on this page is not a viewport-locked .mad-panel, so auto-fit pins the fitted
     height on .table-wrap itself; if the measurement is unusable the request falls back to 20. */
  const ROW_H=40, MIN_ROWS=5, MAX_ROWS=100;
  const wrapEl=()=>document.querySelector('.table-card .table-wrap');
  const footEl=()=>document.querySelector('.mad-footer');
  function fitPlan(){
    const wrap=wrapEl(); if(!wrap)return null;
    const rows=wrap.querySelectorAll('tbody tr');
    let rowH=ROW_H;
    if(rows.length===1){const h=rows[0].getBoundingClientRect().height;if(h>20&&h<120)rowH=h;}
    const head=wrap.querySelector('thead'), headH=head?head.getBoundingClientRect().height:0;
    const foot=footEl(), footH=foot?foot.getBoundingClientRect().height:0;
    const avail=Math.floor(window.innerHeight-wrap.getBoundingClientRect().top-footH-14);
    if(avail<headH+MIN_ROWS*rowH)return null;
    const size=Math.min(MAX_ROWS,Math.floor((avail-headH)/rowH));
    return size<MIN_ROWS?null:{size:size,maxHeight:avail};
  }
  function applyFit(plan){const wrap=wrapEl();if(!wrap)return;wrap.style.maxHeight=plan?plan.maxHeight+'px':'';wrap.style.overflowY=plan?'auto':'';}
  function requestedSize(){
    const sel=$('gameRankSize'), v=sel?sel.value:'';
    if(v==='All')return 10000;
    if(v==='-'||!v){const p=fitPlan();return p?p.size:20;}
    return Number(v)||20;
  }
  function info(rows,size){
    const el=$('gameRankInfo');if(!el)return;
    const total=Number(totalElements)||0, n=Array.isArray(rows)?rows.length:0;
    const from=(total&&n)?page*size+1:0, to=(total&&n)?Math.min(page*size+n,total):0;
    el.textContent='Showing '+from+' to '+to+' of '+total+' members';
  }
  /* Table footer pager — locked anatomy: First · Previous · numbered window (±2 around the
     current page, always including 1 and the last page, a gap > 1 collapsed into an ellipsis)
     · Next · Last, all on the locked .smart-page chrome emitted into nav.mad-pager. */
  function pager(){
    const box=$('gameRankPager');if(!box)return;
    const total=Math.max(1,Number(totalPages)||1), cur=Math.max(1,Math.min(page+1,total));
    /* no early return: the ladder renders on a single page too, ends disabled (family contract) */
    const nums=[], add=n=>{if(n>=1&&n<=total&&nums.indexOf(n)<0)nums.push(n);};
    add(1);for(let n=cur-2;n<=cur+2;n++)add(n);add(total);nums.sort((a,b)=>a-b);
    let h='';
    h+='<button type="button" class="smart-page first" id="gameRankFirst" data-page="1" title="First page" aria-label="First page"'+(cur<=1?' disabled':'')+'><i class="bi bi-chevron-bar-left" aria-hidden="true"></i></button>';
    h+='<button type="button" class="smart-page" id="gameRankPrev" data-page="'+(cur-1)+'" title="Previous page" aria-label="Previous page"'+(cur<=1?' disabled':'')+'><i class="bi bi-chevron-left" aria-hidden="true"></i></button>';
    let prev=0;
    nums.forEach(n=>{if(prev&&n-prev>1)h+='<span class="smart-page-ellipsis" aria-hidden="true">…</span>';h+='<button type="button" class="smart-page'+(n===cur?' active':'')+'" data-page="'+n+'"'+(n===cur?' aria-current="page"':'')+'>'+n+'</button>';prev=n;});
    h+='<button type="button" class="smart-page" id="gameRankNext" data-page="'+(cur+1)+'" title="Next page" aria-label="Next page"'+(cur>=total?' disabled':'')+'><i class="bi bi-chevron-right" aria-hidden="true"></i></button>';
    h+='<button type="button" class="smart-page last" id="gameRankLast" data-page="'+total+'" title="Last page" aria-label="Last page"'+(cur>=total?' disabled':'')+'><i class="bi bi-chevron-bar-right" aria-hidden="true"></i></button>';
    box.innerHTML=h;
  }
  async function load(reset){
    if(loading)return;
    if(reset)page=0;
    loading=true;
    const body=$('gameRankBody');
    body.innerHTML='<tr><td colspan="'+COLS+'">Loading...</td></tr>';
    const sel=$('gameRankSize'), auto=!sel||sel.value==='-'||sel.value==='';
    const plan=auto?fitPlan():null;
    const size=auto?(plan?plan.size:20):requestedSize();
    const qs=new URLSearchParams({page:String(page),size:String(size)});
    const q=$('gameRankSearch').value.trim(),p=$('gameRankProvider').value.trim();if(q)qs.set('search',q);if(p)qs.set('providerCode',p);
    try{
      const r=await fetch(API_CONFIG.BASE_URL+endpoint()+'?'+qs,{headers:BO_AUTH.authHeader()});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');
      const d=j.data||{},rows=d.content||[];
      totalPages=Number(d.totalPages||0);totalElements=Number(d.totalElements||0);
      const pageSize=Number(d.size||size)||size;
      $('gameRankCount').textContent=totalElements+' Members';
      info(rows,pageSize);pager();
      body.innerHTML=rows.length?rows.map((r,i)=>`<tr><td>${page*pageSize+i+1}</td><td>${esc(r.memberId)}</td><td>${esc(r.username||'-')}</td><td>${esc(r.fullName||'-')}</td><td>${esc(r.mobile||'-')}</td><td><span class="status-pill info">${esc(r.providerCode||'-')}</span></td><td>${esc(r.gameCode||'-')}</td><td><strong>${money(r.totalTurnover)}</strong></td><td>${Number(r.playCount||0)}</td><td>${dt(r.lastPlayedAt)}</td></tr>`).join(''):'<tr><td colspan="'+COLS+'">No settled game records found.</td></tr>';
      lastFit=plan?plan.size:0;applyFit(plan);
    }catch(e){
      totalPages=0;totalElements=0;$('gameRankCount').textContent='0 Members';info([],size);pager();lastFit=0;applyFit(null);
      body.innerHTML='<tr><td colspan="'+COLS+'">'+esc(e.message)+'</td></tr>';
    }finally{loading=false;}
  }
  /* No Search / Reset / Refresh buttons on this family (owner: "report的所有reset，search，
     refresh按键全去除"). The filters apply themselves: the two text fields on a debounce, the
     footer page-size on change. The three `.onclick` assignments that used to live here were
     unguarded, so deleting the buttons without this would have thrown on load. */
  let rankInputT=0;
  ['gameRankSearch','gameRankProvider'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.addEventListener('input',()=>{clearTimeout(rankInputT);rankInputT=setTimeout(()=>load(true),400)});
  });
  $('gameRankSize').onchange=()=>load(true);
  /* One delegated handler for the whole ladder (page rungs carry data-page); #gameRankPrev and
     #gameRankNext keep their ids so anything clicking them still lands here through the nav. */
  $('gameRankPager').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;const n=Number(b.getAttribute('data-page'));if(!(n>=1)||n>totalPages||n===page+1)return;page=n-1;load(false);});
  ['gameRankSearch','gameRankProvider'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')load(true)}));
  window.addEventListener('resize',()=>{const sel=$('gameRankSize');if(!sel||sel.value!=='-')return;clearTimeout(resizeT);resizeT=setTimeout(()=>{const p=fitPlan();if(p&&p.size!==lastFit)load(false);},250);});
  load(true);
})();