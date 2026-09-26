import { geoPath, geoTransform } from 'd3';
import geography from '../data/pencil-geography.json';
import landCover from '../data/pencil-land-cover.json';
import { random, stroke, hatch, coverTexture, mountains, clipPolyline } from './brush';
import { pencilPalette as p } from './palette';
import { mapLabel } from './mapLabels';
import { drawPencilWater } from './drawPencilWater';
import { drawTownVectorDetail, prepareTownMapData } from './drawPencilTown';
import { waterFeatures } from './waterFeatures';

const TILE_SIZE = 512;
const OVERVIEW_MAX_ZOOM = 3.5;
const REGIONAL_MAX_ZOOM = 9;
const DETAIL_DELAY_MS = 150;
const MAX_DETAIL_ENTRIES = 3;
const MAX_DETAIL_PIXELS = 9000000;
const MAX_TILE_PIXELS = 4000000;
const DETAIL_TILE_SIZE = 192;
const geographicRings = geometry => geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() :
  geometry.type === 'Polygon' || geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];

function surface(width, height, density, canvas = document.createElement('canvas')) {
  canvas.width = Math.max(1, Math.ceil(width * density));
  canvas.height = Math.max(1, Math.ceil(height * density));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.lineJoin = 'round';
  return { canvas, ctx, density };
}

function pathFor(project, ctx) {
  return geoPath(geoTransform({ point(lon, lat) { const [x, y] = project([lon, lat]); this.stream.point(x, y); } }), ctx);
}

function fill(ctx, path, feature, color) {
  ctx.beginPath(); path(feature); ctx.fillStyle = color; ctx.fill('evenodd');
}

function grainSeed(seed, column, row) {
  return (seed ^ Math.imul(column, 73856093) ^ Math.imul(row, 19349663)) >>> 0;
}

function anchoredGrain(ctx, viewport, anchor, color, seed, amount, density = 1) {
  const spacing = 2.35 / Math.sqrt(density);
  const [[left, top], [right, bottom]] = viewport;
  const firstColumn = Math.floor((left + anchor[0]) / spacing);
  const lastColumn = Math.ceil((right + anchor[0]) / spacing);
  const firstRow = Math.floor((top + anchor[1]) / spacing);
  const lastRow = Math.ceil((bottom + anchor[1]) / spacing);
  ctx.save(); ctx.fillStyle = color;
  for (let row = firstRow; row <= lastRow; row++) for (let column = firstColumn; column <= lastColumn; column++) {
    const rng = random(grainSeed(seed, column, row));
    if (rng() > .48 * density) continue;
    const x = column * spacing - anchor[0] + rng() * spacing;
    const y = row * spacing - anchor[1] + rng() * spacing;
    ctx.globalAlpha = (.02 + rng() * .13) * amount;
    ctx.fillRect(x, y, .45 + rng() * .72, .35 + rng() * .78);
  }
  ctx.restore();
}

function lodSettings(level) {
  if (level === 'local') return { textureDensity: 1.5, mountainCount: 760, mountainSpacing: 12, boundary: .46 };
  if (level === 'regional') return { textureDensity: 1.2, mountainCount: 360, mountainSpacing: 13, boundary: .38 };
  return { textureDensity: 1, mountainCount: null, mountainSpacing: 11, boundary: 0 };
}

function paintTerrain(layer, project, options = {}) {
  const c = layer.ctx, drawPath = pathFor(project, c);
  const viewport = options.viewport ?? [[0, 0], [layer.canvas.width / layer.density, layer.canvas.height / layer.density]];
  const anchor = options.anchor ?? [0, 0];
  const level = options.level ?? 'overview';
  const settings = lodSettings(level);
  const textureOptions = { viewport, anchor, density: settings.textureDensity,
    excludeNames: options.excludeWaterNames };
  fill(c, drawPath, geography.land, p.paper);
  c.globalAlpha = .72; fill(c, drawPath, geography.land, p.land); c.globalAlpha = 1;
  c.save(); c.beginPath(); drawPath(geography.land); c.clip('evenodd');
  hatch(c, drawPath.bounds(geography.land), p.green, 271, 6 / settings.textureDensity, .55, textureOptions);
  for (const feature of landCover.features) {
    const { id, code } = feature.properties;
    fill(c, drawPath, feature, p[id]);
    c.save(); c.beginPath(); drawPath(feature); c.clip('evenodd');
    coverTexture(c, drawPath.bounds(feature), id, p, 21000 + code, textureOptions); c.restore();
    if (settings.boundary) geographicRings(feature.geometry).forEach((ring, index) => {
      clipPolyline(ring.map(project), viewport, 10).forEach((chunk, chunkIndex) =>
        stroke(c, chunk, p[`${id}Ink`], settings.boundary, 31000 + code * 43 + index * 7 + chunkIndex,
          { passes: 1, breaks: .7, amplitude: .22, detail: 'fill' }));
    });
  }
  anchoredGrain(c, viewport, anchor, p.coast, 221, .5, settings.textureDensity);
  for (const region of geography.regions) {
    if (region.properties.name === 'Fiordland') continue;
    c.save(); c.beginPath(); drawPath(region); c.clip('evenodd');
    mountains(c, drawPath, project, region, p, {
      count: settings.mountainCount ?? undefined,
      attempts: level === 'local' ? 2200 : level === 'regional' ? 1200 : undefined,
      minSpacing: settings.mountainSpacing,
      viewport,
      size: level === 'overview' ? 1 : .92,
    });
    c.restore();
  }
  drawPencilWater(c, drawPath, project, textureOptions);
  c.restore();
  geographicRings(geography.land.geometry).forEach((ring, index) => {
    const chunks = level === 'overview' ? [ring.map(project)] : clipPolyline(ring.map(project), viewport, 16);
    chunks.forEach((chunk, chunkIndex) => stroke(c, chunk, p.coast, 1.25, 1307 + index * 29 + chunkIndex,
      { closed: level === 'overview', passes: 3, breaks: .45, amplitude: .7 }));
  });
}

let oceanTile;
function seaTexture() {
  if (oceanTile) return oceanTile;
  const { canvas, ctx } = surface(TILE_SIZE, TILE_SIZE, 3), rng = random(4801);
  for (let index = 0; index < 3100; index++) {
    const x = rng() * TILE_SIZE, y = rng() * TILE_SIZE, length = 9 + rng() * 49;
    const points = [[x, y], [x + length * .5, y - length * .09], [x + length, y - length * .18]];
    ctx.globalAlpha = .1 + rng() * .2;
    for (const dx of [0, -TILE_SIZE]) for (const dy of [0, TILE_SIZE]) {
      ctx.save(); ctx.translate(dx, dy);
      stroke(ctx, points, p.water, .5 + (index % 4) * .1, 8100 + index,
        { passes: 1, detail: 'fill', breaks: .78, gain: 1.15, amplitude: .35 });
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  anchoredGrain(ctx, [[0, 0], [TILE_SIZE, TILE_SIZE]], [0, 0], p.water, 811, .52);
  oceanTile = canvas;
  return canvas;
}

function detailSpec(zoom) {
  if (zoom <= OVERVIEW_MAX_ZOOM) return { level: 'overview', renderScale: 1 };
  if (zoom <= REGIONAL_MAX_ZOOM) return { level: 'regional', renderScale: 6 };
  return { level: 'local', renderScale: Math.min(256, Math.max(12, 2 ** Math.ceil(Math.log2(zoom)))) };
}

function contains(entry, bounds) {
  return bounds.left >= entry.left && bounds.top >= entry.top && bounds.right <= entry.left + entry.w && bounds.bottom <= entry.top + entry.h;
}

function intersects(entry, bounds) {
  return bounds.left < entry.left + entry.w && bounds.right > entry.left && bounds.top < entry.top + entry.h && bounds.bottom > entry.top;
}

function visibleWorld(view, viewport) {
  const [left, top] = view.invert([viewport.left, viewport.top]);
  const [right, bottom] = view.invert([viewport.right, viewport.bottom]);
  return { left, top, right, bottom };
}

export function detailRenderPlan({ visibleWidth, visibleHeight, renderScale, dpr,
  maxPixels = MAX_TILE_PIXELS, maxPaddingRatio = .42 }) {
  const visiblePixels = Math.max(1, visibleWidth * renderScale * visibleHeight * renderScale);
  const density = Math.min(dpr, Math.sqrt(maxPixels / visiblePixels));
  const maximumAreaRatio = maxPixels / Math.max(1, visiblePixels * density * density);
  const dimensionRatio = Math.min(1 + maxPaddingRatio * 2, Math.sqrt(maximumAreaRatio));
  return { density, paddingRatio: Math.max(0, (dimensionRatio - 1) / 2),
    visiblePhysicalPixels: visiblePixels * density * density };
}

export function planDetailTiles({ left, top, width, height, renderScale }, covered = null) {
  const logicalWidth = width * renderScale, logicalHeight = height * renderScale;
  const tiles = [];
  let reusedTiles = 0;
  for (let y = 0; y < logicalHeight; y += DETAIL_TILE_SIZE) for (let x = 0; x < logicalWidth; x += DETAIL_TILE_SIZE) {
    const tileWidth = Math.min(DETAIL_TILE_SIZE, logicalWidth - x);
    const tileHeight = Math.min(DETAIL_TILE_SIZE, logicalHeight - y);
    const worldTile = { left: left + x / renderScale, top: top + y / renderScale,
      right: left + (x + tileWidth) / renderScale, bottom: top + (y + tileHeight) / renderScale };
    if (covered && worldTile.left >= covered.left && worldTile.top >= covered.top &&
      worldTile.right <= covered.right && worldTile.bottom <= covered.bottom) {
      reusedTiles++;
      continue;
    }
    tiles.push({ x, y, width: tileWidth, height: tileHeight,
      distance: Math.hypot(x + tileWidth / 2 - logicalWidth / 2,
        y + tileHeight / 2 - logicalHeight / 2) });
  }
  tiles.sort((a, b) => a.distance - b.distance);
  return { tiles, reusedTiles, logicalWidth, logicalHeight };
}

export function createPencilMap(canvas, project, width, height) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  surface(width, height, dpr, canvas);
  const ctx = canvas.getContext('2d'), path = pathFor(project);
  const bounds = path.bounds(geography.land);
  const left = Math.floor(bounds[0][0]) - 20, top = Math.floor(bounds[0][1]) - 20;
  const w = Math.ceil(bounds[1][0] - left) + 20, h = Math.ceil(bounds[1][1] - top) + 20;
  const density = Math.min(dpr * 4, Math.sqrt(14000000 / (w * h)));
  const layer = surface(w, h, density);
  const buildStart = performance.now();
  paintTerrain(layer, point => { const [x, y] = project(point); return [x - left, y - top]; }, {
    viewport: [[0, 0], [w, h]], anchor: [left, top], level: 'overview',
  });
  const pattern = ctx.createPattern(seaTexture(), 'repeat');
  const origin = project([173, 0]), unit = Math.abs(project([174, 0])[0] - origin[0]) / (2600 * Math.PI / 180);
  const labels = [
    { text: '塔斯曼海', point: [165.90918, -39.07277], size: 22, seed: 771 },
    { text: '南太平洋', point: [178.29757, -43.66757], size: 22, seed: 773 },
  ].map(label => ({ ...label, position: project(label.point), sprite: mapLabel(label.text, label.size, label.seed, p.water) }));
  const stats = { terrainBuilds: 1, detailBuilds: 0, frames: 0, buildMs: performance.now() - buildStart,
    pixels: layer.canvas.width * layer.canvas.height, cachedDetails: 0, cachePixels: 0 };
  canvas.dataset.lettering = 'C';
  canvas.dataset.coverClasses = landCover.features.length + 1;
  canvas.dataset.waterRenderer = 'pressure-pencil';
  canvas.dataset.detailTiers = 'overview regional local';
  canvas._waterFeatures = waterFeatures.map(feature => feature.properties);
  const details = [];
  const townData = new Map();
  let pending = null, generation = 0, activeDetail = null, visibleTownTags = [];
  let viewport = { left: 0, top: 0, right: width, bottom: height };

  const cancelPending = () => {
    generation++;
    if (!pending) return;
    clearTimeout(pending);
    pending = null;
  };
  const schedule = (callback, delay = 0) => { pending = setTimeout(callback, delay); };
  const blit = (image, view) => {
    const [x, y] = view.apply([image.left, image.top]), sw = image.w * view.k, sh = image.h * view.k;
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(width, x + sw), y1 = Math.min(height, y + sh);
    if (x1 > x0 && y1 > y0) ctx.drawImage(image.canvas, (x0 - x) / sw * image.canvas.width,
      (y0 - y) / sh * image.canvas.height, (x1 - x0) / sw * image.canvas.width,
      (y1 - y0) / sh * image.canvas.height, x0, y0, x1 - x0, y1 - y0);
  };
  const chooseDetail = view => {
    const spec = detailSpec(view.k), visible = visibleWorld(view, viewport);
    if (spec.level === 'overview') return null;
    const candidates = details.filter(entry => intersects(entry, visible) &&
      Math.abs(Math.log2(entry.renderScale / spec.renderScale)) <= 1);
    const townSignature = visibleTownTags.join('|');
    const exact = candidates.find(entry => entry.level === spec.level && entry.renderScale === spec.renderScale &&
      entry.townSignature === townSignature && contains(entry, visible));
    const chosen = exact ?? candidates.sort((a, b) => Number(b.townSignature === townSignature) -
      Number(a.townSignature === townSignature) || Number(b.complete) - Number(a.complete) || b.usedAt - a.usedAt)[0] ?? null;
    if (chosen) chosen.usedAt = performance.now();
    return chosen;
  };
  const draw = (view, { cancelWork = true } = {}) => {
    if (cancelWork) cancelPending();
    const start = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const [ox, oy] = view.apply(origin), seaScale = unit * view.k / 3;
    pattern.setTransform(new DOMMatrix([seaScale, 0, 0, seaScale, ox, oy]));
    ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height);
    blit({ ...layer, left, top, w, h }, view);
    activeDetail = chooseDetail(view);
    if (activeDetail) blit(activeDetail, view);
    for (const { position, sprite } of labels) {
      const [lx, ly] = view.apply(position);
      if (lx > sprite.width / 2 + 12 && lx < width - sprite.width / 2 - 12 && ly > 80 && ly < height - 80) {
        sprite.draw(ctx, lx - sprite.advance / 2, ly);
      }
    }
    stats.frames++;
    stats.frameMs = performance.now() - start;
    stats.lod = detailSpec(view.k).level;
    stats.detailScale = activeDetail?.renderScale ?? 1;
    stats.cachedDetails = details.length;
    stats.cachePixels = details.reduce((sum, entry) => sum + entry.pixels, 0);
    stats.pending = Boolean(pending);
    canvas._pencilStats = { ...stats };
    canvas._mapView = { x: view.x, y: view.y, k: view.k };
  };
  const prune = () => {
    details.sort((a, b) => b.usedAt - a.usedAt);
    let pixels = details.reduce((sum, entry) => sum + entry.pixels, 0);
    while (details.length > MAX_DETAIL_ENTRIES || pixels > MAX_DETAIL_PIXELS) {
      const removed = details.pop();
      pixels -= removed.pixels;
      if (removed === activeDetail) activeDetail = null;
      removed.canvas.width = 0; removed.canvas.height = 0;
    }
  };
  const invalidateLocalDetails = () => {
    cancelPending();
    stats.townDetailInvalidations = (stats.townDetailInvalidations ?? 0) + 1;
  };
  const refine = view => {
    cancelPending();
    const spec = detailSpec(view.k);
    if (spec.level === 'overview') return;
    const visible = visibleWorld(view, viewport);
    const townSignature = visibleTownTags.join('|');
    const cached = details.find(entry => entry.complete && entry.level === spec.level &&
      entry.renderScale === spec.renderScale && entry.townSignature === townSignature && contains(entry, visible));
    if (cached) { cached.usedAt = performance.now(); return; }
    for (let index = details.length - 1; index >= 0; index--) {
      const entry = details[index];
      if (entry.complete || entry.level !== spec.level || entry.renderScale !== spec.renderScale ||
        entry.townSignature !== townSignature) continue;
      entry.canvas.width = 0; entry.canvas.height = 0; details.splice(index, 1);
    }
    const token = generation;
    stats.pending = true; canvas._pencilStats = { ...stats };
    const viewportWidth = visible.right - visible.left, viewportHeight = visible.bottom - visible.top;
    const renderPlan = detailRenderPlan({ visibleWidth: viewportWidth, visibleHeight: viewportHeight,
      renderScale: spec.renderScale, dpr });
    const dx = Math.max(left, visible.left - viewportWidth * renderPlan.paddingRatio);
    const dy = Math.max(top, visible.top - viewportHeight * renderPlan.paddingRatio);
    const right = Math.min(left + w, visible.right + viewportWidth * renderPlan.paddingRatio);
    const bottom = Math.min(top + h, visible.bottom + viewportHeight * renderPlan.paddingRatio);
    const dw = right - dx, dh = bottom - dy;
    if (dw <= 0 || dh <= 0) return;
    const source = details.filter(entry => entry.complete && entry.level === spec.level &&
      entry.renderScale === spec.renderScale && intersects(entry, { left: dx, top: dy, right, bottom }))
      .sort((a, b) => Number(b.townSignature === townSignature) - Number(a.townSignature === townSignature)
        || b.usedAt - a.usedAt)[0] ?? null;
    const covered = source ? { left: Math.max(dx, source.left), top: Math.max(dy, source.top),
      right: Math.min(right, source.left + source.w), bottom: Math.min(bottom, source.top + source.h) } : null;
    const plan = planDetailTiles({ left: dx, top: dy, width: dw, height: dh,
      renderScale: spec.renderScale }, covered);
    const { logicalWidth, logicalHeight } = plan;
    const renderDensity = Math.min(renderPlan.density,
      Math.sqrt(MAX_TILE_PIXELS / Math.max(1, logicalWidth * logicalHeight)));
    const next = surface(logicalWidth, logicalHeight, renderDensity);
    const entry = { ...next, left: dx, top: dy, w: dw, h: dh, level: spec.level,
      renderScale: spec.renderScale, pixels: next.canvas.width * next.canvas.height,
      townSignature, usedAt: performance.now(), complete: false, completedTiles: 0, reusedTiles: plan.reusedTiles };
    stats.renderDensity = renderDensity;
    stats.visiblePhysicalPixels = renderPlan.visiblePhysicalPixels;
    stats.detailPaddingRatio = renderPlan.paddingRatio;
    if (source && covered.right > covered.left && covered.bottom > covered.top) {
      const sourceScaleX = source.canvas.width / source.w;
      const sourceScaleY = source.canvas.height / source.h;
      entry.ctx.drawImage(source.canvas,
        (covered.left - source.left) * sourceScaleX, (covered.top - source.top) * sourceScaleY,
        (covered.right - covered.left) * sourceScaleX, (covered.bottom - covered.top) * sourceScaleY,
        (covered.left - dx) * spec.renderScale, (covered.top - dy) * spec.renderScale,
        (covered.right - covered.left) * spec.renderScale, (covered.bottom - covered.top) * spec.renderScale);
      stats.detailCopies = (stats.detailCopies ?? 0) + 1;
      stats.reusedDetailTiles = (stats.reusedDetailTiles ?? 0) + plan.reusedTiles;
    }
    const tiles = plan.tiles;
    details.push(entry); activeDetail = entry; stats.detailBuilds++; prune();
    const paintNextTile = () => {
      pending = null;
      if (token !== generation || !entry.canvas.width) return;
      const tile = tiles.shift();
      if (!tile) {
        entry.complete = true; stats.pending = false; draw(view, { cancelWork: false }); return;
      }
      const tileLayer = surface(tile.width, tile.height, renderDensity);
      const tileProject = point => {
        const [x, y] = project(point);
        return [(x - dx) * spec.renderScale - tile.x, (y - dy) * spec.renderScale - tile.y];
      };
      const detailedWaterNames = new Set(visibleTownTags.flatMap(tag =>
        (townData.get(tag)?.water ?? []).filter(feature => feature.closed && feature.name).map(feature => feature.name)));
      paintTerrain(tileLayer, tileProject, {
        viewport: [[0, 0], [tile.width, tile.height]],
        anchor: [dx * spec.renderScale + tile.x, dy * spec.renderScale + tile.y], level: spec.level,
        excludeWaterNames: detailedWaterNames,
      });
      if (spec.level === 'local') for (const tag of visibleTownTags) {
        const data = townData.get(tag);
        if (data) drawTownVectorDetail(tileLayer.ctx, data, tileProject,
          [[0, 0], [tile.width, tile.height]], { labels: spec.renderScale >= 64 });
      }
      if (token !== generation || !entry.canvas.width) {
        tileLayer.canvas.width = 0; tileLayer.canvas.height = 0; return;
      }
      entry.ctx.drawImage(tileLayer.canvas, 0, 0, tileLayer.canvas.width, tileLayer.canvas.height,
        tile.x, tile.y, tile.width, tile.height);
      tileLayer.canvas.width = 0; tileLayer.canvas.height = 0;
      entry.completedTiles++; entry.usedAt = performance.now();
      stats.detailTiles = (stats.detailTiles ?? 0) + 1;
      stats.paintedDetailTiles = (stats.paintedDetailTiles ?? 0) + 1;
      draw(view, { cancelWork: false });
      schedule(paintNextTile);
    };
    schedule(paintNextTile, DETAIL_DELAY_MS);
  };
  return {
    draw,
    refine,
    setVisibleRect(rect) {
      const right = Math.max(1, Math.min(width, rect?.width ?? width));
      const bottom = Math.max(1, Math.min(height, rect?.height ?? height));
      viewport = { left: 0, top: 0, right, bottom };
      stats.visibleWidth = right;
      stats.visibleHeight = bottom;
    },
    setTownData(tag, data) {
      if (!tag || !data || townData.get(tag) === data) return;
      townData.set(tag, prepareTownMapData(data));
      if (visibleTownTags.includes(tag)) invalidateLocalDetails();
    },
    setVisibleTowns(tags) {
      const next = [...new Set(tags)].sort();
      if (next.join('|') === visibleTownTags.join('|')) return;
      visibleTownTags = next;
      stats.townDetailTags = next.join(' ');
      invalidateLocalDetails();
    },
    dispose() {
      cancelPending();
      layer.canvas.width = 0; layer.canvas.height = 0;
      details.forEach(entry => { entry.canvas.width = 0; entry.canvas.height = 0; });
      details.length = 0;
      townData.clear(); visibleTownTags = [];
    },
  };
}
