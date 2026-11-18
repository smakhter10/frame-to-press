# WordPress, WooCommerce, and secure server behavior

## Core WordPress

Create valid templates and enqueue dependencies with `wp_enqueue_*`; avoid duplicate jQuery/GSAP loading. Use `get_header`, `get_footer`, `wp_head`, `wp_footer`, `wp_body_open` and WP URL helpers. Sanitize/escape text/attributes/URLs; use WP nonce + `current_user_can` for admin editor endpoints. Scope records by page (and by data record for repeatable template content). Ensure no global selector changes other pages.

## WooCommerce (only when needed)

If the input has a catalog and WooCommerce is specified: on activation check active plugin in a way that doesn't fatal when missing, show admin notice linking to installation, do not overwrite existing user products. Use WC products/taxonomies/meta (`wc_get_products`, `WC_Product`, product-category terms), native add-to-cart, variable product controls, stock, price and shipping methods. Preserve classic/Blocks Cart/Checkout compatibility where possible; never fake payment functionality. Data import must be idempotent with SKU/source IDs and no fictional live inventory. Include source-to-WC field map and any custom product metadata with correctly sanitized admin fields. Test native Cart, Checkout, coupons, billing and order validation in staging.

## Forms

If contact/newsletter forms are in the source, implement real validated submission (`admin-post.php`, REST with permission checks or AJAX) and wp_mail with correct recipient and safe Reply-To. If dashboard history requested, implement private CPT/list table with capability-limited view/trash/bulk-delete and no public exposure. Use nonce, honeypot/rate limit, GDPR-aware retention. Mail success does not ensure inbox delivery; optionally recommend SMTP configuration. Never show “sent” if handler failed.

## Permissions and file writing

Filesystem writes to theme's `style.css` can fail on production or be overwritten by updates. Detect and report `is_writable` failures. Controlled CSS compilation must never execute submitted CSS text, arbitrary selectors, filesystem paths or scripts. Use atomic write, backup or revision, and managed markers. Store canonical overrides in WP records, so the file can be recompiled after theme update. Use readable error messages, not silent `@`-suppressed failures without logging.

## Security test shortlist

Unauthenticated save POST denied; role without edit rights denied; invalid/missing nonce denied; invalid selector/URL/color/style rejected; XSS in text escaped; filename/path traversal rejected; checkout/private content excluded; public readback limited to safe display data; server errors don't claim a published change.
