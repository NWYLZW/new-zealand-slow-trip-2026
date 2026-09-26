# Adventure map geometry

## Current Pencil Map

`pencil-geography.json` supplies Natural Earth land and regional geometry;
`pencil-land-cover.json` supplies generalized ESA WorldCover 2021 terrain.
`pencil/waterFeatures.js` resolves water sources before drawing: the five LINZ
lakes and three LINZ river extents replace their Natural Earth counterparts.
Other Natural Earth waters remain. Multipart lakes retain all their parts,
and LINZ polygon holes stay intact. One canvas renderer paints this collection
at both overview and detail resolutions; there is no additional SVG water layer.
`bathymetry.json` and its four sourced depth bands are unchanged.

## Road Routes

`road-routes.json` is the local OpenStreetMap / OSRM car-routing snapshot for
the five displayed land routes. Refresh explicitly with
`npm run fetch:adventure-roads`; validate with `npm run test:adventure-roads`.
No routing requests are made by the browser. Coordinates are longitude/latitude
(EPSG:4326), with source URLs, retrieval times, hashes and snapped anchors.
Named itinerary stops constrain the request; old off-road schematic control
points do not. These paths are not GPS tracks or real-time navigation. Coach
geometry uses a car profile, not an operator-confirmed route.

Source: https://routing.openstreetmap.de/about.html
Attribution: (c) OpenStreetMap contributors, ODbL 1.0.
License: https://www.openstreetmap.org/copyright
Fix map: https://www.openstreetmap.org/fixthemap
Credits are displayed in route details and the backpack map sources.

## Retained Source Records

- Coastline: Natural Earth 1:50m country geometry, New Zealand's two main islands, simplified to 0.018 degrees; public domain.
  Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
- Elevation: Mapzen Terrain Tiles (Terrarium), zoom 5, x=30..31, y=19..20.
  Source: https://registry.opendata.aws/terrain-tiles/
  Attribution and underlying source licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
  Tiles retrieved 2026-09-22. Decode R*256+G+B/256-32768; sample every two pixels, round to 25 metres and clamp ocean depths to zero.

The former map generalized this coarse height field into broad upland and mountain regions. That renderer has been removed. The elevation data and its credits are retained as source records, not loaded by the current map.

Terrain attribution: Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government. All rights reserved. The LINZ source is licensed under Creative Commons Attribution 3.0 New Zealand. Global fallback elevations are courtesy of USGS (GMTED2010/SRTM).

Trip names, positions, dates and descriptions come from src/tripData.js; do not duplicate booking data here. No private-vault payload is included.
