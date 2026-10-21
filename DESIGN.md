# Portfolio design system

This file is the default design contract for the public portfolio and local authoring tools. Read it before adding a visual feature.

## Goal

New work should be assembled from stable data, layout recipes, and shared modules. A feature should not need a one-off visual language or a copy-pasted section shell.

```text
canonical data -> validator -> layout module -> route or admin editor -> targeted check
```

## Visual direction

- Public developer portfolio: a compact showcase of demonstrated ability, light by default with a remembered dark option. Preserve the original navy surfaces and mint accents in dark mode, with cool white surfaces and teal accents in light mode. Use locally hosted Sora headings, Manrope body text, and an explicitly illustrative LeafAI analysis.
- Public photography portfolio: preserve its own route-specific visual language.
- Admin tools: dark navy surfaces with the same control hierarchy across inputs, selects, toggles, panels, and focus states.
- Display type is reserved for public section headings. Sans-serif supports reading. Monospace is limited to compact metadata and status.
- Use one accent within a surface. Do not introduce a new color for a single feature.

## Tokens and shape rules

Use the existing CSS custom properties before adding a new literal value.

| Need | Public developer token | Admin token |
| --- | --- | --- |
| Page surface | `--ds-bg` | `--bg` |
| Raised surface | `--ds-panel` | `--panel` |
| Primary text | `--ds-text` | `--text` |
| Supporting text | `--ds-muted` | `--muted` |
| Divider or border | `--ds-line` | `--line` |
| Main accent | `--ds-blue` | `--blue` |

- The developer homepage uses a maximum width of 1180px, 20px project corners, 12px previews and credential tiles, and pill-shaped hero actions. Its presentation lives in `components/dev/portfolio.css`; existing artwork and dialog styles remain in `bento.css` and `dev.css`.
- Light developer tokens: background `#F2F6F7`, secondary surface `#E9F3F2`, panel `#FFFFFF`, text `#192C32`, supporting text `#526970`, accent `#087C80`. Dark tokens: `#111D22`, `#243C42`, `#1B2B32`, `#ECF4F4`, `#AAC1C5`, `#86E1CF`, respectively.
- Preserve the developer header's existing circuit graphic and two-tone AK monogram: the A uses the text colour and the K uses the accent. Header surfaces, active navigation, theme controls, and contact actions follow the same palette.
- The hero name alone uses locally hosted Bricolage Grotesque Bold, matching the supplied sample: given name on the first line, surname with a blue-to-gold gradient on the second. Keep the remaining headings in Sora and the main controls mint/teal. Forced-colour mode shows the surname as solid text.
- Selected software projects use one keyboard-accessible tabbed card combining their photo/preview, concise summary, personal contribution, technologies, and visible case-study/demo buttons. The request path and step controls sit below the photo and summary; a native disclosure contains all workflow steps and project accomplishments. Do not repeat these software projects as separate cards. Projects without a supported walkthrough retain their existing card.
- Derive workflow and component highlights from canonical case-study adapters. Preserve direct project/story anchors by selecting the corresponding tab. Without JavaScript, show both project panels and their native disclosures. Keep full architecture and decisions in the dialogs. Experience and education use a readable timeline; skills link to evidence; credentials remain stationary.
- Sample features live in `portfolio-features.css`: a pausable hero typewriter and illustrative leaf scan, a network entrance that settles after four seconds, pointer glow/skill tilt, and counters derived from canonical content. The 520px mouse-following glow uses the mint/teal accent at 17%, follows the pointer once per frame, and fades when the pointer leaves the window. Pointer effects are disabled for touch and reduced motion. The illustrative score lives in `data/project-previews.ts` and must never become a real performance claim.
- Walkthrough autoplay starts only when a visitor chooses Play. Manual navigation stops playback; hover, offscreen content, hidden tabs, and reduced motion suspend it. The hero has its own pause control. Reduced motion keeps all information in its static state, and a native workflow transcript remains readable without JavaScript.
- A pausable strip summarizes completed course providers above the stationary credential collection. Its duplicate visual copy is hidden from assistive technology. Reduced motion and no JavaScript show a single wrapped list.
- Developer navigation includes a skip-to-content link. The developer route exports profile metadata, mobile theme colors, and Person structured data from the public profile.
- Admin panels use `10px` corners and controls use `7px` corners.
- Every interactive control has visible hover, focus-visible, and active feedback.
- Reduced-motion users receive the final static state.

## Layout recipes

Choose a recipe before writing markup.

| Recipe | Use for | Public module or class |
| --- | --- | --- |
| Section | A new top-level portfolio topic | `PortfolioSection` |
| Card grid | A small visual collection | Existing `ds-*-grid` class with an explicit mobile collapse |
| Record list | Chronological or dense information | Existing experience or toolkit list patterns |
| Grouped collection | One data type with meaningful states | A section plus named subgroups, such as completed and in-progress learning |
| Split field row | Two short, related admin fields | `aw-grid` |
| Choice control | A small fixed set of mutually exclusive admin values | `aw-status-toggle` or a styled `select` |

Do not use a card for a single paragraph. Do not create a new layout recipe for a one-off visual preference.

## Public developer page interface

Use `components/dev/portfolio-section.tsx` for every new top-level developer portfolio section.

```tsx
<PortfolioSection
  id="awards"
  title="Recognition for practical work."
  intro="A concise record of externally recognised projects and learning."
  className="ds-awards"
>
  {/* Feature-specific content */}
</PortfolioSection>
```

The module owns the anchor ID, heading ID, semantic relationship, heading layout, and reveal hook. Its decorative `index` is optional; omit it on the compact homepage. Feature code owns only the content inside the section.

## Data and state rules

- `data/` is canonical. Do not encode visible content only in JSX.
- Add a typed field in the matching TypeScript adapter and validate enumerated values in the relevant validator.
- Use explicit state fields. Do not infer state from a missing URL, image, or description.
- For binary states in the admin editor, prefer a labelled segmented control. For larger sets, use the shared styled select.
- A new field must be handled by the public renderer, validator, and local admin normalizer before it is considered complete.

## Responsive and accessibility contract

- Desktop grids collapse to one column at or before `640px` unless a component has an existing documented breakpoint.
- Keep public anchor IDs and navigation labels stable unless the feature specifically changes information architecture.
- Every section has one `h2` connected through `aria-labelledby`.
- Lists remain semantic `ul`, `ol`, or `article` structures.
- Controls need labels, keyboard focus, and at least one non-color state cue.
- Motion may communicate hierarchy or feedback only. It must respect `prefers-reduced-motion`.

## Fast feature checklist

1. Add or update the canonical data shape.
2. Add the adapter type and validator rule.
3. Pick one layout recipe from this document.
4. Reuse a shared module or control before creating new markup.
5. Add route-specific CSS only for content layout, using existing tokens.
6. Verify desktop and narrow layouts, then run the relevant validator and build or lint check.

## Approved shared case-study design

Use the Plant Health project interface for all case studies, including AURAK Dine: the shared theme-aware Modern Bento modal, sans-serif headings, rounded nodes, teal connectors, and filled active tab. Light and dark surfaces follow the developer page's selected mode. Keep the four tabs: Overview, System Design, Data Flow, Decisions. System Design opens first.

On wide screens, show the interactive architecture canvas on the left and selected component details on the right. Preserve pan, zoom, Fit, node selection, and labelled connections. Show Tech Stack and Key Features below the viewer. Request Flow belongs exclusively in the Data Flow tab; do not render it in System Design.

On narrow screens, preserve the Canvas / Details switch and component selector, stack supporting content, and stack request steps in Data Flow. Keep native dialog dismissal, focus restoration, keyboard tabs, visible focus rings, and reduced-motion support.

`components/dev/project-case-study-dialog.tsx`, `components/dev/architecture/architecture-viewer.tsx`, and `architecture.css` own this presentation. Content stays in the existing `caseStudy` and `architecture` schemas, adapted through `getProjectCaseStudy`. The `architecture` format takes precedence when both are supplied. Do not introduce a separate interface for Dine without a new design request.

## Ownership

- `components/dev/portfolio-section.tsx`: top-level developer portfolio section structure.
- `components/dev/*.tsx`: feature-specific public rendering.
- `components/dev/dev.css`: public developer visual tokens and layout rules.
- `admin/ui/dev.css`: admin panels and controls.
- `admin/ui/dev.js`: editor behavior and data adaptation.
- `data/` plus `scripts/validate-*.mjs`: canonical content and schema guardrails.

When a pattern appears twice, promote it into a shared module or control. Until then, keep it local to the feature that owns it.
