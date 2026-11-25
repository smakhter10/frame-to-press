# Quick start

A practical walkthrough of one FrameToPress conversion, from source project
to a tested WordPress theme.

## 1. Prepare the website source

- Use the original project folder (or a ZIP of it) with its assets and, for
  JavaScript projects, `package.json` and the lockfile.
- Do **not** include `node_modules` or production `.env` secrets.
- If you have them, also provide the live reference URL and screenshots at
  desktop, tablet, and mobile widths.

## 2. Give the AI agent access to the source

Open the project in a coding-agent workspace where FrameToPress is installed
(see [installation.md](installation.md)). The agent needs filesystem access
and shell execution; a plain chat window is not enough.

## 3. Invoke the skill

> Use the `frame-to-press` skill. Convert all files in my existing website
> project into an installable WordPress theme. Preserve the exact design,
> animations and functionality, build the integrated click-to-edit responsive
> page editor, thoroughly test persistent Publish/reload, and deliver the ZIP
> plus a test report. Use staging, not production.

Framework-specific prompts (React/Vite, Next.js, WooCommerce, QA-focused)
are in
[`frame-to-press/references/EXAMPLE-PROMPTS.md`](../frame-to-press/references/EXAMPLE-PROMPTS.md).

## 4. Review the migration plan

Before building, the agent should produce:

- An audit of the source (the skill runs
  `python scripts/audit_project.py /path/to/source --output audit.json`).
- A `CONVERSION-MAP.md`: every source route mapped to a WordPress template,
  its data source, its interactions, and open decisions — especially anything
  server-side (auth, APIs, payments) that a theme alone cannot replicate.

Check the map for missing routes or invented assumptions before approving
the build.

## 5. Review the generated theme

The agent builds the theme, adapts the bundled V3.2 visual-builder reference
code to the theme's namespace and breakpoints, and runs static checks:

```bash
python scripts/check_theme.py /path/to/theme --json /path/to/report.json
python scripts/package_theme.py /path/to/theme /path/to/output.zip
```

Expect the theme ZIP, not just code snippets.

## 6. Test in WordPress

Install the theme ZIP on a **staging** WordPress site (Appearance → Themes →
Add New → Upload Theme), activate it, and walk every route. Back up any site
before replacing its theme; never test a first conversion on production.

## 7. Verify editor persistence

This is the skill's required regression — do not skip it:

1. Open the frontend editor as an authorized user.
2. Select a heading (the skill's reference case starts at 183px), set it to
   160px — the editor should show **1 pending** change.
3. Publish — it should report **1 verified** after readback.
4. Hard-reload the page: the heading must still compute to 160px, including
   with the editor's JavaScript disabled and in the logged-out public view.
5. Repeat a device check: set distinct desktop/tablet/mobile sizes on one
   element and confirm each applies only under its viewport/media query.
6. Spot-check a button (background, radius), a text edit, an image swap, and
   both Reset controls (device and element).

If any step fails, the conversion is not complete — the skill requires the
agent to fix failures before claiming success, and to state plainly whatever
could not be tested in the available environment.
