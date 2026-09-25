import { useCallback, useEffect, useState } from "react";
import { adventureStops } from "./adventureData";
import { adventureRoutes } from "./adventureRoutes";

const panels = new Set(["tasks", "bag", "photos"]);
function readLocation() {
  const params = new URLSearchParams(window.location.search);
  const route = params.get("route");
  if (adventureRoutes.some((item) => item.id === route)) return { panel: "route", place: null, route };
  const place = params.get("place");
  if (adventureStops.some((stop) => stop.tag === place)) return { panel: "place", place, route: null };
  const panel = params.get("panel");
  return { panel: panels.has(panel) ? panel : null, place: null, route: null };
}
export function useAdventureNavigation() {
  const [view, setView] = useState(readLocation);
  useEffect(() => {
    const sync = () => setView(readLocation());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const navigate = useCallback((panel = null, id = null) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("panel");
    url.searchParams.delete("place");
    url.searchParams.delete("route");
    const place = panel === "place" ? id : null;
    const route = panel === "route" ? id : null;
    if (route) url.searchParams.set("route", route);
    else if (place) url.searchParams.set("place", place);
    else if (panel) url.searchParams.set("panel", panel);
    if (url.href !== window.location.href) history.pushState(null, "", url);
    setView({ panel, place, route });
  }, []);
  return [view, navigate];
}
