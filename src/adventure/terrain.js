import { contours, polygonArea } from "d3";
import dem from "./data/elevation.json";

export function terrainPointToGeo([x, y]) {
  const worldSize = 256 * 2 ** dem.zoom;
  const px = dem.x + x * dem.step, py = dem.y + y * dem.step;
  return [px / worldSize * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * py / worldSize))) * 180 / Math.PI];
}

// Generalize the source into broad, connected game-map regions.
// Every region stays on the same ground plane; no hillshade or raised terraces.
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

let cached;
export function getTerrainRegions() {
  if (cached) return cached;
  const field = smoothField(smoothField(dem.values));
  const regions = contours().size([dem.width, dem.height]).thresholds([350, 850])(field)
    .map((contour, index) => ({
      kind: index === 0 ? "upland" : "mountain",
      polygons: contour.coordinates.filter((polygon) => Math.abs(polygonArea(polygon[0])) > 20),
    }));
  const candidates = [];
  for (let y = 3; y < dem.height - 3; y += 3) {
    for (let x = 3; x < dem.width - 3; x += 3) {
      const elevation = field[y * dem.width + x];
      if (elevation > 900) candidates.push({ x, y, elevation });
    }
  }
  const mountains = [];
  candidates.sort((a, b) => b.elevation - a.elevation).forEach((point) => {
    if (mountains.length < 9 && mountains.every((other) => Math.hypot(point.x - other.x, point.y - other.y) > 11)) {
      mountains.push(point);
    }
  });
  cached = { regions, mountains };
  return cached;
}
