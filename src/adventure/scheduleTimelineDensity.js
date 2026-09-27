export function summarizeScheduleIntervals(intervals) {
  const groups = new Map();
  const unchanged = [];
  for (const interval of intervals) {
    if (!interval.summaryGroup) {
      unchanged.push(interval);
      continue;
    }
    const key = interval.summaryGroup.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(interval);
  }
  const summaries = [];
  for (const rows of groups.values()) {
    let run = [];
    let end = -Infinity;
    const flush = () => {
      if (!run.length) return;
      const first = run[0];
      const summary = first.summaryGroup;
      summaries.push({ ...first, id: `${first.id}-summary`, end,
        label: summary.label, iconType: summary.iconType, color: summary.color ?? first.color,
        onSelect: summary.onSelect, title: summary.label, ariaLabel: summary.label,
        timeLabel: undefined, showTime: false, summary: undefined, meta: undefined,
        details: undefined, mapsUrl: undefined, content: undefined, renderContent: undefined,
        milestones: [], active: run.some(row => row.active), summaryCount: run.length });
    };
    for (const row of [...rows].sort((a, b) => a.start - b.start || a.end - b.end)) {
      // Keep real gaps visible, even when both sides belong to the same event.
      if (run.length && row.start > end) {
        flush();
        run = [];
        end = -Infinity;
      }
      run.push(row);
      end = Math.max(end, row.end);
    }
    flush();
  }
  return [...unchanged, ...summaries].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
}

export function scheduleNeedsSummary(intervals, pixelHeight) {
  return pixelHeight > 0 && pixelHeight < intervals.length * 44
    && intervals.some(interval => interval.summaryGroup);
}
