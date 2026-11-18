# Responsive Visual Builder: specification and persistence invariants

## Required UX

Authorized staff sees an unobtrusive fixed Edit Page button; clicking opens a same-origin iframe preview with a three-icon toolbar (1280/820/390 px), element outlines, a property sidebar, and Publish/Verify/Reset options. Preserve page navigation outside edit mode. Inspector supports text content, fonts/sizes/weights/colors/line heights, image media replacement/alt/width/height/object-fit, button text/colors/radius/padding/borders. Keep target links intact.

## Key design rule

A CSS transform that visually shrinks the page **does not change the page's viewport**. A real iframe sized to the selected device does. The parent frame owns editor state and WordPress requests. The child page must not initialize a second editor. Use stable `data-vb-id` selectors and an explicit page key, never positional paths as the sole identifier. For repeated products/content use stable content IDs, not index.

## Canonical record structure

```json
{
  "home.hero.title": {
    "type": "text",
    "text": "Discover more",
    "style": {"fontSize": 112, "fontWeight": 800, "color": "#202020"},
    "responsive": {
      "tablet": {"fontSize": 78},
      "mobile": {"fontSize": 44}
    }
  }
}
```

Desktop = base `.style`; tablet `@media(max-width:1024px)` overrides; mobile `@media(max-width:767px)` overrides. Content and media URLs shared, styling device-specific. Never create redundant cross-device changes when selecting or resetting controls.

## Critical serialization fix from V3.1

WordPress `array()` becomes JSON `[]`. Javascript arrays allow non-index properties, but `JSON.stringify` ignores them:

```js
const wrong = [];
wrong['home.hero.title'] = { style: {fontSize: 160} };
JSON.stringify(wrong); // "[]" !!
```

Always use `{}` for edited-element maps and normalize at boundaries:

```js
const asEdits = value =>
  (!value || typeof value !== 'object' || Array.isArray(value)) ? {} : value;
```

In PHP use an object for public JSON dictionaries even if empty: `wp_json_encode((object)$records)`. Validate key shape and count; prevent accidental 0-element publish. Ensure independent readback matches requested saved value.

## Save path and CSS authority

1. UI preview updates (temporary inline CSS permitted **during editing only**).
2. User clicks Publish. Snapshot visible form controls immediately; merge pending records with canonical records (avoid stale async overwrites).
3. POST via nonce-protected WordPress handler, require capability. Sanitize allowlisted numeric ranges, colors, fonts, URLs and text. Restrict CSS selectors to generated IDs, never raw user selector input.
4. Persist record and revision; generate CSS for all affected pages. Use controlled managed section at end of `style.css` if the host allows filesystem writes. Atomic temp + rename and post-write verification. Persist canonical records separately so theme updates can regenerate CSS. If theme is read-only, use a dedicated generated file in uploads with safe enqueue/versioning; make fallback visible rather than silently hiding an error.
5. Serve CSS last after theme responsive sheets. In public mode no stale inline/JS styling overrides. On Publish, independently fetch server records and verify revision/values. On failure, keep preview unchanged and display actionable error.
6. On hard reload (admin and visitor) computed styles match published CSS; no flash-then-revert. Note that image src and text need safe data-driven restoration from records, not CSS.

## Safety exclusions

Never allow visual editing of live prices, stock, checkout, payment fields, personal data, authentication state, hidden tokens, scripts or SVG internals. Restrict authorizations and nonces; do not permit arbitrary PHP, JS or custom CSS. Verify media IDs/URLs and wp_kses when relevant.

## Editor test cases

- Empty edits initial state uses `{}`, Publish 160px yields **1 pending** and **1 saved**; persisted to WP and actual CSS.
- Save request error: no fake success, preview retained, user notified.
- Two elements edited: count 2; both survive readback.
- Desktop 132px; tablet 80px; mobile 48px → desktop/tablet/mobile CSS rules verify in computed style after reload.
- Reset Mobile doesn't delete Tablet/Desktop.
- Text and image replacement persist across all devices; button label doesn't destroy SVG/icon spans.
- Editor not available to logged-out visitor; public content changes render correctly.
- Theme upgrade doesn't wipe DB edits; controlled stylesheet regenerated if needed.
