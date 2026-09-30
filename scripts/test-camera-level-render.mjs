import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = await build({
  absWorkingDir: root,
  entryPoints: ["src/adventure/CameraLevel.jsx"],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  external: ["react", "react-dom"],
  loader: { ".css": "empty" },
  logLevel: "warning",
});
const module = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { CameraLevel } = module.exports;
const render = reading => renderToStaticMarkup(createElement(CameraLevel, { reading, en: true }));
for (const side of ["top", "right", "bottom", "left"]) {
  for (const angle of [-20, 0, 20]) {
    const tree = CameraLevel({ reading: { edge: side, angle, aligned: angle === 0 }, en: true });
    assert.equal(tree.props.style, undefined, "grid container must never rotate");
    const lines = tree.props.children;
    assert.equal(lines.length, 4);
    for (const line of lines) {
      assert.equal(line.props.style, undefined, "full grid line must never rotate");
      assert.equal(line.props.children.length, 3);
      for (const [index, segment] of line.props.children.entries()) {
        if (line.props["data-edge"] === side && index === 1) {
          assert.deepEqual(segment.props.style, { transform: `rotate(${angle}deg)` });
          assert.equal(segment.props["data-level-active"], true);
        } else assert.equal(segment.props.style, undefined, "all eleven other segments remain fixed");
      }
    }
    const markup = render({ edge: side, angle, aligned: angle === 0 });
    assert.equal((markup.match(/data-level-active="true"/g) ?? []).length, 1);
    assert.equal((markup.match(/style="transform:/g) ?? []).length, 1);
    assert.equal((markup.match(/trip-camera-grid-segment/g) ?? []).length, 12);
    assert.match(markup, /role="img"/);
    assert.match(markup, new RegExp(`${side} edge:`));
  }
}
const empty = render(null);
assert.match(empty, /aria-hidden="true"/);
assert.doesNotMatch(empty, /data-aligned|data-level-active|transform:|Camera level|role="img"/);
assert.equal((empty.match(/trip-camera-grid-segment/g) ?? []).length, 12, "missing samples retain only neutral grid");

const source = name => readFileSync(new URL(`../src/adventure/${name}`, import.meta.url), "utf8");
assert.match(source("AdventureCamera.jsx"), /useCameraLevel\(active && previewState === "ready" && cameraGrid\)/);
assert.match(source("AdventureCamera.jsx"), /active && previewState === "ready" && cameraGrid && <CameraLevel/);
assert.doesNotMatch(source("AdventureCamera.jsx"), /CameraLevelToggle/);
assert.match(source("AdventureCameraSettings.jsx"), /<CameraLevelPermission enabled=\{cameraGrid\}/);
assert.match(source("CameraLevel.jsx"), /onClick=\{cameraLevelPermission\.request\}/);
assert.doesNotMatch(source("CameraLevel.jsx"), /requestPermission|camera-level-reference|camera-level-measured/);
assert.doesNotMatch(source("AdventureCamera.css"), /\.trip-camera-grid/);
const css = source("CameraLevel.css");
assert.match(css, /transform-origin:center/);
assert.match(css, /height:100%; width:1px; flex-direction:column/);
assert.match(css, /width:100%; height:1px/);
assert.match(css, /flex:1 1 0/);
assert.doesNotMatch(css, /\.trip-camera-level-reference|\.trip-camera-level-measured/);
console.log("Camera level render: one transformed center edge, eleven fixed segments, no fabricated level, grid gating and settings-only permission wiring passed (Node only; no browser or camera)");
