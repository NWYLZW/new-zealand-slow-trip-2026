import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html';
const output = process.env.ADVENTURE_TEST_OUTPUT;
const readData = async name => JSON.parse(await readFile(new URL(`../src/adventure/data/${name}.json`, import.meta.url), 'utf8'));
const original = await readData('pencil-geography'), linz = await readData('hydrography');
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1323, height: 956 }, deviceScaleFactor: 2 });
const errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push(request.url()));
try {
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.frames > 0);
  const result = await page.evaluate(async ({ original, linz }) => {
    const { waterFeatures, waterReplacements } = await import('./src/adventure/pencil/waterFeatures.js');
    const { drawPencilWater } = await import('./src/adventure/pencil/drawPencilWater.js');
    const renderer = document.querySelector('.trip-pencil-map');
    const resolved = waterFeatures.map(feature => feature.properties);
    const polygons = feature => feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates
      : feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : [];
    const allPoints = feature => feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates.flat(2)
      : feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString'
        ? feature.geometry.coordinates.flat() : feature.geometry.coordinates;
    const sameGeometry = linz.features.every(source => {
      const copies = waterFeatures.filter(f => f.properties.id === source.id);
      return copies.length === 1 && JSON.stringify(copies[0].geometry.coordinates) === JSON.stringify(source.parts);
    });
    const superseded = waterFeatures.filter(f => f.properties.source === 'Natural Earth' && waterReplacements[f.properties.name]);
    const retainedParts = original.lakes.filter(f => !waterReplacements[f.properties.name]).every(source => {
      const resolved = waterFeatures.find(f => f.properties.name === source.properties.name);
      return resolved && polygons(resolved).some(part => JSON.stringify(part) === JSON.stringify(source.geometry.coordinates));
    });
    const pixelChecks = [];
    for (const source of linz.features) {
      const feature = waterFeatures.find(f => f.properties.id === source.id);
      const points = allPoints(feature);
      const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
      const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      const scale = Math.min(600 / (bounds[2] - bounds[0]), 480 / (bounds[3] - bounds[1]));
      const project = ([lon, lat]) => [20 + (lon - bounds[0]) * scale, 20 + (bounds[3] - lat) * scale];
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 520;
      const ctx = canvas.getContext('2d');
      const paths = new Map(waterFeatures.map(f => {
        const path = new Path2D();
        for (const polygon of polygons(f)) for (const ring of polygon) {
          ring.forEach((point, index) => { const p = project(point); if (index) path.lineTo(...p); else path.moveTo(...p); });
          path.closePath();
        }
        return [f, path];
      }));
      const drawPath = f => {
        for (const polygon of polygons(f)) for (const ring of polygon) {
          ring.forEach((point, index) => { const p = project(point); if (index) ctx.lineTo(...p); else ctx.moveTo(...p); });
          ctx.closePath();
        }
      };
      drawPath.bounds = f => {
        const points = allPoints(f).map(project), xs = points.map(p => p[0]), ys = points.map(p => p[1]);
        return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
      };
      drawPencilWater(ctx, drawPath, project);
      const pixels = ctx.getImageData(0, 0, 640, 520).data;
      const path = paths.get(feature);
      const mask = document.createElement('canvas'); mask.width = 640; mask.height = 520;
      const maskContext = mask.getContext('2d'); maskContext.fill(path, 'evenodd');
      const expected = maskContext.getImageData(0, 0, 640, 520).data;
      let inside = 0, painted = 0;
      for (let y = 20; y < 500; y += 2) for (let x = 20; x < 620; x += 2) {
        const index = (y * 640 + x) * 4 + 3;
        if (expected[index] < 12) continue;
        inside++;
        // Narrow river polygons can be subpixel: compare to the source mask's
        // antialias coverage, not an opaque-pixel threshold.
        if (pixels[index] >= expected[index] * .85) painted++;
      }
      let removed = 0, ghosts = 0;
      if (source.kind === 'lake') {
        const alias = Object.keys(waterReplacements).find(name => waterReplacements[name] === source.id);
        const previous = original.lakes.find(f => f.properties.name === alias);
        const oldPath = new Path2D();
        for (const polygon of polygons(previous)) for (const ring of polygon) {
          ring.forEach((point, index) => { const p = project(point); if (index) oldPath.lineTo(...p); else oldPath.moveTo(...p); });
          oldPath.closePath();
        }
        // Probe the former-only strip, at least four pixels away from current
        // shorelines. Other valid water polygons must not be counted as ghosts.
        ctx.lineWidth = 8;
        for (let y = 10; y < 510; y += 2) for (let x = 10; x < 630; x += 2) {
          if (!ctx.isPointInPath(oldPath, x, y, 'evenodd')) continue;
          if ([...paths.values()].some(p => ctx.isPointInPath(p, x, y, 'evenodd') || ctx.isPointInStroke(p, x, y))) continue;
          removed++;
          if (pixels[(y * 640 + x) * 4 + 3] > 150) ghosts++;
        }
      }
      pixelChecks.push({ id: source.id, inside, painted, removed, ghosts });
    }
    return { resolved, runtime: renderer._waterFeatures, sameGeometry, superseded, retainedParts, pixelChecks,
      teAnauParts: waterFeatures.find(f => f.properties.name === 'Lake Te Anau').geometry.coordinates.length };
  }, { original, linz });
  assert(result.sameGeometry, 'Detailed source geometry or holes changed');
  assert.deepEqual(result.superseded, [], 'Old source copies are still in the render collection');
  assert.deepEqual(result.runtime, result.resolved, 'Runtime is not using the resolved water collection');
  assert.equal(new Set(result.resolved.map(f => f.id)).size, result.resolved.length);
  assert(result.retainedParts, 'A nonduplicate lake was lost');
  assert.equal(result.teAnauParts, 2, 'Multipart lake lost an original part');
  assert.equal(result.resolved.filter(f => f.kind === 'lake').length, 20);
  assert.equal(result.resolved.filter(f => f.kind === 'river').length, 55);
  for (const check of result.pixelChecks) {
    assert(check.inside > 20 && check.painted / check.inside > .92, `Water missing: ${JSON.stringify(check)}`);
    if (check.removed > 30) assert(check.ghosts / check.removed < .05, `Duplicate lake fill remains: ${JSON.stringify(check)}`);
  }
  assert.equal(await page.locator('.trip-water-map,.trip-hydrography,.trip-sketch,.trip-landmarks,.trip-decorations,.trip-terrain-background,.trip-terrain-decorations').count(), 0);
  assert.equal(await page.locator('.trip-water-label').count(), 8);
  assert(!requests.some(url => /\/images\/adventure\/|\/src\/adventure\/(drawHydrography|sketchLines|terrainBackground|drawTerrainDecorations|drawLandmarks|drawDecorations)\./.test(url)), 'Legacy renderer or art requested');

  // Actual high-zoom cached map: verify removed Wakatipu fill is not just
  // covered up by a second vector layer, and refine does not bring it back.
  await page.goto(`${base}?place=ZQN`);
  await page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.frames > 0);
  await page.getByRole('button', { name: '关闭面板' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '放大地图', exact: true }).click();
  await page.waitForTimeout(1600);
  assert(await page.locator('.trip-pencil-map').evaluate(c => c._pencilStats.detailBuilds > 0));
  const actual = await page.evaluate(async original => {
    const { waterFeatures } = await import('./src/adventure/pencil/waterFeatures.js');
    const area = document.querySelector('.trip-map-area'), canvas = document.querySelector('.trip-pencil-map');
    const view = canvas._mapView, ratio = canvas.width / area.clientWidth;
    const current = waterFeatures.find(f => f.properties.id === 'lake-wakatipu');
    const previous = original.lakes.find(f => f.properties.name === 'Lake Wakatipu');
    const shape = polygons => {
      const path = new Path2D();
      for (const polygon of polygons) for (const ring of polygon) {
        ring.forEach((point, index) => {
          const projected = area._project(point), x = projected[0] * view.k + view.x, y = projected[1] * view.k + view.y;
          if (index) path.lineTo(x, y); else path.moveTo(x, y);
        }); path.closePath();
      } return path;
    };
    const currentPath = shape(current.geometry.coordinates), previousPath = shape([previous.geometry.coordinates]);
    const probe = document.createElement('canvas').getContext('2d'); probe.lineWidth = 10;
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let inside = 0, blue = 0, removed = 0, ghosts = 0;
    for (let y = 80; y < area.clientHeight - 80; y += 3) for (let x = 20; x < area.clientWidth - 20; x += 3) {
      if (probe.isPointInStroke(currentPath, x, y)) continue;
      const i = (Math.floor(y * ratio) * canvas.width + Math.floor(x * ratio)) * 4;
      const isWater = pixels[i + 2] - pixels[i] > 40 && pixels[i + 1] - pixels[i] > 30;
      if (probe.isPointInPath(currentPath, x, y, 'evenodd')) { inside++; if (isWater) blue++; }
      else if (probe.isPointInPath(previousPath, x, y, 'evenodd')) { removed++; if (isWater) ghosts++; }
    }
    return { inside, blue, removed, ghosts };
  }, original);
  assert(actual.inside > 30 && actual.blue / actual.inside > .9, `Runtime lake missing: ${JSON.stringify(actual)}`);
  assert(actual.removed > 20 && actual.ghosts / actual.removed < .08, `Runtime duplicate lake: ${JSON.stringify(actual)}`);
  await page.mouse.move(1040, 790);
  if (output) await page.screenshot({ path: `${output}/water-wakatipu.png` });
  await page.setViewportSize({ width: 436, height: 900 });
  await page.waitForTimeout(1600);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('.trip-water-map,.trip-hydrography,.trip-sketch').count(), 0);
  if (output) await page.screenshot({ path: `${output}/water-wakatipu-mobile.png` });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ waters: result.resolved.length, exactLinzGeometries: 8, teAnauParts: result.teAnauParts,
    pixelChecks: result.pixelChecks, runtimePixels: actual, noLegacyRuntime: true, highZoomAndMobile: true, errors }));
} finally { await browser.close(); }
