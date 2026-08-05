(()=>{
  const base=(window.API_BASE_URL||window.API_BASE||'').replace(/\/$/,'');
  const f=document.getElementById('dashFrom');
  const t=document.getElementById('dashTo');
  const pickerState={view:new Date(),selectingStart:true,mode:'days',yearPageStart:new Date().getFullYear()-5};
  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const dmy=v=>{if(!v)return '';const a=String(v).split('-');return a.length===3?`${a[2]}/${a[1]}/${a[0]}`:v};
  const startOfWeek=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-x.getDay());return x};
  const endOfWeek=d=>{const x=startOfWeek(d);x.setDate(x.getDate()+6);return x};
  const today=window.BO_FORMAT?.today?BO_FORMAT.today():ymd(new Date());
  f.value=t.value=today;

  function updateDateLabel(){
    const el=document.getElementById('dashDateLabel');
    if(!el)return;
    el.textContent=f.value&&t.value?`${dmy(f.value)} - ${dmy(t.value)}`:f.value?`${dmy(f.value)} - Select end date`:'Select date range';
  }
  function markPreset(name){
    document.querySelectorAll('[data-dash-range-preset]').forEach(b=>b.classList.remove('active'));
    if(name)document.querySelector(`[data-dash-range-preset="${name}"]`)?.classList.add('active');
  }
  function presetRange(key){
    const now=new Date(),day=new Date(now.getFullYear(),now.getMonth(),now.getDate());let a=new Date(day),b=new Date(day);
    if(key==='yesterday'){a.setDate(a.getDate()-1);b=new Date(a)}
    if(key==='thisWeek'){a=startOfWeek(day);b=endOfWeek(day)}
    if(key==='lastWeek'){a=startOfWeek(day);a.setDate(a.getDate()-7);b=new Date(a);b.setDate(b.getDate()+6)}
    if(key==='thisMonth'){a=new Date(day.getFullYear(),day.getMonth(),1);b=new Date(day.getFullYear(),day.getMonth()+1,0)}
    if(key==='lastMonth'){a=new Date(day.getFullYear(),day.getMonth()-1,1);b=new Date(day.getFullYear(),day.getMonth(),0)}
    if(key==='thisYear'){a=new Date(day.getFullYear(),0,1);b=new Date(day.getFullYear(),11,31)}
    if(key==='lastYear'){a=new Date(day.getFullYear()-1,0,1);b=new Date(day.getFullYear()-1,11,31)}
    return[ymd(a),ymd(b)];
  }
  function renderCalendar(){
    const monthBtn=document.getElementById('dashCalMonth'),yearBtn=document.getElementById('dashCalYear'),monthGrid=document.getElementById('dashCalMonthGrid'),yearGrid=document.getElementById('dashCalYearGrid'),dayView=document.getElementById('dashCalDayView'),days=document.getElementById('dashCalDays');
    if(!monthBtn||!yearBtn||!monthGrid||!yearGrid||!dayView||!days)return;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthBtn.innerHTML=months[pickerState.view.getMonth()]+' <i class="bi bi-chevron-down"></i>';
    yearBtn.innerHTML=pickerState.view.getFullYear()+' <i class="bi bi-chevron-down"></i>';
    monthGrid.innerHTML=months.map((m,i)=>`<button type="button" data-dash-month="${i}" class="${i===pickerState.view.getMonth()?'active':''}">${m}</button>`).join('');
    yearGrid.innerHTML=Array.from({length:12},(_,i)=>pickerState.yearPageStart+i).map(y=>`<button type="button" data-dash-year="${y}" class="${y===pickerState.view.getFullYear()?'active':''}">${y}</button>`).join('');
    monthGrid.classList.toggle('show',pickerState.mode==='months');
    yearGrid.classList.toggle('show',pickerState.mode==='years');
    dayView.classList.toggle('hide',pickerState.mode!=='days');
    const y=pickerState.view.getFullYear(),m=pickerState.view.getMonth(),first=new Date(y,m,1),offset=first.getDay();
    days.innerHTML='';
    for(let i=0;i<42;i++){
      const d=new Date(y,m,i-offset+1),v=ymd(d),btn=document.createElement('button');
      btn.type='button';btn.textContent=d.getDate();
      btn.className=(d.getMonth()!==m?'muted ':'')+(f.value&&t.value&&v>f.value&&v<t.value?'in-range ':'')+((v===f.value||v===t.value)?'selected':'');
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();markPreset('');
        if(pickerState.selectingStart||!f.value||t.value){f.value=v;t.value='';pickerState.selectingStart=false;updateDateLabel();renderCalendar();document.getElementById('dashRangePicker').classList.add('show');return}
        if(v<f.value){t.value=f.value;f.value=v}else t.value=v;
        pickerState.selectingStart=true;updateDateLabel();renderCalendar();setTimeout(()=>document.getElementById('dashRangePicker').classList.remove('show'),120);
        load().catch(e=>document.getElementById('dashboardCards').innerHTML=`<div class="alert alert-danger">${e.message}</div>`);
      });
      days.appendChild(btn);
    }
  }
  function initPicker(){
    const trigger=document.getElementById('dashDateTrigger'),picker=document.getElementById('dashRangePicker');
    updateDateLabel();markPreset('today');renderCalendar();
    trigger.addEventListener('click',e=>{e.stopPropagation();picker.classList.toggle('show');pickerState.mode='days';renderCalendar()});
    document.querySelectorAll('[data-dash-range-preset]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const [a,b]=presetRange(btn.dataset.dashRangePreset);f.value=a;t.value=b;pickerState.view=new Date(a+'T00:00:00');pickerState.selectingStart=true;updateDateLabel();markPreset(btn.dataset.dashRangePreset);renderCalendar();picker.classList.remove('show');load().catch(e=>document.getElementById('dashboardCards').innerHTML=`<div class="alert alert-danger">${e.message}</div>`)}));
    document.getElementById('dashCalPrev').addEventListener('click',e=>{e.stopPropagation();if(pickerState.mode==='years')pickerState.yearPageStart-=12;else pickerState.view.setMonth(pickerState.view.getMonth()-1);renderCalendar()});
    document.getElementById('dashCalNext').addEventListener('click',e=>{e.stopPropagation();if(pickerState.mode==='years')pickerState.yearPageStart+=12;else pickerState.view.setMonth(pickerState.view.getMonth()+1);renderCalendar()});
    document.getElementById('dashCalMonth').addEventListener('click',e=>{e.stopPropagation();pickerState.mode=pickerState.mode==='months'?'days':'months';renderCalendar()});
    document.getElementById('dashCalYear').addEventListener('click',e=>{e.stopPropagation();pickerState.yearPageStart=pickerState.view.getFullYear()-5;pickerState.mode=pickerState.mode==='years'?'days':'years';renderCalendar()});
    document.getElementById('dashCalMonthGrid').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-dash-month]');if(!b)return;pickerState.view.setMonth(Number(b.dataset.dashMonth));pickerState.mode='days';renderCalendar()});
    document.getElementById('dashCalYearGrid').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-dash-year]');if(!b)return;pickerState.view.setFullYear(Number(b.dataset.dashYear));pickerState.mode='months';renderCalendar()});
    document.addEventListener('click',e=>{if(!picker.contains(e.target)&&!trigger.contains(e.target))picker.classList.remove('show')});
  }

  const cards=[['Members','members','bi-people','index.html'],['New Members','newMembers','bi-person-plus','index.html'],['Approved Deposit','depositAmount','bi-wallet2','member-deposit.html'],['Pending Deposit','pendingDepositAmount','bi-hourglass-split','member-deposit.html?status=PENDING'],['Approved Withdrawal','withdrawAmount','bi-cash-stack','member-withdraw.html'],['Pending Withdrawal','pendingWithdrawalAmount','bi-exclamation-circle','member-withdraw.html?status=PENDING'],['Valid Bet','validBet','bi-graph-up-arrow','provider-bet-report.html'],['Bet Amount','betAmount','bi-dice-5','provider-bet-report.html'],['Win Amount','winAmount','bi-trophy','provider-bet-report.html'],['Net Win/Loss','netWinLoss','bi-activity','provider-bet-report.html'],['Bonus','bonusAmount','bi-gift','promotion-report.html'],['Rebate','rebateAmount','bi-percent','daily-rebate-report.html'],['Adjustment','adjustmentAmount','bi-sliders','transaction-report.html?type=ADJUST']];
  function fmt(v,k){return /(Amount|Bet|Win|Loss|Bonus|Rebate|Adjustment)/.test(k)?Number(v||0).toFixed(2):Number(v||0).toLocaleString()}
  async function load(){
    const z=localStorage.getItem('bo_timezone')||'Asia/Kuala_Lumpur';const u=`${base}/api/admin/dashboard/summary?from=${f.value}&to=${t.value}&timezone=${encodeURIComponent(z)}`;
    const r=await fetch(u,{headers:{Authorization:'Bearer '+(localStorage.getItem('admin_token')||localStorage.getItem('token')||'')}}),j=await r.json(),d=j.data||{};
    document.getElementById('dashClock').textContent=`${d.timezone||z} · ${(d.serverTime||'').replace('T',' ').slice(0,19)}`;
    document.getElementById('dashboardCards').innerHTML=cards.map(c=>`<a class="ops-card" href="${c[3]}?from=${f.value}&to=${t.value}${c[3].includes('?')?'&':'&'}"><div class="top"><span>${c[0]}</span><i class="bi ${c[2]}"></i></div><div class="value">${fmt(d[c[1]],c[0])}</div><small>Click to view matching report</small></a>`).join('');
  }
  initPicker();
  load().catch(e=>document.getElementById('dashboardCards').innerHTML=`<div class="alert alert-danger">${e.message}</div>`);
})();
