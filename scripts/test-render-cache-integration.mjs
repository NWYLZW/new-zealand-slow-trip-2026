import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const cacheDir = await mkdtemp(`${root}/work/render-cache-integration-`);
let browser, server;
const errors = [], report = {};
const output = process.env.RENDER_CACHE_OUTPUT;
if (output) await mkdir(output, { recursive: true });
try {
  const reservation = createNetServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  server = await createServer({ root, cacheDir, logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: true } });
  await server.listen();
  const base = `http://127.0.0.1:${port}/new-zealand-slow-trip-2026/`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1218, height: 853 },
    deviceScaleFactor: 2, timezoneId: 'Pacific/Auckland' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__deviceCalls = [];
    const deny = name => () => { window.__deviceCalls.push(name); throw new Error(`Unexpected ${name}`); };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny('camera');
    if (navigator.geolocation) navigator.geolocation.watchPosition = deny('location');
  });
  // Stable public weather fixtures keep this renderer check independent of the network.
  await page.route(/https:\/\/[^/]*open-meteo\.com\//, async route => {
    const url = new URL(route.request().url());
    const start = Date.parse(`${url.searchParams.get('start_hour')}:00Z`);
    const end = Date.parse(`${url.searchParams.get('end_hour')}:00Z`);
    const time = Array.from({ length: Math.max(1, Math.min(1000, (end - start) / 3600000 + 1)) },
      (_, index) => (start + index * 3600000) / 1000);
    await route.fulfill({ json: { hourly_units: { time: 'unixtime', temperature_2m: '\u00b0C',
      precipitation: 'mm', weather_code: 'wmo code', wind_speed_10m: 'km/h' },
    hourly: { time, temperature_2m: time.map(() => 12), precipitation: time.map(() => 0),
      weather_code: time.map(() => 3), wind_speed_10m: time.map(() => 4) } } });
  });
  const ready = async () => {
    await page.waitForFunction(() => document.querySelector('.trip-pencil-map')?._pencilStats?.frames > 0);
    await page.waitForFunction(() => document.querySelector('#trip-calendar-region .trip-pencil-text')?.dataset.pencilReady === 'true');
    await page.evaluate(async () => {
      window.__textCache = (await import('/new-zealand-slow-trip-2026/src/adventure/pencil/textCache.js')).textCache;
      await window.__textCache.settled();
    });
    await page.waitForTimeout(1000);
  };
  const snapshot = () => page.evaluate(() => {
    const painted = selector => [...document.querySelectorAll(selector)].filter(canvas => {
      const r = canvas.getBoundingClientRect();
      return r.width && r.height && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    }).map(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) ink++;
      return ink;
    });
    const area = document.querySelector('.trip-map-area');
    return { url: location.href, history: history.length, view: area.__zoom?.toString(),
      text: window.__textCache.stats(), icons: painted('.trip-tool .trip-pencil-icon'),
      labels: painted('#trip-calendar-region .trip-pencil-text[data-pencil-ready="true"] canvas'),
      map: document.querySelector('.trip-pencil-map')._pencilStats,
      overflow: document.documentElement.scrollWidth > innerWidth, deviceCalls: window.__deviceCalls };
  });
  await page.goto(`${base}?map=nz&panel=tasks&date=2026-10-01`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(await page.locator('.trip-weather-badge-kind').count(), 0);
  const badge = page.locator('.trip-weather-badge[data-weather-date="2026-09-28"]');
  assert.match(await badge.getAttribute('aria-label'), /2026-09-28/);
  assert.equal(await badge.locator('.trip-weather-badge-temperature').count(), 1);
  const badgeLayout = await badge.evaluate(node => {
    const box = node.getBoundingClientRect();
    const icon = node.querySelector('.trip-pencil-icon').getBoundingClientRect();
    return { height: box.height, centerOffset: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2) };
  });
  assert(badgeLayout.height >= 44 && badgeLayout.centerOffset < 1);
  const cold = await snapshot();
  assert(cold.labels.length && cold.labels.every(Boolean));
  assert(cold.icons.length && cold.icons.every(Boolean));
  assert(cold.text.storage.writes > 0, 'Calendar public provider actually persists text');
  assert(!cold.overflow); assert.deepEqual(cold.deviceCalls, []);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  const warm = await snapshot();
  assert(warm.text.persistentHits > 0, 'Complete-page reload hits persisted public text');
  assert(warm.icons.every(Boolean) && warm.labels.every(Boolean));
  const identity = await page.evaluate(() => {
    window.__buttons = [...document.querySelectorAll('.trip-tool')];
    return { url: location.href, history: history.length,
      view: document.querySelector('.trip-map-area').__zoom.toString() };
  });
  await page.evaluate(() => {
    for (const canvas of document.querySelectorAll('.trip-tool canvas, #trip-calendar-region .trip-pencil-text canvas')) {
      canvas.width = canvas.width;
    }
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await ready();
  const recovered = await snapshot();
  assert(recovered.icons.every(Boolean) && recovered.labels.every(Boolean));
  assert.deepEqual({ url: recovered.url, history: recovered.history, view: recovered.view }, identity);
  assert(await page.evaluate(() => window.__buttons.every(node => node.isConnected)));

  await page.goto(`${base}?panel=tasks&date=2026-10-02&map=nz&weather=2026-10-06&weatherParentFront=tasks`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.trip-weather-hour');
  assert.equal(await page.locator('.trip-weather-hours').count(), 0);
  assert.equal(await page.locator('.trip-weather-chart-labels').count(), 0);
  assert(await page.locator('.trip-weather-chart-track').evaluate(node => {
    const style = getComputedStyle(node);
    const height = parseFloat(style.getPropertyValue('--weather-chart-top')) + parseFloat(style.getPropertyValue('--weather-chart-height'));
    return Math.abs(node.getBoundingClientRect().height - height) < 1;
  }), 'Hourly track ends at the compact curve extent');
  assert.equal(await page.locator('.trip-weather-hour').count(), 15);
  assert.equal(await page.locator('.trip-weather-folded-hours').count(), 1);
  assert.match(await page.locator('.trip-weather-average-temperature').textContent(), /12\.0°/);
  assert.match(await page.locator('.trip-weather-folded-hours').getAttribute('aria-label'), /9\/9/);
  await page.locator('.trip-weather-folded-hours').click();
  assert.equal(await page.locator('.trip-weather-hour').count(), 24);
  assert.equal(await page.locator('.trip-weather-average-temperature').count(), 0);
  assert.equal(await page.locator('.trip-weather-chart-track > .trip-weather-early-collapse').count(), 1);
  assert(await page.locator('.trip-weather-chart-track').evaluate(node => {
    const curve = node.querySelector('.trip-weather-curve-wrap').getBoundingClientRect();
    const firstHour = node.querySelector('.trip-weather-hour').getBoundingClientRect();
    const control = node.querySelector('.trip-weather-early-collapse').getBoundingClientRect();
    return Math.abs(curve.left - firstHour.left) < 1 && control.right <= firstHour.left + 1
      && Math.abs(control.top - firstHour.top) < 1;
  }), 'Inline collapse control takes no extra row and stays outside the temperature curve');
  assert.equal(await page.locator('.trip-weather-hour[aria-pressed="true"] time').textContent(), '00:00');
  await page.locator('.trip-weather-early-collapse').click();
  assert.equal(await page.locator('.trip-weather-hour').count(), 15);
  assert.equal(await page.locator('.trip-weather-hour[aria-pressed="true"] time').textContent(), '09:00');
  await page.locator('.trip-weather-folded-hours').click();
  await page.locator('.trip-weather-hour').first().focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('.trip-weather-hour[aria-pressed="true"] time').textContent(), '23:00');
  assert.equal(await page.locator('.trip-adventure-calendar .trip-weather-attribution').count(), 0);
  assert.equal(await page.locator('.trip-weather .trip-weather-attribution, .trip-weather-sources').count(), 0);
  const weatherUrl = page.url();
  const weatherView = await page.evaluate(() => document.querySelector('.trip-map-area').__zoom.toString());
  if (output) await page.screenshot({ path: `${output}/weather-summary.png` });
  await page.locator('.trip-weather-chart-scroll').evaluate(node => { node.scrollLeft = 180; });
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^(天气数据来源|Weather data sources)$/ }).click();
  await page.waitForSelector('.trip-weather-sources');
  assert.equal(await page.locator('.trip-weather-hourly').count(), 0);
  assert.equal(await page.locator('.trip-weather-sources .trip-weather-attribution a').count(), 2);
  assert.equal(new URL(page.url()).searchParams.get('weatherView'), 'sources');
  await page.getByRole('button', { name: /^(返回天气|Back to weather)$/ }).click();
  await page.waitForSelector('.trip-weather-hourly');
  assert.equal(page.url(), weatherUrl);
  assert.equal(await page.locator('.trip-weather-hour').count(), 24);
  assert.equal(await page.locator('.trip-weather-early-collapse').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.evaluate(() => document.querySelector('.trip-map-area').__zoom.toString()), weatherView);
  assert(await page.locator('.trip-weather-chart-scroll').evaluate(node => Math.abs(node.scrollLeft - 180) < 1));
  assert.equal(await page.locator('.trip-weather-hour[aria-pressed="true"] time').textContent(), '23:00');
  await page.getByRole('button', { name: /^(天气数据来源|Weather data sources)$/ }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.trip-weather-sources');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.trip-weather-hourly');
  assert.equal(new URL(page.url()).searchParams.has('weatherView'), false);
  await page.goBack();
  await page.waitForSelector('.trip-weather-sources');
  await page.goForward();
  await page.waitForSelector('.trip-weather-hourly');
  report.weather = { summaryAndHourlyCurve: true, earlyHoursFoldedByDefault: true, expansionRetained: true, nestedSources: true, horizontalScrollAndSelectionRetained: true, scrollAndMapRetained: true, refreshEscapeAndHistory: true };

  const density = () => page.evaluate(() => {
    const day = document.querySelector('#trip-calendar-region .trip-adventure-calendar-day');
    const date = day.querySelector('.trip-adventure-calendar-day-number').getBoundingClientRect();
    const weather = day.querySelector('.trip-weather-badge').getBoundingClientRect();
    const centerY = node => { const box = node.getBoundingClientRect(); return box.top + box.height / 2; };
    const headingOffsets = [...document.querySelectorAll('#trip-calendar-region .trip-adventure-calendar-day')].map(cell => {
      const badge = cell.querySelector('.trip-weather-badge');
      const labels = [...cell.querySelectorAll('.trip-adventure-calendar-date .trip-pencil-text, .trip-weather-badge-temperature .trip-pencil-text')]
        .filter(node => node.getBoundingClientRect().width > 0);
      return Math.max(...labels.map(node => Math.abs(centerY(node) - centerY(badge))));
    });
    return { events: [...day.querySelectorAll('.trip-adventure-calendar-event')].filter(node => node.getBoundingClientRect().height > 0).length,
      temperature: day.querySelector('.trip-weather-badge-temperature').getBoundingClientRect().width > 0,
      dateVisible: date.width > 0 && date.height > 0, weatherVisible: weather.width > 0 && weather.height >= 44,
      separateRows: date.bottom <= weather.top, cardHeight: day.getBoundingClientRect().height,
      headingCenterOffset: Math.max(...headingOffsets),
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
  const compactSplit = await density();
  assert.equal(compactSplit.events, 0); assert(compactSplit.dateVisible && compactSplit.weatherVisible && compactSplit.separateRows);
  assert.equal(compactSplit.cardHeight, 100);
  if (output) await page.screenshot({ path: `${output}/calendar-split.png` });
  await page.getByRole('button', { name: /^(关闭面板|Close panel)$/ }).click();
  await page.waitForTimeout(600);
  const wide = await density();
  assert(wide.events > 0 && wide.temperature);
  assert(wide.headingCenterOffset < .5, 'Wide calendar date and weather must share a vertical center');
  await page.setViewportSize({ width: 900, height: 853 });
  await page.waitForTimeout(600);
  const medium = await density();
  assert(medium.events > 0 && medium.events <= 2 && !medium.temperature);
  assert(medium.headingCenterOffset < .5, 'Medium calendar date and weather must share a vertical center');
  await page.setViewportSize({ width: 436, height: 900 });
  await page.waitForTimeout(1200);
  const narrow = await density();
  assert(narrow.events === 0 && narrow.dateVisible && narrow.weatherVisible && narrow.separateRows && !narrow.overflow);
  assert.equal(narrow.cardHeight, 100);
  if (output) await page.screenshot({ path: `${output}/calendar-436.png` });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(600);
  const smallest = await density();
  assert(smallest.events === 0 && smallest.dateVisible && smallest.weatherVisible && smallest.separateRows && !smallest.overflow);
  assert.equal(smallest.cardHeight, 100);
  report.calendarDensity = { wide, medium, compactSplit, narrow, smallest };
  await page.getByRole('button', { name: /^(关闭日历|Close calendar)$/ }).click();
  await page.waitForFunction(() => !document.querySelector('.trip-map-area').hasAttribute('inert'));
  await page.getByRole('button', { name: /^(任务|Tasks)$/ }).click();
  await page.waitForSelector('#trip-calendar-region:not([inert])');
  assert.deepEqual(errors, []);
  report.cold = { renders: cold.text.renders, writes: cold.text.storage.writes, labels: cold.labels.length };
  report.warm = { renders: warm.text.renders, persistentHits: warm.text.persistentHits };
  report.recovery = { controlsRetained: true, urlAndViewRetained: true, painted: true };
  report.narrowViewport = { width: 436, overflow: false, calendarNavigation: true };
  report.errors = errors;
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await server?.close();
  await rm(cacheDir, { recursive: true, force: true });
}
