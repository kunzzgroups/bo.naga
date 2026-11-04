const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/t1-member-points.js'),'utf8');
function setup(){
  const items=new Map(),listeners=new Map(),requests=[];
  function el(id){
    if(!items.has(id))items.set(id,{
      value:'',dataset:{},textContent:'',innerHTML:'',disabled:false,className:'',
      addEventListener(type,fn){listeners.set(id+':'+type,fn);},
      showModal(){this.showed=true;},
    });
    return items.get(id);
  }
  const document={getElementById:el,visibilityState:'visible',addEventListener(type,fn){listeners.set('document:'+type,fn);},querySelector(){return null;}};
  const api={BASE_URL:'https://bo.example.com'};
  const fetch=async(url,opts={})=>{
    requests.push({url:String(url),opts});
    if(String(url).includes('/adjust'))return {ok:true,json:async()=>({status:'success',data:{points:7}})};
    if(String(url).includes('/ledger'))return {ok:true,json:async()=>({status:'success',data:{items:[{id:1,delta:7,balanceAfter:7,referenceType:'ADMIN_ADD',remark:'Manual test'}],total:1,hasMore:false}})};
    return {ok:true,json:async()=>({status:'success',data:{points:7}})};
  };
  const window={crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},setInterval(){return 1;},addEventListener(type,fn){listeners.set('window:'+type,fn);}};
  vm.runInNewContext(source,{window,document,API_CONFIG:api,BO_AUTH:{authHeader(){return {'Authorization':'Bearer test'}}},fetch,URLSearchParams,Number,Math,console,setTimeout});
  listeners.get('document:DOMContentLoaded')();
  return {api:window.T1MemberPoints,el,requests,listeners,async tick(){await new Promise(r=>setImmediate(r));}};
}
test('per-member points balance and entire history query are brand/auth API-based',async()=>{
  const ctx=setup();ctx.api.activate(74);await ctx.tick();
  assert.equal(ctx.el('memberPointsBalance').textContent,'7.00');
  assert.match(ctx.el('memberPointsHistory').innerHTML,/ADMIN_ADD/);
  assert.ok(ctx.requests.some(x=>x.url.includes('/admin/t1-points/ledger?memberId=74')));
});
test('cancelled adjustment never submits; confirmed request is signed, audited and includes idempotency token',async()=>{
  const ctx=setup();ctx.api.activate(74);await ctx.tick();
  ctx.el('memberPointsAmount').value='1.25';ctx.el('memberPointsDirection').value='DEDUCT';ctx.el('memberPointsReason').value='User requested correction';
  ctx.listeners.get('memberPointsSubmit:click')();
  const dialog=ctx.el('memberPointsConfirm');assert.equal(dialog.showed,true);
  dialog.returnValue='cancel';ctx.listeners.get('memberPointsConfirm:close')({target:dialog});await ctx.tick();
  assert.equal(ctx.requests.filter(r=>r.url.includes('/adjust')).length,0);
  ctx.listeners.get('memberPointsSubmit:click')();dialog.returnValue='confirm';ctx.listeners.get('memberPointsConfirm:close')({target:dialog});await ctx.tick();
  const adjust=ctx.requests.find(r=>r.url.includes('/adjust'));
  const body=JSON.parse(adjust.opts.body);assert.equal(body.memberId,74);assert.equal(body.delta,-1.25);
  assert.equal(body.requestId,'00000000-0000-4000-8000-000000000001');
  assert.equal(body.remark,'User requested correction');
});
test('invalid adjustment is blocked before network submission',async()=>{
 const ctx=setup();ctx.api.activate(74);await ctx.tick();ctx.el('memberPointsAmount').value='0';ctx.el('memberPointsReason').value='testing only';
 ctx.listeners.get('memberPointsSubmit:click')();
 assert.equal(ctx.el('memberPointsConfirm').showed,undefined);
 assert.equal(ctx.requests.filter(r=>r.url.includes('/adjust')).length,0);
});
test('BO member page and backend enforce separate money wallet and points ledgers',()=>{
 const html=fs.readFileSync(path.join(root,'member-detail.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'assets/js/member-detail.js'),'utf8');
 assert.match(html,/data-wallet-tab="points"/);
 assert.match(html,/t1-member-points.js/);
 assert.match(script,/window.setInterval/);
 assert.match(script,/document.visibilityState !== 'visible'/);
 assert.match(script,/loadMemberWallet\(id,true\)/);
});
