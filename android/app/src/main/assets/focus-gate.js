(function(){
 'use strict';
 if(!window.BanaAndroid||!BanaAndroid.focusStatus)return;
 function card(id){var box=document.createElement('section');box.id=id;box.className='bana-focus-card';
  var title=document.createElement('b');title.textContent='🌱 晚間學習 30 分鐘';
  var value=document.createElement('span');value.className='bana-focus-value';
  var note=document.createElement('small');note.textContent='18:00–24:00 · 學滿後解鎖三個 App';
  var manage=document.createElement('button');manage.type='button';manage.textContent='設定';manage.onclick=function(){BanaAndroid.openFocusSettings()};
  var text=document.createElement('div');text.append(title,value,note);box.append(text,manage);return box;
 }
 var home=document.getElementById('home'),profile=document.getElementById('profile');
 if(home)home.prepend(card('banaFocusHome'));
 if(profile)profile.prepend(card('banaFocusProfile'));
 function refresh(){if(document.hidden)return;try{var s=JSON.parse(BanaAndroid.focusStatus());document.querySelectorAll('.bana-focus-card').forEach(function(box){
   var ms=Math.max(0,Number(s.earnedMs)||0),seconds=Math.floor(ms/1000),value=box.querySelector('.bana-focus-value'),note=box.querySelector('small');
   value.textContent=s.unlocked?'♡ 今天已解鎖':String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' / 30:00';
   note.textContent=!s.enabled?'尚未啟用 · 開啟後開始累積':!s.permissionsReady?'請完成手機權限設定':!s.monitorRunning?'守護已停止 · 請重新啟用':s.monitorError?s.monitorError:s.unlocked?'今天可使用所選 App · 明天重新計時':!s.windowActive?'目前自由使用 · 18:00–24:00 才限制':'晚間限制中 · 學滿 30 分鐘解鎖';
  });}catch(e){}
 }
 refresh();setInterval(refresh,1000);document.addEventListener('visibilitychange',refresh);
})();
