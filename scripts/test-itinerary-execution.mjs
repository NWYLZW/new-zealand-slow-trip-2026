import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({ root, configFile: false, logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }, appType: "custom" });
const clone = value => JSON.parse(JSON.stringify(value));
const isPublicUrl = value => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
};

try {
  const { southDays, northDays, activityBookingPlans } = await server.ssrLoadModule("/src/tripData.js");
  const { itineraryDaysEn } = await server.ssrLoadModule("/src/englishTripData.js");
  const { getAdventureCalendarDays } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const { withItineraryExecution } = await server.ssrLoadModule("/src/data/itineraryExecution.js");
  const days = [...southDays, ...northDays];
  const refined = days.filter(day => day.executionSources);
  assert.deepEqual(refined.map(day => day.date), Array.from({ length: 11 }, (_, i) => `10月${i + 2}日`));
  assert.deepEqual(refined.map(day => day.events.length), [6, 6, 5, 9, 10, 7, 6, 7, 6, 3, 4]);
  const earlier = days.filter(day => !day.executionSources);
  assert.equal(earlier.length, 4);
  for (const day of earlier) assert.equal(withItineraryExecution(day), day);

  for (const day of refined) {
    const en = itineraryDaysEn.find(item => item.date === day.date);
    assert.equal(en.highlight, day.highlightEn);
    assert.deepEqual(clone(en.alternative), clone(day.alternativeEn));
    assert.deepEqual(clone(en.links), clone(day.linksEn));
    assert.deepEqual(day.links.map(link => link[1]), day.linksEn.map(link => link[1]));
    assert(!/\p{Script=Han}/u.test([en.highlight, en.alternative.title, en.alternative.desc, ...en.links.map(([label]) => label)].join("")));
    const sourceIds = new Set(day.executionSources.map(source => source.id));
    assert.equal(sourceIds.size, day.executionSources.length);
    for (const source of day.executionSources) {
      assert(isPublicUrl(source.url));
      assert.equal(source.checkedAt, "2026-10-01");
      assert(["verified", "needs-recheck", "official-unreachable"].includes(source.status));
      assert(source.title && source.titleEn);
    }
    for (const [, url] of day.links) assert(isPublicUrl(url));
    day.events.forEach((entry, index) => {
      const notes = entry[2].execution;
      for (const key of ["text", "textEn", "summary", "summaryEn"]) assert(notes[key]?.trim());
      assert(!/\p{Script=Han}/u.test(notes.textEn + notes.summaryEn));
      assert(notes.sourceIds.every(id => sourceIds.has(id)));
      assert.equal(en.events[index][0], entry[0]);
      assert.deepEqual(clone(en.events[index][2]), clone(entry[2]));
    });
    const before = clone(day);
    withItineraryExecution(day);
    assert.deepEqual(clone(day), before, "Enrichment must not mutate existing data");
    assert.throws(() => withItineraryExecution({ ...day, events: [] }), /no longer match/);
  }

  const zhCalendar = getAdventureCalendarDays();
  const enCalendar = getAdventureCalendarDays({ language: "en" });
  const identity = calendar => clone(calendar.map(({ dateId, events }) => ({ dateId,
    events: events.map(({ urlId, items, stayIntegration, flights }) =>
      ({ urlId, items, stayIntegration, flights })) })));
  assert.deepEqual(identity(zhCalendar), identity(enCalendar));
  let coverage = 0;
  for (const { day, events } of zhCalendar.filter(entry => entry.day.executionSources)) {
    const indices = events.flatMap(event => event.items);
    assert.deepEqual([...indices].sort((a, b) => a - b), day.events.map((_, i) => i));
    for (const event of events) {
      event.events.forEach((entry, index) => assert.equal(entry, day.events[event.items[index]]));
      if (event.stayLink) assert(event.events[event.stayLink.eventIndex]);
    }
    coverage += indices.length;
  }
  assert.equal(coverage, 69);
  assert.match(activityBookingPlans.find(item => item.id === "walter-peak").status, /待付款/);
  assert.match(activityBookingPlans.find(item => item.id === "hobbiton").status, /待预订/);
  assert.match(refined.find(day => day.date === "10月11日").highlight, /13小时10分/);
  for (const region of ["lakes", "alpine", "return"]) {
    const json = await readFile(new URL(`../src/data/itineraryExecution/${region}.json`, import.meta.url), "utf8");
    assert(!/\/Users\/|repo:|expectedText|coordinator|主协调|latitude|longitude/.test(json));
  }
  console.log("Itinerary execution: 11 days / 69 entries, bilingual notes, sources, indices and calendar/stay contracts passed.");
} finally {
  await server.close();
}
