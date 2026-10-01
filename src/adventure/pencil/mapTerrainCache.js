const MAX_PIXELS = 2100000;
const MAX_BYTES = 8 * 1024 * 1024;
const STORE = 'overviews';

export function mapFingerprint(value) {
  let a = 2166136261, b = 2246822519;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b ^ value.charCodeAt(i), 3266489917);
  }
  return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

// These snapshots are memory-only, including when used for private route ink.
export function retainMapSurface(canvas) {
  try { canvas._mapPixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height); }
  catch { canvas._mapPixels = null; }
  return Boolean(canvas._mapPixels);
}

export function restoreMapSurface(canvas) {
  const pixels = canvas?._mapPixels;
  if (!pixels) return false;
  try {
    canvas.width = pixels.width; canvas.height = pixels.height;
    canvas.getContext('2d').putImageData(pixels, 0, 0);
    return true;
  } catch { return false; }
}

export function releaseMapSurface(canvas) {
  if (!canvas) return;
  canvas._mapPixels = null;
  canvas.width = 0; canvas.height = 0;
}

export function mapSurfacePixels(canvas) {
  return canvas.width * canvas.height + (canvas._mapPixels?.data.byteLength ?? 0) / 4;
}

function bounded(work, timeout, late = () => {}) {
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => { done = true; resolve(null); }, timeout);
    Promise.resolve().then(work).then(value => {
      if (done) { late(value); return; }
      done = true; clearTimeout(timer); resolve(value);
    }, () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

function validRecord(record, maxBytes) {
  return record && /^overview:[a-f0-9]{16}$/.test(record.key) &&
    Number.isInteger(record.width) && Number.isInteger(record.height) &&
    record.width > 0 && record.height > 0 && record.width * record.height <= MAX_PIXELS &&
    record.blob instanceof Blob && record.blob.type === 'image/png' &&
    record.blob.size > 32 && record.blob.size <= Math.min(MAX_BYTES, maxBytes) &&
    record.bytes === record.blob.size && /^[a-f0-9]{64}$/.test(record.digest) && Number.isFinite(record.touchedAt);
}

async function digestPng(blob) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function hasInk(canvas) {
  const data = canvas._mapPixels?.data ?? canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i]) return true;
  return false;
}

// Only public, untransformed nationwide terrain is sent to this store. Neither
// routes nor view-centered detail canvases use this API, even when public.
export function createMapTerrainCache({ name = 'nz-public-map-terrain-v1', timeout = 180,
  maxEntries = 6, maxBytes = 24 * 1024 * 1024 } = {}) {
  const stats = { hits: 0, misses: 0, writes: 0, failures: 0, evictions: 0 };
  let opening = null, database = null, closed = false, writing = false;
  const jobs = new Set();
  const open = () => {
    if (closed) return Promise.resolve(null);
    if (opening) return opening;
    opening = bounded(() => new Promise(resolve => {
      let request;
      try { request = indexedDB.open(name, 1); } catch { resolve(null); return; }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    }), timeout, db => db?.close()).then(db => {
      if (closed) { db?.close(); return null; }
      database = db;
      if (db) db.onversionchange = () => { db.close(); database = null; opening = null; };
      else stats.failures++;
      return db;
    });
    return opening;
  };
  const transaction = async (mode, action) => {
    const db = await open();
    if (!db || closed) return null;
    return new Promise(resolve => {
      let tx, timer, value = null, finished = false;
      const finish = result => {
        if (finished) return;
        finished = true; clearTimeout(timer); resolve(result);
      };
      try {
        tx = db.transaction(STORE, mode);
        timer = setTimeout(() => { try { tx.abort(); } catch { /* Already complete. */ } finish(null); }, timeout);
        tx.oncomplete = () => finish(value);
        tx.onabort = tx.onerror = () => { stats.failures++; finish(null); };
        action(tx.objectStore(STORE), result => { value = result; });
      } catch { try { tx?.abort(); } catch { /* Already inactive. */ } stats.failures++; finish(null); }
    });
  };
  const remove = key => transaction('readwrite', (store, result) => { store.delete(key); result(true); });
  const read = async (key, width, height) => {
    const record = await transaction('readonly', (store, result) => {
      store.get(key).onsuccess = event => result(event.target.result);
    });
    if (!validRecord(record, maxBytes) || record.key !== key || record.width !== width || record.height !== height) {
      stats.misses++; if (record) await remove(key); return null;
    }
    const bitmap = await bounded(async () => {
      // Check declared PNG dimensions before invoking an allocating decoder.
      const header = new DataView(await record.blob.slice(0, 24).arrayBuffer());
      if (header.byteLength < 24 || header.getUint32(0) !== 0x89504e47 ||
        header.getUint32(4) !== 0x0d0a1a0a || header.getUint32(12) !== 0x49484452 ||
        header.getUint32(16) !== width || header.getUint32(20) !== height) return null;
      if (await digestPng(record.blob) !== record.digest) return null;
      return createImageBitmap(record.blob);
    }, timeout, image => image?.close());
    if (!bitmap || bitmap.width !== width || bitmap.height !== height || closed) {
      bitmap?.close(); stats.misses++; await remove(key); return null;
    }
    let probe = null, nonblank = false;
    try {
      probe = document.createElement('canvas');
      probe.width = Math.min(32, width); probe.height = Math.min(32, height);
      probe.getContext('2d').drawImage(bitmap, 0, 0, probe.width, probe.height);
      nonblank = hasInk(probe);
    } catch { stats.failures++; }
    finally { releaseMapSurface(probe); }
    if (!nonblank) { bitmap.close(); stats.misses++; await remove(key); return null; }
    stats.hits++;
    return bitmap;
  };
  const write = (key, canvas) => {
    if (closed || writing || !/^overview:[a-f0-9]{16}$/.test(key) ||
      !canvas.width || !canvas.height || canvas.width * canvas.height > MAX_PIXELS) return Promise.resolve(false);
    writing = true;
    const width = canvas.width, height = canvas.height;
    const job = (async () => {
      if (!hasInk(canvas)) return false;
      const blob = await bounded(() => new Promise(resolve => canvas.toBlob(resolve, 'image/png')), timeout * 4);
      if (!blob || blob.size > Math.min(MAX_BYTES, maxBytes)) return false;
      const digest = await bounded(() => digestPng(blob), timeout);
      const record = { key, width, height, blob, bytes: blob.size, digest, touchedAt: Date.now() };
      if (closed || !validRecord(record, maxBytes)) return false;
      const stored = await transaction('readwrite', (store, result) => {
        store.put(record);
        const retained = [];
        store.openCursor().onsuccess = event => {
          const cursor = event.target.result;
          if (!cursor) { result(true); return; }
          const entry = cursor.value;
          if (!validRecord(entry, maxBytes)) { cursor.delete(); stats.evictions++; }
          else {
            retained.push({ key: entry.key, bytes: entry.bytes, touchedAt: entry.touchedAt });
            retained.sort((a, b) => b.touchedAt - a.touchedAt);
            let bytes = retained.reduce((sum, item) => sum + item.bytes, 0);
            while (retained.length > maxEntries || bytes > maxBytes) {
              const oldest = retained.pop(); bytes -= oldest.bytes; store.delete(oldest.key); stats.evictions++;
            }
          }
          cursor.continue();
        };
      });
      if (stored) stats.writes++;
      return Boolean(stored);
    })().catch(() => { stats.failures++; return false; }).finally(() => { writing = false; jobs.delete(job); });
    jobs.add(job);
    return job;
  };
  return { read, write, stats, settled: () => Promise.all([...jobs]),
    dispose() { closed = true; database?.close(); database = null; } };
}
