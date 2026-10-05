# Image and PDF inventory

Snapshot: 5 October 2026, after repository cleanup. Counts include local source
material in `assets/originals/` and source PDFs, which are not stored in Git.
Local unused-image archives, build output, caches, and dependencies are excluded.

| Category | Files | Size (MiB) |
| --- | ---: | ---: |
| Brand source images (local) | 2 | 3.63 |
| Case study technology icons | 8 | 0.02 |
| Certificate source images | 8 | 4.56 |
| Dev portfolio web images | 14 | 1.43 |
| Dev project preview sources (local) | 2 | 4.68 |
| Photography thumbnails | 61 | 19.88 |
| Photography viewer images | 61 | 53.74 |
| Portfolio brand icons | 2 | 0.29 |
| Public PDF downloads | 1 | 0.06 |
| Source photographs (local) | 164 | 1089.10 |

## Storage conventions

- `data/` is canonical portfolio content; JSON references determine which photos remain public.
- `public/photography/thumbs/` and `full/` serve different gallery and viewer needs; both are required.
- `assets/certificates/` keeps editable certificate sources organized away from the root.
- `assets/originals/` preserves local photography, project preview, and brand source files.
- `assets/archive/photography/` preserves unused generated images locally and is ignored by Git.
- Review screenshots and diagram exports remain local in ignored `output/`.

## Cleanup result

Archived 140 unreferenced photography WebPs (75.94 MiB) without deleting originals.
Moved two unused public logo JPEGs into local brand sources and the extensionless
`public/photography/photos` JPEG into local photography sources. Required website
images, icons, fonts, the CV download, and canonical content remain in the repository.

Run `npm run images:archive-unused` after removing photos from canonical content
or regenerating all originals, then `npm run validate:photography` to check assets.

The earlier per-file and duplicate inventory is available in Git history.
Similar images and source/web pairs are not deleted solely because they look alike.
