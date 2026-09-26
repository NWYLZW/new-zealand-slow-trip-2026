import { useLayoutEffect, useRef } from "react";
import { pencilStroke } from "./stroke";

export function PanelDivider() {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current, parent = canvas.parentElement;
    const paint = () => {
      const width = parent.clientWidth, ratio = Math.min(devicePixelRatio || 1, 2);
      if (!width) return;
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(8 * ratio);
      const context = canvas.getContext("2d");
      context.scale(ratio, ratio);
      const ink = getComputedStyle(parent).getPropertyValue("--trip-ink-muted").trim() || "#627b67";
      pencilStroke(context, [[1, 4], [width / 3, 4.4], [width * .7, 3.7], [width - 1, 4.1]],
        ink, 1, 1739, .35, 2, false,
        { variation: .82, breaks: .22, grain: .7, gain: 2.3, step: .7 });
    };
    const resize = new ResizeObserver(paint);
    resize.observe(parent);
    const appearance = new MutationObserver(paint);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    paint();
    return () => { resize.disconnect(); appearance.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="trip-panel-divider-ink" aria-hidden="true" />;
}
