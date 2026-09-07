(function(){
 'use strict'; const $=id=>document.getElementById(id), status=$('merchantCreateStatus');
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j.data;}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()});
 $('merchantBrandForm')?.addEventListener('submit',async e=>{e.preventDefault();try{status.textContent='Creating merchant...';status.className='upload-status mb-3';const username=$('merchantMasterUsername').value.trim(),password=$('merchantMasterPassword').value; if(username&&password.length<8)throw new Error('Merchant Master password must be at least 8 characters');
 const body={code:$('merchantCode').value.trim(),name:$('merchantName').value.trim(),primaryDomain:$('merchantDomain').value.trim(),domainAliases:$('merchantAliases').value.trim(),frontendRoot:$('merchantRoot').value.trim(),currency:$('merchantCurrency').value.trim()||'MYR',creditMode:$('merchantCreditMode').value,lowCreditThreshold:$('merchantThreshold').value||0,providerMarkupPercent:$('merchantMarkup').value||0,status:Number($('merchantStatus').value)};
 const out=await api('/admin/merchants/save',{method:'POST',headers:hdr(),body:JSON.stringify(body)});const b=out.brand||out;if(username){await api('/admin/merchants/'+b.id+'/master-account',{method:'POST',headers:hdr(),body:JSON.stringify({displayName:$('merchantMasterName').value.trim()||username,username,password,status:1})});}
 BO_BRAND?.invalidate?.(); status.textContent='Merchant created successfully.';status.className='upload-status mb-3 success';setTimeout(()=>location.href='main-merchant-detail.html',350);
 }catch(x){status.textContent=x.message;status.className='upload-status mb-3 error';}});
})();
