(function(){
'use strict';
if(window.banaDesktopSkin)return;
const style=document.createElement('style');style.id='bana-transparent-desktop-style';
style.textContent=`
html.bana-desktop-overlay,html.bana-desktop-overlay body{background:transparent!important;background-image:none!important;opacity:1!important}
html.bana-desktop-overlay body *,html.bana-desktop-overlay body *::before,html.bana-desktop-overlay body *::after{border-color:transparent!important;outline-color:transparent!important;box-shadow:none!important;text-shadow:none!important;background-image:none!important;backdrop-filter:none!important}
html.bana-desktop-overlay body::before,html.bana-desktop-overlay body::after,html.bana-desktop-overlay body *::before,html.bana-desktop-overlay body *::after{background:transparent!important;box-shadow:none!important}
html.bana-desktop-overlay body *{color:var(--bana-ink,rgba(64,82,52,.3))!important;background-color:var(--bana-surface,transparent)!important;caret-color:var(--bana-ink)!important;outline:var(--bana-frame,none)!important;outline-offset:-1px}
html.bana-desktop-overlay img,html.bana-desktop-overlay canvas,html.bana-desktop-overlay video{opacity:.3!important}
html.bana-desktop-overlay svg{fill:var(--bana-svg-fill)!important;stroke:var(--bana-svg-stroke)!important}
html.bana-desktop-overlay svg *{fill:var(--bana-svg-fill)!important;stroke:var(--bana-svg-stroke)!important}
html.bana-desktop-overlay ::placeholder{color:var(--bana-ink)!important;opacity:1!important}
html.bana-desktop-overlay ::-webkit-scrollbar{width:7px;height:7px;background:transparent}
html.bana-desktop-overlay ::-webkit-scrollbar-track{background:transparent!important}
html.bana-desktop-overlay ::-webkit-scrollbar-thumb{background:rgba(108,132,86,.3)!important;border-radius:8px}
#bana-desktop-tools{position:fixed!important;top:2px!important;right:8px!important;z-index:2147483647!important;display:flex!important;gap:4px;padding:3px;border-radius:10px;-webkit-app-region:no-drag}
#bana-desktop-tools button{box-sizing:border-box!important;font:12px sans-serif!important;min-width:24px;height:24px;padding:1px 5px;cursor:pointer;line-height:20px;outline:none;border:0}
#bana-desktop-drag{-webkit-app-region:drag!important;cursor:move!important;min-width:58px!important}
html.bana-desktop-collapsed,html.bana-desktop-collapsed body{background:transparent!important;overflow:hidden!important}
html.bana-desktop-collapsed body>:not(#bana-desktop-tools){visibility:hidden!important;pointer-events:none!important}
html.bana-desktop-collapsed body::before,html.bana-desktop-collapsed body::after{display:none!important}
html.bana-desktop-collapsed #bana-desktop-tools{visibility:visible!important}
#bana-desktop-tools button[aria-pressed="true"]{box-shadow:inset 0 -2px rgba(75,110,53,.75)!important}
body{padding-top:32px!important}
`;
document.head.append(style);
const tools=document.createElement('div');tools.id='bana-desktop-tools';
tools.innerHTML='<button id="bana-desktop-drag" title="拖曳移動視窗">⠿ 移動</button><button data-action="toggle" title="切換清楚／自動">◐</button><button data-action="minimize" title="最小化">−</button><button data-action="close" title="關閉">×</button>';
const collapse=document.createElement('button');collapse.dataset.action='collapse';collapse.title='收合主體，只保留工具列';collapse.textContent='▴';collapse.setAttribute('aria-label','收合主體');collapse.setAttribute('aria-expanded','true');
const pin=document.createElement('button');pin.dataset.action='pin';pin.title='置頂';pin.textContent='釘';pin.setAttribute('aria-label','置頂');pin.setAttribute('aria-pressed','false');
tools.insertBefore(collapse,tools.querySelector('[data-action="minimize"]'));tools.insertBefore(pin,collapse);
const version=document.createElement('span');version.textContent='v0.2.5';version.style.cssText='font:11px sans-serif;padding:6px 2px';tools.prepend(version);
document.body.append(tools);
function setWindowState(state){
  const folded=!!state.collapsed,pinned=!!state.pinned;
  document.documentElement.classList.toggle('bana-desktop-collapsed',folded);
  collapse.textContent=folded?'▾':'▴';collapse.title=folded?'展開主體':'收合主體，只保留工具列';collapse.setAttribute('aria-label',folded?'展開主體':'收合主體');collapse.setAttribute('aria-expanded',String(!folded));
  pin.title=pinned?'取消置頂':'置頂';pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed',String(pinned));
}
if(window.banaDesktop?.onWindowState){window.banaDesktop.onWindowState(setWindowState);window.banaDesktop.windowState().then(setWindowState);}
tools.addEventListener('click',event=>{const action=event.target.dataset.action;if(action&&typeof window.banaDesktop?.[action]==='function')window.banaDesktop[action]();});
let faded=false,initialized=false,timer=null,surfaces=new WeakSet();
const pending=new Set(),stats={flushes:0,nodesRead:0,layoutReads:0,lastDurationMs:0};
const observer=new MutationObserver(records=>{
  if(!faded)return;
  for(const record of records){
    if(record.type==='childList')for(const node of record.addedNodes)if(node.nodeType===1&&node.isConnected)pending.add(node);
    if(record.type==='attributes'){
      const colors=value=>(value||'').match(/(?:^|;)\s*(?:color|background(?:-color)?|fill|stroke)\s*:[^;]*/gi)?.join(';')||'';
      if(colors(record.oldValue)!==colors(record.target.getAttribute('style')))pending.add(record.target);
    }
  }
  if(pending.size&&timer===null)timer=setTimeout(flush,80);
});
function watch(){observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style'],attributeOldValue:true});}
function rgba(value,alpha){if(value==='none')return 'none';const m=String(value).match(/[\d.]+/g);return m&&m.length>=3?'rgba('+m.slice(0,3).join(',')+','+alpha+')':value;}
function collect(roots){
  const nodes=new Set();
  for(const node of roots){if(!node.isConnected)continue;nodes.add(node);for(const child of node.querySelectorAll('*'))nodes.add(child);}
  return [...nodes].filter(node=>!['SCRIPT','STYLE','LINK','META','TEMPLATE','BODY'].includes(node.tagName)).sort((a,b)=>a===b?0:(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1));
}
function paint(nodes){
  const started=performance.now();
  observer.disconnect();
  const root=document.documentElement;root.classList.remove('bana-desktop-overlay');
  try{
    // Read every required style before writing anything, so layout is not forced per node.
    const snapshots=nodes.map(node=>{
      const cs=getComputedStyle(node),bg=cs.backgroundColor,channels=bg.match(/[\d.]+/g),box=node.getBoundingClientRect();
      const hasBackground=channels&&channels.length>=3&&(channels.length<4||Number(channels[3])>0);
      const hasBorder=['Top','Right','Bottom','Left'].some(side=>parseFloat(cs['border'+side+'Width'])>0);
      return {node,bg,ink:rgba(cs.color,.3),fill:rgba(cs.fill,.3),stroke:rgba(cs.stroke,.3),hasBackground,frame:cs.display!=='inline'&&(hasBackground||hasBorder),shell:node.tagName==='MAIN'||['app','root'].includes(node.id)||(box.width>=innerWidth*.9&&box.height>=innerHeight*.85)};
    });
    stats.nodesRead+=snapshots.length;stats.layoutReads+=snapshots.length;
    for(const {node,bg,ink,fill,stroke,hasBackground,shell,frame} of snapshots){
      let ancestor=node.parentElement,covered=false;while(ancestor&&ancestor!==document.body){if(surfaces.has(ancestor)){covered=true;break;}ancestor=ancestor.parentElement;}
      const surface=hasBackground&&!covered&&!shell;
      node.style.setProperty('--bana-ink',ink);
      node.style.setProperty('--bana-surface',surface?rgba(bg,.15):'transparent');
      node.style.setProperty('--bana-frame',frame&&!shell?'1px solid rgba(104,133,86,.55)':'none');
      node.style.setProperty('--bana-svg-fill',fill);node.style.setProperty('--bana-svg-stroke',stroke);
      if(surface)surfaces.add(node);else surfaces.delete(node);
    }
  }finally{
    if(faded)root.classList.add('bana-desktop-overlay');
    stats.flushes++;stats.lastDurationMs=performance.now()-started;watch();
  }
}
function flush(){timer=null;if(!faded){pending.clear();return;}const nodes=collect(pending);pending.clear();if(nodes.length)paint(nodes);}
function setMode(value){
  value=!!value;if(initialized&&value===faded)return;initialized=true;faded=value;
  if(timer!==null){clearTimeout(timer);timer=null;}pending.clear();
  if(faded){surfaces=new WeakSet();paint(collect([document.body]));}
  else document.documentElement.classList.remove('bana-desktop-overlay');
}
window.banaDesktopSkin=Object.freeze({setMode,getStats:()=>({...stats})});
watch();
if(window.banaDesktop){window.banaDesktop.onMode(setMode);window.banaDesktop.current().then(setMode);}
})();
