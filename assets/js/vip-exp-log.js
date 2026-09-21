(function(){
 const $=s=>document.querySelector(s), esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); let page=1,totalPages=1,totalElements=0,pageSize=20;
 const endpoint=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k]; const headers=()=>Object.assign({'Content-Type':'application/json'},window.BO_AUTH?BO_AUTH.authHeader():{});
 const pad=n=>String(n).padStart(2,'0');
 function splitDate(v){
  if(!v) return {day:'—',time:'',title:''};
  const d=new Date(v);
  if(Number.isNaN(d.getTime())){const s=esc(v);return {day:s,time:'',title:s};}
  const day=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const time=`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return {day,time,title:`${day} ${time}`};
 }
 function emptyRow(msg){return `<tr><td class="vip-log-empty" colspan="8">${esc(msg)}</td></tr>`;}
 async function load(p){
  page=p||1;
  const q=new URLSearchParams({page:String(page),size:String(pageSize)}),kw=$('#vipLogKeyword')?.value.trim(),src=$('#vipLogSource')?.value;
  if(kw)q.set('keyword',kw);if(src)q.set('source',src);
  const body=$('#vipExpLogBody');
  try{
   const r=await fetch(endpoint('VIP_EXP_LOGS')+'?'+q,{headers:headers()});
   const j=await r.json();
   const d=j.data||{},rows=d.content||[],pg=d.pagination||{};
   totalPages=Number(pg.totalPages||1);totalElements=Number(pg.totalElements??pg.total??rows.length);
   if(body)body.innerHTML=rows.length?rows.map(x=>{
    const dt=splitDate(x.createdAt);
    const change=Number(x.experienceChange||0);
    const pos=change>=0;
    const mobile=x.mobile?`<small>${esc(x.mobile)}</small>`:'';
    return `<tr>
      <td><span class="vip-log-datetime" title="${dt.title}"><span class="vip-log-date">${dt.day}</span><span class="vip-log-time">${dt.time}</span></span></td>
      <td class="vip-log-member"><b>${esc(x.username||('ID '+x.memberId))}</b>${mobile}</td>
      <td><span class="vip-source-pill">${esc(x.sourceType||'—')}</span></td>
      <td class="${pos?'vip-exp-positive':'vip-exp-negative'}">${pos?'+':''}${change.toLocaleString()}</td>
      <td class="vip-log-num">${Number(x.balanceBefore||0).toLocaleString()}</td>
      <td class="vip-log-num">${Number(x.balanceAfter||0).toLocaleString()}</td>
      <td class="vip-col-reference"><span class="vip-log-clip" title="${esc(x.referenceId||'')}">${esc(x.referenceId||'—')}</span></td>
      <td class="vip-col-remark"><span class="vip-log-clip" title="${esc(x.remark||'')}">${esc(x.remark||'—')}</span></td>
    </tr>`;
   }).join(''):emptyRow('No EXP logs found.');
   renderPages();renderInfo(rows.length);
  }catch(err){
   if(body)body.innerHTML=emptyRow('Unable to load VIP EXP logs.');
   renderPages();renderInfo(0);
  }
 }
 function renderInfo(rowCount){const info=$('#vipLogPageInfo');if(!info)return;const from=totalElements&&rowCount?((page-1)*pageSize+1):0;const to=totalElements?Math.min((page-1)*pageSize+rowCount,totalElements):0;info.textContent=`Showing ${from} to ${to} of ${totalElements} entries`;}
 function renderPages(){const w=$('#vipLogPagination');if(!w)return;let html=`<button type="button" ${page<=1?'disabled':''} data-log-page="${page-1}" aria-label="Previous page">‹</button>`;for(let i=Math.max(1,page-2);i<=Math.min(totalPages,page+2);i++)html+=`<button type="button" class="${i===page?'active':''}" data-log-page="${i}" ${i===page?'aria-current="page"':''}>${i}</button>`;html+=`<button type="button" ${page>=totalPages?'disabled':''} data-log-page="${page+1}" aria-label="Next page">›</button>`;w.innerHTML=html;}
 function modal(show){
  const m=$('#vipAdjustModal');if(!m)return;
  m.classList.toggle('show',show);
  m.hidden=!show;
  document.body.classList.toggle('vip-modal-open',show||document.querySelector('#vipModal.show'));
  if(show) setTimeout(()=>$('#vipAdjustMemberId')?.focus(),40);
 }
 function resetFilters(){
  const kw=$('#vipLogKeyword'),src=$('#vipLogSource');
  if(kw)kw.value='';
  if(src)src.value='';
  load(1);
 }
 document.addEventListener('click',e=>{
  if(e.target.closest('#vipLogSearch'))load(1);
  if(e.target.closest('#vipLogReset'))resetFilters();
  if(e.target.closest('#vipAdjustOpen'))modal(true);
  if(e.target.closest('[data-close-adjust]'))modal(false);
  const b=e.target.closest('[data-log-page]');
  if(b&&!b.disabled)load(Number(b.dataset.logPage));
  if(e.target===$('#vipAdjustModal'))modal(false);
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && $('#vipAdjustModal')?.classList.contains('show')) modal(false);
  if(e.key==='Enter' && e.target && (e.target.id==='vipLogKeyword' || e.target.id==='vipLogSource')){e.preventDefault();load(1);}
 });
 $('#vipLogPageSize')?.addEventListener('change',e=>{pageSize=Number(e.target.value||20);load(1);});
 $('#vipAdjustForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const data={memberId:Number($('#vipAdjustMemberId').value),amount:Number($('#vipAdjustAmount').value),reason:$('#vipAdjustReason').value.trim()};
  if(!data.amount)return alert('EXP amount cannot be 0');
  const r=await fetch(endpoint('VIP_EXP_ADJUST'),{method:'POST',headers:headers(),body:JSON.stringify(data)}),j=await r.json();
  if(!r.ok||j.status==='error')return alert(j.message||'Adjustment failed');
  modal(false);e.target.reset();load(1);alert(j.message||'VIP EXP adjusted');
 });
 load(1);
})();
