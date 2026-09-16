(function () {
  function endpoint(k) { return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function uploadUrl(name) {
    if (!name) return '';
    if (/^https?:\/\//i.test(name)) return name;
    const base = (API_CONFIG.STATIC_UPLOAD_BASE_URL || 'https://static.titanx7.com').replace(/\/$/, '');
    const path = String(name).trim();
    if (path.startsWith('/uploads/')) return base + path;
    if (path.startsWith('uploads/')) return base + '/' + path;
    return base + '/uploads/payment/' + path;
  }
  async function api(url, opt) {
    const res = await fetch(url, opt || { headers: { ...BO_AUTH.authHeader() } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  async function load() {
    const body = document.getElementById('pmBody');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    try {
      const json = await api(endpoint('PAYMENT_METHOD_LIST'));
      const rows = (json.data && json.data.content) || [];
      if (!rows.length) { body.innerHTML = '<tr><td colspan="7">No payment method found.</td></tr>'; return; }
      body.innerHTML = rows.map(r => {
        const details = [
          r.bankName ? 'Bank: ' + esc(r.bankName) : '',
          r.accountName ? 'Name: ' + esc(r.accountName) : '',
          r.accountNumber ? 'Acc: ' + esc(r.accountNumber) : '',
          r.bankBsb ? 'BSB: ' + esc(r.bankBsb) : '',
          r.payId ? 'Pay ID: ' + esc(r.payId) : ''
        ].filter(Boolean).join('<br>');
        const qr = r.qrImage
          ? `<a class="bo-tx-link" target="_blank" rel="noopener" href="${esc(uploadUrl(r.qrImage))}">View</a>`
          : '-';
        const statusOn = Number(r.status) === 1;
        return `<tr>
        <td>${esc(r.sortOrder || 0)}</td>
        <td><b>${esc(r.methodType)}</b></td>
        <td><b>${esc(r.displayName)}</b><br><small class="bo-tx-sub">${esc(r.subtitle)}</small></td>
        <td>${details}</td>
        <td>${qr}</td>
        <td><span class="status-pill ${statusOn ? 'active' : 'off'}">${statusOn ? 'ACTIVE' : 'INACTIVE'}</span></td>
        <td><div class="bo-tx-actions">
          <a class="bo-tx-action-btn is-edit" href="payment-method-create.html?id=${encodeURIComponent(r.id)}&from=config" title="Edit" aria-label="Edit"><i class="bi bi-pencil" aria-hidden="true"></i></a>
          <button type="button" class="bo-tx-action-btn is-reject" title="Delete" aria-label="Delete" data-del="${esc(r.id)}"><i class="bi bi-trash" aria-hidden="true"></i></button>
        </div></td>
      </tr>`;
      }).join('');
    } catch (e) {
      body.innerHTML = '<tr><td colspan="7" class="text-danger">' + esc(e.message) + '</td></tr>';
    }
  }
  async function del(id) {
    if (!(await BO_DIALOG.confirm('Delete this payment method?', { title: 'Delete Payment Method', confirmText: 'Delete' }))) return;
    try {
      const json = await api(endpoint('PAYMENT_METHOD_DELETE') + '/' + encodeURIComponent(id), {
        method: 'POST',
        headers: { ...BO_AUTH.authHeader() }
      });
      alert(json.message || 'Deleted');
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }
  document.addEventListener('click', (e) => {
    const db = e.target.closest('[data-del]');
    if (db) del(db.dataset.del);
  });
  document.addEventListener('DOMContentLoaded', () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    document.getElementById('pmRefresh')?.addEventListener('click', load);
    load();
  });
})();
