import { useEffect, useState } from "react";
import { Box, ButtonBase, Card, CardContent, Checkbox, Chip, Grid2 as Grid, LinearProgress, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HotelIcon from "@mui/icons-material/Hotel";
import LuggageIcon from "@mui/icons-material/Luggage";
import { bookingItems, hotelPlans } from "../../tripData";
import sharedHotelSelections from "../../data/hotel-selections.json";
import { AUCKLAND_AIRPORT_SELECTION_KEY, aucklandAirportHotels, aucklandAirportStayDates } from "../../data/aucklandAirportHotels";
import { aucklandCityHotels, aucklandCityStay } from "../../data/aucklandCityHotels";
import { regionalHotels, regionalStays } from "../../data/regionalHotels";
import { useLanguage } from "../../LanguageContext";
import { AccommodationMap } from "../AccommodationMap";
import { HotelComparisonDialog } from "../HotelComparisonDialog";
import "./BookingPanel.css";

const bookingTitleEn = {
  "flight-nz619": "NZ619 Auckland → Queenstown",
  "south-car": "Budget South Island rental · return changed to 8 Oct",
  "hotel-airport": "Auckland Airport hotel",
  "hotel-auckland-city": "Central Auckland accommodation",
  "hotel-queenstown": "Queenstown accommodation",
  "hotel-wanaka": "Wānaka accommodation",
  "mount-cook": "Aoraki / Mount Cook accommodation",
  "mount-cook-helicopter": "Mount Cook glacier helicopter",
  "mount-cook-stargazing": "Big Sky Stargazing",
  "hotel-christchurch": "Christchurch accommodation",
  "oamaru-stay-penguins": "Ōamaru accommodation and blue-penguin evening · booking pending",
  "walter-peak": "Walter Peak cruise and barbecue",
  "flight-jq242": "JQ242 Christchurch → Auckland · booking pending",
  "north-car-cancel": "North Island Budget rental · cancellation pending",
  hobbiton: "GreatSights Hobbiton coach day tour · booking pending",
};

const bookingDescriptionEn = {
  "flight-nz619": "29 Sep, 11:35–13:30; confirm checked baggage.",
  "south-car": "The booking has been changed to return at Christchurch Airport on 8 Oct. Check the new confirmation email for the exact time, updated total, vehicle, protection and whether the booking reference remains unchanged; do not reuse the former eight-24-hour duration or NZD 2,052.96 total.",
  "hotel-airport": "One night on 28 Sep only; Novotel Auckland Airport is the current first choice.",
  "hotel-auckland-city": "Check in late on 8 Oct and check out on 10 Oct for two nights. Expect to reach the hotel around 23:00, then leave around 06:30 on 9 Oct for the SkyCity coach check-in. The former 7–9 Oct two-night total is not valid for these new exact dates.",
  "hotel-queenstown": "Four nights from 29 Sep; Holiday Inn Queenstown Remarkables Park is the current first choice with a verified dedicated king-bed room.",
  "hotel-wanaka": "Two nights from 3 Oct; Wanaka Luxury Apartments is the current first choice.",
  "mount-cook": "Booked: The Hermitage · Mt Cook Motel Studio Queen for one night on 5 Oct, including breakfast for two. The confirmation number is stored privately; NZD 504 has been paid.",
  "mount-cook-helicopter": "Around 15:30 on 5 Oct; Glacier Highlights is about 45 minutes and NZD 1,298 for two as a reference. Confirm that weather cancellation is refundable.",
  "mount-cook-stargazing": "Choose a later session on 5 Oct; about 75–90 minutes, from NZD 318 for two. Ask whether Mandarin commentary is available.",
  "hotel-christchurch": "One night from 7 to 8 Oct; Novotel Christchurch Cathedral Square remains the current first choice. Recheck the exact one-night total and terms for the new dates.",
  "oamaru-stay-penguins": "Now part of the itinerary: stay in Ōamaru on 6 Oct and attend the official 20:00 blue-penguin session. General entry is NZD 100 for two and Premium is NZD 140; accommodation and penguin tickets still need to be booked.",
  "walter-peak": "2 Oct; prefer a lunchtime or early-afternoon departure. Allow about 3.5–4 hours.",
  "flight-jq242": "8 Oct, 20:30–21:50. Google Flights showed a base fare from NZD 156 per person / NZD 312 for two, excluding optional baggage; verify and book directly with Jetstar.",
  "north-car-cancel": "A real Budget booking still exists. The revised itinerary no longer collects the car, but editing this page does not cancel the booking; cancel it in Budget's booking manager and save the confirmation.",
  hobbiton: "GS10H for 9 Oct was checked as selectable: check in at SkyCity Coach Terminal at 07:00, depart 07:15 and return around 15:30. Price shown is NZD 259 per adult / NZD 518 for two; payment-page fees are unverified. Free cancellation is stated up to two hours before departure.",
};

const bookingTitleZh = {
  "south-car": "Budget 南岛租车 · 已改为10月8日还车",
  "hotel-christchurch": "基督城住宿 · 10月7日住1晚",
  "oamaru-stay-penguins": "奥马鲁住宿 + 小蓝企鹅晚场 · 待预订",
};

const bookingDescriptionZh = {
  "south-car": "订单已改为10月8日在基督城机场还车；具体时刻、改期后总价、车型、保障及预订号是否沿用，须按新确认邮件核对。旧的8 × 24小时和 NZ$2,052.96 不再作为新订单信息。",
  "hotel-christchurch": "10月7日入住、10月8日退房，共1晚；当前首选仍是 Novotel Christchurch Cathedral Square，须按新日期复核精确总价和条款。",
  "oamaru-stay-penguins": "已纳入主行程：10月6日住奥马鲁，参加20:00官方小蓝企鹅归巢晚场。General 2人NZD 100、Premium 2人NZD 140；住宿和企鹅票均待预订。",
};

const hotelOfficialUrls = new Map(hotelPlans.map((hotel) => [hotel.name, hotel.links[0][1]]));

const accommodationCalendar = [
  { date: "9/28", stayGroup: "airport-arrival", hotel: "Novotel Auckland Airport", place: "奥克兰机场", placeEn: "Auckland Airport", status: "入住", statusEn: "Check in", tone: "airport", position: [-37.0075, 174.7839], mapQuery: "Novotel Auckland Airport" },
  { date: "9/29", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 1 晚", statusEn: "Night 1", tone: "queenstown", position: [-45.0154, 168.7366], mapQuery: "Holiday Inn Queenstown Remarkables Park" },
  { date: "9/30", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 2 晚", statusEn: "Night 2", tone: "queenstown" },
  { date: "10/1", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 3 晚", statusEn: "Night 3", tone: "queenstown" },
  { date: "10/2", stayGroup: "queenstown", hotel: "Holiday Inn Queenstown Remarkables Park", place: "皇后镇", placeEn: "Queenstown", status: "第 4 晚", statusEn: "Night 4", tone: "queenstown" },
  { date: "10/3", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 1 晚", statusEn: "Night 1", tone: "wanaka", position: [-44.7047, 169.1216], mapQuery: "Wanaka Luxury Apartments" },
  { date: "10/4", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 2 晚", statusEn: "Night 2", tone: "wanaka" },
  { date: "10/5", stayGroup: "mount-cook", hotel: "The Hermitage · Mt Cook Motel Studio Queen", place: "库克山村", placeEn: "Aoraki / Mount Cook Village", status: "已预订", statusEn: "Booked", tone: "mount-cook", position: [-43.7363846, 170.0987676], mapQuery: "Mt Cook Lodge & Motels New Zealand" },
  { date: "10/6", stayGroup: "oamaru", hotel: "奥马鲁住宿待调研 / 待预订", place: "奥马鲁", placeEn: "Ōamaru", status: "住1晚 · 20:00企鹅", statusEn: "1 night · penguins 20:00", tone: "oamaru", position: [-45.0966, 170.9714], mapQuery: "Oamaru New Zealand accommodation" },
  { date: "10/7", stayGroup: "christchurch", hotel: "Novotel Christchurch Cathedral Square", place: "基督城", placeEn: "Christchurch", status: "住1晚", statusEn: "1 night", tone: "christchurch", position: [-43.5309, 172.6372], mapQuery: "Novotel Christchurch Cathedral Square" },
  { date: "10/8", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "晚到 · 第 1 晚", statusEn: "Late arrival · night 1", tone: "auckland-city", position: [-36.8462, 174.7761], mapQuery: "Adina Apartment Hotel Auckland Britomart" },
  { date: "10/9", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "第 2 晚", statusEn: "Night 2", tone: "auckland-city" },
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
  if (region === "auckland-airport") return aucklandAirportStayDates;
  const stay = region === "auckland-city" ? aucklandCityStay : regionalStays[region];
  return stay ? stayDatesBetween(stay.dates.checkIn, stay.dates.checkOut) : [];
}

const airportStayByDate = {
  "9/28": { checkIn: "2026-09-28", checkOut: "2026-09-29", label: "9月28日—29日" },
};

function comparisonHotelsForRegion(region) {
  if (region === "auckland-airport") return aucklandAirportHotels;
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
  const hotelId = hotels.some((hotel) => hotel.id === requestedHotelId)
    ? requestedHotelId
    : fallbackComparisonHotelId(region, hotels);
  return hotelId ? { region, hotelId } : null;
}

function writeComparisonUrl(view, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (view) {
    url.searchParams.set("compare", view.region);
    url.searchParams.set("hotel", view.hotelId);
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
  return region === "auckland-airport" ? "airport-arrival" : region;
}

function AccommodationCalendar({ isEnglish }) {
  const initialAirportHotel = aucklandAirportHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-airport", aucklandAirportHotels[0].id))
    ?? aucklandAirportHotels[0];
  const initialCityHotel = aucklandCityHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-city", aucklandCityStay.selectedHotelId))
    ?? aucklandCityHotels[0];
  const initialRegionalIds = Object.fromEntries(
    Object.keys(regionalStays).map((region) => [region, fallbackComparisonHotelId(region)]),
  );
  const [airportHotelId, setAirportHotelId] = useState(initialAirportHotel.id);
  const [cityHotelId, setCityHotelId] = useState(initialCityHotel.id);
  const [regionalHotelIds, setRegionalHotelIds] = useState(initialRegionalIds);
  const [selectedHotel, setSelectedHotel] = useState(initialAirportHotel.name);
  const [selectedStayGroup, setSelectedStayGroup] = useState("airport-arrival");
  const [comparisonView, setComparisonView] = useState(() => readComparisonUrl());
  const comparisonRegion = comparisonView?.region ?? null;
  const weekdays = isEnglish
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  const airportHotel = aucklandAirportHotels.find((hotel) => hotel.id === airportHotelId) ?? aucklandAirportHotels[0];
  const cityHotel = aucklandCityHotels.find((hotel) => hotel.id === cityHotelId) ?? aucklandCityHotels[0];
  const displayedCalendar = accommodationCalendar.map((stay) => {
    if (stay.stayGroup === "airport-arrival" && stay.hotel) return { ...stay, hotel: airportHotel.name, position: airportHotel.position, mapQuery: airportHotel.mapQuery };
    if (stay.stayGroup === "auckland-city" && stay.hotel) return { ...stay, hotel: cityHotel.name, position: stay.position ? cityHotel.position : undefined, mapQuery: cityHotel.mapQuery };
    if (regionalHotels[stay.stayGroup] && stay.hotel) {
      const selected = regionalHotels[stay.stayGroup].find((hotel) => hotel.id === regionalHotelIds[stay.stayGroup]) ?? regionalHotels[stay.stayGroup][0];
      return { ...stay, hotel: selected.name, position: stay.position ? selected.position : undefined, mapQuery: selected.mapQuery };
    }
    return stay;
  });
  const regionalSelectedHotels = Object.entries(regionalHotels).map(([region, hotelsForRegion]) => hotelsForRegion.find((hotel) => hotel.id === regionalHotelIds[region]) ?? hotelsForRegion[0]);
  const dynamicOfficialUrls = new Map([...hotelOfficialUrls, [airportHotel.name, airportHotel.officialUrl], [cityHotel.name, cityHotel.officialUrl], ...regionalSelectedHotels.filter((hotel) => hotel.officialUrl).map((hotel) => [hotel.name, hotel.officialUrl])]);
  const hotels = [...new Map(
    displayedCalendar
      .filter((stay) => stay.hotel && stay.position)
      .map((stay) => [stay.hotel, { ...stay, onSelect: setSelectedHotel }]),
  ).values()];

  const selectedHotelIdForRegion = (region) => {
    if (region === "auckland-airport") return airportHotelId;
    if (region === "auckland-city") return cityHotelId;
    const visibleHotels = visibleComparisonHotels(region);
    const candidateId = regionalHotelIds[region];
    return visibleHotels.some((hotel) => hotel.id === candidateId)
      ? candidateId
      : fallbackComparisonHotelId(region, visibleHotels);
  };

  const replaceComparison = (view) => {
    setComparisonView(view);
    writeComparisonUrl(view);
  };

  const openComparison = (region) => {
    const hotelId = selectedHotelIdForRegion(region);
    if (!hotelId) return;
    const view = { region, hotelId };
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    setComparisonView(view);
    writeComparisonUrl(view, "pushState", { ...currentState, hotelComparison: true });
  };

  const closeComparison = () => {
    setComparisonView(null);
    if (history.state?.hotelComparison) {
      history.back();
      return;
    }
    writeComparisonUrl(null);
  };

  const changeComparisonHotel = (hotelId) => {
    if (!comparisonRegion || !visibleComparisonHotels(comparisonRegion).some((hotel) => hotel.id === hotelId)) return;
    replaceComparison({ region: comparisonRegion, hotelId });
  };

  useEffect(() => {
    const syncComparisonFromUrl = () => {
      const next = readComparisonUrl();
      setComparisonView(next);
      if (next) {
        setSelectedStayGroup(calendarGroupForRegion(next.region));
        const selected = comparisonHotelsForRegion(next.region).find((hotel) => hotel.id === next.hotelId);
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
    if (region === "auckland-airport") setAirportHotelId(hotel.id);
    if (region === "auckland-city") setCityHotelId(hotel.id);
    if (regionalHotels[region]) setRegionalHotelIds((current) => ({ ...current, [region]: hotel.id }));
    setSelectedHotel(hotel.name);
    localStorage.setItem(AUCKLAND_AIRPORT_SELECTION_KEY, JSON.stringify(selection));
    closeComparison();
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

  return (
    <Box className="route-day-calendar accommodation-calendar">
      <Box className="route-month">
        <AccommodationMap hotels={hotels} isEnglish={isEnglish} selectedHotel={selectedHotel} />
        <Stack className="accommodation-calendar-title" direction="row" alignItems="center" spacing={1}>
          <HotelIcon aria-hidden="true" />
          <Box>
            <Typography className="route-month-title">
              {isEnglish ? "Accommodation calendar · 28 Sep—11 Oct" : "住宿日历 · 9月28日—10月11日"}
            </Typography>
            <Typography color="text.secondary">
              {isEnglish ? "12 hotel nights; select a date to view the hotel on the map." : "共 12 个住宿晚；点击日期可在地图查看酒店位置。"}
            </Typography>
          </Box>
        </Stack>
        <Box className="accommodation-calendar-grid-scroll">
          <Box className="route-weekdays">
            {weekdays.map((weekday) => <Typography key={weekday}>{weekday}</Typography>)}
          </Box>
          <Box className="route-month-grid">
            {displayedCalendar.map((stay, index) => {
            const selectorContent = (
              <ButtonBase
                aria-label={`${stay.date} · ${isEnglish ? stay.placeEn : stay.place} · ${isEnglish ? "Show on map" : "在地图查看"}`}
                aria-pressed={stay.stayGroup === selectedStayGroup}
                className="accommodation-day-selector"
                onClick={() => {
                  setSelectedHotel(stay.hotel);
                  setSelectedStayGroup(stay.stayGroup);
                  if (stay.stayGroup === "airport-arrival" && stay.hotel) openComparison("auckland-airport");
                  if (stay.stayGroup === "auckland-city" && stay.hotel) openComparison("auckland-city");
                  if (regionalHotels[stay.stayGroup] && stay.hotel) openComparison(stay.stayGroup);
                }}
              >
                <Stack className="accommodation-date" direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>{stay.date}</Typography>
                  <Chip label={isEnglish ? stay.statusEn : stay.status} size="small" />
                </Stack>
                <Box className="accommodation-place">
                  {stay.noStay ? <LuggageIcon aria-hidden="true" /> : <HotelIcon aria-hidden="true" />}
                  <Typography>{isEnglish ? stay.placeEn : stay.place}</Typography>
                </Box>
              </ButtonBase>
            );

            const officialUrl = dynamicOfficialUrls.get(stay.hotel);

            return stay.hotel ? (
              <Box
                className="route-day-cell accommodation-day-cell"
                data-tone={stay.tone}
                data-selected={stay.stayGroup === selectedStayGroup}
                key={stay.date}
                style={{ gridColumnStart: index === 0 ? 2 : undefined }}
              >
                {selectorContent}
                <Typography
                  aria-label={officialUrl ? `${stay.hotel} · ${isEnglish ? "official website" : "官方网站"}` : undefined}
                  className="accommodation-hotel-name"
                  component={officialUrl ? "a" : "span"}
                  href={officialUrl || undefined}
                  rel={officialUrl ? "noreferrer" : undefined}
                  target={officialUrl ? "_blank" : undefined}
                >
                  {stay.hotel}{officialUrl && <OpenInNewIcon aria-hidden="true" />}
                </Typography>
              </Box>
            ) : (
              <Box
                className="route-day-cell accommodation-day-cell is-no-stay"
                data-tone={stay.tone}
                key={stay.date}
              >
                <Stack className="accommodation-date" direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>{stay.date}</Typography>
                  <Chip label={isEnglish ? stay.statusEn : stay.status} size="small" />
                </Stack>
                <Box className="accommodation-place">
                  <LuggageIcon aria-hidden="true" />
                  <Typography>{isEnglish ? stay.placeEn : stay.place}</Typography>
                </Box>
              </Box>
            );
            })}
          </Box>
        </Box>
      </Box>
      <HotelComparisonDialog
        activeHotelId={comparisonView?.hotelId}
        comparison={comparisonRegion === "auckland-city" ? aucklandCityStay : (regionalStays[comparisonRegion] ?? undefined)}
        hotels={comparisonRegion === "auckland-city" ? aucklandCityHotels : (regionalHotels[comparisonRegion] ?? aucklandAirportHotels)}
        isEnglish={isEnglish}
        onActiveHotelChange={changeComparisonHotel}
        onClose={closeComparison}
        onSelect={(hotel) => chooseHotel(comparisonRegion, hotel)}
        open={Boolean(comparisonRegion)}
        selectedHotelId={comparisonRegion === "auckland-city" ? cityHotelId : (regionalHotelIds[comparisonRegion] ?? airportHotelId)}
        stay={comparisonRegion === "auckland-city" ? aucklandCityStay.dates : (regionalStays[comparisonRegion]?.dates ?? airportStayByDate["9/28"])}
      />
    </Box>
  );
}

export function BookingPanel({ checked, setChecked, storageKey }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const currentItemIds = new Set(bookingItems.map(([id]) => id));
  const done = Object.entries(checked).filter(([id, value]) => currentItemIds.has(id) && value).length;
  const percent = Math.round((done / bookingItems.length) * 100);
  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <AccommodationCalendar isEnglish={isEnglish} />
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={1.5}>
            {bookingItems.map(([id, title, desc]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={id}>
                <Card className={checked[id] ? "booking-card checked" : "booking-card"} onClick={() => toggle(id)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5}>
                      <Checkbox checked={Boolean(checked[id])} tabIndex={-1} />
                      <Box>
                        <Typography fontWeight={900}>{isEnglish ? (bookingTitleEn[id] ?? title) : (bookingTitleZh[id] ?? title)}</Typography>
                        <Typography color="text.secondary" variant="body2">{isEnglish ? (bookingDescriptionEn[id] ?? desc) : (bookingDescriptionZh[id] ?? desc)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="progress-card">
            <CardContent>
              <Typography>{isEnglish ? "Completed" : "当前完成"}</Typography>
              <Typography className="big-progress">{percent}%</Typography>
              <LinearProgress variant="determinate" value={percent} />
              <Typography color="text.secondary" className="progress-note">
                {isEnglish ? "Prioritise Aoraki / Mount Cook accommodation, the helicopter flight and stargazing. Choose flexible terms for weather-dependent activities." : "先锁定库克山住宿、直升机与观星，再订皇后镇、奥克兰机场和两段国内航班；天气型项目优先选可改期或可退款条款。"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
