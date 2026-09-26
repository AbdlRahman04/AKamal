# Portfolio Steps

## 1. Active development

Install dependencies once after cloning the project:

```bash
npm install
```

Start the public site in one terminal:

```bash
npm run dev
```

Open the public site at `http://localhost:3000`.

Start the local admin/API server in a second terminal:

```bash
npm run admin
```

Open the admin hub at `http://localhost:4000`.

Both processes can stay running while editing. A full restart is usually not
needed:

- Next.js code changes use Fast Refresh.
- Admin HTML, CSS, or JavaScript changes only need a browser refresh.
- Data changes made through the admin UI only need the public page refreshed.
- Restart `npm run admin` after changing API/server code.
- Restart the affected server after changing `.env.local`.
- Restart `npm run dev` after changing dependencies or `next.config.ts`.

Run checks during development when needed:

```bash
npm run lint
npm run validate:dev
npm run validate:photography
```

## 2. Adding updates after the project is complete

### Dev content update

After editing dev content through the dev admin workspace:

```bash
npm run validate:dev
npm run build
```

### Photography update through the admin workspace

The admin server processes uploaded images automatically. After saving changes:

```bash
npm run validate:photography
npm run build
```

### Manually adding original photography files

Place originals under `assets/originals/photography/`, then run:

```bash
npm run images:optimize
npm run images:sync-presentation
npm run validate:photography
npm run build
```

`images:optimize` regenerates the WebP thumbnails and full-size images.

If code was changed as part of the update, also run:

```bash
npm run lint
```

The production export is written to `out/`. Only `out/` is deployed or
uploaded as the static portfolio artifact. The `admin/`, `api/`, `data/`, and
`assets/` folders remain local authoring infrastructure.
