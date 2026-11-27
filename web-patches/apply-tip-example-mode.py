from pathlib import Path
import sys

PAIR=r'''function pairHTML(p){const variation=p.exampleMode==='variation';return '<div class="fn-read-pair'+(variation?' fn-variation':'')+'">'+(variation&&p.base?'<div class="fn-base" lang="ko">'+rich(p.base,p.baseHighlights||[])+'</div>'+(p.kr?'<span class="fn-example-down" aria-label="變成">↓</span>':''):'')+(p.kr?'<div class="fn-kr" lang="ko">'+rich(p.kr,p.krHighlights||[])+'</div>':'')+(p.zh?'<div class="fn-zh" lang="zh-Hant">'+rich(p.zh,p.zhHighlights||[])+'</div>':'')+'</div>'}
'''

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-tip-example-mode-style' in s:return
 start=s.index('<script id="bana-forest-notes">');end=s.index('</script>',start);part=s[start:end]
 part=part.replace('kr:S(p.kr),zh:S(p.zh)','base:S(p.base),kr:S(p.kr),zh:S(p.zh)',1)
 part=part.replace('function html(state,',PAIR+'function html(state,',1)
 a=part.index("n.pairs.filter(p=>p.kr||p.zh).map(p=>");b=part.index(".join('')",a)
 part=part[:a]+"n.pairs.filter(p=>p.base||p.kr||p.zh).map(pairHTML)"+part[b:]
 part=part.replace('n.pairs.some(p=>p.kr||p.zh)','n.pairs.some(p=>p.base||p.kr||p.zh)')
 part=part.replace('()=>!!(pair.kr||pair.zh)','()=>!!(pair.base||pair.kr||pair.zh)',1)
 old="function display(){const open=translations.get(pair.id);"
 new="""const mode=el('select','fn-example-mode');mode.setAttribute('aria-label','例句格式 '+pair.id);mode.dataset.tipExampleMode='1';for(const [value,label]of [['plain','一般例句'],['variation','變化例句（↓）']]){const option=el('option','',label);option.value=value;mode.append(option)}mode.value=pair.exampleMode==='variation'?'variation':'plain';
 const base=input(pair.base,v=>pair.base=v,'原形／變化前 '+pair.id),baseBox=colorField('原形／變化前（選填）',base,pair,'base','baseHighlights');baseBox.classList.add('fn-example-base-field');base.dataset.tipExampleBase='1';kr.dataset.tipExampleKr='1';zh.dataset.tipExampleZh='1';const korean=colorField('韓文／公式',kr,pair,'kr','krHighlights');
 function exampleMode(){const variation=mode.value==='variation';baseBox.hidden=!variation;korean.querySelector('span').textContent=variation?'韓文／變化後形式':'韓文／公式';box.classList.toggle('fn-variation-editor',variation)}mode.onchange=()=>{pair.exampleMode=mode.value;exampleMode();change()};exampleMode();
 function display(){const open=translations.get(pair.id);"""
 assert part.count(old)==1;part=part.replace(old,new,1)
 old="grid.append(colorField('韓文／公式',kr,pair,'kr','krHighlights'),translation,toggle);box.append(head,grid);"
 new="grid.append(baseBox,korean,translation,toggle);box.append(head,field('例句格式',mode),grid);"
 assert part.count(old)==1;part=part.replace(old,new,1)
 s=s[:start]+part+s[end:]
 old='x.forestNotes?.notes?.some(n=>n.text||n.pairs?.some(p=>p.kr||p.zh))'
 assert s.count(old)==1;s=s.replace(old,'x.forestNotes?.notes?.some(n=>n.text||n.pairs?.some(p=>p.base||p.kr||p.zh))',1)
 css='''<style id="bana-tip-example-mode-style">
.fn-example-mode{width:100%;padding:7px;border:1px solid #d6e2c9;border-radius:7px;background:#fffef9;color:#5b7548;font:inherit}.fn-variation-editor .fn-pair-grid{display:flex!important;flex-direction:column;align-items:stretch;gap:5px}.fn-example-base-field[hidden]{display:none!important}.fn-example-base-field{grid-column:1/-1}#banaGrammarNoteMask .fn-read-pair.fn-variation,.fn-preview .fn-read-pair.fn-variation{display:flex!important;flex-direction:column;align-items:flex-start;gap:2px}.fn-example-down{display:block;line-height:1.1;color:#8c9c7d}.fn-base{white-space:pre-wrap;overflow-wrap:anywhere}.fn-variation .fn-zh{margin-top:2px}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
