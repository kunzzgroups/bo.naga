/* BO loading guard - a page must not claim "no data" while its data is still on the way.

   Most list pages ship a static footer ("Showing 0 to 0 of 0 entries") and some draw an empty-state ("No games found") before their first API
   request returns - on a slow API that is several seconds of a page that looks empty. While the page's own first requests are in flight this
   script marks those two things with a class: the footer text is blanked, an empty-state block is hidden. Nothing in the DOM is
   rewritten; when the requests settle (or after a hard cap) the classes come off and the page's real state shows.

   The phase starts when a page loads and when the SPA router is about to swap one in (bo:spa:before). It ends 700ms after the last in-flight
   /api/ request settles, or after 25s. Requests made outside that window (polling, clicks) never turn it back on.
   Switch off: localStorage.bo_loading_guard = '0'. */
(function () {
  'use strict';
  if (window.__boLoadingGuard) return;
  window.__boLoadingGuard = true;
  try { if (localStorage.getItem('bo_loading_guard') === '0') return; } catch (e) {}

  var IDLE_MS = 700, HARD_MS = 25000;
  var pending = 0, phase = false, idleTimer = 0, hardTimer = 0, queued = false, observer = null, root = null;
  var marked = [];
  var FOOTER_SEL = '.table-info, .mad-footer-info, .bo-pagination-info, [id$="ShowingText"], [id$="PageInfo"]';
  var EMPTY_SEL = '.slider-empty, .empty-state, .bo-empty, .table-empty, .empty-row, td[colspan], .empty';
  var FOOTER_TXT = /^\s*showing\s+0\s+to\s+0\s+of\s+0\s+entr(y|ies)\s*$/i;
  var EMPTY_TXT = /(\bno\s+[\w\s\/&.,'-]{0,50}?\s+(found|available|records?|data|yet)\b|\bnothing\s+(to|found)\b|\bno\s+results?\b|create\s+your\s+first)/i;

  function mark(el, cls) {
    if (el.classList.contains(cls)) return;
    el.classList.add(cls);
    marked.push([el, cls]);
  }

  function scan() {
    queued = false;
    if (!phase) return;
    var scope = document.querySelector('.report-content') || document.body;
    Array.prototype.forEach.call(scope.querySelectorAll(FOOTER_SEL), function (el) {
      if (FOOTER_TXT.test(el.textContent || '')) mark(el, 'bo-ld-text');
    });
    Array.prototype.forEach.call(scope.querySelectorAll(EMPTY_SEL), function (el) {
      if (el.offsetParent === null) return;
      var t = el.textContent || '';
      if (t.length > 160 || !EMPTY_TXT.test(t)) return;
      mark(el, el.tagName === 'TD' || el.tagName === 'TR' ? 'bo-ld-text' : 'bo-ld-hide');
    });
  }

  function queue() {
    if (queued || !phase) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(scan);
  }

  function release() {
    marked.forEach(function (m) { try { m[0].classList.remove(m[1]); } catch (e) {} });
    marked = [];
  }

  function endPhase() {
    phase = false;
    clearTimeout(idleTimer); clearTimeout(hardTimer);
    if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
    release();
  }

  function watchIdle() {
    clearTimeout(idleTimer);
    if (phase && pending === 0) idleTimer = setTimeout(endPhase, IDLE_MS);
  }

  function startPhase() {
    if (phase) endPhase();
    phase = true;
    clearTimeout(hardTimer);
    hardTimer = setTimeout(endPhase, HARD_MS);
    var attach = function () {
      if (!phase) return;
      root = document.querySelector('.report-content') || document.body;
      try {
        observer = new MutationObserver(queue);
        observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
      } catch (e) {}
      queue();
      watchIdle();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    else attach();
  }

  // Count in-flight /api/ requests. The same promise goes back to the caller; ours is a side branch.
  var f0 = window.fetch;
  if (typeof f0 === 'function') {
    window.fetch = function (input) {
      var url = '';
      try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch (e) {}
      var p = f0.apply(this, arguments);
      if (phase && String(url).indexOf('/api/') >= 0) {
        pending++;
        clearTimeout(idleTimer);
        var done = function () { pending = Math.max(0, pending - 1); watchIdle(); };
        p.then(done, done);
      }
      return p;
    };
  }

  document.addEventListener('bo:spa:before', startPhase);
  startPhase();
})();
