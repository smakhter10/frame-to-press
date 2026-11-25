# Capabilities and limitations

A factual summary of what FrameToPress covers. Three categories are used:

- **Workflow requirement** — the skill instructs the agent to do this and to
  provide evidence; success depends on the project and environment.
- **Verified in this repo** — exercised by the automated tests in `tests/`.
- **Environment-dependent** — only possible when the stated environment is
  provided.

## Capability matrix

| Area | Status | Notes |
|---|---|---|
| Skill package structure validation | Verified in this repo | `validate_skill.py`; run by `tests/test_workflow.py` and CI |
| Source project audit (frameworks, routes, assets) | Verified in this repo | `audit_project.py` against a mock React/Next project in the integration tests |
| Theme static checks + ZIP packaging | Verified in this repo | `check_theme.py` / `package_theme.py` against a mock theme in the integration tests |
| Editor CSS compilation (desktop/tablet/mobile) | Verified in this repo | PHP regression tests: media queries at 1024px / 767px, `!important` rules |
| Edit-record serialization (`{}` never `[]`) | Verified in this repo | PHP regression tests (the V3.0 "0 elements saved" bug) |
| Style sanitization / allowlisting | Verified in this repo | PHP regression tests: clamping, hex validation, payload stripping |
| Static HTML/CSS/JS → PHP templates | Workflow requirement | Preserve DOM, classes, assets; split into templates/shared parts |
| React / Vite sources | Workflow requirement | Presentational → PHP templates; interactive → compiled JS islands |
| Next.js sources | Workflow requirement, partial by nature | Static/exportable routes convert; server actions, auth, SSR need scoped replacements — a theme alone cannot replicate an unknown backend |
| Vue / Svelte sources | Workflow requirement | Same presentational-vs-island decision as React |
| Click-to-edit text/images/buttons | Workflow requirement | Authorized users only; stable `data-vb-id` element IDs |
| Device-specific editing (1280/820/390 iframe) | Workflow requirement | Real iframe viewports, not CSS scaling |
| Persistent publish + readback verification | Workflow requirement | Required regression in `references/QA.md` |
| WooCommerce integration | Environment-dependent | Requires WooCommerce and a staging site; native cart/checkout semantics preserved; payment gateways need sandbox configuration to be tested |
| Forms (nonce, validation, mail, optional submissions store) | Workflow requirement | Inbox delivery depends on the site's mail transport/SMTP |
| Browser visual-parity QA | Environment-dependent | Requires browser tooling (e.g. Playwright/Chromium) and the original site or screenshots |
| WordPress runtime/activation testing | Environment-dependent | Requires a WordPress staging installation; PHP lint is not a substitute |

## Explicit limitations

- **Not a one-click converter.** One prompt can start the workflow;
  one-shot success is not guaranteed for every application.
- **Not a SaaS or hosted service.** Nothing is uploaded anywhere by the
  skill; all work happens in the agent's workspace.
- **No Elementor/Wix parity claim.** FrameToPress provides its own frontend
  editor pattern, scoped to the converted theme.
- **Reference code is not drop-in.** The V3.2 builder files in
  `frame-to-press/assets/frametopress-v3.2-reference/` carry project-specific
  prefixes, selectors, fonts, and page identifiers that must be adapted.
- **Backend parity is bounded by access.** Hidden APIs, credentials,
  licensed assets, and server logic that are not supplied cannot be
  reproduced, and agents must say so.
- **Generated CSS needs the canonical records.** If a generated theme's
  database records are deleted, published editor CSS cannot be rebuilt from
  the file alone; the skill's design stores records independently for this
  reason.
