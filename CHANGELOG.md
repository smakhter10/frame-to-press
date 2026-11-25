# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/).
The skill's version is recorded in the `metadata.version` field of
`frame-to-press/SKILL.md`.

## [Unreleased]

### Added
- Professional root `README.md` describing the project, its workflow,
  installation, and limitations.
- `docs/` — installation, quick-start, architecture, capabilities, and
  troubleshooting guides.
- `CONTRIBUTING.md`, `SECURITY.md`, and this changelog.
- GitHub issue templates, a pull request template, and a CI workflow
  (`.github/workflows/ci.yml`) that runs `scripts/run_all_checks.py` on
  pushes and pull requests.

### Notes
- No `LICENSE` file exists yet. A license (MIT has been proposed) must be
  chosen and added by the repository owner before the project can be
  treated as licensed for reuse.

## [1.0.1] - 2026-11-18

Tagged at commit `6ac3539` ("feat: rebrand to FrameToPress and add automated
test suites").

### Added
- Automated test suites: Python tooling integration tests
  (`tests/test_workflow.py`) and the PHP visual-builder regression suite
  (`tests/test_builder_regression.php`).
- Unified check runner (`scripts/run_all_checks.py`).

### Changed
- Project rebranded to **FrameToPress** (skill name `frame-to-press`).

> Version note: the annotated tag message for v1.0.1 reads "Release
> v1.0.0: FrameToPress Agent Skill", and `SKILL.md` metadata still records
> version `1.0.0`. The tag name (v1.0.1), the tag message, and the skill
> metadata therefore disagree. This is recorded here rather than rewritten;
> the maintainer should align them at the next release.

## [1.0.0] - 2026-11-18

Tagged at commit `5458ce6` ("feat: initial release of
wordpress-theme-visual-builder v1.0.0").

### Added
- Initial release of the agent skill (originally named
  *wordpress-theme-visual-builder*): `SKILL.md` workflow, migration /
  visual-builder / QA / WordPress-integration references, source-audit,
  theme-check, and theme-packaging scripts, and the bundled FrameToPress
  V3.2 visual-builder reference implementation.
