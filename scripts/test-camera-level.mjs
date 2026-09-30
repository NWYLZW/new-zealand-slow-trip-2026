import assert from "node:assert/strict";
import { cameraLevelReading, createCameraLevelPermissionStore, observeCameraLevel } from "../src/adventure/cameraLevel.js";

assert.equal(cameraLevelReading(null, 0), null);
assert.equal(cameraLevelReading(0, 0), null);
assert.equal(cameraLevelReading(14, 0), null);
assert.equal(cameraLevelReading(NaN, 0), null);
assert.equal(cameraLevelReading(90, Infinity), null);
assert.equal(cameraLevelReading(181, 0), null);
assert.equal(cameraLevelReading(0, 91), null);
assert.equal(cameraLevelReading("90", 0), null);
assert.deepEqual(cameraLevelReading(90, 0), { edge: "top", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(-90, 0), { edge: "bottom", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(0, 90), { edge: "left", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(0, -90), { edge: "right", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(0, 90, 90), { edge: "top", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(0, -90, 270), { edge: "top", angle: 0, aligned: true });
assert.deepEqual(cameraLevelReading(-90, 0, 180), { edge: "top", angle: 0, aligned: true });
assert.equal(cameraLevelReading(75, 35).aligned, false);

// Synthetic Euler samples with a known screen-plane up vector, not a viewport heuristic.
function poseForRoll(degrees) {
  const radians = degrees * Math.PI / 180;
  const beta = Math.asin(.8 * Math.cos(radians));
  const gamma = Math.asin(.8 * Math.sin(radians) / Math.cos(beta));
  return [beta * 180 / Math.PI, gamma * 180 / Math.PI];
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const sides = ["top", "right", "bottom", "left"];
for (const screenAngle of [0, 90, 180, 270, -90, 360]) {
  for (const [quarter, side] of sides.entries()) {
    for (const tilt of [-35, -12, -1, 0, 1, 12, 35]) {
      const reading = cameraLevelReading(...poseForRoll(screenAngle - quarter * 90 - tilt), screenAngle);
      assert.equal(reading.edge, side);
      close(reading.angle, tilt);
      assert.equal(reading.aligned, Math.abs(tilt) <= 2);
    }
  }
  // For every roll, the selected normal must be the physically uppermost edge.
  for (let roll = -180; roll <= 180; roll += .5) {
    const reading = cameraLevelReading(...poseForRoll(roll), screenAngle);
    const up = (screenAngle - roll) * Math.PI / 180;
    const projections = [Math.cos(up), Math.sin(up), -Math.cos(up), -Math.sin(up)];
    close(projections[sides.indexOf(reading.edge)], Math.max(...projections));
    assert.ok(Math.abs(reading.angle) <= 45 + 1e-9);
  }
}

class TrackedTarget extends EventTarget {
  listeners = new Map();
  addEventListener(type, callback, options) {
    super.addEventListener(type, callback, options);
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback, options) {
    super.removeEventListener(type, callback, options);
    this.listeners.get(type)?.delete(callback);
  }
  count(type) { return this.listeners.get(type)?.size ?? 0; }
  total() { return [...this.listeners.values()].reduce((total, set) => total + set.size, 0); }
}

function fixture({ hidden = false, reduce = false } = {}) {
  const win = new TrackedTarget(), doc = new TrackedTarget();
  const orientation = new TrackedTarget(), motion = new TrackedTarget();
  doc.hidden = hidden;
  orientation.angle = 0;
  motion.matches = reduce;
  win.matchMedia = () => motion;
  let clock = 0, id = 0;
  const timers = new Map(), readings = [], statuses = [];
  const env = { window: win, document: doc, screen: { orientation }, DeviceOrientationEvent: class {},
    performance: { now: () => clock },
    setTimeout(callback, delay) { timers.set(++id, { callback, at: clock + delay }); return id; },
    clearTimeout(timer) { timers.delete(timer); } };
  return {
    env, win, doc, orientation, motion, timers, readings, statuses,
    start: () => observeCameraLevel(value => readings.push(value), value => statuses.push(value), env),
    send(beta, gamma) {
      const event = new Event("deviceorientation");
      Object.assign(event, { beta, gamma });
      win.dispatchEvent(event);
    },
    tick(delta) {
      const end = clock + delta;
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        clock = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      clock = end;
    },
    jumpWithoutTimers(delta) { clock += delta; },
  };
}

const f = fixture();
const stop = f.start();
assert.equal(f.readings.at(-1), null);
assert.equal(f.statuses.at(-1), "waiting");
assert.equal(f.win.count("deviceorientation"), 1);
f.send(90, 0);
assert.equal(f.readings.at(-1).edge, "top");
assert.equal(f.readings.at(-1).aligned, true);
f.orientation.angle = 90;
f.orientation.dispatchEvent(new Event("change"));
assert.equal(f.readings.at(-1).edge, "right", "screen changes bypass the sample throttle");
f.tick(2499);
assert.notEqual(f.readings.at(-1), null);
f.tick(1);
assert.equal(f.readings.at(-1), null);
assert.equal(f.statuses.at(-1), "waiting");
f.orientation.dispatchEvent(new Event("change"));
assert.equal(f.readings.at(-1), null, "screen rotation cannot revive expired data");
f.send(75, 35);
assert.equal(f.readings.at(-1).aligned, false);
f.send(null, 0);
assert.equal(f.readings.at(-1), null, "invalid sample immediately clears level state");
f.send(90, 0);
f.send(0, 0);
assert.equal(f.readings.at(-1), null, "flat pose has no usable in-plane gravity");

f.send(90, 0);
f.doc.hidden = true;
f.doc.dispatchEvent(new Event("visibilitychange"));
assert.equal(f.win.count("deviceorientation"), 0);
assert.equal(f.orientation.count("change"), 0);
assert.equal(f.timers.size, 0);
f.send(90, 0);
assert.equal(f.readings.at(-1), null);
f.doc.hidden = false;
f.doc.dispatchEvent(new Event("visibilitychange"));
assert.equal(f.readings.at(-1), null);
f.send(90, 0);
assert.equal(f.readings.at(-1).aligned, true);
f.win.dispatchEvent(new Event("pagehide"));
assert.equal(f.readings.at(-1), null);
assert.equal(f.win.count("deviceorientation"), 0);
f.doc.dispatchEvent(new Event("visibilitychange"));
assert.equal(f.win.count("deviceorientation"), 0, "pagehide wins while doc.hidden is still false");
f.win.dispatchEvent(new Event("pageshow"));
assert.equal(f.readings.at(-1), null);
assert.equal(f.win.count("deviceorientation"), 1);

delete f.orientation.angle;
f.win.orientation = -90;
f.send(90, 0);
assert.equal(f.readings.at(-1).edge, "left", "legacy window.orientation compensation");
f.jumpWithoutTimers(2501);
f.win.dispatchEvent(new Event("orientationchange"));
assert.equal(f.readings.at(-1), null, "deadline enforced even when timers are suspended");
f.send(90, 0);
stop();
const count = f.readings.length;
stop();
f.send(90, 0);
f.doc.dispatchEvent(new Event("visibilitychange"));
f.win.dispatchEvent(new Event("pageshow"));
f.tick(3000);
assert.equal(f.readings.length, count);
assert.equal(f.readings.at(-1), null);
assert.equal(f.timers.size, 0);
for (const target of [f.win, f.doc, f.orientation, f.motion]) assert.equal(target.total(), 0);

const hidden = fixture({ hidden: true });
const stopHidden = hidden.start();
assert.equal(hidden.win.count("deviceorientation"), 0);
hidden.send(90, 0);
assert.equal(hidden.readings.at(-1), null);
stopHidden();
for (const reduce of [false, true]) {
  const throttled = fixture({ reduce });
  const stopThrottled = throttled.start();
  throttled.send(...poseForRoll(-10));
  throttled.send(...poseForRoll(-20));
  throttled.tick(reduce ? 249 : 99);
  close(throttled.readings.at(-1).angle, 10);
  throttled.tick(1);
  close(throttled.readings.at(-1).angle, 20);
  throttled.send(...poseForRoll(-30));
  throttled.motion.matches = !reduce;
  throttled.motion.dispatchEvent(new Event("change"));
  close(throttled.readings.at(-1).angle, 30, "motion preference never substitutes a fake zero");
  throttled.send(...poseForRoll(-35));
  stopThrottled();
  assert.equal(throttled.timers.size, 0, "cleanup cancels pending paint and expiry");
}

const unsupportedReadings = [], unsupportedStatuses = [];
observeCameraLevel(value => unsupportedReadings.push(value), value => unsupportedStatuses.push(value), {})();
assert.deepEqual(unsupportedReadings, [null]);
assert.deepEqual(unsupportedStatuses, ["unavailable"]);

let requests = 0, settle;
const permissionDoc = { hidden: false };
class ExplicitSensor {
  static requestPermission() {
    requests += 1;
    return new Promise(resolve => { settle = resolve; });
  }
}
const permissions = createCameraLevelPermissionStore({ DeviceOrientationEvent: ExplicitSensor, document: permissionDoc });
const permissionStates = [];
const unsubscribe = permissions.subscribe(() => permissionStates.push(permissions.getSnapshot()));
assert.equal(permissions.getSnapshot(), "prompt");
assert.equal(requests, 0, "reading/subscribing never requests permission");
permissionDoc.hidden = true;
await permissions.request();
assert.equal(requests, 0);
permissionDoc.hidden = false;
const denied = permissions.request();
assert.equal(requests, 1, "request begins synchronously inside the command");
assert.equal(permissions.getSnapshot(), "requesting");
await permissions.request();
assert.equal(requests, 1, "pending requests are deduplicated");
settle("denied");
await denied;
assert.equal(permissions.getSnapshot(), "denied");
const granted = permissions.request();
settle("granted");
await granted;
assert.equal(permissions.getSnapshot(), "granted");
await permissions.request();
assert.equal(requests, 2);
unsubscribe();
assert.deepEqual(permissionStates, ["requesting", "denied", "requesting", "granted"]);
const rejected = createCameraLevelPermissionStore({ DeviceOrientationEvent: {
  requestPermission() { throw new Error("permission unavailable"); },
} });
await rejected.request();
assert.equal(rejected.getSnapshot(), "denied");
const passive = createCameraLevelPermissionStore({ DeviceOrientationEvent: class {} });
await passive.request();
assert.equal(passive.getSnapshot(), "passive");
const unavailable = createCameraLevelPermissionStore({});
await unavailable.request();
assert.equal(unavailable.getSnapshot(), "unavailable");
console.log("Camera level: four edges, 4,326 pose/screen sweeps, residual tilt, stale/invalid samples, visibility/page lifecycle, reduced motion and gesture permission store passed");
