import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ADVENTURE_TEST_URL || 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure';
const output = process.env.ADVENTURE_TEST_OUTPUT;
const measureOnly = process.argv.includes('--measure');
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

async function sample(page, label, selector) {
  const result = await page.locator(selector).evaluate(button => {
    const canvas = button.querySelector('.trip-pencil-icon');
    const box = button.getBoundingClientRect();
    const art = canvas.getBoundingClientRect();
    const { width, height } = canvas;
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    let mass = 0, massX = 0, massY = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha < 18) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      mass += alpha; massX += alpha * x; massY += alpha * y;
    }
    const centerX = box.x + box.width / 2, centerY = box.y + box.height / 2;
    const pixelToCssX = x => art.x + (x + .5) * art.width / width - centerX;
    const pixelToCssY = y => art.y + (y + .5) * art.height / height - centerY;
    return {
      buttonSize: [box.width, box.height],
      canvasOffset: [art.x + art.width / 2 - centerX, art.y + art.height / 2 - centerY],
      inkBoundsOffset: [pixelToCssX((minX + maxX) / 2), pixelToCssY((minY + maxY) / 2)],
      inkMassOffset: [pixelToCssX(massX / mass), pixelToCssY(massY / mass)],
      inkPixels: maxX >= 0 ? (maxX - minX + 1) * (maxY - minY + 1) : 0,
    };
  });
  if (!measureOnly) {
    assert(result.buttonSize[0] >= 44 && result.buttonSize[1] >= 44, `${label}: hit target is smaller than 44px`);
    assert(result.inkPixels > 80, `${label}: missing pigment`);
    for (const offset of result.canvasOffset) assert(Math.abs(offset) <= .5, `${label}: canvas is off-center: ${result.canvasOffset}`);
    for (const offset of result.inkBoundsOffset) assert(Math.abs(offset) <= 1.8, `${label}: ink bounds are off-center: ${result.inkBoundsOffset}`);
  }
  return { label, ...result };
}

try {
  const results = [];
  for (const viewport of [{ width: 1323, height: 956 }, { width: 436, height: 900 }]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.trip-tool .trip-pencil-icon');
      return canvas?.width > 0 && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 18);
    });
    const state = { viewport: viewport.width, icons: [] };
    const labels = ['返回行程总览', '任务', '背包', '相册', '放大地图', '缩小地图', '复位地图'];
    for (const label of labels) {
      const locator = page.getByRole('button', { name: label, exact: true });
      const selector = `.trip-tool[aria-label="${label}"]`;
      state.icons.push(await sample(page, `${label} idle`, selector));
      await locator.hover();
      state.icons.push(await sample(page, `${label} hover`, selector));
      await locator.focus();
      state.icons.push(await sample(page, `${label} focus`, selector));
      await locator.evaluate(node => node.blur());
    }
    for (const label of ['任务', '背包', '相册']) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.click();
      await page.waitForTimeout(450);
      state.icons.push(await sample(page, `${label} selected`, `.trip-tool[aria-label="${label}"]`));
      if (label === '任务') {
        assert(await page.locator('#trip-calendar-region').isVisible());
        state.icons.push(await sample(page, '关闭日历', 'button[aria-label="关闭日历"]'));
        await page.getByRole('button', { name: '关闭日历' }).hover();
        state.icons.push(await sample(page, '关闭日历 hover', 'button[aria-label="关闭日历"]'));
        await page.getByRole('button', { name: '关闭日历' }).focus();
        state.icons.push(await sample(page, '关闭日历 focus', 'button[aria-label="关闭日历"]'));
      } else {
        state.icons.push(await sample(page, '关闭面板', 'button[aria-label="关闭面板"]'));
        await page.getByRole('button', { name: '关闭面板' }).hover();
        state.icons.push(await sample(page, '关闭面板 hover', 'button[aria-label="关闭面板"]'));
        await page.getByRole('button', { name: '关闭面板' }).focus();
        state.icons.push(await sample(page, '关闭面板 focus', 'button[aria-label="关闭面板"]'));
      }
      await button.click();
    }
    await page.goto(`${base}?place=ZQN`);
    for (const label of ['关闭面板', '上一站', '下一站']) {
      const selector = `button[aria-label="${label}"]`;
      await page.locator(selector).waitFor();
      state.icons.push(await sample(page, label, selector));
      await page.locator(selector).hover();
      state.icons.push(await sample(page, `${label} hover`, selector));
      await page.locator(selector).focus();
      state.icons.push(await sample(page, `${label} focus`, selector));
    }
    await page.mouse.move(180, 400);
    if (output) await page.screenshot({ path: `${output}/icons-${viewport.width}.png` });
    results.push(state);
    await page.close();
  }
  if (!measureOnly) assert.deepEqual(errors, []);
  if (measureOnly) console.log(JSON.stringify({ results, errors }, null, 2));
  else console.log(JSON.stringify({ viewports: results.map(result => result.viewport), iconsChecked: results.reduce((total, result) => total + result.icons.length, 0), errors }));
} finally {
  await browser.close();
}
