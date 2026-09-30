import { useEffect, useRef } from "react";
import { pencilStroke } from "./pencil/stroke";
import { drawPencilWash } from "./pencil/wash";

function ring(radius) {
  return Array.from({ length: 97 }, (_, index) => {
    const angle = index / 96 * Math.PI * 2;
    const edge = radius + Math.sin(angle * 5 + .4) * .16 + Math.sin(angle * 9) * .1;
    return [20 + Math.cos(angle) * edge, 20 + Math.sin(angle) * edge];
  });
}

export function CameraShutterIcon({ recording }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const paint = () => {
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 3);
      const theme = getComputedStyle(canvas).getPropertyValue("--trip-theme-accent").trim() || "#4b96aa";
      const center = recording ? "#d53937" : theme;
      canvas.width = canvas.height = Math.ceil(45 * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(canvas.width / 40, canvas.height / 40);
      const edge = ring(14.2);
      const options = { variation: .52, breaks: .12, grain: .5, gain: 2.6, step: .35 };
      pencilStroke(context, edge, "#fff", 3.8, 7001, .15, 3, true, options);
      pencilStroke(context, edge, theme, 1.35, 7002, .12, 3, true, options);
      const core = ring(7);
      context.save();
      context.beginPath();
      context.moveTo(...core[0]);
      core.slice(1).forEach(point => context.lineTo(...point));
      context.closePath();
      context.fillStyle = center;
      context.fill();
      context.clip();
      drawPencilWash(context, { x: 9, y: 9, width: 22, height: 22 }, "#fff", 7003,
        { strength: .13, spacing: 1, roughness: 1.1, inset: 2 });
      context.restore();
      pencilStroke(context, core, "#fff", 1.4, 7004, .12, 2, true, options);
      pencilStroke(context, core, center, .7, 7005, .12, 2, true, options);
    };
    const appearance = new MutationObserver(paint);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-theme", "data-adventure-appearance"] });
    paint();
    return () => appearance.disconnect();
  }, [recording]);
  return <canvas ref={ref} width="90" height="90" className="trip-pencil-icon trip-camera-shutter-icon"
    data-icon="shutter" data-recording={recording} aria-hidden="true" />;
}
