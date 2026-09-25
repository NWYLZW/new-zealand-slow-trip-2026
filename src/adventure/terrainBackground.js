import { contours, curveBasisClosed, line } from "d3";
import dem from "./data/elevation.json";
import { terrainPointToGeo } from "./terrain";

// Match terrain.js's broad elevation field so the colors follow the same regions.
function smoothField(values) {
  return values.map((_, index) => {
    const x = index % dem.width, y = Math.floor(index / dem.width);
    let total = 0, count = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < dem.width && ny >= 0 && ny < dem.height) {
        total += values[ny * dem.width + nx]; count++;
      }
    }
    return total / count;
  });
}

const field = smoothField(smoothField(dem.values));
const elevationBands = contours().size([dem.width, dem.height])
  .thresholds([650, 1100, 1600])(field);
// Broad, quiet color areas give the small hand-drawn vegetation a ground to
// belong to. The elevation geometry remains data-driven, but its edges are no
// longer blurred into a continuous green-to-white wash.
const elevationColors = ["#dfe4b9", "#f0ead2", "#faf7ed"];

// Fill only: tree and grass silhouettes belong to the separate image layer.
export function drawTerrainBackground(ground, project) {
  const layer = ground.append("g").attr("class", "trip-terrain-background")
    .attr("aria-hidden", "true").attr("pointer-events", "none");
  const { width, height } = ground.node().ownerSVGElement.viewBox.baseVal;
  layer.append("rect").attr("width", width).attr("height", height).attr("fill", "#d0dba9");
  const bandShape = line().curve(curveBasisClosed);
  elevationBands.forEach((band, index) => {
    const path = band.coordinates.map((polygon) => polygon.map((ring) =>
      bandShape(ring.map((point) => project(terrainPointToGeo(point)))),
    ).join("")).join("");
    layer.append("path").attr("d", path).attr("class", "trip-elevation-band")
      .attr("fill", elevationColors[index]).attr("fill-rule", "evenodd");
  });
}
