import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { geoDistance } from 'd3';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const snapshot = JSON.parse(await readFile(new URL('../src/adventure/data/road-routes.json', import.meta.url)));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const expected = ['zqn-wanaka', 'wanaka-aoraki', 'aoraki-oamaru', 'oamaru-christchurch', 'akc-hobbiton-coach'];
const counts = {};
try {
  const { adventureRoutes, projectedRoutePath, routeGeometryLabel, routeDirectionsUrl } = await server.ssrLoadModule('/src/adventure/adventureRoutes.js');
  assert.deepEqual(Object.keys(snapshot.routes), expected);
  assert.equal(snapshot.coordinateOrder, 'longitude,latitude');
  assert.equal(snapshot.source.profile, 'driving');
  assert.equal(snapshot.source.dataset, 'OpenStreetMap');
  assert.equal(snapshot.source.license, 'ODbL 1.0');
  for (const route of adventureRoutes) {
    if (route.transport === 'flight') {
      assert.equal(route.roadGeometry, null);
      assert.match(projectedRoutePath(route, point => point), /Q/);
      assert.match(routeGeometryLabel(route), /示意/);
      continue;
    }
    const cached = snapshot.routes[route.id], points = cached.geometry.coordinates;
    counts[route.id] = points.length;
    assert(points.length > 1000, `${route.id}: schematic geometry returned`);
    assert.deepEqual(cached.input, route.routingPoints.map(([lat, lon]) => [lon, lat]));
    assert.equal(new URL(cached.requestUrl).origin, 'https://routing.openstreetmap.de');
    assert(Number.isFinite(Date.parse(cached.retrievedAt)) && Date.parse(cached.retrievedAt) <= Date.now());
    assert.match(cached.responseSha256, /^[a-f\d]{64}$/);
    assert.equal(cached.geometrySha256, createHash('sha256').update(JSON.stringify(cached.geometry)).digest('hex'));
    assert.deepEqual(points[0], cached.snapped[0].location);
    assert.deepEqual(points.at(-1), cached.snapped.at(-1).location);
    assert(cached.snapped.every(point => point.distanceM < 200), `${route.id}: large snap`);
    assert(points.every(([lon, lat]) => lon > 168 && lon < 176 && lat > -46 && lat < -36));
    assert(points.slice(1).every((point, i) => geoDistance(points[i], point) * 6371000 < 4000), `${route.id}: disconnected road`);
    assert(cached.distanceM > geoDistance(points[0], points.at(-1)) * 6371000 * 1.05);
    const path = projectedRoutePath(route, point => point);
    assert(!/[CQ]/.test(path), 'Road geometry was replaced by a spline');
    assert.equal(path.split('L').length, points.length, 'Hit path discarded road vertices');
    assert.match(routeGeometryLabel({ ...route, roadGeometry: null }), /示意/);
    const external = new URL(routeDirectionsUrl(route));
    assert.equal(external.searchParams.get('travelmode'), 'driving');
    assert.equal(external.searchParams.get('destination'), route.routingPoints.at(-1).join(','));
  }
  const roads = id => snapshot.routes[id].roads.map(road => `${road.name} ${road.ref}`).join('\n');
  assert.match(roads('zqn-wanaka'), /Crown Range Road/);
  assert.match(roads('zqn-wanaka'), /Cardrona Valley Road/);
  assert.match(roads('wanaka-aoraki'), /Lindis Pass/);
  assert.match(roads('wanaka-aoraki'), /Omarama/);
  assert.match(roads('wanaka-aoraki'), /Mount Cook Road SH 80/);
  assert.deepEqual(snapshot.routes['aoraki-oamaru'].input[1], [170.4771, -44.0047]);
  for (const road of [/SH 1/, /Timaru/, /Ashburton River Bridge/, /Christchurch Southern Motorway/]) {
    assert.match(roads('oamaru-christchurch'), road);
  }
  assert.deepEqual(snapshot.routes['oamaru-christchurch'].input.at(-1), [172.6362, -43.5321]);
} finally { await server.close(); }

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html';
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1323, height: 956 }, deviceScaleFactor: 2 });
const errors = [], routingRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (new URL(request.url()).hostname === 'routing.openstreetmap.de') routingRequests.push(request.url()); });
const ready = () => page.waitForFunction(() => document.querySelector('.trip-pencil-routes')?._routeStats?.frames > 0);
const screenshot = async name => { if (output) await page.screenshot({ path: `${output}/${name}.png` }); };
try {
  assert.equal((await page.goto(base)).status(), 200); await ready(); await page.waitForTimeout(800);
  assert.equal(await page.locator('.trip-route-hit[data-geometry="road-network"]').count(), 5);
  assert.equal(await page.locator('.trip-route-hit[data-geometry="schematic"]').count(), 2);
  const samples = await page.locator('.trip-pencil-routes').evaluate(canvas => canvas._routeSamples);
  for (const [id, count] of Object.entries(counts)) assert.equal(samples.find(sample => sample.id === id).count, count);
  await screenshot('roads-desktop');

  const route = page.locator('[data-route="oamaru-christchurch"]');
  await route.focus(); await page.keyboard.press('Enter');
  await page.waitForURL('**/*route=oamaru-christchurch');
  assert.match(await page.locator('.trip-route-note').textContent(), /约 248 km/);
  assert.match(await page.locator('.trip-route-note').textContent(), /非实测行车轨迹/);
  assert(await page.getByRole('link', { name: '© OpenStreetMap contributors', exact: true }).isVisible());
  const link = new URL(await page.getByRole('link', { name: '在 Google 地图打开' }).getAttribute('href'));
  assert.equal(link.searchParams.get('destination'), '-43.5321,172.6362');
  await screenshot('roads-details');
  await page.reload(); await ready();
  assert.match(await page.locator('.trip-route-note').textContent(), /约 248 km/);
  await page.keyboard.press('Escape');
  await page.goBack(); assert.equal(new URL(page.url()).searchParams.get('route'), 'oamaru-christchurch');
  await page.keyboard.press('Escape');

  // Inspect the route where it actually crosses Ashburton, not the old chord.
  const focusRoad = async () => page.evaluate(() => {
    const area = document.querySelector('.trip-map-area'), center = area._project([171.751, -43.908]);
    const current = area.__zoom;
    return { x: area.clientWidth / 2 - (center[0] * current.k + current.x),
      y: area.clientHeight / 2 - (center[1] * current.k + current.y) };
  });
  const delta = await focusRoad();
  // D3 pan accepts ordinary pointer drags; large offscreen moves still retain capture.
  await page.mouse.move(150, 200); await page.mouse.down(); await page.mouse.move(150 + delta.x, 200 + delta.y); await page.mouse.up();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: '放大地图', exact: true }).click();
  await page.waitForTimeout(1600);
  const pixelEvidence = await page.evaluate(() => {
    const canvas = document.querySelector('.trip-pencil-routes'), context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 25 && pixels[i] > pixels[i + 1] * 1.15) ink++;
    return { ink, zoom: canvas._mapView.k, stats: canvas._routeStats };
  });
  assert.equal(pixelEvidence.zoom, 12); assert(pixelEvidence.ink > 200, 'High zoom road canvas is blank');
  await screenshot('roads-ashburton');

  await page.goto(`${base}?route=akc-hobbiton-coach`); await ready();
  assert.match(await page.locator('.trip-route-note').textContent(), /非运营商确认路线/);
  await page.goto(`${base}?route=chc-akl`); await ready();
  assert.match(await page.locator('.trip-route-note').textContent(), /并非实际飞行轨迹/);
  await page.setViewportSize({ width: 436, height: 900 });
  await page.goto(`${base}?route=oamaru-christchurch`); await ready(); await page.waitForTimeout(500);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('link', { name: '在 Google 地图打开' }).scrollIntoViewIfNeeded();
  assert(await page.getByRole('link', { name: '在 Google 地图打开' }).isVisible());
  await screenshot('roads-mobile-details');
  await page.keyboard.press('Escape'); await screenshot('roads-mobile');
  assert.deepEqual(routingRequests, [], 'Browser unexpectedly queried routing service');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ counts, pixelEvidence, roadSources: true, directionsLink: true, history: true, mobile: true, runtimeRoutingRequests: routingRequests, errors }));
} finally { await browser.close(); }
