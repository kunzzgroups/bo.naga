/**
 * Brand Assets layout map — change `zone` to move an asset between
 * Website Top / Left / Right / Bottom without editing HTML.
 *
 * Example: move Main Logo to Left → set zone: 'left' on the logo slot.
 */
(function (global) {
  const FILE_ACCEPT =
    '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

  const ZONES = [
    {
      id: 'website-top',
      title: 'Website Top',
      desc: 'Logo, favicon, login & register',
    },
    {
      id: 'left',
      title: 'Left',
      desc: 'Referral, share, downline & copy link',
    },
    {
      id: 'right',
      title: 'Right',
      desc: 'Deposit, withdraw, refresh & providers',
    },
    {
      id: 'bottom',
      title: 'Bottom',
      desc: 'Page backgrounds & bottom navigation',
    },
  ];

  /** @type {Array<{
   *   id: string,
   *   zone: 'website-top'|'left'|'right'|'bottom',
   *   label: string,
   *   preview?: 'favicon'|'bg'|'',
   *   hint?: string,
   *   shared?: boolean,
   *   en?: { field: string, fileKey: string, label: string, fallbackFile?: string, apiKeys?: string[] },
   *   zh?: { field: string, fileKey: string, label: string, fallbackFile?: string, apiKeys?: string[] },
   *   my?: { field: string, fileKey: string, label: string, fallbackFile?: string, apiKeys?: string[] },
   *   all?: { field: string, fileKey: string, label: string, fallbackFile?: string, apiKeys?: string[] },
   * }>} */
  const SLOTS = [
    {
      id: 'logo',
      zone: 'website-top',
      label: 'Main Logo',
      en: { field: 'logoUrl', fileKey: 'logo', label: 'logo', fallbackFile: 'logo.png' },
      zh: { field: 'logoUrlZh', fileKey: 'logoZh', label: 'logo' },
      my: { field: 'logoUrlMy', fileKey: 'logoMy', label: 'logo' },
    },
    {
      id: 'favicon16',
      zone: 'website-top',
      label: 'Favicon 16x16',
      preview: 'favicon',
      en: { field: 'faviconUrl', fileKey: 'favicon', label: 'favicon', fallbackFile: 'favicon.png' },
      zh: { field: 'faviconUrlZh', fileKey: 'faviconZh', label: 'favicon' },
      my: { field: 'faviconUrlMy', fileKey: 'faviconMy', label: 'favicon' },
    },
    {
      id: 'favicon32',
      zone: 'website-top',
      label: 'Favicon 32x32',
      preview: 'favicon',
      en: { field: 'faviconUrl2', fileKey: 'favicon2', label: 'favicon 32x32', fallbackFile: 'favicon2.png' },
      zh: { field: 'faviconUrl2Zh', fileKey: 'favicon2Zh', label: 'favicon 32x32' },
      my: { field: 'faviconUrl2My', fileKey: 'favicon2My', label: 'favicon 32x32' },
    },
    {
      id: 'favicon180',
      zone: 'website-top',
      label: 'Favicon 180x180',
      preview: 'favicon',
      en: { field: 'faviconUrl3', fileKey: 'favicon3', label: 'favicon 180x180', fallbackFile: 'favicon3.png' },
      zh: { field: 'faviconUrl3Zh', fileKey: 'favicon3Zh', label: 'favicon 180x180' },
      my: { field: 'faviconUrl3My', fileKey: 'favicon3My', label: 'favicon 180x180' },
    },
    {
      id: 'login',
      zone: 'website-top',
      label: 'Login Button / Image',
      en: { field: 'loginUrl', fileKey: 'login', label: 'login', fallbackFile: 'login.gif' },
      zh: { field: 'loginUrlZh', fileKey: 'loginZh', label: 'login' },
      my: { field: 'loginUrlMy', fileKey: 'loginMy', label: 'login' },
    },
    {
      id: 'register',
      zone: 'website-top',
      label: 'Register Button / Image',
      en: { field: 'registerUrl', fileKey: 'register', label: 'register', fallbackFile: 'register.gif' },
      zh: { field: 'registerUrlZh', fileKey: 'registerZh', label: 'register' },
      my: { field: 'registerUrlMy', fileKey: 'registerMy', label: 'register' },
    },
    {
      id: 'referral',
      zone: 'left',
      label: 'Referral Icon / Image',
      en: { field: 'referralUrl', fileKey: 'referral', label: 'referral', fallbackFile: 'referral.png' },
      zh: { field: 'referralUrlZh', fileKey: 'referralZh', label: 'referral' },
      my: { field: 'referralUrlMy', fileKey: 'referralMy', label: 'referral' },
    },
    {
      id: 'share',
      zone: 'left',
      label: 'Share Icon / Image',
      en: { field: 'shareUrl', fileKey: 'share', label: 'share', fallbackFile: 'share.png' },
      zh: { field: 'shareUrlZh', fileKey: 'shareZh', label: 'share' },
      my: { field: 'shareUrlMy', fileKey: 'shareMy', label: 'share' },
    },
    {
      id: 'downline',
      zone: 'left',
      label: 'Downline Icon / Image',
      en: { field: 'downlineUrl', fileKey: 'downline', label: 'downline', fallbackFile: 'downline.png' },
      zh: { field: 'downlineUrlZh', fileKey: 'downlineZh', label: 'downline' },
      my: { field: 'downlineUrlMy', fileKey: 'downlineMy', label: 'downline' },
    },
    {
      id: 'copylink',
      zone: 'left',
      label: 'Copy Link Icon / Image',
      en: { field: 'copylinkUrl', fileKey: 'copylink', label: 'copy link', fallbackFile: 'copylink.png' },
      zh: { field: 'copylinkUrlZh', fileKey: 'copylinkZh', label: 'copy link' },
      my: { field: 'copylinkUrlMy', fileKey: 'copylinkMy', label: 'copy link' },
    },
    {
      id: 'deposit',
      zone: 'right',
      label: 'Deposit Button / Image',
      en: { field: 'depositUrl', fileKey: 'deposit', label: 'deposit', fallbackFile: 'deposit.png' },
      zh: { field: 'depositUrlZh', fileKey: 'depositZh', label: 'deposit' },
      my: { field: 'depositUrlMy', fileKey: 'depositMy', label: 'deposit' },
    },
    {
      id: 'withdraw',
      zone: 'right',
      label: 'Withdraw Button / Image',
      en: { field: 'withdrawUrl', fileKey: 'withdraw', label: 'withdraw', fallbackFile: 'withdraw.png' },
      zh: { field: 'withdrawUrlZh', fileKey: 'withdrawZh', label: 'withdraw' },
      my: { field: 'withdrawUrlMy', fileKey: 'withdrawMy', label: 'withdraw' },
    },
    {
      id: 'refresh',
      zone: 'right',
      label: 'Refresh Button / Image',
      en: { field: 'refreshUrl', fileKey: 'refresh', label: 'refresh', fallbackFile: 'refresh.png' },
      zh: { field: 'refreshUrlZh', fileKey: 'refreshZh', label: 'refresh' },
      my: { field: 'refreshUrlMy', fileKey: 'refreshMy', label: 'refresh' },
    },
    {
      id: 'providerAll',
      zone: 'right',
      label: 'All Provider Image',
      shared: true,
      all: {
        field: 'providerAllUrl',
        fileKey: 'providerAll',
        label: 'All provider image',
        apiKeys: ['providerAllUrl', 'providerAll'],
      },
    },
    {
      id: 'pageBackground',
      zone: 'bottom',
      label: 'Desktop Page Background',
      preview: 'bg',
      en: {
        field: 'pageBackgroundUrl',
        fileKey: 'background',
        label: 'background',
        fallbackFile: 'background.png',
        apiKeys: ['backgroundUrl', 'pageBackgroundUrl', 'background'],
      },
      zh: { field: 'pageBackgroundUrlZh', fileKey: 'backgroundZh', label: 'background' },
      my: { field: 'pageBackgroundUrlMy', fileKey: 'backgroundMy', label: 'background' },
    },
    {
      id: 'mobileBackground',
      zone: 'bottom',
      label: 'Mobile Page Background',
      preview: 'bg',
      shared: true,
      hint: 'Used on frontend screens up to 900px wide. If empty, the desktop background is used automatically.',
      all: {
        field: 'mobileBackgroundUrl',
        fileKey: 'mobileBackground',
        label: 'mobile background',
        apiKeys: ['mobileBackgroundUrl', 'mobileBackground'],
      },
    },
    {
      id: 'home',
      zone: 'bottom',
      label: 'Bottom Nav Home',
      en: { field: 'homeUrl', fileKey: 'home', label: 'home', fallbackFile: 'home.png' },
      zh: { field: 'homeUrlZh', fileKey: 'homeZh', label: 'home' },
      my: { field: 'homeUrlMy', fileKey: 'homeMy', label: 'home' },
    },
    {
      id: 'history',
      zone: 'bottom',
      label: 'Bottom Nav History',
      en: { field: 'historyUrl', fileKey: 'history', label: 'history', fallbackFile: 'history.png' },
      zh: { field: 'historyUrlZh', fileKey: 'historyZh', label: 'history' },
      my: { field: 'historyUrlMy', fileKey: 'historyMy', label: 'history' },
    },
    {
      id: 'bonus',
      zone: 'bottom',
      label: 'Bottom Nav Bonus',
      en: { field: 'bonusUrl', fileKey: 'bonus', label: 'bonus', fallbackFile: 'bonus.png' },
      zh: { field: 'bonusUrlZh', fileKey: 'bonusZh', label: 'bonus' },
      my: { field: 'bonusUrlMy', fileKey: 'bonusMy', label: 'bonus' },
    },
    {
      id: 'livechat',
      zone: 'bottom',
      label: 'Bottom Nav Live Chat',
      en: { field: 'livechatUrl', fileKey: 'livechat', label: 'live chat', fallbackFile: 'livechat.png' },
      zh: { field: 'livechatUrlZh', fileKey: 'livechatZh', label: 'live chat' },
      my: { field: 'livechatUrlMy', fileKey: 'livechatMy', label: 'live chat' },
    },
    {
      id: 'setting',
      zone: 'bottom',
      label: 'Bottom Nav Setting',
      en: { field: 'settingUrl', fileKey: 'setting', label: 'setting', fallbackFile: 'setting.png' },
      zh: { field: 'settingUrlZh', fileKey: 'settingZh', label: 'setting' },
      my: { field: 'settingUrlMy', fileKey: 'settingMy', label: 'setting' },
    },
  ];

  const DEFAULT_SLOTS = SLOTS.map((s) => Object.assign({}, s));
  let workingSlots = DEFAULT_SLOTS.map((s) => Object.assign({}, s));

  function placementKey(brandId) {
    return 'naga_brand_asset_placement:' + (brandId || 1);
  }

  function cloneSlots(list) {
    return list.map((s) => Object.assign({}, s));
  }

  function loadPlacement(brandId) {
    workingSlots = cloneSlots(DEFAULT_SLOTS);
    try {
      const raw = localStorage.getItem(placementKey(brandId));
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.length) return;
      const byId = new Map(workingSlots.map((s) => [s.id, s]));
      const next = [];
      saved.forEach((item) => {
        const slot = byId.get(item.id);
        if (!slot) return;
        if (item.zone) slot.zone = item.zone;
        next.push(slot);
        byId.delete(item.id);
      });
      byId.forEach((slot) => next.push(slot));
      workingSlots = next;
    } catch (e) {
      workingSlots = cloneSlots(DEFAULT_SLOTS);
    }
  }

  function savePlacement(brandId) {
    const payload = workingSlots.map((s) => ({ id: s.id, zone: s.zone }));
    localStorage.setItem(placementKey(brandId), JSON.stringify(payload));
  }

  function resetPlacement(brandId) {
    workingSlots = cloneSlots(DEFAULT_SLOTS);
    localStorage.removeItem(placementKey(brandId));
  }

  function moveSlot(slotId, toZone, beforeSlotId) {
    const fromIndex = workingSlots.findIndex((s) => s.id === slotId);
    if (fromIndex < 0) return false;
    const [slot] = workingSlots.splice(fromIndex, 1);
    slot.zone = toZone;

    let insertAt = workingSlots.length;
    if (beforeSlotId) {
      const beforeIndex = workingSlots.findIndex((s) => s.id === beforeSlotId);
      if (beforeIndex >= 0) insertAt = beforeIndex;
    } else {
      let lastInZone = -1;
      workingSlots.forEach((s, i) => {
        if (s.zone === toZone) lastInZone = i;
      });
      insertAt = lastInZone >= 0 ? lastInZone + 1 : workingSlots.length;
    }
    workingSlots.splice(insertAt, 0, slot);
    return true;
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function previewClass(preview) {
    if (preview === 'favicon') return 'asset-preview favicon-preview';
    if (preview === 'bg') return 'asset-preview bg-preview';
    return 'asset-preview';
  }

  function zonePicker(slot) {
    return (
      `<div class="asset-slot-zones" role="group" aria-label="Move ${esc(slot.label)} to zone">` +
      ZONES.map((z) => {
        const short =
          z.id === 'website-top' ? 'Top' : z.id === 'left' ? 'Left' : z.id === 'right' ? 'Right' : 'Bottom';
        const active = z.id === slot.zone ? ' is-active' : '';
        return (
          `<button type="button" class="asset-slot-zone-btn${active}" data-move-zone="${esc(z.id)}" data-slot-id="${esc(slot.id)}" aria-pressed="${z.id === slot.zone ? 'true' : 'false'}">${esc(short)}</button>`
        );
      }).join('') +
      `</div>`
    );
  }

  function rowHtml(slot, locale, meta) {
    const hint = slot.hint
      ? `<small class="text-secondary">${esc(slot.hint)}</small>`
      : '';
    return (
      `<div class="asset-upload-row" data-field="${esc(meta.field)}" data-locale="${esc(locale)}">` +
      `<div class="${previewClass(slot.preview)}"><img alt="${esc(slot.label)} preview" data-preview="${esc(meta.field)}" /></div>` +
      `<div class="asset-field">` +
      `<label>${esc(slot.label)}</label>` +
      `<input type="hidden" id="${esc(meta.field)}" readonly />` +
      `<div class="asset-path-hidden" data-asset-text="${esc(meta.field)}">Current image loaded</div>` +
      hint +
      `</div>` +
      `<input type="file" class="asset-file" accept="${FILE_ACCEPT}" hidden />` +
      `<div class="asset-actions">` +
      `<button class="clean-btn choose-btn" type="button">Choose</button>` +
      `<button class="clean-btn upload-asset-btn" type="button">Clear</button>` +
      `</div>` +
      `</div>`
    );
  }

  function slotHtml(slot) {
    const locales = slot.shared
      ? [['all', slot.all]]
      : [
          ['en', slot.en],
          ['zh', slot.zh],
          ['my', slot.my],
        ];
    const rows = locales
      .filter(([, meta]) => meta && meta.field)
      .map(([locale, meta]) => rowHtml(slot, locale, meta))
      .join('');
    return (
      `<div class="asset-slot" data-slot="${esc(slot.id)}" data-zone="${esc(slot.zone)}" draggable="false">` +
      `<div class="asset-slot-chrome">` +
      `<button type="button" class="asset-slot-drag" title="Drag to another zone" aria-label="Drag ${esc(slot.label)}">` +
      `<i class="bi bi-grip-vertical" aria-hidden="true"></i>` +
      `</button>` +
      `<span class="asset-slot-chrome-label">Place</span>` +
      zonePicker(slot) +
      `</div>` +
      rows +
      `</div>`
    );
  }

  function zoneHtml(zone) {
    const slots = workingSlots.filter((s) => s.zone === zone.id).map(slotHtml).join('');
    return (
      `<section class="asset-zone" data-zone="${esc(zone.id)}">` +
      `<header class="asset-zone-head">` +
      `<span class="asset-zone-map" data-map="${esc(zone.id)}" aria-hidden="true">` +
      `<i data-cell="t"></i>` +
      `<i data-cell="l"></i><i data-cell="c"></i><i data-cell="r"></i>` +
      `<i data-cell="b"></i>` +
      `</span>` +
      `<div class="asset-zone-copy">` +
      `<h4>${esc(zone.title)}</h4>` +
      `<p>${esc(zone.desc)}</p>` +
      `</div>` +
      `</header>` +
      `<div class="asset-zone-grid" data-drop-zone="${esc(zone.id)}">${slots}</div>` +
      `</section>`
    );
  }

  function render(mount, brandId) {
    if (!mount) return;
    if (brandId != null) loadPlacement(brandId);
    mount.innerHTML = ZONES.map(zoneHtml).join('');
  }

  /** Flatten slot locale metas into the upload/API asset list shape. */
  function flattenAssets(assetUrlFn) {
    const list = [];
    workingSlots.forEach((slot) => {
      const metas = slot.shared ? [slot.all] : [slot.en, slot.zh, slot.my];
      metas.forEach((meta) => {
        if (!meta || !meta.field) return;
        list.push({
          field: meta.field,
          fileKey: meta.fileKey,
          label: meta.label,
          fallback: meta.fallbackFile && assetUrlFn ? assetUrlFn(meta.fallbackFile) : '',
          apiKeys: meta.apiKeys,
          slotId: slot.id,
          zone: slot.zone,
        });
      });
    });
    return list;
  }

  function bindArrange(mount, brandId, onChange) {
    if (!mount) return;

    mount.querySelectorAll('.asset-slot-zone-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = btn.getAttribute('data-slot-id');
        const toZone = btn.getAttribute('data-move-zone');
        if (!slotId || !toZone) return;
        if (btn.classList.contains('is-active')) return;
        moveSlot(slotId, toZone, null);
        savePlacement(brandId);
        if (typeof onChange === 'function') onChange();
      });
    });

    let dragId = '';
    mount.querySelectorAll('.asset-slot').forEach((slotEl) => {
      const handle = slotEl.querySelector('.asset-slot-drag');
      handle?.addEventListener('mousedown', () => {
        slotEl.setAttribute('draggable', 'true');
      });
      slotEl.addEventListener('dragstart', (e) => {
        if (slotEl.getAttribute('draggable') !== 'true') {
          e.preventDefault();
          return;
        }
        dragId = slotEl.getAttribute('data-slot') || '';
        slotEl.classList.add('is-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', dragId);
        }
      });
      slotEl.addEventListener('dragend', () => {
        slotEl.classList.remove('is-dragging');
        slotEl.setAttribute('draggable', 'false');
        mount.querySelectorAll('.asset-zone-grid.is-drop-target').forEach((g) => g.classList.remove('is-drop-target'));
        dragId = '';
      });
    });

    mount.querySelectorAll('.asset-zone-grid').forEach((grid) => {
      grid.addEventListener('dragover', (e) => {
        e.preventDefault();
        grid.classList.add('is-drop-target');
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      });
      grid.addEventListener('dragleave', (e) => {
        if (!grid.contains(e.relatedTarget)) grid.classList.remove('is-drop-target');
      });
      grid.addEventListener('drop', (e) => {
        e.preventDefault();
        grid.classList.remove('is-drop-target');
        const toZone = grid.getAttribute('data-drop-zone');
        const id = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || dragId;
        if (!id || !toZone) return;
        const overSlot = e.target && e.target.closest ? e.target.closest('.asset-slot') : null;
        const beforeId =
          overSlot && overSlot.getAttribute('data-slot') !== id
            ? overSlot.getAttribute('data-slot')
            : null;
        moveSlot(id, toZone, beforeId);
        savePlacement(brandId);
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  global.SITE_CUSTOMIZE_LAYOUT = {
    ZONES,
    SLOTS: workingSlots,
    DEFAULT_SLOTS,
    render,
    flattenAssets,
    loadPlacement,
    savePlacement,
    resetPlacement,
    moveSlot,
    bindArrange,
  };
})(window);
