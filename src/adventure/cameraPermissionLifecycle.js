function availableSessionStorage() {
  try { return globalThis.sessionStorage ?? null; } catch { return null; }
}

export function createPermissionPromptGate({ storage = availableSessionStorage(), keyPrefix = "nz-trip-permission-prompted:" } = {}) {
  const attempted = new Set();
  const states = new Map();
  const key = name => `${keyPrefix}${name}`;
  const hasAttempted = name => {
    if (attempted.has(name)) return true;
    try { return storage?.getItem(key(name)) === "1"; } catch { return false; }
  };
  const markAttempted = name => {
    attempted.add(name);
    try { storage?.setItem(key(name), "1"); } catch { /* Memory state still suppresses this page session. */ }
  };
  return {
    canAutoRequest(name, state) {
      if (state === "granted") return true;
      if (state === "denied" || state === "checking") return false;
      return !hasAttempted(name);
    },
    noteRequest(name, state) {
      if (state !== "granted") markAttempted(name);
    },
    blockAutomatic(name) {
      markAttempted(name);
    },
    allowNextRequest(name) {
      attempted.delete(name);
      try { storage?.removeItem(key(name)); } catch { /* Memory state is sufficient for this explicit action. */ }
    },
    noteChange(name, next) {
      const previous = states.get(name);
      states.set(name, next);
      if (next === "denied" || previous === "granted") markAttempted(name);
    },
  };
}

export const cameraPermissionPromptGate = createPermissionPromptGate();

export function observeBrowserPermission(name, onChange, permissions = globalThis.navigator?.permissions) {
  let current = true;
  let status = null;
  let listener = null;
  const publish = value => {
    if (current) onChange(["granted", "prompt", "denied"].includes(value) ? value : "unknown");
  };
  if (!permissions?.query) {
    publish("unknown");
    return () => { current = false; };
  }
  Promise.resolve().then(() => permissions.query({ name })).then(result => {
    if (!current) return;
    status = result;
    listener = () => publish(status.state);
    publish(status.state);
    if (status.addEventListener) status.addEventListener("change", listener);
    else status.onchange = listener;
  }).catch(() => publish("unknown"));
  return () => {
    current = false;
    if (status?.removeEventListener && listener) status.removeEventListener("change", listener);
    else if (status) status.onchange = null;
  };
}
