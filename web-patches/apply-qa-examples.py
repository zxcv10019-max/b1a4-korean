from pathlib import Path
import sys

HELPERS=r'''function qaExampleEditor(ctx,b,r,i,rows,host){
 const item=el('section','cb-rule-example-editor cb-qa-example-editor');item.dataset.exampleId=r.id;
 const head=el('header','cb-qa-head');head.append(el('b','','問答例句 '+(i+1)),controls(ctx,rows,i,()=>{if((r.kr||r.zh||r.answerZh||(r.answerVariants||[]).some(v=>v.kr))&&!confirm('刪除這組問題與所有回答？'))return;structural(ctx,()=>rows.splice(i,1))}));item.append(head);
 const q=el('div','cb-qa-question-editor');q.append(ruleColorField(ctx,r,'kr','問句・韓文','例如：얼마나 자주 운동을 해요?'),ruleColorField(ctx,r,'zh','問句・中文（選填）','例如：你多常運動？'));item.append(q);
 const answers=el('div','cb-qa-answers-editor');answers.append(el('b','','回答'));const variants=r.answerVariants||[];
 variants.forEach((v,j)=>{const row=el('section','cb-qa-variant-editor');row.dataset.answerVariantId=v.id;row.append(ruleColorField(ctx,v,'kr','回答說法 '+(j+1),'例如：일주일에 한 번 해요.'),controls(ctx,variants,j,()=>{if(str(v.kr).trim()&&!confirm('刪除這個回答說法？'))return;structural(ctx,()=>variants.splice(j,1))}));answers.append(row)});
 const add=button('＋ 新增另一種回答',()=>{const v={id:id(),kr:''};structural(ctx,()=>{r.answerVariants??=[];r.answerVariants.push(v)});ctx.list.querySelector('[data-answer-variant-id="'+v.id+'"] [contenteditable]')?.focus({preventScroll:true})});add.dataset.addAnswerVariant='1';answers.append(add,ruleColorField(ctx,r,'answerZh','回答中文（共用・選填）','例如：一個星期一次。'));item.append(answers);host.append(item);
}
function qaExampleHTML(e){const variants=(e.answerVariants||[]).filter(v=>str(v.kr).trim());return '<section class="cb-rule-example-read cb-qa-example-read">'+(str(e.kr).trim()||str(e.zh).trim()?'<div class="cb-qa-question-read"><small>問</small>'+(str(e.kr).trim()?'<p lang="ko">'+compactRuleExample(e.kr,e.krHighlights||[])+'</p>':'')+(str(e.zh).trim()?'<p class="cb-qa-zh" lang="zh-Hant">'+compactRuleExample(e.zh,e.zhHighlights||[])+'</p>':'')+'</div>':'')+(variants.length||str(e.answerZh).trim()?'<div class="cb-qa-answers-read"><small>答</small>'+variants.map(v=>'<p class="cb-qa-answer-line" lang="ko">'+compactRuleExample(v.kr,v.krHighlights||[])+'</p>').join('')+(str(e.answerZh).trim()?'<p class="cb-qa-zh" lang="zh-Hant">'+compactRuleExample(e.answerZh,e.answerZhHighlights||[])+'</p>':'')+'</div>':'')+'</section>'}
'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-qa-examples-style' in s:return
 anchor='function ruleExamplesEditor('
 assert s.count(anchor)==1;s=s.replace(anchor,HELPERS+anchor,1)
 old="rows.forEach((r,i)=>{const item=el('div','cb-rule-example-editor cb-same-meaning-example');"
 new="rows.forEach((r,i)=>{if(r.exampleFormat==='qa'){qaExampleEditor(ctx,b,r,i,rows,host);return}const item=el('div','cb-rule-example-editor cb-same-meaning-example');"
 assert s.count(old)==1;s=s.replace(old,new,1)
 old="host.append(button('＋新增例句',add));body.append(host);"
 new="""const addQA=button('＋ 新增問答例句',()=>{const r={id:id(),exampleFormat:'qa',kr:'',zh:'',answerVariants:[{id:id(),kr:''}],answerZh:''};structural(ctx,()=>{b.ruleExamples??=[];b.ruleExamples.push(r)});ctx.list.querySelector('[data-example-id="'+r.id+'"] [contenteditable]')?.focus({preventScroll:true})});addQA.dataset.addQaExample='1';host.append(button('＋新增例句',add),addQA);body.append(host);"""
 assert s.count(old)==1;s=s.replace(old,new,1)
 old="entries.map(e=>{if(!['formal','spoken'].includes(e.register))"
 new="entries.map(e=>{if(e.exampleFormat==='qa')return qaExampleHTML(e);if(!['formal','spoken'].includes(e.register))"
 assert s.count(old)==1;s=s.replace(old,new,1)
 old="filter(e=>str(e.base).trim()||str(e.kr).trim()||str(e.zh).trim()||(e.equivalents||[]).some(v=>str(v.kr).trim()))"
 new="filter(e=>str(e.base).trim()||str(e.kr).trim()||str(e.zh).trim()||str(e.answerZh).trim()||(e.answerVariants||[]).some(v=>str(v.kr).trim())||(e.equivalents||[]).some(v=>str(v.kr).trim()))"
 assert s.count(old)==1;s=s.replace(old,new,1)
 s=s.replace('(s.ruleExamples||[]).some(r=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr))','(s.ruleExamples||[]).some(r=>r.base||r.kr||r.zh||r.answerZh||(r.answerVariants||[]).some(v=>v.kr)||(r.equivalents||[]).some(v=>v.kr))',1)
 s=s.replace('if(b.ruleExamples)b.ruleExamples.forEach(r=>r.id=id());','if(b.ruleExamples)b.ruleExamples.forEach(r=>{r.id=id();for(const v of r.answerVariants||[])v.id=id()});',1)
 s=s.replace("for(const key of ['formulas','rows','ruleExamples'])for(const r of unit[key]||[])r.id=id();", "for(const key of ['formulas','rows','ruleExamples'])for(const r of unit[key]||[]){r.id=id();for(const v of r.answerVariants||[])v.id=id()}",1)
 css='''<style id="bana-qa-examples-style">
.cb-qa-head{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-bottom:6px}.cb-qa-head>.cb-order{flex-wrap:wrap}.cb-qa-question-editor{padding:7px;background:#edf3e6;border-radius:8px;margin-bottom:7px;min-width:0}.cb-qa-answers-editor{padding:7px;background:#f7f2e8;border-radius:8px;min-width:0}.cb-qa-variant-editor{min-width:0;padding:5px 0;border-bottom:1px dashed #dce3d2}.cb-qa-variant-editor .cb-order{justify-content:flex-end;flex-wrap:wrap}.cb-qa-example-editor .cb-colored-example-field{margin:4px 0}.cb-qa-example-editor [contenteditable]{min-height:34px!important}.cb-qa-answers-editor>[data-add-answer-variant]{margin:6px 0}.cb-qa-question-read,.cb-qa-answers-read{padding:6px 8px;border-radius:8px;min-width:0}.cb-qa-question-read{background:#edf3e6}.cb-qa-answers-read{background:#f7f2e8;margin-top:4px}.cb-qa-example-read small{display:block;font-size:11px;color:#829275;margin-bottom:2px}.cb-qa-example-read p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:0!important}.cb-qa-example-read .cb-qa-zh{color:#95816c;margin-top:2px!important}.cb-qa-answer-line+.cb-qa-answer-line{margin-top:3px!important}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
