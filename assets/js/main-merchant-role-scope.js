(function(){
 'use strict';
 const p=new URLSearchParams(location.search);
 const requested=p.get('merchantId');
 if(requested && Number(requested)>0){
  try{ localStorage.setItem('bo_active_brand_id', String(Number(requested))); }catch(e){}
 }
 function activeMerchant(){
  return String(requested || localStorage.getItem('bo_active_brand_id') || '');
 }
 function syncAddRoleLink(){
  const a=document.querySelector('.mp-add-role-btn');
  if(!a) return;
  const id=activeMerchant();
  a.href=id
   ?('main-merchant-role-create.html?merchantId='+encodeURIComponent(id))
   :'main-merchant-role-create.html';
 }
 async function ensureMerchantScope(){
  if(activeMerchant()){
   syncAddRoleLink();
   return activeMerchant();
  }
  try{
   const r=await fetch(API_CONFIG.BASE_URL+'/admin/merchants',{
    headers:BO_AUTH.authHeader(),
    cache:'no-store'
   });
   const j=await r.json().catch(()=>({}));
   if(!r.ok || j.status==='error') return '';
   const rows=Array.isArray(j.data)?j.data:[];
   const first=rows.find(b=>Number(b.id)>0);
   if(!first) return '';
   try{ localStorage.setItem('bo_active_brand_id', String(Number(first.id))); }catch(e){}
  }catch(e){}
  syncAddRoleLink();
  return activeMerchant();
 }
 window.MERCHANT_ROLE_SCOPE_READY=ensureMerchantScope();
})();
