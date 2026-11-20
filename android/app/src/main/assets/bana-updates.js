(function(){'use strict';
if(!window.BanaAndroid||typeof BanaAndroid.webUpdateStatus!=='function')return;
let panel,state;const busy=s=>['checking','downloading','applying'].includes(s.state);
function read(){try{return JSON.parse(BanaAndroid.webUpdateStatus())}catch{return {state:'error',message:'無法讀取更新資訊'}}}
function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b}
function pendingEdits(){return [...document.querySelectorAll('[role="dialog"],.hero-modal-mask,.modal-mask,.overlay')].some(el=>el.getClientRects().length&&(el.dataset.banaDirty==='1'||el.dataset.banaSyncDirty==='1'))}
function apply(){if(pendingEdits()){alert('還有尚未儲存的編輯，請先儲存再更新。');return}if(confirm('套用新版並重新載入 APP？已儲存的筆記與學習資料會保留。'))BanaAndroid.applyWebUpdate()}
function draw(value){state=value||read();if(!panel?.isConnected)return;
 const current=panel.querySelector('[data-update-current]');current.textContent='目前內容版本：'+(state.currentVersion||'—');
 const status=panel.querySelector('[role="status"]');status.textContent=state.message||(!state.configured?'更新網址尚未設定':'可檢查是否有新版本');
 const next=panel.querySelector('[data-update-release]');next.replaceChildren();if(state.nextVersion){const title=document.createElement('b');title.textContent='新版 '+state.nextVersion;next.append(title);if(state.notes){const notes=document.createElement('p');notes.textContent=state.notes;next.append(notes)}}
 const progress=panel.querySelector('progress');progress.hidden=state.state!=='downloading';progress.value=state.percent||0;
 const check=panel.querySelector('[data-update-check]');check.disabled=busy(state)||!state.configured;
 const install=panel.querySelector('[data-update-download]');install.hidden=state.state!=='available';install.disabled=busy(state);
 const applyButton=panel.querySelector('[data-update-apply]');applyButton.hidden=state.state!=='ready';
 const rollback=panel.querySelector('[data-update-rollback]');rollback.hidden=!state.canRollback;rollback.disabled=busy(state);
 panel.querySelector('[data-update-configure]').disabled=busy(state);
}
function mount(){const profile=document.getElementById('profile');if(!profile)return;if(document.getElementById('bana-update-panel')){panel=document.getElementById('bana-update-panel');draw();return}
 if(!document.getElementById('bana-update-style')){const css=document.createElement('link');css.id='bana-update-style';css.rel='stylesheet';css.href='/assets/bana-updates.css';document.head.append(css)}
 panel=document.createElement('section');panel.id='bana-update-panel';panel.className='bana-update-panel';panel.innerHTML='<h3>APP 更新</h3><small data-update-current></small><p role="status" aria-live="polite"></p><div data-update-release></div><progress max="100" hidden aria-label="更新下載進度"></progress><div class="bana-update-actions"></div><details><summary>更新設定</summary><div class="bana-update-settings"></div></details>';
 const actions=panel.querySelector('.bana-update-actions');for(const [key,label,fn]of [['check','檢查更新',()=>BanaAndroid.checkWebUpdate()],['download','下載新版',()=>BanaAndroid.downloadWebUpdate()],['apply','立即套用',apply]]){const b=button(label,fn);b.dataset['update'+key[0].toUpperCase()+key.slice(1)]='';actions.append(b)}
 const settings=panel.querySelector('.bana-update-settings');const source=button('設定更新來源',()=>BanaAndroid.configureWebUpdates());source.dataset.updateConfigure='';const rollback=button('恢復上一版',()=>BanaAndroid.rollbackWebUpdate());rollback.dataset.updateRollback='';settings.append(source,rollback);profile.prepend(panel);draw();
}
window.__banaUpdateState=draw;window.banaMountUpdates=mount;mount();
// Confirm a release only after the actual application and storage bridge have started.
let attempts=0;const ready=()=>{if(typeof goPage==='function'&&window.banaContentBlocks&&document.getElementById('profile')){const s=read();BanaAndroid.webUpdateReady(Number(s.versionCode)||0)}else if(++attempts<60)setTimeout(ready,200)};ready();
})();
