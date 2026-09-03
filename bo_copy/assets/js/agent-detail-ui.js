(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  if(document.body.dataset.agentDetail!=='1') return;
  function show(section){
    $$('.agent-detail-panel').forEach(p=>p.classList.toggle('is-active',p.dataset.agentPanel===section));
    $$('[data-agent-section]').forEach(b=>{
      const on=b.dataset.agentSection===section;
      b.classList.toggle('primary',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
    const panel=$('.agent-detail-panel.is-active');
    if(panel) panel.scrollIntoView({block:'start',behavior:'smooth'});
  }
  $('#backAgentList')?.addEventListener('click',()=>{location.href='agent-management.html';});
  $$('[data-agent-section]').forEach(b=>b.addEventListener('click',()=>{
    const isNew=new URLSearchParams(location.search).get('new')==='1';
    if(isNew && b.dataset.agentSection!=='details'){
      window.BO_DIALOG?.alert?.('Save the new agent first before opening this section.',{title:'Save Agent First',type:'info'});
      return;
    }
    show(b.dataset.agentSection);
  }));
  const params=new URLSearchParams(location.search);
  if(params.get('new')==='1'){
    if($('#agentDetailHeading')) $('#agentDetailHeading').textContent='Create New Agent';
    show('details');
  } else {
    let requested=params.get('section')||'overview';
    if(requested==='settings') requested='details';
    if(requested==='portal') requested='details';
    if(requested==='settlement'||requested==='wallet') requested='history';
    if(['overview','details','players','bets','bonus','adjustments','history'].includes(requested)) show(requested); else show('overview');
  }
  window.addEventListener('agent:detail-loaded',e=>{
    const a=e.detail||{};
    const h=$('#agentDetailHeading');
    if(h) h.textContent=(a.name||'Agent')+' · '+(a.code||'');
    const host=$('#agentDetailSummaryTop');
    if(host){
      const money=v=>'RM '+Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
      host.innerHTML='<div class="agent-detail-identity"><div class="agent-detail-avatar"><i class="bi bi-person"></i></div><div><h4 class="mb-1">'+String(a.code||'Agent')+'</h4><b>'+String(a.name||'')+'</b><div class="small text-muted mt-1">Joined: '+String(a.createdAt||'').slice(0,10)+'</div></div></div>'+ 
        '<div class="agent-detail-stat"><span class="agent-detail-stat-ico"><i class="bi bi-people"></i></span><div class="agent-detail-stat-copy"><span>Total Players</span><strong>'+Number(a.memberCount||0).toLocaleString()+'</strong></div></div>'+ 
        '<div class="agent-detail-stat"><span class="agent-detail-stat-ico"><i class="bi bi-cash-stack"></i></span><div class="agent-detail-stat-copy"><span>Total Bet (MTD)</span><strong>'+money(a.totalBetMtd)+'</strong></div></div>'+ 
        '<div class="agent-detail-stat"><span class="agent-detail-stat-ico"><i class="bi bi-graph-up-arrow"></i></span><div class="agent-detail-stat-copy"><span>Total P/L (MTD)</span><strong>'+money(a.playerPLMtd)+'</strong></div></div>'+ 
        '<div class="agent-detail-stat"><span class="agent-detail-stat-ico"><i class="bi bi-percent"></i></span><div class="agent-detail-stat-copy"><span>Commission (MTD)</span><strong>'+money(a.commissionMtd)+'</strong></div></div>'+ 
        '<div class="agent-detail-stat"><span class="agent-detail-stat-ico"><i class="bi bi-wallet2"></i></span><div class="agent-detail-stat-copy"><span>Available Balance</span><strong>'+money(a.walletBalance)+'</strong></div></div>';
    }
  });
})();
