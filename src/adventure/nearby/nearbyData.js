import { getAdventureCalendarDays } from "../../components/calendar/tripCalendarData";
import { adventureDayEventRows } from "../AdventureDayDetails.jsx";
import { zonedLocalInstant } from "../adventureEventTime.js";
import { adventureStops } from "../adventureData";
import { adventureWaypoints } from "../adventureWaypoints";
import { internationalMapStops } from "../internationalMapData";
import { adventureField } from "../adventureLabels";
import { agendaIconType } from "../adventureAgendaIcons.js";
import { mapStops } from "../../tripData";
import { validPosition } from "./nearbyModel.js";
import { nearbyMovement, nearbyPlaceBindings, nearbyPlaceEvidence, nearbyPublicPins } from "./nearbyPlaceBindings.js";

const nextDate = date => new Date(Date.parse(`${date}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
const airportCode = endpoint => endpoint?.match(/\b([A-Z]{3})$/)?.[1];
const airportZone = endpoint => internationalMapStops.find(stop => stop.tag === airportCode(endpoint))?.timeZone
  ?? (["ZQN", "CHC"].includes(airportCode(endpoint)) ? "Pacific/Auckland" : null);

export function buildNearbyData({ language = "zh", isUnlocked = false, data = null } = {}) {
  const options = { isPrivateUnlocked: isUnlocked, privateVault: isUnlocked ? data : null };
  const canonical = getAdventureCalendarDays(options);
  const localizedEvents = new Map((language === "en" ? getAdventureCalendarDays({ ...options, language }) : canonical)
    .flatMap(entry => entry.events.map(event => [event.urlId, event])));
  const places = [
    ...adventureStops.map(stop => ({ ...stop, name: adventureField(stop, "name", language), id: `place:${stop.tag}`,
      specificity: "town", target: "place", targetId: stop.tag })),
    ...internationalMapStops.map(stop => ({ ...stop, id: `airport:${stop.tag}`, specificity: "area",
      target: "international-node", targetId: stop.key })),
    ...adventureWaypoints.map(point => ({ ...point, id: `waypoint:${point.id}`, target: "waypoint", targetId: point.id })),
    ...nearbyPublicPins.map(pin => ({ ...pin, target: "event", targetId: null })),
  ].filter(place => validPosition(place.position));
  const byId = new Map(places.map(place => [place.id, place]));
  const addPlace = place => {
    if (!byId.has(place.id)) { places.push(place); byId.set(place.id, place); }
    return byId.get(place.id);
  };
  // Populate every event tag before resolving cross-event bindings.
  for (const entry of canonical) for (const event of entry.events) for (const tag of event.stopTags ?? []) {
    const stop = event.stopOverrides?.[tag] ?? mapStops.find(item => item.tag === tag);
    if (!stop || !validPosition(stop.position) || byId.has(`place:${tag}`) || byId.has(`airport:${tag}`)) continue;
    addPlace({ ...stop, id: `place:${tag}`, tag, specificity: "area", target: "event", targetId: event.urlId });
  }
  const days = [], rows = [], untimed = [], events = [], sourceItems = [];
  const flightRows = new Map();
  for (const entry of canonical) {
    const { dateId } = entry;
    const zone = entry.day.primaryTimeZone ?? entry.day.timeZone ?? "Pacific/Auckland";
    days.push({ dateId, zone, start: zonedLocalInstant(dateId, "00:00", zone),
      end: zonedLocalInstant(nextDate(dateId), "00:00", zone) });
    const dayRouteIds = new Set(entry.events.flatMap(event => event.segmentIds ?? []));
    for (const sourceEvent of entry.events) {
      const event = localizedEvents.get(sourceEvent.urlId) ?? sourceEvent;
      events.push({ id: event.urlId, dateId, sourceIndexes: sourceEvent.items ?? [], event });
      const eventPlaces = (sourceEvent.stopTags ?? []).map(tag => byId.get(`place:${tag}`) ?? byId.get(`airport:${tag}`)).filter(Boolean);
      const stays = (event.stayContexts ?? []).filter(stay => validPosition(stay.position)).map(stay => addPlace({
        id: `stay:${stay.booking.bookingId}:${dateId}:${stay.phase}`, name: stay.name, nameEn: stay.name,
        position: stay.position, specificity: "place", dates: [dateId], target: "stay",
        targetId: stay.booking.bookingId, event, phase: stay.phase, dateId,
      }));
      const localizedRows = language === "en" ? new Map(adventureDayEventRows(event, dateId, language, zone)
        .map(row => [row.key, row])) : null;
      for (const row of adventureDayEventRows(sourceEvent, dateId, "zh", zone)) {
        const sourceIndex = row.agendaItem?.sourceIndex;
        const sourceEntry = sourceEvent.events?.[sourceEvent.items?.indexOf(sourceIndex)];
        const canonicalTitle = sourceEntry?.[1] ?? row.label;
        const flightIndex = row.key.match(/-flight-(\d+)$/)?.[1];
        const transferIndex = row.key.match(/-transfer-(\d+)$/)?.[1];
        const flight = flightIndex !== undefined ? sourceEvent.flights?.[Number(flightIndex)] : null;
        const transfer = transferIndex !== undefined ? sourceEvent.flights?.[Number(transferIndex) - 1] : null;
        const localized = localizedRows?.get(row.key);
        const movement = nearbyMovement(canonicalTitle, Boolean(flight), sourceEntry?.[2]?.summary);
        const binding = nearbyPlaceBindings[dateId]?.[sourceIndex];
        let rowPlaces = binding ? binding.map(id => byId.get(id)).filter(Boolean)
          : places.filter(place => place.target === "waypoint" && dayRouteIds.has(place.routeId)
            && place.eventIndexes?.includes(sourceIndex));
        if (!binding && !rowPlaces.length && eventPlaces.length === 1) rowPlaces = eventPlaces;
        if (flight || transfer) {
          const endpoints = transfer ? [transfer.to] : [flight.from, flight.to];
          rowPlaces = endpoints.map(endpoint => {
            const tag = airportCode(endpoint);
            return byId.get(`airport:${tag}`) ?? byId.get(`waypoint:${tag === "ZQN" ? "queenstown" : "christchurch"}-airport`);
          }).filter(Boolean);
        }
        // Old group stay links can point at a driving/meal row. Only attach
        // private geography to an explicitly stationary check-in/out item.
        if (!movement.moving && /办理住宿入住|安顿|办理入住|停车并入住|退房后寄存/.test(canonicalTitle)) {
          const phase = /退房/.test(canonicalTitle) ? "check-out" : "check-in";
          rowPlaces = [...rowPlaces, ...stays.filter(stay => stay.phase === phase)];
        }
        const start = row.interval?.start ?? row.point;
        const end = row.interval?.end ?? start;
        rowPlaces.filter(place => place.target === "event").forEach(place => {
          place.eventTargets ??= [];
          if (!place.eventTargets.some(target => target.rowId === row.key)) place.eventTargets.push({
            targetId: event.urlId, dateId, rowId: row.key,
            start: Number.isFinite(start) ? start : null, end: Number.isFinite(end) ? end : null,
          });
        });
        const item = { id: row.key, event, agendaItem: localized?.agendaItem ?? row.agendaItem,
          sourceIndex, dateId, zone: flight ? airportZone(flight.from) : transfer ? airportZone(transfer.to)
            : row.agendaItem?.timeZone ?? sourceEvent.timeZone ?? zone,
          endZone: flight ? airportZone(flight.to) : null,
          start: Number.isFinite(start) ? start : null, end: Number.isFinite(end) ? end : null,
          pointOnly: !row.interval, reminderUntil: Number.isFinite(start) && !row.interval ? start + 15 * 60000 : null,
          label: localized?.label ?? row.label, type: flight ? "flight" : transfer ? "wait" : agendaIconType(canonicalTitle, sourceEvent.icon),
          routeIds: sourceEvent.segmentIds ?? [],
          places: rowPlaces.map(place => nearbyPlaceEvidence(place, dateId, sourceIndex, movement.moving)), ...movement,
          executionStatus: "planned", timeStatus: row.interval ? row.interval.source : Number.isFinite(start) ? "known-start" : "unknown",
          sourceRefs: [{ eventId: event.urlId, dateId, rowId: row.key }],
          flight: flight ? { flightNumber: flight.flightNumber, from: flight.from, to: flight.to } : null,
        };
        if (!Number.isFinite(start) || row.untimed) { untimed.push({ ...item, start: null, end: null, reminderUntil: null }); continue; }
        const key = flight ? `${flight.flightNumber}:${start}:${end}` : null;
        if (key && flightRows.has(key)) { flightRows.get(key).sourceRefs.push(...item.sourceRefs); continue; }
        if (key) flightRows.set(key, item);
        rows.push(item);
      }
    }
    entry.day.events.forEach((item, sourceIndex) => {
      const owners = events.filter(event => event.dateId === dateId && event.sourceIndexes.includes(sourceIndex));
      const linked = [...rows, ...untimed].filter(row => (row.sourceIndex === sourceIndex && row.dateId === dateId)
        || (row.flight && owners.some(owner => row.sourceRefs.some(ref => ref.eventId === owner.id))
          && (item[1]?.includes(row.flight.flightNumber) || item[2]?.flightRef === row.flight.flightNumber
            || /抵达|到达/.test(item[1] ?? "") && entry.events.some(event => event.flights?.some(flight =>
              flight.flightNumber === row.flight.flightNumber && flight.arrival?.replace(/^次日\s*/, "") === item[0])))));
      sourceItems.push({ dateId, sourceIndex, title: item[1], eventIds: owners.map(owner => owner.id),
        rowIds: linked.map(row => row.id), status: linked.length ? "represented" : "unmapped-source" });
    });
  }
  rows.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  // Do not stretch overlapping calendar days across entire long-haul flights.
  const unscheduledDays = days.filter(day => untimed.some(row => row.dateId === day.dateId));
  const tripStart = Math.min(...(rows.length ? rows.map(row => row.start) : days.map(day => day.start)),
    ...unscheduledDays.map(day => day.start));
  const tripEnd = Math.max(...(rows.length ? rows.map(row => row.end) : days.map(day => day.end)),
    ...unscheduledDays.map(day => day.end));
  return { rows, days, places: places.filter(place => place.target !== "event" || place.targetId || place.eventTargets?.length),
    events, untimed, sourceItems, tripStart, tripEnd, language };
}
