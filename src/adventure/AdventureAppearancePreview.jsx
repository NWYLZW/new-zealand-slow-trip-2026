import { useLayoutEffect, useRef } from "react";
import { calendarPaper } from "./pencil/paper";
import { pencilStroke } from "./pencil/stroke";
import { drawPencilWash } from "./pencil/wash";

const width = 200, height = 118;
const previewCache = new Map();

function drawPreview(ctx, dark, colors) {
  const ink = dark ? "#e5e2cf" : "#355448";
  const paper = dark ? "#1b1b17" : colors.paper;
  const accent = dark ? colors.darkAccent : colors.accent;
  ctx.fillStyle = ctx.createPattern(calendarPaper(paper, { dark }).canvas, "repeat");
  ctx.fillRect(0, 0, width, height);
  const stroke = (points, seed, color = ink, weight = .85) =>
    pencilStroke(ctx, points, color, weight, seed, .35, 2, false,
      { variation: .8, breaks: .2, grain: .65, gain: 2.5, step: .8 });

  // All appearance choices share this miniature map, calendar and detail layout.
  drawPencilWash(ctx, { x: 1, y: 1, width: 121, height: 70 }, dark ? "#46717a" : colors.map, 135,
    { strength: .75, spacing: 1.7, roughness: 1 });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(12, 66);
  for (const point of [[20, 38], [48, 25], [73, 7], [89, 15], [80, 36], [49, 48], [28, 67]]) ctx.lineTo(...point);
  ctx.closePath();
  ctx.clip();
  drawPencilWash(ctx, { x: 5, y: 0, width: 96, height: 72 }, dark ? "#87946b" : "#afbf82", 271,
    { strength: .8, spacing: 1.4, roughness: 1 });
  ctx.restore();
  stroke([[27, 58], [42, 42], [61, 33], [77, 17]], 352, dark ? "#e1a88b" : "#945444", 1.3);
  for (const [x, y] of [[27, 58], [61, 33], [77, 17]]) {
    stroke([[x - 2, y], [x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], x + y);
  }
  stroke([[124, 1], [124, 117]], 415);
  stroke([[1, 73], [123, 73]], 416);
  stroke([[4, 80], [31, 80]], 418, accent, 2);
  for (let day = 0; day < 7; day++) {
    const x = 3 + day * 17;
    drawPencilWash(ctx, { x, y: 86, width: 15, height: 29 }, accent, 471 + day,
      { strength: day === 2 ? .65 : .2, spacing: 1.5, roughness: .4 });
    stroke([[x + 4, 90], [x + 10, 90]], 513 + day);
    stroke([[x + 3, 97], [x + 12, 97]], 613 + day, accent);
  }
  stroke([[133, 10], [158, 10]], 717, ink, 1.4);
  stroke([[188, 7], [193, 12]], 719);
  stroke([[193, 7], [188, 12]], 721);
  stroke([[130, 19], [195, 19]], 723);
  drawPencilWash(ctx, { x: 130, y: 24, width: 66, height: 39 }, accent, 817,
    { strength: .48, spacing: 1.4, roughness: 1 });
  for (let row = 0; row < 4; row++) {
    const y = 74 + row * 10;
    stroke([[132, y], [row === 3 ? 164 : 188, y]], 911 + row);
  }
}

function previewBitmap(dark, colors, ratio) {
  const key = JSON.stringify([dark, colors, ratio]);
  if (previewCache.has(key)) return previewCache.get(key);
  const layer = document.createElement("canvas");
  layer.width = width * ratio;
  layer.height = height * ratio;
  const ctx = layer.getContext("2d");
  ctx.scale(ratio, ratio);
  drawPreview(ctx, dark, colors);
  previewCache.set(key, layer);
  if (previewCache.size > 6) previewCache.delete(previewCache.keys().next().value);
  return layer;
}

export function AdventureAppearancePreview({ appearance, theme }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const paint = () => {
      const css = getComputedStyle(canvas);
      const colors = {
        paper: css.getPropertyValue("--trip-preview-paper").trim(),
        map: css.getPropertyValue("--trip-preview-map").trim(),
        accent: css.getPropertyValue("--trip-theme-accent").trim(),
        darkAccent: css.getPropertyValue("--trip-theme-accent-dark").trim(),
      };
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      if (appearance !== "system") ctx.drawImage(previewBitmap(appearance === "dark", colors, ratio), 0, 0, width, height);
      else for (const dark of [false, true]) {
        const layer = previewBitmap(dark, colors, ratio);
        const x = dark ? width / 2 : 0;
        ctx.drawImage(layer, x * ratio, 0, width / 2 * ratio, height * ratio, x, 0, width / 2, height);
      }
    };
    const observer = new MutationObserver(paint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-adventure-theme"] });
    paint();
    return () => observer.disconnect();
  }, [appearance, theme]);
  return <canvas ref={ref} className="trip-adventure-appearance-preview"
    data-appearance-preview={appearance} width={width} height={height} aria-hidden="true" />;
}
