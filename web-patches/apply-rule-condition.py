from pathlib import Path
import sys

HELPER=r'''function migrateRuleConditions(unit){
 if(Array.isArray(unit.contents)||!(unit.ruleExamples||[]).some(e=>str(e.usageCondition).trim()))return [unit];
 const groups=[];
 for(const source of unit.ruleExamples){const condition=str(source.usageCondition).trim()?source.usageCondition:str(unit.usageCondition),colors=str(source.usageCondition).trim()?source.usageConditionHighlights||[]:unit.usageConditionHighlights||[];let group=groups[groups.length-1];if(!group||group.usageCondition!==condition){group={...copy(unit),id:groups.length?id():unit.id,usageCondition:condition,usageConditionHighlights:copy(colors),ruleExamples:[]};groups.push(group)}const e=copy(source);delete e.usageCondition;delete e.usageConditionHighlights;group.ruleExamples.push(e)}
 return groups;
}
'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-rule-condition-style' in s:return
 start=s.index('function normalizeRuleSections(');end=s.index('\nfunction ',start+1)
 part=s[start:end];assert part.endswith('}))}')
 part=part[:-4]+'})).flatMap(migrateRuleConditions)}'
 s=s[:start]+HELPER+part+s[end:]
 old="section.contents.forEach((unit,j)=>{unit.type='rules';"
 assert s.count(old)==1;s=s.replace(old,"section.contents=section.contents.flatMap(migrateRuleConditions);section.contents.forEach((unit,j)=>{unit.type='rules';",1)
 old="use.append(useHead);"
 assert s.count(old)==1;s=s.replace(old,"use.append(useHead,ruleColorField(ctx,unit,'usageCondition','使用條件（選填）','例如：有收尾音／無收尾音，或動詞語幹＋으세요'));use.lastElementChild.classList.add('cb-rule-condition-field');use.lastElementChild.querySelector('textarea').dataset.ruleCondition='1';",1)
 old="return !!(str(s.text).trim()||str(s.variationNote).trim()"
 assert s.count(old)==1;s=s.replace(old,"return !!(str(s.usageCondition).trim()||str(s.text).trim()||str(s.variationNote).trim()",1)
 old="const units=(section.contents||[section]).filter(ruleHasContent);"
 assert s.count(old)==1;s=s.replace(old,"const units=(section.contents||[section]).flatMap(migrateRuleConditions).filter(ruleHasContent);",1)
 old="units.map(unit=>'<article class=\"cb-rule-use-read\">'+"
 assert s.count(old)==1;s=s.replace(old,old+"(str(unit.usageCondition).trim()?'<div class=\"cb-rule-condition-read\">'+rich(unit.usageCondition,unit.usageConditionHighlights||[])+'</div>':'')+",1)
 old="units.length===1&&!unit.text&&"
 assert s.count(old)==1;s=s.replace(old,"units.length===1&&!unit.text&&!str(unit.usageCondition).trim()&&",1)
 old="grid.append(coloredField(r,'usageCondition','使用條件／補充說明（選填）','cb-example-condition'));const conditionField=grid.querySelector('[data-rule-example-key=usageCondition]');conditionField.placeholder='例如：有收尾音＋으세요／無收尾音＋세요';"
 assert s.count(old)==1;s=s.replace(old,"if(str(r.usageCondition).trim())grid.append(coloredField(r,'usageCondition','原有補充說明（選填）','cb-example-condition'));",1)
 s=s.replace('</head>','<style id="bana-rule-condition-style">.cb-rule-condition-read{font-weight:600;color:#61784e;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 6px;padding:4px 0;border-bottom:1px dashed #d8e2cc}.cb-rule-condition-field{margin-top:5px}</style>\n</head>',1)
 p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
