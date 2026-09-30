import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { usePrivateVault } from "../PrivateVaultContext";
import { useAdventurePreferences } from "./AdventurePreferences";
import { adventureRoutes } from "./adventureRoutes";
import { resolveHotelRouteEndpoints } from "./adventureHotelRoutes";
import { loadTownMapData } from "./townMapData";

const RoutesContext = createContext(adventureRoutes);

export function AdventureResolvedRoutes({ children }) {
  const { data, isUnlocked } = usePrivateVault();
  const { language } = useAdventurePreferences();
  const endpoints = useMemo(() => resolveHotelRouteEndpoints(adventureRoutes, { data, isUnlocked, language }),
    [data, isUnlocked, language]);
  const [resolved, setResolved] = useState(null);
  useLayoutEffect(() => {
    let cancelled = false;
    setResolved(null);
    if (!isUnlocked) return undefined;
    const tags = [...new Set(endpoints.flatMap(route => Object.values(route.hotelEndpoints ?? {})
      .filter(Boolean).map(endpoint => endpoint.cityTag)))];
    if (!tags.length) return undefined;
    Promise.all([import("./hotelRoadConnection.js"),
      Promise.all(tags.map(async tag => [tag, await loadTownMapData(tag).catch(() => null)]))])
      .then(([{ connectHotelRoute }, entries]) => {
        if (cancelled) return;
        const towns = new Map(entries);
        setResolved({ endpoints, routes: endpoints.map(route => connectHotelRoute(route, towns)) });
      }).catch(() => {
        if (!cancelled) setResolved({ endpoints, routes: endpoints.map(route => route.hotelEndpoints
          ? { ...route, hotelRoadStatus: "partial" } : route) });
      });
    return () => { cancelled = true; };
  }, [endpoints, isUnlocked]);
  // Never render an old unlocked result, even for a frame while effects clean up.
  const routes = isUnlocked && resolved?.endpoints === endpoints ? resolved.routes : endpoints;
  return <RoutesContext.Provider value={routes}>{children}</RoutesContext.Provider>;
}

export const useAdventureRoutes = () => useContext(RoutesContext);
