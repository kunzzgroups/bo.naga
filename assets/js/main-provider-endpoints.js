(function(){
  'use strict';

  const form = document.getElementById('mpvIntegForm');
  const statusEl = document.getElementById('mpvIntegStatus');
  const typeSelect = document.getElementById('mpvAggregatorType');
  const saveBtn = document.getElementById('mpvIntegSave');

  function setStatus(text, cls){
    if(!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'upload-status mb-0' + (cls ? ' ' + cls : '');
  }

  function measureLabelWidth(text, reference){
    const canvas = measureLabelWidth._c || (measureLabelWidth._c = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    if(!ctx) return String(text || '').length * 7;
    const cs = getComputedStyle(reference || document.body);
    ctx.font = [cs.fontStyle, cs.fontVariant, cs.fontWeight, cs.fontSize, cs.fontFamily].filter(Boolean).join(' ');
    return Math.ceil(ctx.measureText(String(text || '').trim()).width);
  }

  function sizeFilterSelect(select){
    if(!select || !select.options || !select.options.length) return;
    const wrap = select.closest('.rounded-select-wrap');
    const btn = wrap && wrap.querySelector('.rounded-select-btn');
    const ref = btn || select;
    const labels = Array.from(select.options).map(o => String(o.textContent || o.label || '').trim()).filter(Boolean);
    if(!labels.length) return;
    const widest = Math.max.apply(null, labels.map(label => measureLabelWidth(label, ref)));
    const width = Math.max(160, widest + 60);
    if(wrap){
      wrap.style.setProperty('width', width + 'px', 'important');
      wrap.style.setProperty('min-width', width + 'px', 'important');
      wrap.style.setProperty('max-width', width + 'px', 'important');
      wrap.style.setProperty('flex', '0 0 ' + width + 'px', 'important');
      if(btn){
        btn.style.setProperty('width', width + 'px', 'important');
        btn.style.setProperty('min-width', width + 'px', 'important');
      }
      const menu = wrap.querySelector('.rounded-select-menu');
      if(menu){
        menu.style.setProperty('min-width', width + 'px', 'important');
        menu.style.setProperty('width', 'max-content', 'important');
      }
    }else{
      select.style.setProperty('width', width + 'px', 'important');
      select.style.setProperty('min-width', width + 'px', 'important');
    }
  }

  function sizeAggregatorSelect(){
    sizeFilterSelect(typeSelect);
  }

  document.querySelectorAll('[data-toggle-password]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const id = btn.getAttribute('data-toggle-password');
      const input = id && document.getElementById(id);
      if(!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      const icon = btn.querySelector('i');
      if(icon) icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      btn.setAttribute('aria-label', show ? 'Hide secret' : 'Show secret');
    });
  });

  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    if(saveBtn){
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving…';
    }
    setStatus('Saving integration settings…', '');
    setTimeout(function(){
      setStatus('Integration settings saved.', 'text-success');
      if(saveBtn){
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check2"></i> Save Changes';
      }
      if(typeof window.showBoAlert === 'function'){
        window.showBoAlert('Integration settings saved.');
      }
    }, 450);
  });

  sizeAggregatorSelect();
  requestAnimationFrame(sizeAggregatorSelect);
  setTimeout(sizeAggregatorSelect, 0);
  setTimeout(sizeAggregatorSelect, 50);
  setTimeout(sizeAggregatorSelect, 200);

  const field = document.querySelector('.mpv-integ-select-field');
  if(field && typeof MutationObserver !== 'undefined'){
    const mo = new MutationObserver(function(){ sizeAggregatorSelect(); });
    mo.observe(field, { childList: true, subtree: true });
  }
})();
