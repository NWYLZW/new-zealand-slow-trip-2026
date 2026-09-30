import createGraph from "ngraph.graph";
import { aStar } from "ngraph.path";

const roadKinds = new Set(["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
  "secondary", "secondary_link", "tertiary", "tertiary_link", "residential", "living_street", "unclassified", "service"]);
const key = point => point.map(value => value.toFixed(6)).join(",");
const radians = Math.PI / 180;

function distance(a, b) {
  const x = (a[0] - b[0]) * Math.cos((a[1] + b[1]) * radians / 2);
  return Math.hypot(x, a[1] - b[1]) * radians * 6371008.8;
}

function projectOnSegment(point, from, to) {
  const cos = Math.cos(point[1] * radians);
  const dx = (to[0] - from[0]) * cos, dy = to[1] - from[1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1,
    ((point[0] - from[0]) * cos * dx + (point[1] - from[1]) * dy) / length)) : 0;
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

// Connect only the local end of the existing route, never bypass its intermediate stops.
export function connectHotelRoad(coordinates, position, town, { reverse = false } = {}) {
  if (!town?.place?.roads?.length || coordinates.length < 2) return null;
  const source = reverse ? [...coordinates].reverse() : coordinates;
  const hotel = [position[1], position[0]];
  const graph = createGraph();
  const edges = [];
  const addEdge = (from, to) => {
    const fromKey = key(from), toKey = key(to);
    graph.addNode(fromKey, from); graph.addNode(toKey, to);
    if (fromKey !== toKey && !graph.hasLink(fromKey, toKey)) graph.addLink(fromKey, toKey, distance(from, to));
  };
  for (const road of town.place.roads) {
    if (!roadKinds.has(road.kind)) continue;
    for (let i = 1; i < road.coordinates.length; i++) {
      const from = road.coordinates[i - 1], to = road.coordinates[i];
      addEdge(from, to); edges.push([from, to]);
    }
  }
  let nearest = null;
  for (const [from, to] of edges) {
    const point = projectOnSegment(hotel, from, to), gap = distance(hotel, point);
    if (!nearest || gap < nearest.gap) nearest = { point, from, to, gap };
  }
  // No invented driveway across a block or a gap outside the local snapshot.
  if (!nearest || nearest.gap > 100) return null;
  addEdge(nearest.from, nearest.point); addEdge(nearest.point, nearest.to);

  let length = 0, joinIndex = 0;
  const limit = Math.floor((source.length - 1) / 2);
  for (let i = 1; i <= limit; i++) {
    length += distance(source[i - 1], source[i]);
    if (length > 5000) break;
    addEdge(source[i - 1], source[i]); joinIndex = i;
  }
  if (!joinIndex) return null;
  const finder = aStar(graph, {
    distance: (_from, _to, link) => link.data,
    heuristic: (from, to) => distance(from.data, to.data),
  });
  const path = finder.find(key(nearest.point), key(source[joinIndex])).reverse().map(node => node.data);
  if (!path.length) return null;
  const joined = [...path, ...source.slice(joinIndex + 1)];
  return { coordinates: reverse ? joined.reverse() : joined, snapDistanceM: nearest.gap,
    source: town.source };
}

export function connectHotelRoute(route, towns) {
  if (!route.hotelEndpoints) return route;
  if (!route.roadGeometry) return { ...route, hotelRoadStatus: "partial" };
  let coordinates = route.roadGeometry.coordinates;
  const connections = {};
  for (const side of ["origin", "destination"]) {
    const endpoint = route.hotelEndpoints[side];
    if (!endpoint) continue;
    const connection = connectHotelRoad(coordinates, endpoint.position, towns.get(endpoint.cityTag),
      { reverse: side === "destination" });
    connections[side] = connection ? { status: "connected", snapDistanceM: connection.snapDistanceM,
      source: connection.source } : { status: "unavailable" };
    if (connection) coordinates = connection.coordinates;
  }
  return { ...route, roadGeometry: { ...route.roadGeometry, coordinates }, hotelConnections: connections,
    hotelRoadStatus: Object.values(connections).every(item => item.status === "connected") ? "connected" : "partial" };
}
