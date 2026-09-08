(function(){
 'use strict';
 const $=id=>document.getElementById(id), status=$('merchantCreateStatus');
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j.data;}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()});

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
   BO_BRAND?.invalidate?.();
   setStatus('Merchant created successfully.', 'success');
   setTimeout(()=>location.href='main-merchant-detail.html',350);
  }catch(x){
   setStatus(x.message, 'error');
  }
 });
})();
