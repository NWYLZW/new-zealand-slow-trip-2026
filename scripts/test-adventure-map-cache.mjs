import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer as createNetServer } from 'node:net';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';
import { DETAIL_CACHE_MAX_PIXELS } from '../src/adventure/pencil/detailTilePlan.js';

const baseline = process.argv.includes('--baseline');
const output = resolve('work/map-cache-performance');
await mkdir(output, { recursive: true });
const cacheDir = await mkdtemp(resolve(output, 'vite-'));
let server, browser;
const report = { baseline, collectedAt: new Date().toISOString(), scenarios: {} };
const baselineInternational = execFileSync('git', ['show', '077670f464a1a2e0f036e0f455b9653aaa1a474f:src/adventure/createInternationalMapLayer.js'], { encoding: 'utf8' });
try {
  const reservation = createNetServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  server = await createServer({ configFile: false, root: process.cwd(), cacheDir,
    plugins: [react(), { name: 'map-cache-probe',
      resolveId(id) { if (['/__map-cache-d3.js', '/__map-cache-react.js'].includes(id)) return id; },
      load(id) {
        if (id === '/__map-cache-d3.js') return "export * from 'd3';";
        if (id === '/__map-cache-react.js') return "import React from 'react'; import ReactDOM from 'react-dom/client'; export { React }; export const createRoot = ReactDOM.createRoot;";
        if (id.endsWith('/src/adventure/createInternationalMapLayer.js?map-cache-baseline')) return baselineInternational;
      },
      configureServer(vite) {
        vite.middlewares.use('/__map-cache-probe', (_, response) => {
          response.setHeader('Content-Type', 'text/html');
          response.end('<!doctype html><html><body><main id="trip-board-structure"><div id="probe"></div></main></body></html>');
        });
      } }], server: { host: '127.0.0.1', port, strictPort: true },
    optimizeDeps: { noDiscovery: true, entries: [], include: ['d3', 'react', 'react-dom/client'] } });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/__map-cache-probe`);
  const profile = async () => page.evaluate(async () => {
    const d3 = await import('/__map-cache-d3.js');
    const { createPencilMap } = await import('/src/adventure/pencil/drawPencilMap.js');
    const { createPencilRoutes } = await import('/src/adventure/pencil/drawPencilRoutes.js');
    const geography = (await import('/src/adventure/data/pencil-geography.json')).default;
    const created = [], createElement = document.createElement.bind(document);
    document.createElement = (...args) => {
      const node = createElement(...args); if (args[0] === 'canvas') created.push(node); return node;
    };
    const checksumOf = target => {
      const pixels = target.getContext('2d').getImageData(0, 0, target.width, target.height).data;
      let checksum = 2166136261;
      for (const value of pixels) checksum = Math.imul(checksum ^ value, 16777619) >>> 0;
      return checksum;
    };
    const width = 640, height = 480;
    const projection = d3.geoMercator().rotate([-172, 0])
      .fitExtent([[30, 30], [width - 30, height - 30]], geography.land);
    const project = point => projection(point);
    const canvas = document.createElement('canvas'); document.body.append(canvas);
    const started = performance.now();
    const map = createPencilMap(canvas, project, width, height);
    map.draw(d3.zoomIdentity);
    await map.ready;
    const overviewMs = performance.now() - started;
    const cold = { ...canvas._pencilStats };
    for (let i = 0; i < 6; i++) map.draw(d3.zoomIdentity);
    const same = { ...canvas._pencilStats };
    const point = project([172.5, -43.5]);
    const detail = d3.zoomIdentity.translate(width / 2 - point[0] * 6, height / 2 - point[1] * 6).scale(6);
    map.draw(detail); map.refine(detail);
    for (let i = 0; i < 4; i++) { map.draw(detail); map.refine(detail); }
    const repeatDetail = { ...canvas._pencilStats };
    await new Promise(resolve => setTimeout(resolve, 2500));
    const settledDetail = { ...canvas._pencilStats };
    if (map.ready) {
      for (let i = 0; i < 3; i++) { map.draw(d3.zoomIdentity); map.draw(detail); map.refine(detail); }
    }
    const terrainRevisit = { ...canvas._pencilStats };
    let recovery = null;
    if (map.recover) {
      const before = checksumOf(canvas);
      for (const target of created.filter(node => node._mapPixels)) {
        const ctx = target.getContext('2d'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, target.width, target.height); ctx.restore();
      }
      canvas.width = 0;
      canvas.dispatchEvent(new Event('contextrestored'));
      recovery = { before, after: checksumOf(canvas), stats: { ...canvas._pencilStats } };
    }
    for (let i = 0; i < 8; i++) map.draw(d3.zoomIdentity.translate(i * 2, i).scale(1 + i / 25));
    const motion = { ...canvas._pencilStats };
    map.draw(d3.zoomIdentity);
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let ink = 0, checksum = 2166136261;
    for (let i = 0; i < pixels.length; i++) {
      checksum = Math.imul(checksum ^ pixels[i], 16777619) >>> 0;
      if (i % 4 === 3 && pixels[i]) ink++;
    }
    await map.settled?.();
    map.dispose(); canvas.remove();
    const routeCanvas = document.createElement('canvas'); document.body.append(routeCanvas);
    const route = createPencilRoutes(routeCanvas, [{ route: { id: 'public-test', transport: 'road',
      from: 'a', to: 'b', via: [] }, points: [[30, 20], [90, 120], [250, 180], [450, 340]] }], width, height);
    const waitRoute = async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
      for (let i = 0; i < 300 && routeCanvas._routeStats?.pending; i++) await new Promise(resolve => setTimeout(resolve, 20));
    };
    route.draw(d3.zoomIdentity); await waitRoute();
    const routeInitial = { ...routeCanvas._routeStats };
    for (let i = 0; i < 6; i++) route.draw(d3.zoomIdentity);
    const routeSame = { ...routeCanvas._routeStats };
    route.draw(d3.zoomIdentity.translate(-80, -50).scale(2)); await waitRoute();
    route.draw(d3.zoomIdentity); await waitRoute();
    const routeRevisit = { ...routeCanvas._routeStats };
    let routeRecovery = null;
    if (route.recover) {
      const before = checksumOf(routeCanvas);
      for (const target of created.filter(node => node._mapPixels)) target.width = target.width;
      routeCanvas.width = 0;
      routeCanvas.dispatchEvent(new Event('contextrestored'));
      await waitRoute();
      routeRecovery = { before, after: checksumOf(routeCanvas), stats: { ...routeCanvas._routeStats } };
    }
    let routeBounded = null;
    if (route.recover) {
      for (const k of [3, 4, 5, 6, 7]) {
        route.draw(d3.zoomIdentity.scale(k)); await waitRoute();
      }
      routeBounded = { ...routeCanvas._routeStats };
    }
    route.dispose(); routeCanvas.remove();
    document.createElement = createElement;
    return { overviewMs, cold, same, repeatDetail, settledDetail, motion,
      ink, checksum, routeInitial, routeSame, routeRevisit, recovery, routeRecovery, terrainRevisit, routeBounded };
  });
  report.scenarios.cold = await profile();
  await page.reload();
  report.scenarios.warm = await profile();
  assert(report.scenarios.cold.ink > 1000);
  if (!baseline) {
    assert.equal(report.scenarios.warm.cold.terrainBuilds, 0);
    assert.equal(report.scenarios.cold.same.frames, report.scenarios.cold.cold.frames);
    assert.equal(report.scenarios.cold.repeatDetail.detailBuilds, 1);
    assert.equal(report.scenarios.cold.routeSame.frames, report.scenarios.cold.routeInitial.frames);
    assert.equal(report.scenarios.cold.routeRevisit.builds, 2);
    assert.equal(report.scenarios.cold.checksum, report.scenarios.warm.checksum);
    for (const result of Object.values(report.scenarios)) {
      assert.equal(result.terrainRevisit.detailBuilds, result.settledDetail.detailBuilds);
      assert.equal(result.motion.terrainBuilds, result.cold.terrainBuilds);
      assert.equal(result.motion.detailBuilds, result.settledDetail.detailBuilds);
      assert(result.routeBounded.cachedViews <= 3); assert(result.routeBounded.cachePixels <= 9000000);
      assert(result.settledDetail.cachePixels <= DETAIL_CACHE_MAX_PIXELS);
      assert.equal(result.recovery.before, result.recovery.after);
      assert.equal(result.recovery.stats.detailBuilds, result.settledDetail.detailBuilds);
      assert.equal(result.routeRecovery.before, result.routeRecovery.after);
      assert.equal(result.routeRecovery.stats.builds, result.routeRevisit.builds);
    }
    report.storage = await page.evaluate(async () => {
      const { createMapTerrainCache, mapFingerprint } = await import('/src/adventure/pencil/mapTerrainCache.js');
      const check = (value, label) => { if (!value) throw new Error(label); };
      const name = `map-storage-test-${Date.now()}`;
      const store = createMapTerrainCache({ name, timeout: 100, maxEntries: 2, maxBytes: 100000 });
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
      const key = value => `overview:${mapFingerprint(value)}`;
      check(await store.write(key('empty'), canvas) === false, 'blank captures must not be stored');
      canvas.getContext('2d').fillRect(0, 0, 32, 32);
      for (const value of ['one', 'two', 'three']) check(await store.write(key(value), canvas), 'valid write');
      const image = await store.read(key('three'), 32, 32); check(image, 'valid read'); image.close();
      const open = () => new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1); request.onsuccess = () => resolve(request.result); request.onerror = reject;
      });
      const db = await open();
      const entries = () => new Promise(resolve => {
        db.transaction('overviews').objectStore('overviews').getAll().onsuccess = event => resolve(event.target.result);
      });
      let rows = await entries(); check(rows.length <= 2, 'entry bound');
      check(rows.reduce((sum, row) => sum + row.bytes, 0) <= 100000, 'byte bound');
      const mutate = record => new Promise((resolve, reject) => {
        const tx = db.transaction('overviews', 'readwrite'); tx.objectStore('overviews').put(record);
        tx.oncomplete = resolve; tx.onerror = reject;
      });
      let record = rows.find(row => row.key === key('three'));
      await mutate({ ...record, digest: '0'.repeat(64) });
      check(await store.read(record.key, 32, 32) === null, 'integrity failure must miss');
      check(await store.write(record.key, canvas), 'rewrite corrupt entry');
      record = (await entries()).find(row => row.key === record.key);
      const blank = document.createElement('canvas'); blank.width = blank.height = 32;
      const blob = await new Promise(resolve => blank.toBlob(resolve, 'image/png'));
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))]
        .map(byte => byte.toString(16).padStart(2, '0')).join('');
      await mutate({ ...record, blob, bytes: blob.size, digest });
      check(await store.read(record.key, 32, 32) === null, 'valid transparent PNG must miss');
      check(await store.write(record.key, canvas), 'rewrite blank entry');
      check(await store.read(record.key, 33, 32) === null, 'dimension mismatch must miss');
      check(await store.write(record.key, canvas), 'rewrite dimension mismatch');
      const getPixels = CanvasRenderingContext2D.prototype.getImageData;
      const closeBitmap = ImageBitmap.prototype.close;
      let bitmapCloses = 0;
      ImageBitmap.prototype.close = function () { bitmapCloses++; return closeBitmap.call(this); };
      CanvasRenderingContext2D.prototype.getImageData = () => { throw new Error('synthetic lost probe'); };
      check(await store.read(record.key, 32, 32) === null, 'lost probe fallback');
      CanvasRenderingContext2D.prototype.getImageData = getPixels;
      ImageBitmap.prototype.close = closeBitmap;
      check(bitmapCloses === 1, 'failed probe must release bitmap');
      const tooSmall = createMapTerrainCache({ name: `${name}-bytes`, maxBytes: 64 });
      check(await tooSmall.write(key('bytes'), canvas) === false, 'encoded byte ceiling'); tooSmall.dispose();
      const huge = document.createElement('canvas'); huge.width = 2100001; huge.height = 1;
      check(await store.write(key('huge'), huge) === false, 'pixel ceiling'); huge.width = 0;
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = () => { throw new DOMException('synthetic quota', 'QuotaExceededError'); };
      check(await store.write(key('quota'), canvas) === false, 'quota fallback');
      IDBObjectStore.prototype.put = put;
      const nativeOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = () => { throw new DOMException('synthetic denied', 'SecurityError'); };
      const denied = createMapTerrainCache({ name: `${name}-denied`, timeout: 40 });
      check(await denied.read(key('denied'), 32, 32) === null, 'denied fallback'); denied.dispose();
      indexedDB.open = () => ({});
      const blocked = createMapTerrainCache({ name: `${name}-blocked`, timeout: 40 });
      const started = performance.now();
      check(await blocked.read(key('blocked'), 32, 32) === null, 'blocked fallback');
      const blockedMs = performance.now() - started; check(blockedMs < 1000, 'bounded blocked open');
      blocked.dispose(); indexedDB.open = nativeOpen;
      canvas.width = canvas.height = blank.width = blank.height = 0;
      rows = await entries(); db.close(); await store.settled(); store.dispose();
      return { rows: rows.length, stats: store.stats, blockedMs, blankCapture: true, blankPng: true,
        corruptDigest: true, dimensionMismatch: true, quota: true, denied: true, blocked: true,
        byteCeiling: true, pixelCeiling: true, probeFailureReleasesBitmap: bitmapCloses === 1 };
    });
    report.suspended = await page.evaluate(async () => {
      const d3 = await import('/__map-cache-d3.js');
      const { createPencilMap } = await import('/src/adventure/pencil/drawPencilMap.js');
      const geography = (await import('/src/adventure/data/pencil-geography.json')).default;
      const { terrainOverviewKey } = await import('/src/adventure/pencil/mapTerrainVersion.js');
      const canvas = document.createElement('canvas');
      const project = d3.geoMercator().rotate([-172, 0]).fitExtent([[30, 30], [590, 450]], geography.land);
      const keyInput = { geography, landCover: {}, waterFeatures: [], project, width: 620, height: 480, density: 1, palette: { land: 'green' } };
      const keys = [terrainOverviewKey(keyInput), terrainOverviewKey({ ...keyInput, density: 2 }),
        terrainOverviewKey({ ...keyInput, width: 621 }), terrainOverviewKey({ ...keyInput, palette: { land: 'white' } }),
        terrainOverviewKey({ ...keyInput, geography: { ...geography, version: 'new-data' } })];
      const map = createPencilMap(canvas, project, 620, 480, { suspended: true });
      map.draw(d3.zoomIdentity); await map.ready; map.recover();
      const before = { ...canvas._pencilStats };
      map.resume();
      const after = { ...canvas._pencilStats };
      const view = d3.zoomIdentity.translate(-1800, -1800).scale(6);
      map.draw(view); map.refine(view); map.pause();
      const pausedTiles = canvas._pencilStats.paintedDetailTiles ?? 0;
      await new Promise(resolve => setTimeout(resolve, 250));
      const hiddenTiles = canvas._pencilStats.paintedDetailTiles ?? 0;
      map.resume(); map.draw(d3.zoomIdentity); map.refine(d3.zoomIdentity);
      const gestureBefore = canvas._pencilStats.detailBuilds;
      map.draw(view, { moving: true }); map.refine(view); map.recover();
      const gestureAfter = canvas._pencilStats.detailBuilds;
      map.draw(d3.zoomIdentity, { moving: false });
      await map.settled(); map.dispose();
      const lateCanvas = document.createElement('canvas');
      const late = createPencilMap(lateCanvas, project, 621, 480);
      late.draw(d3.zoomIdentity); late.dispose(); await late.ready;
      return { before, after, pausedTiles, hiddenTiles, disposedBuilds: lateCanvas._pencilStats.terrainBuilds,
        distinctVersionKeys: new Set(keys).size, gestureBefore, gestureAfter };
    });
    assert.equal(report.suspended.before.terrainBuilds, 0);
    assert.equal(report.suspended.after.terrainBuilds, 1);
    assert.equal(report.suspended.pausedTiles, report.suspended.hiddenTiles);
    assert.equal(report.suspended.disposedBuilds, 0);
    assert.equal(report.suspended.distinctVersionKeys, 5);
    assert.equal(report.suspended.gestureBefore, report.suspended.gestureAfter);
    report.detailContinuation = await page.evaluate(async () => {
      const d3 = await import('/__map-cache-d3.js');
      const { createPencilMap } = await import('/src/adventure/pencil/drawPencilMap.js');
      const geography = (await import('/src/adventure/data/pencil-geography.json')).default;
      const canvas = document.createElement('canvas'); document.body.append(canvas);
      const project = d3.geoMercator().rotate([-172, 0]).fitExtent([[30, 30], [590, 450]], geography.land);
      const center = project([168.8, -44.7]);
      const view = d3.zoomIdentity.translate(310 - center[0] * 12, 240 - center[1] * 12).scale(12);
      const map = createPencilMap(canvas, project, 620, 480);
      const stats = () => ({ ...canvas._pencilStats });
      const waitFor = async condition => {
        for (let i = 0; i < 500; i++) {
          if (condition()) return;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        throw new Error('Detail continuation did not reach its expected state');
      };
      try {
        map.draw(view); await map.ready; map.refine(view);
        await waitFor(() => (stats().paintedDetailTiles ?? 0) > 1);
        map.draw(view, { moving: true });
        const interrupted = stats();
        map.draw(view, { moving: false }); map.refine(view);
        const resumed = stats();
        await waitFor(() => !stats().pending);
        const complete = stats();
        const pan = d3.zoomIdentity.translate(view.x + 3, view.y + 2).scale(view.k);
        map.draw(pan, { moving: true }); map.draw(pan, { moving: false }); map.refine(pan);
        await waitFor(() => !stats().pending);
        return { interrupted, resumed, complete, panned: stats() };
      } finally { map.dispose(); canvas.remove(); }
    });
    assert(report.detailContinuation.interrupted.pending === false);
    assert.equal(report.detailContinuation.resumed.detailBuilds, report.detailContinuation.interrupted.detailBuilds);
    assert.equal(report.detailContinuation.resumed.detailResumes, 1);
    assert(report.detailContinuation.complete.cachePixels <= DETAIL_CACHE_MAX_PIXELS);
    assert.equal(report.detailContinuation.panned.detailBuilds, report.detailContinuation.complete.detailBuilds,
      'A tiny drag inside the completed buffer does not rebuild its tiles');
    report.international = [];
    for (const historical of [true, false]) {
      const result = await page.evaluate(async historical => {
        const d3 = await import('/__map-cache-d3.js');
        const source = historical ? '/src/adventure/createInternationalMapLayer.js?map-cache-baseline'
          : '/src/adventure/createInternationalMapLayer.js';
        const { createInternationalMapLayer } = await import(source);
        const geography = (await import('/src/adventure/data/pencil-geography.json')).default;
        const project = d3.geoMercator().rotate([-172, 0]).fitExtent([[30, 30], [610, 450]], geography.land);
        const baseCanvas = document.createElement('canvas'), routeCanvas = document.createElement('canvas');
        const markerHost = document.createElement('div'); document.body.append(baseCanvas, routeCanvas, markerHost);
        const layer = createInternationalMapLayer({ baseCanvas, routeCanvas, markerHost, project, width: 640, height: 480 });
        const view = d3.zoomIdentity.translate(320, 180).scale(.08), visibleRect = { width: 640, height: 480 };
        layer.update({ mapMode: 'international' });
        for (let i = 0; i < 16; i++) {
          layer.draw({ view, visibleRect }); await new Promise(resolve => setTimeout(resolve, 40));
        }
        const burst = { base: Number(baseCanvas.dataset.rasterRefinements || 0), routes: Number(routeCanvas.dataset.rasterRefinements || 0) };
        const settle = async () => {
          for (let i = 0; i < 200 && (baseCanvas.dataset.rasterRefining || routeCanvas.dataset.rasterRefining); i++) {
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        };
        await settle();
        const complete = { base: Number(baseCanvas.dataset.rasterRefinements || 0), routes: Number(routeCanvas.dataset.rasterRefinements || 0) };
        const checksum = () => {
          const data = baseCanvas.getContext('2d').getImageData(0, 0, baseCanvas.width, baseCanvas.height).data;
          let hash = 2166136261; for (const byte of data) hash = Math.imul(hash ^ byte, 16777619) >>> 0; return hash;
        };
        const before = checksum();
        layer.recover?.(); await settle();
        const after = checksum();
        layer.update({ language: 'en' }); await settle();
        const language = { base: Number(baseCanvas.dataset.rasterRefinements || 0), routes: Number(routeCanvas.dataset.rasterRefinements || 0) };
        layer.update({ theme: 'dark' }); await settle();
        const dark = checksum();
        layer.dispose(); baseCanvas.remove(); routeCanvas.remove(); markerHost.remove();
        return { historical, burst, complete, before, after, dark, language };
      }, historical);
      report.international.push(result);
    }
    assert.equal(report.international[0].burst.base, 0);
    assert.equal(report.international[1].burst.base, 1);
    assert.equal(report.international[1].before, report.international[1].after);
    assert.notEqual(report.international[1].before, report.international[1].dark);
    assert.deepEqual(report.international[1].complete, report.international[1].language);
    report.mounted = [];
    for (const viewport of [{ width: 1100, height: 760 }, { width: 436, height: 850 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${origin}/__map-cache-probe`);
      await page.evaluate(async () => {
        const refresh = (await import('/@react-refresh')).default;
        refresh.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        const native = ResizeObserver;
        window.__mapObservers = [];
        window.ResizeObserver = class extends native {
          constructor(callback) { super(callback); this.callback = callback; }
          observe(target, options) {
            if (target.classList.contains('trip-map-area')) window.__mapObservers.push(() => this.callback([{ target }]));
            super.observe(target, options);
          }
        };
        const { React, createRoot } = await import('/__map-cache-react.js');
        const { AdventureMap } = await import('/src/adventure/AdventureMap.jsx');
        await import('/src/adventure/adventure.css');
        const style = document.createElement('style');
        style.textContent = 'html,body,#probe{margin:0;width:100%;height:100%;overflow:hidden}#probe{position:relative}.trip-map-controls{bottom:20px;left:20px}';
        document.head.append(style);
        const root = createRoot(document.querySelector('#probe'));
        window.__mapProps = {};
        window.__renderMap = next => { Object.assign(window.__mapProps, next); root.render(React.createElement(AdventureMap, window.__mapProps)); };
        window.__unmountMap = () => root.unmount();
        window.__renderMap({ onSelect: () => {}, onRouteSelect: () => {}, onWaypointSelect: () => {} });
      });
      await page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.readyMs >= 0);
      await page.waitForTimeout(600);
      const noops = await page.evaluate(async () => {
        const area = document.querySelector('.trip-map-area');
        const before = { ...area._mapStats };
        for (let i = 0; i < 10; i++) window.__mapObservers.forEach(fire => fire());
        await new Promise(requestAnimationFrame);
        return { before, after: { ...area._mapStats } };
      });
      assert.equal(noops.after.layoutBuilds, noops.before.layoutBuilds);
      assert.equal(noops.after.settles, noops.before.settles);
      await page.evaluate(() => window.__renderMap({ mapView: { zoom: 384, center: [-43.5, 172.5] } }));
      await page.waitForFunction(() => Number(document.querySelector('.trip-map-area').dataset.zoom) === 384);
      const boundary = await page.evaluate(() => {
        const area = document.querySelector('.trip-map-area'), before = { ...area._mapStats };
        for (let i = 0; i < 4; i++) document.querySelector('button[aria-label="放大地图"]').click();
        return { before, after: { ...area._mapStats } };
      });
      assert.equal(boundary.after.zoomNoops - boundary.before.zoomNoops, 4);
      assert.equal(boundary.after.settles, boundary.before.settles);
      await page.evaluate(() => {
        const tag = document.querySelector('.trip-stop[data-tag]').dataset.tag;
        window.__renderMap({ selected: tag, focusKey: 'focus-probe' });
      });
      await page.waitForTimeout(180);
      await page.locator('button[aria-label="缩小地图"]').evaluate(button => button.click());
      const interrupted = await page.evaluate(() => ({ ...document.querySelector('.trip-map-area').__zoom }));
      await page.waitForTimeout(1000);
      const finalView = await page.evaluate(() => ({ ...document.querySelector('.trip-map-area').__zoom }));
      assert.deepEqual(finalView, interrupted);
      const hidden = await page.evaluate(async () => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
        const before = { ...document.querySelector('.trip-pencil-map')._pencilStats };
        await new Promise(resolve => setTimeout(resolve, 250));
        const after = { ...document.querySelector('.trip-pencil-map')._pencilStats };
        delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
        return { before, after };
      });
      assert.equal(hidden.after.paintedDetailTiles, hidden.before.paintedDetailTiles);
      const resizeBefore = await page.evaluate(() => document.querySelector('.trip-map-area')._mapStats.layoutBuilds);
      await page.setViewportSize({ ...viewport, width: viewport.width - 20 });
      await page.waitForFunction(count => document.querySelector('.trip-map-area')._mapStats.layoutBuilds === count + 1, resizeBefore);
      await page.setViewportSize(viewport);
      await page.waitForFunction(count => document.querySelector('.trip-map-area')._mapStats.layoutBuilds === count + 2, resizeBefore);
      await page.locator('button[aria-label="复位地图"]').evaluate(button => button.click());
      await page.waitForTimeout(700);
      const pixels = await page.evaluate(() => {
        const canvas = document.querySelector('.trip-pencil-map');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let alpha = 0; for (let i = 3; i < data.length; i += 4) if (data[i]) alpha++;
        return { alpha, width: canvas.width, height: canvas.height, stats: document.querySelector('.trip-map-area')._mapStats,
          terrain: { ...canvas._mapView }, routes: { ...document.querySelector('.trip-pencil-routes')._mapView } };
      });
      assert(pixels.alpha > 1000); assert.deepEqual(pixels.terrain, pixels.routes);
      await page.screenshot({ path: resolve(output, `map-${viewport.width}.png`) });
      report.mounted.push({ viewport, noops, boundary, interrupted, finalView, hidden, pixels });
      await page.evaluate(() => window.__unmountMap());
    }
  }
  assert.deepEqual(errors, []);
  report.errors = errors;
  console.log(JSON.stringify({ baseline, coldMs: report.scenarios.cold.overviewMs,
    warmMs: report.scenarios.warm.overviewMs, coldBuilds: report.scenarios.cold.cold.terrainBuilds,
    warmBuilds: report.scenarios.warm.cold.terrainBuilds, storage: report.storage,
    mounted: report.mounted?.map(result => result.viewport), errors }, null, 2));
  await writeFile(resolve(output, baseline ? 'baseline.json' : 'verified.json'), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser?.close();
  await server?.close();
  await rm(cacheDir, { recursive: true, force: true });
}
