import { useEffect, useMemo, useState } from "react";
import { Box, Button, ButtonBase, Chip, Dialog, IconButton, InputAdornment, Paper, Snackbar, Stack, TextField, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { agodaUrlForStay, bookingUrlForStay, officialUrlForStay } from "../data/aucklandAirportHotels";
import { aucklandCityHotels, aucklandCityStay } from "../data/aucklandCityHotels";
import "./HotelComparisonDialog.css";

const defaultComparison = aucklandCityStay;
const attractionPinsByRegion = {
  "auckland-airport": [
    { label: "奥克兰国际航站楼", labelEn: "Auckland International Terminal", position: [-37.0040146, 174.7856948] },
    { label: "奥克兰国内航站楼", labelEn: "Auckland Domestic Terminal", position: [-37.0062161, 174.7920758] },
  ],
  "auckland-city": [
    { label: "Britomart 交通中心", labelEn: "Britomart Transport Centre", position: [-36.8445568, 174.7691726] },
    { label: "Commercial Bay", labelEn: "Commercial Bay", position: [-36.8438052, 174.7662651] },
    { label: "Queen Street", labelEn: "Queen Street", position: [-36.8504453, 174.7639477] },
    { label: "Newmarket", labelEn: "Newmarket", position: [-36.8708593, 174.7759095] },
  ],
  queenstown: [
    { label: "Steamer Wharf · Walter Peak 码头", labelEn: "Steamer Wharf · Walter Peak pier", position: [-45.0332545, 168.6577993] },
    { label: "Queenstown Gardens", labelEn: "Queenstown Gardens", position: [-45.0363315, 168.6617071] },
    { label: "Skyline Queenstown", labelEn: "Skyline Queenstown", position: [-45.0279742, 168.646883] },
  ],
  wanaka: [
    { label: "That Wānaka Tree", labelEn: "That Wānaka Tree", position: [-44.6985, 169.1175] },
    { label: "瓦纳卡湖滨", labelEn: "Wānaka lakefront", position: [-44.695, 169.1368] },
  ],
  "mount-cook": [
    { label: "Mount Cook Airport", labelEn: "Mount Cook Airport", position: [-43.7666928, 170.1334316] },
    { label: "The Hermitage", labelEn: "The Hermitage", position: [-43.7331633, 170.0937221] },
    { label: "White Horse Hill 营地", labelEn: "White Horse Hill Campground", position: [-43.7182291, 170.0928935] },
  ],
  oamaru: [
    { label: "小蓝企鹅保护区", labelEn: "Blue Penguin Colony", position: [-45.110276, 170.9801779] },
    { label: "维多利亚历史街区", labelEn: "Victorian Precinct", position: [-45.1035615, 170.9704081] },
  ],
  christchurch: [
    { label: "Riverside Market", labelEn: "Riverside Market", position: [-43.5339149, 172.6340017] },
    { label: "New Regent Street", labelEn: "New Regent Street", position: [-43.5293064, 172.638704] },
    { label: "基督城植物园", labelEn: "Christchurch Botanic Gardens", position: [-43.5302611, 172.6205644] },
  ],
};
const nzdToCny = 3.9198;
const galleryPhotoParam = "photo";
const galleryIndexParam = "photoIndex";

function currencyLabel(nzd, isEnglish = false) {
  if (nzd == null) return null;
  const nzdLabel = Number.isInteger(nzd) ? nzd : nzd.toFixed(2);
  const cnyLabel = Math.round(nzd * nzdToCny).toLocaleString(isEnglish ? "en-US" : "zh-CN");
  return isEnglish
    ? `NZD ${nzdLabel} · approx. CNY ¥${cnyLabel}`
    : `NZD ${nzdLabel} · 约 ¥${cnyLabel}`;
}

function stayNightCount(checkIn, checkOut) {
  const milliseconds = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.max(1, Math.round(milliseconds / 86400000));
}

function rateChannel(source = "", fallback = "unknown") {
  const normalized = source.toLowerCase();
  if (normalized.includes("booking")) return "booking";
  if (normalized.includes("agoda")) return "agoda";
  if (normalized.includes("airbnb")) return "airbnb";
  if (normalized.includes("官网") || normalized.includes("official") || normalized.includes("direct")) return "official";
  return fallback;
}

function currentRoomQuotes(hotel, dates) {
  const snapshot = hotel.rateSnapshots?.[`${dates.checkIn}/${dates.checkOut}`] ?? null;
  if (!snapshot) return { quotesByRoom: new Map(), snapshot: null };

  const quotesByRoom = new Map();
  const addQuote = (roomKey, channel, rate) => {
    if (!roomKey || !rate || (rate.roomKey && rate.roomKey !== roomKey)) return;
    const hasPrice = Number.isFinite(rate.refundableNzd)
      || Number.isFinite(rate.nonRefundableNzd)
      || (rate.rateOptions ?? []).some((option) => Number.isFinite(option.nzd));
    if (!hasPrice) return;
    const current = quotesByRoom.get(roomKey) ?? [];
    current.push({ channel: rateChannel(rate.source, channel), rate });
    quotesByRoom.set(roomKey, current);
  };

  Object.entries(snapshot.roomRates ?? {}).forEach(([roomKey, channels]) => {
    Object.entries(channels ?? {}).forEach(([channel, rate]) => addQuote(roomKey, channel, rate));
  });

  if (snapshot.roomKey) addQuote(snapshot.roomKey, rateChannel(snapshot.source), snapshot);
  if (snapshot.agoda?.roomKey) addQuote(snapshot.agoda.roomKey, "agoda", snapshot.agoda);
  return { quotesByRoom, snapshot };
}

function recordedRateHasPrice(rate) {
  return Number.isFinite(rate?.refundableNzd)
    || Number.isFinite(rate?.nonRefundableNzd)
    || (rate?.rateOptions ?? []).some((option) => Number.isFinite(option?.nzd));
}

function snapshotHasRecordedPrice(snapshot) {
  return recordedRateHasPrice(snapshot)
    || recordedRateHasPrice(snapshot?.agoda)
    || Object.values(snapshot?.roomRates ?? {}).some((channels) =>
      Object.values(channels ?? {}).some(recordedRateHasPrice));
}

function snapshotQuotedAt(snapshot) {
  const dates = [snapshot?.quotedAt, snapshot?.agoda?.quotedAt];
  Object.values(snapshot?.roomRates ?? {}).forEach((channels) => {
    Object.values(channels ?? {}).forEach((rate) => dates.push(rate?.quotedAt));
  });
  return dates.filter(Boolean).sort().at(-1) ?? null;
}

function displayCheckedDate(value, isEnglish) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return isEnglish ? `${day}/${month}/${year}` : `${year}-${month}-${day}`;
}

function needsRecheckKind(hotel) {
  if (hotel.isResearchPlaceholder) return "target-search-pending";
  return Object.values(hotel.rateSnapshots ?? {}).some(snapshotHasRecordedPrice)
    ? "stale-quote"
    : "checked-no-price";
}

function isSelectableHotel(hotel) {
  return !hotel.isResearchPlaceholder && hotel.officialStatus === "exact-rate-verified";
}

function needsRecheckPresentation(hotel, isEnglish) {
  const kind = needsRecheckKind(hotel);
  const presentations = {
    "stale-quote": {
      tone: "is-unavailable",
      title: isEnglish ? "Previous quote recorded · refresh required" : "已有旧报价 · 待刷新",
      roomLabel: isEnglish ? "Previous quote · refresh required" : "已有旧报价 · 待刷新",
      roomNote: isEnglish
        ? "A recorded price exists, but it must be refreshed before it is treated as current."
        : "已有历史报价，但刷新前不能作为当前价格使用。",
      linkLabel: isEnglish ? "Open booking entry to refresh the quote" : "打开预订入口刷新报价",
      listNote: isEnglish
        ? "The recorded amount remains a reference only until it is refreshed."
        : "刷新前，已记录金额仅作历史参考。",
    },
    "checked-no-price": {
      tone: "is-unreachable",
      title: isEnglish ? "Target dates checked · no reproducible price" : "已查目标日期 · 无可复现价格",
      roomLabel: isEnglish ? "Booking entry checked · price not reproducible" : "已查预订入口 · 价格不可复现",
      roomNote: isEnglish
        ? "The target-date entry was checked, but no reproducible tax-inclusive total was obtained."
        : "已检查目标日期入口，但尚未取得可复现的含税总价。",
      linkLabel: isEnglish ? "Open booking entry to retry" : "打开预订入口重试",
      listNote: isEnglish
        ? "The target dates were checked, but no reproducible tax-inclusive total was obtained."
        : "已检查目标日期，但尚未取得可复现的含税总价。",
    },
    "target-search-pending": {
      tone: "is-unreachable",
      title: isEnglish ? "Target-date search not yet completed" : "尚未完成目标日期查询",
      roomLabel: isEnglish ? "Target-date search pending" : "目标日期待查询",
      roomNote: isEnglish
        ? "Inventory and a reproducible total still need to be checked; this option is not selectable yet."
        : "库存与可复现总价仍待查询；当前暂不可选择。",
      linkLabel: isEnglish ? "Open booking entry to start the check" : "打开预订入口开始查询",
      listNote: isEnglish
        ? "Research reference only; inventory and price still need to be checked."
        : "仅作调研参考，库存与价格仍待查询。",
    },
  };
  return { kind, ...presentations[kind] };
}

function reviewedAccommodationImages(hotel) {
  const images = [
    ...(hotel.hotelImages ?? []),
    ...(hotel.roomTypes ?? []).flatMap((room) => room.photosVerified === true ? (room.images ?? []) : []),
  ];
  const seen = new Set();
  return images.filter((image) => {
    if (!image?.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

function priceCandidates(quote) {
  const { channel, rate } = quote;
  const candidates = [];
  if (Number.isFinite(rate.refundableNzd)) {
    candidates.push({
      amount: rate.refundableNzd,
      cancelUntil: rate.cancelUntil ?? null,
      cancelUntilEn: rate.cancelUntilEn ?? null,
      detail: rate.refundableRateLabel ?? rate.rateLabel ?? null,
      detailEn: rate.refundableRateLabelEn ?? rate.rateLabelEn ?? null,
      kind: "refundable",
      safety: rate.cancelUntil ? 0 : 1,
    });
  }
  (rate.rateOptions ?? []).forEach((option, index) => {
    if (!Number.isFinite(option.nzd)) return;
    candidates.push({
      amount: option.nzd,
      detail: option.detail ?? option.label ?? null,
      detailEn: option.detailEn ?? option.labelEn ?? null,
      kind: "option",
      safety: 2 + index / 100,
    });
  });
  if (Number.isFinite(rate.nonRefundableNzd)) {
    candidates.push({
      amount: rate.nonRefundableNzd,
      detail: rate.rateLabel ?? null,
      detailEn: rate.rateLabelEn ?? null,
      kind: "non-refundable",
      safety: 3,
    });
  }
  return candidates.map((candidate) => ({ ...candidate, channel, source: rate.source ?? channel }));
}

const channelPriority = { official: 0, booking: 1, agoda: 2, airbnb: 3, unknown: 4 };

function getFeaturedStay(hotel, dates) {
  const { quotesByRoom, snapshot } = currentRoomQuotes(hotel, dates);
  const roomTypes = hotel.roomTypes ?? [];
  const preferredRoom = roomTypes.find((room) => room.rateKey === hotel.featuredRoomKey && quotesByRoom.has(room.rateKey))
    ?? roomTypes.find((room) => quotesByRoom.has(room.rateKey))
    ?? roomTypes.find((room) => room.rateKey === hotel.featuredRoomKey)
    ?? roomTypes[0]
    ?? null;
  const quotes = preferredRoom ? (quotesByRoom.get(preferredRoom.rateKey) ?? []) : [];
  const price = quotes
    .flatMap(priceCandidates)
    .sort((a, b) => (channelPriority[a.channel] ?? 9) - (channelPriority[b.channel] ?? 9)
      || a.safety - b.safety
      || a.amount - b.amount)[0] ?? null;
  const roomImage = preferredRoom?.photosVerified === true ? preferredRoom.images?.[0] : null;
  const fallbackImage = reviewedAccommodationImages(hotel)[0] ?? null;
  const fallbackIsPropertyImage = fallbackImage
    ? (hotel.hotelImages ?? []).some((image) => image?.src === fallbackImage.src)
    : false;
  return {
    image: roomImage ?? fallbackImage,
    imageKind: roomImage ? "room" : fallbackImage
      ? (fallbackIsPropertyImage ? "hotel" : "other-room")
      : null,
    price,
    quotedAt: snapshotQuotedAt(snapshot),
    recheckKind: hotel.officialStatus === "needs-recheck" ? needsRecheckKind(hotel) : null,
    priceStatus: hotel.officialStatus === "exact-date-unavailable"
      ? "unavailable"
      : hotel.officialStatus === "needs-recheck"
        ? "needs-recheck"
        : snapshot && price ? "verified" : "needs-recheck",
    room: preferredRoom,
  };
}

function priceSourceLabel(price, isEnglish) {
  if (!isEnglish) return price.source;
  return { official: "Official website", booking: "Booking.com", agoda: "Agoda", airbnb: "Airbnb" }[price.channel]
    ?? price.source;
}

const containsHanText = (value) => typeof value === "string" && /[\u3400-\u9fff]/u.test(value);

function englishSourceLabel(source) {
  if (!source || !containsHanText(source)) return source;
  const embeddedUrl = source.match(/https?:\/\/\S+/u)?.[0];
  let host = null;
  if (embeddedUrl) {
    try {
      host = new URL(embeddedUrl).hostname.replace(/^www\./u, "");
    } catch {
      host = null;
    }
  }
  if (/booking(?:\.com)?/iu.test(source)) return host ? `Booking.com · ${host}` : "Booking.com";
  if (/agoda/iu.test(source)) return host ? `Agoda · ${host}` : "Agoda";
  if (/airbnb/iu.test(source)) return host ? `Airbnb · ${host}` : "Airbnb";
  if (/guest reservations/iu.test(source)) return "Guest Reservations";
  if (/官网|官方/u.test(source)) {
    const propertyName = source.split(/官网|官方/u)[0].trim().replace(/[·\s]+$/u, "");
    const prefix = propertyName && !containsHanText(propertyName) ? propertyName : "Property";
    return host ? `${prefix} official source · ${host}` : `${prefix} official source`;
  }
  if (/酒店分发图库/u.test(source)) return "ICE Portal · hotel distribution gallery";
  return host ? `Recorded source · ${host}` : "Recorded source";
}

function localizedRateField(rate, field, isEnglish, englishFallback = null) {
  if (!rate) return englishFallback;
  if (!isEnglish) return rate[field] ?? null;
  const englishValue = rate[`${field}En`];
  if (typeof englishValue === "string" && englishValue.trim() && !containsHanText(englishValue)) {
    return englishValue;
  }
  const originalValue = rate[field];
  if (typeof originalValue === "string" && originalValue.trim() && !containsHanText(originalValue)) {
    return originalValue;
  }
  return englishFallback;
}

function localizedRateSource(rate, isEnglish) {
  if (!isEnglish) return rate?.source;
  const channel = rateChannel(rate?.source);
  return {
    official: "Official website",
    booking: "Booking.com",
    agoda: "Agoda",
    airbnb: "Airbnb",
  }[channel] ?? localizedRateField(rate, "source", true, "Recorded booking source");
}

function cancellationDeadline(rate, isEnglish) {
  if (!isEnglish) return rate?.cancelUntil;
  return localizedRateField(rate, "cancelUntil", true, "the verified cancellation deadline");
}

function priceTermLabel(price, isEnglish) {
  if (!price) return null;
  if (price.kind === "refundable") {
    if (price.cancelUntil) {
      const deadline = isEnglish ? (price.cancelUntilEn ?? price.cancelUntil) : price.cancelUntil;
      const isExactDate = /^\d{4}-\d{2}-\d{2}/.test(deadline);
      return isEnglish
        ? (isExactDate ? `Free cancellation before ${deadline}` : `Free cancellation ${deadline}`)
        : (isExactDate ? `${deadline} 前可免费取消` : `可免费取消：${deadline}`);
    }
    return isEnglish ? "Refundable; deadline needs confirmation" : "可取消；截止时间待确认";
  }
  if (price.kind === "non-refundable") return isEnglish ? "Non-refundable" : "不可退款";
  return isEnglish ? (price.detailEn ?? price.detail ?? "Rate terms shown in detail") : (price.detail ?? "价格条款见详情");
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
  if (hotel.officialStatus === "needs-recheck") {
    const presentation = needsRecheckPresentation(hotel, isEnglish);
    return {
      ...presentation,
      linkLabel: isEnglish
        ? (hotel.officialLinkLabelEn ?? presentation.linkLabel)
        : (hotel.officialLinkLabel ?? presentation.linkLabel),
    };
  }

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
    const images = reviewedAccommodationImages(hotel);
    return images.length > 0
      ? { images, title: isEnglish ? "Accommodation photos" : "住宿图片" }
      : null;
  }
  if (!identity.startsWith("room:")) return null;

  const roomIdentity = identity.slice("room:".length);
  const room = hotel.roomTypes?.find((candidate, index) => String(candidate.rateKey ?? index) === roomIdentity);
  const images = room?.photosVerified === true ? (room.images ?? []) : [];
  return room && images.length > 0
    ? { images, title: isEnglish ? room.nameEn : room.name }
    : null;
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

function DestinationResearchCard({ className = "", isEnglish, research }) {
  const [expanded, setExpanded] = useState(false);
  const title = isEnglish ? "Destination stay research" : "目的地酒店 / 民宿调研结论";
  const verdict = isEnglish ? (research.verdictEn ?? research.verdict) : research.verdict;
  return (
    <Box className={`hotel-social-research hotel-destination-research ${expanded ? "is-expanded" : ""} ${className}`.trim()}>
      <Box
        aria-label={isEnglish ? "Open the verified Xiaohongshu accommodation search" : "打开已验证的小红书住宿搜索"}
        className="hotel-destination-research-link"
        component="a"
        href={research.url}
        rel="noreferrer"
        target="_blank"
      >
        <Typography className="hotel-destination-research-title" fontWeight={900}>
          {title}<OpenInNewIcon aria-hidden="true" />
        </Typography>
        <Typography className="hotel-destination-research-copy" color="text.secondary">{verdict}</Typography>
      </Box>
      <ButtonBase
        aria-expanded={expanded}
        className="hotel-destination-research-toggle"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? (isEnglish ? "Collapse" : "收起") : (isEnglish ? "Expand" : "展开")}
        {expanded ? <ExpandLessIcon aria-hidden="true" /> : <ExpandMoreIcon aria-hidden="true" />}
      </ButtonBase>
    </Box>
  );
}

function FitHotelMap({ attractions, hotels }) {
  const map = useMap();
  const positions = [...hotels.map((hotel) => hotel.position), ...attractions.map((attraction) => attraction.position)];
  const signature = positions.map((position) => position.join(",")).join("|");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.fitBounds(latLngBounds(positions), {
        animate: false,
        padding: [42, 42],
        maxZoom: 15,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [map, signature]);

  return null;
}

function FocusHotelMap({ hotel, requestKey }) {
  const map = useMap();

  useEffect(() => {
    if (!hotel?.position) return;
    map.flyTo(hotel.position, Math.max(map.getZoom(), 14), { duration: 0.45 });
  }, [hotel, map, requestKey]);

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

function HotelComparisonMap({ activeHotelId, comparison, focusRequestKey, focusedHotelId, hotels, isEnglish, onHotelChange }) {
  const anchorPosition = comparison.anchorPosition ?? aucklandCityStay.anchorPosition;
  const attractions = attractionPinsByRegion[comparison.id] ?? [{
    label: comparison.anchorLabel,
    labelEn: comparison.anchorLabelEn,
    position: anchorPosition,
  }];
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
        {attractions.map((attraction, index) => (
          <Marker
            icon={comparisonMapIcon(index === 0 ? (comparison.anchorIcon ?? "◎") : "●", "attraction")}
            key={`${attraction.label}-${attraction.position.join("-")}`}
            position={attraction.position}
          >
            <Tooltip direction="top" offset={[0, -18]} permanent={index === 0}>
              {isEnglish ? (attraction.labelEn ?? attraction.label) : attraction.label}
            </Tooltip>
          </Marker>
        ))}
        {hotels.map((hotel, index) => {
          const selected = hotel.id === (focusedHotelId ?? activeHotelId);
          const openDetails = Boolean(activeHotelId);
          return (
            <Marker
              eventHandlers={{ click: () => openDetails && onHotelChange(hotel.id) }}
              icon={comparisonMapIcon(String(hotel.markerNumber ?? index + 1), "hotel", selected)}
              key={hotel.id}
              position={hotel.position}
              zIndexOffset={selected ? 500 : 0}
            >
              <Tooltip direction="top" offset={[0, -18]} permanent={selected}>
                {isEnglish ? (hotel.nameEn ?? hotel.name) : hotel.name}
              </Tooltip>
            </Marker>
          );
        })}
        <FitHotelMap attractions={attractions} hotels={hotels} />
        {focusedHotelId && <FocusHotelMap hotel={hotels.find((hotel) => hotel.id === focusedHotelId)} requestKey={focusRequestKey} />}
      </MapContainer>
      <Box className="hotel-comparison-map-caption">
        <Typography fontWeight={900}>{isEnglish ? "Location overview" : "位置总览"}</Typography>
        <Typography color="text.secondary">
          {activeHotelId
            ? (isEnglish ? "The map shows this stay and the sights relevant to your itinerary." : "地图展示当前住宿，以及这段行程会去的热门景点。")
            : (isEnglish ? "Use a list number to locate a stay; select its name to open details." : "点击列表编号在地图定位；点击住宿名称进入详情。")}
        </Typography>
      </Box>
    </Box>
  );
}

function hotelStayType(hotel) {
  if (hotel.stayType) return hotel.stayType;
  if (hotel.isAirbnb) return "home";
  return "hotel";
}

function hotelFilterStayTypes(hotel) {
  return hotel.stayTypes ?? [hotelStayType(hotel)];
}

function HotelComparisonList({ cards, comparison, dates, filters, isEnglish, onFiltersChange, onHotelChange, selectedHotelId }) {
  const destinationResearch = cards.find((hotel) => hotel.research)?.research;
  const [focusedHotelId, setFocusedHotelId] = useState(null);
  const [focusRequestKey, setFocusRequestKey] = useState(0);
  const { priceStatus, query, stayType } = filters;
  const featuredCards = useMemo(() => cards.map((hotel, index) => ({
    featured: getFeaturedStay(hotel, dates),
    hotel,
    markerNumber: index + 1,
    types: hotelFilterStayTypes(hotel),
  })), [cards, dates]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCards = featuredCards.filter(({ featured, hotel, types }) => {
    const searchText = [
      isEnglish ? (hotel.nameEn ?? hotel.name) : hotel.name,
      hotel.recommendation,
      hotel.recommendationEn,
      hotel.summary,
      hotel.summaryEn,
      featured.room?.name,
      featured.room?.nameEn,
      featured.room?.bed,
      ...(hotel.strengths ?? []),
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return (!normalizedQuery || searchText.includes(normalizedQuery))
      && (stayType === "all" || types.includes(stayType))
      && (priceStatus === "all" || featured.priceStatus === priceStatus);
  });
  const mapCards = filteredCards.map(({ hotel, markerNumber }) => ({ ...hotel, markerNumber }));
  const selectableCount = filteredCards.filter(({ hotel }) => isSelectableHotel(hotel)).length;
  const unavailableCount = filteredCards.filter(({ hotel }) => hotel.officialStatus === "exact-date-unavailable").length;
  const researchCount = filteredCards.filter(({ hotel }) => hotel.isResearchPlaceholder).length;
  const filterOptions = [
    { value: "all", zh: "全部住宿", en: "All stays" },
    { value: "hotel", zh: "酒店", en: "Hotels" },
    { value: "motel", zh: "Motel", en: "Motels" },
    { value: "home", zh: "公寓 / 民宿", en: "Apartments / homes" },
  ];
  return (
    <Box className="hotel-comparison-content hotel-comparison-list-view">
      <HotelComparisonMap
        activeHotelId={null}
        comparison={comparison}
        focusRequestKey={focusRequestKey}
        focusedHotelId={focusedHotelId}
        hotels={mapCards}
        isEnglish={isEnglish}
        onHotelChange={onHotelChange}
      />
      <Box className="hotel-stay-list-toolbar">
        <TextField
          aria-label={isEnglish ? "Search accommodation" : "搜索住宿"}
          className="hotel-stay-search"
          fullWidth
          onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          placeholder={isEnglish ? "Search name, room type or features" : "搜索酒店、民宿、房型或特点"}
          size="small"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon aria-hidden="true" /></InputAdornment>,
            },
          }}
          value={query}
        />
        <Box aria-label={isEnglish ? "Filter by accommodation type" : "按住宿类型过滤"} className="hotel-stay-filter-group" role="group">
          {filterOptions.map((option) => <Button
            aria-pressed={stayType === option.value}
            key={option.value}
            onClick={() => onFiltersChange({ ...filters, stayType: option.value })}
            size="small"
            variant={stayType === option.value ? "contained" : "outlined"}
          >{isEnglish ? option.en : option.zh}</Button>)}
        </Box>
        <Box className="hotel-stay-price-row">
          <Box aria-label={isEnglish ? "Filter by price status" : "按报价状态过滤"} className="hotel-stay-filter-group hotel-stay-price-filters" role="group">
            <Button aria-pressed={priceStatus === "all"} onClick={() => onFiltersChange({ ...filters, priceStatus: "all" })} size="small" variant={priceStatus === "all" ? "contained" : "outlined"}>{isEnglish ? "Any price status" : "全部报价"}</Button>
            <Button aria-pressed={priceStatus === "verified"} onClick={() => onFiltersChange({ ...filters, priceStatus: "verified" })} size="small" variant={priceStatus === "verified" ? "contained" : "outlined"}>{isEnglish ? "Exact-date price" : "有精确日期价"}</Button>
            <Button aria-pressed={priceStatus === "needs-recheck"} onClick={() => onFiltersChange({ ...filters, priceStatus: "needs-recheck" })} size="small" variant={priceStatus === "needs-recheck" ? "contained" : "outlined"}>{isEnglish ? "Price follow-up" : "报价待处理"}</Button>
            {unavailableCount > 0 && <Button aria-pressed={priceStatus === "unavailable"} onClick={() => onFiltersChange({ ...filters, priceStatus: "unavailable" })} size="small" variant={priceStatus === "unavailable" ? "contained" : "outlined"}>{isEnglish ? "Unavailable reference" : "指定日期无房"}</Button>}
          </Box>
          <Typography aria-live="polite" className="hotel-stay-result-count">
            {isEnglish
              ? `${filteredCards.length} shown · ${selectableCount} selectable${unavailableCount ? ` + ${unavailableCount} unavailable reference` : ""}${researchCount ? ` + ${researchCount} research reference` : ""}`
              : `显示 ${filteredCards.length} 家 · 可选 ${selectableCount} 家${unavailableCount ? ` + 无房参考 ${unavailableCount} 家` : ""}${researchCount ? ` + 待调研参考 ${researchCount} 家` : ""}`}
          </Typography>
        </Box>
      </Box>
      <Box aria-label={isEnglish ? "Accommodation options" : "住宿候选列表"} className="hotel-stay-list" role="list">
        {filteredCards.map(({ featured, hotel, markerNumber }) => {
          const selected = hotel.id === selectedHotelId && isSelectableHotel(hotel);
          const recheckPresentation = featured.recheckKind
            ? needsRecheckPresentation(hotel, isEnglish)
            : null;
          return (
            <Box className="hotel-stay-list-item" key={hotel.id} role="listitem">
              <Box
                className="hotel-stay-list-row"
                data-selected={selected || undefined}
              >
              <Box className="hotel-stay-list-media">
                {featured.image ? (
                  <Box alt={isEnglish ? (featured.image.labelEn ?? featured.image.label) : featured.image.label} component="img" src={featured.image.src} />
                ) : (
                  <Box aria-label={isEnglish ? "Verified photo pending" : "已核验图片待补充"} className="hotel-stay-list-placeholder" role="img">
                    <NightShelterIcon aria-hidden="true" />
                    <Typography>{isEnglish ? "Verified photo pending" : "已核验图片待补充"}</Typography>
                  </Box>
                )}
                <ButtonBase
                  aria-label={isEnglish ? `Locate ${hotel.nameEn ?? hotel.name} on the map` : `在地图定位 ${hotel.name}`}
                  aria-pressed={focusedHotelId === hotel.id}
                  className="hotel-stay-list-index"
                  onClick={() => {
                    setFocusedHotelId(hotel.id);
                    setFocusRequestKey((current) => current + 1);
                  }}
                >{markerNumber}</ButtonBase>
                {featured.image && <Typography className="hotel-stay-list-photo-label">
                  {featured.imageKind === "room"
                    ? (isEnglish ? "Recommended room photo" : "推荐房型图")
                    : featured.imageKind === "hotel"
                      ? (isEnglish ? "Property photo" : "住宿 / 公共区域图")
                      : (isEnglish ? "Another verified room photo" : "其他已核验房型图")}
                </Typography>}
              </Box>
              <Box className="hotel-stay-list-copy">
                <ButtonBase
                  aria-label={isEnglish ? `Open details for ${hotel.nameEn ?? hotel.name}` : `查看 ${hotel.name} 详情`}
                  className="hotel-stay-list-heading hotel-stay-list-heading-link"
                  onClick={() => onHotelChange(hotel.id)}
                >
                  <Box>
                    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.7}>
                      <Typography className="hotel-stay-list-name">{isEnglish ? (hotel.nameEn ?? hotel.name) : hotel.name}</Typography>
                      {selected && <Chip color={hotel.selectionPending ? "warning" : "success"} label={isEnglish ? "Current choice" : "当前首选"} size="small" />}
                      {hotel.isResearchPlaceholder && <Chip color="warning" label={isEnglish ? "Target-date search pending" : "目标日期待查询"} size="small" variant="outlined" />}
                    </Stack>
                    <Typography className="hotel-stay-list-recommendation">{isEnglish ? (hotel.recommendationEn ?? hotel.recommendation) : hotel.recommendation}</Typography>
                  </Box>
                  <ArrowForwardIosIcon aria-hidden="true" className="hotel-stay-list-arrow" />
                </ButtonBase>
                <Box className="hotel-stay-list-room">
                  <Typography className="hotel-stay-list-eyebrow">{isEnglish ? "Best-fit room for this trip" : "更适合你们的房型"}</Typography>
                  <Typography fontWeight={900}>{featured.room ? (isEnglish ? (featured.room.nameEn ?? featured.room.name) : featured.room.name) : (isEnglish ? "Room type pending" : "房型待核验")}</Typography>
                  {featured.room && <Typography color="text.secondary">
                    {[isEnglish ? (featured.room.sizeEn ?? featured.room.size) : featured.room.size, isEnglish ? (featured.room.bedEn ?? featured.room.bed) : featured.room.bed].filter(Boolean).join(" · ")}
                  </Typography>}
                </Box>
                <Box className={`hotel-stay-list-price ${featured.priceStatus}`}>
                  {hotel.isResearchPlaceholder ? <>
                    <Typography className="hotel-stay-list-price-value">{recheckPresentation.title}</Typography>
                    <Typography color="text.secondary">{recheckPresentation.listNote}</Typography>
                  </> : featured.priceStatus === "unavailable" ? <>
                    <Typography className="hotel-stay-list-price-value">{isEnglish ? "Unavailable for these dates" : "指定日期无连续库存"}</Typography>
                    <Typography color="text.secondary">{isEnglish ? "Reference only; cannot be selected." : "仅作位置与类型参考，不可选择。"}</Typography>
                  </> : featured.recheckKind === "stale-quote" ? <>
                    <Typography className="hotel-stay-list-price-value">{featured.price ? currencyLabel(featured.price.amount, isEnglish) : recheckPresentation.title}</Typography>
                    {featured.price && <Typography color="text.secondary">{isEnglish ? "Target-date total recorded" : `${dates.label}已记录住宿总价`} · {priceSourceLabel(featured.price, isEnglish)}</Typography>}
                    {featured.quotedAt && <Typography color="text.secondary">{isEnglish ? "Checked" : "核验日期"}：{displayCheckedDate(featured.quotedAt, isEnglish)} · {isEnglish ? "refresh before payment" : "付款前刷新"}</Typography>}
                    <Typography color="text.secondary">{recheckPresentation.listNote}</Typography>
                  </> : featured.recheckKind === "checked-no-price" ? <>
                    <Typography className="hotel-stay-list-price-value">{recheckPresentation.title}</Typography>
                    <Typography color="text.secondary">{recheckPresentation.listNote}</Typography>
                  </> : featured.price ? <>
                    <Typography className="hotel-stay-list-price-value">{currencyLabel(featured.price.amount, isEnglish)}</Typography>
                    <Typography color="text.secondary">{isEnglish ? "Exact-date total for the stay" : `${dates.label}精确日期住宿总价`} · {priceSourceLabel(featured.price, isEnglish)}</Typography>
                    <Typography color="text.secondary">{priceTermLabel(featured.price, isEnglish)}</Typography>
                  </> : <>
                    <Typography className="hotel-stay-list-price-value">{isEnglish ? "Current dates need a fresh quote" : "当前日期待重新核价"}</Typography>
                    <Typography color="text.secondary">{isEnglish ? "Historical prices are not reused for different dates." : "不同日期的旧报价不会拿来充当当前价格。"}</Typography>
                  </>}
                </Box>
              </Box>
              </Box>
            </Box>
          );
        })}
        {filteredCards.length === 0 && <Box className="hotel-stay-empty-state">
          <SearchIcon aria-hidden="true" />
          <Typography fontWeight={900}>{isEnglish ? "No accommodation matches these filters" : "没有符合当前条件的住宿"}</Typography>
          <Typography color="text.secondary">{isEnglish ? "Try a shorter search or reset one of the filters." : "可以缩短关键词，或切回“全部住宿 / 全部报价”。"}</Typography>
        </Box>}
        {destinationResearch && filteredCards.length > 0 && (
          <DestinationResearchCard className="hotel-stay-list-research" isEnglish={isEnglish} research={destinationResearch} />
        )}
      </Box>
    </Box>
  );
}

export function HotelComparisonView({ activeHotelId, comparison = defaultComparison, hotels = aucklandCityHotels, isEnglish, onActiveHotelChange, onSelect, selectedHotelId, stay }) {
  const visibleHotels = useMemo(() => hotels.filter((hotel) => !hotel.excludedByPreference && (!hotel.isAirbnb || hotel.isVerifiedListing)), [hotels]);
  const [gallery, setGallery] = useState(null);
  const [hotelSlideIndex, setHotelSlideIndex] = useState(0);
  const [copyResult, setCopyResult] = useState(null);
  const [listFilters, setListFilters] = useState({ priceStatus: "all", query: "", stayType: "all" });
  const dates = stay ?? comparison.dates ?? aucklandCityStay.dates;
  const nights = stayNightCount(dates.checkIn, dates.checkOut);
  const cards = useMemo(() => visibleHotels.map((hotel, index) => ({
    ...hotel,
    markerNumber: index + 1,
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
    setHotelSlideIndex(0);
    setCopyResult(null);
  }, [activeHotel?.id]);

  useEffect(() => {
    const syncGalleryFromUrl = () => {
      const url = new URL(window.location.href);
      const hasGalleryParams = url.searchParams.has(galleryPhotoParam) || url.searchParams.has(galleryIndexParam);
      if (!hasGalleryParams) {
        setGallery(null);
        return;
      }
      if (!activeHotel) {
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
  }, [activeHotel, isEnglish]);

  if (!activeHotelId) {
    return (
      <Box
        aria-label={isEnglish ? comparison.titleEn : comparison.title}
        className="hotel-comparison-page is-list"
        role="region"
      >
        <Typography className="hotel-comparison-stay-meta" color="text.secondary">
          {isEnglish ? `${dates.checkIn}—${dates.checkOut} · 2 guests · 1 room` : `${dates.label} · 2人 · 1间`}
        </Typography>
        <HotelComparisonList
          cards={cards}
          comparison={comparison}
          dates={dates}
          filters={listFilters}
          isEnglish={isEnglish}
          onFiltersChange={setListFilters}
          onHotelChange={onActiveHotelChange}
          selectedHotelId={selectedHotelId}
        />
      </Box>
    );
  }

  return (
    <Box
      aria-label={isEnglish ? comparison.titleEn : comparison.title}
      className="hotel-comparison-page"
      role="region"
    >
      <Typography className="hotel-comparison-stay-meta" color="text.secondary">
        {isEnglish ? `${dates.checkIn}—${dates.checkOut} · 2 guests · 1 room` : `${dates.label} · 2人 · 1间`}
      </Typography>
      <Box className="hotel-comparison-content">
        <HotelComparisonMap
          activeHotelId={activeHotel.id}
          comparison={comparison}
          hotels={[activeHotel]}
          isEnglish={isEnglish}
          onHotelChange={onActiveHotelChange}
        />
        {destinationResearch && (
          <DestinationResearchCard isEnglish={isEnglish} research={destinationResearch} />
        )}
        <Box className="hotel-comparison-tabs-panel hotel-comparison-detail-panel">
          <Box className="hotel-comparison-grid">
          {[activeHotel].map((hotel) => {
            const selected = hotel.id === selectedHotelId && isSelectableHotel(hotel);
            const officialPresentation = officialStatusPresentation(hotel, isEnglish);
            const accommodationImages = reviewedAccommodationImages(hotel);
            return (
              <Paper className="hotel-option-card" data-selected={selected} key={hotel.id} variant="outlined">
                <Stack className="hotel-option-heading" direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack className="hotel-option-heading-title" direction="row" alignItems="center" spacing={0.8}>
                    <Chip label={isEnglish ? hotel.recommendationEn : hotel.recommendation} size="small" />
                    <Typography
                      className="hotel-option-name"
                      component={hotel.stayUrl ? "a" : "span"}
                      href={hotel.stayUrl || undefined}
                      rel={hotel.stayUrl ? "noreferrer" : undefined}
                      target={hotel.stayUrl ? "_blank" : undefined}
                    >
                      <span className="hotel-option-name-label">{isEnglish ? (hotel.nameEn ?? hotel.name) : hotel.name}</span>
                      {hotel.stayUrl && <OpenInNewIcon aria-hidden="true" />}
                    </Typography>
                    <IconButton
                      aria-label={isEnglish ? `Copy hotel name: ${hotel.nameEn ?? hotel.name}` : `复制酒店名称：${hotel.name}`}
                      className="hotel-copy-name-button"
                      onClick={() => copyHotelName(isEnglish ? (hotel.nameEn ?? hotel.name) : hotel.name)}
                      size="small"
                      title={isEnglish ? "Copy hotel name" : "复制酒店名称"}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Stack>
                  {selected && (
                    hotel.selectionPending
                      ? <Chip color="warning" label={isEnglish ? "Preferred · not booked" : "首选 · 待预订"} size="small" />
                      : <Chip color="success" icon={<CheckCircleIcon />} label={isEnglish ? "Selected" : "已选择"} size="small" />
                  )}
                </Stack>
                {accommodationImages.length > 0 && (
                  <Box className="hotel-photo-carousel">
                    <Box component="figure" onClick={() => openGallery("hotel", accommodationImages, hotelSlideIndex, isEnglish ? "Accommodation photos" : "住宿图片")}>
                      <Box
                        alt={isEnglish ? accommodationImages[hotelSlideIndex].labelEn : accommodationImages[hotelSlideIndex].label}
                        component="img"
                        src={accommodationImages[hotelSlideIndex].src}
                      />
                      <Typography component="figcaption">
                        {hotelSlideIndex + 1} / {accommodationImages.length} · {isEnglish
                          ? accommodationImages[hotelSlideIndex].labelEn
                          : accommodationImages[hotelSlideIndex].label} · {isEnglish
                          ? englishSourceLabel(accommodationImages[hotelSlideIndex].source)
                          : accommodationImages[hotelSlideIndex].source}
                      </Typography>
                    </Box>
                    {accommodationImages.length > 1 && (
                      <>
                        <IconButton aria-label={isEnglish ? "Previous accommodation photo" : "上一张住宿图片"} className="hotel-carousel-prev" onClick={() => setHotelSlideIndex((current) => (current - 1 + accommodationImages.length) % accommodationImages.length)}><ArrowBackIosNewIcon /></IconButton>
                        <IconButton aria-label={isEnglish ? "Next accommodation photo" : "下一张住宿图片"} className="hotel-carousel-next" onClick={() => setHotelSlideIndex((current) => (current + 1) % accommodationImages.length)}><ArrowForwardIosIcon /></IconButton>
                        <Box className="hotel-carousel-dots">{accommodationImages.map((image, index) => <button aria-label={`${isEnglish ? "Show accommodation photo" : "查看住宿图片"} ${index + 1}`} className={index === hotelSlideIndex ? "is-active" : ""} key={image.src} onClick={() => setHotelSlideIndex(index)} />)}</Box>
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
                  {(hotel.ratings ?? []).map((rating) => {
                    const href = rating.sourceUrl ?? platformUrl(hotel, rating.platform);
                    return (
                    <Box
                      className={href ? "is-clickable" : ""}
                      component={href ? "a" : "div"}
                      href={href || undefined}
                      key={rating.platform}
                      rel={href ? "noreferrer" : undefined}
                      target={href ? "_blank" : undefined}
                    >
                      <Typography variant="caption">{isEnglish ? (rating.platformEn ?? rating.platform) : rating.platform}</Typography>
                      <Typography fontWeight={900}>{isEnglish ? (rating.scoreEn ?? rating.score) : rating.score}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isEnglish ? (rating.reviewsEn ?? rating.reviews) : rating.reviews}
                        {rating.reviewedAt ? ` · ${isEnglish ? "checked" : "核验"} ${rating.reviewedAt}` : ""}
                      </Typography>
                      {rating.verifiedAddress && (
                        <Typography variant="caption" color="text.secondary">
                          {isEnglish ? "Verified address" : "核验地址"}：{rating.verifiedAddress}
                        </Typography>
                      )}
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
                              alt={isEnglish
                                ? `${image.labelEn} · source: ${englishSourceLabel(image.source)}`
                                : `${image.label} · 来源：${image.source}`}
                              component="img"
                              key={image.src}
                              onClick={() => openGallery(
                                `room:${room.rateKey ?? roomIndex}`,
                                roomImages,
                                imageIndex,
                                isEnglish ? room.nameEn : room.name,
                              )}
                              src={image.src}
                            />)}
                          </Box>}
                          <Box>
                            <Typography fontWeight={900}>{isEnglish ? room.nameEn : room.name}</Typography>
                            <Typography color="text.secondary">{isEnglish ? (room.sizeEn ?? room.size) : room.size} · {isEnglish ? (room.bedEn ?? room.bed) : room.bed}</Typography>
                            <Typography>{(isEnglish ? (room.facilitiesEn ?? room.facilities) : room.facilities).join(" · ")}</Typography>
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
                                <Typography fontWeight={900}>{currencyLabel(option.nzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish ? (option.labelEn ?? option.label) : option.label} · {isEnglish ? (option.detailEn ?? option.detail) : option.detail}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(option.nzd / nights, isEnglish)}</Typography>}
                              </Box>)}
                              {officialRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(officialRate.nonRefundableNzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish
                                  ? localizedRateField(officialRate, "rateLabel", true, "Tax-inclusive total · non-refundable")
                                  : (officialRate.rateLabel ?? `${dates.label}含税总价 · 不可退款`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(officialRate.nonRefundableNzd / nights, isEnglish)}</Typography>}
                              </>}
                              {officialRate.refundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(officialRate.refundableNzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish
                                  ? localizedRateField(
                                      officialRate,
                                      "refundableRateLabel",
                                      true,
                                      officialRate.cancelUntil
                                        ? `Tax-inclusive total · free cancellation before ${cancellationDeadline(officialRate, true)}`
                                        : "Tax-inclusive refundable total · confirm the cancellation deadline",
                                    )
                                  : (officialRate.refundableRateLabel ?? (officialRate.cancelUntil
                                    ? `${dates.label}含税总价 · ${officialRate.cancelUntil} 前免费取消`
                                    : `${dates.label}含税可取消总价 · 截止时间待确认`))}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(officialRate.refundableNzd / nights, isEnglish)}</Typography>}
                              </>}
                              {localizedRateField(
                                officialRate,
                                "memberNote",
                                isEnglish,
                                isEnglish && officialRate.memberNote
                                  ? "A member rate was also recorded; confirm eligibility and final terms at checkout."
                                  : null,
                              ) && <Typography color="text.secondary">{localizedRateField(
                                officialRate,
                                "memberNote",
                                isEnglish,
                                isEnglish && officialRate.memberNote
                                  ? "A member rate was also recorded; confirm eligibility and final terms at checkout."
                                  : null,
                              )}</Typography>}
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
                                {localizedRateSource(bookingRate, isEnglish)}<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room: " : "平台房型："}{localizedRateField(bookingRate, "room", isEnglish, isEnglish ? "Recorded room type" : null).split(" · ")[0]}</Typography>
                              {bookingRate.originalCurrency && <Typography color="text.secondary">{isEnglish ? "Platform original price" : "平台原始价"}：{bookingRate.originalCurrency} {bookingRate.originalAmount}</Typography>}
                              {bookingRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(bookingRate.nonRefundableNzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish
                                  ? localizedRateField(bookingRate, "rateLabel", true, "Total · non-refundable")
                                  : (bookingRate.rateLabel ?? `${dates.label}总价 · 不可退款`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.nonRefundableNzd / nights, isEnglish)}</Typography>}
                              </>}
                              {bookingRate.refundableNzd != null && (
                                <>
                                  <Typography fontWeight={900}>{currencyLabel(bookingRate.refundableNzd, isEnglish)}</Typography>
                                  <Typography color="text.secondary">{isEnglish
                                    ? (bookingRate.cancelUntil
                                      ? `Total · free cancellation before ${cancellationDeadline(bookingRate, true)}`
                                      : "Refundable total · confirm the cancellation deadline")
                                    : (bookingRate.cancelUntil
                                      ? `${dates.label}总价 · ${bookingRate.cancelUntil} 前免费取消`
                                      : `${dates.label}可取消总价 · 截止时间待确认`)}</Typography>
                                  {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.refundableNzd / nights, isEnglish)}</Typography>}
                                </>
                              )}
                              {localizedRateField(bookingRate, "conversionNote", isEnglish) && <Typography color="text.secondary">{localizedRateField(bookingRate, "conversionNote", isEnglish)}</Typography>}
                              {(bookingRate.payment || bookingRate.breakfast) && <Typography color="text.secondary">{[
                                localizedRateField(bookingRate, "payment", isEnglish),
                                localizedRateField(bookingRate, "breakfast", isEnglish),
                              ].filter(Boolean).join(" · ")}</Typography>}
                            </Box>}
                            {agodaRate ? <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">
                                {isEnglish ? "Agoda · secondary comparison" : "Agoda · 补充比价"}<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room: " : "平台房型："}{localizedRateField(agodaRate, "room", isEnglish, isEnglish ? "Recorded room type" : null).split(" · ")[0]}</Typography>
                              {agodaRate.nonRefundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(agodaRate.nonRefundableNzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish
                                  ? localizedRateField(agodaRate, "rateLabel", true, "Member tax-inclusive total · non-refundable")
                                  : (agodaRate.rateLabel ?? `${dates.label}总价 · 会员含税不可退款`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.nonRefundableNzd / nights, isEnglish)}</Typography>}
                              </>}
                              {agodaRate.refundableNzd != null && <>
                                <Typography fontWeight={900}>{currencyLabel(agodaRate.refundableNzd, isEnglish)}</Typography>
                                <Typography color="text.secondary">{isEnglish
                                  ? (agodaRate.cancelUntil
                                    ? `Total · free cancellation before ${cancellationDeadline(agodaRate, true)}`
                                    : "Refundable total · confirm the cancellation deadline at checkout")
                                  : (agodaRate.cancelUntil
                                    ? `${dates.label}总价 · ${agodaRate.cancelUntil} 前免费取消`
                                    : `${dates.label}总价 · 免费取消，截止时间需结算页确认`)}</Typography>
                                {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.refundableNzd / nights, isEnglish)}</Typography>}
                              </>}
                              {localizedRateField(agodaRate, "conversionNote", isEnglish) && <Typography color="text.secondary">{localizedRateField(agodaRate, "conversionNote", isEnglish)}</Typography>}
                              {(agodaRate.payment || agodaRate.breakfast) && <Typography color="text.secondary">{[
                                localizedRateField(agodaRate, "payment", isEnglish),
                                localizedRateField(agodaRate, "breakfast", isEnglish),
                              ].filter(Boolean).join(" · ")}</Typography>}
                            </Box> : bookingRate && hotel.agodaStayUrl && <Box className="hotel-room-platform-pending">
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">{isEnglish ? "Agoda · secondary comparison" : "Agoda · 补充比价"}<OpenInNewIcon /></Typography>
                              <Typography fontWeight={900}>{hotel.agodaSoldOut
                                ? (isEnglish ? "Sold out on Agoda for these exact dates" : `当前酒店 ${hotel.name} 在 Agoda 所选日期已售罄`)
                                : (isEnglish ? "No verified Agoda rate for this room type" : "本房型暂无已核验 Agoda 报价")}
                              </Typography>
                              <Typography color="text.secondary">{hotel.agodaSoldOut
                                ? (isEnglish
                                  ? (hotel.agodaStatusDetailEn ?? "Agoda showed this property sold out for the exact stay dates, so no comparable total is displayed.")
                                  : hotel.agodaStatusDetail)
                                : (isEnglish ? "The hotel page may have been checked, but no matching bookable price has been recorded for this exact room type." : `当前酒店：${hotel.name}。尚未记录与“${room.name}”对应的 Agoda 可订结算总价；不会借用其他酒店、其他房型或“低至”价格。`)}</Typography>
                            </Box>}
                            {airbnbRate && <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.stayUrl} rel="noreferrer" target="_blank">
                                Airbnb<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Listing type: " : "房源类型："}{localizedRateField(airbnbRate, "room", isEnglish, isEnglish ? "Recorded listing type" : null).split(" · ")[0]}</Typography>
                              <Typography fontWeight={900}>{currencyLabel(airbnbRate.refundableNzd, isEnglish)}</Typography>
                              <Typography color="text.secondary">{isEnglish
                                ? (airbnbRate.cancelUntil
                                  ? `Total · free cancellation before ${cancellationDeadline(airbnbRate, true)}`
                                  : "Tax-inclusive total · confirm the cancellation deadline")
                                : (airbnbRate.cancelUntil
                                  ? `${dates.label}含税费总价 · ${airbnbRate.cancelUntil} 前免费取消`
                                  : `${dates.label}含税费总价 · 取消截止时间待确认`)}</Typography>
                              {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(airbnbRate.refundableNzd / nights, isEnglish)}</Typography>}
                              {(airbnbRate.payment || airbnbRate.breakfast) && <Typography color="text.secondary">{[
                                localizedRateField(airbnbRate, "payment", isEnglish),
                                localizedRateField(airbnbRate, "breakfast", isEnglish),
                              ].filter(Boolean).join(" · ")}</Typography>}
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
                <Button
                  className="hotel-select-button"
                  disabled={selected || !isSelectableHotel(hotel)}
                  fullWidth
                  onClick={() => onSelect(hotel)}
                  variant={selected ? "outlined" : "contained"}
                >
                  {hotel.officialStatus === "exact-date-unavailable"
                    ? (isEnglish ? "Unavailable for these dates · reference only" : "指定日期无房 · 仅作参考")
                    : hotel.isResearchPlaceholder
                    ? (isEnglish ? "Target-date search pending · not selectable" : "目标日期待查询 · 暂不可选")
                    : !isSelectableHotel(hotel)
                    ? (isEnglish ? "Current exact-date total required · reference only" : "需当前精确日期总价 · 仅作参考")
                    : selected
                      ? hotel.selectionPending
                        ? (isEnglish ? "Preferred option · booking pending" : "首选方案 · 仍待预订")
                        : (isEnglish ? "Current choice" : "当前选择")
                      : (isEnglish ? "Choose this hotel" : "选择这家")}
                </Button>
              </Paper>
            );
          })}
          </Box>
        </Box>
      </Box>
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
            <Box alt={isEnglish ? (galleryImage.labelEn ?? galleryImage.label) : galleryImage.label} component="img" src={galleryImage.src} />
            {galleryImages.length > 1 && (
              <IconButton aria-label={isEnglish ? "Next photo" : "下一张图片"} className="hotel-photo-lightbox-next" onClick={showNextImage}>
                <ArrowForwardIosIcon />
              </IconButton>
            )}
            <Box className="hotel-photo-lightbox-caption">
              <Typography fontWeight={900}>{isEnglish ? (activeHotel.nameEn ?? activeHotel.name) : activeHotel.name} · {gallery.title}</Typography>
              <Typography>{galleryIndex + 1} / {galleryImages.length} · {isEnglish ? (galleryImage.labelEn ?? galleryImage.label) : galleryImage.label}</Typography>
              <Typography>{isEnglish ? "Source: " : "图片来源："}{isEnglish ? englishSourceLabel(galleryImage.source) : galleryImage.source}</Typography>
            </Box>
            {galleryImages.length > 1 && <Box className="hotel-photo-lightbox-gallery" aria-label={isEnglish ? "Photo gallery" : "图片画廊"}>
              {galleryImages.map((image, index) => <button aria-label={`${isEnglish ? "Show photo" : "查看图片"} ${index + 1}：${isEnglish ? (image.labelEn ?? image.label) : image.label}`} className={index === galleryIndex ? "is-active" : ""} key={image.src} onClick={() => selectGalleryImage(index)}>
                <img alt="" src={image.src} />
              </button>)}
            </Box>}
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
