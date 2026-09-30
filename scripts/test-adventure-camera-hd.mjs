import assert from "node:assert/strict";
import { captureCameraPhoto, requestCameraPreview } from "../src/adventure/cameraCapture.js";

const namedError = name => Object.assign(new Error(name), { name });
const liveTrack = (settings = {}) => ({ readyState: "live", getSettings: () => settings });
const canvasVideo = (blob, drawCalls = [], width = 1920, height = 1080) => ({
  videoWidth: width,
  videoHeight: height,
  ownerDocument: {
    createElement: name => {
      assert.equal(name, "canvas");
      return {
        getContext: type => {
          assert.equal(type, "2d");
          return { drawImage: (...args) => drawCalls.push(args) };
        },
        toBlob: (resolve, type, quality) => {
          assert.equal(type, "image/jpeg");
          assert.equal(quality, .95);
          resolve(blob);
        },
      };
    },
  },
});

{
  const calls = [];
  const stream = { id: "hd" };
  const result = await requestCameraPreview({
    mediaDevices: { getUserMedia: async constraints => { calls.push(constraints); return stream; } },
    facingMode: "environment",
  });
  assert.equal(result, stream);
  assert.deepEqual(calls, [{ video: {
    facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 },
  }, audio: false }]);
}

{
  const calls = [];
  const stream = { id: "fallback" };
  const result = await requestCameraPreview({
    mediaDevices: { getUserMedia: async constraints => {
      calls.push(constraints);
      if (calls.length === 1) throw namedError("OverconstrainedError");
      return stream;
    } },
    facingMode: "user",
  });
  assert.equal(result, stream);
  assert.deepEqual(calls[1], { video: { facingMode: { ideal: "user" } }, audio: false });
}

{
  let calls = 0;
  await assert.rejects(() => requestCameraPreview({
    mediaDevices: { getUserMedia: async () => { calls++; throw namedError("NotAllowedError"); } },
    facingMode: "environment",
  }), error => error.name === "NotAllowedError");
  assert.equal(calls, 1);
}

{
  let current = true;
  let calls = 0;
  await assert.rejects(() => requestCameraPreview({
    mediaDevices: { getUserMedia: async () => {
      calls++;
      current = false;
      throw namedError("OverconstrainedError");
    } },
    facingMode: "environment",
    isCurrent: () => current,
  }), error => error.name === "AbortError");
  assert.equal(calls, 1);
}

const originalImageCapture = globalThis.ImageCapture;
try {
  {
    const photoCalls = [];
    const original = new Blob(["original"], { type: "image/jpeg" });
    globalThis.ImageCapture = class {
      constructor(track) { assert.equal(track.readyState, "live"); }
      async getPhotoCapabilities() {
        return {
          imageWidth: { min: 640, max: 4032 },
          imageHeight: { min: 480, max: 3024 },
          fillLightMode: ["off", "auto", "flash"],
          redEyeReduction: "controllable",
        };
      }
      async takePhoto(settings) {
        photoCalls.push(settings);
        if (settings?.imageWidth) throw namedError("OperationError");
        return original;
      }
    };
    const result = await captureCameraPhoto({
      track: liveTrack(), video: null,
      photoSettings: { fillLightMode: "auto", redEyeReduction: true },
      isCurrent: () => true,
    });
    assert.equal(result.blob, original);
    assert.equal(result.source, "image-capture");
    assert.deepEqual(photoCalls, [{
      imageWidth: 4032, imageHeight: 3024, fillLightMode: "auto", redEyeReduction: true,
    }, { fillLightMode: "auto" }]);
  }

  {
    const drawCalls = [];
    const photoCalls = [];
    const canvasBlob = new Blob(["canvas"], { type: "image/jpeg" });
    const video = canvasVideo(canvasBlob, drawCalls);
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { return { imageWidth: { max: 4000 }, imageHeight: { max: 3000 } }; }
      async takePhoto(settings) { photoCalls.push(settings); return new Blob([]); }
    };
    const result = await captureCameraPhoto({ track: liveTrack(), video, isCurrent: () => true });
    assert.equal(result.blob, canvasBlob);
    assert.equal(result.source, "video-frame");
    assert.deepEqual(drawCalls[0], [video, 0, 0, 1920, 1080]);
    assert.deepEqual(photoCalls, [
      { imageWidth: 4000, imageHeight: 3000, fillLightMode: "off" },
      { fillLightMode: "off" },
    ]);
  }

  {
    const photoCalls = [];
    const original = new Blob(["unknown-capabilities"], { type: "image/jpeg" });
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { throw namedError("OperationError"); }
      async takePhoto(settings) { photoCalls.push(settings); return original; }
    };
    const result = await captureCameraPhoto({ track: liveTrack(), video: null });
    assert.equal(result.blob, original);
    assert.equal(result.source, "image-capture");
    assert.deepEqual(photoCalls, [{ fillLightMode: "off" }]);
  }

  {
    const photoCalls = [];
    const fallback = new Blob(["off-fallback"], { type: "image/jpeg" });
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { throw namedError("OperationError"); }
      async takePhoto(settings) { photoCalls.push(settings); throw namedError("NotSupportedError"); }
    };
    const result = await captureCameraPhoto({
      track: liveTrack(), video: canvasVideo(fallback), photoSettings: { fillLightMode: "off" },
    });
    assert.equal(result.source, "video-frame");
    assert.deepEqual(photoCalls, [{ fillLightMode: "off" }]);
  }

  {
    let takePhotoCalls = 0;
    const fallback = new Blob(["unsupported-flash"], { type: "image/jpeg" });
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { return { fillLightMode: ["off"] }; }
      async takePhoto() { takePhotoCalls++; return new Blob(["unexpected"]); }
    };
    const result = await captureCameraPhoto({
      track: liveTrack(), video: canvasVideo(fallback), photoSettings: { fillLightMode: "flash" },
    });
    assert.equal(result.source, "video-frame");
    assert.equal(takePhotoCalls, 0);
  }

  {
    let current = true;
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { return {}; }
      async takePhoto() { current = false; return new Blob(["stale"]); }
    };
    await assert.rejects(() => captureCameraPhoto({
      track: liveTrack(), video: null, isCurrent: () => current,
    }), error => error.name === "AbortError");
  }

  {
    const track = liveTrack();
    globalThis.ImageCapture = class {
      async getPhotoCapabilities() { return {}; }
      async takePhoto() { track.readyState = "ended"; return new Blob(["ended"]); }
    };
    await assert.rejects(() => captureCameraPhoto({
      track, video: null, isCurrent: () => true,
    }), error => error.name === "InvalidStateError");
  }

  {
    globalThis.ImageCapture = undefined;
    const fallback = new Blob(["unsupported-api"], { type: "image/jpeg" });
    const result = await captureCameraPhoto({
      track: liveTrack(), video: canvasVideo(fallback, [], 640, 480), isCurrent: () => true,
    });
    assert.deepEqual(result, { blob: fallback, source: "video-frame" });
  }

  await assert.rejects(() => captureCameraPhoto({
    track: { readyState: "ended" }, video: null, isCurrent: () => true,
  }), error => error.name === "InvalidStateError");
} finally {
  if (originalImageCapture === undefined) delete globalThis.ImageCapture;
  else globalThis.ImageCapture = originalImageCapture;
}

console.log("camera HD capture helpers passed");
