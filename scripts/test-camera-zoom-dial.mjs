import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import {
  CAMERA_ZOOM_INTERACTION_SCALE, cameraZoomDragValue, cameraZoomInteractionScale,
  cameraZoomKeyValue, cameraZoomPosition, cameraZoomPresetRect, cameraZoomTicks, cameraZoomSupportsValue,
  createLatestCameraZoomQueue, formatCameraZoom, snapCameraZoom,
} from "../src/adventure/cameraZoomDial.js";
import { applyVerifiedCameraConstraints, createCameraHardwareTaskQueue } from "../src/adventure/cameraHardware.js";

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const range = { min: .5, max: 20, step: .01 };
assert.equal(snapCameraZoom(-1, range), .5);
assert.equal(snapCameraZoom(99, range), 20);
assert.equal(snapCameraZoom(1.234, range), 1.23);
assert.equal(snapCameraZoom(NaN, range), .5);
assert.equal(cameraZoomDragValue(1, -96, range), 2);
assert.equal(cameraZoomDragValue(2, 96, range), 1);
assert.equal(cameraZoomDragValue(1, 99999, range), .5);
assert.equal(cameraZoomDragValue(1, -99999, range), 20);
assert(cameraZoomDragValue(1, -8, range) - 1 < cameraZoomDragValue(10, -8, range) - 10);
for (const bounds of [range, { min: 0, max: 4, step: .125 }, { min: 1.1, max: 3.7, step: .3 }]) {
  let previous = bounds.min;
  for (let index = 0; index <= 500; index++) {
    const value = snapCameraZoom(cameraZoomDragValue(bounds.min, -index, bounds), bounds);
    assert(value >= previous && value >= bounds.min && value <= bounds.max);
    assert(Number.isFinite(cameraZoomPosition(value, bounds)));
    if (value !== bounds.max) {
      const steps = (value - bounds.min) / bounds.step;
      assert(Math.abs(steps - Math.round(steps)) < 1e-7);
    }
    previous = value;
  }
  assert.equal(cameraZoomKeyValue("Home", 2, bounds), bounds.min);
  assert.equal(cameraZoomKeyValue("End", 2, bounds), bounds.max);
  assert.equal(cameraZoomKeyValue("ArrowDown", bounds.min, bounds), bounds.min);
  assert.equal(cameraZoomKeyValue("ArrowUp", bounds.max, bounds), bounds.max);
}
assert.equal(cameraZoomKeyValue("ArrowUp", 1, range), 1.01);
assert.equal(cameraZoomKeyValue("ArrowRight", 1, range), 1.01);
assert.equal(cameraZoomKeyValue("ArrowDown", 1, range), .99);
assert.equal(cameraZoomKeyValue("ArrowLeft", 1, range), .99);
assert.equal(cameraZoomKeyValue("ArrowDown", 1, { min: 0, max: 1, step: .3 }), .9);
assert.equal(cameraZoomKeyValue("Tab", 1, range), null);
assert.equal(formatCameraZoom(1.125, .125), "1.125\u00d7");
assert.equal(formatCameraZoom(null), "?");
for (const bounds of [range, { min: 1, max: 10, step: .1 }, { min: .7, max: 5, step: .1 }, { min: 0, max: 1, step: .3 }]) {
  for (const value of [bounds.min, (bounds.min + bounds.max) / 2, bounds.max]) {
    const ticks = cameraZoomTicks(value, bounds);
    assert(ticks.every(tick => tick.value >= bounds.min && tick.value <= bounds.max && Math.abs(tick.angle) <= 1.35));
    assert.equal(ticks.length, new Set(ticks.map(tick => tick.value)).size);
    assert(ticks.every(tick => cameraZoomSupportsValue(tick.value, bounds)));
    if (value === bounds.min || value === bounds.max) assert(ticks.some(tick => tick.value === value && Math.abs(tick.angle) < 1e-8));
  }
}
assert(cameraZoomSupportsValue(.7, range));
assert(!cameraZoomSupportsValue(.7, { min: 1, max: 10, step: .1 }));
assert(!cameraZoomSupportsValue(.7, { min: .5, max: 10, step: .3 }));
assert(cameraZoomSupportsValue(.7, { min: .7, max: 10, step: .3 }));
assert(cameraZoomSupportsValue(.7, { min: .5, max: .7, step: .3 }));
for (const invalid of [null, {}, { min: .7, max: 10, step: 0 }, { min: .7, max: Infinity, step: .1 },
  { min: .7, max: .7, step: .1 }]) assert(!cameraZoomSupportsValue(.7, invalid));
for (const bounds of [{ min: 1, max: 10, step: .1 }, { min: .7, max: 2.05, step: .3 }]) {
  for (let index = 0; index <= 300; index++) {
    const value = bounds.min + (bounds.max - bounds.min) * index / 300;
    const ticks = cameraZoomTicks(value, bounds);
    assert(ticks.every(tick => cameraZoomSupportsValue(tick.value, bounds)));
    assert(ticks.every(tick => Number.isFinite(tick.angle) && Math.abs(tick.angle) <= 1.35));
    for (const endpoint of [bounds.min, bounds.max]) {
      const angle = (cameraZoomPosition(endpoint, bounds) - cameraZoomPosition(value, bounds)) * 96 / Math.LN2 / 10 * .24;
      if (Math.abs(angle) <= 1.35) assert(ticks.some(tick => tick.value === endpoint && tick.endpoint));
    }
  }
}
console.log("zoom mapping: capability bounds/steps, fine low zoom, endpoints and all keyboard keys passed");

// Arithmetic fixtures mirror the shared shutter/album contract, not measured browser geometry.
const rectangle = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height });
const expanded = (box, scale, anchorBottom) => {
  const originY = anchorBottom ? box.bottom : (box.top + box.bottom) / 2;
  return { left: box.right - (box.right - box.left) * scale, right: box.right,
    top: originY - (originY - box.top) * scale, bottom: originY + (box.bottom - originY) * scale };
};
const separated = (a, b, gap = 4) => a.right + gap <= b.left || b.right + gap <= a.left
  || a.bottom + gap <= b.top || b.bottom + gap <= a.top;
for (const width of [190, 200, 218, 240, 260, 280, 320, 321, 350, 390, 436, 768]) {
  const height = 700, inset = 14, centerX = width / 2, centerY = height - inset - 38;
  const dialWidth = width <= 360 ? 44 : 56, dialHeight = width <= 320 ? 52 : 76;
  const box = rectangle(centerX - 46 - dialWidth, centerY - dialHeight / 2, dialWidth, dialHeight);
  const boundary = rectangle(0, 0, width, height);
  const albumBottom = width <= 320 ? inset + 84 : inset;
  const shutter = rectangle(centerX - 38, centerY - 38, 76, 76);
  const obstacles = [shutter, rectangle(inset, height - albumBottom - 44, 44, 44),
    rectangle(inset, height - albumBottom - 90, 44, 44)];
  const preset = cameraZoomPresetRect(box, boundary, obstacles, true);
  assert(preset, `portrait ${width}px has a reachable wide-angle shortcut`);
  assert(obstacles.every(obstacle => separated(preset, obstacle)), `portrait ${width}px preset collision`);
  obstacles.push(preset);
  assert.equal(shutter.left - box.right, 8);
  const scale = cameraZoomInteractionScale(box, boundary, obstacles, true);
  assert(scale >= 1 && scale <= CAMERA_ZOOM_INTERACTION_SCALE);
  const visual = expanded(box, scale, true);
  assert(visual.left >= 4 && visual.bottom <= height - 4);
  assert(obstacles.every(obstacle => separated(visual, obstacle)), `portrait ${width}px expansion collision`);
  const status = rectangle(66, height - inset - 116, width - 132, 28);
  const shiftedPreset = cameraZoomPresetRect(box, boundary, [...obstacles.slice(0, -1), status], true);
  assert(shiftedPreset && separated(shiftedPreset, status), `portrait ${width}px avoids status text`);
}
for (const height of [160, 180, 256, 390, 768]) {
  const width = 800, centerX = width - 14 - 22, centerY = height / 2;
  const box = rectangle(centerX - 46 - 64, centerY - 64, 64, 128);
  const shutter = rectangle(centerX - 38, centerY - 38, 76, 76);
  const boundary = rectangle(0, 0, width, height);
  const preset = cameraZoomPresetRect(box, boundary, [shutter]);
  assert(preset && preset.top >= 4 && preset.bottom <= height - 4);
  assert(separated(preset, shutter));
  const scale = cameraZoomInteractionScale(box, boundary, [shutter, preset]);
  const visual = expanded(box, scale, false);
  assert(visual.top >= 4 && visual.bottom <= height - 4);
  assert.equal(shutter.left - visual.right, 8);
}
assert.equal(cameraZoomInteractionScale(rectangle(100, 100, 64, 128), rectangle(0, 0, 500, 500)), 1.3);
assert.equal(cameraZoomInteractionScale(rectangle(0, 0, 44, 44), rectangle(0, 0, 44, 44)), 1);
assert.equal(cameraZoomPresetRect(rectangle(0, 0, 44, 44), rectangle(0, 0, 44, 44)), null);
console.log("zoom geometry: portrait 190-768px, compact splits, short landscape, fixed shutter gap and bounded enlargement passed (arithmetic only)");

// A busy shared hardware queue still consumes only the latest zoom at actual start.
{
  const hardware = createCameraHardwareTaskQueue();
  const queue = createLatestCameraZoomQueue(task => hardware.enqueue(task));
  const gate = deferred(), values = [];
  const occupied = hardware.enqueue(() => gate.promise);
  const first = queue.enqueue(async () => { values.push(1); return true; });
  const last = queue.enqueue(async () => { values.push(2); return true; });
  assert.equal(await first, false);
  gate.resolve();
  await occupied;
  assert.equal(await last, true);
  assert.deepEqual(values, [2]);
}

// Hundreds of drag updates become the first in-flight request and the final target.
{
  const hardware = createCameraHardwareTaskQueue();
  const queue = createLatestCameraZoomQueue(task => hardware.enqueue(task));
  const gate = deferred(), values = [];
  let concurrent = 0, maximum = 0;
  const apply = (value, wait) => async () => {
    maximum = Math.max(maximum, ++concurrent);
    values.push(value);
    if (wait) await gate.promise;
    concurrent--;
    return true;
  };
  const first = queue.enqueue(apply(1, true));
  await tick();
  const pending = Array.from({ length: 400 }, (_, index) => queue.enqueue(apply(index + 2)));
  const torch = hardware.enqueue(apply("torch"));
  gate.resolve();
  const results = await Promise.all([first, ...pending, torch]);
  assert.deepEqual(values, [1, "torch", 401]);
  assert.equal(maximum, 1);
  assert.equal(results[0], true);
  assert(results.slice(1, -2).every(value => value === false));
  assert.equal(results.at(-2), true);
}
console.log("zoom queue: latest-only pending, shared hardware serialization and final target delivery passed");

// Native calls cannot be aborted; cancellation suppresses their confirmation and queued work.
for (const cancellation of ["signal", "blur", "pagehide", "pointercancel", "track-change", "disabled", "unmount", "ended"]) {
  const hardware = createCameraHardwareTaskQueue();
  const queue = createLatestCameraZoomQueue(task => hardware.enqueue(task));
  const abort = new AbortController(), gate = deferred(), confirmed = [];
  const old = queue.enqueue(async isCurrent => {
    await gate.promise;
    if (isCurrent()) confirmed.push("old");
    return isCurrent();
  }, { signal: abort.signal });
  await tick();
  const pending = queue.enqueue(async () => { confirmed.push("pending"); return true; }, { signal: abort.signal });
  if (["signal", "blur", "pagehide", "pointercancel"].includes(cancellation)) abort.abort();
  else queue.cancel();
  assert.equal(await old, false);
  assert.equal(await pending, false);
  const next = queue.enqueue(async () => { confirmed.push("new"); return true; });
  await tick();
  assert.deepEqual(confirmed, []);
  gate.resolve();
  assert.equal(await next, true);
  assert.deepEqual(confirmed, ["new"]);
}
{
  const queue = createLatestCameraZoomQueue(task => Promise.resolve().then(task));
  const abort = new AbortController();
  abort.abort();
  assert.equal(await queue.enqueue(() => { throw new Error("must not run"); }, { signal: abort.signal }), false);
  const pending = queue.enqueue(() => { throw new Error("must not run"); });
  queue.cancel();
  assert.equal(await pending, false);
}
console.log("zoom cancellation: aborted signals and lifecycle cancellation suppress old work; fresh work recovers");

// Verify readback failures without requesting media permissions or constructing ImageCapture.
for (const failure of ["reject", "mismatch", "intermediate"]) {
  const hardware = createCameraHardwareTaskQueue();
  const queue = createLatestCameraZoomQueue(task => hardware.enqueue(task));
  const gate = deferred(), applications = [];
  let confirmed = 1, fail = true;
  const settings = { zoom: 1, width: 1920, height: 1080, facingMode: "environment" };
  const track = {
    readyState: "live",
    getConstraints: () => ({ width: 1920, height: 1080, facingMode: "environment", advanced: [{ torch: true }] }),
    getSettings: () => ({ ...settings }),
    async applyConstraints(constraints) {
      applications.push(constraints);
      for (const entry of [constraints, ...constraints.advanced]) {
        assert(!("width" in entry || "height" in entry || "facingMode" in entry));
      }
      assert.equal(constraints.advanced[0].torch, true);
      if (fail && !(failure === "intermediate" && constraints.zoom === 3)) {
        await gate.promise;
        if (failure !== "mismatch") throw new Error("device rejected zoom");
        return;
      }
      settings.zoom = constraints.zoom;
    },
  };
  const apply = value => queue.enqueue(async isCurrent => {
    try {
      const actual = await applyVerifiedCameraConstraints(track, { zoom: value }, { zoom: value }, { zoom: range });
      if (!isCurrent()) return false;
      confirmed = actual.zoom;
      return true;
    } catch {
      if (isCurrent()) confirmed = track.getSettings().zoom;
      return false;
    }
  });
  const failed = apply(2);
  await tick();
  const trailing = apply(3);
  gate.resolve();
  assert.equal(await failed, false);
  assert.equal(await trailing, failure === "intermediate");
  assert.equal(confirmed, failure === "intermediate" ? 3 : 1);
  assert.equal(applications.length, 2);
  fail = false;
  assert.equal(await apply(4), true);
  assert.equal(confirmed, 4);
}
console.log("zoom failure: rejection/mismatch restore real readings, latest target survives intermediate failure; ImageCapture filtering preserved");

const component = await readFile(new URL("../src/adventure/CameraZoomDial.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/adventure/CameraZoomDial.css", import.meta.url), "utf8");
const pencilLabel = await readFile(new URL("../src/adventure/CameraPencilLabel.jsx", import.meta.url), "utf8");
assert.match(component, /export function CameraZoomDial\(\{ zoom, en = false \}\)/);
assert.match(component, /role="slider"/);
assert.match(component, /aria-valuenow=\{confirmed/);
for (const name of ["setPointerCapture", "releasePointerCapture", "onPointerCancel", "onLostPointerCapture", "visibilitychange", "pagehide",
  "onBlur={cancel}", "keysRef.current.clear()", "keysRef.current.delete(event.key)", "releasePointer(false)",
  "registerCanvasCache(textureCache)", "observeCanvasRecovery(paint)", "stopRecovery()", "CAMERA_ZOOM_INTERACTION_SCALE",
  "cameraZoomInteractionScale(box", "const signal = abortRef.current.signal"]) assert(component.includes(name));
assert.match(component, /className="trip-camera-zoom-dial-visual">\s*<canvas[^>]*\/>\s*<\/div>\s*<CameraPencilLabel/);
assert.match(component, /wideAvailable && <button/);
assert(!css.includes(":has("), "keyboard focus alone must not keep the dial expanded after release or window blur");
assert.match(css, /transition:transform 220ms/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /\.trip-camera-zoom-dial-visual \{ transition:none; \}/);
assert.match(css, /@container camera-preview \(max-width:320px\)/);
assert.match(css, /height:52px/);
assert.match(css, /@container camera-preview \(max-width:360px\)/);
assert.match(css, /bottom:calc\(50% \+ 42px\)/);
assert.match(pencilLabel, /root.clientWidth, height = root.clientHeight/);
assert(!pencilLabel.includes("getBoundingClientRect"));
assert.match(pencilLabel, /cachedContext.isContextLost/);
assert(!component.includes('type="range"') && !component.includes("PencilSurface"));
assert.match(css, /--trip-camera-shutter-x/);
assert.match(css, /--trip-camera-shutter-y/);
assert.match(css, /width:64px/);
assert.match(css, /height:128px/);
assert.match(css, /width:56px/);
assert.match(css, /height:76px/);
assert.match(css, /min-height:44px/);
assert.match(css, /touch-action:none/);

const result = await build({
  root: new URL("..", import.meta.url).pathname,
  configFile: false, plugins: [react()], logLevel: "warn",
  build: {
    write: false, minify: false, reportCompressedSize: false,
    rollupOptions: {
      input: { CameraZoomDial: "src/adventure/CameraZoomDial.jsx", cameraHardware: "src/adventure/cameraHardware.js" },
      external: /^(react|react-dom)(\/|$)/,
      output: { format: "es", entryFileNames: "[name].js" },
    },
  },
});
const output = [result].flat().flatMap(bundle => bundle.output);
assert(output.some(file => file.fileName === "CameraZoomDial.js"));
assert(output.some(file => file.fileName.endsWith(".css")));
console.log("zoom component: source contract checks and actual Vite in-memory JS/CSS module linking passed (no browser/visual acceptance)");
