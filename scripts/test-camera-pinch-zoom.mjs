import assert from "node:assert/strict";
import { createCameraPinchZoom, supportsCameraPinchZoom } from "../src/adventure/cameraPinchZoom.js";
import { cameraZoomPinchValue } from "../src/adventure/cameraZoomDial.js";

const tick = () => new Promise(resolve => setImmediate(resolve));
const range = { min: 1, max: 4, step: .1 };
assert.equal(cameraZoomPinchValue(1, 100, 200, range), 2);
assert.equal(cameraZoomPinchValue(2, 200, 100, range), 1);
assert.equal(cameraZoomPinchValue(2, 0, 100, range), 2);
assert.equal(cameraZoomPinchValue(3, 10, 100, range), 4);
assert.equal(cameraZoomPinchValue(1, 100, 50, range), 1);
assert.equal(supportsCameraPinchZoom(null), false);
assert.equal(supportsCameraPinchZoom({ ...range, value: null, setValue() {} }), false);

function fixture() {
  const frames = new Map(), captures = new Set(), calls = [];
  let id = 0;
  const zoom = { ...range, value: 1, disabled: false, setValue: async (value, { signal }) => {
    calls.push({ value, signal });
    if (signal.aborted) return false;
    zoom.value = value;
    return true;
  } };
  const target = { closest: () => null, setPointerCapture: pointer => captures.add(pointer), releasePointerCapture: pointer => captures.delete(pointer) };
  const controller = createCameraPinchZoom(() => zoom, {
    schedule: callback => { frames.set(++id, callback); return id; }, unschedule: frame => frames.delete(frame),
  });
  const event = (pointerId, x, y = 0, pointerType = "touch") => ({
    pointerId, clientX: x, clientY: y, pointerType, target, currentTarget: target, preventDefault() {}, stopPropagation() {},
  });
  const runFrame = async () => { [...frames.values()].forEach(callback => callback()); await tick(); };
  return { zoom, controller, event, calls, captures, frames, runFrame };
}

{
  const f = fixture(), { controller: c, event: e } = f;
  c.onPointerDown(e(1, 0));
  c.onPointerMove(e(1, 50));
  await f.runFrame();
  assert.equal(f.calls.length, 0, "One finger must not change zoom");
  c.onPointerDown(e(2, 150));
  c.onPointerMove(e(2, 200));
  c.onPointerMove(e(2, 250));
  assert.equal(f.frames.size, 1, "Moves share one animation-frame request");
  await f.runFrame();
  assert.deepEqual(f.calls.map(call => call.value), [2]);
  c.onPointerMove(e(2, 1000));
  await f.runFrame();
  assert.equal(f.zoom.value, 4);
  c.onPointerMove(e(2, 905));
  await f.runFrame();
  assert.equal(f.zoom.value, 3.6, "Reversing at a limit must respond immediately");
  c.onPointerMove(e(2, 477.5));
  c.onPointerUp(e(2, 477.5));
  await tick();
  assert.equal(f.zoom.value, 1.8, "Release flushes the final target");
  c.onPointerUp(e(1, 50));
  assert.equal(f.captures.size, 0);
}

for (const reason of ["cancel", "lost", "third", "disabled", "lifecycle"]) {
  const f = fixture(), { controller: c, event: e } = f;
  c.onPointerDown(e(1, 0)); c.onPointerDown(e(2, 100)); c.onPointerMove(e(2, 200));
  if (reason === "cancel") c.onPointerCancel(e(2, 200));
  if (reason === "lost") c.onLostPointerCapture(e(2, 200));
  if (reason === "third") c.onPointerDown(e(3, 250));
  if (reason === "disabled") { f.zoom.disabled = true; c.onPointerMove(e(2, 210)); }
  if (reason === "lifecycle") c.cancel();
  await f.runFrame();
  assert.equal(f.calls.length, 0, reason);
  assert.equal(f.captures.size, 0, reason);
  assert.equal(f.frames.size, 0, reason);
}

{
  const f = fixture(), { controller: c, event: e } = f;
  c.onPointerDown(e(1, 0)); c.onPointerDown(e(2, 100));
  c.onPointerMove(e(2, 101)); await f.runFrame();
  c.onPointerMove(e(2, 103)); await f.runFrame();
  c.onPointerMove(e(2, 106)); await f.runFrame();
  assert.equal(f.zoom.value, 1.1, "Sub-step motion accumulates before snapping");
  c.cancel();
  c.onPointerDown(e(1, 0, 0, "mouse"));
  assert.equal(f.captures.size, 0);
  f.zoom.disabled = true;
  c.onPointerDown(e(1, 0));
  assert.equal(f.captures.size, 0);
}

{
  const f = fixture(), { controller: c, event: e } = f;
  let resolve;
  f.zoom.setValue = (value, { signal }) => {
    f.calls.push({ value, signal });
    return new Promise(done => { resolve = done; });
  };
  c.onPointerDown(e(1, 0)); c.onPointerDown(e(2, 100)); c.onPointerMove(e(2, 200));
  await f.runFrame();
  c.cancel();
  assert.equal(f.calls[0].signal.aborted, true);
  c.onPointerDown(e(3, 0)); c.onPointerDown(e(4, 100));
  resolve(false);
  await tick();
  assert.equal(f.captures.size, 2, "An obsolete failure must not cancel a new gesture");
  c.cancel();
}
console.log("Camera pinch helper: mapping, coalescing, final release, reversal, cancellation and stale completion passed; no real device used.");
