const labels = {
  weather: ["天气", "Weather"], forecast: ["天气预报", "Forecast"],
  "archived-forecast": ["历史预报", "Archived forecast"], reanalysis: ["历史再分析 · ERA5", "Historical reanalysis · ERA5"],
  loading: ["正在获取天气", "Loading weather"], error: ["天气获取失败", "Weather request failed"],
  offline: ["离线", "Offline"], stale: ["缓存已过期", "Stale cached data"],
  unavailable: ["暂无天气数据", "Weather unavailable"], refreshing: ["正在更新", "Refreshing"],
  retry: ["重新获取天气", "Retry weather"], updated: ["获取于", "Retrieved"],
  partial: ["部分小时或字段缺失", "Some hours or fields are missing"],
  horizon: ["尚未进入最长 16 天预报窗口，临近日期后再查看。", "Outside the forecast window of up to 16 days. Check closer to the date."],
  "archive-range": ["超出此历史资料的日期范围。", "Outside this archive's date range."],
  location: ["没有可用的公开行程地点，未请求定位。", "No public itinerary location is available. Device location was not requested."],
  "provider-gap": ["提供方尚未返回该日数据，可能处于发布延迟或覆盖空档。", "The provider has not returned data for this date; publication delay or a coverage gap may apply."],
  network: ["请求未成功，请稍后重试。", "The request failed. Please retry shortly."],
  "rate-limit": ["提供方请求限流，已安排延后重试。", "Provider rate limit reached; retry is deferred."],
  timeout: ["天气请求超时。", "The weather request timed out."],
  "invalid-response": ["提供方响应格式无法识别。", "The provider response could not be read."],
  missing: ["缺失", "Missing"], time: ["当地时间", "Local time"], condition: ["天气", "Conditions"],
  temperature: ["气温 °C", "Temp °C"], precipitation: ["降水 mm", "Precip mm"], wind: ["风 km/h", "Wind km/h"],
  note: ["模型数据，非气象站实测。日温区间和最强天气代码由完整当地日的逐小时值汇总；降水为此前一小时累计，风为 10 米高度风速。", "Model data, not station observations. Daily temperature range and most severe weather code are derived from a complete local day of hourly values. Precipitation covers the preceding hour; wind speed is at 10 m."],
  recent: ["近期历史使用归档预报；约 6 天后转用有发布延迟的 ERA5 再分析。", "Recent past dates use archived forecasts; after about 6 days, this view uses delayed ERA5 reanalysis."],
  attribution: ["天气数据：Open-Meteo", "Weather data: Open-Meteo"],
  transformed: ["当地日汇总、舍入与排版", "Local-day aggregation, rounding and formatting"],
};
export const weatherText = (key, language) => labels[key]?.[language === "en" ? 1 : 0] ?? key;
export function weatherCondition(code, language) {
  const entry = code === 0 ? ["晴", "Clear", "sun"] : code === 1 ? ["大部晴朗", "Mainly clear", "sun"]
    : code === 2 ? ["多云", "Partly cloudy", "cloud"] : code === 3 ? ["阴", "Overcast", "cloud"]
      : [45, 48].includes(code) ? ["雾", "Fog", "fog"]
        : [51, 53, 55].includes(code) ? ["毛毛雨", "Drizzle", "rain"]
          : [56, 57, 66, 67].includes(code) ? ["冻雨", "Freezing precipitation", "rain"]
            : [61, 63, 65].includes(code) ? ["雨", "Rain", "rain"]
              : [71, 73, 75, 77].includes(code) ? ["雪", "Snow", "snow"]
                : [80, 81, 82].includes(code) ? ["阵雨", "Showers", "rain"]
                  : [85, 86].includes(code) ? ["阵雪", "Snow showers", "snow"]
                    : [95, 96, 99].includes(code) ? ["雷暴", "Thunderstorm", "thunder"]
                      : ["天气缺失", "Conditions missing", "unknown"];
  return { label: entry[language === "en" ? 1 : 0], icon: entry[2] };
}
export const weatherValue = (value, digits = 0) => value === null || value === undefined ? "--" : value.toFixed(digits);
