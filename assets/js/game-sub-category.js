
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
  const totalCountEl = document.getElementById('subCategoryTotalCount');
  const activeCountEl = document.getElementById('subCategoryActiveCount');
  const activeTextEl = document.getElementById('subCategoryActiveText');
  const categoryCountEl = document.getElementById('subCategoryCategoryCount');
  const providerCountEl = document.getElementById('subCategoryProviderCount');
  const showingTextEl = document.getElementById('subCategoryShowingText');
  const paginationEl = document.getElementById('subCategoryPagination');
  const pageSizeEl = document.getElementById('subCategoryPageSize');

  let currentItems = [];
  let currentPage = 1;
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

  function firstValue(item, keys) {
    for (const key of keys) {
      const value = item && item[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function syncRoundedSelect(select) {
    if (!select) return;
    select.dispatchEvent(new Event('change', { bubbles: false }));
  }

  function editItem(item) {
    id.value = firstValue(item, ['id', 'subCategoryId', 'sub_category_id']);

    const savedCategoryId = String(firstValue(item, [
      'categoryId', 'category_id', 'gameCategoryId', 'game_category_id'
    ]));
    const savedProviderCode = String(firstValue(item, [
      'providerCode', 'provider_code', 'code'
    ])).trim().toUpperCase();

    categoryId.value = savedCategoryId;
    providerCode.value = savedProviderCode;
    name.value = firstValue(item, ['name', 'subCategoryName', 'sub_category_name']) || '';
    sortOrder.value = firstValue(item, ['sortOrder', 'sort_order']) || 0;
    status.value = String(firstValue(item, ['status']) || 1);

    // The rounded dropdown is a visual wrapper around the native select.
    // Programmatic value changes must emit change so its displayed label matches DB values.
    syncRoundedSelect(categoryId);
    syncRoundedSelect(providerCode);
    syncRoundedSelect(status);

    formTitle.textContent = 'Edit Sub Category #' + id.value;
    setStatus('Editing sub category.', 'success');
    if (window.CrudModalPattern) window.CrudModalPattern.open('Edit Sub Category');

    // Re-sync once after the modal is visible in case its dropdown wrapper rendered late.
    requestAnimationFrame(() => {
      syncRoundedSelect(categoryId);
      syncRoundedSelect(providerCode);
      syncRoundedSelect(status);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildPagination(totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    const buttons = [];
    const add = (page, label, disabled = false, active = false, extraClass = '') => {
      buttons.push(`<button class="smart-page ${active ? 'active' : ''} ${extraClass}" type="button" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`);
    };
    add(currentPage - 1, '&lsaquo;', currentPage <= 1, false, 'prev');
    const pages = new Set([1, totalPages, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]);
    let last = 0;
    [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b).forEach(page => {
      if (last && page - last > 1) buttons.push('<span class="smart-page-ellipsis">…</span>');
      add(page, page, false, page === currentPage);
      last = page;
    });
    add(currentPage + 1, '&rsaquo;', currentPage >= totalPages, false, 'next');
    paginationEl.innerHTML = buttons.join('');
  }

  function renderList(items, resetPage = false) {
    currentItems = Array.isArray(items) ? items : [];
    if (resetPage) currentPage = 1;
    list.innerHTML = '';
    empty.hidden = currentItems.length > 0;

    const pageSize = Math.max(1, Number(pageSizeEl?.value || 10));
    const totalPages = Math.max(1, Math.ceil(currentItems.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = currentItems.slice(startIndex, startIndex + pageSize);

    const activeCount = currentItems.filter(item => Number(item.status) === 1).length;
    const categoryCount = new Set(currentItems.map(item => String(item.categoryId || '')).filter(Boolean)).size;
    const providerCount = new Set(currentItems.map(item => String(item.providerCode || '').trim().toUpperCase()).filter(Boolean)).size;
    if (totalCountEl) totalCountEl.textContent = currentItems.length;
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (activeTextEl) activeTextEl.textContent = currentItems.length ? `${Math.round(activeCount / currentItems.length * 100)}% of total` : '0% of total';
    if (categoryCountEl) categoryCountEl.textContent = categoryCount;
    if (providerCountEl) providerCountEl.textContent = providerCount;
    if (showingTextEl) showingTextEl.textContent = currentItems.length ? `Showing ${startIndex + 1} to ${Math.min(startIndex + pageItems.length, currentItems.length)} of ${currentItems.length} entries` : 'Showing 0 entries';

    pageItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'subcategory-table-row';
      row.innerHTML = `
        <span class="subcategory-drag"><i class="bi bi-grip-vertical"></i></span>
        <div class="subcategory-main-cell">
          <span class="subcategory-row-icon"><i class="bi bi-diagram-3"></i></span>
          <div class="subcategory-copy">
            <b>${escapeHtml(item.name || 'Untitled Sub Category')}</b>
            <small>
              <span>ID: ${escapeHtml(item.id)}</span><span class="dot">•</span>
              <span>${escapeHtml(categoryName(item.categoryId))}</span><span class="dot">•</span>
              <span>Provider: ${escapeHtml(providerName(item.providerCode))}</span><span class="dot">•</span>
              <span>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span>
            </small>
          </div>
        </div>
        <div class="subcategory-status-cell">${statusPill(item.status)}</div>
        <div class="subcategory-action-cell">
          <button class="icon-action-btn edit edit-btn" type="button" data-edit-id="${escapeHtml(item.id)}" aria-label="Edit" title="Edit"><i class="bi bi-pencil-square"></i></button>
          <button class="icon-action-btn delete" type="button" data-delete-id="${escapeHtml(item.id)}" aria-label="Delete" title="Delete"><i class="bi bi-trash"></i></button>
        </div>
      `;
      list.appendChild(row);
    });
    buildPagination(totalPages);
  }

  async function loadSubCategories() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading sub categories...</b></div>';
    empty.hidden = true;
    try {
      const params = filter.value ? '?categoryId=' + encodeURIComponent(filter.value) : '';
      const json = await fetchJson(GAME_SUB_CATEGORY_API.list + params);
      renderList(json.data || [], true);
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


  if (pageSizeEl) pageSizeEl.addEventListener('change', () => renderList(currentItems, true));
  if (paginationEl) paginationEl.addEventListener('click', e => {
    const button = e.target.closest('[data-page]');
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (!Number.isFinite(page) || page < 1) return;
    currentPage = page;
    renderList(currentItems);
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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
