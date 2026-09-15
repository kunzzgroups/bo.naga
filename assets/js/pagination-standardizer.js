(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);

  function createMirrorSelect(source){
    const select=document.createElement('select');
    select.setAttribute('aria-label','Rows per page');
    const values=source?[...source.options].map(o=>({value:o.value||o.textContent,label:o.textContent||o.value})):[{value:'10',label:'10'},{value:'25',label:'25'},{value:'50',label:'50'},{value:'100',label:'100'}];
    const seen=new Set();
    values.forEach(item=>{
      const v=String(item.value||'').trim();
      if(!v||seen.has(v))return;
      seen.add(v);
      const o=document.createElement('option');
      o.value=v;
      o.textContent=item.label||v;
      select.appendChild(o);
    });
    if(source) select.value=source.value;
    select.addEventListener('change',()=>{
      if(!source)return;
      source.value=select.value;
      source.dispatchEvent(new Event('change',{bubbles:true}));
    });
    if(source){
      source.addEventListener('change',()=>{select.value=source.value;});
      source.addEventListener('input',()=>{select.value=source.value;});
    }
    return select;
  }

  function inferTotal(root,infoSource){
    const fromData=Number(root?.dataset?.boTotal);
    if(Number.isFinite(fromData)&&fromData>=0) return fromData;
    const candidates=[infoSource,$('[id*="Count"]',root),$('[id*="Info"]',root),$('.users-found-badge',root),$('.text-muted',root)];
    for(const el of candidates){
      if(!el)continue;
      const t=el.textContent||'';
      let m=t.match(/of\s+(\d[\d,]*)\s+entries/i);
      if(!m)m=t.match(/(\d[\d,]*)\s*(?:entries|records?|record\(s\)|accounts|users|request\(s\))\s*$/i);
      if(m)return Number(m[1].replace(/,/g,''));
    }
    return 0;
  }

  function resolvePageSize(root,rawSize){
    const raw=String(rawSize??'-').trim();
    if(/^all$/i.test(raw)) return 10000;
    const fromData=Number(root?.dataset?.boPageSize);
    if((raw===''||raw==='-'||/^auto$/i.test(raw))&&Number.isFinite(fromData)&&fromData>0) return fromData;
    if(raw===''||raw==='-'||/^auto$/i.test(raw)){
      const scroll=root.querySelector('.bo-tx-table-body')||root.querySelector('.table-wrap')||document.querySelector('.bo-tx-table-body')||document.querySelector('.table-wrap');
      if(!scroll) return 12;
      const head=scroll.closest('.table-wrap')?.querySelector('.bo-tx-table-head')||scroll.querySelector('thead');
      const headH=scroll.classList.contains('bo-tx-table-body')?0:(head?Math.ceil(head.getBoundingClientRect().height):44);
      const avail=Math.max(0,Math.floor(scroll.clientHeight)-headH);
      const sample=scroll.querySelector('tbody tr td');
      const rowH=sample?Math.max(38,Math.round(sample.getBoundingClientRect().height)):41;
      return Math.max(5,Math.min(200,Math.floor(avail/rowH)||12));
    }
    const n=Number(raw);
    return Number.isFinite(n)&&n>0?n:12;
  }

  function currentPage(pager){
    if(!pager)return 1;
    const active=pager.querySelector('.active,[aria-current="page"]');
    if(active){const n=Number((active.textContent||'').trim());if(n)return n;}
    const m=(pager.textContent||'').match(/Page\s+(\d+)/i);
    return m?Number(m[1]):1;
  }

  function standardizeLegacy(shell){
    if(!shell||shell.dataset.paginationStandardized)return;
    const buttons=[...shell.querySelectorAll(':scope > button')];
    if(buttons.length<2)return;

    const prev=buttons.find(b=>/prev|‹|chevron-left/i.test((b.textContent||'')+' '+b.innerHTML))||buttons[0];
    const next=buttons.find(b=>/next|›|chevron-right/i.test((b.textContent||'')+' '+b.innerHTML))||buttons[buttons.length-1];
    const pager=[...shell.children].find(e=>e!==prev&&e!==next)||shell.querySelector('[id*="Pager"],[id*="Pagination"]');
    const root=shell.closest('.table-card,.vip-log-card,.report-card,.card')||shell.parentElement;
    const sourceSelect=[...document.querySelectorAll('select')].find(s=>/size|limit|perpage/i.test(s.id||''));
    const infoSource=[...root.querySelectorAll('[id]')].find(e=>/pageinfo|recordcount|count/i.test(e.id));

    shell.dataset.paginationStandardized='1';
    shell.className='bo-pagination-standard';

    const left=document.createElement('div');
    left.className='entries-control';
    left.append('Show ',createMirrorSelect(sourceSelect),' entries');

    const info=document.createElement('div');
    info.className='table-info';

    const right=document.createElement('div');
    right.className='pagination-clean';
    prev.classList.add('page-btn');
    next.classList.add('page-btn');
    prev.innerHTML='‹';
    next.innerHTML='›';
    right.appendChild(prev);
    if(pager){
      pager.classList.add('pagination-clean-inner');
      pager.classList.remove('text-muted','small');
      right.appendChild(pager);
    }
    right.appendChild(next);
    shell.replaceChildren(left,info,right);

    let raf=0;
    const update=()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const rawSize=(sourceSelect&&sourceSelect.value)||left.querySelector('select')?.value||'-';
        const size=resolvePageSize(root,rawSize);
        const total=inferTotal(root,infoSource);
        const page=Number(root?.dataset?.boPage)||currentPage(pager);
        const from=total?Math.min(((page-1)*size)+1,total):0;
        const to=total?Math.min(page*size,total):0;
        const text=`Showing ${from} to ${to} of ${total} entries`;
        if(info.textContent!==text)info.textContent=text;
      });
    };
    update();

    const observer=new MutationObserver(update);
    if(infoSource)observer.observe(infoSource,{childList:true,characterData:true,subtree:true});
    if(pager)observer.observe(pager,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']});
    if(sourceSelect)sourceSelect.addEventListener('change',update);
    const metaObs=new MutationObserver(update);
    metaObs.observe(root,{attributes:true,attributeFilter:['data-bo-total','data-bo-page-size','data-bo-page']});
  }

  function normalizeExisting(){
    document.querySelectorAll('.table-footer,.admin-table-footer,.table-pagination-wrap,.ref-pagination-row,.game-table-footer,.subcategory-table-footer,.bo-table-pagination').forEach(f=>{
      if(f.children.length<3)return;
      const info=f.querySelector('.table-info,.table-pagination-info,[id*="ShowingText"],:scope > span');
      if(info)info.classList.add('table-info');
      const pager=f.querySelector('.pagination-clean,.smart-pagination,.ref-pager,#memberPager');
      if(pager)pager.classList.add('pagination-clean');
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    normalizeExisting();
    document.querySelectorAll('.d-flex.justify-content-between.align-items-center.mt-3, .pwt-pager, .vip-log-pagination').forEach(standardizeLegacy);
  });
})();
