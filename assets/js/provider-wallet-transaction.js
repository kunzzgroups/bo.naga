(function(){
  let page = 1;
  let totalPages = 1;
  let lastRows = [];
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

  const $ = (id) => document.getElementById(id);

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function money(v){
    const n = Number(v || 0);
    return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function dt(v){ return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-'); }

  function endpoint(key){
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key];
  }

  async function get(url){
    const res = await fetch(url, { headers: { ...BO_AUTH.authHeader() } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json.data || {};
  }

  function readList(data){ return data.items || data.list || data.content || data.rows || []; }
  function readTotalPages(data){ return Number(data.totalPages || data.pages || 1) || 1; }
  function readTotalElements(data){ return Number(data.totalElements || data.total || data.count || readList(data).length) || 0; }

  function setPager(){
    const el = $('txPager');
    if (el) el.innerHTML = pageButtons(page, totalPages);
    if ($('txPrevBtn')) $('txPrevBtn').disabled = page <= 1;
    if ($('txNextBtn')) $('txNextBtn').disabled = page >= totalPages;
  }

  function query(){
    const p = new URLSearchParams();
    const map = {
      txMemberId: 'memberId',
      txProviderCode: 'providerCode',
      txType: 'txType',
      txStatus: 'status',
      txFrom: 'from',
      txTo: 'to'
    };
    Object.keys(map).forEach(id => {
      const el = $(id);
      if (el && el.value && el.value.trim()) p.set(map[id], el.value.trim());
    });
    p.set('page', page);
    p.set('size', '20');
    return p.toString();
  }

  function pretty(v){
    if (v == null || v === '') return '-';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    const s = String(v);
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch(e) { return s; }
  }

  function statusBadge(status){
    const s = String(status || '-').toUpperCase();
    let cls = 'text-bg-secondary';
    if (s === 'SUCCESS') cls = 'text-bg-success';
    if (s === 'FAILED' || s === 'ERROR') cls = 'text-bg-danger';
    if (s === 'PENDING') cls = 'text-bg-warning';
    return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
  }

  window.showProviderTxPayload = function(i){
    const x = lastRows[i] || {};
    if ($('txPayloadMeta')) $('txPayloadMeta').textContent = 'ID ' + (x.id || '-') + ' · ' + (x.providerCode || '-') + ' · ' + (x.txType || '-');
    if ($('txApiUrl')) $('txApiUrl').textContent = pretty(x.apiUrl || x.url || '');
    if ($('txRequestPayload')) $('txRequestPayload').textContent = pretty(x.requestPayload || x.request_payload || '');
    if ($('txResponsePayload')) $('txResponsePayload').textContent = pretty(x.responsePayload || x.response_payload || '');
    if ($('txErrorMessage')) $('txErrorMessage').textContent = pretty(x.errorMessage || x.error_message || '');
    new bootstrap.Modal($('txPayloadModal')).show();
  };

  async function load(){
    try{
      $('txBody').innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Loading...</td></tr>';
      const data = await get(endpoint('PROVIDER_WALLET_TRANSACTION_LIST') + '?' + query());
      lastRows = readList(data);
      totalPages = readTotalPages(data);
      const total = readTotalElements(data);
      if ($('txRecordCount')) $('txRecordCount').textContent = total + ' records';
      $('txBody').innerHTML = lastRows.length ? lastRows.map((x,i) => `
        <tr>
          <td>${esc(x.id)}</td>
          <td>${esc(x.memberId || x.member_id || '')}</td>
          <td><b>${esc(x.providerCode || x.provider_code || '-')}</b></td>
          <td>${esc(x.txType || x.tx_type || '-')}</td>
          <td>${money(x.amount)}</td>
          <td>${statusBadge(x.status)}</td>
          <td>${esc(x.httpStatus || x.http_status || '-')}</td>
          <td><span class="pwt-url" title="${esc(x.apiUrl || x.api_url || '')}">${esc(x.apiUrl || x.api_url || '-')}</span></td>
          <td>${esc(dt(x.createdAt || x.created_at))}</td>
          <td><button class="btn btn-sm btn-outline-primary" type="button" onclick="showProviderTxPayload(${i})"><i class="bi bi-braces"></i> Payload</button></td>
        </tr>`).join('') : '<tr><td colspan="10" class="text-center py-4 text-muted">No records</td></tr>';
      setPager();
    }catch(e){
      $('txBody').innerHTML = '<tr><td colspan="10" class="text-danger text-center py-4">' + esc(e.message) + '</td></tr>';
    }
  }

  function resetFilters(){
    ['txMemberId','txProviderCode','txType','txStatus','txFrom','txTo'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    page = 1;
    load();
  }

  document.addEventListener('DOMContentLoaded', () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    $('txSearchBtn')?.addEventListener('click', () => { page = 1; load(); });
    $('txRefreshBtn')?.addEventListener('click', () => load());
    $('txResetBtn')?.addEventListener('click', resetFilters);
    $('txPrevBtn')?.addEventListener('click', () => { if(page > 1){ page--; load(); } });
    $('txNextBtn')?.addEventListener('click', () => { if(page < totalPages){ page++; load(); } });
    $('txPager')?.addEventListener('click', e => { const b=e.target.closest('[data-page]'); if(!b)return; const n=Number(b.dataset.page); if(n>=1&&n<=totalPages&&n!==page){page=n;load();} });
    load();
  });
})();
