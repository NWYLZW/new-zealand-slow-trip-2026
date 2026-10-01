import { LOCATION_MAX_ACCURACY, LOCATION_MAX_AGE, validPosition } from "./nearbyModel.js";

// Only the latest fix is kept, in memory. No camera preference or storage is shared.
export function createNearbyLocation({ geolocation, permissions, onChange, now = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  let active = false, enabled = false, disposed = false, generation = 0;
  let watch = null, expiry = null, delivery = null, permission = null, permissionListener = null;
  let lastPublished = -Infinity, lastTimestamp = -Infinity, pending = null;
  const emit = (status, location = null) => { if (!disposed) onChange({ enabled, status, location }); };
  function stop() {
    generation++;
    if (watch !== null) geolocation?.clearWatch(watch);
    watch = null;
    clearTimer(expiry); clearTimer(delivery);
    expiry = delivery = null; pending = null; lastPublished = lastTimestamp = -Infinity;
    permission?.removeEventListener?.("change", permissionListener);
    permission = permissionListener = null;
  }
  function fail(status) { stop(); enabled = false; emit(status); }
  function observePermission(result, token) {
    if (token !== generation || disposed || !active || !enabled) return;
    permission = result;
    permissionListener = () => {
      if (result.state !== "granted") fail(result.state === "denied" ? "denied" : "off");
    };
    result.addEventListener?.("change", permissionListener);
    if (result.state === "denied") fail("denied");
  }
  function startWatch(token) {
    if (token !== generation || !active || !enabled || disposed) return;
    if (!geolocation) { fail("unsupported"); return; }
    emit("loading");
    const publish = () => {
      clearTimer(delivery);
      delivery = null;
      if (token !== generation || !pending) return;
      const location = pending; pending = null; lastPublished = now();
      clearTimer(expiry);
      if (now() - location.timestamp >= LOCATION_MAX_AGE) { emit("stale"); return; }
      emit(location.accuracy > LOCATION_MAX_ACCURACY ? "imprecise" : "ready", location);
      expiry = setTimer(() => { if (token === generation) emit("stale"); },
        Math.max(1, LOCATION_MAX_AGE - (now() - location.timestamp)));
    };
    try {
      const id = geolocation.watchPosition(position => {
        if (token !== generation || !active || !enabled || disposed) return;
        const fix = { position: [position.coords?.latitude, position.coords?.longitude],
          accuracy: position.coords?.accuracy, timestamp: position.timestamp };
        if (!validPosition(fix.position) || !Number.isFinite(fix.accuracy) || fix.accuracy < 0
          || !Number.isFinite(fix.timestamp) || fix.timestamp > now() + 1000) {
          clearTimer(expiry); clearTimer(delivery); expiry = delivery = null; pending = null;
          emit("unavailable"); return;
        }
        if (fix.timestamp < lastTimestamp) return;
        lastTimestamp = fix.timestamp;
        pending = fix;
        if (now() - lastPublished >= 10000) publish();
        else if (delivery === null) delivery = setTimer(publish, 10000 - (now() - lastPublished));
      }, error => {
        if (token === generation && active && enabled && !disposed)
          fail(error.code === 1 ? "denied" : error.code === 3 ? "timeout" : "unavailable");
      }, { enableHighAccuracy: false, maximumAge: 15000, timeout: 12000 });
      if (token === generation) watch = id;
      else geolocation.clearWatch(id);
    } catch { fail("unavailable"); }
  }
  function resume() {
    const token = generation;
    // A resumed page must not produce a fresh permission prompt without a click.
    if (!permissions?.query) { enabled = false; emit("off"); return; }
    emit("loading");
    Promise.resolve().then(() => permissions.query({ name: "geolocation" })).then(result => {
      if (token !== generation || !active || !enabled || disposed) return;
      if (result.state !== "granted") { fail(result.state === "denied" ? "denied" : "off"); return; }
      observePermission(result, token); startWatch(token);
    }).catch(() => { if (token === generation) fail("off"); });
  }
  return {
    setActive(value) {
      if (disposed || active === value) return;
      active = value; stop();
      if (active && enabled) resume();
      else emit(enabled ? "paused" : "off");
    },
    enable() {
      if (!active || disposed) return;
      stop(); enabled = true;
      const token = generation;
      startWatch(token);
      if (permissions?.query) Promise.resolve().then(() => permissions.query({ name: "geolocation" }))
        .then(result => observePermission(result, token)).catch(() => {});
    },
    disable() { stop(); enabled = false; emit("off"); },
    dispose() { stop(); enabled = false; disposed = true; },
  };
}
