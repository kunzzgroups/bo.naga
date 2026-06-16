(function(){
  const inboxList = document.getElementById('livechatInboxList');
  const searchInput = document.getElementById('livechatSearch');
  const refreshBtn = document.getElementById('livechatRefreshBtn');
  const roomHead = document.getElementById('livechatRoomHead');
  const messagesEl = document.getElementById('livechatMessages');
  const form = document.getElementById('livechatForm');
  const input = document.getElementById('livechatInput');
  const attachBtn = document.getElementById('livechatAttachBtn');
  const fileInput = document.getElementById('livechatFileInput');
  const attachPreview = document.getElementById('livechatAttachPreview');

  let db = null;
  let storage = null;
  let conversations = [];
  let selectedId = '';
  let unsubscribeConversations = null;
  let unsubscribeMessages = null;
  let pendingFiles = [];

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    bindEvents();
    if(!initFirebase()){
      renderInboxMessage('Firebase not configured. Update assets/js/firebase-config.js first.');
      return;
    }
    listenConversations();
  }

  function initFirebase(){
    if(!window.firebase || !window.NAGA_FIREBASE_CONFIG || window.NAGA_FIREBASE_CONFIG.apiKey === 'YOUR_FIREBASE_API_KEY') return false;
    if(!firebase.apps.length) firebase.initializeApp(window.NAGA_FIREBASE_CONFIG);
    db = firebase.firestore();
    storage = firebase.storage();
    return true;
  }

  function bindEvents(){
    if(searchInput) searchInput.addEventListener('input', renderInbox);
    if(refreshBtn) refreshBtn.addEventListener('click', listenConversations);
    if(attachBtn && fileInput){
      attachBtn.addEventListener('click', function(){ fileInput.click(); });
      fileInput.addEventListener('change', function(){
        pendingFiles = pendingFiles.concat(Array.from(fileInput.files || []));
        fileInput.value = '';
        renderAttachPreview();
      });
    }
    if(input){
      input.addEventListener('paste', handlePasteFiles);
      input.addEventListener('keydown', function(e){
        if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          sendReply();
        }
      });
    }
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        sendReply();
      });
    }
  }

  function listenConversations(){
    if(!db) return;
    if(unsubscribeConversations) unsubscribeConversations();
    renderInboxMessage('Loading conversations...');
    unsubscribeConversations = db.collection('conversations').orderBy('updatedAt','desc').limit(100)
      .onSnapshot(function(snapshot){
        conversations = [];
        snapshot.forEach(function(doc){
          conversations.push(Object.assign({id: doc.id}, doc.data() || {}));
        });
        renderInbox();
        if(selectedId && !conversations.some(c => c.id === selectedId)) clearRoom();
      }, function(error){
        renderInboxMessage('Unable to load conversations. ' + (error && error.message ? error.message : ''));
      });
  }

  function renderInbox(){
    if(!inboxList) return;
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const list = conversations.filter(function(c){
      const hay = [c.memberName, c.memberUsername, c.conversationId, c.lastMessage].join(' ').toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    });
    if(!list.length){
      inboxList.innerHTML = '<div class="livechat-empty">No conversations found.</div>';
      return;
    }
    inboxList.innerHTML = list.map(function(c){
      const active = c.id === selectedId ? ' active' : '';
      return '<button type="button" class="livechat-inbox-item' + active + '" data-id="' + esc(c.id) + '">' +
        '<span class="avatar">' + esc(initials(c.memberName || c.memberUsername || 'M')) + '</span>' +
        '<span class="copy"><b>' + esc(c.memberName || 'Member') + '</b><small>' + esc(c.memberUsername || c.id) + '</small><em>' + esc(c.lastMessage || 'No message') + '</em></span>' +
        '<span class="time">' + esc(formatTime(c.updatedAt)) + '</span>' +
      '</button>';
    }).join('');
    inboxList.querySelectorAll('[data-id]').forEach(function(btn){
      btn.addEventListener('click', function(){ selectConversation(btn.getAttribute('data-id')); });
    });
  }

  function renderInboxMessage(text){
    if(inboxList) inboxList.innerHTML = '<div class="livechat-empty">' + esc(text) + '</div>';
  }

  function selectConversation(id){
    selectedId = id;
    renderInbox();
    const conv = conversations.find(c => c.id === id) || {id:id};
    roomHead.innerHTML = '<div class="livechat-room-avatar">' + esc(initials(conv.memberName || 'M')) + '</div><div><h2>' + esc(conv.memberName || 'Member') + '</h2><p>' + esc(conv.memberUsername || conv.id) + '</p></div>';
    if(unsubscribeMessages) unsubscribeMessages();
    messagesEl.innerHTML = '<div class="livechat-empty big">Loading messages...</div>';
    unsubscribeMessages = db.collection('conversations').doc(id).collection('messages').orderBy('createdAt','asc')
      .onSnapshot(function(snapshot){
        messagesEl.innerHTML = '';
        if(snapshot.empty){
          messagesEl.innerHTML = '<div class="livechat-empty big">No message yet.</div>';
        }else{
          snapshot.forEach(function(doc){ renderMessage(doc.data()); });
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, function(error){
        messagesEl.innerHTML = '<div class="livechat-empty big">Unable to load messages. ' + esc(error.message || '') + '</div>';
      });
  }

  function clearRoom(){
    selectedId = '';
    if(unsubscribeMessages) unsubscribeMessages();
    roomHead.innerHTML = '<div class="livechat-room-avatar">?</div><div><h2>Select a conversation</h2><p>Choose member from left inbox to start reply.</p></div>';
    messagesEl.innerHTML = '<div class="livechat-empty big">No conversation selected.</div>';
  }

  function renderMessage(msg){
    const isAdmin = msg.senderType === 'admin';
    const wrap = document.createElement('div');
    wrap.className = 'livechat-msg ' + (isAdmin ? 'admin' : 'member');
    let html = '<div class="bubble"><div class="name">' + esc(msg.senderName || (isAdmin ? 'Admin' : 'Member')) + '</div>';
    if(msg.text) html += '<div class="text">' + formatText(msg.text) + '</div>';
    const files = Array.isArray(msg.attachments) ? msg.attachments : [];
    if(files.length){
      html += '<div class="files">';
      files.forEach(function(file){
        const name = esc(file.name || 'attachment');
        const url = esc(file.url || '#');
        const type = String(file.type || '');
        if(type.indexOf('image/') === 0){
          html += '<a href="' + url + '" target="_blank" class="img-file"><img src="' + url + '" alt="' + name + '"><span>' + name + '</span></a>';
        }else{
          html += '<a href="' + url + '" target="_blank" class="doc-file"><i class="bi bi-file-earmark"></i><span>' + name + '<small>' + formatFileSize(file.size || 0) + '</small></span></a>';
        }
      });
      html += '</div>';
    }
    html += '<div class="msg-time">' + esc(formatTime(msg.createdAt)) + '</div></div>';
    wrap.innerHTML = html;
    messagesEl.appendChild(wrap);
  }

  async function sendReply(){
    if(!selectedId){ alert('Please select a conversation first.'); return; }
    const text = (input.value || '').trim();
    if(!text && !pendingFiles.length) return;
    const files = pendingFiles.slice();
    input.value = '';
    pendingFiles = [];
    renderAttachPreview();
    try{
      const attachments = await uploadFiles(files);
      const admin = (window.BO_AUTH && window.BO_AUTH.user && window.BO_AUTH.user()) || {};
      const now = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('conversations').doc(selectedId).collection('messages').add({
        senderType: 'admin',
        senderName: admin.displayName || admin.username || 'Admin',
        text: text,
        attachments: attachments,
        createdAt: now
      });
      await db.collection('conversations').doc(selectedId).set({
        lastMessage: text || (attachments.length ? '[Attachment]' : ''),
        lastSenderType: 'admin',
        status: 'open',
        updatedAt: now
      }, {merge:true});
    }catch(e){
      alert(e.message || 'Send failed.');
    }
  }

  async function uploadFiles(files){
    const result = [];
    for(const file of files){
      const safeName = safeFileName(file.name || 'attachment');
      const path = 'livechat/' + selectedId + '/' + Date.now() + '-' + safeName;
      const snap = await storage.ref(path).put(file);
      const url = await snap.ref.getDownloadURL();
      result.push({name:file.name || safeName, size:file.size || 0, type:file.type || 'application/octet-stream', url:url, path:path});
    }
    return result;
  }

  function handlePasteFiles(e){
    const clipboard = e.clipboardData || window.clipboardData;
    if(!clipboard) return;
    const files = [];
    if(clipboard.files && clipboard.files.length) files.push.apply(files, Array.from(clipboard.files));
    if(files.length){
      e.preventDefault();
      pendingFiles = pendingFiles.concat(files);
      renderAttachPreview();
    }
  }

  function renderAttachPreview(){
    if(!attachPreview) return;
    if(!pendingFiles.length){ attachPreview.innerHTML = ''; attachPreview.classList.remove('show'); return; }
    attachPreview.classList.add('show');
    attachPreview.innerHTML = pendingFiles.map(function(file, idx){
      return '<span class="attach-chip">' + esc(file.name || 'attachment') + '<button type="button" data-remove="' + idx + '">&times;</button></span>';
    }).join('');
    attachPreview.querySelectorAll('[data-remove]').forEach(function(btn){
      btn.addEventListener('click', function(){ pendingFiles.splice(Number(btn.dataset.remove),1); renderAttachPreview(); });
    });
  }

  function safeFileName(name){ return String(name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_'); }
  function initials(name){ return (String(name || 'M').trim().charAt(0) || 'M').toUpperCase(); }
  function formatText(str){ return esc(str).replace(/\r\n|\r|\n/g, '<br>'); }
  function formatFileSize(bytes){ if(!bytes) return '0 KB'; if(bytes < 1024*1024) return Math.max(1, Math.round(bytes/1024)) + ' KB'; return (bytes/1024/1024).toFixed(1) + ' MB'; }
  function formatTime(ts){
    try{
      const d = ts && ts.toDate ? ts.toDate() : null;
      if(!d) return '';
      return d.toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'});
    }catch(e){ return ''; }
  }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
})();
