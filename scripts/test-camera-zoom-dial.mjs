import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import {
  cameraZoomDragValue, cameraZoomKeyValue, cameraZoomPosition,
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
console.log("zoom mapping: capability bounds/steps, fine low zoom, endpoints and all keyboard keys passed");

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
for (const cancellation of ["signal", "track-change", "disabled", "unmount", "ended"]) {
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
  if (cancellation === "signal") abort.abort();
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
assert.match(component, /export function CameraZoomDial\(\{ zoom, en = false \}\)/);
assert.match(component, /role="slider"/);
assert.match(component, /aria-valuenow=\{confirmed/);
for (const name of ["setPointerCapture", "releasePointerCapture", "onPointerCancel", "onLostPointerCapture", "visibilitychange"]) assert(component.includes(name));
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
  absWorkingDir: new URL("..", import.meta.url).pathname,
  entryPoints: ["src/adventure/CameraZoomDial.jsx", "src/adventure/cameraHardware.js"],
  bundle: true, write: false, outdir: "work/zoom-dial-compile", platform: "browser", format: "esm", jsx: "automatic",
  logLevel: "silent",
});
assert(result.outputFiles.some(file => file.path.endsWith("CameraZoomDial.js")));
assert(result.outputFiles.some(file => file.path.endsWith("CameraZoomDial.css")));
assert.equal(result.warnings.length, 0);
console.log("zoom component: source contract checks and in-memory JS/CSS module linking passed (no browser/visual acceptance)");
