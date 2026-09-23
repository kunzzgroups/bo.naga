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

  function syncCollapseUi(panel){
    const collapsed = panel.classList.contains('is-collapsed');
    const toggle = panel.querySelector('[data-dt-collapse]');
    const icon = panel.querySelector('[data-dt-collapse-icon]');
    if(toggle){
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      toggle.setAttribute('aria-label', collapsed ? 'Expand language translation' : 'Collapse language translation');
      toggle.classList.remove('bo-ui-button','bo-ui-button-primary','bo-ui-button-secondary','bo-ui-button-danger','primary','clean-btn');
      delete toggle.dataset.boUiButton;
      toggle.setAttribute('data-bo-ui-skip','1');
    }
    if(icon){
      icon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-down';
      icon.setAttribute('data-dt-collapse-icon','');
    }
  }

  function ensureCollapseChrome(panel){
    if(!panel) return;
    let toggle = panel.querySelector('[data-dt-collapse]');
    if(!toggle){
      const head = panel.querySelector('.dynamic-translation-head');
      if(!head) return;
      const titleWrap = head.querySelector(':scope > div, :scope > h3');
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'dynamic-translation-toggle';
      toggle.setAttribute('data-dt-collapse','');
      toggle.setAttribute('data-bo-ui-skip','1');
      toggle.innerHTML = '<span class="dt-collapse-chevron" aria-hidden="true"><i class="bi bi-chevron-down" data-dt-collapse-icon></i></span><span class="dt-collapse-title">Language Translation</span>';
      if(titleWrap){
        const existingTitle = titleWrap.querySelector('h3,b');
        if(existingTitle && toggle.querySelector('.dt-collapse-title')){
          toggle.querySelector('.dt-collapse-title').textContent = existingTitle.textContent.trim() || 'Language Translation';
        }
        titleWrap.replaceWith(toggle);
      }else{
        head.insertBefore(toggle, head.firstChild);
      }
    }else{
      /* Migrate older toggle markup (title+lead inside button) to compact accordion control */
      if(!toggle.querySelector('.dt-collapse-title')){
        const oldTitle = toggle.querySelector('b,h3')?.textContent?.trim() || 'Language Translation';
        toggle.innerHTML = `<span class="dt-collapse-chevron" aria-hidden="true"><i class="bi bi-chevron-down" data-dt-collapse-icon></i></span><span class="dt-collapse-title">${oldTitle}</span>`;
      }
      toggle.setAttribute('data-bo-ui-skip','1');
      toggle.classList.remove('bo-ui-button','bo-ui-button-primary','bo-ui-button-secondary','bo-ui-button-danger','primary','clean-btn');
      delete toggle.dataset.boUiButton;
    }
    if(!panel.hasAttribute('data-dt-collapse-init')){
      const preferCollapsed = !!(panel.closest('#crudPatternModal') || document.body.classList.contains('page-game'));
      if(preferCollapsed) panel.classList.add('is-collapsed');
      panel.setAttribute('data-dt-collapse-init','1');
    }
    syncCollapseUi(panel);
  }

  function ensurePanel(form){
    let panel = form.querySelector('[data-dynamic-translation-panel]');
    if(panel){
      ensureCollapseChrome(panel);
      return panel;
    }
    panel = document.createElement('div');
    panel.className = 'dynamic-translation-panel';
    panel.setAttribute('data-dynamic-translation-panel','1');
    panel.innerHTML = '<div class="dynamic-translation-head"><button type="button" class="dynamic-translation-toggle" data-dt-collapse data-bo-ui-skip="1" aria-expanded="true"><span class="dt-collapse-chevron" aria-hidden="true"><i class="bi bi-chevron-down" data-dt-collapse-icon></i></span><span class="dt-collapse-title">Language Translation</span></button><button class="clean-btn" type="button" data-refresh-translation><i class="bi bi-arrow-clockwise"></i> Refresh</button></div><div data-dynamic-translation-body class="dynamic-translation-body"><div class="dt-state dt-state--idle"><i class="bi bi-translate" aria-hidden="true"></i><b>Ready when content is selected</b><span>Save or edit an item first, then manage translations here.</span></div></div>';
    const host = form.querySelector('[data-translation-panel-host]');
    const actions = form.querySelector('.slider-form-actions');
    if(host) host.appendChild(panel);
    else if(actions) actions.before(panel);
    else form.appendChild(panel);
    ensureCollapseChrome(panel);
    return panel;
  }

  function textEditorHtml(f, value, langCode){
    const common=`data-dt-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"`;
    if(f.type==='textarea' || f.type==='html'){
      const rows=f.rows || (f.type==='html'?9:5);
      const hint=f.type==='html'?'<small class="dynamic-field-hint">HTML/rich-text markup is preserved.</small>':'';
      return `<div class="dynamic-text-edit"><textarea rows="${rows}" ${common}>${esc(value)}</textarea>${hint}<button class="clean-btn dt-save-btn" type="button" data-dt-save-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"><i class="bi bi-check2"></i> Save</button></div>`;
    }
    return `<div class="dynamic-text-edit"><input type="text" value="${esc(value)}" ${common}><button class="clean-btn dt-save-btn" type="button" data-dt-save-text data-lang="${esc(langCode)}" data-field="${esc(f.key)}"><i class="bi bi-check2"></i> Save</button></div>`;
  }

  function imageEditorHtml(f, value, langCode){
    const preview = value
      ? `<img src="${esc(value)}" alt="${esc(f.label)}" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{textContent:'No image'}))">`
      : '<span>No image</span>';
    return `<div class="dynamic-image-edit">` +
      `<div class="dynamic-image-preview">${preview}</div>` +
      `<label class="dynamic-file-pick">` +
        `<input type="file" accept="image/*" data-dt-file data-lang="${esc(langCode)}" data-field="${esc(f.key)}">` +
        `<span class="dynamic-file-pick-ui" aria-hidden="true"><i class="bi bi-folder2-open"></i><em data-dt-file-label>Choose file</em></span>` +
      `</label>` +
      `<button class="clean-btn dt-save-btn dt-save-btn--image" type="button" data-dt-save-image data-lang="${esc(langCode)}" data-field="${esc(f.key)}"><i class="bi bi-upload"></i> Upload</button>` +
    `</div>`;
  }

  async function render(ctx){
    const refId = ctx.idInput.value;
    const panel = ensurePanel(ctx.form);
    const body = panel.querySelector('[data-dynamic-translation-body]');
    const fields = detectFields(ctx.form, ctx.fields);
    if(!refId){
      body.innerHTML = '<div class="dt-state dt-state--idle"><i class="bi bi-translate" aria-hidden="true"></i><b>No item selected</b><span>Save default content first, then open Edit to add translations.</span></div>';
      return;
    }
    if(!fields.length){
      body.innerHTML = '<div class="dt-state dt-state--idle"><i class="bi bi-info-circle" aria-hidden="true"></i><b>No translatable fields</b><span>This form has no fields marked for translation yet.</span></div>';
      return;
    }
    body.innerHTML = '<div class="dt-state dt-state--loading"><i class="bi bi-hourglass-split" aria-hidden="true"></i><b>Loading translations…</b></div>';
    try{
      const [langs, translations] = await Promise.all([loadLanguages(), loadTranslations(ctx.refType, refId)]);
      if(!langs.length){
        body.innerHTML = '<div class="dt-state dt-state--idle"><i class="bi bi-translate" aria-hidden="true"></i><b>No extra languages yet</b><span>Add languages in Language settings, then refresh this panel.</span></div>';
        return;
      }
      body.innerHTML = langs.map(lang => {
        const data = translations[lang.code] || {};
        const imageRows = [];
        const textRows = [];
        fields.forEach(f => {
          const value = f.type === 'image' ? (data[f.key+'Url'] || data[f.key] || '') : (data[f.key] || '');
          const row = `<div class="dynamic-field-row${f.type==='image'?' dynamic-field-row--image':''}"><label>${esc(f.label)}</label>${f.type === 'image' ? imageEditorHtml(f, value, lang.code) : textEditorHtml(f,value,lang.code)}</div>`;
          if(f.type === 'image') imageRows.push(row); else textRows.push(row);
        });
        return `<div class="dynamic-lang-card">` +
          `<div class="dynamic-lang-title"><b>${esc(lang.name)}</b><span class="dynamic-lang-code">${esc(lang.code)}</span></div>` +
          `<div class="dynamic-lang-layout">` +
            (imageRows.length ? `<div class="dynamic-lang-media">${imageRows.join('')}</div>` : '') +
            (textRows.length ? `<div class="dynamic-lang-texts">${textRows.join('')}</div>` : '') +
          `</div></div>`;
      }).join('');
    }catch(e){
      const msg=String(e&&e.message||'Request failed');
      const perm=/permission|forbidden|401|403/i.test(msg);
      body.innerHTML = `<div class="dt-state dt-state--error"><i class="bi bi-shield-exclamation" aria-hidden="true"></i><b>${perm?'Translation access needed':'Unable to load translations'}</b>${perm?'<span class="dt-state-hint">Ask an admin to grant translation permission, then hit Refresh.</span>':''}</div>`;
    }
  }

  async function saveText(ctx, btn){
    const refId=ctx.idInput.value, lang=btn.dataset.lang, field=btn.dataset.field;
    const input=ctx.form.querySelector(`[data-dt-text][data-lang="${CSS.escape(lang)}"][data-field="${CSS.escape(field)}"]`);
    const fd=new FormData(); fd.append('refType',ctx.refType); fd.append('refId',refId); fd.append('langCode',lang); fd.append('fieldKey',field); fd.append('textValue',input.value||'');
    await json(api('TRANSLATION_TEXT'),{method:'POST',body:fd});
    btn.innerHTML='<i class="bi bi-check-circle"></i> Saved'; setTimeout(()=>btn.innerHTML='<i class="bi bi-check2"></i> Save',1000);
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
    const label = row ? row.querySelector('[data-dt-file-label]') : null;
    const file = input.files && input.files[0];
    if(label){
      label.textContent = file ? file.name : 'Choose file';
      label.title = file ? file.name : '';
    }
    if(!preview || !file) return;
    if(!file.type || !file.type.startsWith('image/')){
      input.value = '';
      if(label){ label.textContent = 'Choose file'; label.removeAttribute('title'); }
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
      const collapse=e.target.closest('[data-dt-collapse]');
      const refresh=e.target.closest('[data-refresh-translation]');
      const txt=e.target.closest('[data-dt-save-text]');
      const img=e.target.closest('[data-dt-save-image]');
      if(collapse){
        const panel = collapse.closest('[data-dynamic-translation-panel]');
        if(panel){
          panel.classList.toggle('is-collapsed');
          syncCollapseUi(panel);
        }
        return;
      }
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
    // Keep EN / ZH / MY asset rows in the DOM — Site Customize language tabs own them.
    // Only feed non-locale-suffix rows into the Language Translation panel below.
    const rows=[...container.querySelectorAll('.asset-upload-row[data-field]')].filter(r=>{
      const field=String(r.dataset.field||'');
      const locale=String(r.dataset.locale||'').toLowerCase();
      if(/Zh$/i.test(field) || /My$/i.test(field)) return false;
      if(locale && locale!=='en' && locale!=='all') return false;
      return true;
    });
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
