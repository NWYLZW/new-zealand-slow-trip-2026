import { PencilText } from "../pencil/PencilText";
import { WEATHER_PROVIDER, weatherLocalParts } from "./weatherData.js";
import { weatherText } from "./weatherLabels.js";

export function WeatherAttribution({ language, compact = false }) {
  return <div className={`trip-weather-attribution${compact ? " trip-weather-attribution--compact" : ""}`}>
    <a href={WEATHER_PROVIDER.url} target="_blank" rel="noopener noreferrer"><PencilText>{weatherText("attribution", language)}</PencilText></a>
    <a href={WEATHER_PROVIDER.licence} target="_blank" rel="noopener noreferrer"><PencilText>CC BY 4</PencilText></a>
  </div>;
}

export function WeatherSources({ dateId, location, data, product, language }) {
  const fetched = data && location ? weatherLocalParts(data.fetchedAt, location.timeZone) : null;
  return <div className="trip-weather-sources">
    <WeatherAttribution language={language} />
    {product && <p><PencilText>{weatherText(product, language)}</PencilText></p>}
    {location && <p><PencilText>{language === "en"
      ? `${location.representative ? "Representative location" : "Location"}: ${location.nameEn}. ${location.context === "place" ? "Place calendar location" : "Public itinerary activity / arrival location"}; not weather along the entire route.`
      : `${location.representative ? "代表地点" : "地点"}：${location.name}。${location.context === "place" ? "地点日历对应位置" : "公开行程的活动或抵达地点"}，不代表沿途全部天气。`}</PencilText></p>}
    <p><PencilText>{dateId}{location ? ` · ${location.timeZone}` : ""}</PencilText></p>
    {fetched && <p><PencilText>{`${weatherText("updated", language)} ${fetched.date} ${fetched.clock} · ${location.timeZone}`}</PencilText></p>}
    <p><PencilText>{weatherText("note", language)}</PencilText></p>
    <p><PencilText>{weatherText("recent", language)}</PencilText></p>
    <p><PencilText>{weatherText("transformed", language)}</PencilText></p>
    <p><a href={product === "reanalysis" ? WEATHER_PROVIDER.archiveDocs : WEATHER_PROVIDER.forecastDocs}
      target="_blank" rel="noopener noreferrer"><PencilText>{language === "en" ? "Source and model documentation" : "数据来源与模型说明"}</PencilText></a>
      {product === "reanalysis" && <PencilText> · ERA5 / Copernicus Climate Change Service (C3S)</PencilText>}</p>
  </div>;
}
