import { DrawablyBadge } from "drawably/react";
import { StableSketchButton } from "./StableSketchButton";
import { adventureDays, adventureStops, sketchOptions } from "./adventureData";
import { assetPath } from "../assets";
import { routeDirectionsUrl } from "./adventureRoutes";
import { PencilText } from "./pencil/PencilText";

const transportNames = { road: "自驾", flight: "航班", coach: "大巴往返" };
export function AdventureRouteDetails({ route, navigate }) {
  const [month, day] = route.date.split("/");
  const itinerary = adventureDays.find((item) => item.date === `${Number(month)}月${Number(day)}日`);
  const stops = [route.from, ...route.via, route.to].map((tag) => adventureStops.find((stop) => stop.tag === tag));
  const flightCities = route.transport === "flight" ? route.label.split(" → ") : null;
  return <>
    <div>
      <span className="trip-date"><PencilText>{route.date}</PencilText></span>
      <h1 className="trip-location trip-route-title">{route.label.split(/( → | ⇄ | · )/).map((part, index) => <span key={index}><PencilText>{part.trim()}</PencilText></span>)}</h1>
      <DrawablyBadge {...sketchOptions} className="trip-route-type"><PencilText>{transportNames[route.transport] ?? route.transport}</PencilText></DrawablyBadge>
    </div>
    <ol className="trip-route-stops">
      {stops.map((stop, index) => <li key={stop.tag}>
        <span><PencilText>{index === 0 ? "起点" : index === stops.length - 1 ? (route.transport === "coach" ? "目的地 · 当天返回" : "终点") : "途经"}</PencilText></span>
        <button type="button" onClick={() => navigate("place", stop.tag)}><PencilText>{flightCities ? `${flightCities[index]}机场` : stop.name}</PencilText></button>
      </li>)}
    </ol>
    {itinerary && <section className="trip-route-day">
      <h2><PencilText>当天安排</PencilText></h2>
      <ol>{itinerary.events.map(([time, text], index) => <li key={index}><time><PencilText>{time}</PencilText></time><span><PencilText>{text}</PencilText></span></li>)}</ol>
    </section>}
    <div className="trip-route-note">
      {route.transport === "flight" ? <p><PencilText>航线为城市间示意，并非实际飞行轨迹。</PencilText></p> : route.roadSource ? <>
        <p><PencilText>{route.transport === "coach" ? "大巴公路参考路径" : "道路参考路径"} · 约 {Math.round(route.roadSource.distanceM / 1000)} km</PencilText></p>
        <p><PencilText>OSRM / FOSSGIS · 采集于 {route.roadSource.retrievedAt.slice(0, 10)}。{route.transport === "coach"
          ? "按汽车路网计算，非运营商确认路线；往返共用参考线。" : "按沿途站点计算，非实测行车轨迹。"}不含实时路况或封路信息。</PencilText></p>
        <p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><PencilText>© OpenStreetMap contributors</PencilText></a>
          {" · "}<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer"><PencilText>纠正地图</PencilText></a></p>
      </> : <p><PencilText>道路数据未加载，当前仅为站点连线示意。</PencilText></p>}
      {route.transport !== "flight" && <p><a href={routeDirectionsUrl(route)} target="_blank" rel="noreferrer"><PencilText>在 Google 地图打开 ↗</PencilText></a></p>}
    </div>
    <div className="trip-card-actions">
      <StableSketchButton {...sketchOptions} variant="solid" onClick={() =>
        window.location.assign(assetPath(route.transport === "coach" ? "#north" : "#south"))
      }><PencilText>查看完整行程</PencilText></StableSketchButton>
    </div>
  </>;
}
