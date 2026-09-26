import { useEffect, useRef } from "react";
import * as d3 from "d3";
import geo from "./data/coastline.json";
import { adventureStops } from "./adventureData";
import { drawWaterLabels } from "./pencil/drawWaterLabels";
import { drawBathymetry } from "./drawBathymetry";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "./SketchIcons";
import { GameIconButton } from "./GameIconButton";
import { adventureRoutes, projectedRoutePath, routeGeometryLabel } from "./adventureRoutes";
import { createPencilMap } from "./pencil/drawPencilMap";
import { createPencilRoutes, routeBadge } from "./pencil/drawPencilRoutes";
import { fillStopLabel } from "./pencil/mapLabels";
import { clearPencilLabels } from "./pencil/label";
import { createStopMarker } from "./pencil/stopMarker";
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
const FOCUS_DURATION = 850;

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
  const placed = [...area.querySelectorAll('.trip-map-controls')].map(element => element.getBoundingClientRect());
  const placedLeaders = [];
  const overlaps = (a, b) => a.left < b.right + 2 && a.right + 2 > b.left &&
    a.top < b.bottom + 2 && a.bottom + 2 > b.top;
  const ordered = labels.map((entry, index) => ({
    ...entry, dot: dots[index], size: entry.label.getBoundingClientRect(),
  }));

  for (const { button, label, leader, dot, size } of ordered) {
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
        const start = 8, end = distance - toLabelEdge - 2;
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
    label.style.left = `${button.clientWidth / 2 + chosen.offset[0]}px`;
    label.style.right = "auto";
    label.style.top = `${button.clientHeight / 2 + chosen.offset[1]}px`;
    label.style.transform = "translate(-50%, -50%)";
    label.style.visibility = "visible";
    if (chosen.connector) {
      const { from, ux, uy, length } = chosen.connector;
      leader.style.left = `${button.clientWidth / 2 + from.x - x}px`;
      leader.style.top = `${button.clientHeight / 2 + from.y - y}px`;
      leader.style.width = `${length}px`;
      leader.style.transform = `rotate(${Math.atan2(uy, ux) * 180 / Math.PI}deg)`;
      leader.style.display = "block";
    }
  }
}

export function AdventureMap({ selected, selectedRoute, onSelect, onRouteSelect, onClear }) {
  const container = useRef(null);
  const controls = useRef(null);
  const state = useRef({ selected, selectedRoute, onSelect, onRouteSelect });
  state.current = { selected, selectedRoute, onSelect, onRouteSelect };
  useEffect(() => {
    container.current.querySelectorAll(".trip-stop").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tag === selected));
    });
    controls.current?.selectRoutes({ selected, selectedRoute });
    container.current.querySelectorAll(".trip-route-hit").forEach((path) => {
      path.setAttribute("aria-pressed", String(path.dataset.route === selectedRoute));
    });
    if (selected) controls.current?.focusPlace(selected);
    else controls.current?.cancelFocus();
  }, [selected, selectedRoute]);
  useEffect(() => {
    const area = container.current, svg = d3.select(area.querySelector("svg.trip-map"));
    const sea = d3.select(area.querySelector("svg.trip-depth-map"));
    const canvas = area.querySelector("canvas.trip-pencil-map");
    const routeCanvas = area.querySelector("canvas.trip-pencil-routes");
    const buttons = area.querySelector(".trip-point-buttons");
    const surface = d3.select(area);
    let world, depthWorld, pencil, routeInk, waterLabels, markerPositions = [], layout = null, shortRouteSpot = null;
    let view = d3.zoomIdentity, focusing = false;
    const initialView = (width, height) => {
      const scale = mapScale(width, height);
      const focusX = (southCenter[0] - (minX + maxX) / 2) * scale + width / 2;
      const focusY = (southCenter[1] - (minY + maxY) / 2) * scale + height / 2;
      const zoomLevel = 2.16;
      return d3.zoomIdentity.translate(width / 2 - focusX * zoomLevel,
        height / 2 - focusY * zoomLevel).scale(zoomLevel);
    };
    const placeView = (position, width, height) => d3.zoomIdentity
      .translate(width / 2 - position[0] * PLACE_ZOOM,
        height / 2 - position[1] * PLACE_ZOOM).scale(PLACE_ZOOM);
    const applyView = (transform) => {
      view = transform;
      world?.attr("transform", transform.toString());
      depthWorld?.attr("transform", transform.toString());
      pencil?.draw(transform);
      routeInk?.draw(transform, { moving: focusing });
      if (shortRouteSpot) {
        const { group, middle } = shortRouteSpot;
        group.attr("transform", `translate(${middle}) scale(${1 / transform.k})`);
      }
      waterLabels?.updateZoom(transform.k);
      markerPositions.forEach(({ button, position }) => {
        const [x, y] = transform.apply(position);
        button.style.left = x + "px";
        button.style.top = y + "px";
        button.dataset.labelSide = x < 110 ? "right" : x > area.clientWidth - 110 ? "left" : "center";
      });
      area.dataset.zoom = transform.k.toFixed(3);
      positionOverviewLabels(area, markerPositions);
      waterLabels?.avoidStops(markerPositions);
    };
    const zoom = d3.zoom().scaleExtent([0.55, 12]).clickDistance(5)
      .filter((event) => (!event.ctrlKey || event.type === "wheel") && !event.button &&
        (event.type === "wheel" || !event.target.closest("button")))
      .on("start", (event) => { if (event.sourceEvent) area.classList.add("is-dragging"); })
      .on("zoom", (event) => applyView(event.transform))
      .on("end", () => { area.classList.remove("is-dragging"); if (!focusing) pencil?.refine(view); });
    surface.call(zoom);
    const finishFocus = () => {
      focusing = false;
      area.dataset.focusing = "false";
      routeInk?.draw(view);
      pencil?.refine(view);
    };
    controls.current = {
      cancelFocus: () => surface.interrupt(),
      selectRoutes: (selection) => routeInk?.select(selection),
      zoomIn: () => surface.call(zoom.scaleBy, 1.35),
      zoomOut: () => surface.call(zoom.scaleBy, 1 / 1.35),
      reset: () => surface.call(zoom.transform, initialView(area.clientWidth, area.clientHeight)),
      focusPlace: (tag) => {
        const marker = markerPositions.find((item) => item.tag === tag);
        if (!marker) return;
        surface.interrupt();
        const target = placeView(marker.position, area.clientWidth, area.clientHeight);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          (Math.abs(view.k - target.k) < .001 && Math.hypot(view.x - target.x, view.y - target.y) < .1)) {
          surface.call(zoom.transform, target);
          return;
        }
        focusing = true;
        area.dataset.focusing = "true";
        surface.transition().duration(FOCUS_DURATION).ease(d3.easeCubicInOut)
          .call(zoom.transform, target)
          .on("end.focus interrupt.focus cancel.focus", finishFocus);
      },
    };
    function draw() {
      const width = area.clientWidth, height = area.clientHeight;
      if (!width || !height) return;
      surface.interrupt();
      // The view transform never depends on selection or the side panel.
      const scale = mapScale(width, height);
      const project = (point) => {
        const [x, y] = base(point);
        return [(x - (minX + maxX) / 2) * scale + width / 2, (y - (minY + maxY) / 2) * scale + height / 2];
      };
      svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
      sea.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
      shortRouteSpot = null;
      waterLabels = null;
      world = svg.append("g").attr("class", "trip-world");
      depthWorld = sea.append("g").attr("class", "trip-depth-world");
      drawBathymetry(depthWorld, project);
      pencil?.dispose();
      pencil = createPencilMap(canvas, project, width, height);
      const routes = world.append("g").attr("class", "trip-routes");
      const routeEntries = [];
      // Links remain in the same coordinate system as the coastline and dots.
      [...adventureRoutes].sort((a, b) => Number(b.transport === "flight") - Number(a.transport === "flight")).forEach((route) => {
        const path = projectedRoutePath(route, project);
        routeEntries.push({ route, path, points: route.roadGeometry?.coordinates.map(project) });
        const group = routes.append("g").attr("class", "trip-route-group")
          .on("pointerenter", () => routeInk?.hover(route.id))
          .on("pointerleave", () => routeInk?.hover(null))
          .on("focusin", () => routeInk?.hover(route.id))
          .on("focusout", () => routeInk?.hover(null));
        group.append("title").text(`${route.date} · ${route.label}（${routeGeometryLabel(route)}）`);
        // The transparent stroke follows the same curve; station buttons sit
        // above this SVG so their hit targets keep priority on touch screens.
        // Keep pointer starts bubbling to D3 so this is still draggable.
        group.append("path").attr("d", path).attr("class", "trip-route-hit")
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
        if (route.id === "zqn-wanaka") {
          // At an island-wide phone scale the two stop buttons nearly touch.
          // Give this short route its own visible 44px tap target below them.
          const first = project([route.points[0][1], route.points[0][0]]);
          const last = project([route.points.at(-1)[1], route.points.at(-1)[0]]);
          const dx = last[0] - first[0], dy = last[1] - first[1];
          const length = Math.hypot(dx, dy) || 1;
          const point = group.select(".trip-route-hit").node();
          const midpoint = point.getPointAtLength(point.getTotalLength() / 2);
          const middle = [midpoint.x, midpoint.y];
          const normal = [-dy / length, dx / length];
          const center = normal.map(value => value * 35);
          const spot = group.append("g").attr("class", "trip-short-route-spot").attr("aria-hidden", "true");
          shortRouteSpot = { group: spot, middle };
          spot.append("image").attr("class", "trip-short-route-art")
            .attr("href", routeBadge(route.date, normal)).attr("x", -56).attr("y", -56)
            .attr("width", 112).attr("height", 112);
          spot.append("circle").attr("class", "trip-short-route-tap")
            .attr("cx", center[0]).attr("cy", center[1]).attr("r", 22)
            .on("click", (event) => {
              event.stopPropagation();
              if (!event.defaultPrevented) state.current.onRouteSelect(route.id);
            });
        }
      });
      routeInk?.dispose();
      routeInk = createPencilRoutes(routeCanvas, routeEntries, width, height);
      routeInk.select(state.current);
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
        const dot = createStopMarker(7201 + markerPositions.length * 97);
        const label = document.createElement("span"); label.className = "trip-stop-label";
        fillStopLabel(label, stop.name.split(" · ")[0], 6100 + markerPositions.length);
        label.setAttribute("aria-hidden", "true");
        const leader = document.createElement("span"); leader.className = "trip-stop-leader"; leader.setAttribute("aria-hidden", "true");
        button.append(leader, dot, label);
        button.onclick = () => {
          if (state.current.selected === stop.tag) controls.current?.focusPlace(stop.tag);
          state.current.onSelect(stop.tag);
        };
        buttons.append(button);
        markerPositions.push({ button, position: [x, y], tag: stop.tag });
      });
      zoom.extent([[0, 0], [width, height]]);
      area._project = project;
      let nextView = initialView(width, height);
      if (!layout && state.current.selected) {
        const marker = markerPositions.find((item) => item.tag === state.current.selected);
        if (marker) nextView = placeView(marker.position, width, height);
      }
      if (layout) {
        const center = view.invert([layout.width / 2, layout.height / 2]);
        const nx = (center[0] - layout.width / 2) * scale / layout.scale + width / 2;
        const ny = (center[1] - layout.height / 2) * scale / layout.scale + height / 2;
        nextView = d3.zoomIdentity.translate(width / 2 - nx * view.k, height / 2 - ny * view.k).scale(view.k);
      }
      layout = { width, height, scale };
      surface.call(zoom.transform, nextView);
    }
    let frame = 0, disposed = false;
    const redraw = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(redraw); observer.observe(area); redraw();
    document.fonts.ready.then(() => { if (!disposed) { clearPencilLabels(); redraw(); } });
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); surface.interrupt(); pencil?.dispose(); routeInk?.dispose(); surface.on(".zoom", null); controls.current = null; buttons.replaceChildren(); svg.selectAll("*").remove(); sea.selectAll("*").remove(); };
  }, []);
  return <div ref={container} className="trip-map-area">
    <svg className="trip-depth-map" aria-hidden="true" />
    <canvas className="trip-pencil-map" role="img" aria-label="C 重描彩铅地表：林地、草地、农田、灌丛、裸地、冰雪、湿地与城镇；海洋按 200、1000、2000、4000 米深度分色" />
    <canvas className="trip-pencil-routes" aria-hidden="true" />
    <svg className="trip-map" role="group" aria-label="南北岛彩铅地图及可点击路线；实线为自驾公路参考路径，短虚线为航线示意，长虚线为大巴公路参考路径" onClick={onClear} />
    <div className="trip-point-buttons" />
    <nav className="trip-map-controls" aria-label="地图视图">
      <GameIconButton label="放大地图" onClick={() => controls.current?.zoomIn()}><ZoomInIcon /></GameIconButton>
      <GameIconButton label="缩小地图" onClick={() => controls.current?.zoomOut()}><ZoomOutIcon /></GameIconButton>
      <GameIconButton label="复位地图" onClick={() => controls.current?.reset()}><ResetIcon /></GameIconButton>
    </nav>
  </div>;
}
