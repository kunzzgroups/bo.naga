(function(){
  const REPORT_TITLES = {
    overview: 'Overview Report',
    breakdown: 'Breakdown Report',
    depositWithdraw: 'Deposit / Withdraw Report',
    provider: 'Provider Win/Loss Report',
    bonus: 'Bonus Report'
  };
  function pageType(){
    return document.body.getAttribute('data-report-page') || document.querySelector('[data-report-page]')?.getAttribute('data-report-page') || 'overview';
  }
  function url(){ return API_CONFIG.BASE_URL + (API_CONFIG.ENDPOINTS.CASINO_REPORT_SUMMARY || '/admin/casino-report/summary'); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function whole(v){ return Math.round(num(v)).toLocaleString(); }
  function statusAmount(group, status){ return group && group[status] ? num(group[status].amount) : 0; }
  function statusCount(group, status){ return group && group[status] ? num(group[status].count) : 0; }
  async function api(endpoint){
    const res = await fetch(endpoint, {headers:{...BO_AUTH.authHeader()}});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  function params(){
    const p = new URLSearchParams();
    const period = document.getElementById('casinoPeriod')?.value || 'daily';
    const from = document.getElementById('casinoFrom')?.value || '';
    const to = document.getElementById('casinoTo')?.value || '';
    p.set('period', period);
    if(period === 'custom'){
      if(from) p.set('from', from);
      if(to) p.set('to', to);
    }
    return p.toString();
  }
  function setMetric(id, value, isMoney){ const el=document.getElementById(id); if(el) el.textContent = isMoney ? money(value) : whole(value); }
  function approvedAmount(group){ return statusAmount(group,'APPROVED') + statusAmount(group,'COMPLETED') + statusAmount(group,'SUCCESS'); }
  function pendingAmount(group){ return statusAmount(group,'PENDING'); }
  function failedAmount(group){ return statusAmount(group,'REJECTED') + statusAmount(group,'FAILED'); }
  function approvedCount(group){ return statusCount(group,'APPROVED') + statusCount(group,'COMPLETED') + statusCount(group,'SUCCESS'); }
  function pendingCount(group){ return statusCount(group,'PENDING'); }
  function failedCount(group){ return statusCount(group,'REJECTED') + statusCount(group,'FAILED'); }
  function hasAnyData(row, fields){
    return fields.some(function(k){ return num(row && row[k]) !== 0; });
  }

  function renderCommon(data){
    const title = REPORT_TITLES[pageType()] || 'Casino Report';
    const h = document.querySelector('[data-report-title]');
    if(h) h.textContent = title;
    const range = document.getElementById('casinoRangeText');
    if(range) range.textContent = `Showing ${data.period || '-'} report from ${data.from || '-'} to ${data.to || '-'}`;
  }
  function renderOverview(data){
    const dw = data.depositWithdraw || {};
    const deposit = dw.deposit || {};
    const withdraw = dw.withdraw || {};
    const betting = data.betting || {};
    const overview = data.overview || {};
    const bonusRows = Array.isArray(data.bonus) ? data.bonus : [];
    const bonusTotal = bonusRows.reduce((s,r)=>s+num(r.bonusAmount),0);
    setMetric('crDeposit', approvedAmount(deposit), true);
    setMetric('crWithdraw', approvedAmount(withdraw), true);
    setMetric('crBetAmount', betting.betAmount, true);
    setMetric('crValidBet', betting.validBetAmount, true);
    setMetric('crMemberWin', betting.memberWin, true);
    setMetric('crMemberLose', betting.memberLose, true);
    setMetric('crCompanyWinLoss', betting.companyWinLoss, true);
    setMetric('crNewMembers', overview.newMembers, false);
    setMetric('crActiveBetMembers', overview.activeBetMembers, false);
    setMetric('crBonus', bonusTotal, true);
    setMetric('crBetCount', betting.betCount, false);
    setMetric('crPendingDeposit', pendingAmount(deposit), true);
    setMetric('crPendingWithdraw', pendingAmount(withdraw), true);
    setMetric('crFailedDeposit', failedAmount(deposit), true);
    setMetric('crFailedWithdraw', failedAmount(withdraw), true);
    const missing = Array.isArray(data.missingReports) ? data.missingReports : [];
    const el = document.getElementById('crReportsCovered');
    if(el){
      const reports = missing.length ? missing : ['Casino Overview Report','Daily / Weekly / Monthly Report','Deposit Status Report','Withdraw Status Report','Provider Win/Loss Report','Bonus Cost Report','Member Activity Report'];
      el.innerHTML = reports.map(x=>`<span class="badge bg-light text-dark border me-2 mb-2">${esc(x)}</span>`).join('');
    }
  }
  function renderBreakdown(rows){
    const body=document.getElementById('crBreakdownBody'); if(!body) return;
    rows = (rows || []).filter(function(r){ return hasAnyData(r, ['newMembers','depositMembers','depositCount','depositAmount','withdrawMembers','withdrawCount','withdrawAmount','activeBetMembers','validBetAmount','memberWinLoss','companyWinLoss']); });
    if(!rows.length){ body.innerHTML='<tr><td colspan="12">No data.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>`<tr>
      <td><b>${esc(r.date || r.label)}</b></td>
      <td>${whole(r.newMembers)}</td>
      <td>${whole(r.depositMembers)}</td>
      <td>${whole(r.depositCount)}</td>
      <td>${money(r.depositAmount)}</td>
      <td>${whole(r.withdrawMembers)}</td>
      <td>${whole(r.withdrawCount)}</td>
      <td>${money(r.withdrawAmount)}</td>
      <td>${whole(r.activeBetMembers)}</td>
      <td>${money(r.validBetAmount)}</td>
      <td class="${num(r.memberWinLoss)<0?'text-danger':'text-success'}">${money(r.memberWinLoss)}</td>
      <td class="${num(r.companyWinLoss)<0?'text-danger':'text-success'}"><b>${money(r.companyWinLoss)}</b></td>
    </tr>`).join('');
  }
  function renderProvider(rows){
    const body=document.getElementById('crProviderBody'); if(!body) return;
    rows = (rows || []).filter(function(r){ return hasAnyData(r, ['activeMembers','betCount','betAmount','validBetAmount','payout','memberWinLoss','companyWinLoss']); });
    if(!rows.length){ body.innerHTML='<tr><td colspan="9">No provider bet records.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>`<tr><td><b>${esc(r.date || '-')}</b></td><td><b>${esc(r.providerCode)}</b></td><td>${whole(r.activeMembers)}</td><td>${whole(r.betCount)}</td><td>${money(r.betAmount)}</td><td>${money(r.validBetAmount)}</td><td>${money(r.payout)}</td><td class="${num(r.memberWinLoss)<0?'text-danger':'text-success'}">${money(r.memberWinLoss)}</td><td class="${num(r.companyWinLoss)<0?'text-danger':'text-success'}"><b>${money(r.companyWinLoss)}</b></td></tr>`).join('');
  }
  function renderStatus(rows){
    const depositBody=document.getElementById('crDepositStatusBody');
    const withdrawBody=document.getElementById('crWithdrawStatusBody');
    const legacyBody=document.getElementById('crStatusBody');
    rows = rows || [];

    if(depositBody){
      const depositRows = rows.filter(function(r){ return hasAnyData(r, ['depositApprovedMembers','depositApprovedCount','depositApprovedAmount','depositPendingCount','depositPendingAmount','depositFailedCount','depositFailedAmount']); });
      if(!depositRows.length){
        depositBody.innerHTML='<tr><td colspan="8">No deposit request data.</td></tr>';
      } else {
        depositBody.innerHTML = depositRows.map(r=>`<tr>
          <td><b>${esc(r.date)}</b></td>
          <td>${whole(r.depositApprovedMembers)}</td>
          <td>${whole(r.depositApprovedCount)}</td>
          <td>${money(r.depositApprovedAmount)}</td>
          <td>${whole(r.depositPendingCount)}</td>
          <td>${money(r.depositPendingAmount)}</td>
          <td>${whole(r.depositFailedCount)}</td>
          <td>${money(r.depositFailedAmount)}</td>
        </tr>`).join('');
      }
    }

    if(withdrawBody){
      const withdrawRows = rows.filter(function(r){ return hasAnyData(r, ['withdrawApprovedMembers','withdrawApprovedCount','withdrawApprovedAmount','withdrawPendingCount','withdrawPendingAmount','withdrawFailedCount','withdrawFailedAmount']); });
      if(!withdrawRows.length){
        withdrawBody.innerHTML='<tr><td colspan="8">No withdraw request data.</td></tr>';
      } else {
        withdrawBody.innerHTML = withdrawRows.map(r=>`<tr>
          <td><b>${esc(r.date)}</b></td>
          <td>${whole(r.withdrawApprovedMembers)}</td>
          <td>${whole(r.withdrawApprovedCount)}</td>
          <td>${money(r.withdrawApprovedAmount)}</td>
          <td>${whole(r.withdrawPendingCount)}</td>
          <td>${money(r.withdrawPendingAmount)}</td>
          <td>${whole(r.withdrawFailedCount)}</td>
          <td>${money(r.withdrawFailedAmount)}</td>
        </tr>`).join('');
      }
    }

    if(legacyBody){
      const combinedRows = rows.filter(function(r){ return hasAnyData(r, ['depositApprovedMembers','depositApprovedCount','depositApprovedAmount','depositPendingCount','depositPendingAmount','depositFailedCount','depositFailedAmount','withdrawApprovedMembers','withdrawApprovedCount','withdrawApprovedAmount','withdrawPendingCount','withdrawPendingAmount','withdrawFailedCount','withdrawFailedAmount','netCashflow']); });
      if(!combinedRows.length){ legacyBody.innerHTML='<tr><td colspan="16">No deposit / withdraw request data.</td></tr>'; return; }
      legacyBody.innerHTML = combinedRows.map(r=>`<tr>
        <td><b>${esc(r.date)}</b></td>
        <td>${whole(r.depositApprovedMembers)}</td>
        <td>${whole(r.depositApprovedCount)}</td>
        <td>${money(r.depositApprovedAmount)}</td>
        <td>${whole(r.depositPendingCount)}</td>
        <td>${money(r.depositPendingAmount)}</td>
        <td>${whole(r.depositFailedCount)}</td>
        <td>${money(r.depositFailedAmount)}</td>
        <td>${whole(r.withdrawApprovedMembers)}</td>
        <td>${whole(r.withdrawApprovedCount)}</td>
        <td>${money(r.withdrawApprovedAmount)}</td>
        <td>${whole(r.withdrawPendingCount)}</td>
        <td>${money(r.withdrawPendingAmount)}</td>
        <td>${whole(r.withdrawFailedCount)}</td>
        <td>${money(r.withdrawFailedAmount)}</td>
        <td class="${num(r.netCashflow)<0?'text-danger':'text-success'}"><b>${money(r.netCashflow)}</b></td>
      </tr>`).join('');
    }
  }
  function renderBonus(rows){
    const body=document.getElementById('crBonusBody'); if(!body) return;
    rows = (rows || []).filter(function(r){ return hasAnyData(r, ['memberCount','claimCount','bonusAmount']); });
    if(!rows.length){ body.innerHTML='<tr><td colspan="5">No bonus ledger data.</td></tr>'; return; }
    body.innerHTML = rows.map(r=>`<tr><td><b>${esc(r.date || '-')}</b></td><td><b>${esc(r.referenceNo || r.promotionName || '-')}</b></td><td>${whole(r.memberCount)}</td><td>${whole(r.claimCount)}</td><td>${money(r.bonusAmount)}</td></tr>`).join('');
  }
  function render(data){
    renderCommon(data);
    const dw = data.depositWithdraw || {};
    renderOverview(data);
    renderBreakdown(data.breakdown || []);
    renderProvider(data.providerDaily || data.provider || []);
    renderStatus(data.depositWithdrawDaily || []);
    renderBonus(Array.isArray(data.bonusDaily) ? data.bonusDaily : (Array.isArray(data.bonus) ? data.bonus : []));
  }
  async function load(){
    ['crBreakdownBody','crProviderBody','crStatusBody','crDepositStatusBody','crWithdrawStatusBody','crBonusBody'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML='<tr><td colspan="12">Loading...</td></tr>'; });
    try{ const json = await api(url() + '?' + params()); render(json.data || {}); }
    catch(e){
      const target = document.querySelector('tbody[id^="cr"]');
      if(target) target.innerHTML='<tr><td colspan="12" class="text-danger">'+esc(e.message)+'</td></tr>';
    }
  }

  function initDepositWithdrawTabs(){
    document.querySelectorAll('[data-dw-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const tab = btn.getAttribute('data-dw-tab');
        document.querySelectorAll('[data-dw-tab]').forEach(function(b){ b.classList.toggle('active', b === btn); });
        const dep = document.getElementById('dwDepositPanel');
        const wd = document.getElementById('dwWithdrawPanel');
        if(dep) dep.classList.toggle('active', tab === 'deposit');
        if(wd) wd.classList.toggle('active', tab === 'withdraw');
      });
    });
  }

  function toggleCustom(){
    const custom = (document.getElementById('casinoPeriod')?.value || 'daily') === 'custom';
    const from = document.getElementById('casinoFrom');
    const to = document.getElementById('casinoTo');
    if(from) from.disabled = !custom;
    if(to) to.disabled = !custom;
  }
  document.addEventListener('DOMContentLoaded', function(){
    initDepositWithdrawTabs();
    toggleCustom();
    document.getElementById('casinoPeriod')?.addEventListener('change', function(){ toggleCustom(); load(); });
    document.getElementById('casinoSearchBtn')?.addEventListener('click', load);
    document.getElementById('casinoResetBtn')?.addEventListener('click', function(){ document.getElementById('casinoPeriod').value='daily'; document.getElementById('casinoFrom').value=''; document.getElementById('casinoTo').value=''; toggleCustom(); load(); });
    load();
  });
})();
