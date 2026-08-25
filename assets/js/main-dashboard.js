(function(){
'use strict';
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>Number(v||0).toLocaleString();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let brands=[],selected=null;
async function api(p){const r=await fetch(API_CONFIG.BASE_URL+p,{headers:BO_AUTH.authHeader()}),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data;}
function today(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function bindRange(){const d=today();$('mainFrom').value=d;$('mainTo').value=d;}
function q(){const to=new Date($('mainTo').value+'T00:00:00');to.setDate(to.getDate()+1);return '?from='+$('mainFrom').value+'&to='+to.toISOString().slice(0,10);}
function stat(label,value,icon,note,tone='purple'){return `<div class="exec-stat"><div class="exec-stat-icon ${tone}"><i class="bi ${icon}"></i></div><div><small>${label}</small><b>${value}</b><span>${note||''}</span></div></div>`;}
function tone(v){return Number(v||0)<0?'text-danger':'text-success';}
function renderSummary(s){
 $('mainPerformanceStats').innerHTML=[
  stat('Turnover',money(s.turnover),'bi-graph-up-arrow','Valid betting turnover','purple'),
  stat('Customer Loss',money(s.customerLoss),'bi-cash-stack','House result for selected range',Number(s.customerLoss)<0?'red':'green'),
  stat('Hold %',money(s.holdPercent)+'%','bi-percent','Customer loss ÷ turnover','blue'),
  stat('Bets',num(s.betCount),'bi-controller','Settled bet records','orange'),
  stat('Active Bettors',num(s.activeBettors),'bi-person-check','Unique betting players','green')
 ].join('');
 $('mainCashStats').innerHTML=[
  stat('Deposits',money(s.depositAmount),'bi-box-arrow-in-down','Approved/processed in range','green'),
  stat('Withdrawals',money(s.withdrawAmount),'bi-box-arrow-up','Approved/processed in range','orange'),
  stat('Net Cash Flow',money(s.netCashFlow),'bi-arrow-left-right','Deposits - withdrawals',Number(s.netCashFlow)<0?'red':'blue'),
  stat('Pending Deposits',`${num(s.pendingDepositCount)} · ${money(s.pendingDepositAmount)}`,'bi-hourglass-split','Needs operational attention','orange'),
  stat('Pending Withdrawals',`${num(s.pendingWithdrawCount)} · ${money(s.pendingWithdrawAmount)}`,'bi-hourglass-bottom','Needs operational attention','red')
 ].join('');
 $('mainWalletStats').innerHTML=[
  stat('Player Wallet',money(s.playerWallet),'bi-wallet2','Current player cash liability','blue'),
  stat('Bonus Wallet',money(s.bonusWallet),'bi-gift','Current player bonus liability','purple'),
  stat('Agent Wallet',money(s.agentWallet),'bi-person-badge','Current agent payable balance','orange'),
  stat('Total Wallet Exposure',money(s.walletExposure),'bi-safe2','Player + bonus + agent wallet','red'),
  stat('Pending Agent Settlement',`${num(s.pendingSettlements)} · ${money(s.pendingSettlementAmount)}`,'bi-receipt','Submitted, not completed','orange')
 ].join('');
 $('mainNetworkStats').innerHTML=[
  stat('Brands',num(s.brands),'bi-buildings','Brands under management','purple'),
  stat('Players',num(s.players),'bi-people','All registered players','blue'),
  stat('New Players',num(s.newPlayers),'bi-person-plus','Registered in selected range','green'),
  stat('Active Accounts',num(s.activePlayers),'bi-person-check-fill','Current active-status accounts','green'),
  stat('Agents',num(s.agents),'bi-person-workspace','All brand agents','orange')
 ].join('');
}
async function load(){
 const d=await api('/admin/main/overview'+q());brands=d.brands||[];const s=d.summary||{};renderSummary(s);
 $('mainBrandRows').innerHTML=brands.map(b=>`<tr>
 <td><b>${esc(b.name)}</b><small class="d-block text-muted">${esc(b.code)} · ${esc(b.domain)}</small></td>
 <td><b>${num(b.playerCount)}</b><small class="d-block text-muted">+${num(b.newPlayers)} new · ${num(b.activeBettors)} bettors</small></td>
 <td><b>${money(b.depositAmount)}</b><small class="d-block text-muted">W/D ${money(b.withdrawAmount)} · Net ${money(b.netCashFlow)}</small></td>
 <td><b>${money(b.turnover)}</b><small class="d-block ${tone(b.customerLoss)}">Loss ${money(b.customerLoss)} · Hold ${money(b.holdPercent)}%</small></td>
 <td><b>${money(b.playerWallet)}</b><small class="d-block text-muted">Bonus ${money(b.bonusWallet)}</small></td>
 <td><b>${money(b.agentWallet)}</b><small class="d-block text-muted">${num(b.agentCount)} agents</small></td>
 <td><b>${num((b.pendingDepositCount||0)+(b.pendingWithdrawCount||0)+(b.pendingAgentSettlements||0))}</b><small class="d-block text-muted">D ${num(b.pendingDepositCount)} · W ${num(b.pendingWithdrawCount)} · A ${num(b.pendingAgentSettlements)}</small></td>
 <td><div class="d-flex gap-1 flex-wrap"><button class="clean-btn" data-view="${b.id}"><i class="bi bi-eye"></i> Report</button><button class="clean-btn" data-agents="${b.id}">Agents</button><button class="clean-btn primary" data-manage="${b.id}">Manage</button></div></td></tr>`).join('')||'<tr><td colspan="8">No brands.</td></tr>';
}
function brandOverviewCards(f){return [
 stat('Players',num(f.playerCount),'bi-people',`${num(f.newPlayers)} new · ${num(f.activeBettors)} bettors`,'blue'),
 stat('Turnover',money(f.turnover),'bi-graph-up-arrow',`${num(f.betCount)} bets`,'purple'),
 stat('Customer Loss',money(f.customerLoss),'bi-cash-stack',`Hold ${money(f.holdPercent)}%`,Number(f.customerLoss)<0?'red':'green'),
 stat('Net Cash Flow',money(f.netCashFlow),'bi-arrow-left-right',`Deposit ${money(f.depositAmount)} · W/D ${money(f.withdrawAmount)}`,Number(f.netCashFlow)<0?'red':'blue'),
 stat('Player Wallet',money(f.playerWallet),'bi-wallet2',`Bonus ${money(f.bonusWallet)}`,'blue'),
 stat('Agent Wallet',money(f.agentWallet),'bi-person-badge',`${num(f.agentCount)} agents`,'orange'),
 stat('Wallet Exposure',money(f.walletExposure),'bi-safe2','Player + bonus + agent','red'),
 stat('Pending Operations',num((f.pendingDepositCount||0)+(f.pendingWithdrawCount||0)+(f.pendingSettlementCount||0)),'bi-exclamation-circle',`D ${num(f.pendingDepositCount)} · W ${num(f.pendingWithdrawCount)} · A ${num(f.pendingSettlementCount)}`,'orange')
].join('');}
async function detail(id){
 const d=await api('/admin/main/brand/'+id+q());selected=d.brand;const f=d.financial||{};
 $('mainBrandTitle').textContent=(selected.name||selected.code)+' Executive Report';$('mainBrandDomain').textContent=(selected.primaryDomain||'')+' · '+$('mainFrom').value+' to '+$('mainTo').value;
 $('mainBrandStats').innerHTML=brandOverviewCards(f);
 $('mainFinancialRows').innerHTML=[
  ['Approved Deposits',money(f.depositAmount),`${num(f.depositCount)} transactions`],['Approved Withdrawals',money(f.withdrawAmount),`${num(f.withdrawCount)} transactions`],['Net Cash Flow',money(f.netCashFlow),'Deposit - withdrawal'],
  ['Pending Deposits',money(f.pendingDepositAmount),`${num(f.pendingDepositCount)} requests`],['Pending Withdrawals',money(f.pendingWithdrawAmount),`${num(f.pendingWithdrawCount)} requests`],['Pending Agent Settlement',money(f.pendingSettlementAmount),`${num(f.pendingSettlementCount)} requests`],
  ['Player Wallet',money(f.playerWallet),'Current cash wallet'],['Bonus Wallet',money(f.bonusWallet),'Current bonus wallet'],['Agent Wallet',money(f.agentWallet),'Current agent payable'],['Total Wallet Exposure',money(f.walletExposure),'Combined wallet exposure'],
  ['Brand Player Credit',money(f.playerCredit),'Current allocation'],['Brand Provider Credit',money(f.providerCredit),'Current allocation'],['Credit In',money(f.creditIn),'Selected range'],['Credit Out',money(f.creditOut),'Selected range']
 ].map(x=>`<tr><td><b>${x[0]}</b></td><td>${x[1]}</td><td class="text-muted">${x[2]}</td></tr>`).join('');
 $('mainProviderRows').innerHTML=(d.providers||[]).map(x=>`<tr><td><b>${esc(x.providerCode)}</b></td><td>${num(x.playerCount)}</td><td>${money(x.turnover)}</td><td>${money(x.betAmount)}</td><td>${money(x.winAmount)}</td><td class="${tone(x.customerLoss)}"><b>${money(x.customerLoss)}</b></td><td>${money(x.holdPercent)}%</td><td>${num(x.betCount)}</td></tr>`).join('')||'<tr><td colspan="8">No provider betting data.</td></tr>';
 $('mainGameRows').innerHTML=(d.games||[]).map(x=>`<tr><td>${esc(x.providerCode)}</td><td><b>${esc(x.gameName)}</b><small class="d-block text-muted">${esc(x.gameCode)}</small></td><td>${money(x.turnover)}</td><td>${money(x.betAmount)}</td><td>${money(x.winAmount)}</td><td class="${tone(x.customerLoss)}">${money(x.customerLoss)}</td><td>${num(x.betCount)}</td></tr>`).join('')||'<tr><td colspan="7">No betting data.</td></tr>';
 $('mainAgentRows').innerHTML=(d.agents||[]).map(x=>`<tr><td><b>${esc(x.name)}</b><small class="d-block text-muted">${esc(x.code)}</small></td><td>${num(x.memberCount)}</td><td>${money(x.commissionPercent)}%</td><td>${money(x.walletBalance)}</td><td>${Number(x.redShareEnabled)===1?'Yes':'No'}</td><td>${Number(x.status)===1?'Active':'Disabled'}</td></tr>`).join('')||'<tr><td colspan="6">No agents.</td></tr>';
 $('mainCreditRows').innerHTML=(d.creditLedger||[]).map(x=>`<tr><td>${esc(String(x.createdAt||'').replace('T',' ').slice(0,19))}</td><td>${esc(x.ledgerType)}</td><td>${money(x.amount)}</td><td>${money(x.beforeBalance)}</td><td>${money(x.afterBalance)}</td><td>${esc(x.createdBy)}</td><td>${esc(x.remark)}</td></tr>`).join('')||'<tr><td colspan="7">No credit movement.</td></tr>';
 $('mainSettlementRows').innerHTML=(d.settlements||[]).map(x=>`<tr><td>${esc(x.settlementMonth)}</td><td>#${x.agentId}</td><td>${money(x.agentProfit)}</td><td>${money(x.requestedAmount)}</td><td>${esc(x.settlementStatus)}</td><td>${esc(String(x.paidAt||'').replace('T',' ').slice(0,19))}</td></tr>`).join('')||'<tr><td colspan="6">No settlements.</td></tr>';
 bootstrap.Modal.getOrCreateInstance($('mainBrandModal')).show();
}
function go(id,page){if(window.BO_BRAND){localStorage.setItem(BO_BRAND.key,String(id));BO_BRAND.invalidate?.();}location.href=page;}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]'),a=e.target.closest('[data-agents]'),m=e.target.closest('[data-manage]');if(v)detail(v.dataset.view);if(a)go(a.dataset.agents,'agent-management.html');if(m)go(m.dataset.manage,'brand-management.html');});
$('mainSearch').onclick=load;$('mainManageBrand').onclick=()=>selected&&go(selected.id,'brand-management.html');$('mainOpenAgents').onclick=()=>selected&&go(selected.id,'agent-management.html');
BO_AUTH.requireLogin();bindRange();load().catch(e=>$('mainBrandRows').innerHTML='<tr><td colspan="8" class="text-danger">'+esc(e.message)+'</td></tr>');
})();
