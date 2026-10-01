const DETAIL_TILE_SIZE = 192;

export const DETAIL_CACHE_MAX_PIXELS = 12000000;
export const DETAIL_CACHE_MAX_ENTRIES = 3;

// Costs include CPU backups. A hot 4M surface + backup and a parked 4M
// previous view fit without reducing either view's render density.
export function detailCacheVictims(entries, active,
  maxPixels = DETAIL_CACHE_MAX_PIXELS, maxEntries = DETAIL_CACHE_MAX_ENTRIES) {
  let pixels = entries.reduce((sum, entry) => sum + entry.pixels, 0), count = entries.length;
  const victims = [];
  const redundant = entry => {
    if (!active?.complete || entry.level !== active.level || entry.renderScale !== active.renderScale ||
      entry.density > active.density ||
      entry.townSignature !== active.townSignature || !(entry.w * entry.h > 0)) return false;
    const overlap = intersectDetailBounds({ left: entry.left, top: entry.top,
      right: entry.left + entry.w, bottom: entry.top + entry.h },
    { left: active.left, top: active.top, right: active.left + active.w, bottom: active.top + active.h });
    return overlap && (overlap.right - overlap.left) * (overlap.bottom - overlap.top) >= entry.w * entry.h * .8;
  };
  for (const entry of entries.filter(entry => entry !== active)
    .sort((a, b) => Number(Boolean(redundant(b))) - Number(Boolean(redundant(a))) || a.usedAt - b.usedAt)) {
    if (pixels <= maxPixels && count <= maxEntries) break;
    victims.push(entry); pixels -= entry.pixels; count--;
  }
  return victims;
}

export function detailRenderPlan({ visibleWidth, visibleHeight, renderScale, dpr,
  maxPixels = 4000000, maxPaddingRatio = .42 }) {
  const visiblePixels = Math.max(1, visibleWidth * renderScale * visibleHeight * renderScale);
  const density = Math.min(dpr, Math.sqrt(maxPixels / visiblePixels));
  const maximumAreaRatio = maxPixels / Math.max(1, visiblePixels * density * density);
  const dimensionRatio = Math.min(1 + maxPaddingRatio * 2, Math.sqrt(maximumAreaRatio));
  return { density, paddingRatio: Math.max(0, (dimensionRatio - 1) / 2),
    visiblePhysicalPixels: visiblePixels * density * density };
}

export function intersectDetailBounds(a, b) {
  const bounds = { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
  return bounds.right > bounds.left && bounds.bottom > bounds.top ? bounds : null;
}

export function detailCoverage(entry) {
  return entry.complete ? [{ left: entry.left, top: entry.top,
    right: entry.left + entry.w, bottom: entry.top + entry.h }] : entry.coverage ?? [];
}

function subtractCoverage(bounds, covered) {
  const overlap = intersectDetailBounds(bounds, covered);
  if (!overlap) return [bounds];
  return [
    { ...bounds, bottom: overlap.top },
    { ...bounds, top: overlap.bottom },
    { left: bounds.left, right: overlap.left, top: overlap.top, bottom: overlap.bottom },
    { left: overlap.right, right: bounds.right, top: overlap.top, bottom: overlap.bottom },
  ].filter(part => part.right - part.left > 1e-9 && part.bottom - part.top > 1e-9);
}

export function uncoveredDetailBounds(bounds, coverage) {
  let missing = [bounds];
  for (const covered of coverage) {
    missing = missing.flatMap(part => subtractCoverage(part, covered));
    if (!missing.length) break;
  }
  return missing;
}

export function planDetailTiles({ left, top, width, height, renderScale }, covered = []) {
  const coverage = Array.isArray(covered) ? covered : covered ? [covered] : [];
  const logicalWidth = width * renderScale, logicalHeight = height * renderScale;
  const tiles = [];
  let reusedTiles = 0;
  for (let y = 0; y < logicalHeight; y += DETAIL_TILE_SIZE) for (let x = 0; x < logicalWidth; x += DETAIL_TILE_SIZE) {
    const tileWidth = Math.min(DETAIL_TILE_SIZE, logicalWidth - x);
    const tileHeight = Math.min(DETAIL_TILE_SIZE, logicalHeight - y);
    const worldTile = { left: left + x / renderScale, top: top + y / renderScale,
      right: left + (x + tileWidth) / renderScale, bottom: top + (y + tileHeight) / renderScale };
    const missing = uncoveredDetailBounds(worldTile, coverage);
    if (!missing.length) { reusedTiles++; continue; }
    // Paint a full tile for stable strokes, but only paste its uncovered regions.
    tiles.push({ x, y, width: tileWidth, height: tileHeight, missing,
      distance: Math.hypot(x + tileWidth / 2 - logicalWidth / 2,
        y + tileHeight / 2 - logicalHeight / 2) });
  }
  tiles.sort((a, b) => a.distance - b.distance);
  return { tiles, reusedTiles, logicalWidth, logicalHeight };
}
