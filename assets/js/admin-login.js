(function(){
  const form = document.getElementById('adminLoginForm');
  const btn = document.getElementById('adminLoginBtn');
  const status = document.getElementById('adminLoginStatus');

  function setStatus(message, type){
    status.textContent = message || '';
    status.className = 'upload-status mb-3 ' + (type || '');
  }

  if(form){
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      btn.disabled = true;
      setStatus('Logging in...', '');
      try{
        const res = await fetch(BO_AUTH.loginUrl(), {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            username: document.getElementById('adminUsername').value.trim(),
            password: document.getElementById('adminPassword').value
          })
        });
        const json = await res.json().catch(() => ({}));
        if(!res.ok || json.status === 'error') throw new Error(json.message || 'Login failed');
        BO_AUTH.save(json);
        window.location.href = 'index.html';
      }catch(err){
        setStatus(err.message || 'Login failed', 'error');
      }finally{
        btn.disabled = false;
      }
    });
  }
})();
