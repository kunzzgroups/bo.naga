(function(){'use strict';
const $=id=>document.getElementById(id);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=v=>'RM '+Number(v??0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:4});
const base=()=>String(window.API_CONFIG?.BASE_URL||'/api').replace(/\/$/,'');
const apiRoot='/admin/referral-v2';
let networkRows=[];
let financeViewData=null;
let generationPolicy=null;
const configuredGenerationRates=new Map();
const pageState=new Map();
const DEFAULT_PAGE_SIZE=10;
function tableData(id,records,render,colspan){
 let state=pageState.get(id);
 if(!state){state={page:1,size:DEFAULT_PAGE_SIZE,search:'',records:[],render:null,colspan};pageState.set(id,state);}
 state.records=records||[];state.render=render;state.colspan=colspan;
 paintTable(id);
}
function tableSearchText(r){return JSON.stringify(r).toLocaleLowerCase();}
function paintTable(id){
 const state=pageState.get(id),body=$(id);if(!body||!state)return;
 const matches=state.search?state.records.filter(r=>tableSearchText(r).includes(state.search)):state.records;
 const totalPages=Math.max(1,Math.ceil(matches.length/state.size));
 state.page=Math.max(1,Math.min(state.page,totalPages));
 const start=(state.page-1)*state.size;
 body.innerHTML=matches.length?matches.slice(start,start+state.size).map(state.render).join(''):
  '<tr><td colspan="'+state.colspan+'" class="text-muted py-3">'+(id==='r2Participants'?'No referral relationships found':'No matching records')+'</td></tr>';
 const footer=$('r2Pager_'+id);if(!footer)return;
 const from=matches.length?start+1:0,to=Math.min(start+state.size,matches.length);
 footer.querySelector('[data-r2-total]').textContent=`Showing ${from} to ${to} of ${matches.length} entries`;
 const pages=footer.querySelector('[data-r2-pages]');pages.innerHTML='';
 const make=(label,page,disabled,active)=>{
  const btn=document.createElement('button');btn.type='button';btn.className='r2-pager-btn'+(active?' active':'');
  btn.textContent=label;btn.disabled=disabled;btn.setAttribute('aria-label',label==='‹'?'Previous page':label==='›'?'Next page':'Page '+label);
  if(active)btn.setAttribute('aria-current','page');
  btn.addEventListener('click',()=>{state.page=page;paintTable(id);});pages.appendChild(btn);
 };
 make('‹',state.page-1,state.page===1,false);
 const candidates=new Set([1,totalPages,state.page-1,state.page,state.page+1]);
 let last=0;
 for(const number of [...candidates].filter(v=>v>0&&v<=totalPages).sort((a,b)=>a-b)){
  if(last&&number-last>1){const gap=document.createElement('span');gap.className='r2-pager-ellipsis';gap.textContent='…';pages.appendChild(gap);}
  make(String(number),number,false,number===state.page);last=number;
 }
 make('›',state.page+1,state.page===totalPages,false);
}
function setupTableTools(){
 const ids=['r2Participants','r2Collections','r2Receipts','r2Allocations','r2Wallets','r2Withdrawals','r2Reconciliation','r2Ledger','r2Reversals','r2Audit'];
 for(const id of ids){
  const body=$(id),table=body?.closest('table'),wrapper=table?.closest('.table-responsive');
  if(!wrapper||!table||document.getElementById('r2Pager_'+id))continue;
  table.classList.add('r2-data-table');
  if(id!=='r2Participants'){
   const toolbar=document.createElement('div');toolbar.className='r2-list-toolbar';
   toolbar.innerHTML='<label class="r2-list-search-label"><i class="bi bi-search" aria-hidden="true"></i><input class="r2-list-search" type="search" placeholder="Search records" aria-label="Search records"/></label>';
   wrapper.before(toolbar);
   toolbar.querySelector('input').addEventListener('input',e=>{
    const state=pageState.get(id);if(!state)return;state.search=e.target.value.trim().toLocaleLowerCase();state.page=1;paintTable(id);
   });
  }
  const footer=document.createElement('div');footer.className='r2-table-footer';footer.id='r2Pager_'+id;
  footer.innerHTML='<label class="r2-page-size">Show <select aria-label="Rows per page"><option value="10">10</option><option value="25">25</option><option value="50">50</option></select> entries</label><span data-r2-total></span><div class="r2-pager-pages" data-r2-pages></div>';
  wrapper.after(footer);
  footer.querySelector('select').addEventListener('change',e=>{
   const state=pageState.get(id);if(!state)return;state.size=Number(e.target.value)||DEFAULT_PAGE_SIZE;state.page=1;paintTable(id);
  });
 }
}

const feedback=(message,isError=false)=>{const n=$('r2Feedback');if(n){n.textContent=message;n.className=isError?'alert alert-danger':'alert alert-info';}};
async function request(path,opts={}){
 const token=window.BO_AUTH?.authHeader?.()||{};
 const response=await fetch(base()+apiRoot+path,{...opts,cache:'no-store',headers:{...token,...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.status!=='success')throw Error(data.message||data.detail||('Request failed: '+response.status));
 return data.data;
}
function read(form){const data={};new FormData(form).forEach((value,key)=>{if(String(value).trim()!=='')data[key]=String(value).trim()});return data;}
function body(v){return JSON.stringify(v)}
function show(tab){document.querySelectorAll('[data-r2-panel]').forEach(p=>{p.hidden=p.dataset.r2Panel!==tab});document.querySelectorAll('[data-r2-tab]').forEach(btn=>{const selected=btn.dataset.r2Tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));});}
function friendlyStatus(value){return ({PENDING:'Waiting for review',VERIFIED:'Payment confirmed',CALCULATED:'Awaiting commission approval',APPROVED:'Approved',REJECTED:'Declined',REVERSED:'Corrected',PAID:'Paid',DRAFT:'Pending approval'})[String(value)]||String(value||'-');}
function transactionType(type){return ({COMMISSION:'Commission received',RESERVE:'Withdrawal requested',RELEASE:'Withdrawal hold released',WITHDRAWAL:'Withdrawal paid',REVERSAL:'Commission corrected'})[String(type)]||String(type||'-');}
function paymentReference(key){
 const raw=String(key||'-');const match=/^(commission|withdraw-reserve|withdraw-release|withdraw-paid|reversal):(\d+)$/.exec(raw);
 if(!match)return raw;
 const title=({commission:'Commission', 'withdraw-reserve':'Withdrawal request','withdraw-release':'Declined withdrawal','withdraw-paid':'Withdrawal payment',reversal:'Commission correction'})[match[1]];
 return title+' #'+match[2];
}
function auditAction(type){return ({REQUEST_WITHDRAWAL:'Withdrawal requested',REQUEST_REVERSAL:'Commission correction requested',APPROVE_REVERSAL:'Commission correction confirmed',APPROVE_COMMISSION:'Commission approved',UPDATE_GENERATION_POLICY:'Commission rates updated',CHANGE_PARENT:'Referrer updated',CALCULATE:'Commission calculated',MANUAL_ALLOCATION:'Commission adjusted',REQUEST_RECEIPT:'Payment submitted',VERIFY_RECEIPT:'Payment confirmed',REJECT_RECEIPT:'Payment rejected'})[String(type)]||String(type||'-').replaceAll('_',' ').toLowerCase();}
function row(cells){return '<tr>'+cells.map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'</tr>';}
function draw(id,records,render,colspan){tableData(id,records,render,colspan);}
function action(label,act,id,disabled=false){return '<button type="button" class="btn btn-sm btn-outline-primary me-1 mb-1" '+(disabled?'disabled ':'')+'data-r2-command="'+act+'" data-id="'+id+'">'+escapeHtml(label)+'</button>';}
function accountLabel(p){return (p.account_code||('#'+p.id))+' — '+p.display_name+' ('+p.kind+(p.kind==='MERCHANT'&&p.currency?' · '+p.currency:'')+')';}
function updateMerchantCurrencyNotice(){
 const select=$('r2MerchantSelect'),notice=$('r2MerchantCurrencyNotice');if(!select||!notice)return;
 const merchant=networkRows.find(p=>String(p.id)===select.value);
 const incompatible=merchant&&merchant.kind==='MERCHANT'&&merchant.collection_currency_compatible===false;
 notice.textContent=incompatible?'Different settlement currency: invoices are blocked to prevent incorrect FX commission.':'';
 notice.classList.toggle('r2-discovery-warning',!!incompatible);
 const submit=$('r2CreateCollection')?.querySelector('button[type="submit"],button:not([type])');if(submit)submit.disabled=!!incompatible;
}
function linkedAccounts(){
 const parentIds=new Set(networkRows.filter(p=>p.parent_id!=null).map(p=>String(p.parent_id)));
 return networkRows.filter(p=>p.parent_id!=null||parentIds.has(String(p.id)));
}
function orderedNetwork(rows){
 const index=new Map(rows.map(p=>[String(p.id),p]));
 const children=new Map();
 for(const participant of rows){const parent=String(participant.parent_id);if(!children.has(parent))children.set(parent,[]);children.get(parent).push(participant);}
 const sort=(a,b)=>String(a.account_code||a.display_name||'').localeCompare(String(b.account_code||b.display_name||''),undefined,{numeric:true});
 for(const siblings of children.values())siblings.sort(sort);
 const roots=rows.filter(p=>p.parent_id==null||!index.has(String(p.parent_id))).sort(sort);
 const result=[],visited=new Set();
 const walk=initial=>{const queue=[initial];while(queue.length){const item=queue.pop(),key=String(item.id);if(visited.has(key))continue;visited.add(key);result.push(item);const kids=children.get(key)||[];for(let i=kids.length-1;i>=0;i--)queue.push(kids[i]);}};
 roots.forEach(walk);rows.filter(p=>!visited.has(String(p.id))).sort(sort).forEach(walk);
 return result;
}
function populateNetworkSelects(wallets=[]){
 const make=(id,filter,empty)=>{const el=$(id);if(!el)return;const selected=el.value;el.innerHTML='<option value="">'+escapeHtml(empty)+'</option>'+networkRows.filter(filter).map(p=>'<option value="'+Number(p.id)+'">'+escapeHtml(accountLabel(p))+'</option>').join('');el.value=selected;};
 const linkedIds=new Set(linkedAccounts().map(p=>String(p.id)));
 const availableIds=new Set(wallets.filter(w=>Number(w.available)>0).map(w=>String(w.participant_id)));
 make('r2ParentParticipant',()=>true,'Select account');make('r2ParentReferrer',()=>true,'No referrer (root)');make('r2MerchantSelect',p=>p.kind==='MERCHANT','Select merchant');updateMerchantCurrencyNotice();make('r2RecipientSelect',p=>linkedIds.has(String(p.id)),'Select upstream account');make('r2WithdrawParticipant',p=>availableIds.has(String(p.id)),'Select funded account');
}
function renderNetwork(){
 const linked=linkedAccounts(),countByParent=new Map();
 for(const p of networkRows)if(p.parent_id!=null){const id=String(p.parent_id);countByParent.set(id,(countByParent.get(id)||0)+1);}
 const search=($('r2NetworkSearch')?.value||'').trim().toLowerCase(),kind=$('r2NetworkKind')?.value||'';
 const matches=orderedNetwork(linked).filter(p=>(!kind||p.kind===kind)&&(!search||[p.account_code,p.display_name,p.referrer_code,p.kind].some(v=>String(v||'').toLowerCase().includes(search))));
 draw('r2Participants',matches,p=>row([p.account_code||'#'+p.id,p.kind+(p.kind==='MERCHANT'&&p.currency?' · '+p.currency:''),p.display_name,p.referrer_code||'Root',countByParent.get(String(p.id))||0,p.generation??'-',p.generation_rate_percent==null?'-':(p.generation_rate_valid===false?'Invalid':p.generation_rate_percent+'%')]),7);
 const count=$('r2NetworkCount');if(count){const relationships=networkRows.filter(p=>p.parent_id!=null).length;count.textContent=matches.length+' of '+linked.length+' linked accounts · '+relationships+' referrals';}
}
function renderGenerationRates(){
 const area=$('r2GenOverrides');if(!area)return;
 const entries=[...configuredGenerationRates].sort((a,b)=>a[0]-b[0]);
 area.innerHTML=entries.length?entries.map(([level,rate])=>'<span class="r2-generation-chip"><strong>Gen '+level+'</strong> '+escapeHtml(rate.toLocaleString('en-MY',{maximumFractionDigits:4}))+'% <button type="button" class="r2-generation-edit" data-r2-edit-generation="'+level+'" aria-label="Edit generation '+level+' rate" title="Edit rate">Edit</button> <button type="button" class="r2-generation-remove" data-r2-remove-generation="'+level+'" aria-label="Remove generation '+level+' rate" title="Remove rate">×</button></span>').join(''):'No rates set yet. Add a generation and its rate above.';
}
function renderGenerationPreview(){
 const area=$('r2GenerationPreview');if(!area)return;
 const entries=[...configuredGenerationRates].sort((a,b)=>a[0]-b[0]);
 area.innerHTML=entries.length?entries.map(([level,rate])=>'<span class="r2-generation-chip"><strong>Gen '+level+'</strong> '+escapeHtml(rate.toLocaleString('en-MY',{maximumFractionDigits:4}))+'%</span>').join(''):'No rates set yet.';
}
function syncGenerationPolicy(policy){
 generationPolicy=policy;
 const status=$('r2GenerationStatus');
 if(status){status.textContent=policy?.configured?'Active':'Not configured';status.classList.toggle('r2-generation-unset',!policy?.configured);}
 configuredGenerationRates.clear();
 const date=$('r2GenFrom');if(date)date.value=policy?.rates?.[0]?.effective_from?String(policy.rates[0].effective_from).substring(0,10):'';
 for(const entry of policy?.rates||[]){
  const level=Number(entry.generation_no),rate=Number(entry.rate_percent);
  if(Number.isSafeInteger(level)&&level>=1&&Number.isFinite(rate)&&rate>=0&&rate<=100)configuredGenerationRates.set(level,rate);
 }
 renderGenerationRates();renderGenerationPreview();
}
function addGenerationRate(){
 const levelInput=$('r2GenOverrideLevel'),rateInput=$('r2GenOverrideRate');
 const level=Number(levelInput?.value),rate=Number(rateInput?.value);
 if(!levelInput?.value||!Number.isSafeInteger(level)||level<1||level>2147483647){feedback('Enter a valid generation number (1 or higher).',true);return;}
 if(!rateInput?.value||!Number.isFinite(rate)||rate<0||rate>100||!/^\d+(?:\.\d{1,4})?$/.test(rateInput.value.trim())){feedback('Enter a rate between 0 and 100% (up to 4 decimals).',true);return;}
 if(!configuredGenerationRates.has(level)&&configuredGenerationRates.size>=1000){feedback('You can save up to 1,000 generation rates.',true);return;}
 configuredGenerationRates.set(level,rate);levelInput.value='';rateInput.value='';
 renderGenerationRates();renderGenerationPreview();feedback('Generation '+level+' is set to '+rate+'%. Click Save commission rates to apply it.');
}
async function refresh(){
 const paths=['summary','participants','collections','receipts','wallets','withdrawals','ledger','reconciliation','reversals','audit'];
 const items=await Promise.all(paths.map(async x=>[x,await request('/'+x)]));const data=Object.fromEntries(items);
 try{syncGenerationPolicy(await request('/generation-policy'));}
 catch(error){
  generationPolicy=null;
  const status=$('r2GenerationStatus');
  if(status){status.textContent='Unable to load settings';status.classList.add('r2-generation-unset');}
  renderGenerationPreview();
 }
 networkRows=data.participants;
 renderEnrolledAgents();
 const s=data.summary;$('r2Summary').innerHTML=[['Linked accounts',linkedAccounts().length],['Invoices',s.collections],['Billed',price(s.billed)],['Verified',price(s.verified)],['Commission credited',price(s.credited)],['Pending payouts',s.withdrawalsPending]].map(([name,value],i)=>'<div class="metric agent-admin-metric r2-summary-metric"><span class="bo-summary-icon"><i class="bi '+['bi-people','bi-receipt','bi-cash-stack','bi-patch-check','bi-wallet2','bi-hourglass-split'][i]+'"></i></span><div><span>'+escapeHtml(name)+'</span><strong>'+escapeHtml(value)+'</strong></div></div>').join('');
 renderNetwork();
 try{
  const discovery=await request('/merchant-discovery');const info=$('r2MerchantDiscovery');
  const status=`Merchant source: ${discovery.scope==='BOSS'?'Boss (all active brands)':'Current brand only'} · ${discovery.referralMerchants} of ${discovery.eligibleMerchants} available`;
  for(const info of [$('r2MerchantDiscovery'),$('r2MerchantDiscoveryNetwork')]){
   if(!info)continue;info.textContent=status;info.classList.toggle('r2-discovery-warning',discovery.scope!=='BOSS'||Number(discovery.referralMerchants)<Number(discovery.eligibleMerchants));
  }
 }catch(error){const info=$('r2MerchantDiscovery');if(info){info.textContent='Merchant discovery check unavailable: '+error.message;info.classList.add('r2-discovery-warning');}}
 populateNetworkSelects(data.wallets);
 draw('r2Collections',data.collections,c=>row([c.id,c.reference,c.merchant_name,c.billing_mode,price(c.billed_amount),price(c.verified_amount),price(c.outstanding),friendlyStatus(c.status)]),8);
 draw('r2Receipts',data.receipts,r=>'<tr>'+[r.id,r.collection_id,r.payment_reference,price(r.amount),friendlyStatus(r.status)].map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'<td>'+(r.status==='PENDING'?action('Verify','verify',r.id)+action('Reject','reject-receipt',r.id):'')+(['VERIFIED','CALCULATED'].includes(r.status)?action('Calculate','calculate',r.id):'')+(r.status==='CALCULATED'?action('Approve','approve',r.id):'')+(r.status==='APPROVED'?action('Request commission correction','reverse',r.id):'')+'</td></tr>',6);
 financeViewData=data;
 renderFinanceTables();
 draw('r2Withdrawals',data.withdrawals,w=>'<tr>'+[w.id,w.display_name,w.reference,price(w.amount),friendlyStatus(w.status),w.payout_reference||'-'].map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'<td>'+(w.status==='PENDING'?action('Approve withdrawal','approve-withdraw',w.id):'')+(['PENDING','APPROVED'].includes(w.status)?action('Decline','reject-withdraw',w.id):'')+(w.status==='APPROVED'?action('Confirm payment','pay-withdraw',w.id):'')+'</td></tr>',7);
 draw('r2Reversals',data.reversals,r=>'<tr>'+[r.id,r.receipt_id,r.reason,r.requested_by,friendlyStatus(r.status)].map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'<td>'+(r.status==='PENDING'?action('Confirm correction','approve-reversal',r.id):'')+'</td></tr>',6);
 draw('r2Ledger',data.ledger,l=>row([l.id,l.display_name,transactionType(l.entry_type),price(l.amount),price(l.reserved_delta),paymentReference(l.event_key),l.created_at]),7);
 draw('r2Audit',data.audit,a=>row([a.created_at,a.actor_id,auditAction(a.action),a.entity_id,a.detail]),5);
}
function renderFinanceTables(){
 if(!financeViewData)return;
 const data=financeViewData;
 const activityIds=new Set([...data.ledger,...data.withdrawals].map(r=>String(r.participant_id)));
 const hasAmount=r=>['balance','reserved','ledger_balance','ledger_reserved','discrepancy','reserved_discrepancy'].some(k=>Math.abs(Number(r[k]||0))>0.0000001);
 const wallets=$('r2ShowInactiveWallets')?.checked?data.wallets:data.wallets.filter(w=>hasAmount(w)||activityIds.has(String(w.participant_id)));
 draw('r2Wallets',wallets,w=>row([w.display_name+' (#'+w.participant_id+')',w.kind,price(w.balance),price(w.reserved),price(w.available)]),5);
 const reconciliation=$('r2ShowInactiveReconciliation')?.checked?data.reconciliation:data.reconciliation.filter(r=>hasAmount(r)||activityIds.has(String(r.id)));
 draw('r2Reconciliation',reconciliation,r=>{const bad=Number(r.discrepancy)!==0||Number(r.reserved_discrepancy)!==0;return '<tr'+(bad?' class="table-danger"':'')+'>'+[r.id,r.display_name,price(r.balance),price(r.ledger_balance),price(r.discrepancy),price(r.reserved),price(r.ledger_reserved),price(r.reserved_discrepancy)].map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'</tr>'},8);
}
function bindForm(form,callback){const el=$(form);el?.addEventListener('submit',async ev=>{ev.preventDefault();const b=read(el);try{feedback('Saving…');await callback(b);feedback('Saved successfully.');await refresh();}catch(err){feedback(err.message,true);}});}
function renderEnrolledAgents(){
 const agents=networkRows.filter(p=>p.kind==='AGENT');
 draw('r2EnrolledAgents',agents,p=>row([p.account_code||'-',p.display_name||'-',p.referrer_code||'-',p.id]),4);
}
function bind(){
 setupTableTools();
 for(const id of ['r2ShowInactiveWallets','r2ShowInactiveReconciliation'])$(id)?.addEventListener('change',renderFinanceTables);
 document.querySelectorAll('[data-r2-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.r2Tab)));
 show($('r2FinancePage')?.dataset.r2DefaultTab||'overview');
 bindForm('r2CreateAgentForm',b=>request('/agents/create',{method:'POST',body:body(b)}));
 bindForm('r2EnrollAgentForm',b=>request('/participants',{method:'POST',body:body({kind:'AGENT',accountCode:b.accountCode,referrerCode:b.referrerCode||null})}));
 bindForm('r2ParentForm',b=>{const id=b.id;delete b.id;return request('/participants/'+encodeURIComponent(id)+'/parent',{method:'POST',body:body({parentId:b.parentId?Number(b.parentId):null})});});
 $('r2NetworkSearch')?.addEventListener('input',renderNetwork);
 $('r2NetworkKind')?.addEventListener('change',renderNetwork);
 $('r2MerchantSelect')?.addEventListener('change',updateMerchantCurrencyNotice);
 $('r2ParentParticipant')?.addEventListener('change',()=>{const p=networkRows.find(x=>String(x.id)===$('r2ParentParticipant').value);if($('r2ParentReferrer'))$('r2ParentReferrer').value=p?.parent_id==null?'':String(p.parent_id);});
 bindForm('r2GenerationPolicy',b=>{
  if(!configuredGenerationRates.size)throw Error('Add at least one generation rate before saving.');
  return request('/generation-policy',{method:'POST',body:body({...b,rates:[...configuredGenerationRates].sort((a,c)=>a[0]-c[0]).map(([generation,ratePercent])=>({generation,ratePercent}))})});
 });
 $('r2GenOverrideAdd')?.addEventListener('click',addGenerationRate);
 $('r2GenOverrides')?.addEventListener('click',event=>{
  const edit=event.target.closest('[data-r2-edit-generation]');
  if(edit){const level=Number(edit.dataset.r2EditGeneration);$('r2GenOverrideLevel').value=level;$('r2GenOverrideRate').value=configuredGenerationRates.get(level);$('r2GenOverrideRate').focus();return;}
  const remove=event.target.closest('[data-r2-remove-generation]');if(!remove)return;
  configuredGenerationRates.delete(Number(remove.dataset.r2RemoveGeneration));
  renderGenerationRates();renderGenerationPreview();feedback('Rate removed from the form. Save commission rates to apply.');
 });
 bindForm('r2CreateCollection',b=>request('/collections',{method:'POST',body:body(b)}));
 bindForm('r2SubmitReceipt',b=>{const id=b.collectionId;delete b.collectionId;return request('/collections/'+encodeURIComponent(id)+'/receipts',{method:'POST',body:body(b)});});
 bindForm('r2Manual',b=>{const id=b.receiptId;delete b.receiptId;return request('/receipts/'+encodeURIComponent(id)+'/manual',{method:'POST',body:body(b)});});
 bindForm('r2Withdraw',b=>request('/withdrawals',{method:'POST',body:body(b)}));
 $('r2InspectAllocations')?.addEventListener('submit',async ev=>{ev.preventDefault();try{const id=read(ev.currentTarget).receiptId;const rows=await request('/allocations/'+encodeURIComponent(id));draw('r2Allocations',rows,r=>row([r.id,r.receipt_id,r.recipient_name+' (#'+r.recipient_id+')',r.depth,r.mode,r.rate_percent,price(r.amount),friendlyStatus(r.status)]),8);show('approvals');}catch(err){feedback(err.message,true);}});
 document.addEventListener('click',async ev=>{const target=ev.target.closest('[data-r2-command],[data-r2-action]');if(!target)return;if(target.dataset.r2Action==='refresh'){await refresh().then(()=>feedback('Updated')).catch(err=>feedback(err.message,true));return;}
 const id=target.dataset.id,command=target.dataset.r2Command;if(!id||!command)return;
 const label=target.textContent.trim();if(!window.confirm(label+' for record #'+id+'?'))return;
 let path='',payload=null;
 if(command==='verify'||command==='calculate'||command==='approve'||command==='reverse')path='/receipts/'+id+'/'+command;
 if(command==='reject-receipt')path='/receipts/'+id+'/reject';
 if(command==='approve-reversal')path='/reversals/'+id+'/approve';
 if(command==='approve-withdraw'||command==='reject-withdraw'||command==='pay-withdraw')path='/withdrawals/'+id+'/'+command.replace('-withdraw','');
 if(command==='reverse'||command==='reject-withdraw'||command==='reject-receipt'){const reason=window.prompt(command==='reverse'?'Reason for correcting commission':'Reason for declining');if(!reason?.trim())return;payload={reason:reason.trim()};}
 if(command==='pay-withdraw'){const ref=window.prompt('External payout transaction reference');if(!ref?.trim())return;payload={payoutReference:ref.trim()};}
 try{target.disabled=true;feedback('Processing…');await request(path,{method:'POST',...(payload?{body:body(payload)}:{})});feedback('Action completed.');await refresh();}catch(err){feedback(err.message,true);}finally{target.disabled=false;}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();refresh().catch(e=>feedback(e.message,true));});else{bind();refresh().catch(e=>feedback(e.message,true));}
})();
