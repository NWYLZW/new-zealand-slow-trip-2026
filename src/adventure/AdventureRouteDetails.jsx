import { DrawablyBadge } from "drawably/react";
import { StableSketchButton } from "./StableSketchButton";
import { adventureDays, adventureStops, sketchOptions } from "./adventureData";
import { assetPath } from "../assets";

const transportNames = { road: "自驾", flight: "航班", coach: "大巴往返" };
export function AdventureRouteDetails({ route, navigate }) {
  const [month, day] = route.date.split("/");
  const itinerary = adventureDays.find((item) => item.date === `${Number(month)}月${Number(day)}日`);
  const stops = [route.from, ...route.via, route.to].map((tag) => adventureStops.find((stop) => stop.tag === tag));
  const flightCities = route.transport === "flight" ? route.label.split(" → ") : null;
  return <>
    <div>
      <span className="trip-date">{route.date}</span>
      <h1 className="trip-location trip-route-title">{route.label.split(/( → | ⇄ | · )/).map((part, index) => <span key={index}>{part.trim()}</span>)}</h1>
      <DrawablyBadge {...sketchOptions} className="trip-route-type">{transportNames[route.transport] ?? route.transport}</DrawablyBadge>
    </div>
    <ol className="trip-route-stops">
      {stops.map((stop, index) => <li key={stop.tag}>
        <span>{index === 0 ? "起点" : index === stops.length - 1 ? (route.transport === "coach" ? "目的地 · 当天返回" : "终点") : "途经"}</span>
        <button type="button" onClick={() => navigate("place", stop.tag)}>{flightCities ? `${flightCities[index]}机场` : stop.name}</button>
      </li>)}
    </ol>
    {itinerary && <section className="trip-route-day">
      <h2>当天安排</h2>
      <ol>{itinerary.events.map(([time, text], index) => <li key={index}><time>{time}</time><span>{text}</span></li>)}</ol>
    </section>}
    <p className="trip-route-note">地图展示站点连线示意，具体道路或航班以实际行程为准。</p>
    <div className="trip-card-actions">
      <StableSketchButton {...sketchOptions} variant="solid" onClick={() =>
        window.location.assign(assetPath(route.transport === "coach" ? "#north" : "#south"))
      }>查看完整行程</StableSketchButton>
    </div>
  </>;
}
