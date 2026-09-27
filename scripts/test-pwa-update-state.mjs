import assert from "node:assert/strict";

class WorkerEvents extends EventTarget {}
const serviceWorker = new WorkerEvents();
serviceWorker.ready = Promise.resolve(null);
let reloads = 0;
globalThis.window = {
  setTimeout,
  clearTimeout,
  location: { reload: () => { reloads++; } },
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { onLine: true, serviceWorker },
});

const registration = new EventTarget();
registration.waiting = null;
registration.installing = null;
registration.update = async () => {};
serviceWorker.getRegistration = async () => registration;

const module = await import(`../src/pwa/updateState.js?test=${Date.now()}`);
module.startUpdateRegistration(options => {
  options.onRegisteredSW("/sw.js", registration);
  return async () => {};
});
assert.equal(module.getUpdateState().status, "ready");

await module.checkForAppUpdate();
assert.equal(module.getUpdateState().status, "current");

navigator.onLine = false;
await module.checkForAppUpdate();
assert.equal(module.getUpdateState().status, "offline");

navigator.onLine = true;
registration.waiting = { postMessage: () => queueMicrotask(() => serviceWorker.dispatchEvent(new Event("controllerchange"))) };
await module.applyAppUpdate();
assert.equal(reloads, 1);

assert(!("caches" in globalThis), "The update path must not require deleting browser storage");

registration.update = () => new Promise(() => {});
registration.waiting = null;
const timeoutResult = await Promise.race([
  module.checkForAppUpdate().then(() => module.getUpdateState().status),
  new Promise(resolve => setTimeout(() => resolve("test-timeout"), 13000)),
]);
assert.equal(timeoutResult, "error", "A stalled update check must become an error state");

serviceWorker.ready = Promise.resolve(registration);
let registrationOptions;
const callbackModule = await import(`../src/pwa/updateState.js?callback=${Date.now()}`);
callbackModule.startUpdateRegistration(options => {
  registrationOptions = options;
  return async () => {};
});
await Promise.resolve();
assert.equal(callbackModule.getUpdateState().status, "registering",
  "An older ready registration must not complete the current registration attempt");
registrationOptions.onRegisteredSW("/sw.js", registration);
assert.equal(callbackModule.getUpdateState().status, "ready");

serviceWorker.getRegistration = async () => {
  throw new Error("registration lookup failed");
};
const rejectedLookupModule = await import(`../src/pwa/updateState.js?lookup-rejected=${Date.now()}`);
assert.equal(await rejectedLookupModule.checkForAppUpdate(), false);
assert.equal(rejectedLookupModule.getUpdateState().status, "error",
  "A rejected registration lookup must become an error state");

const realWindowSetTimeout = window.setTimeout;
window.setTimeout = (callback, timeout, ...args) => realWindowSetTimeout(callback, Math.min(timeout, 25), ...args);
serviceWorker.getRegistration = () => new Promise(() => {});
const stalledLookupModule = await import(`../src/pwa/updateState.js?lookup-stalled=${Date.now()}`);
assert.equal(await stalledLookupModule.checkForAppUpdate(), false);
assert.equal(stalledLookupModule.getUpdateState().status, "error",
  "A stalled registration lookup must become an error state");
window.setTimeout = realWindowSetTimeout;

window.setTimeout = (callback, timeout, ...args) => realWindowSetTimeout(callback, Math.min(timeout, 25), ...args);
let expiredOptions;
let retryOptions;
const expiredRegistration = new EventTarget();
expiredRegistration.waiting = null;
expiredRegistration.installing = null;
const retryRegistration = new EventTarget();
retryRegistration.waiting = null;
retryRegistration.installing = null;
const retryModule = await import(`../src/pwa/updateState.js?registration-retry=${Date.now()}`);
retryModule.startUpdateRegistration(options => {
  expiredOptions = options;
  return async () => {};
});
await new Promise(resolve => realWindowSetTimeout(resolve, 40));
assert.equal(retryModule.getUpdateState().status, "error");
retryModule.startUpdateRegistration(options => {
  retryOptions = options;
  return async () => {};
});
expiredOptions.onRegisteredSW("/old-sw.js", expiredRegistration);
assert.equal(retryModule.getUpdateState().status, "registering",
  "A callback from an expired registration attempt must not overwrite a retry");
retryOptions.onRegisteredSW("/sw.js", retryRegistration);
assert.equal(retryModule.getUpdateState().registration, retryRegistration);
assert.equal(retryModule.getUpdateState().status, "ready");
window.setTimeout = realWindowSetTimeout;

console.log(JSON.stringify({
  currentCheck: true,
  offlineGuard: true,
  controlledReload: true,
  callbackRegistration: true,
  registrationLookupErrors: true,
  expiredRegistrationIsolation: true,
}));
