# Site Icons

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

## Installed App Icons

As of 2026-09-27, PWA icons and shortcuts use `pencil-app-192.png` and
`pencil-app-512.png`; adaptive launchers use `pencil-app-maskable-512.png`.
The Apple touch icon is `pencil-apple-touch-icon.png` (180px).
All use the same pencil artwork, rendered at their target resolution over
an opaque pure-white background. Browser favicons remain transparent.
The maskable variant adds room around the artwork to keep it entirely inside
the central circle with radius 40% of the image width.

Regenerate with `node scripts/generate-pencil-app-icons.mjs`. This uses the
existing deterministic renderer and Playwright's bundled Chromium only for
asset generation. It checks opacity, white edges, visible ink, route accent,
and the maskable safe circle. No app page or device camera is opened.

Distinct asset URLs replace the old green mountain icons in the manifest and
Apple touch link. The former `app-icon*.svg`, `icon-*.png` and
`apple-touch-icon.png` are legacy assets, not current installation artwork.
App identity, scope and start URL stay unchanged. Existing installed icons
still depend on the browser/OS accepting a manifest update after deployment;
changing the webpage alone does not guarantee an immediate launcher update.
