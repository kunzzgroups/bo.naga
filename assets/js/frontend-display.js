(function(){
  const select=document.getElementById('homeBonusEnabled');
  const saveBtn=document.getElementById('saveFrontendDisplay');
  const boSidebarInteraction=document.getElementById('boSidebarInteraction');
  const mobileHeaderLogoPosition=document.getElementById('mobileHeaderLogoPosition');
  let boUiSetting={headerMenuKeys:[],headerConfigured:false,sidebarInteraction:'HOVER'};
  const minDeposit=document.getElementById('minDepositAmount');
  const minWithdrawal=document.getElementById('minWithdrawalAmount');
  const rebateThreshold=document.getElementById('rebateAutoCreditThreshold');
  const marqueeEnabled=document.getElementById('marqueeEnabled');
  const leaderboardEnabled=document.getElementById('leaderboardEnabled');
  const topupRewardEnabled=document.getElementById('topupRewardEnabled');
  const vipSidebarEnabled=document.getElementById('vipSidebarEnabled');
  const liveTransactionEnabled=document.getElementById('liveTransactionEnabled');
  const liveTransactionMode=document.getElementById('liveTransactionMode');
  const liveTransactionIntervalSeconds=document.getElementById('liveTransactionIntervalSeconds');
  const liveTransactionRefreshRow=document.getElementById('liveTransactionRefreshRow');
  const liveTransactionRandomSecondsRow=document.getElementById('liveTransactionRandomSecondsRow');
  const liveTransactionRandomRowsRow=document.getElementById('liveTransactionRandomRowsRow');
  const liveTransactionRandomPriceRow=document.getElementById('liveTransactionRandomPriceRow');
  const liveTransactionRandomMinSeconds=document.getElementById('liveTransactionRandomMinSeconds');
  const liveTransactionRandomMaxSeconds=document.getElementById('liveTransactionRandomMaxSeconds');
  const liveTransactionRandomMinRows=document.getElementById('liveTransactionRandomMinRows');
  const liveTransactionRandomMaxRows=document.getElementById('liveTransactionRandomMaxRows');
  const liveTransactionRandomMinPrice=document.getElementById('liveTransactionRandomMinPrice');
  const liveTransactionRandomMaxPrice=document.getElementById('liveTransactionRandomMaxPrice');
  const brandTarget=document.getElementById('frontendDisplayBrandTarget');
  const brandTargetRow=document.getElementById('frontendDisplayBrandRow');
  const socialPluginSettings=document.getElementById('socialPluginSettings');
  const telegramBotToken=document.getElementById('telegramBotToken');
  const telegramBotId=document.getElementById('telegramBotId');
  const telegramBotUsername=document.getElementById('telegramBotUsername');
  const telegramBotTokenHelp=document.getElementById('telegramBotTokenHelp');
  const telegramBotTokenGuide=document.getElementById('telegramBotTokenGuide');
  const telegramBotTokenGuideClose=document.getElementById('telegramBotTokenGuideClose');
  const leaderboardFeatureRow=document.getElementById('leaderboardFeatureRow');
  const vipFeatureRow=document.getElementById('vipFeatureRow');
  let brandFeatureAccess={socialPluginEnabled:0,leaderboardEnabled:1,vipEnabled:1};
  let selectedTargetBrandId=Number(localStorage.getItem('bo_active_brand_id')||1)||1;
  const marqueeEditor=document.getElementById('marqueeEditor');
  const marqueeContent=document.getElementById('marqueeContent');
  const marqueePreview=document.getElementById('marqueePreview');
  const marqueePreviewBar=document.getElementById('marqueePreviewBar');
  const marqueeBgColorBtn=document.getElementById('marqueeBgColorBtn');
  const marqueeTextColorBtn=document.getElementById('marqueeTextColorBtn');
  const marqueeBgColorChip=document.getElementById('marqueeBgColorChip');
  const marqueeTextColorBar=document.getElementById('marqueeTextColorBar');
  const fdColorPop=document.getElementById('fdColorPop');
  const fdColorPopTitle=document.getElementById('fdColorPopTitle');
  const fdColorPopModeLabel=document.getElementById('fdColorPopModeLabel');
  const fdColorPopChip=document.getElementById('fdColorPopChip');
  const fdColorPopHexLabel=document.getElementById('fdColorPopHexLabel');
  const fdColorPopHex=document.getElementById('fdColorPopHex');
  const fdColorPopClose=document.getElementById('fdColorPopClose');
  const fdColorSwatches=document.getElementById('fdColorSwatches');
  const fdColorSv=document.getElementById('fdColorSv');
  const fdColorSvCursor=document.getElementById('fdColorSvCursor');
  const fdColorHue=document.getElementById('fdColorHue');
  const fdColorHueThumb=document.getElementById('fdColorHueThumb');
  const fdColorR=document.getElementById('fdColorR');
  const fdColorG=document.getElementById('fdColorG');
  const fdColorB=document.getElementById('fdColorB');
  const fdColorGrad=document.getElementById('fdColorGrad');
  const fdColorGradBody=document.getElementById('fdColorGradBody');
  const fdColorGradBar=document.getElementById('fdColorGradBar');
  const fdColorGradDirs=document.getElementById('fdColorGradDirs');
  const fdColorGradPresets=document.getElementById('fdColorGradPresets');
  const fdColorGradCss=document.getElementById('fdColorGradCss');
  const fdColorGradAngle=document.getElementById('fdColorGradAngle');
  const fdColorGradPos=document.getElementById('fdColorGradPos');
  const fdColorGradOpacity=document.getElementById('fdColorGradOpacity');
  const fdColorGradOpacityLabel=document.getElementById('fdColorGradOpacityLabel');
  const fdColorGradAdd=document.getElementById('fdColorGradAdd');
  const fdColorGradRemove=document.getElementById('fdColorGradRemove');
  const fdColorGradCopy=document.getElementById('fdColorGradCopy');
  const DEFAULT_MARQUEE_TEXT_COLOR='#18191C';
  const DEFAULT_MARQUEE_BG_COLOR='#F5EBDC';
  const MARQUEE_COLOR_PRESETS=[
    '#18191C','#57534E','#78716C','#FFFCF7','#F5EBDC','#EADCC8','#DCC9A8','#D97706',
    '#F59E0B','#FBBF24','#EA8608','#B45309','#FFFFFF','#0EA5E9','#22C55E','#EF4444'
  ];
  let marqueeColorMode='text';
  let marqueeBgValue=DEFAULT_MARQUEE_BG_COLOR;
  let marqueeTextValue=DEFAULT_MARQUEE_TEXT_COLOR;
  /* Background colour may be a gradient. The value handed to the editor, the chip and the preview is then
     a CSS linear-gradient string, which is also what a saved value would carry, so nothing that renders it
     with `background` has to learn a new format. `stop` is which end the spectrum/RGB/hex fields edit. */
  let marqueeBgGrad={
    on:false,
    type:'linear',                 /* linear | radial | conic */
    angle:135,                     /* linear angle, and the `from` angle of a conic */
    stops:[ { color:DEFAULT_MARQUEE_BG_COLOR, pos:0, alpha:1 }, { color:'#E8C98A', pos:100, alpha:1 } ],
    active:0                       /* which stop the spectrum / RGB / hex / opacity edit */
  };
  /* The value handed to the chip, the live preview and the marquee editor is always a CSS string, so the
     saved field and the storefront need no new format; `marqueeBg` carries it to the API. */
  const MARQUEE_GRAD_DIRS=[0,45,90,135,180,225,270,315];
  const MARQUEE_GRAD_DIR_GLYPH={0:'\u2191',45:'\u2197',90:'\u2192',135:'\u2198',180:'\u2193',225:'\u2199',270:'\u2190',315:'\u2196'};
  const MARQUEE_GRAD_PRESETS=[
    { type:'linear', angle:135, stops:[['#F5EBDC',0,1],['#E8C98A',100,1]] },
    { type:'linear', angle:90,  stops:[['#7C3AED',0,1],['#22D3EE',100,1]] },
    { type:'linear', angle:90,  stops:[['#F59E0B',0,1],['#EF4444',100,1]] },
    { type:'linear', angle:120, stops:[['#0EA5E9',0,1],['#7C3AED',50,1],['#EC4899',100,1]] },
    { type:'linear', angle:180, stops:[['#18191C',0,1],['#5C4A30',100,1]] },
    { type:'radial', angle:0,   stops:[['#FDE68A',0,1],['#B45309',100,1]] }
  ];
  let pickerHsv={h:30,s:0,v:0.11};
  let spectrumDragging=null;
  const installAppDisplayName=document.getElementById('installAppDisplayName');
  const installAppLogoFile=document.getElementById('installAppLogoFile');
  const installAppLogoPreview=document.getElementById('installAppLogoPreview');
  const chooseInstallAppLogo=document.getElementById('chooseInstallAppLogo');
  const removeInstallAppLogo=document.getElementById('removeInstallAppLogo');
  const installEndpoint=String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+(API_CONFIG.ENDPOINTS.INSTALL_APP_SETTING||'/admin/frontend/install-app');
  let selectedInstallLogo=null;
  let removeExistingInstallLogo=false;
  let currentInstallLogoUrl='';
  let previewObjectUrl='';
  const message=document.getElementById('frontendDisplayMessage');
  const endpoint=String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+API_CONFIG.ENDPOINTS.FRONTEND_DISPLAY_SETTING;

  function headers(json){
    const h={...(json?{'Content-Type':'application/json'}:{}),...(window.BO_AUTH?BO_AUTH.authHeader():{})};
    if(selectedTargetBrandId) h['X-Brand-Id']=String(selectedTargetBrandId);
    h['Cache-Control']='no-cache, no-store';
    h['Pragma']='no-cache';
    return h;
  }

  async function loadBrandTarget(){
    if(!window.BO_BRAND||typeof BO_BRAND.context!=='function') return;
    try{
      const j=await BO_BRAND.context(true);
      const d=j&&j.data?j.data:{};
      const brands=Array.isArray(d.brands)?d.brands:[];
      selectedTargetBrandId=d.master?(Number(localStorage.getItem('bo_active_brand_id')||d.activeBrandId||1)||1):(Number(d.adminBrandId||d.activeBrandId||1)||1);
      if(d.master&&brandTarget&&brands.length){
        brandTarget.innerHTML=brands.filter(b=>Number(b.status)!==0).map(b=>`<option value="${Number(b.id)}">${String(b.name||b.code||('Brand '+b.id)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</option>`).join('');
        if(!brands.some(b=>Number(b.id)===selectedTargetBrandId)) selectedTargetBrandId=Number(d.activeBrandId||brands[0].id||1)||1;
        brandTarget.value=String(selectedTargetBrandId);
        if(brandTargetRow) brandTargetRow.style.display='';
      }else if(brandTargetRow){
        brandTargetRow.style.display='none';
      }
    }catch(e){console.warn('Unable to resolve frontend display brand target:',e&&e.message);}
  }

  function assertTarget(json){
    const id=Number(json&&json.data&&json.data.id);
    if(selectedTargetBrandId&&id&&id!==selectedTargetBrandId){
      throw new Error(`Brand context mismatch: requested brand ${selectedTargetBrandId}, API returned brand ${id}. Please refresh and try again.`);
    }
  }

  function setMessage(text,type){
    message.textContent=text||'';
    message.className='upload-status mt-2 '+(type||'');
  }

  function renderInstallLogo(url,temporary){
    if(previewObjectUrl && previewObjectUrl!==url){try{URL.revokeObjectURL(previewObjectUrl)}catch(_){}}
    previewObjectUrl=temporary?String(url||''):'';
    if(!temporary) currentInstallLogoUrl=String(url||'');
    const shown=String(url||'');
    if(!installAppLogoPreview) return;
    installAppLogoPreview.innerHTML=shown
      ?`<img src="${shown.replace(/"/g,'&quot;')}" alt="Install app logo">`
      :'<span>No logo</span>';
  }

  function readImageSize(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{const size={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);resolve(size)};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Unable to read logo image'))};
      img.src=url;
    });
  }

  async function loadInstallSetting(){
    const response=await fetch(installEndpoint+(installEndpoint.includes('?')?'&':'?')+'_cfg='+Date.now(),{headers:headers(false),cache:'no-store'});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to load Add to Home Screen setting');
    const data=json.data||{};
    if(installAppDisplayName) installAppDisplayName.value=data.displayName||'TitanX Gaming';
    renderInstallLogo(data.logoUrl||'');
  }

  async function saveInstallSetting(){
    const name=String(installAppDisplayName?.value||'').trim();
    if(!name) throw new Error('Add to Home Screen display name is required');
    const fd=new FormData();
    fd.append('displayName',name);
    fd.append('removeLogo',removeExistingInstallLogo?'1':'0');
    if(selectedInstallLogo) fd.append('logo',selectedInstallLogo);
    const response=await fetch(installEndpoint,{method:'POST',headers:headers(false),body:fd});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save Add to Home Screen setting');
    selectedInstallLogo=null;removeExistingInstallLogo=false;
    if(installAppLogoFile) installAppLogoFile.value='';
    renderInstallLogo(json.data?.logoUrl||'');
    return json.data||{};
  }

  function normalizeEnabled(value){
    if(value===false || value===0) return '0';
    const text=String(value??'').trim().toLowerCase();
    if(['0','false','disabled','disable','off','no'].includes(text)) return '0';
    return '1';
  }

  function syncSelect(value){
    select.value=normalizeEnabled(value);
    // reports.js replaces native selects with a rounded visual button.
    // Dispatching change keeps that visible label synchronized with the real value.
    select.dispatchEvent(new Event('change',{bubbles:true}));
    paintSwitch(select);
  }

  function syncMarquee(){
    if(!marqueeEditor) return;
    marqueeContent.value=marqueeEditor.innerHTML.trim();
    if(marqueePreview){
      marqueePreview.innerHTML=marqueeContent.value || 'Marquee preview';
      // Restart scroll so edits always show motion
      marqueePreview.style.animation='none';
      void marqueePreview.offsetWidth;
      marqueePreview.style.animation='';
    }
  }

  function normalizeHexColor(value,fallback){
    const raw=String(value||'').trim();
    if(/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
    if(/^#[0-9a-fA-F]{3}$/.test(raw)){
      return ('#'+raw[1]+raw[1]+raw[2]+raw[2]+raw[3]+raw[3]).toUpperCase();
    }
    return String(fallback||DEFAULT_MARQUEE_TEXT_COLOR).toUpperCase();
  }

  function clamp(n,min,max){ return Math.min(max,Math.max(min,n)); }

  function hexToRgb(hex){
    const h=normalizeHexColor(hex,'#000000').slice(1);
    return {
      r:parseInt(h.slice(0,2),16),
      g:parseInt(h.slice(2,4),16),
      b:parseInt(h.slice(4,6),16)
    };
  }

  function rgbToHex(r,g,b){
    return ('#'+[r,g,b].map(function(n){
      return clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
    }).join('')).toUpperCase();
  }

  function rgbToHsv(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    const d=max-min;
    let h=0;
    if(d!==0){
      if(max===r) h=((g-b)/d)%6;
      else if(max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h*=60;
      if(h<0) h+=360;
    }
    const s=max===0?0:d/max;
    return {h:h,s:s,v:max};
  }

  function hsvToRgb(h,s,v){
    const c=v*s;
    const x=c*(1-Math.abs((h/60)%2-1));
    const m=v-c;
    let r=0,g=0,b=0;
    if(h<60){ r=c; g=x; }
    else if(h<120){ r=x; g=c; }
    else if(h<180){ g=c; b=x; }
    else if(h<240){ g=x; b=c; }
    else if(h<300){ r=x; b=c; }
    else { r=c; b=x; }
    return {
      r:Math.round((r+m)*255),
      g:Math.round((g+m)*255),
      b:Math.round((b+m)*255)
    };
  }

  function hsvToHex(hsv){
    const rgb=hsvToRgb(hsv.h,hsv.s,hsv.v);
    return rgbToHex(rgb.r,rgb.g,rgb.b);
  }

  function hueCss(h){
    const rgb=hsvToRgb(h,1,1);
    return 'rgb('+rgb.r+','+rgb.g+','+rgb.b+')';
  }

  function isGradientValue(value){
    return /^(linear|radial|conic)-gradient\(/i.test(String(value==null?'':value).trim());
  }

  function rgbaCss(hex,alpha){
    const rgb=hexToRgb(normalizeHexColor(hex,'#000000'));
    const a=Math.max(0,Math.min(1,alpha==null?1:Number(alpha)));
    return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+(Math.round(a*1000)/1000)+')';
  }

  function gradStopCss(stop){
    const color=(Number(stop.alpha)>=1)?stop.color:rgbaCss(stop.color,stop.alpha);
    return color+' '+Math.round(clamp(Number(stop.pos)||0,0,100))+'%';
  }

  function gradientCss(){
    const stops=marqueeBgGrad.stops.map(gradStopCss).join(', ');
    const angle=Math.round(clamp(Number(marqueeBgGrad.angle)||0,0,360));
    if(marqueeBgGrad.type==='radial') return 'radial-gradient(circle at 50% 50%, '+stops+')';
    if(marqueeBgGrad.type==='conic') return 'conic-gradient(from '+angle+'deg at 50% 50%, '+stops+')';
    return 'linear-gradient('+angle+'deg, '+stops+')';
  }

  function parseStopColor(token){
    const t=String(token||'').trim();
    let m=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(t);
    if(m) return { color:normalizeHexColor(t,'#000000'), alpha:1 };
    m=/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i.exec(t);
    if(m) return { color:rgbToHex(clamp(Number(m[1])||0,0,255),clamp(Number(m[2])||0,0,255),clamp(Number(m[3])||0,0,255)),
                   alpha:(m[4]==null?1:clamp(Number(m[4]),0,1)) };
    return null;
  }

  /* Reads back the shapes this editor writes - linear(deg), radial(circle at ...) and conic(from deg at ...)
     with any number of hex/rgba stops - and leaves the state alone for anything else. */
  function parseGradientValue(value){
    const raw=String(value==null?'':value).trim();
    const head=/^(linear|radial|conic)-gradient\((.*)\)$/i.exec(raw);
    if(!head) return false;
    const kind=head[1].toLowerCase();
    let body=head[2], angle=marqueeBgGrad.angle;
    const angleHit=/^\s*(-?[0-9.]+)deg\s*,\s*/.exec(body);
    if(angleHit){ angle=clamp(Number(angleHit[1])||0,0,360); body=body.slice(angleHit[0].length); }
    else if(kind==='conic'){
      const from=/^\s*from\s+(-?[0-9.]+)deg(?:\s+at\s+[^,]+)?\s*,\s*/i.exec(body);
      if(from){ angle=clamp(Number(from[1])||0,0,360); body=body.slice(from[0].length); }
      else{ const at=/^\s*at\s+[^,]+\s*,\s*/i.exec(body); if(at) body=body.slice(at[0].length); }
    }else if(kind==='radial'){
      const at=/^[^,]*?at\s+[^,]+\s*,\s*/i.exec(body);
      if(at) body=body.slice(at[0].length);
    }
    const parts=[]; let depth=0, cur='';
    for(let n=0;n<body.length;n++){
      const ch=body.charAt(n);
      if(ch==='(') depth++;
      if(ch===')') depth--;
      if(ch===','&&depth===0){ parts.push(cur); cur=''; } else { cur+=ch; }
    }
    if(cur.trim()) parts.push(cur);
    const stops=[];
    parts.forEach(function(part){
      const tokens=String(part).trim().split(/\s+/);
      const color=parseStopColor(tokens[0]);
      if(!color) return;
      const posToken=tokens.find(function(t){ return /%$/.test(t); });
      stops.push({ color:color.color, alpha:color.alpha, pos:(posToken==null?null:Number(posToken.replace('%',''))) });
    });
    if(stops.length<1) return false;
    stops.forEach(function(stop,idx){
      if(stop.pos==null||isNaN(stop.pos)) stop.pos=Math.round((idx/Math.max(1,stops.length-1))*100);
      stop.pos=clamp(stop.pos,0,100);
    });
    marqueeBgGrad.on=true;
    marqueeBgGrad.type=kind;
    marqueeBgGrad.angle=angle;
    marqueeBgGrad.stops=stops;
    marqueeBgGrad.active=0;
    return true;
  }

  function marqueeBgCss(){
    return marqueeBgGrad.on?gradientCss():marqueeBgValue;
  }

  function activeGradStop(){
    if(marqueeBgGrad.active<0||marqueeBgGrad.active>=marqueeBgGrad.stops.length) marqueeBgGrad.active=0;
    return marqueeBgGrad.stops[marqueeBgGrad.active];
  }

  function activeGradStopHex(){
    return activeGradStop().color;
  }

  function setActiveGradStop(hex){
    const stop=activeGradStop();
    stop.color=normalizeHexColor(hex,stop.color);
  }

  function addGradStop(pos){
    const at=clamp(pos==null?50:pos,0,100);
    const sorted=marqueeBgGrad.stops.slice().sort(function(a,b){ return a.pos-b.pos; });
    let colour=sorted[0].color, alpha=sorted[0].alpha;
    for(let n=0;n<sorted.length;n++){ if(sorted[n].pos<=at){ colour=sorted[n].color; alpha=sorted[n].alpha; } }
    if(marqueeBgGrad.stops.length>=8) return;
    marqueeBgGrad.stops.push({ color:colour, pos:at, alpha:alpha });
    marqueeBgGrad.stops.sort(function(a,b){ return a.pos-b.pos; });
    marqueeBgGrad.active=marqueeBgGrad.stops.findIndex(function(st){ return st.pos===at; });
    if(marqueeBgGrad.active<0) marqueeBgGrad.active=0;
    paintMarqueeBg();
  }

  function removeGradStop(){
    if(marqueeBgGrad.stops.length<=2) return;
    marqueeBgGrad.stops.splice(marqueeBgGrad.active,1);
    marqueeBgGrad.active=Math.max(0,Math.min(marqueeBgGrad.active,marqueeBgGrad.stops.length-1));
    paintMarqueeBg();
  }

  function gradBarHandlesHtml(){
    return marqueeBgGrad.stops.map(function(stop,idx){
      return '<button type="button" class="fd-color-grad-handle'+(idx===marqueeBgGrad.active?' is-active':'')+'"'
        +' data-fd-grad-handle="'+idx+'" style="left:'+Math.round(clamp(stop.pos,0,100))+'%;background:'+stop.color+'"'
        +' aria-label="Stop '+(idx+1)+'" aria-pressed="'+(idx===marqueeBgGrad.active)+'"></button>';
    }).join('');
  }

  function syncGradUI(){
    if(fdColorGrad) fdColorGrad.hidden=marqueeColorMode!=='bg';
    if(fdColorGradBody) fdColorGradBody.hidden=!marqueeBgGrad.on;
    if(!marqueeBgGrad.on) return;
    document.querySelectorAll('[data-fd-color-type]').forEach(function(b){
      const on=(b.dataset.fdColorType==='gradient')===marqueeBgGrad.on;
      b.classList.toggle('is-active',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
    document.querySelectorAll('[data-fd-grad-type]').forEach(function(b){
      const on=b.dataset.fdGradType===marqueeBgGrad.type;
      b.classList.toggle('is-active',on);
      b.setAttribute('aria-selected',on?'true':'false');
    });
    /* A direction only means something to a linear gradient (and, as the from-angle, to a conic). */
    if(fdColorGradDirs) fdColorGradDirs.hidden=(marqueeBgGrad.type==='radial');
    if(fdColorGradDirs){
      fdColorGradDirs.querySelectorAll('[data-fd-grad-dir]').forEach(function(b){
        const on=Number(b.dataset.fdGradDir)===Math.round(clamp(marqueeBgGrad.angle,0,360));
        b.classList.toggle('is-active',on);
        b.setAttribute('aria-pressed',on?'true':'false');
      });
    }
    if(fdColorGradBar){
      fdColorGradBar.style.background=gradientCss();
      fdColorGradBar.innerHTML=gradBarHandlesHtml();
    }
    const stop=activeGradStop();
    if(fdColorGradAngle&&document.activeElement!==fdColorGradAngle) fdColorGradAngle.value=String(Math.round(clamp(marqueeBgGrad.angle,0,360)));
    if(fdColorGradPos&&document.activeElement!==fdColorGradPos) fdColorGradPos.value=String(Math.round(clamp(stop.pos,0,100)));
    if(fdColorGradOpacity&&document.activeElement!==fdColorGradOpacity) fdColorGradOpacity.value=String(Math.round(clamp(stop.alpha,0,1)*100));
    if(fdColorGradOpacityLabel) fdColorGradOpacityLabel.textContent=Math.round(clamp(stop.alpha,0,1)*100)+'%';
    if(fdColorGradRemove) fdColorGradRemove.disabled=marqueeBgGrad.stops.length<=2;
    if(fdColorGradCss) fdColorGradCss.textContent=gradientCss();
    if(fdColorGradPresets){
      fdColorGradPresets.querySelectorAll('[data-fd-grad-preset]').forEach(function(b,idx){
        b.classList.toggle('is-active',b.dataset.fdGradPresetCss===gradientCss());
      });
    }
  }

  /* Internal edits paint the value; only an outside colour (swatch, spectrum, hex, saved value) goes through
     applyMarqueeBackground, because that one re-reads the string and would move the selected stop. */
  function paintMarqueeBg(){
    const css=marqueeBgCss();
    if(marqueeBgColorChip) marqueeBgColorChip.style.background=css;
    if(marqueePreviewBar) marqueePreviewBar.style.background=css;
    if(marqueeEditor){
      const useThemeChrome=isDarkTheme() && !marqueeBgGrad.on
        && marqueeBgValue.toUpperCase()===DEFAULT_MARQUEE_BG_COLOR.toUpperCase();
      marqueeEditor.style.background=useThemeChrome?'':css;
    }
    syncGradUI();
  }

  function renderGradPresets(){
    if(!fdColorGradPresets||fdColorGradPresets.dataset.ready==='1') return;
    fdColorGradPresets.innerHTML=MARQUEE_GRAD_PRESETS.map(function(preset,idx){
      const saved={ type:marqueeBgGrad.type, angle:marqueeBgGrad.angle, stops:marqueeBgGrad.stops, active:marqueeBgGrad.active };
      marqueeBgGrad.type=preset.type;
      marqueeBgGrad.angle=preset.angle;
      marqueeBgGrad.stops=preset.stops.map(function(st){ return { color:st[0], pos:st[1], alpha:st[2] }; });
      const css=gradientCss();
      marqueeBgGrad.type=saved.type; marqueeBgGrad.angle=saved.angle; marqueeBgGrad.stops=saved.stops; marqueeBgGrad.active=saved.active;
      return '<button type="button" class="fd-color-grad-preset" data-fd-grad-preset="'+idx+'"'
        +' data-fd-grad-preset-css="'+css+'" style="background:'+css+'" title="Preset '+(idx+1)+'"'
        +' aria-label="Gradient preset '+(idx+1)+'"></button>';
    }).join('');
    fdColorGradPresets.dataset.ready='1';
  }

  function renderGradDirs(){
    if(!fdColorGradDirs||fdColorGradDirs.dataset.ready==='1') return;
    fdColorGradDirs.innerHTML=MARQUEE_GRAD_DIRS.map(function(deg){
      return '<button type="button" class="fd-color-grad-dir" data-fd-grad-dir="'+deg+'" title="'+deg+'deg"'
        +' aria-label="Direction '+deg+' degrees" aria-pressed="false">'+MARQUEE_GRAD_DIR_GLYPH[deg]+'</button>';
    }).join('');
    fdColorGradDirs.dataset.ready='1';
  }

  function bindGradBar(){
    if(!fdColorGradBar||fdColorGradBar.dataset.bound==='1') return;
    fdColorGradBar.dataset.bound='1';
    let dragging=null;
    const posOf=function(e){
      const r=fdColorGradBar.getBoundingClientRect();
      return clamp(Math.round(((e.clientX-r.left)/Math.max(1,r.width))*100),0,100);
    };
    fdColorGradBar.addEventListener('pointerdown',function(e){
      const handle=e.target.closest?e.target.closest('[data-fd-grad-handle]'):null;
      const idx=handle?Number(handle.dataset.fdGradHandle):-1;
      if(idx>=0&&idx<marqueeBgGrad.stops.length){
        marqueeBgGrad.active=idx;
        marqueeBgGrad.stops[idx].pos=posOf(e);
        dragging=idx;
      }else{
        addGradStop(posOf(e));
        dragging=marqueeBgGrad.active;
      }
      try{ fdColorGradBar.setPointerCapture(e.pointerId); }catch(err){}
      paintMarqueeBg();
      e.preventDefault();
    });
    fdColorGradBar.addEventListener('pointermove',function(e){
      if(dragging==null) return;
      const stop=marqueeBgGrad.stops[dragging];
      if(!stop) return;
      stop.pos=posOf(e);
      marqueeBgGrad.active=dragging;
      paintMarqueeBg();
    });
    const stopDrag=function(){ dragging=null; };
    fdColorGradBar.addEventListener('pointerup',stopDrag);
    fdColorGradBar.addEventListener('pointercancel',stopDrag);
  }

  function currentMarqueeColor(){
    if(marqueeColorMode!=='bg') return marqueeTextValue;
    return marqueeBgGrad.on?activeGradStopHex():marqueeBgValue;
  }

  function syncSpectrumControls(hex){
    const value=normalizeHexColor(hex,currentMarqueeColor());
    const rgb=hexToRgb(value);
    pickerHsv=rgbToHsv(rgb.r,rgb.g,rgb.b);
    if(fdColorSv) fdColorSv.style.setProperty('--fd-hue',hueCss(pickerHsv.h));
    if(fdColorSvCursor){
      fdColorSvCursor.style.left=(pickerHsv.s*100)+'%';
      fdColorSvCursor.style.top=((1-pickerHsv.v)*100)+'%';
    }
    if(fdColorHueThumb){
      fdColorHueThumb.style.left=((pickerHsv.h/360)*100)+'%';
      fdColorHueThumb.style.background=hueCss(pickerHsv.h);
    }
    if(fdColorR) fdColorR.value=String(rgb.r);
    if(fdColorG) fdColorG.value=String(rgb.g);
    if(fdColorB) fdColorB.value=String(rgb.b);
  }

  function syncColorPopoverUI(hex){
    const value=normalizeHexColor(hex,currentMarqueeColor());
    syncGradUI();
    if(fdColorPopChip) fdColorPopChip.style.background=value;
    if(fdColorPopHexLabel) fdColorPopHexLabel.textContent=value;
    if(fdColorPopHex) fdColorPopHex.value=value;
    syncSpectrumControls(value);
    if(fdColorSwatches){
      fdColorSwatches.querySelectorAll('.fd-color-swatch-btn').forEach(btn=>{
        btn.classList.toggle('is-active',btn.dataset.color===value);
      });
    }
  }

  function applyFromHsv(isFinal){
    const hex=hsvToHex(pickerHsv);
    if(marqueeColorMode==='bg'){
      applyMarqueeBackground(hex);
      syncColorPopoverUI(hex);
      return;
    }
    marqueeTextValue=hex;
    if(marqueeTextColorBar) marqueeTextColorBar.style.backgroundColor=hex;
    syncColorPopoverUI(hex);
    if(isFinal) applyMarqueeTextColor(hex);
  }

  function updateSvFromEvent(e,isFinal){
    if(!fdColorSv) return;
    const rect=fdColorSv.getBoundingClientRect();
    const x=clamp((e.clientX-rect.left)/rect.width,0,1);
    const y=clamp((e.clientY-rect.top)/rect.height,0,1);
    pickerHsv.s=x;
    pickerHsv.v=1-y;
    applyFromHsv(!!isFinal);
  }

  function updateHueFromEvent(e,isFinal){
    if(!fdColorHue) return;
    const rect=fdColorHue.getBoundingClientRect();
    const x=clamp((e.clientX-rect.left)/rect.width,0,1);
    pickerHsv.h=x*360;
    applyFromHsv(!!isFinal);
  }

  function bindSpectrumPointer(el,handler,kind){
    if(!el) return;
    el.addEventListener('pointerdown',function(e){
      e.preventDefault();
      spectrumDragging=kind;
      try{ el.setPointerCapture(e.pointerId); }catch(_){}
      handler(e,false);
    });
    el.addEventListener('pointermove',function(e){
      if(spectrumDragging!==kind) return;
      handler(e,false);
    });
    el.addEventListener('pointerup',function(e){
      if(spectrumDragging===kind) handler(e,true);
      spectrumDragging=null;
    });
    el.addEventListener('pointercancel',function(){ spectrumDragging=null; });
  }

  function renderColorSwatches(){
    if(!fdColorSwatches||fdColorSwatches.dataset.ready==='1') return;
    fdColorSwatches.innerHTML=MARQUEE_COLOR_PRESETS.map(function(color){
      return '<button type="button" class="fd-color-swatch-btn" role="option" data-color="'+color+'" title="'+color+'" style="background:'+color+'" aria-label="'+color+'"></button>';
    }).join('');
    fdColorSwatches.dataset.ready='1';
    fdColorSwatches.addEventListener('click',function(e){
      const btn=e.target.closest('.fd-color-swatch-btn');
      if(!btn) return;
      applyPopoverColor(btn.dataset.color);
    });
  }

  function positionColorPopover(anchor){
    if(!fdColorPop||!anchor) return;
    if(fdColorPop.parentElement!==document.body) document.body.appendChild(fdColorPop);
    const rect=anchor.getBoundingClientRect();
    const pad=8;
    const popW=fdColorPop.offsetWidth||280;
    const popH=fdColorPop.offsetHeight||420;
    let left=Math.min(Math.max(pad,rect.left),window.innerWidth-popW-pad);
    let top=rect.bottom+pad;
    if(top+popH>window.innerHeight-pad){
      top=Math.max(pad,rect.top-popH-pad);
    }
    fdColorPop.style.left=Math.round(left)+'px';
    fdColorPop.style.top=Math.round(top)+'px';
  }

  function closeColorPopover(){
    if(!fdColorPop) return;
    fdColorPop.classList.remove('is-open');
    fdColorPop.hidden=true;
    spectrumDragging=null;
    marqueeBgColorBtn?.classList.remove('is-open');
    marqueeTextColorBtn?.classList.remove('is-open');
    marqueeBgColorBtn?.setAttribute('aria-expanded','false');
    marqueeTextColorBtn?.setAttribute('aria-expanded','false');
  }

  function openColorPopover(mode,anchor){
    if(!fdColorPop) return;
    marqueeColorMode=mode==='bg'?'bg':'text';
    renderColorSwatches();
    if(fdColorPopTitle) fdColorPopTitle.textContent=marqueeColorMode==='bg'?'Background colour':'Text colour';
    if(fdColorPopModeLabel) fdColorPopModeLabel.textContent=marqueeColorMode==='bg'?'Background':'Text';
    marqueeBgColorBtn?.classList.toggle('is-open',marqueeColorMode==='bg');
    marqueeTextColorBtn?.classList.toggle('is-open',marqueeColorMode==='text');
    marqueeBgColorBtn?.setAttribute('aria-expanded',marqueeColorMode==='bg'?'true':'false');
    marqueeTextColorBtn?.setAttribute('aria-expanded',marqueeColorMode==='text'?'true':'false');
    fdColorPop.hidden=false;
    fdColorPop.classList.add('is-open');
    syncColorPopoverUI(currentMarqueeColor());
    positionColorPopover(anchor);
    requestAnimationFrame(function(){ positionColorPopover(anchor); });
  }

  function toggleColorPopover(mode,anchor){
    const isOpen=fdColorPop&&fdColorPop.classList.contains('is-open')&&marqueeColorMode===mode;
    if(isOpen){ closeColorPopover(); return; }
    openColorPopover(mode,anchor);
  }

  function applyPopoverColor(value){
    if(marqueeColorMode==='bg'&&isGradientValue(value)){
      /* A whole CSS gradient pasted into the hex field: parse it directly. Running it through the hex
         normaliser first would reject it and hand the current colour back, which is why a paste used to do
         nothing at all. */
      applyMarqueeBackground(String(value).trim());
      syncColorPopoverUI(activeGradStopHex());
      return;
    }
    const hex=normalizeHexColor(value,currentMarqueeColor());
    if(marqueeColorMode==='bg') applyMarqueeBackground(hex);
    else applyMarqueeTextColor(hex);
    syncColorPopoverUI(hex);
  }

  function applyRgbInputs(){
    const r=clamp(Number(fdColorR?.value||0),0,255);
    const g=clamp(Number(fdColorG?.value||0),0,255);
    const b=clamp(Number(fdColorB?.value||0),0,255);
    applyPopoverColor(rgbToHex(r,g,b));
  }

  function isDarkTheme(){
    return document.documentElement.getAttribute('data-bo-theme')==='dark';
  }

  function applyMarqueeBackground(value){
    if(isGradientValue(value)){
      parseGradientValue(value);
    }else if(marqueeBgGrad.on){
      /* A plain colour arriving while a gradient is on is one of its stops: the spectrum, the hue bar, a
         swatch and the RGB fields all hand a hex over through here. Turning the gradient off is the Solid
         switch's job, and it clears `on` before calling, so it still reaches the branch below. */
      setActiveGradStop(normalizeHexColor(value,activeGradStopHex()));
    }else{
      marqueeBgGrad.on=false;
      marqueeBgValue=normalizeHexColor(value,DEFAULT_MARQUEE_BG_COLOR);
    }
    paintMarqueeBg();

  }

  function applyMarqueeTextColor(value){
    const hex=normalizeHexColor(value,DEFAULT_MARQUEE_TEXT_COLOR);
    marqueeTextValue=hex;
    if(marqueeTextColorBar) marqueeTextColorBar.style.backgroundColor=hex;
    if(!marqueeEditor) return;
    marqueeEditor.focus();
    const selection=window.getSelection && window.getSelection();
    const hasRange=selection && selection.rangeCount>0 && !selection.isCollapsed && marqueeEditor.contains(selection.anchorNode);
    if(hasRange){
      document.execCommand('foreColor',false,hex);
    }else if((marqueeEditor.innerText||'').trim()){
      const range=document.createRange();
      range.selectNodeContents(marqueeEditor);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('foreColor',false,hex);
      selection.removeAllRanges();
    }else{
      marqueeEditor.style.color=hex;
    }
    syncMarquee();
  }

  function syncSelectValue(el,value){
    if(!el) return;
    el.value=normalizeEnabled(value);
    el.dispatchEvent(new Event('change',{bubbles:true}));
    paintSwitch(el);
  }

  function paintSwitch(selectEl){
    if(!selectEl||!selectEl.id) return;
    const btn=document.querySelector('[data-fd-switch="'+selectEl.id+'"]');
    if(!btn) return;
    const on=selectEl.value==='1';
    btn.setAttribute('aria-checked',on?'true':'false');
    const label=btn.querySelector('.fd-switch-text');
    if(label) label.textContent=on?'On':'Off';
  }


  function renderLiveTransactionMode(){
    const random=liveTransactionMode?.value==='FAKE';
    liveTransactionRefreshRow?.classList.toggle('is-hidden',random);
    liveTransactionRefreshRow?.style.setProperty('display',random?'none':'');
    liveTransactionRandomSecondsRow?.classList.toggle('is-hidden',!random);
    liveTransactionRandomRowsRow?.classList.toggle('is-hidden',!random);
    liveTransactionRandomPriceRow?.classList.toggle('is-hidden',!random);
  }

  async function loadBrandFeatureAccess(){
    try{
      const r=await fetch(String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+'/admin/frontend/feature-access',{headers:headers(false),cache:'no-store'});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||j.status==='error') throw new Error(j.message||'Unable to load brand feature access');
      brandFeatureAccess=j.data||brandFeatureAccess;
    }catch(e){brandFeatureAccess={socialPluginEnabled:0,leaderboardEnabled:0,vipEnabled:0};}
    const featureOn=(value)=>value===true||value===1||String(value).toLowerCase()==='true'||String(value)==='1';
    const socialAllowed=featureOn(brandFeatureAccess.socialPluginEnabled);
    const leaderboardAllowed=featureOn(brandFeatureAccess.leaderboardEnabled);
    const vipAllowed=featureOn(brandFeatureAccess.vipEnabled);
    if(socialPluginSettings) socialPluginSettings.style.display=socialAllowed?'grid':'none';
    if(leaderboardFeatureRow){leaderboardFeatureRow.style.display=leaderboardAllowed?'':'none';leaderboardFeatureRow.style.visibility='visible';}
    if(vipFeatureRow){vipFeatureRow.style.display=vipAllowed?'':'none';vipFeatureRow.style.visibility='visible';}
    if(socialAllowed) await loadTelegramConfig();
  }
  async function loadTelegramConfig(){
    const r=await fetch(String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+'/admin/frontend/telegram',{headers:headers(false),cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error') throw new Error(j.message||'Unable to load Telegram setting');
    const d=j.data||{};
    if(telegramBotToken) telegramBotToken.value='';
    if(telegramBotId) telegramBotId.value=String(d.botId||'');
    if(telegramBotUsername) telegramBotUsername.value=String(d.botUsername||'');
  }
  async function saveTelegramConfig(){
    if(Number(brandFeatureAccess.socialPluginEnabled)!==1||!telegramBotToken) return;
    const token=String(telegramBotToken.value||'').trim();
    if(!token) return;
    const r=await fetch(String(API_CONFIG.BASE_URL||'').replace(/\/$/,'')+'/admin/frontend/telegram',{method:'POST',headers:headers(true),body:JSON.stringify({botToken:token,webhookBaseUrl:location.origin})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error') throw new Error(j.message||'Unable to save Telegram bot');
    telegramBotToken.value='';
    if(telegramBotId) telegramBotId.value=String(j.data?.botId||'');
    if(telegramBotUsername) telegramBotUsername.value=String(j.data?.botUsername||'');
  }

  async function load(){
    setMessage('Loading...');
    const response=await fetch(endpoint+(endpoint.includes('?')?'&':'?')+'_cfg='+Date.now(),{headers:headers(false),cache:'no-store'});
    const json=await response.json().catch(()=>({}));
    if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to load setting');
    assertTarget(json);
    const data=json.data||{};
    syncSelect(data.homeBonusEnabled);
    minDeposit.value=Number(data.minDepositAmount||10).toFixed(2);
    minWithdrawal.value=Number(data.minWithdrawalAmount||50).toFixed(2);
    if(rebateThreshold) rebateThreshold.value=Number(data.rebateAutoCreditThreshold||0).toFixed(2);
    if(marqueeEnabled){ syncSelectValue(marqueeEnabled,data.marqueeEnabled); }
    if(leaderboardEnabled){ syncSelectValue(leaderboardEnabled,data.leaderboardEnabled); }
    if(topupRewardEnabled){ syncSelectValue(topupRewardEnabled,data.topupRewardEnabled); }
    if(vipSidebarEnabled){ syncSelectValue(vipSidebarEnabled,data.vipSidebarEnabled); }
    if(mobileHeaderLogoPosition){ mobileHeaderLogoPosition.value=String(data.mobileHeaderLogoPosition||'CENTER').toUpperCase()==='LEFT'?'LEFT':'CENTER'; }
    if(liveTransactionEnabled){ syncSelectValue(liveTransactionEnabled,data.liveTransactionEnabled); }
    if(liveTransactionMode){ liveTransactionMode.value=String(data.liveTransactionMode||'REAL').toUpperCase()==='FAKE'?'FAKE':'REAL'; liveTransactionMode.dispatchEvent(new Event('change',{bubbles:true})); }
    if(liveTransactionIntervalSeconds){ liveTransactionIntervalSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionIntervalSeconds||5)))); }
    if(liveTransactionRandomMinSeconds) liveTransactionRandomMinSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionRandomMinSeconds||3))));
    if(liveTransactionRandomMaxSeconds) liveTransactionRandomMaxSeconds.value=String(Math.max(2,Math.min(60,Number(data.liveTransactionRandomMaxSeconds||8))));
    if(liveTransactionRandomMinRows) liveTransactionRandomMinRows.value=String(Math.max(1,Math.min(20,Number(data.liveTransactionRandomMinRows||1))));
    if(liveTransactionRandomMaxRows) liveTransactionRandomMaxRows.value=String(Math.max(1,Math.min(20,Number(data.liveTransactionRandomMaxRows||4))));
    if(liveTransactionRandomMinPrice) liveTransactionRandomMinPrice.value=Number(data.liveTransactionRandomMinPrice??10).toFixed(2);
    if(liveTransactionRandomMaxPrice) liveTransactionRandomMaxPrice.value=Number(data.liveTransactionRandomMaxPrice??5000).toFixed(2);
    renderLiveTransactionMode();
    if(marqueeEditor){ marqueeEditor.innerHTML=data.marqueeContent||''; applyMarqueeBackground(data.marqueeBg||DEFAULT_MARQUEE_BG_COLOR); if(marqueeTextColorBar) marqueeTextColorBar.style.backgroundColor=DEFAULT_MARQUEE_TEXT_COLOR; syncMarquee(); }
    await loadInstallSetting();
    await loadBrandFeatureAccess();
    setMessage('');
  }

  async function loadBoSidebarInteraction(){
    if(!boSidebarInteraction||!window.BO_AUTH) return;
    try{
      const r=await fetch(API_CONFIG.BASE_URL+'/admin/ui-setting',{headers:{...BO_AUTH.authHeader()},cache:'no-store'});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.status!=='error'&&j.data){boUiSetting=Object.assign(boUiSetting,j.data);boSidebarInteraction.value=String(boUiSetting.sidebarInteraction||'HOVER').toUpperCase();}
    }catch(e){}
  }
  async function saveBoSidebarInteraction(){
    if(!boSidebarInteraction||!window.BO_AUTH) return;
    const mode=String(boSidebarInteraction.value||'HOVER').toUpperCase();
    const r=await fetch(API_CONFIG.BASE_URL+'/admin/ui-setting',{method:'PUT',headers:{'Content-Type':'application/json',...BO_AUTH.authHeader()},body:JSON.stringify({headerMenuKeys:Array.isArray(boUiSetting.headerMenuKeys)?boUiSetting.headerMenuKeys:[],sidebarInteraction:mode})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.status==='error') throw new Error(j.message||'Unable to save collapsed sidebar behavior');
    boUiSetting=Object.assign(boUiSetting,j.data||{},{sidebarInteraction:mode});
    if(window.BO_AUTH&&BO_AUTH.loadUiSetting) await BO_AUTH.loadUiSetting();
  }

  async function save(){
    const old=saveBtn.innerHTML;
    saveBtn.disabled=true;
    saveBtn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Saving...';
    setMessage('');
    try{
      const requestedValue=select.value==='0'?0:1;
      const mobileHeaderLogoPositionValue=mobileHeaderLogoPosition?.value==='LEFT'?'LEFT':'CENTER';
      const depositValue=Number(minDeposit.value);
      const withdrawalValue=Number(minWithdrawal.value);
      const rebateThresholdValue=Number(rebateThreshold?.value||0);
      syncMarquee();
      const marqueeEnabledValue=marqueeEnabled?.value==='1'?1:0;
      const leaderboardEnabledValue=leaderboardEnabled?.value==='1'?1:0;
      const topupRewardEnabledValue=topupRewardEnabled?.value==='1'?1:0;
      const vipSidebarEnabledValue=vipSidebarEnabled?.value==='1'?1:0;
      const liveTransactionEnabledValue=liveTransactionEnabled?.value==='1'?1:0;
      const liveTransactionModeValue=liveTransactionMode?.value==='FAKE'?'FAKE':'REAL';
      const liveTransactionIntervalValue=Number(liveTransactionIntervalSeconds?.value||5);
      const liveTransactionRandomMinSecondsValue=Number(liveTransactionRandomMinSeconds?.value||3);
      const liveTransactionRandomMaxSecondsValue=Number(liveTransactionRandomMaxSeconds?.value||8);
      const liveTransactionRandomMinRowsValue=Number(liveTransactionRandomMinRows?.value||1);
      const liveTransactionRandomMaxRowsValue=Number(liveTransactionRandomMaxRows?.value||4);
      const liveTransactionRandomMinPriceValue=Number(liveTransactionRandomMinPrice?.value||10);
      const liveTransactionRandomMaxPriceValue=Number(liveTransactionRandomMaxPrice?.value||5000);
      const marqueeHtml=marqueeContent?.value?.trim()||'';
      if(!String(installAppDisplayName?.value||'').trim()) throw new Error('Add to Home Screen display name is required');
      if(!Number.isFinite(depositValue)||depositValue<=0) throw new Error('Minimum deposit must be greater than 0');
      if(!Number.isFinite(withdrawalValue)||withdrawalValue<=0) throw new Error('Minimum withdrawal must be greater than 0');
      if(!Number.isFinite(rebateThresholdValue)||rebateThresholdValue<0) throw new Error('Rebate auto credit threshold cannot be negative');
      if(!Number.isFinite(liveTransactionIntervalValue)||liveTransactionIntervalValue<2||liveTransactionIntervalValue>60) throw new Error('Live Transaction refresh must be between 2 and 60 seconds');
      if(!Number.isFinite(liveTransactionRandomMinSecondsValue)||liveTransactionRandomMinSecondsValue<2||liveTransactionRandomMinSecondsValue>60) throw new Error('Random Demo minimum interval must be between 2 and 60 seconds');
      if(!Number.isFinite(liveTransactionRandomMaxSecondsValue)||liveTransactionRandomMaxSecondsValue<2||liveTransactionRandomMaxSecondsValue>60) throw new Error('Random Demo maximum interval must be between 2 and 60 seconds');
      if(liveTransactionRandomMaxSecondsValue<liveTransactionRandomMinSecondsValue) throw new Error('Random Demo maximum interval cannot be lower than the minimum interval');
      if(!Number.isFinite(liveTransactionRandomMinRowsValue)||liveTransactionRandomMinRowsValue<1||liveTransactionRandomMinRowsValue>20) throw new Error('Random Demo minimum transaction count must be between 1 and 20');
      if(!Number.isFinite(liveTransactionRandomMaxRowsValue)||liveTransactionRandomMaxRowsValue<1||liveTransactionRandomMaxRowsValue>20) throw new Error('Random Demo maximum transaction count must be between 1 and 20');
      if(liveTransactionRandomMaxRowsValue<liveTransactionRandomMinRowsValue) throw new Error('Random Demo maximum transaction count cannot be lower than the minimum count');
      if(!Number.isFinite(liveTransactionRandomMinPriceValue)||liveTransactionRandomMinPriceValue<0.01||liveTransactionRandomMinPriceValue>1000000) throw new Error('Random Demo minimum price must be between 0.01 and 1,000,000');
      if(!Number.isFinite(liveTransactionRandomMaxPriceValue)||liveTransactionRandomMaxPriceValue<0.01||liveTransactionRandomMaxPriceValue>1000000) throw new Error('Random Demo maximum price must be between 0.01 and 1,000,000');
      if(liveTransactionRandomMaxPriceValue<liveTransactionRandomMinPriceValue) throw new Error('Random Demo maximum price cannot be lower than the minimum price');
      if(marqueeEnabledValue===1 && !marqueeEditor?.innerText?.trim()) throw new Error('Please enter marquee text before enabling it');
      const response=await fetch(endpoint,{
        method:'POST',
        headers:headers(true),
        cache:'no-store',
        body:JSON.stringify({homeBonusEnabled:requestedValue,mobileHeaderLogoPosition:mobileHeaderLogoPositionValue,minDepositAmount:depositValue,minWithdrawalAmount:withdrawalValue,rebateAutoCreditThreshold:rebateThresholdValue,marqueeEnabled:marqueeEnabledValue,leaderboardEnabled:leaderboardEnabledValue,topupRewardEnabled:topupRewardEnabledValue,vipSidebarEnabled:vipSidebarEnabledValue,liveTransactionEnabled:liveTransactionEnabledValue,liveTransactionMode:liveTransactionModeValue,liveTransactionIntervalSeconds:liveTransactionIntervalValue,liveTransactionRandomMinSeconds:liveTransactionRandomMinSecondsValue,liveTransactionRandomMaxSeconds:liveTransactionRandomMaxSecondsValue,liveTransactionRandomMinRows:liveTransactionRandomMinRowsValue,liveTransactionRandomMaxRows:liveTransactionRandomMaxRowsValue,liveTransactionRandomMinPrice:liveTransactionRandomMinPriceValue,liveTransactionRandomMaxPrice:liveTransactionRandomMaxPriceValue,marqueeContent:marqueeHtml,marqueeBg:marqueeBgCss()})
      });
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json.status==='error') throw new Error(json.message||'Unable to save setting');
      assertTarget(json);
      const verifyResponse=await fetch(endpoint+(endpoint.includes('?')?'&':'?')+'_verify='+Date.now(),{headers:headers(false),cache:'no-store'});
      const verifyJson=await verifyResponse.json().catch(()=>({}));
      if(!verifyResponse.ok||verifyJson.status==='error') throw new Error(verifyJson.message||'Unable to verify saved setting');
      assertTarget(verifyJson);
      const verifyEnabled=Number(verifyJson.data&&verifyJson.data.liveTransactionEnabled);
      if(verifyEnabled!==liveTransactionEnabledValue) throw new Error('Live Transaction setting did not persist for the selected brand');
      const savedValue=json.data&&Object.prototype.hasOwnProperty.call(json.data,'homeBonusEnabled')
        ?json.data.homeBonusEnabled
        :requestedValue;
      syncSelect(savedValue);
      if(json.data){ if(mobileHeaderLogoPosition) mobileHeaderLogoPosition.value=String(json.data.mobileHeaderLogoPosition||mobileHeaderLogoPositionValue).toUpperCase()==='LEFT'?'LEFT':'CENTER'; minDeposit.value=Number(json.data.minDepositAmount||depositValue).toFixed(2); minWithdrawal.value=Number(json.data.minWithdrawalAmount||withdrawalValue).toFixed(2); if(rebateThreshold) rebateThreshold.value=Number(json.data.rebateAutoCreditThreshold??rebateThresholdValue).toFixed(2); if(marqueeEnabled) syncSelectValue(marqueeEnabled,json.data.marqueeEnabled); if(leaderboardEnabled) syncSelectValue(leaderboardEnabled,json.data.leaderboardEnabled); if(topupRewardEnabled) syncSelectValue(topupRewardEnabled,json.data.topupRewardEnabled); if(vipSidebarEnabled) syncSelectValue(vipSidebarEnabled,json.data.vipSidebarEnabled); if(liveTransactionEnabled) syncSelectValue(liveTransactionEnabled,json.data.liveTransactionEnabled); if(liveTransactionMode){liveTransactionMode.value=String(json.data.liveTransactionMode||liveTransactionModeValue).toUpperCase()==='FAKE'?'FAKE':'REAL';liveTransactionMode.dispatchEvent(new Event('change',{bubbles:true}));} if(liveTransactionIntervalSeconds) liveTransactionIntervalSeconds.value=String(json.data.liveTransactionIntervalSeconds||liveTransactionIntervalValue); if(liveTransactionRandomMinSeconds) liveTransactionRandomMinSeconds.value=String(json.data.liveTransactionRandomMinSeconds||liveTransactionRandomMinSecondsValue); if(liveTransactionRandomMaxSeconds) liveTransactionRandomMaxSeconds.value=String(json.data.liveTransactionRandomMaxSeconds||liveTransactionRandomMaxSecondsValue); if(liveTransactionRandomMinRows) liveTransactionRandomMinRows.value=String(json.data.liveTransactionRandomMinRows||liveTransactionRandomMinRowsValue); if(liveTransactionRandomMaxRows) liveTransactionRandomMaxRows.value=String(json.data.liveTransactionRandomMaxRows||liveTransactionRandomMaxRowsValue); if(liveTransactionRandomMinPrice) liveTransactionRandomMinPrice.value=Number(json.data.liveTransactionRandomMinPrice??liveTransactionRandomMinPriceValue).toFixed(2); if(liveTransactionRandomMaxPrice) liveTransactionRandomMaxPrice.value=Number(json.data.liveTransactionRandomMaxPrice??liveTransactionRandomMaxPriceValue).toFixed(2); renderLiveTransactionMode(); if(marqueeEditor){marqueeEditor.innerHTML=json.data.marqueeContent||marqueeHtml;syncMarquee();} }
      await saveInstallSetting();
      await saveBoSidebarInteraction();
      await saveTelegramConfig();
      setMessage('Frontend display settings saved successfully.','success');
    }catch(error){
      setMessage(error.message,'error');
    }finally{
      saveBtn.disabled=false;
      saveBtn.innerHTML=old;
    }
  }

  liveTransactionMode?.addEventListener('change',renderLiveTransactionMode);

  document.querySelectorAll('[data-fd-switch]').forEach(function(btn){
    const id=btn.getAttribute('data-fd-switch');
    const sel=document.getElementById(id);
    if(!sel) return;
    paintSwitch(sel);
    btn.addEventListener('click',function(){
      sel.value=sel.value==='1'?'0':'1';
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      paintSwitch(sel);
    });
    sel.addEventListener('change',function(){ paintSwitch(sel); });
  });

  if(marqueeEditor){
    applyMarqueeBackground(DEFAULT_MARQUEE_BG_COLOR);
    marqueeTextValue=DEFAULT_MARQUEE_TEXT_COLOR;
    if(marqueeTextColorBar) marqueeTextColorBar.style.backgroundColor=DEFAULT_MARQUEE_TEXT_COLOR;
    marqueeEditor.addEventListener('input',syncMarquee);
    document.querySelectorAll('[data-marquee-cmd]').forEach(btn=>btn.addEventListener('click',()=>{
      marqueeEditor.focus(); document.execCommand(btn.dataset.marqueeCmd,false,null); syncMarquee();
    }));
    marqueeBgColorBtn?.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleColorPopover('bg',marqueeBgColorBtn);
    });
    marqueeTextColorBtn?.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleColorPopover('text',marqueeTextColorBtn);
    });
    fdColorPopClose?.addEventListener('click',function(e){
      e.preventDefault();
      closeColorPopover();
    });
    fdColorPopHex?.addEventListener('change',function(){ applyPopoverColor(fdColorPopHex.value); });
    fdColorPopHex?.addEventListener('keydown',function(e){
      if(e.key==='Enter'){ e.preventDefault(); applyPopoverColor(fdColorPopHex.value); }
    });
    [fdColorR,fdColorG,fdColorB].forEach(function(input){
      input?.addEventListener('change',applyRgbInputs);
      input?.addEventListener('keydown',function(e){
        if(e.key==='Enter'){ e.preventDefault(); applyRgbInputs(); }
      });
    });
    /* Solid / Gradient, the gradient type and direction, the stop bar, add/remove, angle, position,
       opacity, the presets and Copy CSS. The switch only exists for the background colour (syncGradUI
       hides the section otherwise) because a gradient is a background, not an ink. */
    renderGradDirs();
    renderGradPresets();
    bindGradBar();
    document.querySelectorAll('[data-fd-color-type]').forEach(function(b){
      b.addEventListener('click',function(e){
        e.preventDefault();
        const want=b.dataset.fdColorType==='gradient';
        if(want===marqueeBgGrad.on) return;
        if(want){
          if(marqueeBgGrad.stops.length<2) marqueeBgGrad.stops=[{color:marqueeBgValue,pos:0,alpha:1},{color:marqueeBgGrad.stops[0]?marqueeBgGrad.stops[0].color:'#E8C98A',pos:100,alpha:1}];
          marqueeBgGrad.on=true;
          paintMarqueeBg();
          syncColorPopoverUI(activeGradStopHex());
        }else{
          marqueeBgGrad.on=false;
          applyMarqueeBackground(marqueeBgValue);
          syncColorPopoverUI(marqueeBgValue);
        }
      });
    });
    document.querySelectorAll('[data-fd-grad-type]').forEach(function(b){
      b.addEventListener('click',function(e){
        e.preventDefault();
        marqueeBgGrad.type=b.dataset.fdGradType==='radial'?'radial':(b.dataset.fdGradType==='conic'?'conic':'linear');
        paintMarqueeBg();
      });
    });
    fdColorGradDirs?.addEventListener('click',function(e){
      const b=e.target.closest?e.target.closest('[data-fd-grad-dir]'):null;
      if(!b) return;
      marqueeBgGrad.angle=clamp(Number(b.dataset.fdGradDir)||0,0,360);
      paintMarqueeBg();
    });
    fdColorGradAdd?.addEventListener('click',function(){
      const stops=marqueeBgGrad.stops;
      addGradStop(50);
      syncColorPopoverUI(activeGradStopHex());
    });
    fdColorGradRemove?.addEventListener('click',function(){
      removeGradStop();
      syncColorPopoverUI(activeGradStopHex());
    });
    fdColorGradAngle?.addEventListener('input',function(){
      marqueeBgGrad.angle=clamp(Number(fdColorGradAngle.value)||0,0,360);
      paintMarqueeBg();
    });
    fdColorGradPos?.addEventListener('input',function(){
      activeGradStop().pos=clamp(Number(fdColorGradPos.value)||0,0,100);
      paintMarqueeBg();
    });
    fdColorGradOpacity?.addEventListener('input',function(){
      activeGradStop().alpha=clamp((Number(fdColorGradOpacity.value)||0)/100,0,1);
      paintMarqueeBg();
    });
    fdColorGradPresets?.addEventListener('click',function(e){
      const b=e.target.closest?e.target.closest('[data-fd-grad-preset]'):null;
      if(!b) return;
      const preset=MARQUEE_GRAD_PRESETS[Number(b.dataset.fdGradPreset)];
      if(!preset) return;
      marqueeBgGrad.on=true;
      marqueeBgGrad.type=preset.type;
      marqueeBgGrad.angle=preset.angle;
      marqueeBgGrad.stops=preset.stops.map(function(st){ return { color:st[0], pos:st[1], alpha:st[2] }; });
      marqueeBgGrad.active=0;
      paintMarqueeBg();
      syncColorPopoverUI(activeGradStopHex());
    });
    fdColorGradCopy?.addEventListener('click',function(){
      const css=gradientCss();
      const done=function(){ if(!fdColorGradCopy) return; fdColorGradCopy.textContent='Copied'; setTimeout(function(){ fdColorGradCopy.textContent='Copy CSS'; },1200); };
      try{
        if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(css).then(done,done); }
        else{ done(); }
      }catch(err){ done(); }
    });
    bindSpectrumPointer(fdColorSv,updateSvFromEvent,'sv');
    bindSpectrumPointer(fdColorHue,updateHueFromEvent,'hue');
    fdColorPop?.addEventListener('click',function(e){ e.stopPropagation(); });
    /* Per-entry init, document-level handlers: the popover they close belongs to THIS entry,
       and each entry used to leave one more pair behind (measured: frontend-display.html +2 per
       entry at :652/:657). Slot replace keeps the newest closure. */
    if(window.__boFdColorClose) document.removeEventListener('click',window.__boFdColorClose);
    window.__boFdColorClose=function(e){
      if(!fdColorPop||!fdColorPop.classList.contains('is-open')) return;
      if(e.target.closest('#fdColorPop,#marqueeBgColorBtn,#marqueeTextColorBtn')) return;
      closeColorPopover();
    };
    document.addEventListener('click',window.__boFdColorClose);
    if(window.__boFdColorEsc) document.removeEventListener('keydown',window.__boFdColorEsc);
    window.__boFdColorEsc=function(e){
      if(e.key==='Escape') closeColorPopover();
    };
    document.addEventListener('keydown',window.__boFdColorEsc);
    window.addEventListener('resize',function(){
      if(!fdColorPop||!fdColorPop.classList.contains('is-open')) return;
      const anchor=marqueeColorMode==='bg'?marqueeBgColorBtn:marqueeTextColorBtn;
      positionColorPopover(anchor);
    });
    document.querySelector('.fd-board')?.addEventListener('scroll',function(){
      if(!fdColorPop||!fdColorPop.classList.contains('is-open')) return;
      const anchor=marqueeColorMode==='bg'?marqueeBgColorBtn:marqueeTextColorBtn;
      positionColorPopover(anchor);
    },{passive:true});
    /* Page-private file, so a re-entry re-executes it; the observer's target is
       documentElement, which survives the swap - and a MutationObserver stays registered on its
       target for as long as that target lives. Without the disconnect each entry stacked another
       observer over a document that outlives the frame (this page's own marquee state closed
       over inside). One slot: the previous entry's observer is detached first. */
    if(window.__boFdThemeObserver) window.__boFdThemeObserver.disconnect();
    window.__boFdThemeObserver = new MutationObserver(function(){
      applyMarqueeBackground(marqueeBgValue);
    });
    window.__boFdThemeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-bo-theme']});
  }
  /* The board is this page's scroll container and the save bar is pinned under it, so a menu that
     reaches past the board's bottom edge is cut off there — measured at 1560x500 with the brand
     list: 234px of room below its row against a 280px list, so its last two options could not be
     reached at all. The room the board actually has is written into --fd-menu-room (the sheet caps
     the list with it) and .fd-menu-up flips the list above its trigger when that side is the
     larger one. reports.js adds `.show` inside its own click handler and stops propagation, so the
     placement runs one frame after the click; a board scroll re-runs it, because the room below a
     row changes with the scroll while the list stays anchored to the row. */
  const fdMenuBoard=document.querySelector('.fd-board');
  const FD_MENU_CEILING=280;   /* the shared sheet's own default cap */
  const FD_MENU_FLOOR=132;     /* ~3 options: below this a list stops being a list */
  const FD_MENU_GAP=6;         /* the gap the sheet already puts between control and list */
  const FD_MENU_EDGE=8;        /* keeps the list off the board's own bottom edge */
  function placeFdMenus(){
    if(!fdMenuBoard||!fdMenuBoard.isConnected) return;
    const boardBox=fdMenuBoard.getBoundingClientRect();
    fdMenuBoard.querySelectorAll('.rounded-select-wrap').forEach(function(wrap){
      const menu=wrap.querySelector(':scope > .rounded-select-menu.show');
      const btn=wrap.querySelector(':scope > .rounded-select-btn');
      if(!menu||!btn){
        wrap.classList.remove('fd-menu-up');
        wrap.style.removeProperty('--fd-menu-room');
        return;
      }
      const box=btn.getBoundingClientRect();
      const below=Math.round(boardBox.bottom-FD_MENU_EDGE-FD_MENU_GAP-box.bottom);
      const above=Math.round(box.top-boardBox.top-FD_MENU_EDGE-FD_MENU_GAP);
      const up=above>below;
      wrap.classList.toggle('fd-menu-up',up);
      wrap.style.setProperty('--fd-menu-room',Math.max(FD_MENU_FLOOR,Math.min(FD_MENU_CEILING,up?above:below))+'px');
    });
  }
  function reflowFdMenus(){
    if(fdMenuBoard&&fdMenuBoard.querySelector('.rounded-select-menu.show')) placeFdMenus();
  }
  if(fdMenuBoard){
    fdMenuBoard.addEventListener('scroll',reflowFdMenus,{passive:true});
    /* A `document` listener survives a SPA swap while this script re-runs on every entry, so the
       previous handler is dropped by reference rather than left to accumulate. */
    if(window.__fdMenuPlace) document.removeEventListener('click',window.__fdMenuPlace,true);
    window.__fdMenuPlace=function(e){
      const t=e.target;
      if(!t||!t.closest||!t.closest('.fd-panel .rounded-select-btn')) return;
      requestAnimationFrame(placeFdMenus);
    };
    document.addEventListener('click',window.__fdMenuPlace,true);
  }


  if(telegramBotTokenHelp&&telegramBotTokenGuide){
    telegramBotTokenHelp.addEventListener('click',()=>{
      if(typeof telegramBotTokenGuide.showModal==='function') telegramBotTokenGuide.showModal();
      else telegramBotTokenGuide.setAttribute('open','');
    });
  }
  telegramBotTokenGuideClose?.addEventListener('click',()=>telegramBotTokenGuide?.close());
  telegramBotTokenGuide?.addEventListener('click',e=>{
    if(e.target===telegramBotTokenGuide) telegramBotTokenGuide.close();
  });

  chooseInstallAppLogo?.addEventListener('click',()=>installAppLogoFile?.click());
  installAppLogoFile?.addEventListener('change',async e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file) return;
    try{
      if(file.type!=='image/png') throw new Error('Install app logo must be a PNG image');
      const size=await readImageSize(file);
      if(size.width!==512||size.height!==512) throw new Error('Install app logo must be exactly 512×512 px');
      selectedInstallLogo=file;removeExistingInstallLogo=false;
      renderInstallLogo(URL.createObjectURL(file),true);
      setMessage('Logo ready. Click Save Setting to publish it.','success');
    }catch(err){e.target.value='';selectedInstallLogo=null;renderInstallLogo(currentInstallLogoUrl);setMessage(err.message,'error')}
  });
  removeInstallAppLogo?.addEventListener('click',()=>{selectedInstallLogo=null;removeExistingInstallLogo=true;if(installAppLogoFile)installAppLogoFile.value='';renderInstallLogo('');setMessage('Logo will be removed when you click Save Setting.','success')});

  if(brandTarget){brandTarget.addEventListener('change',()=>{selectedTargetBrandId=Number(brandTarget.value)||1;localStorage.setItem('bo_active_brand_id',String(selectedTargetBrandId));if(window.BO_BRAND&&BO_BRAND.invalidate)BO_BRAND.invalidate();load().catch(error=>setMessage(error.message,'error'));});}
  saveBtn.addEventListener('click',save);
  (async()=>{await loadBrandTarget();await Promise.all([load(),loadBoSidebarInteraction()]);})().catch(error=>setMessage(error.message,'error'));
})();
