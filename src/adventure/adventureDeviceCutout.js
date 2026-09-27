import { useEffect, useState } from "react";

// Android DisplayCutout measured on the unfolded 2608BPX34C: a 164 x 140
// exclusion at the natural-orientation top left of its 1672 x 2364 display.
export function resolveAdventureDeviceCutout({ platform, model, width, height, viewportWidth, viewportHeight, angle }) {
  if (platform !== "Android" || model !== "2608BPX34C") return null;
  const shortSide = Math.min(width, height), longSide = Math.max(width, height);
  if (!(shortSide > 0) || Math.abs(longSide / shortSide - 2364 / 1672) > 0.015) return null;
  // Do not apply inner-screen coordinates to a folded, split or letterboxed window.
  if (Math.abs(width - viewportWidth) > 3 || Math.abs(height - viewportHeight) > 3) return null;
  const corners = { 0: "top-left", 90: "bottom-left", 180: "bottom-right", 270: "top-right" };
  const corner = corners[angle];
  if (!corner || (width > height) !== (angle === 90 || angle === 270)) return null;
  const inset = Math.ceil((width > height ? 140 : 164) * shortSide / 1672);
  const blockInset = Math.ceil((width > height ? 164 : 140) * shortSide / 1672);
  return { corner, inset, blockInset };
}

export async function readAdventureDeviceModel(navigatorApi) {
  try {
    const hints = await navigatorApi?.userAgentData?.getHighEntropyValues?.(["model"]);
    return hints ? { platform: hints.platform, model: hints.model } : null;
  } catch {
    return null;
  }
}

export function useAdventureDeviceCutout() {
  const [cutout, setCutout] = useState(null);
  useEffect(() => {
    let device = null, disposed = false, frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        const next = device && resolveAdventureDeviceCutout({
          ...device, width: screen.width, height: screen.height,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: document.documentElement.clientHeight,
          angle: screen.orientation?.angle,
        });
        setCutout(current => current?.corner === next?.corner && current?.inset === next?.inset
          && current?.blockInset === next?.blockInset ? current : next);
      });
    };
    readAdventureDeviceModel(navigator).then(result => {
      if (disposed) return;
      device = result;
      update();
    });
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    window.addEventListener("resize", update);
    screen.orientation?.addEventListener?.("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      screen.orientation?.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return cutout;
}
