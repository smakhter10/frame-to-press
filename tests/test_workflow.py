#!/usr/bin/env python3
"""Automated integration test for FrameToPress conversion tooling."""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL_DIR = ROOT / 'frame-to-press'
SCRIPTS_DIR = SKILL_DIR / 'scripts'

class TestFrameToPressTools(unittest.TestCase):

    def test_validate_skill(self):
        """Ensure the canonical skill directory passes validate_skill.py."""
        script = SCRIPTS_DIR / 'validate_skill.py'
        res = subprocess.run([sys.executable, str(script), str(SKILL_DIR)], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"validate_skill failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("PASS:", res.stdout)

    def test_audit_project_mock(self):
        """Test audit_project.py against a mock React/Next project."""
        script = SCRIPTS_DIR / 'audit_project.py'
        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)
            # Create a mock Next/React project
            pkg = {
                "name": "mock-frontend",
                "dependencies": {"react": "^18.2.0", "next": "^14.0.0", "tailwindcss": "^3.3.0"}
            }
            (tmppath / "package.json").write_text(json.dumps(pkg), encoding="utf-8")
            pages = tmppath / "pages"
            pages.mkdir()
            (pages / "index.js").write_text("export default function Home() { return <h1>Hello</h1>; }", encoding="utf-8")
            (pages / "about.js").write_text("export default function About() { return <p>About</p>; }", encoding="utf-8")
            
            output_json = tmppath / "audit.json"
            res = subprocess.run(
                [sys.executable, str(script), str(tmppath), "--output", str(output_json)],
                capture_output=True, text=True
            )
            self.assertEqual(res.returncode, 0, f"audit_project failed:\n{res.stderr}")
            self.assertTrue(output_json.is_file())
            data = json.loads(output_json.read_text(encoding="utf-8"))
            self.assertIn("react", data.get("frameworks", []))
            self.assertIn("next", data.get("frameworks", []))
            self.assertTrue(len(data.get("routes_candidates", [])) >= 1)

    def test_check_and_package_theme_mock(self):
        """Test check_theme.py and package_theme.py against a mock WordPress theme."""
        check_script = SCRIPTS_DIR / 'check_theme.py'
        pkg_script = SCRIPTS_DIR / 'package_theme.py'

        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)
            theme_dir = tmppath / "my-theme"
            theme_dir.mkdir()
            
            # Required theme files
            style_content = "/*\nTheme Name: My Test Theme\nAuthor: FrameToPress\n*/\nbody { margin: 0; }\n"
            functions_content = "<?php\nwp_enqueue_style('theme-style', get_stylesheet_uri());\n"
            index_content = "<!DOCTYPE html><html><head><?php wp_head(); ?></head><body><h1>Theme</h1><?php wp_footer(); ?></body></html>\n"
            
            (theme_dir / "style.css").write_text(style_content, encoding="utf-8")
            (theme_dir / "functions.php").write_text(functions_content, encoding="utf-8")
            (theme_dir / "index.php").write_text(index_content, encoding="utf-8")
            
            # 1. Run check_theme
            report_file = tmppath / "report.json"
            res_check = subprocess.run(
                [sys.executable, str(check_script), str(theme_dir), "--json", str(report_file)],
                capture_output=True, text=True
            )
            self.assertEqual(res_check.returncode, 0, f"check_theme failed: {res_check.stdout}")
            self.assertTrue(report_file.is_file())
            report = json.loads(report_file.read_text(encoding="utf-8"))
            self.assertEqual(len(report.get("errors", [])), 0)

            # 2. Run package_theme
            zip_dest = tmppath / "my-theme.zip"
            res_pkg = subprocess.run(
                [sys.executable, str(pkg_script), str(theme_dir), str(zip_dest)],
                capture_output=True, text=True
            )
            self.assertEqual(res_pkg.returncode, 0, f"package_theme failed: {res_pkg.stderr}")
            self.assertTrue(zip_dest.is_file())
            self.assertGreater(zip_dest.stat().st_size, 100)

if __name__ == '__main__':
    unittest.main()
