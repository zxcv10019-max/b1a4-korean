package tw.bana.forest;

import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.Color;
import android.net.Uri;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class FocusSettingsActivity extends Activity {
 private LinearLayout body;private TextView status,permissions;private Button toggle;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private final Runnable refresh=new Runnable(){public void run(){renderStatus();handler.postDelayed(this,1000);}};
 private int dp(int x){return Math.round(x*getResources().getDisplayMetrics().density);}
 private TextView text(String value,int size){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(Color.rgb(64,86,52));v.setPadding(0,dp(8),0,dp(8));body.addView(v);return v;}
 private Button action(String title,Runnable fn){Button b=new Button(this);b.setText(title);b.setAllCaps(false);body.addView(b,new LinearLayout.LayoutParams(-1,-2));b.setOnClickListener(v->fn.run());return b;}
 @Override public void onCreate(Bundle state){super.onCreate(state);ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(Color.rgb(255,254,247));body=new LinearLayout(this);body.setOrientation(1);body.setPadding(dp(20),dp(24),dp(20),dp(24));scroll.addView(body);setContentView(scroll);
  scroll.setOnApplyWindowInsetsListener((v,i)->{android.graphics.Insets bars=i.getInsets(WindowInsets.Type.systemBars());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return i;});
  action("‹ 返回 BANA Forest",()->finish());text("🌱 晚上先學習 30 分鐘",22);
  text("在 BANA Forest 前景使用時累積，切換 App、鎖屏或關螢幕就暫停。只有每天 18:00–24:00 限制所選 App，其他時間自由使用。學習整天都能累積，當天滿 30 分鐘就解鎖；午夜重新計時。設定此頁不列入時間。",14);
  status=text("",18);permissions=text("",13);
  action("1 · 選擇紅果、Threads、抖音",this::chooseApps);
  action("2 · 開啟使用情況存取",()->openSetting(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS,Uri.parse("package:"+getPackageName()))));
  action("3 · 允許顯示在其他 App 上層",()->openSetting(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,Uri.parse("package:"+getPackageName()))));
  if(Build.VERSION.SDK_INT>=33)action("允許顯示運作通知",()->requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},30));
  toggle=action("",()->{if(FocusStore.enabled(this)){FocusStore.disable(this);renderStatus();return;}if(!FocusStore.ready(this)||FocusStore.packages(this).isEmpty()){new AlertDialog.Builder(this).setMessage("請先選擇要限制的 App，並完成上面兩項系統授權。").setPositiveButton("好",null).show();return;}
   new AlertDialog.Builder(this).setTitle("啟用每日 30 分鐘").setMessage("只有 18:00–24:00，會在本機讀取前景 App 名稱，並在當天未滿 30 分鐘時遮住你選的 App。其他時間不限制。不讀取 App 內容，也不會上傳使用紀錄。你可隨時回這裡暫停；這是自律工具，不是無法解除的鎖。")
   .setPositiveButton("啟用",(d,w)->{FocusStore.prefs(this).edit().putBoolean("enabled",true).apply();if(!FocusStore.start(this)){FocusStore.disable(this);Toast.makeText(this,"無法啟動，請確認系統授權後重試",Toast.LENGTH_LONG).show();}renderStatus();}).setNegativeButton("取消",null).show();});
  text("只有 APK 能限制其他 App，網站不會鎖住手機。若通知顯示守護已停止，或手機重開機，請先開啟 BANA Forest 恢復。若系統省電或目標 App 禁止覆蓋視窗，限制可能無法顯示。",12);
 }
 private void openSetting(Intent intent){try{startActivity(intent);}catch(Exception e){Toast.makeText(this,"請在手機設定搜尋這項權限",Toast.LENGTH_LONG).show();}}
 private void renderStatus(){if(status==null)return;long ms=FocusStore.earned(this);status.setText("限制時段 18:00–24:00\n"+(ms>=DailyStudyTimer.GOAL?"♡ 今天已解鎖":"今日累積 "+String.format(Locale.TAIWAN,"%02d:%02d",ms/60000,(ms/1000)%60)+" / 30:00")+"\n已選 "+FocusStore.packages(this).size()+" 個 App");permissions.setText("使用情況："+(FocusStore.usageAllowed(this)?"已允許":"未允許")+" · 上層視窗："+(Settings.canDrawOverlays(this)?"已允許":"未允許")+"\n"+(FocusStore.enabled(this)?FocusGuardService.running?FocusGuardService.lastError.isEmpty()?"守護運作中":FocusGuardService.lastError:"守護未運作，請重新啟用":"目前未啟用"));toggle.setText(FocusStore.enabled(this)?"暫停限制":"啟用每日 30 分鐘");}
 private void chooseApps(){Intent launch=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);List<ResolveInfo> resolved=getPackageManager().queryIntentActivities(launch,0);Map<String,String> labels=new TreeMap<>();for(ResolveInfo r:resolved){String pkg=r.activityInfo.packageName;if(!pkg.equals(getPackageName()))labels.put(pkg,r.loadLabel(getPackageManager()).toString());}List<String> keys=new ArrayList<>(labels.keySet());keys.sort(Comparator.comparing(k->labels.get(k),String.CASE_INSENSITIVE_ORDER));String[] names=new String[keys.size()];boolean[] checked=new boolean[keys.size()];Set<String> selected=FocusStore.packages(this);for(int i=0;i<keys.size();i++){String pkg=keys.get(i),label=labels.get(pkg);names[i]=label;checked[i]=selected.contains(pkg)||(selected.isEmpty()&&(label.contains("紅果")||label.contains("红果")||label.equalsIgnoreCase("Threads")||label.contains("抖音")));}
  new AlertDialog.Builder(this).setTitle("勾選要限制的三個 App").setMultiChoiceItems(names,checked,(d,which,value)->checked[which]=value).setPositiveButton("儲存",(d,w)->{Set<String> result=new HashSet<>();for(int i=0;i<keys.size();i++)if(checked[i])result.add(keys.get(i));FocusStore.prefs(this).edit().putStringSet("packages",result).apply();if(result.isEmpty())FocusStore.disable(this);renderStatus();}).setNegativeButton("取消",null).show();
 }
 @Override protected void onResume(){super.onResume();if(FocusStore.enabled(this))FocusStore.start(this);handler.post(refresh);}
 @Override protected void onPause(){handler.removeCallbacks(refresh);super.onPause();}
}
