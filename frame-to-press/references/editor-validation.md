# FrameToPress Visual Editor — Acceptance Checklist & Evaluation Rubric

Status: mandatory validation companion to `editor-experience.md`.

## Hard gates (must pass or be reported as failed / unverified)

1. **Source fidelity:** Compare representative original and WordPress-rendered pages at matching viewport sizes. No unrelated changes to text, colors, spacing, assets, animation or routes.
2. **Editor role:** Unauthenticated visitors and unauthorized roles see no Edit Page UI and cannot mutate content via REST endpoints.
3. **Professional editor shell:** Rendered top bar, grouped device toggle, legible status, prominent publish action, large site preview, contextual inspector (float or adaptive dock).
4. **Selection:** Visible hover vs selected outlines; selection labels human-readable; selected box geometry stays correct while scrolling/resizing.
5. **Context controls:** Only expose functional controls appropriate to the selected element; text/image/button/section examples, where supported.
6. **Brand adaptation:** Use source-derived accent and visual tokens without copying another site's identity; UI contrast meets intended accessibility thresholds.
7. **Responsive isolation:** On-device changes alter only intended breakpoint styles; content remains globally shared unless explicitly configured otherwise.
8. **Persistence:** Enter edit mode, change content and typography, save draft, publish, reload public page, and verify exact persisted values. Perform error/permission tests.
9. **Save states:** Before-server-response state never claims success; failures surface actionable feedback and preserve unsaved changes.
10. **Animations:** Editor-safe visibility for hidden/pinned scenes, stable layout, and proper full-behavior return in Preview Mode.
11. **No broken controls:** Device mode, Undo/Redo, Save, Publish, Reset, Media Picker, Exit all perform advertised actions or are omitted and documented.
12. **Installability:** Valid WordPress theme ZIP; separate plugin ZIP if requested; no dev-server dependency in production.

## Visual quality rubric (assess using actual browser screenshots)

Score each item 0 = broken/absent, 1 = functional but visually weak, 2 = polished:

- Consistent top-toolbar hierarchy and compactness.
- Brand-adaptive, contrast-safe color usage.
- Intuitive device-switcher active state and viewport readout.
- Editor panel legibility, spacing, form styling, grouping.
- Selected element outline and meaningful title.
- Website preview remains visually dominant and accurate.
- Useful reset / save / publish controls and statuses.
- Inspector avoids obstructing selected content, with reposition/dock fallback.
- Hover, focus, pressed, disabled, saving, error and success states.
- Responsive mode behavior and well-managed scroll containers.

**Ship target:** no hard-gate failures for in-scope functions, at least 17/20 visual-quality points. If screenshots or browser tools are unavailable, mark visual verification **not run**, not passed. A score alone is not proof of production readiness.

## Mandatory scenario suite

| Scenario | Expected result |
|---|---|
| Open logged-out site | No editor UI or editing scripts |
| Enter Edit Page as authorized user | Selection affordances and editor toolbar available |
| Select hero heading | Readable heading title; text and typography controls |
| Edit text, change font size and color | Immediate preview; original layout not permanently disturbed |
| Switch Desktop → Tablet → Mobile | Accurate preview sizes, active mode visible, inheritance clear |
| Override mobile heading font size | Desktop/tablet values unaffected unless intended inheritance |
| Select an image | Actual Media Library control and accurate alt/fit settings |
| Select a button | Label/link/appearance; Edit Mode prevents accidental navigation |
| Select animated/pinned scene content | Hidden scene becomes editable via scene selector or static edit representation |
| Save draft, refresh editor | Draft restores according to specification |
| Publish, reload visitor view | New values persist without a development server |
| Undo/Redo/Reset Device/Reset Element | Appropriate scopes, content restored correctly |
| Simulate network failure or expired nonce | No false success, useful retry/error feedback |
| Exit to Preview Mode | Animations, links, scrolling and modals behave normally |
| Try REST write as unauthorized user | Server rejects modification |

## Screenshot review set

Capture the following **actual** screenshots (not invented mockups) if browser automation is available:
1. Desktop full-page editor: top bar, selected headline, floating inspector.
2. Tablet preview and breakpoint-labelled inspector.
3. Mobile preview and clear overflow-free property controls.
4. Text property inspector (content + typography), selected item visible.
5. Image or button property inspector with matching controls.
6. Success confirmation after Publish; separate failure screenshot or recorded test if feasible.
7. Unauthenticated visitor page (no editor controls).

Compare against any user-provided visual reference for layout density, polish, and hierarchy, while following the *source website's* brand palette rather than reference brand colors.

## Report format

For every gate and scenario, report `PASS`, `FAIL`, `NOT RUN`, or `NOT APPLICABLE` with evidence. Include browser viewport(s), WordPress/PHP and Node versions when available, test commands, screenshots paths or URLs, and outstanding issues. Do not conflate static tests, simulation tests, and real WordPress browser tests.
