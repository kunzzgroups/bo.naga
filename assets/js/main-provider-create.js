(function(){
  'use strict';

  const form = document.getElementById('mpvCreateForm');
  const statusEl = document.getElementById('mpvCreateStatus');
  const submitBtn = document.getElementById('mpvCreateSubmit');
  const testBtn = document.getElementById('mpvTestBtn');
  const genBtn = document.getElementById('mpvGenerateKey');
  const ipToggle = document.getElementById('mpvIpWhitelist');
  const ipBlock = document.getElementById('mpvIpBlock');
  const rolePickBtn = document.getElementById('mpvRolePickBtn');
  const roleMenu = document.getElementById('mpvRoleMenu');
  const roleIdEl = document.getElementById('mpvRoleId');
  const roleNameEl = document.getElementById('mpvRoleName');
  const rolePrimaryEl = document.getElementById('mpvRolePrimary');
  const roleDescEl = document.getElementById('mpvRoleDesc');

  const ROLES = [
    {
      id: 'direct',
      name: 'Direct Game Provider',
      primary: true,
      badge: 'Primary Channel',
      desc: 'Standard live game dispatch, round bet settlement, and balance verification webhook permissions assigned.'
    },
    {
      id: 'aggregator',
      name: 'Aggregation Hub',
      primary: false,
      badge: 'Multi-product',
      desc: 'Routes traffic across nested providers with shared wallet bridge and consolidated settlement callbacks.'
    },
    {
      id: 'transfer',
      name: 'Transfer Wallet Provider',
      primary: false,
      badge: 'Transfer',
      desc: 'Fund-in / fund-out transfer wallet mode with explicit launch and balance sync endpoints.'
    }
  ];

  function setStatus(text, cls){
    if(!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 'upload-status mb-3' + (cls ? ' ' + cls : '');
  }

  function randomKey(len){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const arr = new Uint8Array(len || 32);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    let out = '';
    for(let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
    return out;
  }

  function syncIpBlock(){
    if(!ipBlock || !ipToggle) return;
    ipBlock.hidden = !ipToggle.checked;
  }

  function applyRole(role){
    if(!role) return;
    if(roleIdEl) roleIdEl.value = role.id;
    if(roleNameEl) roleNameEl.textContent = role.name;
    if(rolePrimaryEl){
      rolePrimaryEl.textContent = role.badge || '';
      rolePrimaryEl.hidden = !role.badge;
    }
    if(roleDescEl) roleDescEl.textContent = role.desc || '';
  }

  function renderRoleMenu(){
    if(!roleMenu) return;
    roleMenu.innerHTML = ROLES.map(r => {
      const on = roleIdEl && roleIdEl.value === r.id;
      return '<button type="button" class="mac-role-option' + (on ? ' is-active' : '') + '" role="option" data-role-id="' + r.id + '" aria-selected="' + (on ? 'true' : 'false') + '">' +
        '<span class="mac-role-icon" aria-hidden="true"><i class="bi bi-shield-fill"></i></span>' +
        '<span><b>' + r.name + '</b><small>' + r.desc + '</small></span>' +
      '</button>';
    }).join('');
  }

  function closeRoleMenu(){
    if(!roleMenu || !rolePickBtn) return;
    roleMenu.hidden = true;
    rolePickBtn.setAttribute('aria-expanded', 'false');
  }

  function openRoleMenu(){
    if(!roleMenu || !rolePickBtn) return;
    renderRoleMenu();
    roleMenu.hidden = false;
    rolePickBtn.setAttribute('aria-expanded', 'true');
  }

  document.addEventListener('click', e => {
    const toggle = e.target.closest && e.target.closest('[data-toggle-password]');
    if(toggle){
      const id = toggle.getAttribute('data-toggle-password');
      const input = document.getElementById(id);
      if(!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      const icon = toggle.querySelector('i');
      if(icon) icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      return;
    }

    const opt = e.target.closest && e.target.closest('[data-role-id]');
    if(opt && roleMenu && roleMenu.contains(opt)){
      const role = ROLES.find(r => r.id === opt.getAttribute('data-role-id'));
      applyRole(role);
      closeRoleMenu();
      return;
    }

    if(rolePickBtn && (e.target === rolePickBtn || rolePickBtn.contains(e.target))){
      if(roleMenu && roleMenu.hidden) openRoleMenu();
      else closeRoleMenu();
      return;
    }
    if(roleMenu && !roleMenu.hidden && !roleMenu.contains(e.target)) closeRoleMenu();
  });

  genBtn && genBtn.addEventListener('click', () => {
    const key = randomKey(32);
    const a = document.getElementById('mpvSecretKey');
    const b = document.getElementById('mpvConfirmSecret');
    if(a){ a.type = 'text'; a.value = key; }
    if(b){ b.type = 'text'; b.value = key; }
    setStatus('API secret generated. Copy it before leaving this page.', 'text-success');
  });

  ipToggle && ipToggle.addEventListener('change', syncIpBlock);
  syncIpBlock();
  applyRole(ROLES[0]);

  testBtn && testBtn.addEventListener('click', () => {
    setStatus('Testing connection…', '');
    window.setTimeout(() => {
      setStatus('Connection test is a UI stub until the provider API is wired.', 'text-success');
    }, 450);
  });

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const id = (document.getElementById('mpvProviderId') || {}).value || '';
    const name = (document.getElementById('mpvProviderName') || {}).value || '';
    const secret = (document.getElementById('mpvSecretKey') || {}).value || '';
    const confirm = (document.getElementById('mpvConfirmSecret') || {}).value || '';
    if(!id.trim() || !name.trim()){
      setStatus('Provider ID and Provider Name are required.', 'text-danger');
      return;
    }
    if(secret !== confirm){
      setStatus('Confirm secret does not match.', 'text-danger');
      return;
    }
    if(secret.length < 16){
      setStatus('API secret must be at least 16 characters.', 'text-danger');
      return;
    }
    if(submitBtn) submitBtn.disabled = true;
    setStatus('Create Provider form is ready — API wiring comes next.', 'text-success');
    window.setTimeout(() => {
      if(submitBtn) submitBtn.disabled = false;
      location.href = 'main-provider-detail.html';
    }, 700);
  });
})();
