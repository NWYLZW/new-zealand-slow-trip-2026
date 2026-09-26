import { adventureStops } from "../adventureData";

const placeTags = new Set(["ZQN", "WKA", "AOR", "TEK", "OAM", "CHC", "AKC", "HBT"]);
const matchRadiusKm = 35;
const stops = adventureStops.filter((stop) => placeTags.has(stop.tag)
  && Array.isArray(stop.position) && stop.position.length === 2);

function distanceKm([aLat, aLng], [bLat, bLng]) {
  const radians = Math.PI / 180;
  const dLat = (bLat - aLat) * radians;
  const dLng = (bLng - aLng) * radians;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * radians) * Math.cos(bLat * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function isKnownPlaceTag(tag) {
  return placeTags.has(tag);
}

export function nearbyPlaceTag(gps) {
  if (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)
    || gps.lat < -90 || gps.lat > 90 || gps.lng < -180 || gps.lng > 180) return null;
  if (gps.accuracyMeters != null && gps.accuracyMeters > 5000) return null;
  const nearest = stops.map((stop) => ({ tag: stop.tag, distance: distanceKm([gps.lat, gps.lng], stop.position) }))
    .sort((left, right) => left.distance - right.distance)[0];
  return nearest?.distance <= matchRadiusKm ? nearest.tag : null;
}

export function listMediaForPlace(placeTag, items = []) {
  if (!isKnownPlaceTag(placeTag)) return [];
  return items.filter((item) => (item.manualPlaceTag === "unassigned" ? null
    : item.manualPlaceTag ?? item.autoPlaceTag) === placeTag);
}
