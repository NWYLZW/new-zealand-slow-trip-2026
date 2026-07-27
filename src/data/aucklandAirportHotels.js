export const AUCKLAND_AIRPORT_SELECTION_KEY = "nz-trip-hotel-selections";

export const aucklandAirportOvernightGuides = [
  {
    title: "奥克兰国际机场过夜攻略",
    author: "吃遍新加坡的汤姆A梦",
    url: "https://www.xiaohongshu.com/explore/679644c2000000001701c538",
    note: "国际楼能找到休息位置，但夏天夜里也冷；国际、国内航站楼距离需要预留步行时间。",
  },
  {
    title: "奥克兰机场买手机卡+携带药品+过夜攻略(二)",
    author: "在新西兰读博的小C",
    url: "https://www.xiaohongshu.com/explore/67cfbc080000000009014ef8",
    note: "国际楼 24 小时开放，二楼木椅可充电；国内楼午夜关闭，国内楼二楼有淋浴。作者 43 小时旅程只睡约 3 小时。",
  },
  {
    title: "奥克兰机场过夜指南～国际入境转国内",
    author: "嘚嘚班",
    url: "https://www.xiaohongshu.com/explore/66fb00e3000000002c0176b2",
    note: "国际楼二楼有躺椅和电源；凌晨沿绿色地标步行约 15 分钟到国内楼，淋浴需自备洗漱用品。",
  },
  {
    title: "奥克兰机场睡机场攻略",
    author: "V理想V自由",
    url: "https://www.xiaohongshu.com/explore/674f8505000000000202b9f2",
    note: "国际楼夜间人不少，二楼椅子可充电；摆渡车过早过晚可能没有，步行按绿色箭头约 10 分钟。",
  },
  {
    title: "奥克兰机场过夜",
    author: "gg",
    url: "https://www.xiaohongshu.com/explore/65c473830000000007028bf8",
    note: "座椅没有扶手，可以横躺；国内楼 3 号门附近上楼可洗热水澡。",
  },
];

export const aucklandAirportHotels = [
  {
    id: "novotel-auckland-airport",
    name: "Novotel Auckland Airport",
    recommendation: "最省心",
    recommendationEn: "Easiest arrival",
    summary: "国际航站楼正对面，深夜抵达后步行入住，不用等接驳车。三晚拆住仍最省精力。",
    summaryEn: "Directly opposite the international terminal, making it the lowest-friction choice after a late arrival.",
    access: "国际航站楼外步行即到",
    accessEn: "Walk from the international terminal",
    parking: "使用机场付费停车；下单前核对当日停车价",
    parkingEn: "Paid airport parking; re-check the current rate",
    strengths: ["深夜抵达最方便", "24 小时前台", "减少接驳不确定性"],
    cautions: ["通常不是最低价", "停车需另付费"],
    ratings: [
      { platform: "Booking.com", score: "8.8 / 10", reviews: "10,804 条" },
      { platform: "Agoda", score: "9.0 / 10", reviews: "13,013 条" },
    ],
    roomTypes: [
      {
        rateKey: "superior-king-26",
        name: "高级特大号床间",
        size: "26 m²",
        bed: "1 张超大双人床",
        facilities: ["浴缸", "空调", "私人浴室", "隔音", "平板电视", "免费 Wi-Fi"],
        images: [
          { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-1.jpg", label: "特大号床间卧室", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-2.jpg", label: "特大号床间浴室", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-3.jpg", label: "特大号床间床尾视角", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-4.jpg", label: "特大号床间休息区", source: "Booking.com" },
        ],
      },
    ],
    hotelImages: [
      { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-agoda-exterior.jpg", label: "酒店外观", source: "Agoda" },
      { src: "/new-zealand-slow-trip-2026/images/hotels/novotel-agoda-reception.jpg", label: "酒店前台", source: "Agoda" },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        source: "Booking.com",
        roomKey: "superior-king-26",
        room: "高级特大号床间 · 26 m²",
        nonRefundableNzd: 335,
        refundableNzd: 419,
        cancelUntil: "2026-09-27",
        payment: "可免费取消价在 9 月 25 日前无需付款",
        breakfast: "早餐另加 NZD 35/人",
        quotedAt: "2026-07-26",
        agoda: {
          roomKey: "superior-king-26",
          room: "无障碍高级特大床房",
          nonRefundableNzd: 292,
          refundableNzd: 382,
          cancelUntil: "2026-09-27",
          payment: "9 月 25 日前无需付款",
          breakfast: "早餐另加 NZD 32/人",
          quotedAt: "2026-07-26",
        },
      },
      "2026-10-07/2026-10-09": {
        source: "Booking.com",
        roomKey: "superior-king-26",
        room: "高级特大号床间 · 26 m² · 2 晚总价",
        nonRefundableNzd: 816,
        refundableNzd: 858,
        cancelUntil: "2026-10-06",
        payment: "可免费取消价在 10 月 4 日前无需付款",
        breakfast: "早餐另加 NZD 35/人",
        quotedAt: "2026-07-26",
        agoda: {
          roomKey: "superior-king-26",
          room: "无障碍高级特大床房 · 26 m² · 2 晚总价",
          nonRefundableNzd: 712,
          refundableNzd: 786,
          cancelUntil: "2026-10-06",
          payment: "10 月 4 日前无需付款",
          breakfast: "早餐另加 NZD 32/人",
          quotedAt: "2026-07-26",
        },
      },
    },
    officialUrl: "https://all.accor.com/hotel/7485/index.en.shtml",
    bookingUrl: "https://www.booking.com/hotel/nz/novotel-auckland-airport.html",
    agodaUrl: "https://www.agoda.com/en-sg/novotel-auckland-airport-hotel/hotel/auckland-nz.html",
    position: [-37.0075, 174.7839],
    mapQuery: "Novotel Auckland Airport",
  },
  {
    id: "pullman-auckland-airport",
    name: "Pullman Auckland Airport",
    recommendation: "舒适升级",
    recommendationEn: "Premium upgrade",
    summary: "国际航站楼旁的一分钟步行五星级选择，房间与餐饮体验更好，适合愿意为舒适度加预算。",
    summaryEn: "A premium five-star stay about a minute from the international terminal.",
    access: "国际航站楼旁约 1 分钟步行",
    accessEn: "About a one-minute terminal walk",
    parking: "官网 FAQ：代客泊车 NZD 69/天，预订前复核",
    parkingEn: "Official FAQ: valet parking NZD 69/day; re-check before booking",
    strengths: ["步行入住", "四家中舒适度最高", "新酒店设施"],
    cautions: ["通常价格最高", "代客泊车成本高"],
    ratings: [
      { platform: "Booking.com", score: "9.1 / 10", reviews: "5,425 条" },
      { platform: "Agoda", score: "9.0 / 10", reviews: "258 条" },
      { platform: "Trip.com", score: "9.2 / 10", reviews: "516 条" },
    ],
    roomTypes: [
      {
        rateKey: "superior-king-30",
        name: "高级特大号床间",
        size: "30 m²",
        bed: "1 张超大号双人床",
        facilities: ["空调", "私人浴室", "步入式淋浴", "隔音", "平板电视", "咖啡机"],
        images: [
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-1.jpg", label: "高级特大号床间卧室", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-2.jpg", label: "高级特大号床间休息区", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-3.jpg", label: "高级特大号床间床铺", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-4.jpg", label: "高级特大号床间浴室", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-5.jpg", label: "高级特大号床间窗边", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-6.jpg", label: "高级特大号床间细节", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-7.jpg", label: "高级特大号床间全景", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-8.jpg", label: "高级特大号床间淋浴区", source: "Booking.com" },
        ],
      },
    ],
    hotelImages: [
      { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-1.jpg", label: "酒店外观", source: "Booking.com" },
      { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-2.jpg", label: "酒店大堂", source: "Booking.com" },
      { src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-3.jpg", label: "酒店公共区域", source: "Booking.com" },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        source: "Booking.com",
        roomKey: "superior-king-30",
        room: "高级特大床房 · 30 m²",
        nonRefundableNzd: 351,
        refundableNzd: 439,
        cancelUntil: "2026-09-27",
        payment: "免费取消价无需预付，到店付款",
        breakfast: "早餐另加 NZD 45/人",
        quotedAt: "2026-07-26",
        agoda: {
          roomKey: "superior-king-30",
          room: "Superior Room with 1 King Bed · 30 m²",
          nonRefundableNzd: 306,
          refundableNzd: 400,
          cancelUntil: null,
          payment: "Agoda 显示提供免费取消；精确截止时间需在结算页确认",
          breakfast: "早餐另加 NZD 45/人",
          quotedAt: "2026-07-26",
        },
      },
      "2026-10-07/2026-10-09": {
        source: "Booking.com",
        roomKey: "superior-king-30",
        room: "高级特大床房 · 30 m² · 2 晚总价",
        nonRefundableNzd: 758,
        refundableNzd: 898,
        cancelUntil: "2026-10-06",
        payment: "免费取消价无需预付，到店付款",
        breakfast: "早餐另加 NZD 45/人",
        quotedAt: "2026-07-26",
        agoda: {
          roomKey: "superior-king-30",
          room: "Superior Room with 1 King Bed · 30 m² · 2 晚总价",
          nonRefundableNzd: 694,
          refundableNzd: 824,
          cancelUntil: null,
          payment: "Agoda 显示提供免费取消；精确截止时间需在结算页确认",
          breakfast: "早餐另加 NZD 45/人",
          quotedAt: "2026-07-26",
        },
      },
    },
    officialUrl: "https://www.pullmanaucklandairport.com/",
    bookingUrl: "https://www.booking.com/hotel/nz/pullman-auckland-airport.html",
    agodaUrl: "https://www.agoda.com/pullman-auckland-airport-opening-december-2023/hotel/auckland-nz.html",
    position: [-37.0067, 174.7825],
    mapQuery: "Pullman Auckland Airport",
  },
  {
    id: "jetpark-auckland-airport",
    name: "JetPark Hotel Auckland Airport",
    recommendation: "性价比",
    recommendationEn: "Best value",
    summary: "不能从航站楼步行，但提供 24 小时免费机场接驳；能接受等车时，是评分与成本更均衡的选择。",
    summaryEn: "A strong-value option with a complimentary 24-hour airport shuttle instead of a terminal walk.",
    access: "24 小时免费机场接驳车",
    accessEn: "Complimentary 24-hour airport shuttle",
    parking: "Agoda 标注免费停车；Booking 房型说明称过夜停车需预约且可能收费，下单前向酒店确认",
    parkingEn: "Agoda lists free parking; Booking notes that overnight parking may require advance booking and a fee, so confirm with the hotel.",
    strengths: ["免费接驳", "住客评分稳定", "通常比航站楼酒店便宜"],
    cautions: ["深夜仍需等接驳", "往返时间不如步行可控"],
    ratings: [
      { platform: "Booking.com", score: "8.7 / 10", reviews: "6,935 条" },
      { platform: "Agoda", score: "8.8 / 10", reviews: "9,080 条" },
      { platform: "Expedia", score: "9.2 / 10", reviews: "1,697 条" },
    ],
    roomTypes: [
      {
        rateKey: "superior-king-23",
        name: "高级特大号床间",
        size: "23 m²",
        bed: "1 张超大号双人床",
        facilities: ["空调", "私人浴室", "步入式淋浴", "隔音", "平板电视", "免费 Wi-Fi"],
        images: [
          { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-1.jpg", label: "高级特大号床间卧室", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-2.jpg", label: "高级特大号床间床铺", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-3.jpg", label: "高级特大号床间休息区", source: "Booking.com" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-4.jpg", label: "高级特大号床间浴室", source: "Booking.com" },
        ],
      },
    ],
    hotelImages: [
      { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-exterior.webp", label: "酒店外观", source: "Agoda" },
      { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-restaurant.webp", label: "酒店餐厅", source: "Agoda" },
      { src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-pool.webp", label: "室外泳池", source: "Agoda" },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        source: "Booking.com · Genius 1",
        roomKey: "superior-king-23",
        room: "高级特大号床间 · 23 m²",
        nonRefundableNzd: 197,
        refundableNzd: 211,
        cancelUntil: "2026-09-27",
        payment: "免费取消价无需预付，到店付款",
        breakfast: "早餐另加 NZD 34/人",
        quotedAt: "2026-07-27",
        agoda: {
          roomKey: "superior-king-23",
          room: "Superior King · 23 m²",
          nonRefundableNzd: 157,
          refundableNzd: 168,
          cancelUntil: null,
          payment: "Agoda 显示提供免费取消；精确截止时间需在结算页确认",
          breakfast: "早餐另加 NZD 34/人",
          quotedAt: "2026-07-27",
        },
      },
      "2026-10-07/2026-10-09": {
        source: "Booking.com · Genius 1",
        roomKey: "superior-king-23",
        room: "高级特大号床间 · 23 m² · 2 晚总价",
        nonRefundableNzd: 385,
        refundableNzd: 449,
        cancelUntil: "2026-10-06",
        payment: "免费取消价无需预付，到店付款",
        breakfast: "早餐另加 NZD 34/人",
        quotedAt: "2026-07-27",
        agoda: {
          roomKey: "superior-king-23",
          room: "Superior King · 23 m² · 2 晚总价",
          nonRefundableNzd: 338,
          refundableNzd: 360,
          cancelUntil: null,
          payment: "Agoda 显示提供免费取消；精确截止时间需在结算页确认",
          breakfast: "早餐另加 NZD 34/人",
          quotedAt: "2026-07-27",
        },
      },
    },
    officialUrl: "https://www.jetparkauckland.co.nz/",
    bookingUrl: "https://www.booking.com/hotel/nz/jet-park-airport-conference-centre.html",
    agodaUrl: "https://www.agoda.com/en-sg/jet-park-airport-hotel/hotel/auckland-nz.html",
    position: [-36.9985, 174.8037],
    mapQuery: "JetPark Hotel Auckland Airport",
  },
  {
    id: "ibis-budget-auckland-airport",
    name: "ibis budget Auckland Airport",
    recommendation: "预算优先",
    recommendationEn: "Budget choice",
    summary: "距离航站楼约 800 米，房间配置基础但动线明确，适合只睡一晚且愿意精简住宿体验。",
    summaryEn: "A basic, walkable option roughly 800 metres from the terminal for budget-focused stays.",
    access: "约 800 米，可步行或乘机场巴士",
    accessEn: "About 800 m; walk or use the airport bus",
    parking: "Accor 官网：入住当晚免费停车；机场接驳另收费",
    parkingEn: "Accor: complimentary parking for the night of the stay; airport shuttle costs extra.",
    strengths: ["四家中预算门槛最低", "不依赖酒店接驳", "附近有餐饮超市"],
    cautions: ["房间较小且配置基础", "雨天拖行李步行不轻松"],
    ratings: [
      { platform: "Google", score: "3.9 / 5", reviews: "3,036 条" },
      { platform: "Agoda", score: "8.3 / 10", reviews: "3,595 条" },
    ],
    roomTypes: [
      {
        rateKey: "budget-queen-12",
        name: "Budget Room with 1 Queen Bed",
        size: "12 m²",
        bed: "1 张大号双人床",
        facilities: ["空调", "私人浴室", "步入式淋浴", "遮光帘", "平板电视", "免费 Wi-Fi"],
        images: [
          { src: "/new-zealand-slow-trip-2026/images/hotels/ibis-accor-budget-queen-room-1.jpg", label: "Budget Queen 客房", source: "Accor 官网" },
          { src: "/new-zealand-slow-trip-2026/images/hotels/ibis-room-3.jpg", label: "Budget Queen 客房全景", source: "Accor 官网" },
        ],
      },
    ],
    hotelImages: [],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        source: "Accor 官网会员价",
        roomKey: "budget-queen-12",
        room: "Budget Room with 1 Queen Bed · 12 m²",
        nonRefundableNzd: 151.24,
        refundableNzd: null,
        cancelUntil: "2026-09-27 23:59",
        payment: "官网另有可免费取消的 Flexible 房价，最终 NZD 总额需进入结算页确认",
        breakfast: null,
        quotedAt: "2026-07-26",
        useOfficialUrl: true,
        originalCurrency: "EUR",
        originalAmount: 76.72,
        rateLabel: "官网会员起价，取消条款需结算页确认",
        conversionNote: "NZD 与人民币为按 Accor 同日显示汇率换算",
      },
      "2026-10-07/2026-10-09": {
        source: "Accor 官网公开价",
        roomKey: "budget-queen-12",
        room: "Budget Room with 1 Queen Bed · 12 m² · 2 晚总价",
        nonRefundableNzd: 416.17,
        refundableNzd: null,
        cancelUntil: null,
        payment: "官网当前只展示起价；具体付款与取消条件需进入结算页复核",
        breakfast: null,
        quotedAt: "2026-07-27",
        useOfficialUrl: true,
        originalCurrency: "EUR",
        originalAmount: 211.07,
        rateLabel: "官网公开起价，取消条款需结算页确认",
        conversionNote: "NZD 与人民币为按 Accor 同日显示汇率换算",
      },
    },
    officialUrl: "https://all.accor.com/hotel/7865/index.en.shtml",
    officialHotelCode: "7865",
    bookingUrl: "https://www.booking.com/hotel/nz/ibis-budget-auckland-airport.html",
    agodaUrl: "https://www.agoda.com/ibis-budget-auckland-airport/hotel/auckland-nz.html",
    position: [-37.0049, 174.7898],
    mapQuery: "ibis budget Auckland Airport",
  },
  {
    id: "airbnb-auckland-airport-area",
    name: "Airbnb · Auckland Airport 周边",
    recommendation: "民宿备选",
    recommendationEn: "Airbnb alternative",
    summary: "适合更看重厨房、洗衣与独立停车位的人；但这次是深夜抵达的一晚和返程前两晚，计入清洁费后不一定比机场酒店划算。",
    summaryEn: "More space, a kitchen and parking can help, but cleaning fees often weaken the value for these one- and two-night airport stays.",
    access: "房源分散；优先筛机场 10 分钟车程内、自助入住",
    accessEn: "Scattered listings; filter for self check-in within a 10-minute drive",
    parking: "只选明确写有免费专属车位的房源，并向房东确认晚到",
    parkingEn: "Choose a listing with a confirmed dedicated parking space and late-arrival instructions",
    strengths: ["可有厨房和洗衣机", "空间通常更大", "部分房源含免费停车"],
    cautions: ["短住清洁费占比高", "深夜入住依赖房东说明", "具体地址和品质逐套不同"],
    ratings: [
      { platform: "Airbnb", score: "逐套核验", reviews: "不使用跨房源平均分" },
    ],
    priceReference: "比较时看含清洁费、服务费和税费的最终总价，并只保留可免费取消、近期评价稳定的整套房。",
    officialUrl: "https://www.airbnb.com/s/Auckland-Airport--New-Zealand/homes",
    isAirbnb: true,
    position: [-37.0082, 174.785],
    mapQuery: "Auckland Airport New Zealand",
  },
];

export const aucklandAirportStayDates = ["2026-09-28", "2026-10-07", "2026-10-08"];

export function bookingUrlForStay(hotel, checkIn, checkOut) {
  const url = new URL(hotel.bookingUrl);
  url.searchParams.set("checkin", checkIn);
  url.searchParams.set("checkout", checkOut);
  url.searchParams.set("group_adults", "2");
  url.searchParams.set("no_rooms", "1");
  return url.toString();
}

export function officialUrlForStay(hotel, checkIn, checkOut) {
  if (!hotel.officialHotelCode) return hotel.officialUrl;
  const url = new URL(`https://all.accor.com/booking/en/accor/hotel/${hotel.officialHotelCode}`);
  url.searchParams.set("compositions", "2");
  url.searchParams.set("dateIn", checkIn);
  url.searchParams.set("dateOut", checkOut);
  url.searchParams.set("nights", String(Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))));
  url.searchParams.set("hideWDR", "false");
  url.searchParams.set("accessibleRoom", "false");
  return url.toString();
}

export function airbnbUrlForStay(checkIn, checkOut) {
  const url = new URL("https://www.airbnb.com/s/Auckland-Airport--New-Zealand/homes");
  url.searchParams.set("refinement_paths[]", "/homes");
  url.searchParams.set("date_picker_type", "calendar");
  url.searchParams.set("checkin", checkIn);
  url.searchParams.set("checkout", checkOut);
  url.searchParams.set("adults", "2");
  url.searchParams.set("room_types[]", "Entire home/apt");
  return url.toString();
}

export function agodaUrlForStay(hotel, checkIn, checkOut) {
  if (!hotel.agodaUrl) return null;
  const url = new URL(hotel.agodaUrl);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("rooms", "1");
  url.searchParams.set("adults", "2");
  url.searchParams.set("children", "0");
  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
  url.searchParams.set("los", String(nights));
  return url.toString();
}
