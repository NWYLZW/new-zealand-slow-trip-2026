import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getAgendaIconDefinition } from "./adventureAgendaIcons";
import { AdventureTimelineInk } from "./AdventureTimelineInk";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { PanelDivider } from "./pencil/PanelDivider";
import { pencilStroke } from "./pencil/stroke";
import { GoogleMapIcon } from "./SketchIcons";
import { useAdventurePreferences } from "./AdventurePreferences";
import { scheduleNeedsSummary, summarizeScheduleIntervals } from "./scheduleTimelineDensity";
import "./AdventureScheduleTimeline.css";

const HOUR = 60 * 60 * 1000;
const GAP_CONTROL_HEIGHT = 44;
const GAP_CONTROL_PADDING = 8;
const LIGHT_PAPER_BY_THEME = {
  lake: "#f4f0e3",
  fern: "#edf0df",
  sunset: "#f4e9d9",
};
const WAIT_ICON_DEFINITION = {
  kind: "wait",
  sourceSize: 24,
  paths: [
    { d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8" },
    { d: "M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
  ],
};

function mixHexColors(color, paper, pigmentWeight) {
  const source = /^#([0-9a-f]{6})$/i.exec(color?.trim() ?? "");
  const background = /^#([0-9a-f]{6})$/i.exec(paper?.trim() ?? "");
  if (!source || !background) return color;
  const channel = (value, offset) => Number.parseInt(value.slice(offset, offset + 2), 16);
  return `#${[0, 2, 4].map(offset => Math.round(
    channel(source[1], offset) * pigmentWeight
      + channel(background[1], offset) * (1 - pigmentWeight),
  ).toString(16).padStart(2, "0")).join("")}`;
}

function normalizedCollapsedRanges(start, end, collapsedRanges) {
  const ranges = (Array.isArray(collapsedRanges) ? collapsedRanges : [])
    .map((range, index) => ({ ...range, id: range.id ?? `collapsed-${index}`,
      start: Math.max(start, range.start), end: Math.min(end, range.end) }))
    .filter(range => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const result = [];
  for (const range of ranges) {
    if (result.length && range.start < result.at(-1).end) continue;
    result.push(range);
  }
  return result;
}

export function createScheduleTimelineScale(start, end, collapsedRanges = [],
  { pixelHeight = 0, points = [], expandedRanges = [] } = {}) {
  const ranges = normalizedCollapsedRanges(start, end, collapsedRanges);
  const controls = normalizedCollapsedRanges(start, end, [...ranges, ...expandedRanges]);
  const segments = [];
  let cursor = start;
  for (const range of controls) {
    if (range.start > cursor) segments.push({ start: cursor, end: range.start,
      displayDuration: range.start - cursor, collapsed: false });
    const collapsed = ranges.some(item => item.start === range.start && item.end === range.end);
    segments.push({ ...range, control: true, displayDuration: collapsed
      ? Math.min(HOUR, range.end - range.start) : range.end - range.start, collapsed });
    cursor = range.end;
  }
  if (cursor < end) segments.push({ start: cursor, end,
    displayDuration: end - cursor, collapsed: false });
  const displayDuration = segments.reduce((total, segment) => total + segment.displayDuration, 0);
  const gapInsets = range => ({
    before: points.some(point => point.time === range.start) ? GAP_CONTROL_HEIGHT : 0,
    after: points.some(point => point.time === range.end) ? GAP_CONTROL_HEIGHT : 0,
  });
  // Reserve visual room inside empty time only; real event durations stay proportional.
  const minimums = segments.filter(segment => segment.control).map(segment => {
    const insets = gapInsets(segment);
    return { segment, pixels: GAP_CONTROL_HEIGHT + GAP_CONTROL_PADDING + insets.before + insets.after };
  });
  const reserved = minimums.filter(item => item.segment.collapsed);
  if (pixelHeight > 0) {
    let added;
    do {
      const remainingPixels = pixelHeight - reserved.reduce((total, item) => total + item.pixels, 0);
      const remainingDuration = segments.filter(segment => !reserved.some(item => item.segment === segment))
        .reduce((total, segment) => total + segment.displayDuration, 0);
      added = minimums.filter(item => !reserved.includes(item)
        && item.segment.displayDuration / remainingDuration * remainingPixels < item.pixels);
      reserved.push(...added);
    } while (added.length);
  }
  const reservedPixels = reserved.reduce((total, item) => total + item.pixels, 0);
  const linearDuration = segments.filter(segment => !reserved.some(item => item.segment === segment))
    .reduce((total, segment) => total + segment.displayDuration, 0);
  if (pixelHeight > 0 && reservedPixels > 0 && linearDuration > 0) {
    const budget = Math.min(reservedPixels, pixelHeight * .7);
    for (const segment of segments) {
      const fixed = reserved.find(item => item.segment === segment);
      segment.displaySize = fixed ? fixed.pixels * budget / reservedPixels
        : segment.displayDuration / linearDuration * (pixelHeight - budget);
    }
  } else {
    segments.forEach(segment => { segment.displaySize = segment.displayDuration; });
  }
  const displaySize = segments.reduce((total, segment) => total + segment.displaySize, 0);
  const position = instant => {
    if (!(displaySize > 0)) return 0;
    const target = Math.max(start, Math.min(end, instant));
    let elapsed = 0;
    for (const segment of segments) {
      if (target >= segment.end) {
        elapsed += segment.displaySize;
        continue;
      }
      if (target > segment.start) elapsed += (target - segment.start) / (segment.end - segment.start)
        * segment.displaySize;
      break;
    }
    return elapsed / displaySize;
  };
  return { position, ranges, displayDuration, gapInsets };
}

export function formatScheduleTimeZoneOffset(instant, timeZone) {
  if (!Number.isFinite(instant) || !timeZone) return undefined;
  try {
    const value = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(new Date(instant)).find(part => part.type === "timeZoneName")?.value;
    if (!value) return undefined;
    if (value === "GMT") return "UTC";
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(value);
    if (!match) return value.replace(/^GMT/, "UTC");
    const minutes = match[3] && match[3] !== "00" ? `:${match[3]}` : "";
    return `UTC${match[1]}${Number(match[2])}${minutes}`;
  } catch {
    return undefined;
  }
}

export function scheduleTimelineTicks(start, end, pixelHeight = 0, minimumGap = 20, collapsedRanges = [], timeScale) {
  const scale = timeScale ?? createScheduleTimelineScale(start, end, collapsedRanges);
  const collapsed = scale.ranges;
  const candidates = [start];
  for (let instant = Math.ceil(start / HOUR) * HOUR; instant < end; instant += HOUR) {
    if (instant > start && !collapsed.some(range => instant > range.start && instant < range.end))
      candidates.push(instant);
  }
  collapsed.forEach(range => candidates.push(range.start, range.end));
  if (end > start) candidates.push(end);
  const uniqueCandidates = [...new Set(candidates)].sort((a, b) => a - b);
  if (!(pixelHeight > 0) || uniqueCandidates.length <= 2) return uniqueCandidates;
  const required = new Set([start, end, ...collapsed.flatMap(range => [range.start, range.end])]);
  const pixelsBetween = (a, b) => (scale.position(b) - scale.position(a)) * pixelHeight;
  const ticks = [uniqueCandidates[0]];
  for (const instant of uniqueCandidates.slice(1, -1)) {
    if (required.has(instant)) {
      while (ticks.length > 1 && !required.has(ticks.at(-1))
        && pixelsBetween(ticks.at(-1), instant) < minimumGap) ticks.pop();
    }
    if (pixelsBetween(ticks.at(-1), instant) >= minimumGap
      && pixelsBetween(instant, end) >= minimumGap) ticks.push(instant);
  }
  if (ticks.at(-1) !== end) ticks.push(end);
  return ticks;
}

function layoutIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const result = [];
  let group = [], groupEnd = -Infinity, laneEnds = [];
  const flush = () => {
    for (const item of group) result.push({ ...item, lanes: laneEnds.length });
    group = []; laneEnds = [];
  };
  for (const item of sorted) {
    if (item.start >= groupEnd) flush();
    let lane = laneEnds.findIndex(end => end <= item.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    group.push({ ...item, lane });
    groupEnd = Math.max(groupEnd, item.end);
  }
  flush();
  return result;
}

export function layoutSchedulePoints(points, pixelHeight, range, timePosition, { edge = 22, gap = 46 } = {}) {
  const duration = range.end - range.start;
  const position = timePosition ?? (instant => (instant - range.start) / duration);
  const sorted = [...points].map(item => ({ ...item,
    anchorTop: item.time >= range.end ? .99
      : Math.max(.01, Math.min(.99, position(item.time))),
  })).sort((a, b) => a.anchorTop - b.anchorTop || a.id.localeCompare(b.id));
  if (!pixelHeight || !sorted.length) return sorted.map(item => ({ ...item, displayTop: item.anchorTop }));
  const available = Math.max(0, pixelHeight - edge * 2);
  const rowGap = sorted.length > 1 ? Math.min(gap, available / (sorted.length - 1)) : 0;
  const positions = sorted.map(item => Math.max(edge, Math.min(pixelHeight - edge, item.anchorTop * pixelHeight)));
  for (let index = 1; index < positions.length; index++)
    positions[index] = Math.max(positions[index], positions[index - 1] + rowGap);
  if (positions.at(-1) > pixelHeight - edge) {
    positions[positions.length - 1] = pixelHeight - edge;
    for (let index = positions.length - 2; index >= 0; index--)
      positions[index] = Math.min(positions[index], positions[index + 1] - rowGap);
  }
  return sorted.map((item, index) => ({ ...item, displayTop: positions[index] / pixelHeight }));
}

export function attachScheduleMilestones(intervals, points) {
  const milestonesByInterval = new Map();
  const remainingPoints = [];
  for (const point of points) {
    const owner = intervals.filter(interval => point.groupId && interval.groupId === point.groupId
      && point.time > interval.start && point.time < interval.end)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start) || b.start - a.start)[0];
    if (!owner) {
      remainingPoints.push(point);
      continue;
    }
    const milestones = milestonesByInterval.get(owner.id) ?? [];
    milestones.push(point);
    milestonesByInterval.set(owner.id, milestones);
  }
  return { intervals: intervals.map(interval => ({ ...interval,
    milestones: [...(interval.milestones ?? []), ...(milestonesByInterval.get(interval.id) ?? [])] })),
  points: remainingPoints };
}

function ScheduleIcon({ type }) {
  const definition = type === "wait" ? WAIT_ICON_DEFINITION : getAgendaIconDefinition(type);
  return <PencilIcon kind={definition.kind} sourceSize={definition.sourceSize}>
    {definition.paths.map((path, index) => <path key={`${path.d}-${index}`} {...path} />)}
  </PencilIcon>;
}

function ScheduleGapToggle({ range, expanded, timeScale, onToggle, displayTop }) {
  const top = displayTop === undefined ? timeScale.position(range.start) * 100 : displayTop * 100;
  const height = (timeScale.position(range.end) - timeScale.position(range.start)) * 100;
  const insets = displayTop === undefined ? timeScale.gapInsets(range) : { before: 0, after: 0 };
  const action = expanded ? range.collapseLabel ?? "收起" : range.expandLabel ?? "展开";
  const label = (expanded ? range.collapseAriaLabel : range.expandAriaLabel)
    ?? `${range.label ?? "时段"}，${action}`;
  return <div className="trip-schedule-timeline-gap"
    style={{ top: `${top}%`, height: displayTop === undefined ? `${height}%` : 44,
      transform: displayTop === undefined ? undefined : "translateY(-50%)",
      paddingTop: insets.before, paddingBottom: insets.after }}>
    <span className="trip-schedule-timeline-gap-line"><PanelDivider /></span>
    <button type="button" className="trip-schedule-timeline-collapsed-range"
      aria-expanded={expanded} aria-label={label} title={label} onClick={onToggle}>
      <span className="trip-schedule-timeline-gap-label"><PencilText>{range.label}</PencilText>
        {range.endSuffix && <sup aria-hidden="true">{range.endSuffix}</sup>}
      </span>
      <PencilIcon kind={expanded ? "fold-time" : "unfold-time"} sourceSize={24}>
        {/* MUI UnfoldLess / UnfoldMore geometry, rendered with the shared pencil brush. */}
        <path d={expanded
          ? "M7.41 18.59 8.83 20 12 16.83 15.17 20l1.41-1.41L12 14zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10z"
          : "M12 5.83 15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15z"} />
      </PencilIcon>
    </button>
    <span className="trip-schedule-timeline-gap-line"><PanelDivider /></span>
  </div>;
}

function PointLeadersInk({ points }) {
  const canvasRef = useRef(null);
  const key = points.map(item => `${item.id}:${item.groupId ?? ""}:${item.anchorTop}:${item.displayTop}`).join("|");
  useLayoutEffect(() => {
    const canvas = canvasRef.current, parent = canvas.parentElement;
    const paint = () => {
      const width = parent.clientWidth, height = parent.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const ink = getComputedStyle(parent).getPropertyValue("--trip-ink-muted").trim() || "#627b67";
      points.forEach((item, index) => {
        const previous = points[index - 1];
        if (!previous || !item.groupId || previous.groupId !== item.groupId) return;
        pencilStroke(context, [[5, previous.displayTop * height], [5, item.displayTop * height]],
          ink, .7, 2903 + index * 31, .28, 2, false,
          { variation: .78, breaks: .18, grain: .64, gain: 1.7, step: .65 });
      });
      points.forEach((item, index) => {
        const anchorY = Math.max(1, Math.min(height - 1, item.anchorTop * height));
        const displayY = Math.max(1, Math.min(height - 1, item.displayTop * height));
        pencilStroke(context, [[1, anchorY], [5, anchorY], [5, displayY], [10, displayY]],
          ink, .75, 3109 + index * 41, .3, 2, false,
          { variation: .78, breaks: .16, grain: .64, gain: 1.8, step: .65 });
      });
    };
    const resize = new ResizeObserver(paint);
    const appearance = new MutationObserver(paint);
    resize.observe(parent);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    paint();
    return () => { resize.disconnect(); appearance.disconnect(); };
  }, [key]);
  return <canvas ref={canvasRef} className="trip-schedule-timeline-point-leaders" aria-hidden="true" />;
}

function detailsList(details) {
  if (!details) return [];
  return Array.isArray(details) ? details : [details];
}

function rowContent(row) {
  const content = row.content ?? row.renderContent;
  return typeof content === "function" ? content(row) : content;
}

function ScheduleMilestone({ row, formatTick }) {
  const { id, time, timeLabel, label, iconType, mapsUrl, active, title,
    ariaLabel, onSelect, showTime = true } = row;
  const content = rowContent(row);
  const clock = timeLabel ?? formatTick?.(time) ?? new Date(time).toISOString().slice(11, 16);
  const text = showTime ? `${clock} · ${label}` : label;
  return <div className="trip-schedule-timeline-milestone" data-active={Boolean(active)}>
    {content ? <div className="trip-schedule-timeline-milestone-main trip-schedule-timeline-row-content">
      {content}
    </div> : onSelect ? <button type="button" className="trip-schedule-timeline-milestone-main"
      onClick={onSelect} title={title} aria-label={ariaLabel ?? text}>
      {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
      <PencilText ellipsis>{text}</PencilText>
    </button> : <span className="trip-schedule-timeline-milestone-main" title={title} aria-label={ariaLabel}>
      {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
      <PencilText ellipsis>{text}</PencilText>
    </span>}
    {mapsUrl && <a className="trip-schedule-timeline-milestone-map-link" href={mapsUrl} target="_blank"
      rel="noopener noreferrer" aria-label={`${label} · Google Maps`} title="Google Maps"><GoogleMapIcon /></a>}
  </div>;
}

export function scheduleTimelineAutoHeight(duration, pointCount, intervalCount = 0) {
  const rangeHeight = duration / HOUR * 48 + 44;
  const contentHeight = Math.max(pointCount, intervalCount, 1) * 44 + 28;
  return Math.round(Math.max(92, Math.min(430, Math.max(rangeHeight, contentHeight))));
}

export function AdventureScheduleTimeline({
  range, points = [], intervals = [], formatTick, tickTitle, tickAriaLabel, endTick,
  tickColumns, collapsedRanges = [], ariaLabel, className = "", height = "auto", adaptiveDetail = false,
  readableLabels = false,
}) {
  const { theme, resolvedAppearance } = useAdventurePreferences();
  const timelineRef = useRef(null);
  const [pixelHeight, setPixelHeight] = useState(0);
  const collapsedRangeKey = collapsedRanges.map(range => `${range.id ?? ""}:${range.start}:${range.end}`).join("|");
  const [expandedRangeIds, setExpandedRangeIds] = useState([]);
  useEffect(() => setExpandedRangeIds([]), [collapsedRangeKey]);
  const duration = range?.end - range?.start;
  const activeCollapsedRanges = useMemo(() => collapsedRanges.filter((range, index) =>
    !expandedRangeIds.includes(range.id ?? `collapsed-${index}`)), [collapsedRanges, expandedRangeIds]);
  const expandedRanges = useMemo(() => collapsedRanges.filter((range, index) =>
    expandedRangeIds.includes(range.id ?? `collapsed-${index}`)), [collapsedRanges, expandedRangeIds]);
  const timeScale = useMemo(() => duration > 0
    ? createScheduleTimelineScale(range.start, range.end, activeCollapsedRanges, { pixelHeight, points, expandedRanges }) : null,
  [activeCollapsedRanges, duration, expandedRanges, pixelHeight, points, range?.end, range?.start]);
  const ticks = useMemo(() => duration > 0
    ? scheduleTimelineTicks(range.start, range.end, pixelHeight || 430, 20, activeCollapsedRanges, timeScale) : [],
  [activeCollapsedRanges, duration, pixelHeight, range?.end, range?.start, timeScale]);
  const pointRows = useMemo(() => duration > 0
    ? layoutSchedulePoints(points.filter(item => item.time >= range.start && item.time <= range.end),
      pixelHeight, range, timeScale.position) : [],
    [duration, pixelHeight, points, range, timeScale]);
  const visibleIntervals = useMemo(() => duration > 0
    ? intervals.filter(item => item.end > range.start && item.start < range.end) : [],
  [duration, intervals, range]);
  const condensed = !readableLabels && adaptiveDetail && scheduleNeedsSummary(visibleIntervals, pixelHeight);
  const intervalRows = useMemo(() => layoutIntervals(condensed
    ? summarizeScheduleIntervals(visibleIntervals) : visibleIntervals), [condensed, visibleIntervals]);
  const callouts = useMemo(() => !readableLabels || !timeScale ? [] : layoutSchedulePoints([
    ...intervalRows.map(row => ({ ...row, time: (Math.max(row.start, range.start)
      + Math.min(row.end, range.end)) / 2 })),
    ...points.filter(row => row.time >= range.start && row.time <= range.end),
    ...normalizedCollapsedRanges(range.start, range.end, collapsedRanges)
      .map(gap => ({ id: `gap:${gap.id}`, time: (gap.start + gap.end) / 2, gap })),
  ], pixelHeight, range, timeScale.position, { edge: 26, gap: 54 }),
  [collapsedRanges, intervalRows, pixelHeight, points, range, readableLabels, timeScale]);
  const timelineHeight = useMemo(() => {
    if (height === "fill") return undefined;
    if (typeof height === "number") return `${height}px`;
    if (height !== "auto") return height;
    return `${scheduleTimelineAutoHeight(timeScale.displayDuration, points.length, intervals.length)}px`;
  }, [height, intervals.length, points.length, timeScale]);
  const dualTickColumns = Array.isArray(tickColumns) && tickColumns.length === 2 ? tickColumns : null;
  const scheduleWash = color => resolvedAppearance === "dark" ? color
    : mixHexColors(color, LIGHT_PAPER_BY_THEME[theme] ?? LIGHT_PAPER_BY_THEME.lake, .5);

  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const resize = new ResizeObserver(() => setPixelHeight(timeline.clientHeight));
    resize.observe(timeline);
    setPixelHeight(timeline.clientHeight);
    return () => resize.disconnect();
  }, [range?.start, range?.end]);

  if (!(duration > 0)) return null;
  return <div className={`trip-schedule-timeline ${className}`.trim()} role="group" aria-label={ariaLabel}
    data-height={height === "fill" ? "fill" : "fixed"}
    data-detail={condensed ? "summary" : "full"}
    data-readable={readableLabels || undefined}
    data-tick-columns={dualTickColumns ? "dual" : "single"}
    style={{ height: timelineHeight, minHeight: readableLabels ? callouts.length * 54 + 24 : undefined }}>
    {dualTickColumns && <>
      <span className="trip-schedule-timeline-tick-heading is-left"
        title={dualTickColumns[0].headingTitle} aria-label={dualTickColumns[0].headingAriaLabel}>
        <PencilText>{dualTickColumns[0].label}</PencilText>
      </span>
      <span className="trip-schedule-timeline-tick-heading is-right"
        title={dualTickColumns[1].headingTitle} aria-label={dualTickColumns[1].headingAriaLabel}>
        <PencilText>{dualTickColumns[1].label}</PencilText>
      </span>
    </>}
    <div className="trip-schedule-timeline-scale" ref={timelineRef}>
      <AdventureTimelineInk positions={ticks.map(instant => timeScale.position(instant))}
        laneSelector=".trip-schedule-timeline-lanes" className="trip-schedule-timeline-grid" />
      {ticks.map((instant, index) => {
        const isEnd = index === ticks.length - 1;
        if (dualTickColumns) return <div key={instant} className="trip-schedule-timeline-dual-tick"
          style={{ top: `${timeScale.position(instant) * 100}%` }}>
          {dualTickColumns.map((column, columnIndex) => {
            const isPrimaryColumn = columnIndex === 0;
            const label = isEnd && isPrimaryColumn && endTick?.label !== undefined ? endTick.label
              : column.formatTick?.(instant, index, ticks.length)
                ?? new Date(instant).toISOString().slice(11, 16);
            const title = isEnd && isPrimaryColumn && endTick?.title !== undefined ? endTick.title
              : column.tickTitle?.(instant, index, ticks.length);
            const accessibleLabel = isEnd && isPrimaryColumn && endTick?.ariaLabel !== undefined ? endTick.ariaLabel
              : column.tickAriaLabel?.(instant, index, ticks.length);
            return <time key={column.id}
              className={`trip-schedule-timeline-tick ${columnIndex === 0 ? "is-left" : "is-right"}`}
              dateTime={new Date(instant).toISOString()} title={title} aria-label={accessibleLabel}>
              <PencilText>{label}</PencilText>
              {isEnd && isPrimaryColumn && endTick?.suffix && <sup aria-hidden="true">{endTick.suffix}</sup>}
            </time>;
          })}
        </div>;
        const label = isEnd && endTick?.label !== undefined ? endTick.label
          : formatTick?.(instant, index, ticks.length) ?? new Date(instant).toISOString().slice(11, 16);
        return <time key={instant} className="trip-schedule-timeline-tick"
          dateTime={new Date(instant).toISOString()}
          style={{ top: `${timeScale.position(instant) * 100}%` }}
          title={isEnd && endTick?.title !== undefined ? endTick.title : tickTitle?.(instant, index, ticks.length)}
          aria-label={isEnd && endTick?.ariaLabel !== undefined ? endTick.ariaLabel
            : tickAriaLabel?.(instant, index, ticks.length)}>
          <PencilText>{label}</PencilText>
          {isEnd && endTick?.suffix && <sup aria-hidden="true">{endTick.suffix}</sup>}
        </time>;
      })}
      {!readableLabels && normalizedCollapsedRanges(range.start, range.end, collapsedRanges).map(gap =>
        <ScheduleGapToggle key={gap.id} range={gap} timeScale={timeScale}
          expanded={expandedRangeIds.includes(gap.id)}
          onToggle={() => setExpandedRangeIds(ids => ids.includes(gap.id)
            ? ids.filter(id => id !== gap.id) : [...ids, gap.id])} />)}
      <div className="trip-schedule-timeline-lanes">
        <PointLeadersInk points={readableLabels ? callouts.filter(row => !row.gap) : pointRows} />
        {intervalRows.map((row) => {
          const { id, start, end, timeLabel, label, summary, meta, details, iconType, mapsUrl, active, color,
            title, ariaLabel: rowAriaLabel, onSelect, lane, lanes, milestones = [], showTime = true } = row;
          const content = rowContent(row);
          const visibleStart = Math.max(start, range.start);
          const visibleEnd = Math.min(end, range.end);
          const top = timeScale.position(visibleStart) * 100;
          const height = (timeScale.position(visibleEnd) - timeScale.position(visibleStart)) * 100;
          const rowPixels = pixelHeight * height / 100;
          const compact = rowPixels < 48;
          const minimal = readableLabels || adaptiveDetail && pixelHeight > 0 && rowPixels < 24;
          const showMap = !readableLabels && mapsUrl && (!adaptiveDetail || !condensed && rowPixels >= 44);
          const clock = instant => formatTick?.(instant) ?? new Date(instant).toISOString().slice(11, 16);
          const rowTitle = row.summaryCount ? `${clock(visibleStart)} — ${clock(visibleEnd)} · ${label}` : title;
          return <div key={id} className="trip-schedule-timeline-slot"
            data-summary-count={row.summaryCount} data-minimal={minimal || undefined}
            style={{ top: `${top}%`, height: `${height}%`,
              left: readableLabels ? lane / lanes * 16 : `${lane / lanes * 100}%`,
              width: readableLabels ? 16 / lanes : `${100 / lanes}%` }}>
            <PencilSurface variant="badge"
              className={`trip-schedule-timeline-interval${compact ? " is-compact" : ""}${adaptiveDetail ? " is-adaptive" : ""}${minimal ? " is-minimal" : ""}`}
              data-active={Boolean(active)} style={{ "--trip-surface-badge-wash": scheduleWash(color) }}>
              {content && !minimal ? <div className="trip-schedule-timeline-interval-main trip-schedule-timeline-row-content">
                {content}
              </div> : <>
                {!readableLabels && onSelect && <button type="button" className="trip-schedule-timeline-interval-hit"
                  title={rowTitle} aria-label={row.summaryCount ? rowTitle : rowAriaLabel ?? (timeLabel ? `${timeLabel} · ${label}` : label)}
                  onClick={onSelect} />}
                {!minimal && <div className="trip-schedule-timeline-interval-copy"
                  title={onSelect ? undefined : rowTitle} aria-label={onSelect ? undefined : rowAriaLabel}>
                  <div className="trip-schedule-timeline-interval-main">
                    {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
                    <strong><PencilText ellipsis>{showTime && timeLabel ? `${timeLabel} · ${label}` : label}</PencilText></strong>
                  </div>
                  {!compact && summary && <span><PencilText ellipsis>{summary}</PencilText></span>}
                  {!compact && meta && <span><PencilText>{meta}</PencilText></span>}
                  {!compact && detailsList(details).map((detail, index) =>
                    <span key={`${id}-detail-${index}`}><PencilText ellipsis>{detail}</PencilText></span>)}
                </div>}
              </>}
              {!minimal && (!adaptiveDetail || !condensed && !compact) && milestones.length > 0 && <div className="trip-schedule-timeline-milestones">
                {milestones.map(milestone => <ScheduleMilestone key={milestone.id}
                  row={milestone} formatTick={formatTick} />)}
              </div>}
              {showMap && <a className="trip-schedule-timeline-map-link" href={mapsUrl} target="_blank"
                rel="noopener noreferrer" aria-label={`${label} · Google Maps`} title="Google Maps"><GoogleMapIcon /></a>}
            </PencilSurface>
          </div>;
        })}
        {readableLabels && callouts.map(row => row.gap
          ? <ScheduleGapToggle key={row.id} range={row.gap} timeScale={timeScale} displayTop={row.displayTop}
            expanded={expandedRangeIds.includes(row.gap.id)}
            onToggle={() => setExpandedRangeIds(ids => ids.includes(row.gap.id)
              ? ids.filter(id => id !== row.gap.id) : [...ids, row.gap.id])} />
          : <button key={row.id} type="button" className="trip-schedule-callout"
            style={{ top: `${row.displayTop * 100}%` }} data-active={Boolean(row.active)}
            title={row.title} aria-label={row.ariaLabel ?? row.title}
            onClick={row.onSelect}>
            {row.iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={row.iconType} /></span>}
            <span className="trip-schedule-callout-copy">
              <strong><PencilText ellipsis>{row.label}</PencilText></strong>
              <span className="trip-schedule-callout-time">
                <PencilText>{row.timeLabel ?? formatTick?.(row.time)}</PencilText>
                {row.durationLabel && <PencilText>{row.durationLabel}</PencilText>}
              </span>
            </span>
          </button>)}
        {!readableLabels && pointRows.map((row) => {
          const { id, time, timeLabel, label, iconType, mapsUrl, active, color, title,
            ariaLabel: rowAriaLabel, onSelect, displayTop, showTime = true } = row;
          const content = rowContent(row);
          const clock = timeLabel ?? formatTick?.(time) ?? new Date(time).toISOString().slice(11, 16);
          const text = showTime ? `${clock} · ${label}` : label;
          return <div key={id} className="trip-schedule-timeline-point"
          data-active={Boolean(active)} style={{ top: `${displayTop * 100}%` }}>
          <PencilSurface variant="badge" className="trip-schedule-timeline-point-surface"
            style={{ "--trip-surface-badge-wash": scheduleWash(color) }}>
            {content ? <div className="trip-schedule-timeline-point-main trip-schedule-timeline-row-content">
              {content}
            </div> : onSelect ? <button type="button" className="trip-schedule-timeline-point-main" onClick={onSelect}
              title={title} aria-label={rowAriaLabel}>
              {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
              <PencilText ellipsis>{text}</PencilText>
            </button> : <span className="trip-schedule-timeline-point-main" title={title} aria-label={rowAriaLabel}>
              {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
              <PencilText ellipsis>{text}</PencilText>
            </span>}
            {mapsUrl && <a className="trip-schedule-timeline-map-link" href={mapsUrl} target="_blank"
              rel="noopener noreferrer" aria-label={`${label} · Google Maps`} title="Google Maps"><GoogleMapIcon /></a>}
          </PencilSurface>
        </div>;
        })}
      </div>
    </div>
  </div>;
}
