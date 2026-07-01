function adminApi(pathKey) { return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }
function escapeHtml(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function statusPill(value) { const active = Number(value) === 1; return `<span class="slider-pill ${active ? 'active' : 'inactive'}"><i class="bi ${active ? 'bi-check-circle' : 'bi-pause-circle'}"></i>${active ? 'Active' : 'Inactive'}</span>`; }
async function fetchJson(url, options) { const res = await fetch(url, options); const json = await res.json().catch(() => ({})); if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed'); return json; }

const PROVIDER_API = { list: adminApi('GAME_PROVIDER_LIST'), create: adminApi('GAME_PROVIDER_CREATE'), update: adminApi('GAME_PROVIDER_UPDATE'), delete: adminApi('GAME_PROVIDER_DELETE') };
const GAME_API = { list: adminApi('GAME_LIST') };
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
  const list = document.getElementById('providerList'), empty = document.getElementById('providerEmpty'), statusBox = document.getElementById('providerStatusBox');
  const ids = ['providerId','providerCode','providerName','providerType','walletMode','integrationType','httpMethod','currency','apiBaseUrl','operatorId','secretKey','providerVariables','apiActionConfigs','signatureType','signatureOutputCase','signatureTemplate','ukeyLength','ukeyPrefix','ukeyStaticValue','createPlayerPath','balancePath','depositPath','withdrawPath','launchPath','gameListPath','createPlayerRequestTemplate','balanceRequestTemplate','depositRequestTemplate','withdrawRequestTemplate','launchRequestTemplate','gameListRequestTemplate','responseBalancePath','responseLaunchUrlPath','responseGameListPath','responseGameCodePath','responseGameNamePath','responseGameImagePath','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse','sortOrder','providerStatus'];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const title = document.getElementById('providerFormTitle'), saveBtn = document.getElementById('saveProviderBtn'), refreshBtn = document.getElementById('refreshProviderBtn'), resetBtn = document.getElementById('resetProviderBtn');
  const walletProviderCode = document.getElementById('walletProviderCode'), walletStatusBox = document.getElementById('walletStatusBox'), walletResult = document.getElementById('walletResult');
  let rows = [];
  let games = [];
  function setStatus(message, type){ statusBox.textContent = message || ''; statusBox.className = 'upload-status' + (type ? ' ' + type : ''); const top=document.getElementById('providerStatusBoxTop'); if(top){ top.textContent=message||''; top.className=statusBox.className; } }
  function setBusy(busy){ saveBtn.disabled = busy; refreshBtn.disabled = busy; saveBtn.innerHTML = busy ? '<i class="bi bi-hourglass-split"></i> Saving...' : '<i class="bi bi-save"></i> Save Provider'; }
  function reset(){ form.reset(); el.providerId.value=''; el.currency.value='MYR'; el.sortOrder.value='0'; el.providerStatus.value='1'; el.integrationType.value='GENERIC_API'; el.httpMethod.value='POST'; el.signatureType.value='MD5'; el.signatureOutputCase.value='LOWER'; el.ukeyLength.value='8'; el.ukeyPrefix.value=''; el.ukeyStaticValue.value=''; if(el.providerVariables) el.providerVariables.value=''; if(el.apiActionConfigs) el.apiActionConfigs.value=''; title.textContent='Create Provider'; el.providerCode.disabled=false; setStatus('', ''); window.scrollTo({top:0, behavior:'smooth'}); }
  function payload(){
    const data = {};
    if (el.providerId.value) data.id = Number(el.providerId.value);
    data.code = el.providerCode.value.trim().toUpperCase();
    data.name = el.providerName.value.trim();
    data.providerType = el.providerType.value;
    data.walletMode = el.walletMode.value;
    data.currency = el.currency.value.trim() || 'MYR';
    ['apiBaseUrl','operatorId','secretKey','providerVariables','apiActionConfigs','integrationType','httpMethod','signatureType','signatureOutputCase','signatureTemplate','ukeyLength','ukeyPrefix','ukeyStaticValue','createPlayerPath','balancePath','depositPath','withdrawPath','launchPath','gameListPath','createPlayerRequestTemplate','balanceRequestTemplate','depositRequestTemplate','withdrawRequestTemplate','launchRequestTemplate','gameListRequestTemplate','responseBalancePath','responseLaunchUrlPath','responseGameListPath','responseGameCodePath','responseGameNamePath','responseGameImagePath','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse','sortOrder'].forEach(k => {
      let value = el[k].value || '';
      if (k === 'ukeyLength' || k === 'sortOrder') value = value === '' ? null : Number(value);
      data[k] = value;
    });
    data.status = Number(el.providerStatus.value || '1');
    return data;
  }
  function edit(item){ el.providerId.value=item.id||''; el.providerCode.value=item.code||''; el.providerName.value=item.name||''; el.providerType.value=item.providerType||'SPORT'; el.walletMode.value=item.walletMode||'TRANSFER'; el.currency.value=item.currency||'MYR'; el.integrationType.value=item.integrationType||'GENERIC_API'; el.httpMethod.value=item.httpMethod||'POST'; el.apiBaseUrl.value=item.apiBaseUrl||''; el.operatorId.value=item.operatorId||''; el.secretKey.value=item.secretKey||''; if(el.providerVariables) el.providerVariables.value=item.providerVariables||''; if(el.apiActionConfigs) el.apiActionConfigs.value=item.apiActionConfigs||''; el.signatureType.value=item.signatureType||'MD5'; el.signatureOutputCase.value=item.signatureOutputCase||'LOWER'; el.signatureTemplate.value=item.signatureTemplate||''; el.ukeyLength.value=item.ukeyLength||8; el.ukeyPrefix.value=item.ukeyPrefix||''; el.ukeyStaticValue.value=item.ukeyStaticValue||''; el.createPlayerPath.value=item.createPlayerPath||''; el.balancePath.value=item.balancePath||''; el.depositPath.value=item.depositPath||''; el.withdrawPath.value=item.withdrawPath||''; el.launchPath.value=item.launchPath||''; el.gameListPath.value=item.gameListPath||''; el.createPlayerRequestTemplate.value=item.createPlayerRequestTemplate||''; el.balanceRequestTemplate.value=item.balanceRequestTemplate||''; el.depositRequestTemplate.value=item.depositRequestTemplate||''; el.withdrawRequestTemplate.value=item.withdrawRequestTemplate||''; el.launchRequestTemplate.value=item.launchRequestTemplate||''; el.gameListRequestTemplate.value=item.gameListRequestTemplate||''; el.responseBalancePath.value=item.responseBalancePath||''; el.responseLaunchUrlPath.value=item.responseLaunchUrlPath||''; el.responseGameListPath.value=item.responseGameListPath||''; el.responseGameCodePath.value=item.responseGameCodePath||''; el.responseGameNamePath.value=item.responseGameNamePath||''; ['responseGameImagePath','responseGameCategoryPath','responseSuccessPath','responseSuccessValue','responseErrorMessagePath','callbackMemberPath','callbackGameCodePath','callbackBetIdPath','callbackTxIdPath','callbackBetAmountPath','callbackWinAmountPath','callbackValidBetAmountPath','callbackRoundIdPath','callbackStatusPath','callbackEventTypePath','callbackSignaturePath','callbackSuccessResponse','callbackDuplicateResponse'].forEach(k=>{ if(el[k]) el[k].value=item[k]||''; }); el.sortOrder.value=item.sortOrder??0; el.providerStatus.value=String(item.status??1); el.providerCode.disabled=true; title.textContent='Edit Provider #' + item.id; setStatus('Editing provider. Games using this Provider Code will group under this provider.', 'success'); window.scrollTo({top:0, behavior:'smooth'}); }
  function providerOptions(){ const opts = rows.map(x => `<option value="${escapeHtml(x.code)}">${escapeHtml(x.code)} - ${escapeHtml(x.name)}</option>`).join('') || '<option value="">No provider</option>'; walletProviderCode.innerHTML = opts; const cb=document.getElementById('callbackProviderCode'); if(cb) cb.innerHTML=opts; }
  function render(){ list.innerHTML=''; empty.hidden = rows.length > 0; providerOptions(); rows.forEach(item => { const linkedGames = games.filter(g => String(g.providerCode || '').toUpperCase() === String(item.code || '').toUpperCase()); const gameHtml = linkedGames.length ? linkedGames.slice(0, 8).map(g => `<span class="slider-pill active"><i class="bi bi-joystick"></i>${escapeHtml(g.name || ('Game #' + g.id))}</span>`).join('') + (linkedGames.length > 8 ? `<span class="slider-pill inactive">+${linkedGames.length - 8} more</span>` : '') : '<small class="text-secondary">No game linked yet. Set this code in Game → Provider Code.</small>'; const card=document.createElement('div'); card.className='manage-card'; card.innerHTML=`<div class="manage-thumb game-thumb"><i class="bi bi-hdd-network fs-1 text-secondary"></i></div><div class="manage-card-body"><div class="slider-card-title"><b>${escapeHtml(item.code)} - ${escapeHtml(item.name)}</b>${statusPill(item.status)}</div><div class="slider-meta"><span><i class="bi bi-tag me-1"></i>${escapeHtml(item.providerType || '-')}</span><span><i class="bi bi-wallet2 me-1"></i>${escapeHtml(item.walletMode || 'TRANSFER')}</span><span><i class="bi bi-plug me-1"></i>${escapeHtml(item.integrationType || 'GENERIC_API')}</span><span><i class="bi bi-cash me-1"></i>${escapeHtml(item.currency || 'MYR')}</span><span><i class="bi bi-controller me-1"></i>${linkedGames.length} games</span><span><i class="bi bi-link-45deg me-1"></i>${escapeHtml(item.apiBaseUrl || '-')}</span><span><i class="bi bi-sort-numeric-down me-1"></i>Sort: ${escapeHtml(item.sortOrder ?? 0)}</span></div><div class="d-flex gap-2 flex-wrap mt-2">${gameHtml}</div></div><div class="slider-card-actions"><button class="clean-btn primary" type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i> Edit</button><button class="clean-btn danger" type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash"></i> Delete</button></div>`; list.appendChild(card); }); }
  async function load(){ list.innerHTML='<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading providers...</b></div>'; try { const [providerJson, gameJson] = await Promise.all([fetchJson(PROVIDER_API.list), fetchJson(GAME_API.list).catch(() => ({data: []}))]); rows=providerJson.data||[]; games=gameJson.data||[]; render(); } catch(err){ list.innerHTML=''; empty.hidden=false; empty.innerHTML=`<i class="bi bi-exclamation-triangle"></i><b>Unable to load providers</b><small>${escapeHtml(err.message)}</small>`; } }
  async function save(e){ e.preventDefault(); if(!el.providerCode.value.trim() || !el.providerName.value.trim()){ setStatus('Provider code and name are required.', 'error'); return; } setBusy(true); try{ const json=await fetchJson(el.providerId.value ? PROVIDER_API.update : PROVIDER_API.create, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload())}); setStatus(json.message || 'Saved.', 'success'); reset(); await load(); } catch(err){ setStatus(err.message || 'Save failed.', 'error'); } finally{ setBusy(false); } }
  async function remove(id){ if(!confirm('Delete this provider? Games will not be deleted, but provider will become inactive.')) return; const data=new FormData(); data.append('id', id); try{ const json=await fetchJson(PROVIDER_API.delete, {method:'POST', body:data}); setStatus(json.message || 'Deleted.', 'success'); await load(); } catch(err){ setStatus(err.message || 'Delete failed.', 'error'); } }
  async function wallet(action){
    const memberId=document.getElementById('walletMemberId').value;
    const providerCode=walletProviderCode.value;
    const amount=document.getElementById('walletAmount').value;
    const gameCode=document.getElementById('walletGameCode').value;
    if(action !== 'pull-log-debug' && !memberId){ walletStatusBox.textContent='Please enter Member ID.'; walletStatusBox.className='upload-status error'; return; }

    let url=WALLET_API[action.replace(/-([a-z])/g, function(_,c){ return c.toUpperCase(); })];
    let options={};

    if(action==='pull-log-debug'){
      if(!providerCode){ walletStatusBox.textContent='Please select provider.'; walletStatusBox.className='upload-status error'; return; }
      url = WALLET_API.pullLogDebug + '?providerCode=' + encodeURIComponent(providerCode);
      options = { method:'POST' };
    } else if(action==='main-balance'){
      url = WALLET_API.mainBalance + '?memberId=' + encodeURIComponent(memberId);
    } else if(action==='main-deposit' || action==='main-withdraw'){
      if(!amount || Number(amount) <= 0){ walletStatusBox.textContent='Please enter amount.'; walletStatusBox.className='upload-status error'; return; }
      url = WALLET_API.mainAdjust;
      options = {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          memberId: Number(memberId),
          type: action === 'main-deposit' ? 'DEPOSIT' : 'WITHDRAW',
          amount: Number(amount),
          externalTxId: 'BO-MAIN-' + Date.now(),
          remark: action === 'main-deposit' ? 'BO main wallet deposit' : 'BO main wallet withdraw'
        })
      };
    } else if(action==='balance'){
      url += '?memberId=' + encodeURIComponent(memberId) + '&providerCode=' + encodeURIComponent(providerCode);
    } else {
      const data=new FormData();
      data.append('memberId', memberId);
      data.append('providerCode', providerCode);
      data.append('gameCode', gameCode);
      if(amount) data.append('amount', amount);
      data.append('externalTxId', 'BO-' + Date.now());
      if(action==='api-preview') url += '?action=' + encodeURIComponent((document.getElementById('previewAction') && document.getElementById('previewAction').value) || 'CREATE_PLAYER');
      options={method:'POST', body:data};
    }

    try{
      walletStatusBox.textContent='Processing...';
      walletStatusBox.className='upload-status';
      const json=await fetchJson(url, options);
      walletStatusBox.textContent=json.message || 'Success';
      walletStatusBox.className='upload-status success';
      walletResult.textContent=JSON.stringify(json.data, null, 2);
    } catch(err){
      walletStatusBox.textContent=err.message || 'Request failed';
      walletStatusBox.className='upload-status error';
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

  async function syncGames(){ const providerCode = walletProviderCode.value || (rows[0] && rows[0].code); if(!providerCode){ setStatus('Please create/select provider first.', 'error'); return; } if(!confirm('Sync games from provider ' + providerCode + '?')) return; try{ setStatus('Syncing provider games...', ''); const data=new FormData(); data.append('providerCode', providerCode); const json=await fetchJson(PROVIDER_GAME_API.sync, {method:'POST', body:data}); setStatus('Game sync completed. Inserted: '+json.data.inserted+', Updated: '+json.data.updated+'. Path: '+(json.data.gameListPath || '-'), 'success'); if(window.walletResult) walletResult.textContent=JSON.stringify(json.data, null, 2); await load(); }catch(err){ setStatus(err.message || 'Game sync failed.', 'error'); if(window.walletResult) walletResult.textContent='Sync error:\n' + (err.message || 'Game sync failed') + '\n\nOpen Provider Transactions page and filter Tx Type = GAME_LIST to inspect request/response.'; } }
  async function debugGames(){ const providerCode = walletProviderCode.value || (rows[0] && rows[0].code); if(!providerCode){ setStatus('Please create/select provider first.', 'error'); return; } try{ setStatus('Debugging provider game list...', ''); const data=new FormData(); data.append('providerCode', providerCode); const json=await fetchJson(PROVIDER_GAME_API.debug, {method:'POST', body:data}); setStatus('Debug completed. Check result box below and Provider Transactions page.', (json.data.configuredPathIsArray || json.data.normalizedGameRows > 0) ? 'success' : 'error'); if(window.walletResult) walletResult.textContent=formatProviderDebug(json.data); }catch(err){ setStatus(err.message || 'Debug failed.', 'error'); if(window.walletResult) walletResult.textContent='Debug error:\n' + (err.message || 'Debug failed') + '\n\nOpen Provider Transactions page and filter Tx Type = GAME_LIST.'; } }
  async function callbackPreview(){ const code=document.getElementById('callbackProviderCode').value; const raw=document.getElementById('callbackSample').value || '{}'; const box=document.getElementById('callbackResult'); try{ const json=await fetchJson(CALLBACK_API.previewBase + '/' + encodeURIComponent(code), {method:'POST', headers:{'Content-Type':'application/json'}, body:raw}); box.textContent=JSON.stringify(json.data,null,2); }catch(err){ box.textContent=err.message || 'Callback preview failed'; } }
  async function ledgerSummary(){ const code=document.getElementById('callbackProviderCode').value; const from=document.getElementById('reportFrom').value; const to=document.getElementById('reportTo').value; const box=document.getElementById('callbackResult'); let url=CALLBACK_API.report + '?providerCode=' + encodeURIComponent(code); if(from) url += '&from=' + encodeURIComponent(from); if(to) url += '&to=' + encodeURIComponent(to); try{ const json=await fetchJson(url); box.textContent=JSON.stringify(json.data,null,2); }catch(err){ box.textContent=err.message || 'Report failed'; } }

  function live22ActionPreset(){
    return {
      GAME_LIST: {
        functionName: 'GetGameList',
        path: '/GetGameList',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "Lang": "${Lang}",\n  "Currency": "${Currency}"\n}'
      },

      PULL_LOG: {
        functionName: 'PullLog',
        path: '/PullLog',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}"\n}',
        responseListPath: 'Logs'
      },
      CREATE_PLAYER: {
        functionName: 'CreatePlayer',
        path: '/CreatePlayer',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}${PlayerId}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "PlayerId": "${PlayerId}"\n}'
      },
      BALANCE: {
        functionName: 'CheckBalance',
        path: '/CheckBalance',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}${PlayerId}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "PlayerId": "${PlayerId}"\n}'
      },
      DEPOSIT: {
        functionName: 'Deposit',
        path: '/Deposit',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}${PlayerId}${TransactionId}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "PlayerId": "${PlayerId}",\n  "Amount": "${amount}",\n  "TransactionId": "${TransactionId}"\n}'
      },
      WITHDRAW: {
        functionName: 'Withdraw',
        path: '/Withdraw',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}${PlayerId}${TransactionId}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "PlayerId": "${PlayerId}",\n  "Amount": "${amount}",\n  "TransactionId": "${TransactionId}"\n}'
      },
      LAUNCH: {
        functionName: 'GameLogin',
        path: '/GameLogin',
        httpMethod: 'POST',
        signatureTemplate: '${function_name}${request_datetime}${OperatorId}${SecretKey}${PlayerId}',
        requestTemplate: '{\n  "OperatorId": "${OperatorId}",\n  "RequestDateTime": "${request_datetime}",\n  "Signature": "${signature}",\n  "PlayerId": "${PlayerId}",\n  "Ip": "${ip}",\n  "GameCode": "${GameCode}",\n  "Currency": "${Currency}",\n  "Lang": "${Lang}",\n  "RedirectUrl": "${RedirectUrl}"\n}'
      }
    };
  }
  function fachaiActionPreset(){
    return {
      GAME_LIST: {
        functionName: 'GetGameIconList',
        path: '/GetGameIconList',
        httpMethod: 'POST',
        signatureTemplate: '${rawJson}',
        requestTemplate: '{\n  "AgentCode": "${AgentCode}",\n  "Currency": "${Currency}",\n  "Params": "${aes128ecb_base64:${rawJson}:${AgentKey}}",\n  "Sign": "${signature}"\n}',
        responseListPath: 'GetGameIconList',
        gameCodePath: '@key',
        gameNamePath: 'gameNameOfEnglish',
        gameImagePath: 'enUrl',
        gameCategoryPath: '@group',
        successPath: 'Result',
        successValue: '0'
      }
    };
  }
  function fillFachaiPreset(){
    if(!el.apiActionConfigs) return;
    el.providerCode.value = el.providerCode.value || 'FACHAI';
    el.providerName.value = el.providerName.value || 'FaChai Gaming';
    el.providerType.value = 'SLOT';
    el.apiBaseUrl.value = el.apiBaseUrl.value || 'https://api.fcg666.net';
    el.gameListPath.value = '/GetGameIconList';
    el.signatureType.value = 'MD5';
    el.signatureOutputCase.value = 'LOWER';
    el.signatureTemplate.value = '${rawJson}';
    el.apiActionConfigs.value = JSON.stringify(fachaiActionPreset(), null, 2);
    if(!el.providerVariables.value.trim()){
      el.providerVariables.value = JSON.stringify({AgentCode: 'TIT', Currency: el.currency.value || 'MYR', AgentKey: 'Ks7mUzBnRGoGn0Es', rawJson: '{}'}, null, 2);
    }
    el.gameListRequestTemplate.value = '{\n  "AgentCode": "${AgentCode}",\n  "Currency": "${Currency}",\n  "Params": "${aes128ecb_base64:${rawJson}:${AgentKey}}",\n  "Sign": "${signature}"\n}';
    el.responseGameListPath.value = 'GetGameIconList';
    el.responseGameCodePath.value = '@key';
    el.responseGameNamePath.value = 'gameNameOfEnglish';
    el.responseGameImagePath.value = 'enUrl';
    el.responseGameCategoryPath.value = '@group';
    el.responseSuccessPath.value = 'Result';
    el.responseSuccessValue.value = '0';
    setStatus('FaChai/JDB game list preset filled. Save provider, then use Debug Game List or Sync Selected Games.', 'success');
  }

  function fillLive22Preset(){
    if(!el.apiActionConfigs) return;
    el.apiActionConfigs.value = JSON.stringify(live22ActionPreset(), null, 2);
    if(!el.providerVariables.value.trim()){
      el.providerVariables.value = JSON.stringify({OperatorId: el.operatorId.value || 'YOUR_LIVE22_OPERATOR_ID', SecretKey: el.secretKey.value || 'YOUR_LIVE22_SECRET_KEY', Lang: 'en-us', Currency: el.currency.value || 'MYR', RedirectUrl: 'https://your-frontend-domain.com'}, null, 2);
    }
    el.responseGameListPath.value = el.responseGameListPath.value || 'Game';
    el.responseGameCodePath.value = el.responseGameCodePath.value || 'GameCode';
    el.responseGameNamePath.value = el.responseGameNamePath.value || 'GameName';
    el.responseGameImagePath.value = el.responseGameImagePath.value || 'ImageUrl';
    el.responseGameCategoryPath.value = el.responseGameCategoryPath.value || 'GameType';
    el.responseSuccessPath.value = el.responseSuccessPath.value || 'Status';
    el.responseSuccessValue.value = el.responseSuccessValue.value || '200';
    el.responseErrorMessagePath.value = el.responseErrorMessagePath.value || 'Description';
    setStatus('Live22 action preset filled. Save provider, then use API Payload Preview / Debug Game List.', 'success');
  }
  function formatActionConfig(){
    if(!el.apiActionConfigs) return;
    try{ el.apiActionConfigs.value = JSON.stringify(JSON.parse(el.apiActionConfigs.value || '{}'), null, 2); setStatus('API Action Configs JSON formatted.', 'success'); }
    catch(err){ setStatus('API Action Configs JSON invalid: ' + err.message, 'error'); }
  }

  form.addEventListener('submit', save); const live22PresetBtn=document.getElementById('fillLive22ActionPresetBtn'); if(live22PresetBtn) live22PresetBtn.addEventListener('click', fillLive22Preset); const fachaiPresetBtn=document.getElementById('fillFachaiActionPresetBtn'); if(fachaiPresetBtn) fachaiPresetBtn.addEventListener('click', fillFachaiPreset); const formatActionBtn=document.getElementById('formatActionConfigBtn'); if(formatActionBtn) formatActionBtn.addEventListener('click', formatActionConfig); resetBtn.addEventListener('click', reset); refreshBtn.addEventListener('click', load); list.addEventListener('click', e => { const eb=e.target.closest('[data-edit-id]'), db=e.target.closest('[data-delete-id]'); if(eb){ const item=rows.find(x=>String(x.id)===String(eb.dataset.editId)); if(item) edit(item); } if(db) remove(db.dataset.deleteId); }); document.querySelectorAll('[data-wallet-action]').forEach(btn => btn.addEventListener('click', () => wallet(btn.dataset.walletAction))); const syncBtn=document.getElementById('syncSelectedProviderBtn'); if(syncBtn) syncBtn.addEventListener('click', syncGames); const debugBtn=document.getElementById('debugSelectedProviderBtn'); if(debugBtn) debugBtn.addEventListener('click', debugGames); const cbBtn=document.getElementById('callbackPreviewBtn'); if(cbBtn) cbBtn.addEventListener('click', callbackPreview); const reportBtn=document.getElementById('ledgerSummaryBtn'); if(reportBtn) reportBtn.addEventListener('click', ledgerSummary); reset(); load();
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
