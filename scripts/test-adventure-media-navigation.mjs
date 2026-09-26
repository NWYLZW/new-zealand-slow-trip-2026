import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1144, height: 956 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const header = page.locator("#trip-right-panel > .trip-pencil-surface > .trip-panel-header");
const open = async query => {
  await page.goto(`${base}?${query}`);
  await page.locator("#trip-right-panel").waitFor();
};
const checkHeaderActions = async expected => {
  const labels = await header.locator(".trip-panel-header-actions button[aria-label]").evaluateAll(nodes =>
    nodes.map(node => node.getAttribute("aria-label")).filter(label => !/全屏|关闭面板|菜单/.test(label)));
  assert.deepEqual(labels, expected);
};
const screenshot = async name => {
  await page.waitForFunction(() => !document.documentElement.dataset.tripPaneTransition);
  if (output) await page.screenshot({ path: `${output}/${name}.png` });
};

try {
  await context.addInitScript(() => {
    window.__cameraRequests = 0;
    window.__locationRequests = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      window.__cameraRequests++;
      throw new DOMException("Synthetic denial", "NotAllowedError");
    };
    const denyLocation = (success, error) => {
      window.__locationRequests++;
      queueMicrotask(() => error?.({ code: 1, message: "Synthetic denial" }));
      return window.__locationRequests;
    };
    navigator.geolocation.getCurrentPosition = denyLocation;
    navigator.geolocation.watchPosition = denyLocation;
    navigator.geolocation.clearWatch = () => {};
  });
  await open("panel=camera&cameraView=album");
  await checkHeaderActions(["导入媒体归档", "导出媒体归档"]);
  const ids = await page.evaluate(async () => {
    const library = await import("./src/adventure/media/library.js");
    await library.initializeMediaLibrary();
    const ids = [];
    for (const [index, color] of ["#5d9688", "#c87070", "#537898"].entries()) {
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = color; ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#f7f5ed"; ctx.fillRect(75, 70, 490, 340);
      ctx.fillStyle = color; ctx.font = "36px sans-serif"; ctx.fillText(`Synthetic photo ${index + 1}`, 130, 250);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const result = await library.saveCapturedMedia({ blob, capturedAt: "2026-09-27T01:00:00.000Z", captureOffsetMinutes: 480 });
      ids.push(result.item.id);
    }
    await library.updateMediaMetadata(ids[1], { manualPlaceTag: "ZQN" });
    return ids;
  });
  await page.waitForFunction(() => document.querySelectorAll(".trip-media-item-hit").length === 3);
  assert.equal(await page.locator(".trip-media-item-caption").count(), 0);
  assert.equal(await page.locator(".trip-media-album-scroll").evaluate(node => getComputedStyle(node).paddingTop), "0px");
  await screenshot("album-desktop");
  await page.locator(".trip-media-item-hit").first().click();
  await page.locator(".trip-media-detail").waitFor();
  const selectedId = new URL(page.url()).searchParams.get("mediaId");
  assert(selectedId);
  assert.match(await header.innerText(), /相机\s*\/\s*相册\s*\/\s*详情/);
  assert.equal(await page.locator(".trip-media-back").count(), 0);
  await checkHeaderActions(["删除媒体"]);
  await page.getByRole("tab", { name: "补充信息", exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get("mediaTab"), "edit");
  await page.getByLabel("修正摄影者署名", { exact: true }).waitFor();
  await page.reload();
  await page.getByLabel("修正摄影者署名", { exact: true }).waitFor();
  assert.match(await header.innerText(), /相机\s*\/\s*相册\s*\/\s*详情/);
  await page.getByRole("tab", { name: "拍摄信息", exact: true }).click();
  assert.equal(await page.locator("#trip-media-photographer").count(), 0);
  await screenshot("detail-desktop");
  await page.keyboard.press("Escape");
  await page.locator(".trip-media-item-hit").first().waitFor();
  assert.equal(new URL(page.url()).searchParams.has("mediaId"), false);
  await page.goBack();
  await page.locator(".trip-media-detail").waitFor();
  assert.equal(new URL(page.url()).searchParams.get("mediaId"), selectedId);
  page.once("dialog", dialog => dialog.dismiss());
  await header.getByRole("button", { name: "删除媒体", exact: true }).click();
  assert.equal(await page.locator(".trip-media-detail").count(), 1);
  page.once("dialog", dialog => dialog.accept());
  await header.getByRole("button", { name: "删除媒体", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".trip-media-item-hit").length === 2);
  assert.equal(new URL(page.url()).searchParams.has("mediaId"), false);
  await open(`place=ZQN&placeTab=photos&mediaId=${ids[1]}`);
  await page.locator(".trip-media-detail").waitFor();
  assert.match(await header.innerText(), /皇后镇\s*\/\s*照片\s*\/\s*详情/);
  await checkHeaderActions(["删除媒体"]);
  await header.getByRole("button", { name: "返回相册", exact: true }).click();
  await page.locator(".trip-media-item-hit").waitFor();
  assert.equal(new URL(page.url()).searchParams.get("placeTab"), "photos");
  await open("panel=camera&cameraView=album&mediaId=missing-record");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("mediaId"));
  await open("panel=camera&cameraView=settings");
  await page.getByLabel("摄影者昵称", { exact: true }).waitFor();
  await checkHeaderActions(["设备信息"]);
  assert.equal(await page.locator(".trip-camera-device-link").count(), 0);
  const locationToggle = page.getByRole("checkbox", { name: "拍摄定位", exact: true });
  assert.equal(await locationToggle.isChecked(), true);
  await locationToggle.uncheck();
  await page.reload();
  assert.equal(await locationToggle.isChecked(), false);
  await locationToggle.check();
  assert.equal(await page.getByRole("button", { name: "保存", exact: true }).count(), 0);
  assert.equal(await page.getByText("本机摄影者 ID", { exact: true }).count(), 0);
  await page.getByLabel("摄影者昵称", { exact: true }).fill("Synthetic photographer");
  await page.getByLabel("默认摄像头", { exact: true }).focus();
  await page.waitForFunction(async () => {
    const library = await import("./src/adventure/media/library.js");
    return library.getMediaSnapshot().identity?.nickname === "Synthetic photographer";
  });
  assert.equal(await page.getByText("已保存", { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => window.__locationRequests), 0);
  await screenshot("settings-desktop");
  await page.getByRole("button", { name: "设备信息", exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get("cameraView"), "device");
  assert.match(await header.innerText(), /相机\s*\/\s*设置\s*\/\s*设备信息/);
  await checkHeaderActions([]);
  assert.equal(await page.evaluate(() => window.__cameraRequests), 0);
  assert.equal(await page.evaluate(() => window.__locationRequests), 0);
  await page.reload();
  await page.locator(".trip-camera-device-list").waitFor();
  assert.equal(await page.evaluate(() => window.__cameraRequests), 0);
  await page.keyboard.press("Escape");
  await page.getByLabel("摄影者昵称", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("cameraView"), "settings");

  for (const viewport of [{ width: 390, height: 844 }, { width: 720, height: 540 }]) {
    await page.setViewportSize(viewport);
    await page.waitForFunction(width => {
      const board = document.getElementById("trip-board-structure");
      return board?.dataset.responsiveLayout === (width === 390 ? "phone-portrait" : "compact")
        && !document.documentElement.dataset.tripPaneTransition;
    }, viewport.width);
    const panel = await page.locator("#trip-right-panel").boundingBox();
    assert(Math.abs(panel.width - viewport.width * (viewport.width === 390 ? 1 : 0.68)) < 2);
    await screenshot(`settings-${viewport.width}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await open("panel=camera&cameraView=album");
    const card = page.locator(".trip-media-item").first();
    await card.locator(".trip-media-item-hit").focus();
    await card.getByRole("button", { name: "更多媒体操作", exact: true }).click();
    const menuFits = await card.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      return [...node.querySelectorAll('[role="menuitem"]')].every(item => {
        const box = item.getBoundingClientRect();
        return box.top >= bounds.top + 3 && box.bottom <= bounds.bottom - 3
          && box.left >= bounds.left + 3 && box.right <= bounds.right - 3;
      });
    });
    assert(menuFits, `thumbnail menu must fit its clipped border at ${viewport.width}px`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "更多媒体操作");
    await open(`panel=camera&cameraView=album&mediaId=${ids[1]}`);
    await page.locator(".trip-media-detail").waitFor();
    await screenshot(`detail-${viewport.width}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert(await header.getByRole("button", { name: "关闭面板", exact: true }).isVisible());
    await open("panel=camera&cameraView=settings");
  }
  await open("panel=camera");
  await page.waitForFunction(() => window.__cameraRequests === 1);
  assert.equal(await page.evaluate(() => window.__locationRequests), 0);
  await checkHeaderActions(["相机设置"]);
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.__cameraRequests), 1);
  assert.equal(await page.evaluate(() => window.__locationRequests), 0);
  await page.getByRole("button", { name: /开启相机|重试/ }).click();
  await page.waitForFunction(() => window.__cameraRequests === 2);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ hierarchy: true, contextualActions: true, historyReload: true,
    deleteConfirmAndCancel: true, detailTabs: true, placeParent: true, missingMedia: true,
    autoSave: true, deviceReadOnly: true, autoCameraDenialAndRetry: true, responsive: true, errors }));
} finally {
  await browser.close();
}
