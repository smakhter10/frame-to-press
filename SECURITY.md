# Security policy

## Reporting a vulnerability

Please **do not** report security vulnerabilities in public GitHub issues,
discussions, or pull requests.

Use GitHub's private vulnerability reporting for this repository, if it is
enabled: go to the repository's **Security** tab → **Report a
vulnerability**. That routes the report privately to the repository owner.

If private vulnerability reporting is not available, open a regular issue
asking the maintainer to enable it — **without including any vulnerability
details** — and wait for a private channel before sharing specifics.

No dedicated security email address is published for this project at this
time.

## Scope

FrameToPress is a documentation-and-tooling skill for AI coding agents. The
most security-relevant areas are:

- The bundled Python scripts (`frame-to-press/scripts/`, `scripts/`) —
  e.g. unsafe path handling or archive extraction in tooling.
- The bundled V3.2 visual-builder reference implementation
  (`frame-to-press/assets/frametopress-v3.2-reference/`) — e.g. missing
  capability checks, nonce validation, or sanitization. Note this code is a
  reference for adaptation; reports about how a *generated* theme
  implemented it belong with that theme's maintainer, though weaknesses in
  the reference itself are in scope here.
- The skill instructions themselves, if following them as written would
  lead an agent to produce insecure WordPress code.

## What to include

- A description of the issue and its impact.
- The affected file(s) and, where relevant, versions (skill version from
  `frame-to-press/SKILL.md`, Python/PHP/WordPress versions).
- Steps to reproduce or a proof of concept, kept minimal.

## Response expectations

This is a small open-source project maintained by its owner; there is no
security team or guaranteed response SLA. Reports will be acknowledged and
assessed as time allows, and fixes will be released through the normal
GitHub release process. Please allow a reasonable period for a fix before
any public disclosure.
