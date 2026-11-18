# Universal Custom Website → WordPress Theme + Built-in Visual Builder

**Implementation blueprint · Based on the inspected frametopress WordPress Theme V3.2**  
**Purpose:** Convert an existing custom-coded website (React/Next.js, Vue, vanilla HTML/CSS/JS, or another frontend) into an installable WordPress theme **without casually redesigning it**, while adding a lightweight front-end visual editor with device-specific design controls.

> **Scope and accuracy:** This is a reusable engineering specification, not a claim that an arbitrary React application can be losslessly transformed by renaming files. The development team must inspect and adapt the actual source code, dependencies, routing, dynamic data, and hosting environment. The V3.2 visual-editor behavior below was verified against the supplied frametopress theme source; the generalization to other stacks is a recommended design process.

---

## 1. Product definition

### Outcome

An installable ZIP containing a self-contained WordPress classic theme (or an explicitly justified hybrid) that:

1. Preserves the original UI, responsive rules, content hierarchy, imagery, animation, interactive behaviors, and page navigation as closely as feasible.
2. Uses real WordPress routes, templates, and asset enqueueing.
3. Adds a small **Edit Page** control visible only to users with an explicitly authorized capability.
4. Opens a front-end editor with **Desktop / Tablet / Mobile** device controls and an accurate-width page preview.
5. Lets authorized editors select supported headings, text, images, backgrounds, and buttons; modify content and presentation; preview changes immediately; and **Publish**.
6. Persists published content and styles across refreshes, sessions, anonymous visits, and browser restarts.
7. Does not break WooCommerce, forms, authentication, routing, JavaScript libraries, or dynamic data.
8. Produces errors on failed saves rather than misleading success messages.

### Important limits

The builder is a **visual content/style editor, not a drag-and-drop layout designer**. It does not automatically create new sections or rearrange DOM structures, replace Elementor, edit arbitrary React component state, or change dynamic checkout and inventory data. Those require separate scoped features. For React applications with rich interactivity, keeping compiled React islands or using a hybrid architecture is legitimate and often necessary.

---

## 2. Source-derived frametopress V3.2 reference map

These filenames and behaviors were observed in the **actual V3.2 ZIP** used as the reference.

| File / subsystem | What it does |
|---|---|
| `style.css` | Original theme stylesheet, plus a marked builder-managed CSS section |
| `functions.php` | WordPress setup, page registration, styles/scripts, WooCommerce integration, includes |
| `front-page.php` / `page-*.php` | Original markup rendered in WordPress templates |
| `archive-product.php` / `single-product.php` / category wrapper | Dynamic WooCommerce archive and single-product rendering |
| `inc/shell.php` | Shared header/footer/navigation shell |
| `inc/woocommerce-integration.php` | WooCommerce setup and demo catalog/custom fields |
| `inc/contact-submissions.php` | Saves private form submissions; `wp_mail()` notification; admin records |
| `inc/visual-builder.php` | Builder page IDs, permissions, validation, storage, CSS compilation, AJAX save/load |
| `builder/builder.js` | Selection, editor panel, iframe viewport preview, live changes, publish verification |
| `builder/builder.css` | Editor UI, overlay, device toolbar and preview workspace |
| `pages.css`, `responsive.css`, `shop.css`, `commerce.css` | Page, responsive, catalog and commerce presentation |
| `script.js`, `shop.js` | Original site animations and catalog interactions |

### Actual V3.2 behaviors to reproduce

- Logged-in authorized editor launches **Edit Page** on the frontend.
- Preview is a same-origin **iframe**; device widths are **1280px desktop, 820px tablet, 390px mobile**. The iframe viewport—not a CSS transform—triggers media queries.
- Published base/desktop rules apply generally. Tablet rules use `@media (max-width: 1024px)`; mobile rules use `@media (max-width: 767px)`. Mobile inherits tablet overrides unless it defines its own value.
- Text and replacement image URL/alt are **shared across devices**; most style controls are device-specific.
- A page-specific body scope class, structural element paths, allowlisted CSS values, and generated selectors prevent edits from affecting unrelated pages.
- Persistent styles are compiled to a **managed block in the real `style.css`**. A no-cache CSS endpoint also serves the published rules late in the cascade; preview inline styling is temporary.
- Published records live in WordPress options; saving uses a capability check, nonce, sanitization, revision conflict protection, CSS write, database readback, and a second independent read request.
- WordPress Media Library is used for images; dynamic WooCommerce prices, cart, checkout, inventory and user inputs are excluded from the editor.

**Reference-specific implementation caveats:** V3.2 uses DOM structural paths such as `avb:div.1/section.2/h1.1`. These can break when markup structure changes. **For a new theme, prefer explicit stable `data-vb-id` IDs inserted during template conversion**, with structural paths only as a compatibility fallback. V3.2 also requires theme-directory write permission; treat that as a deliberate product/hosting constraint, not a universal assumption.

---

## 3. Phase A — Discovery before conversion

Inspect the full source tree, not just screenshots. Record:

- Framework/runtime: React, Next.js, Vite, Vue, Svelte, raw HTML, server rendering, hydration and build configuration.
- Routes and corresponding pages, nested route patterns, redirects and 404 behaviors.
- Shared header/footer, menus, components, CSS files, design tokens and responsive breakpoints.
- Images, backgrounds, icon packages, font files or external font services, videos, animation libraries, JavaScript bundles.
- Interactions: dropdowns, modals, filters, forms, accordions, galleries, counters, sliders, animations, dynamic search.
- Data sources: local JSON arrays, REST/GraphQL, CMS, product catalog, authentication, search, checkout, server functions.
- External dependencies and keys; classify secrets and never bake secret keys into frontend assets.
- Existing SEO fields, metadata, canonical links, redirects, structured data, accessibility, forms, and security requirements.
- Functional ownership: what stays editable through the builder, native WordPress, WooCommerce, or separate integrations.

Create a **page inventory and behavior parity matrix** with columns: source route, WP route/template, original component, assets, responsive states, interactions, dynamic integrations, editor eligibility, and acceptance status.

Do **not** begin conversion until the source dependencies and design-critical assets are understood. If assets or credentials are unavailable, identify the blocker; do not replace them with unrelated stock assets or invented business data.

---

## 4. Phase B — Choose the conversion strategy per page/component

| Source | Suitable strategy | Notes |
|---|---|---|
| Static HTML/CSS/JS | Direct PHP template adaptation | Keep DOM/class structure and working JS |
| React landing pages with mostly static content | Render page into WP template; preserve needed JS islands | Convert content carefully; compare markup and layout |
| React with complex component state | Bundle React as an isolated frontend component | Mount after WordPress output; do not pretend PHP replaces React state |
| Next.js SSR, auth, server actions | Hybrid architecture or explicit rewrite | WP theme alone cannot reproduce these features automatically |
| Tailwind / Sass / CSS modules | Compile source CSS into distributable assets | Preserve class names and build outputs; no runtime Node dependency for visitors |
| External API / database app | Server-side WP integration or retained API | Preserve permissions and data handling |
| Commerce | Native WooCommerce when requested | Use WC models, hooks, product types and templates; avoid hardcoded dummy catalog |

Default to a **classic PHP theme** when the supplied visual design uses custom HTML structures and needs this particular editor. A block theme can also be valid, but its template/editing mechanics differ; do not mix the two unintentionally.

### Design fidelity contract

- Retain original classes and markup where possible; do not reimagine layout.
- Preserve fonts, weights, tracking, colors, spacings, border radius, shadows, transitions, animation timing and responsive grid behavior.
- Translate internal links with `home_url()`, `get_permalink()`, `get_term_link()` or comparable WordPress helpers.
- Enqueue scripts/styles with WordPress APIs, including dependency order and reliable asset versioning.
- Keep accessible labels, `alt` text, meaningful hierarchy, keyboard focus, reduced-motion support where practical.
- Run side-by-side screenshots at desktop/tablet/mobile and fix differences before declaring parity.

---

## 5. Recommended installable theme structure

```text
brand-custom-theme/
├── style.css                      # WordPress theme header + original styles + managed rules
├── functions.php                  # Setup, enqueues, includes
├── index.php                      # Required fallback
├── front-page.php                 # Homepage
├── page.php                       # Generic page fallback
├── page-about.php                 # Example page template
├── header.php / footer.php        # Or shared inc/shell.php
├── single.php                     # If blog/posts exist
├── archive.php                    # If archive required
├── single-product.php             # Only when WooCommerce is requested
├── archive-product.php            # Only when WooCommerce is requested
├── inc/
│   ├── theme-setup.php
│   ├── visual-builder.php         # PHP editor backend
│   ├── content-adapters.php       # Stable editable data attributes/helpers
│   ├── woocommerce.php            # Optional
│   └── contact-submissions.php    # Optional
├── builder/
│   ├── builder.js                 # Selector, controls, device preview, publish
│   └── builder.css                # Editor UI
├── assets/
│   ├── css/                       # Compiled original responsive styles
│   ├── js/                        # Compiled original JavaScript / React islands
│   ├── images/
│   └── fonts/                      # Only appropriately licensed assets
└── README.md
```

The ZIP must contain **one properly named root theme directory**. Use unique function, class, JavaScript namespace and WordPress option prefixes. A screenshot, unbuilt React source, or empty theme skeleton does not meet the delivery requirement.

---

## 6. Phase C — Built-in editor UX

### Entry and session

- Visible floating **Edit Page** action near bottom-right, only for logged-in authorized roles; hide from anonymous visitors.
- Opening editor displays a real rendered page and a clearly separate property sidebar.
- Provide **Desktop / Tablet / Mobile** icons in a visible toolbar and identify the active viewport.
- Provide selection outline, hover highlight, selected element label, publishing feedback, pending-change count, reset controls and close action.
- Use `wp_enqueue_media()` for the Media Library; do not build a second image uploader.
- Saving should occur when **Publish** is clicked, not with every keystroke.

### Selection eligibility

| Type | Content editing | Style editing |
|---|---|---|
| Heading / paragraph / simple text | Plain text content | Font size, weight, family, color, style, alignment, spacing |
| Image | Replace via Media Library, alt text | Width, height, fit, border radius |
| Background image | Replace approved image | Optional background size/position controls |
| Button / link | Label; destination only if explicitly in scope | Font, colors, border, radius, padding |
| Complex dynamic component | Only with explicit adapter | Only safe visual controls |

Use explicit `data-vb-id="home.hero.title"` or another stable key on editable source elements. Build a predictable element identity independent of WP admin-bar DOM, iframe nodes, and unrelated child insertions. For rich markup with nested spans, preserve component structure; do not replace `innerHTML` or erase decorative children when changing text.

**Exclude** login/registration/password fields, checkout, pricing that comes from product data, carts, stock, WooCommerce forms, payment methods, embedded third-party widgets, and arbitrary admin-only markup. Dynamic content should be edited from its rightful source.

### Responsive preview and inheritance

| Device control | Preview frame | Effective styling |
|---|---:|---|
| Desktop | 1280px | Base/desktop settings |
| Tablet | 820px | Desktop + tablet overrides |
| Mobile | 390px | Desktop + tablet + mobile overrides |

Compile the actual stylesheet using:

```css
/* Example ONLY — generated, page-scoped selector */
body.vb-page-42 [data-vb-id="home.hero.title"] { font-size: 130px !important; }
@media (max-width: 1024px) {
  body.vb-page-42 [data-vb-id="home.hero.title"] { font-size: 80px !important; }
}
@media (max-width: 767px) {
  body.vb-page-42 [data-vb-id="home.hero.title"] { font-size: 54px !important; }
}
```

These are **sample** values. Preserve the original site's own breakpoints if different; the three-button editor remains conceptually the same while generated media query breakpoints adapt to the site.

**Device reset** removes only that viewport's overrides, whereas **Reset element** removes all editable overrides for that element. Text and replacement image are shared unless a separate device-content feature is explicitly requested.

---

## 7. Phase D — State model, persistence, and critical bug prevention

### Canonical record shape

Every edited page has a stable page key and a JSON **object keyed by stable element IDs**:

```json
{
  "home.hero.title": {
    "type": "text",
    "text": "GOOD VYBEZ ONLY.",
    "style": { "fontSize": 130, "fontWeight": 800, "color": "#ffffff" },
    "responsive": {
      "tablet": { "fontSize": 80 },
      "mobile": { "fontSize": 54 }
    }
  },
  "home.hero.photo": {
    "type": "image",
    "url": "https://example.com/wp-content/uploads/photo.webp",
    "alt": "Botanical leaf",
    "style": { "objectFit": "cover", "borderRadius": 24 }
  }
}
```

**Non-negotiable bug regression:** In the frametopress V3.0 editor, PHP's empty array became JavaScript `[]`; string-keyed edits attached to that array were **omitted by `JSON.stringify`**, so Publish sent zero records despite a working preview. Ensure empty dictionaries serialize as `{}` on PHP and JavaScript sides. Validate `!Array.isArray(edits)`. Never use an array as a key-value edits dictionary.

### Editor state machine

1. Fetch canonical published edits and revision.
2. Select an element and identify it by stable key; create an editable record.
3. Preview changes locally; maintain a clear `pending` map separate from `published`.
4. When switching device, snapshot visible fields for the current device before rendering the next device's fields.
5. On Publish, **snapshot actual visible controls again**, even if input/change events did not fire.
6. Build complete save payload from `published + pending`, including resets; validate element count.
7. Reject accidental empty publish; explicit reset-all is the only allowed empty save.
8. POST with admin authorization, nonce, page key, expected revision and JSON.
9. Server validates, normalizes, sanitizes and writes the new CSS/storage.
10. Server responds with canonical saved records, count and new revision.
11. Independently GET the saved records; compare normalized structures with the submitted data.
12. Refresh the published CSS and compare at least the selected visible style to the intended value.
13. **Only then** clear pending state and discard temporary preview styles. Otherwise keep preview and report a clear failure.

### Where to store the styles

The **frametopress V3.2 reference** persists records in `wp_options` and writes validated CSS into a managed section of the **theme's existing `style.css`**. Reproduce this when direct original-file editing is an explicit requirement, but **never rewrite unrelated CSS**.

```css
/* VISUAL BUILDER: BEGIN MANAGED RULES */
/* generated page-scoped desktop/tablet/mobile selectors */
/* VISUAL BUILDER: END MANAGED RULES */
```

Read the file, verify exactly one valid managed block, regenerate only that block, write a sibling temporary file, and atomically replace the original where supported. Fail clearly if the theme folder or file is not writable. Never chmod everything to `777`, execute arbitrary CSS from user input, or accept arbitrary filesystem paths.

**Production resilience:** Writing a parent theme's `style.css` is fragile on read-only hosts and theme updates. Also, a filesystem write and database update are not a single transaction. Use a backup/rollback strategy, or treat DB records as canonical and regenerate CSS safely after theme updates. For installations where writing to theme files is prohibited, explain this constraint and choose a generated stylesheet under writable uploads or an update-safe child theme **only with the user's agreement**. Never silently claim source-file editing happened if it did not.

### CSS priority / caching rules

- Enqueue base files in order; then generated page-scoped styles **after original theme styles**.
- Use content hash or revision-based cache busting; guard against stale page HTML and CSS optimization plugins.
- V3.2 uses an uncached `admin-ajax.php` CSS endpoint to render published rules after the existing styles; the physical CSS file is still updated. If adapting, monitor latency/caching and consider a generated static stylesheet under approved writable storage.
- Preview inline styles must **never** fight the published stylesheet after reload.
- Do not change the live stylesheet URL late during ordinary page load.
- Dynamic DOM mutations from GSAP/React/third-party components require specialized stable target adapters.

---

## 8. Phase E — WordPress integration and optional dynamic modules

### Baseline WordPress

- Proper theme header, `index.php`, `functions.php`, `after_setup_theme`, and `wp_enqueue_scripts`.
- `wp_head()`, `wp_footer()`, `body_class()`, and semantic `wp_body_open()` integration.
- WordPress page types and template hierarchy; real nav/permalink URLs.
- Images/links escaped on output; edited input validated and sanitized on save.
- Do not expose the editor or write endpoints to public users.
- Do not move site operations and content into arbitrary shortcode hacks unless necessary.

### WooCommerce (conditional)

If ecommerce is part of the source:

1. Check for WooCommerce support on admin activation and page render; show an actionable admin notice when missing.
2. Add `add_theme_support('woocommerce')` and use WooCommerce products, categories, attributes, pricing, stock and template hooks.
3. Preserve original Shop, Product Detail, Cart and Checkout designs while retaining native cart, order, coupon, shipping and payment logic.
4. Add custom product metadata through WooCommerce fields where the source needs supplementary editorial labels; do not invent required product fields.
5. If asked, import **clearly labeled demo** products/categories idempotently (use deterministic SKUs, never duplicate or overwrite existing content).
6. Exclude live prices, purchase options, payment forms, carts and order records from the visual builder.

WooCommerce Cart/Checkout Blocks and classic shortcode templates are not identical; test the site actually installed. Prefer WooCommerce hooks and supported overrides over copying whole plugin templates where unnecessary.

### Contact submissions (conditional)

If a contact form is part of the website, implement WordPress-side processing with:

- `admin_post_*` (or a similarly appropriate REST/AJAX endpoint), nonce, server-side validation, sanitization, honeypot, sensible rate limit.
- Save submissions as a private custom post type or suitable custom table with restricted dashboard access.
- Send email via `wp_mail()`; show truthful mail-acceptance status but don't treat it as confirmed inbox delivery.
- Dashboard view, delete, trash, bulk delete, and clear retention/privacy policy.
- Form success/failure feedback; no false “sent” message when only storage succeeded.

---

## 9. Phase F — Security and stability requirements

- Capability check on **every** write: `current_user_can()` with an appropriate capability. frametopress V3.2 uses `edit_theme_options`.
- Nonces for write requests, but do not mistake them for authorization.
- Sanitize all records server-side; allowlist CSS property names, units, values, color formats, fonts, image URLs, text length and element identifiers.
- Escape dynamic output (`esc_html`, `esc_attr`, `esc_url`, and context-appropriate escaping).
- Avoid `eval()`, untrusted HTML execution, arbitrary JavaScript/CSS injection, unsafe file-path edits and writable theme file permissions beyond what is needed.
- Guard form submissions and email headers against injection; save before email, report failures honestly.
- Explicit role-based editing and prevention of editing secure/dynamic third-party elements.
- Do not publish site secrets, API credentials, internal source maps or license-protected resources.
- Preserve backups and include a recovery strategy for corrupt CSS, failed disk writes and plugin incompatibilities.

---

## 10. Acceptance tests (must all pass)

### Design fidelity

- [ ] Site opens with no PHP fatal errors, white screens, or missing assets.
- [ ] Home and every inner page match the source at representative screen sizes.
- [ ] Existing desktop/tablet/mobile interactions and animations still work.
- [ ] WordPress links, menus, fonts, images, forms, scroll behavior and page transitions behave correctly.

### Builder and persistence — critical

- [ ] Anonymous users **never** see Edit Page or gain write permissions.
- [ ] Authorized editor can select heading, image and button without accidentally targeting admin bar or dynamic checkout.
- [ ] Change a source heading from **183px to 160px**; pending count becomes **1**; publishing returns **1 saved**, not zero.
- [ ] Refresh with builder JS disabled: CSS still applies.
- [ ] Refresh in a private browsing window: published CSS still applies.
- [ ] 160px remains after late JavaScript/animations run; **no flash-then-revert**.
- [ ] Edit Desktop/Tablet/Mobile sizes separately (e.g., 130 / 80 / 54px); each survives refresh at its respective viewport.
- [ ] Switching devices before Publish retains unpublished changes on every device.
- [ ] Reset Mobile does not erase Desktop/Tablet styles.
- [ ] Reset entire element removes that element's overrides while preserving other elements.
- [ ] Text, images, alt text, buttons, color and radius changes survive refresh.
- [ ] When server reports zero saved or mismatched data, editor shows **error** and preserves preview.
- [ ] Editor content and pricing exclusions work on WooCommerce pages.

### Release checks

- [ ] `php -l` passes every PHP file.
- [ ] JavaScript parses; build assets are included in ZIP.
- [ ] ZIP is valid and contains exactly one theme root folder.
- [ ] Local WordPress staging activation tested, including dependencies.
- [ ] Browser smoke tests cover every page and 360/390/767/820/1024/1280px widths.
- [ ] Console/network check shows no missing CSS, JS, font, image, failed AJAX or CSP errors caused by the theme.
- [ ] Published CSS persists through a realistic cache and theme-update restoration scenario.
- [ ] Final README includes installation, hosting permissions, editor use, limitations, backups, and known unverified cases.

**Honesty standard:** Syntax tests, isolated PHP harnesses and headless Chromium are valuable but **not a substitute for a real WordPress installation and device/browser verification**. Explicitly distinguish what was tested and what remains untested.

---

## 11. Hand-off package

Deliver:

1. **Installable WordPress theme ZIP** — source + compiled production assets.
2. **Source package or tracked repository** — for development and future updates.
3. **README.md** — installation, dependencies, builder editing instructions, breakpoints, storage model, permissions.
4. **Source-to-WordPress conversion matrix** — routes, templates, dynamic components and behavioral parity.
5. **QA report** — commands/tests run, screenshots and unresolved limitations.
6. **Migration guide** — which original data maps to WordPress, WooCommerce, metadata, or external services.

---

## 12. Recommended improvements beyond the exact V3.2 reference

These are **engineering recommendations**, not features already proven in the inspected V3.2 package:

- Prefer explicitly authored stable `data-vb-id` values over DOM sibling paths.
- Put reusable builder engine in a companion plugin for theme-switch portability, while the theme provides styling and editable adapters; if the task requires a truly self-contained theme, package it within the theme instead.
- Add undo/redo and versioned edit history for safer editorial use.
- Separate CSS generation from theme files when deployment uses immutable/read-only directories.
- Use automated visual regression across critical routes and screen sizes.
- Add layout/visibility controls per device only when explicitly authorized; keep this separate from typography and other style overrides.

---

## 13. Official reference documentation

- WordPress Classic Theme Templates: https://developer.wordpress.org/themes/classic-themes/basics/template-files/
- WordPress Template Hierarchy: https://developer.wordpress.org/themes/classic-themes/basics/template-hierarchy/
- WooCommerce Classic Theme Development: https://developer.woocommerce.com/docs/theming/theme-development/classic-theme-developer-handbook/
- WooCommerce Template Overrides and Hooks: https://developer.woocommerce.com/docs/theming/theme-development/template-structure/

**Reference implementation:** `frametopress-woocommerce-theme-v3.2-responsive-builder.zip`, specifically `inc/visual-builder.php` and `builder/builder.js`. Examine the original files if provided; this blueprint does not replace source review.
