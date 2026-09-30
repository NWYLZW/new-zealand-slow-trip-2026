import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

// Explicit offline refresh only. Browsers never call the public routing service.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { adventureRoutes } = await server.ssrLoadModule('/src/adventure/adventureRoutes.js');
  const routeId = process.argv.find(argument => argument.startsWith('--route='))?.slice(8);
  const routes = adventureRoutes.filter(route => ['road', 'coach'].includes(route.transport)
    && (!routeId || route.id === routeId));
  assert(routes.length, `No driving route matches ${routeId ?? 'the route index'}`);
  const output = new URL('../src/adventure/data/road-routes.json', import.meta.url);
  const result = routeId ? JSON.parse(await readFile(output, 'utf8')) : {
    type: 'AdventureRoadRoutes', crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
    source: {
      engine: 'OSRM', profile: 'driving', service: 'https://routing.openstreetmap.de/routed-car/route/v1/driving/',
      provider: 'FOSSGIS', dataset: 'OpenStreetMap', attribution: '© OpenStreetMap contributors',
      license: 'ODbL 1.0', licenseUrl: 'https://www.openstreetmap.org/copyright',
      servicePolicy: 'https://routing.openstreetmap.de/about.html',
    },
    note: 'Road-network routing snapshot, not a GPS track or live traffic/closure forecast. Coach geometry uses the car profile, not a verified operator route.',
    routes: {},
  };
  for (const route of routes) {
    const input = route.routingPoints.map(([lat, lon]) => [lon, lat]);
    const url = new URL(input.map(point => point.join(',')).join(';'), result.source.service);
    url.search = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'true', alternatives: 'false',
      radiuses: input.map(() => '1000').join(';'), generate_hints: 'false' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(45000),
      headers: { 'User-Agent': 'NewZealandSlowTrip2026/1.0 (https://github.com/NWYLZW/new-zealand-slow-trip-2026)' } });
    const body = await response.text();
    assert(response.ok, `${route.id}: HTTP ${response.status}: ${body.slice(0,500)} (${url.href})`);
    const data = JSON.parse(body), path = data.routes?.[0];
    assert.equal(data.code, 'Ok', `${route.id}: ${data.message}`);
    assert.equal(path.geometry.type, 'LineString');
    assert(path.geometry.coordinates.length > 20);
    assert.equal(data.waypoints.length, input.length);
    assert(data.waypoints.every(point => point.distance <= 1000), `${route.id}: excessive snapping`);
    assert(path.legs.every(leg => leg.steps.every(step => step.mode === 'driving')), `${route.id}: non-driving segment`);
    const roads = path.legs.flatMap(leg => leg.steps.map(step => ({ name: step.name, ref: step.ref ?? '', distanceM: step.distance })));
    result.routes[route.id] = {
      retrievedAt: new Date().toISOString(), requestUrl: url.href, input,
      responseSha256: createHash('sha256').update(body).digest('hex'), dataVersion: data.data_version ?? null,
      geometrySha256: createHash('sha256').update(JSON.stringify(path.geometry)).digest('hex'),
      distanceM: path.distance, durationSeconds: path.duration,
      snapped: data.waypoints.map(point => ({ location: point.location, distanceM: point.distance, name: point.name })),
      legs: path.legs.map(leg => ({ distanceM: leg.distance, summary: leg.summary })), roads,
      geometry: path.geometry,
    };
    console.log(`${route.id}: ${path.geometry.coordinates.length} points; ${(path.distance / 1000).toFixed(1)} km; max snap ${Math.max(...data.waypoints.map(point => point.distance)).toFixed(1)} m`);
    await delay(1100);
  }
  // A targeted refresh preserves every unrelated route snapshot byte-for-byte in JSON values.
  await writeFile(output, `${JSON.stringify(result)}\n`);
} finally { await server.close(); }
