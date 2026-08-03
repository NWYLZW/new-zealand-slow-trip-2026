import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ExploreIcon from "@mui/icons-material/Explore";
import FlightIcon from "@mui/icons-material/Flight";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import ForumIcon from "@mui/icons-material/Forum";
import HotelIcon from "@mui/icons-material/Hotel";
import LinkIcon from "@mui/icons-material/Link";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
import MapIcon from "@mui/icons-material/Map";
import NightlightIcon from "@mui/icons-material/Nightlight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ParkIcon from "@mui/icons-material/Park";
import PlaceIcon from "@mui/icons-material/Place";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TerrainIcon from "@mui/icons-material/Terrain";
import { DirectionsRenderer, GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Control, DomEvent, divIcon } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { eventMediaByTitle, localNameTranslations } from "../eventMedia";
import { getInlineEventLink, getInlineEventParts } from "../eventLinks";
import { mapStops, northDays, southDays } from "../tripData";
import { itineraryDaysEn } from "../englishTripData";
import { useLanguage } from "../LanguageContext";
import { eventTitleEn, mapStopEn, routeSegmentEn, routeText } from "../routeI18n";
import { socialGuidesByEvent } from "../socialGuides";
import { EventRouteMap } from "./EventRouteMap";
import { SocialGuideCard } from "./SocialGuideCard";
import { CalendarDayCell, CalendarGrid, CalendarWeekdays } from "./calendar/CalendarPrimitives";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const googleRouteActions = {
  overview: {
    label: "在 Google 地图打开南岛自驾",
    origin: "Budget Car Rental Queenstown Airport",
    destination: "Budget Car Rental Christchurch Airport",
    waypoints: ["Arrowtown New Zealand", "Wanaka New Zealand", "Aoraki Mount Cook Village", "Church of the Good Shepherd Lake Tekapo", "Oamaru Blue Penguin Colony", "Christchurch New Zealand"],
  },
  south: {
    label: "在 Google 地图打开南岛自驾",
    origin: "Budget Car Rental Queenstown Airport",
    destination: "Budget Car Rental Christchurch Airport",
    waypoints: ["Arrowtown New Zealand", "Wanaka New Zealand", "Aoraki Mount Cook Village", "Church of the Good Shepherd Lake Tekapo", "Oamaru Blue Penguin Colony", "Christchurch New Zealand"],
  },
  north: {
    label: "在 Google 地图查看奥克兰往返霍比屯大巴路线",
    origin: "SkyCity Coach Terminal, 102 Hobson Street, Auckland 1010, New Zealand",
    destination: "SkyCity Coach Terminal, 102 Hobson Street, Auckland 1010, New Zealand",
    waypoints: ["Hobbiton Movie Set, 501 Buckland Road, Hinuera 3472, New Zealand"],
  },
};

const stopByTag = new Map(mapStops.map((stop) => [stop.tag, stop]));
const placePositions = {
  shenzhenAirport: { lat: 22.6393, lng: 113.8107 },
  aucklandAirport: { lat: -37.0082, lng: 174.785 },
  queenstownAirport: { lat: -45.0211, lng: 168.739 },
  christchurchAirport: { lat: -43.4894, lng: 172.5322 },
  christchurchCbd: { lat: -43.5321, lng: 172.6362 },
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
  "#0a2438",
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
    toPosition: placePositions.queenstownAirport,
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
    id: "aoraki-oamaru",
    sequence: 8,
    date: "10/6",
    label: "库克山 → 蒂卡波 → 奥马鲁",
    transport: "road",
    from: "AOR",
    to: "OAM",
    waypoints: [{ lat: -44.0047, lng: 170.4771 }],
    modes: ["overview", "south"],
    color: "#357b73",
  },
  {
    id: "oamaru-christchurch",
    sequence: 9,
    date: "10/7",
    label: "奥马鲁 → 基督城",
    transport: "road",
    from: "OAM",
    to: "CHC",
    toPosition: placePositions.christchurchCbd,
    modes: ["overview", "south"],
    color: "#357b73",
  },
  {
    id: "christchurch-car-return",
    sequence: 10,
    date: "10/8",
    label: "基督城市中心 → 基督城机场",
    transport: "road",
    from: "CHC",
    to: "CHC",
    fromPosition: placePositions.christchurchCbd,
    toPosition: placePositions.christchurchAirport,
    modes: ["overview", "south"],
    color: "#9d7f66",
  },
  {
    id: "chc-akl",
    sequence: 11,
    date: "10/8",
    label: "基督城 → 奥克兰",
    transport: "flight",
    from: "CHC",
    to: "AKL",
    fromPosition: placePositions.christchurchAirport,
    toPosition: placePositions.aucklandAirport,
    modes: ["overview", "south"],
  },
  {
    id: "akl-akc-transfer",
    sequence: 12,
    date: "10/8",
    label: "奥克兰机场 → 奥克兰市中心",
    transport: "road",
    from: "AKL",
    to: "AKC",
    fromPosition: placePositions.aucklandAirport,
    modes: ["overview", "north"],
  },
  {
    id: "akc-hobbiton-coach",
    sequence: 13,
    date: "10/9",
    label: "奥克兰市中心 → 霍比屯（大巴）",
    transport: "road",
    from: "AKC",
    to: "HBT",
    modes: ["overview", "north"],
  },
  {
    id: "hobbiton-akc-coach",
    sequence: 14,
    date: "10/9",
    label: "霍比屯 → 奥克兰市中心（大巴）",
    transport: "road",
    from: "HBT",
    to: "AKC",
    modes: ["overview", "north"],
  },
  {
    id: "akc-akl-transfer",
    sequence: 15,
    date: "10/10",
    label: "奥克兰市中心 → 奥克兰机场",
    transport: "road",
    from: "AKC",
    to: "AKL",
    toPosition: placePositions.aucklandAirport,
    modes: ["overview", "north"],
  },
  {
    id: "akl-kul",
    sequence: 16,
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
    sequence: 17,
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
  color: segment.color ?? routeColorScale[Math.min(segment.colorIndex ?? segment.sequence - 1, routeColorScale.length - 1)],
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
    stopTags: ["AKL", "ZQN", "WTP", "WKA", "AOR", "TEK", "OAM", "KAT", "CHC"],
    calendarTitle: "南岛行程 · 9月28日—10月8日",
  },
  north: {
    center: { lat: -37.35, lng: 175.2 },
    zoom: 7,
    stopTags: ["AKL", "AKC", "HBT"],
    calendarTitle: "北岛行程 · 10月9日—10月11日",
  },
};

function buildGoogleMapsUrls(mode) {
  const action = googleRouteActions[mode] ?? googleRouteActions.overview;
  const waypoints = action.waypoints.length
    ? `&waypoints=${encodeURIComponent(action.waypoints.join("|"))}`
    : "";
  return {
    routeLabel: action.label,
    routeUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(action.origin)}&destination=${encodeURIComponent(action.destination)}${waypoints}&travelmode=driving`,
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
const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function mondayFirstColumn(date) {
  return ((date.getDay() + 6) % 7) + 1;
}
const itineraryDays = [...southDays, ...northDays];
const englishDayByDate = new Map(itineraryDaysEn.map((day) => [day.date, day]));
const calendarRegionColors = {
  transit: "#dce8f4",
  south: "#f0e1d7",
  north: "#dfebe4",
};
const eventColors = {
  internationalFlight: "#4f79a8",
  domesticFlight: "#6f7db8",
  flightTransfer: "#a52a22",
  queenstownRoad: "#9d7052",
  wanakaRoad: "#8a6a45",
  mountCookRoad: "#6f8fb5",
  christchurchRoad: "#7d765f",
  wildlifeRoad: "#357b73",
  wildlife: "#357b73",
  northRoad: "#347e90",
  queenstown: "#df7659",
  wanaka: "#6fa37d",
  mountCook: "#6f8fb5",
  christchurch: "#9d7f66",
  auckland: "#b98335",
  hobbiton: "#7f9f49",
  boat: "#347e90",
  helicopter: "#6f7db8",
  stargazing: "#4b678f",
};
const eventIconMap = {
  calendar: CalendarTodayIcon,
  flight: FlightTakeoffIcon,
  domesticFlight: FlightIcon,
  bus: DirectionsBusIcon,
  car: DirectionsCarIcon,
  boat: DirectionsBoatIcon,
  hotel: HotelIcon,
  city: ParkIcon,
  nature: TerrainIcon,
  shopping: ShoppingBagIcon,
  culture: LocalActivityIcon,
  movie: LocalMoviesIcon,
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

const eventGoogleRoutes = {
  "乘机前往新西兰": {
    origin: "Shenzhen Bao'an International Airport Terminal 3",
    destination: "Auckland Airport International Terminal",
    waypoints: ["Kuala Lumpur International Airport Terminal 1"],
  },
  "飞往皇后镇": {
    origin: "Auckland Airport Domestic Terminal",
    destination: "Queenstown Airport",
  },
  "南岛取车入住": {
    origin: "Budget Car Rental Queenstown Airport",
    destination: "Queenstown New Zealand",
    travelmode: "driving",
  },
  "格林诺奇湖岸公路": {
    origin: "Queenstown New Zealand",
    destination: "Glenorchy Wharf",
    waypoints: ["Bob's Cove Track", "Bennett's Bluff Lookout"],
    travelmode: "driving",
  },
  "Walter Peak 湖上巡游": {
    origin: "Steamer Wharf Queenstown",
    destination: "Walter Peak High Country Farm",
  },
  "箭镇与 Crown Range": {
    origin: "Queenstown New Zealand",
    destination: "Wanaka Luxury Apartments",
    waypoints: ["Arrowtown New Zealand", "Crown Range Summit", "Cardrona Hotel"],
    travelmode: "driving",
  },
  "自驾前往库克山": {
    origin: "Wanaka Luxury Apartments",
    destination: "Mount Cook Airport",
    waypoints: ["Lindis Pass Viewpoint", "Omarama New Zealand", "Lake Pukaki Viewpoint"],
    travelmode: "driving",
  },
  "蒂卡波到奥马鲁": {
    origin: "Mt Cook Lodge & Motels",
    destination: "Oamaru Blue Penguin Colony",
    waypoints: ["Church of the Good Shepherd Lake Tekapo"],
    travelmode: "driving",
  },
  "奥马鲁企鹅与海狗": {
    origin: "Oamaru New Zealand",
    destination: "Oamaru Blue Penguin Colony",
    waypoints: ["Oamaru Harbour New Zealand"],
    travelmode: "driving",
  },
  "奥马鲁前往基督城": {
    origin: "Oamaru New Zealand",
    destination: "Christchurch New Zealand",
    waypoints: ["Caroline Bay Timaru", "Ashburton New Zealand"],
    travelmode: "driving",
  },
  "前往机场飞奥克兰": {
    origin: "Christchurch New Zealand",
    destination: "Christchurch Airport Domestic Terminal",
    travelmode: "driving",
  },
  "按更新订单还车": {
    origin: "Christchurch New Zealand",
    destination: "Budget Car Rental Christchurch Airport",
    travelmode: "driving",
  },
  "大巴前往霍比屯": {
    origin: "SkyCity Coach Terminal, 102 Hobson Street, Auckland 1010, New Zealand",
    destination: "The Shire's Rest Hobbiton Movie Set",
    travelmode: "driving",
  },
  "大巴返回奥克兰": {
    origin: "The Shire's Rest Hobbiton Movie Set",
    destination: "SkyCity Coach Terminal, 102 Hobson Street, Auckland 1010, New Zealand",
    travelmode: "driving",
  },
  "前往奥克兰机场": {
    origin: "Hotel Grand Chancellor Auckland",
    destination: "Auckland Airport International Terminal",
    travelmode: "driving",
  },
  "返程回深圳": {
    origin: "Auckland Airport International Terminal",
    destination: "Shenzhen Bao'an International Airport Terminal 3",
    waypoints: ["Kuala Lumpur International Airport Terminal 1"],
  },
};

function googleDirectionsUrl({ destination, origin, travelmode, waypoints = [] }) {
  const params = new URLSearchParams({ api: "1", destination, origin });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  if (travelmode) params.set("travelmode", travelmode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

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
    { title: "乘机前往新西兰", calendarLabel: "MH0523 / MH0133", calendarLabelEn: "MH0523 / MH0133", isFlightTransfer: true, time: "02:45—23:50", color: eventColors.flightTransfer, icon: "flight", items: [0, 1, 2, 3, 4, 5, 6], flights: internationalFlights.outbound, flightSummary, segmentIds: ["szx-kul", "kul-akl"], stopTags: ["SZX", "KUL", "AKL"] },
  ],
  "9月29日": [
    { title: "飞往皇后镇", calendarLabel: "JQ295", calendarLabelEn: "JQ295", isFlightTransfer: true, time: "06:15—10:10", color: eventColors.flightTransfer, icon: "domesticFlight", items: [0, 1, 2, 3], flights: [{ flightNumber: "JQ295", date: "2026-09-29", from: "奥克兰 AKL", to: "皇后镇 ZQN", departure: "08:15", arrival: "10:10", departureTerminal: "国内航站楼 D", arrivalTerminal: "未在票面标注", cabin: "经济舱", status: "已出票 · 票面状态 OK", priceNoteZh: "2026-08-03 出票；当前截图对应单人票面总额 CNY 691（票价 CNY 671 + 税费 CNY 20）。", priceNoteEn: "Issued on 3 Aug 2026; the supplied image shows a one-passenger ticket total of CNY 691 (fare CNY 671 + tax CNY 20).", reliabilityNoteZh: "当前截图仅能确认其中一位乘客；另一位仍需用其电子客票单独核对。", reliabilityNoteEn: "The supplied image confirms only one passenger; verify the other passenger against their own e-ticket." }], segmentIds: ["akl-zqn"], stopTags: ["AKL", "ZQN"] },
    { title: "南岛取车入住", time: "11:00—11:30", color: eventColors.queenstownRoad, icon: "car", drive: { distanceKm: 8, durationZh: "约 15 分钟", durationEn: "about 15 min" }, items: [4, 5], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "9月30日": [
    { title: "皇后镇适应日", time: "10:30—18:30", color: eventColors.queenstown, icon: "city", items: [0, 1, 2, 3, 4], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "10月1日": [
    { title: "格林诺奇湖岸公路", time: "10:00—16:30", color: eventColors.queenstownRoad, icon: "car", drive: { distanceKm: 92, durationZh: "约 2 小时", durationEn: "about 2 hr" }, items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-glenorchy"], stopTags: ["ZQN"] },
  ],
  "10月2日": [
    { title: "Walter Peak 湖上巡游", time: "09:30—19:00", color: eventColors.boat, icon: "boat", items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-walter-peak"], stopTags: ["ZQN", "WTP"] },
  ],
  "10月3日": [
    { title: "箭镇与 Crown Range", time: "10:00—14:30", color: eventColors.wanakaRoad, icon: "car", drive: { distanceKm: 95, durationZh: "约 1 小时 45 分钟", durationEn: "about 1 hr 45 min" }, items: [0, 1, 2, 3, 4], segmentIds: ["zqn-wanaka"], stopTags: ["ZQN", "WKA"] },
    { title: "抵达瓦纳卡", time: "16:00", color: eventColors.wanaka, icon: "nature", items: [5], segmentIds: [], stopTags: ["WKA"] },
  ],
  "10月4日": [
    { title: "瓦纳卡湖边慢游", time: "10:30—18:30", color: eventColors.wanaka, icon: "nature", items: [0, 1, 2, 3, 4], segmentIds: [], stopTags: ["WKA"] },
  ],
  "10月5日": [
    { title: "自驾前往库克山", time: "08:45—14:15", color: eventColors.mountCookRoad, icon: "car", drive: { distanceKm: 205, durationZh: "约 2 小时 45 分钟", durationEn: "about 2 hr 45 min" }, items: [0, 1, 2, 3, 4], segmentIds: ["wanaka-aoraki"], stopTags: ["WKA", "AOR"] },
    { title: "冰川直升机", time: "15:30 前后", timeEn: "around 15:30", color: eventColors.helicopter, icon: "domesticFlight", items: [5], segmentIds: [], stopTags: ["AOR"] },
    { title: "库克山观星夜", time: "17:00—21:30", color: eventColors.stargazing, icon: "stargazing", items: [6, 7, 8], segmentIds: [], stopTags: ["AOR"] },
  ],
  "10月6日": [
    { title: "库克山候补安排", time: "08:30—10:00", color: eventColors.mountCook, icon: "nature", items: [0, 1], segmentIds: [], stopTags: ["AOR"] },
    { title: "蒂卡波到奥马鲁", time: "10:00—15:30", color: eventColors.wildlifeRoad, icon: "car", drive: { distanceKm: 281, durationZh: "约 3 小时 26 分钟", durationEn: "about 3 hr 26 min" }, items: [1, 2, 3, 4], segmentIds: ["aoraki-oamaru"], stopTags: ["AOR", "TEK", "OAM"] },
    { title: "奥马鲁企鹅与海狗", time: "16:30—活动后", timeEn: "16:30—after the viewing", color: eventColors.wildlife, icon: "nature", items: [5, 6, 7, 8, 9], segmentIds: [], stopTags: ["OAM"] },
  ],
  "10月7日": [
    { title: "奥马鲁前往基督城", time: "09:30—14:30", color: eventColors.wildlifeRoad, icon: "car", drive: { distanceKm: 245, durationZh: "约 3 小时 6 分钟", durationEn: "about 3 hr 6 min" }, items: [0, 1, 2, 3], segmentIds: ["oamaru-christchurch"], stopTags: ["OAM", "CHC"], stopOverrides: { CHC: { name: "基督城市中心", date: "10/7—10/8", desc: "市中心住1晚；10月8日11:00机场还车", position: [-43.5321, 172.6362] } } },
    { title: "基督城补充半日", time: "15:30—18:30", color: eventColors.christchurch, icon: "city", items: [4, 5, 6], segmentIds: [], stopTags: ["CHC"], stopOverrides: { CHC: { name: "基督城市中心", date: "10/7—10/8", desc: "市中心住1晚；10月8日11:00机场还车", position: [-43.5321, 172.6362] } } },
  ],
  "10月8日": [
    { title: "按更新订单还车", time: "08:30—11:00", color: eventColors.christchurchRoad, icon: "car", items: [0, 1, 2], segmentIds: ["christchurch-car-return"], stopTags: ["CHC"] },
    { title: "前往机场飞奥克兰", calendarLabel: "JQ236", calendarLabelEn: "JQ236", isFlightTransfer: true, time: "还车后—15:10", timeEn: "After car return—15:10", color: eventColors.flightTransfer, icon: "domesticFlight", items: [3, 4, 5], flights: [{ flightNumber: "JQ236", date: "2026-10-08", from: "基督城 CHC", to: "奥克兰 AKL", departure: "13:50", arrival: "15:10", departureTerminal: "未在票面标注", arrivalTerminal: "国内航站楼 D", cabin: "经济舱", status: "已出票 · 票面状态 OK", priceNoteZh: "2026-08-03 出票；当前截图对应单人票面总额 CNY 794（票价 CNY 746 + 税费 CNY 48）。", priceNoteEn: "Issued on 3 Aug 2026; the supplied image shows a one-passenger ticket total of CNY 794 (fare CNY 746 + tax CNY 48).", reliabilityNoteZh: "当前截图仅能确认其中一位乘客；另一位仍需用其电子客票单独核对。11:00还车距起飞约2小时50分钟。", reliabilityNoteEn: "The supplied image confirms only one passenger; verify the other passenger against their own e-ticket. The 11:00 car return leaves about 2 hr 50 min before departure." }], segmentIds: ["chc-akl", "akl-akc-transfer"], stopTags: ["CHC", "AKL", "AKC"] },
  ],
  "10月9日": [
    { title: "大巴前往霍比屯", time: "07:00—09:30", color: eventColors.northRoad, icon: "bus", items: [0, 1, 2], segmentIds: ["akc-hobbiton-coach"], stopTags: ["AKC", "HBT"] },
    { title: "霍比屯游览", time: "09:30—13:15", color: eventColors.hobbiton, icon: "movie", items: [3], segmentIds: [], stopTags: ["HBT"] },
    { title: "大巴返回奥克兰", time: "13:15—15:45后", timeEn: "13:15—after 15:45", color: eventColors.northRoad, icon: "bus", items: [4, 5, 6], segmentIds: ["hobbiton-akc-coach"], stopTags: ["HBT", "AKC"] },
  ],
  "10月10日": [
    { title: "奥克兰轻松半日", time: "09:00—13:00", color: eventColors.auckland, icon: "city", items: [0, 1, 2], segmentIds: [], stopTags: ["AKC"] },
    { title: "前往奥克兰机场", time: "15:30—16:30", color: eventColors.northRoad, icon: "bus", items: [3, 4], segmentIds: ["akc-akl-transfer"], stopTags: ["AKC", "AKL"] },
    { title: "办理返程值机", time: "21:45", color: eventColors.internationalFlight, icon: "flight", items: [5], flights: internationalFlights.inbound, flightSummary, segmentIds: [], stopTags: ["AKL"] },
  ],
  "10月11日": [
    { title: "返程回深圳", calendarLabel: "MH0132 / MH0522", calendarLabelEn: "MH0132 / MH0522", isFlightTransfer: true, time: "00:30—次日 01:15", timeEn: "00:30—01:15 next day", color: eventColors.flightTransfer, icon: "flight", items: [0, 1, 2], flights: internationalFlights.inbound, flightSummary, segmentIds: ["akl-kul", "kul-szx"], stopTags: ["AKL", "KUL", "SZX"] },
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
  const dayKey = day.dateKey ?? day.date;
  const groups = calendarEventGroupsByDate[dayKey] ?? [
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

const eventUrlParam = "event";
const eventTabUrlParam = "eventTab";

function eventDateId(event) {
  const date = event.day.dateKey ?? event.day.date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const match = date.match(/(\d+)月(\d+)日/);
  return match
    ? `${year}-${String(match[1]).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}`
    : date;
}

function eventUrlId(event) {
  return `${eventDateId(event)}|${event.title}`;
}

function eventDialogTabs(event) {
  if (!event) return ["schedule"];
  return [
    "schedule",
    event.flights?.length > 0 && "flight",
    event.media?.localNames?.length > 0 && "names",
    (socialGuidesByEvent[event.title] ?? []).length > 0 && "social",
    event.media?.links?.length > 0 && "links",
  ].filter(Boolean);
}

function readEventUrl(eventById, mode) {
  const url = new URL(window.location.href);
  const routeHash = url.hash.slice(1);
  const isDefaultOverviewRoute = mode === "overview"
    && !["south", "north", "car", "booking", "activities", "notes"].includes(routeHash);
  if (routeHash !== mode && !isDefaultOverviewRoute) return null;
  const requestedEventId = url.searchParams.get(eventUrlParam);
  const event = eventById.get(requestedEventId);
  if (!event) return null;
  const requestedTab = url.searchParams.get(eventTabUrlParam);
  const tab = eventDialogTabs(event).includes(requestedTab) ? requestedTab : "schedule";
  return { eventId: requestedEventId, tab };
}

function writeEventUrl(view, method = "replaceState", state = history.state, mode) {
  const url = new URL(window.location.href);
  if (view) {
    url.searchParams.set(eventUrlParam, view.eventId);
    url.searchParams.set(eventTabUrlParam, view.tab);
    if (mode) url.hash = mode;
  } else {
    url.searchParams.delete(eventUrlParam);
    url.searchParams.delete(eventTabUrlParam);
  }
  history[method](state, "", url);
}

function eventMapData(event) {
  const segmentIds = new Set(event.segmentIds ?? []);
  const stopTags = new Set(event.stopTags ?? []);
  const segments = routeSegments
    .filter((segment) => segmentIds.has(segment.id))
    .map((segment) => ({ ...segment, path: segmentPath(segment) }));
  const stops = mapStops
    .filter((stop) => stopTags.has(stop.tag))
    .map((stop) => ({ ...stop, ...(event.stopOverrides?.[stop.tag] ?? {}) }));

  return { segments, stops };
}

function eventGoogleMapsAction(event, language) {
  const route = eventGoogleRoutes[event.title];
  if (route) {
    return {
      label: routeText("在 Google 地图打开当前路线", language),
      url: googleDirectionsUrl(route),
    };
  }

  const mapLink = event.media?.links?.find((link) => link.kind === "map");
  return {
    label: routeText("在 Google 地图查看当前地点", language),
    url: mapLink?.url
      ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.media?.localNames?.[0] ?? event.media?.location ?? event.title)}`,
  };
}

function InlineEventText({ language = "zh", text }) {
  if (language === "en") return <Typography component="span" className="route-dialog-event-copy">{text}</Typography>;

  return (
    <Typography component="span" className="route-dialog-event-copy">
      {getInlineEventParts(text).map((part, index) => part.url ? (
        <Box
          aria-label={part.label}
          className="route-dialog-inline-link"
          component="a"
          href={part.url}
          key={`${part.text}-${index}`}
          rel="noreferrer"
          target="_blank"
          title={part.label}
        >
          {part.text}<OpenInNewIcon />
        </Box>
      ) : <span key={`${part.text}-${index}`}>{part.text}</span>)}
    </Typography>
  );
}

function LocalNames({ language, names = [], onCopyResult }) {
  return (
    <Stack spacing={1} className="route-local-names">
      {names.map((name) => (
        <Box className="route-local-name" key={name}>
          <Box className="route-local-name-copy">
            {language === "zh" && <Typography className="route-local-name-zh">{localNameTranslations[name] ?? name}</Typography>}
            <Typography className={language === "en" ? "route-local-name-zh" : "route-local-name-local"}>{name}</Typography>
          </Box>
          <Tooltip title={routeText("复制当地名称", language)}>
            <IconButton
              aria-label={`复制 ${name}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(name);
                  onCopyResult({ name, ok: true });
                } catch {
                  onCopyResult({ name, ok: false });
                }
              }}
              size="small"
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Stack>
  );
}

function getEventHeroImages(media) {
  if (!media) return [];
  const candidates = media.images?.length ? media.images : (media.image ? [media] : []);
  const seen = new Set();
  return candidates
    .map((item) => typeof item === "string" ? { image: item } : item)
    .filter((item) => item?.image && !seen.has(item.image) && seen.add(item.image));
}

function documentIsVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function EventHeroCarousel({ children, eventKey, language, media }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const images = useMemo(() => getEventHeroImages(media), [media]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [resumeAfterManualChange, setResumeAfterManualChange] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(documentIsVisible);
  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
    setIsPaused(false);
    setResumeAfterManualChange(false);
  }, [eventKey]);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(documentIsVisible());
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!hasMultipleImages || isPaused || prefersReducedMotion || !isDocumentVisible || resumeAfterManualChange) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [hasMultipleImages, images.length, isDocumentVisible, isPaused, prefersReducedMotion, resumeAfterManualChange]);

  useEffect(() => {
    if (!resumeAfterManualChange || prefersReducedMotion) return undefined;
    const timer = window.setTimeout(() => setResumeAfterManualChange(false), 9000);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, resumeAfterManualChange]);

  const showImage = (index) => {
    setActiveIndex((index + images.length) % images.length);
    setResumeAfterManualChange(true);
  };

  return (
    <Box
      aria-label={language === "en" ? "Event photos" : "行程图片"}
      aria-roledescription="carousel"
      className={images.length ? "route-dialog-title has-media route-hero-carousel" : "route-dialog-title"}
      component="section"
      role="region"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setIsPaused(false);
      }}
    >
      {images.map((image, index) => (
        <Box
          aria-hidden={index !== activeIndex}
          className="route-hero-slide"
          component="img"
          decoding="async"
          key={image.image}
          loading={index === 0 ? "eager" : "lazy"}
          src={image.image}
          alt={index === activeIndex ? (language === "en" ? (image.altEn ?? image.alt ?? "") : (image.alt ?? "")) : ""}
          data-active={index === activeIndex || undefined}
        />
      ))}
      <Box className="route-hero-content">{children}</Box>
      {activeImage?.sourceName && (
        <Typography
          className="route-hero-credit"
          component={activeImage.sourceUrl ? "a" : "span"}
          href={activeImage.sourceUrl}
          rel="noreferrer"
          target={activeImage.sourceUrl ? "_blank" : undefined}
        >
          {language === "en" ? "Photo" : "图片"} · {activeImage.sourceName}{activeImage.license ? ` · ${activeImage.license}` : ""}
        </Typography>
      )}
      {hasMultipleImages && (
        <>
          <IconButton
            aria-label={language === "en" ? "Previous photo" : "上一张图片"}
            className="route-hero-arrow route-hero-arrow-previous"
            onClick={() => showImage(activeIndex - 1)}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label={language === "en" ? "Next photo" : "下一张图片"}
            className="route-hero-arrow route-hero-arrow-next"
            onClick={() => showImage(activeIndex + 1)}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
          <Stack
            aria-label={language === "en" ? "Choose a photo" : "选择图片"}
            className="route-hero-indicators"
            component="div"
            direction="row"
            role="group"
            spacing={0.75}
          >
            {images.map((image, index) => (
              <IconButton
                aria-label={language === "en" ? `Show photo ${index + 1} of ${images.length}` : `查看第 ${index + 1} 张图片，共 ${images.length} 张`}
                aria-pressed={index === activeIndex}
                className="route-hero-indicator"
                data-active={index === activeIndex || undefined}
                key={image.image}
                onClick={() => showImage(index)}
                size="small"
              />
            ))}
          </Stack>
          <Typography aria-live="polite" className="route-visually-hidden">
            {language === "en" ? `Photo ${activeIndex + 1} of ${images.length}` : `第 ${activeIndex + 1} 张图片，共 ${images.length} 张`}
          </Typography>
        </>
      )}
    </Box>
  );
}

function RouteDayCalendar({ days = itineraryDays, dialogTab = "schedule", language = "zh", onDayRegionSelect, onDialogTabChange, onEventSelect, selectedEvent, selectedRegion, title = "2026 新西兰行程 · 9月28日—10月11日" }) {
  const [copyResult, setCopyResult] = useState(null);
  const daysByKey = new Map();
  days.forEach((day) => {
    const date = parseTripDate(day.dateKey ?? day.date);
    if (date) daysByKey.set(keyForDate(date), day);
  });
  const selectedEventKey = selectedEvent ? `${selectedEvent.day.dateKey ?? selectedEvent.day.date}|${selectedEvent.title}` : "";
  const activeDialogTab = eventDialogTabs(selectedEvent).includes(dialogTab) ? dialogTab : "schedule";
  const selectedEventMap = selectedEvent ? eventMapData(selectedEvent) : null;
  const selectedEventGoogleMaps = selectedEvent ? eventGoogleMapsAction(selectedEvent, language) : null;
  const selectedSocialGuides = selectedEvent ? (socialGuidesByEvent[selectedEvent.title] ?? []) : [];

  useEffect(() => {
    setCopyResult(null);
  }, [selectedEventKey]);

  if (!selectedEvent) {
    return (
      <Box className="route-day-calendar">
        <Box className="route-month route-trip-calendar">
          <Typography className="route-month-title">{routeText(title, language)}</Typography>
          <CalendarWeekdays labels={language === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : weekdays} />
          <CalendarGrid>
            {getTripCalendarCells(days).map((date, index) => {
              const day = daysByKey.get(keyForDate(date));
              const calendarEvents = day ? getCalendarEvents(day) : [];
              const hasFlightTransfer = calendarEvents.some((event) => event.isFlightTransfer);
              const cellStyle = {
                gridColumnStart: index === 0 ? mondayFirstColumn(date) : undefined,
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
                <CalendarDayCell
                  aria-label={isSelectableRegion ? (language === "en" ? `Focus ${day.calendarRegion === "south" ? "South Island" : "North Island"} itinerary` : `聚焦${day.calendarRegion === "south" ? "南岛" : "北岛"}行程`) : undefined}
                  aria-pressed={isSelectableRegion ? day.calendarRegion === selectedRegion : undefined}
                  key={date.toISOString()}
                  className={day ? "has-day" : undefined}
                  data-day-region={day?.calendarRegion}
                  data-has-flight-transfer={hasFlightTransfer || undefined}
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
                  date={`${date.getMonth() + 1}/${date.getDate()}`}
                >
                  {day && (
                    <Box>
                      <Stack direction="row" className="route-event-tags">
                        {calendarEvents.map((event) => {
                          const EventIcon = eventIconMap[event.icon] ?? CalendarTodayIcon;
                          const eventLabel = language === "en"
                            ? (event.calendarLabelEn ?? eventTitleEn[event.title] ?? event.title)
                            : (event.calendarLabel ?? event.title);
                          return (
                            <Chip
                              aria-label={`${eventLabel} · ${language === "en" ? (event.timeEn ?? event.time) : event.time}`}
                              data-flight-transfer={event.isFlightTransfer || undefined}
                              key={[day.date, event.title].join("-")}
                              icon={<EventIcon />}
                              label={eventLabel}
                              size="small"
                              title={language === "en" ? (event.timeEn ?? event.time) : event.time}
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
                </CalendarDayCell>
              );
            })}
          </CalendarGrid>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      aria-label={language === "en" ? "Trip event detail" : "行程事件详情"}
      className="route-event-page"
      style={{ "--event-color": selectedEvent.color }}
    >
            <Box className="route-dialog-hero-grid">
              <EventHeroCarousel
                eventKey={selectedEventKey}
                language={language}
                media={selectedEvent.media}
              >
                <Box className="route-dialog-title-copy">
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    {(() => {
                      const EventIcon = eventIconMap[selectedEvent.icon] ?? CalendarTodayIcon;
                      return <EventIcon className="route-dialog-title-icon" />;
                    })()}
                    <Typography variant="h3">{language === "en" ? (eventTitleEn[selectedEvent.title] ?? selectedEvent.title) : selectedEvent.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {language === "en" ? (selectedEvent.day.displayDate ?? selectedEvent.day.date) : selectedEvent.day.date} {selectedEvent.day.weekday} · {selectedEvent.day.title}
                  </Typography>
                  <Stack className="route-dialog-metrics" direction="row" useFlexGap flexWrap="wrap">
                    <Typography className="route-dialog-range">
                      {language === "en" ? `Event window · ${selectedEvent.timeEn ?? selectedEvent.time}` : `行程时段 · ${selectedEvent.time}`}
                    </Typography>
                    {selectedEvent.drive && (
                      <Typography className="route-dialog-drive">
                        <ExploreIcon aria-hidden="true" />
                        {language === "en"
                          ? `Approx. ${selectedEvent.drive.distanceKm} km · Driving ${selectedEvent.drive.durationEn}`
                          : `约 ${selectedEvent.drive.distanceKm} 公里 · 纯驾驶 ${selectedEvent.drive.durationZh}`}
                      </Typography>
                    )}
                  </Stack>
                  {selectedEvent.media?.location && (
                    <Typography className="route-dialog-place">
                      {language === "en" ? `Place · ${selectedEvent.media.localNames?.[0] ?? selectedEvent.media.location}` : `地点 · ${selectedEvent.media.location}`}
                    </Typography>
                  )}
                </Box>
              </EventHeroCarousel>
              <EventRouteMap
                color={selectedEvent.color}
                googleMapsLabel={selectedEventGoogleMaps.label}
                googleMapsUrl={selectedEventGoogleMaps.url}
                key={selectedEventKey}
                language={language}
                segments={selectedEventMap.segments}
                stops={selectedEventMap.stops}
              />
            </Box>
            <Tabs
              aria-label="行程详情分类"
              className="route-dialog-tabs"
              onChange={(_, value) => onDialogTabChange?.(value)}
              scrollButtons="auto"
              value={activeDialogTab}
              variant="scrollable"
            >
              <Tab icon={<CalendarTodayIcon />} iconPosition="start" value="schedule" label={routeText("行程安排", language)} />
              {selectedEvent.flights?.length > 0 && <Tab icon={<FlightIcon />} iconPosition="start" value="flight" label={routeText("机票信息", language)} />}
              {selectedEvent.media?.localNames?.length > 0 && <Tab icon={<PlaceIcon />} iconPosition="start" value="names" label={routeText("相关地名", language)} />}
              {selectedSocialGuides.length > 0 && <Tab icon={<ForumIcon />} iconPosition="start" value="social" label={language === "en" ? "Social guides" : "社交攻略"} />}
              {selectedEvent.media?.links?.length > 0 && <Tab icon={<LinkIcon />} iconPosition="start" value="links" label={routeText("相关链接", language)} />}
            </Tabs>
            <Box className="route-event-page-content">
              {activeDialogTab === "schedule" && (
                <>
                  <Stack spacing={1.2} className="route-dialog-events">
                    {selectedEvent.events.map(([time, text]) => (
                      <Box className="route-dialog-event" key={[selectedEvent.day.date, selectedEvent.title, time, text].join("-")}>
                        <Typography className="route-dialog-time">{routeText(time, language)}</Typography>
                        <InlineEventText language={language} text={text} />
                      </Box>
                    ))}
                  </Stack>
                  <Typography className="route-dialog-stay">{selectedEvent.day.stay}</Typography>
                  {selectedEvent.day.highlight && <Typography className="route-dialog-highlight">{selectedEvent.day.highlight}</Typography>}
                  {selectedEvent.day.alternative && (
                    <Box className="route-dialog-alternative">
                      <Typography fontWeight={950}>{selectedEvent.day.alternative.title}</Typography>
                      <Typography>{selectedEvent.day.alternative.desc}</Typography>
                    </Box>
                  )}
                </>
              )}
              {activeDialogTab === "flight" && (
                <Stack spacing={1.2} className="route-flight-list">
                  {selectedEvent.flightSummary && (
                    <Box className="route-flight-summary">
                      <Typography fontWeight={950}>{selectedEvent.flightSummary.airline}</Typography>
                      <Typography>{routeText(selectedEvent.flightSummary.cabin, language)} · {language === "en" ? "Issued" : "出票日期"} {selectedEvent.flightSummary.issuedOn}</Typography>
                      <Typography>{language === "en" ? `Total per person ${selectedEvent.flightSummary.totalPerPerson} (fare ${selectedEvent.flightSummary.farePerPerson} + taxes ${selectedEvent.flightSummary.taxPerPerson})` : `每人总计 ${selectedEvent.flightSummary.totalPerPerson}（票价 ${selectedEvent.flightSummary.farePerPerson} + 税费 ${selectedEvent.flightSummary.taxPerPerson}）`}</Typography>
                    </Box>
                  )}
                  {selectedEvent.flights.map((flight) => (
                    <Box className="route-flight-card" key={[flight.date, flight.flightNumber].join("-")}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          component="a"
                          href={getInlineEventLink(flight.flightNumber)?.url}
                          target="_blank"
                          rel="noreferrer"
                          variant="h4"
                          className="route-flight-number-link"
                        >
                          {flight.flightNumber}<OpenInNewIcon />
                        </Typography>
                        <Chip label={routeText(flight.status, language)} size="small" style={{ "--event-color": selectedEvent.color }} />
                      </Stack>
                      <Typography className="route-flight-date">{flight.date} · {routeText(flight.cabin, language)}</Typography>
                      {flight.priceNoteZh && <Typography className="route-flight-date">{language === "en" ? flight.priceNoteEn : flight.priceNoteZh}</Typography>}
                      <Box className="route-flight-route">
                        <Box><Typography className="route-flight-time">{flight.departure}</Typography><Typography>{flight.from}</Typography><Typography variant="caption">{routeText(flight.departureTerminal, language)}</Typography></Box>
                        <Typography className="route-flight-arrow">→</Typography>
                        <Box><Typography className="route-flight-time">{flight.arrival}</Typography><Typography>{flight.to}</Typography><Typography variant="caption">{routeText(flight.arrivalTerminal, language)}</Typography></Box>
                      </Box>
                      {flight.reliabilityNoteZh && <Typography className="route-dialog-stay">{language === "en" ? flight.reliabilityNoteEn : flight.reliabilityNoteZh}</Typography>}
                    </Box>
                  ))}
                  {selectedEvent.flightSummary?.note && <Typography className="route-dialog-stay">{language === "en" ? "Both travellers are ticketed. Names, ID numbers, booking references and e-ticket numbers are not shown on this public page." : selectedEvent.flightSummary.note}</Typography>}
                </Stack>
              )}
              {activeDialogTab === "names" && (
                <>
                  <LocalNames language={language} names={selectedEvent.media.localNames} onCopyResult={setCopyResult} />
                  {copyResult && (
                    <Typography className="route-local-name-copied">
                      {copyResult.ok ? (language === "en" ? `Copied: ${copyResult.name}` : `已复制：${copyResult.name}`) : (language === "en" ? "Copy failed — press and hold the name to copy it" : "复制失败，请长按名称手动复制")}
                    </Typography>
                  )}
                </>
              )}
              {activeDialogTab === "social" && (
                <Box className="route-social-guides">
                  {selectedSocialGuides.map((guide) => (
                    <SocialGuideCard guide={guide} key={guide.id ?? guide.sourceUrl ?? guide.url} language={language} />
                  ))}
                </Box>
              )}
              {activeDialogTab === "links" && (
                <Stack spacing={2} className="route-dialog-links">
                  {selectedEvent.media.links.some((link) => link.kind === "official") && (
                    <Box>
                      <Typography className="route-dialog-link-heading">{routeText("官方与预订", language)}</Typography>
                      <Stack spacing={1}>{selectedEvent.media.links.filter((link) => link.kind === "official").map((link) => (
                        <Button key={link.url} component="a" href={link.url} target="_blank" rel="noreferrer" variant="contained" startIcon={<OpenInNewIcon />}>{link.label}</Button>
                      ))}</Stack>
                    </Box>
                  )}
                  {selectedEvent.media.links.some((link) => link.kind === "map") && (
                    <Box>
                      <Typography className="route-dialog-link-heading">{routeText("地点与路线", language)}</Typography>
                      <Stack spacing={1}>{selectedEvent.media.links.filter((link) => link.kind === "map").map((link) => (
                        <Button key={link.url} component="a" href={link.url} target="_blank" rel="noreferrer" variant="outlined" startIcon={<MapIcon />}>{link.label}</Button>
                      ))}</Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
    </Box>
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
            strokeOpacity: segment.optional ? 0 : 0.96,
            strokeWeight: segment.optional ? 4 : 5,
            icons: segment.optional ? [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeColor: segment.color,
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  scale: 2,
                },
                offset: "0",
                repeat: "14px",
              },
            ] : undefined,
            zIndex: segment.optional ? 90 : 100 + Number(segment.sequence),
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
        strokeWeight: segment.optional ? 4 : (hasFailed ? 5 : 4),
        icons: segment.optional && window.google ? [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeColor: segment.color,
              strokeOpacity: 0.9,
              strokeWeight: 2,
              scale: 2,
            },
            offset: "0",
            repeat: "14px",
          },
        ] : undefined,
        zIndex: segment.optional ? 90 : 100 + Number(segment.sequence),
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
        zIndex: 100 + Number(segment.sequence),
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
    className: `leaflet-route-sequence-icon${segment.optional ? " leaflet-route-sequence-icon-option" : ""}`,
    html: `<span class="leaflet-route-sequence-marker" style="--route-color:${segment.color};--route-bearing:${bearing}deg"><span class="leaflet-route-sequence-number">${segment.sequence}</span><span class="leaflet-route-direction" aria-hidden="true"></span></span>`,
    iconAnchor: [15, 15],
    iconSize: [30, 30],
  });
}

function stopIcon(stop) {
  return divIcon({
    className: `leaflet-route-stop-icon${stop.optional ? " leaflet-route-stop-icon-option" : ""}`,
    html: `<span style="--stop-color:${stop.color}"></span>`,
    iconAnchor: [7, 7],
    iconSize: [14, 14],
  });
}

function LeafletResetControl({ center, language = "zh", zoom }) {
  const map = useMap();

  useEffect(() => {
    const control = new Control({ position: "bottomright" });
    control.onAdd = () => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "leaflet-reset-control leaflet-bar";
      button.title = language === "en" ? "Reset map" : "复位地图";
      button.setAttribute("aria-label", language === "en" ? "Reset map" : "复位地图");
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
  }, [center.lat, center.lng, language, map, zoom]);

  return null;
}

function LeafletRouteMap({ language = "zh", mode }) {
  const config = routeConfigs[mode] ?? routeConfigs.overview;
  const stopTags = new Set(config.stopTags);
  const visibleStops = mapStops.filter((stop) => stopTags.has(stop.tag));
  const visibleSegments = routeSegments.filter((segment) => segment.modes.includes(mode));

  return (
    <Box aria-label={language === "en" ? "Interactive trip route map" : "可拖拽缩放的旅行线路地图"} className="leaflet-route-preview" role="application">
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
        {visibleSegments.map((segment) => (
          <Polyline
            key={segment.id}
            pathOptions={{
              color: segment.color,
              dashArray: segment.optional || segment.transport !== "road" ? "8 8" : undefined,
              lineCap: "round",
              lineJoin: "round",
              opacity: 0.94,
              weight: segment.transport === "road" ? 5 : 4,
            }}
            positions={segmentPath(segment)}
          />
        ))}
        {visibleSegments.map((segment) => {
          const marker = segmentMarkerInfo(segment);
          return (
            <Marker
              icon={routeSequenceIcon(segment, marker.bearing)}
              interactive
              key={`${segment.id}-sequence`}
              opacity={segment.optional ? 0.85 : 1}
              position={marker.position}
              zIndexOffset={segment.optional ? 280 : 300 + Number(segment.sequence)}
            >
              <LeafletTooltip direction="top" offset={[0, -15]}>
                {segment.date} · {language === "en" ? (routeSegmentEn[segment.label] ?? segment.label) : segment.label}
              </LeafletTooltip>
            </Marker>
          );
        })}
        {visibleStops.map((stop) => (
          <Marker
            icon={stopIcon(stop)}
            key={stop.tag}
            opacity={1}
            position={toLatLng(stop.tag)}
            zIndexOffset={600}
          >
            <LeafletTooltip direction="top" offset={[0, -8]}>
              <strong>{language === "en" ? (mapStopEn[stop.tag]?.[0] ?? stop.name) : stop.name}</strong><br />
              {stop.tag} · {stop.date}<br />
              {language === "en" ? (mapStopEn[stop.tag]?.[1] ?? stop.desc) : stop.desc}
            </LeafletTooltip>
          </Marker>
        ))}
        <LeafletResetControl center={config.center} language={language} zoom={config.zoom} />
      </MapContainer>
    </Box>
  );
}

function GoogleRouteMap({ language = "zh", mode = "overview" }) {
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
        <Typography fontWeight={900}>{language === "en" ? "Google Maps could not be loaded" : "Google Maps SDK 加载失败"}</Typography>
        <Typography color="text.secondary">{language === "en" ? "Check the API key, network connection and Google Maps JavaScript API settings." : "请检查 API key、网络或 Google Maps JavaScript API 是否已启用。"}</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box className="map-placeholder">
        <Typography color="text.secondary">{language === "en" ? "Loading Google Maps…" : "Google Maps 加载中…"}</Typography>
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
          icon={stop.optional ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: stop.color,
            fillOpacity: 0.18,
            scale: 8,
            strokeColor: stop.color,
            strokeOpacity: 0.95,
            strokeWeight: 2,
          } : undefined}
          key={stop.tag}
          position={{ lat: stop.position[0], lng: stop.position[1] }}
          label={stop.optional ? { text: language === "en" ? "OPTION" : "备选", color: stop.color, fontSize: "9px", fontWeight: "900" } : { text: String(visibleStops.slice(0, index + 1).filter((item) => !item.optional).length), color: "#ffffff", fontWeight: "900" }}
          title={`${stop.tag} · ${language === "en" ? (mapStopEn[stop.tag]?.[0] ?? stop.name) : stop.name}`}
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
            <Typography fontWeight={900}>{language === "en" ? (mapStopEn[hoveredStop.tag]?.[0] ?? hoveredStop.name) : hoveredStop.name}</Typography>
            <Typography variant="caption">{hoveredStop.tag} · {hoveredStop.date}</Typography>
            <Typography variant="body2">{language === "en" ? (mapStopEn[hoveredStop.tag]?.[1] ?? hoveredStop.desc) : hoveredStop.desc}</Typography>
          </Box>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

export function RouteMap({ mode = "overview", days = itineraryDays, onDetailChange }) {
  const { language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const config = routeConfigs[mode] ?? routeConfigs.overview;
  const mapMode = mode === "overview" ? (selectedRegion ?? "overview") : mode;
  const { routeLabel, routeUrl } = buildGoogleMapsUrls(mapMode);
  const localizedDays = useMemo(() => language === "en"
    ? days.map((day) => englishDayByDate.get(day.dateKey ?? day.date) ?? day)
    : days, [days, language]);
  const baseEventById = useMemo(() => new Map(
    localizedDays.flatMap((day) => getCalendarEvents(day).map((event) => [eventUrlId(event), event])),
  ), [localizedDays]);
  const eventById = baseEventById;
  const [eventView, setEventView] = useState(() => readEventUrl(eventById, mode));
  const selectedEvent = eventView ? eventById.get(eventView.eventId) ?? null : null;
  const selectRegion = mode === "overview"
    ? (region) => setSelectedRegion((current) => current === region ? null : region)
    : undefined;

  const closeEvent = useCallback(() => {
    setEventView(null);
    if (history.state?.routeEventPage || history.state?.routeEventDialog) {
      history.back();
      return;
    }
    writeEventUrl(null);
  }, []);

  const selectEvent = (event) => {
    if (!event) {
      closeEvent();
      return;
    }

    const view = { eventId: eventUrlId(event), tab: "schedule" };
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    setEventView(view);
    writeEventUrl(view, "pushState", { ...currentState, routeEventPage: true }, mode);
  };

  const changeDialogTab = (tab) => {
    if (!selectedEvent || !eventDialogTabs(selectedEvent).includes(tab)) return;
    const view = { eventId: eventUrlId(selectedEvent), tab };
    setEventView(view);
    writeEventUrl(view, "replaceState", history.state, mode);
  };

  useEffect(() => {
    const syncEventFromUrl = () => {
      const next = readEventUrl(eventById, mode);
      setEventView(next);

      const url = new URL(window.location.href);
      const ownsCurrentRoute = url.hash === `#${mode}`;
      if (next) {
        if (url.searchParams.get(eventUrlParam) !== next.eventId || url.searchParams.get(eventTabUrlParam) !== next.tab) {
          writeEventUrl(next, "replaceState", history.state, mode);
        }
      } else if (ownsCurrentRoute && (url.searchParams.has(eventUrlParam) || url.searchParams.has(eventTabUrlParam))) {
        writeEventUrl(null);
      }
    };

    syncEventFromUrl();
    window.addEventListener("hashchange", syncEventFromUrl);
    window.addEventListener("popstate", syncEventFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncEventFromUrl);
      window.removeEventListener("popstate", syncEventFromUrl);
    };
  }, [eventById, mode]);

  useEffect(() => {
    if (!onDetailChange) return undefined;
    if (!selectedEvent) {
      onDetailChange(null);
      return undefined;
    }

    onDetailChange({
      label: language === "en" ? (eventTitleEn[selectedEvent.title] ?? selectedEvent.title) : selectedEvent.title,
      onBack: closeEvent,
    });
    return () => onDetailChange(null);
  }, [closeEvent, language, onDetailChange, selectedEvent]);

  const calendar = (
    <RouteDayCalendar
      days={localizedDays}
      dialogTab={eventView?.tab}
      language={language}
      onDayRegionSelect={selectRegion}
      onDialogTabChange={changeDialogTab}
      onEventSelect={selectEvent}
      selectedEvent={selectedEvent}
      selectedRegion={selectedRegion}
      title={config.calendarTitle}
    />
  );

  if (selectedEvent) return calendar;

  return (
    <Box className="route-map-section">
      <Box className="map-frame map-frame-full">
        <Stack direction="row" className="map-actions">
          <Button
            aria-label={routeText(routeLabel, language)}
            startIcon={<MapIcon />}
            variant="contained"
            component="a"
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
          >
            {routeText(routeLabel, language)}
          </Button>
        </Stack>
        {googleMapsApiKey ? (
          <GoogleRouteMap language={language} mode={mapMode} />
        ) : (
          <LeafletRouteMap language={language} mode={mapMode} />
        )}
      </Box>
      {calendar}
    </Box>
  );
}
