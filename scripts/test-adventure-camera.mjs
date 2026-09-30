import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { createCameraNicknameAutosave } from "../src/adventure/cameraNicknameAutosave.js";
import { downloadMediaBlob, mediaDownloadName } from "../src/adventure/cameraMediaDownload.js";
import { createPermissionPromptGate, observeBrowserPermission } from "../src/adventure/cameraPermissionLifecycle.js";
import { cameraDeviceRoll, cameraIconCompensation, normalizeCameraAngle } from "../src/adventure/cameraIconOrientation.js";

assert.equal(normalizeCameraAngle(270), -90);
assert.equal(cameraDeviceRoll(90, 0), 0);
assert.equal(Math.round(cameraDeviceRoll(90, 45)), 0);
assert.equal(Math.round(cameraDeviceRoll(60, 60)), 27);
assert.equal(Math.round(cameraIconCompensation(60, 60, 0)), -27);
assert.equal(Math.round(cameraIconCompensation(0, 90, 90)), 0);
assert.equal(cameraIconCompensation(0, 0, 0), null);

const [cameraCss, cameraSource, sketchIconsSource, hardwareSource, hardwareCss, cutoutCss] = await Promise.all([
  readFile(new URL("../src/adventure/AdventureCamera.css", import.meta.url), "utf8"),
  readFile(new URL("../src/adventure/AdventureCamera.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/adventure/SketchIcons.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/adventure/CameraHardwareControls.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/adventure/CameraHardwareControls.css", import.meta.url), "utf8"),
  readFile(new URL("../src/adventure/AdventureDeviceCutout.css", import.meta.url), "utf8"),
]);
assert.match(cameraCss, /\.trip-camera-header-actions\s*\{[^}]*grid-area:auto;[^}]*grid-column:auto;[^}]*grid-row:auto;/s);
assert.match(cameraCss, /\.trip-camera-header-actions \.trip-pane-expand\s*\{[^}]*width:44px;[^}]*height:44px;/s);
assert.match(cameraSource, /className="trip-camera-control trip-camera-facing-toggle"/);
assert.match(cameraSource, /startPreview\(true, nextFacing, true\)/);
assert.match(sketchIconsSource, /function SketchIcon\(props\)\s*\{\s*return <PencilIcon \{\.\.\.props\} \/>;/s);
assert.match(sketchIconsSource, /export function PhotoAlbumIcon\(props\) \{ return <PhotosIcon \{\.\.\.props\} \/>; \}/);
assert.match(hardwareSource, /import \{ CameraZoomDial \} from "\.\/CameraZoomDial\.jsx"/);
assert.match(hardwareSource, /<\/div>\}\s*\{controller\.zoom && <CameraZoomDial zoom=\{controller\.zoom\} en=\{en\} \/>\}/);
assert.doesNotMatch(hardwareSource, /type="range"|trip-camera-hardware-zoom|function ZoomIcon/);
assert.doesNotMatch(hardwareCss, /trip-camera-hardware-zoom|flex-wrap/);
assert.match(hardwareCss, /\.trip-camera-hardware-controls\s*\{[^}]*top:calc\(var\(--trip-camera-settings-top\)[^;]+;[^}]*left:var\(--trip-camera-settings-left\);[^}]*flex-direction:column;/s);
assert.match(hardwareCss, /\.trip-camera-hardware-button\s*\{[^}]*flex:0 0 44px;[^}]*width:44px;[^}]*height:44px;/s);
assert.match(cameraCss, /\.trip-camera-settings-entry\s*\{[^}]*grid-area:auto;[^}]*top:var\(--trip-camera-settings-top\);[^}]*left:var\(--trip-camera-settings-left\);/s);
assert.doesNotMatch(cameraCss, /\[data-responsive-layout=phone-landscape\] \.trip-camera-(?:settings-entry|header-actions)\s*\{/);
assert.match(cameraCss, /--trip-camera-shutter-x:calc\(100% - var\(--trip-camera-right-inset\) - 22px\);/);
assert.match(cameraCss, /--trip-camera-shutter-y:calc\(100% - var\(--trip-camera-bottom-inset\) - 38px\);/);
assert.match(cameraCss, /\.trip-camera-controls \.trip-camera-shutter\s*\{[^}]*top:var\(--trip-camera-shutter-y\);[^}]*left:var\(--trip-camera-shutter-x\);/s);
assert.match(cameraCss, /@container camera-preview \(max-width:320px\)[\s\S]*--trip-camera-album-bottom:max\(/);
assert.match(cutoutCss, /\[data-device-cutout="top-left"\][^{]*\.trip-day--camera\s*\{\s*--trip-camera-settings-top:max\(/);
assert.match(cutoutCss, /\[data-device-cutout="top-right"\] \.trip-day--camera\s*\{\s*--trip-camera-right-top-inset:max\(/);
assert.doesNotMatch(cutoutCss, /\.trip-camera-(?:control:first-child|facing-toggle)\s*\{/);

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
    permissionPromptGate: true, permissionChangeSubscription: true, mediaDownload: true,
    cameraOrientationCompensation: true, cameraControlStructure: true, iconPropForwarding: true }));
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

async function closeControlEvidence() {
  return page.evaluate(() => {
    const actions = document.querySelector(".trip-camera-header-actions");
    const button = actions?.querySelector(".trip-close");
    const canvas = button?.querySelector("canvas.trip-pencil-icon");
    if (!actions || !button || !canvas) return null;
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    const actionStyle = getComputedStyle(actions);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let lightPixels = 0, coloredPixels = 0, opaquePixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 32) continue;
      opaquePixels += 1;
      const luminance = pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114;
      if (luminance >= 180) lightPixels += 1;
      if (Math.max(pixels[index], pixels[index + 1], pixels[index + 2])
        - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) > 30) coloredPixels += 1;
    }
    return {
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
        width: rect.width, height: rect.height },
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
      actionsZIndex: actionStyle.zIndex,
      actionsGridColumnStart: actionStyle.gridColumnStart,
      actionsGridRowStart: actionStyle.gridRowStart,
      hit: button.contains(document.elementFromPoint(centerX, centerY)),
      opaquePixels,
      lightPixels,
      coloredPixels,
      backdropAttribute: canvas.dataset.themeBackdrop ?? null,
    };
  });
}

try {
  await page.addInitScript(() => {
    localStorage.setItem("nz-trip-camera-audio", "off");
    window.__testStreams = [];
    window.__testDeviceRequests = [];
    window.__testCapabilityReads = [];
    window.__testLocationRequests = [];
    window.__testClearedLocationWatches = [];
    window.__testMismatchNextFacing = false;
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
      const videoTrack = stream.getVideoTracks()[0];
      const requestedFacing = constraints.video?.facingMode?.ideal;
      const reportedFacing = window.__testMismatchNextFacing
        ? requestedFacing === "user" ? "environment" : "user"
        : requestedFacing;
      window.__testMismatchNextFacing = false;
      Object.defineProperty(videoTrack, "getSettings", { configurable: true,
        value: () => ({ facingMode: reportedFacing }) });
      videoTrack.addEventListener("ended", () => clearInterval(interval));
      window.__testStreams.push(stream);
      return stream;
    };
    navigator.mediaDevices.enumerateDevices = async () => {
      window.__testCapabilityReads.push("devices");
      return [
        { kind: "videoinput", deviceId: "synthetic-rear-camera", label: "Synthetic rear camera" },
        { kind: "videoinput", deviceId: "synthetic-front-camera", label: "Synthetic front camera" },
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
    const leading = document.querySelector(".trip-camera-header .trip-panel-leading").getBoundingClientRect();
    const album = node.querySelector(".trip-camera-control:first-child").getBoundingClientRect();
    const shutter = node.querySelector(".trip-camera-shutter").getBoundingClientRect();
    const systemCamera = node.querySelector(".trip-camera-system-capture").getBoundingClientRect();
    return { objectFit: getComputedStyle(node.querySelector("video")).objectFit,
      fullFrame: camera.width === video.width && camera.height === video.height,
      controlsOverlay: album.top >= video.top && systemCamera.bottom <= video.bottom
        && shutter.top > video.top && shutter.bottom < video.bottom,
      controlsAtRight: [album, shutter, systemCamera].every(rect => rect.right <= video.right
        && rect.left > video.left + video.width / 2),
      albumAlignedToLeading: Math.abs(album.top + album.height / 2 - leading.top - leading.height / 2) < 1,
      rightControlCentersAligned: Math.max(album.left + album.width / 2, shutter.left + shutter.width / 2,
        systemCamera.left + systemCamera.width / 2) - Math.min(album.left + album.width / 2,
        shutter.left + shutter.width / 2, systemCamera.left + systemCamera.width / 2) < 1,
      locationControlCount: node.querySelectorAll(".trip-camera-location").length,
      gridLineCount: node.querySelectorAll(".trip-camera-grid span").length,
      controlsBackground: getComputedStyle(node.querySelector(".trip-camera-controls")).backgroundColor };
  });
  assert.equal(before.objectFit, "cover");
  assert(before.fullFrame && before.controlsOverlay && before.controlsAtRight
    && before.albumAlignedToLeading && before.rightControlCentersAligned);
  assert.equal(before.locationControlCount, 0);
  assert.equal(before.gridLineCount, 4);
  assert.equal(before.controlsBackground, "rgba(0, 0, 0, 0)");
  const systemCameraInput = page.locator(".trip-camera-upload-input");
  assert.equal(await systemCameraInput.getAttribute("multiple"), null);
  assert.equal(await systemCameraInput.getAttribute("accept"), "image/*,video/*");
  assert.equal(await systemCameraInput.getAttribute("capture"), "environment");
  assert.equal(await page.getByRole("button", { name: "使用系统相机", exact: true }).count(), 1);
  const facingToggle = page.getByRole("button", { name: "切换到前置相机", exact: true });
  assert.equal(await facingToggle.count(), 1);
  assert.equal(await page.locator(".trip-camera-preview video").evaluate(video => getComputedStyle(video).transform), "none");
  const previousStreamCount = await page.evaluate(() => window.__testStreams.length);
  await facingToggle.click();
  await page.waitForFunction(expected => window.__testDeviceRequests.length === expected + 1
    && window.__testDeviceRequests.at(-1)?.video?.facingMode?.ideal === "user", previousStreamCount);
  assert.equal(await page.evaluate(() => window.__testStreams[0].getTracks().every(track => track.readyState === "ended")), true);
  assert.equal(await page.getByRole("button", { name: "切换到后置相机", exact: true }).count(), 1);
  assert.equal(await page.locator(".trip-camera-facing-toggle .trip-pencil-icon").getAttribute("data-theme-backdrop"), "true");
  assert.equal(await page.locator(".trip-camera-status").innerText(), "");
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".trip-camera-preview video")).transform === "matrix(-1, 0, 0, 1, 0, 0)");
  await page.evaluate(() => { window.__testMismatchNextFacing = true; });
  await page.getByRole("button", { name: "切换到后置相机", exact: true }).click();
  await page.waitForFunction(() => window.__testDeviceRequests.length === 4
    && window.__testDeviceRequests.at(-1)?.video?.facingMode?.ideal === "user");
  assert.equal(await page.getByRole("button", { name: "切换到后置相机", exact: true }).count(), 1);
  assert.match(await page.locator(".trip-camera-status").innerText(), /无法切换镜头/);
  assert.equal(await page.locator(".trip-camera-preview video").evaluate(video => getComputedStyle(video).transform), "matrix(-1, 0, 0, 1, 0, 0)");
  await page.evaluate(async () => {
    window.__mediaLibrary = await import("./src/adventure/media/library.js");
    await window.__mediaLibrary.initializeMediaLibrary();
  });
  await shutter.click();
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 1);
  const statusBackdrop = page.locator(".trip-camera-status canvas[data-theme-backdrop]");
  await statusBackdrop.waitFor();
  const originalStatusPixels = await statusBackdrop.evaluate(canvas => canvas.toDataURL());
  const closeCanvas = page.locator(".trip-camera-header-actions .trip-close canvas[data-theme-backdrop]");
  const originalClosePixels = await closeCanvas.evaluate(canvas => canvas.toDataURL());
  await page.evaluate(() => { document.documentElement.dataset.adventureTheme = "fern"; });
  await page.waitForFunction(previous => document.querySelector(".trip-camera-status canvas[data-theme-backdrop]")?.toDataURL() !== previous, originalStatusPixels);
  assert.notEqual(await closeCanvas.evaluate(canvas => canvas.toDataURL()), originalClosePixels);
  const stableStatusPixels = await statusBackdrop.evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(await statusBackdrop.evaluate(canvas => canvas.toDataURL()), stableStatusPixels);
  const center = await shutter.boundingBox();
  await page.mouse.move(center.x + center.width / 2, center.y + center.height / 2);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".trip-camera-recording")?.textContent.includes("00:01"));
  assert.equal(await page.locator(".trip-camera-facing-toggle").isDisabled(), true);
  assert.equal(await shutter.locator(".trip-camera-record-dot:not(.is-pending)").count(), 1);
  assert.equal(await shutter.locator(".trip-pencil-icon").count(), 0);
  assert.equal(await shutter.evaluate(node => getComputedStyle(node).animationName), "none");
  const recordingBox = await shutter.boundingBox();
  assert.equal(recordingBox.width, center.width);
  assert.equal(recordingBox.height, center.height);
  if (output) await page.screenshot({ path: `${output}/camera-recording-desktop.png` });
  await page.mouse.up();
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".trip-camera-recording").count(), 1);
  assert.equal(await page.evaluate(() => window.__mediaLibrary.getMediaSnapshot().items.length), 1);
  await shutter.click();
  await page.locator(".trip-camera-recording").waitFor({ state: "detached" });
  assert.equal(await page.locator(".trip-camera-facing-toggle").isDisabled(), false);
  assert.equal(await shutter.locator(".trip-camera-record-dot").count(), 0);
  assert.equal(await shutter.locator(".trip-pencil-icon").count(), 1);
  await page.waitForFunction(() => window.__mediaLibrary.getMediaSnapshot().items.length === 2);
  assert.deepEqual(await page.evaluate(() => window.__mediaLibrary.getMediaSnapshot().items.map(item => item.kind).sort()), ["image", "video"]);

  await shutter.focus();
  await page.keyboard.down("Space");
  await page.waitForFunction(() => document.querySelector(".trip-camera-recording")?.textContent.includes("00:01"));
  await page.keyboard.up("Space");
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".trip-camera-recording").count(), 1);
  await page.keyboard.press("Space");
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
  await page.waitForFunction(id => document.activeElement?.dataset.mediaId === id, favoriteId);
  await firstItem.click({ position: { x: 12, y: 12 } });
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
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), 5);
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
  const compositionGrid = page.getByRole("checkbox", { name: "构图九宫格", exact: true });
  assert.equal(await compositionGrid.isChecked(), true);
  await compositionGrid.uncheck();
  await page.waitForFunction(() => localStorage.getItem("nz-trip-camera-grid") === "off");
  await captureLocation.uncheck();
  await page.waitForFunction(() => localStorage.getItem("nz-trip-camera-location") === "off"
    && window.__testClearedLocationWatches.length >= 1);
  const deviceRequestsBeforeInfo = await page.evaluate(() => window.__testDeviceRequests.length);
  await page.getByRole("button", { name: "设备信息", exact: true }).click();
  await page.getByText("Synthetic rear camera", { exact: true }).waitFor();
  await page.getByText("Synthetic front camera", { exact: true }).waitFor();
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
  assert.equal(await page.evaluate(() => window.__testDeviceRequests.length), 6);
  assert.equal(await page.evaluate(() => window.__testLocationRequests.length), locationRequestsBeforeSettings);
  const locationWatchesBeforeEnable = await page.evaluate(() => window.__testLocationRequests.filter(request => request.kind === "watch").length);
  assert.equal(await page.locator(".trip-camera-location").count(), 0);
  assert.equal(await page.locator(".trip-camera-grid").count(), 0);
  await page.getByRole("button", { name: "相机设置", exact: true }).click();
  await page.getByRole("checkbox", { name: "拍摄定位", exact: true }).check();
  await page.getByRole("checkbox", { name: "构图九宫格", exact: true }).check();
  await page.getByRole("button", { name: "返回相机", exact: true }).click();
  await page.waitForFunction(expected => localStorage.getItem("nz-trip-camera-location") === "on"
    && window.__testLocationRequests.filter(request => request.kind === "watch").length === expected + 1,
  locationWatchesBeforeEnable);
  await page.locator(".trip-camera-grid").waitFor();
  await page.evaluate(() => {
    window.__originalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem() { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
  });
  await page.getByRole("button", { name: "相机设置", exact: true }).click();
  await page.getByRole("checkbox", { name: "拍摄定位", exact: true }).uncheck();
  assert.equal(await page.getByRole("checkbox", { name: "拍摄定位", exact: true }).isChecked(), false);
  await page.evaluate(() => { Storage.prototype.setItem = window.__originalStorageSetItem; });
  await page.getByRole("checkbox", { name: "拍摄定位", exact: true }).check();
  await page.getByRole("button", { name: "返回相机", exact: true }).click();
  const deviceRequestsBeforeVisibility = await page.evaluate(() => window.__testDeviceRequests.length);
  await page.evaluate(() => {
    let hidden = true;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    window.__setTestHidden = value => { hidden = value; document.dispatchEvent(new Event("visibilitychange")); };
    window.__setTestHidden(true);
  });
  await page.waitForFunction(() => window.__testStreams.flatMap(stream => stream.getTracks()).every(track => track.readyState === "ended"));
  await page.evaluate(() => window.__setTestHidden(false));
  await page.waitForFunction(previous => window.__testDeviceRequests.length === previous + 1
    && document.querySelector(".trip-camera-preview video")?.videoWidth > 0, deviceRequestsBeforeVisibility);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForFunction(() => document.querySelector("#trip-board-structure")?.dataset.responsiveLayout === "phone-portrait");
  const portraitControls = await page.evaluate(() => {
    const root = document.querySelector(".trip-camera").getBoundingClientRect();
    const settings = document.querySelector(".trip-camera-settings-entry").getBoundingClientRect();
    const close = document.querySelector(".trip-camera-header-actions .trip-close").getBoundingClientRect();
    const album = document.querySelector(".trip-camera-control:first-child").getBoundingClientRect();
    const facing = document.querySelector(".trip-camera-facing-toggle").getBoundingClientRect();
    const shutterBox = document.querySelector(".trip-camera-shutter").getBoundingClientRect();
    const systemCamera = document.querySelector(".trip-camera-system-capture").getBoundingClientRect();
    return {
      settingsTopLeft: settings.left < root.left + root.width / 2 && settings.top < root.top + root.height / 2,
      closeTopRight: close.left > root.left + root.width / 2 && close.top < root.top + root.height / 2,
      albumBottomLeft: album.left < root.left + root.width / 2 && album.top > root.top + root.height / 2,
      facingAboveAlbum: album.top >= facing.bottom && album.top - facing.bottom <= 4
        && facing.left === album.left && facing.left >= root.left && album.right < shutterBox.left,
      systemBottomRight: systemCamera.left > root.left + root.width / 2 && systemCamera.top > root.top + root.height / 2,
      shutterBottomCenter: Math.abs(shutterBox.left + shutterBox.width / 2 - root.left - root.width / 2) < 1
        && root.bottom - shutterBox.bottom >= 0 && root.bottom - shutterBox.bottom < 80,
      settingsIcon: document.querySelector(".trip-camera-settings-entry .trip-pencil-icon")?.dataset.icon,
      titleHidden: getComputedStyle(document.querySelector(".trip-camera-header .trip-panel-heading")).display === "none",
    };
  });
  assert(portraitControls.settingsTopLeft && portraitControls.closeTopRight && portraitControls.albumBottomLeft
    && portraitControls.facingAboveAlbum && portraitControls.systemBottomRight
    && portraitControls.shutterBottomCenter && portraitControls.titleHidden);
  assert.equal(portraitControls.settingsIcon, "camera");
  const portraitCloseEvidence = await closeControlEvidence();
  assert(portraitCloseEvidence);
  assert.equal(portraitCloseEvidence.rect.width, 44);
  assert.equal(portraitCloseEvidence.rect.height, 44);
  assert.notEqual(portraitCloseEvidence.display, "none");
  assert.equal(portraitCloseEvidence.visibility, "visible");
  assert.equal(portraitCloseEvidence.opacity, "1");
  assert.notEqual(portraitCloseEvidence.pointerEvents, "none");
  assert.equal(portraitCloseEvidence.actionsGridColumnStart, "auto");
  assert.equal(portraitCloseEvidence.actionsGridRowStart, "auto");
  assert(portraitCloseEvidence.hit && portraitCloseEvidence.opaquePixels > 0
    && portraitCloseEvidence.lightPixels > 0 && portraitCloseEvidence.coloredPixels > 0);
  assert.equal(portraitCloseEvidence.backdropAttribute, "true");
  await page.setViewportSize({ width: 932, height: 430 });
  await page.waitForFunction(() => document.querySelector("#trip-board-structure")?.dataset.automaticFullscreen === "right");
  const landscapeControls = await page.evaluate(() => {
    const root = document.querySelector(".trip-camera").getBoundingClientRect();
    const leading = document.querySelector(".trip-camera-header .trip-panel-leading").getBoundingClientRect();
    const close = document.querySelector(".trip-camera-header-actions .trip-close").getBoundingClientRect();
    const album = document.querySelector(".trip-camera-control:first-child").getBoundingClientRect();
    const facing = document.querySelector(".trip-camera-facing-toggle").getBoundingClientRect();
    const shutterBox = document.querySelector(".trip-camera-shutter").getBoundingClientRect();
    const systemCamera = document.querySelector(".trip-camera-system-capture").getBoundingClientRect();
    return {
      settingsTopLeft: leading.left < root.left + root.width / 2 && leading.top < root.top + root.height / 2,
      closeBottomLeft: close.left < root.left + root.width / 2 && close.top > root.top + root.height / 2,
      albumAlignedToSettings: Math.abs(album.top + album.height / 2 - leading.top - leading.height / 2) < 1,
      facingBelowAlbum: facing.top >= album.bottom && facing.top - album.bottom <= 4
        && Math.abs(facing.left + facing.width / 2 - album.left - album.width / 2) < 1,
      systemAlignedToClose: Math.abs(systemCamera.top + systemCamera.height / 2 - close.top - close.height / 2) < 1,
      rightCentersAligned: Math.max(album.left + album.width / 2, shutterBox.left + shutterBox.width / 2,
        systemCamera.left + systemCamera.width / 2) - Math.min(album.left + album.width / 2,
        shutterBox.left + shutterBox.width / 2, systemCamera.left + systemCamera.width / 2) < 1,
      shutterVerticallyCentered: Math.abs(shutterBox.top + shutterBox.height / 2 - root.top - root.height / 2) < 1,
      titleHidden: getComputedStyle(document.querySelector(".trip-camera-header .trip-panel-heading")).display === "none",
      settingsIcon: document.querySelector(".trip-camera-settings-entry .trip-pencil-icon")?.dataset.icon,
      systemBottomInset: Math.round(root.bottom - systemCamera.bottom),
      albumRightInset: Math.round(root.right - album.right),
      systemRightInset: Math.round(root.right - systemCamera.right),
    };
  });
  assert(landscapeControls.settingsTopLeft && landscapeControls.closeBottomLeft
    && landscapeControls.albumAlignedToSettings && landscapeControls.systemAlignedToClose
    && landscapeControls.facingBelowAlbum && landscapeControls.rightCentersAligned && landscapeControls.shutterVerticallyCentered
    && landscapeControls.titleHidden);
  assert.equal(landscapeControls.settingsIcon, "camera");
  assert.equal(landscapeControls.albumRightInset, landscapeControls.systemRightInset);
  assert(landscapeControls.albumRightInset >= 16 && landscapeControls.systemBottomInset >= 9);
  assert.equal(await page.getByRole("button", { name: "相机设置", exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "关闭面板", exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: /全屏面板|退出全屏/ }).count(), 0);
  const landscapeCloseEvidence = await closeControlEvidence();
  assert(landscapeCloseEvidence);
  assert.equal(landscapeCloseEvidence.rect.width, 44);
  assert.equal(landscapeCloseEvidence.rect.height, 44);
  assert.notEqual(landscapeCloseEvidence.display, "none");
  assert.equal(landscapeCloseEvidence.visibility, "visible");
  assert.equal(landscapeCloseEvidence.opacity, "1");
  assert.notEqual(landscapeCloseEvidence.pointerEvents, "none");
  assert.equal(landscapeCloseEvidence.actionsGridColumnStart, "auto");
  assert.equal(landscapeCloseEvidence.actionsGridRowStart, "auto");
  assert(landscapeCloseEvidence.hit && landscapeCloseEvidence.opaquePixels > 0
    && landscapeCloseEvidence.lightPixels > 0 && landscapeCloseEvidence.coloredPixels > 0);
  assert.equal(landscapeCloseEvidence.backdropAttribute, "true");
  assert.equal(await page.locator(".trip-camera-settings-entry .trip-pencil-icon").getAttribute("data-theme-backdrop"), "true");
  assert.equal(await page.locator(".trip-camera-control:first-child .trip-pencil-icon").getAttribute("data-theme-backdrop"), "true");
  console.log(JSON.stringify({ cameraCloseEvidence: { portrait: portraitCloseEvidence, landscape: landscapeCloseEvidence } }));
  if (output) await page.screenshot({ path: `${output}/camera-preview-mobile.png` });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  await page.getByRole("button", { name: "相机设置", exact: true }).click();
  await page.getByLabel("摄影者昵称", { exact: true }).waitFor();
  assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), "right");
  assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
  await page.getByRole("button", { name: "返回相机", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".trip-camera-preview video")?.videoWidth > 0);
  await page.getByRole("button", { name: "关闭面板", exact: true }).click();
  await page.locator(".trip-camera").waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => window.__testStreams.flatMap(stream => stream.getTracks()).some(track => track.readyState === "live")), false);

  await page.setViewportSize({ width: 1145, height: 964 });
  await page.goto(`${base}?panel=tasks&date=2026-09-29`);
  await page.locator("#trip-calendar-region").waitFor();
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
    recordingTimerAndStaticState: true, stoppedOnAlbum: true, controlledMediaDetail: true,
    confirmedSyntheticDelete: true, cameraSettingsAutosave: true, mediaAttributionAutosave: true,
    clippedThumbnailAndActions: true, persistentFavorite: true, sharedMediaTabs: true, alignedFormLabels: true,
    deviceInfoReadOnly: true,
    automaticPreviewAndVisibilityRestart: true, persistentSyntheticLocation: true,
    cameraFacingSwitch: true, cameraFacingMismatchRecovery: true,
    closeControlEvidence: { portrait: portraitCloseEvidence, landscape: landscapeCloseEvidence },
    fullBleedOverlay: before, calendarClipping: true, errors }));
} finally {
  await browser.close();
}
