import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivateVault } from "../../PrivateVaultContext";
import { useAdventureRoutes } from "../AdventureResolvedRoutes.jsx";
import { buildNearbyData } from "./nearbyData.js";
import { nearbyContext, nearbyRefreshDelay } from "./nearbyModel.js";
import { createNearbyLocation } from "./nearbyLocation.js";

const initialLocation = { enabled: false, status: "off", location: null };

export function useNearbyContext(active, language) {
  const vault = usePrivateVault();
  const routes = useAdventureRoutes();
  const [now, setNow] = useState(Date.now);
  const [location, setLocation] = useState(initialLocation);
  const controller = useRef(null);
  const enabled = useRef(false);
  const dataset = useMemo(() => buildNearbyData({ language, isUnlocked: vault.isUnlocked, data: vault.data }),
    [language, vault.isUnlocked, vault.data]);
  useEffect(() => {
    const instance = createNearbyLocation({ geolocation: navigator.geolocation,
      permissions: navigator.permissions, onChange: next => {
        enabled.current = next.enabled;
        setNow(Date.now());
        setLocation(next);
      } });
    controller.current = instance;
    return () => { instance.dispose(); controller.current = null; };
  }, []);
  useEffect(() => {
    let timer;
    const tick = () => {
      const instant = Date.now();
      setNow(instant);
      timer = setTimeout(tick, nearbyRefreshDelay(dataset, instant));
    };
    const sync = () => {
      clearTimeout(timer);
      const visible = active && document.visibilityState === "visible";
      controller.current?.setActive(visible);
      if (visible) {
        tick();
      }
    };
    const suspend = () => { clearTimeout(timer); controller.current?.setActive(false); };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("pagehide", suspend);
    sync();
    return () => {
      suspend();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("pagehide", suspend);
    };
  }, [active, dataset]);
  const model = useMemo(() => nearbyContext(dataset, now, location.location, routes, location.status),
    [dataset, now, location.location, location.status, routes]);
  return { ...model, now, locationState: location,
    toggleLocation: () => enabled.current ? controller.current?.disable() : controller.current?.enable() };
}
