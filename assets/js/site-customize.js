const API_CUSTOMIZE_MAIN_LAYOUT_URL =
    API_CONFIG.BASE_URL +
    API_CONFIG.ENDPOINTS.CUSTOMIZE_MAIN_LAYOUT;

const CUSTOM_IMAGE_VERSION = '1.0.4';

function customImage(filename) {
    return API_CONFIG.ASSET_BASE_URL + filename + '?v=' + CUSTOM_IMAGE_VERSION;
}

function fixAssetUrl(url) {
    if (!url) return '';

    let value = String(url).trim();

    // Fix old saved value from localStorage/API that points to BO domain.
    value = value.replace(
        /^https?:\/\/bo\.corepayx\.com\/assets\/custom\/images\//i,
        API_CONFIG.ASSET_BASE_URL
    );

    // Fix relative paths saved before, because site-customize runs under bo.corepayx.com.
    value = value.replace(
        /^(?:\.\.\/)?(?:naga\/)?assets\/custom\/images\//i,
        API_CONFIG.ASSET_BASE_URL
    );

    value = value.replace(
        /^\/assets\/custom\/images\//i,
        API_CONFIG.ASSET_BASE_URL
    );

    return value.replace(/([^:])\/\/+/g, '$1/');
}

(function () {
    const STORAGE_KEY = 'naga_main_layout_customize_files';

    const assets = [
        { field: 'logoUrl', fileKey: 'logo', label: 'logo', fallback: customImage('logo.png') },
        { field: 'faviconUrl', fileKey: 'favicon', label: 'favicon', fallback: customImage('favicon.png') },
        { field: 'faviconUrl2', fileKey: 'favicon2', label: 'favicon 32x32', fallback: customImage('favicon2.png') },
        { field: 'faviconUrl3', fileKey: 'favicon3', label: 'favicon 180x180', fallback: customImage('favicon3.png') },
        { field: 'pageBackgroundUrl', fileKey: 'background', label: 'background', fallback: customImage('background.jpg'), apiKeys: ['backgroundUrl', 'pageBackgroundUrl', 'background'] },
        { field: 'referralUrl', fileKey: 'referral', label: 'referral', fallback: customImage('referral.png') },
        { field: 'shareUrl', fileKey: 'share', label: 'share', fallback: customImage('share.png') },
        { field: 'downlineUrl', fileKey: 'downline', label: 'downline', fallback: customImage('downline.png') },
        { field: 'copylinkUrl', fileKey: 'copylink', label: 'copy link', fallback: customImage('copylink.png') },
        { field: 'facebookUrl', fileKey: 'facebook', label: 'Facebook', fallback: customImage('facebook.png') },
        { field: 'telegramUrl', fileKey: 'telegram', label: 'Telegram', fallback: customImage('telegram.png') },
        { field: 'loginUrl', fileKey: 'login', label: 'login', fallback: customImage('login.png') },
        { field: 'registerUrl', fileKey: 'register', label: 'register', fallback: customImage('register.png') },
        { field: 'depositUrl', fileKey: 'deposit', label: 'deposit', fallback: customImage('deposit.png') },
        { field: 'withdrawUrl', fileKey: 'withdraw', label: 'withdraw', fallback: customImage('withdraw.png') },
        { field: 'refreshUrl', fileKey: 'refresh', label: 'refresh', fallback: customImage('refresh.png') },
        { field: 'homeUrl', fileKey: 'home', label: 'home', fallback: customImage('home.png') },
        { field: 'historyUrl', fileKey: 'history', label: 'history', fallback: customImage('history.png') },
        { field: 'bonusUrl', fileKey: 'bonus', label: 'bonus', fallback: customImage('bonus.png') },
        { field: 'livechatUrl', fileKey: 'livechat', label: 'live chat', fallback: customImage('livechat.png') },
        { field: 'settingUrl', fileKey: 'setting', label: 'setting', fallback: customImage('setting.png') }
    ];

    const fields = {};
    const selectedFiles = {};
    const fieldToFileKey = {};
    const defaultSettings = { version: '1.0.0' };

    assets.forEach((asset) => {
        fields[asset.field] = document.getElementById(asset.field);
        selectedFiles[asset.fileKey] = null;
        fieldToFileKey[asset.field] = asset.fileKey;
        defaultSettings[asset.field] = asset.fallback;
    });

    if (!fields.logoUrl) return;

    const statusBox = document.getElementById('customizeStatus');
    const saveBtn = document.getElementById('saveCustomizeBtn');

    function setStatus(message, type) {
        if (!statusBox) return;
        statusBox.textContent = message || '';
        statusBox.className = 'custom-status' + (type ? ' ' + type : '');
    }

    function updateAssetText(key, text, selected) {
        const label = document.querySelector('[data-asset-text="' + key + '"]');
        if (!label) return;
        label.textContent = text || 'Current image loaded';
        label.classList.toggle('selected', !!selected);
    }

    function updatePreview(key, url) {
        const img = document.querySelector('[data-preview="' + key + '"]');
        if (!img) return;
        const wrap = img.closest('.asset-preview');
        if (url) {
            img.src = url;
            wrap.classList.add('has-image');
        } else {
            img.removeAttribute('src');
            wrap.classList.remove('has-image');
        }
    }

    function setSettings(settings) {
        const data = Object.assign({}, defaultSettings, settings || {});
        assets.forEach((asset) => {
            const input = fields[asset.field];
            if (!input) return;
            const fixedUrl = fixAssetUrl(data[asset.field] || '');
            input.value = fixedUrl;
            updateAssetText(asset.field, data[asset.field] ? 'Current ' + asset.label + ' uploaded' : 'No ' + asset.label + ' uploaded', false);
            updatePreview(asset.field, fixedUrl);
        });
    }

    function saveLocal(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const next = Object.keys(saved).length ? saved : defaultSettings;
            setSettings(next);
            saveLocal(next);
        } catch (e) {
            setSettings(defaultSettings);
        }
    }

    function normalizeUrl(value) {
        if (!value) return '';
        return String(value).replace(/([^:])\/\/+/g, '$1/');
    }

    function getFirstValue(source, keys) {
        for (const key of keys) {
            if (source && source[key]) return source[key];
        }
        return '';
    }

    function applyApiResponse(json) {
        const data = json && json.data ? json.data : json || {};
        const version = data.version || defaultSettings.version;
        const responseAssets = data.assets || data;
        const next = { version };

        assets.forEach((asset) => {
            const keys = asset.apiKeys || [asset.field, asset.fileKey];
            const fallback = defaultSettings[asset.field].replace('1.0.0', version);
            next[asset.field] = fixAssetUrl(normalizeUrl(getFirstValue(responseAssets, keys) || fallback));
        });

        setSettings(next);
        saveLocal(next);
    }

    function setSaveButtonDefault() {
        if (!saveBtn) return;
        saveBtn.disabled = false;
        saveBtn.classList.remove('success');
        saveBtn.classList.add('primary');
        saveBtn.innerHTML = '<i class="bi bi-save"></i> Save';
    }

    function setSaveButtonSuccess() {
        if (!saveBtn) return;
        saveBtn.disabled = false;
        saveBtn.classList.remove('primary');
        saveBtn.classList.add('success');
        saveBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Saved';
    }


    function isAllowedByInputAccept(file, accept) {
        if (!accept || accept.trim() === '') return true;

        const fileName = (file.name || '').toLowerCase();
        const fileType = (file.type || '').toLowerCase();
        const rules = accept.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);

        return rules.some((rule) => {
            if (rule === '*/*') return true;
            if (rule.endsWith('/*')) return fileType.startsWith(rule.slice(0, -1));
            if (rule.startsWith('.')) return fileName.endsWith(rule);
            return fileType === rule;
        });
    }

    async function saveMainLayout() {
        const formData = new FormData();
        let hasFile = false;
        let isSaved = false;

        Object.keys(selectedFiles).forEach((key) => {
            if (selectedFiles[key]) {
                formData.append(key, selectedFiles[key]);
                hasFile = true;
            }
        });

        if (!hasFile) {
            setStatus('Please choose at least one image before saving.', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.classList.remove('success');
        saveBtn.classList.add('primary');
        saveBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Saving...';

        try {
            const res = await fetch(API_CUSTOMIZE_MAIN_LAYOUT_URL, {
                method: 'POST',
                body: formData
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.message || 'Save failed');
            }

            applyApiResponse(json);

            Object.keys(selectedFiles).forEach((key) => {
                selectedFiles[key] = null;
            });
            document.querySelectorAll('.asset-file').forEach((input) => {
                input.value = '';
            });

            isSaved = true;
            setSaveButtonSuccess();
            setStatus('Saved successfully. Main layout images updated.', 'success');
        } catch (err) {
            setStatus(err.message || 'Save failed. Please check Spring Boot API and CORS.', 'error');
        } finally {
            if (!isSaved) {
                setSaveButtonDefault();
            }
        }
    }

    document.querySelectorAll('.asset-upload-row').forEach((row) => {
        const fieldKey = row.dataset.field;
        const fileKey = fieldToFileKey[fieldKey];
        const fileInput = row.querySelector('.asset-file');
        const chooseBtn = row.querySelector('.choose-btn');
        const clearBtn = row.querySelector('.upload-asset-btn');

        if (!fieldKey || !fileKey || !fileInput || !chooseBtn || !clearBtn) return;

        chooseBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0] || null;
            if (!file) return;

            if (!isAllowedByInputAccept(file, fileInput.accept)) {
                setStatus('This file type is not allowed. Please choose a valid image file.', 'error');
                fileInput.value = '';
                selectedFiles[fileKey] = null;
                return;
            }

            selectedFiles[fileKey] = file;
            updatePreview(fieldKey, URL.createObjectURL(file));
            updateAssetText(fieldKey, file.name + ' selected', true);
            setSaveButtonDefault();
            setStatus(file.name + ' selected. Click Save to upload.', '');
        });

        clearBtn.addEventListener('click', () => {
            selectedFiles[fileKey] = null;
            fileInput.value = '';
            updatePreview(fieldKey, fields[fieldKey].value.trim());
            updateAssetText(fieldKey, 'Current image loaded', false);
            setSaveButtonDefault();
            setStatus('Selected file cleared.', '');
        });
    });

    saveBtn.addEventListener('click', saveMainLayout);
    loadSettings();
})();


(function () {
    const saveBtn = document.getElementById('saveSectionBtn');
    const reloadBtn = document.getElementById('reloadSectionBtn');
    const htmlEditor = document.getElementById('sectionHtmlEditor');
    const cssEditor = document.getElementById('sectionCssEditor');
    const jsEditor = document.getElementById('sectionJsEditor');
    const statusBox = document.getElementById('sectionCustomizeStatus');
    const currentName = document.getElementById('currentSectionName');
    const currentKey = document.getElementById('currentSectionKey');
    const sectionBtns = document.querySelectorAll('.layout-section-item');

    if (!saveBtn || !htmlEditor || !cssEditor || !jsEditor) return;

    const API_CUSTOMIZE_SECTION_URL = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CUSTOMIZE_SECTION;
    let activeSection = document.querySelector('.layout-section-item.active')?.dataset.section || 'right-panel';

    function setStatus(message, type) {
        if (!statusBox) return;
        statusBox.textContent = message || '';
        statusBox.className = 'custom-status' + (type ? ' ' + type : '');
    }

    function updateHeader(button) {
        const label = button ? button.textContent.trim() : activeSection;
        if (currentName) currentName.textContent = label;
        if (currentKey) currentKey.textContent = activeSection;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlightHtml(value) {
        let html = escapeHtml(value);
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-token comment">$1</span>');
        html = html.replace(/(&lt;\/?)([a-zA-Z][\w:-]*)([^&]*?)(\/?&gt;)/g, (match, open, tag, attrs, close) => {
            const coloredAttrs = attrs.replace(/([\w:-]+)(=)("[^"]*"|'[^']*')/g, '<span class="code-token attr">$1</span><span class="code-token operator">$2</span><span class="code-token string">$3</span>');
            return '<span class="code-token tag">' + open + tag + '</span>' + coloredAttrs + '<span class="code-token tag">' + close + '</span>';
        });
        return html;
    }

    function highlightCss(value) {
        let html = escapeHtml(value);
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-token comment">$1</span>');
        html = html.replace(/([^{}]+)(\{)/g, '<span class="code-token selector">$1</span><span class="code-token operator">$2</span>');
        html = html.replace(/([\w-]+)(\s*:)/g, '<span class="code-token property">$1</span><span class="code-token operator">$2</span>');
        html = html.replace(/(:\s*)([^;{}]+)(;?)/g, '$1<span class="code-token value">$2</span><span class="code-token operator">$3</span>');
        html = html.replace(/([{}])/g, '<span class="code-token operator">$1</span>');
        return html;
    }

    function highlightJs(value) {
        let html = escapeHtml(value);
        html = html.replace(/(\/\/.*?$)/gm, '<span class="code-token comment">$1</span>');
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-token comment">$1</span>');
        html = html.replace(/(`[^`]*`|"[^"\n]*"|'[^'\n]*')/g, '<span class="code-token string">$1</span>');
        html = html.replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|new|class|extends|async|await|true|false|null|undefined|document|window)\b/g, '<span class="code-token keyword">$1</span>');
        html = html.replace(/\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, '<span class="code-token function">$1</span>');
        html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-token number">$1</span>');
        return html;
    }

    function updateHighlight(editor) {
        if (!editor) return;
        const wrap = editor.closest('.layout-code-input-wrap');
        const code = wrap?.querySelector('.layout-code-highlight code');
        const lang = editor.closest('.layout-code-editor')?.dataset.editorLang || '';
        if (!code) return;

        let highlighted = escapeHtml(editor.value || '');
        if (lang === 'html') highlighted = highlightHtml(editor.value);
        if (lang === 'css') highlighted = highlightCss(editor.value);
        if (lang === 'js') highlighted = highlightJs(editor.value);

        code.innerHTML = highlighted || ' ';
        const pre = code.closest('.layout-code-highlight');
        if (pre) {
            pre.scrollTop = editor.scrollTop;
            pre.scrollLeft = editor.scrollLeft;
        }
    }

    function updateCodeEditor(editor) {
        if (!editor) return;
        const lineBox = document.querySelector('[data-line-for="' + editor.id + '"]');
        const lineCount = Math.max(1, (editor.value.match(/\n/g) || []).length + 1);
        if (lineBox) {
            lineBox.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
            lineBox.scrollTop = editor.scrollTop;
        }
        updateHighlight(editor);
    }

    function bindLineNumbers(editor) {
        if (!editor) return;
        ['input', 'change', 'keyup'].forEach((eventName) => {
            editor.addEventListener(eventName, () => updateCodeEditor(editor));
        });
        editor.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            event.preventDefault();
            const startPos = editor.selectionStart;
            const endPos = editor.selectionEnd;
            editor.value = editor.value.substring(0, startPos) + '  ' + editor.value.substring(endPos);
            editor.selectionStart = editor.selectionEnd = startPos + 2;
            updateCodeEditor(editor);
        });
        editor.addEventListener('scroll', () => {
            const lineBox = document.querySelector('[data-line-for="' + editor.id + '"]');
            if (lineBox) lineBox.scrollTop = editor.scrollTop;
            const pre = editor.closest('.layout-code-input-wrap')?.querySelector('.layout-code-highlight');
            if (pre) {
                pre.scrollTop = editor.scrollTop;
                pre.scrollLeft = editor.scrollLeft;
            }
        });
        updateCodeEditor(editor);
    }

    function updateAllLineNumbers() {
        [htmlEditor, cssEditor, jsEditor].forEach(updateCodeEditor);
    }

    function setEditors(data) {
        htmlEditor.value = data?.html || '';
        cssEditor.value = data?.css || '';
        jsEditor.value = data?.js || '';
        updateAllLineNumbers();
    }

    async function loadSection(sectionKey) {
        setStatus('Loading section...', '');
        try {
            const res = await fetch(API_CUSTOMIZE_SECTION_URL + '?key=' + encodeURIComponent(sectionKey) + '&v=' + Date.now());
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Load failed');
            setEditors(json.data || {});
            setStatus('Latest active files loaded.', 'success');
        } catch (err) {
            setEditors({});
            setStatus(err.message || 'Load failed. Section files may not exist yet.', 'error');
        }
    }

    async function saveSection() {
        const payload = new URLSearchParams();
        payload.append('key', activeSection);
        payload.append('html', htmlEditor.value || '');
        payload.append('css', cssEditor.value || '');
        payload.append('js', jsEditor.value || '');

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Saving...';
        setStatus('Saving section files...', '');

        try {
            const res = await fetch(API_CUSTOMIZE_SECTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: payload.toString()
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message || 'Save failed');
            setStatus('Saved. Old active files were backed up as draft files.', 'success');
        } catch (err) {
            setStatus(err.message || 'Save failed. Please check Spring Boot API.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-save"></i> Save Section';
        }
    }

    document.querySelectorAll('.custom-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.custom-tab').forEach((item) => item.classList.remove('active'));
            document.querySelectorAll('.custom-tab-panel').forEach((panel) => panel.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add('active');
            if (btn.dataset.tab === 'layout-sections') loadSection(activeSection);
        });
    });

    sectionBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            sectionBtns.forEach((item) => item.classList.remove('active'));
            btn.classList.add('active');
            activeSection = btn.dataset.section;
            updateHeader(btn);
            loadSection(activeSection);
        });
    });

    [htmlEditor, cssEditor, jsEditor].forEach(bindLineNumbers);
    reloadBtn?.addEventListener('click', () => loadSection(activeSection));
    saveBtn.addEventListener('click', saveSection);
    updateHeader(document.querySelector('.layout-section-item.active'));
    loadSection(activeSection);
})();
