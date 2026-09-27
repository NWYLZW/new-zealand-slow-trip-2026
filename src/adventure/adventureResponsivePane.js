import { useEffect, useRef, useState } from "react";
import { transitionAdventurePane } from "./adventurePaneTransition.js";

const PHONE_MAX_SHORT_SIDE = 480;
const PHONE_MIN_ASPECT = 1.3;

export function classifyAdventureViewport({ width, height }) {
  const inline = Math.max(1, Math.round(width));
  const block = Math.max(1, Math.round(height));
  const shortSide = Math.min(inline, block);
  const longSide = Math.max(inline, block);
  if (shortSide <= PHONE_MAX_SHORT_SIDE && longSide / shortSide >= PHONE_MIN_ASPECT) {
    return block > inline ? "phone-portrait" : "phone-landscape";
  }
  if (shortSide <= 600 && longSide <= 920) return "compact";
  if (shortSide <= 820 && longSide <= 1180) return "tablet";
  return "desktop";
}

export function responsiveFullscreenPane(view, layout) {
  const cameraPanel = view.rightPanel === "camera";
  if (layout === "phone-landscape") {
    if (cameraPanel && (!view.calendarOpen || view.front !== "tasks")) return "right";
    return view.calendarOpen && (!view.rightPanel || view.front === "tasks") ? "calendar" : null;
  }
  if (layout !== "phone-portrait") return null;
  if (view.calendarOpen && view.rightPanel) return view.front === "tasks" ? "calendar" : "right";
  if (view.rightPanel) return "right";
  return view.calendarOpen ? "calendar" : null;
}

function readLayout() {
  const root = document.documentElement;
  return classifyAdventureViewport({
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight,
  });
}

export function useAdventureResponsiveLayout(view) {
  const [layout, setLayout] = useState(readLayout);
  const layoutRef = useRef(layout);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextLayout = readLayout();
        const previousLayout = layoutRef.current;
        if (nextLayout === previousLayout) return;
        const currentView = viewRef.current;
        const previousFullscreen = currentView.fullscreen ?? responsiveFullscreenPane(currentView, previousLayout);
        const nextFullscreen = currentView.fullscreen ?? responsiveFullscreenPane(currentView, nextLayout);
        const commit = () => {
          layoutRef.current = nextLayout;
          setLayout(nextLayout);
        };
        transitionAdventurePane(
          { ...currentView, fullscreen: previousFullscreen },
          { ...currentView, fullscreen: nextFullscreen },
          commit,
        );
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return layout;
}
