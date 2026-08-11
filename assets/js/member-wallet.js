(function(){
  let page = 1;
  let totalPages = 1;

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
    if(!rows.length){ body.innerHTML = '<tr><td colspan="16">No wallet records found.</td></tr>'; }
    else body.innerHTML = rows.map(r => {
      const wl = num(r.winLoss);
      return `<tr>
        <td><b>${esc(r.username || '-')}</b><br><small>ID: ${esc(r.memberId)} ${r.mobile ? '• '+esc(r.mobile) : ''}</small></td>
        <td><b>${money(r.mainWalletBalance)}</b></td>
        <td><button class="wallet-total-link provider-wallet-total-link" type="button" data-provider-wallet-detail="${esc(r.memberId)}" data-provider-wallet-user="${esc(r.username||'')}" title="View provider wallet detail">${money(r.providerWalletBalance)}</button></td>
        <td><b>${money(r.totalBalance)}</b></td>
        <td>${money(r.totalDeposit)}</td>
        <td>${money(r.totalWithdraw)}</td>
        <td>${money(r.totalTransferIn)}</td>
        <td>${money(r.totalTransferOut)}</td>
        <td>${money(r.totalBet)}</td>
        <td>${money(r.totalWin)}</td>
        <td>${money(r.totalLose)}</td>
        <td><span class="status-pill ${wl >= 0 ? 'active' : 'off'}">${money(wl)}</span></td>
        <td><a class="wallet-total-link" href="wallet-ledger.html?memberId=${encodeURIComponent(r.memberId)}&type=ADJUSTMENT&scope=all" title="View adjustment detail">${money(r.totalAdjustment)}</a></td>
        <td><a class="wallet-total-link" href="wallet-ledger.html?memberId=${encodeURIComponent(r.memberId)}&type=BONUS&scope=all" title="View bonus detail">${money(r.totalBonus)}</a></td>
        <td><a class="wallet-total-link" href="daily-rebate-report.html?memberId=${encodeURIComponent(r.memberId)}" title="View daily rebate detail">${money(r.dailyRebate)}</a></td>
        <td><div class="d-flex gap-2 flex-wrap"><a class="clean-btn" href="wallet-ledger.html?memberId=${encodeURIComponent(r.memberId)}">Ledger</a><a class="clean-btn primary" href="index.html?memberId=${encodeURIComponent(r.memberId)}">Adjust</a></div></td>
      </tr>`;
    }).join('');
    totalPages = Number(pagination && pagination.totalPages) || 1;
    const total = Number(pagination && pagination.totalElements) || rows.length;
    document.getElementById('walletPager').innerHTML = pageButtons(page, totalPages);
    document.getElementById('walletPageInfo').textContent = `${total.toLocaleString()} record(s)`;
    document.getElementById('walletPrevBtn').disabled = page <= 1;
    document.getElementById('walletNextBtn').disabled = page >= totalPages;
  }
  async function load(){
    const body=document.getElementById('memberWalletBody'); if(body) body.innerHTML='<tr><td colspan="16">Loading wallet list...</td></tr>';
    try{
      const json = await api(url('MEMBER_WALLET_LIST') + '?' + query());
      const data = json.data || {};
      render(Array.isArray(data.content) ? data.content : [], data.pagination || {});
    }catch(e){
      updateMetrics([]);
      if(body) body.innerHTML='<tr><td colspan="16" class="text-danger">'+esc(e.message || 'Load failed')+'</td></tr>';
    }
  }

  async function showProviderWalletDetail(memberId, username){
    const modal=document.getElementById('providerWalletDetailModal'), body=document.getElementById('providerWalletDetailBody');
    if(!modal||!body)return;
    document.getElementById('providerWalletDetailTitle').textContent=`Provider Wallet Detail — ${username||('Member #'+memberId)}`;
    modal.hidden=false;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    body.innerHTML='<tr><td colspan="6">Loading provider accounts...</td></tr>';
    try{
      const json=await api(url('MEMBER_WALLET_PROVIDER_ACCOUNTS')+'?memberId='+encodeURIComponent(memberId));
      const rows = Array.isArray(json.data)
        ? json.data
        : (Array.isArray(json.data?.accounts)
            ? json.data.accounts
            : (Array.isArray(json.data?.content) ? json.data.content : []));
      const sorted=rows.slice().sort((a,b)=>num(b.balance??b.providerBalance??b.walletBalance)-num(a.balance??a.providerBalance??a.walletBalance));
      const totalLeft=sorted.reduce((sum,r)=>sum+num(r.balance??r.providerBalance??r.walletBalance),0);
      body.innerHTML=sorted.length?(sorted.map(r=>{
        const balance=num(r.balance??r.providerBalance??r.walletBalance);
        return `<tr><td><b>${esc(r.providerName||r.providerCode||'-')}</b><br><small>${esc(r.providerCode||'')}</small></td><td>${esc(r.providerUsername||r.accountId||r.playerId||'-')}</td><td><b>${money(balance)}</b>${balance>0?' <span class="status-pill active">Balance inside</span>':''}</td><td>${esc(r.status||r.sessionStatus||'-')}</td><td>${esc(r.updatedAt||r.lastSyncAt||r.lastUpdatedAt||'-')}</td><td>${esc(r.sessionId||r.activeSessionId||'-')}</td></tr>`;
      }).join('')+`<tr class="provider-wallet-detail-total"><td colspan="2"><b>Provider Wallet Total</b></td><td><b>${money(totalLeft)}</b></td><td colspan="3"></td></tr>`):'<tr><td colspan="6">No provider wallet account found for this member.</td></tr>';
    }catch(e){ body.innerHTML='<tr><td colspan="6" class="text-danger">'+esc(e.message||'Unable to load provider wallet details')+'</td></tr>'; }
  }
  function closeProviderWalletDetail(){
    const m=document.getElementById('providerWalletDetailModal');
    if(m){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); m.hidden=true; }
    document.body.classList.remove('modal-open');
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('walletSearchBtn')?.addEventListener('click', ()=>{ page=1; load(); });
    document.getElementById('walletKeyword')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ page=1; load(); } });
    document.getElementById('walletSize')?.addEventListener('change', ()=>{ page=1; load(); });
    document.getElementById('walletResetBtn')?.addEventListener('click', ()=>{ document.getElementById('walletKeyword').value=''; page=1; load(); });
    document.getElementById('walletPrevBtn')?.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
    document.getElementById('walletNextBtn')?.addEventListener('click', ()=>{ if(page<totalPages){ page++; load(); } });
    document.getElementById('memberWalletBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-provider-wallet-detail]');if(b)showProviderWalletDetail(b.dataset.providerWalletDetail,b.dataset.providerWalletUser);});
    document.getElementById('providerWalletDetailClose')?.addEventListener('click',closeProviderWalletDetail);
    document.getElementById('providerWalletDetailClose2')?.addEventListener('click',closeProviderWalletDetail);
    document.getElementById('providerWalletDetailModal')?.addEventListener('click',e=>{if(e.target.id==='providerWalletDetailModal')closeProviderWalletDetail();});
    document.getElementById('walletPager')?.addEventListener('click', e=>{ const b=e.target.closest('[data-page]'); if(!b)return; const n=Number(b.dataset.page); if(n>=1&&n<=totalPages&&n!==page){page=n;load();} });
    load();
  });
})();
