import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const browser = await chromium.launch({ headless: true });
const errors = [];

async function pigment(page) {
  return page.locator('.trip-game-tools button[aria-label="背包"] canvas').evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261, count = 0;
    for (let index = 0; index < pixels.length; index++) {
      hash = Math.imul(hash ^ pixels[index], 16777619) >>> 0;
      if (index % 4 === 3 && pixels[index] > 18) count++;
    }
    return { hash, count, active: canvas.dataset.active, color: getComputedStyle(canvas).color };
  });
}

try {
  const page = await browser.newPage({ viewport: { width: 1326, height: 956 }, deviceScaleFactor: 2 });
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("nz-trip-adventure-appearance", "light");
    window.__iconSamples = 0;
    const original = SVGGeometryElement.prototype.getPointAtLength;
    SVGGeometryElement.prototype.getPointAtLength = function (...args) {
      window.__iconSamples++;
      return original.apply(this, args);
    };
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Synthetic denial", "NotAllowedError"); };
    navigator.geolocation.watchPosition = () => { throw new Error("Unexpected location request"); };
  });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector(".trip-pencil-map")?._pencilStats?.frames > 0);
  await page.waitForTimeout(500);
  const idle = await pigment(page);
  assert(idle.count > 80);
  const bag = page.locator('.trip-game-tools button[aria-label="背包"]');
  await bag.click();
  await page.waitForTimeout(500);
  const selected = await pigment(page);
  assert.equal(selected.active, "true");
  assert.notEqual(selected.hash, idle.hash);
  await bag.click();
  await page.waitForTimeout(500);
  assert.equal((await pigment(page)).hash, idle.hash);
  const sampled = await page.evaluate(() => window.__iconSamples);
  await bag.click();
  await page.waitForTimeout(500);
  assert.equal((await pigment(page)).hash, selected.hash);
  await bag.click();
  await page.waitForTimeout(500);
  const repeatedSamples = await page.evaluate(before => window.__iconSamples - before, sampled);
  assert.equal(repeatedSamples, 0, "same icons should reuse sampled geometry");
  for (const appearance of ["dark", "light"]) {
    await page.evaluate(value => {
      localStorage.setItem("nz-trip-adventure-appearance", value);
      window.dispatchEvent(new StorageEvent("storage", { key: "nz-trip-adventure-appearance", newValue: value }));
    }, appearance);
    await page.waitForFunction(value => document.documentElement.dataset.adventureAppearance === value, appearance);
    await page.waitForTimeout(300);
    const repainted = await pigment(page);
    assert(repainted.count > 80);
    if (appearance === "dark") {
      assert.notEqual(repainted.color, idle.color);
      assert.notEqual(repainted.hash, idle.hash);
    } else assert.equal(repainted.hash, idle.hash);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ stableCachedPigment: true, activePigment: true, lightDarkRestore: true, repeatedSamples, errors }));
} finally {
  await browser.close();
}
