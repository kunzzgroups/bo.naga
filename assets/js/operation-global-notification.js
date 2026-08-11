(function(){
  'use strict';

  if (window.__BO_OPERATION_GLOBAL_NOTIFICATION__) return;
  window.__BO_OPERATION_GLOBAL_NOTIFICATION__ = true;

  var NEW_MEMBER_SOUND_URL = 'assets/audio/new_member_sound.mp3';
  // Deposit and withdraw intentionally reuse the existing Live Chat MP3.
  var WALLET_REQUEST_SOUND_URL = 'assets/audio/livechat_sound.mp3';
  var POLL_INTERVAL_MS = 1000;
  var TAB_ID = 'bo-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  var wakeWorker = null;
  var REPEAT_INTERVAL_MS = 5000;
  var LOGIN_MARKER_KEY = 'bo_operation_login_marker';
  var STATE_KEY = 'bo_operation_notification_state_v3';
  var PENDING_KEY = 'bo_operation_notification_pending_v3';
  var SESSION_KEY = 'bo_operation_notification_session_v3';
  var PLAY_LOCK_KEY = 'bo_operation_notification_play_lock_v2';

  var audioMap = {};
  var unlocked = false;
  var queued = [];
  var pollTimer = null;
  var repeatTimer = null;
  var busy = false;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  function init(){
    if (!window.BO_AUTH || !window.API_CONFIG || !BO_AUTH.token()) return;
    installUnlock();
    bindHeaderAcknowledgement();
    check(true);
    startBackgroundPolling();
    repeatTimer = window.setInterval(repeatPendingSounds, REPEAT_INTERVAL_MS);
    window.addEventListener('storage', handleSharedNotificationState);
    try {
      if ('BroadcastChannel' in window) {
        window.__BO_NOTIFY_CHANNEL__ = new BroadcastChannel('bo-operation-notifications');
        window.__BO_NOTIFY_CHANNEL__.onmessage = function(){ check(false); repeatPendingSounds(); };
      }
    } catch(e){}
    window.addEventListener('beforeunload', function(){
      if (pollTimer) clearInterval(pollTimer);
      if (wakeWorker) { try { wakeWorker.terminate(); } catch(e){} wakeWorker = null; }
      if (repeatTimer) clearInterval(repeatTimer);
      try { if (window.__BO_NOTIFY_CHANNEL__) window.__BO_NOTIFY_CHANNEL__.close(); } catch(e){}
    });
  }



  function startBackgroundPolling(){
    // A dedicated worker timer is less affected by normal background-tab timer throttling.
    // The normal interval remains as a fallback for browsers that disallow Blob workers.
    try{
      var code = "setInterval(function(){postMessage('tick')}," + POLL_INTERVAL_MS + ");";
      var blob = new Blob([code], {type:'application/javascript'});
      wakeWorker = new Worker(URL.createObjectURL(blob));
      wakeWorker.onmessage = function(){ check(false); };
    }catch(e){
      wakeWorker = null;
    }
    if (!wakeWorker) pollTimer = window.setInterval(function(){ check(false); }, POLL_INTERVAL_MS);
  }

  function handleSharedNotificationState(e){
    if (!e || (e.key !== PENDING_KEY && e.key !== STATE_KEY)) return;
    // If another BO tab detects a new request, this tab can also attempt the sound.
    // This is especially useful when the detecting tab has no usable audio permission.
    repeatPendingSounds();
  }

  function broadcastRefresh(){
    try{
      if (window.__BO_NOTIFY_CHANNEL__) window.__BO_NOTIFY_CHANNEL__.postMessage({type:'refresh', at:Date.now()});
    }catch(e){}
  }

  function todayKey(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function endpoint(key){ return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[key]; }

  async function fetchJson(url){
    var res = await fetch(url, {headers: Object.assign({}, BO_AUTH.authHeader()), cache:'no-store'});
    var json = await res.json().catch(function(){ return {}; });
    if (!res.ok || json.status === 'error') throw new Error(json.message || 'Request failed');
    return json;
  }

  function normalizeIds(value){
    return Array.isArray(value) ? value.map(function(id){ return String(id); }).filter(Boolean) : [];
  }

  function hasNewRequestIds(nextIds, prevIds){
    if (!Array.isArray(nextIds) || !nextIds.length) return false;
    if (!Array.isArray(prevIds)) return false;
    var oldSet = new Set(prevIds.map(String));
    return nextIds.some(function(id){ return !oldSet.has(String(id)); });
  }

  async function getCounts(){
    var json = await fetchJson(endpoint('OPERATION_NOTIFICATION_SUMMARY') + '?_boNotifyTs=' + Date.now());
    var data = (json && json.data) || {};
    return {
      date: String(data.date || todayKey()),
      members: Number(data.members || data.newMembersToday || 0) || 0,
      deposit: Number(data.deposit || data.depositPendingCount || 0) || 0,
      withdraw: Number(data.withdraw || data.withdrawPendingCount || 0) || 0,
      depositIds: normalizeIds(data.depositIds || data.latestDepositIds),
      withdrawIds: normalizeIds(data.withdrawIds || data.latestWithdrawIds)
    };
  }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
  }

  function currentLoginMarker(){
    return sessionStorage.getItem(LOGIN_MARKER_KEY) || localStorage.getItem(LOGIN_MARKER_KEY) || 'legacy-session';
  }

  function getPending(){
    var p = readJson(PENDING_KEY, {members:false,wallet:false});
    return {members:!!p.members, wallet:!!p.wallet};
  }

  function setPending(kind, value){
    var p = getPending();
    p[kind] = !!value;
    writeJson(PENDING_KEY, p);
    if (!value) removeQueued(kind);
  }

  function isNewLoginSession(){
    return localStorage.getItem(SESSION_KEY) !== currentLoginMarker();
  }

  function markSessionInitialized(){
    try { localStorage.setItem(SESSION_KEY, currentLoginMarker()); } catch(e){}
  }

  async function check(initial){
    if (busy) return;
    busy = true;
    try{
      var next = await getCounts();
      var prev = readJson(STATE_KEY, {});
      var newLogin = isNewLoginSession();

      if (newLogin){
        // Member sound must NOT play merely because the admin logged in.
        // Existing real pending wallet requests may alert after the admin has interacted with the BO.
        setPending('members', false);
        setPending('wallet', next.deposit > 0 || next.withdraw > 0);
        markSessionInitialized();
      } else if (!initial) {
        if (prev.date !== next.date){
          prev.members = 0;
          prev.date = next.date;
        }
        if (next.members > Number(prev.members || 0)) setPending('members', true);

        // Detect a newly-created request by ID as well as by total count. This avoids missing
        // a new request when another request is approved/rejected between two polling cycles.
        var newWalletRequest = hasNewRequestIds(next.depositIds, prev.depositIds) ||
          hasNewRequestIds(next.withdrawIds, prev.withdrawIds) ||
          next.deposit > Number(prev.deposit || 0) ||
          next.withdraw > Number(prev.withdraw || 0);
        if (newWalletRequest) setPending('wallet', true);
      }

      // Notification state must follow the REAL pending queue. Once every deposit/withdraw
      // has been approved/rejected, immediately stop the repeating sound and clear stale state.
      if (next.deposit <= 0 && next.withdraw <= 0){
        setPending('wallet', false);
        stopAudio('wallet');
      }

      writeJson(STATE_KEY, next);
      broadcastRefresh();
      updateHeader(next);
      repeatPendingSounds();
    }catch(e){
      console.warn('[Operation notification] counter check failed:', e && e.message ? e.message : e);
    }finally{
      busy = false;
    }
  }

  function updateHeader(counts){
    document.querySelectorAll('[data-header-new-members]').forEach(function(el){ el.textContent = counts.members.toLocaleString(); });
    document.querySelectorAll('[data-header-pending-deposit]').forEach(function(el){ el.textContent = counts.deposit.toLocaleString(); });
    document.querySelectorAll('[data-header-pending-withdraw]').forEach(function(el){ el.textContent = counts.withdraw.toLocaleString(); });
  }

  function bindHeaderAcknowledgement(){
    document.addEventListener('click', function(e){
      var link = e.target.closest && e.target.closest('[data-operation-notification-ack]');
      if (!link) return;
      var kind = link.getAttribute('data-operation-notification-ack');
      if (kind === 'members' || kind === 'wallet') setPending(kind, false);
      stopAudio(kind);
    }, true);
  }

  function repeatPendingSounds(){
    var pending = getPending();
    // Member notification is one-shot only for each newly detected increase.
    // Deposit/withdraw continues repeating until either wallet header icon is opened.
    if (pending.wallet) queueSound('wallet');
  }

  function getAudio(kind){
    if (!audioMap[kind]){
      audioMap[kind] = new Audio(kind === 'members' ? NEW_MEMBER_SOUND_URL : WALLET_REQUEST_SOUND_URL);
      audioMap[kind].preload = 'auto';
      audioMap[kind].load();
    }
    return audioMap[kind];
  }

  function installUnlock(){
    var unlock = function(){ unlockAudio(); };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('touchstart', unlock, true);
    window.addEventListener('focus', function(){ unlockAudio(); check(false); repeatPendingSounds(); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(false); });
  }

  // Approval/rejection pages dispatch this after the backend action succeeds so the
  // notification state is reconciled immediately instead of waiting for the next interval.
  document.addEventListener('bo:wallet-request-updated', function(){
    stopAudio('wallet');
    window.setTimeout(function(){ check(false); }, 25);
  });

  window.BO_OPERATION_NOTIFICATION_CONTROL = {
    refresh: function(){ window.setTimeout(function(){ check(false); }, 0); },
    stopWalletAudio: function(){ stopAudio('wallet'); }
  };

  function unlockAudio(){
    if (unlocked) return;
    var sounds = [getAudio('members'), getAudio('wallet')];
    Promise.all(sounds.map(function(player){
      player.muted = true;
      player.currentTime = 0;
      var p = player.play();
      return p && p.then ? p.then(function(){ player.pause(); player.currentTime = 0; player.muted = false; }).catch(function(){ player.muted = false; }) : Promise.resolve();
    })).then(function(){ unlocked = true; flushQueue(); });
  }

  function removeQueued(kind){
    queued = queued.filter(function(item){ return item !== kind; });
  }

  function stopAudio(kind){
    removeQueued(kind);
    var player = audioMap[kind];
    if (player){
      try { player.pause(); player.currentTime = 0; } catch(e){}
    }
  }

  function queueSound(kind){
    if (queued.indexOf(kind) === -1) queued.push(kind);
    if (unlocked) flushQueue();
  }

  function claimPlay(kind){
    var now = Date.now();
    try{
      var lock = readJson(PLAY_LOCK_KEY, {});
      if (lock.kind === kind && lock.owner !== TAB_ID && now - Number(lock.time || 0) < REPEAT_INTERVAL_MS - 500) return false;
      writeJson(PLAY_LOCK_KEY, {kind:kind,time:now,owner:TAB_ID});
    }catch(e){}
    return true;
  }

  function releasePlayLock(kind){
    try{
      var lock = readJson(PLAY_LOCK_KEY, {});
      if (lock.kind === kind && lock.owner === TAB_ID) localStorage.removeItem(PLAY_LOCK_KEY);
    }catch(e){}
  }

  function flushQueue(){
    if (!queued.length || !unlocked) return;
    var kind = queued.shift();
    if (!getPending()[kind]) return flushQueue();
    if (!claimPlay(kind)) return;
    play(kind).then(function(played){
      // Do not let a background tab that Chrome blocked from autoplay silence all other BO tabs.
      if (!played) releasePlayLock(kind);
      if (kind === 'members' && played) setPending('members', false);
      if (queued.length) setTimeout(flushQueue, 350);
    });
  }

  function play(kind){
    return new Promise(function(resolve){
      try{
        var player = getAudio(kind);
        player.pause();
        player.currentTime = 0;
        player.muted = false;
        var p = player.play();
        if (p && p.then) p.then(function(){ unlocked = true; resolve(true); }).catch(function(){ resolve(false); });
        else resolve(true);
      }catch(e){ resolve(false); }
    });
  }
})();
