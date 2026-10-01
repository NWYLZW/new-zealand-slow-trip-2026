import { HOUR, weatherLocalParts, weatherWindow } from "./weatherData.js";

export function joinWeatherSegments(dateId, segments, data) {
  return segments.flatMap((segment, index) => {
    const byInstant = new Map((data[index]?.hours ?? []).map(hour => [hour.instant, hour]));
    const window = weatherWindow(dateId, segment.location.timeZone), hours = [];
    for (let instant = window.start; instant < window.end; instant += HOUR) {
      const clock = weatherLocalParts(instant, segment.location.timeZone).clock;
      if (clock < segment.start || clock >= segment.end) continue;
      hours.push({ instant, clock, temperature: null, precipitation: null, wind: null, code: null,
        ...byInstant.get(instant), location: segment.location, period: `${segment.start}–${segment.end}` });
    }
    return hours;
  }).sort((a, b) => a.instant - b.instant);
}

export function splitWeatherTransit(segments) {
  const result = segments.map(segment => ({ ...segment }));
  const minutes = clock => clock.split(":").reduce((hour, minute) => hour * 60 + Number(minute), 0);
  for (let index = 1; index < result.length; index++) {
    const before = result[index - 1], after = result[index];
    if (before.end >= after.start || before.location.timeZone !== after.location.timeZone) continue;
    const midpoint = Math.round((minutes(before.end) + minutes(after.start)) / 2);
    const clock = `${String(Math.floor(midpoint / 60)).padStart(2, "0")}:${String(midpoint % 60).padStart(2, "0")}`;
    const transit = { start: before.end, end: after.start, split: clock };
    before.end = clock; after.start = clock;
    before.transit = transit; after.transit = transit;
  }
  return result;
}

export function weatherSegmentData(data, segment) {
  if (!data || !segment || (segment.start === "00:00" && segment.end === "24:00")) return data;
  const hours = joinWeatherSegments(data.date, [segment], [data]);
  const temperatures = hours.map(hour => hour.temperature).filter(Number.isFinite);
  const conditions = hours.map(hour => hour.code).filter(Number.isFinite);
  return { ...data, hours,
    partial: !hours.length || hours.some(hour => [hour.temperature, hour.precipitation, hour.wind, hour.code].some(value => value == null)),
    daily: { min: hours.length && temperatures.length === hours.length ? Math.min(...temperatures) : null,
      max: hours.length && temperatures.length === hours.length ? Math.max(...temperatures) : null,
      code: hours.length && conditions.length === hours.length ? Math.max(...conditions) : null } };
}
