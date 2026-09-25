# Adventure map illustrations

Eight destination cutouts are shown at the existing ZQN, WKA, AOR, TEK, OAM,
CHC, AKC and HBT stops. Queenstown established the hand-inked, muted 2.5D
style; the user approved that sample and requested matching art for the other
destinations on 2026-09-23.

All eight files are original RGBA PNGs generated with imagegen and kept
byte-for-byte. They are decorative interpretations, not photographs, exact
landmark depictions or evidence for accommodation and itinerary decisions.
The generated images may have faint partially transparent edge halos.

`src/adventure/data/landmarks.json` is the source of truth for each file's
destination, bilingual label, dimensions, SHA-256, original generated filename,
anchor and display width. `src/adventure/drawLandmarks.js` places them in the
same SVG world as the terrain, routes and stops, so they follow pan and zoom.
Run `npm run audit:adventure-assets` to verify the eight PNGs and manifest.

Sixteen RGBA PNG cutouts are **map decoration only**. The first nine below are
the original full-resolution files; the seven regional cutouts are derived
640 px maximum RGBA PNGs. Their unmodified imagegen originals remain in the
imagegen output directory for task `01a0d50c-b1e8-7d33-a573-82a8f57f8523`.
`decorations.json` records the original filename, original SHA-256, derivative
method, and deployed SHA-256 for each one.

| File | Subject | Meaning |
| --- | --- | --- |
| `kiwi-bird.png` | Kiwi bird | No wildlife sighting is implied. |
| `whale-surfacing.png` | Whale surfacing and blowing | Placed in the Tasman Sea; no sighting or tour is implied. |
| `whale-tail.png` | Whale tail above water | Placed in the Pacific; no sighting or tour is implied. |
| `whale-breaching.png` | Whale breaching | Placed in the Pacific; no sighting or tour is implied. |
| `helicopter.png` | Sightseeing helicopter | No additional activity or booking is implied. |
| `milford-sound.png` | Milford Sound / Piopiotahi | Landscape art, not an added itinerary stop. |
| `kea.png` | Kea | South Island mountain atmosphere; no sighting is implied. |
| `silver-fern.png` | Silver fern | Forest atmosphere; no field observation is implied. |
| `sheep.png` | Farm sheep | Pastoral atmosphere; no activity is implied. |
| `pohutukawa-blossom.png` | Pōhutukawa flowering twig | Northern North Island coastal atmosphere; no observation is implied. |
| `bay-of-plenty-kiwifruit.png` | Kiwifruit | Bay of Plenty produce; no orchard activity or booking is implied. |
| `north-island-tui.png` | Tūī | North Island forest atmosphere; no sighting is implied. |
| `central-otago-cherries.png` | Cherries | Central Otago produce; no picking activity is implied. |
| `kaikoura-fur-seal.png` | Fur seal / kekeno | Kaikōura coast atmosphere; no sighting is implied. |
| `wetland-harakeke.png` | Harakeke / flax | Wet area habitat; no field observation is implied. |
| `wetland-ti-kouka.png` | Tī kōuka / cabbage tree | Wet open area habitat; no field observation is implied. |

These are separate from the eight destination illustrations and have no stop
button, route, day, or booking state. `src/adventure/data/decorations.json` stores
their coordinates, bilingual semantics, responsive size, SHA-256 and imagegen
provenance. The helicopter is anchored at Aoraki / Mount Cook and displayed
slightly above the stop art; it does not cover the stop button. The Milford
artwork is anchored to [DOC's Piopiotahi Marine Reserve map point C](https://www.doc.govt.nz/globalassets/documents/conservation/marine-and-coastal/marine-protected-areas/marine-reserve-maps/piopiotahi-milford-sound-marine-reserve.pdf)
at 167.9053° E, 44.63685° S, a representative point within the fiord. Its
visual base touches that anchor with no display offset; it adds no route point.
All three whale anchors
are in the ocean, with distinct surfacing, tail and breaching silhouettes.

The selected cutouts were generated on 2026-09-25, with the approved
Queenstown illustration as the style target. A whale
tail candidate with dark background haze was rejected in favour of a clean
transparent cutout. The artwork is atmospheric rather than a claim of a
specific encounter. Placement references: [DOC on kea habitat](https://www.doc.govt.nz/kea),
[DOC on ferns](https://www.doc.govt.nz/nature/native-plants/ferns/),
[DOC on whales around New Zealand](https://www.doc.govt.nz/nature/native-animals/marine-mammals/whales/sperm-whales/),
and [MPI on sheep and beef farming](https://www.mpi.govt.nz/dmsdocument/4057/direct/).
The audit checks RGBA transparency, provenance, distinct whale poses and
ocean anchors, and verifies that decorations are not linked to stops or routes.

The seven regional cutouts use fixed representative land anchors. The
placement shows regional character, not a precise plant record, wildlife
sighting, new stop, orchard visit, or reservation. Their regional references
are [DOC pōhutukawa](https://www.doc.govt.nz/pohutukawa/),
[MPI Bay of Plenty kiwifruit](https://www.mpi.govt.nz/dmsdocument/5746/direct/),
[DOC tūī](https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/tui/),
[Central Otago growers](https://www.centralotagonz.com/assets/Documents/2023-Central-Otago-Growers-and-Producers.pdf),
[DOC Kaikōura fur seals](https://www.doc.govt.nz/Documents/science-and-technical/seal-callouts-kaikoura.pdf),
[DOC harakeke](https://www.doc.govt.nz/nature/native-plants/harakeke-flax/), and
[DOC tī kōuka](https://www.doc.govt.nz/nature/native-plants/cabbage-tree-ti-kouka/).
All seven source images were visually checked as single, opaque-subject
cutouts with transparent surroundings. The rejected pōhutukawa, kiwifruit,
and tī kōuka drafts had dark haze; they were not deployed. The audit checks
deployed image dimensions, hashes, alpha edges, body opacity, land anchors,
and the original-image provenance fields.

At map zoom below 1.4×, `drawDecorations.js` compares all 16 decoration image
rectangles against the visible stop buttons and labels. An image that would
cover one is hidden for that view; the fixed geographic anchor never moves.
All decorations return at normal zoom, and every image remains non-interactive.
