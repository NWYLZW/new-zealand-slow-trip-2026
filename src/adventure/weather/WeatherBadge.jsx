import { PencilText } from "../pencil/PencilText";
import { useWeather } from "./useWeather";
import { WeatherIcon } from "./WeatherIcon";
import { weatherCondition, weatherText, weatherValue } from "./weatherLabels.js";
import "./weather.css";

export function WeatherBadge({ dateId, placeTag, language, active = true, onSelect }) {
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
