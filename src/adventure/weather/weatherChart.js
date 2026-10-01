import { curveMonotoneX, line, scaleLinear } from "d3";

export const WEATHER_CHART_HEIGHT = 144;
export const WEATHER_CHART_TOP = 68;
export const WEATHER_HOUR_WIDTH = 64;

export function isEarlyWeatherHour(hour) {
  const clockHour = Number(hour.clock?.slice(0, 2));
  return clockHour >= 0 && clockHour <= 8;
}

export function weatherChartColumns(hours, expanded = false) {
  if (expanded) return hours;
  const earlyHours = hours.filter(isEarlyWeatherHour);
  const temperatures = earlyHours.map(hour => hour.temperature).filter(Number.isFinite);
  const summary = { folded: true,
    temperature: temperatures.length ? temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length : null,
    temperatureSamples: temperatures.length, hourCount: earlyHours.length,
    location: earlyHours.every(hour => hour.location?.id === earlyHours[0]?.location?.id) ? earlyHours[0]?.location : null,
    period: earlyHours.every(hour => hour.period === earlyHours[0]?.period) ? earlyHours[0]?.period : null };
  const columns = [];
  let folded = false;
  for (const hour of hours) {
    if (!isEarlyWeatherHour(hour)) columns.push(hour);
    else if (!folded) {
      columns.push(summary);
      folded = true;
    }
  }
  return columns;
}

export function weatherChartLocationBands(columns) {
  const bands = [];
  for (const [index, hour] of columns.entries()) {
    if (!hour.location) continue;
    const previous = bands.at(-1);
    if (previous?.location.id === hour.location.id && previous.period === hour.period && previous.end === index) {
      previous.end = index + 1;
    } else bands.push({ location: hour.location, period: hour.period, start: index, end: index + 1 });
  }
  return bands;
}

export function weatherChartGeometry(hours, width, scaleHours = hours) {
  const temperatures = scaleHours.map(hour => hour.temperature).filter(Number.isFinite);
  const low = temperatures.length ? Math.min(...temperatures) : 0;
  const high = temperatures.length ? Math.max(...temperatures) : 0;
  const padding = Math.max(1, (high - low) * .15);
  const scale = scaleLinear().domain([low - padding, high + padding])
    .range([WEATHER_CHART_HEIGHT - 12, 32]);
  // Trim unused canvas below the day's lowest point without shifting the scale on expansion.
  const height = Math.ceil((temperatures.length ? scale(low) : WEATHER_CHART_HEIGHT / 2) + 6);
  const column = width / Math.max(1, hours.length);
  const points = hours.map((hour, index) => ({
    x: (index + .5) * column,
    y: Number.isFinite(hour.temperature) ? scale(hour.temperature) : null,
  }));
  // Folded averages join the trend; only missing temperatures break the curve.
  const segments = [];
  let segment = [];
  for (const point of points) {
    if (point.y === null) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(point);
  }
  if (segment.length) segments.push(segment);
  const path = line().x(point => point.x).y(point => point.y).curve(curveMonotoneX);
  return { points, height, paths: segments.filter(part => part.length > 1).map(path),
    guides: temperatures.length ? scale.ticks(3).map(value => scale(value)).filter(y => y <= height - 6) : [] };
}
