import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, build } from "vite";
import react from "@vitejs/plugin-react";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { adventureRoutes, projectedRoutePath, focusLocationPositions, routeDirectionsUrl } =
    await server.ssrLoadModule("/src/adventure/adventureRoutes.js");
  const { adventureContextRouteIds } = await server.ssrLoadModule("/src/adventure/adventureRouteContext.js");
  const { getRouteWaypoints, getAgendaWaypoint } = await server.ssrLoadModule("/src/adventure/adventureWaypoints.js");
  const route = adventureRoutes.find(item => item.id === "zqn-glenorchy");
  assert(route?.roundTrip);
  assert.equal(route.from, route.to);
  assert.equal(route.transport, "road");
  assert.equal(route.color, "#287d78");
  assert.equal(adventureRoutes.filter(item => item.id === route.id).length, 1);
  assert.equal(route.roadGeometry.type, "LineString");
  assert(route.roadGeometry.coordinates.length > 1000);
  assert.equal(createHash("sha256").update(JSON.stringify(route.roadGeometry)).digest("hex"),
    route.roadSource.geometrySha256);
  assert.deepEqual(route.roadSource.input, route.routingPoints.map(([lat, lng]) => [lng, lat]));
  assert.deepEqual(route.roadGeometry.coordinates[0], route.roadGeometry.coordinates.at(-1));
  assert(route.roadSource.roads.some(road => road.name === "Glenorchy Queenstown Road"));
  assert(route.roadSource.snapped.every(point => point.distanceM < 1000));
  assert.equal(route.roadSource.snapped.length, 5);
  const path = projectedRoutePath(route, point => point);
  assert.equal((path.match(/L/g) ?? []).length, route.roadGeometry.coordinates.length - 1);
  assert(!/[QC]/.test(path), "road vertices must not be replaced with curves");
  const direction = new URL(routeDirectionsUrl(route));
  assert.equal(direction.searchParams.get("origin"), direction.searchParams.get("destination"));
  assert.equal(direction.searchParams.get("waypoints").split("|").length, 3);
  const stops = getRouteWaypoints(route.id);
  assert.equal(stops.length, 4);
  assert(stops.every(point => point.source.sourceUrl && point.source.license === "ODbL 1.0"));
  assert.equal(getAgendaWaypoint(route.id, 1).id, "glenorchy-bobs-cove");
  assert.equal(getAgendaWaypoint(route.id, 2).specificity, "area");
  assert.equal(getAgendaWaypoint(route.id, 3), null, "never pin an unknown lunch venue to the pier");
  assert.equal(getAgendaWaypoint(route.id, 4).drivingStop, false);
  const eventId = "2026-10-01|格林诺奇湖岸公路";
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "event", eventId }), [route.id]);
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "day", focus: { kind: "date", value: "2026-10-01" } }), [route.id]);
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "event", eventId: "2026-09-30|皇后镇适应日" }), []);
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "event", eventId, front: "tasks",
    focus: { kind: "date", value: "2026-09-30" } }), [], "foreground calendar owns date focus");
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "event", eventId: "2026-09-29|飞往皇后镇" }), [],
    "road context must not take over international flight selection");
  const positions = focusLocationPositions({ positions: [], routeIds: [route.id] });
  assert.deepEqual(positions, route.roadGeometry.coordinates);
  const cache = JSON.parse(await readFile("src/adventure/data/road-routes.json", "utf8"));
  const baseline = JSON.parse(execFileSync("git", ["show", "HEAD:src/adventure/data/road-routes.json"], { maxBuffer: 8 * 1024 * 1024 }));
  for (const [id, previous] of Object.entries(baseline.routes)) assert.deepEqual(cache.routes[id], previous);
  console.log("Day trip: closed real-road route, distinct ink, four sourced nodes, agenda mapping, date/event focus, preserved route snapshots passed.");
} finally { await server.close(); }

await build({
  configFile: false, logLevel: "warn", plugins: [react()],
  build: { write: false, emptyOutDir: false, minify: false, reportCompressedSize: false,
    rollupOptions: { input: ["src/adventure/AdventurePage.jsx", "src/adventure/AdventureRouteDetails.jsx"],
      external: /^(react|react-dom)(\/|$)/, output: { format: "es" } } },
});
console.log("Adventure page/map/route module linking passed (in memory; no browser or device).");
