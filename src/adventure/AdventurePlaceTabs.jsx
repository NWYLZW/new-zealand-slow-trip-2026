import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { usePrivateVault } from "../PrivateVaultContext";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { assetPath } from "../assets";
import { followSiteLink } from "../siteNavigation";
import { AdventureCalendar, AdventurePencilTabs } from "./AdventureCalendar";
import { placeActivities, placeCalendarDays, placeStays } from "./adventurePlaceData";
import { verifiedStayMarkers } from "./adventureStayMarkers";
import { AdventureStayDetails } from "./AdventureStayDetails";
import { AdventureMediaAlbum } from "./AdventureMediaAlbum";
import AdventureTownMap from "./AdventureTownMap";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { pencilStroke } from "./pencil/stroke";
import "./AdventurePlaceTabs.css";

const tabs = [["calendar", "日历"], ["hotels", "酒店"], ["activities", "活动"], ["photos", "照片"]];
const englishTabs = [["calendar", "Calendar"], ["hotels", "Stays"], ["activities", "Activities"], ["photos", "Photos"]];

function PlaceTabDivider() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const width = canvas.clientWidth;
      if (width < 4) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(8 * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      pencilStroke(context, [[1, 4], [width * .34, 3.7], [width * .68, 4.3], [width - 1, 4]],
        "#627b67", 1, 1427, .35, 2, false,
        { variation: .82, breaks: .22, grain: .7, gain: 2.3, step: .7 });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const resize = new ResizeObserver(schedule);
    resize.observe(canvas);
    schedule();
    return () => { resize.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <canvas ref={canvasRef} className="trip-place-tab-divider" aria-hidden="true" />;
}

function PlaceHotels({ stays, selectedId, onSelectedIdChange, placeName, placeTag, onStayLinkChange, onRequestUnlock, language }) {
  const selected = stays.find((stay) => stay.bookingId === selectedId) ?? stays[0];
  if (!stays.length) return <p className="trip-place-empty"><PencilText>{language === "en" ? "No stay planned here" : "此地点暂无住宿安排"}</PencilText></p>;
  return <div className="trip-place-hotels">
    {stays.length > 1 && <div className="trip-place-stay-choices" aria-label={language === "en" ? "Select stay" : "选择住宿"}>
      {stays.map((stay) => <button key={stay.bookingId} type="button"
        aria-pressed={stay.bookingId === selected.bookingId}
        onClick={() => {
          if (stay.bookingId === selected.bookingId) return;
          onStayLinkChange?.(null);
          onSelectedIdChange(stay.bookingId);
        }}><PencilText ellipsis>{language === "en" ? stay.listingNameEn ?? stay.listingName : stay.listingName}</PencilText></button>)}
    </div>}
    <AdventureStayDetails key={selected.bookingId} booking={selected} placeName={placeName}
      placeTag={placeTag} onStayLinkChange={onStayLinkChange} onRequestUnlock={onRequestUnlock} />
  </div>;
}

function PlaceActivities({ activities, language }) {
  if (!activities.length) return <p className="trip-place-empty"><PencilText>{language === "en" ? "No activity planned here" : "此地点暂无活动安排"}</PencilText></p>;
  return <ul className="trip-place-list">
    {activities.map((activity) => <li key={activity.id} className="trip-place-list-item">
      <strong className="trip-place-item-title"><PencilText ellipsis>{language === "en" ? activity.titleEn ?? activity.title : activity.title}</PencilText></strong>
      <span className="trip-place-item-meta"><PencilText>{language === "en" ? activity.dateEn ?? activity.date : activity.date}</PencilText></span>
      <span className="trip-place-item-status"><PencilText>{language === "en" ? activity.statusEn ?? activity.status : activity.status}</PencilText></span>
      <PencilSurface as="a" variant="action" className="trip-place-detail-link"
        href={assetPath(`?activity=${encodeURIComponent(activity.id)}#activities`)} onClick={followSiteLink}>
        <PencilText>{language === "en" ? "View activity" : "查看活动详情"}</PencilText>
      </PencilSurface>
    </li>)}
  </ul>;
}

export function AdventurePlaceTabs({ stop, selectedTab, onTabChange, selectedDate, onDateChange, onSelectDay, onSelectEvent, onSelectMedia, onRequestCapture, onStayLinkChange, onRequestUnlock, onSelectStay }) {
  const { language } = useLanguage();
  const vault = usePrivateVault();
  const rootRef = useRef(null);
  const [compactHeight, setCompactHeight] = useState(() => typeof window !== "undefined" && window.innerHeight <= 600);
  const tag = stop?.tag;
  const days = useMemo(() => {
    const scoped = placeCalendarDays(tag);
    if (language !== "en") return scoped;
    const translated = new Map(getAdventureCalendarDays({ language }).map((entry) => [entry.dateId, entry]));
    return scoped.map((entry) => {
      const localized = translated.get(entry.dateId);
      const events = new Map(localized?.events.map((event) => [event.urlId, event]));
      return { ...entry, day: localized?.day ?? entry.day,
        events: entry.events.map((event) => events.get(event.urlId) ?? event) };
    });
  }, [tag, language]);
  const stays = useMemo(() => placeStays(tag), [tag]);
  const stayMarkers = useMemo(() => verifiedStayMarkers(stays, vault.data, vault.isUnlocked),
    [stays, vault.data, vault.isUnlocked]);
  const activities = useMemo(() => placeActivities(tag), [tag]);
  const [localTab, setLocalTab] = useState("calendar");
  const [localDate, setLocalDate] = useState(selectedDate);
  const [selectedStayId, setSelectedStayId] = useState(stays[0]?.bookingId);
  const tabControlled = selectedTab !== undefined && typeof onTabChange === "function";
  const dateControlled = selectedDate !== undefined && typeof onDateChange === "function";
  const activeTab = tabControlled ? selectedTab : localTab;
  const activeDate = dateControlled ? selectedDate : localDate;
  const visibleDate = days.some((entry) => entry.dateId === activeDate) ? activeDate : days[0]?.dateId;
  const selectedStay = stays.find((stay) => stay.bookingId === selectedStayId) ?? stays[0];
  const selectedStayMarker = stayMarkers.find((marker) => marker.bookingId === selectedStay?.bookingId);
  const townFocus = activeTab === "hotels" && selectedStayMarker
    ? { ...selectedStayMarker, kind: "hotel" } : null;
  const baseId = `trip-place-${tag ?? "unknown"}`;
  const mapInTab = compactHeight || activeTab === "map";
  const tabItems = language === "en" ? englishTabs : tabs;
  const visibleTabs = mapInTab
    ? [tabItems[0], ["map", language === "en" ? "Map" : "地图"], ...tabItems.slice(1)] : tabItems;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const update = () => {
      const height = root.clientHeight;
      if (height > 0) setCompactHeight(height < 480);
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    update();
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setLocalTab("calendar"); }, [tag]);
  useEffect(() => { setSelectedStayId(stays[0]?.bookingId); }, [tag, stays]);
  useEffect(() => {
    setLocalDate(days.some((entry) => entry.dateId === selectedDate) ? selectedDate : days[0]?.dateId);
  }, [days, selectedDate]);

  const changeTab = (value) => {
    if (value !== "hotels") onStayLinkChange?.(null);
    if (!tabControlled) setLocalTab(value);
    onTabChange?.(value);
  };
  const changeDate = (dateId) => {
    if (!dateControlled) setLocalDate(dateId);
    onDateChange?.(dateId);
  };

  const townMap = <div className="trip-place-town-map"><AdventureTownMap place={stop} language={language}
    focusTarget={townFocus} stayMarkers={stayMarkers} onSelectStay={onSelectStay} /></div>;

  return <section ref={rootRef} className="trip-place-tabs" data-map-layout={mapInTab ? "tab" : "inline"}
    aria-label={language === "en" ? `${stop?.nameEn ?? stop?.name ?? "Place"} plans` : `${stop?.name ?? "地点"}安排`}>
    {!mapInTab && townMap}
    <div className="trip-place-tab-frame">
      <div className="trip-place-tab-scroll">
        <AdventurePencilTabs items={visibleTabs} value={activeTab} onChange={changeTab}
          ariaLabel={language === "en" ? "Place plans" : "地点安排"} idPrefix={baseId} controlsId={`${baseId}-panel`} withInk />
      </div>
      <PlaceTabDivider />
    </div>
    <div className="trip-place-tabpanel" data-tab={activeTab} role="tabpanel" id={`${baseId}-panel`}
      aria-labelledby={`${baseId}-tab-${activeTab}`} tabIndex={0}>
      {activeTab === "map" && townMap}
      {activeTab === "calendar" && (days.length
        ? <AdventureCalendar embedded days={days} selectedDate={visibleDate}
          onSelectDate={changeDate} onSelectDay={onSelectDay} onSelectEvent={onSelectEvent} />
        : <p className="trip-place-empty"><PencilText>{language === "en" ? "No itinerary here" : "暂无此地点的行程"}</PencilText></p>)}
      {activeTab === "hotels" && <PlaceHotels stays={stays} selectedId={selectedStayId}
        onSelectedIdChange={setSelectedStayId} placeName={stop?.name ?? "新西兰"}
        placeTag={tag} onStayLinkChange={onStayLinkChange} onRequestUnlock={onRequestUnlock} language={language} />}
      {activeTab === "activities" && <PlaceActivities activities={activities} language={language} />}
      {activeTab === "photos" && <AdventureMediaAlbum placeTag={tag} selectedId={null}
        onSelect={onSelectMedia} onRequestCapture={onRequestCapture} />}
    </div>
  </section>;
}
