
function adminApi(pathKey) {
  return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusText(value) {
  return Number(value) === 1 ? 'Active' : 'Inactive';
}

function statusPill(value) {
  const active = Number(value) === 1;
  return `<span class="slider-pill ${active ? 'active' : 'inactive'}"><i class="bi ${active ? 'bi-check-circle' : 'bi-pause-circle'}"></i>${active ? 'Active' : 'Inactive'}</span>`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
  return json;
}

function setupImagePicker(input, dropZone, preview, placeholder, onFile, setStatus) {
  if (!input || !dropZone || !preview || !placeholder) return;

  function showPreview(src) {
    preview.src = src;
    preview.hidden = false;
    placeholder.hidden = true;
  }

  function clearPreview() {
    input.value = '';
    preview.src = '';
    preview.hidden = true;
    placeholder.hidden = false;
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setStatus && setStatus('Please choose image file only.', 'error');
      return;
    }
    onFile(file, showPreview, clearPreview);
  }

  input.addEventListener('change', () => handleFile(input.files[0]));

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  return { showPreview, clearPreview };
}

const GAME_CATEGORY_API = {
  list: adminApi('GAME_CATEGORY_LIST')
};

const GAME_PROVIDER_API = {
  list: adminApi('GAME_PROVIDER_LIST')
};

const GAME_SUB_CATEGORY_API = {
  list: adminApi('GAME_SUB_CATEGORY_LIST'),
  create: adminApi('GAME_SUB_CATEGORY_CREATE'),
  update: adminApi('GAME_SUB_CATEGORY_UPDATE'),
  delete: adminApi('GAME_SUB_CATEGORY_DELETE')
};

(function () {
  const form = document.getElementById('subCategoryForm');
  if (!form) return;

  const formTitle = document.getElementById('subCategoryFormTitle');
  const id = document.getElementById('subCategoryId');
  const categoryId = document.getElementById('subCategoryCategoryId');
  const providerCode = document.getElementById('subCategoryProviderCode');
  const name = document.getElementById('subCategoryName');
  const sortOrder = document.getElementById('subCategorySortOrder');
  const status = document.getElementById('subCategoryStatus');
  const saveBtn = document.getElementById('saveSubCategoryBtn');
  const resetBtn = document.getElementById('resetSubCategoryBtn');
  const refreshBtn = document.getElementById('refreshSubCategoryBtn');
  const statusBox = document.getElementById('subCategoryStatusBox');
  const filter = document.getElementById('subCategoryFilter');
  const list = document.getElementById('subCategoryList');
  const empty = document.getElementById('subCategoryEmpty');

  let currentItems = [];
  let categories = [];
  let providers = [];

  function setStatus(message, type) {
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }

  function setBusy(isBusy) {
    saveBtn.disabled = isBusy;
    refreshBtn.disabled = isBusy;
    saveBtn.innerHTML = isBusy ? '<i class="bi bi-hourglass-split"></i> Saving...' : '<i class="bi bi-save"></i> Save Sub Category';
  }

  function categoryName(catId) {
    const item = categories.find(x => String(x.id) === String(catId));
    return item ? item.name : '-';
  }

  function providerCodeOf(item) {
    return String(item?.code || item?.providerCode || item?.provider_code || '').trim().toUpperCase();
  }

  function providerName(code) {
    const clean = String(code || '').trim().toUpperCase();
    const item = providers.find(x => providerCodeOf(x) === clean);
    return item ? (item.name || clean) : (clean || '-');
  }

  function fillProviderOptions() {
    const options = providers.map(item => `<option value="${escapeHtml(providerCodeOf(item))}">${escapeHtml(item.name || providerCodeOf(item))}</option>`).join('');
    providerCode.innerHTML = options || '<option value="">No provider found</option>';
  }

  function fillCategoryOptions() {
    const options = categories.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    categoryId.innerHTML = options || '<option value="">No category found</option>';
    filter.innerHTML = '<option value="">All Categories</option>' + options;
    fillProviderOptions();
  }

  async function loadCategories() {
    const [catJson, providerJson] = await Promise.all([
      fetchJson(GAME_CATEGORY_API.list),
      fetchJson(GAME_PROVIDER_API.list).catch(() => ({ data: [] }))
    ]);
    categories = catJson.data || [];
    providers = providerJson.data || [];
    fillCategoryOptions();
  }

  function resetForm() {
    id.value = '';
    if (categories[0]) categoryId.value = String(categories[0].id);
    if (providers[0]) providerCode.value = providerCodeOf(providers[0]);
    name.value = '';
    sortOrder.value = '0';
    status.value = '1';
    formTitle.textContent = 'Create Sub Category';
    setStatus('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editItem(item) {
    id.value = item.id || '';
    categoryId.value = String(item.categoryId || '');
    providerCode.value = String(item.providerCode || '').toUpperCase();
    name.value = item.name || '';
    sortOrder.value = item.sortOrder ?? 0;
    status.value = String(item.status ?? 1);
    formTitle.textContent = 'Edit Sub Category #' + item.id;
    setStatus('Editing sub category.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderList(items) {
    currentItems = Array.isArray(items) ? items : [];
    list.innerHTML = '';
    empty.hidden = currentItems.length > 0;

    currentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'manage-card compact';
      card.innerHTML = `
        <div class="manage-icon"><i class="bi bi-diagram-3"></i></div>
        <div class="manage-card-body">
          <div class="slider-card-title">
            <b>${escapeHtml(item.name || 'Untitled Sub Category')}</b>
            ${statusPill(item.status)}
          </div>
          <div class="slider-meta">
            <span><i class="bi bi-hash me-1"></i>ID: ${escapeHtml(item.id)}</span>
            <span><i class="bi bi-grid-3x3-gap me-1"></i>${escapeHtml(categoryName(item.categoryId))}</span>
            <span><i class="bi bi-cpu me-1"></i>Provider: ${escapeHtml(providerName(item.providerCode))}</span>
            <span><i class="bi bi-sort-numeric-down me-1"></i>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span>
          </div>
        </div>
        <div class="slider-card-actions">
          <button class="clean-btn primary" type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="clean-btn danger" type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash"></i> Delete</button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  async function loadSubCategories() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading sub categories...</b></div>';
    empty.hidden = true;
    try {
      const params = filter.value ? '?categoryId=' + encodeURIComponent(filter.value) : '';
      const json = await fetchJson(GAME_SUB_CATEGORY_API.list + params);
      renderList(json.data || []);
    } catch (err) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load sub categories</b><small>${escapeHtml(err.message || 'Please check API URL / CORS.')}</small>`;
    }
  }

  async function saveSubCategory(e) {
    e.preventDefault();
    const isUpdate = !!id.value;

    if (!categoryId.value) {
      setStatus('Please select parent category.', 'error');
      categoryId.focus();
      return;
    }
    if (!providerCode.value) {
      setStatus('Please select provider.', 'error');
      providerCode.focus();
      return;
    }
    if (!name.value.trim()) {
      setStatus('Please enter sub category name.', 'error');
      name.focus();
      return;
    }

    const fd = new FormData();
    if (isUpdate) fd.append('id', id.value);
    fd.append('categoryId', categoryId.value);
    fd.append('providerCode', providerCode.value);
    fd.append('name', name.value.trim());
    fd.append('sortOrder', sortOrder.value || '0');
    fd.append('status', status.value || '1');

    setBusy(true);
    setStatus(isUpdate ? 'Updating sub category...' : 'Creating sub category...', '');
    try {
      const res = await fetch(isUpdate ? GAME_SUB_CATEGORY_API.update : GAME_SUB_CATEGORY_API.create, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Save failed');
      setStatus(json.message || 'Sub category saved successfully.', 'success');
      resetForm();
      await loadSubCategories();
    } catch (err) {
      setStatus(err.message || 'Save failed. Please check API URL / CORS.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteSubCategory(subCategoryId) {
    if (!confirm('Delete this sub category?')) return;
    const fd = new FormData();
    fd.append('id', subCategoryId);
    try {
      const res = await fetch(GAME_SUB_CATEGORY_API.delete, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Delete failed');
      setStatus(json.message || 'Sub category deleted.', 'success');
      if (id.value === String(subCategoryId)) resetForm();
      await loadSubCategories();
    } catch (err) {
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  form.addEventListener('submit', saveSubCategory);
  resetBtn.addEventListener('click', resetForm);
  refreshBtn.addEventListener('click', loadSubCategories);
  filter.addEventListener('change', loadSubCategories);

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) editItem(item);
    }
    if (deleteBtn) deleteSubCategory(deleteBtn.dataset.deleteId);
  });

  (async function init() {
    try {
      await loadCategories();
      resetForm();
      await loadSubCategories();
    } catch (err) {
      setStatus(err.message || 'Unable to load categories.', 'error');
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load setup data</b><small>${escapeHtml(err.message || 'Please create category first.')}</small>`;
    }
  })();
})();
