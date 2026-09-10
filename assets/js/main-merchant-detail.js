(function(){'use strict';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
 const body=$('madTableBody'),search=$('madSearchInput'),roleFilter=$('madRoleFilter'),currencyFilter=$('madCurrencyFilter'),modal=$('madEditModal'),form=$('madEditForm');
 const selectAllInput=$('madSelectAll'),selectAllWrap=$('madSelectAllWrap'),bulkDeleteBtn=$('madBulkDeleteBtn'),resetBtn=$('madResetBtn');
 let rows=[],filtered=[],page=1,status='active',editing=null,detail=null;
 const selectedMerchantIds=new Set();
 const PAGE=10;
 function pageButtons(current, total){
  total=Math.max(1, Number(total)||1);
  current=Math.max(1, Math.min(Number(current)||1, total));
  const pages=[];
  const add=n=>{ if(n>=1 && n<=total && !pages.includes(n)) pages.push(n); };
  add(1);
  for(let n=current-2;n<=current+2;n++) add(n);
  add(total);
  pages.sort((a,b)=>a-b);
  let html='';
  html+='<button type="button" class="smart-page nav-text" data-page="'+Math.max(1,current-1)+'" '+(current<=1?'disabled':'')+'>Previous</button>';
  let prev=0;
  pages.forEach(n=>{
   if(prev && n-prev>1) html+='<span class="smart-page-ellipsis">…</span>';
   html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>';
   prev=n;
  });
  html+='<button type="button" class="smart-page nav-text" data-page="'+Math.min(total,current+1)+'" '+(current>=total?'disabled':'')+'>Next</button>';
  return html;
 }
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()}),active=b=>Number(b.status)===1,dt=v=>v?new Date(v).toLocaleString():'-';
 function parseDate(value){
  if(!value) return null;
  try{const d=new Date(value);return isNaN(d.getTime())?null:d;}catch(e){return null;}
 }
 function timeOnly(value){
  const d=parseDate(value); if(!d) return '-';
  const pad=n=>String(n).padStart(2,'0');
  return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
 }
 function dateMmDdYyyy(value){
  const d=parseDate(value); if(!d) return '';
  const pad=n=>String(n).padStart(2,'0');
  return pad(d.getMonth()+1)+'/'+pad(d.getDate())+'/'+d.getFullYear();
 }
 function timeWithDateTip(value){
  if(!value) return '<span class="mad-muted">-</span>';
  const t=timeOnly(value);
  if(t==='-') return '<span class="mad-muted">-</span>';
  const date=dateMmDdYyyy(value);
  if(!date) return '<span class="mad-time">'+esc(t)+'</span>';
  return '<span class="mad-time mad-time-tip" data-date="'+esc(date)+'" tabindex="0">'+esc(t)+'</span>';
 }
 function statusSelect(b){
  const on=active(b);
  const next=on?0:1;
  return `<button type="button" class="mad-status-chip ${on?'is-active':'is-suspended'}" data-merchant-status-toggle="${esc(b.id)}" data-next-status="${next}" title="${on?'Click to Suspend':'Click to Activate'}" aria-label="${on?'Active, click to Suspend':'Suspended, click to Activate'}">
    <i class="mad-status-dot" aria-hidden="true"></i>
    <span class="mad-status-chip-label">${on?'Active':'Suspended'}</span>
  </button>`;
 }
 function roleName(b){
  const nested=b.masterAccount||b.master||null;
  return b.masterRoleName || b.roleName || nested?.roleName || nested?.role || b.masterRole || b.role || b.masterRoleType || b.roleType || nested?.roleType || 'Brand Owner';
 }
 function roleTone(name){
  const n=String(name||'').toLowerCase();
  if(n.includes('regional')) return 'is-regional';
  if(n.includes('super')||n.includes('root')||n.includes('master')||n.includes('owner')) return 'is-super';
  if(n.includes('partner')) return 'is-partner';
  if(n.includes('risk')) return 'is-risk';
  if(n.includes('tech')) return 'is-tech';
  if(n.includes('merchant')||n.includes('brand')||n.includes('sub')) return 'is-merchant';
  return '';
 }
 async function updateMerchantStatus(id, nextStatus, chipEl){
  const row=rows.find(x=>Number(x.id)===Number(id));
  if(!row) return;
  const prev=String(row.status??1);
  if(String(nextStatus)===prev) return;
  if(chipEl){ chipEl.disabled=true; chipEl.classList.add('is-saving'); }
  try{
   await api('/admin/merchants/save',{
    method:'POST',
    headers:hdr(),
    body:JSON.stringify({
     id:Number(id),
     code:row.code||'',
     name:row.name||'',
     primaryDomain:row.primaryDomain||'',
     currency:row.currency||'MYR',
     frontendRoot:row.frontendRoot||'',
     creditMode:row.creditMode||'WHOLE',
     status:Number(nextStatus),
     domainAliases:row.domainAliases||'',
     lowCreditThreshold:row.lowCreditThreshold||0,
     providerMarkupPercent:Number(row.providerMarkupPercent||0)
    })
   });
   row.status=Number(nextStatus);
   if(Number(nextStatus)===1) selectedMerchantIds.delete(String(id));
   apply();
  }catch(e){
   if(window.BO_DIALOG?.alert) BO_DIALOG.alert(e.message,{title:'Unable to Update Status',type:'error'});
   else alert(e.message);
  }finally{
   if(chipEl){ chipEl.disabled=false; chipEl.classList.remove('is-saving'); }
  }
 }
 function selectableIdsOnPage(){
  return [...(body?.querySelectorAll('[data-merchant-select]')||[])].map(el=>String(el.getAttribute('data-merchant-select')));
 }
 function syncSelectionUi(){
  const showSelect=status==='suspended'||status==='all';
  const isActiveView=status==='active';
  document.body.classList.toggle('mad-view-active', isActiveView);
  document.body.classList.toggle('mad-view-suspended', status==='suspended');
  document.body.classList.toggle('mad-view-all', status==='all');
  if(resetBtn) resetBtn.hidden=isActiveView;
  if(selectAllWrap) selectAllWrap.hidden=!showSelect;
  if(bulkDeleteBtn){
   bulkDeleteBtn.hidden=!showSelect;
   bulkDeleteBtn.disabled=!showSelect||selectedMerchantIds.size===0;
  }
  if(!showSelect){
   if(selectAllInput){
    selectAllInput.checked=false;
    selectAllInput.indeterminate=false;
   }
   return;
  }
  const ids=selectableIdsOnPage();
  const selectedOnPage=ids.filter(id=>selectedMerchantIds.has(id));
  if(selectAllInput){
   selectAllInput.checked=ids.length>0&&selectedOnPage.length===ids.length;
   selectAllInput.indeterminate=selectedOnPage.length>0&&selectedOnPage.length<ids.length;
  }
 }
 function clearMerchantSelection(){
  selectedMerchantIds.clear();
  syncSelectionUi();
 }
 function apply(){
  const q=(search?.value||'').trim().toLowerCase();
  const role=(roleFilter?.value||'').trim();
  const cur=(currencyFilter?.value||'').trim();
  filtered=rows.filter(b=>{
   if(!(status==='all'||(status==='active'&&active(b))||(status==='suspended'&&!active(b)))) return false;
   if(cur && String(b.currency||'MYR')!==cur) return false;
   if(role && roleName(b)!==role) return false;
   if(q && ![b.code,b.name,b.primaryDomain,b.createdByName,b.masterUsername,roleName(b)].join(' ').toLowerCase().includes(q)) return false;
   return true;
  });
  page=1;
  render();
 }
 function syncFilterOptions(){
  const roles=[...new Set(rows.map(roleName).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const currencies=[...new Set(rows.map(x=>x.currency||'MYR'))].sort();
  const keepRole=roleFilter?.value||'';
  const keepCur=currencyFilter?.value||'';
  if(roleFilter){
   roleFilter.innerHTML='<option value="">All Roles</option>'+roles.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
   if(keepRole && roles.includes(keepRole)) roleFilter.value=keepRole;
  }
  if(currencyFilter){
   currencyFilter.innerHTML='<option value="">All Currencies</option>'+currencies.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
   if(keepCur && currencies.includes(keepCur)) currencyFilter.value=keepCur;
  }
 }
 function render(){
  const all=rows.length,act=rows.filter(active).length;
  $('madCountAll').textContent=all;
  $('madCountActive').textContent=act;
  $('madCountSuspended').textContent=all-act;
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE)),st=(page-1)*PAGE,s=filtered.slice(st,st+PAGE);
  const showSelectCol=status==='suspended'||status==='all';
  body.innerHTML=s.length?s.map(b=>{
   const canDelete=!active(b);
   const idStr=String(b.id);
   const checked=canDelete&&selectedMerchantIds.has(idStr)?' checked':'';
   const selectHtml=!showSelectCol
     ?''
     :(canDelete
       ?`<label class="mad-row-check"><input type="checkbox" class="mad-row-check-input" data-merchant-select="${esc(b.id)}"${checked} aria-label="Select ${esc(b.code||b.name||'merchant')}"><span class="mad-row-check-box" aria-hidden="true"></span></label>`
       :'<span class="mad-row-check mad-row-check-spacer" aria-hidden="true"></span>');
   const deleteBtn=canDelete
     ?`<button class="mad-merchant-icon-btn is-danger" data-delete="${esc(b.id)}" type="button" data-tip="Delete" aria-label="Delete merchant"><i class="bi bi-trash3" aria-hidden="true"></i></button>`
     :'';
   const rn=roleName(b);
   const creditBtn=`<button class="mad-merchant-icon-btn mad-merchant-credit-btn" data-credit="${esc(b.id)}" type="button" data-tip="Add / reclaim credit" aria-label="Add or reclaim credit"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>`;
   const resetPassBtn=`<button class="mad-merchant-icon-btn mad-merchant-key-btn" data-reset-pass="${esc(b.id)}" type="button" data-tip="Reset password" aria-label="Reset password"><i class="bi bi-key" aria-hidden="true"></i></button>`;
   return `<tr class="mad-row${canDelete?' is-suspended-row':''}">`+
     `<td data-label="Merchant"><div class="mad-user">${selectHtml}<span class="mad-avatar">${esc((b.code||'M').slice(0,2).toUpperCase())}</span><div class="mad-user-copy"><b>${esc(b.code||'-')}</b><div class="mad-user-meta">#${esc(b.id)}</div></div></div></td>`+
     `<td data-label="Company"><b>${esc(b.name||'-')}</b><small class="d-block text-muted">${esc(b.primaryDomain||'-')}</small></td>`+
     `<td data-label="Role"><span class="mad-role ${roleTone(rn)}">${esc(rn)}</span></td>`+
     `<td data-label="Currency">${esc(b.currency||'MYR')}</td>`+
     `<td data-label="Credit Balance"><span class="mad-money">${money(b.creditBalance)}</span></td>`+
     `<td data-label="Last Active">${timeWithDateTip(b.lastActiveAt||b.masterLastLoginAt||b.updatedAt)}</td>`+
     `<td data-label="Status">${statusSelect(b)}</td>`+
     `<td data-label="Created By">${esc(b.createdByName||b.createdByUsername||'Legacy / Migration')}</td>`+
     `<td data-label="Last Login">${timeWithDateTip(b.masterLastLoginAt)}</td>`+
     `<td data-label="Last Logout">${timeWithDateTip(b.masterLastLogoutAt)}</td>`+
     `<td data-label="Actions"><div class="mad-merchant-actions">${creditBtn}${resetPassBtn}<button class="mad-merchant-icon-btn" data-view="${esc(b.id)}" type="button" data-tip="Edit" aria-label="View / Edit Merchant"><i class="bi bi-pencil" aria-hidden="true"></i></button>${deleteBtn}</div></td>`+
   `</tr>`;
  }).join(''):'<tr><td colspan="11" class="mad-empty">No merchants found.</td></tr>';
  $('madTableInfo').textContent=filtered.length?`Showing ${st+1} to ${st+s.length} of ${filtered.length} merchants`:'Showing 0 to 0 of 0 merchants';
  $('madPager').innerHTML=pageButtons(page, pages);
  syncSelectionUi();
 }
 async function deleteMerchantsByIds(ids){
  const list=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!list.length){
   if(window.BO_DIALOG?.alert) await BO_DIALOG.alert('No merchants selected.');
   return;
  }
  const targets=list.filter(id=>{
   const row=rows.find(x=>String(x.id)===String(id));
   return row&&!active(row);
  });
  if(!targets.length){
   if(window.BO_DIALOG?.alert) await BO_DIALOG.alert('Selected merchants cannot be deleted. Suspend them first.',{title:'Cannot Delete',type:'error'});
   return;
  }
  const label=targets.length===1
   ?('Delete merchant "'+(rows.find(x=>String(x.id)===targets[0])?.code||('#'+targets[0]))+'"? This cannot be undone.')
   :('Delete '+targets.length+' merchants? This cannot be undone.');
  const ok=window.BO_DIALOG?.confirm
   ?await BO_DIALOG.confirm(label,{title:'Delete Merchant',confirmText:'Delete',type:'danger'})
   :confirm(label);
  if(!ok) return;
  const errors=[];
  for(const id of targets){
   try{
    await api('/admin/merchants/'+encodeURIComponent(id)+'/delete',{method:'POST',headers:BO_AUTH.authHeader()});
    selectedMerchantIds.delete(String(id));
   }catch(e){
    errors.push((e&&e.message)||('Failed to delete #'+id));
   }
  }
  await load();
  if(errors.length){
   if(window.BO_DIALOG?.alert) await BO_DIALOG.alert(errors[0],{title:'Delete incomplete',type:'error'});
  }else if(window.BO_DIALOG?.alert){
   await BO_DIALOG.alert(targets.length===1?'Merchant deleted successfully':(targets.length+' merchants deleted successfully'));
  }
 }
 function setStatus(id,val,type){
  const el=$(id); if(!el) return;
  el.textContent=val||'';
  el.className='upload-status mb-3'+(type?' '+type:'');
 }
 function setWalletOptions(wallet, extraHtml){
  if(!wallet || wallet.tagName!=='SELECT') return;
  const html='<option value="">Player Credit</option><option value="__WHOLE_PROVIDER__">Whole Platform-Provider Credit</option>'+(extraHtml||'');
  wallet.innerHTML=html;
  wallet.value='';
  const wrap=wallet.closest('.rounded-select-wrap');
  if(wrap) wrap.dataset.boAutoWidth='0';
  wallet.dispatchEvent(new Event('bo:select-sync',{bubbles:true}));
  if(window.BOSelectSync && typeof BOSelectSync.one==='function') BOSelectSync.one(wallet);
 }
 let creditOpenSeq=0;
 let creditFocusTimer=0;
 let creditAction='ADD';
 let creditBalances={player:0,provider:0,byProvider:{}};
 function currentWalletBalance(){
  const wallet=$('madCreditWallet')?.value||'';
  if(!wallet) return Number(creditBalances.player)||0;
  if(wallet==='__WHOLE_PROVIDER__') return Number(creditBalances.provider)||0;
  const per=creditBalances.byProvider[String(wallet).toUpperCase()];
  if(per!=null) return Number(per)||0;
  return Number(creditBalances.provider)||0;
 }
 function syncCreditMode(){
  const deduct=creditAction==='DEDUCT';
  const modal=$('madCreditModal');
  if(modal) modal.classList.toggle('is-reclaim', deduct);
  document.querySelectorAll('[data-credit-action]').forEach(btn=>{
   const on=btn.getAttribute('data-credit-action')===creditAction;
   btn.classList.toggle('is-active', on);
   btn.setAttribute('aria-checked', on?'true':'false');
  });
  const title=$('madCreditTitle');
  if(title) title.textContent=deduct?'Reclaim Credit':'Add Credit';
  const lead=$('madCreditLead');
  if(lead) lead.textContent=deduct?'Take back merchant player or provider credit.':'Top up merchant player or provider credit.';
  const icon=modal?.querySelector('.mad-modal-icon i');
  if(icon) icon.className=deduct?'bi bi-dash-lg':'bi bi-plus-lg';
  const remark=$('madCreditRemark');
  if(remark) remark.placeholder=deduct?'Optional reclaim remark':'Optional top-up remark';
  const submit=$('madCreditSubmit');
  if(submit){
   submit.innerHTML=deduct
     ?'<i class="bi bi-dash-circle" aria-hidden="true"></i> Confirm Reclaim'
     :'<i class="bi bi-plus-circle" aria-hidden="true"></i> Confirm Top Up';
  }
 }
 function showCreditModal(modal){
  if(!modal) return;
  modal.hidden=false;
  modal.removeAttribute('hidden');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
 }
 function closeCredit(){
  creditOpenSeq++;
  if(creditFocusTimer){ clearTimeout(creditFocusTimer); creditFocusTimer=0; }
  const modal=$('madCreditModal');
  if(!modal) return;
  const active=document.activeElement;
  if(active && modal.contains(active) && typeof active.blur==='function'){
   try{ active.blur(); }catch(e){}
  }
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  modal.hidden=true;
  modal.setAttribute('hidden','');
  if(!document.querySelector('.modal-clean.show')) document.body.classList.remove('modal-open');
 }
 async function openCredit(id){
  const row=rows.find(x=>Number(x.id)===Number(id));
  if(!row){
   if(window.BO_DIALOG?.alert) BO_DIALOG.alert('Merchant not found');
   return;
  }
  const modal=$('madCreditModal');
  if(!modal) return;
  const seq=++creditOpenSeq;
  if(creditFocusTimer){ clearTimeout(creditFocusTimer); creditFocusTimer=0; }
  const idEl=$('madCreditId'), nameEl=$('madCreditName'), subEl=$('madCreditSub');
  const avatarEl=$('madCreditAvatar'), balEl=$('madCreditBalance');
  if(idEl) idEl.value=String(row.id);
  if(nameEl) nameEl.textContent=row.code||row.name||('#'+row.id);
  if(subEl) subEl.textContent=(row.name||row.code||'')+(row.currency?' · '+row.currency:'');
  if(avatarEl) avatarEl.textContent=String(row.code||'M').slice(0,2).toUpperCase();
  if(balEl) balEl.textContent=money(row.creditBalance);
  setText('madCreditBalanceInfo','Loading wallets...');
  if($('madCreditAmount')) $('madCreditAmount').value='';
  if($('madCreditRemark')) $('madCreditRemark').value='';
  setStatus('madCreditStatus','');
  creditAction='ADD';
  creditBalances={player:Number(row.creditBalance||0),provider:Number(row.providerCreditBalance||0),byProvider:{}};
  syncCreditMode();
  showCreditModal(modal);
  const wallet=$('madCreditWallet');
  setWalletOptions(wallet,'');
  try{
   const d=await api('/admin/merchants/'+encodeURIComponent(id),{headers:BO_AUTH.authHeader()});
   if(seq!==creditOpenSeq) return;
   const b=d?.brand||d||row;
   const ps=d?.providers||[];
   const byProvider={};
   ps.forEach(p=>{
    const code=String(p.providerCode||'').toUpperCase();
    if(code) byProvider[code]=Number(p.creditBalance||0);
   });
   creditBalances={player:Number(b.creditBalance||0),provider:Number(b.providerCreditBalance||0),byProvider};
   const extra=String(b.creditMode||'').toUpperCase()==='PER_PROVIDER'
     ?ps.filter(p=>Number(p.enabled??1)===1).map(p=>`<option value="${esc(p.providerCode)}">Provider: ${esc(p.providerCode)}</option>`).join('')
     :'';
   setWalletOptions(wallet, extra);
   setText('madCreditBalanceInfo','Player Credit: '+money(b.creditBalance||0)+' · Provider Credit: '+money(b.providerCreditBalance||0));
   if(balEl) balEl.textContent=money(b.creditBalance||0);
  }catch(e){
   if(seq!==creditOpenSeq) return;
   setText('madCreditBalanceInfo',e.message||'Unable to load wallet details.');
  }
  if(seq!==creditOpenSeq) return;
  creditFocusTimer=setTimeout(()=>$('madCreditAmount')?.focus(),40);
 }
 function generatePassword(len){
  const upper='ABCDEFGHJKLMNPQRSTUVWXYZ', lower='abcdefghijkmnopqrstuvwxyz', digits='23456789', symbols='!@#$%^&*';
  const all=upper+lower+digits+symbols;
  const picks=[
   upper[Math.floor(Math.random()*upper.length)],
   lower[Math.floor(Math.random()*lower.length)],
   digits[Math.floor(Math.random()*digits.length)],
   symbols[Math.floor(Math.random()*symbols.length)]
  ];
  while(picks.length<len) picks.push(all[Math.floor(Math.random()*all.length)]);
  for(let i=picks.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   const t=picks[i]; picks[i]=picks[j]; picks[j]=t;
  }
  return picks.join('');
 }
 let resetPassMerchantId=null;
 let resetPassMaster=null;
 let resetPassLastFocus=null;
 async function openResetPassword(id){
  const row=rows.find(x=>Number(x.id)===Number(id));
  if(!row){
   if(window.BO_DIALOG?.alert) BO_DIALOG.alert('Merchant not found');
   return;
  }
  const modal=$('madResetPasswordModal');
  if(!modal) return;
  resetPassLastFocus=document.activeElement;
  resetPassMerchantId=String(id);
  resetPassMaster=null;
  const a=$('madResetNewPassword'), b=$('madResetConfirmPassword');
  if(a){ a.value=''; a.type='password'; }
  if(b){ b.value=''; b.type='password'; }
  modal.querySelectorAll('[data-toggle-password]').forEach(eye=>{
   eye.setAttribute('aria-pressed','false');
   eye.setAttribute('aria-label','Show password');
   const icon=eye.querySelector('i');
   if(icon) icon.className='bi bi-eye';
  });
  setStatus('madResetPassStatus','');
  const sub=$('madResetPassSub');
  if(sub) sub.textContent='Loading merchant master account...';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  try{
   const d=await api('/admin/merchants/'+encodeURIComponent(id),{headers:BO_AUTH.authHeader()});
   const m=d?.masterAccount||await api('/admin/merchants/'+encodeURIComponent(id)+'/master-account',{headers:BO_AUTH.authHeader()}).catch(()=>null);
   const username=m?.username||d?.brand?.masterUsername||row.masterUsername||'';
   if(!username){
    setStatus('madResetPassStatus','This merchant has no master account yet.','error');
    if(sub) sub.textContent='Set a new password for the merchant master login.';
    return;
   }
   resetPassMaster={
    username,
    displayName:m?.displayName||m?.name||row.name||username,
    status:m?.status==null?1:Number(m.status),
    roleId:m?.roleId!=null?Number(m.roleId):null,
    roleType:m?.roleType||m?.role||null
   };
   if(sub) sub.textContent='Set a new password for '+username+(row.code?' · '+row.code:'')+'.';
   setTimeout(()=>a?.focus(),30);
  }catch(e){
   setStatus('madResetPassStatus',e.message||'Unable to load master account.','error');
   if(sub) sub.textContent='Set a new password for the merchant master login.';
  }
 }
 function closeResetPassword(){
  const modal=$('madResetPasswordModal');
  if(modal){
   modal.classList.remove('show');
   modal.setAttribute('aria-hidden','true');
  }
  resetPassMerchantId=null;
  resetPassMaster=null;
  if(!document.querySelector('.modal-clean.show')) document.body.classList.remove('modal-open');
  const restore=resetPassLastFocus;
  resetPassLastFocus=null;
  if(restore&&typeof restore.focus==='function'){
   setTimeout(()=>{ try{ restore.focus(); }catch(e){} },0);
  }
 }
 async function applyResetPassword(){
  if(!resetPassMerchantId){ setStatus('madResetPassStatus','Missing merchant.','error'); return; }
  if(!resetPassMaster?.username){ setStatus('madResetPassStatus','This merchant has no master account yet.','error'); return; }
  const pass=($('madResetNewPassword')?.value||'');
  const confirm=($('madResetConfirmPassword')?.value||'');
  if(!pass){ setStatus('madResetPassStatus','Please enter a new password.','error'); return; }
  if(pass.length<8){ setStatus('madResetPassStatus','Password must be at least 8 characters.','error'); return; }
  if(pass!==confirm){ setStatus('madResetPassStatus','Confirm password does not match.','error'); return; }
  const applyBtn=$('madResetPassApply');
  try{
   if(applyBtn) applyBtn.disabled=true;
   setStatus('madResetPassStatus','Updating password...');
   const payload={
    displayName:resetPassMaster.displayName||resetPassMaster.username,
    username:resetPassMaster.username,
    password:pass,
    status:resetPassMaster.status==null?1:Number(resetPassMaster.status)
   };
   if(resetPassMaster.roleId!=null) payload.roleId=Number(resetPassMaster.roleId);
   if(resetPassMaster.roleType) payload.roleType=resetPassMaster.roleType;
   await api('/admin/merchants/'+encodeURIComponent(resetPassMerchantId)+'/master-account',{
    method:'POST',
    headers:hdr(),
    body:JSON.stringify(payload)
   });
   closeResetPassword();
   if(window.BO_DIALOG?.alert) await BO_DIALOG.alert('Password updated successfully');
  }catch(err){
   setStatus('madResetPassStatus',err.message||'Update password failed.','error');
  }finally{
   if(applyBtn) applyBtn.disabled=false;
  }
 }
 function setText(id,val){const el=$(id);if(el) el.textContent=val;}
 async function submitCredit(e){
  e.preventDefault();
  const id=$('madCreditId')?.value;
  const amount=Number($('madCreditAmount')?.value||0);
  const providerCode=$('madCreditWallet')?.value||null;
  const remark=($('madCreditRemark')?.value||'').trim();
  const action=creditAction==='DEDUCT'?'DEDUCT':'ADD';
  if(!id){ setStatus('madCreditStatus','Merchant missing.','error'); return; }
  if(!(amount>0)){ setStatus('madCreditStatus','Amount must be greater than 0.','error'); return; }
  if(action==='DEDUCT'){
   const avail=currentWalletBalance();
   if(amount>avail){
    setStatus('madCreditStatus','Reclaim amount cannot exceed the selected wallet balance ('+money(avail)+').','error');
    return;
   }
  }
  const btn=$('madCreditSubmit');
  try{
   if(btn) btn.disabled=true;
   setStatus('madCreditStatus',action==='DEDUCT'?'Processing reclaim...':'Processing top up...');
   if(action==='DEDUCT'){
    await api('/admin/brands/'+encodeURIComponent(id)+'/credit/adjust',{
     method:'POST',
     headers:hdr(),
     body:JSON.stringify({amount,action:'DEDUCT',providerCode,remark:remark||'Merchant credit reclaim'})
    });
    setStatus('madCreditStatus','Credit reclaimed successfully.','success');
   }else{
    await api('/admin/merchants/'+encodeURIComponent(id)+'/topup',{
     method:'POST',
     headers:hdr(),
     body:JSON.stringify({amount,providerCode,remark:remark||'Merchant credit top up'})
    });
    setStatus('madCreditStatus','Top up completed successfully.','success');
   }
   await load();
   setTimeout(closeCredit,450);
  }catch(err){
   setStatus('madCreditStatus',err.message||(action==='DEDUCT'?'Reclaim failed.':'Top up failed.'),'error');
  }finally{
   if(btn) btn.disabled=false;
  }
 }
 async function load(){try{rows=await api('/admin/merchants',{headers:BO_AUTH.authHeader()})||[];syncFilterOptions();apply();$('madSyncLabel').innerHTML='<i class="bi bi-arrow-repeat"></i> Synced just now'}catch(e){body.innerHTML=`<tr><td colspan="11" class="mad-empty text-danger">${esc(e.message)}</td></tr>`;syncSelectionUi();}}
 function providerRows(d){const out=$('madProviderPricingBody');if(!out)return;const assigned=new Map((d.providers||[]).map(x=>[String(x.providerCode||'').toUpperCase(),x]));const markupRaw=String($('madProviderMarkup')?.value ?? d.brand?.providerMarkupPercent ?? '').trim();const markup=Number(markupRaw||0);const platform=d.platformProviders||[];out.innerHTML=platform.length?platform.map(p=>{const code=String(p.code||'').toUpperCase(),bp=assigned.get(code),checked=!!bp&&String(bp.ownership||'PLATFORM').toUpperCase()==='PLATFORM',base=Number(p.settlementCostPercent||0),savedOv=Number(bp?.defaultChargePercent||0),ovShow=savedOv>0?String(savedOv):(markupRaw!==''&&markup!==0?markupRaw:''),eff=base+Number(ovShow||markup||0),basis=String(bp?.chargeBasis||p.settlementCostBasis||'HOUSE_WIN').toUpperCase();return '<tr data-provider-row="'+esc(code)+'" data-base="'+base+'">'+'<td><input type="checkbox" class="form-check-input" data-provider-use '+(checked?'checked':'')+'></td>'+'<td><b>'+esc(code)+'</b><small class="d-block text-muted">'+esc(p.name||'')+'</small></td>'+'<td>'+base.toFixed(4)+'%</td>'+'<td><input type="number" class="form-control form-control-sm" min="0" max="100" step="0.0001" data-provider-override value="'+esc(ovShow)+'" '+(checked?'':'disabled')+' placeholder="—"></td>'+'<td><b data-provider-effective>'+eff.toFixed(4)+'%</b></td>'+'<td>'+(basis==='TURNOVER'?'Turnover':'House Win / GGR')+'</td></tr>';}).join(''):'<tr><td colspan="6" class="text-center text-muted py-3">No platform providers configured.</td></tr>';bindProviderInputs()}
 function bindProviderInputs(){const markup=$('madProviderMarkup');const syncOverridesFromMarkup=()=>{const raw=String(markup?.value??'').trim();document.querySelectorAll('#madProviderPricingBody [data-provider-row]').forEach(r=>{const use=r.querySelector('[data-provider-use]'),inp=r.querySelector('[data-provider-override]');if(!inp)return;inp.disabled=!use?.checked;if(inp.dataset.manual!=='1'){inp.value=(raw===''||raw==='0')?'':raw;}});};const recalc=()=>{const m=Number(markup?.value||0);document.querySelectorAll('#madProviderPricingBody [data-provider-row]').forEach(r=>{const use=r.querySelector('[data-provider-use]'),inp=r.querySelector('[data-provider-override]'),base=Number(r.dataset.base||0);if(inp)inp.disabled=!use?.checked;const ovRaw=String(inp?.value||'').trim();const add=ovRaw!==''?Number(ovRaw):m;const eff=r.querySelector('[data-provider-effective]');if(eff)eff.textContent=(base+Number(add||0)).toFixed(4)+'%';});};if(markup&&!markup.dataset.bound){markup.dataset.bound='1';markup.addEventListener('input',()=>{document.querySelectorAll('#madProviderPricingBody [data-provider-override]').forEach(inp=>{inp.dataset.manual='0';});syncOverridesFromMarkup();recalc();});}document.querySelectorAll('#madProviderPricingBody [data-provider-use]').forEach(x=>x.addEventListener('change',()=>{syncOverridesFromMarkup();recalc();}));document.querySelectorAll('#madProviderPricingBody [data-provider-override]').forEach(x=>x.addEventListener('input',()=>{x.dataset.manual='1';recalc();}));syncOverridesFromMarkup();recalc()}
 async function open(id){try{const d=await api('/admin/merchants/'+id,{headers:BO_AUTH.authHeader()}),b=d.brand||d;detail=d;editing=b;const m=d.masterAccount||await api('/admin/merchants/'+id+'/master-account',{headers:BO_AUTH.authHeader()}).catch(()=>null);$('madEditId').value=b.id;$('madEditCode').value=b.code||'';$('madEditName').value=b.name||'';$('madEditDomain').value=b.primaryDomain||'';$('madEditCurrency').value=b.currency||'MYR';$('madEditFrontendRoot').value=b.frontendRoot||'';$('madEditCreditMode').value=b.creditMode||'WHOLE';$('madEditStatus').value=String(b.status??1);$('madViewPlayerCredit').value=money(b.creditBalance);$('madViewProviderCredit').value=money(b.providerCreditBalance);$('madViewMaster').value=m?.username||b.masterUsername||'-';$('madViewCreatedBy').value=b.createdByName||b.createdByUsername||m?.createdByName||'Legacy / Migration';$('madViewLastLogin').value=dt(m?.lastLoginAt||b.masterLastLoginAt);$('madViewLastLogout').value=dt(m?.lastLogoutAt||b.masterLastLogoutAt);$('madProviderMarkup').value=Number(b.providerMarkupPercent||0);providerRows(d);$('madEditFormStatus').textContent='';modal.classList.add('show');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}catch(e){if(window.BO_DIALOG?.alert)BO_DIALOG.alert(e.message,{title:'Unable to Load Merchant',type:'error'});else alert(e.message)}}
 function close(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
 async function saveProviderPricing(id){const selected=[...document.querySelectorAll('[data-provider-row]')].filter(r=>r.querySelector('[data-provider-use]')?.checked);const old=new Map((detail?.providers||[]).map(x=>[String(x.providerCode||'').toUpperCase(),x]));await api('/admin/merchants/'+id+'/provider-pricing',{method:'POST',headers:hdr(),body:JSON.stringify({providerMarkupPercent:Number($('madProviderMarkup').value||0),providers:selected.map(r=>{const code=r.dataset.providerRow,o=old.get(code)||{},p=(detail?.platformProviders||[]).find(x=>String(x.code||'').toUpperCase()===code)||{};return {providerCode:code,defaultChargePercent:Number(r.querySelector('[data-provider-override]')?.value||0),chargeBasis:String(o.chargeBasis||p.settlementCostBasis||'HOUSE_WIN')};})})});}

 document.querySelectorAll('[data-mad-status]').forEach(btn=>{
  btn.addEventListener('click',()=>{
   status=btn.getAttribute('data-mad-status')||'all';
   document.querySelectorAll('[data-mad-status]').forEach(b=>{
    const on=b===btn;
    b.classList.toggle('is-active',on);
    b.setAttribute('aria-pressed',on?'true':'false');
   });
   if(status!=='suspended'&&status!=='all') clearMerchantSelection();
   apply();
  });
 });
 search?.addEventListener('input',apply);
 roleFilter?.addEventListener('change',apply);
 currencyFilter?.addEventListener('change',apply);
 resetBtn?.addEventListener('click',()=>{
  if(search) search.value='';
  if(roleFilter) roleFilter.value='';
  if(currencyFilter) currencyFilter.value='';
  status='active';
  document.querySelectorAll('[data-mad-status]').forEach(b=>{
   const on=b.getAttribute('data-mad-status')==='active';
   b.classList.toggle('is-active',on);
   b.setAttribute('aria-pressed',on?'true':'false');
  });
  clearMerchantSelection();
  apply();
 });
 $('madPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b && !b.disabled){page=+b.dataset.page;render()}});
 body?.addEventListener('change',e=>{
  const input=e.target.closest&&e.target.closest('[data-merchant-select]');
  if(!input) return;
  const id=String(input.getAttribute('data-merchant-select')||'');
  if(!id) return;
  if(input.checked) selectedMerchantIds.add(id);
  else selectedMerchantIds.delete(id);
  syncSelectionUi();
 });
 selectAllInput?.addEventListener('change',()=>{
  const ids=selectableIdsOnPage();
  if(selectAllInput.checked) ids.forEach(id=>selectedMerchantIds.add(id));
  else ids.forEach(id=>selectedMerchantIds.delete(id));
  body.querySelectorAll('[data-merchant-select]').forEach(el=>{ el.checked=selectAllInput.checked; });
  syncSelectionUi();
 });
 bulkDeleteBtn?.addEventListener('click',()=>deleteMerchantsByIds([...selectedMerchantIds]));
 body?.addEventListener('click',e=>{
  const viewBtn=e.target.closest('[data-view]');
  if(viewBtn){ open(viewBtn.dataset.view); return; }

  const creditBtn=e.target.closest('[data-credit]');
  if(creditBtn){ openCredit(creditBtn.dataset.credit); return; }

  const resetBtnEl=e.target.closest('[data-reset-pass]');
  if(resetBtnEl){ openResetPassword(resetBtnEl.dataset.resetPass); return; }

  const deleteBtn=e.target.closest('[data-delete]');
  if(deleteBtn){ deleteMerchantsByIds([deleteBtn.dataset.delete]); return; }

  const chipBtn=e.target.closest('[data-merchant-status-toggle]');
  if(chipBtn){
   if(chipBtn.disabled||chipBtn.classList.contains('is-saving')) return;
   updateMerchantStatus(chipBtn.getAttribute('data-merchant-status-toggle'), chipBtn.getAttribute('data-next-status'), chipBtn);
  }
 });
 document.querySelectorAll('[data-mad-close-edit]').forEach(b=>b.onclick=close);
 document.querySelectorAll('[data-mad-close-credit]').forEach(b=>b.onclick=closeCredit);
 document.querySelectorAll('[data-mad-close-pass]').forEach(b=>b.addEventListener('click',closeResetPassword));
 $('madCreditModal')?.addEventListener('click',e=>{ if(e.target===$('madCreditModal')) closeCredit(); });
 $('madResetPasswordModal')?.addEventListener('click',e=>{ if(e.target===$('madResetPasswordModal')) closeResetPassword(); });
 $('madCreditForm')?.addEventListener('click',e=>{
  const btn=e.target.closest('[data-credit-action]');
  if(!btn) return;
  const next=String(btn.getAttribute('data-credit-action')||'').toUpperCase();
  if(next!=='ADD' && next!=='DEDUCT') return;
  if(creditAction===next) return;
  creditAction=next;
  setStatus('madCreditStatus','');
  syncCreditMode();
 });
 $('madCreditForm')?.addEventListener('submit',submitCredit);
 $('madResetGeneratePassword')?.addEventListener('click',()=>{
  const pwd=generatePassword(14);
  const a=$('madResetNewPassword'), b=$('madResetConfirmPassword');
  if(a){ a.type='text'; a.value=pwd; }
  if(b){ b.type='text'; b.value=pwd; }
  setStatus('madResetPassStatus','Strong password generated. Copy it before applying.','success');
 });
 $('madResetPassApply')?.addEventListener('click',applyResetPassword);
 document.addEventListener('click',e=>{
  const toggle=e.target.closest&&e.target.closest('[data-toggle-password]');
  if(!toggle) return;
  const id=toggle.getAttribute('data-toggle-password');
  const input=$(id);
  if(!input) return;
  const show=input.type==='password';
  input.type=show?'text':'password';
  toggle.setAttribute('aria-pressed',show?'true':'false');
  toggle.setAttribute('aria-label',show?'Hide password':'Show password');
  const icon=toggle.querySelector('i');
  if(icon) icon.className=show?'bi bi-eye-slash':'bi bi-eye';
 });
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if($('madResetPasswordModal')?.classList.contains('show')) closeResetPassword();
 });
 form?.addEventListener('submit',async e=>{e.preventDefault();const st=$('madEditFormStatus');try{st.textContent='Saving merchant and provider pricing...';const id=+$('madEditId').value;await api('/admin/merchants/save',{method:'POST',headers:hdr(),body:JSON.stringify({id,code:$('madEditCode').value,name:$('madEditName').value.trim(),primaryDomain:$('madEditDomain').value.trim(),currency:$('madEditCurrency').value.trim(),frontendRoot:$('madEditFrontendRoot').value.trim(),creditMode:$('madEditCreditMode').value,status:+$('madEditStatus').value,domainAliases:editing?.domainAliases||'',lowCreditThreshold:editing?.lowCreditThreshold||0,providerMarkupPercent:Number($('madProviderMarkup').value||0)})});await saveProviderPricing(id);st.textContent='Merchant updated successfully.';await load();setTimeout(close,450)}catch(x){st.textContent=x.message}});
 $('madExportBtn')?.addEventListener('click',()=>{const csv=[['Merchant','Company','Domain','Role','Currency','Credit Balance','Status','Created By','Last Login','Last Logout'],...filtered.map(b=>[b.code,b.name,b.primaryDomain,roleName(b),b.currency,b.creditBalance,active(b)?'Active':'Suspended',b.createdByName||b.createdByUsername||'Legacy / Migration',b.masterLastLoginAt,b.masterLastLogoutAt])].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='merchants.csv';a.click();URL.revokeObjectURL(a.href)});
 document.body.classList.add('mad-view-active');
 load();
})();
