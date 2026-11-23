from pathlib import Path
import sys

def apply(path):
 p=Path(path);s=p.read_text(encoding='utf-8')
 if 'bana-example-register-style' in s:return
 old="const grid=el('div','cb-same-example-fields');"
 new="""const grid=el('div','cb-same-example-fields');const register=el('select','cb-example-register');register.setAttribute('aria-label','例句說法類型');register.dataset.exampleRegister='1';for(const [value,label]of [['','不標註'],['formal','正式說法'],['spoken','口語說法']]){const option=el('option','',label);option.value=value;register.append(option)}register.value=['formal','spoken'].includes(r.register)?r.register:'';register.onchange=()=>{r.register=register.value;changed(ctx)};grid.append(labeled('說法類型',register));"""
 assert s.count(old)==1,'Example editor changed';s=s.replace(old,new,1)
 old="return '<div class=\"cb-rule-example-read\">'+(base||forms.length?"
 new="return '<div class=\"cb-rule-example-read\">'+(['formal','spoken'].includes(e.register)?'<span class=\"cb-example-register-label cb-register-'+e.register+'\">'+(e.register==='formal'?'正式說法':'口語說法')+'</span>':'')+(base||forms.length?"
 assert s.count(old)==1,'Example reader changed';s=s.replace(old,new,1)
 css='''<style id="bana-example-register-style">
.cb-example-register{width:100%;box-sizing:border-box;border:1px solid #d6e2c9;border-radius:7px;background:#fffef9;color:#5b7548;padding:6px;font:inherit}.cb-example-register-label{display:inline-block!important;align-self:flex-start;margin:0 0 4px!important;padding:1px 7px!important;border-radius:7px;font-size:11px!important;line-height:1.6!important;background:#e7efdc;color:#61774d}.cb-example-register-label.cb-register-spoken{background:#f4ecde;color:#917653}
</style>'''
 s=s.replace('</head>',css+'\n</head>',1);p.write_bytes(s.encode('utf-8'))
if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
