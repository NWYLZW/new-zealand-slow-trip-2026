export const image = (src, label, source = "Booking.com") => ({
  src: `/new-zealand-slow-trip-2026/images/hotels/${src}`,
  label,
  source,
});

const xiaohongshuSearch = (query) =>
  `https://www.xiaohongshu.com/search_result/?keyword=${encodeURIComponent(query)}&type=51`;

export const googleGuestRating = ({ score, reviews, placeId }) => [{
  platform: "Google Maps",
  platformEn: "Google Maps",
  score: `${score} / 5`,
  scoreEn: `${score} / 5`,
  reviews: `${reviews.toLocaleString("en-NZ")} 条 Google 评价`,
  reviewsEn: `${reviews.toLocaleString("en-NZ")} Google reviews`,
  sourceUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
  reviewedAt: "2026-07-31",
}];

export const sharedSocial = {
  queenstown: {
    verdict:
      "小红书反复推荐两条路线：一是 Highview / 镇中心湖景公寓，强调步行去湖边和码头；二是 Sunshine Bay、Lake Hayes 一带安静、带厨房或热水浴缸的民宿。Highview 已核验精确四晚没有连续库存，因此不伪装成可订卡片；当前补充了真实可订的镇中心 QT3 与 Lake Hayes 农场单间公寓。结合 Walter Peak、镇中心与 Queenstown Gardens 动线，能步行的市中心住宿优先，郊外民宿作为景观和价格备选。",
    verdictEn:
      "Xiaohongshu repeatedly suggests two Queenstown approaches: Highview or central lake-view apartments for walking to the lake and wharf, and quieter homes around Sunshine Bay or Lake Hayes with kitchens or hot tubs. Highview had no continuous inventory for the exact four nights and is therefore not presented as bookable. Verified central QT3 and a Lake Hayes farm studio are included instead. A walkable central stay best fits Walter Peak, the town centre and Queenstown Gardens; outlying homes remain scenery and price alternatives.",
    url: xiaohongshuSearch("皇后镇 住宿 推荐 酒店 民宿"),
  },
  wanaka: {
    verdict:
      "小红书常见推荐包括 Edgewater 湖畔草坪、湖边或镇中心带厨房公寓，以及离镇约 30 分钟、带热水池和星空体验的森林木屋。后者更适合把住宿本身当作行程；本次两晚仍要逛湖边、镇中心并次日去库克山，因此优先 Edgewater / 步行湖边的私人单间公寓，安静但需开车的 Alpine Lodge 作为性价比备选。Edgewater 当前可订基础 Hotel Room 不能保证特大床，也不能保证湖景，页面会明确提示。",
    verdictEn:
      "Common Xiaohongshu suggestions include Edgewater's lakefront lawn, apartments with kitchens near the lake or town centre, and forest cabins about 30 minutes away with hot tubs and stargazing. The cabins work best when the stay itself is the attraction. For these two nights, lakefront and town access plus the next drive to Mount Cook matter more, so walkable studios are prioritised and quieter drive-in options remain value alternatives. Edgewater's basic Hotel Room could not guarantee a king bed or lake view and has no continuous exact-date inventory, so it remains an unavailable reference rather than a selectable option.",
    url: xiaohongshuSearch("瓦纳卡 住宿 推荐 酒店 民宿"),
  },
  mountCook: {
    verdict:
      "小红书实住对比显示：The Hermitage 主楼卖点主要是窗景，Mt Cook Motel 则与主楼同属一套官方预订体系，房间更朴素但带完整厨房，部分住客反而认为性价比和无遮挡山景更好；具体景观仍取决于分房，不能保证。Google Maps 实测 Motel 到冬宫主楼约 1.0 公里、平路步行约 16 分钟，不是远在 Twizel 的另一家住宿，但早晚餐要到主楼会有一段户外步行。官方小红书提醒 Booking 无房不等于官网无房，并建议谨慎使用 Agoda；本次已在官网按 10 月 5—6 日、2 人核验到 Motel Studio Queen 仅剩 2 间。其余选择仍包括 Pukaki 东岸的 Braemar Station，以及 Twizel / Ben Ohau 的酒店和整租民宿。",
    verdictEn:
      "First-hand Xiaohongshu comparisons emphasise the Hermitage main building's window views, while Mt Cook Motel uses the same official booking system and offers simpler rooms with full kitchens; some guests prefer its value and open mountain outlook, although any particular view depends on room allocation. Google Maps places the motel about 1.0 km, or a level 16-minute walk, from the Hermitage rather than in Twizel, but meals at the main building require an outdoor walk. Official social guidance notes that Booking.com showing no rooms does not mean the direct site is sold out and advises care with Agoda. The direct site showed only two Motel Studio Queen units for 5–6 Oct and two guests when checked. Alternatives extend to the Lake Pukaki side and hotels or whole homes around Twizel and Ben Ohau.",
    url: xiaohongshuSearch("库克山 住宿 推荐 酒店 民宿"),
  },
  christchurch: {
    verdict:
      "社交媒体上常见市中心公寓、设计酒店和自驾 motel 三类选择；本次 10 月 7 日仅住一晚，10 月 8 日早餐后退房，需加满油并在 11:00 到基督城机场还车，再搭乘 13:50 的 JQ236，因此 Cathedral Square 周边酒店更利于前一天下午步行游览。旧报价只核验了 10 月 6—7 日，当前 10 月 7—8 日库存和总价需重新查询。",
    verdictEn:
      "Social research commonly suggests central apartments, design hotels and drive-in motels. This stay is only one night on 7 Oct; after breakfast on 8 Oct, refuel and return the car at Christchurch Airport at 11:00 before JQ236 departs at 13:50. Accommodation around Cathedral Square therefore works best for walking on the previous afternoon. Older quotes covered 6–7 Oct only, so inventory and totals for the current 7–8 Oct stay must be checked again.",
    url: xiaohongshuSearch("基督城 住宿 推荐 酒店 民宿"),
  },
  oamaru: {
    verdict:
      "这次没有只看传统酒店，而是同时比较了精品套房 / motel、整套公寓民宿、预算型自助客栈和传统酒店。企鹅晚场结束后的入住便利是第一优先：The Old Confectionery 的电子门码最省心，Mariner Suites 则在舒适度、免费停车、位置和价格之间更均衡，因此作为当前首选；Oamaru Backpackers 适合压预算，Brydone 是价格更低的传统酒店备选。四项均已按 10 月 6—7 日、2 人核验精确日期结果，但仍有不同程度的晚到、退改或扣款条款需付款前确认；全部都尚未预订。",
    verdictEn:
      "This comparison covers four accommodation types rather than conventional hotels alone: a boutique motel-style suite, a whole apartment, a budget self-check-in guesthouse and a traditional hotel. Late access after the penguin session matters most. The Old Confectionery has the easiest access-code arrival, while Mariner Suites offers the best balance of comfort, free parking, location and price and is therefore the preferred but unbooked option. Oamaru Backpackers is the budget choice and Brydone is the lower-cost traditional-hotel alternative. Exact-date results were checked for all four, with some late-arrival, cancellation or payment details still requiring confirmation before booking.",
    url: xiaohongshuSearch("奥马鲁 住宿 企鹅 推荐 酒店 民宿"),
  },
};

export const archivedRotoruaSocial = {
  verdict:
    "此结论仅保留为旧版罗托鲁瓦方案的历史调研，不属于当前奥克兰往返霍比屯行程。社交媒体更偏爱湖景、温泉与农场体验型民宿；旧版精确日期比较中，Sudima 免费停车且价格最低，Millennium 更靠近 Polynesian Spa，Pullman 房间更新但停车与早餐成本更高。",
  url: xiaohongshuSearch("罗托鲁瓦 住宿 推荐 酒店 民宿"),
};
