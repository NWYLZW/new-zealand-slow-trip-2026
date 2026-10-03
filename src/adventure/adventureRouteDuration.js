import { routeSegments } from "../data/mapRoutes";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { routeText } from "../routeI18n";
import { flightEndpointInstant } from "./adventureEventTime";
import roadRoutes from "./data/road-routes.json";
import estimates from "./data/route-duration-estimates.json";

const events = getAdventureCalendarDays().flatMap(day => day.events);
const airportCode = endpoint => endpoint?.match(/\b([A-Z]{3})$/)?.[1];

export const routeTravelSegments = routeSegments.map(segment => {
  const flight = events.filter(event => event.segmentIds?.includes(segment.id))
    .flatMap(event => event.flights ?? []).find(item =>
      airportCode(item.from) === segment.from && airportCode(item.to) === segment.to);
  return { ...segment, flight,
    transport: segment.id.includes("coach") ? "coach" : segment.transport,
    roundTrip: segment.from === segment.to && Boolean(segment.waypoints?.length),
    roadSource: roadRoutes.routes[segment.id] ?? null };
});
const segmentById = new Map(routeTravelSegments.map(segment => [segment.id, segment]));

function durationText(totalMinutes, en) {
  const hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60;
  return [hours ? (en ? `${hours}h` : `${hours}小时`) : "",
    minutes ? (en ? `${minutes}m` : `${minutes}分钟`) : ""].filter(Boolean).join(en ? " " : "");
}

export function flightDurationEstimate(flight, language = "zh") {
  if (!flight) return null;
  const start = flightEndpointInstant(flight, "departure");
  const end = flightEndpointInstant(flight, "arrival");
  if (start === null || end === null || end <= start) return null;
  const totalMinutes = Math.max(1, Math.round((end - start) / 60000));
  const en = language === "en";
  return { totalMinutes, label: (en ? "Flight " : "飞行") + durationText(totalMinutes, en),
    title: en ? "Scheduled elapsed time from the recorded ticket, using each airport's date and time zone. Excludes check-in, connections and delays."
      : "按已录入票面及起降机场当地日期、时区计算的计划时长，不含值机、转机及延误。" };
}

export function routeDurationEstimate(route, language = "zh") {
  if (!route) return null;
  const original = segmentById.get(route.id);
  const transport = original?.transport ?? route.transport;
  if (transport === "flight") return flightDurationEstimate(route.flight ?? original?.flight, language);
  const reference = estimates.routes[route.id];
  const source = route.roadSource ?? original?.roadSource;
  let seconds = source?.durationSeconds ?? reference?.durationSeconds;
  if (!["road", "coach", "boat"].includes(transport) || !Number.isFinite(seconds) || seconds <= 0) return null;
  // The combined coach map line covers both directions; do not double a one-way estimate.
  const returnReference = route.returnRouteId ? estimates.routes[route.returnRouteId] : null;
  if (route.returnRouteId && !(returnReference?.durationSeconds > 0)) return null;
  if (returnReference) seconds += returnReference.durationSeconds;
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const en = language === "en";
  const roundTrip = route.roundTrip ?? original?.roundTrip;
  const qualifier = transport === "boat" ? (en ? "Return sailing, about " : "往返船程约")
    : transport === "coach" ? (returnReference ? (en ? "Return road ref., about " : "往返路网约")
      : (en ? "One-way road ref., about " : "单程路网约"))
      : route.hotelEndpoints ? (roundTrip ? (en ? "Return ref., about " : "往返参考约") : (en ? "Reference, about " : "参考约"))
        : roundTrip ? (en ? "Return, about " : "往返约") : (en ? "About " : "约");
  const scope = transport === "boat"
    ? (en ? "TSS Earnslaw: about 45 minutes each way; excludes the barbecue, farm visit and waiting."
      : "TSS Earnslaw 每程约45分钟；往返船程不含烧烤、农场游览及等待。")
    : transport === "coach" ? (en ? "Car-road reference, not the coach operator's timetable."
      : "汽车路网参考，非大巴运营时刻。")
      : reference?.scope === "city-airport-road" ? (en ? "City/airport public road endpoints, not exact hotel or terminal entrances."
        : "城市与机场公共道路参考点，非酒店或航站楼精确入口。")
        : route.hotelEndpoints ? (en ? "Town road snapshot estimate; hotel connection changes are not included."
          : "城市起终点道路快照的预估耗时，未计酒店连接调整。")
          : roundTrip ? (en ? "Return driving time from the road snapshot." : "道路快照的往返驾驶预估耗时。")
            : (en ? "Driving time from the road snapshot." : "道路快照的驾驶预估耗时。");
  const sources = [source ? { source: "OSRM / FOSSGIS", sourceUrl: source.requestUrl,
    reviewedAt: source.retrievedAt?.slice(0, 10) } : reference, returnReference].filter(Boolean);
  const provenance = sources.filter(item => item.source && item.reviewedAt)
    .map(item => `${item.source} · ${item.reviewedAt}`).join("; ");
  return { label: qualifier + durationText(totalMinutes, en), totalMinutes, sources,
    title: scope + (transport === "boat" ? "" : en ? " Excludes stops, live traffic and road closures."
      : "不含停留、实时路况及封路影响。") + (provenance ? ` ${provenance}` : "") };
}

export function eventTravelDurations(event, routes, language = "zh", selectedRouteId = null) {
  const ids = [...new Set(event?.segmentIds ?? [])];
  return ids.filter(id => !selectedRouteId || !ids.includes(selectedRouteId) || id === selectedRouteId).map(id => {
    const original = segmentById.get(id);
    if (!original) return null;
    // Event rows describe a single segment, unlike the combined coach map route.
    const resolved = routes.find(route => route.id === id);
    const route = resolved ? { ...resolved, returnRouteId: null } : original;
    return { id, label: routeText(original.label, language), transport: original.transport,
      duration: routeDurationEstimate(route, language) };
  }).filter(Boolean);
}
