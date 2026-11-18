# Acceptance criteria and test report template

## Source parity checks

Capture matching viewport screenshots from the original and theme at desktop ~1440px, tablet ~820px, mobile ~390px and narrow phone ~360px. Compare typography, spacing, breakpoints, images, CTA positioning, sticky elements, colors, shadows and motion. Count and verify every original route and interaction. Build a list of intentional deviations and their reasons.

## Environment verification

1. Run `python scripts/audit_project.py SOURCE --output audit.json` before coding.
2. Build source using its real toolchain, if supported, and note warnings/dependencies.
3. `python scripts/check_theme.py THEME --json report.json` (static only).
4. `php -l` for every theme PHP file; `node --check` for each standalone JS file where applicable.
5. Test a staging WordPress installation via WP-CLI/browser. PHP lint **is not equivalent** to a working WP runtime.
6. Install the ZIP on an empty staging WordPress; activate; confirm home and inner pages render without fatal errors and permalink links work.

## Required editor acceptance

| Test | Steps | Expected |
|---|---|---|
| Empty-record bug | New page, change first heading 183 → 160 | Pending 1, payload a JSON object with one key, verified 1 |
| Publish persistence | Publish then hard reload | Heading remains 160 computed px; public view too |
| JS-independent CSS | Reload with editor JS disabled | Published CSS still applies (text/images may be restored separately) |
| Font weight/color | Change then publish | Reload retained; no flash/revert |
| Button | Change background and radius | Reload retained; original click works |
| Image | Media Library replace | New media URL/alt retained |
| Device-specific | 120/80/48px desktop/tablet/mobile | Correct computed style in each iframe viewport after reload |
| Reset device | Reset mobile only | Desktop/tablet unaffected |
| Reset element | Reset selected element | Its edits gone; other elements preserved |
| Access | Log out | No editor controls/save endpoint access |
| Bad nonce | Send invalid token | Rejected, no new records |
| Failed file write | Set theme CSS read-only in staging | Publish errors, preview preserved; no fake success |
| Two editors | Open two sessions | Revision conflict handled or recent edits safely merged; no silent overwrite |

## WooCommerce, if needed

Verify product list/category filter/details/gallery, price formatting, quantity, native add to cart, stock restriction, cart totals, coupons, checkout flow, payment option UI, and mobile layouts. Do not mark gateway processing tested without a configured sandbox.

## Forms, if needed

Valid/invalid validation, nonce, rate-limited submissions, email status, database persistence, single delete/bulk delete, XSS escaping, mobile layout. Verify `wp_mail` transport separately from inbox arrival.

## Final report format

```markdown
# Conversion Verification
- Source: [path/version]
- Theme zip: [path/checksum]
- Routes converted: [x/y]
- Static checks: [pass/fail]
- WordPress activated and browsed: [yes/no; environment]
- Browser visual comparison: [devices and differences]
- Editor 183→160 test: [pass/fail/not run]
- Device CSS 120/80/48 test: [pass/fail/not run]
- WooCommerce/forms: [pass/fail/not applicable/not tested]
- Remaining blockers / assumptions: [...]
```

Do not label a theme “100% working” after syntax tests only. Supply a staging test note if no runtime was available.
