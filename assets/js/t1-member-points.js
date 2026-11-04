(function(){
  'use strict';
  const root=()=>API_CONFIG.BASE_URL+'/admin/t1-points';
  const by=id=>document.getElementById(id);
  const fmt=n=>Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4});
  const safeError=(message,status)=>{
    const raw=String(message||'');
    if(/PreparedStatementCallback|bad SQL grammar|SQLSyntaxErrorException|information_schema|SELECT COUNT\(\*\)|t1_points_adjustment_audit/i.test(raw))
      return 'Points history is temporarily unavailable. Please ask the administrator to verify the T1 points database migration.';
    if(status===401||status===403)return 'You do not have permission to access this member points data.';
    if(status===503)return 'Points adjustment is unavailable until the points audit migration is installed.';
    return raw && raw.length<250?raw:'Unable to load points. Please retry or contact an administrator.';
  };
  const escapeHtml=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let memberId=null,page=0,hasMore=false,busy=false,requestId='',pendingFingerprint='';
  const status=(msg,error)=>{const el=by('memberPointsStatus');if(el){el.textContent=msg;el.className='upload-status '+(error?'error':'success');}};
  const call=async (path,options={})=>{
    const response=await fetch(root()+path,{...options,headers:{...BO_AUTH.authHeader(),...(options.headers||{})},cache:'no-store'});
    const json=await response.json().catch(()=>({}));
    if(!response.ok || json.status==='error')throw new Error(safeError(json.message||json.error,response.status));
    return json.data || {};
  };
  async function loadBalance(){
    if(!memberId)return;
    const id=memberId;
    const data=await call('/member/'+encodeURIComponent(id));
    if(id!==memberId)return;
    if(by('memberPointsBalance'))by('memberPointsBalance').textContent=fmt(data.points);
  }
  async function loadHistory(){
    if(!memberId)return;
    const id=memberId, current=page;
    const query=new URLSearchParams({memberId:String(id),type:by('memberPointsType')?.value||'ALL',page:String(page),size:'20'});
    const data=await call('/ledger?'+query);
    if(id!==memberId||page!==current)return;
    hasMore=!!data.hasMore;
    const rows=Array.isArray(data.items)?data.items:[];
    const table=by('memberPointsHistory');
    if(table)table.innerHTML=rows.length?rows.map(row=>`<tr>
      <td>${escapeHtml(String(row.createdAt||'').replace('T',' ').slice(0,19))}</td>
      <td>${escapeHtml(row.referenceType)}</td>
      <td class="${Number(row.delta)<0?'text-danger':'text-success'}">${Number(row.delta)>0?'+':''}${escapeHtml(fmt(row.delta))}</td>
      <td>${escapeHtml(fmt(row.balanceAfter))}</td>
      <td>${escapeHtml(row.adminName)}</td>
      <td>${escapeHtml(row.remark||row.referenceId)}</td></tr>`).join(''):'<tr><td colspan="6">No points transactions.</td></tr>';
    if(by('memberPointsPage'))by('memberPointsPage').textContent='Page '+(page+1)+' · '+data.total+' records';
    if(by('memberPointsPrev'))by('memberPointsPrev').disabled=page===0;
    if(by('memberPointsNext'))by('memberPointsNext').disabled=!hasMore;
  }
  async function refresh(id){
    if(id)memberId=Number(id);
    if(!memberId||busy)return;
    busy=true;
    try{await Promise.all([loadBalance(),loadHistory()]);status('',false);}
    catch(e){status(e.message||'Unable to load points',true);}
    finally{busy=false;}
  }
  function activate(id){
    const parsed=Number(id);
    if(!Number.isSafeInteger(parsed)||parsed<=0)return;
    if(parsed!==memberId){memberId=parsed;page=0;}
    if(by('pointsFullReport'))by('pointsFullReport').href='t1-points-report.html?memberId='+encodeURIComponent(parsed);
    void refresh();
  }
  const wait=()=>{
    const amount=Number(by('memberPointsAmount')?.value||0),reason=by('memberPointsReason')?.value.trim()||'';
    if(!Number.isFinite(amount)||amount<=0||amount>1000000||Math.abs(amount*10000-Math.round(amount*10000))>1e-7){status('Points must be above 0, max 1,000,000, with up to 4 decimals.',true);return;}
    if(reason.length<5){status('Please provide a reason of at least 5 characters.',true);return;}
    const delta=by('memberPointsDirection')?.value==='DEDUCT'?-amount:amount;
    const dialog=by('memberPointsConfirm');
    if(!dialog)return;
    if(by('memberPointsConfirmText'))by('memberPointsConfirmText').textContent=(delta>0?'Add ':'Deduct ')+fmt(amount)+' points for this member? Reason: '+reason;
    const fingerprint=[memberId,delta,reason].join('||');
    if(fingerprint!==pendingFingerprint || !requestId){
      requestId=(window.crypto && typeof window.crypto.randomUUID==='function')?window.crypto.randomUUID():'req-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      pendingFingerprint=fingerprint;
    }
    dialog.returnValue='';
    dialog.dataset.delta=String(delta);
    dialog.dataset.reason=reason;
    dialog.showModal();
  };
  async function submit(){
    if(busy||!memberId||!requestId)return;
    busy=true;
    const button=by('memberPointsSubmit');if(button)button.disabled=true;
    try{
      const payload={memberId,delta:Number(by('memberPointsConfirm').dataset.delta),remark:by('memberPointsConfirm').dataset.reason,requestId};
      const result=await call('/adjust',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      status(result.duplicate?'Already processed; balance unchanged.':'Points updated successfully.',false);
      if(by('memberPointsAmount'))by('memberPointsAmount').value='';
      if(by('memberPointsReason'))by('memberPointsReason').value='';
      page=0;
      await Promise.all([loadBalance(),loadHistory()]);
      requestId='';pendingFingerprint='';
    }catch(e){status(e.message||'Points adjustment failed. You can retry safely.',true);}
    finally{busy=false;if(button)button.disabled=false;}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    by('memberPointsSubmit')?.addEventListener('click',wait);
    by('memberPointsConfirm')?.addEventListener('close',event=>{const choice=event.target.returnValue;event.target.returnValue='';if(choice==='confirm')void submit();});
    by('memberPointsRefresh')?.addEventListener('click',()=>void refresh());
    by('memberPointsFilter')?.addEventListener('click',()=>{page=0;void refresh();});
    by('memberPointsPrev')?.addEventListener('click',()=>{if(page>0){page--;void refresh();}});
    by('memberPointsNext')?.addEventListener('click',()=>{if(hasMore){page++;void refresh();}});
    // Points can change on another BO session; avoid constant refresh when this tab is hidden.
    window.setInterval(()=>{
      if(document.visibilityState==='visible' && document.querySelector('[data-wallet-tab="points"]')?.classList.contains('active'))void refresh();
    },9000);
    window.addEventListener('focus',()=>{if(document.querySelector('[data-wallet-tab="points"]')?.classList.contains('active'))void refresh();});
  });
  window.T1MemberPoints={activate,refresh};
})();
