import { geoDistance } from "d3";

export const LOCATION_MAX_AGE = 60000;
export const LOCATION_MAX_ACCURACY = 500;
const EARTH_RADIUS = 6371008.8;
const roadBins = new WeakMap();
const clockFormats = new Map();

export const validPosition = value => Array.isArray(value) && value.length === 2
  && value.every(Number.isFinite) && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180;

export function locationIssue(location, now) {
  if (!location) return "missing";
  if (!validPosition(location.position) || !Number.isFinite(location.accuracy) || location.accuracy < 0
    || !Number.isFinite(location.timestamp)) return "invalid";
  if (location.accuracy > LOCATION_MAX_ACCURACY) return "imprecise";
  if (now < location.timestamp - 1000) return "future";
  if (now - location.timestamp >= LOCATION_MAX_AGE) return "stale";
  return null;
}

export function usableLocation(location, now) {
  return Number.isFinite(now) && !locationIssue(location, now) ? location : null;
}

export function locationDistance(from, to) {
  return validPosition(from) && validPosition(to)
    ? geoDistance([from[1], from[0]], [to[1], to[0]]) * EARTH_RADIUS : Infinity;
}

// Index immutable road snapshots once. Clock/GPS ticks inspect local bins only;
// neither location readings nor private geometry are written outside memory.
function nearRoad(location, route) {
  if (!location || location.accuracy > 150 || !["road", "coach"].includes(route.transport)) return false;
  const geometry = route.roadGeometry;
  if (!geometry?.coordinates) return false;
  let bins = roadBins.get(geometry);
  if (!bins) {
    bins = new Map();
    for (const [lng, lat] of geometry.coordinates) {
      const key = `${Math.floor(lat * 50)}:${Math.floor(lng * 50)}`;
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push([lat, lng]);
    }
    roadBins.set(geometry, bins);
  }
  const [lat, lng] = location.position;
  const y = Math.floor(lat * 50), x = Math.floor(lng * 50);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if ((bins.get(`${y + dy}:${x + dx}`) ?? []).some(point =>
      locationDistance(location.position, point) + location.accuracy <= 350)) return true;
  }
  return false;
}

const activeUntil = row => row.pointOnly ? row.reminderUntil ?? row.end : row.end;
const byStart = (a, b) => a.start - b.start || a.id.localeCompare(b.id);
const text = (language, zh, en) => language === "en" ? en : zh;

function localHour(now, zone) {
  if (!clockFormats.has(zone)) clockFormats.set(zone, new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, hour: "2-digit", hourCycle: "h23",
  }));
  return Number(clockFormats.get(zone).format(new Date(now)));
}

function fallbackFor(phase, day, current, next, previous, untimed, now, language) {
  if (current) return null;
  let kind = phase === "during-trip" ? "gap" : phase;
  if (kind === "gap") {
    if (untimed.length) kind = "untimed";
    else if (!day) kind = "between-days";
    else if (localHour(now, day.zone ?? "Pacific/Auckland") < 6
      || localHour(now, day.zone ?? "Pacific/Auckland") >= 21) kind = "overnight";
  }
  const labels = {
    "before-trip": ["尚未到计划出发时间", "Before the planned departure"],
    "after-trip": ["已过记录的计划时段", "Past the recorded plan period"],
    gap: ["当前是日程空档", "A gap in the schedule"],
    overnight: ["夜间没有定时安排", "No timed plan for this night-time gap"],
    "between-days": ["跨日空档", "A gap between itinerary days"],
    untimed: ["当天有未定时项目", "Untimed items on this day"],
    "invalid-time": ["当前时间不可用", "Current time unavailable"],
    "no-itinerary": ["暂无已记录行程", "No recorded itinerary"],
  };
  const dateId = day?.dateId ?? (phase === "after-trip" ? previous?.dateId : next?.dateId) ?? null;
  const detail = untimed.length ? text(language, `未定时 ${untimed.length} 项`, `${untimed.length} untimed items`)
    : ["before-trip", "after-trip"].includes(phase) ? dateId : null;
  return { kind, label: labels[kind]?.[language === "en" ? 1 : 0], detail,
    dateId, target: dateId ? "day" : null, targetId: dateId, untimedCount: untimed.length };
}

function evidenceFor(current, location, rawLocation, now, routes, language, locationStatus) {
  const expectedPlaces = current?.places ?? [];
  const result = { status: "unknown", reason: "no-current-plan", expectedPlaces, distance: null,
    label: text(language, "位置与计划尚未核对", "Location and plan not verified"),
    detail: null };
  if (!location) return { ...result, status: "unavailable",
    reason: locationIssue(rawLocation, now) === "missing" ? locationStatus ?? "missing" : locationIssue(rawLocation, now),
    label: text(language, "定位不可用，按计划展示", "Location unavailable; showing the plan") };
  if (!current) return result;
  if (current.confidence === "near-place" || current.confidence === "on-route") return { ...result,
    status: "consistent", reason: current.confidence,
    label: text(language, "定位与计划地点相近", "Location is near the planned place or route") };
  if (current.moving || current.transit) return { ...result, reason: "moving",
    label: text(language, "行进中的实际进度未知", "Actual travel progress is unknown") };
  if (!expectedPlaces.length) return { ...result, reason: "no-geography" };
  const distances = expectedPlaces.map(place => ({ place, distance: locationDistance(location.position, place.position) }));
  const distance = Math.min(...distances.map(item => item.distance));
  // Town/area coordinates are reference anchors, not venue boundaries.
  const far = distances.every(item => item.distance - location.accuracy > (item.place.specificity === "place" ? 2000 : 12000));
  return far ? { ...result, status: "conflict", reason: "far-from-plan", distance,
    label: text(language, "定位与计划地点不符", "Location differs from the planned place"),
    detail: text(language, "定位远离计划地点", "Location is far from the planned place") }
    : { ...result, reason: "near-area", distance };
}

export function nearbyPlaceTarget(place, now, dateId) {
  const targets = place.eventTargets ?? [];
  const distance = target => Number.isFinite(target.start)
    ? Math.max(target.start - now, now - (target.end ?? target.start), 0) : Infinity;
  const target = [...targets].sort((a, b) => Number(b.dateId === dateId) - Number(a.dateId === dateId)
    || distance(a) - distance(b) || a.dateId.localeCompare(b.dateId))[0];
  return target ? { ...place, targetId: target.targetId } : place;
}

export function nearbyRefreshDelay(dataset, now) {
  const boundaries = [...dataset.rows.flatMap(row => [row.start, activeUntil(row)]),
    ...dataset.days.flatMap(day => [day.start, day.end])].filter(value => value > now);
  return Math.max(1, Math.min(30000, ...boundaries.map(value => value - now)));
}

export function nearbyContext(dataset, now, rawLocation, routes = [], locationStatus = null) {
  const { days = [], places = [], language = "zh" } = dataset;
  const rows = (dataset.rows ?? []).filter(row => row.executionStatus !== "completed");
  const validNow = Number.isFinite(now);
  const location = usableLocation(rawLocation, now);
  const tripStart = dataset.tripStart ?? Math.min(...days.map(day => day.start), ...rows.map(row => row.start));
  const tripEnd = dataset.tripEnd ?? Math.max(...days.map(day => day.end), ...rows.map(row => row.end));
  const phase = !validNow ? "invalid-time" : !days.length && !rows.length ? "no-itinerary"
    : now < tripStart ? "before-trip" : now >= tripEnd ? "after-trip" : "during-trip";
  const candidates = validNow && phase === "during-trip" ? rows.filter(row => row.start <= now && activeUntil(row) > now).map(row => {
    const matchedPlace = location && location.accuracy <= 150 && !row.moving && !row.transit && !row.pointOnly
      && row.places?.find(place => place.specificity === "place"
        && locationDistance(location.position, place.position) + location.accuracy <= 250);
    const matchedRoad = row.transit && !row.pointOnly && routes.some(route => row.routeIds?.includes(route.id) && nearRoad(location, route));
    return { ...row, confidence: matchedPlace ? "near-place" : matchedRoad ? "on-route" : "schedule" };
  }) : [];
  candidates.sort((a, b) => Number(b.confidence !== "schedule") - Number(a.confidence !== "schedule")
    || b.start - a.start || Number(a.pointOnly) - Number(b.pointOnly) || a.end - b.end || a.id.localeCompare(b.id));
  const current = candidates[0] ?? null;
  const next = validNow ? rows.filter(row => row.start > now).sort(byStart)[0] ?? null : null;
  const previous = validNow ? rows.filter(row => activeUntil(row) <= now)
    .sort((a, b) => activeUntil(b) - activeUntil(a) || b.start - a.start)[0] ?? null : null;
  const day = phase === "during-trip" ? days.filter(item => item.start <= now && now < item.end)
    .sort((a, b) => b.start - a.start)[0] ?? days.find(item => item.dateId === current?.dateId) ?? null : null;
  const referenceDay = day ?? (phase === "before-trip" ? days[0] : phase === "after-trip" ? days.at(-1) : null);
  const untimed = (dataset.untimed ?? []).filter(row =>
    row.executionStatus !== "completed" && row.dateId === referenceDay?.dateId);
  const nearby = location ? places.filter(place => !place.dates || place.dates.includes(day?.dateId))
    .map(place => ({ ...nearbyPlaceTarget(place, now, day?.dateId), distance: locationDistance(location.position, place.position) }))
    .filter(place => place.distance + location.accuracy <= 8000)
    .sort((a, b) => a.distance - b.distance)[0] ?? null : null;
  return { day, nearby, current, next, previous, location, phase, untimed, tripStart, tripEnd,
    fallback: fallbackFor(phase, referenceDay, current, next, previous, untimed, now, language),
    locationEvidence: evidenceFor(current, location, rawLocation, now, routes, language, locationStatus) };
}

export function nearbyDistanceLabel(distance, language = "zh") {
  const value = distance < 1000 ? `${Math.max(50, Math.round(distance / 50) * 50)} m`
    : `${(distance / 1000).toFixed(1)} km`;
  return language === "en" ? `About ${value} straight-line` : `直线约 ${value}`;
}
