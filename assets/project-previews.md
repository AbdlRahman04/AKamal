# Project preview imagery

The LeafAI and AURAK Dine images are illustrative sample assets generated with
the built-in image-generation tool. They are not screenshots of the deployed
applications. `components/dev/project-preview.tsx` renders the concept screens
and labels them accordingly. The gallery uses existing portfolio photographs.

Source PNGs are preserved locally in `assets/originals/dev/project-previews/`:

- `plant-leaf.png`
- `dine-menu.png`

Web assets, processed using the existing `processDevImage` function in
`api/routes/images.mjs` (1800px maximum width, WebP quality 82), are:

- `public/dev/plant-leaf-a9c2d9bf-8d47-4436-a9d8-8bb549290609.webp`
- `public/dev/dine-menu-24719613-6dbb-4e0e-8af6-16709aec6c5e.webp`

Their canonical paths and sample display content live in
`data/project-previews.ts`. Custom project covers in `data/dev.json` still take
precedence. To regenerate optimized files, pass each source buffer and filename
to `processDevImage`, then update the returned paths in that module.

## Leaf prompt

Use case: photorealistic-natural. Asset type: botanical photo for a plant-health software portfolio concept preview. Create a single beautiful photograph: one broad tomato leaf vertically centered, close-up with visible fine veins, predominantly fresh green with a small irregular brown mottled patch on the lower right. The entire single leaf is visible, pointed tip at top, slender stem below. Natural softly lit garden foliage behind it, rich green blurred bokeh, shallow depth of field. Leaf fills central 65 percent of frame, ample green bokeh around all edges. Portrait 3:4 composition. Editorial macro photography, realistic organic detail, soft daylight. No text, no UI, no grid, no hands, no logos, no watermarks. This is illustrative sample imagery, not a scientifically verified diagnosis.

## Food prompt

Use case: product-mockup. Asset type: a single horizontal food photography triptych strip for a cafeteria ordering software portfolio concept preview. One image divided into exactly three equal vertical photographic panels edge to edge, without gaps or borders. Left panel: appetizing classic cheeseburger with shiny brioche bun, lettuce, tomato, melted cheddar and a grilled patty, on a white ceramic plate. Center panel: colorful grilled chicken grain bowl with greens, cherry tomatoes, cucumber and golden grilled chicken on a white plate. Right panel: creamy penne pasta with herbs and grated parmesan on a white ceramic plate. Every dish is centered within its own third and entirely contained in its own panel; no food crossing panel boundaries. Warm daylight, pale neutral cafe tabletops, close food editorial photography, premium appetizing natural detail, three consistent slightly overhead camera angles. Landscape 3:1 strip, the three panels square. No text, no logos, no UI, no graphics, no watermark.
