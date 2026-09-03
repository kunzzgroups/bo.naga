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
function pager(target,page,totalPages,handler){const el=$(target);if(!el)return;const p=Math.max(0,page),total=Math.max(0,totalPages);let h='<button class="page-btn" '+(p<=0?'disabled':'')+' data-p="'+(p-1)+'"><i class="bi bi-chevron-left"></i></button>';const a=Math.max(0,p-2),b=Math.min(total-1,p+2);for(let i=a;i<=b;i++)h+='<button class="page-btn '+(i===p?'active':'')+'" data-p="'+i+'">'+(i+1)+'</button>';h+='<button class="page-btn" '+(p>=total-1||!total?'disabled':'')+' data-p="'+(p+1)+'"><i class="bi bi-chevron-right"></i></button>';el.innerHTML=h;el.onclick=e=>{const b=e.target.closest('[data-p]');if(!b||b.disabled)return;handler(Number(b.dataset.p));};}
function clientPage(rows,page,size){const total=rows.length,pages=Math.ceil(total/size),safe=pages?Math.min(page,pages-1):0,start=safe*size;return{rows:rows.slice(start,start+size),page:safe,pages,total,start};}
function switchTab(name){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));if(name==='batches')loadBatches();if(name==='audit')loadAudit();if(name==='reconciliation')loadRecon();}

document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));


function workerStatusText(status,run,detail){
  const st=String(status||'').toUpperCase();
  const when=run?date(run):'-';
  return {title:(st?st.replaceAll('_',' ')+' · ':'')+when,detail:detail||'No run recorded'};
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
  const d=workerStatusText(s.lastDailyStatus,s.lastDailyRun,s.lastDailyMessage),w=workerStatusText(s.lastWeeklyStatus,s.lastWeeklyRun,s.lastWeeklyMessage);
  if($('rwLastDaily'))$('rwLastDaily').textContent=d.title;if($('rwLastDailyMessage'))$('rwLastDailyMessage').textContent=d.detail;
  if($('rwLastWeekly'))$('rwLastWeekly').textContent=w.title;if($('rwLastWeeklyMessage'))$('rwLastWeeklyMessage').textContent=w.detail;
}
async function loadWorkerSetting(){try{renderWorkerSetting(await request(base+'/api/admin/rebate/worker-settings'));}catch(e){showError(e);}}
function workerBody(){return{automaticEnabled:Number($('rwAutomaticEnabled').value),timeZone:$('rwTimeZone').value.trim(),dailyEnabled:Number($('rwDailyEnabled').value),dailyTime:$('rwDailyTime').value,weeklyEnabled:Number($('rwWeeklyEnabled').value),weeklyDay:Number($('rwWeeklyDay').value),weeklyTime:$('rwWeeklyTime').value};}
const saveRebateWorker=$('saveRebateWorker');if(saveRebateWorker)saveRebateWorker.onclick=async()=>{try{const b=workerBody();if(!b.timeZone)throw Error('Timezone is required');if(!b.dailyTime)throw Error('Daily settlement time is required');if(!b.weeklyTime)throw Error('Weekly settlement time is required');const out=await request(base+'/api/admin/rebate/worker-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});renderWorkerSetting(out);BO_DIALOG.alert('Rebate settlement schedule saved. The scheduler will use the new settings without server restart.',{title:'Schedule Saved'});}catch(e){showError(e);}};

async function loadRules(){try{state.rules=await request(base+'/api/admin/rebate/rules')||[];state.rules.sort((a,b)=>(Number(b.priority||0)-Number(a.priority||0))||(Number(b.id)-Number(a.id)));$('ruleCount').textContent=state.rules.length.toLocaleString('en-US');$('activeRuleCount').textContent=state.rules.filter(x=>Number(x.status)===1).length.toLocaleString('en-US');renderRules();}catch(e){$('rebateRows').innerHTML='<tr><td colspan="9" class="table-empty">'+esc(e.message)+'</td></tr>';showError(e);}}
function renderRules(){const size=Number($('rulePageSize').value||20),d=clientPage(state.rules,state.rulePage,size);state.rulePage=d.page;$('rebateRows').innerHTML=d.rows.length?d.rows.map((x,i)=>'<tr><td>'+(d.start+i+1)+'</td><td><div class="table-primary">'+esc(x.name)+'</div><small>#'+esc(x.id)+'</small></td><td><div class="table-primary">'+esc(x.providerCode||'All Providers')+'</div><small>'+esc(x.gameCategory||'All Categories')+(x.vipLevel?' · VIP '+esc(x.vipLevel):'')+'</small></td><td>'+money(x.minValidBet||0)+' – '+(x.maxValidBet==null||Number(x.maxValidBet)<=0?'No limit':money(x.maxValidBet))+'</td><td><b>'+Number(x.rebateRate||0).toFixed(6).replace(/0+$/,'').replace(/\.$/,'')+'%</b><small>Cap: '+(x.maxRebate==null||Number(x.maxRebate)<=0?'None':money(x.maxRebate))+'</small></td><td>'+esc((x.combinationMode||'HIGHER_RATE').replaceAll('_',' '))+'</td><td>'+esc((x.claimMode||'MANUAL').replaceAll('_',' '))+'<small>'+esc((x.settlementCycle||'DAILY').replaceAll('_',' '))+' settlement</small></td><td>'+statusBadge(x.status===1?'Active':'Inactive')+'</td><td><div class="standard-actions"><button class="icon-action-btn edit" data-edit="'+x.id+'" title="Edit"><i class="bi bi-pencil"></i></button><button class="icon-action-btn delete" data-delete="'+x.id+'" title="Delete"><i class="bi bi-trash"></i></button></div></td></tr>').join(''):'<tr><td colspan="9" class="table-empty">No rebate rules found.</td></tr>';const from=d.total?d.start+1:0,to=Math.min(d.start+size,d.total);$('rebateShowing').textContent='Showing '+from+' to '+to+' of '+d.total+' entries';pager('rebatePager',d.page,d.pages,p=>{state.rulePage=p;renderRules();});}
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
function renderRuleMetadata(selectedCategory,selectedVip){
  const cat=$('rrGameCategory'),vip=$('rrVipLevel');
  if(cat){
    const defaults=[{value:'SLOT',label:'Slot'},{value:'LIVE',label:'Live'},{value:'SPORTS',label:'Sports'}];
    const map=new Map(defaults.map(x=>[x.value,x.label]));
    state.gameCategories.forEach(x=>{const value=normalizeCategoryValue(x);if(value)map.set(value,x.name||x.categoryName||value.replaceAll('_',' '));});
    if(selectedCategory&&!map.has(String(selectedCategory)))map.set(String(selectedCategory),String(selectedCategory));
    cat.innerHTML='<option value="">All Categories</option>'+[...map].map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
    cat.value=selectedCategory||'';
  }
  if(vip){
    const ordered=[...state.vipLevels].sort((a,b)=>Number(a.sortOrder||a.order||0)-Number(b.sortOrder||b.order||0));
    vip.innerHTML='<option value="">Select VIP Level</option>'+ordered.map(x=>{const order=x.sortOrder??x.order??x.vipLevel;const name=x.name||x.levelName||x.levelKey||('VIP '+order);return '<option value="'+esc(order)+'">VIP '+esc(order)+' - '+esc(name)+'</option>';}).join('');
    if(selectedVip!=null&&selectedVip!==''&&!ordered.some(x=>String(x.sortOrder??x.order??x.vipLevel)===String(selectedVip)))vip.insertAdjacentHTML('beforeend','<option value="'+esc(selectedVip)+'">VIP '+esc(selectedVip)+'</option>');
    vip.value=selectedVip==null?'':String(selectedVip);
  }
}
async function loadRuleMetadata(){
  const headers=window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{};
  const [vipResult,categoryResult]=await Promise.allSettled([
    fetch(apiEndpoint('VIP_LEVEL_LIST','/admin/vip/levels'),{headers}).then(r=>r.ok?r.json():Promise.reject(Error('VIP list failed'))),
    fetch(apiEndpoint('GAME_CATEGORY_LIST','/admin/game-category/list'),{headers}).then(r=>r.ok?r.json():Promise.reject(Error('Category list failed')))
  ]);
  if(vipResult.status==='fulfilled')state.vipLevels=Array.isArray(vipResult.value.data)?vipResult.value.data:[];
  if(categoryResult.status==='fulfilled')state.gameCategories=Array.isArray(categoryResult.value.data)?categoryResult.value.data:[];
  renderRuleMetadata($('rrGameCategory')&&$('rrGameCategory').value,$('rrVipLevel')&&$('rrVipLevel').value);
}
function syncVipScope(){const scope=$('rrVipScope'),vip=$('rrVipLevel');if(!scope||!vip)return;const all=scope.value==='ALL';vip.disabled=all;if(all)vip.value='';}
function openRule(x){x=x||{};$('ruleModalTitle').textContent=x.id?'Edit Rebate Rule':'Add Rebate Rule';input('rrId',x.id);input('rrName',x.name);input('rrProviderCode',x.providerCode);renderRuleMetadata(x.gameCategory,x.vipLevel);input('rrVipScope',x.id?(x.vipLevel==null?'ALL':'SPECIFIC'):'SPECIFIC');if(!x.id&&$('rrVipLevel')&&!$('rrVipLevel').value){const first=[...$('rrVipLevel').options].find(o=>o.value);if(first)$('rrVipLevel').value=first.value;}syncVipScope();input('rrMinValidBet',x.minValidBet);input('rrMaxValidBet',x.maxValidBet);input('rrRebateRate',x.rebateRate);input('rrMaxRebate',x.maxRebate);input('rrPriority',x.priority==null?0:x.priority);input('rrCombinationMode',x.combinationMode||'HIGHER_RATE');input('rrClaimMode',x.claimMode||'MANUAL');input('rrSettlementCycle',x.settlementCycle||'DAILY');input('rrStatus',x.status==null?1:x.status);input('rrStartAt',localDate(x.startAt));input('rrEndAt',localDate(x.endAt));setModal('ruleModal',true);}
function ruleBody(){const get=id=>$(id).value.trim(),num=id=>get(id)===''?null:Number(get(id));const vipLevel=get('rrVipScope')==='ALL'?null:num('rrVipLevel');return{id:num('rrId'),name:get('rrName'),providerCode:get('rrProviderCode')||null,gameCategory:get('rrGameCategory')||null,vipLevel:vipLevel,minValidBet:num('rrMinValidBet'),maxValidBet:num('rrMaxValidBet'),rebateRate:num('rrRebateRate'),maxRebate:num('rrMaxRebate'),priority:num('rrPriority')||0,combinationMode:get('rrCombinationMode'),claimMode:get('rrClaimMode'),settlementCycle:get('rrSettlementCycle'),status:num('rrStatus'),startAt:get('rrStartAt')||null,endAt:get('rrEndAt')||null};}
$('rrVipScope').onchange=syncVipScope;$('addRule').onclick=()=>openRule();$('closeRule').onclick=()=>setModal('ruleModal',false);$('cancelRule').onclick=()=>setModal('ruleModal',false);$('rulePageSize').onchange=()=>{state.rulePage=0;renderRules();};
$('ruleForm').onsubmit=async e=>{e.preventDefault();try{const body=ruleBody();if(!body.name)throw Error('Rule name is required');if($('rrVipScope').value==='SPECIFIC'&&body.vipLevel==null)throw Error('Please select a VIP level');if(body.rebateRate==null||body.rebateRate<0)throw Error('Rebate rate is required');if(body.maxValidBet!=null&&body.minValidBet!=null&&body.maxValidBet<body.minValidBet)throw Error('Maximum valid bet must be greater than minimum');await request(base+'/api/admin/rebate/rules/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});setModal('ruleModal',false);await loadRules();BO_DIALOG.alert('Rebate rule saved successfully.',{title:'Saved'});}catch(err){showError(err);}};
$('rebateRows').onclick=async e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)openRule(state.rules.find(x=>String(x.id)===edit.dataset.edit));if(del){const x=state.rules.find(r=>String(r.id)===del.dataset.delete);if(await BO_DIALOG.confirm('Delete '+(x?x.name:'this rebate rule')+'?',{title:'Delete Rebate Rule',confirmText:'Delete',danger:true})){try{await request(base+'/api/admin/rebate/rules/delete/'+del.dataset.delete,{method:'POST'});await loadRules();}catch(err){showError(err);}}}};
$('runSettle').onclick=async()=>{if(!await BO_DIALOG.confirm('Run yesterday rebate settlement now? The cursor batch is idempotent and will not duplicate completed records.',{title:'Run Rebate Settlement',confirmText:'Run Settlement'}))return;try{const out=await request(base+'/api/admin/rebate/settle',{method:'POST'});BO_DIALOG.alert('Settlement completed. Batch #'+(out&&out.id||'-'),{title:'Settlement Complete'});loadBatches();}catch(e){showError(e);}};
const runWeeklySettleBtn=$('runWeeklySettle');if(runWeeklySettleBtn)runWeeklySettleBtn.onclick=async()=>{if(!await BO_DIALOG.confirm('Finalize the previous completed week now? Weekly rules will compare the member weekly rebate total against the auto-credit threshold.',{title:'Finalize Weekly Rebate',confirmText:'Finalize Week'}))return;try{const out=await request(base+'/api/admin/rebate/settle-weekly',{method:'POST'});BO_DIALOG.alert('Weekly rebate finalized for '+(out?.from||'-')+' to '+(out?.to||'-')+'.',{title:'Weekly Rebate Complete'});}catch(e){showError(e);}};

async function loadBatches(){try{state.batches=await request(base+'/api/admin/rebate/batches')||[];const b=state.batches[0];$('latestBatchStatus').textContent=b?String(b.status||'-').replaceAll('_',' '):'-';$('latestBatchText').textContent=b?String(b.settlementDate||'')+' · '+Number(b.processedCount||0).toLocaleString('en-US')+' processed':'No batch record';renderBatches();}catch(e){$('batchRows').innerHTML='<tr><td colspan="10" class="table-empty">'+esc(e.message)+'</td></tr>';}}
function renderBatches(){const size=Number($('batchPageSize').value||20),d=clientPage(state.batches,state.batchPage,size);state.batchPage=d.page;$('batchRows').innerHTML=d.rows.length?d.rows.map(x=>'<tr><td>#'+esc(x.id)+'</td><td>'+esc(x.settlementDate||'-')+'</td><td>'+statusBadge(x.status)+'</td><td>'+Number(x.processedCount||0).toLocaleString('en-US')+'</td><td>'+Number(x.successCount||0).toLocaleString('en-US')+'</td><td>'+Number(x.failedCount||0).toLocaleString('en-US')+'</td><td><b>'+money(x.totalRebate)+'</b></td><td>'+date(x.startedAt)+'</td><td>'+date(x.completedAt)+'</td><td>'+esc(x.createdBy||'SYSTEM')+'</td></tr>').join(''):'<tr><td colspan="10" class="table-empty">No settlement batches found.</td></tr>';const from=d.total?d.start+1:0,to=Math.min(d.start+size,d.total);$('batchShowing').textContent='Showing '+from+' to '+to+' of '+d.total+' entries';pager('batchPager',d.page,d.pages,p=>{state.batchPage=p;renderBatches();});}
$('batchPageSize').onchange=()=>{state.batchPage=0;renderBatches();};$('refreshBatches').onclick=loadBatches;

async function loadAudit(){const size=Number($('auditPageSize').value||20),q=new URLSearchParams({page:state.auditPage,size});if($('auditEntity').value.trim())q.set('entityType',$('auditEntity').value.trim());if($('auditAction').value.trim())q.set('action',$('auditAction').value.trim());if($('auditActor').value.trim())q.set('actor',$('auditActor').value.trim());try{const d=await request(base+'/api/admin/rebate/audit?'+q)||{},rows=d.content||[];state.auditLast=Math.max(0,(d.totalPages||0)-1);$('auditRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+date(x.createdAt)+'</td><td><div class="table-primary">'+esc(x.entityType||'-')+'</div></td><td>'+esc(x.entityId||'-')+'</td><td>'+statusBadge(x.action||'-')+'</td><td>'+esc(x.actor||'SYSTEM')+'</td><td>'+esc(x.ipAddress||'-')+'</td><td class="detail-cell">'+esc(x.detail||'-')+'</td><td><button class="icon-action-btn view" data-audit-id="'+x.id+'"><i class="bi bi-eye"></i></button></td></tr>').join(''):'<tr><td colspan="8" class="table-empty">No audit records found.</td></tr>';$('auditRows').dataset.rows=JSON.stringify(rows);const from=d.numberOfElements?d.number*size+1:0,to=d.number*size+(d.numberOfElements||0);$('auditShowing').textContent='Showing '+from+' to '+to+' of '+(d.totalElements||0)+' entries';pager('auditPager',d.number||0,d.totalPages||0,p=>{state.auditPage=p;loadAudit();});}catch(e){$('auditRows').innerHTML='<tr><td colspan="8" class="table-empty">'+esc(e.message)+'</td></tr>';}}
$('auditPageSize').onchange=()=>{state.auditPage=0;loadAudit();};$('searchAudit').onclick=()=>{state.auditPage=0;loadAudit();};$('refreshAudit').onclick=loadAudit;
$('auditRows').onclick=e=>{const b=e.target.closest('[data-audit-id]');if(!b)return;const rows=JSON.parse($('auditRows').dataset.rows||'[]'),x=rows.find(r=>String(r.id)===b.dataset.auditId);if(!x)return;$('auditDetailContent').innerHTML='<dl><dt>Date</dt><dd>'+date(x.createdAt)+'</dd><dt>Entity</dt><dd>'+esc(x.entityType)+' #'+esc(x.entityId)+'</dd><dt>Action</dt><dd>'+esc(x.action)+'</dd><dt>Actor / IP</dt><dd>'+esc(x.actor||'SYSTEM')+' / '+esc(x.ipAddress||'-')+'</dd><dt>Detail</dt><dd>'+esc(x.detail||'-')+'</dd></dl><h5>Before</h5><pre>'+esc(formatJson(x.beforeJson))+'</pre><h5>After</h5><pre>'+esc(formatJson(x.afterJson))+'</pre>';setModal('auditDetailModal',true);};
function formatJson(v){if(!v)return'-';try{return JSON.stringify(JSON.parse(v),null,2);}catch(e){return String(v);}}
$('closeAuditDetail').onclick=$('closeAuditDetailBottom').onclick=()=>setModal('auditDetailModal',false);

async function loadRecon(){const size=Number($('reconPageSize').value||20),q=new URLSearchParams({page:state.reconPage,size});try{const d=await request(base+'/api/admin/rebate/reconciliations?'+q)||{},rows=d.content||[];state.reconLast=Math.max(0,(d.totalPages||0)-1);const issues=Number(d.totalElements||0)&&rows.filter(x=>String(x.status).toUpperCase()!=='MATCHED').length;$('reconIssueCount').textContent=Number(issues||0).toLocaleString('en-US');$('reconRows').innerHTML=rows.length?rows.map(x=>'<tr><td>'+date(x.createdAt)+'</td><td>#'+esc(x.sessionId||'-')+'</td><td>'+esc(x.memberId||'-')+'</td><td>'+esc(x.providerCode||'-')+'</td><td>'+money(x.expectedMain)+'</td><td>'+money(x.expectedBonus)+'</td><td>'+money(x.actualProviderBalance)+'</td><td class="'+(Math.abs(Number(x.differenceAmount||0))>.01?'negative':'')+'">'+money(x.differenceAmount)+'</td><td>'+statusBadge(x.status)+'</td><td class="detail-cell">'+esc(x.detail||'-')+'</td></tr>').join(''):'<tr><td colspan="10" class="table-empty">No reconciliation records found.</td></tr>';const from=d.numberOfElements?d.number*size+1:0,to=d.number*size+(d.numberOfElements||0);$('reconShowing').textContent='Showing '+from+' to '+to+' of '+(d.totalElements||0)+' entries';pager('reconPager',d.number||0,d.totalPages||0,p=>{state.reconPage=p;loadRecon();});}catch(e){$('reconRows').innerHTML='<tr><td colspan="10" class="table-empty">'+esc(e.message)+'</td></tr>';}}
$('reconPageSize').onchange=()=>{state.reconPage=0;loadRecon();};$('refreshRecon').onclick=loadRecon;

loadWorkerSetting();loadRules();loadBatches();
})();
