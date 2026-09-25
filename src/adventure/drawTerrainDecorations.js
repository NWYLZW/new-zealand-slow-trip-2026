import { geoContains } from "d3";
import coast from "./data/coastline.json";
import elevation from "./data/elevation.json";
import terrainData from "./data/terrainDecorations.json";
import { terrainDecorationAssets } from "./terrainDecorationAssets";
import { adventureStops } from "./adventureData";
import { adventureRoutes } from "./adventureRoutes";
import { landmarkAssets } from "./landmarkAssets";
import { MAP_ART_SCALE } from "./artScale";

const assets = new Map(terrainDecorationAssets.map((asset) => [asset.id, asset]));

function seededRandom(seed) {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function segmentDistance([x, y], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

function elevationAt([longitude, latitude]) {
  const worldSize = 256 * 2 ** elevation.zoom;
  const x = Math.round(((longitude + 180) / 360 * worldSize - elevation.x) / elevation.step);
  const radians = latitude * Math.PI / 180;
  const mercatorY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * worldSize;
  const y = Math.round((mercatorY - elevation.y) / elevation.step);
  if (x < 0 || x >= elevation.width || y < 0 || y >= elevation.height) return 0;
  return elevation.values[y * elevation.width + x] ?? 0;
}

function candidatesFor(patch, altitude) {
  if (altitude >= 1100 || patch.style === "alpine") return ["tussock", "sedge"];
  if (altitude >= 800) return ["tussock", "toetoe", "sedge"];
  if (patch.style === "grass") {
    return ["tussock", "tussock", "toetoe", "sedge", "harakeke", "cabbage-tree"];
  }
  if (patch.style === "scrub") {
    return patch.id === "nelson-scrub"
      ? ["manuka", "manuka", "cabbage-tree", "harakeke", "sedge", "toetoe", "wind-tree"]
      : ["manuka", "manuka", "cabbage-tree", "harakeke", "sedge", "toetoe"];
  }
  const south = patch.position[1] < -41;
  if (south) {
    const west = /westland|fiordland|southland/.test(patch.id);
    return west
      ? ["southern-beech", "southern-beech", "rimu", "totara", "rata", "manuka", "tussock"]
      : ["southern-beech", "rimu", "totara", "manuka", "cabbage-tree", "tussock"];
  }
  const coastal = /northland|eastern-north/.test(patch.id);
  return coastal
    ? ["totara", "kahikatea", "pohutukawa", "pohutukawa", "manuka", "cabbage-tree", "wind-tree", "harakeke"]
    : ["totara", "kahikatea", "manuka", "manuka", "cabbage-tree", "harakeke"];
}

function overlapsRect(x, y, width, height, rect, margin) {
  return x + width / 2 + margin > rect.left && x - width / 2 - margin < rect.right
    && y + height * 0.12 + margin > rect.top && y - height * 0.88 - margin < rect.bottom;
}

// Terrain images sit above the coast and below route hits, landmark art and stop
// controls. No SVG plant paths or large scenic cutouts are rendered here.
export function drawTerrainDecorations(world, project, scale) {
  const layer = world.append("g")
    .attr("class", "trip-terrain-decorations")
    .attr("aria-hidden", "true")
    .attr("pointer-events", "none")
    .attr("clip-path", "url(#adventure-coast-clip)");
  const stopPoints = adventureStops.map((stop) => project([stop.position[1], stop.position[0]]));
  const waterZones = terrainData.waterAvoidance.map((zone) => ({ point: project(zone.position), radius: zone.worldRadius * scale }));
  const roadSegments = adventureRoutes.filter((route) => route.transport !== "flight").flatMap((route) =>
    route.points.slice(1).map((point, index) => [
      project([route.points[index][1], route.points[index][0]]),
      project([point[1], point[0]]),
    ]),
  );
  const landmarkRects = landmarkAssets.flatMap((asset) => {
    const stop = adventureStops.find((item) => item.tag === asset.stopTag);
    if (!stop) return [];
    const [x, y] = project([stop.position[1], stop.position[0]]);
    const width = asset.worldWidth * scale * MAP_ART_SCALE;
    const height = width * asset.pixelHeight / asset.pixelWidth;
    return [{ left: x - width * asset.anchor[0], right: x + width * (1 - asset.anchor[0]),
      top: y - height * asset.anchor[1], bottom: y + height * (1 - asset.anchor[1]) }];
  });
  const accepted = [];
  const marks = [];
  // The original bitmaps also supply the small canopy marks within each forest.
  // Keep trees as images at every scale; the background region is only a color area.
  for (const patch of terrainData.texturePatches) {
    if (patch.style !== "forest") continue;
    const random = seededRandom(`forest-understory:${patch.id}`);
    const understory = [];
    for (let index = 0; index < patch.count * 1.2; index++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.7) * 0.78;
      const position = [
        patch.position[0] + Math.cos(angle) * patch.radius[0] * radius,
        patch.position[1] + Math.sin(angle) * patch.radius[1] * radius,
      ];
      if (!geoContains(coast, position)) continue;
      const altitude = elevationAt(position);
      if (altitude >= 800) continue;
      const options = candidatesFor(patch, altitude).filter((id) => assets.get(id)?.group === "tree");
      const asset = assets.get(options[Math.floor(random() * options.length)]);
      if (!asset) continue;
      const [x, y] = project(position);
      const width = terrainData.distribution.treeWorldWidth * scale * (0.38 + random() * 0.12);
      const height = width * asset.pixelHeight / asset.pixelWidth;
      const collisionRadius = Math.max(width, height) * 0.5;
      if (stopPoints.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < Math.max(24 * scale, 14) + collisionRadius)) continue;
      if (waterZones.some(({ point: [wx, wy], radius: waterRadius }) => Math.hypot(x - wx, y - wy) < waterRadius + collisionRadius)) continue;
      if (roadSegments.some(([a, b]) => segmentDistance([x, y], a, b) < Math.max(9 * scale, 8) + collisionRadius)) continue;
      if (landmarkRects.some((rect) => overlapsRect(x, y, width, height, rect, 5 * scale))) continue;
      if (understory.some((item) => Math.hypot(x - item.x, y - item.y) < (collisionRadius + item.radius) * 0.78)) continue;
      understory.push({ x, y, radius: collisionRadius });
      const image = layer.append("image")
        .attr("class", "trip-terrain-bitmap trip-terrain-bitmap--understory")
        .attr("data-sprite", asset.id)
        .attr("data-patch", patch.id)
        .attr("href", asset.src)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("pointer-events", "none");
      marks.push({ image, x, y, width, height });
    }
  }
  for (const patch of terrainData.texturePatches) {
    const random = seededRandom(`${terrainData.distribution.seed}:${patch.id}`);
    for (let i = 0; i < patch.count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = patch.style === "forest" ? Math.pow(random(), 0.8) : Math.sqrt(random());
      const position = [
        patch.position[0] + Math.cos(angle) * radius * patch.radius[0],
        patch.position[1] + Math.sin(angle) * radius * patch.radius[1],
      ];
      const variation = random();
      const variantRoll = random();
      if (!geoContains(coast, position)) continue;
      const altitude = elevationAt(position);
      const options = candidatesFor(patch, altitude);
      const asset = assets.get(options[Math.floor(variantRoll * options.length)]);
      if (!asset) throw new Error(`Unknown vegetation bitmap in ${patch.id}`);
      if (asset.group === "tree" && altitude >= 800) continue;
      const [x, y] = project(position);
      const width = (asset.group === "tree" ? terrainData.distribution.treeWorldWidth : terrainData.distribution.grassWorldWidth)
        * scale * (0.86 + variation * 0.28);
      const height = width * asset.pixelHeight / asset.pixelWidth;
      const collisionRadius = Math.max(width, height) * 0.5;
      // Stop controls keep a fixed screen hit box, even on narrow layouts.
      if (stopPoints.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < Math.max(24 * scale, 14) + collisionRadius)) continue;
      if (waterZones.some(({ point: [wx, wy], radius: waterRadius }) => Math.hypot(x - wx, y - wy) < waterRadius + collisionRadius)) continue;
      if (roadSegments.some(([a, b]) => segmentDistance([x, y], a, b) < Math.max(9 * scale, 8) + collisionRadius)) continue;
      if (landmarkRects.some((rect) => overlapsRect(x, y, width, height, rect, 5 * scale))) continue;
      const spacing = patch.style === "forest" ? 0.82 : 1;
      if (accepted.some((item) => Math.hypot(x - item.x, y - item.y)
        < (collisionRadius + item.radius) * spacing + 1.2 * scale)) continue;
      accepted.push({ x, y, radius: collisionRadius });
      const image = layer.append("image")
        .attr("class", `trip-terrain-bitmap trip-terrain-bitmap--${asset.group}`)
        .attr("data-sprite", asset.id)
        .attr("data-patch", patch.id)
        .attr("href", asset.src)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("pointer-events", "none");
      marks.push({ image, x, y, width, height });
    }
  }
  const area = world.node().closest(".trip-map-area");
  const updateSizes = () => {
    if (!layer.node().isConnected) {
      observer.disconnect();
      return;
    }
    const zoom = Number(area?.dataset.zoom) || 2.16;
    const factor = Math.min(1, terrainData.distribution.capZoom / zoom);
    for (const mark of marks) {
      const width = mark.width * factor;
      const height = mark.height * factor;
      mark.image.attr("x", mark.x - width / 2).attr("y", mark.y - height * 0.88)
        .attr("width", width).attr("height", height);
    }
  };
  const observer = new MutationObserver(updateSizes);
  if (area) observer.observe(area, { attributes: true, attributeFilter: ["data-zoom"] });
  updateSizes();
}
