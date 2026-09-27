import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { usePrivateVault } from "../PrivateVaultContext";
import { aucklandCityHotels } from "../data/aucklandCityHotels";
import { confirmedStayMedia } from "../data/confirmedStayMedia";
import { regionalHotels } from "../data/regionalHotels";
import { attractionPinsByRegion } from "../components/HotelComparisonDialog";
import { AdventurePencilTabs } from "./AdventureCalendar";
import { GoogleMapIcon, HotelIcon, LocationMapIcon, LockIcon, NextIcon, OrderIcon, PhotosIcon, PreviousIcon } from "./SketchIcons";
import { PanelDivider } from "./pencil/PanelDivider";
import { adventureStayName } from "./adventureStayName";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureStayDetails.css";

const stayRegion = {
  "hotel-queenstown": "queenstown",
  "hotel-wanaka": "wanaka",
  "mount-cook": "mount-cook",
  "hotel-oamaru": "oamaru",
  "hotel-christchurch": "christchurch",
  "hotel-auckland-city": "auckland-city",
};

function hotelFor(booking) {
  const region = stayRegion[booking.bookingId];
  const hotels = region === "auckland-city" ? aucklandCityHotels : regionalHotels[region] ?? [];
  return hotels.find((hotel) => hotel.id === booking.hotelId) ?? null;
}

function uniqueImages(booking, hotel, privateStay) {
  const images = [
    ...(confirmedStayMedia[booking.bookingId] ?? []),
    ...(Array.isArray(privateStay?.media) ? privateStay.media : []),
    ...(hotel?.hotelImages ?? []),
    ...(hotel?.roomTypes?.flatMap((room) => room.images ?? []) ?? []),
  ];
  const seen = new Set();
  return images.filter((image) => {
    if (!image?.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

function mapUrl(query) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query);
  return url.toString();
}

function FactSection({ title, primary, additional = [] }) {
  if (!primary.length && !additional.length) return null;
  const facts = [...primary, ...additional];
  return <section className="trip-stay-section" aria-label={title}>
    <dl>{facts.map(([label, value, href]) => <div key={label}>
      <dt><PencilText>{label}</PencilText></dt>
      <dd>{href ? <a href={href} target="_blank" rel="noreferrer"><PencilText>{String(value)}</PencilText></a>
        : <PencilText>{String(value)}</PencilText>}</dd>
    </div>)}</dl>
  </section>;
}

function Gallery({ images, title, language }) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];
  if (!active) return null;
  const move = (delta) => setIndex((value) => (value + delta + images.length) % images.length);
  return <section className="trip-stay-gallery" aria-label={language === "en" ? `${title} photos` : `${title}照片`} aria-roledescription="carousel">
    <figure>
      <a href={active.src} target="_blank" rel="noreferrer" title={language === "en" ? "Open original image" : "打开原图"}>
        <img src={active.src} alt={active.label ?? (language === "en" ? `${title} photo ${index + 1}` : `${title}照片 ${index + 1}`)} loading="lazy" decoding="async" />
      </a>
      {images.length > 1 && <div className="trip-stay-gallery-controls">
        <PencilSurface as="button" variant="action" seed={931} aria-label={language === "en" ? "Previous photo" : "上一张照片"}
          title={language === "en" ? "Previous photo" : "上一张照片"} onClick={() => move(-1)}><PreviousIcon /></PencilSurface>
        <PencilSurface as="span" variant="action" seed={939} className="trip-stay-gallery-count"
          role="status" aria-live="polite" aria-label={language === "en" ? `Photo ${index + 1} of ${images.length}` : `第 ${index + 1} 张，共 ${images.length} 张`}>
          <PencilText>{`${index + 1}/${images.length}`}</PencilText>
        </PencilSurface>
        <PencilSurface as="button" variant="action" seed={947} aria-label={language === "en" ? "Next photo" : "下一张照片"}
          title={language === "en" ? "Next photo" : "下一张照片"} onClick={() => move(1)}><NextIcon /></PencilSurface>
      </div>}
      {(active.sourceUrl || active.sourceName) && <div className="trip-stay-gallery-credit">
        <PencilSurface as={active.sourceUrl ? "a" : "span"} variant="badge" seed={953}
          {...(active.sourceUrl ? { href: active.sourceUrl, target: "_blank", rel: "noreferrer" } : {})}>
          <PencilText>{active.sourceName ?? (language === "en" ? "Photo source" : "照片来源")}</PencilText>
        </PencilSurface>
      </div>}
    </figure>
  </section>;
}

export function AdventureStayDetails({ booking, placeName, placeTag, onStayLinkChange, onRequestUnlock }) {
  const { language } = useLanguage();
  const vault = usePrivateVault();
  const privateStay = vault.isUnlocked ? vault.data?.accommodations?.[booking.bookingId] : null;
  const hotel = hotelFor(booking);
  const title = adventureStayName(booking, privateStay, language);
  const images = uniqueImages(booking, hotel, privateStay);
  const region = stayRegion[booking.bookingId];
  const nearby = attractionPinsByRegion[region] ?? [];
  const mapQuery = privateStay?.["准确地址"] ?? privateStay?.address ?? hotel?.mapQuery ?? booking.mapQuery ?? `${placeName}, New Zealand`;
  const mapHref = mapUrl(mapQuery);
  const propertyUrl = privateStay?.propertyUrl ?? hotel?.officialUrl ?? hotel?.bookingUrl;
  const rootRef = useRef(null);
  const [activeTab, setActiveTab] = useState("stay");
  const [layout, setLayout] = useState("tall");
  const linkChangeRef = useRef(onStayLinkChange);
  linkChangeRef.current = onStayLinkChange;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const update = () => {
      const { width, height } = root.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const next = height < 420 ? width >= 640 && images.length ? "wide-short" : "narrow-short" : "tall";
      setLayout((current) => current === next ? current : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    update();
    return () => observer.disconnect();
  }, [booking.bookingId, images.length]);
  useEffect(() => {
    linkChangeRef.current?.(propertyUrl || mapHref ? {
      placeTag, bookingId: booking.bookingId,
      href: propertyUrl ?? null, label: "查看原房源",
      mapHref, mapLabel: "在 Google 地图查看位置",
    } : null);
    return () => linkChangeRef.current?.(null);
  }, [booking.bookingId, placeTag, propertyUrl, mapHref, vault.isUnlocked]);
  const stayPrimary = [
    [language === "en" ? "Place" : "地点", placeName, mapUrl(mapQuery)],
    [language === "en" ? "Dates" : "日期", `${booking.checkIn} — ${booking.checkOut}`],
    booking.checkInTime && booking.checkOutTime && [language === "en" ? "Check-in / out" : "入住 / 退房", `${language === "en" ? booking.checkInTimeEn ?? booking.checkInTime : booking.checkInTime} / ${language === "en" ? booking.checkOutTimeEn ?? booking.checkOutTime : booking.checkOutTime}`],
  ].filter(Boolean);
  const stayAdditional = [
    booking.guests && [language === "en" ? "Guests" : "同行者", language === "en" ? booking.guestsEn ?? booking.guests : booking.guests],
    privateStay?.["房东"] && ["房东", privateStay["房东"]],
    privateStay?.["准确地址"] && ["准确地址", privateStay["准确地址"], mapUrl(privateStay["准确地址"])],
    ...[["预计抵达", "预计抵达"], ["住宿联系电话", "住宿联系电话"], ["入住方式", "入住方式"],
      ["入户", "入户"], ["行车与停车", "行车与停车"], ["行车说明（截图可见部分）", "行车说明"]]
      .map(([key, label]) => privateStay?.[key] && [label, privateStay[key]]),
  ].filter(Boolean);
  const bookingPrimary = [
    privateStay?.["确认码"] && ["确认码", privateStay["确认码"]],
    (privateStay?.["订单总额"] || booking.total) && [language === "en" ? "Verified total" : "已核验总价", privateStay?.["订单总额"] ?? (language === "en" ? booking.totalEn ?? booking.total : booking.total)],
    booking.cancellation && [language === "en" ? "Cancellation" : "取消政策", language === "en" ? booking.cancellationEn ?? booking.cancellation : booking.cancellation],
  ].filter(Boolean);
  const bookingAdditional = [
    privateStay?.["订单确认号"] && ["订单确认号", privateStay["订单确认号"]],
    booking.payment && [language === "en" ? "Payment" : "付款", language === "en" ? booking.paymentEn ?? booking.payment : booking.payment],
    booking.breakfast && [language === "en" ? "Breakfast" : "早餐", language === "en" ? booking.breakfastEn ?? booking.breakfast : booking.breakfast],
    ...[["PIN 码", "PIN 码"], ["付款提醒", "付款提醒"]]
      .map(([key, label]) => privateStay?.[key] && [label, privateStay[key]]),
  ].filter(Boolean);
  const hasPolicy = Boolean(bookingPrimary.length || bookingAdditional.length);
  const tabs = [["stay", language === "en" ? "Stay" : "入住"]];
  if (hasPolicy) tabs.push(["policy", language === "en" ? "Booking & policy" : "预订与政策"]);
  tabs.push(["location", language === "en" ? "Location" : "位置与附近"]);
  const shortTabs = [
    ["stay", language === "en" ? "Stay" : "入住", HotelIcon],
    ...(layout === "narrow-short" && images.length ? [["photos", language === "en" ? "Photos" : "照片", PhotosIcon]] : []),
    ...(hasPolicy ? [["policy", language === "en" ? "Booking & policy" : "预订与政策", OrderIcon]] : []),
    ["location", language === "en" ? "Location and nearby" : "位置与附近", LocationMapIcon],
  ];
  const availableTabs = layout === "tall" ? tabs : shortTabs;
  const currentTab = availableTabs.some(([id]) => id === activeTab) ? activeTab : "stay";
  const panelId = `trip-stay-${booking.bookingId}-panel`;
  const shortTabRefs = useRef([]);

  useEffect(() => {
    if (activeTab !== currentTab) setActiveTab(currentTab);
  }, [activeTab, currentTab]);

  const onShortTabKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % shortTabs.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + shortTabs.length - 1) % shortTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = shortTabs.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(shortTabs[next][0]);
    shortTabRefs.current[next]?.focus();
  };

  const vaultPrompt = !vault.isUnlocked && vault.isConfigured && <div className="trip-stay-vault-prompt">
    <span className="trip-stay-vault-icon" aria-hidden="true"><LockIcon /></span>
    <PencilSurface as="button" variant="action" onClick={() => onRequestUnlock?.()}
      disabled={!onRequestUnlock} aria-label={language === "en" ? "Unlock vault" : "解锁保险箱"}><PencilText>{language === "en" ? "Unlock vault" : "解锁保险箱"}</PencilText></PencilSurface>
  </div>;
  const tabContent = <>
    {currentTab === "stay" && <FactSection title={language === "en" ? "Stay" : "入住"} primary={stayPrimary} additional={stayAdditional} />}
    {currentTab === "photos" && <Gallery key={`${booking.bookingId}-tab`} images={images} title={title} language={language} />}
    {currentTab === "policy" && <FactSection title={language === "en" ? "Booking & policy" : "预订与政策"} primary={bookingPrimary} additional={bookingAdditional} />}
    {currentTab === "location" && <section className="trip-stay-section trip-stay-location" aria-label={language === "en" ? "Location and nearby" : "位置与附近"}>
      <p className="trip-stay-location-name"><PencilText>{mapQuery}</PencilText></p>
      {nearby.length > 0 && <ul>{nearby.map((place) => <li key={place.label}>
        <a href={mapUrl(place.labelEn ?? place.label)} target="_blank" rel="noreferrer">
          <span className="trip-stay-location-icon" aria-hidden="true"><GoogleMapIcon /></span>
          <PencilText>{language === "en" ? place.labelEn ?? place.label : place.label}</PencilText>
        </a>
      </li>)}</ul>}
    </section>}
    {currentTab !== "photos" && vaultPrompt}
  </>;

  return <article ref={rootRef} className="trip-stay-detail" data-stay-layout={layout}>
    <h3 className="trip-stay-title"><PencilText>{title}</PencilText></h3>
    {(layout === "tall" || layout === "wide-short") && <Gallery key={booking.bookingId} images={images} title={title} language={language} />}
    {layout === "tall" && <div className="trip-stay-tab-frame">
      <div className="trip-stay-tab-scroll"><AdventurePencilTabs items={tabs} value={currentTab}
        onChange={setActiveTab} ariaLabel={language === "en" ? `${title} details` : `${title}详情`} idPrefix={`trip-stay-${booking.bookingId}`}
        controlsId={panelId} withInk /></div>
      <div className="trip-stay-tab-divider"><PanelDivider /></div>
    </div>}
    {layout === "tall" ? <div className="trip-stay-content" role="tabpanel" id={panelId}
      aria-labelledby={`trip-stay-${booking.bookingId}-tab-${currentTab}`} tabIndex={0}>{tabContent}</div>
      : <div className="trip-stay-short-workspace">
        <div className="trip-stay-content trip-stay-short-content" role="tabpanel" id={panelId}
          aria-labelledby={`trip-stay-${booking.bookingId}-short-tab-${currentTab}`} tabIndex={0}>{tabContent}</div>
        <nav className="trip-stay-short-tabs" role="tablist" aria-orientation="vertical"
          aria-label={language === "en" ? `${title} details` : `${title}详情`}>
          {shortTabs.map(([id, label, Icon], index) => <PencilSurface key={id} as="button"
            variant={currentTab === id ? "action" : "quiet"} seed={1061 + index * 17}
            className="trip-stay-short-tab" role="tab"
            ref={(element) => { shortTabRefs.current[index] = element; }}
            id={`trip-stay-${booking.bookingId}-short-tab-${id}`}
            aria-label={label} title={label} aria-selected={currentTab === id} aria-controls={panelId}
            tabIndex={currentTab === id ? 0 : -1} onClick={() => setActiveTab(id)}
            onKeyDown={(event) => onShortTabKeyDown(event, index)}><Icon /></PencilSurface>)}
        </nav>
      </div>}
  </article>;
}
