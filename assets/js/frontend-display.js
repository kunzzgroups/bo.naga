(function(){
  const select=document.getElementById('homeBonusEnabled');
  const saveBtn=document.getElementById('saveFrontendDisplay');
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
      const response=await fetch(endpoint,{
        method:'POST',
        headers:headers(true),
        body:JSON.stringify({homeBonusEnabled:requestedValue})
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save setting');
      const savedValue=json.data&&Object.prototype.hasOwnProperty.call(json.data,'homeBonusEnabled')
        ?json.data.homeBonusEnabled
        :requestedValue;
      syncSelect(savedValue);
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
  saveBtn.addEventListener('click',save);
  load().catch(error=>setMessage(error.message,'error'));
})();
