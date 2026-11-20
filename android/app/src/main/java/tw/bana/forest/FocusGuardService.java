package tw.bana.forest;

import android.app.*;
import android.app.usage.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.graphics.*;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

/** Explicitly enabled, visible foreground service; reads package transitions only. */
public class FocusGuardService extends Service {
 static volatile boolean running=false;
 static volatile String lastError="";
 private final Handler handler=new Handler(Looper.getMainLooper());
 private WindowManager windows;private View cover;private TextView remaining;
 private String top="";private long cursor;private int notifiedMinute=-1;private boolean notifiedUnlocked;private boolean notifiedWindow;
 private final Runnable poll=new Runnable(){public void run(){try{check();}catch(Exception e){lastError="無法讀取前景 App，請重新確認使用情況權限";hide();}if(running)handler.postDelayed(this,600);}};
 @Override public void onCreate(){super.onCreate();windows=getSystemService(WindowManager.class);NotificationManager nm=getSystemService(NotificationManager.class);nm.createNotificationChannel(new NotificationChannel("bana-focus","每日學習 30 分鐘",NotificationManager.IMPORTANCE_LOW));
  try{if(Build.VERSION.SDK_INT>=34)startForeground(30,notification(),ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(30,notification());lastError="";running=true;}catch(Exception e){lastError="系統未允許背景守護，請重新啟用";running=false;stopSelf();}
 }
 @Override public int onStartCommand(Intent i,int flags,int startId){if(!running)return START_NOT_STICKY;if(!FocusStore.enabled(this)||!FocusStore.ready(this)){stopSelf();return START_NOT_STICKY;}handler.removeCallbacks(poll);cursor=0;top="";handler.post(poll);return START_STICKY;}
 private Notification notification(){long ms=FocusStore.earned(this);boolean unlocked=ms>=DailyStudyTimer.GOAL;boolean window=FocusSchedule.active(System.currentTimeMillis(),java.time.ZoneId.systemDefault());notifiedMinute=(int)(ms/60000);notifiedUnlocked=unlocked;notifiedWindow=window;Intent settings=new Intent(this,FocusSettingsActivity.class);PendingIntent content=PendingIntent.getActivity(this,30,settings,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);return new Notification.Builder(this,"bana-focus").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(unlocked?"BANA · 今天已解鎖":window?"BANA · 先學習 30 分鐘":"BANA · 目前可自由使用").setContentText(unlocked?"今天可使用所選 App":window?"已累積 "+(ms/60000)+" / 30 分鐘 · 點此管理":"限制時段 18:00–24:00 · 點此管理").setContentIntent(content).setOngoing(true).setOnlyAlertOnce(true).build();}
 private void check(){if(!FocusStore.enabled(this)||!FocusStore.ready(this)){hide();stopSelf();return;}long now=System.currentTimeMillis();boolean activeWindow=FocusSchedule.active(now,java.time.ZoneId.systemDefault());
  if(!activeWindow){hide();top="";cursor=0;if(notifiedWindow||notifiedMinute!=FocusStore.earned(this)/60000)getSystemService(NotificationManager.class).notify(30,notification());return;}
  PowerManager power=getSystemService(PowerManager.class);KeyguardManager keyguard=getSystemService(KeyguardManager.class);if(!power.isInteractive()||keyguard.isKeyguardLocked()){hide();top="";cursor=0;return;}
  UsageStatsManager usage=getSystemService(UsageStatsManager.class);long start=cursor==0?now-24*60*60*1000L:Math.max(0,cursor-1500);UsageEvents events=usage.queryEvents(start,now);if(events==null){hide();return;}UsageEvents.Event e=new UsageEvents.Event();while(events.hasNextEvent()){events.getNextEvent(e);if(e.getEventType()==UsageEvents.Event.ACTIVITY_RESUMED)top=e.getPackageName();else if(e.getEventType()==UsageEvents.Event.ACTIVITY_PAUSED&&Objects.equals(top,e.getPackageName()))top="";}cursor=now;
  long earned=FocusStore.earned(this);boolean unlocked=earned>=DailyStudyTimer.GOAL;
  if(unlocked||!FocusStore.packages(this).contains(top))hide();else show();
  if(remaining!=null){long left=Math.max(0,DailyStudyTimer.GOAL-earned);remaining.setText("還差 "+String.format(Locale.TAIWAN,"%02d:%02d",(left+999)/60000,((left+999)/1000)%60)+"\n18:00–24:00 · 學滿 30 分鐘解鎖 ♡");}
  if(notifiedMinute!=earned/60000||notifiedUnlocked!=unlocked||notifiedWindow!=activeWindow)getSystemService(NotificationManager.class).notify(30,notification());
 }
 private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
 private void show(){if(cover!=null)return;LinearLayout panel=new LinearLayout(this);panel.setOrientation(1);panel.setGravity(Gravity.CENTER);panel.setPadding(dp(28),dp(60),dp(28),dp(36));panel.setBackgroundColor(Color.rgb(255,254,245));TextView title=new TextView(this);title.setText("🌱 先回森林學習一下");title.setTextSize(23);title.setTextColor(Color.rgb(67,97,49));title.setGravity(Gravity.CENTER);panel.addView(title);remaining=new TextView(this);remaining.setTextSize(18);remaining.setGravity(Gravity.CENTER);remaining.setPadding(0,dp(26),0,dp(26));remaining.setTextColor(Color.rgb(100,119,82));panel.addView(remaining);
  Button learn=new Button(this);learn.setText("回 BANA Forest 學習");panel.addView(learn,new LinearLayout.LayoutParams(-1,-2));learn.setOnClickListener(v->launch(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP)));
  Button home=new Button(this);home.setText("回到手機桌面");panel.addView(home,new LinearLayout.LayoutParams(-1,-2));home.setOnClickListener(v->launch(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));
  Button manage=new Button(this);manage.setText("管理學習限制");panel.addView(manage);manage.setOnClickListener(v->launch(new Intent(this,FocusSettingsActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));
  WindowManager.LayoutParams p=new WindowManager.LayoutParams(-1,-1,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,PixelFormat.OPAQUE);p.gravity=Gravity.TOP|Gravity.START;p.setTitle("BANA 每日學習限制");try{windows.addView(panel,p);cover=panel;lastError="";}catch(Exception e){lastError="無法顯示限制畫面，請確認上層視窗權限";remaining=null;}
 }
 private void launch(Intent i){try{startActivity(i);}catch(Exception e){Toast.makeText(this,"請從桌面開啟 BANA Forest",Toast.LENGTH_LONG).show();}}
 private void hide(){if(cover!=null){try{windows.removeView(cover);}catch(Exception ignored){}cover=null;}remaining=null;}
 @Override public void onDestroy(){running=false;handler.removeCallbacksAndMessages(null);hide();super.onDestroy();}
 @Override public IBinder onBind(Intent i){return null;}
}
