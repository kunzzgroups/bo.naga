(function(){
  function init(){
    if(!window.DynamicTranslation) return;
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    const map = {
      'slider.html': {formId:'sliderForm', idSelector:'#sliderId', refType:'slider'},
      'game-category.html': {formId:'categoryForm', idSelector:'#categoryId', refType:'game_category'},
      'game-sub-category.html': {formId:'subCategoryForm', idSelector:'#subCategoryId', refType:'game_sub_category'},
      'game.html': {formId:'gameForm', idSelector:'#gameId', refType:'game'},
      'bonus-category-title.html': {formId:'bonusForm', idSelector:'#bonusId', refType:'bonus_category'},
      'bonus-category-item.html': {formId:'bonusItemForm', idSelector:'#bonusItemId', refType:'bonus_category_item'},
      'site-customize.html': {assetPanel:true, refType:'main_layout', refId:1}
    };
    const cfg = map[page];
    if(cfg && cfg.assetPanel) window.DynamicTranslation.attachAssetPanel(cfg);
    else if(cfg) window.DynamicTranslation.attach(cfg);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
