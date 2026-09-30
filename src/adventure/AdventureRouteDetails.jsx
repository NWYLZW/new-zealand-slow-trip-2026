import { adventureDays, adventureStops } from "./adventureData";
import { useLanguage } from "../LanguageContext";
import { AdventureRouteInk } from "./AdventureRouteInk";
import { PanelDivider } from "./pencil/PanelDivider";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import { getAdventureWaypoint, getAgendaWaypoint, getRouteWaypointCoverage } from "./adventureWaypoints";
import { agendaIconType, getAgendaIconDefinition } from "./adventureAgendaIcons";
import "./AdventureRouteDetails.css";

function AgendaIcon({ type }) {
  const definition = getAgendaIconDefinition(type);
  return <PencilIcon kind={definition.kind} sourceSize={definition.sourceSize}>
    {definition.paths.map((path, index) => <path key={index} d={path.d} className={path.className} />)}
  </PencilIcon>;
}

function routeNodes(route, itinerary, en) {
  const byTag = new Map(adventureStops.map(stop => [stop.tag, stop]));
  const tags = [route.from, ...(route.via ?? []), route.to];
  const cities = route.transport === "flight" ? route.label.split(" → ") : [];
  const nodes = tags.map((tag, index) => {
    const hotel = index === 0 ? route.hotelEndpoints?.origin
      : index === tags.length - 1 ? route.hotelEndpoints?.destination : null;
    if (hotel) return { key: `${hotel.bookingId}-${index}`, name: hotel.name,
      role: index === 0 ? (en ? "Start hotel" : "起点 · 酒店") : (en ? "Destination hotel" : "终点 · 酒店") };
    const stop = byTag.get(tag);
    return { key: `${tag}-${index}`, tag: stop?.tag ?? null,
      name: cities[index] || stop?.name || tag,
      role: index === 0 ? "起点" : index === tags.length - 1 ? "终点" : "途经" };
  });
  if (route.roundTrip) {
    nodes.splice(1, 0, ...(route.waypointIds ?? []).map(getAdventureWaypoint).filter(Boolean)
      .map(point => ({ key: point.id, waypoint: point.id, name: point.name,
        role: point.drivingStop ? "途经" : "步行停留" })));
    nodes.at(-1).role = route.hotelEndpoints?.destination
      ? (en ? "Return hotel" : "返程 · 酒店") : "返程";
  }
  // Arrowtown is named in this day's itinerary; it is not an adventure map stop.
  if (route.id === "zqn-wanaka" && !route.via?.length && itinerary?.title.includes("箭镇")) {
    nodes.splice(1, 0, { key: "arrowtown", tag: null, waypoint: "arrowtown", name: "箭镇", role: "途经" });
  }
  if (route.transport === "coach") {
    const start = nodes[0];
    nodes.push({ ...start, key: `${start.key}-return`, role: "返程" });
  }
  return nodes;
}

function SectionHeading({ children }) {
  return <div className="trip-route-section-heading">
    <h2><PencilText>{children}</PencilText></h2>
    <PanelDivider />
  </div>;
}

export function AdventureRouteDetails({ route, navigate }) {
  const { language } = useLanguage();
  const en = language === "en";
  const [month, day] = route.date.split("/");
  const itinerary = adventureDays.find(item => item.date === `${Number(month)}月${Number(day)}日`);
  const nodes = routeNodes(route, itinerary, en);
  const hotelSourceDates = [...new Set(Object.values(route.hotelConnections ?? {})
    .map(item => item.source?.retrievedAt?.slice(0, 10)).filter(Boolean))];

  return <article className="trip-route-detail">
    {route.hotelEndpoints && route.hotelRoadStatus !== "connected" && <p role="status"><PencilText>
      {route.hotelRoadStatus === "loading"
        ? (en ? "Loading roads near the hotels." : "酒店附近道路连接加载中。")
        : (en ? "Some hotel road connections are unavailable. Check the route in Maps."
          : "部分酒店附近道路连接缺失，请用外部地图核对。")}
    </PencilText></p>}
    {nodes.length > 1 && <section className="trip-route-section" aria-label="途经站点">
      <SectionHeading>行进路线</SectionHeading>
      <ol className="trip-route-diagram">
        <AdventureRouteInk mode={route.transport} color={route.color} count={nodes.length} />
        {nodes.map(node => <li key={node.key}>
          <span className="trip-route-node-mark" data-route-node aria-hidden="true" />
          <span className="trip-route-node-content">
            <span className="trip-route-node-role"><PencilText>{node.role}</PencilText></span>
            {node.tag ? <button type="button" className="trip-route-node-link"
              onClick={() => navigate("place", node.tag)}
              aria-label={`查看${node.name}地点`}><PencilText>{node.name}</PencilText></button>
              : node.waypoint ? <button type="button" className="trip-route-node-link"
                onClick={() => navigate("waypoint", node.waypoint)}
                aria-label={`查看${node.name}途经点详情`}><PencilText>{node.name}</PencilText></button>
              : <span className="trip-route-node-name"><PencilText>{node.name}</PencilText></span>}
          </span>
        </li>)}
      </ol>
    </section>}

    {itinerary?.events?.length > 0 && <section className="trip-route-section" aria-label={`${itinerary.date}当天安排`}>
      <SectionHeading>当天安排</SectionHeading>
      <ol className="trip-route-agenda">
        {itinerary.events.map(([time, text], index) => {
          const waypoint = getAgendaWaypoint(route.id, index);
          const iconType = agendaIconType(text, route.transport);
          const contents = <>
            <time><PencilText>{time}</PencilText></time>
            <span className="trip-route-agenda-icon"><AgendaIcon type={iconType} /></span>
            <span className="trip-route-agenda-text"><PencilText>{text}</PencilText></span>
          </>;
          return <li key={`${time}-${index}`} className={waypoint ? "trip-route-agenda--mapped" : undefined}>
            {waypoint ? <button type="button" onClick={() => navigate("waypoint", waypoint.id)}
              aria-label={`查看途经点详情：${waypoint.name}`}>{contents}</button> : contents}
          </li>;
        })}
      </ol>
    </section>}

    {(() => {
      const coverage = getRouteWaypointCoverage(route.id);
      if (!coverage.mapped.length && !coverage.unresolved.length) return null;
      return <details className="trip-route-waypoint-coverage">
        <summary><PencilText>途经点覆盖 · {coverage.mapped.length} 个已定位</PencilText></summary>
        <div>
          {coverage.unresolved.map(item => <p key={`${item.eventIndex}-${item.label}`}>
            <strong><PencilText>{item.label}</PencilText></strong>
            <span><PencilText>未打点：{item.reason}</PencilText></span>
          </p>)}
          {!coverage.unresolved.length && <p><PencilText>当天有地点含义的安排均已关联到现有点位或新增参考点。</PencilText></p>}
        </div>
      </details>;
    })()}

    <details className="trip-route-provenance">
      <summary><PencilText>路线来源与限制</PencilText></summary>
      <div>
        {route.hotelEndpoints && <p><PencilText>{en
          ? "Hotel connections use local OpenStreetMap roads, snapped near the property. Entrances, one-way roads and turn restrictions are not verified. Missing connections retain the city road reference."
          : "酒店附近采用本地 OpenStreetMap 道路参考线，端点吸附至邻近道路；入口、单行及转向限制未核验。缺失连接处保留城市道路参考线。"}</PencilText></p>}
        {hotelSourceDates.length > 0 && <p><PencilText>OpenStreetMap · {hotelSourceDates.join(", ")}</PencilText></p>}
        {route.transport === "flight" ? <p><PencilText>航线为城市间示意，并非实际飞行轨迹。</PencilText></p>
          : route.roadSource ? <>
            <p><PencilText>OSRM / FOSSGIS · 采集于 {route.roadSource.retrievedAt.slice(0, 10)}。</PencilText></p>
            <p><PencilText>{route.transport === "coach"
              ? "按汽车路网计算，非运营商确认路线；往返共用参考线。"
              : "按沿途站点计算，非实测行车轨迹。"}不含实时路况或封路信息。</PencilText></p>
            <p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><PencilText>© OpenStreetMap contributors ↗</PencilText></a>
              {" · "}<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer"><PencilText>纠正地图 ↗</PencilText></a></p>
          </> : <p><PencilText>道路数据未加载，当前仅为站点连线示意。</PencilText></p>}
      </div>
    </details>
  </article>;
}
