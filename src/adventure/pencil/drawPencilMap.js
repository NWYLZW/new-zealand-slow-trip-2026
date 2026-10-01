import { geoPath, geoTransform } from 'd3';
import geography from '../data/pencil-geography.json';
import landCover from '../data/pencil-land-cover.json';
import { random, stroke, hatch, coverTexture, mountains, clipPolyline } from './brush';
import { pencilPalette as p } from './palette';
import { mapLabel } from './mapLabels';
import { drawPencilWater } from './drawPencilWater';
import { drawTownVectorDetail, prepareTownMapData } from './drawPencilTown';
import { waterFeatures } from './waterFeatures';
import { createMapTerrainCache, retainMapSurface, restoreMapSurface,
  releaseMapSurface, mapSurfacePixels } from './mapTerrainCache';
import { terrainOverviewKey } from './mapTerrainVersion';
import { DETAIL_CACHE_MAX_PIXELS, detailCacheVictims, detailCoverage, detailRenderPlan,
  intersectDetailBounds, planDetailTiles, uncoveredDetailBounds } from './detailTilePlan';

export { detailRenderPlan, planDetailTiles } from './detailTilePlan';

const TILE_SIZE = 512;
const OCEAN_TILE_DENSITY = 1;
const OCEAN_TEXTURE_STROKES = 320;
const OVERVIEW_MAX_ZOOM = 3.5;
const REGIONAL_MAX_ZOOM = 9;
const DETAIL_DELAY_MS = 150;
const MAX_TILE_PIXELS = 4000000;
const MAX_OVERVIEW_PIXELS = 2000000;
const geographicRings = geometry => geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() :
  geometry.type === 'Polygon' || geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];

function surface(width, height, density, canvas = document.createElement('canvas')) {
  canvas.width = Math.max(1, Math.floor(width * density));
  canvas.height = Math.max(1, Math.floor(height * density));
  const software = !canvas.isConnected;
  const ctx = canvas.getContext('2d', software ? { willReadFrequently: true } : undefined);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.lineJoin = 'round';
  return { canvas, ctx, density, software };
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
  return { textureDensity: .55, mountainCount: 40, mountainSpacing: 16, boundary: 0 };
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
  const { canvas, ctx } = surface(TILE_SIZE, TILE_SIZE, OCEAN_TILE_DENSITY), rng = random(4801);
  for (let index = 0; index < OCEAN_TEXTURE_STROKES; index++) {
    const x = rng() * TILE_SIZE, y = rng() * TILE_SIZE, length = 9 + rng() * 49;
    const points = [[x, y], [x + length * .5, y - length * .09], [x + length, y - length * .18]];
    ctx.globalAlpha = .1 + rng() * .2;
    const offsets = [[0, 0]];
    if (x + length > TILE_SIZE) offsets.push([-TILE_SIZE, 0]);
    if (y - length * .18 < 0) offsets.push([0, TILE_SIZE]);
    if (x + length > TILE_SIZE && y - length * .18 < 0) offsets.push([-TILE_SIZE, TILE_SIZE]);
    for (const [dx, dy] of offsets) {
      ctx.save(); ctx.translate(dx, dy);
      stroke(ctx, points, p.water, .5 + (index % 4) * .1, 8100 + index,
        { passes: 1, detail: 'fill', breaks: .78, gain: 1.15, amplitude: .35 });
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  anchoredGrain(ctx, [[0, 0], [TILE_SIZE, TILE_SIZE]], [0, 0], p.water, 811, .52);
  oceanTile = canvas;
  retainMapSurface(canvas);
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

export function createPencilMap(canvas, project, width, height, options = {}) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  surface(width, height, dpr, canvas);
  const ctx = canvas.getContext('2d'), path = pathFor(project);
  const bounds = path.bounds(geography.land);
  const left = Math.floor(bounds[0][0]) - 20, top = Math.floor(bounds[0][1]) - 20;
  const w = Math.ceil(bounds[1][0] - left) + 20, h = Math.ceil(bounds[1][1] - top) + 20;
  const density = Math.min(dpr * 4, Math.sqrt(MAX_OVERVIEW_PIXELS / (w * h)));
  const layer = surface(w, h, density);
  const buildStart = performance.now();
  const storage = createMapTerrainCache();
  const cacheKey = terrainOverviewKey({ geography, landCover, waterFeatures, project, width, height, density, palette: p });
  let pattern = null;
  const origin = project([173, 0]), unit = Math.abs(project([174, 0])[0] - origin[0]) / (2600 * Math.PI / 180);
  const labels = [
    { text: '塔斯曼海', point: [165.90918, -39.07277], size: 22, seed: 771 },
    { text: '南太平洋', point: [178.29757, -43.66757], size: 22, seed: 773 },
  ].map(label => ({ ...label, position: project(label.point) }));
  const stats = { terrainBuilds: 0, detailBuilds: 0, frames: 0, buildMs: 0, skippedFrames: 0,
    pixels: layer.canvas.width * layer.canvas.height, cachedDetails: 0, cachePixels: 0,
    overviewBackend: layer.software ? 'software' : 'display' };
  canvas.dataset.lettering = 'C';
  canvas.dataset.coverClasses = landCover.features.length + 1;
  canvas.dataset.waterRenderer = 'pressure-pencil';
  canvas.dataset.detailTiers = 'overview regional local';
  canvas._waterFeatures = waterFeatures.map(feature => feature.properties);
  const details = [];
  const townData = new Map(), townSources = new Map(), townRevisions = new Map();
  let pending = null, generation = 0, activeDetail = null, visibleTownTags = [];
  let pendingKey = null, lastView = null, disposed = false, readyToDraw = false, lastDrawKey = '';
  let suspended = document.hidden || Boolean(options.suspended), deferredOverview = null, recoveryPending = false;
  let moving = false;
  let viewport = { left: 0, top: 0, right: width, bottom: height };
  const townSignature = () => visibleTownTags.map(tag => `${tag}:${townRevisions.get(tag) ?? 0}`).join('|');
  const publish = () => { canvas._pencilStats = { ...stats, pending: pendingKey !== null,
    cachedDetails: details.length, cachePixels: details.reduce((sum, entry) => sum + entry.pixels, 0),
    cachePixelLimit: DETAIL_CACHE_MAX_PIXELS, parkedDetails: details.filter(entry => !entry.canvas.width).length,
    persistence: { ...storage.stats } }; };

  const parkDetail = entry => {
    if (entry?.complete && entry.canvas.width && entry.canvas._mapPixels) {
      entry.canvas.width = 0; entry.canvas.height = 0;
      entry.pixels = mapSurfacePixels(entry.canvas);
    }
  };
  const restoreDetail = entry => {
    if (entry.canvas.width) return true;
    if (!restoreMapSurface(entry.canvas)) {
      entry.canvas.width = 0; entry.canvas.height = 0;
      entry.pixels = mapSurfacePixels(entry.canvas);
      return false;
    }
    entry.ctx.setTransform(entry.density, 0, 0, entry.density, 0, 0);
    entry.ctx.lineJoin = 'round';
    entry.pixels = mapSurfacePixels(entry.canvas);
    stats.detailRestores = (stats.detailRestores ?? 0) + 1;
    return true;
  };
  const prune = () => {
    for (const entry of details) if (entry !== activeDetail) parkDetail(entry);
    for (const removed of detailCacheVictims(details, activeDetail)) {
      details.splice(details.indexOf(removed), 1);
      releaseMapSurface(removed.canvas);
      stats.detailEvictions = (stats.detailEvictions ?? 0) + 1;
    }
  };

  const cancelPending = () => {
    generation++;
    if (pendingKey !== null) stats.detailCancels = (stats.detailCancels ?? 0) + 1;
    clearTimeout(pending); pending = null; pendingKey = null;
    publish();
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
    const spec = detailSpec(view.k), fullVisible = visibleWorld(view, viewport);
    const visible = { left: Math.max(left, fullVisible.left), top: Math.max(top, fullVisible.top),
      right: Math.min(left + w, fullVisible.right), bottom: Math.min(top + h, fullVisible.bottom) };
    if (spec.level === 'overview') return null;
    const candidates = details.filter(entry => intersects(entry, visible) &&
      Math.abs(Math.log2(entry.renderScale / spec.renderScale)) <= 1);
    const signature = townSignature();
    const exact = candidates.filter(entry => entry.complete && entry.level === spec.level && entry.renderScale === spec.renderScale &&
      entry.townSignature === signature && contains(entry, visible))
      .sort((a, b) => b.density - a.density || b.usedAt - a.usedAt)[0];
    const chosen = exact ?? candidates.filter(entry => entry.townSignature === signature &&
      (entry.complete || entry.coverage.length))
      .sort((a, b) => b.usedAt - a.usedAt)[0] ?? null;
    if (chosen) chosen.usedAt = performance.now();
    return chosen;
  };
  const draw = (view, { cancelWork = true, force = false, moving: nextMoving = moving } = {}) => {
    if (disposed) return;
    moving = nextMoving;
    const changed = !lastView || view.x !== lastView.x || view.y !== lastView.y || view.k !== lastView.k;
    lastView = view;
    if (cancelWork && (changed || (moving && pendingKey))) cancelPending();
    const drawKey = [view.x, view.y, view.k, townSignature(), viewport.right, viewport.bottom].join(':');
    if (!force && drawKey === lastDrawKey) { stats.skippedFrames++; publish(); return; }
    if (document.hidden || suspended) return;
    lastDrawKey = drawKey;
    const start = performance.now();
    pattern ??= ctx.createPattern(seaTexture(), 'repeat');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const [ox, oy] = view.apply(origin), seaScale = unit * view.k / OCEAN_TILE_DENSITY;
    pattern.setTransform(new DOMMatrix([seaScale, 0, 0, seaScale, ox, oy]));
    ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height);
    if (readyToDraw) blit({ ...layer, left, top, w, h }, view);
    activeDetail = chooseDetail(view);
    for (const entry of details) if (entry !== activeDetail) parkDetail(entry);
    if (activeDetail) {
      if (restoreDetail(activeDetail)) blit(activeDetail, view);
      else {
        details.splice(details.indexOf(activeDetail), 1);
        releaseMapSurface(activeDetail.canvas); activeDetail = null;
        stats.detailRestoreFailures = (stats.detailRestoreFailures ?? 0) + 1;
      }
    }
    prune();
    for (const { position, text, size, seed } of labels) {
      const sprite = mapLabel(text, size, seed, p.water, p.paper, { persistence: 'public' });
      const [lx, ly] = view.apply(position);
      if (lx > sprite.width / 2 + 12 && lx < width - sprite.width / 2 - 12 && ly > 80 && ly < height - 80) {
        sprite.draw(ctx, lx - sprite.advance / 2, ly);
      }
    }
    stats.frames++;
    stats.frameMs = performance.now() - start;
    stats.lod = detailSpec(view.k).level;
    stats.detailScale = activeDetail?.renderScale ?? 1;
    stats.activeDensity = activeDetail?.density ?? 0;
    stats.cachedDetails = details.length;
    stats.cachePixels = details.reduce((sum, entry) => sum + entry.pixels, 0);
    stats.pending = Boolean(pending);
    publish();
    canvas._mapView = { x: view.x, y: view.y, k: view.k };
  };
  const invalidateLocalDetails = () => {
    cancelPending();
    stats.townDetailInvalidations = (stats.townDetailInvalidations ?? 0) + 1;
  };
  const refine = view => {
    if (disposed || document.hidden || suspended || moving) return;
    const spec = detailSpec(view.k);
    if (spec.level === 'overview') { if (pendingKey) cancelPending(); return; }
    const fullVisible = visibleWorld(view, viewport);
    const visible = { left: Math.max(left, fullVisible.left), top: Math.max(top, fullVisible.top),
      right: Math.min(left + w, fullVisible.right), bottom: Math.min(top + h, fullVisible.bottom) };
    if (visible.right <= visible.left || visible.bottom <= visible.top) { cancelPending(); return; }
    const viewportWidth = visible.right - visible.left, viewportHeight = visible.bottom - visible.top;
    const renderPlan = detailRenderPlan({ visibleWidth: viewportWidth, visibleHeight: viewportHeight,
      renderScale: spec.renderScale, dpr, maxPixels: MAX_TILE_PIXELS });
    const signature = townSignature();
    const requestKey = [spec.level, spec.renderScale, signature, visible.left, visible.top, visible.right, visible.bottom].join(':');
    if (pendingKey === requestKey) { stats.detailRequestReuses = (stats.detailRequestReuses ?? 0) + 1; publish(); return; }
    const cached = details.find(entry => entry.complete && entry.level === spec.level &&
      entry.renderScale === spec.renderScale && entry.density >= renderPlan.density - 1e-9 &&
      entry.townSignature === signature && contains(entry, visible));
    if (cached) {
      cached.usedAt = performance.now(); stats.detailReuses = (stats.detailReuses ?? 0) + 1;
      if (pendingKey) cancelPending();
      if (activeDetail !== cached) draw(view, { cancelWork: false, force: true });
      if (!details.includes(cached)) { refine(view); return; }
      publish(); return;
    }
    cancelPending();
    const token = generation;
    pendingKey = requestKey;
    const compatible = details.filter(entry => entry.level === spec.level &&
      entry.renderScale === spec.renderScale && entry.density >= renderPlan.density - 1e-9 && entry.townSignature === signature);
    let entry = compatible.filter(entry => !entry.complete && contains(entry, visible))
      .sort((a, b) => b.usedAt - a.usedAt)[0];
    let plan;
    if (entry) {
      plan = planDetailTiles({ left: entry.left, top: entry.top, width: entry.w,
        height: entry.h, renderScale: entry.renderScale }, entry.coverage);
      stats.detailResumes = (stats.detailResumes ?? 0) + 1;
    } else {
      const dx = Math.max(left, visible.left - viewportWidth * renderPlan.paddingRatio);
      const dy = Math.max(top, visible.top - viewportHeight * renderPlan.paddingRatio);
      const right = Math.min(left + w, visible.right + viewportWidth * renderPlan.paddingRatio);
      const bottom = Math.min(top + h, visible.bottom + viewportHeight * renderPlan.paddingRatio);
      const dw = right - dx, dh = bottom - dy;
      if (dw <= 0 || dh <= 0) { pendingKey = null; return; }
      const targetBounds = { left: dx, top: dy, right, bottom };
      const renderDensity = renderPlan.density;
      const sources = [], coverage = [];
      // Copy each pixel once, preferring the latest compatible partial/completed image.
      for (const source of compatible.filter(entry => entry.density >= renderDensity - 1e-9 && intersects(entry, targetBounds))
        .sort((a, b) => b.usedAt - a.usedAt)) {
        for (const bounds of detailCoverage(source)) {
          const overlap = intersectDetailBounds(bounds, targetBounds);
          if (!overlap) continue;
          for (const covered of uncoveredDetailBounds(overlap, coverage)) {
            sources.push({ source, covered }); coverage.push(covered);
          }
        }
      }
      plan = planDetailTiles({ left: dx, top: dy, width: dw, height: dh,
        renderScale: spec.renderScale }, coverage);
      const { logicalWidth, logicalHeight } = plan;
      // Park completed surfaces before allocating the replacement. A replacement
      // or one temporary source restore adds at most 4M pixels to the 12M cache.
      for (const source of details) parkDetail(source);
      const next = surface(logicalWidth, logicalHeight, renderDensity);
      entry = { ...next, left: dx, top: dy, w: dw, h: dh, level: spec.level,
        renderScale: spec.renderScale, pixels: next.canvas.width * next.canvas.height,
        townSignature: signature, usedAt: performance.now(), complete: false, completedTiles: 0,
        coverage, reusedTiles: plan.reusedTiles };
      stats.renderDensity = renderDensity;
      stats.visiblePhysicalPixels = renderPlan.visiblePhysicalPixels;
      stats.detailPaddingRatio = renderPlan.paddingRatio;
      let restoredSource = null;
      const unavailableSources = new Set();
      for (const { source, covered } of sources) {
        if (restoredSource !== source) {
          parkDetail(restoredSource);
          restoredSource = source;
        }
        if (unavailableSources.has(source) || !restoreDetail(source)) {
          unavailableSources.add(source);
          entry.coverage = entry.coverage.filter(bounds => bounds !== covered);
          continue;
        }
        const sourceScaleX = source.canvas.width / source.w, sourceScaleY = source.canvas.height / source.h;
        entry.ctx.drawImage(source.canvas, (covered.left - source.left) * sourceScaleX,
          (covered.top - source.top) * sourceScaleY, (covered.right - covered.left) * sourceScaleX,
          (covered.bottom - covered.top) * sourceScaleY, (covered.left - dx) * spec.renderScale,
          (covered.top - dy) * spec.renderScale, (covered.right - covered.left) * spec.renderScale,
          (covered.bottom - covered.top) * spec.renderScale);
        stats.detailCopies = (stats.detailCopies ?? 0) + 1;
      }
      parkDetail(restoredSource);
      plan = planDetailTiles({ left: dx, top: dy, width: dw, height: dh,
        renderScale: spec.renderScale }, entry.coverage);
      stats.reusedDetailTiles = (stats.reusedDetailTiles ?? 0) + plan.reusedTiles;
      details.push(entry); stats.detailBuilds++;
    }
    entry.usedAt = performance.now(); activeDetail = entry; prune(); publish();
    const { left: dx, top: dy, renderScale, density: renderDensity } = entry;
    const tiles = plan.tiles;
    const paintNextTile = () => {
      pending = null;
      if (disposed || token !== generation || !entry.canvas.width) return;
      if (document.hidden || suspended) { cancelPending(); return; }
      const tile = tiles.shift();
      if (!tile) {
        entry.complete = true; entry.coverage = []; pendingKey = null;
        retainMapSurface(entry.canvas); entry.pixels = mapSurfacePixels(entry.canvas); prune();
        draw(lastView ?? view, { cancelWork: false, force: true }); return;
      }
      const tileLayer = surface(tile.width, tile.height, renderDensity);
      const tileProject = point => {
        const [x, y] = project(point);
        return [(x - dx) * renderScale - tile.x, (y - dy) * renderScale - tile.y];
      };
      const detailedWaterNames = new Set(visibleTownTags.flatMap(tag =>
        (townData.get(tag)?.water ?? []).filter(feature => feature.closed && feature.name).map(feature => feature.name)));
      paintTerrain(tileLayer, tileProject, {
        viewport: [[0, 0], [tile.width, tile.height]],
        anchor: [dx * renderScale + tile.x, dy * renderScale + tile.y], level: spec.level,
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
      entry.ctx.save(); entry.ctx.beginPath();
      for (const bounds of tile.missing) entry.ctx.rect((bounds.left - dx) * renderScale,
        (bounds.top - dy) * renderScale, (bounds.right - bounds.left) * renderScale,
        (bounds.bottom - bounds.top) * renderScale);
      entry.ctx.clip();
      entry.ctx.drawImage(tileLayer.canvas, 0, 0, tileLayer.canvas.width, tileLayer.canvas.height,
        tile.x, tile.y, tile.width, tile.height);
      entry.ctx.restore(); entry.coverage.push(...tile.missing);
      tileLayer.canvas.width = 0; tileLayer.canvas.height = 0;
      entry.completedTiles++; entry.usedAt = performance.now();
      stats.detailTiles = (stats.detailTiles ?? 0) + 1;
      stats.paintedDetailTiles = (stats.paintedDetailTiles ?? 0) + 1;
      draw(lastView ?? view, { cancelWork: false, force: true });
      schedule(paintNextTile);
    };
    schedule(paintNextTile, DETAIL_DELAY_MS);
  };
  const paintOverview = () => {
    const start = performance.now();
    layer.ctx.setTransform(density, 0, 0, density, 0, 0);
    layer.ctx.clearRect(0, 0, w, h);
    paintTerrain(layer, point => { const [x, y] = project(point); return [x - left, y - top]; }, {
      viewport: [[0, 0], [w, h]], anchor: [left, top], level: 'overview',
    });
    stats.terrainBuilds++; stats.buildMs += performance.now() - start;
  };
  const finishOverview = bitmap => {
    if (disposed) { bitmap?.close(); return; }
    if (document.hidden || suspended) { deferredOverview = { bitmap }; return; }
    if (bitmap) {
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0); layer.ctx.drawImage(bitmap, 0, 0); bitmap.close();
      layer.ctx.setTransform(density, 0, 0, density, 0, 0);
    } else { paintOverview(); storage.write(cacheKey, layer.canvas); }
    retainMapSurface(layer.canvas);
    readyToDraw = true; stats.readyMs = performance.now() - buildStart;
    if (lastView) draw(lastView, { cancelWork: false, force: true });
    publish();
  };
  const ready = storage.read(cacheKey, layer.canvas.width, layer.canvas.height).then(finishOverview);
  const recover = () => {
    if (disposed) return;
    if (document.hidden || suspended) { recoveryPending = true; return; }
    recoveryPending = false;
    surface(width, height, dpr, canvas);
    cancelPending();
    restoreMapSurface(oceanTile); pattern = ctx.createPattern(seaTexture(), 'repeat');
    if (readyToDraw && !restoreMapSurface(layer.canvas)) paintOverview();
    for (let i = details.length - 1; i >= 0; i--) {
      if (!details[i].complete || !details[i].canvas._mapPixels) {
        releaseMapSurface(details[i].canvas); details.splice(i, 1);
      } else parkDetail(details[i]);
    }
    stats.recoveries = (stats.recoveries ?? 0) + 1;
    if (lastView) { draw(lastView, { force: true }); refine(lastView); }
  };
  canvas.addEventListener('contextrestored', recover);
  return {
    draw, ready, settled: storage.settled, recover,
    pause() { suspended = true; moving = false; cancelPending(); },
    resume() {
      if (disposed || document.hidden) return;
      suspended = false;
      if (deferredOverview) { const { bitmap } = deferredOverview; deferredOverview = null; finishOverview(bitmap); }
      if (recoveryPending) recover();
    },
    refreshLabels() {
      const hasTownLabels = entry => entry.level === 'local' && entry.renderScale >= 64 && entry.townSignature;
      if (details.some(hasTownLabels)) {
        cancelPending();
        for (let i = details.length - 1; i >= 0; i--) if (hasTownLabels(details[i])) {
          releaseMapSurface(details[i].canvas); details.splice(i, 1);
        }
      }
      if (lastView) { draw(lastView, { force: true, cancelWork: false }); refine(lastView); }
    },
    refine,
    setVisibleRect(rect) {
      const right = Math.max(1, Math.min(width, rect?.width ?? width));
      const bottom = Math.max(1, Math.min(height, rect?.height ?? height));
      viewport = { left: 0, top: 0, right, bottom };
      stats.visibleWidth = right;
      stats.visibleHeight = bottom;
    },
    setTownData(tag, data) {
      if (!tag || !data || townSources.get(tag) === data) return;
      townSources.set(tag, data);
      townRevisions.set(tag, (townRevisions.get(tag) ?? 0) + 1);
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
      disposed = true;
      cancelPending();
      canvas.removeEventListener('contextrestored', recover);
      storage.dispose();
      deferredOverview?.bitmap?.close(); deferredOverview = null;
      releaseMapSurface(layer.canvas);
      details.forEach(entry => releaseMapSurface(entry.canvas));
      details.length = 0;
      townData.clear(); townSources.clear(); townRevisions.clear(); visibleTownTags = [];
    },
  };
}
