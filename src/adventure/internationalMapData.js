import airportData from "./data/international-airports.json";
import basemap from "./data/international-basemap.json";
import { routeSegments } from "../data/mapRoutes";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { createSchematicGreatCircle, internationalCoordinateBounds,
  latLngToGeoCoordinate } from "./internationalRouteGeometry";

const INTERNATIONAL_SEGMENT_IDS = ["szx-kul", "kul-akl", "akl-kul", "kul-szx"];
const airportNames = {
  SZX: { name: "深圳宝安国际机场", nameEn: "Shenzhen Bao'an International Airport",
    city: "深圳", cityEn: "Shenzhen", countryCode: "CN", timeZone: "Asia/Shanghai" },
  KUL: { name: "吉隆坡国际机场", nameEn: "Kuala Lumpur International Airport",
    city: "吉隆坡", cityEn: "Kuala Lumpur", countryCode: "MY", timeZone: "Asia/Kuala_Lumpur" },
  AKL: { name: "奥克兰国际机场", nameEn: "Auckland Airport",
    city: "奥克兰", cityEn: "Auckland", countryCode: "NZ", timeZone: "Pacific/Auckland" },
};
const segmentLabelsEn = {
  "szx-kul": "Shenzhen to Kuala Lumpur",
  "kul-akl": "Kuala Lumpur to Auckland",
  "akl-kul": "Auckland to Kuala Lumpur",
  "kul-szx": "Kuala Lumpur to Shenzhen",
};

function airportCode(value) {
  return value?.match(/\b([A-Z]{3})$/)?.[1] ?? null;
}

function nextDate(dateId) {
  const date = new Date(`${dateId}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function publicFlightFacts(flight) {
  if (!flight) return null;
  const arrivesNextDay = flight.arrival?.startsWith("次日") ?? false;
  return {
    flightNumber: flight.flightNumber,
    from: flight.from,
    to: flight.to,
    departureDate: flight.date,
    departureTime: flight.departure,
    arrivalDate: arrivesNextDay ? nextDate(flight.date) : flight.date,
    arrivalTime: flight.arrival?.replace(/^次日\s*/, ""),
    arrivesNextDay,
    departureTerminal: flight.departureTerminal,
    arrivalTerminal: flight.arrivalTerminal,
    cabin: flight.cabin,
    status: flight.status,
  };
}

const sourceDays = getAdventureCalendarDays();
const eventBySegment = new Map();
sourceDays.forEach(day => day.events.forEach(event => {
  event.segmentIds?.forEach(segmentId => eventBySegment.set(segmentId, { day, event }));
}));

const internationalStopRecords = airportData.records.map(record => ({
  id: record.iataCode,
  key: `a:${record.iataCode}`,
  tag: record.iataCode,
  kind: "international-airport",
  iconType: "flight",
  name: airportNames[record.iataCode].name,
  nameEn: airportNames[record.iataCode].nameEn,
  city: airportNames[record.iataCode].city,
  cityEn: airportNames[record.iataCode].cityEn,
  airportName: record.name,
  iataCode: record.iataCode,
  icaoCode: record.icaoCode,
  countryCode: airportNames[record.iataCode].countryCode,
  timeZone: airportNames[record.iataCode].timeZone,
  position: record.position,
  coordinate: latLngToGeoCoordinate(record.position),
  coordinateSource: {
    dataset: airportData.source.dataset,
    sourceRecordId: record.sourceRecordId,
    snapshotUrl: airportData.source.snapshotUrl,
    retrievedAt: airportData.source.retrievedAt,
    license: airportData.source.license,
  },
}));

const stopByCode = new Map(internationalStopRecords.map(stop => [stop.iataCode, stop]));

export const internationalFlightSegments = routeSegments
  .filter(segment => INTERNATIONAL_SEGMENT_IDS.includes(segment.id))
  .map(segment => {
    const source = eventBySegment.get(segment.id);
    const flight = source?.event.flights?.find(item =>
      airportCode(item.from) === segment.from && airportCode(item.to) === segment.to);
    const from = stopByCode.get(segment.from);
    const to = stopByCode.get(segment.to);
    return {
      id: segment.id,
      key: `f:${segment.id}`,
      kind: "international-flight",
      direction: segment.sequence < 10 ? "outbound" : "inbound",
      sequence: segment.sequence,
      date: segment.date,
      label: segment.label,
      labelEn: segmentLabelsEn[segment.id],
      color: segment.color,
      transport: "flight",
      from: segment.from,
      to: segment.to,
      fromPosition: from.position,
      toPosition: to.position,
      geometry: {
        type: "MultiLineString",
        coordinates: createSchematicGreatCircle(from.coordinate, to.coordinate),
      },
      geometryMeaning: "schematic-great-circle",
      geometryLabel: "航线示意 · 非实际飞行轨迹",
      geometryLabelEn: "Schematic route, not the actual flight track",
      itinerary: source ? {
        dateId: source.day.dateId,
        eventId: source.event.urlId,
        eventTitle: source.event.title,
      } : null,
      flight: publicFlightFacts(flight),
    };
  });

export const internationalMapStops = internationalStopRecords.map(stop => ({
  ...stop,
  itineraryTargets: internationalFlightSegments
    .filter(segment => segment.from === stop.id || segment.to === stop.id)
    .map(segment => ({ segmentId: segment.id, direction: segment.direction, ...segment.itinerary }))
    .filter(target => target.dateId && target.eventId),
}));

export const internationalMapBounds = internationalCoordinateBounds(internationalMapStops);
export const internationalBasemap = basemap;
export const internationalMapSources = [basemap.source, airportData.source];

export function getInternationalMapNode(key) {
  if (typeof key !== "string") return null;
  if (key.startsWith("a:")) return internationalMapStops.find(stop => stop.key === key) ?? null;
  if (key.startsWith("f:")) return internationalFlightSegments.find(segment => segment.key === key) ?? null;
  return null;
}

export function internationalStopJourneys(code) {
  return internationalFlightSegments.filter(segment => segment.from === code || segment.to === code);
}
