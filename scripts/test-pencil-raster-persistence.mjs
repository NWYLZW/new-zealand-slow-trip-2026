import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url));
const cacheDir = await mkdtemp(`${root}/work/icon-raster-`);
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PencilIcon } from '/src/adventure/pencil/PencilIcon.jsx';
import { createStopMarker, stopMarkerCacheReady } from '/src/adventure/pencil/stopMarker.js';
import { observeCanvasRecovery, repaintCanvasTree } from '/src/adventure/pencil/canvasRecovery.js';
const root = createRoot(document.getElementById('icons'));
const geometry = 'M 5 6 L 24 6 L 24 26 L 5 26 Z';
const render = (active = false, path = geometry, sourceSize = 32) => root.render(
  React.createElement(PencilIcon, { kind: 'test-icon', active, sourceSize },
    React.createElement('path', { d: path })));
render();
await stopMarkerCacheReady;
document.getElementById('markers').append(createStopMarker(53, { type: 'nature', iconType: 'mountain' }));
observeCanvasRecovery(() => repaintCanvasTree(document.getElementById('markers')));
window.fixture = { render, geometry };
`;
let browser;
const server = await createServer({
  root, configFile: false, base: '/', cacheDir, logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client', 'react/jsx-dev-runtime'] },
  plugins: [react(), {
    name: 'icon-raster-fixture',
    resolveId(id) { if (id === '/__icon-fixture.js') return '\0icon-raster-fixture'; },
    load(id) { if (id === '\0icon-raster-fixture') return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith('/__icon-raster.html') && !request.url?.startsWith('/__icon-empty.html')) return next();
        response.setHeader('Content-Type', 'text/html');
        if (request.url.startsWith('/__icon-empty.html')) { response.end('<!doctype html><html><body></body></html>'); return; }
        response.end(await vite.transformIndexHtml('/__icon-raster.html',
          '<!doctype html><html><head></head><body style="color:rgb(30,60,40)"><div id="icons"></div><div id="markers"></div><script type="module" src="/__icon-fixture.js"></script></body></html>'));
      });
    },
  }],
  server: { host: '127.0.0.1', port: 0 },
});
const errors = [];
async function instrument(page) {
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.counts = { strokes: 0, samples: 0 };
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function (...args) { window.counts.strokes++; return stroke.apply(this, args); };
    const sample = SVGPathElement.prototype.getPointAtLength;
    SVGPathElement.prototype.getPointAtLength = function (...args) { window.counts.samples++; return sample.apply(this, args); };
  });
}
async function pixels(page) {
  return page.evaluate(() => [...document.querySelectorAll('#icons canvas, #markers canvas')].map(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261, ink = 0;
    for (let i = 0; i < data.length; i++) { hash = Math.imul(hash ^ data[i], 16777619); if (i % 4 === 3 && data[i]) ink++; }
    return { width: canvas.width, height: canvas.height, hash: hash >>> 0, ink };
  }));
}
async function waitPaint(page) {
  await page.waitForFunction(() => window.fixture && [...document.querySelectorAll('#icons canvas, #markers canvas')].length === 3
    && [...document.querySelectorAll('#icons canvas, #markers canvas')].every(c =>
      c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v)));
}
async function records(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('nz-trip-pencil-rasters', 2);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction('rasters').objectStore('rasters').getAll();
        request.onsuccess = () => resolve(request.result.map(({ data, ...rest }) => ({ ...rest, bytes: data.byteLength })));
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/__icon-raster.html`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 860, height: 620 }, deviceScaleFactor: 2 });
  let page = await context.newPage(); await instrument(page);
  const coldStart = performance.now();
  await page.goto(url); await waitPaint(page);
  const coldMs = Math.round(performance.now() - coldStart);
  const cold = await pixels(page), coldCounts = await page.evaluate(() => counts);
  assert(coldCounts.strokes > 0 && coldCounts.samples > 0);
  for (let i = 0; i < 50 && (await records(page)).length < 3; i++) await page.waitForTimeout(20);
  assert.equal((await records(page)).length, 3);
  await page.close();
  page = await context.newPage(); await instrument(page);
  const warmStart = performance.now();
  await page.goto(url); await waitPaint(page);
  const warmMs = Math.round(performance.now() - warmStart);
  const warmCounts = await page.evaluate(() => counts);
  assert.deepEqual(await pixels(page), cold, 'Fresh page reuses exact persisted icon/marker pixels');
  assert.equal(warmCounts.strokes, 0, 'Warm launch skips pencil rendering');
  assert.equal(warmCounts.samples, 0, 'Warm launch skips geometry sampling');
  console.log(JSON.stringify({ test: 'cold-vs-warm', coldCounts, warmCounts,
    coldPageToPixelsMs: coldMs, warmPageToPixelsMs: warmMs }));

  for (const event of ['resume', 'contextrestored', 'pageshow']) {
    await page.evaluate(event => {
      for (const canvas of document.querySelectorAll('#icons canvas, #markers canvas')) canvas.width = canvas.width;
      if (event === 'pageshow') window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      else document.dispatchEvent(new Event(event));
    }, event);
    await waitPaint(page);
    assert.deepEqual(await pixels(page), cold, event);
    assert.equal((await page.evaluate(() => counts)).strokes, 0, 'Recovery uses CPU bytes');
  }
  await page.evaluate(() => fixture.render());
  await page.waitForTimeout(40);
  assert.equal((await page.evaluate(() => counts)).strokes, 0, 'New JSX paths with the same content stay cached');
  await page.evaluate(() => {
    document.body.style.color = 'rgb(150,20,30)';
    document.documentElement.dataset.adventureAppearance = 'dark';
  });
  await page.waitForFunction(() => counts.strokes > 0);
  const themePixels = await pixels(page);
  assert.notEqual(themePixels[0].hash, cold[0].hash, 'Actual theme ink changes');
  assert.deepEqual(themePixels.slice(1), cold.slice(1), 'Markers retain their explicit palette');
  const sampledBefore = (await page.evaluate(() => counts)).samples;
  await page.evaluate(() => fixture.render(true));
  await page.waitForTimeout(80);
  assert.notEqual((await pixels(page))[0].hash, themePixels[0].hash, 'Active-state pixels invalidate');
  assert((await page.evaluate(() => counts)).samples >= sampledBefore);
  await page.evaluate(() => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 });
    document.documentElement.dataset.adventureTheme = 'dpr-test';
  });
  await page.waitForFunction(() => document.querySelector('#icons canvas').width === 120);
  assert.equal((await pixels(page))[0].width, 120, 'DPR changes pixel dimensions');
  const previousGeometry = (await pixels(page))[0].hash;
  await page.evaluate(() => fixture.render(true, 'M 4 4 L 27 28', 28));
  await page.waitForTimeout(80);
  assert.notEqual((await pixels(page))[0].hash, previousGeometry, 'Geometry and source size invalidate');
  console.log('PASS real PencilIcon/stopMarker warm reuse, recovery, recreated JSX, theme and selected state');

  const helperResults = await page.evaluate(async () => {
    const { createPencilRasterCache } = await import('/src/adventure/pencil/rasterCache.js');
    const { readRasters, writeRaster, rasterChecksum, rasterFormat } = await import('/src/adventure/pencil/rasterStore.js');
    const make = (color, size = 8) => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').fillStyle = color; c.getContext('2d').fillRect(0, 0, size, size); return c;
    };
    const red = make('rgb(200,30,20)');
    const fingerprint = c => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).join();
    const cache = createPencilRasterCache('helper', 'source-one', 2);
    await cache.ready;
    cache.set('first', red); cache.set('second', red);
    const first = cache.get('first'); first.width = first.width;
    const silentRecovery = fingerprint(cache.get('first')) === fingerprint(red);
    cache.invalidate();
    const cpuRecovery = fingerprint(cache.get('first')) === fingerprint(red);
    cache.set('third', red);
    const lru = !cache.get('second') && !!cache.get('first') && !!cache.get('third');
    const blank = document.createElement('canvas'); blank.width = blank.height = 8;
    cache.set('first', blank);
    const rejectBlank = fingerprint(cache.get('first')) === fingerprint(red);
    const lost = make('blue');
    lost.getContext('2d').isContextLost = () => true;
    cache.set('first', lost);
    const rejectLost = fingerprint(cache.get('first')) === fingerprint(red);
    cache.set('oversize', make('red', 129));
    const bounded = cache.get('oversize') === null;
    await cache.settled();
    const unchanged = createPencilRasterCache('helper', 'source-one', 2);
    await unchanged.settled();
    const reuse = fingerprint(unchanged.get('first')) === fingerprint(red);
    const changed = createPencilRasterCache('helper', 'source-two', 2);
    await changed.settled();
    const invalidated = changed.get('first') === null;
    const unavailable = createPencilRasterCache('unavailable', 'source', 1);
    unavailable.set('good', red);
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    let unavailableSafe;
    try { unavailableSafe = unavailable.get('good') === null; }
    finally { HTMLCanvasElement.prototype.getContext = originalGetContext; }
    unavailableSafe &&= !!unavailable.get('good');
    await unavailable.settled();

    const racingWrites = createPencilRasterCache('latest-write', 'source', 1);
    await racingWrites.settled();
    for (let i = 0; i < 40; i++) {
      racingWrites.set('same', make(i % 2 ? 'blue' : 'red'));
      await Promise.resolve();
    }
    await racingWrites.settled();
    const reloadedWrites = createPencilRasterCache('latest-write', 'source', 1);
    await reloadedWrites.settled();
    const latestWrite = fingerprint(reloadedWrites.get('same')) === fingerprint(make('blue'));

    const base = { namespace: 'bounded:test', format: rasterFormat, width: 1, height: 1,
      data: new Uint8ClampedArray([120, 40, 70, 255]), savedAt: Date.now() };
    base.checksum = rasterChecksum(base);
    // Sequential batches exercise on-disk eviction, not just pending-queue caps.
    for (let start = 0; start < 280; start += 16) await Promise.all(Array.from({ length: 16 }, (_, i) => {
      const key = String(start + i);
      return writeRaster({ ...base, key, id: JSON.stringify([base.namespace, key]), savedAt: base.savedAt + start + i });
    }));
    const rows = await readRasters(base.namespace, 256);
    return { silentRecovery, cpuRecovery, lru, rejectBlank, rejectLost, bounded, reuse, invalidated,
      unavailableSafe, latestWrite, readCap: rows.length <= 256, newest: rows[0].key === '287' };
  });
  for (const [name, result] of Object.entries(helperResults)) assert(result, name);
  assert((await records(page)).length <= 256, 'Disk transaction enforces global cap');
  console.log(JSON.stringify({ test: 'cache-and-disk-bounds', ...helperResults }));

  const corruption = await page.evaluate(async () => {
    const { readRasters, validRaster } = await import('/src/adventure/pencil/rasterStore.js');
    const db = await new Promise(resolve => { const r = indexedDB.open('nz-trip-pencil-rasters', 2); r.onsuccess = () => resolve(r.result); });
    let corruptKey;
    await new Promise(resolve => {
      const tx = db.transaction('rasters', 'readwrite'), store = tx.objectStore('rasters');
      const r = store.getAll(); r.onsuccess = () => {
        const row = r.result.find(r => r.namespace === 'bounded:test');
        corruptKey = row.key;
        row.data[0] ^= 255; store.put(row);
        const mismatched = { ...row, id: 'wrong-identity', checksum: row.checksum };
        store.put(mismatched);
      }; tx.oncomplete = resolve;
    });
    db.close();
    const rows = await readRasters('bounded:test', 256);
    return rows.length >= 254 && rows.length <= 255
      && rows.every(r => validRaster(r) && r.key !== corruptKey);
  });
  assert(corruption, 'Corrupt nonblank pixels and mismatched identities are rejected');
  const fullSize = await page.evaluate(async () => {
    const { writeRaster, readRasters, rasterChecksum, rasterFormat } = await import('/src/adventure/pencil/rasterStore.js');
    const base = { namespace: 'full-size:test', format: rasterFormat, width: 128, height: 128,
      data: new Uint8ClampedArray(128 * 128 * 4).fill(255), savedAt: Date.now() + 1000 };
    base.checksum = rasterChecksum(base);
    for (let start = 0; start < 256; start += 16) {
      const written = await Promise.all(Array.from({ length: 16 }, (_, i) => {
        const key = String(start + i);
        return writeRaster({ ...base, key, id: JSON.stringify([base.namespace, key]), savedAt: base.savedAt + start + i });
      }));
      if (written.some(success => !success)) throw Error('Full-size batch failed');
    }
    const start = performance.now();
    const rows = await readRasters(base.namespace, 256);
    return { rows: rows.length, bytes: rows.reduce((sum, row) => sum + row.data.byteLength, 0),
      readMs: Math.round(performance.now() - start) };
  });
  assert.equal(fullSize.rows, 128); assert.equal(fullSize.bytes, 8 * 1024 * 1024);
  const fullDisk = await records(page);
  assert.equal(fullDisk.length, 256);
  assert.equal(fullDisk.reduce((sum, row) => sum + row.bytes, 0), 16 * 1024 * 1024);
  console.log(JSON.stringify({ test: 'full-size-read-byte-cap', ...fullSize, diskBytes: 16 * 1024 * 1024 }));
  await context.close();

  // Delay DB delivery, then write and evict locally before old rows can hydrate.
  const raceContext = await browser.newContext();
  const race = await raceContext.newPage();
  await race.goto(url); await waitPaint(race);
  await race.evaluate(async () => {
    const { createPencilRasterCache } = await import('/src/adventure/pencil/rasterCache.js');
    const cache = createPencilRasterCache('race', 'v1', 1);
    const c = document.createElement('canvas'); c.width = c.height = 4;
    c.getContext('2d').fillStyle = 'red'; c.getContext('2d').fillRect(0, 0, 4, 4);
    cache.set('old', c); await cache.settled();
  });
  await race.close();
  const delayed = await raceContext.newPage();
  await delayed.addInitScript(() => {
    const real = indexedDB;
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: {
      open(...args) {
        const actual = real.open(...args), proxy = {};
        actual.onupgradeneeded = event => { proxy.result = actual.result; proxy.transaction = actual.transaction; proxy.onupgradeneeded?.(event); };
        actual.onsuccess = event => { proxy.result = actual.result; setTimeout(() => proxy.onsuccess?.(event), 120); };
        actual.onerror = event => proxy.onerror?.(event);
        actual.onblocked = event => proxy.onblocked?.(event);
        return proxy;
      },
    } });
  });
  // No app fixture: run helpers before the delayed database connection is ready.
  await delayed.goto(url.replace('__icon-raster.html', '__icon-empty.html'));
  const raceResult = await delayed.evaluate(async () => {
    const { createPencilRasterCache } = await import('/src/adventure/pencil/rasterCache.js');
    const cache = createPencilRasterCache('race', 'v1', 1);
    const start = performance.now(); await cache.ready; const readyMs = performance.now() - start;
    const c = document.createElement('canvas'); c.width = c.height = 4;
    c.getContext('2d').fillStyle = 'blue'; c.getContext('2d').fillRect(0, 0, 4, 4);
    cache.set('old', c); cache.set('new', c);
    await cache.settled();
    return { readyMs, oldMissing: !cache.get('old'),
      newBlue: cache.get('new').getContext('2d').getImageData(0, 0, 1, 1).data[2] === 255 };
  });
  assert(raceResult.readyMs < 90, 'UI does not wait for delayed storage');
  assert(raceResult.oldMissing && raceResult.newBlue, 'Late hydration never resurrects evicted local keys');
  await raceContext.close();
  const deniedContext = await browser.newContext({ viewport: { width: 436, height: 900 }, deviceScaleFactor: 3 });
  const denied = await deniedContext.newPage(); await instrument(denied);
  await denied.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true,
    get() { throw new DOMException('denied', 'SecurityError'); } }));
  await denied.goto(url); await waitPaint(denied);
  assert((await pixels(denied)).every(result => result.ink > 0), 'Storage denial keeps narrow-viewport DPR3 icons painted');
  await deniedContext.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ test: 'late-hydration', ...raceResult }));
  console.log('PASS isolated Chromium persistence checks; synthetic evidence only, not real-device acceptance');
} finally {
  await browser?.close();
  await server.close();
  await rm(cacheDir, { recursive: true, force: true });
}
