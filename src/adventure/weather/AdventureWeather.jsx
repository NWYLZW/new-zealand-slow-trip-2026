import { useMemo, useRef } from "react";
import { useLanguage } from "../../LanguageContext";
import { PencilText } from "../pencil/PencilText";
import { PanelDivider } from "../pencil/PanelDivider";
import { RefreshIcon } from "../SketchIcons";
import { WeatherIcon } from "./WeatherIcon";
import { useSegmentWeather, useWeather } from "./useWeather";
import { WeatherSources } from "./WeatherSources";
import { WeatherHourlyChart } from "./WeatherHourlyChart";
import { weatherCondition, weatherText, weatherValue } from "./weatherLabels.js";
import { weatherSegmentsForDay } from "./weatherLocations";
import { joinWeatherSegments, weatherSegmentData } from "./weatherSegments.js";
import "./weather.css";

export { WeatherAttribution } from "./WeatherSources";

export function AdventureWeather({ dateId, placeTag, active = true, sources = false }) {
  const segments = useMemo(() => weatherSegmentsForDay(dateId, placeTag), [dateId, placeTag]);
  if (segments.length < 2) return <WeatherPeriod dateId={dateId} placeTag={placeTag} active={active} sources={sources} />;
  return <SegmentedWeather dateId={dateId} segments={segments} active={active} sources={sources} />;
}

function SegmentedWeather({ dateId, segments, active, sources }) {
  const { language } = useLanguage();
  const { ref, states, requests, retry } = useSegmentWeather(dateId, segments, active);
  const position = useRef({ left: 0, instant: null });
  const hours = useMemo(() => joinWeatherSegments(dateId, segments, states.map(state => state.data)), [dateId, segments, states]);
  return <section ref={ref} className="trip-weather" aria-label={weatherText("weather", language)}>
    {sources ? segments.map((segment, index) => <WeatherSources key={`${segment.location.id}-${segment.start}`} dateId={dateId}
      location={segment.location} data={states[index].data} product={states[index].data?.product ?? requests[index].product}
      language={language} segment={segment} attribution={index === 0} />) : <>
      <div className="trip-weather-segment-summaries">
        {segments.map((segment, index) => <WeatherSummary key={`${segment.location.id}-${segment.start}`} language={language}
          state={{ ...states[index], location: segment.location, request: requests[index], retry: () => retry(index) }}
          data={weatherSegmentData(states[index].data, segment)} segment={segment} />)}
      </div>
      <div className="trip-weather-divider"><PanelDivider /></div>
      <WeatherHourlyChart hours={hours} timeZone={segments[0].location.timeZone} language={language} position={position} />
    </>}
  </section>;
}

function WeatherPeriod({ dateId, placeTag, segment, active, sources, attribution = true }) {
  const { language } = useLanguage();
  const state = useWeather(dateId, placeTag, active, segment?.location);
  const chartPosition = useRef({ left: 0, instant: null });
  const { location } = state;
  const data = useMemo(() => weatherSegmentData(state.data, segment), [state.data, segment]);
  const product = data?.product ?? state.request.product;
  return <section ref={state.ref} className="trip-weather" aria-label={weatherText("weather", language)}>
    {sources ? <WeatherSources dateId={dateId} location={location} data={data} product={product}
      language={language} segment={segment} attribution={attribution} /> : <>
    <WeatherSummary state={state} data={data} language={language} segment={segment} />
    {data && <>
    <div className="trip-weather-divider"><PanelDivider /></div>
    <WeatherHourlyChart hours={data.hours} timeZone={location.timeZone} language={language} position={chartPosition} location={location} /></>}
    </>}
  </section>;
}

function WeatherSummary({ state, data, language, segment }) {
  const { location } = state;
  const product = data?.product ?? state.request.product;
  const condition = weatherCondition(data?.daily.code, language);
  const status = state.offline ? "offline" : state.error ? "error" : state.stale ? "stale"
    : state.refreshing ? "refreshing" : state.status;
  const statusLabel = status === "ready" ? (data?.partial ? weatherText("partial", language) : null) : weatherText(status, language);
  const placeName = language === "en" ? location?.nameEn : location?.name;
  return <div className="trip-weather-summary-group">
    <div className="trip-weather-summary">
      <WeatherIcon kind={data ? condition.icon : status === "error" ? "error" : status === "loading" ? "loading" : "unknown"} />
      <div className="trip-weather-summary-text">
        <h2><PencilText>{segment ? placeName : product ? weatherText(product, language) : weatherText("weather", language)}</PencilText></h2>
        {segment && <span className="trip-weather-segment-time"><PencilText>{`${segment.start}–${segment.end}`}</PencilText></span>}
        {data && <p><PencilText>{`${condition.label} · ${weatherValue(data.daily.min)}–${weatherValue(data.daily.max)} °C`}</PencilText></p>}
      </div>
      <button className="trip-weather-retry" type="button" aria-label={weatherText("retry", language)}
        disabled={state.refreshing || state.offline || Boolean(state.request.unavailable)
          || (state.error === "rate-limit" && state.retryAt > Date.now())} onClick={state.retry}><RefreshIcon /></button>
    </div>
    <div className="trip-weather-status" role="status" aria-live="polite">
      {statusLabel && <p><PencilText>{statusLabel}</PencilText></p>}
      {(state.reason || state.error) && <p><PencilText>{weatherText(state.reason ?? state.error, language)}</PencilText></p>}
    </div>
  </div>;
}
