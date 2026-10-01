import { cameraZoomPinchValue, snapCameraZoom } from "./cameraZoomDial.js";

export function supportsCameraPinchZoom(zoom) {
  return Boolean(zoom && !zoom.disabled && typeof zoom.setValue === "function"
    && [zoom.min, zoom.max, zoom.step, zoom.value].every(Number.isFinite)
    && zoom.max > zoom.min && zoom.step > 0);
}

export function createCameraPinchZoom(getZoom, {
  schedule = callback => requestAnimationFrame(callback),
  unschedule = frame => cancelAnimationFrame(frame),
} = {}) {
  const pointers = new Map();
  let gesture = null, frame = null, pending = null, intent = null, abort = null, requestId = 0;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const release = pointer => {
    try { pointer.target.releasePointerCapture(pointer.id); } catch { /* Capture can already be lost. */ }
  };
  const cancel = () => {
    requestId++;
    abort?.abort();
    abort = null;
    if (frame !== null) unschedule(frame);
    frame = pending = intent = gesture = null;
    const held = [...pointers.values()];
    pointers.clear();
    held.forEach(release);
  };
  const flush = () => {
    if (frame !== null) unschedule(frame);
    frame = null;
    const value = pending;
    pending = null;
    const zoom = getZoom();
    if (value === null || !supportsCameraPinchZoom(zoom)) return;
    if (!abort || abort.signal.aborted) abort = new AbortController();
    const signal = abort.signal, id = requestId;
    Promise.resolve().then(() => {
      if (id !== requestId || signal.aborted) return false;
      return zoom.setValue(value, { signal });
    }).then(success => {
      if (id !== requestId) return;
      intent = null;
      if (success !== true) cancel();
    }, () => { if (id === requestId) cancel(); });
  };
  const request = value => {
    const zoom = getZoom();
    const target = snapCameraZoom(value, zoom);
    if (target === intent || (intent === null && target === zoom.value)) return;
    requestId++;
    intent = pending = target;
    if (frame === null) frame = schedule(flush);
  };
  const move = event => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const zoom = getZoom();
    if (!supportsCameraPinchZoom(zoom)) { cancel(); return; }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (pointers.size !== 2) return;
    event.preventDefault();
    event.stopPropagation();
    const nextDistance = distance();
    if (nextDistance < 4) return;
    if (!gesture) { gesture = { distance: nextDistance, value: intent ?? zoom.value }; return; }
    // Accumulate unsnapped movement so small updates still cross hardware steps.
    gesture.value = cameraZoomPinchValue(gesture.value, gesture.distance, nextDistance, zoom);
    gesture.distance = nextDistance;
    request(gesture.value);
  };
  return {
    cancel,
    onPointerDown(event) {
      const zoom = getZoom();
      if (event.pointerType !== "touch" || !supportsCameraPinchZoom(zoom)
        || event.target.closest?.('button,input,select,a,[role="slider"]')) return;
      if (pointers.size >= 2) { cancel(); return; }
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { return; }
      pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY, target: event.currentTarget });
      if (pointers.size === 2) {
        const span = distance();
        if (span >= 4) gesture = { distance: span, value: intent ?? zoom.value };
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onPointerMove: move,
    onPointerUp(event) {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      move(event);
      flush();
      pointers.delete(event.pointerId);
      gesture = null;
      release(pointer);
    },
    onPointerCancel(event) { if (pointers.has(event.pointerId)) cancel(); },
    onLostPointerCapture(event) { if (pointers.has(event.pointerId)) cancel(); },
  };
}
