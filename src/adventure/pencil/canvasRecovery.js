const caches = new Set();
const subscribers = new Set();
const painters = new WeakMap();
let frame = 0;

export function registerCanvasCache(cache) {
  caches.add(cache);
  return () => caches.delete(cache);
}

function recover() {
  frame = 0;
  if (document.visibilityState === 'hidden') return;
  // Keep authoritative pixel caches; only discard their disposable surfaces.
  for (const cache of caches) {
    try {
      if (typeof cache.invalidate === 'function') cache.invalidate();
      else cache.clear();
    } catch { /* One unavailable surface must not block other caches. */ }
  }
  for (const callback of subscribers) {
    try { callback(); } catch { /* Continue recovery for independent painters. */ }
  }
}

function scheduleRecovery() {
  if (!frame && document.visibilityState !== 'hidden') frame = requestAnimationFrame(recover);
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    cancelAnimationFrame(frame);
    frame = 0;
  } else scheduleRecovery();
}

function onPageShow(event) {
  if (event.persisted) scheduleRecovery();
}

export function observeCanvasRecovery(callback) {
  if (!subscribers.size) {
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('resume', scheduleRecovery);
    document.addEventListener('contextrestored', scheduleRecovery, true);
    window.addEventListener('pageshow', onPageShow);
  }
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
    if (subscribers.size) return;
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('resume', scheduleRecovery);
    document.removeEventListener('contextrestored', scheduleRecovery, true);
    window.removeEventListener('pageshow', onPageShow);
    cancelAnimationFrame(frame);
    frame = 0;
  };
}

// Imperative map markers keep their identity, handlers and focus during recovery.
export function setCanvasRepaint(canvas, paint) {
  painters.set(canvas, paint);
}

export function repaintCanvasTree(root) {
  for (const canvas of root.querySelectorAll('canvas')) {
    try { painters.get(canvas)?.(); } catch { /* Preserve recovery of other markers. */ }
  }
}
