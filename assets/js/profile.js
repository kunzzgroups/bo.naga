(function(){
  const form = document.getElementById('profileForm');
  const statusEl = document.getElementById('profileStatus');
  function setStatus(message, type){ statusEl.textContent = message || ''; statusEl.className = 'upload-status mb-3 ' + (type || ''); }
  function fill(user){
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileDisplayName').value = user.displayName || '';
    document.getElementById('profileAdminId').textContent = user.id || '-';
    document.getElementById('profileAdminStatus').textContent = Number(user.status) === 1 ? 'Active' : 'Inactive';
  }
  BO_AUTH.refreshMe().then(user => fill(user || BO_AUTH.user()));
  form && form.addEventListener('submit', async function(e){
    e.preventDefault(); setStatus('Saving profile...', '');
    try{
      const res = await fetch(BO_AUTH.profileUpdateUrl(), {
        method:'POST', headers:{'Content-Type':'application/json', ...BO_AUTH.authHeader()},
        body: JSON.stringify({ username: document.getElementById('profileUsername').value.trim(), displayName: document.getElementById('profileDisplayName').value.trim() })
      });
      const json = await res.json().catch(() => ({}));
      if(!res.ok || json.status === 'error') throw new Error(json.message || 'Update profile failed');
      BO_AUTH.saveUser(json.data || {}); fill(json.data || {}); setStatus(json.message || 'Profile updated successfully', 'success');
    }catch(err){ setStatus(err.message || 'Update profile failed', 'error'); }
  });
})();
