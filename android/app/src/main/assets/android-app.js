(function(){
'use strict';if(!window.BanaAndroid)return;
document.documentElement.classList.add('bana-android');
const $=id=>document.getElementById(id);
const nav=document.querySelector('.bottom-nav');if(nav){const measure=()=>document.documentElement.style.setProperty('--bana-nav-height',nav.getBoundingClientRect().height+'px');new ResizeObserver(measure).observe(nav);measure();nav.addEventListener('click',()=>setTimeout(()=>window.scrollTo({top:0,behavior:'instant'}),0))}
function saveBlob(blob,name,kind){const reader=new FileReader();reader.onload=()=>BanaAndroid.saveFile(name,blob.type||'application/octet-stream',String(reader.result).split(',')[1],kind||'download');reader.onerror=()=>alert('檔案轉換失敗，請重試。');reader.readAsDataURL(blob)}
window.__banaExportDone=function(kind){if(kind==='backup'){localStorage.setItem(BACKUP_LAST_AT_KEY,new Date().toISOString());updateBackupStatusUI()}window.banaFlushLocalState()};
exportFullBackup=function(){try{saveBlob(new Blob([JSON.stringify(getCloudPayload(),null,2)],{type:'application/json'}),'BANAForest-備份-'+new Date().toISOString().slice(0,10)+'.json','backup')}catch(e){alert('匯出失敗：'+e.message)}};
document.addEventListener('click',async e=>{const a=e.target.closest?.('a[download]');if(!a)return;const href=a.href;if(!/^(blob:|data:)/.test(href))return;e.preventDefault();e.stopImmediatePropagation();try{const response=await fetch(href);saveBlob(await response.blob(),a.download||'BANA-Forest-export','download')}catch(error){alert('檔案匯出失敗，請再試一次。')}},true);
const oldUpdate=updateBottomNav;updateBottomNav=function(id){oldUpdate(id);if(['practiceHub','flash','test','match','listen'].includes(id)){document.querySelectorAll('.bottom-nav button').forEach(b=>{b.classList.toggle('active',b.dataset.tab==='home');if(b.dataset.tab==='home')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}};
// Access study from the home screen now that there are five bottom tabs.
const home=$('home');if(home){const card=document.createElement('div');card.className='bana-app-study';card.innerHTML='<div><small>每天讀一點</small><b>今天也一起學韓文</b></div><button type="button">開始學習 →</button>';card.querySelector('button').onclick=()=>goPage('practiceHub');home.prepend(card)}
const profile=$('profile');if(profile){const panel=document.createElement('section');panel.className='bana-app-storage';panel.innerHTML='<small>BANA Forest · Android 0.6.0</small><h3>你的隨身學習森林</h3><p>未登入時仍保留手機上的資料。Google 登入與跨裝置狀態請查看「跨裝置連動」；也可繼續使用備份匯入匯出。</p><div><button type="button" data-import>匯入備份</button><button type="button" data-export>匯出備份</button></div>';panel.querySelector('[data-import]').onclick=triggerFullBackupImport;panel.querySelector('[data-export]').onclick=exportFullBackup;profile.prepend(panel)}
// Default page and original last-browse category memory stay owned by the existing app.
updateBottomNav(document.querySelector('.page.active')?.id||'home');
document.addEventListener('input',e=>{const modal=e.target.closest('[role="dialog"],.hero-modal-mask,.modal-mask,.overlay');if(modal)modal.dataset.banaDirty='1'},true);
function visible(el){return !!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length>0}
window.banaAndroidBack=function(){
 const welcome=$('banaAppWelcome');if(welcome){welcome.remove();localStorage.setItem('bana_app_welcome_v1','1');return true}
 const masks=[...document.querySelectorAll('[role="dialog"],.hero-modal-mask,.modal-mask,.overlay,.modal')].filter(visible).sort((a,b)=>{const z=el=>{let n=el,max=0;while(n&&n!==document.body){max=Math.max(max,parseInt(getComputedStyle(n).zIndex)||0);n=n.parentElement}return max};return z(b)-z(a)});
 for(const mask of masks){const close=[...mask.querySelectorAll('button')].find(b=>visible(b)&&/^(關閉|取消|✕|×|返回)$/.test(b.textContent.trim()));if(close){if((mask.dataset.banaDirty==='1'||mask.querySelector('[data-bana-dirty="1"]'))&&!confirm('還有尚未儲存的編輯，要離開嗎？'))return true;close.click();return true}}
 if(window.banaReaderReturn?.back())return true;
 const wl=$('wordListOverlay');if(visible(wl)&&wl.classList.contains('show')){closeWordList();return true}
 if(history.state&&history.length>1){history.back();return true}
 const page=document.querySelector('.page.active');if(page&&page.id!=='home'){goPage('home');return true}return false;
};
if(!localStorage.getItem('bana_app_welcome_v1')){const modal=document.createElement('div');modal.id='banaAppWelcome';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','banaAppWelcomeTitle');modal.innerHTML='<section><span class="bana-app-sprout">🌱</span><small>歡迎回到 BANA Forest</small><h2 id="banaAppWelcomeTitle">把你的題庫帶進來</h2><p>先在原網頁的「我的」匯出備份檔，再選擇該 JSON 檔。單字、文法、會話與故事都會一起帶進來。</p><p class="bana-app-caption">已內建 Google 設定，可到「我的 → 跨裝置連動」登入。更新 App 請直接覆蓋安裝，保留原資料。</p><button type="button" data-import>選擇備份檔</button><button type="button" data-skip>先開始使用</button></section>';const dismiss=()=>{localStorage.setItem('bana_app_welcome_v1','1');modal.remove()};modal.querySelector('[data-import]').onclick=()=>{dismiss();goPage('profile');triggerFullBackupImport()};modal.querySelector('[data-skip]').onclick=dismiss;document.body.append(modal)}
window.banaFlushLocalState();
})();
