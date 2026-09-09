(function(){
 'use strict';
 const $=id=>document.getElementById(id), status=$('merchantCreateStatus');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j.data;}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()});

 let platformProviders=[];
 const selectedCodes=new Set();
 const overrideByCode=new Map();
 let providerSearch='';

 function setStatus(msg, kind){
  if(!status) return;
  status.textContent=msg||'';
  status.className='upload-status mb-3'+(kind?(' '+kind):'');
 }

 function syncCurrencyUnits(){
  const cur=($('merchantCurrency')?.value||'MYR').trim()||'MYR';
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

 $('merchantCurrency')?.addEventListener('change', syncCurrencyUnits);

 $('merchantGeneratePassword')?.addEventListener('click', ()=>{
  const pwd=generatePassword(14);
  const input=$('merchantMasterPassword');
  if(!input) return;
  input.type='text';
  input.value=pwd;
  const eye=document.querySelector('[data-toggle-password="merchantMasterPassword"] i');
  if(eye) eye.className='bi bi-eye-slash';
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
 loadPlatformProviders();

 $('merchantBrandForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
   setStatus('Creating merchant...');
   const username=($('merchantMasterUsername')?.value||'').trim();
   const password=$('merchantMasterPassword')?.value||'';
   if(username&&password.length<8) throw new Error('Merchant Master password must be at least 8 characters');
   const body={
    code:$('merchantCode').value.trim(),
    name:$('merchantName').value.trim(),
    primaryDomain:$('merchantDomain').value.trim(),
    domainAliases:$('merchantAliases').value.trim(),
    frontendRoot:$('merchantRoot').value.trim(),
    currency:$('merchantCurrency').value.trim()||'MYR',
    creditMode:$('merchantCreditMode').value,
    lowCreditThreshold:$('merchantThreshold').value||0,
    providerMarkupPercent:$('merchantMarkup').value||0,
    status:1
   };
   const out=await api('/admin/merchants/save',{method:'POST',headers:hdr(),body:JSON.stringify(body)});
   const b=out.brand||out;
   if(username){
    await api('/admin/merchants/'+b.id+'/master-account',{
     method:'POST',
     headers:hdr(),
     body:JSON.stringify({
      displayName:($('merchantMasterName').value.trim()||username),
      username,
      password,
      status:1
     })
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
