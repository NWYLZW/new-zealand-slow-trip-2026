import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { weatherLocationForDay } from "./weatherLocations";
import { weatherClient, weatherRequest } from "./weatherClient.js";
import { weatherRequestIdentity } from "./weatherData.js";

function useWeatherVisibility(active) {
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
  return { ref, visible, clock };
}

export function useWeather(dateId, placeTag = null, active = true, explicitLocation = null) {
  const { ref, visible, clock } = useWeatherVisibility(active);
  const location = useMemo(() => explicitLocation ?? weatherLocationForDay(dateId, placeTag), [dateId, placeTag, explicitLocation]);
  const request = useMemo(() => weatherRequest(dateId, location, clock), [dateId, location, clock]);
  const requestKey = weatherRequestIdentity(request);
  const subscribe = useCallback(listener => visible ? weatherClient.subscribe(request, listener) : () => {}, [requestKey, visible]);
  const snapshot = useCallback(() => weatherClient.snapshot(request), [requestKey]);
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { ref, location, request, ...state, retry: () => weatherClient.retry(request) };
}

export function useSegmentWeather(dateId, segments, active) {
  const { ref, visible, clock } = useWeatherVisibility(active);
  const requests = useMemo(() => segments.map(segment => weatherRequest(dateId, segment.location, clock)), [dateId, segments, clock]);
  // Clock ticks and equivalent segment objects must not tear down in-flight subscriptions.
  const requestKey = JSON.stringify(requests.map(weatherRequestIdentity));
  const previous = useRef([]);
  const subscribe = useCallback(listener => {
    const cleanups = visible ? requests.map(request => weatherClient.subscribe(request, listener)) : [];
    return () => cleanups.forEach(cleanup => cleanup());
  }, [requestKey, visible]);
  const snapshot = useCallback(() => {
    const states = requests.map(request => weatherClient.snapshot(request));
    if (states.length !== previous.current.length || states.some((state, index) => state !== previous.current[index])) previous.current = states;
    return previous.current;
  }, [requestKey]);
  const states = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { ref, requests, states, retry: index => weatherClient.retry(requests[index]) };
}
