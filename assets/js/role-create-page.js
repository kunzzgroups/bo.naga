/* ============================================================================
   Add / Edit Permission Group — the page wrapper.

   Everything else on this page belongs to `access-management.js`, which the family
   already loads on `role.html`: it renders the permission matrix into `#checkList`
   (`renderPermissionGroupsInto`), wires Select All / Clear, and owns the create and
   update paths. Its modal hooks are null-safe, so a PAGE carrying the same ids gets
   all of it without a line of duplicated logic — the only thing this file adds is
   what a page needs that a modal did not:

     · `?roleId=N` puts the page in edit mode. It does that by triggering the same
       `[data-edit-role]` click the listing's own pencil button fires, so the prefill,
       the protected-system-role checks and the save path are the listing's, not a copy.
     · the title and the submit label follow the mode.
     · after a successful save the listing's closeModal() is a no-op here, so this file
       owns the navigation back to the listing.
   ========================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var roleId = params.get('roleId');
  var title = document.getElementById('rcPageTitle');
  var submit = document.getElementById('rcSubmit');
  var trigger = document.getElementById('rcEditTrigger');
  var nameInput = document.getElementById('name');

  if (roleId && title) title.textContent = 'Edit Permission Group';
  if (roleId && submit) submit.innerHTML = '<i class="bi bi-check2"></i> Save Changes';

  /* Edit mode: fire the listing's own edit path once its role cache is loaded. The
     script fills the cache asynchronously, so wait for the trigger to be usable —
     `access-management.js` resolves the role from that cache and returns quietly if
     the id is not there yet. */
  if (roleId && trigger) {
    trigger.setAttribute('data-edit-role', roleId);
    /* Wait for the listing's own cache to be ready — it announces itself by writing
       the (hidden) count badge — then click ONCE. Clicking on a timer fired a second
       openEdit while the first role-menu fetch was in flight, and the later render
       overwrote the selection with an empty set. */
    var badge = document.getElementById('roleCountBadge');
    var waited = 0;
    var arm = function () {
      waited += 150;
      var ready = badge && String(badge.textContent || '').trim().length > 0;
      if (!ready && waited < 6000) { setTimeout(arm, 150); return; }
      trigger.click();
    };
    setTimeout(arm, 150);
  }

  /* A page does not close a modal; it goes back to the listing. The listing's save
     path leaves the form in a saved state, so watch for it and navigate. */
  var form = document.getElementById('accessForm');
  if (form) {
    var goBack = function () {
      var status = document.getElementById('accessStatus');
      var text = status ? String(status.textContent || '') : '';
      if (/success|saved|created|updated/i.test(text)) {
        setTimeout(function () { window.location.href = 'role.html'; }, 700);
        return true;
      }
      return false;
    };
    new MutationObserver(goBack).observe(document.getElementById('accessStatus') || form,
      { childList: true, characterData: true, subtree: true });
  }
})();
