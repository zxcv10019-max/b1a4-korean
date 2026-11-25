from pathlib import Path
import sys

def apply(path):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    if 'bana-desktop-opacity-mode' in s:
        return
    old='const active=!isNative()&&isWorkTime(date||new Date());'
    new="const active=!isNative()&&!new URLSearchParams(location.search).has('desktopOpacity')&&isWorkTime(date||new Date()); // bana-desktop-opacity-mode"
    assert s.count(old)==1, 'Work time fade hook changed'
    p.write_bytes(s.replace(old,new,1).encode('utf-8'))

if __name__=='__main__':
    apply(sys.argv[1] if len(sys.argv)>1 else 'index.html')
