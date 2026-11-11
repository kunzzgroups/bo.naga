#!/usr/bin/env node
/* Local test server: opens EVERY page of this repo on localhost without the real API.

   scripts/serve-static.js serves the files only, so any page bounces to login (no token) and
   every request goes to the production API. This one also injects, at the top of each HTML
   <head>, a small stub that
     - signs you in as a fake ROOT admin (ROOT bypasses the page guard, so every page opens),
     - points API_CONFIG at THIS server and answers every /api/... call with an empty-but-valid
       success response (lists come back empty, so pages render their empty state), and
     - fills the deposit / withdraw lists with a few rows so tables are not empty there.
   Nothing is sent to the real backend, and no repo file is modified.

     node scripts/dev-harness.js [port]            # default 8123

   Then open  http://127.0.0.1:8123/<page>.html
   Theme:     add ?theme=dark or ?theme=light  (also stored in localStorage.bo_theme)
   Examples:  /member-deposit.html?tab=all&theme=dark     /index.html     /main-dashboard.html

   Limits: the sidebar menu is empty (the fake admin has no menu rows), and any screen that needs
   real data shows its empty state. To see real data, use serve-static.js and sign in for real. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const https = require('https');
const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const PORT = Number(ARGS.find((a) => /^\d+$/.test(a)) || 8123);
/* --live: no fake login, no fake data. Pages are served from this repo, and every /api/ request is
   forwarded to the REAL backend (same origin for the browser, so no CORS). You sign in yourself at
   /login.html with your own account. This is the production API: approving/rejecting/saving here
   changes real data. Override the target with BO_UPSTREAM=https://host. */
const LIVE = ARGS.includes('--live');
const UPSTREAM = new URL(process.env.BO_UPSTREAM || 'https://bo.titanx7.com');
const LIVE_STUB = `<script>(function(){try{
  localStorage.setItem('bo_api_base',location.origin+'/api');
  var t=new URLSearchParams(location.search).get('theme'); if(t==='dark'||t==='light') localStorage.setItem('bo_theme',t);
}catch(e){}})();</script>`;
function proxy(req, res) {
  const headers = { ...req.headers, host: UPSTREAM.host };
  delete headers.origin; delete headers.referer;
  const up = https.request({ hostname: UPSTREAM.hostname, port: UPSTREAM.port || 443, method: req.method, path: req.url, headers }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', (e) => { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('proxy error: ' + e.message); });
  req.pipe(up);
}
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

const STUB = `<script>(function(){
try{
  localStorage.setItem('bo_admin_token','dev-harness-token');
  localStorage.setItem('bo_admin_user',JSON.stringify({id:1,username:'JK',displayName:'JK',role:'ROOT',roleType:'ROOT',roleName:'Master Admin',menus:[]}));
  localStorage.setItem('bo_api_base',location.origin+'/api');
  var t=new URLSearchParams(location.search).get('theme'); if(t==='dark'||t==='light') localStorage.setItem('bo_theme',t);
}catch(e){}
/* A hidden browser pane never fires requestAnimationFrame, and several pages start their first load
   inside two of them - so they would sit on "Loading..." forever. Dev server only: use a timer. */
window.requestAnimationFrame=function(cb){return setTimeout(function(){cb(performance.now());},16);};
window.cancelAnimationFrame=function(id){clearTimeout(id);};
var d=new Date(), TD=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
var base=[
 ['10:23:45','0123456787',30,'TEST2'],['01:12:09','testboo',10,'TEST2'],['15:30:11','testboo',15,'Maybank'],
 ['14:50:02','testboo',15,'Hong Leong Bank'],['17:00:30','testboo',50,'TEST BANK']
];
/* 40 rows so "Show entries = -" (fit to screen) has something to fit; the list honours page/size. */
var rows=[];for(var i=0;i<40;i++){var b=base[i%base.length];rows.push({id:i+1,createdAt:TD+'T'+b[0],username:b[1],amount:b[2],bankName:b[3],paymentMethodName:b[3],referenceNo:'DP-'+(1792463116178-i*7919),status:'PENDING',processedAt:null});}
function pageOf(u){var q=new URLSearchParams(u.split('?')[1]||''),size=Number(q.get('size'))||20,page=Number(q.get('page'))||1;return {page:page,size:size,slice:rows.slice((page-1)*size,page*size),total:rows.length,pages:Math.max(1,Math.ceil(rows.length/size))};}
var realFetch=window.fetch;
window.fetch=function(url,opt){
  var u=String(url);
  if(u.indexOf('/api/')<0) return realFetch.apply(this,arguments);
  var list=[], data={content:list,items:list,list:list,rows:list,records:list,totalPages:1,totalElements:0,total:0,page:1,size:20};
  var pg={totalPages:1,totalElements:0,page:1,size:20};
  if(/member-deposit\\/list|member-withdraw\\/list/.test(u)){ var p=pageOf(u); pg={totalPages:p.pages,totalElements:p.total,page:p.page,size:p.size}; data={content:p.slice,items:p.slice,list:p.slice,pagination:pg,totalPages:p.pages,totalElements:p.total,total:p.total,page:p.page,size:p.size}; }
  else if(/payment-method\\/list/.test(u)){ var names=['TEST2','Maybank','Hong Leong Bank','TEST BANK','Test 123','CIMB','Public Bank','RHB'];
    data=[];for(var m=0;m<30;m++){var nm=names[m%names.length]+(m>=names.length?' '+(m+1):'');data.push({id:m+1,name:nm,bankName:nm,displayName:nm,accountName:'Account '+(m+1),accountNumber:'1234567'+(100+m),minAmount:10,maxAmount:m%3===0?0:50000,dailyLimit:m%2?20000:0,status:m%4===3?0:1,visible:true,showOnDeposit:true,isShow:true,bankUsage:m*10});} }
  else if(/payment-gateway\\/list/.test(u)) data={content:[{id:1,gatewayCode:'S1PAY',displayName:'S1PAY',baseUrl:'https://s.s1pay.site',status:1,logoUrl:'',endpoints:[{actionType:'DEPOSIT',enabled:true},{actionType:'WITHDRAW',enabled:true}],channels:[{id:1},{id:2},{id:3},{id:4}]}]};
  else if(/admin\\/rebate\\/rules$|admin\\/rebate\\/rules\\?/.test(u)){ data=[];for(var k=1;k<=24;k++)data.push({id:k,name:'Test '+k,priority:k,providerCode:k%3?'':'PGSOFT',gameCategory:k%2?'':'SLOT',minValidBet:1,maxValidBet:k%4?0:5000,rebateRate:k%5+0.5,maxRebate:k%4?0:200,combinationMode:'HIGHER_RATE',claimMode:k%2?'AUTO':'MANUAL',settlementCycle:'DAILY',status:k%6?1:0}); }
  else if(/admin\\/rebate\\/worker-settings/.test(u)) data={enabled:true,timeZone:'Asia/Kuala_Lumpur',dailyTime:'00:01',weeklyOffDay:'MONDAY',monthlyDay:1};
  /* Manual rebate approval: server-paged, so the fake list honours page/size the way the real one does. */
  else if(/admin\\/rebate\\/manual-approval/.test(u)&&!/\\/approve/.test(u)){
    var qa=new URLSearchParams(u.split('?')[1]||''),sz=Number(qa.get('size'))||20,pgNo=Math.max(0,Number(qa.get('page'))||0),all=[];
    for(var ma=1;ma<=37;ma++){var lv=ma%3?0:12.5,sv=ma*1.8,sc=ma%4?0:3;
      all.push({memberId:100+ma,username:['0123456789','testboo','abc123'][ma%3]+ma,approvable:ma%5!==0,liveValidTurnover:lv,slotValidTurnover:sv,soccerValidTurnover:sc,totalValidTurnover:lv+sv+sc,totalRebateAmount:(lv+sv+sc)/100,status:ma%3===0?'CREDITED':ma%2?'PENDING_APPROVAL':'AVAILABLE'});}
    var sl=all.slice(pgNo*sz,pgNo*sz+sz),tp=Math.max(1,Math.ceil(all.length/sz));
    data={content:sl,totalElements:all.length,totalPages:tp,number:pgNo,numberOfElements:sl.length,size:sz,first:pgNo===0,last:pgNo>=tp-1};
  }
  else if(/admin\\/rebate\\/batches/.test(u)) data=[{id:1,status:'COMPLETED',processedCount:2,businessDate:'2026-10-08'}];
  else if(/auth\\/admin\\/me/.test(u)) data=JSON.parse(localStorage.getItem('bo_admin_user'));
  return Promise.resolve(new Response(JSON.stringify({status:'success',message:'ok',data:data,pagination:pg}),{status:200,headers:{'Content-Type':'application/json'}}));
};
})();</script>`;

http.createServer((req, res) => {
  const p = decodeURIComponent(String(req.url || '/').split('?')[0]);
  if (LIVE && p.startsWith('/api/')) return proxy(req, res);
  if (p.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"status":"success","data":{}}');
  }
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (ext === '.html') return res.end(buf.toString('utf8').replace(/<head>/i, '<head>' + (LIVE ? LIVE_STUB : STUB)));
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log((LIVE ? 'LIVE (real API via ' + UPSTREAM.host + ')' : 'dev harness (fake data)') + ': http://127.0.0.1:' + PORT + (LIVE ? '/login.html' : '/index.html')));
