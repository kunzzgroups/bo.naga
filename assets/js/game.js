
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

const GAME_SUB_CATEGORY_API = {
  list: adminApi('GAME_SUB_CATEGORY_LIST')
};

const GAME_API = {
  list: adminApi('GAME_LIST'),
  create: adminApi('GAME_CREATE'),
  update: adminApi('GAME_UPDATE'),
  delete: adminApi('GAME_DELETE')
};

(function () {
  const form = document.getElementById('gameForm');
  if (!form) return;

  const formTitle = document.getElementById('gameFormTitle');
  const id = document.getElementById('gameId');
  const categoryId = document.getElementById('gameCategoryId');
  const subCategoryId = document.getElementById('gameSubCategoryId');
  const name = document.getElementById('gameName');
  const gameUrl = document.getElementById('gameUrl');
  const providerCode = document.getElementById('gameProviderCode');
  const sortOrder = document.getElementById('gameSortOrder');
  const status = document.getElementById('gameStatus');
  const imageInput = document.getElementById('gameImage');
  const dropZone = document.getElementById('gameDropZone');
  const preview = document.getElementById('gamePreview');
  const placeholder = document.getElementById('gameUploadPlaceholder');
  const currentImage = document.getElementById('gameCurrentImage');
  const saveBtn = document.getElementById('saveGameBtn');
  const resetBtn = document.getElementById('resetGameBtn');
  const refreshBtn = document.getElementById('refreshGameBtn');
  const statusBox = document.getElementById('gameStatusBox');
  const categoryFilter = document.getElementById('gameCategoryFilter');
  const subCategoryFilter = document.getElementById('gameSubCategoryFilter');
  const list = document.getElementById('gameList');
  const empty = document.getElementById('gameEmpty');

  let selectedFile = null;
  let currentItems = [];
  let categories = [];
  let subCategories = [];
  let picker;

  function setStatus(message, type) {
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }

  function setBusy(isBusy) {
    saveBtn.disabled = isBusy;
    refreshBtn.disabled = isBusy;
    saveBtn.innerHTML = isBusy ? '<i class="bi bi-hourglass-split"></i> Saving...' : '<i class="bi bi-save"></i> Save Game';
  }

  function categoryName(catId) {
    const item = categories.find(x => String(x.id) === String(catId));
    return item ? item.name : '-';
  }

  function subCategoryName(subId) {
    const item = subCategories.find(x => String(x.id) === String(subId));
    return item ? item.name : '-';
  }

  function categoryOptions(withAll) {
    const options = categories.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    return (withAll ? '<option value="">All Categories</option>' : '') + (options || '<option value="">No category found</option>');
  }

  function subCategoryOptions(catId, withAll) {
    const filtered = catId ? subCategories.filter(x => String(x.categoryId) === String(catId)) : subCategories;
    const options = filtered.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    return (withAll ? '<option value="">All Sub Categories</option>' : '') + (options || '<option value="">No sub category found</option>');
  }

  function fillOptions() {
    categoryId.innerHTML = categoryOptions(false);
    categoryFilter.innerHTML = categoryOptions(true);
    refreshSubCategoryOptions();
    refreshFilterSubCategoryOptions();
  }

  function refreshSubCategoryOptions(keepValue) {
    const oldValue = keepValue || subCategoryId.value;
    subCategoryId.innerHTML = subCategoryOptions(categoryId.value, false);
    if (oldValue && Array.from(subCategoryId.options).some(o => o.value === String(oldValue))) {
      subCategoryId.value = String(oldValue);
    }
  }

  function refreshFilterSubCategoryOptions() {
    const oldValue = subCategoryFilter.value;
    subCategoryFilter.innerHTML = subCategoryOptions(categoryFilter.value, true);
    if (oldValue && Array.from(subCategoryFilter.options).some(o => o.value === String(oldValue))) {
      subCategoryFilter.value = String(oldValue);
    }
  }

  async function loadSetup() {
    const [catJson, subJson] = await Promise.all([
      fetchJson(GAME_CATEGORY_API.list),
      fetchJson(GAME_SUB_CATEGORY_API.list)
    ]);
    categories = catJson.data || [];
    subCategories = subJson.data || [];
    fillOptions();
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
    if (categories[0]) categoryId.value = String(categories[0].id);
    refreshSubCategoryOptions();
    name.value = '';
    gameUrl.value = '';
    providerCode.value = '';
    sortOrder.value = '0';
    status.value = '1';
    selectedFile = null;
    picker && picker.clearPreview();
    currentImage.hidden = true;
    formTitle.textContent = 'Create Game';
    setStatus('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editItem(item) {
    id.value = item.id || '';
    categoryId.value = String(item.categoryId || '');
    refreshSubCategoryOptions(item.subCategoryId);
    subCategoryId.value = String(item.subCategoryId || '');
    name.value = item.name || '';
    gameUrl.value = item.gameUrl || '';
    providerCode.value = item.providerCode || '';
    sortOrder.value = item.sortOrder ?? 0;
    status.value = String(item.status ?? 1);
    selectedFile = null;
    imageInput.value = '';
    const previewUrl = resolveImageUrl(item.imageUrl, item.image, '');
    if (previewUrl) picker.showPreview(previewUrl);
    else picker.clearPreview();
    currentImage.hidden = false;
    formTitle.textContent = 'Edit Game #' + item.id;
    setStatus('Editing game. Choose new image only if you want to replace it.', 'success');
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
        <div class="manage-thumb game-thumb">
          ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name || 'Game')}">` : '<i class="bi bi-image text-secondary fs-1"></i>'}
        </div>
        <div class="manage-card-body">
          <div class="slider-card-title">
            <b>${escapeHtml(item.name || 'Untitled Game')}</b>
            ${statusPill(item.status)}
          </div>
          <div class="slider-meta">
            <span><i class="bi bi-hash me-1"></i>ID: ${escapeHtml(item.id)}</span>
            <span><i class="bi bi-grid-3x3-gap me-1"></i>${escapeHtml(categoryName(item.categoryId))}</span>
            <span><i class="bi bi-diagram-3 me-1"></i>${escapeHtml(subCategoryName(item.subCategoryId))}</span>
            <span><i class="bi bi-cpu me-1"></i>${escapeHtml(item.providerCode || '-')}</span>
            <span><i class="bi bi-link-45deg me-1"></i>${escapeHtml(item.gameUrl || '-')}</span>
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

  async function loadGames() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading games...</b></div>';
    empty.hidden = true;
    try {
      const params = new URLSearchParams();
      if (categoryFilter.value) params.append('categoryId', categoryFilter.value);
      if (subCategoryFilter.value) params.append('subCategoryId', subCategoryFilter.value);
      const qs = params.toString() ? '?' + params.toString() : '';
      const json = await fetchJson(GAME_API.list + qs);
      renderList(json.data || []);
    } catch (err) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load games</b><small>${escapeHtml(err.message || 'Please check API URL / CORS.')}</small>`;
    }
  }

  async function saveGame(e) {
    e.preventDefault();
    const isUpdate = !!id.value;

    if (!categoryId.value) {
      setStatus('Please select category.', 'error');
      categoryId.focus();
      return;
    }
    if (!name.value.trim()) {
      setStatus('Please enter game name.', 'error');
      name.focus();
      return;
    }

    const fd = new FormData();
    if (isUpdate) fd.append('id', id.value);
    fd.append('categoryId', categoryId.value);
    fd.append('subCategoryId', subCategoryId.value || '0');
    fd.append('name', name.value.trim());
    fd.append('gameUrl', gameUrl.value.trim());
    fd.append('providerCode', providerCode.value.trim());
    fd.append('sortOrder', sortOrder.value || '0');
    fd.append('status', status.value || '1');
    if (selectedFile) fd.append('image', selectedFile);

    setBusy(true);
    setStatus(isUpdate ? 'Updating game...' : 'Creating game...', '');
    try {
      const res = await fetch(isUpdate ? GAME_API.update : GAME_API.create, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Save failed');
      setStatus(json.message || 'Game saved successfully.', 'success');
      resetForm();
      await loadGames();
    } catch (err) {
      setStatus(err.message || 'Save failed. Please check API URL / CORS.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteGame(gameId) {
    if (!confirm('Delete this game?')) return;
    const fd = new FormData();
    fd.append('id', gameId);
    try {
      const res = await fetch(GAME_API.delete, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Delete failed');
      setStatus(json.message || 'Game deleted.', 'success');
      if (id.value === String(gameId)) resetForm();
      await loadGames();
    } catch (err) {
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }
  picker = setupImagePicker(imageInput, dropZone, preview, placeholder, (file, showPreview) => {
    selectedFile = file;
    showPreview(URL.createObjectURL(file));
    setStatus('Image ready. Click Save to upload.', 'success');
  }, setStatus);

  form.addEventListener('submit', saveGame);
  resetBtn.addEventListener('click', resetForm);
  refreshBtn.addEventListener('click', async () => {
    await loadSetup();
    await loadGames();
  });

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) editItem(item);
    }
    if (deleteBtn) deleteGame(deleteBtn.dataset.deleteId);
  });

  (async function init() {
    try {
      await loadSetup();
      resetForm();
      await loadGames();
    } catch (err) {
      setStatus(err.message || 'Unable to load setup data.', 'error');
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load setup data</b><small>${escapeHtml(err.message || 'Please create category and sub category first.')}</small>`;
    }
  })();
})();
