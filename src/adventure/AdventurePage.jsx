import { useCallback, useEffect, useRef } from "react";
import { assetPath } from "../assets";
import { AdventureMap } from "./AdventureMap";
import { AdventurePanel } from "./AdventurePanel";
import { GameIconButton } from "./GameIconButton";
import { BackIcon, TasksIcon, BagIcon, PhotosIcon } from "./SketchIcons";
import { useAdventureNavigation } from "./useAdventureNavigation";

const tools = [
  { id: "tasks", label: "任务", Icon: TasksIcon },
  { id: "bag", label: "背包", Icon: BagIcon },
  { id: "photos", label: "相册", Icon: PhotosIcon },
];
export function AdventurePage() {
  const [view, navigate] = useAdventureNavigation();
  const previousFocus = useRef(null), closeButton = useRef(null);
  const select = useCallback((tag) => { previousFocus.current = document.activeElement; navigate("place", tag); }, [navigate]);
  const selectRoute = useCallback((id) => { previousFocus.current = document.activeElement; navigate("route", id); }, [navigate]);
  const close = useCallback(() => {
    const returnFocus = previousFocus.current;
    navigate();
    requestAnimationFrame(() => returnFocus?.focus({ preventScroll: true }));
  }, [navigate]);
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape" && view.panel) close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.panel, close]);
  useEffect(() => { if (view.panel) closeButton.current?.querySelector("button")?.focus({ preventScroll: true }); }, [view.panel]);
  const panelNavigation = useCallback((panel, place) => { if (!panel) close(); else navigate(panel, place); }, [close, navigate]);
  return <main id="trip-board-structure" aria-label="新西兰冒险地图" data-panel-open={Boolean(view.panel)}>
    <AdventureMap selected={view.place} selectedRoute={view.route} onSelect={select} onRouteSelect={selectRoute} onClear={close} />
    <GameIconButton className="trip-home" label="返回行程总览" caption="返回" onClick={() => window.location.assign(assetPath(""))}><BackIcon /></GameIconButton>
    <nav className="trip-game-tools" aria-label="旅行工具">
      {tools.map(({ id, label, Icon }) => <GameIconButton key={id}
        label={label} aria-pressed={view.panel === id}
        onClick={(event) => { previousFocus.current = event.currentTarget; view.panel === id ? close() : navigate(id); }}>
        <Icon />
      </GameIconButton>)}
    </nav>
    <div className="trip-attribution">
      <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer"
        title="Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government. All rights reserved. Global fallback: USGS.">© LINZ / NZ Government · USGS</a>
      <span> · </span><a href="https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-linz-data" target="_blank" rel="noreferrer"
        title="Lake and river data: LINZ Data Service, CC BY 4.0">LINZ water data</a>
      <span> · </span><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>
    </div>
    {view.panel && <AdventurePanel view={view} navigate={panelNavigation} closeButtonRef={closeButton} />}
  </main>;
}
