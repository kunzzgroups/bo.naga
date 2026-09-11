(function(){
 'use strict';
 const $=id=>document.getElementById(id), status=$('merchantCreateStatus');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j.data;}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()});

 let platformProviders=[];
 let currencyOptions=[];
 const selectedCodes=new Set();
 const overrideByCode=new Map();
 const enabledCurrencies=new Set(['MYR']);
 let providerSearch='';

 function setStatus(msg, kind){
  if(!status) return;
  status.textContent=msg||'';
  status.className='upload-status mb-3'+(kind?(' '+kind):'');
 }

 function primaryCurrency(){
  return String($('merchantCurrency')?.value||'MYR').trim().toUpperCase()||'MYR';
 }
 function normalizeCurrencyCode(raw){
  return String(raw||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
 }
 function activeCurrencyRows(){
  const rows=currencyOptions.length?currencyOptions:[{currencyCode:'MYR',displayName:'Malaysian Ringgit',rateFromBase:1,status:1}];
  return rows.filter(x=>Number(x.status??1)===1);
 }
 function currencyRowByCode(code){
  const key=normalizeCurrencyCode(code);
  return activeCurrencyRows().find(x=>String(x.currencyCode||'').toUpperCase()===key)||null;
 }
 function ensureCurrencyOption(code, displayName){
  const key=normalizeCurrencyCode(code);
  if(!key) return '';
  const name=String(displayName||'').trim();
  const existing=currencyOptions.find(x=>String(x.currencyCode||'').toUpperCase()===key);
  if(existing){
   if(name && !String(existing.displayName||'').trim()) existing.displayName=name;
   return key;
  }
  currencyOptions.push({
   currencyCode:key,
   displayName:name||key,
   rateFromBase:1,
   decimalPlaces:2,
   status:1,
   _local:true
  });
  return key;
 }
 function syncEnabledWithPrimary(){
  enabledCurrencies.add(primaryCurrency());
 }
 function enabledCurrencyPayload(){
  syncEnabledWithPrimary();
  return [...enabledCurrencies].filter(Boolean);
 }
 function availableCurrenciesToAdd(){
  return activeCurrencyRows().filter(x=>{
   const code=String(x.currencyCode||'').toUpperCase();
   return code && !enabledCurrencies.has(code);
  });
 }
 function setCurrencyModalStatus(msg, kind){
  const el=$('merchantCurrencyModalStatus');
  if(!el) return;
  el.textContent=msg||'';
  el.className='upload-status mb-0'+(kind?(' '+kind):'');
 }
 function renderCurrencyModalList(){
  const list=$('merchantCurrencyModalList');
  if(!list) return;
  const rows=availableCurrenciesToAdd();
  if(!rows.length){
   list.innerHTML='<div class="mac-currency-modal-empty">No catalog currencies left to pick. Enter a code above to add one.</div>';
   return;
  }
  list.innerHTML=rows.map(x=>{
   const code=String(x.currencyCode||'').toUpperCase();
   return `<label class="mac-currency-modal-item">
     <input type="checkbox" value="${esc(code)}" data-mac-currency-pick="${esc(code)}"/>
     <span class="mac-currency-modal-item-copy"><b>${esc(code)}</b></span>
   </label>`;
  }).join('');
 }
 function openCurrencyModal(){
  const modal=$('merchantCurrencyModal');
  if(!modal) return;
  const codeInput=$('merchantCurrencyModalCode');
  if(codeInput) codeInput.value='';
  setCurrencyModalStatus('');
  renderCurrencyModalList();
  modal.hidden=false;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  codeInput?.focus();
 }
 function closeCurrencyModal(){
  const modal=$('merchantCurrencyModal');
  if(!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  modal.hidden=true;
  document.body.classList.remove('modal-open');
  setCurrencyModalStatus('');
 }
 function confirmCurrencyModal(){
  const typedCode=normalizeCurrencyCode($('merchantCurrencyModalCode')?.value);
  const picks=[...document.querySelectorAll('#merchantCurrencyModalList [data-mac-currency-pick]:checked')]
    .map(el=>normalizeCurrencyCode(el.value||el.getAttribute('data-mac-currency-pick')||''))
    .filter(Boolean);
  if(!typedCode && !picks.length){
   setCurrencyModalStatus('Enter a currency or select at least one from the catalog.', 'error');
   return;
  }
  if(typedCode){
   if(typedCode.length<3){
    setCurrencyModalStatus('Currency must be at least 3 characters (e.g. THB).', 'error');
    return;
   }
   if(enabledCurrencies.has(typedCode)){
    setCurrencyModalStatus(typedCode+' is already in the dropdown.', 'error');
    return;
   }
   ensureCurrencyOption(typedCode, currencyRowByCode(typedCode)?.displayName || typedCode);
   enabledCurrencies.add(typedCode);
  }
  picks.forEach(code=>{
   ensureCurrencyOption(code, currencyRowByCode(code)?.displayName || code);
   enabledCurrencies.add(code);
  });
  renderCurrencyOptions();
  closeCurrencyModal();
 }

 function renderCurrencyOptions(){
  const sel=$('merchantCurrency');
  if(!sel)return;
  const rows=activeCurrencyRows();
  const byCode=new Map(rows.map(x=>[String(x.currencyCode||'').toUpperCase(),x]));
  // Keep manually added codes even if catalog reload lags; only drop empty keys.
  [...enabledCurrencies].forEach(code=>{ if(!code) enabledCurrencies.delete(code); });
  if(!enabledCurrencies.size){
   const fallback=String(rows[0]?.currencyCode||'MYR').toUpperCase();
   enabledCurrencies.add(fallback);
   ensureCurrencyOption(fallback, byCode.get(fallback)?.displayName || fallback);
  }
  [...enabledCurrencies].forEach(code=>{
   if(!byCode.has(code)) ensureCurrencyOption(code, code);
  });
  const current=primaryCurrency();
  const preferred=enabledCurrencies.has(current)?current:[...enabledCurrencies][0];
  const ordered=[...enabledCurrencies].sort((a,b)=>a.localeCompare(b));
  sel.innerHTML=ordered.map(code=>`<option value="${esc(code)}"${code===preferred?' selected':''}>${esc(code)}</option>`).join('');
  if(preferred) sel.value=preferred;
  syncCurrencyUnits();
  if(window.BOSelectSync?.one) window.BOSelectSync.one(sel);
 }
 async function loadCurrencies(){
  try{const d=await api('/public/currency/options',{headers:BO_AUTH.authHeader()});window.__currencyBase=String(d.baseCurrency||'MYR').toUpperCase();
    const localOnly=currencyOptions.filter(x=>x&&x._local);
    currencyOptions=Array.isArray(d.rates)?d.rates.slice():[];
    localOnly.forEach(row=>{
     const code=String(row.currencyCode||'').toUpperCase();
     if(code && !currencyOptions.some(x=>String(x.currencyCode||'').toUpperCase()===code)) currencyOptions.push(row);
    });
    const base=String(d.baseCurrency||'MYR').toUpperCase();
    if(!enabledCurrencies.size) enabledCurrencies.add(base);
    if([...enabledCurrencies].every(c=>!activeCurrencyRows().some(r=>String(r.currencyCode||'').toUpperCase()===c))){
      enabledCurrencies.clear();
      enabledCurrencies.add(base);
    }
    renderCurrencyOptions();
  }
  catch(e){currencyOptions=[{currencyCode:'MYR',displayName:'Malaysian Ringgit',rateFromBase:1,status:1}];enabledCurrencies.clear();enabledCurrencies.add('MYR');renderCurrencyOptions();}
 }
 function syncCurrencyUnits(){
  const cur=primaryCurrency();
  const unit=$('merchantThresholdUnit'), label=$('merchantThresholdLabel');
  if(unit) unit.textContent=cur;
  if(label) label.textContent='('+cur+')';
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

 function providerCode(p){
  return String(p.code||'').toUpperCase();
 }

 function markupRaw(){
  return String($('merchantMarkup')?.value??'').trim();
 }

 function markupValue(){
  return Number(markupRaw()||0);
 }

 function appliedMarkupValue(){
  const raw=markupRaw();
  return (raw===''||raw==='0')?'':raw;
 }

 function applyMarkupToSelected(){
  const synced=appliedMarkupValue();
  selectedCodes.forEach(code=>{
    if(synced==='') overrideByCode.delete(code);
    else overrideByCode.set(code, synced);
  });
 }

 function filteredProviders(){
  const q=providerSearch.trim().toLowerCase();
  if(!q) return platformProviders.slice();
  return platformProviders.filter(p=>{
    const code=providerCode(p).toLowerCase();
    const name=String(p.name||'').toLowerCase();
    return code.includes(q) || name.includes(q);
  });
 }

 function syncOverrideInputsFromDom(){
  document.querySelectorAll('#merchantProviderSelectedBody [data-provider-override]').forEach(inp=>{
    const code=String(inp.getAttribute('data-provider-override')||'').toUpperCase();
    if(!code) return;
    const raw=String(inp.value||'').trim();
    if(raw==='') overrideByCode.delete(code);
    else overrideByCode.set(code, raw);
  });
 }

 function updateCounts(){
  const catalogCount=$('merchantProviderCatalogCount');
  const selectedCount=$('merchantProviderSelectedCount');
  if(catalogCount) catalogCount.textContent=String(filteredProviders().length);
  if(selectedCount) selectedCount.textContent=String(selectedCodes.size);
 }

 function renderCatalog(){
  const out=$('merchantProviderCatalogList');
  if(!out) return;
  if(out.querySelector('.mac-provider-empty.is-error') && !platformProviders.length) return;
  const rows=filteredProviders();
  if(!rows.length){
    out.innerHTML='<div class="mac-provider-empty">'+(platformProviders.length?'No providers match your search.':'No platform providers configured.')+'</div>';
    updateCounts();
    return;
  }
  out.innerHTML=rows.map(p=>{
    const code=providerCode(p);
    const checked=selectedCodes.has(code);
    const name=String(p.name||'').trim();
    const showName=name && name.toUpperCase()!==code;
    return `<button type="button" class="mac-provider-chip${checked?' is-selected':''}" data-provider-pick="${esc(code)}" role="listitem" aria-pressed="${checked?'true':'false'}">`+
      `<b>${esc(code)}</b>${showName?`<small>${esc(name)}</small>`:''}`+
      `</button>`;
  }).join('');
  updateCounts();
 }

 function renderSelected(){
  const out=$('merchantProviderSelectedBody');
  if(!out) return;
  const selected=platformProviders.filter(p=>selectedCodes.has(providerCode(p)));
  if(!selected.length){
    out.innerHTML='<div class="mac-provider-empty">Select providers on the left to configure pricing.</div>';
    updateCounts();
    return;
  }
  out.innerHTML=selected.map(p=>{
    const code=providerCode(p);
    const base=Number(p.settlementCostPercent||0);
    const basis=String(p.settlementCostBasis||'HOUSE_WIN').toUpperCase();
    const ov=overrideByCode.has(code)?overrideByCode.get(code):'';
    const add=String(ov||'').trim()!==''?Number(ov):0;
    const eff=base+Number(add||0);
    const basisLabel=basis==='TURNOVER'?'TO':'GGR';
    return `<article class="mac-provider-selected-card" data-provider-row="${esc(code)}" data-base="${base}" data-basis="${esc(basis)}">`+
      `<div class="mac-provider-selected-title"><b>${esc(code)}</b><span class="mac-provider-base-tag" title="Provider base ${base.toFixed(4)}% · ${basis==='TURNOVER'?'Turnover':'House Win / GGR'}">Base ${base.toFixed(2)}% · ${esc(basisLabel)}</span></div>`+
      `<div class="mac-provider-selected-fields">`+
      `<label class="mac-provider-override-wrap"><span class="mac-provider-field-label">Override</span><span class="mac-provider-override-control"><input type="number" min="0" max="100" step="0.0001" data-provider-override="${esc(code)}" value="${esc(ov||'')}" placeholder="—"><span class="mac-provider-override-unit">%</span></span></label>`+
      `<div class="mac-provider-eff-wrap"><span class="mac-provider-field-label">Effective</span><b class="mac-provider-eff" data-provider-effective="${esc(code)}">${eff.toFixed(4)}%</b></div>`+
      `</div></article>`;
  }).join('');
  updateCounts();
 }

 function recalcSelectedEffective(){
  document.querySelectorAll('#merchantProviderSelectedBody [data-provider-row]').forEach(r=>{
    const code=r.dataset.providerRow;
    const base=Number(r.dataset.base||0);
    const inp=r.querySelector('[data-provider-override]');
    const ovRaw=String(inp?.value||'').trim();
    const add=ovRaw!==''?Number(ovRaw):0;
    const eff=r.querySelector('[data-provider-effective]');
    if(eff) eff.textContent=(base+Number(add||0)).toFixed(4)+'%';
    if(code){
      if(ovRaw==='') overrideByCode.delete(code);
      else overrideByCode.set(code, ovRaw);
    }
  });
 }

 function setProviderSelected(code, on){
  const key=String(code||'').toUpperCase();
  if(!key) return;
  if(on) selectedCodes.add(key);
  else selectedCodes.delete(key);
  renderCatalog();
  renderSelected();
 }

 function selectedProviderPayload(){
  syncOverrideInputsFromDom();
  return platformProviders
    .filter(p=>selectedCodes.has(providerCode(p)))
    .map(p=>{
      const code=providerCode(p);
      const ov=overrideByCode.has(code)?overrideByCode.get(code):'';
      return {
        providerCode:code,
        defaultChargePercent:Number(ov||0),
        chargeBasis:String(p.settlementCostBasis||'HOUSE_WIN')
      };
    });
 }

 async function loadPlatformProviders(){
  const out=$('merchantProviderCatalogList');
  try{
    const data=await api('/admin/merchants/provider-pricing-catalog',{headers:BO_AUTH.authHeader()});
    const list=Array.isArray(data)?data:(data?.content||data?.list||data?.rows||[]);
    platformProviders=(list||[])
      .filter(p=>Number(p.status??1)===1)
      .map(p=>({
        code:p.code,
        name:p.name,
        settlementCostPercent:p.settlementCostPercent??p.settlement_cost_percent??0,
        settlementCostBasis:p.settlementCostBasis||p.settlement_cost_basis||'HOUSE_WIN'
      }))
      .sort((a,b)=>String(a.code||'').localeCompare(String(b.code||'')));
    renderCatalog();
    renderSelected();
  }catch(e){
    if(out) out.innerHTML=`<div class="mac-provider-empty is-error">${esc(e.message||'Unable to load providers')}</div>`;
  }
 }

 async function saveProviderPricing(id){
  await api('/admin/merchants/'+id+'/provider-pricing',{
    method:'POST',headers:hdr(),
    body:JSON.stringify({
      providerMarkupPercent:markupValue(),
      providers:selectedProviderPayload()
    })
  });
 }

 $('merchantCurrency')?.addEventListener('change', ()=>{
  syncEnabledWithPrimary();
  syncCurrencyUnits();
  if(window.BOSelectSync?.one) window.BOSelectSync.one($('merchantCurrency'));
 });

 $('merchantCurrencyAdd')?.addEventListener('click', e=>{
  e.preventDefault();
  e.stopPropagation();
  openCurrencyModal();
 });

 $('merchantCurrencyModalCode')?.addEventListener('input', e=>{
  setCurrencyModalStatus('');
  const code=normalizeCurrencyCode(e.target.value);
  if(e.target.value!==code) e.target.value=code;
 });

 $('merchantCurrencyModalCode')?.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
   e.preventDefault();
   confirmCurrencyModal();
  }
 });

 $('merchantCurrencyModalConfirm')?.addEventListener('click', ()=>confirmCurrencyModal());

 document.querySelectorAll('[data-mac-currency-close]').forEach(btn=>{
  btn.addEventListener('click', ()=>closeCurrencyModal());
 });

 $('merchantCurrencyModal')?.addEventListener('click', e=>{
  if(e.target===$('merchantCurrencyModal')) closeCurrencyModal();
 });

 document.addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  const modal=$('merchantCurrencyModal');
  if(modal?.classList.contains('show')) closeCurrencyModal();
 });

 $('merchantGeneratePassword')?.addEventListener('click', ()=>{
  const pwd=generatePassword(14);
  const input=$('merchantMasterPassword');
  const confirm=$('merchantMasterPasswordConfirm');
  if(!input) return;
  input.type='text';
  input.value=pwd;
  if(confirm){
    confirm.type='text';
    confirm.value=pwd;
  }
  document.querySelectorAll('[data-toggle-password="merchantMasterPassword"] i, [data-toggle-password="merchantMasterPasswordConfirm"] i').forEach(eye=>{
    eye.className='bi bi-eye-slash';
  });
  setStatus('Strong password generated. Copy it before leaving this page.', 'success');
 });

 document.addEventListener('click', e=>{
  const toggle=e.target.closest&&e.target.closest('[data-toggle-password]');
  if(!toggle) return;
  const id=toggle.getAttribute('data-toggle-password');
  const input=$(id);
  if(!input) return;
  const show=input.type==='password';
  input.type=show?'text':'password';
  const icon=toggle.querySelector('i');
  if(icon) icon.className=show?'bi bi-eye-slash':'bi bi-eye';
 });

 $('merchantProviderSearch')?.addEventListener('input', e=>{
  providerSearch=e.target.value||'';
  renderCatalog();
 });

 $('merchantProviderSelectAll')?.addEventListener('click', ()=>{
  filteredProviders().forEach(p=>selectedCodes.add(providerCode(p)));
  renderCatalog();
  renderSelected();
 });

 $('merchantProviderClearAll')?.addEventListener('click', ()=>{
  if(providerSearch.trim()){
    filteredProviders().forEach(p=>selectedCodes.delete(providerCode(p)));
  }else{
    selectedCodes.clear();
  }
  renderCatalog();
  renderSelected();
 });

 $('merchantProviderCatalogList')?.addEventListener('click', e=>{
  const btn=e.target.closest&&e.target.closest('[data-provider-pick]');
  if(!btn) return;
  const code=btn.getAttribute('data-provider-pick');
  setProviderSelected(code, !selectedCodes.has(String(code||'').toUpperCase()));
 });

 $('merchantProviderSelectedBody')?.addEventListener('input', e=>{
  const inp=e.target.closest&&e.target.closest('[data-provider-override]');
  if(!inp) return;
  recalcSelectedEffective();
 });

 $('merchantProviderApplyMarkup')?.addEventListener('click', ()=>{
  applyMarkupToSelected();
  renderSelected();
 });

 syncCurrencyUnits();
 loadCurrencies();
 loadPlatformProviders();
 loadMasterRoles();

 async function loadMasterRoles(){
  const sel=$('merchantMasterRole');
  if(!sel) return;
  const fallback=()=>{
    sel.innerHTML='<option value="" data-role-type="BRAND_OWNER" selected>Brand Owner</option>';
  };
  try{
    const primary=BO_AUTH.roleListAllUrl?BO_AUTH.roleListAllUrl():BO_AUTH.roleListUrl();
    let rows=[];
    try{
      const j=await fetch(primary,{headers:BO_AUTH.authHeader(),cache:'no-store'}).then(r=>r.json());
      if(j&&j.status!=='error') rows=Array.isArray(j.data)?j.data:[];
    }catch(_){
      const j=await fetch(BO_AUTH.roleListUrl(),{headers:BO_AUTH.authHeader(),cache:'no-store'}).then(r=>r.json());
      if(j&&j.status!=='error') rows=Array.isArray(j.data)?j.data:[];
    }
    const brandOwner=rows.filter(r=>{
      const type=String(r.roleType||r.type||'').toUpperCase();
      const code=String(r.code||'').toUpperCase();
      const name=String(r.name||'').toLowerCase();
      return type==='BRAND_OWNER'||code==='BRAND_OWNER'||name.includes('brand owner');
    }).filter(r=>Number(r.status==null?1:r.status)===1);
    const list=brandOwner.length?brandOwner:[{id:'',name:'Brand Owner',roleType:'BRAND_OWNER'}];
    const globalOnly=list.filter(r=>r.brandId==null||r.brandId===''||r.id==='');
    const use=globalOnly.length?globalOnly:list;
    sel.innerHTML=use.map((r,i)=>{
      const id=r.id!=null&&r.id!==''?String(r.id):'';
      const label=esc(r.name||r.code||'Brand Owner');
      const type=esc(String(r.roleType||r.type||'BRAND_OWNER').toUpperCase());
      return `<option value="${esc(id)}" data-role-type="${type}"${i===0?' selected':''}>${label}</option>`;
    }).join('');
  }catch(e){
    fallback();
  }
 }

 $('merchantBrandForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
   setStatus('Creating merchant...');
   const username=($('merchantMasterUsername')?.value||'').trim();
   const password=$('merchantMasterPassword')?.value||'';
   const confirmPassword=$('merchantMasterPasswordConfirm')?.value||'';
   const roleSel=$('merchantMasterRole');
   const roleId=roleSel?.value||'';
   const roleType=(roleSel?.selectedOptions?.[0]?.getAttribute('data-role-type')||'BRAND_OWNER').toUpperCase();
   if(username||password||confirmPassword){
    if(!username) throw new Error('Login ID / Username is required for the master account');
    if(password.length<8) throw new Error('Merchant Master password must be at least 8 characters');
    if(password!==confirmPassword) throw new Error('Confirm password does not match');
   }
   const body={
    code:$('merchantCode').value.trim(),
    name:$('merchantName').value.trim(),
    primaryDomain:$('merchantDomain').value.trim(),
    domainAliases:$('merchantAliases').value.trim(),
    frontendRoot:$('merchantRoot').value.trim(),
    currency:$('merchantCurrency').value.trim()||'MYR',
    enabledCurrencies:enabledCurrencyPayload(),
    creditMode:$('merchantCreditMode').value,
    lowCreditThreshold:$('merchantThreshold').value||0,
    providerMarkupPercent:$('merchantMarkup').value||0,
    status:1
   };
   const out=await api('/admin/merchants/save',{method:'POST',headers:hdr(),body:JSON.stringify(body)});
   const b=out.brand||out;
   if(username){
    const payload={
      displayName:($('merchantMasterName').value.trim()||username),
      username,
      password,
      status:1,
      roleType
    };
    if(roleId) payload.roleId=Number(roleId);
    await api('/admin/merchants/'+b.id+'/master-account',{
     method:'POST',
     headers:hdr(),
     body:JSON.stringify(payload)
    });
   }
   setStatus('Saving provider pricing...');
   await saveProviderPricing(b.id);
   BO_BRAND?.invalidate?.();
   setStatus('Merchant created successfully.', 'success');
   setTimeout(()=>location.href='main-merchant-detail.html',350);
  }catch(x){
   setStatus(x.message, 'error');
  }
 });
})();
