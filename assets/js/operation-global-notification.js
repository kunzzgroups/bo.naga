(function(){
  'use strict';

  if (window.__BO_OPERATION_GLOBAL_NOTIFICATION__) return;
  window.__BO_OPERATION_GLOBAL_NOTIFICATION__ = true;

  var NEW_MEMBER_SOUND_URL = 'assets/audio/new_member_sound.mp3';
  // Deposit and withdraw intentionally reuse the existing Live Chat MP3.
  var WALLET_REQUEST_SOUND_URL = 'assets/audio/livechat_sound.mp3';
  var POLL_INTERVAL_MS = 2000;
  var REPEAT_INTERVAL_MS = 5000;
  var LOGIN_MARKER_KEY = 'bo_operation_login_marker';
  var STATE_KEY = 'bo_operation_notification_state_v2';
  var PENDING_KEY = 'bo_operation_notification_pending_v2';
  var SESSION_KEY = 'bo_operation_notification_session_v2';
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
    pollTimer = window.setInterval(function(){ check(false); }, POLL_INTERVAL_MS);
    repeatTimer = window.setInterval(repeatPendingSounds, REPEAT_INTERVAL_MS);
    window.addEventListener('beforeunload', function(){
      if (pollTimer) clearInterval(pollTimer);
      if (repeatTimer) clearInterval(repeatTimer);
    });
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

  function totalFrom(json){
    var data = json && json.data;
    if (data && data.pagination && data.pagination.totalElements != null) return Number(data.pagination.totalElements) || 0;
    if (data && data.totalElements != null) return Number(data.totalElements) || 0;
    if (data && data.page && data.page.totalElements != null) return Number(data.page.totalElements) || 0;
    if (Array.isArray(data)) return data.length;
    if (data && Array.isArray(data.content)) return data.content.length;
    return 0;
  }

  function memberRows(json){
    var data = json && json.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.records)) return data.records;
    return [];
  }

  async function getCounts(){
    var memberJson = await fetchJson(BO_AUTH.memberListUrl());
    var today = todayKey();
    var newMembers = memberRows(memberJson).filter(function(row){
      var raw = row && (row.createdAt || row.registerDate || row.created_at);
      return raw && String(raw).replace('T',' ').slice(0,10) === today;
    }).length;

    var results = await Promise.all([
      fetchJson(endpoint('MEMBER_DEPOSIT_LIST') + '?status=PENDING&page=1&size=1'),
      fetchJson(endpoint('MEMBER_WITHDRAW_LIST') + '?status=PENDING&page=1&size=1')
    ]);
    return {
      date: today,
      members: newMembers,
      deposit: totalFrom(results[0]),
      withdraw: totalFrom(results[1])
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
    if (busy || document.hidden) return;
    busy = true;
    try{
      var next = await getCounts();
      var prev = readJson(STATE_KEY, {});
      var newLogin = isNewLoginSession();

      if (newLogin){
        // Member sound must NOT play merely because the admin logged in.
        // Existing pending deposit/withdraw must keep ringing until either header icon is opened.
        setPending('members', false);
        setPending('wallet', next.deposit > 0 || next.withdraw > 0);
        markSessionInitialized();
      } else if (!initial) {
        if (prev.date !== next.date){
          prev.members = 0;
          prev.date = next.date;
        }
        if (next.members > Number(prev.members || 0)) setPending('members', true);
        if (next.deposit > Number(prev.deposit || 0) || next.withdraw > Number(prev.withdraw || 0)) setPending('wallet', true);
      }

      writeJson(STATE_KEY, next);
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
    if (document.hidden) return;
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
      if (lock.kind === kind && now - Number(lock.time || 0) < REPEAT_INTERVAL_MS - 500) return false;
      writeJson(PLAY_LOCK_KEY, {kind:kind,time:now});
    }catch(e){}
    return true;
  }

  function flushQueue(){
    if (!queued.length || !unlocked) return;
    var kind = queued.shift();
    if (!getPending()[kind]) return flushQueue();
    if (!claimPlay(kind)) return;
    play(kind).finally(function(){
      if (kind === 'members') setPending('members', false);
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
        if (p && p.then) p.then(function(){ unlocked = true; resolve(); }).catch(function(){ resolve(); });
        else resolve();
      }catch(e){ resolve(); }
    });
  }
})();
