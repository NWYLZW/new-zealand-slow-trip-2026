import { useLayoutEffect, useState } from "react";
import { albumWindow } from "./albumLoading";

const emptyWindow = { start: 0, end: 0, visibleStart: 0, visibleEnd: 0 };

export function useAlbumWindow(scrollRef, gridRef, count, showingGrid) {
  const [range, setRange] = useState(emptyWindow);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const top = Math.max(0, rect.top);
      const bottom = Math.min(window.innerHeight, rect.bottom);
      const enabled = document.visibilityState !== "hidden" && rect.width > 0 && bottom > top
        && rect.right > 0 && rect.left < window.innerWidth
        && !root.closest('[inert],[hidden],[aria-hidden="true"]');
      setVisible(enabled);
      const grid = gridRef.current;
      let next = emptyWindow;
      if (enabled && showingGrid && grid?.firstElementChild) {
        const css = getComputedStyle(grid);
        const columns = css.gridTemplateColumns.split(" ").filter(Boolean).length;
        const gridRect = grid.getBoundingClientRect();
        next = albumWindow({ count, columns, rowHeight: grid.firstElementChild.getBoundingClientRect().height,
          gap: parseFloat(css.rowGap) || 0, top: top - gridRect.top, height: bottom - top });
      }
      setRange(current => Object.keys(next).every(key => next[key] === current[key]) ? current : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    if (gridRef.current) resize.observe(gridRef.current);
    const intersection = typeof IntersectionObserver === "function" ? new IntersectionObserver(schedule) : null;
    intersection?.observe(root);
    const ancestors = new MutationObserver(schedule);
    for (let node = root; node; node = node.parentElement) ancestors.observe(node,
      { attributes: true, attributeFilter: ["inert", "hidden", "aria-hidden", "class", "style"] });
    root.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection?.disconnect();
      ancestors.disconnect();
      root.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", measure);
    };
  }, [scrollRef, gridRef, count, showingGrid]);
  return { ...range, visible };
}
