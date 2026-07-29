import { useEffect, useState } from "react";
import { Box, Button, ButtonBase, Card, CardContent, Checkbox, Chip, Grid2 as Grid, LinearProgress, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import HotelIcon from "@mui/icons-material/Hotel";
import LuggageIcon from "@mui/icons-material/Luggage";
import { activityBookingPlans, activityBookingSummary, bookingItems, hotelPlans } from "../../tripData";
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
  "south-car": "Budget South Island rental car · change pending",
  "hotel-airport": "Auckland Airport hotel",
  "hotel-auckland-city": "Central Auckland accommodation",
  "hotel-queenstown": "Queenstown accommodation",
  "hotel-wanaka": "Wānaka accommodation",
  "mount-cook": "Aoraki / Mount Cook accommodation",
  "mount-cook-helicopter": "Mount Cook glacier helicopter",
  "mount-cook-stargazing": "Big Sky Stargazing",
  "hotel-christchurch": "Christchurch accommodation",
  "oamaru-wildlife-option": "Ōamaru penguin and fur-seal route option",
  "hotel-rotorua": "Rotorua accommodation",
  "walter-peak": "Walter Peak cruise and barbecue",
  "flight-jq242": "JQ242 Christchurch → Auckland",
  "north-car": "North Island rental car · cancelled",
  hobbiton: "Hobbiton Movie Set",
  "te-puia": "Te Puia · Te Rā Guided Experience",
};

const activityBookingIds = new Set(activityBookingPlans.map((activity) => activity.id));
const generalBookingItems = bookingItems.filter(([id]) => !activityBookingIds.has(id));

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
  { date: "10/6", stayGroup: "christchurch", hotel: "Novotel Christchurch Cathedral Square", place: "基督城", placeEn: "Christchurch", status: "第 1 晚", statusEn: "Night 1", tone: "christchurch", position: [-43.5309, 172.6372], mapQuery: "Novotel Christchurch Cathedral Square" },
  { date: "10/7", stayGroup: "christchurch", hotel: "Novotel Christchurch Cathedral Square", place: "基督城", placeEn: "Christchurch", status: "第 2 晚", statusEn: "Night 2", tone: "christchurch" },
  { date: "10/8", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "入住", statusEn: "Check in", tone: "auckland-city", position: [-36.8462, 174.7761], mapQuery: "Adina Apartment Hotel Auckland Britomart" },
  { date: "10/9", stayGroup: "rotorua", hotel: "Millennium Hotel Rotorua", place: "罗托鲁瓦", placeEn: "Rotorua", status: "入住", statusEn: "Check in", tone: "rotorua", position: [-38.1385, 176.2574], mapQuery: "Millennium Hotel Rotorua" },
  { date: "10/10", place: "奥克兰机场", placeEn: "Auckland Airport", status: "夜间返程 · 无住宿", statusEn: "Overnight flight · no hotel", tone: "flight", noStay: true },
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
  const dynamicOfficialUrls = new Map([...hotelOfficialUrls, [airportHotel.name, airportHotel.officialUrl], [cityHotel.name, cityHotel.officialUrl], ...regionalSelectedHotels.map((hotel) => [hotel.name, hotel.officialUrl])]);
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
        [region]: { hotelId: hotel.id, hotelName: hotel.name, stayDates: region === "auckland-airport" ? aucklandAirportStayDates : (region === "auckland-city" ? ["2026-10-08"] : (regionalStays[region] ? [regionalStays[region].dates.checkIn] : [])) },
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
                  aria-label={`${stay.hotel} · ${isEnglish ? "official website" : "官方网站"}`}
                  className="accommodation-hotel-name"
                  component="a"
                  href={dynamicOfficialUrls.get(stay.hotel)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {stay.hotel}<OpenInNewIcon aria-hidden="true" />
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
  const done = bookingItems.filter(([id]) => Boolean(checked[id])).length;
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
      <Box component="section" aria-labelledby="activity-booking-title" className="activity-booking-section">
        <Card className="activity-booking-summary">
          <CardContent>
            <Box>
              <Typography className="activity-booking-kicker">{isEnglish ? "ACTIVITIES TO BOOK" : "活动待预订"}</Typography>
              <Typography id="activity-booking-title" variant="h2">
                {isEnglish ? "Official links and two-person totals" : "官方链接与双人金额"}
              </Typography>
              <Typography color="text.secondary">
                {isEnglish
                  ? "No payment has been made. Prices and inventory can change until checkout, and carts may expire."
                  : "以下项目均未付款；完成结算前价格与余票仍可能变化，已加入的购物车也可能失效。"}
              </Typography>
            </Box>
            <Box className="activity-booking-total">
              <Typography>{isEnglish ? "Five-item planned total" : "5项预计合计"}</Typography>
              <Typography className="activity-booking-total-value">{activityBookingSummary.plannedTotal}</Typography>
              <Typography>
                {isEnglish
                  ? `${activityBookingSummary.confirmedSubtotal} verified + estimated Hobbiton fare`
                  : `${activityBookingSummary.confirmedSubtotal} 已核价 + 霍比屯预估`}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={1.5} className="activity-booking-grid">
          {activityBookingPlans.map((activity) => (
            <Grid size={{ xs: 12, md: 6 }} key={activity.id}>
              <Card className={checked[activity.id] ? "activity-booking-card checked" : "activity-booking-card"}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Chip
                      className="activity-booking-status"
                      data-tone={activity.statusTone}
                      label={isEnglish ? activity.statusEn : activity.status}
                      size="small"
                    />
                    <Checkbox
                      checked={Boolean(checked[activity.id])}
                      inputProps={{ "aria-label": isEnglish ? `Mark ${activity.titleEn} as completed` : `将${activity.title}标记为已完成` }}
                      onChange={() => toggle(activity.id)}
                    />
                  </Stack>

                  <Typography className="activity-booking-operator">{activity.operator}</Typography>
                  <Typography variant="h3">{isEnglish ? activity.titleEn : activity.title}</Typography>

                  <Box className="activity-booking-facts">
                    <Box>
                      <CalendarMonthOutlinedIcon aria-hidden="true" />
                      <span>{isEnglish ? activity.dateEn : activity.date}</span>
                    </Box>
                    <Box>
                      <PaymentsOutlinedIcon aria-hidden="true" />
                      <span>
                        <strong>{activity.total}</strong>
                        <small>{isEnglish ? activity.unitPriceEn : activity.unitPrice}</small>
                      </span>
                    </Box>
                  </Box>

                  <Typography className="activity-booking-detail">
                    {isEnglish ? activity.detailEn : activity.detail}
                  </Typography>
                  <Typography className="activity-booking-policy" color="text.secondary">
                    {isEnglish ? activity.policyEn : activity.policy}
                  </Typography>

                  <Button
                    className="activity-booking-link"
                    endIcon={<OpenInNewIcon />}
                    href={activity.bookingUrl}
                    rel="noreferrer"
                    target="_blank"
                    variant="outlined"
                  >
                    {isEnglish ? activity.bookingLabelEn : activity.bookingLabel}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography className="activity-booking-checked-at" color="text.secondary">
          {isEnglish
            ? `Prices and availability checked on ${activityBookingSummary.checkedAt}. All amounts are in New Zealand dollars.`
            : `价格与余票核对于 ${activityBookingSummary.checkedAt}；金额均为新西兰元。`}
        </Typography>
      </Box>

      <Box>
        <AccommodationCalendar isEnglish={isEnglish} />
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={1.5}>
            {generalBookingItems.map(([id, title, desc]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={id}>
                <Card className={checked[id] ? "booking-card checked" : "booking-card"} onClick={() => toggle(id)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5}>
                      <Checkbox checked={Boolean(checked[id])} tabIndex={-1} />
                      <Box>
                        <Typography fontWeight={900}>{isEnglish ? (bookingTitleEn[id] ?? title) : title}</Typography>
                        <Typography color="text.secondary" variant="body2">{isEnglish ? "Open this item to review the booking details and current status." : desc}</Typography>
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
