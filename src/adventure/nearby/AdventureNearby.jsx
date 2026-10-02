import { memo, useEffect, useRef } from "react";
import { GameIconButton } from "../GameIconButton";
import { LocationMapIcon, NextIcon } from "../SketchIcons";
import { PencilText, PencilTextPersistenceProvider } from "../pencil/PencilText";
import { PanelDivider } from "../pencil/PanelDivider";
import { PencilSurface } from "../pencil/PencilSurface";
import { nearbyDistanceLabel } from "./nearbyModel.js";
import { useNearbyContext } from "./useNearbyContext.js";
import "./AdventureNearby.css";

const locationLabels = {
  off: ["定位未开启", "Location off"], loading: ["正在定位", "Locating"],
  paused: ["定位已暂停", "Location paused"], stale: ["位置已过期", "Location is out of date"],
  imprecise: ["定位精度不足", "Location is imprecise"], denied: ["定位权限未获允许", "Location permission denied"],
  timeout: ["定位超时", "Location timed out"], unavailable: ["暂时无法定位", "Location unavailable"],
  unsupported: ["此环境不支持定位", "Location not supported"],
};

function ContextRow({ label, title, detail, onClick, itemKey, live = false }) {
  const Tag = onClick ? "button" : "div";
  return <Tag className="trip-nearby-row" type={onClick ? "button" : undefined} onClick={onClick}
    data-nearby-key={itemKey}>
    <span className="trip-nearby-copy">
      <span className="trip-nearby-label"><PencilText>{label}</PencilText></span>
      <span className="trip-nearby-title" role={live ? "status" : undefined} aria-live={live ? "polite" : undefined}><PencilText>{title}</PencilText></span>
      {detail && <span className="trip-nearby-detail"><PencilText>{detail}</PencilText></span>}
    </span>
    {onClick && <span className="trip-nearby-arrow" aria-hidden="true"><NextIcon /></span>}
  </Tag>;
}

export const AdventureNearby = memo(function AdventureNearby({ active, language, onNavigate }) {
  const model = useNearbyContext(active, language);
  const root = useRef(null), returnFocus = useRef(null);
  const text = (zh, en) => language === "en" ? en : zh;
  useEffect(() => {
    if (!active || !returnFocus.current) return;
    const key = returnFocus.current;
    returnFocus.current = null;
    const button = [...(root.current?.querySelectorAll("button") ?? [])]
      .find(node => node.dataset.nearbyKey === key);
    (button ?? root.current?.querySelector("button"))?.focus({ preventScroll: true });
  }, [active]);
  const open = (key, target, id, scope) => () => {
    returnFocus.current = key;
    onNavigate(target, id, scope);
  };
  const rowTime = row => {
    const format = (instant, zone, withDate) => new Intl.DateTimeFormat(language === "en" ? "en-NZ" : "zh-CN", {
      timeZone: zone, ...(withDate ? { month: "numeric", day: "numeric" } : {}),
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(instant));
    const zoneLabel = zone => zone === "Pacific/Auckland" ? text("新西兰时间", "NZ time") : zone;
    const start = format(row.start, row.zone, true);
    if (row.pointOnly) return `${start} · ${zoneLabel(row.zone)}${text(" · 结束时间未定", " · End time unknown")}`;
    const endZone = row.endZone ?? row.zone;
    if (endZone !== row.zone) return `${start} · ${zoneLabel(row.zone)} → ${format(row.end, endZone, true)} · ${zoneLabel(endZone)}`;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: row.zone, year: "numeric", month: "2-digit", day: "2-digit" });
    const crossesDate = date.format(new Date(row.start)) !== date.format(new Date(row.end));
    return `${start}–${format(row.end, endZone, crossesDate)} · ${zoneLabel(row.zone)}`;
  };
  const { current, next, nearby, locationState, day, fallback, locationEvidence } = model;
  const locationLabel = locationLabels[locationState.status]?.[language === "en" ? 1 : 0];
  const nearbyTitle = nearby ? language === "en" ? nearby.nameEn ?? nearby.name : nearby.name
    : model.location ? text("附近暂无行程地点", "No itinerary places nearby") : locationLabel ?? text("位置待更新", "Awaiting location");
  const openNearby = nearby ? nearby.target === "stay"
    ? open("nearby", "nearby-stay", nearby)
    : open("nearby", nearby.target, nearby.targetId) : undefined;
  const currentMode = locationEvidence?.status === "conflict" ? text("计划与定位不符", "Plan differs from location")
    : current?.pointOnly ? text("计划时点", "Scheduled time")
    : current?.confidence === "near-place" ? text("可能正在", "Possibly now")
    : current?.confidence === "on-route" ? text("可能在途中", "Possibly en route") : text("按计划", "As scheduled");
  const currentDetail = current ? rowTime(current) : fallback?.detail;
  const openCurrent = current ? open("current", "event", { event: current.event, agendaItem: current.agendaItem })
    : fallback?.target && fallback.targetId ? open("current", fallback.target, fallback.targetId)
    : day ? open("current", "day", day.dateId) : undefined;
  return <aside ref={root} className="trip-nearby" hidden={!active} aria-label={text("附近与当前行程", "Nearby and current itinerary")}>
    <PencilTextPersistenceProvider persistence="memory">
      <PencilSurface variant="wash" className="trip-nearby-content trip-nearby-surface">
        <div className="trip-nearby-location">
          <ContextRow label={text("附近", "Nearby")} title={nearbyTitle} live
            detail={nearby ? nearbyDistanceLabel(nearby.distance, language) : null}
            onClick={openNearby} itemKey="nearby" />
          <GameIconButton className="trip-nearby-location-toggle" aria-pressed={locationState.enabled}
            label={locationState.enabled ? text("关闭附近定位", "Turn off nearby location")
              : text("开启附近定位，仅在本机使用", "Enable nearby location, used only on this device")}
            onClick={model.toggleLocation}><LocationMapIcon /></GameIconButton>
        </div>
        {(day || current || fallback || next) && <>
          <div className="trip-nearby-divider"><PanelDivider /></div>
          <ContextRow itemKey="current" label={current ? `${text("现在", "Now")} · ${currentMode}` : text("现在", "Now")}
            title={current?.label ?? fallback?.label ?? text("当前没有定时安排", "No scheduled activity now")}
            detail={currentDetail}
            onClick={openCurrent} />
          {next && <>
            <div className="trip-nearby-divider"><PanelDivider /></div>
            <ContextRow itemKey="next" label={text("接下来", "Up next")} title={next.label} detail={rowTime(next)}
              onClick={open("next", "event", { event: next.event, agendaItem: next.agendaItem })} />
          </>}
        </>}
      </PencilSurface>
    </PencilTextPersistenceProvider>
  </aside>;
});
