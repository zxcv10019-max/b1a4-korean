const {app,BrowserWindow,Tray,Menu,ipcMain,shell,nativeImage,screen}=require('electron');
const fs=require('fs'),path=require('path');
const SITE='https://zxcv10019-max.github.io/b1a4-korean/',smoke=process.argv.includes('--smoke-test');
if(smoke){const p=path.join(app.getPath('temp'),'bana-smoke-'+process.pid);fs.mkdirSync(p,{recursive:true});app.setPath('userData',p);}
let win,tray,windowControls,opacityControls,pendingLogin,prefsFile,saveTimer,trayTimer,prefsDirty=false;
function queueTray(){if(trayTimer)return;trayTimer=setTimeout(()=>{trayTimer=null;renderTray();},100);}
function writePrefs(){if(smoke||!prefsDirty||!prefsFile)return;try{fs.writeFileSync(prefsFile,JSON.stringify({opacityPercent:opacityControls.current()}));prefsDirty=false;}catch(error){console.warn('Cannot save desktop opacity:',error.message);}}
function saveOpacity(){if(smoke)return;prefsDirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(writePrefs,250);}
function renderTray(){
  if(!tray)return;
  const state=windowControls.state(),percent=opacityControls.current();tray.setToolTip('BANA Forest：不透明度 '+percent+'%');
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'恢復100%不透明度',click:()=>opacityControls.setPercent(100)},
    {label:'整體不透明度',submenu:[100,80,60,40,20,10].map(value=>({label:value+'%',type:'radio',checked:percent===value,click:()=>opacityControls.setPercent(value)}))},
    {type:'separator'},{label:'滑鼠移出時隱藏主體',type:'checkbox',checked:state.autoHide,click:()=>windowControls.toggleAutoHide()},
    {label:state.collapsed?'展開主體':'收合成工具列',click:()=>windowControls.toggleCollapse()},
    {label:'置頂',type:'checkbox',checked:state.pinned,click:()=>windowControls.togglePin()},
    {type:'separator'},{label:'顯示視窗',click(){win.show();win.focus();}},
    {label:'放大視窗',click(){windowControls.expand();const [w,h]=win.getSize();win.setSize(Math.min(w+100,1200),Math.min(h+100,1100));}},
    {label:'縮小視窗',click(){windowControls.expand();const [w,h]=win.getSize();win.setSize(Math.max(w-100,400),Math.max(h-100,400));}},
    {label:'重新載入最新版',click:()=>win.reload()},{label:'結束',click:()=>app.quit()}
  ]));
}
function fromWindow(event){return win&&!win.isDestroyed()&&event.sender===win.webContents;}
ipcMain.on('bana-close',event=>{if(fromWindow(event))app.quit();});
ipcMain.on('bana-minimize',event=>{if(fromWindow(event))win.minimize();});
ipcMain.handle('bana-opacity-current',event=>fromWindow(event)&&opacityControls.current());
ipcMain.handle('bana-opacity',(event,value)=>fromWindow(event)&&opacityControls.setPercent(value));
ipcMain.handle('bana-window-state',event=>fromWindow(event)&&windowControls.state());
ipcMain.handle('bana-collapse',event=>fromWindow(event)&&windowControls.toggleCollapse());
ipcMain.handle('bana-pin',event=>fromWindow(event)&&windowControls.togglePin());
ipcMain.handle('bana-auto-hide',event=>fromWindow(event)&&windowControls.toggleAutoHide());
ipcMain.on('bana-mouse-enter',event=>{if(fromWindow(event))windowControls.enter();});
ipcMain.on('bana-mouse-leave',event=>{if(fromWindow(event))windowControls.leave();});
ipcMain.handle('bana-login',async event=>{
  if(!fromWindow(event)||!event.senderFrame.url.startsWith(SITE))throw Error('Untrusted login request');
  if(pendingLogin)throw Error('Google 登入已在進行中，請先完成瀏覽器的登入。');
  const handoff=require('./auth-handoff.cjs').createHandoff({origin:new URL(SITE).origin});pendingLogin=handoff;handoff.result.catch(()=>{});
  try{const {port,state}=await handoff.ready;await shell.openExternal(SITE+'?desktopOpacity=1&desktopAuthPort='+port+'&desktopAuthState='+state);return await handoff.result;}
  catch(error){handoff.cancel();throw error;}finally{pendingLogin=null;}
});
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(win){win.show();win.focus();}});
  app.whenReady().then(async()=>{
    win=new BrowserWindow({width:560,height:800,minWidth:400,minHeight:400,show:false,frame:false,transparent:true,opacity:1,backgroundColor:'#00000000',hasShadow:false,thickFrame:false,icon:path.join(__dirname,'logo.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
    prefsFile=path.join(app.getPath('userData'),'manual-opacity.json');let initial=100;
    if(!smoke)try{initial=JSON.parse(fs.readFileSync(prefsFile,'utf8')).opacityPercent;}catch{}
    opacityControls=require('./opacity-controls.cjs').createOpacityControls({win,initial,save:saveOpacity,onChange:value=>{win.webContents.send('bana-opacity',value);queueTray();}});
    windowControls=require('./window-controls.cjs').createWindowControls({win,screen,onChange:state=>{win.webContents.send('bana-window-state',state);renderTray();}});
    opacityControls.setPercent(opacityControls.current(),{persist:false});win.setMenu(null);
    win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
    win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(SITE)){event.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
    win.webContents.on('did-fail-load',(_event,code,description,_url,mainFrame)=>{if(mainFrame&&code!==-3){win.show();require('electron').dialog.showErrorBox('BANA Forest 載入失敗',description+'\n請確認網路後，從右下角圖示重新載入。');}});
    win.webContents.on('dom-ready',async()=>{try{await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'skin.js'),'utf8'));if(!smoke)await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'login.js'),'utf8'));windowControls.publish();win.webContents.send('bana-opacity',opacityControls.current());if(!smoke)win.show();}catch(error){console.error(error);if(smoke)app.exit(1);}});
    if(smoke){await runSmoke();return;}
    tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'logo.png')).resize({width:24,height:24}));tray.on('double-click',()=>{windowControls.expand();win.show();win.focus();});renderTray();
    win.on('closed',()=>app.quit());await win.loadURL(SITE+'?desktopOpacity=1');
  });
  app.on('before-quit',()=>{clearTimeout(saveTimer);clearTimeout(trayTimer);writePrefs();windowControls?.dispose();if(tray)tray.destroy();if(pendingLogin)pendingLogin.cancel();});
  app.on('window-all-closed',()=>app.quit());
}
async function runSmoke(){
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    await win.loadFile(path.join(__dirname,'fixture.html'));await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'skin.js'),'utf8'));await wait(150);
    if(opacityControls.current()!==100||Math.abs(win.getOpacity()-1)>.01)throw Error('Default must be 100%');
    const original=await win.webContents.executeJavaScript(`(()=>{const card=document.getElementById('card'),nested=document.getElementById('nested');const result={text:getComputedStyle(document.getElementById('text')).color,card:getComputedStyle(card).backgroundColor,nested:getComputedStyle(nested).backgroundColor,outline:getComputedStyle(card).outlineWidth};if(result.text!=='rgb(30, 70, 40)'||result.card!=='rgb(230, 240, 220)'||result.nested!=='rgb(250, 240, 220)'||result.outline!=='0px')throw Error(JSON.stringify(result));return result})()`);
    opacityControls.setPercent(45);await wait(80);if(Math.abs(win.getOpacity()-.45)>.01)throw Error('Whole window opacity');
    await win.webContents.executeJavaScript("const range=document.querySelector('#bana-desktop-tools input');range.value='70';range.dispatchEvent(new Event('input',{bubbles:true}));");
    for(let i=0;i<20&&opacityControls.current()!==70;i++)await wait(50);
    if(opacityControls.current()!==70||Math.abs(win.getOpacity()-.7)>.01)throw Error('Slider must control native opacity');
    const expanded=win.getBounds();windowControls.toggleCollapse();await wait(150);
    if(win.getBounds().height!==40||!await win.webContents.executeJavaScript("document.documentElement.classList.contains('bana-desktop-collapsed')&&getComputedStyle(document.getElementById('card')).visibility==='hidden'&&document.getElementById('bana-desktop-tools').getBoundingClientRect().left>=0"))throw Error('Toolbar collapse');
    windowControls.togglePin();if(!win.isAlwaysOnTop())throw Error('Always on top');
    fs.writeFileSync(path.join(__dirname,'smoke-toolbar.png'),(await win.webContents.capturePage()).toPNG());
    windowControls.expand();await wait(100);if(win.getBounds().width!==Math.min(expanded.width,screen.getDisplayMatching(win.getBounds()).workArea.width))throw Error('Restore size');windowControls.togglePin();
    windowControls.toggleAutoHide();windowControls.leave();await wait(400);if(!windowControls.state().collapsed)throw Error('Mouse leave auto hide');
    windowControls.enter();await wait(100);if(windowControls.state().collapsed)throw Error('Mouse enter expand');windowControls.toggleAutoHide();
    opacityControls.setPercent(100);await wait(100);if(Math.abs(win.getOpacity()-1)>.01)throw Error('Restore 100%');
    fs.writeFileSync(path.join(__dirname,'smoke-transparent.png'),(await win.webContents.capturePage()).toPNG());
    fs.writeFileSync(path.join(__dirname,'smoke-result.json'),JSON.stringify({passed:true,defaultOpacity:100,nativeSlider:true,originalColors:original,toolbarCollapse:true,alwaysOnTop:true,mouseLeaveHide:true,mouseEnterExpand:true,noAutomaticSchedule:true},null,2));app.exit(0);
  }catch(error){console.error(error);fs.writeFileSync(path.join(__dirname,'smoke-result.json'),JSON.stringify({passed:false,error:error.stack}));app.exit(1);}
}
