from pathlib import Path
import sys

EDITOR=r'''function vocabNotesEditor(ctx,b,body){
 const section=el('section','cb-vocab-notes-editor');section.append(ruleColorField(ctx,b,'description','☆ 補充說明（選填）','例如：當數字後方是單位、量詞時，必須用括號內的說法。'));
 const examples=el('section','cb-vocab-examples-editor');examples.append(el('b','','例句'));const rows=b.vocabExamples||[];
 rows.forEach((r,i)=>{const item=el('div','cb-vocab-example-editor');item.dataset.vocabExampleId=r.id;const head=el('header','cb-vocab-example-head');head.append(el('small','','例句 '+(i+1)),controls(ctx,rows,i,()=>{if(!r.kr&&!r.zh||confirm('刪除這組例句？'))structural(ctx,()=>rows.splice(i,1))}));item.append(head,ruleColorField(ctx,r,'kr','韓文例句','例如：스무 살'),ruleColorField(ctx,r,'zh','中文翻譯（選填）','例如：20歲'));examples.append(item)});
 examples.append(button('＋ 新增例句',()=>{const example={id:id(),kr:'',zh:''};structural(ctx,()=>{b.vocabExamples??=[];b.vocabExamples.push(example)});ctx.list.querySelector('[data-vocab-example-id="'+example.id+'"] [contenteditable]')?.focus({preventScroll:true})}));section.append(examples);body.append(section);
}
'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-vocab-notes-style' in s:return
 old="if(b.type==='vocab')vocabImport(ctx,b,body);"
 new="if(b.type==='vocab'){vocabNotesEditor(ctx,b,body);vocabImport(ctx,b,body);}"
 assert s.count(old)==1;s=s.replace(old,new,1)
 anchor='function vocabImport('
 assert s.count(anchor)==1;s=s.replace(anchor,EDITOR+anchor,1)
 old="else if(b.type==='vocab')body="
 start=s.index(old);end=s.index("\n else if(b.type==='rules')",start)
 segment=s[start:end]
 assert segment.endswith(";")
 segment=segment[:-1]+"+(str(b.description).trim()?'<div class=\"cb-vocab-note\">'+(/^[☆★⭐]/.test(str(b.description).trim())?'':'☆ ')+rich(b.description,b.descriptionHighlights||[])+'</div>':'')+ruleExamplesHTML({ruleExamples:b.vocabExamples||[]});"
 s=s[:start]+segment+s[end:]
 s=s.replace("if(b.ruleExamples)b.ruleExamples.forEach(r=>r.id=id());", "if(b.ruleExamples)b.ruleExamples.forEach(r=>r.id=id());if(b.vocabExamples)b.vocabExamples.forEach(r=>r.id=id());",1)
 css='''<style id="bana-vocab-notes-style">
.cb-vocab-notes-editor{margin-top:10px;padding-top:8px;border-top:1px solid #dce4d2;min-width:0}.cb-vocab-examples-editor{margin-top:9px}.cb-vocab-example-editor{margin:7px 0;padding:7px;border:1px solid #dfe6d5;border-radius:8px;background:#f6f8f0;min-width:0}.cb-vocab-example-head{display:flex;justify-content:space-between;align-items:center;gap:5px;margin-bottom:5px}.cb-vocab-example-head .cb-order{flex-wrap:wrap}.cb-vocab-example-editor .cb-colored-example-field{margin:4px 0}.cb-vocab-example-editor [contenteditable]{min-height:34px!important}.cb-vocab-note{margin:8px 0 5px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;color:#8b8069}.cb-read-block[data-cb-type=vocab] .cb-rule-examples-read{margin-top:7px}.cb-read-block[data-cb-type=vocab] .cb-rule-example-read{margin:5px 0}.cb-read-block[data-cb-type=vocab] .cb-rule-example-zh{margin-top:2px!important}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
