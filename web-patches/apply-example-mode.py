from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-example-mode-style' in s:return
 old="register.onchange=()=>{r.register=register.value;expanded=false;updateMode();changed(ctx)};grid.append(labeled('說法類型',register));"
 new="""register.onchange=()=>{r.register=register.value;if(!r.exampleMode)mode.value=['formal','spoken'].includes(r.register)?'variation':'plain';expanded=false;updateMode();changed(ctx)};
 const mode=el('select','cb-example-register');mode.dataset.exampleMode='1';mode.setAttribute('aria-label','例句格式');for(const [value,label]of [['plain','一般例句'],['variation','變化例句（↓）']]){const option=el('option','',label);option.value=value;mode.append(option)}mode.value=['plain','variation'].includes(r.exampleMode)?r.exampleMode:['formal','spoken'].includes(r.register)?'variation':'plain';mode.onchange=()=>{r.exampleMode=mode.value;expanded=false;updateMode();changed(ctx)};grid.append(labeled('例句格式',mode),labeled('說法類型',register));"""
 assert s.count(old)==1,'Editor register anchor';s=s.replace(old,new,1)
 old="const plain=!['formal','spoken'].includes(register.value),hasOld="
 assert s.count(old)==1;s=s.replace(old,"const plain=mode.value!=='variation',hasOld=",1)
 old="if(!['formal','spoken'].includes(e.register))return '<div class=\"cb-rule-example-read cb-plain-example-read\">'+"
 new="if(e.exampleMode==='plain'||(e.exampleMode!=='variation'&&!['formal','spoken'].includes(e.register)))return '<div class=\"cb-rule-example-read cb-plain-example-read\">'+(['formal','spoken'].includes(e.register)?'<span class=\"cb-example-register-label cb-register-'+e.register+'\">'+(e.register==='formal'?'正式說法':'口語說法')+'</span>':'')+"
 assert s.count(old)==1,'Reader anchor';s=s.replace(old,new,1)
 s=s.replace('</head>','<style id="bana-example-mode-style">[data-example-mode]{min-height:32px}.cb-example-down{user-select:none}</style>\n</head>',1)
 p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
