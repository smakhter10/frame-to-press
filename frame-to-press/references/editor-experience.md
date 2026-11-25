# FrameToPress Visual Editor — Professional Experience Specification

Status: normative skill reference. Applies to every generated editor, independent of website industry or art direction.

## Outcome

Generate a coherent, polished **on-page visual editing interface** that feels like a designed product. Keep its layout, navigation, property structure, control behavior, responsive editing model, and quality standard stable across projects. Adapt the **palette** to each site using a tested, accessible semantic theme, not by transplanting another site's UI branding.

## 1. Shell layout

### Top editor bar

- Compact, fixed editor bar with site/project identity on the left, edit/preview state, responsive device switcher, viewport-width readout, status, Undo / Redo, Save Draft / Publish, and Exit.
- Desktop/Tablet/Mobile controls are a single visually grouped segmented control. Current mode is unmistakably highlighted. Controls have tooltips and accessible names.
- Save/Publish are visually prominent while secondary actions are quiet. The bar works with long site titles and smaller widths.
- Never rebrand the website itself. Editor UI is separable and hidden from public visitors.

### Page stage

- Actual rendered page, not a reconstruction. Keep high-fidelity full-width desktop preview (except for inspector overlay/dock), and constrained viewport simulation for tablet/mobile.
- Allow scrolling and selection while in Edit Mode. Do not let accidental link clicks navigate away. Preview Mode restores ordinary interaction.
- Preserve layout/scroll position when toggling modes where possible.

### Inspector

- A polished floating panel on desktop, with optional dock/undock and minimize controls; intelligently relocate if it would cover selected element. On narrow editors, dock as an accessible side panel or drawer.
- Distinct header with icon, **human readable** element type and nearest section: e.g. `Heading · Hero`, `Image · Product gallery`, `Button · Footer CTA`.
- Clear content grouping with subheadings or tabs: Content / Typography / Appearance / Spacing / Responsive where applicable.
- Label controls visibly. Avoid placeholders as sole labels. Use realistic widths (typically 320–380px) and internal scrolling, not awkward full-page overflow.
- Sticky inspector footer or top action area for relevant reset/save functionality. Provide a clear close/deselect behavior.
- Technical ID/DOM selector available only under optional Developer Details, never the primary title.

## 2. Selection and feedback

- Hover: subtle but visible outline and hover label. Selection: stronger outline, optionally handles or corner marks, distinguishable from hover.
- Use isolated overlay layers or CSS outlines that do not change source element box dimensions. Recompute bounding boxes on scroll/resize/DOM changes without jitter.
- Keyboard: tab to editable elements and activate with Enter/Space; Escape clears selection; a strong visible focus ring. Respect nested interactive elements.
- Inspector should identify current responsive mode and whether properties are inherited or overridden.
- Selection must map to a persistent element ID, not a DOM index or mutable copy.

## 3. Contextual controls

| Selected element | Minimum appropriate controls |
|---|---|
| Text | Editable content, site font options, size with units, weight, color, alignment, line height, letter spacing |
| Image | Media Library, alt text, fit, position, dimensions, remove/restore if supported |
| Button/Link | Label, target URL/action, open-in-new-tab where allowed, fill, text, border, radius, shadow, spacing |
| Section | Background and validated spacing, optional visibility based on structural constraints |
| Video | Media replacement, poster and existing playback flags |
| Product | Data-backed title/description/media/available variants, never fabricated fields |

- Use text fields, sliders or numeric controls with units, select menus, color swatches + accessible text value, and segmented button controls as appropriate.
- Preserve the website's font choices and available weight axes; never show settings the runtime cannot apply.
- Explain inheritance and permit reset to inherit, reset element, reset device (scope clearly shown).
- Don't expose arbitrary executable HTML/CSS/JS or unsafe URLs.

## 4. Adaptive palette: consistent interface, website-specific personality

### Token extraction order

1. Existing CSS variables, Tailwind/theme configuration, component tokens, or WordPress `theme.json`.
2. Reliable computed colors of site surfaces and prominent branded controls.
3. User-supplied brand guide, if authoritative.
4. Neutral accessible defaults if extraction is uncertain.

Produce a small, *semantic* editor UI theme:

```ts
interface EditorTheme {
  brandAccent: string;        // site-derived highlight, validated
  brandAccentText: string;    // readable foreground for accent
  panelSurface: string;       // accessible editor chrome surface
  panelSurfaceAlt: string;
  panelText: string;
  panelTextMuted: string;
  border: string;
  focusRing: string;
  selectionOutline: string;
  success: string;
  warning: string;
  danger: string;
}
```

- UI chrome and selected website content are separate layers. Editor typography is a readable system font; website content retains its own fonts.
- Accent colors adapt to the source brand, but base surfaces and control contrast must remain accessible. Do not blindly use the site's brightest brand color as text on white or its darkest color as a focus border on dark pages.
- Run contrast calculations and adjust accessible foreground/surface combinations. Aim for WCAG AA for normal text and sufficiently visible focus/non-text state indicators.
- Build one reusable visual system: consistent padding (8px base scale or rem equivalent), corner treatments, button sizes, input sizing, hierarchy, and feedback across all generated projects.
- If accent extraction fails, fall back to a calm neutral palette with one readable accent; do not invent unrelated brand colors.
- Never copy a reference screenshot's brand name, wording, product imagery or exact hue unless the source site itself contains those elements.

## 5. Responsive controls: data contract

Keep text/media content globally shared by default, with explicitly per-breakpoint style overrides. Example conceptual structure:

```json
{
  "elementId": "hero.heading.primary",
  "content": {"text": "Find your next favorite"},
  "style": {
    "base": {"fontSize": "3rem", "color": "var(--site-ink)"},
    "tablet": {"fontSize": "2.25rem"},
    "mobile": {"fontSize": "1.75rem"}
  }
}
```

The precise schema should fit source/WordPress architecture. Document breakpoint boundaries, inheritance rules, and how CSS/scoped overrides resolve. Don't silently change shared content when a device-only style is intended. Show the active device label in the inspector.

## 6. Live editing and persistence UX

- Typing shows an immediate optimistic preview; include local Undo/Redo and explicit persistence feedback.
- Never show "Saved" or "Published" before the authenticated server response. Use states like `Unsaved changes`, `Saving…`, `Draft saved`, `Publishing…`, `Published`, and concise actionable error descriptions.
- Disabled/no-op controls are unacceptable: each exposed control must work or be clearly marked unsupported and absent from the normal inspector.
- Handle offline/network failure, expired nonce/session, permission denial, data conflict, invalid media and malformed values gracefully.
- Keep save and publish actions distinct. Allow discard changes or restore previously published values.
- Avoid a visible unfixable "stylesheet out of sync" state; derive applied styles from stored settings or synchronise caches transactionally and automatically. Display a recovery action on genuine sync failure.

## 7. Animation-aware editing

- In Edit Mode, all editable content must become addressable even if animation normally hides or pins it.
- For scrubbed/pinned animated stories, create a deliberate editor scene selector or static vertical representation; merely disabling triggers may leave hidden scenes inaccessible.
- In Preview Mode, restore original layout, trigger measurements, randomisation behavior, interaction states, and animation playback. Refresh motion libraries only when required.
- No overlays should intercept editor toolbar controls or live preview CTA in Preview Mode. Avoid editor UI inducing persistent page overflow or visual drift.

## 8. Performance and boundaries

- Render editor code and API credentials only for authorized users. Public visitor bundles must not include editing UI code.
- Use efficient element overlays, resize/scroll observers, batched updates and cleanup. Avoid constant full DOM rescans or React rerenders for pointer movement.
- Editors have an accessible exit path even when something fails; public page layout should remain intact.
- Never make unsupported promises of Wix/Elementor feature parity. This is a scoped, source-aware frontend visual editor.
