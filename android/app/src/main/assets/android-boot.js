(function(){
'use strict';if(!window.BanaAndroid)return;
try{if(localStorage.length===0){const data=JSON.parse(BanaAndroid.readLocalState()||'{}');for(const [key,value]of Object.entries(data))if(typeof value==='string')localStorage.setItem(key,value)}}catch(e){console.warn('Native storage recovery failed',e)}
window.banaFlushLocalState=function(){try{const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);data[key]=localStorage.getItem(key)}BanaAndroid.saveLocalState(JSON.stringify(data))}catch(e){console.warn('Local snapshot failed',e)}};
let timer;const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(window.banaFlushLocalState,350)};
Storage.prototype.setItem=function(k,v){set.call(this,k,v);if(this===localStorage)schedule()};
Storage.prototype.removeItem=function(k){remove.call(this,k);if(this===localStorage)schedule()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.banaFlushLocalState()});
// Android TextToSpeech supplies Korean voices even where WebView lacks Web Speech.
let current=null,sequence=0;const pending=new Map();
class NativeUtterance{constructor(text){this.text=String(text||'');this.lang='ko-KR';this.rate=1;this.pitch=1;this.onend=null;this.onerror=null;this.onstart=null}}
const synth={getVoices:()=>[{name:'Android 韓文語音',lang:'ko-KR',default:true,localService:true}],cancel(){pending.clear();current=null;BanaAndroid.stopSpeech()},speak(u){const id=String(++sequence);pending.set(id,u);current=id;BanaAndroid.speak(u.text,Number(u.rate)||1,id);u.onstart?.({type:'start'})},addEventListener(){},removeEventListener(){},get speaking(){return current!==null},get pending(){return pending.size>0},paused:false};
window.__banaSpeechDone=(id,error)=>{const u=pending.get(id);pending.delete(id);if(current===id)current=null;if(u){const fn=error?u.onerror:u.onend;if(typeof fn==='function')fn.call(u,{type:error?'error':'end'})}};
Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:NativeUtterance});
})();
