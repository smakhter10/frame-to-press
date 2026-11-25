# Troubleshooting

Issues are grouped by stage. Where a fix depends on the generated theme or
the target WordPress site, the FrameToPress references named in each section
are the authoritative detail.

## Skill installation and discovery

**The agent doesn't recognise the skill.**
Confirm the folder is named exactly `frame-to-press`, sits in the agent's
skills directory, and has `SKILL.md` at its root. Run
`python frame-to-press/scripts/validate_skill.py frame-to-press` — it checks
the frontmatter, the folder-name match, and that every file referenced from
`SKILL.md` exists. Then invoke the skill explicitly (`/frame-to-press`,
`$frame-to-press`, or by name) rather than relying on automatic matching.

**The agent can read the skill but can't do the work.**
The workflow needs filesystem access and shell execution. A chat-only model
cannot audit a project, build assets, or test a theme. Use a coding-agent
environment (Claude Code, Codex, Antigravity, or similar).

**Installer says the destination already exists.**
A previous copy is installed. Re-run with `--force` — the installer moves
the old copy to `frame-to-press.backup` first — or remove the old folder
manually. If a `.backup` already exists, the installer stops; move it aside
yourself.

## Source audit and conversion

**Missing source assets.**
The audit (`audit_project.py`) inventories what is present; it cannot invent
what is not. Missing images, fonts, or licensed assets must be supplied or
replaced with the owner's approval — the skill forbids fabricating them.
Build output alone (e.g. only a `dist/` folder) may lack the authoring
source needed for a faithful conversion.

**Build errors in the source project.**
Build the source with its own toolchain first and resolve missing
dependencies or lockfile problems there. Do not let the agent enqueue
development-server paths or skip a failing build and claim parity.

**Routes or interactions missing after conversion.**
Compare against `CONVERSION-MAP.md` — every source route should appear with
a status. Server-side features (Next.js server actions, auth, private APIs)
cannot be replicated by a theme alone and should be listed as scoped
integrations or limitations, not silently dropped.

## Generated theme in WordPress

**Theme activation fails / "stylesheet is missing".**
Run `python frame-to-press/scripts/check_theme.py /path/to/theme` — it
verifies `style.css` (with a valid Theme Name header), `functions.php`, and
`index.php`, and lints PHP/JS. Also confirm you uploaded the **theme** ZIP
produced by `package_theme.py`, not this skill repository — the skill ZIP
must never be uploaded as a theme.

**Broken asset URLs or unstyled pages.**
Assets must be referenced with WordPress URL helpers
(`get_template_directory_uri()`, `home_url()`) and enqueued with
`wp_enqueue_*`, not hardcoded relative paths. Check for raw `.html` links
left over from the source — navigation should use WordPress permalinks.

**JavaScript animations don't run, or run twice.**
Preserve the original initialisation order and dependencies (GSAP,
ScrollTrigger, etc.), avoid duplicate library enqueues, and make sure the
visual editor's preview iframe does not initialise the page's app a second
time. See `references/MIGRATION.md` and `references/REFERENCE-CODE.md` in
the skill package.

## Visual editor

**Publish reports success but changes vanish on reload — or "0 elements".**
This is the known serialization failure the skill is built to prevent: edit
maps must serialize as JSON objects (`{}`), never arrays (`[]`). Check that
both the PHP and JS sides normalise records before merging/saving, and that
Publish performs an independent readback before reporting success. See the
persistence contract in `references/VISUAL-BUILDER.md`.

**Visual editor save failures.**
Work through the save path: (1) is the user authorized (default capability
`edit_theme_options`)? (2) is the nonce valid? (3) can the server write the
generated CSS — a read-only theme directory must fall back to the uploads
stylesheet and surface the error, not fail silently? (4) does readback
return the saved values? Keep the preview in place on error; a failed save
must never be reported as published.

**Edits apply on desktop but not tablet/mobile (or vice versa).**
Device overrides compile into `@media (max-width: 1024px)` (tablet) and
`@media (max-width: 767px)` (mobile) blocks by default — or the source
project's own breakpoints if those were adapted. Confirm the editor preview
is a real iframe at the device width (media queries respond to the iframe
viewport, not to a CSS-scaled page), and that the generated stylesheet is
enqueued last with cache busting.

**WordPress permission errors.**
Editor endpoints must reject unauthenticated and under-privileged requests.
If legitimate editors are rejected, check the capability used by the adapted
builder code (and that nonce/action names were renamed consistently during
adaptation — a common porting mistake).

**Changes lost after a theme update.**
Expected behaviour per the skill's design: canonical edit records live in
WordPress storage, independent of the theme files, and the managed CSS is
rebuilt from them. If edits were lost, the generated theme likely stored
them only in `style.css` — that is a deviation from
`references/VISUAL-BUILDER.md` and should be reported as a bug in the
generated theme.
