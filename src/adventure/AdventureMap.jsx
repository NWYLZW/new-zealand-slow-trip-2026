import { useEffect, useLayoutEffect, useRef } from "react";
import * as d3 from "d3";
import geo from "./data/coastline.json";
import { adventureStops } from "./adventureData";
import { drawWaterLabels } from "./pencil/drawWaterLabels";
import { drawBathymetry } from "./drawBathymetry";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "./SketchIcons";
import { GameIconButton } from "./GameIconButton";
import { projectedRoutePath, routeGeometryLabel, focusLocationPositions } from "./adventureRoutes";
import { useAdventureRoutes } from "./AdventureResolvedRoutes.jsx";
import { routeFocusPositions } from "./adventureHotelRoutes";
import { createPencilMap } from "./pencil/drawPencilMap";
import { createPencilRoutes, routeBadge } from "./pencil/drawPencilRoutes";
import { fillStopLabel, mapLabel, textCacheReady } from "./pencil/mapLabels";
import { observeCanvasRecovery, repaintCanvasTree, setCanvasRepaint } from "./pencil/canvasRecovery";
import { createStopMarker } from "./pencil/stopMarker";
import { drawPencilWash } from "./pencil/wash";
import { stroke as pencilStroke } from "./pencil/brush";
import { pencilPalette } from "./pencil/palette";
import { adventureWaypoints, getRouteWaypoints } from "./adventureWaypoints";
import { clusterMapNodes } from "./adventureClusters";
import { AdventureMapScale } from "./AdventureMapScale";
import { createInternationalMapLayer, INTERNATIONAL_MIN_ZOOM,
  internationalOverviewPositions } from "./createInternationalMapLayer";
import { loadTownMapData, townMapCoverages } from "./townMapData";
import { createMapNodeTapTracker, usesTouchNodeNavigation } from "./mapNodeGesture";
import "./route-ink.css";
import "./pencil-map.css";

const rings = geo.features[0].geometry.coordinates.map((polygon) => polygon[0]);
const features = rings.map((ring) => {
  const feature = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] } };
  if (d3.geoArea(feature) > 2 * Math.PI) feature.geometry.coordinates = [ring.slice().reverse()];
  return feature;
});
// Put the projection seam away from New Zealand so sourced sea geometry can
// extend east across 180° without jumping to the other side of the world.
const base = d3.geoMercator().rotate([-172, 0])
  .fitExtent([[0, 0], [600, 700]], { type: "FeatureCollection", features });
const samples = rings.flat().map(base);
const minX = d3.min(samples, (p) => p[0]), maxX = d3.max(samples, (p) => p[0]);
const minY = d3.min(samples, (p) => p[1]), maxY = d3.max(samples, (p) => p[1]);
const southSamples = rings[0].map(base);
const southCenter = [
  (d3.min(southSamples, (p) => p[0]) + d3.max(southSamples, (p) => p[0])) / 2,
  (d3.min(southSamples, (p) => p[1]) + d3.max(southSamples, (p) => p[1])) / 2,
];
const mapScale = (width, height) => Math.min(
  (width - (width < 650 ? 40 : 80)) / (maxX - minX),
  (height - (height < 500 ? 68 : 110)) / (maxY - minY),
);
const PLACE_ZOOM = 10;
const MIN_ZOOM = .25;
const MAX_DETAIL_ZOOM = 384;
const FOCUS_DURATION = 850;
const EARTH_RADIUS_M = 6371008.8;
const TOWN_SCALE_METERS = 500;
const LOCAL_DETAIL_500M_PIXELS = 36;

function panelPixels(value, total) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  return value.trim().endsWith("%") ? total * amount / 100 : amount;
}

function visibleMapRect(area, { sideOpen, calendarOpen }) {
  const width = area.clientWidth, height = area.clientHeight;
  const style = getComputedStyle(area.parentElement);
  const side = sideOpen ? panelPixels(style.getPropertyValue("--trip-side-width"), width) : 0;
  const bottom = calendarOpen ? panelPixels(style.getPropertyValue("--trip-calendar-height"), height) : 0;
  const right = Math.max(1, width - side), lower = Math.max(1, height - bottom);
  return { width: right, height: lower, center: [right / 2, lower / 2] };
}

function niceScaleDistance(maxMeters) {
  if (!Number.isFinite(maxMeters) || maxMeters <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(maxMeters));
  for (const factor of [5, 2, 1]) {
    const candidate = factor * power;
    if (candidate <= maxMeters) return candidate;
  }
  return power / 2;
}

function formatScaleDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km < 10 && !Number.isInteger(km) ? km.toFixed(1) : Math.round(km)} km`;
}

function segmentTouchesRect(from, to, rect) {
  const bounds = { left: rect.left - 2, right: rect.right + 2, top: rect.top - 2, bottom: rect.bottom + 2 };
  const dx = to.x - from.x, dy = to.y - from.y;
  let near = 0, far = 1;
  for (const [p, q] of [
    [-dx, from.x - bounds.left], [dx, bounds.right - from.x],
    [-dy, from.y - bounds.top], [dy, bounds.bottom - from.y],
  ]) {
    if (!p) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > far) return false; near = Math.max(near, t); }
    else { if (t < near) return false; far = Math.min(far, t); }
  }
  return near <= far;
}

function positionOverviewLabels(area, markers) {
  const labels = markers.map(({ button, tag }) => ({
    tag, button, label: button.querySelector(".trip-stop-label"),
    leader: button.querySelector(".trip-stop-leader"),
  }));
  for (const { label, leader } of labels) {
    for (const property of ["left", "right", "top", "transform", "visibility"]) {
      label.style.removeProperty(property);
    }
    leader.style.display = "none";
  }
  const viewport = area.getBoundingClientRect();
  const dots = labels.map(({ button }) => button.querySelector(".trip-stop-dot").getBoundingClientRect());
  const placed = [...area.querySelectorAll('.trip-map-controls,.trip-map-orientation')]
    .filter(element => !element.hidden).map(element => element.getBoundingClientRect());
  const placedLeaders = [];
  const overlaps = (a, b) => a.left < b.right + 2 && a.right + 2 > b.left &&
    a.top < b.bottom + 2 && a.bottom + 2 > b.top;
  const ordered = labels.map((entry, index) => ({
    ...entry, dot: dots[index], size: entry.label.getBoundingClientRect(),
    buttonWidth: entry.button.clientWidth, buttonHeight: entry.button.clientHeight,
  }));

  for (const { label, leader, dot, size, buttonWidth, buttonHeight } of ordered) {
    const x = (dot.left + dot.right) / 2, y = (dot.top + dot.bottom) / 2;
    if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) {
      label.style.visibility = "hidden";
      continue;
    }
    const side = size.width / 2 + 18;
    const candidates = [
      [0, 22], [0, -22], [-side, 0], [side, 0],
      [-side, -20], [side, -20], [-side, 20], [side, 20],
      [0, 38], [0, -38], [-side - 18, 0], [side + 18, 0],
      [-side - 18, -22], [side + 18, -22], [-side - 18, 22], [side + 18, 22],
      [0, 52], [0, -52], [-side - 34, -28], [side + 34, -28],
      [-side - 34, 28], [side + 34, 28],
    ];
    let chosen = null, fallback = null;
    for (const [dx, dy] of candidates) {
      const rect = {
        left: x + dx - size.width / 2, right: x + dx + size.width / 2,
        top: y + dy - size.height / 2, bottom: y + dy + size.height / 2,
      };
      if (rect.left < viewport.left + 3 || rect.right > viewport.right - 3 ||
        rect.top < viewport.top + 3 || rect.bottom > viewport.bottom - 3) continue;
      if (dots.some((other) => overlaps(rect, other)) || placed.some((other) => overlaps(rect, other)) ||
        placedLeaders.some(({ from, to }) => segmentTouchesRect(from, to, rect))) continue;
      const distance = Math.hypot(dx, dy);
      let connector = null;
      if (distance > 25) {
        const ux = dx / distance, uy = dy / distance;
        const toLabelEdge = Math.min(
          ux ? size.width / 2 / Math.abs(ux) : Infinity,
          uy ? size.height / 2 / Math.abs(uy) : Infinity,
        );
        const start = 22, end = distance - toLabelEdge - 2;
        if (end > start + 2) connector = {
          from: { x: x + ux * start, y: y + uy * start },
          to: { x: x + ux * end, y: y + uy * end }, ux, uy, length: end - start,
        };
      }
      const option = { offset: [dx, dy], rect, connector };
      fallback ??= option;
      if (connector && (dots.some((other) => other !== dot && segmentTouchesRect(connector.from, connector.to, other)) ||
        placed.some((other) => segmentTouchesRect(connector.from, connector.to, other)))) continue;
      chosen = option;
      break;
    }
    chosen ??= fallback && { ...fallback, connector: null };
    if (!chosen) {
      label.style.visibility = "hidden";
      continue;
    }
    placed.push(chosen.rect);
    if (chosen.connector) placedLeaders.push(chosen.connector);
    label.style.left = `${buttonWidth / 2 + chosen.offset[0]}px`;
    label.style.right = "auto";
    label.style.top = `${buttonHeight / 2 + chosen.offset[1]}px`;
    label.style.transform = "translate(-50%, -50%)";
    label.style.visibility = "visible";
    if (chosen.connector) {
      const { from, ux, uy, length } = chosen.connector;
      leader.style.left = `${buttonWidth / 2 + from.x - x}px`;
      leader.style.top = `${buttonHeight / 2 + from.y - y}px`;
      leader.style.width = `${length}px`;
      leader.style.transform = `rotate(${Math.atan2(uy, ux) * 180 / Math.PI}deg)`;
      leader.style.display = "block";
    }
  }
}

export function AdventureMap({ selected, selectedRoute, selectedWaypoint, focusLocations, focusRoute, focusKey,
  focusNode, mapView, onMapViewChange,
  calendarOpen, sideOpen, language = "zh", onSelect, onRouteSelect, onWaypointSelect, onClusterSelect,
  onInternationalNodeSelect, mapMode = "new-zealand", onMapModeChange, onClear, obscured = false }) {
  const routes = useAdventureRoutes();
  const container = useRef(null);
  const controls = useRef(null);
  const scaleControl = useRef(null);
  const state = useRef({ selected, selectedRoute, selectedWaypoint, focusLocations, focusRoute, focusKey, focusNode, mapView,
    calendarOpen, sideOpen, language, onSelect, onRouteSelect, onWaypointSelect, onClusterSelect,
    onInternationalNodeSelect, mapMode, onMapModeChange, onMapViewChange });
  state.current = { routes, selected, selectedRoute, selectedWaypoint, focusLocations, focusRoute, focusKey, focusNode, mapView, obscured,
    calendarOpen, sideOpen, language, onSelect, onRouteSelect, onWaypointSelect, onClusterSelect,
    onInternationalNodeSelect, mapMode, onMapModeChange, onMapViewChange };
  useEffect(() => {
    container.current.querySelectorAll(".trip-stop").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tag === selected));
    });
    controls.current?.selectRoutes({ selected, selectedRoute });
    container.current.querySelectorAll(".trip-route-hit").forEach((path) => {
      path.setAttribute("aria-pressed", String(path.dataset.route === selectedRoute));
    });
    controls.current?.selectWaypoints({ selectedRoute, selectedWaypoint });
  }, [selected, selectedRoute, selectedWaypoint]);
  useEffect(() => { controls.current?.updateViewport(); }, [calendarOpen, sideOpen, obscured]);
  useEffect(() => { controls.current?.setMapMode(mapMode); }, [mapMode]);
  useEffect(() => { if (mapView) controls.current?.restoreMapView(mapView); },
    [mapView?.zoom, mapView?.center?.[0], mapView?.center?.[1]]);
  useEffect(() => { controls.current?.updateInternational(); }, [language]);
  useEffect(() => {
    if (selected) controls.current?.focusPlace(selected);
    else if (focusLocations) controls.current?.focusLocations(focusLocations);
    else if (focusRoute) controls.current?.focusRoute(focusRoute);
    else controls.current?.cancelFocus();
  }, [focusKey]);
  useEffect(() => {
    if (focusNode?.key) controls.current?.focusNode(focusNode.key);
  }, [focusNode?.key, focusNode?.token]);
  useLayoutEffect(() => { controls.current?.updateRoutes(); }, [routes, selectedRoute, focusLocations, focusRoute]);
  useEffect(() => {
    const area = container.current, svg = d3.select(area.querySelector("svg.trip-map"));
    const sea = d3.select(area.querySelector("svg.trip-depth-map"));
    const canvas = area.querySelector("canvas.trip-pencil-map");
    const routeCanvas = area.querySelector("canvas.trip-pencil-routes");
    const internationalCanvas = area.querySelector("canvas.trip-international-map");
    const internationalRouteCanvas = area.querySelector("canvas.trip-international-routes");
    const internationalButtons = area.querySelector(".trip-international-points");
    const buttons = area.querySelector(".trip-point-buttons");
    const surface = d3.select(area);
    let world, depthWorld, pencil, routeInk, international, waterLabels, markerPositions = [], layout = null, shortRouteSpot = null;
    let renderedRoutes = null, hotelMarkers = [], privateView = false, publicView = null;
    let view = d3.zoomIdentity, focusing = false, userMoved = false, viewFrame = 0, pendingView = null;
    let activeMapMode = state.current.mapMode, newZealandView = null;
    let restoringMapView = null, lastPublishedMapView = null;
    let lastClusterZoom = Number.NaN, lastClusterSignature = "", lastWaterLabelZoom = Number.NaN;
    let townLoadGeneration = 0, townTagSignature = "";
    let pencilProject = null, pencilWidth = 0, pencilHeight = 0;
    let focusTarget = null;
    let recoveryPending = false;
    const stats = area._mapStats = { layoutBuilds: 0, sameSizeSkips: 0, viewFrames: 0, settles: 0, zoomNoops: 0 };
    const sameTransform = (a, b) => a && b && Math.abs(a.k - b.k) < 1e-9 &&
      Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
    const focusRect = () => visibleMapRect(area, state.current);
    const initialView = (width, height, rect) => {
      const scale = mapScale(width, height);
      const focusX = (southCenter[0] - (minX + maxX) / 2) * scale + width / 2;
      const focusY = (southCenter[1] - (minY + maxY) / 2) * scale + height / 2;
      const zoomLevel = 2.16;
      return d3.zoomIdentity.translate(rect.center[0] - focusX * zoomLevel,
        rect.center[1] - focusY * zoomLevel).scale(zoomLevel);
    };
    const placeView = (position, rect) => d3.zoomIdentity
      .translate(rect.center[0] - position[0] * PLACE_ZOOM,
        rect.center[1] - position[1] * PLACE_ZOOM).scale(PLACE_ZOOM);
    const townZoom = (stop, project, rect) => {
      const [lat, lng] = stop.position;
      const longitudeOffset = TOWN_SCALE_METERS / (EARTH_RADIUS_M * Math.cos(lat * Math.PI / 180)) * 180 / Math.PI;
      const from = project([lng, lat]), to = project([lng + longitudeOffset, lat]);
      const projectedMeters = Math.abs(to[0] - from[0]);
      const targetPixels = Math.min(92, Math.max(68, rect.width * .16));
      return Math.min(MAX_DETAIL_ZOOM, Math.max(PLACE_ZOOM, targetPixels / Math.max(.001, projectedMeters)));
    };
    const townView = (marker, rect) => {
      const zoomLevel = townZoom(marker.stop, area._project, rect);
      return d3.zoomIdentity.translate(rect.center[0] - marker.position[0] * zoomLevel,
        rect.center[1] - marker.position[1] * zoomLevel).scale(zoomLevel);
    };
    const locationsView = (positions, project, rect, minZoom = MIN_ZOOM) => {
      const points = positions.map(project);
      const left = d3.min(points, point => point[0]), right = d3.max(points, point => point[0]);
      const top = d3.min(points, point => point[1]), bottom = d3.max(points, point => point[1]);
      const padX = Math.min(80, rect.width * .15), padY = Math.min(90, rect.height * .15);
      const k = Math.max(minZoom, Math.min(PLACE_ZOOM,
        Math.max(1, rect.width - padX * 2) / Math.max(1, right - left),
        Math.max(1, rect.height - padY * 2) / Math.max(1, bottom - top)));
      return d3.zoomIdentity.translate(rect.center[0] - (left + right) / 2 * k,
        rect.center[1] - (top + bottom) / 2 * k).scale(k);
    };
    const normalizeMapView = value => {
      const zoomLevel = Number(value?.zoom), center = value?.center;
      if (!Number.isFinite(zoomLevel) || !Array.isArray(center) || center.length !== 2 ||
        !center.every(Number.isFinite) || Math.abs(center[0]) > 85 || Math.abs(center[1]) > 180) return null;
      return { zoom: Math.max(Math.min(MIN_ZOOM, INTERNATIONAL_MIN_ZOOM), Math.min(MAX_DETAIL_ZOOM, zoomLevel)),
        center: [center[0], center[1]] };
    };
    const mapViewTransform = (value, projection = area._project) => {
      const normalized = normalizeMapView(value);
      if (!normalized || !projection) return null;
      const rect = focusRect(), center = projection([normalized.center[1], normalized.center[0]]);
      return { normalized, transform: d3.zoomIdentity.translate(rect.center[0] - center[0] * normalized.zoom,
        rect.center[1] - center[1] * normalized.zoom).scale(normalized.zoom) };
    };
    const settledMapView = transform => {
      if (!area._unproject) return null;
      const coordinate = area._unproject(transform.invert(focusRect().center));
      if (!coordinate?.every(Number.isFinite)) return null;
      return { zoom: transform.k, center: [coordinate[1], coordinate[0]] };
    };
    const equivalentMapView = (left, right) => Boolean(left && right &&
      Math.abs(left.zoom - right.zoom) < .0001 &&
      Math.abs(left.center[0] - right.center[0]) < .000001 &&
      Math.abs(left.center[1] - right.center[1]) < .000001);
    const publishMapView = transform => {
      // A hotel-centered view must not copy private coordinates into URL/history.
      if (privateView || state.current.routes.some(route => route.hotelEndpoints)) return;
      const next = settledMapView(transform);
      if (!next) return;
      if (equivalentMapView(next, restoringMapView)) {
        restoringMapView = null; lastPublishedMapView = next; return;
      }
      restoringMapView = null;
      if (equivalentMapView(next, lastPublishedMapView)) return;
      lastPublishedMapView = next;
      state.current.onMapViewChange?.(next);
    };
    const updateScale = () => {
      if (!area._unproject || !scaleControl.current) return;
      const rect = focusRect(), maxPixels = Math.min(112, Math.max(58, rect.width * .22));
      const orientation = area.querySelector(".trip-map-orientation");
      const orientationStyle = orientation ? getComputedStyle(orientation) : null;
      const gap = Number.parseFloat(orientationStyle?.columnGap) || 0;
      const compassWidth = area.querySelector(".trip-map-compass")?.getBoundingClientRect().width ?? 0;
      const rightInset = 18, compassOffset = compassWidth + gap;
      const distanceAt = (width, bottomInset) => {
        const y = Math.max(8, rect.height - bottomInset - 6);
        const x = Math.max(8, rect.width - rightInset - compassOffset - width);
        const from = area._unproject(view.invert([x, y]));
        const to = area._unproject(view.invert([x + width, y]));
        return from && to ? d3.geoDistance(from, to) * EARTH_RADIUS_M : 0;
      };
      const maxMeters = distanceAt(maxPixels, 18);
      if (!maxMeters) return;
      const meters = niceScaleDistance(maxMeters);
      const firstWidth = maxPixels * meters / maxMeters;
      const controlsWidth = area.querySelector(".trip-map-controls")?.getBoundingClientRect().width ?? 0;
      const compactBottomInset = rect.width < controlsWidth + firstWidth + compassOffset + 58 ? 76 : 18;
      const actualMeters = distanceAt(firstWidth, compactBottomInset);
      const width = actualMeters ? firstWidth * meters / actualMeters : firstWidth;
      scaleControl.current.update({
        width,
        text: formatScaleDistance(meters),
        right: area.clientWidth - rect.width + 18,
        bottom: area.clientHeight - rect.height + compactBottomInset,
      });
    };
    let coverageProjection = null, projectedCoverages = [];
    const visibleTownTags = transform => {
      if (!area._project) return [];
      if (coverageProjection !== area._project) {
        coverageProjection = area._project;
        projectedCoverages = townMapCoverages.map(({ tag, position: [lat, lng], radiusMeters }) => {
          const offset = TOWN_SCALE_METERS / (EARTH_RADIUS_M * Math.cos(lat * Math.PI / 180)) * 180 / Math.PI;
          const center = coverageProjection([lng, lat]);
          return { tag, radiusMeters, center, unit: Math.abs(coverageProjection([lng + offset, lat])[0] - center[0]) };
        });
      }
      const rect = focusRect();
      return projectedCoverages.filter(({ center: origin, unit, radiusMeters }) => {
        const center = transform.apply(origin), pixelsPer500m = unit * transform.k;
        if (pixelsPer500m < LOCAL_DETAIL_500M_PIXELS) return false;
        const margin = pixelsPer500m * radiusMeters / TOWN_SCALE_METERS;
        return center[0] > -margin && center[0] < rect.width + margin &&
          center[1] > -margin && center[1] < rect.height + margin;
      }).map(coverage => coverage.tag);
    };
    const syncTownDetails = (transform, moving = false) => {
      const tags = visibleTownTags(transform), signature = tags.join("|");
      pencil?.setVisibleTowns(tags);
      if (!tags.length) { townLoadGeneration++; townTagSignature = ""; return; }
      // Transform cached geometry during gestures; only load new towns at rest.
      if (moving) return;
      if (signature === townTagSignature) return;
      townTagSignature = signature;
      const generation = ++townLoadGeneration;
      Promise.all(tags.map(tag => loadTownMapData(tag).then(payload => [tag, payload])))
        .then(entries => {
          if (generation !== townLoadGeneration) return;
          for (const [tag, payload] of entries) if (payload?.place) pencil?.setTownData(tag, payload.place);
          if (!focusing && !state.current.obscured) pencil?.refine(view);
        }).catch(() => { if (generation === townLoadGeneration) townTagSignature = ""; });
    };
    const clusterSeed = keys => keys.reduce((seed, key) => [...key]
      .reduce((value, letter) => Math.imul(value ^ letter.charCodeAt(0), 16777619), seed), 2166136261) >>> 0;
    const setClusterBadge = (button, count, seed) => {
      let badge = button.querySelector(".trip-cluster-count");
      if (count < 2) { if (badge) badge.hidden = true; return; }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "trip-cluster-count";
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
      }
      badge.hidden = false;
      if (badge.dataset.count === String(count) && badge.dataset.seed === String(seed)) return;
      const sprite = mapLabel(String(count), 12, seed);
      const countCanvas = document.createElement("canvas");
      const size = 18, dpr = Math.min(devicePixelRatio || 1, 2);
      countCanvas.width = countCanvas.height = Math.round(size * dpr);
      countCanvas.style.width = countCanvas.style.height = `${size}px`;
      const countCtx = countCanvas.getContext("2d"); countCtx.scale(dpr, dpr);
      drawPencilWash(countCtx, { x: 0, y: 0, width: size, height: size }, pencilPalette.crop, seed,
        { strength: .92, spacing: 1.25, roughness: 1.4, inset: 1, radius: 9 });
      const ring = Array.from({ length: 37 }, (_, index) => {
        const angle = index / 36 * Math.PI * 2, radius = 7.6 + Math.sin(angle * 5 + seed) * .25;
        return [size / 2 + Math.cos(angle) * radius, size / 2 + Math.sin(angle) * radius];
      });
      pencilStroke(countCtx, ring, pencilPalette.accent, .72, seed + 19,
        { closed: true, passes: 2, breaks: .2, amplitude: .18 });
      countCtx.drawImage(sprite.canvas, (size - sprite.width) / 2, (size - sprite.height) / 2,
        sprite.width, sprite.height);
      countCanvas.setAttribute("aria-hidden", "true");
      setCanvasRepaint(countCanvas, () => {
        delete badge.dataset.count;
        setClusterBadge(button, count, seed);
      });
      badge.replaceChildren(countCanvas); badge.dataset.count = String(count); badge.dataset.seed = String(seed);
    };
    const measureMarkerRadius = marker => {
      const dot = marker.button.querySelector(".trip-stop-dot");
      const normal = dot?.querySelector(".trip-stop-marker--normal");
      const sourceRadius = Number.parseFloat(normal?.dataset.markerRadius);
      const displayWidth = Number.parseFloat(getComputedStyle(dot).width);
      marker.radius = Number.isFinite(sourceRadius) && Number.isFinite(displayWidth)
        ? sourceRadius * displayWidth / 28 : marker.primary ? 10.95 : 9;
    };
    const syncClusters = (force = false) => {
      if (!force && Math.abs(view.k - lastClusterZoom) < .0001) return;
      lastClusterZoom = view.k;
      const internationalMode = activeMapMode === "international";
      const activeMarkers = markerPositions.filter(marker => !marker.international || internationalMode);
      const clusters = clusterMapNodes(activeMarkers.map(marker => {
        const [x, y] = view.apply(marker.position);
        return { key: marker.key, x, y, radius: marker.radius, primary: marker.primary };
      }));
      const signature = clusters.map(cluster => cluster.keys.join("+")).join("|");
      if (!force && signature === lastClusterSignature) return;
      lastClusterSignature = signature;
      const byKey = new Map(markerPositions.map(marker => [marker.key, marker]));
      markerPositions.forEach(marker => {
        marker.button.hidden = Boolean(marker.international && !internationalMode);
        marker.button.classList.remove("trip-cluster");
        delete marker.button.dataset.cluster;
        marker.button.removeAttribute("aria-haspopup");
        marker.button.setAttribute("aria-label", marker.baseLabel);
        setClusterBadge(marker.button, 1, marker.seed);
      });
      clusters.forEach((cluster, index) => {
        if (cluster.keys.length < 2) return;
        const anchor = byKey.get(cluster.anchorKey);
        if (!anchor) return;
        cluster.keys.forEach(key => { if (key !== cluster.anchorKey) byKey.get(key).button.hidden = true; });
        anchor.button.classList.add("trip-cluster");
        anchor.button.dataset.cluster = cluster.keys.join(",");
        anchor.button.setAttribute("aria-haspopup", "dialog");
        anchor.button.setAttribute("aria-label", state.current.language === "en"
          ? `Open ${cluster.keys.length} nearby map places`
          : `查看附近${cluster.keys.length}个地图地点`);
        setClusterBadge(anchor.button, cluster.keys.length, clusterSeed(cluster.keys) + index);
      });
      const airportAnchors = new Map();
      clusters.forEach(cluster => {
        if (cluster.keys.length < 2) return;
        const anchor = byKey.get(cluster.anchorKey);
        if (!anchor) return;
        cluster.keys.filter(key => key.startsWith("a:")).forEach(key => airportAnchors.set(key, anchor.position));
      });
      international?.setClusterAnchors(airportAnchors);
    };
    const syncLayerVisibility = () => {
      const internationalMode = activeMapMode === "international";
      if (internationalMode) { pencil?.pause(); routeInk?.pause(); }
      else if (!state.current.obscured && !document.hidden) pencil?.resume();
      canvas.hidden = internationalMode;
      routeCanvas.hidden = internationalMode;
      world?.attr("display", internationalMode ? "none" : null);
      depthWorld?.attr("display", internationalMode ? "none" : null);
    };
    const ensurePencilMap = () => {
      if (pencil || !pencilProject || !pencilWidth || !pencilHeight) return pencil;
      pencil = createPencilMap(canvas, pencilProject, pencilWidth, pencilHeight, { suspended: state.current.obscured });
      pencil.setVisibleRect(focusRect());
      return pencil;
    };
    const applyView = (transform, { moving = false, settled = false } = {}) => {
      view = transform;
      if (document.hidden || state.current.obscured) return;
      stats.viewFrames++; if (settled) stats.settles++;
      const viewportWidth = layout?.width ?? area.clientWidth;
      const visibleRect = focusRect();
      const internationalMode = activeMapMode === "international";
      if (internationalMode) {
        international?.draw({ view: transform, moving, visibleRect });
      } else {
        pencil?.setVisibleRect(visibleRect);
        world?.attr("transform", transform.toString());
        depthWorld?.attr("transform", transform.toString());
        // Revisit caches belong to the current geographic view, not the last stop.
        syncTownDetails(transform, moving);
        pencil?.draw(transform, { moving });
        routeInk?.draw(transform, { moving, visibleRect });
        if (shortRouteSpot) {
          const { group, middle } = shortRouteSpot;
          group.attr("transform", `translate(${middle}) scale(${1 / transform.k})`);
        }
        if (Math.abs(transform.k - lastWaterLabelZoom) > .0001) {
          waterLabels?.updateZoom(transform.k); lastWaterLabelZoom = transform.k;
        }
        international?.draw({ view: transform, moving, visibleRect });
      }
      markerPositions.filter(marker => !marker.international || internationalMode)
        .forEach(({ button, position }) => {
        const [x, y] = transform.apply(position);
        button.style.left = x + "px";
        button.style.top = y + "px";
        button.dataset.labelSide = x < 110 ? "right" : x > viewportWidth - 110 ? "left" : "center";
        });
      hotelMarkers.forEach(({ button, position }) => {
        button.hidden = internationalMode;
        const [x, y] = transform.apply(position);
        button.style.left = `${x}px`; button.style.top = `${y}px`;
      });
      syncClusters();
      area.dataset.zoom = transform.k.toFixed(3);
      if (!settled) return;
      const visibleMarkers = [...markerPositions, ...hotelMarkers].filter(({ button }) => !button.hidden);
      visibleMarkers.filter(({ waypoint }) => waypoint && waypoint.id !== state.current.selectedWaypoint)
        .forEach(({ button }) => {
          const label = button.querySelector(".trip-stop-label");
          const leader = button.querySelector(".trip-stop-leader");
          label.style.visibility = "hidden";
          leader.style.display = "none";
        });
      const labelledMarkers = visibleMarkers.filter(({ waypoint }) => !waypoint || waypoint.id === state.current.selectedWaypoint);
      positionOverviewLabels(area, labelledMarkers);
      if (!internationalMode) waterLabels?.avoidStops(visibleMarkers);
      updateScale();
    };
    const scheduleView = (transform, moving) => {
      view = transform; pendingView = { transform, moving };
      if (viewFrame) return;
      viewFrame = requestAnimationFrame(() => {
        viewFrame = 0;
        const next = pendingView; pendingView = null;
        if (next) applyView(next.transform, { moving: next.moving });
      });
    };
    const settleView = transform => {
      cancelAnimationFrame(viewFrame); viewFrame = 0; pendingView = null;
      applyView(transform, { moving: false, settled: true });
    };
    const zoom = d3.zoom().scaleExtent([MIN_ZOOM, MAX_DETAIL_ZOOM]).clickDistance(5)
      .filter((event) => (!event.ctrlKey || event.type === "wheel") && !event.button &&
        (event.type === "wheel" || !event.target.closest("button")))
      .on("start", (event) => {
        if (!event.sourceEvent) return;
        surface.interrupt();
        nodeTapTracker.reset();
        area.classList.add("is-dragging");
      })
      .on("zoom", (event) => {
        if (event.sourceEvent) userMoved = true;
        scheduleView(event.transform, Boolean(event.sourceEvent) || focusing);
      })
      .on("end", (event) => {
        area.classList.remove("is-dragging"); settleView(event.transform);
        if (activeMapMode === "new-zealand") newZealandView = event.transform;
        if (!focusing && activeMapMode === "new-zealand") pencil?.refine(view);
        publishMapView(event.transform);
      });
    zoom.scaleExtent([Math.min(MIN_ZOOM, INTERNATIONAL_MIN_ZOOM), MAX_DETAIL_ZOOM]);
    surface.call(zoom);
    const finishFocus = () => {
      focusing = false; focusTarget = null;
      area.dataset.focusing = "false";
      settleView(view);
      if (activeMapMode === "new-zealand") pencil?.refine(view);
    };
    const animateFocus = target => {
      if (sameTransform(focusTarget, target) || (!focusing && sameTransform(view, target))) {
        stats.zoomNoops++; return;
      }
      surface.interrupt();
      userMoved = false;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        (Math.abs(view.k - target.k) < .001 && Math.hypot(view.x - target.x, view.y - target.y) < .1)) {
        surface.call(zoom.transform, target);
        return;
      }
      focusing = true;
      focusTarget = target;
      area.dataset.focusing = "true";
      surface.transition().duration(FOCUS_DURATION).ease(d3.easeCubicInOut)
        .call(zoom.transform, target)
        .on("end.focus", finishFocus)
        .on("interrupt.focus cancel.focus", () => {
          focusing = false; focusTarget = null; area.dataset.focusing = "false";
        });
    };
    const zoomBy = factor => {
      nodeTapTracker.reset(); userMoved = true; surface.interrupt();
      const [minimum, maximum] = zoom.scaleExtent();
      const next = Math.max(minimum, Math.min(maximum, view.k * factor));
      if (Math.abs(next - view.k) < 1e-9) { stats.zoomNoops++; return; }
      surface.call(zoom.scaleTo, next, focusRect().center);
    };
    const setMapMode = mode => {
      const nextMode = mode === "international" ? "international" : "new-zealand";
      if (nextMode === activeMapMode) {
        international?.update({ mapMode: nextMode, language: state.current.language,
          selected: state.current.selected, selectedRoute: state.current.selectedRoute, visibleRect: focusRect() });
        return;
      }
      if (activeMapMode === "new-zealand") newZealandView = view;
      activeMapMode = nextMode;
      state.current.mapMode = nextMode;
      if (nextMode === "new-zealand") ensurePencilMap();
      syncLayerVisibility();
      international?.update({ mapMode: nextMode, language: state.current.language,
        selected: state.current.selected, selectedRoute: state.current.selectedRoute, visibleRect: focusRect() });
      lastClusterZoom = Number.NaN; lastClusterSignature = "";
      syncClusters(true);
      const target = nextMode === "international"
        ? locationsView(internationalOverviewPositions, area._project, focusRect(), INTERNATIONAL_MIN_ZOOM)
        : newZealandView ?? initialView(area.clientWidth, area.clientHeight, focusRect());
      animateFocus(target);
    };
    const activateMarker = (fallback, event) => {
      const clusterKeys = fallback.button.dataset.cluster?.split(",").filter(Boolean);
      if (clusterKeys?.length > 1) {
        state.current.onClusterSelect?.(clusterKeys);
        return;
      }
      let marker = fallback;
      if (event.detail !== 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        marker = markerPositions.filter(item => !item.button.hidden).reduce((nearest, item) => {
          const rect = item.button.getBoundingClientRect();
          const distance = Math.hypot(event.clientX - (rect.left + rect.right) / 2,
            event.clientY - (rect.top + rect.bottom) / 2);
          return !nearest || distance < nearest.distance ? { item, distance } : nearest;
        }, null)?.item ?? fallback;
      }
      if (marker.waypoint) {
        state.current.onWaypointSelect?.(marker.waypoint.id);
        return;
      }
      const reused = getRouteWaypoints(state.current.selectedRoute)
        .find(item => item.reuseStopTag === marker.stop?.tag);
      if (reused) state.current.onWaypointSelect?.(reused.id);
      else if (marker.stop) state.current.onSelect(marker.stop.tag);
    };
    const nodeTapTracker = createMapNodeTapTracker({
      maximumDistance: Infinity,
      matchesTarget: (previous, current) => previous?.key === current?.key
        || (previous?.kind === "cluster"
          && previous.keys.includes(current?.focusKey ?? current?.key)),
    });
    const targetForMarker = marker => {
      if (!marker) return null;
      const clusterKeys = marker.button.dataset.cluster?.split(",").filter(Boolean);
      if (clusterKeys?.length > 1) {
        return { key: `cluster:${clusterKeys.join(",")}`, focusKey: marker.key,
          kind: "cluster", keys: clusterKeys };
      }
      if (marker.international) {
        return { key: marker.key, focusKey: marker.key, kind: "international", id: marker.key };
      }
      if (marker.waypoint) {
        return { key: marker.key, focusKey: marker.key, kind: "waypoint", id: marker.waypoint.id };
      }
      const reused = getRouteWaypoints(state.current.selectedRoute)
        .find(item => item.reuseStopTag === marker.stop?.tag);
      if (reused) {
        return { key: `w:${reused.id}`, focusKey: marker.key, kind: "waypoint", id: reused.id };
      }
      return marker.stop
        ? { key: marker.key, focusKey: marker.key, kind: "place", id: marker.stop.tag }
        : null;
    };
    const activateNodeTarget = target => {
      if (!target) return;
      if (target.kind === "cluster") state.current.onClusterSelect?.(target.keys);
      else if (target.kind === "international") state.current.onInternationalNodeSelect?.(target.id);
      else if (target.kind === "waypoint") state.current.onWaypointSelect?.(target.id);
      else if (target.kind === "place") state.current.onSelect?.(target.id);
    };
    const markerForButton = button => markerPositions.find(marker => marker.button === button);
    const handleTouchNodeClick = event => {
      if (!usesTouchNodeNavigation(window) || event.detail === 0) return;
      const button = event.target.closest?.(".trip-stop");
      const marker = button ? markerForButton(button) : null;
      const target = targetForMarker(marker);
      const result = nodeTapTracker.tap({
        target,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
      });
      if (result.action === "ignore") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (result.action === "activate") activateNodeTarget(result.target);
      else controls.current?.focusNode(result.target.focusKey);
    };
    const suppressTouchDoubleClick = event => {
      if (!usesTouchNodeNavigation(window)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const resetTouchNodeTap = () => nodeTapTracker.reset();
    const resetMultiTouchNodeTap = event => {
      if (event.touches?.length > 1) nodeTapTracker.reset();
    };
    area.addEventListener("click", handleTouchNodeClick, true);
    area.addEventListener("dblclick", suppressTouchDoubleClick, true);
    area.addEventListener("pointercancel", resetTouchNodeTap, true);
    area.addEventListener("touchcancel", resetTouchNodeTap, true);
    area.addEventListener("touchstart", resetMultiTouchNodeTap, true);
    const syncWaypointMarkers = ({ selectedRoute: routeId, selectedWaypoint: waypointId }) => {
      const routeWaypoints = getRouteWaypoints(routeId);
      markerPositions.forEach((marker) => {
        if (marker.international) return;
        const { button, waypoint, stop, primaryMarker, waypointMarker } = marker;
        if (waypoint) {
          button.hidden = false;
          marker.baseLabel = `查看途经点：${waypoint.name}`;
          button.setAttribute("aria-pressed", String(waypoint.id === waypointId));
          return;
        }
        const reused = stop && routeWaypoints.find(item => item.reuseStopTag === stop.tag);
        button.classList.toggle("trip-waypoint-reused", Boolean(reused));
        if (reused) {
          const currentMarker = button.querySelector(".trip-stop-dot");
          if (waypointMarker && currentMarker !== waypointMarker) {
            currentMarker?.replaceWith(waypointMarker); measureMarkerRadius(marker);
          }
          button.dataset.waypoint = reused.id;
          marker.baseLabel = `查看途经点：${reused.name}`;
          button.setAttribute("aria-pressed", String(reused.id === waypointId));
        } else {
          const currentMarker = button.querySelector(".trip-stop-dot");
          if (primaryMarker && currentMarker !== primaryMarker) {
            currentMarker?.replaceWith(primaryMarker); measureMarkerRadius(marker);
          }
          delete button.dataset.waypoint;
          marker.baseLabel = stop.name;
          button.setAttribute("aria-pressed", String(stop.tag === state.current.selected));
        }
      });
    };
    controls.current = {
      updateRoutes: () => {
        if (!area._project || !world || !layout) return;
        const wasPrivate = privateView;
        const nowPrivate = state.current.routes.some(route => route.hotelEndpoints);
        if (nowPrivate && !wasPrivate) publicView = settledMapView(view);
        // Refresh only route ink and its hit geometry. Terrain and the user's view stay intact.
        if (renderedRoutes !== state.current.routes) {
          surface.interrupt();
          drawRoutes(area._project, layout.width, layout.height);
        }
        if (wasPrivate && !nowPrivate) {
          const restored = mapViewTransform(publicView)?.transform
            ?? initialView(layout.width, layout.height, focusRect());
          newZealandView = activeMapMode === "new-zealand" ? restored
            : initialView(layout.width, layout.height, focusRect());
          surface.call(zoom.transform, restored);
          publicView = null;
        }
        privateView = nowPrivate;
        syncHotelMarkers(area._project);
        settleView(view);
      },
      cancelFocus: () => { surface.interrupt(); finishFocus(); },
      selectRoutes: (selection) => {
        if (activeMapMode === "new-zealand") routeInk?.select(selection);
        international?.select(selection);
      },
      selectWaypoints: ({ selectedRoute: routeId, selectedWaypoint: waypointId }) => {
        syncWaypointMarkers({ selectedRoute: routeId, selectedWaypoint: waypointId });
        lastClusterZoom = Number.NaN; lastClusterSignature = "";
        applyView(view, { settled: true });
      },
      updateScale,
      updateViewport: () => {
        if (document.hidden || state.current.obscured) {
          pencil?.pause(); routeInk?.pause(); international?.pause(); return;
        }
        pencil?.resume();
        if (recoveryPending) {
          recoveryPending = false;
          repaintCanvasTree(area); pencil?.recover(); routeInk?.recover(); international?.recover();
        }
        const visibleRect = focusRect();
        if (activeMapMode === "international") international?.draw({ view, moving: false, visibleRect });
        else {
          pencil?.setVisibleRect(visibleRect);
          routeInk?.draw(view, { moving: false, visibleRect });
          international?.draw({ view, moving: false, visibleRect });
        }
        updateScale();
        if (!focusing && activeMapMode === "new-zealand") pencil?.refine(view);
      },
      setMapMode,
      updateInternational: () => international?.update({ language: state.current.language,
        selected: state.current.selected, selectedRoute: state.current.selectedRoute,
        mapMode: activeMapMode, visibleRect: focusRect() }),
      restoreMapView: value => {
        const restored = mapViewTransform(value);
        if (!restored) return;
        const current = settledMapView(view);
        if (equivalentMapView(current, restored.normalized)) return;
        restoringMapView = restored.normalized;
        surface.interrupt().call(zoom.transform, restored.transform);
      },
      zoomIn: () => zoomBy(1.35),
      zoomOut: () => zoomBy(1 / 1.35),
      reset: () => {
        nodeTapTracker.reset();
        userMoved = true;
        surface.interrupt();
        const target = activeMapMode === "international"
          ? locationsView(internationalOverviewPositions, area._project, focusRect(), INTERNATIONAL_MIN_ZOOM)
          : initialView(area.clientWidth, area.clientHeight, focusRect());
        if (sameTransform(view, target)) { stats.zoomNoops++; return; }
        surface.call(zoom.transform, target);
      },
      focusPlace: (tag) => {
        const marker = markerPositions.find((item) => item.tag === tag);
        if (!marker) return;
        animateFocus(placeView(marker.position, focusRect()));
      },
      focusTown: (tag) => {
        const marker = markerPositions.find((item) => item.stop?.tag === tag);
        if (!marker || !area._project) return;
        animateFocus(townView(marker, focusRect()));
      },
      focusNode: key => {
        const marker = markerPositions.find(item => item.key === key);
        if (!marker) return;
        const rect = focusRect();
        animateFocus(d3.zoomIdentity.translate(rect.center[0] - marker.position[0] * PLACE_ZOOM,
          rect.center[1] - marker.position[1] * PLACE_ZOOM).scale(PLACE_ZOOM));
      },
      focusLocations: (focus) => {
        const positions = focusLocationPositions(focus, state.current.routes);
        if (!area._project || !positions.length) return;
        animateFocus(locationsView(positions, area._project, focusRect()));
      },
      focusRoute: (id) => {
        const route = state.current.routes.find(item => item.id === id);
        if (!route || !area._project) return;
        const positions = routeFocusPositions(route);
        animateFocus(locationsView(positions, area._project, focusRect()));
      },
    };
    function syncHotelMarkers(project) {
      hotelMarkers.forEach(({ button }) => button.remove());
      hotelMarkers = [];
      const ids = state.current.selectedRoute ? [state.current.selectedRoute]
        : state.current.focusLocations?.routeIds ?? (state.current.focusRoute ? [state.current.focusRoute] : []);
      const endpoints = new Map();
      state.current.routes.filter(route => ids.includes(route.id)).forEach(route => {
        Object.entries(route.hotelEndpoints ?? {}).forEach(([side, endpoint]) => {
          if (!endpoint) return;
          const current = endpoints.get(endpoint.bookingId);
          if (current) current.sides.add(side);
          else endpoints.set(endpoint.bookingId, { ...endpoint, sides: new Set([side]) });
        });
      });
      for (const endpoint of endpoints.values()) {
        const en = state.current.language === "en";
        const role = endpoint.sides.size > 1 ? (en ? "Start / finish hotel" : "起终点 · 酒店")
          : endpoint.sides.has("origin") ? (en ? "Start hotel" : "起点 · 酒店") : (en ? "Destination hotel" : "终点 · 酒店");
        const button = document.createElement("button");
        button.type = "button"; button.className = "trip-stop trip-route-hotel";
        button.dataset.routeHotel = endpoint.bookingId;
        button.setAttribute("aria-label", `${role}: ${endpoint.name}`);
        const position = project([endpoint.position[1], endpoint.position[0]]);
        const label = document.createElement("span"); label.className = "trip-stop-label";
        fillStopLabel(label, role, 9801 + hotelMarkers.length);
        label.setAttribute("aria-hidden", "true");
        const leader = document.createElement("span"); leader.className = "trip-stop-leader";
        leader.setAttribute("aria-hidden", "true");
        button.append(leader, createStopMarker(9801 + hotelMarkers.length, { type: "town", iconType: "hotel" }), label);
        button.onclick = event => { event.stopPropagation(); animateFocus(placeView(position, focusRect())); };
        buttons.append(button);
        hotelMarkers.push({ button, position, tag: endpoint.bookingId });
      }
    }
    function drawRoutes(project, width, height) {
      world.select(".trip-routes").remove();
      shortRouteSpot = null;
      const routesLayer = world.append("g").attr("class", "trip-routes");
      const routeEntries = [];
      [...state.current.routes].filter(route => !international.handledRouteIds.has(route.id))
        .sort((a, b) => Number(b.transport === "flight") - Number(a.transport === "flight")).forEach((route) => {
        const path = projectedRoutePath(route, project);
        const group = routesLayer.append("g").attr("class", "trip-route-group")
          .on("pointerenter", () => routeInk?.hover(route.id))
          .on("pointerleave", () => routeInk?.hover(null))
          .on("focusin", () => routeInk?.hover(route.id))
          .on("focusout", () => routeInk?.hover(null));
        group.append("title").text(`${route.date} · ${route.label}（${routeGeometryLabel(route)}）`);
        const hitPath = group.append("path").attr("d", path).attr("class", "trip-route-hit")
          .attr("data-route", route.id).attr("role", "button").attr("tabindex", 0)
          .attr("data-geometry", route.roadGeometry ? "road-network" : "schematic")
          .attr("data-transport", route.transport)
          .attr("aria-label", `查看路线：${route.label}`)
          .attr("aria-pressed", String(route.id === state.current.selectedRoute))
          .on("click", (event) => {
            event.stopPropagation();
            if (!event.defaultPrevented) state.current.onRouteSelect(route.id);
          })
          .on("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault(); event.stopPropagation();
            state.current.onRouteSelect(route.id);
          });
        routeEntries.push({ route, path, points: route.roadGeometry?.coordinates.map(project), hitPath: hitPath.node() });
        if (route.id === "zqn-wanaka") {
          const first = project([route.points[0][1], route.points[0][0]]);
          const last = project([route.points.at(-1)[1], route.points.at(-1)[0]]);
          const dx = last[0] - first[0], dy = last[1] - first[1], length = Math.hypot(dx, dy) || 1;
          const point = hitPath.node(), midpoint = point.getPointAtLength(point.getTotalLength() / 2);
          const middle = [midpoint.x, midpoint.y], normal = [-dy / length, dx / length];
          const center = normal.map(value => value * 35);
          const spot = group.append("g").attr("class", "trip-short-route-spot").attr("aria-hidden", "true");
          shortRouteSpot = { group: spot, middle };
          spot.append("image").attr("class", "trip-short-route-art")
            .attr("href", routeBadge(route.date, normal)).attr("x", -56).attr("y", -56).attr("width", 112).attr("height", 112);
          spot.append("circle").attr("class", "trip-short-route-tap")
            .attr("cx", center[0]).attr("cy", center[1]).attr("r", 22)
            .on("click", event => {
              event.stopPropagation();
              if (!event.defaultPrevented) state.current.onRouteSelect(route.id);
            });
        }
      });
      routeInk?.dispose();
      routeInk = createPencilRoutes(routeCanvas, routeEntries, width, height);
      routeInk.select(state.current);
      renderedRoutes = state.current.routes;
    }
    function draw() {
      const width = area.clientWidth, height = area.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (layout?.width === width && layout?.height === height && layout.dpr === dpr) {
        stats.sameSizeSkips++;
        return;
      }
      stats.layoutBuilds++;
      const resumeFocus = focusing;
      surface.interrupt();
      // Reproject only on a real viewport resize; the calendar overlays this viewport.
      const scale = mapScale(width, height);
      const project = (point) => {
        const [x, y] = base(point);
        return [(x - (minX + maxX) / 2) * scale + width / 2, (y - (minY + maxY) / 2) * scale + height / 2];
      };
      const unproject = (point) => base.invert([
        (point[0] - width / 2) / scale + (minX + maxX) / 2,
        (point[1] - height / 2) / scale + (minY + maxY) / 2,
      ]);
      svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
      sea.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
      shortRouteSpot = null;
      waterLabels = null;
      world = svg.append("g").attr("class", "trip-world");
      depthWorld = sea.append("g").attr("class", "trip-depth-world");
      drawBathymetry(depthWorld, project);
      pencil?.dispose();
      pencil = null;
      townLoadGeneration++; townTagSignature = '';
      pencilProject = project;
      pencilWidth = width;
      pencilHeight = height;
      if (activeMapMode === "new-zealand") ensurePencilMap();
      if (state.current.obscured) pencil?.pause();
      international?.dispose();
      international = createInternationalMapLayer({
        baseCanvas: internationalCanvas,
        routeCanvas: internationalRouteCanvas,
        markerHost: internationalButtons,
        project,
        width,
        height,
        language: state.current.language,
        onNodeSelect: key => state.current.onInternationalNodeSelect?.(key),
        onRouteSelect: id => state.current.onRouteSelect?.(id),
        onViewChange: mode => {
          state.current.onMapModeChange?.(mode);
          setMapMode(mode);
        },
      });
      international.update({ mapMode: activeMapMode, language: state.current.language,
        selected: state.current.selected, selectedRoute: state.current.selectedRoute,
        theme: document.documentElement.dataset.adventureAppearance ?? "", width, height, visibleRect: focusRect() });
      drawRoutes(project, width, height);
      waterLabels = drawWaterLabels(world, project);
      buttons.replaceChildren();
      markerPositions = [];
      adventureStops.forEach((stop) => {
        const [x, y] = project([stop.position[1], stop.position[0]]);
        const button = document.createElement("button");
        button.type = "button"; button.className = "trip-stop"; button.dataset.tag = stop.tag;
        button.style.left = x + "px"; button.style.top = y + "px";
        button.setAttribute("aria-label", stop.name);
        button.setAttribute("aria-pressed", String(stop.tag === state.current.selected));
        const markerSeed = 7201 + markerPositions.length * 97;
        const dot = createStopMarker(markerSeed, { type: "primary" });
        const reusedWaypoint = adventureWaypoints.find(item => item.reuseStopTag === stop.tag);
        const waypointMarker = reusedWaypoint ? createStopMarker(markerSeed, {
          type: reusedWaypoint.markerType, iconType: reusedWaypoint.iconType,
        }) : null;
        const label = document.createElement("span"); label.className = "trip-stop-label";
        fillStopLabel(label, stop.name.split(" · ")[0], 6100 + markerPositions.length, { persistence: 'public' });
        label.setAttribute("aria-hidden", "true");
        const leader = document.createElement("span"); leader.className = "trip-stop-leader"; leader.setAttribute("aria-hidden", "true");
        button.append(leader, dot, label);
        const marker = { button, position: [x, y], tag: stop.tag, key: `p:${stop.tag}`, primary: true,
          stop, primaryMarker: dot, waypointMarker, baseLabel: stop.name, seed: markerSeed };
        button.onclick = event => activateMarker(marker, event);
        button.ondblclick = event => {
          event.preventDefault(); event.stopPropagation();
          controls.current?.focusTown(stop.tag);
        };
        buttons.append(button);
        measureMarkerRadius(marker);
        markerPositions.push(marker);
      });
      adventureWaypoints.filter(waypoint => !waypoint.reuseStopTag).forEach((waypoint, index) => {
        const [lat, lng] = waypoint.position;
        const [x, y] = project([lng, lat]);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "trip-stop trip-waypoint";
        button.dataset.waypoint = waypoint.id;
        button.dataset.waypointRoute = waypoint.routeId;
        button.hidden = false;
        button.style.left = x + "px";
        button.style.top = y + "px";
        button.setAttribute("aria-label", `查看途经点：${waypoint.name}`);
        button.setAttribute("aria-pressed", String(waypoint.id === state.current.selectedWaypoint));
        const dot = createStopMarker(9101 + index * 101, {
          type: waypoint.markerType, iconType: waypoint.iconType,
        });
        const label = document.createElement("span");
        label.className = "trip-stop-label";
        fillStopLabel(label, waypoint.name, 8100 + index, { persistence: 'public' });
        label.setAttribute("aria-hidden", "true");
        const leader = document.createElement("span");
        leader.className = "trip-stop-leader";
        leader.setAttribute("aria-hidden", "true");
        button.append(leader, dot, label);
        const marker = { button, position: [x, y], tag: waypoint.id, key: `w:${waypoint.id}`, primary: false,
          waypoint, baseLabel: `查看途经点：${waypoint.name}`, seed: 9101 + index * 101 };
        button.onclick = event => activateMarker(marker, event);
        buttons.append(button);
        measureMarkerRadius(marker);
        markerPositions.push(marker);
      });
      international.markers.forEach(marker => {
        marker.international = true;
        marker.button.addEventListener("click", event => {
          const clusterKeys = marker.button.dataset.cluster?.split(",").filter(Boolean);
          if (clusterKeys?.length < 2) return;
          event.preventDefault(); event.stopImmediatePropagation();
          state.current.onClusterSelect?.(clusterKeys);
        }, { capture: true });
        markerPositions.push(marker);
      });
      syncHotelMarkers(project);
      syncLayerVisibility();
      zoom.extent([[0, 0], [width, height]]);
      area._project = project;
      area._unproject = unproject;
      syncWaypointMarkers(state.current);
      lastClusterZoom = Number.NaN;
      lastClusterSignature = "";
      lastWaterLabelZoom = Number.NaN;
      const rect = focusRect();
      let nextView = initialView(width, height, rect);
      const restored = mapViewTransform(state.current.mapView, project);
      if (restored) {
        restoringMapView = restored.normalized;
        nextView = restored.transform;
      } else if (activeMapMode === "international") {
        nextView = locationsView(internationalOverviewPositions, project, rect, INTERNATIONAL_MIN_ZOOM);
      }
      if (!restored && activeMapMode !== "international" && !layout && state.current.selected) {
        const marker = markerPositions.find((item) => item.tag === state.current.selected);
        if (marker) nextView = placeView(marker.position, rect);
      }
      if (!restored && activeMapMode !== "international" && !layout && state.current.focusLocations) {
        nextView = locationsView(focusLocationPositions(state.current.focusLocations, state.current.routes), project, rect);
      }
      if (!restored && activeMapMode !== "international" && !layout && state.current.focusRoute) {
        const route = state.current.routes.find(item => item.id === state.current.focusRoute);
        if (route) nextView = locationsView(routeFocusPositions(route), project, rect);
      }
      if (!restored && layout && activeMapMode !== "international") {
        const center = view.invert(layout.rect.center);
        const nx = (center[0] - layout.width / 2) * scale / layout.scale + width / 2;
        const ny = (center[1] - layout.height / 2) * scale / layout.scale + height / 2;
        nextView = d3.zoomIdentity.translate(rect.center[0] - nx * view.k,
          rect.center[1] - ny * view.k).scale(view.k);
        if (activeMapMode !== "international" && !userMoved && !resumeFocus && state.current.selected) {
          const marker = markerPositions.find((item) => item.tag === state.current.selected);
          if (marker) nextView = placeView(marker.position, rect);
        } else if (activeMapMode !== "international" && !userMoved && !resumeFocus && state.current.focusLocations) {
          nextView = locationsView(focusLocationPositions(state.current.focusLocations, state.current.routes), project, rect);
        } else if (activeMapMode !== "international" && !userMoved && !resumeFocus && state.current.focusRoute) {
          const route = state.current.routes.find(item => item.id === state.current.focusRoute);
          if (route) nextView = locationsView(routeFocusPositions(route), project, rect);
        }
      }
      layout = { width, height, scale, rect, dpr };
      if (!privateView && state.current.routes.some(route => route.hotelEndpoints)) {
        publicView = normalizeMapView(state.current.mapView);
        privateView = true;
      }
      surface.call(zoom.transform, nextView);
      if (activeMapMode === "new-zealand") newZealandView = nextView;
      if (resumeFocus && state.current.selected) controls.current?.focusPlace(state.current.selected);
      else if (resumeFocus && state.current.focusLocations) controls.current?.focusLocations(state.current.focusLocations);
      else if (resumeFocus && state.current.focusRoute) controls.current?.focusRoute(state.current.focusRoute);
    }
    let frame = 0, disposed = false;
    const redraw = () => {
      if (disposed || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; if (!disposed && !document.hidden) draw(); });
    };
    const observer = new ResizeObserver(redraw); observer.observe(area); redraw();
    window.addEventListener('resize', redraw);
    const appearance = new MutationObserver(() => international?.update({
      theme: document.documentElement.dataset.adventureAppearance ?? "", visibleRect: focusRect(),
    }));
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    const stopRecovery = observeCanvasRecovery(() => {
      if (disposed || document.hidden) return;
      if (state.current.obscured) { recoveryPending = true; return; }
      repaintCanvasTree(area); pencil?.recover(); routeInk?.recover(); international?.recover();
    });
    const visibilityChanged = () => {
      if (document.hidden) {
        surface.interrupt(); cancelAnimationFrame(viewFrame); viewFrame = 0; pendingView = null;
        pencil?.pause(); routeInk?.pause(); international?.pause();
      } else {
        if (!state.current.obscured) pencil?.resume();
        redraw(); settleView(view); if (!state.current.obscured) pencil?.refine(view);
      }
    };
    document.addEventListener('visibilitychange', visibilityChanged);
    const refreshLabels = () => {
      if (disposed) return;
      repaintCanvasTree(buttons); pencil?.refreshLabels(); international?.refreshLabels();
      settleView(view);
    };
    document.fonts.ready.then(() => textCacheReady).then(refreshLabels);
    document.fonts.addEventListener('loadingdone', refreshLabels);
    return () => { disposed = true; stopRecovery(); window.removeEventListener('resize', redraw); document.removeEventListener('visibilitychange', visibilityChanged); document.fonts.removeEventListener('loadingdone', refreshLabels); townLoadGeneration++; cancelAnimationFrame(frame); cancelAnimationFrame(viewFrame); observer.disconnect(); appearance.disconnect(); surface.interrupt(); pencil?.dispose(); routeInk?.dispose(); international?.dispose(); surface.on(".zoom", null); area.removeEventListener("click", handleTouchNodeClick, true); area.removeEventListener("dblclick", suppressTouchDoubleClick, true); area.removeEventListener("pointercancel", resetTouchNodeTap, true); area.removeEventListener("touchcancel", resetTouchNodeTap, true); area.removeEventListener("touchstart", resetMultiTouchNodeTap, true); nodeTapTracker.reset(); controls.current = null; delete area._project; delete area._unproject; buttons.replaceChildren(); internationalButtons.replaceChildren(); svg.selectAll("*").remove(); sea.selectAll("*").remove(); };
  }, []);
  return <div ref={container} className="trip-map-area" inert={obscured ? "" : undefined} aria-hidden={obscured || undefined}>
    <svg className="trip-depth-map" aria-hidden="true" />
    <canvas className="trip-pencil-map" role="img" aria-label={language === "en" ? "Colored-pencil terrain and ocean depth bands at 200, 1000, 2000 and 4000 meters" : "C 重描彩铅地表：林地、草地、农田、灌丛、裸地、冰雪、湿地与城镇；海洋按 200、1000、2000、4000 米深度分色"} />
    <canvas className="trip-international-map" aria-hidden="true" />
    <canvas className="trip-pencil-routes" aria-hidden="true" />
    <canvas className="trip-international-routes" aria-hidden="true" />
    <svg className="trip-map" role="group" aria-label={language === "en" ? "Colored-pencil map of New Zealand with selectable routes; road paths are references and flight paths are schematic" : "南北岛彩铅地图及可点击路线；实线为自驾公路参考路径，短虚线为航线示意，长虚线为大巴公路参考路径"} onClick={onClear} />
    <div className="trip-international-points" />
    <div className="trip-point-buttons" />
    <AdventureMapScale ref={scaleControl} hidden={obscured} language={language} />
    <nav className="trip-map-controls" aria-label={language === "en" ? "Map view" : "地图视图"}>
      <GameIconButton label={language === "en" ? "Zoom in" : "放大地图"} onClick={() => controls.current?.zoomIn()}><ZoomInIcon /></GameIconButton>
      <GameIconButton label={language === "en" ? "Zoom out" : "缩小地图"} onClick={() => controls.current?.zoomOut()}><ZoomOutIcon /></GameIconButton>
      <GameIconButton label={language === "en" ? "Reset map" : "复位地图"} onClick={() => controls.current?.reset()}><ResetIcon /></GameIconButton>
    </nav>
  </div>;
}
