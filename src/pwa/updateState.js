const listeners = new Set();

let state = {
  status: "idle",
  registration: null,
  updateSW: null,
  error: null,
  offlineReady: false,
};
let registerFactory = null;
let registrationAttempt = 0;
const trackedRegistrations = new WeakSet();

const emit = next => {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
};

const online = () => navigator.onLine !== false;

function withTimeout(promise, message, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeout);
    Promise.resolve(promise).then(value => {
      window.clearTimeout(timer);
      resolve(value);
    }, error => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

function waitForWorker(worker, timeout = 12000) {
  if (!worker || worker.state === "installed" || worker.state === "activated") return Promise.resolve(worker);
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      worker.removeEventListener("statechange", changed);
      reject(new Error("Service worker update timed out"));
    }, timeout);
    const changed = () => {
      if (worker.state === "installed" || worker.state === "activated") {
        window.clearTimeout(timer);
        worker.removeEventListener("statechange", changed);
        resolve(worker);
      } else if (worker.state === "redundant") {
        window.clearTimeout(timer);
        worker.removeEventListener("statechange", changed);
        reject(new Error("Service worker update was rejected"));
      }
    };
    worker.addEventListener("statechange", changed);
  });
}

function waitForControllerChange(timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      reject(new Error("Updated service worker did not take control"));
    }, timeout);
    const changed = () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      resolve();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
  });
}

function markRegistration(registration) {
  if (!registration) return;
  emit({ registration, status: registration.waiting || state.status === "available" ? "available" : "ready", error: null });
  if (trackedRegistrations.has(registration)) return;
  trackedRegistrations.add(registration);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    emit({ status: "checking", error: null });
    waitForWorker(worker).then(() => {
      emit({ status: state.status === "available" || registration.waiting || worker.state === "installed"
        ? "available" : "ready" });
    }).catch(error => emit({ status: "error", error }));
  });
}

export function startUpdateRegistration(registerSW) {
  registerFactory = registerSW;
  if (!["idle", "error", "offline"].includes(state.status)) return;
  emit({ status: "registering", error: null });
  const attempt = ++registrationAttempt;
  let registrationCallbackCompleted = false;
  const registrationTimer = window.setTimeout(() => {
    if (registrationCallbackCompleted || attempt !== registrationAttempt) return;
    registrationCallbackCompleted = true;
    emit({
      status: online() ? "error" : "offline",
      error: online() ? new Error("Service worker registration timed out") : null,
    });
  }, 12000);
  const completeRegistrationCallback = callback => {
    if (registrationCallbackCompleted || attempt !== registrationAttempt) return;
    registrationCallbackCompleted = true;
    window.clearTimeout(registrationTimer);
    callback();
  };
  try {
    const updateSW = registerSW({
      immediate: true,
      // autoUpdate lets this release rescue clients stuck on the former large
      // precache. Supplying the callback prevents later releases from reloading
      // a current client until the user chooses to refresh.
      onNeedReload: () => emit({ status: "available", error: null }),
      onOfflineReady: () => emit({ offlineReady: true }),
      onRegisteredSW: (_url, registration) => completeRegistrationCallback(() => markRegistration(registration)),
      onRegisterError: error => completeRegistrationCallback(() => emit({
        status: online() ? "error" : "offline",
        error: online() ? error : null,
      })),
    });
    emit({ updateSW });
  } catch (error) {
    registrationCallbackCompleted = true;
    window.clearTimeout(registrationTimer);
    emit({ status: "error", error });
  }
}

async function getRegistration() {
  if (state.registration) return state.registration;
  if (registerFactory && ["idle", "error", "offline"].includes(state.status)) {
    startUpdateRegistration(registerFactory);
  }
  if (!("serviceWorker" in navigator)) return null;
  const registration = await withTimeout(navigator.serviceWorker.getRegistration(),
    "Service worker registration lookup timed out");
  if (registration) markRegistration(registration);
  return registration;
}

export async function checkForAppUpdate() {
  if (!online()) {
    emit({ status: "offline", error: null });
    return false;
  }
  try {
    const registration = await getRegistration();
    if (!registration) throw new Error("Service worker is not registered");
    if (registration.waiting) {
      emit({ status: "available", error: null });
      return true;
    }
    emit({ status: "checking", error: null });
    await withTimeout(registration.update(), "Service worker update check timed out");
    const worker = registration.installing;
    if (worker) await waitForWorker(worker);
    await new Promise(resolve => window.setTimeout(resolve, 150));
    const available = state.status === "available" || Boolean(registration.waiting
      || worker?.state === "installed" || worker?.state === "activated");
    emit({ status: available ? "available" : "current", error: null });
    return available;
  } catch (error) {
    emit({ status: online() ? "error" : "offline", error: online() ? error : null });
    return false;
  }
}

export async function applyAppUpdate() {
  if (!online()) {
    emit({ status: "offline", error: null });
    return false;
  }
  if (state.status !== "available") {
    const available = await checkForAppUpdate();
    if (!available) return false;
  }
  emit({ status: "updating", error: null });
  try {
    const waiting = state.registration?.waiting;
    if (!waiting) {
      window.location.reload();
      return true;
    }
    const changed = waitForControllerChange();
    waiting.postMessage({ type: "SKIP_WAITING" });
    await changed;
    window.location.reload();
    return true;
  } catch (error) {
    emit({ status: "error", error });
    return false;
  }
}

export const getUpdateState = () => state;
export const subscribeUpdateState = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function reportUpdateRegistrationError(error) {
  emit({ status: navigator.onLine === false ? "offline" : "error", error });
}
