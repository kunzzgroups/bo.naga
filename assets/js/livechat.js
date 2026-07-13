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
  const templatePanel = document.getElementById('livechatTemplatePanel');
  const editState = document.getElementById('livechatEditState');
  const editCancel = document.getElementById('livechatEditCancel');

  let db = null;
  let storage = null;
  let conversations = [];
  let selectedId = '';
  let unsubscribeConversations = null;
  let unsubscribeMessages = null;
  let pendingFiles = [];
  let editingMessageId = '';
  let editingOriginalText = '';
  let lastUnreadTotal = Number(localStorage.getItem('bo_livechat_last_unread_total') || '0');
  let originalTitle = document.title;
  let templateMessages = [];
  let unsubscribeTemplates = null;
  const DEFAULT_TEMPLATES = [
    {title:'Greeting', message:'Hi dear, how can I help you?'},
    {title:'Need Screenshot', message:'Please provide your username and issue screenshot.'},
    {title:'Deposit Delay', message:'Deposit usually takes a few minutes to update. Please wait a while and refresh.'},
    {title:'Withdrawal Processing', message:'Withdrawal is processing. We will update you once completed.'},
    {title:'Checking', message:'Thank you dear. We will check and reply shortly.'}
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    bindEvents();
    setComposerVisible(false);
    requestBrowserNotificationPermission();
    if(!initFirebase()){
      renderTemplates(getLocalTemplates());
      renderInboxMessage('Firebase not configured. Update assets/js/firebase-config.js first.');
      return;
    }
    listenTemplates();
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

    document.addEventListener('keydown', handleTemplateHotkey);
    if(editCancel) editCancel.addEventListener('click', cancelEditing);
    document.addEventListener('click', function(e){
      if(!e.target.closest('.livechat-msg-actions')) document.querySelectorAll('.livechat-msg-menu.show').forEach(function(m){m.classList.remove('show');});
    });

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


  function setComposerVisible(show){
    if(!form) return;
    form.style.display = show ? '' : 'none';
    if(!show){
      if(input) input.value = '';
      pendingFiles = [];
      renderAttachPreview();
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
        handleUnreadNotification();
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
      const unread = Number(c.adminUnreadCount || 0);
      return '<button type="button" class="livechat-inbox-item' + active + (unread ? ' unread' : '') + '" data-id="' + esc(c.id) + '">' +
        '<span class="avatar">' + esc(initials(c.memberName || c.memberUsername || 'M')) + '</span>' +
        '<span class="copy"><b>' + esc(c.memberName || 'Member') + (unread ? ' <span class="unread-dot">NEW</span>' : '') + '</b><small>' + esc(c.memberUsername || c.id) + '</small><em>' + esc(c.lastMessage || 'No message') + '</em></span>' +
        '<span class="time">' + (unread ? '<b class="unread-count">' + unread + '</b>' : '') + esc(formatTime(c.updatedAt)) + '</span>' +
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
    cancelEditing();
    selectedId = id;
    setComposerVisible(true);
    renderInbox();
    const conv = conversations.find(c => c.id === id) || {id:id};
    roomHead.innerHTML = '<div class="livechat-room-avatar">' + esc(initials(conv.memberName || 'M')) + '</div><div><h2>' + esc(conv.memberName || 'Member') + '</h2><p>' + esc(conv.memberUsername || conv.id) + '</p></div>';
    markConversationRead(id);
    if(unsubscribeMessages) unsubscribeMessages();
    messagesEl.innerHTML = '<div class="livechat-empty big">Loading messages...</div>';
    unsubscribeMessages = db.collection('conversations').doc(id).collection('messages').orderBy('createdAt','asc')
      .onSnapshot(function(snapshot){
        messagesEl.innerHTML = '';
        if(snapshot.empty){
          messagesEl.innerHTML = '<div class="livechat-empty big">No message yet.</div>';
        }else{
          snapshot.forEach(function(doc){ renderMessage(doc.id, doc.data()); });
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, function(error){
        messagesEl.innerHTML = '<div class="livechat-empty big">Unable to load messages. ' + esc(error.message || '') + '</div>';
      });
  }

  function clearRoom(){
    cancelEditing();
    selectedId = '';
    if(unsubscribeMessages) unsubscribeMessages();
    roomHead.innerHTML = '<div class="livechat-room-avatar">?</div><div><h2>Select a conversation</h2><p>Choose member from left inbox to start reply.</p></div>';
    messagesEl.innerHTML = '<div class="livechat-empty big">No conversation selected.</div>';
    setComposerVisible(false);
  }

  function renderMessage(messageId, msg){
    const isAdmin = msg.senderType === 'admin';
    const wrap = document.createElement('div');
    wrap.className = 'livechat-msg ' + (isAdmin ? 'admin' : 'member');
    wrap.dataset.messageId = messageId;
    let html = '<div class="bubble"><div class="name">' + esc(msg.senderName || (isAdmin ? 'Admin' : 'Member')) + '</div>';
    if(isAdmin && !msg.recalled){
      const hasFiles = Array.isArray(msg.attachments) && msg.attachments.length > 0;
      const hasText = !!String(msg.text || '').trim();
      let actionButtons = '';
      if(hasFiles){
        actionButtons += '<button type="button" data-msg-action="recall">Recall Message</button>'+
          '<button type="button" data-msg-action="delete">Delete Message</button>';
      }else if(hasText){
        actionButtons += '<button type="button" data-msg-action="edit">Edit Message</button>'+          '<button type="button" data-msg-action="recall">Recall Message</button>'+          '<button type="button" data-msg-action="delete">Delete Message</button>';
      }
      if(actionButtons){
        html += '<div class="livechat-msg-actions"><button type="button" class="livechat-msg-menu-btn" aria-label="Message actions"><i class="bi bi-three-dots-vertical"></i></button>'+
          '<div class="livechat-msg-menu">'+actionButtons+'</div></div>';
      }
    }
    if(msg.recalled){
      html += '<div class="livechat-recalled"><i class="bi bi-arrow-counterclockwise"></i> Message recalled</div>';
    }else if(msg.text){
      html += '<div class="text">' + formatText(msg.text) + '</div>';
    }
    const files = msg.recalled ? [] : (Array.isArray(msg.attachments) ? msg.attachments : []);
    if(files.length){
      html += '<div class="files">';
      files.forEach(function(file){
        const name = esc(file.name || 'attachment'); const url = esc(file.url || '#'); const type = String(file.type || '');
        if(type.indexOf('image/') === 0) html += '<a href="' + url + '" target="_blank" class="img-file"><img src="' + url + '" alt="' + name + '"><span>' + name + '</span></a>';
        else html += '<a href="' + url + '" target="_blank" class="doc-file"><i class="bi bi-file-earmark"></i><span>' + name + '<small>' + formatFileSize(file.size || 0) + '</small></span></a>';
      });
      html += '</div>';
    }
    html += '<div class="msg-time">' + esc(formatTime(msg.createdAt)) + (msg.editedAt && !msg.recalled ? ' · Edited' : '') + '</div></div>';
    wrap.innerHTML = html;
    messagesEl.appendChild(wrap);
    const menuBtn=wrap.querySelector('.livechat-msg-menu-btn');
    if(menuBtn) menuBtn.addEventListener('click',function(e){e.stopPropagation(); const menu=wrap.querySelector('.livechat-msg-menu'); document.querySelectorAll('.livechat-msg-menu.show').forEach(function(m){if(m!==menu)m.classList.remove('show');}); menu.classList.toggle('show');});
    wrap.querySelectorAll('[data-msg-action]').forEach(function(btn){btn.addEventListener('click',function(){handleMessageAction(btn.dataset.msgAction,messageId,msg);});});
  }

  function handleMessageAction(action, messageId, msg){
    document.querySelectorAll('.livechat-msg-menu.show').forEach(function(m){m.classList.remove('show');});
    if(action==='edit') startEditing(messageId,msg.text||'');
    if(action==='recall') recallMessage(messageId,msg);
    if(action==='delete') deleteMessage(messageId,msg);
  }
  function startEditing(messageId,text){
    editingMessageId=messageId; editingOriginalText=text; input.value=text; pendingFiles=[]; renderAttachPreview();
    if(editState) editState.classList.add('show'); input.focus(); input.setSelectionRange(input.value.length,input.value.length);
  }
  function cancelEditing(){editingMessageId='';editingOriginalText='';if(editState)editState.classList.remove('show');if(input)input.value='';}
  async function recallMessage(messageId,msg){
    if(!confirm('Recall this message?')) return;
    try{
      await db.collection('conversations').doc(selectedId).collection('messages').doc(messageId).update({recalled:true,originalText:msg.text||'',text:'',attachments:[],recalledAt:firebase.firestore.FieldValue.serverTimestamp()});
      if(editingMessageId===messageId) cancelEditing();
    }catch(e){alert(e.message||'Recall failed.');}
  }
  async function deleteMessage(messageId){
    if(!confirm('Delete this message permanently?')) return;
    try{await db.collection('conversations').doc(selectedId).collection('messages').doc(messageId).delete();if(editingMessageId===messageId)cancelEditing();}
    catch(e){alert(e.message||'Delete failed.');}
  }

  async function sendReply(){
    if(!selectedId){ alert('Please select a conversation first.'); return; }
    const text = (input.value || '').trim();
    if(editingMessageId){
      if(!text) return;
      try{
        await db.collection('conversations').doc(selectedId).collection('messages').doc(editingMessageId).update({text:text,editedAt:firebase.firestore.FieldValue.serverTimestamp()});
        cancelEditing();
      }catch(e){alert(e.message||'Edit failed.');}
      return;
    }
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
        updatedAt: now,
        memberUnreadCount: firebase.firestore.FieldValue.increment(1)
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


  function getLocalTemplates(){
    try{
      const saved = JSON.parse(localStorage.getItem('bo_livechat_templates') || 'null');
      if(Array.isArray(saved) && saved.length){
        return saved.map(function(item, idx){
          if(typeof item === 'string') return {id:'local-' + idx, title:item.slice(0,40), message:item};
          return {id:item.id || ('local-' + idx), title:item.title || ('Template ' + (idx+1)), message:item.message || item.text || ''};
        }).filter(function(x){ return x.message; });
      }
    }catch(e){}
    return DEFAULT_TEMPLATES.slice();
  }

  function listenTemplates(){
    if(!templatePanel) return;

    // If Firebase is not configured, use local/default templates only as a fallback.
    // If Firebase is configured, always use livechat_templates collection as the source of truth.
    if(!db){
      renderTemplates(getLocalTemplates(), true);
      return;
    }

    if(unsubscribeTemplates) unsubscribeTemplates();
    templatePanel.innerHTML = '<span class="livechat-template-hint">Loading templates...</span>';

    // Do not use where/orderBy here. Firestore composite indexes are not needed.
    // We load templates then filter/sort in JavaScript, same as livechat-template.js.
    unsubscribeTemplates = db.collection('livechat_templates')
      .onSnapshot(function(snapshot){
        templateMessages = [];

        snapshot.forEach(function(doc){
          const data = doc.data() || {};
          const status = Number(data.status == null ? 1 : data.status);
          const message = data.message || data.text || '';

          if(status === 1 && message){
            templateMessages.push({
              id: doc.id,
              title: data.title || 'Template',
              message: message,
              sortOrder: Number(data.sortOrder || 0),
              createdAt: data.createdAt
            });
          }
        });

        templateMessages.sort(function(a,b){
          const sortA = Number(a.sortOrder || 0);
          const sortB = Number(b.sortOrder || 0);
          if(sortA !== sortB) return sortA - sortB;

          const timeA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
          const timeB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
          return timeB - timeA;
        });

        renderTemplates(templateMessages, false);
      }, function(error){
        templatePanel.innerHTML = '<span class="livechat-template-hint error">Unable to load templates: ' + esc(error && error.message ? error.message : '') + '</span>';
      });
  }

  // function renderTemplates(list, allowFallback){
  //   if(!templatePanel) return;

  //   list = Array.isArray(list) ? list.filter(function(item){ return item && (item.message || item.text); }) : [];

  //   if(!list.length && allowFallback){
  //     list = getLocalTemplates();
  //   }

  //   if(!list.length){
  //     templatePanel.innerHTML = '<span class="livechat-template-hint">No active template. Add one in Template Messages.</span>';
  //     return;
  //   }

  //   templatePanel.innerHTML = list.map(function(item, idx){
  //     const title = item.title || item.message || 'Template';
  //     const msg = item.message || item.text || '';
  //     return '<button type="button" class="template-chip" title="' + esc(msg) + '" data-template-index="' + idx + '">' + esc(title) + '</button>';
  //   }).join('');

  //   templatePanel.querySelectorAll('[data-template-index]').forEach(function(btn){
  //     btn.addEventListener('click', function(){
  //       const item = list[Number(btn.dataset.templateIndex)] || {};
  //       const text = item.message || item.text || '';
  //       if(!input) return;
  //       input.value = text;
  //       input.focus();
  //     });
  //   });
  // }
  function renderTemplates(list, allowFallback){
    if(!templatePanel) return;

    list = Array.isArray(list) ? list.filter(function(item){ return item && (item.message || item.text); }) : [];

    if(!list.length && allowFallback){
      list = getLocalTemplates();
    }

    if(!list.length){
      templatePanel.innerHTML = '<span class="livechat-template-hint">No active template. Add one in Template Messages.</span>';
      return;
    }

    templatePanel.innerHTML = list.map(function(item, idx){
      const title = item.title || item.message || 'Template';
      const msg = item.message || item.text || '';
      const hotkey = idx < 9 ? (idx + 1) : '';
      return '<button type="button" class="template-chip" title="' + esc(msg) + '" data-template-index="' + idx + '">' +
        (hotkey ? '<span class="template-hotkey">' + hotkey + '</span>' : '') +
        esc(title) +
      '</button>';
    }).join('');

    templatePanel.querySelectorAll('[data-template-index]').forEach(function(btn){
      btn.addEventListener('click', function(){
        applyTemplateByIndex(Number(btn.dataset.templateIndex), list);
      });
    });
  }

  function handleTemplateHotkey(e){
    if(!templatePanel || !input) return;
    if(!selectedId) return;
    if(e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

    const key = e.key;
    if(!/^[1-9]$/.test(key)) return;

    const target = e.target;

    // If user is typing in another field, don't trigger template
    if (
      target &&
      target !== input &&
      (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
    ) {
      return;
    }

    // If cursor is in message box and already has content,
    // treat 1/2/3 as normal typing
    if (
      document.activeElement === input &&
      input.value.trim() !== ''
    ) {
      return;
    }

    const buttons = templatePanel.querySelectorAll('[data-template-index]');
    const btn = buttons[Number(key) - 1];

    if(!btn) return;

    e.preventDefault();
    btn.click();
  }

  function applyTemplateByIndex(index, list){
    const item = list[Number(index)] || {};
    const text = item.message || item.text || '';
    if(!input || !text) return;

    input.value = text;
    input.focus();
  }

  async function markConversationRead(id){
    if(!db || !id) return;
    try{
      await db.collection('conversations').doc(id).set({
        adminUnreadCount: 0,
        adminReadAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
    }catch(e){}
  }

  function getUnreadTotal(){
    return conversations.reduce(function(sum, c){ return sum + Number(c.adminUnreadCount || 0); }, 0);
  }

  function handleUnreadNotification(){
    const total = getUnreadTotal();
    document.title = total ? '(' + total + ') ' + originalTitle : originalTitle;
    const badge = document.querySelector('[data-livechat-unread-total]');
    if(badge){
      badge.textContent = total;
      badge.style.display = total ? 'inline-flex' : 'none';
    }
    if(total > lastUnreadTotal){
      const latest = conversations.find(function(c){ return Number(c.adminUnreadCount || 0) > 0 && c.lastSenderType === 'member'; });
      if(latest) notifyIncoming(latest);
    }
    lastUnreadTotal = total;
    localStorage.setItem('bo_livechat_last_unread_total', String(total));
  }

  function requestBrowserNotificationPermission(){
    if('Notification' in window && Notification.permission === 'default'){
      setTimeout(function(){ Notification.requestPermission().catch(function(){}); }, 1200);
    }
  }

  function notifyIncoming(c){
    try{
      if('Notification' in window && Notification.permission === 'granted'){
        new Notification('New live chat message', {
          body: (c.memberName || c.memberUsername || 'Member') + ': ' + (c.lastMessage || 'New message'),
          tag: 'livechat-' + c.id
        });
      }
    }catch(e){}
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

// Keep reply composer visible and provide a one-click jump to the newest message.
(function(){
  function initScrollHelper(){
    const room=document.querySelector('.livechat-room-card');
    const box=document.getElementById('livechatMessages');
    if(!room||!box||room.querySelector('.livechat-scroll-bottom')) return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='livechat-scroll-bottom';btn.title='Scroll to latest message';btn.setAttribute('aria-label','Scroll to latest message');
    btn.innerHTML='<i class="bi bi-arrow-down"></i>';
    room.appendChild(btn);
    const nearBottom=()=>box.scrollHeight-box.scrollTop-box.clientHeight<90;
    const update=()=>btn.classList.toggle('show',!nearBottom()&&box.scrollHeight>box.clientHeight+40);
    btn.addEventListener('click',()=>box.scrollTo({top:box.scrollHeight,behavior:'smooth'}));
    box.addEventListener('scroll',update,{passive:true});
    new MutationObserver(function(){
      const shouldFollow=box.dataset.followLatest!=='false';
      if(shouldFollow||nearBottom()) requestAnimationFrame(()=>box.scrollTo({top:box.scrollHeight,behavior:'smooth'}));
      requestAnimationFrame(update);
    }).observe(box,{childList:true,subtree:true});
    box.addEventListener('wheel',()=>{box.dataset.followLatest=nearBottom()?'true':'false'},{passive:true});
    box.addEventListener('touchmove',()=>{box.dataset.followLatest=nearBottom()?'true':'false'},{passive:true});
    btn.addEventListener('click',()=>{box.dataset.followLatest='true'});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initScrollHelper);else initScrollHelper();
})();
