# Browser Favicon

`pencil-favicon-16.png`, `pencil-favicon-32.png`, `pencil-favicon-48.png` and
`pencil-favicon.ico` identify both site entries. The 128px PNG is the master
preview. Artwork: New Zealand's two main islands, green pencil hatching,
a red illustrative journey line and a paper-edged stop. No lettering.

Created 2026-09-26 with the project's deterministic pencil renderer, not an
external logo or generated photograph. Silhouette source: the existing Natural
Earth public-domain `src/adventure/data/coastline.json`; provenance is recorded
in `src/adventure/data/README.md`. The route is an emblem, not navigation data.

Regenerate with `node scripts/generate-pencil-favicon.mjs`. The script renders
each size separately, checks dark pixels, the route accent and unclipped edges,
then packs 16/32/48px PNGs into the ICO. Chrome is required; no image API is used.
The generated assets are committed, so deployment requires no browser.

Existing installed-app and Apple touch icons are unchanged by this favicon-only
update. Their SVG masters and PNG derivatives remain in this directory.
