(function(){
'use strict';
const base=window.API_BASE||'', $=id=>document.getElementById(id);let page=0,lastPage=0;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function req(url){const r=await fetch(url,{headers:Object.assign({},BO_AUTH.authHeader(),{'Cache-Control':'no-cache'})});const j=await r.json().catch(()=>({}));if(!r.ok||j.status==='error')throw Error(j.message||'Unable to load operation log');return j.data;}
function detail(x){try{const j=JSON.parse(x.afterJson||'{}');const rich=String(x.detail||'').trim();return esc(rich||(j.path?(j.method+' '+j.path):'-'));}catch(e){return esc(x.detail||'-');}}
function filters(){const q=new URLSearchParams({entityType:'ADMIN_OPERATION'});if($('actor').value.trim())q.set('actor',$('actor').value.trim());if($('action').value)q.set('action',$('action').value);return q;}
async function fetchPage(serverPage,requestedSize){const q=filters();q.set('page',String(serverPage));q.set('size',String(requestedSize));return req(base+'/api/admin/rebate/audit?'+q);}
async function fetchLogicalPage(logicalPage,requestedSize){
  let probe=await fetchPage(logicalPage,requestedSize);
  const total=Number(probe.totalElements||0);
  const reportedSize=Number(probe.size||0);
  const probeRows=probe.content||[];
  const actualSize=reportedSize>0?reportedSize:(probeRows.length>0?probeRows.length:requestedSize);
  if(requestedSize<=actualSize || probeRows.length>=requestedSize || total<=probeRows.length){return {rows:probeRows,total,totalPages:Math.max(1,Math.ceil(total/requestedSize))};}
  const start=logicalPage*requestedSize, startServerPage=Math.floor(start/actualSize), offset=start%actualSize;
  let rows=[],serverPage=startServerPage,first=true;
  while(rows.length<requestedSize+offset && serverPage*actualSize<total){
    const d=(first&&serverPage===logicalPage)?probe:await fetchPage(serverPage,requestedSize);
    rows.push(...(d.content||[])); serverPage++; first=false;
    if(!(d.content||[]).length)break;
  }
  rows=rows.slice(offset,offset+requestedSize);
  return {rows,total,totalPages:Math.max(1,Math.ceil(total/requestedSize))};
}
function renderPager(total){lastPage=Math.max(0,total-1);let h='<button class="page-btn" '+(page<=0?'disabled':'')+' data-page="'+(page-1)+'"><i class="bi bi-chevron-left"></i></button>';for(let i=Math.max(0,page-2);i<=Math.min(total-1,page+2);i++)h+='<button class="page-btn '+(i===page?'active':'')+'" data-page="'+i+'">'+(i+1)+'</button>';h+='<button class="page-btn" '+(page>=total-1||!total?'disabled':'')+' data-page="'+(page+1)+'"><i class="bi bi-chevron-right"></i></button>';$('pager').innerHTML=h;}
async function load(){const size=Number($('pageSize').value||20);$('rows').innerHTML='<tr><td colspan="7" class="table-empty">Loading...</td></tr>';try{const d=await fetchLogicalPage(page,size),rows=d.rows||[];$('rows').innerHTML=rows.length?rows.map(x=>{let ok=true;try{ok=JSON.parse(x.afterJson||'{}').success!==false}catch(e){}return '<tr><td>'+esc((x.createdAt||'').replace('T',' '))+'</td><td><div class="table-primary">'+esc(x.actor||'SYSTEM')+'</div><small>#'+esc(x.entityId||'-')+'</small></td><td><b>'+esc((x.action||'-').replaceAll('_',' '))+'</b></td><td>'+esc(x.entityType||'-')+'</td><td>'+esc(x.ipAddress||'-')+'</td><td>'+detail(x)+'</td><td><span class="standard-status '+(ok?'active':'inactive')+'"><i></i>'+(ok?'SUCCESS':'FAILED')+'</span></td></tr>'}).join(''):'<tr><td colspan="7" class="table-empty">No operation records found.</td></tr>';const from=rows.length?page*size+1:0,to=page*size+rows.length;$('showing').textContent='Showing '+from+' to '+to+' of '+d.total+' entries';renderPager(d.totalPages);}catch(e){$('rows').innerHTML='<tr><td colspan="7" class="table-empty">'+esc(e.message)+'</td></tr>';}}
$('pager').onclick=e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;page=Number(b.dataset.page);load()};$('pageSize').onchange=()=>{page=0;load()};$('searchBtn').onclick=()=>{page=0;load()};$('refreshBtn').onclick=load;$('resetBtn').onclick=()=>{$('actor').value='';$('action').value='';page=0;load()};load();
})();
