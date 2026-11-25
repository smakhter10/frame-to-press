# Contributing to FrameToPress

Thank you for helping improve FrameToPress. This project is an AI
coding-agent skill: most contributions touch documentation, the skill
instructions in `frame-to-press/`, the bundled Python tooling, or the tests.

## Reporting issues

- Use the GitHub issue templates (bug report or feature request).
- For bugs, include: what you ran, the agent/client and versions involved
  (Python, PHP, Node, WordPress where relevant), the exact error, and the
  smallest example that reproduces it.
- **Security issues:** do not open a public issue. Follow
  [SECURITY.md](SECURITY.md).

## Proposing changes

1. Fork the repository and create a branch from `main`. Use a descriptive
   branch name, e.g. `docs/<topic>`, `fix/<short-description>`,
   `feat/<short-description>`.
2. Keep changes scoped. FrameToPress's core workflow lives in
   `frame-to-press/SKILL.md` and its `references/` — do not change the
   skill's core functionality, move the skill package, or rename the
   `frame-to-press/` folder in a documentation or cleanup PR. The folder
   name must match the `name:` field in `SKILL.md` for skill discovery and
   for `validate_skill.py` to pass.
3. Update documentation in the same PR when behaviour, paths, or commands
   change. Keep claims accurate: never document a capability, integration,
   or compatibility that is not implemented or verified.
4. Add or update tests for script and builder-logic changes. Do not add
   placeholder tests.
5. Open a pull request against `main` using the PR template, with the test
   results included.

## Running the tests

```bash
python scripts/run_all_checks.py
```

This runs skill validation, Python compilation, PHP and JS syntax checks
(when those tools are installed), the PHP visual-builder regression suite,
and the Python integration tests. All of these also run in CI
(`.github/workflows/ci.yml`) on pushes and pull requests. A PR should not be
merged with failing checks.

Individual pieces:

```bash
python frame-to-press/scripts/validate_skill.py frame-to-press
python -m unittest tests/test_workflow.py
php tests/test_builder_regression.php        # requires PHP
```

## Coding and documentation standards

- **Python:** standard library only for the bundled scripts (no new
  dependencies without discussion); keep scripts runnable on Python 3.9+.
- **PHP:** the reference builder code targets WordPress; keep `php -l`
  clean and preserve the security patterns (capability checks, nonces,
  sanitization, allowlisted values) — never weaken them for convenience.
- **JavaScript:** plain JS, `node --check` clean.
- **Docs:** Markdown, professional and technically accurate tone, short
  paragraphs, verified paths and commands. Distinguish clearly between what
  the skill instructs an agent to do and what has been verified by tests.
- **Terminology:** the project is *FrameToPress*; the skill package folder
  and skill name are `frame-to-press`. Do not describe the project as a
  plugin, SaaS, or one-click converter.

## Versioning

The skill's version lives in the `metadata.version` field of
`frame-to-press/SKILL.md`. Version bumps and release tags are made by the
maintainer as part of a release, not inside unrelated PRs. Record notable
changes in [CHANGELOG.md](CHANGELOG.md) under *Unreleased*.

## License note

This repository does not yet carry a `LICENSE` file (see the License section
of the README). By contributing, you agree that your contribution may be
distributed under the license the owner adopts for the project; ask in an
issue first if that is a concern for you.
