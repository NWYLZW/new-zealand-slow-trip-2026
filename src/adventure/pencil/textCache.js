import { registerCanvasCache } from './canvasRecovery';
import { createTextStore, TEXT_LIMITS, textPixelFingerprint, validTextRecord } from './textStore';
import labelSource from './label.js?raw';
import mapLabelSource from './mapLabels.js?raw';
import cacheSource from './textCache.js?raw';
import storeSource from './textStore.js?raw';
import fontUrl from '../assets/ui-hand-yozai.woff2?url';

const entries = new Map(), warm = new Map(), queue = new Map();
const produced = new Set(), fontIds = new WeakMap();
const deferred = new Set();
// Background commits can overlap expensive map startup; UI readiness remains 32ms.
const store = createTextStore({ writeTimeout: 2000 });
let bytes = 0, warmBytes = 0, queuedBytes = 0, writing = null, namespace = null;
let fontEpoch = 0, surfaceEpoch = 0;
let nextFontId = 1;
let storageDisabled = false;
const stats = { renders: 0, memoryHits: 0, persistentHits: 0, materializations: 0, skippedWrites: 0, deferredWrites: 0 };
const sha = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)),
  byte => byte.toString(16).padStart(2, '0')).join('');

async function initialize() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEXT_LIMITS.timeout);
  try {
    const response = await fetch(fontUrl, { signal: controller.signal });
    if (!response.ok) return;
    const fontBytes = await response.arrayBuffer();
    const fontHash = await sha(fontBytes);
    namespace = `text-v2:${await sha(new TextEncoder().encode(
      [labelSource, mapLabelSource, cacheSource, storeSource, fontHash].join('\n')))}`;
    for (const row of await store.read(namespace)) {
      if (produced.has(row.key)) continue;
      if (warmBytes + row.bytes > TEXT_LIMITS.warmBytes) break;
      warm.set(row.key, row); warmBytes += row.bytes;
    }
  } catch { /* A failed font/version probe disables persistence, not rendering. */ }
  finally { clearTimeout(timer); if (!namespace) storageDisabled = true; }
}
const initialized = typeof document === 'undefined' ? Promise.resolve() : initialize();
export const textCacheReady = new Promise(resolve => {
  const timer = setTimeout(resolve, 32);
  initialized.finally(() => { clearTimeout(timer); resolve(); });
});

function invalidate() {
  // Old sprites may outlive LRU eviction or clear(); their getters also see this.
  surfaceEpoch++;
}
registerCanvasCache({ invalidate });
if (typeof document !== 'undefined') {
  const changed = () => { fontEpoch++; entries.clear(); bytes = 0; };
  document.fonts?.addEventListener('loading', changed);
  document.fonts?.addEventListener('loadingdone', changed);
  document.fonts?.addEventListener('loadingerror', changed);
}

export function textFontState(font, text) {
  const fonts = document.fonts;
  let ready = false;
  try { ready = !!fonts && fonts.status === 'loaded' && fonts.check(font, text); } catch { /* Invalid font. */ }
  const faces = fonts ? Array.from(fonts, face => {
    if (!fontIds.has(face)) fontIds.set(face, nextFontId++);
    return [fontIds.get(face), face.family, face.status, face.style, face.weight,
      face.stretch, face.unicodeRange, face.featureSettings, face.variationSettings];
  }) : [];
  return { ready, key: JSON.stringify([fontEpoch, ready, fonts?.status, faces]) };
}

function surface(entry, ink) {
  if (entry.surfaceEpoch !== surfaceEpoch) {
    entry.canvas = null; entry.inkCanvas = null; entry.surfaceEpoch = surfaceEpoch;
  }
  const field = ink ? 'inkCanvas' : 'canvas';
  if (entry[field]?.getContext('2d')?.isContextLost?.()) entry[field] = null;
  if (!entry[field]) {
    const canvas = document.createElement('canvas');
    canvas.width = entry.row.pixelWidth; canvas.height = entry.row.pixelHeight;
    const context = canvas.getContext('2d');
    if (!context || context.isContextLost?.()) return null;
    try {
      context.putImageData(new ImageData(ink ? (entry.row.ink ?? entry.row.data) : entry.row.data,
        canvas.width, canvas.height), 0, 0);
    } catch { return null; }
    if (context.isContextLost?.()) return null;
    entry[field] = canvas; stats.materializations++;
  }
  return entry[field];
}
function sprite(entry) {
  return { ...entry.row.metrics,
    get canvas() { return surface(entry, false); },
    get ink() { return surface(entry, true); },
    draw(target, x, baseline) {
      const { width, height, ascent, padding } = entry.row.metrics;
      const canvas = surface(entry, false);
      if (canvas) target.drawImage(canvas, x - padding, baseline - ascent - padding, width, height);
    },
  };
}
function remember(key, row) {
  bytes -= entries.get(key)?.row.bytes ?? 0;
  entries.delete(key);
  const entry = { row, canvas: null, inkCanvas: null };
  entries.set(key, entry); bytes += row.bytes;
  while (entries.size > 160 || bytes > TEXT_LIMITS.memoryBytes) {
    const oldest = entries.keys().next().value;
    bytes -= entries.get(oldest).row.bytes; entries.delete(oldest);
  }
  return sprite(entry);
}
function flush() {
  if (writing) return writing;
  writing = (async () => {
    await initialized;
    while (queue.size || deferred.size) {
      // Deferred keys retain no pixel buffers beyond the existing bounded LRU.
      for (const key of deferred) {
        const row = entries.get(key)?.row;
        if (!row) { deferred.delete(key); continue; }
        if (queue.size >= TEXT_LIMITS.pendingRecords || queuedBytes + row.bytes > TEXT_LIMITS.pendingBytes) break;
        deferred.delete(key);
        if (!queue.has(row.key)) { queue.set(row.key, row); queuedBytes += row.bytes; }
      }
      if (!queue.size) break;
      const [key, row] = queue.entries().next().value;
      queue.delete(key); queuedBytes -= row.bytes;
      if (namespace && !await store.write({ ...row, namespace, id: JSON.stringify([namespace, key]) })) {
        storageDisabled = true; queue.clear(); deferred.clear(); queuedBytes = 0; break;
      }
    }
  })().finally(() => { writing = null; if (queue.size) flush(); });
  return writing;
}
export const textCache = {
  ready: textCacheReady,
  get(key) {
    const entry = entries.get(key);
    if (!entry) return null;
    entries.delete(key); entries.set(key, entry); stats.memoryHits++;
    return sprite(entry);
  },
  restore(key, persistentKey) {
    const row = warm.get(persistentKey);
    if (!row) return null;
    warm.delete(persistentKey); warmBytes -= row.bytes;
    stats.persistentHits++;
    return remember(key, row);
  },
  put(key, label, persistentKey) {
    const context = label.canvas.getContext('2d'), inkContext = label.ink.getContext('2d');
    if (!context || !inkContext || context.isContextLost?.() || inkContext.isContextLost?.()) return label;
    let data, ink;
    try {
      data = context.getImageData(0, 0, label.canvas.width, label.canvas.height).data;
      ink = inkContext.getImageData(0, 0, label.ink.width, label.ink.height).data;
    } catch { return label; }
    const metrics = Object.fromEntries(['width', 'height', 'advance', 'ascent', 'descent', 'padding'].map(name => [name, label[name]]));
    // Transparent DOM lettering has identical surfaces; persist it only once.
    if (data.every((value, index) => value === ink[index])) ink = null;
    const row = { format: 2, key: persistentKey ?? '', id: '', namespace: '',
      savedAt: Date.now(), pixelWidth: label.canvas.width, pixelHeight: label.canvas.height,
      metrics, data, ink, bytes: data.byteLength + (ink?.byteLength ?? 0),
      checksum: textPixelFingerprint(data, ink ?? []) };
    row.id = JSON.stringify(['', row.key]);
    if (!validTextRecord(row)) return label;
    const result = remember(key, row);
    // No private key, text, metrics or pixels enter a persistence operation.
    if (persistentKey && !storageDisabled) {
      produced.add(persistentKey);
      if (produced.size > 160) produced.delete(produced.values().next().value);
      queuedBytes -= queue.get(persistentKey)?.bytes ?? 0; queue.delete(persistentKey);
      if (queue.size < TEXT_LIMITS.pendingRecords && queuedBytes + row.bytes <= TEXT_LIMITS.pendingBytes) {
        queue.set(persistentKey, row); queuedBytes += row.bytes; flush();
      } else {
        deferred.add(key); stats.deferredWrites++; stats.skippedWrites++;
        if (deferred.size > 160) deferred.delete(deferred.values().next().value);
      }
    }
    return result;
  },
  rendered() { stats.renders++; },
  invalidate,
  clear() { entries.clear(); bytes = 0; },
  stats() { return { ...stats, bytes, warmBytes, queuedBytes, entries: entries.size,
    queued: queue.size, deferred: deferred.size, storageDisabled, namespace, storage: { ...store.stats } }; },
  async settled() { await initialized; while (writing) await writing; },
};
