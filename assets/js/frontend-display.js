(function(){
  const select=document.getElementById('homeBonusEnabled');
  const saveBtn=document.getElementById('saveFrontendDisplay');
  const minDeposit=document.getElementById('minDepositAmount');
  const minWithdrawal=document.getElementById('minWithdrawalAmount');
  const rebateThreshold=document.getElementById('rebateAutoCreditThreshold');
  const marqueeEnabled=document.getElementById('marqueeEnabled');
  const leaderboardEnabled=document.getElementById('leaderboardEnabled');
  const liveTransactionEnabled=document.getElementById('liveTransactionEnabled');
  const liveTransactionMode=document.getElementById('liveTransactionMode');
  const liveTransactionIntervalSeconds=document.getElementById('liveTransactionIntervalSeconds');
  const liveTransactionRefreshRow=document.getElementById('liveTransactionRefreshRow');
  const liveTransactionRandomSecondsRow=document.getElementById('liveTransactionRandomSecondsRow');
  const liveTransactionRandomRowsRow=document.getElementById('liveTransactionRandomRowsRow');
  const liveTransactionRandomPriceRow=document.getElementById('liveTransactionRandomPriceRow');
  const liveTransactionRandomMinSeconds=document.getElementById('liveTransactionRandomMinSeconds');
  const liveTransactionRandomMaxSeconds=document.getElementById('liveTransactionRandomMaxSeconds');
  const liveTransactionRandomMinRows=document.getElementById('liveTransactionRandomMinRows');
  const liveTransactionRandomMaxRows=document.getElementById('liveTransactionRandomMaxRows');
  const liveTransactionRandomMinPrice=document.getElementById('liveTransactionRandomMinPrice');
  const liveTransactionRandomMaxPrice=document.getElementById('liveTransactionRandomMaxPrice');
  const brandTarget=document.getElementById('frontendDisplayBrandTarget');
  const brandTargetRow=document.getElementById('frontendDisplayBrandRow');
  let selectedTargetBrandId=Number(localStorage.getItem('bo_active_brand_id')||1)||1;
  const marqueeEditor=document.getElementById('marqueeEditor');
  const marqueeContent=document.getElementById('marqueeContent');
  const marqueePreview=document.getElementById('marqueePreview');
  const marqueeColor=document.getElementById('marqueeColor');
  const installAppDisplayName=document.getElementById('installAppDisplayName');
  const installAppLogoFile=document.getElementById('installAppLogoFile');
  const installAppLogoPreview=document.getElementById('installAppLogoPreview');
  const chooseInstallAppLogo=document.getElementById('chooseInstallAppLogo');
  const removeInstallAppLogo=document.getElementById('removeInstallAppLogo');
  const installEndpoint=String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+(API_CONFIG.ENDPOINTS.INSTALL_APP_SETTING||'/admin/frontend/install-app');
  let selectedInstallLogo=null;
  let removeExistingInstallLogo=false;
  let currentInstallLogoUrl='';
  let previewObjectUrl='';
  const message=document.getElementById('frontendDisplayMessage');
  const note=document.getElementById('displaySettingNote');
  const endpoint=String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+API_CONFIG.ENDPOINTS.FRONTEND_DISPLAY_SETTING;

  function headers(json){
    const h={...(json?{'Content-Type':'application/json'}:{}),...(window.BO_AUTH?BO_AUTH.authHeader():{})};
    if(selectedTargetBrandId) h['X-Brand-Id']=String(selectedTargetBrandId);
    h['Cache-Control']='no-cache, no-store';
    h['Pragma']='no-cache';
    return h;
  }

  async function loadBrandTarget(){
    if(!window.BO_BRAND||typeof BO_BRAND.context!=='function') return;
    try{
      const j=await BO_BRAND.context(true);
      const d=j&&j.data?j.data:{};
      const brands=Array.isArray(d.brands)?d.brands:[];
      selectedTargetBrandId=Number(localStorage.getItem('bo_active_brand_id')||d.activeBrandId||d.adminBrandId||1)||1;
      if(d.master&&brandTarget&&brands.length){
        brandTarget.innerHTML=brands.filter(b=>Number(b.status)!==0).map(b=>`<option value="${Number(b.id)}">${String(b.name||b.code||('Brand '+b.id)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</option>`).join('');
        if(!brands.some(b=>Number(b.id)===selectedTargetBrandId)) selectedTargetBrandId=Number(d.activeBrandId||brands[0].id||1)||1;
        brandTarget.value=String(selectedTargetBrandId);
        if(brandTargetRow) brandTargetRow.style.display='';
      }else if(brandTargetRow){
        brandTargetRow.style.display='none';
      }
    }catch(e){console.warn('Unable to resolve frontend display brand target:',e&&e.message);}
  }

  function assertTarget(json){
    const id=Number(json&&json.data&&json.data.id);
    if(selectedTargetBrandId&&id&&id!==selectedTargetBrandId){
      throw new Error(`Brand context mismatch: requested brand ${selectedTargetBrandId}, API returned brand ${id}. Please refresh and try again.`);
    }
  }

  function setMessage(text,type){
    message.textContent=text||'';
    message.className='upload-status mt-2 '+(type||'');
  }

  function renderInstallLogo(url,temporary){
    if(previewObjectUrl && previewObjectUrl!==url){try{URL.revokeObjectURL(previewObjectUrl)}catch(_){}}
    previewObjectUrl=temporary?String(url||''):'';
    if(!temporary) currentInstallLogoUrl=String(url||'');
    const shown=String(url||'');
    if(!installAppLogoPreview) return;
    installAppLogoPreview.innerHTML=shown
      ?`<img src="${shown.replace(/"/g,'&quot;')}" alt="Install app logo">`
      :'<span>No logo</span>';
  }

  function readImageSize(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{const size={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);resolve(size)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Unable to read logo image'))};
      img.src=url;
    });
  }

  async function loadInstallSetting(){
    const response=await fetch(installEndpoint+(installEndpoint.includes('?')?'&':'?')+'_cfg='+Date.now(),{headers:headers(false),cache:'no-store'});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to load Add to Home Screen setting');
    const data=json.data||{};
    if(installAppDisplayName) installAppDisplayName.value=data.displayName||'TitanX Gaming';
    renderInstallLogo(data.logoUrl||'');
  }

  async function saveInstallSetting(){
    const name=String(installAppDisplayName?.value||'').trim();
    if(!name) throw new Error('Add to Home Screen display name is required');
    const fd=new FormData();
    fd.append('displayName',name);
    fd.append('removeLogo',removeExistingInstallLogo?'1':'0');
    if(selectedInstallLogo) fd.append('logo',selectedInstallLogo);
    const response=await fetch(installEndpoint,{method:'POST',headers:headers(false),body:fd});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save Add to Home Screen setting');
    selectedInstallLogo=null;removeExistingInstallLogo=false;
    if(installAppLogoFile) installAppLogoFile.value='';
    renderInstallLogo(json.data?.logoUrl||'');
    return json.data||{};
  }

  function normalizeEnabled(value){
    if(value===false || value===0) return '0';
    const text=String(value??'').trim().toLowerCase();
    if(['0','false','disabled','disable','off','no'].includes(text)) return '0';
    return '1';
  }

  function syncSelect(value){
    select.value=normalizeEnabled(value);
    // reports.js replaces native selects with a rounded visual button.
    // Dispatching change keeps that visible label synchronized with the real value.
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function syncMarquee(){
    if(!marqueeEditor) return;
    marqueeContent.value=marqueeEditor.innerHTML.trim();
    if(marqueePreview) marqueePreview.innerHTML=marqueeContent.value || 'Marquee preview';
  }

  function syncSelectValue(el,value){
    if(!el) return;
    el.value=normalizeEnabled(value);
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }


  function renderLiveTransactionMode(){
    const random=liveTransactionMode?.value==='FAKE';
    liveTransactionRefreshRow?.classList.toggle('is-hidden',random);
    liveTransactionRefreshRow?.style.setProperty('display',random?'none':'');
    liveTransactionRandomSecondsRow?.classList.toggle('is-hidden',!random);
    liveTransactionRandomRowsRow?.classList.toggle('is-hidden',!random);
    liveTransactionRandomPriceRow?.classList.toggle('is-hidden',!random);
  }

  function renderNote(){
    const on=select.value==='1';
    note.textContent=on
      ?'Bonus display is enabled. The homepage bonus and promotion column will be shown.'
      :'Bonus display is disabled. The homepage bonus and promotion column will be hidden.';
    note.classList.toggle('off',!on);
  }

  async function load(){
    setMessage('Loading...');
    const response=await fetch(endpoint+(endpoint.includes('?')?'&':'?')+'_cfg='+Date.now(),{headers:headers(false),cache:'no-store'});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to load setting');
    assertTarget(json);
    const data=json.data||{};
    syncSelect(data.homeBonusEnabled);
    minDeposit.value=Number(data.minDepositAmount||10).toFixed(2);
    minWithdrawal.value=Number(data.minWithdrawalAmount||50).toFixed(2);
    if(rebateThreshold) rebateThreshold.value=Number(data.rebateAutoCreditThreshold||0).toFixed(2);
    if(marqueeEnabled){ syncSelectValue(marqueeEnabled,data.marqueeEnabled); }
    if(leaderboardEnabled){ syncSelectValue(leaderboardEnabled,data.leaderboardEnabled); }
    if(liveTransactionEnabled){ syncSelectValue(liveTransactionEnabled,data.liveTransactionEnabled); }
    if(liveTransactionMode){ liveTransactionMode.value=String(data.liveTransactionMode||'REAL').toUpperCase()==='FAKE'?'FAKE':'REAL'; liveTransactionMode.dispatchEvent(new Event('change',{bubbles:true})); }
    if(liveTransactionIntervalSeconds){ liveTransactionIntervalSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionIntervalSeconds||5)))); }
    if(liveTransactionRandomMinSeconds) liveTransactionRandomMinSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionRandomMinSeconds||3))));
    if(liveTransactionRandomMaxSeconds) liveTransactionRandomMaxSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionRandomMaxSeconds||8))));
    if(liveTransactionRandomMinRows) liveTransactionRandomMinRows.value=String(Math.max(1,Math.min(20,Number(data.liveTransactionRandomMinRows||1))));
    if(liveTransactionRandomMaxRows) liveTransactionRandomMaxRows.value=String(Math.max(1,Math.min(20,Number(data.liveTransactionRandomMaxRows||4))));
    if(liveTransactionRandomMinPrice) liveTransactionRandomMinPrice.value=Number(data.liveTransactionRandomMinPrice??10).toFixed(2);
    if(liveTransactionRandomMaxPrice) liveTransactionRandomMaxPrice.value=Number(data.liveTransactionRandomMaxPrice??5000).toFixed(2);
    renderLiveTransactionMode();
    if(marqueeEditor){ marqueeEditor.innerHTML=data.marqueeContent||''; syncMarquee(); }
    renderNote();
    await loadInstallSetting();
    setMessage('');
  }

  async function save(){
    const old=saveBtn.innerHTML;
    saveBtn.disabled=true;
    saveBtn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Saving...';
    setMessage('');
    try{
      const requestedValue=select.value==='0'?0:1;
      const depositValue=Number(minDeposit.value);
      const withdrawalValue=Number(minWithdrawal.value);
      const rebateThresholdValue=Number(rebateThreshold?.value||0);
      syncMarquee();
      const marqueeEnabledValue=marqueeEnabled?.value==='1'?1:0;
      const leaderboardEnabledValue=leaderboardEnabled?.value==='1'?1:0;
      const liveTransactionEnabledValue=liveTransactionEnabled?.value==='1'?1:0;
      const liveTransactionModeValue=liveTransactionMode?.value==='FAKE'?'FAKE':'REAL';
      const liveTransactionIntervalValue=Number(liveTransactionIntervalSeconds?.value||5);
      const liveTransactionRandomMinSecondsValue=Number(liveTransactionRandomMinSeconds?.value||3);
      const liveTransactionRandomMaxSecondsValue=Number(liveTransactionRandomMaxSeconds?.value||8);
      const liveTransactionRandomMinRowsValue=Number(liveTransactionRandomMinRows?.value||1);
      const liveTransactionRandomMaxRowsValue=Number(liveTransactionRandomMaxRows?.value||4);
      const liveTransactionRandomMinPriceValue=Number(liveTransactionRandomMinPrice?.value||10);
      const liveTransactionRandomMaxPriceValue=Number(liveTransactionRandomMaxPrice?.value||5000);
      const marqueeHtml=marqueeContent?.value?.trim()||'';
      if(!String(installAppDisplayName?.value||'').trim()) throw new Error('Add to Home Screen display name is required');
      if(!Number.isFinite(depositValue)||depositValue<=0) throw new Error('Minimum deposit must be greater than 0');
      if(!Number.isFinite(withdrawalValue)||withdrawalValue<=0) throw new Error('Minimum withdrawal must be greater than 0');
      if(!Number.isFinite(rebateThresholdValue)||rebateThresholdValue<0) throw new Error('Rebate auto credit threshold cannot be negative');
      if(!Number.isFinite(liveTransactionIntervalValue)||liveTransactionIntervalValue<2||liveTransactionIntervalValue>60) throw new Error('Live Transaction refresh must be between 2 and 60 seconds');
      if(!Number.isFinite(liveTransactionRandomMinSecondsValue)||liveTransactionRandomMinSecondsValue<2||liveTransactionRandomMinSecondsValue>60) throw new Error('Random Demo minimum interval must be between 2 and 60 seconds');
      if(!Number.isFinite(liveTransactionRandomMaxSecondsValue)||liveTransactionRandomMaxSecondsValue<2||liveTransactionRandomMaxSecondsValue>60) throw new Error('Random Demo maximum interval must be between 2 and 60 seconds');
      if(liveTransactionRandomMaxSecondsValue<liveTransactionRandomMinSecondsValue) throw new Error('Random Demo maximum interval cannot be lower than the minimum interval');
      if(!Number.isFinite(liveTransactionRandomMinRowsValue)||liveTransactionRandomMinRowsValue<1||liveTransactionRandomMinRowsValue>20) throw new Error('Random Demo minimum transaction count must be between 1 and 20');
      if(!Number.isFinite(liveTransactionRandomMaxRowsValue)||liveTransactionRandomMaxRowsValue<1||liveTransactionRandomMaxRowsValue>20) throw new Error('Random Demo maximum transaction count must be between 1 and 20');
      if(liveTransactionRandomMaxRowsValue<liveTransactionRandomMinRowsValue) throw new Error('Random Demo maximum transaction count cannot be lower than the minimum count');
      if(!Number.isFinite(liveTransactionRandomMinPriceValue)||liveTransactionRandomMinPriceValue<0.01||liveTransactionRandomMinPriceValue>1000000) throw new Error('Random Demo minimum price must be between 0.01 and 1,000,000');
      if(!Number.isFinite(liveTransactionRandomMaxPriceValue)||liveTransactionRandomMaxPriceValue<0.01||liveTransactionRandomMaxPriceValue>1000000) throw new Error('Random Demo maximum price must be between 0.01 and 1,000,000');
      if(liveTransactionRandomMaxPriceValue<liveTransactionRandomMinPriceValue) throw new Error('Random Demo maximum price cannot be lower than the minimum price');
      if(marqueeEnabledValue===1 && !marqueeEditor?.innerText?.trim()) throw new Error('Please enter marquee text before enabling it');
      const response=await fetch(endpoint,{
        method:'POST',
        headers:headers(true),
        cache:'no-store',
        body:JSON.stringify({homeBonusEnabled:requestedValue,minDepositAmount:depositValue,minWithdrawalAmount:withdrawalValue,rebateAutoCreditThreshold:rebateThresholdValue,marqueeEnabled:marqueeEnabledValue,leaderboardEnabled:leaderboardEnabledValue,liveTransactionEnabled:liveTransactionEnabledValue,liveTransactionMode:liveTransactionModeValue,liveTransactionIntervalSeconds:liveTransactionIntervalValue,liveTransactionRandomMinSeconds:liveTransactionRandomMinSecondsValue,liveTransactionRandomMaxSeconds:liveTransactionRandomMaxSecondsValue,liveTransactionRandomMinRows:liveTransactionRandomMinRowsValue,liveTransactionRandomMaxRows:liveTransactionRandomMaxRowsValue,liveTransactionRandomMinPrice:liveTransactionRandomMinPriceValue,liveTransactionRandomMaxPrice:liveTransactionRandomMaxPriceValue,marqueeContent:marqueeHtml})
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save setting');
      assertTarget(json);
      const verifyResponse=await fetch(endpoint+(endpoint.includes('?')?'&':'?')+'_verify='+Date.now(),{headers:headers(false),cache:'no-store'});
      const verifyJson=await verifyResponse.json().catch(()=>({}));
      if(!verifyResponse.ok||verifyJson.status==='error') throw new Error(verifyJson.message||'Unable to verify saved setting');
      assertTarget(verifyJson);
      const verifyEnabled=Number(verifyJson.data&&verifyJson.data.liveTransactionEnabled);
      if(verifyEnabled!==liveTransactionEnabledValue) throw new Error('Live Transaction setting did not persist for the selected brand');
      const savedValue=json.data&&Object.prototype.hasOwnProperty.call(json.data,'homeBonusEnabled')
        ?json.data.homeBonusEnabled
        :requestedValue;
      syncSelect(savedValue);
      if(json.data){ minDeposit.value=Number(json.data.minDepositAmount||depositValue).toFixed(2); minWithdrawal.value=Number(json.data.minWithdrawalAmount||withdrawalValue).toFixed(2); if(rebateThreshold) rebateThreshold.value=Number(json.data.rebateAutoCreditThreshold??rebateThresholdValue).toFixed(2); if(marqueeEnabled) syncSelectValue(marqueeEnabled,json.data.marqueeEnabled); if(leaderboardEnabled) syncSelectValue(leaderboardEnabled,json.data.leaderboardEnabled); if(liveTransactionEnabled) syncSelectValue(liveTransactionEnabled,json.data.liveTransactionEnabled); if(liveTransactionMode){liveTransactionMode.value=String(json.data.liveTransactionMode||liveTransactionModeValue).toUpperCase()==='FAKE'?'FAKE':'REAL';liveTransactionMode.dispatchEvent(new Event('change',{bubbles:true}));} if(liveTransactionIntervalSeconds) liveTransactionIntervalSeconds.value=String(json.data.liveTransactionIntervalSeconds||liveTransactionIntervalValue); if(liveTransactionRandomMinSeconds) liveTransactionRandomMinSeconds.value=String(json.data.liveTransactionRandomMinSeconds||liveTransactionRandomMinSecondsValue); if(liveTransactionRandomMaxSeconds) liveTransactionRandomMaxSeconds.value=String(json.data.liveTransactionRandomMaxSeconds||liveTransactionRandomMaxSecondsValue); if(liveTransactionRandomMinRows) liveTransactionRandomMinRows.value=String(json.data.liveTransactionRandomMinRows||liveTransactionRandomMinRowsValue); if(liveTransactionRandomMaxRows) liveTransactionRandomMaxRows.value=String(json.data.liveTransactionRandomMaxRows||liveTransactionRandomMaxRowsValue); if(liveTransactionRandomMinPrice) liveTransactionRandomMinPrice.value=Number(json.data.liveTransactionRandomMinPrice??liveTransactionRandomMinPriceValue).toFixed(2); if(liveTransactionRandomMaxPrice) liveTransactionRandomMaxPrice.value=Number(json.data.liveTransactionRandomMaxPrice??liveTransactionRandomMaxPriceValue).toFixed(2); renderLiveTransactionMode(); if(marqueeEditor){marqueeEditor.innerHTML=json.data.marqueeContent||marqueeHtml;syncMarquee();} }
      await saveInstallSetting();
      renderNote();
      setMessage('Frontend display setting and Add to Home Screen settings saved successfully.','success');
    }catch(error){
      setMessage(error.message,'error');
    }finally{
      saveBtn.disabled=false;
      saveBtn.innerHTML=old;
    }
  }

  select.addEventListener('change',renderNote);
  liveTransactionMode?.addEventListener('change',renderLiveTransactionMode);
  if(marqueeEditor){
    marqueeEditor.addEventListener('input',syncMarquee);
    document.querySelectorAll('[data-marquee-cmd]').forEach(btn=>btn.addEventListener('click',()=>{
      marqueeEditor.focus(); document.execCommand(btn.dataset.marqueeCmd,false,null); syncMarquee();
    }));
    marqueeColor?.addEventListener('input',()=>{marqueeEditor.focus();document.execCommand('foreColor',false,marqueeColor.value);syncMarquee();});
  }
  chooseInstallAppLogo?.addEventListener('click',()=>installAppLogoFile?.click());
  installAppLogoFile?.addEventListener('change',async e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file) return;
    try{
      if(file.type!=='image/png') throw new Error('Install app logo must be a PNG image');
      const size=await readImageSize(file);
      if(size.width!==512||size.height!==512) throw new Error('Install app logo must be exactly 512×512 px');
      selectedInstallLogo=file;removeExistingInstallLogo=false;
      renderInstallLogo(URL.createObjectURL(file),true);
      setMessage('Logo ready. Click Save Setting to publish it.','success');
    }catch(err){e.target.value='';selectedInstallLogo=null;renderInstallLogo(currentInstallLogoUrl);setMessage(err.message,'error')}
  });
  removeInstallAppLogo?.addEventListener('click',()=>{selectedInstallLogo=null;removeExistingInstallLogo=true;if(installAppLogoFile)installAppLogoFile.value='';renderInstallLogo('');setMessage('Logo will be removed when you click Save Setting.','success')});

  if(brandTarget){brandTarget.addEventListener('change',()=>{selectedTargetBrandId=Number(brandTarget.value)||1;localStorage.setItem('bo_active_brand_id',String(selectedTargetBrandId));if(window.BO_BRAND&&BO_BRAND.invalidate)BO_BRAND.invalidate();load().catch(error=>setMessage(error.message,'error'));});}
  saveBtn.addEventListener('click',save);
  (async()=>{await loadBrandTarget();await load();})().catch(error=>setMessage(error.message,'error'));
})();
