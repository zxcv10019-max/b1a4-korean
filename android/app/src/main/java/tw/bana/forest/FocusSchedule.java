package tw.bana.forest;
import java.time.*;
/** Daily local-device restriction window [18:00, 24:00). */
final class FocusSchedule {
 static boolean active(long wall,ZoneId zone){return Instant.ofEpochMilli(wall).atZone(zone).getHour()>=18;}
}
