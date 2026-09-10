(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const DRAFT_KEY = 'bo_mprr_draft_v1';

  const params = new URLSearchParams(location.search);
  const state = {
    mode: params.get('mode') === 'oneoff' ? 'oneoff' : 'monthly',
    editingPricingId: params.get('edit') || null,
    merchants: [],
    pricing: [],
    lockMode: false,
    draftTimer: null
  };

  async function api(path, opt = {}) {
    const headers = {
      ...BO_AUTH.authHeader(),
      ...(opt.body ? { 'Content-Type': 'application/json' } : {})
    };
    const r = await fetch(API_CONFIG.BASE_URL + path, { ...opt, headers, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.status === 'error') throw Error(j.message || 'Request failed');
    return j.data ?? j;
  }

  function setStatus(msg, kind) {
    const el = $('mprrStatus');
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      el.className = 'upload-status mprr-status';
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.className = 'upload-status mprr-status' + (kind ? ' ' + kind : '');
  }

  function syncVisibility() {
    const monthly = state.mode === 'monthly';
    document.querySelectorAll('[data-mprr-show]').forEach((el) => {
      const show = el.getAttribute('data-mprr-show') === state.mode;
      el.hidden = !show;
    });
    const merchant = $('mprrMerchant');
    const cycle = $('mprrCycleDay');
    if (merchant) merchant.required = monthly;
    if (cycle) cycle.required = monthly;

    $('mprrEntryTitle').textContent = monthly ? 'Monthly Recurring Rule' : 'One-off / Ad-hoc Income';
    const badge = $('mprrEntryBadge');
    badge.textContent = monthly ? 'Auto-cycle' : 'Manual';
    badge.classList.toggle('is-oneoff', !monthly);
    $('mprrEntryHelp').textContent = monthly
      ? 'Automated monthly ledger posting'
      : 'Requires finance operator manual check before posting';
    $('mprrDateLabel').innerHTML = monthly
      ? 'Effective Date <b>*</b>'
      : 'Income Date <b>*</b>';
    $('mprrInfoText').textContent = monthly
      ? 'Recurring monthly fees are recognized on the designated billing day. Adjustments apply to the next billing cycle.'
      : 'One-off income is posted immediately to the profit ledger for the selected income date.';
    $('mprrCardSub').textContent = monthly
      ? 'Define the merchant, fee item, billing cadence, and amount for this ledger entry.'
      : 'Capture ad-hoc income with source, amount, and an optional internal remark.';
    $('mprrSubmitLabel').textContent = state.editingPricingId
      ? 'Save Pricing Adjustment'
      : 'Save & Record Profit';
  }

  function setMode(mode, { lock = false } = {}) {
    if (lock && state.lockMode && mode !== state.mode) return;
    state.mode = mode === 'oneoff' ? 'oneoff' : 'monthly';
    state.lockMode = lock || state.lockMode;
    document.querySelectorAll('[data-mprr-mode]').forEach((b) => {
      const on = b.dataset.mprrMode === state.mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = state.lockMode && !on;
    });
    syncVisibility();
    scheduleDraft();
  }

  function fillCycleDays() {
    const sel = $('mprrCycleDay');
    if (!sel || sel.options.length) return;
    sel.innerHTML = Array.from({ length: 28 }, (_, i) => {
      const d = i + 1;
      return `<option value="${d}">Day ${d} of every month</option>`;
    }).join('');
  }

  function syncCycleFromDate() {
    const dateEl = $('mprrDate');
    const cycleEl = $('mprrCycleDay');
    if (!dateEl?.value || !cycleEl) return;
    const day = Math.min(28, Math.max(1, Number(dateEl.value.slice(8, 10)) || 1));
    cycleEl.value = String(day);
  }

  function syncDateFromCycle() {
    const dateEl = $('mprrDate');
    const cycleEl = $('mprrCycleDay');
    if (!dateEl || !cycleEl) return;
    const base = dateEl.value || fmt(new Date());
    const [y, m] = base.split('-');
    const day = pad2(Number(cycleEl.value) || 1);
    dateEl.value = `${y}-${m}-${day}`;
  }

  function renderMerchants(selected) {
    const sel = $('mprrMerchant');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Merchant</option>' +
      state.merchants.map((m) => {
        const label = `${esc(m.code || '')} — ${esc(m.name || 'Merchant')}${m.externalId ? ` (${esc(m.externalId)})` : ''}`;
        return `<option value="${m.id}">${label}</option>`;
      }).join('');
    if (selected) sel.value = String(selected);
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function writeDraft() {
    if (state.editingPricingId) return;
    const payload = {
      mode: state.mode,
      merchantId: $('mprrMerchant')?.value || '',
      feeName: $('mprrFeeName')?.value || '',
      date: $('mprrDate')?.value || '',
      cycleDay: $('mprrCycleDay')?.value || '',
      amount: $('mprrAmount')?.value || '',
      remark: $('mprrRemark')?.value || '',
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      $('mprrDraftText').textContent = 'Draft cached locally · Just now';
    } catch (_) {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
  }

  function scheduleDraft() {
    clearTimeout(state.draftTimer);
    state.draftTimer = setTimeout(writeDraft, 350);
  }

  function applyDraft(draft) {
    if (!draft || state.editingPricingId) return;
    if (draft.mode) setMode(draft.mode);
    if (draft.merchantId) $('mprrMerchant').value = draft.merchantId;
    if (draft.feeName) $('mprrFeeName').value = draft.feeName;
    if (draft.date) $('mprrDate').value = draft.date;
    if (draft.cycleDay) $('mprrCycleDay').value = String(draft.cycleDay);
    if (draft.amount != null) $('mprrAmount').value = draft.amount;
    if (draft.remark != null) $('mprrRemark').value = draft.remark;
    const mins = Math.max(0, Math.round((Date.now() - (draft.savedAt || Date.now())) / 60000));
    $('mprrDraftText').textContent = mins <= 0
      ? 'Draft cached locally · Just now'
      : `Draft cached locally · ${mins} min ago`;
  }

  async function loadPricing() {
    const d = await api('/admin/main/merchant-profit/pricing');
    state.pricing = d.rows || [];
    state.merchants = d.merchants || [];
    renderMerchants();
  }

  function applyEdit(row) {
    state.editingPricingId = row.id;
    state.lockMode = true;
    setMode('monthly', { lock: true });
    $('mprrMerchant').value = String(row.merchantId || '');
    $('mprrFeeName').value = row.feeName || '';
    $('mprrDate').value = String(row.effectiveDate || row.effectiveMonth || '').slice(0, 10) || fmt(new Date());
    syncCycleFromDate();
    $('mprrAmount').value = Number(row.amount || 0).toFixed(2);
    $('mprrRemark').value = row.remark || '';
    document.title = 'Adjust Monthly Pricing';
    $('mprrDraftText').textContent = 'Editing existing pricing rule';
    syncVisibility();
  }

  async function initEdit() {
    if (!state.editingPricingId) return false;
    const row = state.pricing.find((r) => String(r.id) === String(state.editingPricingId));
    if (!row) {
      setStatus('Pricing rule not found. It may have been removed.', 'text-danger');
      state.editingPricingId = null;
      return false;
    }
    applyEdit(row);
    return true;
  }

  async function submitForm(e) {
    e.preventDefault();
    setStatus('Saving...', 'text-muted');
    const btn = $('mprrSubmitBtn');
    if (btn) btn.disabled = true;
    try {
      const amount = Number($('mprrAmount').value);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus('Amount must be a valid number.', 'text-danger');
        return;
      }
      if (state.mode === 'oneoff') {
        if (amount <= 0) {
          setStatus('Amount must be greater than 0.', 'text-danger');
          return;
        }
        await api('/admin/main/merchant-profit', {
          method: 'POST',
          body: JSON.stringify({
            incomeDate: $('mprrDate').value,
            source: $('mprrFeeName').value,
            amount: amount.toFixed(2),
            description: $('mprrRemark').value
          })
        });
      } else {
        if (!$('mprrMerchant').value) {
          setStatus('Please select a target merchant.', 'text-danger');
          return;
        }
        await api('/admin/main/merchant-profit/pricing', {
          method: 'POST',
          body: JSON.stringify({
            pricingId: state.editingPricingId,
            merchantId: $('mprrMerchant').value,
            feeName: $('mprrFeeName').value,
            effectiveDate: $('mprrDate').value,
            effectiveMonth: $('mprrDate').value,
            amount: amount.toFixed(2),
            remark: $('mprrRemark').value
          })
        });
      }
      clearDraft();
      location.href = 'main-merchant-profit.html';
    } catch (x) {
      setStatus(x.message || 'Save failed.', 'text-danger');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bind() {
    document.querySelectorAll('[data-mprr-mode]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.disabled) return;
        setMode(b.dataset.mprrMode);
      });
    });
    document.querySelectorAll('[data-mprr-chip]').forEach((b) => {
      b.addEventListener('click', () => {
        $('mprrFeeName').value = b.getAttribute('data-mprr-chip') || '';
        scheduleDraft();
        $('mprrFeeName').focus();
      });
    });
    $('mprrDate')?.addEventListener('change', () => {
      syncCycleFromDate();
      scheduleDraft();
    });
    $('mprrCycleDay')?.addEventListener('change', () => {
      syncDateFromCycle();
      scheduleDraft();
    });
    ['mprrMerchant', 'mprrFeeName', 'mprrAmount', 'mprrRemark'].forEach((id) => {
      $(id)?.addEventListener('input', scheduleDraft);
      $(id)?.addEventListener('change', scheduleDraft);
    });
    $('mprrForm')?.addEventListener('submit', submitForm);
  }

  BO_AUTH.requireLogin();
  fillCycleDays();
  bind();
  $('mprrDate').value = fmt(new Date());
  syncCycleFromDate();
  setMode(state.mode, { lock: !!state.editingPricingId });

  loadPricing()
    .then(async () => {
      const edited = await initEdit();
      if (!edited) applyDraft(readDraft());
    })
    .catch((x) => setStatus(x.message || 'Failed to load merchants.', 'text-danger'));
})();
