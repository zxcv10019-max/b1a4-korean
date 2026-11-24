from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-plain-examples-style' in s:return
 old="register.onchange=()=>{r.register=register.value;changed(ctx)}"
 new="register.onchange=()=>{r.register=register.value;expanded=false;updateMode();changed(ctx)}"
 assert s.count(old)==1;s=s.replace(old,new,1)
 old="const filled=()=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr);"
 new="""let expanded=false;const retained=button('展開已填的變化資料',()=>{expanded=!expanded;updateMode()});retained.classList.add('cb-retained-variation');grid.append(retained);
 function updateMode(){const plain=!['formal','spoken'].includes(register.value),hasOld=!!(str(r.base).trim()||(r.equivalents||[]).some(v=>str(v.kr).trim()));item.classList.toggle('cb-plain-example',plain);for(const n of grid.querySelectorAll('.cb-example-base,.cb-example-equivalents,[data-add-equivalent]'))n.hidden=plain&&!expanded;retained.hidden=!plain||!hasOld;retained.textContent=expanded?'收合已填的變化資料':'展開已填的變化資料';const primary=grid.querySelector('.cb-example-primary>span'),meaning=grid.querySelector('.cb-example-shared-zh>span');if(primary)primary.textContent=plain?'韓文例句':'韓文／變化後形式';if(meaning)meaning.textContent=plain?'中文翻譯（選填）':'共用中文意思（選填）'}updateMode();
 const filled=()=>r.base||r.kr||r.zh||(r.equivalents||[]).some(v=>v.kr);"""
 assert s.count(old)==1;s=s.replace(old,new,1)
 # Plain examples render only their Korean sentence and translation. Optional transformation data stays saved.
 old="entries.map(e=>{const forms="
 new="""entries.map(e=>{if(!['formal','spoken'].includes(e.register))return '<div class="cb-rule-example-read cb-plain-example-read">'+(str(e.kr).trim()?'<div class="cb-rule-example-kr" lang="ko">'+compactRuleExample(e.kr,e.krHighlights||[])+'</div>':'')+(str(e.zh).trim()?'<div class="cb-formula-translation cb-rule-example-zh" lang="zh-Hant">'+compactRuleExample(e.zh,e.zhHighlights||[])+'</div>':'')+'</div>';const forms="""
 assert s.count(old)==1;s=s.replace(old,new,1)
 css='''<style id="bana-plain-examples-style">
.cb-same-example-fields [hidden]{display:none!important}.cb-plain-example .cb-example-shared-zh{border-top:0;padding-top:0}.cb-retained-variation{font-size:11px!important;color:#89957d!important;background:transparent!important;border:0!important;padding:2px 0!important}.cb-plain-example-read .cb-rule-example-zh{margin-top:2px!important}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
