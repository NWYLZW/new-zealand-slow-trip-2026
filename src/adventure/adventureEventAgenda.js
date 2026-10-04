import { getInlineEventParts } from "../eventLinks";
import { agendaActivityIcon, agendaIconType } from "./adventureAgendaIcons";

function exactClock(value) {
  const match = /^(?:[01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  return { time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    timeMinutes: hours * 60 + minutes };
}

export function agendaItemId(parentEvent, item, index) {
  const sourceIndex = Number.isInteger(item?.sourceIndex)
    ? item.sourceIndex : parentEvent?.items?.[index] ?? index;
  return `${parentEvent?.urlId ?? "event"}#agenda-${sourceIndex}`;
}

function isFlightGeometryEntry(event, rawTime, title, meta) {
  if (!(event.isFlightTransfer || event.flights?.length)) return false;
  if (meta.end) return false;
  if (meta.flightRef || meta.afterFlightRef) return true;
  const entryClock = exactClock(meta.start ?? rawTime);
  return (event.flights ?? []).some((flight) => {
    if (title.includes(flight.flightNumber)) return true;
    const arrivalClock = exactClock(String(flight.arrival ?? "").replace(/^次日\s*/, ""));
    return entryClock && arrivalClock?.time === entryClock.time && /抵达|到达|落地/.test(title);
  });
}

export function eventAgendaItems(event, { language = "zh" } = {}) {
  if (!event || !Array.isArray(event.events)) return [];
  const items = event.events.flatMap((entry, index) => {
    const [rawTime, rawTitle, meta = {}] = Array.isArray(entry) ? entry : [];
    const clock = exactClock(meta.start ?? rawTime);
    if (!clock || typeof rawTitle !== "string" || !rawTitle.trim()) return [];
    if (isFlightGeometryEntry(event, rawTime, rawTitle, meta)) return [];
    const endClock = exactClock(meta.end);
    const sourceIndex = Number.isInteger(event.items?.[index]) ? event.items[index] : index;
    const mapPart = getInlineEventParts(rawTitle).find((part) => part.kind === "place" && part.url);
    const title = language === "en" && typeof entry?.titleEn === "string" ? entry.titleEn : rawTitle;
    const summary = meta.summary ?? null, summaryEn = meta.summaryEn ?? null;
    const localizedSummary = language === "en" ? (summaryEn ?? summary) : summary;
    const item = { parentEventId: event.urlId, sourceIndex, time: clock.time,
      timeLabel: language === "en" ? meta.timeLabelEn ?? rawTime : rawTime,
      timeMinutes: clock.timeMinutes, startTime: clock.time, startMinutes: clock.timeMinutes,
      endTime: endClock?.time ?? null, endMinutes: endClock?.timeMinutes ?? null,
      isEstimated: Boolean(meta.isEstimated ?? meta.estimated), derivedFromNext: false,
      executionStatus: meta.executionStatus ?? "planned",
      date: meta.date ?? null, endDate: meta.endDate ?? null,
      timeZone: meta.timeZone ?? null, choice: meta.choice ?? null,
      title, summary, summaryEn, localizedSummary, activityType: meta.activityType ?? null,
      iconType: agendaActivityIcon(meta.activityType) ?? agendaIconType(rawTitle, event.icon),
      mapsUrl: mapPart?.url ?? null, linkKind: mapPart ? "map" : null };
    return [{ ...item, id: agendaItemId(event, item, index) }];
  });
  if (!items.length) return [];
  const mayDerivePlannedWindow = !(event.isFlightTransfer || event.flights?.length)
    && !["car", "bus", "flight", "domesticFlight"].includes(event.icon);
  return items.map((item, index) => {
    const next = items[index + 1];
    if (!mayDerivePlannedWindow || item.executionStatus === "completed" || item.endTime
      || !next || next.startMinutes <= item.startMinutes) return item;
    return { ...item, endTime: next.startTime, endMinutes: next.startMinutes,
      isEstimated: true, derivedFromNext: true };
  });
}
