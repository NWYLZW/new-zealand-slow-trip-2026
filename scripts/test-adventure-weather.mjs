import assert from "node:assert/strict";
import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";
import { createWeatherClient } from "../src/adventure/weather/weatherClient.js";
import { HOUR, weatherRequest, weatherWindow, weatherLocalParts, buildWeatherUrl, normalizeWeather } from "../src/adventure/weather/weatherData.js";
import { openWeatherView, backFromWeather } from "../src/adventure/weather/weatherNavigation.js";

const fixtureNow = Date.parse("2026-10-01T03:00:00Z");
const location = { id: "ZQN", latitude: -45.0312, longitude: 168.6626, timeZone: "Pacific/Auckland" };
const request = weatherRequest("2026-10-01", location, fixtureNow);
const sourceUrl = buildWeatherUrl([request]);
const payloadFor = (...requests) => {
  const start = Math.min(...requests.map(item => item.start));
  const end = Math.max(...requests.map(item => item.end));
  const time = Array.from({ length: (end - start) / HOUR }, (_, index) => (start + index * HOUR) / 1000);
  return { hourly_units: { time: "unixtime", temperature_2m: "°C", precipitation: "mm", weather_code: "wmo code", wind_speed_10m: "km/h" },
    hourly: { time, temperature_2m: time.map((_, index) => index / 2), precipitation: time.map(() => 0),
      weather_code: time.map(() => 3), wind_speed_10m: time.map(() => 4) } };
};
const pause = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));
const memory = new Map();
const storage = () => ({ getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) });
const report = { checkedAt: new Date().toISOString(), fixtureNow: new Date(fixtureNow).toISOString(),
  browserRun: false, data: false, lifecycle: false, navigation: false, locations: [], live: [] };

assert.equal(request.product, "forecast");
assert.equal(weatherRequest("2026-09-29", location, fixtureNow).product, "archived-forecast");
assert.equal(weatherRequest("2026-09-25", location, fixtureNow).product, "reanalysis");
assert.equal(weatherRequest("2026-10-16", location, fixtureNow).unavailable, null);
assert.equal(weatherRequest("2026-10-17", location, fixtureNow).unavailable, "horizon");
assert.equal(weatherRequest("2026-10-16", location, Date.parse("2026-09-30T12:00:00Z")).unavailable, "horizon");
assert.equal(weatherRequest("2026-10-01", null, fixtureNow).unavailable, "location");
for (const [date, count] of [["2026-09-27", 23], ["2026-04-05", 25], ["2026-10-01", 24]]) {
  const window = weatherWindow(date, location.timeZone);
  assert.equal((window.end - window.start) / HOUR, count);
  assert.equal(weatherLocalParts(window.start, location.timeZone).date, date);
}
assert.equal(new URL(sourceUrl).searchParams.get("timezone"), "GMT");
assert.equal(new URL(sourceUrl).searchParams.get("start_hour"), "2026-09-30T11:00");
const normalized = normalizeWeather(payloadFor(request), request, fixtureNow, sourceUrl);
assert.equal(normalized.hours.length, 24);
assert.equal(normalized.hours[0].clock, "00:00");
assert.equal(normalized.hours.at(-1).clock, "23:00");
assert.equal(normalized.hours[0].precipitation, 0);
assert.equal(normalized.daily.max, 11.5);
const partial = payloadFor(request);
partial.hourly.temperature_2m[0] = null;
partial.hourly.precipitation[1] = "";
partial.hourly.weather_code[2] = 999;
delete partial.hourly.wind_speed_10m;
const missing = normalizeWeather(partial, request, fixtureNow, sourceUrl);
assert.equal(missing.daily.min, null);
assert.equal(missing.daily.code, null);
assert.equal(missing.hours[1].precipitation, null);
assert.equal(missing.hours[2].code, null);
assert.equal(missing.hours[0].wind, null);
assert(missing.partial);
assert.throws(() => normalizeWeather({}, request, fixtureNow, sourceUrl), /invalid-response/);
report.data = true;

let clock = fixtureNow, isOnline = true;
const doc = new EventTarget(); doc.visibilityState = "visible";
const win = new EventTarget(), calls = [];
const client = createWeatherClient({ now: () => clock, storage, document: doc, window: win, online: () => isOnline,
  fetcher: (url, options) => new Promise((resolve, reject) => {
    calls.push({ url, options, resolve, reject });
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }) });
try {
  const previous = weatherRequest("2026-09-30", location, fixtureNow);
  const offA = client.subscribe(request, () => {}), offB = client.subscribe(request, () => {});
  const offC = client.subscribe(previous, () => {});
  await pause();
  assert.equal(calls.length, 1, "same location and date-range coalesce across consumers");
  offA(); assert.equal(calls[0].options.signal.aborted, false, "shared request remains for another consumer");
  calls[0].resolve({ ok: true, json: async () => payloadFor(previous, request) });
  await pause();
  assert.equal(client.snapshot(request).status, "ready");
  assert.equal(client.snapshot(previous).data.product, "archived-forecast");
  assert.equal(calls[0].options.credentials, "omit");
  assert(memory.size > 0);
  clock += 31 * 60000;
  isOnline = false; win.dispatchEvent(new Event("offline"));
  await pause();
  assert.equal(calls.length, 1);
  assert.equal(client.snapshot(request).stale, true);
  assert.equal(client.snapshot(request).offline, true);
  isOnline = true; win.dispatchEvent(new Event("online"));
  await pause();
  assert.equal(calls.length, 2);
  calls[1].resolve({ ok: true, json: async () => payloadFor(previous, request) });
  await pause();
  assert.equal(client.snapshot(request).stale, false);
  clock += 31 * 60000; client.refresh();
  await pause();
  calls[2].resolve({ ok: false, status: 429, headers: new Headers({ "retry-after": "120" }) });
  await pause();
  assert.equal(client.snapshot(request).error, "rate-limit");
  client.retry(request); await pause();
  assert.equal(calls.length, 3, "rate-limit Retry-After blocks manual retry");
  clock += 121000; client.refresh(); await pause();
  assert.equal(calls.length, 4);
  doc.visibilityState = "hidden"; doc.dispatchEvent(new Event("visibilitychange"));
  await pause();
  assert(calls[3].options.signal.aborted);
  doc.visibilityState = "visible"; doc.dispatchEvent(new Event("visibilitychange"));
  await pause();
  assert.equal(calls.length, 5);
  offB(); offC(); await pause();
  assert(calls[4].options.signal.aborted, "last subscriber cancels the request");
} finally { client.dispose(); }

const cacheClient = createWeatherClient({ now: () => clock, storage, fetcher: () => { throw new Error("must not fetch"); } });
assert(cacheClient.snapshot(request).data);
cacheClient.dispose();
let concurrency = 0, maximum = 0;
const pending = [];
const capped = createWeatherClient({ now: () => fixtureNow, storage: () => null,
  fetcher: (url, { signal }) => new Promise((resolve, reject) => {
    concurrency++; maximum = Math.max(maximum, concurrency);
    pending.push(() => { concurrency--; resolve({ ok: true, json: async () => payloadFor(request) }); });
    signal.addEventListener("abort", () => { concurrency--; reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  }) });
try {
  for (const id of ["one", "two", "three"]) capped.subscribe(weatherRequest(request.date, { ...location, id }, fixtureNow), () => {});
  await pause(); assert.equal(pending.length, 2);
  pending[0](); await pause(); assert.equal(pending.length, 3);
  assert.equal(maximum, 2);
} finally { capped.dispose(); }
await pause();
report.lifecycle = true;

const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { weatherLocationForDay } = await server.ssrLoadModule("/src/adventure/weather/weatherLocations.js");
  const { getAdventureCalendarDays } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const { readLocation, writeLocation, useAdventureNavigation } = await server.ssrLoadModule("/src/adventure/useAdventureNavigation.js");
  for (const day of getAdventureCalendarDays()) {
    const place = weatherLocationForDay(day.dateId);
    assert(place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
    assert(!/hotel|stay|vault/i.test(place.coordinateSource));
    report.locations.push([day.dateId, place.id]);
  }
  assert.equal(weatherLocationForDay("2026-10-09").id, "HBT");
  assert.equal(weatherLocationForDay("2026-10-11").id, "KUL");
  assert.equal(weatherLocationForDay("2026-10-12").timeZone, "Asia/Shanghai");
  assert.equal(weatherLocationForDay("2026-10-01", "ZQN").id, "ZQN");
  assert.equal(weatherLocationForDay("2026-10-01", "not-a-place").id, "GLN");
  globalThis.window = { location: new URL("http://127.0.0.1:4174/new-zealand-slow-trip-2026/?panel=tasks&date=2026-10-05&place=ZQN&placeDate=2026-09-30&map=nz&zoom=10&lat=-45&lng=168") };
  globalThis.history = { pushState: (_, __, url) => { window.location = new URL(url); }, replaceState: (_, __, url) => { window.location = new URL(url); } };
  globalThis.document = { getElementById: () => null };
  const parent = readLocation();
  for (const fromPlace of [false, true]) {
    const weather = openWeatherView(parent, "2026-10-01", fromPlace ? "ZQN" : null);
    writeLocation(weather);
    const restored = readLocation();
    assert.equal(restored.rightPanel, "weather");
    assert.equal(restored.weatherDate, "2026-10-01");
    assert.equal(restored.weatherPlace, fromPlace ? "ZQN" : null);
    assert.equal(restored.weatherParent, "place");
    for (const key of ["date", "placeDate", "place", "scope", "mapMode"]) assert.equal(restored[key], parent[key]);
    assert.deepEqual(restored.mapView, parent.mapView);
    const back = backFromWeather(restored);
    writeLocation(back);
    assert.equal(readLocation().rightPanel, "place");
    assert.equal(window.location.searchParams.has("weather"), false);
  }
  const eventId = getAdventureCalendarDays()[1].events[1].urlId;
  for (const query of [
    "panel=tasks&date=2026-10-05&day=2026-10-01&map=nz",
    "panel=tasks&date=2026-10-05&place=ZQN&placeDate=2026-09-30&day=2026-10-01&dayFrom=place&map=nz",
    `panel=tasks&date=2026-10-05&event=${encodeURIComponent(eventId)}&eventFrom=day&day=2026-09-29&map=nz`,
    "panel=tasks&date=2026-10-05&route=zqn-glenorchy&map=nz",
    "panel=tasks&date=2026-10-05&right=bag&bagTab=notes&map=nz",
  ]) {
    window.location = new URL(`http://127.0.0.1:4174/new-zealand-slow-trip-2026/?${query}&zoom=10&lat=-45&lng=168`);
    const before = readLocation();
    assert(before.rightPanel, `Expected a parent panel for ${query}`);
    writeLocation(openWeatherView(before, "2026-10-02"));
    const restored = readLocation();
    assert.equal(restored.weatherParent, before.rightPanel);
    for (const key of ["day", "dayFrom", "date", "placeDate", "place", "route", "eventId", "eventFrom", "bagTab", "mapMode"]) {
      assert.equal(restored[key], before[key], `parent ${before.rightPanel}: ${key}`);
    }
    assert.deepEqual(restored.mapView, before.mapView);
    writeLocation(backFromWeather(restored));
    assert.equal(readLocation().rightPanel, before.rightPanel);
  }
  window.location = new URL("http://127.0.0.1:4174/new-zealand-slow-trip-2026/?panel=tasks&date=2026-10-05&fullscreen=calendar&map=nz");
  let navigate;
  renderToString(React.createElement(function Harness() {
    [, navigate] = useAdventureNavigation();
    return null;
  }));
  navigate("weather", "2026-10-01", "calendar");
  assert.equal(readLocation().rightPanel, "weather");
  assert.equal(readLocation().fullscreen, "right");
  assert.equal(readLocation().date, "2026-10-05");
  const weatherOverview = readLocation();
  navigate("weather-sources");
  const sources = readLocation();
  assert.equal(sources.weatherView, "sources");
  assert.equal(sources.weatherDate, weatherOverview.weatherDate);
  assert.equal(sources.fullscreen, "right");
  assert.deepEqual(sources.mapView, weatherOverview.mapView);
  assert.deepEqual(backFromWeather(sources), { ...weatherOverview, weatherView: null });
  navigate("back-weather");
  assert.equal(readLocation().weatherView, null);
  assert.equal(readLocation().rightPanel, "weather");
  assert.equal(window.location.searchParams.has("weatherView"), false);
  navigate("back-weather");
  assert.equal(readLocation().fullscreen, "calendar");
  assert.equal(readLocation().rightPanel, null);
  navigate("weather", "2026-10-01", "calendar");
  navigate("close-right");
  assert.equal(readLocation().calendarOpen, true);
  assert.equal(window.location.searchParams.has("weather"), false);
  report.navigation = true;
  if (process.argv.includes("--live")) {
    for (const date of ["2026-10-01", "2026-09-29", "2026-09-25"]) {
      const query = weatherRequest(date, location, fixtureNow), url = buildWeatherUrl([query]);
      const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { Origin: "http://127.0.0.1:4174" } });
      assert(response.ok, `${response.status} ${url}`);
      assert.equal(response.headers.get("access-control-allow-origin"), "*");
      const data = normalizeWeather(await response.json(), query, Date.now(), url);
      assert(data.available);
      report.live.push({ date, product: query.product, http: response.status, cors: "*", hours: data.hours.length,
        first: data.hours[0].clock, last: data.hours.at(-1).clock, partial: data.partial, sourceUrl: url });
    }
  }
} finally {
  await server.close();
  delete globalThis.window; delete globalThis.history; delete globalThis.document;
}
console.log(JSON.stringify(report, null, 2));
