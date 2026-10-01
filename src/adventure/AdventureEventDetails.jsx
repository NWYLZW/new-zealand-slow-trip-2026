import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { getInlineEventLink, getInlineEventParts } from "../eventLinks";
import { localNameTranslations } from "../eventMedia";
import { usePrivateVault } from "../PrivateVaultContext";
import { socialGuidesByEvent } from "../socialGuides";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { AdventurePencilTabs } from "./AdventureCalendar";
import { adventureFlightSegments } from "./adventureEventTime";
import { AdventureEventTimeline } from "./AdventureEventTimeline";
import { AdventureGoogleMapLink } from "./AdventureGoogleMapLink";
import { NextIcon, PreviousIcon } from "./SketchIcons";
import { PanelDivider } from "./pencil/PanelDivider";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureEventDetails.css";

const tabLabels = { schedule: "行程安排", flight: "机票信息", names: "相关地名",
  social: "社交攻略", links: "相关链接" };

function InlineDetail({ text }) {
  return <span className="trip-inline-detail">{getInlineEventParts(text).map((part, index) => part.url
    ? part.kind === "place" ? <AdventureGoogleMapLink key={`${part.text}-${index}`} href={part.url}
      ariaLabel={part.label}><PencilText>{part.text}</PencilText></AdventureGoogleMapLink>
      : <a key={`${part.text}-${index}`} href={part.url} target="_blank" rel="noopener noreferrer"
        aria-label={part.label}><PencilText>{part.text}</PencilText> ↗</a>
    : <PencilText key={`${part.text}-${index}`}>{part.text}</PencilText>)}</span>;
}

function privateValue(value) {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function PrivateFlight({ number, vault }) {
  const item = vault.isUnlocked ? vault.data?.flights?.[number] : null;
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  return <dl className="trip-event-private"><dt><PencilText>已解锁机票资料</PencilText></dt>
    {Object.entries(item).map(([label, value]) => <div key={label}>
      <dt><PencilText>{label}</PencilText></dt><dd><PencilText>{privateValue(value)}</PencilText></dd>
    </div>)}
  </dl>;
}

function EventMedia({ media }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const images = media?.images?.length ? media.images : media?.image ? [media] : [];
  if (!images.length) return null;
  const item = images[activeIndex] ?? images[0];
  const photo = typeof item === "string" ? { image: item } : item;
  const show = (delta) => { setFailed(false); setActiveIndex(index => (index + delta + images.length) % images.length); };
  return <div className="trip-event-media" role="region" aria-label="行程图片" aria-roledescription="carousel">
    <figure>
      <a className="trip-event-media-image-link" href={photo.image} target="_blank" rel="noopener noreferrer" title="打开原图">
        {failed ? <span className="trip-event-media-error" role="status"><PencilText>图片暂时无法显示，仍可打开原图</PencilText></span>
          : <img src={photo.image} alt={photo.alt ?? media.location ?? "行程图片"} decoding="async"
            onError={() => setFailed(true)} />}
      </a>
      {(photo.sourceName || photo.license) && <div className="trip-event-media-credit" aria-label="当前图片来源">
        <PencilSurface as={photo.sourceUrl ? "a" : "span"} variant="badge" seed={1051}
          {...(photo.sourceUrl ? { href: photo.sourceUrl, target: "_blank", rel: "noopener noreferrer" } : {})}>
          <PencilText>{[photo.sourceName, photo.license].filter(Boolean).join(" · ")}</PencilText>
        </PencilSurface>
      </div>}
      {images.length > 1 && <div className="trip-event-media-controls">
        <PencilSurface as="button" variant="action" seed={1031} aria-label="上一张图片"
          title="上一张图片" onClick={() => show(-1)}><PreviousIcon /></PencilSurface>
        <PencilSurface as="span" variant="action" seed={1039} className="trip-event-media-count"
          role="status" aria-live="polite" aria-label={`第 ${activeIndex + 1} 张，共 ${images.length} 张`}>
          <PencilText>{`${activeIndex + 1}/${images.length}`}</PencilText>
        </PencilSurface>
        <PencilSurface as="button" variant="action" seed={1047} aria-label="下一张图片"
          title="下一张图片" onClick={() => show(1)}><NextIcon /></PencilSurface>
      </div>}
    </figure>
    <span className="trip-event-media-status" role="status">第 {activeIndex + 1} 张图片，共 {images.length} 张</span>
  </div>;
}

function ScheduleTab({ event, dateId, language, activeAgendaId, onSelectAgenda }) {
  return <div className="trip-event-schedule">
    <AdventureEventTimeline event={event} dateId={dateId} language={language}
      activeAgendaId={activeAgendaId} onSelectAgenda={onSelectAgenda}
      renderContent={(text) => <InlineDetail text={text} />} />
  </div>;
}

function FlightTab({ event, vault }) {
  return <div className="trip-event-flights">
    {event.flightSummary && <div className="trip-event-flight-summary">
      <strong><PencilText>{event.flightSummary.airline}</PencilText></strong>
      <p><PencilText>{`${event.flightSummary.cabin} · 出票日期 ${event.flightSummary.issuedOn}`}</PencilText></p>
      <p><PencilText>{`每人总计 ${event.flightSummary.totalPerPerson}（票价 ${event.flightSummary.farePerPerson} + 税费 ${event.flightSummary.taxPerPerson}）`}</PencilText></p>
    </div>}
    {event.flights?.map((flight, index) => <section key={`${flight.date}-${flight.flightNumber}`}>
      <h2>{getInlineEventLink(flight.flightNumber)?.url
        ? <a href={getInlineEventLink(flight.flightNumber).url} target="_blank" rel="noreferrer"><PencilText>{flight.flightNumber}</PencilText> ↗</a>
        : <PencilText>{flight.flightNumber}</PencilText>}</h2>
      <p><PencilText>{`${flight.date} · ${flight.cabin} · ${flight.status}`}</PencilText></p>
      <p><PencilText>{adventureFlightSegments(event)[index]}</PencilText></p>
      <p><PencilText>{`出发航站楼：${flight.departureTerminal} · 抵达航站楼：${flight.arrivalTerminal}`}</PencilText></p>
      {flight.priceNoteZh && <p><PencilText>{flight.priceNoteZh}</PencilText></p>}
      {flight.reliabilityNoteZh && <p><PencilText>{flight.reliabilityNoteZh}</PencilText></p>}
      <PrivateFlight number={flight.flightNumber} vault={vault} />
    </section>)}
    {event.flightSummary?.note && <p><PencilText>{event.flightSummary.note}</PencilText></p>}
  </div>;
}

function SocialTab({ event }) {
  const guides = socialGuidesByEvent[event.title] ?? [];
  return <div className="trip-event-social">{guides.map((guide, index) => {
    const url = guide.sourceUrl ?? guide.url;
    const media = guide.media ?? {};
    const image = guide.videoThumbnail ?? guide.coverImage ?? guide.thumbnail ?? media.thumbnail ?? media.poster ?? media.src;
    const author = typeof guide.author === "string" ? guide.author : guide.author?.name ?? guide.authorName;
    return <PencilSurface as="article" variant="paper" className="trip-event-social-card" key={guide.id ?? url ?? index}>
      {image && <a className="trip-event-social-media" href={url} target="_blank" rel="noreferrer" title="打开来源">
        <img src={image} alt={guide.coverAlt ?? media.alt ?? guide.title} loading="lazy" />
      </a>}
      <h2 title={guide.title}><PencilText>{guide.title}</PencilText></h2>
      <p className="trip-event-social-meta"><PencilText>{[guide.platform, author, guide.source].filter(Boolean).join(" · ")}</PencilText></p>
      {guide.excerpt && <p className="trip-event-social-excerpt" title={guide.excerpt}><PencilText>{guide.excerpt}</PencilText></p>}
      {(guide.excerpt || guide.points?.length || guide.tip) && <details className="trip-event-social-more">
        <summary><PencilText>查看完整内容</PencilText></summary>
        {guide.excerpt && <p><PencilText>{guide.excerpt}</PencilText></p>}
        {guide.points?.length > 0 && <ul>{guide.points.map((point, pointIndex) => <li key={pointIndex}><PencilText>{point}</PencilText></li>)}</ul>}
        {guide.tip && <p><PencilText>{guide.tip}</PencilText></p>}
      </details>}
      {url && <a className="trip-event-social-link" href={url} target="_blank" rel="noreferrer"><PencilText>{guide.isSearchEntry ? "打开来源" : "打开原帖"}</PencilText> ↗</a>}
    </PencilSurface>;
  })}</div>;
}

export function AdventureEventDetails({ eventId, tab, agendaId = null, onTabChange, onSelectAgenda }) {
  const vault = usePrivateVault();
  const { language } = useLanguage();
  const [copyResult, setCopyResult] = useState("");
  const entry = getAdventureCalendarDays({ language, isPrivateUnlocked: vault.isUnlocked,
    privateVault: vault.data }).find(day => day.events.some(event => event.urlId === eventId));
  const event = entry?.events.find(item => item.urlId === eventId);
  if (!event) return null;
  const tabs = ["schedule", event.flights?.length && "flight", event.media?.localNames?.length && "names",
    (socialGuidesByEvent[event.title] ?? []).length && "social", event.media?.links?.length && "links"].filter(Boolean);
  const activeTab = tabs.includes(tab) ? tab : "schedule";
  return <section className="trip-event-details" aria-label={`${event.title}详情`}>
    <EventMedia key={eventId} media={event.media} />
    <div className="trip-event-tab-frame">
      <div className="trip-event-tab-scroll">
        <AdventurePencilTabs items={tabs.map(value => [value, tabLabels[value]])}
          value={activeTab} onChange={onTabChange} ariaLabel="行程详情分类"
          idPrefix="trip-event" controlsId="trip-event-tabpanel" withInk />
      </div>
      <PanelDivider />
    </div>
    <div className={`trip-event-tabpanel${activeTab === "schedule" ? " trip-event-tabpanel--schedule" : ""}`} id="trip-event-tabpanel" role="tabpanel"
      aria-labelledby={`trip-event-tab-${activeTab}`}>
      {activeTab === "schedule" && <ScheduleTab event={event} dateId={entry.dateId}
        language={language} activeAgendaId={agendaId} onSelectAgenda={onSelectAgenda} />}
      {activeTab === "flight" && <FlightTab event={event} vault={vault} />}
      {activeTab === "names" && <div className="trip-event-names">{event.media?.localNames?.map(name => <div key={name}>
        <span><PencilText>{localNameTranslations[name] ?? name}</PencilText><PencilText>{name}</PencilText></span>
        <button type="button" onClick={async () => {
          try { await navigator.clipboard.writeText(name); setCopyResult(`已复制：${name}`); }
          catch { setCopyResult("复制失败，请长按名称手动复制"); }
        }} aria-label={`复制 ${name}`}><PencilText>复制</PencilText></button>
      </div>)}{copyResult && <p role="status"><PencilText>{copyResult}</PencilText></p>}</div>}
      {activeTab === "social" && <SocialTab event={event} />}
      {activeTab === "links" && <div className="trip-event-links">{["official", "map", "social"].map(kind => {
        const links = event.media?.links?.filter(link => link.kind === kind) ?? [];
        if (!links.length) return null;
        return <section key={kind}><h2><PencilText>{({ official: "官方与预订", map: "地点与路线", social: "社交参考" })[kind]}</PencilText></h2>
          {links.map(link => kind === "map" ? <AdventureGoogleMapLink key={link.url} href={link.url}
            ariaLabel={`${link.label}，在 Google 地图打开`}><PencilText>{link.label}</PencilText></AdventureGoogleMapLink>
            : <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"><PencilText>{link.label}</PencilText> ↗</a>)}
        </section>;
      })}</div>}
    </div>
  </section>;
}
