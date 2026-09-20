(function(){
 const $=s=>document.querySelector(s); let rows=[];
 const url=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k]; const headers=()=>Object.assign({'Content-Type':'application/json'},window.BO_AUTH?BO_AUTH.authHeader():{});
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const val=(id,v)=>{const e=$(id);if(e)e.value=v==null?'':v}; const num=id=>Number(($(id)?.value)||0);
 const flag=id=>{const e=$(id);if(!e)return 0;return e.type==='checkbox'?(e.checked?1:0):Number(e.value||0)};
 const setFlag=(id,v)=>{const e=$(id);if(!e)return;if(e.type==='checkbox'){e.checked=Number(v)===1;e.setAttribute('aria-checked',e.checked?'true':'false');return;}e.value=v==null?'':v;};
 function syncExpRows(){
   document.querySelectorAll('[data-exp-row]').forEach(row=>{
     const sw=row.querySelector('input[type="checkbox"]');
     const on=sw?!!sw.checked:true;
     row.classList.toggle('is-off',!on);
     row.querySelectorAll('.vip-exp-value input').forEach(inp=>{inp.disabled=!on;});
     if(sw)sw.setAttribute('aria-checked',on?'true':'false');
   });
   document.querySelectorAll('[data-exp-flag] input[type="checkbox"]').forEach(sw=>{
     sw.setAttribute('aria-checked',sw.checked?'true':'false');
     const row=sw.closest('[data-exp-flag]');
     if(row)row.classList.toggle('is-off',!sw.checked);
   });
 }
 async function load(){const r=await fetch(url('VIP_LEVEL_LIST'),{headers:headers()});const j=await r.json();rows=Array.isArray(j.data)?j.data:[];render();}
 function render(){const body=$('#vipLevelBody');body.innerHTML=rows.length?rows.map(x=>`<tr><td class="vip-num">${x.sortOrder}</td><td><div class="vip-level-name">${x.imageUrl?`<img class="vip-level-thumb" src="${esc(x.imageUrl)}" alt="">`:'<span class="vip-level-icon" aria-hidden="true"><i class="bi bi-gem"></i></span>'}<div><b>${esc(x.name)}</b><small>${esc(x.levelKey)}</small></div></div></td><td><b>${Number(x.stepCount||0)}</b> step(s)<br><small>${Number(x.tierExperienceRequired||0).toLocaleString()} EXP total</small></td><td class="vip-num">${Number(x.requiredExperience||0).toLocaleString()}</td><td class="vip-num">${Number(x.depositRequirement||0).toFixed(2)}</td><td class="vip-num">${x.rebateLiveCasino}% / ${x.rebateSportsbook}% / ${x.rebateSlots}%</td><td class="vip-num">${Number(x.oneTimeBonus||0).toFixed(2)}</td><td class="vip-num">${Number(x.monthlyBonus||0).toFixed(2)} / ${Number(x.weeklyBonus||0).toFixed(2)}</td><td><span class="status-pill ${Number(x.enabled)===1?'active':'off'}">${Number(x.enabled)===1?'Enabled':'Disabled'}</span></td><td><div class="vip-actions"><button class="bo-tx-action-btn is-edit" data-edit="${x.id}" type="button" title="Edit" aria-label="Edit"><i class="bi bi-pencil"></i></button><button class="bo-tx-action-btn is-reject" data-delete="${x.id}" type="button" title="Delete" aria-label="Delete"><i class="bi bi-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="10">No VIP level configured.</td></tr>';}
 async function loadExp(){const r=await fetch(url('VIP_EXP_SETTINGS'),{headers:headers()});const j=await r.json();const x=j.data||{};[['#expDepositRate','depositAmountPerExp'],['#expBetRate','validBetAmountPerExp'],['#expRegistration','registrationExp'],['#expFirstDeposit','firstDepositExp'],['#expLogin','dailyLoginExp'],['#expDailyLimit','dailyExpLimit']].forEach(a=>val(a[0],x[a[1]]));[['#expDepositEnabled','depositEnabled'],['#expBetEnabled','validBetEnabled'],['#expRegistrationEnabled','registrationEnabled'],['#expFirstDepositEnabled','firstDepositEnabled'],['#expLoginEnabled','dailyLoginEnabled'],['#expManualEnabled','manualAdjustmentEnabled'],['#expRefund','countRefundedBets'],['#expCancelled','countCancelledBets']].forEach(a=>setFlag(a[0],x[a[1]]));syncExpRows();}
 async function saveExp(){const data={depositEnabled:flag('#expDepositEnabled'),depositAmountPerExp:num('#expDepositRate'),validBetEnabled:flag('#expBetEnabled'),validBetAmountPerExp:num('#expBetRate'),registrationEnabled:flag('#expRegistrationEnabled'),registrationExp:num('#expRegistration'),firstDepositEnabled:flag('#expFirstDepositEnabled'),firstDepositExp:num('#expFirstDeposit'),dailyLoginEnabled:flag('#expLoginEnabled'),dailyLoginExp:num('#expLogin'),dailyExpLimit:num('#expDailyLimit'),manualAdjustmentEnabled:flag('#expManualEnabled'),countRefundedBets:flag('#expRefund'),countCancelledBets:flag('#expCancelled')};const r=await fetch(url('VIP_EXP_SETTINGS'),{method:'POST',headers:headers(),body:JSON.stringify(data)});const j=await r.json();alert(j.message||'Saved');}
 document.addEventListener('click',async e=>{
   if(e.target.closest('#vipAdd')){location.href='vip-level-edit.html';return;}
   if(e.target.closest('#vipReload')){load();loadExp();return;}
   if(e.target.closest('#vipSaveExp')){saveExp();return;}
   const eb=e.target.closest('[data-edit]');
   if(eb){location.href='vip-level-edit.html?id='+encodeURIComponent(eb.dataset.edit)+'#id='+encodeURIComponent(eb.dataset.edit);return;}
   const db=e.target.closest('[data-delete]');
   if(db&&(await BO_DIALOG.confirm('Delete this VIP level and all its inner steps?',{title:'Delete VIP Level',confirmText:'Delete'}))){
     await fetch(url('VIP_LEVEL_DELETE')+'/'+db.dataset.delete,{method:'DELETE',headers:headers()});
     load();
   }
 });
 const expCard=document.querySelector('.vip-settings-card');
 expCard?.addEventListener('change',e=>{if(e.target.matches('input[type="checkbox"][role="switch"]'))syncExpRows();});
 expCard?.addEventListener('click',e=>{
   const row=e.target.closest('[data-exp-row], [data-exp-flag]');
   if(!row||!expCard.contains(row))return;
   const sw=row.querySelector('input[type="checkbox"][role="switch"]');
   if(!sw)return;
   const valueHit=e.target.closest('.vip-exp-value');
   if(valueHit){
     const inp=valueHit.querySelector('input');
     if(inp&&!inp.disabled)return;
   }
   if(e.target.closest('.vip-exp-switch')||e.target===sw)return;
   e.preventDefault();
   sw.checked=!sw.checked;
   sw.setAttribute('aria-checked',sw.checked?'true':'false');
   sw.dispatchEvent(new Event('change',{bubbles:true}));
 });
 (function initExpFold(){
   const card=$('#vipExpCard'),btn=$('#vipExpFold'); if(!card||!btn)return;
   const KEY='bo_vip_exp_rules_collapsed';
   const apply=collapsed=>{
     card.classList.toggle('is-collapsed',!!collapsed);
     btn.setAttribute('aria-expanded',collapsed?'false':'true');
     btn.title=collapsed?'Expand rules':'Collapse rules';
     try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(e){}
   };
   let start=false; try{start=localStorage.getItem(KEY)==='1'}catch(e){}
   apply(start);
   btn.addEventListener('click',()=>apply(!card.classList.contains('is-collapsed')));
 })();
 Promise.all([load(),loadExp()]).catch(()=>{$('#vipLevelBody').innerHTML='<tr><td colspan="10">Unable to load VIP configuration.</td></tr>'});
})();
