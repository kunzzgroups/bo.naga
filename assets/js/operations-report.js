(()=>{
  'use strict';
  const base=(window.API_BASE_URL||window.API_BASE||'').replace(/\/$/,'');
  const localToday=()=>window.BO_FORMAT?.today?BO_FORMAT.today():(()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;})();
  const today=localToday();
  const from=document.getElementById('reportFrom'),to=document.getElementById('reportTo');
  const bodyEl=document.getElementById('reportBody'),headEl=document.getElementById('reportHead');
  const pageSizeEl=document.getElementById('reportPageSize'),showingEl=document.getElementById('reportShowing'),pagerEl=document.getElementById('reportPager');
  let allRows=[],page=1;
  // Every BO report now opens on Today by default. Wider ranges are opt-in via the picker.
  from.value=today;to.value=today;
  if(window.OP_REPORT_KIND==='promotion-report')document.getElementById('typeBox').style.display='none';
  const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  // Date/time cell — DD/MM/YYYY on the cell, HH:MM:SS on hover (Wallet Ledger locked pattern).
  const dt=v=>window.BO_FORMAT&&window.BO_FORMAT.dateTime?window.BO_FORMAT.dateTime(v):(v?String(v).replace('T',' ').slice(0,19):'-');
  function dtParts(v){
    const full=dt(v);
    if(!full||full==='-')return{full:'-',day:'-',time:''};
    const m=String(full).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(.+)$/);
    if(m){
      const raw=String(m[4]).trim();
      const tm=raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      const time=tm?`${String(tm[1]).padStart(2,'0')}:${tm[2]}:${tm[3]||'00'}`:raw.slice(0,8);
      const day=`${String(m[3]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${m[1]}`;
      return{full,day,time};
    }
    return{full,day:full,time:''};
  }
  function dtCell(v){
    const p=dtParts(v);
    if(p.full==='-')return '<span class="mad-muted">-</span>';
    if(!p.time)return `<span class="tr-dt">${esc(p.day)}</span>`;
    return `<span class="tr-dt" tabindex="0" data-tip="${esc(p.time)}">${esc(p.day)}</span>`;
  }
  function remarkCell(v){
    const s=String(v??'').trim();
    if(!s)return '<span class="mad-muted">-</span>';
    return `<span class="tr-remark" tabindex="0" data-tip="${esc(s)}">${esc(s)}</span>`;
  }
  // Shared floating tip (position:fixed) so it can never be clipped by the table's
  // overflow:hidden scroll container — same recipe as Wallet Ledger `.wl-time-tip`.
  function ensureFloatTip(){
    let tip=document.getElementById('trFloatTip');
    if(tip)return tip;
    tip=document.createElement('div');
    tip.id='trFloatTip';
    tip.className='tr-float-tip';
    tip.setAttribute('role','tooltip');
    tip.setAttribute('aria-hidden','true');
    document.body.appendChild(tip);
    return tip;
  }
  function placeFloatTip(el){
    const tip=ensureFloatTip();
    const text=el.getAttribute('data-tip')||'';
    if(!text){hideFloatTip();return;}
    tip.textContent=text;
    tip.classList.toggle('is-wide',el.classList.contains('tr-remark'));
    tip.classList.add('is-on');
    const r=el.getBoundingClientRect();
    const tr=tip.getBoundingClientRect();
    let top=r.top-tr.height-8,below=false;
    if(top<8){below=true;top=r.bottom+8;}
    tip.classList.toggle('is-below',below);
    const left=Math.max(8,Math.min(r.left+r.width/2-tr.width/2,window.innerWidth-tr.width-8));
    tip.style.left=Math.round(left)+'px';
    tip.style.top=Math.round(top)+'px';
  }
  function hideFloatTip(){
    const tip=document.getElementById('trFloatTip');
    if(tip)tip.classList.remove('is-on','is-below');
  }
  function bindFloatTips(){
    if(!bodyEl||bodyEl.dataset.tipBound==='1')return;
    bodyEl.dataset.tipBound='1';
    bodyEl.addEventListener('mouseover',e=>{const el=e.target.closest?.('.tr-dt[data-tip],.tr-remark[data-tip]');if(el)placeFloatTip(el);});
    bodyEl.addEventListener('mouseout',e=>{const el=e.target.closest?.('.tr-dt[data-tip],.tr-remark[data-tip]');if(!el)return;const next=e.relatedTarget;if(next&&el.contains(next))return;hideFloatTip();});
    bodyEl.addEventListener('focusin',e=>{const el=e.target.closest?.('.tr-dt[data-tip],.tr-remark[data-tip]');if(el)placeFloatTip(el);});
    bodyEl.addEventListener('focusout',e=>{const el=e.target.closest?.('.tr-dt[data-tip],.tr-remark[data-tip]');if(!el)return;const next=e.relatedTarget;if(next&&el.contains(next))return;hideFloatTip();});
    window.addEventListener('scroll',hideFloatTip,true);
    window.addEventListener('resize',hideFloatTip);
  }
  const cols=window.OP_REPORT_KIND==='promotion-report'
    ?[['name','Promotion'],['promotionCode','Code'],['claimCount','Claims'],['uniqueClaimers','Unique Claimers'],['repeatedClaimCount','Repeated Claims'],['payoutAmount','Payouts']]
    :[['id','ID'],['memberId','Member'],['ledgerType','Type'],['walletBucket','Wallet'],['amount','In / Out'],['beforeBalance','Before'],['afterBalance','After'],['createdBy','Created By'],['approvedBy','Approved By'],['reasonCode','Reason'],['referenceNo','Reference'],['remark','Remark'],['createdAt','Created'],['postedAt','Posted']];
  function token(){return localStorage.getItem('bo_admin_token')||localStorage.getItem('admin_token')||localStorage.getItem('token')||'';}
  function render(){
    const size=Number(pageSizeEl?.value||10),total=allRows.length,pages=Math.max(1,Math.ceil(total/size));page=Math.min(Math.max(1,page),pages);
    const start=(page-1)*size,rows=allRows.slice(start,start+size);
    headEl.innerHTML='<tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'</tr>';
    bodyEl.innerHTML=rows.length?rows.map(x=>'<tr>'+cols.map(c=>{
      const v=x[c[0]];
      if(c[0]==='createdAt'||c[0]==='postedAt')return `<td>${dtCell(v)}</td>`;
      if(c[0]==='remark')return `<td>${remarkCell(v)}</td>`;
      return `<td>${esc(v??'-')}</td>`;
    }).join('')+'</tr>').join(''):`<tr><td colspan="${cols.length}" class="table-empty">No records found.</td></tr>`;
    if(showingEl)showingEl.textContent=`Showing ${total?start+1:0} to ${Math.min(start+size,total)} of ${total} entries`;
    bindFloatTips();
    if(!pagerEl)return;
    const btn=(label,target,disabled,active=false,icon='')=>`<button type="button" class="page-btn${active?' active':''}" data-page="${target}" ${disabled?'disabled':''} aria-label="${label}">${icon?`<i class="bi ${icon}"></i>`:label}</button>`;
    // First · Prev · page window (always 1 + last, ellipsis when gaps > 1) · Next · Last — locked pager anatomy.
    const pageList=(()=>{
      const list=[];const add=n=>{if(n>=1&&n<=pages&&!list.includes(n))list.push(n);};
      add(1);for(let n=page-2;n<=page+2;n++)add(n);add(pages);list.sort((a,b)=>a-b);return list;
    })();
    let h=btn('First',1,page<=1,false,'bi-chevron-bar-left')+btn('Previous',page-1,page<=1,false,'bi-chevron-left');
    let prevN=0;
    pageList.forEach(n=>{
      if(prevN&&n-prevN>1)h+='<span class="smart-page-ellipsis" aria-hidden="true">…</span>';
      h+=btn(String(n),n,false,n===page);
      prevN=n;
    });
    h+=btn('Next',page+1,page>=pages,false,'bi-chevron-right')+btn('Last',pages,page>=pages,false,'bi-chevron-bar-right');
    pagerEl.innerHTML=h;
  }
  async function fetchRows(type){
    let u=`${base}${window.OP_REPORT_ENDPOINT}?from=${encodeURIComponent(from.value)}&to=${encodeURIComponent(to.value)}`;
    if(type)u+=`&type=${encodeURIComponent(type)}`;
    const r=await fetch(u,{headers:{Authorization:'Bearer '+token(),'Cache-Control':'no-cache, no-store'}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error')throw new Error(j.message||`Unable to load report (${r.status})`);
    return Array.isArray(j.data)?j.data:(j.data?.content||[]);
  }
  async function load(){
    bodyEl.innerHTML=`<tr><td colspan="${cols.length}" class="table-empty">Loading...</td></tr>`;
    try{
      if(window.OP_REPORT_KIND==='transaction-report'){
        const [outRows,inRows]=await Promise.all([fetchRows('TRANSFER_OUT'),fetchRows('TRANSFER_IN')]);
        const seen=new Set();
        allRows=[...outRows,...inRows].filter(row=>{
          const key=String(row.id??`${row.memberId}|${row.ledgerType}|${row.referenceNo}|${row.createdAt}|${row.amount}`);
          if(seen.has(key))return false; seen.add(key); return true;
        }).sort((a,b)=>String(b.createdAt||b.postedAt||'').localeCompare(String(a.createdAt||a.postedAt||'')));
      }else{
        const type=window.OP_REPORT_KIND==='promotion-report'?'':document.getElementById('reportType').value;
        allRows=await fetchRows(type);
      }
      page=1;render();
    }catch(e){allRows=[];render();if(window.BO_DIALOG)await BO_DIALOG.alert(e.message||'Unable to load report.',{title:'Report Error',type:'error'});}
  }
  document.getElementById('reportSearch').onclick=load;
  pageSizeEl?.addEventListener('change',()=>{page=1;render();});
  pagerEl?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;page=Number(b.dataset.page)||1;render();});
  load();
})();
