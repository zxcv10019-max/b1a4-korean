from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-pattern-explanation-style' in s:return
 old="ruleExamplesEditor(ctx,b,body);const more=el('details','cb-formula-options');const count=(b.rows||[]).filter(r=>r.part||r.form||r.description||r.example||r.exampleZh).length;more.append(el('summary','','其他條件與例外（選填）'+(count?' · 已有 '+count+' 筆':'')));listEditor(ctx,b,more);body.append(more);"
 new="""const variation=ruleColorField(ctx,b,'variationNote','③ 變化說明（選填）','例如：動詞、形容詞以「하다」結尾時，「하다」變成「해요」。');variation.classList.add('cb-pattern-variation-editor');body.append(variation);ruleExamplesEditor(ctx,b,body);const count=(b.rows||[]).filter(r=>r.part||r.form||r.description||r.example||r.exampleZh).length;if(count){const more=el('details','cb-formula-options');more.append(el('summary','','已儲存的補充 · '+count+' 筆'));listEditor(ctx,b,more);body.append(more);} """
 assert s.count(old)==1,'Pattern editor integration changed';s=s.replace(old,new,1)
 s=s.replace("host.append(el('b','','③ 例句'))", "host.append(el('b','','④ 例句'))",1)
 s=s.replace("labeled('① 內容說明（選填）',field)","labeled('① 句型說明（選填）',field)",1)
 old="function ruleHasContent(s){return !!(str(s.text).trim()||"
 new="function ruleHasContent(s){return !!(str(s.text).trim()||str(s.variationNote).trim()||"
 assert old in s;s=s.replace(old,new,1)
 old="+ruleExamplesHTML(unit)+(conditions.length?"
 new="+(str(unit.variationNote).trim()?'<div class=\"cb-pattern-variation-read\">'+rich(unit.variationNote,unit.variationNoteHighlights||[])+'</div>':'')+ruleExamplesHTML(unit)+(conditions.length?"
 assert old in s;s=s.replace(old,new,1)
 css='''<style id="bana-pattern-explanation-style">
.cb-pattern-variation-editor{margin:9px 0 5px!important}.cb-pattern-variation-editor textarea{min-height:56px}.cb-pattern-variation-read{margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;color:#58704b}.cb-pattern-variation-editor [contenteditable]{min-height:45px!important}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
