(function () {
  function endpoint(k) { return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function clean(v) { return v == null ? '' : String(v) }
  function uploadUrl(name) {
    if (!name) return '';
    if (/^https?:\/\//i.test(name)) return name;

    const base = (API_CONFIG.STATIC_UPLOAD_BASE_URL || 'https://static.titanxgaming.com').replace(/\/$/, '');
    const path = String(name).trim();

    // Backend may return full upload path like /uploads/payment/xxx.png or only filename.
    if (path.startsWith('/uploads/')) return base + path;
    if (path.startsWith('uploads/')) return base + '/' + path;

    // Payment method QR is saved under uploads/payment by backend.
    return base + '/uploads/payment/' + path;
  }
  async function api(url, opt) { const res = await fetch(url, opt || { headers: { ...BO_AUTH.authHeader() } }); const json = await res.json().catch(() => ({})); if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed'); return json; }
  async function load() { const body = document.getElementById('pmBody'); body.innerHTML = '<tr><td colspan="7">Loading...</td></tr>'; try { const json = await api(endpoint('PAYMENT_METHOD_LIST')); const rows = (json.data && json.data.content) || []; if (!rows.length) { body.innerHTML = '<tr><td colspan="7">No payment method found.</td></tr>'; return; } body.innerHTML = rows.map(r => `<tr><td>${esc(r.sortOrder || 0)}</td><td><b>${esc(r.methodType)}</b></td><td><b>${esc(r.displayName)}</b><br><small>${esc(r.subtitle)}</small></td><td>${r.bankName ? 'Bank: ' + esc(r.bankName) + '<br>' : ''}${r.accountName ? 'Name: ' + esc(r.accountName) + '<br>' : ''}${r.accountNumber ? 'Acc: ' + esc(r.accountNumber) + '<br>' : ''}${r.bankBsb ? 'BSB: ' + esc(r.bankBsb) + '<br>' : ''}${r.payId ? 'Pay ID: ' + esc(r.payId) : ''}</td><td>${r.qrImage ? `<a target="_blank" href="${esc(uploadUrl(r.qrImage))}">View</a>` : '-'}</td><td><span class="status-pill ${Number(r.status) === 1 ? 'active' : 'off'}">${Number(r.status) === 1 ? 'ACTIVE' : 'INACTIVE'}</span></td><td><button class="clean-btn primary" data-edit='${esc(JSON.stringify(r))}'>Edit</button> <button class="clean-btn danger" data-del="${esc(r.id)}">Delete</button></td></tr>`).join(''); } catch (e) { body.innerHTML = '<tr><td colspan="7" class="text-danger">' + esc(e.message) + '</td></tr>'; } }
  function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v == null ? '' : v; }
  function reset() { document.getElementById('pmForm').reset(); setVal('pmId', ''); setVal('pmSort', '0'); setVal('pmMin', '10'); setVal('pmMax', '0'); document.getElementById('pmFormTitle').textContent = 'Create Payment Method'; }
  function edit(r) { setVal('pmId', r.id); setVal('pmType', r.methodType); setVal('pmStatus', r.status); setVal('pmName', r.displayName); setVal('pmSubtitle', r.subtitle); setVal('pmBankName', r.bankName); setVal('pmAccountName', r.accountName); setVal('pmAccountNo', r.accountNumber); setVal('pmBsb', r.bankBsb); setVal('pmPayId', r.payId); setVal('pmSort', r.sortOrder); setVal('pmMin', r.minAmount); setVal('pmMax', r.maxAmount); setVal('pmInstructions', r.instructions); document.getElementById('pmFormTitle').textContent = 'Edit Payment Method #' + r.id; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function save(e) { e.preventDefault(); const fd = new FormData(); const pairs = { id: 'pmId', methodType: 'pmType', displayName: 'pmName', subtitle: 'pmSubtitle', bankName: 'pmBankName', accountName: 'pmAccountName', accountNumber: 'pmAccountNo', bankBsb: 'pmBsb', payId: 'pmPayId', instructions: 'pmInstructions', minAmount: 'pmMin', maxAmount: 'pmMax', sortOrder: 'pmSort', status: 'pmStatus' }; Object.keys(pairs).forEach(k => { const v = document.getElementById(pairs[k]).value; if (v !== '' || k !== 'id') fd.append(k, v); }); const file = document.getElementById('pmQr').files[0]; if (file) fd.append('qrImage', file); try { const json = await api(endpoint('PAYMENT_METHOD_SAVE'), { method: 'POST', headers: { ...BO_AUTH.authHeader() }, body: fd }); alert(json.message || 'Saved'); reset(); load(); } catch (err) { alert(err.message || 'Save failed'); } }
  async function del(id) { if (!confirm('Delete this payment method?')) return; try { const json = await api(endpoint('PAYMENT_METHOD_DELETE') + '/' + encodeURIComponent(id), { method: 'POST', headers: { ...BO_AUTH.authHeader() } }); alert(json.message || 'Deleted'); load(); } catch (e) { alert(e.message || 'Delete failed'); } }
  document.addEventListener('click', e => { const eb = e.target.closest('[data-edit]'); if (eb) { edit(JSON.parse(eb.dataset.edit)); } const db = e.target.closest('[data-del]'); if (db) del(db.dataset.del); });
  document.addEventListener('DOMContentLoaded', () => { document.getElementById('pmForm')?.addEventListener('submit', save); document.getElementById('pmReset')?.addEventListener('click', reset); document.getElementById('pmRefresh')?.addEventListener('click', load); load(); });
})();
