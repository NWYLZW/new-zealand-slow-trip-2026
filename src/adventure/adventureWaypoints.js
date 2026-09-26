import { adventureStops } from "./adventureData";

const stopByTag = new Map(adventureStops.map((stop) => [stop.tag, stop]));

const routeControlSource = (routeId, note) => ({
  label: "现有行程路线控制点",
  reviewedAt: "2026-09-26",
  note,
  routeId,
  repositorySource: "src/data/mapRoutes.js",
});

const existingPinSource = (note, repositorySource) => ({
  label: "主站既有景点坐标",
  reviewedAt: "2026-09-26",
  note,
  repositorySource,
});

const routeSnapshotSource = (routeId, note) => ({
  label: "本地 OpenStreetMap / OSRM 路网快照",
  reviewedAt: "2026-09-26",
  note,
  routeId,
  repositorySource: "src/adventure/data/road-routes.json",
  sourceUrl: "https://www.openstreetmap.org/copyright",
});

const waypointRecords = [
  {
    id: "akl-domestic-terminal", routeId: "akl-zqn", eventIndexes: [0, 1, 2],
    markerType: "transport", iconType: "flight",
    name: "奥克兰国内航站楼", nameEn: "Auckland Domestic Terminal",
    position: [-37.0062161, 174.7920758], specificity: "place", kind: "交通节点",
    summary: "当天从国内航站楼办理值机并搭乘 JQ295。该点是机场航站楼，不是途中景点。",
    source: existingPinSource("复用主站机场景点点位。", "src/components/HotelComparisonDialog.jsx"),
  },
  {
    id: "queenstown-airport", routeId: "akl-zqn", eventIndexes: [3, 4],
    markerType: "transport", iconType: "flight",
    name: "皇后镇机场", nameEn: "Queenstown Airport",
    position: [-45.0211, 168.739], specificity: "place", kind: "交通节点",
    summary: "JQ295 抵达与 Budget 取车都发生在皇后镇机场；不表示具体柜台位置。",
    source: existingPinSource("复用行程地图的皇后镇机场坐标。", "src/data/mapRoutes.js"),
  },
  {
    id: "arrowtown", routeId: "zqn-wanaka", eventIndexes: [1],
    markerType: "town", iconType: "meal",
    name: "箭镇", nameEn: "Arrowtown",
    position: [-44.9382, 168.8357], specificity: "town", kind: "城镇",
    summary: "标记为箭镇城镇级停留点；当天午餐的具体餐厅尚未确定。",
    source: routeControlSource("zqn-wanaka", "路线控制点经 OSRM 吸附到 Arrowtown 的 Bedford Street，非餐厅坐标。"),
  },
  {
    id: "crown-range-area", routeId: "zqn-wanaka", eventIndexes: [3],
    markerType: "nature", iconType: "scenic",
    name: "Crown Range", nameEn: "Crown Range",
    position: [-44.9444224, 168.9200715], specificity: "area", kind: "山脉与公路区域",
    summary: "LINZ 地形图点位表示 Crown Range 区域；当天观景停车点仍以道路标识和实际安全条件为准。",
    source: {
      label: "LINZ 地形图 / NZ Topo Map",
      reviewedAt: "2026-09-26",
      note: "WGS84 区域坐标；本地 OSRM 快照另确认路线经过 Crown Range Road。",
      sourceUrl: "https://www.topomap.co.nz/NZTopoMap/nz19790/CROWN-RANGE/",
      repositorySource: "src/adventure/data/road-routes.json",
    },
  },
  {
    id: "cardrona-town", routeId: "zqn-wanaka", eventIndexes: [4],
    markerType: "town", iconType: "meal",
    name: "Cardrona", nameEn: "Cardrona",
    position: [-44.88009, 169.00465], specificity: "town", kind: "地方聚落",
    summary: "标记为 Cardrona locality；当天咖啡店尚未确定，不把镇级点位当作商家坐标。",
    source: {
      label: "LINZ 地名记录与 QLDC 地图",
      reviewedAt: "2026-09-26",
      note: "LINZ 将 Cardrona 记录为 locality；QLDC 地图确认 Cardrona township 范围。",
      sourceUrl: "https://gazetteer.linz.govt.nz/place/44423",
      coordinateSourceUrl: "https://www.openstreetmap.org/node/1682185770",
      officialContextUrl: "https://www.qldc.govt.nz/do-it-online/maps-spatial-data",
    },
  },
  {
    id: "lindis-pass-area", routeId: "wanaka-aoraki", eventIndexes: [1],
    markerType: "nature", iconType: "scenic",
    name: "Lindis Pass 观景区", nameEn: "Lindis Pass scenic area",
    position: [-44.5914, 169.6418], specificity: "area", kind: "山口与观景区",
    summary: "LINZ 地形图点位表示 Lindis Pass 山口区域；圆点不代表具体停车位，现场观景入口仍以道路标识为准。",
    source: {
      label: "LINZ 地形图 / NZ Topo Map",
      reviewedAt: "2026-09-26",
      note: "WGS84 山口坐标；本地 OSRM 路网快照另确认路线经过 Lindis Pass Tarras Road / SH 8。",
      sourceUrl: "https://www.topomap.co.nz/NZTopoMap/7770/Lindis-Pass/Otago",
      repositorySource: "src/adventure/data/road-routes.json",
    },
  },
  {
    id: "omarama-town", routeId: "wanaka-aoraki", eventIndexes: [2],
    markerType: "town", iconType: "meal",
    name: "Omarama", nameEn: "Omarama",
    position: [-44.259, 170.0973], specificity: "town", kind: "城镇",
    summary: "标记为 Omarama 城镇级停留点；午餐与加油的具体商家尚未确定。",
    source: routeControlSource("wanaka-aoraki", "路线控制点与本地路网中的 Omarama 道路名称相互印证。"),
  },
  {
    id: "lake-pukaki-south", routeId: "wanaka-aoraki", eventIndexes: [3],
    markerType: "nature", iconType: "scenic",
    name: "Lake Pukaki 南岸", nameEn: "Lake Pukaki south shore",
    position: [-44.153, 170.181], specificity: "area", kind: "湖岸区域",
    summary: "当天只写了 Lake Pukaki 短停，圆点表示现有路线中的南岸参考区域，不冒充已确定的观景台。",
    source: routeControlSource("wanaka-aoraki", "沿用原路线控制点；具体停车点仍待出发前确认。"),
  },
  {
    id: "mount-cook-airport", routeId: "wanaka-aoraki", eventIndexes: [4, 5],
    markerType: "activity", iconType: "helicopter",
    name: "Aoraki Mount Cook Airport", nameEn: "Aoraki Mount Cook Airport",
    position: [-43.766736, 170.138033], specificity: "place", kind: "活动报到地点",
    summary: "Glacier Highlights 从库克山机场基地办理报到；具体起飞与天气安排以运营方当天通知为准。",
    source: {
      label: "主站活动地图点位与运营方到达说明",
      reviewedAt: "2026-08-05",
      note: "复用日历事件的活动目的地坐标与来源记录。",
      sourceUrl: "https://www.mtcookskiplanes.com/getting-here/",
      coordinateSourceUrl: "https://airport-data.com/world-airports/NZMC-MON/",
      repositorySource: "src/components/calendar/tripCalendarData.js",
    },
  },
  {
    id: "hermitage-big-sky", routeId: "wanaka-aoraki", eventIndexes: [6, 7, 8],
    markerType: "activity", iconType: "stars",
    name: "The Hermitage / Big Sky", nameEn: "The Hermitage / Big Sky",
    position: [-43.7331633, 170.0937221], specificity: "place", kind: "活动与服务区域",
    summary: "圆点复用 The Hermitage 既有点位，用于表示 Big Sky 活动集合区域；用餐与休息的具体场所仍以当天安排为准。",
    source: existingPinSource("复用主站 The Hermitage 景点点位与 Big Sky 官方活动链接。", "src/components/HotelComparisonDialog.jsx"),
  },
  {
    id: "tekapo-stop", routeId: "aoraki-oamaru", eventIndexes: [2, 3],
    markerType: "nature", iconType: "meal",
    name: "特卡波湖 · Tekapo", nameEn: "Lake Tekapo",
    position: stopByTag.get("TEK").position, specificity: "town", kind: "城镇与湖岸",
    summary: "复用地图既有 Tekapo 站点；教堂、湖边和午餐属于同一短停，但餐厅未指定。",
    source: routeSnapshotSource("aoraki-oamaru", "路线输入明确经过 Tekapo，并复用 Adventure 地图 TEK 站点。"), reuseStopTag: "TEK",
  },
  {
    id: "oamaru-blue-penguin-colony", routeId: "aoraki-oamaru", eventIndexes: [7, 8],
    markerType: "activity", iconType: "scenic",
    name: "Ōamaru Blue Penguin Colony", nameEn: "Oamaru Blue Penguin Colony",
    position: [-45.110276, 170.9801779], specificity: "place", kind: "活动地点",
    summary: "19:30 提前抵达，20:00 观看小蓝企鹅归巢；现场禁止拍照、录像及亮屏。",
    source: existingPinSource("复用主站奥马鲁景点点位与当天活动资料。", "src/components/HotelComparisonDialog.jsx"),
  },
  {
    id: "timaru-town", routeId: "oamaru-christchurch", eventIndexes: [1],
    markerType: "town", iconType: "meal",
    name: "Timaru", nameEn: "Timaru",
    position: [-44.39672, 171.25364], specificity: "town", kind: "城市",
    summary: "标记为 Timaru 城区级短休点；海边与咖啡仍是二选一，未指定 Caroline Bay 入口或咖啡店。",
    source: {
      label: "Timaru District Council / Canterbury Maps 与公开坐标地图",
      reviewedAt: "2026-09-26",
      note: "Council GIS 确认 Timaru 城区范围；坐标仅作为城区中心级参考。",
      sourceUrl: "https://www.timaru.govt.nz/maps",
      coordinateSourceUrl: "https://www.geodatos.net/en/coordinates/new-zealand/timaru",
    },
  },
  {
    id: "ashburton-town", routeId: "oamaru-christchurch", eventIndexes: [2],
    markerType: "town", iconType: "meal",
    name: "Ashburton", nameEn: "Ashburton",
    position: [-43.908, 171.751], specificity: "town", kind: "城镇",
    summary: "标记为路线穿过 Ashburton 的城镇级参考点；午餐地点未确定，不指向任何餐厅。",
    source: routeSnapshotSource("oamaru-christchurch", "本地路网验收点位于 SH 1 / Ashburton River Bridge 走廊。"),
  },
  {
    id: "christchurch-centre", routeId: "oamaru-christchurch", eventIndexes: [3],
    markerType: "town", iconType: "city",
    name: "基督城市中心", nameEn: "Christchurch city centre",
    position: stopByTag.get("CHC").position, specificity: "city", kind: "城市区域",
    summary: "路线终点采用主站既有基督城市中心坐标；停车与入住的具体位置以住宿资料为准。",
    source: routeSnapshotSource("oamaru-christchurch", "复用道路快照终点与 Adventure 地图 CHC 站点。"), reuseStopTag: "CHC",
  },
  {
    id: "riverside-avon", routeId: "oamaru-christchurch", eventIndexes: [4],
    markerType: "activity", iconType: "city",
    name: "Riverside Market 与雅芳河畔", nameEn: "Riverside Market and Avon River",
    position: [-43.5339149, 172.6340017], specificity: "place", kind: "步行区域",
    summary: "圆点使用 Riverside Market 的既有精确点位；雅芳河畔是一段步行区域，不另造单一点位。",
    source: existingPinSource("复用主站 Christchurch 景点点位。", "src/components/HotelComparisonDialog.jsx"),
  },
  {
    id: "cathedral-new-regent", routeId: "oamaru-christchurch", eventIndexes: [5],
    markerType: "activity", iconType: "city",
    name: "Cathedral Square 与 New Regent Street", nameEn: "Cathedral Square and New Regent Street",
    position: [-43.5293064, 172.638704], specificity: "place", kind: "步行区域",
    summary: "圆点使用 New Regent Street 的既有精确点位；Cathedral Square 属同一市中心步行段，不伪造第二个精确点。",
    source: existingPinSource("复用主站 Christchurch 景点点位。", "src/components/HotelComparisonDialog.jsx"),
  },
  {
    id: "christchurch-airport", routeId: "chc-akl", eventIndexes: [2, 3, 4],
    markerType: "transport", iconType: "flight",
    name: "基督城机场", nameEn: "Christchurch Airport",
    position: [-43.4894, 172.5322], specificity: "place", kind: "交通节点",
    summary: "当天还车、值机和 JQ236 起飞均在基督城机场；不表示具体柜台或登机口。",
    source: existingPinSource("复用行程地图的基督城机场坐标。", "src/data/mapRoutes.js"),
  },
  {
    id: "auckland-arrival", routeId: "chc-akl", eventIndexes: [5],
    markerType: "transport", iconType: "flight",
    name: "奥克兰机场", nameEn: "Auckland Airport",
    position: [-37.0082, 174.785], specificity: "place", kind: "交通节点",
    summary: "JQ236 抵达点；随后前往市中心，具体接驳方式尚未写入当天安排。",
    source: existingPinSource("复用行程地图的奥克兰机场坐标。", "src/data/mapRoutes.js"),
  },
  {
    id: "hobbiton-shires-rest", routeId: "akc-hobbiton-coach", eventIndexes: [2, 3, 4],
    markerType: "activity", iconType: "movie",
    name: "The Shire’s Rest", nameEn: "The Shire's Rest",
    position: stopByTag.get("HBT").position, specificity: "place", kind: "集合与游览地点",
    summary: "复用地图已有霍比屯站点；大巴公路线只是汽车路网参考，并非运营商轨迹。",
    source: routeSnapshotSource("akc-hobbiton-coach", "复用 Adventure 地图 HBT 站点；道路快照终点吸附到 Bagshot Row 一带。"), reuseStopTag: "HBT",
  },
];

export const adventureWaypoints = waypointRecords.map((waypoint) => ({
  ...waypoint,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${waypoint.position[0]},${waypoint.position[1]}`)}`,
}));

const unresolvedByRoute = {
  "akl-zqn": [
    { eventIndex: 5, label: "皇后镇活动与入住", reason: "当天安排未指定市区活动地点，住宿位置属于私密资料。" },
  ],
  "zqn-wanaka": [],
  "aoraki-oamaru": [
    { eventIndex: 5, label: "奥马鲁港边步道", reason: "当天安排只描述港边步道范围，没有唯一入口或观察点。" },
    { eventIndex: 6, label: "奥马鲁晚餐", reason: "餐厅未确定。" },
  ],
  "oamaru-christchurch": [
    { eventIndex: 6, label: "基督城市区晚餐", reason: "餐厅未确定。" },
  ],
  "chc-akl": [
    { eventIndex: 1, label: "途中加满油", reason: "加油站未确定；不把机场坐标冒充沿途加油点。" },
  ],
  "akc-hobbiton-coach": [
    { eventIndex: 0, label: "SkyCity Coach Terminal", reason: "已有文字地址查询，但当前仓库没有独立、可追溯的精确坐标。" },
    { eventIndex: 5, label: "返回 SkyCity Coach Terminal", reason: "与出发点相同，但当前仓库没有独立、可追溯的精确坐标。" },
    { eventIndex: 6, label: "奥克兰市中心酒店送回点", reason: "送回酒店取决于最终住宿与运营安排。" },
  ],
};

const byId = new Map(adventureWaypoints.map((waypoint) => [waypoint.id, waypoint]));

export function getAdventureWaypoint(id) {
  return byId.get(id) ?? null;
}

export function getRouteWaypoints(routeId) {
  return adventureWaypoints.filter((waypoint) => waypoint.routeId === routeId);
}

export function getAgendaWaypoint(routeId, eventIndex) {
  return adventureWaypoints.find((waypoint) => waypoint.routeId === routeId && waypoint.eventIndexes.includes(eventIndex)) ?? null;
}

export function getRouteWaypointCoverage(routeId) {
  return {
    mapped: getRouteWaypoints(routeId),
    unresolved: unresolvedByRoute[routeId] ?? [],
  };
}
