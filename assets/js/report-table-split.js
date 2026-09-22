/*
 * 8.1–8.11 report tables — header split out of the scrolling box.
 *
 * Owner: "我要的是这个呀" with a write-up of the technique: 表头放在滚动容器外面，所以滚动条只覆盖
 * 表体这一段，表头旁边干干净净. That is the same shape this repo already ships on the transaction
 * family (`.bo-tx-table-head` + a body scroller + `scrollLeft` mirroring — see member-deposit.js,
 * member-wallet.js, operations-report.js, transaction-report.html).
 *
 * Why a script rather than authored `colgroup` widths like those pages: the write-up's own cost is
 * "两个 table 列宽写得一摸一样", and these eleven tables have 5 to 16 columns each with no widths
 * authored anywhere. Hand-writing 11 sets of percentages cannot be checked by looking at it, and
 * `table-layout:fixed` with *even* columns — the only thing you get without widths — truncates the
 * 14-column page's headers ("Deposit Approved Members" needs ~180px, an even split gives it ~112px).
 * DESIGN.md already records that regression being measured and reverted once.
 *
 * So the widths are DERIVED instead of authored: measure the body table's natural (auto) column
 * widths — which already sum to the card width, so the table still fills it — then pin both tables to
 * those exact widths with `fixed` + a matching `colgroup`. Content-driven and identical by
 * construction, and it re-derives on resize and whenever the body re-renders.
 *
 * Desktop only, matching the viewport-locked frame (bo-report-family.css §15): below 992px the page
 * keeps its natural flow and the single table with its sticky header.
 */
(function(){
  var MIN_WIDTH = 992;
  var HEAD_CLASS = 'bo-report-head';
  var OVERRIDES = ['width', 'table-layout', 'min-width', 'max-width'];

  function eligible(){
    var body = document.body;
    if(!body || !body.classList.contains('bo-report-family')) return false;
    if(body.classList.contains('transaction-report-page')) return false;   // owns its own split
    if(window.innerWidth < MIN_WIDTH) return false;
    return true;
  }

  function headFor(card){
    var head = card.querySelector(':scope > .' + HEAD_CLASS);
    if(head) return head;
    var wrap = card.querySelector(':scope > .table-wrap');
    var table = wrap && wrap.querySelector('table');
    var thead = table && table.querySelector('thead');
    if(!wrap || !table || !thead) return null;

    head = document.createElement('div');
    head.className = HEAD_CLASS;
    var headTable = document.createElement('table');
    // carry the table's own classes/attributes so every `.report-table` rule applies to it too
    for(var i = 0; i < table.attributes.length; i++){
      headTable.setAttribute(table.attributes[i].name, table.attributes[i].value);
    }
    headTable.removeAttribute('style');
    headTable.appendChild(thead);              // move the real thead; the body keeps tbody only
    head.appendChild(headTable);
    card.insertBefore(head, wrap);

    // the body scroller drives the header's horizontal position (the repo's existing pattern)
    wrap.addEventListener('scroll', function(){
      head.scrollLeft = wrap.scrollLeft;
    }, { passive: true });

    // re-derive whenever the page's own script re-renders rows
    var tbody = table.querySelector('tbody');
    if(tbody && window.MutationObserver){
      var pending = 0;
      new MutationObserver(function(){
        clearTimeout(pending);
        pending = setTimeout(function(){ sync(card); }, 0);
      }).observe(tbody, { childList: true });
    }
    return head;
  }

  function tablesOf(card){
    var head = card.querySelector(':scope > .' + HEAD_CLASS);
    var wrap = card.querySelector(':scope > .table-wrap');
    if(!head || !wrap) return null;
    return { head: head, headTable: head.querySelector('table'), wrap: wrap, table: wrap.querySelector('table') };
  }

  function clearOverrides(tb){
    OVERRIDES.forEach(function(p){ tb.style.removeProperty(p); });
    var cg = tb.querySelector('colgroup');
    if(cg) cg.parentNode.removeChild(cg);
  }

  /* Natural per-column widths for one table: `width:max-content` asks the auto layout for what
     each column actually needs (cells are `white-space:nowrap`, so this is the longest line in
     the column, not a wrapped one). Pass `row` to measure a specific row. */
  function naturalWidths(tb, rowSelector, row){
    tb.style.setProperty('width', 'max-content', 'important');
    tb.style.setProperty('table-layout', 'auto', 'important');
    // `reports.css` pins `.report-table{min-width:100%}` and legacy adds `max-width:100%`. Left in
    // place they floor the table at the container width, so `max-content` measures the FILLED
    // distribution instead of the natural one — and then max()ing two filled distributions gives a
    // total above the container (measured 1352 in a 1195 wrap), turning a table that filled the
    // card into one with a pointless horizontal scrollbar.
    tb.style.setProperty('min-width', '0', 'important');
    tb.style.setProperty('max-width', 'none', 'important');
    var cg = tb.querySelector('colgroup');
    if(cg) cg.parentNode.removeChild(cg);
    void tb.offsetWidth;
    row = row || (rowSelector ? tb.querySelector(rowSelector) : null);
    if(!row) return null;
    var out = [], i;
    for(i = 0; i < row.children.length; i++){
      var w = row.children[i].getBoundingClientRect().width;
      if(!w) return null;                      // hidden (display:none) row — nothing to measure
      out.push(w);
    }
    return out;
  }

  function measure(t){
    [t.headTable, t.table].forEach(clearOverrides);

    var hw = naturalWidths(t.headTable, 'thead tr');
    if(!hw) return null;
    var n = hw.length;

    // The body row must be a real per-column row. Before the data arrives (and in the empty
    // state) the body is a single `<td colspan>` placeholder: its one measured cell is the FULL
    // row width, and taking it as column 0's need pinned column 0 to the whole card — measured
    // columns [1195, 235, 191, …], a 2296px table in a 1195px wrap. Skip any row that does not
    // have one cell per column.
    var bw = null, rows = t.table.querySelectorAll('tbody tr');
    for(var r = 0; r < rows.length; r++){
      if(rows[r].children.length !== n || rows[r].querySelector('td[colspan]')) continue;
      bw = naturalWidths(t.table, null, rows[r]);
      break;
    }

    // The per-column MAX of the header and the body row — not the body row alone. Splitting the
    // header out of the table means the body table no longer knows how wide its own headings
    // need to be, and measuring only the body truncated twelve headings on the 14-column page
    // ("Deposit Approved Members" -> "Deposit Appr"). The max restores exactly what the single
    // table's auto layout used to compute, since the heading row was one of its rows.
    var widths = [], total = 0, i;
    for(i = 0; i < n; i++){
      widths.push(Math.max(hw[i] || 0, bw && bw[i] ? bw[i] : 0));
      total += widths[i];
    }
    if(!total) return null;

    // Fill the card when the content is narrower than it (the look `auto` + width:100% gave) by
    // scaling every column by the same factor; when the content is wider, leave it and let the
    // wrap scroll sideways, which is what these tables did before the split.
    var target = t.wrap.clientWidth;
    if(total < target){
      var scale = target / total;
      total = 0;
      for(i = 0; i < n; i++){ widths[i] = widths[i] * scale; total += widths[i]; }
      // absorb the sub-pixel remainder in the last column so the two tables never differ by a
      // hair. Only in this branch: when the table OVERFLOWS, `target - total` is negative and
      // subtracting it shrinks the last column instead — measured, that was the last heading
      // still truncating ("Net Cash Flow", "Last Played") after the max-of-header-and-body fix.
      widths[n - 1] += target - total;
    }
    return widths;
  }

  function apply(t, widths){
    var total = 0;
    widths.forEach(function(w){ total += w; });
    [t.headTable, t.table].forEach(function(tb){
      var old = tb.querySelector('colgroup');
      if(old) old.parentNode.removeChild(old);
      var cg = document.createElement('colgroup');
      widths.forEach(function(w){
        var col = document.createElement('col');
        col.style.width = w + 'px';
        cg.appendChild(col);
      });
      tb.insertBefore(cg, tb.firstChild);
      // Declared `!important`: `bo-report-family.css` §14 pins `.report-table{width:100%!important}`
      // and reports.css/legacy add `min-width:100%` / `max-width:100%`, all of which clamp a table
      // whose width is set inline (measured: the head table was forced to 1155 instead of the 1195
      // it was given, so its columns no longer lined up with the body's).
      tb.style.setProperty('table-layout', 'fixed', 'important');
      tb.style.setProperty('width', total + 'px', 'important');
      tb.style.setProperty('min-width', '0', 'important');
      tb.style.setProperty('max-width', 'none', 'important');
    });
  }

  function sync(card){
    var t = tablesOf(card);
    if(!t) return;
    var widths = measure(t);
    if(widths) apply(t, widths);
  }

  function run(){
    if(!eligible()) return;
    var cards = document.querySelectorAll('body.bo-report-family .table-card');
    for(var i = 0; i < cards.length; i++){
      if(headFor(cards[i])) sync(cards[i]);
    }
  }

  var resizeTimer = 0;
  function onResize(){
    if(!eligible()) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      var cards = document.querySelectorAll('body.bo-report-family .table-card');
      for(var i = 0; i < cards.length; i++) sync(cards[i]);
    }, 120);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('resize', onResize);
})();
