(function(){
'use strict';
if(window.banaDesktopToolbar)return;
const style=document.createElement('style');style.id='bana-desktop-toolbar-style';
style.textContent=`
#bana-desktop-tools{position:fixed!important;top:2px!important;right:8px!important;z-index:2147483647!important;display:flex!important;align-items:center;gap:4px;padding:3px;border-radius:10px;-webkit-app-region:no-drag;color:#405b3c}
#bana-desktop-tools button{box-sizing:border-box!important;font:12px sans-serif!important;min-width:24px;height:24px;padding:1px 5px;cursor:pointer;line-height:20px;outline:none;border:0}
#bana-desktop-drag{-webkit-app-region:drag!important;cursor:move!important;min-width:52px!important}
#bana-desktop-tools input[type="range"]{box-sizing:border-box!important;width:70px!important;min-width:0!important;max-width:70px!important;flex:0 0 70px;height:24px;padding:0;margin:0;appearance:auto;accent-color:#78945b;background:transparent;border:0;box-shadow:none;-webkit-app-region:no-drag}
#bana-desktop-tools output{font:11px sans-serif;min-width:32px;line-height:24px}
#bana-desktop-tools button[aria-pressed="true"]{box-shadow:inset 0 -2px #5f8049!important}
html.bana-desktop-collapsed,html.bana-desktop-collapsed body{background:transparent!important;overflow:hidden!important}
html.bana-desktop-collapsed body>:not(#bana-desktop-tools){visibility:hidden!important;pointer-events:none!important}
html.bana-desktop-collapsed body::before,html.bana-desktop-collapsed body::after{display:none!important}
html.bana-desktop-collapsed #bana-desktop-tools{visibility:visible!important}
body{padding-top:40px!important}
[data-bana-desktop-docked]{top:var(--bana-desktop-top)!important}
[data-bana-desktop-full-height]{max-height:calc(100vh - var(--bana-desktop-top))!important;min-height:0!important}
`;
document.head.append(style);
const tools=document.createElement('div');tools.id='bana-desktop-tools';
tools.innerHTML='<span style="font:11px sans-serif">v0.2.8</span><button id="bana-desktop-drag" title="拖曳移動視窗">⠿ 移動</button><input type="range" min="10" max="100" step="5" value="100" aria-label="整體不透明度" title="整體不透明度"><output>100%</output><button data-action="autoHide" title="開啟：滑鼠移出隱藏主體" aria-label="開啟：滑鼠移出隱藏主體" aria-pressed="false">自動藏</button><button data-action="pin" title="置頂" aria-label="置頂" aria-pressed="false">釘</button><button data-action="collapse" title="收合主體，只保留工具列" aria-label="收合主體" aria-expanded="true">▴</button><button data-action="minimize" title="最小化">−</button><button data-action="close" title="關閉">×</button>';
document.body.append(tools);
function dockLayout(roots){
  const candidates=new Set(),updates=[];
  for(const root of roots){if(!root.isConnected)continue;if(root.nodeType===1)candidates.add(root);for(const node of root.querySelectorAll?.('*')||[])candidates.add(node);}
  for(const node of candidates){
    if(tools.contains(node)||node===tools||node.hasAttribute('data-bana-desktop-docked'))continue;
    const cs=getComputedStyle(node),top=parseFloat(cs.top),fixed=cs.position==='fixed',sticky=cs.position==='sticky';
    if((!fixed&&!sticky)||!Number.isFinite(top)||top<0||top>=40)continue;
    let nested=false;
    for(let parent=node.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
      const style=getComputedStyle(parent);
      if((sticky&&style.position==='fixed')||(fixed&&(style.transform!=='none'||style.perspective!=='none'||style.filter!=='none'))){nested=true;break;}
    }
    if(!nested)updates.push({node,top:top+40,full:fixed&&parseFloat(cs.height)>=innerHeight-60});
  }
  for(const {node,top,full}of updates){node.style.setProperty('--bana-desktop-top',top+'px');node.setAttribute('data-bana-desktop-docked','');if(full)node.setAttribute('data-bana-desktop-full-height','');}
}
dockLayout([document.body]);
const layoutRoots=new Set();let layoutQueued=false;
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!tools.contains(node))layoutRoots.add(node);if(layoutRoots.size&&!layoutQueued){layoutQueued=true;queueMicrotask(()=>{layoutQueued=false;const roots=[...layoutRoots];layoutRoots.clear();dockLayout(roots);});}}).observe(document.body,{childList:true,subtree:true});
const bridge=window.banaDesktop,slider=tools.querySelector('input'),output=tools.querySelector('output'),collapse=tools.querySelector('[data-action="collapse"]'),pin=tools.querySelector('[data-action="pin"]'),autoHide=tools.querySelector('[data-action="autoHide"]');
function showOpacity(value){slider.value=String(value);output.textContent=value+'%';}
slider.addEventListener('input',()=>{const value=Number(slider.value);showOpacity(value);if(bridge?.setOpacity)bridge.setOpacity(value).catch(()=>{});});
tools.addEventListener('click',event=>{const action=event.target.dataset.action;if(action&&typeof bridge?.[action]==='function')bridge[action]();});
function setWindowState(state){
  const folded=!!state.collapsed,pinned=!!state.pinned,automatic=!!state.autoHide;
  document.documentElement.classList.toggle('bana-desktop-collapsed',folded);
  collapse.textContent=folded?'▾':'▴';collapse.title=folded?'展開主體':'收合主體，只保留工具列';collapse.setAttribute('aria-label',folded?'展開主體':'收合主體');collapse.setAttribute('aria-expanded',String(!folded));
  pin.title=pinned?'取消置頂':'置頂';pin.setAttribute('aria-label',pin.title);pin.setAttribute('aria-pressed',String(pinned));
  autoHide.title=(automatic?'關閉':'開啟')+'：滑鼠移出隱藏主體';autoHide.setAttribute('aria-label',autoHide.title);autoHide.setAttribute('aria-pressed',String(automatic));
}
if(bridge?.onWindowState){bridge.onWindowState(setWindowState);bridge.windowState().then(setWindowState);}
if(bridge?.onOpacity){bridge.onOpacity(showOpacity);bridge.opacity().then(showOpacity);}
let inside=true,dragging=false;
document.documentElement.addEventListener('mouseenter',()=>{inside=true;bridge?.mouseEnter?.();});
document.documentElement.addEventListener('mouseleave',()=>{inside=false;if(!dragging)bridge?.mouseLeave?.();});
window.addEventListener('pointerdown',()=>{dragging=true;bridge?.mouseEnter?.();},true);
window.addEventListener('pointerup',()=>{dragging=false;if(!inside)bridge?.mouseLeave?.();},true);
window.addEventListener('blur',()=>{dragging=false;});
window.banaDesktopToolbar=Object.freeze({version:'0.2.8'});
})();
