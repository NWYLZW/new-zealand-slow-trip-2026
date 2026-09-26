import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const samples = [];

async function measure(page, name) {
  await page.waitForFunction(() => document.querySelector(".trip-map-area")?._unproject
    && !document.documentElement.dataset.tripPaneTransition);
  await page.waitForTimeout(950);
  const result = await page.evaluate(() => {
    const root = document.querySelector(".trip-map-orientation");
    const map = document.querySelector(".trip-map-area");
    const scale = root.querySelector(".trip-map-scale").getBoundingClientRect();
    const compass = root.querySelector(".trip-map-compass").getBoundingClientRect();
    const bounds = root.getBoundingClientRect();
    const controls = map.querySelector(".trip-map-controls").getBoundingClientRect();
    const canvas = root.querySelector(".trip-map-scale-bar");
    const bar = canvas.getBoundingClientRect();
    const area = map.getBoundingClientRect();
    const a = map._unproject(map.__zoom.invert([bar.left + 2 - area.left, bar.top + 8 - area.top]));
    const b = map._unproject(map.__zoom.invert([bar.right - 2 - area.left, bar.top + 8 - area.top]));
    const radians = Math.PI / 180;
    const h = Math.sin((b[1] - a[1]) * radians / 2) ** 2
      + Math.cos(a[1] * radians) * Math.cos(b[1] * radians) * Math.sin((b[0] - a[0]) * radians / 2) ** 2;
    const meters = 6371008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    const match = root.getAttribute("aria-label").match(/([\d.]+)\s*(km|m)$/);
    const expected = Number(match[1]) * (match[2] === "km" ? 1000 : 1);
    const pigment = [...root.querySelectorAll(".trip-map-scale-bar, .trip-map-compass > .trip-pencil-icon")].every(node =>
      node.getContext("2d").getImageData(0, 0, node.width, node.height).data
        .some((value, index) => index % 4 === 3 && value > 18));
    const overlap = controls.left < bounds.right && controls.right > bounds.left
      && controls.top < bounds.bottom && controls.bottom > bounds.top;
    const panel = document.querySelector("#trip-right-panel")?.getBoundingClientRect();
    return { expected, meters, relativeError: Math.abs(meters - expected) / expected,
      compassOnRight: compass.left >= scale.right, pigment, overlap,
      panelOverlap: panel && bounds.right > panel.left, color: getComputedStyle(root).color,
      hash: canvas.toDataURL(), zoom: map.__zoom.k };
  });
  assert(result.compassOnRight, `${name}: compass must be right of scale`);
  assert(result.pigment, `${name}: missing compass or scale ink`);
  assert(!result.overlap, `${name}: map tools overlap scale`);
  assert(!result.panelOverlap, `${name}: panel overlaps scale`);
  assert(result.relativeError < .025, `${name}: distance mismatch ${result.relativeError}`);
  samples.push({ name, expected: result.expected, relativeError: result.relativeError, zoom: result.zoom });
  if (output) await page.screenshot({ path: `${output}/${name}.png` });
  return result;
}

try {
  const page = await browser.newPage({ viewport: { width: 1326, height: 956 }, deviceScaleFactor: 1 });
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("nz-trip-adventure-appearance", "light");
    navigator.mediaDevices.getUserMedia = async () => { throw new Error("No device access allowed"); };
    navigator.geolocation.watchPosition = () => { throw new Error("No location access allowed"); };
  });
  await page.goto(base);
  const light = await measure(page, "map-overview");
  assert.equal(await page.locator(".trip-waypoint[hidden]").count(), 0);
  assert(await page.locator(".trip-waypoint").count() > 10);
  assert(await page.locator(".trip-waypoint .trip-stop-label").evaluateAll(nodes =>
    nodes.every(node => getComputedStyle(node).opacity === "0")));
  const arrowtown = await page.locator('[data-waypoint="arrowtown"]').boundingBox();
  await page.mouse.click(arrowtown.x + arrowtown.width / 2, arrowtown.y + arrowtown.height / 2);
  await page.waitForURL("**/*waypoint=arrowtown");
  assert.equal(new URL(page.url()).searchParams.get("route"), "zqn-wanaka");
  assert.equal(await page.locator('.trip-waypoint[aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('[data-waypoint="arrowtown"] .trip-stop-label').evaluate(node => getComputedStyle(node).opacity), "1");
  await page.getByRole("button", { name: "返回路线", exact: true }).click();
  assert(await page.locator(".trip-waypoint .trip-stop-label").evaluateAll(nodes =>
    nodes.every(node => getComputedStyle(node).opacity === "0")));
  await measure(page, "map-route");
  await page.getByRole("button", { name: "放大地图", exact: true }).click();
  await measure(page, "map-zoom");
  await page.setViewportSize({ width: 720, height: 540 });
  await measure(page, "map-compact");
  await page.goto(base);
  await measure(page, "map-compact-overview");
  await page.evaluate(() => {
    localStorage.setItem("nz-trip-adventure-appearance", "dark");
    dispatchEvent(new StorageEvent("storage", { key: "nz-trip-adventure-appearance", newValue: "dark" }));
  });
  const dark = await measure(page, "map-dark");
  assert.notEqual(dark.color, light.color);
  assert.notEqual(dark.hash, light.hash);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}?route=zqn-wanaka&waypoint=arrowtown`);
  await page.waitForFunction(() => document.getElementById("trip-board-structure")?.dataset.automaticFullscreen === "right");
  assert(await page.locator(".trip-map-orientation").isHidden());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ defaultDots: true, selectedNames: true, globalSelection: true, samples, errors }));
} finally {
  await browser.close();
}
