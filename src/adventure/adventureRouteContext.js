import { adventureRouteIndex } from "./adventureRouteIndex";
import { getTripCalendarDay } from "../components/calendar/tripCalendarData";

const routeIds = new Set(adventureRouteIndex.filter(route => ["road", "coach"].includes(route.transport))
  .map(route => route.id));

export function eventAdventureRouteIds(event) {
  return (event?.segmentIds ?? []).filter(id => routeIds.has(id));
}

export function adventureContextRouteIds(view) {
  if (view.front === "tasks" && view.focus?.kind === "date") {
    const day = getTripCalendarDay(view.focus.value);
    return [...new Set(day?.events.flatMap(eventAdventureRouteIds) ?? [])];
  }
  if (view.rightPanel === "event" && view.eventId) {
    const day = getTripCalendarDay(view.eventId.split("|")[0]);
    return eventAdventureRouteIds(day?.events.find(event => event.urlId === view.eventId));
  }
  if (view.focus?.kind !== "date") return [];
  const day = getTripCalendarDay(view.focus.value);
  return [...new Set(day?.events.flatMap(eventAdventureRouteIds) ?? [])];
}
