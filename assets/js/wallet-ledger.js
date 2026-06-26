(function(){
  let page = 1;
  let totalPages = 1;
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
  function setFromUrl(){
    const sp = new URLSearchParams(location.search);
    if(sp.get('memberId')) document.getElementById('ledgerMemberId').value = sp.get('memberId');
  }
  function params(){
    const p = new URLSearchParams();
    const memberId = document.getElementById('ledgerMemberId')?.value.trim();
    const provider = document.getElementById('ledgerProviderCode')?.value.trim();
    const type = document.getElementById('ledgerType')?.value;
    const from = document.getElementById('ledgerFrom')?.value;
    const to = document.getElementById('ledgerTo')?.value;
    const size = document.getElementById('ledgerSize')?.value || '20';
    if(memberId) p.set('memberId', memberId);
    if(provider) p.set('providerCode', provider);
    if(type) p.set('ledgerType', type);
    if(from) p.set('from', from);
    if(to) p.set('to', to);
    p.set('page', page);
    p.set('size', size);
    return p.toString();
  }
  function metric(id, v){ const el=document.getElementById(id); if(el) el.textContent = money(v); }
  function updateMetrics(rows){
    const byType = rows.reduce((m,r)=>{ m[r.ledgerType] = (m[r.ledgerType] || 0) + num(r.amount); return m; },{});
    metric('wlDeposit', byType.DEPOSIT || 0);
    metric('wlWithdraw', Math.abs(byType.WITHDRAW || 0));
    metric('wlTransfer', (byType.TRANSFER_IN || 0) + (byType.TRANSFER_OUT || 0));
    metric('wlBetWinLose', (byType.BET || 0) + (byType.WIN || 0) + (byType.LOSE || 0) + (byType.SETTLE || 0));
  }
  function render(rows, pagination){
    const body=document.getElementById('walletLedgerBody'); if(!body) return;
    updateMetrics(rows);
    if(!rows.length){ body.innerHTML='<tr><td colspan="10">No ledger records found.</td></tr>'; }
    else body.innerHTML = rows.map(r => {
      const amt = num(r.amount);
      return `<tr>
        <td>${esc(dt(r.createdAt || r.created_at))}</td>
        <td><b>${esc(r.username || '-')}</b><br><small>ID: ${esc(r.memberId || '')}</small></td>
        <td>${esc(r.providerCode || '-')}</td>
        <td><span class="status-pill">${esc(r.ledgerType || '-')}</span></td>
        <td><b class="${amt < 0 ? 'text-danger' : 'text-success'}">${money(amt)}</b></td>
        <td>${money(r.beforeBalance)}</td>
        <td>${money(r.afterBalance)}</td>
        <td>${esc(r.gameCode || '-')}</td>
        <td><small>${esc(r.referenceNo || '-')}</small></td>
        <td>${esc(r.status || '-')}</td>
      </tr>`;
    }).join('');
    totalPages = Number(pagination && pagination.totalPages) || 1;
    const total = Number(pagination && pagination.totalElements) || rows.length;
    document.getElementById('ledgerPager').textContent = `Page ${page} / ${totalPages}`;
    document.getElementById('ledgerPageInfo').textContent = `${total.toLocaleString()} record(s)`;
    document.getElementById('ledgerPrevBtn').disabled = page <= 1;
    document.getElementById('ledgerNextBtn').disabled = page >= totalPages;
  }
  async function load(){
    const body=document.getElementById('walletLedgerBody'); if(body) body.innerHTML='<tr><td colspan="10">Loading ledger...</td></tr>';
    try{
      const json = await api(url('WALLET_LEDGER_LIST') + '?' + params());
      const data = json.data || {};
      render(Array.isArray(data.content) ? data.content : [], data.pagination || {});
    }catch(e){
      updateMetrics([]);
      if(body) body.innerHTML='<tr><td colspan="10" class="text-danger">'+esc(e.message || 'Load failed')+'</td></tr>';
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    setFromUrl();
    document.getElementById('ledgerSearchBtn')?.addEventListener('click', ()=>{ page=1; load(); });
    ['ledgerMemberId','ledgerProviderCode'].forEach(id=>document.getElementById(id)?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ page=1; load(); } }));
    ['ledgerType','ledgerFrom','ledgerTo','ledgerSize'].forEach(id=>document.getElementById(id)?.addEventListener('change', ()=>{ page=1; load(); }));
    document.getElementById('ledgerResetBtn')?.addEventListener('click', ()=>{ ['ledgerMemberId','ledgerProviderCode','ledgerType','ledgerFrom','ledgerTo'].forEach(id=>document.getElementById(id).value=''); page=1; load(); });
    document.getElementById('ledgerPrevBtn')?.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
    document.getElementById('ledgerNextBtn')?.addEventListener('click', ()=>{ if(page<totalPages){ page++; load(); } });
    load();
  });
})();
