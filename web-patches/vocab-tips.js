(function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),uid=()=>crypto.randomUUID(),S=x=>String(x??'');
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
function button(text,run){const b=el('button','ghost',text);b.type='button';b.onclick=run;return b;}
const filled=x=>x.kr||x.zh;
function parseBatch(text){
 const rows=[],invalid=[];
 S(text).split(/\r\n|\n|\r/).forEach((raw,index)=>{
  const line=raw.trim();if(!line)return;let kr='',zh='',separator=line.indexOf('\t');
  if(separator<0){const a=line.indexOf('|'),b=line.indexOf('｜');separator=a<0?b:b<0?a:Math.min(a,b);}
  if(separator>=0){kr=line.slice(0,separator).trim();zh=line.slice(separator+1).trim();}
  else{const pair=line.match(/^(.+?)\s+((?:[0-9０-９]+\s*)?[\u3400-\u9fff].*)$/u)||line.match(/^(.+?)\s{2,}(.+)$/u);if(pair){kr=pair[1].trim();zh=pair[2].trim();}}
  if(!kr||!zh){invalid.push(index+1);return;}
  if(['韓文','韓文單字','한국어'].includes(kr)&&['中文','中文意思','뜻'].includes(zh))return;
  rows.push({kr,zh});
 });return{rows,invalid};
}
function mount(card,x){
 if(x.kind!=='vocab')return;
 const rows=clone(x.vocabRows||[]),examples=clone(x.vocabExamples||[]);if(!rows.length)rows.push({id:uid(),kr:'',zh:''});
 const host=el('section','btv-editor'),exampleHost=el('section','btv-examples-editor'),content=card.querySelector('[data-tip-field="content"]')?.closest('label');
 if(content){content.before(host);content.after(exampleHost);}else card.append(host,exampleHost);
 let inputs=[],batchInput,batchDraft='',batchOpen=!rows.some(filled),batchResult='';
 function collect(){if(batchInput)batchDraft=batchInput.value;for(const {input,record,key}of inputs){record[key]=input.value;if(window.banaTipTextColors)record[key+'Highlights']=banaTipTextColors.collect(input);}return{rows:clone(rows),examples:clone(examples)};}
 function changed(){card.dispatchEvent(new Event('input',{bubbles:true}));}
 function structural(run){collect();run();render();changed();}
 function field(record,key,label){const box=el('label','btv-field');box.append(el('span','',label));const input=el('textarea','btv-input');input.rows=1;input.value=S(record[key]);input.dataset.vocabTipField=key;input.lang=key==='kr'?'ko':'zh-Hant';input.setAttribute('aria-label',label);box.append(input);inputs.push({input,record,key});input.oninput=()=>{record[key]=input.value;changed();};if(window.banaTipTextColors)banaTipTextColors.mount(input,record[key+'Highlights']||[]);box.addEventListener('click',changed);return box;}
 function actions(array,i,kind){const box=el('div','btv-actions');for(const [text,delta]of [['↑',-1],['↓',1]]){const b=button(text,()=>structural(()=>{[array[i],array[i+delta]]=[array[i+delta],array[i]];}));b.disabled=i+delta<0||i+delta>=array.length;b.setAttribute('aria-label',kind+(delta<0?'上移':'下移'));box.append(b);}box.append(button('刪除',()=>{collect();if(filled(array[i])&&!confirm('刪除這組'+kind+'？'))return;structural(()=>array.splice(i,1));}));return box;}
 function render(){
  inputs=[];host.replaceChildren();exampleHost.replaceChildren();const list=el('div','btv-word-list');
  const bulk=el('details','btv-batch');bulk.open=batchOpen;bulk.ontoggle=()=>{if(bulk.isConnected)batchOpen=bulk.open;};bulk.append(el('summary','','批次新增單字'),el('p','btv-batch-help','一行一組韓文／中文，可用 Tab、|，或空白分隔；會加在現有單字後方。'));
  batchInput=el('textarea','btv-batch-input');batchInput.rows=5;batchInput.value=batchDraft;batchInput.dataset.vocabTipBatch='1';batchInput.setAttribute('aria-label','批次貼上韓文與中文');batchInput.placeholder='작년 去年\n지난달 上個月\n한 달 전 一個月前';
  const status=el('p','btv-batch-status'),result=el('p','btv-batch-result',batchResult);status.setAttribute('role','status');result.setAttribute('role','status');result.hidden=!batchResult;
  const addBatch=button('批次加入單字',()=>{
   collect();const parsed=parseBatch(batchDraft);if(parsed.invalid.length||!parsed.rows.length){updateBatch();return;}
   for(let i=rows.length-1;i>=0;i--)if(!S(rows[i].kr).trim()&&!S(rows[i].zh).trim())rows.splice(i,1);
   rows.push(...parsed.rows.map(row=>({id:uid(),...row})));batchDraft='';batchOpen=false;batchResult='已新增 '+parsed.rows.length+' 筆單字';render();changed();
  });addBatch.dataset.vocabTipBatchAdd='1';
  function updateBatch(){const parsed=parseBatch(batchInput.value);addBatch.disabled=!parsed.rows.length||!!parsed.invalid.length;addBatch.textContent=parsed.rows.length?'一次新增 '+parsed.rows.length+' 筆':'批次加入單字';status.textContent=parsed.invalid.length?'第 '+parsed.invalid.join('、')+' 行無法辨識，請改用「韓文 | 中文」。':parsed.rows.length?'可新增 '+parsed.rows.length+' 筆單字。':'';}
  batchInput.oninput=()=>{batchDraft=batchInput.value;batchResult='';result.hidden=true;updateBatch();};bulk.append(batchInput,status,addBatch);host.append(bulk,result);updateBatch();
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
window.banaVocabTips={mount,parseBatch};
})();
