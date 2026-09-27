import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { responsiveFullscreenPane } from "../src/adventure/adventureResponsivePane.js";

const cameraPreview = { rightPanel: "camera", cameraView: "preview", calendarOpen: false, front: "right" };
assert.equal(responsiveFullscreenPane(cameraPreview, "phone-portrait"), "right");
assert.equal(responsiveFullscreenPane(cameraPreview, "phone-landscape"), "right");
assert.equal(responsiveFullscreenPane({ ...cameraPreview, cameraView: "settings" }, "phone-landscape"), "right");
assert.equal(responsiveFullscreenPane({ ...cameraPreview, cameraView: "album" }, "phone-landscape"), "right");
assert.equal(responsiveFullscreenPane({ ...cameraPreview, cameraView: "device" }, "phone-landscape"), "right");
assert.equal(responsiveFullscreenPane({ ...cameraPreview, calendarOpen: true, front: "tasks" }, "phone-landscape"), "calendar");
assert.equal(responsiveFullscreenPane({ ...cameraPreview, calendarOpen: true, front: "right" }, "phone-landscape"), "right");

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], results = [];
const settle = async page => {
  await page.waitForTimeout(650);
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-trip-pane-transition"));
};
const assertFullBounds = async (page, selector, viewport) => {
  await page.waitForFunction(selector => {
    const box = document.querySelector(selector)?.getBoundingClientRect();
    return box && Math.abs(box.x) < 1 && Math.abs(box.y) < 1
      && Math.abs(box.width - innerWidth) < 1 && Math.abs(box.height - innerHeight) < 1;
  }, selector);
  const box = await page.locator(selector).boundingBox();
  assert(box && Math.abs(box.x) < 1 && Math.abs(box.y) < 1
    && Math.abs(box.width - viewport.width) < 1 && Math.abs(box.height - viewport.height) < 1, JSON.stringify(box));
};
const assertHeaderRow = async (page, contentSelector, actionsSelector) => {
  const content = await page.locator(contentSelector).boundingBox();
  const actions = await page.locator(actionsSelector).boundingBox();
  assert(content && actions && Math.abs(content.y + content.height / 2 - actions.y - actions.height / 2) < 2,
    JSON.stringify({ content, actions }));
  assert(content.x + content.width <= actions.x + 1, "Header content overlaps its actions");
};

try {
  for (const viewport of [{ width: 1327, height: 964 }, { width: 1145, height: 964 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${base}?panel=tasks&date=2026-09-30&right=bag`);
    await page.locator(".trip-bag-band-name").first().waitFor();
    await settle(page);
    const names = await page.locator(".trip-bag-band-name .trip-pencil-text-source").allTextContents();
    assert(names.includes("皇后镇的房源"));
    assert(names.includes("Wanaka Luxury Apartments"));
    assert(names.includes("The Hermitage · Mt Cook Motel Studio Queen"));
    assert(names.every(name => !name.includes("…")));
    if (output) await page.screenshot({ path: `${output}/bag-names-${viewport.width}.png` });
    const widthCheck = await page.locator(".trip-bag-band-name").evaluateAll(elements => elements.map(el => {
      const range = document.createRange();
      range.selectNodeContents(el.querySelector(".trip-pencil-text-source"));
      return { name: el.textContent, width: el.clientWidth, textWidth: Math.max(...[...range.getClientRects()].map(rect => rect.width)) };
    }));
    assert(widthCheck.every(el => el.width > 8 && el.textWidth <= el.width + 1), JSON.stringify(widthCheck));
    await page.getByRole("button", { name: "全屏面板", exact: true }).click();
    await settle(page);
    await assertFullBounds(page, "#trip-right-panel", viewport);
    assert.equal(new URL(page.url()).searchParams.get("fullscreen"), "right");
    assert.equal(await page.locator("#trip-calendar-region").getAttribute("inert"), "");
    assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "退出全屏", exact: true }).count(), 1);
    assert.equal(await page.locator(".trip-pane-menu + .trip-pane-expand + .trip-close").count(), 1);
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "设置", exact: true }).click();
    await page.getByRole("button", { name: "深色", exact: true }).click();
    await page.getByRole("button", { name: "关闭菜单", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("#trip-adventure-menu").open);
    await assertFullBounds(page, "#trip-right-panel", viewport);
    if (output) await page.screenshot({ path: `${output}/bag-fullscreen-dark-${viewport.width}.png` });
    await page.reload();
    await page.locator(".trip-bag-band-name").first().waitFor();
    await settle(page);
    await assertFullBounds(page, "#trip-right-panel", viewport);
    await page.getByRole("button", { name: "退出全屏", exact: true }).click();
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    assert.equal(await page.locator("#trip-calendar-region").getAttribute("inert"), null);
    await page.goBack();
    await settle(page);
    await assertFullBounds(page, "#trip-right-panel", viewport);
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await page.locator("#trip-right-panel").isVisible(), true);

    await page.getByRole("button", { name: "全屏日历", exact: true }).click();
    await settle(page);
    await assertFullBounds(page, "#trip-calendar-region", viewport);
    assert.equal(await page.locator("#trip-right-panel").getAttribute("inert"), "");
    assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 1);
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "设置", exact: true }).click();
    await page.getByRole("button", { name: "浅色", exact: true }).click();
    await page.getByRole("button", { name: "关闭菜单", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("#trip-adventure-menu").open);
    if (output) await page.screenshot({ path: `${output}/calendar-fullscreen-${viewport.width}.png` });
    await page.reload();
    await settle(page);
    await assertFullBounds(page, "#trip-calendar-region", viewport);
    await page.locator("#trip-calendar-region [data-date='2026-09-28'] > .trip-adventure-calendar-date").click();
    await page.locator(".trip-day-timeline-lanes").waitFor();
    await settle(page);
    await assertFullBounds(page, "#trip-right-panel", viewport);
    assert.equal(new URL(page.url()).searchParams.get("fullscreen"), "right");
    const timelineAlignment = async () => page.evaluate(() => {
      const title = document.querySelector(".trip-panel-heading").getBoundingClientRect();
      const lane = document.querySelector(".trip-day-timeline-lanes").getBoundingClientRect();
      return lane.left - title.left;
    });
    assert(Math.abs(await timelineAlignment()) < 1);
    await page.getByRole("button", { name: "退出全屏", exact: true }).click();
    await settle(page);
    assert(Math.abs(await timelineAlignment()) < 1);
    if (output) await page.screenshot({ path: `${output}/day-alignment-${viewport.width}.png` });
    await page.getByRole("button", { name: "全屏面板", exact: true }).click();
    await settle(page);
    await page.getByRole("button", { name: "关闭面板", exact: true }).click();
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    assert.equal(await page.locator("#trip-calendar-region").isVisible(), true);
    await page.getByRole("button", { name: "全屏日历", exact: true }).click();
    await settle(page);
    await page.getByRole("button", { name: "关闭日历", exact: true }).click();
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.push({ width: viewport.width, hotelNames: true, panelFullscreen: true, calendarFullscreen: true,
      menuEntry: true, restoreHistory: true, reload: true, escape: true, dayAlignment: true, closeCleanup: true });
    await page.close();
  }

  for (const portrait of [{ width: 390, height: 844 }, { width: 436, height: 900 }, { width: 430, height: 932 }]) {
    const page = await browser.newPage({ viewport: portrait });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(`${base}?panel=tasks&date=2026-09-28`);
    await page.locator(".trip-adventure-calendar-grid").waitFor();
    await settle(page);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-responsive-layout"), "phone-portrait");
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), "calendar");
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    await assertFullBounds(page, "#trip-calendar-region", portrait);
    await assertHeaderRow(page, ".trip-adventure-calendar-scopes", ".trip-calendar-header-actions");
    assert.equal(await page.getByRole("button", { name: /全屏|退出全屏/ }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "关闭日历", exact: true }).count(), 1);

    const eventId = await page.locator(".trip-adventure-calendar-event").first().getAttribute("data-event-id");
    await page.locator(`.trip-adventure-calendar-event[data-event-id="${eventId}"]`).click();
    await page.locator(".trip-event-back").waitFor();
    await settle(page);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), "right");
    await assertFullBounds(page, "#trip-right-panel", portrait);
    await assertHeaderRow(page, ".trip-panel-heading", ".trip-panel-header-actions");
    assert.equal(await page.locator("#trip-calendar-region").getAttribute("inert"), "");
    assert.equal(await page.getByRole("button", { name: /全屏|退出全屏/ }).count(), 0);
    assert.equal(await page.locator(".trip-event-back").count(), 1);

    const beforeRotation = await page.evaluate(() => ({ url: location.href, history: history.length }));
    const landscape = { width: portrait.height, height: portrait.width };
    await page.setViewportSize(landscape);
    await settle(page);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-responsive-layout"), "phone-landscape");
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), null);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), null);
    assert.equal(await page.getByRole("button", { name: "全屏面板", exact: true }).count(), 1);
    const splitPanel = await page.locator("#trip-right-panel").boundingBox();
    assert(splitPanel && splitPanel.width < landscape.width && splitPanel.height === landscape.height, JSON.stringify(splitPanel));
    assert.deepEqual(await page.evaluate(() => ({ url: location.href, history: history.length })), beforeRotation);

    await page.getByRole("button", { name: "全屏面板", exact: true }).click();
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.get("fullscreen"), "right");
    await page.setViewportSize(portrait);
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.get("fullscreen"), "right");
    assert.equal(await page.getByRole("button", { name: "退出全屏", exact: true }).count(), 1);
    await page.getByRole("button", { name: "退出全屏", exact: true }).click();
    await settle(page);
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), "right");
    assert.equal(await page.getByRole("button", { name: /全屏|退出全屏/ }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.setViewportSize(landscape);
    await settle(page);
    await page.getByRole("button", { name: "关闭面板", exact: true }).click();
    await settle(page);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), "calendar");
    await assertFullBounds(page, "#trip-calendar-region", landscape);
    await assertHeaderRow(page, ".trip-adventure-calendar-scopes", ".trip-calendar-header-actions");
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    assert.equal(await page.getByRole("button", { name: /全屏|退出全屏/ }).count(), 0);
    results.push({ ...portrait, phonePortraitAutomatic: true, landscapeRightSplit: true, landscapeCalendarAutomatic: true,
      rotationHistoryStable: true, manualFullscreenPreserved: true, nestedBack: true });
    await page.close();
  }

  for (const viewport of [
    { width: 720, height: 540, layout: "compact" },
    { width: 540, height: 720, layout: "compact" },
    { width: 768, height: 1024, layout: "tablet" },
    { width: 1024, height: 768, layout: "tablet" },
  ]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}?panel=tasks&date=2026-09-28&right=bag`);
    await page.locator(".trip-bag-band-name").first().waitFor();
    await settle(page);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-responsive-layout"), viewport.layout);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-automatic-fullscreen"), null);
    assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), null);
    assert.equal(new URL(page.url()).searchParams.has("fullscreen"), false);
    const panel = await page.locator("#trip-right-panel").boundingBox();
    const calendar = await page.locator("#trip-calendar-region").boundingBox();
    assert(panel && panel.width < viewport.width && panel.height === viewport.height, JSON.stringify(panel));
    assert(calendar && calendar.width < viewport.width && calendar.height < viewport.height, JSON.stringify(calendar));
    assert.equal(await page.getByRole("button", { name: "全屏面板", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "全屏日历", exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.push({ width: viewport.width, height: viewport.height, layout: viewport.layout,
      splitPane: true, manualFullscreenAvailable: true, overflow: false });
    await page.close();
  }

  {
    const viewport = { width: 1327, height: 964 };
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException("Synthetic permission denial", "NotAllowedError");
      };
    });
    await page.goto(`${base}?right=camera`);
    await page.locator(".trip-camera").waitFor();
    await settle(page);
    const splitInset = await page.evaluate(() => {
      const panel = document.querySelector("#trip-right-panel").getBoundingClientRect();
      const body = document.querySelector(".trip-day--camera > .trip-panel-body").getBoundingClientRect();
      return Math.round(body.left - panel.left);
    });
    assert.equal(splitInset, 0);
    assert.equal(await page.getByRole("button", { name: "全屏面板", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "菜单", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "相机设置", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "关闭面板", exact: true }).count(), 1);
    await page.goto(`${base}?right=camera&fullscreen=right`);
    await page.locator(".trip-camera").waitFor();
    await settle(page);
    const fullscreenInset = await page.evaluate(() => {
      const panel = document.querySelector("#trip-right-panel").getBoundingClientRect();
      const body = document.querySelector(".trip-day--camera > .trip-panel-body").getBoundingClientRect();
      return Math.round(body.left - panel.left);
    });
    assert.equal(fullscreenInset, 0);
    results.push({ width: viewport.width, cameraFullBleed: true, cameraMinimalNavigation: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
