(function(){
  const page = document.body.dataset.accessPage;
  const statusEl = document.getElementById('accessStatus');
  function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function msg(t,cls){ if(statusEl){statusEl.textContent=t||''; statusEl.className='upload-status '+(cls||'');}}
  async function api(url,opt){ const res=await fetch(url,opt||{}); const j=await res.json().catch(()=>({})); if(!res.ok||j.status==='error') throw new Error(j.message||'Request failed'); return j; }
  async function bootstrap(){ try{ await api(API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS.ACCESS_BOOTSTRAP,{headers:{...BO_AUTH.authHeader()}}); }catch(e){} }
  async function loadRoles(selectId){ const j=await api(BO_AUTH.roleListUrl(),{headers:{...BO_AUTH.authHeader()}}); const rows=j.data||[]; const sel=document.getElementById(selectId); if(sel) sel.innerHTML=rows.map(r=>`<option value="${r.id}">${esc(r.name)} (${esc(r.code)})</option>`).join(''); return rows; }
  async function loadSimple(type){
    const isRole=true; const url=BO_AUTH.roleListUrl(); const body=document.getElementById('accessTableBody');
    const j=await api(url,{headers:{...BO_AUTH.authHeader()}}); const rows=j.data||[];
    body.innerHTML=rows.map(r=>`<tr><td><b>${esc(r.name)}</b><br><small>${esc(r.code)}</small></td><td>${esc(isRole?r.remark:r.groupName)}</td><td>${r.status==1?'<span class="status-pill active">Active</span>':'<span class="status-pill off">Inactive</span>'}</td></tr>`).join('')||'<tr><td colspan="3">No data.</td></tr>';
  }
  async function saveSimple(type,e){
    e.preventDefault(); const isRole=type==='role';
    const payload={code:document.getElementById('code').value,name:document.getElementById('name').value,status:document.getElementById('status').value};
    payload.remark=document.getElementById('remark').value;
    try{ await api(BO_AUTH.roleSaveUrl(),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify(payload)}); msg('Saved successfully','success'); e.target.reset(); loadSimple(type);}catch(err){msg(err.message,'error');}
  }
  async function loadMenuList(){
    const j=await api(BO_AUTH.menuListUrl(),{headers:{...BO_AUTH.authHeader()}}); const rows=j.data||[]; const body=document.getElementById('menuTableBody');
    if(body) body.innerHTML=rows.map(m=>`<tr><td><b>${esc(m.title)}</b><br><small>${esc(m.menuKey)}</small></td><td>${esc(m.url)}</td><td>${esc(m.parentKey)}</td><td>${m.status==1?'Active':'Inactive'}</td></tr>`).join('');
    return rows;
  }
  async function loadMenuPermission(){
    const roles=await loadRoles('roleSelect'); const menus=await loadMenuList(); const box=document.getElementById('checkList');
    async function render(){ const roleId=document.getElementById('roleSelect').value; const own=(await api(BO_AUTH.roleMenusUrl(roleId),{headers:{...BO_AUTH.authHeader()}})).data.menuIds||[]; const set=new Set(own.map(String)); box.innerHTML=menus.map(m=>`<label class="perm-card"><input type="checkbox" value="${m.id}" ${set.has(String(m.id))?'checked':''}><span><b><i class="bi ${esc(m.icon)} me-1"></i>${esc(m.title)}</b><small>${esc(m.url)} ${m.parentKey?' / '+esc(m.parentKey):''}</small></span></label>`).join(''); }
    document.getElementById('roleSelect').onchange=render; if(roles.length) await render();
  }
  async function saveMenuPermission(e){ e.preventDefault(); const ids=[...document.querySelectorAll('#checkList input:checked')].map(x=>Number(x.value)); const roleId=document.getElementById('roleSelect').value; try{await api(BO_AUTH.roleMenusUrl(roleId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({menuIds:ids})}); msg('Menu permissions saved','success');}catch(err){msg(err.message,'error');}}
  document.addEventListener('DOMContentLoaded',async()=>{ await bootstrap(); if(page==='role'){loadSimple('role');document.getElementById('accessForm').onsubmit=e=>saveSimple('role',e);} if(page==='menu-permission'){await loadMenuPermission();document.getElementById('accessForm').onsubmit=saveMenuPermission;} if(page==='account-lock'){loadAccountLock();} });
  async function loadAccountLock(){ const body=document.getElementById('lockTableBody'); try{ const rows=(await api(BO_AUTH.memberListUrl(),{headers:{...BO_AUTH.authHeader()}})).data||[]; body.innerHTML=rows.map(m=>`<tr><td><b>${esc(m.username)}</b><br><small>${esc(m.fullName||m.mobile)}</small></td><td>${m.locked==1?'<span class="status-pill off">Locked</span>':'<span class="status-pill active">Normal</span>'}</td><td><button class="clean-btn" data-lock-id="${m.id}" data-lock="${m.locked==1?0:1}">${m.locked==1?'Unlock':'Lock'}</button></td></tr>`).join('')||'<tr><td colspan="3">No member.</td></tr>'; }catch(e){body.innerHTML='<tr><td colspan="3">'+esc(e.message)+'</td></tr>';} }
  document.addEventListener('click',async e=>{ const b=e.target.closest('[data-lock-id]'); if(!b)return; await api(BO_AUTH.memberUpdateUrl(b.dataset.lockId),{method:'POST',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({locked:Number(b.dataset.lock)})}); loadAccountLock(); });
})();
