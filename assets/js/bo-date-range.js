(function(){
  const PAIRS = [
    ['betFrom','betTo'],['txFrom','txTo'],['sessionFrom','sessionTo'],['ledgerFrom','ledgerTo'],
    ['casinoFrom','casinoTo'],['reportFrom','reportTo']
  ];
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fmt=v=>{if(!v)return '';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`};
  const startOfWeek=d=>{const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x};
  const endOfWeek=d=>{const x=startOfWeek(d);x.setDate(x.getDate()+6);return x};
  function rangeFor(key){const now=new Date();let a=new Date(now),b=new Date(now);switch(key){
    case'today':break;case'yesterday':a.setDate(a.getDate()-1);b=new Date(a);break;
    case'this-week':a=startOfWeek(now);b=endOfWeek(now);break;
    case'last-week':a=startOfWeek(now);a.setDate(a.getDate()-7);b=endOfWeek(a);break;
    case'this-month':a=new Date(now.getFullYear(),now.getMonth(),1);b=new Date(now.getFullYear(),now.getMonth()+1,0);break;
    case'last-month':a=new Date(now.getFullYear(),now.getMonth()-1,1);b=new Date(now.getFullYear(),now.getMonth(),0);break;
    case'this-year':a=new Date(now.getFullYear(),0,1);b=new Date(now.getFullYear(),11,31);break;
    case'last-year':a=new Date(now.getFullYear()-1,0,1);b=new Date(now.getFullYear()-1,11,31);break;
  } return [a,b];}
  function build(from,to){
    if(!from||!to||from.dataset.rangeBuilt||to.dataset.rangeBuilt)return;
    from.dataset.rangeBuilt=to.dataset.rangeBuilt='1';
    const fField=from.closest('.field'), tField=to.closest('.field');
    if(!fField||!tField)return;
    const host=document.createElement('div');host.className='bo-range-field field';
    host.innerHTML='<label>Date Range</label><button type="button" class="bo-range-trigger"><span class="bo-range-icon"><i class="bi bi-calendar3"></i></span><span class="bo-range-text">Select date range</span><i class="bi bi-chevron-down bo-range-arrow"></i></button><div class="bo-range-pop"><div class="bo-range-presets">'+
      [['today','Today'],['yesterday','Yesterday'],['this-week','This Week'],['last-week','Last Week'],['this-month','This Month'],['last-month','Last Month'],['this-year','This Year'],['last-year','Last Year']].map(x=>`<button type="button" data-preset="${x[0]}">${x[1]}</button>`).join('')+
      '</div><div class="bo-range-calendar"><div class="bo-range-cal-head"><button type="button" data-nav="-1"><i class="bi bi-chevron-left"></i></button><select class="bo-range-month"></select><select class="bo-range-year"></select><button type="button" data-nav="1"><i class="bi bi-chevron-right"></i></button></div><div class="bo-range-week"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="bo-range-days"></div><div class="bo-range-hint">Select start date, then select end date.</div></div></div>';
    fField.parentNode.insertBefore(host,fField); fField.style.display='none';tField.style.display='none';
    const trig=host.querySelector('.bo-range-trigger'),pop=host.querySelector('.bo-range-pop'),txt=host.querySelector('.bo-range-text'),days=host.querySelector('.bo-range-days'),mon=host.querySelector('.bo-range-month'),yr=host.querySelector('.bo-range-year');
    let view=new Date(),start=from.value||'',end=to.value||'';
    for(let i=0;i<12;i++){const o=document.createElement('option');o.value=i;o.textContent=new Date(2000,i,1).toLocaleString('en',{month:'short'});mon.appendChild(o)}
    const cy=new Date().getFullYear();for(let y=cy-8;y<=cy+3;y++){const o=document.createElement('option');o.value=y;o.textContent=y;yr.appendChild(o)}
    function syncText(){txt.textContent=start?(fmt(start)+(end?' - '+fmt(end):' - Select end date')):'Select date range'}
    function commit(a,b){start=iso(a);end=iso(b);from.value=start;to.value=end;from.dispatchEvent(new Event('change',{bubbles:true}));to.dispatchEvent(new Event('change',{bubbles:true}));syncText()}
    function render(){mon.value=view.getMonth();yr.value=view.getFullYear();days.innerHTML='';const first=new Date(view.getFullYear(),view.getMonth(),1),offset=first.getDay(),last=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let i=0;i<42;i++){const d=new Date(view.getFullYear(),view.getMonth(),i-offset+1);const v=iso(d),b=document.createElement('button');b.type='button';b.textContent=d.getDate();b.className='bo-range-day'+(d.getMonth()!==view.getMonth()?' muted':'')+(v===start?' start':'')+(v===end?' end':'')+(start&&end&&v>start&&v<end?' in-range':'');b.addEventListener('click',()=>{if(!start||end){start=v;end='';from.value=start;to.value='';syncText();render();}else{if(v<start){end=start;start=v}else end=v;from.value=start;to.value=end;from.dispatchEvent(new Event('change',{bubbles:true}));to.dispatchEvent(new Event('change',{bubbles:true}));syncText();render();setTimeout(()=>pop.classList.remove('show'),120)}});days.appendChild(b)}}
    trig.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.bo-range-pop.show').forEach(x=>{if(x!==pop)x.classList.remove('show')});pop.classList.toggle('show');render()});
    host.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const r=rangeFor(b.dataset.preset);commit(r[0],r[1]);render();pop.classList.remove('show')}));
    host.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{view.setMonth(view.getMonth()+Number(b.dataset.nav));render()}));
    mon.addEventListener('change',()=>{view.setMonth(Number(mon.value));render()});yr.addEventListener('change',()=>{view.setFullYear(Number(yr.value));render()});
    document.addEventListener('click',e=>{if(!host.contains(e.target))pop.classList.remove('show')});syncText();render();
  }
  document.addEventListener('DOMContentLoaded',()=>PAIRS.forEach(p=>build(document.getElementById(p[0]),document.getElementById(p[1]))));
})();
