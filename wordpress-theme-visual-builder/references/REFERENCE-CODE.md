# frametopress V3.2 reference code — adaptation notes

This skill includes the *working reference implementation* in `assets/frametopress-v3.2-reference/`:

- `visual-builder.php` — WordPress hooks, access control, sanitization, page-scoped edits, media CSS compilation, AJAX save/load, CSS file management.
- `builder.js` — editor UI, target selection, live preview, same-origin iframe device modes, pending edit tracking, verification.
- `builder.css` — panel, toolbar, canvas frame, inspector and device layout.

These are original, complete V3.2 files from the frametopress theme. They are **not generic code** and must be ported carefully. In the source, functions and AJAX names are prefixed `frametopress_vb_`, option names include `frametopress`, editor config is `window.FrameToPressVisualBuilder`, and font allowlist includes frametopress fonts. Change these consistently to a new, collision-resistant project prefix.

## Integration map

1. `require_once get_template_directory() . '/inc/visual-builder.php';` from `functions.php` (use adapted path and prefix).
2. Enqueue the builder CSS and JS and pass scoped config using WordPress `wp_add_inline_script` or equivalent safe localized data.
3. Ensure body has a stable page scope (`data-vb-page` or class selector) and all editable nodes have stable `data-vb-id` identifiers. **Upgrade V3.2's DOM path fallback to explicit IDs where possible**; its auto-generated `avb:` paths can change after markup modifications.
4. Clone the security and save/readback gates, replacing all nonce names/action names; test with and without admin bar.
5. Use the source site's original fonts, not Syne/DM Sans unless actually present. Adapt breakpoints if the site's existing rules differ.
6. Ensure editing iframe is same-origin and does not load a second visual-editor instance. Preserve pre-existing animation and app initialization in preview without duplicate hooks.
7. Replace the reference CSS marker names with project-specific markers. No other builder should own or overwrite the managed block.
8. Store canonical settings in WordPress independently of the physical CSS file so updates/rebuilds can restore them.
9. Use an authorized, explicit list of editable DOM elements; dynamic WooCommerce and embedded secure interfaces must be excluded.

## Known old failures to prevent

- Saved PHP empty array → JS `[]` → named properties discarded by `JSON.stringify` → **0 saved** even when live preview changed. Always normalize to `{}`.
- CSS flash then revert after reload due to stale JavaScript/inline saved styles applying after physical CSS. Have one authoritative published CSS path and avoid applying obsolete saves to style properties.
- `position: sticky` failing due to `overflow: hidden` on a parent. When preserving source design test real scroll behavior.
- Save reporting success when neither CSS file writing nor database readback succeeded. Reject and keep preview.
- Inaccurate responsive preview from CSS scaling, because CSS media queries use iframe viewport dimensions, not transform scale.
- Changing a nested heading via `innerHTML` and destroying spans, icons or animations; edit safe text nodes or explicit child spans.

## What not to import

No frametopress logos, cannabis content, demo products, contact text, page slugs or business/legal material. Do not import `woocommerce-integration.php` or other theme-specific modules unless explicitly relevant and adapted.

## Licensing of examples

Reference files are included as reusable implementation guidance from the user's prior frametopress development workflow. Developers should check third-party JS/CSS/media/font licensing in the target project independently.
