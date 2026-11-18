#!/usr/bin/env python3
"""Check this skill's basic open-standard directory/frontmatter structure."""
import argparse,re,sys,zipfile
from pathlib import Path

def main():
    ap=argparse.ArgumentParser(description=__doc__); ap.add_argument('skill',type=Path);a=ap.parse_args()
    d=a.skill.resolve(); p=d/'SKILL.md';errors=[]
    if not p.is_file():errors.append('Missing SKILL.md')
    else:
        t=p.read_text(encoding='utf-8')
        if not t.startswith('---\n') or '\n---\n' not in t[4:]:errors.append('YAML frontmatter missing')
        else:
            fm=t.split('---',2)[1]
            name=re.search(r'^name:\s*([^\n]+)',fm,re.M);desc=re.search(r'^description:\s*([^\n]+)',fm,re.M)
            if not name or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',name.group(1).strip()) or len(name.group(1).strip())>64:errors.append('Invalid skill name')
            if not desc or not desc.group(1).strip() or len(desc.group(1).strip())>1024:errors.append('Invalid description')
            if name and name.group(1).strip()!=d.name:errors.append('Skill folder name must match frontmatter name')
        for rel in re.findall(r'\]\((references/[^)#]+|assets/[^)#]+|scripts/[^)#]+)\)',t):
            if not (d/rel).exists():errors.append('Broken file reference: '+rel)
    print('FAIL: '+ '; '.join(errors) if errors else 'PASS: skill structure, metadata, references')
    sys.exit(bool(errors))
if __name__=='__main__':main()
