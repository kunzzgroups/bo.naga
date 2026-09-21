(function(){
'use strict';
const base=window.API_BASE||'';
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4});
function today(){
  if(window.BO_FORMAT?.today)return BO_FORMAT.today();
  const d=new Date(),p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
function headers(json){
  const h=Object.assign({},window.BO_AUTH&&BO_AUTH.authHeader?BO_AUTH.authHeader():{});
  const u=window.BO_AUTH&&BO_AUTH.user?BO_AUTH.user():{};
  if(u&&u.username)h['X-Admin-Username']=u.username;
  if(json)h['Content-Type']='application/json';
  return h;
}
async function request(url,opt){
  opt=opt||{};
  opt.headers=Object.assign(headers(!!opt.body),opt.headers||{});
  const r=await fetch(url,opt),j=await r.json().catch(()=>({}));
  if(!r.ok||j.status==='error')throw Error(j.message||'Request failed');
  return j.data;
}
function status(v){
  const x=String(v||'').toUpperCase(),ok=x==='CREDITED',warn=x==='PENDING_APPROVAL'||x==='AVAILABLE';
  return '<span class="standard-status '+(ok?'active':warn?'pending':'inactive')+'"><i></i>'+esc(x.replaceAll('_',' '))+'</span>';
}
function urlParams(){
  const q=new URLSearchParams(location.search||'');
  return{
    memberId:String(q.get('memberId')||'').trim(),
    from:String(q.get('dateFrom')||q.get('from')||'').trim(),
    to:String(q.get('dateTo')||q.get('date')||q.get('to')||'').trim(),
    username:String(q.get('username')||'').trim()
  };
}
function syncRangeInputs(from,to){
  const f=$('detailFrom'),t=$('detailTo');
  if(f)f.value=from||today();
  if(t)t.value=to||from||today();
}
function currentRange(){
  const f=$('detailFrom'),t=$('detailTo');
  const from=(f&&f.value)||today();
  const to=(t&&t.value)||from;
  return{from,to};
}
function listHref(p){
  const q=new URLSearchParams();
  if(p.from)q.set('dateFrom',p.from);
  if(p.to)q.set('dateTo',p.to);
  const s=q.toString();
  return 'manual-rebate-approval.html'+(s?'?'+s:'');
}
function writeUrl(p){
  const q=new URLSearchParams();
  if(p.memberId)q.set('memberId',p.memberId);
  if(p.from)q.set('dateFrom',p.from);
  if(p.to)q.set('dateTo',p.to);
  if(p.to)q.set('date',p.to);
  if(p.username)q.set('username',p.username);
  const next=location.pathname+(q.toString()?'?'+q.toString():'');
  try{history.replaceState(null,'',next);}catch(e){}
}
function setChrome(p){
  const label=p.username?(p.username+' · Member #'+p.memberId):('Member #'+(p.memberId||'—'));
  const title=$('detailPageTitle');
  if(title)title.textContent='Rebate Detail — '+label;
  document.title='Rebate Detail — '+(p.username||('#'+(p.memberId||'')));
  const back=$('detailBack');
  if(back)back.href=listHref(p);
}
async function load(){
  const u=urlParams();
  const range=currentRange();
  const p={memberId:u.memberId,from:range.from,to:range.to,username:u.username};
  setChrome(p);
  writeUrl(p);
  const body=$('detailRows');
  const showing=$('detailShowing');
  if(!p.memberId){
    if(body)body.innerHTML='<tr><td class="table-empty" colspan="7">Missing memberId. Open this page from Manual Rebate Approval.</td></tr>';
    if(showing)showing.textContent='Showing 0 entries';
    return;
  }
  if(!p.from||!p.to)return;
  if(body)body.innerHTML='<tr><td class="table-empty" colspan="7">Loading...</td></tr>';
  try{
    const q=new URLSearchParams({date:p.to,dateFrom:p.from,dateTo:p.to});
    const d=await request(base+'/api/admin/rebate/manual-approval/'+encodeURIComponent(p.memberId)+'/detail?'+q);
    const items=d.items||[];
    if(d.username&&!p.username){
      p.username=String(d.username);
      setChrome(p);
      writeUrl(p);
    }
    if(body){
      body.innerHTML=items.length
        ?items.map(x=>'<tr><td title="'+esc(x.providerCode)+'">'+esc(x.providerCode)+'</td><td title="'+esc(x.gameCategory)+'">'+esc(x.gameCategory)+'</td><td class="num">'+money(x.eligibleValidBet)+'</td><td class="num">'+money(x.effectiveRate)+'%</td><td class="num">'+money(x.rebateAmount)+'</td><td>'+status(x.status)+'</td><td class="ref-cell" title="'+esc(x.referenceNo||'-')+'">'+esc(x.referenceNo||'-')+'</td></tr>').join('')
        :'<tr><td class="table-empty" colspan="7">No records.</td></tr>';
    }
    if(showing)showing.textContent='Showing '+items.length+' '+(items.length===1?'entry':'entries');
  }catch(err){
    if(body)body.innerHTML='<tr><td class="table-empty" colspan="7">'+esc(err.message)+'</td></tr>';
    if(showing)showing.textContent='Showing 0 entries';
    if(window.BO_DIALOG)BO_DIALOG.alert(err.message,{title:'Unable to Load',type:'error'});
  }
}
function onRangeChange(){
  const range=currentRange();
  if(!range.from||!range.to)return;
  load();
}
function bindHeadScrollSync(){
  const head=$('detailTableHead');
  const body=$('detailTableBody');
  if(!head||!body||body.dataset.scrollSync==='1')return;
  body.dataset.scrollSync='1';
  body.addEventListener('scroll',()=>{head.scrollLeft=body.scrollLeft;},{passive:true});
}
(function init(){
  const u=urlParams();
  syncRangeInputs(u.from||today(),u.to||u.from||today());
  const f=$('detailFrom'),t=$('detailTo');
  if(f)f.addEventListener('change',onRangeChange);
  if(t)t.addEventListener('change',onRangeChange);
  bindHeadScrollSync();
  load();
})();
})();
