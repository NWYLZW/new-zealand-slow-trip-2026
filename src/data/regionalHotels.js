import { completeAccommodationEnglishFields } from "./accommodationEnglishFields.js";
import { applyAccommodationRatingOverrides } from "./accommodationRatingOverrides.js";
import { applyAccommodationGalleryEnhancements } from "./accommodationGalleryEnhancements.js";
import { archivedRotoruaHotels } from "./regional/archivedRotoruaHotels.js";
import { christchurchHotels } from "./regional/christchurchHotels.js";
import { mountCookHotels } from "./regional/mountCookHotels.js";
import { oamaruHotels } from "./regional/oamaruHotels.js";
import { queenstownHotels } from "./regional/queenstownHotels.js";
import { wanakaHotels } from "./regional/wanakaHotels.js";

export const regionalStays = {
  queenstown: {
    id: "queenstown",
    title: "皇后镇住宿比选",
    titleEn: "Queenstown stay comparison",
    mapLabel: "皇后镇住宿位置地图",
    mapLabelEn: "Queenstown stay locations",
    anchorPosition: [-45.0312, 168.6594],
    anchorLabel: "Steamer Wharf",
    anchorLabelEn: "Steamer Wharf",
    anchorIcon: "⚓",
    dates: {
      checkIn: "2026-09-29",
      checkOut: "2026-10-03",
      label: "9月29日—10月3日",
    },
    selectedHotelId: "holiday-inn-remarkables",
  },
  wanaka: {
    id: "wanaka",
    title: "瓦纳卡住宿比选",
    titleEn: "Wānaka stay comparison",
    mapLabel: "瓦纳卡住宿位置地图",
    mapLabelEn: "Wānaka stay locations",
    anchorPosition: [-44.698, 169.117],
    anchorLabel: "That Wānaka Tree",
    anchorLabelEn: "That Wānaka Tree",
    anchorIcon: "🌳",
    dates: {
      checkIn: "2026-10-03",
      checkOut: "2026-10-05",
      label: "10月3日—5日",
    },
    selectedHotelId: "wanaka-luxury-apartments",
  },
  "mount-cook": {
    id: "mount-cook",
    title: "库克山及周边住宿比选",
    titleEn: "Aoraki / Mount Cook and nearby stay comparison",
    mapLabel: "库克山及周边住宿位置地图",
    mapLabelEn: "Aoraki / Mount Cook and nearby stay locations",
    anchorPosition: [-43.765, 170.133],
    anchorLabel: "Mount Cook Airport",
    anchorLabelEn: "Mount Cook Airport",
    anchorIcon: "🚁",
    dates: {
      checkIn: "2026-10-05",
      checkOut: "2026-10-06",
      label: "10月5日—6日",
    },
    selectedHotelId: "hermitage-mt-cook-motel-studio-queen",
  },
  oamaru: {
    id: "oamaru",
    title: "奥马鲁多类型住宿比选",
    titleEn: "Ōamaru multi-type stay comparison",
    mapLabel: "奥马鲁住宿与企鹅保护区位置地图",
    mapLabelEn: "Ōamaru accommodation and penguin-colony locations",
    anchorPosition: [-45.1071, 170.9686],
    anchorLabel: "小蓝企鹅保护区",
    anchorLabelEn: "Blue Penguin Colony",
    anchorIcon: "🐧",
    dates: {
      checkIn: "2026-10-06",
      checkOut: "2026-10-07",
      label: "10月6日—7日",
    },
    selectedHotelId: "mariner-suites-oamaru",
  },
  christchurch: {
    id: "christchurch",
    title: "基督城市中心住宿比选",
    titleEn: "Central Christchurch stay comparison",
    mapLabel: "基督城住宿位置地图",
    mapLabelEn: "Christchurch stay locations",
    anchorPosition: [-43.532, 172.636],
    anchorLabel: "Riverside Market",
    anchorLabelEn: "Riverside Market",
    anchorIcon: "◎",
    dates: {
      checkIn: "2026-10-07",
      checkOut: "2026-10-08",
      label: "10月7日—8日",
    },
    selectedHotelId: "novotel-christchurch-cathedral-square",
  },
};

export const regionalHotels = {
  queenstown: queenstownHotels,
  wanaka: wanakaHotels,
  "mount-cook": mountCookHotels,
  oamaru: oamaruHotels,
  christchurch: christchurchHotels,
};

const existingMountCookIdsForEnglishBackfill = new Set([
  "hermitage-mt-cook-motel-studio-queen",
  "omahau-down",
  "simons-hill-dark-sky",
  "mount-cook-station-huts",
  "ben-ohau-vista",
  "airbnb-aoraki-aurora-holiday-home",
  "airbnb-pukaki-air-lodge",
  "airbnb-ben-ohau-rural-retreat",
  "airbnb-cosy-accommodation-twizel",
  "mountain-chalets-twizel",
]);

for (const [region, hotels] of Object.entries(regionalHotels)) {
  applyAccommodationGalleryEnhancements(hotels);
  applyAccommodationRatingOverrides(hotels);
  completeAccommodationEnglishFields(
    hotels,
    {
      includeIds: region === "mount-cook" ? existingMountCookIdsForEnglishBackfill : undefined,
      fillRates: region !== "christchurch",
    },
  );
}

export { archivedRotoruaHotels };
