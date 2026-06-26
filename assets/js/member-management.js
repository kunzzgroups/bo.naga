(function(){
  let allMembers = [];
  let selectedWalletMember = null;
  let selectedWalletBalance = 0;
  const MEMBER_WALLET_API = {
    balance: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_BALANCE,
    adjust: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_ADJUST,
    providerAccounts: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_PROVIDER_ACCOUNTS,
    ledgerList: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.WALLET_LEDGER_LIST,
    betList: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PROVIDER_BET_REPORT_LIST
  };
  const MONEY_KEYS = {
    deposit: ['deposit','totalDeposit','depositAmount','total_deposit'],
    withdraw: ['withdraw','totalWithdraw','withdrawAmount','total_withdraw'],
    winLoss: ['winLoss','win_loss','totalWinLoss','profitLoss'],
    bonus: ['bonus','totalBonus','bonusAmount'],
    manual: ['manual','manualAdjust','manualAmount'],
    commission: ['commission','totalCommission','commissionAmount']
  };

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function api(url,opt){const r=await fetch(url,opt||{});const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  function val(id){const el=document.getElementById(id); return el ? String(el.value||'').trim().toLowerCase() : '';}
  function first(m, keys, fallback='-'){
    for(const k of keys){ if(m && m[k] !== undefined && m[k] !== null && String(m[k]).trim() !== '') return m[k]; }
    return fallback;
  }
  function num(v){
    if(v === undefined || v === null || v === '') return 0;
    const n = Number(String(v).replace(/,/g,''));
    return Number.isFinite(n) ? n : 0;
  }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function dt(v){ return window.BO_FORMAT && window.BO_FORMAT.dateTime ? window.BO_FORMAT.dateTime(v) : (v ? String(v).replace('T',' ').slice(0,19) : '-'); }
  function signedAmount(type, amount){
    const n = num(amount);
    if(type === 'WITHDRAW') return -Math.abs(n);
    if(type === 'ADJUSTMENT') return n;
    return Math.abs(n);
  }
  function walletStatus(msg, type){ const el=document.getElementById('walletModalStatus'); if(el){ el.textContent=msg||''; el.className='upload-status' + (type ? ' ' + type : ''); } }
  function walletResult(data){ const el=document.getElementById('walletModalResult'); if(el) el.textContent = data ? JSON.stringify(data, null, 2) : ''; }
  function setWalletTab(name){
    document.querySelectorAll('[data-wallet-tab]').forEach(btn=>btn.classList.toggle('active', btn.dataset.walletTab === name));
    document.querySelectorAll('[data-wallet-pane]').forEach(pane=>pane.classList.toggle('active', pane.dataset.walletPane === name));
    if(name === 'provider') loadWalletProviderAccounts().catch(err=>renderProviderError(err.message));
    if(name === 'ledger') loadWalletLedgerPreview().catch(err=>renderLedgerError(err.message));
    if(name === 'bet') loadWalletBetPreview().catch(err=>renderBetError(err.message));
  }
  function memberIdOfSelected(){ return selectedWalletMember ? first(selectedWalletMember,['id','memberId','userId'], '') : ''; }
  function infoGrid(items){ return '<div class="wallet-balance-box">' + items.map(([k,v])=>`<div class="mini-box"><span>${esc(k)}</span><b style="font-size:15px">${esc(v || '-')}</b></div>`).join('') + '</div>'; }
  function renderMemberInfo(member){
    const profile = document.getElementById('walletProfileInfo');
    const bank = document.getElementById('walletBankInfo');
    const activity = document.getElementById('walletActivityInfo');
    if(profile) profile.innerHTML = infoGrid([
      ['Username', first(member,['username'], '-')], ['Full Name', first(member,['fullName','name','displayName'], '-')],
      ['Mobile', first(member,['mobile','phone','mobileNo'], '-')], ['Status', memberStatus(member)],
      ['Referrer', first(member,['referrerCode','referrer','agent'], '-')], ['Top Referrer', first(member,['topReferrer','topAgent','upline'], '-')]
    ]);
    if(bank) bank.innerHTML = infoGrid([
      ['Bank', first(member,['bank','bankName'], '-')], ['Bank Account', first(member,['bankAccount','bankAccountNumber','bankAccountNo','accountNo'], '-')],
      ['Account Name', first(member,['bankAccountName','accountName','fullName','name'], '-')], ['Bank BSB', first(member,['bankBsb'], '-')],
      ['Pay ID', first(member,['payId'], '-')], ['Show BSB', Number(first(member,['showBankBsb'],1))===1?'Yes':'No'], ['Show Pay ID', Number(first(member,['showPayId'],1))===1?'Yes':'No']
    ]);
    if(activity) activity.innerHTML = infoGrid([
      ['Register Date', dt(first(member,['createdAt','registerDate','created_at'], ''))], ['Last Login', dt(first(member,['lastLoginAt','lastLogin','last_login_at'], ''))],
      ['Last Deposit', dt(first(member,['lastDepositAt','lastDeposit','last_deposit_at'], ''))]
    ]);
  }
  function fillBankEdit(member){
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value = v == null ? '' : v; };
    set('editBankName', first(member,['bankName','bank'], ''));
    set('editBankAccountName', first(member,['bankAccountName','accountName','fullName','name'], ''));
    set('editBankAccountNumber', first(member,['bankAccountNumber','bankAccount','bankAccountNo','accountNo'], ''));
    set('editBankBsb', first(member,['bankBsb'], ''));
    set('editPayId', first(member,['payId'], ''));
    set('editShowBankBsb', Number(first(member,['showBankBsb'],1))===1 ? '1' : '0');
    set('editShowPayId', Number(first(member,['showPayId'],1))===1 ? '1' : '0');
  }
  function bankStatus(msg,type){ const el=document.getElementById('bankProfileStatus'); if(el){ el.textContent=msg||''; el.className='upload-status' + (type ? ' ' + type : ''); } }
  async function saveBankProfile(){
    if(!selectedWalletMember) return;
    const memberId = memberIdOfSelected();
    const payload = {
      bankName: document.getElementById('editBankName')?.value || '',
      bankAccountName: document.getElementById('editBankAccountName')?.value || '',
      bankAccountNumber: document.getElementById('editBankAccountNumber')?.value || '',
      bankBsb: document.getElementById('editBankBsb')?.value || '',
      payId: document.getElementById('editPayId')?.value || '',
      showBankBsb: Number(document.getElementById('editShowBankBsb')?.value || 0),
      showPayId: Number(document.getElementById('editShowPayId')?.value || 0)
    };
    try{
      bankStatus('Saving...', '');
      const json = await api(BO_AUTH.memberUpdateUrl(memberId), {method:'POST', headers:{'Content-Type':'application/json', ...BO_AUTH.authHeader()}, body: JSON.stringify(payload)});
      bankStatus(json.message || 'Saved.', 'success');
      await loadMembers();
      const latest = allMembers.find(m => String(first(m,['id','memberId','userId'], '')) === String(memberId));
      if(latest){ selectedWalletMember = latest; renderMemberInfo(latest); fillBankEdit(latest); }
    }catch(err){ bankStatus(err.message || 'Save failed', 'error'); }
  }
  function renderProviderError(message){ const body=document.getElementById('walletProviderBody'); if(body) body.innerHTML = '<tr><td colspan="7" class="text-danger">'+esc(message || 'Load provider accounts failed')+'</td></tr>'; }
  function renderLedgerError(message){ const body=document.getElementById('walletLedgerPreviewBody'); if(body) body.innerHTML = '<tr><td colspan="7" class="text-danger">'+esc(message || 'Load ledger failed')+'</td></tr>'; }
  function renderBetError(message){ const body=document.getElementById('walletBetPreviewBody'); if(body) body.innerHTML = '<tr><td colspan="8" class="text-danger">'+esc(message || 'Load bet records failed')+'</td></tr>'; }
  async function loadWalletProviderAccounts(){
    const body=document.getElementById('walletProviderBody'); if(!body) return;
    const memberId = memberIdOfSelected(); if(!memberId) return;
    body.innerHTML = '<tr><td colspan="7">Loading provider accounts...</td></tr>';
    const json = await api(MEMBER_WALLET_API.providerAccounts + '?memberId=' + encodeURIComponent(memberId), {headers:{...BO_AUTH.authHeader()}});
    const raw = json.data || [];
    const rows = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
    if(!rows.length){ body.innerHTML = '<tr><td colspan="7">No provider account found.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>`<tr>
      <td><b>${esc(first(r,['providerCode','provider','code'], '-'))}</b></td>
      <td>${esc(first(r,['providerUsername','accountId','username','playerId'], '-'))}</td>
      <td>${money(first(r,['balance','providerBalance','walletBalance'],0))}</td>
      <td>${money(first(r,['totalBet'],0))}</td>
      <td>${money(first(r,['totalWin'],0))}</td>
      <td>${money(first(r,['totalLose'],0))}</td>
      <td><span class="status-pill">${esc(first(r,['status'], '-'))}</span></td>
    </tr>`).join('');
  }
  async function loadWalletLedgerPreview(){
    const body=document.getElementById('walletLedgerPreviewBody'); if(!body) return;
    const memberId = memberIdOfSelected(); if(!memberId) return;
    const link=document.getElementById('walletOpenLedgerPage'); if(link) link.href = 'wallet-ledger.html?memberId=' + encodeURIComponent(memberId);
    body.innerHTML = '<tr><td colspan="7">Loading latest ledger...</td></tr>';
    const params = new URLSearchParams({memberId:String(memberId), page:'1', size:'10'});
    const json = await api(MEMBER_WALLET_API.ledgerList + '?' + params.toString(), {headers:{...BO_AUTH.authHeader()}});
    const data = json.data || {};
    const rows = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
    if(!rows.length){ body.innerHTML = '<tr><td colspan="7">No ledger record found.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>`<tr>
      <td>${esc(dt(first(r,['createdAt','created_at'], '')))}</td>
      <td><span class="status-pill">${esc(first(r,['ledgerType','type'], '-'))}</span></td>
      <td>${esc(first(r,['providerCode'], '-'))}</td>
      <td><b class="${num(first(r,['amount'],0)) < 0 ? 'text-danger' : 'text-success'}">${money(first(r,['amount'],0))}</b></td>
      <td>${money(first(r,['beforeBalance'],0))}</td>
      <td>${money(first(r,['afterBalance'],0))}</td>
      <td><small>${esc(first(r,['referenceNo','externalTxId'], '-'))}</small></td>
    </tr>`).join('');
  }
  async function loadWalletBetPreview(){
    const body=document.getElementById('walletBetPreviewBody'); if(!body) return;
    const memberId = memberIdOfSelected(); if(!memberId) return;
    const link=document.getElementById('walletOpenBetPage'); if(link) link.href = 'provider-bet-report.html?memberId=' + encodeURIComponent(memberId);
    body.innerHTML = '<tr><td colspan="8">Loading latest bet records...</td></tr>';
    const params = new URLSearchParams({memberId:String(memberId), page:'1', size:'10'});
    const json = await api(MEMBER_WALLET_API.betList + '?' + params.toString(), {headers:{...BO_AUTH.authHeader()}});
    const data = json.data || {};
    const rows = Array.isArray(data.content) ? data.content : (Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));
    if(!rows.length){ body.innerHTML = '<tr><td colspan="8">No bet record found.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>{
      const bet = first(r,['betAmount','transferAmount','amount'],0);
      const win = first(r,['winAmount','transferBackAmount','payoutAmount'],0);
      const net = first(r,['netAmount','winLoss'], num(win)-num(bet));
      return `<tr>
      <td>${esc(dt(first(r,['createdAt','startedAt','betTime','created_at'], '')))}</td>
      <td>${esc(first(r,['providerCode','provider'], '-'))}</td>
      <td>${esc(first(r,['gameName','gameCode','gameId'], '-'))}</td>
      <td><small>${esc(first(r,['betId','txId','roundId','transactionId','id'], '-'))}</small></td>
      <td>${money(bet)}</td>
      <td>${money(first(r,['validBetAmount','validAmount','turnover','transferAmount'],0))}</td>
      <td>${money(win)}</td>
      <td><b class="${num(net) < 0 ? 'text-danger' : 'text-success'}">${money(net)}</b></td>
    </tr>`;
    }).join('');
  }

  function updateWalletPreview(){
    const type = document.getElementById('walletAdjustType')?.value || 'DEPOSIT';
    const amount = document.getElementById('walletAdjustAmount')?.value || 0;
    const next = selectedWalletBalance + signedAmount(type, amount);
    const el=document.getElementById('walletNewBalance'); if(el) el.textContent = '$' + money(next);
  }
  async function loadMemberWallet(memberId){
    const json = await api(MEMBER_WALLET_API.balance + '?memberId=' + encodeURIComponent(memberId), {headers:{...BO_AUTH.authHeader()}});
    const balance = num(json && json.data && json.data.balance);
    selectedWalletBalance = balance;
    const bal=document.getElementById('walletCurrentBalance'); if(bal) bal.textContent = '$' + money(balance);
    updateWalletPreview();
    walletResult(json.data);
  }
  function openWalletModal(member){
    selectedWalletMember = member;
    selectedWalletBalance = 0;
    const modal=document.getElementById('memberWalletModal'); if(!modal) return;
    const id = first(member,['id','memberId','userId'], '');
    const username = first(member,['username'], '-');
    document.getElementById('walletMemberAvatar').textContent = String(username || 'M').slice(0,1).toUpperCase();
    document.getElementById('walletMemberName').textContent = username;
    document.getElementById('walletMemberInfo').textContent = 'ID: ' + id + ' • ' + first(member,['mobile','phone','mobileNo'], '-');
    document.getElementById('walletAdjustAmount').value = '';
    document.getElementById('walletAdjustRemark').value = '';
    walletStatus('', ''); walletResult(null);
    renderMemberInfo(member);
    fillBankEdit(member);
    bankStatus('', '');
    setWalletTab('main');
    modal.hidden = false;
    loadMemberWallet(id).catch(err=>walletStatus(err.message || 'Load wallet failed', 'error'));
  }
  function closeWalletModal(){ const modal=document.getElementById('memberWalletModal'); if(modal) modal.hidden = true; }
  async function submitWalletAdjust(){
    if(!selectedWalletMember) return;
    const memberId = first(selectedWalletMember,['id','memberId','userId'], '');
    const type = document.getElementById('walletAdjustType').value;
    const amount = document.getElementById('walletAdjustAmount').value;
    const remark = document.getElementById('walletAdjustRemark').value;
    const amountNumber = Number(amount);
    if(!amount || !Number.isFinite(amountNumber) || (type !== 'ADJUSTMENT' && amountNumber <= 0) || (type === 'ADJUSTMENT' && amountNumber === 0)){ walletStatus(type === 'ADJUSTMENT' ? 'Please enter positive or negative adjustment amount.' : 'Please enter amount greater than 0.', 'error'); return; }
    try{
      walletStatus('Processing main wallet...', '');
      const json = await api(MEMBER_WALLET_API.adjust, {method:'POST', headers:{'Content-Type':'application/json', ...BO_AUTH.authHeader()}, body: JSON.stringify({memberId:Number(memberId), type, amount:Number(amount), externalTxId:'BO-MEMBER-' + Date.now(), remark})});
      walletStatus(json.message || 'Main wallet updated.', 'success');
      walletResult(json.data);
      await loadMemberWallet(memberId);
      await loadMembers();
    }catch(err){ walletStatus(err.message || 'Wallet adjustment failed', 'error'); }
  }

  function memberStatus(m){
    if(Number(first(m,['locked','isLocked'],0)) === 1 || first(m,['lockStatus'], '').toString().toLowerCase()==='locked') return 'LOCKED';
    const raw = first(m,['status','accountStatus'],1);
    if(Number(raw) === 0 || String(raw).toLowerCase()==='inactive') return 'INACTIVE';
    return 'ACTIVE';
  }
  function metric(id, value){ const el=document.getElementById(id); if(el) el.textContent = value; }
  function updateStats(rows){
    const total = rows.length;
    const active = rows.filter(m=>memberStatus(m)==='ACTIVE').length;
    const onlineToday = rows.filter(m=>String(first(m,['lastLoginAt','lastLogin','last_login_at'], '')).slice(0,10) === todayStr()).length;
    const totalDeposit = rows.reduce((s,m)=>s+num(first(m,MONEY_KEYS.deposit,0)),0);
    metric('metricTotalUsers', total.toLocaleString());
    metric('metricActiveUsers', active.toLocaleString());
    metric('metricTotalDeposit', money(totalDeposit));
    metric('metricOnlineToday', onlineToday.toLocaleString());
  }
  function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

  function memberMatches(m){
    const name = val('memberSearchName');
    const mobile = val('memberSearchMobile');
    const agent = val('memberSearchAgent');
    const bank = val('memberSearchBank');
    const status = val('memberSearchStatus');
    const lock = val('memberSearchLock');
    const visit = val('memberSearchVisit');
    const hayName = `${first(m,['username'], '')} ${first(m,['fullName','name','displayName'], '')}`.toLowerCase();
    const hayMobile = String(first(m,['mobile','phone','mobileNo'], '')).toLowerCase();
    const hayAgent = String(first(m,['referrerCode','referrer','agent','agentName'], '')).toLowerCase();
    const hayBank = String(first(m,['bank','bankName'], '')).toLowerCase();
    const rowStatus = memberStatus(m).toLowerCase();
    const rowLock = rowStatus === 'locked' ? 'locked' : 'normal';
    if(name && !hayName.includes(name)) return false;
    if(mobile && !hayMobile.includes(mobile)) return false;
    if(agent && !hayAgent.includes(agent)) return false;
    if(bank && !hayBank.includes(bank)) return false;
    if(status && rowStatus !== status) return false;
    if(lock && rowLock !== lock) return false;
    if(visit){
      const last = String(first(m,['lastLoginAt','lastLogin','last_login_at'], '')).slice(0,10);
      if(visit === 'today' && last !== todayStr()) return false;
      if(visit === 'this week'){
        const d = last ? new Date(last+'T00:00:00') : null;
        const start = new Date(); start.setDate(start.getDate()-6); start.setHours(0,0,0,0);
        if(!d || d < start) return false;
      }
    }
    return true;
  }

  function renderMembers(rows){
    const table=document.querySelector('.user-main-table tbody'); if(!table) return;
    updateStats(rows);
    if(!rows.length){ table.innerHTML='<tr><td colspan="17">No member found.</td></tr>'; return; }
    table.innerHTML=rows.map(m=>{
      const status = memberStatus(m);
      const locked = status === 'LOCKED';
      const id = first(m,['id','memberId','userId'], '');
      return `<tr>
        <td>${esc(dt(first(m,['createdAt','registerDate','created_at'], '')))}</td>
        <td><b>${esc(first(m,['username'], '-'))}</b><br><small>${esc(first(m,['fullName','name','displayName'], ''))}</small></td>
        <td>${esc(first(m,['mobile','phone','mobileNo'], '-'))}</td>
        <td>${esc(first(m,['bankAccount','bankAccountNo','accountNo'], '-'))}</td>
        <td>${esc(first(m,['bank','bankName'], '-'))}</td>
        <td>${esc(first(m,['referrerCode','referrer','agent'], '-'))}</td>
        <td>${esc(first(m,['topReferrer','topAgent','upline'], '-'))}</td>
        <td><b>${money(first(m,['mainWalletBalance','mainBalance','balance'],0))}</b></td>
        <td>${money(first(m,MONEY_KEYS.deposit,0))}</td>
        <td>${money(first(m,MONEY_KEYS.withdraw,0))}</td>
        <td>${money(first(m,MONEY_KEYS.winLoss,0))}</td>
        <td>${money(first(m,MONEY_KEYS.bonus,0))}</td>
        <td>${money(first(m,MONEY_KEYS.manual,0))}</td>
        <td>${money(first(m,MONEY_KEYS.commission,0))}</td>
        <td>${esc(dt(first(m,['lastDepositAt','lastDeposit','last_deposit_at'], '')))}</td>
        <td>${esc(dt(first(m,['lastLoginAt','lastLogin','last_login_at'], '')))}<br><small class="status-pill ${locked?'off':''}">${esc(status)}</small></td>
        <td><div class="d-flex gap-2 flex-wrap"><button class="clean-btn primary" data-member-wallet="${esc(id)}">View</button><button class="clean-btn" data-member-lock="${esc(id)}" data-lock="${locked?0:1}">${locked?'Unlock':'Lock'}</button></div></td>
      </tr>`;
    }).join('');
  }

  function applySearch(){ renderMembers(allMembers.filter(memberMatches)); }


  function memberKey(m){
    return String(first(m, ['id','memberId','userId'], '') || '');
  }

  function normalizePageRows(data){
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.content)) return data.content;
    if(data && data.data && Array.isArray(data.data.content)) return data.data.content;
    if(data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async function loadWalletSummaryMap(){
    const map = new Map();
    if(!API_CONFIG.ENDPOINTS.MEMBER_WALLET_LIST) return map;
    try{
      const params = new URLSearchParams({page:'1', size:'10000'});
      const json = await api(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_LIST + '?' + params.toString(), {headers:{...BO_AUTH.authHeader()}});
      const rows = normalizePageRows(json.data || json);
      rows.forEach(r => {
        const key = String(first(r, ['memberId','id','userId'], '') || '');
        if(key) map.set(key, r);
      });
    }catch(err){
      console.warn('Member wallet summary load skipped:', err.message || err);
    }
    return map;
  }

  function mergeMemberRuntimeData(members, walletMap){
    return members.map(m => {
      const key = memberKey(m);
      const w = walletMap.get(key);
      if(!w) return m;
      return Object.assign({}, m, {
        mainWalletBalance: first(w, ['mainWalletBalance','mainBalance','balance'], first(m,['mainWalletBalance','mainBalance','balance'], 0)),
        deposit: first(w, ['totalDeposit','deposit'], first(m, MONEY_KEYS.deposit, 0)),
        totalDeposit: first(w, ['totalDeposit','deposit'], first(m, MONEY_KEYS.deposit, 0)),
        withdraw: first(w, ['totalWithdraw','withdraw'], first(m, MONEY_KEYS.withdraw, 0)),
        totalWithdraw: first(w, ['totalWithdraw','withdraw'], first(m, MONEY_KEYS.withdraw, 0)),
        winLoss: first(w, ['winLoss','totalWinLoss','profitLoss'], first(m, MONEY_KEYS.winLoss, 0)),
        totalWinLoss: first(w, ['winLoss','totalWinLoss','profitLoss'], first(m, MONEY_KEYS.winLoss, 0)),
        bonus: first(w, ['totalBonus','bonus'], first(m, MONEY_KEYS.bonus, 0)),
        totalBonus: first(w, ['totalBonus','bonus'], first(m, MONEY_KEYS.bonus, 0)),
        manual: first(w, ['manualAdjust','manual','totalManual'], first(m, MONEY_KEYS.manual, 0)),
        manualAdjust: first(w, ['manualAdjust','manual','totalManual'], first(m, MONEY_KEYS.manual, 0)),
        commission: first(w, ['totalCommission','commission'], first(m, MONEY_KEYS.commission, 0)),
        totalCommission: first(w, ['totalCommission','commission'], first(m, MONEY_KEYS.commission, 0)),
        providerWalletBalance: first(w, ['providerWalletBalance'], first(m,['providerWalletBalance'],0)),
        totalBet: first(w, ['totalBet'], first(m,['totalBet'],0)),
        totalWin: first(w, ['totalWin'], first(m,['totalWin'],0)),
        totalLose: first(w, ['totalLose'], first(m,['totalLose'],0))
      });
    });
  }

  async function loadMembers(){
    const table=document.querySelector('.user-main-table tbody'); if(!table) return;
    table.innerHTML='<tr><td colspan="17">Loading members...</td></tr>';
    try{
      const res = await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}});
      const members = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.content) ? res.data.content : []);
      const walletMap = await loadWalletSummaryMap();
      allMembers = mergeMemberRuntimeData(members, walletMap);
      updateStats(allMembers);
      applySearch();
    } catch(e){
      allMembers=[]; updateStats([]);
      table.innerHTML='<tr><td colspan="17" class="text-danger">'+esc(e.message||'Load member failed')+'</td></tr>';
    }
  }

  function bindSearch(){
    ['memberSearchName','memberSearchMobile','memberSearchAgent','memberSearchBank'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', applySearch); });
    ['memberSearchStatus','memberSearchVisit','memberSearchLock'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', applySearch); });
    document.getElementById('memberSearchBtn')?.addEventListener('click', applySearch);
    document.getElementById('memberResetBtn')?.addEventListener('click', function(){
      ['memberSearchName','memberSearchMobile','memberSearchAgent','memberSearchBank','memberSearchStatus','memberSearchVisit','memberSearchLock'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
      applySearch();
    });
  }

  document.addEventListener('click',async e=>{
    const wb=e.target.closest('[data-member-wallet]');
    if(wb){
      const member = allMembers.find(m => String(first(m,['id','memberId','userId'], '')) === String(wb.dataset.memberWallet));
      if(member) openWalletModal(member);
      return;
    }
    const b=e.target.closest('[data-member-lock]'); if(!b)return;
    if(!b.dataset.memberLock) return alert('Missing member ID');
    try{ await api(BO_AUTH.memberUpdateUrl(b.dataset.memberLock),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})}); loadMembers(); }
    catch(err){ alert(err.message || 'Update failed'); }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    bindSearch(); loadMembers();
    document.getElementById('walletModalClose')?.addEventListener('click', closeWalletModal);
    document.getElementById('memberWalletModal')?.addEventListener('click', e=>{ if(e.target.id==='memberWalletModal') closeWalletModal(); });
    document.getElementById('walletRefreshBtn')?.addEventListener('click', ()=>{ if(selectedWalletMember) loadMemberWallet(first(selectedWalletMember,['id','memberId','userId'], '')).catch(err=>walletStatus(err.message || 'Load wallet failed', 'error')); });
    document.getElementById('walletSubmitBtn')?.addEventListener('click', submitWalletAdjust);
    document.getElementById('walletAdjustType')?.addEventListener('change', updateWalletPreview);
    document.querySelectorAll('[data-wallet-tab]').forEach(btn=>btn.addEventListener('click', ()=>setWalletTab(btn.dataset.walletTab)));
    document.getElementById('walletProviderRefreshBtn')?.addEventListener('click', ()=>loadWalletProviderAccounts().catch(err=>renderProviderError(err.message)));
    document.getElementById('walletAdjustAmount')?.addEventListener('input', updateWalletPreview);
    document.getElementById('saveBankProfileBtn')?.addEventListener('click', saveBankProfile);
  });
})();
