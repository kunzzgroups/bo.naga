const SLIDER_API = {
  list: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_LIST,
  create: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_CREATE,
  update: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_UPDATE,
  delete: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_DELETE
};

(function () {
  const form = document.getElementById('sliderForm');
  const formTitle = document.getElementById('sliderFormTitle');
  const sliderId = document.getElementById('sliderId');
  const title = document.getElementById('sliderTitle');
  const linkUrl = document.getElementById('sliderLinkUrl');
  const sortOrder = document.getElementById('sliderSortOrder');
  const status = document.getElementById('sliderStatus');
  const imageInput = document.getElementById('sliderImage');
  const dropZone = document.getElementById('sliderDropZone');
  const preview = document.getElementById('sliderPreview');
  const uploadPlaceholder = document.getElementById('sliderUploadPlaceholder');
  const currentImage = document.getElementById('sliderCurrentImage');
  const statusBox = document.getElementById('sliderStatusBox');
  const resetBtn = document.getElementById('resetSliderBtn');
  const saveBtn = document.getElementById('saveSliderBtn');
  const refreshBtn = document.getElementById('refreshSliderBtn');
  const list = document.getElementById('sliderList');
  const empty = document.getElementById('sliderEmpty');

  let selectedFile = null;
  let currentItems = [];

  if (!form) return;

  function setStatus(message, type) {
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }

  function setBusy(isBusy) {
    saveBtn.disabled = isBusy;
    refreshBtn.disabled = isBusy;
    saveBtn.innerHTML = isBusy
      ? '<i class="bi bi-hourglass-split"></i> Saving...'
      : '<i class="bi bi-save"></i> Save Slider';
  }

  function clearPreview() {
    selectedFile = null;
    imageInput.value = '';
    preview.src = '';
    preview.hidden = true;
    uploadPlaceholder.hidden = false;
  }

  function showPreview(src) {
    preview.src = src;
    preview.hidden = false;
    uploadPlaceholder.hidden = true;
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setStatus('Please choose image file only.', 'error');
      return;
    }
    selectedFile = file;
    showPreview(URL.createObjectURL(file));
    setStatus('Image ready. Click Save Slider to upload.', 'success');
  }

  function resetForm() {
    sliderId.value = '';
    title.value = '';
    linkUrl.value = '';
    sortOrder.value = '0';
    status.value = '1';
    clearPreview();
    currentImage.hidden = true;
    formTitle.textContent = 'Create Slider';
    setStatus('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editItem(item) {
    sliderId.value = item.id || '';
    title.value = item.title || '';
    linkUrl.value = item.linkUrl || '';
    sortOrder.value = item.sortOrder ?? 0;
    status.value = String(item.status ?? 1);
    selectedFile = null;
    imageInput.value = '';
    if (item.imageUrl) showPreview(item.imageUrl);
    else clearPreview();
    currentImage.hidden = false;
    formTitle.textContent = 'Edit Slider #' + item.id;
    setStatus('Editing slider. Choose new image only if you want to replace it.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  function renderList(items) {
    currentItems = Array.isArray(items) ? items : [];
    list.innerHTML = '';
    empty.hidden = currentItems.length > 0;

    currentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'slider-card';
      const isActive = Number(item.status) === 1;
      card.innerHTML = `
        <div class="slider-card-img">
          ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title || 'Slider')}">` : '<i class="bi bi-image text-secondary fs-1"></i>'}
        </div>
        <div class="slider-card-body">
          <div class="slider-card-title">
            <b>${escapeHtml(item.title || 'Untitled Slider')}</b>
            <span class="slider-pill ${isActive ? 'active' : 'inactive'}"><i class="bi ${isActive ? 'bi-check-circle' : 'bi-pause-circle'}"></i>${statusText(item.status)}</span>
          </div>
          <div class="slider-meta">
            <span><i class="bi bi-sort-numeric-down me-1"></i>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span>
            <span><i class="bi bi-link-45deg me-1"></i>${escapeHtml(item.linkUrl || '-')}</span>
            <span><i class="bi bi-file-image me-1"></i>${escapeHtml(item.image || '-')}</span>
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

  async function loadSliders() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading sliders...</b></div>';
    empty.hidden = true;
    try {
      const res = await fetch(SLIDER_API.list);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Failed to load sliders');
      renderList(json.data || []);
    } catch (err) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load sliders</b><small>${escapeHtml(err.message || 'Please check API URL / CORS.')}</small>`;
    }
  }

  async function saveSlider(e) {
    e.preventDefault();
    const isUpdate = !!sliderId.value;

    if (!title.value.trim()) {
      setStatus('Please enter title.', 'error');
      title.focus();
      return;
    }
    if (!isUpdate && !selectedFile) {
      setStatus('Please choose slider image.', 'error');
      return;
    }

    const fd = new FormData();
    if (isUpdate) fd.append('id', sliderId.value);
    fd.append('title', title.value.trim());
    fd.append('linkUrl', linkUrl.value.trim());
    fd.append('sortOrder', sortOrder.value || '0');
    fd.append('status', status.value || '1');
    if (selectedFile) fd.append('image', selectedFile);

    setBusy(true);
    setStatus(isUpdate ? 'Updating slider...' : 'Creating slider...', '');
    try {
      const res = await fetch(isUpdate ? SLIDER_API.update : SLIDER_API.create, {
        method: 'POST',
        body: fd
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Save failed');
      setStatus(json.message || 'Slider saved successfully.', 'success');
      resetForm();
      await loadSliders();
    } catch (err) {
      setStatus(err.message || 'Save failed. Please check API URL / CORS.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteSlider(id) {
    if (!confirm('Delete this slider?')) return;
    const fd = new FormData();
    fd.append('id', id);
    try {
      const res = await fetch(SLIDER_API.delete, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Delete failed');
      setStatus(json.message || 'Slider deleted.', 'success');
      if (sliderId.value === String(id)) resetForm();
      await loadSliders();
    } catch (err) {
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  imageInput.addEventListener('change', () => handleFile(imageInput.files[0]));

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

  form.addEventListener('submit', saveSlider);
  resetBtn.addEventListener('click', resetForm);
  refreshBtn.addEventListener('click', loadSliders);

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) editItem(item);
    }
    if (deleteBtn) deleteSlider(deleteBtn.dataset.deleteId);
  });

  loadSliders();
})();
