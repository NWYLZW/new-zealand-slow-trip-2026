import assert from "node:assert/strict";
import { weatherChartColumns, weatherChartGeometry, WEATHER_CHART_HEIGHT, WEATHER_CHART_TOP } from "../src/adventure/weather/weatherChart.js";

for (const count of [23, 24, 25]) {
  const hours = Array.from({ length: count }, (_, index) => ({ temperature: index - 10 }));
  const chart = weatherChartGeometry(hours, count * 64);
  assert.equal(chart.points.length, count);
  assert.equal(chart.points[0].x, 32);
  assert.equal(chart.points.at(-1).x, count * 64 - 32);
  assert.equal(chart.paths.length, 1);
  assert(chart.points.every(point => Number.isFinite(point.y) && point.y >= 32 && point.y < WEATHER_CHART_HEIGHT));
  assert(chart.points[0].y > chart.points.at(-1).y);
  const bottomGap = chart.height - Math.max(...chart.points.map(point => point.y));
  assert(bottomGap >= 6 && bottomGap < 7, "Canvas ends just below the lowest point, with room for pencil strokes");
  assert(chart.guides.every(y => y <= chart.height - 6), "Guides stay inside the compact canvas");
  assert(WEATHER_CHART_TOP + chart.height <= 202, "Hourly columns have no extra blank footer");
  const iconBottom = 36 + 30;
  assert(chart.points.every(point => {
    const gap = WEATHER_CHART_TOP + point.y - 30 - iconBottom;
    return gap >= 4 && gap <= 104;
  }), "Weather icons and temperature labels must remain compact without overlap");
}
const gap = weatherChartGeometry([1, 2, null, 3, 4].map(temperature => ({ temperature })), 320);
assert.equal(gap.paths.length, 2);
assert.equal(gap.points[2].y, null);
const flat = weatherChartGeometry([0, 0, 0].map(temperature => ({ temperature })), 192);
assert.equal(new Set(flat.points.map(point => point.y)).size, 1);
assert.equal(flat.height, WEATHER_CHART_HEIGHT / 2 + 16, "Constant temperatures do not reserve an unused lower plot area");
assert(!flat.paths[0].includes("NaN"));
assert.equal(weatherChartGeometry([{ temperature: null }], 64).paths.length, 0);
assert.equal(weatherChartGeometry([{ temperature: -3 }], 64).points[0].x, 32);
assert.deepEqual(weatherChartGeometry([], 64).points, []);
assert.equal(weatherChartGeometry([{ temperature: null }], 64).height, WEATHER_CHART_HEIGHT / 2 + 6);
const day = Array.from({ length: 24 }, (_, index) => ({
  instant: index * 3600000, clock: `${String(index).padStart(2, "0")}:00`, temperature: index === 3 ? -10 : index,
}));
for (const hours of [day, day.filter(hour => hour.clock !== "02:00"),
  [...day.slice(0, 3), { ...day[2], instant: 9000000 }, ...day.slice(3)]]) {
  const folded = weatherChartColumns(hours);
  assert.equal(folded.length, 16);
  assert.equal(folded.filter(hour => hour.folded).length, 1);
  assert.equal(folded[0].folded, true);
  assert.equal(folded[1].clock, "09:00");
  assert.equal(folded.at(-1).clock, "23:00");
  assert.equal(weatherChartColumns(hours, true), hours, "Expansion preserves all original timestamps and records");
  const collapsedGeometry = weatherChartGeometry(folded, folded.length * 64, hours);
  const fullGeometry = weatherChartGeometry(hours, hours.length * 64);
  assert.equal(collapsedGeometry.height, fullGeometry.height, "Expansion does not shift the detail below the chart");
  assert(Number.isFinite(collapsedGeometry.points[0].y), "The folded average has its own plotted point");
  const earlyTemperatures = hours.filter(hour => Number(hour.clock.slice(0, 2)) <= 8).map(hour => hour.temperature);
  assert.equal(folded[0].temperature, earlyTemperatures.reduce((sum, value) => sum + value, 0) / earlyTemperatures.length);
  assert.equal(folded[0].temperatureSamples, earlyTemperatures.length);
  assert.equal(folded[0].hourCount, earlyTemperatures.length);
  assert.equal(collapsedGeometry.points[0].y, weatherChartGeometry([
    { temperature: folded[0].temperature },
  ], 64, hours).points[0].y, "The mean uses the same temperature scale as individual hours");
  assert.equal(collapsedGeometry.paths.length, 1, "The folded mean and subsequent hours form one continuous trend");
  assert(collapsedGeometry.paths[0].startsWith("M32,"), "The curve starts at the folded average");
  for (const [index, hour] of folded.entries()) {
    if (hour.folded) continue;
    const originalIndex = hours.findIndex(item => item === hour);
    assert.equal(collapsedGeometry.points[index].y, fullGeometry.points[originalIndex].y, "Folding retains the full-day temperature scale");
  }
}
assert.deepEqual(weatherChartColumns([]), []);
assert.deepEqual(weatherChartColumns(day.slice(9)), day.slice(9));
assert.equal(weatherChartColumns([{ ...day[1], temperature: null }])[0].folded, true);
const averageOf = values => weatherChartColumns(values.map((temperature, index) => ({
  clock: `${String(index).padStart(2, "0")}:00`, temperature,
})))[0];
const partialAverage = averageOf([0, -6, null, 3, undefined, NaN, Infinity]);
assert.equal(partialAverage.temperature, -1, "Zero and negative temperatures count; invalid values do not");
assert.equal(partialAverage.temperatureSamples, 3);
assert.equal(partialAverage.hourCount, 7);
assert.equal(averageOf([null, undefined, NaN]).temperature, null);
assert.equal(averageOf([null, undefined, NaN]).temperatureSamples, 0);
assert.equal(averageOf([0, 0]).temperature, 0);
assert.equal(averageOf([1, 2, 2]).temperature, 5 / 3, "Round only when displaying the result");
const foldedPair = weatherChartGeometry([
  { folded: true, temperature: 8 }, { temperature: 10 },
], 128);
assert.equal(foldedPair.paths.length, 1);
assert(foldedPair.paths[0].startsWith("M32,") && foldedPair.paths[0].includes("L96,"),
  "The average connects to the next valid hourly point");
const missingAverage = weatherChartGeometry([
  { folded: true, temperature: null }, { temperature: 10 }, { temperature: 11 },
], 192);
assert.equal(missingAverage.points[0].y, null);
assert(missingAverage.paths[0].startsWith("M96,"), "An unavailable mean must still leave a gap");
const missingNextHour = weatherChartGeometry([
  { folded: true, temperature: 8 }, { temperature: null }, { temperature: 10 }, { temperature: 11 },
], 256);
assert.equal(missingNextHour.paths.length, 1);
assert(missingNextHour.paths[0].startsWith("M160,"), "Do not bridge missing hours after the folded mean");
console.log("Weather chart geometry: default 00-08 folding, hourly means, partial/missing/zero/negative data, 23/24/25-hour days and stable scale passed; no browser run.");
