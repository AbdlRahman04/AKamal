# Abdl Rahman Kamal Portfolio

A static-exported Next.js portfolio with two public sections: a dev portfolio
for software, data, and systems at `/`, and a photography portfolio focused on
motion, atmosphere, and place at `/photography`.

## Requirements

- Node.js 18.18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The Windows helper is available through `Start-Portfolio.bat`.

## Local admin tools

The admin tools are local-only and are not part of the deployed static site.
Start the API and admin UI with:

```bash
npm run admin
```

Then open `http://localhost:4000`. The hub links to `/photography-admin` and
`/dev-admin`. The API edits canonical files under `data/` and writes image
assets under `assets/` and `public/`.

Optional Azure OpenAI settings belong in the server-only root `.env` or
`.env.local` files. See [`admin/README.md`](admin/README.md).

## Build and deployment boundary

The only deployment artifact is `out/`. Next.js uses `app/`, `components/`,
`data/`, and `public/` to produce it; the source `data/` and `assets/` folders
remain local authoring infrastructure alongside `admin/` and `api/` and are
not deployed separately. The Vercel project is connected to
`AbdlRahman04/my-portfolio` and builds the site when changes are pushed to
`main`.

```bash
npm run build
```

The static export is written to `out/`. Vercel runs `npm run build` and serves
that export. After changing the public portfolio, commit and push the intended
source changes to GitHub to trigger a production deployment:

```bash
git add <changed-files>
git commit -m "Describe the portfolio update"
git push origin main
```

`out/` is generated during the build and stays out of Git.

## Photography assets

Keep source images under:

```text
assets/originals/photography/
├── personal/
└── client-work/
    ├── automotive/
    ├── event/
    ├── product/
    └── real-estate/
```

Generate web-ready images with:

```bash
npm run images:optimize
npm run images:sync-presentation
```

Generated files live in `public/photography/thumbs/` and
`public/photography/full/`. Validate references with:

```bash
npm run validate:photography
```

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the public Next.js development server |
| `npm run admin` | Start the local API/admin server on port 4000 |
| `npm run images:optimize` | Generate gallery and viewer WebP assets |
| `npm run images:sync-presentation` | Sync photo dimensions and orientation into data |
| `npm run validate:photography` | Validate photography data and generated assets |
| `npm run validate:dev` | Validate dev profile and project data |
| `npm run build` | Generate the static export in `out/` |
| `npm run lint` | Run ESLint across the project |

## Project structure

```text
app/                       Next.js routes and shared document layout
components/dev/            Dev public experience and styles
components/photography/    Photography public experience and styles
components/site/           Shared route-aware navigation and footer
data/                      Canonical JSON and typed adapters
api/                       Local Express server and API modules
admin/ui/                  Local vanilla-JS admin workspaces
assets/originals/          Preserved source photographs
public/photography/        Generated web-ready image assets
scripts/                   Validation and image tooling
out/                       Generated static export
```
