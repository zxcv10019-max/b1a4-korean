from pathlib import Path
import argparse
ROOT=Path(__file__).resolve().parent
def apply(path):
    path=Path(path);html=path.read_text(encoding='utf-8')
    if 'id="bana-reader-floating-nav-script"' in html:return False
    if '</body>' not in html:raise ValueError('HTML body marker missing')
    css=(ROOT/'reader-floating-nav.css').read_text(encoding='utf-8')
    js=(ROOT/'reader-floating-nav.js').read_text(encoding='utf-8')
    html=html.replace('</body>','<style id="bana-reader-floating-nav-style">\n'+css+'</style>\n<script id="bana-reader-floating-nav-script">\n'+js+'</script>\n</body>')
    path.write_text(html,encoding='utf-8');return True
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('html',type=Path);args=p.parse_args();print('Updated' if apply(args.html) else 'Already current')
