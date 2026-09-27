export const MAP_NODE_DOUBLE_TAP_MS = 420;
export const MAP_NODE_DOUBLE_TAP_DISTANCE = 36;

export function usesTouchNodeNavigation(view = globalThis) {
  const layout = view?.document?.querySelector?.("#trip-board-structure")
    ?.dataset?.responsiveLayout;
  if (layout === "phone-portrait" || layout === "phone-landscape" || layout === "tablet") return true;
  if (layout === "desktop") return false;
  const width = Number(view?.innerWidth);
  const height = Number(view?.innerHeight);
  const shortSide = Math.min(width, height);
  const touchPoints = Number(view?.navigator?.maxTouchPoints) || 0;
  const coarsePointer = Boolean(view?.matchMedia?.("(pointer: coarse), (any-pointer: coarse)")?.matches);
  return touchPoints > 0 && coarsePointer && Number.isFinite(shortSide) && shortSide <= 1024;
}

export function createMapNodeTapTracker({
  maximumDelay = MAP_NODE_DOUBLE_TAP_MS,
  maximumDistance = MAP_NODE_DOUBLE_TAP_DISTANCE,
  matchesTarget = (previous, current) => previous?.key === current?.key,
} = {}) {
  let pending = null;

  return {
    tap({ target = null, x, y, time }) {
      const point = { x: Number(x), y: Number(y), time: Number(time) };
      const previous = pending;
      const elapsed = previous ? point.time - previous.time : Infinity;
      const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : Infinity;
      if (previous && matchesTarget(previous.target, target)
        && elapsed >= 0 && elapsed <= maximumDelay && distance <= maximumDistance) {
        pending = null;
        return { action: "activate", target: previous.target };
      }
      pending = target && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.time)
        ? { ...point, target }
        : null;
      return target ? { action: "focus", target } : { action: "ignore", target: null };
    },
    reset() {
      pending = null;
    },
  };
}
