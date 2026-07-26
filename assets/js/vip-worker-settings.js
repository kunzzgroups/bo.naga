(function(){
  const $=s=>document.querySelector(s);
  const endpoint=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];
  const headers=()=>Object.assign({'Content-Type':'application/json'},window.BO_AUTH?BO_AUTH.authHeader():{});
  const set=(id,v)=>{const e=$(id);if(e&&v!==null&&v!==undefined)e.value=String(v===true?1:v===false?0:v)};
  const fmt=x=>x?new Date(x).toLocaleString():'Never';
  async function load(){
    const r=await fetch(endpoint('VIP_WORKER_SETTINGS'),{headers:headers()}),j=await r.json();
    if(!r.ok||j.status==='error')throw new Error(j.message||'Unable to load worker settings.');
    const d=j.data||{};
    set('#workerAutomatic',d.automaticEnabled);set('#workerZone',d.timeZone);set('#workerDailyEnabled',d.dailyEnabled);set('#workerDailyTime',d.dailyTime);set('#workerBirthdayEnabled',d.birthdayEnabled);set('#workerWeeklyEnabled',d.weeklyEnabled);set('#workerWeeklyDay',d.weeklyDay);set('#workerWeeklyTime',d.weeklyTime);set('#workerMonthlyEnabled',d.monthlyEnabled);set('#workerMonthlyDay',d.monthlyDay);set('#workerMonthlyTime',d.monthlyTime);
    $('#workerStatus').innerHTML=`Daily: <b>${d.lastDailyStatus||'Not run'}</b> (${fmt(d.lastDailyRun)}) ${d.lastDailyMessage||''}<br>Weekly: <b>${d.lastWeeklyStatus||'Not run'}</b> (${fmt(d.lastWeeklyRun)}) ${d.lastWeeklyMessage||''}<br>Monthly: <b>${d.lastMonthlyStatus||'Not run'}</b> (${fmt(d.lastMonthlyRun)}) ${d.lastMonthlyMessage||''}`;
  }
  async function save(){
    const val=id=>$(id).value;
    const body={automaticEnabled:val('#workerAutomatic')==='1',timeZone:val('#workerZone').trim(),dailyEnabled:val('#workerDailyEnabled')==='1',dailyTime:val('#workerDailyTime'),birthdayEnabled:val('#workerBirthdayEnabled')==='1',weeklyEnabled:val('#workerWeeklyEnabled')==='1',weeklyDay:Number(val('#workerWeeklyDay')),weeklyTime:val('#workerWeeklyTime'),monthlyEnabled:val('#workerMonthlyEnabled')==='1',monthlyDay:Number(val('#workerMonthlyDay')),monthlyTime:val('#workerMonthlyTime')};
    const r=await fetch(endpoint('VIP_WORKER_SETTINGS'),{method:'POST',headers:headers(),body:JSON.stringify(body)}),j=await r.json();
    if(!r.ok||j.status==='error')throw new Error(j.message||'Unable to save worker settings.');
    alert(j.message||'VIP worker settings saved.'); await load();
  }
  async function run(type,button){
    const label=type.charAt(0)+type.slice(1).toLowerCase();
    const approved=await BO_DIALOG.confirm(`Run the ${label} VIP worker now? Duplicate protection prevents paying the same reward period twice.`,{title:`Run ${label} VIP Worker`,confirmText:'Run Worker',icon:'bi-play-circle'});
    if(!approved)return;
    const status=$('#workerActionStatus'),old=button.innerHTML;button.disabled=true;button.innerHTML='<span class="spinner-border spinner-border-sm"></span> Running...';status.textContent=`Running ${label} worker...`;
    try{
      const r=await fetch(endpoint('VIP_REWARD_RUN'),{method:'POST',headers:headers(),body:JSON.stringify({type})}),j=await r.json();
      if(!r.ok||j.status==='error')throw new Error(j.message||`${label} worker failed.`);
      status.textContent=j.message||`${label} worker completed.`;alert(j.message||`${label} VIP worker completed.`);await load();
    }catch(err){status.textContent=err.message||`${label} worker failed.`;alert(err.message||`${label} worker failed.`);}finally{button.disabled=false;button.innerHTML=old;}
  }
  document.addEventListener('click',e=>{const saveBtn=e.target.closest('#saveWorkerSettings');if(saveBtn){saveBtn.disabled=true;save().catch(err=>alert(err.message)).finally(()=>saveBtn.disabled=false);}const runBtn=e.target.closest('[data-run]');if(runBtn)run(runBtn.dataset.run,runBtn);});
  load().catch(err=>{$('#workerStatus').textContent='Unable to load worker settings.';alert(err.message);});
})();