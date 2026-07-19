const API_CONFIG = window.API_CONFIG || {
    // BASE_URL: "http://localhost:8080/api",
    BASE_URL: "https://bo.titanxgaming.com/api",

    CUSTOM_ASSET_BASE_URL: "https://titanxgaming.com/assets/custom/images",

    // Static upload domain for BO preview links/images (QR, payment proof, uploaded media)
    STATIC_UPLOAD_BASE_URL: "https://static.titanxgaming.com",

    // Change this one value when the public game-image host changes.
    GAME_IMAGE_PUBLIC_BASE_URL: "https://static.titanxgaming.com/uploads/game",

    ENDPOINTS: {
        UPLOAD_IMAGE: "/uploads/image",
        AUTH_ADMIN_LOGIN: "/auth/admin/login",
        AUTH_ADMIN_CREATE: "/auth/admin/create",
        AUTH_ADMIN_ME: "/auth/admin/me",
        AUTH_ADMIN_LIST: "/auth/admin/list",
        AUTH_ADMIN_UPDATE: "/auth/admin/update",
        AUTH_ADMIN_PROFILE_UPDATE: "/auth/admin/profile/update",
        AUTH_ADMIN_CHANGE_PASSWORD: "/auth/admin/password/change",
        ACCESS_BOOTSTRAP: "/admin/access/bootstrap",
        ROLE_LIST: "/admin/access/roles",
        ROLE_SAVE: "/admin/access/roles/save",
        MENU_LIST: "/admin/access/menus",
        MENU_SAVE: "/admin/access/menus/save",
        ROLE_MENU_GET: "/admin/access/role",
        MEMBER_LIST: "/admin/member/list",
        MEMBER_CREATE: "/admin/member/create",
        MEMBER_UPDATE: "/admin/member/update",
        LANGUAGE_LIST: "/admin/language/list",
        LANGUAGE_SAVE: "/admin/language/save",
        TRANSLATION_GET: "/admin/language/translation",
        TRANSLATION_TEXT: "/admin/language/translation/text",
        TRANSLATION_IMAGE: "/admin/language/translation/image",
        CUSTOMIZE_MAIN_LAYOUT: "/customize/main-layout",
        CUSTOMIZE_SECTION: "/customize/section",
        BONUS_CATEGORY_TITLE_LIST: "/bonus-category-title",
        BONUS_CATEGORY_TITLE_CREATE: "/bonus-category-title",
        BONUS_CATEGORY_TITLE_UPDATE: "/bonus-category-title/update",
        BONUS_CATEGORY_TITLE_DELETE: "/bonus-category-title/delete",
        BONUS_CATEGORY_ITEM_LIST: "/bonus-category-item",
        BONUS_CATEGORY_ITEM_DETAIL: "/bonus-category-item/detail",
        BONUS_CATEGORY_ITEM_CREATE: "/bonus-category-item",
        BONUS_CATEGORY_ITEM_UPDATE: "/bonus-category-item/update",
        BONUS_CATEGORY_ITEM_DELETE: "/bonus-category-item/delete",
        SLIDER_LIST: "/admin/slider/list",
        SLIDER_CREATE: "/admin/slider/create",
        SLIDER_UPDATE: "/admin/slider/update",
        SLIDER_DELETE: "/admin/slider/delete",

        GAME_CATEGORY_LIST: "/admin/game-category/list",
        GAME_CATEGORY_CREATE: "/admin/game-category/create",
        GAME_CATEGORY_UPDATE: "/admin/game-category/update",
        GAME_CATEGORY_DELETE: "/admin/game-category/delete",

        GAME_SUB_CATEGORY_LIST: "/admin/game-sub-category/list",
        GAME_SUB_CATEGORY_CREATE: "/admin/game-sub-category/create",
        GAME_SUB_CATEGORY_UPDATE: "/admin/game-sub-category/update",
        GAME_SUB_CATEGORY_DELETE: "/admin/game-sub-category/delete",

        GAME_PROVIDER_LIST: "/admin/game-provider/list",
        GAME_PROVIDER_CREATE: "/admin/game-provider/create",
        GAME_PROVIDER_UPDATE: "/admin/game-provider/update",
        GAME_PROVIDER_DELETE: "/admin/game-provider/delete",

        MEMBER_WALLET_LIST: "/admin/member-wallet/list",
        MEMBER_WALLET_PROVIDER_ACCOUNTS: "/admin/member-wallet/provider-accounts",
        MEMBER_WALLET_BALANCE: "/admin/member-wallet/balance",
        MEMBER_WALLET_ADJUST: "/admin/member-wallet/adjust",
        MEMBER_DEPOSIT_LIST: "/admin/member-deposit/list",
        MEMBER_DEPOSIT_APPROVE: "/admin/member-deposit/approve",
        MEMBER_DEPOSIT_REJECT: "/admin/member-deposit/reject",
        PAYMENT_METHOD_LIST: "/admin/payment-method/list",
        PAYMENT_METHOD_SAVE: "/admin/payment-method/save",
        PAYMENT_METHOD_DELETE: "/admin/payment-method/delete",
        REFERRAL_LIST: "/admin/referral/list",
        REFERRAL_DOWNLINE: "/admin/referral/downline",
        MEMBER_WITHDRAW_LIST: "/admin/member-withdraw/list",
        MEMBER_WITHDRAW_CREATE: "/admin/member-withdraw/create",
        MEMBER_WITHDRAW_APPROVE: "/admin/member-withdraw/approve",
        MEMBER_WITHDRAW_REJECT: "/admin/member-withdraw/reject",

        PROVIDER_WALLET_CREATE_PLAYER: "/admin/provider-wallet/create-player",
        PROVIDER_WALLET_BALANCE: "/admin/provider-wallet/balance",
        PROVIDER_WALLET_DEPOSIT: "/admin/provider-wallet/deposit",
        PROVIDER_WALLET_WITHDRAW: "/admin/provider-wallet/withdraw",
        PROVIDER_WALLET_LAUNCH_SPORT: "/admin/provider-wallet/launch-sport",
        PROVIDER_WALLET_API_PREVIEW: "/admin/provider-wallet/api-preview",
        LIVE22_PULL_LOG_DEBUG: "/admin/provider-pull-log/run-debug",
        WBET_SET_BET_LIMIT: "/admin/wbet/set-bet-limit",
        PLAYER_PROVIDER_LAUNCH: "/player/provider/launch",
        PROVIDER_GAME_SYNC: "/admin/provider-game/sync",
        PROVIDER_GAME_DEBUG: "/admin/provider-game/debug",
        PROVIDER_CALLBACK_PREVIEW: "/provider/callback/preview",

        PLAYER_PROVIDER_SESSION_LIST: "/admin/player-provider-session/list",
        PROVIDER_BET_REPORT_LIST: "/admin/provider-bet-report/list",
        PROVIDER_WALLET_TRANSACTION_LIST: "/admin/provider-wallet-transaction/list",

        WALLET_LEDGER_LIST: "/admin/wallet-ledger/list",
        WALLET_LEDGER_SUMMARY: "/admin/wallet-ledger/summary",

        CASINO_REPORT_SUMMARY: "/admin/casino-report/summary",

        PROMOTION_LIST: "/admin/promotion/list",
        PROMOTION_SAVE: "/admin/promotion/save",
        PROMOTION_SAVE_FORM: "/admin/promotion/save-form",
        PROMOTION_DELETE: "/admin/promotion/delete",
        PROMOTION_DEBUG_CLAIMS: "/admin/promotion/debug/claims",

        GAME_LIST: "/admin/game/list",
        GAME_CREATE: "/admin/game/create",
        GAME_UPDATE: "/admin/game/update",
        GAME_DELETE: "/admin/game/delete",
        GAME_DOWNLOAD_IMAGES: "/admin/game/download-images"
    }
};

window.API_CONFIG = API_CONFIG;

window.BO_FORMAT = window.BO_FORMAT || {
  dateTime: function(value){
    if(value === undefined || value === null || value === '') return '-';
    if(value && typeof value === 'object' && typeof value.toDate === 'function') value = value.toDate();
    let d = value instanceof Date ? value : null;
    if(!d){
      let str = String(value).trim();
      if(!str) return '-';
      // Keep local DB datetime as-is, only normalize separator/milliseconds/timezone.
      str = str.replace('T',' ');
      str = str.replace(/\.\d+$/, '').replace(/\.\d+(Z|[+-]\d{2}:?\d{2})$/, '');
      str = str.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
      const m = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
      if(m) return m[1] + ' ' + m[2];
      const m2 = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
      if(m2) return m2[1] + ' ' + m2[2] + ':00';
      d = new Date(String(value));
      if(Number.isNaN(d.getTime())) return str;
    }
    const pad = n => String(n).padStart(2,'0');
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }
};
