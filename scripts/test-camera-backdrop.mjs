import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}?icon-backdrop-probe`, route => route.fulfill({
    contentType: "text/html",
    body: '<!doctype html><html><head><style>body{margin:24px;background:repeating-conic-gradient(#23382d 0% 25%,#c6a946 0% 50%) 0/13px 13px}#root{display:flex;gap:20px;flex-wrap:wrap}section{display:flex;gap:8px;padding:12px}canvas{width:30px;height:30px;color:#4b96aa;--trip-pencil-icon-backdrop:#fff}.shutter canvas{width:36px;height:36px}</style></head><body><div id="root"></div></body></html>',
  }));
  await page.goto(`${base}?icon-backdrop-probe`);
  await page.evaluate(async root => {
    const refresh = await import(`${root}@react-refresh`);
    refresh.default.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const React = (await import(`${root}node_modules/.vite/deps/react.js`)).default;
    const { createRoot } = (await import(`${root}node_modules/.vite/deps/react-dom_client.js?v=probe`)).default;
    const { CameraIcon, CloseIcon, PhotoAlbumIcon } = await import(`${root}src/adventure/SketchIcons.jsx`);
    const { PencilIcon } = await import(`${root}src/adventure/pencil/PencilIcon.jsx`);
    const icon = (kind, paths) => props => React.createElement(PencilIcon, { kind, ...props },
      ...paths.map((d, index) => React.createElement("path", { d, key: index })));
    const SystemCamera = icon("system-camera", ["M9 3.8h14v24.4H9zM13 7h6M16 20.5c-2 0-3.5 1.5-3.5 3.4h7c0-1.9-1.5-3.4-3.5-3.4zM25.5 8.5h5M28 6v5"]);
    const Facing = icon("camera-facing", ["M7 12c2.7-4.1 7.3-6.2 12.1-5.2 2.1.4 4 1.4 5.5 2.9M22.3 5.9l2.6 3.9-4.6 1",
      "M25 20c-2.7 4.1-7.3 6.2-12.1 5.2-2.1-.4-4-1.4-5.5-2.9M9.7 26.1l-2.6-3.9 4.6-1",
      "M12 12.5h8v7h-8zM14 12.5l1-2h2l1 2M16 14.4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"]);
    const entries = [["close", CloseIcon], ["camera", CameraIcon], ["album", PhotoAlbumIcon],
      ["shutter", CameraIcon], ["system", SystemCamera], ["facing", Facing]];
    createRoot(document.querySelector("#root")).render(React.createElement(React.Fragment, null,
      ...entries.map(([id, Icon]) => React.createElement("section", { key: id, id, className: id },
        React.createElement(Icon), React.createElement(Icon, { themeBackdrop: true })))));
  }, base);
  await page.waitForFunction(() => document.querySelectorAll("canvas").length === 12
    && document.querySelector("canvas").getContext("2d").getImageData(0, 0, 80, 80).data.some(value => value > 0));
  const evidence = await page.evaluate(() => [...document.querySelectorAll("section")].map(section => {
    const [plain, backed] = section.querySelectorAll("canvas");
    const pixels = canvas => canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const foreground = pixels(plain), composite = pixels(backed);
    const bounds = (data, width, threshold) => {
      let left = width, top = width, right = -1, bottom = -1;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < threshold) continue;
        const x = i / 4 % width, y = Math.floor(i / 4 / width);
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
    };
    const glyph = bounds(foreground, plain.width, 96), backing = bounds(composite, backed.width, 96);
    let minimumCoreAlpha = 255;
    for (let y = glyph.top; y <= glyph.bottom; y++) {
      for (let x = glyph.left; x <= glyph.right; x++) {
        minimumCoreAlpha = Math.min(minimumCoreAlpha, composite[(y * backed.width + x) * 4 + 3]);
      }
    }
    const edgeAlpha = [];
    for (let x = 0; x < backed.width; x++) {
      edgeAlpha.push(composite[x * 4 + 3], composite[((backed.height - 1) * backed.width + x) * 4 + 3]);
    }
    for (let y = 0; y < backed.height; y++) {
      edgeAlpha.push(composite[y * backed.width * 4 + 3], composite[(y * backed.width + backed.width - 1) * 4 + 3]);
    }
    return { id: section.id, size: getComputedStyle(backed).width, minimumCoreAlpha,
      widthRatio: backing.width / glyph.width, heightRatio: backing.height / glyph.height,
      edgeAlpha: Math.max(...edgeAlpha), image: backed.toDataURL() };
  }));
  for (const row of evidence) {
    assert.equal(row.size, row.id === "shutter" ? "36px" : "30px");
    assert(row.minimumCoreAlpha >= 235, `${row.id}: backing has a transparent core (${row.minimumCoreAlpha})`);
    assert(row.widthRatio >= 1.2 && row.heightRatio >= 1.2, `${row.id}: backing is too small`);
    assert(row.edgeAlpha < 96, `${row.id}: backing is clipped at the canvas edge`);
  }
  await page.evaluate(() => document.documentElement.setAttribute("data-adventure-theme", "fern"));
  await page.waitForTimeout(100);
  const repainted = await page.locator("section canvas[data-theme-backdrop]").evaluateAll(elements => elements.map(el => el.toDataURL()));
  assert.deepEqual(repainted, evidence.map(row => row.image), "Same inputs repaint deterministically");
  assert.deepEqual(errors, [], "The isolated icon render has no runtime errors");
  if (process.env.ADVENTURE_TEST_SCREENSHOT) await page.screenshot({ path: process.env.ADVENTURE_TEST_SCREENSHOT,
    clip: { x: 0, y: 0, width: 430, height: 290 } });
  console.log(JSON.stringify(evidence.map(({ image, ...row }) => row), null, 2));
} finally {
  await browser.close();
}
