(function(){
'use strict';
/* Bonus Category Title — create / edit, on its own page (bonus-category-title-edit.html).

   Lifted out of promotion.html's shared modal: the form, the image picker and the save call are
   the ones promotion-workspace.js owned for the category card, re-scoped to this page. The list
   side of that file (rows, groups, paging, the delete call) stayed there.

     promotion.html "Add Bonus Category"     -> this page, no query
     a category row's pencil                 -> this page + ?id=<category id>

   Back / Cancel return to promotion.html, the listing this form belongs to (auth.js aliases the
   page's menu permission and its sidebar highlight onto it).

   Part of the rotation that made these two forms pages rather than modals: see
   assets/css/promotion-form-page.css for the layout this markup is written for. */
const $ = id => document.getElementById(id);
const base = window.API_BASE || '';

function endpoint(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }
function actorName(){
  const u = (window.BO_AUTH && BO_AUTH.user) ? BO_AUTH.user() : {};
  return u.username || u.displayName || localStorage.getItem('adminUsername') || localStorage.getItem('admin_username') || 'ADMIN';
}
function authHeaders(extra){
  const baseHeaders = (window.BO_AUTH && BO_AUTH.authHeader) ? BO_AUTH.authHeader() : {};
  return Object.assign({}, baseHeaders, { 'X-Admin-Username': actorName(), 'Cache-Control': 'no-cache' }, extra || {});
}
async function req(url, opt){
  opt = opt || {};
  opt.headers = authHeaders(opt.headers);
  opt.cache = opt.cache || 'no-store';
  const res = await fetch(url, opt);
  const json = await res.json().catch(() => ({}));
  if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
  return json;
}
function toast(message, type){
  try{ if(window.BO_TOAST && typeof BO_TOAST[type || 'success'] === 'function') BO_TOAST[type || 'success'](message); }catch(e){}
}
function firstDefined(obj, keys){
  for(let i = 0; i < keys.length; i++){
    const v = obj && obj[keys[i]];
    if(v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}
function imageUrl(item){
  if(item && item.imageUrl) return String(item.imageUrl);
  const value = String((item && item.image) || '').trim();
  return value;
}
function queryId(){
  try{ return String(new URLSearchParams(location.search || '').get('id') || '').trim(); }catch(e){ return ''; }
}

(function(){
  const form = $('bonusForm');
  if(!form) return;

  const idInput = $('bonusId');
  const nameInput = $('bonusName');
  const sortInput = $('bonusSortOrder');
  const imageInput = $('bonusImage');
  const dropZone = $('bonusDropZone');
  const preview = $('bonusPreview');
  const placeholder = $('bonusUploadPlaceholder');
  const currentImage = $('bonusCurrentImage');
  const saveBtn = $('saveBonusBtn');
  const statusBox = $('bonusStatusBox');
  const backLink = $('bctBackLink');
  const cancelLink = $('bctCancelLink');
  const pageTitle = $('bctPageTitle');
  const editId = queryId();
  let selectedFile = null;

  function setStatus(message, type){
    if(!statusBox) return;
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }
  function showPreview(src){
    if(!preview || !placeholder) return;
    preview.src = src;
    preview.hidden = false;
    placeholder.hidden = true;
  }
  function clearPreview(){
    selectedFile = null;
    if(imageInput) imageInput.value = '';
    if(preview){ preview.src = ''; preview.hidden = true; }
    if(placeholder) placeholder.hidden = false;
  }
  function setTitle(text){
    if(pageTitle) pageTitle.textContent = text;
    document.title = text;
  }

  /* `?id=` decides the mode; without a record to load the page stays in create mode and says so
     rather than silently posting an update. */
  async function loadRecord(){
    if(!editId){ setTitle('Add Bonus Category'); return; }
    setStatus('Loading category…', '');
    try{
      const json = await req(endpoint('BONUS_CATEGORY_TITLE_LIST') + '?page=1&size=300&_=' + Date.now());
      const rows = Array.isArray(json.data) ? json.data : (json.data && json.data.data) || [];
      const cat = rows.filter(x => String(firstDefined(x, ['id', 'categoryTitleId', 'bonusCategoryTitleId'])) === editId)[0];
      if(!cat) throw new Error('Bonus category #' + editId + ' was not found.');
      if(idInput) idInput.value = firstDefined(cat, ['id', 'categoryTitleId', 'bonusCategoryTitleId']) || '';
      if(nameInput) nameInput.value = firstDefined(cat, ['name', 'title']) || '';
      if(sortInput) sortInput.value = firstDefined(cat, ['sortOrder', 'sort_order', 'displayOrder']) || 0;
      const src = imageUrl(cat);
      clearPreview();
      if(src) showPreview(src);
      if(currentImage) currentImage.hidden = !src;
      setTitle('Edit Bonus Category #' + editId);
      setStatus('', '');
    }catch(err){
      setStatus(err.message || 'Unable to load this category.', 'error');
    }
  }

  if(imageInput && dropZone){
    imageInput.addEventListener('change', () => handleFile(imageInput.files && imageInput.files[0]));
    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    });
    dropZone.addEventListener('drop', e => handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]));
  }
  function handleFile(file){
    if(!file) return;
    if(!file.type || file.type.indexOf('image/') !== 0){ setStatus('Please choose image file only.', 'error'); return; }
    selectedFile = file;
    showPreview(URL.createObjectURL(file));
    setStatus('Image ready. Click Save to upload.', 'success');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const isUpdate = !!(idInput && idInput.value);
    if(nameInput && !nameInput.value.trim()){
      setStatus('Please enter a name.', 'error');
      nameInput.focus();
      return;
    }
    if(!isUpdate && !selectedFile){
      setStatus('Please choose a category image.', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('name', nameInput ? nameInput.value.trim() : '');
    fd.append('sortOrder', (sortInput && sortInput.value) || '0');
    if(selectedFile) fd.append('image', selectedFile);

    const url = isUpdate
      ? endpoint('BONUS_CATEGORY_TITLE_UPDATE') + '/' + encodeURIComponent(idInput.value)
      : endpoint('BONUS_CATEGORY_TITLE_CREATE');

    if(saveBtn) saveBtn.disabled = true;
    setStatus(isUpdate ? 'Updating category…' : 'Creating category…', '');
    try{
      const json = await req(url, { method: 'POST', body: fd });
      setStatus(json.message || 'Category saved successfully.', 'success');
      toast(isUpdate ? 'Category updated.' : 'Category created.');
      /* Back to the list, which is where this page was opened from and where the new row shows up.
         The panel's translation panel needs the saved id, so staying here would only ever be
         right in edit mode; the list is one click away either way. */
      const back = 'promotion.html';
      setTimeout(() => { window.location.href = back; }, 600);
    }catch(err){
      setStatus(err.message || 'Save failed. Please check API URL / CORS.', 'error');
    }finally{
      if(saveBtn) saveBtn.disabled = false;
    }
  });

  /* The list URL carries the module's own landing page; keep Back/Cancel pointed at it even when
     the page was opened from a deep link with a query of its own. */
  if(backLink) backLink.setAttribute('href', 'promotion.html');
  if(cancelLink) cancelLink.setAttribute('href', 'promotion.html');

  loadRecord();
})();
})();
