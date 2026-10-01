import lakes from "./itineraryExecution/lakes.json";
import alpine from "./itineraryExecution/alpine.json";
import returnTrip from "./itineraryExecution/return.json";

const refinements = new Map([lakes, alpine, returnTrip].flatMap(region => region.days.map(day => [
  day.date, { ...day, sources: region.sources },
])));

export function withItineraryExecution(day) {
  const date = day.date.match(/^(\d+)月(\d+)日$/);
  const key = date && `2026-${date[1].padStart(2, "0")}-${date[2].padStart(2, "0")}`;
  const refinement = refinements.get(key);
  if (!refinement) return day;
  if (refinement.events.length !== day.events.length) {
    throw new Error(`Execution notes no longer match the itinerary for ${key}`);
  }
  const { events, sources, reviewedAt, date: _date, ...details } = refinement;
  return {
    ...day,
    ...details,
    executionReviewedAt: reviewedAt,
    executionSources: sources,
    // Keep source titles, times and calendar indices stable for media, stays and deep links.
    events: day.events.map(([time, title, metadata], index) => [
      time, title, { ...metadata, execution: events[index] },
    ]),
  };
}
