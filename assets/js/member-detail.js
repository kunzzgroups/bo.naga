(function(){
  let selectedWalletMember = null;
  let selectedWalletBalance = 0;
  let walletBankOptions = [];
  const MEMBER_WALLET_API = {
    balance: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_BALANCE,
    adjust: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_ADJUST,
    bankOptions: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_BANK_OPTIONS,
    providerAccounts: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.MEMBER_WALLET_PROVIDER_ACCOUNTS,
    ledgerList: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.WALLET_LEDGER_LIST,
    betList: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PROVIDER_BET_REPORT_LIST
  };

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function api(url,opt){const r=await fetch(url,opt||{});const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
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
  function memberStatus(m){
    if(Number(first(m,['locked','isLocked'],0)) === 1 || first(m,['lockStatus'], '').toString().toLowerCase()==='locked') return 'LOCKED';
    const raw = first(m,['status','accountStatus'],1);
    if(Number(raw) === 0 || String(raw).toLowerCase()==='inactive') return 'INACTIVE';
    return 'ACTIVE';
  }
  function signedAmount(type, amount){
    const n = num(amount);
    if(type === 'WITHDRAW') return -Math.abs(n);
    if(type === 'ADJUSTMENT') return n;
    return Math.abs(n);
  }
  function walletStatus(msg, type){ const el=document.getElementById('walletModalStatus'); if(el){ el.textContent=msg||''; el.className='upload-status' + (type ? ' ' + type : ''); } }
  function walletResult(data){
    const el=document.getElementById('walletModalResult');
    if(el) el.textContent = data ? JSON.stringify(data, null, 2) : '';
    const details=document.getElementById('walletTechDetails');
    if(details) details.hidden = !data;
  }
  function memberIdOfSelected(){ return selectedWalletMember ? first(selectedWalletMember,['id','memberId','userId'], '') : ''; }
  function securityStatus(id,msg,type){ const el=document.getElementById(id); if(el){ el.textContent=msg||''; el.className='upload-status' + (type ? ' ' + type : ''); } }
  function bankStatus(msg,type){ const el=document.getElementById('bankProfileStatus'); if(el){ el.textContent=msg||''; el.className='upload-status' + (type ? ' ' + type : ''); } }

  function setWalletTab(name){
    document.querySelectorAll('[data-wallet-tab]').forEach(btn=>btn.classList.toggle('active', btn.dataset.walletTab === name));
    document.querySelectorAll('[data-wallet-pane]').forEach(pane=>pane.classList.toggle('active', pane.dataset.walletPane === name));
    if(name === 'provider') loadWalletProviderAccounts().catch(err=>renderProviderError(err.message));
    if(name === 'ledger') loadWalletLedgerPreview().catch(err=>renderLedgerError(err.message));
    if(name === 'bet') loadWalletBetPreview().catch(err=>renderBetError(err.message));
    if(name === 'insight') loadGameInsight().catch(err=>renderInsightError(err.message));
    try{
      const url = new URL(location.href);
      url.searchParams.set('tab', name);
      history.replaceState(null, '', url.toString());
    }catch(e){}
  }

  function infoGrid(items){
    return '<div class="wallet-balance-box">' + items.map(([k,v])=>`<div class="mini-box"><span>${esc(k)}</span><b style="font-size:15px">${esc(v || '-')}</b></div>`).join('') + '</div>';
  }
  function renderMemberInfo(member){
    const profile = document.getElementById('walletProfileInfo');
    const bank = document.getElementById('walletBankInfo');
    if(profile) profile.innerHTML = infoGrid([
      ['Username', first(member,['username'], '-')], ['Full Name', first(member,['fullName','name','displayName'], '-')],
      ['Mobile', first(member,['mobile','phone','mobileNo'], '-')], ['Status', memberStatus(member)],
      ['Referrer', first(member,['referrerName','referrerFullName','referrerUsername','agentName','referrer'], '-')], ['Top Referrer', first(member,['topReferrer','topAgent','upline'], '-')],
      ['Register Date', dt(first(member,['createdAt','registerDate','created_at'], ''))], ['Last Login', dt(first(member,['lastLoginAt','lastLogin','last_login_at'], ''))],
      ['Last Deposit', dt(first(member,['lastDepositAt','lastDeposit','last_deposit_at'], ''))], ['Admin Remark', first(member,['adminRemark'], '-') ]
    ]);
    fillAdminRemark(member);
    if(bank) bank.innerHTML = infoGrid([
      ['Bank', first(member,['bank','bankName'], '-')], ['Bank Account', first(member,['bankAccount','bankAccountNumber','bankAccountNo','accountNo'], '-')],
      ['Account Name', first(member,['bankAccountName','accountName','fullName','name'], '-')], ['Bank BSB', first(member,['bankBsb'], '-')],
      ['Pay ID', first(member,['payId'], '-')], ['Show BSB', Number(first(member,['showBankBsb'],1))===1?'Yes':'No'], ['Show Pay ID', Number(first(member,['showPayId'],1))===1?'Yes':'No']
    ]);
  }
  function fillAdminRemark(member){
    const input=document.getElementById('memberAdminRemark'); if(input) input.value=String(first(member,['adminRemark'],'')||'');
    const meta=document.getElementById('memberAdminRemarkMeta'); if(meta){const by=String(first(member,['adminRemarkUpdatedBy'],'')||'');const at=String(first(member,['adminRemarkUpdatedAt'],'')||'');meta.textContent=(by||at)?('Last updated'+(by?' by '+by:'')+(at?' · '+dt(at):'')):'No remark yet.';}
    securityStatus('memberAdminRemarkStatus','','');
  }
  async function saveMemberAdminRemark(){
    const memberId=memberIdOfSelected(); if(!memberId)return;
    const remark=String(document.getElementById('memberAdminRemark')?.value||'').trim();
    if(remark.length>500){securityStatus('memberAdminRemarkStatus','Remark maximum 500 characters.','error');return;}
    try{
      securityStatus('memberAdminRemarkStatus','Saving...','');
      const json=await api(API_CONFIG.BASE_URL+'/admin/member/remark/'+encodeURIComponent(memberId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({remark})});
      const d=json.data||{};
      if(selectedWalletMember){
        selectedWalletMember.adminRemark=d.adminRemark||'';
        selectedWalletMember.adminRemarkUpdatedBy=d.adminRemarkUpdatedBy||'';
        selectedWalletMember.adminRemarkUpdatedAt=d.adminRemarkUpdatedAt||'';
      }
      fillAdminRemark(selectedWalletMember||d);
      securityStatus('memberAdminRemarkStatus',json.message||'Remark saved.','success');
    }catch(err){ securityStatus('memberAdminRemarkStatus',err.message||'Save remark failed.','error'); }
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

  function renderInsightRows(targetId, rows, frequent){
    const body=document.getElementById(targetId); if(!body) return;
    if(!Array.isArray(rows)||!rows.length){body.innerHTML='<tr><td colspan="6">No settled game records found.</td></tr>';return;}
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.providerCode||'-')}</td><td>${esc(r.gameCode||'-')}</td>${frequent?`<td>${num(r.playCount)}</td><td>${money(r.totalTurnover)}</td>`:`<td>${money(r.totalTurnover)}</td><td>${num(r.playCount)}</td>`}<td>${dt(r.lastPlayedAt)}</td></tr>`).join('');
  }
  function renderInsightError(message){['walletTopTurnoverBody','walletFrequentGamesBody'].forEach(id=>{const b=document.getElementById(id);if(b)b.innerHTML='<tr><td colspan="6">'+esc(message||'Unable to load game insight')+'</td></tr>';});}
  async function loadGameInsight(){
    const memberId=memberIdOfSelected(); if(!memberId)return;
    const json=await api(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.MEMBER_GAME_INSIGHT+'/'+encodeURIComponent(memberId)+'?limit=10',{headers:BO_AUTH.authHeader()});
    const data=json.data||{}; renderInsightRows('walletTopTurnoverBody',data.highestTurnover||[],false); renderInsightRows('walletFrequentGamesBody',data.frequentGames||[],true);
  }
  async function resetMemberPassword(){
    const memberId=memberIdOfSelected(); if(!memberId) return;
    const password=document.getElementById('memberNewPassword')?.value || '';
    const confirmPassword=document.getElementById('memberConfirmPassword')?.value || '';
    if(password.length<8 || password.length>20){ securityStatus('memberPasswordStatus','Password must be 8 - 20 characters.','error'); return; }
    if(password!==confirmPassword){ securityStatus('memberPasswordStatus','Confirm password does not match.','error'); return; }
    try{
      securityStatus('memberPasswordStatus','Resetting password...','');
      const json=await api(API_CONFIG.BASE_URL+'/admin/member/reset-password/'+encodeURIComponent(memberId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({password,confirmPassword})});
      securityStatus('memberPasswordStatus',json.message||'Login password reset successfully.','success');
      document.getElementById('memberNewPassword').value=''; document.getElementById('memberConfirmPassword').value='';
    }catch(err){ securityStatus('memberPasswordStatus',err.message||'Password reset failed.','error'); }
  }
  async function resetMemberTransactionPassword(){
    const memberId=memberIdOfSelected(); if(!memberId) return;
    const password=document.getElementById('memberNewTransactionPassword')?.value || '';
    const confirmPassword=document.getElementById('memberConfirmTransactionPassword')?.value || '';
    if(password.length<6 || password.length>20){ securityStatus('memberTransactionPasswordStatus','Transaction password must be 6 - 20 characters.','error'); return; }
    if(password!==confirmPassword){ securityStatus('memberTransactionPasswordStatus','Confirm password does not match.','error'); return; }
    try{
      securityStatus('memberTransactionPasswordStatus','Resetting transaction password...','');
      const json=await api(API_CONFIG.BASE_URL+'/admin/member/reset-transaction-password/'+encodeURIComponent(memberId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({password,confirmPassword})});
      securityStatus('memberTransactionPasswordStatus',json.message||'Transaction password reset successfully.','success');
      document.getElementById('memberNewTransactionPassword').value=''; document.getElementById('memberConfirmTransactionPassword').value='';
      if(selectedWalletMember) selectedWalletMember.hasTransactionPassword=true;
    }catch(err){ securityStatus('memberTransactionPasswordStatus',err.message||'Transaction password reset failed.','error'); }
  }
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
      Object.assign(selectedWalletMember, payload);
      renderMemberInfo(selectedWalletMember);
      fillBankEdit(selectedWalletMember);
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

  function walletBankText(b){
    const name=first(b,['bankName','displayName'],'Bank');
    const display=first(b,['displayName'],'');
    const acct=first(b,['accountNumber'],'');
    return [name, display && display!==name ? display : '', acct].filter(Boolean).join(' · ');
  }
  function renderWalletBankOptions(){
    const type=document.getElementById('walletAdjustType')?.value||'DEPOSIT';
    const amount=Math.abs(Number(document.getElementById('walletAdjustAmount')?.value||0));
    const field=document.getElementById('walletBankField'), select=document.getElementById('walletPaymentMethodId');
    const label=document.getElementById('walletBankLabel'), hint=document.getElementById('walletBankHint');
    if(!field||!select)return;
    if(type==='ADJUSTMENT'){ field.hidden=true; select.value=''; return; }
    field.hidden=false;
    if(label)label.textContent=type==='DEPOSIT'?'Casino Receiving Bank':'Casino Funding Bank';
    const current=select.value;
    select.innerHTML='<option value="">-- Select casino bank / payment method --</option>'+walletBankOptions.map(b=>{
      const usage=num(b.usage);
      const insufficient=type==='WITHDRAW' && (usage<=0 || (amount>0 && usage<amount));
      const status=type==='WITHDRAW'?' · Usage MYR '+money(usage)+(insufficient?' · INSUFFICIENT':''):'';
      return '<option value="'+esc(b.id)+'" '+(insufficient?'disabled':'')+'>'+esc(walletBankText(b)+status)+'</option>';
    }).join('');
    if([...select.options].some(o=>o.value===current&&!o.disabled)) select.value=current;
    if(hint) hint.textContent=type==='DEPOSIT'
      ? 'This manual topup adds to the selected bank usage.'
      : 'This manual withdrawal deducts from the selected bank usage. Banks with 0.00 or insufficient usage are disabled.';
  }
  async function loadWalletBankOptions(){
    const json=await api(MEMBER_WALLET_API.bankOptions,{headers:{...BO_AUTH.authHeader()}});
    walletBankOptions=Array.isArray(json.data)?json.data:[];
    renderWalletBankOptions();
  }
  function updateWalletPreview(){
    const type = document.getElementById('walletAdjustType')?.value || 'DEPOSIT';
    const amount = document.getElementById('walletAdjustAmount')?.value || 0;
    const delta = signedAmount(type, amount);
    const next = selectedWalletBalance + delta;
    const el=document.getElementById('walletNewBalance'); if(el) el.textContent = '$' + money(next);
    const chip=document.getElementById('walletBalanceDelta');
    if(chip){
      const hasAmount = String(document.getElementById('walletAdjustAmount')?.value || '').trim() !== '' && Number.isFinite(Number(amount)) && Number(amount) !== 0;
      chip.classList.remove('is-zero','is-up','is-down');
      if(!hasAmount || delta === 0){
        chip.classList.add('is-zero');
        chip.textContent = 'No change';
      }else if(delta > 0){
        chip.classList.add('is-up');
        chip.textContent = '+' + money(delta);
      }else{
        chip.classList.add('is-down');
        chip.textContent = money(delta);
      }
    }
  }
  async function loadMemberWallet(memberId){
    const json = await api(MEMBER_WALLET_API.balance + '?memberId=' + encodeURIComponent(memberId), {headers:{...BO_AUTH.authHeader()}});
    const balance = num(json && json.data && json.data.balance);
    selectedWalletBalance = balance;
    const bal=document.getElementById('walletCurrentBalance'); if(bal) bal.textContent = '$' + money(balance);
    updateWalletPreview();
    walletResult(json.data);
  }
  async function submitWalletAdjust(){
    if(!selectedWalletMember) return;
    const memberId = first(selectedWalletMember,['id','memberId','userId'], '');
    const type = document.getElementById('walletAdjustType').value;
    const amount = document.getElementById('walletAdjustAmount').value;
    const remark = document.getElementById('walletAdjustRemark').value;
    const paymentMethodId = document.getElementById('walletPaymentMethodId')?.value || '';
    const amountNumber = Number(amount);
    if(!amount || !Number.isFinite(amountNumber) || (type !== 'ADJUSTMENT' && amountNumber <= 0) || (type === 'ADJUSTMENT' && amountNumber === 0)){ walletStatus(type === 'ADJUSTMENT' ? 'Please enter positive or negative adjustment amount.' : 'Please enter amount greater than 0.', 'error'); return; }
    if(type !== 'ADJUSTMENT' && !paymentMethodId){ walletStatus(type==='DEPOSIT'?'Please select the casino receiving bank.':'Please select a casino funding bank with enough Bank Usage.','error'); return; }
    try{
      walletStatus('Processing main wallet...', '');
      const json = await api(MEMBER_WALLET_API.adjust, {method:'POST', headers:{'Content-Type':'application/json', ...BO_AUTH.authHeader()}, body: JSON.stringify({memberId:Number(memberId), type, amount:Number(amount), paymentMethodId:type==='ADJUSTMENT'?null:Number(paymentMethodId), externalTxId:'BO-MEMBER-' + Date.now(), remark})});
      walletStatus(json.message || 'Main wallet updated.', 'success');
      walletResult(json.data);
      document.getElementById('walletAdjustAmount').value = '';
      document.getElementById('walletAdjustRemark').value = '';
      await loadMemberWallet(memberId);
      await loadWalletBankOptions();
    }catch(err){ walletStatus(err.message || 'Wallet adjustment failed', 'error'); }
  }

  function bindMember(member, tab){
    selectedWalletMember = member;
    selectedWalletBalance = 0;
    const id = first(member,['id','memberId','userId'], '');
    const username = first(member,['username'], '-');
    const status = memberStatus(member);
    document.title = (username || 'Member') + ' · Member Detail';
    const avatar=document.getElementById('walletMemberAvatar');
    if(avatar) avatar.textContent = String(username || 'M').slice(0,1).toUpperCase();
    const nameEl=document.getElementById('walletMemberName');
    if(nameEl) nameEl.textContent = username;
    const infoEl=document.getElementById('walletMemberInfo');
    if(infoEl) infoEl.textContent = 'ID ' + id + ' · ' + first(member,['mobile','phone','mobileNo'], '-');
    const statusEl=document.getElementById('memberDetailStatus');
    if(statusEl){
      statusEl.textContent = status;
      statusEl.dataset.status = status.toLowerCase();
    }
    ['memberNewPassword','memberConfirmPassword','memberNewTransactionPassword','memberConfirmTransactionPassword'].forEach(fid=>{ const el=document.getElementById(fid); if(el) el.value=''; });
    securityStatus('memberPasswordStatus','',''); securityStatus('memberTransactionPasswordStatus','','');
    const amountEl=document.getElementById('walletAdjustAmount'); if(amountEl) amountEl.value='';
    const remarkEl=document.getElementById('walletAdjustRemark'); if(remarkEl) remarkEl.value='';
    const bankSelect=document.getElementById('walletPaymentMethodId'); if(bankSelect) bankSelect.value='';
    loadWalletBankOptions().catch(err=>walletStatus(err.message || 'Load casino banks failed','error'));
    walletStatus('', ''); walletResult(null);
    renderMemberInfo(member);
    fillBankEdit(member);
    bankStatus('', '');
    setWalletTab(tab || 'main');
    loadMemberWallet(id).catch(err=>walletStatus(err.message || 'Load wallet failed', 'error'));
  }

  function showError(message){
    const shell = document.getElementById('memberDetailShell');
    if(shell) shell.innerHTML = '<div class="member-detail-error">'+esc(message)+'<div class="mt-3"><a class="md-btn md-btn-ghost" href="index.html"><i class="bi bi-arrow-left"></i> Back to User Management</a></div></div>';
  }

  async function boot(){
    const params = new URLSearchParams(location.search);
    const memberId = String(params.get('memberId') || '').trim();
    const tab = String(params.get('tab') || 'main').trim() || 'main';
    if(!memberId){
      showError('Missing memberId. Open this page from User Management.');
      return;
    }
    try{
      const res = await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}});
      const members = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.content) ? res.data.content : []);
      const member = members.find(m => String(first(m,['id','memberId','userId'],'')) === String(memberId));
      if(!member){
        showError('Member not found (ID: ' + memberId + ').');
        return;
      }
      bindMember(member, tab);
    }catch(err){
      showError(err.message || 'Failed to load member.');
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('walletRefreshBtn')?.addEventListener('click', ()=>{ if(selectedWalletMember) loadMemberWallet(first(selectedWalletMember,['id','memberId','userId'], '')).catch(err=>walletStatus(err.message || 'Load wallet failed', 'error')); });
    document.getElementById('walletSubmitBtn')?.addEventListener('click', submitWalletAdjust);
    document.getElementById('walletAdjustType')?.addEventListener('change', ()=>{ updateWalletPreview(); renderWalletBankOptions(); });
    document.getElementById('walletAdjustAmount')?.addEventListener('input', ()=>{ updateWalletPreview(); renderWalletBankOptions(); });
    document.querySelectorAll('[data-wallet-tab]').forEach(btn=>btn.addEventListener('click', ()=>setWalletTab(btn.dataset.walletTab)));
    document.getElementById('walletProviderRefreshBtn')?.addEventListener('click', ()=>loadWalletProviderAccounts().catch(err=>renderProviderError(err.message)));
    document.getElementById('walletInsightRefreshBtn')?.addEventListener('click',()=>loadGameInsight().catch(err=>renderInsightError(err.message)));
    document.getElementById('saveBankProfileBtn')?.addEventListener('click', saveBankProfile);
    document.getElementById('saveMemberAdminRemarkBtn')?.addEventListener('click', saveMemberAdminRemark);
    document.getElementById('resetMemberPasswordBtn')?.addEventListener('click', resetMemberPassword);
    document.getElementById('resetMemberTransactionPasswordBtn')?.addEventListener('click', resetMemberTransactionPassword);
    boot();
  });
})();
