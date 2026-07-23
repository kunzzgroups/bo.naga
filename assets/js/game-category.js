
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


function normalizeCategoryDisplayMode(value) {
  const mode = String(value || '').trim().toUpperCase();
  if (mode === 'PROVIDER' || mode === 'PROVIDER_FIRST') return 'PROVIDER_FIRST';
  return 'DIRECT_GAME';
}

function getCategoryDisplayMode(item) {
  if (!item || typeof item !== 'object') return 'DIRECT_GAME';
  return normalizeCategoryDisplayMode(
    item.displayMode ??
    item.display_mode ??
    item.frontendDisplayMode ??
    item.frontend_display_mode ??
    item.categoryDisplayMode ??
    item.category_display_mode ??
    item.mode
  );
}

function setCategoryDisplayMode(select, value) {
  if (!select) return;
  const normalized = normalizeCategoryDisplayMode(value);
  select.value = normalized;
  // reports.js replaces native selects with a rounded visual dropdown.
  // Dispatch change so the visible label follows the selected native value.
  select.dispatchEvent(new Event('change', { bubbles: false }));
}

function categoryDisplayModeLabel(value) {
  return normalizeCategoryDisplayMode(value) === 'PROVIDER_FIRST' ? 'Provider First' : 'Direct Game List';
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
  const providerSelector = document.getElementById('categoryProviderSelector');
  const providerRulesBox = document.getElementById('categoryProviderRules');
  let allProviders = [];
  let allGames = [];
  let providerConfigReady = Promise.resolve();

  let selectedFile = null;
  let currentItems = [];
  let picker;


  function parseProviderRules(value) {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value || '{}') : (value || {});
      const providers = Array.isArray(parsed.providers) ? parsed.providers : [];
      return providers.map(rule => ({
        providerCode: String(rule.providerCode || rule.provider_code || rule.code || '').toUpperCase(),
        gameMode: String(rule.gameMode || rule.game_mode || 'ALL').toUpperCase(),
        gameIds: Array.isArray(rule.gameIds || rule.game_ids) ? (rule.gameIds || rule.game_ids) : []
      })).filter(rule => rule.providerCode);
    } catch (e) { return []; }
  }

  function splitCategoryIds(value) {
    if (Array.isArray(value)) return value.map(String);
    return String(value || '').split(/[,|]/).map(v => v.trim()).filter(Boolean);
  }

  function rulesForCategory(item) {
    const categoryId = String(item?.id || '');
    const explicitRules = parseProviderRules(item?.providerRules || item?.provider_rules);
    const result = new Map(explicitRules.map(rule => [rule.providerCode, {...rule, gameIds: [...rule.gameIds]}]));

    allProviders.forEach(provider => {
      const code = String(provider.code || '').toUpperCase();
      if (!code) return;
      const providerCategoryIds = splitCategoryIds(provider.categoryIds ?? provider.category_ids ?? provider.providerType ?? provider.provider_type);
      const categoryGames = allGames.filter(game =>
        String(game.providerCode || game.provider_code || '').toUpperCase() === code &&
        String(game.categoryId ?? game.category_id ?? '') === categoryId
      );
      const providerBelongsToCategory = providerCategoryIds.includes(categoryId);
      const existing = result.get(code);

      if (existing) {
        if (existing.gameMode === 'SELECTED' && categoryGames.length) {
          existing.gameIds = [...new Set([...existing.gameIds.map(String), ...categoryGames.map(game => String(game.id))])];
        }
        return;
      }

      if (providerBelongsToCategory) {
        result.set(code, {providerCode: code, gameMode: 'ALL', gameIds: []});
      } else if (categoryGames.length) {
        result.set(code, {providerCode: code, gameMode: 'SELECTED', gameIds: categoryGames.map(game => game.id)});
      }
    });

    return [...result.values()].map(rule => {
      const providerGames = allGames.filter(game =>
        String(game.providerCode || game.provider_code || '').toUpperCase() === rule.providerCode
      );
      const providerGameIds = new Set(providerGames.map(game => String(game.id)));
      const selectedGameIds = new Set((rule.gameIds || []).map(String).filter(gameId => providerGameIds.has(gameId)));

      // When every game from this provider already belongs to the category,
      // show the simpler "All Games" mode instead of an empty Available Games list.
      if (providerGameIds.size > 0 && selectedGameIds.size === providerGameIds.size) {
        return { providerCode: rule.providerCode, gameMode: 'ALL', gameIds: [] };
      }

      return {
        providerCode: rule.providerCode,
        gameMode: rule.gameMode === 'SELECTED' ? 'SELECTED' : 'ALL',
        gameIds: rule.gameMode === 'SELECTED' ? [...selectedGameIds] : []
      };
    });
  }

  function selectedProviderCodes() {
    return [...providerSelector.querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value);
  }

  function currentProviderRulesMap() {
    const map = new Map();
    providerRulesBox?.querySelectorAll('.category-provider-rule').forEach(card => {
      const code = String(card.dataset.providerCode || '').toUpperCase();
      const mode = card.querySelector('input[type="radio"]:checked')?.value || 'ALL';
      const gameIds = [...card.querySelectorAll('.category-provider-game-row.is-assigned')].map(row => Number(row.dataset.gameId));
      map.set(code, { providerCode: code, gameMode: mode, gameIds });
    });
    return map;
  }

  function renderProviderRules(existingRules = []) {
    if (!providerSelector || !providerRulesBox) return;
    const existing = existingRules instanceof Map
      ? existingRules
      : new Map(existingRules.map(r => [String(r.providerCode || '').toUpperCase(), r]));
    providerSelector.innerHTML = allProviders.map(p => {
      const code = String(p.code || '').toUpperCase();
      return `<label class="category-provider-choice ${existing.has(code) ? 'is-selected' : ''}" role="button" aria-pressed="${existing.has(code) ? 'true' : 'false'}">
        <input type="checkbox" value="${escapeHtml(code)}" ${existing.has(code) ? 'checked' : ''}>
        <span class="category-provider-choice-name">${escapeHtml(p.name || code)}</span>
      </label>`;
    }).join('') || '<small class="text-muted">No provider available.</small>';
    rebuildProviderRuleCards(existing);
  }

  function gameAssignmentRow(game, assigned) {
    return `<div class="category-provider-game-row ${assigned ? 'is-assigned' : ''}" data-game-id="${escapeHtml(game.id)}" data-search="${escapeHtml(String(game.name || '').toLowerCase())}">
      <div class="category-provider-game-info">
        <b>${escapeHtml(game.name || ('Game #' + game.id))}</b>
        <small>${escapeHtml(game.gameCode || game.code || '')}</small>
      </div>
      <button type="button" class="category-provider-game-action ${assigned ? 'remove' : 'add'}" aria-label="${assigned ? 'Remove game' : 'Add game'}">
        <i class="bi ${assigned ? 'bi-dash-lg' : 'bi-plus-lg'}"></i>
      </button>
    </div>`;
  }

  function rebuildProviderRuleCards(existing = new Map()) {
    const codes = selectedProviderCodes();
    providerRulesBox.innerHTML = codes.map(code => {
      const provider = allProviders.find(p => String(p.code || '').toUpperCase() === code) || {name: code};
      const rule = existing.get(code) || {};
      let mode = String(rule.gameMode || 'ALL').toUpperCase();
      const games = allGames.filter(g => String(g.providerCode || g.provider_code || '').toUpperCase() === code);
      const validGameIds = new Set(games.map(g => String(g.id)));
      const selectedIds = new Set((rule.gameIds || []).map(String).filter(gameId => validGameIds.has(gameId)));
      if (mode === 'SELECTED' && games.length > 0 && selectedIds.size === games.length) {
        mode = 'ALL';
        selectedIds.clear();
      }
      const availableRows = games.filter(g => !selectedIds.has(String(g.id))).map(g => gameAssignmentRow(g, false)).join('');
      const assignedRows = games.filter(g => selectedIds.has(String(g.id))).map(g => gameAssignmentRow(g, true)).join('');
      return `<section class="category-provider-rule" data-provider-code="${escapeHtml(code)}">
        <div class="category-provider-rule-head">
          <div class="category-provider-rule-title">
            <span class="category-provider-rule-icon"><i class="bi bi-controller"></i></span>
            <div><b>${escapeHtml(provider.name || code)}</b><small>${games.length} game(s) available</small></div>
          </div>
          <div class="category-provider-mode-switch" role="radiogroup" aria-label="Game display mode">
            <label><input type="radio" name="providerMode_${escapeHtml(code)}" value="ALL" ${mode !== 'SELECTED' ? 'checked' : ''}><span><i class="bi bi-collection-play"></i> All Games</span></label>
            <label><input type="radio" name="providerMode_${escapeHtml(code)}" value="SELECTED" ${mode === 'SELECTED' ? 'checked' : ''}><span><i class="bi bi-check2-square"></i> Selected Games</span></label>
          </div>
        </div>
        <div class="category-provider-assignment" ${mode === 'SELECTED' ? '' : 'hidden'}>
          <div class="category-provider-assignment-note"><i class="bi bi-info-circle"></i><span>Assigning games to: <b>${escapeHtml(provider.name || code)}</b></span></div>
          <div class="category-provider-assignment-grid">
            <div class="category-provider-game-column available-column">
              <div class="category-provider-column-head"><div><b>Available Games</b><small class="available-count">${games.length - selectedIds.size}</small></div><input class="category-provider-game-search" data-side="available" type="search" placeholder="Search games..."></div>
              <div class="category-provider-game-list available-list">${availableRows || '<div class="category-provider-empty">No available games.</div>'}</div>
            </div>
            <div class="category-provider-game-column assigned-column">
              <div class="category-provider-column-head"><div><b>Assigned Games</b><small class="assigned-count">${selectedIds.size}</small></div><input class="category-provider-game-search" data-side="assigned" type="search" placeholder="Search games..."></div>
              <div class="category-provider-game-list assigned-list">${assignedRows || '<div class="category-provider-empty">No assigned games.</div>'}</div>
            </div>
          </div>
        </div>
      </section>`;
    }).join('') || '<div class="category-provider-empty-state"><i class="bi bi-diagram-3"></i><b>Select one or more providers</b><small>Provider game settings will appear here.</small></div>';
  }

  function refreshAssignmentCard(card) {
    const availableList = card.querySelector('.available-list');
    const assignedList = card.querySelector('.assigned-list');
    const availableRows = [...card.querySelectorAll('.category-provider-game-row:not(.is-assigned)')];
    const assignedRows = [...card.querySelectorAll('.category-provider-game-row.is-assigned')];
    availableRows.forEach(row => availableList.appendChild(row));
    assignedRows.forEach(row => assignedList.appendChild(row));
    card.querySelector('.available-count').textContent = availableRows.length;
    card.querySelector('.assigned-count').textContent = assignedRows.length;
    availableList.querySelector('.category-provider-empty')?.remove();
    assignedList.querySelector('.category-provider-empty')?.remove();
    if (!availableRows.length) availableList.insertAdjacentHTML('beforeend', '<div class="category-provider-empty">No available games.</div>');
    if (!assignedRows.length) assignedList.insertAdjacentHTML('beforeend', '<div class="category-provider-empty">No assigned games.</div>');
  }

  function collectProviderRules() {
    const providers = [...providerRulesBox.querySelectorAll('.category-provider-rule')].map(card => {
      const code = card.dataset.providerCode;
      const mode = card.querySelector('input[type="radio"]:checked')?.value || 'ALL';
      let gameIds = mode === 'SELECTED'
        ? [...card.querySelectorAll('.category-provider-game-row.is-assigned')].map(row => Number(row.dataset.gameId))
        : [];
      const providerGameCount = allGames.filter(game =>
        String(game.providerCode || game.provider_code || '').toUpperCase() === String(code || '').toUpperCase()
      ).length;
      const normalizedMode = mode === 'SELECTED' && providerGameCount > 0 && gameIds.length >= providerGameCount
        ? 'ALL'
        : mode;
      if (normalizedMode === 'ALL') gameIds = [];
      return { providerCode: code, gameMode: normalizedMode, gameIds };
    });
    return JSON.stringify({providers});
  }

  async function loadProviderConfigData() {
    try {
      const [providersJson, gamesJson] = await Promise.all([fetchJson(adminApi('GAME_PROVIDER_LIST')), fetchJson(adminApi('GAME_LIST'))]);
      allProviders = (providersJson.data || []).filter(x => Number(x.status) === 1);
      allGames = gamesJson.data || [];
      renderProviderRules([]);
    } catch (e) {
      allProviders = []; allGames = []; renderProviderRules([]);
    }
  }

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
    setCategoryDisplayMode(displayMode, 'PROVIDER_FIRST');
    selectedFile = null;
    picker && picker.clearPreview();
    currentImage.hidden = true;
    formTitle.textContent = 'Create Category';
    setStatus('', '');
    renderProviderRules([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function editItem(item) {
    await providerConfigReady;
    id.value = item.id || '';
    name.value = item.name || '';
    sortOrder.value = item.sortOrder ?? 0;
    status.value = String(item.status ?? 1);
    setCategoryDisplayMode(displayMode, getCategoryDisplayMode(item));
    renderProviderRules(rulesForCategory(item));
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
      const itemMode = getCategoryDisplayMode(item);
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
          <div class="category-copy"><b>${escapeHtml(item.name || 'Untitled Category')}</b><small>ID: ${escapeHtml(item.id)} <span>•</span> Sort: ${escapeHtml(item.sortOrder ?? 0)} <span>•</span> Mode: ${escapeHtml(categoryDisplayModeLabel(getCategoryDisplayMode(item)))}</small></div>
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
    if (displayMode) fd.append('displayMode', normalizeCategoryDisplayMode(displayMode.value));
    fd.append('providerRules', collectProviderRules());
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
    if (!(await BO_DIALOG.confirm('Delete this category?', {title:'Delete Category', confirmText:'Delete'}))) return;
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

  providerSelector?.addEventListener('change', e => {
    const saved = currentProviderRulesMap();
    const choice = e.target.closest('.category-provider-choice');
    if (choice) {
      choice.classList.toggle('is-selected', e.target.checked);
      choice.setAttribute('aria-pressed', e.target.checked ? 'true' : 'false');
    }
    rebuildProviderRuleCards(saved);
  });

  providerRulesBox?.addEventListener('change', e => {
    if (e.target.matches('input[type="radio"]')) {
      const card = e.target.closest('.category-provider-rule');
      const assignment = card.querySelector('.category-provider-assignment');
      const selectedMode = e.target.value === 'SELECTED';
      assignment.hidden = !selectedMode;

      // Switching from All Games to Selected Games starts with every provider
      // game assigned. The administrator can then remove only the unwanted games.
      if (selectedMode) {
        card.querySelectorAll('.category-provider-game-row').forEach(row => {
          row.classList.add('is-assigned');
          const button = row.querySelector('.category-provider-game-action');
          if (button) {
            button.className = 'category-provider-game-action remove';
            button.setAttribute('aria-label', 'Remove game');
            button.innerHTML = '<i class="bi bi-dash-lg"></i>';
          }
        });
        refreshAssignmentCard(card);
      }
    }
  });

  providerRulesBox?.addEventListener('click', e => {
    const button = e.target.closest('.category-provider-game-action');
    if (!button) return;
    const row = button.closest('.category-provider-game-row');
    const card = button.closest('.category-provider-rule');
    const assigning = button.classList.contains('add');
    row.classList.toggle('is-assigned', assigning);
    button.className = `category-provider-game-action ${assigning ? 'remove' : 'add'}`;
    button.setAttribute('aria-label', assigning ? 'Remove game' : 'Add game');
    button.innerHTML = `<i class="bi ${assigning ? 'bi-dash-lg' : 'bi-plus-lg'}"></i>`;
    refreshAssignmentCard(card);
  });

  providerRulesBox?.addEventListener('input', e => {
    if (!e.target.matches('.category-provider-game-search')) return;
    const card = e.target.closest('.category-provider-rule');
    const side = e.target.dataset.side;
    const query = e.target.value.trim().toLowerCase();
    const selector = side === 'assigned' ? '.category-provider-game-row.is-assigned' : '.category-provider-game-row:not(.is-assigned)';
    card.querySelectorAll(selector).forEach(row => {
      row.hidden = query && !String(row.dataset.search || '').includes(query);
    });
  });

  form.addEventListener('submit', saveCategory);
  resetBtn.addEventListener('click', resetForm);
  refreshBtn.addEventListener('click', loadCategories);

  list.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const item = currentItems.find(x => String(x.id) === String(editBtn.dataset.editId));
      if (item) void editItem(item);
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
  providerConfigReady = loadProviderConfigData();
  Promise.all([providerConfigReady, loadCategories()]);
})();
