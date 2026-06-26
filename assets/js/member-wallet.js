(function(){
  let page = 1;
  let totalPages = 1;
  function url(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  async function api(endpoint){
    const res = await fetch(endpoint, {headers:{...BO_AUTH.authHeader()}});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  function query(){
    const params = new URLSearchParams();
    const keyword = document.getElementById('walletKeyword')?.value.trim();
    const size = document.getElementById('walletSize')?.value || '20';
    if(keyword) params.set('keyword', keyword);
    params.set('page', page);
    params.set('size', size);
    return params.toString();
  }
  function metric(id, v){ const el=document.getElementById(id); if(el) el.textContent = money(v); }
  function updateMetrics(rows){
    metric('mwMainTotal', rows.reduce((s,r)=>s+num(r.mainWalletBalance),0));
    metric('mwProviderTotal', rows.reduce((s,r)=>s+num(r.providerWalletBalance),0));
    metric('mwBetTotal', rows.reduce((s,r)=>s+num(r.totalBet),0));
    metric('mwWinLossTotal', rows.reduce((s,r)=>s+num(r.winLoss),0));
  }
  function render(rows, pagination){
    const body = document.getElementById('memberWalletBody');
    if(!body) return;
    updateMetrics(rows);
    if(!rows.length){ body.innerHTML = '<tr><td colspan="13">No wallet records found.</td></tr>'; }
    else body.innerHTML = rows.map(r => {
      const wl = num(r.winLoss);
      return `<tr>
        <td><b>${esc(r.username || '-')}</b><br><small>ID: ${esc(r.memberId)} ${r.mobile ? '• '+esc(r.mobile) : ''}</small></td>
        <td><b>${money(r.mainWalletBalance)}</b></td>
        <td>${money(r.providerWalletBalance)}</td>
        <td><b>${money(r.totalBalance)}</b></td>
        <td>${money(r.totalDeposit)}</td>
        <td>${money(r.totalWithdraw)}</td>
        <td>${money(r.totalTransferIn)}</td>
        <td>${money(r.totalTransferOut)}</td>
        <td>${money(r.totalBet)}</td>
        <td>${money(r.totalWin)}</td>
        <td>${money(r.totalLose)}</td>
        <td><span class="status-pill ${wl >= 0 ? 'active' : 'off'}">${money(wl)}</span></td>
        <td><div class="d-flex gap-2 flex-wrap"><a class="clean-btn" href="wallet-ledger.html?memberId=${encodeURIComponent(r.memberId)}">Ledger</a><a class="clean-btn primary" href="index.html">Adjust</a></div></td>
      </tr>`;
    }).join('');
    totalPages = Number(pagination && pagination.totalPages) || 1;
    const total = Number(pagination && pagination.totalElements) || rows.length;
    document.getElementById('walletPager').textContent = `Page ${page} / ${totalPages}`;
    document.getElementById('walletPageInfo').textContent = `${total.toLocaleString()} record(s)`;
    document.getElementById('walletPrevBtn').disabled = page <= 1;
    document.getElementById('walletNextBtn').disabled = page >= totalPages;
  }
  async function load(){
    const body=document.getElementById('memberWalletBody'); if(body) body.innerHTML='<tr><td colspan="13">Loading wallet list...</td></tr>';
    try{
      const json = await api(url('MEMBER_WALLET_LIST') + '?' + query());
      const data = json.data || {};
      render(Array.isArray(data.content) ? data.content : [], data.pagination || {});
    }catch(e){
      updateMetrics([]);
      if(body) body.innerHTML='<tr><td colspan="13" class="text-danger">'+esc(e.message || 'Load failed')+'</td></tr>';
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('walletSearchBtn')?.addEventListener('click', ()=>{ page=1; load(); });
    document.getElementById('walletKeyword')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ page=1; load(); } });
    document.getElementById('walletSize')?.addEventListener('change', ()=>{ page=1; load(); });
    document.getElementById('walletResetBtn')?.addEventListener('click', ()=>{ document.getElementById('walletKeyword').value=''; page=1; load(); });
    document.getElementById('walletPrevBtn')?.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
    document.getElementById('walletNextBtn')?.addEventListener('click', ()=>{ if(page<totalPages){ page++; load(); } });
    load();
  });
})();
