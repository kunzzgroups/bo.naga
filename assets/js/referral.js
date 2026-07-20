(function(){
  const state={members:[],downline:[],selected:null,rewardMember:null,defaultReward:{enabled:0,mode:'FIXED',value:0}};
  function endpoint(k){return API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
  function money(v){return num(v).toFixed(2);}
  function dt(v){return window.BO_FORMAT?.dateTime?window.BO_FORMAT.dateTime(v):(v?String(v).replace('T',' ').slice(0,19):'-');}
  function dateOnly(v){const s=dt(v);return s==='-'?'-':s;}
  function initials(r){const s=String(r.username||r.fullName||r.mobile||'U').trim();return esc(s.slice(0,2).toUpperCase());}
  function firstVal(obj,keys,fb){for(const k of keys){if(obj&&obj[k]!=null&&obj[k]!=='' )return obj[k];}return fb;}
  async function api(url,opt){
    const res=await fetch(url,opt||{headers:{...BO_AUTH.authHeader()}});
    const json=await res.json().catch(()=>({}));
    if(!res.ok||json.status==='error')throw new Error(json.message||'Request failed');
    return json;
  }
  function getRows(json){return (json&&json.data&&Array.isArray(json.data.content))?json.data.content:(Array.isArray(json.data)?json.data:[]);}
  function inDateRange(r){
    const from=document.getElementById('refDateFrom')?.value;
    const to=document.getElementById('refDateTo')?.value;
    if(!from&&!to) return true;
    const d=firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],null);
    if(!d) return true;
    const ds=String(d).slice(0,10);
    if(from && ds<from) return false;
    if(to && ds>to) return false;
    return true;
  }
  function updateStats(rows){
    const now=new Date(); const ym=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    let downline=0, commission=0, newMonth=0;
    rows.forEach(r=>{
      downline+=num(firstVal(r,['totalDownline','downlineCount','level1Count','l1Count'],0));
      commission+=num(firstVal(r,['totalCommission','commission'],0));
      const d=firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],null);
      if(d && String(d).slice(0,7)===ym) newMonth++;
    });
    document.getElementById('refTotalMembers').textContent=rows.length;
    document.getElementById('refTotalDownline').textContent=downline;
    document.getElementById('refTotalCommission').textContent=money(commission);
    document.getElementById('refNewThisMonth').textContent=newMonth;
    document.getElementById('refMemberCount').textContent=rows.length+' Members';
    document.getElementById('refMemberShowing').textContent=rows.length?`Showing 1 to ${rows.length} of ${rows.length} entries`:'Showing 0 to 0 of 0 entries';
  }
  function memberNameHtml(r){
    const username=esc(firstVal(r,['username','mobile','id'],'-'));
    const full=esc(firstVal(r,['fullName','name'],''));
    const mobile=esc(firstVal(r,['mobile','phone'],''));
    const meta=[full,mobile].filter(Boolean).join(' • ');
    return `<div class="ref-member-cell"><span class="ref-avatar">${initials(r)}</span><div class="ref-member-name"><b>${username}</b>${meta?`<small>${meta}</small>`:''}</div></div>`;
  }
  function rewardSettingHtml(r){
    const enabled=Number(firstVal(r,['rewardEnabled'],0))===1;
    const mode=String(firstVal(r,['rewardMode'],'FIXED')).toUpperCase();
    const value=num(firstVal(r,['rewardValue'],0));
    const source=String(firstVal(r,['rewardConfigSource'],'DEFAULT')).toUpperCase();
    const label=!enabled?'Disabled':(mode==='PERCENTAGE'?`${value}% of Default`:`MYR ${money(value)} Fixed`);
    return `<div class="ref-reward-setting"><b>${esc(label)}</b><small class="${source==='MEMBER'?'personal':'default'}">${source==='MEMBER'?'Personal':'Default'}</small></div>`;
  }
  function hasReferral(r){
    return num(firstVal(r,['level1Count','l1Count','totalDownline','downlineCount'],0)) > 0;
  }
  function visibleMembers(){
    return state.members.filter(r=>hasReferral(r) && inDateRange(r));
  }
  function renderMembers(){
    const rows=visibleMembers();
    const body=document.getElementById('refMemberBody');
    const cards=document.getElementById('refMemberCards');
    updateStats(rows);
    if(!rows.length){
      body.innerHTML='<tr><td colspan="7" class="ref-empty">No member found.</td></tr>';
      cards.innerHTML='<div class="ref-mobile-card"><h3>No member found</h3><div class="meta">Try another search filter.</div></div>';
      return;
    }
    body.innerHTML=rows.map((r,i)=>{
      const id=esc(firstVal(r,['id','memberId'],''));
      const name=esc(firstVal(r,['username','mobile','id'],'-'));
      const ref=esc(firstVal(r,['referrerCode','referralCode','code'],'-'));
      const l1=esc(firstVal(r,['level1Count','l1Count','totalDownline','downlineCount'],0));
      const joined=esc(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      const active=state.selected && String(state.selected.id)===String(firstVal(r,['id','memberId'],''));
      return `<tr class="${active?'active':''}"><td>${i+1}</td><td>${memberNameHtml(r)}</td><td><b>${ref}</b></td><td>${l1}</td><td>${rewardSettingHtml(r)}</td><td>${joined}</td><td><div class="ref-action-buttons"><button class="ref-view-btn ref-view-icon" data-view="${id}" data-name="${name}" title="View downline" aria-label="View downline"><i class="bi bi-eye"></i></button><button class="ref-config-btn" data-reward-member="${id}" data-name="${name}" title="Configure reward" aria-label="Configure reward"><i class="bi bi-gear"></i></button></div></td></tr>`;
    }).join('');
    cards.innerHTML=rows.map((r,i)=>{
      const id=esc(firstVal(r,['id','memberId'],''));
      const name=esc(firstVal(r,['username','mobile','id'],'-'));
      const ref=esc(firstVal(r,['referrerCode','referralCode','code'],'-'));
      const l1=esc(firstVal(r,['level1Count','l1Count','totalDownline','downlineCount'],0));
      const joined=esc(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      return `<div class="ref-mobile-card"><div class="ref-mobile-card-head"><div>${memberNameHtml(r)}</div><b>#${i+1}</b></div><div class="ref-mobile-grid"><span>Referral Code</span><b>${ref}</b><span>L1</span><b>${l1}</b><span>Reward Setting</span><b>${rewardSettingHtml(r)}</b><span>Joined Date</span><b>${joined}</b></div><div class="ref-mobile-actions"><button class="ref-view-btn ref-view-mobile" data-view="${id}" data-name="${name}"><i class="bi bi-eye"></i> View Downline</button><button class="ref-config-btn ref-config-mobile" data-reward-member="${id}" data-name="${name}"><i class="bi bi-gear"></i> Reward</button></div></div>`;
    }).join('');
  }
  function renderDownline(rows){
    const body=document.getElementById('refDownlineBody');
    const cards=document.getElementById('refDownlineCards');
    const totalCommission=rows.reduce((s,r)=>s+num(firstVal(r,['commission','totalCommission'],0)),0);
    document.getElementById('refSelectedDownline').textContent=rows.length;
    document.getElementById('refSelectedCommission').textContent=money(totalCommission);
    document.getElementById('refDownlineShowing').textContent=rows.length?`Showing 1 to ${rows.length} of ${rows.length} entries`:'Showing 0 to 0 of 0 entries';
    if(!rows.length){
      body.innerHTML='<tr><td colspan="5" class="ref-empty">No downline found.</td></tr>';
      cards.innerHTML='<div class="ref-mobile-card"><h3>No downline found</h3><div class="meta">This member has no downline for selected level.</div></div>';
      return;
    }
    body.innerHTML=rows.map((r,i)=>{
      const ref=esc(firstVal(r,['referrerCode','referralCode','code'],'-'));
      const joined=esc(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      const comm=money(firstVal(r,['commission','totalCommission'],0));
      return `<tr><td>${i+1}</td><td>${memberNameHtml(r)}</td><td>${ref}</td><td>${joined}</td><td class="ref-commission">${comm}</td></tr>`;
    }).join('');
    cards.innerHTML=rows.map((r,i)=>{
      const ref=esc(firstVal(r,['referrerCode','referralCode','code'],'-'));
      const joined=esc(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      const comm=money(firstVal(r,['commission','totalCommission'],0));
      return `<div class="ref-mobile-card"><div class="ref-mobile-card-head"><div>${memberNameHtml(r)}</div><b>#${i+1}</b></div><div class="ref-mobile-grid"><span>Referral Code</span><b>${ref}</b><span>Joined Date</span><b>${joined}</b><span>Commission</span><b class="ref-commission">${comm}</b></div></div>`;
    }).join('');
  }
  async function loadMembers(){
    const body=document.getElementById('refMemberBody');
    body.innerHTML='<tr><td colspan="6" class="ref-loading">Loading...</td></tr>';
    document.getElementById('refMemberCards').innerHTML='<div class="ref-mobile-card"><h3>Loading...</h3></div>';
    const kw=document.getElementById('refKeyword').value.trim();
    const url=endpoint('REFERRAL_LIST')+(kw?'?keyword='+encodeURIComponent(kw):'');
    try{
      const json=await api(url);
      state.members=getRows(json);
      renderMembers();
    }catch(e){
      body.innerHTML='<tr><td colspan="6" class="text-danger">'+esc(e.message)+'</td></tr>';
    }
  }
  async function loadDownline(id,name){
    state.selected={id,name};
    renderMembers();
    const body=document.getElementById('refDownlineBody');
    const level=document.getElementById('refLevel').value||1;
    document.getElementById('refDownlineTitle').textContent='Downline of '+name;
    document.getElementById('refSelectedMeta').textContent='Level '+level;
    body.innerHTML='<tr><td colspan="5" class="ref-loading">Loading...</td></tr>';
    document.getElementById('refDownlineCards').innerHTML='<div class="ref-mobile-card"><h3>Loading...</h3></div>';
    try{
      const json=await api(endpoint('REFERRAL_DOWNLINE')+'?memberId='+encodeURIComponent(id)+'&level='+encodeURIComponent(level));
      state.downline=getRows(json);
      renderDownline(state.downline);
    }catch(e){
      body.innerHTML='<tr><td colspan="5" class="text-danger">'+esc(e.message)+'</td></tr>';
    }
  }
  function resetFilters(){
    document.getElementById('refKeyword').value='';
    document.getElementById('refLevel').value='1';
    document.getElementById('refDateFrom').value='';
    document.getElementById('refDateTo').value='';
    updateDateLabel(); markPreset(''); renderCalendar();
    state.selected=null; state.downline=[];
    document.getElementById('refDownlineTitle').textContent='Downline';
    document.getElementById('refSelectedMeta').textContent='Select member';
    document.getElementById('refSelectedDownline').textContent='0';
    document.getElementById('refSelectedCommission').textContent='0.00';
    document.getElementById('refDownlineBody').innerHTML='<tr><td colspan="5">Select member to view downline members.</td></tr>';
    document.getElementById('refDownlineCards').innerHTML='';
    document.getElementById('refDownlineShowing').textContent='Showing 0 to 0 of 0 entries';
    loadMembers();
  }
  function exportCsv(type){
    const rows=type==='downline'?state.downline:visibleMembers();
    const headers=type==='downline'?['No','Username','Full Name','Mobile','Referral Code','Joined Date','Commission']:['No','Username','Full Name','Mobile','Referral Code','L1','Joined Date'];
    const lines=[headers];
    rows.forEach((r,i)=>{
      const base=[i+1, firstVal(r,['username'],'-'), firstVal(r,['fullName','name'],''), firstVal(r,['mobile','phone'],''), firstVal(r,['referrerCode','referralCode','code'],'-')];
      if(type==='downline') base.push(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')), money(firstVal(r,['commission','totalCommission'],0)));
      else base.push(firstVal(r,['level1Count','l1Count','totalDownline','downlineCount'],0), dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      lines.push(base);
    });
    const csv=lines.map(row=>row.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=(type==='downline'?'referral-downline':'referral-members')+'.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  }

  const refDatePicker={view:new Date(),selectingStart:true,mode:'days',yearPageStart:new Date().getFullYear()-5};
  function pad2(n){return String(n).padStart(2,'0');}
  function ymd(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
  function dmy(v){if(!v)return ''; const a=String(v).split('-'); return a.length===3?`${a[2]}/${a[1]}/${a[0]}`:v;}
  function startOfWeek(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-x.getDay()); return x;}
  function endOfWeek(d){const x=startOfWeek(d); x.setDate(x.getDate()+6); return x;}
  function setDateRange(from,to,label){
    const f=document.getElementById('refDateFrom');
    const t=document.getElementById('refDateTo');
    if(f)f.value=from||''; if(t)t.value=to||'';
    updateDateLabel(label);
    markPreset(label);
    renderCalendar();
    renderMembers();
  }
  function updateDateLabel(label){
    const f=document.getElementById('refDateFrom')?.value||'';
    const t=document.getElementById('refDateTo')?.value||'';
    const el=document.getElementById('refDateLabel');
    if(!el)return;
    if(f && t) el.textContent = `${dmy(f)} - ${dmy(t)}`;
    else if(f) el.textContent = `${dmy(f)} - Select end date`;
    else el.textContent = 'Select date range';
  }
  function markPreset(name){
    document.querySelectorAll('[data-range-preset]').forEach(b=>b.classList.remove('active'));
    if(name){
      const b=document.querySelector(`[data-range-preset="${name}"]`);
      if(b)b.classList.add('active');
    }
  }
  function presetRange(key){
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    let a=new Date(today), b=new Date(today);
    if(key==='yesterday'){a.setDate(a.getDate()-1); b=new Date(a);}
    if(key==='thisWeek'){a=startOfWeek(today); b=endOfWeek(today);}
    if(key==='lastWeek'){a=startOfWeek(today); a.setDate(a.getDate()-7); b=new Date(a); b.setDate(b.getDate()+6);}
    if(key==='thisMonth'){a=new Date(today.getFullYear(),today.getMonth(),1); b=new Date(today.getFullYear(),today.getMonth()+1,0);}
    if(key==='lastMonth'){a=new Date(today.getFullYear(),today.getMonth()-1,1); b=new Date(today.getFullYear(),today.getMonth(),0);}
    if(key==='thisYear'){a=new Date(today.getFullYear(),0,1); b=new Date(today.getFullYear(),11,31);}
    if(key==='lastYear'){a=new Date(today.getFullYear()-1,0,1); b=new Date(today.getFullYear()-1,11,31);}
    return [ymd(a),ymd(b)];
  }
  function renderCalendar(){
    const monthBtn=document.getElementById('refCalMonth');
    const yearBtn=document.getElementById('refCalYear');
    const monthGrid=document.getElementById('refCalMonthGrid');
    const yearGrid=document.getElementById('refCalYearGrid');
    const dayView=document.getElementById('refCalDayView');
    const days=document.getElementById('refCalDays');
    if(!monthBtn||!yearBtn||!monthGrid||!yearGrid||!dayView||!days)return;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthBtn.innerHTML=months[refDatePicker.view.getMonth()]+' <i class="bi bi-chevron-down"></i>';
    yearBtn.innerHTML=refDatePicker.view.getFullYear()+' <i class="bi bi-chevron-down"></i>';
    monthGrid.innerHTML=months.map((m,i)=>`<button type="button" data-ref-month="${i}" class="${i===refDatePicker.view.getMonth()?'active':''}">${m}</button>`).join('');
    yearGrid.innerHTML=Array.from({length:12},(_,i)=>refDatePicker.yearPageStart+i).map(y=>`<button type="button" data-ref-year="${y}" class="${y===refDatePicker.view.getFullYear()?'active':''}">${y}</button>`).join('');
    monthGrid.classList.toggle('show',refDatePicker.mode==='months');
    yearGrid.classList.toggle('show',refDatePicker.mode==='years');
    dayView.classList.toggle('hide',refDatePicker.mode!=='days');
    const y=refDatePicker.view.getFullYear(),m=refDatePicker.view.getMonth();
    const first=new Date(y,m,1),last=new Date(y,m+1,0),start=first.getDay(),total=last.getDate();
    const from=document.getElementById('refDateFrom')?.value||'',to=document.getElementById('refDateTo')?.value||'';
    let html='',prevLast=new Date(y,m,0).getDate();
    for(let i=0;i<start;i++)html+=`<button type="button" class="muted" disabled>${prevLast-start+i+1}</button>`;
    for(let d=1;d<=total;d++){const val=ymd(new Date(y,m,d)),inRange=from&&to&&val>=from&&val<=to,isEdge=val===from||val===to;html+=`<button type="button" data-cal-day="${val}" class="${inRange?'in-range':''} ${isEdge?'selected':''}">${d}</button>`;}
    const cells=start+total;for(let i=1;i<=42-cells;i++)html+=`<button type="button" class="muted" disabled>${i}</button>`;
    days.innerHTML=html;
  }
  function initDatePicker(){
    const trigger=document.getElementById('refDateTrigger');
    const picker=document.getElementById('refRangePicker');
    if(!trigger||!picker)return;
    renderCalendar(); updateDateLabel();
    trigger.addEventListener('click',e=>{e.stopPropagation(); picker.classList.toggle('show'); refDatePicker.mode='days'; renderCalendar();});
    document.addEventListener('click',e=>{if(!e.target.closest('.ref-range-wrap'))picker.classList.remove('show');});
    document.querySelectorAll('[data-range-preset]').forEach(btn=>btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const key=btn.dataset.rangePreset;
      const [a,b]=presetRange(key);
      refDatePicker.view=new Date(a+'T00:00:00');
      setDateRange(a,b,key);
      picker.classList.remove('show');
    }));
    document.getElementById('refCalPrev')?.addEventListener('click',(e)=>{e.stopPropagation(); if(refDatePicker.mode==='years')refDatePicker.yearPageStart-=12; else refDatePicker.view.setMonth(refDatePicker.view.getMonth()-1); renderCalendar();});
    document.getElementById('refCalNext')?.addEventListener('click',(e)=>{e.stopPropagation(); if(refDatePicker.mode==='years')refDatePicker.yearPageStart+=12; else refDatePicker.view.setMonth(refDatePicker.view.getMonth()+1); renderCalendar();});
    document.getElementById('refCalMonth')?.addEventListener('click',e=>{e.stopPropagation();refDatePicker.mode=refDatePicker.mode==='months'?'days':'months';renderCalendar();});
    document.getElementById('refCalYear')?.addEventListener('click',e=>{e.stopPropagation();refDatePicker.yearPageStart=refDatePicker.view.getFullYear()-5;refDatePicker.mode=refDatePicker.mode==='years'?'days':'years';renderCalendar();});
    document.getElementById('refCalMonthGrid')?.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-ref-month]');if(!b)return;refDatePicker.view.setMonth(Number(b.dataset.refMonth));refDatePicker.mode='days';renderCalendar();});
    document.getElementById('refCalYearGrid')?.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-ref-year]');if(!b)return;refDatePicker.view.setFullYear(Number(b.dataset.refYear));refDatePicker.mode='months';renderCalendar();});
    document.getElementById('refCalDays')?.addEventListener('click',e=>{
      e.stopPropagation();
      const btn=e.target.closest('[data-cal-day]'); if(!btn)return;
      const f=document.getElementById('refDateFrom'); const t=document.getElementById('refDateTo');
      const val=btn.dataset.calDay;
      if(!f.value || (f.value&&t.value) || val<f.value){
        f.value=val;
        t.value='';
        refDatePicker.selectingStart=false;
        markPreset('');
        updateDateLabel();
        renderCalendar();
        renderMembers();
        picker.classList.add('show');
        return;
      }
      t.value=val;
      refDatePicker.selectingStart=true;
      markPreset('');
      updateDateLabel();
      renderCalendar();
      renderMembers();
      picker.classList.remove('show');
    });
  }

  function memberRewardLabel(){
    const mode=document.getElementById('refMemberRewardMode')?.value;
    const label=document.getElementById('refMemberRewardValueLabel');
    if(label) label.textContent=mode==='PERCENTAGE'?'Percentage of Default Registration Reward (%)':'Fixed Reward Amount';
  }
  function renderEffectiveReward(enabled,mode,value,source){
    const effective=!Number(enabled)?'Disabled':(mode==='PERCENTAGE'?`${Number(value||0)}% of the default registration reward`:`MYR ${money(value)} fixed per referral`);
    const note=document.getElementById('refEffectiveRewardNote');
    if(note) note.innerHTML=`Current effective reward: <b>${esc(effective)}</b> <span>${source==='MEMBER'?'Personal setting':'Default setting'}</span>`;
  }
  function applyDefaultRewardToMemberForm(){
    const d=state.defaultReward||{enabled:0,mode:'FIXED',value:0};
    const enabled=document.getElementById('refMemberRewardEnabled');
    const mode=document.getElementById('refMemberRewardMode');
    const value=document.getElementById('refMemberRewardValue');
    if(enabled) enabled.value=String(Number(d.enabled||0));
    if(mode) mode.value=d.mode||'FIXED';
    if(value) value.value=Number(d.value||0);
    memberRewardLabel();
    renderEffectiveReward(d.enabled,d.mode,d.value,'DEFAULT');
  }
  function toggleMemberConfigFields(){
    const useDefault=document.getElementById('refMemberUseDefault')?.checked!==false;
    document.getElementById('refMemberConfigFields')?.classList.toggle('disabled',useDefault);
    document.querySelectorAll('#refMemberConfigFields input,#refMemberConfigFields select').forEach(el=>el.disabled=useDefault);
    if(useDefault) applyDefaultRewardToMemberForm();
  }
  function closeMemberReward(){
    const modal=document.getElementById('refMemberRewardModal');
    if(modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}
    state.rewardMember=null;
  }
  async function openMemberReward(id,name){
    const modal=document.getElementById('refMemberRewardModal');
    state.rewardMember={id,name};
    document.getElementById('refMemberRewardMeta').textContent=`${name} • Member ID ${id}`;
    modal?.classList.add('show'); modal?.setAttribute('aria-hidden','false');
    try{
      const j=await api(endpoint('REFERRAL_MEMBER_CONFIG')+'?memberId='+encodeURIComponent(id));
      const d=j.data||{};
      const usesDefault=Boolean(d.usesDefault);
      document.getElementById('refMemberUseDefault').checked=usesDefault;
      if(usesDefault){
        // The member must mirror the currently loaded global configuration exactly.
        applyDefaultRewardToMemberForm();
      }else{
        document.getElementById('refMemberRewardEnabled').value=String(Number(d.enabled??d.effectiveEnabled??1));
        document.getElementById('refMemberRewardMode').value=d.mode||d.effectiveMode||'FIXED';
        document.getElementById('refMemberRewardValue').value=Number(d.value??d.effectiveValue??0);
        memberRewardLabel();
        renderEffectiveReward(d.effectiveEnabled,d.effectiveMode,d.effectiveValue,'MEMBER');
      }
      toggleMemberConfigFields();
    }catch(e){alert(e.message);closeMemberReward();}
  }
  async function saveMemberReward(){
    if(!state.rewardMember)return;
    const btn=document.getElementById('refMemberRewardSave');
    try{
      btn.disabled=true;
      const useDefault=document.getElementById('refMemberUseDefault').checked;
      let j;
      if(useDefault){
        // Persist the current global form first so the API and this modal cannot
        // disagree about the effective default status/value.
        const globalBody={
          enabled:Number(document.getElementById('refRewardEnabled').value),
          mode:document.getElementById('refRewardMode').value,
          value:Number(document.getElementById('refRewardValue').value||0)
        };
        await api(endpoint('REFERRAL_CONFIG'),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(globalBody)});
        state.defaultReward={...globalBody};
        j=await api(endpoint('REFERRAL_MEMBER_CONFIG')+'?memberId='+encodeURIComponent(state.rewardMember.id),{method:'DELETE',headers:{...BO_AUTH.authHeader()}});
      }else{
        const body={memberId:Number(state.rewardMember.id),enabled:Number(document.getElementById('refMemberRewardEnabled').value),mode:document.getElementById('refMemberRewardMode').value,value:Number(document.getElementById('refMemberRewardValue').value||0)};
        j=await api(endpoint('REFERRAL_MEMBER_CONFIG'),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(body)});
      }
      const d=j.data||{};const extra=Number(d.creditedCount||0)>0?`\nCredited ${d.creditedCount} missing referral reward(s), total MYR ${money(d.creditedAmount)}.`:'';alert((j.message||'Member reward setting saved')+extra);closeMemberReward();await loadMembers();
    }catch(e){alert(e.message);}finally{btn.disabled=false;}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-view]'); if(b)loadDownline(b.dataset.view,b.dataset.name);
    const rc=e.target.closest('[data-reward-member]'); if(rc)openMemberReward(rc.dataset.rewardMember,rc.dataset.name);
    const ex=e.target.closest('[data-export]'); if(ex)exportCsv(ex.dataset.export);
  });

  async function loadRewardConfig(){try{const j=await api(endpoint('REFERRAL_CONFIG'));const d=j.data||{};state.defaultReward={enabled:Number(d.enabled||0),mode:d.mode||'FIXED',value:Number(d.value||0)};document.getElementById('refRewardEnabled').value=String(state.defaultReward.enabled);document.getElementById('refRewardMode').value=state.defaultReward.mode;document.getElementById('refRewardValue').value=state.defaultReward.value;updateRewardLabel();if(document.getElementById('refMemberUseDefault')?.checked)applyDefaultRewardToMemberForm();}catch(e){console.warn(e);}}
  function updateRewardLabel(){const mode=document.getElementById('refRewardMode')?.value;const l=document.getElementById('refRewardValueLabel');if(l)l.textContent=mode==='PERCENTAGE'?'Percentage of Default Registration Reward (%)':'Fixed Reward Amount';}
  async function saveRewardConfig(){const b=document.getElementById('refRewardSave');try{b.disabled=true;const body={enabled:Number(document.getElementById('refRewardEnabled').value),mode:document.getElementById('refRewardMode').value,value:Number(document.getElementById('refRewardValue').value||0)};const j=await api(endpoint('REFERRAL_CONFIG'),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(body)});state.defaultReward={...body};const d=j.data||{};const extra=Number(d.creditedCount||0)>0?`\nCredited ${d.creditedCount} missing referral reward(s), total MYR ${money(d.creditedAmount)}.`:'';alert((j.message||'Saved')+extra);await loadRewardConfig();await loadMembers();}catch(e){alert(e.message);}finally{b.disabled=false;}}

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('refSearch')?.addEventListener('click',loadMembers);
    document.getElementById('refReset')?.addEventListener('click',resetFilters);
    initDatePicker();
    document.getElementById('refKeyword')?.addEventListener('keydown',e=>{if(e.key==='Enter')loadMembers();});
    document.getElementById('refLevel')?.addEventListener('change',()=>{if(state.selected)loadDownline(state.selected.id,state.selected.name);});
    document.getElementById('refRewardMode')?.addEventListener('change',updateRewardLabel);
    document.getElementById('refRewardSave')?.addEventListener('click',saveRewardConfig);
    document.getElementById('refMemberUseDefault')?.addEventListener('change',toggleMemberConfigFields);
    document.getElementById('refMemberRewardMode')?.addEventListener('change',memberRewardLabel);
    document.getElementById('refMemberRewardSave')?.addEventListener('click',saveMemberReward);
    document.querySelectorAll('[data-close-member-reward]').forEach(el=>el.addEventListener('click',closeMemberReward));
    loadRewardConfig();
    loadMembers();
  });
})();
