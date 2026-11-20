"""Build BANA Forest with official Android SDK 36 (Java 17, no Maven dependencies).
ANDROID_HOME=/path/to/sdk python3 build-direct.py
Produces build/aligned-unsigned.apk; use the separately retained signing key for upgrades.
"""
from pathlib import Path
import os,shutil,subprocess,zipfile
ROOT=Path(__file__).resolve().parent
SDK=Path(os.environ['ANDROID_HOME']).resolve();BT=SDK/'build-tools/36.0.0';BUILD=ROOT/'build'
assert BUILD.resolve().parent==ROOT.resolve() and BUILD.name=='build'
if BUILD.exists():shutil.rmtree(BUILD)
for name in ('generated','classes','dex'):(BUILD/name).mkdir(parents=True)
def run(args):subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
def tool(name):return BT/(name+('.bat' if name=='d8' else '.exe') if os.name=='nt' else name)
manifest=(ROOT/'app/src/main/AndroidManifest.xml').read_text().replace('<manifest xmlns:','<manifest package="tw.bana.forest" xmlns:',1)
(BUILD/'AndroidManifest.xml').write_text(manifest)
run([tool('aapt2'),'compile','--dir',ROOT/'app/src/main/res','-o',BUILD/'resources.zip'])
run([tool('aapt2'),'link','-I',SDK/'platforms/android-36/android.jar','--manifest',BUILD/'AndroidManifest.xml','-o',BUILD/'unsigned.apk','--java',BUILD/'generated','--min-sdk-version','30','--target-sdk-version','36','--version-code','58','--version-name','0.6.0',BUILD/'resources.zip'])
java=list((ROOT/'app/src/main/java').rglob('*.java'))+list((BUILD/'generated').rglob('*.java'))
run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-source','17','-target','17','-encoding','UTF-8','-classpath',SDK/'platforms/android-36/android.jar','-d',BUILD/'classes',*java])
with zipfile.ZipFile(BUILD/'classes.jar','w') as z:
 for p in (BUILD/'classes').rglob('*.class'):z.write(p,p.relative_to(BUILD/'classes'))
run([tool('d8'),'--min-api','30','--lib',SDK/'platforms/android-36/android.jar','--output',BUILD/'dex',BUILD/'classes.jar'])
with zipfile.ZipFile(BUILD/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for p in (BUILD/'dex').glob('*.dex'):z.write(p,p.name)
 for p in (ROOT/'app/src/main/assets').rglob('*'):
  if p.is_file():z.write(p,'assets/'+p.relative_to(ROOT/'app/src/main/assets').as_posix())
run([tool('zipalign'),'-f','4',BUILD/'unsigned.apk',BUILD/'aligned-unsigned.apk'])
print(BUILD/'aligned-unsigned.apk')
