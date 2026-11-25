from pathlib import Path
import sys

def apply(path):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if 'bana-worktime-fade-script' in s:
        return
    css = '''<style id="bana-worktime-fade-style">
html.bana-worktime-faded{background:#fff!important}
html.bana-worktime-faded body{opacity:.2!important}
</style>'''
    js = '''<script id="bana-worktime-fade-script">
(function(){
  'use strict';
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  function isWorkTime(date){
    const parts=Object.fromEntries(clock.formatToParts(date).map(p=>[p.type,p.value]));
    const minutes=Number(parts.hour)*60+Number(parts.minute);
    return ['Mon','Tue','Wed','Thu','Fri'].includes(parts.weekday)&&minutes>=510&&minutes<1080;
  }
  function isNative(){return location.hostname==='appassets.androidplatform.net'||typeof window.BanaAndroid!=='undefined';}
  function refresh(date){
    const active=!isNative()&&isWorkTime(date||new Date());
    document.documentElement.classList.toggle('bana-worktime-faded',active);
    return active;
  }
  window.banaWorktimeFade=Object.freeze({isWorkTime,refresh});
  refresh();
  setInterval(()=>refresh(),1000);
  document.addEventListener('visibilitychange',()=>refresh());
  window.addEventListener('pageshow',()=>refresh());
  window.addEventListener('focus',()=>refresh());
})();
</script>'''
    s = s.replace('</head>', css+'\n'+js+'\n</head>', 1)
    p.write_bytes(s.encode('utf-8'))

if __name__ == '__main__':
    apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
