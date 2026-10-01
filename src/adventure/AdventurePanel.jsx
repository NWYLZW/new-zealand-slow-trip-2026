import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoatIcon, BusIcon, CalendarIcon, CarIcon, CityIcon, DirectionsIcon, LocationMapIcon, RouteDistanceIcon,
  ExternalLinkIcon, FlightIcon, FullscreenExitIcon, FullscreenIcon, HelicopterIcon, MountainIcon, MovieIcon, PreviousIcon, NextIcon, StarsIcon,
  BagIcon, CameraIcon, CloseIcon, HotelIcon, RoutePathIcon, MapSourcesIcon, OrderIcon } from "./SketchIcons";
import { adventurePath } from "../siteNavigation";
import { useLanguage } from "../LanguageContext";
import { usePrivateVault } from "../PrivateVaultContext";
import { confirmedAccommodationBookings } from "../data/confirmedAccommodationBookings";
import { confirmedStayTransitionsOn } from "../data/confirmedStayTimeline";
import { preTripChecklist } from "../data/preTripChecklist";
import { adventureDays, adventureStops } from "./adventureData";
import { routeDirectionsUrl } from "./adventureRoutes";
import { useAdventureRoutes } from "./AdventureResolvedRoutes.jsx";
import { AdventureRouteDetails } from "./AdventureRouteDetails";
import { AdventureWaypointDetails } from "./AdventureWaypointDetails";
import { AdventureClusterDetails } from "./AdventureClusterDetails";
import { getAdventureWaypoint } from "./adventureWaypoints";
import { AdventureDayDetails } from "./AdventureDayDetails";
import { AdventureEventDetails } from "./AdventureEventDetails";
import { AdventurePlaceTabs } from "./AdventurePlaceTabs";
import { AdventureBag, AdventureBagNoteCategory } from "./AdventureBag";
import { AdventureCamera } from "./AdventureCamera";
import { AdventureCameraSettings } from "./AdventureCameraSettings";
import { AdventureMediaAlbum } from "./AdventureMediaAlbum";
import { AdventureMediaArchiveActions } from "./AdventureMediaArchiveActions";
import { AdventureStayDetails } from "./AdventureStayDetails";
import { adventureField, adventureText } from "./adventureLabels";
import { placeCalendarDays, placeStays } from "./adventurePlaceData";
import { MapSources } from "./MapSources";
import { PencilText } from "./pencil/PencilText";
import { PencilSurface } from "./pencil/PencilSurface";
import { PanelDivider } from "./pencil/PanelDivider";
import { eventDateId, getAdventureCalendarDays, getTripCalendarDay } from "../components/calendar/tripCalendarData";
import { PencilIcon } from "./pencil/PencilIcon";
import { AdventurePaneActions } from "./AdventurePaneActions";
import { AdventureWeather } from "./weather/AdventureWeather";
import { weatherLocationForDay } from "./weather/weatherLocations";

const calendarDays = getAdventureCalendarDays();
const eventsById = new Map(calendarDays.flatMap(day => day.events.map(event => [event.urlId, event])));

const dayIcons = { flight: FlightIcon, car: CarIcon, city: CityIcon, boat: BoatIcon,
  mountain: MountainIcon, helicopter: HelicopterIcon, stars: StarsIcon, bus: BusIcon,
  movie: MovieIcon };
const placeIcons = { ZQN: MountainIcon, WKA: MountainIcon, AOR: MountainIcon,
  TEK: MountainIcon, OAM: CityIcon, CHC: CityIcon, AKC: CityIcon, HBT: MovieIcon };
const budgetManageUrl = "https://www.budget.co.nz/en/reservation/view-modify-cancel";

function RouteMetaSeparator() {
  return <span className="trip-route-meta-separator" aria-hidden="true"><PencilIcon kind="divider">
    <path d="M16.1 7.5c-.5 5.9-.2 11.1-.4 17" />
  </PencilIcon></span>;
}

function safeStayHref(href) {
  if (typeof href !== "string" || !href.trim()) return null;
  try {
    const url = new URL(href, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function EventStayAction({ stays, language, onSelect }) {
  if (!stays.length) return null;
  if (stays.length === 1) return <button type="button" className="trip-route-header-action"
    aria-label={adventureText("查看关联住宿", "Open related stay", language)}
    onClick={() => onSelect(stays[0])}><HotelIcon /></button>;
  return <details className="trip-event-stay-menu">
    <summary className="trip-route-header-action" aria-label={adventureText("选择关联住宿", "Choose related stay", language)}>
      <HotelIcon />
    </summary>
    <div className="trip-event-stay-menu-list" role="menu">
      {stays.map((stay) => <button key={stay.bookingId} type="button" role="menuitem"
        onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); onSelect(stay); }}>
        <PencilText>{adventureField(stay.booking, "listingName", language)}</PencilText>
      </button>)}
    </div>
  </details>;
}

function separatedVisitPeriods(tag) {
  const dates = [...new Set(placeCalendarDays(tag).map((entry) => entry.dateId))]
    .map((dateId) => new Date(`${dateId}T00:00:00Z`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  const periods = [];
  for (const date of dates) {
    const last = periods.at(-1);
    if (last && date.getTime() - last[1].getTime() === 86400000) last[1] = date;
    else periods.push([date, date]);
  }
  if (periods.length < 2) return null;
  const label = (date) => `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  return periods.map(([first, last]) => first === last ? label(first) : `${label(first)}—${label(last)}`).join("、");
}

function compactStayDateRange(booking) {
  if (!booking?.checkIn || !booking?.checkOut) return null;
  const compact = (dateId) => {
    const [, month, day] = dateId.split("-").map(Number);
    return Number.isFinite(month) && Number.isFinite(day) ? `${month}/${day}` : dateId;
  };
  return {
    label: `${compact(booking.checkIn)} — ${compact(booking.checkOut)}`,
    full: `${booking.checkIn} — ${booking.checkOut}`,
  };
}

function dayIcon(entry) {
  if (!entry) return null;
  const scores = new Map();
  const add = (kind, weight) => scores.set(kind, (scores.get(kind) ?? 0) + weight);
  for (const event of entry.events) {
    if (event.title?.includes("直升机")) add("helicopter", 5);
    else if (event.isFlightTransfer) add("flight", 5);
    else {
      const kind = ({ flight: "flight", domesticFlight: "flight", car: "car", city: "city",
      boat: "boat", nature: "mountain", stargazing: "stars", bus: "bus",
      movie: "movie" })[event.icon];
      if (kind) add(kind, ({ car: 2, city: 3, boat: 5, nature: 1,
        stargazing: 4, bus: 1, movie: 5 })[event.icon] ?? 1);
    }
  }
  const title = entry.day.title;
  if (/直升机/.test(title)) add("helicopter", 4);
  if (/观星|星空/.test(title)) add("stars", 2);
  if (/市区|城市|半日/.test(title)) add("city", 2);
  if (/自驾|公路/.test(title)) add("car", 2);
  if (/乘机|飞往|航班/.test(title)) add("flight", 2);
  let chosen = null, score = 0;
  for (const [kind, weight] of scores) {
    if (weight > score) { chosen = kind; score = weight; }
  }
  return dayIcons[chosen] ?? CalendarIcon;
}

export function AdventurePanel({ view, navigate, closeButtonRef, onRequestUnlock, cameraActive = false, weatherActive = true,
  fullscreen = false, automaticFullscreen = false, onToggleFullscreen, onOpenMenu, ...props }) {
  const { language } = useLanguage();
  const vault = usePrivateVault();
  const adventureRoutes = useAdventureRoutes();
  const vaultUnlocked = useRef(vault.isUnlocked);
  vaultUnlocked.current = vault.isUnlocked;
  const [stayLink, setStayLink] = useState(null);
  const panelRef = useRef(null);
  const [shortHeight, setShortHeight] = useState(() => window.innerHeight <= 520);
  const mediaAlbumRef = useRef(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const update = () => {
      if (panel.clientHeight > 0) setShortHeight(panel.clientHeight <= 520);
    };
    const resize = new ResizeObserver(update);
    resize.observe(panel);
    update();
    return () => resize.disconnect();
  }, []);
  const onStayLinkChange = useCallback((action) => {
    setStayLink((previous) => {
      const next = action ? { ...action, vaultUnlocked: vaultUnlocked.current } : null;
      return previous?.placeTag === next?.placeTag && previous?.bookingId === next?.bookingId
        && previous?.href === next?.href && previous?.label === next?.label
        && previous?.mapHref === next?.mapHref && previous?.mapLabel === next?.mapLabel
        && previous?.vaultUnlocked === next?.vaultUnlocked ? previous : next;
    });
  }, []);
  useLayoutEffect(() => { setStayLink(null); }, [view.rightPanel, view.placeTab, view.place, view.bagStay]);
  const index = adventureStops.findIndex((stop) => stop.tag === view.place);
  const isWeather = view.rightPanel === "weather";
  const weatherSources = isWeather && view.weatherView === "sources";
  const weatherLocation = isWeather ? weatherLocationForDay(view.weatherDate, view.weatherPlace) : null;
  const stop = view.rightPanel === "cluster" || isWeather ? null : adventureStops[index];
  const bagBooking = view.rightPanel === "bag-stay" ? confirmedAccommodationBookings[view.bagStay] : null;
  const bagNoteCategory = view.rightPanel === "bag-note"
    ? preTripChecklist.find((group) => group.id === view.bagNote) : null;
  const bagPlace = bagBooking && adventureStops.find((place) => placeStays(place.tag)
    .some((stay) => stay.bookingId === bagBooking.bookingId));
  const activeStayPlace = view.rightPanel === "bag-stay" ? bagPlace : stop;
  const activeStayAction = ((view.rightPanel === "place" && view.placeTab === "hotels") || view.rightPanel === "bag-stay")
    && activeStayPlace && stayLink && stayLink.placeTag === activeStayPlace.tag && stayLink.vaultUnlocked === vault.isUnlocked
    && placeStays(activeStayPlace.tag).some((stay) => stay.bookingId === stayLink.bookingId)
    && (view.rightPanel !== "bag-stay" || stayLink.bookingId === bagBooking?.bookingId)
    ? stayLink : null;
  const activePropertyHref = activeStayAction ? safeStayHref(activeStayAction.href) : null;
  const activeMapHref = activeStayAction ? safeStayHref(activeStayAction.mapHref) : null;
  const hasStayActions = Boolean(activePropertyHref || activeMapHref);
  const route = view.rightPanel === "cluster" || isWeather ? null : adventureRoutes.find((item) => item.id === view.route);
  const waypointRecord = route ? getAdventureWaypoint(view.waypoint) : null;
  const [routeMonth, routeDay] = route?.date.split("/") ?? [];
  const routeItinerary = route && adventureDays.find(item => item.date === `${Number(routeMonth)}月${Number(routeDay)}日`);
  const waypoint = waypointRecord ? {
    ...waypointRecord,
    time: routeItinerary?.events?.[waypointRecord.eventIndexes[0]]?.[0] ?? route.date,
  } : null;
  const routeDateId = routeItinerary ? eventDateId({ day: routeItinerary }) : null;
  const hasRouteDay = Boolean(routeDateId && getTripCalendarDay(routeDateId));
  const isRoadRoute = route?.transport === "road" || route?.transport === "coach";
  const routeDistance = isRoadRoute && !route.hotelEndpoints && route.roadSource?.distanceM > 0 ? Math.round(route.roadSource.distanceM / 1000) : null;
  const RouteModeIcon = route?.transport === "flight" ? FlightIcon : route?.transport === "coach" ? BusIcon : CarIcon;
  const routeModeLabel = route?.transport === "flight" ? adventureText("航班", "Flight", language)
    : route?.transport === "coach" ? adventureText("大巴往返", "Coach return", language)
      : adventureText("自驾", "Drive", language);
  const routeDistanceTitle = route?.transport === "coach" ? "单程公路参考距离，非实时导航距离" : "公路参考距离，非实时导航距离";
  const calendarDay = view.rightPanel === "day" ? getTripCalendarDay(view.day, { language }) : null;
  const event = view.rightPanel === "event"
    ? (language === "en" ? getAdventureCalendarDays({ language }).flatMap(day => day.events)
      .find(item => item.urlId === view.eventId) : null) ?? eventsById.get(view.eventId) : null;
  const eventStayChoices = useMemo(() => {
    if (!event?.stayIntegration?.mapPhases?.length) return [];
    const allowed = new Set(event.stayIntegration.mapPhases);
    return confirmedStayTransitionsOn(eventDateId(event)).filter((stay) => allowed.has(stay.phase))
      .map((stay) => ({ ...stay, bookingId: stay.booking.bookingId, dateId: eventDateId(event) }));
  }, [event?.urlId, event?.stayIntegration]);
  const placePeriods = useMemo(() => stop ? separatedVisitPeriods(stop.tag) : null, [stop?.tag]);
  const mediaDetail = Boolean(view.mediaId) && ((view.rightPanel === "camera" && view.cameraView === "album")
    || (view.rightPanel === "place" && view.placeTab === "photos"));
  const cameraDevice = view.rightPanel === "camera" && view.cameraView === "device";
  const cameraNested = view.rightPanel === "camera" && ["album", "settings", "device"].includes(view.cameraView);
  const cameraPreview = view.rightPanel === "camera" && !cameraNested;
  const clusterChild = view.clusterFrom && !mediaDetail
    && (view.rightPanel === "place" || view.rightPanel === "event" || Boolean(waypoint));
  const clusterTitle = adventureText(`附近地点 · ${view.cluster?.length ?? 0}`, `Nearby places · ${view.cluster?.length ?? 0}`, language);
  const title = (weatherSources ? adventureText("数据来源", "Data sources", language) : null)
    ?? (isWeather ? `${adventureText("天气", "Weather", language)} · ${weatherLocation ? adventureField(weatherLocation, "name", language) : view.weatherDate}` : null)
    ?? (view.rightPanel === "cluster" ? clusterTitle : null)
    ?? (mediaDetail ? adventureText("详情", "Details", language) : null)
    ?? (waypoint ? adventureField(waypoint, "name", language) : null)
    ?? (cameraDevice ? adventureText("设备信息", "Device information", language) : null)
    ?? event?.title ?? route?.label ?? calendarDay?.day.title ?? (stop ? adventureField(stop, "name", language) : null)
    ?? (bagNoteCategory && adventureField(bagNoteCategory, "title", language))
    ?? (bagBooking && adventureField(bagBooking, "listingName", language))
    ?? (cameraNested ? view.cameraView === "album" ? adventureText("相册", "Album", language) : adventureText("设置", "Settings", language) : null)
    ?? { bag: adventureText("背包", "Backpack", language), camera: adventureText("相机", "Camera", language),
      "map-sources": adventureText("地图数据来源", "Map data sources", language) }[view.rightPanel];
  const stayDate = compactStayDateRange(bagBooking);
  const date = isWeather ? view.weatherDate : mediaDetail ? null : event ? `${event.day.date} · ${event.day.weekday}`
    : route?.date ?? (calendarDay ? `${calendarDay.day.date} · ${calendarDay.day.weekday}` : null)
      ?? stayDate?.label ?? placePeriods ?? stop?.date;
  const DayIcon = dayIcon(calendarDay ?? (event ? { day: event.day, events: [event] } : null));
  const nested = isWeather || clusterChild || mediaDetail || waypoint || cameraNested || event || (calendarDay && view.dayFrom === "place")
    || ["bag-stay", "map-sources", "bag-note"].includes(view.rightPanel);
  const LeadingIcon = view.rightPanel === "place" ? placeIcons[stop?.tag] ?? CityIcon
    : view.rightPanel === "day" ? DayIcon ?? CalendarIcon
      : view.rightPanel === "route" ? RoutePathIcon
        : view.rightPanel === "bag" ? BagIcon : view.rightPanel === "camera" ? CameraIcon
          : view.rightPanel === "map-sources" ? MapSourcesIcon : view.rightPanel === "cluster" ? LocationMapIcon : CalendarIcon;
  const dayIndex = calendarDay ? calendarDays.findIndex(day => day.dateId === view.day) : -1;
  const previousDay = dayIndex > 0 ? calendarDays[dayIndex - 1] : null;
  const nextDay = dayIndex >= 0 && dayIndex < calendarDays.length - 1 ? calendarDays[dayIndex + 1] : null;
  const step = (delta) => navigate("place", adventureStops[(index + delta + adventureStops.length) % adventureStops.length].tag);
  const placeNavigation = stop && view.rightPanel === "place" && !mediaDetail;
  const compactNavigation = shortHeight && (calendarDay || placeNavigation);
  const paneActions = <>
    {compactNavigation && <>
      <button type="button" className="trip-route-header-action trip-panel-sequence-previous"
        disabled={Boolean(calendarDay && !previousDay)}
        aria-label={calendarDay ? adventureText("上一天", "Previous day", language) : adventureText("上一站", "Previous stop", language)}
        title={calendarDay ? previousDay ? `${adventureText("上一天", "Previous day", language)}: ${previousDay.day.date}`
          : adventureText("已是第一天", "First day", language) : adventureText("上一站", "Previous stop", language)}
        onClick={() => calendarDay ? previousDay && navigate(view.dayFrom === "place" ? "place-day" : "day", previousDay.dateId) : step(-1)}>
        <PreviousIcon />
      </button>
      <button type="button" className="trip-route-header-action trip-panel-sequence-next"
        disabled={Boolean(calendarDay && !nextDay)}
        aria-label={calendarDay ? adventureText("下一天", "Next day", language) : adventureText("下一站", "Next stop", language)}
        title={calendarDay ? nextDay ? `${adventureText("下一天", "Next day", language)}: ${nextDay.day.date}`
          : adventureText("已是最后一天", "Last day", language) : adventureText("下一站", "Next stop", language)}
        onClick={() => calendarDay ? nextDay && navigate(view.dayFrom === "place" ? "place-day" : "day", nextDay.dateId) : step(1)}>
        <NextIcon />
      </button>
    </>}
    <AdventurePaneActions fullscreen={fullscreen} automaticFullscreen={automaticFullscreen && view.rightPanel !== "camera"} onToggleFullscreen={onToggleFullscreen}
      onOpenMenu={onOpenMenu} onClose={() => navigate()} />
  </>;
  const cameraBackLabel = mediaDetail ? adventureText("返回相册", "Back to album", language)
    : cameraDevice ? adventureText("返回相机设置", "Back to camera settings", language)
      : adventureText("返回相机", "Back to camera", language);
  const stayBackLabel = view.stayFrom === "event" ? adventureText("返回行程", "Back to itinerary", language)
    : view.stayFrom === "place" ? adventureText("返回地点", "Back to place", language)
      : adventureText("返回背包", "Back to backpack", language);
  const weatherBackLabel = weatherSources ? adventureText("返回天气", "Back to weather", language)
    : adventureText("返回天气前的视图", "Back to previous view", language);
  const weatherScroll = useRef({ sources: false, top: 0, key: null });
  useLayoutEffect(() => {
    const body = panelRef.current?.querySelector('.trip-panel-body');
    const previous = weatherScroll.current;
    const key = isWeather ? `${view.weatherDate}|${view.weatherPlace ?? ''}` : null;
    if (body && key && key === previous.key && weatherSources !== previous.sources) {
      if (weatherSources) body.scrollTop = 0;
      else {
        body.scrollTop = previous.top;
        panelRef.current.querySelector('.trip-weather-sources-action')?.focus({ preventScroll: true });
      }
    }
    weatherScroll.current = { sources: weatherSources, top: key === previous.key ? previous.top : 0, key };
  }, [isWeather, weatherSources, view.weatherDate, view.weatherPlace]);
  const mediaAlbum = <AdventureMediaAlbum ref={mediaAlbumRef} placeTag={view.rightPanel === "place" ? stop?.tag : null}
    selectedId={view.mediaId} onSelect={id => navigate("media-select", id)} detailTab={view.mediaTab}
    onTabChange={tab => navigate("media-tab", tab)} />;
  return <aside {...props} ref={panelRef} id="trip-right-panel" className="trip-panel" data-short-height={shortHeight} aria-label={title}>
    <PencilSurface variant={fullscreen ? "full" : "sheet"} className={`trip-day${cameraPreview ? " trip-day--camera" : ""}`}>
      <header ref={closeButtonRef} className={`trip-panel-header${cameraPreview ? " trip-camera-header" : ""}${nested ? " trip-panel-header--nested" : ""}${route ? " trip-panel-header--route" : ""}${hasStayActions ? " trip-panel-header--stay-actions" : ""}${view.rightPanel === "bag-note" ? " trip-panel-header--bag-note" : ""}${view.rightPanel === "camera" || (view.rightPanel === "bag" && view.bagTab === "car") ? " trip-panel-header--multi-actions" : ""}`}>
        {cameraPreview ? <button type="button" className="trip-panel-leading trip-camera-settings-entry"
          data-icon-feedback="keyboard-only" aria-label={adventureText("相机设置", "Camera settings", language)}
          onClick={() => navigate("camera-view", "settings")}><CameraIcon themeBackdrop /></button>
          : nested ? <button type="button" className="trip-panel-leading trip-event-back"
          aria-label={isWeather ? weatherBackLabel : clusterChild ? adventureText("返回地点列表", "Back to locations", language) : waypoint ? adventureText("返回路线", "Back to route", language) : mediaDetail || cameraNested ? cameraBackLabel : view.rightPanel === "bag-note" ? adventureText("返回备忘", "Back to notes", language)
            : view.rightPanel === "bag-stay" ? stayBackLabel : view.rightPanel === "map-sources" ? adventureText("返回背包", "Back to backpack", language)
            : event ? adventureText("返回上一层行程", "Back to itinerary", language) : adventureText("返回地点日历", "Back to place calendar", language)}
          title={isWeather ? weatherBackLabel : clusterChild ? adventureText("返回地点列表", "Back to locations", language) : waypoint ? adventureText("返回路线", "Back to route", language) : mediaDetail || cameraNested ? cameraBackLabel : view.rightPanel === "bag-note" ? adventureText("返回备忘", "Back to notes", language)
            : view.rightPanel === "bag-stay" ? stayBackLabel : view.rightPanel === "map-sources" ? adventureText("返回背包", "Back to backpack", language)
            : event ? adventureText("返回上一层行程", "Back to itinerary", language) : adventureText("返回地点日历", "Back to place calendar", language)}
          onClick={() => isWeather ? navigate("back-weather") : clusterChild ? navigate("back-cluster") : waypoint ? navigate("back-waypoint") : mediaDetail ? navigate("media-select", null) : cameraNested ? navigate("camera-view", cameraDevice ? "settings" : "preview") : navigate(view.rightPanel === "bag-note" ? "back-bag-note"
            : view.rightPanel === "bag-stay" ? "back-stay" : view.rightPanel === "map-sources" ? "back-bag"
            : event ? "back-event" : "back-day")}><PreviousIcon /></button>
          : <span className="trip-panel-leading" aria-hidden="true"><LeadingIcon /></span>}
        <div className="trip-panel-heading">
          {weatherSources ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("天气路径", "Weather path", language)}>
            <button type="button" onClick={() => navigate("back-weather")}><PencilText>{adventureText("天气", "Weather", language)}</PencilText></button>
            <span aria-hidden="true">/</span>
            <h1 className="trip-panel-breadcrumb-current" aria-current="page"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : clusterChild ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("地点路径", "Location path", language)}>
            <button type="button" onClick={() => navigate("back-cluster")}><PencilText>{adventureText("附近地点", "Nearby places", language)}</PencilText></button>
            <span aria-hidden="true">/</span>
            <h1 className="trip-panel-breadcrumb-current" aria-current="page"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : waypoint ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("路线途经点路径", "Route waypoint path", language)}>
            <button type="button" onClick={() => navigate("back-waypoint")}><PencilText>{route.label}</PencilText></button>
            <span aria-hidden="true">›</span>
            <h1 className="trip-panel-breadcrumb-current" aria-current="page"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : mediaDetail && view.rightPanel === "place" ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("照片路径", "Photo path", language)}>
            <button type="button" onClick={() => navigate("place-tab", "calendar")}><PencilText>{adventureField(stop, "name", language)}</PencilText></button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => navigate("media-select", null)}><PencilText>{adventureText("照片", "Photos", language)}</PencilText></button>
            <span aria-hidden="true">/</span>
            <h1 className="trip-panel-breadcrumb-current" aria-current="page"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : cameraNested ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("相机路径", "Camera path", language)}>
            <button type="button" onClick={() => navigate("camera-view", "preview")}><PencilText>{adventureText("相机", "Camera", language)}</PencilText></button>
            <span aria-hidden="true">/</span>
            {(mediaDetail || cameraDevice) && <>
              <button type="button" onClick={() => navigate("camera-view", cameraDevice ? "settings" : "album")}><PencilText>{cameraDevice ? adventureText("设置", "Settings", language) : adventureText("相册", "Album", language)}</PencilText></button>
              <span aria-hidden="true">/</span>
            </>}
            <h1 className="trip-panel-breadcrumb-current" aria-current="page"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : bagNoteCategory ? <nav className="trip-panel-breadcrumb" aria-label={adventureText("背包路径", "Backpack path", language)}>
            <button type="button" onClick={() => navigate("bag-root")}><PencilText>{adventureText("背包", "Bag", language)}</PencilText></button>
            <span aria-hidden="true">›</span>
            <button type="button" onClick={() => navigate("back-bag-note")}><PencilText>{adventureText("备忘", "Notes", language)}</PencilText></button>
            <span aria-hidden="true">›</span>
            <h1 className="trip-panel-breadcrumb-current"><PencilText ellipsis>{title}</PencilText></h1>
          </nav> : <h1 className="trip-panel-heading-title"><PencilText ellipsis>{title}</PencilText></h1>}
          {route ? <div className="trip-route-header-meta" aria-label="路线摘要">
            <time dateTime={routeDateId ?? undefined} className="trip-route-header-meta-item" title={routeDateId ? `${routeDateId} 行程日期` : "行程日期"}>
              <span className="trip-panel-heading-icon"><CalendarIcon /></span><PencilText>{route.date}</PencilText>
            </time>
            <span className="trip-route-header-meta-item" title={route.transport === "flight" ? "航线示意，非实际飞行轨迹" : route.transport === "coach" ? "大巴往返，道路为单程汽车路网参考" : "自驾，公路参考路径"}>
              <RouteMetaSeparator />
              <span className="trip-panel-heading-icon"><RouteModeIcon /></span><PencilText>{routeModeLabel}</PencilText>
            </span>
            {routeDistance !== null &&
              <span className="trip-route-header-meta-item" title={routeDistanceTitle} aria-label={`约${routeDistance}公里，${routeDistanceTitle}`}>
                <RouteMetaSeparator />
                <span className="trip-panel-heading-icon"><RouteDistanceIcon /></span><PencilText>约{routeDistance}km</PencilText>
              </span>}
          </div> : date && <span className={`trip-panel-heading-date${stayDate ? " trip-panel-heading-date--stay" : ""}`}
            title={stayDate?.full} aria-label={stayDate?.full}><PencilText ellipsis={Boolean(stayDate)}>{date}</PencilText></span>}
        </div>
        {isWeather ? <div className="trip-panel-header-actions">
          {!weatherSources && <button type="button" className="trip-route-header-action trip-weather-sources-action"
            aria-label={adventureText("天气数据来源", "Weather data sources", language)}
            title={adventureText("天气数据来源", "Weather data sources", language)}
            onClick={() => navigate("weather-sources")}><MapSourcesIcon /></button>}
          {paneActions}
        </div> : mediaDetail ? <div className="trip-panel-header-actions">
          <button type="button" className="trip-route-header-action" onClick={() => mediaAlbumRef.current?.requestDelete()}
            aria-label={adventureText("删除媒体", "Delete media", language)}>
            <PencilIcon kind="delete"><path d="M7 9h18M12 9V5h8v4M9 10l1 17h12l1-17M13 13v10M19 13v10" /></PencilIcon>
          </button>
          {paneActions}
        </div> : event ? <div className="trip-panel-header-actions">
          <EventStayAction stays={eventStayChoices} language={language}
            onSelect={stay => navigate("bag-stay", stay)} />
          {paneActions}
        </div> : route ? <div className="trip-panel-header-actions">
          {hasRouteDay && <a className="trip-route-header-action" href={`${adventurePath}?day=${encodeURIComponent(routeDateId)}`} target="_blank" rel="noopener noreferrer"
            aria-label={`在新标签页查看${route.date}完整日程`} title="在新标签页查看完整日程"><CalendarIcon /></a>}
          {isRoadRoute && <a className="trip-route-header-action" href={routeDirectionsUrl(route)} target="_blank" rel="noreferrer"
            aria-label={`在 Google 地图打开${route.label}驾车导航（新窗口）`} title="在 Google 地图打开驾车导航（新窗口）"><DirectionsIcon /></a>}
          {paneActions}
        </div> : view.rightPanel === "camera" ? <div className={`trip-panel-header-actions${cameraPreview ? " trip-camera-header-actions" : ""}`}>
          {view.cameraView === "album" && <AdventureMediaArchiveActions />}
          {view.cameraView === "settings" && <button type="button" className="trip-route-header-action"
            aria-label={adventureText("设备信息", "Device information", language)}
            onClick={() => navigate("camera-view", "device")}>
            <PencilIcon kind="device"><path d="M8 5.5h16v21H8zM12 9h8M13 23h6" /></PencilIcon>
          </button>}
          {cameraPreview ? <>
            <button type="button" className="trip-route-header-action trip-pane-expand"
              data-icon-feedback="keyboard-only"
              aria-label={fullscreen ? adventureText("退出全屏", "Exit full screen", language) : adventureText("全屏相机", "Expand camera", language)}
              aria-pressed={fullscreen} onClick={onToggleFullscreen}>
              {fullscreen ? <FullscreenExitIcon themeBackdrop /> : <FullscreenIcon themeBackdrop />}
            </button>
            <button type="button" className="trip-close trip-adventure-calendar-close"
              data-icon-feedback="keyboard-only" aria-label={adventureText("关闭面板", "Close panel", language)}
              onClick={() => navigate()}><CloseIcon themeBackdrop /></button>
          </> : paneActions}
        </div> : view.rightPanel === "bag" ? <div className="trip-panel-header-actions">
          <button type="button" className="trip-route-header-action" aria-label={adventureText("地图数据来源", "Map data sources", language)}
            title={adventureText("地图数据来源", "Map data sources", language)} onClick={() => navigate("bag-sources")}><MapSourcesIcon /></button>
          {view.bagTab === "car" && <a className="trip-route-header-action" href={budgetManageUrl} target="_blank" rel="noopener noreferrer"
            aria-label={adventureText("在新标签页管理 Budget 订单", "Manage Budget booking in a new tab", language)}
            title={adventureText("管理 Budget 订单", "Manage Budget booking", language)}><OrderIcon /></a>}
          {paneActions}
        </div> : hasStayActions ? <div className="trip-panel-header-actions trip-panel-header-actions--stay">
          {activePropertyHref && <a className="trip-stay-header-action" href={activePropertyHref} target="_blank" rel="noopener noreferrer"
            aria-label={`在新标签页${stayLink.label || "查看原房源"}`} title="在新标签页查看原房源"><ExternalLinkIcon /></a>}
          {activeMapHref && <a className="trip-stay-header-action" href={activeMapHref} target="_blank" rel="noopener noreferrer"
            aria-label="在新标签页用 Google 地图查看酒店位置" title="在新标签页用 Google 地图查看酒店位置"><LocationMapIcon /></a>}
          {paneActions}
        </div> : <div className="trip-panel-header-actions">{paneActions}</div>}
        {!cameraPreview && <PanelDivider />}
      </header>
      <div className={`trip-panel-body${calendarDay ? " trip-panel-body--day" : ""}${event ? " trip-panel-body--event" : ""}${["place", "bag", "bag-stay", "bag-note", "camera"].includes(view.rightPanel) ? " trip-panel-body--place" : ""}`}
        onScroll={isWeather && !weatherSources ? event => { weatherScroll.current.top = event.currentTarget.scrollTop; } : undefined}>
        {isWeather && <AdventureWeather key={`${view.weatherDate}|${view.weatherPlace ?? ""}`} dateId={view.weatherDate}
          placeTag={view.weatherPlace} active={weatherActive} sources={weatherSources} />}
        {view.rightPanel === "cluster" && <AdventureClusterDetails keys={view.cluster ?? []} language={language}
          onSelect={key => navigate("cluster-member", key)} />}
        {route && (waypoint ? <AdventureWaypointDetails waypoint={waypoint} route={route} language={language} />
          : <AdventureRouteDetails route={route} navigate={navigate} />)}
        {view.rightPanel === "day" && <AdventureDayDetails dateId={view.day}
          onSelectEvent={(selectedEvent, agendaItem) => navigate("event", { event: selectedEvent, agendaItem })} />}
        {event && <AdventureEventDetails eventId={view.eventId} tab={view.eventTab} agendaId={view.eventAgenda}
          onTabChange={tab => navigate("event-tab", tab)} onSelectAgenda={item => navigate("event-agenda", item.id)} />}
        {stop && view.rightPanel === "place" && !mediaDetail && <>
          <AdventurePlaceTabs stop={stop} selectedTab={view.placeTab} onTabChange={tab => navigate("place-tab", tab)}
            onSelectMedia={id => navigate("media-select", id)}
            onRequestCapture={() => navigate("camera")}
            selectedDate={view.placeDate} onDateChange={dateId => navigate("place-date", dateId)}
            onStayLinkChange={onStayLinkChange}
            onRequestUnlock={onRequestUnlock}
            onSelectStay={selection => navigate("bag-stay", selection)}
            onSelectDay={dateId => navigate("place-day", dateId)}
            weatherActive={weatherActive} onSelectWeather={dateId => navigate("weather", dateId, "place")}
            onSelectEvent={(selectedEvent, agendaItem) => navigate("event", { event: selectedEvent, agendaItem })} />
        </>}
        {view.rightPanel === "bag" && <AdventureBag selectedTab={view.bagTab}
          onTabChange={tab => navigate("bag-tab", tab)} selectedDate={view.bagDate}
          onDateChange={dateId => navigate("bag-date", dateId)}
          onSelectStay={selection => navigate("bag-stay", selection)} onRequestUnlock={onRequestUnlock}
          onSelectNoteCategory={categoryId => navigate("bag-note", categoryId)} />}
        {bagNoteCategory && <AdventureBagNoteCategory categoryId={bagNoteCategory.id} />}
        {bagBooking && bagPlace && <AdventureStayDetails booking={bagBooking}
          placeName={adventureField(bagPlace, "name", language)} placeTag={bagPlace.tag}
          onStayLinkChange={onStayLinkChange} onRequestUnlock={onRequestUnlock} />}
        {view.rightPanel === "map-sources" && <MapSources />}
        {cameraPreview && <AdventureCamera active={cameraActive} onOpenAlbum={() => navigate("camera-view", "album")} />}
        {(mediaDetail || (view.rightPanel === "camera" && view.cameraView === "album")) && mediaAlbum}
        {view.rightPanel === "camera" && ["settings", "device"].includes(view.cameraView)
          && <AdventureCameraSettings view={view.cameraView} />}
      </div>
      {calendarDay && !shortHeight && <footer className="trip-panel-footer trip-day-footer">
        <div className="trip-panel-footer-divider"><PanelDivider /></div>
        <PencilSurface as="button" variant="quiet" disabled={!previousDay} aria-label="上一天"
          title={previousDay ? `上一天：${previousDay.day.date}` : "已是第一天"}
          onClick={() => previousDay && navigate(view.dayFrom === "place" ? "place-day" : "day", previousDay.dateId)}><PreviousIcon /></PencilSurface>
        <span><PencilText>{calendarDay.day.date}</PencilText></span>
        <PencilSurface as="button" variant="quiet" disabled={!nextDay} aria-label="下一天"
          title={nextDay ? `下一天：${nextDay.day.date}` : "已是最后一天"}
          onClick={() => nextDay && navigate(view.dayFrom === "place" ? "place-day" : "day", nextDay.dateId)}><NextIcon /></PencilSurface>
      </footer>}
      {placeNavigation && !shortHeight && <footer className="trip-panel-footer trip-place-footer">
        <div className="trip-panel-footer-divider"><PanelDivider /></div>
        <div className="trip-card-actions">
          <PencilSurface as="button" variant="quiet" className="trip-prev" aria-label="上一站" onClick={() => step(-1)}><PreviousIcon /></PencilSurface>
          <PencilSurface as="button" variant="quiet" className="trip-next" aria-label="下一站" onClick={() => step(1)}><NextIcon /></PencilSurface>
        </div>
      </footer>}
    </PencilSurface>
  </aside>;
}
