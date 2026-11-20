"""Create one offline HTML/CSS/JS release plus latest.json. Does not publish or sign APKs."""
from pathlib import Path
import argparse, hashlib, json, re, zipfile

ROOT=Path(__file__).resolve().parent
EXCLUDED={'bana-updates.js','bana-updates.css','updates-config.json','web-version.json','release.json'}
ALLOWED={'.html','.js','.css','.json','.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.woff','.woff2','.ttf','.otf','.mp3','.wav','.txt'}

def create_release(assets, output, code, version, notes='', minimum_shell=58):
    assets=Path(assets).resolve(); output=Path(output).resolve()
    if type(code) is not int or code<1 or not version.strip() or len(version)>80:
        raise ValueError('Version code must be a positive integer and version must be 1–80 characters')
    if type(minimum_shell) is not int or minimum_shell<58:
        raise ValueError('This update protocol requires shell version 58 or newer')
    if not (assets/'index.html').is_file() or (assets/'index.html').stat().st_size<1000:
        raise ValueError('Missing application index.html')
    if output==assets or assets in output.parents:
        raise ValueError('Output directory must be outside app assets')
    output.mkdir(parents=True,exist_ok=True)
    version_tag=re.sub(r'[^a-zA-Z0-9._-]','_',version)
    bundle=output/f'bana-web-{code}-{version_tag}.zip'
    files=[p for p in sorted(assets.rglob('*')) if p.is_file() and p.name not in EXCLUDED]
    if len(files)>2048 or sum(p.stat().st_size for p in files)>120*1024*1024:
        raise ValueError('Release exceeds device extraction limits')
    for p in files:
        if p.is_symlink() or not p.resolve().is_relative_to(assets) or p.suffix.lower() not in ALLOWED:
            raise ValueError('Unsupported asset: '+p.name)
    with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in files:
            z.write(p,p.relative_to(assets).as_posix())
    size=bundle.stat().st_size
    if size>64*1024*1024:
        raise ValueError('Release ZIP exceeds 64 MiB')
    digest=hashlib.sha256(bundle.read_bytes()).hexdigest()
    manifest={'schema':1,'versionCode':code,'version':version,'minShellVersion':minimum_shell,
              'bundleUrl':bundle.name,'bytes':size,'sha256':digest,'notes':notes}
    temporary=output/'latest.json.tmp'
    temporary.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temporary.replace(output/'latest.json')
    return manifest

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--assets',type=Path,default=ROOT/'app/src/main/assets')
    p.add_argument('--output',type=Path,default=ROOT/'dist/web')
    p.add_argument('--version-code',required=True,type=int)
    p.add_argument('--version',required=True)
    p.add_argument('--notes',default='')
    args=p.parse_args()
    result=create_release(args.assets,args.output,args.version_code,args.version,args.notes)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
