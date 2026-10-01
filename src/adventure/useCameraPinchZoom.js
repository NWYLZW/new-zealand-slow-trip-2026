import { useLayoutEffect, useRef } from "react";
import { createCameraPinchZoom, supportsCameraPinchZoom } from "./cameraPinchZoom.js";

export function useCameraPinchZoom(zoom, active) {
  const zoomRef = useRef(null);
  zoomRef.current = active ? zoom : null;
  const controllerRef = useRef(null);
  if (!controllerRef.current) controllerRef.current = createCameraPinchZoom(() => zoomRef.current);
  const controller = controllerRef.current;
  useLayoutEffect(() => {
    controller.cancel();
    const hidden = () => { if (document.hidden) controller.cancel(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", controller.cancel);
    return () => {
      controller.cancel();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", controller.cancel);
    };
  }, [controller, active, zoom?.disabled, zoom?.min, zoom?.max, zoom?.step, zoom?.setValue]);
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture } = controller;
  const handlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture };
  return { enabled: active && supportsCameraPinchZoom(zoom), handlers };
}
