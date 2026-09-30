import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveAdventureFullscreen } from "../src/adventure/adventureResponsivePane.js";

const camera = { rightPanel: "camera", calendarOpen: false, front: "right", fullscreen: null };
const place = { ...camera, rightPanel: "place" };

assert.deepEqual(resolveAdventureFullscreen(camera, "phone-portrait"), {
  automaticFullscreen: "right",
  effectiveFullscreen: "right",
});
assert.deepEqual(resolveAdventureFullscreen(camera, "phone-landscape"), {
  automaticFullscreen: "right",
  effectiveFullscreen: "right",
});

for (const layout of ["phone-portrait", "phone-landscape"]) {
  assert.deepEqual(resolveAdventureFullscreen(camera, layout, { cameraAutomaticFullscreenSuppressed: true }), {
    automaticFullscreen: null,
    effectiveFullscreen: null,
  });
}

assert.deepEqual(resolveAdventureFullscreen({ ...camera, cameraView: "settings" }, "phone-portrait", {
  cameraAutomaticFullscreenSuppressed: true,
}), {
  automaticFullscreen: null,
  effectiveFullscreen: null,
});
assert.deepEqual(resolveAdventureFullscreen({ ...camera, fullscreen: "right" }, "phone-portrait", {
  cameraAutomaticFullscreenSuppressed: true,
}), {
  automaticFullscreen: null,
  effectiveFullscreen: "right",
});
assert.deepEqual(resolveAdventureFullscreen(place, "phone-portrait", {
  cameraAutomaticFullscreenSuppressed: true,
}), {
  automaticFullscreen: "right",
  effectiveFullscreen: "right",
});
assert.deepEqual(resolveAdventureFullscreen(place, "phone-landscape", {
  cameraAutomaticFullscreenSuppressed: true,
}), {
  automaticFullscreen: null,
  effectiveFullscreen: null,
});

const panelSource = fs.readFileSync(new URL("../src/adventure/AdventurePanel.jsx", import.meta.url), "utf8");
const cameraPreviewActions = panelSource.slice(
  panelSource.indexOf("{cameraPreview ? <>"),
  panelSource.indexOf("</> : paneActions}", panelSource.indexOf("{cameraPreview ? <>")),
);
assert(cameraPreviewActions.indexOf("trip-pane-expand") < cameraPreviewActions.indexOf("trip-close"));
assert.match(cameraPreviewActions, /FullscreenExitIcon themeBackdrop/);
assert.match(panelSource, /automaticFullscreen=\{automaticFullscreen && view\.rightPanel !== "camera"\}/);

console.log("camera fullscreen responsive logic passed");
