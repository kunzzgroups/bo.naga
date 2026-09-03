(function(){
  function api(pathKey){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[pathKey]; }
  const markets = ['soccer','basketball','tennis','baseball','parlay','esports','others','cs'];
  const tbody = document.getElementById('limitRows');
  const form = document.getElementById('wbetLimitForm');
  const status = document.getElementById('limitStatus');
  const result = document.getElementById('limitResult');
  function label(v){ return v.charAt(0).toUpperCase() + v.slice(1); }
  function renderDefaults(){
    tbody.innerHTML = markets.map(m => `<tr><td><b>${label(m)}</b></td><td><input class="form-control" data-key="${m}_min_bet" type="number" value="500"></td><td><input class="form-control" data-key="${m}_max_bet" type="number" value="1000"></td><td><input class="form-control" data-key="${m}_max_per_match" type="number" value="10000"></td></tr>`).join('');
  }
  async function postJson(url, body){
    const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }
  if(document.getElementById('resetLimitBtn')) document.getElementById('resetLimitBtn').addEventListener('click', renderDefaults);
  if(form) form.addEventListener('submit', async function(e){
    e.preventDefault();
    const body = { providerCode: document.getElementById('providerCode').value || 'WBET', memberId: Number(document.getElementById('memberId').value || 0) };
    tbody.querySelectorAll('input[data-key]').forEach(input => body[input.dataset.key] = Number(input.value || 0));
    try{
      status.textContent = 'Sending WBET setbetlimit...'; status.className = 'upload-status';
      const json = await postJson(api('WBET_SET_BET_LIMIT'), body);
      status.textContent = json.message || 'Updated'; status.className = 'upload-status success';
      result.textContent = JSON.stringify(json, null, 2);
    }catch(err){ status.textContent = err.message || 'Failed'; status.className='upload-status error'; result.textContent = err.message || 'Failed'; }
  });
  renderDefaults();
})();
