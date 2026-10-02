# Shared project case studies

Every Explore case study action uses `ProjectCaseStudyDialog` and the same four tabs and interface as Plant Health, including AURAK Dine. System Design opens first and contains the interactive architecture canvas, component details, tech stack and features. Request Flow appears only in Data Flow. The canvas provides pan, zoom, Fit and component selection. Phones switch between Canvas and Details. See the shared case-study contract in `DESIGN.md` before changing this composition.

Canonical content stays in `data/dev.json`. `getProjectCaseStudy` adapts both existing formats: `architecture` for general graphs and the existing AURAK `caseStudy` structure. When both exist, `architecture` takes precedence. Existing admin editors remain compatible. The architecture JSON editor and server normalizer preserve optional `technologies` entries and validate them before saving.

## Adding a future project

Duplicate a project record and edit its normal overview fields, `highlights` (shown as Key features), and the following `architecture` object. This is a content template, not a description of an existing project; replace every example with verified project information. No project-specific JSX or CSS is needed.

```json
{
  "title": "Project title",
  "subtitle": "A short explanation of what the project does.",
  "description": "How the main components work together.",
  "defaultNode": "frontend",
  "technologies": [
    { "logo": "react", "title": "React", "description": "Frontend interface" }
  ],
  "nodes": [
    {
      "id": "frontend",
      "title": "Frontend",
      "subtitle": "Visitor interface",
      "category": "runtime",
      "icon": "browser",
      "column": 1,
      "row": 1,
      "technology": "React",
      "responsibilities": ["Collect visitor input and present the response."],
      "notes": ["Optional implementation detail."]
    },
    {
      "id": "api",
      "title": "API",
      "subtitle": "Process requests",
      "category": "runtime",
      "icon": "server",
      "column": 2,
      "row": 1,
      "technology": "Project backend technology",
      "responsibilities": ["Validate and process requests."],
      "endpoints": ["POST /example"]
    }
  ],
  "edges": [
    { "from": "frontend", "to": "api", "kind": "runtime", "label": "HTTP" }
  ],
  "requestPath": [
    { "title": "Submit input", "description": "The visitor submits information through the frontend." },
    { "title": "Process and respond", "description": "The API processes the request and returns a result." }
  ],
  "decisions": [
    { "title": "Engineering choice", "description": "Explain the actual choice and its tradeoff." }
  ]
}
```

Nodes occupy unique positions in the existing five-column, three-row grid. The canvas sizes itself to occupied rows and columns. Use `support` nodes/edges for secondary components and `response` edges for returned results. Supporting connections appear when a connected node is selected. Node icons include the existing Plant Health set plus `database` and `card`.

`technologies` is optional. Logo slugs reference local `/case-study/<logo>.svg` assets; add an attributed SVG for a new technology. Current slugs: `react`, `python`, `flask`, `tensorflow`, `nodejs`, `postgresql`, `stripe`, `render`. Empty tech stacks and feature lists are omitted. Request flows in the Data Flow tab accept one to five steps and stack on phones. Endpoints and notes are optional and appear only when provided.

## Checks

Run `npm run validate:dev`, targeted ESLint and `npm run build`. Check both existing projects at desktop and phone sizes, including tabs, node selection, zoom/Fit, logos, scrolling, Escape, backdrop dismissal and focus restoration. The portfolio remains a static export; endpoints mentioned in project content belong to the showcased projects, not this site.
