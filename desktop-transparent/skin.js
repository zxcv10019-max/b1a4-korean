(function(){
'use strict';
if(window.banaDesktopSkin)return;
const style=document.createElement('style');style.id='bana-transparent-desktop-style';
style.textContent=`
html.bana-desktop-overlay,html.bana-desktop-overlay body{background:transparent!important;background-image:none!important;opacity:1!important}
html.bana-desktop-overlay body *,html.bana-desktop-overlay body *::before,html.bana-desktop-overlay body *::after{border-color:transparent!important;outline-color:transparent!important;box-shadow:none!important;text-shadow:none!important;background-image:none!important;backdrop-filter:none!important}
html.bana-desktop-overlay body::before,html.bana-desktop-overlay body::after,html.bana-desktop-overlay body *::before,html.bana-desktop-overlay body *::after{background:transparent!important;box-shadow:none!important}
html.bana-desktop-overlay body *{color:var(--bana-ink,rgba(64,82,52,.25))!important;background-color:var(--bana-surface,transparent)!important;caret-color:var(--bana-ink)!important}
html.bana-desktop-overlay img,html.bana-desktop-overlay canvas,html.bana-desktop-overlay video{opacity:.25!important}
html.bana-desktop-overlay svg{fill:var(--bana-svg-fill)!important;stroke:var(--bana-svg-stroke)!important}
html.bana-desktop-overlay svg *{fill:var(--bana-svg-fill)!important;stroke:var(--bana-svg-stroke)!important}
html.bana-desktop-overlay ::placeholder{color:var(--bana-ink)!important;opacity:1!important}
html.bana-desktop-overlay ::-webkit-scrollbar{width:7px;height:7px;background:transparent}
html.bana-desktop-overlay ::-webkit-scrollbar-track{background:transparent!important}
html.bana-desktop-overlay ::-webkit-scrollbar-thumb{background:rgba(108,132,86,.25)!important;border-radius:8px}
#bana-desktop-tools{position:fixed!important;top:2px!important;right:8px!important;z-index:2147483647!important;display:flex!important;gap:4px;padding:3px;border-radius:10px;-webkit-app-region:no-drag}
#bana-desktop-tools button{font:12px sans-serif!important;min-width:24px;height:24px;padding:1px 5px;cursor:pointer;line-height:20px;outline:none;border:0}
#bana-desktop-drag{-webkit-app-region:drag!important;cursor:move!important;min-width:58px!important}
body{padding-top:32px!important}
`;
document.head.append(style);
const tools=document.createElement('div');tools.id='bana-desktop-tools';
tools.innerHTML='<button id="bana-desktop-drag" title="拖曳移動視窗">⠿ 移動</button><button data-action="toggle" title="切換清楚／自動">◐</button><button data-action="minimize" title="最小化">−</button><button data-action="close" title="關閉">×</button>';
document.body.append(tools);
tools.addEventListener('click',event=>{const action=event.target.dataset.action;if(action&&window.banaDesktop)window.banaDesktop[action]();});
let faded=false,queued=false;
const observer=new MutationObserver(()=>{if(faded&&!queued){queued=true;requestAnimationFrame(()=>{queued=false;paint();});}});
function watch(){observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});}
function rgba(value,alpha){if(value==='none')return 'none';const m=String(value).match(/[\d.]+/g);return m&&m.length>=3?'rgba('+m.slice(0,3).join(',')+','+alpha+')':value;}
function paint(){
  observer.disconnect();
  const root=document.documentElement;root.classList.remove('bana-desktop-overlay');
  if(faded){
    const surfaces=new Set();
    for(const node of document.body.querySelectorAll('*')){
      if(['SCRIPT','STYLE','LINK','META','TEMPLATE'].includes(node.tagName))continue;
      const cs=getComputedStyle(node),bg=cs.backgroundColor,channels=bg.match(/[\d.]+/g),box=node.getBoundingClientRect();
      const hasBackground=channels&&channels.length>=3&&(channels.length<4||Number(channels[3])>0);
      let ancestor=node.parentElement,covered=false;while(ancestor&&ancestor!==document.body){if(surfaces.has(ancestor)){covered=true;break;}ancestor=ancestor.parentElement;}
      const shell=node.tagName==='MAIN'||['app','root'].includes(node.id)||(box.width>=innerWidth*.9&&box.height>=innerHeight*.85);
      const surface=hasBackground&&!covered&&!shell;
      node.style.setProperty('--bana-ink',rgba(cs.color,.25));
      node.style.setProperty('--bana-surface',surface?rgba(bg,.15):'transparent');
      node.style.setProperty('--bana-svg-fill',rgba(cs.fill,.25));node.style.setProperty('--bana-svg-stroke',rgba(cs.stroke,.25));
      if(surface)surfaces.add(node);
    }
    root.classList.add('bana-desktop-overlay');
  }
  watch();
}
function setMode(value){faded=!!value;paint();}
window.banaDesktopSkin=Object.freeze({setMode});
watch();
if(window.banaDesktop){window.banaDesktop.onMode(setMode);window.banaDesktop.current().then(setMode);}
})();
