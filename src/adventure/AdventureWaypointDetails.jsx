import { adventureField, adventureText } from "./adventureLabels";
import { PencilText } from "./pencil/PencilText";
import { PanelDivider } from "./pencil/PanelDivider";
import "./AdventureWaypointDetails.css";

const specificityLabels = {
  place: ["明确地点", "Specific place"],
  area: ["区域级参考点", "Area-level reference"],
  town: ["城镇级参考点", "Town-level reference"],
  city: ["城市级参考点", "City-level reference"],
};

export function AdventureWaypointDetails({ waypoint, route, language = "zh" }) {
  const specificity = specificityLabels[waypoint.specificity] ?? specificityLabels.area;
  return <article className="trip-waypoint-detail">
    <section className="trip-waypoint-summary">
      <div className="trip-waypoint-kicker"><PencilText>{adventureText(specificity[0], specificity[1], language)}</PencilText></div>
      <p><PencilText>{adventureField(waypoint, "summary", language)}</PencilText></p>
      <dl>
        <div><dt><PencilText>{adventureText("类型", "Type", language)}</PencilText></dt><dd><PencilText>{waypoint.kind}</PencilText></dd></div>
        <div><dt><PencilText>{adventureText("所属路线", "Route", language)}</PencilText></dt><dd><PencilText>{route.label}</PencilText></dd></div>
        <div><dt><PencilText>{adventureText("当天时间", "Time", language)}</PencilText></dt><dd><PencilText>{waypoint.time ?? route.date}</PencilText></dd></div>
      </dl>
    </section>
    <section className="trip-waypoint-source">
      <div className="trip-waypoint-section-heading"><h2><PencilText>{adventureText("点位依据", "Location basis", language)}</PencilText></h2><PanelDivider /></div>
      <p><PencilText>{waypoint.source.label} · {waypoint.source.reviewedAt}</PencilText></p>
      <p><PencilText>{waypoint.source.note}</PencilText></p>
      <p><PencilText>{adventureText("坐标只用于行程地图定位，不替代现场导航、停车入口或实时道路信息。", "Coordinates are for itinerary context, not live navigation, parking entrances, or road conditions.", language)}</PencilText></p>
      {waypoint.source.sourceUrl && <a href={waypoint.source.sourceUrl} target="_blank" rel="noreferrer"><PencilText>{adventureText("查看点位来源 ↗", "View location source ↗", language)}</PencilText></a>}
      <a href={waypoint.mapUrl} target="_blank" rel="noreferrer"><PencilText>{adventureText("在地图中核对位置 ↗", "Check this location on a map ↗", language)}</PencilText></a>
    </section>
  </article>;
}
