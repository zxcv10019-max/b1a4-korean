(function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),uid=()=>crypto.randomUUID(),S=x=>String(x??'');
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
function button(text,run){const b=el('button','ghost',text);b.type='button';b.onclick=run;return b;}
const filled=x=>x.kr||x.zh;
function mount(card,x){
 if(x.kind!=='vocab')return;
 const rows=clone(x.vocabRows||[]),examples=clone(x.vocabExamples||[]);if(!rows.length)rows.push({id:uid(),kr:'',zh:''});
 const host=el('section','btv-editor'),exampleHost=el('section','btv-examples-editor'),content=card.querySelector('[data-tip-field="content"]')?.closest('label');
 if(content){content.before(host);content.after(exampleHost);}else card.append(host,exampleHost);
 let inputs=[];
 function collect(){for(const {input,record,key}of inputs){record[key]=input.value;if(window.banaTipTextColors)record[key+'Highlights']=banaTipTextColors.collect(input);}return{rows:clone(rows),examples:clone(examples)};}
 function changed(){card.dispatchEvent(new Event('input',{bubbles:true}));}
 function structural(run){collect();run();render();changed();}
 function field(record,key,label){const box=el('label','btv-field');box.append(el('span','',label));const input=el('textarea','btv-input');input.rows=1;input.value=S(record[key]);input.dataset.vocabTipField=key;input.lang=key==='kr'?'ko':'zh-Hant';input.setAttribute('aria-label',label);box.append(input);inputs.push({input,record,key});input.oninput=()=>{record[key]=input.value;changed();};if(window.banaTipTextColors)banaTipTextColors.mount(input,record[key+'Highlights']||[]);box.addEventListener('click',changed);return box;}
 function actions(array,i,kind){const box=el('div','btv-actions');for(const [text,delta]of [['↑',-1],['↓',1]]){const b=button(text,()=>structural(()=>{[array[i],array[i+delta]]=[array[i+delta],array[i]];}));b.disabled=i+delta<0||i+delta>=array.length;b.setAttribute('aria-label',kind+(delta<0?'上移':'下移'));box.append(b);}box.append(button('刪除',()=>{collect();if(filled(array[i])&&!confirm('刪除這組'+kind+'？'))return;structural(()=>array.splice(i,1));}));return box;}
 function render(){
  inputs=[];host.replaceChildren();exampleHost.replaceChildren();const list=el('div','btv-word-list');
  rows.forEach((r,i)=>{r.id=r.id||uid();const row=el('section','btv-word-editor');row.dataset.vocabTipRow=r.id;const head=el('header','btv-head');head.append(el('small','','單字 '+(i+1)),actions(rows,i,'單字'));const pair=el('div','btv-fields');pair.append(field(r,'kr','韓文'),field(r,'zh','中文意思'));row.append(head,pair);list.append(row);});
  const add=button('＋ 新增單字',()=>structural(()=>rows.push({id:uid(),kr:'',zh:''})));add.dataset.vocabTipAdd='1';host.append(list,add);
  exampleHost.append(el('b','','例句（選填）'));
  examples.forEach((r,i)=>{r.id=r.id||uid();const row=el('section','btv-example-editor');row.dataset.vocabTipExample=r.id;const head=el('header','btv-head');head.append(el('small','','例句 '+(i+1)),actions(examples,i,'例句'));const pair=el('div','btv-fields');pair.append(field(r,'kr','韓文例句'),field(r,'zh','中文翻譯（選填）'));row.append(head,pair);exampleHost.append(row);});
  const addExample=button('＋ 新增例句',()=>structural(()=>examples.push({id:uid(),kr:'',zh:''})));addExample.dataset.vocabTipExampleAdd='1';exampleHost.append(addExample);
 }
 card.collectVocabTips=collect;render();
}
const esc=s=>S(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=(s,h)=>window.banaTipTextColors?banaTipTextColors.html(S(s),h||[]):esc(s);
const previous=window.banaGrammarTipsHtml;
window.banaGrammarTipsHtml=function(g){
 const template=document.createElement('template');template.innerHTML=previous(g);const tips=banaGrammarTipModel.clean(banaGrammarTipModel.fromLegacy(g));
 [...template.content.querySelectorAll('.bgt-read-card')].forEach((card,i)=>{
  const x=tips[i];if(x?.kind!=='vocab')return;const head=card.querySelector('.bgt-read-head');card.replaceChildren();if(head)card.append(head);card.classList.add('btv-reading');
  const words=(x.vocabRows||[]).filter(filled);if(words.length){const list=el('div','btv-read-list');list.innerHTML=words.map(r=>'<div class="btv-read-row">'+(r.kr?'<span lang="ko" class="btv-kr">'+rich(r.kr,r.krHighlights)+'</span>':'')+(r.zh?'<span lang="zh-Hant" class="btv-zh">'+rich(r.zh,r.zhHighlights)+'</span>':'')+'</div>').join('');card.append(list);}
  if(x.content){const note=el('div','btv-supplement');note.innerHTML=rich(x.content,x.contentHighlights);card.append(note);}
  const examples=(x.vocabExamples||[]).filter(filled);if(examples.length){const list=el('section','btv-read-examples');list.append(el('small','','例句'));for(const r of examples){const row=el('div','btv-read-example');row.innerHTML=(r.kr?'<p lang="ko">'+rich(r.kr,r.krHighlights)+'</p>':'')+(r.zh?'<p lang="zh-Hant" class="btv-zh">'+rich(r.zh,r.zhHighlights)+'</p>':'');list.append(row);}card.append(list);}
 });return template.innerHTML;
};
window.banaVocabTips={mount};
})();
