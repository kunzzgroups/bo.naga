(function () {
  'use strict';
  const endpoint = (k) => API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[k];
  const $ = (id) => document.getElementById(id);
  function setVal(id, v) { const el = $(id); if (el) el.value = v == null ? '' : v; }
  function qs() { try { return new URLSearchParams(location.search); } catch (_) { return new URLSearchParams(); } }
  function backHref() {
    const from = qs().get('from');
    if (from === 'config') return 'payment-method.html';
    return 'bank-deposit-usage.html';
  }
  async function api(url, opt) {
    const res = await fetch(url, opt || { headers: { ...BO_AUTH.authHeader() } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  function syncMethodTypeUi() {
    const type = String($('pmType')?.value || 'ONLINE_BANKING').toUpperCase();
    const cash = type === 'CASH';
    const title = $('pmAccountSectionTitle');
    const bankLabel = $('pmBankNameLabel');
    const accountLabel = $('pmAccountNameLabel');
    const noLabel = $('pmAccountNoLabel');
    const bank = $('pmBankName');
    const account = $('pmAccountName');
    const no = $('pmAccountNo');
    const bsb = $('pmBsb');
    const payId = $('pmPayId');
    if (title) title.textContent = cash ? '2. Cash Details' : '2. Account Details';
    if (bankLabel) bankLabel.innerHTML = cash ? 'Cash Location / Counter' : 'Bank Name <b>*</b>';
    if (accountLabel) accountLabel.innerHTML = cash ? 'Cash Account / Drawer Name' : 'Account Name <b>*</b>';
    if (noLabel) noLabel.innerHTML = cash ? 'Reference / Drawer No.' : 'Account Number <b>*</b>';
    if (bank) bank.placeholder = cash ? 'e.g. Main Cashier / Cash Counter 1' : 'e.g. Test Bank';
    if (account) account.placeholder = cash ? 'e.g. Main Cash Float' : 'e.g. Main Account';
    if (no) no.placeholder = cash ? 'e.g. CASH-01 (optional)' : 'e.g. 001234567';
    if (bsb) { bsb.disabled = cash; if (cash) bsb.value = ''; }
    if (payId) payId.placeholder = cash ? 'e.g. CASH001 (optional)' : 'e.g. PAY123';
  }
  function fill(r) {
    setVal('pmId', r.id);
    setVal('pmType', r.methodType);
    syncMethodTypeUi();
    setVal('pmStatus', r.status);
    setVal('pmName', r.displayName);
    setVal('pmSubtitle', r.subtitle);
    setVal('pmBankName', r.bankName);
    setVal('pmAccountName', r.accountName);
    setVal('pmAccountNo', r.accountNumber);
    setVal('pmBsb', r.bankBsb);
    setVal('pmPayId', r.payId);
    setVal('pmSort', r.sortOrder);
    setVal('pmMin', r.minAmount);
    setVal('pmMax', r.maxAmount);
    setVal('pmVipTiers', r.visibleVipTiers);
    setVal('pmDailyLimit', r.dailyLimit);
    setVal('pmAutoRotate', r.autoRotateOnLimit);
    setVal('pmInstructions', r.instructions);
  }
  function setMode(edit) {
    const title = $('pmPageTitle');
    const sub = $('pmPageSub');
    const submit = $('pmSubmitBtn');
    const eyebrow = $('pmPageEyebrow');
    if (title) title.textContent = edit ? 'Edit Payment Method' : 'Create Payment Method';
    if (eyebrow) eyebrow.textContent = edit ? 'Edit Payment Method' : 'Payment Method';
    if (sub) sub.textContent = edit ? 'Update this payment option for customer deposits.' : 'Add a new payment option for customer deposits.';
    if (submit) submit.innerHTML = edit
      ? '<i class="bi bi-check-lg" aria-hidden="true"></i> Save Changes'
      : '<i class="bi bi-check-lg" aria-hidden="true"></i> Create Payment Method';
    document.title = edit ? 'Edit Payment Method' : 'Create Payment Method';
  }
  async function loadEdit(id) {
    setMode(true);
    const json = await api(endpoint('PAYMENT_METHOD_LIST'));
    const rows = (json.data && json.data.content) || [];
    const row = rows.find((r) => String(r.id) === String(id));
    if (!row) throw new Error('Payment method not found');
    fill(row);
  }
  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    const pairs = {
      id: 'pmId', methodType: 'pmType', displayName: 'pmName', subtitle: 'pmSubtitle',
      bankName: 'pmBankName', accountName: 'pmAccountName', accountNumber: 'pmAccountNo',
      bankBsb: 'pmBsb', payId: 'pmPayId', instructions: 'pmInstructions',
      minAmount: 'pmMin', maxAmount: 'pmMax', sortOrder: 'pmSort',
      visibleVipTiers: 'pmVipTiers', dailyLimit: 'pmDailyLimit',
      autoRotateOnLimit: 'pmAutoRotate', status: 'pmStatus'
    };
    Object.keys(pairs).forEach((k) => {
      const v = $(pairs[k])?.value;
      if (v !== '' || k !== 'id') fd.append(k, v == null ? '' : v);
    });
    const file = $('pmQr')?.files?.[0];
    if (file) fd.append('qrImage', file);
    const submit = $('pmSubmitBtn');
    if (submit) submit.disabled = true;
    try {
      const json = await api(endpoint('PAYMENT_METHOD_SAVE'), {
        method: 'POST',
        headers: { ...BO_AUTH.authHeader() },
        body: fd
      });
      alert(json.message || 'Saved');
      location.href = backHref();
    } catch (err) {
      alert(err.message || 'Save failed');
      if (submit) submit.disabled = false;
    }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    BO_AUTH.requireLogin();
    BO_AUTH.renderProfile && BO_AUTH.renderProfile();
    BO_AUTH.renderSidebar && BO_AUTH.renderSidebar();
    const back = backHref();
    const backLink = $('pmBackLink');
    const cancel = $('pmCancelBtn');
    if (backLink) backLink.href = back;
    if (cancel) cancel.href = back;
    $('pmType')?.addEventListener('change', syncMethodTypeUi);
    syncMethodTypeUi();
    $('pmForm')?.addEventListener('submit', save);
    const id = qs().get('id');
    if (id) {
      try { await loadEdit(id); }
      catch (err) {
        alert(err.message || 'Failed to load payment method');
        location.href = back;
      }
    } else {
      setMode(false);
      setVal('pmSort', '0');
      setVal('pmMin', '10');
      setVal('pmMax', '0');
    }
  });
})();
