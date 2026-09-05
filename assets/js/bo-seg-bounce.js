(function(global){
  'use strict';

  const mounts=new WeakMap();
  const reduce=()=>!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function ensureThumb(track){
    let thumb=track.querySelector(':scope > .bo-seg-thumb');
    if(!thumb){
      thumb=document.createElement('span');
      thumb.className='bo-seg-thumb';
      thumb.setAttribute('aria-hidden','true');
      track.insertBefore(thumb,track.firstChild);
    }
    return thumb;
  }

  function sync(track){
    const state=mounts.get(track);
    if(!state) return;
    const thumb=state.thumb;
    const active=track.querySelector(state.buttonSelector+'.'+state.activeClass)
      ||track.querySelector(state.buttonSelector);
    if(!active){
      thumb.style.opacity='0';
      return;
    }
    thumb.style.transform='';
    thumb.style.left=active.offsetLeft+'px';
    thumb.style.width=active.offsetWidth+'px';
    thumb.style.opacity='1';
  }

  function schedule(track){
    requestAnimationFrame(function(){sync(track);});
  }

  function mount(track,opts){
    if(!track||mounts.has(track)) {
      if(track&&mounts.has(track)) schedule(track);
      return mounts.get(track)||null;
    }
    opts=opts||{};
    track.classList.add('bo-seg');
    if(!track.getAttribute('data-bo-seg-anim')){
      track.setAttribute('data-bo-seg-anim',opts.anim||'bounce');
    }
    if(reduce()) track.setAttribute('data-bo-seg-anim','slide');

    const buttonSelector=opts.button||':scope > button, :scope > a.mad-pill, :scope > .mad-pill, :scope > .mp-scope-btn';
    const state={
      thumb:ensureThumb(track),
      buttonSelector:buttonSelector,
      activeClass:opts.activeClass||'is-active',
      observer:null
    };
    mounts.set(track,state);

    state.observer=new MutationObserver(function(){schedule(track);});
    state.observer.observe(track,{
      attributes:true,
      childList:true,
      subtree:true,
      characterData:true,
      attributeFilter:['class','aria-selected']
    });

    const onResize=function(){schedule(track);};
    window.addEventListener('resize',onResize);
    state.onResize=onResize;

    schedule(track);
    setTimeout(function(){schedule(track);},50);
    setTimeout(function(){schedule(track);},300);

    return {
      sync:function(){sync(track);},
      destroy:function(){
        if(state.observer) state.observer.disconnect();
        if(state.onResize) window.removeEventListener('resize',state.onResize);
        mounts.delete(track);
      }
    };
  }

  function mountAll(selector,opts){
    return Array.prototype.map.call(document.querySelectorAll(selector),function(el){
      return mount(el,opts);
    });
  }

  function autoMount(){
    mountAll('.mad-pills',{button:'.mad-pill',anim:'bounce'});
    mountAll('.mp-scope',{button:'.mp-scope-btn',anim:'bounce'});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',autoMount);
  }else{
    autoMount();
  }

  global.BO_SEG_BOUNCE={mount:mount,mountAll:mountAll,sync:sync,autoMount:autoMount};
})(window);
