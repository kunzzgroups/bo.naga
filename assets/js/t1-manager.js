(function () {
  'use strict';
  if (typeof window.__t1ManagerDispose === 'function') window.__t1ManagerDispose();
  const root = document.querySelector('[data-t1-module]');
  if (!root) return;
  const mode = root.dataset.t1Module;
  const listeners = [], objectUrls = [];
  const on = (node, type, fn) => { if (!node) return; node.addEventListener(type,fn);listeners.push(()=>node.removeEventListener(type,fn)); };
  const byId = id => document.getElementById(id);
  const enc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base = String(window.API_CONFIG?.BASE_URL || '/api').replace(/\/$/, '');
  function headers() {
    const h = {Accept:'application/json',...(window.BO_AUTH?.authHeader?.() || {})};
    const t = localStorage.getItem('bo_admin_token')||localStorage.getItem('adminToken')||localStorage.getItem('admin_token')||localStorage.getItem('token');
    if (!h.Authorization && t) h.Authorization = 'Bearer '+t;
    const brand = window.BO_BRAND?.activeId?.() || localStorage.getItem('bo_active_brand_id');
    if (brand) h['X-Brand-Id'] = String(brand);
    return h;
  }
  async function api(route, options = {}) {
    const h = {...headers(),...(options.headers||{})};
    if(options.body && !(options.body instanceof FormData)) h['Content-Type'] = 'application/json';
    const res = await fetch(base+route,{...options,headers:h,cache:'no-store'});
    const json = await res.json().catch(()=>({}));
    if (!res.ok || json.status === 'error' || json.success === false) throw Error(json.message||'Request failed (HTTP '+res.status+')');
    return json.data;
  }
  function notice(value,error=false) {
    const box=byId('t1Notice');if(!box)return;box.textContent=String(value||'');box.hidden=!value;
    box.className='alert '+(error?'alert-danger':'alert-success');
  }
  function field(label,name,kind='text',wide=false,attr='') {
    const cls=wide?' full':'';
    const control=kind==='textarea'?`<textarea class="form-control" name="${name}" ${attr}></textarea>`:
      kind==='checkbox'?`<input class="form-check-input" name="${name}" type="checkbox" ${attr}>`:
      kind.startsWith('select:')?`<select class="form-select" name="${name}" ${attr}>${kind.slice(7).split('|').map(s=>{const [k,v]=s.split(':');return `<option value="${enc(k)}">${enc(v||k)}</option>`;}).join('')}</select>`:
      `<input class="form-control" type="${kind}" name="${name}" ${attr}>`;
    return `<div class="t1-field${cls}"><label>${label}</label>${control}</div>`;
  }
  const missionFields = () => field('ID','id','hidden',true)+field('Group','group','text',false,'maxlength="100" required')+
    field('Mission label','label','text',false,'maxlength="200" required')+
    field('Metric','missionType','select:DEPOSIT_COUNT:Approved deposit count|DEPOSIT_AMOUNT:Approved deposit amount|VALID_BET:Valid bets')+
    field('Cycle','period','select:DAILY:Daily|WEEKLY:Weekly|MONTHLY:Monthly')+
    field('Target','target','number',false,'min="0.0001" step="0.0001" required')+
    field('Reward points','reward','number',false,'min="0" step="0.0001" required')+
    field('Sort order','sortOrder','number',false,'value="0"')+field('Enabled','enabled','checkbox');
  const rewardFields = () => field('ID','id','hidden',true)+field('Reward name','name','text',false,'maxlength="200" required')+
    field('Category','category')+field('Image URL','imageUrl','text',true,'placeholder="https://..."')+
    field('Point cost','points','number',false,'min="0.0001" step="0.0001" required')+
    field('Stock (empty = unlimited)','remaining','number',false,'min="0" step="1"')+
    field('Sort order','sortOrder','number',false,'value="0"')+field('Enabled','enabled','checkbox');
  const pageFields = () => field('Page ID (URL slug; e.g. about-us, faq, tnc)','slug','text',true,'required pattern="[a-z0-9][a-z0-9-]*" maxlength="76"')+
    field('Navigation page name','title','text',false,'required maxlength="150"')+field('Enabled','enabled','checkbox')+
    field('Banner image URL','imageUrl','text',true,'placeholder="https://... or /uploads/..."')+
    '<div class="t1-field full"><label>Upload new banner image</label><input class="form-control" name="bannerFile" type="file" accept="image/*" /><small>The existing Image To URL upload endpoint is used. Only the saved URL is published.</small></div>'+
    field('Hero title — English','titleEn')+field('Hero title — 中文','titleZh')+
    field('Subtitle — English','subtitleEn')+field('Subtitle — 中文','subtitleZh')+
    field('Hero tags — English (separate with |)','badgesEn','text',true)+field('Hero tags — 中文 (use |)','badgesZh','text',true)+
    field('English page HTML (Page Customize content)','htmlEn','textarea',true)+
    field('中文页面 HTML (Page Customize content)','htmlZh','textarea',true)+
    field('Page-scoped CSS (iframe only)','css','textarea',true);
  const config={
    missions:{route:'/admin/t1-engagement',items:'missions',columns:['Name','Group','Metric','Cycle','Target','Points','Status','Action'],fields:missionFields},
    rewards:{route:'/admin/t1-engagement',items:'rewards',columns:['Reward','Category','Points','Stock','Status','Action'],fields:rewardFields},
    redemptions:{route:'/admin/t1-engagement',items:'redemptions',columns:['Request','Player','Reward','Points','Status','Action']},
    pages:{route:'/admin/page-customize',columns:['Page','URL','Status','Action'],fields:pageFields},
    kyc:{route:'/admin/t1-kyc',columns:['Member','Status','Submitted','Actions']}
  };
  const standardPages=[['about-us','About Us'],['faq','FAQ'],['tnc','Terms & Conditions'],['contact-us','Contact Us'],['event','Events'],['tournament','Tournament'],['blog','Blog'],['affiliate','Affiliate']];
  let rows=[], currentId=null;
  const section=config[mode];
  document.querySelectorAll('[data-t1-link]').forEach(a=>a.classList.toggle('is-active',a.dataset.t1Link===mode));
  function cell(x){return `<td>${enc(x)}</td>`;}
  /* A status as a pill (green = live/done, amber = waiting, red = refused, grey = off) instead of bare text, like the other BO listings. */
  function statusCell(x){const t=String(x==null?'':x),k=t.toUpperCase();const cls=/^(ACTIVE|ENABLED|FULFILLED|APPROVED)$/.test(k)?'is-on':k==='PENDING'?'is-wait':/^(REJECTED|FAILED)$/.test(k)?'is-bad':'is-off';return `<td><span class="t1-status ${cls}">${enc(t)}</span></td>`;}
  function editButton(id,virtual=false){return `<button class="btn btn-sm btn-outline-primary" type="button" data-edit="${enc(id)}">${virtual?"Configure":"Edit"}</button>`;}
  function showRows(){
    const body=byId('t1Rows'), columns=byId('t1Columns'); if(!body || !section)return;
    columns.innerHTML=section.columns.map(c=>`<th>${enc(c)}</th>`).join('');
    const visible=rows.slice(0,200);
    const html=visible.map((r,i)=>{
      if(mode==='missions')return `<tr>${cell(r.label)}${cell(r.group_label||r.group)}${cell(r.mission_type)}${cell(r.period)}${cell(r.target)}${cell(r.reward_points)}${statusCell(Number(r.enabled)===1?'Active':'Inactive')}<td>${editButton(r.id)}</td></tr>`;
      if(mode==='rewards')return `<tr>${cell(r.name)}${cell(r.category)}${cell(r.point_cost)}${cell(r.remaining==null?'Unlimited':r.remaining)}${statusCell(Number(r.enabled)===1?'Active':'Inactive')}<td>${editButton(r.id)}</td></tr>`;
      if(mode==='redemptions')return `<tr>${cell('#'+r.id)}${cell(r.username)}${cell(r.name)}${cell(r.points)}${statusCell(r.status)}<td>${r.status==='PENDING'?`<button class="btn btn-sm btn-success" data-process="${Number(r.id)}" data-status="FULFILLED">Fulfill</button> <button class="btn btn-sm btn-outline-danger" data-process="${Number(r.id)}" data-status="REJECTED">Reject + refund</button>`:''}</td></tr>`;
      if(mode==='pages')return `<tr>${cell(r.title)}${cell('/zh-my/'+(['about-us','faq','tnc','contact-us','event','tournament','blog','affiliate'].includes(r.slug.slice(3))?r.slug.slice(3):'t1/'+r.slug.slice(3)))}${statusCell(r.__virtual?'Not configured':Number(r.enabled)===1?'Enabled':'Disabled')}<td>${editButton(r.slug,r.__virtual)}</td></tr>`;
      if(mode==='kyc')return `<tr>${cell(r.username+' (#'+r.memberId+')')}${statusCell(r.status)}${cell(r.createdAt)}<td><button type="button" class="btn btn-sm btn-outline-primary" data-kyc-view="${Number(r.memberId)}">View</button> ${r.status==='PENDING'?`<button type="button" class="btn btn-sm btn-success" data-kyc-review="${Number(r.memberId)}" data-status="APPROVED">Approve</button> <button type="button" class="btn btn-sm btn-outline-danger" data-kyc-review="${Number(r.memberId)}" data-status="REJECTED">Reject</button>`:''}</td></tr>`;
      return '';
    }).join('');
    body.innerHTML=html||`<tr><td colspan="${section.columns.length}" class="text-center text-muted">No records configured</td></tr>`;
    if(rows.length>200)notice(`Showing first 200 of ${rows.length} records`);
  }
  async function load(){
    if(!section)return;
    try {
      const data=await api(section.route);
      rows=mode==='pages'?Array.isArray(data)?data.filter(r=>String(r.slug||'').startsWith('t1-')):[]:
        mode==='kyc'?Array.isArray(data)?data:[]:Array.isArray(data?.[section.items])?data[section.items]:[];
      if(mode==='pages'){const actual=new Set(rows.map(p=>p.slug));rows=[...standardPages.filter(([slug])=>!actual.has('t1-'+slug)).map(([slug,title])=>({slug:'t1-'+slug,title,enabled:0,__virtual:true})),...rows];}
      showRows();notice('');
    }catch(e){notice(e.message||'Unable to load',true);}
  }
  function setField(form,name,value) {
    const f=form.elements.namedItem(name);if(!f)return;
    if(f.type==='checkbox')f.checked=Number(value)===1||value===true;
    else f.value=value==null?'':String(value);
  }
  function openEditor(row){
    const modal=byId('t1Modal'),form=byId('t1Editor');if(!modal||!form)return;
    byId('t1Fields').innerHTML=section.fields();form.reset();currentId=row?.id||row?.slug||null;
    if(mode==='missions'&&row){for(const [name,key] of Object.entries({id:'id',group:'group_label',label:'label',missionType:'mission_type',period:'period',target:'target',reward:'reward_points',sortOrder:'sort_order',enabled:'enabled'}))setField(form,name,row[key]);}
    if(mode==='rewards'&&row){for(const [name,key] of Object.entries({id:'id',name:'name',category:'category',imageUrl:'image_url',points:'point_cost',remaining:'remaining',sortOrder:'sort_order',enabled:'enabled'}))setField(form,name,row[key]);}
    if(mode==='pages'){
      setField(form,'slug',row?String(row.slug).replace(/^t1-/,''):'');
      setField(form,'title',row?.title||'');setField(form,'enabled',row&&!row.__virtual?row.enabled:1);
      setField(form,'css',row?.customCss||'');setField(form,'htmlEn',row?.t1RichHtmlEn||row?.richHtml||'');setField(form,'htmlZh',row?.t1RichHtmlZh||'');
      const hero=row?.t1Hero||{};
      ['imageUrl','titleEn','titleZh','subtitleEn','subtitleZh','badgesEn','badgesZh'].forEach(k=>setField(form,k,hero[k]||''));
      const slug=form.elements.namedItem('slug');slug.readOnly=!!row;
    }
    byId('t1ModalTitle').textContent=(row?'Edit ':'Add ')+(mode==='pages'?'React Page':mode==='missions'?'Mission':'Reward');
    modal.showModal();
  }
  async function uploadBanner(file){
    if(!file || !file.name || !file.size)return '';
    if(!file.type.startsWith('image/')||file.size>8*1024*1024)throw Error('Banner must be an image under 8 MB');
    const form=new FormData();form.append('image',file);
    const data=await api('/uploads/image',{method:'POST',body:form});
    const url=data?.url||data?.imageUrl||'';
    if(!url)throw Error('Upload succeeded without image URL');
    return url;
  }
  async function save(event){
    event.preventDefault();const form=event.currentTarget;const submit=byId('t1Save');submit.disabled=true;
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      if(mode==='pages'){
        const rawSlug=String(payload.slug||'').trim().toLowerCase();
        if(!/^[a-z0-9][a-z0-9-]{0,75}$/.test(rawSlug))throw Error('Use a safe lowercase page slug');
        const uploaded=await uploadBanner(payload.bannerFile);
        const imageUrl=uploaded||String(payload.imageUrl||'').trim();
        if(imageUrl&&!(/^https:\/\//i.test(imageUrl)||/^\/(?!\/)/.test(imageUrl)))throw Error('Image URL must be HTTPS or a site-relative path');
        const hero={imageUrl};
        for(const key of ['titleEn','titleZh','subtitleEn','subtitleZh','badgesEn','badgesZh'])hero[key]=String(payload[key]||'').trim();
        const htmlEn=String(payload.htmlEn||''),htmlZh=String(payload.htmlZh||'');
        const old=rows.find(x=>x.slug==='t1-'+rawSlug)||{};
        const body={title:String(payload.title||''),slug:'t1-'+rawSlug,enabled:form.elements.namedItem('enabled').checked?1:0,
          richHtml:htmlEn||htmlZh||old.richHtml||'',customCss:String(payload.css||''),customHtml:old.customHtml||'',customJs:old.customJs||'',
          t1Hero:hero,t1RichHtmlEn:htmlEn,t1RichHtmlZh:htmlZh};
        await api('/admin/page-customize',{method:'POST',body:JSON.stringify(body)});
      }else{
        payload.enabled=form.elements.namedItem('enabled').checked?1:0;
        await api('/admin/t1-engagement/'+mode,{method:'POST',body:JSON.stringify(payload)});
      }
      byId('t1Modal').close();await load();notice('Saved successfully');
    }catch(e){notice(e.message||'Save failed',true);}finally{submit.disabled=false;}
  }
  function clearUrls(){for(const url of objectUrls.splice(0))URL.revokeObjectURL(url);}
  function close(){byId('t1Modal')?.close();clearUrls();}
  async function reviewKyc(id,status){
    if(!confirm(`Confirm ${status.toLowerCase()} of KYC member #${id}?`))return;
    try{await api('/admin/t1-kyc/'+id+'/review',{method:'POST',body:JSON.stringify({status})});await load();notice('KYC reviewed');}catch(e){notice(e.message,true);}
  }
  async function viewKyc(id){
    const modal=byId('t1Modal');clearUrls();
    try{
      const sources=[];
      for(const side of ['front','back']){
        const r=await fetch(base+'/admin/t1-kyc/'+id+'/'+side,{headers:headers(),cache:'no-store'});
        if(!r.ok)throw Error('Cannot load '+side+' document');
        const url=URL.createObjectURL(await r.blob());sources.push(url);objectUrls.push(url);
      }
      byId('t1ModalTitle').textContent='KYC member #'+id;
      byId('t1Fields').innerHTML=`<div class="t1-kdoc full"><img alt="Front" src="${sources[0]}"><img alt="Back" src="${sources[1]}"></div>`;
      byId('t1Save').hidden=true;modal.showModal();
    }catch(e){clearUrls();notice(e.message,true);}
  }
  async function processRedemption(id,status){
    if(!confirm(status==='REJECTED'?'Reject request #'+id+' and refund points?':'Confirm request #'+id+' fulfilled?'))return;
    try{await api('/admin/t1-engagement/redemptions/'+id+'/status',{method:'POST',body:JSON.stringify({status})});await load();notice('Request updated');}catch(e){notice(e.message,true);}
  }
  on(byId('t1Add'),'click',()=>openEditor(null));
  on(byId('t1Reload'),'click',()=>void load());
  on(byId('t1Close'),'click',close);on(byId('t1Cancel'),'click',close);
  on(byId('t1Modal'),'close',()=>{clearUrls();const save=byId('t1Save');if(save)save.hidden=false;});
  on(byId('t1Editor'),'submit',event=>void save(event));
  on(byId('t1Rows'),'click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.edit){const row=rows.find(r=>String(mode==='pages'?r.slug:r.id)===b.dataset.edit);if(row)openEditor(row);}
    if(b.dataset.process)void processRedemption(Number(b.dataset.process),b.dataset.status);
    if(b.dataset.kycView)void viewKyc(Number(b.dataset.kycView));
    if(b.dataset.kycReview)void reviewKyc(Number(b.dataset.kycReview),b.dataset.status);
  });
  window.__t1ManagerDispose=()=>{listeners.splice(0).forEach(f=>f());clearUrls();};
  if(section)void load();
})();
