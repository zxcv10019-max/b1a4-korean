package tw.bana.forest;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;

/** Supplies a single sfnt face from native font buffers. Never saved or uploaded. */
final class FontFaceBytes {
 static final int MAX_BYTES=32*1024*1024;
 private static void bounds(ByteBuffer b,long start,long size)throws IOException{
  if(start<0||size<0||start+size>b.limit())throw new IOException("Font table outside buffer");
 }
 private static long u32(ByteBuffer b,int pos){return Integer.toUnsignedLong(b.getInt(pos));}
 static byte[] extract(ByteBuffer original,int index)throws IOException{
  ByteBuffer b=original.duplicate().order(ByteOrder.BIG_ENDIAN);b.position(0);bounds(b,0,12);
  if(b.getInt(0)!=0x74746366){
   if(index!=0)throw new IOException("Invalid single font index");
   if(b.getInt(0)!=0x10000&&b.getInt(0)!=0x4f54544f)throw new IOException("Unsupported sfnt");
   if(b.limit()>MAX_BYTES)throw new IOException("Font too large");
   byte[] raw=new byte[b.limit()];b.get(raw);return raw;
  }
  long count=u32(b,8);if(index<0||index>=count||count>1024)throw new IOException("Invalid collection index");
  bounds(b,12,count*4);long face=u32(b,12+index*4);bounds(b,face,12);
  int sfnt=(int)face,version=b.getInt(sfnt);
  if(version!=0x10000&&version!=0x4f54544f)throw new IOException("Unsupported sfnt");
  int countTables=Short.toUnsignedInt(b.getShort(sfnt+4));if(countTables==0||countTables>256)throw new IOException("Invalid table count");
  bounds(b,face+12,countTables*16L);ArrayList<int[]> tables=new ArrayList<>();long total=12;
  for(int i=0;i<countTables;i++){
   int record=sfnt+12+i*16,tag=b.getInt(record);long offset=u32(b,record+8),size=u32(b,record+12);
   bounds(b,offset,size);if(tag==0x44534947)continue;
   if(size>MAX_BYTES)throw new IOException("Font table too large");
   tables.add(new int[]{tag,(int)offset,(int)size});total+=16+((size+3)&~3L);
  }
  if(total>MAX_BYTES||tables.isEmpty())throw new IOException("Invalid extracted font size");
  byte[] result=new byte[(int)total];ByteBuffer out=ByteBuffer.wrap(result).order(ByteOrder.BIG_ENDIAN);
  int n=tables.size(),power=Integer.highestOneBit(n),data=12+n*16,head=-1;
  out.putInt(version).putShort((short)n).putShort((short)(power*16)).putShort((short)Integer.numberOfTrailingZeros(power)).putShort((short)(n*16-power*16));
  for(int i=0;i<n;i++){
   int[] t=tables.get(i);ByteBuffer source=b.duplicate();source.position(t[1]);source.get(result,data,t[2]);
   if(t[0]==0x68656164){if(t[2]<12)throw new IOException("Invalid head");head=data;out.putInt(data+8,0);}
   int padded=(t[2]+3)&~3;long sum=0;for(int p=data;p<data+padded;p+=4)sum=(sum+u32(out,p))&0xffffffffL;
   int record=12+i*16;out.putInt(record,t[0]);out.putInt(record+4,(int)sum);out.putInt(record+8,data);out.putInt(record+12,t[2]);data+=padded;
  }
  if(head<0)throw new IOException("Missing head");
  long checksum=0;for(int p=0;p<result.length;p+=4)checksum=(checksum+u32(out,p))&0xffffffffL;
  out.putInt(head+8,(int)(0xb1b0afbaL-checksum));return result;
 }
}
