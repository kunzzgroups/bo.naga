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
  const workspace = $('bannerWorkspace'), stripWrap = $('bannerStripWrap'), searchInput = $('bannerSearchInput'), statusFilter = $('bannerStatusFilter');

  let selectedFile = null, selectedFileZh = null, currentItems = [], filteredItems = [], selectedIndex = 0;

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
    if(window.CrudModalPattern) window.CrudModalPattern.open('Edit Banner');
  }

  function updateStats(){
    $('bannerTotalCount').textContent=currentItems.length;
    $('bannerActiveCount').textContent=currentItems.filter(isActive).length;
    $('bannerInactiveCount').textContent=currentItems.filter(x=>!isActive(x)).length;
  }

  function selectBanner(index){
    if(!filteredItems.length)return; selectedIndex=(index+filteredItems.length)%filteredItems.length; const item=filteredItems[selectedIndex],src=itemImage(item);
    const img=$('bannerFeaturedImage'),fallback=$('bannerFeaturedFallback'); img.src=src||'';img.hidden=!src;fallback.hidden=!!src;
    $('bannerDetailName').textContent=item.title||'Untitled Banner'; $('bannerDetailStatusText').textContent=statusText(item.status); $('bannerDetailSort').textContent=item.sortOrder??0;
    const pill=$('bannerDetailStatus');pill.textContent=statusText(item.status);pill.className='slider-pill '+(isActive(item)?'active':'inactive');
    const link=$('bannerDetailLink'); if(item.linkUrl){link.textContent=item.linkUrl;link.href=item.linkUrl;link.classList.remove('disabled')}else{link.textContent='No link configured';link.href='#';link.classList.add('disabled')}
    $('bannerDetailUpdated').textContent=item.updatedAt||item.modifiedAt||item.createdAt||'-'; $('bannerDetailUpdatedBy').textContent=item.updatedBy||'Super Admin';
    list.querySelectorAll('.banner-thumb-card').forEach((el,i)=>el.classList.toggle('selected',i===selectedIndex));
    $('bannerDots').innerHTML=filteredItems.map((_,i)=>`<button type="button" class="${i===selectedIndex?'active':''}" data-dot-index="${i}" aria-label="Go to banner ${i+1}"></button>`).join('');
    const selected=list.children[selectedIndex];if(selected)selected.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }

  function renderList(){
    list.innerHTML=''; empty.hidden=filteredItems.length>0; workspace.hidden=!filteredItems.length; stripWrap.hidden=!filteredItems.length;
    filteredItems.forEach((item,index)=>{
      const card=document.createElement('article');card.className='banner-thumb-card'+(index===selectedIndex?' selected':'');card.dataset.selectIndex=index;
      const src=itemImage(item);card.innerHTML=`
        <div class="banner-thumb-image">${src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(item.title||'Banner')}">`:'<span><i class="bi bi-image"></i></span>'}<b class="banner-order-badge">${escapeHtml(item.sortOrder??index+1)}</b><span class="slider-pill ${isActive(item)?'active':'inactive'}">${statusText(item.status)}</span></div>
        <div class="banner-thumb-copy"><strong>${escapeHtml(item.title||'Untitled Banner')}</strong><small>Sort Order: ${escapeHtml(item.sortOrder??0)}</small></div>
        <button class="banner-more-btn" type="button" aria-label="Banner actions" data-menu-id="${escapeHtml(item.id)}"><i class="bi bi-three-dots-vertical"></i></button>
        <div class="banner-card-menu" data-menu-for="${escapeHtml(item.id)}"><button type="button" data-edit-id="${escapeHtml(item.id)}"><i class="bi bi-pencil-square"></i>Edit</button><button type="button" data-delete-id="${escapeHtml(item.id)}"><i class="bi bi-trash3"></i>Delete</button></div>`;
      list.appendChild(card);
    });
    if(filteredItems.length)selectBanner(Math.min(selectedIndex,filteredItems.length-1));
  }

  function applyFilters(){
    const q=(searchInput.value||'').trim().toLowerCase(),sv=statusFilter.value;
    filteredItems=currentItems.filter(item=>(sv==='all'||String(item.status)===sv)&&(!q||String(item.title||'').toLowerCase().includes(q)||String(item.linkUrl||'').toLowerCase().includes(q)));
    selectedIndex=0;renderList();
  }

  async function loadSliders(){
    list.innerHTML='<div class="slider-empty"><i class="bi bi-hourglass-split"></i><b>Loading banners...</b></div>';empty.hidden=true;workspace.hidden=true;stripWrap.hidden=false;
    try{const res=await fetch(SLIDER_API.list),json=await res.json().catch(()=>({}));if(!res.ok||json.status==='error')throw new Error(json.message||'Failed to load banners');currentItems=Array.isArray(json.data)?json.data:[];updateStats();applyFilters()}
    catch(err){currentItems=[];filteredItems=[];updateStats();list.innerHTML='';stripWrap.hidden=true;workspace.hidden=true;empty.hidden=false;empty.innerHTML=`<i class="bi bi-exclamation-triangle"></i><b>Unable to load banners</b><small>${escapeHtml(err.message||'Please check API URL / CORS.')}</small>`}
  }

  async function saveSlider(e){
    e.preventDefault();const isUpdate=!!sliderId.value;if(!title.value.trim()){setStatus('Please enter title.','error');title.focus();return}if(!isUpdate&&!selectedFile){setStatus('Please choose banner image.','error');return}
    const fd=new FormData();if(isUpdate)fd.append('id',sliderId.value);fd.append('title',title.value.trim());if(titleZh)fd.append('titleZh',titleZh.value.trim());fd.append('linkUrl',linkUrl.value.trim());fd.append('sortOrder',sortOrder.value||'0');fd.append('status',status.value||'1');if(selectedFile)fd.append('image',selectedFile);if(selectedFileZh)fd.append('imageZh',selectedFileZh);
    setBusy(true);setStatus(isUpdate?'Updating banner...':'Creating banner...','');try{const res=await fetch(isUpdate?SLIDER_API.update:SLIDER_API.create,{method:'POST',body:fd}),json=await res.json().catch(()=>({}));if(!res.ok||json.status==='error')throw new Error(json.message||'Save failed');setStatus(json.message||'Banner saved successfully.','success');resetForm();await loadSliders()}catch(err){setStatus(err.message||'Save failed.','error')}finally{setBusy(false)}
  }
  async function deleteSlider(id){if(!confirm('Delete this banner?'))return;const fd=new FormData();fd.append('id',id);try{const res=await fetch(SLIDER_API.delete,{method:'POST',body:fd}),json=await res.json().catch(()=>({}));if(!res.ok||json.status==='error')throw new Error(json.message||'Delete failed');setStatus(json.message||'Banner deleted.','success');if(sliderId.value===String(id))resetForm();await loadSliders()}catch(err){setStatus(err.message||'Delete failed.','error')}}

  imageInput.addEventListener('change',()=>handleFile(imageInput.files[0],false)); if(imageInputZh)imageInputZh.addEventListener('change',()=>handleFile(imageInputZh.files[0],true));
  [[dropZone,false],[dropZoneZh,true]].forEach(([zone,zh])=>{if(!zone)return;['dragenter','dragover'].forEach(evt=>zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.add('dragover')}));['dragleave','drop'].forEach(evt=>zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.remove('dragover')}));zone.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0],zh))});
  form.addEventListener('submit',saveSlider);resetBtn.addEventListener('click',resetForm);refreshBtn.addEventListener('click',loadSliders);searchInput.addEventListener('input',applyFilters);statusFilter.addEventListener('change',applyFilters);
  $('bannerPrevBtn').addEventListener('click',()=>selectBanner(selectedIndex-1));$('bannerNextBtn').addEventListener('click',()=>selectBanner(selectedIndex+1));
  $('bannerStripPrev').addEventListener('click',()=>list.scrollBy({left:-360,behavior:'smooth'}));$('bannerStripNext').addEventListener('click',()=>list.scrollBy({left:360,behavior:'smooth'}));
  $('bannerEditSelected').addEventListener('click',()=>filteredItems[selectedIndex]&&editItem(filteredItems[selectedIndex]));$('bannerDeleteSelected').addEventListener('click',()=>filteredItems[selectedIndex]&&deleteSlider(filteredItems[selectedIndex].id));
  document.addEventListener('click',e=>{if(!e.target.closest('.banner-card-menu,.banner-more-btn'))document.querySelectorAll('.banner-card-menu.show').forEach(m=>m.classList.remove('show'))});
  list.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-id]'),del=e.target.closest('[data-delete-id]'),menu=e.target.closest('[data-menu-id]'),dot=e.target.closest('[data-dot-index]');
    if(edit){e.stopPropagation();const item=currentItems.find(x=>String(x.id)===String(edit.dataset.editId));if(item)editItem(item);return}if(del){e.stopPropagation();deleteSlider(del.dataset.deleteId);return}
    if(menu){e.stopPropagation();const m=list.querySelector(`[data-menu-for="${CSS.escape(menu.dataset.menuId)}"]`);document.querySelectorAll('.banner-card-menu.show').forEach(x=>{if(x!==m)x.classList.remove('show')});m&&m.classList.toggle('show');return}
    const card=e.target.closest('[data-select-index]');if(card)selectBanner(Number(card.dataset.selectIndex));
  });
  $('bannerDots').addEventListener('click',e=>{const b=e.target.closest('[data-dot-index]');if(b)selectBanner(Number(b.dataset.dotIndex))});
  loadSliders();
})();
