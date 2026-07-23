(function(){
  'use strict';

  if (window.__BO_LIVECHAT_GLOBAL_NOTIFICATION__) return;
  window.__BO_LIVECHAT_GLOBAL_NOTIFICATION__ = true;

  var SOUND_URL = 'assets/audio/livechat_sound.mp3';
  var audio = null;
  var audioUnlocked = false;
  var queuedSound = false;
  var firstSnapshot = true;
  var lastUnreadTotal = Number(localStorage.getItem('bo_livechat_last_unread_total') || 0);
  var lastIncomingTime = Number(localStorage.getItem('bo_livechat_last_incoming_time') || 0);
  var unsubscribe = null;
  var originalTitle = document.title;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  function init(){
    installSoundUnlock();
    requestNotificationPermission();
    startListener();
  }

  function startListener(){
    if (!window.firebase || !window.NAGA_FIREBASE_CONFIG || window.NAGA_FIREBASE_CONFIG.apiKey === 'YOUR_FIREBASE_API_KEY') {
      console.warn('[Livechat notification] Firebase is not available on this page.');
      return;
    }
    try{
      if (!firebase.apps.length) firebase.initializeApp(window.NAGA_FIREBASE_CONFIG);
      var db = firebase.firestore();
      if (unsubscribe) unsubscribe();
      unsubscribe = db.collection('conversations').orderBy('updatedAt', 'desc').limit(100)
        .onSnapshot(handleSnapshot, function(error){
          console.warn('[Livechat notification] Listener unavailable:', error && error.message ? error.message : error);
        });
    }catch(error){
      console.warn('[Livechat notification] Unable to initialise:', error && error.message ? error.message : error);
    }
  }

  function handleSnapshot(snapshot){
    var total = 0;
    var latestIncoming = null;
    var latestIncomingMs = 0;

    snapshot.forEach(function(doc){
      var item = Object.assign({id: doc.id}, doc.data() || {});
      var unread = Number(item.adminUnreadCount || 0);
      var senderIsMember = String(item.lastSenderType || '').toLowerCase() === 'member';
      var itemMs = timestampValue(item.updatedAt);
      total += unread;
      if (unread > 0 && senderIsMember && itemMs >= latestIncomingMs){
        latestIncoming = item;
        latestIncomingMs = itemMs;
      }
    });

    updatePageIndicators(total);

    if (firstSnapshot){
      firstSnapshot = false;
      // On the first ever installation, establish a baseline and do not alert old chats.
      // Across normal BO page navigation, localStorage preserves the baseline, so a message
      // that arrived during navigation is still detected instead of being silently ignored.
      if (!lastIncomingTime){
        lastIncomingTime = latestIncomingMs;
        persistState(total, latestIncomingMs);
        return;
      }
    }

    var hasNewIncoming = latestIncoming && latestIncomingMs > lastIncomingTime;
    var unreadIncreased = total > lastUnreadTotal;
    if ((hasNewIncoming || unreadIncreased) && latestIncoming && claimNotification(latestIncoming, latestIncomingMs)){
      notifyIncoming(latestIncoming);
    }

    lastUnreadTotal = total;
    if (latestIncomingMs > lastIncomingTime) lastIncomingTime = latestIncomingMs;
    persistState(total, lastIncomingTime);
  }

  function persistState(total, incomingMs){
    try{
      localStorage.setItem('bo_livechat_last_unread_total', String(total));
      localStorage.setItem('bo_livechat_last_incoming_time', String(incomingMs || 0));
    }catch(e){}
  }

  function updatePageIndicators(total){
    document.title = total ? '(' + total + ') ' + originalTitle : originalTitle;
    document.querySelectorAll('[data-livechat-unread-total]').forEach(function(badge){
      badge.textContent = total;
      badge.style.display = total ? 'inline-flex' : 'none';
    });
  }

  function claimNotification(conversation, messageTime){
    var key = [conversation.id || '', messageTime || 0, conversation.lastMessage || ''].join('|');
    var now = Date.now();
    try{
      var previous = JSON.parse(localStorage.getItem('bo_livechat_global_sound_lock') || '{}');
      if (previous.key === key && now - Number(previous.time || 0) < 10000) return false;
      localStorage.setItem('bo_livechat_global_sound_lock', JSON.stringify({key:key, time:now}));
    }catch(e){}
    return true;
  }

  function timestampValue(value){
    try{
      if (value && typeof value.toMillis === 'function') return value.toMillis();
      if (value && typeof value.seconds === 'number') return value.seconds * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000);
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return Date.parse(value) || 0;
    }catch(e){}
    return 0;
  }

  function getAudio(){
    if (!audio){
      audio = new Audio(SOUND_URL);
      audio.preload = 'auto';
      audio.load();
    }
    return audio;
  }

  function installSoundUnlock(){
    var unlock = function(){ unlockSound(); };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('touchstart', unlock, true);
    window.addEventListener('focus', function(){ if (queuedSound) playSound(); });
  }

  function unlockSound(){
    if (audioUnlocked) return;
    try{
      var player = getAudio();
      player.muted = true;
      player.currentTime = 0;
      var played = player.play();
      if (played && typeof played.then === 'function'){
        played.then(function(){
          player.pause();
          player.currentTime = 0;
          player.muted = false;
          audioUnlocked = true;
          if (queuedSound){ queuedSound = false; playSound(); }
        }).catch(function(){ player.muted = false; });
      }
    }catch(e){}
  }

  function playSound(){
    try{
      var player = getAudio();
      player.muted = false;
      player.pause();
      player.currentTime = 0;
      var played = player.play();
      if (played && typeof played.then === 'function'){
        played.then(function(){ audioUnlocked = true; queuedSound = false; })
          .catch(function(){ queuedSound = true; });
      }
    }catch(e){ queuedSound = true; }
  }

  function notifyIncoming(conversation){
    playSound();
    try{
      if ('Notification' in window && Notification.permission === 'granted'){
        var notification = new Notification('New live chat message', {
          body: (conversation.memberName || conversation.memberUsername || 'Member') + ': ' + (conversation.lastMessage || 'New message'),
          tag: 'livechat-' + conversation.id,
          renotify: true,
          silent: true
        });
        notification.onclick = function(){
          try{ window.focus(); }catch(e){}
          location.href = 'livechat.html' + (conversation.id ? '?conversation=' + encodeURIComponent(conversation.id) : '');
          notification.close();
        };
      }
    }catch(e){}
  }

  function requestNotificationPermission(){
    if ('Notification' in window && Notification.permission === 'default'){
      setTimeout(function(){ try{ Notification.requestPermission().catch(function(){}); }catch(e){} }, 1200);
    }
  }
})();
