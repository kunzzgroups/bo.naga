function adminApi(pathKey) { return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }
function escapeHtml(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function statusPill(value) { const active = Number(value) === 1; return `<span class="slider-pill ${active ? 'active' : 'inactive'}"><i class="bi ${active ? 'bi-check-circle' : 'bi-pause-circle'}"></i>${active ? 'Active' : 'Inactive'}</span>`; }
async function fetchJson(url, options) { const res = await fetch(url, options); const json = await res.json().catch(() => ({})); if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed'); return json; }

const PROVIDER_API = { list: adminApi('GAME_PROVIDER_LIST'), create: adminApi('GAME_PROVIDER_CREATE'), update: adminApi('GAME_PROVIDER_UPDATE'), delete: adminApi('GAME_PROVIDER_DELETE') };
const GAME_API = { list: adminApi('GAME_LIST') };
const CATEGORY_API = { list: adminApi('GAME_CATEGORY_LIST') };
const WALLET_API = {
  createPlayer: adminApi('PROVIDER_WALLET_CREATE_PLAYER'),
  balance: adminApi('PROVIDER_WALLET_BALANCE'),
  deposit: adminApi('PROVIDER_WALLET_DEPOSIT'),
  withdraw: adminApi('PROVIDER_WALLET_WITHDRAW'),
  launchSport: adminApi('PROVIDER_WALLET_LAUNCH_SPORT'),
  apiPreview: adminApi('PROVIDER_WALLET_API_PREVIEW'),
  mainBalance: adminApi('MEMBER_WALLET_BALANCE'),
  mainAdjust: adminApi('MEMBER_WALLET_ADJUST'),
  pullLogDebug: adminApi('LIVE22_PULL_LOG_DEBUG')
};
const PROVIDER_GAME_API = { sync: adminApi('PROVIDER_GAME_SYNC'), debug: adminApi('PROVIDER_GAME_DEBUG') };
const CALLBACK_API = { previewBase: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PROVIDER_CALLBACK_PREVIEW, report: adminApi('WALLET_LEDGER_SUMMARY') };

(function(){
  const form = document.getElementById('providerForm'); if (!form) return;
  let tenantMode=false; let tenantContextLoaded=false;
  const list = document.getElementById('providerList'), empty = document.getElementById('providerEmpty'), statusBox = document.getElementById('providerStatusBox');
  const ids = ['providerId','providerCode','providerName','providerType','providerCategoryIds','providerImageUrl','providerBrandImageUrl','walletMode','integrationType','httpMethod','currency','apiBaseUrl','operatorId','secretKey','keyEnvironment','boLoginUrl','boUsername','boPassword','providerVariables','apiActionConfigs','signatureType','signatureOutputCase','signatureTemplate','ukeyLength','ukeyPrefix','ukeyStaticValue','createPlayerPath','balancePath','depositPath','withdrawPath','launchPath','gameListPath','createPlayerRequestTemplate','balanceRequestTemplate','depositRequestTemplate','withdrawRequestTemplate','launchRequestTemplate','gameListRequestTemplate','responseBalancePath','responseLaunchUrlPath','responseGameListPath','responseGameCodePath','responseGameNamePath','responseGameImagePath','gameImageApiUrlTemplate','gameImageRemoteApiUrlTemplate','gameImageRemoteApiHttpMethod','gameImageRemoteApiRequestTemplate','gameImageRemoteApiResponsePath','gameImageFallbackUrlTemplate','frontendGameFallbackImageUrl','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse','sortOrder','providerStatus'];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const title = document.getElementById('providerFormTitle'), saveBtn = document.getElementById('saveProviderBtn'), refreshBtn = document.getElementById('refreshProviderBtn'), resetBtn = document.getElementById('resetProviderBtn');
  const walletFlow = document.getElementById('walletFlow');
  const withdrawNegativeAmount = document.getElementById('withdrawNegativeAmount');
  const pullLogTimingEnabled = document.getElementById('pullLogTimingEnabled');
  const pullLogWindowValue = document.getElementById('pullLogWindowValue');
  const pullLogWindowUnit = document.getElementById('pullLogWindowUnit');
  const pullLogEndDelaySeconds = document.getElementById('pullLogEndDelaySeconds');
  const pullLogTimezone = document.getElementById('pullLogTimezone');
  const pullLogDateTimeFormat = document.getElementById('pullLogDateTimeFormat');
  const walletProviderCode = document.getElementById('walletProviderCode'), walletStatusBox = document.getElementById('walletStatusBox'), walletResult = document.getElementById('walletResult');
  let rows = [];
  let categories = [];
  function setStatus(message, type){ statusBox.textContent = message || ''; statusBox.className = 'upload-status' + (type ? ' ' + type : ''); const top=document.getElementById('providerStatusBoxTop'); if(top){ top.textContent=message||''; top.className=statusBox.className; } }
  function setBusy(busy){ saveBtn.disabled = busy; refreshBtn.disabled = busy; saveBtn.innerHTML = busy ? '<i class="bi bi-hourglass-split"></i> Saving...' : '<i class="bi bi-save"></i> Save Provider'; }
  function parseActionConfigs(){
    const raw = (el.apiActionConfigs && el.apiActionConfigs.value || '').trim();
    if(!raw) return {};
    const parsed = JSON.parse(raw);
    if(!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('API Action Configs must be a JSON object.');
    return parsed;
  }
  function syncWalletFlowToJson(){
    if(!walletFlow || !el.apiActionConfigs) return;
    const configs = parseActionConfigs();
    const value = String(walletFlow.value || 'TRANSFER_BEFORE_LAUNCH').trim().toUpperCase();
    if(value === 'TRANSFER_BEFORE_LAUNCH') delete configs.walletFlow;
    else configs.walletFlow = value;
    el.apiActionConfigs.value = Object.keys(configs).length ? JSON.stringify(configs, null, 2) : '';
  }
  function syncWalletFlowFromJson(){
    if(!walletFlow) return;
    try{
      const configs = parseActionConfigs();
      const raw = String(configs.walletFlow || configs.wallet_flow || 'TRANSFER_BEFORE_LAUNCH').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
      walletFlow.value = ['TRANSFER_BEFORE_LAUNCH','TRANSFER_AFTER_LAUNCH','NO_TRANSFER'].includes(raw) ? raw : 'TRANSFER_BEFORE_LAUNCH';
    } catch(_){ walletFlow.value = 'TRANSFER_BEFORE_LAUNCH'; }
  }
  function syncWithdrawNegativeToJson(){
    if(!withdrawNegativeAmount || !el.apiActionConfigs) return;
    const configs = parseActionConfigs();
    if(withdrawNegativeAmount.checked){
      configs.WITHDRAW = (configs.WITHDRAW && typeof configs.WITHDRAW === 'object' && !Array.isArray(configs.WITHDRAW)) ? configs.WITHDRAW : {};
      configs.WITHDRAW.negativeAmount = true;
    } else if(configs.WITHDRAW && typeof configs.WITHDRAW === 'object' && !Array.isArray(configs.WITHDRAW)){
      delete configs.WITHDRAW.negativeAmount;
    }
    el.apiActionConfigs.value = Object.keys(configs).length ? JSON.stringify(configs, null, 2) : '';
  }
  function syncWithdrawNegativeFromJson(){
    if(!withdrawNegativeAmount) return;
    try{
      const configs = parseActionConfigs();
      const value = configs.WITHDRAW && configs.WITHDRAW.negativeAmount;
      withdrawNegativeAmount.checked = value === true || value === 1 || String(value || '').toLowerCase() === 'true';
    } catch(_){ withdrawNegativeAmount.checked = false; }
  }
  function syncPullLogTimingToJson(){
    if(!pullLogTimingEnabled || !el.apiActionConfigs) return;
    const configs = parseActionConfigs();
    if(pullLogTimingEnabled.checked){
      configs.PULL_LOG = (configs.PULL_LOG && typeof configs.PULL_LOG === 'object' && !Array.isArray(configs.PULL_LOG)) ? configs.PULL_LOG : {};
      delete configs.PULL_LOG.pullWindowMinutes;
      delete configs.PULL_LOG.pullWindowSeconds;
      const value = Math.max(0, Number(pullLogWindowValue?.value || 0));
      if((pullLogWindowUnit?.value || 'minutes') === 'seconds') configs.PULL_LOG.pullWindowSeconds = value;
      else configs.PULL_LOG.pullWindowMinutes = value;
      const delay = Math.max(0, Number(pullLogEndDelaySeconds?.value || 0));
      if(delay > 0) configs.PULL_LOG.pullEndDelaySeconds = delay;
      else delete configs.PULL_LOG.pullEndDelaySeconds;
      configs.PULL_LOG.pullTimezone = (pullLogTimezone?.value || 'Asia/Kuala_Lumpur').trim();
      configs.PULL_LOG.pullDateTimeFormat = (pullLogDateTimeFormat?.value || 'yyyy-MM-dd HH:mm:ss').trim();
    } else if(configs.PULL_LOG && typeof configs.PULL_LOG === 'object' && !Array.isArray(configs.PULL_LOG)){
      ['pullWindowMinutes','pullWindowSeconds','pullEndDelaySeconds','pullTimezone','pullDateTimeFormat'].forEach(key => delete configs.PULL_LOG[key]);
    }
    el.apiActionConfigs.value = Object.keys(configs).length ? JSON.stringify(configs, null, 2) : '';
  }
  function syncPullLogTimingFromJson(){
    if(!pullLogTimingEnabled) return;
    try{
      const configs = parseActionConfigs();
      const cfg = configs.PULL_LOG && typeof configs.PULL_LOG === 'object' && !Array.isArray(configs.PULL_LOG) ? configs.PULL_LOG : {};
      const hasSeconds = cfg.pullWindowSeconds !== undefined && cfg.pullWindowSeconds !== null && cfg.pullWindowSeconds !== '';
      const hasMinutes = cfg.pullWindowMinutes !== undefined && cfg.pullWindowMinutes !== null && cfg.pullWindowMinutes !== '';
      const enabled = hasSeconds || hasMinutes || cfg.pullTimezone || cfg.pullDateTimeFormat || cfg.pullEndDelaySeconds;
      pullLogTimingEnabled.checked = !!enabled;
      if(hasSeconds){ pullLogWindowUnit.value='seconds'; pullLogWindowValue.value=String(cfg.pullWindowSeconds); }
      else { pullLogWindowUnit.value='minutes'; pullLogWindowValue.value=String(hasMinutes ? cfg.pullWindowMinutes : 15); }
      pullLogEndDelaySeconds.value=String(cfg.pullEndDelaySeconds ?? 0);
      pullLogTimezone.value=cfg.pullTimezone || 'Asia/Kuala_Lumpur';
      pullLogDateTimeFormat.value=cfg.pullDateTimeFormat || 'yyyy-MM-dd HH:mm:ss';
    }catch(_){
      pullLogTimingEnabled.checked=false;
    }
  }
  function reset(){ form.reset(); el.providerId.value=''; el.currency.value='MYR'; el.sortOrder.value='0'; el.providerStatus.value='1'; el.integrationType.value='GENERIC_API'; el.httpMethod.value='POST'; el.signatureType.value='MD5'; el.signatureOutputCase.value='LOWER'; el.ukeyLength.value='8'; el.ukeyPrefix.value=''; el.ukeyStaticValue.value=''; if(el.keyEnvironment) el.keyEnvironment.value='STAGING'; if(el.boLoginUrl) el.boLoginUrl.value=''; if(el.boUsername) el.boUsername.value=''; if(el.boPassword) el.boPassword.value=''; if(el.providerVariables) el.providerVariables.value=''; if(el.apiActionConfigs) el.apiActionConfigs.value=''; if(walletFlow) walletFlow.value='TRANSFER_BEFORE_LAUNCH'; if(withdrawNegativeAmount) withdrawNegativeAmount.checked=false; if(pullLogTimingEnabled) pullLogTimingEnabled.checked=false; if(pullLogWindowValue) pullLogWindowValue.value='15'; if(pullLogWindowUnit) pullLogWindowUnit.value='minutes'; if(pullLogEndDelaySeconds) pullLogEndDelaySeconds.value='0'; if(pullLogTimezone) pullLogTimezone.value='Asia/Kuala_Lumpur'; if(pullLogDateTimeFormat) pullLogDateTimeFormat.value='yyyy-MM-dd HH:mm:ss'; if(el.gameImageApiUrlTemplate) el.gameImageApiUrlTemplate.value=''; if(el.gameImageRemoteApiUrlTemplate) el.gameImageRemoteApiUrlTemplate.value=''; if(el.gameImageRemoteApiHttpMethod) el.gameImageRemoteApiHttpMethod.value='GET'; if(el.gameImageRemoteApiRequestTemplate) el.gameImageRemoteApiRequestTemplate.value=''; if(el.gameImageRemoteApiResponsePath) el.gameImageRemoteApiResponsePath.value=''; if(el.gameImageFallbackUrlTemplate) el.gameImageFallbackUrlTemplate.value=''; if(el.frontendGameFallbackImageUrl) el.frontendGameFallbackImageUrl.value=''; renderCategoryOptions(''); title.textContent='Create Provider'; el.providerCode.disabled=false; setStatus('', ''); window.scrollTo({top:0, behavior:'smooth'}); }
  function payload(){
    syncWalletFlowToJson();
    syncWithdrawNegativeToJson();
    syncPullLogTimingToJson();
    const data = {};
    if (el.providerId.value) data.id = Number(el.providerId.value);
    data.code = el.providerCode.value.trim().toUpperCase();
    data.name = el.providerName.value.trim();
    data.providerType = 'OTHER';
    data.categoryIds = Array.from(el.providerCategoryIds?.selectedOptions || []).map(option => option.value).join(',');
    data.providerImageUrl = el.providerImageUrl.value.trim();
    data.providerBrandImageUrl = el.providerBrandImageUrl.value.trim();
    data.walletMode = el.walletMode.value;
    data.currency = el.currency.value.trim() || 'MYR';
    ['apiBaseUrl','operatorId','secretKey','keyEnvironment','boLoginUrl','boUsername','boPassword','providerVariables','apiActionConfigs','integrationType','httpMethod','signatureType','signatureOutputCase','signatureTemplate','ukeyLength','ukeyPrefix','ukeyStaticValue','createPlayerPath','balancePath','depositPath','withdrawPath','launchPath','gameListPath','createPlayerRequestTemplate','balanceRequestTemplate','depositRequestTemplate','withdrawRequestTemplate','launchRequestTemplate','gameListRequestTemplate','responseBalancePath','responseLaunchUrlPath','responseGameListPath','responseGameCodePath','responseGameNamePath','responseGameImagePath','gameImageApiUrlTemplate','gameImageRemoteApiUrlTemplate','gameImageRemoteApiHttpMethod','gameImageRemoteApiRequestTemplate','gameImageRemoteApiResponsePath','gameImageFallbackUrlTemplate','frontendGameFallbackImageUrl','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse','sortOrder'].forEach(k => {
      let value = el[k].value || '';
      if (k === 'ukeyLength' || k === 'sortOrder') value = value === '' ? null : Number(value);
      data[k] = value;
    });
    data.status = Number(el.providerStatus.value || '1');
    return data;
  }
  function selectedCategoryIds(){ return Array.from(el.providerCategoryIds?.selectedOptions || []).map(option => String(option.value)); }
  function renderCategoryOptions(selectedValue){
    if(!el.providerCategoryIds) return;
    const selected = String(selectedValue || '').split(/[,|]/).map(v => v.trim()).filter(Boolean);
    el.providerCategoryIds.innerHTML = categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name || ('Category #' + category.id))}</option>`).join('');
    Array.from(el.providerCategoryIds.options).forEach(option => { option.selected = selected.includes(String(option.value)); });
  }

  function providerField(item, camel, snake, fallback=''){
    if(!item || typeof item !== 'object') return fallback;
    const value = item[camel] ?? (snake ? item[snake] : undefined);
    return value === undefined || value === null || value === '' ? fallback : value;
  }
  function setSelectValue(select, value, fallback){
    if(!select) return;
    const wanted = String(value ?? '').trim().toUpperCase();
    const match = Array.from(select.options).find(option => String(option.value || option.textContent || '').trim().toUpperCase() === wanted);
    select.value = match ? match.value : fallback;
    // Some browsers/custom select renderers update one frame late after the modal/form is reset.
    requestAnimationFrame(() => {
      if(match && select.value !== match.value) select.value = match.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  function edit(item){ if(tenantMode){setStatus('Existing provider configuration is read-only for this branding.', 'error');return;} el.providerId.value=item.id||''; el.providerCode.value=item.code||''; el.providerName.value=item.name||''; renderCategoryOptions(item.categoryIds || item.category_ids || ''); el.providerImageUrl.value=item.providerImageUrl||''; el.providerBrandImageUrl.value=item.providerBrandImageUrl||item.provider_brand_image_url||''; setSelectValue(el.walletMode, providerField(item,'walletMode','wallet_mode','TRANSFER'), 'TRANSFER'); el.currency.value=providerField(item,'currency','currency','MYR'); setSelectValue(el.integrationType, providerField(item,'integrationType','integration_type','GENERIC_API'), 'GENERIC_API'); setSelectValue(el.httpMethod, providerField(item,'httpMethod','http_method','POST'), 'POST'); el.apiBaseUrl.value=item.apiBaseUrl||''; el.operatorId.value=item.operatorId||''; el.secretKey.value=item.secretKey||''; if(el.keyEnvironment) el.keyEnvironment.value=providerField(item,'keyEnvironment','key_environment','STAGING'); if(el.boLoginUrl) el.boLoginUrl.value=providerField(item,'boLoginUrl','bo_login_url',''); if(el.boUsername) el.boUsername.value=providerField(item,'boUsername','bo_username',''); if(el.boPassword){ el.boPassword.value=providerField(item,'boPassword','bo_password',''); el.boPassword.type='password'; } if(el.providerVariables) el.providerVariables.value=item.providerVariables||''; if(el.apiActionConfigs) el.apiActionConfigs.value=item.apiActionConfigs||''; syncWalletFlowFromJson(); syncWithdrawNegativeFromJson(); syncPullLogTimingFromJson(); el.signatureType.value=item.signatureType||'MD5'; el.signatureOutputCase.value=item.signatureOutputCase||'LOWER'; el.signatureTemplate.value=item.signatureTemplate||''; el.ukeyLength.value=item.ukeyLength||8; el.ukeyPrefix.value=item.ukeyPrefix||''; el.ukeyStaticValue.value=item.ukeyStaticValue||''; el.createPlayerPath.value=item.createPlayerPath||''; el.balancePath.value=item.balancePath||''; el.depositPath.value=item.depositPath||''; el.withdrawPath.value=item.withdrawPath||''; el.launchPath.value=item.launchPath||''; el.gameListPath.value=item.gameListPath||''; el.createPlayerRequestTemplate.value=item.createPlayerRequestTemplate||''; el.balanceRequestTemplate.value=item.balanceRequestTemplate||''; el.depositRequestTemplate.value=item.depositRequestTemplate||''; el.withdrawRequestTemplate.value=item.withdrawRequestTemplate||''; el.launchRequestTemplate.value=item.launchRequestTemplate||''; el.gameListRequestTemplate.value=item.gameListRequestTemplate||''; el.responseBalancePath.value=item.responseBalancePath||''; el.responseLaunchUrlPath.value=item.responseLaunchUrlPath||''; el.responseGameListPath.value=item.responseGameListPath||''; el.responseGameCodePath.value=item.responseGameCodePath||''; el.responseGameNamePath.value=item.responseGameNamePath||''; ['responseGameImagePath','gameImageApiUrlTemplate','gameImageRemoteApiUrlTemplate','gameImageRemoteApiHttpMethod','gameImageRemoteApiRequestTemplate','gameImageRemoteApiResponsePath','gameImageFallbackUrlTemplate','frontendGameFallbackImageUrl','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse'].forEach(k=>{ if(el[k]) el[k].value=item[k]||''; }); if(el.gameImageRemoteApiHttpMethod && !el.gameImageRemoteApiHttpMethod.value) el.gameImageRemoteApiHttpMethod.value='GET'; el.sortOrder.value=item.sortOrder??0; el.providerStatus.value=String(item.status??1); el.providerCode.disabled=true; title.textContent='Edit Provider #' + item.id; setStatus('Editing provider. Games using this Provider Code will group under this provider.', 'success'); window.scrollTo({top:0, behavior:'smooth'}); }
  async function editFresh(id, button){
    const originalHtml = button ? button.innerHTML : '';
    if(button){ button.disabled = true; button.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading...'; }
    try{
      // Re-read the provider list before editing. This avoids using the stale card object that
      // can remain in memory immediately after save/update while the async reload is still running.
      const providerJson = await fetchJson(PROVIDER_API.list + (PROVIDER_API.list.includes('?') ? '&' : '?') + '_ts=' + Date.now(), { cache: 'no-store' });
      rows = providerJson.data || providerJson || [];
      const item = rows.find(x => String(x.id) === String(id));
      if(!item) throw new Error('Provider not found. Please refresh and try again.');
      edit(item);
      render();
    }catch(err){
      setStatus(err.message || 'Unable to load latest provider data.', 'error');
    }finally{
      if(button){ button.disabled = false; button.innerHTML = originalHtml; }
    }
  }

  function providerOptions(){ const opts = rows.map(x => `<option value="${escapeHtml(x.code)}" data-provider-id="${escapeHtml(x.id)}">${escapeHtml(x.code)} - ${escapeHtml(x.name)}</option>`).join('') || '<option value="">No provider</option>'; walletProviderCode.innerHTML = opts; const cb=document.getElementById('callbackProviderCode'); if(cb) cb.innerHTML=opts; }
  function maskCredential(value){
    const text = String(value || '');
    if(!text) return '-';
    if(text.length <= 4) return '••••';
    return text.slice(0, 2) + '••••••' + text.slice(-2);
  }
  function providerActionConfigObject(item){
    const raw = item?.apiActionConfigs ?? item?.api_action_configs ?? '';
    if(!raw) return { config:{}, invalid:false };
    if(typeof raw === 'object' && !Array.isArray(raw)) return { config:raw, invalid:false };
    try{
      const parsed = JSON.parse(String(raw));
      return { config:(parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {}, invalid:false };
    }catch(_){
      return { config:{}, invalid:true };
    }
  }
  function actionConfigured(item, configs, name){
    const cfg = configs && configs[name];
    if(cfg && typeof cfg === 'object' && !Array.isArray(cfg)){
      if(cfg.enabled === false || cfg.enabled === 0 || String(cfg.enabled ?? '').toLowerCase() === 'false') return false;
      // An explicit action object counts as configured when it has an endpoint/template/mapping,
      // or when enabled=true is intentionally used by a provider.
      if(cfg.enabled === true || cfg.enabled === 1 || String(cfg.enabled ?? '').toLowerCase() === 'true') return true;
      if(Object.keys(cfg).some(k => !['enabled'].includes(k))) return true;
    }
    if(cfg === false) return false;
    const legacy = {
      GAME_LIST: item?.gameListPath ?? item?.game_list_path,
      CREATE_PLAYER: item?.createPlayerPath ?? item?.create_player_path,
      BALANCE: item?.balancePath ?? item?.balance_path,
      DEPOSIT: item?.depositPath ?? item?.deposit_path,
      WITHDRAW: item?.withdrawPath ?? item?.withdraw_path,
      LAUNCH: item?.launchPath ?? item?.launch_path
    };
    return !!String(legacy[name] ?? '').trim();
  }
  function providerCapabilityHtml(item){
    const parsed = providerActionConfigObject(item);
    const configs = parsed.config;
    const standard = ['GAME_LIST','CREATE_PLAYER','LAUNCH','LOGOUT','BALANCE','DEPOSIT','WITHDRAW','PULL_LOG'];
    const topLevelKeys = new Set([
      'WALLETFLOW','WALLET_FLOW','AUTOSETTLESTALEENABLED','AUTOSETTLESTALESECONDS',
      'FORCEPROVIDERBALANCEONEXIT','SETTLEMENTBALANCEREQUIRED','LOGOUTBEFOREEXITBALANCE'
    ]);
    const extras = Object.keys(configs || {})
      .filter(key => {
        const upper = String(key).toUpperCase();
        return !standard.includes(upper) && !topLevelKeys.has(upper)
          && configs[key] && typeof configs[key] === 'object' && !Array.isArray(configs[key]);
      })
      .map(key => String(key).toUpperCase())
      .sort();
    const names = [...standard, ...extras];
    const badges = names.map(name => {
      const on = actionConfigured(item, configs, name);
      return `<span class="provider-api-capability ${on ? 'is-on' : 'is-off'}" title="${escapeHtml(name)} ${on ? 'configured/enabled' : 'missing or disabled'}"><i class="bi ${on ? 'bi-check-circle-fill' : 'bi-x-circle'}"></i>${escapeHtml(name)}</span>`;
    }).join('');
    const invalid = parsed.invalid
      ? '<span class="provider-api-capability is-invalid" title="API Action Configs is not valid JSON"><i class="bi bi-exclamation-triangle-fill"></i>INVALID JSON</span>'
      : '';
    return `<div class="provider-api-capabilities"><div class="provider-api-capabilities-title"><i class="bi bi-diagram-3 me-1"></i>API Capabilities</div>${badges}${invalid}</div>`;
  }
  function render(){
    list.innerHTML='';
    empty.hidden = rows.length > 0;
    providerOptions();
    rows.forEach(item => {
      const linkedGameCount = Number(item.gameCount ?? item.game_count ?? 0);
      const gameHtml = linkedGameCount > 0
        ? `<small class="text-secondary provider-game-summary"><i class="bi bi-controller me-1"></i>${linkedGameCount} linked game${linkedGameCount === 1 ? '' : 's'}</small>`
        : '<small class="text-secondary provider-game-summary">No game linked yet. Set this code in Game → Provider Code.</small>';
      const env = String(item.keyEnvironment || item.key_environment || 'STAGING').toUpperCase() === 'LIVE' ? 'LIVE' : 'STAGING';
      const boUrl = item.boLoginUrl || item.bo_login_url || '';
      const boUsername = item.boUsername || item.bo_username || '';
      const boPassword = item.boPassword || item.bo_password || '';
      const card=document.createElement('div');
      card.className='manage-card';
      card.innerHTML=`<div class="manage-thumb game-thumb">${item.providerImageUrl ? `<img src="${escapeHtml(item.providerImageUrl)}" alt="${escapeHtml(item.name || item.code)}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;">` : `<i class="bi bi-hdd-network fs-1 text-secondary"></i>`}</div><div class="manage-card-body"><div class="slider-card-title"><b>${escapeHtml(item.code)} - ${escapeHtml(item.name)}</b>${statusPill(item.status)}<span class="slider-pill ${env === 'LIVE' ? 'active' : 'inactive'}"><i class="bi ${env === 'LIVE' ? 'bi-broadcast' : 'bi-tools'}"></i>${env === 'LIVE' ? 'Live Key' : 'Staging Key'}</span></div><div class="slider-meta"><span><i class="bi bi-tag me-1"></i>${escapeHtml((item.categoryIds || item.category_ids || '').split(',').map(id => (categories.find(c => String(c.id) === String(id)) || {}).name).filter(Boolean).join(', ') || 'No category')}</span><span><i class="bi bi-wallet2 me-1"></i>${escapeHtml(item.walletMode || 'TRANSFER')}</span><span><i class="bi bi-plug me-1"></i>${escapeHtml(item.integrationType || 'GENERIC_API')}</span><span><i class="bi bi-cash me-1"></i>${escapeHtml(item.currency || 'MYR')}</span><span><i class="bi bi-controller me-1"></i>${linkedGameCount} games</span><span><i class="bi bi-link-45deg me-1"></i>${escapeHtml(item.apiBaseUrl || '-')}</span><span><i class="bi bi-sort-numeric-down me-1"></i>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span></div>${providerCapabilityHtml(item)}<div class="provider-access-record mt-3 p-3 border rounded-3 bg-light"><div class="fw-bold mb-2"><i class="bi bi-shield-lock me-1"></i>Provider BO Login Record</div><div class="row g-2 small"><div class="col-12 col-xl-5"><span class="text-secondary">URL:</span> ${boUrl ? `<a href="${escapeHtml(boUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(boUrl)}</a>` : '-'}</div><div class="col-12 col-md-5 col-xl-3"><span class="text-secondary">Username:</span> <code>${escapeHtml(boUsername || '-')}</code></div><div class="col-12 col-md-7 col-xl-4"><span class="text-secondary">Password:</span> <code data-provider-password-id="${escapeHtml(item.id)}">${escapeHtml(maskCredential(boPassword))}</code>${boPassword ? ` <button class="clean-btn py-1 px-2 ms-1" type="button" data-reveal-password-id="${escapeHtml(item.id)}"><i class="bi bi-eye"></i> Reveal</button><button class="clean-btn py-1 px-2 ms-1" type="button" data-copy-password-id="${escapeHtml(item.id)}"><i class="bi bi-copy"></i> Copy</button>` : ''}</div></div></div><div class="d-flex gap-2 flex-wrap mt-2">${gameHtml}</div></div><div class="slider-card-actions">${tenantMode?'<span class="small text-muted"><i class="bi bi-lock"></i> Managed by master</span>':`<button class="clean-btn primary" type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i> Edit</button><button class="clean-btn danger" type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash"></i> Delete</button>`}</div>`;
      list.appendChild(card);
    });
  }
  async function ensureTenantContext(){if(tenantContextLoaded)return;tenantContextLoaded=true;try{const j=window.BO_BRAND?await BO_BRAND.context():null;tenantMode=!!(j&&j.data&&!j.data.master);}catch(_){tenantMode=false;}if(tenantMode){title.textContent='Add New Provider';resetBtn.textContent='Clear Form';}}
  async function load(){
    await ensureTenantContext();
    setStatus('Loading...', '');
    try{
      const [providerJson, categoryJson] = await Promise.all([
        fetchJson(PROVIDER_API.list + (PROVIDER_API.list.includes('?') ? '&' : '?') + '_ts=' + Date.now(), { cache: 'no-store' }),
        fetchJson(CATEGORY_API.list)
      ]);
      rows = providerJson.data || providerJson || [];
      categories = categoryJson.data || categoryJson || [];
      renderCategoryOptions(el.providerId.value ? (rows.find(r => String(r.id) === String(el.providerId.value)) || {}).categoryIds : '');
      render(); providerOptions(); setStatus('Latest provider and category data loaded.', 'success');
    }catch(err){ setStatus(err.message || 'Failed to load.', 'error'); }
  }

  async function save(e){
    e.preventDefault();
    if(tenantMode && el.providerId.value){ setStatus('Existing provider configuration is managed by master admin. Use the empty form to add a new provider.', 'error'); return; }
    if(!el.providerCode.value.trim() || !el.providerName.value.trim()){
      setStatus('Provider code and name are required.', 'error');
      return;
    }
    if(!selectedCategoryIds().length){
      setStatus('Please select at least one Provider Category.', 'error');
      return;
    }
    setBusy(true);
    try{
      const json = await fetchJson(el.providerId.value ? PROVIDER_API.update : PROVIDER_API.create, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload())
      });
      setStatus(json.message || 'Saved.', 'success');
      reset();
      await load();
    }catch(err){
      setStatus(err.message || 'Save failed.', 'error');
    }finally{
      setBusy(false);
    }
  }

  async function remove(id){ if(tenantMode){setStatus('Provider configuration is managed by master admin.', 'error');return;}
    if(!(await BO_DIALOG.confirm('Delete this provider? Games will not be deleted, but provider will become inactive.', {title:'Delete Provider', confirmText:'Delete'}))) return;
    const data = new FormData();
    data.append('id', id);
    try{
      const json = await fetchJson(PROVIDER_API.delete, {method:'POST', body:data});
      setStatus(json.message || 'Deleted.', 'success');
      await load();
    }catch(err){
      setStatus(err.message || 'Delete failed.', 'error');
    }
  }

  function formatProviderDebug(data){
    const d = data || {};
    const arrayPaths = (d.availablePaths || []).filter(x => x.isArray).map(x => x.path + ' (' + (x.size ?? '-') + ')');
    const objectPaths = (d.availablePaths || []).filter(x => x.type === 'object').map(x => x.path);
    return JSON.stringify({
      providerCode: d.providerCode,
      httpStatus: d.httpStatus,
      url: d.url,
      configuredGameListPath: d.configuredGameListPath,
      configuredPathType: d.configuredPathType,
      configuredPathIsArray: d.configuredPathIsArray,
      configuredPathIsObject: d.configuredPathIsObject,
      normalizedGameRows: d.normalizedGameRows,
      suggestedArrayPaths: arrayPaths,
      suggestedObjectPaths: objectPaths,
      requestPayload: d.requestPayload,
      responseBody: (() => { try { return JSON.parse(d.responseBody); } catch(e) { return d.responseBody; } })(),
      availablePaths: d.availablePaths,
      context: d.context,
      hint: d.hint
    }, null, 2);
  }

  async function syncGames(){ const providerCode = walletProviderCode.value || (rows[0] && rows[0].code); if(!providerCode){ setStatus('Please create/select provider first.', 'error'); return; } if(!(await BO_DIALOG.confirm('Sync games from provider ' + providerCode + '?', {title:'Sync Provider Games', confirmText:'Sync'}))) return; try{ setStatus('Syncing provider games...', ''); const data=new FormData(); data.append('providerCode', providerCode); const json=await fetchJson(PROVIDER_GAME_API.sync, {method:'POST', body:data}); setStatus('Game sync completed. Inserted: '+json.data.inserted+', Updated: '+json.data.updated+'. Images — provider: '+(json.data.imagesFromProvider||0)+', generated URL: '+(json.data.imagesFromImageApiTemplate||0)+', separate image API: '+(json.data.imagesFromRemoteApi||0)+', image API failures: '+(json.data.remoteImageApiFailures||0)+', fallback: '+(json.data.imagesFromFallbackTemplate||0)+', missing: '+(json.data.imagesMissing||0)+'. Path: '+(json.data.gameListPath || '-'), 'success'); if(window.walletResult) walletResult.textContent=JSON.stringify(json.data, null, 2); await load(); }catch(err){ setStatus(err.message || 'Game sync failed.', 'error'); if(window.walletResult) walletResult.textContent='Sync error:\n' + (err.message || 'Game sync failed') + '\n\nOpen Provider Transactions page and filter Tx Type = GAME_LIST to inspect request/response.'; } }
  async function debugGames(){ const providerCode = walletProviderCode.value || (rows[0] && rows[0].code); if(!providerCode){ setStatus('Please create/select provider first.', 'error'); return; } try{ setStatus('Debugging provider game list...', ''); const data=new FormData(); data.append('providerCode', providerCode); const json=await fetchJson(PROVIDER_GAME_API.debug, {method:'POST', body:data}); setStatus('Debug completed. Check result box below and Provider Transactions page.', (json.data.configuredPathIsArray || json.data.normalizedGameRows > 0) ? 'success' : 'error'); if(window.walletResult) walletResult.textContent=formatProviderDebug(json.data); }catch(err){ setStatus(err.message || 'Debug failed.', 'error'); if(window.walletResult) walletResult.textContent='Debug error:\n' + (err.message || 'Debug failed') + '\n\nA FAILED GAME_LIST record is now saved automatically. Open Provider Transactions and filter Provider Code = ' + providerCode + ' and Tx Type = GAME_LIST.'; } }
  function walletStatus(message, type){
    if(!walletStatusBox) return;
    walletStatusBox.textContent = message || '';
    walletStatusBox.className = 'upload-status' + (type ? ' ' + type : '');
  }

  function walletInputs(){
    const memberId = Number(document.getElementById('walletMemberId')?.value || 0);
    const providerCode = (walletProviderCode?.value || '').trim();
    const providerId = Number(walletProviderCode?.selectedOptions?.[0]?.dataset?.providerId || 0);
    const amountRaw = (document.getElementById('walletAmount')?.value || '').trim();
    const gameCode = (document.getElementById('walletGameCode')?.value || '').trim();
    const previewAction = (document.getElementById('previewAction')?.value || 'CREATE_PLAYER').trim();
    return {
      memberId,
      providerCode,
      providerId,
      amount: amountRaw === '' ? null : Number(amountRaw),
      gameCode,
      action: previewAction
    };
  }

  async function wallet(action){
    const input = walletInputs();
    if(action !== 'pull-log-debug' && (!input.memberId || input.memberId < 1)){
      walletStatus('Please enter a valid Member ID.', 'error');
      return;
    }
    if(action !== 'main-balance' && !input.providerCode){
      walletStatus('Please select a provider.', 'error');
      return;
    }
    if((action === 'deposit' || action === 'withdraw') && (!(input.amount > 0) || !Number.isFinite(input.amount))){
      walletStatus('Please enter a transfer amount greater than 0.', 'error');
      return;
    }

    const labels = {
      'main-balance':'Checking main wallet...',
      'create-player':'Creating provider player...',
      'balance':'Checking provider balance...',
      'deposit':'Transferring to provider...',
      'withdraw':'Transferring back to main wallet...',
      'launch-sport':'Requesting launch URL...',
      'api-preview':'Generating API payload preview...',
      'pull-log-debug':'Running pull log / bet log debug...'
    };
    walletStatus(labels[action] || 'Processing...', '');
    if(walletResult) walletResult.textContent = '';

    try{
      let url;
      let options = {};
      const authHeaders = (window.BO_AUTH && BO_AUTH.authHeader) ? BO_AUTH.authHeader() : {};

      if(action === 'main-balance'){
        url = WALLET_API.mainBalance + '?memberId=' + encodeURIComponent(input.memberId);
        options = {headers: authHeaders};
      } else if(action === 'balance'){
        url = WALLET_API.balance
          + '?memberId=' + encodeURIComponent(input.memberId)
          + '&providerCode=' + encodeURIComponent(input.providerCode);
        options = {method:'GET', headers: authHeaders};
      } else if(action === 'pull-log-debug'){
        url = WALLET_API.pullLogDebug + '?providerCode=' + encodeURIComponent(input.providerCode);
        options = {method:'POST', headers: authHeaders};
      } else {
        const endpointMap = {
          'create-player': WALLET_API.createPlayer,
          'deposit': WALLET_API.deposit,
          'withdraw': WALLET_API.withdraw,
          'launch-sport': WALLET_API.launchSport,
          'api-preview': WALLET_API.apiPreview
        };
        url = endpointMap[action];
        if(!url) throw new Error('Unsupported debug action: ' + action);

        const data = new FormData();
        data.append('memberId', String(input.memberId));
        data.append('providerCode', input.providerCode.trim());
        if(input.gameCode) data.append('gameCode', input.gameCode);
        if(input.amount !== null && Number.isFinite(input.amount)) data.append('amount', String(input.amount));
        data.append('externalTxId', 'BO-' + Date.now());
        if(action === 'api-preview'){
          url += '?action=' + encodeURIComponent(input.action || 'CREATE_PLAYER');
        }
        options = {method:'POST', headers: authHeaders, body:data};
      }

      const json = await fetchJson(url, options);
      const data = Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
      walletStatus(json.message || 'Request completed successfully.', 'success');
      if(walletResult) walletResult.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

      if(action === 'launch-sport'){
        const launchUrl = data && (data.launchUrl || data.url || data.gameUrl);
        if(launchUrl && /^https?:\/\//i.test(launchUrl)) window.open(launchUrl, '_blank', 'noopener');
      }
    }catch(err){
      walletStatus(err.message || 'Request failed.', 'error');
      if(walletResult) walletResult.textContent = 'Error:\n' + (err.message || 'Request failed.');
    }
  }


  async function callbackPreview(){ const code=document.getElementById('callbackProviderCode').value; const raw=document.getElementById('callbackSample').value || '{}'; const box=document.getElementById('callbackResult'); try{ const json=await fetchJson(CALLBACK_API.previewBase + '/' + encodeURIComponent(code), {method:'POST', headers:{'Content-Type':'application/json'}, body:raw}); box.textContent=JSON.stringify(json.data,null,2); }catch(err){ box.textContent=err.message || 'Callback preview failed'; } }
  async function ledgerSummary(){ const code=document.getElementById('callbackProviderCode').value; const from=document.getElementById('reportFrom').value; const to=document.getElementById('reportTo').value; const box=document.getElementById('callbackResult'); let url=CALLBACK_API.report + '?providerCode=' + encodeURIComponent(code); if(from) url += '&from=' + encodeURIComponent(from); if(to) url += '&to=' + encodeURIComponent(to); try{ const json=await fetchJson(url); box.textContent=JSON.stringify(json.data,null,2); }catch(err){ box.textContent=err.message || 'Report failed'; } }

  function formatActionConfig(){
    if(!el.apiActionConfigs) return;
    try{ el.apiActionConfigs.value = JSON.stringify(JSON.parse(el.apiActionConfigs.value || '{}'), null, 2); syncWalletFlowFromJson(); syncWithdrawNegativeFromJson(); syncPullLogTimingFromJson(); setStatus('API Action Configs JSON formatted.', 'success'); }
    catch(err){ setStatus('API Action Configs JSON invalid: ' + err.message, 'error'); }
  }

  form.addEventListener('submit', save);
  const toggleBoPasswordBtn=document.getElementById('toggleBoPasswordBtn'); if(toggleBoPasswordBtn && el.boPassword) toggleBoPasswordBtn.addEventListener('click', ()=>{ const show=el.boPassword.type==='password'; el.boPassword.type=show?'text':'password'; toggleBoPasswordBtn.innerHTML=show?'<i class="bi bi-eye-slash"></i>':'<i class="bi bi-eye"></i>'; });
  if(el.apiActionConfigs) el.apiActionConfigs.addEventListener('input', () => { syncWalletFlowFromJson(); syncWithdrawNegativeFromJson(); syncPullLogTimingFromJson(); }); if(walletFlow) walletFlow.addEventListener('change', () => { try{ syncWalletFlowToJson(); }catch(err){ setStatus('API Action Configs JSON invalid: ' + err.message, 'error'); } }); if(pullLogTimingEnabled) pullLogTimingEnabled.addEventListener('change', syncPullLogTimingToJson); [pullLogWindowValue,pullLogWindowUnit,pullLogEndDelaySeconds,pullLogTimezone,pullLogDateTimeFormat].filter(Boolean).forEach(node => node.addEventListener('change', () => { if(pullLogTimingEnabled?.checked) syncPullLogTimingToJson(); })); const formatActionBtn=document.getElementById('formatActionConfigBtn'); if(formatActionBtn) formatActionBtn.addEventListener('click', formatActionConfig); resetBtn.addEventListener('click', reset); refreshBtn.addEventListener('click', load); list.addEventListener('click', async e => { const eb=e.target.closest('[data-edit-id]'), db=e.target.closest('[data-delete-id]'), rb=e.target.closest('[data-reveal-password-id]'), cb=e.target.closest('[data-copy-password-id]'); if(eb){ editFresh(eb.dataset.editId, eb); } if(db) remove(db.dataset.deleteId); if(rb){ const item=rows.find(x=>String(x.id)===String(rb.dataset.revealPasswordId)); const target=list.querySelector('[data-provider-password-id="'+CSS.escape(String(rb.dataset.revealPasswordId))+'"]'); if(item && target){ const currentlyRevealed=rb.dataset.revealed==='1'; target.textContent=currentlyRevealed ? maskCredential(item.boPassword || item.bo_password || '') : (item.boPassword || item.bo_password || '-'); rb.dataset.revealed=currentlyRevealed?'0':'1'; rb.innerHTML=currentlyRevealed?'<i class="bi bi-eye"></i> Reveal':'<i class="bi bi-eye-slash"></i> Hide'; } } if(cb){ const item=rows.find(x=>String(x.id)===String(cb.dataset.copyPasswordId)); const password=item && (item.boPassword || item.bo_password || ''); if(password){ try{ await navigator.clipboard.writeText(password); setStatus('Provider BO password copied.', 'success'); }catch(_){ setStatus('Unable to copy password. Use Reveal and copy manually.', 'error'); } } } }); document.querySelectorAll('[data-wallet-action]').forEach(btn => btn.addEventListener('click', () => wallet(btn.dataset.walletAction))); const syncBtn=document.getElementById('syncSelectedProviderBtn'); if(syncBtn) syncBtn.addEventListener('click', syncGames); const debugBtn=document.getElementById('debugSelectedProviderBtn'); if(debugBtn) debugBtn.addEventListener('click', debugGames); const cbBtn=document.getElementById('callbackPreviewBtn'); if(cbBtn) cbBtn.addEventListener('click', callbackPreview); const reportBtn=document.getElementById('ledgerSummaryBtn'); if(reportBtn) reportBtn.addEventListener('click', ledgerSummary); reset(); load();
})();

(function(){
  function api(pathKey){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('playerLaunchTestBtn');
    if(!btn) return;
    btn.addEventListener('click', async function(){
      const result = document.getElementById('playerLaunchResult');
      const token = (document.getElementById('playerLaunchToken')?.value || '').trim();
      let body = {};
      try { body = JSON.parse(document.getElementById('playerLaunchBody')?.value || '{}'); }
      catch(e){ result.textContent = 'Invalid JSON body: ' + e.message; return; }
      if(!token){ result.textContent = 'Please paste member JWT token. This API is for frontend player, not admin token.'; return; }
      result.textContent = 'Launching...';
      try{
        const res = await fetch(api('PLAYER_PROVIDER_LAUNCH'), {
          method:'POST',
          headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + token},
          body: JSON.stringify(body)
        });
        const json = await res.json().catch(()=>({}));
        result.textContent = JSON.stringify(json, null, 2);
      }catch(err){ result.textContent = err.message || 'Launch test failed'; }
    });
  });
})();
