#!/usr/bin/env python3
"""Static checks of an installable WordPress classic theme. Does not replace runtime QA."""
import argparse,json,re,shutil,subprocess,sys
from pathlib import Path

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('theme',type=Path)
    ap.add_argument('--json',type=Path,help='Save machine-readable report')
    args=ap.parse_args()
    root=args.theme.expanduser().resolve()
    report={'theme':str(root),'passed':[],'warnings':[],'errors':[],'php_lint':{},'js_syntax':{}}
    if not root.is_dir(): report['errors'].append('Theme directory does not exist.')
    else:
        for file in ('style.css','functions.php','index.php'):
            if not (root/file).is_file():report['errors'].append(f'Missing required {file}')
            else: report['passed'].append(f'Found {file}')
        style=(root/'style.css').read_text(encoding='utf-8',errors='replace') if (root/'style.css').is_file() else ''
        if not re.search(r'/\*[\s\S]*?Theme Name:\s*\S',style,re.I): report['errors'].append('Missing WordPress Theme Name header in style.css')
        else: report['passed'].append('Valid-looking theme name header')
        phpfiles=list(root.rglob('*.php')); jsfiles=list(root.rglob('*.js'))
        if shutil.which('php'):
            for file in phpfiles:
                r=subprocess.run(['php','-l',str(file)],capture_output=True,text=True)
                report['php_lint'][file.relative_to(root).as_posix()]='OK' if r.returncode==0 else (r.stderr or r.stdout).strip()
                if r.returncode:report['errors'].append(f'PHP syntax: {file.relative_to(root)}')
            if all(x=='OK' for x in report['php_lint'].values()):report['passed'].append(f'PHP lint OK ({len(phpfiles)} files)')
        else:report['warnings'].append('PHP binary not found; php -l not run')
        if shutil.which('node'):
            for file in jsfiles:
                r=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
                report['js_syntax'][file.relative_to(root).as_posix()]='OK' if r.returncode==0 else (r.stderr or r.stdout).strip()
                if r.returncode:report['errors'].append(f'JS syntax: {file.relative_to(root)}')
            if all(x=='OK' for x in report['js_syntax'].values()):report['passed'].append(f'Node syntax OK ({len(jsfiles)} files)')
        else:report['warnings'].append('Node binary not found; JS syntax not checked')
        code='\n'.join(f.read_text(encoding='utf-8',errors='replace') for f in phpfiles if f.stat().st_size<1_000_000)
        for phrase,meaning in [('wp_enqueue_script','WordPress scripts enqueued'),('wp_enqueue_style','WordPress styles enqueued'),('wp_head','wp_head hook present'),('wp_footer','wp_footer hook present')]:
            if phrase in code:report['passed'].append(meaning)
            else:report['warnings'].append(f'Could not find {phrase}; manually inspect rendering/inclusion')
        if not re.search(r'current_user_can\s*\(',code):report['warnings'].append('No current_user_can() found; review editor permissions')
        if not (('wp_verify_nonce' in code) or ('check_ajax_referer' in code) or ('check_admin_referer' in code)):report['warnings'].append('No nonce validation found; review save endpoints')
        if re.search(r'visual.builder|page.builder|builder\.js|data-vb-id',code+'\n'+style,re.I):report['passed'].append('Visual builder integration signal found')
        else:report['warnings'].append('Could not detect built-in visual builder; inspect files manually')
        if '.env' in [x.name for x in root.rglob('*')]:report['errors'].append('Secret .env file detected in theme')
    report['overall']='FAIL' if report['errors'] else ('PASS WITH WARNINGS' if report['warnings'] else 'PASS (STATIC ONLY)')
    output=json.dumps(report,indent=2)
    if args.json:
        args.json.parent.mkdir(parents=True,exist_ok=True)
        args.json.write_text(output+'\n',encoding='utf-8')
    print(output)
    sys.exit(1 if report['errors'] else 0)
if __name__=='__main__':main()
