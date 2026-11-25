const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('banaDesktop',Object.freeze({
  close:()=>ipcRenderer.send('bana-close'),minimize:()=>ipcRenderer.send('bana-minimize'),login:()=>ipcRenderer.invoke('bana-login'),
  setOpacity:value=>ipcRenderer.invoke('bana-opacity',value),opacity:()=>ipcRenderer.invoke('bana-opacity-current'),
  onOpacity:callback=>{if(typeof callback==='function')ipcRenderer.on('bana-opacity',(_event,value)=>callback(value));},
  collapse:()=>ipcRenderer.invoke('bana-collapse'),pin:()=>ipcRenderer.invoke('bana-pin'),autoHide:()=>ipcRenderer.invoke('bana-auto-hide'),
  mouseEnter:()=>ipcRenderer.send('bana-mouse-enter'),mouseLeave:()=>ipcRenderer.send('bana-mouse-leave'),
  windowState:()=>ipcRenderer.invoke('bana-window-state'),
  onWindowState:callback=>{if(typeof callback==='function')ipcRenderer.on('bana-window-state',(_event,value)=>callback(value));}
}));
