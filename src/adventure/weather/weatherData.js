import { zonedLocalInstant } from "../adventureEventTime.js";

export const WEATHER_PROVIDER = {
  name: "Open-Meteo", url: "https://open-meteo.com/", licence: "https://creativecommons.org/licenses/by/4.0/",
  forecastDocs: "https://open-meteo.com/en/docs", archiveDocs: "https://open-meteo.com/en/docs/historical-weather-api",
};
export const HOUR = 3600000;
const DAY = 24 * HOUR;
const formatters = new Map();
export function weatherLocalParts(instant, timeZone) {
  if (!formatters.has(timeZone)) formatters.set(timeZone, new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }));
  const parts = Object.fromEntries(formatters.get(timeZone).formatToParts(new Date(instant))
    .filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, clock: `${parts.hour}:${parts.minute}` };
}
export function addWeatherDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}
export function weatherWindow(date, timeZone) {
  return { start: zonedLocalInstant(date, "00:00", timeZone), end: zonedLocalInstant(addWeatherDays(date, 1), "00:00", timeZone) };
}
export function weatherRequest(date, location, now = Date.now()) {
  if (!location) return { key: `${date}|unknown`, date, location, product: null, unavailable: "location" };
  const today = weatherLocalParts(now, location.timeZone).date;
  const age = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY);
  const product = age >= 6 ? "reanalysis" : age > 0 ? "archived-forecast" : "forecast";
  const window = weatherWindow(date, location.timeZone);
  const utcToday = new Date(now).toISOString().slice(0, 10);
  const forecastEnd = Date.parse(`${addWeatherDays(utcToday, 16)}T00:00:00Z`);
  return { key: `${location.id}|${date}|${product}`, date, location, product, ...window,
    unavailable: age < -15 || (product === "forecast" && window.end > forecastEnd) ? "horizon"
      : date < "1940-01-01" ? "archive-range" : null };
}
export const weatherTtl = product => product === "reanalysis" ? DAY : 30 * 60000;

export function buildWeatherUrl(requests) {
  const first = requests[0], archive = first.product === "reanalysis";
  const url = new URL(archive ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast");
  // UTC requests avoid the provider's single-offset local-time ranges around DST.
  const start = Math.min(...requests.map(request => request.start));
  const end = Math.max(...requests.map(request => request.end)) - HOUR;
  const params = { latitude: first.location.latitude, longitude: first.location.longitude,
    start_hour: new Date(start).toISOString().slice(0, 16), end_hour: new Date(end).toISOString().slice(0, 16),
    start_date: new Date(start).toISOString().slice(0, 10), end_date: new Date(end).toISOString().slice(0, 10),
    hourly: "temperature_2m,precipitation,weather_code,wind_speed_10m", timezone: "GMT", timeformat: "unixtime",
    temperature_unit: "celsius", precipitation_unit: "mm", wind_speed_unit: "kmh" };
  if (archive) params.models = "era5";
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.href;
}

const codes = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]);
const number = value => typeof value === "number" && Number.isFinite(value) ? value : null;
export function normalizeWeather(payload, request, fetchedAt, sourceUrl) {
  if (!Array.isArray(payload?.hourly?.time) || payload?.hourly_units?.time !== "unixtime") throw new Error("invalid-response");
  const values = payload.hourly, units = payload.hourly_units;
  const byTime = new Map(values.time.map((time, index) => [typeof time === "number" ? time * 1000 : null, index]));
  const read = (name, unit, index, nonnegative = false) => {
    if (units[name] !== unit || index === undefined) return null;
    const result = number(values[name]?.[index]);
    return nonnegative && result !== null && result < 0 ? null : result;
  };
  const hours = [];
  for (let instant = request.start; instant < request.end; instant += HOUR) {
    const index = byTime.get(instant), code = read("weather_code", "wmo code", index);
    hours.push({ instant, clock: weatherLocalParts(instant, request.location.timeZone).clock,
      temperature: read("temperature_2m", "°C", index), precipitation: read("precipitation", "mm", index, true),
      wind: read("wind_speed_10m", "km/h", index, true), code: codes.has(code) ? code : null });
  }
  const temperatures = hours.map(hour => hour.temperature).filter(value => value !== null);
  const conditions = hours.map(hour => hour.code).filter(value => value !== null);
  const completeTemperature = temperatures.length === hours.length;
  const completeConditions = conditions.length === hours.length;
  return { date: request.date, product: request.product, locationId: request.location.id, fetchedAt, sourceUrl,
    hours, partial: hours.some(hour => [hour.temperature, hour.precipitation, hour.wind, hour.code].some(value => value === null)),
    available: hours.some(hour => [hour.temperature, hour.precipitation, hour.wind, hour.code].some(value => value !== null)),
    daily: { min: completeTemperature ? Math.min(...temperatures) : null,
      max: completeTemperature ? Math.max(...temperatures) : null,
      code: completeConditions ? Math.max(...conditions) : null } };
}
