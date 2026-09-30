import { adventureRouteIndex } from "./adventureRouteIndex";
import { line } from "d3";
import roadRoutes from "./data/road-routes.json";

export const adventureRoutes = adventureRouteIndex.map(route => ({
  ...route,
  roadGeometry: roadRoutes.routes[route.id]?.geometry ?? null,
  roadSource: roadRoutes.routes[route.id] ?? null,
}));

export function focusLocationPositions(focus) {
  return [...(focus.positions ?? []), ...(focus.routeIds ?? []).flatMap(id => {
    const route = adventureRoutes.find(item => item.id === id);
    return route?.roadGeometry?.coordinates ?? route?.points.map(([lat, lng]) => [lng, lat]) ?? [];
  })];
}

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
