import { DrawablyCard } from "drawably/react";
import { StableSketchButton as DrawablyButton } from "./StableSketchButton";
import { CloseIcon, PreviousIcon, NextIcon } from "./SketchIcons";
import { assetPath } from "../assets";
import { gallery } from "../tripData";
import { confirmedAccommodationBookings } from "../data/confirmedAccommodationBookings";
import { adventureDays, adventureStops, sketchOptions } from "./adventureData";
import { adventureRoutes } from "./adventureRoutes";
import { AdventureRouteDetails } from "./AdventureRouteDetails";
import { MapSources } from "./MapSources";
import { PencilText } from "./pencil/PencilText";

export function AdventurePanel({ view, navigate, closeButtonRef }) {
  const index = adventureStops.findIndex((stop) => stop.tag === view.place);
  const stop = adventureStops[index];
  const route = adventureRoutes.find((item) => item.id === view.route);
  const title = route?.label ?? stop?.name ?? { tasks: "任务", bag: "背包", photos: "相册" }[view.panel];
  const step = (delta) => navigate("place", adventureStops[(index + delta + adventureStops.length) % adventureStops.length].tag);
  return <aside className="trip-panel" aria-label={title}>
    <DrawablyCard {...sketchOptions} className="trip-day">
      <div ref={closeButtonRef} className="trip-close-wrap">
        <DrawablyButton {...sketchOptions} className="trip-close" aria-label="关闭面板" onClick={() => navigate()}><CloseIcon /></DrawablyButton>
      </div>
      <div className="trip-panel-body">
        {route && <AdventureRouteDetails route={route} navigate={navigate} />}
        {stop && <>
          <div><span className="trip-date"><PencilText>{stop.date}</PencilText></span><h1 className="trip-location"><PencilText>{stop.name}</PencilText></h1></div>
          <p className="trip-description"><PencilText>{stop.desc}</PencilText></p>
          <div className="trip-card-actions">
            <DrawablyButton {...sketchOptions} className="trip-prev" aria-label="上一站" onClick={() => step(-1)}><PreviousIcon /></DrawablyButton>
            <DrawablyButton {...sketchOptions} variant="solid" onClick={() => window.location.assign(assetPath(stop.tag === "AKC" || stop.tag === "HBT" ? "#north" : "#south"))}><PencilText>查看行程</PencilText></DrawablyButton>
            <DrawablyButton {...sketchOptions} className="trip-next" aria-label="下一站" onClick={() => step(1)}><NextIcon /></DrawablyButton>
          </div>
        </>}
        {view.panel === "tasks" && <>
          <h1 className="trip-panel-title"><PencilText>任务</PencilText></h1>
          <div className="trip-task-list">{adventureDays.map((day) => <details key={day.date + day.title} className="trip-task">
            <summary><span><PencilText>{day.date}</PencilText></span><strong><PencilText>{day.title}</PencilText></strong></summary>
            <ol>{day.events.map(([time, description], i) => <li key={i}><time><PencilText>{time}</PencilText></time><span><PencilText>{description}</PencilText></span></li>)}</ol>
          </details>)}</div>
        </>}
        {view.panel === "bag" && <>
          <h1 className="trip-panel-title"><PencilText>背包</PencilText></h1>
          <div className="trip-bag-links">
            <a href={assetPath("#car")}><PencilText>租车安排 ↗</PencilText></a>
            <a href={assetPath("#activities")}><PencilText>活动预订 ↗</PencilText></a>
            <a href={assetPath("#notes")}><PencilText>出行备忘 ↗</PencilText></a>
          </div>
          <h2 className="trip-section-title"><PencilText>已确认住宿</PencilText></h2>
          <ul className="trip-bag-list">{Object.values(confirmedAccommodationBookings).map((stay) => <li key={stay.bookingId}>
            <a href={assetPath(`?stay=${encodeURIComponent(stay.bookingId)}#booking`)}>
              <strong><PencilText>{stay.listingName}</PencilText></strong><span><PencilText>{stay.checkIn} → {stay.checkOut}</PencilText></span>
            </a>
          </li>)}</ul>
          <MapSources />
        </>}
        {view.panel === "photos" && <>
          <h1 className="trip-panel-title"><PencilText>相册</PencilText></h1>
          <p className="trip-description"><PencilText>目的地照片</PencilText></p>
          <div className="trip-photo-grid">{gallery.map((photo) => <figure key={photo.src}>
            <a href={photo.src} target="_blank" rel="noreferrer"><img src={photo.src} alt={photo.alt} loading="lazy" /></a>
            <figcaption><PencilText>{photo.title}</PencilText></figcaption>
          </figure>)}</div>
        </>}
      </div>
    </DrawablyCard>
  </aside>;
}
