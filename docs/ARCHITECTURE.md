# Architecture

## Overview

This is a dual-portfolio static site built with Next.js 15 and TypeScript, featuring:
- **Dev portfolio** (`/`) - Software, data, and systems projects
- **Photography portfolio** (`/photography`) - Photography collections with AI-assisted metadata

The site uses static export (`output: 'export'`) and deploys only the `out/` directory. All content management happens locally via an Express admin server.

## Tech Stack

- **Framework**: Next.js 15.1.4 (App Router, static export)
- **Language**: TypeScript 5.7.2
- **Runtime**: Node.js 18.18+
- **Styling**: Plain CSS with custom properties
- **Admin Server**: Express.js (local only, not deployed)
- **Image Processing**: Sharp
- **AI**: OpenAI SDK (Azure OpenAI optional)

## Directory Structure

```
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with SiteChrome
│   ├── page.tsx             # Dev portfolio home
│   ├── photography/         # Photography portfolio route
│   │   ├── layout.tsx       # Photography-specific layout
│   │   └── page.tsx         # Photography home
│   └── globals.css          # Global styles
├── components/
│   ├── dev/                 # Dev portfolio components + CSS
│   ├── photography/         # Photography components + CSS
│   └── site/                # Shared navigation (SiteChrome)
├── data/                    # Canonical JSON + TypeScript adapters
│   ├── dev.json            # Dev portfolio content
│   ├── dev.ts              # Typed exports for dev
│   ├── photography.json    # Photography portfolio content
│   └── photography.ts      # Typed exports for photography
├── api/                     # Local Express admin server (not deployed)
│   ├── server.mjs          # Main Express app with API routes
│   ├── routes/             # API route modules
│   │   ├── ai.mjs          # Azure OpenAI integration
│   │   ├── dev.mjs         # Dev portfolio CRUD
│   │   ├── images.mjs      # Image upload/processing
│   │   └── photography.mjs # Photography CRUD
│   ├── schemas/            # API response validation
│   ├── activity-log.mjs    # Audit logging
│   └── usage-log.mjs       # LLM usage tracking
├── admin/ui/               # Vanilla JS admin workspaces (not deployed)
│   ├── dev.html/js/css     # Dev portfolio admin
│   └── photography.html/js/css # Photography admin
├── scripts/                # Build/validation tooling
│   ├── optimize-images.mjs    # Sharp pipeline for WebP generation
│   ├── sync-photo-presentation.mjs # Extract image metadata
│   ├── validate-photography.mjs   # Data + asset validation
│   └── validate-dev.mjs          # Dev data validation
├── public/photography/     # Generated web-ready images
│   ├── full/               # Full-size WebP
│   └── thumbs/             # Thumbnail WebP
├── assets/originals/       # Source photographs (not deployed)
└── out/                    # Static export output (deployed)
```

## Core Patterns

### 1. Data Layer

All content lives in JSON files under `data/`. TypeScript adapters (`*.ts`) provide type safety and exports.

- **Read paths**: Frontend components import from `data/*.ts`
- **Write paths**: Admin API writes directly to `data/*.json`
- **Validation**: Scripts validate data integrity before build

```typescript
// components import typed data
import { collections, profile } from "@/data/photography";
```

### 2. Dual-Portfolio Routing

The app uses route-based theming via `SiteChrome`:

```typescript
const pathname = usePathname();
const isPhotography = pathname.startsWith("/photography");
const navigation = isPhotography ? photographyNavigation : devNavigation;
```

Each portfolio has its own:
- Layout (`app/layout.tsx` vs `app/photography/layout.tsx`)
- Data adapter (`data/dev.ts` vs `data/photography.ts`)
- Component namespace (`components/dev/` vs `components/photography/`)

### 3. Admin API Architecture

The Express server (`api/server.mjs`) runs locally on port 4000:

- **Authentication**: Optional `ADMIN_PASSWORD` via `.env` or `.env.local`
- **Routes**: RESTful endpoints under `/api/`
- **Activity logging**: All writes logged to `api/activity-log.mjs`
- **AI integration**: Azure OpenAI for metadata suggestions (never auto-writes)

Key routes:
- `GET/PUT /api/photography` - Full photography data
- `GET/PUT /api/dev` - Full dev data
- `POST /api/collections/:slug/photos` - Upload with Sharp processing
- `POST /api/ai/photo/:slug/:id` - AI metadata suggestion (read-only)

### 4. Image Pipeline

Source images in `assets/originals/` → Sharp pipeline → `public/photography/`

**Two modes:**

1. **Batch processing** (scripts):
   ```bash
   npm run images:optimize        # Generate WebP assets
   npm run images:sync-presentation # Extract metadata to JSON
   ```

2. **Admin upload** (API):
   - Multipart upload via `POST /api/collections/:slug/photos`
   - Sharp processes on-the-fly
   - Returns `src`, `thumbnailSrc`, `aspectRatio`, `orientation`

### 5. AI Integration (Optional)

Azure OpenAI provides metadata suggestions via structured JSON:

- **Photo analysis**: Title, alt text, story, tags from image
- **Collection analysis**: Theme, intro, skills demonstrated
- **Profile analysis**: About text from portfolio images

**Never auto-writes** - suggestions returned to admin UI for manual approval.

Configuration (server-only `.env`):
```
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=...
```

## Data Flow

### Public Site (Read)

```
data/*.json → data/*.ts (typed) → components → Next.js build → out/
```

### Admin (Write)

```
admin/ui → API (Express) → data/*.json + public/photography/
```

### Image Processing

```
assets/originals/ → Sharp → public/photography/{full,thumbs}/
```

## Deployment Boundary

**Deployed**: `out/` directory only (static export)

**Local-only** (not deployed):
- `api/` - Express admin server
- `admin/` - Admin UI
- `assets/` - Source photographs
- `data/` - JSON source files (embedded in build)
- `scripts/` - Build tooling

GitHub Actions uploads only `out/` as build artifact.

## Type Safety

- TypeScript strict mode enabled
- Typed adapters for all JSON data
- API schema validation in `api/schemas/`
- No `any` types in production code

## Environment Variables

- **Production (Next.js)**: None required (static export)
- **Admin server (Express)**:
  - `ADMIN_PORT` (default: 4000)
  - `ADMIN_PASSWORD` (optional auth)
  - `AZURE_OPENAI_*` (optional AI integration)

## Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server (public site) |
| `npm run admin` | Express admin server (port 4000) |
| `npm run admin:dev` | Express admin server with automatic restart on backend edits |
| `npm run build` | Static export to `out/` |
| `npm run images:optimize` | Batch WebP generation |
| `npm run images:sync-presentation` | Extract image metadata |
| `npm run validate:photography` | Validate photography data + assets |
| `npm run validate:dev` | Validate dev data |
| `npm run lint` | ESLint |
