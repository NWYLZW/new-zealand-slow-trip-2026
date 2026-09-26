import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], checked = new Set();
const settle = page => page.waitForTimeout(550);

try {
  const page = await browser.newPage({ viewport: { width: 1327, height: 964 } });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const tooltip = page.getByRole("tooltip");
  const tooltipVisible = async () => tooltip.isVisible().catch(() => false);
  const expectTooltip = async (button, label) => {
    await button.hover();
    await tooltip.waitFor({ state: "visible" })
      .catch(error => { throw new Error(`Tooltip did not appear for ${label}`, { cause: error }); });
    await page.waitForFunction(expected => document.querySelector("#trip-icon-tooltip")?.textContent === expected, label)
      .catch(error => { throw new Error(`Tooltip did not update for ${label}`, { cause: error }); });
    const box = await tooltip.boundingBox();
    const viewport = page.viewportSize();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, JSON.stringify({ label, box }));
    assert.equal(await button.getAttribute("aria-describedby"), "trip-icon-tooltip");
  };
  const expectNoTooltip = async button => {
    await button.hover();
    await page.waitForTimeout(160);
    assert.equal(await tooltipVisible(), false, `Visible label must suppress tooltip: ${await button.textContent()}`);
  };
  const tooltipSide = async button => {
    const [controlBox, tooltipBox] = await Promise.all([button.boundingBox(), tooltip.boundingBox()]);
    return { controlBox, tooltipBox };
  };
  const hasVisibleLabel = button => button.evaluate(control => {
    const visible = element => {
      for (let node = element; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (node.hidden || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0
          || (style.clip !== "auto" && style.clip !== "rect(auto, auto, auto, auto)")
          || /inset\((?:50|100)%/.test(style.clipPath.replaceAll(" ", ""))) return false;
        if (node === control) break;
      }
      const outer = control.getBoundingClientRect();
      return [...element.getClientRects()].some(rect => rect.width > 1 && rect.height > 1
        && Math.min(rect.right, outer.right) - Math.max(rect.left, outer.left) > 1
        && Math.min(rect.bottom, outer.bottom) - Math.max(rect.top, outer.top) > 1);
    };
    if ([...control.querySelectorAll(".trip-pencil-text")].some(element => element.textContent.trim() && visible(element))) return true;
    const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (node.textContent.trim() && parent && !parent.closest(".trip-pencil-text,.trip-pencil-icon") && visible(parent)) return true;
    }
    return false;
  });
  const checkControls = async (root = "#trip-board-structure", limit = Infinity) => {
    const buttons = page.locator(`${root} :is(button,a,summary,[role=button],[role=tab]):has(.trip-pencil-icon)`);
    for (let index = 0; index < Math.min(await buttons.count(), limit); index++) {
      const button = buttons.nth(index);
      if (!await button.isVisible() || await button.evaluate(el => Boolean(el.closest("[inert],[aria-hidden=true]")))) continue;
      const label = await button.evaluate(el => el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent.trim());
      assert(label, `Icon control ${index} requires an accessible explanation`);
      assert.equal(await button.getAttribute("title"), null, `${label} must not retain a native duplicate tooltip`);
      await page.mouse.move(400, 850);
      if (await hasVisibleLabel(button)) await expectNoTooltip(button);
      else await expectTooltip(button, label);
      if (!await button.isDisabled()) {
        const transform = await button.locator(".trip-pencil-icon").last().evaluate(icon => getComputedStyle(icon).transform);
        assert.notEqual(transform, "none", `${label} needs hover feedback`);
      }
      checked.add(label);
    }
  };
  const visit = async query => {
    await page.goto(`${base}?panel=tasks&date=2026-09-28&${query}`);
    await page.locator("#trip-right-panel").waitFor();
    await settle(page);
  };

  await visit("right=bag&bagTab=car");
  await checkControls();
  const bagTab = page.getByRole("tab", { name: "住宿", exact: true });
  await expectTooltip(bagTab, "住宿");
  const railSide = await tooltipSide(bagTab);
  assert(railSide.tooltipBox.x >= railSide.controlBox.x + railSide.controlBox.width + 7,
    `Bag rail tooltip must open to the right: ${JSON.stringify(railSide)}`);
  const expand = page.getByRole("button", { name: "全屏面板", exact: true });
  assert.equal(await expand.getAttribute("title"), null, "Shared feedback suppresses native icon-control titles");
  assert.equal(await expand.getAttribute("aria-label"), "全屏面板", "Suppressing title preserves the accessible name");
  await expectTooltip(expand, "全屏面板");
  const headerSide = await tooltipSide(expand);
  const headerBox = await page.locator(".trip-panel-header").boundingBox();
  assert(headerSide.tooltipBox.y >= headerBox.y + headerBox.height + 7,
    `Header tooltip must remain below the header: ${JSON.stringify({ headerSide, headerBox })}`);
  await expand.evaluate(control => {
    control.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }));
    control.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: document.body }));
  });
  await page.waitForTimeout(200);
  assert.equal(await tooltip.isVisible(), true, "Quick re-entry keeps the tooltip visible");
  const tipBox = await tooltip.boundingBox();
  await page.mouse.move(tipBox.x + tipBox.width / 2, tipBox.y + tipBox.height / 2);
  await page.waitForTimeout(200);
  assert.equal(await tooltip.isVisible(), true, "The tooltip itself can be hovered");
  await page.keyboard.press("Escape");
  await tooltip.waitFor({ state: "detached" });

  await page.evaluate(() => {
    const fixtures = document.createElement("div");
    fixtures.id = "trip-tooltip-fixtures";
    fixtures.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:200;display:flex;gap:8px";
    fixtures.innerHTML = `
      <button id="trip-tooltip-sr-only" type="button" aria-label="Hidden accessible label"><canvas class="trip-pencil-icon"></canvas><span style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap">Hidden accessible label</span></button>
      <button id="trip-tooltip-responsive-hidden" type="button" aria-label="Responsive hidden label"><canvas class="trip-pencil-icon"></canvas><span style="display:none">Responsive hidden label</span></button>
      <button id="trip-tooltip-visible-label" type="button" title="Native duplicate"><canvas class="trip-pencil-icon"></canvas><span>Visible label</span></button>
      <nav role="tablist" aria-orientation="vertical" style="position:fixed;right:4px;top:45%;z-index:201"><button id="trip-tooltip-left-fallback" role="tab" type="button" aria-label="Left fallback tooltip" style="width:44px;height:44px"><canvas class="trip-pencil-icon"></canvas></button></nav>`;
    document.querySelector("#trip-board-structure").append(fixtures);
  });
  await page.waitForFunction(() => !document.querySelector("#trip-tooltip-visible-label").hasAttribute("title"));
  await expectTooltip(page.locator("#trip-tooltip-sr-only"), "Hidden accessible label");
  await expectTooltip(page.locator("#trip-tooltip-responsive-hidden"), "Responsive hidden label");
  await expectNoTooltip(page.locator("#trip-tooltip-visible-label"));
  assert.equal(await page.locator("#trip-tooltip-visible-label").getAttribute("title"), null);
  assert.equal(await page.locator("#trip-tooltip-visible-label").getAttribute("aria-label"), null,
    "Visible text remains the accessible name when native title is removed");
  const leftFallback = page.locator("#trip-tooltip-left-fallback");
  await expectTooltip(leftFallback, "Left fallback tooltip");
  const fallbackSide = await tooltipSide(leftFallback);
  assert(fallbackSide.tooltipBox.x + fallbackSide.tooltipBox.width <= fallbackSide.controlBox.x - 7,
    `Vertical rail tooltip must flip left when the right side is unavailable: ${JSON.stringify(fallbackSide)}`);
  await page.locator("#trip-tooltip-fixtures").evaluate(element => element.remove());

  await visit("right=bag&bagTab=car");
  await page.getByRole("link", { name: "在新标签页管理 Budget 订单", exact: true }).hover();
  await tooltip.waitFor({ state: "visible" });
  if (output) await page.screenshot({ path: `${output}/rental-tooltip.png` });
  await page.getByRole("tab", { name: "备忘", exact: true }).click();
  await settle(page);
  const notes = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".trip-bag-note-categories .trip-bag-note-row")];
    return rows.map((row, i) => {
      const icon = row.querySelector(".trip-bag-note-icon").getBoundingClientRect();
      const label = row.querySelector(".trip-bag-note-category-title").getBoundingClientRect();
      const divider = row.querySelector(".trip-panel-divider-ink");
      const button = row.querySelector("button").getBoundingClientRect();
      const ctx = divider?.getContext("2d");
      const painted = ctx && [...ctx.getImageData(0, 0, divider.width, divider.height).data].some((n, j) => j % 4 === 3 && n > 0);
      return { gap: label.left - icon.right, last: i === rows.length - 1,
        divider: Boolean(divider), painted: Boolean(painted), below: !divider || divider.getBoundingClientRect().top >= button.bottom - 1 };
    });
  });
  assert(notes.every(row => row.gap <= 6 && row.gap >= 0 && row.below && (row.last ? !row.divider : row.painted)), JSON.stringify(notes));
  await checkControls(".trip-bag-note-categories");
  await page.mouse.move(400, 850);
  await settle(page);
  if (output) await page.screenshot({ path: `${output}/notes-dividers.png` });
  await page.locator(".trip-bag-note-category").first().click();
  await checkControls("#trip-right-panel");

  await visit("place=ZQN&placeTab=hotels");
  await checkControls("#trip-right-panel");
  await visit("right=camera");
  await checkControls("#trip-right-panel");
  await page.getByRole("button", { name: "相册", exact: true }).click();
  await checkControls("#trip-right-panel");
  await visit("right=camera&cameraView=settings");
  await checkControls("#trip-right-panel");
  await visit("day=2026-09-28");
  await checkControls("#trip-right-panel");

  await page.getByRole("button", { name: "全屏面板", exact: true }).click();
  await settle(page);
  assert.equal(await page.locator("#trip-right-panel>.trip-pencil-surface--full").count(), 1);
  assert.equal(await page.locator("#trip-right-panel .trip-pane-menu + .trip-pane-expand + .trip-close").count(), 1);
  const sheetEdge = await page.locator("#trip-right-panel > .trip-pencil-surface > .trip-pencil-surface-ink").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 20, 1, canvas.height - 20).data;
    return [...pixels].filter((_, i) => i % 4 === 3).every(alpha => alpha === 255);
  });
  assert(sheetEdge, "Fullscreen panel must have paper, not an inset divider, at the left boundary");
  await checkControls(".trip-panel-header");
  await page.getByRole("button", { name: "菜单", exact: true }).click();
  await checkControls("#trip-adventure-menu");
  const closeMenu = page.getByRole("button", { name: "关闭菜单", exact: true });
  await expectTooltip(closeMenu, "关闭菜单");
  const unlockRow = page.locator("#trip-adventure-menu .trip-adventure-menu-link").nth(1);
  await page.waitForFunction(element => element.querySelector(".trip-pencil-text")?.dataset.pencilReady === "true", await unlockRow.elementHandle());
  await expectNoTooltip(unlockRow);
  assert.equal(await tooltipVisible(), false, "Moving from icon-only to a labelled row clears the old tooltip");
  await unlockRow.focus();
  await page.waitForTimeout(160);
  assert.equal(await tooltipVisible(), false, "Keyboard focus on a labelled row does not create a tooltip");
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await checkControls("#trip-adventure-menu");
  await page.getByRole("button", { name: "关闭菜单", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector("#trip-adventure-menu").open);
  await page.getByRole("button", { name: "退出全屏", exact: true }).click();
  await settle(page);
  await page.getByRole("button", { name: "全屏日历", exact: true }).click();
  await settle(page);
  await checkControls(".trip-calendar-header-actions");
  assert.equal(await page.locator(".trip-calendar-header-actions .trip-pane-menu + .trip-pane-expand + .trip-close").count(), 1);
  const calendarEdge = await page.locator("#trip-calendar-region .trip-adventure-calendar-header > canvas").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, 1).data;
    return [...pixels].filter((_, i) => i % 4 === 3).every(alpha => alpha === 255);
  });
  assert(calendarEdge, "Fullscreen calendar top must be filled paper without the outer divider");
  await page.mouse.move(400, 850);
  await settle(page);
  if (output) await page.screenshot({ path: `${output}/calendar-no-top-divider.png` });

  await visit("right=bag");
  await page.mouse.move(400, 400);
  await page.keyboard.press("Tab");
  const focusTarget = page.getByRole("button", { name: "全屏面板", exact: true });
  await focusTarget.focus();
  await tooltip.waitFor({ state: "visible" });
  assert.equal(await focusTarget.getAttribute("aria-describedby"), "trip-icon-tooltip");
  await page.setViewportSize({ width: 436, height: 900 });
  await settle(page);
  await checkControls(".trip-panel-header");
  const mobileBagTab = page.getByRole("tab", { name: "住宿", exact: true });
  await expectTooltip(mobileBagTab, "住宿");
  const mobileRailSide = await tooltipSide(mobileBagTab);
  assert(mobileRailSide.tooltipBox.x >= mobileRailSide.controlBox.x + mobileRailSide.controlBox.width + 7,
    `Mobile bag rail tooltip must remain on the right: ${JSON.stringify(mobileRailSide)}`);
  if (output) await page.screenshot({ path: `${output}/tooltip-mobile.png` });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checked: [...checked], notes, fullscreenEdges: true, menuOrder: true,
    keyboardTooltip: true, railTooltip: { desktop: railSide, mobile: mobileRailSide, fallback: fallbackSide }, errors }));
} finally {
  await browser.close();
}
