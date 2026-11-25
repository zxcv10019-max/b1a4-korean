(function(){
if(!window.banaDesktop||!window.banaDesktop.login)return;
let pending=false;
function install(){
  loginWithGoogle=async function(){
    if(pending)return;
    if(typeof firebaseAuth==='undefined'||!firebaseAuth){alert('雲端服務尚未載入，請確認網路後重試。');return;}
    pending=true;
    try{
      const status=document.getElementById('banaSyncText');if(status)status.textContent='請在瀏覽器完成 Google 登入，再回到電腦版。';
      const credential=await window.banaDesktop.login();
      await firebaseAuth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(credential.idToken||null,credential.accessToken||null));
    }catch(error){alert('Google 登入未完成：'+error.message);}finally{pending=false;}
  };
}
if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();
