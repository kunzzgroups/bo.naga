(function(){
  const select=document.getElementById('homeBonusEnabled');
  const saveBtn=document.getElementById('saveFrontendDisplay');
  const minDeposit=document.getElementById('minDepositAmount');
  const minWithdrawal=document.getElementById('minWithdrawalAmount');
  const rebateThreshold=document.getElementById('rebateAutoCreditThreshold');
  const marqueeEnabled=document.getElementById('marqueeEnabled');
  const marqueeEditor=document.getElementById('marqueeEditor');
  const marqueeContent=document.getElementById('marqueeContent');
  const marqueePreview=document.getElementById('marqueePreview');
  const marqueeColor=document.getElementById('marqueeColor');
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
    if(marqueeEditor){ marqueeEditor.innerHTML=data.marqueeContent||''; syncMarquee(); }
    renderNote();
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
      const marqueeHtml=marqueeContent?.value?.trim()||'';
      if(!Number.isFinite(depositValue)||depositValue<=0) throw new Error('Minimum deposit must be greater than 0');
      if(!Number.isFinite(withdrawalValue)||withdrawalValue<=0) throw new Error('Minimum withdrawal must be greater than 0');
      if(!Number.isFinite(rebateThresholdValue)||rebateThresholdValue<0) throw new Error('Rebate auto credit threshold cannot be negative');
      if(marqueeEnabledValue===1 && !marqueeEditor?.innerText?.trim()) throw new Error('Please enter marquee text before enabling it');
      const response=await fetch(endpoint,{
        method:'POST',
        headers:headers(true),
        body:JSON.stringify({homeBonusEnabled:requestedValue,minDepositAmount:depositValue,minWithdrawalAmount:withdrawalValue,rebateAutoCreditThreshold:rebateThresholdValue,marqueeEnabled:marqueeEnabledValue,marqueeContent:marqueeHtml})
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save setting');
      const savedValue=json.data&&Object.prototype.hasOwnProperty.call(json.data,'homeBonusEnabled')
        ?json.data.homeBonusEnabled
        :requestedValue;
      syncSelect(savedValue);
      if(json.data){ minDeposit.value=Number(json.data.minDepositAmount||depositValue).toFixed(2); minWithdrawal.value=Number(json.data.minWithdrawalAmount||withdrawalValue).toFixed(2); if(rebateThreshold) rebateThreshold.value=Number(json.data.rebateAutoCreditThreshold??rebateThresholdValue).toFixed(2); if(marqueeEnabled) syncSelectValue(marqueeEnabled,json.data.marqueeEnabled); if(marqueeEditor){marqueeEditor.innerHTML=json.data.marqueeContent||marqueeHtml;syncMarquee();} }
      renderNote();
      setMessage('Frontend display setting saved successfully.','success');
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
  saveBtn.addEventListener('click',save);
  load().catch(error=>setMessage(error.message,'error'));
})();
