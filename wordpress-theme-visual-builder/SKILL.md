---
name: wordpress-theme-visual-builder
description: Converts an existing React, Next.js, Vue, Vite, static HTML/CSS/JS, or custom-coded website into an installable WordPress theme with high-fidelity design preservation and an integrated frametopress-style frontend visual editor. Use when asked to migrate a working website to WordPress, preserve its interactions and responsive design, add click-to-edit controls for text/images/buttons, create independent desktop/tablet/mobile edits, generate persistent CSS, integrate native WordPress/WooCommerce data, test, and deliver a theme ZIP. Do not use for greenfield WordPress designs without existing source files or for merely describing how WordPress works.
compatibility: Requires agent filesystem access and shell/code execution to inspect and build source files. PHP, Node and a WordPress staging environment are recommended for final verification; Playwright/Chromium optional for browser QA.
metadata:
  version: "1.0.0"
  reference: "frametopress V3.2 Visual Builder"
---

# Convert source website to WordPress + built-in responsive Visual Builder

This skill is a **build-and-verify workflow**, not a prose answer. When the user provides a website's source or working repository and requests a conversion, produce a real installable WordPress theme and tests. Preserve design and behavior. Use the **working frametopress V3.2 editor pattern** but NEVER reuse its cannabis branding, page content, product data, images, or theme-specific behavior in unrelated sites.

## Inputs and authority

Required: access to the original site source (or downloaded/exportable source plus its assets). Useful: target WordPress version, staging credentials, WP-CLI, active plugins, existing site URL, screenshots at three breakpoints. Do not fabricate absent source files, credentials, customer data, legal pages, product prices, or deployment success. If a browser-only website cannot be downloaded faithfully, disclose the limitation and create the best verifiable output.

**Operate end-to-end without unnecessary back-and-forth:** inspect, inventory, choose conversion strategy, implement, validate, fix failures, ZIP, and report results. Ask for credentials or authorization only for actions that cannot be safely performed without them. Never claim “one shot guaranteed” for applications whose backend/auth/payments require access that was not supplied.

## Read the relevant files from this skill

- [Migration strategy and source mapping](references/MIGRATION.md): React/Next/Vue/HTML, routing, shared shells, assets, forms, build outputs.
- [Builder architecture and persistence contract](references/VISUAL-BUILDER.md): edit UI, device iframe, serialization bug, CSS save, review and permissions. **Mandatory whenever implementing the editor.**
- [QA and acceptance test matrix](references/QA.md): how to prove saved changes survive publish/reload, media queries, WooCommerce checks.
- [WordPress features and security](references/WP-INTEGRATION.md): forms, CMS fields, WooCommerce, hooks, security, theme-update strategy.
- [Reference-source adaptation guide](references/REFERENCE-CODE.md): how to adapt bundled frametopress V3.2 code without importing branded functionality.
- [Quick setup across hosts](references/INSTALL.md): Claude, Codex/ChatGPT, Antigravity; platform paths and usage.

The `assets/frametopress-v3.2-reference/` folder contains the **real v3.2 PHP, JS and CSS of the working page builder**. They are **study/porting references, not drop-in generic files**. They have `frametopress_` hooks, specific selectors, options, fonts, and page identification. Adapt and namespace them, keep their persistence and responsive logic, and remove frametopress-only assumptions.

## Core workflow

### 1 — Inventory and baseline

Run `python scripts/audit_project.py /absolute/path/to/source --output /path/audit.json` (read script `--help` for options). Then manually inspect routes and dependencies; do not rely on regex discovery alone. Inventory **all** routes, reusable components, assets, fonts, animations, forms, API calls, product/account data, SEO tags, and desktop/tablet/mobile behavior. Capture before screenshots if browser access exists. Write `CONVERSION-MAP.md` (source route → WordPress URL/template; dynamic dependencies and decisions).

### 2 — Decide implementation per component

- Static HTML/CSS/JS → PHP templates with original classes/assets/scripts preserved.
- React/Vue render-only components → PHP templates or precompiled JS islands depending on required behavior.
- Interactive React components → retain as compiled, correctly enqueued client-side islands with mounting containers.
- Next SSR, server actions, auth, user-specific APIs → retain a backend/API or rebuild with explicitly scoped WP equivalents; **a theme alone does not replicate an unknown backend**.
- Data-driven lists → use the appropriate WordPress custom post type, taxonomy, post meta, options, or WooCommerce records; no hardcoded pretend dynamism.
- Preserve accessibility, semantics, keyboard interactions and responsive breakpoints.

### 3 — Build installable theme

Create a correctly headed `style.css`, `functions.php`, `index.php`, templates for every route (`front-page.php`, `page-{slug}.php`, `single-*.php`, archives as needed), shared parts, compiled and enqueued assets, valid WP permalinks, and no raw `.html` navigation. Use `wp_enqueue_*` and WP escaping / i18n as appropriate. Respect WordPress lifecycle and plugin requirements. Handle missing WooCommerce gracefully, via admin notice and disabled commerce affordances where necessary.

The destination is a **real theme ZIP**, not only code snippets or a mock visual. Do not silently redesign, replace fonts, or delete functionality. Check images are licensed and bundled or referenced appropriately.

### 4 — Build integrated visual editor

Add floating **Edit Page** control only for authorized users (default `edit_theme_options`). Editor: click-to-select static/editable text, images, backgrounds, and buttons; hover/selection outlines; inspector controls; Media Library image picker; Publish, Reset device, Reset element, Verify saved and Close. Mark uneditable dynamic content such as WooCommerce prices, checkout/payment elements and personal information. Use stable `data-vb-id` IDs and page/content identifiers. Do not re-render complex controls with unsafe `innerHTML`.

Add device icons at the top: **Desktop (1280px), Tablet (820px), Mobile (390px)**. Show an actual **same-origin iframe viewport**, not a CSS-scaled approximation. Persist independent device overrides, defaults `@media (max-width:1024px)` for tablet and `@media (max-width:767px)` for mobile, or explicitly adapt to the source breakpoints. Desktop styles cascade downward; tablet inherits into mobile unless overridden.

### 5 — Implement canonical persistence (non-negotiable)

Use page-scoped records keyed by stable element ID. Empty edit dictionaries must serialize as JSON objects `{}` **NEVER** `[]`. The frametopress V3.0 bug was exactly this: JS added keyed properties to an array and `JSON.stringify` dropped them, falsely saving **0 elements**. Normalize legacy PHP/JS representations before any merge, track dirty values, and compute a fresh snapshot from the visible fields on Publish.

Publish transaction must:
1. Validate authorization and nonce, reject invalid or zero-element accidental saves, sanitize CSS values / content / identifiers.
2. Save canonical records in WP and compile scoped desktop/tablet/mobile CSS.
3. Write CSS to a controlled managed section of the theme's `style.css` **when writable** (matching frametopress), with atomic file writing and errors. For read-only/managed themes use a dedicated persistent stylesheet in uploads, and enqueue it last with cache busting. Never silently claim successful writes when they failed.
4. Verify persisted records with an independent readback request (and revision/checksum where possible) before announcing success.
5. Keep preview in place on error; don't discard a user edit or show a false success. The real CSS, not stale JS/inline overrides, must control published style.
6. Restore text and image content safely from canonical storage, and confirm no flash-then-revert. Theme updates must not delete canonical records; document how managed CSS is rebuilt.

Consult [builder persistence reference](references/VISUAL-BUILDER.md) and adapt real `assets/frametopress-v3.2-reference/` implementation.

### 6 — Test with actual outputs, then ship

Run `python scripts/check_theme.py /path/to/theme --json /path/to/report.json` and `python scripts/package_theme.py /path/to/theme /path/output.zip`. Run `php -l` on every PHP file and `node --check` for plain JavaScript where available. Run WordPress/WooCommerce integration and browser tests in staging when access exists. Do not confuse static checks with runtime testing.

**Required regression:** select a heading initially 183px → set 160px → **1 pending** → Publish reports **1 verified** → full reload → computed style remains 160px with editor JS disabled; then check another device has a distinct size under the appropriate media query. Also check button background/radius, text, image, reset device, reset element and public (logged-out) view.

Provide: installable ZIP, `CONVERSION-MAP.md`, `TEST-REPORT.md`, configuration/dependencies, limitations and clear install steps. **If tests fail, fix before claiming completion.** If WordPress runtime is unavailable, clearly separate static checks from unverified site behavior.

## Safety and quality gates

- Never run unknown `npm install` postinstall scripts, execute source scripts, or use credentials without judging trust and permissions.
- Use `current_user_can`, nonces, strict input sanitization, escaping, WP media APIs and CSRF/rate controls for forms. Only a privileged account can publish edits.
- Never make third-party/plugin-controlled checkout, payment, personal data or inventory editable via arbitrary DOM writing.
- Do not write arbitrary user-supplied CSS/JavaScript into theme files; write only allowlisted, selector-scoped declarations compiled server-side.
- Back up existing site before destructive changes, protect existing `wp_options` and media content, and prefer staging deployment.
- If there are broken source features or missing secrets/backend services, list them as blocking or partial parity rather than inventing a pass.

## Completion contract

Deliver a ZIP when possible, real files, a source-to-WP conversion map, and evidence for: appearance parity; responsive pages; interaction parity; editor selection and save/readback; desktop/tablet/mobile CSS; WooCommerce/forms if relevant; security checks. State exactly what remains untested. The skill is successful only when the produced project is **installable and demonstrably functional** to the extent the supplied environment allows.
