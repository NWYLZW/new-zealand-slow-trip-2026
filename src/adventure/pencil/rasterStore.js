const databaseName = 'nz-trip-pencil-rasters';
const storeName = 'rasters';
export const rasterFormat = 'rgba8-srgb-v2';
export const rasterLimits = Object.freeze({ records: 256, pixels: 128 * 128,
  dimension: 128, keyLength: 16384, memoryBytes: 8 * 1024 * 1024, timeout: 250 });
let databasePromise;
const pending = new Map();
let pendingBytes = 0;
let draining = false;

export function rasterChecksum({ width, height, data }) {
  let hash = Math.imul(2166136261 ^ width, 16777619);
  hash = Math.imul(hash ^ height, 16777619);
  for (const value of data) hash = Math.imul(hash ^ value, 16777619);
  return hash >>> 0;
}

export function validRaster(record) {
  if (!record || record.format !== rasterFormat
    || typeof record.namespace !== 'string' || !record.namespace.length || record.namespace.length > 160
    || typeof record.key !== 'string' || !record.key.length || record.key.length > rasterLimits.keyLength
    || record.id !== JSON.stringify([record.namespace, record.key])
    || !Number.isSafeInteger(record.savedAt) || record.savedAt < 0
    || !Number.isInteger(record.width) || !Number.isInteger(record.height)
    || record.width < 1 || record.height < 1
    || record.width > rasterLimits.dimension || record.height > rasterLimits.dimension
    || record.width * record.height > rasterLimits.pixels
    || !(record.data instanceof Uint8ClampedArray)
    || record.data.length !== record.width * record.height * 4
    || record.checksum !== rasterChecksum(record)) return false;
  for (let index = 3; index < record.data.length; index += 4) {
    if (record.data[index]) return true;
  }
  return false;
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true; clearTimeout(timer); resolve(value);
    };
    const timer = setTimeout(() => finish(null), rasterLimits.timeout);
    try {
      if (!globalThis.indexedDB) { finish(null); return; }
      const request = indexedDB.open(databaseName, 2);
      request.onupgradeneeded = () => {
        if (settled) { request.transaction.abort(); return; }
        const db = request.result;
        // This database contains disposable public icon pixels only.
        if (db.objectStoreNames.contains(storeName)) db.deleteObjectStore(storeName);
        const store = db.createObjectStore(storeName, { keyPath: 'id' });
        store.createIndex('namespaceSavedAt', ['namespace', 'savedAt']);
        store.createIndex('savedAt', 'savedAt');
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) { db.close(); return; }
        db.onversionchange = () => { db.close(); databasePromise = null; };
        db.onclose = () => { databasePromise = null; };
        finish(db);
      };
      request.onerror = request.onblocked = () => finish(null);
    } catch { finish(null); }
  });
  return databasePromise;
}

// Abort on timeout as well as settling the caller: a late commit must not race a
// newer write after the queue has moved on. All paths are bounded and fail open.
function transact(db, mode, fallback, run) {
  return new Promise(resolve => {
    let transaction;
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true; clearTimeout(timer); resolve(result);
    };
    const cancel = () => {
      try { transaction?.abort(); } catch { /* Already inactive. */ }
      finish(fallback);
    };
    const timer = setTimeout(cancel, rasterLimits.timeout);
    try {
      transaction = db.transaction(storeName, mode);
      transaction.onabort = () => finish(fallback);
      transaction.onerror = cancel;
      const result = run(transaction.objectStore(storeName), cancel);
      transaction.oncomplete = () => finish(result);
    } catch { cancel(); }
  });
}

export async function readRasters(namespace, limit = 128) {
  const db = await openDatabase();
  if (!db) return [];
  const countLimit = Math.max(0, Math.min(rasterLimits.records, Math.floor(limit) || 0));
  if (!countLimit) return [];
  return transact(db, 'readonly', [], (store, cancel) => {
    const rows = [];
    let visited = 0, bytes = 0;
    const range = IDBKeyRange.bound([namespace, 0], [namespace, Number.MAX_SAFE_INTEGER]);
    const request = store.index('namespaceSavedAt').openCursor(range, 'prev');
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) return;
        const record = cursor.value;
        visited++;
        if (record.namespace === namespace && validRaster(record)) {
          if (bytes + record.data.byteLength > rasterLimits.memoryBytes) return;
          rows.push(record); bytes += record.data.byteLength;
        }
        if (rows.length < countLimit && visited < rasterLimits.records) cursor.continue();
      } catch { cancel(); }
    };
    return rows;
  });
}

async function flushPending() {
  try {
    const db = await openDatabase();
    while (pending.size) {
      const batch = [...pending.values()].slice(0, 16);
      for (const item of batch) {
        pending.delete(item.record.id); pendingBytes -= item.record.data.byteLength;
      }
      const success = db ? await transact(db, 'readwrite', false, (store, cancel) => {
        for (const { record } of batch) store.put(record);
        const count = store.count();
        count.onsuccess = () => {
          try {
            let excess = count.result - rasterLimits.records;
            if (excess <= 0) return;
            const request = store.index('savedAt').openKeyCursor();
            request.onsuccess = () => {
              try {
                const cursor = request.result;
                if (!cursor || excess-- <= 0) return;
                store.delete(cursor.primaryKey); cursor.continue();
              } catch { cancel(); }
            };
          } catch { cancel(); }
        };
        return true;
      }) : false;
      for (const item of batch) item.resolve(success);
    }
  } finally { draining = false; }
}

export function writeRaster(record) {
  if (!validRaster(record)) return Promise.resolve(false);
  // Own the bytes across asynchronous writes. Replace pending same-key writes,
  // and settle superseded/evicted callers instead of retaining promise chains.
  const { id, namespace, key, format, width, height, savedAt, checksum } = record;
  const copy = { id, namespace, key, format, width, height, savedAt, checksum, data: record.data.slice() };
  const previous = pending.get(copy.id);
  if (previous) {
    pendingBytes -= previous.record.data.byteLength;
    pending.delete(copy.id); previous.resolve(false);
  }
  const result = new Promise(resolve => pending.set(copy.id, { record: copy, resolve }));
  pendingBytes += copy.data.byteLength;
  while (pending.size > rasterLimits.records || pendingBytes > rasterLimits.memoryBytes) {
    const [id, item] = pending.entries().next().value;
    pending.delete(id); pendingBytes -= item.record.data.byteLength; item.resolve(false);
  }
  if (!draining) { draining = true; queueMicrotask(flushPending); }
  return result;
}
