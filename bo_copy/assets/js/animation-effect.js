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
  function refreshCustomField(){const custom=$('animationType').value==='CUSTOM';$('customEffectField').hidden=!custom;if(!custom)$('customEffectName').value=''}
  function preview(){
    const el=$('effectPreview'),type=$('animationType').value.toLowerCase().replaceAll('_','-'),speed=$('speed').value,intensity=$('intensity').value;
    refreshCustomField();el.className='effect-preview';el.style.animationDuration=speed==='SLOW'?'3.4s':speed==='FAST'?'1.25s':'2.35s';el.style.setProperty('--naga-effect-distance',intensity==='LOW'?'4px':intensity==='HIGH'?'11px':'7px');el.style.setProperty('--naga-effect-scale',intensity==='LOW'?'1.018':intensity==='HIGH'?'1.065':'1.035');el.style.setProperty('--naga-effect-glow',intensity==='LOW'?'8px':intensity==='HIGH'?'22px':'14px');
    if(type==='custom'){el.textContent=$('customEffectName').value.trim()||'CUSTOM';return}
    el.textContent='TITANX';if(type!=='none')el.classList.add('fx-'+type);
  }
  function targetName(rule){if(rule.scopeType==='GLOBAL')return 'All';return rule.targetName||rule.targetCode||('#'+rule.targetId)}
  function effectLabel(type){const c=customNameFromType(type);return c?'CUSTOM: '+c:String(type||'').replaceAll('_',' + ')}
  function render(){const body=$('effectList');$('effectEmpty').hidden=rules.length>0;body.innerHTML=rules.map(r=>'<tr><td><b>'+esc(r.applyTo)+'</b></td><td><span class="effect-badge">'+esc(r.scopeType)+'</span> '+esc(targetName(r))+'</td><td>'+esc(effectLabel(r.animationType))+'</td><td>'+esc(r.speed)+'</td><td>'+esc(r.intensity)+'</td><td><span class="effect-badge '+(Number(r.enabled)===1?'':'off')+'">'+(Number(r.enabled)===1?'Enabled':'Disabled')+'</span></td><td>'+Number(r.sortOrder||0)+'</td><td><div class="effect-row-actions"><button class="effect-icon-btn" data-edit="'+r.id+'" title="Edit"><i class="bi bi-pencil"></i></button><button class="effect-icon-btn" data-delete="'+r.id+'" title="Delete"><i class="bi bi-trash"></i></button></div></td></tr>').join('')}
  async function loadRules(){const j=await json(base()+'/admin/animation-setting/list');rules=dataOf(j);render()}
  function reset(){ $('effectForm').reset();$('effectId').value='';$('effectFormTitle').textContent='Create Animation Rule';$('applyTo').value='GAME';refreshScopeOptions('GLOBAL');$('scopeType').value='GLOBAL';$('animationType').value='FLOAT_GLOW';$('customEffectName').value='';$('speed').value='NORMAL';$('intensity').value='MEDIUM';$('enabled').value='1';$('sortOrder').value='0';refreshTarget();preview();setStatus('') }
  function edit(id){const r=rules.find(x=>String(x.id)===String(id));if(!r)return;$('effectId').value=r.id;$('effectFormTitle').textContent='Edit Animation Rule #'+r.id;$('applyTo').value=r.applyTo;refreshScopeOptions(r.scopeType);$('scopeType').value=r.scopeType;const custom=customNameFromType(r.animationType);$('animationType').value=custom?'CUSTOM':r.animationType;refreshCustomOptions(custom);$('customEffectName').value=custom;$('speed').value=r.speed;$('intensity').value=r.intensity;$('enabled').value=String(r.enabled);$('sortOrder').value=String(r.sortOrder||0);refreshTarget((r.scopeType==='PROVIDER'||r.scopeType==='ASSET')?r.targetCode:r.targetId);preview();window.scrollTo({top:0,behavior:'smooth'})}
  function targetInfo(){const scope=$('scopeType').value,v=$('targetValue').value,opt=$('targetValue').selectedOptions[0];if(scope==='GLOBAL')return {targetName:'All'};if(!v)throw new Error('Please select a target');if(scope==='PROVIDER'||scope==='ASSET')return {targetCode:v,targetName:opt?opt.textContent:v};return {targetId:Number(v),targetName:opt?opt.textContent:v}}
  function animationTypeValue(){if($('animationType').value!=='CUSTOM')return $('animationType').value;const name=String($('customEffectName').value||'').trim().toUpperCase();if(!name)throw new Error('Please select a custom effect.');const fx=customEffects.find(x=>String(x.effectName||'').toUpperCase()===name);if(!fx)throw new Error('Selected custom effect no longer exists.');if(Number(fx.enabled)!==1)throw new Error('Selected custom effect is disabled. Enable it in Layout Section first.');return 'CUSTOM_'+name}
  $('applyTo').addEventListener('change',()=>{refreshScopeOptions();refreshTarget();});$('scopeType').addEventListener('change',()=>refreshTarget());['animationType','speed','intensity'].forEach(id=>$(id).addEventListener('change',preview));$('customEffectName').addEventListener('change',preview);$('resetEffect').addEventListener('click',reset);$('refreshEffect').addEventListener('click',()=>loadRules().catch(e=>setStatus(e.message,true)));
  $('effectForm').addEventListener('submit',async e=>{e.preventDefault();try{const payload=Object.assign({id:$('effectId').value?Number($('effectId').value):null,applyTo:$('applyTo').value,scopeType:$('scopeType').value,animationType:animationTypeValue(),speed:$('speed').value,intensity:$('intensity').value,enabled:Number($('enabled').value),sortOrder:Number($('sortOrder').value||0)},targetInfo());await json(base()+'/admin/animation-setting/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});setStatus('Animation rule saved successfully. On frontend refresh the latest rule is revalidated immediately; the previous cached rule is only used as an instant startup fallback.');await loadRules();reset()}catch(err){setStatus(err.message,true)}});
  $('effectList').addEventListener('click',async e=>{const editBtn=e.target.closest('[data-edit]'),delBtn=e.target.closest('[data-delete]');if(editBtn)return edit(editBtn.dataset.edit);if(delBtn){if(!(await BO_DIALOG.confirm('Delete this animation rule?',{title:'Delete Animation Rule',confirmText:'Delete',type:'danger'})))return;try{await json(base()+'/admin/animation-setting/delete?id='+encodeURIComponent(delBtn.dataset.delete),{method:'POST'});await loadRules();setStatus('Animation rule deleted. Refresh Naga and the original built-in behavior is restored after the latest rules are revalidated.')}catch(err){setStatus(err.message,true)}}});
  Promise.all([loadTargets(),loadRules(),loadCustomEffects()]).then(()=>{reset()}).catch(e=>setStatus(e.message,true));
})();
