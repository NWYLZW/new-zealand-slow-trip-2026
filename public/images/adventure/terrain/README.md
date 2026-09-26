# Adventure map vegetation bitmaps

Archived as of 2026-09-26. The pencil map no longer loads these thirteen transparent PNG plants or their former renderer. `src/adventure/data/terrainDecorations.json` retains each file's size, SHA-256, original built-in imagegen filename and SHA-256, crop and downsample method, and decorative meaning. The full original PNGs are retained outside the public site in the integration deliverable's `terrain-originals/` folder.

The former renderer distributed the images with a fixed seed across region patches, inside the coastline clip. These decorative placements were not botanical observations or new itinerary locations. Current terrain is rendered by `src/adventure/pencil/drawPencilMap.js`.

`node scripts/audit-terrain-decorations.mjs` verifies the archived PNG inventory, alpha, dimensions, SHA-256, payload size and region schema. Set `TERRAIN_ORIGINALS_DIR` to the retained originals folder to verify original-source hashes as well. Current renderer coverage lives in `npm run test:adventure-pencil`.
