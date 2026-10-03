import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, build } from "vite";
import react from "@vitejs/plugin-react";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { adventureRoutes, projectedRoutePath, focusLocationPositions, routeDirectionsUrl, routeDurationEstimate } =
    await server.ssrLoadModule("/src/adventure/adventureRoutes.js");
  const { adventureContextRouteIds } = await server.ssrLoadModule("/src/adventure/adventureRouteContext.js");
  const { getRouteWaypoints, getAgendaWaypoint, getRouteWaypointCoverage } =
    await server.ssrLoadModule("/src/adventure/adventureWaypoints.js");
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
  const wanakaIds = ["wka-puzzling-world", "wka-hawea", "wka-wanaka-tree"];
  const wanakaEventId = "2026-10-04|瓦纳卡湖边慢游";
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "event", eventId: wanakaEventId }), wanakaIds);
  assert.deepEqual(adventureContextRouteIds({ rightPanel: "day", focus: { kind: "date", value: "2026-10-04" } }), wanakaIds);
  const wanakaRoutes = wanakaIds.map(id => adventureRoutes.find(item => item.id === id));
  assert.equal(new Set(wanakaRoutes.map(item => item.color)).size, 3);
  assert.deepEqual(wanakaRoutes.flatMap(item => item.agendaIndexes), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const drive of wanakaRoutes) {
    assert(drive.roundTrip && drive.transport === "road");
    assert.equal(drive.from, "WKA");
    assert.equal(drive.to, "WKA");
    assert.equal(drive.date, "10/4");
    assert.equal(adventureRoutes.filter(item => item.id === drive.id).length, 1);
    assert.equal(drive.roadGeometry.type, "LineString");
    assert(drive.roadGeometry.coordinates.length > 20);
    assert.deepEqual(drive.roadGeometry.coordinates[0], drive.roadGeometry.coordinates.at(-1));
    assert.equal(createHash("sha256").update(JSON.stringify(drive.roadGeometry)).digest("hex"),
      drive.roadSource.geometrySha256);
    assert.deepEqual(drive.roadSource.input, drive.routingPoints.map(([lat, lng]) => [lng, lat]));
    assert(drive.roadSource.snapped.every(point => point.distanceM < 1000));
    assert(getRouteWaypoints(drive.id).every(point => point.source.sourceUrl && point.summaryEn));
    assert.equal((projectedRoutePath(drive, point => point).match(/L/g) ?? []).length,
      drive.roadGeometry.coordinates.length - 1);
    const link = new URL(routeDirectionsUrl(drive));
    assert.equal(link.searchParams.get("origin"), link.searchParams.get("destination"));
    assert.equal(link.searchParams.get("waypoints").split("|").length, drive.routingPoints.length - 2);
    assert(getRouteWaypointCoverage(drive.id).unresolved.length, "do not claim exact meal or parking locations");
  }
  assert.equal(getAgendaWaypoint("wka-puzzling-world", 0).id, "wanaka-puzzling-world");
  assert.equal(getAgendaWaypoint("wka-puzzling-world", 1), null);
  assert.equal(getAgendaWaypoint("wka-hawea", 2).id, "hawea-albert-town");
  assert.equal(getAgendaWaypoint("wka-hawea", 3).id, "hawea-south-shore");
  assert.equal(getAgendaWaypoint("wka-hawea", 4).id, "hawea-albert-town");
  assert.equal(getAgendaWaypoint("wka-wanaka-tree", 6), null);
  assert.equal(getAgendaWaypoint("wka-wanaka-tree", 7).id, "wanaka-tree-evening");
  const tree = wanakaRoutes[2];
  assert.notDeepEqual(tree.roadSource.snapped[1].location, tree.roadSource.input[1],
    "driving must stop on the road, not at the lakeside landmark");
  const aoraki = adventureRoutes.find(item => item.id === "wanaka-aoraki");
  assert.equal(routeDurationEstimate(aoraki).label, "约2小时40分钟");
  assert.equal(routeDurationEstimate(aoraki, "en").label, "About 2h 40m");
  assert.equal(routeDurationEstimate(wanakaRoutes[0]).label, "往返约8分钟");
  assert.match(routeDurationEstimate(wanakaRoutes[0]).title, /往返/);
  assert.match(routeDurationEstimate({ ...aoraki, hotelEndpoints: {} }).label, /^参考约/);
  assert.match(routeDurationEstimate({ ...aoraki, hotelEndpoints: {} }).title, /未计酒店连接/);
  assert.match(routeDurationEstimate(adventureRoutes.find(item => item.transport === "coach")).label, /^往返路网约/);
  for (const seconds of [undefined, null, 0, -1, Infinity, NaN]) {
    assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: seconds } }), null);
  }
  assert.equal(routeDurationEstimate({ transport: "flight", roadSource: { durationSeconds: 3600 } }), null);
  assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: 3600 } }).label, "约1小时");
  assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: 10 } }).label, "约1分钟");
  const cache = JSON.parse(await readFile("src/adventure/data/road-routes.json", "utf8"));
  const baseline = JSON.parse(execFileSync("git", ["show", "HEAD:src/adventure/data/road-routes.json"], { maxBuffer: 8 * 1024 * 1024 }));
  for (const [id, previous] of Object.entries(baseline.routes)) assert.deepEqual(cache.routes[id], previous);
  console.log("Day trips: Glenorchy plus three Wanaka drives, closed real-road geometry, distinct ink, sourced nodes, agenda mapping, date/event focus and preserved snapshots passed.");
} finally { await server.close(); }

await build({
  configFile: false, logLevel: "warn", plugins: [react()],
  build: { write: false, emptyOutDir: false, minify: false, reportCompressedSize: false,
    rollupOptions: { input: ["src/adventure/AdventurePage.jsx", "src/adventure/AdventureRouteDetails.jsx"],
      external: /^(react|react-dom)(\/|$)/, output: { format: "es" } } },
});
console.log("Adventure page/map/route module linking passed (in memory; no browser or device).");
