import { flushSync } from "react-dom";

let active = null;
let revision = 0;

export function cancelAdventurePaneTransition() {
  revision++;
  active?.skipTransition();
}

export function transitionAdventurePane(previous, next, commit) {
  const request = ++revision;
  if (active) {
    active.skipTransition();
    // New navigation wins even if the previous snapshot is still being prepared.
    flushSync(commit);
    return;
  }
  const pane = next.fullscreen || previous.fullscreen;
  const node = document.getElementById(pane === "right" ? "trip-right-panel" : "trip-calendar-region");
  const open = pane === "right" ? previous.rightPanel && next.rightPanel : previous.calendarOpen && next.calendarOpen;
  if (previous.fullscreen === next.fullscreen || !open || !node || !document.startViewTransition
    || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    return;
  }
  const root = document.documentElement;
  const before = node.getBoundingClientRect();
  root.dataset.tripPaneTransition = "true";
  node.style.viewTransitionName = "trip-pane";
  const transition = document.startViewTransition(() => {
    if (request !== revision) return;
    flushSync(commit);
    const after = node.getBoundingClientRect();
    root.style.setProperty("--trip-pane-from", `translate(${before.x}px, ${before.y}px) scale(${before.width / after.width}, ${before.height / after.height})`);
    root.style.setProperty("--trip-pane-to", `translate(${after.x}px, ${after.y}px)`);
    root.style.setProperty("--trip-pane-width", `${after.width}px`);
    root.style.setProperty("--trip-pane-height", `${after.height}px`);
  });
  active = transition;
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (active !== transition) return;
    active = null;
    node.style.removeProperty("view-transition-name");
    delete root.dataset.tripPaneTransition;
    for (const name of ["from", "to", "width", "height"]) root.style.removeProperty(`--trip-pane-${name}`);
  }).catch(() => {});
}
