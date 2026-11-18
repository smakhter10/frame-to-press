#!/usr/bin/env python3
"""Install this skill into a compatible coding-agent skills directory.

Example: python scripts/install_skill.py claude --scope project --project /path/to/workspace
"""
import argparse,shutil,sys
from pathlib import Path

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('platform',choices=['claude','codex','chatgpt-codex','antigravity'])
    ap.add_argument('--scope',choices=['project','user'],default='project')
    ap.add_argument('--project',type=Path,default=Path.cwd(),help='Workspace root for project installs')
    ap.add_argument('--force',action='store_true',help='Replace existing installation after backup')
    a=ap.parse_args();src=Path(__file__).resolve().parents[1]
    if a.scope=='project':
        location='.claude/skills' if a.platform=='claude' else '.agents/skills'
        dest=a.project.expanduser().resolve()/location/src.name
    else:
        location='.claude/skills' if a.platform=='claude' else ('.gemini/config/skills' if a.platform=='antigravity' else '.agents/skills')
        dest=Path.home()/location/src.name
    if src==dest.resolve():print('Skill already installed at',dest);return
    if dest.exists():
        if not a.force:ap.error(f'{dest} already exists; use --force to back it up and replace')
        backup=dest.with_name(dest.name+'.backup')
        if backup.exists():ap.error(f'Existing backup at {backup}; move/remove it manually before --force')
        shutil.move(str(dest),str(backup))
        print('Backed up old installation to',backup)
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copytree(src,dest,ignore=shutil.ignore_patterns('__pycache__','*.pyc','.DS_Store'))
    print('Installed:',dest)
    print('Try: /'+src.name+' (Claude/Antigravity), $'+src.name+' (Codex), or mention the skill in your request.')
if __name__=='__main__':main()
