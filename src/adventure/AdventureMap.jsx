import { useEffect, useRef } from "react";
import * as d3 from "d3";
import geo from "./data/coastline.json";
import { adventureStops } from "./adventureData";
import { getTerrainRegions, terrainPointToGeo } from "./terrain";
import { drawTerrainBackground } from "./terrainBackground";
import { drawTerrainDecorations } from "./drawTerrainDecorations";
import { drawHydrography } from "./drawHydrography";
import { drawBathymetry } from "./drawBathymetry";
import { drawSketchStroke } from "./sketchLines";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "./SketchIcons";
import { GameIconButton } from "./GameIconButton";
import { adventureRoutes, projectedRoutePath } from "./adventureRoutes";
import { drawLandmarks } from "./drawLandmarks";
import { drawDecorations, updateDecorationVisibility } from "./drawDecorations";
import "./route-ink.css";
import "./sketch-lines.css";

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
const PLACE_ZOOM = 3.25;

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

function positionOverviewLabels(area, markers, zoomScale) {
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
  if (zoomScale >= 1.4) return;

  const viewport = area.getBoundingClientRect();
  const dots = labels.map(({ button }) => button.querySelector(".trip-stop-dot").getBoundingClientRect());
  const placed = [], placedLeaders = [];
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
    container.current.querySelectorAll(".trip-route").forEach((path) => {
      path.dataset.active = String(path.dataset.route === selectedRoute || path.dataset.stops.split(" ").includes(selected));
    });
    container.current.querySelectorAll(".trip-route-hit").forEach((path) => {
      path.setAttribute("aria-pressed", String(path.dataset.route === selectedRoute));
    });
    if (selected) controls.current?.focusPlace(selected);
  }, [selected, selectedRoute]);
  useEffect(() => {
    const area = container.current, svg = d3.select(area.querySelector("svg"));
    const buttons = area.querySelector(".trip-point-buttons");
    const terrain = getTerrainRegions();
    const surface = d3.select(area);
    let world, hydro, markerPositions = [], layout = null, shortRouteSpot = null;
    let view = d3.zoomIdentity;
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
      if (shortRouteSpot) {
        const { group, middle, normal } = shortRouteSpot;
        const center = [middle[0] + normal[0] * 35 / transform.k,
          middle[1] + normal[1] * 35 / transform.k];
        group.select(".trip-short-route-leader").attr("d",
          `M${middle[0]},${middle[1]}Q${middle[0] + normal[0] * 13 / transform.k},${middle[1] + normal[1] * 13 / transform.k} ${center[0] - normal[0] * 15 / transform.k},${center[1] - normal[1] * 15 / transform.k}`);
        group.selectAll("circle").attr("cx", center[0]).attr("cy", center[1]);
        group.select(".trip-short-route-disc").attr("r", 16 / transform.k);
        group.select(".trip-short-route-tap").attr("r", 22 / transform.k);
        group.select("text").attr("x", center[0]).attr("y", center[1]).style("font-size", `${12 / transform.k}px`);
      }
      hydro?.updateZoom(transform.k);
      markerPositions.forEach(({ button, position }) => {
        const [x, y] = transform.apply(position);
        button.style.left = x + "px";
        button.style.top = y + "px";
        button.dataset.labelSide = x < 110 ? "right" : x > area.clientWidth - 110 ? "left" : "center";
      });
      area.dataset.zoom = transform.k.toFixed(3);
      positionOverviewLabels(area, markerPositions, transform.k);
      updateDecorationVisibility(area, transform.k);
    };
    const zoom = d3.zoom().scaleExtent([0.55, 12]).clickDistance(5)
      .filter((event) => (!event.ctrlKey || event.type === "wheel") && !event.button &&
        (event.type === "wheel" || !event.target.closest("button")))
      .on("start", (event) => { if (event.sourceEvent) area.classList.add("is-dragging"); })
      .on("zoom", (event) => applyView(event.transform))
      .on("end", () => area.classList.remove("is-dragging"));
    surface.call(zoom);
    controls.current = {
      zoomIn: () => surface.call(zoom.scaleBy, 1.35),
      zoomOut: () => surface.call(zoom.scaleBy, 1 / 1.35),
      reset: () => surface.call(zoom.transform, initialView(area.clientWidth, area.clientHeight)),
      focusPlace: (tag) => {
        const marker = markerPositions.find((item) => item.tag === tag);
        if (marker) surface.call(zoom.transform, placeView(marker.position, area.clientWidth, area.clientHeight));
      },
    };
    function draw() {
      const width = area.clientWidth, height = area.clientHeight;
      if (!width || !height) return;
      // The view transform never depends on selection or the side panel.
      const scale = mapScale(width, height);
      const project = (point) => {
        const [x, y] = base(point);
        return [(x - (minX + maxX) / 2) * scale + width / 2, (y - (minY + maxY) / 2) * scale + height / 2];
      };
      const coast = rings.map((ring) => "M" + ring.map((p) => project(p).map((n) => n.toFixed(2)).join(",")).join("L") + "Z").join("");
      svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
      shortRouteSpot = null;
      hydro = null;
      world = svg.append("g").attr("class", "trip-world");
      drawBathymetry(world, project);
      const waves = svg.append("g").attr("aria-hidden", "true").lower();
      for (let y = 105; y < height - 30; y += 108) for (let x = 35 + (Math.floor(y / 108) % 2) * 65; x < width - 35; x += 158) {
        waves.append("path").attr("d", `M${x},${y}q8,-3 16,0t16,0`).attr("class", "trip-wave");
      }
      if (width >= 650) {
        world.append("text").attr("x", width * 0.18).attr("y", height * 0.30).attr("text-anchor", "middle").attr("class", "trip-sea-label").text("塔斯曼海");
        world.append("text").attr("x", width * 0.79).attr("y", height * 0.77).attr("text-anchor", "middle").attr("class", "trip-sea-label").text("太平洋");
      }
      world.append("path").attr("d", coast).attr("class", "trip-coast").style("stroke", "none");
      const defs = svg.append("defs");
      defs.append("clipPath").attr("id", "adventure-coast-clip").append("path").attr("d", coast);
      const ground = world.append("g").attr("class", "trip-game-ground").attr("clip-path", "url(#adventure-coast-clip)");
      drawTerrainBackground(ground, project);
      if (width >= 650) {
        const stopPoints = adventureStops.map((stop) => project([stop.position[1], stop.position[0]]));
        terrain.mountains.forEach((mountain) => {
          const [x, y] = project(terrainPointToGeo([mountain.x, mountain.y]));
          if (stopPoints.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < 38)) return;
          ground.append("path").attr("d", `M${x - 12},${y + 4}l8,-12 6,9 5,-6 8,10M${x - 4},${y - 8}l1,6 3,-2`)
            .attr("class", "trip-mountain-mark");
        });
      }
      world.append("path").attr("d", coast).attr("fill", "none").attr("stroke", "#5c7c6e")
        .attr("stroke-width", .45).attr("opacity", .22)
        .attr("vector-effect", "non-scaling-stroke").attr("stroke-linejoin", "round");
      drawSketchStroke(world, rings.map((ring) => ({ points: ring.map(project), closed: true })),
        { kind: "coast", seed: "nz-coast-v1" });
      drawTerrainDecorations(world, project, scale);
      hydro = drawHydrography(world, project);
      const routes = world.append("g").attr("class", "trip-routes");
      // Links remain in the same coordinate system as the coastline and dots.
      [...adventureRoutes].sort((a, b) => Number(b.transport === "flight") - Number(a.transport === "flight")).forEach((route) => {
        const path = projectedRoutePath(route, project);
        const tags = [route.from, ...route.via, route.to];
        const group = routes.append("g").attr("class", "trip-route-group");
        group.append("path").attr("d", path).attr("class", "trip-route-underlay");
        group.append("path").attr("d", path).attr("class", `trip-route trip-route--${route.transport}`)
          .attr("data-route", route.id).attr("data-stops", tags.join(" "))
          .attr("data-active", String(route.id === state.current.selectedRoute || tags.includes(state.current.selected)))
          .append("title").text(`${route.date} · ${route.label}（站点连线示意）`);
        if (route.transport === "road") group.append("path").attr("d", path).attr("class", "trip-route-ink");
        drawSketchStroke(group, path, { kind: "route", seed: route.id });
        // The transparent stroke follows the same curve; station buttons sit
        // above this SVG so their hit targets keep priority on touch screens.
        // Keep pointer starts bubbling to D3 so this is still draggable.
        group.append("path").attr("d", path).attr("class", "trip-route-hit")
          .attr("data-route", route.id).attr("role", "button").attr("tabindex", 0)
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
          const middle = [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2];
          const normal = [-dy / length, dx / length];
          const center = [middle[0] + normal[0] * 35, middle[1] + normal[1] * 35];
          const spot = group.append("g").attr("class", "trip-short-route-spot").attr("aria-hidden", "true");
          shortRouteSpot = { group: spot, middle, normal };
          spot.append("path").attr("class", "trip-short-route-leader")
            .attr("d", `M${middle[0]},${middle[1]}Q${middle[0] + normal[0] * 13},${middle[1] + normal[1] * 13} ${center[0] - normal[0] * 15},${center[1] - normal[1] * 15}`);
          spot.append("circle").attr("class", "trip-short-route-disc").attr("cx", center[0]).attr("cy", center[1]).attr("r", 16);
          spot.append("text").attr("class", "trip-short-route-date").attr("x", center[0]).attr("y", center[1]).text(route.date);
          spot.append("circle").attr("class", "trip-short-route-tap")
            .attr("cx", center[0]).attr("cy", center[1]).attr("r", 22)
            .on("click", (event) => {
              event.stopPropagation();
              if (!event.defaultPrevented) state.current.onRouteSelect(route.id);
            });
        }
      });
      // Cutouts belong to the same zoom/pan world, above ground and routes.
      // Transparent pixels never intercept marker, route or drag interactions.
      drawLandmarks(world, project, scale);
      drawDecorations(world, project, scale);
      hydro.drawLabels();
      buttons.replaceChildren();
      markerPositions = [];
      adventureStops.forEach((stop) => {
        const [x, y] = project([stop.position[1], stop.position[0]]);
        const button = document.createElement("button");
        button.type = "button"; button.className = "trip-stop"; button.dataset.tag = stop.tag;
        button.style.left = x + "px"; button.style.top = y + "px";
        button.setAttribute("aria-label", stop.name);
        button.setAttribute("aria-pressed", String(stop.tag === state.current.selected));
        const dot = document.createElement("span"); dot.className = "trip-stop-dot"; dot.setAttribute("aria-hidden", "true");
        const label = document.createElement("span"); label.className = "trip-stop-label";
        label.textContent = stop.name.split(" · ")[0]; label.setAttribute("aria-hidden", "true");
        const leader = document.createElement("span"); leader.className = "trip-stop-leader"; leader.setAttribute("aria-hidden", "true");
        button.append(leader, dot, label);
        button.onclick = () => { controls.current?.focusPlace(stop.tag); state.current.onSelect(stop.tag); };
        buttons.append(button);
        markerPositions.push({ button, position: [x, y], tag: stop.tag });
      });
      zoom.extent([[0, 0], [width, height]]);
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
    const observer = new ResizeObserver(draw); observer.observe(area); draw();
    return () => { observer.disconnect(); surface.on(".zoom", null); controls.current = null; buttons.replaceChildren(); svg.selectAll("*").remove(); };
  }, []);
  return <div ref={container} className="trip-map-area">
    <svg className="trip-map" role="group" aria-label="南北岛游戏地图及可点击路线；实线为自驾，短虚线为航班，长虚线为大巴；线路为站点示意" onClick={onClear} />
    <div className="trip-point-buttons" />
    <nav className="trip-map-controls" aria-label="地图视图">
      <GameIconButton label="放大地图" onClick={() => controls.current?.zoomIn()}><ZoomInIcon /></GameIconButton>
      <GameIconButton label="缩小地图" onClick={() => controls.current?.zoomOut()}><ZoomOutIcon /></GameIconButton>
      <GameIconButton label="复位地图" onClick={() => controls.current?.reset()}><ResetIcon /></GameIconButton>
    </nav>
  </div>;
}
