(function(){
'use strict';
const base=window.API_BASE||'';const $=id=>document.getElementById(id);const admin=()=>{const u=window.BO_AUTH&&BO_AUTH.user?BO_AUTH.user():{};return u.username||u.displayName||localStorage.getItem('adminUsername')||localStorage.getItem('admin_username')||'ADMIN';};
const state={rules:[],rulePage:0,batches:[],batchPage:0,auditPage:0,auditLast:0,reconPage:0,reconLast:0,vipLevels:[],gameCategories:[]};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4});
const date=v=>{if(!v)return '-';const d=new Date(v);return isNaN(d)?esc(v):d.toLocaleString('en-GB',{hour12:false});};
async function request(url,opt){opt=opt||{};opt.headers=Object.assign({},window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{}, {'X-Admin-Username':admin(),'Cache-Control':'no-cache, no-store'},opt.headers||{});const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data;}
function showError(e){if(window.BO_DIALOG)BO_DIALOG.alert(e.message||String(e),{title:'Unable to Continue',type:'error'});}
function setModal(id,show){const m=$(id);if(!m)return;m.classList.toggle('show',show);m.setAttribute('aria-hidden',show?'false':'true');document.body.classList.toggle('modal-open',show);}
function statusBadge(v){const active=String(v)==='1'||String(v).toUpperCase()==='ACTIVE'||String(v).toUpperCase()==='COMPLETED'||String(v).toUpperCase()==='MATCHED';return '<span class="standard-status '+(active?'active':'inactive')+'"><i></i>'+esc(String(v==null?'-':v).replaceAll('_',' '))+'</span>';}
function pager(target,page,totalPages,handler){
  const el=$(target);if(!el)return;
  const pages=Math.max(0,Number(totalPages)||0);
  const p=Math.max(0,Math.min(Number(page)||0,Math.max(0,pages-1)));
  const empty=!pages;
  const btn=(label,targetPage,disabled,active,icon)=>'<button type="button" class="page-btn'+(active?' active':'')+'" data-p="'+targetPage+'" '+(disabled?'disabled':'')+' aria-label="'+label+'"'+(active?' aria-current="page"':'')+'>'+(icon?'<i class="bi '+icon+'"></i>':label)+'</button>';
  let h=btn('First',0,p<=0||empty,false,'bi-chevron-bar-left')+btn('Previous',p-1,p<=0||empty,false,'bi-chevron-left');
  if(empty){h+=btn('1',0,true,true);}
  else{const lo=Math.max(0,p-2),hi=Math.min(pages-1,p+2);for(let i=lo;i<=hi;i++)h+=btn(String(i+1),i,false,i===p);}
  h+=btn('Next',p+1,p>=pages-1||empty,false,'bi-chevron-right')+btn('Last',pages-1,p>=pages-1||empty,false,'bi-chevron-bar-right');
  el.innerHTML=h;
  el.onclick=e=>{const b=e.target.closest('[data-p]');if(!b||b.disabled)return;handler(Number(b.dataset.p));};
}
function clientPage(rows,page,size){const total=rows.length,pages=Math.ceil(total/size),safe=pages?Math.min(page,pages-1):0,start=safe*size;return{rows:rows.slice(start,start+size),page:safe,pages,total,start};}
function pageSize(id,fallback){
  const el=$(id);const raw=String(el&&el.value!=null?el.value:(fallback||20)).trim();
  if(/^all$/i.test(raw)) return 10000;
  if(raw===''||raw==='-'||/^auto$/i.test(raw)) return Number(fallback)||20;
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?n:(Number(fallback)||20);
}
function switchTab(name){
  document.querySelectorAll('[data-tab]').forEach(b=>{
    const on=b.dataset.tab===name;
    b.classList.toggle('active',on);
    b.classList.toggle('is-active',on);
    if(on) b.setAttribute('aria-selected','true'); else b.setAttribute('aria-selected','false');
  });
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));
  document.querySelectorAll('[data-actions]').forEach(el=>{
    const on=el.dataset.actions===name;
    el.hidden=!on;
    el.classList.toggle('is-active',on);
  });
  if(name==='batches')loadBatches();
  if(name==='audit')loadAudit();
  if(name==='reconciliation')loadRecon();
}

document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));


function workerStatusText(status,run,detail){
  const st=String(status||'').toUpperCase().replaceAll('_',' ');
  const when=run?date(run):'—';
  const msg=String(detail||'').trim();
  const ok=/^(SUCCESS|COMPLETED|OK|DONE)$/i.test(st);
  const fail=/^(FAIL|FAILED|ERROR)$/i.test(st);
  return {status:st||'—',when,detail:msg,ok,fail};
}
function applyWorkerFoot(prefix,info){
  const statusEl=$(prefix+'Status'),whenEl=$(prefix),msgEl=$(prefix+'Message');
  if(statusEl){
    statusEl.textContent=info.status;
    statusEl.classList.toggle('is-ok',!!info.ok);
    statusEl.classList.toggle('is-fail',!!info.fail);
    statusEl.classList.toggle('is-empty',!info.status||info.status==='—');
  }
  if(whenEl)whenEl.textContent=info.when;
  if(msgEl){
    if(info.detail){msgEl.hidden=false;msgEl.textContent=info.detail;}
    else{msgEl.hidden=true;msgEl.textContent='';}
  }
}
function updateSchedulePeek(){
  const peek=$('schedulePeek');
  const dailyOn=String($('rwDailyEnabled')?.value)==='1';
  const weeklyOn=String($('rwWeeklyEnabled')?.value)==='1';
  const dailyBadge=$('rwDailyBadge'),weeklyBadge=$('rwWeeklyBadge');
  if(dailyBadge){dailyBadge.textContent=dailyOn?'On':'Off';dailyBadge.classList.toggle('is-off',!dailyOn);}
  if(weeklyBadge){weeklyBadge.textContent=weeklyOn?'On':'Off';weeklyBadge.classList.toggle('is-off',!weeklyOn);}
  const dailyCard=document.querySelector('.rebate-cycle-card[data-cycle="daily"]');
  const weeklyCard=document.querySelector('.rebate-cycle-card[data-cycle="weekly"]');
  if(dailyCard)dailyCard.classList.toggle('is-disabled',!dailyOn);
  if(weeklyCard)weeklyCard.classList.toggle('is-disabled',!weeklyOn);
  if(!peek)return;
  const auto=String($('rwAutomaticEnabled')?.value)==='1';
  const dailyTime=$('rwDailyTime')?.value||'00:01';
  const weeklyTime=$('rwWeeklyTime')?.value||'00:15';
  const weekMap={1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',7:'Sun'};
  const weeklyDay=weekMap[Number($('rwWeeklyDay')?.value||1)]||'Mon';
  const tz=$('rwTimeZone')?.value||'Asia/Kuala_Lumpur';
  if(!auto){peek.textContent='Automatic settlement off · '+tz;return;}
  peek.textContent=(dailyOn?'Daily '+dailyTime:'Daily off')+' · '+(weeklyOn?'Weekly '+weeklyDay+' '+weeklyTime:'Weekly off')+' · '+tz;
}
function setScheduleOpen(open){
  const card=document.querySelector('.rebate-schedule');
  const body=$('rebateScheduleBody');
  const btn=$('toggleRebateSchedule');
  if(!card||!body||!btn)return;
  card.dataset.scheduleOpen=open?'1':'0';
  body.hidden=!open;
  btn.setAttribute('aria-expanded',open?'true':'false');
}
function renderWorkerSetting(s){
  s=s||{};
  input('rwAutomaticEnabled',s.automaticEnabled==null?1:s.automaticEnabled);
  input('rwTimeZone',s.timeZone||'Asia/Kuala_Lumpur');
  input('rwDailyEnabled',s.dailyEnabled==null?1:s.dailyEnabled);
  input('rwDailyTime',s.dailyTime||'00:01');
  input('rwWeeklyEnabled',s.weeklyEnabled==null?1:s.weeklyEnabled);
  input('rwWeeklyDay',s.weeklyDay==null?1:s.weeklyDay);
  input('rwWeeklyTime',s.weeklyTime||'00:15');
  applyWorkerFoot('rwLastDaily',workerStatusText(s.lastDailyStatus,s.lastDailyRun,s.lastDailyMessage));
  applyWorkerFoot('rwLastWeekly',workerStatusText(s.lastWeeklyStatus,s.lastWeeklyRun,s.lastWeeklyMessage));
  updateSchedulePeek();
}
async function loadWorkerSetting(){try{renderWorkerSetting(await request(base+'/api/admin/rebate/worker-settings'));}catch(e){showError(e);}}
function workerBody(){return{automaticEnabled:Number($('rwAutomaticEnabled').value),timeZone:$('rwTimeZone').value.trim(),dailyEnabled:Number($('rwDailyEnabled').value),dailyTime:$('rwDailyTime').value,weeklyEnabled:Number($('rwWeeklyEnabled').value),weeklyDay:Number($('rwWeeklyDay').value),weeklyTime:$('rwWeeklyTime').value};}
const saveRebateWorker=$('saveRebateWorker');if(saveRebateWorker)saveRebateWorker.onclick=async()=>{try{const b=workerBody();if(!b.timeZone)throw Error('Timezone is required');if(!b.dailyTime)throw Error('Daily settlement time is required');if(!b.weeklyTime)throw Error('Weekly settlement time is required');const out=await request(base+'/api/admin/rebate/worker-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});renderWorkerSetting(out);BO_DIALOG.alert('Rebate settlement schedule saved. The scheduler will use the new settings without server restart.',{title:'Schedule Saved'});}catch(e){showError(e);}};
['rwAutomaticEnabled','rwTimeZone','rwDailyEnabled','rwDailyTime','rwWeeklyEnabled','rwWeeklyDay','rwWeeklyTime'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',updateSchedulePeek);if(el)el.addEventListener('input',updateSchedulePeek);});
const toggleRebateSchedule=$('toggleRebateSchedule');
if(toggleRebateSchedule)toggleRebateSchedule.onclick=()=>{
  const open=toggleRebateSchedule.getAttribute('aria-expanded')!=='true';
  setScheduleOpen(open);
};

async function loadRules(){try{state.rules=await request(base+'/api/admin/rebate/rules')||[];state.rules.sort((a,b)=>(Number(b.priority||0)-Number(a.priority||0))||(Number(b.id)-Number(a.id)));$('ruleCount').textContent=state.rules.length.toLocaleString('en-US');$('activeRuleCount').textContent=state.rules.filter(x=>Number(x.status)===1).length.toLocaleString('en-US');renderRules();}catch(e){$('rebateRows').innerHTML='<tr><td colspan="9" class="table-empty">'+esc(e.message)+'</td></tr>';showError(e);}}
function renderRules(){const size=pageSize('rulePageSize'),d=clientPage(state.rules,state.rulePage,size);state.rulePage=d.page;$('rebateRows').innerHTML=d.rows.length?d.rows.map((x,i)=>'<tr><td>'+(d.start+i+1)+'</td><td><div class="table-primary">'+esc(x.name)+'</div><small>#'+esc(x.id)+'</small></td><td><div class="table-primary">'+esc(x.providerCode||'All Providers')+'</div><small>'+esc(x.gameCategory||'All Categories')+(x.vipLevel?' · VIP '+esc(x.vipLevel):'')+'</small></td><td>'+money(x.minValidBet||0)+' – '+(x.maxValidBet==null||Number(x.maxValidBet)<=0?'No limit':money(x.maxValidBet))+'</td><td><b>'+Number(x.rebateRate||0).toFixed(6).replace(/0+$/,'').replace(/\.$/,'')+'%</b><small>Cap: '+(x.maxRebate==null||Number(x.maxRebate)<=0?'None':money(x.maxRebate))+'</small></td><td>'+esc((x.combinationMode||'HIGHER_RATE').replaceAll('_',' '))+'</td><td>'+esc((x.claimMode||'MANUAL').replaceAll('_',' '))+'<small>'+esc((x.settlementCycle||'DAILY').replaceAll('_',' '))+' settlement</small></td><td>'+statusBadge(x.status===1?'Active':'Inactive')+'</td><td><div class="standard-actions"><button class="icon-action-btn edit" data-edit="'+x.id+'" title="Edit"><i class="bi bi-pencil"></i></button><button class="icon-action-btn delete" data-delete="'+x.id+'" title="Delete"><i class="bi bi-trash"></i></button></div></td></tr>').join(''):'<tr><td colspan="9" class="table-empty">No rebate rules found.</td></tr>';const from=d.total?d.start+1:0,to=Math.min(d.start+size,d.total);$('rebateShowing').textContent='Showing '+from+' to '+to+' of '+d.total+' entries';pager('rebatePager',d.page,d.pages,p=>{state.rulePage=p;renderRules();});}
function input(id,v){const e=$(id);if(e)e.value=v==null?'':v;}
function localDate(v){if(!v)return'';return String(v).slice(0,16);}
function apiEndpoint(key,fallback){
  const cfg=window.API_CONFIG||{};
  return String(cfg.BASE_URL||'')+String((cfg.ENDPOINTS&&cfg.ENDPOINTS[key])||fallback||'');
}
function optionValue(x){return String(x==null?'':x).trim();}
function normalizeCategoryValue(x){
  const raw=optionValue(x.code||x.categoryCode||x.key||x.name).toUpperCase();
  if(raw.includes('SLOT'))return 'SLOT';
  if(raw.includes('LIVE')||raw.includes('CASINO'))return 'LIVE';
  if(raw.includes('SPORT')||raw.includes('SOCCER'))return 'SPORTS';
  return raw.replace(/\s+/g,'_');
}
function asList(payload){
  if(Array.isArray(payload)) return payload;
  if(!payload||typeof payload!=='object') return [];
  if(Array.isArray(payload.content)) return payload.content;
  if(Array.isArray(payload.list)) return payload.list;
  if(Array.isArray(payload.records)) return payload.records;
  if(Array.isArray(payload.rows)) return payload.rows;
  return [];
}
function vipOrder(x){return x&&(x.sortOrder??x.order??x.vipLevel??x.level);}
function vipLabel(x){
  const order=vipOrder(x);
  const name=String((x&&(x.name||x.levelName||x.levelKey))||'').trim();
  if(name&&order!=null&&order!=='') return String(order)+' · '+name;
  if(name) return name;
  return order!=null&&order!==''?String(order):'Level';
}
function syncSelectUi(el){if(el&&window.BOSelectSync&&typeof BOSelectSync.one==='function')BOSelectSync.one(el);}
function renderRuleMetadata(selectedCategory,selectedVip){
  const cat=$('rrGameCategory'),vip=$('rrVipLevel');
  if(cat){
    const defaults=[{value:'SLOT',label:'Slot'},{value:'LIVE',label:'Live'},{value:'SPORTS',label:'Sports'}];
    const map=new Map(defaults.map(x=>[x.value,x.label]));
    state.gameCategories.forEach(x=>{const value=normalizeCategoryValue(x);if(value)map.set(value,x.name||x.categoryName||value.replaceAll('_',' '));});
    if(selectedCategory&&!map.has(String(selectedCategory)))map.set(String(selectedCategory),String(selectedCategory));
    cat.innerHTML='<option value="">All Categories</option>'+[...map].map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
    cat.value=selectedCategory||'';
    syncSelectUi(cat);
  }
  if(vip){
    const ordered=[...state.vipLevels]
      .filter(x=>Number(x.enabled??1)!==0)
      .sort((a,b)=>Number(vipOrder(a)||0)-Number(vipOrder(b)||0));
    if(!ordered.length){
      vip.innerHTML='<option value="">No levels configured</option>';
    }else{
      vip.innerHTML='<option value="">Select level</option>'+ordered.map(x=>{
        const order=vipOrder(x);
        return '<option value="'+esc(order)+'">'+esc(vipLabel(x))+'</option>';
      }).join('');
      if(selectedVip!=null&&selectedVip!==''&&!ordered.some(x=>String(vipOrder(x))===String(selectedVip))){
        vip.insertAdjacentHTML('beforeend','<option value="'+esc(selectedVip)+'">'+esc(selectedVip)+'</option>');
      }
    }
    vip.value=selectedVip==null?'':String(selectedVip);
    syncSelectUi(vip);
  }
}
async function loadRuleMetadata(){
  const headers=window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{};
  const [vipResult,categoryResult]=await Promise.allSettled([
    fetch(apiEndpoint('VIP_LEVEL_LIST','/admin/vip/levels'),{headers}).then(r=>r.ok?r.json():Promise.reject(Error('VIP list failed'))),
    fetch(apiEndpoint('GAME_CATEGORY_LIST','/admin/game-category/list'),{headers}).then(r=>r.ok?r.json():Promise.reject(Error('Category list failed')))
  ]);
  if(vipResult.status==='fulfilled')state.vipLevels=asList(vipResult.value&&vipResult.value.data);
  if(categoryResult.status==='fulfilled')state.gameCategories=asList(categoryResult.value&&categoryResult.value.data);
  renderRuleMetadata($('rrGameCategory')&&$('rrGameCategory').value,$('rrVipLevel')&&$('rrVipLevel').value);
}
function syncVipScope(){
  const scope=$('rrVipScope'),vip=$('rrVipLevel');
  if(!scope||!vip)return;
  const all=scope.value==='ALL';
  vip.disabled=all;
  if(all)vip.value='';
  syncSelectUi(vip);
}
function openRule(x){
  x=x||{};
  $('ruleModalTitle').textContent=x.id?'Edit Rebate Rule':'Add Rebate Rule';
  input('rrId',x.id);input('rrName',x.name);input('rrProviderCode',x.providerCode);
  renderRuleMetadata(x.gameCategory,x.vipLevel);
  input('rrVipScope',x.id?(x.vipLevel==null?'ALL':'SPECIFIC'):'SPECIFIC');
  if(!x.id&&$('rrVipLevel')&&!$('rrVipLevel').value){
    const first=[...$('rrVipLevel').options].find(o=>o.value);
    if(first)$('rrVipLevel').value=first.value;
  }
  syncVipScope();
  input('rrMinValidBet',x.minValidBet);input('rrMaxValidBet',x.maxValidBet);
  input('rrRebateRate',x.rebateRate);input('rrMaxRebate',x.maxRebate);
  input('rrPriority',x.priority==null?0:x.priority);
  input('rrCombinationMode',x.combinationMode||'HIGHER_RATE');
  input('rrClaimMode',x.claimMode||'MANUAL');
  input('rrSettlementCycle',x.settlementCycle||'DAILY');
  input('rrStatus',x.status==null?1:x.status);
  input('rrStartAt',localDate(x.startAt));input('rrEndAt',localDate(x.endAt));
  syncDatetimeFields();
  setModal('ruleModal',true);
}
function fmtDatetimeLocal(v){
  const raw=String(v||'').trim();
  if(!raw) return '';
  const [datePart,timePart=''] = raw.split('T');
  const bits=datePart.split('-');
  if(bits.length!==3) return raw.replace('T',' ');
  return bits[2]+'/'+bits[1]+'/'+bits[0]+(timePart?' '+timePart.slice(0,5):'');
}
function syncDatetimeField(id){
  const inputEl=$(id); if(!inputEl) return;
  const shell=inputEl.closest('.rebate-dt-shell');
  const text=shell&&shell.querySelector('.rebate-dt-text');
  if(!text) return;
  const label=fmtDatetimeLocal(inputEl.value);
  if(label){
    text.textContent=label;
    text.classList.remove('is-empty');
  }else{
    text.textContent='Select date & time';
    text.classList.add('is-empty');
  }
}
function syncDatetimeFields(){['rrStartAt','rrEndAt'].forEach(syncDatetimeField);}
function closeAllDatetimePops(except){
  document.querySelectorAll('#ruleModal .rebate-dt-pop.show').forEach(pop=>{
    if(except&&pop===except) return;
    pop.classList.remove('show');
  });
  document.querySelectorAll('#ruleModal .rebate-dt-shell.is-open').forEach(shell=>{
    if(except&&shell.contains(except)) return;
    shell.classList.remove('is-open');
  });
}
function parseDatetimeLocal(v){
  const raw=String(v||'').trim();
  if(!raw) return null;
  const d=new Date(raw.includes('T')?raw:raw+'T00:00');
  return isNaN(d.getTime())?null:d;
}
function toDatetimeLocal(d){
  if(!d||isNaN(d.getTime())) return '';
  const pad=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
function ensureDatetimePop(shell,inputEl){
  let pop=shell.querySelector('.rebate-dt-pop');
  if(pop&&pop.dataset.dtV!=='5'){ pop.remove(); pop=null; }
  if(pop) return pop;
  pop=document.createElement('div');
  pop.className='rebate-dt-pop';
  pop.dataset.dtV='5';
  pop.innerHTML=[
    '<div class="rebate-dt-summary">',
    '<span class="rebate-dt-summary-text" data-summary>—</span>',
    '<button type="button" class="rebate-dt-summary-clear" data-clear aria-label="Clear">Clear</button>',
    '</div>',
    '<div class="rebate-dt-body">',
    '<div class="rebate-dt-cal">',
    '<div class="rebate-dt-cal-head">',
    '<button type="button" class="rebate-dt-nav" data-nav="-1" aria-label="Previous month"><i class="bi bi-chevron-left"></i></button>',
    '<button type="button" class="rebate-dt-month" data-month-label></button>',
    '<button type="button" class="rebate-dt-nav" data-nav="1" aria-label="Next month"><i class="bi bi-chevron-right"></i></button>',
    '</div>',
    '<div class="rebate-dt-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>',
    '<div class="rebate-dt-days" data-days></div>',
    '</div>',
    '<div class="rebate-dt-time">',
    '<div class="rebate-dt-step" data-step="hour">',
    '<span class="rebate-dt-step-label">Hour</span>',
    '<button type="button" class="rebate-dt-step-btn" data-hour-up aria-label="Hour up"><i class="bi bi-chevron-up"></i></button>',
    '<button type="button" class="rebate-dt-step-val" data-hour-val title="Click to pick">00</button>',
    '<button type="button" class="rebate-dt-step-btn" data-hour-down aria-label="Hour down"><i class="bi bi-chevron-down"></i></button>',
    '</div>',
    '<div class="rebate-dt-time-colon" aria-hidden="true">:</div>',
    '<div class="rebate-dt-step" data-step="min">',
    '<span class="rebate-dt-step-label">Min</span>',
    '<button type="button" class="rebate-dt-step-btn" data-min-up aria-label="Minute up"><i class="bi bi-chevron-up"></i></button>',
    '<button type="button" class="rebate-dt-step-val" data-min-val title="Click to pick">00</button>',
    '<button type="button" class="rebate-dt-step-btn" data-min-down aria-label="Minute down"><i class="bi bi-chevron-down"></i></button>',
    '</div>',
    '</div>',
    '<div class="rebate-dt-pick" data-pick hidden>',
    '<div class="rebate-dt-pick-bar">',
    '<button type="button" class="rebate-dt-pick-back" data-pick-back aria-label="Back"><i class="bi bi-chevron-left"></i></button>',
    '<span class="rebate-dt-pick-title" data-pick-title>Hour</span>',
    '</div>',
    '<div class="rebate-dt-pick-quick" data-pick-quick hidden></div>',
    '<div class="rebate-dt-pick-grid" data-pick-grid></div>',
    '</div>',
    '</div>',
    '<div class="rebate-dt-foot">',
    '<button type="button" class="rebate-dt-foot-ghost" data-today>Today</button>',
    '<button type="button" class="rebate-dt-foot-primary" data-done>Done</button>',
    '</div>'
  ].join('');
  shell.appendChild(pop);
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_SHORT=MONTHS;
  const pad=n=>String(n).padStart(2,'0');
  let view=new Date();
  let pickKind=null;
  const pickEl=pop.querySelector('[data-pick]');
  const pickGrid=pop.querySelector('[data-pick-grid]');
  const pickQuick=pop.querySelector('[data-pick-quick]');
  const pickTitle=pop.querySelector('[data-pick-title]');
  function selected(){
    return parseDatetimeLocal(inputEl.value)||null;
  }
  function baseDate(){
    const sel=selected();
    if(sel) return new Date(sel);
    const n=new Date();
    n.setSeconds(0,0);
    return n;
  }
  function commit(d){
    inputEl.value=toDatetimeLocal(d);
    inputEl.dispatchEvent(new Event('input',{bubbles:true}));
    inputEl.dispatchEvent(new Event('change',{bubbles:true}));
    syncDatetimeField(inputEl.id);
    render();
  }
  function nudge(kind,delta){
    const d=baseDate();
    if(kind==='hour') d.setHours((d.getHours()+delta+24)%24);
    else d.setMinutes((d.getMinutes()+delta+60)%60);
    commit(d);
  }
  function closePick(){
    pickKind=null;
    pickEl.hidden=true;
    pop.classList.remove('is-picking');
  }
  function openPick(kind){
    pickKind=kind;
    const cur=baseDate();
    const active=kind==='hour'?cur.getHours():cur.getMinutes();
    pickTitle.textContent=kind==='hour'?'Hour':'Minute';
    pickQuick.hidden=kind!=='min';
    pickQuick.innerHTML='';
    if(kind==='min'){
      [0,15,30,45].forEach(m=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='rebate-dt-pick-chip'+(m===active?' is-selected':'');
        b.textContent=':'+pad(m);
        b.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          const d=baseDate(); d.setMinutes(m,0,0); commit(d); closePick();
        });
        pickQuick.appendChild(b);
      });
    }
    pickGrid.className='rebate-dt-pick-grid'+(kind==='hour'?' is-hour':' is-min');
    pickGrid.innerHTML='';
    const count=kind==='hour'?24:60;
    for(let i=0;i<count;i++){
      const b=document.createElement('button');
      b.type='button';
      b.className='rebate-dt-pick-opt'+(i===active?' is-selected':'');
      b.textContent=pad(i);
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const d=baseDate();
        if(kind==='hour') d.setHours(i);
        else d.setMinutes(i,0,0);
        commit(d);
        closePick();
      });
      pickGrid.appendChild(b);
    }
    pickEl.hidden=false;
    pop.classList.add('is-picking');
    const selBtn=pickGrid.querySelector('.is-selected');
    if(selBtn) requestAnimationFrame(()=>selBtn.scrollIntoView({block:'nearest'}));
  }
  function placePop(){
    pop.classList.remove('is-up');
    const body=document.querySelector('#ruleModal .modal-clean-body');
    if(!body) return;
    const shellRect=shell.getBoundingClientRect();
    const bodyRect=body.getBoundingClientRect();
    if(shellRect.bottom+300>bodyRect.bottom-8) pop.classList.add('is-up');
  }
  function render(){
    const sel=selected();
    const focus=sel?new Date(sel):view;
    if(!pop.dataset.viewLocked){
      view=new Date(focus.getFullYear(),focus.getMonth(),1);
    }
    pop.querySelector('[data-month-label]').textContent=MONTHS[view.getMonth()]+' '+view.getFullYear();
    const summary=pop.querySelector('[data-summary]');
    if(sel){
      summary.textContent=sel.getDate()+' '+MONTHS_SHORT[sel.getMonth()]+' '+sel.getFullYear()+' · '+pad(sel.getHours())+':'+pad(sel.getMinutes());
      summary.classList.remove('is-empty');
    }else{
      summary.textContent='Pick a date & time';
      summary.classList.add('is-empty');
    }
    const days=pop.querySelector('[data-days]');
    days.innerHTML='';
    const first=new Date(view.getFullYear(),view.getMonth(),1);
    const offset=first.getDay();
    const daysInMonth=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
    const cellCount=Math.ceil((offset+daysInMonth)/7)*7;
    const selKey=sel?sel.getFullYear()+'-'+pad(sel.getMonth()+1)+'-'+pad(sel.getDate()):'';
    const now=new Date();
    const todayKey=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
    for(let i=0;i<cellCount;i++){
      const d=new Date(view.getFullYear(),view.getMonth(),i-offset+1);
      const key=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=String(d.getDate());
      btn.className='rebate-dt-day'
        +(d.getMonth()!==view.getMonth()?' is-muted':'')
        +(key===selKey?' is-selected':'')
        +(key===todayKey?' is-today':'');
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const base=baseDate();
        const next=new Date(d.getFullYear(),d.getMonth(),d.getDate(),base.getHours(),base.getMinutes(),0,0);
        pop.dataset.viewLocked='1';
        view=new Date(d.getFullYear(),d.getMonth(),1);
        commit(next);
      });
      days.appendChild(btn);
    }
    const hour=sel?sel.getHours():baseDate().getHours();
    const minute=sel?sel.getMinutes():baseDate().getMinutes();
    pop.querySelector('[data-hour-val]').textContent=pad(hour);
    pop.querySelector('[data-min-val]').textContent=pad(minute);
  }
  if(!pop.dataset.wired){
    pop.dataset.wired='1';
    pop.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      pop.dataset.viewLocked='1';
      view=new Date(view.getFullYear(),view.getMonth()+Number(b.dataset.nav),1);
      render();
    }));
    pop.querySelector('[data-clear]').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      inputEl.value='';
      inputEl.dispatchEvent(new Event('input',{bubbles:true}));
      inputEl.dispatchEvent(new Event('change',{bubbles:true}));
      syncDatetimeField(inputEl.id);
      delete pop.dataset.viewLocked;
      closePick();
      closeAllDatetimePops();
    });
    pop.querySelector('[data-today]').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      delete pop.dataset.viewLocked;
      closePick();
      commit(new Date());
    });
    pop.querySelector('[data-done]').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(!selected()) commit(baseDate());
      closePick();
      closeAllDatetimePops();
    });
    pop.querySelector('[data-hour-up]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();nudge('hour',1);});
    pop.querySelector('[data-hour-down]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();nudge('hour',-1);});
    pop.querySelector('[data-min-up]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();nudge('min',1);});
    pop.querySelector('[data-min-down]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();nudge('min',-1);});
    pop.querySelector('[data-hour-val]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPick('hour');});
    pop.querySelector('[data-min-val]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPick('min');});
    pop.querySelector('[data-pick-back]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closePick();});
    pop.addEventListener('click',e=>e.stopPropagation());
    pop._closePick=closePick;
  }
  pop._render=render;
  pop._place=placePop;
  return pop;
}
function openDatetimePop(inputEl){
  const shell=inputEl.closest('.rebate-dt-shell');
  if(!shell) return;
  const pop=ensureDatetimePop(shell,inputEl);
  const opening=!pop.classList.contains('show');
  closeAllDatetimePops(opening?pop:null);
  if(!opening){ pop.classList.remove('show'); shell.classList.remove('is-open'); if(pop._closePick) pop._closePick(); return; }
  delete pop.dataset.viewLocked;
  if(pop._closePick) pop._closePick();
  pop._render();
  pop.classList.add('show');
  shell.classList.add('is-open');
  pop._place();
}
function wireDatetimeFields(){
  document.querySelectorAll('#ruleModal .rebate-dt-trigger').forEach(btn=>{
    if(btn.dataset.dtWired==='1') return;
    btn.dataset.dtWired='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const inputEl=$(btn.getAttribute('data-dt-for'));
      if(!inputEl) return;
      openDatetimePop(inputEl);
    });
  });
  ['rrStartAt','rrEndAt'].forEach(id=>{
    const inputEl=$(id); if(!inputEl||inputEl.dataset.dtWired==='1') return;
    inputEl.dataset.dtWired='1';
    inputEl.addEventListener('input',()=>syncDatetimeField(id));
    inputEl.addEventListener('change',()=>syncDatetimeField(id));
  });
  if(!document.documentElement.dataset.rebateDtDocWired){
    document.documentElement.dataset.rebateDtDocWired='1';
    document.addEventListener('click',e=>{
      if(e.target.closest('#ruleModal .rebate-dt-shell')) return;
      closeAllDatetimePops();
    });
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape') return;
      const openPop=document.querySelector('#ruleModal .rebate-dt-pop.show');
      if(openPop&&openPop.classList.contains('is-picking')&&openPop._closePick){
        openPop._closePick();
        return;
      }
      closeAllDatetimePops();
    });
  }
  syncDatetimeFields();
}
function ruleBody(){const get=id=>$(id).value.trim(),num=id=>get(id)===''?null:Number(get(id));const vipLevel=get('rrVipScope')==='ALL'?null:num('rrVipLevel');return{id:num('rrId'),name:get('rrName'),providerCode:get('rrProviderCode')||null,gameCategory:get('rrGameCategory')||null,vipLevel:vipLevel,minValidBet:num('rrMinValidBet'),maxValidBet:num('rrMaxValidBet'),rebateRate:num('rrRebateRate'),maxRebate:num('rrMaxRebate'),priority:num('rrPriority')||0,combinationMode:get('rrCombinationMode'),claimMode:get('rrClaimMode'),settlementCycle:get('rrSettlementCycle'),status:num('rrStatus'),startAt:get('rrStartAt')||null,endAt:get('rrEndAt')||null};}
$('rrVipScope').onchange=syncVipScope;$('addRule').onclick=()=>openRule();$('closeRule').onclick=()=>setModal('ruleModal',false);$('cancelRule').onclick=()=>setModal('ruleModal',false);$('rulePageSize').onchange=()=>{state.rulePage=0;renderRules();};
wireDatetimeFields();
$('ruleForm').onsubmit=async e=>{e.preventDefault();try{const body=ruleBody();if(!body.name)throw Error('Rule name is required');if($('rrVipScope').value==='SPECIFIC'&&body.vipLevel==null)throw Error('Please select a VIP level');if(body.rebateRate==null||body.rebateRate<0)throw Error('Rebate rate is required');if(body.maxValidBet!=null&&body.minValidBet!=null&&body.maxValidBet<body.minValidBet)throw Error('Maximum valid bet must be greater than minimum');await request(base+'/api/admin/rebate/rules/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});setModal('ruleModal',false);await loadRules();BO_DIALOG.alert('Rebate rule saved successfully.',{title:'Saved'});}catch(err){showError(err);}};
$('rebateRows').onclick=async e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)openRule(state.rules.find(x=>String(x.id)===edit.dataset.edit));if(del){const x=state.rules.find(r=>String(r.id)===del.dataset.delete);if(await BO_DIALOG.confirm('Delete '+(x?x.name:'this rebate rule')+'?',{title:'Delete Rebate Rule',confirmText:'Delete',danger:true})){try{await request(base+'/api/admin/rebate/rules/delete/'+del.dataset.delete,{method:'POST'});await loadRules();}catch(err){showError(err);}}}};
$('runSettle').onclick=async()=>{if(!await BO_DIALOG.confirm('Run yesterday rebate settlement now? The cursor batch is idempotent and will not duplicate completed records.',{title:'Run Rebate Settlement',confirmText:'Run Settlement'}))return;try{const out=await request(base+'/api/admin/rebate/settle',{method:'POST'});BO_DIALOG.alert('Settlement completed. Batch #'+(out&&out.id||'-'),{title:'Settlement Complete'});loadBatches();}catch(e){showError(e);}};
const runWeeklySettleBtn=$('runWeeklySettle');if(runWeeklySettleBtn)runWeeklySettleBtn.onclick=async()=>{if(!await BO_DIALOG.confirm('Finalize the previous completed week now? Weekly rules will compare the member weekly rebate total against the auto-credit threshold.',{title:'Finalize Weekly Rebate',confirmText:'Finalize Week'}))return;try{const out=await request(base+'/api/admin/rebate/settle-weekly',{method:'POST'});BO_DIALOG.alert('Weekly rebate finalized for '+(out?.from||'-')+' to '+(out?.to||'-')+'.',{title:'Weekly Rebate Complete'});}catch(e){showError(e);}};

async function loadBatches(){try{state.batches=await request(base+'/api/admin/rebate/batches')||[];const b=state.batches[0];$('latestBatchStatus').textContent=b?String(b.status||'-').replaceAll('_',' '):'-';$('latestBatchText').textContent=b?String(b.settlementDate||'')+' · '+Number(b.processedCount||0).toLocaleString('en-US')+' processed':'No batch record';renderBatches();}catch(e){$('batchRows').innerHTML='<tr><td colspan="10" class="table-empty">'+esc(e.message)+'</td></tr>';}}
function renderBatches(){const size=pageSize('batchPageSize'),d=clientPage(state.batches,state.batchPage,size);state.batchPage=d.page;$('batchRows').innerHTML=d.rows.length?d.rows.map(x=>'<tr><td>#'+esc(x.id)+'</td><td>'+esc(x.settlementDate||'-')+'</td><td>'+statusBadge(x.status)+'</td><td>'+Number(x.processedCount||0).toLocaleString('en-US')+'</td><td>'+Number(x.successCount||0).toLocaleString('en-US')+'</td><td>'+Number(x.failedCount||0).toLocaleString('en-US')+'</td><td><b>'+money(x.totalRebate)+'</b></td><td>'+date(x.startedAt)+'</td><td>'+date(x.completedAt)+'</td><td>'+esc(x.createdBy||'SYSTEM')+'</td></tr>').join(''):'<tr><td colspan="10" class="table-empty">No settlement batches found.</td></tr>';const from=d.total?d.start+1:0,to=Math.min(d.start+size,d.total);$('batchShowing').textContent='Showing '+from+' to '+to+' of '+d.total+' entries';pager('batchPager',d.page,d.pages,p=>{state.batchPage=p;renderBatches();});}
$('batchPageSize').onchange=()=>{state.batchPage=0;renderBatches();};$('refreshBatches').onclick=loadBatches;

async function loadAudit(){const size=pageSize('auditPageSize'),q=new URLSearchParams({page:state.auditPage,size});if($('auditEntity').value.trim())q.set('entityType',$('auditEntity').value.trim());if($('auditAction').value.trim())q.set('action',$('auditAction').value.trim());if($('auditActor').value.trim())q.set('actor',$('auditActor').value.trim());try{const d=await request(base+'/api/admin/rebate/audit?'+q)||{},rows=d.content||[];state.auditLast=Math.max(0,(d.totalPages||0)-1);$('auditRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+date(x.createdAt)+'</td><td><div class="table-primary">'+esc(x.entityType||'-')+'</div></td><td>'+esc(x.entityId||'-')+'</td><td>'+statusBadge(x.action||'-')+'</td><td>'+esc(x.actor||'SYSTEM')+'</td><td>'+esc(x.ipAddress||'-')+'</td><td class="detail-cell">'+esc(x.detail||'-')+'</td><td><button class="icon-action-btn view" data-audit-id="'+x.id+'"><i class="bi bi-eye"></i></button></td></tr>').join(''):'<tr><td colspan="8" class="table-empty">No audit records found.</td></tr>';$('auditRows').dataset.rows=JSON.stringify(rows);const from=d.numberOfElements?d.number*size+1:0,to=d.number*size+(d.numberOfElements||0);$('auditShowing').textContent='Showing '+from+' to '+to+' of '+(d.totalElements||0)+' entries';pager('auditPager',d.number||0,d.totalPages||0,p=>{state.auditPage=p;loadAudit();});}catch(e){$('auditRows').innerHTML='<tr><td colspan="8" class="table-empty">'+esc(e.message)+'</td></tr>';}}
$('auditPageSize').onchange=()=>{state.auditPage=0;loadAudit();};$('searchAudit').onclick=()=>{state.auditPage=0;loadAudit();};$('refreshAudit').onclick=loadAudit;
$('auditRows').onclick=e=>{const b=e.target.closest('[data-audit-id]');if(!b)return;const rows=JSON.parse($('auditRows').dataset.rows||'[]'),x=rows.find(r=>String(r.id)===b.dataset.auditId);if(!x)return;$('auditDetailContent').innerHTML='<dl><dt>Date</dt><dd>'+date(x.createdAt)+'</dd><dt>Entity</dt><dd>'+esc(x.entityType)+' #'+esc(x.entityId)+'</dd><dt>Action</dt><dd>'+esc(x.action)+'</dd><dt>Actor / IP</dt><dd>'+esc(x.actor||'SYSTEM')+' / '+esc(x.ipAddress||'-')+'</dd><dt>Detail</dt><dd>'+esc(x.detail||'-')+'</dd></dl><h5>Before</h5><pre>'+esc(formatJson(x.beforeJson))+'</pre><h5>After</h5><pre>'+esc(formatJson(x.afterJson))+'</pre>';setModal('auditDetailModal',true);};
function formatJson(v){if(!v)return'-';try{return JSON.stringify(JSON.parse(v),null,2);}catch(e){return String(v);}}
$('closeAuditDetail').onclick=$('closeAuditDetailBottom').onclick=()=>setModal('auditDetailModal',false);

async function loadRecon(){const size=pageSize('reconPageSize'),q=new URLSearchParams({page:state.reconPage,size});try{const d=await request(base+'/api/admin/rebate/reconciliations?'+q)||{},rows=d.content||[];state.reconLast=Math.max(0,(d.totalPages||0)-1);const issues=Number(d.totalElements||0)&&rows.filter(x=>String(x.status).toUpperCase()!=='MATCHED').length;$('reconIssueCount').textContent=Number(issues||0).toLocaleString('en-US');$('reconRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+date(x.createdAt)+'</td><td>#'+esc(x.sessionId||'-')+'</td><td>'+esc(x.memberId||'-')+'</td><td>'+esc(x.providerCode||'-')+'</td><td>'+money(x.expectedMain)+'</td><td>'+money(x.expectedBonus)+'</td><td>'+money(x.actualProviderBalance)+'</td><td class="'+(Math.abs(Number(x.differenceAmount||0))>.01?'negative':'')+'">'+money(x.differenceAmount)+'</td><td>'+statusBadge(x.status)+'</td><td class="detail-cell">'+esc(x.detail||'-')+'</td></tr>').join(''):'<tr><td colspan="10" class="table-empty">No reconciliation records found.</td></tr>';const from=d.numberOfElements?d.number*size+1:0,to=d.number*size+(d.numberOfElements||0);$('reconShowing').textContent='Showing '+from+' to '+to+' of '+(d.totalElements||0)+' entries';pager('reconPager',d.number||0,d.totalPages||0,p=>{state.reconPage=p;loadRecon();});}catch(e){$('reconRows').innerHTML='<tr><td colspan="10" class="table-empty">'+esc(e.message)+'</td></tr>';}}
$('reconPageSize').onchange=()=>{state.reconPage=0;loadRecon();};$('refreshRecon').onclick=loadRecon;

loadWorkerSetting();loadRules();loadBatches();
})();
