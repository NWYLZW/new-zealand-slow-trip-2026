import bathymetry from "./data/bathymetry.json";
import "./bathymetry.css";

// Natural Earth supplies nested, deeper-than polygons. bathymetry.css sets the
// shallow-water background; later polygons paint deeper water.
function polygonPath(polygons, project) {
  return polygons.map((polygon) => polygon.map((ring) =>
    `M${ring.map((point) => project(point).map((value) => value.toFixed(2)).join(",")).join("L")}Z`,
  ).join("")).join("");
}

// D3's Mercator callback wraps longitudes after 180°. Keep the source's
// antimeridian-unwrapped 180–204°E geometry continuous beside New Zealand.
function unwrappedProject(project, [longitude, latitude]) {
  if (longitude < 180) return project([longitude, latitude]);
  const at178 = project([178, latitude]);
  const at179 = project([179, latitude]);
  return at179.map((value, index) => value + (longitude - 179) * (value - at178[index]));
}

function addEdgeFade(defs, host, project, id, outerA, outerB, inner) {
  const [ax, ay] = project(outerA), [bx, by] = project(outerB);
  const outer = [(ax + bx) / 2, (ay + by) / 2];
  const inside = project(inner);
  const tangent = [bx - ax, by - ay];
  let normal = [-tangent[1], tangent[0]];
  const length = Math.hypot(...normal) || 1;
  normal = normal.map((value) => value / length);
  const direction = (inside[0] - outer[0]) * normal[0] + (inside[1] - outer[1]) * normal[1];
  if (direction < 0) normal = normal.map((value) => -value);
  const distance = Math.abs(direction);
  const gradient = `${id}-gradient`, mask = `${id}-mask`;
  defs.append("linearGradient")
    .attr("id", gradient).attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", outer[0]).attr("y1", outer[1])
    .attr("x2", outer[0] + normal[0] * distance)
    .attr("y2", outer[1] + normal[1] * distance)
    .selectAll("stop")
    .data([["0%", "#000"], ["100%", "#fff"]])
    .enter().append("stop")
    .attr("offset", ([offset]) => offset)
    .attr("stop-color", ([, color]) => color);
  defs.append("mask")
    .attr("id", mask).attr("maskUnits", "userSpaceOnUse")
    .attr("maskContentUnits", "userSpaceOnUse")
    .attr("mask-type", "luminance")
    .attr("x", -10000).attr("y", -10000)
    .attr("width", 20000).attr("height", 20000)
    .append("rect")
    .attr("x", -10000).attr("y", -10000)
    .attr("width", 20000).attr("height", 20000)
    .attr("fill", `url(#${gradient})`);
  return host.append("g").attr("mask", `url(#${mask})`);
}

// Call immediately after creating trip-world, before sea labels, coast, terrain,
// routes and landmarks. It shares the world's pan/zoom transform and needs no
// separate zoom handler. Coordinates use [longitude, latitude].
export function drawBathymetry(world, project) {
  const layer = world.append("g")
    .attr("class", "trip-bathymetry")
    .attr("aria-hidden", "true")
    .attr("pointer-events", "none");
  const projected = (point) => unwrappedProject(project, point);
  const defs = layer.append("defs");
  let colored = layer;
  const fade = 5;
  const [west, south, east, north] = bathymetry.bounds;
  colored = addEdgeFade(defs, colored, projected, "adventure-bathy-west",
    [west, south], [west, north], [west + fade, (south + north) / 2]);
  colored = addEdgeFade(defs, colored, projected, "adventure-bathy-east",
    [east, south], [east, north], [east - fade, (south + north) / 2]);
  colored = addEdgeFade(defs, colored, projected, "adventure-bathy-south",
    [west, south], [east, south], [(west + east) / 2, south + fade]);
  colored = addEdgeFade(defs, colored, projected, "adventure-bathy-north",
    [west, north], [east, north], [(west + east) / 2, north - fade]);

  for (const threshold of bathymetry.thresholds) {
    colored.append("path")
      .attr("class", `trip-bathymetry-band trip-bathymetry-band--${threshold.minDepthM}`)
      .attr("data-min-depth-m", threshold.minDepthM)
      .attr("d", polygonPath(threshold.polygons, projected))
      .attr("fill-rule", "evenodd");
  }
  return layer;
}
