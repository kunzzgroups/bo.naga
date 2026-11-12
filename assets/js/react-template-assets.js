(function () {
  'use strict';
  const root=document.getElementById('reactTemplateAssets');
  if (!root || root.dataset.loaded==='1') return;
  root.dataset.loaded='1';
  const fields=Array.from(root.querySelectorAll('[data-react-asset]'));
  const save=root.querySelector('#reactAssetsSave');
  const status=root.querySelector('#reactAssetsStatus');
  const config=window.API_CONFIG||{};
  const url=(config.BASE_URL||'/api')+(config.ENDPOINTS&&config.ENDPOINTS.CUSTOMIZE_SECTION||'/customize/section');
  let original={}, loadedBrandId=0;
  function activeBrand() {
    const user=window.BO_AUTH&&BO_AUTH.user?BO_AUTH.user():{};
    const role=String(user.roleType||'').toUpperCase();
    const main=user.rootAdmin===true||Number(user.rootAdmin)===1||user.masterAdmin===true||Number(user.masterAdmin)===1||['ROOT','MASTER','MAIN'].includes(role);
    const scoped=Number(user.brandId||user.adminBrandId||0);
    const selected=Number(window.BO_BRAND&&BO_BRAND.activeId?BO_BRAND.activeId():localStorage.getItem('bo_active_brand_id')||1);
    return !main&&scoped>0?scoped:selected;
  }
  function headers() {return Object.assign({},window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{},{'X-Brand-Id':String(activeBrand())});}
  function writeStatus(message,error){status.textContent=message;status.style.color=error?'#e56b6b':'';}
  function getValue(data,key){return key.split('.').reduce((a,k)=>a&&typeof a==='object'?a[k]:undefined,data)||'';}
  function setValue(data,key,val){const parts=key.split('.');let at=data;for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!at[k]||typeof at[k]!=='object')at[k]={};at=at[k];}at[parts.at(-1)]=val;}
  async function load(){
    const brand=activeBrand();loadedBrandId=0;save.disabled=true;writeStatus('Loading merchant assets…');
    try {
      const result=await fetch(url+'?key=react-template-assets',{headers:headers(),cache:'no-store'});
      const json=await result.json();
      if(!result.ok||json.status!=='success')throw Error(json.message||'Asset load failed');
      const content=json.data&&json.data.html;
      const data=content?JSON.parse(content):{};
      if(brand!==activeBrand())throw Error('Merchant changed while loading. Reload the page.');
      original=data&&typeof data==='object'&&!Array.isArray(data)?data:{};
      fields.forEach(input=>{input.value=String(getValue(original,input.dataset.reactAsset));});
      previewFields.forEach(updatePreview);
      loadedBrandId=brand;save.disabled=false;writeStatus('Loaded for Merchant '+brand);
    }catch(e){writeStatus(e.message||'Loading failed',true);}
  }
  save.addEventListener('click',async()=>{
    if(!loadedBrandId||loadedBrandId!==activeBrand()){writeStatus('Merchant changed. Reload before saving.',true);return;}
    const data=JSON.parse(JSON.stringify(original));
    for(const input of fields){const value=input.value.trim();if((input.dataset.reactAsset.includes('Url')||/\.(video|image|instagram)$/.test(input.dataset.reactAsset))&&value&&!/^https:\/\/\S+|^\/(?!\/)[^\\]*$/.test(value)){writeStatus('Enter HTTPS or a safe local URL for '+input.dataset.reactAsset,true);return;}setValue(data,input.dataset.reactAsset,value);}
    save.disabled=true;writeStatus('Saving…');
    try{
      const params=new URLSearchParams({key:'react-template-assets',html:JSON.stringify(data)});
      const result=await fetch(url,{method:'POST',headers:Object.assign(headers(),{'Content-Type':'application/x-www-form-urlencoded'}),body:params});
      const json=await result.json();
      if(!result.ok||json.status!=='success')throw Error(json.message||'Save failed');
      if(loadedBrandId!==activeBrand())throw Error('Merchant changed while saving; reload.');
      original=data;writeStatus('Saved for Merchant '+loadedBrandId);
    }catch(e){writeStatus(e.message||'Save failed',true);}finally{save.disabled=false;}
  });
  // Preview-only UI; never changes persistence or selected Merchant.
  const previewFields=fields.filter(input=>input.closest('[data-react-kind="image"]'));
  function updatePreview(input){
    const wrapper=input.closest('.react-assets-item');
    const preview=wrapper&&wrapper.querySelector('.react-assets-preview');
    if(!preview)return;
    const img=preview.querySelector('img');
    const empty=preview.querySelector('.react-assets-empty');
    const value=input.value.trim();
    img.hidden=true;img.removeAttribute('src');empty.hidden=false;
    empty.textContent=value?'Loading preview…':'No image configured';
    if(!/^https:\/\/[^\s]+$/i.test(value)&&!/^\/(?!\/)[^\\]*$/.test(value)){
      if(value)empty.textContent='Enter an HTTPS image URL';
      return;
    }
    img.onload=()=>{if(input.value.trim()!==value)return;img.hidden=false;empty.hidden=true;};
    img.onerror=()=>{if(input.value.trim()===value)empty.textContent='Image preview unavailable';};
    img.src=value;
  }
  previewFields.forEach(input=>{
    input.addEventListener('input',()=>updatePreview(input));
    const clear=input.closest('.react-assets-item').querySelector('[data-react-clear]');
    if(clear)clear.addEventListener('click',()=>{input.value='';updatePreview(input);input.focus();});
  });
  void load();
})();
