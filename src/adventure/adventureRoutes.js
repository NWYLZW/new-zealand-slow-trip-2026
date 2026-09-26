import { routeSegments } from "../data/mapRoutes";
import { adventureStops } from "./adventureData";
import { line } from "d3";
import roadRoutes from "./data/road-routes.json";

const stops = new Map(adventureStops.map((stop) => [stop.tag, stop]));
const displayTag = (tag) => tag === "AKL" ? "AKC" : tag;
const seen = new Set();

// Connect the displayed city stops, using the original itinerary order and
// named waypoints. Road shapes come from the stored routing snapshot; flights are
// city-to-city schematic arcs, not actual flight tracks.
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
  // Legacy intermediate coordinates also shape the schematic map. Only named
  // itinerary stops constrain routing: Arrowtown and Tekapo, not off-road bends.
  const routingWaypoints = waypoints.filter((point, index) =>
    (segment.id === "zqn-wanaka" && index === 0) || via.some((tag) => {
      const [lat, lng] = stops.get(tag).position;
      return Math.abs(point.lat - lat) < 0.0001 && Math.abs(point.lng - lng) < 0.0001;
    }),
  );
  return [{
    id: segment.id, from, to, via, transport, date: segment.date,
    label: transport === "coach" ? "奥克兰 ⇄ 霍比屯 · 大巴" : segment.label,
    points: [stops.get(from).position, ...waypoints.map(({ lat, lng }) => [lat, lng]), stops.get(to).position],
    routingPoints: [stops.get(from).position, ...routingWaypoints.map(({ lat, lng }) => [lat, lng]), stops.get(to).position],
    roadGeometry: roadRoutes.routes[segment.id]?.geometry ?? null,
    roadSource: roadRoutes.routes[segment.id] ?? null,
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

  // Preserve every routing vertex and snapped endpoint, without spline shortcuts.
  if (route.roadGeometry) return line()(route.roadGeometry.coordinates.map(project));
  return line()(route.routingPoints.map(([lat, lng]) => project([lng, lat])));
}

export function routeGeometryLabel(route) {
  if (route.transport === "flight") return "航线示意";
  if (!route.roadGeometry) return "道路数据未加载 · 站点示意";
  return route.transport === "coach" ? "公路参考路径 · 非运营商轨迹" : "实际道路参考路径";
}

export function routeDirectionsUrl(route) {
  const points = route.routingPoints.map(point => point.join(","));
  const url = new URL("https://www.google.com/maps/dir/");
  url.search = new URLSearchParams({ api: "1", origin: points[0], destination: points.at(-1), travelmode: "driving",
    ...(points.length > 2 ? { waypoints: points.slice(1, -1).join("|") } : {}),
  }).toString();
  return url.href;
}
