import { geoMercator, geoPath, geoStream } from "d3";
import { internationalBasemap, internationalFlightSegments, internationalMapStops } from "./internationalMapData";
import { fillStopLabel } from "./pencil/mapLabels";
import { pencilPalette } from "./pencil/palette";
import { pencilStroke } from "./pencil/stroke";
import { createStopMarker } from "./pencil/stopMarker";
import "./international-map.css";

export const INTERNATIONAL_MIN_ZOOM = .035;
export const INTERNATIONAL_ROUTE_IDS = new Set(internationalFlightSegments.map(segment => segment.id));
export const internationalOverviewPositions = internationalMapStops.map(stop => stop.coordinate);
const RASTER_OVERSCAN_MIN = 192;
const RASTER_OVERSCAN_MAX = 480;

const seedFor = value => [...value].reduce((seed, letter) =>
  Math.imul(seed ^ letter.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function createInternationalWorldProjection(project, view) {
  const target = coordinate => view.apply(project(coordinate));
  const origin = target([0, 0]), east = target([1, 0]);
  const unit = geoMercator().rotate([-172, 0]).scale(1).translate([0, 0]);
  const unitOrigin = unit([0, 0]), unitEast = unit([1, 0]);
  const denominator = unitEast[0] - unitOrigin[0];
  const scale = denominator ? (east[0] - origin[0]) / denominator : 1;
  const projection = geoMercator().rotate([-172, 0]).scale(scale).translate([0, 0]).precision(.35);
  const projectedOrigin = projection([0, 0]);
  projection.translate([origin[0] - projectedOrigin[0], origin[1] - projectedOrigin[1]]);
  return projection;
}

export function projectInternationalBoundaryParts(object, projection) {
  const parts = [];
  let current = null;
  geoStream(object, projection.stream({
    point(x, y) { current?.push([x, y]); },
    lineStart() { current = []; },
    lineEnd() { if (current?.length > 1) parts.push(current); current = null; },
    polygonStart() {}, polygonEnd() {}, sphere() {},
  }));
  return parts;
}

export function separateInternationalRouteParts(parts, offset = 12.5) {
  return parts.map(points => points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return [...point];
    const before = points[index - 1], after = points[index + 1];
    const dx = after[0] - before[0], dy = after[1] - before[1];
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length < .001) return [...point];
    const progress = index / (points.length - 1);
    const taper = Math.sin(Math.PI * progress) ** .82;
    return [point[0] - dy / length * offset * taper, point[1] + dx / length * offset * taper];
  }));
}

function clipSegmentToRect(from, to, rect) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  let start = 0, end = 1;
  const edges = [[-dx, from[0] - rect.left], [dx, rect.right - from[0]],
    [-dy, from[1] - rect.top], [dy, rect.bottom - from[1]]];
  for (const [direction, distance] of edges) {
    if (direction === 0) {
      if (distance < 0) return null;
      continue;
    }
    const ratio = distance / direction;
    if (direction < 0) start = Math.max(start, ratio);
    else end = Math.min(end, ratio);
    if (start > end) return null;
  }
  return [[from[0] + dx * start, from[1] + dy * start],
    [from[0] + dx * end, from[1] + dy * end]];
}

export function clipInternationalRouteParts(parts, width, height, padding = 36) {
  const rect = { left: -padding, top: -padding, right: width + padding, bottom: height + padding };
  const clipped = [];
  parts.forEach(points => {
    let current = null;
    for (let index = 1; index < points.length; index++) {
      const segment = clipSegmentToRect(points[index - 1], points[index], rect);
      if (!segment) { current = null; continue; }
      const [from, to] = segment;
      if (!current || Math.hypot(current.at(-1)[0] - from[0], current.at(-1)[1] - from[1]) > .01) {
        current = [from, to];
        clipped.push(current);
      } else current.push(to);
    }
  });
  return clipped;
}

export function relativeInternationalView(from, to) {
  const scale = to.k / from.k;
  return { scale, x: to.x - from.x * scale, y: to.y - from.y * scale };
}

export function internationalRasterOverscan(width, height) {
  return Math.round(Math.min(RASTER_OVERSCAN_MAX,
    Math.max(RASTER_OVERSCAN_MIN, Math.min(width, height) * .25)));
}

export function transformInternationalRouteParts(parts, fromView, toView) {
  const relative = relativeInternationalView(fromView, toView);
  return parts.map(points => points.map(([x, y]) => [
    relative.x + x * relative.scale,
    relative.y + y * relative.scale,
  ]));
}

export function internationalRasterCoversViewport(cachedView, view, width, height) {
  if (!cachedView) return false;
  const relative = relativeInternationalView(cachedView, view);
  return relative.x <= 0 && relative.y <= 0
    && relative.x + cachedView.width * relative.scale >= width
    && relative.y + cachedView.height * relative.scale >= height;
}

function translatedView(view, x, y) {
  return {
    x: view.x + x,
    y: view.y + y,
    k: view.k,
    apply(point) {
      const projected = view.apply(point);
      return [projected[0] + x, projected[1] + y];
    },
  };
}

function anchorsEqual(left, right) {
  if (left.size !== right.size) return false;
  for (const [key, position] of left) {
    const other = right.get(key);
    if (!other || Math.abs(position[0] - other[0]) > .001 || Math.abs(position[1] - other[1]) > .001) return false;
  }
  return true;
}

function configureCanvas(canvas, width, height) {
  const density = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(width * density));
  const pixelHeight = Math.max(1, Math.round(height * density));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, density };
}

function dashedParts(points, dash = 9, gap = 6) {
  if (points.length < 2) return [];
  const parts = [];
  let drawing = true, remaining = dash, current = [points[0]];
  for (let index = 1; index < points.length; index++) {
    let from = points[index - 1];
    const to = points[index];
    let distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    while (distance >= remaining && distance > 0) {
      const ratio = remaining / distance;
      const split = [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
      if (drawing) { current.push(split); parts.push(current); }
      drawing = !drawing;
      current = [split];
      from = split;
      distance -= remaining;
      remaining = drawing ? dash : gap;
    }
    if (drawing) current.push(to);
    remaining -= distance;
  }
  if (drawing && current.length > 1) parts.push(current);
  return parts;
}

function pathData(parts) {
  return parts.map(points => points.map(([x, y], index) =>
    `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("")).join("");
}

function paintViewIcon(canvas, international) {
  const density = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = Math.round(30 * density);
  canvas.style.width = canvas.style.height = "30px";
  const context = canvas.getContext("2d");
  context.scale(density, density);
  const color = pencilPalette.ink;
  const settings = { variation: .72, breaks: .13, grain: .58, gain: 2.4, step: .35, taperLength: .7 };
  if (international) {
    const ring = Array.from({ length: 45 }, (_, index) => {
      const angle = index / 44 * Math.PI * 2;
      return [15 + Math.cos(angle) * 10.5, 15 + Math.sin(angle) * 10.5];
    });
    pencilStroke(context, ring, color, 1.1, 8731, .22, 3, true, settings);
    pencilStroke(context, [[4.5, 15], [25.5, 15]], color, .9, 8743, .15, 2, false, settings);
    pencilStroke(context, [[15, 4.5], [11.7, 15], [15, 25.5], [18.3, 15], [15, 4.5]],
      color, .8, 8759, .14, 2, false, settings);
  } else {
    pencilStroke(context, [[5, 22], [11, 8], [17, 19], [24, 7]], color, 1.2, 8819, .28, 3, false, settings);
    pencilStroke(context, [[6, 23], [13, 24], [20, 22], [25, 24]], color, .9, 8831, .2, 2, false, settings);
  }
  canvas.dataset.renderer = "pressure-pencil";
}

export function createInternationalMapLayer({ baseCanvas, routeCanvas, markerHost, project, width, height,
  language = "zh", onNodeSelect, onRouteSelect, onViewChange }) {
  const baseRaster = document.createElement("canvas");
  const routeRaster = document.createElement("canvas");
  let baseRasterView = null, routeRasterView = null, routeRasterParts = new Map();
  const routeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  routeSvg.classList.add("trip-international-route-hits");
  routeSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  routeSvg.setAttribute("aria-label", language === "en" ? "International flight routes" : "国际航段");
  markerHost.append(routeSvg);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "trip-tool trip-international-view-toggle";
  const toggleIcon = document.createElement("canvas");
  toggleIcon.setAttribute("aria-hidden", "true");
  toggle.append(toggleIcon);
  markerHost.append(toggle);

  const markerRecords = internationalMapStops.map((stop, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "trip-stop trip-international-stop";
    button.dataset.airport = stop.id;
    button.dataset.mapKey = stop.key;
    const dot = createStopMarker(12001 + index * 101, { type: "transport", iconType: "flight" });
    const label = document.createElement("span");
    label.className = "trip-stop-label";
    label.setAttribute("aria-hidden", "true");
    const leader = document.createElement("span");
    leader.className = "trip-stop-leader";
    leader.setAttribute("aria-hidden", "true");
    button.append(leader, dot, label);
    button.addEventListener("click", event => {
      event.stopPropagation();
      if (!event.defaultPrevented) onNodeSelect?.(stop.key);
    });
    markerHost.append(button);
    return {
      key: stop.key,
      position: project(stop.coordinate),
      button,
      radius: 9,
      primary: false,
      baseLabel: "",
      stop,
      seed: 12001 + index * 101,
    };
  });

  const hitRecords = internationalFlightSegments.map(segment => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("trip-international-route-hit");
    path.dataset.route = segment.id;
    path.setAttribute("role", "button");
    path.setAttribute("tabindex", "0");
    path.addEventListener("click", event => {
      event.stopPropagation();
      if (!event.defaultPrevented) onRouteSelect?.(segment.id);
    });
    path.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      onRouteSelect?.(segment.id);
    });
    path.addEventListener("pointerenter", () => { state.hoveredRoute = segment.id; redrawRoutes(); });
    path.addEventListener("pointerleave", () => { state.hoveredRoute = null; redrawRoutes(); });
    path.addEventListener("focus", () => { state.hoveredRoute = segment.id; redrawRoutes(); });
    path.addEventListener("blur", () => { state.hoveredRoute = null; redrawRoutes(); });
    routeSvg.append(path);
    return { segment, path };
  });

  const state = {
    width, height, language, selected: null, selectedRoute: null, mapMode: "international",
    theme: "", hoveredRoute: null, anchors: new Map(), anchorRevision: 0, lastDraw: null,
    basePaintKey: "", routePaintKey: "",
  };

  function viewKey(view, visibleRect) {
    return [view.x, view.y, view.k, state.width, state.height,
      visibleRect?.width ?? state.width, visibleRect?.height ?? state.height].map(Number).join(":");
  }

  function markerName(stop) {
    return state.language === "en" ? stop.nameEn : stop.name;
  }

  function syncText() {
    markerRecords.forEach(record => {
      const name = markerName(record.stop);
      record.baseLabel = state.language === "en" ? `Open airport: ${name}` : `查看机场：${name}`;
      record.button.setAttribute("aria-label", record.baseLabel);
      const label = state.language === "en" ? `${record.stop.cityEn} · ${record.stop.id} Airport`
        : `${record.stop.city} · ${record.stop.id}机场`;
      fillStopLabel(record.button.querySelector(".trip-stop-label"), label,
        12101 + markerRecords.indexOf(record) * 103);
    });
    hitRecords.forEach(({ segment, path }) => {
      const label = state.language === "en" ? segment.labelEn : segment.label;
      const meaning = state.language === "en" ? segment.geometryLabelEn : segment.geometryLabel;
      path.setAttribute("aria-label", state.language === "en" ? `Open flight: ${label}. ${meaning}` : `查看航段：${label}。${meaning}`);
    });
    const international = state.mapMode === "international";
    toggle.setAttribute("aria-label", international
      ? (state.language === "en" ? "Return to the New Zealand map" : "返回新西兰地图")
      : (state.language === "en" ? "Show the international journey" : "查看国际航段"));
    toggle.title = toggle.getAttribute("aria-label");
    paintViewIcon(toggleIcon, !international);
  }

  function routeScreenParts(segment, view) {
    const parts = segment.geometry.coordinates.map((part, partIndex) => part.map((coordinate, pointIndex) => {
      const isFirst = partIndex === 0 && pointIndex === 0;
      const isLast = partIndex === segment.geometry.coordinates.length - 1 && pointIndex === part.length - 1;
      const anchor = isFirst ? state.anchors.get(`a:${segment.from}`) : isLast ? state.anchors.get(`a:${segment.to}`) : null;
      return view.apply(anchor ?? project(coordinate));
    }));
    return separateInternationalRouteParts(parts);
  }

  function rasterView(view) {
    const overscan = internationalRasterOverscan(state.width, state.height);
    const renderView = translatedView(view, overscan, overscan);
    return { ...renderView, width: state.width + overscan * 2,
      height: state.height + overscan * 2, viewportWidth: state.width,
      viewportHeight: state.height, overscan };
  }

  function composeRaster(canvas, raster, cachedView, view) {
    if (!cachedView || cachedView.viewportWidth !== state.width
      || cachedView.viewportHeight !== state.height || !raster.width) return false;
    const { context } = configureCanvas(canvas, state.width, state.height);
    const relative = relativeInternationalView(cachedView, view);
    context.save();
    context.translate(relative.x, relative.y);
    context.scale(relative.scale, relative.scale);
    context.drawImage(raster, 0, 0, cachedView.width, cachedView.height);
    context.restore();
    return internationalRasterCoversViewport(cachedView, view, state.width, state.height);
  }

  function paintBase(view, visibleRect, force = false) {
    const paintKey = `${viewKey(view, visibleRect)}:${state.mapMode}:${state.theme}`;
    if (!force && paintKey === state.basePaintKey) {
      composeRaster(baseCanvas, baseRaster, baseRasterView, view);
      return;
    }
    if (state.mapMode !== "international") {
      configureCanvas(baseCanvas, state.width, state.height);
      state.basePaintKey = paintKey;
      return;
    }
    const render = rasterView(view);
    baseCanvas.dataset.rasterOverscan = String(render.overscan);
    const { context } = configureCanvas(baseRaster, render.width, render.height);
    context.fillStyle = state.theme === "dark" ? "#173239" : "#a9d7df";
    context.fillRect(0, 0, render.width, render.height);
    context.globalAlpha = state.theme === "dark" ? .13 : .11;
    for (let y = 7; y < render.height; y += 17) {
      pencilStroke(context, [[-8, y], [render.width + 8, y + Math.sin(y) * .7]],
        state.theme === "dark" ? "#79a5aa" : pencilPalette.water, .42, 12917 + y, .16, 1, false,
        { variation: .76, breaks: .42, grain: .75, gain: 1.2, step: 1.5,
          viewport: [render.width, render.height], viewportTop: -8 });
    }
    context.globalAlpha = 1;
    const worldProjection = createInternationalWorldProjection(project, render);
    const drawPath = geoPath(worldProjection, context);
    context.save();
    context.beginPath();
    drawPath(internationalBasemap);
    context.fillStyle = state.theme === "dark" ? "#252820" : pencilPalette.land;
    context.globalAlpha = state.theme === "dark" ? .9 : .82;
    context.fill("evenodd");
    context.clip("evenodd");
    context.globalAlpha = state.theme === "dark" ? .16 : .2;
    const right = render.width, lower = render.height;
    for (let offset = -lower; offset < right + lower; offset += 18) {
      pencilStroke(context, [[offset, lower + 8], [offset + lower + 24, -8]],
        state.theme === "dark" ? "#758168" : pencilPalette.green, .48, 13103 + offset, .16, 1, false,
        { variation: .78, breaks: .31, grain: .74, gain: 1.35, step: 1.4,
          viewport: [render.width, render.height], viewportTop: -8 });
    }
    context.restore();
    projectInternationalBoundaryParts(internationalBasemap, worldProjection).forEach((points, index) => {
      pencilStroke(context, points, state.theme === "dark" ? "#aab59a" : pencilPalette.coast,
        .72, 13217 + index, .2, 2, true,
        { variation: .82, breaks: .22, grain: .68, gain: 1.8, step: 1.2,
          viewport: [render.width, render.height], viewportTop: -8 });
    });
    baseCanvas.dataset.renderer = "international-pencil";
    baseCanvas.dataset.rasterRenders = String((Number(baseCanvas.dataset.rasterRenders) || 0) + 1);
    baseRasterView = render;
    state.basePaintKey = paintKey;
    composeRaster(baseCanvas, baseRaster, baseRasterView, view);
  }

  function transformCachedRouteParts(parts, view) {
    return transformInternationalRouteParts(parts, routeRasterView, view);
  }

  function syncRouteHits(view) {
    hitRecords.forEach(({ segment, path }, index) => {
      const cached = routeRasterView && routeRasterParts.get(segment.id);
      const parts = cached ? transformCachedRouteParts(cached, view) : routeScreenParts(segment, view);
      path.setAttribute("d", pathData(clipInternationalRouteParts(parts, state.width, state.height, 12)));
      path.setAttribute("aria-pressed", String(segment.id === state.selectedRoute));
      path.dataset.routeIndex = String(index);
    });
  }

  function paintRoutes(view, visibleRect, force = false) {
    const paintKey = `${viewKey(view, visibleRect)}:${state.selectedRoute ?? ""}:${state.hoveredRoute ?? ""}:${state.anchorRevision}`;
    if (!force && paintKey === state.routePaintKey) {
      composeRaster(routeCanvas, routeRaster, routeRasterView, view);
      syncRouteHits(view);
      return;
    }
    const render = rasterView(view);
    routeCanvas.dataset.rasterOverscan = String(render.overscan);
    const { context } = configureCanvas(routeRaster, render.width, render.height);
    routeRasterParts = new Map();
    hitRecords.forEach(({ segment, path }, index) => {
      const parts = routeScreenParts(segment, render);
      routeRasterParts.set(segment.id, parts);
      path.setAttribute("aria-pressed", String(segment.id === state.selectedRoute));
      const active = segment.id === state.selectedRoute || segment.id === state.hoveredRoute;
      const clipped = clipInternationalRouteParts(parts, render.width, render.height, 36);
      clipped.flatMap(part => dashedParts(part)).forEach((points, partIndex) => {
        pencilStroke(context, points, pencilPalette.paper, active ? 4.4 : 3.7,
          seedFor(segment.id) + partIndex, .16, 1, false,
          { variation: .78, breaks: .08, grain: .34, gain: 1.15, step: .8,
            viewport: [render.width, render.height], viewportTop: -8 });
        pencilStroke(context, points, segment.color ?? "#366e91", active ? 2.8 : 2.05,
          seedFor(segment.id) + partIndex, .45, 3, false,
          { variation: .86, breaks: .17, grain: .72, gain: 2.05, step: .75,
            viewport: [render.width, render.height], viewportTop: -8 });
      });
      path.dataset.routeIndex = String(index);
    });
    routeCanvas.dataset.renderer = "international-pressure-pencil";
    routeCanvas.dataset.rasterRenders = String((Number(routeCanvas.dataset.rasterRenders) || 0) + 1);
    routeRasterView = render;
    state.routePaintKey = paintKey;
    composeRaster(routeCanvas, routeRaster, routeRasterView, view);
    syncRouteHits(view);
  }

  function composeDuringMotion(view) {
    if (state.mapMode === "international" && composeRaster(baseCanvas, baseRaster, baseRasterView, view)) {
      baseCanvas.dataset.rasterComposites = String((Number(baseCanvas.dataset.rasterComposites) || 0) + 1);
    } else if (state.mapMode === "international") {
      baseCanvas.dataset.rasterCacheMisses = String((Number(baseCanvas.dataset.rasterCacheMisses) || 0) + 1);
      paintBase(view, state.lastDraw?.visibleRect, true);
    }
    if (composeRaster(routeCanvas, routeRaster, routeRasterView, view)) {
      routeCanvas.dataset.rasterComposites = String((Number(routeCanvas.dataset.rasterComposites) || 0) + 1);
    } else {
      routeCanvas.dataset.rasterCacheMisses = String((Number(routeCanvas.dataset.rasterCacheMisses) || 0) + 1);
      paintRoutes(view, state.lastDraw?.visibleRect, true);
    }
    syncRouteHits(view);
  }

  function redrawRoutes() {
    if (!state.lastDraw) return;
    if (state.lastDraw.moving) syncRouteHits(state.lastDraw.view);
    else paintRoutes(state.lastDraw.view, state.lastDraw.visibleRect, true);
  }

  function redrawAll(visibleRect) {
    if (!state.lastDraw) return;
    const payload = { ...state.lastDraw, visibleRect: visibleRect ?? state.lastDraw.visibleRect };
    state.lastDraw = payload;
    paintBase(payload.view, payload.visibleRect);
    paintRoutes(payload.view, payload.visibleRect);
  }

  toggle.addEventListener("click", event => {
    event.stopPropagation();
    onViewChange?.(state.mapMode === "international" ? "new-zealand" : "international");
  });

  function updateVisibility() {
    const international = state.mapMode === "international";
    baseCanvas.hidden = !international;
    routeCanvas.hidden = false;
    routeSvg.hidden = false;
    markerRecords.forEach(({ button }) => { button.hidden = !international; });
    markerHost.dataset.mapMode = state.mapMode;
  }

  syncText();
  updateVisibility();

  function select(selection = {}) {
    state.selected = selection.selected ?? null;
    state.selectedRoute = selection.selectedRoute ?? null;
    markerRecords.forEach(({ button, stop }) => {
      button.setAttribute("aria-pressed", String(state.selected === stop.key || state.selected === stop.id));
    });
    redrawRoutes();
  }

  return {
    markers: markerRecords,
    handledRouteIds: INTERNATIONAL_ROUTE_IDS,
    getFitPositions: () => internationalOverviewPositions,
    getClusterNodes: () => markerRecords,
    draw(viewOrOptions, options = {}) {
      const payload = viewOrOptions?.view ? viewOrOptions : { view: viewOrOptions, ...options };
      if (!payload.view) return;
      state.lastDraw = payload;
      if (payload.moving) composeDuringMotion(payload.view);
      else {
        paintBase(payload.view, payload.visibleRect);
        paintRoutes(payload.view, payload.visibleRect);
      }
    },
    select,
    update(next = {}) {
      const previousMode = state.mapMode;
      const has = key => Object.prototype.hasOwnProperty.call(next, key);
      Object.assign(state, {
        language: next.language ?? state.language,
        selected: has("selected") ? next.selected : state.selected,
        selectedRoute: has("selectedRoute") ? next.selectedRoute : state.selectedRoute,
        mapMode: next.mapMode ?? state.mapMode,
        theme: next.theme ?? state.theme,
        width: next.width ?? state.width,
        height: next.height ?? state.height,
      });
      routeSvg.setAttribute("viewBox", `0 0 ${state.width} ${state.height}`);
      syncText();
      updateVisibility();
      if (previousMode !== state.mapMode || next.width || next.height || next.theme) {
        redrawAll(next.visibleRect);
      } else select(state);
    },
    setClusterAnchors(anchors) {
      const nextAnchors = anchors instanceof Map ? new Map(anchors) : new Map();
      if (anchorsEqual(state.anchors, nextAnchors)) return;
      state.anchors = nextAnchors;
      state.anchorRevision++;
      if (!state.lastDraw?.moving) redrawRoutes();
    },
    dispose() {
      baseCanvas.width = 0;
      routeCanvas.width = 0;
      markerRecords.forEach(({ button }) => button.remove());
      routeSvg.remove();
      toggle.remove();
      state.anchors.clear();
      state.lastDraw = null;
      state.basePaintKey = state.routePaintKey = "";
      baseRaster.width = baseRaster.height = 0;
      routeRaster.width = routeRaster.height = 0;
      baseRasterView = routeRasterView = null;
      routeRasterParts.clear();
    },
  };
}
