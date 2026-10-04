import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ configFile: false, logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }, appType: "custom" });

try {
  const { createScheduleTimelineScale, layoutSchedulePoints, scheduleTimelineTicks } =
    await server.ssrLoadModule("/src/adventure/AdventureScheduleTimeline.jsx");
  const { adventureDayRowsForDate, adventureDayCollapsedRanges } =
    await server.ssrLoadModule("/src/adventure/AdventureDayDetails.jsx");
  const hour = 3600000;
  const start = Date.parse("2026-10-05T00:00:00+13:00");
  const end = start + 24 * hour;
  const rows = adventureDayRowsForDate("2026-10-05");
  const gaps = adventureDayCollapsedRanges(rows, start, end);
  const points = rows.filter(row => Number.isFinite(row.point))
    .map(row => ({ id: row.key, time: row.point }));
  assert.equal(gaps[0].label, "00:20—08:45");

  for (const pixelHeight of [240, 430, 700]) {
    for (const expanded of [false, true]) {
      const scale = createScheduleTimelineScale(start, end, expanded ? [] : gaps,
        { pixelHeight, points, expandedRanges: expanded ? gaps : [] });
      const placed = layoutSchedulePoints(points, pixelHeight, { start, end }, scale.position);
      const gap = gaps[0];
      const gapTop = scale.position(gap.start) * pixelHeight;
      const gapBottom = scale.position(gap.end) * pixelHeight;
      const { before, after } = scale.gapInsets(gap);
      const center = (gapTop + before + gapBottom - after) / 2;
      assert(center - 22 >= placed[0].displayTop * pixelHeight + 22,
        "The gap control must not cover the proposal point's hit area");
      assert(center + 22 <= gapBottom, "The gap control stays before the next activity");
      assert.equal(scale.position(start), 0);
      assert.equal(scale.position(end), 1);
      const ticks = scheduleTimelineTicks(start, end, pixelHeight, 20, expanded ? [] : gaps, scale);
      ticks.slice(1).forEach((tick, index) => {
        assert((scale.position(tick) - scale.position(ticks[index])) * pixelHeight >= 20 - 1e-8,
          "Displayed clock labels must keep a readable distance");
      });
      const firstHour = scale.position(start + 10 * hour) - scale.position(start + 9 * hour);
      const laterHour = scale.position(start + 12 * hour) - scale.position(start + 11 * hour);
      assert(Math.abs(firstHour - laterHour) < 1e-8, "Real event time keeps one proportional scale");
    }
  }

  const synthetic = [{ start: start + 3 * hour, end: start + 7 * hour },
    { start: start + 12 * hour, end: start + 15 * hour }];
  const boundaryPoints = synthetic.flatMap((gap, index) => [
    { id: `before-${index}`, time: gap.start }, { id: `after-${index}`, time: gap.end },
  ]);
  const scale = createScheduleTimelineScale(start, end, synthetic, { pixelHeight: 700, points: boundaryPoints });
  for (const gap of synthetic) {
    assert.deepEqual(scale.gapInsets(gap), { before: 44, after: 44 });
    assert(Math.abs((scale.position(gap.end) - scale.position(gap.start)) * 700 - 140) < 1e-8);
  }
  assert.equal(createScheduleTimelineScale(start, end).position(start + 12 * hour), .5);
  const callouts = [
    ...rows.filter(row => row.interval).map(row => ({ id: row.key,
      time: (Math.max(start, row.interval.start) + Math.min(end, row.interval.end)) / 2 })),
    ...points,
    ...gaps.map(gap => ({ id: `gap:${gap.id}`, time: (gap.start + gap.end) / 2 })),
  ];
  for (const viewportHeight of [240, 430, 700, 1200]) {
    const canvasHeight = Math.max(viewportHeight, callouts.length * 54 + 24);
    const axis = createScheduleTimelineScale(start, end, gaps, { pixelHeight: canvasHeight, points });
    const labels = layoutSchedulePoints(callouts, canvasHeight, { start, end }, axis.position, { edge: 26, gap: 54 });
    assert.equal(labels.length, callouts.length, "Do not hide short stops");
    labels.forEach((label, index) => {
      const center = label.displayTop * canvasHeight;
      assert(center >= 26 && center <= canvasHeight - 26);
      if (index) assert(center - labels[index - 1].displayTop * canvasHeight >= 54 - 1e-8,
        "Interval, milestone and gap hit targets must not overlap");
    });
  }
  console.log("Schedule gap layout: collapsed/expanded, short/tall layouts, point clearance, clock spacing and proportional event times passed.");
} finally {
  await server.close();
}
