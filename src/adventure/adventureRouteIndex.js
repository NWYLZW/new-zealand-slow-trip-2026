import { routeSegments } from "../data/mapRoutes";
import { adventureStops } from "./adventureData";

const stops = new Map(adventureStops.map(stop => [stop.tag, stop]));
const displayTag = tag => tag === "AKL" ? "AKC" : tag;
const seen = new Set();

function endpointPosition(segment, side, displayedTag) {
  const explicit = segment[`${side}Position`];
  if (segment.transport === "flight" && explicit) return [explicit.lat, explicit.lng];
  return stops.get(displayedTag)?.position ?? null;
}

// Navigation needs route identities and endpoints, never the road geometry snapshot.
export const adventureRouteIndex = routeSegments.flatMap(segment => {
  const from = displayTag(segment.from), to = displayTag(segment.to);
  if (from === to || !stops.has(from) || !stops.has(to)) return [];
  const transport = segment.id.includes("coach") ? "coach" : segment.transport;
  const key = [transport, ...[from, to].sort()].join(":");
  if (seen.has(key)) return [];
  seen.add(key);
  const fromPosition = endpointPosition(segment, "from", from);
  const toPosition = endpointPosition(segment, "to", to);
  if (!fromPosition || !toPosition) return [];
  const waypoints = segment.waypoints ?? [];
  const via = adventureStops.filter(stop => waypoints.some(point =>
    Math.abs(point.lat - stop.position[0]) < 0.0001 && Math.abs(point.lng - stop.position[1]) < 0.0001,
  )).map(stop => stop.tag);
  const routingWaypoints = waypoints.filter((point, index) =>
    (segment.id === "zqn-wanaka" && index === 0) || via.some(tag => {
      const [lat, lng] = stops.get(tag).position;
      return Math.abs(point.lat - lat) < 0.0001 && Math.abs(point.lng - lng) < 0.0001;
    }),
  );
  return [{
    id: segment.id, from, to, via, transport, date: segment.date,
    label: transport === "coach" ? "奥克兰 ⇄ 霍比屯 · 大巴" : segment.label,
    points: [fromPosition, ...waypoints.map(({ lat, lng }) => [lat, lng]), toPosition],
    routingPoints: [fromPosition, ...routingWaypoints.map(({ lat, lng }) => [lat, lng]), toPosition],
  }];
});
