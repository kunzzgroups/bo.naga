(function(){
  const config=window.API_CONFIG||{};
  const base=config.BASE_URL||'';
  const endpoint=(config.ENDPOINTS&&config.ENDPOINTS.CUSTOMIZE_SOCIAL)||'/customize/social';
  const url=base+endpoint;
  const facebook=document.getElementById('facebookHref');
  const telegram=document.getElementById('telegramHref');
  const saveBtn=document.getElementById('saveSocialBtn');
  const status=document.getElementById('socialStatus');

  function message(text,type){status.textContent=text;status.className='social-status'+(type?' '+type:'');}
  function valid(value){return !value||/^https?:\/\//i.test(value);}
  async function load(){
    try{
      const res=await fetch(url,{headers:{Accept:'application/json'}});
      const json=await res.json().catch(()=>({}));
      if(!res.ok||json.status==='error') throw new Error(json.message||'Unable to load social settings');
      const data=json.data||json||{};
      facebook.value=data.facebookHref||'';
      telegram.value=data.telegramHref||'';
      message('Current social settings loaded.');
    }catch(err){message(err.message||'Unable to load social settings.','error');}
  }
  async function save(){
    const facebookHref=facebook.value.trim();
    const telegramHref=telegram.value.trim();
    if(!valid(facebookHref)||!valid(telegramHref)){message('Each URL must start with http:// or https://.','error');return;}
    saveBtn.disabled=true;saveBtn.innerHTML='<i class="bi bi-arrow-repeat"></i> Saving...';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({facebookHref,telegramHref})});
      const json=await res.json().catch(()=>({}));
      if(!res.ok||json.status==='error') throw new Error(json.message||'Save failed');
      const data=json.data||{};facebook.value=data.facebookHref||'';telegram.value=data.telegramHref||'';
      message('Social settings saved successfully.','success');
      saveBtn.innerHTML='<i class="bi bi-check-circle-fill"></i> Saved';
      setTimeout(()=>{saveBtn.innerHTML='<i class="bi bi-save"></i> Save Setting';},1400);
    }catch(err){message(err.message||'Save failed.','error');saveBtn.innerHTML='<i class="bi bi-save"></i> Save Setting';}
    finally{saveBtn.disabled=false;}
  }
  saveBtn.addEventListener('click',save);load();
})();
