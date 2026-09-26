const airportZones = {
  SZX: "Asia/Shanghai",
  KUL: "Asia/Kuala_Lumpur",
  AKL: "Pacific/Auckland",
  ZQN: "Pacific/Auckland",
  CHC: "Pacific/Auckland",
};

const localParts = new Map();

function airportLocation(endpoint) {
  const match = /^(.*?)\s+([A-Z]{3})$/.exec(endpoint ?? "");
  if (!match) return { city: endpoint ?? "未知地点", zone: null };
  return { city: match[1], zone: airportZones[match[2]] ?? null };
}

function dateParts(dateId) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateId ?? "");
  return match ? match.slice(1).map(Number) : null;
}

function nextDate(dateId) {
  const parts = dateParts(dateId);
  if (!parts) return null;
  const next = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
  return next.toISOString().slice(0, 10);
}

function offsetMinutes(zone, dateId, clock) {
  const date = dateParts(dateId);
  const time = /^(\d{1,2}):(\d{2})$/.exec(clock ?? "");
  if (!zone || !date || !time) return null;
  let formatter = localParts.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    localParts.set(zone, formatter);
  }
  const target = Date.UTC(date[0], date[1] - 1, date[2], Number(time[1]), Number(time[2]));
  let instant = target, offset = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const fields = Object.fromEntries(formatter.formatToParts(new Date(instant))
      .filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
    offset = Math.round((Date.UTC(fields.year, fields.month - 1, fields.day,
      fields.hour, fields.minute) - instant) / 60000);
    instant = target - offset * 60000;
  }
  return offset;
}

function utcOffset(zone, dateId, clock) {
  const offset = offsetMinutes(zone, dateId, clock);
  if (offset === null) return null;
  const sign = offset < 0 ? "-" : "+";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}

export function zonedLocalInstant(dateId, clock, zone = "Pacific/Auckland") {
  const date = dateParts(dateId);
  const time = /^(\d{1,2}):(\d{2})$/.exec(clock ?? "");
  const offset = offsetMinutes(zone, dateId, clock);
  if (!date || !time || offset === null) return null;
  return Date.UTC(date[0], date[1] - 1, date[2], Number(time[1]), Number(time[2])) - offset * 60000;
}

export function flightEndpointInstant(flight, endpoint) {
  const arrival = endpoint === "arrival";
  const raw = arrival ? flight.arrival : flight.departure;
  const date = arrival && raw?.startsWith("次日") ? nextDate(flight.date) : flight.date;
  const clock = raw?.replace(/^次日\s*/, "");
  return zonedLocalInstant(date, clock, airportLocation(arrival ? flight.to : flight.from).zone);
}

export function adventureEventInterval(event, dateId) {
  const clocks = [...(event.time ?? "").matchAll(/\d{1,2}:\d{2}/g)].map(match => match[0]);
  const exactWindow = clocks.length === 2 && !/后|前后|待定|约/.test(event.time);
  if (event.isFlightTransfer && event.flights?.length) {
    const start = flightEndpointInstant(event.flights[0], "departure");
    const end = flightEndpointInstant(event.flights.at(-1), "arrival");
    if (start !== null && end !== null && end > start) return { start, end, source: "航段已知时段" };
    return null;
  }
  if (!exactWindow) return null;
  const start = zonedLocalInstant(dateId, clocks[0]);
  const endDate = event.time.includes("次日") ? nextDate(dateId) : dateId;
  const end = zonedLocalInstant(endDate, clocks[1]);
  return start !== null && end !== null && end > start ? { start, end, source: "活动时段" } : null;
}

export function adventureEventPoint(event, dateId) {
  const clock = event.time?.match(/\d{1,2}:\d{2}/)?.[0];
  return clock ? zonedLocalInstant(dateId, clock) : null;
}

export function aucklandAxisLabel(instant, dateId) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Pacific/Auckland", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant)).filter(part => part.type !== "literal")
    .map(part => [part.type, part.value]));
  const date = dateParts(dateId);
  const otherDay = date && (Number(parts.month) !== date[1] || Number(parts.day) !== date[2]);
  return `${otherDay ? `${Number(parts.month)}/${Number(parts.day)} ` : ""}${parts.hour}:${parts.minute}`;
}

function localEndpoint(endpoint, dateId, rawTime) {
  const { city, zone } = airportLocation(endpoint);
  const clock = rawTime?.replace(/^次日\s*/, "");
  const date = dateParts(dateId);
  const day = date ? `${date[1]}月${date[2]}日` : "日期未知";
  const offset = utcOffset(zone, dateId, clock);
  return `${city} ${day} ${clock ?? "时间未知"}${offset ? `（${offset}）` : "（时区未知）"}`;
}

function scheduleStartEndpoint(start) {
  const date = dateParts(start?.date);
  const day = date ? `${date[1]}月${date[2]}日` : "日期未知";
  const offset = utcOffset(start?.timeZone, start?.date, start?.time);
  const place = start?.timeZone === "Asia/Shanghai" ? "深圳" : "出发地";
  return `${place} ${day} ${start?.time ?? "时间未知"}${offset ? `（${offset}）` : "（时区未知）"}`;
}

export function adventureFlightSegments(event) {
  if (!Array.isArray(event.flights)) return [];
  return event.flights.map(flight => {
    const arrivalDate = flight.arrival?.startsWith("次日") ? nextDate(flight.date) : flight.date;
    return `${flight.flightNumber ?? "航班"} · ${localEndpoint(flight.from, flight.date, flight.departure)} → ${localEndpoint(flight.to, arrivalDate, flight.arrival)}`;
  });
}

export function adventureEventTime(event, dateId) {
  if (!event.time) return null;
  if (event.scheduleStart && event.flights?.length) {
    const lastFlight = event.flights.at(-1);
    const arrivalDate = lastFlight.arrival?.startsWith("次日") ? nextDate(lastFlight.date) : lastFlight.date;
    const pendingArrival = event.scheduleStart.arrivalLabel ? ` · ${event.scheduleStart.arrivalLabel}` : "";
    return `行程时段 ${scheduleStartEndpoint(event.scheduleStart)} → ${localEndpoint(lastFlight.to, arrivalDate, lastFlight.arrival)} · 跨日，航段按各地当地时间${pendingArrival}`;
  }
  const international = event.flights?.some(flight => {
    const from = airportLocation(flight.from).zone;
    const to = airportLocation(flight.to).zone;
    return from && to && from !== to;
  });
  if (international && event.isFlightTransfer) return `行程时段 ${event.time} · 各航段按当地时间`;
  const offset = utcOffset("Pacific/Auckland", dateId, event.time.match(/\d{1,2}:\d{2}/)?.[0]);
  const zone = offset ? `新西兰当地时间（${offset}）` : "新西兰当地时间";
  return `${event.isFlightTransfer ? "活动时段 " : ""}${event.time} · ${zone}`;
}
