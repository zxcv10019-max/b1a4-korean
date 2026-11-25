from pathlib import Path
import sys

def apply(path):
    p=Path(path);s=p.read_text(encoding='utf-8')
    if 'bana-desktop-google-handoff' in s:return
    script='''<script id="bana-desktop-google-handoff">
(function(){
const q=new URLSearchParams(location.search),port=q.get('desktopAuthPort'),state=q.get('desktopAuthState');
if(!port||!/^\\d{4,5}$/.test(port)||Number(port)<1024||Number(port)>65535||!state||!/^\\w{64}$/.test(state))return;
function mount(){
  document.documentElement.classList.remove('bana-worktime-faded');
  const mask=document.createElement('section');mask.setAttribute('role','dialog');mask.setAttribute('aria-label','連接電腦版');
  mask.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#fffdf6;color:#405b3c;padding:40px 24px;font:16px sans-serif;overflow:auto';
  const title=document.createElement('h1');title.textContent='連接 BANA Forest 電腦版';
  const info=document.createElement('p');info.textContent='請使用和網站相同的 Google 帳號，讓電腦版沿用你的雲端學習資料。';
  const button=document.createElement('button');button.textContent='Google 登入並連接電腦版';button.style.cssText='padding:14px 20px;border-radius:12px;background:#eaf0df;border:1px solid #b6c79c;cursor:pointer;color:#405b3c;font-size:16px';
  const message=document.createElement('p');
  mask.append(title,info,button,message);document.body.append(mask);
  button.onclick=async()=>{
    if(typeof firebaseAuth==='undefined'||!firebaseAuth){message.textContent='雲端服務尚未載入，請稍後再試。';return;}
    button.disabled=true;message.textContent='請在 Google 視窗選擇帳號。';
    try{
      const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
      const result=await firebaseAuth.signInWithPopup(provider),credential=result.credential;
      if(!credential||(!credential.idToken&&!credential.accessToken))throw Error('Google 未回傳登入憑證，請重試。');
      const form=document.createElement('form');form.method='POST';form.action='http://127.0.0.1:'+port+'/auth';
      for(const [key,value]of Object.entries({state,idToken:credential.idToken||'',accessToken:credential.accessToken||''})){const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.append(input);}
      document.body.append(form);form.submit();
    }catch(error){message.textContent='連接未完成：'+error.message;button.disabled=false;}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
</script>'''
    p.write_bytes(s.replace('</body>',script+'\n</body>',1).encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
