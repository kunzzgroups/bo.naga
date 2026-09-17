(function(){
  const form = document.getElementById('templateForm');
  const idInput = document.getElementById('templateId');
  const titleInput = document.getElementById('templateTitle');
  const messageInput = document.getElementById('templateMessage');
  const sortInput = document.getElementById('templateSortOrder');
  const statusInput = document.getElementById('templateStatus');
  const statusText = document.getElementById('templateStatusText');
  const listEl = document.getElementById('templateList');
  const resetBtn = document.getElementById('templateResetBtn');
  const refreshBtn = document.getElementById('templateRefreshBtn');
  const formTitle = document.getElementById('templateFormTitle');
  const searchInput = document.getElementById('templateSearch');
  const saveBtn = document.getElementById('templateSaveBtn');
  const formHint = document.querySelector('.template-form-card .template-pane-head p');

  let db = null;
  let unsubscribe = null;
  let templates = [];
  let editingId = '';

  const DEFAULT_TEMPLATES = [
    {title:'Greeting', message:'Hi dear, how can I help you?', sortOrder:10, status:1},
    {title:'Need Screenshot', message:'Please provide your username and issue screenshot.', sortOrder:20, status:1},
    {title:'Deposit Delay', message:'Deposit usually takes a few minutes to update. Please wait a while and refresh.', sortOrder:30, status:1},
    {title:'Withdrawal Processing', message:'Withdrawal is processing. We will update you once completed.', sortOrder:40, status:1},
    {title:'Checking', message:'Thank you dear. We will check and reply shortly.', sortOrder:50, status:1}
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    bindEvents();
    if(!initFirebase()){
      setStatus('Firebase not configured. Update assets/js/firebase-config.js first.', true);
      renderList(getLocalTemplates());
      return;
    }
    listenTemplates();
  }

  function initFirebase(){
    if(!window.firebase || !window.NAGA_FIREBASE_CONFIG || window.NAGA_FIREBASE_CONFIG.apiKey === 'YOUR_FIREBASE_API_KEY') return false;
    if(!firebase.apps.length) firebase.initializeApp(window.NAGA_FIREBASE_CONFIG);
    db = firebase.firestore();
    return true;
  }

  function bindEvents(){
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        saveTemplate();
      });
    }
    if(resetBtn) resetBtn.addEventListener('click', resetForm);
    if(refreshBtn) refreshBtn.addEventListener('click', function(){ if(db) listenTemplates(); else renderList(getLocalTemplates()); });
    if(searchInput) searchInput.addEventListener('input', function(){ renderList(templates); });
  }

  function listenTemplates(){
  if(!db) return;

  if(unsubscribe) unsubscribe();

  listEl.innerHTML = '<div class="livechat-empty"><span class="livechat-empty-icon"><i class="bi bi-chat-square-text"></i></span><strong>Loading templates</strong></div>';

  unsubscribe = db.collection('livechat_templates')
    .onSnapshot(async function(snapshot){

      templates = [];

      snapshot.forEach(function(doc){
        templates.push(
          Object.assign(
            { id: doc.id },
            doc.data() || {}
          )
        );
      });

      if(!templates.length){
        await seedDefaultTemplates();
        return;
      }

      templates.sort(function(a,b){

        const sortA = Number(a.sortOrder || 0);
        const sortB = Number(b.sortOrder || 0);

        if(sortA !== sortB){
          return sortA - sortB;
        }

        const timeA = a.createdAt && a.createdAt.seconds
          ? a.createdAt.seconds
          : 0;

        const timeB = b.createdAt && b.createdAt.seconds
          ? b.createdAt.seconds
          : 0;

        return timeB - timeA;
      });

      renderList(templates);
      if(!editingId && sortInput && !titleInput.value && !messageInput.value && (!sortInput.value || sortInput.value === '0')){
        sortInput.value = String(nextSortOrder());
      }

    }, function(error){

      setStatus(
        error.message || 'Unable to load template messages.',
        true
      );

      renderList(getLocalTemplates());

    });
}

  async function seedDefaultTemplates(){
    if(!db) return;
    const batch = db.batch();
    DEFAULT_TEMPLATES.forEach(function(t){
      const ref = db.collection('livechat_templates').doc();
      batch.set(ref, Object.assign({}, t, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
    });
    await batch.commit();
  }

  async function saveTemplate(){
    const title = (titleInput.value || '').trim();
    const message = (messageInput.value || '').replace(/\r\n/g, '\n').trim();
    const sortOrder = Number(sortInput.value || 0);
    const status = Number(statusInput.value || 1);
    if(!title){ setStatus('Please enter template title.', true); titleInput.focus(); return; }
    if(!message){ setStatus('Please enter template message.', true); messageInput.focus(); return; }

    const payload = {
      title:title,
      message:message,
      sortOrder:sortOrder,
      status:status,
      updatedAt: db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    try{
      if(db){
        if(idInput.value){
          await db.collection('livechat_templates').doc(idInput.value).set(payload, {merge:true});
          setStatus('Template updated.');
        }else{
          payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('livechat_templates').add(payload);
          setStatus('Template added.');
        }
      }else{
        saveLocalTemplate(payload, idInput.value);
        renderList(getLocalTemplates());
        setStatus('Template saved locally.');
      }
      resetForm();
    }catch(e){
      setStatus(e.message || 'Save failed.', true);
    }
  }

  async function deleteTemplate(id){
    if(!id) return;
    if(!(await BO_DIALOG.confirm('Delete this template?', {title:'Delete Template', confirmText:'Delete'}))) return;
    try{
      if(db){
        await db.collection('livechat_templates').doc(id).delete();
        setStatus('Template deleted.');
      }else{
        deleteLocalTemplate(id);
        renderList(getLocalTemplates());
        setStatus('Template deleted locally.');
      }
      if(idInput.value === id) resetForm();
    }catch(e){ setStatus(e.message || 'Delete failed.', true); }
  }

  function editTemplate(id){
    const t = templates.find(function(x){ return x.id === id; }) || getLocalTemplates().find(function(x){ return x.id === id; });
    if(!t) return;
    idInput.value = t.id || '';
    titleInput.value = t.title || '';
    messageInput.value = t.message || '';
    sortInput.value = Number(t.sortOrder || 0);
    statusInput.value = String(t.status == null ? 1 : t.status);
    editingId = t.id || '';
    if(formTitle) formTitle.textContent = 'Edit template';
    if(formHint) formHint.textContent = 'Saving updates the Live Chat chip instantly.';
    if(saveBtn) saveBtn.innerHTML = '<i class="bi bi-save"></i> Save';
    titleInput.focus();
    renderList(templates);
    const formCard = document.querySelector('.template-form-card');
    if(formCard && window.matchMedia('(max-width: 991.98px)').matches){
      formCard.scrollIntoView({block:'start', behavior:'smooth'});
    }
  }

  function nextSortOrder(){
    return templates.reduce(function(n, t){ return Math.max(n, Number(t.sortOrder || 0)); }, 0) + 1;
  }

  function resetForm(){
    idInput.value = '';
    titleInput.value = '';
    messageInput.value = '';
    sortInput.value = String(nextSortOrder());
    statusInput.value = '1';
    editingId = '';
    if(formTitle) formTitle.textContent = 'New template';
    if(formHint) formHint.textContent = 'Click a template on the left to edit it.';
    if(saveBtn) saveBtn.innerHTML = '<i class="bi bi-save"></i> Save';
    renderList(templates);
  }

  function renderList(list){
    if(!listEl) return;
    list = Array.isArray(list) ? list : [];
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const visible = list.filter(function(t){
      if(!q) return true;
      const hay = [t.title, t.message].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    const totalEl = document.getElementById('templateListTotal');
    if(totalEl) totalEl.textContent = visible.length ? String(visible.length) : '';
    const addHtml = '<button type="button" class="template-list-add' + (editingId ? '' : ' is-current') + '" data-template-add><i class="bi bi-plus-lg" aria-hidden="true"></i> New template</button>';
    if(!visible.length){
      listEl.innerHTML = '<div class="livechat-empty"><span class="livechat-empty-icon"><i class="bi bi-chat-square-text"></i></span><strong>' + (q ? 'No matching template' : 'No template yet') + '</strong><span>' + (q ? 'Try another search.' : 'Write one on the right and save.') + '</span></div>' + addHtml;
      bindListAdd();
      return;
    }
    let activeIndex = 0;
    const hotkeyById = {};
    list.forEach(function(t){
      if(Number(t.status == null ? 1 : t.status) === 1 && activeIndex < 9){
        hotkeyById[t.id] = String(++activeIndex);
      }
    });
    listEl.innerHTML = visible.map(function(t){
      const active = Number(t.status == null ? 1 : t.status) === 1;
      const hotkey = hotkeyById[t.id] || '';
      const selected = editingId && t.id === editingId;
      const preview = String(t.message || '').replace(/\s+/g, ' ').trim();
      return '<article class="template-list-item' + (selected ? ' is-editing' : '') + (active ? '' : ' is-off') + '" data-edit="' + esc(t.id || '') + '" tabindex="0" role="button" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="template-hotkey' + (hotkey ? '' : ' is-empty') + '" aria-hidden="true">' + (hotkey || '–') + '</span>' +
        '<span class="template-list-copy">' +
          '<span class="template-title-line"><b>' + esc(t.title || 'Template') + '</b><span class="status-pill ' + (active ? 'active' : 'off') + '">' + (active ? 'Active' : 'Off') + '</span></span>' +
          '<em>' + esc(preview) + '</em>' +
        '</span>' +
        '<span class="template-list-actions">' +
          '<button type="button" class="template-icon-btn" data-edit-btn="' + esc(t.id || '') + '" aria-label="Edit ' + esc(t.title || 'template') + '"><i class="bi bi-pencil"></i></button>' +
          '<button type="button" class="template-icon-btn is-danger" data-delete="' + esc(t.id || '') + '" aria-label="Delete ' + esc(t.title || 'template') + '"><i class="bi bi-trash3"></i></button>' +
        '</span>' +
      '</article>';
    }).join('') + addHtml;
    listEl.querySelectorAll('.template-list-item[data-edit]').forEach(function(row){
      row.addEventListener('click', function(){ editTemplate(row.getAttribute('data-edit')); });
      row.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); editTemplate(row.getAttribute('data-edit')); }
      });
    });
    listEl.querySelectorAll('[data-edit-btn]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); editTemplate(btn.getAttribute('data-edit-btn')); });
    });
    listEl.querySelectorAll('[data-delete]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); deleteTemplate(btn.getAttribute('data-delete')); });
    });
    bindListAdd();
  }

  function bindListAdd(){
    const addBtn = listEl && listEl.querySelector('[data-template-add]');
    if(!addBtn) return;
    addBtn.addEventListener('click', function(e){
      e.stopPropagation();
      resetForm();
      if(titleInput) titleInput.focus();
    });
  }

  function getLocalTemplates(){
    try{
      const saved = JSON.parse(localStorage.getItem('bo_livechat_templates') || 'null');
      if(Array.isArray(saved) && saved.length){
        return saved.map(function(item, idx){
          if(typeof item === 'string') return {id:'local-' + idx, title:item.slice(0,40), message:item, sortOrder:idx+1, status:1};
          return {id:item.id || ('local-' + idx), title:item.title || ('Template ' + (idx+1)), message:item.message || item.text || '', sortOrder:Number(item.sortOrder || idx+1), status:Number(item.status == null ? 1 : item.status)};
        });
      }
    }catch(e){}
    return DEFAULT_TEMPLATES.map(function(t, idx){ return Object.assign({id:'default-' + idx}, t); });
  }

  function saveLocalTemplate(payload, id){
    const list = getLocalTemplates().filter(function(x){ return !String(x.id || '').startsWith('default-'); });
    if(id){
      const idx = list.findIndex(function(x){ return x.id === id; });
      if(idx >= 0) list[idx] = Object.assign({}, list[idx], payload, {id:id});
    }else{
      list.push(Object.assign({}, payload, {id:'local-' + Date.now()}));
    }
    localStorage.setItem('bo_livechat_templates', JSON.stringify(list));
    templates = list;
  }

  function deleteLocalTemplate(id){
    const list = getLocalTemplates().filter(function(x){ return x.id !== id && !String(x.id || '').startsWith('default-'); });
    localStorage.setItem('bo_livechat_templates', JSON.stringify(list));
    templates = list;
  }

  function setStatus(msg, isError){
    if(!statusText) return;
    statusText.textContent = msg || '';
    statusText.className = 'form-status ' + (isError ? 'error' : 'success');
  }

  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
})();
