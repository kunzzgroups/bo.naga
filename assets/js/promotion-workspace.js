/* Promotion workspace — one page, two levels.
   ------------------------------------------------------------------
   Replaces the pair of peer pages:
     promotion.html             listed Promotion Bonuses (flat)
     bonus-category-title.html  listed Bonus Category Titles (+ a create form)
   A Promotion carries `bonusCategoryTitleId`, so the two are parent and child,
   not two views of one table. This page renders the parent rows and expands
   each one into the promotions that belong to it.

   It owns the list DOM only. The category create/edit form is a plain
   .manage-form-card that assets/js/crud-modal-pattern.js lifts into a modal and
   wires to an "Add Bonus Category" button; this script fills that form on edit
   and POSTs it. Promotion create/edit still lives on promotion-edit.html.

   Not loaded here: assets/js/promotion.js. It is shared with promotion-edit.html
   and returns early without #promoForm / #promoList, so the edit page keeps it
   and this page does not pay for it.
   ------------------------------------------------------------------ */
(function(){
  'use strict';

  var listEl = document.getElementById('promoWorkspaceList');
  if(!listEl) return;

  var $ = function(id){ return document.getElementById(id); };

  var searchInput    = $('promoWorkspaceSearch');
  var statusFilter   = $('promoWorkspaceStatus');
  var sortFilter     = $('promoWorkspaceSort');
  var statusBox      = $('promoWorkspaceStatusBox');

  var categories = [];
  var promotions = [];
  var UNCATEGORIZED_ID = '__uncategorized__';
  var byCategory = {};          // categoryId (string) -> [promotion]
  var expanded   = {};          // categoryId (string) -> true

  /* ------------------------------------------------------------------ utils */

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function firstDefined(obj, keys){
    for(var i=0;i<keys.length;i++){
      var v = obj && obj[keys[i]];
      if(v !== undefined && v !== null && v !== '') return v;
    }
    return null;
  }

  function apiUrl(pathKey){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }

  function actorName(){
    var u = (window.BO_AUTH && BO_AUTH.user) ? BO_AUTH.user() : {};
    return u.username || u.displayName ||
      localStorage.getItem('adminUsername') || localStorage.getItem('admin_username') || 'ADMIN';
  }

  function authHeaders(extra){
    var base = (window.BO_AUTH && BO_AUTH.authHeader) ? BO_AUTH.authHeader() : {};
    var h = Object.assign({}, base, {
      'X-Admin-Username': actorName(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    return Object.assign(h, extra || {});
  }

  async function req(url, opt){
    opt = opt || {};
    opt.headers = authHeaders(opt.headers);
    opt.cache = opt.cache || 'no-store';
    var res = await fetch(url, opt);
    var json = await res.json().catch(function(){ return {}; });
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }

  function confirmDialog(message, title){
    if(window.BO_DIALOG && typeof BO_DIALOG.confirm === 'function'){
      return BO_DIALOG.confirm(message, { title: title, confirmText: 'Delete' });
    }
    return Promise.resolve(window.confirm(message));
  }

  function setStatus(message, type){
    if(!statusBox) return;
    statusBox.textContent = message || '';
    statusBox.className = 'upload-status ' + (type || '');
  }

  function toast(message, type){
    try{
      if(window.BO_TOAST && typeof BO_TOAST[type || 'success'] === 'function') BO_TOAST[type || 'success'](message);
    }catch(e){}
  }

  function imageUrl(item){
    if(item && item.imageUrl) return String(item.imageUrl);
    var value = String((item && item.image) || '').trim();
    if(!value) return '';
    if(/^(https?:)?\/\//i.test(value) || value.charAt(0) === '/' ||
       value.indexOf('data:') === 0 || value.indexOf('blob:') === 0) return value;
    return value;
  }

  function normalizeCategory(raw){
    var x = Object.assign({}, raw || {});
    x.id = firstDefined(x, ['id','categoryTitleId','bonusCategoryTitleId']);
    x.name = firstDefined(x, ['name','title']) || '';
    x.sortOrder = firstDefined(x, ['sortOrder','sort_order','displayOrder']) || 0;
    return x;
  }

  function normalizePromotion(raw){
    var x = Object.assign({}, raw || {});
    x.id = firstDefined(x, ['id','promotionId','promotion_id']);
    x.bonusCategoryTitleId = firstDefined(x, ['bonusCategoryTitleId','bonus_category_title_id','categoryTitleId']);
    x.bonusCategoryTitleName = firstDefined(x, ['bonusCategoryTitleName','bonus_category_title_name','categoryTitleName']);
    return x;
  }

  /* ---------------------------------------------------------------- loading */

  function groupPromotions(){
    byCategory = {};
    promotions.forEach(function(p){
      var key = String(p.bonusCategoryTitleId == null ? '' : p.bonusCategoryTitleId);
      if(!key) key = UNCATEGORIZED_ID;
      (byCategory[key] = byCategory[key] || []).push(p);
    });
  }

  function promotionsOf(category){
    return byCategory[String(category.id)] || [];
  }

  /* A promotion can carry no bonus category title (or one that was deleted). Those rows
     belong to no category, so without a synthetic group they would be fetched and then
     never drawn — the page would silently hide them. They are listed last, and the row
     offers no category actions because there is no category row behind it to edit. */
  function uncategorizedCategory(){
    var orphans = byCategory[UNCATEGORIZED_ID];
    if(!orphans || !orphans.length) return null;
    return { id: UNCATEGORIZED_ID, name: 'Uncategorized', sortOrder: 999999, __synthetic: true };
  }

  async function load(){
    listEl.innerHTML = headHtml() + '<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading bonus categories...</b></div>';
    try{
      var stamp = Date.now();
      var results = await Promise.all([
        req(apiUrl('BONUS_CATEGORY_TITLE_LIST') + '?page=1&size=300&_=' + stamp),
        req(apiUrl('PROMOTION_LIST') + '?_=' + stamp)
      ]);
      var rawCategories = Array.isArray(results[0]) ? results[0] : (results[0].data || []);
      var rawPromotions = Array.isArray(results[1]) ? results[1] : (results[1].data || []);
      categories = rawCategories.map(normalizeCategory);
      promotions = rawPromotions.map(normalizePromotion);
      groupPromotions();
      expanded = {};
      render();
    }catch(err){
      listEl.innerHTML = '<div class="promo-group-empty"><i class="bi bi-exclamation-triangle"></i>' +
        '<b>Unable to load promotions</b><small>' + esc(err.message || 'Please check API URL / CORS.') + '</small></div>';
    }
  }

  /* ------------------------------------------------- filtering & paging */

  function query(){ return ((searchInput && searchInput.value) || '').trim().toLowerCase(); }
  function statusValue(){ return (statusFilter && statusFilter.value) || ''; }
  function sortValue(){ return (sortFilter && sortFilter.value) || 'sortAsc'; }

  function promotionHaystack(p){
    return (String(p.name || '') + ' ' + String(p.promotionCode || '') + ' ' +
      String(p.bonusCategoryTitleName || '')).toLowerCase();
  }

  /* A category is listed when its own name matches the search, or when at least one
     of its promotions does. Once a status filter is on it becomes the decisive
     filter: only categories that actually hold a promotion in that status survive,
     so a status filter cannot leave a column of empty groups behind. */
  function visibleCategories(){
    var q = query(), status = statusValue(), mode = sortValue();

    var rows = categories.filter(function(cat){
      var nameHit = !q || String(cat.name || '').toLowerCase().indexOf(q) >= 0;
      var childHit = promotionsOf(cat).some(function(p){
        if(q && promotionHaystack(p).indexOf(q) < 0) return false;
        if(status && String(p.status) !== status) return false;
        return true;
      });
      return status ? childHit : (nameHit || childHit);
    });

    rows.sort(function(a, b){
      if(mode === 'sortDesc') return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      if(mode === 'nameAsc')  return String(a.name || '').localeCompare(String(b.name || ''));
      if(mode === 'nameDesc') return String(b.name || '').localeCompare(String(a.name || ''));
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });
    return rows;
  }

  /* Children of one category, after search + status. When the category name
     itself matched, the search no longer constrains its children. */
  function visiblePromotions(cat){
    var q = query(), status = statusValue();
    var nameHit = !!q && String(cat.name || '').toLowerCase().indexOf(q) >= 0;
    return promotionsOf(cat).filter(function(p){
      if(status && String(p.status) !== status) return false;
      if(q && !nameHit && promotionHaystack(p).indexOf(q) < 0) return false;
      return true;
    });
  }

  /* ------------------------------------------------------- filtering

     No paging. The list renders every matching category and scrolls when they do not fit
     (owner: "把 pagination 的设计功能去除" — footer band, Show N and the pager all gone from
     promotion.html). That retires the whole auto-fit machine this page used to carry: the
     `Show: -` fit (measure the box, guess a row count, then drop one row per paint until it
     fitted), the ResizeObserver that re-ran it when the module tab row landed, and the pager.
     `page`, `lockedAutoSize`, `lockedBoxHeight`, `autofitReloading` and the row-budget code
     went with them - the list's own scroll is now the only thing that moves when the content
     is taller than the box. */

  /* --------------------------------------------------------------- rendering */

  function categoryRowHtml(cat){
    var key = String(cat.id);
    var isOpen = !!expanded[key];
    var img = imageUrl(cat);
    var count = promotionsOf(cat).length;
    var childIds = 'promo-group-' + esc(key);
    var synthetic = !!cat.__synthetic;
    var meta = synthetic
      ? 'Promotions without a bonus category title'
      : 'ID: ' + esc(cat.id) + ' <span>&bull;</span> Sort: ' + esc(cat.sortOrder == null ? 0 : cat.sortOrder) +
        ' <span>&bull;</span> ' + count + ' promotion' + (count === 1 ? '' : 's');
    var actions = synthetic ? '' : (
      '<a class="icon-action-btn is-view" data-tip="Manage Items" aria-label="Manage Items"' +
        ' href="bonus-category-item.html?titleId=' + esc(key) + '"><i class="bi bi-collection" aria-hidden="true"></i></a>' +
      '<a class="icon-action-btn is-edit edit" data-tip="Edit" aria-label="Edit"' +
        ' href="bonus-category-title-edit.html?id=' + encodeURIComponent(key) + '"><i class="bi bi-pencil-square" aria-hidden="true"></i></a>' +
      '<button class="icon-action-btn is-reject delete btn-delete" data-tip="Delete" aria-label="Delete" type="button"' +
        ' data-cat-del="' + esc(key) + '"><i class="bi bi-trash" aria-hidden="true"></i></button>'
    );

    return '' +
      '<div class="category-table-row bonus-title-table-row' + (synthetic ? ' is-synthetic' : '') + '"' +
        ' data-category-row="' + esc(key) + '"' +
        ' aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
        '<span class="category-drag">' +
          '<button class="promo-tree-toggle" type="button" data-toggle="' + esc(key) + '"' +
            ' aria-expanded="' + (isOpen ? 'true' : 'false') + '" aria-controls="' + childIds + '"' +
            ' aria-label="' + (isOpen ? 'Collapse' : 'Expand') + ' promotions of ' + esc(cat.name || 'category') + '">' +
            '<i class="bi bi-chevron-right" aria-hidden="true"></i>' +
          '</button>' +
        '</span>' +
        '<div class="category-main-cell">' +
          '<div class="category-thumb-full">' +
            (img ? '<img src="' + esc(img) + '" alt="' + esc(cat.name || 'Bonus category') + '">'
                 : '<i class="bi ' + (synthetic ? 'bi-question-lg' : 'bi-image') + '"></i>') +
          '</div>' +
          '<div class="category-copy">' +
            '<b>' + esc(cat.name || 'Untitled Category') + '</b>' +
            '<small>' + meta + '</small>' +
          '</div>' +
        '</div>' +
        '<div class="category-status-cell">' +
          '<span class="status-pill active"><i class="bi bi-check-circle" aria-hidden="true"></i> Active</span>' +
          (count && !isOpen ? '<span class="promo-tree-count" title="Promotions in this category">' + count + '</span>' : '') +
        '</div>' +
        '<div class="category-action-cell">' + actions + '</div>' +
      '</div>' +
      panelHtml(cat, childIds);
  }

  /* Child row. It joins the PARENT's column grid (26px | name | count | actions) instead
     of opening a grid of its own: two grids in one card is what put the nested STATUS
     under a different x than every other column, and no amount of tuning fixes that —
     only sharing the grid does. The nesting is carried by the group's spine and by the
     indent inside the name cell. */
  /* Child row. It reuses the CATEGORY row's column grid (26 | name | status | actions,
     the values bo-charcoal-cms.css gives .bonus-title-table-row and the head) instead of
     being a <table> with a colgroup of its own. Two grids in one card is why the child
     status pill sat ~150px left of the parent's, why the child's icons missed the parent's,
     and why the header label did not sit over either: only sharing the grid fixes that.
     The nesting is carried by the panel surface, the empty first column, and the parent
     row's accent edge. */
  function promotionRowHtml(p){
    var active = Number(p.status) === 1;
    var code = p.promotionCode || ('PROMO-' + p.id);
    var rebateOn = !/DISABLED|NONE|^$/i.test(String(p.rebatePolicy || 'DISABLED'));
    var desc = String(p.description || p.detailText || p.ruleText || '')
      .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    var href = (p.id == null || p.id === '') ? 'promotion-edit.html'
      : ('promotion-edit.html#id=' + encodeURIComponent(p.id));

    return '' +
      '<div class="promotion-row" data-promo-row="' + esc(p.id) + '" title="' + esc(desc) + '">' +
        '<span class="promotion-row-gutter" aria-hidden="true"></span>' +
        '<div class="promotion-main-cell">' +
          '<div class="promotion-main-inner">' +
            '<div class="promotion-thumb">' +
              (p.bonusImageUrl ? '<img src="' + esc(p.bonusImageUrl) + '" alt="">'
                               : '<i class="bi bi-image" aria-hidden="true"></i>') +
            '</div>' +
            '<div class="promotion-copy">' +
              '<b class="promo-title">' + esc(p.name || 'Untitled promotion') + '</b>' +
              '<div class="promo-meta">' +
                '<span class="promo-code">' + esc(code) + '</span>' +
                '<span class="promo-order">Order ' + esc(p.displayOrder == null ? 0 : p.displayOrder) + '</span>' +
                '<span class="promo-chip">' + esc(p.claimCondition || 'MANUAL') + '</span>' +
                '<span class="promo-chip">' + esc(p.bonusType || 'FIXED') + '</span>' +
                '<span class="promo-rebate' + (rebateOn ? ' is-on' : '') + '">' + (rebateOn ? 'Rebate on' : 'Rebate off') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="promotion-status-cell">' +
          '<span class="slider-pill ' + (active ? 'active' : 'inactive') + '">' +
            '<i class="bi ' + (active ? 'bi-check-circle' : 'bi-pause-circle') + '" aria-hidden="true"></i>' +
            (active ? 'Active' : 'Inactive') +
          '</span>' +
        '</div>' +
        '<div class="promotion-action-cell">' +
          '<a class="icon-action-btn edit is-edit" data-tip="Edit promotion" aria-label="Edit promotion"' +
            ' href="' + href + '"><i class="bi bi-pencil-square" aria-hidden="true"></i></a>' +
          '<button class="icon-action-btn delete btn-delete is-reject" data-tip="Delete promotion"' +
            ' aria-label="Delete promotion" type="button" data-promo-del="' + esc(p.id) + '">' +
            '<i class="bi bi-trash" aria-hidden="true"></i></button>' +
        '</div>' +
      '</div>';
  }

  function panelHtml(cat, childIds){
    var key = String(cat.id);
    var rows = visiblePromotions(cat);
    var body = rows.length
      ? rows.map(promotionRowHtml).join('')
      : '<div class="promo-group-empty"><i class="bi bi-inbox"></i>' +
        (promotionsOf(cat).length ? 'No promotion matches the current filter.'
                                  : 'No promotion bonus in this category yet.') + '</div>';

    return '<div class="promo-group-panel" id="' + childIds + '" data-group-for="' + esc(key) + '"' +
      (expanded[key] ? '' : ' hidden') + '>' +
        body +
        '<a class="promo-group-add" href="promotion-edit.html">' +
          '<span class="promotion-row-gutter" aria-hidden="true"></span>' +
          '<span class="promo-group-add-label"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add promotion to this category</span>' +
        '</a>' +
      '</div>';
  }

  /* The header is rendered INTO the scroll container, not as a sibling above it. Sitting
     outside, it was the full card's width while the rows were card-width minus the
     scrollbar — measured 6px wider, which put every header label 6px off the column it
     names. Inside, both share one width by construction. */
  function headHtml(){
    return '<div class="bonus-title-table-head" role="row">' +
      '<span class="bonus-title-head-drag" aria-hidden="true"></span>' +
      '<span class="bonus-title-head-name">Bonus Category Title / Promotion</span>' +
      '<span class="bonus-title-head-status">Status</span>' +
      '<span class="bonus-title-head-actions">Actions</span>' +
    '</div>';
  }

  function render(){
    var rows = visibleCategories();
    var orphans = uncategorizedCategory();
    if(orphans){
      // Keep it under the same filters a real category would be under.
      var q = query(), status = statusValue();
      var nameHit = !q || String(orphans.name).toLowerCase().indexOf(q) >= 0;
      var childHit = promotionsOf(orphans).some(function(p){
        if(q && promotionHaystack(p).indexOf(q) < 0) return false;
        if(status && String(p.status) !== status) return false;
        return true;
      });
      if(status ? childHit : (nameHit || childHit)) rows = rows.concat([orphans]);
    }

    // Every match is drawn: there is no page to slice to any more.
    var visible = rows;

    listEl.innerHTML = headHtml() + visible.map(categoryRowHtml).join('');
    if(!visible.length){
      listEl.innerHTML = headHtml() + '<div class="promo-group-empty">' +
        '<i class="bi bi-award"></i>' +
        (categories.length ? 'No bonus category title matches the current filter.'
                           : 'No bonus category title found. Create your first one.') + '</div>';
    }
  }

  /* ---------------------------------------------------------------- actions */

  /* The child panel is rendered up front (collapsed rows carry it hidden), so
     expanding is a DOM flip — no re-render, which would move the toggle the
     operator just clicked and lose the list's scroll position. */
  function toggleCategory(key){
    var isOpen = !expanded[key];
    expanded[key] = isOpen;
    var row = listEl.querySelector('[data-category-row="' + key + '"]');
    var panel = listEl.querySelector('[data-group-for="' + key + '"]');
    var toggle = row && row.querySelector('[data-toggle]');
    if(row) row.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if(toggle){
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', (isOpen ? 'Collapse' : 'Expand') + ' promotions of this category');
    }
    if(panel) panel.hidden = !isOpen;
  }

  async function deleteCategory(key){
    if(key === UNCATEGORIZED_ID) return;
    var cat = categories.filter(function(c){ return String(c.id) === String(key); })[0];
    if(!cat) return;
    var ok = await confirmDialog('Delete "' + (cat.name || ('Category #' + key)) + '"?',
      'Delete Bonus Category Title');
    if(!ok) return;
    setStatus('Deleting category...', '');
    try{
      await req(apiUrl('BONUS_CATEGORY_TITLE_DELETE'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(key) })
      });
      setStatus('', '');
      toast('Category deleted.');
      await load();
    }catch(err){
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  async function deletePromotion(id){
    if(!(await confirmDialog('Delete this promotion?', 'Delete Promotion'))) return;
    try{
      await req(apiUrl('PROMOTION_DELETE'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id) })
      });
      toast('Promotion deleted.');
      await load();
    }catch(err){
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  /* ------------------------------------------------------------------ wiring */

  /* No category form on this page any more: "Add Bonus Category" and a row's pencil are plain
     links to bonus-category-title-edit.html, which owns the form, the image upload and the save
     (it used to be a card here, lifted into the shared modal by crud-modal-pattern.js). */

  listEl.addEventListener('click', function(e){
    var toggle = e.target.closest('[data-toggle]');
    if(toggle){ toggleCategory(toggle.getAttribute('data-toggle')); return; }

    var delCat = e.target.closest('[data-cat-del]');
    if(delCat){ deleteCategory(delCat.getAttribute('data-cat-del')); return; }

    var delPromo = e.target.closest('[data-promo-del]');
    if(delPromo){ deletePromotion(delPromo.getAttribute('data-promo-del')); return; }

    // The row itself is the disclosure control — the chevron is a 24px target and the
    // whole row reads as one. Links and buttons keep their own job.
    var row = e.target.closest('[data-category-row]');
    if(row && !e.target.closest('a, button')) toggleCategory(row.getAttribute('data-category-row'));
  });

  searchInput && searchInput.addEventListener('input', function(){ render(); });
  searchInput && searchInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') e.preventDefault(); });
  statusFilter && statusFilter.addEventListener('change', function(){ render(); });
  sortFilter && sortFilter.addEventListener('change', function(){ render(); });

  /* ---------------------------------------------------------- row-action tip

     ONE fixed element on <body>, not an ::after inside the row. The page's tips used to be a CSS
     bubble plus a family of `:has(.icon-action-btn[data-tip]:hover)` rules in bo-charcoal-cms.css
     that flipped every clipping ancestor - this list's scroll container among them - to
     `overflow: visible !important` so the bubble could escape. Measured with a real pointer on a
     sub-item's edit button: the list went `auto -> visible`, clientWidth 1232 -> 1238, every row
     and the sticky head with it, and snapped back on mouse-out - the owner's "指标悬浮在展开的 sub
     item 的 edit 按键会整个页面会闪动". The promotion rows had no bubble at all (`::after`
     content `none`), so the un-clipping bought nothing on the row being pointed at. Fixed
     positioning needs no ancestor un-clipped, so the bubble now lives on <body> - the Promotion
     Log page's `.pl-act-tip` recipe - and the page's bubble and un-clip rules are gone.

     One element per document: <body> outlives the content frame a swap replaces, so the element
     is kept on `window` and reused; the scroll/resize listeners are document-level and therefore
     slots, like promotion-debug.js's `__boPlScroll`. */
  function tipEl(){
    var tip = window.__boWsTip;
    if(tip && tip.parentNode) return tip;
    tip = document.createElement('div');
    tip.id = 'promoWsTip';
    tip.className = 'promo-ws-tip';
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tip);
    window.__boWsTip = tip;
    return tip;
  }

  function hideTip(){
    var tip = window.__boWsTip;
    if(tip) tip.classList.remove('is-on', 'is-below');
  }

  function placeTip(el){
    var text = el.getAttribute('data-tip') || '';
    if(!text){ hideTip(); return; }
    var tip = tipEl();
    tip.textContent = text;
    tip.classList.add('is-on');
    tip.classList.remove('is-below');
    var r = el.getBoundingClientRect();
    var tr = tip.getBoundingClientRect();
    var top = r.top - tr.height - 8, below = false;
    if(top < 8){ below = true; top = r.bottom + 8; }
    tip.classList.toggle('is-below', below);
    var left = Math.max(8, Math.min(r.left + r.width / 2 - tr.width / 2, window.innerWidth - tr.width - 8));
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }

  function tipTarget(e){
    return (e.target && e.target.closest) ? e.target.closest('#promoWorkspaceList [data-tip]') : null;
  }

  listEl.addEventListener('mouseover', function(e){ var el = tipTarget(e); if(el) placeTip(el); });
  listEl.addEventListener('mouseout', function(e){
    var el = tipTarget(e);
    if(!el) return;
    var next = e.relatedTarget;
    if(next && el.contains(next)) return;
    hideTip();
  });
  listEl.addEventListener('focusin', function(e){ var el = tipTarget(e); if(el) placeTip(el); });
  listEl.addEventListener('focusout', function(e){
    var el = tipTarget(e);
    if(!el) return;
    var next = e.relatedTarget;
    if(next && el.contains(next)) return;
    hideTip();
  });

  if(window.__boWsTipScroll) window.removeEventListener('scroll', window.__boWsTipScroll, true);
  window.__boWsTipScroll = hideTip;
  window.addEventListener('scroll', window.__boWsTipScroll, true);
  if(window.__boWsTipResize) window.removeEventListener('resize', window.__boWsTipResize);
  window.__boWsTipResize = hideTip;
  window.addEventListener('resize', window.__boWsTipResize);
  if(!window.__boWsTipSpa){
    window.__boWsTipSpa = 1;
    document.addEventListener('bo:spa:before', function(){ hideTip(); });
  }

  load();
})();
