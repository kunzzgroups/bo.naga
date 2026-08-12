(function(){
  let page = 1;
  let totalPages = 1;
  const initialParams = new URLSearchParams(location.search);
  const allTimeScope = initialParams.get('scope') === 'all';
  const LEDGER_TYPES = ['DEPOSIT','WITHDRAW','ADJUSTMENT','BONUS','ADMIN_DEPOSIT','ADMIN_WITHDRAW','ADMIN_ADJUSTMENT','BULK_ADJUSTMENT','REFERRAL_REWARD','REBATE','REBATE_ADJUSTMENT','BET','WIN','LOSE','SETTLE','ROLLBACK'];
  const WALLET_TO_WALLET_TYPES = new Set(['TRANSFER_IN','TRANSFER_OUT']);
  const selectedTypes = new Set();

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
  function url(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function dt(v){ return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-'); }
  async function api(endpoint){
    const res = await fetch(endpoint, {headers:{...BO_AUTH.authHeader()}});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  function selectedTypeList(){ return [...selectedTypes].filter(type => !WALLET_TO_WALLET_TYPES.has(type)); }
  function effectiveTypeList(){
    const selected = selectedTypeList();
    // Wallet Ledger intentionally excludes wallet-to-wallet transfers. When no
    // individual type is selected, explicitly request every supported non-transfer
    // type so the backend can keep pagination and totals accurate.
    return selected.length ? selected : [...LEDGER_TYPES];
  }
  function syncTypeControl(){
    const list=selectedTypeList();
    const hidden=document.getElementById('ledgerType');
    const label=document.getElementById('ledgerTypeLabel');
    const all=document.getElementById('ledgerTypeAll');
    if(hidden) hidden.value=list.join(',');
    if(all) all.checked=list.length===0;
    document.querySelectorAll('[data-ledger-type]').forEach(cb=>{cb.checked=selectedTypes.has(cb.dataset.ledgerType);});
    if(label) label.textContent=list.length===0?'All':(list.length===1?list[0]:`${list.length} selected`);
  }
  function setSelectedTypes(values){
    selectedTypes.clear();
    (values||[]).map(v=>String(v||'').trim().toUpperCase()).filter(v=>LEDGER_TYPES.includes(v)).forEach(v=>selectedTypes.add(v));
    syncTypeControl();
  }
  function initTypeMulti(){
    const options=document.getElementById('ledgerTypeOptions');
    const wrap=document.getElementById('ledgerTypeMulti');
    const trigger=document.getElementById('ledgerTypeTrigger');
    const menu=document.getElementById('ledgerTypeMenu');
    if(!options||!wrap||!trigger||!menu)return;
    options.innerHTML=LEDGER_TYPES.map(t=>`<label class="ledger-type-option"><input type="checkbox" data-ledger-type="${t}"><span>${t}</span></label>`).join('');
    trigger.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;wrap.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));});
    options.addEventListener('change',e=>{const cb=e.target.closest('[data-ledger-type]');if(!cb)return;cb.checked?selectedTypes.add(cb.dataset.ledgerType):selectedTypes.delete(cb.dataset.ledgerType);syncTypeControl();});
    document.getElementById('ledgerTypeAll')?.addEventListener('change',e=>{if(e.target.checked)setSelectedTypes([]);});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.hidden=true;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');}});
    syncTypeControl();
  }
  function setFromUrl(){
    const sp = new URLSearchParams(location.search);
    if(sp.get('memberId')) document.getElementById('ledgerMemberId').value = sp.get('memberId');
    const rawTypes = sp.get('types') || sp.get('type') || '';
    if(rawTypes) setSelectedTypes(rawTypes.split(','));
    if(sp.get('scope') === 'all'){
      document.body.dataset.walletLedgerAllTime = '1';
      const from = document.getElementById('ledgerFrom');
      const to = document.getElementById('ledgerTo');
      if(from) from.value = '';
      if(to) to.value = '';
    }
  }
  function params(){
    const p = new URLSearchParams();
    const memberId = document.getElementById('ledgerMemberId')?.value.trim();
    const provider = document.getElementById('ledgerProviderCode')?.value.trim();
    const types = selectedTypeList();
    const from = document.getElementById('ledgerFrom')?.value;
    const to = document.getElementById('ledgerTo')?.value;
    const size = document.getElementById('ledgerSize')?.value || '20';
    if(memberId) p.set('memberId', memberId);
    if(provider) p.set('providerCode', provider);
    p.set('types', effectiveTypeList().join(','));
    if(from) p.set('from', from);
    if(to) p.set('to', to);
    p.set('page', page);
    p.set('size', size);
    return p.toString();
  }
  function metric(id, v){ const el=document.getElementById(id); if(el) el.textContent = money(v); }
  function updateMetrics(rows){
    const byType = rows.reduce((m,r)=>{ m[r.ledgerType] = (m[r.ledgerType] || 0) + num(r.amount); return m; },{});
    metric('wlDeposit', (byType.DEPOSIT || 0) + (byType.ADMIN_DEPOSIT || 0));
    metric('wlWithdraw', Math.abs((byType.WITHDRAW || 0) + (byType.ADMIN_WITHDRAW || 0)));
    metric('wlTransfer', (byType.TRANSFER_IN || 0) + (byType.TRANSFER_OUT || 0));
    metric('wlBetWinLose', (byType.BET || 0) + (byType.WIN || 0) + (byType.LOSE || 0) + (byType.SETTLE || 0));
  }
  function render(rows, pagination, meta){
    const body=document.getElementById('walletLedgerBody'); if(!body) return;
    updateMetrics(rows);
    if(!rows.length){ body.innerHTML='<tr><td colspan="15">No ledger records found.</td></tr>'; }
    else body.innerHTML = rows.map(r => {
      const amt = num(r.amount);
      return `<tr>
        <td>${esc(dt(r.createdAt || r.created_at))}</td>
        <td>${esc(dt(r.postedAt || r.posted_at || r.completedAt || r.approvedAt))}</td>
        <td><b>${esc(r.username || '-')}</b><br><small>ID: ${esc(r.memberId || '')}</small></td>
        <td>${esc(r.providerCode || '-')}</td>
        <td><span class="status-pill">${esc(r.ledgerType || '-')}</span></td>
        <td><b class="${amt < 0 ? 'text-danger' : 'text-success'}">${money(amt)}</b></td>
        <td>${money(r.beforeBalance)}</td>
        <td>${money(r.afterBalance)}</td>
        <td>${esc(r.gameCode || '-')}</td>
        <td><b>${esc(r.createdBy || r.adjustedBy || '-')}</b></td>
        <td><b>${esc(r.approvedBy || r.reviewedBy || '-')}</b></td>
        <td>${esc(r.reasonCode || r.reason || '-')}</td>
        <td><small>${esc(r.relatedId || r.referenceNo || r.depositId || r.withdrawalId || r.bonusId || r.rebateId || '-')}</small></td>
        <td><small>${esc(r.remark || '-')}</small></td>
        <td>${esc(r.status || '-')}</td>
      </tr>`;
    }).join('');
    totalPages = Number(pagination && pagination.totalPages) || 1;
    const total = Number(pagination && pagination.totalElements) || rows.length;
    document.getElementById('ledgerPager').innerHTML = pageButtons(page, totalPages);
    const filteredTotal = Number(meta && meta.filteredTotalAmount);
    const selectedType = selectedTypeList().length ? selectedTypeList().join(', ') : 'ALL EXCEPT WALLET-TO-WALLET';
    const scopeLabel = (meta && meta.filterScope === 'ALL_TIME') || allTimeScope ? 'All Time' : 'Selected Date';
    document.getElementById('ledgerPageInfo').textContent = `${total.toLocaleString()} record(s) · ${scopeLabel} ${selectedType} Total: ${money(Number.isFinite(filteredTotal) ? filteredTotal : rows.reduce((a,r)=>a+num(r.amount),0))}`;
    document.getElementById('ledgerPrevBtn').disabled = page <= 1;
    document.getElementById('ledgerNextBtn').disabled = page >= totalPages;
  }
  async function load(){
    const body=document.getElementById('walletLedgerBody'); if(body) body.innerHTML='<tr><td colspan="15">Loading ledger...</td></tr>';
    try{
      const json = await api(url('WALLET_LEDGER_LIST') + '?' + params());
      const data = json.data || {};
      render(Array.isArray(data.content) ? data.content : [], data.pagination || {}, data);
    }catch(e){
      updateMetrics([]);
      if(body) body.innerHTML='<tr><td colspan="15" class="text-danger">'+esc(e.message || 'Load failed')+'</td></tr>';
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    initTypeMulti();
    setFromUrl();
    document.getElementById('ledgerSearchBtn')?.addEventListener('click', ()=>{ page=1; load(); });
    ['ledgerMemberId','ledgerProviderCode'].forEach(id=>document.getElementById(id)?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ page=1; load(); } }));
    ['ledgerFrom','ledgerTo','ledgerSize'].forEach(id=>document.getElementById(id)?.addEventListener('change', ()=>{ page=1; load(); }));
    document.getElementById('ledgerResetBtn')?.addEventListener('click', ()=>{
      ['ledgerMemberId','ledgerProviderCode'].forEach(id=>document.getElementById(id).value='');
      setSelectedTypes([]);
      const now=new Date(), pad=n=>String(n).padStart(2,'0');
      const today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
      document.getElementById('ledgerFrom').value=today;
      document.getElementById('ledgerTo').value=today;
      document.getElementById('ledgerFrom').dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('ledgerTo').dispatchEvent(new Event('change',{bubbles:true}));
      page=1; load();
    });
    document.getElementById('ledgerPrevBtn')?.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
    document.getElementById('ledgerNextBtn')?.addEventListener('click', ()=>{ if(page<totalPages){ page++; load(); } });
    document.getElementById('ledgerPager')?.addEventListener('click', e=>{ const b=e.target.closest('[data-page]'); if(!b)return; const n=Number(b.dataset.page); if(n>=1&&n<=totalPages&&n!==page){page=n;load();} });
    load();
  });
})();
