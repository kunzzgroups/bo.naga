(function(){'use strict';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
 const body=$('madTableBody'),search=$('madSearchInput'),filter=$('madRoleFilter'),modal=$('madEditModal'),form=$('madEditForm');let rows=[],filtered=[],page=1,status='all',editing=null,detail=null;const PAGE=10;
 async function api(path,opt={}){const r=await fetch(API_CONFIG.BASE_URL+path,opt),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data}
 const hdr=()=>({'Content-Type':'application/json',...BO_AUTH.authHeader()}),active=b=>Number(b.status)===1,dt=v=>v?new Date(v).toLocaleString():'-';
 function parseDate(value){
  if(!value) return null;
  try{const d=new Date(value);return isNaN(d.getTime())?null:d;}catch(e){return null;}
 }
 function timeOnly(value){
  const d=parseDate(value); if(!d) return '-';
  const pad=n=>String(n).padStart(2,'0');
  return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
 }
 function dateMmDdYyyy(value){
  const d=parseDate(value); if(!d) return '';
  const pad=n=>String(n).padStart(2,'0');
  return pad(d.getMonth()+1)+'/'+pad(d.getDate())+'/'+d.getFullYear();
 }
 function timeWithDateTip(value){
  if(!value) return '<span class="mad-muted">-</span>';
  const t=timeOnly(value);
  if(t==='-') return '<span class="mad-muted">-</span>';
  const date=dateMmDdYyyy(value);
  if(!date) return '<span class="mad-time">'+esc(t)+'</span>';
  return '<span class="mad-time mad-time-tip" data-date="'+esc(date)+'" tabindex="0">'+esc(t)+'</span>';
 }
 function statusSelect(b){
  const on=active(b);
  const next=on?0:1;
  return `<button type="button" class="mad-status-chip ${on?'is-active':'is-suspended'}" data-merchant-status-toggle="${esc(b.id)}" data-next-status="${next}" title="${on?'Click to Suspend':'Click to Activate'}" aria-label="${on?'Active, click to Suspend':'Suspended, click to Activate'}">
    <i class="mad-status-dot" aria-hidden="true"></i>
    <span class="mad-status-chip-label">${on?'Active':'Suspended'}</span>
  </button>`;
 }
 async function updateMerchantStatus(id, nextStatus, chipEl){
  const row=rows.find(x=>Number(x.id)===Number(id));
  if(!row) return;
  const prev=String(row.status??1);
  if(String(nextStatus)===prev) return;
  if(chipEl){ chipEl.disabled=true; chipEl.classList.add('is-saving'); }
  try{
   await api('/admin/merchants/save',{
    method:'POST',
    headers:hdr(),
    body:JSON.stringify({
     id:Number(id),
     code:row.code||'',
     name:row.name||'',
     primaryDomain:row.primaryDomain||'',
     currency:row.currency||'MYR',
     frontendRoot:row.frontendRoot||'',
     creditMode:row.creditMode||'WHOLE',
     status:Number(nextStatus),
     domainAliases:row.domainAliases||'',
     lowCreditThreshold:row.lowCreditThreshold||0,
     providerMarkupPercent:Number(row.providerMarkupPercent||0)
    })
   });
   row.status=Number(nextStatus);
   apply();
  }catch(e){
   if(window.BO_DIALOG?.alert) BO_DIALOG.alert(e.message,{title:'Unable to Update Status',type:'error'});
   else alert(e.message);
  }finally{
   if(chipEl){ chipEl.disabled=false; chipEl.classList.remove('is-saving'); }
  }
 }
 function apply(){const q=(search?.value||'').trim().toLowerCase(),cur=filter?.value||'';filtered=rows.filter(b=>(status==='all'||(status==='active'&&active(b))||(status==='suspended'&&!active(b)))&&(!cur||b.currency===cur)&&(!q||[b.code,b.name,b.primaryDomain,b.createdByName,b.masterUsername].join(' ').toLowerCase().includes(q)));page=1;render()}
 function render(){const all=rows.length,act=rows.filter(active).length;$('madCountAll').textContent=all;$('madCountActive').textContent=act;$('madCountSuspended').textContent=all-act;const pages=Math.max(1,Math.ceil(filtered.length/PAGE)),st=(page-1)*PAGE,s=filtered.slice(st,st+PAGE);body.innerHTML=s.length?s.map(b=>`<tr><td><div class="mad-user"><span class="mad-avatar">${esc((b.code||'M').slice(0,2))}</span><div class="mad-user-copy"><b>${esc(b.code||'-')}</b><div class="mad-user-meta">#${esc(b.id)}</div></div></div></td><td><b>${esc(b.name||'-')}</b><small class="d-block text-muted">${esc(b.primaryDomain||'-')}</small></td><td>${esc(b.currency||'MYR')}</td><td>${money(b.creditBalance)}</td><td>${timeWithDateTip(b.lastActiveAt||b.masterLastLoginAt||b.updatedAt)}</td><td>${statusSelect(b)}</td><td>${esc(b.createdByName||b.createdByUsername||'Legacy / Migration')}</td><td>${timeWithDateTip(b.masterLastLoginAt)}</td><td>${timeWithDateTip(b.masterLastLogoutAt)}</td><td><button class="mad-merchant-icon-btn" data-view="${b.id}" type="button" title="View / Edit Merchant" aria-label="View / Edit Merchant"><i class="bi bi-pencil"></i></button></td></tr>`).join(''):'<tr><td colspan="10" class="mad-empty">No merchants found.</td></tr>';$('madTableInfo').textContent=filtered.length?`Showing ${st+1} to ${st+s.length} of ${filtered.length} merchants`:'Showing 0 to 0 of 0 merchants';$('madPager').innerHTML=Array.from({length:pages},(_,i)=>`<button type="button" class="${page===i+1?'is-active':''}" data-page="${i+1}">${i+1}</button>`).join('')}
 async function load(){try{rows=await api('/admin/merchants',{headers:BO_AUTH.authHeader()})||[];filter.innerHTML='<option value="">All Currencies</option>'+[...new Set(rows.map(x=>x.currency||'MYR'))].sort().map(x=>`<option>${esc(x)}</option>`).join('');apply();$('madSyncLabel').innerHTML='<i class="bi bi-arrow-repeat"></i> Synced just now'}catch(e){body.innerHTML=`<tr><td colspan="10" class="mad-empty text-danger">${esc(e.message)}</td></tr>`}}
 function providerRows(d){const out=$('madProviderPricingBody');if(!out)return;const assigned=new Map((d.providers||[]).map(x=>[String(x.providerCode||'').toUpperCase(),x]));const markupRaw=String($('madProviderMarkup')?.value ?? d.brand?.providerMarkupPercent ?? '').trim();const markup=Number(markupRaw||0);const platform=d.platformProviders||[];out.innerHTML=platform.length?platform.map(p=>{const code=String(p.code||'').toUpperCase(),bp=assigned.get(code),checked=!!bp&&String(bp.ownership||'PLATFORM').toUpperCase()==='PLATFORM',base=Number(p.settlementCostPercent||0),savedOv=Number(bp?.defaultChargePercent||0),ovShow=savedOv>0?String(savedOv):(markupRaw!==''&&markup!==0?markupRaw:''),eff=base+Number(ovShow||markup||0),basis=String(bp?.chargeBasis||p.settlementCostBasis||'HOUSE_WIN').toUpperCase();return '<tr data-provider-row="'+esc(code)+'" data-base="'+base+'">'+'<td><input type="checkbox" class="form-check-input" data-provider-use '+(checked?'checked':'')+'></td>'+'<td><b>'+esc(code)+'</b><small class="d-block text-muted">'+esc(p.name||'')+'</small></td>'+'<td>'+base.toFixed(4)+'%</td>'+'<td><input type="number" class="form-control form-control-sm" min="0" max="100" step="0.0001" data-provider-override value="'+esc(ovShow)+'" '+(checked?'':'disabled')+' placeholder="—"></td>'+'<td><b data-provider-effective>'+eff.toFixed(4)+'%</b></td>'+'<td>'+(basis==='TURNOVER'?'Turnover':'House Win / GGR')+'</td></tr>';}).join(''):'<tr><td colspan="6" class="text-center text-muted py-3">No platform providers configured.</td></tr>';bindProviderInputs()}
 function bindProviderInputs(){const markup=$('madProviderMarkup');const syncOverridesFromMarkup=()=>{const raw=String(markup?.value??'').trim();document.querySelectorAll('#madProviderPricingBody [data-provider-row]').forEach(r=>{const use=r.querySelector('[data-provider-use]'),inp=r.querySelector('[data-provider-override]');if(!inp)return;inp.disabled=!use?.checked;if(inp.dataset.manual!=='1'){inp.value=(raw===''||raw==='0')?'':raw;}});};const recalc=()=>{const m=Number(markup?.value||0);document.querySelectorAll('#madProviderPricingBody [data-provider-row]').forEach(r=>{const use=r.querySelector('[data-provider-use]'),inp=r.querySelector('[data-provider-override]'),base=Number(r.dataset.base||0);if(inp)inp.disabled=!use?.checked;const ovRaw=String(inp?.value||'').trim();const add=ovRaw!==''?Number(ovRaw):m;const eff=r.querySelector('[data-provider-effective]');if(eff)eff.textContent=(base+Number(add||0)).toFixed(4)+'%';});};if(markup&&!markup.dataset.bound){markup.dataset.bound='1';markup.addEventListener('input',()=>{document.querySelectorAll('#madProviderPricingBody [data-provider-override]').forEach(inp=>{inp.dataset.manual='0';});syncOverridesFromMarkup();recalc();});}document.querySelectorAll('#madProviderPricingBody [data-provider-use]').forEach(x=>x.addEventListener('change',()=>{syncOverridesFromMarkup();recalc();}));document.querySelectorAll('#madProviderPricingBody [data-provider-override]').forEach(x=>x.addEventListener('input',()=>{x.dataset.manual='1';recalc();}));syncOverridesFromMarkup();recalc()}
 async function open(id){try{const d=await api('/admin/merchants/'+id,{headers:BO_AUTH.authHeader()}),b=d.brand||d;detail=d;editing=b;const m=d.masterAccount||await api('/admin/merchants/'+id+'/master-account',{headers:BO_AUTH.authHeader()}).catch(()=>null);$('madEditId').value=b.id;$('madEditCode').value=b.code||'';$('madEditName').value=b.name||'';$('madEditDomain').value=b.primaryDomain||'';$('madEditCurrency').value=b.currency||'MYR';$('madEditFrontendRoot').value=b.frontendRoot||'';$('madEditCreditMode').value=b.creditMode||'WHOLE';$('madEditStatus').value=String(b.status??1);$('madViewPlayerCredit').value=money(b.creditBalance);$('madViewProviderCredit').value=money(b.providerCreditBalance);$('madViewMaster').value=m?.username||b.masterUsername||'-';$('madViewCreatedBy').value=b.createdByName||b.createdByUsername||m?.createdByName||'Legacy / Migration';$('madViewLastLogin').value=dt(m?.lastLoginAt||b.masterLastLoginAt);$('madViewLastLogout').value=dt(m?.lastLogoutAt||b.masterLastLogoutAt);$('madProviderMarkup').value=Number(b.providerMarkupPercent||0);providerRows(d);$('madEditFormStatus').textContent='';modal.classList.add('show');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}catch(e){if(window.BO_DIALOG?.alert)BO_DIALOG.alert(e.message,{title:'Unable to Load Merchant',type:'error'});else alert(e.message)}}
 function close(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
 async function saveProviderPricing(id){const selected=[...document.querySelectorAll('[data-provider-row]')].filter(r=>r.querySelector('[data-provider-use]')?.checked);const old=new Map((detail?.providers||[]).map(x=>[String(x.providerCode||'').toUpperCase(),x]));await api('/admin/merchants/'+id+'/provider-pricing',{method:'POST',headers:hdr(),body:JSON.stringify({providerMarkupPercent:Number($('madProviderMarkup').value||0),providers:selected.map(r=>{const code=r.dataset.providerRow,o=old.get(code)||{},p=(detail?.platformProviders||[]).find(x=>String(x.code||'').toUpperCase()===code)||{};return {providerCode:code,defaultChargePercent:Number(r.querySelector('[data-provider-override]')?.value||0),chargeBasis:String(o.chargeBasis||p.settlementCostBasis||'HOUSE_WIN')};})})});}
 document.querySelectorAll('[data-mad-status]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-mad-status]').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');status=b.dataset.madStatus;apply()});
 search?.addEventListener('input',apply);
 filter?.addEventListener('change',apply);
 $('madResetBtn')?.addEventListener('click',()=>{search.value='';filter.value='';status='all';apply()});
 $('madPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){page=+b.dataset.page;render()}});
 body?.addEventListener('click',e=>{
  const viewBtn=e.target.closest('[data-view]');
  if(viewBtn){ open(viewBtn.dataset.view); return; }

  const chipBtn=e.target.closest('[data-merchant-status-toggle]');
  if(chipBtn){
   if(chipBtn.disabled||chipBtn.classList.contains('is-saving')) return;
   updateMerchantStatus(chipBtn.getAttribute('data-merchant-status-toggle'), chipBtn.getAttribute('data-next-status'), chipBtn);
  }
 });
 document.querySelectorAll('[data-mad-close-edit]').forEach(b=>b.onclick=close);
 form?.addEventListener('submit',async e=>{e.preventDefault();const st=$('madEditFormStatus');try{st.textContent='Saving merchant and provider pricing...';const id=+$('madEditId').value;await api('/admin/merchants/save',{method:'POST',headers:hdr(),body:JSON.stringify({id,code:$('madEditCode').value,name:$('madEditName').value.trim(),primaryDomain:$('madEditDomain').value.trim(),currency:$('madEditCurrency').value.trim(),frontendRoot:$('madEditFrontendRoot').value.trim(),creditMode:$('madEditCreditMode').value,status:+$('madEditStatus').value,domainAliases:editing?.domainAliases||'',lowCreditThreshold:editing?.lowCreditThreshold||0,providerMarkupPercent:Number($('madProviderMarkup').value||0)})});await saveProviderPricing(id);st.textContent='Merchant updated successfully.';await load();setTimeout(close,450)}catch(x){st.textContent=x.message}});
 $('madExportBtn')?.addEventListener('click',()=>{const csv=[['Merchant','Company','Domain','Currency','Credit Balance','Status','Created By','Last Login','Last Logout'],...filtered.map(b=>[b.code,b.name,b.primaryDomain,b.currency,b.creditBalance,active(b)?'Active':'Suspended',b.createdByName||b.createdByUsername||'Legacy / Migration',b.masterLastLoginAt,b.masterLastLogoutAt])].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='merchants.csv';a.click();URL.revokeObjectURL(a.href)});load();
})();
