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

async function fetchJson(url, options) {
  const res = await fetch(url, options);
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

const BONUS_CATEGORY_TITLE_API = {
  list: adminApi('BONUS_CATEGORY_TITLE_LIST'),
  create: adminApi('BONUS_CATEGORY_TITLE_CREATE'),
  update: adminApi('BONUS_CATEGORY_TITLE_UPDATE'),
  delete: adminApi('BONUS_CATEGORY_TITLE_DELETE')
};

(function () {
  const form = document.getElementById('bonusForm');
  if (!form) return;

  const formTitle = document.getElementById('bonusFormTitle');
  const id = document.getElementById('bonusId');
  const name = document.getElementById('bonusName');
  const sortOrder = document.getElementById('bonusSortOrder');
  const imageInput = document.getElementById('bonusImage');
  const dropZone = document.getElementById('bonusDropZone');
  const preview = document.getElementById('bonusPreview');
  const placeholder = document.getElementById('bonusUploadPlaceholder');
  const currentImage = document.getElementById('bonusCurrentImage');
  const saveBtn = document.getElementById('saveBonusBtn');
  const resetBtn = document.getElementById('resetBonusBtn');
  const refreshBtn = document.getElementById('refreshBonusBtn');
  const statusBox = document.getElementById('bonusStatusBox');
  const list = document.getElementById('bonusList');
  const empty = document.getElementById('bonusEmpty');
  const searchInput = document.getElementById('bonusSearchInput');
  const sortFilter = document.getElementById('bonusSortFilter');
  const resetFilters = document.getElementById('resetBonusFilters');
  const applyFilters = document.getElementById('applyBonusFilters');
  const totalCount = document.getElementById('bonusTotalCount');
  const imageCount = document.getElementById('bonusImageCount');
  const imagePercent = document.getElementById('bonusImagePercent');
  const showingText = document.getElementById('bonusShowingText');

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
    saveBtn.innerHTML = isBusy
      ? '<i class="bi bi-hourglass-split"></i> Saving...'
      : '<i class="bi bi-save"></i> Save Category';
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
    selectedFile = null;
    picker && picker.clearPreview();
    currentImage.hidden = true;
    formTitle.textContent = 'Create Bonus Category Title';
    setStatus('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editItem(item) {
    id.value = item.id || '';
    name.value = item.name || '';
    sortOrder.value = item.sortOrder ?? 0;
    selectedFile = null;
    imageInput.value = '';

    const previewUrl = resolveImageUrl(item.imageUrl, item.image, '');
    if (previewUrl) picker.showPreview(previewUrl);
    else picker.clearPreview();

    currentImage.hidden = false;
    formTitle.textContent = 'Edit Bonus Category #' + item.id;
    setStatus('Editing category. Choose new image only if you want to replace it.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function filteredItems() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const mode = sortFilter?.value || 'sortAsc';
    const result = currentItems.filter(item => !q || String(item.name || '').toLowerCase().includes(q));
    result.sort((a, b) => {
      if (mode === 'sortDesc') return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      if (mode === 'nameAsc') return String(a.name || '').localeCompare(String(b.name || ''));
      if (mode === 'nameDesc') return String(b.name || '').localeCompare(String(a.name || ''));
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });
    return result;
  }

  function renderList(items) {
    if (Array.isArray(items)) currentItems = items;
    const rows = filteredItems();
    list.innerHTML = '';
    empty.hidden = rows.length > 0;
    const withImages = currentItems.filter(x => x.imageUrl || x.image).length;
    if (totalCount) totalCount.textContent = currentItems.length;
    if (imageCount) imageCount.textContent = withImages;
    if (imagePercent) imagePercent.textContent = (currentItems.length ? Math.round(withImages * 100 / currentItems.length) : 0) + '% of total';
    if (showingText) showingText.textContent = `Showing ${rows.length} of ${currentItems.length} entries`;

    rows.forEach(item => {
      const row = document.createElement('div');
      row.className = 'category-table-row bonus-title-table-row';
      const imageUrl = resolveImageUrl(item.imageUrl, item.image, '');
      row.innerHTML = `
        <span class="category-drag"><i class="bi bi-grip-vertical"></i></span>
        <div class="category-main-cell">
          <div class="category-thumb-full">${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name || 'Bonus category')}">` : '<i class="bi bi-image text-secondary fs-4"></i>'}</div>
          <div class="category-copy"><b>${escapeHtml(item.name || 'Untitled Category')}</b><small>ID: ${escapeHtml(item.id)} <span>•</span> Sort: ${escapeHtml(item.sortOrder ?? 0)} <span>•</span> ${escapeHtml(item.image || 'No image')}</small></div>
        </div>
        <div class="category-status-cell"><span class="slider-pill active"><i class="bi bi-check-circle"></i> Active</span></div>
        <div class="category-action-cell">
          <a class="icon-action-btn" title="Manage Items" aria-label="Manage Items" href="bonus-category-item.html?titleId=${escapeHtml(item.id)}"><i class="bi bi-card-image"></i></a>
          <button class="icon-action-btn edit edit-btn" title="Edit" aria-label="Edit" type="button" data-edit="${escapeHtml(item.id)}" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i></button>
          <button class="icon-action-btn delete btn-delete" title="Delete" aria-label="Delete" type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash"></i></button>
        </div>`;
      list.appendChild(row);
    });
  }

  async function loadCategories() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading categories...</b></div>';
    empty.hidden = true;
    try {
      const json = await fetchJson(BONUS_CATEGORY_TITLE_API.list + '?page=1&size=100');
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
      setStatus('Please enter name.', 'error');
      name.focus();
      return;
    }

    if (!isUpdate && !selectedFile) {
      setStatus('Please choose category image.', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('name', name.value.trim());
    fd.append('sortOrder', sortOrder.value || '0');
    if (selectedFile) fd.append('image', selectedFile);

    const url = isUpdate
      ? BONUS_CATEGORY_TITLE_API.update + '/' + encodeURIComponent(id.value)
      : BONUS_CATEGORY_TITLE_API.create;

    setBusy(true);
    setStatus(isUpdate ? 'Updating category...' : 'Creating category...', '');
    try {
      const json = await fetchJson(url, { method: 'POST', body: fd });
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
    if (!confirm('Delete this bonus category title?')) return;

    setStatus('Deleting category...', '');
    try {
      const json = await fetchJson(BONUS_CATEGORY_TITLE_API.delete, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(categoryId) })
      });
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
  applyFilters?.addEventListener('click', () => renderList());
  resetFilters?.addEventListener('click', () => { if (searchInput) searchInput.value = ''; if (sortFilter) sortFilter.value = 'sortAsc'; renderList(); });
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); renderList(); } });

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) editItem(item);
    }
    if (deleteBtn) deleteCategory(deleteBtn.dataset.deleteId);
  });

  loadCategories();
})();
