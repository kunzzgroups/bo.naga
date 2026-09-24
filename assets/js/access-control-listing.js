/* ============================================================================
   Access Control family — footer pagination for the two listings that ship none.

   WHY THIS EXISTS
   Two of the family's five listings had no footer at all: Staff Permission
   (`role.html`, 17 rows and growing) and IP Whitelist Security
   (`ip-whitelist-security.html`, 14 rules). Their three siblings — Admin
   Management, Admin Login Log, Admin Operation Log — each end in the same bar:
   a `Show N entries` control on the left, `Showing a to b of c entries` in the
   middle, and the app-wide `.smart-page` pager on the right. A listing with no
   footer reads as an unfinished page next to those.

   HOW
   Opt in with `data-ac-listing` on the listing's card. The script owns the
   footer markup and the pager; the page's own script keeps owning the rows.
   Rows are hidden rather than removed, so nothing that reads the tbody is
   disturbed, and a MutationObserver re-applies paging whenever the page
   re-renders its rows (both pages redraw after a save, a toggle or a delete).
   The current page survives that redraw, clamped to the row count.

   This is deliberately separate from `pagination-standardizer.js`, which
   standardises footers that already exist and infers totals from the page's own
   DOM. Here the page has no total to infer from, so this module counts rows.

   The pager markup is the same `pageButtons()` shape `admin-user.js` and
   `admin-operation-log.js` emit, so the family ends with one pager.
   ========================================================================== */
(function () {
  'use strict';

  var SIZES = ['-', '10', '20', '50', '100', 'All'];

  function pageButtons(current, total) {
  total = Math.max(1, Number(total) || 1);
  current = Math.max(1, Math.min(Number(current) || 1, total));
  var pages = [];
  var add = function (n) { if (n >= 1 && n <= total && pages.indexOf(n) === -1) pages.push(n); };
  add(1);
  for (var n = current - 2; n <= current + 2; n++) add(n);
  add(total);
  pages.sort(function (a, b) { return a - b; });

  /* The LISTING ladder, from the page the owner points at: Member -> User
     Management (`member-management.js:175-177`) — First . numbered rungs +
     ellipses . Last. The `nav-text` chevron rungs found on the report pages
     (casino-report.js) are that family's variation, not the house one. */
  var html = '';
  html += '<button type="button" class="smart-page first" data-ac-page="1" ' +
    (current <= 1 ? 'disabled' : '') + ' title="First page" aria-label="First page"><i class="bi bi-chevron-bar-left" aria-hidden="true"></i></button>';
  var prev = 0;
  pages.forEach(function (pg) {
    if (prev && pg - prev > 1) html += '<span class="smart-page-ellipsis">…</span>';
    html += '<button type="button" class="smart-page ' + (pg === current ? 'active' : '') + '" data-ac-page="' + pg + '" ' +
      (pg === current ? 'aria-current="page"' : '') + '>' + pg + '</button>';
    prev = pg;
  });
  html += '<button type="button" class="smart-page last" data-ac-page="' + total + '" ' +
    (current >= total ? 'disabled' : '') + ' title="Last page" aria-label="Last page"><i class="bi bi-chevron-bar-right" aria-hidden="true"></i></button>';
  return html;
}


/* ----------------------------------------------------------------------------
   PAGE SIZE — the app-wide `-` contract.

   Every listing footer in this product opens on `-`, and `-` means "as many rows
   as the panel can show": the control reads `-`, the table fills the space and
   nothing scrolls (DESIGN.md → "The `-` page-size fit", where the acceptance
   line is "on every one: the control reads `-` ... no panel has a scrollbar at
   the fitted size"). `All` shows every row. A number means that number.

   The Access Control footers shipped `10` as their default and no `-` at all, so
   they were the only listings in the product that opened on a fixed 10.
   -------------------------------------------------------------------------- */
function fitRows(card) {
  /* `pagination-standardizer.js` -> `resolvePageSize()`, the same order of moves:
     the scroller's own height, the head subtracted only while it is still inside
     it, a painted row (>= 38px) as the divisor, and the same clamp. The house
     numbers, so the family's `-` lands where the other listings land. */
  var scroll = card.querySelector('.table-wrap') || card;
  var head = scroll.querySelector('thead');
  var headH = head ? Math.ceil(head.getBoundingClientRect().height) : 44;
  var avail = Math.max(0, Math.floor(scroll.clientHeight) - headH);
  /* A real row, not the placeholder: a "Loading…" cell is one line (38px) while a
     real row is two (57px here), and measuring the placeholder over-counts by
     three rows — measured on 11.2: 319 / 38 = 8 rows where 319 / 57 = 5 fit. */
  var sample = null;
  var rows = scroll.querySelectorAll('tbody tr');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].cells && rows[i].cells.length > 1) { sample = rows[i].cells[0]; break; }
  }
  if (!sample && rows.length) sample = rows[0].cells[0];
  var rowH = sample ? Math.max(38, Math.round(sample.getBoundingClientRect().height)) : 41;
  return Math.max(5, Math.min(200, Math.floor(avail / rowH) || 12));
}
window.boAc = {
  FIT: '-',
  ALL: 'All',
  /* What a select value means in rows. `card` is the listing card, for the fit. */
  resolve: function (value, card) {
    var v = String(value == null ? '' : value).trim();
    if (v === 'All' || v === '*') return 100000;
    if (v === '-' || v === '' || v === 'auto') return card ? fitRows(card) : 10;
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : (card ? fitRows(card) : 10);
  },
  /* The option list every family footer carries, `-` first. */
  options: function () { return ['-', '10', '20', '50', '100', 'All']; },
  pageButtons: pageButtons,
  /* After the rows are painted, check the panel really does not overflow and let
     the page re-render once if it does. This is the report family's own settle
     (`verifyOverflow()` re-checks a frame later), and it is what makes `-` exact
     even though the first measurement happens before real rows exist. */
  settle: function (card, rerender) {
    if (!card || typeof rerender !== 'function') return;
    var self = this;
    requestAnimationFrame(function () {
      var wrap = card.querySelector('.table-wrap');
      if (!wrap) return;
      var sel = card.querySelector('.entries-control select');
      var v = sel ? String(sel.value).trim() : '';
      if (v !== '' && v !== '-') return;                 /* only in fit mode */
      var passes = card.__boAcSettle || 0;
      if (wrap.scrollHeight > wrap.clientHeight + 1 && passes < 3) {
        card.__boAcSettle = passes + 1;
        rerender();
      } else if (wrap.scrollHeight <= wrap.clientHeight + 1) {
        card.__boAcSettle = 0;
      }
    });
  }
};

  function isPlaceholder(row) {
    var cells = row.cells;
    if (!cells || cells.length !== 1) return false;
    return cells[0].hasAttribute('colspan');
  }

  function Listing(root) {
    this.root = root;
    this.size = root.getAttribute('data-ac-pagesize') || SIZES[0];
    this.page = 1;
    this.term = '';
    this.footer = null;
    this.build();
    this.observe();
    this.wireSearch();
  }

  Listing.prototype.rows = function () {
    var body = this.root.querySelector('tbody');
    if (!body) return [];
    return Array.prototype.filter.call(body.rows, function (r) { return !isPlaceholder(r); });
  };

  /* The rows that survive the search. The page size, the "Showing a to b of c"
     line and the pager all count THESE, so a search reads as a smaller listing
     rather than as a listing with holes in it. */
  Listing.prototype.matched = function () {
    var term = this.term;
    if (!term) return this.rows();
    return this.rows().filter(function (row) {
      return (row.textContent || '').toLowerCase().indexOf(term) !== -1;
    });
  };

  Listing.prototype.declaredSize = function () {
    return this.root.getAttribute('data-ac-pagesize') || SIZES[0];
  };

  Listing.prototype.build = function () {
    var self = this;
    var footer = document.createElement('div');
    // `bo-pagination-standard` is the app-wide footer recipe (bo-ui-standard.css
    // gives it the left / middle / right grid). It is stated here rather than
    // left to bo-ui-standard.js's own scan, which only finds footers that exist
    // when it runs — this script may create its footer after that point.
    footer.className = 'table-footer bo-pagination-standard';
    footer.setAttribute('data-ac-footer', '');

    var left = document.createElement('div');
    left.className = 'entries-control';
    var select = document.createElement('select');
    select.setAttribute('aria-label', 'Rows per page');
    SIZES.forEach(function (n) {
      var o = document.createElement('option');
      o.value = String(n);
      o.textContent = String(n);
      select.appendChild(o);
    });
    select.value = String(this.declaredSize());
    this.size = boAc.resolve(select.value, this.root);
    select.addEventListener('change', function () {
      self.size = boAc.resolve(select.value, self.root);
      self.page = 1;
      self.apply();
    });
    left.appendChild(document.createTextNode('Show '));
    left.appendChild(select);
    left.appendChild(document.createTextNode(' entries'));

    var info = document.createElement('div');
    info.className = 'table-info bo-pagination-info';

    var pager = document.createElement('div');
    pager.className = 'pagination-clean bo-pagination-buttons';
    pager.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ac-page]');
      if (!btn || btn.disabled) return;
      self.page = Number(btn.getAttribute('data-ac-page')) || 1;
      self.apply();
    });

    footer.appendChild(left);
    footer.appendChild(info);
    footer.appendChild(pager);
    this.root.appendChild(footer);
    this.footer = footer;
  };

  Listing.prototype.apply = function () {
    var all = this.rows();
    var rows = this.matched();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / this.size));
    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    var start = (this.page - 1) * this.size;
    var end = start + this.size;
    var shown = 0;
    rows.forEach(function (row) {
      var visible = shown >= start && shown < end;
      row.style.display = visible ? '' : 'none';
      if (visible) shown++;
    });
    /* A row the search rejected is hidden whether or not the pager would have
       reached it. */
    if (this.term) {
      var inPage = new Set(rows.slice(start, end));
      Array.prototype.forEach.call(all, function (row) {
        if (!inPage.has(row)) row.style.display = 'none';
      });
    }

    var info = this.footer.querySelector('.table-info');
    var text = total
      ? 'Showing ' + (start + 1) + ' to ' + Math.min(end, total) + ' of ' + total + ' entries'
      : 'Showing 0 to 0 of 0 entries';
    if (info.textContent !== text) info.textContent = text;

    /* `-` fits the panel, and the fit needs a painted row: the first pass runs
       with none, so re-fit exactly once when the rows exist. The flag keeps it
       to one extra pass (a second would chase its own geometry). */
    if (window.boAc && String(this.declaredSize()) === boAc.FIT && !this._refit && total) {
      var fitted = boAc.resolve('-', this.root);
      if (fitted !== this.size) {
        this._refit = true;
        this.size = fitted;
        this.page = 1;
        this.apply();
        return;
      }
    }

    if (window.boAc && boAc.settle) {
      var self2 = this;
      boAc.settle(this.root, function () {
        /* Re-MEASURE, not just repaint: the first pass sizes off a placeholder row
           (38px) where the real rows are 57, so re-applying the same size changes
           nothing — and that is exactly how 11.6 stayed one row too long. */
        self2.size = boAc.resolve(self2.declaredSize(), self2.root);
        self2.page = 1;
        self2.apply();
      });
    }

    var pager = this.footer.querySelector('.pagination-clean');
    var html = pageButtons(this.page, totalPages);
    if (pager.getAttribute('data-ac-rendered') !== html) {
      pager.innerHTML = html;
      pager.setAttribute('data-ac-rendered', html);
    }
  };

  Listing.prototype.wireSearch = function () {
    var self = this;
    var input = this.root.querySelector('[data-ac-search]')
      || document.querySelector('[data-ac-search]');
    if (!input) return;
    var timer = 0;
    var run = function () {
      self.term = String(input.value || '').trim().toLowerCase();
      self.page = 1;
      self.apply();
    };
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 400); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { clearTimeout(timer); run(); }
    });
  };

  Listing.prototype.observe = function () {
    var self = this;
    var body = this.root.querySelector('tbody');
    if (!body || !window.MutationObserver) return;
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        self.apply();
      });
    }).observe(body, { childList: true });
  };

  function init() {
    var roots = document.querySelectorAll('[data-ac-listing]');
    Array.prototype.forEach.call(roots, function (root) {
      if (root.getAttribute('data-ac-ready')) return;
      root.setAttribute('data-ac-ready', '1');
      var listing = new Listing(root);
      listing.apply();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
