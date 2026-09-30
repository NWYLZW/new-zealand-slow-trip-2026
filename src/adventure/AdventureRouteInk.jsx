import { useLayoutEffect, useRef } from "react";
import { pencilStroke } from "./pencil/stroke";
import { drawPencilWash } from "./pencil/wash";

// The diagram follows the native list rows, so names can wrap without moving the ink off a stop.
export function AdventureRouteInk({ mode, color, count }) {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current, list = canvas.parentElement;
    const paint = () => {
      const bounds = list.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(bounds.width * ratio);
      canvas.height = Math.ceil(bounds.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      const points = [...list.querySelectorAll("[data-route-node]")].map(node => {
        const rect = node.getBoundingClientRect();
        return [rect.left - bounds.left + rect.width / 2, rect.top - bounds.top + rect.height / 2];
      });
      if (points.length < 2) return;
      const ink = color ?? (mode === "flight" ? "#527e91" : mode === "coach" ? "#8a714b" : "#638368");
      for (let index = 1; index < points.length; index++) {
        const [x1, y1] = points[index - 1], [x2, y2] = points[index];
        if (mode === "flight") {
          const length = Math.hypot(x2 - x1, y2 - y1);
          for (let from = 11; from < length - 10; from += 12) {
            const to = Math.min(from + 7, length - 10);
            pencilStroke(ctx, [[x1 + (x2 - x1) * from / length, y1 + (y2 - y1) * from / length],
              [x1 + (x2 - x1) * to / length, y1 + (y2 - y1) * to / length]],
              ink, 1.25, 1471 + index * 31 + from, .35, 2, false);
          }
        } else {
          pencilStroke(ctx, [[x1, y1], [x1 + 1.4, (y1 + y2) / 2], [x2, y2]],
            ink, 1.35, 1471 + index * 31, .35, 3, false);
        }
      }
      points.forEach(([x, y], index) => {
        const radius = index === 0 || index === points.length - 1 ? 9 : 7;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
        ctx.clip();
        drawPencilWash(ctx, { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 },
          ink, 2220 + index, { strength: .6, spacing: 1.5, inset: 2, radius });
        ctx.restore();
        const ring = Array.from({ length: 25 }, (_, step) => {
          const angle = step / 24 * Math.PI * 2;
          return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
        });
        pencilStroke(ctx, ring, ink, 1.2, 2410 + index, .3, 2, true);
      });
    };
    const resize = new ResizeObserver(paint);
    resize.observe(list);
    paint();
    return () => resize.disconnect();
  }, [mode, color, count]);
  return <canvas ref={canvasRef} className="trip-route-diagram-ink" aria-hidden="true" />;
}
