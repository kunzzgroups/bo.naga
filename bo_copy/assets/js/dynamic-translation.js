(function(){
  'use strict';

  function esc(v){return String(v ?? '').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
  function api(pathKey){return (window.API_CONFIG?.BASE_URL || '') + (window.API_CONFIG?.ENDPOINTS?.[pathKey] || '');}
  async function json(url,opt){const r=await fetch(url,opt); const j=await r.json().catch(()=>({})); if(!r.ok || j.status==='error') throw new Error(j.message||'Request failed'); return j;}
  function isImageField(field, input){return (input && input.type === 'file') || /image|icon|logo|favicon|banner|background|thumb|picture|photo/i.test(field);}
  function cleanFieldName(name){return String(name||'').replace(/Url$/,'').replace(/File$/,'');}
  function labelize(key){return String(key||'').replace(/([A-Z])/g,' $1').replace(/[_-]+/g,' ').replace(/^./,c=>c.toUpperCase());}
  function truthy(v){return /^(1|true|yes|on)$/i.test(String(v||''));}
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

  function normalizeFieldDescriptor(raw){
    if(typeof raw === 'string') raw={key:raw};
    raw=raw||{};
    const key=cleanFieldName(raw.key||'');
    if(!key) return null;
    let type=String(raw.type||'text').toLowerCase();
    if(!['text','textarea','html','image'].includes(type)) type='text';
    return {key, type, label:raw.label||labelize(key), rows:Number(raw.rows||0)||undefined};
  }

  function descriptorFromElement(input, allowId){
    if(!input || input.closest('[data-skip-translation]')) return null;
    const explicitKey=input.getAttribute('data-translation-key');
    const rawName=input.getAttribute('name');
    const rawId=input.getAttribute('id');
    const raw=explicitKey || rawName || (allowId ? rawId : '');
    if(!raw) return null;
    const key=cleanFieldName(raw);
    if(EXCLUDE.has(key)) return null;
    if(/Zh$|Ms$|Th$|Vn$|Cn$|Jp$/i.test(raw)) return null;

    let type=String(input.getAttribute('data-translation-type')||'').toLowerCase();
    if(!type){
      if(isImageField(key,input)) type='image';
      else if(input.tagName==='TEXTAREA') type='textarea';
      else type='text';
    }
    if(!['text','textarea','html','image'].includes(type)) type='text';

    if(type!=='image'){
      const inputType=String(input.type||'').toLowerCase();
      const allowedInput=['text','search','url','email','tel',''];
      if(input.tagName!=='TEXTAREA' && !allowedInput.includes(inputType)) return null;
    }

    const label=input.getAttribute('data-translation-label') || input.closest('.field')?.querySelector('label')?.textContent?.trim() || labelize(key);
    const rows=Number(input.getAttribute('data-translation-rows')||0)||undefined;
    return {key,type,label,rows};
  }

  function detectFields(form, extraFields){
    const out = new Map();
    (extraFields || []).forEach(f=>{const d=normalizeFieldDescriptor(f); if(d) out.set(d.key,d);});

    // Explicit data-translation-key always works, regardless of whether the element has name="" or id="".
    form.querySelectorAll('[data-translation-key]').forEach(input=>{
      const d=descriptorFromElement(input,true); if(d) out.set(d.key,d);
    });

    // Backward compatibility: existing pages use name="fieldKey" and require no extra markup.
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(input=>{
      const d=descriptorFromElement(input,false); if(d && !out.has(d.key)) out.set(d.key,d);
    });

    // Optional generic id-based mode for new pages. Enable once on the form with data-translation-use-id="true".
    if(truthy(form.dataset.translationUseId)){
      form.querySelectorAll('input[id], textarea[id], select[id]').forEach(input=>{
        const d=descriptorFromElement(input,true); if(d && !out.has(d.key)) out.set(d.key,d);
      });
    }
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
    panel.innerHTML = '<div class="dynamic-translation-head"><div><h3>Language Translation</h3><small>Translations are stored by content type + item ID + language + field key. Blank translation values automatically fall back to the default content.</small></div><button class="clean-btn" type="button" data-refresh-translation><i class="bi bi-arrow-clockwise"></i> Refresh</button></div><div data-dynamic-translation-body class="dynamic-translation-body"><div class="slider-empty">Save or edit an item to manage translations.</div></div>';
    const host = form.querySelector('[data-translation-panel-host]');
    const actions = form.querySelector('.slider-form-actions');
    if(host) host.appendChild(panel);
    else if(actions) actions.before(panel);
    else form.appendChild(panel);
    return panel;
  }

  function textEditorHtml(f, value, langCode){
    const common=`data-dt-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"`;
    if(f.type==='textarea' || f.type==='html'){
      const rows=f.rows || (f.type==='html'?9:5);
      const hint=f.type==='html'?'<small class="dynamic-field-hint">HTML/rich-text markup is preserved.</small>':'';
      return `<div class="dynamic-text-edit"><textarea rows="${rows}" ${common}>${esc(value)}</textarea>${hint}<button class="clean-btn primary" type="button" data-dt-save-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"><i class="bi bi-save"></i> Save Text</button></div>`;
    }
    return `<div class="dynamic-text-edit"><input type="text" value="${esc(value)}" ${common}><button class="clean-btn primary" type="button" data-dt-save-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"><i class="bi bi-save"></i> Save Text</button></div>`;
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
    if(!fields.length){
      body.innerHTML = '<div class="slider-empty"><i class="bi bi-info-circle"></i><b>No translatable fields detected</b><small>Use name="fieldKey", data-translation-key="fieldKey", or enable id detection on the form.</small></div>';
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
          return `<div class="dynamic-field-row"><label>${esc(f.label)}</label>${f.type === 'image' ? `<div class="dynamic-image-edit"><input type="file" accept="image/*" data-dt-file data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><div class="dynamic-image-preview">${value ? `<img src="${esc(value)}" alt="${esc(f.label)}">` : '<span>No image</span>'}</div><button class="clean-btn primary" type="button" data-dt-save-image data-lang="${esc(lang.code)}" data-field="${esc(f.key)}"><i class="bi bi-upload"></i> Save Image</button></div>` : textEditorHtml(f,value,lang.code)}</div>`;
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
    const form = options.form || document.getElementById(options.formId);
    const idInput = options.idInput || document.querySelector(options.idSelector);
    if(!form || !idInput || !options.refType || form.dataset.dynamicTranslationAttached==='1') return;
    form.dataset.dynamicTranslationAttached='1';
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

  function autoAttach(root){
    const scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('form[data-translation-ref-type]').forEach(form=>{
      if(form.dataset.dynamicTranslationAttached==='1') return;
      const refType=String(form.dataset.translationRefType||'').trim();
      const selector=String(form.dataset.translationIdSelector||'').trim();
      let idInput=selector ? document.querySelector(selector) : form.querySelector('[data-translation-id], input[type="hidden"][name="id"], input[type="hidden"][id$="Id"]');
      if(refType && idInput) attach({form,idInput,refType});
    });
  }

  function attachAssetPanel(options){
    const container=document.querySelector(options.containerSelector || '.customize-card');
    if(!container || container.dataset.dynamicTranslationAttached==='1') return;
    container.dataset.dynamicTranslationAttached='1';
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

  window.DynamicTranslation = { attach, attachAssetPanel, autoAttach, detectFields };
  // Declarative mode: any future form can opt in with data-translation-ref-type and data-translation-id-selector.
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>autoAttach(document)); else autoAttach(document);
})();
