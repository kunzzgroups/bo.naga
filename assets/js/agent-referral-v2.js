(function(){'use strict';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt=v=>Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:4});
const kind=$('r2PortalTitle')?.dataset.r2Portal||'agent';
const token=kind==='agent'?localStorage.getItem('agent_token'):localStorage.getItem('bo_admin_token');
const apiBase=String(window.API_CONFIG?.BASE_URL||'/api').replace(/\/$/,'');
const cell=v=>'<td>'+esc(v)+'</td>';
const renderRows=(id,values,make,columns)=>{$(id).innerHTML=values.length?values.map(make).join(''):'<tr><td colspan="'+columns+'">No records</td></tr>';};
const referralList=(v)=>Array.isArray(v)?v:[];
function renderReferralNetwork(d,p){
 const direct=referralList(d.directReferrals);
 const network=referralList(d.referralNetwork);
 const directEl=$('r2DirectReferrals'),networkEl=$('r2ReferralNetwork');
 const note=$('r2ReferralNetworkNote');
 if(!directEl||!networkEl)return;
 const hasLists=Array.isArray(d.directReferrals)&&Array.isArray(d.referralNetwork);
 if(note)note.textContent=hasLists?'Showing referrals associated with your Agent account only.':'Referral names are unavailable from the current API version. Please update the Referral V2 backend.';
 const directIds=new Set(direct.map(x=>String(x.id)));
 const byId=new Map(network.map(x=>[String(x.id),x]));
 const depthOf=(item)=>{
  let depth=1,parent=String(item.parent_id??''),seen=new Set([String(item.id)]);
  while(parent&&parent!==String(p.id)&&byId.has(parent)&&!seen.has(parent)){
   seen.add(parent);depth++;parent=String(byId.get(parent).parent_id??'');
  }
  return depth;
 };
 const rows=(items,withLevel)=>items.map(item=>{
  const kind=String(item.kind||'').toUpperCase();
  const status=item.active===true||item.active===1||item.active==='1'?'Active':'Inactive';
  const fields=[item.display_name||'-',kind==='AGENT'?'Agent':kind==='MERCHANT'?'Merchant':kind||'-','#'+item.id];
  if(withLevel)fields.push(depthOf(item));
  fields.push(status);
  return '<tr>'+fields.map(cell).join('')+'</tr>';
 });
 const directRows=rows(direct,false),networkRows=rows(network,true);
 directEl.innerHTML=directRows.length?directRows.join(''):'<tr><td colspan="4">No direct referrals found.</td></tr>';
 networkEl.innerHTML=networkRows.length?networkRows.join(''):'<tr><td colspan="5">No downline referrals found.</td></tr>';
 const directCount=$('r2DirectCount'),networkCount=$('r2NetworkCount');
 if(directCount)directCount.textContent=String(direct.length);
 if(networkCount)networkCount.textContent=String(network.length);
}
async function load(){if(!token)throw Error('Please log in to your '+kind+' account first.');
 const r=await fetch(apiBase+'/admin/referral-v2/portal/'+kind,{headers:{Authorization:'Bearer '+token},cache:'no-store'}),data=await r.json().catch(()=>({}));
 if(!r.ok||data.status!=='success')throw Error(data.message||data.detail||'Referral portal is not available');
 const d=data.data,p=d.participant,w=d.wallet||{};
 const metrics=[['Direct agents',d.directAgents],['Direct merchants',d.directMerchants],['All downline agents',d.totalAgents],['All downline merchants',d.totalMerchants],['Referral wallet RM',fmt(w.balance)],['Available RM',fmt(w.available)]];
 $('r2PortalMetrics').innerHTML=metrics.map(([k,v])=>'<div class="col-md-4"><div class="card p-3 h-100"><span>'+esc(k)+'</span><strong class="fs-4">'+esc(v)+'</strong></div></div>').join('');
 $('r2PortalProfile').textContent=p.display_name+' | '+p.kind+' | Member #'+p.id+' | Upstream referrer #'+(p.parent_id??'none');
 renderReferralNetwork(d,p);

 renderRows('r2PortalLedger',d.commissionHistory,l=>'<tr>'+[l.created_at,l.entry_type,fmt(l.amount),fmt(l.reserved_delta),l.event_key].map(cell).join('')+'</tr>',5);
 renderRows('r2PortalPayouts',d.payoutHistory,w=>'<tr>'+[w.reference,fmt(w.amount),w.status,w.payout_reference||'-'].map(cell).join('')+'</tr>',4);
 $('r2PortalStatus').textContent='Referral records loaded';
}
$('r2PortalWithdraw')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const payload=Object.fromEntries(new FormData(form));
 if(!window.confirm('Request a withdrawal of RM '+payload.amount+' from your referral wallet?'))return;
 try{const r=await fetch(apiBase+'/admin/referral-v2/portal/withdrawals',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const data=await r.json().catch(()=>({}));if(!r.ok||data.status!=='success')throw Error(data.message||data.detail||'Withdrawal failed');
 form.reset();await load();$('r2PortalStatus').textContent='Withdrawal requested for approval';}
 catch(err){$('r2PortalStatus').textContent=err.message;$('r2PortalStatus').className='alert alert-danger mt-3';}
});
load().catch(err=>{$('r2PortalStatus').className='alert alert-danger mt-3';$('r2PortalStatus').textContent=err.message;});
})();
