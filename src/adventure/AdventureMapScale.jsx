import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PencilText } from "./pencil/PencilText";
import { PencilIcon } from "./pencil/PencilIcon";
import { pencilStroke } from "./pencil/stroke";
import "./AdventureMapScale.css";

export const AdventureMapScale = forwardRef(function AdventureMapScale({ hidden = false, language = "zh" }, ref) {
  const root = useRef(null);
  const bar = useRef(null);
  const [label, setLabel] = useState("100 km");
  const labelRef = useRef(label);
  const widthRef = useRef(80);
  const drawBar = useCallback(() => {
    const canvas = bar.current;
    const element = root.current;
    if (!canvas || !element) return;
    const width = widthRef.current;
    const dpr = Math.min(devicePixelRatio || 1, 3);
    canvas.width = Math.ceil((width + 4) * dpr);
    canvas.height = Math.ceil(12 * dpr);
    canvas.style.width = `${width + 4}px`;
    canvas.style.height = "12px";
    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);
    const ink = getComputedStyle(element).color;
    const options = { variation:.52, breaks:.18, grain:.45, gain:2.2, step:.4, taperLength:.5 };
    pencilStroke(context, [[2, 8], [width + 2, 8]], ink, 1.15, 4411, .16, 3, false, options);
    pencilStroke(context, [[2, 3], [2, 10]], ink, 1.05, 4423, .14, 2, false, options);
    pencilStroke(context, [[width + 2, 3], [width + 2, 10]], ink, 1.05, 4439, .14, 2, false, options);
  }, []);
  useEffect(() => {
    drawBar();
    const observer = new MutationObserver(drawBar);
    observer.observe(document.documentElement, {
      attributes:true,
      attributeFilter:["data-adventure-theme", "data-adventure-appearance"],
    });
    return () => observer.disconnect();
  }, [drawBar]);
  useImperativeHandle(ref, () => ({
    update({ width, right, bottom, text }) {
      const element = root.current;
      if (!element) return;
      const nextWidth = Math.max(1, width);
      element.style.setProperty("--trip-map-scale-width", `${nextWidth}px`);
      element.style.setProperty("--trip-map-orientation-right", `${Math.max(0, right)}px`);
      element.style.setProperty("--trip-map-orientation-bottom", `${Math.max(0, bottom)}px`);
      if (Math.abs(nextWidth - widthRef.current) >= .5) {
        widthRef.current = nextWidth;
        drawBar();
      }
      if (text !== labelRef.current) {
        labelRef.current = text;
        setLabel(text);
      }
    },
  }), []);
  return <aside ref={root} className="trip-map-orientation" hidden={hidden}
    aria-label={language === "en" ? `North and map scale: ${label}` : `北向与地图比例尺：${label}`}>
    <div className="trip-map-scale" aria-hidden="true">
      <span className="trip-map-scale-label"><PencilText>{label}</PencilText></span>
      <canvas ref={bar} className="trip-map-scale-bar" />
    </div>
    <div className="trip-map-compass" aria-hidden="true">
      <span className="trip-map-compass-letter"><PencilText>N</PencilText></span>
      <PencilIcon kind="map-north" sourceSize={32}>
        <path d="M16 4 9.5 24 16 20.5 22.5 24 16 4Z" />
        <path d="M16 7v13.5" />
      </PencilIcon>
    </div>
  </aside>;
});
