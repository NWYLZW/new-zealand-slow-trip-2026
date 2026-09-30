import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isItineraryPath, itineraryPath, navigateSite } from "../siteNavigation";
import { PrivateVaultProvider } from "../PrivateVaultContext";
import { AdventureResolvedRoutes } from "./AdventureResolvedRoutes.jsx";
import "./adventure.css";
import "./AdventureDeviceCutout.css";
import { AdventureDeferredFeature } from "./AdventureDeferredFeature";
import { AdventureMenu } from "./AdventureMenu";
import { AdventureIconFeedback } from "./AdventureIconFeedback";
import { AdventurePreferencesProvider, useAdventurePreferences } from "./AdventurePreferences";
import { adventureLabel, adventureText } from "./adventureLabels";
import { getTripCalendarDay } from "../components/calendar/tripCalendarData";
import { mapStops } from "../tripData";
import { adventureStops } from "./adventureData";
import { adventureContextRouteIds } from "./adventureRouteContext";
import { GameIconButton } from "./GameIconButton";
import { MenuIcon, TasksIcon, BagIcon, CameraIcon } from "./SketchIcons";
import { useAdventureNavigation } from "./useAdventureNavigation";
import { resolveAdventureFullscreen, responsiveFullscreenPane, useAdventureResponsiveLayout } from "./adventureResponsivePane";
import { useAdventureDeviceCutout } from "./adventureDeviceCutout";
import { mapHandwriting } from "./pencil/label";
import { internationalFlightSegments, internationalMapStops } from "./internationalMapData";

const internationalRouteIds = new Set(internationalFlightSegments.map(segment => segment.id));
const loadMap = () => import("./AdventureMap").then(module => ({ default: module.AdventureMap }));
const loadPanel = () => import("./AdventurePanel").then(module => ({ default: module.AdventurePanel }));
const loadCalendar = () => import("./AdventureCalendar").then(module => ({ default: module.AdventureCalendar }));

const tools = [
  { id: "tasks", Icon: TasksIcon },
  { id: "bag", Icon: BagIcon },
  { id: "camera", Icon: CameraIcon },
];

function readUnlockEntry() {
  const url = new URL(window.location.href);
  const requested = url.searchParams.get("unlock") === "1";
  const rawReturn = url.searchParams.get("return");
  let returnUrl = null;
  if (requested && rawReturn) {
    try {
      const destination = new URL(rawReturn, window.location.origin);
      if (destination.origin === window.location.origin && isItineraryPath(destination.pathname)) {
        destination.searchParams.delete("unlock");
        returnUrl = destination.href;
      }
    } catch { /* Invalid return targets never leave this site. */ }
  }
  return { requested, returnUrl };
}

export function AdventurePage() {
  return <PrivateVaultProvider><AdventurePreferencesProvider><AdventureResolvedRoutes>
    <AdventureBoard />
  </AdventureResolvedRoutes></AdventurePreferencesProvider></PrivateVaultProvider>;
}

function AdventureBoard() {
  const { language } = useAdventurePreferences();
  const [view, navigate] = useAdventureNavigation();
  const [unlockEntry] = useState(readUnlockEntry);
  const previousCalendarFocus = useRef(null), previousSideFocus = useRef(null);
  const closeButton = useRef(null), calendarRegion = useRef(null);
  const calendarOpen = view.calendarOpen, sideOpen = Boolean(view.rightPanel);
  const fullscreen = view.fullscreen;
  const responsiveLayout = useAdventureResponsiveLayout(view);
  const deviceCutout = useAdventureDeviceCutout();
  const [cameraAutomaticFullscreenSuppressed, setCameraAutomaticFullscreenSuppressed] = useState(false);
  const { automaticFullscreen, effectiveFullscreen } = resolveAdventureFullscreen(view, responsiveLayout, {
    cameraAutomaticFullscreenSuppressed,
  });
  const [calendarMounted, setCalendarMounted] = useState(calendarOpen);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [sideMounted, setSideMounted] = useState(sideOpen);
  const [sideVisible, setSideVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(unlockEntry.requested);
  const [menuScreen, setMenuScreen] = useState(unlockEntry.requested ? "unlock" : "menu");
  const [unlockOrigin, setUnlockOrigin] = useState(unlockEntry.requested ? "external" : "menu");
  const unlockTrigger = useRef(null);
  const returnFromUnlock = useRef(unlockEntry.returnUrl);
  const lastCalendarView = useRef(view);
  const lastSideView = useRef(view);
  useEffect(() => {
    if (view.rightPanel !== "camera") setCameraAutomaticFullscreenSuppressed(false);
  }, [view.rightPanel]);
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => window.dispatchEvent(new Event("trip-ui-ready")));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, []);
  useEffect(() => {
    if (!unlockEntry.requested) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("unlock");
    url.searchParams.delete("return");
    history.replaceState(history.state, "", url);
  }, [unlockEntry.requested]);
  useEffect(() => {
    if (calendarOpen) lastCalendarView.current = view;
  }, [calendarOpen, view]);
  useEffect(() => {
    if (sideOpen) lastSideView.current = view;
  }, [sideOpen, view]);
  useEffect(() => {
    let firstFrame = 0, secondFrame = 0;
    if (calendarOpen) {
      setCalendarMounted(true);
      // Paint the mounted drawer offscreen before starting the slide, including deep links.
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setCalendarVisible(true));
      });
    } else {
      setCalendarVisible(false);
    }
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [calendarOpen]);
  useEffect(() => {
    let firstFrame = 0, secondFrame = 0, finishExit = 0;
    if (sideOpen) {
      setSideMounted(true);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setSideVisible(true));
      });
    } else {
      setSideVisible(false);
      finishExit = window.setTimeout(() => setSideMounted(false),
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 430);
    }
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      clearTimeout(finishExit);
    };
  }, [sideOpen]);
  const calendarView = calendarOpen ? view : lastCalendarView.current;
  const sideView = sideOpen ? view : lastSideView.current;
  const contextRouteIds = useMemo(() => adventureContextRouteIds(view),
    [view.rightPanel, view.eventId, view.focus, view.front]);
  const focusLocations = useMemo(() => {
    const focus = view.focus;
    if (focus?.kind === "international-route") {
      const segment = internationalFlightSegments.find(item => item.id === focus.value);
      return segment ? { id: `${focus.value}:${focus.token}`,
        positions: [segment.fromPosition, segment.toPosition].map(([lat, lng]) => [lng, lat]) } : null;
    }
    const day = focus?.kind === 'date' && (calendarOpen || ['day', 'event'].includes(view.rightPanel))
      ? getTripCalendarDay(focus.value)
      : focus?.kind === 'event' ? getTripCalendarDay(focus.value.split('|')[0]) : null;
    if (!day) return null;
    const tags = [...new Set(day.events.flatMap(event => event.stopTags ?? []))];
    const positions = tags.map(tag => internationalMapStops.find(stop => stop.tag === tag)
      ?? adventureStops.find(stop => stop.tag === tag) ?? mapStops.find(stop => stop.tag === tag))
      .filter(Boolean)
      .map(stop => [stop.position[1], stop.position[0]]);
    return positions.length || contextRouteIds.length
      ? { id: `${focus.value}:${focus.token}`, positions, routeIds: contextRouteIds } : null;
  }, [calendarOpen, view.focus, view.rightPanel, contextRouteIds]);
  const select = useCallback((tag) => { previousSideFocus.current = document.activeElement; navigate("place", tag); }, [navigate]);
  const selectRoute = useCallback((id) => {
    previousSideFocus.current = document.activeElement;
    navigate(internationalRouteIds.has(id) ? "international-route" : "route", id);
  }, [navigate]);
  const selectInternationalNode = useCallback((key) => {
    previousSideFocus.current = document.activeElement;
    navigate("international-node", key);
  }, [navigate]);
  const selectWaypoint = useCallback((id) => { previousSideFocus.current = document.activeElement; navigate("waypoint", id); }, [navigate]);
  const selectCluster = useCallback((keys) => { previousSideFocus.current = document.activeElement; navigate("cluster", keys); }, [navigate]);
  const closeCalendar = useCallback(() => {
    const returnFocus = previousCalendarFocus.current;
    navigate('close-calendar');
    requestAnimationFrame(() => returnFocus?.focus({ preventScroll: true }));
  }, [navigate]);
  const closeSide = useCallback(() => {
    const returnFocus = previousSideFocus.current;
    navigate('close-right');
    requestAnimationFrame(() => returnFocus?.focus({ preventScroll: true }));
  }, [navigate]);
  const toggleRightFullscreen = useCallback(() => {
    if (view.rightPanel !== "camera") {
      navigate("fullscreen", "right");
      return;
    }
    if (effectiveFullscreen === "right") {
      setCameraAutomaticFullscreenSuppressed(true);
      if (fullscreen === "right") navigate("fullscreen", "right");
      return;
    }
    setCameraAutomaticFullscreenSuppressed(false);
    if (responsiveFullscreenPane(view, responsiveLayout) !== "right") navigate("fullscreen", "right");
  }, [effectiveFullscreen, fullscreen, navigate, responsiveLayout, view]);
  const requestUnlock = useCallback(() => {
    unlockTrigger.current = document.activeElement;
    returnFromUnlock.current = null;
    setUnlockOrigin("external");
    setMenuScreen("unlock");
    setMenuOpen(true);
  }, []);
  const openMenu = useCallback(() => {
    unlockTrigger.current = null;
    returnFromUnlock.current = null;
    setMenuScreen("menu");
    setUnlockOrigin("menu");
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    const destination = returnFromUnlock.current;
    const trigger = unlockTrigger.current;
    returnFromUnlock.current = null;
    unlockTrigger.current = null;
    setMenuOpen(false);
    setMenuScreen("menu");
    setUnlockOrigin("menu");
    if (destination) navigateSite(destination);
    else if (trigger) {
      requestAnimationFrame(() => {
        const target = document.contains(trigger) ? trigger : closeButton.current?.querySelector("button");
        target?.focus({ preventScroll: true });
      });
    }
  }, []);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || menuOpen || document.querySelector('dialog[open]')) return;
      if (fullscreen) navigate('fullscreen', fullscreen);
      else if (view.front === 'right' && view.clusterFrom && !view.mediaId
        && (view.rightPanel === 'place' || view.rightPanel === 'event' || (view.rightPanel === 'route' && view.waypoint))) navigate('back-cluster');
      else if (view.front === 'right' && view.rightPanel === 'route' && view.waypoint) navigate('back-waypoint');
      else if (view.front === 'right' && view.mediaId) navigate('media-select', null);
      else if (view.front === 'right' && view.rightPanel === 'event') navigate('back-event');
      else if (view.front === 'right' && view.rightPanel === 'day' && view.dayFrom === 'place') navigate('back-day');
      else if (view.front === 'right' && view.rightPanel === 'bag-note') navigate('back-bag-note');
      else if (view.front === 'right' && view.rightPanel === 'camera' && view.cameraView !== 'preview') navigate('camera-view', view.cameraView === 'device' ? 'settings' : 'preview');
      else if (view.front === 'right' && view.rightPanel === 'bag-stay') navigate('back-stay');
      else if (view.front === 'right' && view.rightPanel === 'map-sources') navigate('back-bag');
      else if (view.front === 'tasks' && calendarOpen) closeCalendar();
      else if (sideOpen) closeSide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.front, view.rightPanel, view.dayFrom, view.cameraView, view.mediaId, view.waypoint, view.clusterFrom, calendarOpen, sideOpen, closeCalendar, closeSide, navigate, menuOpen, fullscreen]);
  useEffect(() => {
    if (menuOpen || unlockTrigger.current) return;
    if (view.front === 'tasks' && calendarOpen && calendarVisible) {
      calendarRegion.current?.querySelector("button")?.focus({ preventScroll: true });
    } else if (view.front === 'right' && sideOpen && sideVisible) {
      if (!document.getElementById("trip-right-panel")?.contains(document.activeElement)) {
        closeButton.current?.querySelector("button")?.focus({ preventScroll: true });
      }
    }
  }, [view.front, view.cameraView, view.mediaId, calendarOpen, calendarVisible, sideOpen, sideVisible]);
  const panelNavigation = useCallback((panel, place) => {
    if (!panel) closeSide();
    else navigate(panel, place);
  }, [closeSide, navigate]);
  return <main id="trip-board-structure" style={{ '--trip-handwriting': mapHandwriting,
    '--trip-cutout-inset': `${deviceCutout?.inset ?? 0}px`,
    '--trip-cutout-block-inset': `${deviceCutout?.blockInset ?? 0}px` }} aria-label={adventureText("新西兰冒险地图", "New Zealand adventure map", language)}
    data-device-cutout={deviceCutout?.corner}
    data-panel-open={calendarOpen || sideOpen} data-calendar-open={calendarVisible} data-side-open={sideVisible}
    data-responsive-layout={responsiveLayout} data-automatic-fullscreen={automaticFullscreen ?? undefined}
    data-fullscreen={effectiveFullscreen ?? undefined}>
    <AdventureDeferredFeature load={loadMap} kind="map" defer componentProps={{
      selected: view.airport ? `a:${view.airport}` : view.focus?.kind === 'event' ? null : view.place,
      selectedRoute: contextRouteIds.length === 1 ? contextRouteIds[0]
        : view.focus?.kind === 'date' ? null : view.flightRoute ?? view.route,
      selectedWaypoint: view.waypoint, focusLocations,
      focusRoute: view.focus?.kind === 'route' ? view.focus.value : null,
      focusNode: view.focus?.kind === 'node' ? { key: view.focus.value, token: view.focus.token } : null,
      focusKey: view.focus ? `${view.focus.kind}:${view.focus.value}:${view.focus.token}` : null,
      mapMode: view.mapMode, onMapModeChange: mode => navigate("map-mode", mode),
      mapView: view.mapView, onMapViewChange: mapView => navigate("map-view", mapView),
      calendarOpen, sideOpen, language, obscured: Boolean(effectiveFullscreen),
      onSelect: select, onInternationalNodeSelect: selectInternationalNode, onRouteSelect: selectRoute,
      onWaypointSelect: selectWaypoint, onClusterSelect: selectCluster, onClear: sideOpen ? closeSide : undefined,
    }} />
    <GameIconButton className="trip-home" label={adventureLabel("menu", language)} hidden={Boolean(effectiveFullscreen)}
      aria-expanded={menuOpen} aria-controls="trip-adventure-menu"
      onClick={openMenu}><MenuIcon /></GameIconButton>
    <nav className="trip-game-tools" hidden={Boolean(effectiveFullscreen)} aria-label={adventureText("旅行工具", "Trip tools", language)}>
      {tools.map(({ id, Icon }) => <GameIconButton key={id}
        label={adventureLabel(id, language)} aria-pressed={id === 'tasks' ? calendarOpen : (id === 'bag' ? ['bag', 'bag-stay', 'map-sources', 'bag-note'].includes(view.rightPanel) : view.rightPanel === id)}
        aria-expanded={id === 'tasks' ? calendarOpen : (id === 'bag' ? ['bag', 'bag-stay', 'map-sources', 'bag-note'].includes(view.rightPanel) : view.rightPanel === id)}
        aria-controls={id === "tasks" ? "trip-calendar-region" : "trip-right-panel"}
        onClick={(event) => {
          if (id === 'tasks') {
            previousCalendarFocus.current = event.currentTarget;
            calendarOpen ? closeCalendar() : navigate('tasks');
          } else {
            previousSideFocus.current = event.currentTarget;
            (id === 'bag' ? ['bag', 'bag-stay', 'map-sources', 'bag-note'].includes(view.rightPanel) : view.rightPanel === id)
              ? closeSide() : navigate(id);
          }
        }}>
        <Icon />
      </GameIconButton>)}
    </nav>
    {(sideOpen || sideMounted) && <AdventureDeferredFeature load={loadPanel} kind="panel"
      onClose={closeSide} onOpenMenu={openMenu} componentProps={{
        view: sideView, navigate: panelNavigation,
        cameraActive: sideOpen && sideVisible && effectiveFullscreen !== "calendar" && view.rightPanel === "camera" && view.cameraView === "preview" && !menuOpen,
        closeButtonRef: closeButton, onRequestUnlock: requestUnlock,
        fullscreen: effectiveFullscreen === "right", automaticFullscreen: automaticFullscreen === "right",
        onToggleFullscreen: toggleRightFullscreen, onOpenMenu: openMenu,
        "aria-hidden": !sideOpen || effectiveFullscreen === "calendar",
        inert: sideOpen && effectiveFullscreen !== "calendar" ? undefined : '',
      }} />}
    {(calendarOpen || calendarMounted) && <section ref={calendarRegion} id="trip-calendar-region"
      className="trip-calendar-region" aria-label={adventureText("行程日历", "Itinerary calendar", language)} aria-hidden={!calendarOpen || effectiveFullscreen === "right"}
      inert={calendarOpen && effectiveFullscreen !== "right" ? undefined : ""}>
      <AdventureDeferredFeature load={loadCalendar} kind="calendar" onClose={closeCalendar} onOpenMenu={openMenu}
        componentProps={{ selectedDate: calendarView.date, scope: calendarView.scope ?? "all",
          onScopeChange: scope => navigate("tasks", null, scope), onSelectDate: date => navigate("day", date),
          onSelectEvent: (event, agendaItem) => navigate("event", { event, agendaItem }, { from: "calendar", agendaItem }),
          onClose: closeCalendar, fullscreen: effectiveFullscreen === "calendar", automaticFullscreen: automaticFullscreen === "calendar",
          onToggleFullscreen: () => navigate("fullscreen", "calendar"), onOpenMenu: openMenu,
        }} />
    </section>}
    <AdventureMenu open={menuOpen} screen={menuScreen} unlockOrigin={unlockOrigin}
      onScreenChange={(screen, origin = "menu") => {
        setMenuScreen(screen);
        setUnlockOrigin(origin);
      }} onClose={closeMenu} onOpenLegacy={() => navigateSite(itineraryPath)} />
    <AdventureIconFeedback />
  </main>;
}
