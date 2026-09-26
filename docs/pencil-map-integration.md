# Pencil Map Integration

## Scope

- Replace only the adventure map artwork with the approved colored-pencil map.
- Keep C lettering: variation .52, breaks .18, outline .96, fill .34, grain .45.
- Preserve the existing Natural Earth bathymetry source, thresholds (200, 1000,
  2000, 4000 m), antimeridian handling and edge fades.
- Preserve itinerary stop/route IDs, links, panels, keyboard activation, zoom,
  drag, reset and responsive layout. Do not change bookings or trip facts.
- Initial stage was local-only; see the latest publication section for the
  subsequent explicit commit, push and deployment authorization.
- Remove the persistent lower-left attribution per browser comment 1 (1323x956).
  Preserve source credits in the backpack's expandable map data sources section.
- Replace route sketch overlays with the approved pressure/grain/pencil-lift
  renderer, including the phone short-route badge. Preserve road/flight/coach
  differentiation, source waypoints and transparent keyboard/click hit paths.

## Inputs

- Repository main checkout obtained on 2026-09-25.
- Approved local pencil-map renderer and Natural Earth / ESA WorldCover 2021
  generalized geometry from this task. No external runtime requests added.
- Existing coastline, hydrography and bathymetry source records remain intact.
- Discovery: the published origin's `/llms.txt` returned 404; repository
  AGENTS.md and `.ai/rules/` are the available implementation documentation.

## Progress

- [x] Inspect map layers, interaction contracts and project rules.
- [x] Identify depth bands and their source/antimeridian tests.
- [x] Integrate pencil renderer and C labels with the existing map view.
- [x] Verify depth colors, geometry alignment, pan/zoom and click/URL behavior.
- [x] Integrate pencil routes; remove the previous visible route SVG overlays.
- [x] Verify route texture, selection, endpoint alignment and cached navigation.
- [x] Check desktop/mobile appearance, build and repository audits.
- [x] Open local preview; changes remain uncommitted and unpublished.

## Verification Contract

Check the existing bathymetry and hydrography audits, a focused browser
regression test, all repository delivery audits, production build and diff
whitespace. Browser checks must cover nonblank canvas, depth band geometry,
stable marker/route alignment, keyboard selection, deep links/history, drag,
reset, touch targets and no horizontal overflow. Measure cached navigation.

## Evidence (2026-09-25)

These checks predate the duplicate-water correction below; they did not verify
that the Natural Earth and LINZ copies of each water feature were mutually exclusive.

- `npm run test:adventure-pencil` passes at 1323x956, 436x900, 844x390 and
  768x900. Seven routes use the new renderer; no old route overlays remain.
  Endpoint error is below .001 projection pixels. Texture tests find 64-86
  pigment levels and pen lifts/dashes, with deterministic redraws.
- Small pan reuses both terrain and route caches. Sampled route rebuilds take
  about 3-8 ms on local Chrome; high-zoom terrain navigation draws about 2 ms.
- Route keyboard activation, URL reload, escape/close, 44px phone route badge,
  place history, water/depth transforms and source credits all pass.
- Bathymetry, hydrography, AI rules and adventure asset audits pass. Full
  accommodation/media/social audits also passed during base map integration;
  their known archived-room-photo/reused-social-post warnings are unchanged.
- Production build and `git diff --check` pass. Existing main-page missing
  `hero-route-render.webp` reference and large-bundle warnings remain.
- Preview: `http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html`.
  Screenshots are in the task workspace's `outputs/pencil-integration/`.

## Duplicate-Water Correction (2026-09-26)

- User screenshot shows Wakatipu's Natural Earth fill and LINZ contour rendered
  simultaneously. Rivers and other shared lakes have the same source overlap.
- Remove the old SVG water renderer and all unused map-specific terrain,
  landmark, decoration and sketch renderers; keep UI controls and trip facts.
- Resolve the eight shared waters to LINZ before painting. New pencil water
  renderer owns the fill, hatching and outline in the same cached terrain pass.
  Retain other Natural Earth waters, multipart pieces, holes and C labels.
- Keep bathymetry untouched. Old image/source records remain archived, never
  requested by the map; documentation/audits distinguish archives from runtime.
- [x] Remove duplicate source selection and legacy runtime code/CSS.
- [x] Verify all shared lakes/rivers, high-zoom pixels and responsive interactions.
- [x] Run build, source audits and whitespace checks; keep preview running.

Verification: `test:adventure-water` resolves 75 water features (20 lakes and
55 rivers), preserves all eight LINZ geometries/holes and Te Anau's two parts.
Pixel checks cover all eight shared waters; former-only lake areas have zero
opaque ghost pixels in isolated rendering. Wakatipu's actual high-zoom canvas
has 907/907 water samples painted and only 3/942 water-colored samples in the
former-only strip (adjacent texture tolerance). No legacy renderer/art requests
or legacy map DOM remain. Desktop/mobile screenshots were reviewed.

`test:adventure-pencil`, hydrography/bathymetry audits, archived terrain asset
audit, AI rules, production build and `git diff --check` pass. Existing main-page
missing-image and large-chunk build warnings remain unrelated to this correction.

## Road-Network Geometry (2026-09-26)

Feedback: the selected Oamaru-to-Christchurch path at 1323x956 looks like a
flight. The shared root cause is schematic point interpolation for all land
routes. Replace the five displayed land routes, preserving IDs, dates, itinerary,
two schematic flights, pencil material, deep links and existing map layers.
No airport transfers, extra day trips, bookings or navigation engine are added.

- [x] Fetch all five road geometries and confirm the requested SH 1 example.
- [x] Paint original projected road vertices and share geometry with hit paths.
- [x] Add source/date/limitations and an external directions link to details.
- [x] Verify road data contracts, desktop/mobile pixels and browser interactions.
- [x] Run build, existing regression tests and repository gates.

Source: FOSSGIS OSRM car service, based on OpenStreetMap (ODbL 1.0).
`npm run fetch:adventure-roads` explicitly refreshes the local JSON snapshot;
the browser never calls the routing service. Requests use an identifying
User-Agent, more than one second between calls, full GeoJSON and driving steps.
The snapshot retains request URL, retrieval time, input/snapped coordinates,
geometry, road names, distance and response/geometry SHA-256. No data version was
returned: retrieval time is not the underlying OSM dataset timestamp.

Discovery: `https://routing.openstreetmap.de/llms.txt` returned HTTP 404
(`unavailable`). No discovery skill documents were available. Conventional
reachable docs used: the service homepage, `/about.html`, and OSRM Route service
documentation at `https://project-osrm.org/docs/v5.24.0/api/` and the upstream
`docs/http.md`. No broad endpoint scanning or deeper unrelated docs loaded.

The first request rejected the old intermediate coordinate near Cardrona with
`NoSegment` (over 1 km from a routable segment). These old schematic control
points are not reliable road anchors. Route requests now retain named itinerary
stops (Arrowtown, Tekapo); returned road names confirm Crown Range / Cardrona and
Lindis Pass / Omarama / SH 80 without imposing off-road control points. The
shared original itinerary data remains unchanged. Christchurch's adventure city
marker uses the existing CBD coordinate, matching the road segment's destination
rather than the airport; flight arcs remain city-level schematics.

The 2026-09-26 snapshot has 3389 / 3689 / 4522 / 3063 / 2750 vertices for
Queenstown-Wanaka / Wanaka-Aoraki / Aoraki-Tekapo-Oamaru / Oamaru-Christchurch /
Auckland-Hobbiton. Oamaru-Christchurch uses SH 1 through Timaru and Ashburton,
then SH 76 into the city. These are calculated reference paths, not GPS tracks,
live traffic, closure forecasts or turn-by-turn navigation. The coach path uses
the car profile and a shared outbound/return display, not a verified operator
track. OSM credit and the service's fix-map link live in route details and the
backpack sources, without restoring the removed bottom overlay.

Verification: `test:adventure-roads` checks source hashes, all five inputs and
snapped endpoints (largest snap 141.4 m), route continuity, named highways,
Christchurch CBD destination and preservation of every geometry vertex in the
hit paths and canvas input. Desktop 1323x956 and phone 436x900 pass route deep
links, history, source text, flight/coach caveats and directions-link checks.
At zoom 12 the road canvas contains 23,279 colored pixels; the sampled rebuild
takes about 12 ms. No runtime routing request or browser error occurred.
Screenshots `roads-desktop`, `roads-ashburton`, `roads-details`, and
`roads-mobile-details` were inspected in `outputs/pencil-integration/`.

`test:adventure-pencil`, `test:adventure-water`, AI rules, event-media audit,
build and whitespace checks pass. All eight shared water geometries remain
single-source without the former duplicate overlays. The existing main-page
missing hero image warning remains; the existing
large-chunk warning now also includes the bundled offline road data (adventure
bundle about 1.65 MB before gzip, 519 KB compressed).

## Stop Markers And Return Button (2026-09-26)

Browser feedback at `adventure.html?place=ZQN`, 1323x956: replace uniform city
dots with the approved pencil material; select a place at absolute map zoom 5,
centered in the full map viewport. Remove the visible return caption and match
its icon to the pencil drawing. Preserve other tool captions, hit targets, C
labels, itinerary, road/water geometry and return destination. Local only.

- [x] Replace CSS circle/selection shadow with cached normal/selected pencil
  sprites, including irregular outlines, hatching and pigment variation.
- [x] Set place focus to 5 for click, repeated selection and URL restore;
  avoid focusing twice on a newly selected marker.
- [x] Render the existing return-arrow geometry with the pencil brush; remove
  its caption DOM, retaining its accessible name and hover/focus tooltip.
- [x] Verify pixels, centering, responsive layouts, navigation and build gates.

Verification: `test:adventure-pencil` passes at 1323x956, 436x900, 844x390 and
768x900. All 16 cached marker states contain nonuniform pigment (96-144 alpha
levels), and the return icon has 189 alpha levels. Clicking Queenstown or
Christchurch, repeating a selected-place click after zooming out, and restoring
the place URL all give zoom 5 with less than .02 px center error. Return caption
DOM is absent; tooltip hover/focus, the mobile 48px target, and keyboard return
to the itinerary overview pass. Existing route, bathymetry, pan/cache, labels,
history and responsive checks pass without map page errors. Screenshots of
the selected marker, return icon, desktop Queenstown focus and phone layout
were inspected. Production build, AI rules and whitespace checks pass; the
previous missing main-page hero image and bundle-size warnings are unchanged.

## Animated Focus And Complete Icon Set (2026-09-26)

Latest feedback supersedes the earlier 5x zoom and retained tool captions:
focus should animate and zoom closer; tasks, bag, photos and zoom/reset controls
must also use the pencil style without permanent text beneath them.

- [x] Use absolute zoom 10 and an 850 ms D3 focus transition, with reduced-motion
  support and cancellation on new selection, manual gestures, close and resize.
- [x] Reuse nearby route pigment caches during transition frames, repaint exact
  strokes at rest, and defer high-resolution terrain work until motion stops.
- [x] Convert all seven toolbar icons and panel arrow/close symbols to the same
  pencil brush. Remove caption DOM and dead SVG styling; preserve hover/focus
  tooltips, accessible names, 48px+ toolbar targets and active pigment states.
- [x] Verify actual animation frames, interruption, all controls and mobile taps.
- [x] Inspect desktop/mobile screenshots and run build/regression gates.

Scope excludes changes to routes, itinerary, geography, depth bands or C labels.
Local only; no deployment or commit. The installed D3 zoom/transition source
was checked for interruption and gesture behavior before using its existing
transition API.

Verification: `test:adventure-controls` passes for seven nonblank pencil toolbar
icons (181-243 pigment alpha levels), zero caption or legacy toolbar SVG nodes,
tooltip bounds/keyboard focus, active pigment changes, panel controls and phone
taps. The local focus trace records 51 animation frames over 960 ms including
setup, maximum sampled frame gap 17.5 ms, eight route-cache builds and no terrain
or detail rebuild during motion. All layers remain aligned, ending at zoom 10.
Rapid new selections, wheel interruption, reset, deep-link reload and reduced
motion pass. These are local measurements, not a frame-rate guarantee on every
device. Reviewed `controls-tools`, `controls-zoom`, `controls-focus-10x` and
`controls-mobile-10x` screenshots in the task's `outputs/pencil-integration/`.

`test:adventure-pencil`, `test:adventure-roads`, production build, AI rules and
whitespace checks pass. Existing unrelated hero-image and bundle-size build
warnings remain. No routing, water, depth or itinerary data changed this round.

## UI Lettering And Publication (2026-09-26)

Latest feedback: task-panel text must match the map. Scope includes tasks,
place/route details, bag, source credits, photo captions and tooltips; no changes
to itinerary facts, map geometry or navigation. User now explicitly requests
commit, push and deployment to the existing GitHub Pages site, superseding the
earlier local-only stages. Use the user-specified email for the commit identity.

- [x] Share the map handwriting family and C pigment renderer with UI text.
- [x] Keep native text for accessible names, selection, links and wrapping;
  overlay transparent pigment only after drawing succeeds, retain fallback
  text for font loading, print and forced-colors mode.
- [x] Preserve fixed readable sizes, zero tracking, dark secondary text and
  deterministic outlines/grain. Render visible text lazily and cache labels.
- [x] Verify every panel, expanded/scrolling text, 436px and 320px layouts,
  controls, map regression and delivery checks.
- [ ] Commit reviewed source, push normally and verify Pages deployment.

Pre-publication verification: all five adventure browser suites pass. UI text
has 240 alpha levels in the sampled task title; native selection, keyboard
expansion, delayed offscreen rendering, English wrapping, forced-colors fallback
and 320/436px layouts pass with no page errors. Reviewed desktop task/place/route
and mobile task/source screenshots. Focus remains interruptible at zoom 10 with
51 sampled frames and no terrain rebuild during motion. Roads preserve their
full vertices; all eight overlapping LINZ water geometries remain single-source.

Full accommodation, accommodation-image, event-media, social-guide, AI-rule,
production-build and whitespace checks pass. Existing nonblocking warnings:
one nonselectable reference room lacks room-specific photos; source posts are
shared across related events; the main site's hero image reference is unresolved;
Vite reports large chunks. No new trip facts, private data or runtime routing
requests were introduced. Remote main was fetched and matched the local base.
