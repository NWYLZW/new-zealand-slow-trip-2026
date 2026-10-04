import { adventureDays } from "./adventureData";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import { getAgendaWaypoint } from "./adventureWaypoints";
import { agendaActivityIcon, agendaIconType, getAgendaIconDefinition } from "./adventureAgendaIcons";
import { zonedLocalInstant } from "./adventureEventTime";
import { scheduleDurationLabel } from "./scheduleDuration";
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
  const entries = (itinerary?.events ?? []).map((entry, index) => ({ entry, index }));
  if (entries.every(({ entry }) => entry[2]?.date && entry[2]?.start)) {
    entries.sort((a, b) => `${a.entry[2].date}T${a.entry[2].start}`
      .localeCompare(`${b.entry[2].date}T${b.entry[2].start}`));
  }

  return <article className="trip-route-detail">
    {itinerary?.events?.length > 0 && <ol className="trip-route-agenda" aria-label={`${itinerary.date}当天安排`}>
      {entries.map(({ entry: [time, text, meta = {}], index }) => {
        if (route.agendaIndexes && !route.agendaIndexes.includes(index)) return null;
        const waypoint = getAgendaWaypoint(route.id, index);
        const iconType = agendaActivityIcon(meta.activityType) ?? agendaIconType(text, route.transport);
        const start = zonedLocalInstant(meta.date, meta.start, meta.timeZone);
        const end = zonedLocalInstant(meta.endDate ?? meta.date, meta.end, meta.timeZone);
        const duration = scheduleDurationLabel(start, end, meta);
        const endClock = `${meta.endDate && meta.endDate !== meta.date ? "次日 " : ""}${meta.end}`;
        const contents = <>
          <time><PencilText>{time}</PencilText></time>
          <span className="trip-route-agenda-icon"><AgendaIcon type={iconType} /></span>
          <span className="trip-route-agenda-text"><PencilText>{meta.activityType ? meta.summary ?? text : text}</PencilText>
            {duration && <small><PencilText>{`${meta.start}—${endClock} · ${duration}`}</PencilText></small>}
          </span>
        </>;
        return <li key={`${time}-${index}`} className={waypoint ? "trip-route-agenda--mapped" : undefined}>
          {waypoint ? <button type="button" onClick={() => navigate("waypoint", waypoint.id)}
            aria-label={`查看途经点详情：${waypoint.name}`}>{contents}</button> : contents}
        </li>;
      })}
    </ol>}
  </article>;
}
