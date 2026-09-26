import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getAgendaIconDefinition } from "./adventureAgendaIcons";
import { AdventureTimelineInk } from "./AdventureTimelineInk";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { pencilStroke } from "./pencil/stroke";
import { GoogleMapIcon } from "./SketchIcons";
import "./AdventureScheduleTimeline.css";

const HOUR = 60 * 60 * 1000;
const WAIT_ICON_DEFINITION = {
  kind: "wait",
  sourceSize: 24,
  paths: [
    { d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8" },
    { d: "M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
  ],
};

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

export function createScheduleTimelineScale(start, end, collapsedRanges = []) {
  const ranges = normalizedCollapsedRanges(start, end, collapsedRanges);
  const segments = [];
  let cursor = start;
  for (const range of ranges) {
    if (range.start > cursor) segments.push({ start: cursor, end: range.start,
      displayDuration: range.start - cursor, collapsed: false });
    segments.push({ ...range, displayDuration: Math.min(HOUR, range.end - range.start), collapsed: true });
    cursor = range.end;
  }
  if (cursor < end) segments.push({ start: cursor, end,
    displayDuration: end - cursor, collapsed: false });
  const displayDuration = segments.reduce((total, segment) => total + segment.displayDuration, 0);
  const position = instant => {
    if (!(displayDuration > 0)) return 0;
    const target = Math.max(start, Math.min(end, instant));
    let elapsed = 0;
    for (const segment of segments) {
      if (target >= segment.end) {
        elapsed += segment.displayDuration;
        continue;
      }
      if (target > segment.start) elapsed += (target - segment.start) / (segment.end - segment.start)
        * segment.displayDuration;
      break;
    }
    return elapsed / displayDuration;
  };
  return { position, ranges, displayDuration };
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

export function scheduleTimelineTicks(start, end, pixelHeight = 0, minimumGap = 20, collapsedRanges = []) {
  const scale = createScheduleTimelineScale(start, end, collapsedRanges);
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
      ticks.push(instant);
      continue;
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

export function layoutSchedulePoints(points, pixelHeight, range, timePosition) {
  const duration = range.end - range.start;
  const position = timePosition ?? (instant => (instant - range.start) / duration);
  const edge = 22, gap = 46;
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
  tickColumns, collapsedRanges = [], ariaLabel, className = "", height = "auto",
}) {
  const timelineRef = useRef(null);
  const [pixelHeight, setPixelHeight] = useState(0);
  const collapsedRangeKey = collapsedRanges.map(range => `${range.id ?? ""}:${range.start}:${range.end}`).join("|");
  const [expandedRangeIds, setExpandedRangeIds] = useState([]);
  useEffect(() => setExpandedRangeIds([]), [collapsedRangeKey]);
  const duration = range?.end - range?.start;
  const activeCollapsedRanges = useMemo(() => collapsedRanges.filter((range, index) =>
    !expandedRangeIds.includes(range.id ?? `collapsed-${index}`)), [collapsedRanges, expandedRangeIds]);
  const timeScale = useMemo(() => duration > 0
    ? createScheduleTimelineScale(range.start, range.end, activeCollapsedRanges) : null,
  [activeCollapsedRanges, duration, range?.end, range?.start]);
  const ticks = useMemo(() => duration > 0
    ? scheduleTimelineTicks(range.start, range.end, pixelHeight || 430, 20, activeCollapsedRanges) : [],
  [activeCollapsedRanges, duration, pixelHeight, range?.end, range?.start]);
  const pointRows = useMemo(() => duration > 0
    ? layoutSchedulePoints(points.filter(item => item.time >= range.start && item.time <= range.end),
      pixelHeight, range, timeScale.position) : [],
    [duration, pixelHeight, points, range, timeScale]);
  const intervalRows = useMemo(() => duration > 0
    ? layoutIntervals(intervals.filter(item => item.end > range.start && item.start < range.end)) : [],
  [duration, intervals, range]);
  const timelineHeight = useMemo(() => {
    if (height === "fill") return undefined;
    if (typeof height === "number") return `${height}px`;
    if (height !== "auto") return height;
    return `${scheduleTimelineAutoHeight(timeScale.displayDuration, points.length, intervals.length)}px`;
  }, [height, intervals.length, points.length, timeScale]);
  const dualTickColumns = Array.isArray(tickColumns) && tickColumns.length === 2 ? tickColumns : null;

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
    data-tick-columns={dualTickColumns ? "dual" : "single"}
    style={timelineHeight ? { height: timelineHeight } : undefined}>
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
      {timeScale.ranges.map(range => {
        const configuredIndex = collapsedRanges.findIndex((item, index) =>
          (item.id ?? `collapsed-${index}`) === range.id);
        const configured = configuredIndex >= 0 ? collapsedRanges[configuredIndex] : range;
        const top = timeScale.position(range.start) * 100;
        const cellHeight = (timeScale.position(range.end) - timeScale.position(range.start)) * 100;
        return <button key={range.id} type="button" className="trip-schedule-timeline-collapsed-range"
          style={{ top: `${top}%`, height: `${cellHeight}%` }} aria-expanded="false"
          aria-label={configured.expandAriaLabel ?? `${configured.label ?? "折叠时段"}，展开`}
          title={configured.expandTitle ?? configured.label}
          onClick={() => setExpandedRangeIds(ids => [...ids, range.id])}>
          <PencilText>{configured.label}</PencilText>
          {configured.endSuffix && <sup aria-hidden="true">{configured.endSuffix}</sup>}
          <span><PencilText>{configured.expandLabel ?? "展开"}</PencilText></span>
        </button>;
      })}
      {collapsedRanges.map((range, index) => ({ ...range, id: range.id ?? `collapsed-${index}` }))
        .filter(range => expandedRangeIds.includes(range.id)).map((range) => {
          const top = timeScale.position(range.start) * 100;
          const cellHeight = (timeScale.position(range.end) - timeScale.position(range.start)) * 100;
          return <button key={range.id} type="button"
            className="trip-schedule-timeline-collapsed-range is-expanded"
            style={{ top: `${top}%`, height: `${cellHeight}%` }} aria-expanded="true"
            aria-label={range.collapseAriaLabel ?? `${range.label ?? "展开时段"}，收起`}
            title={range.collapseTitle ?? range.label}
            onClick={() => setExpandedRangeIds(ids => ids.filter(id => id !== range.id))}>
            <PencilText>{range.label}</PencilText>
            {range.endSuffix && <sup aria-hidden="true">{range.endSuffix}</sup>}
            <span><PencilText>{range.collapseLabel ?? "收起"}</PencilText></span>
          </button>;
        })}
      <div className="trip-schedule-timeline-lanes">
        <PointLeadersInk points={pointRows} />
        {intervalRows.map((row) => {
          const { id, start, end, timeLabel, label, summary, meta, details, iconType, mapsUrl, active, color,
            title, ariaLabel: rowAriaLabel, onSelect, lane, lanes, milestones = [], showTime = true } = row;
          const content = rowContent(row);
          const visibleStart = Math.max(start, range.start);
          const visibleEnd = Math.min(end, range.end);
          const top = timeScale.position(visibleStart) * 100;
          const height = (timeScale.position(visibleEnd) - timeScale.position(visibleStart)) * 100;
          const compact = pixelHeight * height / 100 < 48;
          return <div key={id} className="trip-schedule-timeline-slot"
            style={{ top: `${top}%`, height: `${height}%`, left: `${lane / lanes * 100}%`, width: `${100 / lanes}%` }}>
            <PencilSurface variant="badge"
              className={`trip-schedule-timeline-interval${compact ? " is-compact" : ""}`}
              data-active={Boolean(active)} style={{ "--trip-surface-badge-wash": color }}>
              {content ? <div className="trip-schedule-timeline-interval-main trip-schedule-timeline-row-content">
                {content}
              </div> : <>
                {onSelect && <button type="button" className="trip-schedule-timeline-interval-hit"
                  title={title} aria-label={rowAriaLabel ?? (timeLabel ? `${timeLabel} · ${label}` : label)}
                  onClick={onSelect} />}
                <div className="trip-schedule-timeline-interval-copy"
                  title={onSelect ? undefined : title} aria-label={onSelect ? undefined : rowAriaLabel}>
                  <div className="trip-schedule-timeline-interval-main">
                    {iconType && <span className="trip-schedule-timeline-point-icon"><ScheduleIcon type={iconType} /></span>}
                    <strong><PencilText ellipsis>{showTime && timeLabel ? `${timeLabel} · ${label}` : label}</PencilText></strong>
                  </div>
                  {!compact && summary && <span><PencilText ellipsis>{summary}</PencilText></span>}
                  {!compact && meta && <span><PencilText>{meta}</PencilText></span>}
                  {!compact && detailsList(details).map((detail, index) =>
                    <span key={`${id}-detail-${index}`}><PencilText ellipsis>{detail}</PencilText></span>)}
                </div>
              </>}
              {milestones.length > 0 && <div className="trip-schedule-timeline-milestones">
                {milestones.map(milestone => <ScheduleMilestone key={milestone.id}
                  row={milestone} formatTick={formatTick} />)}
              </div>}
              {mapsUrl && <a className="trip-schedule-timeline-map-link" href={mapsUrl} target="_blank"
                rel="noopener noreferrer" aria-label={`${label} · Google Maps`} title="Google Maps"><GoogleMapIcon /></a>}
            </PencilSurface>
          </div>;
        })}
        {pointRows.map((row) => {
          const { id, time, timeLabel, label, iconType, mapsUrl, active, color, title,
            ariaLabel: rowAriaLabel, onSelect, displayTop, showTime = true } = row;
          const content = rowContent(row);
          const clock = timeLabel ?? formatTick?.(time) ?? new Date(time).toISOString().slice(11, 16);
          const text = showTime ? `${clock} · ${label}` : label;
          return <div key={id} className="trip-schedule-timeline-point"
          data-active={Boolean(active)} style={{ top: `${displayTop * 100}%` }}>
          <PencilSurface variant="badge" className="trip-schedule-timeline-point-surface"
            style={{ "--trip-surface-badge-wash": color }}>
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
