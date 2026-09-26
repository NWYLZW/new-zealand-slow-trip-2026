import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseline = process.env.ADVENTURE_MOTION_BASELINE === "1";
const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [], errors = [];
try {
  for (const width of baseline ? [1327] : [1327, 720]) {
    const page = await browser.newPage({ viewport: { width, height: 964 } });
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      const startTransition = document.startViewTransition?.bind(document);
      if (startTransition) document.startViewTransition = update => {
        const transition = startTransition(update);
        transition.ready.then(() => {
          if (window.__motion) window.__motion.ready = performance.now();
          const animations = document.getAnimations().filter(animation => animation.effect?.pseudoElement?.includes("trip-pane"));
          if (window.__freezeMotion) {
            for (const animation of animations) { animation.pause(); animation.currentTime = 150; }
            window.__frozenAnimations = animations;
          }
        }).catch(() => {});
        return transition;
      };
      navigator.mediaDevices.getUserMedia = () => { throw new Error("Unexpected device access"); };
      const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width");
      Object.defineProperty(HTMLCanvasElement.prototype, "width", {
        ...descriptor,
        set(value) {
          if (window.__motion && this.closest(".trip-panel,.trip-calendar-region")) window.__motion.paints++;
          descriptor.set.call(this, value);
        },
      });
    });
    await page.goto(`${base}?panel=tasks&date=2026-09-28&right=bag&front=tasks`);
    await page.locator(".trip-bag-stay-calendar").waitFor();
    await page.waitForTimeout(1600);
    for (const [label, selector] of [["全屏面板", "#trip-right-panel"], ["退出全屏", "#trip-right-panel"],
      ["全屏日历", "#trip-calendar-region"], ["退出全屏", "#trip-calendar-region"]]) {
      const measurement = await page.evaluate(async ({ label, selector }) => {
        const pane = document.querySelector(selector);
        const sizes = new Set(), frames = [], movingFrames = [];
        const stats = window.__motion = { paints: 0 };
        const start = performance.now();
        let previous = start;
        const observer = new ResizeObserver(() => sizes.add(`${pane.clientWidth}:${pane.clientHeight}`));
        observer.observe(pane);
        const sample = now => {
          if (stats.ready && previous >= stats.ready && now - stats.ready < 320) movingFrames.push(now - previous);
          frames.push(now - previous); previous = now;
          if (now - start < 1300) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
        pane.querySelector(`[aria-label="${label}"]`).click();
        await new Promise(resolve => setTimeout(resolve, 1500));
        observer.disconnect();
        window.__motion = null;
        return { paints: stats.paints, layouts: sizes.size, maxFrame: Math.round(Math.max(...frames)),
          motionMaxFrame: movingFrames.length ? Math.round(Math.max(...movingFrames)) : null,
          framesOver50: frames.filter(frame => frame > 50).length,
          cleanup: !document.documentElement.hasAttribute("data-trip-pane-transition") };
      }, { label, selector });
      results.push({ width, label, ...measurement });
      if (!baseline) {
        assert(measurement.layouts <= 3, `Layout must not change every animation frame: ${JSON.stringify(measurement)}`);
        assert(measurement.cleanup, "Transition must release its temporary styles");
      }
    }
    if (!baseline) {
      if (output) {
        for (const [label, name] of [["全屏面板", "panel"], ["全屏日历", "calendar"]]) {
          await page.evaluate(label => {
            window.__freezeMotion = true;
            window.__frozenAnimations = null;
            document.querySelector(`[aria-label="${label}"]`).click();
          }, label);
          await page.waitForFunction(() => window.__frozenAnimations?.length > 0);
          await page.screenshot({ path: `${output}/${name}-midpoint-${width}.png`, animations: "allow" });
          await page.evaluate(() => {
            window.__freezeMotion = false;
            for (const animation of window.__frozenAnimations) animation.play();
          });
          await page.waitForFunction(() => !document.documentElement.hasAttribute("data-trip-pane-transition"));
          await page.getByRole("button", { name: "退出全屏", exact: true }).click();
          await page.waitForFunction(() => !document.documentElement.hasAttribute("data-trip-pane-transition"));
        }
      }
      await page.evaluate(() => {
        const button = document.querySelector("#trip-right-panel .trip-pane-expand");
        button.click();
        button.click();
      });
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-trip-pane-transition"));
      assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), null);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "全屏面板", exact: true }).click();
      assert.equal(await page.locator("html").getAttribute("data-trip-pane-transition"), null);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), null);
      await page.evaluate(() => { document.startViewTransition = undefined; });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "全屏日历", exact: true }).click();
      assert.equal(await page.locator("#trip-board-structure").getAttribute("data-fullscreen"), "calendar");
      assert.equal(await page.locator("html").getAttribute("data-trip-pane-transition"), null);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ baseline, results, errors }));
} finally { await browser.close(); }
