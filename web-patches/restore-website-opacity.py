from pathlib import Path
import re,sys

def apply(path):
    p=Path(path);s=p.read_text(encoding='utf-8')
    for tag,marker in [('style','bana-worktime-fade-style'),('script','bana-worktime-fade-script')]:
        pattern=r'<'+tag+r'\b[^>]*\bid=[\"\x27]'+marker+r'[\"\x27][^>]*>[\s\S]*?</'+tag+r'>'
        s,count=re.subn(pattern,'',s,flags=re.I)
        assert count<=1, 'Duplicate fade block: '+marker
    p.write_bytes(s.encode('utf-8'))

if __name__=='__main__':apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
