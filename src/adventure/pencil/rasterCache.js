import { registerCanvasCache } from './canvasRecovery';
import { readRasters, rasterChecksum, rasterFormat, rasterLimits, writeRaster } from './rasterStore';
import strokeSource from './stroke.js?raw';

function bounded(promise, timeout, fallback) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), timeout);
    promise.then(value => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); resolve(fallback); });
  });
}

// Pixel bytes are authoritative; a canvas is only a replaceable drawing surface.
export function createPencilRasterCache(name, rendererSource, limit = 128) {
  const entries = new Map();
  const capacity = Number.isFinite(limit) ? Math.max(0, Math.min(128, Math.floor(limit))) : 128;
  let namespace = null;
  let bytes = 0;
  let localRevision = 0;
  let initializedDone = false;
  let flushing = null;

  function remember(key, pixels, dirty = false) {
    bytes -= entries.get(key)?.pixels.data.byteLength ?? 0;
    entries.delete(key);
    let witness = 3;
    while (witness < pixels.data.length && !pixels.data[witness]) witness += 4;
    entries.set(key, { pixels, dirty, canvas: null, witness: (witness - 3) / 4 });
    bytes += pixels.data.byteLength;
    while (entries.size > capacity || bytes > rasterLimits.memoryBytes) {
      const oldest = entries.keys().next().value;
      bytes -= entries.get(oldest).pixels.data.byteLength;
      entries.delete(oldest);
    }
  }

  async function flush() {
    if (flushing) return flushing;
    if (!initializedDone || !namespace || ![...entries.values()].some(entry => entry.dirty)) return;
    flushing = (async () => {
      // Limit in-flight snapshots; remaining dirty bytes live only in the LRU.
      while (true) {
        const batch = [...entries].filter(([, entry]) => entry.dirty).slice(0, 16);
        if (!batch.length) break;
        await Promise.all(batch.map(async ([key, entry]) => {
          entry.dirty = false;
          const { width, height, data } = entry.pixels;
          const row = { id: JSON.stringify([namespace, key]), namespace, key,
            format: rasterFormat, width, height, data, savedAt: Date.now() };
          row.checksum = rasterChecksum(row);
          await writeRaster(row);
        }));
      }
    })().finally(() => {
      flushing = null;
      // A write can arrive between the drain loop's return and this microtask.
      if ([...entries.values()].some(entry => entry.dirty)) void flush();
    });
    return flushing;
  }

  const initialized = (async () => {
    try {
      if (typeof name !== 'string' || !name.length || name.length > 64) return;
      const source = JSON.stringify([rasterFormat, strokeSource, rendererSource]);
      const hash = await bounded(globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source)), 100, null);
      if (!hash) return;
      namespace = `${name}:${Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('')}`;
      const rows = await readRasters(namespace, capacity);
      // If drawing raced warmup, local pixels (including evicted keys) win. Old
      // preload rows also cannot evict the just-rendered first screen.
      if (!localRevision) {
        for (const row of rows.reverse()) {
          remember(row.key, new ImageData(row.data, row.width, row.height));
        }
      }
    } catch { /* Storage/hash denial keeps the synchronous in-memory cache. */ }
    finally { initializedDone = true; }
  })();
  initialized.then(flush);
  // Opportunistic warmup: UI consumers wait at most one short startup budget.
  const ready = bounded(initialized, 32, undefined);
  const cache = {
    ready,
    get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      entries.delete(key); entries.set(key, entry);
      try {
        const { pixels, witness } = entry;
        const x = witness % pixels.width, y = Math.floor(witness / pixels.width);
        const context = entry.canvas?.getContext('2d');
        // A silently cleared surface need not report context loss. One known ink
        // pixel detects blanks without a full-image readback on every hit.
        if (entry.canvas && (!context || context.isContextLost?.()
          || entry.canvas.width !== pixels.width || entry.canvas.height !== pixels.height
          || !context.getImageData(x, y, 1, 1).data[3])) entry.canvas = null;
        if (!entry.canvas) {
          const canvas = document.createElement('canvas');
          canvas.width = pixels.width; canvas.height = pixels.height;
          const target = canvas.getContext('2d', { willReadFrequently: true });
          if (!target || target.isContextLost?.()) return null;
          target.putImageData(pixels, 0, 0);
          if (target.isContextLost?.() || !target.getImageData(x, y, 1, 1).data[3]) return null;
          entry.canvas = canvas;
        }
        return entry.canvas;
      } catch { entry.canvas = null; return null; }
    },
    set(key, canvas) {
      if (!capacity || typeof key !== 'string' || !key.length || key.length > rasterLimits.keyLength
        || !canvas.width || !canvas.height || canvas.width > rasterLimits.dimension
        || canvas.height > rasterLimits.dimension || canvas.width * canvas.height > rasterLimits.pixels) return;
      try {
        const context = canvas.getContext('2d');
        if (!context || context.isContextLost?.()) return;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        if (context.isContextLost?.()) return;
        let hasInk = false;
        for (let index = 3; index < pixels.data.length; index += 4) {
          if (pixels.data[index]) { hasInk = true; break; }
        }
        if (!hasInk) return;
        localRevision++;
        remember(key, pixels, true);
        void flush();
      } catch { /* Tainted/unavailable canvas is never persisted. */ }
    },
    invalidate() { for (const entry of entries.values()) entry.canvas = null; },
    async settled() {
      await initialized;
      do { await flush(); } while (flushing);
    },
  };
  registerCanvasCache(cache);
  return cache;
}
