const osmSource = (id, query, note) => ({
  label: "OpenStreetMap / Nominatim", reviewedAt: "2026-10-01", note,
  sourceUrl: `https://www.openstreetmap.org/way/${id}`,
  queryUrl: `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, countrycodes: "nz", format: "jsonv2", limit: "3" })}`,
  license: "ODbL 1.0",
});

// Point semantics come from OSM, not from the driving service's snapped location.
export const adventureDayTripStops = [
  {
    id: "glenorchy-bobs-cove", routeId: "zqn-glenorchy", eventIndexes: [1], drivingStop: true,
    markerType: "nature", iconType: "scenic", name: "Bob's Cove", nameEn: "Bob's Cove",
    position: [-45.0699913, 168.5088895], specificity: "place", kind: "步道停车区",
    summary: "点位是 OSM 标记的 Bobs Cove 停车区，作为当天步道停留的公路到达参考；步行路线未绘制。",
    summaryEn: "The OSM Bobs Cove parking area is the road-access reference for this stop. The walking route is not drawn.",
    source: osmSource(1352489780, "Bobs Cove", "OSM amenity=parking 的中心点；不表示具体车位。"),
  },
  {
    id: "glenorchy-bennetts-bluff", routeId: "zqn-glenorchy", eventIndexes: [2], drivingStop: true,
    markerType: "nature", iconType: "scenic", name: "Bennett's Bluff", nameEn: "Bennett's Bluff",
    position: [-45.0288448, 168.4385695], specificity: "area", kind: "断崖与观景区域",
    summary: "点位表示 Bennetts Bluff 断崖区域，不是观景台或停车入口的精确坐标；公路线采用附近道路的吸附点。",
    summaryEn: "This marks the Bennetts Bluff cliff area, not an exact lookout or parking entrance. The road reference uses a nearby snapped road point.",
    source: osmSource(1138001808, "Bennetts Bluff", "OSM natural=cliff 的区域中心；现场停车仍以实际标识为准。"),
  },
  {
    id: "glenorchy-wharf", routeId: "zqn-glenorchy", eventIndexes: [], drivingStop: true,
    markerType: "activity", iconType: "scenic", name: "格林诺奇码头", nameEn: "Glenorchy Wharf",
    position: [-44.8515213, 168.381522], specificity: "place", kind: "码头",
    summary: "复用本事件已指定的 Glenorchy Wharf 目的地；驾车到达附近道路，不表示车辆能够开上码头，也不是午餐餐厅位置。",
    summaryEn: "Glenorchy Wharf is the event's existing destination. Driving ends on a nearby road, not on the pier, and this is not a lunch venue.",
    source: osmSource(1289096084, "Glenorchy Wharf", "OSM man_made=pier 的中心点；目的地语义来自主站事件地图。"),
  },
  {
    id: "glenorchy-lagoon", routeId: "zqn-glenorchy", eventIndexes: [4], drivingStop: false,
    markerType: "nature", iconType: "scenic", name: "Lagoon 木栈道", nameEn: "Glenorchy Lagoon Scenic Walkway",
    position: [-44.8486758, 168.3823911], specificity: "area", kind: "步道区域",
    summary: "点位表示 Glenorchy Lagoon Scenic Walkway 的一段步道，不是唯一入口。步道节点单独标记，不把步行部分画成驾车路线。",
    summaryEn: "This represents one section of the Glenorchy Lagoon Scenic Walkway, not a unique entrance. The walking stop is marked separately from the driving route.",
    source: osmSource(466622220, "Glenorchy Lagoon Walkway", "OSM highway=path 线段的代表点；不声称覆盖整条木栈道。"),
  },
];
