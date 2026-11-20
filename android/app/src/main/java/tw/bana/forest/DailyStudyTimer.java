package tw.bana.forest;

import java.time.*;

/** Monotonic foreground accounting. Never credits time between process lifetimes. */
final class DailyStudyTimer {
 static final long GOAL=30*60*1000L;
 String day; long earned;
 private long previousElapsed=-1,previousWall;
 private boolean wasEligible;
 DailyStudyTimer(String savedDay,long savedEarned){day=savedDay;earned=Math.max(0,Math.min(GOAL,savedEarned));}
 synchronized void update(long wall,long elapsed,boolean eligible,ZoneId zone){
  String today=Instant.ofEpochMilli(wall).atZone(zone).toLocalDate().toString();
  long gap=elapsed-previousElapsed;
  long delta=wasEligible&&previousElapsed>=0&&gap>=0&&gap<=10_000L&&wall>=previousWall?gap:0;
  if(!today.equals(day)){
   day=today;earned=0;
   long midnight=Instant.ofEpochMilli(wall).atZone(zone).toLocalDate().atStartOfDay(zone).toInstant().toEpochMilli();
   delta=Math.min(delta,Math.max(0,wall-midnight));
  }
  earned=Math.min(GOAL,earned+delta);
  previousWall=wall;previousElapsed=elapsed;wasEligible=eligible;
 }
 boolean unlocked(){return earned>=GOAL;}
}
