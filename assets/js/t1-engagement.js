(function(){
 'use strict';
 if(window.__boT1EngagementDispose)window.__boT1EngagementDispose();
 const listeners=[];
 const add=(el,type,fn)=>{if(!el)return;el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
 window.__boT1EngagementDispose=()=>{listeners.forEach(f=>f());};
 const base=String(window.API_CONFIG?.BASE_URL||'').replace(/\/$/,'');
 const root=base+'/admin/t1-engagement';
 function authHeaders(){const auth=window.BO_AUTH&&typeof BO_AUTH.authHeader==='function'?BO_AUTH.authHeader():{};const token=localStorage.getItem('bo_admin_token')||localStorage.getItem('admin_token')||localStorage.getItem('token')||'';if(!auth.Authorization&&token)auth.Authorization='Bearer '+token;const brand=window.BO_BRAND&&typeof BO_BRAND.activeId==='function'?BO_BRAND.activeId():localStorage.getItem('bo_active_brand_id');if(brand)auth['X-Brand-Id']=String(brand);return auth;}
 const node=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data={missions:[],rewards:[],redemptions:[]};
 function message(text,invalid=false){const n=node('t1Status');if(!n)return;n.hidden=!text;n.className='alert '+(invalid?'alert-danger':'alert-info');n.textContent=text;}
 async function request(path,method='GET',body){
   const headers={'Accept':'application/json',...authHeaders()};
   if(body)headers['Content-Type']='application/json';
   const result=await fetch(root+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
   const json=await result.json().catch(()=>({}));
   if(!result.ok||json.status==='error')throw Error(json.message||'Request failed ('+result.status+')');
   return json.data;
 }
 function render(){
   const m=node('t1Missions'),r=node('t1Rewards'),x=node('t1Redemptions');
   if(!m||!r||!x)return;
   m.innerHTML=data.missions.map(i=>`<tr><td>${esc(i.label)}</td><td>${esc(i.mission_type)}</td><td>${esc(i.period)}</td><td>${esc(i.target)}</td><td>${esc(i.reward_points)}</td><td>${Number(i.enabled)===1?'Active':'Inactive'}</td><td><button class="btn btn-outline-primary btn-sm" data-t1-mission="${Number(i.id)}">Edit</button></td></tr>`).join('')||'<tr><td colspan="7">No missions configured</td></tr>';
   r.innerHTML=data.rewards.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.category)}</td><td>${esc(i.point_cost)}</td><td>${i.remaining==null?'Unlimited':esc(i.remaining)}</td><td>${Number(i.enabled)===1?'Active':'Inactive'}</td><td><button class="btn btn-outline-primary btn-sm" data-t1-reward="${Number(i.id)}">Edit</button></td></tr>`).join('')||'<tr><td colspan="6">No rewards configured</td></tr>';
   x.innerHTML=data.redemptions.map(i=>`<tr><td>#${Number(i.id)}</td><td>${esc(i.username)}</td><td>${esc(i.name)}</td><td>${esc(i.points)}</td><td>${esc(i.status)}</td><td>${i.status==='PENDING'?`<button class="btn btn-success btn-sm" data-t1-process="${Number(i.id)}" data-action="FULFILLED">Fulfilled</button> <button class="btn btn-outline-danger btn-sm" data-t1-process="${Number(i.id)}" data-action="REJECTED">Reject + refund</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">No redemption requests</td></tr>';
 }
 async function load(){try{data=await request('');render();message('');}catch(e){message(e.message||'Could not load T1 engagement',true);}}
 function setForm(id,values){const f=node(id);if(!f)return;for(const [k,v] of Object.entries(values)){const el=f.elements.namedItem(k);if(el){if(el.type==='checkbox')el.checked=Number(v)===1;else el.value=v==null?'':String(v);}}f.scrollIntoView({behavior:'smooth',block:'start'});}
 function payload(form){const obj=Object.fromEntries(new FormData(form).entries());obj.enabled=form.elements.namedItem('enabled').checked?1:0;return obj;}
 async function submit(e,type){e.preventDefault();const form=e.currentTarget;const body=payload(form);try{await request('/'+type,'POST',body);message('Saved.');form.reset();await load();}catch(err){message(err.message||'Save failed',true);}}
 function click(e){
   const btn=e.target.closest('button');if(!btn)return;
   if(btn.dataset.t1Mission){const i=data.missions.find(x=>x.id===Number(btn.dataset.t1Mission));if(i)setForm('t1MissionForm',{id:i.id,group:i.group_label,label:i.label,missionType:i.mission_type,period:i.period,target:i.target,reward:i.reward_points,enabled:i.enabled,sortOrder:i.sort_order});}
   if(btn.dataset.t1Reward){const i=data.rewards.find(x=>x.id===Number(btn.dataset.t1Reward));if(i)setForm('t1RewardForm',{id:i.id,name:i.name,category:i.category,imageUrl:i.image_url,points:i.point_cost,remaining:i.remaining,enabled:i.enabled,sortOrder:i.sort_order});}
   if(btn.dataset.t1Process){const id=Number(btn.dataset.t1Process),status=btn.dataset.action;if(!confirm(status==='REJECTED'?'Reject redemption #'+id+' and refund points?':'Confirm reward #'+id+' has been fulfilled?'))return;request('/redemptions/'+id+'/status','POST',{status}).then(load).catch(err=>message(err.message,true));}
 }
 add(node('t1MissionForm'),'submit',e=>submit(e,'missions'));
 add(node('t1RewardForm'),'submit',e=>submit(e,'rewards'));
 add(node('t1Missions'),'click',click);add(node('t1Rewards'),'click',click);add(node('t1Redemptions'),'click',click);
 async function loadContent(){try{const slug=node('t1ContentSlug').value;const r=await fetch(base+'/admin/t1-content/'+slug,{headers:authHeaders(),cache:'no-store'});const j=await r.json();if(!r.ok||j.status==='error')throw Error(j.message||'Content unavailable');node('t1ContentJson').value=JSON.stringify(j.data||{},null,2);message('');}catch(e){message(e.message,true);}}
 async function saveContent(){try{const slug=node('t1ContentSlug').value,content=node('t1ContentJson').value;JSON.parse(content);const r=await fetch(base+'/admin/t1-content/'+slug,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({content})});const j=await r.json();if(!r.ok||j.status==='error')throw Error(j.message||'Could not save content');message('Page saved');}catch(e){message(e.message,true);}}
 add(node('t1ContentReload'),'click',()=>void loadContent());add(node('t1ContentSave'),'click',()=>void saveContent());add(node('t1ContentSlug'),'change',()=>void loadContent());
 let kycUrls=[];
 function revokeKyc(){kycUrls.forEach(x=>URL.revokeObjectURL(x));kycUrls=[];node('t1KycPreview').hidden=true;}
 window.__boT1EngagementDispose=()=>{listeners.forEach(f=>f());revokeKyc();};
 async function loadKyc(){
  try{const r=await fetch(base+'/admin/t1-kyc',{headers:authHeaders(),cache:'no-store'});const j=await r.json();if(!r.ok||j.status==='error')throw Error(j.message||'Could not load KYC');
   node('t1KycRows').innerHTML=(j.data||[]).map(i=>`<tr><td>${esc(i.username)} (#${Number(i.memberId)})</td><td>${esc(i.status)}</td><td>${esc(i.createdAt)}</td><td><button type="button" class="btn btn-outline-primary btn-sm" data-t1-kyc-view="${Number(i.memberId)}">View</button> ${i.status==='PENDING'?`<button type="button" class="btn btn-success btn-sm" data-t1-kyc-review="${Number(i.memberId)}" data-status="APPROVED">Approve</button> <button type="button" class="btn btn-outline-danger btn-sm" data-t1-kyc-review="${Number(i.memberId)}" data-status="REJECTED">Reject</button>`:''}</td></tr>`).join('')||'<tr><td colspan="4">No KYC submissions</td></tr>';
  }catch(e){message(e.message,true);}
 }
 async function viewKyc(memberId){revokeKyc();const imgs=[];try{for(const side of ['front','back']){
  const r=await fetch(base+'/admin/t1-kyc/'+memberId+'/'+side,{headers:authHeaders(),cache:'no-store'});
  if(!r.ok)throw Error('Could not load '+side+' document');const url=URL.createObjectURL(await r.blob());kycUrls.push(url);imgs.push(url);
 }node('t1KycFront').src=imgs[0];node('t1KycBack').src=imgs[1];node('t1KycPerson').textContent='Member #'+memberId;node('t1KycPreview').hidden=false;
 }catch(e){revokeKyc();message(e.message,true);}}
 async function reviewKyc(id,status){if(!confirm('Confirm '+status+' for member #'+id+'?'))return;
  try{const r=await fetch(base+'/admin/t1-kyc/'+id+'/review',{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({status})});const j=await r.json();if(!r.ok||j.status==='error')throw Error(j.message||'Could not review KYC');revokeKyc();await loadKyc();message('KYC reviewed');}catch(e){message(e.message,true);}
 }
 add(node('t1KycClose'),'click',revokeKyc);
 add(node('t1KycRows'),'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t1KycView)void viewKyc(Number(b.dataset.t1KycView));if(b.dataset.t1KycReview)void reviewKyc(Number(b.dataset.t1KycReview),b.dataset.status);});
 void loadKyc();
 void loadContent();
 void load();
})();
