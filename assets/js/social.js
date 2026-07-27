(function () {
  'use strict';

  function endpoint(key) {
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key];
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function uploadUrl(value) {
    if (!value) return '';
    var path = String(value).trim();
    if (/^https?:\/\//i.test(path)) return path;
    if (/^(?:\.\/|\.\.\/|\/)?assets\/custom\/images\//i.test(path)) {
      var customBase = String(API_CONFIG.CUSTOM_ASSET_BASE_URL || 'https://titanxgaming.com/assets/custom/images').replace(/\/$/, '');
      var filePart = path.replace(/^.*?assets\/custom\/images\//i, '');
      return customBase + '/' + filePart;
    }
    if (/^(?:\.\/|\.\.\/|\/)?assets\//i.test(path)) return path;

    var base = String(API_CONFIG.STATIC_UPLOAD_BASE_URL || 'https://static.titanxgaming.com').replace(/\/$/, '');
    if (path.indexOf('/uploads/') === 0) return base + path;
    if (path.indexOf('uploads/') === 0) return base + '/' + path;
    return base + '/uploads/social/' + path.replace(/^\/+/, '');
  }

  async function api(url, options) {
    var opts = options || {};
    opts.headers = Object.assign({}, BO_AUTH.authHeader(), opts.headers || {});
    var response = await fetch(url, opts);
    var json = await response.json().catch(function () { return {}; });
    if (!response.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }

  function formatDate(value) {
    return window.BO_FORMAT && BO_FORMAT.dateTime ? BO_FORMAT.dateTime(value) : (value || '-');
  }

  async function load() {
    var body = document.getElementById('socialBody');
    var info = document.getElementById('socialTableInfo');
    body.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    try {
      var json = await api(endpoint('SOCIAL_LIST'));
      var rows = (json.data && json.data.content) || [];
      if (info) info.textContent = rows.length + ' social link' + (rows.length === 1 ? '' : 's');

      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="4">No social link found.</td></tr>';
        return;
      }

      body.innerHTML = rows.map(function (row) {
        var image = uploadUrl(row.image);
        var serialized = escapeHtml(JSON.stringify(row));
        return '<tr>' +
          '<td><div class="social-thumb-wrap"><img src="' + escapeHtml(image) + '" alt="Social image" loading="lazy"></div></td>' +
          '<td class="social-url-cell"><a href="' + escapeHtml(row.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(row.url) + '</a></td>' +
          '<td>' + escapeHtml(formatDate(row.updatedAt || row.createdAt)) + '</td>' +
          '<td><button class="clean-btn social-icon-btn primary" title="Edit" data-social-edit="' + serialized + '"><i class="bi bi-pencil"></i></button> ' +
          '<button class="clean-btn social-icon-btn danger" title="Delete" data-social-delete="' + escapeHtml(row.id) + '"><i class="bi bi-trash"></i></button></td>' +
          '</tr>';
      }).join('');
    } catch (error) {
      if (info) info.textContent = 'Unable to load social links';
      body.innerHTML = '<tr><td colspan="4" class="text-danger">' + escapeHtml(error.message) + '</td></tr>';
    }
  }

  function setValue(id, value) {
    var element = document.getElementById(id);
    if (element) element.value = value == null ? '' : value;
  }

  function openModal() {
    document.getElementById('socialModal')?.classList.add('show');
  }

  function closeModal() {
    document.getElementById('socialModal')?.classList.remove('show');
  }

  function showPreview(image) {
    var wrap = document.getElementById('socialCurrentPreview');
    var img = document.getElementById('socialPreviewImage');
    if (!wrap || !img) return;

    var source = uploadUrl(image);
    wrap.hidden = !source;
    if (!source) {
      img.removeAttribute('src');
      return;
    }
    img.src = source;
  }

  function resetForm(close) {
    document.getElementById('socialForm')?.reset();
    setValue('socialId', '');
    document.getElementById('socialFormTitle').textContent = 'Create Social Link';
    document.getElementById('socialSubmitBtn').textContent = 'Create Social Link';
    document.getElementById('socialFileName').textContent = 'No new image selected.';
    showPreview('');
    if (close !== false) closeModal();
  }

  function edit(row) {
    setValue('socialId', row.id);
    setValue('socialUrl', row.url);
    document.getElementById('socialFormTitle').textContent = 'Edit Social Link #' + row.id;
    document.getElementById('socialSubmitBtn').textContent = 'Save Changes';
    document.getElementById('socialFileName').textContent = 'Choose a new image only when replacing the current one.';
    showPreview(row.image);
    openModal();
  }

  async function save(event) {
    event.preventDefault();
    var id = document.getElementById('socialId').value.trim();
    var url = document.getElementById('socialUrl').value.trim();
    var image = document.getElementById('socialImage').files[0];

    if (!/^https?:\/\//i.test(url)) {
      alert('URL must start with http:// or https://');
      return;
    }
    if (!id && !image) {
      alert('Please choose a social image.');
      return;
    }

    var formData = new FormData();
    if (id) formData.append('id', id);
    formData.append('url', url);
    if (image) formData.append('image', image);

    var submit = document.getElementById('socialSubmitBtn');
    submit.disabled = true;
    try {
      var json = await api(endpoint('SOCIAL_SAVE'), { method: 'POST', body: formData });
      alert(json.message || 'Social link saved');
      resetForm(true);
      await load();
    } catch (error) {
      alert(error.message || 'Save failed');
    } finally {
      submit.disabled = false;
    }
  }

  async function remove(id) {
    if (!(await BO_DIALOG.confirm('Delete this social link?', { title: 'Delete Social Link', confirmText: 'Delete' }))) return;
    try {
      var json = await api(endpoint('SOCIAL_DELETE') + '/' + encodeURIComponent(id), { method: 'POST' });
      alert(json.message || 'Social link deleted');
      await load();
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  }

  document.addEventListener('click', function (event) {
    var editButton = event.target.closest('[data-social-edit]');
    if (editButton) edit(JSON.parse(editButton.dataset.socialEdit));

    var deleteButton = event.target.closest('[data-social-delete]');
    if (deleteButton) remove(deleteButton.dataset.socialDelete);
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('socialForm')?.addEventListener('submit', save);
    document.getElementById('socialReset')?.addEventListener('click', function () { resetForm(true); });
    document.getElementById('socialRefresh')?.addEventListener('click', load);
    document.getElementById('socialOpenCreate')?.addEventListener('click', function () { resetForm(false); openModal(); });
    document.querySelectorAll('[data-social-close]').forEach(function (button) { button.addEventListener('click', closeModal); });
    document.getElementById('socialModal')?.addEventListener('click', function (event) { if (event.target.id === 'socialModal') closeModal(); });
    document.getElementById('socialImage')?.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      document.getElementById('socialFileName').textContent = file ? file.name : 'No new image selected.';
      if (file) {
        var reader = new FileReader();
        reader.onload = function () {
          var wrap = document.getElementById('socialCurrentPreview');
          var img = document.getElementById('socialPreviewImage');
          wrap.hidden = false;
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });
    load();
  });
})();
