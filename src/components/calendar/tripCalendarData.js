import { eventMediaByTitle } from "../../eventMedia";
import { southDays, northDays } from "../../tripData";
import { confirmedStayTransitionsOn } from "../../data/confirmedStayTimeline";
import { itineraryDaysEn } from "../../englishTripData";
import { eventTitleEn } from "../../routeI18n";

const year = 2026;
const itineraryDays = [...southDays, ...northDays];
const englishDayByDate = new Map(itineraryDaysEn.map((day) => [day.date, day]));

export const calendarRegionColors = {
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
  confirmedStay: "#527b65",
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

export function parseTripDate(dateText) {
  const match = dateText.match(/(\d+)月(\d+)日/);
  if (!match) return null;
  return new Date(year, Number(match[1]) - 1, Number(match[2]));
}

export function keyForDate(date) {
  return String(date.getMonth() + 1) + "-" + String(date.getDate());
}

const calendarEventGroupsByDate = {
  "9月28日": [
    { title: "前往深圳机场", titleEn: "Travel to Shenzhen Airport", calendarLabel: "前往机场", calendarLabelEn: "To the airport",
      time: "9/27 23:45—9/28 02:45", timeEn: "27 Sep 23:45—28 Sep 02:45",
      date: "2026-09-27", endDate: "2026-09-28", timeZone: "Asia/Shanghai",
      scheduleStart: { date: "2026-09-27", time: "23:45", timeZone: "Asia/Shanghai",
        label: "从家出发前往深圳机场", labelEn: "Leave home for Shenzhen Airport",
        arrivalStatus: "planned", arrivalDate: "2026-09-28", arrivalTime: "00:30",
        userEstimateMinutes: 45, originArea: null, transportMode: null },
      color: eventColors.internationalFlight, icon: "flight", items: [0, 1, 6], segmentIds: [], stopTags: ["SZX"] },
    { title: "乘机前往新西兰", calendarLabel: "乘机前往新西兰", calendarLabelEn: "Fly to New Zealand", isFlightTransfer: true,
      time: "02:45—23:50", timeEn: "02:45–23:50", color: eventColors.flightTransfer, icon: "flight",
      items: [2, 3, 4, 5], flights: internationalFlights.outbound,
      flightSummary, segmentIds: ["szx-kul", "kul-akl"], stopTags: ["SZX", "KUL", "AKL"] },
  ],
  "9月29日": [
    { title: "奥克兰机场候机", titleEn: "Auckland Airport overnight wait", calendarLabel: "候机", calendarLabelEn: "Airport wait",
      time: "23:50—约01:00、01:15—06:15", timeEn: "23:50–around 01:00, then 01:15–06:15",
      color: eventColors.internationalFlight, icon: "flight", items: [12, 11], segmentIds: [], stopTags: ["AKL"] },
    { title: "飞往皇后镇", calendarLabel: "飞往皇后镇", calendarLabelEn: "Fly to Queenstown", isFlightTransfer: true, time: "06:15—10:10", color: eventColors.flightTransfer, icon: "domesticFlight", items: [0, 1, 2], flights: [{ flightNumber: "JQ295", date: "2026-09-29", from: "奥克兰 AKL", to: "皇后镇 ZQN", departure: "08:15", arrival: "10:10", departureTerminal: "国内航站楼 D", arrivalTerminal: "未在票面标注", cabin: "经济舱", status: "已出票 · 票面状态 OK", priceNoteZh: "2026-08-03 出票；当前截图对应单人票面总额 CNY 691（票价 CNY 671 + 税费 CNY 20）。", priceNoteEn: "Issued on 3 Aug 2026; the supplied image shows a one-passenger ticket total of CNY 691 (fare CNY 671 + tax CNY 20).", reliabilityNoteZh: "当前截图仅能确认其中一位乘客；另一位仍需用其电子客票单独核对。", reliabilityNoteEn: "The supplied image confirms only one passenger; verify the other passenger against their own e-ticket." }], segmentIds: ["akl-zqn"], stopTags: ["AKL", "ZQN"] },
    { title: "南岛取车入住", calendarLabel: "适应右舵驾驶", calendarLabelEn: "Adjust to a right-hand-drive car",
      time: "10:10—18:00", timeEn: "10:10–18:00", color: eventColors.queenstownRoad, icon: "car",
      drive: { distanceKm: 8, distanceStatus: "existing-estimate",
        durationZh: "到市中心通常约 15 分钟（不含停车、适应驾驶或拥堵；非住宿精确车程）",
        durationEn: "about 15 min to downtown under normal conditions (excluding parking, driving adjustment or congestion; not the exact drive to the stay)",
        sourceName: "Queenstown NZ 官方旅游站", sourceUrl: "https://www.queenstownnz.co.nz/plan/getting-here-and-getting-around/queenstown-airport/",
        reviewedAt: "2026-09-26", destinationScope: "downtown-reference-not-stay" },
      items: [3, 4, 5, 6, 7, 8, 9, 10, 13], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "9月30日": [
    { title: "皇后镇适应日", time: "10:30—20:00", timeEn: "10:30–20:00",
      color: eventColors.queenstown, icon: "city", items: [0, 1, 2, 3, 4], segmentIds: [], stopTags: ["ZQN"] },
  ],
  "10月1日": [
    { title: "格林诺奇湖岸公路", time: "10:00—16:30", color: eventColors.queenstownRoad, icon: "car", drive: { distanceKm: 92, durationZh: "约 2 小时", durationEn: "about 2 hr" }, items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-glenorchy"], stopTags: ["ZQN"] },
  ],
  "10月2日": [
    { title: "Walter Peak 湖上巡游", time: "09:30—20:00", color: eventColors.boat, icon: "boat", items: [0, 1, 2, 3, 4, 5], segmentIds: ["zqn-walter-peak"], stopTags: ["ZQN", "WTP"] },
  ],
  "10月3日": [
    { title: "箭镇与 Crown Range", time: "10:00—16:00", color: eventColors.wanakaRoad, icon: "car", drive: { distanceKm: 95, durationZh: "约 1 小时 45 分钟", durationEn: "about 1 hr 45 min" }, items: [0, 1, 2, 3, 4], segmentIds: ["zqn-wanaka"], stopTags: ["ZQN", "WKA"] },
    { title: "抵达瓦纳卡", time: "16:00—17:30", color: eventColors.wanaka, icon: "nature", items: [5], segmentIds: [], stopTags: ["WKA"] },
    { title: "瓦纳卡星空摄影", calendarLabel: "星空摄影 · 已完成", calendarLabelEn: "Night-sky photography · Completed",
      time: "约22:30—23:10", timeEn: "Around 22:30–23:10", color: eventColors.stargazing, icon: "stargazing",
      items: [6], segmentIds: [], stopTags: ["WKA"] },
  ],
  "10月4日": [
    { title: "瓦纳卡湖边慢游", calendarLabel: "Puzzling World 与 Lake Hāwea", calendarLabelEn: "Puzzling World and Lake Hāwea",
      time: "10:00—20:15", timeEn: "10:00–20:15", color: eventColors.wanaka, icon: "nature",
      items: [0, 1, 2, 3, 4, 5, 6, 7], segmentIds: ["wka-puzzling-world", "wka-hawea", "wka-wanaka-tree"], stopTags: ["WKA", "HWA"],
      stopOverrides: { HWA: { name: "Lake Hāwea 南岸", nameEn: "Lake Hāwea southern shore", date: "10/4",
        desc: "Capell Avenue 片区参考点，不是停车入口", descEn: "Capell Avenue area reference, not a parking entrance",
        position: [-44.6108669, 169.2564053], timeZone: "Pacific/Auckland",
        coordinateSourceUrl: "https://www.wanaka.co.nz/about-wanaka/recommended-trips/wanaka-day-trips/lake-hawea-wanaka-loop/",
        coordinateSourceNote: "Official itinerary map: Hawea Store & Kitchen, 33 Capell Avenue; area reference only",
        reviewedAt: "2026-10-04" } } },
  ],
  "10月5日": [
    { title: "自驾前往库克山", time: "08:45—15:30", color: eventColors.mountCookRoad, icon: "car", drive: { distanceKm: 205, durationZh: "约 2 小时 45 分钟", durationEn: "about 2 hr 45 min" }, items: [0, 1, 2, 3, 4], segmentIds: ["wanaka-aoraki"], stopTags: ["WKA", "AOR"] },
    { title: "冰川直升机", time: "15:30—16:15", timeEn: "15:30–16:15", color: eventColors.helicopter, icon: "domesticFlight", items: [5], segmentIds: [], stopTags: ["AOR"] },
    { title: "库克山观星夜", time: "17:00—23:00", color: eventColors.stargazing, icon: "stargazing", items: [6, 7, 8], segmentIds: [], stopTags: ["AOR"] },
  ],
  "10月6日": [
    { title: "库克山候补安排", time: "08:30—09:15", color: eventColors.mountCook, icon: "nature", items: [0], segmentIds: [], stopTags: ["AOR"] },
    { title: "蒂卡波到奥马鲁", time: "10:00—16:30", color: eventColors.wildlifeRoad, icon: "car", drive: { distanceKm: 281, durationZh: "约 3 小时 26 分钟", durationEn: "about 3 hr 26 min" }, items: [1, 2, 3, 4], segmentIds: ["aoraki-oamaru"], stopTags: ["AOR", "TEK", "OAM"] },
    { title: "奥马鲁企鹅与海狗", time: "16:30—22:00", timeEn: "16:30–22:00", color: eventColors.wildlife, icon: "nature", items: [5, 6, 7, 8, 9], segmentIds: [], stopTags: ["OAM"] },
  ],
  "10月7日": [
    { title: "奥马鲁前往基督城", time: "09:30—15:30", color: eventColors.wildlifeRoad, icon: "car", drive: { distanceKm: 245, durationZh: "约 3 小时 6 分钟", durationEn: "about 3 hr 6 min" }, items: [0, 1, 2, 3], segmentIds: ["oamaru-christchurch"], stopTags: ["OAM", "CHC"], stopOverrides: { CHC: { name: "基督城市中心", date: "10/7—10/8", desc: "市中心住1晚；10月8日11:00机场还车", position: [-43.5321, 172.6362] } } },
    { title: "基督城补充半日", time: "15:30—20:00", color: eventColors.christchurch, icon: "city", items: [4, 5, 6], segmentIds: [], stopTags: ["CHC"], stopOverrides: { CHC: { name: "基督城市中心", date: "10/7—10/8", desc: "市中心住1晚；10月8日11:00机场还车", position: [-43.5321, 172.6362] } } },
  ],
  "10月8日": [
    { title: "按更新订单还车", time: "08:30—11:00", color: eventColors.christchurchRoad, icon: "car", items: [0, 1, 2], segmentIds: ["christchurch-car-return"], stopTags: ["CHC"] },
    { title: "前往机场飞奥克兰", calendarLabel: "飞往奥克兰", calendarLabelEn: "Fly to Auckland", isFlightTransfer: true, time: "11:00—16:30", timeEn: "11:00–16:30", color: eventColors.flightTransfer, icon: "domesticFlight", items: [3, 4, 5], flights: [{ flightNumber: "JQ236", date: "2026-10-08", from: "基督城 CHC", to: "奥克兰 AKL", departure: "13:50", arrival: "15:10", departureTerminal: "未在票面标注", arrivalTerminal: "国内航站楼 D", cabin: "经济舱", status: "已出票 · 票面状态 OK", priceNoteZh: "2026-08-03 出票；当前截图对应单人票面总额 CNY 794（票价 CNY 746 + 税费 CNY 48）。", priceNoteEn: "Issued on 3 Aug 2026; the supplied image shows a one-passenger ticket total of CNY 794 (fare CNY 746 + tax CNY 48).", reliabilityNoteZh: "当前截图仅能确认其中一位乘客；另一位仍需用其电子客票单独核对。11:00还车距起飞约2小时50分钟。", reliabilityNoteEn: "The supplied image confirms only one passenger; verify the other passenger against their own e-ticket. The 11:00 car return leaves about 2 hr 50 min before departure." }], segmentIds: ["chc-akl", "akl-akc-transfer"], stopTags: ["CHC", "AKL", "AKC"] },
  ],
  "10月9日": [
    { title: "大巴前往霍比屯", time: "07:00—09:30", color: eventColors.northRoad, icon: "bus", items: [0, 1, 2], segmentIds: ["akc-hobbiton-coach"], stopTags: ["AKC", "HBT"] },
    { title: "霍比屯游览", time: "09:30—13:15", color: eventColors.hobbiton, icon: "movie", items: [3], segmentIds: [], stopTags: ["HBT"] },
    { title: "大巴返回奥克兰", time: "13:15—16:30", timeEn: "13:15–16:30", color: eventColors.northRoad, icon: "bus", items: [4, 5, 6], segmentIds: ["hobbiton-akc-coach"], stopTags: ["HBT", "AKC"] },
  ],
  "10月10日": [
    { title: "奥克兰轻松半日", time: "09:00—15:30", color: eventColors.auckland, icon: "city", items: [0, 1, 2], segmentIds: [], stopTags: ["AKC"] },
    { title: "前往奥克兰机场", time: "15:30—21:45", color: eventColors.northRoad, icon: "bus", items: [3, 4], segmentIds: ["akc-akl-transfer"], stopTags: ["AKC", "AKL"] },
    { title: "办理返程值机", time: "21:45—次日 00:30", timeEn: "21:45–00:30 next day",
      endDate: "2026-10-11", color: eventColors.internationalFlight, icon: "flight", items: [5],
      flights: internationalFlights.inbound, flightsAsDetailsOnly: true, flightSummary, segmentIds: [], stopTags: ["AKL"] },
  ],
  "10月11日": [
    { title: "返程回深圳", calendarLabel: "返程回深圳", calendarLabelEn: "Fly back to Shenzhen", isFlightTransfer: true, time: "00:30—次日 01:15", timeEn: "00:30—01:15 next day", color: eventColors.flightTransfer, icon: "flight", items: [0, 1, 2], flights: internationalFlights.inbound, flightSummary, segmentIds: ["akl-kul", "kul-szx"], stopTags: ["AKL", "KUL", "SZX"] },
  ],
  "10月12日": [
    { title: "抵达深圳", titleEn: "Arrive in Shenzhen", calendarLabel: "抵达深圳", calendarLabelEn: "Arrive in Shenzhen",
      time: "01:15—02:30", timeEn: "01:15–02:30", color: eventColors.internationalFlight, icon: "flight",
      primaryTimeZone: "Asia/Shanghai", comparisonTimeZone: "Pacific/Auckland",
      primaryTimeZoneLabel: "深圳", primaryTimeZoneLabelEn: "Shenzhen",
      comparisonTimeZoneLabel: "奥克兰", comparisonTimeZoneLabelEn: "Auckland",
      flightRef: "MH0522", isFlightTransfer: true, flights: [internationalFlights.inbound[1]],
      items: [0, 1], segmentIds: ["kul-szx"], stopTags: ["SZX"] },
    { title: "回家休息", titleEn: "Return home and rest", calendarLabel: "回家休息", calendarLabelEn: "Return home and rest",
      time: "02:30—12:00", timeEn: "02:30–12:00", color: eventColors.northRoad, icon: "car",
      primaryTimeZone: "Asia/Shanghai", comparisonTimeZone: "Pacific/Auckland",
      primaryTimeZoneLabel: "深圳", primaryTimeZoneLabelEn: "Shenzhen",
      comparisonTimeZoneLabel: "奥克兰", comparisonTimeZoneLabelEn: "Auckland",
      items: [2, 3], segmentIds: [], stopTags: ["SZX"] },
  ],
};

// Stays enrich the existing itinerary events after the local vault is unlocked.
// They never become standalone calendar events: each binding describes how a
// confirmed stay participates in the event's map, route and detail link.
const stayIntegrationByEvent = {
  "南岛取车入住": {
    mapPhases: ["check-in"],
    routeOrigin: "activity-origin",
    routeDestination: "check-in",
    linkPhase: "check-in",
    linkEventIndex: 7,
    omitStopTags: ["ZQN"],
    activityOrigin: {
      tag: "ZQN-BUDGET",
      name: "Budget 皇后镇机场取车点",
      nameEn: "Budget Queenstown Airport pickup",
      desc: "11:00 已预订取车",
      descEn: "Reserved pickup at 11:00",
      position: [-45.0211, 168.739],
      mapQuery: "Budget Car Rental Queenstown Airport",
    },
  },
  "皇后镇适应日": { mapPhases: ["overnight"] },
  "格林诺奇湖岸公路": { mapPhases: ["overnight"], routeOrigin: "overnight" },
  "Walter Peak 湖上巡游": { mapPhases: ["overnight"] },
  "箭镇与 Crown Range": { mapPhases: ["check-out", "check-in"], routeOrigin: "check-out", routeDestination: "check-in", linkPhase: "check-in", linkEventIndex: 4, omitStopTags: ["ZQN", "WKA"] },
  "抵达瓦纳卡": { mapPhases: ["check-in"], linkPhase: "check-in", linkEventIndex: 0, omitStopTags: ["WKA"] },
  "瓦纳卡湖边慢游": { mapPhases: ["overnight"], routeOrigin: "overnight" },
  "自驾前往库克山": { mapPhases: ["check-out", "check-in"], routeOrigin: "check-out", routeDestination: "check-in", omitStopTags: ["WKA", "AOR"] },
  "冰川直升机": {
    mapPhases: ["check-in"],
    routeOrigin: "check-in",
    routeDestination: "activity",
    omitStopTags: ["AOR"],
    activityDestination: {
      tag: "NZMC",
      name: "奥拉基库克山机场 · 直升机报到",
      nameEn: "Aoraki Mount Cook Airport · helicopter check-in",
      desc: "Glacier Highlights 从库克山机场基地出发",
      descEn: "Glacier Highlights departs from the Mount Cook Airport base",
      position: [-43.766736, 170.138033],
      mapQuery: "Aoraki Mount Cook Airport, Mount Cook Road, New Zealand",
      sourceUrl: "https://www.mtcookskiplanes.com/getting-here/",
      coordinateSourceUrl: "https://airport-data.com/world-airports/NZMC-MON/",
      reviewedAt: "2026-08-05",
    },
  },
  "库克山观星夜": { mapPhases: ["check-in"] },
  "库克山候补安排": { mapPhases: ["check-out"] },
  "蒂卡波到奥马鲁": { mapPhases: ["check-out", "check-in"], routeOrigin: "check-out", routeDestination: "check-in", linkPhase: "check-in", linkEventIndex: 3, omitStopTags: ["AOR", "OAM"] },
  "奥马鲁企鹅与海狗": { mapPhases: ["check-in"], routeOrigin: "check-in" },
  "奥马鲁前往基督城": { mapPhases: ["check-out", "check-in"], routeOrigin: "check-out", routeDestination: "check-in", linkPhase: "check-in", linkEventIndex: 3, omitStopTags: ["OAM", "CHC"] },
  "基督城补充半日": { mapPhases: ["check-in"] },
  "按更新订单还车": { mapPhases: ["check-out"], routeOrigin: "check-out", omitStopTags: ["CHC"] },
  "前往机场飞奥克兰": { mapPhases: ["check-out", "check-in"], linkPhase: "check-in", linkEventIndex: 2 },
  "大巴前往霍比屯": { mapPhases: ["overnight"], routeOrigin: "overnight" },
  "大巴返回奥克兰": { mapPhases: ["overnight"], routeDestination: "overnight" },
  "奥克兰轻松半日": { mapPhases: ["check-out"] },
  "前往奥克兰机场": { mapPhases: ["check-out"], routeOrigin: "check-out", omitStopTags: ["AKC"] },
};

export function getTripCalendarCells(days) {
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

function privateStayName(booking, privateStay, isEnglish) {
  const name = isEnglish
    ? (privateStay?.propertyNameEn ?? privateStay?.propertyName ?? privateStay?.住宿名称)
    : (privateStay?.propertyNameZh ?? privateStay?.住宿名称 ?? privateStay?.propertyName);
  if (typeof name === "string" && name.trim()) return name.trim();
  return isEnglish ? (booking.listingNameEn ?? booking.listingName) : booking.listingName;
}

export function coordinatePair(value) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) return null;
  return value;
}

function stayPhaseDescription(phase, isEnglish) {
  const labels = {
    "check-in": isEnglish ? "Confirmed stay for tonight" : "当晚已确认住宿",
    "check-out": isEnglish ? "Check-out stay" : "当日退房住宿",
    overnight: isEnglish ? "Current confirmed stay" : "当前已确认住宿",
  };
  return labels[phase];
}

function stayContextsForDay(day, { isPrivateUnlocked = false, language = "zh", privateVault } = {}) {
  if (!isPrivateUnlocked) return [];
  const isEnglish = language === "en";
  const date = eventDateId({ day });
  return confirmedStayTransitionsOn(date).map(({ booking, phase }) => {
    const privateStay = privateVault?.accommodations?.[booking.bookingId];
    const position = coordinatePair(privateStay?.coordinates) ?? coordinatePair(booking.mapPosition);
    const address = privateStay?.address ?? privateStay?.["准确地址"];
    const mapTarget = (typeof address === "string" && address.trim())
      ? address.trim()
      : (position ? position.join(",") : booking.mapQuery);
    const propertyName = privateStayName(booking, privateStay, isEnglish);
    return {
      booking,
      mapTarget,
      name: propertyName,
      phase,
      position,
      privateStay,
      stop: position ? {
        tag: `STAY-${booking.bookingId}`,
        name: propertyName,
        nameEn: privateStayName(booking, privateStay, true),
        desc: stayPhaseDescription(phase, false),
        descEn: stayPhaseDescription(phase, true),
        date: `${booking.checkIn}—${booking.checkOut}`,
        color: eventColors.confirmedStay,
        position,
      } : null,
    };
  });
}

export function getCalendarEvents(day, options) {
  const dayKey = day.dateKey ?? day.date;
  const stayContexts = stayContextsForDay(day, options);
  const groups = calendarEventGroupsByDate[dayKey] ?? [
    { title: day.subtitle || day.title, time: day.events[0]?.[0] || "全天", items: day.events.map((_, index) => index) },
  ];

  return groups.map((group) => {
    const stayIntegration = stayIntegrationByEvent[group.title];
    const attachedStays = stayIntegration
      ? stayContexts.filter((stay) => stayIntegration.mapPhases.includes(stay.phase))
      : [];
    const stayLinkContext = stayIntegration?.linkPhase
      ? attachedStays.find((stay) => stay.phase === stayIntegration.linkPhase)
      : null;
    return {
      color: eventColors.queenstown,
      icon: "calendar",
      ...group,
      calendarLabel: options?.language === "en"
        ? (group.calendarLabelEn ?? eventTitleEn[group.title] ?? group.calendarLabel ?? group.title)
        : (group.calendarLabel ?? group.title),
      day,
      events: group.events ?? group.items.map((index) => day.events[index]).filter(Boolean),
      media: eventMediaByTitle[group.title],
      stayContexts: attachedStays,
      stayIntegration,
      stayLink: stayLinkContext ? {
        eventIndex: stayIntegration.linkEventIndex,
        href: `?stay=${stayLinkContext.booking.bookingId}#booking`,
        label: options?.language === "en" ? "Open stay details" : "查看住宿详情",
      } : null,
    };
  });
}

export function eventHref(event) {
  return `?event=${encodeURIComponent(eventUrlId(event))}#overview`;
}

export function getAdventureCalendarDays(options = {}) {
  const scopedDays = options.scope === "south" ? southDays
    : options.scope === "north" ? northDays : itineraryDays;
  const days = options.language === "en"
    ? scopedDays.map((day) => englishDayByDate.get(day.dateKey ?? day.date) ?? day)
    : scopedDays;
  return days.map((day) => ({
    dateId: eventDateId({ day }),
    day,
    events: getCalendarEvents(day, options).map((event) => ({
      ...event,
      urlId: eventUrlId(event),
      href: eventHref(event),
    })),
  }));
}

export function getTripCalendarDay(dateId, options = {}) {
  return getAdventureCalendarDays(options).find((entry) => entry.dateId === dateId) ?? null;
}

export function eventDateId(event) {
  const date = event.day.dateKey ?? event.day.date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const match = date.match(/(\d+)月(\d+)日/);
  return match
    ? `${year}-${String(match[1]).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}`
    : date;
}

export function eventUrlId(event) {
  return `${eventDateId(event)}|${event.id ?? event.title}`;
}
