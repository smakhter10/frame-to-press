# How to install and use this skill

## What this is

This ZIP is **an AI coding-agent skill**, not a WordPress theme. It teaches a compatible coding agent how to convert *your existing website files* into an installable WordPress theme with an frametopress-style visual page editor. It does not run a conversion by itself and must not be uploaded in **WordPress → Appearance → Themes**.

## Use with coding agents

**ChatGPT / Codex:** According to OpenAI's current skills docs, skills can be selected with `@` in ChatGPT, or with `$`/skill picker in Codex. In a Codex repository, put this folder at `<project>/.agents/skills/wordpress-theme-visual-builder/`. If you have a ChatGPT Skills import/upload UI, upload the entire ZIP; otherwise place the folder in a code-capable workspace using its documented skill installation method. A plain chat without filesystem/build tools cannot install WordPress or compile arbitrary React files just from this skill.

**Claude / Claude Code:** Claude.ai supports importing a custom skill ZIP in the supported Skills settings. In Claude Code use `<project>/.claude/skills/wordpress-theme-visual-builder/` (or `~/.claude/skills/wordpress-theme-visual-builder/`). Invoke `/wordpress-theme-visual-builder` or ask Claude to apply it.

**Google Antigravity:** Put the unzipped skill folder at `<workspace>/.agents/skills/wordpress-theme-visual-builder/`, or in a supported global skills directory. Invoke `/wordpress-theme-visual-builder` or describe the task; Antigravity can automatically match the skill description.

**Other Agent Skills clients:** Install the directory containing `SKILL.md` following the client's own skill discovery rules. Not all chat-only models support file execution, installation, or WordPress testing.

## Typical one-sentence task

> Use the `wordpress-theme-visual-builder` skill. Convert all files in my existing website project into an installable WordPress theme. Preserve the exact design, animations and functionality, build the integrated click-to-edit responsive page editor, thoroughly test persistent Publish/reload, and deliver the ZIP plus a test report. Use staging, not production.

## What to provide

1. Original website project folder or ZIP with assets, source, `package.json` and lockfile if available; do not upload `node_modules` or production `.env` secrets.
2. Live reference URL and/or desktop/tablet/mobile screenshots if available.
3. WordPress staging environment, if you want a real browser integration test.
4. An indication whether you need WooCommerce, contact forms or custom post types.

## Output to expect

The agent should provide `your-theme.zip`, a source-page conversion map, test report, dependency notes and installation instructions. Your WordPress backend will still need business-specific settings, plugins and content configuration where applicable.

## Where to install the generated theme

Once the agent **creates a theme ZIP**: WordPress Dashboard → Appearance → Themes → Add New → Upload Theme → Activate. Do **not** upload this skill ZIP there. Back up the site and test on staging before replacing a live theme.

## Important limitations

- One request can initiate the entire conversion, but **successful one-shot completion is not guaranteed** for every React/Next.js application. Hidden APIs, auth, payments, server rendering and missing licensed assets require integration work and proper access.
- The bundled frametopress builder code is a **reference implementation**. Agents must adapt namespaces, theme CSS, selectors and page structure before running it elsewhere.
- Saved CSS can be lost on theme update unless the theme retains a canonical database record and rebuilds the file; the skill requires both.

## Compatibility documentation (verify if vendors change their UI)

- OpenAI skills docs: https://learn.chatgpt.com/docs/build-skills
- Anthropic custom skills: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Claude Code skills: https://code.claude.com/docs/en/skills
- Antigravity skills: https://antigravity.google/docs/skills
- Open format: https://agentskills.io/specification
