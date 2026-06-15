const API_CONFIG = {
    // BASE_URL: "http://localhost:8080/api",
    BASE_URL: "https://bo.corepayx.com/api",

    // Frontend custom assets are served from corepayx.com, not bo.corepayx.com.
    CUSTOM_ASSET_BASE_URL: "https://corepayx.com/assets/custom/images",

    ENDPOINTS: {
        UPLOAD_IMAGE: "/uploads/image",
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

        GAME_LIST: "/admin/game/list",
        GAME_CREATE: "/admin/game/create",
        GAME_UPDATE: "/admin/game/update",
        GAME_DELETE: "/admin/game/delete"
    }
};