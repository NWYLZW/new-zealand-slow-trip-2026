const HOUR = 3600000;
const ROW_HEIGHT = 56;

// Short events get readable space; the clock axis uses the exact same mapping.
export function createScheduleCardScale(start, end, intervals, points, collapsedRanges, expandedRanges = []) {
  const controls = [...collapsedRanges, ...expandedRanges];
  const pointTimes = new Set(points.filter(row => row.time >= start && row.time <= end).map(row => row.time));
  const boundaries = [...new Set([start, end, ...pointTimes,
    ...intervals.flatMap(row => [Math.max(start, row.start), Math.min(end, row.end)]),
    ...controls.flatMap(row => [Math.max(start, row.start), Math.min(end, row.end)])])]
    .filter(time => time >= start && time <= end).sort((a, b) => a - b);
  const before = new Map(), after = new Map(), segments = [];
  let height = 0;
  for (let index = 0; index < boundaries.length; index++) {
    const time = boundaries[index];
    before.set(time, height);
    if (pointTimes.has(time)) height += ROW_HEIGHT;
    after.set(time, height);
    const next = boundaries[index + 1];
    if (next === undefined) continue;
    const collapsed = collapsedRanges.some(gap => gap.start <= time && gap.end >= next);
    const occupied = intervals.some(row => row.start < next && row.end > time)
      || controls.some(gap => gap.start <= time && gap.end >= next);
    const size = collapsed ? ROW_HEIGHT : Math.max(occupied ? ROW_HEIGHT : 16, (next - time) / HOUR * 48);
    segments.push({ start: time, end: next, top: height, size });
    height += size;
  }
  const position = (instant, edge = "before") => {
    const time = Math.max(start, Math.min(end, instant));
    const exact = (edge === "after" ? after : before).get(time);
    if (exact !== undefined) return exact / height;
    const segment = segments.find(row => time >= row.start && time <= row.end);
    return segment ? (segment.top + (time - segment.start) / (segment.end - segment.start) * segment.size) / height : 0;
  };
  return { position, ranges: collapsedRanges, boundaries, minHeight: height,
    displayDuration: end - start, pointHeight: ROW_HEIGHT / height,
    gapInsets: () => ({ before: 0, after: 0 }) };
}
