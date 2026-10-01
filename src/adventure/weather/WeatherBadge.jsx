import { useId, useMemo } from "react";
import { PencilText } from "../pencil/PencilText";
import { useWeather } from "./useWeather";
import { WeatherIcon } from "./WeatherIcon";
import { weatherCondition, weatherText, weatherValue } from "./weatherLabels.js";
import { weatherSegmentsForDay } from "./weatherLocations";
import { weatherSegmentData } from "./weatherSegments.js";
import "./weather.css";

export function WeatherBadge({ dateId, placeTag, language, active = true, onSelect }) {
  const id = useId();
  const segments = useMemo(() => weatherSegmentsForDay(dateId, placeTag), [dateId, placeTag]);
  if (segments.length < 2) return <SingleWeatherBadge dateId={dateId} placeTag={placeTag} language={language} active={active} onSelect={onSelect} />;
  return <button type="button" className="trip-weather-badge trip-weather-badge--multiple"
    data-weather-date={dateId} data-weather-place={placeTag ?? ""}
    aria-labelledby={segments.map((_, index) => `${id}-${index}`).join(" ")}
    onClick={event => { event.stopPropagation(); onSelect?.(dateId); }}>
    {segments.map((segment, index) => <SegmentWeatherBadge key={segment.location.id} id={`${id}-${index}`}
      dateId={dateId} segment={segment} language={language} active={active} />)}
  </button>;
}

function SegmentWeatherBadge({ id, dateId, segment, language, active }) {
  const state = useWeather(dateId, null, active, segment.location);
  const data = weatherSegmentData(state.data, segment);
  const condition = weatherCondition(data?.daily.code, language);
  const name = language === "en" ? segment.location.nameEn : segment.location.name;
  const product = data?.product ?? state.request.product;
  const indicator = state.offline ? "offline" : state.error ? "error" : state.stale ? "stale"
    : state.refreshing ? "refreshing" : state.status;
  const label = [weatherText("weather", language), dateId, name, `${segment.start}–${segment.end}`,
    product && weatherText(product, language), data && `${condition.label} · ${weatherValue(data.daily.min)}–${weatherValue(data.daily.max)} °C`,
    indicator !== "ready" && weatherText(indicator, language), data?.partial && weatherText("partial", language),
    (state.reason || state.error) && weatherText(state.reason ?? state.error, language)].filter(Boolean).join(" · ");
  return <span ref={state.ref} className="trip-weather-badge-part" title={label}
    data-weather-location={segment.location.id} data-weather-status={indicator}>
    <WeatherIcon kind={indicator === "error" ? "error" : !data && state.status === "loading" ? "loading" : condition.icon} />
    <span id={id} className="trip-weather-badge-description">{label}</span>
  </span>;
}

function SingleWeatherBadge({ dateId, placeTag, language, active, onSelect }) {
  const state = useWeather(dateId, placeTag, active);
  const product = state.data?.product ?? state.request.product;
  const condition = weatherCondition(state.data?.daily.code, language);
  const indicator = state.offline ? "offline" : state.error ? "error" : state.stale ? "stale" : state.status;
  const locationName = language === "en" ? state.location?.nameEn : state.location?.name;
  const label = [weatherText("weather", language), dateId, locationName,
    product && weatherText(product, language), state.data ? condition.label : weatherText(state.status, language),
    state.data && state.data.daily.max !== null ? `${weatherValue(state.data.daily.min)}–${weatherValue(state.data.daily.max)} °C` : null,
    indicator !== "ready" && weatherText(indicator, language)].filter(Boolean).join(" · ");
  return <button ref={state.ref} type="button" className="trip-weather-badge" data-weather-date={dateId}
    data-weather-place={placeTag ?? ""} data-weather-status={indicator} aria-label={label}
    onClick={event => { event.stopPropagation(); onSelect?.(dateId); }}>
    <WeatherIcon kind={indicator === "error" ? "error" : !state.data && state.status === "loading" ? "loading" : condition.icon} />
    <span className="trip-weather-badge-temperature"><PencilText>{state.data?.daily.max != null ? `${weatherValue(state.data.daily.max)}°` : "--"}</PencilText></span>
  </button>;
}
