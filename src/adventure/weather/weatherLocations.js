import { mapStops } from "../../tripData";
import { placePositions, routeSegments } from "../../data/mapRoutes";
import { getTripCalendarDay } from "../../components/calendar/tripCalendarData";
import { splitWeatherTransit } from "./weatherSegments.js";

const names = {
  SZX: ["深圳机场", "Shenzhen Airport"], KUL: ["吉隆坡机场", "Kuala Lumpur Airport"],
  AKL: ["奥克兰机场", "Auckland Airport"], AKC: ["奥克兰市中心", "Auckland city centre"],
  ZQN: ["皇后镇", "Queenstown"], WTP: ["Walter Peak", "Walter Peak"],
  WKA: ["瓦纳卡", "Wānaka"], AOR: ["库克山村", "Mount Cook Village"],
  TEK: ["特卡波湖", "Lake Tekapo"], OAM: ["奥马鲁", "Ōamaru"],
  CHC: ["基督城市中心", "Christchurch city centre"], HBT: ["霍比屯", "Hobbiton"],
};
const locations = new Map(mapStops.filter(stop => names[stop.tag]).map(stop => [stop.tag, {
  id: stop.tag, name: names[stop.tag][0], nameEn: names[stop.tag][1],
  latitude: stop.tag === "CHC" ? placePositions.christchurchCbd.lat : stop.position[0],
  longitude: stop.tag === "CHC" ? placePositions.christchurchCbd.lng : stop.position[1],
  timeZone: stop.tag === "SZX" ? "Asia/Shanghai" : stop.tag === "KUL" ? "Asia/Kuala_Lumpur" : "Pacific/Auckland",
  coordinateSource: stop.tag === "CHC" ? "placePositions.christchurchCbd" : `mapStops.${stop.tag}`,
}]));
const glenorchy = routeSegments.find(segment => segment.id === "zqn-glenorchy")?.waypoints?.[0];
if (glenorchy) locations.set("GLN", { id: "GLN", name: "格林诺奇", nameEn: "Glenorchy",
  latitude: glenorchy.lat, longitude: glenorchy.lng, timeZone: "Pacific/Auckland",
  coordinateSource: "routeSegments.zqn-glenorchy.waypoints[0]" });

// Always resolve against the public calendar, never its unlocked stay enrichment.
export function weatherLocationForDay(dateId, placeTag = null) {
  const day = getTripCalendarDay(dateId);
  if (!day) return null;
  const tags = [...new Set(day.events.flatMap(event => event.stopTags ?? []))].filter(tag => locations.has(tag));
  const hasGlenorchy = day.events.some(event => event.segmentIds?.includes("zqn-glenorchy"));
  const placeAllowed = tags.includes(placeTag) || (placeTag === "AKC" && tags.includes("AKL"));
  const activities = day.events.filter(event => !event.isFlightTransfer && !event.flightsAsDetailsOnly
    && !["flight", "domesticFlight", "car", "bus"].includes(event.icon));
  const activityTag = activities.flatMap(event => event.stopTags ?? []).filter(tag => locations.has(tag)).at(-1);
  let tag = activityTag ?? tags.at(-1);
  const flights = day.events.flatMap(event => event.flightsAsDetailsOnly ? [] : event.flights ?? []);
  if (!activityTag && flights.length && tag === flights.at(-1).to?.split(" ").at(-1)
    && flights.at(-1).arrival?.startsWith("次日") && flights.at(-1).date === dateId) {
    tag = flights.filter(flight => flight.date === dateId && !flight.arrival?.startsWith("次日"))
      .at(-1)?.to?.split(" ").at(-1) ?? tags[0];
  }
  const selected = locations.get(placeAllowed ? placeTag : hasGlenorchy ? "GLN" : tag);
  if (!selected) return null;
  return { ...selected, dateId, context: placeAllowed ? "place" : "itinerary",
    representative: tags.length > 1 || hasGlenorchy, tripLocationIds: tags };
}

export function weatherSegmentsForDay(dateId, placeTag = null) {
  const location = weatherLocationForDay(dateId, placeTag);
  if (!location) return [];
  const day = getTripCalendarDay(dateId)?.day;
  if (location.context === "place" || !day?.weatherSegments) return [{ location, start: "00:00", end: "24:00" }];
  const segments = day.weatherSegments.map(segment => {
    const from = segment.fromEvent == null ? null : day.events[segment.fromEvent]?.[2];
    const until = segment.untilEvent == null ? null : day.events[segment.untilEvent]?.[2];
    const selected = locations.get(segment.placeTag);
    if (!selected || (segment.fromEvent != null && !from?.start) || (segment.untilEvent != null && !until?.start)) return null;
    return { location: { ...selected, dateId, context: "segment", representative: true },
      start: from?.start ?? "00:00", end: until?.start ?? "24:00" };
  }).filter(Boolean);
  return segments.length ? splitWeatherTransit(segments) : [{ location, start: "00:00", end: "24:00" }];
}
