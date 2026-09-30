import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { CameraPencilLabel } from "./CameraPencilLabel";
import { PencilText } from "./pencil/PencilText";
import { pencilStroke } from "./pencil/stroke";
import { cameraZoomDragValue, cameraZoomKeyValue, cameraZoomPosition, formatCameraZoom, snapCameraZoom } from "./cameraZoomDial.js";
import "./CameraZoomDial.css";

const textureCache = new Map();

function dialTextures(width, height, dpr, color) {
  const key = JSON.stringify([width, height, dpr, color]);
  if (textureCache.has(key)) return textureCache.get(key);
  const bitmap = (w, h, paint) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    paint(context);
    return canvas;
  };
  const material = { variation: .72, breaks: .15, grain: .7, gain: 2, step: .5 };
  const arc = bitmap(width, height, context => {
    const points = Array.from({ length: 33 }, (_, index) => {
      const angle = -1.3 + index * 2.6 / 32;
      return [width * (.7 - .3 * Math.cos(angle)), height * (.5 + .42 * Math.sin(angle))];
    });
    pencilStroke(context, points, "#fffbea", 1.2, 7019, .45, 2, false, material);
    pencilStroke(context, [[width - 5, height / 2 - 4], [width - 10, height / 2],
      [width - 5, height / 2 + 4]], color, 1.8, 7091, .25, 2, false, material);
  });
  const ticks = Array.from({ length: 8 }, (_, index) => bitmap(24, 10, context => {
    const major = index % 4 === 0;
    pencilStroke(context, [[major ? 3 : 9, 5], [21, 5]], major ? color : "#fffbea",
      major ? 1.9 : 1.4, 7201 + index * 53, .3, 2, false, material);
  }));
  const textures = { arc, ticks };
  textureCache.set(key, textures);
  if (textureCache.size > 16) textureCache.delete(textureCache.keys().next().value);
  return textures;
}

function paintDial(canvas, value, range) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const color = getComputedStyle(canvas).getPropertyValue("--trip-theme-accent").trim() || "#4b96aa";
  const { arc, ticks } = dialTextures(width, height, dpr, color);
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const context = canvas.getContext("2d");
  context.scale(dpr, dpr);
  context.drawImage(arc, 0, 0, width, height);
  const position = cameraZoomPosition(value, range) * 96 / Math.LN2 / 10;
  const middle = Math.floor(position);
  for (let index = middle - 7; index <= middle + 7; index++) {
    const angle = (index - position) * .24;
    if (Math.abs(angle) > 1.35) continue;
    context.save();
    context.globalAlpha = Math.max(.25, Math.cos(angle));
    context.translate(width * (.7 - .3 * Math.cos(angle)), height * (.5 + .42 * Math.sin(angle)));
    context.rotate(-angle * .35);
    context.drawImage(ticks[(index % 8 + 8) % 8], -20, -5, 24, 10);
    context.restore();
  }
}

export function CameraZoomDial({ zoom, en = false }) {
  const rootRef = useRef(null), canvasRef = useRef(null), pointerRef = useRef(null);
  const zoomRef = useRef(zoom), intentRef = useRef(null), requestRef = useRef(0), abortRef = useRef(null);
  const [intent, setIntent] = useState(null);
  zoomRef.current = zoom;
  const min = zoom?.min, max = zoom?.max, step = zoom?.step;
  const supported = [min, max, step].every(Number.isFinite) && max > min && step > 0;
  const disabled = !supported || zoom?.disabled || typeof zoom?.setValue !== "function";
  const confirmed = Number.isFinite(zoom?.value) ? zoom.value : null;

  const releasePointer = useCallback(() => {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (pointer) {
      try { rootRef.current?.releasePointerCapture(pointer.id); } catch { /* Capture may already be lost. */ }
    }
  }, []);
  const cancel = useCallback(() => {
    requestRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    intentRef.current = null;
    releasePointer();
    setIntent(null);
  }, [releasePointer]);

  useLayoutEffect(() => {
    // setValue is stable across readbacks and changes with the track/availability.
    cancel();
    const onHidden = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", cancel);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", cancel);
      requestRef.current++;
      abortRef.current?.abort();
      abortRef.current = null;
      intentRef.current = null;
      releasePointer();
    };
  }, [cancel, disabled, min, max, step, releasePointer, zoom?.setValue]);

  const paintRef = useRef(null);
  paintRef.current = () => {
    if (canvasRef.current && supported) paintDial(canvasRef.current, intent ?? confirmed ?? min, { min, max, step });
  };
  useLayoutEffect(() => {
    if (!supported) return undefined;
    let frame = 0;
    const paint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => paintRef.current?.());
    };
    const resize = new ResizeObserver(paint);
    const appearance = new MutationObserver(paint);
    resize.observe(canvasRef.current);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    paint();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); appearance.disconnect(); };
  }, [supported]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => paintRef.current?.());
    return () => cancelAnimationFrame(frame);
  }, [intent, confirmed, min, max, step]);

  const request = value => {
    const current = zoomRef.current;
    if (!current || current.disabled || disabled) return;
    const target = snapCameraZoom(value, current);
    if (target === intentRef.current || (intentRef.current === null && target === current.value)) return;
    if (!abortRef.current || abortRef.current.signal.aborted) abortRef.current = new AbortController();
    const requestId = ++requestRef.current;
    intentRef.current = target;
    setIntent(target);
    Promise.resolve().then(() => {
      if (requestId !== requestRef.current) return false;
      return current.setValue(target, { signal: abortRef.current.signal });
    }).then(success => {
      if (requestId !== requestRef.current) return;
      intentRef.current = null;
      setIntent(null);
      if (success !== true) cancel();
    }, () => { if (requestId === requestRef.current) cancel(); });
  };
  const movePointer = event => {
    const pointer = pointerRef.current;
    if (!pointer || event.pointerId !== pointer.id || disabled) return;
    event.preventDefault();
    event.stopPropagation();
    pointer.value = cameraZoomDragValue(pointer.value, event.clientY - pointer.y, zoomRef.current);
    pointer.y = event.clientY;
    request(pointer.value);
  };

  if (!supported) return null;
  const label = formatCameraZoom(confirmed, step);
  return <div ref={rootRef} className="trip-camera-zoom-dial" role="slider"
    tabIndex={disabled ? -1 : 0} aria-label={en ? "Camera zoom" : "相机变焦"}
    aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max}
    aria-valuenow={confirmed ?? undefined} aria-valuetext={confirmed === null ? en ? "Unknown zoom" : "变焦读数未知" : label}
    aria-disabled={disabled} aria-busy={intent !== null} data-pending={intent !== null}
    onPointerDown={event => {
      if (disabled || event.button !== 0 || event.isPrimary === false || pointerRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.focus({ preventScroll: true });
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { return; }
      pointerRef.current = { id: event.pointerId, y: event.clientY, value: intentRef.current ?? confirmed ?? min };
    }}
    onPointerMove={movePointer}
    onPointerUp={event => {
      if (pointerRef.current?.id !== event.pointerId) return;
      movePointer(event);
      releasePointer();
    }}
    onPointerCancel={event => { if (pointerRef.current?.id === event.pointerId) cancel(); }}
    onLostPointerCapture={event => { if (pointerRef.current?.id === event.pointerId) cancel(); }}
    onKeyDown={event => {
      if (disabled) return;
      if (event.key === "Escape" && (pointerRef.current || intentRef.current !== null)) {
        event.preventDefault(); event.stopPropagation(); cancel(); return;
      }
      const value = cameraZoomKeyValue(event.key, intentRef.current ?? confirmed ?? min, zoom);
      if (value === null) return;
      event.preventDefault();
      event.stopPropagation();
      request(value);
    }}>
    <canvas ref={canvasRef} className="trip-camera-zoom-dial-ticks" aria-hidden="true" />
    <CameraPencilLabel className="trip-camera-zoom-dial-value" textureKey="camera-zoom-dial-value" aria-hidden="true">
      <PencilText>{label}</PencilText>
    </CameraPencilLabel>
  </div>;
}
