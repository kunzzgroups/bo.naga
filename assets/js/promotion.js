(function(){
  const form=document.getElementById('promoForm');
  if(!form)return;
  const $=id=>document.getElementById(id);
  const box=$('promoStatusBox'), list=$('promoList'), empty=$('promoEmpty');
  const searchInput=$('promoSearchInput'), categoryFilter=$('promoCategoryFilter'), statusFilter=$('promoStatusFilter'), sortFilter=$('promoSortFilter');
  const totalCount=$('promoTotalCount'), activeCount=$('promoActiveCount'), activePercent=$('promoActivePercent'), showingText=$('promoShowingText');
  let rows=[];
  let categoryTitles=[];
  let selectedPromoImage=null;
  let detailHtmlMode=false;

  function promoApi(k){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[k]; }
  function val(id){const el=$(id); const v=el?el.value:''; return v===''?null:v;}
  function num(id){const v=val(id);return v===null?null:Number(v);}
  function set(m,t){box.textContent=m||'';box.className='upload-status '+(t||'');}
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function money(v){return v==null||v===''?'-':Number(v).toFixed(2)}
  function showImagePreview(src){ const img=$('promoImagePreview'), cur=$('promoImageCurrent'); if(img&&src){img.src=src;img.hidden=false;} if(cur)cur.textContent=src?'Current/selected image preview':''; }
  function clearImagePreview(){ selectedPromoImage=null; const input=$('promoImage'); if(input) input.value=''; const img=$('promoImagePreview'); if(img){img.src='';img.hidden=true;} const cur=$('promoImageCurrent'); if(cur)cur.textContent=''; }
  function categoryName(id){ const f=categoryTitles.find(x=>String(x.id)===String(id)); return f?f.name:''; }
  async function loadCategoryTitles(){ try{ const j=await req(promoApi('BONUS_CATEGORY_TITLE_LIST')+'?page=1&size=300'); categoryTitles=Array.isArray(j.data)?j.data:[]; const options=categoryTitles.map(x=>`<option value="${esc(x.id)}">${esc(x.name||('Title #'+x.id))}</option>`).join(''); const sel=$('promoBonusCategoryTitleId'); if(sel) sel.innerHTML='<option value="">Select bonus category title</option>'+options; if(categoryFilter) categoryFilter.innerHTML='<option value="">All Categories</option>'+options; }catch(e){ console.warn('Load bonus category title failed',e); } }

  function initDetailEditor(){
    const textarea=$('promoDetailText');
    const editor=$('promoDetailEditor');
    const toolbar=$('promoDetailToolbar');
    if(!textarea||!editor||!toolbar)return;

    function syncToTextarea(){
      textarea.value = detailHtmlMode ? editor.textContent : editor.innerHTML;
    }
    function setEditorContent(html){
      textarea.value = html || '';
      if(detailHtmlMode){ editor.textContent = html || ''; }
      else { editor.innerHTML = html || ''; }
    }
    function exec(cmd,value=null){
      if(detailHtmlMode && cmd!=='toggleHtml') return;
      editor.focus();
      document.execCommand(cmd,false,value);
      syncToTextarea();
    }

    toolbar.addEventListener('click',e=>{
      const btn=e.target.closest('[data-cmd]');
      if(!btn)return;
      e.preventDefault();
      const cmd=btn.dataset.cmd;
      if(cmd==='formatBlock') exec('formatBlock',btn.dataset.value||'P');
      else if(cmd==='insertCheck') exec('insertHTML','<p>✅ Type requirement here</p>');
      else if(cmd==='insertCross') exec('insertHTML','<p>❌ Type restriction here</p>');
      else if(cmd==='insertHr') exec('insertHTML','<hr>');
      else if(cmd==='clear') exec('removeFormat');
      else if(cmd==='toggleHtml'){
        detailHtmlMode=!detailHtmlMode;
        btn.classList.toggle('active',detailHtmlMode);
        btn.textContent=detailHtmlMode?'Preview Mode':'HTML Mode';
        if(detailHtmlMode){ editor.textContent=textarea.value||editor.innerHTML; editor.classList.add('html-mode'); }
        else { editor.innerHTML=editor.textContent||textarea.value; editor.classList.remove('html-mode'); }
        syncToTextarea();
      } else exec(cmd);
    });
    editor.addEventListener('input',syncToTextarea);
    textarea._setEditorContent=setEditorContent;
    textarea._syncEditor=syncToTextarea;
    setEditorContent(textarea.value||'');
  }

  function syncEditor(){ const t=$('promoDetailText'); if(t&&t._syncEditor)t._syncEditor(); }
  function setDetailEditorContent(html){ const t=$('promoDetailText'); if(t&&t._setEditorContent)t._setEditorContent(html||''); else if(t)t.value=html||''; }

  function payload(){
    syncEditor();
    const fd=new FormData();
    const id=num('promoId'); if(id!=null) fd.append('id',id);
    const name=val('promoItemName') || val('promoName');
    const fields={
      name:name,
      bonusCategoryTitleId:num('promoBonusCategoryTitleId'),
      linkUrl:val('promoLinkUrl'),
      desktopColumns:num('promoDesktopColumns'),
      mobileColumns:num('promoMobileColumns'),
      desktopSpan:num('promoDesktopSpan'),
      mobileSpan:num('promoMobileSpan'),
      singleLeft:num('promoSingleLeft'),
      bonusType:val('promoBonusType'),claimCondition:val('promoClaimCondition'),bonusPercentage:num('promoPercentage'),bonusFixedAmount:num('promoFixed'),bonusRandomMin:num('promoRandomMin'),bonusRandomMax:num('promoRandomMax'),maxPayout:num('promoMaxPayout'),minTopupAmount:num('promoMinTopup'),maxTopupAmount:num('promoMaxTopup'),minTimesOfTopup:num('promoMinTimes'),claimLimit:num('promoClaimLimit'),claimReset:val('promoClaimReset'),rollover:num('promoRollover'),turnover:num('promoTurnover'),maxWithdraw:num('promoMaxWithdraw'),description:val('promoDescription'),detailText:val('promoDetailText'),displayAmount:num('promoDisplayAmount'),freeCreditWallet:val('promoWallet'),allowedGames:val('promoAllowedGames'),displayOrder:num('promoDisplayOrder'),status:num('promoStatus')
    };
    Object.entries(fields).forEach(([k,v])=>{ if(v!==null && v!==undefined) fd.append(k,v); });
    if(selectedPromoImage) fd.append('image', selectedPromoImage);
    return fd;
  }

  function reset(){
    form.reset();
    $('promoId').value='';
    if($('promoBonusCategoryTitleId')) $('promoBonusCategoryTitleId').value='';
    clearImagePreview();
    $('promoClaimLimit').value='1';
    $('promoDisplayOrder').value='0';
    setDetailEditorContent('');
    $('promoFormTitle').textContent='Create Promotion';
    set('','');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function fill(x){
    $('promoId').value=x.id||'';
    $('promoName').value=x.name||'';
    if($('promoItemName')) $('promoItemName').value=x.name||'';
    if($('promoBonusCategoryTitleId')) $('promoBonusCategoryTitleId').value=x.bonusCategoryTitleId||'';
    if($('promoLinkUrl')) $('promoLinkUrl').value=x.linkUrl||'';
    if($('promoDesktopColumns')) $('promoDesktopColumns').value=String(x.desktopColumns||2);
    if($('promoMobileColumns')) $('promoMobileColumns').value=String(x.mobileColumns||1);
    if($('promoDesktopSpan')) $('promoDesktopSpan').value=String(x.desktopSpan||1);
    if($('promoMobileSpan')) $('promoMobileSpan').value=String(x.mobileSpan||1);
    if($('promoSingleLeft')) $('promoSingleLeft').value=String(x.singleLeft||0);
    clearImagePreview();
    if(x.bonusImageUrl) showImagePreview(x.bonusImageUrl);
    $('promoBonusType').value=x.bonusType||'FIXED';
    $('promoClaimCondition').value=x.claimCondition||'MANUAL';
    $('promoPercentage').value=x.bonusPercentage??'';
    $('promoFixed').value=x.bonusFixedAmount??'';
    $('promoRandomMin').value=x.bonusRandomMin??'';
    $('promoRandomMax').value=x.bonusRandomMax??'';
    $('promoMaxPayout').value=x.maxPayout??'';
    $('promoMinTopup').value=x.minTopupAmount??'';
    $('promoMaxTopup').value=x.maxTopupAmount??'';
    $('promoMinTimes').value=x.minTimesOfTopup??'';
    $('promoClaimLimit').value=x.claimLimit??1;
    $('promoClaimReset').value=x.claimReset||'NONE';
    $('promoRollover').value=x.rollover??'';
    $('promoTurnover').value=x.turnover??'';
    $('promoMaxWithdraw').value=x.maxWithdraw??'';
    $('promoDescription').value=x.description||'';
    setDetailEditorContent(x.detailText||'');
    $('promoDisplayAmount').value=String(x.displayAmount??1);
    $('promoWallet').value=x.freeCreditWallet||'MAIN_WALLET';
    $('promoAllowedGames').value=x.allowedGames||'';
    $('promoDisplayOrder').value=x.displayOrder??0;
    $('promoStatus').value=String(x.status??1);
    $('promoFormTitle').textContent='Edit Promotion #'+x.id;
    set('Editing promotion. Save to update.','success');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function filteredRows(){
    const q=(searchInput?.value||'').trim().toLowerCase();
    const cat=categoryFilter?.value||'';
    const status=statusFilter?.value||'';
    const mode=sortFilter?.value||'orderAsc';
    const result=rows.filter(x=>{
      const name=String(x.name||'').toLowerCase();
      const cname=String(x.bonusCategoryTitleName||categoryName(x.bonusCategoryTitleId)||'').toLowerCase();
      return (!q || name.includes(q) || cname.includes(q)) && (!cat || String(x.bonusCategoryTitleId)===cat) && (!status || String(x.status)===status);
    });
    result.sort((a,b)=>{
      if(mode==='orderDesc') return Number(b.displayOrder||0)-Number(a.displayOrder||0);
      if(mode==='nameAsc') return String(a.name||'').localeCompare(String(b.name||''));
      if(mode==='nameDesc') return String(b.name||'').localeCompare(String(a.name||''));
      return Number(a.displayOrder||0)-Number(b.displayOrder||0);
    });
    return result;
  }

  function render(){
    const filtered=filteredRows();
    list.innerHTML='';
    empty.hidden=filtered.length>0;
    const active=rows.filter(x=>Number(x.status)===1).length;
    if(totalCount) totalCount.textContent=rows.length;
    if(activeCount) activeCount.textContent=active;
    if(activePercent) activePercent.textContent=(rows.length?Math.round(active*100/rows.length):0)+'% of total';
    if(showingText) showingText.textContent=`Showing ${filtered.length} of ${rows.length} entries`;
    filtered.forEach(x=>{
      const d=document.createElement('div');
      d.className='promotion-table-row';
      const category=x.bonusCategoryTitleName||categoryName(x.bonusCategoryTitleId)||'No Category';
      const desc=(x.description||x.detailText||'').replace(/<[^>]*>/g,'').slice(0,120);
      d.innerHTML=`
        <div class="promotion-main-cell">
          <div class="promotion-thumb">${x.bonusImageUrl?`<img src="${esc(x.bonusImageUrl)}" alt="${esc(x.name||'Promotion')}">`:'<i class="bi bi-image"></i>'}</div>
          <div class="promotion-copy"><b>${esc(x.name||'-')}</b><small>${esc(category)} <span>•</span> Order: ${esc(x.displayOrder??0)}</small><p>${esc(desc||x.ruleText||'No description')}</p></div>
        </div>
        <div class="promotion-detail-cell"><span class="promo-chip">${esc(x.claimCondition||'MANUAL')}</span><span class="promo-chip">${esc(x.bonusType||'FIXED')}</span><small>Fixed ${money(x.bonusFixedAmount)} / ${money(x.bonusPercentage)}%</small></div>
        <div class="promotion-status-cell"><span class="slider-pill ${Number(x.status)===1?'active':'inactive'}"><i class="bi ${Number(x.status)===1?'bi-check-circle':'bi-pause-circle'}"></i>${Number(x.status)===1?'Active':'Inactive'}</span></div>
        <div class="promotion-action-cell"><button class="icon-action-btn edit edit-btn" title="Edit" aria-label="Edit" data-edit="${x.id}"><i class="bi bi-pencil-square"></i></button><button class="icon-action-btn delete btn-delete" title="Delete" aria-label="Delete" data-del="${x.id}"><i class="bi bi-trash"></i></button></div>`;
      list.appendChild(d);
    });
  }

  async function req(url,opt){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  async function load(){set('Loading...','');const j=await req(promoApi('PROMOTION_LIST'));rows=Array.isArray(j.data)?j.data:[];render();set('','');}

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      if(!val('promoName'))throw new Error('Name is required');
      set('Saving...','');
      await req(promoApi('PROMOTION_SAVE_FORM'),{method:'POST',body:payload()});
      set('Saved successfully','success');
      reset();
      load();
    }catch(err){set(err.message,'error');}
  });
  $('promoResetBtn').onclick=reset;
  $('promoRefreshBtn').onclick=load;
  $('applyPromoFilters').onclick=render;
  $('resetPromoFilters').onclick=()=>{ if(searchInput)searchInput.value=''; if(categoryFilter)categoryFilter.value=''; if(statusFilter)statusFilter.value=''; if(sortFilter)sortFilter.value='orderAsc'; render(); };
  searchInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();render();}});
  list.addEventListener('click',async e=>{
    const eb=e.target.closest('[data-edit]'),db=e.target.closest('[data-del]');
    if(eb){fill(rows.find(x=>String(x.id)===eb.dataset.edit)||{});}
    if(db&&await BO_DIALOG.confirm('Delete this promotion?', {title:'Delete Promotion', confirmText:'Delete'})){await req(promoApi('PROMOTION_DELETE'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:Number(db.dataset.del)})});load();}
  });

  const promoImageInput=$('promoImage');
  if(promoImageInput){ promoImageInput.addEventListener('change',()=>{ const f=promoImageInput.files&&promoImageInput.files[0]; selectedPromoImage=f||null; if(f) showImagePreview(URL.createObjectURL(f)); }); }
  initDetailEditor();
  loadCategoryTitles().then(()=>load()).catch(e=>set(e.message,'error'));
})();
