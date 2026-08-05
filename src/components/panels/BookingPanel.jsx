import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Card, Dialog, IconButton, LinearProgress, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HotelIcon from "@mui/icons-material/Hotel";
import LuggageIcon from "@mui/icons-material/Luggage";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DirectionsOutlinedIcon from "@mui/icons-material/DirectionsOutlined";
import MyLocationOutlinedIcon from "@mui/icons-material/MyLocationOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import sharedHotelSelections from "../../data/hotel-selections.json";
import { AUCKLAND_AIRPORT_SELECTION_KEY } from "../../data/aucklandAirportHotels";
import { aucklandCityHotels, aucklandCityStay } from "../../data/aucklandCityHotels";
import { confirmedAccommodationBookings } from "../../data/confirmedAccommodationBookings";
import { confirmedStayMedia } from "../../data/confirmedStayMedia";
import { regionalHotels, regionalStays } from "../../data/regionalHotels";
import { useLanguage } from "../../LanguageContext";
import { usePrivateVault } from "../../PrivateVaultContext";
import { AccommodationMap } from "../AccommodationMap";
import { attractionPinsByRegion, HotelComparisonView } from "../HotelComparisonDialog";
import { CalendarDayCell, CalendarGrid, CalendarWeekdays } from "../calendar/CalendarPrimitives";
import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./BookingPanel.css";

const accommodationBookingIds = [
  "hotel-queenstown",
  "hotel-wanaka",
  "mount-cook",
  "hotel-oamaru",
  "hotel-christchurch",
  "hotel-auckland-city",
];
const confirmedStayUrlParam = "stay";

const comparisonRegionLabels = {
  "auckland-city": { en: "Central Auckland", zh: "奥克兰市中心" },
  queenstown: { en: "Queenstown", zh: "皇后镇" },
  wanaka: { en: "Wānaka", zh: "瓦纳卡" },
  "mount-cook": { en: "Aoraki / Mount Cook", zh: "库克山及周边" },
  oamaru: { en: "Ōamaru", zh: "奥马鲁" },
  christchurch: { en: "Christchurch", zh: "基督城" },
};

const queenstownBooking = confirmedAccommodationBookings["hotel-queenstown"];
const wanakaBooking = confirmedAccommodationBookings["hotel-wanaka"];
const oamaruBooking = confirmedAccommodationBookings["hotel-oamaru"];
const christchurchBooking = confirmedAccommodationBookings["hotel-christchurch"];
const aucklandCityBooking = confirmedAccommodationBookings["hotel-auckland-city"];

const accommodationCalendar = [
  { date: "9/28", stayGroup: "airport-transit", place: "奥克兰机场过夜候机", placeEn: "Overnight at Auckland Airport", status: "不住酒店", statusEn: "No hotel", tone: "flight", noStay: true },
  { date: "9/29", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: queenstownBooking.listingName, hotelEn: queenstownBooking.listingNameEn, place: "皇后镇", placeEn: "Queenstown", status: "第 1 晚", statusEn: "Night 1", tone: "queenstown", confirmed: true, bookedStay: true },
  { date: "9/30", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: queenstownBooking.listingName, hotelEn: queenstownBooking.listingNameEn, place: "皇后镇", placeEn: "Queenstown", status: "第 2 晚", statusEn: "Night 2", tone: "queenstown", confirmed: true, bookedStay: true },
  { date: "10/1", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: queenstownBooking.listingName, hotelEn: queenstownBooking.listingNameEn, place: "皇后镇", placeEn: "Queenstown", status: "第 3 晚", statusEn: "Night 3", tone: "queenstown", confirmed: true, bookedStay: true },
  { date: "10/2", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: queenstownBooking.listingName, hotelEn: queenstownBooking.listingNameEn, place: "皇后镇", placeEn: "Queenstown", status: "第 4 晚", statusEn: "Night 4", tone: "queenstown", confirmed: true, bookedStay: true },
  { date: "10/3", bookingId: "hotel-wanaka", stayGroup: "wanaka", hotel: wanakaBooking.listingName, hotelEn: wanakaBooking.listingNameEn, place: "瓦纳卡", placeEn: "Wānaka", status: "第 1 晚", statusEn: "Night 1", tone: "wanaka", confirmed: true, position: [-44.7047, 169.1216], mapQuery: "Wanaka Luxury Apartments" },
  { date: "10/4", bookingId: "hotel-wanaka", stayGroup: "wanaka", hotel: wanakaBooking.listingName, hotelEn: wanakaBooking.listingNameEn, place: "瓦纳卡", placeEn: "Wānaka", status: "第 2 晚", statusEn: "Night 2", tone: "wanaka", confirmed: true },
  { date: "10/5", bookingId: "mount-cook", stayGroup: "mount-cook", hotel: "The Hermitage · Mt Cook Motel Studio Queen", place: "库克山村", placeEn: "Aoraki / Mount Cook Village", status: "住 1 晚", statusEn: "1 night", tone: "mount-cook", confirmed: true, position: [-43.7363846, 170.0987676], mapQuery: "Mt Cook Lodge & Motels New Zealand" },
  { date: "10/6", bookingId: "hotel-oamaru", stayGroup: "oamaru", hotel: oamaruBooking.listingName, hotelEn: oamaruBooking.listingNameEn, place: "奥马鲁", placeEn: "Ōamaru", status: "住 1 晚", statusEn: "1 night", tone: "oamaru", confirmed: true, bookedStay: true },
  { date: "10/7", bookingId: "hotel-christchurch", stayGroup: "christchurch", hotel: christchurchBooking.listingName, hotelEn: christchurchBooking.listingNameEn, place: "基督城", placeEn: "Christchurch", status: "住 1 晚", statusEn: "1 night", tone: "christchurch", confirmed: true, bookedStay: true },
  { date: "10/8", bookingId: "hotel-auckland-city", stayGroup: "auckland-city", hotel: aucklandCityBooking.listingName, hotelEn: aucklandCityBooking.listingNameEn, place: "奥克兰市中心", placeEn: "Central Auckland", status: "第 1 晚", statusEn: "Night 1", tone: "auckland-city", confirmed: true, bookedStay: true, position: [-36.8467, 174.7598], mapQuery: "Hotel Grand Chancellor Auckland" },
  { date: "10/9", bookingId: "hotel-auckland-city", stayGroup: "auckland-city", hotel: aucklandCityBooking.listingName, hotelEn: aucklandCityBooking.listingNameEn, place: "奥克兰市中心", placeEn: "Central Auckland", status: "第 2 晚", statusEn: "Night 2", tone: "auckland-city", confirmed: true, bookedStay: true },
  { date: "10/10", place: "奥克兰市中心 → 机场", placeEn: "Central Auckland → airport", status: "退房 · 夜间返程", statusEn: "Check out · overnight flight", tone: "flight", noStay: true },
  { date: "10/11", place: "返程途中", placeEn: "In transit", status: "吉隆坡转机", statusEn: "Kuala Lumpur connection", tone: "flight", noStay: true },
];

function readSavedHotelId(region, fallbackId) {
  try {
    const local = JSON.parse(localStorage.getItem(AUCKLAND_AIRPORT_SELECTION_KEY));
    return local?.regions?.[region]?.hotelId
      ?? sharedHotelSelections.regions[region]?.hotelId
      ?? fallbackId;
  } catch {
    return sharedHotelSelections.regions[region]?.hotelId ?? fallbackId;
  }
}

function readSavedSelections() {
  try {
    return JSON.parse(localStorage.getItem(AUCKLAND_AIRPORT_SELECTION_KEY)) ?? sharedHotelSelections;
  } catch {
    return sharedHotelSelections;
  }
}

function stayDatesBetween(checkIn, checkOut) {
  const dates = [];
  const cursor = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function stayDatesForRegion(region) {
  const stay = region === "auckland-city" ? aucklandCityStay : regionalStays[region];
  return stay ? stayDatesBetween(stay.dates.checkIn, stay.dates.checkOut) : [];
}

function comparisonHotelsForRegion(region) {
  if (region === "auckland-city") return aucklandCityHotels;
  return regionalHotels[region] ?? [];
}

function visibleComparisonHotels(region) {
  return comparisonHotelsForRegion(region).filter(
    (hotel) => !hotel.excludedByPreference && (!hotel.isAirbnb || hotel.isVerifiedListing),
  );
}

function fallbackComparisonHotelId(region, hotels = visibleComparisonHotels(region)) {
  const configuredId = region === "auckland-city"
    ? aucklandCityStay.selectedHotelId
    : regionalStays[region]?.selectedHotelId;
  const savedId = readSavedHotelId(region, configuredId ?? hotels[0]?.id);
  return hotels.some((hotel) => hotel.id === savedId) ? savedId : hotels[0]?.id;
}

function readComparisonUrl() {
  const url = new URL(window.location.href);
  if (url.hash !== "#booking") return null;
  const region = url.searchParams.get("compare");
  const hotels = visibleComparisonHotels(region);
  if (!region || hotels.length === 0) return null;
  const requestedHotelId = url.searchParams.get("hotel");
  const hotelId = hotels.some((hotel) => hotel.id === requestedHotelId) ? requestedHotelId : null;
  return { region, hotelId };
}

function readConfirmedStayUrl() {
  const url = new URL(window.location.href);
  if (url.hash !== "#booking" || url.searchParams.has("compare")) return null;
  const bookingId = url.searchParams.get(confirmedStayUrlParam);
  return accommodationCalendar.find((stay) => stay.confirmed && stay.bookingId === bookingId) ?? null;
}

function writeComparisonUrl(view, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (view) {
    url.searchParams.delete(confirmedStayUrlParam);
    url.searchParams.set("compare", view.region);
    if (view.hotelId) url.searchParams.set("hotel", view.hotelId);
    else url.searchParams.delete("hotel");
    url.searchParams.delete("photo");
    url.searchParams.delete("photoIndex");
    url.hash = "booking";
  } else {
    url.searchParams.delete("compare");
    url.searchParams.delete("hotel");
    url.searchParams.delete("photo");
    url.searchParams.delete("photoIndex");
  }
  history[method](state, "", url);
}

function writeConfirmedStayUrl(stay, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (stay) {
    url.searchParams.set(confirmedStayUrlParam, stay.bookingId);
    url.searchParams.delete("compare");
    url.searchParams.delete("hotel");
    url.searchParams.delete("photo");
    url.searchParams.delete("photoIndex");
    url.hash = "booking";
  } else {
    url.searchParams.delete(confirmedStayUrlParam);
  }
  history[method](state, "", url);
}

function calendarGroupForRegion(region) {
  return region;
}

function calendarDate(dateLabel) {
  const [month, day] = dateLabel.split("/").map(Number);
  return new Date(Date.UTC(2026, month - 1, day));
}

function mondayFirstColumn(dateLabel) {
  return ((calendarDate(dateLabel).getUTCDay() + 6) % 7) + 1;
}

function accommodationSegments(stays) {
  return stays.reduce((segments, stay) => {
    const previousSegment = segments.at(-1);
    const previousStay = previousSegment?.stays.at(-1);
    const previousDate = previousStay ? calendarDate(previousStay.date) : null;
    const currentDate = calendarDate(stay.date);
    const continuesPreviousStay = Boolean(
      stay.hotel
      && previousStay?.hotel
      && stay.stayGroup === previousStay.stayGroup
      && stay.hotel === previousStay.hotel
      && currentDate.getTime() - previousDate.getTime() === 86400000
      && mondayFirstColumn(stay.date) !== 1,
    );

    if (continuesPreviousStay) {
      previousSegment.stays.push(stay);
      return segments;
    }

    segments.push({
      key: `${stay.date}-${stay.stayGroup ?? "transit"}`,
      stays: [stay],
    });
    return segments;
  }, []);
}

function AccommodationCalendar({ checked, confirmedCount, isEnglish, onDetailChange, percent }) {
  const { data: vaultData, isUnlocked } = usePrivateVault();
  const initialCityHotel = aucklandCityHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-city", aucklandCityStay.selectedHotelId))
    ?? aucklandCityHotels[0];
  const initialRegionalIds = Object.fromEntries(
    Object.keys(regionalStays).map((region) => [region, fallbackComparisonHotelId(region)]),
  );
  const [cityHotelId, setCityHotelId] = useState(initialCityHotel.id);
  const [regionalHotelIds, setRegionalHotelIds] = useState(initialRegionalIds);
  const [selectedHotel, setSelectedHotel] = useState(initialCityHotel.name);
  const [selectedStayGroup, setSelectedStayGroup] = useState(null);
  const [selectedConfirmedStay, setSelectedConfirmedStay] = useState(() => readConfirmedStayUrl());
  const [comparisonView, setComparisonView] = useState(() => readComparisonUrl());
  const comparisonRegion = comparisonView?.region ?? null;
  const weekdays = isEnglish
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const selectedPrivateStay = isUnlocked && selectedConfirmedStay
    ? vaultData?.accommodations?.[selectedConfirmedStay.bookingId]
    : null;

  const cityHotel = aucklandCityHotels.find((hotel) => hotel.id === cityHotelId) ?? aucklandCityHotels[0];
  const displayedCalendar = accommodationCalendar.map((stay) => {
    if (stay.bookedStay) return stay;
    if (stay.stayGroup === "auckland-city" && stay.hotel) return { ...stay, hotel: cityHotel.name, hotelEn: cityHotel.nameEn ?? cityHotel.name, position: stay.position ? cityHotel.position : undefined, mapQuery: cityHotel.mapQuery };
    if (regionalHotels[stay.stayGroup] && stay.hotel) {
      const selected = regionalHotels[stay.stayGroup].find((hotel) => hotel.id === regionalHotelIds[stay.stayGroup]) ?? regionalHotels[stay.stayGroup][0];
      return { ...stay, hotel: selected.name, hotelEn: selected.nameEn ?? selected.name, position: stay.position ? selected.position : undefined, mapQuery: selected.mapQuery };
    }
    return stay;
  });
  const displayedSegments = accommodationSegments(displayedCalendar);
  const hotels = [...new Map(
    displayedCalendar
      .filter((stay) => stay.hotel && stay.position)
      .map((stay) => [stay.hotel, { ...stay, onSelect: setSelectedHotel }]),
  ).values()];

  const openComparison = (region) => {
    if (visibleComparisonHotels(region).length === 0) return;
    const view = { region, hotelId: null };
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    setComparisonView(view);
    setSelectedConfirmedStay(null);
    writeComparisonUrl(view, "pushState", {
      ...currentState,
      hotelComparison: "list",
      hotelComparisonBackDepth: 1,
      hotelComparisonBackToList: false,
    });
  };

  const backFromComparison = useCallback(() => {
    if (!comparisonView) return;

    if (comparisonView.hotelId) {
      if (history.state?.hotelComparison === "detail" && history.state?.hotelComparisonBackToList) {
        history.back();
        return;
      }
      const listView = { region: comparisonView.region, hotelId: null };
      const currentState = history.state && typeof history.state === "object" ? history.state : {};
      setComparisonView(listView);
      writeComparisonUrl(listView, "replaceState", {
        ...currentState,
        hotelComparison: "list",
        hotelComparisonBackDepth: 0,
        hotelComparisonBackToList: false,
      });
      return;
    }

    setComparisonView(null);
    if (history.state?.hotelComparison === "list" && history.state?.hotelComparisonBackDepth === 1) {
      history.back();
      return;
    }
    writeComparisonUrl(null);
  }, [comparisonView]);

  const backToAccommodationCalendar = useCallback(() => {
    const backDepth = history.state?.hotelComparisonBackDepth;
    setComparisonView(null);
    if (Number.isInteger(backDepth) && backDepth > 0) {
      history.go(-backDepth);
      return;
    }
    writeComparisonUrl(null);
  }, []);

  const backFromConfirmedStay = useCallback(() => {
    setSelectedConfirmedStay(null);
    writeConfirmedStayUrl(null);
  }, []);

  const changeComparisonHotel = (hotelId) => {
    if (!comparisonRegion || !visibleComparisonHotels(comparisonRegion).some((hotel) => hotel.id === hotelId)) return;
    if (comparisonView?.hotelId === hotelId) return;
    const view = { region: comparisonRegion, hotelId };
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    const entersFromList = !comparisonView?.hotelId;
    const listWasOpenedFromCalendar = entersFromList
      && currentState.hotelComparison === "list"
      && currentState.hotelComparisonBackDepth === 1;
    setComparisonView(view);
    writeComparisonUrl(view, entersFromList ? "pushState" : "replaceState", {
      ...currentState,
      hotelComparison: "detail",
      hotelComparisonBackDepth: listWasOpenedFromCalendar ? 2 : (currentState.hotelComparisonBackDepth ?? 0),
      hotelComparisonBackToList: entersFromList || Boolean(currentState.hotelComparisonBackToList),
    });
  };

  useEffect(() => {
    const syncComparisonFromUrl = () => {
      const next = readComparisonUrl();
      setComparisonView(next);
      setSelectedConfirmedStay(readConfirmedStayUrl());
      if (next) {
        setSelectedStayGroup(calendarGroupForRegion(next.region));
        const selected = next.hotelId
          ? comparisonHotelsForRegion(next.region).find((hotel) => hotel.id === next.hotelId)
          : null;
        if (selected) setSelectedHotel(selected.name);
        const url = new URL(window.location.href);
        if (url.searchParams.get("compare") !== next.region || url.searchParams.get("hotel") !== next.hotelId) {
          writeComparisonUrl(next);
        }
      } else {
        const url = new URL(window.location.href);
        if (url.hash === "#booking" && ["compare", "hotel", "photo", "photoIndex"].some((param) => url.searchParams.has(param))) {
          writeComparisonUrl(null);
        }
      }
    };

    syncComparisonFromUrl();
    window.addEventListener("hashchange", syncComparisonFromUrl);
    window.addEventListener("popstate", syncComparisonFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncComparisonFromUrl);
      window.removeEventListener("popstate", syncComparisonFromUrl);
    };
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (selectedConfirmedStay) {
      onDetailChange({
        label: confirmedStayName(selectedConfirmedStay, isEnglish, selectedPrivateStay),
        actions: <StayHeaderActions isEnglish={isEnglish} privateStay={selectedPrivateStay} stay={selectedConfirmedStay} />,
        onBack: backFromConfirmedStay,
        onRoot: backFromConfirmedStay,
      });
      return;
    }
    if (!comparisonRegion) {
      onDetailChange(null);
      return;
    }
    const labels = comparisonRegionLabels[comparisonRegion];
    const activeHotel = comparisonView?.hotelId
      ? visibleComparisonHotels(comparisonRegion).find((hotel) => hotel.id === comparisonView.hotelId)
      : null;
    onDetailChange({
      ancestors: activeHotel ? [{
        label: labels?.[isEnglish ? "en" : "zh"] ?? (isEnglish ? "Accommodation options" : "住宿选择"),
        onClick: backFromComparison,
      }] : [],
      label: activeHotel?.[isEnglish ? "nameEn" : "name"]
        ?? activeHotel?.name
        ?? labels?.[isEnglish ? "en" : "zh"]
        ?? (isEnglish ? "Accommodation options" : "住宿选择"),
      onBack: backFromComparison,
      onRoot: backToAccommodationCalendar,
    });
  }, [backFromComparison, backFromConfirmedStay, backToAccommodationCalendar, comparisonRegion, comparisonView?.hotelId, isEnglish, onDetailChange, selectedConfirmedStay, selectedPrivateStay]);

  useEffect(() => () => onDetailChange?.(null), [onDetailChange]);

  const chooseHotel = async (region, hotel) => {
    const savedSelections = readSavedSelections();
    const selection = {
      updatedAt: new Date().toISOString(),
      regions: {
        ...sharedHotelSelections.regions,
        ...savedSelections.regions,
        [region]: { hotelId: hotel.id, hotelName: hotel.name, stayDates: stayDatesForRegion(region) },
      },
    };
    if (region === "auckland-city") setCityHotelId(hotel.id);
    if (regionalHotels[region]) setRegionalHotelIds((current) => ({ ...current, [region]: hotel.id }));
    setSelectedHotel(hotel.name);
    localStorage.setItem(AUCKLAND_AIRPORT_SELECTION_KEY, JSON.stringify(selection));
    const backDepth = history.state?.hotelComparisonBackDepth;
    setComparisonView(null);
    if (Number.isInteger(backDepth) && backDepth > 0) history.go(-backDepth);
    else writeComparisonUrl(null);
    try {
      await fetch("/api/hotel-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
      });
    } catch {
      // The static build still retains the choice in localStorage.
    }
  };

  if (selectedConfirmedStay) {
    return <ConfirmedStayDetail isEnglish={isEnglish} privateStay={selectedPrivateStay} stay={selectedConfirmedStay} />;
  }

  if (comparisonRegion) {
    return (
      <HotelComparisonView
        activeHotelId={comparisonView.hotelId ?? null}
        comparison={comparisonRegion === "auckland-city" ? aucklandCityStay : (regionalStays[comparisonRegion] ?? undefined)}
        hotels={comparisonHotelsForRegion(comparisonRegion)}
        isEnglish={isEnglish}
        onActiveHotelChange={changeComparisonHotel}
        onSelect={(hotel) => chooseHotel(comparisonRegion, hotel)}
        selectedHotelId={comparisonRegion === "auckland-city" ? cityHotelId : regionalHotelIds[comparisonRegion]}
        stay={comparisonRegion === "auckland-city" ? aucklandCityStay.dates : regionalStays[comparisonRegion]?.dates}
      />
    );
  }

  return (
    <Box className="route-day-calendar accommodation-calendar">
      <Card className="route-month accommodation-overview-card" variant="outlined">
        <Box className="accommodation-progress-strip">
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography className="accommodation-progress-title">
                {isEnglish ? "Accommodation confirmations" : "住宿确认进度"}
              </Typography>
              <Typography color="text.secondary">
                {isEnglish
                  ? `${confirmedCount} of ${accommodationBookingIds.length} stays confirmed`
                  : `已确认 ${confirmedCount} / ${accommodationBookingIds.length} 处住宿`}
              </Typography>
            </Box>
            <Typography className="accommodation-progress-percent">{percent}%</Typography>
          </Stack>
          <LinearProgress aria-label={isEnglish ? "Accommodation confirmation progress" : "住宿确认进度"} variant="determinate" value={percent} />
        </Box>
        <AccommodationMap hotels={hotels} isEnglish={isEnglish} selectedHotel={selectedHotel} />
        <Stack className="accommodation-calendar-title" direction="row" alignItems="center" spacing={1}>
          <HotelIcon aria-hidden="true" />
          <Box>
            <Typography className="route-month-title">
              {isEnglish ? "Accommodation calendar · 28 Sep—11 Oct" : "住宿日历 · 9月28日—10月11日"}
            </Typography>
            <Typography color="text.secondary">
              {isEnglish ? "Select a confirmed stay to view its details; select a pending stay for hotel options. Green means confirmed and red means pending." : "点击已确认住宿查看入住详情；点击待确认日期打开酒店比选。顶部绿线表示已确认，红线表示待确认。"}
            </Typography>
          </Box>
        </Stack>
        <Box className="accommodation-calendar-grid-scroll">
          <CalendarWeekdays labels={weekdays} />
          <CalendarGrid>
            {displayedSegments.map((segment, segmentIndex) => {
              const segmentStay = segment.stays[0];
              const segmentLength = segment.stays.length;
              const segmentIsConfirmed = Boolean(segmentStay.confirmed || checked[segmentStay.bookingId]);
              const segmentConfirmationLabel = isEnglish
                ? (segmentIsConfirmed ? "Confirmed" : "Pending")
                : (segmentIsConfirmed ? "已确认" : "待确认");
              const segmentPlace = isEnglish ? segmentStay.placeEn : segmentStay.place;
              const segmentHotel = isEnglish ? (segmentStay.hotelEn ?? segmentStay.hotel) : segmentStay.hotel;
              const segmentAriaLabel = segmentStay.hotel
                ? (isEnglish
                  ? `${segmentPlace}, ${segmentHotel}, ${segmentLength} night${segmentLength > 1 ? "s" : ""}, ${segmentConfirmationLabel}`
                  : `${segmentPlace}，${segmentStay.hotel}，${segmentLength} 晚，${segmentConfirmationLabel}`)
                : undefined;
              const segmentStyle = segmentIndex === 0
                ? { gridColumn: `${mondayFirstColumn(segmentStay.date)} / span ${segmentLength}` }
                : { gridColumn: `span ${segmentLength}` };
              return (
                <Box
                  aria-label={segmentAriaLabel}
                  className="accommodation-stay-segment"
                  data-confirmation={segmentStay.hotel ? (segmentIsConfirmed ? "confirmed" : "pending") : undefined}
                  data-multi-night={segmentLength > 1 || undefined}
                  data-selected={segmentStay.stayGroup === selectedStayGroup || undefined}
                  data-tone={segmentStay.tone}
                  key={segment.key}
                  role={segmentStay.hotel ? "group" : undefined}
                  style={segmentStyle}
                >
                  <Box
                    className="accommodation-stay-segment-days"
                    style={{ gridTemplateColumns: `repeat(${segmentLength}, minmax(0, 1fr))` }}
                  >
                    {segment.stays.map((stay) => {
            const selectStay = () => {
              setSelectedHotel(stay.hotel);
              setSelectedStayGroup(stay.stayGroup);
              if (stay.confirmed) {
                setSelectedConfirmedStay(stay);
                writeConfirmedStayUrl(stay, "pushState");
                return;
              }
              setSelectedConfirmedStay(null);
              if (stay.stayGroup === "auckland-city" && stay.hotel) openComparison("auckland-city");
              if (regionalHotels[stay.stayGroup] && stay.hotel) openComparison(stay.stayGroup);
            };
            const cellLabel = isEnglish
              ? `${stay.date}, ${stay.placeEn}, ${stay.hotelEn ?? stay.hotel}, ${segmentConfirmationLabel}. ${stay.confirmed ? "View stay details" : "Open accommodation options"}`
              : `${stay.date}，${stay.place}，${stay.hotel}，${segmentConfirmationLabel}。${stay.confirmed ? "查看入住详情" : "打开住宿比选"}`;

            return stay.hotel ? (
              <CalendarDayCell
                aria-label={cellLabel}
                aria-pressed={stay.stayGroup === selectedStayGroup}
                className="accommodation-day-cell"
                component={ButtonBase}
                data-booking-id={stay.bookingId}
                data-date={stay.date}
                data-tone={stay.tone}
                date={stay.date}
                dateHeaderClassName="accommodation-date"
                key={stay.date}
                onClick={selectStay}
              />
            ) : (
              <CalendarDayCell
                aria-label={isEnglish
                  ? `${stay.date}, no accommodation, ${stay.placeEn}`
                  : `${stay.date}，无住宿，${stay.place}`}
                className="accommodation-day-cell is-no-stay"
                data-date={stay.date}
                data-tone={stay.tone}
                date={stay.date}
                dateHeaderClassName="accommodation-date"
                key={stay.date}
              >
                <Box className="accommodation-place">
                  <LuggageIcon aria-hidden="true" />
                  <Typography>{isEnglish ? stay.placeEn : stay.place}</Typography>
                </Box>
              </CalendarDayCell>
            );
                    })}
                  </Box>
                  {segmentStay.hotel && (
                    <Box className="accommodation-stay-segment-content">
                      <Typography className="accommodation-status-sr-only">
                        {segmentConfirmationLabel}
                      </Typography>
                      <Box aria-hidden="true" className="accommodation-stay-segment-summary">
                        <Box className="accommodation-place">
                          <HotelIcon aria-hidden="true" />
                          <Typography>{isEnglish ? segmentStay.placeEn : segmentStay.place}</Typography>
                        </Box>
                        <Typography
                          className="accommodation-hotel-name"
                          component="span"
                          title={segmentHotel}
                        >
                          {segmentHotel}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </CalendarGrid>
        </Box>
      </Card>
    </Box>
  );
}

function confirmedStayName(stay, isEnglish, privateStay) {
  const privateName = isEnglish
    ? (privateStay?.propertyNameEn ?? privateStay?.propertyName ?? privateStay?.住宿名称)
    : (privateStay?.propertyNameZh ?? privateStay?.住宿名称 ?? privateStay?.propertyName);
  if (typeof privateName === "string" && privateName.trim()) return privateName.trim();
  const host = privateStay?.房东;
  const source = confirmedAccommodationBookings[stay.bookingId]?.source ?? "";
  if (typeof host === "string" && host.trim() && source.includes("Airbnb")) {
    return isEnglish
      ? `${stay.placeEn ?? stay.place} Airbnb home · host ${host.trim()}`
      : `${stay.place} · ${host.trim()} 的 Airbnb 房源`;
  }
  return isEnglish ? (stay.hotelEn ?? stay.hotel) : stay.hotel;
}

function privateFact(privateStay, key, label) {
  const value = privateStay?.[key];
  if (value === undefined || value === null || value === "") return null;
  return [label, value];
}

function privateFacts(privateStay, isEnglish, fields) {
  return fields
    .map(([key, zhLabel, enLabel]) => privateFact(privateStay, key, isEnglish ? (enLabel ?? zhLabel) : zhLabel))
    .filter(Boolean);
}

function stayImages(hotel, privateStay, bookingId) {
  const privateImages = Array.isArray(privateStay?.media) ? privateStay.media : [];
  const confirmedImages = confirmedStayMedia[bookingId] ?? [];
  const hotelImages = [
    ...(hotel?.hotelImages ?? []),
    ...(hotel?.roomTypes?.flatMap((room) => room.images ?? []) ?? []),
  ];
  const seen = new Set();
  return [...confirmedImages, ...privateImages, ...hotelImages].filter((image) => {
    if (!image || typeof image.src !== "string" || !image.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

function StayImageGallery({ imageAlt, images, isEnglish }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const galleryImages = images;
  const imageCount = galleryImages.length;
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];
  const goToImage = useCallback((nextIndex) => {
    setActiveIndex((current) => {
      const normalized = typeof nextIndex === "function" ? nextIndex(current) : nextIndex;
      return ((normalized % imageCount) + imageCount) % imageCount;
    });
  }, [imageCount]);

  useEffect(() => {
    if (!isFullscreen || imageCount < 2) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToImage((current) => current - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToImage((current) => current + 1);
      }
      if (event.key === "Escape" || event.key === "Esc" || event.code === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [goToImage, imageCount, isFullscreen]);

  if (!activeImage) return null;
  const currentLabel = activeImage.label ?? `${imageAlt} · ${activeIndex + 1}`;
  const previousLabel = isEnglish ? "Previous image" : "上一张";
  const nextLabel = isEnglish ? "Next image" : "下一张";
  return (
    <>
      <Box aria-label={imageAlt} className="confirmed-stay-gallery">
        <ButtonBase
          aria-label={isEnglish ? `View ${currentLabel}` : `查看${currentLabel}`}
          className="confirmed-stay-gallery-image"
          onClick={() => setIsFullscreen(true)}
        >
          <Box alt={currentLabel} component="img" src={activeImage.src} />
        </ButtonBase>
        {imageCount > 1 && <>
          <IconButton aria-label={previousLabel} className="confirmed-stay-gallery-previous" onClick={() => goToImage((current) => current - 1)} size="small">
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label={nextLabel} className="confirmed-stay-gallery-next" onClick={() => goToImage((current) => current + 1)} size="small">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </>}
        <Typography className="confirmed-stay-gallery-count" component="span" variant="caption">{activeIndex + 1} / {imageCount}</Typography>
      </Box>
      <Dialog
        aria-label={isEnglish ? `View ${imageAlt} fullscreen` : `全屏查看${imageAlt}`}
        className="confirmed-stay-gallery-dialog"
        fullScreen
        onKeyDownCapture={(event) => {
          if (event.key === "Escape" || event.key === "Esc" || event.code === "Escape") setIsFullscreen(false);
        }}
        onClose={() => setIsFullscreen(false)}
        open={isFullscreen}
      >
        <Box className="confirmed-stay-gallery-fullscreen">
          <IconButton aria-label={isEnglish ? "Close fullscreen gallery" : "关闭全屏图库"} className="confirmed-stay-gallery-close" onClick={() => setIsFullscreen(false)}>
            <CloseIcon />
          </IconButton>
          <Typography className="confirmed-stay-gallery-fullscreen-count" component="span">{activeIndex + 1} / {imageCount}</Typography>
          {imageCount > 1 && <IconButton aria-label={previousLabel} className="confirmed-stay-gallery-fullscreen-previous" onClick={() => goToImage((current) => current - 1)}>
            <ChevronLeftIcon />
          </IconButton>}
          <Box alt={currentLabel} className="confirmed-stay-gallery-fullscreen-image" component="img" src={activeImage.src} />
          {imageCount > 1 && <IconButton aria-label={nextLabel} className="confirmed-stay-gallery-fullscreen-next" onClick={() => goToImage((current) => current + 1)}>
            <ChevronRightIcon />
          </IconButton>}
          {imageCount > 1 && <Box aria-label={isEnglish ? "Gallery thumbnails" : "图库缩略图"} className="confirmed-stay-gallery-thumbnails">
            {galleryImages.map((image, index) => (
              <ButtonBase aria-label={isEnglish ? `View image ${index + 1}` : `查看第 ${index + 1} 张`} className={index === activeIndex ? "is-active" : undefined} key={image.src} onClick={() => goToImage(index)}>
                <Box alt={image.label ?? `${imageAlt} · ${index + 1}`} component="img" src={image.src} />
              </ButtonBase>
            ))}
          </Box>}
        </Box>
      </Dialog>
    </>
  );
}

function propertyLinkLabel({ booking, isEnglish, privateStay }) {
  if (privateStay?.platform === "Airbnb" || booking?.source?.includes("Airbnb")) {
    return isEnglish ? "View Airbnb listing" : "查看 Airbnb 房源";
  }
  return isEnglish ? "View property page" : "查看酒店详情";
}

function StayHeaderActions({ isEnglish, privateStay, stay }) {
  const booking = confirmedAccommodationBookings[stay.bookingId];
  const hotel = bookedHotel(stay, booking);
  const propertyUrl = privateStay?.propertyUrl ?? hotel?.officialUrl ?? hotel?.bookingUrl;
  const orderUrl = privateStay?.orderUrl;
  if (!propertyUrl && !orderUrl) return null;

  return (
    <Stack className="stay-header-actions" direction="row" spacing={0.5}>
      {propertyUrl && (
        <Tooltip title={propertyLinkLabel({ booking, isEnglish, privateStay })}>
          <IconButton
            aria-label={propertyLinkLabel({ booking, isEnglish, privateStay })}
            className={privateStay?.platform === "Airbnb" || booking?.source?.includes("Airbnb") ? "stay-header-action-airbnb" : undefined}
            component="a"
            href={propertyUrl}
            rel="noreferrer"
            target="_blank"
          >
            {privateStay?.platform === "Airbnb" || booking?.source?.includes("Airbnb")
              ? <Box alt="Airbnb" className="stay-header-airbnb-logo" component="img" src="https://cdn.simpleicons.org/airbnb/FF385C" />
              : <OpenInNewIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
      {orderUrl && (
        <Tooltip title={isEnglish ? "Open booking details" : "打开订单详情"}>
          <IconButton aria-label={isEnglish ? "Open booking details" : "打开订单详情"} component="a" href={orderUrl} rel="noreferrer" target="_blank">
            <ReceiptLongOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

function ConfirmedStayDetail({ isEnglish, privateStay, stay }) {
  const booking = confirmedAccommodationBookings[stay.bookingId];
  const hotel = bookedHotel(stay, booking);
  const title = confirmedStayName(stay, isEnglish, privateStay);
  const dates = booking ? `${booking.checkIn} — ${booking.checkOut}` : "—";
  const images = stayImages(hotel, privateStay, stay.bookingId);
  const primaryStayFacts = [
    [isEnglish ? "Location" : "地点", isEnglish ? stay.placeEn : stay.place],
    [isEnglish ? "Dates" : "日期", dates],
    booking?.checkInTime && [isEnglish ? "Check-in / out" : "入住 / 退房", isEnglish ? `${booking.checkInTimeEn} / ${booking.checkOutTimeEn}` : `${booking.checkInTime} / ${booking.checkOutTime}`],
  ].filter(Boolean);
  const secondaryStayFacts = [
    booking?.guests && [isEnglish ? "Guests" : "同行者", isEnglish ? booking.guestsEn : booking.guests],
    privateStay?.房东 && [isEnglish ? "Host" : "房东", privateStay.房东],
    privateStay?.准确地址 && [isEnglish ? "Exact address" : "准确地址", privateStay.准确地址, { copy: true }],
  ].filter(Boolean);
  const bookingFacts = [
    booking?.total && [isEnglish ? "Verified total" : "已核验总价", isEnglish ? booking.totalEn : booking.total],
    booking?.payment && [isEnglish ? "Payment" : "付款", isEnglish ? booking.paymentEn : booking.payment],
    booking?.breakfast && [isEnglish ? "Breakfast" : "早餐", isEnglish ? booking.breakfastEn : booking.breakfast],
    booking?.cancellation && [isEnglish ? "Cancellation" : "取消政策", isEnglish ? booking.cancellationEn : booking.cancellation],
    ...privateFacts(privateStay, isEnglish, [
      ["订单总额", "订单总额", "Booking total"],
      ["确认码", "确认码", "Confirmation code"],
      ["订单确认号", "订单确认号", "Booking confirmation"],
      ["PIN 码", "PIN 码", "PIN"],
      ["住宿联系电话", "住宿联系电话", "Property phone"],
      ["预计抵达", "预计抵达", "Expected arrival"],
      ["付款提醒", "付款提醒", "Payment reminder"],
    ]),
  ].filter(Boolean);

  return (
    <Box className="confirmed-stay-detail">
      <Box className="confirmed-stay-detail-grid">
        <StayDetailSection isEnglish={isEnglish} primaryFacts={primaryStayFacts} secondaryFacts={secondaryStayFacts} title={isEnglish ? "Stay" : "入住"} />
        <DetailSection facts={bookingFacts} title={isEnglish ? "Booking & policy" : "预订与政策"} />
        <ConfirmedStayLocation imageAlt={title} images={images} isEnglish={isEnglish} privateStay={privateStay} stay={stay} />
      </Box>
    </Box>
  );
}

function coordinatePair(value) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) return null;
  return value;
}

function stayComparison(stay) {
  return stay.stayGroup === "auckland-city" ? aucklandCityStay : regionalStays[stay.stayGroup];
}

function bookedHotel(stay, booking) {
  if (!booking?.hotelId) return null;
  return comparisonHotelsForRegion(stay.stayGroup).find((hotel) => hotel.id === booking.hotelId) ?? null;
}

function mapDirectionsUrl(origin, destination) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

function mapNavigationUrl(destination) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

function MapViewport({ onMapReady, position, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom);
    onMapReady?.(map);
  }, [map, onMapReady, position, zoom]);
  return null;
}

function CopyAddressButton({ isEnglish, value }) {
  const [copied, setCopied] = useState(false);
  const copyAddress = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Tooltip title={copied ? (isEnglish ? "Copied" : "已复制") : (isEnglish ? "Copy address" : "复制地址")}>
      <IconButton aria-label={isEnglish ? "Copy address" : "复制地址"} className="stay-copy-address" onClick={copyAddress} size="small">
        <ContentCopyOutlinedIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}

function StayDetailSection({ isEnglish, primaryFacts, secondaryFacts, title }) {
  const [expanded, setExpanded] = useState(false);
  const visibleFacts = expanded ? [...primaryFacts, ...secondaryFacts] : primaryFacts;
  if (visibleFacts.length === 0) return null;
  return (
    <Box className="confirmed-stay-section">
      <Typography component="h3" fontWeight={900} variant="h6">{title}</Typography>
      <Box component="dl">
        {visibleFacts.map(([label, value, options]) => (
          <Box key={label}>
            <Typography component="dt" variant="caption">{label}</Typography>
            <Box className="confirmed-stay-value">
              <Typography component="dd">{value}</Typography>
              {options?.copy && <CopyAddressButton isEnglish={isEnglish} value={value} />}
            </Box>
          </Box>
        ))}
      </Box>
      {secondaryFacts.length > 0 && (
        <ButtonBase className="confirmed-stay-expand" onClick={() => setExpanded((current) => !current)}>
          {expanded ? (isEnglish ? "Show less" : "收起") : (isEnglish ? `More details (${secondaryFacts.length})` : `更多信息（${secondaryFacts.length}）`)}
        </ButtonBase>
      )}
    </Box>
  );
}

function ConfirmedStayLocation({ imageAlt, images, isEnglish, privateStay, stay }) {
  const booking = confirmedAccommodationBookings[stay.bookingId];
  const comparison = stayComparison(stay);
  const hotel = bookedHotel(stay, booking);
  const privatePosition = coordinatePair(privateStay?.coordinates);
  const calendarPosition = coordinatePair(stay.position);
  const position = privatePosition ?? hotel?.position ?? calendarPosition ?? comparison?.anchorPosition;
  const mapQuery = privateStay?.address ?? privateStay?.["准确地址"] ?? hotel?.mapQuery ?? stay.mapQuery ?? `${isEnglish ? stay.placeEn : stay.place}, New Zealand`;
  const preciseLocation = Boolean(privatePosition || hotel?.position || calendarPosition);
  const mapAttractions = attractionPinsByRegion[stay.stayGroup] ?? [];
  const nearby = hotel?.nearbyAttractions ?? mapAttractions;
  const [activeTab, setActiveTab] = useState("map");
  const [mapInstance, setMapInstance] = useState(null);
  const arrivalFacts = privateFacts(privateStay, isEnglish, [
    ["行车与停车", "行车与停车", "Driving & parking"],
    ["行车说明（截图可见部分）", "行车说明", "Driving notes"],
    ["入户", "入户", "Entry"],
    ["入住方式", "入住方式", "Check-in method"],
  ]);

  if (!position) return null;
  return (
    <Box className="confirmed-stay-location">
      <Tabs aria-label={isEnglish ? "Confirmed stay details" : "已确认住宿详情"} className="confirmed-stay-tabs" onChange={(_, nextTab) => setActiveTab(nextTab)} value={activeTab}>
        <Tab label={isEnglish ? "Map & nearby" : "地图与附近景点"} value="map" />
        {arrivalFacts.length > 0 && <Tab label={isEnglish ? "Arrival & entry" : "到达与入住"} value="arrival" />}
      </Tabs>
      {activeTab === "map" && <>
        <Box className="confirmed-stay-media-map">
          <StayImageGallery imageAlt={imageAlt} images={images} isEnglish={isEnglish} />
          <Box className="confirmed-stay-map-wrap">
          <MapContainer
            aria-label={isEnglish ? "Confirmed stay and nearby itinerary places" : "已确认住宿与附近行程景点地图"}
            center={position}
            className="confirmed-stay-map"
            scrollWheelZoom
            zoom={preciseLocation ? 14 : 13}
            zoomControl
          >
            <MapViewport onMapReady={setMapInstance} position={position} zoom={preciseLocation ? 14 : 13} />
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CircleMarker center={position} pathOptions={{ color: "#123f36", fillColor: "#f28c5b", fillOpacity: 1, weight: 4 }} radius={10}>
              <LeafletTooltip direction="top" offset={[0, -10]} permanent>{preciseLocation ? (isEnglish ? "Confirmed stay" : "已确认住宿") : (isEnglish ? "Trip area" : "行程区域")}</LeafletTooltip>
            </CircleMarker>
            {mapAttractions.map((attraction) => (
              <CircleMarker center={attraction.position} key={attraction.label} pathOptions={{ color: "#347e90", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }} radius={7}>
                <LeafletTooltip direction="top" offset={[0, -8]}>{isEnglish ? (attraction.labelEn ?? attraction.label) : attraction.label}</LeafletTooltip>
              </CircleMarker>
            ))}
          </MapContainer>
            <Tooltip title={isEnglish ? "Centre on stay" : "定位到住宿"}>
              <IconButton aria-label={isEnglish ? "Centre on stay" : "定位到住宿"} className="confirmed-stay-map-locate" disabled={!mapInstance} onClick={() => mapInstance?.setView(position, preciseLocation ? 15 : 14)} size="small">
                <MyLocationOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isEnglish ? "Open Google Maps directions" : "在 Google 地图中导航"}>
              <IconButton aria-label={isEnglish ? "Open Google Maps directions" : "在 Google 地图中导航"} className="confirmed-stay-map-navigate" component="a" href={mapNavigationUrl(mapQuery)} rel="noreferrer" target="_blank" size="small">
                <DirectionsOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box className="confirmed-stay-nearby-grid">
        {nearby.map((attraction) => {
          const label = isEnglish ? (attraction.nameEn ?? attraction.labelEn ?? attraction.name ?? attraction.label) : (attraction.name ?? attraction.label);
          const distance = isEnglish ? (attraction.distanceEn ?? attraction.distance) : attraction.distance;
          const travelTime = isEnglish ? (attraction.travelTimeEn ?? attraction.travelTime) : attraction.travelTime;
          const destination = attraction.destinationQuery ?? attraction.label;
          return (
            <Box component="a" href={mapDirectionsUrl(mapQuery, destination)} key={label} rel="noreferrer" target="_blank">
              <Typography fontWeight={900}>{label}<OpenInNewIcon aria-hidden="true" /></Typography>
              <Typography color="text.secondary" variant="body2">{distance && travelTime ? `${distance} · ${travelTime}` : (isEnglish ? "Open directions from this trip area" : "从此行程区域打开导航")}</Typography>
            </Box>
          );
        })}
        </Box>
      </>}
      {activeTab === "arrival" && arrivalFacts.length > 0 && <Box className="confirmed-stay-arrival"><DetailSection facts={arrivalFacts} title="" /></Box>}
    </Box>
  );
}

function DetailSection({ facts, title }) {
  if (facts.length === 0) return null;
  return (
    <Box className="confirmed-stay-section">
      {title && <Typography component="h3" fontWeight={900} variant="h6">{title}</Typography>}
      <Box component="dl">
        {facts.map(([label, value]) => (
          <Box key={label}>
            <Typography component="dt" variant="caption">{label}</Typography>
            <Typography component="dd">{value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function BookingPanel({ checked, onDetailChange }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const fixedConfirmedIds = new Set(
    accommodationCalendar.filter((stay) => stay.confirmed).map((stay) => stay.bookingId),
  );
  const confirmedCount = accommodationBookingIds.filter(
    (id) => fixedConfirmedIds.has(id) || Boolean(checked[id]),
  ).length;
  const percent = Math.round((confirmedCount / accommodationBookingIds.length) * 100);

  return (
    <Box className="booking-panel">
      <AccommodationCalendar
        checked={checked}
        confirmedCount={confirmedCount}
        isEnglish={isEnglish}
        onDetailChange={onDetailChange}
        percent={percent}
      />
    </Box>
  );
}
