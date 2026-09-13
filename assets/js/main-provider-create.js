(function(){
  'use strict';

  const form = document.getElementById('mpvCreateForm');
  const statusEl = document.getElementById('mpvCreateStatus');
  const submitBtn = document.getElementById('mpvCreateSubmit');
  const codeEl = document.getElementById('mpvProviderCode');
  const nameEl = document.getElementById('mpvProviderName');
  const categoryEl = document.getElementById('mpvGameCategory');
  const percentEl = document.getElementById('mpvPercent');
  const currencyEl = document.getElementById('mpvCurrency');
  const remarkEl = document.getElementById('mpvRemark');
  const remarkCount = document.getElementById('mpvRemarkCount');
  const previewValue = document.getElementById('mpvRatePreviewValue');
  const previewName = document.getElementById('mpvPreviewName');
  const previewCode = document.getElementById('mpvPreviewCode');
  const previewCategory = document.getElementById('mpvPreviewCategory');
  const previewCurrency = document.getElementById('mpvPreviewCurrency');
  const previewRate = document.getElementById('mpvPreviewRate');

  const CATEGORY_LABELS = {
    SLOT: 'Slot',
    LIVE: 'Live',
    SPORTS: 'Sports',
    FISH: 'Fishing',
    LOTTERY: 'Lottery',
    ESPORTS: 'E-Sports'
  };

  function setStatus(text, cls){
    if(!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'upload-status mb-0' + (cls ? ' ' + cls : '');
  }

  function val(el){
    return String((el && el.value) || '').trim();
  }

  function formatPercent(raw){
    if(raw === '') return '—';
    const n = Number(raw);
    if(!Number.isFinite(n)) return '—';
    return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')) + '%';
  }

  function updateRemarkCount(){
    if(!remarkCount || !remarkEl) return;
    remarkCount.textContent = String(remarkEl.value.length);
  }

  function updatePreview(){
    /* Preview panel removed; keep hook for future summary UI. */
  }

  function normalizeCode(){
    if(!codeEl) return;
    const start = codeEl.selectionStart;
    const end = codeEl.selectionEnd;
    const next = codeEl.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if(next !== codeEl.value){
      codeEl.value = next;
      if(typeof start === 'number'){
        const pos = Math.min(next.length, start);
        try{ codeEl.setSelectionRange(pos, Math.min(next.length, end)); }catch(e){}
      }
    }
  }

  function populateCurrencies(){
    if(!currencyEl || !window.BO_MAIN_CURRENCY) return;
    const run = () => {
      const rates = (window.BO_MAIN_CURRENCY.state && window.BO_MAIN_CURRENCY.state.rates) || [];
      const codes = rates
        .filter(r => Number(r.status ?? 1) === 1)
        .map(r => String(r.currencyCode || '').toUpperCase())
        .filter(Boolean);
      const uniq = [...new Set(codes.length ? codes : ['MYR'])];
      const current = val(currencyEl) || 'MYR';
      currencyEl.innerHTML = uniq.map(c =>
        '<option value="' + c + '"' + (c === current ? ' selected' : '') + '>' + c + '</option>'
      ).join('');
      if(!uniq.includes(current)) currencyEl.value = uniq[0];
      updatePreview();
    };
    Promise.resolve(window.BO_MAIN_CURRENCY.load && window.BO_MAIN_CURRENCY.load()).then(run).catch(run);
  }

  [codeEl, nameEl, categoryEl, percentEl, currencyEl].forEach(el => {
    if(!el) return;
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });
  codeEl && codeEl.addEventListener('input', normalizeCode);
  remarkEl && remarkEl.addEventListener('input', updateRemarkCount);

  updateRemarkCount();
  updatePreview();
  populateCurrencies();

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const code = val(codeEl);
    const name = val(nameEl);
    const category = val(categoryEl);
    const percentRaw = val(percentEl);
    const currency = val(currencyEl);
    const remark = val(remarkEl);
    const percent = Number(percentRaw);

    if(!code || !name){
      setStatus('Provider Code and Provider Name are required.', 'text-danger');
      return;
    }
    if(!/^[A-Z0-9_]{2,32}$/.test(code)){
      setStatus('Provider Code must be 2–32 characters (A–Z, 0–9, underscore).', 'text-danger');
      return;
    }
    if(!category){
      setStatus('Please select a Game Category.', 'text-danger');
      return;
    }
    if(percentRaw === '' || !Number.isFinite(percent) || percent < 0 || percent > 100){
      setStatus('Percent must be a number between 0 and 100.', 'text-danger');
      return;
    }
    if(!currency){
      setStatus('Currency is required.', 'text-danger');
      return;
    }

    if(submitBtn) submitBtn.disabled = true;
    setStatus('Provider ready — API wiring comes next.', 'text-success');
    window.setTimeout(() => {
      if(submitBtn) submitBtn.disabled = false;
      try{
        sessionStorage.setItem('mpv_last_created', JSON.stringify({
          code, name, category, percent, currency, remark, at: Date.now()
        }));
      }catch(err){}
      location.href = 'main-provider-detail.html';
    }, 500);
  });
})();
