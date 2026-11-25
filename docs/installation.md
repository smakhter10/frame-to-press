# Installation

FrameToPress is an AI coding-agent **skill**, not a WordPress theme or plugin.
Installing it means placing the skill package where your coding agent looks
for skills. Do not upload it to WordPress → Appearance → Themes.

## Skill structure

The installable package is the `frame-to-press/` directory in this repository:

```text
frame-to-press/
├── SKILL.md          Entry point: frontmatter (name, description) + workflow
├── references/       Migration, visual-builder, QA, WP-integration,
│                     reference-code, install, and example-prompt guides
├── scripts/          audit_project.py, check_theme.py, package_theme.py,
│                     validate_skill.py, install_skill.py
└── assets/
    ├── frametopress-v3.2-reference/   Working V3.2 builder PHP/JS/CSS (adapt, don't drop in)
    └── original-guides/               Historical predecessor documentation
```

The folder name matters: `validate_skill.py` requires the directory name to
match the `name:` field in `SKILL.md` (`frame-to-press`).

## Option 1 — bundled installer (recommended)

From inside the `frame-to-press/` package folder:

```bash
python scripts/install_skill.py <platform> [--scope project|user] [--project /path] [--force]
```

- `platform`: `claude`, `codex`, `chatgpt-codex`, or `antigravity`
- Project scope (default) installs to:
  - Claude: `<project>/.claude/skills/frame-to-press/`
  - Others: `<project>/.agents/skills/frame-to-press/`
- User scope installs to:
  - Claude: `~/.claude/skills/frame-to-press/`
  - Antigravity: `~/.gemini/config/skills/frame-to-press/`
  - Others: `~/.agents/skills/frame-to-press/`
- If the destination already exists, the installer stops. Re-run with
  `--force` to move the old copy to `frame-to-press.backup` and install the
  new one.

## Option 2 — manual copy

Copy the whole `frame-to-press/` folder (containing `SKILL.md`) into the
location from the table in the root README for your agent, keeping the folder
name `frame-to-press`.

## Option 3 — client Skills UI

Claude.ai and ChatGPT offer Skills settings where a custom skill can be
imported (typically as a ZIP of the package). Vendor UIs change over time —
follow the vendor links listed in
[`frame-to-press/references/INSTALL.md`](../frame-to-press/references/INSTALL.md)
rather than any screenshot.

## Verify the installation

1. Check the package itself is valid:

   ```bash
   python frame-to-press/scripts/validate_skill.py frame-to-press
   # Expected: PASS: skill structure, metadata, references
   ```

2. Confirm the folder sits in your agent's skills directory with `SKILL.md`
   at `.../skills/frame-to-press/SKILL.md`.
3. In the agent, invoke it explicitly the first time — for example
   `/frame-to-press` (Claude Code, Antigravity) or `$frame-to-press`
   (Codex) — or name the skill in your request, and confirm the agent loads
   the workflow before starting.

Note: a chat-only model without filesystem and shell access cannot execute
this workflow, even if the skill text is visible to it.

## Update

Re-run the installer with `--force` (your previous copy is kept as
`frame-to-press.backup`), or replace the folder manually with the newer
package, then re-run `validate_skill.py`.

## Remove

Delete the `frame-to-press/` folder from the skills directory (and the
`.backup` folder, if one was created). Removing the skill does not affect any
WordPress theme the agent previously generated — those are independent
projects.
