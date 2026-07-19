(function(){
const $=id=>document.getElementById(id), state={items:[]};
const url=k=>{const endpoint=API_CONFIG?.ENDPOINTS?.[k];if(!endpoint)throw new Error('Missing API endpoint configuration: '+k);return String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+endpoint;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(u,opt={}){opt.headers={...(opt.headers||{}),...(window.BO_AUTH?BO_AUTH.authHeader():{})};const r=await fetch(u,opt),j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
function msg(t,type=''){$('policyMessage').textContent=t||'';$('policyMessage').className='upload-status mt-2 '+type;}
function today(){const d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
function openModal(){$('policyModal').classList.add('show');document.body.classList.add('modal-open');}
function closeModal(){$('policyModal').classList.remove('show');document.body.classList.remove('modal-open');}
function render(){
 const body=$('policyTableBody');
 body.innerHTML=state.items.map(x=>`<tr>
  <td>${Number(x.sortOrder||0)}</td>
  <td><b>${esc(x.policyKey)}</b></td>
  <td>${esc(x.tabLabel)}</td>
  <td class="policy-title-cell"><b>${esc(x.title)}</b></td>
  <td>${esc(x.lastUpdated||'-')}</td>
  <td><span class="policy-status-badge ${Number(x.status)===1?'':'off'}">${Number(x.status)===1?'Active':'Inactive'}</span></td>
  <td><div class="policy-action-wrap"><button class="policy-action-btn" type="button" data-edit-id="${x.id}" title="Edit"><i class="bi bi-pencil"></i></button></div></td>
 </tr>`).join('')||'<tr><td colspan="7">No policies found.</td></tr>';
 $('policyRecordCount').textContent=state.items.length+' policy record(s)';
}
function edit(x){
 $('policyId').value=x?.id||'';$('policyKey').value=x?.policyKey||'';$('tabLabel').value=x?.tabLabel||'';$('policyTitle').value=x?.title||'';$('sortOrder').value=x?.sortOrder??0;$('policyStatus').value=String(x?.status??1);$('contentHtml').value=x?.contentHtml||'';
 $('editorTitle').textContent=x?'Edit Policy':'Create Policy';
 $('policySubmitBtn').innerHTML=x?'<i class="bi bi-save"></i> Save Changes':'<i class="bi bi-plus-lg"></i> Create Policy';
 $('lastUpdatedDisplay').textContent=x?.lastUpdated?('Current: '+x.lastUpdated+' · updates automatically when saved'):'Automatically set when saved';
 openModal();
}
async function load(){msg('Loading...');const j=await request(url('COMPLIANCE_POLICY_LIST'));state.items=Array.isArray(j.data)?j.data:[];render();msg('');}
async function save(e){
 e.preventDefault();
 const body={id:$('policyId').value||null,policyKey:$('policyKey').value.trim(),tabLabel:$('tabLabel').value.trim(),title:$('policyTitle').value.trim(),lastUpdated:today(),sortOrder:Number($('sortOrder').value||0),status:Number($('policyStatus').value),contentHtml:$('contentHtml').value};
 const btn=$('policySubmitBtn'),old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Saving...';msg('');
 try{await request(url('COMPLIANCE_POLICY_SAVE'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});closeModal();msg('Policy saved successfully.','success');await load();}
 catch(err){msg(err.message,'error');}
 finally{btn.disabled=false;btn.innerHTML=old;}
}
document.addEventListener('DOMContentLoaded',()=>{
 $('policyForm').addEventListener('submit',save);
 $('refreshPolicyBtn').addEventListener('click',()=>load().catch(e=>msg(e.message,'error')));
 $('newPolicyBtn').addEventListener('click',()=>edit(null));
 $('policyTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-edit-id]');if(b)edit(state.items.find(x=>String(x.id)===b.dataset.editId));});
 document.querySelectorAll('[data-policy-close]').forEach(b=>b.addEventListener('click',closeModal));
 $('policyModal').addEventListener('click',e=>{if(e.target===$('policyModal'))closeModal();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
 load().catch(e=>msg(e.message,'error'));
});
})();
