import { useMemo } from "react";
import { useLanguage } from "../LanguageContext";
import { getTripCalendarDay } from "../components/calendar/tripCalendarData";
import { adventureEventDescription, adventureEventLabel } from "./adventureEventLabel";
import { eventAgendaItems } from "./adventureEventAgenda";
import { adventureEventInterval, adventureEventPoint, adventureEventTime,
  adventureFlightSegments, flightEndpointInstant, zonedLocalInstant } from "./adventureEventTime";
import { AdventureScheduleTimeline, attachScheduleMilestones,
  formatScheduleTimeZoneOffset } from "./AdventureScheduleTimeline";
import { PencilText } from "./pencil/PencilText";
import "./AdventureDayDetails.css";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const AIRPORT_TIME_ZONES = { SZX: "Asia/Shanghai", KUL: "Asia/Kuala_Lumpur",
  AKL: "Pacific/Auckland", ZQN: "Pacific/Auckland", CHC: "Pacific/Auckland" };
const TIME_ZONE_CITIES = {
  "Asia/Shanghai": ["深圳", "Shenzhen"],
  "Pacific/Auckland": ["奥克兰", "Auckland"],
};
const CONNECTION_WAIT_COLOR = "#7b8f6a";
const CONNECTION_CITY_EN = { "吉隆坡": "Kuala Lumpur" };
const DAY_AGENDA_LABELS = {
  "2026-09-28:0": ["前往深圳机场", "Travel to Shenzhen Airport"],
  "2026-09-28:1": ["值机、托运、安检", "Check-in, bag drop and security"],
  "2026-09-28:6": ["机场候机", "Wait at the airport"],
  "2026-09-29:11": ["机场休息候机", "Rest at the airport"],
  "2026-09-29:12": ["入境、取行李", "Immigration and baggage claim"],
  "2026-09-29:3": ["落地取行李、办理租车", "Baggage and rental pickup"],
  "2026-09-29:4": ["Budget 机场取车", "Budget airport pickup"],
  "2026-09-29:5": ["驾车前往皇后镇", "Drive towards Queenstown"],
  "2026-09-29:6": ["停车、适应驾驶或休息", "Parking, driving adjustment or rest"],
  "2026-09-29:7": ["市区午餐", "Lunch in town"],
  "2026-09-29:8": ["自由驾驶、闲逛", "Free drive and walk"],
  "2026-09-29:9": ["前往住宿", "Head towards the stay"],
  "2026-09-29:10": ["办理入住", "Check in"],
  "2026-09-29:13": ["闲逛或休息补觉", "Walk around or rest"],
};

function dayAgendaLabel(agendaItem, dateId, language) {
  const summary = agendaItem?.localizedSummary
    ?? (language === "en" ? agendaItem?.summaryEn ?? agendaItem?.summary : agendaItem?.summary);
  if (typeof summary === "string" && summary.trim()) return summary.trim();
  const labels = DAY_AGENDA_LABELS[`${dateId}:${agendaItem?.sourceIndex}`];
  return labels?.[language === "en" ? 1 : 0] ?? agendaItem?.title;
}

function endpointClock(endpoint) {
  const match = /^(.*?)\s+([A-Z]{3})$/.exec(endpoint ?? "");
  return match ? { city: match[1], zone: AIRPORT_TIME_ZONES[match[2]] ?? null } : null;
}

function zonedTickParts(instant, zone) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23" }).formatToParts(new Date(instant))
    .filter(part => part.type !== "literal").map(part => [part.type, part.value]));
}

function zonedTickLabel(instant, zone, withDate) {
  const parts = zonedTickParts(instant, zone);
  return `${withDate ? `${Number(parts.month)}/${Number(parts.day)} ` : ""}${parts.hour}:${parts.minute}`;
}

function zonedTickDescription(instant, zone, city, language) {
  const locale = language === "en" ? "en-NZ" : "zh-CN";
  const value = new Intl.DateTimeFormat(locale, { timeZone: zone, year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "longOffset" })
    .format(new Date(instant));
  return language === "en" ? `${city}: ${value} (${zone})` : `${city}：${value}（${zone}）`;
}

export function adventureDayTickColumns(events, language = "zh", referenceInstant,
  primaryTimeZone = "Pacific/Auckland", comparisonTimeZone = null, timeZoneLabels = {}) {
  const endpoints = events?.map(event => {
    if (!event.isFlightTransfer || !event.flights?.length) return null;
    const origin = endpointClock(event.flights[0]?.from);
    const destination = endpointClock(event.flights.at(-1)?.to);
    return origin?.zone && destination?.zone && origin.zone !== destination.zone
      ? { origin, destination } : null;
  }).find(Boolean);
  if (!endpoints && !comparisonTimeZone) return null;
  const endpointList = endpoints ? [endpoints.origin, endpoints.destination] : [];
  const endpointForZone = zone => endpointList.find(endpoint => endpoint.zone === zone);
  const cityForZone = zone => timeZoneLabels[zone] ?? endpointForZone(zone)?.city
    ?? TIME_ZONE_CITIES[zone]?.[language === "en" ? 1 : 0] ?? zone;
  const secondaryZone = comparisonTimeZone
    ?? endpointList.find(endpoint => endpoint.zone !== primaryTimeZone)?.zone;
  if (!secondaryZone || secondaryZone === primaryTimeZone) return null;
  const columns = [
    { city: cityForZone(primaryTimeZone), zone: primaryTimeZone },
    { city: cityForZone(secondaryZone), zone: secondaryZone },
  ];
  return columns.map((endpoint, index) => {
    const headerDescription = zonedTickDescription(referenceInstant, endpoint.zone, endpoint.city, language);
    return { id: endpoint.zone,
    label: formatScheduleTimeZoneOffset(referenceInstant, endpoint.zone) ?? "UTC?",
    headingTitle: headerDescription, headingAriaLabel: headerDescription,
    formatTick: instant => zonedTickLabel(instant, endpoint.zone, index === 1),
    tickTitle: instant => zonedTickDescription(instant, endpoint.zone, endpoint.city, language),
    tickAriaLabel: instant => zonedTickDescription(instant, endpoint.zone, endpoint.city, language) };
  });
}

function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return `${hours ? `${hours}小时` : ""}${rest ? `${rest}分钟` : ""}`;
}

function nextDateId(dateId) {
  const date = new Date(`${dateId}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function previousDateId(dateId) {
  const date = new Date(`${dateId}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function adventureDayFlightPrepRows(event, dateId) {
  const firstFlightIndex = event.events?.findIndex(entry => event.flights?.[0]?.flightNumber
    && entry?.[1]?.includes(event.flights[0].flightNumber));
  if (!(firstFlightIndex > 0)) return [];
  const departureZone = endpointClock(event.flights[0]?.from)?.zone ?? "Pacific/Auckland";
  const rows = [];
  event.events.slice(0, firstFlightIndex).forEach((entry, index) => {
    const [rawTime, rawTitle, meta = {}] = entry;
    const startClock = meta.start ?? (/^\d{1,2}:\d{2}$/.test(rawTime ?? "") ? rawTime : null);
    if (!/^\d{1,2}:\d{2}$/.test(startClock ?? "")) return;
    const startDate = meta.date ?? dateId;
    const zone = meta.timeZone ?? departureZone;
    const start = zonedLocalInstant(startDate, startClock, zone);
    if (start === null) return;
    const endClock = meta.end;
    const endDate = endClock && endClock <= startClock ? nextDateId(startDate) : startDate;
    const end = /^\d{1,2}:\d{2}$/.test(endClock ?? "") ? zonedLocalInstant(endDate, endClock, zone) : null;
    rows.push({ event, key: `${event.urlId}-prep-${event.items?.[index] ?? index}`,
      groupId: event.urlId,
      label: rawTitle, timeLabel: rawTime, knownPoint: !(end !== null && end > start),
      interval: end !== null && end > start
        ? { start, end, source: meta.isEstimated ? "预计时段" : "计划时段" } : null,
      point: end !== null && end > start ? null : start });
  });
  return rows;
}

function agendaInterval(agendaItem, dateId, defaultTimeZone = "Pacific/Auckland") {
  const startValue = agendaItem.start ?? agendaItem.startTime ?? agendaItem.time;
  const endValue = agendaItem.end ?? agendaItem.endTime;
  const startDate = agendaItem.date ?? dateId;
  const zone = agendaItem.timeZone ?? defaultTimeZone;
  const start = Number.isFinite(startValue) ? startValue
    : typeof startValue === "string" ? zonedLocalInstant(startDate, startValue, zone) : null;
  const inferredEndDate = typeof startValue === "string" && typeof endValue === "string"
    && endValue <= startValue ? nextDateId(startDate) : startDate;
  const endDate = agendaItem.endDate ?? inferredEndDate;
  const end = Number.isFinite(endValue) ? endValue
    : typeof endValue === "string" ? zonedLocalInstant(endDate, endValue, zone) : null;
  return start !== null && end !== null && end > start
    ? { start, end, source: agendaItem.isEstimated ? "预计时段" : "计划时段" } : null;
}

function agendaPointInstant(agendaItem, dateId, defaultTimeZone = "Pacific/Auckland") {
  const value = agendaItem.start ?? agendaItem.startTime ?? agendaItem.time;
  if (Number.isFinite(value)) return value;
  return typeof value === "string"
    ? zonedLocalInstant(agendaItem.date ?? dateId, value,
      agendaItem.timeZone ?? defaultTimeZone) : null;
}

function isFlightGeometrySource(event, rawTime, rawTitle, meta) {
  if (!(event.isFlightTransfer || event.flights?.length)) return false;
  if (meta.flightRef || meta.afterFlightRef) return true;
  if ((event.flights ?? []).some(flight => flight.flightNumber
    && rawTitle.includes(flight.flightNumber))) return true;
  const rawClock = meta.start ?? String(rawTime ?? "").match(/\d{1,2}:\d{2}/)?.[0];
  return /抵达|到达|落地|arriv/i.test(rawTitle) && (event.flights ?? []).some(flight =>
    flight.arrival?.replace(/^次日\s*/, "") === rawClock);
}

function dayAgendaItems(event, language) {
  const parsedItems = eventAgendaItems(event, { language });
  if (!Array.isArray(event.events)) return parsedItems;
  const parsedBySourceIndex = new Map(parsedItems.map(item => [item.sourceIndex, item]));
  return event.events.flatMap((entry, index) => {
    const sourceIndex = Number.isInteger(event.items?.[index]) ? event.items[index] : index;
    const parsed = parsedBySourceIndex.get(sourceIndex);
    if (parsed) return [parsed];
    const [rawTime, rawTitle, meta = {}] = Array.isArray(entry) ? entry : [];
    if (typeof rawTitle !== "string" || !rawTitle.trim()) return [];
    const rawClock = meta.start ?? String(rawTime ?? "").match(/\d{1,2}:\d{2}/)?.[0];
    const clockMatch = /^(?:[01]?\d|2[0-3]):[0-5]\d$/.exec(rawClock ?? "");
    if (!clockMatch) return [{ id: `${event.urlId}#agenda-${sourceIndex}`,
      parentEventId: event.urlId, sourceIndex, time: null, timeLabel: rawTime,
      timeMinutes: null, startTime: null, startMinutes: null, endTime: null, endMinutes: null,
      isEstimated: Boolean(meta.isEstimated ?? meta.estimated), derivedFromNext: false,
      date: meta.date ?? null, endDate: meta.endDate ?? null, timeZone: meta.timeZone ?? null,
      choice: meta.choice ?? null, plannedDurationMinutes: meta.plannedDurationMinutes ?? null,
      summary: meta.summary ?? null, summaryEn: meta.summaryEn ?? null,
      localizedSummary: language === "en" ? meta.summaryEn ?? meta.summary ?? null : meta.summary ?? null,
      title: rawTitle, iconType: event.icon, mapsUrl: null, linkKind: null,
      approximateTime: false, untimed: true }];
    if (isFlightGeometrySource(event, rawTime, rawTitle, meta)) return [];
    const [hours, minutes] = rawClock.split(":").map(Number);
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return [{ id: `${event.urlId}#agenda-${sourceIndex}`, parentEventId: event.urlId, sourceIndex,
      time, timeLabel: rawTime, timeMinutes: hours * 60 + minutes,
      startTime: time, startMinutes: hours * 60 + minutes, endTime: null, endMinutes: null,
      isEstimated: true, derivedFromNext: false, date: meta.date ?? null,
      endDate: meta.endDate ?? null, timeZone: meta.timeZone ?? null, choice: meta.choice ?? null,
      plannedDurationMinutes: meta.plannedDurationMinutes ?? null,
      summary: meta.summary ?? null, summaryEn: meta.summaryEn ?? null,
      localizedSummary: language === "en" ? meta.summaryEn ?? meta.summary ?? null : meta.summary ?? null,
      title: rawTitle, iconType: event.icon, mapsUrl: null, linkKind: null,
      approximateTime: rawTime !== time }];
  });
}

function dayAgendaRow(event, agendaItem, dateId, language, defaultTimeZone, index, count) {
  const interval = agendaInterval(agendaItem, dateId, defaultTimeZone);
  const point = interval ? null : agendaPointInstant(agendaItem, dateId, defaultTimeZone);
  const parentHasUnknownEnd = /结束时间未知|end unknown|活动后|after\s/.test(event.time ?? "");
  const openEndedActivity = /晚餐|休息|晚间|夜|观星|企鹅|dinner|rest|evening|night|stargazing|penguin/i
    .test(`${agendaItem.title ?? ""} ${agendaItem.timeLabel ?? ""}`);
  return { event, agendaItem, key: agendaItem.id, label: dayAgendaLabel(agendaItem, dateId, language),
    canonicalLabel: agendaItem.title, knownPoint: Number.isFinite(point), untimed: agendaItem.untimed,
    timeLabel: agendaItem.timeLabel,
    blocksGapAfter: !interval && (agendaItem.approximateTime || openEndedActivity
      || index === count - 1 && parentHasUnknownEnd),
    interval, point };
}

function collapseRangeLabel(start, end, axisEnd, primaryTimeZone) {
  const startLabel = zonedTickLabel(start, primaryTimeZone, false);
  const endLabel = end === axisEnd ? "24:00" : zonedTickLabel(end, primaryTimeZone, false);
  return `${startLabel}—${endLabel}`;
}

export function adventureDayCollapsedRanges(rows, axisStart, axisEnd, language = "zh",
  primaryTimeZone = "Pacific/Auckland") {
  if (rows.some(row => row.untimed)) return [];
  const occupied = rows.flatMap(row => {
    if (row.interval) {
      const start = Math.max(axisStart, row.interval.start);
      const end = Math.min(axisEnd, row.interval.end);
      return end > start ? [{ start, end, blocksGapAfter: false }] : [];
    }
    if (!Number.isFinite(row.point) || row.point < axisStart || row.point > axisEnd) return [];
    return [{ start: row.point, end: row.point, blocksGapAfter: Boolean(row.blocksGapAfter) }];
  }).sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  for (const item of occupied) {
    const previous = merged.at(-1);
    if (previous && item.start <= previous.end) {
      if (item.end > previous.end) {
        previous.end = item.end;
        previous.blocksGapAfter = item.blocksGapAfter;
      } else if (item.end === previous.end) previous.blocksGapAfter ||= item.blocksGapAfter;
    } else merged.push({ ...item });
  }
  const gaps = [];
  let cursor = axisStart;
  let blocksGapAfter = false;
  for (const item of merged) {
    if (!blocksGapAfter && item.start - cursor > 2 * HOUR) gaps.push({ start: cursor, end: item.start });
    if (item.end >= cursor) {
      cursor = Math.max(cursor, item.end);
      blocksGapAfter = item.blocksGapAfter;
    }
  }
  if (!blocksGapAfter && axisEnd - cursor > 2 * HOUR) gaps.push({ start: cursor, end: axisEnd });
  return gaps.map((range, index) => ({ id: `day-gap-${index}`, ...range,
    label: collapseRangeLabel(range.start, range.end, axisEnd, primaryTimeZone),
    endSuffix: range.end === axisEnd ? "+1" : null,
    expandLabel: language === "en" ? "Expand" : "展开",
    collapseLabel: language === "en" ? "Collapse" : "收起",
    expandTitle: language === "en" ? `Expand ${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}` : `展开 ${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}`,
    collapseTitle: language === "en" ? `Collapse ${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}` : `收起 ${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}`,
    expandAriaLabel: language === "en" ? `${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}, expand` : `${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}，展开`,
    collapseAriaLabel: language === "en" ? `${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}, collapse` : `${collapseRangeLabel(range.start, range.end,
      axisEnd, primaryTimeZone)}，收起` }));
}

export function adventureDayEventRows(event, dateId, language, defaultTimeZone = "Pacific/Auckland") {
  const rendersFlightGeometry = event.isFlightTransfer && !event.flightsAsDetailsOnly;
  if (rendersFlightGeometry && event.flights?.length > 1) {
    const segments = adventureFlightSegments(event);
    const flights = event.flights.map(flight => ({ flight,
      start: flightEndpointInstant(flight, "departure"),
      end: flightEndpointInstant(flight, "arrival") }));
    if (flights.every(item => item.start !== null && item.end !== null && item.end > item.start)) {
      const supplementalAgenda = dayAgendaItems(event, language);
      const rows = supplementalAgenda.map((item, index) => dayAgendaRow(event, item, dateId, language,
        defaultTimeZone, index, supplementalAgenda.length));
      flights.forEach((item, index) => {
        if (index > 0 && item.start > flights[index - 1].end) {
          const city = flights[index - 1].flight.to?.replace(/\s+[A-Z]{3}$/, "") ?? "中转地";
          const label = language === "en"
            ? `Transfer and wait · ${CONNECTION_CITY_EN[city] ?? city}` : `转机与候机 · ${city}`;
          rows.push({ event, key: `${event.urlId}-transfer-${index}`, label,
            summary: `${city} ${flights[index - 1].flight.arrival} → ${item.flight.departure}`,
            details: `${segments[index - 1]}；${segments[index]}`,
            iconType: "wait", color: CONNECTION_WAIT_COLOR,
            interval: { start: flights[index - 1].end, end: item.start, source: "换乘" } });
        }
        rows.push({ event, key: `${event.urlId}-flight-${index}`,
          label: `${item.flight.flightNumber} · ${item.flight.from.replace(/\s+[A-Z]{3}$/, "")} → ${item.flight.to.replace(/\s+[A-Z]{3}$/, "")}`,
          summary: `${item.flight.from} ${item.flight.departure} → ${item.flight.to} ${item.flight.arrival}`,
          details: segments[index],
          interval: { start: item.start, end: item.end, source: "航段" } });
      });
      return rows;
    }
    return [{ event, key: event.urlId, label: `${adventureEventLabel(event)} · 航段时间未知`,
      interval: null, point: adventureEventPoint(event, dateId) }];
  }
  if (rendersFlightGeometry && event.flights?.length === 1) {
    const flight = event.flights[0];
    const start = flightEndpointInstant(flight, "departure");
    const end = flightEndpointInstant(flight, "arrival");
    const segment = adventureFlightSegments(event)[0];
    const rows = start !== null && end !== null && end > start ? [{ event, key: `${event.urlId}-flight-0`,
      label: `${flight.flightNumber} · ${flight.from.replace(/\s+[A-Z]{3}$/, "")} → ${flight.to.replace(/\s+[A-Z]{3}$/, "")}`,
      summary: `${flight.from} ${flight.departure} → ${flight.to} ${flight.arrival}`,
      details: segment, interval: { start, end, source: "航段" } }] : [];
    const supplementalAgenda = dayAgendaItems(event, language);
    rows.push(...supplementalAgenda.map((item, index) => dayAgendaRow(event, item, dateId, language,
      defaultTimeZone, index, supplementalAgenda.length)));
    if (rows.length) return rows;
  }
  const agenda = dayAgendaItems(event, language);
  if (agenda.length > 0) return agenda.map((agendaItem, index) => dayAgendaRow(event, agendaItem,
    dateId, language, defaultTimeZone, index, agenda.length));
  const pointClock = event.time?.match(/\d{1,2}:\d{2}/)?.[0];
  return [{ event, key: event.urlId, label: adventureEventLabel(event),
    summary: rendersFlightGeometry && event.flights?.length === 1
      ? `${event.flights[0].from} ${event.flights[0].departure} → ${event.flights[0].to} ${event.flights[0].arrival}` : null,
    details: rendersFlightGeometry && event.flights?.length === 1
      ? adventureFlightSegments(event)[0] : null,
    interval: rendersFlightGeometry ? adventureEventInterval(event, dateId) : null,
    point: rendersFlightGeometry ? adventureEventPoint(event, dateId)
      : pointClock ? zonedLocalInstant(dateId, pointClock, defaultTimeZone) : null }];
}

export function adventureDayRowsForDate(dateId, language = "zh") {
  const entry = getTripCalendarDay(dateId, { language });
  if (!entry) return [];
  const primaryTimeZone = entry.day.primaryTimeZone ?? entry.day.timeZone ?? "Pacific/Auckland";
  const axisStart = zonedLocalInstant(dateId, "00:00", primaryTimeZone);
  const currentRows = entry.events.flatMap(event => adventureDayEventRows(event,
    dateId, language, primaryTimeZone));
  if (axisStart === null) return currentRows;
  const previousDate = previousDateId(dateId);
  const previousEntry = getTripCalendarDay(previousDate, { language });
  const previousTimeZone = previousEntry?.day.primaryTimeZone
    ?? previousEntry?.day.timeZone ?? "Pacific/Auckland";
  const carryoverRows = (previousEntry?.events ?? [])
    .flatMap(event => adventureDayEventRows(event, previousDate, language, previousTimeZone))
    .filter(row => row.interval && row.interval.start < axisStart && row.interval.end > axisStart)
    .filter(row => !currentRows.some(current => current.interval
      && current.interval.start === row.interval.start && current.interval.end === row.interval.end
      && current.label === row.label));
  return [...carryoverRows, ...currentRows];
}

export function AdventureDayDetails({ dateId, onSelectEvent }) {
  const { language } = useLanguage();
  const entry = getTripCalendarDay(dateId, { language });
  const model = useMemo(() => {
    if (!entry) return null;
    const primaryTimeZone = entry.day.primaryTimeZone ?? entry.day.timeZone ?? "Pacific/Auckland";
    const comparisonTimeZone = entry.day.comparisonTimeZone ?? null;
    const axisStart = zonedLocalInstant(dateId, "00:00", primaryTimeZone);
    if (axisStart === null) return null;
    const axisEnd = zonedLocalInstant(nextDateId(dateId), "00:00", primaryTimeZone) ?? axisStart + DAY;
    const tickColumns = adventureDayTickColumns(entry.events, language, axisStart,
      primaryTimeZone, comparisonTimeZone, {
        [primaryTimeZone]: language === "en"
          ? entry.day.primaryTimeZoneLabelEn ?? entry.day.timeZoneLabelEn
          : entry.day.primaryTimeZoneLabel ?? entry.day.timeZoneLabel,
        [comparisonTimeZone]: language === "en"
          ? entry.day.comparisonTimeZoneLabelEn : entry.day.comparisonTimeZoneLabel,
      });
    const all = adventureDayRowsForDate(dateId, language);
    const collapsedRanges = adventureDayCollapsedRanges(all, axisStart, axisEnd, language, primaryTimeZone);
    const intervals = all.filter(row => row.interval && row.interval.end > axisStart && row.interval.start < axisEnd)
      .map(({ event, agendaItem, key, label, canonicalLabel, details, iconType: rowIconType,
        color: rowColor, timeLabel: rowTimeLabel, interval }) => {
        const minutes = Math.round((interval.end - interval.start) / 60000);
        const continuation = interval.end > axisEnd ? " · 次日续接" : interval.start < axisStart ? " · 承接前日" : "";
        const rowDetails = [];
        if (key === event.urlId && adventureEventDescription(event)) rowDetails.push(event.title);
        if (key === event.urlId && event.flights?.length > 0) rowDetails.push(...adventureFlightSegments(event));
        const fullTimeLabel = agendaItem
          ? `${zonedTickLabel(interval.start, primaryTimeZone, interval.start < axisStart
            || interval.start >= axisEnd)}—${zonedTickLabel(interval.end, primaryTimeZone,
            interval.end <= axisStart || interval.end > axisEnd)}`
          : rowTimeLabel ?? adventureEventTime(event, dateId);
        const fullLabel = canonicalLabel ?? label;
        const fullDetails = [details, ...rowDetails].filter(Boolean).join("；");
        return { id: key, start: interval.start, end: interval.end, label, showTime: false,
          iconType: rowIconType ?? agendaItem?.iconType, mapsUrl: agendaItem?.mapsUrl,
          color: rowColor ?? event.color, groupId: event.urlId,
          summaryGroup: !event.isFlightTransfer || event.flights?.length === 1
            ? { id: event.urlId, label: adventureEventLabel(event), color: event.color,
              iconType: event.icon, onSelect: () => onSelectEvent(event) } : null,
          title: [fullTimeLabel, fullLabel, fullDetails,
            `${interval.source} ${durationLabel(minutes)}${continuation}`].filter(Boolean).join(" · "),
          ariaLabel: [fullTimeLabel, fullLabel, fullDetails,
            `${interval.source}${durationLabel(minutes)}${continuation}`].filter(Boolean).join("，"),
          onSelect: () => onSelectEvent(event, agendaItem) };
      });
    const points = all.filter(row => !row.untimed && (!row.interval || row.interval.start >= axisEnd)).map(({ event, agendaItem,
      knownPoint, key, label, canonicalLabel, timeLabel: rowTimeLabel, groupId, point, interval }) => {
      const time = point ?? interval?.start ?? axisStart;
      const afterDay = time >= axisEnd;
      const timeLabel = rowTimeLabel ?? agendaItem?.time ?? adventureEventTime(event, dateId) ?? "时间待定";
      const fullLabel = canonicalLabel ?? label;
      return { id: key, time, timeLabel, showTime: false,
        label: `${label}${afterDay ? " · 次日续接" : knownPoint ? "" : " · 时点/待定"}`,
        iconType: agendaItem?.iconType ?? event.icon, mapsUrl: agendaItem?.mapsUrl,
        color: event.color, groupId: groupId ?? (agendaItem ? event.urlId : null),
        title: `${timeLabel} · ${fullLabel}${afterDay ? " · 次日续接" : ""}`,
        ariaLabel: `${timeLabel}，${fullLabel}${afterDay ? "，次日续接" : knownPoint ? "" : "，时点或待定"}`,
        onSelect: () => onSelectEvent(event, agendaItem) };
    });
    const untimed = all.filter(row => row.untimed).map(({ event, agendaItem, key, label,
      canonicalLabel, timeLabel, groupId }) => ({ id: key, label, timeLabel,
      title: canonicalLabel ?? label, plannedDurationMinutes: agendaItem?.plannedDurationMinutes,
      color: event.color, groupId: groupId ?? event.urlId,
      onSelect: () => onSelectEvent(event, agendaItem) }));
    return { axisStart, axisEnd, primaryTimeZone, tickColumns, collapsedRanges, untimed,
      ...attachScheduleMilestones(intervals, points) };
  }, [dateId, entry, language, onSelectEvent]);

  if (!entry || !model) return null;
  const nextDate = nextDateId(dateId);
  const zoneCity = TIME_ZONE_CITIES[model.primaryTimeZone]?.[language === "en" ? 1 : 0]
    ?? model.primaryTimeZone;
  const nextDateLabel = language === "en" ? `${nextDate} 00:00 ${zoneCity} (${model.primaryTimeZone})`
    : `${nextDate} 00:00 ${zoneCity}当地时间（${model.primaryTimeZone}）`;
  return <section className="trip-day-details" aria-label={`${entry.day.date}日程时间线`}>
    <AdventureScheduleTimeline height="fill" adaptiveDetail range={{ start: model.axisStart, end: model.axisEnd }}
      intervals={model.intervals} points={model.points}
      tickColumns={model.tickColumns}
      collapsedRanges={model.collapsedRanges}
      formatTick={instant => zonedTickLabel(instant, model.primaryTimeZone, false)}
      endTick={{ label: "00:00", suffix: "+1", title: nextDateLabel, ariaLabel: nextDateLabel }} />
    {model.untimed.length > 0 && <section className="trip-day-untimed" aria-label={language === "en"
      ? "Time to be confirmed" : "时间待确认"}>
      <h3><PencilText>{language === "en" ? "Time to be confirmed" : "时间待确认"}</PencilText></h3>
      {model.untimed.map(item => <button key={item.id} type="button" onClick={item.onSelect}
        title={item.title} aria-label={`${item.timeLabel}，${item.title}`}>
        <PencilText>{item.label}</PencilText>
        {item.plannedDurationMinutes && <small><PencilText>{language === "en"
          ? `About ${item.plannedDurationMinutes} min` : `计划约${item.plannedDurationMinutes}分钟`}</PencilText></small>}
      </button>)}
    </section>}
  </section>;
}
