import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { routeTravelSegments, routeDurationEstimate, flightDurationEstimate, eventTravelDurations } =
    await server.ssrLoadModule("/src/adventure/adventureRouteDuration.js");
  const { adventureRoutes } = await server.ssrLoadModule("/src/adventure/adventureRoutes.js");
  const { getAdventureCalendarDays } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const events = getAdventureCalendarDays().flatMap(day => day.events);
  const expected = {
    "szx-kul": 240, "kul-akl": 590, "akl-zqn": 115,
    "zqn-glenorchy": 81, "zqn-walter-peak": 90, "zqn-wanaka": 86,
    "wka-puzzling-world": 8, "wka-hawea": 33, "wka-wanaka-tree": 8,
    "wanaka-aoraki": 160, "aoraki-oamaru": 220, "oamaru-christchurch": 210,
    "christchurch-car-return": 21, "chc-akl": 80, "akl-akc-transfer": 27,
    "akc-hobbiton-coach": 146, "hobbiton-akc-coach": 148, "akc-akl-transfer": 26,
    "akl-kul": 690, "kul-szx": 250,
  };
  assert.deepEqual(routeTravelSegments.map(route => route.id).sort(), Object.keys(expected).sort());
  for (const route of routeTravelSegments) {
    for (const language of ["zh", "en"]) {
      const estimate = routeDurationEstimate(route, language);
      assert.equal(estimate?.totalMinutes, expected[route.id], `${route.id}: ${language}`);
      assert(estimate.label && estimate.title);
      if (route.transport !== "flight") {
        assert(estimate.sources.every(source => source.source && source.sourceUrl && source.reviewedAt));
      }
    }
    const related = events.filter(event => event.segmentIds?.includes(route.id));
    assert(related.length, `${route.id} must have a reachable event`);
    for (const event of related) {
      assert.equal(eventTravelDurations(event, adventureRoutes).find(item => item.id === route.id)
        ?.duration?.totalMinutes, expected[route.id]);
    }
  }
  for (const route of adventureRoutes) {
    assert(routeDurationEstimate(route), `${route.id}: map detail coverage`);
    if (route.transport === "road") {
      const hotel = routeDurationEstimate({ ...route, hotelEndpoints: {} });
      assert.match(hotel.label, /参考约/);
      assert.match(hotel.title, /未计酒店连接/);
      assert.equal(hotel.totalMinutes, expected[route.id]);
    }
  }
  const coach = adventureRoutes.find(route => route.transport === "coach");
  assert.equal(coach.returnRouteId, "hobbiton-akc-coach");
  assert.equal(routeDurationEstimate(coach).totalMinutes, 295);
  assert.match(routeDurationEstimate(coach).label, /往返路网/);
  assert.match(routeDurationEstimate(routeTravelSegments.find(route => route.id === "wka-hawea")).label, /往返/);
  const outbound = events.find(event => event.segmentIds?.includes("kul-akl"));
  assert.deepEqual(eventTravelDurations(outbound, adventureRoutes, "zh", "kul-akl").map(item => item.id), ["kul-akl"]);
  assert.equal(eventTravelDurations(outbound, adventureRoutes, "en", "stale-id").length, 2);
  for (const seconds of [undefined, null, 0, -1, NaN, Infinity]) {
    assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: seconds } }), null);
  }
  assert.equal(routeDurationEstimate(null), null);
  assert.equal(routeDurationEstimate({ transport: "flight", roadSource: { durationSeconds: 3600 } }), null);
  assert.equal(flightDurationEstimate({ date: "2026-10-11", from: "Unknown XYZ", to: "Auckland AKL",
    departure: "10:00", arrival: "11:00" }), null);
  assert.equal(flightDurationEstimate({ date: "2026-10-11", from: "Christchurch CHC", to: "Auckland AKL",
    departure: "13:00", arrival: "12:00" }), null);
  assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: 3600 } }).label, "约1小时");
  assert.equal(routeDurationEstimate({ transport: "road", roadSource: { durationSeconds: 10 } }).label, "约1分钟");
  for (const path of ["/src/adventure/AdventurePanel.jsx", "/src/adventure/AdventureEventDetails.jsx"]) {
    assert((await server.transformRequest(path))?.code, `${path}: Vite transform`);
  }
  console.log(`All ${routeTravelSegments.length} route segments and ${adventureRoutes.length} map details have durations; bilingual, flights/time zones, coach directions, hotel reference scope and Vite transforms passed.`);
} finally {
  await server.close();
}
