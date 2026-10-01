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

export function cameraZoomSupportsValue(value, range) {
  return [range?.min, range?.max, range?.step].every(Number.isFinite)
    && range.max > range.min && range.step > 0
    && Number.isFinite(value) && value >= range.min && value <= range.max
    && Math.abs(snapCameraZoom(value, range) - value) < 1e-8;
}

export const CAMERA_ZOOM_INTERACTION_SCALE = 1.3;

export function cameraZoomPresetRect(box, boundary, obstacles = [], anchorBottom = false) {
  const width = box.right - box.left, height = box.bottom - box.top;
  const middle = (box.top + box.bottom) / 2;
  const originY = anchorBottom ? box.bottom : middle;
  const arc = { left: box.right - width * CAMERA_ZOOM_INTERACTION_SCALE, right: box.right,
    top: originY - (originY - box.top) * CAMERA_ZOOM_INTERACTION_SCALE,
    bottom: originY + (box.bottom - originY) * CAMERA_ZOOM_INTERACTION_SCALE };
  const left = anchorBottom ? box.right + 24 : box.right - 44;
  const candidates = [
    [left, anchorBottom ? middle - 86 : box.bottom - height * 1.15 - 48],
    [arc.left - 48, middle - 22], [left, arc.top - 48], [left, arc.bottom + 4],
    ...obstacles.map(other => [left, other.top - 48]),
  ];
  for (const [x, y] of candidates) {
    const rect = { left: x, top: y, right: x + 44, bottom: y + 44 };
    if (rect.left < boundary.left + 4 || rect.right > boundary.right - 4
      || rect.top < boundary.top + 4 || rect.bottom > boundary.bottom - 4) continue;
    if ([arc, ...obstacles].every(other => other.right <= rect.left - 4 || other.left >= rect.right + 4
      || other.bottom <= rect.top - 4 || other.top >= rect.bottom + 4)) return rect;
  }
  return null;
}

export function cameraZoomInteractionScale(box, boundary, obstacles = [], anchorBottom = false) {
  const originY = anchorBottom ? box.bottom : (box.top + box.bottom) / 2;
  const fits = scale => {
    const left = box.right - (box.right - box.left) * scale;
    const top = originY - (originY - box.top) * scale;
    const bottom = originY + (box.bottom - originY) * scale;
    return left >= boundary.left + 4 && box.right <= boundary.right - 4
      && top >= boundary.top + 4 && bottom <= boundary.bottom - 4
      && obstacles.every(other => other.right <= left - 4 || other.left >= box.right + 4
        || other.bottom <= top - 4 || other.top >= bottom + 4);
  };
  if (fits(CAMERA_ZOOM_INTERACTION_SCALE)) return CAMERA_ZOOM_INTERACTION_SCALE;
  // The expanding rectangle is nested; reserve existing control hitboxes without layout animation.
  let low = 1, high = CAMERA_ZOOM_INTERACTION_SCALE;
  for (let index = 0; index < 16; index++) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return Math.floor(low * 1000) / 1000;
}

export function cameraZoomTicks(value, range) {
  const scale = 96 / Math.LN2 / 10;
  const position = cameraZoomPosition(value, range) * scale;
  const minimum = cameraZoomPosition(range.min, range) * scale;
  const maximum = cameraZoomPosition(range.max, range) * scale;
  const ticks = new Map();
  const add = (target, index, endpoint = false) => {
    const angle = (cameraZoomPosition(target, range) * scale - position) * .24;
    if (Math.abs(angle) <= 1.35) ticks.set(target, { value: target, angle, index, endpoint });
  };
  for (let index = Math.max(Math.ceil(minimum), Math.floor(position) - 7);
    index <= Math.min(Math.floor(maximum), Math.floor(position) + 7); index++) {
    add(snapCameraZoom(Math.exp(index / scale) + zoomOrigin(range), range), index);
  }
  add(range.min, 0, true);
  add(range.max, 0, true);
  return [...ticks.values()].sort((a, b) => a.value - b.value);
}

export function cameraZoomDragValue(start, deltaY, range) {
  // A doubling always takes 96px, leaving proportionally more travel at low zoom.
  const origin = zoomOrigin(range);
  const position = cameraZoomPosition(start, range) - deltaY * Math.LN2 / 96;
  return Math.max(range.min, Math.min(range.max, Math.exp(position) + origin));
}

export function cameraZoomPinchValue(value, previousDistance, distance, range) {
  if (!(previousDistance > 0) || !(distance > 0)) return value;
  const origin = zoomOrigin(range);
  return Math.max(range.min, Math.min(range.max, origin + (value - origin) * distance / previousDistance));
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
