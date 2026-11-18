#!/usr/bin/env python3
"""Non-executing static inventory of a frontend source tree. Python >=3.9."""
import argparse, json, os, re
from pathlib import Path
from collections import Counter
EXCLUDE={'.git','node_modules','.next','.nuxt','dist','build','.output','coverage','.cache','vendor','.venv','venv'}
TEXT={'.html','.htm','.js','.jsx','.ts','.tsx','.vue','.svelte','.css','.scss','.sass','.less','.json','.php'}
SCRIPTS={'.js','.jsx','.ts','.tsx','.vue','.svelte'}
ASSETS={'.png','.jpg','.jpeg','.webp','.svg','.gif','.avif','.woff','.woff2','.ttf','.otf','.mp4','.webm'}
ROUTE_PATTERNS=[r'<Route\b[^>]*\bpath\s*=\s*["\']([^"\']+)',r'\bpath\s*:\s*["\'](/[^"\']+)',r'router\.(?:get|post|use)\s*\(\s*["\'](/[^"\']+)']

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path,help='Path to frontend source directory')
    p.add_argument('--output',type=Path,help='Save JSON inventory to file')
    p.add_argument('--limit',type=int,default=7000,help='Maximum files to scan (default 7000)')
    args=p.parse_args()
    root=args.source.expanduser().resolve()
    if not root.is_dir(): p.error(f'Not a directory: {root}')
    paths=[]; counts=Counter(); ignored=0
    for directory,dirs,files in os.walk(root):
        dirs[:]=sorted(d for d in dirs if d not in EXCLUDE and not d.startswith('.'))
        for fn in sorted(files):
            file=Path(directory,fn)
            if file.is_symlink(): continue
            counts[file.suffix.lower() or '(none)']+=1
            if len(paths)<args.limit: paths.append(file)
            else: ignored+=1
    routes=set(); frameworks=set(); hints=set(); forms=[]; imports=[]
    if (root/'package.json').exists():
        try:
            pkg=json.loads((root/'package.json').read_text(encoding='utf-8'))
            d={**pkg.get('dependencies',{}),**pkg.get('devDependencies',{})}
            for name in ('react','next','vue','nuxt','vite','svelte','@angular/core','gsap','framer-motion','tailwindcss','react-router-dom','@wordpress/scripts'):
                if name in d: (frameworks if name in ('react','next','vue','nuxt','vite','svelte','@angular/core') else hints).add(name)
        except Exception: hints.add('package.json unreadable/invalid')
    for f in paths:
        rel=f.relative_to(root).as_posix()
        ext=f.suffix.lower()
        if ext=='.html' and rel.startswith(('pages/','public/')) or ext=='.html' and f.parent==root:
            routes.add('/' if f.name=='index.html' else '/'+f.stem)
        if ext in SCRIPTS and (rel.startswith(('pages/','app/','src/pages/','src/app/'))):
            short=re.sub(r'^(src/)?(app|pages)/','',rel)
            if re.search(r'(^|/)(page|index)\.(jsx?|tsx?)$',short) or ('/' not in short and ext in {'.jsx','.tsx'}):
                short=re.sub(r'/(page|index)\.(jsx?|tsx?)$','',short)
                short=re.sub(r'\.(jsx?|tsx?)$','',short)
                routes.add('/'+short if short else '/')
        if ext not in TEXT or f.stat().st_size>1_000_000: continue
        try: s=f.read_text(encoding='utf-8',errors='replace')
        except OSError: continue
        for pattern in ROUTE_PATTERNS:
            for m in re.finditer(pattern,s): routes.add(m.group(1))
        if ext in SCRIPTS:
            if re.search(r'\b(fetch|axios|graphql|useQuery|serverAction|useSWR)\b',s): hints.add('Remote/API data detected')
            if re.search(r'\b(useState|useEffect|onMounted|useStore|createContext)\b',s): hints.add('Client-side state detected')
        if re.search(r'<form\b|\bwp_mail\s*\(|\bonSubmit\s*=',s,re.I): forms.append(rel)
        if re.search(r'wooCommerce|stripe|paypal|checkout|cart|shopify',s,re.I): hints.add('Possible commerce flow; verify manually')
        if re.search(r'gsap|ScrollTrigger|locomotive|lenis|framer-motion',s,re.I): hints.add('Animation library or scroll motion detected')
    result={'source':str(root),'frameworks':sorted(frameworks),'libraries_or_signals':sorted(hints), 'routes_candidates':sorted(routes), 'forms_files':forms[:80], 'extensions':dict(counts.most_common()),'asset_count':sum(v for k,v in counts.items() if k in ASSETS),'files_scanned':len(paths),'files_skipped_due_to_limit':ignored,'warnings':['Regex-based discovery is incomplete. Inspect routing, API dependencies, CSS and visuals manually.']}
    report=json.dumps(result,indent=2,ensure_ascii=False)
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(report+'\n',encoding='utf-8')
    print(report)
if __name__=='__main__': main()
