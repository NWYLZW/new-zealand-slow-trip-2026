import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { HOUR, weatherLocalParts, weatherWindow, weatherRequest, weatherRequestIdentity } from "../src/adventure/weather/weatherData.js";
import { joinWeatherSegments, splitWeatherTransit, weatherSegmentData } from "../src/adventure/weather/weatherSegments.js";
import { weatherChartColumns, weatherChartGeometry, weatherChartLocationBands } from "../src/adventure/weather/weatherChart.js";
import { openWeatherView, backFromWeather, readWeatherView, writeWeatherParams } from "../src/adventure/weather/weatherNavigation.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({ root, configFile: false, server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] } });
let segments;
try {
  const { weatherSegmentsForDay } = await server.ssrLoadModule("/src/adventure/weather/weatherLocations.js");
  const { getTripCalendarDay } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const day = getTripCalendarDay("2026-10-03").day;
  assert.equal(day.events[day.weatherSegments[0].untilEvent][2].start, "10:00");
  assert.equal(day.events[day.weatherSegments[1].fromEvent][2].start, "16:00");
  segments = weatherSegmentsForDay("2026-10-03");
  assert.deepEqual(segments.map(segment => [segment.location.id, segment.start, segment.end]),
    [["ZQN", "00:00", "13:00"], ["WKA", "13:00", "24:00"]]);
  for (const segment of segments) assert.deepEqual(segment.transit, { start: "10:00", end: "16:00", split: "13:00" });
  assert.equal(weatherSegmentsForDay("2026-10-04").length, 1);
  assert.equal(weatherSegmentsForDay("2026-10-03", "ZQN")[0].location.context, "place",
    "An explicit place calendar retains its existing place-specific weather context");
  assert.equal(weatherSegmentsForDay("2026-10-03", "ZQN").length, 1);
  assert.deepEqual(weatherSegmentsForDay("1900-01-01"), []);
  for (const [path, name] of [["AdventureWeather.jsx", "AdventureWeather"], ["WeatherHourlyChart.jsx", "WeatherHourlyChart"],
    ["WeatherBadge.jsx", "WeatherBadge"], ["WeatherSources.jsx", "WeatherSources"], ["useWeather.js", "useSegmentWeather"]]) {
    assert.equal(typeof (await server.ssrLoadModule(`/src/adventure/weather/${path}`))[name], "function");
  }
} finally { await server.close(); }

const original = segments.map((segment, index) => Object.freeze({ ...segment,
  start: index ? "16:00" : "00:00", end: index ? "24:00" : "10:00", transit: undefined }));
assert.deepEqual(splitWeatherTransit(original).map(segment => [segment.start, segment.end]),
  [["00:00", "13:00"], ["13:00", "24:00"]]);
assert.equal(original[0].end, "10:00");
assert.deepEqual(splitWeatherTransit(segments), segments, "The midpoint allocation is idempotent");
const differentZones = original.map((segment, index) => ({ ...segment,
  location: { ...segment.location, timeZone: index ? "Asia/Shanghai" : "Pacific/Auckland" } }));
assert.deepEqual(splitWeatherTransit(differentZones).map(segment => [segment.start, segment.end]),
  [["00:00", "10:00"], ["16:00", "24:00"]], "Do not average clock times across time zones");

const fixture = (date, location, offset) => {
  const window = weatherWindow(date, location.timeZone);
  const hours = Array.from({ length: (window.end - window.start) / HOUR }, (_, index) => {
    const instant = window.start + index * HOUR;
    return { instant, clock: weatherLocalParts(instant, location.timeZone).clock,
      temperature: offset + index, precipitation: 0, wind: 4 + offset, code: 3 };
  });
  return { date, locationId: location.id, hours, daily: {}, partial: false };
};
const date = "2026-10-03";
const data = segments.map((segment, index) => fixture(date, segment.location, index * 10 - 6));
const hours = joinWeatherSegments(date, segments, data);
assert.equal(hours.length, 24);
assert.equal(new Set(hours.map(hour => hour.instant)).size, 24);
assert(hours.every((hour, index) => hour.clock === `${String(index).padStart(2, "0")}:00`));
assert.deepEqual(hours.map(hour => hour.location.id), [...Array(13).fill("ZQN"), ...Array(11).fill("WKA")]);
for (const index of [0, 9, 10, 12, 13, 15, 16, 23]) {
  assert.equal(hours[index].temperature, data[index < 13 ? 0 : 1].hours[index].temperature);
}
assert.equal(hours[12].period, "00:00–13:00");
assert.equal(hours[13].period, "13:00–24:00");
const fullGeometry = weatherChartGeometry(hours, 24 * 64);
assert.equal(fullGeometry.paths.length, 1, "The two endpoint series connect through 12:00 to 13:00");
const folded = weatherChartColumns(hours);
assert.equal(folded.length, 16);
assert.equal(folded[0].temperature, -2);
assert.equal(folded[0].temperatureSamples, 9);
assert.equal(folded[0].location.id, "ZQN");
assert.deepEqual(weatherChartLocationBands(folded).map(band => [band.location.id, band.start, band.end, band.period]),
  [["ZQN", 0, 5, "00:00–13:00"], ["WKA", 5, 16, "13:00–24:00"]]);
assert.deepEqual(weatherChartLocationBands(hours).map(band => [band.location.id, band.start, band.end]),
  [["ZQN", 0, 13], ["WKA", 13, 24]]);
const foldedGeometry = weatherChartGeometry(folded, 16 * 64, hours);
assert.equal(foldedGeometry.paths.length, 1);
assert.equal(foldedGeometry.height, fullGeometry.height);
for (let index = 1; index < folded.length; index++) assert.equal(foldedGeometry.points[index].y, fullGeometry.points[index + 8].y);

for (const missingIndex of [0, 1]) {
  const missing = joinWeatherSegments(date, segments, data.map((value, index) => index === missingIndex ? null : value));
  assert.equal(missing.length, 24, "Unavailable locations keep their assigned hours");
  assert(missing.filter(hour => hour.location.id === segments[missingIndex].location.id).every(hour =>
    [hour.temperature, hour.precipitation, hour.wind, hour.code].every(value => value === null)));
  assert.equal(weatherChartLocationBands(weatherChartColumns(missing)).length, 2);
  assert.equal(weatherChartGeometry(weatherChartColumns(missing), 16 * 64, missing).paths.length, 1);
}
const noData = joinWeatherSegments(date, segments, []);
assert.equal(noData.length, 24);
assert.equal(weatherChartGeometry(weatherChartColumns(noData), 16 * 64, noData).paths.length, 0);
assert.equal(weatherChartColumns(noData)[0].temperature, null);
const truncated = { ...data[1], hours: data[1].hours.filter(hour => hour.clock !== "15:00") };
const withGap = joinWeatherSegments(date, segments, [data[0], truncated]);
assert.equal(withGap[15].temperature, null);
assert.equal(withGap[15].location.id, "WKA");
assert.equal(weatherChartGeometry(withGap, 24 * 64).paths.length, 2);
const summary = weatherSegmentData(truncated, segments[1]);
assert.equal(summary.hours.length, 11);
assert.equal(summary.partial, true);
assert.deepEqual(summary.daily, { min: null, max: null, code: null });
assert.deepEqual(weatherSegmentData(data[0], segments[0]).daily, { min: -6, max: 6, code: 3 });
const boundaryGap = { ...data[1], hours: data[1].hours.filter(hour => hour.clock !== "13:00") };
assert.equal(weatherChartGeometry(joinWeatherSegments(date, segments, [data[0], boundaryGap]), 24 * 64).paths.length, 2,
  "Missing data at the location boundary must not be interpolated");

for (const [dstDate, count, earlyCount] of [["2026-09-27", 23, 8], ["2026-04-05", 25, 10]]) {
  const joined = joinWeatherSegments(dstDate, segments, segments.map((segment, index) => fixture(dstDate, segment.location, index)));
  assert.equal(joined.length, count);
  assert.equal(new Set(joined.map(hour => hour.instant)).size, count);
  const columns = weatherChartColumns(joined);
  assert.equal(columns.length, 16);
  assert.equal(columns[0].hourCount, earlyCount);
  assert.equal(weatherChartLocationBands(columns)[1].start, 5);
}

const now = Date.parse("2026-10-01T03:00:00Z");
const request = weatherRequest(date, segments[0].location, now);
assert.equal(weatherRequestIdentity(request), weatherRequestIdentity(weatherRequest(date, { ...segments[0].location }, now + 60000)),
  "A clock tick or new equivalent location object does not change subscription identity");
assert.notEqual(weatherRequestIdentity(request), weatherRequestIdentity(weatherRequest(date, segments[1].location, now)));
assert.notEqual(weatherRequestIdentity(request), weatherRequestIdentity({ ...request, unavailable: "horizon" }));
assert.notEqual(weatherRequestIdentity(request), weatherRequestIdentity(weatherRequest(date, segments[0].location, Date.parse("2026-10-10T03:00:00Z"))));

const parent = { rightPanel: "place", place: "ZQN", placeDate: "2026-10-01", date: "2026-10-05",
  calendarOpen: true, front: "tasks", fullscreen: "calendar", mapView: { zoom: 10, lat: -45, lng: 168 } };
const overview = openWeatherView(parent, date);
const sources = { ...overview, weatherView: "sources" };
assert.deepEqual(backFromWeather(sources), { ...overview, weatherView: null, front: "right" });
const params = new URLSearchParams();
writeWeatherParams(params, sources);
params.set("fullscreen", "right");
const restored = readWeatherView(parent, params, value => value === date ? date : null, () => false);
assert.equal(restored.weatherView, "sources");
assert.equal(restored.weatherDate, date);
assert.equal(restored.placeDate, parent.placeDate);
assert.deepEqual(restored.mapView, parent.mapView);
const back = backFromWeather(backFromWeather(restored));
assert.equal(back.rightPanel, parent.rightPanel);
assert.equal(back.fullscreen, parent.fullscreen);
assert.equal(back.date, parent.date);

console.log(JSON.stringify({ browserRun: false, liveWeatherRequested: false, previewRestarted: false,
  checks: ["real Oct 3 metadata and midpoint", "24 unique assigned hours", "one continuous curve and two location bands",
    "early mean and stable axis", "missing endpoint/hour/boundary gaps", "23/25-hour local days",
    "request semantic identity", "source URL/state roundtrip", "five weather module exports linked in memory"],
  segments: segments.map(({ location, start, end }) => ({ location: location.id, start, end })) }, null, 2));
