# Unified Application

## Contract

- One React root, one source HTML entry and one PWA registration.
- The pencil map is the default project-root page; the legacy itinerary lives at `/v1`.
- Preserve query/hash deep links, browser history, language and booking storage keys.
- Keep both existing visual styles and lazy-load their page modules.
- Preserve installed-app identity and scope; the start URL opens the default map.
- Normalize old `/adventure` and `adventure.html` links to the root with query/hash preserved;
  generate `/v1` and legacy route aliases for static GitHub Pages hosting.

## Default-Route Promotion

- Updated on 2026-09-27: menu, route-day links, sidebar and PWA shortcuts use the canonical paths.
- Existing app identity, storage keys and installed-worker scope are unchanged.
- Deployment uses the existing `main` GitHub Pages workflow; no separate app shell is introduced.

## Promotion Verification

- Verified 2026-09-27: production build, AI-rule, accommodation, image and event-media audits pass.
- Social-guide audit covers all 26 curated events; four personal logistics phases are explicitly exempt.
- `test:unified-pwa` passes strict static-host aliases, preserved deep links, offline first visits
  in both directions, reload, browser history, installation prompts and desktop/mobile style checks.
- Browser runtime errors: none. Existing installed devices and OS-level installation were not tested.
- Existing build and data warnings below remain nonblocking; no new screenshots were required.

## Previous Verification

- Verified 2026-09-26: shared routing, scoped styles and startup install-prompt capture.
- Production build and strict-static-host deep links pass, including legacy and directory aliases.
- A real service worker controls both routes. First entering either page allows opening the other
  page offline without previously visiting it; query reload, back/forward and local preferences pass.
- Install prompts captured on the map survive navigation; consumed prompts are not reused.
- Desktop (1324px) and mobile (436px) screenshots checked after cross-page navigation.
- All five adventure suites pass: pencil, controls, roads, water and text (including 320px text).
- Accommodation, visual-duplicate, event-media, social-guide and AI-rule audits pass.
- Existing nonblocking warnings: missing hero-route-render.webp, large page bundles,
  one non-selectable room lacking verified photos and shared social posts across events.
- No commit, push or deployment was performed during that earlier verification. Actual OS installation and updating an existing
  installed device were not exercised; app identity/scope/start URL remain unchanged.

Static route files are generated copies of the one built shell, not separately maintained applications.
Offline support covers the application, bundled map data, fonts and icons. Photos and external map tiles
are runtime-cached only after being visited; the entire photo library is not precached.
