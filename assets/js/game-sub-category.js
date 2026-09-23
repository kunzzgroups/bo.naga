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

const GAME_CATEGORY_API = { list: adminApi('GAME_CATEGORY_LIST') };
const GAME_PROVIDER_API = { list: adminApi('GAME_PROVIDER_LIST') };
const GAME_SUB_CATEGORY_API = {
  list: adminApi('GAME_SUB_CATEGORY_LIST'),
  delete: adminApi('GAME_SUB_CATEGORY_DELETE')
};

(function () {
  const tenantPresentation = !!(window.BO_BRAND && !window.BO_BRAND.isMaster());
  const list = document.getElementById('subCategoryList');
  const empty = document.getElementById('subCategoryEmpty');
  if (!list || !empty) return;

  const refreshBtn = document.getElementById('refreshSubCategoryBtn');
  const statusBox = document.getElementById('subCategoryStatusBox');
  const filter = document.getElementById('subCategoryFilter');
  const addBtn = document.getElementById('addSubCategoryBtn');
  const showingTextEl = document.getElementById('subCategoryShowingText');
  const paginationEl = document.getElementById('subCategoryPagination');
  const pageSizeEl = document.getElementById('subCategoryPageSize');

  if (tenantPresentation && addBtn) addBtn.hidden = true;

  let currentItems = [];
  let currentPage = 1;
  let categories = [];
  let providers = [];

  function editHref(id) {
    return 'game-sub-category-edit.html?id=' + encodeURIComponent(String(id));
  }

  function setStatus(message, type) {
    if (!statusBox) return;
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status' + (type ? ' ' + type : '');
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

  function fillFilterOptions() {
    if (!filter) return;
    const options = categories.map(item =>
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`
    ).join('');
    filter.innerHTML = '<option value="">All Categories</option>' + options;
  }

  async function loadSetup() {
    const [catJson, providerJson] = await Promise.all([
      fetchJson(GAME_CATEGORY_API.list),
      fetchJson(GAME_PROVIDER_API.list).catch(() => ({ data: [] }))
    ]);
    categories = catJson.data || [];
    providers = providerJson.data || [];
    fillFilterOptions();
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

    if (showingTextEl) {
      showingTextEl.textContent = currentItems.length
        ? `Showing ${startIndex + 1} to ${Math.min(startIndex + pageItems.length, currentItems.length)} of ${currentItems.length} entries`
        : 'Showing 0 entries';
    }

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
          <a class="icon-action-btn edit edit-btn" href="${editHref(item.id)}" aria-label="Edit" title="Edit"><i class="bi bi-pencil-square"></i></a>
          ${tenantPresentation ? '' : `<button class="icon-action-btn delete" type="button" data-delete-id="${escapeHtml(item.id)}" aria-label="Delete" title="Delete"><i class="bi bi-trash"></i></button>`}
        </div>`;
      list.appendChild(row);
    });
    buildPagination(totalPages);
  }

  async function loadSubCategories() {
    list.innerHTML = '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading sub categories...</b></div>';
    empty.hidden = true;
    try {
      const params = filter?.value ? '?categoryId=' + encodeURIComponent(filter.value) : '';
      const json = await fetchJson(GAME_SUB_CATEGORY_API.list + params);
      renderList(json.data || [], true);
    } catch (err) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load sub categories</b><small>${escapeHtml(err.message || 'Please check API URL / CORS.')}</small>`;
    }
  }

  async function deleteSubCategory(subCategoryId) {
    if (!(await BO_DIALOG.confirm('Delete this sub category?', { title: 'Delete Subcategory', confirmText: 'Delete' }))) return;
    const fd = new FormData();
    fd.append('id', subCategoryId);
    try {
      const res = await fetch(GAME_SUB_CATEGORY_API.delete, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Delete failed');
      setStatus(json.message || 'Sub category deleted.', 'success');
      await loadSubCategories();
    } catch (err) {
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  refreshBtn?.addEventListener('click', loadSubCategories);
  filter?.addEventListener('change', loadSubCategories);
  pageSizeEl?.addEventListener('change', () => renderList(currentItems, true));
  paginationEl?.addEventListener('click', e => {
    const button = e.target.closest('[data-page]');
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (!Number.isFinite(page) || page < 1) return;
    currentPage = page;
    renderList(currentItems);
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  list.addEventListener('click', e => {
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (deleteBtn) deleteSubCategory(deleteBtn.dataset.deleteId);
  });

  if (tenantPresentation) {
    const emptySmall = empty.querySelector('small');
    if (emptySmall) emptySmall.textContent = 'No sub category is available from the providers assigned to this branding.';
  }

  (async function init() {
    try {
      await loadSetup();
      await loadSubCategories();
    } catch (err) {
      setStatus(err.message || 'Unable to load categories.', 'error');
      empty.hidden = false;
      empty.innerHTML = `<i class="bi bi-exclamation-triangle"></i><b>Unable to load setup data</b><small>${escapeHtml(err.message || 'Please create category first.')}</small>`;
    }
  })();
})();
