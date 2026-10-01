import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NextIcon, PreviousIcon } from "../SketchIcons";
import { PencilText } from "../pencil/PencilText";
import { PanelDivider } from "../pencil/PanelDivider";
import { pencilStroke } from "../pencil/stroke";
import { observeCanvasRecovery } from "../pencil/canvasRecovery";
import { WeatherIcon } from "./WeatherIcon";
import { weatherCondition, weatherText, weatherValue } from "./weatherLabels.js";
import { WEATHER_CHART_HEIGHT, WEATHER_CHART_TOP, WEATHER_HOUR_WIDTH, isEarlyWeatherHour, weatherChartColumns, weatherChartGeometry, weatherChartLocationBands } from "./weatherChart.js";
import "./WeatherHourlyChart.css";

function TemperatureCurve({ hours, scaleHours, height }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    let lastKey = null;
    const paint = (force = false) => {
      const width = canvas.parentElement.clientWidth;
      if (!width) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const style = getComputedStyle(canvas);
      const ink = style.color;
      const muted = style.getPropertyValue("--trip-ink-muted").trim() || ink;
      const key = `${width}|${height}|${ratio}|${ink}|${muted}`;
      if (!force && key === lastKey) return;
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      if (!context || context.isContextLost?.()) return;
      context.scale(ratio, ratio);
      const geometry = weatherChartGeometry(hours, width, scaleHours);
      context.globalAlpha = .2;
      for (const y of geometry.guides) pencilStroke(context, [[0, y], [width, y]], muted,
        .7, Math.round(y * 37), .25, 1, false, { breaks: .3, grain: .7 });
      for (const band of weatherChartLocationBands(hours).slice(1)) {
        const x = width * band.start / hours.length;
        pencilStroke(context, [[x, 0], [x, height]], muted, .9, 4701 + band.start, .3, 2, false,
          { breaks: .3, grain: .7 });
      }
      context.globalAlpha = 1;
      for (const [index, data] of geometry.paths.entries()) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", data);
        const length = path.getTotalLength(), count = Math.max(1, Math.ceil(length / 2));
        const points = Array.from({ length: count + 1 }, (_, step) => {
          const point = path.getPointAtLength(length * step / count);
          return [point.x, point.y];
        });
        pencilStroke(context, points, ink, 1.8, 2701 + index, .35, 3, false,
          { variation: .65, breaks: .1, grain: .55, gain: 2 });
      }
      for (const [index, point] of geometry.points.entries()) {
        if (point.y === null) continue;
        const ring = Array.from({ length: 17 }, (_, step) => {
          const angle = step * Math.PI / 8;
          return [point.x + Math.cos(angle) * 2.7, point.y + Math.sin(angle) * 2.7];
        });
        pencilStroke(context, ring, ink, 1, 3701 + index, .2, 2, true, { breaks: 0, grain: .55, gain: 2 });
      }
      lastKey = key;
    };
    const resize = new ResizeObserver(() => paint());
    resize.observe(canvas.parentElement);
    const appearance = new MutationObserver(() => paint());
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    const stopRecovery = observeCanvasRecovery(() => paint(true));
    paint();
    return () => { resize.disconnect(); appearance.disconnect(); stopRecovery(); };
  }, [hours, scaleHours, height]);
  return <canvas ref={ref} className="trip-weather-curve" aria-hidden="true" />;
}

export function WeatherHourlyChart({ hours, timeZone, language, position, location }) {
  const chartId = useId();
  const scrollRef = useRef(null);
  const buttons = useRef([]);
  const pendingToggle = useRef(false);
  const [earlyExpanded, setEarlyExpanded] = useState(() => position.current.earlyExpanded ?? false);
  const columns = useMemo(() => weatherChartColumns(hours, earlyExpanded), [hours, earlyExpanded]);
  const bands = useMemo(() => weatherChartLocationBands(columns), [columns]);
  const showCollapse = earlyExpanded && hours.some(isEarlyWeatherHour);
  const columnCount = Math.max(1, columns.length + Number(showCollapse));
  const [selectedInstant, setSelectedInstant] = useState(() => position.current.instant ?? hours[0]?.instant);
  const selectedIndex = columns.findIndex(hour => !hour.folded && hour.instant === selectedInstant);
  const selected = columns[selectedIndex] ?? columns.find(hour => !hour.folded);
  const placeName = place => language === "en" ? place?.nameEn : place?.name;
  const selectedPlace = placeName(selected?.location ?? location);
  const geometry = useMemo(() => weatherChartGeometry(columns, columns.length * WEATHER_HOUR_WIDTH, hours), [columns, hours]);
  const formatter = useMemo(() => new Intl.DateTimeFormat(language === "en" ? "en-NZ" : "zh-CN", {
    timeZone, dateStyle: "medium", timeStyle: "long",
  }), [timeZone, language]);
  useLayoutEffect(() => { scrollRef.current.scrollLeft = position.current.left ?? 0; }, [position]);
  useLayoutEffect(() => {
    if (!pendingToggle.current) return;
    pendingToggle.current = false;
    const index = columns.findIndex(hour => earlyExpanded ? isEarlyWeatherHour(hour) : hour.folded);
    buttons.current[index]?.focus({ preventScroll: true });
    buttons.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [columns, earlyExpanded]);
  const toggleEarlyHours = () => {
    if (earlyExpanded && selected && isEarlyWeatherHour(selected)) {
      const next = hours.find(hour => Number(hour.clock.slice(0, 2)) > 8) ?? hours.find(hour => !isEarlyWeatherHour(hour));
      position.current.instant = next?.instant ?? null;
      setSelectedInstant(next?.instant);
    }
    pendingToggle.current = true;
    position.current.earlyExpanded = !earlyExpanded;
    setEarlyExpanded(!earlyExpanded);
  };
  const select = index => {
    const hour = columns[index];
    if (!hour || hour.folded) return;
    position.current.instant = hour.instant;
    setSelectedInstant(hour.instant);
  };
  const move = (event, index) => {
    const next = event.key === "ArrowRight" ? Math.min(columns.length - 1, index + 1)
      : event.key === "ArrowLeft" ? Math.max(0, index - 1)
        : event.key === "Home" ? 0 : event.key === "End" ? columns.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  return <div className="trip-weather-hourly">
    <div className="trip-weather-chart-scroll" ref={scrollRef} role="group" aria-label={weatherText("hourly", language)}
      onScroll={event => { position.current.left = event.currentTarget.scrollLeft; }}>
      <div id={chartId} className="trip-weather-chart-content" style={{ minWidth: columnCount * WEATHER_HOUR_WIDTH,
        "--weather-chart-top": `${WEATHER_CHART_TOP}px`, "--weather-chart-height": `${geometry.height}px`,
        "--weather-chart-inset": showCollapse ? `${100 / columnCount}%` : "0px",
        "--weather-hour-count": columnCount }}>
        {bands.length > 0 && <div className="trip-weather-location-bands">
          {bands.map(band => <div key={`${band.location.id}-${band.start}`} className="trip-weather-location-band"
            data-weather-location={band.location.id}
            style={{ gridColumn: `${band.start === 0 ? 1 : band.start + 1 + Number(showCollapse)} / ${band.end + 1 + Number(showCollapse)}` }}>
            <div className="trip-weather-location-heading">
              <span className="trip-weather-location-label"><PencilText>{placeName(band.location)}</PencilText></span>
              <small><PencilText>{band.period}</PencilText></small>
            </div>
            <div className="trip-weather-location-divider"><PanelDivider /></div>
          </div>)}
        </div>}
        <div className="trip-weather-chart-track">
        <div className="trip-weather-curve-wrap"><TemperatureCurve hours={columns} scaleHours={hours} height={geometry.height} /></div>
        {showCollapse && <button type="button" className="trip-weather-early-collapse"
          aria-expanded="true" aria-controls={chartId} aria-label={weatherText("collapseEarly", language)}
          title={weatherText("collapseEarly", language)} onClick={toggleEarlyHours}>
          <span className="trip-weather-hour-time"><PencilText>00–08</PencilText></span>
          <span className="trip-weather-hour-icon"><PreviousIcon /></span>
        </button>}
        {columns.map((hour, index) => {
          if (hour.folded) {
            const summaryLabel = [placeName(hour.location ?? location), weatherText("expandEarly", language),
              `${weatherText("averageTemperature", language)} ${weatherValue(hour.temperature, 1)} °C`,
              `${weatherText("validHours", language)} ${hour.temperatureSamples}/${hour.hourCount}`].filter(Boolean).join(" · ");
            return <button key="early-hours" type="button" className="trip-weather-folded-hours"
            ref={node => { buttons.current[index] = node; }} aria-expanded="false" aria-controls={chartId}
            aria-label={summaryLabel} title={summaryLabel}
            onClick={toggleEarlyHours} onKeyDown={event => move(event, index)}>
            <span className="trip-weather-hour-time"><PencilText>00–08</PencilText></span>
            <span className="trip-weather-hour-icon"><NextIcon /></span>
            <span className="trip-weather-hour-temperature trip-weather-average-temperature"
              style={{ top: WEATHER_CHART_TOP + (geometry.points[index].y ?? WEATHER_CHART_HEIGHT / 2) - 30 }}>
              <small><PencilText>{weatherText("averageShort", language)}</PencilText></small>
              <PencilText>{hour.temperature === null ? "--" : `${weatherValue(hour.temperature, 1)}°`}</PencilText>
            </span>
          </button>;
          }
          const condition = weatherCondition(hour.code, language);
          const timeLabel = formatter.format(new Date(hour.instant));
          return <button className="trip-weather-hour" key={hour.instant} type="button"
            ref={node => { buttons.current[index] = node; }} data-weather-instant={hour.instant}
            data-weather-location={(hour.location ?? location)?.id}
            tabIndex={hour === selected ? 0 : -1} aria-pressed={hour === selected}
            aria-label={[placeName(hour.location ?? location), timeLabel, condition.label,
              `${weatherText("temperature", language)} ${weatherValue(hour.temperature, 1)}`].filter(Boolean).join(" · ")}
            onClick={() => select(index)} onFocus={() => select(index)} onKeyDown={event => move(event, index)}>
            <time dateTime={new Date(hour.instant).toISOString()} className="trip-weather-hour-time"><PencilText>{hour.clock}</PencilText></time>
            <span className="trip-weather-hour-icon"><WeatherIcon kind={condition.icon} /></span>
            <span className="trip-weather-hour-temperature" style={{ top: WEATHER_CHART_TOP + (geometry.points[index].y ?? WEATHER_CHART_HEIGHT / 2) - 30 }}>
              <PencilText>{hour.temperature == null ? "--" : `${weatherValue(hour.temperature, 1)}°`}</PencilText>
            </span>
          </button>;
        })}
        </div>
      </div>
    </div>
    {selected && <div className="trip-weather-hour-detail" role="status" aria-live="polite" aria-atomic="true">
      <p className="trip-weather-hour-description">
        {selectedPlace && <><PencilText>{selectedPlace}</PencilText>{" · "}</>}
        <time dateTime={new Date(selected.instant).toISOString()} aria-label={formatter.format(new Date(selected.instant))}
          title={formatter.format(new Date(selected.instant))}><PencilText>{selected.clock}</PencilText></time>
        <PencilText>{` · ${weatherCondition(selected.code, language).label} · ${weatherValue(selected.temperature, 1)} °C`}</PencilText>
      </p>
      <dl className="trip-weather-hour-metrics">
        {[["precipitation", selected.precipitation], ["wind", selected.wind]].map(([key, value]) => <div key={key}>
          <dt><PencilText>{weatherText(key, language)}</PencilText></dt>
          <dd><PencilText>{weatherValue(value, 1)}</PencilText></dd>
        </div>)}
      </dl>
    </div>}
  </div>;
}
