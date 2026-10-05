(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  if(document.body.dataset.agentDetail!=='1') return;
  const isNewAgent=()=>new URLSearchParams(location.search).get('new')==='1';
  /* One file serves two jobs: creating an agent (?new=1) and reviewing one (?id=N). The mode
     cannot live in the markup - the topbar and the fixed action band are shared by both - so
     it is applied here. It also has to be re-applied on every entry: a swap replaces the header
     and re-derives the pinned title from the target document, and it re-runs this script each
     time, so the call below is what a later entry sees. `agent-create-mode` is what
     agent-detail-create.css uses to drop the tab strip and the identity summary. */
  function applyDetailMode(){
    const isNew=isNewAgent();
    document.body.classList.toggle('agent-create-mode',isNew);
    const heading=$('#agentPageTitle')||$('.report-topbar .user-title-wrap h1');
    if(heading) heading.textContent=isNew?'Create New Agent':'Agent Details';
    const icon=$('.report-topbar .user-title-icon i');
    if(icon) icon.className=isNew?'bi bi-person-plus':'bi bi-person-workspace';
    const submitLabel=$('#agentSubmitLabel');
    if(submitLabel) submitLabel.textContent=isNew?'Create Agent':'Save Agent';
    return isNew;
  }
  const isNew=applyDetailMode();
  /* `bo:spa:content` is dispatched after the router has finished the swap - header replaced,
     title re-derived - so this is the last word on the mode for a swap into this page. Guarded
     on the file name because the listener outlives the navigation away from it. */
  document.addEventListener('bo:spa:content',()=>{
    if(String(location.pathname).split('/').pop().toLowerCase()==='agent-detail.html') applyDetailMode();
  });
  function show(section,opts){
    $$('.agent-detail-panel').forEach(p=>p.classList.toggle('is-active',p.dataset.agentPanel===section));
    $$('[data-agent-section]').forEach(b=>{
      const on=b.dataset.agentSection===section;
      b.classList.toggle('primary',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
    const panel=$('.agent-detail-panel.is-active');
    /* Create mode has one visible panel and no tab strip, and the page should stay at the top
       (scrolling to a panel that starts under the header pushes the title out of view). */
    if(panel&&!(opts&&opts.noScroll)) panel.scrollIntoView({block:'start',behavior:'smooth'});
  }
  /* "Back to Agents" is an anchor now (the house back-link recipe); no click handler. */
  $$('[data-agent-section]').forEach(b=>b.addEventListener('click',()=>{
    const isNewMode=new URLSearchParams(location.search).get('new')==='1';
    if(isNewMode && b.dataset.agentSection!=='details'){
      window.BO_DIALOG?.alert?.('Save the new agent first before opening this section.',{title:'Save Agent First',type:'info'});
      return;
    }
    show(b.dataset.agentSection);
  }));
  const params=new URLSearchParams(location.search);
  if(isNew){
    show('details',{noScroll:true});
  } else {
    let requested=params.get('section')||'overview';
    if(requested==='settings') requested='details';
    if(requested==='portal') requested='details';
    if(requested==='settlement'||requested==='wallet') requested='history';
    if(['overview','details','players','bets','bonus','adjustments','history'].includes(requested)) show(requested); else show('overview');
  }
  window.addEventListener('agent:detail-loaded',e=>{
    const a=e.detail||{};
    /* The toolbar no longer carries a "name · code" heading - the tab strip holds that
       position - so this only re-applies the mode and paints the identity summary. */
    applyDetailMode();
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
