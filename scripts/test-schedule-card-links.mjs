import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({ configFile: false, logLevel: "error",
  esbuild: { jsx: "automatic" },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }, appType: "custom" });
const originalWindow = globalThis.window;
const originalError = console.error;
globalThis.window = { matchMedia: () => ({ matches: false }) };
console.error = (...args) => {
  if (!String(args[0]).startsWith("Warning: useLayoutEffect does nothing on the server")) originalError(...args);
};

try {
  const { AdventurePreferencesProvider } = await server.ssrLoadModule("/src/adventure/AdventurePreferences.jsx");
  const { LanguageContext } = await server.ssrLoadModule("/src/LanguageContext.jsx");
  const { AdventureDayDetails } = await server.ssrLoadModule("/src/adventure/AdventureDayDetails.jsx");
  const { AdventureEventTimeline } = await server.ssrLoadModule("/src/adventure/AdventureEventTimeline.jsx");
  const { getTripCalendarDay } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const { eventAgendaItems } = await server.ssrLoadModule("/src/adventure/adventureEventAgenda.js");
  const { getInlineEventParts } = await server.ssrLoadModule("/src/eventLinks.js");
  const { AdventureScheduleTimeline } = await server.ssrLoadModule("/src/adventure/AdventureScheduleTimeline.jsx");
  const render = (element, language) => renderToStaticMarkup(createElement(AdventurePreferencesProvider, null,
    createElement(LanguageContext.Provider, { value: { language } }, element)));
  const assertCards = markup => {
    assert.match(markup, /trip-pencil-surface--badge trip-schedule-callout/);
    assert.match(markup, /trip-schedule-callout-hit/);
    assert.doesNotMatch(markup, /trip-schedule-callout-time/);
    assert.doesNotMatch(markup, /trip-schedule-timeline-point-leaders|trip-schedule-timeline-slot/,
      "Readable events must not retain a second duration strip or leader lines");
    for (const button of markup.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g))
      assert.doesNotMatch(button[0], /<a\b/, "Map anchors must not be nested in selection buttons");
  };
  for (const language of ["zh", "en"]) {
    const entry = getTripCalendarDay("2026-10-05", { language });
    const event = entry.events.find(item => item.items?.includes(10));
    assert(event);
    const items = eventAgendaItems(event, { language });
    const drive = items.find(item => item.sourceIndex === 10);
    assert.equal(drive.mapLinks.length, 2, "Both Lindis and Omarama locations remain available");
    for (const element of [
      createElement(AdventureDayDetails, { dateId: entry.dateId, onSelectEvent: () => {} }),
      createElement(AdventureEventTimeline, { event, dateId: entry.dateId, language, onSelectAgenda: () => {} }),
    ]) {
      const markup = render(element, language);
      assertCards(markup);
      for (const item of items) {
        const canonical = event.events[event.items.indexOf(item.sourceIndex)][1];
        for (const link of getInlineEventParts(canonical).filter(part => part.kind === "place"))
          assert(markup.includes(`href="${link.url.replaceAll("&", "&amp;")}"`), `Missing location: ${link.label}`);
      }
    }
  }
  const markup = render(createElement(AdventureScheduleTimeline, {
    readableLabels: true, range: { start: 0, end: 3600000 },
    formatTick: () => "AXIS", intervals: [{
      id: "drive", start: 0, end: 3600000, label: "Drive", timeLabel: "DUPLICATE_RANGE",
      durationLabel: "DURATION", onSelect: () => {}, mapsUrl: "https://example.com/place",
    }],
  }), "en");
  assertCards(markup);
  assert.doesNotMatch(markup, /DUPLICATE_RANGE/);
  assert.match(markup, /DURATION/);
  assert.match(markup, /href="https:\/\/example.com\/place"/);
  const { createScheduleCardScale } = await server.ssrLoadModule("/src/adventure/scheduleCardScale.js");
  const start = Date.parse("2026-10-05T00:00:00+13:00");
  const minute = 60000;
  const point = { time: start + 20 * minute };
  const gap = { start: point.time, end: start + 525 * minute };
  const intervals = [
    { start: start - 120 * minute, end: point.time },
    { start: gap.end, end: start + 615 * minute },
    { start: start + 615 * minute, end: start + 625 * minute },
  ];
  for (const expanded of [false, true]) {
    const axis = createScheduleCardScale(start, start + 1440 * minute, intervals, [point],
      expanded ? [] : [gap], expanded ? [gap] : []);
    const position = (time, edge) => axis.position(time, edge) * axis.minHeight;
    assert.equal(position(point.time), position(intervals[0].end));
    assert(position(point.time, "after") - position(point.time) >= 56);
    assert(position(gap.end) - position(gap.start, "after") >= 56);
    for (const interval of intervals) {
      const top = position(Math.max(start, interval.start), "after");
      const bottom = position(interval.end);
      assert(bottom - top >= 56 - 1e-8, "Short visits keep a full clickable card");
    }
    assert.equal(position(intervals[1].end), position(intervals[2].start, "after"),
      "Adjacent cards meet at the same clock boundary");
    assert.equal(axis.position(start + 1440 * minute), 1);
  }
  console.log("Schedule cards: day/event map links, both driving endpoints, Chinese/English, original badge surface, separate controls and no repeated time range passed (SSR only).");
} finally {
  console.error = originalError;
  globalThis.window = originalWindow;
  await server.close();
}
