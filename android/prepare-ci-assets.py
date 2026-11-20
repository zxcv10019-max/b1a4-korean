"""Rebuild the Android entry from this repository's current index.html on a trusted CI runner."""
from pathlib import Path
import re, shutil, urllib.request
from urllib.parse import urlsplit
from importlib.util import spec_from_file_location,module_from_spec

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent
assets=ROOT/'app/src/main/assets'
icon=ROOT/'app/src/main/res/mipmap/ic_launcher.png';icon.parent.mkdir(parents=True,exist_ok=True)
shutil.copy2(REPO/'icon-192.png',icon)
source=REPO/'index.html'
if not source.is_file():raise SystemExit('Repository index.html is missing')
text=source.read_text(encoding='utf-8')
for url in re.findall(r'''<script\b[^>]*\bsrc=["'](https://[^"']+)''',text):
    parsed=urlsplit(url)
    if parsed.hostname not in {'www.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com'}:
        raise ValueError('Unapproved script host: '+str(parsed.hostname))
    name=parsed.path.rsplit('/',1)[-1]
    if not name.endswith('.js') or not re.fullmatch(r'[A-Za-z0-9._-]+',name):raise ValueError('Invalid vendor name')
    target=assets/'vendor'/name;target.parent.mkdir(exist_ok=True)
    with urllib.request.urlopen(url,timeout=90) as response:
        data=response.read(8*1024*1024+1)
    if len(data)>8*1024*1024:raise ValueError('Vendor library exceeds allowed size')
    target.write_bytes(data)
spec=spec_from_file_location('entry',ROOT/'update-web-entry.py');entry=module_from_spec(spec);spec.loader.exec_module(entry)
entry.prepare(source)
print('Prepared latest Android entry and offline vendor libraries')
