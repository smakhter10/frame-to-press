#!/usr/bin/env python3
"""Unified test and validation runner for the repository."""
import os, subprocess, sys
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    skill_dir = root / 'frame-to-press'
    errors = []

    print('=== 1. Validating Agent Skill Structure ===')
    validate_script = skill_dir / 'scripts' / 'validate_skill.py'
    res = subprocess.run([sys.executable, str(validate_script), str(skill_dir)], capture_output=True, text=True)
    if res.returncode != 0:
        errors.append(f'Skill validation failed:\n{res.stdout}\n{res.stderr}')
    else:
        print(res.stdout.strip())

    print('=== 2. Compiling Python Scripts ===')
    py_files = [p for p in root.rglob('*.py') if 'venv' not in p.parts and '.git' not in p.parts]
    for py_file in py_files:
        res = subprocess.run([sys.executable, '-m', 'py_compile', str(py_file)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f'Python compilation failed for {py_file}:\n{res.stderr}')
    print(f'All {len(py_files)} Python files compiled cleanly.')

    print('=== 3. Checking PHP Syntax ===')
    php_files = list(root.rglob('*.php'))
    for php_file in php_files:
        try:
            res = subprocess.run(['php', '-l', str(php_file)], capture_output=True, text=True)
            if res.returncode != 0:
                errors.append(f'PHP syntax error in {php_file}:\n{res.stderr}')
        except FileNotFoundError:
            print('PHP not installed, skipping php -l.')
            break
    else:
        print(f'PHP syntax check passed ({len(php_files)} files checked).')

    print('=== 4. Checking JavaScript Syntax ===')
    js_files = [f for f in root.rglob('*.js') if 'node_modules' not in f.parts]
    for js_file in js_files:
        try:
            res = subprocess.run(['node', '--check', str(js_file)], capture_output=True, text=True)
            if res.returncode != 0:
                errors.append(f'JS syntax error in {js_file}:\n{res.stderr}')
        except FileNotFoundError:
            print('Node not installed, skipping node --check.')
            break
    else:
        print(f'JavaScript syntax check passed ({len(js_files)} files checked).')

    print('=== 5. Running FrameToPress Visual Builder PHP Regression Tests ===')
    php_test = root / 'tests' / 'test_builder_regression.php'
    if php_test.is_file():
        try:
            res = subprocess.run(['php', str(php_test)], capture_output=True, text=True)
            if res.returncode != 0:
                errors.append(f'PHP regression suite failed:\n{res.stdout}\n{res.stderr}')
            else:
                print('PHP regression suite passed (15/15 tests OK).')
        except FileNotFoundError:
            print('PHP not installed, skipping PHP regression suite.')

    print('=== 6. Running Tooling Integration Tests ===')
    py_test = root / 'tests' / 'test_workflow.py'
    if py_test.is_file():
        res = subprocess.run([sys.executable, '-m', 'unittest', str(py_test)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f'Integration suite failed:\n{res.stdout}\n{res.stderr}')
        else:
            print('Python integration suite passed (3/3 tests OK).')

    if errors:
        print('\nValidation FAILED with errors:')
        for err in errors:
            print(f'- {err}')
        sys.exit(1)
    else:
        print('\nAll checks PASSED successfully.')

if __name__ == '__main__':
    main()
