import { useCallback, useEffect, useRef, useState } from "react";
import { adventureStops } from "./adventureData";
import { adventureRouteIndex } from "./adventureRouteIndex";
import { eventDateId, getAdventureCalendarDays, getTripCalendarDay } from "../components/calendar/tripCalendarData";
import { southDays, northDays } from "../tripData";
import { socialGuidesByEvent } from "../socialGuides";
import { confirmedAccommodationBookings } from "../data/confirmedAccommodationBookings";
import { preTripChecklist } from "../data/preTripChecklist";
import { cancelAdventurePaneTransition, transitionAdventurePane } from "./adventurePaneTransition";
import { getAdventureWaypoint } from "./adventureWaypoints";
import { getMapNode, normalizeMapCluster } from "./adventureMapNodes";
import { getInternationalMapNode, internationalFlightSegments, internationalMapStops } from "./internationalMapData";
import { eventAgendaItems } from "./adventureEventAgenda";
import { isDailyAdventureShortcut, resolveAdventureShortcut } from "./adventureShortcuts";

const rightPanels = new Set(["bag", "camera", "photos"]);
const scopes = new Set(["all", "south", "north"]);
const placeTabs = new Set(["calendar", "map", "hotels", "activities", "photos"]);
const bagTabs = new Set(["stays", "car", "activities", "notes"]);
const cameraViews = new Set(["preview", "album", "settings", "device"]);
const eventById = new Map(getAdventureCalendarDays().flatMap(day => day.events.map(event => [event.urlId, event])));
const shortcutDayIds = new Set(getAdventureCalendarDays().map(day => day.dateId));
const shortcutBookings = Object.values(confirmedAccommodationBookings);
const internationalDateIds = new Set(internationalFlightSegments.map(segment => segment.itinerary?.dateId).filter(Boolean));
const MAP_ZOOM_RANGE = [.035, 384];
const eventTabs = event => ["schedule", event?.flights?.length && "flight",
  event?.media?.localNames?.length && "names", (socialGuidesByEvent[event?.title] ?? []).length && "social",
  event?.media?.links?.length && "links"].filter(Boolean);
function validDate(date, scope) {
  const entry = getTripCalendarDay(date);
  if (!entry) return null;
  const days = scope === "south" ? southDays : scope === "north" ? northDays : null;
  return !days || days.some(day => day.date === entry.day.date) ? date : null;
}
function mapModeForDate(date) {
  return internationalDateIds.has(date) ? "international" : "new-zealand";
}
function internationalSelectionTarget(node) {
  return node?.kind === "international-flight" ? node.itinerary : node?.itineraryTargets?.[0];
}
export function normalizeAdventureMapView(value) {
  if (value?.zoom === null || value?.zoom === undefined || !Array.isArray(value?.center)
    || value.center[0] === null || value.center[0] === undefined
    || value.center[1] === null || value.center[1] === undefined) return null;
  const zoom = Number(value.zoom), lat = Number(value.center[0]), lng = Number(value.center[1]);
  if (![zoom, lng, lat].every(Number.isFinite)) return null;
  return {
    zoom: Math.min(MAP_ZOOM_RANGE[1], Math.max(MAP_ZOOM_RANGE[0], zoom)),
    center: [Math.min(85, Math.max(-85, lat)), Math.min(180, Math.max(-180, lng))],
  };
}
function readLocation() {
  const params = resolveAdventureShortcut(new URLSearchParams(window.location.search), {
    dayIds: shortcutDayIds, bookings: shortcutBookings,
  });
  const requestedMapMode = params.get("map");
  const mapView = normalizeAdventureMapView({
    zoom: params.get("zoom"), center: [params.get("lat"), params.get("lng")],
  });
  const panel = params.get("panel");
  const calendarOpen = panel === "tasks";
  const scope = scopes.has(params.get("scope")) ? params.get("scope") : "all";
  const date = calendarOpen ? validDate(params.get("date") ?? params.get("day"), scope) : null;
  const flightNode = getInternationalMapNode(`f:${params.get("flightRoute") ?? ""}`);
  const airportNode = flightNode ? null : internationalMapStops.find(stop => stop.id === params.get("airport")) ?? null;
  const internationalTarget = internationalSelectionTarget(flightNode ?? airportNode);
  const requestedEventId = eventById.has(params.get("event")) ? params.get("event") : internationalTarget?.eventId;
  const eventId = eventById.has(requestedEventId) ? requestedEventId : null;
  const event = eventById.get(eventId);
  const requestedAgenda = params.get("agenda");
  const eventAgenda = eventAgendaItems(event).some((item) => item.id === requestedAgenda) ? requestedAgenda : null;
  const eventTab = eventTabs(event).includes(params.get("eventTab")) ? params.get("eventTab") : "schedule";
  const route = adventureRouteIndex.some(item => item.id === params.get("route")) ? params.get("route") : null;
  const requestedWaypoint = route ? getAdventureWaypoint(params.get("waypoint")) : null;
  const waypoint = requestedWaypoint?.routeId === route ? requestedWaypoint.id : null;
  const place = !route && adventureStops.some(stop => stop.tag === params.get("place")) ? params.get("place") : null;
  const fromPlace = params.get("dayFrom") === "place" && Boolean(place);
  const day = !route && (!place || fromPlace)
    ? validDate(params.get("day"), "all") ?? (event ? eventDateId(event) : null) : null;
  const dayFrom = fromPlace && day ? "place" : null;
  const eventFrom = eventId ? params.get("eventFrom") === "place" && place ? "place"
    : flightNode || airportNode ? "international" : "day" : null;
  const inferredNewZealand = place || route || (day && !internationalDateIds.has(day));
  const mapMode = requestedMapMode === "nz" ? "new-zealand"
    : requestedMapMode === "international" ? "international"
      : inferredNewZealand ? "new-zealand" : "international";
  const placeTab = placeTabs.has(params.get("placeTab")) ? params.get("placeTab") : "calendar";
  const placeDate = validDate(params.get("placeDate"), "all") ?? (dayFrom ? day : null);
  const bagTab = bagTabs.has(params.get("bagTab")) ? params.get("bagTab") : "stays";
  const bagDate = validDate(params.get("bagDate"), "all");
  const bagStay = confirmedAccommodationBookings[params.get("bagStay")]?.bookingId ?? null;
  const requestedStayFrom = params.get("stayFrom");
  const stayFrom = bagStay && requestedStayFrom === "event" && eventId ? "event"
    : bagStay && requestedStayFrom === "place" && place ? "place" : bagStay ? "bag" : null;
  const bagSources = params.get("bagSources") === "1";
  const bagNoteRequested = params.has("bagNote");
  const bagNote = preTripChecklist.some((group) => group.id === params.get("bagNote")) ? params.get("bagNote") : null;
  const right = params.get("right");
  const directPanel = rightPanels.has(right) ? right : rightPanels.has(panel) ? panel : null;
  const cluster = normalizeMapCluster(params.get("cluster"));
  const clusterFrom = cluster.length > 1 && params.get("nodeFrom") === "cluster"
    && (cluster.includes(`p:${place}`) || cluster.includes(`w:${waypoint}`) || cluster.includes(airportNode?.key));
  const clusterNodeKey = clusterFrom ? airportNode?.key ?? (place ? `p:${place}` : `w:${waypoint}`) : null;
  const rightPanel = cluster.length > 1 && !clusterFrom ? "cluster" : bagStay ? "bag-stay" : eventId ? "event" : route ? "route" : dayFrom ? "day" : place ? "place" : day ? "day" :
    bagSources ? "map-sources" : bagNote ? "bag-note" : bagNoteRequested ? "bag"
      : directPanel === "photos" ? "camera" : directPanel;
  const front = calendarOpen && rightPanel
    ? params.get("front") === "tasks" ? "tasks" : "right"
    : calendarOpen ? "tasks" : rightPanel ? "right" : null;
  const focus = rightPanel === "cluster" ? null : clusterNodeKey ? { kind: "node", value: clusterNodeKey, token: 0 }
    : front === "tasks" && date ? { kind: "date", value: date, token: 0 }
    : dayFrom && day ? { kind: "date", value: day, token: 0 }
      : place ? { kind: "place", value: place, token: 0 }
      : route ? { kind: "route", value: route, token: 0 }
        : day || date ? { kind: "date", value: day ?? date, token: 0 } : null;
  const fullscreen = params.get("fullscreen") === "right" && rightPanel ? "right"
    : params.get("fullscreen") === "calendar" && calendarOpen ? "calendar" : null;
  const cameraView = rightPanel === "camera" && cameraViews.has(params.get("cameraView")) ? params.get("cameraView") : "preview";
  const inAlbum = (rightPanel === "camera" && cameraView === "album") || (rightPanel === "place" && placeTab === "photos");
  const mediaId = inAlbum && /^[a-zA-Z0-9-]{1,100}$/.test(params.get("mediaId") ?? "") ? params.get("mediaId") : null;
  return { calendarOpen, rightPanel, place, route, waypoint, airport: airportNode?.id ?? null,
    flightRoute: flightNode?.id ?? null, mapMode, mapView, day, date, scope, front, focus, fullscreen, cluster, clusterFrom,
    eventId, eventTab, eventAgenda, eventFrom, dayFrom, placeTab, placeDate,
    bagTab: bagNoteRequested ? "notes" : bagTab, bagDate, bagStay, stayFrom, bagNote,
    cameraView, mediaId, mediaTab: mediaId && params.get("mediaTab") === "edit" ? "edit" : "info" };
}

function writeLocation(view, { replace = false } = {}) {
  const url = new URL(window.location.href);
  for (const key of ["panel", "right", "place", "route", "waypoint", "airport", "flightRoute", "map", "zoom", "lat", "lng", "cluster", "nodeFrom", "day", "date", "scope", "front",
    "event", "eventTab", "agenda", "eventFrom", "dayFrom", "placeTab", "placeDate",
    "bagTab", "bagDate", "bagStay", "stayFrom", "bagSources", "bagNote", "cameraView", "mediaId", "mediaTab", "fullscreen", "shortcut"]) {
    url.searchParams.delete(key);
  }
  if (view.calendarOpen) {
    url.searchParams.set("panel", "tasks");
    if (view.date) url.searchParams.set("date", view.date);
    if (view.scope !== "all") url.searchParams.set("scope", view.scope);
  }
  if (view.mapMode === "new-zealand") url.searchParams.set("map", "nz");
  else if (view.place || view.route || (view.day && !internationalDateIds.has(view.day))) {
    url.searchParams.set("map", "international");
  }
  const mapView = normalizeAdventureMapView(view.mapView);
  if (mapView) {
    url.searchParams.set("zoom", String(Number(mapView.zoom.toFixed(5))));
    url.searchParams.set("lat", String(Number(mapView.center[0].toFixed(6))));
    url.searchParams.set("lng", String(Number(mapView.center[1].toFixed(6))));
  }
  if (view.airport) url.searchParams.set("airport", view.airport);
  if (view.flightRoute) url.searchParams.set("flightRoute", view.flightRoute);
  const writeEventContext = () => {
    url.searchParams.set("event", view.eventId);
    url.searchParams.set("eventTab", view.eventTab);
    if (view.eventAgenda) url.searchParams.set("agenda", view.eventAgenda);
    url.searchParams.set("eventFrom", view.eventFrom);
    if (view.eventFrom === "place" && view.place) url.searchParams.set("place", view.place);
    else if (view.day) {
      url.searchParams.set("day", view.day);
      if (view.dayFrom === "place" && view.place) {
        url.searchParams.set("place", view.place);
        url.searchParams.set("dayFrom", "place");
      }
    }
  };
  if (view.rightPanel === "event") writeEventContext();
  else if (view.rightPanel === "place") url.searchParams.set("place", view.place);
  else if (view.rightPanel === "route") {
    url.searchParams.set("route", view.route);
    if (view.waypoint) url.searchParams.set("waypoint", view.waypoint);
  }
  else if (view.rightPanel === "day") {
    url.searchParams.set("day", view.day);
    if (view.dayFrom === "place" && view.place) {
      url.searchParams.set("place", view.place);
      url.searchParams.set("dayFrom", "place");
    }
  }
  else if (view.rightPanel === "bag-stay" && view.bagStay) {
    url.searchParams.set("bagStay", view.bagStay);
    if (view.stayFrom && view.stayFrom !== "bag") url.searchParams.set("stayFrom", view.stayFrom);
    if (view.stayFrom === "event" && view.eventId) writeEventContext();
    else if (view.stayFrom === "place" && view.place) url.searchParams.set("place", view.place);
  }
  else if (view.rightPanel === "map-sources") url.searchParams.set("bagSources", "1");
  else if (view.rightPanel === "bag-note" && view.bagNote) url.searchParams.set("bagNote", view.bagNote);
  else if (view.rightPanel) url.searchParams.set(view.calendarOpen ? "right" : "panel", view.rightPanel);
  if (view.rightPanel === "camera" && view.cameraView !== "preview") url.searchParams.set("cameraView", view.cameraView);
  if (view.cluster?.length > 1 && (view.rightPanel === "cluster" || view.clusterFrom)) {
    url.searchParams.set("cluster", view.cluster.join(","));
    if (view.clusterFrom) url.searchParams.set("nodeFrom", "cluster");
  }
  if (view.mediaId) {
    url.searchParams.set("mediaId", view.mediaId);
    if (view.mediaTab === "edit") url.searchParams.set("mediaTab", "edit");
  }
  if (view.place && view.placeTab !== "calendar") url.searchParams.set("placeTab", view.placeTab);
  if (view.place && view.placeDate) url.searchParams.set("placeDate", view.placeDate);
  if (["bag", "bag-stay", "map-sources", "bag-note"].includes(view.rightPanel)) {
    if (view.bagTab !== "stays") url.searchParams.set("bagTab", view.bagTab);
    if (view.bagDate) url.searchParams.set("bagDate", view.bagDate);
  }
  if (view.calendarOpen && view.rightPanel && view.front === "tasks") url.searchParams.set("front", "tasks");
  if (view.fullscreen) url.searchParams.set("fullscreen", view.fullscreen);
  if (url.href !== window.location.href) history[replace ? "replaceState" : "pushState"](null, "", url);
}

export function useAdventureNavigation() {
  const [view, setView] = useState(readLocation);
  const current = useRef(view);
  current.current = view;
  useEffect(() => {
    const consumeShortcut = next => {
      if (isDailyAdventureShortcut(new URLSearchParams(window.location.search).get("shortcut"))) {
        writeLocation(next, { replace: true });
      }
    };
    consumeShortcut(current.current);
    const sync = () => {
      const next = readLocation();
      consumeShortcut(next);
      const previous = current.current;
      current.current = next;
      transitionAdventurePane(previous, next, () => setView(next));
    };
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("popstate", sync); cancelAdventurePaneTransition(); };
  }, []);
  const navigate = useCallback((target = null, id = null, requestedScope) => {
    if (target === "photos") target = "camera";
    const previous = current.current;
    if (target === "map-view") {
      const mapView = normalizeAdventureMapView(id);
      if (!mapView) return;
      const next = { ...previous, mapView };
      current.current = next;
      writeLocation(next, { replace: true });
      setView(next);
      return;
    }
    const next = { ...previous };
    if (!["cluster", "cluster-member", "back-cluster", "fullscreen", "tasks", "close-calendar",
      "place-tab", "place-date", "place-day", "back-day", "event", "event-tab", "event-agenda", "back-event",
      "bag-stay", "back-stay", "media-select", "media-tab"].includes(target)) {
      next.cluster = [];
      next.clusterFrom = false;
    }
    if (target === "cluster" || target === "back-cluster") {
      const cluster = normalizeMapCluster(target === "cluster" ? id : previous.cluster);
      if (cluster.length < 2) return;
      Object.assign(next, { cluster, clusterFrom: false, rightPanel: "cluster", place: null, route: null,
        waypoint: null, airport: null, flightRoute: null, day: null, dayFrom: null, eventId: null, eventFrom: null, bagStay: null,
        bagNote: null, mediaId: null, focus: null, front: "right" });
    } else if (target === "cluster-member") {
      const node = getMapNode(id);
      if (!node || !previous.cluster?.includes(id)) return;
      if (node.kind === "airport") {
        const itinerary = internationalSelectionTarget(node.record);
        if (!itinerary || !eventById.has(itinerary.eventId)) return;
        Object.assign(next, { clusterFrom: true, rightPanel: "event", place: null, route: null, waypoint: null,
          airport: node.id, flightRoute: null, mapMode: "international", mapView: null, day: itinerary.dateId, dayFrom: null,
          eventId: itinerary.eventId, eventTab: "schedule", eventFrom: "international",
          focus: { kind: "node", value: node.key, token: (previous.focus?.token ?? 0) + 1 }, front: "right" });
      } else {
        Object.assign(next, { clusterFrom: true, rightPanel: node.kind === "place" ? "place" : "route",
          place: node.kind === "place" ? node.id : null,
          route: node.kind === "waypoint" ? node.record.routeId : null,
          waypoint: node.kind === "waypoint" ? node.id : null, airport: null, flightRoute: null,
          mapMode: "new-zealand", mapView: null, placeTab: "calendar", placeDate: null, day: null, dayFrom: null, eventId: null,
          eventFrom: null, focus: { kind: "node", value: node.key, token: (previous.focus?.token ?? 0) + 1 }, front: "right" });
      }
    } else if (target === "map-mode") {
      next.mapMode = id === "new-zealand" ? "new-zealand" : "international";
      next.mapView = null;
      next.focus = null;
    } else if (target === "international-node" || target === "international-route") {
      const key = target === "international-node" ? (String(id).startsWith("a:") ? String(id) : `a:${id}`)
        : (String(id).startsWith("f:") ? String(id) : `f:${id}`);
      const node = getInternationalMapNode(key);
      const itinerary = internationalSelectionTarget(node);
      if (!node || !itinerary || !eventById.has(itinerary.eventId)) return;
      Object.assign(next, { mapMode: "international", mapView: null, rightPanel: "event", place: null, route: null, waypoint: null,
        airport: node.kind === "international-airport" ? node.id : null,
        flightRoute: node.kind === "international-flight" ? node.id : null,
        day: itinerary.dateId, dayFrom: null, eventId: itinerary.eventId, eventTab: "schedule",
        eventFrom: "international",
        focus: node.kind === "international-flight"
          ? { kind: "international-route", value: node.id, token: (previous.focus?.token ?? 0) + 1 } : null,
        front: "right" });
      if (next.calendarOpen) next.date = itinerary.dateId;
    } else if (target === "fullscreen") {
      const requested = id === "right" && previous.rightPanel ? "right"
        : id === "calendar" && previous.calendarOpen ? "calendar" : null;
      next.fullscreen = requested === previous.fullscreen ? null : requested;
      if (next.fullscreen) next.front = next.fullscreen === "calendar" ? "tasks" : "right";
    } else if (target === "tasks") {
      next.calendarOpen = true;
      next.scope = scopes.has(requestedScope) ? requestedScope : previous.scope;
      next.date = validDate(id ?? previous.date, next.scope);
      next.front = "tasks";
      if (id && next.date) {
        next.mapMode = mapModeForDate(next.date);
        next.airport = null;
        next.flightRoute = null;
        next.mapView = null;
        next.focus = { kind: "date", value: next.date, token: (previous.focus?.token ?? 0) + 1 };
      }
      else if (previous.focus?.kind === "date" && previous.focus.value !== next.date) next.focus = null;
    } else if (target === "close-calendar") {
      next.calendarOpen = false;
      next.front = next.rightPanel ? "right" : null;
      if (next.focus?.kind === "date") next.focus = null;
    } else if (target === "close-right") {
      next.rightPanel = null;
      next.place = null;
      next.route = null;
      next.waypoint = null;
      next.airport = null;
      next.flightRoute = null;
      next.day = null;
      next.dayFrom = null;
      next.eventId = null;
      next.eventTab = "schedule";
      next.eventAgenda = null;
      next.eventFrom = null;
      next.bagStay = null;
      next.stayFrom = null;
      next.bagNote = null;
      next.front = next.calendarOpen ? "tasks" : null;
      if (["place", "route"].includes(next.focus?.kind) || previous.rightPanel === "day") next.focus = null;
    } else if (target === "event" && eventById.has(id?.event?.urlId ?? id?.urlId ?? id)) {
      const event = eventById.get(id?.event?.urlId ?? id?.urlId ?? id);
      const agendaItem = id?.agendaItem ?? (typeof requestedScope === "object" ? requestedScope.agendaItem : null);
      const fromCalendar = requestedScope === "calendar" || requestedScope?.from === "calendar";
      const eventDate = eventDateId(event);
      next.eventId = event.urlId;
      next.eventTab = "schedule";
      next.eventAgenda = eventAgendaItems(event).some((item) => item.id === agendaItem?.id) ? agendaItem.id : null;
      next.eventFrom = !fromCalendar && previous.rightPanel === "place" ? "place" : "day";
      next.dayFrom = fromCalendar ? null : previous.dayFrom;
      next.place = !fromCalendar && (next.eventFrom === "place" || next.dayFrom === "place") ? previous.place : null;
      next.day = next.eventFrom === "day" ? fromCalendar ? eventDateId(event) : previous.day ?? eventDateId(event) : null;
      next.route = null;
      next.airport = null;
      next.flightRoute = null;
      next.mapMode = mapModeForDate(eventDate);
      next.mapView = null;
      next.rightPanel = "event";
      next.front = "right";
      if (next.calendarOpen && !next.place) next.date = eventDate;
    } else if (target === "event-tab" && previous.rightPanel === "event") {
      const event = eventById.get(previous.eventId);
      next.eventTab = eventTabs(event).includes(id) ? id : "schedule";
    } else if (target === "event-agenda" && previous.rightPanel === "event") {
      const event = eventById.get(previous.eventId);
      next.eventAgenda = eventAgendaItems(event).some((item) => item.id === id) ? id : null;
      next.eventTab = "schedule";
    } else if (target === "back-event" && previous.rightPanel === "event") {
      if (previous.clusterFrom) {
        Object.assign(next, { rightPanel: "cluster", clusterFrom: false, day: null, focus: null });
      } else {
        next.rightPanel = previous.eventFrom === "place" && previous.place ? "place" : "day";
        next.focus = previous.eventFrom === "international" && previous.day
          ? { kind: "date", value: previous.day, token: (previous.focus?.token ?? 0) + 1 } : next.focus;
        if (previous.eventFrom === "international") next.mapView = null;
      }
      next.eventId = null;
      next.eventTab = "schedule";
      next.eventAgenda = null;
      next.eventFrom = null;
      next.airport = null;
      next.flightRoute = null;
      next.front = "right";
    } else if (target === "waypoint") {
      const waypoint = getAdventureWaypoint(id);
      if (!waypoint) return;
      next.rightPanel = "route";
      next.route = waypoint.routeId;
      next.place = null;
      next.airport = null;
      next.flightRoute = null;
      next.mapMode = "new-zealand";
      next.mapView = null;
      next.day = null;
      next.dayFrom = null;
      next.eventId = null;
      next.eventTab = "schedule";
      next.eventFrom = null;
      next.focus = null;
      next.waypoint = waypoint.id;
      next.front = "right";
    } else if (target === "back-waypoint" && previous.rightPanel === "route" && previous.waypoint) {
      next.waypoint = null;
      next.front = "right";
    } else if (target === "place-day" && previous.place && validDate(id, "all")) {
      next.day = id;
      next.dayFrom = "place";
      next.mapMode = mapModeForDate(id);
      next.mapView = null;
      next.placeDate = id;
      next.rightPanel = "day";
      next.front = "right";
      next.focus = { kind: "date", value: id, token: (previous.focus?.token ?? 0) + 1 };
    } else if (target === "back-day" && previous.rightPanel === "day" && previous.dayFrom === "place") {
      next.rightPanel = "place";
      next.day = null;
      next.dayFrom = null;
      next.front = "right";
      next.focus = { kind: "place", value: previous.place, token: (previous.focus?.token ?? 0) + 1 };
      next.mapView = null;
    } else if (target === "place-tab") {
      next.placeTab = placeTabs.has(id) ? id : "calendar";
    } else if (target === "place-date") {
      next.placeDate = validDate(id, "all");
    } else if (target === "camera-view" && previous.rightPanel === "camera") {
      next.cameraView = cameraViews.has(id) ? id : "preview";
      next.mediaId = null;
      next.mediaTab = "info";
      next.front = "right";
    } else if (target === "media-select" && ((previous.rightPanel === "camera" && previous.cameraView === "album")
      || (previous.rightPanel === "place" && previous.placeTab === "photos"))) {
      next.mediaId = typeof id === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(id) ? id : null;
      next.mediaTab = "info";
      next.front = "right";
    } else if (target === "media-tab" && previous.mediaId) {
      next.mediaTab = id === "edit" ? "edit" : "info";
      next.front = "right";
    } else if (target === "bag-note" && previous.rightPanel === "bag" && previous.bagTab === "notes"
      && preTripChecklist.some((group) => group.id === id)) {
      next.bagNote = id;
      next.bagTab = "notes";
      next.rightPanel = "bag-note";
      next.front = "right";
    } else if (target === "back-bag-note" && previous.rightPanel === "bag-note") {
      next.bagNote = null;
      next.bagTab = "notes";
      next.rightPanel = "bag";
      next.front = "right";
    } else if (target === "bag-root" && previous.rightPanel === "bag-note") {
      next.bagNote = null;
      next.bagTab = "stays";
      next.rightPanel = "bag";
      next.front = "right";
    } else if (target === "bag-tab" && previous.rightPanel === "bag") {
      next.bagTab = bagTabs.has(id) ? id : "stays";
      next.front = "right";
    } else if (target === "bag-date" && previous.rightPanel === "bag") {
      next.bagDate = validDate(id, "all");
      next.front = "right";
    } else if (target === "bag-stay" && ["bag", "place", "event"].includes(previous.rightPanel)
      && confirmedAccommodationBookings[id?.bookingId]?.bookingId) {
      next.bagStay = id.bookingId;
      next.bagDate = validDate(id.dateId, "all") ?? previous.bagDate;
      next.stayFrom = previous.rightPanel;
      next.rightPanel = "bag-stay";
      next.front = "right";
    } else if (target === "bag-sources" && previous.rightPanel === "bag") {
      next.bagStay = null;
      next.rightPanel = "map-sources";
      next.front = "right";
    } else if ((target === "back-stay" || target === "back-bag") && previous.rightPanel === "bag-stay") {
      next.bagStay = null;
      next.rightPanel = previous.stayFrom === "event" && previous.eventId ? "event"
        : previous.stayFrom === "place" && previous.place ? "place" : "bag";
      next.stayFrom = null;
      next.front = "right";
    } else if (target === "back-bag" && previous.rightPanel === "map-sources") {
      next.bagStay = null;
      next.bagNote = null;
      next.rightPanel = "bag";
      next.front = "right";
    } else if (["place", "route", "day", "bag", "camera"].includes(target)) {
      next.rightPanel = target;
      next.cameraView = "preview";
      next.mediaId = null;
      next.mediaTab = "info";
      next.bagStay = null;
      next.bagNote = null;
      next.airport = null;
      next.flightRoute = null;
      if (target === "place" && id !== previous.place) {
        next.placeTab = "calendar";
        next.placeDate = null;
      }
      next.place = target === "place" ? id : null;
      next.route = target === "route" ? id : null;
      next.waypoint = null;
      next.day = target === "day" ? validDate(id, "all") : null;
      next.dayFrom = null;
      next.eventId = null;
      next.eventTab = "schedule";
      next.eventAgenda = null;
      next.eventFrom = null;
      if (target === "day") {
        next.calendarOpen = true;
        next.date = validDate(id, next.scope);
      }
      if (["place", "route"].includes(target)) next.mapMode = "new-zealand";
      else if (target === "day" && next.day) next.mapMode = mapModeForDate(next.day);
      if (["place", "route", "day"].includes(target)) next.mapView = null;
      next.front = "right";
      next.focus = target === "place" ? { kind: "place", value: id, token: (previous.focus?.token ?? 0) + 1 }
        : target === "route" ? { kind: "route", value: id, token: (previous.focus?.token ?? 0) + 1 }
        : target === "day" && next.day ? { kind: "date", value: next.day, token: (previous.focus?.token ?? 0) + 1 }
          : null;
    } else {
      next.calendarOpen = false;
      next.rightPanel = null;
      next.place = null;
      next.route = null;
      next.waypoint = null;
      next.airport = null;
      next.flightRoute = null;
      next.day = null;
      next.dayFrom = null;
      next.eventId = null;
      next.eventTab = "schedule";
      next.eventAgenda = null;
      next.eventFrom = null;
      next.bagNote = null;
      next.front = null;
      next.focus = null;
    }
    if (!((next.rightPanel === "camera" && next.cameraView === "album")
      || (next.rightPanel === "place" && next.placeTab === "photos"))) {
      next.mediaId = null;
      next.mediaTab = "info";
    }
    const nextWaypoint = getAdventureWaypoint(next.waypoint);
    if (next.rightPanel !== "bag-stay") next.stayFrom = null;
    if (next.rightPanel !== "event" && !(next.rightPanel === "bag-stay" && next.stayFrom === "event")) {
      next.eventAgenda = null;
    }
    if (next.rightPanel !== "route" || !nextWaypoint || nextWaypoint.routeId !== next.route) next.waypoint = null;
    if ((next.fullscreen === "right" && !next.rightPanel) || (next.fullscreen === "calendar" && !next.calendarOpen)) next.fullscreen = null;
    if (previous.fullscreen === "calendar" && ["day", "event"].includes(target)) next.fullscreen = "right";
    current.current = next;
    writeLocation(next);
    transitionAdventurePane(previous, next, () => setView(next));
  }, []);
  return [view, navigate];
}
