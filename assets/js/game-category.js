
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
  list: adminApi('GAME_CATEGORY_LIST'),
  create: adminApi('GAME_CATEGORY_CREATE'),
  update: adminApi('GAME_CATEGORY_UPDATE'),
  delete: adminApi('GAME_CATEGORY_DELETE')
};

(function () {
  const form = document.getElementById('categoryForm');
  if (!form) return;

  const formTitle = document.getElementById('categoryFormTitle');
  const id = document.getElementById('categoryId');
  const name = document.getElementById('categoryName');
  const displayMode = document.getElementById('categoryDisplayMode');
  const sortOrder = document.getElementById('categorySortOrder');
  const status = document.getElementById('categoryStatus');
  const imageInput = document.getElementById('categoryImage');
  const dropZone = document.getElementById('categoryDropZone');
  const preview = document.getElementById('categoryPreview');
  const placeholder = document.getElementById('categoryUploadPlaceholder');
  const currentImage = document.getElementById('categoryCurrentImage');
  const saveBtn = document.getElementById('saveCategoryBtn');
  const resetBtn = document.getElementById('resetCategoryBtn');
  const refreshBtn = document.getElementById('refreshCategoryBtn');
  const statusBox = document.getElementById('categoryStatusBox');
  const list = document.getElementById('categoryList');
  const empty = document.getElementById('categoryEmpty');
  const searchInput = document.getElementById('categorySearchInput');
  const modeFilter = document.getElementById('categoryModeFilter');
  const statusFilter = document.getElementById('categoryStatusFilter');
  const sortFilter = document.getElementById('categorySortFilter');
  const applyFiltersBtn = document.getElementById('applyCategoryFilters');
  const resetFiltersBtn = document.getElementById('resetCategoryFilters');
  const totalCountEl = document.getElementById('categoryTotalCount');
  const activeCountEl = document.getElementById('categoryActiveCount');
  const activePercentEl = document.getElementById('categoryActivePercent');
  const showingTextEl = document.getElementById('categoryShowingText');

  let selectedFile = null;
  let currentItems = [];
  let picker;

  function setStatus(message, type) {
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }

  function setBusy(isBusy) {
    saveBtn.disabled = isBusy;
    refreshBtn.disabled = isBusy;
    saveBtn.innerHTML = isBusy ? '<i class="bi bi-hourglass-split"></i> Saving...' : '<i class="bi bi-save"></i> Save Category';
  }

  function resolveImageUrl(url, filename, fallbackUrl) {
    if (url) return url;
    if (!filename) return '';
    const value = String(filename).trim();
    if (!value) return '';
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    if (fallbackUrl) {
      const cleanFallback = String(fallbackUrl).split('?')[0];
      const slashIndex = cleanFallback.lastIndexOf('/');
      if (slashIndex >= 0) return cleanFallback.substring(0, slashIndex + 1) + value;
    }
    return value;
  }

  function resetForm() {
    id.value = '';
    name.value = '';
    sortOrder.value = '0';
    status.value = '1';
    if (displayMode) displayMode.value = 'PROVIDER';
    selectedFile = null;
    picker && picker.clearPreview();
    currentImage.hidden = true;
    formTitle.textContent = 'Create Category';
    setStatus('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editItem(item) {
    id.value = item.id || '';
    name.value = item.name || '';
    sortOrder.value = item.sortOrder ?? 0;
    status.value = String(item.status ?? 1);
    if (displayMode) displayMode.value = item.displayMode || item.display_mode || 'PROVIDER';
    selectedFile = null;
    imageInput.value = '';
    const previewUrl = resolveImageUrl(item.imageUrl, item.image, '');
    if (previewUrl) picker.showPreview(previewUrl);
    else picker.clearPreview();
    currentImage.hidden = false;
    formTitle.textContent = 'Edit Category #' + item.id;
    setStatus('Editing category. Choose new image only if you want to replace it.', 'success');
    if (window.CrudModalPattern) window.CrudModalPattern.open('Edit Category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderList(items) {
    currentItems = Array.isArray(items) ? items : [];
    const total = currentItems.length;
    const active = currentItems.filter(item => Number(item.status) === 1).length;
    if (totalCountEl) totalCountEl.textContent = total;
    if (activeCountEl) activeCountEl.textContent = active;
    if (activePercentEl) activePercentEl.textContent = `${total ? Math.round(active / total * 100) : 0}% of total`;

    const query = (searchInput?.value || '').trim().toLowerCase();
    const mode = modeFilter?.value || '';
    const statusValue = statusFilter?.value || '';
    const sortValue = sortFilter?.value || 'sortAsc';
    let visible = currentItems.filter(item => {
      const itemMode = String(item.displayMode || item.display_mode || 'PROVIDER');
      return (!query || String(item.name || '').toLowerCase().includes(query)) &&
        (!mode || itemMode === mode) &&
        (!statusValue || String(item.status) === statusValue);
    });
    visible.sort((a,b) => {
      if (sortValue === 'sortDesc') return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      if (sortValue === 'nameAsc') return String(a.name || '').localeCompare(String(b.name || ''));
      if (sortValue === 'nameDesc') return String(b.name || '').localeCompare(String(a.name || ''));
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });

    list.innerHTML = '';
    empty.hidden = visible.length > 0;
    if (showingTextEl) showingTextEl.textContent = `Showing 1 to ${visible.length} of ${visible.length} entries`;

    visible.forEach(item => {
      const row = document.createElement('div');
      row.className = 'category-table-row';
      const imageUrl = resolveImageUrl(item.imageUrl, item.image, '');
      row.innerHTML = `
        <div class="category-drag"><i class="bi bi-grip-vertical"></i></div>
        <div class="category-main-cell">
          <div class="category-thumb-full">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name || 'Category')}">` : '<i class="bi bi-image"></i>'}</div>
          <div class="category-copy"><b>${escapeHtml(item.name || 'Untitled Category')}</b><small>ID: ${escapeHtml(item.id)} <span>•</span> Sort: ${escapeHtml(item.sortOrder ?? 0)} <span>•</span> Mode: ${escapeHtml(item.displayMode || item.display_mode || 'PROVIDER')}</small></div>
        </div>
        <div class="category-status-cell">${statusPill(item.status)}</div>
        <div class="category-action-cell">
          <button class="icon-action-btn edit edit-btn" type="button" data-edit-id="${escapeHtml(item.id)}" aria-label="Edit"><i class="bi bi-pencil-square"></i></button>
          <button class="icon-action-btn delete" type="button" data-delete-id="${escapeHtml(item.id)}" aria-label="Delete"><i class="bi bi-trash"></i></button>
        </div>`;
      list.appendChild(row);
    });
  }

  function applyCategoryFilters(){ renderList(currentItems); }

  async function loadCategories() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading categories...</b></div>';
    empty.hidden = true;
    try {
      const json = await fetchJson(GAME_CATEGORY_API.list);
      renderList(json.data || []);
    } catch (err) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load categories</b><small>${escapeHtml(err.message || 'Please check API URL / CORS.')}</small>`;
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    const isUpdate = !!id.value;

    if (!name.value.trim()) {
      setStatus('Please enter category name.', 'error');
      name.focus();
      return;
    }

    const fd = new FormData();
    if (isUpdate) fd.append('id', id.value);
    fd.append('name', name.value.trim());
    fd.append('sortOrder', sortOrder.value || '0');
    fd.append('status', status.value || '1');
    if (displayMode) fd.append('displayMode', displayMode.value || 'PROVIDER');
    if (selectedFile) fd.append('image', selectedFile);

    setBusy(true);
    setStatus(isUpdate ? 'Updating category...' : 'Creating category...', '');
    try {
      const res = await fetch(isUpdate ? GAME_CATEGORY_API.update : GAME_CATEGORY_API.create, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Save failed');
      setStatus(json.message || 'Category saved successfully.', 'success');
      resetForm();
      await loadCategories();
    } catch (err) {
      setStatus(err.message || 'Save failed. Please check API URL / CORS.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Delete this category?')) return;
    const fd = new FormData();
    fd.append('id', categoryId);
    try {
      const res = await fetch(GAME_CATEGORY_API.delete, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Delete failed');
      setStatus(json.message || 'Category deleted.', 'success');
      if (id.value === String(categoryId)) resetForm();
      await loadCategories();
    } catch (err) {
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }
  picker = setupImagePicker(imageInput, dropZone, preview, placeholder, (file, showPreview) => {
    selectedFile = file;
    showPreview(URL.createObjectURL(file));
    setStatus('Image ready. Click Save to upload.', 'success');
  }, setStatus);

  form.addEventListener('submit', saveCategory);
  resetBtn.addEventListener('click', resetForm);
  refreshBtn.addEventListener('click', loadCategories);

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) editItem(item);
    }
    if (deleteBtn) deleteCategory(deleteBtn.dataset.deleteId);
  });


  applyFiltersBtn && applyFiltersBtn.addEventListener('click', applyCategoryFilters);
  searchInput && searchInput.addEventListener('input', applyCategoryFilters);
  [modeFilter, statusFilter, sortFilter].forEach(el => el && el.addEventListener('change', applyCategoryFilters));
  resetFiltersBtn && resetFiltersBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (modeFilter) modeFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortFilter) sortFilter.value = 'sortAsc';
    applyCategoryFilters();
  });
  loadCategories();
})();
