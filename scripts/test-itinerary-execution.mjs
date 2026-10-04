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
  assert.deepEqual(refined.map(day => day.events.length), [6, 7, 9, 13, 10, 7, 6, 7, 6, 3, 4]);
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
      assert.equal(source.checkedAt, ["lakes-puzzling-hours", "lakes-hawea-loop"].includes(source.id)
        ? "2026-10-04" : "2026-10-01");
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
  assert.equal(coverage, 78);
  const wanaka = refined.find(day => day.date === "10月4日");
  assert.deepEqual(wanaka.events.map(([, , metadata]) => [metadata.start, metadata.end]), [
    ["10:00", "12:00"], ["12:15", "13:30"], ["13:30", "14:00"], ["14:00", "16:00"],
    ["16:00", "17:00"], ["17:00", "18:00"], ["18:00", "19:00"], ["19:15", "20:15"],
    ["22:00", "00:20"],
  ]);
  assert.match(wanaka.events[0][1], /Puzzling World/);
  assert.match(wanaka.events[3][1], /Lake Hāwea/);
  assert.match(wanaka.events[7][1], /That Wanaka Tree/);
  assert(!wanaka.events.some(([, title]) => /Mount Iron/.test(title)));
  assert(itineraryDaysEn.find(day => day.date === "10月4日").events.every(([, title]) => !/\p{Script=Han}/u.test(title)));
  const wanakaCalendar = zhCalendar.find(day => day.dateId === "2026-10-04").events[0];
  assert.equal(wanakaCalendar.urlId, "2026-10-04|瓦纳卡湖边慢游");
  assert.deepEqual(wanakaCalendar.items, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.match(wanakaCalendar.calendarLabel, /Lake Hāwea/);
  assert.equal(refined.find(day => day.date === "10月5日").events[0][2].start, "08:45");

  const { weatherSegmentsForDay } = await server.ssrLoadModule("/src/adventure/weather/weatherLocations.js");
  assert.deepEqual(weatherSegmentsForDay("2026-10-04").map(segment =>
    [segment.location.id, segment.start, segment.end]), [
    ["WKA", "00:00", "13:45"], ["HWA", "13:45", "16:30"], ["WKA", "16:30", "24:00"],
  ]);
  assert.deepEqual(weatherSegmentsForDay("2026-10-04", "WKA").map(segment =>
    [segment.location.id, segment.start, segment.end]), [["WKA", "00:00", "24:00"]]);
  const { buildNearbyData } = await server.ssrLoadModule("/src/adventure/nearby/nearbyData.js");
  const nearby = buildNearbyData();
  const rows = nearby.rows.filter(row => row.dateId === "2026-10-04");
  assert.equal(rows.length, 9);
  assert.deepEqual(rows.map(row => row.places.map(place => place.id)), [
    ["pin:puzzling-world"], ["place:WKA"], ["place:WKA", "place:HWA"], ["place:HWA"],
    ["place:HWA", "place:WKA"], ["place:WKA"], ["place:WKA"], ["pin:wanaka-tree", "pin:wanaka-lakefront"],
    ["place:WKA"],
  ]);
  assert.equal(rows[0].places[0].evidenceRole, "activity-site");
  assert.equal(rows[3].places[0].evidenceRole, "area-reference");
  assert(rows[2].transit && rows[4].transit);
  assert(!rows[3].moving);
  assert(nearby.sourceItems.filter(item => item.dateId === "2026-10-04").every(item => item.status === "represented"));
  const starRecord = refined.find(day => day.date === "10月3日").events[6];
  assert.equal(starRecord[2].executionStatus, "completed");
  assert.equal(starRecord[2].start, "22:30");
  assert.equal(starRecord[2].end, "23:10");
  assert.equal(starRecord[2].isEstimated, true, "recalled time must not be presented as exact");
  const starEvent = zhCalendar.find(day => day.dateId === "2026-10-03").events
    .find(event => event.title === "瓦纳卡星空摄影");
  assert.deepEqual(starEvent.items, [6]);
  assert.deepEqual(starEvent.segmentIds, []);
  assert.equal(starEvent.urlId, "2026-10-03|瓦纳卡星空摄影");
  const record = nearby.rows.find(row => row.event.urlId === starEvent.urlId);
  assert.equal(record.executionStatus, "completed");
  assert.equal(record.start, Date.parse("2026-10-03T22:30:00+13:00"));
  assert.equal(record.end, Date.parse("2026-10-03T23:10:00+13:00"));
  assert(!record.pointOnly, "photography is an interval, not an untimed or point event");
  assert(!nearby.untimed.some(row => row.event.urlId === starEvent.urlId));
  const { adventureDayEventRows, adventureDayRowsForDate } = await server.ssrLoadModule("/src/adventure/AdventureDayDetails.jsx");
  const { scheduleDurationLabel } = await server.ssrLoadModule("/src/adventure/scheduleDuration.js");
  const driveRows = adventureDayRowsForDate("2026-10-05").filter(row =>
    row.event.urlId === "2026-10-05|自驾前往库克山");
  assert.deepEqual(driveRows.map(row => row.agendaItem.sourceIndex), [0, 1, 10, 2, 11, 3, 12, 4]);
  assert.deepEqual(driveRows.map(row => (row.interval.end - row.interval.start) / 60000),
    [90, 10, 50, 60, 75, 10, 35, 75]);
  assert.deepEqual(driveRows.map(row => row.agendaItem.iconType),
    ["car", "scenic", "car", "meal", "car", "scenic", "car", "wait"]);
  driveRows.slice(1).forEach((row, index) => assert.equal(row.interval.start, driveRows[index].interval.end));
  const lunch = driveRows[3];
  assert.equal(lunch.agendaItem.endTime, "12:15");
  assert.equal(scheduleDurationLabel(lunch.interval.start, lunch.interval.end, lunch.agendaItem), "计划1小时");
  const onward = driveRows[4];
  assert.equal(scheduleDurationLabel(onward.interval.start, onward.interval.end, onward.agendaItem), "预留1小时15分钟");
  assert.equal(scheduleDurationLabel(onward.interval.start, onward.interval.end, { ...onward.agendaItem, language: "en" }),
    "Allow 1h 15m");
  assert.equal(scheduleDurationLabel(0, 0), "");
  for (const [index, expected] of [
    [10, ["waypoint:lindis-pass-area", "waypoint:omarama-town"]],
    [11, ["waypoint:omarama-town", "waypoint:lake-pukaki-south"]],
    [12, ["waypoint:lake-pukaki-south", "waypoint:mount-cook-airport"]],
  ]) {
    const row = nearby.rows.find(row => row.dateId === "2026-10-05" && row.sourceIndex === index);
    assert(row, `Driving row ${index} must reach nearby recommendations`);
    assert.deepEqual(row.places.map(place => place.id), expected);
    assert(row.moving);
  }
  const englishDriveRows = adventureDayRowsForDate("2026-10-05", "en")
    .filter(row => row.event.urlId === "2026-10-05|自驾前往库克山");
  assert(englishDriveRows.every(row => !/\p{Script=Han}/u.test(row.label)));
  assert.deepEqual(englishDriveRows.map(row => row.agendaItem.iconType), driveRows.map(row => row.agendaItem.iconType));
  const dayRow = adventureDayEventRows(starEvent, "2026-10-03", "zh")[0];
  assert.equal(dayRow.interval.end - dayRow.interval.start, 40 * 60000);
  assert.equal(dayRow.agendaItem.executionStatus, "completed");
  assert.match(dayRow.interval.source, /已完成/);
  assert(!dayRow.untimed);
  assert.deepEqual(record.places.map(place => place.id), ["place:WKA"]);
  const { nearbyContext } = await server.ssrLoadModule("/src/adventure/nearby/nearbyModel.js");
  const context = nearbyContext(nearby, Date.parse("2026-10-03T23:30:00+13:00"), null);
  assert(!context.untimed.some(row => row.id === record.id), "completed records are not pending activities");
  assert.notEqual(nearbyContext(nearby, Date.parse("2026-10-03T22:45:00+13:00"), null).current?.id,
    record.id, "a completed interval must not be recommended again");
  const futureCompleted = { ...nearby, rows: [{ ...record, start: Date.parse("2026-10-04T09:00:00+13:00"),
    end: Date.parse("2026-10-04T09:30:00+13:00") }, ...nearby.rows] };
  assert.notEqual(nearbyContext(futureCompleted, Date.parse("2026-10-04T08:00:00+13:00"), null).next?.id,
    record.id, "completed records never become recommendations");

  const outing = wanaka.events[8][2];
  const proposal = refined.find(day => day.date === "10月5日").events[9][2];
  assert.equal(outing.date, "2026-10-04");
  assert.equal(outing.endDate, "2026-10-05");
  assert.equal(proposal.date, "2026-10-05");
  assert.equal(proposal.start, "00:20");
  assert.equal(proposal.end, undefined, "Do not invent a proposal duration or return time");
  for (const entry of [outing, proposal]) {
    assert.equal(entry.executionStatus, "completed");
    assert.equal(entry.isEstimated, true);
    assert.equal(entry.source, "user-confirmed");
    assert.equal(entry.recordedAt, "2026-10-05");
    assert.deepEqual(entry.execution.sourceIds, []);
  }
  const outingId = "2026-10-04|瓦纳卡求婚之夜";
  const proposalId = "2026-10-05|瓦纳卡星空下求婚成功";
  const proposalTime = Date.parse("2026-10-05T00:20:00+13:00");
  for (const language of ["zh", "en"]) {
    const beforeMidnight = adventureDayRowsForDate("2026-10-04", language);
    const afterMidnight = adventureDayRowsForDate("2026-10-05", language);
    const photoRow = beforeMidnight.find(row => row.event.urlId === outingId);
    const carryover = afterMidnight.filter(row => row.event.urlId === outingId);
    const proposalRows = afterMidnight.filter(row => row.event.urlId === proposalId);
    assert.equal(photoRow.interval.start, Date.parse("2026-10-04T22:00:00+13:00"));
    assert.equal(photoRow.interval.end, proposalTime);
    assert.equal(carryover.length, 1, "The completed outing continues into 5 October");
    assert.deepEqual(carryover[0].interval, photoRow.interval);
    assert.equal(proposalRows.length, 1);
    assert.equal(proposalRows[0].point, proposalTime);
    assert.equal(proposalRows[0].interval, null);
    assert(!proposalRows[0].untimed);
    assert.equal(proposalRows[0].agendaItem.executionStatus, "completed");
    assert(!beforeMidnight.some(row => row.event.urlId === proposalId));
    if (language === "en") {
      assert(!/\p{Script=Han}/u.test(photoRow.label + proposalRows[0].label));
    }
  }
  for (const id of [outingId, proposalId]) {
    const event = zhCalendar.flatMap(day => day.events).find(item => item.urlId === id);
    assert.deepEqual(event.stopTags, ["WKA"]);
    assert.deepEqual(event.segmentIds, []);
    const nearbyRecord = nearby.rows.find(row => row.event.urlId === id);
    assert.equal(nearbyRecord.executionStatus, "completed");
    assert.deepEqual(nearbyRecord.places.map(place => place.id), ["place:WKA"]);
    for (const time of [nearbyRecord.start - 60000, nearbyRecord.start, nearbyRecord.end + 60000]) {
      const recommendation = nearbyContext(nearby, time, null);
      assert.notEqual(recommendation.current?.id, nearbyRecord.id);
      assert.notEqual(recommendation.next?.id, nearbyRecord.id);
      assert(!recommendation.untimed.some(row => row.id === nearbyRecord.id));
    }
  }
  assert.match(activityBookingPlans.find(item => item.id === "walter-peak").status, /待付款/);
  assert.match(activityBookingPlans.find(item => item.id === "hobbiton").status, /待预订/);
  assert.match(refined.find(day => day.date === "10月11日").highlight, /13小时10分/);
  for (const region of ["lakes", "alpine", "return"]) {
    const json = await readFile(new URL(`../src/data/itineraryExecution/${region}.json`, import.meta.url), "utf8");
    assert(!/\/Users\/|repo:|expectedText|coordinator|主协调|latitude|longitude/.test(json));
  }
  console.log("Itinerary execution: 11 days / 78 entries; split driving/stops, durations, cross-midnight photography and proposal, bilingual notes, nearby geography, weather segments and calendar/stay contracts passed.");
} finally {
  await server.close();
}
