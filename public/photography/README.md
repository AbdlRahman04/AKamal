# Portfolio Image Assets

This directory contains generated, web-ready images for the portfolio.

- `thumbs/` contains gallery images sized for browsing.
- `full/` contains larger images used by the full-screen viewer.

Do not place original camera files here. Keep originals in
`assets/originals/photography/`, then run:

```bash
npm run images:optimize
```

The generated files are referenced by `data/photography.json` through each
photo's `src` and `thumbnailSrc` fields. Use the validator to check those
references after adding or removing images:

```bash
npm run validate:photography
```

To archive generated images no longer referenced by canonical content or public
source modules, run `npm run images:archive-unused`. The files are preserved
locally in `assets/archive/photography/`, which is ignored by Git. Run this after
`images:optimize` if your originals include photos not selected for the website.
