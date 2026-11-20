package tw.bana.forest;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Build;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Provides only fonts selected by native text rendering, entirely on-device. */
final class DeviceFontAssets {
 static final String CSS="_devicefont/current.css";
 private volatile Map<String,byte[]> files=Collections.emptyMap();
 private volatile String stylesheet="";
 void prepare(Paint nativePaint){
  if(Build.VERSION.SDK_INT<31)return;
  try{Api31.prepare(this,nativePaint);}catch(Exception failure){files=Collections.emptyMap();stylesheet="";}
 }
 WebResourceResponse get(String name){
  byte[] data;String mime;
  if(CSS.equals(name)){data=stylesheet.getBytes(StandardCharsets.UTF_8);mime="text/css";}
  else{data=files.get(name);mime="font/ttf";}
  if(data==null)return null;
  Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");
  return new WebResourceResponse(mime,CSS.equals(name)?"UTF-8":null,200,"OK",headers,new ByteArrayInputStream(data));
 }
 private static final class Api31 {
  static void prepare(DeviceFontAssets owner,Paint base)throws Exception{
   String[] samples={"韓","한","A"};
   String[] ranges={"U+2E80-312F,U+31A0-31BF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FE30-FE4F,U+FF00-FFEF,U+20000-323AF","U+1100-11FF,U+3130-318F,U+A960-A97F,U+AC00-D7FF","U+0000-024F,U+1E00-206F,U+20A0-20CF"};
   Map<String,byte[]> files=new HashMap<>();Map<String,String> known=new HashMap<>();StringBuilder css=new StringBuilder();int total=0;
   for(int style:new int[]{Typeface.NORMAL,Typeface.BOLD}){
    Paint paint=new Paint(base);paint.setTypeface(Typeface.create(base.getTypeface(),style));paint.setTextSize(20);
    for(int script=0;script<samples.length;script++)try{
     String sample=samples[script];android.graphics.text.PositionedGlyphs glyphs=android.graphics.text.TextRunShaper.shapeTextRun(sample,0,sample.length(),0,sample.length(),0,0,false,paint);
     if(glyphs.glyphCount()==0||glyphs.getGlyphId(0)==0)continue;
     android.graphics.fonts.Font font=glyphs.getFont(0);
     String key=(font.getFile()!=null?font.getFile().getAbsolutePath():"buffer-"+font.hashCode())+":"+font.getTtcIndex();
     String name=known.get(key);
     if(name==null){
      byte[] bytes=FontFaceBytes.extract(font.getBuffer(),font.getTtcIndex());
      if(total+bytes.length>64*1024*1024)continue;
      name="_devicefont/face"+files.size()+".ttf";files.put(name,bytes);known.put(key,name);total+=bytes.length;
     }
     css.append("@font-face{font-family:BanaDeviceText;src:url('/assets/").append(name).append("');font-style:normal;font-weight:").append(font.getStyle().getWeight()).append(";font-display:swap;unicode-range:").append(ranges[script]).append(';');
     android.graphics.fonts.FontVariationAxis[] axes=font.getAxes();
     if(axes!=null&&axes.length>0){StringJoiner values=new StringJoiner(",");for(android.graphics.fonts.FontVariationAxis axis:axes)if(axis.getTag().matches("[A-Za-z0-9 ]{4}")&&Float.isFinite(axis.getStyleValue()))values.add("'"+axis.getTag()+"' "+axis.getStyleValue());if(values.length()>0)css.append("font-variation-settings:").append(values).append(';');}
     css.append('}');
    }catch(Exception unavailable){/* Missing scripts retain the system fallback. */}
   }
   if(!files.isEmpty())css.append("html.bana-android{--bana-device-font:BanaDeviceText}");
   owner.files=Collections.unmodifiableMap(files);owner.stylesheet=css.toString();
  }
 }
}
