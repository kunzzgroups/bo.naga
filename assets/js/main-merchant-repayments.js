(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
  const money = (v) => Number(v || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const reportCurrency = () => String(
    window.BO_MAIN_CURRENCY?.code?.() || sessionStorage.getItem('bo_main_report_currency') || 'MYR'
  ).toUpperCase();

  const state = {
    repayRows: [],
    repayLoaded: false,
    repaySelected: new Set(),
    repayAmounts: {}
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

  function monthKeys(count = 3) {
    const out = [];
    const d = new Date();
    for (let i = 0; i < count; i++) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${x.getFullYear()}-${pad2(x.getMonth() + 1)}`);
    }
    return out;
  }

  function todayYmd() {
    return fmt(new Date());
  }

  function isMerchantParty(row) {
    return /brand|merchant/i.test(String(row.counterpartyType || row.entityType || 'BRAND'));
  }

  function isCollectDue(row) {
    const dir = String(row.direction || '').toUpperCase();
    const bal = Number(row.balanceAmount || 0);
    const closed = /paid|settled|carried/i.test(String(row.status || ''));
    return dir === 'COLLECT' && bal > 0.004 && !closed;
  }

  function statusLabel(row) {
    const s = String(row.status || 'OPEN').toUpperCase();
    if (/partial/i.test(s) || Number(row.paidAmount || 0) > 0) return 'Partial';
    return 'Open';
  }

  function repayRowId(row) {
    return String(row.id ?? `${row.month}|${row.counterpartyKey}|${row.direction}`);
  }

  function selectedRepayRows() {
    return state.repayRows.filter((x) => state.repaySelected.has(repayRowId(x)));
  }

  function readRowPaymentAmount(id) {
    const input = document.querySelector(`[data-repay-amount="${CSS.escape(String(id))}"]`);
    if (input) {
      const n = Number(input.value);
      return Number.isFinite(n) ? n : 0;
    }
    return Number(state.repayAmounts[id] || 0);
  }

  function collectPayablePlan() {
    const plan = [];
    const errors = [];
    state.repayRows.forEach((row) => {
      const id = repayRowId(row);
      const amount = readRowPaymentAmount(id);
      if (!(amount > 0)) return;
      const bal = Number(row.balanceAmount || 0);
      if (amount > bal + 0.004) {
        errors.push(`${row.counterpartyName || 'Merchant'} (${row.month || ''}): amount exceeds balance ${money(bal)}`);
        return;
      }
      if (!row.id) {
        errors.push(`${row.counterpartyName || 'Merchant'}: missing settlement id`);
        return;
      }
      plan.push({ row, amount: Number(amount.toFixed(2)) });
    });
    return { plan, errors };
  }

  function setRepayStatus(msg, type = '') {
    const el = $('mprRepayStatus');
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      el.className = 'upload-status mprd-status-msg';
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.className = 'upload-status mprd-status-msg' + (type ? ' ' + type : '');
  }

  function syncRepaySelectionUi() {
    const rows = state.repayRows;
    const selected = selectedRepayRows();
    const all = $('mprRepaySelectAll');
    const submitBtn = $('mprRepaySubmitBtn');
    const deleteBtn = $('mprRepayDeleteBtn');
    const hint = $('mprRepayFormHint');
    const { plan } = collectPayablePlan();
    const payTotal = plan.reduce((a, x) => a + x.amount, 0);

    if (all) {
      all.checked = rows.length > 0 && selected.length === rows.length;
      all.indeterminate = selected.length > 0 && selected.length < rows.length;
      all.disabled = !rows.length;
    }
    if (submitBtn) submitBtn.disabled = plan.length === 0;
    if (deleteBtn) deleteBtn.disabled = selected.length === 0;

    if (hint) {
      if (!rows.length) {
        hint.textContent = 'No open repayments to process.';
      } else if (!plan.length) {
        hint.textContent = 'Enter a payment amount on each row, then Submit once.';
      } else {
        hint.textContent = `${plan.length} row${plan.length > 1 ? 's' : ''} ready · total ${reportCurrency()} ${money(payTotal)}.`;
      }
    }
  }

  function renderRepayRows(rows) {
    const body = $('mprRepayRows');
    if (!body) return;
    const total = rows.reduce((a, x) => a + Number(x.balanceAmount || 0), 0);
    if ($('mprRepayCount')) $('mprRepayCount').textContent = String(rows.length);
    if ($('mprRepayTotal')) $('mprRepayTotal').textContent = money(total);

    const validIds = new Set(rows.map(repayRowId));
    [...state.repaySelected].forEach((id) => {
      if (!validIds.has(id)) state.repaySelected.delete(id);
    });
    Object.keys(state.repayAmounts).forEach((id) => {
      if (!validIds.has(id)) delete state.repayAmounts[id];
    });

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="9" class="mad-empty">No repayments due right now.</td></tr>';
      syncRepaySelectionUi();
      return;
    }

    body.innerHTML = rows.map((x) => {
      const id = repayRowId(x);
      const st = statusLabel(x);
      const bal = Number(x.balanceAmount || 0);
      const checked = state.repaySelected.has(id) ? ' checked' : '';
      const saved = state.repayAmounts[id];
      const amountVal = saved != null && saved !== '' ? Number(saved).toFixed(2) : '';
      return `<tr data-repay-id="${esc(id)}">
        <td class="mprd-check-col">
          <label class="mad-row-check">
            <input type="checkbox" class="mad-row-check-input" data-repay-select="${esc(id)}"${checked} aria-label="Select ${esc(x.counterpartyName || 'merchant')}"/>
            <span class="mad-row-check-box" aria-hidden="true"></span>
          </label>
        </td>
        <td>${esc(x.month || '—')}</td>
        <td><div class="mprd-merchant">${esc(x.counterpartyName || 'Merchant')}<small>${esc(x.counterpartyType || 'Merchant')}</small></div></td>
        <td><span class="mprd-status ${st === 'Open' ? 'is-open' : ''}">${esc(st)}</span></td>
        <td class="num">${money(x.totalDue)}</td>
        <td class="num">${money(x.paidAmount)}</td>
        <td class="num mprd-balance">${money(bal)}</td>
        <td class="num mprd-pay-col">
          <span class="mac-input-group is-prefix mprd-row-amount">
            <span class="mac-input-addon mprd-row-unit currency-unit">${esc(reportCurrency())}</span>
            <input class="form-control mprd-amount-input" type="number" min="0" step="0.01" inputmode="decimal"
              data-repay-amount="${esc(id)}" data-repay-balance="${bal}"
              value="${esc(amountVal)}" placeholder="0.00" max="${bal}"
              aria-label="Payment amount for ${esc(x.counterpartyName || 'merchant')}"/>
          </span>
        </td>
        <td class="mprd-action-col">
          <button type="button" class="mprd-row-del" data-repay-delete="${esc(id)}" title="Delete settlement" aria-label="Delete settlement">
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
    syncRepaySelectionUi();
  }

  async function loadRepayments(force = false) {
    if (state.repayLoaded && !force) {
      renderRepayRows(state.repayRows);
      return state.repayRows;
    }
    const body = $('mprRepayRows');
    if (body) body.innerHTML = '<tr><td colspan="9" class="mad-empty">Loading...</td></tr>';
    setRepayStatus('');
    try {
      const months = monthKeys(3);
      const packs = await Promise.all(
        months.map((m) => api('/admin/main/settlements?month=' + encodeURIComponent(m)).catch(() => ({ rows: [] })))
      );
      const seen = new Set();
      const rows = [];
      packs.forEach((d) => {
        const list = Array.isArray(d) ? d : (d?.rows || []);
        list.forEach((x) => {
          if (!isMerchantParty(x) || !isCollectDue(x)) return;
          const key = repayRowId(x);
          if (seen.has(key)) return;
          seen.add(key);
          rows.push(x);
        });
      });
      rows.sort((a, b) => {
        const bal = Number(b.balanceAmount || 0) - Number(a.balanceAmount || 0);
        if (bal) return bal;
        return String(b.month || '').localeCompare(String(a.month || ''));
      });
      state.repayRows = rows;
      state.repayLoaded = true;
      renderRepayRows(rows);
      return rows;
    } catch (e) {
      state.repayRows = [];
      state.repayLoaded = false;
      state.repaySelected.clear();
      state.repayAmounts = {};
      if (body) {
        body.innerHTML = `<tr><td colspan="9" class="mad-empty text-danger">${esc(e.message || 'Unable to load repayments')}</td></tr>`;
      }
      if ($('mprRepayCount')) $('mprRepayCount').textContent = '0';
      if ($('mprRepayTotal')) $('mprRepayTotal').textContent = money(0);
      syncRepaySelectionUi();
      return [];
    }
  }

  async function submitRepayment(e) {
    e.preventDefault();
    const submitBtn = $('mprRepaySubmitBtn');
    const { plan, errors } = collectPayablePlan();
    if (errors.length) {
      setRepayStatus(errors[0], 'error');
      return;
    }
    if (!plan.length) {
      setRepayStatus('Enter at least one payment amount greater than 0.', 'error');
      return;
    }

    const total = plan.reduce((a, x) => a + x.amount, 0);
    if (submitBtn) submitBtn.disabled = true;
    setRepayStatus(`Recording ${plan.length} repayment${plan.length > 1 ? 's' : ''}...`);
    try {
      for (const item of plan) {
        await api(`/admin/main/settlements/${item.row.id}/payment`, {
          method: 'POST',
          body: JSON.stringify({
            amount: item.amount.toFixed(2),
            paymentDate: todayYmd(),
            referenceNo: '',
            note: 'Merchant repayment recorded from Repayments Due'
          })
        });
        delete state.repayAmounts[repayRowId(item.row)];
      }
      setRepayStatus(`Recorded ${reportCurrency()} ${money(total)} across ${plan.length} row${plan.length > 1 ? 's' : ''}.`, 'success');
      state.repaySelected.clear();
      await loadRepayments(true);
    } catch (err) {
      setRepayStatus(err.message || 'Unable to record repayment.', 'error');
      syncRepaySelectionUi();
    } finally {
      syncRepaySelectionUi();
    }
  }

  async function deleteRepayments(ids) {
    const targets = state.repayRows.filter((x) => ids.includes(repayRowId(x)));
    if (!targets.length) return;
    const label = targets.length === 1
      ? `Delete settlement for ${targets[0].counterpartyName || 'this merchant'} (${targets[0].month || ''})?`
      : `Delete ${targets.length} selected settlement records?`;
    const ok = window.BO_DIALOG?.confirm
      ? await BO_DIALOG.confirm(label, { title: 'Delete Settlement', confirmText: 'Delete', type: 'danger' })
      : false;
    if (!ok) return;

    setRepayStatus(`Deleting ${targets.length} item${targets.length > 1 ? 's' : ''}...`);
    const errors = [];
    for (const row of targets) {
      try {
        if (!row.id) throw new Error('Missing settlement id');
        await api('/admin/main/settlements/' + encodeURIComponent(row.id), { method: 'DELETE' });
        state.repaySelected.delete(repayRowId(row));
        delete state.repayAmounts[repayRowId(row)];
      } catch (err) {
        errors.push((row.counterpartyName || row.id) + ': ' + (err.message || 'failed'));
      }
    }
    await loadRepayments(true);
    if (errors.length) {
      setRepayStatus(errors[0], 'error');
      window.BO_DIALOG?.alert
        ? BO_DIALOG.alert(errors.join('\n'), { title: 'Delete incomplete', type: 'error' })
        : null;
    } else {
      setRepayStatus(targets.length === 1 ? 'Settlement deleted.' : `${targets.length} settlements deleted.`, 'success');
    }
  }

  $('mprRepayForm')?.addEventListener('submit', submitRepayment);
  $('mprRepayDeleteBtn')?.addEventListener('click', () => {
    const ids = [...state.repaySelected];
    if (ids.length) deleteRepayments(ids);
  });
  $('mprRepaySelectAll')?.addEventListener('change', (e) => {
    const on = !!e.target.checked;
    state.repaySelected.clear();
    if (on) state.repayRows.forEach((x) => state.repaySelected.add(repayRowId(x)));
    $('mprRepayRows')?.querySelectorAll('[data-repay-select]').forEach((el) => {
      el.checked = on;
      const id = el.getAttribute('data-repay-select');
      const amountInput = id ? document.querySelector(`[data-repay-amount="${CSS.escape(id)}"]`) : null;
      if (!amountInput) return;
      if (on && !(Number(amountInput.value) > 0)) {
        const bal = Number(amountInput.getAttribute('data-repay-balance') || 0);
        amountInput.value = bal > 0 ? bal.toFixed(2) : '';
        state.repayAmounts[id] = amountInput.value;
      }
      if (!on) {
        amountInput.value = '';
        delete state.repayAmounts[id];
      }
    });
    syncRepaySelectionUi();
  });
  $('mprRepayRows')?.addEventListener('change', (e) => {
    const amountInput = e.target.closest('[data-repay-amount]');
    if (amountInput) {
      const id = amountInput.getAttribute('data-repay-amount');
      const bal = Number(amountInput.getAttribute('data-repay-balance') || 0);
      let val = Number(amountInput.value);
      if (Number.isFinite(val) && val > bal) {
        val = bal;
        amountInput.value = bal.toFixed(2);
      }
      if (id) {
        if (Number.isFinite(val) && val > 0) state.repayAmounts[id] = amountInput.value;
        else delete state.repayAmounts[id];
      }
      syncRepaySelectionUi();
      return;
    }
    const input = e.target.closest('[data-repay-select]');
    if (!input) return;
    const id = input.getAttribute('data-repay-select');
    if (!id) return;
    const payInput = document.querySelector(`[data-repay-amount="${CSS.escape(id)}"]`);
    if (input.checked) {
      state.repaySelected.add(id);
      if (payInput && !(Number(payInput.value) > 0)) {
        const bal = Number(payInput.getAttribute('data-repay-balance') || 0);
        payInput.value = bal > 0 ? bal.toFixed(2) : '';
        state.repayAmounts[id] = payInput.value;
      }
    } else {
      state.repaySelected.delete(id);
    }
    syncRepaySelectionUi();
  });
  $('mprRepayRows')?.addEventListener('input', (e) => {
    const amountInput = e.target.closest('[data-repay-amount]');
    if (!amountInput) return;
    const id = amountInput.getAttribute('data-repay-amount');
    if (id) {
      if (Number(amountInput.value) > 0) state.repayAmounts[id] = amountInput.value;
      else delete state.repayAmounts[id];
    }
    syncRepaySelectionUi();
  });
  $('mprRepayRows')?.addEventListener('click', (e) => {
    const del = e.target.closest('[data-repay-delete]');
    if (!del) return;
    const id = del.getAttribute('data-repay-delete');
    if (id) deleteRepayments([id]);
  });

  async function bootstrap() {
    BO_AUTH.requireLogin();
    try {
      if (window.BO_MAIN_CURRENCY?.ready) await window.BO_MAIN_CURRENCY.ready();
    } catch (_) {}
    await loadRepayments(true);
  }

  bootstrap();
})();
