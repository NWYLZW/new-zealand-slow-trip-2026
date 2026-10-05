// Public pin snapshots only: importing the owning JSX would load Leaflet into
// this pure model. The coverage audit compares every coordinate with its owner.
export const nearbyPublicPins = [
  ["international-terminal", "奥克兰国际航站楼", "Auckland International Terminal", [-37.0040146, 174.7856948]],
  ["steamer-wharf", "Steamer Wharf · Walter Peak 码头", "Steamer Wharf · Walter Peak pier", [-45.0332545, 168.6577993]],
  ["queenstown-gardens", "Queenstown Gardens", "Queenstown Gardens", [-45.0363315, 168.6617071]],
  ["skyline", "Skyline Queenstown", "Skyline Queenstown", [-45.0279742, 168.646883]],
  ["wanaka-tree", "That Wānaka Tree", "That Wānaka Tree", [-44.6985, 169.1175]],
  ["puzzling-world", "Puzzling World", "Puzzling World", [-44.696992, 169.161698]],
  ["wanaka-lakefront", "瓦纳卡湖滨", "Wānaka lakefront", [-44.695, 169.1368]],
  ["britomart", "Britomart 交通中心", "Britomart Transport Centre", [-36.8445568, 174.7691726]],
  ["queen-street", "Queen Street", "Queen Street", [-36.8504453, 174.7639477]],
].map(([id, name, nameEn, position]) => ({ id: `pin:${id}`, name, nameEn, position,
  specificity: "place", source: { repositorySource: "src/components/HotelComparisonDialog.jsx",
    exportName: "attractionPinsByRegion", label: name } }));

// Canonical indexes, not translated labels or the first (sometimes broad) map link.
export const nearbyPlaceBindings = {
  "2026-09-28": { 0: ["airport:SZX"], 1: ["airport:SZX"], 6: ["airport:SZX"] },
  "2026-09-29": { 0: ["waypoint:akl-domestic-terminal"], 1: ["waypoint:akl-domestic-terminal"],
    3: ["waypoint:queenstown-airport"], 4: ["waypoint:queenstown-airport"],
    11: ["waypoint:akl-domestic-terminal"], 12: ["pin:international-terminal"] },
  "2026-09-30": { 0: ["pin:queenstown-gardens"], 2: ["pin:skyline"] },
  "2026-10-01": { 0: ["place:ZQN", "waypoint:glenorchy-bobs-cove"],
    3: ["waypoint:glenorchy-wharf"], 5: ["waypoint:glenorchy-wharf", "place:ZQN"] },
  "2026-10-02": { 0: ["place:ZQN"], 1: ["pin:queenstown-gardens", "place:ZQN"],
    2: ["pin:steamer-wharf"], 3: ["pin:steamer-wharf", "place:WTP"],
    4: ["place:ZQN"], 5: ["place:ZQN"] },
  "2026-10-03": { 0: ["place:ZQN", "waypoint:arrowtown"],
    2: ["waypoint:arrowtown", "waypoint:crown-range-area"], 5: ["place:WKA"] },
  "2026-10-04": { 0: ["pin:puzzling-world"], 1: ["place:WKA"],
    2: ["place:WKA", "place:HWA"], 3: ["place:HWA"], 4: ["place:HWA", "place:WKA"],
    5: ["place:WKA"], 6: ["place:WKA"], 7: ["pin:wanaka-tree", "pin:wanaka-lakefront"] },
  "2026-10-05": {
    0: ["place:WKA", "waypoint:lindis-pass-area"],
    6: ["place:AOR"], 7: ["place:AOR"], 8: ["place:AOR"], 13: ["place:AOR"],
    10: ["waypoint:lindis-pass-area", "waypoint:omarama-town"],
    11: ["waypoint:omarama-town", "waypoint:lake-pukaki-south"],
    12: ["waypoint:lake-pukaki-south", "waypoint:mount-cook-airport"],
  },
  "2026-10-06": {
    0: ["place:AOR"], 1: ["place:AOR"], 10: ["place:AOR"],
    2: ["place:AOR", "place:TEK"], 3: ["place:TEK", "waypoint:omarama-town"],
    4: ["place:OAM"], 5: ["place:OAM"], 6: ["place:OAM"],
    9: ["waypoint:oamaru-blue-penguin-colony", "place:OAM"],
    11: ["place:TEK"], 12: ["place:TEK"], 13: ["waypoint:omarama-town"],
    14: ["waypoint:omarama-town", "place:OAM"], 15: ["place:OAM"],
    16: ["place:OAM", "waypoint:oamaru-blue-penguin-colony"], 17: ["place:OAM"],
  },
  "2026-10-07": { 0: ["place:OAM", "waypoint:timaru-town"] },
  "2026-10-08": { 0: ["place:CHC"], 1: ["place:CHC", "waypoint:christchurch-airport"],
    5: ["airport:AKL", "place:AKC"] },
  "2026-10-09": { 0: ["place:AKC"], 1: ["place:AKC", "place:HBT"],
    4: ["place:HBT", "place:AKC"], 5: ["place:AKC"], 6: ["place:AKC"] },
  "2026-10-10": { 1: ["pin:queen-street", "pin:britomart"], 3: ["place:AKC", "pin:international-terminal"],
    4: ["pin:international-terminal"], 5: ["pin:international-terminal"] },
  "2026-10-11": { 0: ["pin:international-terminal"] },
  "2026-10-12": { 1: ["airport:SZX"], 2: ["airport:SZX"], 3: [] },
};

// A parking area, lunch landmark, town, walking district, or tour meeting point
// does not establish the activity's position. Only explicit stationary sites
// can support the deliberately tentative near-place signal.
const activitySites = {
  "2026-10-04": { 0: ["pin:puzzling-world"] },
  "2026-09-29": { 1: ["waypoint:akl-domestic-terminal"], 3: ["waypoint:queenstown-airport"],
    11: ["waypoint:akl-domestic-terminal"] },
  "2026-10-05": { 4: ["waypoint:mount-cook-airport"] },
  "2026-10-06": { 7: ["waypoint:oamaru-blue-penguin-colony"], 8: ["waypoint:oamaru-blue-penguin-colony"] },
  "2026-10-08": { 3: ["waypoint:christchurch-airport"] },
  "2026-10-10": { 4: ["pin:international-terminal"], 5: ["pin:international-terminal"] },
  "2026-10-11": { 0: ["pin:international-terminal"] },
};

export function nearbyPlaceEvidence(place, dateId, sourceIndex, moving) {
  const site = !moving && (place.target === "stay" || activitySites[dateId]?.[sourceIndex]?.includes(place.id));
  return { ...place, evidenceRole: site ? "activity-site" : moving ? "route-reference" : "area-reference",
    specificity: !site && place.specificity === "place" ? "area" : place.specificity };
}

export function nearbyMovement(title, flight = false, summary = "") {
  const text = `${title} ${summary}`;
  const stationary = /^(返城后自由休息|直升机报到、天气确认与候飞|机场休息候机|候机并准备登机)$/.test(summary);
  if (stationary && !flight) return { transit: false, moving: false };
  const transit = /驶向|驾车|自驾|开车|开往|继续上路|继续北上|继续前往|大巴前往|大巴返回|进城|自由驾驶|前往蒂卡波|返回皇后镇(?!后)|前往已确认住宿|从深圳机场返家|前往奥克兰机场(?!国内)|前往机场、|前往库克山机场/.test(text);
  const moving = flight || transit || /前往深圳机场|步行到|前往 Skyline|前往国内航站楼|并前往市中心|活动后返回|返回原酒店|前往企鹅保护区|巡游/.test(text)
    || /直升机/.test(text) && !/报到|候飞/.test(text);
  return { transit, moving };
}
