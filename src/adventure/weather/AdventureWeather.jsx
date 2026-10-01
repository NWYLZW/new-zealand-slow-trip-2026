import { useLanguage } from "../../LanguageContext";
import { PencilText } from "../pencil/PencilText";
import { PanelDivider } from "../pencil/PanelDivider";
import { RefreshIcon } from "../SketchIcons";
import { WeatherIcon } from "./WeatherIcon";
import { useWeather } from "./useWeather";
import { WeatherSources } from "./WeatherSources";
import { weatherCondition, weatherText, weatherValue } from "./weatherLabels.js";
import "./weather.css";

export { WeatherAttribution } from "./WeatherSources";

export function AdventureWeather({ dateId, placeTag, active = true, sources = false }) {
  const { language } = useLanguage();
  const state = useWeather(dateId, placeTag, active);
  const { location, data } = state;
  const product = data?.product ?? state.request.product;
  const condition = weatherCondition(data?.daily.code, language);
  const status = state.offline ? "offline" : state.error ? "error" : state.stale ? "stale"
    : state.refreshing ? "refreshing" : state.status;
  const statusLabel = status === "ready" ? (data?.partial ? weatherText("partial", language) : null) : weatherText(status, language);
  return <section ref={state.ref} className="trip-weather" aria-label={weatherText("weather", language)}>
    {sources ? <WeatherSources dateId={dateId} location={location} data={data} product={product} language={language} /> : <>
    <div className="trip-weather-summary">
      <WeatherIcon kind={data ? condition.icon : status === "error" ? "error" : status === "loading" ? "loading" : "unknown"} />
      <div className="trip-weather-summary-text">
        <h2><PencilText>{product ? weatherText(product, language) : weatherText("weather", language)}</PencilText></h2>
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
    {data && <>
    <div className="trip-weather-divider"><PanelDivider /></div>
    <table className="trip-weather-hours">
      <thead><tr>{["time", "condition", "temperature", "precipitation", "wind"].map(key =>
        <th key={key} scope="col"><PencilText>{weatherText(key, language)}</PencilText></th>)}</tr></thead>
      <tbody>{data.hours.map(hour => {
        const conditions = weatherCondition(hour.code, language);
        const timeLabel = new Intl.DateTimeFormat(language === "en" ? "en-NZ" : "zh-CN", {
          timeZone: location.timeZone, dateStyle: "medium", timeStyle: "long",
        }).format(new Date(hour.instant));
        return <tr key={hour.instant}>
          <th scope="row"><time dateTime={new Date(hour.instant).toISOString()} title={timeLabel} aria-label={timeLabel}><PencilText>{hour.clock}</PencilText></time></th>
          <td className="trip-weather-hour-condition" title={conditions.label} aria-label={conditions.label}>
            <WeatherIcon kind={conditions.icon} /><span><PencilText>{conditions.label}</PencilText></span>
          </td>
          {[hour.temperature, hour.precipitation, hour.wind].map((value, index) => <td key={index}
            aria-label={value === null ? weatherText("missing", language) : undefined}><PencilText>{weatherValue(value, 1)}</PencilText></td>)}
        </tr>;
      })}</tbody>
    </table></>}
    </>}
  </section>;
}
