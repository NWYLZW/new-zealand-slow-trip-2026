import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure.html';
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1324, height: 964 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const screenshot = async name => { if (output) await page.screenshot({ path: `${output}/text-${name}.png` }); };
const check = async locator => {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate(node => document.fonts.ready);
  await page.waitForFunction(node => node.dataset.pencilReady === 'true', await locator.elementHandle());
  const result = await locator.evaluate(node => {
    const canvas = node.querySelector('canvas'), context = canvas.getContext('2d');
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const levels = new Set(); let pigment = 0, dark = 0;
    for (let i = 3; i < rgba.length; i += 4) {
      if (rgba[i] > 15) { pigment++; levels.add(rgba[i]); }
      if (rgba[i] > 140) dark++;
    }
    const style = getComputedStyle(node), box = node.getBoundingClientRect();
    return { text: node.textContent, family: style.fontFamily, weight: style.fontWeight,
      spacing: style.letterSpacing, width: box.width, height: box.height, renderer: canvas.dataset.renderer,
      lines: Number(canvas.dataset.lines), pigment, dark, levels: levels.size,
      canvasHidden: canvas.ariaHidden, sourceColor: getComputedStyle(node.firstChild).color,
      overflow: node.scrollWidth > node.clientWidth + 1 };
  });
  assert.equal(result.renderer, 'pencil-lettering-c');
  assert(result.family.startsWith('"HanziPen SC"')); assert.equal(result.weight, '400');
  assert.equal(result.spacing, 'normal'); assert.equal(result.canvasHidden, 'true');
  assert(result.pigment > 30 && result.dark > 8 && result.levels > 40, `Blank, faint or flat text: ${result.text}`);
  assert.equal(result.sourceColor, 'rgba(0, 0, 0, 0)'); assert(!result.overflow, result.text);
  return result;
};

try {
  assert.equal((await page.goto(`${base}?panel=tasks`)).status(), 200);
  await check(page.locator('.trip-panel-title .trip-pencil-text'));
  const title = page.locator('.trip-task summary strong .trip-pencil-text').first();
  const titleMetrics = await check(title);
  assert.equal(titleMetrics.text, '深圳 → 吉隆坡 → 奥克兰');
  const pixels = await title.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await title.hover(); await page.waitForTimeout(200);
  assert.equal(await title.locator('canvas').evaluate(canvas => canvas.toDataURL()), pixels, 'Pigment changed on hover');
  assert.equal(await title.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node.firstChild);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    const text = selection.toString(); selection.removeAllRanges(); return text;
  }), titleMetrics.text);
  await screenshot('tasks-desktop');
  const firstDay = page.locator('.trip-task').first();
  await firstDay.locator('summary').focus(); await page.keyboard.press('Enter');
  assert(await firstDay.evaluate(node => node.open));
  for (const item of await firstDay.locator('li .trip-pencil-text').all()) await check(item);
  await firstDay.scrollIntoViewIfNeeded(); await screenshot('tasks-expanded');
  await page.locator('.trip-task').last().locator('summary').scrollIntoViewIfNeeded();
  await check(page.locator('.trip-task summary strong .trip-pencil-text').last());
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '背包', exact: true }).click();
  await check(page.locator('.trip-bag-list strong .trip-pencil-text').first());
  const source = page.locator('.trip-map-sources');
  await source.locator('summary').click();
  const sourceText = source.locator('p .trip-pencil-text').first();
  assert((await check(sourceText)).lines > 1, 'Long English credit did not wrap');
  await screenshot('bag-sources');
  await page.getByRole('button', { name: '相册', exact: true }).click();
  await check(page.locator('figcaption .trip-pencil-text').first());
  await page.goto(`${base}?route=oamaru-christchurch`);
  await check(page.locator('.trip-route-note .trip-pencil-text').first());
  assert.equal(await page.getByRole('link', { name: '在 Google 地图打开 ↗' }).count(), 1);
  await page.locator('.trip-panel-body').evaluate(node => { node.scrollTop = 0; });
  await screenshot('route-desktop');
  await page.goto(`${base}?place=ZQN`);
  await check(page.locator('.trip-location .trip-pencil-text'));
  await check(page.locator('.trip-card-actions .trip-pencil-text'));
  await screenshot('place-desktop');
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('.trip-location canvas').isVisible(), false);
  assert.notEqual(await page.locator('.trip-location .trip-pencil-text-source').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
  await page.emulateMedia({ forcedColors: 'none' });
  for (const width of [436, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: '任务', exact: true }).click();
    await check(page.locator('.trip-task summary strong .trip-pencil-text').first());
    await page.locator('.trip-task summary').first().click();
    await check(page.locator('.trip-task li .trip-pencil-text').nth(3));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(await page.locator('.trip-panel-body').evaluate(node => node.scrollWidth <= node.clientWidth));
    await screenshot(`tasks-${width}`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '背包', exact: true }).click();
    await page.locator('.trip-map-sources summary').click();
    assert((await check(page.locator('.trip-map-sources p .trip-pencil-text').first())).lines > 1);
    await screenshot(`credits-${width}`);
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ titleMetrics, nativeTextSelection: true, wraps: true, lazyScroll: true,
    panels: ['tasks', 'bag', 'photos', 'route', 'place'], mobile: [436, 320], forcedColors: true, errors }));
} finally { await browser.close(); }
