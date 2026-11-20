from pathlib import Path
import argparse,re
ROOT=Path(__file__).resolve().parent
def apply(path):
    path=Path(path);html=path.read_text(encoding='utf-8')
    if '</body>' not in html:raise ValueError('HTML body marker missing')
    css=(ROOT/'reader-floating-nav.css').read_text(encoding='utf-8')
    js=(ROOT/'reader-floating-nav.js').read_text(encoding='utf-8')
    fragment='<style id="bana-reader-floating-nav-style">\n'+css+'</style>\n<script id="bana-reader-floating-nav-script">\n'+js+'</script>\n'
    previous=html
    if 'id="bana-reader-floating-nav-script"' in html:
        html=re.sub(r'<style id="bana-reader-floating-nav-style">[\s\S]*?</style>\s*<script id="bana-reader-floating-nav-script">[\s\S]*?</script>\s*',lambda m:fragment,html,count=1)
    else:html=html.replace('</body>',fragment+'</body>')
    if html==previous:return False
    path.write_text(html,encoding='utf-8');return True
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('html',type=Path);args=p.parse_args();print('Updated' if apply(args.html) else 'Already current')
