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
/* `-` = auto-fit: as many rows as the panel's body is tall. That is the locked option set's first
   entry (`-` · 10 · 20 · 50 · 100 · All) and it is what the Agents page defaults to; a client-paged
   table can honour it because the panel is viewport-locked (see referral-v2-standard.css), so the
   available height is a stable number instead of something that chases its own row count. */
const AUTO_PAGE_SIZE='auto';
function tableData(id,records,render,colspan){
 let state=pageState.get(id);
 if(!state){const card=$(id)?.closest?.('.r2-table-panel');const multi=!card?.classList.contains('r2-table-panel-fit')&&!$(id)?.closest?.('.r2-stack-fit');state={page:1,size:multi?DEFAULT_PAGE_SIZE:AUTO_PAGE_SIZE,search:'',records:[],render:null,colspan};pageState.set(id,state);}
 state.records=records||[];state.render=render;state.colspan=colspan;
 paintTable(id);
}
function tableSearchText(r){return JSON.stringify(r).toLocaleLowerCase();}
function paintTable(id){
 const state=pageState.get(id),body=$(id);if(!body||!state)return;
 const matches=state.search?state.records.filter(r=>tableSearchText(r).includes(state.search)):state.records;
 const size=state.size===AUTO_PAGE_SIZE?autoRows(id):state.size;
 const totalPages=Math.max(1,Math.ceil(matches.length/size));
 state.page=Math.max(1,Math.min(state.page,totalPages));
 const start=(state.page-1)*size;
 body.innerHTML=matches.length?matches.slice(start,start+size).map(state.render).join(''):
  '<tr><td colspan="'+state.colspan+'" class="text-muted py-3">'+(id==='r2Participants'?'No referral relationships found':'No matching records')+'</td></tr>';
 const footer=$('r2Pager_'+id);if(!footer)return;
 const from=matches.length?start+1:0,to=Math.min(start+size,matches.length);
 footer.querySelector('[data-r2-total]').textContent=`Showing ${from} to ${to} of ${matches.length} entries`;
 const pages=footer.querySelector('[data-r2-pages]');pages.innerHTML='';
 /* Locked footer anatomy (.interface-design/system.md -> Table footer pager):
    First · Prev · pages(+ellipsis) · Next · Last. Prev/next alone is not shipped on a touched listing. */
 const make=(label,page,{disabled=false,active=false,aria,icon=null}={})=>{
  const btn=document.createElement('button');btn.type='button';btn.className='r2-pager-btn'+(active?' active':'');
  /* Opt out of the global button standard: bo-ui-standard.js stamps `bo-ui-button-secondary` /
     `bo-ui-icon-button` on any bare button, which replaced this pager's amber active gradient with
     the cream secondary fill (measured: active page painted #FFF8EB, background-image none). */
  btn.setAttribute('data-bo-ui-skip','');
  if(icon){const glyph=document.createElement('i');glyph.className='bi '+icon;glyph.setAttribute('aria-hidden','true');btn.appendChild(glyph);}
  else btn.textContent=label;
  btn.disabled=disabled;btn.setAttribute('aria-label',aria);
  if(active)btn.setAttribute('aria-current','page');
  btn.addEventListener('click',()=>{state.page=page;paintTable(id);});pages.appendChild(btn);
 };
 make(null,1,{disabled:state.page===1,aria:'First page',icon:'bi-chevron-bar-left'});
 make('‹',state.page-1,{disabled:state.page===1,aria:'Previous page'});
 const candidates=new Set([1,totalPages,state.page-1,state.page,state.page+1]);
 let last=0;
 for(const number of [...candidates].filter(v=>v>0&&v<=totalPages).sort((a,b)=>a-b)){
  if(last&&number-last>1){const gap=document.createElement('span');gap.className='r2-pager-ellipsis';gap.textContent='…';pages.appendChild(gap);}
  make(String(number),number,{active:number===state.page,aria:'Page '+number});last=number;
 }
 make('›',state.page+1,{disabled:state.page===totalPages,aria:'Next page'});
 make(null,totalPages,{disabled:state.page===totalPages,aria:'Last page',icon:'bi-chevron-bar-right'});
}
/* Rows that fit the table body right now: the scroller's height minus its sticky head, divided by the
   height of a real row (measured, not guessed - the row carries its own padding and font size). */
function autoRows(id){
 const body=$(id),table=body?.closest('table'),wrapper=table?.closest('.table-responsive');
 if(!wrapper)return DEFAULT_PAGE_SIZE;
 const head=table.querySelector('thead');
 const row=body.querySelector('tr');
 const headH=head?head.getBoundingClientRect().height:0;
 const rowH=row&&row.getBoundingClientRect().height?row.getBoundingClientRect().height:41;
 const usable=wrapper.clientHeight-headH;
 return Math.max(1,Math.floor(usable/Math.max(24,rowH)));
}
function setupTableTools(){
 const ids=['r2Participants','r2EnrolledAgents','r2Collections','r2Receipts','r2Allocations','r2Wallets','r2Withdrawals','r2Reconciliation','r2Ledger','r2Reversals','r2Audit'];
 for(const id of ids){
  const body=$(id),table=body?.closest('table'),wrapper=table?.closest('.table-responsive');
  if(!wrapper||!table||document.getElementById('r2Pager_'+id))continue;
  table.classList.add('r2-data-table');
  if(id!=='r2Participants'&&!wrapper.hasAttribute('data-r2-no-toolbar')){
   /* A card may ship its own toolbar row so the table can name itself ("Invoices" / "Individual
      receipts"); the search and the actions then fill that row instead of stacking a second one. */
   const authored=document.querySelector('[data-r2-toolbar="'+id+'"]');
   const toolbar=authored||document.createElement('div');
   if(!authored)toolbar.className='r2-list-toolbar';
   const searchHtml='<label class="r2-list-search-label"><i class="bi bi-search" aria-hidden="true"></i><input class="r2-list-search" type="search" placeholder="Search records" aria-label="Search records"/></label>';
   const actionsSlot=toolbar.querySelector('.r2-toolbar-actions');
   if(actionsSlot)actionsSlot.insertAdjacentHTML('beforebegin',searchHtml);else toolbar.insertAdjacentHTML('beforeend',searchHtml);
   /* The panel ships its toolbar actions as markup, not as a string here: the links stay editable
      in the page and survive a SPA swap. They belong on the right, beside the search field. */
   const actions=document.querySelector('[data-r2-table-actions="'+id+'"]');
   if(actions){actions.hidden=false;toolbar.appendChild(actions);}
   if(!authored)wrapper.before(toolbar);
   if(!authored){
    toolbar.querySelector('input').addEventListener('input',e=>{
     const state=pageState.get(id);if(!state)return;state.search=e.target.value.trim().toLocaleLowerCase();state.page=1;paintTable(id);
    });
   }else{
    /* one field in the card's own toolbar: it drives whichever dataset is on screen */
    const input=toolbar.querySelector('.r2-list-search');
    input?.addEventListener('input',e=>{
     const host=toolbar.closest('[data-r2-panel]');
     const visible=host?.querySelector('[data-r2-dataset]:not([hidden])');
     const target=visible?.querySelector('tbody')?.id||id;
     const state=pageState.get(target);if(!state)return;
     state.search=e.target.value.trim().toLocaleLowerCase();state.page=1;paintTable(target);
    });
   }
  }
  const footer=document.createElement('div');footer.className='r2-table-footer';footer.id='r2Pager_'+id;
  /* The locked option set is `-` · 10 · 20 · 50 · 100 · All. `-` means "auto-fit to the panel height", which
     needs a measured viewport height this client-paged table does not have, so it stays out (shortcut:).
     All = 10000, the same cap the reference pages use. */
  /* `-` (fit the panel) only makes sense where the panel's height is fixed; in a multi-table panel the
     height follows the rows, so the select starts on the plain count of 10. */
  const cardEl=wrapper.closest('.r2-table-panel');const multi=!(cardEl&&cardEl.classList.contains('r2-table-panel-fit'));
  footer.innerHTML='<label class="r2-page-size">Show <select aria-label="Rows per page"><option value="auto"'+(multi?'':'" selected="selected')+'>-</option><option value="10"'+(multi?' selected="selected"':'')+'>10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="10000">All</option></select> entries</label><span data-r2-total></span><div class="r2-pager-pages" data-r2-pages></div>';
  wrapper.after(footer);
  footer.querySelector('select').addEventListener('change',e=>{
   const state=pageState.get(id);if(!state)return;const raw=e.target.value;state.size=raw===AUTO_PAGE_SIZE?AUTO_PAGE_SIZE:(Number(raw)||DEFAULT_PAGE_SIZE);state.page=1;paintTable(id);
  });
 }
}

/* The two "create / enrol" forms are modals on this page, not separate pages: the list is the whole
   job, and a round trip through a second document lost the reader's tab and scroll position.
   Markup uses the site's own `.modal-clean` shell (it lives under <body>, outside #r2FinancePage). */
function setModal(id,show){
 const modal=$(id);if(!modal)return;
 modal.hidden=!show;modal.classList.toggle('show',show);modal.setAttribute('aria-hidden',String(!show));
 if(show){const first=modal.querySelector('input:not([type="hidden"]),select');if(first)setTimeout(()=>first.focus(),40);}
}
/* A dialog cannot report through the page-level slot: that line sits BEHIND the overlay, so the reader
   sees nothing (reported: "validation 展示在弹窗后面"). Every message therefore goes to the nearest
   slot: the dialog's own when the control lives in one, the page's otherwise. */
const slotFor=el=>{const modal=el&&el.closest?el.closest('.r2-modal'):null;const own=modal?modal.querySelector('.r2-modal-feedback'):null;return own||$('r2Feedback');};
const say=(node,message,isError=false)=>{if(!node)return;node.textContent=message;if(node.classList.contains('r2-modal-feedback')){node.classList.toggle('is-error',isError);}else{node.className=isError?'alert alert-danger':'alert alert-info';}};
const feedback=(message,isError=false)=>say($('r2Feedback'),message,isError);
async function request(path,opts={}){
 const token=window.BO_AUTH?.authHeader?.()||{};
 const response=await fetch(base()+apiRoot+path,{...opts,cache:'no-store',headers:{...token,...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.status!=='success')throw Error(data.message||data.detail||('Request failed: '+response.status));
 return data.data;
}
function read(form){const data={};new FormData(form).forEach((value,key)=>{if(String(value).trim()!=='')data[key]=String(value).trim()});return data;}
function body(v){return JSON.stringify(v)}
function show(tab,silent){
 tab=validTab(tab)?tab:($('r2FinancePage')?.dataset.r2DefaultTab||'overview');
 document.querySelectorAll('[data-r2-panel]').forEach(p=>{p.hidden=p.dataset.r2Panel!==tab});
 document.querySelectorAll('[data-r2-tab]').forEach(btn=>{const selected=btn.dataset.r2Tab===tab;btn.classList.toggle('is-active',selected);btn.setAttribute('aria-selected',String(selected));});
 /* A hidden panel measures 0px tall, so an auto-fitted table inside it could only ever lay out one
    row. Repaint once the panel is on screen and has a real height. */
 for(const [id,state] of pageState)if(state.size===AUTO_PAGE_SIZE)paintTable(id);
 /* The selected tab lives in the URL, so a refresh - or a link into the page - keeps the panel the
    reader was on instead of dropping back to the default. replaceState, not pushState: this is one
    page, and Back should leave the page rather than walk its tabs. */
 if(!silent){try{const url=new URL(location.href);url.searchParams.set('tab',tab);history.replaceState(null,'',url.href);}catch(e){}}
}
function validTab(tab){const key=String(tab||'').replace(/[^a-z0-9-]/gi,'');return !!key&&!!document.querySelector('[data-r2-tab="'+key+'"]');}
function tabFromUrl(){try{return new URLSearchParams(location.search).get('tab')||'';}catch(e){return '';}}
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
function action(label,act,id,disabled=false){
 const danger=/reject|decline|reverse/i.test(act)?' r2-act-danger':'';
 /* No `btn` classes: the shell paints `.btn-outline-primary` as solid amber with forced white ink, which
    fought this recipe. A page-owned class means one owner for these row actions. */
 return '<button type="button" data-bo-ui-skip class="r2-act-btn'+danger+'" '+(disabled?'disabled ':'')+'data-r2-command="'+act+'" data-id="'+id+'">'+escapeHtml(label)+'</button>';}
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
}
/* The panel lists what the server holds; the dialog edits a buffer of the same shape and only writes
   on Save. Re-seeding on open is what makes Cancel real: the buffer is rebuilt from the saved policy,
   not from whatever the last abandoned edit left behind. */
function renderSavedRates(){
 const area=$('r2GenerationSaved');if(!area)return;
 const rates=(generationPolicy&&Array.isArray(generationPolicy.rates))?generationPolicy.rates:[];
 area.innerHTML=rates.length?rates.map(r=>'<tr><td>'+(Number(r.generation_no)||'-')+'</td><td>'+(r.rate_percent==null?'-':escapeHtml(String(Number(r.rate_percent))+'%'))+'</td><td>'+(r.effective_from?escapeHtml(String(r.effective_from).substring(0,10)):'-')+'</td></tr>').join(''):
  '<tr><td colspan="3" class="text-center">No rates configured yet. Use Set commission rates to add one.</td></tr>';
}
function seedGenerationBuffer(){
 configuredGenerationRates.clear();
 for(const entry of (generationPolicy&&generationPolicy.rates)||[]){
  const level=Number(entry.generation_no),rate=Number(entry.rate_percent);
  if(Number.isSafeInteger(level)&&level>=1&&Number.isFinite(rate)&&rate>=0&&rate<=100)configuredGenerationRates.set(level,rate);
 }
 const date=$('r2GenFrom');
 if(date)date.value=generationPolicy&&generationPolicy.rates&&generationPolicy.rates[0]&&generationPolicy.rates[0].effective_from?String(generationPolicy.rates[0].effective_from).substring(0,10):'';
 renderGenerationRates();
}
function renderGenerationRates(){
 const area=$('r2GenOverrides');if(!area)return;
 const wrap=area.closest('.r2-generation-table-wrap');
 const entries=[...configuredGenerationRates].sort((a,b)=>a[0]-b[0]);
 /* With nothing configured the column headings describe nothing - the block becomes a placeholder
    instead of a table with an apology under it. */
 if(wrap)wrap.classList.toggle('is-empty',!entries.length);
 /* The configured rates are tabular data - generation, rate, and the two row actions - so they are a
    table like every other list on the page, not a row of chips that duplicated the same numbers. */
 area.innerHTML=entries.length?entries.map(([level,rate])=>'<tr><td>'+escapeHtml(String(level))+'</td><td>'+escapeHtml(rate.toLocaleString('en-MY',{maximumFractionDigits:4}))+'%</td><td class="r2-col-actions"><button type="button" class="r2-ico-btn" data-r2-edit-generation="'+level+'" aria-label="Edit generation '+level+' rate" title="Edit generation '+level+' rate"><i class="bi bi-pencil" aria-hidden="true"></i></button><button type="button" class="r2-ico-btn is-danger" data-r2-remove-generation="'+level+'" aria-label="Remove generation '+level+' rate" title="Remove generation '+level+' rate"><i class="bi bi-trash3" aria-hidden="true"></i></button></td></tr>').join(''):
  '<tr><td colspan="3" class="r2-generation-empty"><i class="bi bi-percent" aria-hidden="true"></i><span>No rates configured yet.<small>Add a generation and its rate above, then save.</small></span></td></tr>';
}
function syncGenerationPolicy(policy){
 generationPolicy=policy;
 const status=$('r2GenerationStatus');
 if(status){status.textContent=policy?.configured?'Active':'Not configured';status.classList.toggle('r2-generation-unset',!policy?.configured);}
 renderSavedRates();
 /* Refresh runs after a save too, so the buffer is re-seeded from the new truth; while the dialog is
    open the reader's half-finished edits stay untouched. */
 if(!$('r2GenerationModal')||$('r2GenerationModal').hidden)seedGenerationBuffer();
}
/* Validation belongs to the field that failed: a line under that input and a red edge on it. The
   dialog-wide line is only for form-level outcomes (saved, or a server error). */
function fieldError(input,node,message){
 if(input)input.classList.toggle('is-invalid',!!message);
 if(node){node.textContent=message||'';node.hidden=!message;}
}
function clearRateErrors(){
 fieldError($('r2GenOverrideLevel'),$('r2GenLevelError'),'');
 fieldError($('r2GenOverrideRate'),$('r2GenRateError'),'');
}
function addGenerationRate(){
 const levelInput=$('r2GenOverrideLevel'),rateInput=$('r2GenOverrideRate');
 const level=Number(levelInput?.value),rate=Number(rateInput?.value);
 const slot=slotFor($('r2GenOverrideLevel'));
 if(!levelInput?.value||!Number.isSafeInteger(level)||level<1||level>2147483647){fieldError(levelInput,$('r2GenLevelError'),'Must be 1 or higher.');levelInput?.focus();return;}
 if(!rateInput?.value||!Number.isFinite(rate)||rate<0||rate>100||!/^\d+(?:\.\d{1,4})?$/.test(rateInput.value.trim())){fieldError(rateInput,$('r2GenRateError'),'Must be 0-100, max 4 decimals.');rateInput?.focus();return;}
 if(!configuredGenerationRates.has(level)&&configuredGenerationRates.size>=1000){say(slot,'You can save up to 1,000 generation rates.',true);return;}
 configuredGenerationRates.set(level,rate);levelInput.value='';rateInput.value='';clearRateErrors();
 renderGenerationRates();say(slot,'Generation '+level+' set to '+rate+'%. Press Save commission rates to apply it.');
}
async function refresh(){
 const paths=['summary','participants','collections','receipts','wallets','withdrawals','ledger','reconciliation','reversals','audit'];
 const items=await Promise.all(paths.map(async x=>[x,await request('/'+x)]));const data=Object.fromEntries(items);
 try{syncGenerationPolicy(await request('/generation-policy'));}
 catch(error){
  generationPolicy=null;
  const status=$('r2GenerationStatus');
  if(status){status.textContent='Unable to load settings';status.classList.add('r2-generation-unset');}
 }
 networkRows=data.participants;
 renderEnrolledAgents();
 const s=data.summary;
 /* Each tile carries the specimen's note line (`bo-summary-note`, owned by agent-admin-management.css),
    the way the Agents page does: the value alone does not say whether it is lifetime, pending or raised. */
 $('r2Summary').innerHTML=[['Linked accounts',linkedAccounts().length,'All time'],['Invoices',s.collections,'Raised'],['Billed',price(s.billed),'Invoiced total'],['Verified',price(s.verified),'Payments confirmed'],['Commission credited',price(s.credited),'All time'],['Pending payouts',s.withdrawalsPending,'Awaiting approval']].map(([name,value,note],i)=>'<div class="metric agent-admin-metric r2-summary-metric"><div class="bo-summary-icon"><i class="bi '+['bi-people','bi-receipt','bi-cash-stack','bi-patch-check','bi-wallet2','bi-hourglass-split'][i]+'"></i></div><div><span>'+escapeHtml(name)+'</span><strong>'+escapeHtml(value)+'</strong><span class="bo-summary-note">'+escapeHtml(note)+'</span></div></div>').join('');
 renderNetwork();
 try{
  const discovery=await request('/merchant-discovery');const info=$('r2MerchantDiscovery');
  const status=`Merchant source: ${discovery.scope==='BOSS'?'Boss (all active brands)':'Current brand only'} · ${discovery.referralMerchants} of ${discovery.eligibleMerchants} available`;
  /* One host: the Overview panel states where the merchant list comes from. */
  if(info){info.textContent=status;info.classList.toggle('r2-discovery-warning',discovery.scope!=='BOSS'||Number(discovery.referralMerchants)<Number(discovery.eligibleMerchants));}
 }catch(error){const info=$('r2MerchantDiscovery');if(info){info.textContent='Merchant discovery check unavailable: '+error.message;info.classList.add('r2-discovery-warning');}}
 populateNetworkSelects(data.wallets);
 draw('r2Collections',data.collections,c=>row([c.id,c.reference,c.merchant_name,c.billing_mode,price(c.billed_amount),price(c.verified_amount),price(c.outstanding),friendlyStatus(c.status)]),8);
 const segInv=document.querySelector('[data-r2-seg-count="invoices"]'),segRec=document.querySelector('[data-r2-seg-count="receipts"]');
 /* the brackets are drawn by CSS (::before/::after), exactly like the merchant-detail capsules */
 if(segInv)segInv.textContent=String(data.collections?.length||0);
 if(segRec)segRec.textContent=String(data.receipts?.length||0);
 const setSeg=(key,value)=>{const el=document.querySelector('[data-r2-seg-count="'+key+'"]');if(el)el.textContent=String(value||0);};
 setSeg('balances',data.wallets?.length);
 setSeg('withdrawals',data.withdrawals?.length);
 setSeg('recon',data.reconciliation?.length);
 setSeg('transactions',data.ledger?.length);
 setSeg('corrections',data.reversals?.length);
 setSeg('activity',data.audit?.length);
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
function bindForm(form,callback){const el=$(form);el?.addEventListener('submit',async ev=>{ev.preventDefault();const b=read(el);const slot=slotFor(el);try{say(slot,'Saving…');await callback(b);say(slot,'Saved successfully.');await refresh();}catch(err){say(slot,err.message,true);}});}
function renderEnrolledAgents(){
 const agents=networkRows.filter(p=>p.kind==='AGENT');
 draw('r2EnrolledAgents',agents,p=>row([p.account_code||'-',p.display_name||'-',p.referrer_code||'-',p.id]),4);
}
function bind(){
 setupTableTools();
 /* Capsule switch inside one card: the datasets swap, and the single search field re-points to the
    table now on screen (its query is per table state, so it starts clean rather than filtering the
    other list with a term the reader cannot see). */
 function activateDataset(name,origin){
  /* The host is the panel that owns the clicked capsule - not "the first toolbar in the document", which
     is why every capsule outside Merchant Collections did nothing (reported: "胶囊点不到"). */
  const host=(origin&&origin.closest?origin.closest('[data-r2-panel]'):null)||document.querySelector('[data-r2-toolbar]')?.closest('[data-r2-panel]');
  if(!host)return;
  host.querySelectorAll('[data-r2-dataset]').forEach(el=>{el.hidden=el.dataset.r2Dataset!==name;});
  host.querySelectorAll('[data-r2-seg]').forEach(btn=>{const on=btn.dataset.r2Seg===name;btn.classList.toggle('is-active',on);btn.setAttribute('aria-selected',String(on));});
  const input=host.querySelector('.r2-list-search');
  if(input)input.value='';
  const id=name==='invoices'?'r2Collections':'r2Receipts';
  const st=pageState.get(id);
  /* Repaint only when the field actually held a term - an unconditional repaint rebuilt every row's
     buttons on each switch, which is the other half of the flash. */
  if(st&&st.search){st.search='';st.page=1;paintTable(id);}
 }
 document.addEventListener('click',ev=>{
  const opener=ev.target.closest('[data-r2-open]');
  if(opener){if(opener.dataset.r2Open==='r2GenerationModal')seedGenerationBuffer();setModal(opener.dataset.r2Open,true);return;}
  const closer=ev.target.closest('[data-r2-close]');
  if(closer){const modal=closer.closest('.r2-modal');if(modal)setModal(modal.id,false);return;}
  /* clicking the backdrop (not the panel) closes */
  if(ev.target.classList&&ev.target.classList.contains('r2-modal'))setModal(ev.target.id,false);
 });
 document.querySelectorAll('[data-r2-seg]').forEach(btn=>btn.addEventListener('click',()=>activateDataset(btn.dataset.r2Seg,btn)));
 document.addEventListener('keydown',ev=>{
  if(ev.key!=='Escape')return;
  document.querySelectorAll('.r2-modal.show').forEach(modal=>setModal(modal.id,false));
 });
 /* A window that grows or shrinks changes how many rows fit an auto-fitted table. One debounced
    listener for the whole page; paintTable is cheap and only touches rows it already has. */
 let resizeTimer=null;
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{for(const [id,state] of pageState)if(state.size===AUTO_PAGE_SIZE)paintTable(id);},150);});
 for(const id of ['r2ShowInactiveWallets','r2ShowInactiveReconciliation'])$(id)?.addEventListener('change',renderFinanceTables);
 document.querySelectorAll('[data-r2-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.r2Tab)));
 show(tabFromUrl()||$('r2FinancePage')?.dataset.r2DefaultTab||'overview',true);
 bindForm('r2CreateAgentForm',b=>request('/agents/create',{method:'POST',body:body(b)}).then(r=>{setModal('r2CreateAgentModal',false);const f=$('r2CreateAgentForm');if(f)f.reset();return r;}));
 bindForm('r2EnrollAgentForm',b=>request('/participants',{method:'POST',body:body({kind:'AGENT',accountCode:b.accountCode,referrerCode:b.referrerCode||null})}).then(r=>{setModal('r2EnrollAgentModal',false);return r;}));
 bindForm('r2ParentForm',b=>{const id=b.id;delete b.id;return request('/participants/'+encodeURIComponent(id)+'/parent',{method:'POST',body:body({parentId:b.parentId?Number(b.parentId):null})}).then(r=>{setModal('r2ParentModal',false);return r;});});
 $('r2NetworkSearch')?.addEventListener('input',renderNetwork);
 $('r2NetworkKind')?.addEventListener('change',renderNetwork);
 $('r2MerchantSelect')?.addEventListener('change',updateMerchantCurrencyNotice);
 $('r2ParentParticipant')?.addEventListener('change',()=>{const p=networkRows.find(x=>String(x.id)===$('r2ParentParticipant').value);if($('r2ParentReferrer'))$('r2ParentReferrer').value=p?.parent_id==null?'':String(p.parent_id);});
 bindForm('r2GenerationPolicy',b=>{
  if(!configuredGenerationRates.size)throw Error('Add at least one generation rate before saving.');
  return request('/generation-policy',{method:'POST',body:body({...b,rates:[...configuredGenerationRates].sort((a,c)=>a[0]-c[0]).map(([generation,ratePercent])=>({generation,ratePercent}))})})
   .then(r=>{setModal('r2GenerationModal',false);return r;});
 });
 $('r2GenOverrideAdd')?.addEventListener('click',addGenerationRate);
 $('r2GenOverrideLevel')?.addEventListener('input',()=>fieldError($('r2GenOverrideLevel'),$('r2GenLevelError'),''));
 $('r2GenOverrideRate')?.addEventListener('input',()=>fieldError($('r2GenOverrideRate'),$('r2GenRateError'),''));
 $('r2GenOverrides')?.addEventListener('click',event=>{
  const edit=event.target.closest('[data-r2-edit-generation]');
  if(edit){const level=Number(edit.dataset.r2EditGeneration);$('r2GenOverrideLevel').value=level;$('r2GenOverrideRate').value=configuredGenerationRates.get(level);$('r2GenOverrideRate').focus();return;}
  const remove=event.target.closest('[data-r2-remove-generation]');if(!remove)return;
  /* A row can be removed with one click, and the trash sits right next to the pencil - ask first.
     Same `window.confirm` the row commands in the tables use, so the page asks in one voice. */
  const level=Number(remove.dataset.r2RemoveGeneration);
  if(!window.confirm('Remove the commission rate for generation '+level+'? It leaves this list now; press Save commission rates to apply the change.'))return;
  configuredGenerationRates.delete(level);
  renderGenerationRates();feedback('Rate removed from the form. Save commission rates to apply.');
 });
 bindForm('r2CreateCollection',b=>request('/collections',{method:'POST',body:body(b)}).then(r=>{setModal('r2CollectionModal',false);const f=$('r2CreateCollection');if(f)f.reset();return r;}));
 bindForm('r2SubmitReceipt',b=>{const id=b.collectionId;delete b.collectionId;return request('/collections/'+encodeURIComponent(id)+'/receipts',{method:'POST',body:body(b)}).then(r=>{setModal('r2ReceiptModal',false);const f=$('r2SubmitReceipt');if(f)f.reset();return r;});});
 bindForm('r2Manual',b=>{const id=b.receiptId;delete b.receiptId;return request('/receipts/'+encodeURIComponent(id)+'/manual',{method:'POST',body:body(b)}).then(r=>{setModal('r2ManualModal',false);const f=$('r2Manual');if(f)f.reset();return r;});});
 bindForm('r2Withdraw',b=>request('/withdrawals',{method:'POST',body:body(b)}));
 $('r2InspectAllocations')?.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const form=ev.currentTarget,slot=slotFor(form);
  try{
   const id=read(form).receiptId;say(slot,'Looking up…');
   const rows=await request('/allocations/'+encodeURIComponent(id));
   draw('r2Allocations',rows,r=>row([r.id,r.receipt_id,r.recipient_name+' (#'+r.recipient_id+')',r.depth,r.mode,r.rate_percent,price(r.amount),friendlyStatus(r.status)]),8);
   setModal('r2LookupModal',false);show('approvals');
  }catch(err){say(slot,err.message,true);}
 });
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
