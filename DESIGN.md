# Portfolio design system

This file is the default design contract for the public portfolio and local authoring tools. Read it before adding a visual feature.

## Goal

New work should be assembled from stable data, layout recipes, and shared modules. A feature should not need a one-off visual language or a copy-pasted section shell.

```text
canonical data -> validator -> layout module -> route or admin editor -> targeted check
```

## Visual direction

- Public developer portfolio: graphite surfaces, paper-like text, and one warm signal accent.
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

- Public developer cards use the existing tight corner treatment.
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
  index="06 / Awards"
  title="Recognition for practical work."
  intro="A concise record of externally recognised projects and learning."
  className="ds-awards"
>
  {/* Feature-specific content */}
</PortfolioSection>
```

The module owns the anchor ID, heading ID, semantic relationship, heading layout, and reveal hook. Feature code owns only the content inside the section.

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

## Ownership

- `components/dev/portfolio-section.tsx`: top-level developer portfolio section structure.
- `components/dev/*.tsx`: feature-specific public rendering.
- `components/dev/dev.css`: public developer visual tokens and layout rules.
- `admin/ui/dev.css`: admin panels and controls.
- `admin/ui/dev.js`: editor behavior and data adaptation.
- `data/` plus `scripts/validate-*.mjs`: canonical content and schema guardrails.

When a pattern appears twice, promote it into a shared module or control. Until then, keep it local to the feature that owns it.
