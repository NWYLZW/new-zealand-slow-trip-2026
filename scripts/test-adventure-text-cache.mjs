import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url));
const cacheDir = await mkdtemp(`${root}/work/text-cache-vite-`);
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PencilText, PencilTextPersistenceProvider } from '/src/adventure/pencil/PencilText.jsx';
import { mapLabel, textCacheReady } from '/src/adventure/pencil/mapLabels.js';
import { clearPencilLabels } from '/src/adventure/pencil/label.js';
import { textCache, textFontState } from '/src/adventure/pencil/textCache.js';
import { createTextStore, validTextRecord, TEXT_LIMITS, textPixelFingerprint } from '/src/adventure/pencil/textStore.js';
import fontUrl from '/src/adventure/assets/ui-hand-yozai.woff2?url';
import '/src/adventure/pencil-map.css';
const font = new FontFace('Trip Map Hand', 'url(' + fontUrl + ')');
await font.load(); document.fonts.add(font);
await document.fonts.load('19px "Trip Map Hand"', 'Public map label');
await document.fonts.ready;
const start = performance.now(); await textCacheReady;
const readyWait = performance.now() - start;
if (!new URLSearchParams(location.search).has('early')) await textCache.settled();
const ui = createRoot(document.getElementById('fixture'));
window.api = { mapLabel, clearPencilLabels, textCache, textFontState, createTextStore,
  validTextRecord, TEXT_LIMITS, textPixelFingerprint, readyWait, fontUrl,
  mount(huge = false) {
    const h = React.createElement;
    ui.render(h(React.Fragment, null,
      h('section', { id: 'public' }, h(PencilTextPersistenceProvider, { persistence: 'public' },
        h(PencilText, null, huge ? 'Oversized native text '.repeat(300) :
          'Public waterfront walking notes with native wrapping and selectable words.'),
        h('div', { id: 'override' }, h(PencilText, { persistence: 'memory' }, 'SYNTHETIC_PRIVATE_OVERRIDE')))),
      h('section', { id: 'private' }, h(PencilText, null, 'SYNTHETIC_PRIVATE_DEFAULT'))));
  },
};
`;
const server = await createServer({
  root, configFile: false, cacheDir, base: '/',
  optimizeDeps: { entries: [], include: ['react', 'react-dom/client', 'react/jsx-dev-runtime'] },
  plugins: [react(), {
    name: 'text-cache-test-fixture',
    resolveId(id) { if (id === 'virtual:text-cache-fixture') return '\0virtual:text-cache-fixture'; },
    load(id) { if (id === '\0virtual:text-cache-fixture') return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/text-cache-fixture.html') return next();
        const html = await vite.transformIndexHtml(req.url, `<!doctype html><html><head>
          <style>:root{--trip-handwriting:"Trip Map Hand",cursive}
          #fixture{font:400 18px/1.6 "Trip Map Hand",cursive;color:#263d31}
          section{max-width:260px;margin:16px}body{margin:0}</style></head><body>
          <main id="fixture"></main><script type="module" src="/@id/__x00__virtual:text-cache-fixture"></script></body></html>`);
        res.setHeader('Content-Type', 'text/html'); res.end(html);
      });
    },
  }],
  server: { host: '127.0.0.1', port: 0 }, logLevel: 'error',
});
let browser;
const errors = [];
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/text-cache-fixture.html`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const load = async () => {
    await page.goto(url);
    await page.waitForFunction(() => window.api);
  };
  const render = () => page.evaluate(async () => {
    const { api } = window;
    api.clearPencilLabels();
    const start = performance.now();
    const label = api.mapLabel('Public map label', 19, 71, '#263d31', 'transparent', { persistence: 'public' });
    const elapsed = performance.now() - start;
    const fingerprint = api.textPixelFingerprint(label.ink.getContext('2d').getImageData(0, 0, label.ink.width, label.ink.height).data);
    window.held = label;
    await api.textCache.settled();
    return { elapsed, fingerprint, stats: api.textCache.stats(), readyWait: api.readyWait };
  });
  await load();
  const cold = await render();
  assert.equal(cold.stats.renders, 1);
  assert.equal(cold.stats.storage.writes, 1);
  await load();
  const warm = await render();
  assert.equal(warm.stats.renders, 0, 'Warm public label skips pigment/distance synthesis');
  assert.equal(warm.stats.persistentHits, 1);
  assert.equal(warm.fingerprint, cold.fingerprint);
  const recovery = await page.evaluate(() => {
    const { api, held } = window;
    const previous = held.ink;
    previous.width = previous.width;
    api.clearPencilLabels();
    api.textCache.invalidate();
    const target = document.createElement('canvas'); target.width = 300; target.height = 80;
    held.draw(target.getContext('2d'), 20, 40);
    return {
      differentSurface: previous !== held.ink,
      fingerprint: api.textPixelFingerprint(held.ink.getContext('2d').getImageData(0, 0, held.ink.width, held.ink.height).data),
      drawn: target.getContext('2d').getImageData(0, 0, 300, 80).data.some((v, i) => i % 4 === 3 && v),
      renders: api.textCache.stats().renders,
    };
  });
  assert(recovery.differentSurface && recovery.drawn);
  assert.equal(recovery.fingerprint, cold.fingerprint);
  assert.equal(recovery.renders, 0, 'Held sprites survive clear/eviction without resynthesis');

  const versions = await page.evaluate(() => {
    const { api } = window;
    const before = api.textCache.stats().renders;
    for (const [size, seed, color, family] of [
      [20, 71, '#263d31', undefined], [19, 72, '#263d31', undefined],
      [19, 71, '#eeeeee', undefined], [19, 71, '#263d31', 'serif'],
    ]) api.mapLabel('Public map label', size, seed, color, 'transparent', { persistence: 'public', family });
    const stateBefore = api.textFontState('19px "Trip Map Hand"', 'Public').key;
    document.fonts.add(new FontFace('SyntheticFontIdentity', 'local("Arial")'));
    const stateAfter = api.textFontState('19px "Trip Map Hand"', 'Public').key;
    let oversized = false;
    try { api.mapLabel('x'.repeat(3000)); } catch (error) { oversized = error instanceof RangeError; }
    return { misses: api.textCache.stats().renders - before, fontIdentityChanged: stateBefore !== stateAfter, oversized };
  });
  assert.equal(versions.misses, 4);
  assert(versions.fontIdentityChanged && versions.oversized);

  const fonts = await page.evaluate(async () => {
    const { api } = window;
    const delayed = new FontFace('SyntheticDelayedHand', 'url(' + api.fontUrl + ')');
    document.fonts.add(delayed);
    await api.textCache.settled();
    const before = api.textCache.stats().storage.writes;
    api.mapLabel('Font loading probe', 19, 81, '#263d31', 'transparent',
      { persistence: 'public', family: '"SyntheticDelayedHand",serif' });
    await api.textCache.settled();
    const unloadedWrites = api.textCache.stats().storage.writes - before;
    await document.fonts.load('19px "SyntheticDelayedHand"', 'Font loading probe');
    await document.fonts.ready;
    api.mapLabel('Font loading probe', 19, 81, '#263d31', 'transparent',
      { persistence: 'public', family: '"SyntheticDelayedHand",serif' });
    await api.textCache.settled();
    return { unloadedWrites, loadedWrites: api.textCache.stats().storage.writes - before };
  });
  assert.equal(fonts.unloadedWrites, 0, 'Unloaded/fallback fonts are not persisted');
  assert.equal(fonts.loadedWrites, 1);

  await page.evaluate(() => window.api.mount());
  await page.waitForFunction(() => [...document.querySelectorAll('.trip-pencil-text')].length === 3
    && [...document.querySelectorAll('.trip-pencil-text')].every(node => node.dataset.pencilReady === 'true'));
  const dom = await page.evaluate(async () => {
    const { api } = window;
    await api.textCache.settled();
    const node = document.querySelector('#public .trip-pencil-text');
    const range = document.createRange(); range.selectNodeContents(node.firstChild);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    const selected = selection.toString(); selection.removeAllRanges();
    const db = await new Promise(resolve => {
      const request = indexedDB.open('nz-trip-public-pencil-text-v1');
      request.onsuccess = () => resolve(request.result);
    });
    const rows = await new Promise(resolve => {
      const request = db.transaction('labels').objectStore('labels').getAll();
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return { selected, text: node.textContent, lines: Number(node.querySelector('canvas').dataset.lines),
      canvasHidden: node.querySelector('canvas').getAttribute('aria-hidden'),
      privateStored: rows.some(row => row.key.includes('SYNTHETIC_PRIVATE')),
      publicStored: rows.some(row => row.key.includes('Public waterfront')),
      rows: rows.length };
  });
  assert.equal(dom.selected, dom.text);
  assert(dom.lines > 1 && dom.canvasHidden === 'true');
  assert.equal(dom.privateStored, false);
  assert(dom.publicStored);
  await page.setViewportSize({ width: 360, height: 700 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => document.documentElement.setAttribute('data-adventure-theme', 'synthetic'));
  await page.waitForFunction(() => document.querySelector('#public .trip-pencil-text').dataset.pencilReady === 'true');
  await page.evaluate(() => window.api.mount(true));
  await page.waitForFunction(() => document.querySelector('#public .trip-pencil-text').textContent.length > 4096);
  assert.equal(await page.locator('#public .trip-pencil-text').first().getAttribute('data-pencil-ready'), null);

  const memory = await page.evaluate(async () => {
    const { api, held } = window;
    await api.textCache.settled();
    const before = api.textCache.stats().storage.writes;
    const nullCanvas = { getContext: () => null };
    const lostCanvas = { getContext: () => ({ isContextLost: () => true }) };
    for (const canvas of [nullCanvas, lostCanvas]) {
      api.textCache.put('synthetic-unavailable', { ...held, canvas }, 'synthetic-unavailable');
    }
    const original = HTMLCanvasElement.prototype.getContext;
    api.textCache.invalidate();
    HTMLCanvasElement.prototype.getContext = () => null;
    const nullSurface = held.ink === null;
    HTMLCanvasElement.prototype.getContext = original;
    const restored = held.ink !== null;
    for (let i = 0; i < 64; i++) api.textCache.put('memory-' + i, held, null);
    await api.textCache.settled();
    const memoryOnlyWrites = api.textCache.stats().storage.writes - before;
    for (let i = 0; i < 36; i++) api.textCache.put('queue-' + i, held, 'synthetic-public-queue-' + i);
    const peak = api.textCache.stats();
    await api.textCache.settled();
    return { nullSurface, restored, memoryOnlyWrites, peak, settled: api.textCache.stats() };
  });
  assert(memory.nullSurface && memory.restored);
  assert.equal(memory.memoryOnlyWrites, 0);
  assert(memory.peak.bytes <= 16 * 1024 * 1024);
  assert(memory.peak.queuedBytes <= 8 * 1024 * 1024 && memory.peak.queued <= 16);
  assert(memory.peak.skippedWrites > 0 && memory.settled.queued === 0);

  const storage = await page.evaluate(async () => {
    const { api } = window;
    const data = new Uint8ClampedArray(2048 * 256 * 4); data[3] = 255;
    const ink = new Uint8ClampedArray(data);
    const template = { format: 2, namespace: 'synthetic', key: '0', id: '["synthetic","0"]',
      savedAt: 1, pixelWidth: 2048, pixelHeight: 256, data, ink, bytes: data.byteLength + ink.byteLength,
      metrics: { width: 512, height: 64, advance: 502, ascent: 40, descent: 14, padding: 5 },
      checksum: api.textPixelFingerprint(data, ink) };
    const store = api.createTextStore({ name: 'synthetic-text-bounds', timeout: 1000 });
    for (let i = 0; i < 9; i++) {
      const key = String(i);
      if (!await store.write({ ...template, key, id: JSON.stringify(['synthetic', key]), savedAt: i })) throw new Error('Synthetic store write failed');
    }
    const db = await new Promise(resolve => {
      const request = indexedDB.open('synthetic-text-bounds'); request.onsuccess = () => resolve(request.result);
    });
    const keys = await new Promise(resolve => {
      const keys = [];
      const request = db.transaction('labels').objectStore('labels').index('age').openKeyCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve(keys); return; }
        keys.push(cursor.key); cursor.continue();
      };
    });
    const rows = await store.read('synthetic');
    const wrongVersion = await store.read('different-source-version');
    const invalid = !api.validTextRecord({ ...template, checksum: 'corrupt' })
      && !api.validTextRecord({ ...template, ink: new Uint8ClampedArray(4) })
      && !api.validTextRecord({ ...template, metrics: { ...template.metrics, advance: -1 } });
    const denied = api.createTextStore({ factory: () => { throw new DOMException('Denied', 'SecurityError'); }, timeout: 20 });
    const blocked = api.createTextStore({ factory: () => ({ open: () => ({}) }), timeout: 20 });
    const start = performance.now();
    const deniedResult = await denied.write(template), blockedResult = await blocked.read('synthetic');
    const wait = performance.now() - start;
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = () => { throw new DOMException('Quota', 'QuotaExceededError'); };
    const quotaResult = await store.write(template);
    IDBObjectStore.prototype.put = originalPut;
    const smallData = new Uint8ClampedArray(40 * 60 * 4); smallData[3] = 255;
    const small = { ...template, pixelWidth: 40, pixelHeight: 60, data: smallData, ink: null,
      bytes: smallData.byteLength, metrics: { width: 10, height: 15, advance: 0, ascent: 4, descent: 1, padding: 5 },
      checksum: api.textPixelFingerprint(smallData) };
    for (let i = 0; i < 70; i++) {
      const key = 'small-' + i;
      await store.write({ ...small, key, id: JSON.stringify(['synthetic', key]), savedAt: 100 + i });
    }
    const count = await new Promise(resolve => {
      const request = db.transaction('labels').objectStore('labels').count(); request.onsuccess = () => resolve(request.result);
    });
    await new Promise(resolve => {
      const tx = db.transaction('labels', 'readwrite');
      tx.objectStore('labels').put({ ...small, key: 'small-69', id: '["synthetic","small-69"]', savedAt: 169, checksum: 'corrupt' });
      tx.oncomplete = resolve;
    });
    const validAfterCorruption = (await store.read('synthetic')).length;
    const hung = api.createTextStore({ timeout: 20, factory: () => ({ open() {
      const fakeDb = { close() {}, transaction() {
        return { abort() { this.onabort?.(); }, objectStore() {
          return { put() {}, index() { return { openKeyCursor: () => ({}) }; } };
        } };
      } };
      const request = { result: fakeDb }; setTimeout(() => request.onsuccess?.(), 0); return request;
    } }) });
    const hungResult = await hung.write(small);
    hung.close();
    store.close(); denied.close(); blocked.close(); db.close();
    return { diskBytes: keys.reduce((sum, key) => sum + key[1], 0), records: keys.length,
      warmBytes: rows.reduce((sum, row) => sum + row.bytes, 0), wrongVersion: wrongVersion.length,
      invalid, deniedResult, blockedCount: blockedResult.length, quotaResult, wait, count,
      validAfterCorruption, hungResult, limits: api.TEXT_LIMITS };
  });
  assert(storage.diskBytes <= storage.limits.diskBytes && storage.records <= storage.limits.records);
  assert(storage.warmBytes <= storage.limits.warmBytes && storage.wrongVersion === 0);
  assert(storage.invalid && !storage.deniedResult && !storage.quotaResult && !storage.blockedCount);
  assert(storage.wait < 1000);
  assert.equal(storage.count, 64);
  assert.equal(storage.validAfterCorruption, 63);
  assert.equal(storage.hungResult, false);

  const delayedPage = await page.context().newPage();
  delayedPage.on('pageerror', error => errors.push(error.message));
  await delayedPage.addInitScript(() => {
    const fetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      if (String(args[0]).includes('ui-hand-yozai')) await new Promise(resolve => setTimeout(resolve, 200));
      return fetch(...args);
    };
  });
  await delayedPage.goto(url + '?early=1');
  await delayedPage.waitForFunction(() => window.api);
  const lateHydration = await delayedPage.evaluate(async () => {
    const { api } = window;
    const before = api.textCache.stats();
    const label = api.mapLabel('Public map label', 19, 71, '#263d31', 'transparent', { persistence: 'public' });
    const ink = label.ink;
    await api.textCache.settled();
    const cached = api.mapLabel('Public map label', 19, 71, '#263d31', 'transparent', { persistence: 'public' });
    return { before, after: api.textCache.stats(), readyWait: api.readyWait,
      keptFreshSurface: ink === cached.ink };
  });
  assert.equal(lateHydration.before.namespace, null);
  assert.equal(lateHydration.after.renders, 1);
  assert.equal(lateHydration.after.persistentHits, 0);
  assert(lateHydration.keptFreshSurface && lateHydration.readyWait < 150);
  await delayedPage.close();
  const deniedContext = await browser.newContext();
  await deniedContext.addInitScript(() => {
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true,
      get() { throw new DOMException('Synthetic denied storage', 'SecurityError'); } });
  });
  const deniedPage = await deniedContext.newPage();
  deniedPage.on('pageerror', error => errors.push(error.message));
  await deniedPage.goto(url);
  await deniedPage.waitForFunction(() => window.api);
  const denial = await deniedPage.evaluate(async () => {
    const { api } = window;
    const label = api.mapLabel('Public denied probe', 19, 71, '#263d31', 'transparent', { persistence: 'public' });
    await api.textCache.settled();
    return { nonblank: label.ink.getContext('2d').getImageData(0, 0, label.ink.width, label.ink.height).data.some((v, i) => i % 4 === 3 && v),
      stats: api.textCache.stats() };
  });
  assert(denial.nonblank && denial.stats.storage.failures > 0 && denial.stats.storage.writes === 0);
  await deniedContext.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ cold, warm, recovery, versions, fonts, dom, memory, storage, lateHydration, denial, errors }, null, 2));
} finally {
  await browser?.close();
  await server.close();
  await rm(cacheDir, { recursive: true, force: true });
}
