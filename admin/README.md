# Admin Portal

Local admin portal for managing the photography portfolio content. It runs a small Express server, serves the admin UI, updates the canonical source file `data/photography.json`, and processes uploaded photos into the portfolio image folders. The Next.js app consumes that JSON through the typed adapter in `data/photography.ts`.

## Requirements

- Node.js 18.18 or newer
- Project dependencies installed with `npm install`

## Start The Admin Portal

From the project root:

```bash
npm run admin
```

Then open:

```text
http://localhost:4000
```

Press `Ctrl+C` in the terminal to stop the admin server.

## Optional Password

The admin API can be protected with `ADMIN_PASSWORD` in the root `.env` or `.env.local` file:

```env
ADMIN_PASSWORD=change-this-password
```

When this value is set, API requests must include the same value in the `x-admin-password` header.

## Azure OpenAI Metadata Suggestions

The admin portal can generate draft metadata for individual photos and collections using Azure OpenAI. The AI service runs only through the local Express server; the browser never receives the Azure credentials. Individual suggestions are not saved until you press an explicit save button. The collection editor also includes an explicit, confirming batch action that analyzes and saves metadata for all real photos in the selected collection.

Photo AI suggestions are additive for tags: existing selections are preserved, only the strongest complementary technique tags are added, and each photo is capped at six total tags. The editor shows the current count and disables additional selections at the cap.

Create or update the root `.env` file with your Azure resource settings:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-server-only-key
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

`.env.local` may be used for private overrides and takes precedence over `.env`. Keep both files out of source control. The Azure deployment must support image input and structured JSON output.

The admin sidebar includes a read-only AI Service status card. It shows whether the server-side configuration is usable, the deployment name, retry count, image pixel cap, and prompt source. It never displays the API key.

Optional reliability settings are documented in the root `.env.example`. The AI service supports bounded image preprocessing, external prompt files under `prompts/`, exponential retries for rate limits/transient failures, JSON repair plus schema validation, and append-only usage records at `logs/llm_usage.jsonl`.

## What It Manages

- Reads and writes portfolio data in `data/photography.json`
- Adds, edits, reorders, and deletes photos inside collections
- Updates collection metadata such as title, theme, intro, and skills demonstrated
- Saves original uploads to `assets/originals/photography/personal/ (or client-work/<category>/)`
- Generates optimized WebP images in `public/photography/thumbs/` and `public/photography/full/`

After making content or image changes, run `npm run validate:photography` to verify
that every non-placeholder photo references existing generated assets.

## Folder Structure

```text
api/
  server.mjs                 Express server and API routes
  activity-log.mjs            append-only admin activity log
  usage-log.mjs               append-only AI usage log
  routes/ai.mjs               Azure OpenAI metadata suggestion service
  routes/dev.mjs              dev.json read/write helpers
  routes/photography.mjs      photography.json read/write helpers
  routes/images.mjs           upload processing and image cleanup
  routes/image-preprocess.mjs bounded image preprocessing
  routes/prompt-loader.mjs    external prompt loading
  schemas/suggestion.mjs      AI response schema
admin/ui/
  index.html                  admin dashboard hub
  photography.html/js/css     photography workspace
  dev.html/js/css             dev workspace
```

## Notes

- The admin server binds to `localhost:4000`, so it is intended for local use.
- Uploaded images are accepted as JPEG, PNG, TIFF, or WebP files up to 50 MB.
- After changing portfolio content, run the main site locally with `npm run dev` or build it with `npm run build` to check the public experience.

## Dev Workspace

The Dev portfolio has a separate admin design and data model. It
does not reuse the photography collection/photo editor.

Open it at:

```text
http://localhost:4000/dev-admin
```

It manages the profile and contact details, skill groups, project case studies,
work experience, and learning credentials in the same order as the public dev
portfolio. All project records appear in the public showcase. Current-focus,
toolkit, and education records remain in `data/dev.json` but are not shown on
the public MVP page or in this workspace. Project cover and certificate images
can be uploaded; dev workspace uploads are converted to WebP and saved under
`public/dev/`.

The Profile & Contact view includes a CV PDF drop zone. Uploading replaces
`public/resume.pdf`, which the public Download CV button serves. Since the site
uses static export, rebuild and redeploy the site to publish a replacement.

The public page is:

```text
http://localhost:3000/
```

Dev content is stored independently in `data/dev.json`. Validate it
with:

```bash
npm run validate:dev
```
