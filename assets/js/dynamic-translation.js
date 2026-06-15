(function(){
  function esc(v){return String(v ?? '').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
  function api(pathKey){return (window.API_CONFIG?.BASE_URL || '') + (window.API_CONFIG?.ENDPOINTS?.[pathKey] || '');}
  async function json(url,opt){const r=await fetch(url,opt); const j=await r.json().catch(()=>({})); if(!r.ok || j.status==='error') throw new Error(j.message||'Request failed'); return j;}
  function isImageField(field, input){return (input && input.type === 'file') || /image|icon|logo|favicon|banner|background|thumb|picture|photo/i.test(field);}
  function cleanFieldName(name){return String(name||'').replace(/Url$/,'').replace(/File$/,'');}
  function labelize(key){return String(key||'').replace(/([A-Z])/g,' $1').replace(/[_-]+/g,' ').replace(/^./,c=>c.toUpperCase());}
  const EXCLUDE = new Set(['id','sortOrder','status','categoryId','subCategoryId','providerCode','gameUrl','url','link','createdAt','updatedAt']);

  async function loadLanguages(){
    const url = api('LANGUAGE_LIST');
    if(!url) return [];
    const data = await json(url);
    return (data.data || []).filter(l => Number(l.status ?? 1) === 1 && String(l.code || '').toLowerCase() !== 'en');
  }

  async function loadTranslations(refType, refId){
    if(!refType || !refId) return {};
    const url = api('TRANSLATION_GET') + '?' + new URLSearchParams({refType, refId}).toString();
    const data = await json(url);
    return data.data || {};
  }

  function detectFields(form, extraFields){
    const out = new Map();
    (extraFields || []).forEach(f => out.set(f.key || f, {key:f.key || f, type:f.type || 'text', label:f.label || labelize(f.key || f)}));
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(input => {
      const raw = input.getAttribute('name');
      if(!raw) return;
      const key = cleanFieldName(raw);
      if(EXCLUDE.has(key)) return;
      if(/Zh$|Ms$|Th$|Vn$|Cn$|Jp$/i.test(raw)) return;
      if(input.closest('[data-skip-translation]')) return;
      const type = isImageField(key, input) ? 'image' : 'text';
      if(type === 'text' && !['text','textarea','search'].includes(input.type || 'textarea') && input.tagName !== 'TEXTAREA') return;
      out.set(key, {key, type, label: labelize(key)});
    });
    return [...out.values()];
  }


  function removeLegacyZh(form){
    form.querySelectorAll('[name$="Zh"], [id$="Zh"]').forEach(el => {
      const box = el.closest('.slider-upload-box');
      if(box){
        const prev = box.previousElementSibling;
        const next = box.nextElementSibling;
        if(prev && prev.classList.contains('slider-upload-section-title')) prev.remove();
        if(next && next.classList.contains('slider-current-image')) next.remove();
        box.remove();
        return;
      }
      const field = el.closest('.field');
      if(field) field.remove();
    });
  }

  function ensurePanel(form){
    let panel = form.querySelector('[data-dynamic-translation-panel]');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'dynamic-translation-panel';
    panel.setAttribute('data-dynamic-translation-panel','1');
    panel.innerHTML = '<div class="dynamic-translation-head"><div><h3>Language Translation</h3></div><button class="clean-btn" type="button" data-refresh-translation><i class="bi bi-arrow-clockwise"></i> Refresh</button></div><div data-dynamic-translation-body class="dynamic-translation-body"><div class="slider-empty">Save or edit an item to manage translations.</div></div>';
    const actions = form.querySelector('.slider-form-actions');
    if(actions) actions.before(panel); else form.appendChild(panel);
    return panel;
  }

  async function render(ctx){
    const refId = ctx.idInput.value;
    const panel = ensurePanel(ctx.form);
    const body = panel.querySelector('[data-dynamic-translation-body]');
    const fields = detectFields(ctx.form, ctx.fields);
    if(!refId){
      body.innerHTML = '<div class="slider-empty"><i class="bi bi-translate"></i><b>No item selected</b><small>Save default data first, then click Edit to add translations.</small></div>';
      return;
    }
    body.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading translations...</b></div>';
    try{
      const [langs, translations] = await Promise.all([loadLanguages(), loadTranslations(ctx.refType, refId)]);
      if(!langs.length){
        body.innerHTML = '<div class="slider-empty"><i class="bi bi-translate"></i><b>No active extra language</b><small>Add languages in Language page first.</small></div>';
        return;
      }
      body.innerHTML = langs.map(lang => {
        const data = translations[lang.code] || {};
        return `<div class="dynamic-lang-card"><div class="dynamic-lang-title"><b>${esc(lang.name)}</b><small>${esc(lang.code)}</small></div>${fields.map(f=>{
          const value = f.type === 'image' ? (data[f.key+'Url'] || data[f.key] || '') : (data[f.key] || '');
          return `<div class="dynamic-field-row"><label>${esc(f.label)}</label>${f.type === 'image' ? `<div class="dynamic-image-edit"><input type="file" accept="image/*" data-dt-file data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><div class="dynamic-image-preview">${value ? `<img src="${esc(value)}" alt="${esc(f.label)}">` : '<span>No image</span>'}</div><button class="clean-btn primary" type="button" data-dt-save-image data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><i class="bi bi-upload"></i> Save Image</button></div>` : `<div class="dynamic-text-edit"><input type="text" value="${esc(value)}" data-dt-text data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><button class="clean-btn primary" type="button" data-dt-save-text data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><i class="bi bi-save"></i> Save Text</button></div>`}</div>`;
        }).join('')}</div>`;
      }).join('');
    }catch(e){body.innerHTML = `<div class="slider-empty"><i class="bi bi-exclamation-triangle"></i><b>Unable to load translations</b><small>${esc(e.message)}</small></div>`;}
  }

  async function saveText(ctx, btn){
    const refId=ctx.idInput.value, lang=btn.dataset.lang, field=btn.dataset.field;
    const input=ctx.form.querySelector(`[data-dt-text][data-lang="${CSS.escape(lang)}"][data-field="${CSS.escape(field)}"]`);
    const fd=new FormData(); fd.append('refType',ctx.refType); fd.append('refId',refId); fd.append('langCode',lang); fd.append('fieldKey',field); fd.append('textValue',input.value||'');
    await json(api('TRANSLATION_TEXT'),{method:'POST',body:fd});
    btn.innerHTML='<i class="bi bi-check-circle"></i> Saved'; setTimeout(()=>btn.innerHTML='<i class="bi bi-save"></i> Save Text',1000);
  }
  async function saveImage(ctx, btn){
    const refId=ctx.idInput.value, lang=btn.dataset.lang, field=btn.dataset.field;
    const input=ctx.form.querySelector(`[data-dt-file][data-lang="${CSS.escape(lang)}"][data-field="${CSS.escape(field)}"]`);
    if(!input.files[0]){alert('Please choose image first.'); return;}
    const fd=new FormData(); fd.append('refType',ctx.refType); fd.append('refId',refId); fd.append('langCode',lang); fd.append('fieldKey',field); fd.append('image',input.files[0]);
    await json(api('TRANSLATION_IMAGE'),{method:'POST',body:fd});
    await render(ctx);
  }

  function previewSelectedImage(form, input){
    const lang = input.dataset.lang;
    const field = input.dataset.field;
    const row = input.closest('.dynamic-image-edit');
    const preview = row ? row.querySelector('.dynamic-image-preview') : null;
    const file = input.files && input.files[0];
    if(!preview || !file) return;
    if(!file.type || !file.type.startsWith('image/')){
      input.value = '';
      alert('Please choose image file only.');
      return;
    }
    const oldUrl = preview.dataset.objectUrl;
    if(oldUrl) URL.revokeObjectURL(oldUrl);
    const url = URL.createObjectURL(file);
    preview.dataset.objectUrl = url;
    preview.innerHTML = `<img src="${url}" alt="${esc(field || 'Preview')}">`;
  }

  function attach(options){
    const form = document.getElementById(options.formId);
    const idInput = document.querySelector(options.idSelector);
    if(!form || !idInput || !options.refType) return;
    removeLegacyZh(form);
    const ctx = {form, idInput, refType:options.refType, fields:options.fields || []};
    ensurePanel(form);
    form.addEventListener('click', e => {
      const refresh=e.target.closest('[data-refresh-translation]');
      const txt=e.target.closest('[data-dt-save-text]');
      const img=e.target.closest('[data-dt-save-image]');
      if(refresh){ render(ctx); }
      if(txt){ saveText(ctx, txt).catch(err=>alert(err.message)); }
      if(img){ saveImage(ctx, img).catch(err=>alert(err.message)); }
    });
    form.addEventListener('change', e => {
      const fileInput = e.target.closest('[data-dt-file]');
      if(fileInput) previewSelectedImage(form, fileInput);
    });
    let last = null;
    setInterval(()=>{ if(idInput.value !== last){ last = idInput.value; render(ctx); }}, 400);
    render(ctx);
  }



  function attachAssetPanel(options){
    const container=document.querySelector(options.containerSelector || '.customize-card');
    if(!container) return;
    // Remove old hardcoded per-language asset rows such as logoUrlZh.
    container.querySelectorAll('.asset-upload-row[data-field$="Zh"]').forEach(x=>x.remove());
    const rows=[...container.querySelectorAll('.asset-upload-row[data-field]')].filter(r=>!/Zh$/i.test(r.dataset.field||''));
    if(!rows.length) return;
    const fields=rows.map(r=>({key:r.dataset.field, type:'image', label:(r.querySelector('label')?.textContent||labelize(r.dataset.field)).trim()}));
    let form=document.createElement('div'); form.id='dynamicMainLayoutTranslationForm'; form.className='slider-form';
    container.appendChild(form);
    const idInput=document.createElement('input'); idInput.type='hidden'; idInput.value=String(options.refId || 1); form.appendChild(idInput);
    const ctx={form,idInput,refType:options.refType||'main_layout',fields};
    ensurePanel(form);
    form.addEventListener('click', e=>{
      const refresh=e.target.closest('[data-refresh-translation]');
      const txt=e.target.closest('[data-dt-save-text]');
      const img=e.target.closest('[data-dt-save-image]');
      if(refresh) render(ctx);
      if(txt) saveText(ctx, txt).catch(err=>alert(err.message));
      if(img) saveImage(ctx, img).catch(err=>alert(err.message));
    });
    form.addEventListener('change', e=>{
      const fileInput = e.target.closest('[data-dt-file]');
      if(fileInput) previewSelectedImage(form, fileInput);
    });
    render(ctx);
  }

  window.DynamicTranslation = { attach, attachAssetPanel };
})();
