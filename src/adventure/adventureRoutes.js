import { routeSegments } from "../data/mapRoutes";
import { adventureStops } from "./adventureData";

const stops = new Map(adventureStops.map((stop) => [stop.tag, stop]));
const displayTag = (tag) => tag === "AKL" ? "AKC" : tag;
const seen = new Set();

// Connect the displayed city stops, using the original itinerary order and
// waypoints. Airport transfers share a city dot; these are schematic links,
// not turn-by-turn road geometry or actual flight tracks.
export const adventureRoutes = routeSegments.flatMap((segment) => {
  const from = displayTag(segment.from), to = displayTag(segment.to);
  if (from === to || !stops.has(from) || !stops.has(to)) return [];
  const transport = segment.id.includes("coach") ? "coach" : segment.transport;
  const key = [transport, ...[from, to].sort()].join(":");
  if (seen.has(key)) return [];
  seen.add(key);
  const waypoints = segment.waypoints ?? [];
  const via = adventureStops.filter((stop) => waypoints.some((point) =>
    Math.abs(point.lat - stop.position[0]) < 0.0001 && Math.abs(point.lng - stop.position[1]) < 0.0001,
  )).map((stop) => stop.tag);
  return [{
    id: segment.id, from, to, via, transport, date: segment.date,
    label: transport === "coach" ? "奥克兰 ⇄ 霍比屯 · 大巴" : segment.label,
    points: [stops.get(from).position, ...waypoints.map(({ lat, lng }) => [lat, lng]), stops.get(to).position],
  }];
});

export function projectedRoutePath(route, project) {
  const points = route.points.map(([lat, lng]) => project([lng, lat]));
  if (points.length < 2) return "";
  const pen = ([x, y]) => `${x},${y}`;
  if (route.transport === "flight") {
    const [from, to] = [points[0], points.at(-1)];
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const control = [(from[0] + to[0]) / 2 - dy * 0.22, (from[1] + to[1]) / 2 + dx * 0.22];
    return `M${pen(from)}Q${pen(control)} ${pen(to)}`;
  }

  // Project the original stops and waypoints first. Small fixed bends between
  // them soften the pen line without moving any itinerary point or changing
  // the shape on hover, pan, or zoom.
  const bend = [...route.id].reduce((seed, character) => seed + character.charCodeAt(0), 0) % 2 ? 1 : -1;
  const ink = [points[0]];
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index], to = points[index + 1];
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    if (length > 14) {
      const offset = Math.min(4.5, length * 0.065) * bend * (index % 2 ? -1 : 1);
      ink.push([(from[0] + to[0]) / 2 - dy / length * offset,
        (from[1] + to[1]) / 2 + dx / length * offset]);
    }
    ink.push(to);
  }
  return ink.slice(0, -1).map((from, index) => {
    const to = ink[index + 1];
    const previous = ink[Math.max(0, index - 1)];
    const next = ink[Math.min(ink.length - 1, index + 2)];
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const fromDirection = [to[0] - previous[0], to[1] - previous[1]];
    const toDirection = [next[0] - from[0], next[1] - from[1]];
    const fromLength = Math.hypot(...fromDirection) || 1;
    const toLength = Math.hypot(...toDirection) || 1;
    const reach = length * 0.23;
    const first = [from[0] + fromDirection[0] / fromLength * reach,
      from[1] + fromDirection[1] / fromLength * reach];
    const second = [to[0] - toDirection[0] / toLength * reach,
      to[1] - toDirection[1] / toLength * reach];
    return `${index ? "" : `M${pen(from)}`}C${pen(first)} ${pen(second)} ${pen(to)}`;
  }).join("");
}
