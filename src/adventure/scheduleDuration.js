export function scheduleDurationLabel(start, end, {
  language = "zh", isEstimated = false, executionStatus, activityType,
} = {}) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "";
  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  const duration = language === "en"
    ? [hours ? `${hours}h` : "", rest || !hours ? `${rest}m` : ""].filter(Boolean).join(" ")
    : [hours ? `${hours}小时` : "", rest || !hours ? `${rest}分钟` : ""].join("");
  const prefix = !isEstimated ? "" : executionStatus === "completed"
    ? language === "en" ? "About " : "约"
    : activityType === "drive" ? language === "en" ? "Allow " : "预留"
      : language === "en" ? "Planned " : "计划";
  return prefix + duration;
}
