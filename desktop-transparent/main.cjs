const {app,BrowserWindow,Tray,Menu,ipcMain,shell,nativeImage}=require('electron');
const fs=require('fs'),path=require('path');
const SITE='https://zxcv10019-max.github.io/b1a4-korean/';
const smoke=process.argv.includes('--smoke-test');
let win,tray,forceClear=false,lastMode,timer;
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function workTime(date=new Date()){const p=Object.fromEntries(clock.formatToParts(date).map(p=>[p.type,p.value])),minutes=Number(p.hour)*60+Number(p.minute);return ['Mon','Tue','Wed','Thu','Fri'].includes(p.weekday)&&minutes>=510&&minutes<1080;}
function mode(){return !forceClear&&workTime();}
function refresh(force=false){const value=mode();if(win&&!win.isDestroyed()&&(force||value!==lastMode)){win.webContents.send('bana-mode',value);lastMode=value;}if(tray){tray.setToolTip(value?'BANA Forest：文字25%，卡片15%':'BANA Forest：清楚顯示');tray.setContextMenu(Menu.buildFromTemplate([{label:'自動（平日08:30–18:00）',type:'radio',checked:!forceClear,click(){forceClear=false;refresh(true);}},{label:'暫時恢復清楚',type:'radio',checked:forceClear,click(){forceClear=true;refresh(true);}},{type:'separator'},{label:'顯示視窗',click(){win.show();win.focus();}},{label:'放大視窗',click(){const [w,h]=win.getSize();win.setSize(Math.min(w+100,1200),Math.min(h+100,1100));}},{label:'縮小視窗',click(){const [w,h]=win.getSize();win.setSize(Math.max(w-100,360),Math.max(h-100,400));}},{label:'重新載入最新版',click(){win.reload();}},{label:'結束',click(){app.quit();}}]));}}
function fromWindow(event){return win&&!win.isDestroyed()&&event.sender===win.webContents;}
ipcMain.on('bana-close',event=>{if(fromWindow(event))app.quit();});
ipcMain.on('bana-minimize',event=>{if(fromWindow(event))win.minimize();});
ipcMain.on('bana-toggle',event=>{if(fromWindow(event)){forceClear=!forceClear;refresh(true);}});
ipcMain.handle('bana-current',event=>fromWindow(event)&&mode());
if(!app.requestSingleInstanceLock())app.quit();
else{
app.on('second-instance',()=>{if(win){win.show();win.focus();}});
app.whenReady().then(async()=>{
  win=new BrowserWindow({width:560,height:800,minWidth:360,minHeight:400,show:false,frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,thickFrame:false,icon:path.join(__dirname,'logo.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(SITE)){event.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
  win.webContents.on('did-fail-load',(_event,code,description,_url,mainFrame)=>{if(mainFrame&&code!==-3){win.show();require('electron').dialog.showErrorBox('BANA Forest 載入失敗',description+'\n請確認網路後，從右下角圖示重新載入。');}});
  win.webContents.on('dom-ready',async()=>{try{await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'skin.js'),'utf8'));refresh(true);if(!smoke)win.show();}catch(error){console.error(error);if(smoke)app.exit(1);}});
  if(smoke){await runSmoke();return;}
  const icon=nativeImage.createFromPath(path.join(__dirname,'logo.png')).resize({width:24,height:24});tray=new Tray(icon);tray.on('double-click',()=>{forceClear=!forceClear;refresh(true);});
  timer=setInterval(()=>refresh(),1000);refresh(true);
  win.on('closed',()=>app.quit());
  await win.loadURL(SITE+'?desktopOpacity=1');
});
app.on('before-quit',()=>{clearInterval(timer);if(tray)tray.destroy();});
app.on('window-all-closed',()=>app.quit());
}
async function runSmoke(){
  try{
    const dates=[['2026-11-23T00:29:59Z',false],['2026-11-23T00:30:00Z',true],['2026-11-23T09:59:59Z',true],['2026-11-23T10:00:00Z',false],['2026-11-28T01:00:00Z',false],['2026-11-29T01:00:00Z',false]];
    for(const [date,value]of dates)if(workTime(new Date(date))!==value)throw Error('Schedule '+date);
    await win.loadFile(path.join(__dirname,'fixture.html'));
    await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'skin.js'),'utf8'));
    const result=await win.webContents.executeJavaScript(`(()=>{const api=window.banaDesktopSkin;api.setMode(true);const card=document.getElementById('card'),text=document.getElementById('text'),nested=document.getElementById('nested');const read={root:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(text).color,card:getComputedStyle(card).backgroundColor,nested:getComputedStyle(nested).backgroundColor};if(read.root!=='rgba(0, 0, 0, 0)'||read.body!=='rgba(0, 0, 0, 0)'||!read.text.endsWith('0.25)')||!read.card.endsWith('0.15)')||read.nested!=='rgba(0, 0, 0, 0)')throw Error(JSON.stringify(read));api.setMode(false);if(getComputedStyle(text).color!=='rgb(30, 70, 40)')throw Error('Restore color');api.setMode(true);return read;})()`);
    await new Promise(resolve=>setTimeout(resolve,400));
    const image=await win.webContents.capturePage();fs.writeFileSync(path.join(__dirname,'smoke-transparent.png'),image.toPNG());
    const bitmap=image.getBitmap();if(bitmap[3]!==0)throw Error('Window corner must be transparent: '+bitmap[3]);
    const cardAlpha=bitmap[(110*image.getSize().width+60)*4+3];if(Math.abs(cardAlpha-38)>2)throw Error('Card pixel alpha must be 15%: '+cardAlpha);
    fs.writeFileSync(path.join(__dirname,'smoke-result.json'),JSON.stringify({passed:true,windowCornerAlpha:bitmap[3],cardPixelAlpha:cardAlpha,...result},null,2));app.exit(0);
  }catch(error){console.error(error);fs.writeFileSync(path.join(__dirname,'smoke-result.json'),JSON.stringify({passed:false,error:error.stack}));app.exit(1);}
}
