from pathlib import Path
import sys

READER=r'''function ruleExamplesHTML(b){const entries=(b.ruleExamples||[]).filter(e=>str(e.base).trim()||str(e.kr).trim()||str(e.zh).trim()||(e.equivalents||[]).some(v=>str(v.kr).trim()));return entries.length?'<div class="cb-rule-examples-read"><small>例句</small>'+entries.map(e=>{const forms=[...(str(e.kr).trim()?[{text:e.kr,highlights:e.krHighlights||[]}]:[]),...(e.equivalents||[]).filter(v=>str(v.kr).trim()).map(v=>({text:v.kr,highlights:v.krHighlights||[]}))];const base=str(e.base).trim();return '<div class="cb-rule-example-read">'+(base||forms.length?'<div class="cb-rule-example-kr cb-example-forms cb-example-vertical" lang="ko">'+(base?'<div class="cb-example-base-read">'+compactRuleExample(e.base,e.baseHighlights||[])+'</div>'+(forms.length?'<span class="cb-example-down" aria-label="變成">↓</span>':''):'')+(forms.length?'<div class="cb-example-result">'+forms.map((v,i)=>(i?'<span class="cb-example-relation">＝</span>':'')+'<span>'+compactRuleExample(v.text,v.highlights)+'</span>').join('')+'</div>':'')+'</div>':'')+(str(e.zh).trim()?'<div class="cb-formula-translation cb-rule-example-zh" lang="zh-Hant">'+compactRuleExample(e.zh,e.zhHighlights||[])+'</div>':'')+'</div>'}).join('')+'</div>':''}'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-example-vertical-style' in s:return
 start=s.index('function ruleExamplesHTML(');end=s.index('\nfunction ',start+1);s=s[:start]+READER+s[end:]
 if 'bana-example-vertical-style' not in s:
  css='''<style id="bana-example-vertical-style">
.cb-example-forms.cb-example-vertical{display:flex;flex-direction:column;align-items:flex-start;gap:1px}.cb-example-base-read{white-space:pre-wrap;overflow-wrap:anywhere}.cb-example-down{display:block;line-height:1.1!important;color:#8c9c7d;margin:0 0 0 4px}.cb-example-result{display:flex;flex-wrap:wrap;align-items:baseline;gap:3px 6px;min-width:0}.cb-example-result>span{white-space:pre-wrap;overflow-wrap:anywhere}
</style>'''
  s=s.replace('</head>',css+'\n</head>',1)
 p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
