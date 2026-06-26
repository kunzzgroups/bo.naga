(function(){
  let page = 1;
  let totalPages = 1;
  let currentRows = [];
  function endpoint(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function dt(v){ return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-'); }
  async function api(url, opt){
    const res = await fetch(url, opt || {headers:{...BO_AUTH.authHeader()}});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  function query(){
    const params = new URLSearchParams();
    const keyword = document.getElementById('withdrawKeyword')?.value.trim();
    const status = document.getElementById('withdrawStatus')?.value.trim();
    const size = document.getElementById('withdrawSize')?.value || '20';
    if(keyword) params.set('keyword', keyword);
    if(status) params.set('status', status);
    params.set('page', page);
    params.set('size', size);
    return params.toString();
  }
  function metric(id, value){ const el=document.getElementById(id); if(el) el.textContent = value; }
  function updateMetrics(rows){
    const pending = rows.filter(r => String(r.status).toUpperCase() === 'PENDING');
    const approved = rows.filter(r => String(r.status).toUpperCase() === 'APPROVED');
    const rejected = rows.filter(r => String(r.status).toUpperCase() === 'REJECTED');
    metric('wdPendingCount', pending.length.toLocaleString());
    metric('wdPendingAmount', money(pending.reduce((s,r)=>s+num(r.amount),0)));
    metric('wdApprovedAmount', money(approved.reduce((s,r)=>s+num(r.amount),0)));
    metric('wdRejectedCount', rejected.length.toLocaleString());
  }
  function statusClass(status){
    status = String(status || '').toUpperCase();
    if(status === 'APPROVED') return 'active';
    if(status === 'REJECTED') return 'off';
    return '';
  }
  function render(rows, pagination){
    currentRows = rows;
    updateMetrics(rows);
    const body = document.getElementById('withdrawBody');
    if(!body) return;
    if(!rows.length){ body.innerHTML = '<tr><td colspan="9">No withdraw request found.</td></tr>'; }
    else body.innerHTML = rows.map(r => {
      const pending = String(r.status || '').toUpperCase() === 'PENDING';
      return `<tr>
        <td>${esc(dt(r.createdAt || r.created_at))}</td>
        <td><b>${esc(r.username || '-')}</b><br><small>ID: ${esc(r.memberId)} ${r.mobile ? '• '+esc(r.mobile) : ''}</small></td>
        <td><b>${money(r.amount)}</b></td>
        <td>${esc(r.bankName || '-')}<br><small>${esc(r.accountName || '')} ${r.bankAccount ? '• '+esc(r.bankAccount) : ''}</small></td>
        <td>${esc(r.referenceNo || '-')}</td>
        <td>${esc(r.remark || '-')} ${r.adminRemark ? '<br><small>Admin: '+esc(r.adminRemark)+'</small>' : ''}</td>
        <td><span class="status-pill ${statusClass(r.status)}">${esc(r.status || '-')}</span></td>
        <td>${esc(r.processedAt || '-')}</td>
        <td>${pending ? `<div class="d-flex gap-2 flex-wrap"><button class="clean-btn primary" data-approve="${esc(r.id)}">Approve</button><button class="clean-btn danger" data-reject="${esc(r.id)}">Reject</button></div>` : `<a class="clean-btn" href="wallet-ledger.html?memberId=${encodeURIComponent(r.memberId)}">Ledger</a>`}</td>
      </tr>`;
    }).join('');
    totalPages = Number(pagination && pagination.totalPages) || 1;
    const total = Number(pagination && pagination.totalElements) || rows.length;
    document.getElementById('withdrawPager').textContent = `Page ${page} / ${totalPages}`;
    document.getElementById('withdrawPageInfo').textContent = `${total.toLocaleString()} request(s)`;
    document.getElementById('withdrawPrevBtn').disabled = page <= 1;
    document.getElementById('withdrawNextBtn').disabled = page >= totalPages;
  }
  async function load(){
    const body=document.getElementById('withdrawBody'); if(body) body.innerHTML='<tr><td colspan="9">Loading withdraw requests...</td></tr>';
    try{
      const json = await api(endpoint('MEMBER_WITHDRAW_LIST') + '?' + query());
      const data = json.data || {};
      render(Array.isArray(data.content) ? data.content : [], data.pagination || {});
    }catch(e){
      updateMetrics([]);
      if(body) body.innerHTML='<tr><td colspan="9" class="text-danger">'+esc(e.message || 'Load failed')+'</td></tr>';
    }
  }
  async function action(id, type){
    const row = currentRows.find(x => String(x.id) === String(id));
    const label = type === 'approve' ? 'approve and deduct main wallet' : 'reject';
    const adminRemark = prompt(`Enter admin remark to ${label} this withdraw request${row ? ' #' + row.id + ' (' + money(row.amount) + ')' : ''}:`, '');
    if(adminRemark === null) return;
    if(!confirm(`Confirm to ${label} this withdraw request?`)) return;
    try{
      const key = type === 'approve' ? 'MEMBER_WITHDRAW_APPROVE' : 'MEMBER_WITHDRAW_REJECT';
      const json = await api(endpoint(key) + '/' + encodeURIComponent(id), {method:'POST', headers:{'Content-Type':'application/json', ...BO_AUTH.authHeader()}, body: JSON.stringify({adminRemark})});
      alert(json.message || 'Done');
      load();
    }catch(e){ alert(e.message || 'Action failed'); }
  }
  document.addEventListener('click', e => {
    const approve = e.target.closest && e.target.closest('[data-approve]');
    const reject = e.target.closest && e.target.closest('[data-reject]');
    if(approve) action(approve.dataset.approve, 'approve');
    if(reject) action(reject.dataset.reject, 'reject');
  });
  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('withdrawSearchBtn')?.addEventListener('click', ()=>{ page=1; load(); });
    document.getElementById('withdrawKeyword')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ page=1; load(); } });
    document.getElementById('withdrawStatus')?.addEventListener('change', ()=>{ page=1; load(); });
    document.getElementById('withdrawSize')?.addEventListener('change', ()=>{ page=1; load(); });
    document.getElementById('withdrawResetBtn')?.addEventListener('click', ()=>{ document.getElementById('withdrawKeyword').value=''; document.getElementById('withdrawStatus').value='PENDING'; page=1; load(); });
    document.getElementById('withdrawPrevBtn')?.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
    document.getElementById('withdrawNextBtn')?.addEventListener('click', ()=>{ if(page<totalPages){ page++; load(); } });
    load();
  });
})();
