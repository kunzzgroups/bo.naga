(function(){
 'use strict';
 const $=id=>document.getElementById(id),esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeError=(message,status)=>{
    const raw=String(message||'');
    if(/PreparedStatementCallback|bad SQL grammar|SQLSyntaxErrorException|information_schema|SELECT COUNT\(\*\)|t1_points_adjustment_audit/i.test(raw))
      return 'Points history is temporarily unavailable. Please ask the administrator to verify the T1 points database migration.';
    if(status===401||status===403)return 'You do not have permission to access this member points data.';
    if(status===503)return 'Points adjustment is unavailable until the points audit migration is installed.';
    return raw && raw.length<250?raw:'Unable to load points. Please retry or contact an administrator.';
  };
 const num=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4});
 const base=()=>API_CONFIG.BASE_URL+'/admin/t1-points';
 let page=0,more=false,busy=false;
 const params=()=>{
  const q=new URLSearchParams();
  for(const [k,id] of [['memberId','pointReportMember'],['username','pointReportUsername'],['type','pointReportType'],['from','pointReportFrom'],['until','pointReportUntil']]){
   const value=$(id)?.value.trim();if(value)q.set(k,value);
  }
  return q;
 };
 const api=async path=>{
  const response=await fetch(base()+path,{headers:{...BO_AUTH.authHeader()},cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok || data.status==='error')throw new Error(safeError(data.message||data.error,response.status));
  return data.data||{};
 };
 function status(message,error){const el=$('pointReportStatus');if(el){el.textContent=message;el.className='upload-status '+(error?'error':'');}}
 async function load(){
  if(busy)return;busy=true;
  try{
   status('Loading...',false);
   const q=params();q.set('page',String(page));q.set('size','50');
   const [list,summary]=await Promise.all([api('/ledger?'+q),api('/summary?'+params())]);
   more=!!list.hasMore;
   $('pointReportCount').textContent=String(summary.transactions??0);
   $('pointReportCredit').textContent=num(summary.credited);
   $('pointReportDebit').textContent=num(summary.deducted);
   $('pointReportPage').textContent='Page '+(page+1)+' / '+(Math.max(1,Math.ceil(Number(list.total||0)/50)))+' · '+list.total+' rows';
   $('pointReportPrev').disabled=page===0;$('pointReportNext').disabled=!more;
   $('pointReportRows').innerHTML=(list.items||[]).map(r=>`<tr><td>${esc(r.createdAt)}</td><td><a href="member-detail.html?memberId=${encodeURIComponent(r.memberId)}&tab=points">${esc(r.username)} (#${esc(r.memberId)})</a></td><td>${esc(r.referenceType)}</td><td>${esc(r.delta)}</td><td>${esc(r.balanceAfter)}</td><td>${esc(r.adminName)}</td><td>${esc(r.remark||r.referenceId)}</td></tr>`).join('')||'<tr><td colspan="7">No points records found.</td></tr>';
   status('',false);
  }catch(e){status(e.message||'Unable to load points report',true);}finally{busy=false;}
 }
 async function exportCsv(){
  const button=$('pointReportExport');if(button)button.disabled=true;
  try{
   // Export 1000 records per page. For more records use Next Export Page.
   const q=params();q.set('page',String(Number($('pointExportPage').value)||0));
   const response=await fetch(base()+'/export?'+q,{headers:{...BO_AUTH.authHeader()},cache:'no-store'});
   if(!response.ok)throw new Error('CSV download failed ('+response.status+')');
   const file=await response.blob(),url=URL.createObjectURL(file),a=document.createElement('a');
   a.href=url;a.download='t1-points-report-'+q.get('page')+'.csv';a.click();URL.revokeObjectURL(url);
   status('Exported up to 1,000 rows for selected export page.',false);
  }catch(e){status(e.message||'CSV export failed',true)}finally{if(button)button.disabled=false;}
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const query=new URLSearchParams(location.search);if(query.has('memberId'))$('pointReportMember').value=query.get('memberId');
  $('pointReportSearch')?.addEventListener('click',()=>{page=0;void load();});
  $('pointReportPrev')?.addEventListener('click',()=>{if(page>0){page--;void load();}});
  $('pointReportNext')?.addEventListener('click',()=>{if(more){page++;void load();}});
  $('pointReportExport')?.addEventListener('click',()=>void exportCsv());
  void load();
 });
})();
