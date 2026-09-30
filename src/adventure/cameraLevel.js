import { cameraIconCompensation, normalizeCameraAngle } from "./cameraIconOrientation.js";

const edges = ["top", "right", "bottom", "left"];
const SAMPLE_LIFETIME_MS = 2500;

export function cameraLevelReading(beta, gamma, screenAngle = 0) {
  if (!Number.isFinite(beta) || Math.abs(beta) > 180
    || !Number.isFinite(gamma) || Math.abs(gamma) > 90) return null;
  const angle = cameraIconCompensation(beta, gamma, Number.isFinite(screenAngle) ? screenAngle : 0);
  if (angle === null) return null;
  // The compensated up-vector selects a grid edge; only its residual roll
  // rotates that edge. Folding to 180 degrees would lose upside-down poses.
  const quarter = Math.round(angle / 90);
  const roll = normalizeCameraAngle(angle - quarter * 90);
  return { edge: edges[(quarter + 4) % 4], angle: roll, aligned: Math.abs(roll) <= 2 };
}

export function createCameraLevelPermissionStore(environment = globalThis) {
  const listeners = new Set();
  let permission = "prompt";
  const getSnapshot = () => {
    const Sensor = environment.DeviceOrientationEvent;
    if (!Sensor) return "unavailable";
    return typeof Sensor.requestPermission === "function" ? permission : "passive";
  };
  const publish = value => {
    permission = value;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Only the settings button calls this, synchronously within its gesture.
    async request() {
      if (!["prompt", "denied"].includes(getSnapshot()) || environment.document?.hidden) return;
      publish("requesting");
      try {
        const result = await environment.DeviceOrientationEvent.requestPermission();
        publish(result === "granted" ? "granted" : "denied");
      } catch {
        publish("denied");
      }
    },
  };
}

export const cameraLevelPermission = createCameraLevelPermissionStore();

export function observeCameraLevel(onReading, onStatus, environment = globalThis) {
  const win = environment.window;
  const doc = environment.document;
  if (!win || !doc || typeof environment.DeviceOrientationEvent === "undefined") {
    onReading(null);
    onStatus("unavailable");
    return () => {};
  }
  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)");
  const now = () => environment.performance?.now?.() ?? Date.now();
  let expiryTimer = 0, paintTimer = 0;
  let lastSample = null;
  let lastReading = null;
  let lastPaint = -Infinity;
  let listening = false, pageHidden = false, disposed = false;
  const clearReading = () => {
    environment.clearTimeout(expiryTimer);
    environment.clearTimeout(paintTimer);
    expiryTimer = paintTimer = 0;
    lastSample = null;
    lastReading = null;
    lastPaint = -Infinity;
    onReading(null);
  };
  const expire = () => {
    if (disposed) return;
    clearReading();
    onStatus("waiting");
  };
  const paint = (force = false) => {
    if (disposed || !lastSample || doc.hidden || pageHidden) return;
    if (now() - lastSample.at >= SAMPLE_LIFETIME_MS) { expire(); return; }
    const angle = environment.screen?.orientation?.angle;
    const legacyAngle = win.orientation;
    const reading = cameraLevelReading(lastSample.beta, lastSample.gamma,
      Number.isFinite(angle) ? angle : Number.isFinite(legacyAngle) ? legacyAngle : 0);
    const interval = reducedMotion?.matches ? 250 : 100;
    if (!force && reading && lastReading && reading.edge === lastReading.edge
      && reading.aligned === lastReading.aligned) {
      if (Math.abs(reading.angle - lastReading.angle) < (reducedMotion?.matches ? 1 : .3)) return;
      const remaining = interval - (now() - lastPaint);
      if (remaining > 0) {
        if (!paintTimer) paintTimer = environment.setTimeout(() => {
          paintTimer = 0;
          paint();
        }, remaining);
        return;
      }
    }
    environment.clearTimeout(paintTimer);
    paintTimer = 0;
    lastReading = reading;
    lastPaint = now();
    onReading(reading);
    onStatus(reading ? "ready" : "waiting");
  };
  const update = event => {
    if (disposed || !listening || doc.hidden || pageHidden) return;
    lastSample = { beta: event.beta, gamma: event.gamma, at: now() };
    environment.clearTimeout(expiryTimer);
    paint();
    expiryTimer = environment.setTimeout(expire, SAMPLE_LIFETIME_MS);
  };
  const repaint = () => paint(true);
  const detach = () => {
    win.removeEventListener("deviceorientation", update);
    win.removeEventListener("orientationchange", repaint);
    environment.screen?.orientation?.removeEventListener?.("change", repaint);
    listening = false;
  };
  const visibility = () => {
    if (disposed) return;
    clearReading();
    if (doc.hidden || pageHidden) detach();
    else if (!listening) {
      win.addEventListener("deviceorientation", update);
      win.addEventListener("orientationchange", repaint);
      environment.screen?.orientation?.addEventListener?.("change", repaint);
      listening = true;
    }
    onStatus("waiting");
  };
  const pageHide = () => { pageHidden = true; visibility(); };
  const pageShow = () => { pageHidden = false; visibility(); };
  win.addEventListener("pagehide", pageHide);
  win.addEventListener("pageshow", pageShow);
  doc.addEventListener("visibilitychange", visibility);
  reducedMotion?.addEventListener?.("change", repaint);
  visibility();
  return () => {
    if (disposed) return;
    disposed = true;
    detach();
    clearReading();
    win.removeEventListener("pagehide", pageHide);
    win.removeEventListener("pageshow", pageShow);
    doc.removeEventListener("visibilitychange", visibility);
    reducedMotion?.removeEventListener?.("change", repaint);
  };
}
