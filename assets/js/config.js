const API_CONFIG = window.API_CONFIG || {
    // BASE_URL: "http://localhost:8080/api",
    BASE_URL: "https://bo.titanx7.com/api",

    CUSTOM_ASSET_BASE_URL: "https://titanx7.com/assets/custom/images",

    // Static upload domain for BO preview links/images (QR, payment proof, uploaded media)
    STATIC_UPLOAD_BASE_URL: "https://static.titanx7.com",

    // Change this one value when the public game-image host changes.
    GAME_IMAGE_PUBLIC_BASE_URL: "https://static.titanx7.com/uploads/game",

    ENDPOINTS: {
        UPLOAD_IMAGE: "/uploads/image",
        AUTH_ADMIN_LOGIN: "/auth/admin/login",
        AUTH_ADMIN_CREATE: "/auth/admin/create",
        AUTH_ADMIN_ME: "/auth/admin/me",
        AUTH_ADMIN_LIST: "/auth/admin/list",
        AUTH_ADMIN_LOGIN_LOGS: "/auth/admin/login-logs",
        AUTH_ADMIN_UPDATE: "/auth/admin/update",
        AUTH_ADMIN_DELETE: "/auth/admin/delete",
        AUTH_ADMIN_PROFILE_UPDATE: "/auth/admin/profile/update",
        AUTH_ADMIN_CHANGE_PASSWORD: "/auth/admin/password/change",
        BRAND_CONTEXT: "/admin/brands/context",
        BRAND_LIST: "/admin/brands",
        BRAND_SAVE: "/admin/brands/save",
        ACCESS_BOOTSTRAP: "/admin/access/bootstrap",
        ROLE_LIST: "/admin/access/roles",
        ROLE_LIST_ALL: "/admin/access/roles/all",
        ROLE_SAVE: "/admin/access/roles/save",
        MENU_LIST: "/admin/access/menus",
        MENU_LIST_ALL: "/admin/access/menus/all",
        MENU_SAVE: "/admin/access/menus/save",
        MENU_GROUP_LIST: "/admin/access/menu-groups",
        MENU_GROUP_LIST_ALL: "/admin/access/menu-groups/all",
        MENU_GROUP_SAVE: "/admin/access/menu-groups/save",
        MENU_GROUP_DELETE: "/admin/access/menu-groups",
        ROLE_MENU_GET: "/admin/access/role",
        MEMBER_LIST: "/admin/member/list",
        MEMBER_ONLINE: "/admin/member/online",
        MEMBER_CREATE: "/admin/member/create",
        MEMBER_UPDATE: "/admin/member/update",
        MEMBER_GAME_INSIGHT: "/admin/member/game-insight",
        HIGHEST_TURNOVER_PLAYERS: "/admin/member/highest-turnover-players",
        FREQUENT_GAME_PLAYERS: "/admin/member/frequent-game-players",
        DUPLICATE_IP_LIST: "/admin/member/duplicate-ip/list",
        DUPLICATE_IP_USERS: "/admin/member/duplicate-ip/users",
        LANGUAGE_LIST: "/admin/language/list",
        LANGUAGE_SAVE: "/admin/language/save",
        TRANSLATION_GET: "/admin/language/translation",
        TRANSLATION_TEXT: "/admin/language/translation/text",
        TRANSLATION_IMAGE: "/admin/language/translation/image",
        CUSTOMIZE_MAIN_LAYOUT: "/customize/main-layout",
        CUSTOMIZE_SOCIAL: "/customize/social",
        SOCIAL_LIST: "/admin/social/list",
        SOCIAL_SAVE: "/admin/social/save",
        SOCIAL_DELETE: "/admin/social/delete",
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
        GAME_PROVIDER_BRAND_PRESENTATION: "/admin/game-provider/brand-presentation",

        MEMBER_WALLET_LIST: "/admin/member-wallet/list",
        MEMBER_WALLET_PROVIDER_ACCOUNTS: "/admin/member-wallet/provider-accounts",
        MEMBER_WALLET_BALANCE: "/admin/member-wallet/balance",
        MEMBER_WALLET_ADJUST: "/admin/member-wallet/adjust",
        MEMBER_WALLET_BANK_OPTIONS: "/admin/member-wallet/bank-options",
        MEMBER_WALLET_BULK_ADJUST: "/admin/member-wallet/bulk-adjustment",
        MEMBER_BULK_BONUS_ADJUST: "/admin/operations/bulk-bonus",
        MEMBER_DEPOSIT_LIST: "/admin/member-deposit/list",
        MEMBER_DEPOSIT_APPROVE: "/admin/member-deposit/approve",
        MEMBER_DEPOSIT_REJECT: "/admin/member-deposit/reject",
        PAYMENT_METHOD_LIST: "/admin/payment-method/list",
        PAYMENT_METHOD_SAVE: "/admin/payment-method/save",
        PAYMENT_METHOD_DELETE: "/admin/payment-method/delete",
        REFERRAL_LIST: "/admin/referral/list",
        REFERRAL_DOWNLINE: "/admin/referral/downline",
        REFERRAL_CONFIG: "/admin/referral/config",
        REFERRAL_MEMBER_CONFIG: "/admin/referral/member-config",
        MEMBER_WITHDRAW_LIST: "/admin/member-withdraw/list",
        MEMBER_WITHDRAW_CREATE: "/admin/member-withdraw/create",
        MEMBER_WITHDRAW_APPROVE: "/admin/member-withdraw/approve",
        MEMBER_WITHDRAW_REJECT: "/admin/member-withdraw/reject",
        OPERATION_NOTIFICATION_SUMMARY: "/admin/notifications/pending-summary",

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

        WIN_LOSE_REPORT_LIST: "/admin/win-lose-report/list",
        CASINO_REPORT_SUMMARY: "/admin/casino-report/summary",

        PROMOTION_LIST: "/admin/promotion/list",
        PROMOTION_DETAIL: "/admin/promotion/detail/{id}",
        PROMOTION_SAVE: "/admin/promotion/save",
        PROMOTION_SAVE_FORM: "/admin/promotion/save-form",
        PROMOTION_CLONE: '/admin/promotion/clone/{id}',
    PROMOTION_DELETE: "/admin/promotion/delete",
        PROMOTION_DEBUG_CLAIMS: "/admin/promotion/debug/claims",

        GAME_LIST: "/admin/game/list",
        GAME_CREATE: "/admin/game/create",
        GAME_UPDATE: "/admin/game/update",
        GAME_DELETE: "/admin/game/delete",
        GAME_DOWNLOAD_IMAGES: "/admin/game/download-images",
        ANIMATION_SETTING_LIST: "/admin/animation-setting/list",
        ANIMATION_SETTING_SAVE: "/admin/animation-setting/save",
        ANIMATION_SETTING_DELETE: "/admin/animation-setting/delete",

        FRONTEND_DISPLAY_SETTING: "/admin/frontend/display-setting",
        INSTALL_APP_SETTING: "/admin/frontend/install-app",
        ADVERTISEMENT_POPUP: "/admin/frontend/ad-popup",
        COMPLIANCE_POLICY_LIST: "/admin/compliance-policies",
        COMPLIANCE_POLICY_SAVE: "/admin/compliance-policies/save",
        VIP_LEVEL_LIST: "/admin/vip/levels",
        VIP_LEVEL_SAVE: "/admin/vip/levels/save",
        VIP_IMAGE_UPLOAD: "/admin/vip/levels/image",
        VIP_LEVEL_DELETE: "/admin/vip/levels",
        VIP_EXP_SETTINGS: "/admin/vip/experience-settings",
        VIP_EXP_LOGS: "/admin/vip/experience-logs",
        VIP_EXP_ADJUST: "/admin/vip/experience-logs/adjust",
        VIP_REWARD_LOGS: "/admin/vip/rewards",
        VIP_REWARD_RUN: "/admin/vip/rewards/run",
        VIP_WORKER_SETTINGS: "/admin/vip/worker-settings",
        SPIN2_REWARDS: "/admin/spin2/rewards",
        SPIN2_MEMBER: "/admin/spin2/member"
    }
};

window.API_CONFIG = API_CONFIG;
// Compatibility globals used by newer BO modules. Keep login and legacy pages isolated
// from module load order and avoid referencing undeclared variables during config init.
window.API_BASE = String(API_CONFIG.BASE_URL || '').replace(/\/api\/?$/, '');
window.API_ENDPOINTS = API_CONFIG.ENDPOINTS || {};

window.BO_TIMEZONE = { get: function(){ return localStorage.getItem('bo_timezone') || 'Asia/Kuala_Lumpur'; } };
window.BO_FORMAT = {
  dateTime: function(value){
    if(value === undefined || value === null || value === '') return '-';
    if(value && typeof value === 'object' && typeof value.toDate === 'function') value=value.toDate();
    let d=value instanceof Date?value:new Date(value);
    if(Number.isNaN(d.getTime())){
      const raw=String(value).trim().replace(' ','T'); d=new Date(raw + (/Z$|[+-]\d{2}:?\d{2}$/.test(raw)?'':'Z'));
    }
    if(Number.isNaN(d.getTime())) return String(value).replace('T',' ').slice(0,19);
    try{ return new Intl.DateTimeFormat('en-CA',{timeZone:window.BO_TIMEZONE.get(),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d).replace(',', ''); }catch(_){ return d.toISOString().replace('T',' ').slice(0,19); }
  },
  today: function(){ const parts=new Intl.DateTimeFormat('en-CA',{timeZone:window.BO_TIMEZONE.get(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const x={};parts.forEach(p=>x[p.type]=p.value);return x.year+'-'+x.month+'-'+x.day; }
};
