from pathlib import Path
import sys

EDITOR=r'''function ruleExamplesEditor(ctx,b,body){
 const host=el('section','cb-rule-examples-editor');host.append(el('b','','④ 例句'));
 const rows=b.ruleExamples||[];
 rows.forEach((r,i)=>{const item=el('div','cb-rule-example-editor cb-same-meaning-example');item.dataset.exampleId=r.id;
 const grid=el('div','cb-same-example-fields');
 function coloredField(record,key,label,cls){const field=input(ctx,record[key],v=>record[key]=v,{multi:true,label:label+' '+(i+1)});field.rows=1;field.dataset.ruleExampleKey=key;const box=labeled(label,field);box.classList.add('cb-colored-example-field');if(cls)box.classList.add(cls);if(window.banaTipTextColors){banaTipTextColors.mount(field,record[key+'Highlights']||[]);ctx.exampleColors.push({field,record,key});const keep=()=>{record[key]=field.value;record[key+'Highlights']=banaTipTextColors.collect(field);changed(ctx)};field.addEventListener('input',keep);box.addEventListener('click',keep);box.addEventListener('keyup',keep)}return box}
 grid.append(coloredField(r,'base','原形／變化前（選填）','cb-example-base'),coloredField(r,'kr','韓文／變化後形式','cb-example-primary'));
 const alternatives=el('div','cb-example-equivalents');
 (r.equivalents||[]).forEach((v,j)=>{const row=el('div','cb-example-equivalent');row.append(el('span','','＝'),coloredField(v,'kr','同義說法 '+(j+1)));const remove=button('刪除說法',()=>{if(str(v.kr).trim()&&!confirm('刪除這個同義說法？'))return;structural(ctx,()=>r.equivalents.splice(j,1))});row.append(remove);alternatives.append(row)});
 const addSame=button('＋ 新增同義說法',()=>structural(ctx,()=>{r.equivalents??=[];r.equivalents.push({id:id(),kr:''})}));addSame.dataset.addEquivalent='1';grid.append(alternatives,addSame,coloredField(r,'zh','共用中文意思（選填）','cb-example-shared-zh'));
 const filled=()=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr);const ops=controls(ctx,rows,i,()=>{if(!filled()||confirm('刪除這組例句及其同義說法？'))structural(ctx,()=>rows.splice(i,1))});ops.prepend(button('▶ 發音',()=>{if(r.kr?.trim())speakKorean(r.kr)}));item.append(grid,ops);host.append(item);});
 const add=()=>{const added={id:id(),base:'',kr:'',zh:'',equivalents:[]};structural(ctx,()=>{b.ruleExamples??=[];b.ruleExamples.push(added)});const field=ctx.list.querySelector('[data-example-id="'+added.id+'"] [contenteditable], [data-example-id="'+added.id+'"] textarea:not([hidden])');field?.focus({preventScroll:true});field?.scrollIntoView({block:'nearest'});};host.append(button('＋新增例句',add));body.append(host);
}'''
READER=r'''function ruleExamplesHTML(b){const entries=(b.ruleExamples||[]).filter(e=>str(e.base).trim()||str(e.kr).trim()||str(e.zh).trim()||(e.equivalents||[]).some(v=>str(v.kr).trim()));return entries.length?'<div class="cb-rule-examples-read"><small>例句</small>'+entries.map(e=>{const forms=[...(str(e.base).trim()?[{text:e.base,highlights:e.baseHighlights||[],separator:''}]:[]),...(str(e.kr).trim()?[{text:e.kr,highlights:e.krHighlights||[],separator:str(e.base).trim()?'→':''}]:[]),...(e.equivalents||[]).filter(v=>str(v.kr).trim()).map(v=>({text:v.kr,highlights:v.krHighlights||[],separator:'＝'}))];return '<div class="cb-rule-example-read">'+(forms.length?'<div class="cb-rule-example-kr cb-example-forms" lang="ko">'+forms.map((v,i)=>(i&&v.separator?'<span class="cb-example-relation">'+v.separator+'</span>':'')+'<span>'+compactRuleExample(v.text,v.highlights)+'</span>').join('')+'</div>':'')+(str(e.zh).trim()?'<div class="cb-formula-translation cb-rule-example-zh" lang="zh-Hant">'+compactRuleExample(e.zh,e.zhHighlights||[])+'</div>':'')+'</div>'}).join('')+'</div>':''}'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-example-equivalents-style' in s:return
 for name,replacement in [('ruleExamplesEditor',EDITOR),('ruleExamplesHTML',READER)]:
  start=s.index('function '+name+'(');end=s.index('\nfunction ',start+1);s=s[:start]+replacement+s[end:]
 s=s.replace('(s.ruleExamples||[]).some(r=>r.kr||r.zh)','(s.ruleExamples||[]).some(r=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr))')
 css='''<style id="bana-example-equivalents-style">
.cb-same-example-fields{display:grid;gap:5px;min-width:0}.cb-example-equivalents{display:grid;gap:5px;min-width:0}.cb-example-equivalent{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:5px;align-items:center}.cb-example-equivalent>.cb-button{padding:3px 5px!important;font-size:11px!important}.cb-example-equivalent>span{color:#819474}.cb-example-forms{display:flex;flex-wrap:wrap;align-items:baseline;gap:3px 6px}.cb-example-relation{color:#8c9c7d;flex:none}.cb-example-forms>span{white-space:pre-wrap;overflow-wrap:anywhere}.cb-same-example-fields>.cb-button{justify-self:start}.cb-example-shared-zh{border-top:1px dashed #dce4d2;padding-top:5px}.cb-same-meaning-example{padding:7px!important}.cb-example-equivalent .cb-colored-example-field{margin:0}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
