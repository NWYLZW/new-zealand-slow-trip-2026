import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { GameIconButton } from "./GameIconButton";
import { AdventureMapScale } from "./AdventureMapScale";
import { ResetIcon, ZoomInIcon, ZoomOutIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { compositeTownCache, createTownRenderJob, drawTownMarker, townEntryContainsEntry,
  townEntryContainsView, townEntryMatchesView, townRenderRegion } from "./pencil/drawPencilTown";
import { loadTownMapData } from "./townMapData";
import { retainTownVisit, takeTownVisit } from "./pencil/townVisitCache";
import { mapSurfacePixels, releaseMapSurface, retainMapSurface, restoreMapSurface } from "./pencil/mapTerrainCache";
import { observeCanvasRecovery } from "./pencil/canvasRecovery";
import "./AdventureTownMap.css";

const EARTH_RADIUS_M = 6371008.8;
const INITIAL_SCALE_METERS = 500;
const MAX_TOWN_CACHE_ENTRIES = 3;
const MAX_TOWN_CACHE_PIXELS = 12000000;
function focusPosition(target) {
  const position = Array.isArray(target) ? target : target?.position;
  return position?.length === 2 && position.every(Number.isFinite) ? position : null;
}

function initialProjection(place, width, height) {
  const [lat, lng] = place.position;
  const scalePixels = Math.min(92, Math.max(58, width * .25));
  const scale = scalePixels * EARTH_RADIUS_M * Math.cos(lat * Math.PI / 180) / INITIAL_SCALE_METERS;
  return d3.geoMercator().center([lng, lat]).scale(scale).translate([width / 2, height / 2]);
}

function viewForTarget(project, target, width, height) {
  if (!target) return d3.zoomIdentity;
  const point = project([target[1], target[0]]), zoom = 1.35;
  return d3.zoomIdentity.translate(width / 2 - point[0] * zoom, height / 2 - point[1] * zoom).scale(zoom);
}

function niceDistance(maxMeters) {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, maxMeters)));
  return [5, 2, 1].map(value => value * power).find(value => value <= maxMeters) ?? power;
}

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${meters / 1000} km`;
}

export default function AdventureTownMap({ place, language = "zh", focusTarget = null,
  stayMarkers = [], onSelectStay, active = true }) {
  const rootRef = useRef(null), canvasRef = useRef(null), scaleRef = useRef(null), controlsRef = useRef(null);
  const markerRefs = useRef(new Map()), markersRef = useRef([]), targetRef = useRef(null), targetIdRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [dataUnavailable, setDataUnavailable] = useState(false);
  const target = focusPosition(focusTarget);
  const targetKey = target?.join(",") ?? "town", targetId = focusTarget?.bookingId ?? null;
  const markers = stayMarkers.filter(marker => focusPosition(marker));
  const markerKey = markers.map(marker => `${marker.bookingId}:${marker.position.join(",")}`).join("|");
  markersRef.current = markers; targetRef.current = target; targetIdRef.current = targetId;

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas || !place?.position) return undefined;
    let disposed = false, resizeFrame = 0, viewFrame = 0, renderJob = null, activeCache = null, mapData = null;
    let detailTimer = 0, moving = false, intersecting = false, visitKey = null, recoveryPending = false;
    let completeCaches = [];
    let renderGeneration = 0;
    let project = null, view = d3.zoomIdentity, width = 0, height = 0, pendingView = null;
    const context = canvas.getContext("2d");
    const stats = { cacheHits: 0, containedViewHits: 0, readyTiles: 0, missingTiles: 0 };
    const visible = () => !disposed && !document.hidden && intersecting && activeRef.current &&
      !root.closest('[inert],[aria-hidden="true"]');
    const releaseCache = value => releaseMapSurface(value?.layer?.canvas);
    const cachePixels = entry => entry?.layer ? mapSurfacePixels(entry.layer.canvas) : 0;
    const entriesForPaint = () => [...completeCaches, ...(activeCache?.adopted ? [activeCache] : [])];
    const updateStats = () => {
      const entries = entriesForPaint();
      const readyTiles = activeCache?.readyTiles ?? stats.readyTiles;
      const missingTiles = activeCache ? Math.max(0, activeCache.totalTiles - readyTiles) : stats.missingTiles;
      canvas._townStats = { ...stats, cacheContainsView: entries.some(entry => townEntryContainsView(entry, view, width, height)),
        readyTiles, missingTiles,
        preservedCompleteEntries: completeCaches.length, cachePixels: entries.reduce((sum, entry) => sum + cachePixels(entry), 0),
        renderBatches: renderJob?.stats.batches ?? stats.renderBatches,
        maxBatchMs: renderJob?.stats.maxBatchMs ?? stats.maxBatchMs,
        pending: Boolean(renderJob) };
    };
    const cancelRender = () => {
      clearTimeout(detailTimer); detailTimer = 0;
      if (!renderJob) return;
      renderGeneration++; renderJob.cancel(); renderJob = null;
      if (activeCache && !activeCache.complete) releaseCache(activeCache);
      activeCache = null;
      stats.readyTiles = 0; stats.missingTiles = 0;
    };
    const clearCaches = () => {
      cancelRender(); completeCaches.forEach(releaseCache); completeCaches = []; updateStats();
    };
    const retainCompleted = entry => {
      retainMapSurface(entry.layer.canvas);
      const next = [];
      for (const cached of completeCaches) {
        if (cached !== entry && townEntryContainsEntry(entry, cached)) releaseCache(cached);
        else next.push(cached);
      }
      if (!next.includes(entry)) next.push(entry);
      completeCaches = next;
      while (completeCaches.length > MAX_TOWN_CACHE_ENTRIES ||
        completeCaches.reduce((sum, cached) => sum + cachePixels(cached), 0) > MAX_TOWN_CACHE_PIXELS) {
        const removed = completeCaches.shift();
        if (removed === entry && completeCaches.length) completeCaches.push(removed);
        else releaseCache(removed);
      }
    };
    const updateScale = () => {
      if (!project || !scaleRef.current) return;
      const maxPixels = Math.min(92, Math.max(52, width * .22));
      const y = Math.max(12, height - 22), right = Math.max(12, width - 58);
      const from = project.invert(view.invert([right - maxPixels, y]));
      const to = project.invert(view.invert([right, y]));
      const maxMeters = d3.geoDistance(from, to) * EARTH_RADIUS_M;
      const meters = niceDistance(maxMeters), barWidth = maxPixels * meters / maxMeters;
      scaleRef.current.update({ width: barWidth, right: 10, bottom: 8, text: formatDistance(meters) });
    };
    const paint = () => {
      if (!width || !height) return;
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      compositeTownCache(context, entriesForPaint(), view, width, height);
      drawTownMarker(context, view.apply(project([place.position[1], place.position[0]])), { language });
      for (const marker of markersRef.current) {
        const markerPosition = focusPosition(marker);
        if (!markerPosition) continue;
        const point = view.apply(project([markerPosition[1], markerPosition[0]]));
        drawTownMarker(context, point, { hotel: true, language,
          selected: marker.bookingId === targetIdRef.current });
        const button = markerRefs.current.get(marker.bookingId);
        if (button) {
          button.style.left = `${point[0]}px`; button.style.top = `${point[1]}px`;
          button.hidden = point[0] < -22 || point[1] < -22 || point[0] > width + 22 || point[1] > height + 22;
        }
      }
      updateStats();
    };
    const startDetail = () => {
      if (!mapData || !project || !width || !height || moving || !visible()) return;
      if (recoveryPending) { recover(); return; }
      restoreVisit();
      if (activeCache && townEntryMatchesView(activeCache, view, width, height)) {
        renderJob?.resume(); stats.cacheHits++; stats.containedViewHits++; updateStats(); return;
      }
      const completeIndex = completeCaches.findIndex(entry => townEntryMatchesView(entry, view, width, height));
      if (completeIndex >= 0) {
        const [hit] = completeCaches.splice(completeIndex, 1); completeCaches.push(hit);
        cancelRender(); stats.cacheHits++; stats.containedViewHits++; scheduleView(view); updateStats(); return;
      }
      cancelRender();
      const renderView = view, region = townRenderRegion(width, height);
      const renderProject = point => renderView.apply(project(point));
      const generation = ++renderGeneration;
      const entry = { layer: null, view: renderView, left: region.left, top: region.top,
        width: region.width, height: region.height, readyTiles: 0, totalTiles: 0,
        adopted: false, complete: false, data: mapData,
        publicDefault: !targetRef.current && renderView.k === 1 && renderView.x === 0 && renderView.y === 0 };
      const job = createTownRenderJob({ data: mapData, project: renderProject, width, height, language,
        left: region.left, top: region.top, renderWidth: region.width, renderHeight: region.height,
        pixelRatio: region.ratio,
        onUpdate(layer, complete, ready) {
          if (disposed || generation !== renderGeneration) return;
          entry.layer = layer;
          if (ready) { entry.readyTiles++; entry.adopted = true; }
          if (complete) {
            entry.complete = true; entry.adopted = true; entry.readyTiles = entry.totalTiles;
            stats.readyTiles = entry.totalTiles; stats.missingTiles = 0;
            stats.renderBatches = renderJob?.stats.batches; stats.maxBatchMs = renderJob?.stats.maxBatchMs;
            renderJob = null; activeCache = null; retainCompleted(entry);
          }
          scheduleView(view);
        },
      });
      renderJob = job; entry.layer = job.layer; entry.totalTiles = job.tileCount; activeCache = entry;
      stats.readyTiles = 0; stats.missingTiles = job.tileCount; updateStats();
    };
    const scheduleView = next => {
      view = next; pendingView = next;
      if (viewFrame) return;
      viewFrame = requestAnimationFrame(() => {
        viewFrame = 0; if (!pendingView) return;
        pendingView = null; paint();
      });
    };
    const scheduleDetail = (delay = 100) => {
      clearTimeout(detailTimer);
      detailTimer = setTimeout(() => { detailTimer = 0; startDetail(); }, delay);
    };
    const restoreVisit = () => {
      if (!visible() || !visitKey || !mapData || completeCaches.length || activeCache) return;
      const cached = takeTownVisit(visitKey, mapData);
      if (cached) { completeCaches.push(cached); stats.cacheHits++; scheduleView(view); }
    };
    const zoom = d3.zoom().scaleExtent([.55, 8]).clickDistance(5)
      .filter(event => (!event.ctrlKey || event.type === "wheel") && !event.button &&
        (event.type === "wheel" || !event.target.closest("button")))
      .on("start", () => { moving = true; renderJob?.pause(); clearTimeout(detailTimer); })
      .on("zoom", event => scheduleView(event.transform))
      .on("end", event => { moving = false; view = event.transform; paint(); updateScale(); scheduleDetail(); });
    const surface = d3.select(root).call(zoom);
    controlsRef.current = {
      zoomIn: () => surface.call(zoom.scaleBy, 1.35, [width / 2, height / 2]),
      zoomOut: () => surface.call(zoom.scaleBy, 1 / 1.35, [width / 2, height / 2]),
      reset: () => { if (project) surface.call(zoom.transform, viewForTarget(project, targetRef.current, width, height)); },
      focusTarget: () => { if (project) surface.call(zoom.transform, viewForTarget(project, targetRef.current, width, height)); },
      refreshMarkers: () => paint(),
      refreshActive: () => visibility(),
    };
    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const nextWidth = Math.round(root.clientWidth), nextHeight = Math.round(root.clientHeight);
        if (!nextWidth || !nextHeight) return;
        if (nextWidth === width && nextHeight === height) return;
        clearCaches();
        width = nextWidth; height = nextHeight;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
        project = initialProjection(place, width, height);
        visitKey = JSON.stringify([place.tag, place.position, language, width, height, ratio]);
        restoreVisit();
        zoom.extent([[0, 0], [width, height]]);
        surface.call(zoom.transform, viewForTarget(project, targetRef.current, width, height));
      });
    };
    const observer = new ResizeObserver(resize); observer.observe(root); resize();
    loadTownMapData(place.tag).then(payload => {
      if (disposed) return;
      mapData = payload?.place ?? { roads: [], buildings: [], water: [], labels: [] };
      restoreVisit();
      setDataUnavailable(!payload || (!mapData.roads.length && !mapData.buildings.length));
      if (project) scheduleDetail(450);
    }).catch(() => { if (!disposed) setDataUnavailable(true); });
    const visibility = () => {
      if (!visible()) {
        clearTimeout(detailTimer); renderJob?.pause();
      } else {
        restoreVisit();
        if (recoveryPending) recover();
        else scheduleDetail(450);
      }
    };
    const intersection = new IntersectionObserver(entries => { intersecting = entries.at(-1).isIntersecting; visibility(); });
    intersection.observe(root);
    document.addEventListener("visibilitychange", visibility);
    const recover = () => {
      if (disposed || !width || !height) return;
      if (!visible()) { recoveryPending = true; renderJob?.pause(); return; }
      recoveryPending = false;
      cancelRender();
      completeCaches = completeCaches.filter(entry => {
        if (restoreMapSurface(entry.layer.canvas)) {
          entry.layer.ctx.setTransform(entry.layer.ratio, 0, 0, entry.layer.ratio, 0, 0);
          return true;
        }
        releaseCache(entry); return false;
      });
      // Completed terrain is authoritative; unfinished tiles restart after a
      // context loss. Private markers are drawn afresh from current props.
      canvas.width = canvas.width; paint(); updateScale(); visibility();
    };
    const stopRecovery = observeCanvasRecovery(recover);
    canvas.addEventListener("contextrestored", recover);
    return () => {
      disposed = true; renderGeneration++; cancelAnimationFrame(resizeFrame); cancelAnimationFrame(viewFrame);
      clearTimeout(detailTimer); intersection.disconnect(); document.removeEventListener("visibilitychange", visibility);
      stopRecovery(); canvas.removeEventListener("contextrestored", recover);
      const reusable = completeCaches.find(entry => entry.publicDefault);
      if (reusable && retainTownVisit(visitKey, reusable)) completeCaches = completeCaches.filter(entry => entry !== reusable);
      observer.disconnect(); clearCaches();
      surface.on(".zoom", null); controlsRef.current = null; canvas.width = 0; canvas.height = 0;
    };
  }, [place, language]);

  useEffect(() => { controlsRef.current?.refreshActive(); }, [active]);
  useEffect(() => { controlsRef.current?.focusTarget(); }, [targetKey]);
  useLayoutEffect(() => { controlsRef.current?.refreshMarkers(); }, [markerKey, targetId]);

  const name = language === "en" ? place?.nameEn ?? place?.name : place?.name;
  return <PencilSurface ref={rootRef} as="section" variant="paper" seed={1327} clipContent
    className="adventure-town-map" data-place={place?.tag}>
    <canvas ref={canvasRef} className="adventure-town-map__canvas" role="img"
      aria-label={language === "en" ? `${name} local pencil street map` : `${name}彩铅街道局部地图`} />
    {markers.map(marker => <button key={marker.bookingId} type="button"
      ref={node => { if (node) markerRefs.current.set(marker.bookingId, node); else markerRefs.current.delete(marker.bookingId); }}
      className={`adventure-town-map__stay-marker${marker.bookingId === targetId ? " is-selected" : ""}`}
      aria-label={language === "en" ? `View stay: ${marker.nameEn}` : `查看住宿：${marker.name}`}
      aria-pressed={marker.bookingId === targetId}
      onClick={() => onSelectStay?.({ bookingId: marker.bookingId })} />)}
    <nav className="trip-map-controls adventure-town-map__controls"
      aria-label={language === "en" ? "Town map view" : "城镇地图视图"}>
      <GameIconButton label={language === "en" ? "Zoom in town map" : "放大城镇地图"}
        onClick={() => controlsRef.current?.zoomIn()}><ZoomInIcon /></GameIconButton>
      <GameIconButton label={language === "en" ? "Zoom out town map" : "缩小城镇地图"}
        onClick={() => controlsRef.current?.zoomOut()}><ZoomOutIcon /></GameIconButton>
      <GameIconButton label={language === "en" ? "Reset town map" : "复位城镇地图"}
        onClick={() => controlsRef.current?.reset()}><ResetIcon /></GameIconButton>
    </nav>
    <AdventureMapScale ref={scaleRef} language={language} />
    {dataUnavailable && <p className="adventure-town-map__status" role="status"><PencilText>
      {language === "en" ? "Street detail is unavailable for this stop." : "此地点暂无可用街道细节。"}
    </PencilText></p>}
  </PencilSurface>;
}
