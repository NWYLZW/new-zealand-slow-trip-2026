import assert from "node:assert/strict";
import { readAdventureDeviceModel, resolveAdventureDeviceCutout } from "../src/adventure/adventureDeviceCutout.js";

const unfolded = { platform: "Android", model: "2608BPX34C", width: 860, height: 608,
  viewportWidth: 859, viewportHeight: 608, angle: 270 };
assert.deepEqual(resolveAdventureDeviceCutout(unfolded), { corner: "top-right", inset: 51, blockInset: 60 });
assert.deepEqual(resolveAdventureDeviceCutout({ ...unfolded, angle: 90 }), { corner: "bottom-left", inset: 51, blockInset: 60 });
for (const [angle, corner] of [[0, "top-left"], [180, "bottom-right"]]) {
  assert.deepEqual(resolveAdventureDeviceCutout({ ...unfolded, width: 608, height: 860,
    viewportWidth: 608, viewportHeight: 859, angle }), { corner, inset: 60, blockInset: 51 });
}
for (const override of [
  { model: "another-fold" }, { platform: "Windows" }, { model: "" }, { angle: undefined },
  { angle: 0 }, { viewportWidth: 498 }, { viewportHeight: 430 },
  { width: 425, height: 623, viewportWidth: 425, viewportHeight: 623, angle: 0 },
  { width: 0, height: 0 },
]) assert.equal(resolveAdventureDeviceCutout({ ...unfolded, ...override }), null);
assert.deepEqual(resolveAdventureDeviceCutout({ ...unfolded, width: 1182, height: 836,
  viewportWidth: 1182, viewportHeight: 836 }), { corner: "top-right", inset: 70, blockInset: 82 });
assert.equal(await readAdventureDeviceModel({}), null);
assert.equal(await readAdventureDeviceModel({ userAgentData: { getHighEntropyValues: async () => { throw new Error("denied"); } } }), null);
assert.deepEqual(await readAdventureDeviceModel({ userAgentData: {
  getHighEntropyValues: async hints => { assert.deepEqual(hints, ["model"]); return unfolded; },
} }), { platform: "Android", model: "2608BPX34C" });
console.log("Device cutout profile: rotation, outer screen, window bounds, scaling and unavailable hints passed.");
