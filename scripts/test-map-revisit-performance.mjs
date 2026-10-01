import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { geoMercator, zoomIdentity } from 'd3';
import { detailCacheVictims, DETAIL_CACHE_MAX_PIXELS } from '../src/adventure/pencil/detailTilePlan.js';
import { retainTownVisit, takeTownVisit, townVisitCacheStats } from '../src/adventure/pencil/townVisitCache.js';
import { releaseMapSurface } from '../src/adventure/pencil/mapTerrainCache.js';

// This is a scheduling/accounting test, not a raster, browser or phone test.
// Pixel storage and ink primitives are intentionally mocked; geometry is real.
const created = [];
class Canvas {
  width = 0; height = 0; dataset = {}; isConnected = false; restores = 0;
  constructor() {
    created.push(this);
    this.context = new Proxy({
      getImageData: () => ({ width: this.width, height: this.height,
        data: { byteLength: this.width * this.height * 4, length: 0 } }),
      putImageData: () => { if (this.failRestore) throw Error('Simulated context restore failure'); this.restores++; },
      createPattern: () => ({ setTransform() {} }),
      setTransform: (...values) => { this.transform = values; },
      drawImage: (image, ...args) => {
        assert(image.width > 0 && image.height > 0, 'Never blit a parked or released surface');
        assert(args.every(Number.isFinite), 'Blits retain finite projected coordinates');
      },
    }, { get: (target, key) => target[key] ?? (() => {}) });
  }
  getContext() { return this.context; }
  addEventListener() {}
  removeEventListener() {}
}

const globals = new Map(['document', 'devicePixelRatio', 'DOMMatrix', 'setTimeout', 'clearTimeout']
  .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const timers = new Map();
let timerId = 0;
const tick = () => {
  const next = timers.entries().next().value;
  if (!next) return false;
  timers.delete(next[0]); next[1](); return true;
};
const drain = () => {
  let count = 0;
  while (tick()) assert(++count < 20000, 'Work must terminate');
};
const dataA = {}, dataB = {};
const visit = (data, side = 2000) => {
  const canvas = new Canvas(); canvas.width = side; canvas.height = side;
  return { layer: { canvas, ctx: canvas.context, ratio: 2 }, data, publicDefault: true,
    complete: true, view: { k: 1, x: 0, y: 0 } };
};
const a = visit(dataA), b = visit(dataB);
assert(retainTownVisit('A', a)); assert(retainTownVisit('B', b));
assert.equal(townVisitCacheStats().pixels, 8000000, 'Two full 4M public visits fit as CPU-only snapshots');
assert.equal(a.layer.canvas.width, 0);
assert.equal(takeTownVisit('A', dataA), a);
assert.equal(a.layer.canvas.width, 2000);
assert.deepEqual(a.layer.canvas.transform, [2, 0, 0, 2, 0, 0]);
assert(retainTownVisit('A', a));
assert.equal(takeTownVisit('B', {}), null, 'Changed data identity cannot reuse old town pixels');
assert.equal(b.layer.canvas._mapPixels, null);
assert.equal(retainTownVisit('private', { ...visit(dataA), publicDefault: false }), false);
assert.equal(retainTownVisit('hotel', { ...visit(dataA), view: { k: 1.35, x: 42, y: -5 } }), false);
assert.equal(retainTownVisit('partial', { ...visit(dataA), complete: false }), false);
assert.equal(retainTownVisit('oversized', visit(dataA, 2001)), false);
const consumed = takeTownVisit('A', dataA); releaseMapSurface(consumed.layer.canvas);
for (let index = 0; index < 4; index++) assert(retainTownVisit(`tiny-${index}`, visit(dataA, 2)));
assert.equal(townVisitCacheStats().entries, 3);
assert.equal(takeTownVisit('tiny-0', dataA), null);
for (let index = 1; index < 4; index++) releaseMapSurface(takeTownVisit(`tiny-${index}`, dataA).layer.canvas);

const hot = { pixels: 8000000, usedAt: 3 }, cold = { pixels: 4000000, usedAt: 2 };
assert.deepEqual(detailCacheVictims([hot, cold], hot), []);
assert.deepEqual(detailCacheVictims([hot, cold, { pixels: 4000000, usedAt: 1 }], hot).length, 1);

const server = await createServer({ configFile: false, appType: 'custom',
  server: { middlewareMode: true, watch: null }, optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [{ name: 'map-accounting-ink-stubs', enforce: 'pre', load(id) {
    if (id.endsWith('/pencil/brush.js')) return `
      export const random = () => () => .5;
      export const stroke = () => {};
      export const hatch = () => {};
      export const coverTexture = () => {};
      export const mountains = () => {};
      export const clipPolyline = () => [];
    `;
    if (id.endsWith('/pencil/mapLabels.js')) return `
      export const mapLabel = () => ({width: 10, height: 10, advance: 10, draw() {}});
    `;
  } }],
});
let map;
try {
  const { createPencilMap } = await server.ssrLoadModule('/src/adventure/pencil/drawPencilMap.js');
  const { createTownRenderJob, townRenderRegion } = await server.ssrLoadModule('/src/adventure/pencil/drawPencilTown.js');
  const geography = (await server.ssrLoadModule('/src/adventure/data/pencil-geography.json')).default;
  const zqn = (await server.ssrLoadModule('/src/adventure/data/town-maps/ZQN.json')).default.place;
  const wka = (await server.ssrLoadModule('/src/adventure/data/town-maps/WKA.json')).default.place;
  globalThis.document = { hidden: false, createElement: () => new Canvas() };
  globalThis.devicePixelRatio = 2;
  globalThis.DOMMatrix = class {};
  globalThis.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
  globalThis.clearTimeout = id => timers.delete(id);

  for (const [width, height] of [[393, 208], [393, 600], [840, 640]]) {
    const region = townRenderRegion(width, height);
    assert.equal(region.ratio, 2, 'Representative phone/tablet sizes preserve full 2x density');
    assert(region.width * region.height * region.ratio ** 2 <= 4000000);
  }

  const canvas = new Canvas(), width = 1000, height = 1000;
  const project = geoMercator().rotate([-172, 0]).fitExtent([[30, 30], [970, 970]], geography.land);
  map = createPencilMap(canvas, project, width, height);
  await map.ready;
  map.setTownData('ZQN', zqn); map.setTownData('WKA', wka);
  const viewAt = point => {
    const [x, y] = project(point), scale = 64;
    return zoomIdentity.translate(width / 2 - x * scale, height / 2 - y * scale).scale(scale);
  };
  const queenstown = viewAt([168.6626, -45.0312]), wanaka = viewAt([169.136, -44.698]);
  const show = (tag, view) => { map.setVisibleTowns([tag]); map.draw(view); map.refine(view); };
  show('ZQN', queenstown); drain();
  const first = { ...canvas._pencilStats };
  show('WKA', wanaka); drain();
  const second = { ...canvas._pencilStats };
  assert.equal(second.cachedDetails, 2, 'Finishing Wanaka must not evict Queenstown');
  assert(second.cachePixels <= DETAIL_CACHE_MAX_PIXELS);
  assert.equal(second.parkedDetails, 1);
  show('ZQN', queenstown); drain();
  const revisit = { ...canvas._pencilStats };
  assert.equal(revisit.detailBuilds, second.detailBuilds);
  assert.equal(revisit.paintedDetailTiles, second.paintedDetailTiles, 'Revisit paints zero new terrain tiles');
  assert(revisit.detailRestores > (second.detailRestores ?? 0));

  const pan = zoomIdentity.translate(queenstown.x - 3, queenstown.y - 2).scale(queenstown.k);
  show('ZQN', pan);
  tick();
  const partial = { ...canvas._pencilStats };
  map.draw(pan, { moving: true });
  assert.equal(timers.size, 0, 'Movement cancels pending work immediately');
  map.draw(pan, { moving: false }); map.refine(pan); drain();
  const panned = { ...canvas._pencilStats };
  assert(panned.detailResumes >= 1, 'Partial coverage resumes after a drag');
  assert(panned.reusedDetailTiles > 0);
  assert(panned.paintedDetailTiles - revisit.paintedDetailTiles < first.paintedDetailTiles / 2);
  assert.equal(panned.cachedDetails, 2, 'Redundant nearby Queenstown view is removed, retaining Wanaka');
  show('WKA', wanaka); drain();
  assert.equal(canvas._pencilStats.detailBuilds, panned.detailBuilds);
  map.pause(); assert.equal(timers.size, 0);
  const beforeRecovery = { ...canvas._pencilStats };
  map.resume(); map.recover(); drain();
  assert.equal(canvas._pencilStats.paintedDetailTiles, beforeRecovery.paintedDetailTiles);
  assert(canvas._pencilStats.cachePixels <= DETAIL_CACHE_MAX_PIXELS);
  assert.equal(canvas._pencilStats.parkedDetails, 1, 'Recovery restores only the current view');
  const coldCanvas = created.find(canvas => canvas._mapPixels?.width === 2000 && canvas.width === 0);
  assert(coldCanvas); coldCanvas.failRestore = true;
  show('ZQN', pan); drain();
  assert.equal(canvas._pencilStats.detailRestoreFailures, 1);
  assert(canvas._pencilStats.paintedDetailTiles > beforeRecovery.paintedDetailTiles,
    'Failed CPU restoration discards the unusable cache and rebuilds');
  show('WKA', wanaka); drain();
  map.setTownData('WKA', { ...wka }); map.refine(wanaka); drain();
  assert(canvas._pencilStats.detailBuilds > panned.detailBuilds, 'Data revision invalidates stale detail');
  const point = project([169.136, -44.698]);
  const denserView = zoomIdentity.translate(500 - point[0] * 96, 500 - point[1] * 96).scale(96);
  show('WKA', denserView); drain();
  const lowerDensity = canvas._pencilStats.activeDensity, copies = canvas._pencilStats.detailCopies;
  assert(lowerDensity < 2);
  map.setVisibleRect({ width: 600, height: 600 });
  map.draw(denserView); map.refine(denserView); drain();
  assert.equal(canvas._pencilStats.activeDensity, 2, 'Sharper completed detail replaces the lower-density fallback');
  assert.equal(canvas._pencilStats.detailCopies, copies, 'Do not upscale lower-density coverage as completed detail');
  map.dispose(); map = null; assert.equal(timers.size, 0);

  const townData = { roads: [], buildings: [], water: [], labels: [] };
  const renderTown = (width, height, pauseAfterTile) => {
    let projections = 0, ready = 0, completed = 0, didPause = false;
    const job = createTownRenderJob({ data: townData, width, height, language: 'en', pixelRatio: 2,
      project: ([lng, lat]) => { projections++; return [(lng - 168.6626) * 1000 + 16, (-lat - 45.0312) * 1000 + 16]; },
      onUpdate(_, done, tile) {
        if (tile) ready++;
        if (done) completed++;
        if (pauseAfterTile && tile && !didPause) { didPause = true; job.pause(); }
      },
    });
    drain();
    if (pauseAfterTile) {
      assert.equal(ready, 1); assert.equal(completed, 0); assert.equal(timers.size, 0);
      job.resume(); drain();
    }
    assert.equal(completed, 1); assert.equal(ready, job.tileCount);
    job.pause(); job.resume(); drain(); assert.equal(completed, 1, 'Completed jobs never fire twice');
    releaseMapSurface(job.layer.canvas);
    return { projections, batches: job.stats.batches, ready };
  };
  const one = renderTown(144, 144, false), four = renderTown(288, 288, true);
  assert.equal(one.projections, four.projections, 'Geographic projection count is independent of tile count');
  let cancelledUpdates = 0;
  const cancelled = createTownRenderJob({ data: townData, project, width: 144, height: 144,
    onUpdate() { cancelledUpdates++; } });
  cancelled.cancel(); cancelled.resume(); drain();
  assert.equal(cancelledUpdates, 0); releaseMapSurface(cancelled.layer.canvas);
  console.log(JSON.stringify({ result: 'passed', evidence: 'Node mocked-canvas accounting; no raster/browser/device acceptance',
    main: { firstTiles: first.paintedDetailTiles, revisitNewTiles: revisit.paintedDetailTiles - second.paintedDetailTiles,
      panNewTiles: panned.paintedDetailTiles - revisit.paintedDetailTiles, partialTiles: partial.paintedDetailTiles,
      residentPixels: second.cachePixels, limit: DETAIL_CACHE_MAX_PIXELS }, town: { one, four } }, null, 2));
} finally {
  map?.dispose();
  for (const [key, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  await server.close();
}
