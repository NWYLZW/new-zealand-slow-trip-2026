import { adventureDays } from "./adventureData";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import { getAgendaWaypoint } from "./adventureWaypoints";
import { agendaIconType, getAgendaIconDefinition } from "./adventureAgendaIcons";
import "./AdventureRouteDetails.css";

function AgendaIcon({ type }) {
  const definition = getAgendaIconDefinition(type);
  return <PencilIcon kind={definition.kind} sourceSize={definition.sourceSize}>
    {definition.paths.map((path, index) => <path key={index} d={path.d} className={path.className} />)}
  </PencilIcon>;
}

export function AdventureRouteDetails({ route, navigate }) {
  const [month, day] = route.date.split("/");
  const itinerary = adventureDays.find(item => item.date === `${Number(month)}月${Number(day)}日`);

  return <article className="trip-route-detail">
    {itinerary?.events?.length > 0 && <ol className="trip-route-agenda" aria-label={`${itinerary.date}当天安排`}>
      {itinerary.events.map(([time, text], index) => {
        if (route.agendaIndexes && !route.agendaIndexes.includes(index)) return null;
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
    </ol>}
  </article>;
}
