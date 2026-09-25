import hydrography from "./data/hydrography.json";
import { drawSketchStroke } from "./sketchLines";
import "./hydrography.css";

// Keep lake names beside the itinerary illustrations at the default South
// Island view. Offsets are screen pixels, so they stay legible while zooming.
const labelOffsets = {
  "lake-wakatipu": [-45, 35],
  "lake-wanaka": [-55, -20],
};

// Coordinates and the project() callback both use [longitude, latitude].
function polygonPath(parts, project) {
  return parts.map((polygon) => polygon.map((ring) =>
    `M${ring.map((point) => project(point).map((value) => value.toFixed(2)).join(",")).join("L")}Z`,
  ).join("")).join("");
}

// Insert the water shapes after terrain and before routes. Call drawLabels()
// after landmarks, then updateZoom(transform.k) from the map's zoom handler.
export function drawHydrography(world, project) {
  const layer = world.append("g")
    .attr("class", "trip-hydrography")
    .attr("pointer-events", "none");

  for (const feature of hydrography.features) {
    const group = layer.append("g")
      .attr("class", `trip-hydro-feature trip-hydro-feature--${feature.kind}`)
      .attr("data-hydro-id", feature.id)
      .attr("role", "img")
      .attr("aria-label", feature.name);
    group.append("path")
      .attr("class", "trip-hydro-shape")
      .attr("d", polygonPath(feature.parts, project))
      .attr("fill-rule", "evenodd");
    if (feature.kind === "lake") drawSketchStroke(group,
      feature.parts.flatMap((polygon) => polygon.map((ring) => ({ points: ring.map(project), closed: true }))),
      { kind: "lake", seed: feature.id });
  }

  const labels = [];
  const drawLabels = () => {
    if (labels.length) return;
    const labelLayer = world.append("g")
      .attr("class", "trip-hydro-labels")
      .attr("pointer-events", "none");
    for (const feature of hydrography.features) {
      const [x, y] = project(feature.labelPosition);
      const label = labelLayer.append("g")
        .attr("class", `trip-hydro-label trip-hydro-label--${feature.kind}`)
        .attr("data-hydro-label", feature.id)
        .attr("aria-hidden", "true");
      if (feature.kind === "river" || labelOffsets[feature.id]) label.append("path").attr("class", "trip-hydro-leader");
      label.append("text")
        .attr("class", "trip-hydro-label-text")
        .attr("text-anchor", "middle")
        .text(feature.mapLabel);
      labels.push({ feature, label, x, y });
    }
  };

  const updateZoom = (zoom) => {
    for (const { feature, label, x, y } of labels) {
      const shown = zoom >= feature.labelMinZoom;
      label.style("display", shown ? null : "none");
      if (!shown) continue;
      const river = feature.kind === "river";
      const [dx, dy] = labelOffsets[feature.id] ?? [0, river ? -12 : 0];
      const size = (river ? 11 : 12) / zoom;
      label.select("text")
        .attr("x", x + dx / zoom)
        .attr("y", y + dy / zoom)
        .style("font-size", `${size}px`)
        .style("stroke-width", `${(river ? 2.2 : 2.5) / zoom}px`);
      if (river || labelOffsets[feature.id]) label.select("path")
        .attr("d", `M${x},${y}L${x + dx * .72 / zoom},${y + dy * .72 / zoom}`);
    }
  };
  return { drawLabels, updateZoom };
}
