(function(){
  const select=document.getElementById('homeBonusEnabled');
  const saveBtn=document.getElementById('saveFrontendDisplay');
  const minDeposit=document.getElementById('minDepositAmount');
  const minWithdrawal=document.getElementById('minWithdrawalAmount');
  const rebateThreshold=document.getElementById('rebateAutoCreditThreshold');
  const marqueeEnabled=document.getElementById('marqueeEnabled');
  const leaderboardEnabled=document.getElementById('leaderboardEnabled');
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
    return {...(json?{'Content-Type':'application/json'}:{}),...(window.BO_AUTH?BO_AUTH.authHeader():{})};
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
    const response=await fetch(installEndpoint,{headers:headers(false)});
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

  function renderNote(){
    const on=select.value==='1';
    note.textContent=on
      ?'Bonus display is enabled. The homepage bonus and promotion column will be shown.'
      :'Bonus display is disabled. The homepage bonus and promotion column will be hidden.';
    note.classList.toggle('off',!on);
  }

  async function load(){
    setMessage('Loading...');
    const response=await fetch(endpoint,{headers:headers(false)});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to load setting');
    const data=json.data||{};
    syncSelect(data.homeBonusEnabled);
    minDeposit.value=Number(data.minDepositAmount||10).toFixed(2);
    minWithdrawal.value=Number(data.minWithdrawalAmount||50).toFixed(2);
    if(rebateThreshold) rebateThreshold.value=Number(data.rebateAutoCreditThreshold||0).toFixed(2);
    if(marqueeEnabled){ syncSelectValue(marqueeEnabled,data.marqueeEnabled); }
    if(leaderboardEnabled){ syncSelectValue(leaderboardEnabled,data.leaderboardEnabled); }
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
      const marqueeHtml=marqueeContent?.value?.trim()||'';
      if(!String(installAppDisplayName?.value||'').trim()) throw new Error('Add to Home Screen display name is required');
      if(!Number.isFinite(depositValue)||depositValue<=0) throw new Error('Minimum deposit must be greater than 0');
      if(!Number.isFinite(withdrawalValue)||withdrawalValue<=0) throw new Error('Minimum withdrawal must be greater than 0');
      if(!Number.isFinite(rebateThresholdValue)||rebateThresholdValue<0) throw new Error('Rebate auto credit threshold cannot be negative');
      if(marqueeEnabledValue===1 && !marqueeEditor?.innerText?.trim()) throw new Error('Please enter marquee text before enabling it');
      const response=await fetch(endpoint,{
        method:'POST',
        headers:headers(true),
        body:JSON.stringify({homeBonusEnabled:requestedValue,minDepositAmount:depositValue,minWithdrawalAmount:withdrawalValue,rebateAutoCreditThreshold:rebateThresholdValue,marqueeEnabled:marqueeEnabledValue,leaderboardEnabled:leaderboardEnabledValue,marqueeContent:marqueeHtml})
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save setting');
      const savedValue=json.data&&Object.prototype.hasOwnProperty.call(json.data,'homeBonusEnabled')
        ?json.data.homeBonusEnabled
        :requestedValue;
      syncSelect(savedValue);
      if(json.data){ minDeposit.value=Number(json.data.minDepositAmount||depositValue).toFixed(2); minWithdrawal.value=Number(json.data.minWithdrawalAmount||withdrawalValue).toFixed(2); if(rebateThreshold) rebateThreshold.value=Number(json.data.rebateAutoCreditThreshold??rebateThresholdValue).toFixed(2); if(marqueeEnabled) syncSelectValue(marqueeEnabled,json.data.marqueeEnabled); if(leaderboardEnabled) syncSelectValue(leaderboardEnabled,json.data.leaderboardEnabled); if(marqueeEditor){marqueeEditor.innerHTML=json.data.marqueeContent||marqueeHtml;syncMarquee();} }
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

  saveBtn.addEventListener('click',save);
  load().catch(error=>setMessage(error.message,'error'));
})();
