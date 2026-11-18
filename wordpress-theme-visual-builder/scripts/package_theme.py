#!/usr/bin/env python3
"""Package a completed WordPress theme folder into a safe ZIP."""
import argparse, zipfile, sys
from pathlib import Path
SKIPDIR={'.git','node_modules','vendor','.next','dist','build','coverage','tests','__pycache__','.venv'}
SKIPFILE={'.env','.DS_Store','Thumbs.db','.gitignore','package-lock.json','pnpm-lock.yaml','yarn.lock'}
def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('theme',type=Path)
    ap.add_argument('output',type=Path)
    a=ap.parse_args()
    theme=a.theme.resolve(); dest=a.output.resolve()
    if not theme.is_dir() or not all((theme/x).is_file() for x in ['style.css','functions.php','index.php']):ap.error('Not a complete WordPress classic theme')
    if not theme.name or not theme.name.replace('-','').replace('_','').isalnum():ap.error('Use a safe theme folder name')
    dest.parent.mkdir(parents=True,exist_ok=True)
    n=0
    with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(theme.rglob('*')):
            rel=p.relative_to(theme)
            if p.is_symlink() or any(s in SKIPDIR for s in rel.parts) or p.name in SKIPFILE or p.suffix in ('.pyc','.log','.bak'):continue
            if p.is_file():
                z.write(p,arcname=f'{theme.name}/{rel.as_posix()}'); n+=1
    with zipfile.ZipFile(dest) as z:
        if z.testzip() is not None:sys.exit('ZIP integrity check failed')
    print(f'Packaged {n} theme files: {dest} ({dest.stat().st_size} bytes)')
if __name__=='__main__':main()
