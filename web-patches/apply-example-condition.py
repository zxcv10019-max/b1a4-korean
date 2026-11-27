from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-example-condition-style' in s:return
 old="grid.append(coloredField(r,'base',"
 new="grid.append(coloredField(r,'usageCondition','使用條件／補充說明（選填）','cb-example-condition'));const conditionField=grid.querySelector('[data-rule-example-key=usageCondition]');conditionField.placeholder='例如：有收尾音＋으세요／無收尾音＋세요';\n grid.append(coloredField(r,'base',"
 assert s.count(old)==1;s=s.replace(old,new,1)
 old="const filled=()=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr);"
 assert s.count(old)==1;s=s.replace(old,"const filled=()=>r.usageCondition||r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr);",1)
 start=s.index('function ruleExamplesHTML(');end=s.index('\nfunction ',start+1);part=s[start:end]
 part=part.replace("str(e.base).trim()||str(e.kr).trim()", "str(e.usageCondition).trim()||str(e.base).trim()||str(e.kr).trim()",1)
 header="(str(e.usageCondition).trim()?'<div class=\"cb-example-condition-read\">'+compactRuleExample(e.usageCondition,e.usageConditionHighlights||[])+'</div>':'')+"
 for old in ["return '<div class=\"cb-rule-example-read cb-plain-example-read\">'+", "return '<div class=\"cb-rule-example-read\">'+"]:
  assert part.count(old)==1;part=part.replace(old,old+header,1)
 s=s[:start]+part+s[end:]
 s=s.replace('</head>','<style id="bana-example-condition-style">.cb-example-condition-read{font-size:inherit;color:#688052;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 5px;font-weight:600}.cb-example-condition textarea{min-height:40px}</style>\n</head>',1)
 p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
