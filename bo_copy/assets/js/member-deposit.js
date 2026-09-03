(function(){
  let page=1,totalPages=1,currentRows=[];
  function pageButtons(current,total){
    total=Math.max(1,Number(total)||1); current=Math.max(1,Math.min(Number(current)||1,total));
    const pages=[]; const add=n=>{if(n>=1&&n<=total&&!pages.includes(n))pages.push(n);};
    add(1); for(let n=current-2;n<=current+2;n++) add(n); add(total); pages.sort((a,b)=>a-b);
    let html='<div class="smart-pagination" role="navigation" aria-label="Table pagination">';
    html+='<button type="button" class="smart-page first" data-page="1" '+(current<=1?'disabled':'')+' title="First page"><i class="bi bi-chevron-bar-left"></i></button>';
    let prev=0; pages.forEach(n=>{if(prev&&n-prev>1)html+='<span class="smart-page-ellipsis">…</span>'; html+='<button type="button" class="smart-page '+(n===current?'active':'')+'" data-page="'+n+'" '+(n===current?'aria-current="page"':'')+'>'+n+'</button>'; prev=n;});
    html+='<button type="button" class="smart-page last" data-page="'+total+'" '+(current>=total?'disabled':'')+' title="Last page"><i class="bi bi-chevron-bar-right"></i></button>';
    html+='</div><span class="smart-page-summary">Page '+current+' / '+total+'</span>'; return html;
  }
  function endpoint(k){return API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
  function money(v){return num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function dt(v){return window.BO_FORMAT?.dateTime?window.BO_FORMAT.dateTime(v):(v?String(v).replace('T',' ').slice(0,19):'-');}
  async function api(url,opt){const res=await fetch(url,opt||{headers:{...BO_AUTH.authHeader()}});const json=await res.json().catch(()=>({}));if(!res.ok||json.status==='error')throw new Error(json.message||'Request failed');return json;}

  let paymentMethodsCache=null;
  async function paymentMethods(){
    if(paymentMethodsCache)return paymentMethodsCache;
    const json=await api(endpoint('PAYMENT_METHOD_LIST'));
    const d=json.data||{};
    paymentMethodsCache=Array.isArray(d)?d:(d.content||d.items||d.list||[]);
    return paymentMethodsCache;
  }
  function bankLabel(m){return [m.displayName,m.bankName,m.accountNumber].filter(Boolean).join(' · ')||('Bank #'+m.id);}
  function bankDetailHtml(m){if(!m)return '';const rows=[['Bank / Display Name',m.displayName],['Bank Name',m.bankName],['Account Name',m.accountName],['Account Number',m.accountNumber],['Pay ID',m.payId],['Method Type',m.methodType]].filter(x=>x[1]);return rows.length?`<div class="player-bank-detail">${rows.map(x=>`<div><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}</div>`:'';}
  function depositProofUrl(row){
    if(!row?.proofImage)return '';
    const raw=String(row.proofImage).trim();
    if(!raw)return '';
    if(/^https?:\/\//i.test(raw))return raw;
    const base=String(API_CONFIG.STATIC_UPLOAD_BASE_URL||'').replace(/\/api\/?$/,'').replace(/\/$/,'');
    if(raw.startsWith('/uploads/'))return base+raw;
    if(raw.startsWith('uploads/'))return base+'/'+raw;
    return base+'/uploads/deposit-proof/'+raw.replace(/^\/+/, '');
  }
  function proofPreviewHtml(row){
    const url=depositProofUrl(row);
    if(!url)return '';
    return `<div class="deposit-proof-confirm"><span class="deposit-proof-label">Proof</span><button type="button" class="deposit-proof-thumb" data-proof-preview="${esc(url)}" title="Click to view deposit proof"><img src="${esc(url)}" alt="Deposit proof" loading="lazy"><span><i class="bi bi-arrows-fullscreen"></i> View Proof</span></button></div>`;
  }
  function openProofPreview(url){
    if(!url)return;
    const old=document.getElementById('depositProofPreviewPopup');if(old)old.remove();
    const wrap=document.createElement('div');wrap.id='depositProofPreviewPopup';
    wrap.innerHTML=`<div class="deposit-proof-preview-backdrop" data-proof-close><div class="deposit-proof-preview-dialog" role="dialog" aria-modal="true" aria-label="Deposit proof preview" onclick="event.stopPropagation()"><div class="deposit-proof-preview-head"><strong>Deposit Proof</strong><button type="button" data-proof-close>&times;</button></div><div class="deposit-proof-preview-body"><img src="${esc(url)}" alt="Deposit proof image"></div></div></div><style>#depositProofPreviewPopup .deposit-proof-preview-backdrop{position:fixed;inset:0;z-index:100500;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:24px}.deposit-proof-preview-dialog{width:min(900px,96vw);max-height:92vh;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.35)}.deposit-proof-preview-head{height:56px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb}.deposit-proof-preview-head strong{font-size:16px}.deposit-proof-preview-head button{border:0;background:transparent;font-size:28px;line-height:1;color:#475569}.deposit-proof-preview-body{padding:16px;background:#f8fafc;display:flex;align-items:center;justify-content:center;max-height:calc(92vh - 56px);overflow:auto}.deposit-proof-preview-body img{display:block;max-width:100%;max-height:calc(92vh - 90px);object-fit:contain;border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,.12)}</style>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-proof-close]').forEach(el=>el.addEventListener('click',()=>wrap.remove()));
    const onKey=e=>{if(e.key==='Escape'){wrap.remove();document.removeEventListener('keydown',onKey);}};
    document.addEventListener('keydown',onKey);
  }
  function norm(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');}
  function resolvePlayerBank(row,methods){
    if(!row||!Array.isArray(methods))return null;
    // Primary source of truth: the exact payment-method ID submitted by Naga.
    const id=row.paymentMethodId;
    if(id!=null&&id!==''){
      const byId=methods.find(m=>String(m.id)===String(id));
      if(byId)return byId;
    }
    // Backward-compatible fallback for older rows that stored a bank/display value instead of an ID.
    const rawCandidates=[row.paymentMethodDisplayName,row.paymentMethodBankName,row.paymentMethodAccountName,row.paymentMethodAccountNumber,row.paymentMethodPayId,row.paymentMethod].map(norm).filter(Boolean);
    if(!rawCandidates.length)return null;
    const exact=methods.filter(m=>rawCandidates.some(raw=>[m.displayName,m.bankName,m.accountName,m.accountNumber,m.payId].some(v=>norm(v)===raw)));
    if(exact.length===1)return exact[0];
    // A generic method type is safe only when exactly one configured bank uses that type.
    const byType=methods.filter(m=>rawCandidates.some(raw=>norm(m.methodType)===raw));
    if(byType.length===1)return byType[0];
    return null;
  }
  function approvalPopup(options){
    return new Promise(resolve=>{
      const old=document.getElementById('bankApprovalPopup'); if(old)old.remove();
      const wrap=document.createElement('div');wrap.id='bankApprovalPopup';wrap.innerHTML=`<div class="bank-approval-backdrop"><div class="bank-approval-dialog"><div class="bank-approval-head"><div><h3>${esc(options.title)}</h3><small>${esc(options.subtitle||'')}</small></div><button type="button" data-close>&times;</button></div><div class="bank-approval-body">${options.summaryHtml||''}<label class="bank-approval-label">${esc(options.bankLabel||'Bank')}</label><select class="form-select" data-bank><option value="">-- Select bank / payment method --</option>${options.methods.map(m=>`<option value="${esc(m.id)}" ${String(m.id)===String(options.defaultBankId||'')?'selected':''}>${esc(bankLabel(m))}${Number(m.status)===1?'':' [INACTIVE]'}</option>`).join('')}</select><label class="bank-approval-label mt-3">Admin Remark</label><textarea class="form-control" rows="3" data-remark placeholder="Optional admin remark"></textarea><div class="bank-approval-warning">${esc(options.warning||'')}</div></div><div class="bank-approval-foot"><button class="clean-btn" type="button" data-close>Cancel</button><button class="btn-primary-clean" type="button" data-confirm>${esc(options.confirmText||'Confirm')}</button></div></div></div>`;
      const style=document.createElement('style');style.textContent=`#bankApprovalPopup .bank-approval-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.46);display:flex;align-items:center;justify-content:center;padding:18px;z-index:99999}.bank-approval-dialog{width:min(600px,100%);background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.25);overflow:hidden}.bank-approval-head{display:flex;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid #e5e7eb}.bank-approval-head h3{font-size:18px;margin:0 0 3px}.bank-approval-head small{color:#64748b}.bank-approval-head button{border:0;background:transparent;font-size:26px;line-height:1;color:#64748b}.bank-approval-body{padding:20px 22px}.bank-approval-summary{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:16px;line-height:1.55}.player-bank-detail{margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:7px 16px}.player-bank-detail div{display:flex;flex-direction:column;line-height:1.35}.player-bank-detail span{font-size:11px;color:#64748b}.player-bank-detail b{font-size:13px;color:#0f172a;overflow-wrap:anywhere}.bank-approval-label{display:block;font-weight:700;font-size:13px;margin-bottom:7px}.bank-approval-warning{font-size:12px;color:#b45309;margin-top:12px}.deposit-proof-confirm{margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0}.deposit-proof-label{display:block;font-size:11px;color:#64748b;margin-bottom:7px}.deposit-proof-thumb{width:100%;display:flex;align-items:center;gap:12px;padding:8px;border:1px solid #dbe4f0;border-radius:10px;background:#fff;text-align:left;color:#1e40af;font-weight:700;font-size:12px;cursor:pointer}.deposit-proof-thumb:hover{border-color:#93c5fd;background:#f8fbff}.deposit-proof-thumb img{width:76px;height:58px;object-fit:cover;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc}.deposit-proof-thumb span{display:flex;align-items:center;gap:6px}.bank-approval-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #e5e7eb}@media(max-width:560px){.player-bank-detail{grid-template-columns:1fr}}`;wrap.appendChild(style);document.body.appendChild(wrap);const bankSelect=wrap.querySelector('[data-bank]');if(bankSelect&&options.defaultBankId!=null&&options.defaultBankId!=='')bankSelect.value=String(options.defaultBankId);
      const finish=v=>{wrap.remove();resolve(v);};wrap.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>finish(null));wrap.querySelector('[data-confirm]').onclick=()=>{const bankId=wrap.querySelector('[data-bank]').value;if(!bankId){BO_DIALOG.alert('Please select a bank/payment method.',{title:'Bank Required',type:'error'});return;}finish({paymentMethodId:Number(bankId),adminRemark:wrap.querySelector('[data-remark]').value.trim()});};
    });
  }
  function q(){
    const params=new URLSearchParams();
    const kw=document.getElementById('depositKeyword')?.value.trim();
    const st=document.getElementById('depositStatus')?.value.trim();
    const from=document.getElementById('depositFrom')?.value;
    const to=document.getElementById('depositTo')?.value;
    const sz=document.getElementById('depositSize')?.value||'20';
    if(kw)params.set('keyword',kw); if(st)params.set('status',st); if(from)params.set('dateFrom',from); if(to)params.set('dateTo',to);
    params.set('page',page); params.set('size',sz); return params.toString();
  }
  function metric(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
  function renderSummary(summary,pendingCount,pendingAmount){
    metric('wdPendingCount',num(pendingCount).toLocaleString());
    metric('wdPendingAmount',money(pendingAmount));
    metric('depositTotalAmount',money(summary?.totalAmount));
  }
  function pendingQuery(){
    const params=new URLSearchParams();
    const kw=document.getElementById('depositKeyword')?.value.trim();
    const from=document.getElementById('depositFrom')?.value;
    const to=document.getElementById('depositTo')?.value;
    if(kw)params.set('keyword',kw);
    params.set('status','PENDING');
    if(from)params.set('dateFrom',from);
    if(to)params.set('dateTo',to);
    params.set('page','1');
    params.set('size','1');
    return params.toString();
  }
  async function resolvePending(mainData){
    const selected=String(document.getElementById('depositStatus')?.value||'').toUpperCase();
    const source=selected==='PENDING'?mainData:(await api(endpoint('MEMBER_DEPOSIT_LIST')+'?'+pendingQuery())).data||{};
    return {
      count:num(source?.pagination?.totalElements),
      amount:num(source?.summary?.totalAmount)
    };
  }
  function render(rows,pagination){
    currentRows=rows; const body=document.getElementById('depositBody'); if(!body)return;
    if(!rows.length) body.innerHTML='<tr><td colspan="8">No deposit request found.</td></tr>';
    else body.innerHTML=rows.map(r=>{
      const pending=String(r.status||'').toUpperCase()==='PENDING';
      return `<tr><td>${esc(dt(r.createdAt))}</td><td><b>${esc(r.username||'-')}</b><br><small>ID: ${esc(r.memberId)} ${r.mobile?'• '+esc(r.mobile):''}</small></td><td><b>${money(r.amount)}</b></td><td><b>${esc(r.paymentMethod||'-')}</b>${r.approvedPaymentMethod?`<br><small>Confirmed: ${esc(r.approvedPaymentMethod)}</small>`:''}</td><td>${esc(r.referenceNo||'-')}</td><td><span class="status-pill ${r.status==='APPROVED'?'active':r.status==='REJECTED'?'off':''}">${esc(r.status||'-')}</span></td><td>${esc(dt(r.processedAt))}</td><td>${pending?`<div class="d-flex gap-2 flex-wrap"><button class="btn btn-success btn-sm" data-approve="${esc(r.id)}">Approve</button><button class="btn btn-danger btn-sm" data-reject="${esc(r.id)}">Reject</button></div>`:'-'}</td></tr>`;
    }).join('');
    totalPages=Number(pagination?.totalPages)||1;
    document.getElementById('depositPager').innerHTML=pageButtons(page,totalPages);
    document.getElementById('depositPageInfo').textContent=`${Number(pagination?.totalElements||rows.length).toLocaleString()} request(s)`;
    document.getElementById('depositPrevBtn').disabled=page<=1; document.getElementById('depositNextBtn').disabled=page>=totalPages;
  }
  async function load(){
    const body=document.getElementById('depositBody'); if(body)body.innerHTML='<tr><td colspan="8">Loading...</td></tr>';
    try{const json=await api(endpoint('MEMBER_DEPOSIT_LIST')+'?'+q()); const data=json.data||{}; render(data.content||[],data.pagination||{}); const pending=await resolvePending(data); renderSummary(data.summary||{},pending.count,pending.amount);}
    catch(e){renderSummary({},0,0);if(body)body.innerHTML='<tr><td colspan="8" class="text-danger">'+esc(e.message)+'</td></tr>';}
  }
  async function action(id,type){
    const row=currentRows.find(x=>String(x.id)===String(id));
    if(type==='reject'){
      const remark=await BO_DIALOG.prompt('Enter an admin remark for this deposit request.','',{title:'Admin Remark',inputLabel:'Admin remark',confirmText:'Continue'});if(remark===null)return;
      if(!(await BO_DIALOG.confirm('Confirm reject deposit request?',{title:'Confirm Deposit Rejection'})))return;
      try{const json=await api(endpoint('MEMBER_DEPOSIT_REJECT')+'/'+encodeURIComponent(id),{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Username':String(BO_AUTH.user()?.username||'ADMIN'),...BO_AUTH.authHeader()},body:JSON.stringify({adminRemark:remark})});BO_DIALOG.alert(json.message||'Done',{title:'Deposit Updated'});await load();document.dispatchEvent(new CustomEvent('bo:wallet-request-updated',{detail:{type:'deposit',action:type,id:String(id)}}));}catch(e){BO_DIALOG.alert(e.message||'Action failed',{title:'Deposit Action Failed',type:'error'});}return;
    }
    try{
      const methods=await paymentMethods();
      const playerBank=resolvePlayerBank(row,methods);
      const playerSelectedText=playerBank?bankLabel(playerBank):(row?.paymentMethodDisplayName||row?.paymentMethod||'-');
      const detailSource=playerBank||{displayName:row?.paymentMethodDisplayName,bankName:row?.paymentMethodBankName,accountName:row?.paymentMethodAccountName,accountNumber:row?.paymentMethodAccountNumber,payId:row?.paymentMethodPayId,methodType:row?.paymentMethodMethodType};
      const picked=await approvalPopup({title:'Final Deposit Confirmation',subtitle:'Confirm the bank that actually received this money.',methods,defaultBankId:playerBank?.id,bankLabel:'Actual Receiving Bank',confirmText:'Approve Deposit',warning:playerBank?'Player-selected bank is preselected automatically. Change it only when the money was actually received by another bank.':'This older/ambiguous request does not contain a unique bank ID. Please select the actual receiving bank before approval.',summaryHtml:`<div class="bank-approval-summary"><b>Member:</b> ${esc(row?.username||'-')} (#${esc(row?.memberId||'-')})<br><b>Amount:</b> ${money(row?.amount)}<br><b>Player Selected:</b> ${esc(playerSelectedText)}${bankDetailHtml(detailSource)}${proofPreviewHtml(row)}</div>`});
      if(!picked)return;
      if(!(await BO_DIALOG.confirm(`Approve ${money(row?.amount)} and assign it to the selected receiving bank?`,{title:'Confirm Deposit Approval'})))return;
      const json=await api(endpoint('MEMBER_DEPOSIT_APPROVE')+'/'+encodeURIComponent(id),{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Username':String(BO_AUTH.user()?.username||'ADMIN'),...BO_AUTH.authHeader()},body:JSON.stringify({adminRemark:picked.adminRemark,paymentMethodId:picked.paymentMethodId})});BO_DIALOG.alert(json.message||'Done',{title:'Deposit Updated'});await load();document.dispatchEvent(new CustomEvent('bo:wallet-request-updated',{detail:{type:'deposit',action:type,id:String(id)}}));
    }catch(e){BO_DIALOG.alert(e.message||'Action failed',{title:'Deposit Action Failed',type:'error'});}
  }
  document.addEventListener('click',e=>{const proof=e.target.closest?.('[data-proof-preview]');if(proof){e.preventDefault();e.stopPropagation();openProofPreview(proof.dataset.proofPreview);return;}const a=e.target.closest?.('[data-approve]'); const r=e.target.closest?.('[data-reject]'); if(a)action(a.dataset.approve,'approve'); if(r)action(r.dataset.reject,'reject');});
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('depositSearchBtn')?.addEventListener('click',()=>{page=1;load();});
    document.getElementById('depositKeyword')?.addEventListener('keydown',e=>{if(e.key==='Enter'){page=1;load();}});
    document.getElementById('depositStatus')?.addEventListener('change',()=>{page=1;load();});
    document.getElementById('depositSize')?.addEventListener('change',()=>{page=1;load();});
    ['depositFrom','depositTo'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{page=1;load();}));
    document.getElementById('depositResetBtn')?.addEventListener('click',()=>{document.getElementById('depositKeyword').value='';document.getElementById('depositStatus').value='PENDING';const today=new Date();const iso=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');document.getElementById('depositFrom').value=iso;document.getElementById('depositTo').value=iso;document.getElementById('depositFrom').dispatchEvent(new Event('change',{bubbles:true}));page=1;load();});
    document.getElementById('depositPrevBtn')?.addEventListener('click',()=>{if(page>1){page--;load();}}); document.getElementById('depositNextBtn')?.addEventListener('click',()=>{if(page<totalPages){page++;load();}});
    document.getElementById('depositPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;const n=Number(b.dataset.page);if(n>=1&&n<=totalPages&&n!==page){page=n;load();}});
    setTimeout(load,0);
  });
})();
