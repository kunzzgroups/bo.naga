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
  else if(/member-wallet\\/list/.test(u)){ var wsz=Number((u.match(/[?&]size=(\\d+)/)||[])[1])||20, wpg=Number((u.match(/[?&]page=(\\d+)/)||[])[1])||1; var wall=[]; var wn=['testboo','abc123','01234567','longusername_member_'];for(var q=1;q<=62;q++){var bet=q%4?q*1234.5:0; wall.push({memberId:100+q,username:wn[q%4]+q,mainWalletBalance:q*53.2,totalBalance:q*91.7,totalDeposit:q*500,totalWithdraw:q*120,totalTransferIn:q*10,totalTransferOut:q*4,totalBet:bet,totalWin:bet*0.9,totalLose:bet*0.1,winLoss:q%2?-q*3.3:q*7.1,totalAdjustment:q%3?0:q*11,totalBonus:q%5?0:q*2,dailyRebate:q%4?0:q*0.34});} var wpages=Math.ceil(wall.length/wsz); pg={totalPages:wpages,totalElements:wall.length,page:wpg,size:wsz}; var wsl=wall.slice((wpg-1)*wsz,wpg*wsz); data={content:wsl,items:wsl,list:wsl,rows:wsl,records:wsl,pagination:pg,totalPages:wpages,totalElements:wall.length,total:wall.length,page:wpg,size:wsz}; }
  else if(/wallet-ledger\\/list/.test(u)){ var lsz=Number((u.match(/[?&]size=(\\d+)/)||[])[1])||20, lpg=Number((u.match(/[?&]page=(\\d+)/)||[])[1])||1; var lall=[]; var types=['DEPOSIT','WITHDRAW','ADJUSTMENT','BONUS','REBATE','TRANSFER_IN','BET','WIN']; var provs=['MAIN','PGSOFT','PRAGMATIC_PLAY','EPICWIN']; var reasons=['MANUAL_CORRECTION','PROMO_BONUS_CREDIT','Deposit approved by operator','']; for(var q=1;q<=60;q++){lall.push({id:q,createdAt:'2026-11-11T0'+(q%9)+':1'+(q%6)+':27',postedAt:'2026-11-11T0'+(q%9)+':2'+(q%6)+':05',username:(q%3?'testboo':'longusername_member_')+q,providerCode:provs[q%4],ledgerType:types[q%8],amount:q%2?q*37.5:-q*12.25,beforeBalance:q*500,afterBalance:q*500+(q%2?q*37.5:-q*12.25),gameCode:q%4?'':'sweet-bonanza-1000',createdBy:q%5?'SYSTEM':'admin.operator',approvedBy:q%3?'':'root',reasonCode:reasons[q%4],relatedId:q%2?'DP-17924631161'+q:'WD-'+q,remark:q%3?'':'Customer asked for a correction after the weekend promotion ended',status:q%7?'POSTED':'PENDING'});} var lpages=Math.ceil(lall.length/lsz); pg={totalPages:lpages,totalElements:lall.length,page:lpg,size:lsz}; var lsl=lall.slice((lpg-1)*lsz,lpg*lsz); data={content:lsl,items:lsl,list:lsl,rows:lsl,records:lsl,pagination:pg,totalPages:lpages,totalElements:lall.length,total:lall.length,page:lpg,size:lsz}; }
  else if(/bonus-category-title\\?/.test(u)){ data=[]; var cn=['Welcome Bonus','Deposit Bonus','Daily Reload & Cashback Specials','Referral Rewards','VIP Exclusive Birthday and Anniversary Gifts']; for(var c=1;c<=5;c++)data.push({id:c,name:cn[c-1],sortOrder:c,imageUrl:''}); }
  else if(/admin\\/promotion\\/list/.test(u)){ data=[]; var pn=['First Deposit 100% Match up to 500','Weekly Reload 20%','Cashback Every Monday','Invite A Friend And Both Of You Receive A Bonus Credit Instantly','VIP Birthday Gift','Slot Tournament Prize Pool','Lucky Spin Free Credit','Refer Bonus Tier 2']; for(var r=1;r<=14;r++)data.push({id:r,bonusCategoryTitleId:(r%5)+1,name:pn[r%8]+(r>8?' '+r:''),promotionCode:'PROMO-'+(1000+r),displayOrder:r,status:r%4?1:2,claimCondition:r%3?'MANUAL':'AUTO_ON_DEPOSIT',bonusType:r%2?'PERCENT':'FIXED',rebatePolicy:r%3?'DISABLED':'STANDARD',description:'Terms and conditions apply to this promotion, please read the full rules before claiming.'}); }
  else if(/admin\\/vip\\/levels(?:\\?[^/]*)?$/.test(u)){ data=[]; var vn=['Bronze','Silver','Gold','Platinum','Diamond','Master','Grandmaster','Legendary Elite Circle']; for(var v=1;v<=8;v++)data.push({id:v,sortOrder:v,name:vn[v-1],levelKey:'VIP'+v+'_'+vn[v-1].toUpperCase().replace(/ /g,'_'),imageUrl:'',stepCount:v+1,tierExperienceRequired:v*v*10000,requiredExperience:v*v*5000,depositRequirement:v*1000.5,rebateLiveCasino:(v*0.1).toFixed(1),rebateSportsbook:(v*0.1).toFixed(1),rebateSlots:(v*0.15).toFixed(2),oneTimeBonus:v*88,monthlyBonus:v*288.5,weeklyBonus:v*58,enabled:v%5?1:0}); }
  else if(/admin\\/vip\\/experience-settings/.test(u)){ data={depositEnabled:1,depositAmountPerExp:1,validBetEnabled:1,validBetPerExp:1,registrationEnabled:1,registrationExp:100,firstDepositEnabled:1,firstDepositExp:200,dailyLoginEnabled:1,dailyLoginExp:5,dailyCap:0}; }
  else if(/admin\\/vip\\/levels\\/\\d+\\/steps/.test(u)){ data=[]; var sn=['Bronze I','Bronze II - Rising Player With A Long Step Name','Bronze III']; for(var t=1;t<=3;t++)data.push({id:t,stepKey:'step-'+t,name:sn[t-1],requiredExperience:t*2500,rewardAmount:t*18,turnoverMultiplier:t,maxWithdrawal:t*500,depositBonusPercent:t*5,rewardDescription:'Reward credited once when this step is reached. Wagering applies before withdrawal.',enabled:1,sortOrder:t}); }
  else if(/admin\\/vip\\/experience-logs(?!\\/)/.test(u)){ var esz=Number((u.match(/[?&]size=(\\d+)/)||[])[1])||20, epg=Number((u.match(/[?&]page=(\\d+)/)||[])[1])||1; var eall=[]; var srcs=['DEPOSIT','VALID_BET','REGISTRATION','FIRST_DEPOSIT','DAILY_LOGIN','MANUAL','PROMOTION']; var rems=['','Deposit approved','Manual correction after the weekend promotion ended, approved by the shift lead','']; for(var q=1;q<=57;q++){var ch=q%7===5?-q*10:q*125; eall.push({id:q,createdAt:'2026-11-1'+(q%2)+'T0'+(q%9)+':1'+(q%6)+':27',memberId:100+q,username:(q%3?'testboo':'longusername_member_')+q,mobile:'01100000'+(10+q),sourceType:srcs[q%7],experienceChange:ch,balanceBefore:q*1000,balanceAfter:q*1000+ch,referenceId:q%2?'DP-17924631161'+q:'',remark:rems[q%4]});} var epages=Math.ceil(eall.length/esz); var esl=eall.slice((epg-1)*esz,epg*esz); data={content:esl,pagination:{totalPages:epages,totalElements:eall.length,page:epg,size:esz}}; }
  else if(/payment-gateway\\/list/.test(u)) data={content:[{id:1,gatewayCode:'S1PAY',displayName:'S1PAY',baseUrl:'https://s.s1pay.site',status:1,logoUrl:'',endpoints:[{actionType:'DEPOSIT',enabled:true},{actionType:'WITHDRAW',enabled:true}],channels:[{id:1},{id:2},{id:3},{id:4}]}]};
  else if(/admin\\/rebate\\/rules$|admin\\/rebate\\/rules\\?/.test(u)){ data=[];for(var k=1;k<=24;k++)data.push({id:k,name:'Test '+k,priority:k,providerCode:k%3?'':'PGSOFT',gameCategory:k%2?'':'SLOT',minValidBet:1,maxValidBet:k%4?0:5000,rebateRate:k%5+0.5,maxRebate:k%4?0:200,combinationMode:'HIGHER_RATE',claimMode:k%2?'AUTO':'MANUAL',settlementCycle:'DAILY',status:k%6?1:0}); }
  else if(/admin\\/rebate\\/audit/.test(u)){ var sz=Number((u.match(/[?&]size=(\\d+)/)||[])[1])||20, pgn=Number((u.match(/[?&]page=(\\d+)/)||[])[1])||0; var all=[]; var details=['VIEW ADMIN — Page: Game Provider','UPDATE PROVIDER — Code: EPICWIN — Changed: provider Image Url=https://static.titanx7.com/uploads/media/a15a66e3-2fc5-4c64-ac7b-a8eb802ec920.png, provider Brand Image Url=https://static.titanx7.com/uploads/media/f09e08b7-f634-42f6-a7c3-227228d31d63.png — Page: Create Provider','LOGIN — Page: Admin Login','UPDATE RULE — Name: Test 1 — Changed: rebateRate 1 -> 1.5']; for(var q=0;q<80;q++)all.push({id:q+1,createdAt:TD+'T10:'+String(q%60).padStart(2,'0')+':00',entityType:'ADMIN_OPERATION',entityId:27-(q%9),action:['VIEW_ADMIN','UPDATE_PROVIDER','LOGIN','UPDATE_RULE'][q%4],actor:'t'+(10+q%3),ipAddress:'60.53.182.26',detail:details[q%4]}); data={content:all.slice(pgn*sz,pgn*sz+sz),totalElements:all.length,totalPages:Math.ceil(all.length/sz)}; }
  else if(/admin\\/rebate\\/reconciliations/.test(u)){ var rsz=Number((u.match(/[?&]size=(\\d+)/)||[])[1])||20, rpg=Number((u.match(/[?&]page=(\\d+)/)||[])[1])||0; var rall=[]; var provs=['PGSOFT','EPICWIN','PRAGMATIC_PLAY','JILI']; var sts=['MISMATCH','MATCHED','PENDING_REVIEW','MISMATCH']; var rdet=['Provider balance differs from the expected wallet total after settlement','Matched','Provider reported 1,204,500.35 but the ledger expects 1,204,512.35 — 12.00 short on bonus wallet; session closed manually by SYSTEM_CATCHUP after the provider callback timed out','Retry scheduled']; for(var rq=0;rq<60;rq++)rall.push({id:rq+1,createdAt:TD+'T09:'+String(rq%60).padStart(2,'0')+':00',sessionId:rq%3===0?'1048576123456789012':String(884000+rq),memberId:rq%2?String(10000+rq):'8123456789',providerCode:provs[rq%4],expectedMain:[1204512.35,88.5,0,15230.1][rq%4],expectedBonus:[12.0,0,250,0][rq%4],actualProviderBalance:[1204500.35,88.5,0,15230.1][rq%4],differenceAmount:[-12,0,-250.5,0][rq%4],status:sts[rq%4],detail:rdet[rq%4]}); data={content:rall.slice(rpg*rsz,rpg*rsz+rsz),totalElements:rall.length,totalPages:Math.ceil(rall.length/rsz)}; }
  else if(/admin\\/rebate\\/worker-settings/.test(u)) data={enabled:true,timeZone:'Asia/Kuala_Lumpur',dailyTime:'00:01',weeklyOffDay:'MONDAY',monthlyDay:1};
  /* Manual rebate approval: server-paged, so the fake list honours page/size the way the real one does. */
  else if(/admin\\/rebate\\/manual-approval/.test(u)&&!/\\/approve/.test(u)){
    var qa=new URLSearchParams(u.split('?')[1]||''),sz=Number(qa.get('size'))||20,pgNo=Math.max(0,Number(qa.get('page'))||0),all=[];
    for(var ma=1;ma<=37;ma++){var lv=ma%3?0:12.5,sv=ma*1.8,sc=ma%4?0:3;
      all.push({memberId:100+ma,username:['0123456789','testboo','abc123'][ma%3]+ma,approvable:ma%5!==0,liveValidTurnover:lv,slotValidTurnover:sv,soccerValidTurnover:sc,totalValidTurnover:lv+sv+sc,totalRebateAmount:(lv+sv+sc)/100,status:ma%3===0?'CREDITED':ma%2?'PENDING_APPROVAL':'AVAILABLE'});}
    var sl=all.slice(pgNo*sz,pgNo*sz+sz),tp=Math.max(1,Math.ceil(all.length/sz));
    data={content:sl,totalElements:all.length,totalPages:tp,number:pgNo,numberOfElements:sl.length,size:sz,first:pgNo===0,last:pgNo>=tp-1};
  }
  /* Rebate log: server-paged like the real feed, 37 rows so a fitted size has something to fit. */
  else if(/admin\\/rebate\\/logs/.test(u)){
    var ql=new URLSearchParams(u.split('?')[1]||''),szl=Number(ql.get('size'))||20,pgl=Math.max(0,Number(ql.get('page'))||0),lg=[];
    for(var lgi=1;lgi<=37;lgi++){var tvb=50+lgi*7.5,elig=tvb*0.98,lock=lgi%4?0:3.25;
      lg.push({periodDate:'2026-10-'+(String(8+ (lgi%20)).padStart(2,'0')),memberId:100+lgi,providerCode:['PGSOFT','PLAYTECH','ALL'][lgi%3],gameCategory:['SLOT','LIVE','ALL'][lgi%3],totalValidBet:tvb,eligibleValidBet:elig,lockedValidBet:lock,providerRate:0.5,vipRate:lgi%2?0:0.2,effectiveRate:lgi%2?0.5:0.7,combinationMode:lgi%2?'HIGHER_RATE':'SUM',rebateAmount:elig*0.005,status:['CALCULATED','AVAILABLE','CREDITED','CLAIM_LOCKED'][lgi%4],referenceNo:'RB-202610-'+String(1000+lgi)});}
    var lsl=lg.slice(pgl*szl,pgl*szl+szl),ltp=Math.max(1,Math.ceil(lg.length/szl));
    data={content:lsl,totalElements:lg.length,totalPages:ltp,number:pgl,numberOfElements:lsl.length,size:szl,first:pgl===0,last:pgl>=ltp-1};
  }
  /* --- lists for the pages under audit (admin-operation-log, online-users, referral) --- */
  else if(/admin\\/rebate\\/audit/.test(u)){
    var qau=new URLSearchParams(u.split('?')[1]||''),szu=Number(qau.get('size'))||20,pgu=Math.max(0,Number(qau.get('page'))||0),au=[];
    for(var aui=1;aui<=37;aui++){au.push({id:aui,createdAt:'2026-10-'+String(8+(aui%20)).padStart(2,'0')+'T10:2'+ (aui%10) +':11',entityType:['REBATE_RULE','MANUAL_REBATE_APPROVAL','ADMIN_OPERATION'][aui%3],entityId:aui,action:['UPDATE_GAME_CATEGORY','MANUAL_REBATE_APPROVAL','CREATE_REBATE_RULE'][aui%3],actor:['JK','SYSTEM','ops1'][aui%3],ipAddress:'10.0.'+(aui%200)+'.'+(aui%250),detail:'Changed setting '+aui,beforeJson:'{"a":1}',afterJson:'{"a":2}'});}
    var asl=au.slice(pgu*szu,pgu*szu+szu),atp=Math.max(1,Math.ceil(au.length/szu));
    data={content:asl,totalElements:au.length,totalPages:atp,number:pgu,numberOfElements:asl.length,size:szu};
  }
  else if(/admin\\/member\\/online/.test(u)){
    var onl=[];for(var oi=1;oi<=30;oi++)onl.push({memberId:100+oi,lastSeenAt:new Date(Date.now()-oi*61000).toISOString()});
    data={content:onl,totalElements:onl.length};
  }
  else if(/admin\\/member\\/wallet\\/list/.test(u)){
    var wal=[];for(var wi=1;wi<=30;wi++)wal.push({memberId:100+wi,mainBalance:100+wi*3.5,bonusBalance:wi});
    data={content:wal,totalElements:wal.length};
  }
  else if(/admin\\/member\\/list/.test(u)){
    var mls=[];for(var mi=1;mi<=30;mi++)mls.push({id:100+mi,memberId:100+mi,username:['0123456789','testboo','abc123'][mi%3]+mi,fullName:'Member '+mi,mobile:'01'+String(10000000+mi*37),referrerCode:'AG'+(mi%4),status:mi%5?'ACTIVE':'LOCKED',locked:mi%7===0,agentName:'Agent '+(mi%4),bankName:['Maybank','CIMB','RHB'][mi%3],createdAt:'2026-0'+(1+mi%9)+'-1'+(mi%9)});
    data=mls;
  }
  else if(/admin\\/referral\\/list/.test(u)){
    var rfl=[];for(var ri=1;ri<=40;ri++)rfl.push({id:200+ri,memberId:200+ri,username:['0123456789','testboo','abc123','refuser'][ri%4]+ri,mobile:'01'+String(20000000+ri*41),referrerCode:'AG'+(ri%5),level1Count:ri%9,l1Count:ri%9,totalDownline:ri%23,createdAt:new Date(Date.now()-(ri%3)*86400000).toISOString().slice(0,10),registerDate:new Date(Date.now()-(ri%3)*86400000).toISOString().slice(0,10),status:ri%5?'ACTIVE':'LOCKED'});
    data=rfl;
  }
  else if(/admin\\/rebate\\/batches/.test(u)){ data=[]; var ids=[1048576123456789012,1011,960,951,893,886]; for(var bq=0;bq<49;bq++){ var bid=bq<ids.length?ids[bq]:880-bq; data.push({id:bid,status:'COMPLETED',settlementDate:'2026-10-'+String(Math.max(1,8-bq)).padStart(2,'0'),processedCount:[2,1,17,0,22,60][bq%6],successCount:[2,1,17,0,22,60][bq%6],failedCount:0,totalRebate:[0.252,0.09,0.0795,0,0,0][bq%6],startedAt:'2026-10-'+String(Math.max(1,9-bq)).padStart(2,'0')+'T00:01:00',completedAt:'2026-10-'+String(Math.max(1,9-bq)).padStart(2,'0')+'T00:01:03',createdBy:bq%4===3?'admin2':'SYSTEM_CATCHUP'}); } }
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
