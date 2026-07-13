(function(){
  var lastOpenedAt = 0;
  var saveArmed = false;

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function text(el){ return (el && el.textContent || '').trim(); }
  function findFormCard(){
    return document.querySelector('.slider-page-grid > .slider-form-card, .manage-page-grid > .manage-form-card, .template-page-grid > .template-form-card');
  }
  function findListCard(){
    return document.querySelector('.slider-page-grid > .slider-list-card, .manage-page-grid > .manage-list-card, .template-page-grid > .template-list-card');
  }
  function findGrid(){ return document.querySelector('.slider-page-grid, .manage-page-grid, .template-page-grid'); }
  function pageLabel(){
    var h1 = document.querySelector('.report-topbar h1');
    return text(h1).replace(/Management|List/ig,'').trim() || 'Item';
  }
  function ensureModal(){
    var modal = document.getElementById('crudPatternModal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'crudPatternModal';
    modal.className = 'crud-pattern-modal';
    modal.innerHTML = '<div class="crud-pattern-backdrop" data-crud-close></div><div class="crud-pattern-dialog"><div class="crud-pattern-head"><h2 id="crudPatternTitle">Add</h2><button type="button" class="crud-pattern-close" data-crud-close><i class="bi bi-x-lg"></i></button></div><div class="crud-pattern-body" id="crudPatternBody"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){
      var closeTarget = e.target.closest('[data-crud-close]');
      if(!closeTarget) return;
      if(Date.now() - lastOpenedAt < 250) return;
      closeModal();
    });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
    return modal;
  }
  function openModal(title){
    var modal = ensureModal();
    var titleEl = modal.querySelector('#crudPatternTitle');
    if(titleEl) titleEl.textContent = title || ('Add ' + pageLabel());
    saveArmed = false;
    lastOpenedAt = Date.now();
    modal.classList.add('show');
    document.body.classList.add('crud-modal-open');
  }
  function closeModal(){
    var modal = document.getElementById('crudPatternModal');
    if(modal) modal.classList.remove('show');
    document.body.classList.remove('crud-modal-open');
    saveArmed = false;
  }

  function isModalOpen(){
    var modal = document.getElementById('crudPatternModal');
    return !!(modal && modal.classList.contains('show'));
  }
  function installAutoCloseAfterSave(){
    if(window.__crudModalFetchCloseInstalled) return;
    window.__crudModalFetchCloseInstalled = true;
    var originalFetch = window.fetch;
    if(typeof originalFetch !== 'function') return;
    window.fetch = function(){
      var requestArgs = arguments;
      var method = 'GET';
      try{
        var opt = requestArgs[1] || {};
        if(opt.method) method = String(opt.method).toUpperCase();
        else if(requestArgs[0] && requestArgs[0].method) method = String(requestArgs[0].method).toUpperCase();
      }catch(e){}
      var shouldWatch = saveArmed && isModalOpen() && method !== 'GET';
      return originalFetch.apply(this, requestArgs).then(function(res){
        if(shouldWatch){
          res.clone().json().then(function(json){
            var failed = !res.ok || (json && String(json.status || '').toLowerCase() === 'error') || (json && json.success === false);
            if(!failed){
              setTimeout(closeModal, 450);
            }
          }).catch(function(){
            if(res.ok) setTimeout(closeModal, 450);
          });
        }
        return res;
      });
    };
  }

  function wrapButtonText(btn){
    if(!btn || btn.dataset.crudWrapped === '1') return;
    var childNodes = Array.from(btn.childNodes);
    var labelParts = [];
    childNodes.forEach(function(n){ if(n.nodeType === 3 && n.textContent.trim()) labelParts.push(n.textContent.trim()); });
    childNodes.forEach(function(n){ if(n.nodeType === 3) btn.removeChild(n); });
    if(labelParts.length){
      var span = document.createElement('span');
      span.className = 'btn-label';
      span.textContent = labelParts.join(' ');
      btn.appendChild(span);
    }
    btn.dataset.crudWrapped = '1';
  }
  function ensureTitleActions(sectionTitle){
    sectionTitle.classList.add('crud-list-titlebar');
    var actions = sectionTitle.querySelector(':scope > .crud-title-actions');
    if(!actions){
      actions = document.createElement('div');
      actions.className = 'crud-title-actions';
      var directButtons = Array.from(sectionTitle.children).filter(function(el){
        return el.matches && el.matches('button, a.clean-btn, .clean-btn');
      });
      directButtons.forEach(function(btn){
        btn.classList.add('crud-toolbar-btn');
        wrapButtonText(btn);
        actions.appendChild(btn);
      });
      sectionTitle.appendChild(actions);
    }
    Array.from(actions.querySelectorAll('button, a')).forEach(function(btn){
      btn.classList.add('crud-toolbar-btn');
      wrapButtonText(btn);
    });
    return actions;
  }
  function addToolbarButton(listCard, formCard){
    var existingPageAdd = listCard.querySelector('.crud-add-btn');
    if(existingPageAdd){
      existingPageAdd.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        var resetBtn = formCard.querySelector('button[id*="reset" i], button[type="reset"]');
        if(resetBtn) resetBtn.click();
        setTimeout(function(){ openModal('Add ' + pageLabel()); }, 80);
      });
      return;
    }
    var sectionTitle = listCard.querySelector('.section-title') || listCard.querySelector('.card-clean-title') || listCard.firstElementChild;
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'clean-btn primary crud-add-btn crud-toolbar-btn';
    addBtn.innerHTML = '<i class="bi bi-plus-circle"></i><span class="btn-label">Add ' + pageLabel() + '</span>';
    addBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var resetBtn = formCard.querySelector('button[id*="reset" i], button[type="reset"]');
      if(resetBtn) resetBtn.click();
      setTimeout(function(){ openModal('Add ' + pageLabel()); }, 80);
    });
    if(sectionTitle){
      var actions = ensureTitleActions(sectionTitle);
      var existingAdd = actions.querySelector('.crud-add-btn');
      if(!existingAdd) actions.appendChild(addBtn);
    } else {
      listCard.insertBefore(addBtn, listCard.firstChild);
    }
  }
  function watchSuccessClose(formCard){
    var forms = formCard.querySelectorAll('form');
    forms.forEach(function(f){ f.addEventListener('submit', function(){ saveArmed = true; }, true); });

    var targets = formCard.querySelectorAll('.upload-status, .form-status, [id$="StatusBox"], [id$="Msg"], .alert');
    var observer = new MutationObserver(function(){
      if(!saveArmed) return;
      if(Date.now() - lastOpenedAt < 800) return;
      var success = Array.from(targets).some(function(t){
        var cls = t.className || '';
        var msg = text(t).toLowerCase();
        return (String(cls).includes('success') || msg.includes('success') || msg.includes('saved')) && msg && !msg.includes('error') && !msg.includes('fail');
      });
      if(success) setTimeout(closeModal, 650);
    });
    targets.forEach(function(t){ observer.observe(t, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class'] }); });
  }
  function standardizeAllTitlebars(){
    document.querySelectorAll('.slider-list-card .section-title, .manage-list-card .section-title, .template-list-card .section-title').forEach(function(titlebar){
      ensureTitleActions(titlebar);
    });
  }
  function init(){
    installAutoCloseAfterSave();
    standardizeAllTitlebars();
    var formCard = findFormCard();
    var listCard = findListCard();
    var grid = findGrid();
    if(!formCard || !listCard || !grid) return;
    if(document.body.dataset.crudModalReady === '1') return;
    document.body.dataset.crudModalReady = '1';
    grid.classList.add('crud-list-only-grid');
    listCard.classList.add('crud-list-full');
    formCard.classList.add('crud-modal-form-card');
    var modal = ensureModal();
    var body = modal.querySelector('#crudPatternBody');
    body.appendChild(formCard);
    addToolbarButton(listCard, formCard);
    watchSuccessClose(formCard);

    document.addEventListener('click', function(e){
      var btn = e.target.closest('button, a');
      if(!btn) return;
      if(btn.classList.contains('crud-add-btn')) return;
      if(btn.closest('#crudPatternModal')) return;
      var label = text(btn).toLowerCase();
      if(label.includes('delete') || label.includes('view') || label.includes('refresh')) return;
      if(label.includes('edit') || btn.matches('[data-edit], [data-action="edit"], .edit-btn, .btn-edit')){
        setTimeout(function(){ openModal(text(formCard.querySelector('h1,h2,h3,h4,h5')) || ('Edit ' + pageLabel())); }, 120);
      }
    }, true);

    var cancelLike = formCard.querySelectorAll('button');
    cancelLike.forEach(function(b){
      var label = text(b).toLowerCase();
      if(label === 'cancel' || label === 'close') b.addEventListener('click', closeModal);
      if(label.includes('save') || label.includes('create') || label.includes('update') || label.includes('submit')){
        b.addEventListener('click', function(){ saveArmed = true; }, true);
      }
    });
  }
  window.CrudModalPattern = { open: openModal, close: closeModal };
  ready(init);
})();
