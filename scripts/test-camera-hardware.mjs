import assert from "node:assert/strict";
import {
  applyVerifiedCameraConstraints,
  cameraHardwareErrorMessage,
  cameraSettingMatches,
  clampCameraValue,
  createCameraHardwareTaskQueue,
  inspectCameraHardwareCapabilities,
  inspectCameraHardwareTrack,
  resolveCameraPhotoSettings,
} from "../src/adventure/cameraHardware.js";

const capabilities = inspectCameraHardwareCapabilities({
  zoom: { min: 1, max: 5, step: .5 },
  torch: true,
  focusMode: ["continuous", "manual"],
  focusDistance: { min: 0, max: 10, step: .25 },
}, {
  zoom: 1,
  torch: false,
  focusMode: "continuous",
  focusDistance: 4,
}, {
  fillLightMode: ["off", "auto", "flash", "screen"],
});
assert.deepEqual(capabilities.zoom, { min: 1, max: 5, step: .5 });
assert.deepEqual(capabilities.flashModes, ["off", "auto", "flash"]);
assert.equal(capabilities.manualFocus, true);
assert.equal(capabilities.autoMode, "continuous");
assert.equal(capabilities.preferenceKey, "facing:unknown");
assert.deepEqual(resolveCameraPhotoSettings(capabilities.flashModes), { fillLightMode: "off" });
assert.deepEqual(resolveCameraPhotoSettings(capabilities.flashModes, "flash"), { fillLightMode: "flash" });
assert.deepEqual(resolveCameraPhotoSettings([], "flash"), {});
assert.deepEqual(resolveCameraPhotoSettings(["auto", "flash"]), {});
assert.deepEqual(resolveCameraPhotoSettings(["auto", "flash"], "auto"), { fillLightMode: "auto" });
assert.equal(clampCameraValue(4.76, capabilities.zoom), 5);
assert.equal(cameraSettingMatches(2.50001, 2.5, capabilities.zoom), true);

const unsupported = inspectCameraHardwareCapabilities({ torch: false, focusMode: ["continuous"] }, {}, {
  fillLightMode: [],
});
assert.equal(unsupported.zoom, null);
assert.equal(unsupported.torch, false);
assert.deepEqual(unsupported.flashModes, []);
assert.equal(unsupported.manualFocus, false);
const manualWithoutRange = inspectCameraHardwareCapabilities({ focusMode: ["manual"] });
assert.equal(manualWithoutRange.manualFocus, false);
const manualWithoutAuto = inspectCameraHardwareCapabilities({
  focusMode: ["manual"],
  focusDistance: { min: 0, max: 1, step: .1 },
});
assert.equal(manualWithoutAuto.manualFocus, true);
assert.equal(manualWithoutAuto.autoMode, null);

const probed = await inspectCameraHardwareTrack({
  readyState: "live",
  getCapabilities: () => ({ zoom: { min: 1, max: 2, step: .1 } }),
  getSettings: () => ({ deviceId: "rear-camera", zoom: 1 }),
}, class HangingImageCapture {
  getPhotoCapabilities() { return new Promise(() => {}); }
}, 10);
assert.deepEqual(probed.zoom, { min: 1, max: 2, step: .1 });
assert.deepEqual(probed.flashModes, []);
assert.equal(probed.preferenceKey, "device:rear-camera");
const unsupportedProbe = await inspectCameraHardwareTrack({ readyState: "live" }, undefined, 10);
assert.equal(unsupportedProbe.zoom, null);
assert.equal(unsupportedProbe.manualFocus, false);
assert.match(unsupportedProbe.preferenceKey, /^track:/);

const settings = { zoom: 1, torch: false };
const applications = [];
const track = {
  readyState: "live",
  getConstraints: () => ({
    width: { ideal: 1920 }, height: 1080, facingMode: "environment", focusMode: "continuous",
    advanced: [{ zoom: 2, torch: true, frameRate: 30 }, { height: 1080 }],
  }),
  getSettings: () => ({ ...settings }),
  async applyConstraints(nextConstraints) {
    applications.push(nextConstraints);
    Object.assign(settings, nextConstraints.advanced.at(-1));
  },
};
await applyVerifiedCameraConstraints(track, { zoom: 2.5 }, { zoom: 2.5 }, { zoom: capabilities.zoom });
assert.equal(settings.zoom, 2.5);
await assert.rejects(() => applyVerifiedCameraConstraints({
  readyState: "live",
  getSettings: () => ({ zoom: 1 }),
  applyConstraints: async () => {},
}, { zoom: 3 }, { zoom: 3 }, { zoom: capabilities.zoom }), { name: "CameraSettingVerificationError" });
const endingTrack = {
  readyState: "live",
  getSettings: () => ({ torch: true }),
  async applyConstraints() { this.readyState = "ended"; },
};
await assert.rejects(() => applyVerifiedCameraConstraints(endingTrack,
  { torch: true }, { torch: true }), { name: "AbortError" });
await assert.rejects(() => applyVerifiedCameraConstraints({ ...track, readyState: "ended" },
  { torch: true }, { torch: true }), { name: "AbortError" });

const queue = createCameraHardwareTaskQueue();
const order = [];
let release;
const gate = new Promise(resolve => { release = resolve; });
const first = queue.enqueue(async () => { order.push("first-start"); await gate; order.push("first-end"); });
const second = queue.enqueue(async () => { order.push("second"); });
const third = queue.enqueue(async () => { order.push("third"); throw new Error("expected queue failure"); });
const fourth = queue.enqueue(async () => { order.push("fourth"); });
await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(order, ["first-start"]);
release();
await Promise.all([first, second, third.catch(() => {}), fourth]);
assert.deepEqual(order, ["first-start", "first-end", "second", "third", "fourth"]);
assert.deepEqual(applications, [{
  focusMode: "continuous",
  zoom: 2.5,
  advanced: [{ torch: true }, { zoom: 2.5 }],
}]);

// Match the phone's initial stream constraints and Chromium's mixed-constraint rejection.
for (const requested of [{ focusMode: "continuous" }, { zoom: 2 }, { torch: false }]) {
  const deviceSettings = { width: 1920, height: 1080, facingMode: "environment", ...requested };
  await applyVerifiedCameraConstraints({
    readyState: "live",
    getConstraints: () => ({ width: 1920, height: 1080, facingMode: "environment" }),
    getSettings: () => ({ ...deviceSettings }),
    async applyConstraints(next) {
      for (const entry of [next, ...next.advanced]) {
        if (["width", "height", "facingMode"].some(name => name in entry)) {
          throw new DOMException("Mixing ImageCapture and non-ImageCapture constraints is not currently supported", "OverconstrainedError");
        }
      }
      assert.deepEqual(next, { ...requested, advanced: [requested] });
      Object.assign(deviceSettings, next.advanced.at(-1));
    },
  }, requested, requested);
  assert.equal(deviceSettings.width, 1920);
  assert.equal(deviceSettings.height, 1080);
}

assert.equal(cameraHardwareErrorMessage({ kind: "focus" }), "无法应用相机对焦设置。");
assert.equal(cameraHardwareErrorMessage({ kind: "zoom" }, true), "Could not apply camera zoom.");
assert.equal(cameraHardwareErrorMessage({ kind: "torch" }), "无法切换相机常亮灯。");
assert.equal(cameraHardwareErrorMessage(new Error("private device details")), "无法应用相机设置。");
assert.equal(cameraHardwareErrorMessage("Explicit error"), "Explicit error");

console.log("camera hardware helpers passed");
