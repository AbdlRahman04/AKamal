# Cinematic developer portfolio

Implemented from the approved 13 October 2026 JSON plan. The developer homepage combines an editorial hero, layered existing project artwork, two five-step project stories, project-backed skills, and four engineering-process stages.

## Content and behavior

`getProjectStory` derives titles and descriptions from the existing case-study adapter. Its presentation mappings reference canonical architecture node IDs. Unsupported projects or incomplete workflows retain their existing project cards. The canonical authoring JSON/schema is unchanged.

Desktop stories use natural scrolling with a sticky scene at widths of at least 1024px and heights of at least 700px. Step controls also work directly, with keyboard navigation and skip links. Narrow or reduced-motion presentations remain in ordinary document flow. Full case studies open their Data Flow tab and return focus to the trigger on close.

Motion follows the operating-system preference, including changes during the current visit. The page-level toggle was removed at the user's request. Reduced motion disables existing reveal, case-study and anchor-scroll motion. Skills and process content is available as readable sections without JavaScript.

The homepage remains server-rendered and statically exported. Interactive leaves reuse installed GSAP and Motion. Source photographs, contact delivery, privacy rules and environment files are unchanged.

The finite hero entrance uses native CSS to avoid loading ScrollTrigger on mobile startup. GSAP handles desktop scroll choreography and interaction-driven project transitions. Existing hero leaf artwork is preloaded for timely rendering.

Requested follow-ups add floating hero previews, an illustrative leaf scan, and circuit signals that pause offscreen or when the document is hidden. Both navigation headers include finite circuit/viewfinder graphics and a scroll-progress line. The retained photography preview has explicit responsive sizing, result panels use distinct summaries, and both footers show the requested last-updated date. The photography footer conversation link is approximately 20% smaller.

## Verification

- `node scripts/project-story.test.mjs`: canonical and legacy adapters, complete steps, stable IDs, valid node references, unsupported/incomplete content and missing optional facts.
- `npm run validate:dev`, `npm run lint`, and `npm run build`.
- `node scripts/contact-web3forms.test.mjs` and `node scripts/public-profile-privacy.test.mjs`.
- Production-preview browser checks at 1440×900, 1024×768, 768×1024 and 390×844: step controls, rapid selection, reverse scrolling, keyboard tabs, dialog origin/focus, manual/system reduction, resizing, both themes, route cleanup, direct anchors, photography, no-JavaScript readability and hydration.
- Existing `site-chrome.tsx` native-image lint warning remains; no new lint errors were introduced.

Preview images and synthetic local performance results are saved under ignored `output/cinematic/`. Local Lighthouse results use the same default mobile throttling and uncompressed preview server for both versions; they are not measurements of the public Vercel deployment.

Final results: Lighthouse mobile performance 54 baseline / 52 implemented; CLS 0; total blocking time approximately 283ms / 293ms. First-load JavaScript 164kB / 168kB. Browser smoke also measured CLS below 0.002. A slow local synthetic LCP remains comparable to the baseline; no public-production performance claim is made.

The fresh reviewer identified the anchor-scroll motion gap, which was reproduced and corrected. The formal review response was interrupted by the reviewer's account usage limit. Remaining dialog-origin, keyboard and static-content observations were verified and addressed in the final author review.

## Publishing

Pushing the intended source changes to `origin/main` triggers Vercel. Publishing was requested on 13 October 2026. Keep generated `out/` and review artifacts out of Git.
