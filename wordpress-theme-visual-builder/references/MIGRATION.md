# Source-to-WordPress conversion playbook

## Source audit

Inspect package manifests, lockfiles, build scripts, HTML, CSS, public assets, route definitions, API calls and dynamic state. A build output alone may lack the authoring source. Do not claim full parity when backend endpoints or licensed assets are unavailable.

Write a conversion map:

| Source URL/route | WP template or endpoint | Assets/components | Data source | Interactions | Status |
|---|---|---|---|---|---|
| `/` | `front-page.php` | hero, nav | static/editable | GSAP | pending |
| `/about` | `page-about.php` | intro, grid | static/editable | animation | pending |
| `/products/:slug` | `single-product.php` when WooCommerce present | product | WooCommerce | cart | pending |

## Framework decisions

- **HTML/CSS/JS:** Preserve DOM and class attributes, split into PHP templates/shared parts, fix URL/asset resolution, enqueue scripts in correct dependency order.
- **React + Vite:** Inspect router and state dependencies. Presentational pages can become PHP templates; retain complicated components as compiled JS islands mounted into PHP output. Build production assets with original toolchain; do not enqueue development server paths.
- **Next.js:** Static/exportable routes may be rebuilt as WP templates; server actions, edge functions, authenticated SSR and image optimization need explicit replacement integrations. Hybrid iframe and embed strategies are possible only when appropriate to project requirements, not as a shortcut for claiming full WP editability.
- **Vue/Svelte:** Use the same presentational-to-PHP vs JS island decision based on behavior, not the framework name.
- **Tailwind/Sass/CSS modules:** Compile production CSS. Do not silently rename classes or drop responsive utilities.
- **Animations:** Preserve GSAP/ScrollTrigger/Lenis and event initialization; prevent duplicate initialization during visual editing/iframe changes.

## WordPress conventions

Minimal standalone theme: `style.css` with proper theme header, `functions.php`, `index.php`; add `front-page.php`, `page.php`, `page-{slug}.php`, `single.php`, archives and taxonomy templates as needed. Use `get_header`/`get_footer` or custom shared shell with `wp_head()`, `wp_footer()` and `body_class()` preserved. Enqueue via `wp_enqueue_style/script`, not raw arbitrary plugin-incompatible URLs. Use `get_template_directory_uri()`, `home_url()`, `get_permalink()` and WP sanitization/escaping.

## Content architecture

- Static marketing text/images: WordPress page content, post meta, builder records, block fields, or settings as appropriate.
- Repeatable editorial cards: CPT + meta, blocks, or ACF-like native meta—not hardcoded list items.
- Storefront: WooCommerce products/categories and authentic price/stock; never override WooCommerce's security-sensitive cart/checkout logic with the visual editor.
- Forms: WordPress nonce/server handler, `wp_mail()` (requires working mail transport), optional admin submissions CPT/list table. Don't leave front-end fake success messages.
- Third-party API: preserve the integration with actual API credentials supplied through safe configuration, not embedded secrets.

## Parity review

Capture the original and converted site at matching widths; compare page sections, fonts, images, alignment, spacing, animations and interaction flows. Log intentional differences. Check smaller phones, keyboard focus and touch targets. Run `scripts/check_theme.py` and live WP/browser tests before packaging.
