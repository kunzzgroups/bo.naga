(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(String(v==null?0:v).replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const money=v=>num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const endpoint=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];
  const VIS_KEY='bo_pm_visible_overrides';
  const methodsById=new Map();
  let statusFilter='active';
  let listPage=1;
  const PAGE_SIZE=10;
  let lastPayload={methods:[],deposits:[],withdrawals:[],manualMovements:[]};
  function uploadUrl(name){
    if(!name)return '';
    if(/^https?:\/\//i.test(name))return name;
    const base=(API_CONFIG.STATIC_UPLOAD_BASE_URL||'https://static.titanx7.com').replace(/\/$/,'');
    const path=String(name).trim();
    if(path.startsWith('/uploads/'))return base+path;
    if(path.startsWith('uploads/'))return base+'/'+path;
    return base+'/uploads/payment/'+path;
  }
  function pageButtons(current,total){
    total=Math.max(1,Number(total)||1); current=Math.max(1,Math.min(Number(current)||1,total));
    const pages=[]; const add=n=>{if(n>=1&&n<=total&&!pages.includes(n))pages.push(n);};
    add(1); for(let n=current-2;n<=current+2;n++) add(n); add(total); pages.sort((a,b)=>a-b);
    let html='<div class="smart-pagination" role="navigation" aria-label="Table pagination">';
    html+='<button type="button" class="smart-page first" data-usage-page="1" '+(current<=1?'disabled':'')+' title="First page"><i class="bi bi-chevron-bar-left" aria-hidden="true"></i></button>';
    let prev=0; pages.forEach(n=>{if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis">…</span>'; html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-usage-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>'; prev=n;});
    html+='<button type="button" class="smart-page last" data-usage-page="'+total+'" '+(current>=total?'disabled':'')+' title="Last page"><i class="bi bi-chevron-bar-right" aria-hidden="true"></i></button>';
    html+='</div><span class="smart-page-summary">Page '+current+' / '+total+'</span>';
    return html;
  }
  function qrViewBtn(m){
    const url=uploadUrl(m.qrImage||m.qrUrl||m.qr||'');
    if(url){
      return `<a class="bo-tx-action-btn is-view" href="${esc(url)}" target="_blank" rel="noopener" title="View QR" aria-label="View QR"><i class="bi bi-eye" aria-hidden="true"></i></a>`;
    }
    return `<button type="button" class="bo-tx-action-btn is-view is-disabled" disabled title="No QR image" aria-label="No QR image"><i class="bi bi-eye" aria-hidden="true"></i></button>`;
  }
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
  function loadVisOverrides(){try{return JSON.parse(sessionStorage.getItem(VIS_KEY)||'{}')||{};}catch(_){return {};}}
  function setVisOverride(id,val){const o=loadVisOverrides();o[String(id)]=Number(val)?1:0;sessionStorage.setItem(VIS_KEY,JSON.stringify(o));}
  function parseShown(raw){
    if(raw==null||raw==='')return null;
    if(typeof raw==='boolean')return raw;
    const s=String(raw).trim().toLowerCase();
    if(s==='true'||s==='yes'||s==='on')return true;
    if(s==='false'||s==='no'||s==='off')return false;
    return Number(raw)===1;
  }
  function isActive(m){return Number(m.status)===1;}
  function isShown(m){
    const raw=m.visible??m.showOnDeposit??m.isShow??m.clientVisible??m.display??m.showStatus;
    const parsed=parseShown(raw);
    if(parsed!=null)return parsed;
    const o=loadVisOverrides();
    if(Object.prototype.hasOwnProperty.call(o,String(m.id)))return Number(o[String(m.id)])===1;
    return true;
  }
  function showVal(m){return isShown(m)?1:0;}
  function paintShow(btn,on){
    if(!btn)return;
    btn.classList.toggle('is-on',!!on);
    btn.classList.toggle('is-off',!on);
    btn.setAttribute('aria-checked',on?'true':'false');
    btn.title=on?'Click to hide this bank':'Click to show this bank';
    btn.setAttribute('aria-label',on?'Bank visible, click to hide':'Bank hidden, click to show');
  }
  function paintStatus(btn,on){
    if(!btn)return;
    btn.classList.toggle('active',!!on);
    btn.classList.toggle('off',!on);
    btn.title=on?'Click to Suspend':'Click to Activate';
    btn.setAttribute('aria-label',on?'Active, click to Suspend':'Suspend, click to Activate');
    btn.textContent=on?'Active':'Suspend';
  }
  function methodPayload(m,patch){
    const vis=patch&&Object.prototype.hasOwnProperty.call(patch,'visible')?Number(patch.visible)?1:0:showVal(m);
    return {
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
      status:isActive(m)?1:0,
      visible:vis,
      showOnDeposit:vis,
      isShow:vis,
      ...(patch||{})
    };
  }
  async function saveMethod(m,patch,btn,failMsg,onFail){
    const fd=new FormData();
    const fields=methodPayload(m,patch);
    Object.keys(fields).forEach(k=>{
      const v=fields[k];
      if(v==null||v===''){ if(k!=='id')fd.append(k,''); return; }
      fd.append(k,String(v));
    });
    if(btn){btn.disabled=true;btn.classList.add('is-busy');}
    try{
      await api(endpoint('PAYMENT_METHOD_SAVE'),{method:'POST',headers:{...BO_AUTH.authHeader()},body:fd});
      if(btn){btn.disabled=false;btn.classList.remove('is-busy');}
    }catch(err){
      if(typeof onFail==='function')onFail();
      alert(err.message||failMsg||'Update failed');
      if(btn){btn.disabled=false;btn.classList.remove('is-busy');}
    }
  }
  function showBtn(m){
    const on=isShown(m);
    return `<button type="button" class="usage-show-switch ${on?'is-on':'is-off'}" data-usage-show-id="${esc(m.id)}" role="switch" aria-checked="${on?'true':'false'}" title="${on?'Click to hide this bank':'Click to show this bank'}" aria-label="${on?'Bank visible, click to hide':'Bank hidden, click to show'}"><span class="usage-show-switch-track" aria-hidden="true"><span class="usage-show-switch-thumb"></span></span></button>`;
  }
  function statusBtn(m){
    const on=isActive(m);
    return `<button type="button" class="status-pill ${on?'active':'off'}" data-usage-status-id="${esc(m.id)}" title="${on?'Click to Suspend':'Click to Activate'}" aria-label="${on?'Active, click to Suspend':'Suspend, click to Activate'}">${on?'Active':'Suspend'}</button>`;
  }
  function syncStatusTabs(){
    const track=document.querySelector('.bank-usage-toolbar .bo-tx-tabs');
    if(track&&window.BO_SEG_BOUNCE){
      try{window.BO_SEG_BOUNCE.sync(track);}catch(_){}
    }
  }
  function setStatusFilter(next){
    const v=String(next||'all').toLowerCase();
    statusFilter=v==='active'||v==='suspend'||v==='all'?v:'all';
    listPage=1;
    document.querySelectorAll('[data-usage-status-filter]').forEach(btn=>{
      const on=btn.getAttribute('data-usage-status-filter')===statusFilter;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
    });
    syncStatusTabs();
    render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);
  }
  function render(methods,deposits,withdrawals,manualMovements){
    lastPayload={methods:methods||[],deposits:deposits||[],withdrawals:withdrawals||[],manualMovements:manualMovements||[]};
    methodsById.clear();
    lastPayload.methods.forEach(m=>methodsById.set(String(m.id),m));
    const stats=new Map(lastPayload.methods.map(m=>[String(m.id),{deposit:0,depositCount:0,withdraw:0,withdrawCount:0}]));let unmatchedDeposit=0,unmatchedWithdraw=0,unmatchedCount=0;
    lastPayload.deposits.forEach(r=>{const m=matchDeposit(r,lastPayload.methods);if(!m){unmatchedDeposit+=num(r.amount);unmatchedCount++;return;}const st=stats.get(String(m.id));st.deposit+=num(r.amount);st.depositCount++;});
    lastPayload.withdrawals.forEach(r=>{const m=matchWithdraw(r,lastPayload.methods);if(!m){unmatchedWithdraw+=num(r.amount);unmatchedCount++;return;}const st=stats.get(String(m.id));st.withdraw+=num(r.amount);st.withdrawCount++;});
    lastPayload.manualMovements.forEach(r=>{const m=lastPayload.methods.find(x=>String(x.id)===String(r.paymentMethodId));if(!m)return;const st=stats.get(String(m.id));const t=String(r.ledgerType||'').toUpperCase();if(t==='ADMIN_DEPOSIT'){st.deposit+=Math.abs(num(r.amount));st.depositCount++;}else if(t==='ADMIN_WITHDRAW'){st.withdraw+=Math.abs(num(r.amount));st.withdrawCount++;}});
    const kw=norm($('usageKeyword')?.value||'');
    const activeCount=lastPayload.methods.filter(isActive).length;
    const suspendCount=lastPayload.methods.length-activeCount;
    $('usageCountActive')&&($('usageCountActive').textContent=String(activeCount));
    $('usageCountSuspend')&&($('usageCountSuspend').textContent=String(suspendCount));
    $('usageCountAll')&&($('usageCountAll').textContent=String(lastPayload.methods.length));
    const filtered=lastPayload.methods.filter(m=>{
      if(statusFilter==='active'&&!isActive(m))return false;
      if(statusFilter==='suspend'&&isActive(m))return false;
      if(kw&&!paymentKeys(m).some(k=>k.includes(kw)))return false;
      return true;
    });
    const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)||1);
    listPage=Math.max(1,Math.min(listPage,totalPages));
    const pageRows=filtered.slice((listPage-1)*PAGE_SIZE,listPage*PAGE_SIZE);
    const manualDeposits=lastPayload.manualMovements.filter(r=>String(r.ledgerType||'').toUpperCase()==='ADMIN_DEPOSIT'),manualWithdrawals=lastPayload.manualMovements.filter(r=>String(r.ledgerType||'').toUpperCase()==='ADMIN_WITHDRAW');
    $('usageBankCount')&&($('usageBankCount').textContent=lastPayload.methods.length.toLocaleString());
    $('usageApprovedCount')&&($('usageApprovedCount').textContent=(lastPayload.deposits.length+manualDeposits.length).toLocaleString());
    $('usageApprovedAmount')&&($('usageApprovedAmount').textContent=money(lastPayload.deposits.reduce((a,r)=>a+num(r.amount),0)+manualDeposits.reduce((a,r)=>a+Math.abs(num(r.amount)),0)));
    $('usageWithdrawAmount')&&($('usageWithdrawAmount').textContent=money(lastPayload.withdrawals.reduce((a,r)=>a+num(r.amount),0)+manualWithdrawals.reduce((a,r)=>a+Math.abs(num(r.amount)),0)));
    $('usageUnmatchedAmount')&&($('usageUnmatchedAmount').textContent=money(unmatchedDeposit+unmatchedWithdraw));
    const body=$('usageBody');
    body.innerHTML=pageRows.length?pageRows.map(m=>{
      const st=stats.get(String(m.id))||{deposit:0,depositCount:0,withdraw:0,withdrawCount:0};
      const net=st.deposit-st.withdraw,min=num(m.minAmount),max=num(m.maxAmount),daily=num(m.dailyLimit),pct=max>0?(Math.max(0,net)/max*100):0,fillClass=pct>=100?'over':pct>=80?'warn':'',cap=max>0?money(max):'No max',dailyText=daily>0?money(daily):'-';
      const accountHtml=m.accountName||m.accountNumber?`${m.accountName?`<span class="usage-account-line">${esc(m.accountName)}</span>`:''}${m.accountNumber?`<span class="usage-account-line">${esc(m.accountNumber)}</span>`:''}`:'<span class="usage-account-line">-</span>';
      return `<tr>
        <td><span class="usage-bank-name">${esc(m.bankName||m.displayName||'-')}</span></td>
        <td class="usage-account">${accountHtml}</td>
        <td><b>${money(min)}</b> - <b>${max>0?money(max):'No max'}</b></td>
        <td><b>+${money(st.deposit)}</b><br><small>${st.depositCount.toLocaleString()} deposit(s)</small></td>
        <td><b>-${money(st.withdraw)}</b><br><small>${st.withdrawCount.toLocaleString()} withdrawal(s)</small></td>
        <td><div class="usage-meter"><div class="usage-meter-line"><span>${money(net)}</span><span>/ ${cap}</span></div>${max>0?`<div class="usage-track"><div class="usage-fill ${fillClass}" style="width:${Math.min(100,pct).toFixed(2)}%"></div></div>`:''}</div></td>
        <td>${dailyText}</td>
        <td>${max>0?`<b>${pct.toFixed(1)}%</b>`:'<span class="usage-muted">No max configured</span>'}</td>
        <td>${statusBtn(m)}</td>
        <td class="usage-show-cell">${showBtn(m)}</td>
        <td><div class="bo-tx-actions">${qrViewBtn(m)}<a class="bo-tx-action-btn is-edit" href="payment-method-create.html?id=${encodeURIComponent(m.id)}&from=usage" title="Edit" aria-label="Edit"><i class="bi bi-pencil" aria-hidden="true"></i></a><button type="button" class="bo-tx-action-btn is-reject" title="Delete" aria-label="Delete" data-usage-del="${esc(m.id)}"><i class="bi bi-trash" aria-hidden="true"></i></button></div></td>
      </tr>`;
    }).join(''):'<tr><td colspan="11">No payment method found.</td></tr>';
    const from=filtered.length?((listPage-1)*PAGE_SIZE+1):0;
    const to=Math.min(listPage*PAGE_SIZE,filtered.length);
    $('usageInfo').textContent=filtered.length
      ?`Showing ${from}–${to} of ${filtered.length} bank record(s) · ${unmatchedCount} unmatched approved transaction(s)`
      :`0 bank record(s) · ${unmatchedCount} unmatched approved transaction(s)`;
    const pagerHost=$('usagePagerHost');
    if(pagerHost) pagerHost.innerHTML=pageButtons(listPage,totalPages);
    syncStatusTabs();
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
    const pageBtn=e.target.closest('[data-usage-page]');
    if(pageBtn){
      if(pageBtn.disabled)return;
      const next=Number(pageBtn.getAttribute('data-usage-page'));
      if(!Number.isFinite(next)||next<1)return;
      listPage=next;
      render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);
      return;
    }
    const statusTab=e.target.closest('[data-usage-status-filter]');
    if(statusTab){
      e.preventDefault();
      setStatusFilter(statusTab.getAttribute('data-usage-status-filter'));
      return;
    }
    const statusEl=e.target.closest('[data-usage-status-id]');
    if(statusEl){
      if(statusEl.disabled||statusEl.classList.contains('is-busy'))return;
      const id=String(statusEl.getAttribute('data-usage-status-id'));
      const m=methodsById.get(id);
      if(!m)return;
      const prev=isActive(m)?1:0;
      const next=prev?0:1;
      m.status=next;
      methodsById.set(id,m);
      render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);
      const painted=document.querySelector(`[data-usage-status-id="${CSS.escape(id)}"]`);
      saveMethod(m,{status:next},painted,'Failed to update status',()=>{
        m.status=prev;
        methodsById.set(id,m);
        render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);
      });
      return;
    }
    const showEl=e.target.closest('[data-usage-show-id]');
    if(showEl){
      if(showEl.disabled||showEl.classList.contains('is-busy'))return;
      const id=String(showEl.getAttribute('data-usage-show-id'));
      const m=methodsById.get(id);
      if(!m)return;
      const prev=isShown(m)?1:0;
      const next=prev?0:1;
      paintShow(showEl,next===1);
      setVisOverride(id,next);
      m.visible=next;
      m.showOnDeposit=next;
      m.isShow=next;
      methodsById.set(id,m);
      saveMethod(m,{visible:next,showOnDeposit:next,isShow:next},showEl,'Failed to update bank visibility',()=>{
        setVisOverride(id,prev);
        m.visible=prev;
        m.showOnDeposit=prev;
        m.isShow=prev;
        methodsById.set(id,m);
        paintShow(showEl,prev===1);
      });
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
    const statusTrack=document.querySelector('.bank-usage-toolbar .bo-tx-tabs');
    if(statusTrack&&window.BO_SEG_BOUNCE){
      window.BO_SEG_BOUNCE.mount(statusTrack,{button:':scope > .bo-tx-tab',anim:'bounce'});
    }
    $('usageRefresh')?.addEventListener('click',load);
    $('usageFrom')?.addEventListener('change',load);
    $('usageTo')?.addEventListener('change',load);
    $('usageKeyword')?.addEventListener('keydown',e=>{if(e.key==='Enter'){listPage=1;render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);}});
    $('usageKeyword')?.addEventListener('input',()=>{clearTimeout(window.__usageKwTimer);window.__usageKwTimer=setTimeout(()=>{listPage=1;render(lastPayload.methods,lastPayload.deposits,lastPayload.withdrawals,lastPayload.manualMovements);},280);});
    setTimeout(load,0);
  });
})();
