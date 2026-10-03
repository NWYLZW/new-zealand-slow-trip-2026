import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { parse } from "@babel/parser";
import { createServer } from "vite";
import { nearbyContext, nearbyPlaceTarget, nearbyRefreshDelay, LOCATION_MAX_AGE } from "../src/adventure/nearby/nearbyModel.js";
import { nearbyPublicPins, nearbyPlaceBindings } from "../src/adventure/nearby/nearbyPlaceBindings.js";

const started = performance.now();
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] } });
const counts = { temporalCases: 0, placeCases: 0, sourceBoundaryChecks: 0, movementChecks: 0, syntheticChecks: 0 };
const until = row => row.pointOnly ? row.reminderUntil : row.end;
const signature = model => [model.phase, model.day?.dateId, model.current?.id, model.current?.confidence,
  model.next?.id, model.previous?.id, model.nearby?.id, model.nearby?.targetId,
  model.fallback?.kind, model.fallback?.targetId, model.locationEvidence.status, model.locationEvidence.reason];
const rowFacts = row => [row.id, row.dateId, row.start, row.end, row.zone, row.endZone, row.pointOnly,
  row.reminderUntil, row.transit, row.moving, row.places.map(place => [place.id, place.position, place.specificity, place.evidenceRole])];

try {
  const { buildNearbyData } = await server.ssrLoadModule("/src/adventure/nearby/nearbyData.js");
  const { getAdventureCalendarDays } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const { adventureDayEventRows } = await server.ssrLoadModule("/src/adventure/AdventureDayDetails.jsx");
  const { zonedLocalInstant } = await server.ssrLoadModule("/src/adventure/adventureEventTime.js");
  const { adventureWaypoints } = await server.ssrLoadModule("/src/adventure/adventureWaypoints.js");
  const { mapStops } = await server.ssrLoadModule("/src/tripData.js");
  const { adventureStops } = await server.ssrLoadModule("/src/adventure/adventureData.js");
  const { internationalMapStops } = await server.ssrLoadModule("/src/adventure/internationalMapData.js");
  const canonical = getAdventureCalendarDays();
  const locked = buildNearbyData();
  const allSources = canonical.flatMap(day => day.day.events);
  assert.equal(locked.days.length, canonical.length);
  assert.equal(locked.events.length, canonical.reduce((sum, day) => sum + day.events.length, 0));
  assert.equal(locked.sourceItems.length, allSources.length);
  assert(locked.sourceItems.every(item => item.status === "represented"), "Every source item must have an explicit row/flight endpoint mapping");
  assert.equal(new Set(locked.rows.map(row => row.id)).size, locked.rows.length);
  assert.equal(locked.rows.filter(row => row.flight?.flightNumber === "MH0522").length, 1);
  assert.equal(locked.rows.find(row => row.flight?.flightNumber === "MH0522").sourceRefs.length, 2);

  for (const day of canonical) for (const [sourceIndex, entry] of day.day.events.entries()) {
    const row = locked.rows.find(item => item.dateId === day.dateId && item.sourceIndex === sourceIndex);
    if (!row) continue;
    const summary = entry[2]?.summary ?? "";
    if (/驶向|开往|驾车|继续上路|继续北上|继续前往|前往蒂卡波|前往库克山机场|大巴前往|大巴返回/.test(summary)) {
      assert.equal(row.transit, true, `${day.dateId}/${sourceIndex} canonical movement metadata`);
      assert.equal(row.moving, true);
      counts.movementChecks++;
    }
    if (/^(Bob's Cove 停留|Bennett's Bluff 停留|格林诺奇午餐|Crown Range 观景|直升机报到、天气确认与候飞|返城后自由休息)$/.test(summary)) {
      assert.equal(row.transit, false, `${day.dateId}/${sourceIndex} stationary within travel event`);
      assert.equal(row.moving, false);
      counts.movementChecks++;
    }
  }

  for (const day of canonical) for (const event of day.events) {
    for (const source of adventureDayEventRows(event, day.dateId, "zh", day.day.primaryTimeZone ?? day.day.timeZone ?? "Pacific/Auckland")) {
      const row = [...locked.rows, ...locked.untimed].find(item => item.sourceRefs.some(ref => ref.rowId === source.key));
      assert(row, `Missing display row ${source.key}`);
      if (source.interval) assert.deepEqual([row.start, row.end], [source.interval.start, source.interval.end]);
      else if (Number.isFinite(source.point)) assert.deepEqual([row.start, row.end], [source.point, source.point]);
      else assert.deepEqual([row.start, row.end], [null, null]);
      counts.sourceBoundaryChecks++;
    }
  }
  for (const [dateId, bindings] of Object.entries(nearbyPlaceBindings)) {
    for (const [index, ids] of Object.entries(bindings)) {
      assert(locked.sourceItems.some(item => item.dateId === dateId && item.sourceIndex === Number(index)));
      for (const id of ids) assert(locked.places.some(place => place.id === id), `Missing point ${id}`);
    }
  }

  // Parse the public literal without importing Leaflet/DOM or executing the JSX.
  const pinSource = await readFile(new URL("../src/components/HotelComparisonDialog.jsx", import.meta.url), "utf8");
  const ast = parse(pinSource, { sourceType: "module", plugins: ["jsx"] });
  const declaration = ast.program.body.find(node => node.type === "ExportNamedDeclaration"
    && node.declaration?.declarations?.some(item => item.id.name === "attractionPinsByRegion"))
    .declaration.declarations.find(item => item.id.name === "attractionPinsByRegion").init;
  const literal = node => {
    if (node.type === "ObjectExpression") return Object.fromEntries(node.properties.map(property =>
      [property.key.name ?? property.key.value, literal(property.value)]));
    if (node.type === "ArrayExpression") return node.elements.map(literal);
    if (["StringLiteral", "NumericLiteral"].includes(node.type)) return node.value;
    if (node.type === "UnaryExpression" && node.operator === "-") return -literal(node.argument);
    throw new Error(`Unexpected nonliteral pin node: ${node.type}`);
  };
  const sourcePins = Object.values(literal(declaration)).flat();
  for (const pin of nearbyPublicPins) {
    const source = sourcePins.find(item => item.label === pin.source.label);
    assert(source, `Missing pin source ${pin.id}`);
    assert.deepEqual(pin.position, source.position);
    assert.equal(pin.nameEn, source.labelEn);
  }

  const instants = new Set();
  const addBoundary = instant => {
    for (const offset of [-1, 0, 1]) instants.add(instant + offset);
  };
  addBoundary(locked.tripStart); addBoundary(locked.tripEnd);
  for (const row of locked.rows) {
    addBoundary(row.start); addBoundary(row.end);
    assert.equal(nearbyRefreshDelay(locked, row.start - 1), 1);
    assert(nearbyRefreshDelay(locked, row.start) > 0);
    if (row.reminderUntil) addBoundary(row.reminderUntil);
    instants.add(Math.floor((row.start + until(row)) / 2));
  }
  for (const day of locked.days) {
    addBoundary(day.start); addBoundary(day.end);
    for (let instant = day.start; instant < day.end; instant += 30 * 60000) instants.add(instant);
  }
  const fix = (position, timestamp, accuracy = 20) => ({ position, timestamp, accuracy });
  const validate = (dataset, now, model) => {
    assert(model.current || model.fallback, `No state at ${new Date(now).toISOString()}`);
    if (model.current) {
      assert(model.current.start <= now && until(model.current) > now);
      assert.equal(model.current.executionStatus, "planned");
      assert.equal(model.fallback, null);
    }
    const nextStart = Math.min(...dataset.rows.filter(row => row.executionStatus !== "completed"
      && row.start > now).map(row => row.start));
    assert.equal(model.next?.start ?? Infinity, nextStart);
    assert.notEqual(model.next?.executionStatus, "completed");
    if (model.fallback?.target) {
      assert.equal(model.fallback.target, "day");
      assert(dataset.days.some(day => day.dateId === model.fallback.targetId));
    }
    if (!model.location) {
      assert.equal(model.nearby, null);
      assert.equal(model.locationEvidence.status, "unavailable");
      if (model.current) assert.equal(model.current.confidence, "schedule");
    }
    if (model.current?.moving && !model.current.transit) assert.equal(model.current.confidence, "schedule");
    if (model.nearby?.target === "event") assert(dataset.events.some(event => event.id === model.nearby.targetId));
    assert(!["arrived", "completed"].includes(model.current?.executionStatus));
  };

  for (const isUnlocked of [false, true]) {
    // Synthetic vault content verifies the privacy boundary without reading any private vault.
    const probe = buildNearbyData({ isUnlocked: true, data: {} }).places.find(place => place.target === "stay");
    const data = { accommodations: { [probe.targetId]: { propertyName: "NEARBY_PRIVATE_SENTINEL", coordinates: [-45.04, 168.67] } } };
    const zh = buildNearbyData({ isUnlocked, data }), en = buildNearbyData({ language: "en", isUnlocked, data });
    assert.deepEqual(zh.rows.map(rowFacts), en.rows.map(rowFacts), "Language must not alter schedule/place facts");
    assert.equal(JSON.stringify(zh).includes("NEARBY_PRIVATE_SENTINEL"), isUnlocked);
    if (!isUnlocked) assert(zh.places.every(place => place.target !== "stay"));
    for (const now of instants) {
      const states = [
        [null, "off"], [null, "denied"], [null, "unavailable"],
        [fix([-45.03, 168.66], now), "ready"],
        [fix([0, 0], now), "ready"],
        [fix([-45.03, 168.66], now - LOCATION_MAX_AGE), "stale"],
        [fix([-45.03, 168.66], now, 501), "imprecise"],
        [fix([-45.03, 168.66], now + 1001), "loading"],
        [fix([91, 181], now), "unavailable"],
      ];
      for (const [location, status] of states) {
        const left = nearbyContext(zh, now, location, [], status);
        const right = nearbyContext(en, now, location, [], status);
        validate(zh, now, left); validate(en, now, right);
        assert.deepEqual(signature(left), signature(right));
        counts.temporalCases += 2;
      }
    }
    // Every itinerary point at every row midpoint, not only its owning activity.
    for (const row of zh.rows) for (const place of zh.places) {
      const now = Math.floor((row.start + until(row)) / 2);
      const location = fix(place.position, now);
      const left = nearbyContext(zh, now, location), right = nearbyContext(en, now, location);
      validate(zh, now, left); validate(en, now, right);
      assert.deepEqual(signature(left), signature(right));
      counts.placeCases += 2;
    }
  }

  const at = (date, time, zone = "Pacific/Auckland") => zonedLocalInstant(date, time, zone);
  for (const [date, time, part, id, confidence] of [
    ["2026-10-05", "14:45", "helicopter check-in, not flight", "waypoint:mount-cook-airport", "near-place"],
    ["2026-10-05", "21:45", "hermitage", "waypoint:hermitage-big-sky", "near-place"],
    ["2026-10-06", "20:30", "penguin", "waypoint:oamaru-blue-penguin-colony", "near-place"],
    ["2026-10-07", "16:00", "riverside", "waypoint:riverside-avon", "schedule"],
    ["2026-10-09", "11:00", "hobbiton", "waypoint:hobbiton-shires-rest", "schedule"],
    ["2026-10-01", "12:30", "unknown lunch venue", "waypoint:glenorchy-wharf", "schedule"],
    ["2026-10-05", "18:00", "unknown dinner venue", "waypoint:hermitage-big-sky", "schedule"],
    ["2026-10-06", "18:30", "dinner then travel", "waypoint:oamaru-blue-penguin-colony", "schedule"],
  ]) {
    const now = at(date, time), point = locked.places.find(place => place.id === id);
    const model = nearbyContext(locked, now, fix(point.position, now));
    assert.equal(model.current.confidence, confidence, part);
    assert(model.current.places.some(place => place.id === id));
    const conflict = nearbyContext(locked, now, fix([0, 0], now));
    assert.equal(conflict.locationEvidence.status, model.current.moving ? "unknown" : "conflict");
    assert.equal(conflict.current.id, model.current.id);
    counts.syntheticChecks += 2;
  }
  const garden = locked.places.find(place => place.id === "pin:queenstown-gardens");
  assert(nearbyPlaceTarget(garden, at("2026-09-30", "11:00"), "2026-09-30").targetId.startsWith("2026-09-30"));
  assert(nearbyPlaceTarget(garden, at("2026-10-02", "11:30"), "2026-10-02").targetId.startsWith("2026-10-02"));
  const home = nearbyContext(locked, at("2026-10-12", "04:00", "Asia/Shanghai"), null);
  assert.equal(home.current.zone, "Asia/Shanghai"); assert.equal(home.current.places.length, 0);
  assert.equal(nearbyContext(locked, at("2026-10-10", "23:59"), null).current.sourceIndex, 5);
  assert.equal(nearbyContext(locked, at("2026-10-11", "00:00"), null).current.dateId, "2026-10-10");
  assert.equal(nearbyContext(locked, at("2026-10-11", "00:30"), null).current.dateId, "2026-10-11");
  const transfer = nearbyContext(locked, at("2026-10-11", "12:00", "Asia/Kuala_Lumpur"), null);
  assert.equal(transfer.current.zone, "Asia/Kuala_Lumpur");
  assert.equal(transfer.current.type, "wait");
  assert.equal(nearbyContext(locked, locked.tripStart - 1, null).next.id, locked.rows[0].id);
  assert.equal(nearbyContext(locked, locked.tripEnd, null).phase, "after-trip");
  assert.equal(nearbyContext(locked, locked.tripEnd, null).next, null);
  counts.syntheticChecks += 11;

  const dayStart = at("2026-10-02", "00:00");
  const synthetic = { rows: [], days: [{ dateId: "2026-10-02", zone: "Pacific/Auckland", start: dayStart, end: dayStart + 86400000 }],
    places: [], untimed: [{ id: "unknown-time", dateId: "2026-10-02", start: null, end: null }] };
  const unknown = nearbyContext(synthetic, dayStart + 12 * 3600000, null);
  assert.equal(unknown.fallback.kind, "untimed"); assert.equal(unknown.current, null);
  assert.equal(unknown.next, null); assert.equal(unknown.untimed[0].start, null);
  assert.equal(nearbyContext({ ...synthetic, untimed: [] }, dayStart + 3600000, null).fallback.kind, "overnight");
  assert.equal(nearbyContext(synthetic, NaN, null).phase, "invalid-time");
  assert.equal(nearbyContext({ rows: [], days: [], places: [] }, dayStart, null).phase, "no-itinerary");
  const between = { rows: [], places: [], days: [{ dateId: "a", start: 0, end: 10 }, { dateId: "b", start: 20, end: 30 }] };
  assert.equal(nearbyContext(between, 15, null).fallback.kind, "between-days");
  // Auckland DST transition uses 23 hours, not a hard-coded 24-hour date.
  assert.equal(at("2026-09-28", "00:00") - at("2026-09-27", "00:00"), 23 * 3600000);
  counts.syntheticChecks += 9;

  for (const file of ["nearbyData.js", "nearbyModel.js", "nearbyPlaceBindings.js", "useNearbyContext.js", "nearbyLocation.js"]) {
    const source = await readFile(new URL(`../src/adventure/nearby/${file}`, import.meta.url), "utf8");
    assert(!/localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|onMap|setMap/.test(source), `Persistence/upload/map coupling in ${file}`);
  }
  await server.ssrLoadModule("/src/adventure/nearby/AdventureNearby.jsx");
  await server.ssrLoadModule("/src/adventure/nearby/useNearbyContext.js");
  const representedPositions = new Set(locked.places.map(place => JSON.stringify(place.position)));
  const report = {
    calendarRange: [locked.days[0].dateId, locked.days.at(-1).dateId],
    planRangeUTC: [new Date(locked.tripStart).toISOString(), new Date(locked.tripEnd).toISOString()],
    days: locked.days.length, events: locked.events.length, sourceItems: locked.sourceItems.length,
    representedSourceItems: locked.sourceItems.filter(item => item.status === "represented").length,
    timedRows: locked.rows.length, knownStartOnly: locked.rows.filter(row => row.pointOnly).length,
    untimed: locked.untimed.length, uniqueFlights: locked.rows.filter(row => row.flight).length,
    publicPlaces: locked.places.length, rowsWithGeographicReference: locked.rows.filter(row => row.places.length).length,
    rowsWithActivitySite: locked.rows.filter(row => row.places.some(place => place.evidenceRole === "activity-site")).length,
    sourcePools: { adventureStops: adventureStops.length, internationalAirports: internationalMapStops.length,
      waypoints: adventureWaypoints.length, mapStops: mapStops.length, comparisonPins: sourcePins.length },
    excludedMapStops: mapStops.filter(stop => !locked.places.some(place => place.tag === stop.tag)).map(stop => stop.tag),
    comparisonPinsWithoutRuntimeCoordinate: sourcePins.filter(pin => !representedPositions.has(JSON.stringify(pin.position))).map(pin => pin.label),
    dayInventory: locked.days.map(day => ({ date: day.dateId, events: locked.events.filter(event => event.dateId === day.dateId).length,
      sourceItems: locked.sourceItems.filter(item => item.dateId === day.dateId).length,
      rows: locked.rows.filter(row => row.dateId === day.dateId).length })),
    unknownRowGeography: locked.rows.filter(row => !row.places.length).map(row => ({ id: row.id, label: row.label })),
    ...counts, elapsedMs: Math.round(performance.now() - started),
    browser: false, device: false,
  };
  console.log(JSON.stringify(report, null, 2));
} finally { await server.close(); }
