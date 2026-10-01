import { mapSurfacePixels, releaseMapSurface, retainMapSurface, restoreMapSurface } from "./mapTerrainCache.js";

const entries = new Map();
const MAX_PIXELS = 8000000;
const MAX_ENTRIES = 3;

export function townVisitCacheStats() {
  return { entries: entries.size, pixels: [...entries.values()].reduce((sum, entry) =>
    sum + mapSurfacePixels(entry.layer.canvas), 0), maxPixels: MAX_PIXELS, maxEntries: MAX_ENTRIES };
}

export function retainTownVisit(key, entry) {
  const canvas = entry?.layer?.canvas;
  // No hotel-centered view, marker pixels or private coordinates enter this cache.
  if (!key || !entry?.complete || !entry.publicDefault || !entry.data ||
    entry.view?.k !== 1 || entry.view.x !== 0 || entry.view.y !== 0 || !canvas?.width ||
    canvas.width * canvas.height > MAX_PIXELS / 2) return false;
  if (!canvas._mapPixels && !retainMapSurface(canvas)) return false;
  const previous = entries.get(key);
  if (previous && previous !== entry) releaseMapSurface(previous.layer.canvas);
  // Inactive visits retain only authoritative CPU pixels, not duplicate surfaces.
  canvas.width = 0; canvas.height = 0;
  entries.delete(key); entries.set(key, entry);
  while (entries.size > MAX_ENTRIES || townVisitCacheStats().pixels > MAX_PIXELS) {
    const [oldKey, old] = entries.entries().next().value;
    entries.delete(oldKey);
    releaseMapSurface(old.layer.canvas);
  }
  return true;
}

export function takeTownVisit(key, data) {
  const entry = entries.get(key);
  if (!entry || !data) return null;
  entries.delete(key);
  if (entry.data !== data || !restoreMapSurface(entry.layer.canvas)) {
    releaseMapSurface(entry.layer.canvas); return null;
  }
  entry.layer.ctx.setTransform(entry.layer.ratio, 0, 0, entry.layer.ratio, 0, 0);
  entry.layer.ctx.lineJoin = "round"; entry.layer.ctx.lineCap = "round";
  return entry;
}
