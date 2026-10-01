export const TEXT_LIMITS = Object.freeze({
  pixels: 524288, records: 64, diskBytes: 24 * 1024 * 1024,
  memoryBytes: 16 * 1024 * 1024, warmBytes: 8 * 1024 * 1024,
  pendingBytes: 8 * 1024 * 1024, pendingRecords: 16, timeout: 400,
});

// Integrity/versioning only. Neither this fingerprint nor a key anonymizes text.
export function textPixelFingerprint(...arrays) {
  let a = 2166136261, b = 5381;
  for (const array of arrays) for (const value of array) {
    a = Math.imul(a ^ value, 16777619);
    b = Math.imul(b, 33) ^ value;
  }
  return `${a >>> 0}:${b >>> 0}`;
}

export function validTextRecord(row) {
  if (!row || typeof row.key !== 'string' || row.key.length > 32768
    || typeof row.namespace !== 'string' || row.namespace.length > 160
    || row.id !== JSON.stringify([row.namespace, row.key])
    || !Number.isFinite(row.savedAt) || row.format !== 2
    || !Number.isInteger(row.pixelWidth) || !Number.isInteger(row.pixelHeight)
    || row.pixelWidth < 1 || row.pixelHeight < 1
    || row.pixelWidth * row.pixelHeight > TEXT_LIMITS.pixels
    || !(row.data instanceof Uint8ClampedArray)
    || (row.ink !== null && !(row.ink instanceof Uint8ClampedArray))
    || row.data.length !== row.pixelWidth * row.pixelHeight * 4
    || (row.ink !== null && row.ink.length !== row.data.length)
    || row.bytes !== row.data.byteLength + (row.ink?.byteLength ?? 0)
    || !row.metrics) return false;
  const { width, height, advance, ascent, descent, padding } = row.metrics;
  if (![width, height, advance, ascent, descent, padding].every(Number.isFinite)
    || width * 4 !== row.pixelWidth || height * 4 !== row.pixelHeight
    || advance < 0 || ascent < 0 || descent < 0 || padding !== 5
    || width !== advance + padding * 2 || height !== ascent + descent + padding * 2) return false;
  return row.checksum === textPixelFingerprint(row.data, row.ink ?? [])
    && row.data.some((value, index) => index % 4 === 3 && value > 0)
    && (row.ink ?? row.data).some((value, index) => index % 4 === 3 && value > 0);
}

export function createTextStore({ name = 'nz-trip-public-pencil-text-v1',
  factory = () => globalThis.indexedDB, timeout = TEXT_LIMITS.timeout, writeTimeout = timeout } = {}) {
  let opening, database;
  const stats = { reads: 0, writes: 0, failures: 0 };
  function open() {
    if (opening) return opening;
    opening = new Promise(resolve => {
      let done = false;
      const finish = db => {
        if (done) { db?.close(); return; }
        done = true; clearTimeout(timer); database = db; resolve(db);
      };
      const timer = setTimeout(() => finish(null), timeout);
      try {
        const request = factory()?.open(name, 1);
        if (!request) { finish(null); return; }
        request.onupgradeneeded = () => {
          if (done) { request.transaction.abort(); return; }
          const store = request.result.createObjectStore('labels', { keyPath: 'id' });
          store.createIndex('namespace', 'namespace');
          store.createIndex('age', ['savedAt', 'bytes']);
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); database = null; opening = null; };
          finish(db);
        };
        request.onerror = request.onblocked = () => { stats.failures++; finish(null); };
      } catch { stats.failures++; finish(null); }
    });
    return opening;
  }
  async function transaction(mode, fallback, run) {
    const db = await open();
    if (!db) return fallback;
    return new Promise(resolve => {
      let tx, done = false, result = fallback;
      const finish = value => {
        if (done) return;
        done = true; clearTimeout(timer); resolve(value);
      };
      const timer = setTimeout(() => {
        stats.failures++;
        try { tx?.abort(); } catch { /* Already completed. */ }
        finish(fallback);
      }, mode === 'readwrite' ? writeTimeout : timeout);
      try {
        tx = db.transaction('labels', mode);
        tx.oncomplete = () => finish(result);
        tx.onerror = tx.onabort = () => { stats.failures++; finish(fallback); };
        run(tx.objectStore('labels'), value => { result = value; });
      } catch { stats.failures++; finish(fallback); }
    });
  }
  return {
    stats,
    read(namespace) {
      stats.reads++;
      return transaction('readonly', [], (store, result) => {
        const rows = []; let bytes = 0, scanned = 0;
        const request = store.index('namespace').openCursor(namespace);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor || scanned++ >= TEXT_LIMITS.records) { result(rows); return; }
          const row = cursor.value;
          if (validTextRecord(row) && bytes + row.bytes <= TEXT_LIMITS.warmBytes) {
            rows.push(row); bytes += row.bytes;
          }
          cursor.continue();
        };
      });
    },
    write(row) {
      if (!validTextRecord(row)) return Promise.resolve(false);
      return transaction('readwrite', false, (store, result) => {
        store.put(row);
        // Scan only metadata keys, not all pixel blobs, in the same transaction.
        const entries = []; let bytes = 0;
        const request = store.index('age').openKeyCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            entries.push({ id: cursor.primaryKey, bytes: cursor.key[1] });
            bytes += cursor.key[1]; cursor.continue(); return;
          }
          while (entries.length > TEXT_LIMITS.records || bytes > TEXT_LIMITS.diskBytes) {
            const oldest = entries.shift(); bytes -= oldest.bytes; store.delete(oldest.id);
          }
          stats.writes++; result(true);
        };
      });
    },
    close() { database?.close(); database = null; opening = null; },
  };
}
