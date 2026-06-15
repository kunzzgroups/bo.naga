(function(){
  let allMembers = [];
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
    if(!rows.length){ table.innerHTML='<tr><td colspan="16">No member found.</td></tr>'; return; }
    table.innerHTML=rows.map(m=>{
      const status = memberStatus(m);
      const locked = status === 'LOCKED';
      const id = first(m,['id','memberId','userId'], '');
      return `<tr>
        <td>${esc(first(m,['createdAt','registerDate','created_at'], '-'))}</td>
        <td><b>${esc(first(m,['username'], '-'))}</b><br><small>${esc(first(m,['fullName','name','displayName'], ''))}</small></td>
        <td>${esc(first(m,['mobile','phone','mobileNo'], '-'))}</td>
        <td>${esc(first(m,['bankAccount','bankAccountNo','accountNo'], '-'))}</td>
        <td>${esc(first(m,['bank','bankName'], '-'))}</td>
        <td>${esc(first(m,['referrerCode','referrer','agent'], '-'))}</td>
        <td>${esc(first(m,['topReferrer','topAgent','upline'], '-'))}</td>
        <td>${money(first(m,MONEY_KEYS.deposit,0))}</td>
        <td>${money(first(m,MONEY_KEYS.withdraw,0))}</td>
        <td>${money(first(m,MONEY_KEYS.winLoss,0))}</td>
        <td>${money(first(m,MONEY_KEYS.bonus,0))}</td>
        <td>${money(first(m,MONEY_KEYS.manual,0))}</td>
        <td>${money(first(m,MONEY_KEYS.commission,0))}</td>
        <td>${esc(first(m,['lastDepositAt','lastDeposit','last_deposit_at'], '-'))}</td>
        <td>${esc(first(m,['lastLoginAt','lastLogin','last_login_at'], '-'))}<br><small class="status-pill ${locked?'off':''}">${esc(status)}</small></td>
        <td><button class="clean-btn" data-member-lock="${esc(id)}" data-lock="${locked?0:1}">${locked?'Unlock':'Lock'}</button></td>
      </tr>`;
    }).join('');
  }

  function applySearch(){ renderMembers(allMembers.filter(memberMatches)); }

  async function loadMembers(){
    const table=document.querySelector('.user-main-table tbody'); if(!table) return;
    table.innerHTML='<tr><td colspan="16">Loading members...</td></tr>';
    try{
      const res = await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}});
      allMembers = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.content) ? res.data.content : []);
      updateStats(allMembers);
      applySearch();
    } catch(e){
      allMembers=[]; updateStats([]);
      table.innerHTML='<tr><td colspan="16" class="text-danger">'+esc(e.message||'Load member failed')+'</td></tr>';
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
    const b=e.target.closest('[data-member-lock]'); if(!b)return;
    if(!b.dataset.memberLock) return alert('Missing member ID');
    try{ await api(BO_AUTH.memberUpdateUrl(b.dataset.memberLock),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})}); loadMembers(); }
    catch(err){ alert(err.message || 'Update failed'); }
  });
  document.addEventListener('DOMContentLoaded',()=>{bindSearch(); loadMembers();});
})();
