/* ============================================================================
   Create Admin — the Access Control family's create flow as a PAGE.

   It was a modal on `admin-user.html`. Two things were wrong with it and both are
   answered by the house's own create-page anatomy (`main-admin-create.html`, whose
   `.mac-*` rules this page inherits by carrying `main-admin-create-page`):

     · the password eye buttons rendered OUTSIDE their fields (the modal's markup had
       no pass-wrap) — here each password sits in `.mad-pass-wrap` with its `.mad-eye`
       inside it, the way the reference does it;
     · the action row was two amber buttons — here it is a Ghost Cancel link and one
       amber Primary, the locked Create/Edit Admin footer.

   This script owns only what the page needs: fill the Role / Brand / Permission-group
   selects from the same endpoints the modal used, wire the password reveals, validate,
   POST to the same endpoint, then return to the listing.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('createAdminForm');
  if (!form) return;
  var status = document.getElementById('createAdminStatus');
  var submit = document.getElementById('createAdminBtn');
  var remark = document.getElementById('newAdminRemark');
  var remarkCount = document.getElementById('newAdminRemarkCount');

  function say(msg, kind) {
    if (!status) return;
    status.textContent = msg || '';
    status.classList.remove('is-success', 'is-error');
    if (kind === 'success') status.classList.add('is-success');
    if (kind === 'error') status.classList.add('is-error');
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function fill(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- options: the same sources the modal used ------------------------- */
  async function loadRoles(brandId) {
    try {
      var user = (window.BO_AUTH && BO_AUTH.user()) || {};
      var headers = Object.assign({}, BO_AUTH.authHeader());
      if (brandId) headers['X-Brand-Id'] = String(brandId);
      var res = await fetch(BO_AUTH.roleListUrl(), { headers: headers });
      var json = await res.json().catch(function () { return {}; });
      var rows = Array.isArray(json.data) ? json.data : [];
      if (user.rootAdmin) {
        rows = brandId
          ? rows.filter(function (r) { return Number(r.brandId) === Number(brandId) && ['MASTER', 'ROOT'].indexOf(String(r.roleType || '').toUpperCase()) === -1; })
          : rows.filter(function (r) { return r.brandId == null && String(r.roleType || '').toUpperCase() === 'MASTER'; });
      } else {
        rows = rows.filter(function (r) { return ['MASTER', 'ROOT'].indexOf(String(r.roleType || 'CUSTOM').toUpperCase()) === -1; });
      }
      var html = rows.map(function (r) {
        return '<option value="' + esc(r.id) + '">' + esc(r.name || r.code) + (r.roleType === 'BRAND_OWNER' ? ' (Owner)' : '') + '</option>';
      }).join('') || '<option value="">No role available for this selection</option>';
      fill('newAdminRole', '<option value="">Select role</option>' + html);
      fill('newAdminPermissionGroup', '<option value="">Select permission group</option>' + html);
    } catch (e) {
      fill('newAdminRole', '<option value="">Unable to load roles</option>');
      fill('newAdminPermissionGroup', '<option value="">Select permission group</option>');
    }
  }

  async function loadBrands() {
    var sel = document.getElementById('newAdminBrand');
    if (!sel) return;
    var user = (window.BO_AUTH && BO_AUTH.user()) || {};
    if (!user.masterAdmin) {
      var bid = user.brandId || '';
      sel.innerHTML = '<option value="' + esc(bid) + '">Current Branding' + (bid ? ' (#' + esc(bid) + ')' : '') + '</option>';
      sel.disabled = true;
      await loadRoles(bid);
      return;
    }
    try {
      var res = await fetch(API_CONFIG.BASE_URL + (API_CONFIG.ENDPOINTS.BRAND_LIST || '/admin/brands'),
        { headers: Object.assign({}, BO_AUTH.authHeader()) });
      var json = await res.json().catch(function () { return {}; });
      var rows = Array.isArray(json.data) ? json.data : [];
      sel.innerHTML = '<option value="">Select branding scope</option>' +
        rows.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name || x.code) + ' (#' + esc(x.id) + ')</option>'; }).join('');
      await loadRoles(sel.value ? Number(sel.value) : (user.rootAdmin ? null : (window.BO_BRAND && BO_BRAND.activeId ? BO_BRAND.activeId() : null)));
    } catch (e) {
      await loadRoles(null);
    }
  }

  /* ---- password reveals, inside the field they belong to ---------------- */
  document.querySelectorAll('[data-pass-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-pass-toggle'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      var icon = btn.querySelector('i');
      if (icon) icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  });

  if (remark && remarkCount) {
    var count = function () { remarkCount.textContent = remark.value.length + '/200'; };
    remark.addEventListener('input', count);
    count();
  }

  var brandSel = document.getElementById('newAdminBrand');
  if (brandSel) brandSel.addEventListener('change', function () { loadRoles(brandSel.value ? Number(brandSel.value) : null); });


  /* ---- EDIT MODE (?id=N) ------------------------------------------------
     Same page, same fields: the modal handled both, so the page does too — the
     only differences are the title/labels, an optional password, and the endpoint.
     The row's values come from the list the listing itself uses (a page has no
     `data-row` button to read). */
  var editId = new URLSearchParams(window.location.search).get('id') || '';
  var heading = document.querySelector('.user-title-wrap h1');
  var passLabel = document.querySelector('label[for]') && null;
  if (editId) {
    if (heading) heading.textContent = 'Edit Admin';
    if (submit) submit.innerHTML = '<i class="bi bi-check2"></i> Save Changes';
    var pwField = document.getElementById('newAdminPassword');
    if (pwField && pwField.closest('.mac-field')) {
      var lab = pwField.closest('.mac-field').querySelector('.mac-label');
      if (lab) lab.textContent = 'New Password';
      var hint = document.getElementById('newAdminPasswordHelp');
      if (hint) hint.hidden = false;              /* a plain <small>, the reference's own construct */
      pwField.removeAttribute('required');
    }
    var cfField = document.getElementById('newAdminConfirmPassword');
    if (cfField && cfField.closest('.mac-field')) {
      var lab2 = cfField.closest('.mac-field').querySelector('.mac-label');
      if (lab2) lab2.innerHTML = 'Confirm New Password';
    }
  }

  async function prefill() {
    if (!editId) return;
    try {
      await bootReady;                       /* the option lists must exist before choosing from them */
      var res = await fetch(apiJsonUrl(), { headers: Object.assign({}, BO_AUTH.authHeader()) });
      var json = await res.json().catch(function () { return {}; });
      var rows = Array.isArray(json.data) ? json.data : [];
      var row = rows.filter(function (r) { return String(r.id) === String(editId); })[0];
      if (!row) { say('That admin could not be found.', 'error'); return; }
      var set = function (id, v) { var el = document.getElementById(id); if (el) el.value = v == null ? '' : String(v); };
      set('newAdminUsername', row.username);
      set('newAdminDisplayName', row.displayName || row.username);
      set('newAdminStatus', row.status == null ? 1 : row.status);
      if (row.brandId) await loadRoles(Number(row.brandId));   /* a record in another brand re-filters the roles */
      set('newAdminBrand', row.brandId == null ? '' : row.brandId);
      set('newAdminRole', row.roleId);
      var st = document.getElementById('newAdminStatus');
      if (st) st.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { say('Unable to load this admin: ' + (e.message || e), 'error'); }
  }
  function apiJsonUrl() {
    return (window.API_CONFIG ? API_CONFIG.BASE_URL + (API_CONFIG.ENDPOINTS.AUTH_ADMIN_LIST || '/auth/admin/list')
                              : '/auth/admin/list');
  }
  /* Order matters. The brand and role option lists are fetched asynchronously and prefill()
     selects from them, so the bootstrap starts FIRST and prefill waits on it. Started the other
     way round (prefill first, `loadBrands()` at the end of the IIFE), the bootstrap's own
     `loadRoles()` landed after prefill had chosen a role, re-filled the select, and reset the
     choice to the first option - silently wrong until this design's "Select role" placeholder
     made an unselected state visible. */
  var bootReady = loadBrands();
  prefill();

  /* ---- submit: same endpoint and payload as the modal ------------------- */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var pass = val('newAdminPassword');
    var confirm = val('newAdminConfirmPassword');
    if (!val('newAdminUsername')) { say('Username is required.', 'error'); return; }
    if (!val('newAdminDisplayName')) { say('Display name is required.', 'error'); return; }
    if (!pass && !editId) { say('Password is required.', 'error'); return; }
    if (pass && pass !== confirm) { say('Confirm password does not match.', 'error'); return; }

    if (editId) {
      if (submit) submit.disabled = true;
      say('Saving admin…', '');
      try {
        var brandEl2 = document.getElementById('newAdminBrand');
        var res2 = await fetch(BO_AUTH.adminUpdateUrl(editId), {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, BO_AUTH.authHeader()),
          body: JSON.stringify({
            username: val('newAdminUsername'),
            displayName: val('newAdminDisplayName'),
            status: Number(val('newAdminStatus') || 1),
            roleId: val('newAdminRole') ? Number(val('newAdminRole')) : null,
            brandId: brandEl2 && brandEl2.value ? Number(brandEl2.value) : null,
            password: pass
          })
        });
        var json2 = await res2.json().catch(function () { return {}; });
        if (!res2.ok || json2.status === 'error') throw new Error(json2.message || 'Update admin failed');
        say(json2.message || 'Admin updated successfully', 'success');
        setTimeout(function () { window.location.href = 'admin-user.html'; }, 700);
      } catch (err2) {
        say(err2.message || 'Update admin failed', 'error');
      } finally {
        if (submit) submit.disabled = false;
      }
      return;
    }

    var user = (window.BO_AUTH && BO_AUTH.user()) || {};
    var brandEl = document.getElementById('newAdminBrand');
    if (!val('newAdminRole')) {
      say(user.rootAdmin && (!brandEl || !brandEl.value)
        ? 'Please select the Master account option to create a platform-level role.'
        : 'Please select a role.', 'error');
      return;
    }
    if (submit) submit.disabled = true;
    say('Creating admin…', '');
    try {
      var res = await fetch(BO_AUTH.adminCreateUrl ? BO_AUTH.adminCreateUrl()
        : (API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH_ADMIN_CREATE), {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, BO_AUTH.authHeader()),
        body: JSON.stringify({
          username: val('newAdminUsername'),
          displayName: val('newAdminDisplayName'),
          password: pass,
          status: Number(val('newAdminStatus') || 1),
          roleId: val('newAdminRole') ? Number(val('newAdminRole')) : null,
          brandId: brandEl && brandEl.value ? Number(brandEl.value) : null,
          remark: val('newAdminRemark')
        })
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok || json.status === 'error') throw new Error(json.message || 'Create admin failed');
      say(json.message || 'Admin created successfully', 'success');
      setTimeout(function () { window.location.href = 'admin-user.html'; }, 700);
    } catch (err) {
      say(err.message || 'Create admin failed', 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

})();
