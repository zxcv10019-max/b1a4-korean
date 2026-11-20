package tw.bana.forest;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.zip.*;

/** Run against the actual native path and ZIP validators after compiling with Android SDK 36. */
public final class WebUpdateStoreTest {
 interface Checked {void run()throws Exception;}
 static void denied(Checked c)throws Exception{try{c.run();throw new AssertionError("Expected rejection");}catch(IOException expected){}}
 static File zip(File dir,String name,String body)throws Exception{File out=File.createTempFile("test-",".zip",dir);try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(out))){z.putNextEntry(new ZipEntry(name));z.write(body.getBytes(StandardCharsets.UTF_8));z.closeEntry();}return out;}
 public static void main(String[] args)throws Exception{
  File root=Files.createTempDirectory("bana-update-test-").toFile();
  for(String name:new String[]{"../escape.js","/absolute.js","C:/escape.js","nested/../../escape.js","nested\\escape.js","a//b.js"})denied(()->WebUpdateStore.safeChild(root,name));
  if(!WebUpdateStore.safeChild(root,"vendor/module.js").getPath().startsWith(root.getCanonicalPath()))throw new AssertionError();
  denied(()->WebUpdateStore.validateSource("http://example.com/latest.json"));
  denied(()->WebUpdateStore.validateSource("https://user:password@example.com/latest.json"));
  denied(()->WebUpdateStore.validateSource("https://example.com/share.html"));
  WebUpdateStore.validateSource("https://example.com/updates/latest.json");
  for(String name:new String[]{"../escape.js","release.json","updates-config.json","bana-updates.js","classes.dex","native.so"}){
   File target=Files.createTempDirectory(root.toPath(),"extract-").toFile();denied(()->WebUpdateStore.unzip(zip(root,name,"unsafe"),target));
  }
  File target=Files.createTempDirectory(root.toPath(),"valid-").toFile();WebUpdateStore.unzip(zip(root,"vendor/ok.js","const ok=true;"),target);
  if(!new File(target,"vendor/ok.js").isFile())throw new AssertionError("Valid asset missing");
  System.out.println("Native path/source/ZIP validation passed");
 }
}
