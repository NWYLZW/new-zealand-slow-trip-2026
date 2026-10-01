import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../LanguageContext";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { PencilText } from "./pencil/PencilText";
import { WeatherBadge } from "./weather/WeatherBadge";
import { WeatherAttribution } from "./weather/WeatherSources";
import { pencilStroke } from "./pencil/stroke";
import { drawPencilWash } from "./pencil/wash";
import { calendarPaper } from "./pencil/paper";
import { observeCanvasRecovery } from "./pencil/canvasRecovery";
import { AdventurePaneActions } from "./AdventurePaneActions";
import { adventureEventDescription, adventureEventLabel } from "./adventureEventLabel";
import { adventureEventTime, adventureFlightSegments } from "./adventureEventTime";
import "./AdventureCalendar.css";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const scopes = [["all", "整体"], ["south", "南岛"], ["north", "北岛"]];

function seedFor(value) {
  return Array.from(value).reduce((seed, character) => Math.imul(seed ^ character.codePointAt(0), 16777619), 73) >>> 0;
}

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

function eventPigment(color, dark, paper) {
  if (!dark) return mixHexColors(color, paper, .62);
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;
  // Lift every source category by the same amount, retaining its hue and identity.
  const source = match[1];
  return `#${[0, 2, 4].map(offset => {
    const channel = Number.parseInt(source.slice(offset, offset + 2), 16);
    return Math.round(channel * .6 + 255 * .4).toString(16).padStart(2, "0");
  }).join("")}`;
}

function cardOutline(x, y, width, height, seed) {
  const left = x + 2, top = y + 2, right = x + width - 2, bottom = y + height - 2;
  const points = [];
  for (let corner = 0; corner < 4; corner++) {
    const radius = 7 + ((seed >>> (corner * 4)) % 3) * .5;
    const cx = corner < 2 ? right - radius : left + radius;
    const cy = corner === 0 || corner === 3 ? top + radius : bottom - radius;
    for (let step = 0; step <= 6; step++) {
      const angle = (corner - 1 + step / 6) * Math.PI / 2;
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
  }
  return points;
}

function paintSelectedTab(context, parent, box, value, color, dark) {
  const activeTab = parent.querySelector('.trip-adventure-calendar-scope[aria-selected="true"]');
  if (!activeTab) return;
  const tab = activeTab.getBoundingClientRect();
  drawPencilWash(context, {
    x: tab.left - box.left, y: tab.top - box.top,
    width: tab.width, height: tab.height,
  }, color, seedFor(`scope:${value}`),
  { strength: dark ? .48 : .32, spacing: 1.8, roughness: 3.5, inset: 2, radius: 8 });
}

function InkLayer({ kind, scope, selectedDate, drawKey, fullscreen = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    let pending = 0;
    let disposed = false;
    const paint = () => {
      pending = 0;
      const box = parent.getBoundingClientRect();
      const width = box.width, height = box.height;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const css = getComputedStyle(parent);
      const dark = document.documentElement.dataset.adventureAppearance === "dark";
      const paperColor = css.getPropertyValue("--trip-calendar-paper").trim() || "#faf9f3";
      const pigment = (key, light, night) => css.getPropertyValue(`--trip-calendar-${key}`).trim()
        || (dark ? night : light);
      const selectedTab = pigment("selected-tab", "#769566", "#c6b873");
      if (kind === "tabs") {
        paintSelectedTab(context, parent, box, scope, selectedTab, dark);
        return;
      }
      if (kind === "header") {
        const topEdge = [];
        for (let x = 0; ; x = Math.min(width, x + 6)) {
          topEdge.push([x, fullscreen ? 0 : 3 + Math.sin(x / 29) * .65 + Math.sin(x / 8.3) * .3]);
          if (x === width) break;
        }
        // The paper and its pencil outline share one boundary; above it stays transparent.
        context.fillStyle = context.createPattern(calendarPaper(paperColor, { dark }).canvas, "repeat");
        context.beginPath();
        context.moveTo(topEdge[0][0], topEdge[0][1]);
        for (const [x, y] of topEdge.slice(1)) context.lineTo(x, y);
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.closePath();
        context.fill();
        paintSelectedTab(context, parent, box, scope, selectedTab, dark);
        const outline = pigment("outline", "#536d59", "#918e78");
        if (!fullscreen) pencilStroke(context, topEdge,
          outline, 1.35, 1163, 0, 3, false,
          { variation: .84, breaks: .22, grain: .75, gain: 2.5, step: .7 });
        pencilStroke(context, [[9, height - 2], [width - 9, height - 2]], outline, 1.2,
          1181, .38, 3, false, { variation: .78, breaks: .22, grain: .7, gain: 2.5, step: .7 });
        return;
      }
      const cells = [...parent.querySelectorAll(".trip-adventure-calendar-day")];
      const events = [...parent.querySelectorAll(".trip-adventure-calendar-event")];
      const regionInk = {
        transit: pigment("transit", "#86a8b2", "#8eafc4"),
        south: pigment("south", "#a79f68", "#c1a680"),
        north: pigment("north", "#8fa474", "#9ab68a"),
      };
      for (const cell of cells) {
        const rect = cell.getBoundingClientRect();
        drawPencilWash(context, {
          x: rect.left - box.left, y: rect.top - box.top,
          width: rect.width, height: rect.height,
        }, dark ? regionInk[cell.dataset.region] ?? "#a79f68"
          : mixHexColors(regionInk[cell.dataset.region] ?? "#a79f68", paperColor, .58),
        seedFor(`day:${cell.dataset.date}`),
        { strength: dark ? cell.dataset.selected === "true" ? .43 : .28
          : cell.dataset.selected === "true" ? .2 : .13,
          spacing: 2, roughness: 3.5, inset: 3, radius: 8 });
      }
      for (const event of events) {
        const rect = event.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        drawPencilWash(context, {
          x: rect.left - box.left, y: rect.top - box.top,
          width: rect.width, height: rect.height,
        }, eventPigment(event.style.getPropertyValue("--event-ink") || "#718e79", dark, paperColor), seedFor(`event:${event.dataset.eventId}`),
        { strength: dark ? .42 : .11, spacing: 2.2, roughness: 2.8, inset: 2 });
      }
      for (const cell of cells) {
        const rect = cell.getBoundingClientRect();
        const x = rect.left - box.left, y = rect.top - box.top;
        const seed = seedFor(cell.dataset.date);
        const selected = cell.dataset.selected === "true";
        pencilStroke(context, cardOutline(x, y, rect.width, rect.height, seed),
          selected ? pigment("card-selected-outline", "#2e5c45", "#e0d396")
            : pigment("card-outline", "#778375", "#817e6b"),
          selected ? 1.45 : dark ? 1.05 : .85, seed, .8,
          selected || dark ? 3 : 2, true,
          { variation: .82, breaks: selected ? .17 : .23, grain: .7, gain: selected ? 2.5 : 1.8, step: .8 });
      }
      for (const event of events) {
        const rect = event.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const x = rect.left - box.left + 2, y = rect.top - box.top;
        const color = eventPigment(event.style.getPropertyValue("--event-ink") || "#496855", dark, paperColor);
        pencilStroke(context, [[x, y + 4], [x, y + rect.height - 4]], color, dark ? 1.7 : 1.3,
          seedFor(event.dataset.eventId), .3, 3, false,
          { variation: .8, breaks: .2, grain: .7, gain: 3, step: .55 });
      }
    };
    const schedule = () => { if (!disposed && !pending) pending = requestAnimationFrame(paint); };
    const resize = new ResizeObserver(schedule);
    resize.observe(parent);
    const appearance = new MutationObserver(schedule);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    document.fonts.ready.then(schedule);
    const stopRecovery = observeCanvasRecovery(() => {
      cancelAnimationFrame(pending);
      pending = 0;
      schedule();
    });
    schedule();
    return () => { disposed = true; stopRecovery(); cancelAnimationFrame(pending); resize.disconnect(); appearance.disconnect(); };
  }, [kind, scope, selectedDate, drawKey, fullscreen]);
  return <canvas className="trip-adventure-calendar-ink" ref={canvasRef} aria-hidden="true" />;
}

function dayLabel(entry) {
  const [, month, date] = entry.dateId.split("-").map(Number);
  return `${month}月${date}日 ${entry.day.weekday} ${entry.day.title}`;
}

function calendarCells(days) {
  if (!days.length) return [];
  const entries = new Map(days.map((entry) => [entry.dateId, entry]));
  const first = days[0].dateId;
  const last = days.at(-1).dateId;
  const cells = [];
  for (const date = new Date(`${first}T12:00:00Z`); date.toISOString().slice(0, 10) <= last; date.setUTCDate(date.getUTCDate() + 1)) {
    const dateId = date.toISOString().slice(0, 10);
    cells.push({ dateId, entry: entries.get(dateId) ?? null });
  }
  return cells;
}

export function AdventurePencilTabs({ items, value, onChange, ariaLabel, idPrefix, controlsId, withInk = false }) {
  const tabRefs = useRef([]);
  const onKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index + items.length - 1) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    onChange?.(items[next][0]);
    tabRefs.current[next]?.focus();
  };
  return <nav className="trip-adventure-calendar-scopes" role="tablist" aria-label={ariaLabel}>
    {items.map(([id, label], index) => <button key={id} type="button" role="tab"
      ref={(node) => { tabRefs.current[index] = node; }}
      className="trip-adventure-calendar-scope" id={idPrefix ? `${idPrefix}-tab-${id}` : undefined}
      aria-controls={controlsId} aria-selected={value === id} tabIndex={value === id ? 0 : -1}
      onClick={() => onChange?.(id)} onKeyDown={(event) => onKeyDown(event, index)}>
      <PencilText>{label}</PencilText>
    </button>)}
    {withInk && <InkLayer kind="tabs" scope={value} />}
  </nav>;
}

export function AdventureCalendar({ selectedDate, onSelectDate, onSelectDay, onSelectEvent, onSelectWeather, weatherPlace, weatherActive = true, onClose, scope = "all", onScopeChange, days: suppliedDays, embedded = false,
  fullscreen = false, automaticFullscreen = false, onToggleFullscreen, onOpenMenu }) {
  const { language } = useLanguage();
  const defaultDays = useMemo(() => getAdventureCalendarDays({ scope, language }), [scope, language]);
  const days = suppliedDays ?? defaultDays;
  const cells = useMemo(() => calendarCells(days), [days]);
  const drawKey = useMemo(() => days.map((entry) => `${entry.dateId}:${entry.events
    .map((event) => event.urlId).join(",")}`).join("|"), [days]);
  const calendarRef = useRef(null);
  useEffect(() => {
    const root = calendarRef.current;
    const apply = () => {
      const color = getComputedStyle(root).getPropertyValue("--trip-calendar-paper").trim() || "#faf9f3";
      const dark = document.documentElement.dataset.adventureAppearance === "dark";
      root.style.setProperty("--trip-calendar-texture", `url("${calendarPaper(color, { dark }).url}")`);
    };
    const appearance = new MutationObserver(apply);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ["data-adventure-appearance", "data-adventure-theme"] });
    apply();
    return () => { appearance.disconnect(); root.style.removeProperty("--trip-calendar-texture"); };
  }, []);

  return <section ref={calendarRef} className={`trip-adventure-calendar${embedded ? " trip-adventure-calendar--embedded" : ""}`} aria-label={language === "en" ? embedded ? "Place itinerary calendar" : "Itinerary calendar" : embedded ? "地点行程日历" : "行程日历"}>
    {!embedded && <header className="trip-adventure-calendar-header">
      <AdventurePencilTabs items={language === "en" ? [["all", "All"], ["south", "South"], ["north", "North"]] : scopes} value={scope} onChange={onScopeChange} ariaLabel={language === "en" ? "Calendar region" : "日历范围"} />
      <div className="trip-calendar-header-actions"><AdventurePaneActions calendar fullscreen={fullscreen} automaticFullscreen={automaticFullscreen}
        onToggleFullscreen={onToggleFullscreen} onOpenMenu={onOpenMenu} onClose={onClose} /></div>
      <InkLayer kind="header" scope={scope} fullscreen={fullscreen} />
    </header>}
    <div className="trip-adventure-calendar-scroll">
      <div className="trip-adventure-calendar-weekdays" aria-hidden="true">
        {(language === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : weekdays).map((weekday, index) => <span key={index}><PencilText>{weekday}</PencilText></span>)}
      </div>
      <div className="trip-adventure-calendar-grid">
        {cells.map(({ dateId, entry }, index) => {
          const firstColumn = index === 0
            ? ((new Date(`${dateId}T12:00:00Z`).getUTCDay() + 6) % 7) + 1 : undefined;
          if (!entry) return <div className="trip-adventure-calendar-gap" key={dateId}
            style={{ gridColumnStart: firstColumn }} aria-hidden="true" />;
          const active = entry.dateId === selectedDate;
          const [, month, date] = entry.dateId.split("-").map(Number);
          return <div className="trip-adventure-calendar-day" data-date={entry.dateId} data-region={entry.day.calendarRegion} data-selected={active} key={entry.dateId}
            style={{ gridColumnStart: firstColumn }}>
            <button
              className="trip-adventure-calendar-date"
              type="button"
              aria-label={language === "en" ? `View itinerary for ${entry.dateId}: ${entry.day.title}` : `查看${dayLabel(entry)}当天日程`}
              aria-pressed={active}
              onClick={() => onSelectDay
                ? onSelectDay(entry.dateId)
                : onSelectDate?.(entry.dateId, entry.day, entry.events)}
            ><span className="trip-adventure-calendar-month"><PencilText>{`${month}/`}</PencilText></span>
              <span className="trip-adventure-calendar-day-number"><PencilText>{date}</PencilText></span></button>
            <WeatherBadge dateId={entry.dateId} placeTag={weatherPlace} language={language} active={weatherActive} onSelect={onSelectWeather} />
            <div className="trip-adventure-calendar-events">
              {entry.events.map((event) => <button
                  className="trip-adventure-calendar-event"
                  type="button"
                  key={event.urlId}
                  data-event-id={event.urlId}
                  aria-label={language === "en" ? `View ${entry.dateId} ${adventureEventLabel(event)}${adventureEventDescription(event) ? `, ${event.title}` : ""}, ${adventureEventTime(event, entry.dateId) ?? ""}` : `查看${entry.day.date} ${adventureEventLabel(event)}${adventureEventDescription(event) ? `，${event.title}` : ""}，${adventureEventTime(event, entry.dateId) ?? ""}${adventureFlightSegments(event).length ? `；${adventureFlightSegments(event).join("；")}` : ""}`}
                  title={`${adventureEventLabel(event)}${adventureEventDescription(event) ? ` · ${event.title}` : ""} · ${adventureEventTime(event, entry.dateId) ?? ""}${adventureFlightSegments(event).length ? `\n${adventureFlightSegments(event).join("\n")}` : ""}`}
                  style={{ "--event-ink": event.color }}
                  onClick={click => { click.stopPropagation(); onSelectEvent?.(event); }}
                ><PencilText ellipsis>{adventureEventLabel(event)}</PencilText></button>)}
            </div>
          </div>;
        })}
        <InkLayer kind="grid" scope={scope} selectedDate={selectedDate} drawKey={drawKey} />
      </div>
      <WeatherAttribution language={language} compact />
    </div>
  </section>;
}
