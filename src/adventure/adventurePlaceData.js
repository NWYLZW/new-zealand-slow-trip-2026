import { activityBookingPlans } from "../tripData";
import { confirmedAccommodationBookings } from "../data/confirmedAccommodationBookings";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";

// These IDs are the same public-safe stays and activity plans used by the main site.
const stayIdsByPlace = {
  ZQN: ["hotel-queenstown"],
  WKA: ["hotel-wanaka"],
  AOR: ["mount-cook"],
  OAM: ["hotel-oamaru"],
  CHC: ["hotel-christchurch"],
  AKC: ["hotel-auckland-city"],
};

const activityIdsByPlace = {
  ZQN: ["walter-peak"],
  AOR: ["mount-cook-helicopter", "mount-cook-stargazing"],
  OAM: ["oamaru-penguins"],
  AKC: ["hobbiton"],
  HBT: ["hobbiton"],
};

export function placeCalendarDays(tag) {
  if (!tag) return [];
  return getAdventureCalendarDays()
    .map((entry) => ({ ...entry, events: entry.events.filter((event) => {
      if (event.stopTags?.includes(tag)) return true;
      // AKL is Auckland's airport, while AKC is its city stop. Include only
      // the known initial arrival/connection, not every airport-only event.
      return tag === "AKC" && ["2026-09-28", "2026-09-29"].includes(entry.dateId)
        && event.flights?.some((flight) => /\bAKL\b/.test(`${flight.from} ${flight.to}`));
    }) }))
    .filter((entry) => entry.events.length > 0);
}

export function placeStays(tag) {
  return (stayIdsByPlace[tag] ?? [])
    .map((id) => confirmedAccommodationBookings[id])
    .filter(Boolean);
}

export function placeActivities(tag) {
  const ids = new Set(activityIdsByPlace[tag] ?? []);
  return activityBookingPlans.filter((activity) => ids.has(activity.id));
}
