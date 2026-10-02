# LeafAI portfolio architecture viewer

The project’s **Explore case study** action opens a native dialog on System Design. The diagram has a dedicated viewport; System Design scrolls to reveal the shared technology stack and features. Request flow appears only in the Data Flow tab. Selected-component details also scroll when needed. Phones switch between Canvas and Details. The phone canvas starts at a readable zoom centred on the default component; Fit shows the full graph, and the component picker recentres on a chosen node.

## Component and content ownership

The case-study panel now shares its renderer with AURAK. See [Shared project case studies](CASE_STUDIES.md) for current ownership and the future-project template.

- `components/dev/project-case-study-dialog.tsx`: shared native dialog, four case-study tabs, keyboard navigation, body scroll lock and focus restoration.
- `architecture-viewer.tsx`: selectable nodes, measured SVG connectors, pan/zoom/Fit, mobile switching and component picker. The shared dialog owns request flow and technology sections. Supporting edges appear when their connected component is selected.
- `architecture-details.tsx`, `architecture-icon.tsx`, `request-path.tsx`, `architecture.css`: component details, consistent vector icons, request steps and scoped styling.
- `data/dev.json`: canonical project-specific architecture content. The renderer contains no LeafAI-specific branches.
- `data/dev.ts`: optional project architecture and typed nodes/edges. Nodes occupy unique slots in a five-column, three-row composition.
- `scripts/architecture-schema.mjs`: shared validation used by content checks and local project normalization.

Changed existing files: `components/dev/project-card.tsx`, `data/dev.json`, `data/dev.ts`, `scripts/validate-dev.mjs`, `api/routes/dev.mjs`, `admin/ui/dev.html`, `admin/ui/dev.js`. Aurak continues to use the existing case-study component.

In the local project editor, Architecture data accepts the full JSON object. Blank removes the interactive architecture. Invalid JSON or invalid graph data blocks saving. Existing architecture content survives other project edits.

## Evidence and report differences

The architecture content was checked against LeafAI revision 5d4b19d. Source links are omitted from the public component details while the GitHub project is being configured.

- Saved `.keras` configuration and training code confirm **MobileNetV2**, not the report’s alternative custom CNN. The output has 38 classes; the class mapping covers 14 species.
- The preferred model uses RGB, 128×128, MobileNetV2 `preprocess_input`, then a batch dimension. Normalization by division by 255 belongs to the legacy `.h5` fallback.
- Current dependencies use **React 19**, rather than React 18.
- Prediction logs, performance caches and uploads use **JSON/files**, not PostgreSQL. Plant knowledge lives in Python dictionaries and reference files. No persistent Render disk is declared; durability across deployments is not asserted.
- `render.yaml` confirms **Render configuration for both frontend and API**. This is configuration evidence, not a live deployment audit.
- Plant Doctor supports an **optional Groq explanation layer with local fallback**. Presence of deployed credentials is not verified.
- Current interfaces include `POST /predict`, `POST /chatbot`, `POST /generate-pdf`, `GET /dashboard-data`, and `GET /plant-geography/<plant_name>`. The report’s `/chat`, `/report`, `/advice`, and `/geo` names are not used as current routes.
- Current frontend report preview calls frontend PDF export. The separate backend ReportLab endpoint is also represented, without claiming the frontend uses it.
- Confidence review flags scores below 70% or first-to-second margins below 15 percentage points. Flagged results retain their warnings.
- Packaged accuracy metadata refers to the older `.h5` model; no accuracy number is attributed to the preferred `.keras` artifact. Unverified training/loss dashboard charts are omitted.

## Earlier viewer verification

For the shared-panel validation checklist, see [Shared project case studies](CASE_STUDIES.md). The dimensions and no-scroll checks below describe the earlier viewer layout.

Developer-content validation, targeted ESLint, and the static-export build are the relevant checks. Graph rejection and local normalization were exercised with valid data, missing references, duplicate nodes, and explicit removal.

Browser checks covered all twelve node selections, confidence details, zoom/Fit, mobile component selection and Canvas/Details switching, tab keyboard navigation, Escape and focus restoration, and Aurak’s original dialog. Desktop dimensions checked: 1440×900, 1366×768, 1280×720; dialog and System Design panel scroll heights match their client heights. Phone dimensions checked: 390×844.

Preview artifact: `output/leafai-system-design.png`. This is a review screenshot, not a deployed diagram asset. The public diagram is coded HTML/SVG and remains compatible with static export.
