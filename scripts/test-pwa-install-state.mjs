import assert from "node:assert/strict";

async function setup({ mode = "browser", ios = false, fullscreenElement = null } = {}) {
  const media = new Map();
  const windowEvents = new EventTarget();
  globalThis.window = Object.assign(windowEvents, {
    matchMedia(query) {
      if (!media.has(query)) {
        const result = new EventTarget();
        result.matches = query === `(display-mode: ${mode})`;
        media.set(query, result);
      }
      return media.get(query);
    },
  });
  globalThis.document = { fullscreenElement };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { standalone: ios } });
  const app = await import(`../src/pwa/installState.js?case=${++setup.sequence}`);
  app.startInstallCapture();
  return { app, media, windowEvents };
}
setup.sequence = 0;

for (const mode of ["standalone", "fullscreen"]) {
  const { app } = await setup({ mode });
  assert.equal(app.getInstallState().installed, true, `${mode} launch is installed`);
}
assert.equal((await setup({ ios: true })).app.getInstallState().installed, true);
assert.equal((await setup()).app.getInstallState().installed, false);
assert.equal((await setup({ mode: "fullscreen", fullscreenElement: {} })).app.getInstallState().installed,
  false, "Fullscreen API alone does not mean the app is installed");

const { app, media, windowEvents } = await setup();
const prompt = new Event("beforeinstallprompt", { cancelable: true });
windowEvents.dispatchEvent(prompt);
assert.equal(app.getInstallState().prompt, prompt);
assert.equal(prompt.defaultPrevented, true);
const fullscreen = media.get("(display-mode: fullscreen)");
fullscreen.matches = true;
fullscreen.dispatchEvent(new Event("change"));
assert.equal(app.getInstallState().installed, true);
assert.equal(app.getInstallState().prompt, null);
console.log("PWA install state: browser, standalone, fullscreen, iOS and display change passed");
