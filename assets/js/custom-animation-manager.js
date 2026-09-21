(function(){
  'use strict';
  const base=()=>window.API_CONFIG&&API_CONFIG.BASE_URL?API_CONFIG.BASE_URL:'';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={active:false,effects:[],editing:null,standalone:false};
  let root,codeGrid,saveBtn,reloadBtn,statusBox;
  const MARKUP=`
<div class="cam-studio">
  <section class="cam-editor" aria-labelledby="camTitle">
    <header class="cam-editor-head">
      <div class="cam-editor-copy">
        <h3 id="camTitle">New effect</h3>
        <p class="cam-lede">Name it once. Rules pick it up automatically.</p>
      </div>
    </header>

    <input type="hidden" id="camId">

    <div class="cam-identity">
      <label class="cam-field cam-field--name">
        <span>Name</span>
        <input id="camName" maxlength="60" placeholder="ROBOT_HOVER" autocomplete="off" spellcheck="false">
      </label>
      <label class="cam-field">
        <span>Status</span>
        <select id="camEnabled"><option value="1">Enabled</option><option value="0">Disabled</option></select>
      </label>
      <label class="cam-field cam-field--order">
        <span>Order</span>
        <input id="camOrder" type="number" min="0" value="0">
      </label>
    </div>

    <p class="cam-tip"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i><span>Write <code class="cam-help-code">:effect</code> in CSS — mapped to this name. In JS use <code class="cam-help-code">{{EFFECT_NAME}}</code>.</span></p>

    <div class="cam-code-stack">
      <div class="cam-code-pane cam-code-pane--css">
        <div class="cam-code-chrome">
          <span class="cam-code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="cam-code-label"><i class="bi bi-filetype-css" aria-hidden="true"></i> effect.css</span>
        </div>
        <label class="cam-field cam-field--code">
          <span class="visually-hidden">CSS</span>
          <textarea id="camCss" spellcheck="false"></textarea>
        </label>
      </div>
      <div class="cam-code-pane cam-code-pane--js">
        <div class="cam-code-chrome">
          <span class="cam-code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="cam-code-label"><i class="bi bi-filetype-js" aria-hidden="true"></i> effect.js <em>optional</em></span>
        </div>
        <label class="cam-field cam-field--code cam-field--js">
          <span class="visually-hidden">Optional JS</span>
          <textarea id="camJs" spellcheck="false"></textarea>
        </label>
      </div>
    </div>

    <footer class="cam-dock">
      <div class="cam-dock-stage" aria-label="Preview">
        <div class="cam-preview">
          <div class="cam-preview-box" id="camPreview">TITANX</div>
        </div>
        <ul class="cam-hints">
          <li>transform / opacity</li>
          <li>no layout thrash</li>
          <li>pauses off-screen</li>
        </ul>
      </div>
      <div class="cam-dock-actions">
        <div class="cam-status" id="camStatus" role="status" aria-live="polite"></div>
        <div class="cam-actions">
          <button class="clean-btn" id="camReset" type="button"><i class="bi bi-plus-lg"></i> New</button>
          <button class="clean-btn primary" id="camSave" type="button"><i class="bi bi-save"></i> Save effect</button>
        </div>
      </div>
    </footer>
  </section>

  <section class="cam-library" aria-labelledby="camLibTitle">
    <header class="cam-library-head">
      <div>
        <h3 id="camLibTitle">Library <span class="cam-count" id="camCount" hidden>0</span></h3>
        <p class="cam-lede">Tap a row to edit. Enabled names appear under Custom in Create Rule.</p>
      </div>
      <button class="clean-btn" id="camRefresh" type="button"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
    </header>
    <div class="cam-library-scroll">
      <div class="cam-rows" id="camList" role="list"></div>
      <div class="cam-empty" id="camEmpty" hidden>
        <i class="bi bi-stars" aria-hidden="true"></i>
        <b>No custom effects yet</b>
        <span>Save one on the left. It will appear here and in Create Rule.</span>
      </div>
    </div>
  </section>
</div>`;
  async function json(url,opt){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||('HTTP '+r.status));return j}
  function dataOf(j){return Array.isArray(j&&j.data)?j.data:[]}
  function templateCss(name){return `/* ${name||'ROBOT_HOVER'}\n   :effect links automatically to this name.\n   Keep movement on transform / opacity. */\n:effect {\n  --naga-custom-animation: titanRobotHover 2.2s ease-in-out infinite;\n}\n\n@keyframes titanRobotHover {\n  0%, 100% { transform: translate3d(0, 0, 0); }\n  50% { transform: translate3d(0, -7px, 0); }\n}`}
  function templateJs(){return `/* Optional. CSS-only is faster.\n   {{EFFECT_NAME}} is replaced with this effect name. */\n// window.NAGA_ANIMATION_EFFECTS.register('{{EFFECT_NAME}}', {\n//   onApply: function (element, rule) {},\n//   onRemove: function (element) {}\n// });`}
  function setStatus(msg,bad){if(!statusBox)return;statusBox.textContent=msg||'';statusBox.className='cam-status '+(bad?'bad':'ok')}
  function buildRoot(active){
    root=document.createElement('div');
    root.className='custom-animation-manager'+(active?' is-active':'');
    root.id='customAnimationManager';
    root.innerHTML=MARKUP;
    statusBox=root.querySelector('#camStatus');
  }
  function mountStandalone(host){
    state.standalone=true;
    buildRoot(false);
    host.appendChild(root);
    bindCore();
    reset();
  }
  function mountLayout(){
    codeGrid=document.getElementById('layoutCodeGrid');
    saveBtn=document.getElementById('saveSectionBtn');
    reloadBtn=document.getElementById('reloadSectionBtn');
    if(!codeGrid||!saveBtn||!reloadBtn)return;
    state.standalone=false;
    buildRoot(false);
    codeGrid.insertAdjacentElement('afterend',root);
    bindCore();
    bindLayout();
    reset();
  }
  function bindCore(){
    root.querySelector('#camSave').addEventListener('click',save);
    root.querySelector('#camReset').addEventListener('click',reset);
    root.querySelector('#camRefresh').addEventListener('click',()=>load().catch(e=>setStatus(e.message,true)));
    root.querySelector('#camList').addEventListener('click',async e=>{
      const row=e.target.closest('[data-cam-edit]');
      const db=e.target.closest('[data-cam-delete]');
      if(db){
        e.stopPropagation();
        const ok=window.BO_DIALOG&&BO_DIALOG.confirm
          ?await BO_DIALOG.confirm('Delete this custom effect? Rules using it will stop applying that effect.',{title:'Delete effect',confirmText:'Delete',type:'danger'})
          :window.confirm('Delete this custom effect?');
        if(!ok)return;
        try{await json(base()+'/admin/custom-animation-effect/delete?id='+encodeURIComponent(db.dataset.camDelete),{method:'POST'});await load();reset();setStatus('Effect deleted.');notifyChanged()}catch(err){setStatus(err.message,true)}
        return;
      }
      if(row)return edit(row.dataset.camEdit);
    });
    root.querySelector('#camList').addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const row=e.target.closest('.cam-row-card');
      if(!row||e.target.closest('button'))return;
      e.preventDefault();
      edit(row.dataset.camEdit);
    });
  }
  function bindLayout(){
    document.addEventListener('click',e=>{const b=e.target.closest('.layout-section-item[data-section]');if(!b)return;setActive(b.dataset.section==='animation-custom-effects')},true);
    saveBtn.addEventListener('click',e=>{if(!state.active)return;e.preventDefault();e.stopImmediatePropagation();save()},true);
    reloadBtn.addEventListener('click',e=>{if(!state.active)return;e.preventDefault();e.stopImmediatePropagation();load().then(reset).catch(err=>setStatus(err.message,true))},true);
  }
  function setActive(on){
    state.active=!!on;
    if(!root)return;
    root.classList.toggle('is-active',state.active);
    if(codeGrid)codeGrid.style.display=state.active?'none':'';
    if(state.active){
      load().catch(e=>setStatus(e.message,true));
      if(!state.standalone){
        const n=document.getElementById('currentSectionName'),k=document.getElementById('currentSectionKey');
        if(n)n.textContent='Custom Animation Effects';
        if(k)k.textContent='animation-custom-effects';
      }
    }
  }
  function reset(){
    if(!root)return;
    state.editing=null;
    const id=root.querySelector('#camId'),name=root.querySelector('#camName'),css=root.querySelector('#camCss'),js=root.querySelector('#camJs');
    id.value='';name.value='ROBOT_HOVER';root.querySelector('#camEnabled').value='1';root.querySelector('#camOrder').value='0';
    css.value=templateCss('ROBOT_HOVER');js.value=templateJs();
    root.querySelector('#camTitle').textContent='New effect';
    root.classList.remove('is-editing');
    setStatus('');
    render();
  }
  function fmtSize(n){
    n=Number(n)||0;
    if(n>=1000)return (n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,'')+'k';
    return String(n);
  }
  function render(){
    const body=root.querySelector('#camList'),empty=root.querySelector('#camEmpty'),count=root.querySelector('#camCount');
    const n=state.effects.length;
    empty.hidden=n>0;
    if(count){count.textContent=String(n);count.hidden=n===0}
    const editingId=String(state.editing||'');
    body.innerHTML=state.effects.map(x=>{
      const on=Number(x.enabled)===1;
      const active=editingId&&String(x.id)===editingId;
      const cssLen=String(x.cssCode||'').length;
      const jsLen=String(x.jsCode||'').trim().length;
      return (
        '<article class="cam-row-card'+(active?' is-editing':'')+(on?' is-on':' is-off')+'" role="listitem" data-cam-edit="'+x.id+'" tabindex="0" aria-label="'+esc(x.effectName)+'">'+
          '<div class="cam-row-main">'+
            '<b class="cam-row-name">'+esc(x.effectName)+'</b>'+
            '<span class="cam-badge '+(on?'':'off')+'">'+(on?'Enabled':'Disabled')+'</span>'+
          '</div>'+
          '<div class="cam-row-meta">'+
            '<span class="cam-chip">CSS '+fmtSize(cssLen)+'</span>'+
            '<span class="cam-chip">'+(jsLen?'JS '+fmtSize(jsLen):'CSS only')+'</span>'+
            '<span class="cam-chip">#'+Number(x.sortOrder||0)+'</span>'+
          '</div>'+
          '<div class="cam-row-actions">'+
            '<button type="button" class="cam-icon-btn" data-cam-edit="'+x.id+'" title="Edit" aria-label="Edit"><i class="bi bi-pencil"></i></button>'+
            '<button type="button" class="cam-icon-btn cam-icon-btn--danger" data-cam-delete="'+x.id+'" title="Delete" aria-label="Delete"><i class="bi bi-trash"></i></button>'+
          '</div>'+
        '</article>'
      );
    }).join('');
  }
  async function load(){const j=await json(base()+'/admin/custom-animation-effect/list');state.effects=dataOf(j);render();return state.effects}
  function edit(id){
    const x=state.effects.find(v=>String(v.id)===String(id));if(!x)return;
    state.editing=x.id;
    root.querySelector('#camId').value=x.id;
    root.querySelector('#camName').value=x.effectName||'';
    root.querySelector('#camEnabled').value=String(x.enabled);
    root.querySelector('#camOrder').value=String(x.sortOrder||0);
    root.querySelector('#camCss').value=x.cssCode||'';
    root.querySelector('#camJs').value=x.jsCode||'';
    root.querySelector('#camTitle').textContent='Edit · '+x.effectName;
    root.classList.add('is-editing');
    render();
    const editor=root.querySelector('.cam-editor');
    if(editor)editor.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function notifyChanged(){
    try{document.dispatchEvent(new CustomEvent('bo:custom-animation-changed'))}catch(_){}
  }
  async function save(){
    try{
      const name=String(root.querySelector('#camName').value||'').trim().toUpperCase();
      if(!/^[A-Z0-9][A-Z0-9_-]{0,59}$/.test(name))throw new Error('Name must use A–Z, 0–9, _ or -.');
      const payload={id:root.querySelector('#camId').value?Number(root.querySelector('#camId').value):null,effectName:name,cssCode:root.querySelector('#camCss').value||'',jsCode:root.querySelector('#camJs').value||'',enabled:Number(root.querySelector('#camEnabled').value),sortOrder:Number(root.querySelector('#camOrder').value||0)};
      await json(base()+'/admin/custom-animation-effect/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      await load();
      const saved=state.effects.find(x=>String(x.effectName||'').toUpperCase()===name);
      if(saved){
        state.editing=saved.id;
        root.querySelector('#camId').value=saved.id;
        root.querySelector('#camTitle').textContent='Edit · '+saved.effectName;
        root.classList.add('is-editing');
        render();
      }else{
        state.editing=null;
        root.classList.remove('is-editing');
        root.querySelector('#camTitle').textContent='New effect';
        root.querySelector('#camId').value='';
      }
      setStatus('Saved. Available in Create Rule → Custom.');
      notifyChanged();
    }catch(err){setStatus(err.message,true)}
  }
  window.CustomAnimationManager={
    setActive,
    load:()=>root?load():Promise.resolve([]),
    refreshOptions:()=>root?load():Promise.resolve([])
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const host=document.getElementById('customAnimationHost');
    if(host){
      mountStandalone(host);
      return;
    }
    mountLayout();
    const q=new URLSearchParams(location.search).get('section');
    if(q==='animation-custom-effects'){
      const b=document.querySelector('.layout-section-item[data-section="animation-custom-effects"]');
      if(b)b.click();
      else setActive(true);
    }
  });
})();
