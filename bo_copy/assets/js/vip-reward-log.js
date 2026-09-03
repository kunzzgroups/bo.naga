(function(){
  const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let page=1,total=1,totalElements=0,pageSize=20;
  const url=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];
  const headers=()=>Object.assign({'Content-Type':'application/json'},window.BO_AUTH?BO_AUTH.authHeader():{});
  const money=v=>'MYR '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  async function load(p=1){
    page=p; const q=new URLSearchParams({page,size:pageSize});
    const kw=$('#rewardKeyword').value.trim(),type=$('#rewardType').value,status=$('#rewardStatus').value;
    if(kw)q.set('keyword',kw); if(type)q.set('type',type); if(status)q.set('status',status);
    const r=await fetch(url('VIP_REWARD_LOGS')+'?'+q,{headers:headers()}); const j=await r.json();
    if(!r.ok||j.status==='error')throw new Error(j.message||'Unable to load VIP rewards.');
    const d=j.data||{},rows=d.content||[]; total=Number(d.pagination?.totalPages||1); totalElements=Number(d.pagination?.totalElements??d.pagination?.total??rows.length);
    $('#rewardBody').innerHTML=rows.length?rows.map(x=>`<tr><td>${x.createdAt?new Date(x.createdAt).toLocaleString():'-'}</td><td><b>${esc(x.username||'ID '+x.memberId)}</b><small>${esc(x.mobile||'')}</small></td><td><span class="vip-source-pill">${esc(x.rewardType)}</span></td><td>${esc(x.periodKey)}<small>${esc(x.category||'')}</small></td><td>${money(x.baseAmount)}</td><td>${Number(x.rate||0).toFixed(4)}%</td><td><b>${money(x.rewardAmount)}</b><small>Turnover ${money(x.turnoverRequired)}</small></td><td>${money(x.maintenanceActual)} / ${money(x.maintenanceRequired)}</td><td><span class="vip-source-pill">${esc(x.status)}</span></td><td>${esc(x.referenceNo||'-')}<small>${esc(x.remark||'')}</small></td></tr>`).join(''):'<tr><td colspan="10">No VIP reward records found.</td></tr>';
    renderPages(); renderInfo(rows.length);
  }
  function renderInfo(rowCount){const info=$('#rewardPageInfo');if(!info)return;const from=totalElements&&rowCount?((page-1)*pageSize+1):0;const to=totalElements?Math.min((page-1)*pageSize+rowCount,totalElements):0;info.textContent=`Showing ${from} to ${to} of ${totalElements} entries`;}
  function renderPages(){let h=`<button ${page<=1?'disabled':''} data-page="${page-1}">‹</button>`;for(let i=Math.max(1,page-2);i<=Math.min(total,page+2);i++)h+=`<button class="${i===page?'active':''}" data-page="${i}">${i}</button>`;h+=`<button ${page>=total?'disabled':''} data-page="${page+1}">›</button>`;$('#rewardPagination').innerHTML=h;}
  $('#rewardPageSize')?.addEventListener('change',e=>{pageSize=Number(e.target.value||20);load(1).catch(err=>alert(err.message));});
  document.addEventListener('click',e=>{const p=e.target.closest('[data-page]');if(p&&!p.disabled)load(Number(p.dataset.page)).catch(err=>alert(err.message));if(e.target.closest('#rewardSearch'))load(1).catch(err=>alert(err.message));});
  load().catch(err=>{$('#rewardBody').innerHTML='<tr><td colspan="10">Unable to load VIP rewards.</td></tr>';alert(err.message);});
})();