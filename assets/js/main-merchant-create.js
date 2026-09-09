(function(){
 'use strict';
 const $=id=>document.getElementById(id), status=$('merchantCreateStatus');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j.data;}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()});

 let platformProviders=[];

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

 function selectedProviderRows(){
  return [...document.querySelectorAll('#merchantProviderPricingBody [data-provider-row]')]
    .filter(r=>r.querySelector('[data-provider-use]')?.checked);
 }

 function bindProviderInputs(){
  const markup=$('merchantMarkup');
  const recalc=()=>{
    const m=Number(markup?.value||0);
    document.querySelectorAll('#merchantProviderPricingBody [data-provider-row]').forEach(r=>{
      const use=r.querySelector('[data-provider-use]');
      const inp=r.querySelector('[data-provider-override]');
      const base=Number(r.dataset.base||0);
      const ov=Number(inp?.value||0);
      if(inp) inp.disabled=!use?.checked;
      const mcell=r.querySelector('[data-provider-markup]');
      const eff=r.querySelector('[data-provider-effective]');
      if(mcell) mcell.textContent=m.toFixed(4)+'%';
      if(eff) eff.textContent=((ov>0?ov:base)+m).toFixed(4)+'%';
    });
  };
  if(markup && !markup.dataset.bound){
    markup.dataset.bound='1';
    markup.addEventListener('input', recalc);
  }
  document.querySelectorAll('#merchantProviderPricingBody [data-provider-use]').forEach(x=>{
    x.addEventListener('change', recalc);
  });
  document.querySelectorAll('#merchantProviderPricingBody [data-provider-override]').forEach(x=>{
    x.addEventListener('input', recalc);
  });
  recalc();
 }

 function renderProviderRows(list){
  const out=$('merchantProviderPricingBody');
  if(!out) return;
  const markup=Number($('merchantMarkup')?.value||0);
  const rows=Array.isArray(list)?list:[];
  out.innerHTML=rows.length?rows.map(p=>{
    const code=String(p.code||'').toUpperCase();
    const base=Number(p.settlementCostPercent||0);
    const basis=String(p.settlementCostBasis||'HOUSE_WIN').toUpperCase();
    const eff=base+markup;
    return `<tr data-provider-row="${esc(code)}" data-base="${base}" data-basis="${esc(basis)}">`+
      `<td><input type="checkbox" class="form-check-input" data-provider-use aria-label="Use ${esc(code)}"></td>`+
      `<td><b>${esc(code)}</b><small class="d-block text-muted">${esc(p.name||'')}</small></td>`+
      `<td>${base.toFixed(4)}%</td>`+
      `<td><input type="number" class="form-control form-control-sm" min="0" max="100" step="0.0001" data-provider-override disabled placeholder="—"></td>`+
      `<td data-provider-markup>${markup.toFixed(4)}%</td>`+
      `<td><b data-provider-effective>${eff.toFixed(4)}%</b></td>`+
      `<td>${basis==='TURNOVER'?'Turnover':'House Win / GGR'}</td>`+
      `</tr>`;
  }).join(''):'<tr><td colspan="7" class="text-center text-muted py-3">No platform providers configured.</td></tr>';
  bindProviderInputs();
 }

 async function loadPlatformProviders(){
  const out=$('merchantProviderPricingBody');
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
    renderProviderRows(platformProviders);
  }catch(e){
    if(out) out.innerHTML=`<tr><td colspan="7" class="text-center text-danger py-3">${esc(e.message||'Unable to load providers')}</td></tr>`;
  }
 }

 async function saveProviderPricing(id){
  const selected=selectedProviderRows();
  const markup=Number($('merchantMarkup')?.value||0);
  await api('/admin/merchants/'+id+'/provider-pricing',{
    method:'POST',headers:hdr(),
    body:JSON.stringify({
      providerMarkupPercent:markup,
      providers:selected.map(r=>{
        const code=r.dataset.providerRow;
        const p=platformProviders.find(x=>String(x.code||'').toUpperCase()===code)||{};
        return {
          providerCode:code,
          defaultChargePercent:Number(r.querySelector('[data-provider-override]')?.value||0),
          chargeBasis:String(r.dataset.basis||p.settlementCostBasis||'HOUSE_WIN')
        };
      })
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
