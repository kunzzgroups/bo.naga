(function(){
 const cfg=window.BULK_OPERATION_CONFIG||{}; const state={members:[],filtered:[],selected:new Map(),promotions:[],loading:false};
 const $=id=>document.getElementById(id); const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
 async function jsonFetch(url,opt={}){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
 function memberId(m){return Number(m.id??m.memberId??m.userId)}
 function memberMeta(m){
  const u=String(m.username||'').trim();
  const name=String(m.fullName||'').trim();
  const mobile=String(m.mobile||'').trim();
  const bits=[];
  if(name&&name!==u)bits.push(name);
  if(mobile&&mobile!==u&&mobile!==name)bits.push(mobile);
  return bits.join(' · ');
 }
 function memberName(m){
  const name=String(m.fullName||'').trim();
  return name||'';
 }
 function memberMono(m){
  const name=String(m.fullName||'').trim();
  const fallback=String(m.username||'').trim();
  const s=name||fallback;
  if(!s)return'?';
  const cjk=s.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if(cjk&&cjk.length)return cjk.slice(0,2).join('');
  const parts=s.split(/[\s._-]+/).filter(Boolean);
  if(parts.length>=2)return ((parts[0][0]||'')+(parts[1][0]||'')).toUpperCase();
  const letters=s.replace(/[^a-zA-Z0-9]/g,'');
  if(letters)return letters.slice(0,2).toUpperCase();
  return s.slice(0,2).toUpperCase();
 }
 function toggleMember(id){
  id=Number(id);
  if(state.selected.has(id))state.selected.delete(id);
  else{
    const m=state.members.find(x=>memberId(x)===id);
    if(m)state.selected.set(id,m);
  }
  renderMembers();
  renderSelected();
 }
 function renderMembers(){
  const box=$('memberPickerList');
  if(!box)return;
  const rows=state.filtered;
  if(!rows.length){
    box.innerHTML='<div class="picker-empty">No matching members found.</div>';
    return;
  }
  box.innerHTML='<div class="member-picker-grid">'+rows.map(m=>{
    const id=memberId(m),sel=state.selected.has(id),meta=memberMeta(m),tip=`ID ${id}${meta?' · '+meta:''}`;
    return `<button type="button" class="member-pick-card${sel?' is-selected':''}" data-member-id="${id}" aria-pressed="${sel?'true':'false'}" title="${esc(tip)}"><span class="member-pick-avatar" aria-hidden="true">${esc(memberMono(m))}</span><span class="member-pick-body"><span class="member-pick-name">${esc(m.username||'-')}</span><span class="member-pick-sub"><span class="member-meta${meta?'':' is-empty'}">${esc(meta||'—')}</span><span class="vip-chip">V${esc(m.vipLevel??0)}</span></span></span><span class="member-balance">${money(m.mainWalletBalance)}</span></button>`;
  }).join('')+'</div>';
  box.querySelectorAll('.member-pick-card').forEach(btn=>{
    btn.addEventListener('click',()=>toggleMember(btn.getAttribute('data-member-id')));
  });
 }
 function renderSelected(){const rows=[...state.selected.values()];$('selectedCount').textContent=`${rows.length} selected`;$('selectedMembersBody').innerHTML=rows.length?rows.map((m,i)=>{const id=memberId(m),name=memberName(m);return `<tr title="ID ${id}"><td class="sel-idx">${i+1}</td><td class="sel-account">${esc(m.username||'-')}</td><td class="sel-name${name?'':' is-empty'}">${esc(name||'—')}</td><td class="sel-vip"><span class="vip-chip">V${esc(m.vipLevel??0)}</span></td><td class="sel-bal"><span class="member-balance">${money(m.mainWalletBalance)}</span></td><td class="sel-remove"><button type="button" class="remove-member" data-remove="${id}" aria-label="Remove ${esc(m.username||id)}"><i class="bi bi-x"></i></button></td></tr>`}).join(''):'<tr><td colspan="6" class="picker-empty-cell">Select members from the list on the left.</td></tr>';
 $('selectedMembersBody').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.selected.delete(Number(b.dataset.remove));renderMembers();renderSelected()});updateSummary();
 }
 function updateSummary(){const count=state.selected.size,amount=Number($('bulkAmount')?.value||0);const m=$('summaryMembers'),a=$('summaryAmount'),tot=$('summaryTotal');if(m)m.textContent=count;if(a)a.textContent=money(amount);if(tot)tot.textContent=money(count*amount)}
 function filter(){const q=($('memberSearch').value||'').trim().toLowerCase();state.filtered=!q?state.members:state.members.filter(m=>[m.id,m.username,m.fullName,m.mobile].some(v=>String(v??'').toLowerCase().includes(q)));renderMembers()}
 async function loadMembers(){const box=$('memberPickerList');box.innerHTML='<div class="picker-empty">Loading members...</div>';try{const j=await jsonFetch(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.MEMBER_LIST,{headers:{...BO_AUTH.authHeader()}});state.members=Array.isArray(j.data)?j.data:(j.data?.content||[]);state.filtered=state.members;renderMembers()}catch(e){box.innerHTML='<div class="picker-empty text-danger">'+esc(e.message)+'</div>'}}
 async function loadPromotions(){if(cfg.mode!=='bonus'||!$('bulkPromotion'))return;const sel=$('bulkPromotion'),help=$('bulkPromotionHelp');sel.disabled=true;sel.innerHTML='<option value="">Loading promotions...</option>';try{const j=await jsonFetch(API_CONFIG.BASE_URL+'/admin/promotion/list',{headers:{...BO_AUTH.authHeader()}});const now=Date.now();state.promotions=(Array.isArray(j.data)?j.data:[]).filter(p=>{if(Number(p.status)!==1)return false;const start=p.startAt?Date.parse(p.startAt):null,end=p.endAt?Date.parse(p.endAt):null,claimStart=p.claimStartAt?Date.parse(p.claimStartAt):null,claimEnd=p.claimEndAt?Date.parse(p.claimEndAt):null;return !(start&&now<start)&&!(end&&now>end)&&!(claimStart&&now<claimStart)&&!(claimEnd&&now>claimEnd)});sel.innerHTML='<option value="">-- Select promotion bonus --</option>'+state.promotions.map(p=>`<option value="${Number(p.id)}">${esc(p.name||'Promotion')} ${p.promotionCode?'['+esc(p.promotionCode)+']':''}</option>`).join('');sel.disabled=false;updatePromotionHelp()}catch(e){sel.innerHTML='<option value="">Unable to load promotions</option>';if(help)help.textContent=e.message}}
 function selectedPromotion(){const id=Number($('bulkPromotion')?.value||0);return state.promotions.find(p=>Number(p.id)===id)||null}
 function updatePromotionHelp(){const p=selectedPromotion(),help=$('bulkPromotionHelp');if(!help)return;if(!p){help.textContent='Applies that promotion’s turnover / rollover / withdraw rules.';return}const wallet=String(p.freeCreditWallet||'MAIN_WALLET').replaceAll('_',' '),turnover=Number(p.turnover||0),rollover=Number(p.rollover||0),maxWithdraw=Number(p.maxWithdraw||0);help.textContent=`${p.name}${p.promotionCode?' ['+p.promotionCode+']':''} · ${wallet} · ${turnover}x / ${rollover}x${maxWithdraw>0?' · max '+money(maxWithdraw):''}`}
 function showResult(data){const result=$('batchResult'),rows=data?.results||[];result.hidden=false;const bonus=cfg.mode==='bonus';const head=bonus?'<tr><th>Member ID</th><th>Promotion</th><th>Wallet</th><th>Status</th><th>Before</th><th>After</th><th>Message</th></tr>':'<tr><th>Member ID</th><th>Status</th><th>Before</th><th>After</th><th>Message</th></tr>';const body=rows.length?rows.map(x=>bonus?`<tr><td>${esc(x.memberId)}</td><td>${esc(x.promotionName||'-')}${x.promotionCode?`<br><small>${esc(x.promotionCode)}</small>`:''}</td><td>${esc(x.walletBucket||'-')}</td><td class="${x.status==='SUCCESS'?'result-ok':'result-skip'}">${esc(x.status)}</td><td>${x.before!=null?money(x.before):'-'}</td><td>${x.after!=null?money(x.after):'-'}</td><td>${esc(x.message|| (x.requiredTurnover!=null?'Turnover: '+money(x.requiredTurnover):'-'))}</td></tr>`:`<tr><td>${esc(x.memberId)}</td><td class="${x.status==='SUCCESS'?'result-ok':'result-skip'}">${esc(x.status)}</td><td>${x.before!=null?money(x.before):'-'}</td><td>${x.after!=null?money(x.after):'-'}</td><td>${esc(x.message||'-')}</td></tr>`).join(''):`<tr><td colspan="${bonus?7:5}">Operation completed successfully.</td></tr>`;result.innerHTML=`<div class="bulk-panel-title"><h2>Latest Batch Result</h2><span class="bulk-count-badge">${esc(data?.referenceNo||'Completed')}</span></div><div class="operation-summary"><div class="summary-chip"><span>Successful</span><b>${data?.successCount??rows.filter(x=>x.status==='SUCCESS').length}</b></div><div class="summary-chip"><span>Skipped</span><b>${data?.skippedCount??rows.filter(x=>x.status!=='SUCCESS').length}</b></div><div class="summary-chip"><span>Selected</span><b>${state.selected.size}</b></div></div><div class="selected-table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`}
 async function submit(){const ids=[...state.selected.keys()],amount=Number($('bulkAmount').value),type=$('bulkType').value,reasonCode=$('bulkReason').value.trim(),remark=$('bulkRemark').value.trim(),status=$('bulkStatus'),promotion=cfg.mode==='bonus'?selectedPromotion():null;if(!ids.length||!amount||amount<=0||!remark){status.className='alert alert-danger mt-3';status.textContent='Please select at least one member, enter an amount and add a remark.';return}if(cfg.mode==='bonus'&&!promotion){status.className='alert alert-danger mt-3';status.textContent='Please select which promotion bonus this adjustment belongs to.';return}const promoText=promotion?`\nPromotion: ${promotion.name}${promotion.promotionCode?' ['+promotion.promotionCode+']':''}`:'';if(!(await BO_DIALOG.confirm(`${type} ${money(amount)} for ${ids.length} selected member(s)?${promoText}`,{title:cfg.mode==='bonus'?'Confirm Bulk Promotion Bonus':'Confirm Bulk Adjustment',confirmText:'Confirm'})))return;const btn=$('bulkSubmit');btn.disabled=true;status.className='alert alert-info mt-3';status.textContent='Processing batch...';try{let payload,url;if(cfg.mode==='bonus'){payload={memberIds:ids,promotionId:Number(promotion.id),amount:type==='DEBIT'?-amount:amount,reasonCode,remark,referenceNo:'BO-BONUS-'+Date.now()};url=API_CONFIG.BASE_URL+'/admin/operations/bulk-bonus'}else{payload={memberIds:ids,adjustmentType:type,amount,reasonCode,remark,insufficientPolicy:'SKIP',referenceNo:'BO-BULK-'+Date.now()};url=API_CONFIG.BASE_URL+'/admin/member-wallet/bulk-adjustment'}const j=await jsonFetch(url,{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)});status.className='alert alert-success mt-3';status.textContent=j.message||'Batch completed.';showResult(j.data||{});await loadMembers()}catch(e){status.className='alert alert-danger mt-3';status.textContent=e.message}finally{btn.disabled=false}}
 document.addEventListener('DOMContentLoaded',()=>{BO_AUTH.requireLogin?.();BO_AUTH.renderProfile?.();BO_AUTH.renderSidebar?.();$('memberSearch').addEventListener('input',filter);$('memberSearchBtn').onclick=filter;$('clearSelectionBtn').onclick=()=>{state.selected.clear();renderMembers();renderSelected()};$('bulkAmount').addEventListener('input',updateSummary);$('bulkPromotion')?.addEventListener('change',updatePromotionHelp);$('bulkSubmit').onclick=submit;renderSelected();loadMembers();loadPromotions()});
})();
