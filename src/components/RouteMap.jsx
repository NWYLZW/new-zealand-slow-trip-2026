import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, Stack, Tab, Tabs, Typography } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FlightIcon from "@mui/icons-material/Flight";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import HotelIcon from "@mui/icons-material/Hotel";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import MapIcon from "@mui/icons-material/Map";
import NightlightIcon from "@mui/icons-material/Nightlight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ParkIcon from "@mui/icons-material/Park";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TerrainIcon from "@mui/icons-material/Terrain";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { DirectionsRenderer, GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Control, DomEvent, divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { eventMediaByTitle } from "../eventMedia";
import { mapStops, northDays, southDays } from "../tripData";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const routeQueriesByMode = {
  overview: [
    "Shenzhen",
    "Kuala Lumpur International Airport",
    "Auckland New Zealand",
    "Queenstown New Zealand",
    "Walter Peak High Country Farm Queenstown",
    "Wanaka New Zealand",
    "Aoraki Mount Cook National Park",
    "Christchurch New Zealand",
    "Auckland New Zealand",
    "Hobbiton Movie Set",
    "Rotorua New Zealand",
    "Auckland Airport",
    "Kuala Lumpur International Airport",
    "Shenzhen",
  ],
  south: [
    "Auckland New Zealand",
    "Queenstown New Zealand",
    "Walter Peak High Country Farm Queenstown",
    "Wanaka New Zealand",
    "Aoraki Mount Cook National Park",
    "Christchurch New Zealand",
    "Auckland New Zealand",
  ],
  north: [
    "Auckland Airport",
    "Auckland New Zealand",
    "Hobbiton Movie Set",
    "Rotorua New Zealand",
    "Auckland Airport",
    "Kuala Lumpur International Airport",
    "Shenzhen",
  ],
};

const stopByTag = new Map(mapStops.map((stop) => [stop.tag, stop]));
const placePositions = {
  shenzhenAirport: { lat: 22.6393, lng: 113.8107 },
  aucklandAirport: { lat: -37.0082, lng: 174.785 },
  aucklandCbd: { lat: -36.8509, lng: 174.7645 },
  christchurchAirport: { lat: -43.4894, lng: 172.5322 },
};

const toLatLng = (tag) => {
  const stop = stopByTag.get(tag);
  return { lat: stop.position[0], lng: stop.position[1] };
};

const routeColorScale = [
  "#8fcde3",
  "#7fc3dc",
  "#70b9d5",
  "#61afce",
  "#53a4c7",
  "#4699be",
  "#3b8db4",
  "#317fa8",
  "#28719a",
  "#21638b",
  "#1b557c",
  "#17496d",
  "#143e60",
  "#113451",
  "#0d2b43",
];

const routeSegments = [
  {
    id: "szx-kul",
    sequence: 1,
    date: "9/28",
    label: "深圳 → 吉隆坡",
    transport: "flight",
    from: "SZX",
    to: "KUL",
    fromPosition: placePositions.shenzhenAirport,
    modes: ["overview"],
  },
  {
    id: "kul-akl",
    sequence: 2,
    date: "9/28",
    label: "吉隆坡 → 奥克兰",
    transport: "flight",
    from: "KUL",
    to: "AKL",
    toPosition: placePositions.aucklandAirport,
    modes: ["overview"],
  },
  {
    id: "akl-zqn",
    sequence: 3,
    date: "9/29",
    label: "奥克兰 → 皇后镇",
    transport: "flight",
    from: "AKL",
    to: "ZQN",
    fromPosition: placePositions.aucklandAirport,
    modes: ["overview", "south"],
  },
  {
    id: "zqn-glenorchy",
    sequence: 4,
    date: "10/1",
    label: "皇后镇 ⇄ 格林诺奇",
    transport: "road",
    from: "ZQN",
    to: "ZQN",
    waypoints: [{ lat: -44.8506, lng: 168.388 }],
    modes: ["overview", "south"],
  },
  {
    id: "zqn-walter-peak",
    sequence: 5,
    date: "10/2",
    label: "皇后镇 ⇄ Walter Peak",
    transport: "boat",
    from: "ZQN",
    to: "WTP",
    modes: ["overview", "south"],
  },
  {
    id: "zqn-wanaka",
    sequence: 6,
    date: "10/3",
    label: "皇后镇 → 瓦纳卡",
    transport: "road",
    from: "ZQN",
    to: "WKA",
    waypoints: [
      { lat: -44.9382, lng: 168.8357 },
      { lat: -44.8809, lng: 169.0407 },
    ],
    modes: ["overview", "south"],
  },
  {
    id: "wanaka-aoraki",
    sequence: 7,
    date: "10/5",
    label: "瓦纳卡 → 库克山",
    transport: "road",
    from: "WKA",
    to: "AOR",
    waypoints: [
      { lat: -44.4875, lng: 169.9653 },
      { lat: -44.259, lng: 170.0973 },
      { lat: -44.153, lng: 170.181 },
    ],
    modes: ["overview", "south"],
  },
  {
    id: "aoraki-christchurch",
    sequence: 8,
    date: "10/6",
    label: "库克山 → 基督城",
    transport: "road",
    from: "AOR",
    to: "CHC",
    waypoints: [{ lat: -44.0047, lng: 170.4771 }],
    modes: ["overview", "south"],
  },
  {
    id: "chc-akl",
    sequence: 9,
    date: "10/7",
    label: "基督城 → 奥克兰",
    transport: "flight",
    from: "CHC",
    to: "AKL",
    fromPosition: placePositions.christchurchAirport,
    toPosition: placePositions.aucklandAirport,
    modes: ["overview", "south"],
  },
  {
    id: "auckland-shopping",
    sequence: 10,
    date: "10/8",
    label: "机场 ⇄ 奥克兰市区",
    transport: "road",
    from: "AKL",
    to: "AKL",
    fromPosition: placePositions.aucklandAirport,
    toPosition: placePositions.aucklandAirport,
    waypoints: [placePositions.aucklandCbd],
    modes: ["overview", "north"],
  },
  {
    id: "akl-hobbiton",
    sequence: 11,
    date: "10/9",
    label: "奥克兰 → 霍比屯",
    transport: "road",
    from: "AKL",
    to: "HBT",
    fromPosition: placePositions.aucklandAirport,
    modes: ["overview", "north"],
  },
  {
    id: "hobbiton-rotorua",
    sequence: 12,
    date: "10/9",
    label: "霍比屯 → 罗托鲁瓦",
    transport: "road",
    from: "HBT",
    to: "ROT",
    modes: ["overview", "north"],
  },
  {
    id: "rotorua-akl",
    sequence: 13,
    date: "10/10",
    label: "罗托鲁瓦 → 奥克兰机场",
    transport: "road",
    from: "ROT",
    to: "AKL",
    toPosition: placePositions.aucklandAirport,
    modes: ["overview", "north"],
  },
  {
    id: "akl-kul",
    sequence: 14,
    date: "10/11",
    label: "奥克兰 → 吉隆坡",
    transport: "flight",
    from: "AKL",
    to: "KUL",
    fromPosition: placePositions.aucklandAirport,
    modes: ["overview", "north"],
  },
  {
    id: "kul-szx",
    sequence: 15,
    date: "10/11",
    label: "吉隆坡 → 深圳",
    transport: "flight",
    from: "KUL",
    to: "SZX",
    toPosition: placePositions.shenzhenAirport,
    modes: ["overview", "north"],
  },
].map((segment, index) => ({
  ...segment,
  color: routeColorScale[Math.min(index, routeColorScale.length - 1)],
}));

function segmentPath(segment) {
  return [
    segment.fromPosition ?? toLatLng(segment.from),
    ...(segment.waypoints ?? []),
    segment.toPosition ?? toLatLng(segment.to),
  ];
}

const routeConfigs = {
  overview: {
    center: { lat: -19.2, lng: 151.2 },
    zoom: 3,
    stopTags: mapStops.map((stop) => stop.tag),
    calendarTitle: "2026 新西兰行程 · 9月28日—10月11日",
  },
  south: {
    center: { lat: -44.35, lng: 169.7 },
    zoom: 6,
    stopTags: ["AKL", "ZQN", "WTP", "MFN", "WKA", "AOR", "CHC"],
    calendarTitle: "南岛行程 · 9月28日—10月7日",
  },
  north: {
    center: { lat: -37.55, lng: 175.45 },
    zoom: 7,
    stopTags: ["AKL", "HBT", "ROT"],
    calendarTitle: "北岛行程 · 10月8日—10月11日",
  },
};

function buildGoogleMapsUrls(mode) {
  const queries = routeQueriesByMode[mode] ?? routeQueriesByMode.overview;
  const path = queries.map(encodeURIComponent).join("/");
  return {
    routeUrl: `https://www.google.com/maps/dir/${path}`,
  };
}

const mapOptions = {
  disableDefaultUI: false,
  clickableIcons: true,
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
};

const year = 2026;
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const itineraryDays = [...southDays, ...northDays];
const calendarRegionColors = {
  transit: "#dce8f4",
  south: "#f0e1d7",
  north: "#dfebe4",
};
const calendarRegionFocus = {
  south: {
    segmentIds: ["akl-zqn", "zqn-glenorchy", "zqn-walter-peak", "zqn-wanaka", "wanaka-aoraki", "aoraki-christchurch", "chc-akl"],
    stopTags: ["AKL", "ZQN", "WTP", "WKA", "AOR", "CHC"],
  },
  north: {
    segmentIds: ["auckland-shopping", "akl-hobbiton", "hobbiton-rotorua", "rotorua-akl"],
    stopTags: ["AKL", "HBT", "ROT"],
  },
};
const eventColors = {
  internationalFlight: "#4f79a8",
  domesticFlight: "#6f7db8",
  queenstownRoad: "#9d7052",
  wanakaRoad: "#8a6a45",
  mountCookRoad: "#6f8fb5",
  christchurchRoad: "#7d765f",
  northRoad: "#347e90",
  queenstown: "#df7659",
  wanaka: "#6fa37d",
  mountCook: "#6f8fb5",
  christchurch: "#9d7f66",
  auckland: "#b98335",
  hobbiton: "#7f9f49",
  rotorua: "#b46e55",
  boat: "#347e90",
  helicopter: "#6f7db8",
  stargazing: "#4b678f",
};
const eventIconMap = {
  calendar: CalendarTodayIcon,
  flight: FlightTakeoffIcon,
  domesticFlight: FlightIcon,
  car: DirectionsCarIcon,
  boat: DirectionsBoatIcon,
  hotel: HotelIcon,
  city: ParkIcon,
  nature: TerrainIcon,
  shopping: ShoppingBagIcon,
  culture: LocalActivityIcon,
  movie: LocalMoviesIcon,
  volcano: WhatshotIcon,
  stargazing: NightlightIcon,
};
const internationalFlights = {
  outbound: [
    { flightNumber: "MH0523", date: "2026-09-28", from: "深圳 SZX", to: "吉隆坡 KUL", departure: "02:45", arrival: "06:45", departureTerminal: "以出票信息为准", arrivalTerminal: "T1", cabin: "经济舱", status: "已确认" },
    { flightNumber: "MH0133", date: "2026-09-28", from: "吉隆坡 KUL", to: "奥克兰 AKL", departure: "09:00", arrival: "23:50", departureTerminal: "T1", arrivalTerminal: "国际航站楼 I", cabin: "经济舱", status: "已确认" },
  ],
  inbound: [
    { flightNumber: "MH0132", date: "2026-10-11", from: "奥克兰 AKL", to: "吉隆坡 KUL", departure: "01:25", arrival: "07:55", departureTerminal: "国际航站楼 I", arrivalTerminal: "T1", cabin: "经济舱", status: "已确认" },
    { flightNumber: "MH0522", date: "2026-10-11", from: "吉隆坡 KUL", to: "深圳 SZX", departure: "21:05", arrival: "次日 01:15", departureTerminal: "T1", arrivalTerminal: "以出票信息为准", cabin: "经济舱", status: "已确认" },
  ],
};
const flightSummary = {
  airline: "马来西亚航空 Malaysia Airlines",
  cabin: "经济舱",
  issuedOn: "2026-06-25",
  farePerPerson: "CNY 4,229",
  taxPerPerson: "CNY 2,362",
  totalPerPerson: "CNY 6,591",
  note: "两位旅客均已出票；个人姓名、证件号、PNR 与电子票号不在公开页面展示。",
};

function parseTripDate(dateText) {
  const match = dateText.match(/(\d+)月(\d+)日/);
  if (!match) return null;
  return new Date(year, Number(match[1]) - 1, Number(match[2]));
}

function keyForDate(date) {
  return String(date.getMonth() + 1) + "-" + String(date.getDate());
}

const calendarEventGroupsByDate = {
  "9月28日": [
    { title: "乘机前往新西兰", time: "02:45—23:50", color: eventColors.internationalFlight, icon: "flight", items: [0, 1, 2, 3, 4, 5, 6], flights: internationalFlights.outbound, flightSummary, segmentIds: ["szx-kul", "kul-akl"], stopTags: ["SZX", "KUL", "AKL"] },
  ],
  "9月29日": [
    { title: "飞往皇后镇", time: "09:45—13:30", color: eventColors.domesticFlight, icon: "domesticFlight", items: [0, 1, 2], flights: [{ flightNumber: "NZ619", date: "2026-09-29", from: "奥克兰 AKL", to: "皇后镇 ZQN", departure: "11:35", arrival: "13:30", departureTerminal: "国内航站楼", arrivalTerminal: "以出票信息为准", cabin: "以出票信息为准", status: "待确认行李" }], segmentIds: ["akl-zqn"], stopTags: ["AKL", "ZQN"] },
    { title: "南岛取车入住", time: "15:30—16:15", color: eventColors.queenstownRoad, icon: "car", items: [3, 4], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "9月30日": [
    { title: "皇后镇适应日", time: "10:30—18:30", color: eventColors.queenstown, icon: "city", items: [0, 1, 2, 3, 4], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "10月1日": [
    { title: "格林诺奇湖岸公路", time: "10:00—16:30", color: eventColors.queenstownRoad, icon: "car", items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-glenorchy"], stopTags: ["ZQN"] },
  ],
  "10月2日": [
    { title: "Walter Peak 湖上巡游", time: "09:30—19:00", color: eventColors.boat, icon: "boat", items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-walter-peak"], stopTags: ["ZQN", "WTP"] },
  ],
  "10月3日": [
    { title: "箭镇与 Crown Range", time: "10:00—14:30", color: eventColors.wanakaRoad, icon: "car", items: [0, 1, 2, 3, 4], segmentIds: ["zqn-wanaka"], stopTags: ["ZQN", "WKA"] },
    { title: "抵达瓦纳卡", time: "16:00", color: eventColors.wanaka, icon: "nature", items: [5], segmentIds: [], stopTags: ["WKA"] },
  ],
  "10月4日": [
    { title: "瓦纳卡湖边慢游", time: "10:30—18:30", color: eventColors.wanaka, icon: "nature", items: [0, 1, 2, 3, 4], segmentIds: [], stopTags: ["WKA"] },
  ],
  "10月5日": [
    { title: "自驾前往库克山", time: "08:45—14:15", color: eventColors.mountCookRoad, icon: "car", items: [0, 1, 2, 3, 4], segmentIds: ["wanaka-aoraki"], stopTags: ["WKA", "AOR"] },
    { title: "冰川直升机", time: "15:30 前后", color: eventColors.helicopter, icon: "domesticFlight", items: [5], segmentIds: [], stopTags: ["AOR"] },
    { title: "库克山观星夜", time: "17:00—21:30", color: eventColors.stargazing, icon: "stargazing", items: [6, 7, 8], segmentIds: [], stopTags: ["AOR"] },
  ],
  "10月6日": [
    { title: "库克山候补安排", time: "08:30—10:00", color: eventColors.mountCook, icon: "nature", items: [0, 1], segmentIds: [], stopTags: ["AOR"] },
    { title: "蒂卡波到基督城", time: "11:30—17:30", color: eventColors.christchurchRoad, icon: "car", items: [2, 3, 4], segmentIds: ["aoraki-christchurch"], stopTags: ["AOR", "CHC"] },
  ],
  "10月7日": [
    { title: "基督城城市半日", time: "10:00—13:00", color: eventColors.christchurch, icon: "city", items: [0, 1, 2], segmentIds: [], stopTags: ["CHC"] },
    { title: "还车飞奥克兰", time: "15:30—21:50", color: eventColors.domesticFlight, icon: "domesticFlight", items: [3, 4, 5], flights: [{ flightNumber: "JQ242", date: "2026-10-07", from: "基督城 CHC", to: "奥克兰 AKL", departure: "20:30", arrival: "21:50", departureTerminal: "以出票信息为准", arrivalTerminal: "国内航站楼", cabin: "以出票信息为准", status: "待添加托运行李" }], segmentIds: ["chc-akl"], stopTags: ["CHC", "AKL"] },
  ],
  "10月8日": [
    { title: "奥克兰购物日", time: "09:00—19:30", color: eventColors.auckland, icon: "shopping", items: [0, 1, 2, 3, 4, 5], segmentIds: ["auckland-shopping"], stopTags: ["AKL"] },
  ],
  "10月9日": [
    { title: "取车前往霍比屯", time: "08:30—11:20", color: eventColors.northRoad, icon: "car", items: [0, 1, 2], segmentIds: ["akl-hobbiton"], stopTags: ["AKL", "HBT"] },
    { title: "霍比屯游览", time: "12:00—14:30", color: eventColors.hobbiton, icon: "movie", items: [3, 4], segmentIds: [], stopTags: ["HBT"] },
    { title: "前往罗托鲁瓦", time: "16:30—17:30", color: eventColors.northRoad, icon: "car", items: [5, 6], segmentIds: ["hobbiton-rotorua"], stopTags: ["HBT", "ROT"] },
  ],
  "10月10日": [
    { title: "Te Puia 地热文化", time: "09:00—12:00", color: eventColors.rotorua, icon: "volcano", items: [0, 1], segmentIds: [], stopTags: ["ROT"] },
    { title: "返回奥克兰机场", time: "13:30—18:00", color: eventColors.northRoad, icon: "car", items: [2, 3, 4], segmentIds: ["rotorua-akl"], stopTags: ["ROT", "AKL"] },
    { title: "办理返程值机", time: "21:45", color: eventColors.internationalFlight, icon: "flight", items: [5], flights: internationalFlights.inbound, flightSummary, segmentIds: [], stopTags: ["AKL"] },
  ],
  "10月11日": [
    { title: "返程回深圳", time: "00:30—次日 01:15", color: eventColors.internationalFlight, icon: "flight", items: [0, 1, 2], flights: internationalFlights.inbound, flightSummary, segmentIds: ["akl-kul", "kul-szx"], stopTags: ["AKL", "KUL", "SZX"] },
  ],
};

function getTripCalendarCells(days) {
  const tripDates = days.map((day) => parseTripDate(day.date)).filter(Boolean);
  const tripStart = new Date(Math.min(...tripDates));
  const tripEnd = new Date(Math.max(...tripDates));
  const cells = [];
  const cursor = new Date(tripStart);
  while (cursor <= tripEnd) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function getCalendarEvents(day) {
  const groups = calendarEventGroupsByDate[day.date] ?? [
    { title: day.subtitle || day.title, time: day.events[0]?.[0] || "全天", items: day.events.map((_, index) => index) },
  ];

  return groups.map((group) => ({
    color: eventColors.queenstown,
    icon: "calendar",
    ...group,
    day,
    events: group.items.map((index) => day.events[index]).filter(Boolean),
    media: eventMediaByTitle[group.title],
  }));
}

function RouteDayCalendar({ days = itineraryDays, onDayRegionSelect, onEventSelect, selectedEvent, selectedRegion, title = "2026 新西兰行程 · 9月28日—10月11日" }) {
  const [dialogTab, setDialogTab] = useState("schedule");
  const daysByKey = new Map();
  days.forEach((day) => {
    const date = parseTripDate(day.date);
    if (date) daysByKey.set(keyForDate(date), day);
  });
  const selectedEventKey = selectedEvent ? `${selectedEvent.day.date}|${selectedEvent.title}` : "";
  const activeDialogTab = dialogTab === "flight" && !selectedEvent?.flights?.length ? "schedule" : dialogTab;

  useEffect(() => {
    setDialogTab("schedule");
  }, [selectedEventKey]);

  return (
    <>
      <Box className="route-day-calendar">
        <Box className="route-month route-trip-calendar">
          <Typography className="route-month-title">{title}</Typography>
          <Box className="route-weekdays">
            {weekdays.map((weekday) => <Typography key={weekday}>{weekday}</Typography>)}
          </Box>
          <Box className="route-month-grid">
            {getTripCalendarCells(days).map((date, index) => {
              const day = daysByKey.get(keyForDate(date));
              const cellStyle = {
                gridColumnStart: index === 0 ? date.getDay() + 1 : undefined,
                "--day-color": day ? calendarRegionColors[day.calendarRegion] : undefined,
              };
              const isSelectableRegion = Boolean(day && onDayRegionSelect && (day.calendarRegion === "south" || day.calendarRegion === "north"));
              const regionState = selectedRegion && day
                ? (day.calendarRegion === selectedRegion ? "selected" : "muted")
                : undefined;
              const selectDayRegion = () => {
                if (isSelectableRegion) onDayRegionSelect(day.calendarRegion);
              };

              return (
                <Box
                  aria-label={isSelectableRegion ? `聚焦${day.calendarRegion === "south" ? "南岛" : "北岛"}行程` : undefined}
                  aria-pressed={isSelectableRegion ? day.calendarRegion === selectedRegion : undefined}
                  key={date.toISOString()}
                  className={day ? "route-day-cell has-day" : "route-day-cell"}
                  data-day-region={day?.calendarRegion}
                  data-region-selectable={isSelectableRegion || undefined}
                  data-region-state={regionState}
                  onClick={selectDayRegion}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.target === keyEvent.currentTarget && (keyEvent.key === "Enter" || keyEvent.key === " ")) {
                      keyEvent.preventDefault();
                      selectDayRegion();
                    }
                  }}
                  role={isSelectableRegion ? "button" : undefined}
                  style={cellStyle}
                  tabIndex={isSelectableRegion ? 0 : undefined}
                >
                  <Stack direction="row" alignItems="center" className="route-day-date">
                    <Typography>{date.getMonth() + 1}/{date.getDate()}</Typography>
                  </Stack>
                  {day && (
                    <Box>
                      <Stack direction="row" className="route-event-tags">
                        {getCalendarEvents(day).map((event) => {
                          const EventIcon = eventIconMap[event.icon] ?? CalendarTodayIcon;
                          return (
                            <Chip
                              key={[day.date, event.title].join("-")}
                              icon={<EventIcon />}
                              label={event.title}
                              size="small"
                              title={event.time}
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                onEventSelect?.(event);
                              }}
                              style={{ "--event-color": event.color }}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
      <Dialog
        className="route-dialog"
        open={Boolean(selectedEvent)}
        onClose={() => onEventSelect?.(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: selectedEvent ? { "--event-color": selectedEvent.color } : undefined }}
      >
        {selectedEvent && (
          <>
            <DialogTitle
              className={selectedEvent.media?.image ? "route-dialog-title has-media" : "route-dialog-title"}
              style={selectedEvent.media?.image ? { "--dialog-image": `url("${selectedEvent.media.image}")` } : undefined}
            >
              <Box className="route-dialog-title-copy">
                <Stack direction="row" spacing={1.2} alignItems="center">
                  {(() => {
                    const EventIcon = eventIconMap[selectedEvent.icon] ?? CalendarTodayIcon;
                    return <EventIcon className="route-dialog-title-icon" />;
                  })()}
                  <Typography variant="h3">{selectedEvent.title}</Typography>
                </Stack>
                <Typography color="text.secondary">
                  {selectedEvent.day.date} {selectedEvent.day.weekday} · {selectedEvent.day.title}
                </Typography>
                <Typography className="route-dialog-range">{selectedEvent.time}</Typography>
                {selectedEvent.media?.location && <Typography className="route-dialog-place">地点 · {selectedEvent.media.location}</Typography>}
                {selectedEvent.media?.route && <Typography className="route-dialog-place">路线 · {selectedEvent.media.route}</Typography>}
              </Box>
              {selectedEvent.media?.sourceUrl && (
                <Typography component="a" href={selectedEvent.media.sourceUrl} target="_blank" rel="noreferrer" className="route-dialog-photo-credit">
                  图片：{selectedEvent.media.sourceName}{selectedEvent.media.license ? ` · ${selectedEvent.media.license}` : ""}
                </Typography>
              )}
            </DialogTitle>
            <Tabs value={activeDialogTab} onChange={(_, value) => setDialogTab(value)} className="route-dialog-tabs" aria-label="行程详情分类">
              <Tab value="schedule" label="行程安排" />
              {selectedEvent.flights?.length > 0 && <Tab value="flight" label="机票信息" />}
              {selectedEvent.media?.links?.length > 0 && <Tab value="links" label="相关链接" />}
            </Tabs>
            <DialogContent>
              {activeDialogTab === "schedule" && (
                <>
                  <Stack spacing={1.2} className="route-dialog-events">
                    {selectedEvent.events.map(([time, text]) => (
                      <Box className="route-dialog-event" key={[selectedEvent.day.date, selectedEvent.title, time, text].join("-")}>
                        <Typography className="route-dialog-time">{time}</Typography>
                        <Typography>{text}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Typography className="route-dialog-stay">{selectedEvent.day.stay}</Typography>
                  {selectedEvent.day.highlight && <Typography className="route-dialog-highlight">{selectedEvent.day.highlight}</Typography>}
                </>
              )}
              {activeDialogTab === "flight" && (
                <Stack spacing={1.2} className="route-flight-list">
                  {selectedEvent.flightSummary && (
                    <Box className="route-flight-summary">
                      <Typography fontWeight={950}>{selectedEvent.flightSummary.airline}</Typography>
                      <Typography>{selectedEvent.flightSummary.cabin} · 出票日期 {selectedEvent.flightSummary.issuedOn}</Typography>
                      <Typography>每人总计 {selectedEvent.flightSummary.totalPerPerson}（票价 {selectedEvent.flightSummary.farePerPerson} + 税费 {selectedEvent.flightSummary.taxPerPerson}）</Typography>
                    </Box>
                  )}
                  {selectedEvent.flights.map((flight) => (
                    <Box className="route-flight-card" key={[flight.date, flight.flightNumber].join("-")}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h4">{flight.flightNumber}</Typography>
                        <Chip label={flight.status} size="small" style={{ "--event-color": selectedEvent.color }} />
                      </Stack>
                      <Typography className="route-flight-date">{flight.date} · {flight.cabin}</Typography>
                      <Box className="route-flight-route">
                        <Box><Typography className="route-flight-time">{flight.departure}</Typography><Typography>{flight.from}</Typography><Typography variant="caption">{flight.departureTerminal}</Typography></Box>
                        <Typography className="route-flight-arrow">→</Typography>
                        <Box><Typography className="route-flight-time">{flight.arrival}</Typography><Typography>{flight.to}</Typography><Typography variant="caption">{flight.arrivalTerminal}</Typography></Box>
                      </Box>
                    </Box>
                  ))}
                  {selectedEvent.flightSummary?.note && <Typography className="route-dialog-stay">{selectedEvent.flightSummary.note}</Typography>}
                </Stack>
              )}
              {activeDialogTab === "links" && (
                <Stack spacing={2} className="route-dialog-links">
                  {selectedEvent.media.links.some((link) => link.kind === "official") && (
                    <Box>
                      <Typography className="route-dialog-link-heading">官方与预订</Typography>
                      <Stack spacing={1}>{selectedEvent.media.links.filter((link) => link.kind === "official").map((link) => (
                        <Button key={link.url} component="a" href={link.url} target="_blank" rel="noreferrer" variant="contained" startIcon={<OpenInNewIcon />}>{link.label}</Button>
                      ))}</Stack>
                    </Box>
                  )}
                  {selectedEvent.media.links.some((link) => link.kind === "map") && (
                    <Box>
                      <Typography className="route-dialog-link-heading">地点与路线</Typography>
                      <Stack spacing={1}>{selectedEvent.media.links.filter((link) => link.kind === "map").map((link) => (
                        <Button key={link.url} component="a" href={link.url} target="_blank" rel="noreferrer" variant="outlined" startIcon={<MapIcon />}>{link.label}</Button>
                      ))}</Stack>
                    </Box>
                  )}
                  {selectedEvent.media.links.some((link) => link.kind === "social") && (
                    <Box>
                      <Typography className="route-dialog-link-heading">社交媒体参考</Typography>
                      <Stack spacing={1}>{selectedEvent.media.links.filter((link) => link.kind === "social").map((link) => (
                        <Button key={link.url} component="a" href={link.url} target="_blank" rel="noreferrer" variant="outlined" startIcon={<SearchIcon />}>{link.label}</Button>
                      ))}</Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}

function RoadRouteSegment({ segment }) {
  const [directions, setDirections] = useState(null);
  const [hasFailed, setHasFailed] = useState(false);
  const path = useMemo(() => segmentPath(segment), [segment]);

  useEffect(() => {
    if (!window.google?.maps) return undefined;

    let isActive = true;
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: path[0],
        destination: path[path.length - 1],
        waypoints: path.slice(1, -1).map((location) => ({
          location,
          stopover: true,
        })),
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (!isActive) return;
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setHasFailed(false);
        } else {
          setHasFailed(true);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, [path]);

  if (directions) {
    return (
      <DirectionsRenderer
        directions={directions}
        options={{
          preserveViewport: true,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: segment.color,
            strokeOpacity: 0.96,
            strokeWeight: 5,
            zIndex: 100 + segment.sequence,
          },
        }}
      />
    );
  }

  return (
    <PolylineF
      path={path}
      options={{
        geodesic: false,
        strokeColor: segment.color,
        strokeOpacity: hasFailed ? 0.88 : 0.46,
        strokeWeight: hasFailed ? 5 : 4,
        zIndex: 100 + segment.sequence,
      }}
    />
  );
}

function ManualRouteSegment({ segment, isLoaded }) {
  const icons = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;

    return [
      {
        icon: {
          path: "M 0,-1 0,1",
          strokeColor: segment.color,
          strokeOpacity: 1,
          strokeWeight: 2,
          scale: 2,
        },
        offset: "0",
        repeat: segment.transport === "flight" ? "18px" : "14px",
      },
      {
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: segment.color,
          fillOpacity: 1,
          strokeColor: segment.color,
          strokeOpacity: 1,
          scale: 1.8,
        },
        offset: "56%",
      },
    ];
  }, [isLoaded, segment]);

  return (
    <PolylineF
      path={segmentPath(segment)}
      options={{
        geodesic: segment.transport === "flight",
        strokeColor: segment.color,
        strokeOpacity: 0,
        strokeWeight: 4,
        icons,
        zIndex: 100 + segment.sequence,
      }}
    />
  );
}

function segmentMarkerInfo(segment) {
  const path = segmentPath(segment);
  const fromIndex = Math.floor((path.length - 1) / 2);
  const from = path[fromIndex];
  const to = path[fromIndex + 1];
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const bearing = (Math.atan2(
    Math.sin(deltaLng) * Math.cos(toLat),
    (Math.cos(fromLat) * Math.sin(toLat))
      - (Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)),
  ) * 180) / Math.PI;

  return {
    bearing: (bearing + 360) % 360,
    position: {
      lat: (from.lat + to.lat) / 2,
      lng: (from.lng + to.lng) / 2,
    },
  };
}

function routeSequenceIcon(segment, bearing) {
  return divIcon({
    className: "leaflet-route-sequence-icon",
    html: `<span class="leaflet-route-sequence-marker" style="--route-color:${segment.color};--route-bearing:${bearing}deg"><span class="leaflet-route-sequence-number">${segment.sequence}</span><span class="leaflet-route-direction" aria-hidden="true"></span></span>`,
    iconAnchor: [15, 15],
    iconSize: [30, 30],
  });
}

function stopIcon(stop) {
  return divIcon({
    className: "leaflet-route-stop-icon",
    html: `<span style="--stop-color:${stop.color}"></span>`,
    iconAnchor: [7, 7],
    iconSize: [14, 14],
  });
}

function LeafletResetControl({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    const control = new Control({ position: "bottomright" });
    control.onAdd = () => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "leaflet-reset-control leaflet-bar";
      button.title = "复位地图";
      button.setAttribute("aria-label", "复位地图");
      button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3H3v4h2V5h2V3Zm12 4h2V3h-4v2h2v2ZM5 17H3v4h4v-2H5v-2Zm14 2h-2v2h4v-4h-2v2Zm-7-11a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>';
      DomEvent.disableClickPropagation(button);
      DomEvent.disableScrollPropagation(button);
      DomEvent.on(button, "click", () => {
        map.setView([center.lat, center.lng], zoom, { animate: true });
      });
      return button;
    };
    control.addTo(map);
    return () => control.remove();
  }, [center.lat, center.lng, map, zoom]);

  return null;
}

function LeafletActiveBounds({ activeSegmentIds, activeStopTags, mode }) {
  const map = useMap();
  const activeSignature = [...activeSegmentIds].sort().join("|") + ":" + [...activeStopTags].sort().join("|");
  const activeSegmentSignature = [...activeSegmentIds].sort().join("|");
  const activeStopSignature = [...activeStopTags].sort().join("|");

  useEffect(() => {
    if (!activeSignature) return;
    const points = [];
    const activeSegments = new Set(activeSegmentSignature ? activeSegmentSignature.split("|") : []);
    const activeStops = new Set(activeStopSignature ? activeStopSignature.split("|") : []);
    routeSegments.forEach((segment) => {
      if (segment.modes.includes(mode) && activeSegments.has(segment.id)) {
        segmentPath(segment).forEach((point) => points.push([point.lat, point.lng]));
      }
    });
    mapStops.forEach((stop) => {
      if (activeStops.has(stop.tag)) points.push(stop.position);
    });
    if (!points.length) return;
    const bounds = latLngBounds(points);
    map.fitBounds(bounds, {
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      duration: 0.35,
      maxZoom: mode === "overview" ? 8 : 10,
      paddingTopLeft: [44, 54],
      paddingBottomRight: [44, 64],
    });
  }, [activeSegmentSignature, activeSignature, activeStopSignature, map, mode]);

  return null;
}

function LeafletRouteMap({ activeSegmentIds = [], activeStopTags = [], mode }) {
  const config = routeConfigs[mode] ?? routeConfigs.overview;
  const stopTags = new Set(config.stopTags);
  const visibleStops = mapStops.filter((stop) => stopTags.has(stop.tag));
  const visibleSegments = routeSegments.filter((segment) => segment.modes.includes(mode));
  const visibleSegmentIdSet = new Set(visibleSegments.map((segment) => segment.id));
  const visibleStopTagSet = new Set(visibleStops.map((stop) => stop.tag));
  const activeSegments = new Set(activeSegmentIds.filter((id) => visibleSegmentIdSet.has(id)));
  const activeStops = new Set(activeStopTags.filter((tag) => visibleStopTagSet.has(tag)));
  const hasActiveSelection = activeSegments.size > 0 || activeStops.size > 0;
  const orderedSegments = hasActiveSelection
    ? [...visibleSegments].sort((a, b) => Number(activeSegments.has(a.id)) - Number(activeSegments.has(b.id)))
    : visibleSegments;

  return (
    <Box aria-label="可拖拽缩放的旅行线路地图" className="leaflet-route-preview" role="application">
      <MapContainer
        center={[config.center.lat, config.center.lng]}
        className="leaflet-route-map"
        key={mode}
        maxZoom={18}
        minZoom={2}
        scrollWheelZoom
        worldCopyJump
        zoom={config.zoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {orderedSegments.map((segment) => {
          const isActive = activeSegments.has(segment.id);
          return (
          <Polyline
            key={segment.id}
            pathOptions={{
              color: segment.color,
              dashArray: segment.transport === "road" ? undefined : "8 8",
              lineCap: "round",
              lineJoin: "round",
              opacity: hasActiveSelection ? (isActive ? 1 : 0.16) : 0.94,
              weight: hasActiveSelection ? (isActive ? (segment.transport === "road" ? 7 : 6) : 2) : (segment.transport === "road" ? 5 : 4),
            }}
            positions={segmentPath(segment)}
          />
          );
        })}
        {visibleSegments.map((segment) => {
          const marker = segmentMarkerInfo(segment);
          const isActive = activeSegments.has(segment.id);
          return (
            <Marker
              icon={routeSequenceIcon(segment, marker.bearing)}
              interactive
              key={`${segment.id}-sequence`}
              opacity={hasActiveSelection ? (isActive ? 1 : 0.22) : 1}
              position={marker.position}
              zIndexOffset={isActive ? 1000 + segment.sequence : 300 + segment.sequence}
            >
              <LeafletTooltip direction="top" offset={[0, -15]}>
                {segment.date} · {segment.label}
              </LeafletTooltip>
            </Marker>
          );
        })}
        {visibleStops.map((stop) => (
          <Marker
            icon={stopIcon(stop)}
            key={stop.tag}
            opacity={hasActiveSelection ? (activeStops.has(stop.tag) ? 1 : 0.25) : 1}
            position={toLatLng(stop.tag)}
            zIndexOffset={activeStops.has(stop.tag) ? 1200 : 600}
          >
            <LeafletTooltip direction="top" offset={[0, -8]}>
              <strong>{stop.name}</strong><br />
              {stop.tag} · {stop.date}<br />
              {stop.desc}
            </LeafletTooltip>
          </Marker>
        ))}
        <LeafletActiveBounds activeSegmentIds={activeSegments} activeStopTags={activeStops} mode={mode} />
        <LeafletResetControl center={config.center} zoom={config.zoom} />
      </MapContainer>
    </Box>
  );
}

function GoogleRouteMap({ mode = "overview" }) {
  const [hoveredTag, setHoveredTag] = useState(null);
  const config = routeConfigs[mode] ?? routeConfigs.overview;
  const stopTags = new Set(config.stopTags);
  const visibleStops = mapStops.filter((stop) => stopTags.has(stop.tag));
  const visibleSegments = routeSegments.filter((segment) => segment.modes.includes(mode));
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: "nz-trip-google-maps",
  });
  const hoveredStop = hoveredTag ? stopByTag.get(hoveredTag) : null;

  if (loadError) {
    return (
      <Box className="map-placeholder">
        <Typography fontWeight={900}>Google Maps SDK 加载失败</Typography>
        <Typography color="text.secondary">请检查 API key、网络或 Google Maps JavaScript API 是否已启用。</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box className="map-placeholder">
        <Typography color="text.secondary">Google Maps 加载中…</Typography>
      </Box>
    );
  }

  return (
    <GoogleMap mapContainerClassName="google-route-map" center={config.center} zoom={config.zoom} options={mapOptions}>
      {visibleSegments.map((segment) => (
        segment.transport === "road"
          ? <RoadRouteSegment key={segment.id} segment={segment} />
          : <ManualRouteSegment key={segment.id} segment={segment} isLoaded={isLoaded} />
      ))}
      {visibleStops.map((stop, index) => (
        <MarkerF
          key={stop.tag}
          position={{ lat: stop.position[0], lng: stop.position[1] }}
          label={{ text: String(index + 1), color: "#ffffff", fontWeight: "900" }}
          title={`${stop.tag} · ${stop.name}`}
          onMouseOver={() => setHoveredTag(stop.tag)}
          onMouseOut={() => setHoveredTag(null)}
        />
      ))}
      {hoveredStop && (
        <InfoWindowF
          position={{ lat: hoveredStop.position[0], lng: hoveredStop.position[1] }}
          onCloseClick={() => setHoveredTag(null)}
        >
          <Box className="map-info-window">
            <Typography fontWeight={900}>{hoveredStop.name}</Typography>
            <Typography variant="caption">{hoveredStop.tag} · {hoveredStop.date}</Typography>
            <Typography variant="body2">{hoveredStop.desc}</Typography>
          </Box>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

export function RouteMap({ mode = "overview", days = itineraryDays }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const config = routeConfigs[mode] ?? routeConfigs.overview;
  const { routeUrl } = buildGoogleMapsUrls(mode);
  const regionFocus = selectedRegion ? calendarRegionFocus[selectedRegion] : null;
  const activeSegmentIds = selectedEvent?.segmentIds ?? regionFocus?.segmentIds ?? [];
  const activeStopTags = selectedEvent?.stopTags ?? regionFocus?.stopTags ?? [];
  const selectRegion = mode === "overview"
    ? (region) => {
      setSelectedEvent(null);
      setSelectedRegion((current) => current === region ? null : region);
    }
    : undefined;

  return (
    <Card className="map-card">
      <CardContent>
        <Box className="map-frame map-frame-full">
          <Stack direction="row" className="map-actions">
            <Button
              aria-label="在 Google 地图打开完整路线"
              startIcon={<MapIcon />}
              variant="contained"
              component="a"
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
            >
              在 Google 地图打开完整路线
            </Button>
          </Stack>
          {googleMapsApiKey ? (
            <GoogleRouteMap mode={mode} />
          ) : (
            <LeafletRouteMap
              activeSegmentIds={activeSegmentIds}
              activeStopTags={activeStopTags}
              mode={mode}
            />
          )}
        </Box>
        <RouteDayCalendar
          days={days}
          onDayRegionSelect={selectRegion}
          onEventSelect={setSelectedEvent}
          selectedEvent={selectedEvent}
          selectedRegion={selectedRegion}
          title={config.calendarTitle}
        />
      </CardContent>
    </Card>
  );
}
