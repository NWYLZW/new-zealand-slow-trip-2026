import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Card, LinearProgress, Stack, Typography } from "@mui/material";
import HotelIcon from "@mui/icons-material/Hotel";
import LuggageIcon from "@mui/icons-material/Luggage";
import sharedHotelSelections from "../../data/hotel-selections.json";
import { AUCKLAND_AIRPORT_SELECTION_KEY } from "../../data/aucklandAirportHotels";
import { aucklandCityHotels, aucklandCityStay } from "../../data/aucklandCityHotels";
import { regionalHotels, regionalStays } from "../../data/regionalHotels";
import { useLanguage } from "../../LanguageContext";
import { AccommodationMap } from "../AccommodationMap";
import { HotelComparisonView } from "../HotelComparisonDialog";
import { CalendarDayCell, CalendarGrid, CalendarWeekdays } from "../calendar/CalendarPrimitives";
import "./BookingPanel.css";

const accommodationBookingIds = [
  "hotel-queenstown",
  "hotel-wanaka",
  "mount-cook",
  "hotel-oamaru",
  "hotel-christchurch",
  "hotel-auckland-city",
];

const comparisonRegionLabels = {
  "auckland-city": { en: "Central Auckland", zh: "奥克兰市中心" },
  queenstown: { en: "Queenstown", zh: "皇后镇" },
  wanaka: { en: "Wānaka", zh: "瓦纳卡" },
  "mount-cook": { en: "Aoraki / Mount Cook", zh: "库克山及周边" },
  oamaru: { en: "Ōamaru", zh: "奥马鲁" },
  christchurch: { en: "Christchurch", zh: "基督城" },
};

const accommodationCalendar = [
  { date: "9/28", stayGroup: "airport-transit", place: "奥克兰机场过夜候机", placeEn: "Overnight at Auckland Airport", status: "不住酒店", statusEn: "No hotel", tone: "flight", noStay: true },
  { date: "9/29", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 1 晚", statusEn: "Night 1", tone: "queenstown", position: [-45.0154, 168.7366], mapQuery: "Holiday Inn Queenstown Remarkables Park" },
  { date: "9/30", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 2 晚", statusEn: "Night 2", tone: "queenstown" },
  { date: "10/1", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 3 晚", statusEn: "Night 3", tone: "queenstown" },
  { date: "10/2", bookingId: "hotel-queenstown", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 4 晚", statusEn: "Night 4", tone: "queenstown" },
  { date: "10/3", bookingId: "hotel-wanaka", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 1 晚", statusEn: "Night 1", tone: "wanaka", position: [-44.7047, 169.1216], mapQuery: "Wanaka Luxury Apartments" },
  { date: "10/4", bookingId: "hotel-wanaka", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 2 晚", statusEn: "Night 2", tone: "wanaka" },
  { date: "10/5", bookingId: "mount-cook", stayGroup: "mount-cook", hotel: "The Hermitage · Mt Cook Motel Studio Queen", place: "库克山村", placeEn: "Aoraki / Mount Cook Village", status: "住 1 晚", statusEn: "1 night", tone: "mount-cook", confirmed: true, position: [-43.7363846, 170.0987676], mapQuery: "Mt Cook Lodge & Motels New Zealand" },
  { date: "10/6", bookingId: "hotel-oamaru", stayGroup: "oamaru", hotel: "Mariner Suites", place: "奥马鲁", placeEn: "Ōamaru", status: "住 1 晚", statusEn: "1 night", tone: "oamaru", position: [-45.1031, 170.9687], mapQuery: "Mariner Suites Oamaru" },
  { date: "10/7", bookingId: "hotel-christchurch", stayGroup: "christchurch", hotel: "Novotel Christchurch Cathedral Square", place: "基督城", placeEn: "Christchurch", status: "住 1 晚", statusEn: "1 night", tone: "christchurch", position: [-43.5309, 172.6372], mapQuery: "Novotel Christchurch Cathedral Square" },
  { date: "10/8", bookingId: "hotel-auckland-city", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "第 1 晚", statusEn: "Night 1", tone: "auckland-city", position: [-36.8462, 174.7761], mapQuery: "Adina Apartment Hotel Auckland Britomart" },
  { date: "10/9", bookingId: "hotel-auckland-city", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "第 2 晚", statusEn: "Night 2", tone: "auckland-city" },
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

function writeComparisonUrl(view, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (view) {
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
  const initialCityHotel = aucklandCityHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-city", aucklandCityStay.selectedHotelId))
    ?? aucklandCityHotels[0];
  const initialRegionalIds = Object.fromEntries(
    Object.keys(regionalStays).map((region) => [region, fallbackComparisonHotelId(region)]),
  );
  const [cityHotelId, setCityHotelId] = useState(initialCityHotel.id);
  const [regionalHotelIds, setRegionalHotelIds] = useState(initialRegionalIds);
  const [selectedHotel, setSelectedHotel] = useState(initialCityHotel.name);
  const [selectedStayGroup, setSelectedStayGroup] = useState(null);
  const [comparisonView, setComparisonView] = useState(() => readComparisonUrl());
  const comparisonRegion = comparisonView?.region ?? null;
  const weekdays = isEnglish
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  const cityHotel = aucklandCityHotels.find((hotel) => hotel.id === cityHotelId) ?? aucklandCityHotels[0];
  const displayedCalendar = accommodationCalendar.map((stay) => {
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
  }, [backFromComparison, backToAccommodationCalendar, comparisonRegion, comparisonView?.hotelId, isEnglish, onDetailChange]);

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
              {isEnglish ? "Select any date for hotel options; green means confirmed and red means pending." : "点击任意日期打开酒店比选；顶部绿线表示已确认，红线表示待确认。"}
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
              if (stay.stayGroup === "auckland-city" && stay.hotel) openComparison("auckland-city");
              if (regionalHotels[stay.stayGroup] && stay.hotel) openComparison(stay.stayGroup);
            };
            const cellLabel = isEnglish
              ? `${stay.date}, ${stay.placeEn}, ${stay.hotelEn ?? stay.hotel}, ${segmentConfirmationLabel}. Open accommodation options`
              : `${stay.date}，${stay.place}，${stay.hotel}，${segmentConfirmationLabel}。打开住宿比选`;

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
