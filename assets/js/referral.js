(function(){
  const state={members:[],downline:[],selected:null};
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
  function renderMembers(){
    const rows=state.members.filter(inDateRange);
    const body=document.getElementById('refMemberBody');
    const cards=document.getElementById('refMemberCards');
    updateStats(rows);
    if(!rows.length){
      body.innerHTML='<tr><td colspan="6" class="ref-empty">No member found.</td></tr>';
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
      return `<tr class="${active?'active':''}"><td>${i+1}</td><td>${memberNameHtml(r)}</td><td><b>${ref}</b></td><td>${l1}</td><td>${joined}</td><td><button class="ref-view-btn ref-view-icon" data-view="${id}" data-name="${name}" title="View downline" aria-label="View downline"><i class="bi bi-eye"></i></button></td></tr>`;
    }).join('');
    cards.innerHTML=rows.map((r,i)=>{
      const id=esc(firstVal(r,['id','memberId'],''));
      const name=esc(firstVal(r,['username','mobile','id'],'-'));
      const ref=esc(firstVal(r,['referrerCode','referralCode','code'],'-'));
      const l1=esc(firstVal(r,['level1Count','l1Count','totalDownline','downlineCount'],0));
      const joined=esc(dateOnly(firstVal(r,['createdAt','registerDate','registeredAt','joinedAt'],'')));
      return `<div class="ref-mobile-card"><div class="ref-mobile-card-head"><div>${memberNameHtml(r)}</div><b>#${i+1}</b></div><div class="ref-mobile-grid"><span>Referral Code</span><b>${ref}</b><span>L1</span><b>${l1}</b><span>Joined Date</span><b>${joined}</b></div><button class="ref-view-btn ref-view-mobile" data-view="${id}" data-name="${name}"><i class="bi bi-eye"></i> View Downline</button></div>`;
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
    const rows=type==='downline'?state.downline:state.members.filter(inDateRange);
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

  const refDatePicker={view:new Date(),selectingStart:true};
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
    else el.textContent = label === 'custom' ? 'Custom date range' : 'Select date range';
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
    const monthSel=document.getElementById('refCalMonth');
    const yearSel=document.getElementById('refCalYear');
    const days=document.getElementById('refCalDays');
    if(!monthSel||!yearSel||!days)return;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if(!monthSel.options.length) months.forEach((m,i)=>monthSel.add(new Option(m,i)));
    if(!yearSel.options.length){
      const y=new Date().getFullYear();
      for(let i=y-5;i<=y+5;i++) yearSel.add(new Option(i,i));
    }
    monthSel.value=refDatePicker.view.getMonth();
    yearSel.value=refDatePicker.view.getFullYear();
    const y=refDatePicker.view.getFullYear(), m=refDatePicker.view.getMonth();
    const first=new Date(y,m,1), last=new Date(y,m+1,0);
    const start=first.getDay();
    const total=last.getDate();
    const from=document.getElementById('refDateFrom')?.value||'';
    const to=document.getElementById('refDateTo')?.value||'';
    let html='';
    const prevLast=new Date(y,m,0).getDate();
    for(let i=0;i<start;i++) html+=`<button type="button" class="muted" disabled>${prevLast-start+i+1}</button>`;
    for(let d=1;d<=total;d++){
      const val=ymd(new Date(y,m,d));
      const inRange=from&&to&&val>=from&&val<=to;
      const isEdge=val===from||val===to;
      html+=`<button type="button" data-cal-day="${val}" class="${inRange?'in-range':''} ${isEdge?'selected':''}">${d}</button>`;
    }
    const cells=start+total;
    for(let i=1;i<=42-cells;i++) html+=`<button type="button" class="muted" disabled>${i}</button>`;
    days.innerHTML=html;
  }
  function initDatePicker(){
    const trigger=document.getElementById('refDateTrigger');
    const picker=document.getElementById('refRangePicker');
    if(!trigger||!picker)return;
    renderCalendar(); updateDateLabel();
    trigger.addEventListener('click',e=>{e.stopPropagation(); picker.classList.toggle('show'); renderCalendar();});
    document.addEventListener('click',e=>{if(!e.target.closest('.ref-range-wrap'))picker.classList.remove('show');});
    document.querySelectorAll('[data-range-preset]').forEach(btn=>btn.addEventListener('click',()=>{
      const key=btn.dataset.rangePreset;
      if(key==='custom'){
        document.getElementById('refDateFrom').value='';
        document.getElementById('refDateTo').value='';
        refDatePicker.selectingStart=true;
        markPreset('custom');
        updateDateLabel('custom');
        renderCalendar();
        renderMembers();
        return;
      }
      const [a,b]=presetRange(key);
      refDatePicker.view=new Date(a+'T00:00:00');
      setDateRange(a,b,key);
    }));
    document.getElementById('refCalPrev')?.addEventListener('click',()=>{refDatePicker.view.setMonth(refDatePicker.view.getMonth()-1); renderCalendar();});
    document.getElementById('refCalNext')?.addEventListener('click',()=>{refDatePicker.view.setMonth(refDatePicker.view.getMonth()+1); renderCalendar();});
    document.getElementById('refCalMonth')?.addEventListener('change',e=>{refDatePicker.view.setMonth(Number(e.target.value)); renderCalendar();});
    document.getElementById('refCalYear')?.addEventListener('change',e=>{refDatePicker.view.setFullYear(Number(e.target.value)); renderCalendar();});
    document.getElementById('refCalDays')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-cal-day]'); if(!btn)return;
      const f=document.getElementById('refDateFrom'); const t=document.getElementById('refDateTo');
      const val=btn.dataset.calDay;
      if(!f.value || (f.value&&t.value) || val<f.value){f.value=val; t.value=''; refDatePicker.selectingStart=false; markPreset('custom');}
      else {t.value=val; refDatePicker.selectingStart=true; markPreset('custom');}
      updateDateLabel('custom'); renderCalendar(); renderMembers();
    });
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-view]'); if(b)loadDownline(b.dataset.view,b.dataset.name);
    const ex=e.target.closest('[data-export]'); if(ex)exportCsv(ex.dataset.export);
  });
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('refSearch')?.addEventListener('click',loadMembers);
    document.getElementById('refReset')?.addEventListener('click',resetFilters);
    initDatePicker();
    document.getElementById('refKeyword')?.addEventListener('keydown',e=>{if(e.key==='Enter')loadMembers();});
    document.getElementById('refLevel')?.addEventListener('change',()=>{if(state.selected)loadDownline(state.selected.id,state.selected.name);});
    loadMembers();
  });
})();
