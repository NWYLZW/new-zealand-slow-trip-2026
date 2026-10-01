import { PencilText } from "../pencil/PencilText";
import { WEATHER_PROVIDER, weatherLocalParts } from "./weatherData.js";
import { weatherText } from "./weatherLabels.js";

export function WeatherAttribution({ language }) {
  return <div className="trip-weather-attribution">
    <a href={WEATHER_PROVIDER.url} target="_blank" rel="noopener noreferrer"><PencilText>{weatherText("attribution", language)}</PencilText></a>
    <a href={WEATHER_PROVIDER.licence} target="_blank" rel="noopener noreferrer"><PencilText>CC BY 4</PencilText></a>
  </div>;
}

export function WeatherSources({ dateId, location, data, product, language, segment, attribution = true }) {
  const fetched = data && location ? weatherLocalParts(data.fetchedAt, location.timeZone) : null;
  return <div className="trip-weather-sources">
    {attribution && <WeatherAttribution language={language} />}
    {segment && <p><PencilText>{`${language === "en" ? location.nameEn : location.name} · ${segment.start}–${segment.end}`}</PencilText></p>}
    {segment?.transit && <p><PencilText>{language === "en"
      ? `The planned ${segment.transit.start}–${segment.transit.end} journey is split at ${segment.transit.split}: origin weather for the first half, destination weather for the second. This is an approximation, not weather sampled along the road.`
      : `计划途中 ${segment.transit.start}–${segment.transit.end} 在 ${segment.transit.split} 对半划分：前半程采用起点天气，后半程采用终点天气。这是近似分配，不是沿途道路的实况。`}</PencilText></p>}
    {product && <p><PencilText>{weatherText(product, language)}</PencilText></p>}
    {location && <p><PencilText>{language === "en"
      ? `${location.representative ? "Representative location" : "Location"}: ${location.nameEn}. ${location.context === "place" ? "Place calendar location" : "Public itinerary activity / arrival location"}; not weather along the entire route.`
      : `${location.representative ? "代表地点" : "地点"}：${location.name}。${location.context === "place" ? "地点日历对应位置" : "公开行程的活动或抵达地点"}，不代表沿途全部天气。`}</PencilText></p>}
    <p><PencilText>{dateId}{location ? ` · ${location.timeZone}` : ""}</PencilText></p>
    {fetched && <p><PencilText>{`${weatherText("updated", language)} ${fetched.date} ${fetched.clock} · ${location.timeZone}`}</PencilText></p>}
    <p><PencilText>{weatherText(segment ? "segmentNote" : "note", language)}</PencilText></p>
    <p><PencilText>{weatherText("recent", language)}</PencilText></p>
    <p><PencilText>{weatherText("transformed", language)}</PencilText></p>
    <p><a href={product === "reanalysis" ? WEATHER_PROVIDER.archiveDocs : WEATHER_PROVIDER.forecastDocs}
      target="_blank" rel="noopener noreferrer"><PencilText>{language === "en" ? "Source and model documentation" : "数据来源与模型说明"}</PencilText></a>
      {product === "reanalysis" && <PencilText> · ERA5 / Copernicus Climate Change Service (C3S)</PencilText>}</p>
  </div>;
}
