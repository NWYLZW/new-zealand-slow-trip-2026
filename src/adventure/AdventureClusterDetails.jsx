import { useLayoutEffect, useRef } from "react";
import { getMapNode } from "./adventureMapNodes";
import { adventureRoutes } from "./adventureRoutes";
import { getAgendaIconDefinition } from "./adventureAgendaIcons";
import { CityIcon, NextIcon } from "./SketchIcons";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import { PanelDivider } from "./pencil/PanelDivider";
import { drawPencilWash } from "./pencil/wash";
import "./AdventureClusterDetails.css";

function seedFor(value) {
  return [...value].reduce((seed, character) =>
    Math.imul(seed ^ character.codePointAt(0), 16777619), 2166136261) >>> 0;
}

function ClusterMemberWash({ seed }) {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current, parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;
    let frame = 0, lastPaint = "";
    const paint = () => {
      frame = 0;
      const width = parent.clientWidth, height = parent.clientHeight;
      if (width < 1 || height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const css = getComputedStyle(parent);
      const color = css.getPropertyValue("--trip-surface-quiet-wash").trim() || "#8eaa8a";
      const dark = document.documentElement.dataset.adventureAppearance === "dark";
      const paintKey = `${width}:${height}:${ratio}:${color}:${dark}`;
      if (paintKey === lastPaint) return;
      lastPaint = paintKey;
      canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawPencilWash(context, { x: 0, y: 2, width, height: height - 4 }, color, seed,
        { strength: dark ? .31 : .2, spacing: 2.2, roughness: 4, inset: 5, radius: 5 });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const observer = new ResizeObserver(schedule); observer.observe(parent);
    const appearance = new MutationObserver(schedule);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    paint();
    return () => { observer.disconnect(); appearance.disconnect(); cancelAnimationFrame(frame); };
  }, [seed]);
  return <canvas ref={canvasRef} className="trip-cluster-member-wash" aria-hidden="true" />;
}

export function AdventureClusterDetails({ keys, language, onSelect }) {
  const nodes = keys.map(getMapNode).filter(Boolean);
  return <ul className="trip-cluster-list" aria-label={language === "en" ? "Locations in this group" : "聚合地点列表"}>
    {nodes.map((node, index) => {
      const { record } = node;
      const name = language === "en" ? record.nameEn ?? record.name : record.name;
      const route = adventureRoutes.find(item => item.id === record.routeId);
      const detail = node.kind === "place" ? record.date : node.kind === "airport"
        ? `${language === "en" ? record.cityEn ?? record.city : record.city} · ${record.iataCode}` : route?.label;
      const kindLabel = node.kind === "place" ? (language === "en" ? "Main stop" : "主站点")
        : node.kind === "airport" ? (language === "en" ? "Airport" : "机场")
          : (language === "en" ? "Waypoint" : "途经点");
      const icon = getAgendaIconDefinition(record.iconType);
      return <li key={node.key}>
        <button type="button" className="trip-cluster-member" onClick={() => onSelect(node.key)}>
          <ClusterMemberWash seed={seedFor(node.key)} />
          <span className="trip-cluster-member-icon" aria-hidden="true">
            {node.kind === "place" ? <CityIcon /> : <PencilIcon kind={icon.kind} sourceSize={icon.sourceSize}>
              {icon.paths.map((path, pathIndex) => <path key={pathIndex} {...path} />)}
            </PencilIcon>}
          </span>
          <span className="trip-cluster-member-copy">
            <strong><PencilText>{name}</PencilText></strong>
            <span><PencilText>{kindLabel}{detail ? ` · ${detail}` : ""}</PencilText></span>
          </span>
          <span className="trip-cluster-member-arrow" aria-hidden="true"><NextIcon /></span>
        </button>
        {index < nodes.length - 1 && <div className="trip-cluster-member-divider"><PanelDivider /></div>}
      </li>;
    })}
  </ul>;
}
