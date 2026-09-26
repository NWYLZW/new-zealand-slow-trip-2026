import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const output = process.env.ADVENTURE_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], results = [];
const settle = page => page.waitForTimeout(450);

try {
  for (const viewport of [{ width: 1145, height: 964 }, { width: 436, height: 900 }]) {
    const page = await browser.newPage({ viewport, colorScheme: "light" });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(() => {
      window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
    });
    await page.goto(`${base}?panel=tasks&date=2026-09-30&place=ZQN&placeTab=hotels`);
    await page.locator(".trip-stay-gallery-credit").waitFor();
    await page.waitForFunction(() => document.querySelector(".trip-stay-gallery img")?.naturalWidth > 0);
    await settle(page);
    const gallery = async () => page.evaluate(() => {
      const figure = document.querySelector(".trip-stay-gallery figure");
      const credit = document.querySelector(".trip-stay-gallery-credit");
      const frame = figure.getBoundingClientRect(), label = credit.getBoundingClientRect();
      const image = figure.querySelector("img").getBoundingClientRect();
      return { parent: credit.parentElement === figure,
        overlay: getComputedStyle(credit).position === "absolute",
        top: label.top - image.top, right: image.right - label.right,
        heightGap: document.querySelector(".trip-stay-gallery").getBoundingClientRect().height - frame.height,
        href: credit.querySelector("a")?.getAttribute("href"),
        contained: label.left >= frame.left && label.bottom <= frame.bottom };
    });
    const credit = await gallery();
    assert(credit.parent && credit.overlay && credit.contained, JSON.stringify(credit));
    assert(Math.abs(credit.top - 8) < 1 && Math.abs(credit.right - 8) < 1, JSON.stringify(credit));
    assert.equal(credit.heightGap, 0);
    assert.match(credit.href, /^https?:/);
    await page.getByRole("button", { name: "下一张照片", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".trip-stay-gallery img")?.naturalWidth > 0);
    await settle(page);
    assert.equal((await gallery()).overlay, true);
    if (output) await page.screenshot({ path: `${output}/hotel-credit-${viewport.width}.png` });

    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "安装到设备", exact: true }).click();
    await settle(page);
    const alignment = await page.evaluate(() => {
      const row = [...document.querySelectorAll(".trip-adventure-menu-link")].find(el => el.textContent.includes("安装到设备"));
      const label = row.querySelector(".trip-pencil-text").getBoundingClientRect();
      const heading = document.querySelector(".trip-adventure-menu-install-help strong").getBoundingClientRect();
      const paragraph = document.querySelector(".trip-adventure-menu-install-help p").getBoundingClientRect();
      return { heading: heading.left - label.left, paragraph: paragraph.left - label.left };
    });
    assert(Math.abs(alignment.heading) < 1 && Math.abs(alignment.paragraph) < 1, JSON.stringify(alignment));
    if (output) await page.screenshot({ path: `${output}/install-alignment-${viewport.width}.png` });

    await page.getByRole("button", { name: "设置", exact: true }).click();
    assert.equal(await page.locator(".trip-adventure-menu-setting h2 .trip-pencil-icon").count(), 3);
    const colors = [];
    for (const id of ["lake", "fern", "sunset"]) {
      await page.locator(`[data-theme-choice=${id}]`).click();
      await settle(page);
      colors.push(await page.getByRole("group", { name: "语言", exact: true }).locator("[aria-pressed=true] > canvas.trip-pencil-surface-ink").evaluate(canvas => canvas.toDataURL()));
    }
    assert.equal(new Set(colors).size, 3, "Theme selection must repaint actual button pigment");
    const previews = await page.evaluate(() => {
      const pixels = id => {
        const canvas = document.querySelector(`[data-appearance-preview=${id}]`);
        return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      };
      const light = pixels("light"), dark = pixels("dark"), system = pixels("system");
      let mismatches = 0;
      for (let y = 0; y < system.height; y++) for (let x = 0; x < system.width; x++) {
        const i = (y * system.width + x) * 4;
        const expected = x < system.width / 2 ? light : dark;
        for (let channel = 0; channel < 4; channel++) if (system.data[i + channel] !== expected.data[i + channel]) mismatches++;
      }
      return { mismatches, different: light.data.some((value, i) => value !== dark.data[i]) };
    });
    assert.equal(previews.mismatches, 0, "System preview must combine exact left/light and right/dark halves");
    assert(previews.different);
    await page.getByRole("button", { name: "浅色", exact: true }).click();
    await settle(page);
    if (output) await page.screenshot({ path: `${output}/settings-light-${viewport.width}.png` });
    await page.getByRole("button", { name: "深色", exact: true }).click();
    await settle(page);
    const darkColors = [];
    for (const id of ["lake", "fern", "sunset"]) {
      await page.locator(`[data-theme-choice=${id}]`).click();
      await settle(page);
      darkColors.push(await page.getByRole("group", { name: "语言", exact: true }).locator("[aria-pressed=true] > canvas.trip-pencil-surface-ink").evaluate(canvas => canvas.toDataURL()));
    }
    assert.equal(new Set(darkColors).size, 3);
    if (output) await page.screenshot({ path: `${output}/settings-dark-${viewport.width}.png` });
    await page.getByRole("button", { name: "跟随系统", exact: true }).click();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.dataset.adventureAppearance === "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.dataset.adventureAppearance === "light");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const optionBounds = await page.locator(".trip-adventure-menu-appearance").evaluateAll(buttons => buttons.every(button => {
      const rect = button.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && button.scrollWidth <= button.clientWidth;
    }));
    assert(optionBounds);
    await page.getByRole("button", { name: "关闭菜单", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("#trip-adventure-menu").open);
    await page.reload();
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "设置", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "跟随系统", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("[data-theme-choice=sunset]").getAttribute("aria-pressed"), "true");

    // A synthetic, empty vault exercises the unlocked layout without reading private data.
    await page.route("**/src/PrivateVaultContext.jsx*", route => route.fulfill({
      contentType: "application/javascript",
      body: `export function PrivateVaultProvider({children}) { return children; }
        export function usePrivateVault() { return { isConfigured: true, isUnlocked: true,
          data: {}, trusted: false, lock() { window.__testVaultLocked = true; } }; }`,
    }));
    await page.reload();
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("button", { name: "解锁私密资料", exact: true }).click();
    await page.locator(".trip-adventure-unlock-status").waitFor();
    await settle(page);
    const centered = await page.locator(".trip-adventure-unlock-status").evaluate(status => {
      const area = status.getBoundingClientRect();
      const button = status.querySelector("button").getBoundingClientRect();
      return { text: getComputedStyle(status).textAlign, delta: button.left + button.width / 2 - area.left - area.width / 2 };
    });
    assert.equal(centered.text, "center");
    assert(Math.abs(centered.delta) < 1, JSON.stringify(centered));
    if (output) await page.screenshot({ path: `${output}/unlock-centered-${viewport.width}.png` });
    await page.getByRole("button", { name: "立即锁定", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__testVaultLocked), true);
    results.push({ width: viewport.width, creditOverlay: true, installAlignment: alignment,
      themeButtonRepaint: true, appearancePreviews: true, systemHalfPreview: true,
      systemAppearance: true, persistedPreferences: true, headingIcons: true, unlockedCentered: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
