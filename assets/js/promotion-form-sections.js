(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function fieldFor(id) {
    var control = document.getElementById(id);
    return control ? control.closest('.field') : null;
  }

  function setSpan(id, span) {
    var field = fieldFor(id);
    if (!field) return;
    field.classList.remove('full', 'span-2', 'span-3');
    if (span) field.classList.add(span);
  }

  function section(id, title, icon, description, ids, jumpLabel) {
    var block = document.createElement('section');
    block.className = 'promo-standard-section';
    block.id = id;
    block.dataset.jumpLabel = jumpLabel || title;
    block.dataset.jumpIcon = icon || 'bi-dot';
    block.innerHTML =
      '<div class="promo-standard-section-head">' +
        '<i class="bi ' + icon + '" aria-hidden="true"></i>' +
        '<div><b>' + title + '</b>' +
        (description ? '<small>' + description + '</small>' : '') +
        '</div>' +
      '</div>' +
      '<div class="promo-standard-section-grid"></div>';

    var grid = block.querySelector('.promo-standard-section-grid');
    ids.forEach(function (fieldId) {
      var field = fieldFor(fieldId);
      if (field && !grid.contains(field)) grid.appendChild(field);
    });
    return block;
  }

  function buildJumpNav(sectionsRoot) {
    var sections = Array.prototype.slice.call(sectionsRoot.querySelectorAll('.promo-standard-section'));
    if (!sections.length) return;

    var nav = document.createElement('nav');
    nav.className = 'promo-edit-jump';
    nav.setAttribute('aria-label', 'Jump to form section');
    var track = document.createElement('div');
    track.className = 'promo-edit-jump-track';
    nav.appendChild(track);

    var workspace = document.querySelector('.promo-edit-workspace');
    var form = document.getElementById('promoForm');

    var buttons = [];
    var setActive = function (id) {
      buttons.forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.target === id);
      });
    };

    var scrollToSection = function (target) {
      if (!target) return;
      setActive(target.id);
      var scroller = form;
      if (!scroller) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      var scrollerRect = scroller.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var nextTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) - 10;
      var maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTo({ top: Math.max(0, Math.min(nextTop, maxTop)), behavior: 'smooth' });
    };

    sections.forEach(function (sec, index) {
      if (!sec.id) sec.id = 'promo-sec-' + (index + 1);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'promo-edit-jump-btn';
      btn.dataset.target = sec.id;
      var titleEl = sec.querySelector('b');
      var label = sec.dataset.jumpLabel || (titleEl && titleEl.textContent) || ('Section ' + (index + 1));
      var icon = sec.dataset.jumpIcon || 'bi-dot';
      btn.innerHTML =
        '<i class="bi ' + icon + '" aria-hidden="true"></i>' +
        '<span>' + label + '</span>';
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.dataset.target);
        scrollToSection(target);
        try { btn.blur(); } catch (e) {}
      });
      track.appendChild(btn);
      buttons.push(btn);
    });

    if (workspace && form) {
      workspace.insertBefore(nav, form);
    } else if (sectionsRoot.parentNode) {
      sectionsRoot.parentNode.insertBefore(nav, sectionsRoot);
    }

    if (buttons[0]) setActive(buttons[0].dataset.target);

    if ('IntersectionObserver' in window) {
      var scrollRoot = form || workspace;
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible[0] && visible[0].target && visible[0].target.id) {
          setActive(visible[0].target.id);
        }
      }, { root: scrollRoot, rootMargin: '0px 0px -60% 0px', threshold: [0.08, 0.2, 0.5, 0.75] });
      sections.forEach(function (sec) { observer.observe(sec); });

      // Bottom sections (More / Content) often never hit the top band — sync when scrolled to end.
      if (form) {
        var syncBottom = function () {
          var maxTop = Math.max(0, form.scrollHeight - form.clientHeight);
          if (maxTop <= 0) return;
          if (form.scrollTop >= maxTop - 24) {
            var last = sections[sections.length - 1];
            if (last && last.id) setActive(last.id);
          }
        };
        form.addEventListener('scroll', syncBottom, { passive: true });
      }
    }
  }

  ready(function () {
    var originalGrid = document.querySelector('#promoForm .promo-form-grid');
    if (!originalGrid || originalGrid.dataset.sectionized === '1') return;
    originalGrid.dataset.sectionized = '1';

    originalGrid.querySelectorAll('.promo-policy-section').forEach(function (node) {
      node.remove();
    });

    var container = document.createElement('div');
    container.className = 'promo-standard-sections';

    container.appendChild(section(
      'promo-sec-display',
      'Display & Placement',
      'bi-image',
      'Where the card appears and how it lays out on desktop and mobile.',
      [
        'promoBonusCategoryTitleId', 'promoImage', 'promoItemName', 'promoLinkUrl',
        'promoDesktopColumns', 'promoMobileColumns', 'promoDesktopSpan', 'promoMobileSpan',
        'promoSingleLeft'
      ],
      'Display'
    ));

    container.appendChild(section(
      'promo-sec-basic',
      'Basic Promotion',
      'bi-info-circle',
      'Identity, type, claim trigger, VIP access and frontend status.',
      [
        'promoName', 'promoCode', 'promoBonusType', 'promoClaimCondition',
        'promoStatus', 'promoWallet', 'promoDisplayAmount', 'promoDisplayOrder'
      ],
      'Basic'
    ));

    container.appendChild(section(
      'promo-sec-amount',
      'Bonus Amount & Eligibility',
      'bi-gift',
      'Reward value, deposit range and payout limits.',
      [
        'promoPercentage', 'promoFixed', 'promoRandomMin', 'promoRandomMax',
        'promoMaxPayout', 'promoMinTopup', 'promoMaxTopup', 'promoMinTimes'
      ],
      'Amount'
    ));

    container.appendChild(section(
      'promo-sec-claim',
      'Claim, Rollover & Turnover',
      'bi-bar-chart-line',
      'Claim frequency, wagering requirements and allowed games.',
      [
        'promoClaimLimit', 'promoClaimReset', 'promoRollover', 'promoTurnover',
        'promoAllowedGames'
      ],
      'Claim'
    ));

    container.appendChild(section(
      'promo-sec-period',
      'Promotion Period & Completion',
      'bi-calendar-range',
      'Display and claim windows, plus completion rules after claiming.',
      [
        'promoStartAt', 'promoEndAt', 'promoClaimStartAt', 'promoClaimEndAt',
        'promoCompletionDeadlineMode', 'promoCompletionDays', 'promoCompletionFixedAt',
        'promoCompletionMode', 'promoRewardClaimMode'
      ],
      'Period'
    ));

    container.appendChild(section(
      'promo-sec-wallet',
      'Wallet Behaviour',
      'bi-wallet2',
      'Wallet consumption priority and win allocation.',
      ['promoWalletConsumptionPriority', 'promoWinAllocationRule'],
      'Wallet'
    ));

    container.appendChild(section(
      'promo-sec-rebate',
      'Rebate Policy',
      'bi-percent',
      'Control whether members under this promotion are eligible for rebate and when eligibility begins.',
      [
        'promoRebatePolicy', 'promoRebateStartCondition', 'promoEligibleBalanceType',
        'promoEligibleBalanceThreshold', 'promoNewDepositRequired', 'promoCanClaimRebate'
      ],
      'Rebate'
    ));

    container.appendChild(section(
      'promo-sec-withdraw',
      'Withdrawal Restriction',
      'bi-cash-stack',
      'Optional withdrawal limits and excess-balance handling.',
      ['promoWithdrawalRestriction', 'promoMaxWithdraw', 'promoExcessBalanceAction'],
      'Withdraw'
    ));

    container.appendChild(section(
      'promo-sec-content',
      'Terms & Frontend Content',
      'bi-card-text',
      'Member-facing copy for the promotion modal, plus language translations.',
      ['promoDescription', 'promoDetailEditor'],
      'Content'
    ));

    // Dock Language Translation inside Content so it reads as one composition.
    (function dockTranslationHost() {
      var content = container.querySelector('#promo-sec-content .promo-standard-section-grid');
      if (!content || content.querySelector('[data-translation-panel-host]')) return;
      var hostField = document.createElement('div');
      hostField.className = 'field full promo-translation-host-field';
      hostField.innerHTML =
        '<div class="promo-content-split-label" aria-hidden="true">' +
          '<i class="bi bi-translate"></i><span>Translations</span>' +
        '</div>' +
        '<div data-translation-panel-host class="promo-translation-host"></div>';
      content.appendChild(hostField);
    })();

    var remaining = Array.from(originalGrid.children).filter(function (node) {
      return node.classList && node.classList.contains('field');
    });
    // Claimable VIP + Daily Rebate eligibility historically lived with the Deposit/Winover note.
    var extra = section(
      'promo-sec-extra',
      'Additional Configuration',
      'bi-journal-check',
      'VIP access, daily-rebate eligibility and supporting calculation notes.',
      ['promoClaimableVipTiers', 'promoEligibleForDailyRebate'],
      'More'
    );
    var extraGrid = extra.querySelector('.promo-standard-section-grid');
    remaining.forEach(function (node) { extraGrid.appendChild(node); });
    container.insertBefore(extra, container.lastElementChild);

    originalGrid.replaceWith(container);

    var panel = document.createElement('div');
    panel.className = 'promo-edit-panel';
    container.parentNode.insertBefore(panel, container);
    panel.appendChild(container);
    buildJumpNav(container);

    // Operable spans after fields are back in the document (getElementById needs that).
    setSpan('promoBonusCategoryTitleId', 'span-2');
    setSpan('promoImage', 'span-2');
    setSpan('promoItemName', 'span-2');
    setSpan('promoLinkUrl', 'span-2');
    [
      'promoDesktopColumns', 'promoMobileColumns', 'promoDesktopSpan',
      'promoMobileSpan', 'promoSingleLeft'
    ].forEach(function (id) { setSpan(id, null); });
    setSpan('promoClaimableVipTiers', 'full');
    setSpan('promoAllowedGames', 'full');
    setSpan('promoDescription', 'full');
    setSpan('promoDetailEditor', 'full');

    // Display layout — twin panes: Section | This card (equal weight, scan side-by-side)
    (function buildDisplayLayoutCluster() {
      var sectionIds = ['promoDesktopColumns', 'promoMobileColumns'];
      var cardIds = ['promoDesktopSpan', 'promoMobileSpan', 'promoSingleLeft'];
      var sectionFields = sectionIds.map(fieldFor).filter(Boolean);
      var cardFields = cardIds.map(fieldFor).filter(Boolean);
      if (!sectionFields.length && !cardFields.length) return;

      var anchor = sectionFields[0] || cardFields[0];
      var parent = anchor && anchor.parentNode;
      if (!parent) return;

      var labels = {
        promoDesktopColumns: 'Desktop',
        promoMobileColumns: 'Mobile',
        promoDesktopSpan: 'Desktop',
        promoMobileSpan: 'Mobile',
        promoSingleLeft: 'Align'
      };
      Object.keys(labels).forEach(function (id) {
        var field = fieldFor(id);
        var lab = field && field.querySelector('label');
        if (lab) lab.textContent = labels[id];
      });

      var cluster = document.createElement('div');
      cluster.className = 'field full promo-display-layout';
      cluster.innerHTML =
        '<div class="promo-display-layout-head">' +
          '<b>Layout</b>' +
          '<small>Section columns apply to every card in this category. Span and align apply only here.</small>' +
        '</div>' +
        '<div class="promo-display-layout-panes">' +
          '<div class="promo-display-layout-pane" data-pane="section">' +
            '<div class="promo-display-layout-pane-head">' +
              '<span class="promo-display-layout-pane-title">Section</span>' +
              '<span class="promo-display-layout-pane-hint">Shared grid</span>' +
            '</div>' +
            '<div class="promo-display-layout-controls is-section"></div>' +
          '</div>' +
          '<div class="promo-display-layout-pane" data-pane="card">' +
            '<div class="promo-display-layout-pane-head">' +
              '<span class="promo-display-layout-pane-title">This card</span>' +
              '<span class="promo-display-layout-pane-hint">Span &amp; align</span>' +
            '</div>' +
            '<div class="promo-display-layout-controls is-card"></div>' +
          '</div>' +
        '</div>';

      var sectionControls = cluster.querySelector('.promo-display-layout-controls.is-section');
      var cardControls = cluster.querySelector('.promo-display-layout-controls.is-card');
      parent.insertBefore(cluster, anchor);
      sectionFields.forEach(function (field) {
        field.classList.remove('full', 'span-2', 'span-3');
        sectionControls.appendChild(field);
      });
      cardFields.forEach(function (field) {
        field.classList.remove('full', 'span-2', 'span-3');
        cardControls.appendChild(field);
      });

      Array.prototype.slice.call(parent.querySelectorAll('.field.full')).forEach(function (node) {
        if (node === cluster) return;
        var help = node.querySelector('.promo-help');
        if (!help) return;
        var text = (help.textContent || '').toLowerCase();
        if (text.indexOf('section grid') !== -1 || text.indexOf('card span') !== -1) {
          node.remove();
        }
      });
    })();
  });
})();
