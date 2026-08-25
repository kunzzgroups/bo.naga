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
    if(isNew && b.dataset.agentSection!=='settings'){
      if(window.BO_DIALOG?.alert) BO_DIALOG.alert('Save the new agent first before opening this section.',{title:'Save Agent First',type:'info'});
      return;
    }
    show(b.dataset.agentSection);
  }));
  const params=new URLSearchParams(location.search);
  if(params.get('new')==='1'){
    $('#agentDetailHeading') && ($('#agentDetailHeading').textContent='Create New Agent');
    show('settings');
  } else {
    const requested=params.get('section')||'settings';
    if(['settings','players','settlement','portal','wallet','bets','history'].includes(requested)) show(requested);
  }
  window.addEventListener('agent:detail-loaded',e=>{
    const a=e.detail||{};
    const h=$('#agentDetailHeading');
    if(h) h.textContent=(a.name||'Agent')+' · '+(a.code||'');
  });
})();
