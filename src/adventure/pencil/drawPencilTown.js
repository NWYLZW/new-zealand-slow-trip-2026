import { geoPath, geoTransform } from "d3";
import geography from "../data/pencil-geography.json";
import landCover from "../data/pencil-land-cover.json";
import { clipPolyline, coverTexture, hatch, stroke } from "./brush";
import { drawPencilWaterFeature } from "./drawPencilWater";
import { mapLabel } from "./mapLabels";
import { pencilPalette as p } from "./palette";
import { waterFeatures } from "./waterFeatures";

const BATCH_BUDGET_MS = 5;
const TOWN_TILE_SIZE = 144;
const TOWN_CACHE_OVERSCAN = .4;

export function townRenderRegion(width, height, overscan = TOWN_CACHE_OVERSCAN) {
  const paddingX = Math.round(width * overscan), paddingY = Math.round(height * overscan);
  return { left: -paddingX, top: -paddingY,
    width: width + paddingX * 2, height: height + paddingY * 2 };
}

function pointBetweenViews(point, fromView, toView) {
  const scale = toView.k / fromView.k;
  return [toView.x + (point[0] - fromView.x) * scale,
    toView.y + (point[1] - fromView.y) * scale];
}

function entryContainsScreenRect(entry, sourceView, left, top, width, height, tolerance = 1) {
  if (!entry?.layer || !entry.view || !sourceView || !width || !height) return false;
  const corners = [[left, top], [left + width, top + height]]
    .map(point => pointBetweenViews(point, sourceView, entry.view))
    .map(point => [point[0] - entry.left, point[1] - entry.top]);
  return corners[0][0] >= -tolerance && corners[0][1] >= -tolerance &&
    corners[1][0] <= entry.width + tolerance && corners[1][1] <= entry.height + tolerance;
}

export function townEntryContainsView(entry, view, width, height) {
  return entryContainsScreenRect(entry, view, 0, 0, width, height);
}

export function townEntryContainsEntry(outer, inner) {
  return entryContainsScreenRect(outer, inner.view, inner.left, inner.top, inner.width, inner.height);
}

export function townEntryMatchesView(entry, view, width, height, scaleTolerance = .08) {
  const ratio = entry?.view?.k ? view.k / entry.view.k : 0;
  return Math.abs(ratio - 1) <= scaleTolerance && townEntryContainsView(entry, view, width, height);
}

export function townTileCounts(width, height, readyTiles = 0) {
  const totalTiles = Math.ceil(width / TOWN_TILE_SIZE) * Math.ceil(height / TOWN_TILE_SIZE);
  const ready = Math.max(0, Math.min(totalTiles, readyTiles));
  return { totalTiles, readyTiles: ready, missingTiles: totalTiles - ready };
}

function surface(width, height) {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * ratio));
  canvas.height = Math.max(1, Math.ceil(height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio); ctx.lineJoin = "round"; ctx.lineCap = "round";
  return { canvas, ctx, ratio };
}

function pathFor(project, ctx) {
  return geoPath(geoTransform({ point(lon, lat) { this.stream.point(...project([lon, lat])); } }), ctx);
}

function fillFeature(ctx, path, feature, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); path(feature); ctx.fillStyle = color; ctx.fill("evenodd"); ctx.restore();
}

function lineSeed(id) {
  return [...String(id)].reduce((seed, letter) => Math.imul(seed ^ letter.charCodeAt(0), 16777619), 2166136261) >>> 0;
}

function polygonFeature(coordinates) {
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coordinates] } };
}

function roadStyle(kind) {
  if (["motorway", "trunk", "primary"].includes(kind)) return { width: 1.65, color: p.accent };
  if (["secondary", "tertiary"].includes(kind)) return { width: 1.25, color: p.cropInk };
  if (["footway", "path", "track", "cycleway"].includes(kind)) return { width: .48, color: p.forestInk };
  return { width: .78, color: p.coast };
}

function intersects(bounds, viewport, padding = 0) {
  return bounds[0][0] < viewport[1][0] + padding && bounds[1][0] > viewport[0][0] - padding &&
    bounds[0][1] < viewport[1][1] + padding && bounds[1][1] > viewport[0][1] - padding;
}

function coordinateBounds(feature) {
  if (feature._bounds) return feature._bounds;
  const coordinates = feature.rings?.flat() ?? feature.coordinates ?? [];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const point of coordinates) {
    if (!Array.isArray(point) || point.length < 2) continue;
    minLng = Math.min(minLng, point[0]); minLat = Math.min(minLat, point[1]);
    maxLng = Math.max(maxLng, point[0]); maxLat = Math.max(maxLat, point[1]);
  }
  feature._bounds = [minLng, minLat, maxLng, maxLat];
  return feature._bounds;
}

function visibleVector(feature, project, viewport, padding = 0) {
  const [minLng, minLat, maxLng, maxLat] = coordinateBounds(feature);
  if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) return false;
  const corners = [[minLng, minLat], [minLng, maxLat], [maxLng, minLat], [maxLng, maxLat]].map(project);
  const bounds = [[Math.min(...corners.map(point => point[0])), Math.min(...corners.map(point => point[1]))],
    [Math.max(...corners.map(point => point[0])), Math.max(...corners.map(point => point[1]))]];
  return intersects(bounds, viewport, padding);
}

export function prepareTownMapData(data) {
  if (!data || data._prepared) return data;
  for (const collection of [data.roads, data.buildings, data.water]) {
    for (const feature of collection ?? []) coordinateBounds(feature);
  }
  Object.defineProperty(data, "_prepared", { value: true });
  return data;
}

function drawLand(ctx, path) {
  fillFeature(ctx, path, geography.land, p.paper);
  fillFeature(ctx, path, geography.land, p.land, .72);
}

function drawLandHatch(ctx, path, viewport) {
  ctx.save(); ctx.beginPath(); path(geography.land); ctx.clip("evenodd");
  hatch(ctx, path.bounds(geography.land), p.green, 271, 5.2, .5, { viewport, anchor: [0, 0] });
  ctx.restore();
}

function drawLandCover(ctx, path, feature, viewport) {
  const bounds = path.bounds(feature);
  if (!intersects(bounds, viewport, 12)) return;
  fillFeature(ctx, path, feature, p[feature.properties.id], .78);
  ctx.save(); ctx.beginPath(); path(feature); ctx.clip("evenodd");
  coverTexture(ctx, bounds, feature.properties.id, p, 21000 + feature.properties.code,
    { viewport, anchor: [0, 0], density: 1.15 });
  ctx.restore();
}

function drawWater(ctx, feature, project, viewport) {
  if (!visibleVector(feature, project, viewport, 12)) return;
  const rings = feature.rings ?? [feature.coordinates];
  const seed = lineSeed(feature.id);
  if (feature.closed) {
    ctx.save(); ctx.globalAlpha = .82; ctx.beginPath();
    rings.forEach(ring => ring.map(project).forEach((point, index) => index ? ctx.lineTo(...point) : ctx.moveTo(...point)));
    ctx.closePath(); ctx.fillStyle = p.lake; ctx.fill("evenodd"); ctx.restore();
  }
  rings.forEach((ring, ringIndex) => clipPolyline(ring.map(project), viewport, 10)
    .forEach((chunk, index) => stroke(ctx, chunk, p.water,
      feature.closed ? .62 : .48, seed + ringIndex * 31 + index,
      { passes: feature.kind === "coastline" ? 3 : 2, breaks: .24, amplitude: .2 })));
}

function drawBuilding(ctx, feature, project, viewport) {
  if (!visibleVector(feature, project, viewport, 3)) return;
  const points = feature.coordinates.map(project);
  if (points.length < 3) return;
  ctx.save(); ctx.globalAlpha = .34; ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(...point) : ctx.moveTo(...point));
  ctx.closePath(); ctx.fillStyle = p.urban; ctx.fill(); ctx.strokeStyle = p.urbanInk; ctx.lineWidth = .38; ctx.stroke(); ctx.restore();
}

function drawRoad(ctx, feature, project, viewport) {
  if (!visibleVector(feature, project, viewport, 12)) return;
  const style = roadStyle(feature.kind), seed = lineSeed(feature.id);
  clipPolyline(feature.coordinates.map(project), viewport, 12).forEach((chunk, index) =>
    stroke(ctx, chunk, style.color, style.width, seed + index,
      { passes: style.width > 1 ? 2 : 1, breaks: .34, amplitude: .24, detail: "fill" }));
}

function drawLabels(ctx, data, project, width, height, language) {
  const occupied = [], limit = language === "en" ? 16 : 18;
  let index = 0;
  const place = entry => {
    const [x, y] = project(entry.point);
    if (x < 8 || x > width - 8 || y < 14 || y > height - 14) return;
    const sprite = mapLabel(entry.name, entry.size, 12000 + index++ * 17, p.ink);
    const box = { left: x - sprite.width / 2, right: x + sprite.width / 2,
      top: y - sprite.height, bottom: y + 3 };
    if (occupied.some(other => box.left < other.right + 5 && box.right + 5 > other.left
      && box.top < other.bottom + 3 && box.bottom + 3 > other.top)) return;
    occupied.push(box); sprite.draw(ctx, x - sprite.advance / 2, y);
  };
  for (const label of data.labels) {
    place({ name: label.name, point: [label.position[1], label.position[0]], size: 12 });
    if (occupied.length >= limit) return;
  }
  for (const road of data.roads) {
    if (!road.name || road.coordinates.length < 2) continue;
    place({ name: road.name, point: road.coordinates[Math.floor(road.coordinates.length / 2)], size: 10 });
    if (occupied.length >= limit) return;
  }
}

export function drawTownVectorDetail(ctx, data, project, viewport, { labels = false, language = "zh" } = {}) {
  if (!data) return;
  prepareTownMapData(data);
  for (const feature of data.water) drawWater(ctx, feature, project, viewport);
  for (const feature of data.buildings) drawBuilding(ctx, feature, project, viewport);
  for (const feature of data.roads) drawRoad(ctx, feature, project, viewport);
  if (labels) drawLabels(ctx, data, project, viewport[1][0], viewport[1][1], language);
}

function paintTownTile(ctx, data, project, width, height, language, detailedWaterNames, drawLabelsAtEnd = false) {
  const viewport = [[0, 0], [width, height]], path = pathFor(project, ctx);
  ctx.fillStyle = p.lake; ctx.globalAlpha = .7; ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1;
  drawLand(ctx, path);
  drawLandHatch(ctx, path, viewport);
  landCover.features.forEach(feature => drawLandCover(ctx, path, feature, viewport));
  waterFeatures.filter(feature => !detailedWaterNames.has(feature.properties.name)).forEach(feature => {
    const bounds = path.bounds(feature);
    if (intersects(bounds, viewport, 12)) drawPencilWaterFeature(ctx, path, project, feature,
      { viewport, anchor: [0, 0], density: 1.05 });
  });
  data.water.forEach(feature => drawWater(ctx, feature, project, viewport));
  data.buildings.forEach(feature => drawBuilding(ctx, feature, project, viewport));
  data.roads.forEach(feature => drawRoad(ctx, feature, project, viewport));
  if (drawLabelsAtEnd) drawLabels(ctx, data, project, width, height, language);
}

export function createTownRenderJob({ data, project, width, height, language, onUpdate,
  left = 0, top = 0, renderWidth = width, renderHeight = height }) {
  const layer = surface(renderWidth, renderHeight);
  let cancelled = false, timer = 0, index = 0;
  prepareTownMapData(data);
  const detailedWaterNames = new Set(data.water.filter(feature => feature.closed && feature.name)
    .map(feature => feature.name));
  const tiles = [];
  for (let y = 0; y < renderHeight; y += TOWN_TILE_SIZE) for (let x = 0; x < renderWidth; x += TOWN_TILE_SIZE) {
    const tileWidth = Math.min(TOWN_TILE_SIZE, renderWidth - x);
    const tileHeight = Math.min(TOWN_TILE_SIZE, renderHeight - y);
    tiles.push({ x, y, width: tileWidth, height: tileHeight,
      distance: Math.hypot(x + tileWidth / 2 - renderWidth / 2, y + tileHeight / 2 - renderHeight / 2) });
  }
  tiles.sort((a, b) => a.distance - b.distance);
  const tasks = tiles.map(tile => () => {
    const tileLayer = surface(tile.width, tile.height);
    const tileProject = point => {
      const [x, y] = project(point);
      return [x - left - tile.x, y - top - tile.y];
    };
    paintTownTile(tileLayer.ctx, data, tileProject, tile.width, tile.height, language, detailedWaterNames);
    layer.ctx.drawImage(tileLayer.canvas, 0, 0, tileLayer.canvas.width, tileLayer.canvas.height,
      tile.x, tile.y, tile.width, tile.height);
    tileLayer.canvas.width = 0; tileLayer.canvas.height = 0;
    onUpdate(layer, false, tile);
  });
  tasks.push(() => {
    const layerProject = point => {
      const [x, y] = project(point);
      return [x - left, y - top];
    };
    drawLabels(layer.ctx, data, layerProject, renderWidth, renderHeight, language);
  });
  const work = () => {
    timer = 0;
    if (cancelled) return;
    const started = performance.now();
    while (index < tasks.length && performance.now() - started < BATCH_BUDGET_MS) tasks[index++]();
    if (index === tasks.length) onUpdate(layer, true, null);
    if (index < tasks.length) timer = setTimeout(work);
  };
  timer = setTimeout(work);
  return { cancel() { cancelled = true; clearTimeout(timer); }, layer, tileCount: tiles.length };
}

export function compositeTownCache(ctx, cache, view, width, height) {
  const entries = Array.isArray(cache) ? cache : cache ? [cache] : [];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = p.paper; ctx.fillRect(0, 0, width, height);
  for (const entry of entries) {
    const scale = view.k / entry.view.k;
    const x = view.x + (entry.left - entry.view.x) * scale;
    const y = view.y + (entry.top - entry.view.y) * scale;
    ctx.drawImage(entry.layer.canvas, x, y, entry.width * scale, entry.height * scale);
  }
}

export function drawTownMarker(ctx, point, { hotel = false, language = "zh", selected = false } = {}) {
  const seed = hotel ? 15131 : 15101, color = hotel ? p.accent : p.water;
  const radius = selected ? 8.5 : 7.2;
  ctx.save(); ctx.globalAlpha = selected ? .5 : .28; ctx.fillStyle = p.paper; ctx.beginPath();
  ctx.arc(point[0], point[1], selected ? 11 : 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const ring = Array.from({ length: 49 }, (_, index) => {
    const angle = index / 48 * Math.PI * 2, ringRadius = radius + Math.sin(angle * 5 + seed) * .3;
    return [point[0] + Math.cos(angle) * ringRadius, point[1] + Math.sin(angle) * ringRadius];
  });
  stroke(ctx, ring, color, selected ? 1.45 : 1, seed, { closed: true, passes: 3, breaks: .2, amplitude: .18 });
  const label = mapLabel(hotel ? (language === "en" ? "H" : "住") : "•", hotel ? 11 : 13, seed + 7, color);
  ctx.drawImage(label.canvas, point[0] - label.width / 2, point[1] - label.height / 2, label.width, label.height);
}
