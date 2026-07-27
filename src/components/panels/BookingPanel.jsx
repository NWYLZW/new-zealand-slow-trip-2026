import { useState } from "react";
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
  "south-car": "Omega South Island rental car",
  "hotel-airport": "Auckland Airport hotel",
  "hotel-auckland-city": "Central Auckland accommodation",
  "hotel-queenstown": "Queenstown accommodation",
  "hotel-wanaka": "Wānaka accommodation",
  "mount-cook": "Aoraki / Mount Cook accommodation",
  "mount-cook-helicopter": "Mount Cook glacier helicopter",
  "mount-cook-stargazing": "Big Sky Stargazing",
  "hotel-christchurch": "Christchurch accommodation",
  "hotel-rotorua": "Rotorua accommodation",
  "walter-peak": "Walter Peak cruise and barbecue",
  "flight-jq242": "JQ242 Christchurch → Auckland",
  "north-car": "North Island rental car",
  hobbiton: "Hobbiton Movie Set",
};

const hotelOfficialUrls = new Map(hotelPlans.map((hotel) => [hotel.name, hotel.links[0][1]]));

const accommodationCalendar = [
  { date: "9/28", stayGroup: "airport-arrival", hotel: "Novotel Auckland Airport", place: "奥克兰机场", placeEn: "Auckland Airport", status: "入住", statusEn: "Check in", tone: "airport", position: [-37.0075, 174.7839], mapQuery: "Novotel Auckland Airport" },
  { date: "9/29", stayGroup: "queenstown", hotel: "Ramada by Wyndham Queenstown Central", place: "皇后镇", placeEn: "Queenstown", status: "第 1 晚", statusEn: "Night 1", tone: "queenstown", position: [-45.0372, 168.6653], mapQuery: "Ramada by Wyndham Queenstown Central" },
  { date: "9/30", stayGroup: "queenstown", hotel: "Ramada by Wyndham Queenstown Central", place: "皇后镇", placeEn: "Queenstown", status: "第 2 晚", statusEn: "Night 2", tone: "queenstown" },
  { date: "10/1", stayGroup: "queenstown", hotel: "Ramada by Wyndham Queenstown Central", place: "皇后镇", placeEn: "Queenstown", status: "第 3 晚", statusEn: "Night 3", tone: "queenstown" },
  { date: "10/2", stayGroup: "queenstown", hotel: "Ramada by Wyndham Queenstown Central", place: "皇后镇", placeEn: "Queenstown", status: "第 4 晚", statusEn: "Night 4", tone: "queenstown" },
  { date: "10/3", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 1 晚", statusEn: "Night 1", tone: "wanaka", position: [-44.7047, 169.1216], mapQuery: "Wanaka Luxury Apartments" },
  { date: "10/4", stayGroup: "wanaka", hotel: "Wanaka Luxury Apartments", place: "瓦纳卡", placeEn: "Wānaka", status: "第 2 晚", statusEn: "Night 2", tone: "wanaka" },
  { date: "10/5", stayGroup: "mount-cook", hotel: "The Hermitage Hotel", place: "库克山", placeEn: "Aoraki / Mount Cook", status: "入住", statusEn: "Check in", tone: "mount-cook", position: [-43.7338, 170.0937], mapQuery: "The Hermitage Hotel Aoraki Mount Cook" },
  { date: "10/6", stayGroup: "christchurch", hotel: "Rydges Latimer Christchurch", place: "基督城", placeEn: "Christchurch", status: "入住", statusEn: "Check in", tone: "christchurch", position: [-43.5303, 172.6472], mapQuery: "Rydges Latimer Christchurch" },
  { date: "10/7", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "市区第 1 晚", statusEn: "City night 1", tone: "auckland-city", position: [-36.8462, 174.7761], mapQuery: "Adina Apartment Hotel Auckland Britomart" },
  { date: "10/8", stayGroup: "auckland-city", hotel: "Adina Apartment Hotel Auckland Britomart", place: "奥克兰市中心", placeEn: "Central Auckland", status: "市区第 2 晚", statusEn: "City night 2", tone: "auckland-city" },
  { date: "10/9", stayGroup: "rotorua", hotel: "JetPark Hotel Rotorua", place: "罗托鲁瓦", placeEn: "Rotorua", status: "入住", statusEn: "Check in", tone: "rotorua", position: [-38.1435, 176.2495], mapQuery: "JetPark Hotel Rotorua" },
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

function AccommodationCalendar({ isEnglish }) {
  const initialAirportHotel = aucklandAirportHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-airport", aucklandAirportHotels[0].id))
    ?? aucklandAirportHotels[0];
  const initialCityHotel = aucklandCityHotels.find((hotel) => hotel.id === readSavedHotelId("auckland-city", aucklandCityStay.selectedHotelId))
    ?? aucklandCityHotels[0];
  const initialRegionalIds = Object.fromEntries(Object.entries(regionalStays).map(([region, comparison]) => [region, readSavedHotelId(region, comparison.selectedHotelId)]));
  const [airportHotelId, setAirportHotelId] = useState(initialAirportHotel.id);
  const [cityHotelId, setCityHotelId] = useState(initialCityHotel.id);
  const [regionalHotelIds, setRegionalHotelIds] = useState(initialRegionalIds);
  const [selectedHotel, setSelectedHotel] = useState(initialAirportHotel.name);
  const [selectedStayGroup, setSelectedStayGroup] = useState("airport-arrival");
  const [comparisonRegion, setComparisonRegion] = useState(null);
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

  const chooseHotel = async (region, hotel) => {
    const savedSelections = readSavedSelections();
    const selection = {
      updatedAt: new Date().toISOString(),
      regions: {
        ...sharedHotelSelections.regions,
        ...savedSelections.regions,
        [region]: { hotelId: hotel.id, hotelName: hotel.name, stayDates: region === "auckland-airport" ? aucklandAirportStayDates : (regionalStays[region] ? [regionalStays[region].dates.checkIn] : ["2026-10-07", "2026-10-08"]) },
      },
    };
    if (region === "auckland-airport") setAirportHotelId(hotel.id);
    if (region === "auckland-city") setCityHotelId(hotel.id);
    if (regionalHotels[region]) setRegionalHotelIds((current) => ({ ...current, [region]: hotel.id }));
    setSelectedHotel(hotel.name);
    localStorage.setItem(AUCKLAND_AIRPORT_SELECTION_KEY, JSON.stringify(selection));
    setComparisonRegion(null);
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
                  if (stay.stayGroup === "airport-arrival" && stay.hotel) setComparisonRegion("auckland-airport");
                  if (stay.stayGroup === "auckland-city" && stay.hotel) setComparisonRegion("auckland-city");
                  if (regionalHotels[stay.stayGroup] && stay.hotel) setComparisonRegion(stay.stayGroup);
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
        comparison={comparisonRegion === "auckland-city" ? aucklandCityStay : (regionalStays[comparisonRegion] ?? undefined)}
        hotels={comparisonRegion === "auckland-city" ? aucklandCityHotels : (regionalHotels[comparisonRegion] ?? aucklandAirportHotels)}
        isEnglish={isEnglish}
        onClose={() => setComparisonRegion(null)}
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
  const done = Object.values(checked).filter(Boolean).length;
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
