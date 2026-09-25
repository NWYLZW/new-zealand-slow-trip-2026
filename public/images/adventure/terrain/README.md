# Adventure map vegetation bitmaps

The live map uses thirteen small transparent PNG plants: nine tree forms and four grasses. `src/adventure/data/terrainDecorations.json` records each final file's size, SHA-256, original built-in imagegen filename and SHA-256, crop and downsample method, and decorative meaning. The full original PNGs are retained outside the public site in the integration deliverable's `terrain-originals/` folder. No game asset or SVG tree is used.

`src/adventure/drawTerrainDecorations.js` distributes the images with a fixed seed across region patches, inside the coastline clip. Region choice and elevation constrain species: north coast trees differ from southern and western forest, grasslands receive grasses, and high elevations receive only tussock or sedge. It rejects points near stops, route hits, landmark illustrations, and five inland-water zones. The layer does not receive pointer events. These decorative placements are not botanical observations or new itinerary locations.

The six earlier scenic cutouts were removed from this public folder. They are not drawn or requested by the live map. `node scripts/audit-terrain-decorations.mjs` verifies the final PNG inventory, alpha, dimensions, SHA-256, payload size, region schema, and bitmap renderer. Set `TERRAIN_ORIGINALS_DIR` to the retained originals folder to verify original-source hashes as well.
