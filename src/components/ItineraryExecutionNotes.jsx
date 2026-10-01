import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./ItineraryExecutionNotes.css";

export function ItineraryExecutionNotes({ event, language = "zh", activeAgendaId,
  renderText = text => text, renderDivider, renderIndicator = () => <ExpandMoreIcon fontSize="small" /> }) {
  const en = language === "en";
  const entries = (event.events ?? []).flatMap(([time, title, metadata], index) => {
    const execution = metadata?.execution;
    if (!execution) return [];
    const sourceIndex = event.items?.[index] ?? index;
    const sources = (event.day?.executionSources ?? []).filter(source =>
      /^https:\/\//.test(source.url) && execution.sourceIds?.includes(source.id));
    return [{ time, sourceIndex, sources,
      summary: en ? execution.summaryEn ?? metadata.summaryEn ?? title : execution.summary ?? metadata.summary ?? title,
      text: en ? execution.textEn : execution.text }];
  });
  if (!entries.length) return null;
  return <section className="itinerary-execution" aria-label={en ? "Day-of travel details" : "当日执行细节"}>
    <h3>{renderText(en ? "Day-of details" : "执行细节")}</h3>
    <p className="itinerary-execution-reviewed">{renderText(en
      ? `Plan updated ${event.day.executionReviewedAt}; follow activity confirmations and recheck roads and weather.`
      : `计划更新于 ${event.day.executionReviewedAt}；活动以确认单为准，道路与天气出发前复核。`)}</p>
    {entries.map((entry, index) => <div className="itinerary-execution-entry" key={entry.sourceIndex}>
      <details open={activeAgendaId === `${event.urlId}#agenda-${entry.sourceIndex}` || undefined}>
        <summary><time>{renderText(entry.time)}</time><span>{renderText(entry.summary)}</span>
          <span className="itinerary-execution-indicator" aria-hidden="true">{renderIndicator()}</span></summary>
        <div className="itinerary-execution-body">
          <p>{renderText(entry.text)}</p>
          {entry.sources.length > 0 && <ul aria-label={en ? "Sources" : "参考来源"}>
            {entry.sources.map(source => <li key={source.id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{renderText(en ? source.titleEn ?? source.title : source.title)}</a>
              {source.status !== "verified" && <span>{renderText(source.status === "official-unreachable"
                ? en ? " (content not retrieved)" : "（未取得正文）"
                : en ? " (recheck needed)" : "（待复核）")}</span>}
            </li>)}
          </ul>}
        </div>
      </details>
      {index < entries.length - 1 && renderDivider?.()}
    </div>)}
    {event.day?.links?.length > 0 && <details className="itinerary-execution-sources">
      <summary>{renderText(en ? "Before departure" : "出发前复核")}</summary>
      <ul>{event.day.links.filter(([, url]) => /^https:\/\//.test(url)).map(([label, url]) =>
        <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{renderText(label)}</a></li>)}</ul>
    </details>}
  </section>;
}
