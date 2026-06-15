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

  function renderList(items) {
    currentItems = Array.isArray(items) ? items : [];
    list.innerHTML = '';
    empty.hidden = currentItems.length > 0;

    currentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'manage-card';
      card.innerHTML = `
        <div class="manage-thumb">
          ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name || 'Bonus category')}">` : '<i class="bi bi-image text-secondary fs-1"></i>'}
        </div>
        <div class="manage-card-body">
          <div class="slider-card-title">
            <b>${escapeHtml(item.name || 'Untitled Category')}</b>
            <span class="slider-pill active"><i class="bi bi-check-circle"></i>Active</span>
          </div>
          <div class="slider-meta">
            <span><i class="bi bi-hash me-1"></i>ID: ${escapeHtml(item.id)}</span>
            <span><i class="bi bi-sort-numeric-down me-1"></i>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span>
            <span><i class="bi bi-file-image me-1"></i>${escapeHtml(item.image || '-')}</span>
          </div>
        </div>
        <div class="slider-card-actions">
          <a class="clean-btn" href="bonus-category-item.html?titleId=${escapeHtml(item.id)}"><i class="bi bi-card-image"></i> Items</a>
          <button class="clean-btn primary" type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="clean-btn danger" type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash"></i> Delete</button>
        </div>
      `;
      list.appendChild(card);
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
