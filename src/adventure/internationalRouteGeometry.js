import { geoInterpolate } from "d3";

function validCoordinate(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
}

function normalizeLongitude(longitude) {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

export function latLngToGeoCoordinate(position) {
  if (!validCoordinate(position)) return null;
  return [normalizeLongitude(position[1]), position[0]];
}

export function splitSchematicLineAtAntimeridian(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
  const parts = [[coordinates[0]]];
  for (const coordinate of coordinates.slice(1)) {
    const current = parts.at(-1);
    const previous = current.at(-1);
    if (Math.abs(coordinate[0] - previous[0]) > 180) parts.push([coordinate]);
    else current.push(coordinate);
  }
  return parts.filter(part => part.length > 1);
}

export function createSchematicGreatCircle(from, to, samples = 48) {
  if (!validCoordinate(from) || !validCoordinate(to)) return [];
  const count = Math.max(8, Math.min(128, Math.round(samples)));
  const interpolate = geoInterpolate(from, to);
  const coordinates = Array.from({ length: count + 1 }, (_, index) => {
    const [longitude, latitude] = interpolate(index / count);
    return [normalizeLongitude(longitude), latitude];
  });
  return splitSchematicLineAtAntimeridian(coordinates);
}

export function internationalCoordinateBounds(stops) {
  const positions = stops.map(stop => latLngToGeoCoordinate(stop.position)).filter(Boolean);
  if (!positions.length) return null;
  return positions.reduce((bounds, [longitude, latitude]) => ({
    west: Math.min(bounds.west, longitude),
    south: Math.min(bounds.south, latitude),
    east: Math.max(bounds.east, longitude),
    north: Math.max(bounds.north, latitude),
  }), { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity });
}
