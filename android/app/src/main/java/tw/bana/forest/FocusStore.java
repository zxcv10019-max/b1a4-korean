package tw.bana.forest;

import android.app.*;
import android.content.*;
import android.os.*;
import android.provider.Settings;
import org.json.*;
import java.time.ZoneId;
import java.util.*;

final class FocusStore {
 static final String PREF="bana-focus-30-v1";
 private static DailyStudyTimer timer;
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences(PREF,Context.MODE_PRIVATE);}
 static synchronized DailyStudyTimer timer(Context c){if(timer==null)timer=new DailyStudyTimer(prefs(c).getString("day",""),prefs(c).getLong("earned",0));return timer;}
 static boolean enabled(Context c){return prefs(c).getBoolean("enabled",false);}
 static synchronized void pulse(Context c,boolean eligible){DailyStudyTimer t=timer(c);t.update(System.currentTimeMillis(),SystemClock.elapsedRealtime(),enabled(c)&&eligible,ZoneId.systemDefault());prefs(c).edit().putString("day",t.day).putLong("earned",t.earned).apply();}
 // Read status without changing the active interval used by the Activity.
 static synchronized long earned(Context c){DailyStudyTimer t=timer(c);String day=java.time.LocalDate.now().toString();return day.equals(t.day)?t.earned:0;}
 static Set<String> packages(Context c){return new HashSet<>(prefs(c).getStringSet("packages",Collections.emptySet()));}
 static boolean usageAllowed(Context c){try{return c.getSystemService(AppOpsManager.class).unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,android.os.Process.myUid(),c.getPackageName())==AppOpsManager.MODE_ALLOWED;}catch(Exception e){return false;}}
 static boolean ready(Context c){return usageAllowed(c)&&Settings.canDrawOverlays(c);}
 static String status(Context c){try{return new JSONObject().put("enabled",enabled(c)).put("earnedMs",earned(c)).put("goalMs",DailyStudyTimer.GOAL).put("unlocked",earned(c)>=DailyStudyTimer.GOAL).put("permissionsReady",ready(c)).put("windowActive",FocusSchedule.active(System.currentTimeMillis(),ZoneId.systemDefault())).put("selectedApps",packages(c).size()).put("monitorRunning",FocusGuardService.running).put("monitorError",FocusGuardService.lastError).toString();}catch(Exception e){return "{}";}}
 static boolean start(Context c){if(!enabled(c)||!ready(c)||packages(c).isEmpty())return false;try{c.startForegroundService(new Intent(c,FocusGuardService.class));return true;}catch(Exception e){return false;}}
 static void disable(Context c){pulse(c,false);prefs(c).edit().putBoolean("enabled",false).apply();c.stopService(new Intent(c,FocusGuardService.class));}
}
