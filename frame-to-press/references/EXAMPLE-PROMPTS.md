# Example requests after the skill is installed

## Standard conversion

> Use `frame-to-press` on the site in this repository. Convert **all** existing pages to a WordPress theme, preserve styling and interactions, implement the built-in responsive page editor exactly as described in the skill, run the QA checklist, and deliver the theme ZIP and test report.

## React/Vite source

> Use `frame-to-press` to migrate the React/Vite project in `./frontend` into a WordPress theme. Preserve all existing class names, assets, animations, routes and responsive styles. For interactive React components, use compiled JS islands where required. The visual editor must save desktop/tablet/mobile overrides persistently and verify reload. Package the WordPress theme.

## Next.js source

> Apply `frame-to-press` to the Next.js repository. First classify routes into static, client-interactive, and server-only. Convert what WordPress can own; preserve necessary backend integration requirements explicitly. Do not claim server actions or authentication work if they haven't been implemented. Add the responsive visual editor and deliver all possible working files with a limitations report.

## WooCommerce project

> Convert the provided storefront into an editable WordPress theme using `frame-to-press`. Use real WooCommerce products, terms, prices, inventory and add-to-cart behavior, keep WooCommerce checkout semantics, implement custom metadata if the original design has extra product fields. Seed only confirmed demo items idempotently. Confirm add-to-cart and page-builder CSS reload in staging.

## Explicit QA focus

> Apply `frame-to-press`, and do not declare completion until you have verified heading 183px → 160px → Publish → hard reload retains 160px, then independently save Desktop 120px, Tablet 80px, Mobile 48px on one element and verify every breakpoint. Report evidence and fail clearly if runtime access is missing.
