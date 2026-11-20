(function(){'use strict';
if(window.banaFloatingReaderNav)return;
const visible=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
let scheduled=false;
function ensure(){scheduled=false;const mask=document.getElementById('banaGrammarNoteMask');if(!visible(mask))return;const reader=mask.querySelector('.bgn-reader');if(!reader)return;
 let nav=mask.querySelector('.bana-reader-float');if(!nav){nav=document.createElement('nav');nav.className='bana-reader-float';nav.setAttribute('aria-label','閱讀頁快捷操作');
 const back=document.createElement('button');back.type='button';back.className='bana-reader-float-back';back.innerHTML='<span aria-hidden="true">←</span> 返回';back.setAttribute('aria-label','返回上一頁');back.addEventListener('click',()=>{const close=mask.querySelector('[data-bgn-action="close"]');if(close)close.click()});
 const top=document.createElement('button');top.type='button';top.className='bana-reader-float-top';top.innerHTML='<span aria-hidden="true">↑</span> 頂端';top.setAttribute('aria-label','回到閱讀內容頂端');top.addEventListener('click',()=>{const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';let scrolled=false;for(const el of [mask,reader,...reader.querySelectorAll('.bn-grammar-body,.bgn-note-content')]){if(el.scrollHeight>el.clientHeight+2){el.scrollTo({top:0,behavior});scrolled=true}}if(!scrolled)window.scrollTo({top:0,behavior})});nav.append(back,top);mask.append(nav);}
 const editor=document.getElementById('grammarEditorMask');const hide=visible(editor)&&editor.classList.contains('show');if(nav.hidden!==hide)nav.hidden=hide;
 const bounds=reader.getBoundingClientRect(),bottomNav=document.querySelector('.bottom-nav'),bar=visible(bottomNav)?bottomNav.getBoundingClientRect():null;
 nav.style.right=Math.max(10,innerWidth-bounds.right+10)+'px';nav.style.bottom=Math.max(12,innerHeight-Math.min(innerHeight,bounds.bottom)+10,bar?innerHeight-bar.top+10:0)+'px';
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(ensure)}
const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.banaFloatingReaderNav={refresh:ensure};ensure();
})();
