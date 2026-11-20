package tw.bana.forest;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

/** Offline web releases only. The WebView origin and all user storage stay unchanged. */
final class WebUpdateStore {
 static final long MAX_DOWNLOAD=64L*1024*1024,MAX_EXPANDED=120L*1024*1024;
 static final int MAX_FILES=2048;
 private final Context context;
 private final SharedPreferences prefs;
 private final File root;
 private final JSONObject bundled;
 private volatile File active;
 WebUpdateStore(Context c) throws Exception {
  context=c;root=new File(c.getFilesDir(),"web-updates");
  if(!root.isDirectory()&&!root.mkdirs())throw new IOException("無法建立更新目錄");
  prefs=c.getSharedPreferences("web-updates-v1",Context.MODE_PRIVATE);
  try(InputStream in=c.getAssets().open("web-version.json")){bundled=new JSONObject(new String(readLimited(in,16384),StandardCharsets.UTF_8));}
  recover();
 }
 private File release(String name) throws IOException {
  if(name==null||!name.matches("release-[0-9]+-[a-f0-9]{12}"))throw new IOException("更新版本路徑不正確");
  File dir=new File(root,name).getCanonicalFile();if(!dir.getParentFile().equals(root.getCanonicalFile()))throw new IOException("更新路徑不正確");return dir;
 }
 private JSONObject metadata(File dir)throws Exception {return new JSONObject(new String(readLimited(new FileInputStream(new File(dir,"release.json")),65536),StandardCharsets.UTF_8));}
 synchronized void recover() throws Exception {
  String name=prefs.getString("active","");
  if(prefs.getBoolean("unconfirmed",false)){
   long failed=0;try{failed=metadata(release(name)).getLong("versionCode");}catch(Exception ignored){}
   name=prefs.getString("previous","");
   if(!prefs.edit().putString("active",name).putString("previous","").putBoolean("unconfirmed",false).putLong("failedCode",failed).commit())throw new IOException("無法恢復上一版");
  }
  active=null;
  if(!name.isEmpty())try{File dir=release(name);if(new File(dir,"index.html").isFile()&&metadata(dir).getLong("versionCode")>=bundled.getLong("versionCode"))active=dir;}catch(Exception ignored){}
 }
 synchronized JSONObject current()throws Exception{return active==null?new JSONObject(bundled.toString()):metadata(active);}
 synchronized boolean unconfirmed(){return prefs.getBoolean("unconfirmed",false);}
 synchronized boolean canRollback(){return active!=null;}
 synchronized void confirm(long code)throws Exception{
  if(current().getLong("versionCode")!=code)return;
  if(!prefs.edit().putBoolean("unconfirmed",false).commit())throw new IOException("無法確認更新");
  // Keep the running release, its rollback target and any staged release; bound long-term disk use.
  Set<String> keep=new HashSet<>(Arrays.asList(prefs.getString("active",""),prefs.getString("previous",""),prefs.getString("staged","")));
  File[] dirs=root.listFiles();if(dirs!=null)for(File dir:dirs)if(dir.getName().matches("release-[0-9]+-[a-f0-9]{12}")&&!keep.contains(dir.getName()))try{removeTree(dir);}catch(IOException ignored){}
 }
 InputStream open(String name)throws IOException{
  File base=active;if(base==null)return null;
  File target=safeChild(base,name);return target.isFile()?new FileInputStream(target):null;
 }
 static File safeChild(File base,String name)throws IOException{
  if(name==null||name.isEmpty()||name.startsWith("/")||name.contains("\\")||name.contains(":")||name.indexOf('\0')>=0)throw new IOException("更新檔路徑不正確");
  for(String part:name.split("/",-1))if(part.equals("..")||part.equals(".")||part.isEmpty())throw new IOException("更新檔路徑不正確");
  File result=new File(base,name).getCanonicalFile();if(!result.getPath().startsWith(base.getCanonicalPath()+File.separator))throw new IOException("更新檔超出允許目錄");return result;
 }
 String source(){return prefs.getString("manifestUrl","");}
 void configure(String value)throws Exception{
  URL url=validateSource(value);if(!prefs.edit().putString("manifestUrl",url.toExternalForm()).remove("staged").commit())throw new IOException("無法儲存更新來源");
 }
 static URL validateSource(String value)throws Exception{
  URL u=new URL(value.trim());if(!"https".equals(u.getProtocol())||u.getHost().isEmpty()||u.getUserInfo()!=null||u.getRef()!=null||u.getQuery()!=null||!u.getPath().toLowerCase(Locale.ROOT).endsWith(".json"))throw new IOException("請填寫 HTTPS 更新清單網址（.json）");return u;
 }
 void configureDefault()throws Exception{
  if(!source().isEmpty())return;
  try(InputStream in=context.getAssets().open("updates-config.json")){String url=new JSONObject(new String(readLimited(in,16384),StandardCharsets.UTF_8)).optString("manifestUrl","");if(!url.isEmpty())configure(url);}
 }
 private HttpURLConnection connect(URL url)throws Exception{
  if(!"https".equals(url.getProtocol()))throw new IOException("更新必須使用 HTTPS");
  HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setUseCaches(false);c.setInstanceFollowRedirects(false);c.setRequestProperty("Cache-Control","no-cache");
  int status=c.getResponseCode();if(status!=200){c.disconnect();throw new IOException(status>=300&&status<400?"更新網址發生轉址，請使用檔案的固定網址":"更新伺服器回應 "+status);}return c;
 }
 JSONObject check(long shellCode)throws Exception{
  URL source=validateSource(source());HttpURLConnection c=connect(source);JSONObject m;
  try{m=new JSONObject(new String(readLimited(c.getInputStream(),65536),StandardCharsets.UTF_8));}finally{c.disconnect();}
  if(m.optInt("schema",0)!=1||m.optLong("versionCode",0)<1||m.optString("version","").isEmpty()||m.optString("version","").length()>80||!m.optString("sha256","").matches("[a-f0-9]{64}")||m.optLong("bytes",0)<1||m.optLong("bytes",0)>MAX_DOWNLOAD)throw new IOException("更新清單格式不正確");
  URL bundle=new URL(source,m.getString("bundleUrl"));if(!"https".equals(bundle.getProtocol())||!source.getHost().equalsIgnoreCase(bundle.getHost())||source.getPort()!=bundle.getPort()||bundle.getUserInfo()!=null||bundle.getRef()!=null)throw new IOException("更新檔必須和清單使用相同的 HTTPS 網站");
  m.put("bundleUrl",bundle.toExternalForm());
  if(m.optLong("minShellVersion",Long.MAX_VALUE)>shellCode)throw new IOException("這次更新需要新版 APK，請先更新 APP 主程式");
  if(m.getLong("versionCode")==prefs.getLong("failedCode",-1))throw new IOException("這個版本先前啟動失敗，請等待修正版");
  return m;
 }
 interface Progress{void downloaded(long done,long total);}
 synchronized JSONObject staged()throws Exception{
  String name=prefs.getString("staged","");if(name.isEmpty())return null;try{return metadata(release(name));}catch(Exception e){prefs.edit().remove("staged").commit();return null;}
 }
 void download(JSONObject m,Progress progress)throws Exception{
  if(m.getLong("versionCode")<=current().getLong("versionCode"))throw new IOException("目前已是最新版本");
  File zip=File.createTempFile("bundle-",".zip",root),temporary=null;
  try{
   HttpURLConnection c=connect(new URL(m.getString("bundleUrl")));MessageDigest digest=MessageDigest.getInstance("SHA-256");long total=0,expected=m.getLong("bytes");
   try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(zip)){byte[] buffer=new byte[32768];int n;while((n=in.read(buffer))!=-1){total+=n;if(total>expected||total>MAX_DOWNLOAD)throw new IOException("更新檔超出預期大小");out.write(buffer,0,n);digest.update(buffer,0,n);progress.downloaded(total,expected);}out.getFD().sync();}finally{c.disconnect();}
   if(total!=expected||!hex(digest.digest()).equals(m.getString("sha256")))throw new IOException("更新檔校驗失敗，請重新下載");
   String name="release-"+m.getLong("versionCode")+"-"+m.getString("sha256").substring(0,12);File target=release(name);
   if(target.exists()){
    if(active!=null&&active.equals(target))throw new IOException("此版本正在使用");
    JSONObject old=metadata(target);if(!old.getString("sha256").equals(m.getString("sha256")))throw new IOException("版本目錄不一致");
   }else{
    temporary=new File(root,"staging-"+UUID.randomUUID());if(!temporary.mkdir())throw new IOException("無法準備更新");unzip(zip,temporary);
    File index=new File(temporary,"index.html");if(!index.isFile()||index.length()<1000)throw new IOException("更新檔缺少 APP 主頁");
    try(FileOutputStream out=new FileOutputStream(new File(temporary,"release.json"))){out.write(m.toString().getBytes(StandardCharsets.UTF_8));out.getFD().sync();}
    if(!temporary.renameTo(target))throw new IOException("無法完成更新檔儲存");temporary=null;
   }
   if(!prefs.edit().putString("staged",name).commit())throw new IOException("無法保留待套用版本");
  }finally{zip.delete();if(temporary!=null)removeTree(temporary);}
 }
 static void unzip(File zip,File dir)throws Exception{
  Set<String> seen=new HashSet<>();long expanded=0;int count=0;
  try(ZipInputStream in=new ZipInputStream(new FileInputStream(zip),StandardCharsets.UTF_8)){ZipEntry e;byte[] buffer=new byte[32768];while((e=in.getNextEntry())!=null){if(++count>MAX_FILES)throw new IOException("更新檔數量過多");String name=e.getName();if(e.isDirectory()){safeChild(dir,name.replaceAll("/$",""));continue;}
   File target=safeChild(dir,name);if(!seen.add(name)||name.equals("release.json")||name.equals("updates-config.json")||name.startsWith("bana-updates.")||!name.matches("(?i).+\\.(html|js|css|json|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|mp3|wav|txt)"))throw new IOException("更新檔含不允許的檔案");
   File parent=target.getParentFile();if(!parent.isDirectory()&&!parent.mkdirs())throw new IOException("無法建立更新檔目錄");try(FileOutputStream out=new FileOutputStream(target)){int n;while((n=in.read(buffer))!=-1){expanded+=n;if(expanded>MAX_EXPANDED)throw new IOException("更新內容過大");out.write(buffer,0,n);}}
  }}
 }
 synchronized void activate()throws Exception{
  String next=prefs.getString("staged","");File target=release(next);JSONObject m=metadata(target);
  if(m.getLong("versionCode")<=current().getLong("versionCode"))throw new IOException("待套用版本已過期");
  if(!prefs.edit().putString("previous",prefs.getString("active","")).putString("active",next).putBoolean("unconfirmed",true).remove("staged").commit())throw new IOException("無法套用更新");active=target;
 }
 synchronized void rollback()throws Exception{
  String previous=prefs.getString("previous","");File target=null;if(!previous.isEmpty())try{target=release(previous);metadata(target);}catch(Exception e){previous="";target=null;}
  long failed=unconfirmed()?current().getLong("versionCode"):prefs.getLong("failedCode",-1);
  if(!prefs.edit().putString("active",previous).putString("previous","").putBoolean("unconfirmed",false).putLong("failedCode",failed).commit())throw new IOException("無法恢復上一版");active=target;
 }
 static byte[] readLimited(InputStream source,int maximum)throws IOException{
  try(InputStream in=source;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){if(out.size()+n>maximum)throw new IOException("檔案超出允許大小");out.write(buf,0,n);}return out.toByteArray();}
 }
 private static String hex(byte[] bytes){StringBuilder s=new StringBuilder();for(byte b:bytes)s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();}
 private void removeTree(File file)throws IOException{
  if(!file.getCanonicalPath().startsWith(root.getCanonicalPath()+File.separator))throw new IOException("清理範圍不正確");
  File[] children=file.listFiles();if(children!=null)for(File child:children)removeTree(child);if(file.exists()&&!file.delete())file.deleteOnExit();
 }
}
