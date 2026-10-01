import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { CameraPencilLabel } from "./CameraPencilLabel";
import { PencilText } from "./pencil/PencilText";
import { pencilStroke } from "./pencil/stroke";
import { observeCanvasRecovery, registerCanvasCache } from "./pencil/canvasRecovery";
import { CAMERA_ZOOM_INTERACTION_SCALE, cameraZoomDragValue, cameraZoomInteractionScale, cameraZoomKeyValue, cameraZoomPresetRect, cameraZoomSupportsValue, cameraZoomTicks, formatCameraZoom, snapCameraZoom } from "./cameraZoomDial.js";
import "./CameraZoomDial.css";

const textureCache = new Map();
registerCanvasCache(textureCache);

function dialTextures(width, height, dpr, color) {
  const key = JSON.stringify([width, height, dpr, color]);
  const cached = textureCache.get(key);
  if (cached && [cached.arc, ...cached.ticks].every(canvas => {
    const context = canvas.getContext("2d");
    return context && !context.isContextLost?.();
  })) return cached;
  textureCache.delete(key);
  const bitmap = (w, h, paint) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    const context = canvas.getContext("2d");
    if (!context || context.isContextLost?.()) return null;
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
  if (!arc || ticks.some(tick => !tick)) return null;
  textureCache.set(key, textures);
  if (textureCache.size > 16) textureCache.delete(textureCache.keys().next().value);
  return textures;
}

function paintDial(canvas, value, range) {
  // Layout dimensions stay fixed while the visual layer scales during interaction.
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  // Rasterize once for the largest visual scale, not once per animation frame.
  const dpr = Math.min(window.devicePixelRatio || 1, 3) * CAMERA_ZOOM_INTERACTION_SCALE;
  const color = getComputedStyle(canvas).getPropertyValue("--trip-theme-accent").trim() || "#4b96aa";
  const textures = dialTextures(width, height, dpr, color);
  const context = canvas.getContext("2d");
  if (!textures || !context || context.isContextLost?.()) return;
  const { arc, ticks } = textures;
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  context.scale(dpr, dpr);
  context.drawImage(arc, 0, 0, width, height);
  for (const { index, angle } of cameraZoomTicks(value, range)) {
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
  const keysRef = useRef(new Set()), fitRef = useRef(null), presetRef = useRef(null);
  const zoomRef = useRef(zoom), intentRef = useRef(null), requestRef = useRef(0), abortRef = useRef(null);
  const [intent, setIntent] = useState(null);
  const [interacting, setInteracting] = useState(false);
  zoomRef.current = zoom;
  const min = zoom?.min, max = zoom?.max, step = zoom?.step;
  const supported = [min, max, step].every(Number.isFinite) && max > min && step > 0;
  const disabled = !supported || zoom?.disabled || typeof zoom?.setValue !== "function";
  const confirmed = Number.isFinite(zoom?.value) ? zoom.value : null;

  const releasePointer = useCallback((updateState = true) => {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (updateState) setInteracting(keysRef.current.size > 0);
    if (pointer) {
      try { rootRef.current?.releasePointerCapture(pointer.id); } catch { /* Capture may already be lost. */ }
    }
  }, []);
  const cancel = useCallback(() => {
    requestRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    intentRef.current = null;
    keysRef.current.clear();
    releasePointer();
    setIntent(null);
  }, [releasePointer]);

  useLayoutEffect(() => {
    // setValue is stable across readbacks and changes with the track/availability.
    cancel();
    const onHidden = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", cancel);
    window.addEventListener("pagehide", cancel);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pagehide", cancel);
      requestRef.current++;
      abortRef.current?.abort();
      abortRef.current = null;
      intentRef.current = null;
      keysRef.current.clear();
      releasePointer(false);
    };
  }, [cancel, disabled, min, max, step, releasePointer, zoom?.setValue]);

  const wideAvailable = supported && cameraZoomSupportsValue(.7, { min, max, step });
  fitRef.current = () => {
    const control = rootRef.current, canvas = canvasRef.current;
    const preview = control?.closest(".trip-camera");
    if (!preview || !canvas) return;
    const box = control.getBoundingClientRect();
    const originY = parseFloat(getComputedStyle(canvas.parentElement).transformOrigin.split(" ")[1]);
    const boundary = preview.getBoundingClientRect(), anchorBottom = originY > box.height * .75;
    const obstacles = [...preview.querySelectorAll("button, .trip-camera-status > .trip-camera-pencil-label, .trip-camera-recording")]
      .filter(node => node !== presetRef.current).map(node => node.getBoundingClientRect())
      .filter(rect => rect.width && rect.height);
    const preset = presetRef.current;
    if (preset) {
      const rect = cameraZoomPresetRect(box, boundary, obstacles, anchorBottom);
      preset.hidden = !rect;
      if (rect) {
        Object.assign(preset.style, { left: `${rect.left - box.left}px`, top: `${rect.top - box.top}px`, right: "auto", bottom: "auto" });
        obstacles.push(rect);
      }
    }
    const scale = cameraZoomInteractionScale(box, boundary, obstacles, anchorBottom);
    control.style.setProperty("--trip-camera-zoom-interaction-scale", String(scale));
  };

  const paintRef = useRef(null);
  paintRef.current = () => {
    if (canvasRef.current && supported) paintDial(canvasRef.current, intent ?? confirmed ?? min, { min, max, step });
  };
  useLayoutEffect(() => {
    if (!supported) return undefined;
    let frame = 0;
    const paint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { fitRef.current?.(); paintRef.current?.(); });
    };
    const resize = new ResizeObserver(paint);
    const appearance = new MutationObserver(paint);
    resize.observe(canvasRef.current);
    const preview = rootRef.current.closest(".trip-camera");
    if (preview) resize.observe(preview);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    const board = rootRef.current.closest("#trip-board-structure");
    if (board) appearance.observe(board, { attributes: true, attributeFilter: ["data-responsive-layout"] });
    const status = preview?.querySelector(".trip-camera-status");
    if (status) {
      resize.observe(status);
      appearance.observe(status, { childList: true, subtree: true, characterData: true });
    }
    const stopRecovery = observeCanvasRecovery(paint);
    window.addEventListener("resize", paint);
    paint();
    return () => {
      stopRecovery();
      window.removeEventListener("resize", paint);
      cancelAnimationFrame(frame); resize.disconnect(); appearance.disconnect();
    };
  }, [supported, wideAvailable]);
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
    const signal = abortRef.current.signal;
    const requestId = ++requestRef.current;
    intentRef.current = target;
    setIntent(target);
    Promise.resolve().then(() => {
      if (requestId !== requestRef.current) return false;
      return current.setValue(target, { signal });
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
  return <div className="trip-camera-zoom-dial" data-interacting={interacting}
    data-pending={intent !== null} aria-disabled={disabled}
    onBlur={cancel}
    onKeyDown={event => {
      if (event.key !== "Escape" || (!pointerRef.current && !keysRef.current.size && intentRef.current === null)) return;
      event.preventDefault(); event.stopPropagation(); cancel();
    }}>
    <div ref={rootRef} className="trip-camera-zoom-dial-control" role="slider"
    tabIndex={disabled ? -1 : 0} aria-label={en ? "Camera zoom" : "相机变焦"}
    aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max}
    aria-valuenow={confirmed ?? undefined} aria-valuetext={confirmed === null ? en ? "Unknown zoom" : "变焦读数未知" : label}
    aria-disabled={disabled} aria-busy={intent !== null} data-pending={intent !== null}
    onPointerDown={event => {
      if (pointerRef.current) {
        if (pointerRef.current.id !== event.pointerId) cancel();
        return;
      }
      if (disabled || event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.focus({ preventScroll: true });
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { return; }
      pointerRef.current = { id: event.pointerId, y: event.clientY, value: intentRef.current ?? confirmed ?? min };
      fitRef.current?.();
      setInteracting(true);
    }}
    onPointerMove={movePointer}
    onPointerUp={event => {
      if (pointerRef.current?.id !== event.pointerId) return;
      movePointer(event);
      releasePointer();
    }}
    onPointerCancel={event => { if (pointerRef.current?.id === event.pointerId) cancel(); }}
    onLostPointerCapture={event => { if (pointerRef.current?.id === event.pointerId) cancel(); }}
    onKeyUp={event => {
      if (!keysRef.current.delete(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      setInteracting(Boolean(pointerRef.current) || keysRef.current.size > 0);
    }}
    onKeyDown={event => {
      if (disabled) return;
      const value = cameraZoomKeyValue(event.key, intentRef.current ?? confirmed ?? min, zoom);
      if (value === null) return;
      event.preventDefault();
      event.stopPropagation();
      if (!keysRef.current.size && !pointerRef.current) fitRef.current?.();
      keysRef.current.add(event.key);
      setInteracting(true);
      request(value);
    }}>
    <div className="trip-camera-zoom-dial-visual">
    <canvas ref={canvasRef} className="trip-camera-zoom-dial-ticks" aria-hidden="true" />
    </div>
    <CameraPencilLabel className="trip-camera-zoom-dial-value" textureKey="camera-zoom-dial-value" aria-hidden="true">
      <PencilText>{label}</PencilText>
    </CameraPencilLabel>
    </div>
    {wideAvailable && <button ref={presetRef} type="button" className="trip-camera-zoom-preset" disabled={disabled}
      aria-label={en ? "Set camera zoom to 0.7×" : "切换至 0.7 倍变焦"}
      aria-pressed={confirmed !== null && Math.abs(confirmed - .7) < 1e-8}
      onClick={() => request(.7)}>
      <CameraPencilLabel textureKey="camera-zoom-preset"><PencilText>0.7×</PencilText></CameraPencilLabel>
    </button>}
  </div>;
}
