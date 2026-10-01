import { useLayoutEffect, useRef } from "react";
import { pencilStroke } from "./pencil/stroke";
import { observeCanvasRecovery, registerCanvasCache } from "./pencil/canvasRecovery";

const backdropCache = new Map();
registerCanvasCache(backdropCache);

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function paintBackdrop(canvas, width, height, color, textureKey) {
  const dpr = Math.min(devicePixelRatio || 1, 3);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  const key = JSON.stringify([pixelWidth, pixelHeight, color, textureKey]);
  const cached = backdropCache.get(key);
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  if (cached) {
    canvas.getContext("2d").drawImage(cached, 0, 0);
    return;
  }
  const context = canvas.getContext("2d");
  context.scale(dpr, dpr);
  context.globalAlpha = .9;
  const seed = stableHash(`${textureKey}:${pixelWidth}:${pixelHeight}`);
  const random = seededRandom(seed);
  const left = 2.5, right = Math.max(left + 1, width - 2.5);
  const lineCount = Math.max(6, Math.ceil(height / 3.2));
  for (let index = 0; index < lineCount; index++) {
    const y = height * (index + .7) / (lineCount + .4) + (random() - .5) * 1.8;
    const slope = (random() - .5) * Math.min(8, height * .3);
    const first = width * (.28 + random() * .1);
    const second = width * (.62 + random() * .12);
    pencilStroke(context, [[left + random() * 3, y - slope * .5], [first, y + (random() - .5) * 2],
      [second, y + (random() - .5) * 2], [right - random() * 3, y + slope * .5]],
    color, 1.25 + random() * .55, seed + index * 19, .3, 2, false,
    { variation: .88, breaks: .08, grain: .72, gain: 2.5, step: .34, taperLength: .9 });
  }
  const crossCount = Math.max(2, Math.ceil(width / 90));
  for (let index = 0; index < crossCount; index++) {
    const x = width * (index + 1) / (crossCount + 1) + (random() - .5) * 8;
    const lean = (random() - .5) * Math.min(14, width * .08);
    pencilStroke(context, [[x - lean, 3], [x + (random() - .5) * 3, height * .52], [x + lean, height - 3]],
      color, 1.05 + random() * .4, seed + 307 + index * 29, .28, 1, false,
      { variation: .9, breaks: .14, grain: .75, gain: 2.2, step: .36, taperLength: .95 });
  }
  const bitmap = document.createElement("canvas");
  bitmap.width = pixelWidth;
  bitmap.height = pixelHeight;
  bitmap.getContext("2d").drawImage(canvas, 0, 0);
  backdropCache.set(key, bitmap);
  if (backdropCache.size > 96) backdropCache.delete(backdropCache.keys().next().value);
}

export function CameraPencilLabel({ as: Tag = "span", className = "", textureKey = "camera-label", children, ...props }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;
    const paint = () => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const style = getComputedStyle(root);
      const color = style.getPropertyValue("--trip-theme-accent").trim() || "#4b96aa";
      paintBackdrop(canvas, rect.width, rect.height, color, textureKey);
    };
    const resize = new ResizeObserver(paint);
    const appearance = new MutationObserver(paint);
    resize.observe(root);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    const stopRecovery = observeCanvasRecovery(paint);
    paint();
    return () => {
      stopRecovery();
      resize.disconnect();
      appearance.disconnect();
    };
  }, [textureKey]);
  return <Tag ref={rootRef} className={`trip-camera-pencil-label ${className}`.trim()} {...props}>
    <canvas ref={canvasRef} className="trip-camera-pencil-label-backdrop" data-theme-backdrop="true" aria-hidden="true" />
    <span className="trip-camera-pencil-label-content">{children}</span>
  </Tag>;
}
