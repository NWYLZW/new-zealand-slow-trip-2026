import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/";
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const model of ["2608BPX34C", "unknown"]) {
    const page = await browser.newPage({ viewport: { width: 860, height: 608 } });
    await page.addInitScript(model => {
      localStorage.setItem("nz-trip-adventure-orientation", "system");
      Object.defineProperty(navigator, "userAgentData", { value: {
        getHighEntropyValues: async () => ({ platform: "Android", model }),
      } });
      Object.defineProperty(screen.orientation, "angle", { get: () => 270 });
    }, model);
    for (const query of ["day=2026-10-11&fullscreen=right", "panel=bag", "panel=tasks&fullscreen=calendar"]) {
      await page.goto(`${base}?map=nz&${query}`);
      const calendar = query.includes("fullscreen=calendar");
      const selector = calendar ? ".trip-adventure-calendar-header" : "#trip-right-panel .trip-panel-header";
      await page.locator(selector).waitFor();
      await page.waitForTimeout(650);
      const layout = await page.locator(selector).evaluate(header => {
        const controls = [...header.querySelectorAll("button")].filter(el => el.getBoundingClientRect().height >= 44);
        const close = header.querySelector(".trip-close,.trip-adventure-calendar-close");
        const closeRect = close.getBoundingClientRect();
        const heading = header.querySelector(".trip-panel-heading")?.getBoundingClientRect();
        const center = rect => rect.y + rect.height / 2;
        return {
          top: closeRect.top, right: closeRect.right, center: center(closeRect),
          headingCenter: heading ? center(heading) : null,
          aligned: controls.every(el => Math.abs(center(el.getBoundingClientRect()) - center(closeRect)) < 1),
          hit: document.elementFromPoint(closeRect.x + closeRect.width / 2, center(closeRect))?.closest("button") === close,
          viewport: innerWidth, scroll: document.documentElement.scrollWidth,
          board: document.querySelector("#trip-board-structure").getBoundingClientRect().width,
        };
      });
      assert(layout.aligned && layout.hit, JSON.stringify(layout));
      assert.equal(layout.scroll, layout.viewport);
      assert.equal(layout.board, layout.viewport);
      if (layout.headingCenter !== null) assert(Math.abs(layout.headingCenter - layout.center) < 1);
      if (model === "2608BPX34C") {
        assert.equal(layout.top, 13, JSON.stringify({ query, layout }));
        assert(layout.right <= 800, JSON.stringify(layout));
      } else {
        assert.equal(layout.top, calendar ? 7 : 9);
      }
      results.push({ model, query, ...layout });
    }
    await page.close();
  }
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
