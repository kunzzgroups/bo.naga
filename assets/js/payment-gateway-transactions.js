(function(){
  const $=id=>document.getElementById(id);
  const ep=k=>API_CONFIG.BASE_URL+API_CONFIG.ENDPOINTS[k];
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const auth=()=>({...BO_AUTH.authHeader(),'Content-Type':'application/json','X-Admin-Username':String(BO_AUTH.user()?.username||'ADMIN')});
  async function api(url,opt={}){const res=await fetch(url,{...opt,headers:{...auth(),...(opt.headers||{})}});const j=await res.json().catch(()=>({}));if(!res.ok||j.status==='error')throw new Error(j.message||'Request failed');return j;}
  function notify(msg,type){if(window.BO_DIALOG)BO_DIALOG.alert(msg,{title:type==='error'?'Gateway Transaction Error':'Gateway Transactions',type:type||'success'});else alert(msg);}
  function statusClass(status){const s=String(status||'').toUpperCase();if(s==='SUCCESS')return 'on';if(['FAILED','REJECTED','VOIDED'].includes(s))return 'off';return '';}
  async function loadTx(){
    const body=$('pgTxBody'), count=$('pgTxRecordCount');
    body.innerHTML='<tr><td colspan="8" class="pg-empty">Loading...</td></tr>';count.textContent='Loading records...';
    try{
      const j=await api(ep('PAYMENT_GATEWAY_TRANSACTIONS')+'?page=1&size=30');
      const rows=(j.data&&j.data.content)||[];
      body.innerHTML=rows.length?rows.map(t=>`<tr><td>${esc(String(t.createdAt||'').replace('T',' ').slice(0,19))}</td><td>${esc(t.direction||'-')}</td><td class="gateway-tx-ref">${esc(t.referenceId||'-')}</td><td>${esc(t.memberId||'-')}</td><td>${esc(t.amount)} ${esc(t.currency||'')}</td><td><span class="pg-pill gateway-tx-status ${statusClass(t.status)}">${esc(t.status||'-')}</span></td><td class="gateway-tx-ref">${esc(t.providerTransactionId||'-')}</td><td><button class="clean-btn gateway-tx-action" type="button" data-check-status="${t.id}"><i class="bi bi-arrow-repeat"></i> Check</button></td></tr>`).join(''):'<tr><td colspan="8" class="pg-empty">No gateway transactions yet.</td></tr>';
      count.textContent=rows.length+' recent transaction'+(rows.length===1?'':'s');
    }catch(e){body.innerHTML='<tr><td colspan="8" class="pg-empty">'+esc(e.message)+'</td></tr>';count.textContent='Unable to load records';}
  }
  async function checkStatus(id){try{const j=await api(ep('PAYMENT_GATEWAY_STATUS_CHECK')+'/'+encodeURIComponent(id)+'/status',{method:'POST',body:'{}'});notify(j.message||'Status checked.');await loadTx();}catch(e){notify(e.message,'error');}}
  document.addEventListener('click',e=>{const st=e.target.closest('[data-check-status]');if(st){e.preventDefault();checkStatus(st.dataset.checkStatus);}});
  document.addEventListener('DOMContentLoaded',()=>{$('pgTxRefresh').addEventListener('click',loadTx);loadTx();});
})();
