import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1324, height: 964 }, hasTouch: true });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const ready = () => page.waitForFunction(() => document.querySelector(".trip-pencil-map")?._pencilStats?.frames > 0);
const idle = () => page.waitForFunction(() => document.querySelector(".trip-map-area")?.dataset.focusing !== "true");
const calendar = () => page.locator("#trip-calendar-region");
const day = date => page.locator('.trip-adventure-calendar-day[data-date="' + date + '"]');
const screenshot = async name => { if (output) await page.screenshot({ path: output + "/" + name + ".png" }); };
const metrics = () => page.evaluate(() => {
  const area = document.querySelector(".trip-map-area"), panel = document.querySelector("#trip-calendar-region");
  const a = area.getBoundingClientRect(), controls = document.querySelector(".trip-map-controls").getBoundingClientRect();
  const p = panel?.getBoundingClientRect();
  const svg = document.querySelector("svg.trip-map").viewBox.baseVal;
  return { mapBottom: a.bottom, mapHeight: a.height, controlBottom: controls.bottom,
    top: p?.top, bottom: p?.bottom, panelHeight: p?.height, k: area.__zoom.k,
    transform: [area.__zoom.x, area.__zoom.y, area.__zoom.k],
    viewBox: [svg.width, svg.height], width: a.width, viewport: [innerWidth, innerHeight],
    overflow: document.documentElement.scrollWidth > innerWidth,
    aligned: document.querySelector(".trip-world").getAttribute("transform") === document.querySelector(".trip-depth-world").getAttribute("transform") };
});
async function assertLayout() {
  await page.waitForFunction(() => {
    const a = document.querySelector(".trip-map-area").getBoundingClientRect();
    const c = document.querySelector("#trip-calendar-region")?.getBoundingClientRect();
    const svg = document.querySelector("svg.trip-map").viewBox.baseVal;
    const controls = document.querySelector(".trip-map-controls").getBoundingClientRect();
    return c && Math.abs(c.bottom - innerHeight) < 1 && Math.abs(a.height - innerHeight) < 1
      && Math.abs(svg.height - a.height) < 1 && controls.bottom <= c.top - 10;
  });
  const m = await metrics();
  assert(Math.abs(m.bottom - m.viewport[1]) < 1);
  assert(m.controlBottom <= m.top - 10, "Zoom controls overlap calendar");
  assert.equal(m.mapHeight, m.viewport[1]);
  assert.equal(m.viewBox[0], m.width);
  assert(m.aligned); assert(!m.overflow);
  assert.equal(await page.locator(".trip-task-list,.trip-task,.trip-panel").count(), 0);
  return m;
}
try {
  await page.goto(base); await ready(); await page.waitForTimeout(400);
  const before = await metrics();
  const taskButton = page.getByRole("button", { name: "任务", exact: true });
  await taskButton.focus(); await page.keyboard.press("Enter");
  await calendar().waitFor(); await page.waitForTimeout(350);
  const opened = await assertLayout();
  assert.deepEqual(opened.viewBox, before.viewBox, "Opening the drawer resized the map");
  assert.deepEqual(opened.transform, before.transform, "Opening the drawer moved the map");
  assert(opened.controlBottom < before.controlBottom - 200);
  assert.equal(new URL(page.url()).search, "?panel=tasks");
  assert.equal(await taskButton.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator(".trip-adventure-calendar-day").count(), 14);
  const rows = await page.locator(".trip-adventure-calendar-day").evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect(); return { date: node.dataset.date, top: box.top, left: box.left, width: box.width };
  }));
  assert(rows.slice(0, 7).every(row => Math.abs(row.top - rows[0].top) < 1));
  assert(rows.slice(7).every(row => Math.abs(row.top - rows[7].top) < 1));
  assert(rows[7].top > rows[0].top);
  const parity = await page.evaluate(async () => {
    const { getAdventureCalendarDays, eventUrlId } = await import("./src/components/calendar/tripCalendarData.js");
    const expected = getAdventureCalendarDays();
    return { dates: expected.map(entry => entry.dateId), events: expected.flatMap(entry => entry.events.map(eventUrlId)) };
  });
  assert.deepEqual(rows.map(row => row.date), parity.dates);
  assert.equal(await page.locator(".trip-adventure-calendar-event").count(), parity.events.length);
  await page.waitForFunction(() => document.querySelector(".trip-adventure-calendar-scope .trip-pencil-text")?.dataset.pencilReady === "true");
  await screenshot("calendar-desktop");

  await day("2026-09-30").locator(".trip-adventure-calendar-date").click();
  await page.waitForURL("**/*date=2026-09-30"); await idle();
  assert.equal(await day("2026-09-30").getAttribute("data-selected"), "true");
  const selected = await metrics();
  assert.equal(selected.k, 10);
  const center = await page.locator('.trip-stop[data-tag="ZQN"]').evaluate(node => {
    const a = node.closest(".trip-map-area").getBoundingClientRect(), b = node.getBoundingClientRect();
    return Math.hypot(b.x + b.width / 2 - a.x - a.width / 2, b.y + b.height / 2 - a.y - a.height / 2);
  });
  assert(center < .1, "Selected date did not center its destination");
  await page.reload(); await ready(); await assertLayout();
  assert.equal(await day("2026-09-30").getAttribute("data-selected"), "true");
  await page.waitForFunction(() => document.querySelector(".trip-map-area").__zoom.k === 10);
  await page.evaluate(() => { window.__calendarDocument = true; });
  await day("2026-09-30").locator(".trip-adventure-calendar-event").first().click();
  await page.locator(".route-event-page").waitFor();
  assert.equal(new URL(page.url()).hash, "#overview");
  assert.match(new URL(page.url()).searchParams.get("event"), /^2026-09-30\|/);
  assert(await page.evaluate(() => window.__calendarDocument), "Event navigation reloaded app");
  await page.goBack(); await ready(); await assertLayout();
  assert.equal(new URL(page.url()).searchParams.get("date"), "2026-09-30");
  await page.keyboard.press("Escape");
  await calendar().waitFor({ state: "hidden" });
  assert.equal(await calendar().getAttribute("inert"), "");
  await page.waitForFunction(() => document.querySelector(".trip-map-area").clientHeight === innerHeight);
  assert.equal(new URL(page.url()).search, "");
  await page.goBack(); await ready(); await assertLayout();
  assert.equal(await day("2026-09-30").getAttribute("data-selected"), "true");
  await page.getByRole("button", { name: "背包", exact: true }).click();
  assert(await page.locator(".trip-bag-list").isVisible());
  await calendar().waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "关闭面板" }).click();

  for (const [width, height] of [[436, 900], [320, 700], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "任务", exact: true }).tap();
    await ready(); await assertLayout();
    await day("2026-10-09").locator(".trip-adventure-calendar-date").tap(); await idle();
    assert.equal(await day("2026-10-09").getAttribute("data-selected"), "true");
    await page.waitForTimeout(600); await screenshot("calendar-" + width);
    await page.getByRole("button", { name: "关闭日历", exact: true }).tap();
    await calendar().waitFor({ state: "hidden" });
    assert.equal(await taskButton.getAttribute("aria-expanded"), "false");
  }
  await page.goto(base + "?panel=tasks&date=not-a-date"); await ready(); await assertLayout();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await day("2026-09-30").locator(".trip-adventure-calendar-date").click(); await idle();
  assert.equal((await metrics()).k, 10);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ opened, dates: parity.dates.length, events: parity.events.length,
    dataParity: true, dateFocus: true, eventDetails: true, history: true, mobile: true, errors }));
} finally { await browser.close(); }
