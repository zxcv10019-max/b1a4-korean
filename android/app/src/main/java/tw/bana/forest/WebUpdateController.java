package tw.bana.forest;

import android.app.*;
import android.os.*;
import android.widget.EditText;
import android.text.InputType;
import org.json.JSONObject;
import java.io.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

final class WebUpdateController {
 interface Host {void javascript(String code);void reload();void withSnapshot(Runnable action);}
 private final Activity activity;private final Host host;private final WebUpdateStore store;
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private final AtomicBoolean busy=new AtomicBoolean();private final Handler main=new Handler(Looper.getMainLooper());
 private volatile JSONObject available;private volatile String state="idle",message="",notes="";private volatile int percent=0;
 private volatile boolean closed=false;
 private final Runnable watchdog;
 WebUpdateController(Activity a,Host h)throws Exception{activity=a;host=h;store=new WebUpdateStore(a);watchdog=()->{if(!closed&&store.unconfirmed())worker.execute(()->{try{store.rollback();publish("error","新版未能正常啟動，已恢復上一版");activity.runOnUiThread(host::reload);}catch(Exception e){error(e);}});};try{store.configureDefault();}catch(Exception e){message=e.getMessage();}if(store.staged()!=null)state="ready";}
 InputStream open(String name)throws IOException{
  if(name.startsWith("bana-updates.")||name.equals("updates-config.json")||name.equals("web-version.json"))return null;return store.open(name);
 }
 private long shellCode(){try{return activity.getPackageManager().getPackageInfo(activity.getPackageName(),0).getLongVersionCode();}catch(Exception e){return 0;}}
 synchronized String status(){try{
  JSONObject current=store.current(),out=new JSONObject();JSONObject staged=store.staged();out.put("state",state).put("message",message).put("configured",!store.source().isEmpty()).put("currentVersion",current.getString("version")).put("versionCode",current.getLong("versionCode")).put("shellVersionCode",shellCode()).put("canRollback",store.canRollback()).put("percent",percent);
  JSONObject next="latest".equals(state)?null:("ready".equals(state)||available==null?(staged!=null?staged:available):available);if(next!=null)out.put("nextVersion",next.getString("version")).put("notes",next.optString("notes","")).put("bytes",next.optLong("bytes",0));return out.toString();
 }catch(Exception e){return "{\"state\":\"error\",\"message\":\"無法讀取更新資訊\"}";}}
 private void publish(String next,String text){if(closed)return;state=next;message=text;host.javascript("window.__banaUpdateState&&window.__banaUpdateState("+status()+")");}
 private void error(Exception e){publish("error",e.getMessage()==null?"更新失敗，原有版本仍可使用":e.getMessage());}
 void check(){if(!busy.compareAndSet(false,true))return;publish("checking","正在檢查更新…");worker.execute(()->{try{
  if(store.source().isEmpty())throw new IOException("更新網址尚未設定");JSONObject m=store.check(shellCode());available=null;
  if(m.getLong("versionCode")<=store.current().getLong("versionCode")){publish("latest","目前已是最新版本");return;}
  available=m;JSONObject staged=store.staged();boolean ready=staged!=null&&staged.getLong("versionCode")==m.getLong("versionCode")&&staged.getString("sha256").equals(m.getString("sha256"));publish(ready?"ready":"available",ready?"新版已下載，可以套用":"有新版本可以下載");
 }catch(Exception e){error(e);}finally{busy.set(false);}});}
 void download(){JSONObject release=available;if(release==null||!busy.compareAndSet(false,true))return;percent=0;publish("downloading","正在下載更新…");worker.execute(()->{try{
  final int[] shown={-1};store.download(release,(done,total)->{int p=(int)(done*100/total);if(p>=shown[0]+5||p==100){shown[0]=p;percent=p;publish("downloading","正在下載更新… "+p+"%");}});publish("ready","下載完成，可以套用更新");
 }catch(Exception e){error(e);}finally{busy.set(false);}});}
 void apply(){if(!busy.compareAndSet(false,true))return;host.withSnapshot(()->worker.execute(()->{try{store.activate();publish("applying","正在套用新版…");activity.runOnUiThread(host::reload);}catch(Exception e){error(e);}finally{busy.set(false);}}));}
 void rollback(){if(busy.get())return;activity.runOnUiThread(()->new AlertDialog.Builder(activity).setTitle("恢復上一版").setMessage("只恢復 APP 介面與功能版本，筆記和學習資料會保留。要繼續嗎？").setNegativeButton("取消",null).setPositiveButton("恢復",(d,w)->{if(!busy.compareAndSet(false,true))return;host.withSnapshot(()->worker.execute(()->{try{store.rollback();publish("idle","已恢復上一版");activity.runOnUiThread(host::reload);}catch(Exception e){error(e);}finally{busy.set(false);}}));}).show());}
 void configure(){if(busy.get())return;activity.runOnUiThread(()->{
  EditText input=new EditText(activity);input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);input.setSingleLine();input.setHint("https://你的網站/updates/latest.json");input.setText(store.source());
  AlertDialog dialog=new AlertDialog.Builder(activity).setTitle("設定更新來源").setMessage("填入你自己的固定更新清單網址。設定後，日後可直接在 APP 內更新。").setView(input).setNegativeButton("取消",null).setPositiveButton("儲存",null).create();
  dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{try{if(busy.get())return;store.configure(input.getText().toString());available=null;publish("idle","更新來源已儲存");dialog.dismiss();}catch(Exception e){input.setError(e.getMessage());}}));dialog.show();
 });}
 void pageFinished(String url){if(closed||!"https://appassets.androidplatform.net/assets/index.html".equals(url))return;
  host.javascript("(function(){if(document.getElementById('bana-native-update-script')){window.banaMountUpdates&&window.banaMountUpdates();return;}var s=document.createElement('script');s.id='bana-native-update-script';s.src='/assets/bana-updates.js';document.body.appendChild(s);})()");
  main.removeCallbacks(watchdog);if(store.unconfirmed())main.postDelayed(watchdog,20000);
 }
 void ready(long code){if(closed)return;worker.execute(()->{try{store.confirm(code);main.removeCallbacks(watchdog);if("applying".equals(state))publish("idle","更新完成");}catch(Exception e){error(e);}});}
 void close(){closed=true;main.removeCallbacksAndMessages(null);worker.shutdown();}
}
