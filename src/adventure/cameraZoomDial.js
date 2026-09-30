export function snapCameraZoom(value, range) {
  const candidate = Number.isFinite(Number(value)) ? Number(value) : range.min;
  if (candidate <= range.min) return range.min;
  if (candidate >= range.max) return range.max;
  const snapped = range.min + Math.round((candidate - range.min) / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, Number(snapped.toFixed(10))));
}

function zoomOrigin(range) {
  return Math.min(0, range.min - Math.max(range.step, .01));
}

export function cameraZoomPosition(value, range) {
  const origin = zoomOrigin(range);
  return Math.log(Math.max(range.min, Math.min(range.max, value)) - origin);
}

export function cameraZoomDragValue(start, deltaY, range) {
  // A doubling always takes 96px, leaving proportionally more travel at low zoom.
  const origin = zoomOrigin(range);
  const position = cameraZoomPosition(start, range) - deltaY * Math.LN2 / 96;
  return Math.max(range.min, Math.min(range.max, Math.exp(position) + origin));
}

export function cameraZoomKeyValue(key, value, range) {
  if (key === "Home") return range.min;
  if (key === "End") return range.max;
  if (key === "ArrowUp" || key === "ArrowRight") return snapCameraZoom(value + range.step, range);
  if (key === "ArrowDown" || key === "ArrowLeft") {
    // A capability endpoint need not be aligned to its minimum-based step lattice.
    const previous = range.min + (Math.ceil((value - range.min) / range.step - 1e-8) - 1) * range.step;
    return snapCameraZoom(previous, range);
  }
  return null;
}

export function formatCameraZoom(value, step = .1) {
  if (!Number.isFinite(value)) return "?";
  let precision = 1;
  while (precision < 8 && Math.abs(step * 10 ** precision - Math.round(step * 10 ** precision)) > 1e-7) precision++;
  return `${Number(value.toFixed(precision))}\u00d7`;
}

export function createLatestCameraZoomQueue(enqueueHardware) {
  let pending = null, running = null, scheduled = false;

  const cancelItem = item => {
    if (!item) return;
    item.cancelled = true;
    item.finish(false);
  };
  const schedule = () => {
    if (scheduled || !pending) return;
    scheduled = true;
    const drain = async () => {
      const item = pending;
      pending = null;
      if (!item || item.cancelled) return;
      running = item;
      const isCurrent = () => !item.cancelled;
      let success = false;
      try { success = await item.task(isCurrent) === true; }
      catch { /* The caller owns the device error and confirmed settings readback. */ }
      item.finish(success && isCurrent());
      running = null;
    };
    Promise.resolve().then(() => enqueueHardware(drain)).catch(() => {
      cancelItem(pending);
      pending = null;
    }).finally(() => {
      scheduled = false;
      schedule();
    });
  };

  return {
    enqueue(task, { signal } = {}) {
      if (signal?.aborted) return Promise.resolve(false);
      cancelItem(pending);
      return new Promise(resolve => {
        let settled = false;
        const item = { task, cancelled: false, finish(value) {
          if (settled) return;
          settled = true;
          signal?.removeEventListener("abort", abort);
          resolve(value);
        } };
        const abort = () => {
          cancelItem(item);
          if (pending === item) pending = null;
        };
        signal?.addEventListener("abort", abort, { once: true });
        pending = item;
        schedule();
      });
    },
    cancel() {
      cancelItem(pending);
      cancelItem(running);
      pending = null;
    },
  };
}
