(()=>{
  'use strict';
  const base=(window.API_BASE_URL||window.API_BASE||'').replace(/\/$/,'');
  const today=new Date().toISOString().slice(0,10);
  const from=document.getElementById('reportFrom'),to=document.getElementById('reportTo');
  const bodyEl=document.getElementById('reportBody'),headEl=document.getElementById('reportHead');
  const pageSizeEl=document.getElementById('reportPageSize'),showingEl=document.getElementById('reportShowing'),pagerEl=document.getElementById('reportPager');
  let allRows=[],page=1;
  from.value=new Date(Date.now()-30*864e5).toISOString().slice(0,10);to.value=today;
  if(window.OP_REPORT_KIND==='promotion-report')document.getElementById('typeBox').style.display='none';
  const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const cols=window.OP_REPORT_KIND==='promotion-report'
    ?[['name','Promotion'],['promotionCode','Code'],['claimCount','Claims'],['uniqueClaimers','Unique Claimers'],['repeatedClaimCount','Repeated Claims'],['payoutAmount','Payouts']]
    :[['id','ID'],['memberId','Member'],['ledgerType','Type'],['walletBucket','Wallet'],['amount','In / Out'],['beforeBalance','Before'],['afterBalance','After'],['createdBy','Created By'],['approvedBy','Approved By'],['reasonCode','Reason'],['referenceNo','Reference'],['remark','Remark'],['createdAt','Created'],['postedAt','Posted']];
  function token(){return localStorage.getItem('admin_token')||localStorage.getItem('token')||'';}
  function render(){
    const size=Number(pageSizeEl?.value||10),total=allRows.length,pages=Math.max(1,Math.ceil(total/size));page=Math.min(Math.max(1,page),pages);
    const start=(page-1)*size,rows=allRows.slice(start,start+size);
    headEl.innerHTML='<tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'</tr>';
    bodyEl.innerHTML=rows.length?rows.map(x=>'<tr>'+cols.map(c=>`<td>${esc(x[c[0]]??'-')}</td>`).join('')+'</tr>').join(''):`<tr><td colspan="${cols.length}" class="table-empty">No records found.</td></tr>`;
    if(showingEl)showingEl.textContent=`Showing ${total?start+1:0} to ${Math.min(start+size,total)} of ${total} entries`;
    if(!pagerEl)return;
    const btn=(label,target,disabled,active=false,icon='')=>`<button type="button" class="page-btn${active?' active':''}" data-page="${target}" ${disabled?'disabled':''} aria-label="${label}">${icon?`<i class="bi ${icon}"></i>`:label}</button>`;
    let h=btn('First',1,page<=1,false,'bi-chevron-bar-left')+btn('Previous',page-1,page<=1,false,'bi-chevron-left');
    const lo=Math.max(1,page-2),hi=Math.min(pages,page+2);for(let i=lo;i<=hi;i++)h+=btn(String(i),i,false,i===page);
    h+=btn('Next',page+1,page>=pages,false,'bi-chevron-right')+btn('Last',pages,page>=pages,false,'bi-chevron-bar-right');pagerEl.innerHTML=h;
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
