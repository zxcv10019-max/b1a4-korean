const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('banaDesktop',Object.freeze({
  close:()=>ipcRenderer.send('bana-close'),
  minimize:()=>ipcRenderer.send('bana-minimize'),
  toggle:()=>ipcRenderer.send('bana-toggle'),
  current:()=>ipcRenderer.invoke('bana-current'),
  login:()=>ipcRenderer.invoke('bana-login'),
  onMode:callback=>{if(typeof callback==='function')ipcRenderer.on('bana-mode',(_event,value)=>callback(value));}
}));
