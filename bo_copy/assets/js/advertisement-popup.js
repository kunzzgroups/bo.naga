(function(){
'use strict';
const $=id=>document.getElementById(id);
const enabled=$('adPopupEnabled'), mode=$('adPopupMode'), imageInput=$('adPopupImage');
const drop=$('adPopupDropZone'), imgPreview=$('adPopupImagePreview'), placeholder=$('adPopupUploadPlaceholder');
const title=$('adPopupTitle'), message=$('adPopupMessage'), link=$('adPopupLinkUrl'), button=$('adPopupButtonText');
const saveBtn=$('saveAdPopup'), refreshBtn=$('refreshAdPopup'), msgBox=$('adPopupMessageBox');
const endpoint=String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+(API_CONFIG.ENDPOINTS.ADVERTISEMENT_POPUP||'/admin/frontend/ad-popup');
let selectedFile=null, currentImageUrl='', removeImage=false;

function headers(){ return window.BO_AUTH?BO_AUTH.authHeader():{}; }
function setMsg(text,type){msgBox.textContent=text||'';msgBox.className='upload-status mt-2 '+(type||'');}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function modeLabel(v){return v==='ONCE_AFTER_CLOSE'?'After Close, Do Not Show Again':v==='DAILY'?'Once Every Day':'Every Refresh';}
function updateModeHelp(){
 const help=$('adPopupModeHelp'),note=$('adBehaviorNote').querySelector('span');
 if(mode.value==='ONCE_AFTER_CLOSE'){
   help.textContent='After a member closes this version, it stays hidden until you save/update the popup again.';
   note.textContent='Once-after-close uses the member browser storage. Saving this configuration creates a new popup version, so it can be shown again.';
 }else if(mode.value==='DAILY'){
   help.textContent='After the member closes it, it stays hidden for the rest of that calendar day.';
   note.textContent='Daily mode is tracked in the member browser. On a new local calendar day, the popup becomes eligible to show again.';
 }else{
   help.textContent='Popup appears again after every homepage refresh.';
   note.textContent='Every Refresh ignores previous close history. Closing hides it only until the homepage is refreshed or opened again.';
 }
 renderInline();
}
function setImage(src){
 currentImageUrl=src||'';
 imgPreview.src=currentImageUrl;
 imgPreview.hidden=!currentImageUrl;
 placeholder.hidden=!!currentImageUrl;
}
function chooseFile(file){
 if(!file)return;
 if(!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type||'')){setMsg('Please select PNG, JPG, WEBP or GIF image.','error');return;}
 selectedFile=file;removeImage=false;setImage(URL.createObjectURL(file));setMsg('New image selected. Save to publish it.','success');renderInline();
}
function renderInline(){
 const hasImage=!!currentImageUrl, hasTitle=!!title.value.trim(), hasMessage=!!message.value.trim();
 $('adInlineImage').src=currentImageUrl||'';$('adInlineImage').hidden=!hasImage;
 $('adInlineTitle').textContent=title.value.trim();$('adInlineTitle').hidden=!hasTitle;
 $('adInlineMessage').textContent=message.value.trim();$('adInlineMessage').hidden=!hasMessage;
 const btnText=button.value.trim();const hasButton=!!(btnText&&link.value.trim());
 $('adInlineButton').textContent=btnText;$('adInlineButton').hidden=!hasButton;
 $('adInlineContent').hidden=!(hasTitle||hasMessage||hasButton);
 $('adInlineEmpty').hidden=hasImage||hasTitle||hasMessage||hasButton;
 $('adInlineStatus').textContent=enabled.value==='1'?'Enabled':'Disabled';
 $('adInlineStatus').style.color=enabled.value==='1'?'#039855':'#d92d20';
 $('adInlineMode').textContent=modeLabel(mode.value);
}
function previewFull(){
 const src=currentImageUrl, t=title.value.trim(), m=message.value.trim(), url=link.value.trim(), bt=button.value.trim();
 if(!src&&!t&&!m){setMsg('Add an image, title or message before previewing.','error');return;}
 const overlay=$('adBoPreviewOverlay');
 const i=$('adBoPreviewImage');i.src=src||'';i.hidden=!src;
 const ti=$('adBoPreviewTitle');ti.textContent=t;ti.hidden=!t;
 const me=$('adBoPreviewMessage');me.textContent=m;me.hidden=!m;
 const a=$('adBoPreviewButton');a.textContent=bt||'View More';a.href=url||'#';a.hidden=!url;
 $('adBoPreviewImageLink').href=url||'#';$('adBoPreviewImageLink').style.pointerEvents=url?'auto':'none';
 overlay.hidden=false;
}
async function load(){
 setMsg('Loading...');
 const res=await fetch(endpoint,{headers:headers()});const json=await res.json().catch(()=>({}));
 if(!res.ok||json.status==='error')throw new Error(json.message||'Unable to load advertisement popup setting.');
 const d=json.data||{};
 enabled.value=d.enabled?'1':'0';mode.value=d.displayMode||'EVERY_REFRESH';
 title.value=d.title||'';message.value=d.message||'';link.value=d.linkUrl||'';button.value=d.buttonText||'';
 selectedFile=null;removeImage=false;setImage(d.imageUrl||'');
 [enabled,mode].forEach(s=>s.dispatchEvent(new Event('change',{bubbles:true})));
 updateModeHelp();renderInline();setMsg('');
}
async function save(){
 if(enabled.value==='1'&&!currentImageUrl&&!title.value.trim()&&!message.value.trim()){setMsg('Please configure an image, title or message before enabling the popup.','error');return;}
 const fd=new FormData();fd.append('enabled',enabled.value);fd.append('displayMode',mode.value);fd.append('title',title.value.trim());fd.append('message',message.value.trim());fd.append('linkUrl',link.value.trim());fd.append('buttonText',button.value.trim());fd.append('removeImage',removeImage?'1':'0');if(selectedFile)fd.append('image',selectedFile);
 const old=saveBtn.innerHTML;saveBtn.disabled=true;saveBtn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Saving...';setMsg('');
 try{
   const res=await fetch(endpoint,{method:'POST',headers:headers(),body:fd});const json=await res.json().catch(()=>({}));
   if(!res.ok||json.status==='error')throw new Error(json.message||'Unable to save advertisement popup setting.');
   const d=json.data||{};selectedFile=null;removeImage=false;setImage(d.imageUrl||'');setMsg('Advertisement popup setting saved successfully. Frontend will use the new version on the next load.','success');renderInline();
 }catch(e){setMsg(e.message||'Save failed.','error');}
 finally{saveBtn.disabled=false;saveBtn.innerHTML=old;}
}
$('chooseAdPopupImage').addEventListener('click',()=>imageInput.click());
drop.addEventListener('click',()=>imageInput.click());drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();imageInput.click();}});
imageInput.addEventListener('change',()=>chooseFile(imageInput.files&&imageInput.files[0]));
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragover')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragover')}));
drop.addEventListener('drop',e=>chooseFile(e.dataTransfer.files&&e.dataTransfer.files[0]));
$('removeAdPopupImage').addEventListener('click',()=>{selectedFile=null;imageInput.value='';removeImage=true;setImage('');renderInline();setMsg('Image marked for removal. Click Save Setting to apply.','success');});
[enabled,title,message,link,button].forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',renderInline));
mode.addEventListener('change',updateModeHelp);
$('previewAdPopup').addEventListener('click',previewFull);$('closeAdBoPreview').addEventListener('click',()=>{$('adBoPreviewOverlay').hidden=true;});
$('adBoPreviewOverlay').addEventListener('click',e=>{if(e.target===$('adBoPreviewOverlay'))$('adBoPreviewOverlay').hidden=true;});
refreshBtn.addEventListener('click',()=>load().catch(e=>setMsg(e.message,'error')));saveBtn.addEventListener('click',save);
load().catch(e=>setMsg(e.message,'error'));
})();