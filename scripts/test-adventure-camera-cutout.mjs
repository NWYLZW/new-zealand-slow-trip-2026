import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/";
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const model of ["2608BPX34C", "unknown"]) {
    const page = await browser.newPage({ viewport: { width: 860, height: 608 } });
    await page.addInitScript(model => {
      localStorage.setItem("nz-trip-adventure-orientation", "system");
      localStorage.setItem("nz-trip-camera-location", "off");
      Object.defineProperty(navigator, "userAgentData", { value: {
        getHighEntropyValues: async () => ({ platform: "Android", model }),
      } });
      Object.defineProperty(screen.orientation, "angle", { get: () => 270 });
      Object.defineProperty(navigator, "permissions", { value: {
        query: async () => ({ state: "granted" }),
      } });
      navigator.geolocation.watchPosition = () => 1;
      navigator.geolocation.clearWatch = () => {};
      window.__streams = [];
      navigator.mediaDevices.getUserMedia = async constraints => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const context = canvas.getContext("2d");
        context.fillStyle = "#2980b9";
        context.fillRect(0, 0, 320, 480);
        context.fillStyle = "#d35400";
        context.fillRect(320, 0, 320, 480);
        const stream = canvas.captureStream(1);
        Object.defineProperty(stream.getVideoTracks()[0], "getSettings", {
          value: () => ({ facingMode: window.__reportedFacing ?? constraints.video.facingMode.ideal }),
        });
        window.__streams.push(stream);
        return stream;
      };
      navigator.mediaDevices.enumerateDevices = async () => [
        { kind: "videoinput", deviceId: "front" }, { kind: "videoinput", deviceId: "rear" },
      ];
    }, model);
    await page.goto(`${base}?panel=camera`);
    await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
    await page.waitForTimeout(500);
    const measure = () => page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector);
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height,
          cx: r.x + r.width / 2, cy: r.y + r.height / 2,
          hit: element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
      };
      return {
        album: rect(".trip-camera-control:first-child"), flip: rect(".trip-camera-facing-toggle"),
        shutter: rect(".trip-camera-shutter"), system: rect(".trip-camera-system-capture"),
        close: rect(".trip-camera-header-actions .trip-close"),
        expand: document.querySelector(".trip-camera-header-actions .trip-pane-expand")
          ? rect(".trip-camera-header-actions .trip-pane-expand") : null,
        cutout: document.querySelector("#trip-board-structure").dataset.deviceCutout,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    for (const fullscreen of [false, true]) {
      const layout = await measure();
      assert.equal(layout.album.y, model === "2608BPX34C" ? 69 : 9);
      assert.equal(layout.flip.y, layout.album.y + 46);
      for (const control of [layout.album, layout.flip, layout.system]) {
        assert(Math.abs(control.cx - layout.shutter.cx) < 1, JSON.stringify(layout));
        assert(control.hit);
      }
      assert(layout.close.hit && layout.shutter.hit && !layout.overflow);
      if (!fullscreen) {
        assert(layout.expand.hit);
        assert.equal(layout.expand.cy, layout.close.cy);
        assert(layout.expand.x >= layout.close.x + layout.close.width);
        await page.locator(".trip-camera-header-actions .trip-pane-expand").click();
        await page.waitForFunction(() => document.querySelector("#trip-board-structure").dataset.fullscreen === "right");
        await page.waitForTimeout(500);
        assert.equal(new URL(page.url()).searchParams.get("fullscreen"), "right");
        assert.equal(await page.evaluate(() => window.__streams.length), 1);
        assert.equal(await page.evaluate(() => window.__streams[0].getVideoTracks()[0].readyState), "live");
      } else assert.equal(layout.expand, null);
      results.push({ model, fullscreen, layout });
    }
    const video = page.locator(".trip-camera-preview video");
    assert.equal(await video.evaluate(el => getComputedStyle(el).transform), "none");
    await page.locator(".trip-camera-facing-toggle").click();
    await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.dataset.facing === "user");
    assert.equal(await video.evaluate(el => getComputedStyle(el).transform), "matrix(-1, 0, 0, 1, 0, 0)");
    await page.locator(".trip-camera-facing-toggle").click();
    await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.dataset.facing === "environment");
    assert.equal(await video.evaluate(el => getComputedStyle(el).transform), "none");
    // A fresh request can fall back to the other physical camera.
    await page.evaluate(() => { window.__reportedFacing = "user"; });
    await page.locator(".trip-camera-settings-entry").click();
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), "right");
    await page.goBack();
    await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.dataset.facing === "user");
    assert.equal(await video.evaluate(el => getComputedStyle(el).transform), "matrix(-1, 0, 0, 1, 0, 0)");
    await page.close();
  }
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
