"""Prepare a current standalone BANA Forest HTML as the Android entry; no downloads required."""
from pathlib import Path
import argparse, re
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parent
def prepare(source):
    assets=ROOT/'app/src/main/assets'
    text=Path(source).read_text(encoding='utf-8')
    if '<head>' not in text or '</body>' not in text or 'banaContentBlocks' not in text:
        raise ValueError('Not a supported BANA Forest HTML')
    if 'src="android-boot.js"' in text:
        raise ValueError('Supply the standalone website HTML, not an already prepared Android entry')
    text=text.replace('<head>','<head>\n<script src="android-boot.js"></script>',1)
    def local_script(match):
        before,url,after=match.groups(); name=urlsplit(url).path.rsplit('/',1)[-1]
        return before+'vendor/'+name+after if (assets/'vendor'/name).is_file() else match.group(0)
    text=re.sub(r'''(<script\b[^>]*\bsrc=["'])(https://[^"']+)(["'][^>]*>)''',local_script,text)
    csp='''<meta http-equiv="Content-Security-Policy" content="frame-src 'self' https://b1a4-cc0af.firebaseapp.com; object-src 'none'; base-uri 'self'">'''
    text=text.replace('</head>',csp+'\n</head>',1)
    text=re.sub(r'<link[^>]+(?:rel="manifest"|href="icon-192.png")[^>]*>','',text)
    text=text.replace('if ("serviceWorker" in navigator)','if (!window.BanaAndroid && "serviceWorker" in navigator)')
    native='<link rel="stylesheet" href="android-app.css"><script src="android-app.js"></script><link rel="stylesheet" href="focus-gate.css"><script src="focus-gate.js"></script>'
    text=text.replace('</body>',native+'\n</body>')
    (assets/'index.html').write_text(text,encoding='utf-8')
    return assets/'index.html'

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('html',type=Path)
    print(prepare(p.parse_args().html))
