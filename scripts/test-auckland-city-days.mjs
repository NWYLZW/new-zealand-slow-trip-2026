import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ configFile: false, logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }, appType: "custom" });
try {
  const { getAdventureCalendarDays } = await server.ssrLoadModule("/src/components/calendar/tripCalendarData.js");
  const { adventureDayRowsForDate } = await server.ssrLoadModule("/src/adventure/AdventureDayDetails.jsx");
  const { eventAgendaItems } = await server.ssrLoadModule("/src/adventure/adventureEventAgenda.js");
  const { buildNearbyData } = await server.ssrLoadModule("/src/adventure/nearby/nearbyData.js");
  const calendar = getAdventureCalendarDays();
  const nearby = buildNearbyData();
  for (const [date, count] of [["2026-10-08", 18], ["2026-10-10", 17]]) {
    const day = calendar.find(item => item.dateId === date);
    assert.equal(day.day.events.length, count);
    assert.deepEqual(day.events.flatMap(event => event.items).sort((a, b) => a - b),
      Array.from({ length: count }, (_, i) => i));
    assert(day.events.every(event => event.media));
    const sourceIds = new Set(day.day.executionSources.map(source => source.id));
    for (const [, , meta] of day.day.events) {
      assert(meta.execution.text && meta.execution.textEn);
      assert(meta.execution.sourceIds.every(id => sourceIds.has(id)));
    }
    const en = getAdventureCalendarDays({ language: "en" }).find(item => item.dateId === date);
    assert(en.day.events.every(([, title]) => !/\p{Script=Han}/u.test(title)));
    assert.deepEqual(en.events.map(event => [event.urlId, event.items]), day.events.map(event => [event.urlId, event.items]));
    assert(nearby.sourceItems.filter(item => item.dateId === date).every(item => item.status === "represented"));
    const rows = adventureDayRowsForDate(date).filter(row => row.interval).sort((a, b) => a.interval.start - b.interval.start);
    for (let i = 1; i < rows.length; i++) assert(rows[i].interval.start >= rows[i - 1].interval.end,
      `${date}: overlapping ${rows[i - 1].label} / ${rows[i].label}`);
  }
  const city = calendar.find(item => item.dateId === "2026-10-10");
  const source = city.day.events;
  assert.equal(source[3][2].start, "20:30");
  assert.equal(source[3][2].end, "22:00");
  assert.equal(source[4][2].start, "22:00");
  assert.equal(source[5][2].start, "22:15");
  assert.deepEqual([source[15][2].start, source[15][2].end], ["19:30", "20:00"]);
  assert.deepEqual([source[16][2].start, source[16][2].end], ["20:00", "20:30"]);
  assert.equal(source[5][2].endDate, "2026-10-11");
  const expectedVisits = [[7, "Mount Eden", "10:15", "11:15"], [1, "Auckland Art Gallery", "11:45", "13:15"],
    [9, "Queen Street", "14:00", "15:00"], [10, "Viaduct Harbour", "15:00", "16:00"], [13, "Sky Tower", "17:00", "18:15"]];
  const agenda = eventAgendaItems(city.events[0]);
  for (const [index, name, start, end] of expectedVisits) {
    assert(source[index][1].includes(name));
    assert.deepEqual([source[index][2].start, source[index][2].end], [start, end]);
    assert(agenda.find(item => item.sourceIndex === index).mapLinks.length > 0);
  }
  const finalFlight = calendar.find(item => item.dateId === "2026-10-11").events[0].flights[0];
  assert.deepEqual([finalFlight.flightNumber, finalFlight.date, finalFlight.departure], ["MH0132", "2026-10-11", "01:25"]);
  const evening = calendar.find(item => item.dateId === "2026-10-08").events[2];
  const eveningAgenda = eventAgendaItems(evening);
  const hotelReturn = eveningAgenda.find(item => item.sourceIndex === 17);
  assert.match(hotelReturn.title, /步行或打车/);
  assert.notEqual(hotelReturn.activityType, "walk");
  assert(hotelReturn.mapLinks.length > 0);
  assert.equal(eveningAgenda.find(item => item.sourceIndex === 9).iconType, "boat");
  for (const index of [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
    assert(eveningAgenda.find(item => item.sourceIndex === index).mapLinks.length > 0);
  }
  const visitPlaces = { 1: "place:AAG", 7: "place:EDN", 10: "place:VDH", 13: "place:SKY" };
  for (const [index, place] of Object.entries(visitPlaces)) {
    const row = nearby.rows.find(item => item.dateId === "2026-10-10" && item.id.endsWith(`#agenda-${index}`));
    assert(row, `Missing nearby row ${index}`);
    assert(row.places.some(item => item.id === place));
  }
  const unlocked = getAdventureCalendarDays({ isPrivateUnlocked: true });
  const stay = unlocked.find(item => item.dateId === "2026-10-08").events[2];
  assert(stay.stayLink && stay.stayLink.eventIndex === 0);
  const transfer = unlocked.find(item => item.dateId === "2026-10-10").events[1];
  assert.equal(transfer.stayIntegration.routeOrigin, "check-out");
  const { confirmedAccommodationBookings } = await server.ssrLoadModule("/src/data/confirmedAccommodationBookings.js");
  const hotel = confirmedAccommodationBookings["hotel-auckland-city"];
  assert.deepEqual(hotel.mapPosition, [-36.8497607, 174.759702]);
  assert(hotel.mapQuery.includes("80 Wellesley Street West"));
  assert(transfer.stayContexts.some(stay => stay.phase === "check-out"
    && stay.position[0] === hotel.mapPosition[0] && stay.position[1] === hotel.mapPosition[1]));
  assert.equal(city.events[1].stayContexts.length, 0);
  const departureDay = calendar.find(item => item.dateId === "2026-10-08");
  const departure = departureDay.day.events;
  assert.deepEqual([departure[0][2].start, departure[0][2].end], ["09:00", "10:00"]);
  assert.deepEqual([departure[1][2].start, departure[1][2].end], ["10:00", "11:00"]);
  assert.equal(departure[1][2].activityType, "drive");
  assert.equal(departure[2][2].start, "11:00");
  const flight = departureDay.events[1].flights[0];
  assert.deepEqual([flight.flightNumber, flight.departure], ["JQ236", "13:50"]);
  const returnAgenda = eventAgendaItems(departureDay.events[0]);
  assert.equal(returnAgenda.find(item => item.sourceIndex === 1).iconType, "car");
  assert(returnAgenda.find(item => item.sourceIndex === 1).mapLinks.length > 0);
  // Synthetic vault data exercises the actual-stay binding without exposing a private address.
  const fixturePosition = [-43.53, 172.62];
  const privateVault = { accommodations: { "hotel-christchurch": {
    propertyName: "Test stay", coordinates: fixturePosition,
  } } };
  const privateDeparture = getAdventureCalendarDays({ isPrivateUnlocked: true, privateVault })
    .find(item => item.dateId === "2026-10-08").events[0];
  assert.equal(privateDeparture.stayIntegration.routeOrigin, "check-out");
  assert.deepEqual(privateDeparture.stayContexts.find(stay => stay.phase === "check-out").position, fixturePosition);
  assert.equal(departureDay.events[0].stayContexts.length, 0);
  const { activityBookingPlans, bookingItems } = await server.ssrLoadModule("/src/tripData.js");
  const hobbiton = activityBookingPlans.find(item => item.id === "hobbiton");
  assert.equal(hobbiton.bookingConfirmed, true);
  assert.match(hobbiton.status, /已付款/);
  assert.match(hobbiton.operator, /GA7657/);
  assert.match(hobbiton.total, /546\.50/);
  assert.match(hobbiton.policy, /取消不退款/);
  assert.match(bookingItems.find(([id]) => id === "hobbiton")[1], /已预订/);
  const tourDay = calendar.find(item => item.dateId === "2026-10-09");
  assert.equal(tourDay.day.events[0][2].start, "07:00");
  assert.equal(tourDay.day.events[1][2].start, "07:15");
  assert.equal(tourDay.day.events[5][2].start, "15:30");
  for (const index of [1, 2, 3, 4]) assert.equal(tourDay.day.events[index][2].isEstimated, true);
  assert.match(tourDay.day.events[3][2].summary, /自助午餐/);
  assert(!/仍待预订|remains unbooked|GS10H/.test(JSON.stringify(tourDay.day.events)));
  const tourEn = getAdventureCalendarDays({ language: "en" }).find(item => item.dateId === "2026-10-09");
  assert(tourEn.day.events.every(([, title]) => !/\p{Script=Han}/u.test(title)));
  console.log("Both days load: 35 entries; Christchurch 10:00–11:00 drive, private stay binding, 11:00 return, JQ236 preserved; mistaken Auckland timing change reversed; bilingual data and non-overlap verified.");
} finally {
  await server.close();
}
