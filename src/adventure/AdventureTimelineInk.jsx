import { useLayoutEffect, useRef } from "react";
import { pencilStroke } from "./pencil/stroke";

export function AdventureTimelineInk({ positions, laneSelector, vertical = false, className = "" }) {
  const canvasRef = useRef(null);
  const key = positions.join("|");
  useLayoutEffect(() => {
    const canvas = canvasRef.current, parent = canvas.parentElement;
    const paint = () => {
      const width = parent.clientWidth, height = parent.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const lane = parent.querySelector(laneSelector);
      const left = lane?.offsetLeft ?? 52;
      const right = lane ? Math.min(width, left + lane.clientWidth) : width;
      if (vertical) pencilStroke(context, [[left, 1], [left + .3, height - 1]], "#779b83", .9, 1709, .25, 3, false,
        { variation: .76, breaks: .18, grain: .64, gain: 1.8, step: .75 });
      positions.forEach((position, index) => {
        const y = Math.min(height - 1, Math.max(1, position * height));
        pencilStroke(context, [[left, y], [right, y + Math.sin(index * 1.8) * .4]],
          "#8fa395", .55, 1901 + index * 37, .25, 2, false,
          { variation: .72, breaks: .3, grain: .6, gain: 1.3, step: .9 });
      });
    };
    const resize = new ResizeObserver(paint);
    resize.observe(parent);
    paint();
    return () => resize.disconnect();
  }, [key, laneSelector, vertical]);
  return <canvas ref={canvasRef} className={`trip-day-timeline-grid-ink ${className}`.trim()} aria-hidden="true" />;
}
