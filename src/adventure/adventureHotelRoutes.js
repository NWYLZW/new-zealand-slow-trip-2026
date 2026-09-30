import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";

const validPosition = value => Array.isArray(value) && value.length === 2
  && value.every(Number.isFinite) && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180;

export function resolveHotelRouteEndpoints(routes, { isUnlocked = false, data, language = "zh" } = {}) {
  if (!isUnlocked) return routes;
  const days = getAdventureCalendarDays({ isPrivateUnlocked: true, privateVault: data, language });
  return routes.map(route => {
    if (route.transport !== "road") return route;
    const [month, day] = route.date.split("/").map(Number);
    const dateId = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const event = days.find(item => item.dateId === dateId)?.events
      .find(item => item.segmentIds?.includes(route.id));
    if (!event?.stayIntegration) return route;
    const endpoint = (phase, cityTag) => {
      const stay = event.stayContexts.find(item => item.phase === phase);
      if (!stay || !validPosition(stay.position)) return null;
      return { bookingId: stay.booking.bookingId, name: stay.name, cityTag,
        position: [...stay.position], phase };
    };
    const origin = endpoint(event.stayIntegration.routeOrigin, route.from);
    const destination = endpoint(event.stayIntegration.routeDestination
      ?? (route.roundTrip ? event.stayIntegration.routeOrigin : null), route.to);
    if (!origin && !destination) return route;
    const replaceEnds = points => points.map((point, index) => index === 0 && origin
      ? origin.position : index === points.length - 1 && destination ? destination.position : point);
    return { ...route, points: replaceEnds(route.points), routingPoints: replaceEnds(route.routingPoints),
      hotelEndpoints: { origin, destination }, hotelRoadStatus: "loading" };
  });
}

export function routeFocusPositions(route) {
  return [...(route.roadGeometry?.coordinates ?? route.points.map(([lat, lng]) => [lng, lat])),
    ...Object.values(route.hotelEndpoints ?? {}).filter(Boolean).map(({ position: [lat, lng] }) => [lng, lat])];
}
