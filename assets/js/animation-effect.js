(function(){
  'use strict';
  const $=id=>document.getElementById(id), base=()=>API_CONFIG.BASE_URL;
  let rules=[],categories=[],providers=[],games=[],customEffects=[];
  const SITE_ASSETS=[
    {code:'logoUrl',label:'Main Logo'},
    {code:'referralUrl',label:'Referral Icon / Image'},
    {code:'shareUrl',label:'Share Icon / Image'},
    {code:'downlineUrl',label:'Downline Icon / Image'},
    {code:'copylinkUrl',label:'Copy Link Icon / Image'},
    {code:'loginUrl',label:'Login Button / Image'},
    {code:'registerUrl',label:'Register Button / Image'},
    {code:'depositUrl',label:'Deposit Button / Image'},
    {code:'withdrawUrl',label:'Withdraw Button / Image'},
    {code:'refreshUrl',label:'Refresh Button / Image'},
    {code:'homeUrl',label:'Bottom Nav Home'},
    {code:'historyUrl',label:'Bottom Nav History'},
    {code:'bonusUrl',label:'Bottom Nav Bonus'},
    {code:'livechatUrl',label:'Bottom Nav Live Chat'},
    {code:'settingUrl',label:'Bottom Nav Setting'},
    {code:'providerAllUrl',label:'All Provider Image'}
  ];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function json(url,opt){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||('HTTP '+r.status));return j}
  function setStatus(msg,bad){$('effectStatus').textContent=msg||'';$('effectStatus').className='effect-status '+(bad?'bad':'ok')}
  function dataOf(j){return Array.isArray(j&&j.data)?j.data:[]}

  async function loadCustomEffects(){
    const j=await json(base()+'/admin/custom-animation-effect/list');
    customEffects=dataOf(j);
    refreshCustomOptions();
  }
  function refreshCustomOptions(selected){
    const sel=$('customEffectName');
    if(!sel)return;
    const rows=customEffects.slice().sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||Number(a.id||0)-Number(b.id||0));
    sel.innerHTML='<option value="">-- Select Custom Effect --</option>'+rows.map(x=>'<option value="'+esc(x.effectName)+'" '+(Number(x.enabled)===1?'':'disabled')+'>'+esc(x.effectName)+(Number(x.enabled)===1?'':' (Disabled)')+'</option>').join('');
    if(selected)sel.value=String(selected).toUpperCase();
  }
  async function loadTargets(){
    const [c,p,g]=await Promise.all([json(base()+'/admin/game-category/list'),json(base()+'/admin/game-provider/list'),json(base()+'/admin/game/list')]);
    categories=dataOf(c);providers=dataOf(p);games=dataOf(g);refreshTarget();
  }
  function refreshScopeOptions(selectedScope){
    const apply=$('applyTo').value, scope=$('scopeType'), current=selectedScope||scope.value;
    if(apply==='SITE_ASSET'){
      scope.innerHTML='<option value="GLOBAL">All Site Assets</option><option value="ASSET">One Site Asset</option>';
      scope.value=(current==='ASSET'||current==='GLOBAL')?current:'ASSET';
    }else{
      scope.innerHTML='<option value="GLOBAL">All</option><option value="CATEGORY">One Category</option><option value="PROVIDER">One Provider</option><option value="GAME">One Game</option>';
      scope.value=['GLOBAL','CATEGORY','PROVIDER','GAME'].includes(current)?current:'GLOBAL';
    }
  }
  function refreshTarget(selected){
    refreshScopeOptions();
    const apply=$('applyTo').value, scope=$('scopeType').value, field=$('targetField'), sel=$('targetValue');
    if(scope==='GLOBAL'){field.hidden=true;sel.innerHTML='';return}
    field.hidden=false;let rows=[],label='Target';
    if(apply==='SITE_ASSET'&&scope==='ASSET'){label='Site Customize Asset';rows=SITE_ASSETS.map(x=>({value:x.code,label:x.label}))}
    else if(scope==='CATEGORY'){label='Category';rows=categories.map(x=>({value:x.id,label:(x.name||'Category')+' (#'+x.id+')'}))}
    else if(scope==='PROVIDER'){label='Provider';rows=providers.map(x=>({value:x.code,label:(x.name||x.code)+' ['+x.code+']'}))}
    else if(scope==='GAME'){label='Game';rows=games.map(x=>({value:x.id,label:(x.name||'Game')+' · '+(x.providerCode||'-')+' (#'+x.id+')'}))}
    $('targetLabel').textContent=label;sel.innerHTML='<option value="">-- Select '+label+' --</option>'+rows.map(x=>'<option value="'+esc(x.value)+'">'+esc(x.label)+'</option>').join('');if(selected!=null)sel.value=String(selected);
    $('targetHelp').textContent=apply==='SITE_ASSET'?'The selected Site Customize image can use the same built-in or custom effects. Language-specific replacement images inherit the same animation automatically.':scope==='PROVIDER'?'Selecting a provider can animate the provider card itself or every game from that provider.':scope==='CATEGORY'?'When Category Button is selected, an enabled BO rule overrides the original Naga category animation. Disabling/deleting the rule restores the original behavior. Category scope can also target providers/games assigned to it.':'Use One Game when only a specific game should animate.';
  }
  function customNameFromType(type){const t=String(type||'').toUpperCase();return t.startsWith('CUSTOM_')?t.slice(7):''}
  function refreshCustomField(){
    const custom=$('animationType').value==='CUSTOM';
    $('customEffectField').hidden=!custom;
    const help=$('customHelp');
    if(help) help.hidden=!custom;
    if(!custom)$('customEffectName').value='';
  }
  function animationLabel(){
    const sel=$('animationType');
    const opt=sel&&sel.selectedOptions[0];
    if($('animationType').value==='CUSTOM'){
      const n=String($('customEffectName').value||'').trim();
      return n?('Custom · '+n):'Custom';
    }
    return opt?opt.textContent:'Animation';
  }
  function preview(){
    const el=$('effectPreview');
    if(!el) return;
    const type=$('animationType').value.toLowerCase().replaceAll('_','-');
    const speed=$('speed').value, intensity=$('intensity').value;
    const duration=speed==='SLOW'?'3.4s':speed==='FAST'?'1.25s':'2.35s';
    refreshCustomField();
    el.className='effect-preview';
    el.style.animation='none';
    el.style.setProperty('--naga-effect-duration', duration);
    el.style.setProperty('--naga-effect-distance', intensity==='LOW'?'6px':intensity==='HIGH'?'14px':'9px');
    el.style.setProperty('--naga-effect-scale', intensity==='LOW'?'1.03':intensity==='HIGH'?'1.08':'1.05');
    el.style.setProperty('--naga-effect-glow', intensity==='LOW'?'10px':intensity==='HIGH'?'24px':'16px');
    if(type==='custom'){el.textContent=$('customEffectName').value.trim()||'CUSTOM'}
    else{
      el.textContent='TITANX';
      if(type!=='none') el.classList.add('fx-'+type);
    }
    // Force animation restart after class swap
    void el.offsetWidth;
    el.style.animation='';
    el.style.animationDuration=duration;
    const hint=$('previewHint');
    if(hint){
      const sOpt=$('speed').selectedOptions[0], iOpt=$('intensity').selectedOptions[0];
      hint.textContent=animationLabel()+' · '+(sOpt?sOpt.textContent:speed)+' · '+(iOpt?iOpt.textContent:intensity);
    }
  }
  function targetName(rule){if(rule.scopeType==='GLOBAL')return 'All';return rule.targetName||rule.targetCode||('#'+rule.targetId)}
  function titleCaseWords(v){
    return String(v==null?'':v).trim().replace(/\s+/g,' ').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase());
  }
  function applyToLabel(v){
    const map={GAME:'Game',PROVIDER:'Provider',CATEGORY:'Category',CATEGORY_BUTTON:'Category Button',SITE_ASSET:'Site Asset'};
    return map[String(v||'').toUpperCase()]||titleCaseWords(String(v||'').replaceAll('_',' '));
  }
  function scopeLabel(v){
    const map={GLOBAL:'Global',CATEGORY:'Category',PROVIDER:'Provider',GAME:'Game',ASSET:'Asset'};
    return map[String(v||'').toUpperCase()]||titleCaseWords(String(v||'').replaceAll('_',' '));
  }
  function metaLabel(v){return titleCaseWords(String(v||'').replaceAll('_',' '))}
  function effectLabel(type){
    const c=customNameFromType(type);
    if(c) return 'Custom · '+titleCaseWords(c.replaceAll('_',' '));
    return titleCaseWords(String(type||'').replaceAll('_',' + '));
  }
  let statusFilter='on', elementFilter='';
  function filteredRules(){
    return rules.filter(r=>{
      const on=Number(r.enabled)===1;
      if(statusFilter==='on' && !on) return false;
      if(statusFilter==='off' && on) return false;
      if(elementFilter && String(r.applyTo||'')!==elementFilter) return false;
      return true;
    });
  }
  function syncFilterChrome(){
    document.querySelectorAll('.effect-filter').forEach(btn=>{
      const f=btn.dataset.filter;
      const isStatus=['all','on','off'].includes(f);
      const active=isStatus ? statusFilter===f : elementFilter===f;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active?'true':'false');
    });
    const onN=rules.filter(r=>Number(r.enabled)===1).length;
    const set=(key,n)=>{const el=document.querySelector('[data-filter-count="'+key+'"]');if(el)el.textContent=String(n)};
    set('all',rules.length);set('on',onN);set('off',rules.length-onN);
    const statusTrack=document.querySelector('.effect-status-tabs');
    if(statusTrack&&window.BO_SEG_BOUNCE){
      try{window.BO_SEG_BOUNCE.sync(statusTrack);}catch(_){}
    }
  }
  function syncCount(){
    const countEl=$('effectCount'), wrap=$('effectWallWrap'), empty=$('effectEmpty'), filterEmpty=$('effectFilterEmpty');
    const n=rules.length, shown=filteredRules().length;
    if(countEl){countEl.textContent=String(n);countEl.hidden=n===0}
    if(empty) empty.hidden=n>0;
    if(filterEmpty) filterEmpty.hidden=!(n>0 && shown===0);
    if(wrap){wrap.hidden=n===0 || shown===0;wrap.classList.toggle('is-empty', n===0 || shown===0)}
    syncFilterChrome();
  }
  function render(){
    const body=$('effectList');
    if(!body) return;
    const editingId=String($('effectId').value||'');
    const rows=filteredRules();
    syncCount();
    body.innerHTML=rows.map(r=>{
      const on=Number(r.enabled)===1;
      const active=editingId && String(r.id)===editingId;
      const fx=effectLabel(r.animationType);
      const where=[applyToLabel(r.applyTo),scopeLabel(r.scopeType),targetName(r)].filter(Boolean).join(' · ');
      const meta=[metaLabel(r.speed),metaLabel(r.intensity),'Priority '+Number(r.sortOrder||0)].join(' · ');
      return (
        '<article class="effect-rule-card'+(active?' is-editing':'')+(on?' is-on':' is-off')+'" role="listitem" data-rule-id="'+r.id+'" tabindex="0" aria-label="'+esc(fx)+' · '+(on?'Enabled':'Disabled')+' · '+esc(where)+'">'+
          '<header class="effect-rule-card-head">'+
            '<p class="effect-rule-fx" title="'+esc(fx)+'">'+esc(fx)+'</p>'+
            '<div class="effect-row-actions">'+
              '<button type="button" class="effect-icon-btn" data-edit="'+r.id+'" title="Edit" aria-label="Edit"><i class="bi bi-pencil"></i></button>'+
              '<button type="button" class="effect-icon-btn" data-delete="'+r.id+'" title="Delete" aria-label="Delete"><i class="bi bi-trash"></i></button>'+
            '</div>'+
          '</header>'+
          '<p class="effect-rule-where" title="'+esc(where)+'">'+esc(where)+'</p>'+
          '<p class="effect-rule-meta-line">'+esc(meta)+'</p>'+
        '</article>'
      );
    }).join('');
  }
  async function loadRules(){const j=await json(base()+'/admin/animation-setting/list');rules=dataOf(j);render()}
  function reset(){ $('effectForm').reset();$('effectId').value='';const title=$('effectFormTitle');if(title)title.textContent='Create Animation Rule';$('applyTo').value='GAME';refreshScopeOptions('GLOBAL');$('scopeType').value='GLOBAL';$('animationType').value='FLOAT_GLOW';$('customEffectName').value='';$('speed').value='NORMAL';$('intensity').value='MEDIUM';$('enabled').value='1';$('sortOrder').value='0';refreshTarget();preview();setStatus('');render() }
  function edit(id){const r=rules.find(x=>String(x.id)===String(id));if(!r)return;setWorkspaceMode('rule');$('effectId').value=r.id;const title=$('effectFormTitle');if(title)title.textContent='Edit Rule #'+r.id;$('applyTo').value=r.applyTo;refreshScopeOptions(r.scopeType);$('scopeType').value=r.scopeType;const custom=customNameFromType(r.animationType);$('animationType').value=custom?'CUSTOM':r.animationType;refreshCustomOptions(custom);$('customEffectName').value=custom;$('speed').value=r.speed;$('intensity').value=r.intensity;$('enabled').value=String(r.enabled);$('sortOrder').value=String(r.sortOrder||0);refreshTarget((r.scopeType==='PROVIDER'||r.scopeType==='ASSET')?r.targetCode:r.targetId);preview();render();const composer=document.querySelector('.effect-card--composer');if(composer)composer.scrollIntoView({behavior:'smooth',block:'nearest'});else window.scrollTo({top:0,behavior:'smooth'})}
  function targetInfo(){const scope=$('scopeType').value,v=$('targetValue').value,opt=$('targetValue').selectedOptions[0];if(scope==='GLOBAL')return {targetName:'All'};if(!v)throw new Error('Please select a target');if(scope==='PROVIDER'||scope==='ASSET')return {targetCode:v,targetName:opt?opt.textContent:v};return {targetId:Number(v),targetName:opt?opt.textContent:v}}
  function animationTypeValue(){if($('animationType').value!=='CUSTOM')return $('animationType').value;const name=String($('customEffectName').value||'').trim().toUpperCase();if(!name)throw new Error('Please select a custom effect.');const fx=customEffects.find(x=>String(x.effectName||'').toUpperCase()===name);if(!fx)throw new Error('Selected custom effect no longer exists.');if(Number(fx.enabled)!==1)throw new Error('Selected custom effect is disabled. Enable it in the Create Effect tab first.');return 'CUSTOM_'+name}
  function setWorkspaceMode(mode){
    const next=mode==='effect'?'effect':'rule';
    const layout=$('animationLayout');
    const ledger=$('animationLedger');
    if(layout) layout.setAttribute('data-effect-mode',next);
    if(ledger) ledger.hidden=next==='effect';
    document.querySelectorAll('[data-effect-mode]').forEach(btn=>{
      if(!btn.classList.contains('bo-tx-tab'))return;
      const on=btn.dataset.effectMode===next;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
    });
    document.querySelectorAll('[data-effect-panel]').forEach(panel=>{
      const on=panel.dataset.effectPanel===next;
      panel.classList.toggle('is-active',on);
      panel.hidden=!on;
    });
    if(window.CustomAnimationManager&&typeof CustomAnimationManager.setActive==='function'){
      CustomAnimationManager.setActive(next==='effect');
    }
    const modeTrack=document.querySelector('.effect-mode-tabs');
    if(modeTrack&&window.BO_SEG_BOUNCE){
      try{window.BO_SEG_BOUNCE.sync(modeTrack)}catch(_){}
    }
    if(next==='rule'){
      loadCustomEffects().catch(()=>{});
    }
  }
  $('applyTo').addEventListener('change',()=>{refreshScopeOptions();refreshTarget();});$('scopeType').addEventListener('change',()=>refreshTarget());['animationType','speed','intensity'].forEach(id=>$(id).addEventListener('change',preview));$('customEffectName').addEventListener('change',preview);$('resetEffect').addEventListener('click',reset);$('refreshEffect').addEventListener('click',()=>loadRules().catch(e=>setStatus(e.message,true)));
  document.querySelector('.effect-mode-tabs')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-effect-mode]');
    if(!btn)return;
    setWorkspaceMode(btn.dataset.effectMode);
  });
  document.addEventListener('bo:custom-animation-changed',()=>{loadCustomEffects().catch(()=>{})});
  $('effectForm').addEventListener('submit',async e=>{e.preventDefault();try{const payload=Object.assign({id:$('effectId').value?Number($('effectId').value):null,applyTo:$('applyTo').value,scopeType:$('scopeType').value,animationType:animationTypeValue(),speed:$('speed').value,intensity:$('intensity').value,enabled:Number($('enabled').value),sortOrder:Number($('sortOrder').value||0)},targetInfo());await json(base()+'/admin/animation-setting/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});setStatus('Rule saved. Frontend picks it up on the next refresh.');await loadRules();reset()}catch(err){setStatus(err.message,true)}});
  document.querySelector('.effect-wall-toolbar')?.addEventListener('click',e=>{
    const btn=e.target.closest('.effect-filter');if(!btn)return;
    const f=btn.dataset.filter;
    if(['all','on','off'].includes(f)){
      statusFilter=f;
    }else{
      elementFilter=elementFilter===f?'':f;
    }
    render();
  });
  $('effectList').addEventListener('click',async e=>{
    const delBtn=e.target.closest('[data-delete]');
    const editBtn=e.target.closest('[data-edit]');
    const card=e.target.closest('.effect-rule-card');
    if(delBtn){
      e.stopPropagation();
      if(!(await BO_DIALOG.confirm('Delete this animation rule?',{title:'Delete Animation Rule',confirmText:'Delete',type:'danger'})))return;
      try{await json(base()+'/admin/animation-setting/delete?id='+encodeURIComponent(delBtn.dataset.delete),{method:'POST'});await loadRules();setStatus('Rule deleted. Built-in behaviour returns after Naga revalidates.')}catch(err){setStatus(err.message,true)}
      return;
    }
    if(editBtn){e.stopPropagation();return edit(editBtn.dataset.edit)}
    if(card) return edit(card.dataset.ruleId);
  });
  $('effectList').addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const card=e.target.closest('.effect-rule-card');
    if(!card || e.target.closest('button')) return;
    e.preventDefault();
    edit(card.dataset.ruleId);
  });
  Promise.all([loadTargets(),loadRules(),loadCustomEffects()]).then(()=>{
    reset();
    setWorkspaceMode('rule');
    const statusTrack=document.querySelector('.effect-status-tabs');
    const modeTrack=document.querySelector('.effect-mode-tabs');
    if(statusTrack&&window.BO_SEG_BOUNCE){
      window.BO_SEG_BOUNCE.mount(statusTrack,{button:':scope > .bo-tx-tab',anim:'bounce'});
    }
    if(modeTrack&&window.BO_SEG_BOUNCE){
      window.BO_SEG_BOUNCE.mount(modeTrack,{button:':scope > .bo-tx-tab',anim:'bounce'});
    }
  }).catch(e=>setStatus(e.message,true));
})();
