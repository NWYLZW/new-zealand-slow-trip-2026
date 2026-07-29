import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, Paper, Snackbar, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceIcon from "@mui/icons-material/Place";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { agodaUrlForStay, aucklandAirportHotels, aucklandAirportOvernightGuides, bookingUrlForStay, officialUrlForStay } from "../data/aucklandAirportHotels";
import "./HotelComparisonDialog.css";

const airportPosition = [-37.0082, 174.785];
const defaultComparison = {
  title: "奥克兰机场住宿比选",
  titleEn: "Auckland Airport stay comparison",
  mapLabel: "奥克兰机场住宿位置地图",
  mapLabelEn: "Auckland Airport stay locations",
  anchorPosition: airportPosition,
  anchorLabel: "奥克兰机场",
  anchorLabelEn: "Auckland Airport",
  anchorIcon: "✈",
};
const nzdToCny = 3.9198;
const galleryPhotoParam = "photo";
const galleryIndexParam = "photoIndex";

function currencyLabel(nzd) {
  if (nzd == null) return null;
  const nzdLabel = Number.isInteger(nzd) ? nzd : nzd.toFixed(2);
  return `NZD ${nzdLabel} · 约 ¥${Math.round(nzd * nzdToCny).toLocaleString("zh-CN")}`;
}

function stayNightCount(checkIn, checkOut) {
  const milliseconds = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.max(1, Math.round(milliseconds / 86400000));
}

function platformUrl(hotel, platform) {
  if (platform === "Booking.com") return hotel.bookingStayUrl;
  if (platform === "Agoda") return hotel.agodaStayUrl;
  if (platform === "Airbnb") return hotel.stayUrl;
  if (platform === "Google") return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.mapQuery)}`;
  return null;
}

function directionsUrl(hotel, attraction) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", attraction.originQuery ?? hotel.mapQuery);
  url.searchParams.set("destination", attraction.destinationQuery ?? attraction.name);
  url.searchParams.set("travelmode", attraction.travelMode ?? "driving");
  return url.toString();
}

function officialStatusPresentation(hotel, isEnglish) {
  if (hotel.isAirbnb && hotel.isVerifiedListing) {
    return {
      tone: "is-verified",
      title: isEnglish ? "Airbnb official listing verified" : "Airbnb 官方房源已核验",
      roomLabel: isEnglish ? "Airbnb official listing" : "Airbnb 官方房源",
      roomNote: isEnglish ? "See the verified listing total above." : "精确日期房源总价见上方核验结果。",
      linkLabel: isEnglish ? "Open verified Airbnb listing" : "打开已核验 Airbnb 房源",
    };
  }

  const presentations = {
    "needs-recheck": {
      tone: "",
      title: isEnglish ? "Dates changed · recheck official price" : "行程日期已变 · 官网价格待复核",
      roomLabel: isEnglish ? "Official website · recheck required" : "官网入口 · 需重新核价",
      roomNote: isEnglish
        ? "The previous quote was for the old stay dates and must not be used for this itinerary."
        : "旧报价对应原住宿日期，不能用于当前行程。",
      linkLabel: isEnglish ? "Open official website to recheck" : "打开官网重新核价",
    },
    "exact-rate-verified": {
      tone: "is-verified",
      title: isEnglish ? "Official exact-date rates verified" : "官网精确日期已核验",
      roomLabel: isEnglish ? "Official website · checked" : "官网 · 已核验",
      roomNote: isEnglish
        ? "This room was not reliably matched to an official exact-date rate; see the hotel-level verification above."
        : "该房型未可靠映射到官网精确日期价；完整核验说明见上方。",
      linkLabel: isEnglish ? "Open verified official rates" : "打开已核验官网价",
    },
    "exact-date-unavailable": {
      tone: "is-unavailable",
      title: isEnglish ? "Official website · unavailable for these dates" : "官网 · 指定日期无房",
      roomLabel: isEnglish ? "Official website · no availability" : "官网 · 指定日期无房",
      roomNote: isEnglish
        ? "No direct inventory for the selected stay; platform inventory is shown separately."
        : "官网无本次日期库存；平台库存单独显示。",
      linkLabel: isEnglish ? "Recheck official availability" : "重新检查官网库存",
    },
    "official-unreachable": {
      tone: "is-unreachable",
      title: isEnglish ? "Official website · unreachable" : "官网无法访问",
      roomLabel: isEnglish ? "Official website · unreachable" : "官网无法访问",
      roomNote: isEnglish
        ? "The official exact-date inventory and price could not be obtained; platform inventory is shown separately."
        : "无法取得本次日期官网库存与价格；平台库存单独显示。",
      linkLabel: isEnglish ? "Retry official website" : "重试打开官网",
    },
    "official-inquiry-only": {
      tone: "is-unavailable",
      title: isEnglish ? "Official website · enquiry only" : "官网 · 仅支持询价",
      roomLabel: isEnglish ? "Official website · enquiry only" : "官网 · 仅支持询价",
      roomNote: isEnglish
        ? "The direct site confirms the room but does not expose reproducible exact-date online rates; verified platform rates are shown separately."
        : "官网确认了房型，但没有可复现的精确日期在线价；已核验的平台报价单独显示。",
      linkLabel: isEnglish ? "Open official room information" : "打开官网房型信息",
    },
    "no-independent-official-found": {
      tone: "is-unreachable",
      title: isEnglish ? "No independent official booking site found" : "未找到独立官网直订",
      roomLabel: isEnglish ? "No independent official rate" : "无独立官网报价",
      roomNote: isEnglish
        ? "No independently controlled direct site was verified; the checked platform rate is shown separately."
        : "未核验到由经营方独立控制的直订网站；已实查的平台报价单独显示。",
      linkLabel: isEnglish ? "Open checked platform listing" : "打开已核验平台房源",
    },
  };

  const presentation = presentations[hotel.officialStatus] ?? {
    tone: "",
    title: isEnglish ? "Official price verification pending" : "官网价格待核验",
    roomLabel: isEnglish ? "Official website · verification pending" : "官网入口 · 待核验",
    roomNote: isEnglish
      ? "No reproducible exact-date total has been verified for this room."
      : "该房型尚无可复现的官网精确日期含税价。",
    linkLabel: isEnglish ? "Open official website" : "打开官网",
  };

  return {
    ...presentation,
    linkLabel: isEnglish
      ? (hotel.officialLinkLabelEn ?? presentation.linkLabel)
      : (hotel.officialLinkLabel ?? presentation.linkLabel),
  };
}

function gallerySourceForHotel(hotel, identity, isEnglish) {
  if (!hotel || !identity) return null;
  if (identity === "hotel") {
    return hotel.hotelImages?.length > 0
      ? { images: hotel.hotelImages, title: isEnglish ? "Hotel photos" : "酒店图片" }
      : null;
  }
  if (!identity.startsWith("room:")) return null;

  const roomIdentity = identity.slice("room:".length);
  const room = hotel.roomTypes?.find((candidate, index) => String(candidate.rateKey ?? index) === roomIdentity);
  const images = room?.photosVerified === true ? (room.images ?? []) : [];
  return room && images.length > 0 ? { images, title: room.name } : null;
}

function normalizedGalleryIndex(rawIndex, imageCount) {
  if (!/^\d+$/.test(rawIndex ?? "")) return 0;
  const index = Number(rawIndex);
  return Number.isSafeInteger(index) && index < imageCount ? index : 0;
}

function writeGalleryUrl(identity, index = 0, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (identity) {
    url.searchParams.set(galleryPhotoParam, identity);
    url.searchParams.set(galleryIndexParam, String(index));
  } else {
    url.searchParams.delete(galleryPhotoParam);
    url.searchParams.delete(galleryIndexParam);
  }
  history[method](state, "", url);
}

function FitHotelMap({ anchorPosition, hotels }) {
  const map = useMap();
  const signature = hotels.map((hotel) => hotel.position.join(",")).join("|");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.fitBounds(latLngBounds([anchorPosition, ...hotels.map((hotel) => hotel.position)]), {
        padding: [42, 42],
        maxZoom: 15,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [anchorPosition, map, signature]);

  return null;
}

function comparisonMapIcon(label, type, selected = false) {
  return divIcon({
    className: "hotel-comparison-map-icon-wrap",
    html: `<span class="hotel-comparison-map-icon ${type}${selected ? " is-selected" : ""}">${label}</span>`,
    iconAnchor: [18, 18],
    iconSize: [36, 36],
  });
}

function HotelComparisonMap({ activeHotelId, comparison, hotels, isEnglish, onHotelChange }) {
  const anchorPosition = comparison.anchorPosition ?? airportPosition;
  return (
    <Box className="hotel-comparison-map-wrap">
      <MapContainer
        aria-label={isEnglish ? comparison.mapLabelEn : comparison.mapLabel}
        center={anchorPosition}
        className="hotel-comparison-map"
        scrollWheelZoom
        zoom={14}
        zoomControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker icon={comparisonMapIcon(comparison.anchorIcon ?? "◎", "airport")} position={anchorPosition}>
          <Tooltip direction="top" offset={[0, -18]} permanent>
            {isEnglish ? comparison.anchorLabelEn : comparison.anchorLabel}
          </Tooltip>
        </Marker>
        {hotels.map((hotel, index) => {
          const selected = hotel.id === activeHotelId;
          return (
            <Marker
              eventHandlers={{ click: () => onHotelChange(hotel.id) }}
              icon={comparisonMapIcon(String(index + 1), "hotel", selected)}
              key={hotel.id}
              position={hotel.position}
              zIndexOffset={selected ? 500 : 0}
            >
              <Tooltip direction="top" offset={[0, -18]} permanent={selected}>
                {hotel.name}
              </Tooltip>
            </Marker>
          );
        })}
        <FitHotelMap anchorPosition={anchorPosition} hotels={hotels} />
      </MapContainer>
      <Box className="hotel-comparison-map-caption">
        <Typography fontWeight={900}>{isEnglish ? "Location overview" : "位置总览"}</Typography>
        <Typography color="text.secondary">
          {isEnglish ? "Select a numbered marker to switch the hotel tab below." : "点击带编号的酒店标记，可同步切换下方酒店标签。"}
        </Typography>
      </Box>
    </Box>
  );
}

export function HotelComparisonDialog({ activeHotelId, comparison = defaultComparison, hotels = aucklandAirportHotels, isEnglish, onActiveHotelChange, onClose, onSelect, open, selectedHotelId, stay }) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const visibleHotels = useMemo(() => hotels.filter((hotel) => !hotel.excludedByPreference && (!hotel.isAirbnb || hotel.isVerifiedListing)), [hotels]);
  const [gallery, setGallery] = useState(null);
  const [hotelSlideIndex, setHotelSlideIndex] = useState(0);
  const [copyResult, setCopyResult] = useState(null);
  const dates = stay ?? comparison.dates ?? { checkIn: "2026-09-28", checkOut: "2026-09-29", label: "9月28日—29日" };
  const nights = stayNightCount(dates.checkIn, dates.checkOut);
  const cards = useMemo(() => visibleHotels.map((hotel) => ({
    ...hotel,
    bookingStayUrl: hotel.bookingUrl ? bookingUrlForStay(hotel, dates.checkIn, dates.checkOut) : null,
    agodaStayUrl: hotel.agodaUrl ? agodaUrlForStay(hotel, dates.checkIn, dates.checkOut) : null,
    officialStayUrl: officialUrlForStay(hotel, dates.checkIn, dates.checkOut),
    stayUrl: officialUrlForStay(hotel, dates.checkIn, dates.checkOut),
    currentRate: hotel.rateSnapshots?.[`${dates.checkIn}/${dates.checkOut}`] ?? null,
  })), [dates.checkIn, dates.checkOut, visibleHotels]);
  const activeHotel = cards.find((hotel) => hotel.id === activeHotelId)
    ?? cards.find((hotel) => hotel.id === selectedHotelId)
    ?? cards[0];
  const destinationResearch = cards.find((hotel) => hotel.research)?.research;
  const galleryImages = gallery?.images ?? [];
  const galleryIndex = gallery?.index ?? 0;
  const galleryImage = galleryImages[galleryIndex] ?? null;

  const selectGalleryImage = (index) => {
    if (!gallery || index < 0 || index >= gallery.images.length) return;
    setGallery({ ...gallery, index });
    if (gallery.identity === "hotel") setHotelSlideIndex(index);
    writeGalleryUrl(gallery.identity, index);
  };
  const openGallery = (identity, images, index, title) => {
    const normalizedIndex = normalizedGalleryIndex(String(index), images.length);
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    setGallery({ identity, images, index: normalizedIndex, title });
    writeGalleryUrl(identity, normalizedIndex, "pushState", { ...currentState, hotelPhoto: true });
  };
  const closeGallery = () => {
    setGallery(null);
    if (history.state?.hotelPhoto) {
      history.back();
      return;
    }
    writeGalleryUrl(null);
  };
  const showPreviousImage = () => selectGalleryImage((galleryIndex - 1 + galleryImages.length) % galleryImages.length);
  const showNextImage = () => selectGalleryImage((galleryIndex + 1) % galleryImages.length);
  const copyHotelName = async (hotelName) => {
    try {
      await navigator.clipboard.writeText(hotelName);
      setCopyResult({ name: hotelName, ok: true });
    } catch {
      setCopyResult({ name: hotelName, ok: false });
    }
  };

  useEffect(() => {
    if (open) {
      setHotelSlideIndex(0);
      setCopyResult(null);
    } else {
      setGallery(null);
    }
  }, [open]);

  useEffect(() => {
    setHotelSlideIndex(0);
  }, [activeHotel?.id]);

  useEffect(() => {
    const syncGalleryFromUrl = () => {
      const url = new URL(window.location.href);
      const hasGalleryParams = url.searchParams.has(galleryPhotoParam) || url.searchParams.has(galleryIndexParam);
      if (!hasGalleryParams) {
        setGallery(null);
        return;
      }
      if (!open || !activeHotel) {
        setGallery(null);
        writeGalleryUrl(null);
        return;
      }

      const identity = url.searchParams.get(galleryPhotoParam);
      const source = gallerySourceForHotel(activeHotel, identity, isEnglish);
      if (!source) {
        setGallery(null);
        writeGalleryUrl(null);
        return;
      }

      const index = normalizedGalleryIndex(url.searchParams.get(galleryIndexParam), source.images.length);
      setGallery({ identity, images: source.images, index, title: source.title });
      if (identity === "hotel") setHotelSlideIndex(index);
      if (url.searchParams.get(galleryIndexParam) !== String(index)) {
        writeGalleryUrl(identity, index);
      }
    };

    syncGalleryFromUrl();
    window.addEventListener("popstate", syncGalleryFromUrl);
    return () => window.removeEventListener("popstate", syncGalleryFromUrl);
  }, [activeHotel, isEnglish, open]);

  return (
    <Dialog
      aria-labelledby="hotel-comparison-title"
      className="hotel-comparison-dialog"
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
    >
      <DialogTitle id="hotel-comparison-title" className="hotel-comparison-title">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CompareArrowsIcon aria-hidden="true" />
            <Typography component="h2" variant="h3">
              {isEnglish ? comparison.titleEn : comparison.title}
            </Typography>
          </Stack>
          <Typography color="text.secondary">
            {isEnglish ? `${dates.checkIn}—${dates.checkOut} · 2 guests · 1 room` : `${dates.label} · 2人 · 1间`}
          </Typography>
        </Box>
        <IconButton aria-label={isEnglish ? "Close" : "关闭"} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="hotel-comparison-content">
        <HotelComparisonMap
          activeHotelId={activeHotel.id}
          comparison={comparison}
          hotels={cards}
          isEnglish={isEnglish}
          onHotelChange={onActiveHotelChange}
        />
        {destinationResearch && (
          <Box className="hotel-social-research hotel-destination-research">
            <Typography fontWeight={900}>{isEnglish ? "Destination stay research" : "目的地酒店 / 民宿调研结论"}</Typography>
            <Typography color="text.secondary">{destinationResearch.verdict}</Typography>
            <Typography component="a" href={destinationResearch.url} rel="noreferrer" target="_blank">
              {isEnglish ? "Open verified Xiaohongshu search" : "打开已验证的小红书住宿搜索"}<OpenInNewIcon aria-hidden="true" />
            </Typography>
          </Box>
        )}
        <Box className="hotel-comparison-tabs-panel">
          <Tabs
            aria-label={isEnglish ? "Choose accommodation to compare" : "选择住宿进行比选"}
            allowScrollButtonsMobile
            className="hotel-comparison-tabs"
            onChange={(_, value) => onActiveHotelChange(value)}
            scrollButtons="auto"
            value={activeHotel.id}
            variant="scrollable"
          >
            {cards.map((hotel, index) => (
              <Tab
                key={hotel.id}
                label={(
                  <Stack alignItems="center" direction="row" spacing={0.7}>
                    <span>{`${index + 1} · ${hotel.name.replace(" Auckland Airport", "")}`}</span>
                    {hotel.id === selectedHotelId && <CheckCircleIcon className="hotel-tab-selected-icon" />}
                  </Stack>
                )}
                value={hotel.id}
              />
            ))}
          </Tabs>
          <Box className="hotel-comparison-grid">
          {[activeHotel].map((hotel) => {
            const selected = hotel.id === selectedHotelId;
            const officialPresentation = officialStatusPresentation(hotel, isEnglish);
            return (
              <Paper className="hotel-option-card" data-selected={selected} key={hotel.id} variant="outlined">
                <Stack className="hotel-option-heading" direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack className="hotel-option-heading-title" direction="row" alignItems="center" spacing={0.8}>
                    <Chip label={isEnglish ? hotel.recommendationEn : hotel.recommendation} size="small" />
                    <Typography
                      className="hotel-option-name"
                      component="a"
                      href={hotel.stayUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {hotel.name}<OpenInNewIcon aria-hidden="true" />
                    </Typography>
                    <IconButton
                      aria-label={isEnglish ? `Copy hotel name: ${hotel.name}` : `复制酒店名称：${hotel.name}`}
                      className="hotel-copy-name-button"
                      onClick={() => copyHotelName(hotel.name)}
                      size="small"
                      title={isEnglish ? "Copy hotel name" : "复制酒店名称"}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Stack>
                  {selected && <Chip color="success" icon={<CheckCircleIcon />} label={isEnglish ? "Selected" : "已选择"} size="small" />}
                </Stack>
                {hotel.hotelImages?.length > 0 && (
                  <Box className="hotel-photo-carousel">
                    <Box component="figure" onClick={() => openGallery("hotel", hotel.hotelImages, hotelSlideIndex, isEnglish ? "Hotel photos" : "酒店图片")}>
                      <Box alt={hotel.hotelImages[hotelSlideIndex].label} component="img" src={hotel.hotelImages[hotelSlideIndex].src} />
                      <Typography component="figcaption">{hotelSlideIndex + 1} / {hotel.hotelImages.length} · {hotel.hotelImages[hotelSlideIndex].label} · {hotel.hotelImages[hotelSlideIndex].source}</Typography>
                    </Box>
                    {hotel.hotelImages.length > 1 && (
                      <>
                        <IconButton aria-label={isEnglish ? "Previous hotel photo" : "上一张酒店图片"} className="hotel-carousel-prev" onClick={() => setHotelSlideIndex((current) => (current - 1 + hotel.hotelImages.length) % hotel.hotelImages.length)}><ArrowBackIosNewIcon /></IconButton>
                        <IconButton aria-label={isEnglish ? "Next hotel photo" : "下一张酒店图片"} className="hotel-carousel-next" onClick={() => setHotelSlideIndex((current) => (current + 1) % hotel.hotelImages.length)}><ArrowForwardIosIcon /></IconButton>
                        <Box className="hotel-carousel-dots">{hotel.hotelImages.map((image, index) => <button aria-label={`${isEnglish ? "Show hotel photo" : "查看酒店图片"} ${index + 1}`} className={index === hotelSlideIndex ? "is-active" : ""} key={image.src} onClick={() => setHotelSlideIndex(index)} />)}</Box>
                      </>
                    )}
                  </Box>
                )}
                <Typography className="hotel-option-summary" color="text.secondary">
                  {isEnglish ? hotel.summaryEn : hotel.summary}
                </Typography>
                {hotel.availabilityNote && (
                  <Box className="hotel-availability-note">
                    <Typography fontWeight={900}>{isEnglish ? "Exact-date availability" : "精确日期库存"}</Typography>
                    <Typography>{isEnglish ? (hotel.availabilityNoteEn ?? hotel.availabilityNote) : hotel.availabilityNote}</Typography>
                  </Box>
                )}
                {(hotel.officialStatus || hotel.officialStayUrl || (hotel.isAirbnb && hotel.isVerifiedListing)) && <Box className={`hotel-official-verification ${officialPresentation.tone}`}>
                  <Typography fontWeight={900}>
                    {officialPresentation.title}
                  </Typography>
                  <Typography>
                    {isEnglish
                      ? (hotel.officialStatusEn ?? (hotel.isAirbnb && hotel.isVerifiedListing
                        ? (hotel.availabilityNoteEn ?? hotel.availabilityNote)
                        : hotel.officialStayUrl
                          ? "Official website recorded; exact-date checkout price still needs verification."
                          : "No verifiable independent official website is recorded; availability and rates rely on the labelled platform checks."))
                      : (hotel.officialStatusDetail ?? (hotel.isAirbnb && hotel.isVerifiedListing
                        ? `Airbnb 房东官方发布页已实际打开核验。${hotel.availabilityNote}`
                        : hotel.officialStayUrl
                          ? "已记录官网入口；精确日期、2 人 1 间的可订房型、含税总价及退改仍待官网核验。"
                          : "未记录可核验的独立官网；库存与价格以卡片中明确标注的平台实查结果为准。"))}
                  </Typography>
                  {hotel.officialStayUrl && <Typography component="a" href={hotel.officialStayUrl} rel="noreferrer" target="_blank">
                    {officialPresentation.linkLabel}<OpenInNewIcon aria-hidden="true" />
                  </Typography>}
                  {hotel.officialLinkNote && <Typography className="hotel-official-link-note" color="text.secondary">
                    {isEnglish ? (hotel.officialLinkNoteEn ?? hotel.officialLinkNote) : hotel.officialLinkNote}
                  </Typography>}
                </Box>}
                <Stack className="hotel-option-facts" spacing={0.7}>
                  <Stack direction="row" spacing={0.8}><DirectionsWalkIcon /><Typography>{isEnglish ? hotel.accessEn : hotel.access}</Typography></Stack>
                  <Stack direction="row" spacing={0.8}><LocalParkingIcon /><Typography>{isEnglish ? hotel.parkingEn : hotel.parking}</Typography></Stack>
                </Stack>
                {hotel.nearbyAttractions?.length > 0 && (
                  <Box className="hotel-nearby-attractions">
                    <Stack direction="row" alignItems="center" spacing={0.7}>
                      <PlaceIcon aria-hidden="true" />
                      <Typography fontWeight={900}>{isEnglish ? "Distance to this trip's sights" : "到本次行程景点"}</Typography>
                    </Stack>
                    {hotel.distanceNote && <Typography className="hotel-distance-note" color="text.secondary">{isEnglish ? hotel.distanceNoteEn : hotel.distanceNote}</Typography>}
                    <Box className="hotel-nearby-attractions-grid">
                      {hotel.nearbyAttractions.map((attraction) => (
                        <Box component="a" href={directionsUrl(hotel, attraction)} key={attraction.name} rel="noreferrer" target="_blank">
                          <Typography fontWeight={900}>{isEnglish ? (attraction.nameEn ?? attraction.name) : attraction.name}<OpenInNewIcon aria-hidden="true" /></Typography>
                          <Typography color="text.secondary">{isEnglish ? (attraction.distanceEn ?? attraction.distance) : attraction.distance} · {isEnglish ? (attraction.travelTimeEn ?? attraction.travelTime) : attraction.travelTime}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                <Box className="hotel-platform-ratings">
                  {hotel.ratings.map((rating) => {
                    const href = platformUrl(hotel, rating.platform);
                    return (
                    <Box
                      className={href ? "is-clickable" : ""}
                      component={href ? "a" : "div"}
                      href={href || undefined}
                      key={rating.platform}
                      rel={href ? "noreferrer" : undefined}
                      target={href ? "_blank" : undefined}
                    >
                      <Typography variant="caption">{rating.platform}</Typography>
                      <Typography fontWeight={900}>{rating.score}</Typography>
                      <Typography variant="caption" color="text.secondary">{rating.reviews}</Typography>
                    </Box>
                  )})}
                </Box>
                {hotel.roomTypes?.length > 0 && (
                  <Box className="hotel-room-types">
                    <Typography fontWeight={900}>{isEnglish ? "Available room types" : "可选房型与设施"}</Typography>
                    {hotel.roomTypes.map((room, roomIndex) => {
                      const bookingQuotedRoom = hotel.currentRate && (
                        !["Airbnb", "Agoda"].includes(hotel.currentRate.source) && (
                          room.rateKey
                            ? room.rateKey === hotel.currentRate.roomKey
                            : room.name === hotel.currentRate.room.split(" · ")[0]
                        )
                      );
                      const agodaQuotedRoom = hotel.currentRate?.agoda && (
                        room.rateKey
                          ? room.rateKey === hotel.currentRate.agoda.roomKey
                          : room.name === hotel.currentRate.agoda.room.split(" · ")[0]
                      );
                      // A hotel/common gallery or a visually similar room is not evidence for
                      // this exact category. Only expose photos after the platform room-detail
                      // gallery has been checked and the data entry is explicitly verified.
                      const roomImages = room.photosVerified === true ? (room.images ?? []) : [];
                      const explicitRates = hotel.currentRate?.roomRates?.[room.rateKey];
                      const bookingRateCandidate = explicitRates?.booking ?? (bookingQuotedRoom ? hotel.currentRate : null);
                      const officialRate = explicitRates?.official ?? (bookingRateCandidate?.useOfficialUrl ? bookingRateCandidate : null);
                      const bookingRate = bookingRateCandidate?.useOfficialUrl ? null : bookingRateCandidate;
                      const agodaRate = explicitRates?.agoda ?? (agodaQuotedRoom ? hotel.currentRate.agoda : null);
                      const airbnbQuotedRoom = hotel.currentRate?.source === "Airbnb" && (
                        room.rateKey
                          ? room.rateKey === hotel.currentRate.roomKey
                          : room.name === hotel.currentRate.room.split(" · ")[0]
                      );
                      const airbnbRate = explicitRates?.airbnb ?? (airbnbQuotedRoom ? hotel.currentRate : null);
                      const officialRatePending = !hotel.isAirbnb && Boolean(hotel.officialStayUrl) && !officialRate && Boolean(bookingRate || agodaRate);
                      const roomOfficialPresentation = hotel.officialStatus === "exact-rate-verified"
                        ? {
                            tone: "is-unmatched",
                            roomLabel: isEnglish ? "Official website · room not matched" : "官网 · 本房型未映射",
                            roomNote: isEnglish
                              ? "The hotel-level direct search was checked, but this exact platform room was not reliably matched to a direct category or rate."
                              : "酒店级官网搜索已核验，但该平台房型未可靠匹配到官网分类或价格。",
                          }
                        : officialPresentation;
                      return (
                      <Box className="hotel-room-type" key={room.name}>
                        <Box className="hotel-room-type-layout">
                          {roomImages.length > 0 && <Box className="hotel-room-photo-strip">
                            {roomImages.map((image, imageIndex) => <Box
                              alt={`${image.label} · 来源：${image.source}`}
                              component="img"
                              key={image.src}
                              onClick={() => openGallery(`room:${room.rateKey ?? roomIndex}`, roomImages, imageIndex, room.name)}
                              src={image.src}
                            />)}
                          </Box>}
                          <Box>
                            <Typography fontWeight={900}>{room.name}</Typography>
                            <Typography color="text.secondary">{room.size} · {room.bed}</Typography>
                            <Typography>{room.facilities.join(" · ")}</Typography>
                            {roomImages.length === 0 && <Typography className="hotel-room-photo-unavailable">{isEnglish ? (room.photoNoteEn ?? "Room-specific photos are still being verified") : (room.photoNote ?? "对应房型图片尚在核验整理中")}</Typography>}
                            {roomImages.length > 1 && <Typography className="hotel-room-photo-count">{
                              isEnglish
                                ? `${roomImages.length} room photos${room.photosVerified ? " · matched to this platform room type" : ""} · tap to view`
                                : `${roomImages.length} 张客房图${room.photosVerified ? " · 已按平台房型核对" : ""} · 点击查看`
                            }</Typography>}
                          </Box>
                        </Box>
                        {(officialRate || officialRatePending || bookingRate || agodaRate || airbnbRate) && (
                          <Box className="hotel-room-platform-prices">
                            {officialRate && <Box className="hotel-room-platform-official">
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.officialStayUrl} rel="noreferrer" target="_blank">
                                {isEnglish
                                  ? (hotel.officialRateLinkLabelEn ?? "Official website · verified")
                                  : (hotel.officialRateLinkLabel ?? "官网 · 已核验")}<OpenInNewIcon />
                              </Typography>
                              {hotel.officialLinkNote && <Typography className="hotel-official-link-note" color="text.secondary">
                                {isEnglish ? (hotel.officialLinkNoteEn ?? hotel.officialLinkNote) : hotel.officialLinkNote}
                              </Typography>}
                              <Typography color="text.secondary">{isEnglish ? "Official room" : "官网房型"}：{(isEnglish ? (officialRate.roomEn ?? officialRate.room) : officialRate.room).split(" · ")[0]}</Typography>
                              {(officialRate.rateOptions ?? []).map((option) => <Box key={`${option.label}-${option.nzd}`}>
                                <Typography fontWeight={900}>{currencyLabel(option.nzd)}</Typography>
                                <Typography color="text.secondary">{isEnglish ? (option.labelEn ?? option.label) : option.label} · {isEnglish ? (option.detailEn ?? option.detail) : option.detail}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(option.nzd / nights)}</Typography>}
                              </Box>)}
                              {officialRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(officialRate.nonRefundableNzd)}</Typography>
                                <Typography color="text.secondary">{(isEnglish ? officialRate.rateLabelEn : officialRate.rateLabel) ?? officialRate.rateLabel ?? (isEnglish ? "Tax-inclusive total · non-refundable" : `${dates.label}含税总价 · 不可退款`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(officialRate.nonRefundableNzd / nights)}</Typography>}
                              </>}
                              {officialRate.refundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(officialRate.refundableNzd)}</Typography>
                                <Typography color="text.secondary">{(isEnglish ? officialRate.refundableRateLabelEn : officialRate.refundableRateLabel) ?? officialRate.refundableRateLabel ?? (isEnglish ? `Tax-inclusive total · free cancellation before ${officialRate.cancelUntilEn ?? officialRate.cancelUntil}` : `${dates.label}含税总价 · ${officialRate.cancelUntil} 前免费取消`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(officialRate.refundableNzd / nights)}</Typography>}
                              </>}
                              {(isEnglish ? (officialRate.memberNoteEn ?? officialRate.memberNote) : officialRate.memberNote) && <Typography color="text.secondary">{isEnglish ? (officialRate.memberNoteEn ?? officialRate.memberNote) : officialRate.memberNote}</Typography>}
                              {(officialRate.payment || officialRate.breakfast) && <Typography color="text.secondary">{[
                                isEnglish ? (officialRate.paymentEn ?? officialRate.payment) : officialRate.payment,
                                isEnglish ? (officialRate.breakfastEn ?? officialRate.breakfast) : officialRate.breakfast,
                              ].filter(Boolean).join(" · ")}</Typography>}
                            </Box>}
                            {officialRatePending && <Box className={`hotel-room-platform-official-pending ${roomOfficialPresentation.tone}`}>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.officialStayUrl} rel="noreferrer" target="_blank">
                                {roomOfficialPresentation.roomLabel}<OpenInNewIcon />
                              </Typography>
                              <Typography fontWeight={900}>
                                {roomOfficialPresentation.roomNote}
                              </Typography>
                            </Box>}
                            {bookingRate && <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.bookingStayUrl} rel="noreferrer" target="_blank">
                                {bookingRate.source}<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room" : "平台房型"}：{bookingRate.room.split(" · ")[0]}</Typography>
                              {bookingRate.originalCurrency && <Typography color="text.secondary">{isEnglish ? "Platform original price" : "平台原始价"}：{bookingRate.originalCurrency} {bookingRate.originalAmount}</Typography>}
                              {bookingRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(bookingRate.nonRefundableNzd)}</Typography>
                                <Typography color="text.secondary">{bookingRate.rateLabel ?? (isEnglish ? "Total · non-refundable" : `${dates.label}总价 · 不可退款`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.nonRefundableNzd / nights)}</Typography>}
                              </>}
                              {bookingRate.refundableNzd != null && (
                                <>
                                  <Typography fontWeight={900}>{currencyLabel(bookingRate.refundableNzd)}</Typography>
                                  <Typography color="text.secondary">{isEnglish ? `Total · free cancellation before ${bookingRate.cancelUntil}` : `${dates.label}总价 · ${bookingRate.cancelUntil} 前免费取消`}</Typography>
                                  {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.refundableNzd / nights)}</Typography>}
                                </>
                              )}
                              {bookingRate.conversionNote && <Typography color="text.secondary">{bookingRate.conversionNote}</Typography>}
                              {(bookingRate.payment || bookingRate.breakfast) && <Typography color="text.secondary">{[bookingRate.payment, bookingRate.breakfast].filter(Boolean).join(" · ")}</Typography>}
                            </Box>}
                            {agodaRate ? <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">
                                {isEnglish ? "Agoda · secondary comparison" : "Agoda · 补充比价"}<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room" : "平台房型"}：{agodaRate.room.split(" · ")[0]}</Typography>
                              {agodaRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(agodaRate.nonRefundableNzd)}</Typography>
                                <Typography color="text.secondary">{agodaRate.rateLabel ?? `${dates.label}总价 · 会员含税不可退款`}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.nonRefundableNzd / nights)}</Typography>}
                              </>}
                              {agodaRate.refundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(agodaRate.refundableNzd)}</Typography>
                                <Typography color="text.secondary">{agodaRate.cancelUntil ? `${dates.label}总价 · ${agodaRate.cancelUntil} 前免费取消` : `${dates.label}总价 · 免费取消，截止时间需结算页确认`}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.refundableNzd / nights)}</Typography>}
                              </>}
                              {agodaRate.conversionNote && <Typography color="text.secondary">{agodaRate.conversionNote}</Typography>}
                              {(agodaRate.payment || agodaRate.breakfast) && <Typography color="text.secondary">{[agodaRate.payment, agodaRate.breakfast].filter(Boolean).join(" · ")}</Typography>}
                            </Box> : bookingRate && hotel.agodaStayUrl && <Box className="hotel-room-platform-pending">
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">{isEnglish ? "Agoda · secondary comparison" : "Agoda · 补充比价"}<OpenInNewIcon /></Typography>
                              <Typography fontWeight={900}>{hotel.agodaSoldOut
                                ? (isEnglish ? "Sold out on Agoda for these exact dates" : `当前酒店 ${hotel.name} 在 Agoda 所选日期已售罄`)
                                : (isEnglish ? "No verified Agoda rate for this room type" : "本房型暂无已核验 Agoda 报价")}
                              </Typography>
                              <Typography color="text.secondary">{hotel.agodaSoldOut
                                ? hotel.agodaStatusDetail
                                : (isEnglish ? "The hotel page may have been checked, but no matching bookable price has been recorded for this exact room type." : `当前酒店：${hotel.name}。尚未记录与“${room.name}”对应的 Agoda 可订结算总价；不会借用其他酒店、其他房型或“低至”价格。`)}</Typography>
                            </Box>}
                            {airbnbRate && <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.stayUrl} rel="noreferrer" target="_blank">
                                Airbnb<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Listing type" : "房源类型"}：{airbnbRate.room.split(" · ")[0]}</Typography>
                              <Typography fontWeight={900}>{currencyLabel(airbnbRate.refundableNzd)}</Typography>
                              <Typography color="text.secondary">{isEnglish ? `Total · free cancellation before ${airbnbRate.cancelUntil}` : `${dates.label}含税费总价 · ${airbnbRate.cancelUntil} 前免费取消`}</Typography>
                              {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(airbnbRate.refundableNzd / nights)}</Typography>}
                              {(airbnbRate.payment || airbnbRate.breakfast) && <Typography color="text.secondary">{[airbnbRate.payment, airbnbRate.breakfast].filter(Boolean).join(" · ")}</Typography>}
                            </Box>}
                          </Box>
                        )}
                      </Box>
                    )})}
                  </Box>
                )}
                <Box className="hotel-option-pros-cons">
                  <Box>
                    <Typography fontWeight={900}>{isEnglish ? "Good for" : "优点"}</Typography>
                    {(isEnglish ? (hotel.strengthsEn ?? hotel.strengths) : hotel.strengths).map((item) => <Typography key={item}>+ {item}</Typography>)}
                  </Box>
                  <Box>
                    <Typography fontWeight={900}>{isEnglish ? "Watch for" : "注意"}</Typography>
                    {(isEnglish ? (hotel.cautionsEn ?? hotel.cautions) : hotel.cautions).map((item) => <Typography key={item}>− {item}</Typography>)}
                  </Box>
                </Box>
                {hotel.id === "novotel-auckland-airport" && (
                  <Box className="airport-overnight-alternative">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NightShelterIcon aria-hidden="true" />
                      <Box>
                        <Typography fontWeight={900}>{isEnglish ? "Alternative: sleep in the airport" : "省钱备选：直接留宿机场"}</Typography>
                        <Typography color="text.secondary">{isEnglish ? "Possible, but not recommended before the next day's flight." : "可以过夜，但不建议作为这次深夜落地后的首选。"}</Typography>
                      </Box>
                    </Stack>
                    <Box className="airport-overnight-verdict">
                      <Typography><b>{isEnglish ? "Where" : "能睡哪里"}：</b>{isEnglish ? "International terminal level 2; the domestic terminal closes around midnight." : "国际航站楼 24 小时开放，二楼有无扶手木椅、薄软椅和少量充电；国内航站楼午夜关闭，不能过夜。"}</Typography>
                      <Typography><b>{isEnglish ? "Comfort" : "实际舒适度"}：</b>{isEnglish ? "Cold, bright and noisy. Several travellers reported very limited sleep." : "夜里冷、灯光和环境声持续，店铺大多关闭；有作者 43 小时行程只睡约 3 小时。"}</Typography>
                      <Typography><b>{isEnglish ? "Useful" : "可利用设施"}：</b>{isEnglish ? "Showers are in the domestic terminal; walk 10–15 minutes following the green line." : "国内楼 3 号门附近二楼有淋浴，需自备洗漱用品；两楼沿绿色指引线步行约 10—15 分钟。"}</Typography>
                      <Typography><b>{isEnglish ? "Verdict" : "建议"}：</b>{isEnglish ? "Only for a very tight budget and if poor sleep is acceptable." : "若只是极限省钱且能接受几乎睡不好，可以考虑；你们第二天还要飞皇后镇，住 Novotel 更稳妥。"}</Typography>
                    </Box>
                    <Box className="airport-overnight-guides">
                      {aucklandAirportOvernightGuides.map((guide, index) => (
                        <Box component="a" href={guide.url} key={guide.url} rel="noreferrer" target="_blank">
                          <Typography variant="caption">小红书 · {index + 1}/5 · {guide.author}</Typography>
                          <Typography fontWeight={900}>{guide.title}<OpenInNewIcon /></Typography>
                          <Typography color="text.secondary">{guide.note}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                <Button
                  className="hotel-select-button"
                  disabled={selected}
                  fullWidth
                  onClick={() => onSelect(hotel)}
                  variant={selected ? "outlined" : "contained"}
                >
                  {selected ? (isEnglish ? "Current choice" : "当前选择") : (isEnglish ? "Choose this hotel" : "选择这家")}
                </Button>
              </Paper>
            );
          })}
          </Box>
        </Box>
      </DialogContent>
      <Snackbar
        autoHideDuration={2400}
        message={copyResult?.ok
          ? (isEnglish ? `Copied: ${copyResult.name}` : `已复制：${copyResult.name}`)
          : (isEnglish ? "Copy failed — select the hotel name and copy it manually" : "复制失败，请选中酒店名称手动复制")}
        onClose={() => setCopyResult(null)}
        open={Boolean(copyResult)}
      />
      <Dialog className="hotel-photo-lightbox" fullScreen onClose={closeGallery} open={Boolean(galleryImage)}>
        {galleryImage && (
          <Box className="hotel-photo-lightbox-stage">
            <IconButton aria-label={isEnglish ? "Close photo viewer" : "关闭图片查看器"} className="hotel-photo-lightbox-close" onClick={closeGallery}>
              <CloseIcon />
            </IconButton>
            {galleryImages.length > 1 && (
              <IconButton aria-label={isEnglish ? "Previous photo" : "上一张图片"} className="hotel-photo-lightbox-prev" onClick={showPreviousImage}>
                <ArrowBackIosNewIcon />
              </IconButton>
            )}
            <Box alt={galleryImage.label} component="img" src={galleryImage.src} />
            {galleryImages.length > 1 && (
              <IconButton aria-label={isEnglish ? "Next photo" : "下一张图片"} className="hotel-photo-lightbox-next" onClick={showNextImage}>
                <ArrowForwardIosIcon />
              </IconButton>
            )}
            <Box className="hotel-photo-lightbox-caption">
              <Typography fontWeight={900}>{activeHotel.name} · {gallery.title}</Typography>
              <Typography>{galleryIndex + 1} / {galleryImages.length} · {galleryImage.label}</Typography>
              <Typography>{isEnglish ? "Source" : "图片来源"}：{galleryImage.source}</Typography>
            </Box>
            {galleryImages.length > 1 && <Box className="hotel-photo-lightbox-gallery" aria-label={isEnglish ? "Photo gallery" : "图片画廊"}>
              {galleryImages.map((image, index) => <button aria-label={`${isEnglish ? "Show photo" : "查看图片"} ${index + 1}：${image.label}`} className={index === galleryIndex ? "is-active" : ""} key={image.src} onClick={() => selectGalleryImage(index)}>
                <img alt="" src={image.src} />
              </button>)}
            </Box>}
          </Box>
        )}
      </Dialog>
    </Dialog>
  );
}
