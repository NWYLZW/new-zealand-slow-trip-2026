import assert from 'node:assert/strict';
import { rasterChecksum, rasterFormat, rasterLimits, validRaster } from '../src/adventure/pencil/rasterStore.js';

let serial = 0;
const fresh = () => import(`../src/adventure/pencil/rasterStore.js?case=${++serial}`);
function row(key = 'key', width = 4, value = 70) {
  const record = { namespace: 'test:source', key, id: JSON.stringify(['test:source', key]),
    width, height: width, format: rasterFormat, savedAt: Date.now(),
    data: new Uint8ClampedArray(width * width * 4).fill(value) };
  record.checksum = rasterChecksum(record);
  return record;
}
function factory(mode = 'success') {
  const state = { closes: 0, aborts: 0, committed: [], puts: [], transactions: 0 };
  const db = {
    close() { state.closes++; },
    transaction() {
      state.transactions++;
      const records = [];
      const transaction = {
        abort() { state.aborts++; transaction.aborted = true; queueMicrotask(() => transaction.onabort?.()); },
        objectStore() {
          return {
            put(record) {
              if (mode === 'quota') throw new DOMException('full', 'QuotaExceededError');
              records.push(record); state.puts.push(record);
            },
            count() {
              const request = { result: 0 };
              queueMicrotask(() => request.onsuccess?.());
              if (mode !== 'stall' || state.transactions > 1) setTimeout(() => {
                if (transaction.aborted) return;
                state.committed.push(...records); transaction.oncomplete?.();
              }, 0);
              return request;
            },
          };
        },
      };
      return transaction;
    },
  };
  return { state, open() {
    const request = { result: db };
    if (mode === 'blocked') {
      queueMicrotask(() => request.onblocked?.());
      setTimeout(() => request.onsuccess?.(), 10);
    } else if (mode === 'denied') queueMicrotask(() => request.onerror?.());
    else if (mode !== 'open-stall') queueMicrotask(() => request.onsuccess?.());
    return request;
  } };
}
function install(value) {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value });
}
const bounded = async (promise, label) => {
  const start = performance.now();
  const result = await promise;
  assert(performance.now() - start < 1800, label);
  return result;
};

assert(validRaster(row()));
for (const patch of [
  { id: 'wrong' }, { namespace: 'wrong' }, { key: '' }, { width: 0 },
  { width: 129 }, { height: .5 }, { format: 'old' }, { savedAt: Infinity },
  { data: new Uint8Array(64) }, { checksum: 42 }, { key: 'x'.repeat(rasterLimits.keyLength + 1) },
]) assert(!validRaster({ ...row(), ...patch }));
const blank = row(); blank.data.fill(0); blank.checksum = rasterChecksum(blank);
assert(!validRaster(blank));
const corrupt = row(); corrupt.data[0]++; assert(!validRaster(corrupt));
const reshaped = row(); reshaped.width = 8; reshaped.height = 2; assert(!validRaster(reshaped));
console.log('PASS schema: identity, dimensions, format, metadata, alpha and checksum');

for (const mode of ['absent', 'throw', 'denied', 'blocked', 'open-stall', 'quota']) {
  const adapter = factory(mode);
  install(mode === 'absent' ? undefined : mode === 'throw' ? { open() { throw Error('denied'); } } : adapter);
  const store = await fresh();
  assert.equal(await bounded(store.writeRaster(row()), mode), false);
  assert.deepEqual(await store.readRasters('test:source'), []);
  if (mode === 'blocked') {
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(adapter.state.closes, 1, 'Late blocked-open success closes its connection');
  }
}
Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get() { throw Error('security'); } });
assert.equal(await (await fresh()).writeRaster(row()), false);
console.log('PASS unavailable/throwing storage, blocked late success, open timeout and quota');

const stalled = factory('stall'); install(stalled);
const store = await fresh();
assert.equal(await bounded(store.writeRaster(row('old')), 'write timeout'), false);
assert.equal(stalled.state.aborts, 1);
assert.equal(await store.writeRaster(row('new')), true);
assert.deepEqual(stalled.state.committed.map(item => item.key), ['new']);
console.log('PASS stalled transaction aborts and subsequent writes progress without late commit');

const coalesced = factory(); install(coalesced);
const coalescingStore = await fresh();
const original = row('same', 4, 30);
const first = coalescingStore.writeRaster(original);
const second = coalescingStore.writeRaster(row('same', 4, 50));
original.data.fill(0);
assert.deepEqual(await Promise.all([first, second]), [false, true]);
assert.equal(coalesced.state.committed.length, 1);
assert.equal(coalesced.state.committed[0].data[0], 50);
const mutable = row('snapshot');
const snapshotWrite = coalescingStore.writeRaster(mutable); mutable.data.fill(0);
assert.equal(await snapshotWrite, true);
assert(validRaster(coalesced.state.committed.at(-1)), 'Pending bytes are owned copies');

const capped = factory(); install(capped);
const cappedStore = await fresh();
const outcomes = await Promise.all(Array.from({ length: 300 }, (_, index) =>
  cappedStore.writeRaster(row(String(index), 128))));
assert.equal(outcomes.filter(Boolean).length, 128, 'Pending byte cap keeps at most 8MiB');
assert.equal(capped.state.committed.reduce((sum, entry) => sum + entry.data.byteLength, 0), rasterLimits.memoryBytes);
const countCapped = factory(); install(countCapped);
const countStore = await fresh();
const countOutcomes = await Promise.all(Array.from({ length: 300 }, (_, index) => countStore.writeRaster(row(String(index)))));
assert.equal(countOutcomes.filter(Boolean).length, rasterLimits.records);
console.log('PASS coalescing, byte ownership, 8MiB pending-byte cap and 256 pending-record cap');

const recovery = await import('../src/adventure/pencil/canvasRecovery.js');
globalThis.document = new EventTarget(); globalThis.window = new EventTarget();
document.visibilityState = 'visible';
let nextFrame = 0;
const frames = new Map();
globalThis.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
let invalidations = 0, repaints = 0;
const releaseBad = recovery.registerCanvasCache({ invalidate() { throw Error('lost'); } });
const releasePixels = recovery.registerCanvasCache({ invalidate() { invalidations++; }, clear() { assert.fail('must retain CPU pixels'); } });
const stopBad = recovery.observeCanvasRecovery(() => { throw Error('independent painter unavailable'); });
const stop = recovery.observeCanvasRecovery(() => { repaints++; });
document.dispatchEvent(new Event('resume')); document.dispatchEvent(new Event('contextrestored'));
assert.equal(frames.size, 1);
for (const callback of frames.values()) callback(); frames.clear();
assert.equal(invalidations, 1); assert.equal(repaints, 1);
stopBad(); stop(); releaseBad(); releasePixels();
assert.equal(frames.size, 0);
console.log('PASS recovery invalidates CPU-cache surfaces and isolates failed painters');
