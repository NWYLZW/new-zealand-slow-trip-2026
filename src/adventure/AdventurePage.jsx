import { useCallback, useEffect, useRef } from "react";
import { assetPath } from "../assets";
import { AdventureMap } from "./AdventureMap";
import { AdventurePanel } from "./AdventurePanel";
import { GameIconButton } from "./GameIconButton";
import { BackIcon, TasksIcon, BagIcon, PhotosIcon } from "./SketchIcons";
import { useAdventureNavigation } from "./useAdventureNavigation";
import { mapHandwriting } from "./pencil/label";

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
  return <main id="trip-board-structure" style={{ '--trip-handwriting': mapHandwriting }} aria-label="新西兰冒险地图" data-panel-open={Boolean(view.panel)}>
    <AdventureMap selected={view.place} selectedRoute={view.route} onSelect={select} onRouteSelect={selectRoute} onClear={close} />
    <GameIconButton className="trip-home" label="返回行程总览" onClick={() => window.location.assign(assetPath(""))}><BackIcon /></GameIconButton>
    <nav className="trip-game-tools" aria-label="旅行工具">
      {tools.map(({ id, label, Icon }) => <GameIconButton key={id}
        label={label} aria-pressed={view.panel === id}
        onClick={(event) => { previousFocus.current = event.currentTarget; view.panel === id ? close() : navigate(id); }}>
        <Icon />
      </GameIconButton>)}
    </nav>
    {view.panel && <AdventurePanel view={view} navigate={panelNavigation} closeButtonRef={closeButton} />}
  </main>;
}
