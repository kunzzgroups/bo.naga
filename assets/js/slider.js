const SLIDER_API = {
  list: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_LIST,
  create: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_CREATE,
  update: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_UPDATE,
  delete: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SLIDER_DELETE
};

(function () {
  const $ = id => document.getElementById(id);
  const form = $('sliderForm');
  if (!form) return;

  const formTitle = $('sliderFormTitle'), sliderId = $('sliderId'), title = $('sliderTitle'), titleZh = $('sliderTitleZh');
  const linkUrl = $('sliderLinkUrl'), sortOrder = $('sliderSortOrder'), status = $('sliderStatus');
  const imageInput = $('sliderImage'), imageInputZh = $('sliderImageZh'), dropZone = $('sliderDropZone'), dropZoneZh = $('sliderDropZoneZh');
  const preview = $('sliderPreview'), previewZh = $('sliderPreviewZh'), uploadPlaceholder = $('sliderUploadPlaceholder'), uploadPlaceholderZh = $('sliderUploadPlaceholderZh');
  const currentImage = $('sliderCurrentImage'), currentImageZh = $('sliderCurrentImageZh'), statusBox = $('sliderStatusBox');
  const resetBtn = $('resetSliderBtn'), saveBtn = $('saveSliderBtn'), refreshBtn = $('refreshSliderBtn'), list = $('sliderList'), empty = $('sliderEmpty');
  const searchInput = $('bannerSearchInput'), statusFilter = $('bannerStatusFilter');
  const drawer = $('bannerDrawer'), drawerBackdrop = $('bannerDrawerBackdrop'), drawerClose = $('bannerDrawerClose');
  const drawerTitle = $('bannerDrawerTitle');

  let selectedFile = null, selectedFileZh = null, currentItems = [], filteredItems = [], selectedIndex = -1;

  function escapeHtml(v){return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
  function isActive(item){return Number(item.status)===1}
  function statusText(v){return Number(v)===1?'Active':'Inactive'}
  function resolveImageUrl(url, filename, fallbackUrl){
    if(url) return url; if(!filename) return ''; const v=String(filename).trim(); if(!v)return '';
    if(/^(https?:)?\/\//i.test(v)||v.startsWith('/')||v.startsWith('data:')||v.startsWith('blob:'))return v;
    if(fallbackUrl){const c=String(fallbackUrl).split('?')[0],i=c.lastIndexOf('/');if(i>=0)return c.substring(0,i+1)+v} return v;
  }
  function itemImage(item){return resolveImageUrl(item.imageUrl,item.image,'')}
  function setStatus(message,type){statusBox.textContent=message||'';statusBox.className='upload-status'+(type?' '+type:'')}
  function setBusy(v){saveBtn.disabled=v;refreshBtn.disabled=v;saveBtn.innerHTML=v?'<i class="bi bi-hourglass-split"></i> Saving...':'<i class="bi bi-save"></i> Save Banner'}
  function setPreview(img,placeholder,src){img.src=src||'';img.hidden=!src;placeholder.hidden=!!src}
  function clearPreview(){selectedFile=null;imageInput.value='';setPreview(preview,uploadPlaceholder,'')}
  function clearPreviewZh(){selectedFileZh=null;imageInputZh.value='';setPreview(previewZh,uploadPlaceholderZh,'')}
  function handleFile(file,zh){if(!file)return;if(!file.type||!file.type.startsWith('image/')){setStatus('Please choose image file only.','error');return}if(zh){selectedFileZh=file;setPreview(previewZh,uploadPlaceholderZh,URL.createObjectURL(file))}else{selectedFile=file;setPreview(preview,uploadPlaceholder,URL.createObjectURL(file))}setStatus('Image ready. Click Save Banner to upload.','success')}

  function resetForm(){
    sliderId.value='';title.value='';if(titleZh)titleZh.value='';linkUrl.value='';sortOrder.value='0';status.value='1';clearPreview();clearPreviewZh();
    currentImage.hidden=true;if(currentImageZh)currentImageZh.hidden=true;formTitle.textContent='Create Banner';setStatus('','');
  }
  function editItem(item){
    sliderId.value=item.id||'';title.value=item.title||'';if(titleZh)titleZh.value=item.titleZh||item.chineseTitle||'';linkUrl.value=item.linkUrl||'';sortOrder.value=item.sortOrder??0;status.value=String(item.status??1);
    selectedFile=null;selectedFileZh=null;imageInput.value='';if(imageInputZh)imageInputZh.value='';setPreview(preview,uploadPlaceholder,itemImage(item));
    if(previewZh)setPreview(previewZh,uploadPlaceholderZh,resolveImageUrl(item.imageUrlZh||item.chineseImageUrl,item.imageZh||item.chineseImage,itemImage(item)));
    currentImage.hidden=false;if(currentImageZh)currentImageZh.hidden=false;formTitle.textContent='Edit Banner #'+item.id;setStatus('Editing banner. Choose a new image only to replace it.','success');
    closeDrawer();
    if(window.CrudModalPattern) window.CrudModalPattern.open('Edit Banner');
  }
  function openCreate(){
    resetForm();
    closeDrawer();
    if(window.CrudModalPattern) window.CrudModalPattern.open('Create Banner');
  }

  function updateStats(){
    $('bannerTotalCount').textContent=currentItems.length;
    $('bannerActiveCount').textContent=currentItems.filter(isActive).length;
    $('bannerInactiveCount').textContent=currentItems.filter(x=>!isActive(x)).length;
  }

  function openDrawer(){
    if(!drawer) return;
    drawer.hidden=false;
    drawer.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>drawer.classList.add('is-open'));
    document.body.classList.add('banner-drawer-open');
    drawerClose?.focus({preventScroll:true});
  }
  function closeDrawer(){
    if(!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('banner-drawer-open');
    selectedIndex=-1;
    list.querySelectorAll('.banner-gallery-card.selected').forEach(el=>el.classList.remove('selected'));
    window.setTimeout(()=>{
      if(drawer.classList.contains('is-open')) return;
      drawer.hidden=true;
      drawer.setAttribute('aria-hidden','true');
    },220);
  }

  function fillDrawer(item){
    const src=itemImage(item);
    const img=$('bannerFeaturedImage'),fallback=$('bannerFeaturedFallback');
    img.src=src||'';img.hidden=!src;fallback.hidden=!!src;
    if(drawerTitle) drawerTitle.textContent=item.title||'Untitled Banner';
    $('bannerDetailName').textContent=item.title||'Untitled Banner';
    $('bannerDetailStatusText').textContent=statusText(item.status);
    $('bannerDetailSort').textContent=item.sortOrder??0;
    const pill=$('bannerDetailStatus');
    pill.textContent=statusText(item.status);
    pill.className='slider-pill '+(isActive(item)?'active':'inactive');
    const link=$('bannerDetailLink');
    if(item.linkUrl){link.textContent=item.linkUrl;link.href=item.linkUrl;link.classList.remove('disabled')}
    else{link.textContent='No link configured';link.href='#';link.classList.add('disabled')}
    $('bannerDetailUpdated').textContent=item.updatedAt||item.modifiedAt||item.createdAt||'-';
    $('bannerDetailUpdatedBy').textContent=item.updatedBy||'Super Admin';
  }

  function selectBanner(index, open){
    if(!filteredItems.length){closeDrawer();return}
    selectedIndex=(index+filteredItems.length)%filteredItems.length;
    const item=filteredItems[selectedIndex];
    list.querySelectorAll('.banner-gallery-card[data-select-index]').forEach(el=>{
      el.classList.toggle('selected', Number(el.dataset.selectIndex)===selectedIndex);
    });
    fillDrawer(item);
    if(open!==false) openDrawer();
  }

  function renderList(){
    list.innerHTML='';
    const hasItems=filteredItems.length>0;
    empty.hidden=hasItems;

    filteredItems.forEach((item,index)=>{
      const card=document.createElement('article');
      card.className='banner-gallery-card'+(index===selectedIndex?' selected':'');
      card.dataset.selectIndex=index;
      card.setAttribute('role','listitem');
      card.tabIndex=0;
      const src=itemImage(item);
      card.innerHTML=`
        <div class="banner-gallery-cover">
          ${src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(item.title||'Banner')}" loading="lazy">`:'<span class="banner-gallery-fallback"><i class="bi bi-image"></i></span>'}
          <b class="banner-order-badge">${escapeHtml(item.sortOrder??index+1)}</b>
          <span class="slider-pill ${isActive(item)?'active':'inactive'}">${statusText(item.status)}</span>
        </div>
        <div class="banner-gallery-meta">
          <strong>${escapeHtml(item.title||'Untitled Banner')}</strong>
          <small>Sort ${escapeHtml(item.sortOrder??0)}</small>
        </div>
        <button class="banner-more-btn" type="button" aria-label="Banner actions" data-menu-id="${escapeHtml(item.id)}"><i class="bi bi-three-dots-vertical"></i></button>
        <div class="banner-card-menu" data-menu-for="${escapeHtml(item.id)}">
          <button type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i>Edit</button>
          <button type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash3"></i>Delete</button>
        </div>`;
      list.appendChild(card);
    });

    const createCard=document.createElement('button');
    createCard.type='button';
    createCard.className='banner-gallery-card is-create';
    createCard.setAttribute('aria-label','Add Banner');
    createCard.innerHTML=`
      <span class="banner-create-mark"><i class="bi bi-plus-lg"></i></span>
      <strong>Add Banner</strong>
      <small>Upload a new hero slide</small>`;
    createCard.addEventListener('click',openCreate);
    list.appendChild(createCard);

    if(hasItems && selectedIndex>=0) selectBanner(Math.min(selectedIndex,filteredItems.length-1), drawer?.classList.contains('is-open'));
    else if(!hasItems) closeDrawer();
  }

  function applyFilters(){
    const q=(searchInput.value||'').trim().toLowerCase(),sv=statusFilter.value;
    filteredItems=currentItems.filter(item=>(sv==='all'||String(item.status)===sv)&&(!q||String(item.title||'').toLowerCase().includes(q)||String(item.linkUrl||'').toLowerCase().includes(q)));
    selectedIndex=-1;
    renderList();
  }

  async function loadSliders(){
    list.innerHTML='<div class="banner-gallery-loading"><i class="bi bi-hourglass-split"></i><b>Loading banners...</b></div>';
    empty.hidden=true;
    closeDrawer();
    try{
      const res=await fetch(SLIDER_API.list),json=await res.json().catch(()=>({}));
      if(!res.ok||json.status==='error')throw new Error(json.message||'Failed to load banners');
      currentItems=Array.isArray(json.data)?json.data:[];
      updateStats();
      applyFilters();
    }catch(err){
      currentItems=[];filteredItems=[];updateStats();
      list.innerHTML='';
      empty.hidden=false;
      empty.innerHTML=`<i class="bi bi-exclamation-triangle"></i><b>Unable to load banners</b><small>${escapeHtml(err.message||'Please check API URL / CORS.')}</small>`;
    }
  }

  async function saveSlider(e){
    e.preventDefault();
    const isUpdate=!!sliderId.value;
    if(!title.value.trim()){setStatus('Please enter title.','error');title.focus();return}
    if(!isUpdate&&!selectedFile){setStatus('Please choose banner image.','error');return}
    const fd=new FormData();
    if(isUpdate)fd.append('id',sliderId.value);
    fd.append('title',title.value.trim());
    if(titleZh)fd.append('titleZh',titleZh.value.trim());
    fd.append('linkUrl',linkUrl.value.trim());
    fd.append('sortOrder',sortOrder.value||'0');
    fd.append('status',status.value||'1');
    if(selectedFile)fd.append('image',selectedFile);
    if(selectedFileZh)fd.append('imageZh',selectedFileZh);
    setBusy(true);
    setStatus(isUpdate?'Updating banner...':'Creating banner...','');
    try{
      const res=await fetch(isUpdate?SLIDER_API.update:SLIDER_API.create,{method:'POST',body:fd}),json=await res.json().catch(()=>({}));
      if(!res.ok||json.status==='error')throw new Error(json.message||'Save failed');
      setStatus(json.message||'Banner saved successfully.','success');
      resetForm();
      await loadSliders();
    }catch(err){setStatus(err.message||'Save failed.','error')}
    finally{setBusy(false)}
  }

  async function deleteSlider(id){
    if(!(await BO_DIALOG.confirm('Delete this banner?', {title:'Delete Banner', confirmText:'Delete'})))return;
    const fd=new FormData();fd.append('id',id);
    try{
      const res=await fetch(SLIDER_API.delete,{method:'POST',body:fd}),json=await res.json().catch(()=>({}));
      if(!res.ok||json.status==='error')throw new Error(json.message||'Delete failed');
      setStatus(json.message||'Banner deleted.','success');
      if(sliderId.value===String(id))resetForm();
      await loadSliders();
    }catch(err){setStatus(err.message||'Delete failed.','error')}
  }

  imageInput.addEventListener('change',()=>handleFile(imageInput.files[0],false));
  if(imageInputZh)imageInputZh.addEventListener('change',()=>handleFile(imageInputZh.files[0],true));
  [[dropZone,false],[dropZoneZh,true]].forEach(([zone,zh])=>{
    if(!zone)return;
    ['dragenter','dragover'].forEach(evt=>zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.add('dragover')}));
    ['dragleave','drop'].forEach(evt=>zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.remove('dragover')}));
    zone.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0],zh));
  });

  form.addEventListener('submit',saveSlider);
  resetBtn.addEventListener('click',resetForm);
  refreshBtn.addEventListener('click',loadSliders);
  searchInput.addEventListener('input',applyFilters);
  statusFilter.addEventListener('change',applyFilters);
  $('bannerEditSelected')?.addEventListener('click',()=>filteredItems[selectedIndex]&&editItem(filteredItems[selectedIndex]));
  $('bannerDeleteSelected')?.addEventListener('click',()=>filteredItems[selectedIndex]&&deleteSlider(filteredItems[selectedIndex].id));
  drawerBackdrop?.addEventListener('click',closeDrawer);
  drawerClose?.addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && drawer?.classList.contains('is-open')) closeDrawer()});
  document.addEventListener('click',e=>{if(!e.target.closest('.banner-card-menu,.banner-more-btn'))document.querySelectorAll('.banner-card-menu.show').forEach(m=>m.classList.remove('show'))});

  list.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-id]'),del=e.target.closest('[data-delete-id]'),menu=e.target.closest('[data-menu-id]');
    if(edit){e.stopPropagation();const item=currentItems.find(x=>String(x.id)===String(edit.dataset.editId));if(item)editItem(item);return}
    if(del){e.stopPropagation();deleteSlider(del.dataset.deleteId);return}
    if(menu){
      e.stopPropagation();
      const m=list.querySelector(`[data-menu-for="${CSS.escape(menu.dataset.menuId)}"]`);
      document.querySelectorAll('.banner-card-menu.show').forEach(x=>{if(x!==m)x.classList.remove('show')});
      m&&m.classList.toggle('show');
      return;
    }
    const card=e.target.closest('[data-select-index]');
    if(card) selectBanner(Number(card.dataset.selectIndex), true);
  });
  list.addEventListener('keydown',e=>{
    const card=e.target.closest('[data-select-index]');
    if(!card) return;
    if(e.key==='Enter' || e.key===' '){e.preventDefault();selectBanner(Number(card.dataset.selectIndex), true)}
  });

  loadSliders();
})();
