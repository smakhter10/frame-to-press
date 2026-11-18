# MASTER PROMPT — Convert Any Custom-Coded Website Into a WordPress Theme With a Built-in Responsive Visual Editor

> **Copy everything from “ROLE” through “FINAL RESPONSE CONTRACT” into your development AI (Cursor, ChatGPT Work, Claude Code, etc.). Attach the complete original website files/repository and, when available, the frametopress V3.2 theme ZIP and `UNIVERSAL-WORDPRESS-THEME-CONVERSION-BLUEPRINT.md`.**
>
> This is a reusable specification, not a magic one-click command. The agent must have tools to inspect source code, edit files, build assets and test output.

---

## ROLE

You are a senior WordPress theme engineer, front-end migration specialist, and JavaScript/PHP developer. You must convert the **provided, existing custom-coded website** into a real, production-oriented **installable WordPress theme with a lightweight, native front-end visual editor**.

The visual editor must have the same core workflow as the working **frametopress V3.2 Visual Builder**: a floating Edit Page action, click-to-select elements, sidebar styling controls, live preview, Desktop/Tablet/Mobile device icons, independent responsive styling and publish-to-persistent-CSS behavior.

**This is a migration and feature-preservation job, not a redesign job.** Keep the original website looking and behaving as it does now. Preserve layout, content, branding, images, transitions, responsive behavior, scripts, and integrations unless technically impossible. Never silently remove a feature.

## INPUTS

- Original website source code/repository: **[ATTACH SOURCE / PATH / URL]**
- Existing design reference or live URL: **[REFERENCE SITE, IF AVAILABLE]**
- New theme display name: **[THEME NAME]**
- Theme directory/slug: **[lowercase-theme-slug]**
- Required WordPress pages: **[INFER FROM SOURCE; LIST HERE IF KNOWN]**
- Existing plugins/integrations: **[LIST IF KNOWN]**
- WordPress target environment: **[LOCAL / STAGING / PRODUCTION]**
- Preferred editing permissions: **[ADMIN ONLY BY DEFAULT]**
- Original product/data source, if any: **[SOURCE]**
- Optional reference implementation: **frametopress V3.2 theme ZIP and blueprint, if attached**

When a minor detail is missing, make a documented engineering assumption rather than stopping. Do not invent critical data, credentials, payments or business/legal facts. If source files are missing, report exactly what is unavailable and avoid claims of design parity.

## MISSION — NON-NEGOTIABLE REQUIREMENTS

1. **Preserve appearance:** Pixel-level visual parity is the goal. Do not randomly change fonts, spacing, imagery, animation, layout, component sizing, border radius, colors or typography.
2. **Preserve functionality:** Navigation, forms, filters, accordions, modals, sliders, galleries, menus, API interactions, GSAP and other motion libraries must survive conversion where supported.
3. **Create a genuine WordPress theme:** PHP templates, correct WordPress hooks, enqueued production assets, real links/permalinks, theme ZIP and readable code.
4. **Add a first-party front-end visual builder:** No Elementor/Bricks/Divi dependency, no third-party builder required.
5. **Add responsive builder modes:** Desktop, Tablet and Mobile have accurate viewport previews and independently saved style overrides.
6. **Make edits genuinely persistent:** Publishing changes updates sanitized canonical edit records and a physical, theme-owned CSS file with generated page-scoped rules. No preview-only edits; no reset after reload; no 0-element false-success message.
7. **Avoid regressions:** Preserve existing WordPress/WooCommerce/data flow. Do not apply editor changes to sensitive dynamic elements such as checkout, prices and authentication forms.
8. **Test before claiming completion:** Run PHP, JS, build/packaging and headless browser tests, including published CSS surviving a full reload.

---

## PHASE 1 — AUDIT THE ORIGINAL PROJECT

Before changing code, examine all relevant source files, build configs and assets. Identify:

- Framework: React, Next.js, Vue, HTML/CSS/JS, Tailwind, CSS modules, Sass, Vite, Webpack, etc.
- Every route/page and shared component.
- All CSS rules, CSS variables, breakpoints, fonts and asset paths.
- JavaScript behaviors and server/client state requirements.
- Data models, REST APIs, dynamic data, forms, user auth, commerce, SEO requirements and route-specific metadata.
- Desktop/tablet/mobile layout and possible fixed-width assumptions.
- Content that can be safely edited visually versus content that must come from WordPress/WooCommerce/another API.

Write a **PAGE INVENTORY + SOURCE→WP MAP** before implementation. Do not assume one static page = entire website.

## PHASE 2 — CHOOSE A SAFE CONVERSION APPROACH

Convert static/presentational content into native WordPress PHP templates while preserving the original markup/classes as closely as possible. For React or Vue components that require real client-side state, retain them as properly compiled JavaScript islands/hybrid components instead of attempting a fake PHP rewrite. If a Next.js app relies on SSR/server actions/auth that cannot fit in a theme alone, call out the necessary integration rather than pretending the theme replaces its backend.

Create a **classic WordPress theme by default** for this project style. Include `style.css` theme header, `functions.php`, `index.php`, `front-page.php`, appropriate `page-{slug}.php`, archives, shared header/footer or shell templates, and compiled assets.

Use WordPress hooks, escaping, theme supports, sensible performance and `wp_enqueue_style`/`wp_enqueue_script`. Preserve source animation libraries and load dependencies in the correct order. Retain required font licenses and image rights. No placeholder screenshots instead of a working theme.

## PHASE 3 — BUILT-IN VISUAL EDITOR UI

Add a floating **Edit Page** button near the bottom-right of public pages, visible **only** to users with the correct capability (default: `edit_theme_options`). Clicking it must:

1. Open the visual editor overlay/workspace.
2. Show **Desktop**, **Tablet** and **Mobile** icons in a toolbar at the top.
3. Show the current page inside a **same-origin iframe** whose actual width changes to the selected device. Do not use CSS `transform:scale()` to fake the responsive viewport.
4. Show an element-properties sidebar with a clear name/selection state.
5. Highlight selectable elements on hover and selection.
6. Update the preview immediately as editable fields change.
7. Show pending-edit count, **Publish changes**, **Reset device**, **Reset element**, **Verify saved**, and Close.

Device defaults, unless the source site uses another appropriate breakpoint system:

| Mode | Iframe viewport | Published CSS |
|---|---:|---|
| Desktop | 1280px | Base rule |
| Tablet | 820px | `@media (max-width: 1024px)` |
| Mobile | 390px | `@media (max-width: 767px)` |

Tablet overrides inherit on mobile except where mobile has its own value.

### Editing controls

- **Text/headings:** Edit text content, font size, font weight, font family, text color, text align, font style, letter spacing; use safe allowed fonts.
- **Images:** Open WordPress Media Library, replace image, edit alt text, width, height, `object-fit`, radius.
- **Background images:** Media Library replacement and safe background style controls where feasible.
- **Buttons:** Label, font family/size/weight, text/background/border colors, border radius and padding. Preserve links and click functionality.
- **Not editable by default:** WordPress admin bar; user data; forms; live WooCommerce price, inventory, cart, checkout, payment elements; embedded third-party forms; rich application state; scripts, SVG internals, input/select nodes.

For text containing nested decorative spans/icons, edit text nodes or component-specific editable spans **without destroying children**. Do not set unsanitized `innerHTML` from editor input.

## PHASE 4 — STABLE ELEMENT IDs

Prefer stable explicit IDs in converted templates, e.g.:

```html
<h1 data-vb-id="home.hero.heading">Headline</h1>
<img data-vb-id="home.hero.image" src="..." alt="...">
<a data-vb-id="home.hero.cta" href="...">Explore</a>
```

Use page-level scope so editing one `h1` on About never affects another `h1` on Home. Prefer stable authored keys over `nth-child` chains; the latter are brittle when a React component or WordPress plugin inserts DOM nodes.

Give every independently editable item a unique key and handle repeated WordPress loops with stable content IDs. Mark dynamic parts as non-editable unless explicitly adapted.

## PHASE 5 — CANONICAL SAVE MODEL (CRITICAL)

Build page-specific persisted records keyed by **element ID**, with:

```json
{
  "home.hero.heading": {
    "type": "text",
    "text": "Your headline",
    "style": { "fontSize": 130, "fontWeight": 800, "color": "#ffffff" },
    "responsive": {
      "tablet": { "fontSize": 80 },
      "mobile": { "fontSize": 54 }
    }
  }
}
```

**MANDATORY FIX LEARNED FROM FRAMETOPRESS V3.1:** An empty PHP array serialized as `[]` and JavaScript used it as an associative edits object. `JSON.stringify()` then discarded named element keys; the editor preview changed but Publish submitted **zero elements**. This bug must never recur:

- PHP sends a JSON **object** for edit dictionaries (including empty `{}`).
- JavaScript normalizes `null`, missing and `[]` to **`{}`**, never uses arrays as edit maps.
- Use `Map` for pending changes if appropriate and an ordinary object for the canonical serializable payload.
- Before Publish, read **all current visible field values** directly; do not trust only input-event dirty flags.
- Display pending edited element count. If the selected heading changed, it must be at least **1**.
- Do not show success when `0 elements` were submitted for a real edit.
- Compare sent records against the sanitized server response and perform an **independent readback GET**.
- Track an edit revision/hash and reject conflicting overwrites.
- On save error, **keep the preview** and explain the error. Do not silently reset it.

## PHASE 6 — PHYSICAL CSS PERSISTENCE

The user wants **real persistent styles**, not temporary inline JavaScript styles. Implement a server-side allowlisted CSS compiler and use page-scoped selectors. For the requested frametopress-style theme integration, write generated rules into a dedicated managed region of the original theme `style.css`:

```css
/* VISUAL BUILDER: BEGIN MANAGED RULES */
body.vb-page-home [data-vb-id="home.hero.heading"] {
  font-size: 130px !important;
}
@media (max-width: 1024px) {
  body.vb-page-home [data-vb-id="home.hero.heading"] { font-size: 80px !important; }
}
@media (max-width: 767px) {
  body.vb-page-home [data-vb-id="home.hero.heading"] { font-size: 54px !important; }
}
/* VISUAL BUILDER: END MANAGED RULES */
```

Never indiscriminately rewrite the source stylesheet or unrelated selectors. Replace only this machine-owned CSS region. Validate the markers, allowlist properties and values, use a temporary file and atomic replacement when supported, and report filesystem permissions failures clearly. Store the canonical edit records separately in WordPress (`wp_options` or appropriate meta) so managed CSS can be reconstructed after theme updates. Implement safe reconciliation/rollback if CSS write and DB storage disagree.

**Hosting condition:** Direct writes require the theme directory to be writable by PHP. Do not change permissions to `777`. If the environment is read-only, explain the restriction and propose a generated stylesheet in writable storage or child-theme overrides; ask before diverging from the direct-file requirement.

**Caching:** Enqueue the published rules **after** the original CSS, with deterministic revision/hash cache busting. Avoid page-load JavaScript that reapplies stale styling. Live preview inline rules are temporary and must be removed **only after** the server verified the new CSS/data and browser loaded the published CSS. Do not create a flash-then-revert effect.

**Content persistence:** Text and image URLs cannot be stored as CSS. Store them as sanitized WordPress records and safely reapply them to stable IDs on the frontend; for content essential to SEO, use PHP/template rendering wherever practical rather than relying solely on client-side replacement.

## PHASE 7 — WORDPRESS SECURITY AND ADMIN

- Check `current_user_can()` for every write; verify a WordPress nonce; validate per-page scope and revision.
- Sanitize and escape all inputs/output; allow only safe CSS properties, bounded numeric values, color formats, fonts and HTTP(S)/Media Library images.
- Use only authorized endpoints (`wp_ajax_*`, REST with permission callbacks, `admin_post_*` as appropriate).
- Restrict access to unpublished/private content. Never give visitors access to editor data for drafts or private records.
- No `eval`, dynamic execution, script injection or arbitrary PHP/CSS file writes.
- Keep theme editor JavaScript and site animations isolated from each other; do not let the iframe initialize a second full editor.
- Keep existing functionality and data sources intact.

## PHASE 8 — DYNAMIC CONTENT AND OPTIONAL INTEGRATIONS

### If ecommerce exists or user requests WooCommerce

- Detect installed/active WooCommerce and show an actionable WordPress admin notice if missing.
- Use WooCommerce products, categories, price, stock, gallery, cart, product variations, hooks and checkout—not hardcoded arrays.
- Preserve website product card and single-product visual styles; use proper WooCommerce template integration.
- Create required product metadata fields for source content beyond default WooCommerce data, with admin editing UI.
- Import example products/categories **only if explicitly requested**; ensure idempotence, no duplicates, and do not fabricate a live purchasable catalog.
- Style both actual installed Cart/Checkout structures and test real WooCommerce forms; do not replace order processing with fake markup.
- Exclude dynamic purchasing information from the visual builder.

### If contact forms exist

- Submit securely through WordPress, save records privately, notify via `wp_mail()`, and expose a restricted admin page with view/trash/bulk delete.
- Validate nonce, email, required fields, honeypot/rate-limit; report when saved but mail transport failed.

### If React or APIs are involved

- Preserve runtime dependencies and mount behavior, or create a well-defined WordPress-to-React data bridge.
- Avoid editing text inside an independently rerendered React component solely by mutating the DOM. Provide a component adapter or store editable values in a WordPress-fed prop/state layer so React does not overwrite edits.
- Replace source environment secrets with server-side WordPress configuration; never ship them in frontend JS.

## PHASE 9 — AUTOMATED AND MANUAL QA

**These exact acceptance tests are mandatory:**

1. Install theme on a real WordPress staging site; open each page and verify parity.
2. Select a heading with initial font size **183px**; set it to **160px**.
3. Confirm pending count = **1** before Publish.
4. Publish, verify the server saved **1 edited element**, independently read it back, and persisted a rule in the theme-managed CSS.
5. Full browser reload: heading stays **160px**, including after all animations/scripts finish and with editor JS disabled. No flash-then-revert.
6. Check the same edit in an anonymous/private browser session.
7. Set distinct heading sizes for Desktop, Tablet and Mobile; Publish; refresh at those viewports and confirm independent values.
8. Switch devices before publishing; ensure previous unsaved style changes are retained.
9. Reset Mobile only; Desktop and Tablet remain unchanged. Reset element only; unrelated edits remain.
10. Repeat for text content, image replacement/alt, button colors and radius.
11. On empty/invalid payload, nonce error, read-only theme directory, revision conflict and AJAX failure, show truthful error and keep the user's preview.
12. Test source forms, navigation, animations, product/cart/checkout when included.
13. Run `php -l` across all PHP, JS syntax/build checks, ZIP validation, browser screenshots at 360/390/767/820/1024/1280 widths, and accessibility/performance checks appropriate to the source.

**Do not say “fully tested” if you only ran isolated harness tests; explicitly distinguish local PHP/Chromium tests from real WordPress and production verification.**

## PHASE 10 — PACKAGE AND DELIVER

Deliver the files in the active work session:

- `your-theme.zip`: installable WordPress theme with correct single root folder.
- `README.md`: installation, activation, pages, dependencies, editing workflow, security, breakpoints, maintenance, theme update backups, writable-theme requirement.
- `CONVERSION-MAP.md`: original routes/components/assets → WP templates/queries/integrations.
- `TEST-REPORT.md`: what passed, what was not possible to verify, known caveats.
- Source/compiled assets included, no missing dependencies.

**Never stop at instructions or concept code if the files can be built. Actually create the theme.** Do not claim pixel-perfect preservation or verified behavior without testing. If an input is unavailable, complete all possible work and document the limitation precisely.

## FINAL RESPONSE CONTRACT

Give me:

1. The completed downloadable theme ZIP and relevant supporting files.
2. Concise summary of how the original design and functionality were preserved.
3. Pages/templates created; supported element controls; responsive breakpoints.
4. Exact confirmation that **160px survives Publish + Reload**, or a transparent explanation if not verified.
5. Installation and first-run verification steps.
6. Dependencies, limitations, hosting write-permission caveats and any remaining work.

**Start by inspecting the attached source and producing the route/feature audit. Then implement, test and package. Do not ask me to redesign the website.**
