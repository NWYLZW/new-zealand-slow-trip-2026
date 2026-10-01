import assert from "node:assert/strict";
import { createServer } from "vite";
import { nearbyContext, usableLocation, locationDistance } from "../src/adventure/nearby/nearbyModel.js";
import { createNearbyLocation } from "../src/adventure/nearby/nearbyLocation.js";

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { buildNearbyData } = await server.ssrLoadModule("/src/adventure/nearby/nearbyData.js");
  const { zonedLocalInstant } = await server.ssrLoadModule("/src/adventure/adventureEventTime.js");
  const data = buildNearbyData();
  const at = (date, clock) => zonedLocalInstant(date, clock, "Pacific/Auckland");
  const breakfast = nearbyContext(data, at("2026-10-02", "10:00"), null);
  assert.equal(breakfast.current.label, "慢早餐与湖边散步");
  assert.equal(breakfast.current.confidence, "schedule");
  assert.equal(breakfast.next.label, "花园或市区自由活动");
  assert.equal(nearbyContext(data, at("2026-10-02", "11:00"), null).current.label, breakfast.next.label);
  assert.equal(nearbyContext(data, at("2026-10-02", "18:45"), null).current, null);
  assert.equal(nearbyContext(data, at("2026-10-02", "18:45"), null).next.label, "简单晚餐");
  assert.equal(nearbyContext(data, at("2026-10-01", "15:30"), null).current.transit, true);
  assert.equal(nearbyContext(data, at("2026-11-01", "10:00"), null).current, null);
  assert.equal(nearbyContext(data, at("2026-09-01", "10:00"), null).next.id, data.rows[0].id);
  assert(data.rows.every(row => Number.isFinite(row.start) && (row.pointOnly ? row.end === row.start : row.end > row.start)));
  const flight = data.rows.find(row => row.id.endsWith("flight-0"));
  assert(flight && nearbyContext(data, flight.start + 1000, null).current);
  const en = buildNearbyData({ language: "en" });
  assert.match(nearbyContext(en, at("2026-10-02", "10:00"), null).current.label, /breakfast/i);
  assert.deepEqual(en.rows.map(row => [row.id, row.transit]), data.rows.map(row => [row.id, row.transit]),
    "Display language cannot change inference of travel vs stationary activity");
  assert(data.places.some(place => place.tag === "WTP"));
  assert.equal(data.places.some(place => place.target === "stay"), false);
  const unlocked = buildNearbyData({ isUnlocked: true, data: {} });
  assert(unlocked.places.some(place => place.target === "stay"));
  assert(!buildNearbyData({ isUnlocked: false, data: {} }).places.some(place => place.target === "stay"));
  const arrival = unlocked.rows.find(row => row.dateId === "2026-10-03" && row.places.some(place => place.target === "stay"));
  assert(arrival, "Existing event stay bindings must reach the arrival reminder");
  const place = data.places.find(item => item.target === "waypoint" && item.specificity === "place");
  const fixture = { rows: [{ id: "test", start: 1000, end: 1000000, places: [place], routeIds: ["road"], transit: false }],
    days: [{ dateId: "fixture", start: 1000, end: 1000000 }], places: [place] };
  const location = { position: place.position, accuracy: 20, timestamp: 5000 };
  assert.equal(nearbyContext(fixture, 5000, location).current.confidence, "near-place");
  assert.equal(nearbyContext(fixture, 5000, { ...location, accuracy: 600 }).nearby, null);
  assert.equal(nearbyContext(fixture, 70000, location).current.confidence, "schedule");
  assert.equal(usableLocation({ ...location, timestamp: 10000 }, 5000), null);
  assert.equal(usableLocation({ ...location, position: [91, 181] }, 5000), null);
  fixture.rows[0].places = [{ ...place, specificity: "town" }];
  assert.equal(nearbyContext(fixture, 5000, location).current.confidence, "schedule");
  fixture.rows[0].transit = true;
  const road = { id: "road", transport: "road", roadGeometry: { coordinates: [[place.position[1], place.position[0]]] } };
  assert.equal(nearbyContext(fixture, 5000, location, [road]).current.confidence, "on-route");
  assert.equal(nearbyContext(fixture, 5000, location, [{ ...road, transport: "flight" }]).current.confidence, "schedule");
  assert.equal(nearbyContext(fixture, 5000, location, [{ ...road, roadGeometry: null }]).current.confidence, "schedule");
  fixture.rows[0].pointOnly = true;
  assert.equal(nearbyContext(fixture, 5000, location, [road]).current.confidence, "schedule");
  fixture.rows.push({ ...fixture.rows[0], id: "other", start: 4000, pointOnly: false, transit: false, places: [place] });
  assert.equal(nearbyContext(fixture, 5000, location).current.id, "other");
  assert.equal(nearbyContext(fixture, 1000000, location).current, null);
  assert.equal(locationDistance([0, 0], [0, 0]), 0);
  assert(locationDistance([0, 179.99], [0, -179.99]) < 3000);
  await server.ssrLoadModule("/src/adventure/nearby/AdventureNearby.jsx");
} finally { await server.close(); }

let now = 100000, counter = 0;
const watches = new Map(), cleared = [], timers = new Map(), changes = [];
const permission = new EventTarget(); permission.state = "granted";
const sensor = {
  watchPosition(success, failure, options) { watches.set(++counter, { success, failure, options }); return counter; },
  clearWatch(id) { cleared.push(id); },
};
const controller = createNearbyLocation({ geolocation: sensor, permissions: { query: async () => permission },
  now: () => now, onChange: state => changes.push(state),
  setTimer(fn, delay) { const id = Symbol(); timers.set(id, { fn, due: now + delay }); return id; },
  clearTimer(id) { timers.delete(id); } });
const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const fix = timestamp => ({ coords: { latitude: -45, longitude: 168, accuracy: 20 }, timestamp });
const advance = amount => {
  now += amount;
  for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.fn(); }
};
controller.setActive(true);
assert.equal(counter, 0, "Mounting must not request geolocation");
controller.enable(); await tick();
assert.equal(counter, 1);
assert.equal(watches.get(1).options.enableHighAccuracy, false);
watches.get(1).success(fix(now));
assert.equal(changes.at(-1).status, "ready");
const before = changes.length;
watches.get(1).success(fix(now - 1000));
assert.equal(changes.length, before, "Older readings never replace a newer fix");
now += 1000; watches.get(1).success(fix(now));
assert.equal(changes.length, before, "Frequent readings are coalesced");
advance(9000);
assert.equal(changes.at(-1).location.timestamp, now - 9000);
controller.setActive(false);
assert(cleared.includes(1)); assert.equal(timers.size, 0);
assert.equal(changes.at(-1).location, null);
const afterPause = changes.length;
watches.get(1).success(fix(now));
assert.equal(changes.length, afterPause, "Late hidden-page readings are discarded");
controller.setActive(true); await tick();
assert.equal(counter, 2);
watches.get(2).success(fix(now));
advance(60000);
assert.equal(changes.at(-1).status, "stale");
assert.equal(changes.at(-1).location, null);
permission.state = "denied"; permission.dispatchEvent(new Event("change"));
assert.equal(changes.at(-1).status, "denied");
assert.equal(changes.at(-1).enabled, false);
controller.setActive(false); controller.setActive(true); await tick();
assert.equal(counter, 2, "A denied permission is not automatically requested again");
permission.state = "granted";
controller.enable(); await tick();
watches.get(3).failure({ code: 3 });
assert.equal(changes.at(-1).status, "timeout");
controller.enable(); await tick();
watches.get(4).success({ ...fix(now), coords: { latitude: -45, longitude: 168, accuracy: 900 } });
assert.equal(changes.at(-1).status, "imprecise");
controller.disable();
assert.equal(changes.at(-1).enabled, false); assert.equal(timers.size, 0);
controller.dispose();
const afterDispose = changes.length;
watches.get(4).success(fix(now));
assert.equal(changes.length, afterDispose);
let fallbackWatches = 0;
const fallbackStates = [];
const fallback = createNearbyLocation({ geolocation: { watchPosition() { return ++fallbackWatches; }, clearWatch() {} },
  onChange: state => fallbackStates.push(state) });
fallback.setActive(true); fallback.enable(); fallback.setActive(false); fallback.setActive(true);
assert.equal(fallbackWatches, 1, "Missing Permissions API requires another explicit click after resume");
assert.equal(fallbackStates.at(-1).enabled, false);
fallback.dispose();
const pendingStates = [];
let resolvePermission;
const pendingController = createNearbyLocation({ geolocation: sensor,
  permissions: { query: () => new Promise(resolve => { resolvePermission = resolve; }) },
  onChange: state => pendingStates.push(state) });
pendingController.setActive(true); pendingController.enable(); await tick();
pendingController.setActive(false); pendingController.setActive(true); await tick();
const watchCount = counter;
pendingController.dispose();
resolvePermission(permission); await tick();
assert.equal(counter, watchCount, "A pending resume cannot restart a disposed observer");
console.log("Nearby: real schedule linkage, boundaries, location confidence, vault gating, throttling and permission lifecycle passed. No browser or device used.");
