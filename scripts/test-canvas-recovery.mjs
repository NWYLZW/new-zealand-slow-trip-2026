import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = process.env.ADVENTURE_TEST_URL ? null : await createServer({
  root,
  cacheDir: `${root}/work/canvas-recovery-vite`,
  server: { host: '127.0.0.1', port: 0 }, logLevel: 'error',
});
await server?.listen();
const base = process.env.ADVENTURE_TEST_URL || `http://127.0.0.1:${server.httpServer.address().port}/new-zealand-slow-trip-2026/`;
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 859, height: 608 }, deviceScaleFactor: 2.75 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    window.testCanvases = new Set();
    const create = document.createElement.bind(document);
    document.createElement = (name, ...args) => {
      const element = create(name, ...args);
      if (name.toLowerCase() === 'canvas') window.testCanvases.add(element);
      return element;
    };
  });
  await page.goto(`${base}?map=world`);
  await page.waitForFunction(() => document.querySelectorAll('.trip-stop-marker').length > 4);
  await page.evaluate(() => document.fonts.ready);
  const sample = () => page.evaluate(() => {
    const selectors = ['.trip-tool .trip-pencil-icon', '.trip-stop-marker--normal', '.trip-stop-label canvas',
      '.trip-map-orientation .trip-pencil-text canvas'];
    return selectors.map(selector => [...document.querySelectorAll(selector)].filter(canvas => {
      const rect = canvas.getBoundingClientRect();
      return rect.width && rect.height && rect.right > 0 && rect.left < innerWidth
        && rect.bottom > 0 && rect.top < innerHeight && getComputedStyle(canvas).visibility !== 'hidden';
    }).map(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let pixels = 0;
      for (let index = 3; index < data.length; index += 4) if (data[index] > 10) pixels++;
      return pixels;
    }));
  });
  await page.waitForFunction(() => {
    const c = document.querySelector('.trip-tool .trip-pencil-icon');
    return c && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 10);
  });
  await page.waitForTimeout(500);
  const baseline = await sample();
  assert(baseline.every(group => group.length && group.every(count => count > 0)), 'Initial icons/markers/labels are painted');
  const identity = await page.evaluate(() => {
    window.testNodes = [...document.querySelectorAll('.trip-tool, .trip-stop')];
    return { url: location.href, history: history.length, transform: document.querySelector('.trip-map-area').__zoom?.toString() };
  });
  for (const trigger of ['visibilitychange', 'contextrestored', 'pageshow']) {
    await page.evaluate(() => {
      for (const canvas of window.testCanvases) {
        // Include detached sprite caches: repainting only the visible canvas is insufficient.
        if (canvas.width * canvas.height <= 500000) canvas.width = canvas.width;
      }
    });
    assert((await sample()).every(group => group.every(count => count === 0)), 'The fixture lost all small canvas pixels');
    await page.evaluate(trigger => {
      if (trigger === 'pageshow') window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      else if (trigger === 'contextrestored') document.querySelector('.trip-tool canvas').dispatchEvent(new Event('contextrestored'));
      else {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, trigger);
    await page.waitForTimeout(800);
    assert.deepEqual(await sample(), baseline, `${trigger}: stable seeded pixels restored from fresh caches`);
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, history: history.length,
      transform: document.querySelector('.trip-map-area').__zoom?.toString() })), identity);
    assert(await page.evaluate(() => window.testNodes.every(node => node.isConnected)), 'Buttons keep DOM identity and handlers');
  }
  await page.getByRole('button', { name: '任务', exact: true }).click();
  await page.waitForSelector('#trip-calendar-region:not([inert])');
  assert.deepEqual(errors, []);
  console.log('Canvas cache loss: foreground/context restore/BFCache restore passed; map, URL, button identity and task click preserved. Synthetic browser regression, not long-background phone acceptance.');
} catch (error) {
  console.error(JSON.stringify({ errors }));
  throw error;
} finally {
  await browser.close();
  await server?.close();
}
