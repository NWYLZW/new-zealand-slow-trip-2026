import { useState } from "react";
import { eventAgendaItems } from "./adventureEventAgenda";
import { adventureEventInterval, flightEndpointInstant, zonedLocalInstant } from "./adventureEventTime";
import { AdventureScheduleTimeline, formatScheduleTimeZoneOffset } from "./AdventureScheduleTimeline";
import { PencilText } from "./pencil/PencilText";
import { scheduleDurationLabel } from "./scheduleDuration";

const airportZones = { SZX: "Asia/Shanghai", KUL: "Asia/Kuala_Lumpur", AKL: "Pacific/Auckland",
  ZQN: "Pacific/Auckland", CHC: "Pacific/Auckland" };

function nextDate(dateId) {
  const date = new Date(`${dateId}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function endpointZone(endpoint) {
  const code = /\b([A-Z]{3})$/.exec(endpoint ?? "")?.[1];
  return airportZones[code] ?? "Pacific/Auckland";
}

function zoneLabel(zone, language) {
  if (zone === "Asia/Shanghai") return language === "en" ? "Shenzhen" : "深圳";
  if (zone === "Asia/Kuala_Lumpur") return language === "en" ? "Kuala Lumpur" : "吉隆坡";
  if (zone === "Pacific/Auckland") return language === "en" ? "Auckland" : "奥克兰";
  return zone;
}

function clock(value) {
  const match = /(?:前一日\s*)?(\d{1,2}):(\d{2})/.exec(value ?? "");
  if (!match) return null;
  return { text: `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`,
    minutes: Number(match[1]) * 60 + Number(match[2]) };
}

function formatInstant(instant, zone, withDate = false) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: zone,
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(instant)).filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
  return `${withDate ? `${Number(parts.month)}/${Number(parts.day)} ` : ""}${parts.hour}:${parts.minute}`;
}

function tickLabel(instant, zone, index) {
  const plain = formatInstant(instant, zone, false);
  if (!index) return plain;
  const currentDate = formatInstant(instant, zone, true).split(" ")[0];
  const previousDate = formatInstant(instant - 60000, zone, true).split(" ")[0];
  return currentDate !== previousDate ? `${currentDate} ${plain}` : plain;
}

function fullTickLabel(instant, zone, language) {
  return `${formatInstant(instant, zone, true)} · ${zoneLabel(zone, language)}`;
}

function OptionalAgendaChoice({ item, language, renderContent, timeLabel = null }) {
  const [selected, setSelected] = useState(item.choice?.defaultValue ?? null);
  const options = item.choice?.options ?? [];
  const selectedOption = options.find((option) => option.value === selected);
  return <div className="trip-event-optional-choice">
    <span className="trip-event-optional-choice-title">{timeLabel && <PencilText>{`${timeLabel} · `}</PencilText>}{renderContent(item.title)}</span>
    <div className="trip-event-optional-choice-options" role="group"
      aria-label={language === "en" ? "Choose an optional post-check-in plan" : "选择入住后的可选安排"}>
      {options.map((option) => {
        const label = language === "en" ? option.labelEn ?? option.label : option.label;
        const active = selected === option.value;
        return <div className="trip-event-optional-choice-option" key={option.value}>
          <button type="button" aria-pressed={active} aria-label={`${active ? "取消" : "选择"}${label}`}
            onClick={() => setSelected((value) => value === option.value ? null : option.value)}>
            <PencilText>{active ? language === "en" ? "Selected" : "已选" : language === "en" ? "Choose" : "选择"}</PencilText>
          </button>
          <span>{renderContent(label)}</span>
        </div>;
      })}
    </div>
    <span className="trip-event-optional-choice-status" role="status">
      {selectedOption ? <>{language === "en" ? "Selected: " : "当前选择 · "}
        {renderContent(language === "en" ? selectedOption.labelEn ?? selectedOption.label : selectedOption.label)}</>
        : <PencilText>{language === "en" ? "No option selected" : "尚未选择，按当天状态决定"}</PencilText>}
    </span>
  </div>;
}

function flightRows(event, dateId, language, activeAgendaId, onSelectAgenda, renderContent) {
  const intervals = [], points = [], flightRecords = [];
  for (const flight of event.flights ?? []) {
    const start = flightEndpointInstant(flight, "departure"), end = flightEndpointInstant(flight, "arrival");
    if (start === null || end === null || end <= start) continue;
    const departureIndex = event.events.findIndex((entry) => entry?.[1]?.includes(flight.flightNumber));
    const arrivalClock = clock(flight.arrival);
    const arrivalIndex = event.events.findIndex((entry) => clock(entry?.[2]?.start ?? entry?.[0])?.text === arrivalClock?.text
      && /抵达|到达|落地/.test(entry?.[1] ?? ""));
    const departureSource = departureIndex >= 0 ? event.items?.[departureIndex] ?? departureIndex : null;
    const arrivalSource = arrivalIndex >= 0 ? event.items?.[arrivalIndex] ?? arrivalIndex : null;
    const departureText = departureIndex >= 0 ? event.events[departureIndex][1] : `${flight.flightNumber} ${flight.from} → ${flight.to}`;
    const arrivalText = arrivalIndex >= 0 ? event.events[arrivalIndex][1] : `抵达 ${flight.to} · ${flight.arrival}`;
    const row = { id: `${event.urlId}#flight-${flight.flightNumber}`, start, end,
      sourceIndex: departureSource, label: flight.flightNumber, iconType: "flight", color: event.color,
      title: `${flight.from} ${flight.departure} → ${flight.to} ${flight.arrival}`,
      ariaLabel: `${flight.flightNumber}，${flight.from} ${flight.departure} 至 ${flight.to} ${flight.arrival}`,
      renderContent: <div className="trip-event-flight-timeline-content">
        <span><PencilText>{flight.departure} · </PencilText>{renderContent(departureText)}</span>
        <span><PencilText>{flight.arrival} · </PencilText>{renderContent(arrivalText)}</span>
      </div> };
    intervals.push(row);
    flightRecords.push({ flight, start, end, arrivalText, arrivalSource });
  }
  flightRecords.forEach((record, index) => {
    const next = flightRecords[index + 1];
    if (!next || next.start <= record.end) return;
    const city = record.flight.to.replace(/\s+[A-Z]{3}$/, "");
    const localizedCity = language === "en" && city === "吉隆坡" ? "Kuala Lumpur" : city;
    const connectionLabel = language === "en"
      ? `Transfer and wait · ${localizedCity}` : `转机与候机 · ${localizedCity}`;
    const connectionAction = language === "en" ? "Transfer and wait" : "转机与候机";
    intervals.push({ id: `${event.urlId}#transfer-${index}`, start: record.end, end: next.start,
      sourceIndex: record.arrivalSource, label: connectionLabel,
      iconType: "wait", color: "#7b8f6a",
      title: `${record.flight.arrival}—${next.flight.departure} · ${connectionAction} · ${localizedCity}`,
      ariaLabel: language === "en"
        ? `${localizedCity}, ${record.flight.arrival} to ${next.flight.departure}, transfer and wait`
        : `${localizedCity}，${record.flight.arrival} 至 ${next.flight.departure}，转机与候机`,
      renderContent: <div className="trip-event-flight-timeline-content">
        <span>{renderContent(record.arrivalText)}</span>
        <span><PencilText>{`${record.flight.arrival}—${next.flight.departure} · ${connectionLabel}`}</PencilText></span>
      </div> });
  });
  for (const item of eventAgendaItems(event, { language })) {
    const startDate = item.date ?? dateId, zone = item.timeZone ?? endpointZone(event.flights?.[0]?.from);
    const start = zonedLocalInstant(startDate, item.startTime, zone);
    if (start === null) continue;
    const displayTime = item.timeLabel ?? item.time;
    const base = { id: item.id, sourceIndex: item.sourceIndex, label: item.title,
      iconType: item.iconType, color: event.color, groupId: event.urlId,
      active: item.id === activeAgendaId, title: `${displayTime} · ${item.title}`,
      ariaLabel: `${displayTime}，${item.title}${item.isEstimated ? "，计划时间" : ""}` };
    if (item.endTime) {
      const endDate = item.endDate ?? (item.endMinutes < item.startMinutes ? nextDate(startDate) : startDate);
      const end = zonedLocalInstant(endDate, item.endTime, zone);
      if (end !== null && end > start) intervals.push({ ...base, start, end,
        renderContent: <div className="trip-event-flight-timeline-content">
          <span><PencilText>{`${item.startTime}—${item.endTime} · `}</PencilText>{renderContent(item.title)}</span>
          {item.isEstimated && <small><PencilText>{language === "en" ? "Planned" : "计划"}</PencilText></small>}
        </div> });
    } else points.push({ ...base, time: start, timeLabel: displayTime, mapsUrl: item.mapsUrl,
      onSelect: () => onSelectAgenda?.(item) });
  }
  const rangeStart = Math.min(...points.map((item) => item.time), ...intervals.map((item) => item.start));
  const rangeEnd = Math.max(...points.map((item) => item.time), ...intervals.map((item) => item.end));
  const range = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd) && rangeEnd > rangeStart
    ? { start: rangeStart, end: rangeEnd } : null;
  return { points: range ? points.filter((item) => item.time >= range.start && item.time <= range.end) : [],
    intervals, range,
    tickZone: event.scheduleStart?.timeZone ?? endpointZone(event.flights?.[0]?.from),
    endZone: endpointZone(event.flights?.at(-1)?.to) };
}

function intervalTimeLabel(item, startDate, endDate, language) {
  const crossesDate = endDate !== startDate || item.endMinutes < item.startMinutes;
  const nextDay = language === "en" ? "next day " : "次日 ";
  return `${item.startTime}—${crossesDate ? nextDay : ""}${item.endTime}`;
}

function agendaRows(event, dateId, language, activeAgendaId, onSelectAgenda, renderContent) {
  const points = [], intervals = [];
  const itemZones = [];
  for (const item of eventAgendaItems(event, { language })) {
    const startDate = item.date ?? dateId, zone = item.timeZone ?? "Pacific/Auckland";
    itemZones.push(zone);
    const start = zonedLocalInstant(startDate, item.startTime, zone);
    if (start === null) continue;
    const completed = item.executionStatus === "completed";
    const confirmedMilestone = !completed && !item.isEstimated && !item.endTime;
    const displayTime = item.timeLabel ?? item.time;
    const base = { id: item.id, label: item.title, iconType: item.iconType, groupId: event.urlId,
      active: item.id === activeAgendaId, color: event.color,
      title: `${displayTime} · ${item.title}${confirmedMilestone ? " · 已预约时间点" : ""}`,
      ariaLabel: `${displayTime}，${item.title}${confirmedMilestone ? "，已预约时间点" : !completed && item.isEstimated ? "，计划时间" : ""}`,
      onSelect: () => onSelectAgenda?.(item) };
    if (item.endTime) {
      const endDate = item.endDate ?? (item.endMinutes < item.startMinutes ? nextDate(startDate) : startDate);
      const end = zonedLocalInstant(endDate, item.endTime, zone);
      const timeRange = `${completed && item.isEstimated ? (language === "en" ? "Around " : "约") : ""}${intervalTimeLabel(item, startDate, endDate, language)}`;
      const durationLabel = scheduleDurationLabel(start, end, { ...item, language });
      if (end !== null && end > start) intervals.push({ ...base, start, end,
        label: item.localizedSummary ?? item.title,
        timeLabel: timeRange, durationLabel, activityType: item.activityType,
        title: `${timeRange} · ${item.title} · ${durationLabel}`,
        ariaLabel: `${timeRange}，${item.title}，${durationLabel}`,
        renderContent: item.choice
          ? <OptionalAgendaChoice item={item} language={language} renderContent={renderContent} timeLabel={timeRange} />
          : <div className="trip-event-agenda-interval-content">
          <button type="button" className="trip-event-agenda-select" onClick={() => onSelectAgenda?.(item)}
            aria-label={`${timeRange}，选择${item.title}`} aria-pressed={item.id === activeAgendaId}>
            <PencilText>{timeRange}</PencilText>
          </button>
          <span>{renderContent(item.title)}</span>
          <small><PencilText>{durationLabel}</PencilText></small>
        </div>,
        meta: completed ? null : item.derivedFromNext
          ? (language === "en" ? "Planned occupancy · bounded by the next start" : "计划占用 · 由下一项开始时间划分")
          : item.isEstimated ? (language === "en" ? "Planned window" : "计划时段") : null });
    } else if (item.choice) points.push({ ...base, mapsUrl: null, onSelect: undefined,
      time: start, timeLabel: displayTime, groupId: event.urlId,
      renderContent: <OptionalAgendaChoice item={item} language={language} renderContent={renderContent} /> });
    else if (item.mapsUrl) points.push({ ...base, mapsUrl: null, onSelect: undefined,
      time: start, timeLabel: displayTime, groupId: event.urlId,
      renderContent: <div className="trip-event-agenda-interval-content">
        <button type="button" className="trip-event-agenda-select" onClick={() => onSelectAgenda?.(item)}
          aria-label={`${displayTime}，选择${item.title}`} aria-pressed={item.id === activeAgendaId}>
          <PencilText>{displayTime}</PencilText>
        </button>
        <span>{renderContent(item.title)}</span>
      </div> });
    else points.push({ ...base, mapsUrl: null, time: start, timeLabel: displayTime, groupId: event.urlId });
  }
  const nestedPointIds = new Set();
  const intervalsWithMilestones = intervals.map((interval) => {
    const milestones = points.filter((point) => point.groupId === interval.groupId
      && point.time > interval.start && point.time < interval.end);
    milestones.forEach((point) => nestedPointIds.add(point.id));
    return milestones.length ? { ...interval, milestones } : interval;
  });
  const topLevelPoints = points.filter((point) => !nestedPointIds.has(point.id));
  const parentInterval = adventureEventInterval(event, dateId);
  const starts = [...topLevelPoints.map((item) => item.time), ...intervalsWithMilestones.map((item) => item.start)];
  const ends = [...topLevelPoints.map((item) => item.time), ...intervalsWithMilestones.map((item) => item.end)];
  const range = parentInterval ?? (starts.length && ends.length && Math.max(...ends) > Math.min(...starts)
    ? { start: Math.min(...starts), end: Math.max(...ends) } : null);
  const agendaZone = event.scheduleStart?.timeZone ?? itemZones[0] ?? "Pacific/Auckland";
  return { points: topLevelPoints, intervals: intervalsWithMilestones, range,
    tickZone: agendaZone, endZone: agendaZone };
}

export function AdventureEventTimeline({ event, dateId, language = "zh", activeAgendaId = null,
  onSelectAgenda, renderContent = (text) => text }) {
  const model = event.isFlightTransfer && !event.flightsAsDetailsOnly
    ? flightRows(event, dateId, language, activeAgendaId, onSelectAgenda, renderContent)
    : agendaRows(event, dateId, language, activeAgendaId, onSelectAgenda, renderContent);
  const flightZones = new Set((event.flights ?? []).flatMap((flight) => [endpointZone(flight.from), endpointZone(flight.to)]));
  const primaryTimeZone = event.primaryTimeZone ?? event.day?.primaryTimeZone;
  const comparisonTimeZone = event.comparisonTimeZone ?? event.day?.comparisonTimeZone;
  const explicitAxisZones = primaryTimeZone && comparisonTimeZone && primaryTimeZone !== comparisonTimeZone
    ? [primaryTimeZone, comparisonTimeZone] : null;
  const fallbackAxisZones = flightZones.has("Pacific/Auckland") && flightZones.has("Asia/Shanghai")
    ? ["Pacific/Auckland", "Asia/Shanghai"] : null;
  const axisZones = explicitAxisZones ?? fallbackAxisZones;
  const tickColumns = model.range && axisZones ? axisZones.map((zone, index) => {
    const place = zoneLabel(zone, language);
    return { id: zone, label: formatScheduleTimeZoneOffset(model.range.start, zone),
      headingTitle: `${place} · ${fullTickLabel(model.range.start, zone, language)} · ${zone}`,
      headingAriaLabel: `${place}${language === "en" ? " time" : "时间"}，${fullTickLabel(model.range.start, zone, language)}，${zone}`,
      formatTick: (instant) => formatInstant(instant, zone, index !== 0),
      tickTitle: (instant) => fullTickLabel(instant, zone, language),
      tickAriaLabel: (instant) => fullTickLabel(instant, zone, language) };
  }) : null;
  return <section className="trip-event-timeline-adapter">
    {model.range && <AdventureScheduleTimeline range={model.range} points={model.points} intervals={model.intervals}
      readableLabels={model.intervals.some(row => row.activityType) && !model.intervals.some(row => row.milestones?.length)}
      height="fill" ariaLabel={language === "en" ? "Event schedule timeline" : "事件行程时间轴"}
      className="trip-event-schedule-timeline"
      tickColumns={tickColumns}
      formatTick={(instant, index) => tickLabel(instant, model.tickZone, index)}
      tickTitle={(instant) => fullTickLabel(instant, model.tickZone, language)}
      tickAriaLabel={(instant) => fullTickLabel(instant, model.tickZone, language)}
      endTick={tickColumns ? undefined : { label: formatInstant(model.range.end, model.endZone, false),
        title: fullTickLabel(model.range.end, model.endZone, language),
        ariaLabel: fullTickLabel(model.range.end, model.endZone, language) }} />}
  </section>;
}
