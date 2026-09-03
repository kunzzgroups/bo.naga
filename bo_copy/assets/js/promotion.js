(function(){
  const form=document.getElementById('promoForm');
  if(!form)return;
  const $=id=>document.getElementById(id);
  const box=$('promoStatusBox'), list=$('promoList'), empty=$('promoEmpty');
  const searchInput=$('promoSearchInput'), categoryFilter=$('promoCategoryFilter'), statusFilter=$('promoStatusFilter'), sortFilter=$('promoSortFilter');
  const totalCount=$('promoTotalCount'), activeCount=$('promoActiveCount'), activePercent=$('promoActivePercent'), showingText=$('promoShowingText');
  let rows=[];
  let promoPage=0;
  let categoryTitles=[];
  let selectedPromoImage=null;
  let detailHtmlMode=false;
  let vipLevels=[];
  let promoProviders=[];
  let promoGames=[];
  let promoLegacyAllowedTokens=[];
  let promotionGameConfigReady=Promise.resolve();

  function selectedVipTierCsv(){
    const el=$('promoClaimableVipTiers');
    if(!el)return '';
    return [...el.selectedOptions].map(o=>o.value).filter(Boolean).join(',');
  }
  function setSelectedVipTiers(csv){
    const el=$('promoClaimableVipTiers');
    if(!el)return;
    const values=new Set(String(csv||'').split(',').map(v=>v.trim()).filter(Boolean));
    [...el.options].forEach(o=>{o.selected=o.value?values.has(o.value):values.size===0;});
  }
  function renderPromotionVipOptions(selected){
    const el=$('promoClaimableVipTiers');
    if(!el)return;
    const ordered=[...vipLevels].filter(x=>Number(x.enabled??1)===1).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
    el.innerHTML='<option value="">All VIP Levels</option>'+ordered.map(x=>`<option value="${esc(x.sortOrder)}">VIP ${esc(x.sortOrder)} - ${esc(x.name||x.levelKey||'')}</option>`).join('');
    setSelectedVipTiers(selected);
  }
  async function loadPromotionVipLevels(){
    try{
      const r=await fetch(promoApi('VIP_LEVEL_LIST'),{headers:window.BO_AUTH?BO_AUTH.authHeader():{}});
      const j=await r.json();
      vipLevels=Array.isArray(j.data)?j.data:[];
    }catch(_){vipLevels=[];}
    renderPromotionVipOptions('');
  }

  function promoApi(k){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[k]; }
  function val(id){const el=$(id); const v=el?el.value:''; return v===''?null:v;}
  function num(id){const v=val(id);return v===null?null:Number(v);}
  function set(m,t){box.textContent=m||'';box.className='upload-status '+(t||'');}
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function money(v){return v==null||v===''?'-':Number(v).toFixed(2)}
  function showImagePreview(src){ const img=$('promoImagePreview'), cur=$('promoImageCurrent'); if(img&&src){img.src=src;img.hidden=false;} if(cur)cur.textContent=src?'Current/selected image preview':''; }
  function clearImagePreview(){ selectedPromoImage=null; const input=$('promoImage'); if(input) input.value=''; const img=$('promoImagePreview'); if(img){img.src='';img.hidden=true;} const cur=$('promoImageCurrent'); if(cur)cur.textContent=''; }
  function categoryName(id){ const f=categoryTitles.find(x=>String(x.id)===String(id)); return f?f.name:''; }
  function firstDefined(obj, keys){
    for(const key of keys){
      const value=obj && obj[key];
      if(value!==undefined && value!==null && value!=='') return value;
    }
    return null;
  }
  function normalizePromotion(raw){
    const x=Object.assign({},raw||{});
    x.id=firstDefined(x,['id','promotionId','promotion_id']);
    x.bonusCategoryTitleId=firstDefined(x,['bonusCategoryTitleId','bonus_category_title_id','categoryTitleId']);
    x.bonusCategoryTitleName=firstDefined(x,['bonusCategoryTitleName','bonus_category_title_name','categoryTitleName']);
    x.desktopColumns=firstDefined(x,['desktopColumns','desktop_columns']);
    x.mobileColumns=firstDefined(x,['mobileColumns','mobile_columns']);
    x.desktopSpan=firstDefined(x,['desktopSpan','desktop_span']);
    x.mobileSpan=firstDefined(x,['mobileSpan','mobile_span']);
    x.singleLeft=firstDefined(x,['singleLeft','single_left']);
    return x;
  }
  function ensureCategoryOption(x){
    const sel=$('promoBonusCategoryTitleId');
    if(!sel)return;
    const id=x.bonusCategoryTitleId;
    if(id===null||id===undefined||id==='') return;
    const wanted=String(id);
    if(![...sel.options].some(o=>o.value===wanted)){
      const option=document.createElement('option');
      option.value=wanted;
      option.textContent=x.bonusCategoryTitleName || ('Category #'+wanted);
      sel.appendChild(option);
    }
    sel.value=wanted;
    notifySelect(sel);
  }
  async function loadCategoryTitles(){ try{ const j=await req(promoApi('BONUS_CATEGORY_TITLE_LIST')+'?page=1&size=300'); categoryTitles=Array.isArray(j.data)?j.data:[]; const options=categoryTitles.map(x=>`<option value="${esc(x.id)}">${esc(x.name||('Title #'+x.id))}</option>`).join(''); const sel=$('promoBonusCategoryTitleId'); if(sel) sel.innerHTML='<option value="">Select bonus category title</option>'+options; if(categoryFilter) categoryFilter.innerHTML='<option value="">All Categories</option>'+options; }catch(e){ console.warn('Load bonus category title failed',e); } }

  function promoGameProviderCode(item){
    return String(item?.code ?? item?.providerCode ?? item?.provider_code ?? '').trim().toUpperCase();
  }
  function promoGameProviderName(item){
    return String(item?.name ?? item?.displayName ?? item?.providerName ?? item?.provider_name ?? promoGameProviderCode(item) ?? '').trim();
  }
  function promoGameCode(item){
    return String(item?.gameCode ?? item?.game_code ?? item?.code ?? item?.externalGameId ?? item?.external_game_id ?? item?.id ?? '').trim();
  }
  function promoGameName(item){
    return String(item?.name ?? item?.gameName ?? item?.game_name ?? ('Game '+promoGameCode(item))).trim();
  }
  function splitAllowedGameTokens(value){
    if(Array.isArray(value)) return value.map(v=>String(v).trim()).filter(Boolean);
    return String(value||'').split(/[\n,|;]+/).map(v=>v.trim()).filter(Boolean);
  }
  function selectedPromotionProviderCodes(){
    const root=$('promoGameAccessConfig');
    if(!root)return [];
    return [...root.querySelectorAll('.promo-provider-choice input:checked')].map(x=>String(x.value||'').toUpperCase());
  }
  function promoGameAssignmentRow(game, assigned){
    const token=promoGameCode(game);
    return `<div class="category-provider-game-row ${assigned?'is-assigned':''}" data-game-token="${esc(token)}" data-search="${esc((promoGameName(game)+' '+token).toLowerCase())}">
      <div class="category-provider-game-info"><b>${esc(promoGameName(game))}</b><small>${esc(token)}</small></div>
      <button type="button" class="category-provider-game-action ${assigned?'remove':'add'}" aria-label="${assigned?'Remove game':'Add game'}"><i class="bi ${assigned?'bi-dash-lg':'bi-plus-lg'}"></i></button>
    </div>`;
  }
  function currentPromoProviderRules(){
    const root=$('promoGameAccessConfig');
    const map=new Map();
    root?.querySelectorAll('.promo-provider-rule').forEach(card=>{
      const providerCode=String(card.dataset.providerCode||'').toUpperCase();
      const mode=card.querySelector('input[type="radio"]:checked')?.value||'ALL';
      const gameTokens=[...card.querySelectorAll('.category-provider-game-row.is-assigned')].map(row=>row.dataset.gameToken).filter(Boolean);
      map.set(providerCode,{providerCode,mode,gameTokens});
    });
    return map;
  }
  function refreshPromoAssignmentCard(card){
    if(!card)return;
    const availableList=card.querySelector('.available-list');
    const assignedList=card.querySelector('.assigned-list');
    const allRows=[...card.querySelectorAll('.category-provider-game-row')];
    const availableRows=allRows.filter(row=>!row.classList.contains('is-assigned'));
    const assignedRows=allRows.filter(row=>row.classList.contains('is-assigned'));
    availableRows.forEach(row=>availableList.appendChild(row));
    assignedRows.forEach(row=>assignedList.appendChild(row));
    const ac=card.querySelector('.available-count'), sc=card.querySelector('.assigned-count');
    if(ac)ac.textContent=availableRows.length;
    if(sc)sc.textContent=assignedRows.length;
    availableList.querySelector('.category-provider-empty')?.remove();
    assignedList.querySelector('.category-provider-empty')?.remove();
    if(!availableRows.length)availableList.insertAdjacentHTML('beforeend','<div class="category-provider-empty">No available games.</div>');
    if(!assignedRows.length)assignedList.insertAdjacentHTML('beforeend','<div class="category-provider-empty">No assigned games.</div>');
  }
  function rebuildPromoProviderCards(existingRules=new Map()){
    const root=$('promoGameAccessConfig');
    const rulesBox=root?.querySelector('.promo-provider-rules');
    if(!rulesBox)return;
    const codes=selectedPromotionProviderCodes();
    rulesBox.innerHTML=codes.map(code=>{
      const provider=promoProviders.find(p=>promoGameProviderCode(p)===code)||{code,name:code};
      const games=promoGames.filter(g=>promoGameProviderCode(g)===code);
      const existing=existingRules.get(code)||{mode:'ALL',gameTokens:[]};
      const selected=new Set((existing.gameTokens||[]).map(String));
      const mode=String(existing.mode||'ALL').toUpperCase()==='SELECTED'?'SELECTED':'ALL';
      const available=games.filter(g=>!selected.has(promoGameCode(g))).map(g=>promoGameAssignmentRow(g,false)).join('');
      const assigned=games.filter(g=>selected.has(promoGameCode(g))).map(g=>promoGameAssignmentRow(g,true)).join('');
      return `<section class="category-provider-rule promo-provider-rule" data-provider-code="${esc(code)}">
        <div class="category-provider-rule-head">
          <div class="category-provider-rule-title"><span class="category-provider-rule-icon"><i class="bi bi-controller"></i></span><div><b>${esc(promoGameProviderName(provider)||code)}</b><small>${games.length} game(s) available</small></div></div>
          <div class="category-provider-mode-switch" role="radiogroup" aria-label="Allowed games mode">
            <label><input type="radio" name="promoProviderMode_${esc(code)}" value="ALL" ${mode!=='SELECTED'?'checked':''}><span><i class="bi bi-collection-play"></i> All Games</span></label>
            <label><input type="radio" name="promoProviderMode_${esc(code)}" value="SELECTED" ${mode==='SELECTED'?'checked':''}><span><i class="bi bi-check2-square"></i> Selected Games</span></label>
          </div>
        </div>
        <div class="category-provider-assignment" ${mode==='SELECTED'?'':'hidden'}>
          <div class="category-provider-assignment-note"><i class="bi bi-info-circle"></i><span>Assigning allowed games to: <b>${esc(promoGameProviderName(provider)||code)}</b></span></div>
          <div class="category-provider-assignment-grid">
            <div class="category-provider-game-column"><div class="category-provider-column-head"><div><b>Available Games</b><small class="available-count">${games.length-selected.size}</small></div><input class="category-provider-game-search" data-side="available" type="search" placeholder="Search games..."></div><div class="category-provider-game-list available-list">${available||'<div class="category-provider-empty">No available games.</div>'}</div></div>
            <div class="category-provider-game-column"><div class="category-provider-column-head"><div><b>Assigned Games</b><small class="assigned-count">${selected.size}</small></div><input class="category-provider-game-search" data-side="assigned" type="search" placeholder="Search games..."></div><div class="category-provider-game-list assigned-list">${assigned||'<div class="category-provider-empty">No assigned games.</div>'}</div></div>
          </div>
        </div>
      </section>`;
    }).join('')||'<div class="category-provider-empty-state"><i class="bi bi-controller"></i><b>No provider restriction selected</b><small>This promotion is allowed for all games/providers.</small></div>';
  }
  function syncAllowedGamesField(){
    const field=$('promoAllowedGames');
    if(!field)return '';
    const tokens=[];
    currentPromoProviderRules().forEach(rule=>{
      if(rule.mode==='SELECTED') tokens.push(...rule.gameTokens);
      else tokens.push(rule.providerCode);
    });
    tokens.push(...promoLegacyAllowedTokens);
    const unique=[...new Set(tokens.map(v=>String(v).trim()).filter(Boolean))];
    field.value=unique.join(',');
    updatePromoAllowedSummary();
    return field.value;
  }
  function updatePromoAllowedSummary(){
    const root=$('promoGameAccessConfig');
    const summary=root?.querySelector('.promo-game-access-summary');
    if(!summary)return;
    const rules=[...currentPromoProviderRules().values()];
    const allProviders=rules.filter(r=>r.mode!=='SELECTED').length;
    const selectedGames=rules.reduce((n,r)=>n+(r.mode==='SELECTED'?r.gameTokens.length:0),0);
    let text=!rules.length&&!promoLegacyAllowedTokens.length?'All games/providers allowed':`${allProviders} provider(s) all games · ${selectedGames} individually selected game(s)`;
    if(promoLegacyAllowedTokens.length) text+=` · ${promoLegacyAllowedTokens.length} legacy rule(s) preserved`;
    summary.innerHTML=`<i class="bi bi-shield-check"></i><span>${esc(text)}</span>`;
  }
  function applyAllowedGamesToSelector(value){
    const root=$('promoGameAccessConfig');
    if(!root||!promoProviders.length)return;
    const tokens=splitAllowedGameTokens(value);
    const providerCodes=new Set(promoProviders.map(p=>promoGameProviderCode(p)));
    const gameByToken=new Map();
    promoGames.forEach(g=>{
      const token=promoGameCode(g);
      if(token)gameByToken.set(token.toUpperCase(),g);
    });
    const rules=new Map();
    promoLegacyAllowedTokens=[];
    tokens.forEach(raw=>{
      const key=String(raw).toUpperCase();
      if(providerCodes.has(key)){
        rules.set(key,{providerCode:key,mode:'ALL',gameTokens:[]});
      }else if(gameByToken.has(key)){
        const game=gameByToken.get(key), code=promoGameProviderCode(game);
        if(!code){promoLegacyAllowedTokens.push(raw);return;}
        const existing=rules.get(code);
        if(existing?.mode==='ALL')return;
        const rule=existing||{providerCode:code,mode:'SELECTED',gameTokens:[]};
        rule.mode='SELECTED';
        if(!rule.gameTokens.includes(promoGameCode(game)))rule.gameTokens.push(promoGameCode(game));
        rules.set(code,rule);
      }else promoLegacyAllowedTokens.push(raw);
    });
    root.querySelectorAll('.promo-provider-choice input').forEach(input=>{
      input.checked=rules.has(String(input.value).toUpperCase());
      input.closest('.promo-provider-choice')?.classList.toggle('is-selected',input.checked);
    });
    rebuildPromoProviderCards(rules);
    updatePromoAllowedSummary();
  }
  function renderPromoGameAccessShell(){
    const root=$('promoGameAccessConfig');
    if(!root)return;
    root.innerHTML=`<div class="promo-game-access-summary"><i class="bi bi-shield-check"></i><span>All games/providers allowed</span></div>
      <div class="promo-game-access-section-title"><b>Select Provider</b><small>Choose one or more providers to restrict this promotion.</small></div>
      <div class="category-provider-selector promo-provider-selector">${promoProviders.map(p=>{const code=promoGameProviderCode(p);return `<label class="category-provider-choice promo-provider-choice" role="button"><input type="checkbox" value="${esc(code)}"><span class="category-provider-choice-name">${esc(promoGameProviderName(p)||code)}</span></label>`;}).join('')||'<small class="text-muted">No active provider available.</small>'}</div>
      <div class="category-provider-rules promo-provider-rules"></div>`;
    rebuildPromoProviderCards(new Map());
  }
  async function loadPromotionGameConfig(){
    const root=$('promoGameAccessConfig');
    try{
      const [providersJson,gamesJson]=await Promise.all([req(promoApi('GAME_PROVIDER_LIST')+'?_='+Date.now()),req(promoApi('GAME_LIST')+'?_='+Date.now())]);
      promoProviders=(Array.isArray(providersJson.data)?providersJson.data:[]).filter(x=>Number(x.status??1)===1);
      promoGames=Array.isArray(gamesJson.data)?gamesJson.data:[];
      renderPromoGameAccessShell();
      applyAllowedGamesToSelector($('promoAllowedGames')?.value||'');
    }catch(err){
      if(root)root.innerHTML=`<div class="promo-game-access-error"><i class="bi bi-exclamation-triangle"></i><span>Unable to load provider/game list: ${esc(err.message||'Request failed')}</span></div>`;
    }
  }
  function resetPromoGameAccess(){
    promoLegacyAllowedTokens=[];
    if($('promoAllowedGames'))$('promoAllowedGames').value='';
    const root=$('promoGameAccessConfig');
    root?.querySelectorAll('.promo-provider-choice input').forEach(input=>{input.checked=false;input.closest('.promo-provider-choice')?.classList.remove('is-selected');});
    rebuildPromoProviderCards(new Map());
    updatePromoAllowedSummary();
  }

  function initDetailEditor(){
    const textarea=$('promoDetailText');
    const editor=$('promoDetailEditor');
    const toolbar=$('promoDetailToolbar');
    if(!textarea||!editor||!toolbar)return;

    function syncToTextarea(){
      textarea.value = detailHtmlMode ? editor.textContent : editor.innerHTML;
    }
    function setEditorContent(html){
      textarea.value = html || '';
      if(detailHtmlMode){ editor.textContent = html || ''; }
      else { editor.innerHTML = html || ''; }
    }
    function exec(cmd,value=null){
      if(detailHtmlMode && cmd!=='toggleHtml') return;
      editor.focus();
      document.execCommand(cmd,false,value);
      syncToTextarea();
    }

    toolbar.addEventListener('click',e=>{
      const btn=e.target.closest('[data-cmd]');
      if(!btn)return;
      e.preventDefault();
      const cmd=btn.dataset.cmd;
      if(cmd==='formatBlock') exec('formatBlock',btn.dataset.value||'P');
      else if(cmd==='insertCheck') exec('insertHTML','<p>✅ Type requirement here</p>');
      else if(cmd==='insertCross') exec('insertHTML','<p>❌ Type restriction here</p>');
      else if(cmd==='insertHr') exec('insertHTML','<hr>');
      else if(cmd==='clear') exec('removeFormat');
      else if(cmd==='toggleHtml'){
        detailHtmlMode=!detailHtmlMode;
        btn.classList.toggle('active',detailHtmlMode);
        btn.textContent=detailHtmlMode?'Preview Mode':'HTML Mode';
        if(detailHtmlMode){ editor.textContent=textarea.value||editor.innerHTML; editor.classList.add('html-mode'); }
        else { editor.innerHTML=editor.textContent||textarea.value; editor.classList.remove('html-mode'); }
        syncToTextarea();
      } else exec(cmd);
    });
    editor.addEventListener('input',syncToTextarea);
    textarea._setEditorContent=setEditorContent;
    textarea._syncEditor=syncToTextarea;
    setEditorContent(textarea.value||'');
  }

  function syncEditor(){ const t=$('promoDetailText'); if(t&&t._syncEditor)t._syncEditor(); }
  function setDetailEditorContent(html){ const t=$('promoDetailText'); if(t&&t._setEditorContent)t._setEditorContent(html||''); else if(t)t.value=html||''; }

  function togglePolicyField(name,show){ document.querySelectorAll(`[data-policy-field="${name}"]`).forEach(el=>el.classList.toggle('policy-hidden',!show)); }
  function updatePolicyVisibility(){
    const deadline=val('promoCompletionDeadlineMode');
    togglePolicyField('completion-days',deadline==='DAYS_AFTER_CLAIM');
    togglePolicyField('completion-fixed',deadline==='FIXED_DATE');
    const policy=val('promoRebatePolicy');
    const conditional=policy==='CONDITIONAL';
    togglePolicyField('rebate-condition',conditional);
    const cond=val('promoRebateStartCondition');
    const balance=conditional && (cond==='ELIGIBLE_BALANCE_BELOW'||cond==='BALANCE_BELOW_AND_NEW_DEPOSIT');
    togglePolicyField('eligible-balance-type',balance);
    togglePolicyField('eligible-balance-threshold',balance);
    const wr=val('promoWithdrawalRestriction');
    togglePolicyField('max-withdraw',wr!=='NONE'&&wr!=='MANUAL_REVIEW');
    togglePolicyField('excess-action',wr!=='NONE');
  }
  function validatePolicy(){
    const displayStart=val('promoStartAt'),displayEnd=val('promoEndAt');
    if(displayStart&&displayEnd&&new Date(displayEnd)<=new Date(displayStart)) throw new Error('Display End must be later than Display Start');
    const start=val('promoClaimStartAt'),end=val('promoClaimEndAt');
    if(start&&end&&new Date(end)<=new Date(start)) throw new Error('Claim End must be later than Claim Start');
    const deadline=val('promoCompletionDeadlineMode');
    if(deadline==='DAYS_AFTER_CLAIM'&&num('promoCompletionDays')<=0) throw new Error('Completion Days must be greater than 0');
    if(deadline==='FIXED_DATE'&&!val('promoCompletionFixedAt')) throw new Error('Fixed Completion Date is required');
    if(val('promoRebatePolicy')==='CONDITIONAL'){
      const cond=val('promoRebateStartCondition');
      if((cond==='ELIGIBLE_BALANCE_BELOW'||cond==='BALANCE_BELOW_AND_NEW_DEPOSIT')&&num('promoEligibleBalanceThreshold')===null) throw new Error('Eligible Balance Threshold is required');
    }
    const wr=val('promoWithdrawalRestriction');
    if(wr!=='NONE'&&wr!=='MANUAL_REVIEW'&&(num('promoMaxWithdraw')===null||num('promoMaxWithdraw')<=0)) throw new Error('Max Withdraw / Multiplier Value must be greater than 0');
  }


  // reports.js replaces native selects with a rounded visual button. Setting
  // select.value alone updates the hidden native select but not that visual button.
  // Always emit change/input so the visible label mirrors the exact DB value.
  function notifySelect(el){
    if(!el)return;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function setSelectExact(id, value, fallback){
    const el=$(id);
    if(!el)return;
    const isEditing=Number($('promoId')?.value||0)>0;
    if(isEditing && (value===null||value===undefined||value==='')){
      throw new Error('Latest API data is missing '+id+'; edit was stopped to avoid showing a false default');
    }
    const wanted=String(value ?? fallback);
    const exists=[...el.options].some(o=>o.value===wanted);
    if(!exists && isEditing) throw new Error('Unsupported database value for '+id+': '+wanted);
    el.value=exists?wanted:String(fallback);
    notifySelect(el);
  }
  function refreshVisibleSelects(root){
    (root||form).querySelectorAll('select').forEach(notifySelect);
    // One more frame handles a select wrapper created just after the DB response.
    requestAnimationFrame(()=> (root||form).querySelectorAll('select').forEach(notifySelect));
  }

  // Section values are loaded from the selected promotion record exactly as returned
  // by the database. We no longer derive/overwrite edit values from another row.
  function applyCategorySectionLayoutForNewItem(){
    const categoryId=val('promoBonusCategoryTitleId');
    if(!categoryId || num('promoId')!==null)return;
    const source=rows.find(x=>String(x.bonusCategoryTitleId)===String(categoryId));
    if(!source)return;
    setSelectExact('promoDesktopColumns', source.desktopColumns, 2);
    setSelectExact('promoMobileColumns', source.mobileColumns, 1);
    setSelectExact('promoSingleLeft', source.singleLeft, 0);
  }

  function clampSpanSelects(){
    const dc=Number(val('promoDesktopColumns')||2), mc=Number(val('promoMobileColumns')||1);
    const ds=$('promoDesktopSpan'), ms=$('promoMobileSpan');
    if(ds && Number(ds.value)>dc) ds.value=String(dc);
    if(ms && Number(ms.value)>mc) ms.value=String(mc);
  }

  function payload(){
    syncEditor();
    syncAllowedGamesField();
    const fd=new FormData();
    const id=num('promoId'); if(id!=null) fd.append('id',id);
    const name=val('promoItemName') || val('promoName');
    const fields={
      name:name,
      promotionCode:val('promoCode'),
      bonusCategoryTitleId:num('promoBonusCategoryTitleId'),
      linkUrl:val('promoLinkUrl'),
      desktopColumns:num('promoDesktopColumns'),
      mobileColumns:num('promoMobileColumns'),
      desktopSpan:num('promoDesktopSpan'),
      mobileSpan:num('promoMobileSpan'),
      singleLeft:num('promoSingleLeft'),
      bonusType:val('promoBonusType'),claimCondition:val('promoClaimCondition'),bonusPercentage:num('promoPercentage'),bonusFixedAmount:num('promoFixed'),bonusRandomMin:num('promoRandomMin'),bonusRandomMax:num('promoRandomMax'),maxPayout:num('promoMaxPayout'),minTopupAmount:num('promoMinTopup'),maxTopupAmount:num('promoMaxTopup'),minTimesOfTopup:num('promoMinTimes'),claimLimit:num('promoClaimLimit'),claimReset:val('promoClaimReset'),rollover:num('promoRollover'),turnover:num('promoTurnover'),maxWithdraw:num('promoMaxWithdraw'),description:val('promoDescription'),detailText:val('promoDetailText'),displayAmount:num('promoDisplayAmount'),freeCreditWallet:val('promoWallet'),allowedGames:val('promoAllowedGames'),displayOrder:num('promoDisplayOrder'),status:num('promoStatus'),startAt:val('promoStartAt'),endAt:val('promoEndAt'),claimStartAt:val('promoClaimStartAt'),claimEndAt:val('promoClaimEndAt'),completionDeadlineMode:val('promoCompletionDeadlineMode'),completionDays:num('promoCompletionDays'),completionFixedAt:val('promoCompletionFixedAt'),rebatePolicy:val('promoRebatePolicy'),rebateStartCondition:val('promoRebateStartCondition'),eligibleBalanceType:val('promoEligibleBalanceType'),eligibleBalanceThreshold:num('promoEligibleBalanceThreshold'),newDepositRequired:num('promoNewDepositRequired'),canClaimRebate:val('promoCanClaimRebate'),completionMode:val('promoCompletionMode'),rewardClaimMode:val('promoRewardClaimMode'),walletConsumptionPriority:val('promoWalletConsumptionPriority'),winAllocationRule:val('promoWinAllocationRule'),withdrawalRestriction:val('promoWithdrawalRestriction'),excessBalanceAction:val('promoExcessBalanceAction'),claimableVipTiers:selectedVipTierCsv(),eligibleForDailyRebate:num('promoEligibleForDailyRebate')
    };
    Object.entries(fields).forEach(([k,v])=>{ if(v!==null && v!==undefined) fd.append(k,v); });
    if(selectedPromoImage) fd.append('image', selectedPromoImage);
    return fd;
  }

  function reset(){
    form.reset();
    resetPromoGameAccess();
    $('promoId').value='';
    if($('promoCode')) $('promoCode').value='';
    if($('promoBonusCategoryTitleId')) $('promoBonusCategoryTitleId').value='';
    clearImagePreview();
    $('promoClaimLimit').value='1';
    $('promoDisplayOrder').value='0';
    if($('promoRebatePolicy')) $('promoRebatePolicy').value='DISABLED';
    if($('promoEligibleForDailyRebate')) $('promoEligibleForDailyRebate').value='1';
    renderPromotionVipOptions('');
    if($('promoStartAt')) $('promoStartAt').value='';
    if($('promoEndAt')) $('promoEndAt').value='';
    if($('promoClaimStartAt')) $('promoClaimStartAt').value='';
    if($('promoClaimEndAt')) $('promoClaimEndAt').value='';
    if($('promoCompletionDeadlineMode')) $('promoCompletionDeadlineMode').value='NO_EXPIRY';
    if($('promoWithdrawalRestriction')) $('promoWithdrawalRestriction').value='NONE';
    updatePolicyVisibility();
    setDetailEditorContent('');
    $('promoFormTitle').textContent='Create Promotion';
    set('','');
    refreshVisibleSelects(form);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function fill(raw){
    const x=normalizePromotion(raw);
    $('promoId').value=x.id||'';
    $('promoName').value=x.name||'';
    if($('promoCode')) $('promoCode').value=x.promotionCode||'';
    if($('promoItemName')) $('promoItemName').value=x.name||'';
    ensureCategoryOption(x);
    if($('promoLinkUrl')) $('promoLinkUrl').value=x.linkUrl||'';
    setSelectExact('promoDesktopColumns', x.desktopColumns, 2);
    setSelectExact('promoMobileColumns', x.mobileColumns, 1);
    setSelectExact('promoDesktopSpan', x.desktopSpan, 1);
    setSelectExact('promoMobileSpan', x.mobileSpan, 1);
    setSelectExact('promoSingleLeft', x.singleLeft, 0);
    // Do not call category-derived layout here: edit must mirror this DB row exactly.
    clampSpanSelects();
    clearImagePreview();
    if(x.bonusImageUrl) showImagePreview(x.bonusImageUrl);
    $('promoBonusType').value=x.bonusType||'FIXED';
    renderPromotionVipOptions(x.claimableVipTiers||'');
    if($('promoEligibleForDailyRebate')) $('promoEligibleForDailyRebate').value=String(x.eligibleForDailyRebate??1);
    $('promoClaimCondition').value=x.claimCondition||'MANUAL';
    $('promoPercentage').value=x.bonusPercentage??'';
    $('promoFixed').value=x.bonusFixedAmount??'';
    $('promoRandomMin').value=x.bonusRandomMin??'';
    $('promoRandomMax').value=x.bonusRandomMax??'';
    $('promoMaxPayout').value=x.maxPayout??'';
    $('promoMinTopup').value=x.minTopupAmount??'';
    $('promoMaxTopup').value=x.maxTopupAmount??'';
    $('promoMinTimes').value=x.minTimesOfTopup??'';
    $('promoClaimLimit').value=x.claimLimit??1;
    $('promoClaimReset').value=x.claimReset||'NONE';
    $('promoRollover').value=x.rollover??'';
    $('promoTurnover').value=x.turnover??'';
    $('promoMaxWithdraw').value=x.maxWithdraw??'';
    $('promoDescription').value=x.description||'';
    setDetailEditorContent(x.detailText||'');
    $('promoDisplayAmount').value=String(x.displayAmount??1);
    $('promoWallet').value=x.freeCreditWallet||'MAIN_WALLET';
    $('promoAllowedGames').value=x.allowedGames||'';
    promotionGameConfigReady.then(()=>applyAllowedGamesToSelector(x.allowedGames||''));
    $('promoDisplayOrder').value=x.displayOrder??0;
    $('promoStatus').value=String(x.status??1);
    const dt=v=>v?String(v).slice(0,16):''; $('promoStartAt').value=dt(x.startAt); $('promoEndAt').value=dt(x.endAt); $('promoClaimStartAt').value=dt(x.claimStartAt); $('promoClaimEndAt').value=dt(x.claimEndAt); $('promoCompletionDeadlineMode').value=x.completionDeadlineMode||'NO_EXPIRY'; $('promoCompletionDays').value=x.completionDays??''; $('promoCompletionFixedAt').value=dt(x.completionFixedAt); $('promoRebatePolicy').value=x.rebatePolicy||'DISABLED'; $('promoRebateStartCondition').value=x.rebateStartCondition||'PROMOTION_COMPLETED'; $('promoEligibleBalanceType').value=x.eligibleBalanceType||'MAIN_PLUS_BONUS'; $('promoEligibleBalanceThreshold').value=x.eligibleBalanceThreshold??''; $('promoNewDepositRequired').value=String(x.newDepositRequired??0); $('promoCanClaimRebate').value=x.canClaimRebate||'AFTER_PROMOTION_COMPLETED'; $('promoCompletionMode').value=x.completionMode||'AUTO_COMPLETE'; $('promoRewardClaimMode').value=x.rewardClaimMode||'NO_ADDITIONAL_CLAIM'; $('promoWalletConsumptionPriority').value=x.walletConsumptionPriority||'BONUS_FIRST'; $('promoWinAllocationRule').value=x.winAllocationRule||'RETURN_TO_STAKE_SOURCE'; $('promoWithdrawalRestriction').value=x.withdrawalRestriction||'NONE'; $('promoExcessBalanceAction').value=x.excessBalanceAction||'KEEP_LOCKED';
    updatePolicyVisibility();
    $('promoFormTitle').textContent='Edit Promotion #'+x.id;
    refreshVisibleSelects(form);
    set('Editing promotion. Save to update.','success');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function filteredRows(){
    const q=(searchInput?.value||'').trim().toLowerCase();
    const cat=categoryFilter?.value||'';
    const status=statusFilter?.value||'';
    const mode=sortFilter?.value||'orderAsc';
    const result=rows.filter(x=>{
      const name=String(x.name||'').toLowerCase();
      const cname=String(x.bonusCategoryTitleName||categoryName(x.bonusCategoryTitleId)||'').toLowerCase();
      return (!q || name.includes(q) || cname.includes(q)) && (!cat || String(x.bonusCategoryTitleId)===cat) && (!status || String(x.status)===status);
    });
    result.sort((a,b)=>{
      if(mode==='orderDesc') return Number(b.displayOrder||0)-Number(a.displayOrder||0);
      if(mode==='nameAsc') return String(a.name||'').localeCompare(String(b.name||''));
      if(mode==='nameDesc') return String(b.name||'').localeCompare(String(a.name||''));
      return Number(a.displayOrder||0)-Number(b.displayOrder||0);
    });
    return result;
  }

  function render(){
    const filtered=filteredRows();
    const pageSize=Number(($('promoPageSize')&&$('promoPageSize').value)||20);
    const pages=Math.ceil(filtered.length/pageSize); if(pages===0)promoPage=0; else promoPage=Math.min(promoPage,pages-1);
    const start=promoPage*pageSize, visible=filtered.slice(start,start+pageSize);
    list.innerHTML=''; empty.hidden=filtered.length>0;
    const active=rows.filter(x=>Number(x.status)===1).length;
    if(totalCount) totalCount.textContent=rows.length;
    if(activeCount) activeCount.textContent=active;
    if(activePercent) activePercent.textContent=(rows.length?Math.round(active*100/rows.length):0)+'% of total';
    if(showingText) showingText.textContent=`Showing ${filtered.length?start+1:0} to ${Math.min(start+pageSize,filtered.length)} of ${filtered.length} entries`;
    visible.forEach(x=>{
      const d=document.createElement('div'); d.className='promotion-table-row';
      const category=x.bonusCategoryTitleName||categoryName(x.bonusCategoryTitleId)||'No Category';
      const desc=(x.description||x.detailText||'').replace(/<[^>]*>/g,'').slice(0,120);
      d.innerHTML=`
        <div class="promotion-main-cell">
          <div class="promotion-thumb">${x.bonusImageUrl?`<img src="${esc(x.bonusImageUrl)}" alt="${esc(x.name||'Promotion')}">`:'<i class="bi bi-image"></i>'}</div>
          <div class="promotion-copy"><b>${esc(x.name||'-')}</b><small>${esc(x.promotionCode||('PROMO-'+x.id))} <span>•</span> ${esc(category)} <span>•</span> Order: ${esc(x.displayOrder??0)}</small><p>${esc(desc||x.ruleText||'No description')}</p></div>
        </div>
        <div class="promotion-detail-cell"><span class="promo-chip">${esc(x.claimCondition||'MANUAL')}</span><span class="promo-chip">${esc(x.bonusType||'FIXED')}</span><small>Rebate: ${esc((x.rebatePolicy||'DISABLED').replaceAll('_',' '))}</small></div>
        <div class="promotion-status-cell"><span class="slider-pill ${Number(x.status)===1?'active':'inactive'}"><i class="bi ${Number(x.status)===1?'bi-check-circle':'bi-pause-circle'}"></i>${Number(x.status)===1?'Active':'Inactive'}</span></div>
        <div class="promotion-action-cell"><button class="icon-action-btn" title="Clone" aria-label="Clone" data-clone="${x.id}"><i class="bi bi-copy"></i></button><button class="icon-action-btn edit edit-btn" title="Edit" aria-label="Edit" data-edit="${x.id}"><i class="bi bi-pencil-square"></i></button><button class="icon-action-btn delete btn-delete" title="Delete" aria-label="Delete" data-del="${x.id}"><i class="bi bi-trash"></i></button></div>`;
      list.appendChild(d);
    });
    const pager=$('promoPager'); if(pager){let h=`<button class="page-btn" ${promoPage<=0?'disabled':''} data-p="${promoPage-1}"><i class="bi bi-chevron-left"></i></button>`;for(let i=Math.max(0,promoPage-2);i<=Math.min(pages-1,promoPage+2);i++)h+=`<button class="page-btn ${i===promoPage?'active':''}" data-p="${i}">${i+1}</button>`;h+=`<button class="page-btn" ${promoPage>=pages-1||!pages?'disabled':''} data-p="${promoPage+1}"><i class="bi bi-chevron-right"></i></button>`;pager.innerHTML=h;}
  }

  async function req(url,opt){opt=opt||{};const u=window.BO_AUTH&&BO_AUTH.user?BO_AUTH.user():{};const actor=u.username||u.displayName||localStorage.getItem('adminUsername')||localStorage.getItem('admin_username')||'ADMIN';opt.headers=Object.assign({},window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{}, {'X-Admin-Username':actor,'Cache-Control':'no-cache','Pragma':'no-cache'},opt.headers||{});opt.cache=opt.cache||'no-store';const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  async function load(){set('Loading...','');const j=await req(promoApi('PROMOTION_LIST')+'?_='+Date.now());rows=(Array.isArray(j.data)?j.data:[]).map(normalizePromotion);render();set('','');}

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      if(!val('promoName'))throw new Error('Name is required');
      validatePolicy();
      set('Saving...','');
      await req(promoApi('PROMOTION_SAVE_FORM'),{method:'POST',body:payload()});
      set('Saved successfully','success');
      reset();
      load();
    }catch(err){set(err.message,'error');}
  });
  $('promoResetBtn').onclick=reset;
  $('promoRefreshBtn').onclick=load;
  $('applyPromoFilters').onclick=()=>{promoPage=0;render();};
  $('resetPromoFilters').onclick=()=>{ if(searchInput)searchInput.value=''; if(categoryFilter)categoryFilter.value=''; if(statusFilter)statusFilter.value=''; if(sortFilter)sortFilter.value='orderAsc'; promoPage=0; render(); };
  searchInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();render();}});
  list.addEventListener('click',async e=>{
    const eb=e.target.closest('[data-edit]'),cb=e.target.closest('[data-clone]'),db=e.target.closest('[data-del]');
    if(eb){
      try{
        set('Loading exact promotion row from database...','');
        const detailUrl=promoApi('PROMOTION_DETAIL').replace('{id}',eb.dataset.edit);
        const detailResponse=await req(detailUrl+(detailUrl.includes('?')?'&':'?')+'_='+Date.now());
        const fresh=normalizePromotion(detailResponse.data||{});
        if(String(fresh.id)!==String(eb.dataset.edit)) throw new Error('Promotion detail response does not match the selected ID');
        const required=['bonusCategoryTitleId','desktopColumns','mobileColumns','desktopSpan','mobileSpan'];
        const missing=required.filter(k=>fresh[k]===null||fresh[k]===undefined||fresh[k]==='');
        if(missing.length) throw new Error('Exact promotion detail is missing database fields: '+missing.join(', '));
        reset();
        fill(fresh);
        set('','');
      }catch(err){set(err.message||'Unable to load promotion','error');}
    } if(cb&&await BO_DIALOG.confirm('Clone this promotion as an inactive draft?',{title:'Clone Promotion',confirmText:'Clone'})){await req(promoApi('PROMOTION_CLONE').replace('{id}',cb.dataset.clone),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});load();}
    if(db&&await BO_DIALOG.confirm('Delete this promotion?', {title:'Delete Promotion', confirmText:'Delete'})){await req(promoApi('PROMOTION_DELETE'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:Number(db.dataset.del)})});load();}
  });

  $('promoGameAccessConfig')?.addEventListener('change',e=>{
    const providerInput=e.target.closest('.promo-provider-choice input');
    if(providerInput){
      const existing=currentPromoProviderRules();
      providerInput.closest('.promo-provider-choice')?.classList.toggle('is-selected',providerInput.checked);
      rebuildPromoProviderCards(existing);
      syncAllowedGamesField();
      return;
    }
    const modeInput=e.target.closest('.promo-provider-rule input[type="radio"]');
    if(modeInput){
      const card=modeInput.closest('.promo-provider-rule');
      const assignment=card?.querySelector('.category-provider-assignment');
      if(assignment)assignment.hidden=modeInput.value!=='SELECTED';
      syncAllowedGamesField();
    }
  });
  $('promoGameAccessConfig')?.addEventListener('click',e=>{
    const btn=e.target.closest('.category-provider-game-action');
    if(!btn)return;
    const row=btn.closest('.category-provider-game-row'), card=btn.closest('.promo-provider-rule');
    if(!row||!card)return;
    row.classList.toggle('is-assigned');
    const assigned=row.classList.contains('is-assigned');
    btn.classList.toggle('add',!assigned);btn.classList.toggle('remove',assigned);
    btn.innerHTML=`<i class="bi ${assigned?'bi-dash-lg':'bi-plus-lg'}"></i>`;
    btn.setAttribute('aria-label',assigned?'Remove game':'Add game');
    refreshPromoAssignmentCard(card);
    syncAllowedGamesField();
  });
  $('promoGameAccessConfig')?.addEventListener('input',e=>{
    const input=e.target.closest('.category-provider-game-search');
    if(!input)return;
    const card=input.closest('.promo-provider-rule');
    const side=input.dataset.side;
    const list=card?.querySelector(side==='assigned'?'.assigned-list':'.available-list');
    const q=input.value.trim().toLowerCase();
    list?.querySelectorAll('.category-provider-game-row').forEach(row=>{row.hidden=!!q&&!String(row.dataset.search||'').includes(q);});
  });

  $('promoPageSize')?.addEventListener('change',()=>{promoPage=0;render();});
  $('promoPager')?.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b||b.disabled)return;promoPage=Number(b.dataset.p);render();});
  const promoImageInput=$('promoImage');
  if(promoImageInput){ promoImageInput.addEventListener('change',()=>{ const f=promoImageInput.files&&promoImageInput.files[0]; selectedPromoImage=f||null; if(f) showImagePreview(URL.createObjectURL(f)); }); }
  $('promoBonusCategoryTitleId')?.addEventListener('change',()=>{ applyCategorySectionLayoutForNewItem(); clampSpanSelects(); });
  $('promoDesktopColumns')?.addEventListener('change',clampSpanSelects);
  $('promoMobileColumns')?.addEventListener('change',clampSpanSelects);
  ['promoCompletionDeadlineMode','promoRebatePolicy','promoRebateStartCondition','promoWithdrawalRestriction'].forEach(id=>$(id)?.addEventListener('change',updatePolicyVisibility));
  updatePolicyVisibility();
  initDetailEditor();
  promotionGameConfigReady=loadPromotionGameConfig();
  loadCategoryTitles().then(()=>load()).catch(e=>set(e.message,'error'));
  loadPromotionVipLevels();
})();
