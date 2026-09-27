import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const basePath = "/new-zealand-slow-trip-2026/";
const output = process.env.UNIFIED_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const shell = await readFile(resolve(dist, "index.html"), "utf8");
for (const alias of ["v1.html", "v1/index.html", "adventure.html", "adventure/index.html"]) {
  assert.equal(await readFile(resolve(dist, alias), "utf8"), shell, "Route aliases must use the same built shell");
}
assert.equal((shell.match(/type="module"/g) ?? []).length, 1);
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
// Deliberately no SPA fallback: fresh deep links must work on a static file host.
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith(basePath)) { response.writeHead(404); response.end(); return; }
    let path = resolve(dist, decodeURIComponent(url.pathname.slice(basePath.length)));
    if (path !== dist.slice(0, -1) && !path.startsWith(dist.replace(/\/$/, "") + sep)) {
      response.writeHead(403); response.end(); return;
    }
    if ((await stat(path)).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        response.writeHead(301, { Location: url.pathname + "/" + url.search }); response.end(); return;
      }
      path = resolve(path, "index.html");
    }
    response.writeHead(200, { "Content-Type": mime[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(await readFile(path));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = "http://127.0.0.1:" + server.address().port;
const base = origin + basePath;
let browser;
const errors = [];
const failedAssets = [];
const readyMap = async page => {
  try {
    await page.waitForFunction(() => {
      const pencil = document.querySelector(".trip-pencil-map");
      const international = document.querySelector(".trip-international-map");
      return Boolean((pencil && !pencil.hidden && pencil._pencilStats?.frames > 0) ||
        (international && !international.hidden && Number(international.dataset.rasterRenders) > 0));
    });
  } catch (error) {
    const visibleText = await page.locator("body").innerText().catch(() => "");
    const mapState = await page.evaluate(() => {
      const area = document.querySelector(".trip-map-area");
      const canvas = document.querySelector(".trip-pencil-map");
      const international = document.querySelector(".trip-international-map");
      return {
        url: location.href,
        area: area && { width: area.clientWidth, height: area.clientHeight, zoom: area.dataset.zoom },
        canvas: canvas && { width: canvas.width, height: canvas.height, hidden: canvas.hidden,
          stats: canvas._pencilStats ?? null },
        international: international && { width: international.width, height: international.height,
          hidden: international.hidden, renders: international.dataset.rasterRenders ?? null },
      };
    }).catch(() => null);
    throw new Error([
      error.message,
      errors.length ? `Page errors: ${errors.join(" | ")}` : "",
      failedAssets.length ? `Failed assets: ${failedAssets.join(" | ")}` : "",
      mapState ? `Map state: ${JSON.stringify(mapState)}` : "",
      visibleText ? `Visible text: ${visibleText.slice(0, 500)}` : "",
    ].filter(Boolean).join("\n"));
  }
};
const readyMain = page => page.locator(".page-header").waitFor();
const screenshot = async (page, name) => { if (output) await page.screenshot({ path: output + "/" + name + ".png" }); };
async function controlled(page) {
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 45000 });
  const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(reg => reg.scope));
  assert.deepEqual(registrations, [base]);
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await page.evaluate(async href => (await fetch(href)).json(), manifestUrl);
  assert.equal(new URL(manifest.scope, new URL(manifestUrl, page.url())).href, base);
  assert.equal(manifest.id, basePath);
  assert.equal(manifest.start_url, "./");
  assert(manifest.shortcuts.every(item => !item.url.includes("adventure")));
}
async function sameDocument(page) {
  assert.equal(await page.evaluate(() => window.__unifiedDocument), "alive", "Cross-page navigation reloaded the document");
}
async function openLegacy(page) {
  await page.locator(".trip-home").click();
  await page.getByRole("button", { name: /打开老版本行程|Open the old itinerary/ }).click();
  await readyMain(page);
  assert.equal(new URL(page.url()).pathname, basePath + "v1");
}
async function openMap(page) {
  const link = page.locator('a[href="' + basePath + '"]:visible');
  if (page.viewportSize().width < 900) {
    await page.getByRole("button", { name: /Open main navigation|打开主导航/ }).click();
  }
  await link.first().click();
  await readyMap(page);
  assert.equal(new URL(page.url()).pathname, basePath);
}
async function mapStyles(page) {
  await readyMap(page);
  const result = await page.evaluate(() => {
    let ink = 0;
    for (const canvas of document.querySelectorAll(".trip-pencil-map, .trip-international-map")) {
      if (!canvas.width || !canvas.height || getComputedStyle(canvas).display === "none") continue;
      const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < pixels.length; i += 32) if (pixels[i] > 20) ink++;
    }
    return {
      ink, family: getComputedStyle(document.querySelector("#trip-board-structure")).fontFamily,
      background: getComputedStyle(document.body).backgroundColor,
      before: getComputedStyle(document.body, "::before").content,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert(result.ink > 10000, "Blank map canvas");
  assert.match(result.family, /Trip Map Hand/);
  assert.equal(result.background, "rgb(189, 218, 219)");
  assert.equal(result.before, "none", "Itinerary background leaked into map");
  assert(!result.overflow);
  return result;
}
async function mainStyles(page) {
  await readyMain(page);
  const result = await page.locator(".page-header").evaluate(node => ({
    font: getComputedStyle(node).fontFamily, background: getComputedStyle(document.body).backgroundColor,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  assert.doesNotMatch(result.font, /Trip Map Hand|HanziPen/);
  assert.equal(result.background, "rgb(244, 247, 243)");
  assert(!result.overflow);
  return result;
}
async function installEvent(page, outcome) {
  await page.evaluate(outcome => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => { window.__promptCalls = (window.__promptCalls ?? 0) + 1; };
    event.userChoice = Promise.resolve({ outcome });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) throw new Error("Install event was missed");
  }, outcome);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1324, height: 964 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => {
    if (["script", "stylesheet", "font"].includes(request.resourceType())) {
      failedAssets.push(`${request.resourceType()}: ${request.url()} (${request.failure()?.errorText ?? "failed"})`);
    }
  });
  const scripts = [];
  page.on("request", request => { if (request.resourceType() === "script") scripts.push(request.url()); });
  assert.equal((await page.goto(base + "?place=ZQN", { waitUntil: "domcontentloaded" })).status(), 200);
  await readyMap(page);
  assert.equal(new URL(page.url()).pathname, basePath);
  assert.equal(new URL(page.url()).searchParams.get("place"), "ZQN");
  await controlled(page);
  assert(!scripts.some(url => /ItineraryPage-.*\.js/.test(url)), "Main page eagerly loaded from map");
  await page.waitForFunction(() => document.querySelector(".trip-map-area").__zoom.k === 10);
  await mapStyles(page);
  await page.evaluate(() => {
    window.__unifiedDocument = "alive";
    localStorage.setItem("nz-trip-language", "en");
    localStorage.setItem("nz-trip-booking-react-v1", JSON.stringify({ "test-preserved": true }));
  });
  await installEvent(page, "dismissed");
  await context.setOffline(true);
  await openLegacy(page);
  const originalMainStyles = await mainStyles(page);
  await sameDocument(page);
  assert.equal(await page.locator("html").getAttribute("lang"), "en-NZ");
  await page.locator(".pwa-install-button").click();
  assert.equal(await page.evaluate(() => window.__promptCalls), 1);
  await page.locator(".pwa-install-button").click();
  assert(await page.getByRole("dialog").isVisible(), "Consumed prompt was reused");
  await page.getByRole("button", { name: "Close install instructions" }).click();
  await screenshot(page, "unified-main-desktop");

  await openMap(page);
  await readyMap(page); await sameDocument(page); await mapStyles(page);
  assert.equal(new URL(page.url()).hash, "", "Unmounting main page polluted map URL");
  await page.getByRole("button", { name: /^(背包|Backpack)$/ }).click();
  await openLegacy(page); await sameDocument(page);
  await page.goBack(); await readyMap(page);
  assert.equal(new URL(page.url()).searchParams.get("panel"), "bag");
  assert.equal(new URL(page.url()).hash, "");
  await page.locator(".trip-bag").waitFor({ state: "visible" });
  await page.goForward(); await readyMain(page);
  assert.equal(new URL(page.url()).pathname, basePath + "v1");
  assert.equal(await page.locator("html").getAttribute("lang"), "en-NZ");
  await page.goBack(); await readyMap(page);
  await sameDocument(page);

  const reload = await page.reload({ waitUntil: "domcontentloaded" });
  assert(reload.fromServiceWorker(), "Offline navigation did not use shared service worker");
  await readyMap(page); await mapStyles(page);
  assert.equal(new URL(page.url()).searchParams.get("panel"), "bag");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("nz-trip-booking-react-v1"))["test-preserved"]), true);
  console.log("Desktop offline navigation, history and reload passed");
  await screenshot(page, "unified-map-desktop");
  const icon = await page.evaluate(async () => {
    const response = await fetch(document.querySelector('link[rel="icon"][sizes="32x32"]').href);
    return { ok: response.ok, type: response.headers.get("content-type") };
  });
  assert(icon.ok); assert.equal(icon.type, "image/png");
  await installEvent(page, "accepted");
  await openLegacy(page);
  assert.deepEqual(await mainStyles(page), originalMainStyles);
  await page.locator(".pwa-install-button").click();
  await page.waitForFunction(() => !document.querySelector(".pwa-install-button"));
  await openMap(page);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await openLegacy(page);
  await readyMain(page); assert.equal(await page.locator(".pwa-install-button").count(), 0);
  console.log("Shared install-prompt lifecycle passed");

  await page.setViewportSize({ width: 436, height: 900 });
  await mainStyles(page); await screenshot(page, "unified-main-mobile");
  await openMap(page);
  await readyMap(page); await mapStyles(page);
  await page.getByRole("button", { name: /^(任务|Tasks)$/ }).click();
  await page.waitForFunction(() => document.querySelector(".trip-adventure-calendar-scope .trip-pencil-text")?.dataset.pencilReady === "true");
  await screenshot(page, "unified-map-mobile");
  await page.getByRole("button", { name: /关闭日历|Close calendar/ }).click();
  await openLegacy(page);
  await mainStyles(page);
  await context.close();
  console.log("Map-first: offline cross-page/reload, history, styles, install prompt and responsive checks passed");

  // Reverse the first-visit order: map code and fonts must work before any map visit.
  const mainFirst = await browser.newContext();
  const other = await mainFirst.newPage();
  other.on("pageerror", error => errors.push(error.message));
  await other.goto(base + "v1#car", { waitUntil: "domcontentloaded" });
  await readyMain(other); await controlled(other);
  await mainFirst.setOffline(true);
  await openMap(other);
  await readyMap(other); await mapStyles(other);
  await other.getByRole("button", { name: "任务", exact: true }).click();
  await other.reload({ waitUntil: "domcontentloaded" }); await readyMap(other);
  await other.locator("#trip-calendar-region").waitFor({ state: "visible" });
  await mainFirst.close();
  console.log("Itinerary-first: unvisited map renders and reloads offline");

  // All old and directory-style URLs must work without an installed worker.
  for (const path of ["adventure.html?place=ZQN", "adventure/?panel=tasks", "adventure/index.html?route=oamaru-christchurch"]) {
    const fresh = await browser.newContext({ serviceWorkers: "block" });
    const alias = await fresh.newPage();
    alias.on("pageerror", error => errors.push(error.message));
    assert.equal((await alias.goto(base + path, { waitUntil: "domcontentloaded" })).status(), 200);
    await readyMap(alias);
    assert.equal(new URL(alias.url()).pathname, basePath);
    for (const [key, value] of new URL(base + path).searchParams) {
      assert.equal(new URL(alias.url()).searchParams.get(key), value);
    }
    await alias.locator(path.includes("panel=tasks") ? "#trip-calendar-region" : ".trip-panel").waitFor({ state: "visible" });
    await fresh.close();
  }
  for (const path of ["v1?event=arrival#south", "v1/#booking", "v1/index.html#car", "v1.html#overview"]) {
    const fresh = await browser.newContext({ serviceWorkers: "block" });
    const alias = await fresh.newPage();
    alias.on("pageerror", error => errors.push(error.message));
    assert.equal((await alias.goto(base + path, { waitUntil: "domcontentloaded" })).status(), 200);
    await readyMain(alias);
    assert.equal(new URL(alias.url()).pathname, basePath + "v1");
    assert.equal(new URL(alias.url()).hash, new URL(base + path).hash);
    await fresh.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ staticAliases: true, singleShell: true, sharedServiceWorker: true,
    offlineBothDirections: true, deepLinks: true, history: true, installCapture: true, responsive: true, errors }));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
