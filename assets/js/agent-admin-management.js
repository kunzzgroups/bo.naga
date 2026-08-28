(function(){'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])), money=v=>Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2}), whole=v=>Number(v||0).toLocaleString('en-US');
const API=window.API_CONFIG?.BASE_URL||'';
function apiUrl(path){
  const base=String(API||'').replace(/\/+$/,'');
  let p=String(path||'');
  // API_CONFIG.BASE_URL already ends with /api in BO. Older Agent Management
  // calls were also prefixed with /api, producing /api/api/... and a 404.
  if(/\/api$/i.test(base) && /^\/api\//i.test(p)) p=p.replace(/^\/api/i,'');
  if(p && !p.startsWith('/')) p='/'+p;
  return base+p;
}
async function req(path,opt={}){const r=await fetch(apiUrl(path),{...opt,headers:{...(opt.headers||{}),...BO_AUTH.authHeader(),...(opt.body?{'Content-Type':'application/json'}:{})}}),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');return j.data;}
function d(v){return String(v||'').slice(0,10)} function dt(v){return String(v||'').replace('T',' ').slice(0,19)||'-'}
function range(from,to){return [$(from)?.value||'',$(to)?.value||''];}
function inRange(v,from,to){const x=d(v);return(!from||x>=from)&&(!to||x<=to)}
function metric(icon,label,value,small){return `<div class="agent-admin-metric"><span class="ico"><i class="bi ${icon}"></i></span><div><small>${esc(label)}</small><strong>${esc(value)}</strong>${small?`<small>${esc(small)}</small>`:''}</div></div>`}
function status(s){s=String(s||'').toUpperCase();return `<span class="status-pill ${['ACTIVE','APPROVED','PAID'].includes(s)?'':'off'}">${esc(s||'-')}</span>`}
function currentPage(){return location.pathname.split('/').pop()||''}
async function loadAgents(){return await req('/api/admin/brand-agent/list')||[]}

function stabilizeAgentAdminDropdowns(){
  const closeCard=card=>{
    if(!card)return;
    card.classList.remove('agent-admin-select-open');
    card.style.removeProperty('--agent-admin-menu-space');
  };
  const openWrap=wrap=>{
    if(window.innerWidth<=1100||!wrap)return;
    const card=wrap.closest('.filter-card');
    if(!card)return;
    document.querySelectorAll('.filter-card.agent-admin-select-open').forEach(x=>{if(x!==card)closeCard(x)});
    requestAnimationFrame(()=>{
      const menu=wrap.querySelector('.rounded-select-menu');
      const menuHeight=Math.max(96,Math.min(260,menu?.scrollHeight||menu?.getBoundingClientRect?.().height||112));
      card.style.setProperty('--agent-admin-menu-space',(menuHeight+18)+'px');
      card.classList.add('agent-admin-select-open');
    });
  };

  // Reports.js converts native <select> controls to the approved rounded dropdown.
  // Bind both forms so async-created/rebuilt dropdowns behave exactly like Agent Performance.
  document.querySelectorAll('.filter-card select').forEach(sel=>{
    if(sel.dataset.agentAdminMenuBound==='1')return;
    sel.dataset.agentAdminMenuBound='1';
    const card=sel.closest('.filter-card');
    const openNative=()=>{if(window.innerWidth>1100){card?.style.setProperty('--agent-admin-menu-space','130px');card?.classList.add('agent-admin-select-open')}};
    const closeNative=()=>setTimeout(()=>closeCard(card),100);
    sel.addEventListener('mousedown',openNative);
    sel.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown','ArrowUp'].includes(e.key))openNative()});
    sel.addEventListener('change',closeNative);
    sel.addEventListener('blur',closeNative);
  });

  if(document.documentElement.dataset.agentAdminRoundedBound!=='1'){
    document.documentElement.dataset.agentAdminRoundedBound='1';
    document.addEventListener('click',e=>{
      const btn=e.target.closest('.filter-card .rounded-select-btn');
      if(btn){
        const wrap=btn.closest('.rounded-select-wrap');
        setTimeout(()=>{
          const menu=wrap?.querySelector('.rounded-select-menu');
          if(menu?.classList.contains('show'))openWrap(wrap);else closeCard(wrap?.closest('.filter-card'));
        },0);
        return;
      }
      if(e.target.closest('.filter-card .rounded-select-option')){
        const card=e.target.closest('.filter-card');
        setTimeout(()=>closeCard(card),0);
        return;
      }
      document.querySelectorAll('.filter-card.agent-admin-select-open').forEach(closeCard);
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.filter-card.agent-admin-select-open').forEach(closeCard)});
  }
}

async function agentsPage(){let rows=await loadAgents();const render=()=>{const q=($('adminAgentSearch')?.value||'').toLowerCase(),st=$('adminAgentStatus')?.value||'', [from,to]=range('adminAgentFrom','adminAgentTo');const all=rows.filter(a=>(!q||[a.code,a.name,a.loginUsername].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||String(a.status)===st)&&inRange(a.createdAt,from,to));const active=all.filter(a=>Number(a.status)===1).length,pending=all.reduce((n,a)=>n+(Number(a.pendingSettlement||0)>0?1:0),0),suspended=all.filter(a=>Number(a.status)!==1).length;$('agentAdminMetrics').innerHTML=metric('bi-people','Total Agents',whole(all.length),'Selected period')+metric('bi-person-check','Active Agents',whole(active),'Selected period')+metric('bi-hourglass-split','Pending Review',whole(pending),'Settlement pending')+metric('bi-person-x','Suspended',whole(suspended),'Current status');$('adminAgentsRows').innerHTML=all.map(a=>`<tr><td><b>${esc(a.code||('AGT'+a.id))}</b></td><td>${esc(a.name||'-')}</td><td>${whole(a.memberCount)}</td><td>${whole(a.memberCount)}</td><td>RM ${money(a.totalBetMtd)}</td><td>RM ${money(a.commissionMtd)}</td><td>RM ${money(a.pendingSettlement)}</td><td>${status(Number(a.status)===1?'Active':'Suspended')}</td><td>${esc(d(a.createdAt)||'-')}</td><td><a class="agent-admin-action" title="View Details" href="agent-detail.html?id=${encodeURIComponent(a.id)}"><i class="bi bi-eye"></i></a></td></tr>`).join('')||'<tr><td colspan="10" class="table-empty">No agents found.</td></tr>';$('adminAgentsShowing').textContent=`Showing 1 to ${all.length} of ${all.length} agents`;};$('adminAgentSearchBtn').onclick=render;$('adminAgentReset').onclick=()=>{if($('adminAgentSearch'))$('adminAgentSearch').value='';if($('adminAgentStatus'))$('adminAgentStatus').value='';render()};render();}

async function commissionPage(){const agents=await loadAgents();async function render(){const q=($('agentCommissionSearch')?.value||'').toLowerCase(),[from]=range('agentCommissionFrom','agentCommissionTo');const list=agents.filter(a=>!q||[a.code,a.name].some(v=>String(v||'').toLowerCase().includes(q)));const reports=await Promise.all(list.map(async a=>{try{return {a,r:await req('/api/admin/brand-agent/'+a.id+'/report?date='+encodeURIComponent(from||new Date().toISOString().slice(0,10)))};}catch(e){return {a,r:{}}}}));let totalBet=0,pl=0,com=0;reports.forEach(x=>{totalBet+=Number(x.r.totalTurnover||0);pl+=Number(x.r.customerLoss||0);com+=Number(x.r.availableCommission||0)});$('agentCommissionMetrics').innerHTML=metric('bi-cash-stack','Total Bet','RM '+money(totalBet),'Selected KPI cycles')+metric('bi-graph-up-arrow','Customer P/L','RM '+money(pl),'Loss + / Win -')+metric('bi-percent','Commission','RM '+money(com),'Available commission')+metric('bi-people','Agents',whole(reports.length),'Selected agents');$('agentCommissionRows').innerHTML=reports.map(({a,r})=>`<tr><td><b>${esc(a.code)}</b><small class="d-block">${esc(a.name)}</small></td><td>${whole(a.memberCount)}</td><td>RM ${money(r.totalTurnover)}</td><td class="${Number(r.customerLoss||0)>=0?'money-positive':'money-negative'}">RM ${money(r.customerLoss)}</td><td>${money(a.commissionPercent)}%</td><td>RM ${money(r.availableCommission)}</td><td>RM ${money(a.walletBalance)}</td></tr>`).join('')||'<tr><td colspan="7" class="table-empty">No commission records.</td></tr>';} $('agentCommissionLoad').onclick=render;await render();}

async function settlementData(){return await req('/api/admin/brand-agent/settlements')||[]}
async function settlementPage(){let rows=await settlementData();const render=()=>{const q=($('agentSettlementAdminSearch')?.value||'').toLowerCase(),st=$('agentSettlementAdminStatus')?.value||'', [from,to]=range('agentSettlementAdminFrom','agentSettlementAdminTo');const filtered=rows.filter(x=>(!q||[x.id,x.agentCode,x.agentName].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||String(x.settlementStatus).toUpperCase()===st)&&inRange(x.createdAt,from,to));const pending=filtered.filter(x=>String(x.settlementStatus).toUpperCase()==='PENDING');$('agentSettlementMetrics').innerHTML=metric('bi-people','Pending Count',whole(pending.length),'Overview total')+metric('bi-cash-stack','Pending Amount','RM '+money(pending.reduce((a,x)=>a+Number(x.requestedAmount||0),0)),'Overview total')+metric('bi-check2-circle','Approved',whole(filtered.filter(x=>String(x.settlementStatus).toUpperCase()==='APPROVED').length),'Selected period')+metric('bi-wallet2','Paid',whole(filtered.filter(x=>String(x.settlementStatus).toUpperCase()==='PAID').length),'Selected period');$('agentSettlementAdminRows').innerHTML=filtered.map(x=>`<tr><td>${esc(dt(x.createdAt))}</td><td><b>${esc(x.agentName||'-')}</b><small class="d-block">${esc(x.agentCode||'')}</small></td><td>${esc(x.periodFrom||x.settlementMonth)} - ${esc(x.periodTo||'')}</td><td>RM ${money(x.totalTurnover)}</td><td class="${Number(x.houseWin||0)>=0?'money-positive':'money-negative'}">RM ${money(x.houseWin)}</td><td><b>RM ${money(x.requestedAmount)}</b></td><td>${status(x.settlementStatus)}</td><td><div class="agent-approval-actions">${String(x.settlementStatus).toUpperCase()==='PENDING'?`<button class="approve-btn" data-settle-approve="${x.id}" title="Approve"><i class="bi bi-check-lg"></i></button><button class="reject-btn" data-settle-reject="${x.id}" title="Reject"><i class="bi bi-x-lg"></i></button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="table-empty">No settlement requests.</td></tr>';};$('agentSettlementAdminLoad').onclick=render;$('agentSettlementAdminRows').onclick=async e=>{const ap=e.target.closest('[data-settle-approve]'),rj=e.target.closest('[data-settle-reject]');if(ap){await req('/api/admin/brand-agent/settlement/'+ap.dataset.settleApprove+'/approve',{method:'POST',body:'{}'});rows=await settlementData();render()}if(rj){const reason=await BO_DIALOG.prompt('Enter rejection reason','',{title:'Reject Settlement',inputLabel:'Reason'});if(reason){await req('/api/admin/brand-agent/settlement/'+rj.dataset.settleReject+'/reject',{method:'POST',body:JSON.stringify({reason})});rows=await settlementData();render()}}};render();}

async function claimPage(){let rows=await req('/api/admin/brand-agent/ad-claims')||[];const render=()=>{const q=($('agentClaimSearch')?.value||'').toLowerCase(),st=$('agentClaimStatus')?.value||'', [from,to]=range('agentClaimFrom','agentClaimTo');const f=rows.filter(x=>(!q||[x.id,x.agentCode,x.agentName].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||String(x.status).toUpperCase()===st)&&inRange(x.createdAt,from,to));const pending=f.filter(x=>String(x.status).toUpperCase()==='PENDING');$('agentAdClaimMetrics').innerHTML=metric('bi-people','Pending Count',whole(pending.length),'Overview total')+metric('bi-cash-stack','Pending Amount','RM '+money(pending.reduce((a,x)=>a+Number(x.amount||0),0)),'Overview total');$('agentClaimCountText').textContent=f.length+' request(s)';$('agentClaimRows').innerHTML=f.map(x=>`<tr><td>${esc(dt(x.createdAt))}</td><td><b>${esc(x.agentName||'-')}</b><small class="d-block">ID: ${esc(x.agentId)} · ${esc(x.agentCode||'')}</small></td><td><span class="badge text-bg-light">Ad Claim</span></td><td><b>${money(x.amount)}</b></td><td>AD-${esc(x.id)}</td><td>${status(x.status)}</td><td>${x.proofImageUrl?`<a class="agent-proof-link" href="${esc(x.proofImageUrl)}" target="_blank"><i class="bi bi-image"></i> View proof</a>`:'-'}</td><td><div class="agent-approval-actions">${String(x.status).toUpperCase()==='PENDING'?`<button class="approve-btn" data-claim-approve="${x.id}"><i class="bi bi-check-lg"></i></button><button class="reject-btn" data-claim-reject="${x.id}"><i class="bi bi-x-lg"></i></button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="table-empty">No reimbursement / ad claim requests.</td></tr>'};$('agentClaimLoad').onclick=render;$('agentClaimRows').onclick=async e=>{const ap=e.target.closest('[data-claim-approve]'),rj=e.target.closest('[data-claim-reject]');if(ap){await req('/api/admin/brand-agent/ad-claim/'+ap.dataset.claimApprove+'/approve',{method:'POST',body:'{}'});rows=await req('/api/admin/brand-agent/ad-claims')||[];render()}if(rj){const reason=await BO_DIALOG.prompt('Enter rejection reason','',{title:'Reject Ad Claim',inputLabel:'Reason'});if(reason){await req('/api/admin/brand-agent/ad-claim/'+rj.dataset.claimReject+'/reject',{method:'POST',body:JSON.stringify({reason})});rows=await req('/api/admin/brand-agent/ad-claims')||[];render()}}};render();}

async function payoutPage(){let rows=await settlementData();const render=()=>{const q=($('agentPayoutSearch')?.value||'').toLowerCase(),st=$('agentPayoutStatus')?.value||'', [from,to]=range('agentPayoutFrom','agentPayoutTo');const f=rows.filter(x=>(!q||[x.id,x.agentCode,x.agentName].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||String(x.settlementStatus).toUpperCase()===st)&&inRange(x.createdAt,from,to));$('agentPayoutMetrics').innerHTML=metric('bi-wallet2','Approved For Payout','RM '+money(f.filter(x=>String(x.settlementStatus).toUpperCase()==='APPROVED').reduce((a,x)=>a+Number(x.requestedAmount||0),0)),'Ready to pay')+metric('bi-hourglass-split','Pending','RM '+money(f.filter(x=>String(x.settlementStatus).toUpperCase()==='PENDING').reduce((a,x)=>a+Number(x.requestedAmount||0),0)),'Under review')+metric('bi-check2-circle','Paid',whole(f.filter(x=>String(x.settlementStatus).toUpperCase()==='PAID').length),'Selected period');$('agentPayoutRows').innerHTML=f.map(x=>`<tr><td>#${esc(x.id)}</td><td><b>${esc(x.agentName||'-')}</b><small class="d-block">${esc(x.agentCode||'')}</small></td><td>${esc(dt(x.createdAt))}</td><td>RM ${money(x.requestedAmount)}</td><td>${x.bankName?`${esc(x.bankName)}<small class="d-block">**** ${esc(String(x.bankAccountNumber||'').slice(-4))}</small>`:'Registered payout account'}</td><td>${status(x.settlementStatus)}</td><td>${esc(x.paymentReference||'-')}</td><td>${String(x.settlementStatus).toUpperCase()==='APPROVED'?`<button class="pay-btn" data-pay="${x.id}" title="Mark Paid"><i class="bi bi-cash-stack"></i></button>`:'-'}</td></tr>`).join('')||'<tr><td colspan="8" class="table-empty">No payout requests.</td></tr>'};$('agentPayoutLoad').onclick=render;$('agentPayoutRows').onclick=async e=>{const b=e.target.closest('[data-pay]');if(!b)return;const ref=await BO_DIALOG.prompt('Enter payment reference','',{title:'Mark Payout Paid',inputLabel:'Payment reference'});if(ref==null)return;await req('/api/admin/brand-agent/settlement/'+b.dataset.pay+'/pay',{method:'POST',body:JSON.stringify({paymentReference:ref})});rows=await settlementData();render()};render();}

async function promotionPage(){async function render(){const[from,to]=range('agentPromotionFrom','agentPromotionTo'),q=($('agentPromotionSearch')?.value||'').toLowerCase();let rows=[];try{rows=await req('/api/admin/operations/promotion-report?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to))||[]}catch(e){}rows=rows.filter(x=>!q||[x.name,x.promotionCode].some(v=>String(v||'').toLowerCase().includes(q)));$('agentPromotionRows').innerHTML=rows.map(x=>`<tr><td><b>${esc(x.name||'-')}</b><small class="d-block">${esc(x.promotionCode||'')}</small></td><td>${whole(x.claimCount)}</td><td>${whole(x.uniqueClaimers)}</td><td>RM ${money(x.payoutAmount)}</td><td>${whole(x.repeatedClaimCount)}</td></tr>`).join('')||'<tr><td colspan="5" class="table-empty">No promotion activity.</td></tr>'}$('agentPromotionLoad').onclick=render;await render();}

async function init(){BO_AUTH.requireLogin();await BO_AUTH.refreshMe();stabilizeAgentAdminDropdowns();const p=currentPage();try{if(p==='agent-management.html')await agentsPage();else if(p==='agent-commission-admin.html')await commissionPage();else if(p==='agent-settlement-admin.html')await settlementPage();else if(p==='agent-reimbursement-admin.html')await claimPage();else if(p==='agent-payout-admin.html')await payoutPage();else if(p==='agent-promotion-admin.html')await promotionPage();}catch(e){console.error(e);window.BO_DIALOG?.alert?.(e.message,{title:'Agent Management',type:'error'});}finally{stabilizeAgentAdminDropdowns();}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
