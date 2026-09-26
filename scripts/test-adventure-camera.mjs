import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createCameraNicknameAutosave } from "../src/adventure/cameraNicknameAutosave.js";
import { downloadMediaBlob, mediaDownloadName } from "../src/adventure/cameraMediaDownload.js";
import { createPermissionPromptGate, observeBrowserPermission } from "../src/adventure/cameraPermissionLifecycle.js";

const writes = [];
let releaseFirstWrite;
const firstWrite = new Promise(resolve => { releaseFirstWrite = resolve; });
const autosave = createCameraNicknameAutosave({ delay: 0, save: async value => {
  writes.push(value);
  if (writes.length === 1) await firstWrite;
} });
autosave.sync("A");
const savingB = autosave.edit("B", { immediate: true });
autosave.edit("A", { immediate: true });
releaseFirstWrite();
await savingB;
await autosave.flush();
assert.deepEqual(writes, ["B", "A"]);

const imeWrites = [];
const imeAutosave = createCameraNicknameAutosave({ delay: 10, save: async value => imeWrites.push(value) });
imeAutosave.sync("Original");
imeAutosave.edit("旧定时值");
imeAutosave.cancelPending();
await new Promise(resolve => setTimeout(resolve, 20));
assert.deepEqual(imeWrites, []);
await imeAutosave.edit("最终输入", { immediate: true });
assert.deepEqual(imeWrites, ["最终输入"]);

const emptyWrites = [];
const emptyAutosave = createCameraNicknameAutosave({ delay: 0, allowEmpty: true,
  save: async value => emptyWrites.push(value) });
emptyAutosave.sync("Previous attribution");
await emptyAutosave.edit("   ", { immediate: true });
assert.deepEqual(emptyWrites, [""]);

const permissionStorageValues = new Map();
const permissionStorage = {
  getItem: key => permissionStorageValues.get(key) ?? null,
  setItem: (key, value) => permissionStorageValues.set(key, value),
  removeItem: key => permissionStorageValues.delete(key),
};
const promptGate = createPermissionPromptGate({ storage: permissionStorage });
assert.equal(promptGate.canAutoRequest("geolocation", "prompt"), true);
promptGate.noteRequest("geolocation", "prompt");
assert.equal(promptGate.canAutoRequest("geolocation", "prompt"), false);
promptGate.noteChange("geolocation", "granted");
assert.equal(promptGate.canAutoRequest("geolocation", "granted"), true);
assert.equal(createPermissionPromptGate({ storage: permissionStorage }).canAutoRequest("geolocation", "prompt"), false);
promptGate.noteChange("geolocation", "prompt");
assert.equal(promptGate.canAutoRequest("geolocation", "prompt"), false);
promptGate.allowNextRequest("geolocation");
assert.equal(promptGate.canAutoRequest("geolocation", "prompt"), true);
assert.equal(promptGate.canAutoRequest("camera", "denied"), false);

let permissionListener;
const permissionStates = [];
const permissionStatus = {
  state: "prompt",
  addEventListener(type, listener) { if (type === "change") permissionListener = listener; },
  removeEventListener(type, listener) { if (type === "change" && permissionListener === listener) permissionListener = null; },
};
const stopPermissionObservation = observeBrowserPermission("geolocation", state => permissionStates.push(state),
  { query: async () => permissionStatus });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(typeof permissionListener, "function");
permissionStatus.state = "granted";
permissionListener();
stopPermissionObservation();
assert.deepEqual(permissionStates, ["prompt", "granted"]);
assert.equal(permissionListener, null);

assert.equal(mediaDownloadName({ id: "1", originalName: "capture", mimeType: "image/jpeg" }), "capture.jpg");
assert.equal(mediaDownloadName({ id: "2", originalName: "clip.mov", mimeType: "video/quicktime" }), "clip.mov");
const downloadEvents = [];
const fakeAnchor = { href: "", download: "", click: () => downloadEvents.push("click"), remove: () => downloadEvents.push("remove") };
await downloadMediaBlob({ id: "3", originalName: "clip", mimeType: "video/webm" }, async () => new Blob(["video"]), {
  documentObject: { body: { append: anchor => downloadEvents.push(["append", anchor.download]) }, createElement: () => fakeAnchor },
  urlObject: { createObjectURL: () => "blob:synthetic", revokeObjectURL: url => downloadEvents.push(["revoke", url]) },
  schedule: callback => callback(),
});
assert.deepEqual(downloadEvents, [["append", "clip.webm"], "click", "remove", ["revoke", "blob:synthetic"]]);
await assert.rejects(() => downloadMediaBlob({ id: "missing", originalName: "missing.jpg" }, async () => null));

if (process.env.ADVENTURE_STATIC_ONLY === "1") {
  console.log(JSON.stringify({ nicknameAutosave: true, emptyAttribution: true,
    permissionPromptGate: true, permissionChangeSubscription: true, mediaDownload: true }));
  process.exit(0);
}

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1327, height: 964 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

try {
  await page.addInitScript(() => {
    localStorage.setItem("nz-trip-camera-audio", "off");
    window.__testStreams = [];
    window.__testDeviceRequests = [];
    window.__testCapabilityReads = [];
    window.__testLocationRequests = [];
    window.__testClearedLocationWatches = [];
    let nextLocationWatchId = 1;
    navigator.mediaDevices.getUserMedia = async constraints => {
      window.__testDeviceRequests.push(constraints);
      if (!constraints.video || constraints.audio) throw new Error("Unexpected real device request");
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext("2d");
      const draw = () => {
        context.fillStyle = "#355e69";
        context.fillRect(0, 0, 640, 480);
        context.fillStyle = "#e4b47b";
        context.fillRect(80 + Math.sin(Date.now() / 200) * 30, 90, 160, 180);
        context.fillStyle = "#f5f6ed";
        context.font = "24px sans-serif";
        context.fillText("Synthetic camera preview", 125, 360);
      };
      draw();
      const interval = setInterval(draw, 60);
      const stream = canvas.captureStream(15);
      stream.getVideoTracks()[0].addEventListener("ended", () => clearInterval(interval));
      window.__testStreams.push(stream);
      return stream;
    };
    navigator.mediaDevices.enumerateDevices = async () => {
      window.__testCapabilityReads.push("devices");
      return [
        { kind: "videoinput", deviceId: "synthetic-camera", label: "Synthetic camera" },
        { kind: "audioinput", deviceId: "synthetic-microphone", label: "Synthetic microphone" },
      ];
    };
    Object.defineProperty(navigator, "permissions", { configurable: true, value: {
      query: async ({ name }) => {
        window.__testCapabilityReads.push(`permission:${name}`);
        return { state: name === "camera" ? "granted" : "prompt" };
      },
    } });
    Object.defineProperty(navigator, "storage", { configurable: true, value: {
      estimate: async () => {
        window.__testCapabilityReads.push("storage");
        return { usage: 2 * 1024 * 1024, quota: 50 * 1024 * 1024 };
      },
    } });
    navigator.geolocation.watchPosition = (success, error, options) => {
      const id = nextLocationWatchId++;
      window.__testLocationRequests.push({ kind: "watch", id, options });
      queueMicrotask(() => success({ coords: { latitude: -45.0312, longitude: 168.6626, accuracy: 8 }, timestamp: Date.now() }));
      return id;
    };
    navigator.geolocation.clearWatch = id => { window.__testClearedLocationWatches.push(id); };
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      window.__testLocationRequests.push({ kind: "current", options });
      queueMicrotask(() => success({ coords: { latitude: -45.0312, longitude: 168.6626, accuracy: 8 }, timestamp: Date.now() }));
    };
  });
  await page.goto(`${base}?panel=tasks&date=2026-09-29&right=camera`);
  const shutter = page.locator(".trip-camera-shutter");
  await page.waitForFunction(() => !document.querySelector(".trip-camera-shutter")?.disabled
    && document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), 1);
  await page.waitForFunction(() => window.__testLocationRequests.filter(request => request.kind === "watch").length === 1);
  const before = await page.locator(".trip-camera").evaluate(node => {
    const camera = node.getBoundingClientRect();
    const video = node.querySelector("video").getBoundingClientRect();
    const controls = node.querySelector(".trip-camera-controls").getBoundingClientRect();
    return { objectFit: getComputedStyle(node.querySelector("video")).objectFit,
      fullFrame: camera.width === video.width && camera.height === video.height,
      controlsOverlay: controls.top > video.top && controls.bottom < video.bottom,
      locationBackground: getComputedStyle(node.querySelector(".trip-camera-location")).backgroundColor,
      controlsBackground: getComputedStyle(node.querySelector(".trip-camera-controls")).backgroundColor };
  });
  assert.equal(before.objectFit, "cover");
  assert(before.fullFrame && before.controlsOverlay);
  assert.equal(before.locationBackground, "rgba(0, 0, 0, 0)");
  assert.equal(before.controlsBackground, "rgba(0, 0, 0, 0)");
  await page.evaluate(async () => {
    window.__mediaLibrary = await import("./src/adventure/media/library.js");
    await window.__mediaLibrary.initializeMediaLibrary();
  });
  await shutter.click();
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 1);
  const center = await shutter.boundingBox();
  await page.mouse.move(center.x + center.width / 2, center.y + center.height / 2);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".trip-camera-recording")?.textContent.includes("00:01"));
  assert.equal(await page.locator(".trip-camera-shutter-ring").evaluate(node => getComputedStyle(node).animationName), "trip-camera-recording-spin");
  const rotation = await page.locator(".trip-camera-shutter-ring").evaluate(node => getComputedStyle(node).transform);
  await page.waitForFunction(previous => getComputedStyle(document.querySelector(".trip-camera-shutter-ring")).transform !== previous, rotation);
  if (output) await page.screenshot({ path: `${output}/camera-recording-desktop.png` });
  await page.mouse.up();
  await page.locator(".trip-camera-recording").waitFor({ state: "detached" });
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 2);
  assert.deepEqual(await page.evaluate(() => window.__mediaLibrary.getMediaSnapshot().items.map(item => item.kind).sort()), ["image", "video"]);

  await shutter.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector(".trip-camera-recording")?.textContent.includes("00:01"));
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 3);
  assert.deepEqual(await page.evaluate(() => window.__mediaLibrary.getMediaSnapshot().items.map(item => item.kind).sort()), ["image", "video", "video"]);
  await page.getByRole("button", { name: "相册", exact: true }).click();
  await page.locator(".trip-media-item").first().waitFor();
  assert.equal(await page.evaluate(() => window.__testStreams.flatMap(stream => stream.getTracks()).some(track => track.readyState === "live")), false);
  assert.equal(await page.locator(".trip-media-item").count(), 3);
  assert.equal(await page.locator(".trip-media-item-caption").count(), 0);
  const firstCard = page.locator(".trip-media-item").first();
  const firstItem = firstCard.locator(".trip-media-item-hit");
  assert.equal(await firstCard.locator(":scope > .trip-pencil-surface-content").count(), 1);
  assert.equal(await firstCard.locator(":scope > .trip-pencil-surface-border-ink").count(), 1);
  assert.equal(await firstCard.evaluate(node => getComputedStyle(node).paddingTop), "0px");
  assert.equal(await firstCard.locator(".trip-media-item-asset :is(img,video)").evaluate(node => getComputedStyle(node).objectFit), "cover");
  const quickActions = firstCard.locator(".trip-media-item-quick-actions");
  await firstItem.focus();
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".trip-media-item-quick-actions")).opacity === "1");
  assert.equal(await quickActions.evaluate(node => getComputedStyle(node).opacity), "1");
  const favoriteButton = firstCard.getByRole("button", { name: "收藏", exact: true });
  await favoriteButton.click();
  const favoriteId = await firstItem.getAttribute("data-media-id");
  await page.waitForFunction(id => window.__mediaLibrary.getMediaSnapshot().items.find(item => item.id === id)?.favorite === true, favoriteId);
  await firstItem.focus();
  assert.equal(await quickActions.evaluate(node => getComputedStyle(node).opacity), "1");
  await page.keyboard.press("Shift+F10");
  await page.getByRole("menuitem", { name: "查看拍摄信息" }).waitFor();
  await page.getByRole("menuitem", { name: "编辑补充信息" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("menuitem", { name: "查看拍摄信息" }).waitFor({ state: "detached" });
  assert.equal(await firstItem.evaluate(node => document.activeElement === node), true);
  await firstItem.click();
  await page.getByRole("tab", { name: "拍摄信息" }).waitFor();
  assert.equal(await page.getByRole("tab", { name: "拍摄信息" }).getAttribute("class"), "trip-adventure-calendar-scope");
  assert.equal(await page.locator(".trip-media-back").count(), 0);
  await page.getByRole("tab", { name: "补充信息" }).focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.getByRole("tab", { name: "拍摄信息" }).getAttribute("aria-selected"), "true");
  await page.getByRole("tab", { name: "补充信息" }).click();
  const attribution = page.getByLabel("修正摄影者署名");
  await attribution.fill("First item attribution");
  await page.getByRole("button", { name: "返回相册", exact: true }).click();
  await page.locator(".trip-media-grid").waitFor();
  const secondCard = page.locator(".trip-media-item").nth(1);
  await secondCard.locator(".trip-media-item-hit").focus();
  await page.keyboard.press("Shift+F10");
  await page.getByRole("menuitem", { name: "编辑补充信息" }).click();
  assert.equal(await page.getByRole("tab", { name: "补充信息" }).getAttribute("aria-selected"), "true");
  const secondId = new URL(page.url()).searchParams.get("mediaId");
  const secondAttribution = page.getByLabel("修正摄影者署名");
  await secondAttribution.fill("");
  await secondAttribution.blur();
  await page.waitForFunction(({ firstId, secondId }) => {
    const items = window.__mediaLibrary.getMediaSnapshot().items;
    return items.find(item => item.id === firstId)?.photographer?.nickname === "First item attribution"
      && items.find(item => item.id === secondId)?.photographer?.nickname === "";
  }, { firstId: favoriteId, secondId });
  assert.equal(await page.getByRole("button", { name: "保存", exact: true }).count(), 0);
  const formAlignment = await page.locator(".trip-media-detail-form").first().evaluate(form => ({
    labelText: form.querySelector(".trip-camera-form-label-text").getBoundingClientRect().left,
    headerText: document.querySelector(".trip-panel-heading").getBoundingClientRect().left,
    iconWidth: form.querySelector(".trip-camera-form-label-icon").getBoundingClientRect().width,
    iconCanvasWidth: form.querySelector(".trip-pencil-icon").getBoundingClientRect().width,
  }));
  assert(Math.abs(formAlignment.labelText - formAlignment.headerText) <= 1);
  assert.equal(formAlignment.iconWidth, 44);
  assert.equal(formAlignment.iconCanvasWidth, 30);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "删除媒体" }).click();
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 2);
  await page.locator(".trip-media-grid").waitFor();
  if (output) await page.screenshot({ path: `${output}/camera-album-desktop.png` });

  await page.getByRole("button", { name: "返回相机", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), 2);
  await page.getByRole("button", { name: "相机设置", exact: true }).click();
  const nickname = page.getByLabel("摄影者昵称", { exact: true });
  await nickname.fill("Test photographer");
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().identity.nickname === "Test photographer");
  assert.equal(await page.getByRole("button", { name: "保存", exact: true }).count(), 0);
  const settingsAlignment = await page.locator(".trip-camera-settings-section").first().evaluate(section => ({
    labelText: section.querySelector(".trip-camera-form-label-text").getBoundingClientRect().left,
    headerText: document.querySelector(".trip-panel-heading").getBoundingClientRect().left,
    iconWidth: section.querySelector(".trip-camera-form-label-icon").getBoundingClientRect().width,
    iconCanvasWidth: section.querySelector(".trip-pencil-icon").getBoundingClientRect().width,
  }));
  assert(Math.abs(settingsAlignment.labelText - settingsAlignment.headerText) <= 1);
  assert.equal(settingsAlignment.iconWidth, 44);
  assert.equal(settingsAlignment.iconCanvasWidth, 30);
  const locationRequestsBeforeSettings = await page.evaluate(() => window.__testLocationRequests.length);
  const captureLocation = page.getByRole("checkbox", { name: "拍摄定位", exact: true });
  assert.equal(await captureLocation.isChecked(), true);
  await captureLocation.uncheck();
  await page.waitForFunction(() => localStorage.getItem("nz-trip-camera-location") === "off"
    && window.__testClearedLocationWatches.length >= 1);
  const deviceRequestsBeforeInfo = await page.evaluate(() => window.__testDeviceRequests.length);
  await page.getByRole("button", { name: "设备信息", exact: true }).click();
  await page.getByText("Synthetic camera", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), deviceRequestsBeforeInfo);
  const capabilityReads = await page.evaluate(() => window.__testCapabilityReads);
  for (const expected of ["devices", "permission:camera", "permission:geolocation", "permission:microphone", "storage"])
    assert(capabilityReads.includes(expected));
  assert.equal(await page.evaluate(() => window.__testLocationRequests.length), locationRequestsBeforeSettings);
  if (output) await page.screenshot({ path: `${output}/camera-settings-desktop.png` });
  await page.setViewportSize({ width: 436, height: 900 });
  if (output) await page.screenshot({ path: `${output}/camera-settings-mobile.png` });
  await page.getByRole("button", { name: "返回相机设置", exact: true }).click();
  await page.getByRole("button", { name: "返回相机", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), 3);
  assert.equal(await page.evaluate(() => window.__testLocationRequests.length), locationRequestsBeforeSettings);
  const locationWatchesBeforeEnable = await page.evaluate(() => window.__testLocationRequests.filter(request => request.kind === "watch").length);
  await page.getByRole("button", { name: "开启拍摄定位", exact: true }).click();
  await page.waitForFunction(expected => localStorage.getItem("nz-trip-camera-location") === "on"
    && window.__testLocationRequests.filter(request => request.kind === "watch").length === expected + 1,
  locationWatchesBeforeEnable);
  await page.evaluate(() => {
    window.__originalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem() { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
  });
  await page.getByRole("button", { name: "关闭拍摄定位", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "开启拍摄定位", exact: true }).getAttribute("aria-pressed"), "false");
  await page.evaluate(() => { Storage.prototype.setItem = window.__originalStorageSetItem; });
  await page.getByRole("button", { name: "开启拍摄定位", exact: true }).click();
  await page.evaluate(() => {
    let hidden = true;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    window.__setTestHidden = value => { hidden = value; document.dispatchEvent(new Event("visibilitychange")); };
    window.__setTestHidden(true);
  });
  await page.waitForFunction(() => window.__testStreams.flatMap(stream => stream.getTracks()).every(track => track.readyState === "ended"));
  await page.evaluate(() => window.__setTestHidden(false));
  await page.waitForFunction(() => window.__testDeviceRequests.length === 4
    && document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
  if (output) await page.screenshot({ path: `${output}/camera-preview-mobile.png` });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  await page.setViewportSize({ width: 1145, height: 964 });
  await page.goto(`${base}?panel=tasks&date=2026-09-29`);
  await page.locator("#trip-calendar-region").waitFor();
  await page.waitForFunction(() => document.querySelector(".trip-pencil-map")?._pencilStats?.frames > 0);
  for (const appearance of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: appearance });
    await page.waitForFunction(value => document.documentElement.dataset.adventureAppearance === value, appearance);
    const edge = await page.locator(".trip-adventure-calendar").evaluate(root => {
      const header = root.querySelector(".trip-adventure-calendar-header");
      const canvas = header.querySelector(".trip-adventure-calendar-ink");
      const context = canvas.getContext("2d");
      const top = context.getImageData(0, 0, canvas.width, 1).data;
      return { parent: getComputedStyle(root).backgroundColor, parentImage: getComputedStyle(root).backgroundImage,
        header: getComputedStyle(header).backgroundColor,
        transparentTopPixels: [...top].filter((value, index) => index % 4 === 3 && value === 0).length };
    });
    assert.equal(edge.parent, "rgba(0, 0, 0, 0)");
    assert.equal(edge.parentImage, "none");
    assert.equal(edge.header, "rgba(0, 0, 0, 0)");
    assert(edge.transparentTopPixels > 500);
    if (output) await page.screenshot({ path: `${output}/calendar-edge-${appearance}.png` });
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ syntheticPhoto: true, pointerVideo: true, keyboardVideo: true,
    recordingTimerAndAnimation: true, stoppedOnAlbum: true, controlledMediaDetail: true,
    confirmedSyntheticDelete: true, cameraSettingsAutosave: true, mediaAttributionAutosave: true,
    clippedThumbnailAndActions: true, persistentFavorite: true, sharedMediaTabs: true, alignedFormLabels: true,
    deviceInfoReadOnly: true,
    automaticPreviewAndVisibilityRestart: true, persistentSyntheticLocation: true,
    fullBleedOverlay: before, calendarClipping: true, errors }));
} finally {
  await browser.close();
}
