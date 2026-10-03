import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { connectHotelRoad, connectHotelRoute } from "../src/adventure/hotelRoadConnection.js";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { adventureRoutes, routeDirectionsUrl, focusLocationPositions } =
    await server.ssrLoadModule("/src/adventure/adventureRoutes.js");
  const { resolveHotelRouteEndpoints } = await server.ssrLoadModule("/src/adventure/adventureHotelRoutes.js");
  const source = JSON.stringify(adventureRoutes);
  // Synthetic accommodation coordinates, never a real decrypted vault.
  const ids = ["hotel-queenstown", "hotel-wanaka", "mount-cook", "hotel-oamaru", "hotel-christchurch"];
  const data = { accommodations: Object.fromEntries(ids.map((id, index) => [id,
    { coordinates: [-40 - index * .01, 170 + index * .01], propertyName: `Fixture hotel ${index}` }])) };
  assert.equal(resolveHotelRouteEndpoints(adventureRoutes, { data }), adventureRoutes);
  const unlocked = resolveHotelRouteEndpoints(adventureRoutes, { data, isUnlocked: true });
  const route = id => unlocked.find(item => item.id === id);
  const pairs = [
    ["zqn-glenorchy", ids[0], ids[0]], ["zqn-wanaka", ids[0], ids[1]],
    ["wka-puzzling-world", ids[1], ids[1]], ["wka-hawea", ids[1], ids[1]],
    ["wka-wanaka-tree", ids[1], ids[1]],
    ["wanaka-aoraki", ids[1], ids[2]], ["aoraki-oamaru", ids[2], ids[3]],
    ["oamaru-christchurch", ids[3], ids[4]],
  ];
  for (const [id, origin, destination] of pairs) {
    const resolved = route(id), base = adventureRoutes.find(item => item.id === id);
    assert.equal(resolved.hotelEndpoints.origin.bookingId, origin);
    assert.equal(resolved.hotelEndpoints.destination.bookingId, destination);
    assert.deepEqual(resolved.routingPoints[0], data.accommodations[origin].coordinates);
    assert.deepEqual(resolved.routingPoints.at(-1), data.accommodations[destination].coordinates);
    assert.deepEqual(resolved.routingPoints.slice(1, -1), base.routingPoints.slice(1, -1));
    const link = new URL(routeDirectionsUrl(resolved));
    assert.equal(link.searchParams.get("origin"), data.accommodations[origin].coordinates.join(","));
    assert.equal(link.searchParams.get("destination"), data.accommodations[destination].coordinates.join(","));
    const focus = focusLocationPositions({ routeIds: [id] }, unlocked);
    assert(focus.some(point => point.join() === [...data.accommodations[origin].coordinates].reverse().join()));
  }
  assert(unlocked.filter(item => item.transport !== "road").every(item => !item.hotelEndpoints));
  const english = resolveHotelRouteEndpoints(adventureRoutes, { data, isUnlocked: true, language: "en" });
  assert.deepEqual(english.find(item => item.id === "zqn-wanaka").routingPoints, route("zqn-wanaka").routingPoints);
  const locked = resolveHotelRouteEndpoints(adventureRoutes, { data, isUnlocked: false });
  assert.equal(JSON.stringify(locked), source, "relock restores public geometry and endpoints");
  assert.equal(JSON.stringify(adventureRoutes), source, "public singleton never mutates");
  const missing = resolveHotelRouteEndpoints(adventureRoutes, { isUnlocked: true, data: { accommodations: {} } });
  assert(!missing.find(item => item.id === "zqn-glenorchy").hotelEndpoints);
  const invalid = resolveHotelRouteEndpoints(adventureRoutes, { isUnlocked: true,
    data: { accommodations: { "hotel-queenstown": { coordinates: [Infinity, 190] } } } });
  assert(!invalid.find(item => item.id === "zqn-glenorchy").hotelEndpoints);

  const points = Array.from({ length: 21 }, (_, index) => [170 + index * .001, -40]);
  const hotel = [170.001, -40.001];
  const bend = [170.0005, -40.001];
  const town = { source: { name: "Synthetic fixture" }, place: { roads: [
    { kind: "residential", coordinates: [hotel, bend, points[0]] },
    { kind: "footway", coordinates: [hotel, points[5]] },
  ] } };
  const connected = connectHotelRoad(points, [...hotel].reverse(), town);
  assert(connected);
  assert.deepEqual(connected.coordinates[0], hotel);
  assert.deepEqual(connected.coordinates[1], bend, "do not take a pedestrian shortcut");
  assert.deepEqual(connected.coordinates.slice(-11), points.slice(-11), "preserve through-route vertices");
  assert.equal(connectHotelRoad(points, [-41, 171], town), null, "no long invented driveway");
  assert.equal(connectHotelRoad(points, [...hotel].reverse(), { place: { roads: [
    { kind: "residential", coordinates: [hotel, bend] },
  ] } }), null, "no straight fallback across disconnected roads");
  const original = { roadGeometry: { type: "LineString", coordinates: points }, hotelEndpoints: {
    origin: { cityTag: "TEST", position: [...hotel].reverse() },
  } };
  assert.equal(connectHotelRoute(original, new Map([["TEST", town]])).hotelRoadStatus, "connected");
  assert.equal(connectHotelRoute(original, new Map()).hotelRoadStatus, "partial");
  assert.equal(connectHotelRoute({ ...original, roadGeometry: null }, new Map()).hotelRoadStatus, "partial");
  assert.equal(original.roadGeometry.coordinates, points);
  const detourStop = [170.0005, -40.002];
  const detour = [points[0], bend, detourStop, bend, ...points.slice(1)];
  assert(connectHotelRoad(detour, [...hotel].reverse(), town, { preservePosition: detourStop })
    .coordinates.some(point => point === detourStop), "hotel access must preserve an early out-and-back waypoint");
  assert.equal(connectHotelRoad(detour, [...hotel].reverse(), town, { preservePosition: [172, -42] }),
    null, "missing protected waypoint must not allow an unbounded shortcut");

  const townWka = JSON.parse(await readFile("src/adventure/data/town-maps/WKA.json", "utf8"));
  const publicWka = missing.find(item => item.id === "zqn-wanaka");
  assert(connectHotelRoad(publicWka.roadGeometry.coordinates, publicWka.hotelEndpoints.destination.position,
    townWka, { reverse: true }), "public Wanaka stay connects using existing road snapshots");
  for (const base of missing.filter(item => item.id.startsWith("wka-"))) {
    const result = connectHotelRoute(base, new Map([["WKA", townWka]]));
    assert.equal(result.hotelRoadStatus, "connected", base.id);
    const key = point => point.map(value => value.toFixed(6)).join(",");
    for (const stop of base.roadSource.snapped.slice(1, -1)) {
      assert(result.roadGeometry.coordinates.some(point => key(point) === key(stop.location)),
        base.id + ": hotel connections must preserve every driving stop");
    }
  }
  console.log("Hotel routes: locked/unlocked/relocked endpoints, five existing routes and three Wanaka drives, preserved waypoints, links, focus, graph connections and privacy fixtures passed.");
} finally { await server.close(); }
