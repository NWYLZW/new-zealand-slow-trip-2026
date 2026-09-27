import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL
  || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/?map=international";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 699 }, deviceScaleFactor: 3.25, hasTouch: true });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  assert.equal((await page.goto(base)).status(), 200);
  await page.waitForSelector(".trip-international-map[data-renderer='international-pencil']");
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    window.__internationalPerformance = { frames: [], longTasks: [] };
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => window.__internationalPerformance.longTasks.push(entry.duration));
    });
    observer.observe({ type: "longtask" });
    let previous = performance.now();
    const tick = now => {
      window.__internationalPerformance.frames.push(now - previous);
      previous = now;
      window.__internationalPerformance.frame = requestAnimationFrame(tick);
    };
    window.__internationalPerformance.observer = observer;
    window.__internationalPerformance.frame = requestAnimationFrame(tick);
  });
  await page.mouse.move(150, 350);
  await page.mouse.down();
  await page.mouse.move(225, 350, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(35);
  await page.mouse.move(225, 350);
  await page.mouse.down();
  await page.mouse.move(165, 350, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(1800);
  const result = await page.evaluate(() => {
    const sample = window.__internationalPerformance;
    cancelAnimationFrame(sample.frame);
    sample.observer.disconnect();
    const baseCanvas = document.querySelector(".trip-international-map");
    const routeCanvas = document.querySelector(".trip-international-routes");
    return {
      frames: sample.frames,
      longTasks: sample.longTasks,
      base: { ...baseCanvas.dataset },
      routes: { ...routeCanvas.dataset },
      routePathLength: document.querySelector(".trip-international-route-hit")?.getAttribute("d")?.length ?? 0,
      url: location.href,
    };
  });
  assert(result.frames.length > 20);
  assert(Math.max(...result.longTasks, 0) < 80, `International settle blocked: ${result.longTasks}`);
  assert(Number(result.base.rasterRefinements) >= 1, "International base did not refine after settling");
  assert(Number(result.routes.rasterRefinements) >= 1, "International routes did not refine after settling");
  assert.notEqual(result.base.rasterRefining, "true", "Base refinement did not finish");
  assert.notEqual(result.routes.rasterRefining, "true", "Route refinement did not finish");
  assert(result.routePathLength > 20, "Route hit geometry became blank");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    maxFrameGapMs: Math.max(...result.frames), maxLongTaskMs: Math.max(...result.longTasks, 0),
    baseRefinements: Number(result.base.rasterRefinements), routeRefinements: Number(result.routes.rasterRefinements),
    routePathLength: result.routePathLength, errors,
  }));
} finally {
  await browser.close();
}
