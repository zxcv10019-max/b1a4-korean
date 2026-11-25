from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-qa-answer-register-style' in s:return
 old="row.dataset.answerVariantId=v.id;row.append(ruleColorField(ctx,v,'kr','回答說法 '+(j+1)"
 new="""row.dataset.answerVariantId=v.id;const register=el('select','cb-example-register');register.setAttribute('aria-label','回答說法類型 '+(j+1));register.dataset.qaAnswerRegister='1';for(const [value,label]of [['','不標註'],['formal','正式說法'],['spoken','口語說法']]){const option=el('option','',label);option.value=value;register.append(option)}register.value=['formal','spoken'].includes(v.register)?v.register:'';register.onchange=()=>{v.register=register.value;changed(ctx)};row.append(labeled('回答類型',register));row.append(ruleColorField(ctx,v,'kr','回答說法 '+(j+1)"""
 assert s.count(old)==1,'QA editor changed';s=s.replace(old,new,1)
 old="variants.map(v=>'<p class=\"cb-qa-answer-line\" lang=\"ko\">'+compactRuleExample(v.kr,v.krHighlights||[])+'</p>').join('')"
 new="variants.map(v=>'<div class=\"cb-qa-answer-item\">'+(['formal','spoken'].includes(v.register)?'<span class=\"cb-example-register-label cb-register-'+v.register+'\">'+(v.register==='formal'?'正式說法':'口語說法')+'</span>':'')+'<p class=\"cb-qa-answer-line\" lang=\"ko\">'+compactRuleExample(v.kr,v.krHighlights||[])+'</p></div>').join('')"
 assert s.count(old)==1,'QA reader changed';s=s.replace(old,new,1)
 css='''<style id="bana-qa-answer-register-style">
.cb-qa-answer-item+.cb-qa-answer-item{margin-top:6px}.cb-qa-answer-item .cb-example-register-label{margin-bottom:2px!important}.cb-qa-variant-editor>label:first-child{margin:0 0 5px}.cb-qa-variant-editor .cb-example-register{max-width:220px}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
