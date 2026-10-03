import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
const expectedRoutes = [
  "akl-zqn",
  "zqn-wanaka",
  "wanaka-aoraki",
  "aoraki-oamaru",
  "oamaru-christchurch",
  "chc-akl",
  "akc-hobbiton-coach",
];

try {
  const { adventureRoutes } = await server.ssrLoadModule("/src/adventure/adventureRoutes.js");
  const { adventureDays } = await server.ssrLoadModule("/src/adventure/adventureData.js");
  const { adventureWaypoints, getAgendaWaypoint, getRouteWaypointCoverage } =
    await server.ssrLoadModule("/src/adventure/adventureWaypoints.js");
  const { agendaIconType, agendaIconDefinitions } =
    await server.ssrLoadModule("/src/adventure/adventureAgendaIcons.js");
  assert.deepEqual(adventureRoutes.map((route) => route.id), expectedRoutes);
  assert.equal(new Set(adventureWaypoints.map((waypoint) => waypoint.id)).size, adventureWaypoints.length);
  assert.deepEqual(new Set(adventureWaypoints.map((waypoint) => waypoint.markerType)),
    new Set(["transport", "town", "nature", "activity"]));
  for (const waypoint of adventureWaypoints) {
    assert(agendaIconDefinitions[waypoint.iconType], `${waypoint.id}: unknown waypoint icon`);
  }
  assert.equal(adventureWaypoints.find((waypoint) => waypoint.id === "arrowtown")?.iconType, "meal");
  assert.equal(adventureWaypoints.find((waypoint) => waypoint.id === "crown-range-area")?.iconType, "scenic");
  assert.equal(adventureWaypoints.find((waypoint) => waypoint.id === "queenstown-airport")?.iconType, "flight");
  assert.equal(agendaIconType("箭镇、午餐", "drive"), "meal");
  assert.equal(agendaIconType("Crown Range 观景", "drive"), "scenic");
  assert.equal(agendaIconType("抵达皇后镇机场", "flight"), "flight");
  for (const route of adventureRoutes) {
    const coverage = getRouteWaypointCoverage(route.id);
    assert(Array.isArray(coverage.mapped) && Array.isArray(coverage.unresolved), `${route.id}: missing coverage`);
    const [month, day] = route.date.split("/");
    const itinerary = adventureDays.find((entry) => entry.date === `${Number(month)}月${Number(day)}日`);
    assert(itinerary, `${route.id}: missing itinerary day`);
    for (const waypoint of coverage.mapped) {
      assert.equal(waypoint.routeId, route.id);
      assert(waypoint.position[0] < -30 && waypoint.position[1] > 160, `${waypoint.id}: outside New Zealand map`);
      for (const eventIndex of waypoint.eventIndexes) {
        assert(itinerary.events[eventIndex], `${waypoint.id}: missing agenda item ${eventIndex}`);
        assert.equal(getAgendaWaypoint(route.id, eventIndex)?.id, waypoint.id);
      }
    }
  }
} finally {
  await server.close();
}

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1327, height: 964 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  const response = await page.goto(`${base}?route=wanaka-aoraki`);
  assert.equal(response?.status(), 200);
  await page.waitForSelector('.trip-waypoint[data-waypoint-route="wanaka-aoraki"]:not([hidden])');
  assert.equal(await page.locator('.trip-waypoint[data-waypoint-route="wanaka-aoraki"]:not([hidden])').count(), 5);
  assert(await page.locator('.trip-waypoint:not([data-waypoint-route="wanaka-aoraki"]):not([hidden])').count() > 0);
  assert.equal(await page.locator('.trip-waypoint').evaluateAll((elements) => elements.filter((element) =>
    getComputedStyle(element.querySelector('.trip-stop-label')).opacity !== '0').length), 0);
  const lindis = page.getByRole("button", { name: "查看途经点详情：Lindis Pass 观景区" });
  await lindis.click();
  await page.waitForURL("**/*waypoint=lindis-pass-area");
  assert.match(await page.locator("#trip-right-panel").textContent(), /区域级参考点/);
  assert.equal(await page.locator('.trip-waypoint[data-waypoint="lindis-pass-area"]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('.trip-waypoint').evaluateAll((elements) => elements.filter((element) =>
    getComputedStyle(element.querySelector('.trip-stop-label')).opacity !== '0').length), 1);
  await page.getByRole("button", { name: "返回路线" }).click();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("waypoint"));
  await page.getByRole("button", { name: "查看途经点详情：Lindis Pass 观景区" }).click();
  await page.goBack();
  assert.equal(new URL(page.url()).searchParams.get("route"), "wanaka-aoraki");
  assert.equal(new URL(page.url()).searchParams.get("waypoint"), null);

  await page.goto(`${base}?route=oamaru-christchurch`);
  await page.waitForSelector('.trip-waypoint[data-waypoint-route="oamaru-christchurch"]:not([hidden])');
  assert.equal(await page.locator('.trip-waypoint[data-waypoint-route="oamaru-christchurch"]:not([hidden])').count(), 4);
  assert(await page.getByRole("button", { name: "查看途经点详情：Timaru" }).isVisible());
  assert.equal(await page.locator(".trip-route-detail details, .trip-route-diagram").count(), 0);
  await page.getByRole("button", { name: "查看途经点详情：Riverside Market 与雅芳河畔" }).click();
  await page.waitForURL("**/*waypoint=riverside-avon");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("waypoint"));

  const scaleBefore = await page.locator(".trip-map-orientation").evaluate((element) => ({
    label: element.getAttribute("aria-label"), width: getComputedStyle(element).getPropertyValue("--trip-map-scale-width"),
  }));
  const markerBefore = await page.locator('.trip-waypoint[data-waypoint="ashburton-town"]').boundingBox();
  const markerCacheBefore = await page.locator('.trip-waypoint[data-waypoint="ashburton-town"] .trip-stop-marker--normal')
    .getAttribute("data-cache-key");
  await page.getByRole("button", { name: "放大地图" }).click();
  await page.waitForTimeout(250);
  const markerAfter = await page.locator('.trip-waypoint[data-waypoint="ashburton-town"]').boundingBox();
  const scaleAfter = await page.locator(".trip-map-orientation").evaluate((element) => ({
    label: element.getAttribute("aria-label"), width: getComputedStyle(element).getPropertyValue("--trip-map-scale-width"),
  }));
  assert(markerBefore && markerAfter && (markerBefore.x !== markerAfter.x || markerBefore.y !== markerAfter.y));
  assert.equal(await page.locator('.trip-waypoint[data-waypoint="ashburton-town"] .trip-stop-marker--normal')
    .getAttribute("data-cache-key"), markerCacheBefore);
  assert(scaleAfter.label !== scaleBefore.label || scaleAfter.width !== scaleBefore.width);
  assert.equal(await page.locator(".trip-map-compass").count(), 1);
  assert.deepEqual(await page.locator(".trip-map-orientation").evaluate((element) =>
    [...element.children].map((child) => child.className)), ["trip-map-scale", "trip-map-compass"]);
  const scaleBox = await page.locator(".trip-map-orientation").boundingBox();
  const panelBox = await page.locator("#trip-right-panel").boundingBox();
  assert(scaleBox && panelBox && scaleBox.x + scaleBox.width <= panelBox.x,
    "scale overlaps the open route panel instead of using the remaining map area");

  await page.goto(`${base}?route=zqn-wanaka`);
  await page.waitForSelector('.trip-waypoint[data-waypoint-route="zqn-wanaka"]:not([hidden])');
  assert.equal(await page.locator('.trip-waypoint[data-waypoint-route="zqn-wanaka"]:not([hidden])').count(), 3);
  assert(await page.getByRole("button", { name: "查看途经点详情：Cardrona" }).isVisible());
  assert.equal(await page.locator(".trip-route-detail details, .trip-route-diagram").count(), 0);
  const semanticMarkers = await page.evaluate(() => {
    const read = (selector) => {
      const button = document.querySelector(selector);
      const dot = button?.querySelector(".trip-stop-dot");
      const canvas = dot?.querySelector(".trip-stop-marker--normal");
      const box = button?.getBoundingClientRect();
      return { type: dot?.dataset.markerType, icon: dot?.dataset.markerIcon,
        color: canvas?.dataset.markerColor, radius: Number(canvas?.dataset.markerRadius),
        renderer: canvas?.dataset.renderer, width: box?.width, height: box?.height,
        image: canvas?.toDataURL() };
    };
    return {
      arrowtown: read('[data-waypoint="arrowtown"]'),
      crown: read('[data-waypoint="crown-range-area"]'),
      primary: read('[data-tag="ZQN"]'),
    };
  });
  assert.deepEqual({ type: semanticMarkers.arrowtown.type, icon: semanticMarkers.arrowtown.icon,
    color: semanticMarkers.arrowtown.color }, { type: "town", icon: "meal", color: "#9c7536" });
  assert.deepEqual({ type: semanticMarkers.crown.type, icon: semanticMarkers.crown.icon,
    color: semanticMarkers.crown.color }, { type: "nature", icon: "scenic", color: "#3c7356" });
  assert.equal(semanticMarkers.arrowtown.renderer, "pressure-pencil");
  assert.equal(semanticMarkers.arrowtown.width, 44);
  assert.equal(semanticMarkers.arrowtown.height, 44);
  assert(semanticMarkers.primary.radius > semanticMarkers.arrowtown.radius);
  assert.notEqual(semanticMarkers.arrowtown.image, semanticMarkers.crown.image);
  assert.equal(await page.getByRole("button", { name: "查看途经点详情：箭镇" })
    .locator(".trip-route-agenda-icon canvas").getAttribute("data-icon"), "meal");

  await page.goto(`${base}?route=aoraki-oamaru`);
  await page.waitForSelector('.trip-stop[data-tag="TEK"][data-waypoint="tekapo-stop"]');
  assert.equal(await page.locator('.trip-waypoint[data-waypoint="tekapo-stop"]').count(), 0);
  assert.deepEqual(await page.locator('.trip-stop[data-tag="TEK"] .trip-stop-dot').evaluate((element) => ({
    type: element.dataset.markerType, icon: element.dataset.markerIcon,
  })), { type: "nature", icon: "meal" });
  await page.locator('.trip-stop[data-tag="TEK"]').click();
  await page.waitForURL("**/*waypoint=tekapo-stop");
  await page.getByRole("button", { name: "返回路线" }).click();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("waypoint"));
  assert.equal(await page.locator('.trip-stop[data-tag="TEK"]').getAttribute("aria-label"), "查看途经点：特卡波湖 · Tekapo");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("route"));
  assert.equal(await page.locator('.trip-stop[data-tag="TEK"]').getAttribute("aria-label"), "特卡波湖 · Tekapo");
  assert.equal(await page.locator('.trip-stop[data-tag="TEK"]').getAttribute("data-waypoint"), null);
  assert.deepEqual(await page.locator('.trip-stop[data-tag="TEK"] .trip-stop-dot').evaluate((element) => ({
    type: element.dataset.markerType, icon: element.dataset.markerIcon ?? null,
  })), { type: "primary", icon: null });

  await page.goto(base);
  await page.waitForSelector('.trip-waypoint[data-waypoint="arrowtown"]');
  const arrowtownBox = await page.locator('.trip-waypoint[data-waypoint="arrowtown"]').boundingBox();
  assert(arrowtownBox);
  await page.mouse.click(arrowtownBox.x + arrowtownBox.width / 2, arrowtownBox.y + arrowtownBox.height / 2);
  await page.waitForURL("**/*route=zqn-wanaka*waypoint=arrowtown");
  assert.equal(new URL(page.url()).searchParams.get("route"), "zqn-wanaka");

  await page.setViewportSize({ width: 720, height: 540 });
  await page.goto(`${base}?route=oamaru-christchurch`);
  await page.waitForSelector(".trip-map-orientation:not([hidden])");
  const compactBoxes = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box && { left:box.left, right:box.right, top:box.top, bottom:box.bottom };
    };
    return { scale:rect(".trip-map-orientation"), controls:rect(".trip-map-controls"), panel:rect("#trip-right-panel") };
  });
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  assert(compactBoxes.scale && compactBoxes.controls && compactBoxes.panel);
  assert(!overlaps(compactBoxes.scale, compactBoxes.controls), "compact scale overlaps zoom controls");
  assert(compactBoxes.scale.right <= compactBoxes.panel.left, "compact scale overlaps side panel");

  await page.setViewportSize({ width: 436, height: 900 });
  await page.goto(`${base}?route=wanaka-aoraki&waypoint=omarama-town`);
  await page.waitForSelector(".trip-waypoint-detail");
  assert.equal(new URL(page.url()).searchParams.get("route"), "wanaka-aoraki");
  assert.equal(new URL(page.url()).searchParams.get("waypoint"), "omarama-town");
  assert(await page.locator(".trip-map-orientation").isHidden(), "scale should hide behind automatic fullscreen");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ routes: expectedRoutes.length, waypoints: true, deepLink: true,
    history: true, escape: true, projection: true, compassScale: true, mobile: true, errors }));
} finally {
  await browser.close();
}
