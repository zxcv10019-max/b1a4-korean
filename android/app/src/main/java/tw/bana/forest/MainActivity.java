package tw.bana.forest;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.speech.tts.*;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final int FILE_PICK=10,EXPORT_FILE=11,GOOGLE_CONFIG_FILE=12;
 private WebView web; private TextToSpeech tts; private boolean ttsReady=false,ttsAvailable=false;
 private ValueCallback<Uri[]> fileCallback; private String pendingExport; private String pendingExportKind;
 private final ExecutorService io=Executors.newSingleThreadExecutor();
 private String snapshot="{}"; private final Object stateLock=new Object();
 private FrameLayout root; private TextView loading;
 private WebUpdateController updates;
 private String bundledGoogleClient="";
 private final DeviceFontAssets deviceFonts=new DeviceFontAssets();
 private final Handler focusHandler=new Handler(Looper.getMainLooper());
 private boolean focusResumed=false;
 private final Runnable focusTick=new Runnable(){public void run(){updateFocusTime();if(focusResumed)focusHandler.postDelayed(this,1000);}};
 private void updateFocusTime(){PowerManager power=getSystemService(PowerManager.class);KeyguardManager lock=getSystemService(KeyguardManager.class);FocusStore.pulse(this,focusResumed&&hasWindowFocus()&&power.isInteractive()&&!lock.isKeyguardLocked());}
 @Override protected void onResume(){super.onResume();focusResumed=true;focusHandler.removeCallbacks(focusTick);focusHandler.post(focusTick);if(FocusStore.enabled(this))FocusStore.start(this);}
 @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);updateFocusTime();}
 private boolean googleBusy=false; private CancellationSignal googleCancellation;
 @Override public void onCreate(Bundle saved){super.onCreate(saved);loadBundledGoogleConfig();
  try{updates=new WebUpdateController(this,new WebUpdateController.Host(){
   public void javascript(String code){js(code);}
   public void reload(){runOnUiThread(()->{if(web!=null){loading.setVisibility(View.VISIBLE);web.loadUrl(ORIGIN+"/assets/index.html");}});}
   public void withSnapshot(Runnable action){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.dispatchEvent(new Event('beforeunload'));window.banaFlushLocalState&&window.banaFlushLocalState();true",result->io.execute(action));});}
  });}catch(Exception e){toast("更新模組未能啟動，仍可使用內建版本");}
  try { File file=new File(getFilesDir(),"local-state.json"); if(file.exists())snapshot=new String(new AtomicFile(file).readFully(),java.nio.charset.StandardCharsets.UTF_8); } catch(Exception ignored){}
  root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(255,254,249));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,insets)->{android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.displayCutout()|android.view.WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;});
  if(Build.VERSION.SDK_INT<30)root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
  web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setMediaPlaybackRequiresUserGesture(true);settings.setTextZoom(100);settings.setSupportMultipleWindows(false);
  web.setBackgroundColor(Color.rgb(255,254,249));web.addJavascriptInterface(new Bridge(),"BanaAndroid");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){Uri u=r.getUrl();if("appassets.androidplatform.net".equals(u.getHost())){
    String path=u.getPath();if(path==null||!path.startsWith("/assets/")||path.contains(".."))return response(404,"Not found");
    try {String name=path.substring(8);if(name.startsWith("_devicefont/")){WebResourceResponse font=deviceFonts.get(name);return font!=null?font:response(404,"Not found");}String mime=name.endsWith(".html")?"text/html":name.endsWith(".js")?"application/javascript":name.endsWith(".css")?"text/css":name.endsWith(".png")?"image/png":"application/octet-stream";InputStream updated=updates==null?null:updates.open(name);Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,updated==null?getAssets().open(name):updated);}catch(IOException e){return response(404,"Not found");}}
    return null;
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(ORIGIN.equals(u.getScheme()+"://"+u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/assets/"))return false;
    if(r.isForMainFrame()&&("https".equals(u.getScheme())||"mailto".equals(u.getScheme()))){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){toast("找不到可開啟連結的應用程式");}}return true;}
   @Override public void onPageFinished(WebView v,String url){loading.setVisibility(View.GONE);if(updates!=null)updates.pageFinished(url);}
   @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame()){loading.setText("開啟失敗，請重新啟動 App。");loading.setVisibility(View.VISIBLE);}}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onJsAlert(WebView v,String u,String text,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(text).setPositiveButton("好",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsConfirm(WebView v,String u,String text,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(text).setPositiveButton("確定",(d,w)->result.confirm()).setNegativeButton("取消",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsPrompt(WebView v,String u,String text,String value,JsPromptResult result){EditText input=new EditText(MainActivity.this);input.setText(value);input.setSingleLine(false);new AlertDialog.Builder(MainActivity.this).setMessage(text).setView(input).setPositiveButton("確定",(d,w)->result.confirm(input.getText().toString())).setNegativeButton("取消",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=cb;Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");if(params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE)intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);try{startActivityForResult(intent,FILE_PICK);}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;toast("無法開啟檔案選擇器");}return true;}
  });
  loading=new TextView(this);loading.setText("🌱 BANA Forest\n正在打開你的學習森林…");loading.setGravity(Gravity.CENTER);loading.setTextSize(18);loading.setTextColor(Color.rgb(73,106,60));loading.setBackgroundColor(Color.rgb(255,254,249));root.addView(loading,new FrameLayout.LayoutParams(-1,-1));
  tts=new TextToSpeech(this,status->{ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady){int available=tts.setLanguage(Locale.KOREAN);ttsAvailable=available!=TextToSpeech.LANG_MISSING_DATA&&available!=TextToSpeech.LANG_NOT_SUPPORTED;}});
  tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){public void onStart(String id){}public void onDone(String id){speechResult(id,false);}public void onError(String id){speechResult(id,true);}});
  android.graphics.Paint nativeFontPaint=new android.graphics.Paint(new TextView(this).getPaint());
  io.execute(()->{deviceFonts.prepare(nativeFontPaint);runOnUiThread(()->{if(web!=null)web.loadUrl(ORIGIN+"/assets/index.html");});});
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->handleBack());
 }
 private WebResourceResponse response(int code,String message){return new WebResourceResponse("text/plain","UTF-8",code,message,new HashMap<>(),new ByteArrayInputStream(new byte[0]));}
 private void js(String code){runOnUiThread(()->{if(web!=null)web.evaluateJavascript(code,null);});}
 private void speechResult(String id,boolean error){js("window.__banaSpeechDone&&window.__banaSpeechDone("+JSONObject.quote(id)+","+error+")");}
 private void toast(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
 private void saveSnapshot(String value){if(value==null||value.length()>16000000)return;try{new JSONObject(value);}catch(Exception e){return;}synchronized(stateLock){snapshot=value;}io.execute(()->{AtomicFile file=new AtomicFile(new File(getFilesDir(),"local-state.json"));FileOutputStream stream=null;try{stream=file.startWrite();stream.write(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));file.finishWrite(stream);}catch(Exception e){if(stream!=null)file.failWrite(stream);toast("本機備援儲存失敗，請先匯出備份檔");}});}
 public class Bridge {
  @JavascriptInterface public String webUpdateStatus(){return updates==null?"{\"state\":\"error\",\"message\":\"更新模組尚未就緒\"}":updates.status();}
  @JavascriptInterface public void checkWebUpdate(){if(updates!=null)updates.check();}
  @JavascriptInterface public void downloadWebUpdate(){if(updates!=null)updates.download();}
  @JavascriptInterface public void applyWebUpdate(){if(updates!=null)updates.apply();}
  @JavascriptInterface public void rollbackWebUpdate(){if(updates!=null)updates.rollback();}
  @JavascriptInterface public void configureWebUpdates(){if(updates!=null)updates.configure();}
  @JavascriptInterface public void webUpdateReady(long code){if(updates!=null)updates.ready(code);}
  @JavascriptInterface public String focusStatus(){return FocusStore.status(MainActivity.this);}
  @JavascriptInterface public void openFocusSettings(){runOnUiThread(()->startActivity(new Intent(MainActivity.this,FocusSettingsActivity.class)));}
  @JavascriptInterface public String googleConfig(){return configStatus();}
  @JavascriptInterface public void importGoogleConfig(){runOnUiThread(()->{new AlertDialog.Builder(MainActivity.this).setTitle("設定 Google 連動").setMessage("請在原本的 Firebase 專案登記 Android App，再選擇下載的 google-services.json。\n\n套件：tw.bana.forest\nSHA-1：E8:9D:09:1F:54:D0:4F:EB:27:4D:65:39:19:F1:A1:2A:1B:CD:7A:C0\n\n不需要服務帳戶私鑰。設定前，本機資料會保留。").setPositiveButton("選擇設定檔",(d,w)->{Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");try{startActivityForResult(intent,GOOGLE_CONFIG_FILE);}catch(Exception e){toast("無法開啟設定檔選擇器");}}).setNegativeButton("稍後",null).show();});}
  @JavascriptInterface public void signInGoogle(){runOnUiThread(()->startGoogleSignIn());}
  @JavascriptInterface public String readLocalState(){synchronized(stateLock){return snapshot;}}
  @JavascriptInterface public void saveLocalState(String value){saveSnapshot(value);}
  @JavascriptInterface public void speak(String text,float rate,String id){runOnUiThread(()->{if(!ttsReady||!ttsAvailable){toast("請先在手機的文字轉語音設定中下載韓文語音");speechResult(id,true);return;}tts.setLanguage(Locale.KOREAN);tts.setSpeechRate(Math.max(.3f,Math.min(1.5f,rate)));int result=tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,id);if(result==TextToSpeech.ERROR)speechResult(id,true);});}
  @JavascriptInterface public void stopSpeech(){runOnUiThread(()->{if(tts!=null)tts.stop();});}
  @JavascriptInterface public void saveFile(String name,String mime,String data,String kind){if(data==null||data.length()>32000000){toast("檔案過大，請分批匯出");return;}runOnUiThread(()->{if(pendingExport!=null){toast("請先完成目前的匯出");return;}pendingExport=data;pendingExportKind=kind;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime==null?"application/octet-stream":mime).putExtra(Intent.EXTRA_TITLE,name.replaceAll("[/\\\\]","_"));try{startActivityForResult(intent,EXPORT_FILE);}catch(Exception e){pendingExport=null;pendingExportKind=null;toast("無法開啟儲存視窗");}});}
 }
 private void loadBundledGoogleConfig(){try(InputStream in=getAssets().open("bana-google-config.json")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[2048];int read;while((read=in.read(buffer))!=-1){out.write(buffer,0,read);if(out.size()>16384)return;}JSONObject config=new JSONObject(out.toString("UTF-8"));if(!"b1a4-cc0af".equals(config.optString("projectId"))||!getPackageName().equals(config.optString("packageName"))||!"e89d091f54d04feb274d653919f1a12a1bcd7ac0".equals(config.optString("sha1")))return;String client=config.optString("webClientId","");if(client.matches("[0-9]+-[A-Za-z0-9_-]+\\.apps\\.googleusercontent\\.com"))bundledGoogleClient=client;}catch(Exception ignored){}}
 private String configStatus(){try{JSONObject out=new JSONObject();String client=getSharedPreferences("google-config",MODE_PRIVATE).getString("web-client",bundledGoogleClient);out.put("ready",!client.isEmpty());out.put("projectId","b1a4-cc0af");return out.toString();}catch(Exception e){return "{\"ready\":false}";}}
 private void importGoogleConfig(Uri uri){io.execute(()->{try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException();ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buf=new byte[4096];int n;while((n=in.read(buf))!=-1){bytes.write(buf,0,n);if(bytes.size()>1048576)throw new IOException("設定檔過大");}JSONObject config=new JSONObject(bytes.toString("UTF-8"));if(!"b1a4-cc0af".equals(config.getJSONObject("project_info").getString("project_id")))throw new IOException("這不是 BANA Forest 使用的 Firebase 專案");JSONArray clients=config.getJSONArray("client");String webClient="";boolean matched=false,androidRegistered=false;for(int i=0;i<clients.length();i++){JSONObject client=clients.getJSONObject(i);if(!getPackageName().equals(client.getJSONObject("client_info").getJSONObject("android_client_info").getString("package_name")))continue;matched=true;JSONArray oauth=client.optJSONArray("oauth_client");if(oauth==null)continue;for(int j=0;j<oauth.length();j++){JSONObject entry=oauth.getJSONObject(j);if(entry.optInt("client_type")==3)webClient=entry.optString("client_id","");if(entry.optInt("client_type")==1){JSONObject android=entry.optJSONObject("android_info");if(android!=null&&getPackageName().equals(android.optString("package_name"))&&"e89d091f54d04feb274d653919f1a12a1bcd7ac0".equalsIgnoreCase(android.optString("certificate_hash").replace(":","")))androidRegistered=true;}}}if(!matched)throw new IOException("設定檔找不到 tw.bana.forest，請新增正確的 Android App");if(!androidRegistered)throw new IOException("請先在 Firebase 登記此 APK 的 SHA-1，再重新下載設定檔");if(!webClient.matches("[0-9]+-[A-Za-z0-9_-]+\\.apps\\.googleusercontent\\.com"))throw new IOException("設定檔缺少 Web OAuth client，請確認原專案已啟用 Google 登入");getSharedPreferences("google-config",MODE_PRIVATE).edit().putString("web-client",webClient).apply();js("window.__banaGoogleConfig&&window.__banaGoogleConfig("+configStatus()+")");toast("Google 設定已儲存，可以登入同一帳號連動");}catch(Exception e){String msg=e.getMessage();js("window.__banaGoogleConfig&&window.__banaGoogleConfig({ready:false,error:"+JSONObject.quote(msg==null?"無法讀取設定檔":msg)+"})");}});}
 private void googleResult(String token,String error){googleBusy=false;js("window.__banaGoogleResult&&window.__banaGoogleResult("+(token==null?"null":JSONObject.quote(token))+","+(error==null?"null":JSONObject.quote(error))+")");}
 @android.annotation.TargetApi(34) private void startGoogleSignIn(){
  if(googleBusy)return;if(Build.VERSION.SDK_INT<34){googleResult(null,"此 Google 登入入口需要 Android 14 以上；本機學習功能仍可使用。");return;}String client=getSharedPreferences("google-config",MODE_PRIVATE).getString("web-client",bundledGoogleClient);if(client.isEmpty()){googleResult(null,"請先匯入 Google 設定檔。");return;}
  try{googleBusy=true;String prefix="com.google.android.libraries.identity.googleid.";Bundle data=new Bundle();data.putString(prefix+"BUNDLE_KEY_SERVER_CLIENT_ID",client);data.putBoolean(prefix+"BUNDLE_KEY_FILTER_BY_AUTHORIZED_ACCOUNTS",false);data.putBoolean(prefix+"BUNDLE_KEY_AUTO_SELECT_ENABLED",false);data.putBoolean(prefix+"BUNDLE_KEY_REQUEST_VERIFIED_PHONE_NUMBER",false);data.putString(prefix+"BUNDLE_KEY_NONCE",java.util.UUID.randomUUID().toString());
   android.credentials.CredentialOption option=new android.credentials.CredentialOption.Builder(prefix+"TYPE_GOOGLE_ID_TOKEN_CREDENTIAL",data,new Bundle(data)).setIsSystemProviderRequired(true).build();
   android.credentials.GetCredentialRequest request=new android.credentials.GetCredentialRequest.Builder(Bundle.EMPTY).addCredentialOption(option).build();googleCancellation=new CancellationSignal();android.credentials.CredentialManager manager=getSystemService(android.credentials.CredentialManager.class);if(manager==null)throw new IllegalStateException();manager.getCredential(this,request,googleCancellation,getMainExecutor(),new OutcomeReceiver<android.credentials.GetCredentialResponse,android.credentials.GetCredentialException>(){
    @Override public void onResult(android.credentials.GetCredentialResponse result){android.credentials.Credential credential=result.getCredential();String type=credential.getType(),token=credential.getData().getString("com.google.android.libraries.identity.googleid.BUNDLE_KEY_ID_TOKEN");if(!"com.google.android.libraries.identity.googleid.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL".equals(type)||token==null||token.isEmpty()){googleResult(null,"Google 回傳的登入資料格式不完整。");return;}googleResult(token,null);}
    @Override public void onError(android.credentials.GetCredentialException e){String type=e.getType();googleResult(null,type.contains("USER_CANCELED")?"已取消登入，本機資料保留。":"無法取得 Google 登入。請確認手機的 Google 密碼管理工具已啟用，且 Firebase 的套件與 SHA-1 已登記。");}
   });
  }catch(Exception e){googleResult(null,"無法啟動 Google 登入，請檢查 Android／Google Play 系統更新及 App 設定。");}
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==FILE_PICK&&fileCallback!=null){Uri[] uris=null;if(result==RESULT_OK&&data!=null){if(data.getClipData()!=null){ClipData clip=data.getClipData();uris=new Uri[clip.getItemCount()];for(int i=0;i<uris.length;i++)uris[i]=clip.getItemAt(i).getUri();}else if(data.getData()!=null)uris=new Uri[]{data.getData()};}fileCallback.onReceiveValue(uris);fileCallback=null;}
  if(request==GOOGLE_CONFIG_FILE&&result==RESULT_OK&&data!=null&&data.getData()!=null)importGoogleConfig(data.getData());
  if(request==EXPORT_FILE){String text=pendingExport,kind=pendingExportKind;pendingExport=null;pendingExportKind=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&text!=null){Uri dest=data.getData();io.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(dest)){if(out==null)throw new IOException();out.write(android.util.Base64.decode(text,android.util.Base64.DEFAULT));js("window.__banaExportDone&&window.__banaExportDone("+JSONObject.quote(kind==null?"":kind)+")");toast("檔案已儲存");}catch(Exception e){toast("檔案未儲存，請重新匯出");}});}}
 }
 private void handleBack(){web.evaluateJavascript("window.banaAndroidBack?window.banaAndroidBack():false",result->{if(!"true".equals(result)){new AlertDialog.Builder(this).setMessage("離開 BANA Forest？已儲存的資料會保留。").setPositiveButton("離開",(d,w)->finish()).setNegativeButton("繼續學習",null).show();}});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onPause(){focusResumed=false;updateFocusTime();focusHandler.removeCallbacks(focusTick);if(web!=null)web.evaluateJavascript("window.banaFlushLocalState&&window.banaFlushLocalState();window.speechSynthesis&&window.speechSynthesis.cancel()",null);if(tts!=null)tts.stop();super.onPause();}
 @Override protected void onDestroy(){focusHandler.removeCallbacksAndMessages(null);if(googleCancellation!=null)googleCancellation.cancel();if(fileCallback!=null)fileCallback.onReceiveValue(null);if(tts!=null){tts.stop();tts.shutdown();}if(web!=null){web.removeJavascriptInterface("BanaAndroid");web.destroy();web=null;}if(updates!=null)updates.close();io.shutdown();super.onDestroy();}
}
