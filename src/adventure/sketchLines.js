import { mulberry32 } from "drawably";

// The ink never moves away from the projected coastline, lake outline or
// route curve. Pencil texture comes from short changes in width and density
// on the SAME centerline. This remains clean even at 12x map zoom.
const kinds = new Set(["coast", "lake", "route"]);

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const xy = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;

function dashPattern(seed, pairs, on, off) {
  const random = mulberry32(hashSeed(seed));
  return Array.from({ length: pairs }, () => [
    +(on[0] + random() * (on[1] - on[0])).toFixed(1),
    +(off[0] + random() * (off[1] - off[0])).toFixed(1),
  ]).flat().join(" ");
}

function partPath({ points, closed = false }) {
  if (!Array.isArray(points) || points.length < 2) return "";
  if (!points.every((point) => point?.length === 2 && point.every(Number.isFinite))) return "";
  // The source geometry already carries its intended bends. Keep every vertex
  // exactly; smoothing or jitter can cut across narrow lake arms.
  return `M${points.map(xy).join("L")}${closed ? "Z" : ""}`;
}

// Pass the original SVG d as sourcePath for curved routes. Array parts are
// appropriate for projected coast/lake rings. All four returned layers use
// precisely the same geometry; pressure/grain use seeded Drawably-style dash
// rhythms, and minute gaps in the lake/coast primary reveal a faint skeleton.
export function makeSketchPaths(parts, { kind = "route", seed, sourcePath } = {}) {
  if (!kinds.has(kind)) throw new Error(`Unknown sketch line kind: ${kind}`);
  if (seed === undefined) throw new Error("A stable sketch line seed is required");
  const d = sourcePath ?? (typeof parts === "string" ? parts : parts.map(partPath).join(""));
  return {
    skeleton: d,
    primary: d,
    pressure: d,
    grain: d,
    primaryDashes: dashPattern(`${kind}:${seed}:primary`, 8, [17, 42], [2.3, 3.2]),
    pressureDashes: dashPattern(`${kind}:${seed}:pressure`, 8, [4, 20], [8, 23]),
    grainDashes: dashPattern(`${kind}:${seed}:grain`, 8, [1, 8], [3, 12]),
    primaryOffset: hashSeed(`${kind}:${seed}:primary-offset`) % 41,
    pressureOffset: hashSeed(`${kind}:${seed}:pressure`) % 41,
    grainOffset: hashSeed(`${kind}:${seed}:grain`) % 29,
  };
}

// Kept for callers that need a sampled SVG curve elsewhere. It is NOT needed
// for the ink: pass the exact source d to drawSketchStroke instead.
export function sampleSvgPath(path, step = 4) {
  const element = typeof path === "string"
    ? document.createElementNS("http://www.w3.org/2000/svg", "path") : path;
  if (typeof path === "string") element.setAttribute("d", path);
  const length = element.getTotalLength();
  if (!Number.isFinite(length) || length <= 0) return [];
  const count = Math.max(1, Math.ceil(length / step));
  return Array.from({ length: count + 1 }, (_, index) => {
    const point = element.getPointAtLength(length * index / count);
    return [point.x, point.y];
  });
}

// parent is a D3 SVG group selection. The visual-only group belongs below
// labels and markers and before the untouched transparent route hit path.
export function drawSketchStroke(parent, parts, { kind, seed, className = "", sourcePath } = {}) {
  const paths = makeSketchPaths(parts, { kind, seed, sourcePath });
  const group = parent.append("g")
    .attr("class", `trip-sketch trip-sketch--${kind}${className ? ` ${className}` : ""}`)
    .attr("aria-hidden", "true")
    .attr("pointer-events", "none");
  for (const layer of ["skeleton", "primary", "pressure", "grain"]) {
    if (!paths[layer]) continue;
    group.append("path")
      .attr("class", `trip-sketch-${layer}`)
      .attr("d", paths[layer])
      .attr("stroke-dasharray", layer === "primary" && kind !== "route" ? paths.primaryDashes :
        layer === "pressure" ? paths.pressureDashes :
          layer === "grain" ? paths.grainDashes : null)
      .attr("stroke-dashoffset", layer === "primary" && kind !== "route" ? paths.primaryOffset :
        layer === "pressure" ? paths.pressureOffset :
          layer === "grain" ? paths.grainOffset : null);
  }
  return group;
}
