(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function fieldFor(id) {
    var control = document.getElementById(id);
    return control ? control.closest('.field') : null;
  }

  function section(title, icon, description, ids) {
    var block = document.createElement('section');
    block.className = 'promo-standard-section';
    block.innerHTML =
      '<div class="promo-standard-section-head">' +
        '<i class="bi ' + icon + '"></i>' +
        '<div><b>' + title + '</b>' +
        (description ? '<small>' + description + '</small>' : '') +
        '</div>' +
      '</div>' +
      '<div class="promo-standard-section-grid"></div>';

    var grid = block.querySelector('.promo-standard-section-grid');
    ids.forEach(function (id) {
      var field = fieldFor(id);
      if (field && !grid.contains(field)) grid.appendChild(field);
    });
    return block;
  }

  ready(function () {
    var originalGrid = document.querySelector('#promoForm .promo-form-grid');
    if (!originalGrid || originalGrid.dataset.sectionized === '1') return;
    originalGrid.dataset.sectionized = '1';

    // The old inline policy banners are replaced by consistent section headers.
    originalGrid.querySelectorAll('.promo-policy-section').forEach(function (node) {
      node.remove();
    });

    var container = document.createElement('div');
    container.className = 'promo-standard-sections';

    container.appendChild(section(
      'Display & Placement',
      'bi-image',
      'Choose where the promotion appears and how its card is displayed on desktop and mobile.',
      [
        'promoBonusCategoryTitleId', 'promoImage', 'promoItemName', 'promoLinkUrl',
        'promoDesktopColumns', 'promoMobileColumns', 'promoDesktopSpan', 'promoMobileSpan',
        'promoSingleLeft'
      ]
    ));

    container.appendChild(section(
      'Basic Promotion',
      'bi-info-circle',
      'Main promotion identity, type, claim trigger and frontend status.',
      [
        'promoName', 'promoCode', 'promoBonusType', 'promoClaimCondition',
        'promoStatus', 'promoWallet', 'promoDisplayAmount', 'promoDisplayOrder'
      ]
    ));

    container.appendChild(section(
      'Bonus Amount & Eligibility',
      'bi-gift',
      'Configure the reward value, deposit range and payout limits.',
      [
        'promoPercentage', 'promoFixed', 'promoRandomMin', 'promoRandomMax',
        'promoMaxPayout', 'promoMinTopup', 'promoMaxTopup', 'promoMinTimes'
      ]
    ));

    container.appendChild(section(
      'Claim, Rollover & Turnover',
      'bi-bar-chart-line',
      'Control claim frequency and the wagering requirements that must be completed.',
      [
        'promoClaimLimit', 'promoClaimReset', 'promoRollover', 'promoTurnover',
        'promoAllowedGames'
      ]
    ));

    container.appendChild(section(
      'Promotion Period & Completion',
      'bi-calendar-range',
      'Display dates control visibility, claim dates control new claims, and completion rules apply after claiming.',
      [
        'promoStartAt', 'promoEndAt', 'promoClaimStartAt', 'promoClaimEndAt',
        'promoCompletionDeadlineMode', 'promoCompletionDays', 'promoCompletionFixedAt',
        'promoCompletionMode', 'promoRewardClaimMode'
      ]
    ));

    container.appendChild(section(
      'Wallet Behaviour',
      'bi-wallet2',
      'Define wallet consumption priority and where winnings are allocated.',
      ['promoWalletConsumptionPriority', 'promoWinAllocationRule']
    ));

    container.appendChild(section(
      'Rebate Policy',
      'bi-percent',
      'Control whether members under this promotion are eligible for rebate and when eligibility begins.',
      [
        'promoRebatePolicy', 'promoRebateStartCondition', 'promoEligibleBalanceType',
        'promoEligibleBalanceThreshold', 'promoNewDepositRequired', 'promoCanClaimRebate'
      ]
    ));

    container.appendChild(section(
      'Withdrawal Restriction',
      'bi-cash-stack',
      'Optionally limit withdrawal while the promotion is active and define excess-balance handling.',
      ['promoWithdrawalRestriction', 'promoMaxWithdraw', 'promoExcessBalanceAction']
    ));

    container.appendChild(section(
      'Terms & Frontend Content',
      'bi-card-text',
      'Add internal logic notes, member-facing terms and popup content.',
      ['promoDescription', 'promoDetailEditor']
    ));

    // Move any remaining fields, including the calculation note, into one final tidy block.
    var remaining = Array.from(originalGrid.children).filter(function (node) {
      return node.classList && node.classList.contains('field');
    });
    if (remaining.length) {
      var extra = document.createElement('section');
      extra.className = 'promo-standard-section';
      extra.innerHTML = '<div class="promo-standard-section-head"><i class="bi bi-journal-check"></i><div><b>Additional Configuration</b><small>Supporting calculation and administrative information.</small></div></div><div class="promo-standard-section-grid"></div>';
      var extraGrid = extra.querySelector('.promo-standard-section-grid');
      remaining.forEach(function (node) { extraGrid.appendChild(node); });
      container.insertBefore(extra, container.lastElementChild);
    }

    originalGrid.replaceWith(container);
  });
})();
