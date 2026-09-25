# Adventure map geometry

- Coastline: Natural Earth 1:50m country geometry, New Zealand's two main islands, simplified to 0.018 degrees; public domain.
  Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson
- Elevation: Mapzen Terrain Tiles (Terrarium), zoom 5, x=30..31, y=19..20.
  Source: https://registry.opendata.aws/terrain-tiles/
  Attribution and underlying source licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
  Tiles retrieved 2026-09-22. Decode R*256+G+B/256-32768; sample every two pixels, round to 25 metres and clamp ocean depths to zero.

The map generalizes this coarse height field into broad, flat-colored upland and mountain regions. It uses no directional hill shading, raster relief texture or raised contour terraces. A few illustrative mountain marks follow the generalized highland locations; they do not identify individual peaks. It is a regional visualisation, not a navigation-grade terrain model. The island tilt and vertical edge thickness are presentation choices; geographic coordinates remain shared across coastline, terrain and stops.

Terrain attribution: Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government. All rights reserved. The LINZ source is licensed under Creative Commons Attribution 3.0 New Zealand. Global fallback elevations are courtesy of USGS (GMTED2010/SRTM).

Trip names, positions, dates and descriptions come from src/tripData.js; do not duplicate booking data here. No private-vault payload is included.
