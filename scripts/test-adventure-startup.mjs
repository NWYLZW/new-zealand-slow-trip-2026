import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];

try {
  for (const viewport of [{ width: 1327, height: 964 }, { width: 436, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(15000);
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    page.on("requestfailed", request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
    await page.addInitScript(() => {
      window.__unexpectedDeviceAccess = [];
      const denied = name => () => {
        window.__unexpectedDeviceAccess.push(name);
        throw new Error(`Unexpected device access: ${name}`);
      };
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = denied("getUserMedia");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition = denied("getCurrentPosition");
        navigator.geolocation.watchPosition = denied("watchPosition");
      }
    });
    const ready = async () => {
      await page.locator("#trip-board-structure").waitFor();
      await page.waitForFunction(() => document.querySelector(".trip-pencil-map")?._pencilStats?.frames > 0);
      assert.equal(await page.locator(".site-loading[role=alert]").count(), 0);
      assert.deepEqual(await page.evaluate(() => window.__unexpectedDeviceAccess), []);
    };

    await page.goto(`${base}?panel=tasks&date=2026-09-29&right=bag&bagTab=notes`);
    await ready();
    await page.locator(".trip-bag-note-category").first().waitFor();
    await page.reload();
    await ready();
    await page.locator(".trip-bag-note-category").first().click();
    await page.locator(".trip-panel-breadcrumb").waitFor();
    assert(new URL(page.url()).searchParams.has("bagNote"));
    assert.equal(await page.locator(".trip-bag-tabs").count(), 0);
    await page.reload();
    await ready();
    await page.getByRole("button", { name: "返回备忘", exact: true }).click();
    await page.locator(".trip-bag-tabs").waitFor();

    for (const [tab, content] of [["stays", ".trip-bag-stay-calendar"], ["car", ".trip-bag-rental"],
      ["activities", ".trip-bag-entry"], ["notes", ".trip-bag-note-category"]]) {
      await page.locator(`#trip-bag-tab-${tab}`).click();
      await page.locator(content).first().waitFor();
      assert.equal(await page.locator(`#trip-bag-tab-${tab}`).getAttribute("aria-selected"), "true");
    }
    if (output) await page.screenshot({ path: `${output}/startup-bag-${viewport.width}.png` });

    await page.getByRole("button", { name: "相机", exact: true }).click();
    await page.locator(".trip-camera").waitFor();
    await page.getByRole("button", { name: "开启相机", exact: true }).waitFor();
    await page.getByRole("button", { name: "相册", exact: true }).click();
    await page.locator(".trip-media-album").waitFor();
    assert.equal(new URL(page.url()).searchParams.get("cameraView"), "album");
    assert.match(await page.locator(".trip-panel-breadcrumb").innerText(), /相机\s*\/\s*相册/);
    assert.equal(await page.locator(".trip-camera-back,.trip-media-identity,.trip-media-album-top").count(), 0);
    await page.reload();
    await ready();
    await page.locator(".trip-media-album").waitFor();
    await page.getByRole("button", { name: "相机设置", exact: true }).click();
    await page.locator(".trip-camera-settings").waitFor();
    assert.match(await page.locator(".trip-panel-breadcrumb").innerText(), /相机\s*\/\s*设置/);
    await page.getByLabel("默认摄像头", { exact: true }).selectOption("user");
    await page.getByLabel("录像收音", { exact: true }).uncheck();
    await page.reload();
    await ready();
    assert.equal(await page.getByLabel("默认摄像头", { exact: true }).inputValue(), "user");
    assert.equal(await page.getByLabel("录像收音", { exact: true }).isChecked(), false);
    await page.keyboard.press("Escape");
    await page.locator(".trip-camera").waitFor();
    assert.equal(new URL(page.url()).searchParams.has("cameraView"), false);
    assert(await page.locator("#trip-calendar-region").isVisible());
    await page.goBack();
    await page.locator(".trip-camera-settings").waitFor();
    await page.getByRole("button", { name: "返回相机", exact: true }).click();
    await page.locator(".trip-camera").waitFor();
    assert.deepEqual(await page.evaluate(() => window.__unexpectedDeviceAccess), []);

    await page.goto(`${base}?panel=tasks&date=2026-09-29&right=photos`);
    await ready();
    await page.getByRole("button", { name: "开启相机", exact: true }).waitFor();
    assert.equal(await page.locator(".trip-camera").count(), 1);
    const layout = await page.evaluate(() => {
      const panel = document.querySelector("#trip-right-panel").getBoundingClientRect();
      const camera = document.querySelector(".trip-camera").getBoundingClientRect();
      const header = document.querySelector(".trip-panel-header").getBoundingClientRect();
      return { left: camera.left - panel.left, right: panel.right - camera.right,
        top: camera.top - header.bottom, bottom: panel.bottom - camera.bottom,
        controls: getComputedStyle(document.querySelector(".trip-camera-controls")).position };
    });
    for (const gap of [layout.left, layout.right, layout.top, layout.bottom]) assert(Math.abs(gap) < 1, JSON.stringify(layout));
    assert.equal(layout.controls, "absolute");
    assert.equal(await page.locator(".trip-camera-controls button").count(), 3);
    assert.equal(await page.locator(".trip-camera-controls .trip-panel-divider-ink,.trip-camera-record-toggle").count(), 0);
    assert.equal((await page.locator(".trip-camera-controls").innerText()).trim(), "");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(await page.evaluate(() => window.__unexpectedDeviceAccess), []);
    if (output) await page.screenshot({ path: `${output}/startup-camera-${viewport.width}.png` });
    results.push({ width: viewport.width, startup: true, reload: true, notesNavigation: true,
      bagTabs: true, camera: true, cameraNestedPages: true, cameraSettingsPersistence: true,
      cameraFullBleed: true, legacyPhotos: true, unexpectedDeviceAccess: false });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
