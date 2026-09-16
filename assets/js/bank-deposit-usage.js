(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(String(v==null?0:v).replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const money=v=>num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const endpoint=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];
  async function api(url,opt){
    const r=await fetch(url,opt||{headers:{...BO_AUTH.authHeader()}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');
    return opt?.method&&opt.method!=='GET'?j:(j.data||{});
  }
  function norm(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');}
  function setToday(){const d=new Date(),p=n=>String(n).padStart(2,'0'),iso=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());if($('usageFrom'))$('usageFrom').value=iso;if($('usageTo'))$('usageTo').value=iso;}
  function paymentKeys(m){return [m.id,m.displayName,m.bankName,m.accountName,m.accountNumber,m.payId].map(norm).filter(Boolean);}
  function matchDeposit(row,methods){
    const finalId=String(row?.approvedPaymentMethodId??row?.paymentMethodId??'').trim();if(finalId){const exact=methods.find(m=>String(m.id)===finalId);if(exact)return exact;}
    const candidates=[row?.approvedPaymentMethod,row?.paymentMethod,row?.paymentMethodName,row?.methodName,row?.bankName].map(norm).filter(Boolean);for(const c of candidates){const exact=methods.find(m=>paymentKeys(m).includes(c));if(exact)return exact;}for(const c of candidates){const byType=methods.filter(m=>norm(m.methodType)===c);if(byType.length===1)return byType[0];}return null;
  }
  function matchWithdraw(row,methods){const id=String(row?.fundingPaymentMethodId??'').trim();if(id)return methods.find(m=>String(m.id)===id)||null;const v=norm(row?.fundingPaymentMethod);if(v){const exact=methods.find(m=>paymentKeys(m).includes(v));if(exact)return exact;}return null;}
  async function loadAllMethods(){const d=await api(endpoint('PAYMENT_METHOD_LIST'));return Array.isArray(d)?d:(d.content||d.items||d.list||[]);}
  async function loadAll(key){let all=[],page=1,guard=0;const from=$('usageFrom')?.value||'',to=$('usageTo')?.value||'';while(guard++<500){const q=new URLSearchParams({status:'APPROVED',page:String(page),size:'100'});if(from)q.set('dateFrom',from);if(to)q.set('dateTo',to);const d=await api(endpoint(key)+'?'+q);const rows=d.content||d.items||d.list||[];all.push(...rows);const pg=d.pagination||d,totalPages=Number(pg.totalPages||1)||1;if(page>=totalPages||!rows.length)break;page++;}return all;}
  async function loadManualBankMovements(){
    let all=[],page=1,guard=0;const from=$('usageFrom')?.value||'',to=$('usageTo')?.value||'';
    while(guard++<500){
      const q=new URLSearchParams({types:'ADMIN_DEPOSIT,ADMIN_WITHDRAW',page:String(page),size:'100'});
      if(from)q.set('from',from);if(to)q.set('to',to);
      const d=await api(endpoint('WALLET_LEDGER_LIST')+'?'+q);
      const rows=(d.content||d.items||d.list||[]).filter(r=>r.paymentMethodId!=null&&String(r.paymentMethodId).trim()!=='');
      all.push(...rows);const pg=d.pagination||d,totalPages=Number(pg.totalPages||1)||1;if(page>=totalPages||!(d.content||d.items||d.list||[]).length)break;page++;
    }
    return all;
  }
  function showBtn(m){
    const on=Number(m.status)===1;
    return `<button type="button" class="usage-show-switch ${on?'is-on':'is-off'}" data-usage-show='${esc(JSON.stringify(m))}' role="switch" aria-checked="${on?'true':'false'}" title="${on?'Click to hide this bank':'Click to show this bank'}" aria-label="${on?'Bank visible, click to hide':'Bank hidden, click to show'}"><span class="usage-show-switch-track" aria-hidden="true"><span class="usage-show-switch-thumb"></span></span></button>`;
  }
  async function toggleShow(m,btn){
    const next=Number(m.status)===1?0:1;
    const fd=new FormData();
    const fields={
      id:m.id,
      methodType:m.methodType,
      displayName:m.displayName,
      subtitle:m.subtitle,
      bankName:m.bankName,
      accountName:m.accountName,
      accountNumber:m.accountNumber,
      bankBsb:m.bankBsb,
      payId:m.payId,
      instructions:m.instructions,
      minAmount:m.minAmount,
      maxAmount:m.maxAmount,
      sortOrder:m.sortOrder,
      visibleVipTiers:m.visibleVipTiers,
      dailyLimit:m.dailyLimit,
      autoRotateOnLimit:m.autoRotateOnLimit,
      status:next
    };
    Object.keys(fields).forEach(k=>{
      const v=fields[k];
      if(v==null||v===''){ if(k!=='id')fd.append(k,''); return; }
      fd.append(k,v);
    });
    if(btn){btn.disabled=true;btn.classList.add('is-busy');}
    try{
      await api(endpoint('PAYMENT_METHOD_SAVE'),{method:'POST',headers:{...BO_AUTH.authHeader()},body:fd});
      await load();
    }catch(err){
      alert(err.message||'Failed to update bank visibility');
      if(btn){btn.disabled=false;btn.classList.remove('is-busy');}
    }
  }
  function render(methods,deposits,withdrawals,manualMovements){
    const stats=new Map(methods.map(m=>[String(m.id),{deposit:0,depositCount:0,withdraw:0,withdrawCount:0}]));let unmatchedDeposit=0,unmatchedWithdraw=0,unmatchedCount=0;
    deposits.forEach(r=>{const m=matchDeposit(r,methods);if(!m){unmatchedDeposit+=num(r.amount);unmatchedCount++;return;}const st=stats.get(String(m.id));st.deposit+=num(r.amount);st.depositCount++;});
    withdrawals.forEach(r=>{const m=matchWithdraw(r,methods);if(!m){unmatchedWithdraw+=num(r.amount);unmatchedCount++;return;}const st=stats.get(String(m.id));st.withdraw+=num(r.amount);st.withdrawCount++;});
    (manualMovements||[]).forEach(r=>{const m=methods.find(x=>String(x.id)===String(r.paymentMethodId));if(!m)return;const st=stats.get(String(m.id));const t=String(r.ledgerType||'').toUpperCase();if(t==='ADMIN_DEPOSIT'){st.deposit+=Math.abs(num(r.amount));st.depositCount++;}else if(t==='ADMIN_WITHDRAW'){st.withdraw+=Math.abs(num(r.amount));st.withdrawCount++;}});
    const kw=norm($('usageKeyword')?.value||''),filtered=methods.filter(m=>!kw||paymentKeys(m).some(k=>k.includes(kw)));
    const manualDeposits=(manualMovements||[]).filter(r=>String(r.ledgerType||'').toUpperCase()==='ADMIN_DEPOSIT'),manualWithdrawals=(manualMovements||[]).filter(r=>String(r.ledgerType||'').toUpperCase()==='ADMIN_WITHDRAW');
    $('usageBankCount')&&($('usageBankCount').textContent=methods.length.toLocaleString());
    $('usageApprovedCount')&&($('usageApprovedCount').textContent=(deposits.length+manualDeposits.length).toLocaleString());
    $('usageApprovedAmount')&&($('usageApprovedAmount').textContent=money(deposits.reduce((a,r)=>a+num(r.amount),0)+manualDeposits.reduce((a,r)=>a+Math.abs(num(r.amount)),0)));
    $('usageWithdrawAmount')&&($('usageWithdrawAmount').textContent=money(withdrawals.reduce((a,r)=>a+num(r.amount),0)+manualWithdrawals.reduce((a,r)=>a+Math.abs(num(r.amount)),0)));
    $('usageUnmatchedAmount')&&($('usageUnmatchedAmount').textContent=money(unmatchedDeposit+unmatchedWithdraw));
    const body=$('usageBody');
    body.innerHTML=filtered.length?filtered.map(m=>{
      const st=stats.get(String(m.id))||{deposit:0,depositCount:0,withdraw:0,withdrawCount:0};
      const net=st.deposit-st.withdraw,min=num(m.minAmount),max=num(m.maxAmount),daily=num(m.dailyLimit),pct=max>0?(Math.max(0,net)/max*100):0,fillClass=pct>=100?'over':pct>=80?'warn':'',cap=max>0?money(max):'No max',dailyText=daily>0?money(daily):'-';
      const accountHtml=m.accountName||m.accountNumber?`${m.accountName?`<span class="usage-account-line">${esc(m.accountName)}</span>`:''}${m.accountNumber?`<span class="usage-account-line">${esc(m.accountNumber)}</span>`:''}`:'<span class="usage-account-line">-</span>';
      return `<tr>
        <td><span class="usage-bank-name">${esc(m.bankName||m.displayName||'-')}</span></td>
        <td class="usage-account">${accountHtml}</td>
        <td><b>${money(min)}</b> - <b>${max>0?money(max):'No max'}</b></td>
        <td><b>+${money(st.deposit)}</b><br><small>${st.depositCount.toLocaleString()} deposit movement(s)</small></td>
        <td><b>-${money(st.withdraw)}</b><br><small>${st.withdrawCount.toLocaleString()} withdrawal movement(s)</small></td>
        <td><div class="usage-meter"><div class="usage-meter-line"><span>${money(net)}</span><span>/ ${cap}</span></div>${max>0?`<div class="usage-track"><div class="usage-fill ${fillClass}" style="width:${Math.min(100,pct).toFixed(2)}%"></div></div>`:''}</div></td>
        <td>${dailyText}</td>
        <td>${max>0?`<b>${pct.toFixed(1)}%</b>`:'<span class="usage-muted">No max configured</span>'}</td>
        <td><span class="status-pill ${Number(m.status)===1?'active':'off'}">${Number(m.status)===1?'ACTIVE':'INACTIVE'}</span></td>
        <td class="usage-show-cell">${showBtn(m)}</td>
        <td><div class="bo-tx-actions"><a class="bo-tx-action-btn is-edit" href="payment-method-create.html?id=${encodeURIComponent(m.id)}&from=usage" title="Edit" aria-label="Edit"><i class="bi bi-pencil" aria-hidden="true"></i></a><button type="button" class="bo-tx-action-btn is-reject" title="Delete" aria-label="Delete" data-usage-del="${esc(m.id)}"><i class="bi bi-trash" aria-hidden="true"></i></button></div></td>
      </tr>`;
    }).join(''):'<tr><td colspan="11">No payment method found.</td></tr>';
    $('usageInfo').textContent=`${filtered.length} bank record(s) · ${unmatchedCount} unmatched approved transaction(s)`;
  }
  async function load(){
    const body=$('usageBody');
    if(body)body.innerHTML='<tr><td colspan="11">Loading...</td></tr>';
    try{
      const [methods,deposits,withdrawals,manualMovements]=await Promise.all([loadAllMethods(),loadAll('MEMBER_DEPOSIT_LIST'),loadAll('MEMBER_WITHDRAW_LIST'),loadManualBankMovements()]);
      render(methods,deposits,withdrawals,manualMovements);
    }catch(e){
      if(body)body.innerHTML='<tr><td colspan="11" class="text-danger">'+esc(e.message)+'</td></tr>';
    }
  }
  async function delMethod(id){
    if(!(await BO_DIALOG.confirm('Delete this payment method?',{title:'Delete Payment Method',confirmText:'Delete'})))return;
    try{
      await api(endpoint('PAYMENT_METHOD_DELETE')+'/'+encodeURIComponent(id),{method:'POST',headers:{...BO_AUTH.authHeader()}});
      await load();
    }catch(err){
      alert(err.message||'Delete failed');
    }
  }
  document.addEventListener('click',e=>{
    const showBtn=e.target.closest('[data-usage-show]');
    if(showBtn){
      try{toggleShow(JSON.parse(showBtn.getAttribute('data-usage-show')),showBtn);}catch(_){}
      return;
    }
    const delBtn=e.target.closest('[data-usage-del]');
    if(delBtn) delMethod(delBtn.getAttribute('data-usage-del'));
  });
  document.addEventListener('DOMContentLoaded',()=>{
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile&&BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar&&BO_AUTH.renderSidebar();
    setToday();
    $('usageRefresh')?.addEventListener('click',load);
    $('usageFrom')?.addEventListener('change',load);
    $('usageTo')?.addEventListener('change',load);
    $('usageKeyword')?.addEventListener('keydown',e=>{if(e.key==='Enter')load();});
    $('usageKeyword')?.addEventListener('input',()=>{clearTimeout(window.__usageKwTimer);window.__usageKwTimer=setTimeout(load,280);});
    setTimeout(load,0);
  });
})();
