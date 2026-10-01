import { geoMercator, geoPath, geoStream } from "d3";
import { internationalFlightSegments, internationalMapStops } from "./internationalMapData";
import internationalBasemap from "./data/international-basemap.json";
import { fillStopLabel } from "./pencil/mapLabels";
import { pencilPalette } from "./pencil/palette";
import { pencilStroke } from "./pencil/stroke";
import { createStopMarker } from "./pencil/stopMarker";
import { retainMapSurface, restoreMapSurface, releaseMapSurface, mapSurfacePixels } from "./pencil/mapTerrainCache";
import "./international-map.css";

export const INTERNATIONAL_MIN_ZOOM = .035;
export const INTERNATIONAL_ROUTE_IDS = new Set(internationalFlightSegments.map(segment => segment.id));
export const internationalOverviewPositions = internationalMapStops.map(stop => stop.coordinate);
const RASTER_OVERSCAN_MIN = 192;
const RASTER_OVERSCAN_MAX = 480;
const RASTER_REFINE_DELAY = 90;
const RASTER_SLICE_BUDGET = 7;
const RASTER_STROKE_CHUNK = 32;
const RASTER_MAX_PIXELS = 4 * 1024 * 1024;

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
  const pixelBudgetDensity = Math.sqrt(RASTER_MAX_PIXELS / Math.max(1, width * height));
  const density = Math.max(1, Math.min(devicePixelRatio || 1, 2, pixelBudgetDensity));
  const pixelWidth = Math.max(1, Math.round(width * density));
  const pixelHeight = Math.max(1, Math.round(height * density));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const softwareRaster = !canvas.isConnected;
  const context = canvas.getContext("2d", softwareRaster ? { willReadFrequently: true } : undefined);
  context.setTransform(density, 0, 0, density, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.filter = "none";
  context.clearRect(0, 0, width, height);
  canvas.dataset.rasterDensity = density.toFixed(2);
  canvas.dataset.rasterBackend = softwareRaster ? "software" : "display";
  return { context, density };
}

function createRasterTaskQueue({ createTasks, complete, cancelled }) {
  let tasks = null, taskIndex = 0, result = null, cleanup = null;
  let timer = 0, idle = 0, stopped = false;
  const cancel = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle);
    cleanup?.();
    tasks = result = cleanup = null;
  };
  const run = deadline => {
    idle = 0;
    if (stopped || cancelled()) { cancel(); return; }
    if (!tasks) {
      const work = createTasks();
      tasks = work.tasks;
      result = work.result;
      cleanup = work.cleanup;
    }
    const started = performance.now();
    while (taskIndex < tasks.length && !cancelled()) {
      tasks[taskIndex++]();
      const outOfTime = deadline?.timeRemaining
        ? deadline.timeRemaining() < 2
        : performance.now() - started >= RASTER_SLICE_BUDGET;
      if (outOfTime) break;
    }
    if (stopped || cancelled()) { cancel(); return; }
    if (taskIndex >= tasks.length) {
      complete(result);
      tasks = result = cleanup = null;
      stopped = true;
      return;
    }
    if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 80 });
    else timer = window.setTimeout(run, 0);
  };
  timer = window.setTimeout(() => {
    timer = 0;
    if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 120 });
    else run();
  }, RASTER_REFINE_DELAY);
  return { cancel };
}

function strokeChunks(points, closed = false, scale = 1, maxDistance = RASTER_STROKE_CHUNK) {
  if (points.length < 2) return [];
  const line = points.slice();
  if (closed && Math.hypot(line[0][0] - line.at(-1)[0], line[0][1] - line.at(-1)[1]) > .01) {
    line.push(line[0]);
  }
  const totalDistance = line.slice(1).reduce((total, point, index) =>
    total + Math.hypot(point[0] - line[index][0], point[1] - line[index][1]) / scale, 0);
  if (!totalDistance) return [];
  const chunks = [];
  let current = [line[0]], currentDistance = 0, distanceOffset = 0;
  for (let index = 1; index < line.length; index++) {
    let from = current.at(-1);
    const to = line[index];
    let segmentDistance = Math.hypot(to[0] - from[0], to[1] - from[1]) / scale;
    while (segmentDistance > .0001) {
      const used = Math.min(maxDistance - currentDistance, segmentDistance);
      const ratio = used / segmentDistance;
      const split = [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
      current.push(split);
      currentDistance += used;
      segmentDistance -= used;
      from = split;
      if (currentDistance >= maxDistance - .0001) {
        chunks.push({ points: current, distanceOffset, totalDistance });
        distanceOffset += currentDistance;
        current = [split];
        currentDistance = 0;
      }
    }
  }
  if (current.length > 1) chunks.push({ points: current, distanceOffset, totalDistance });
  return chunks;
}

function addStrokeTasks(tasks, context, points, color, width, seed, amplitude,
  passes = 2, closed = false, settings = {}) {
  strokeChunks(points, closed, Math.max(.4, settings.scale ?? 1)).forEach(chunk => {
    tasks.push(() => pencilStroke(context, chunk.points, color, width, seed, amplitude, passes, false,
      { ...settings, distanceOffset: chunk.distanceOffset, totalDistance: chunk.totalDistance }));
  });
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
  let baseRaster = document.createElement("canvas");
  let routeRaster = document.createElement("canvas");
  let baseCandidate = document.createElement("canvas");
  let routeCandidate = document.createElement("canvas");
  let baseRasterView = null, routeRasterView = null, routeRasterParts = new Map();
  let baseRefinement = null, routeRefinement = null, renderRevision = 0;
  let lastDrawKey = '', disposed = false;
  let paused = false, recoveryPending = false;
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
    basePaintKey: "", routePaintKey: "", baseContentKey: "", routeContentKey: "",
  };

  function viewKey(view, visibleRect) {
    return [view.x, view.y, view.k, state.width, state.height,
      visibleRect?.width ?? state.width, visibleRect?.height ?? state.height].map(Number).join(":");
  }

  const baseContentKey = () => `${state.mapMode}:${state.theme}`;
  const routeContentKey = () => [state.mapMode, state.theme, state.selectedRoute ?? "",
    state.hoveredRoute ?? "", state.anchorRevision].join(":");

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
        12101 + markerRecords.indexOf(record) * 103, { persistence: 'public' });
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
    if (canvas === baseCanvas && state.mapMode === "international") {
      context.fillStyle = state.theme === "dark" ? "#173239" : "#a9d7df";
      context.fillRect(0, 0, state.width, state.height);
    }
    const relative = relativeInternationalView(cachedView, view);
    const sourceLeft = Math.max(0, -relative.x / relative.scale);
    const sourceTop = Math.max(0, -relative.y / relative.scale);
    const sourceRight = Math.min(cachedView.width, (state.width - relative.x) / relative.scale);
    const sourceBottom = Math.min(cachedView.height, (state.height - relative.y) / relative.scale);
    if (sourceRight > sourceLeft && sourceBottom > sourceTop) {
      const sourceScaleX = raster.width / cachedView.width;
      const sourceScaleY = raster.height / cachedView.height;
      context.drawImage(raster, sourceLeft * sourceScaleX, sourceTop * sourceScaleY,
        (sourceRight - sourceLeft) * sourceScaleX, (sourceBottom - sourceTop) * sourceScaleY,
        relative.x + sourceLeft * relative.scale, relative.y + sourceTop * relative.scale,
        (sourceRight - sourceLeft) * relative.scale, (sourceBottom - sourceTop) * relative.scale);
    }
    return internationalRasterCoversViewport(cachedView, view, state.width, state.height);
  }

  function cancelRefinements() {
    renderRevision++;
    baseRefinement?.cancel();
    routeRefinement?.cancel();
    baseRefinement = routeRefinement = null;
    delete baseCanvas.dataset.rasterRefining;
    delete routeCanvas.dataset.rasterRefining;
  }

  function baseRasterTasks(view) {
    const render = rasterView(view);
    const candidate = baseCandidate;
    const { context } = configureCanvas(candidate, render.width, render.height);
    const tasks = [];
    let clipped = false;
    tasks.push(() => {
      context.fillStyle = state.theme === "dark" ? "#173239" : "#a9d7df";
      context.fillRect(0, 0, render.width, render.height);
      context.globalAlpha = state.theme === "dark" ? .13 : .11;
    });
    for (let y = 7; y < render.height; y += 17) {
      addStrokeTasks(tasks, context, [[-8, y], [render.width + 8, y + Math.sin(y) * .7]],
        state.theme === "dark" ? "#79a5aa" : pencilPalette.water, .42, 12917 + y, .16, 1, false,
        { variation: .76, breaks: .42, grain: .75, gain: 1.2, step: 2.2,
          detail: "fill", filaments: 1,
          viewport: [render.width, render.height], viewportTop: -8 });
    }
    const worldProjection = createInternationalWorldProjection(project, render);
    const drawPath = geoPath(worldProjection, context);
    tasks.push(() => {
      context.globalAlpha = 1;
      context.save();
      context.beginPath();
      drawPath(internationalBasemap);
      context.fillStyle = state.theme === "dark" ? "#252820" : pencilPalette.land;
      context.globalAlpha = state.theme === "dark" ? .9 : .82;
      context.fill("evenodd");
      context.clip("evenodd");
      clipped = true;
      context.globalAlpha = state.theme === "dark" ? .16 : .2;
    });
    const right = render.width, lower = render.height;
    for (let offset = -lower; offset < right + lower; offset += 18) {
      addStrokeTasks(tasks, context, [[offset, lower + 8], [offset + lower + 24, -8]],
        state.theme === "dark" ? "#758168" : pencilPalette.green, .48, 13103 + offset, .16, 1, false,
        { variation: .78, breaks: .31, grain: .74, gain: 1.35, step: 2.2,
          detail: "fill", filaments: 1,
          viewport: [render.width, render.height], viewportTop: -8 });
    }
    tasks.push(() => { context.restore(); clipped = false; });
    projectInternationalBoundaryParts(internationalBasemap, worldProjection).forEach((points, index) => {
      addStrokeTasks(tasks, context, points, state.theme === "dark" ? "#aab59a" : pencilPalette.coast,
        .72, 13217 + index, .2, 2, true,
        { variation: .82, breaks: .22, grain: .68, gain: 1.8, step: 1.4,
          filaments: 1, edgeGrain: false,
          viewport: [render.width, render.height], viewportTop: -8 });
    });
    return { tasks, result: { candidate, render }, cleanup: () => { if (clipped) context.restore(); } };
  }

  function scheduleBaseRefinement(view, visibleRect, revision) {
    const contentKey = baseContentKey();
    baseCanvas.dataset.rasterRefining = "true";
    const cancelled = () => revision !== renderRevision || baseContentKey() !== contentKey;
    baseRefinement = createRasterTaskQueue({ createTasks: () => baseRasterTasks(view), cancelled,
      complete: ({ candidate, render }) => {
      if (cancelled()) return;
      const previousRaster = baseRaster;
      baseRaster = candidate;
      baseCandidate = previousRaster;
      baseCandidate._mapPixels = null;
      retainMapSurface(baseRaster);
      baseRasterView = render;
      state.baseContentKey = contentKey;
      state.basePaintKey = `${viewKey(view, visibleRect)}:${state.mapMode}:${state.theme}`;
      baseCanvas.dataset.renderer = "international-pencil";
      baseCanvas.dataset.rasterRenders = String((Number(baseCanvas.dataset.rasterRenders) || 0) + 1);
      baseCanvas.dataset.rasterRefinements = String((Number(baseCanvas.dataset.rasterRefinements) || 0) + 1);
      delete baseCanvas.dataset.rasterRefining;
      composeRaster(baseCanvas, baseRaster, baseRasterView, state.lastDraw?.view ?? view);
      baseRefinement = null;
    } });
  }

  function paintBaseFallback(view) {
    const { context } = configureCanvas(baseCanvas, state.width, state.height);
    context.fillStyle = state.theme === "dark" ? "#173239" : "#a9d7df";
    context.fillRect(0, 0, state.width, state.height);
    context.beginPath();
    geoPath(createInternationalWorldProjection(project, view), context)(internationalBasemap);
    context.fillStyle = state.theme === "dark" ? "#252820" : pencilPalette.land;
    context.globalAlpha = state.theme === "dark" ? .9 : .82;
    context.fill("evenodd");
    context.globalAlpha = 1;
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
    state.baseContentKey = baseContentKey();
    state.basePaintKey = paintKey;
    composeRaster(baseCanvas, baseRaster, baseRasterView, view);
  }

  function settleBase(view, visibleRect, revision) {
    if (state.mapMode !== "international") {
      configureCanvas(baseCanvas, state.width, state.height);
      return;
    }
    if (!baseRasterView || !baseRaster.width) {
      paintBaseFallback(view);
      scheduleBaseRefinement(view, visibleRect, revision);
      return;
    }
    const covered = composeRaster(baseCanvas, baseRaster, baseRasterView, view);
    const reusable = covered && baseRasterView.k === view.k && state.baseContentKey === baseContentKey();
    if (reusable) {
      baseCanvas.dataset.rasterComposites = String((Number(baseCanvas.dataset.rasterComposites) || 0) + 1);
      baseCanvas.dataset.rasterSettleReuses = String((Number(baseCanvas.dataset.rasterSettleReuses) || 0) + 1);
      return;
    }
    scheduleBaseRefinement(view, visibleRect, revision);
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
    state.routeContentKey = routeContentKey();
    state.routePaintKey = paintKey;
    composeRaster(routeCanvas, routeRaster, routeRasterView, view);
    syncRouteHits(view);
  }

  function routeRasterTasks(view) {
    const render = rasterView(view);
    const candidate = routeCandidate;
    const { context } = configureCanvas(candidate, render.width, render.height);
    const partsByRoute = new Map();
    const tasks = [];
    hitRecords.forEach(({ segment, path }, index) => {
      const parts = routeScreenParts(segment, render);
      partsByRoute.set(segment.id, parts);
      path.setAttribute("aria-pressed", String(segment.id === state.selectedRoute));
      const active = segment.id === state.selectedRoute || segment.id === state.hoveredRoute;
      clipInternationalRouteParts(parts, render.width, render.height, 36)
        .flatMap(part => dashedParts(part)).forEach((points, partIndex) => {
          addStrokeTasks(tasks, context, points, pencilPalette.paper, active ? 4.4 : 3.7,
            seedFor(segment.id) + partIndex, .16, 1, false,
            { variation: .78, breaks: .08, grain: .34, gain: 1.15, step: 1,
              filaments: 1, edgeGrain: false,
              viewport: [render.width, render.height], viewportTop: -8 });
          addStrokeTasks(tasks, context, points, segment.color ?? "#366e91", active ? 2.8 : 2.05,
            seedFor(segment.id) + partIndex, .45, 3, false,
            { variation: .86, breaks: .17, grain: .72, gain: 2.05, step: 1,
              filaments: 1, edgeGrain: false,
              viewport: [render.width, render.height], viewportTop: -8 });
        });
      path.dataset.routeIndex = String(index);
    });
    return { tasks, result: { candidate, render, partsByRoute } };
  }

  function scheduleRouteRefinement(view, visibleRect, revision) {
    const contentKey = routeContentKey();
    routeCanvas.dataset.rasterRefining = "true";
    routeRefinement = createRasterTaskQueue({
      createTasks: () => routeRasterTasks(view),
      cancelled: () => revision !== renderRevision || routeContentKey() !== contentKey,
      complete: ({ candidate, render, partsByRoute }) => {
        if (revision !== renderRevision || routeContentKey() !== contentKey) return;
        const previousRaster = routeRaster;
        routeRaster = candidate;
        routeCandidate = previousRaster;
        routeCandidate._mapPixels = null;
        retainMapSurface(routeRaster);
        routeRasterView = render;
        routeRasterParts = partsByRoute;
        state.routeContentKey = contentKey;
        state.routePaintKey = `${viewKey(view, visibleRect)}:${state.selectedRoute ?? ""}:${state.hoveredRoute ?? ""}:${state.anchorRevision}`;
        routeCanvas.dataset.renderer = "international-pressure-pencil";
        routeCanvas.dataset.rasterRenders = String((Number(routeCanvas.dataset.rasterRenders) || 0) + 1);
        routeCanvas.dataset.rasterRefinements = String((Number(routeCanvas.dataset.rasterRefinements) || 0) + 1);
        delete routeCanvas.dataset.rasterRefining;
        composeRaster(routeCanvas, routeRaster, routeRasterView, state.lastDraw?.view ?? view);
        syncRouteHits(state.lastDraw?.view ?? view);
        routeRefinement = null;
      },
    });
  }

  function paintRouteFallback(view) {
    const { context } = configureCanvas(routeCanvas, state.width, state.height);
    context.lineCap = "round";
    context.setLineDash([9, 6]);
    hitRecords.forEach(({ segment }) => {
      const active = segment.id === state.selectedRoute || segment.id === state.hoveredRoute;
      context.beginPath();
      clipInternationalRouteParts(routeScreenParts(segment, view), state.width, state.height, 36)
        .forEach(points => points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)));
      context.strokeStyle = segment.color ?? "#366e91";
      context.lineWidth = active ? 2.8 : 2.05;
      context.globalAlpha = .84;
      context.stroke();
    });
    context.setLineDash([]);
    context.globalAlpha = 1;
  }

  function settleRoutes(view, visibleRect, revision) {
    if (!routeRasterView || !routeRaster.width) {
      paintRouteFallback(view);
      syncRouteHits(view);
      scheduleRouteRefinement(view, visibleRect, revision);
      return;
    }
    const covered = composeRaster(routeCanvas, routeRaster, routeRasterView, view);
    syncRouteHits(view);
    const reusable = covered && routeRasterView.k === view.k && state.routeContentKey === routeContentKey();
    if (reusable) {
      routeCanvas.dataset.rasterSettleReuses = String((Number(routeCanvas.dataset.rasterSettleReuses) || 0) + 1);
      return;
    }
    scheduleRouteRefinement(view, visibleRect, revision);
  }

  function composeDuringMotion(view) {
    cancelRefinements();
    if (state.mapMode === "international" && composeRaster(baseCanvas, baseRaster, baseRasterView, view)) {
      baseCanvas.dataset.rasterComposites = String((Number(baseCanvas.dataset.rasterComposites) || 0) + 1);
    } else if (state.mapMode === "international") {
      baseCanvas.dataset.rasterCacheMisses = String((Number(baseCanvas.dataset.rasterCacheMisses) || 0) + 1);
      composeRaster(baseCanvas, baseRaster, baseRasterView, view);
    }
    if (composeRaster(routeCanvas, routeRaster, routeRasterView, view)) {
      routeCanvas.dataset.rasterComposites = String((Number(routeCanvas.dataset.rasterComposites) || 0) + 1);
    } else {
      routeCanvas.dataset.rasterCacheMisses = String((Number(routeCanvas.dataset.rasterCacheMisses) || 0) + 1);
      composeRaster(routeCanvas, routeRaster, routeRasterView, view);
    }
    syncRouteHits(view);
  }

  function redrawRoutes() {
    lastDrawKey = '';
    if (!state.lastDraw || paused || document.hidden) return;
    if (state.lastDraw.moving) syncRouteHits(state.lastDraw.view);
    else {
      routeRefinement?.cancel();
      routeRefinement = null;
      settleRoutes(state.lastDraw.view, state.lastDraw.visibleRect, renderRevision);
    }
  }

  function redrawAll(visibleRect) {
    lastDrawKey = '';
    if (!state.lastDraw || paused || document.hidden) return;
    const payload = { ...state.lastDraw, visibleRect: visibleRect ?? state.lastDraw.visibleRect };
    state.lastDraw = payload;
    cancelRefinements();
    if (state.mapMode !== "international") {
      configureCanvas(baseCanvas, state.width, state.height);
      settleRoutes(payload.view, payload.visibleRect, renderRevision);
      return;
    }
    const revision = renderRevision;
    settleBase(payload.view, payload.visibleRect, revision);
    settleRoutes(payload.view, payload.visibleRect, revision);
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
    if (state.selected === (selection.selected ?? null) && state.selectedRoute === (selection.selectedRoute ?? null)) return;
    state.selected = selection.selected ?? null;
    state.selectedRoute = selection.selectedRoute ?? null;
    markerRecords.forEach(({ button, stop }) => {
      button.setAttribute("aria-pressed", String(state.selected === stop.key || state.selected === stop.id));
    });
    redrawRoutes();
  }

  function recover() {
    if (disposed) return;
    if (paused || document.hidden) { recoveryPending = true; return; }
    recoveryPending = false;
    cancelRefinements(); lastDrawKey = '';
    if (!restoreMapSurface(baseRaster)) baseRasterView = null;
    if (!restoreMapSurface(routeRaster)) { routeRasterView = null; routeRasterParts.clear(); }
    if (state.lastDraw?.moving) composeDuringMotion(state.lastDraw.view);
    else if (state.lastDraw && !document.hidden) redrawAll(state.lastDraw.visibleRect);
  }
  baseCanvas.addEventListener('contextrestored', recover);
  routeCanvas.addEventListener('contextrestored', recover);

  return {
    recover,
    pause() { paused = true; cancelRefinements(); lastDrawKey = ''; },
    refreshLabels: syncText,
    markers: markerRecords,
    handledRouteIds: INTERNATIONAL_ROUTE_IDS,
    getFitPositions: () => internationalOverviewPositions,
    getClusterNodes: () => markerRecords,
    draw(viewOrOptions, options = {}) {
      const payload = viewOrOptions?.view ? viewOrOptions : { view: viewOrOptions, ...options };
      if (!payload.view || disposed) return;
      state.lastDraw = payload;
      if (document.hidden) { cancelRefinements(); lastDrawKey = ''; return; }
      paused = false;
      if (recoveryPending) { recover(); return; }
      const key = `${viewKey(payload.view, payload.visibleRect)}:${baseContentKey()}:${routeContentKey()}:${Boolean(payload.moving)}`;
      if (!payload.force && key === lastDrawKey) {
        baseCanvas.dataset.skippedDraws = String((Number(baseCanvas.dataset.skippedDraws) || 0) + 1); return;
      }
      lastDrawKey = key;
      if (payload.moving) composeDuringMotion(payload.view);
      else {
        cancelRefinements();
        const revision = renderRevision;
        settleBase(payload.view, payload.visibleRect, revision);
        settleRoutes(payload.view, payload.visibleRect, revision);
      }
      baseCanvas._internationalStats = { retainedPixels: [baseRaster, routeRaster, baseCandidate, routeCandidate]
        .reduce((sum, canvas) => sum + mapSurfacePixels(canvas), 0) };
    },
    select,
    update(next = {}) {
      const previousMode = state.mapMode;
      const previousLanguage = state.language, previousTheme = state.theme;
      const previousWidth = state.width, previousHeight = state.height;
      const previousSelected = state.selected, previousRoute = state.selectedRoute;
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
      if (previousLanguage !== state.language || previousMode !== state.mapMode || previousTheme !== state.theme) syncText();
      if (previousMode !== state.mapMode) updateVisibility();
      if (previousMode !== state.mapMode || previousWidth !== state.width || previousHeight !== state.height || previousTheme !== state.theme) {
        redrawAll(next.visibleRect);
      } else if (previousSelected !== state.selected || previousRoute !== state.selectedRoute) {
        markerRecords.forEach(({ button, stop }) => button.setAttribute('aria-pressed',
          String(state.selected === stop.key || state.selected === stop.id)));
        redrawRoutes();
      }
    },
    setClusterAnchors(anchors) {
      const nextAnchors = anchors instanceof Map ? new Map(anchors) : new Map();
      if (anchorsEqual(state.anchors, nextAnchors)) return;
      state.anchors = nextAnchors;
      state.anchorRevision++;
      if (!state.lastDraw?.moving) redrawRoutes();
    },
    dispose() {
      disposed = true;
      cancelRefinements();
      baseCanvas.removeEventListener('contextrestored', recover);
      routeCanvas.removeEventListener('contextrestored', recover);
      baseCanvas.width = 0;
      routeCanvas.width = 0;
      markerRecords.forEach(({ button }) => button.remove());
      routeSvg.remove();
      toggle.remove();
      state.anchors.clear();
      state.lastDraw = null;
      state.basePaintKey = state.routePaintKey = "";
      state.baseContentKey = state.routeContentKey = "";
      [baseRaster, routeRaster, baseCandidate, routeCandidate].forEach(releaseMapSurface);
      baseRasterView = routeRasterView = null;
      routeRasterParts.clear();
    },
  };
}
