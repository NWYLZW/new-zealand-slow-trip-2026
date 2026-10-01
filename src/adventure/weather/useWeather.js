import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { weatherLocationForDay } from "./weatherLocations";
import { weatherClient, weatherRequest } from "./weatherClient.js";

export function useWeather(dateId, placeTag = null, active = true) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const node = ref.current;
    let intersecting = false;
    const update = () => setVisible(active && intersecting && document.visibilityState !== "hidden"
      && !node.closest('[inert],[aria-hidden="true"]'));
    const intersection = new IntersectionObserver(entries => { intersecting = entries.at(-1).isIntersecting; update(); });
    intersection.observe(node);
    const appearance = new MutationObserver(update);
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      appearance.observe(ancestor, { attributes: true, attributeFilter: ["inert", "aria-hidden"] });
    }
    document.addEventListener("visibilitychange", update);
    update();
    return () => { intersection.disconnect(); appearance.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [active]);
  useEffect(() => {
    if (!visible) return;
    setClock(Date.now());
    const interval = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [visible]);
  const location = useMemo(() => weatherLocationForDay(dateId, placeTag), [dateId, placeTag]);
  const request = useMemo(() => weatherRequest(dateId, location, clock), [dateId, location, clock]);
  const subscribe = useCallback(listener => visible ? weatherClient.subscribe(request, listener) : () => {}, [request.key, request.unavailable, visible]);
  const snapshot = useCallback(() => weatherClient.snapshot(request), [request.key, request.unavailable]);
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { ref, location, request, ...state, retry: () => weatherClient.retry(request) };
}
