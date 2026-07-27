export const aucklandCityStay = {
  id: "auckland-city",
  title: "奥克兰市中心住宿比选",
  titleEn: "Central Auckland stay comparison",
  mapLabel: "奥克兰市中心住宿位置地图",
  mapLabelEn: "Central Auckland stay locations",
  anchorPosition: [-36.8443, 174.768],
  anchorLabel: "Britomart",
  anchorLabelEn: "Britomart",
  dates: {
    checkIn: "2026-10-07",
    checkOut: "2026-10-09",
    label: "10月7日—9日",
  },
  selectedHotelId: "adina-auckland-britomart",
};

export const aucklandCityHotels = [
  {
    id: "adina-auckland-britomart",
    name: "Adina Apartment Hotel Auckland Britomart",
    recommendation: "行程最匹配",
    recommendationEn: "Best itinerary fit",
    summary:
      "22:30 左右进城仍可由 24 小时前台办理入住；第二天从 Britomart 步行去 Commercial Bay 与 Queen Street，第三天退房后去机场取车，三段动线最顺。",
    summaryEn:
      "A 24-hour front desk supports the late arrival, while Britomart, Commercial Bay and Queen Street are walkable the next day.",
    access: "距 Britomart 站约 650 米；位置评分 9.5，距机场约 18 公里",
    accessEn: "About 650 m from Britomart Station; location score 9.5",
    parking:
      "设院内私人停车位，但数量有限、需视供应情况；本段入住期间不租车，因此不构成额外成本。",
    parkingEn:
      "Limited on-site private parking; no car is needed during this stay.",
    nearbyAttractions: [
      {
        name: "Britomart 交通中心",
        distance: "约 650 米",
        travelTime: "步行约 8—10 分钟",
        destinationQuery: "Britomart Transport Centre",
      },
      {
        name: "Commercial Bay",
        distance: "约 900 米",
        travelTime: "步行约 12 分钟",
        destinationQuery: "Commercial Bay Auckland",
      },
      {
        name: "Queen Street",
        distance: "约 1 公里",
        travelTime: "步行约 12—15 分钟",
        destinationQuery: "Queen Street Auckland",
      },
      {
        name: "Newmarket",
        distance: "约 3.5 公里",
        travelTime: "公交或打车约 12—20 分钟",
        destinationQuery: "Newmarket Auckland",
      },
    ],
    strengths: [
      "24 小时前台适合晚到",
      "购物日步行动线最佳",
      "25 m² 且有小厨房",
      "两晚含税总价明显较低",
    ],
    cautions: [
      "距离 Newmarket 仍需乘公交或打车",
      "停车位有限且平台未显示具体收费",
      "最便宜档不可退款",
    ],
    ratings: [
      { platform: "Booking.com", score: "8.7 / 10", reviews: "4,155 条" },
      { platform: "Agoda", score: "8.9 / 10", reviews: "4,831 条" },
    ],
    roomTypes: [
      {
        rateKey: "studio-king-25",
        name: "一室公寓 · 超大床",
        size: "25 m²",
        bed: "1 张超大号双人床（需在平台选床）",
        photosVerified: true,
        facilities: [
          "私人小厨房",
          "私人浴室",
          "空调",
          "隔音",
          "平板电视",
          "免费 Wi-Fi",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-1.jpg",
            label: "一室公寓大床与书桌",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-2.jpg",
            label: "一室公寓特大床",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-3.jpg",
            label: "一室公寓浴室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-4.jpg",
            label: "一室公寓房型图",
            source: "Booking.com",
          },
        ],
      },
      {
        rateKey: "premier-studio-queen-36",
        name: "尊贵一室公寓",
        size: "36 m²",
        bed: "1 张大号双人床",
        facilities: [
          "私人厨房",
          "私人浴室",
          "空调",
          "洗碗机",
          "隔音",
          "免费 Wi-Fi",
        ],
        images: [],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-hotel-1.jpg",
        label: "酒店外观",
        source: "Booking.com",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-hotel-2.jpg",
        label: "酒店前台",
        source: "Booking.com",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-hotel-3.jpg",
        label: "酒店另一侧外观",
        source: "Booking.com",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-hotel-4.jpg",
        label: "早餐与餐饮区",
        source: "Booking.com",
      },
    ],
    rateSnapshots: {
      "2026-10-07/2026-10-09": {
        roomRates: {
          "studio-king-25": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "studio-king-25",
              room: "一室公寓 · 超大床选项 · 25 m²",
              nonRefundableNzd: 299,
              refundableNzd: 398,
              cancelUntil: "2026-10-06",
              payment: "免费取消档在 10 月 4 日前（不含当日）零付款",
              breakfast: "早餐另加 NZD 30/人",
              quotedAt: "2026-07-27",
            },
          },
          "premier-studio-queen-36": {
            booking: {
              source: "Booking.com",
              roomKey: "premier-studio-queen-36",
              room: "尊贵一室公寓 · 36 m²",
              nonRefundableNzd: 338,
              refundableNzd: 450,
              cancelUntil: "2026-10-06",
              payment: "免费取消档在 10 月 4 日前（不含当日）零付款",
              breakfast: "早餐另加 NZD 30/人",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    officialUrl:
      "https://www.adinahotels.com/en/apartments/auckland/britomart/",
    bookingUrl:
      "https://www.booking.com/hotel/nz/adina-apartment-auckland-britomart.html",
    agodaUrl:
      "https://www.agoda.com/adina-apartment-hotel-auckland-britomart/hotel/auckland-nz.html",
    position: [-36.8462, 174.7761],
    mapQuery: "Adina Apartment Hotel Auckland Britomart",
  },
  {
    id: "grand-chancellor-auckland",
    name: "Hotel Grand Chancellor Auckland",
    recommendation: "酒店型性价比",
    recommendationEn: "Hotel value",
    summary:
      "位置评分 9.4，标准酒店服务比公寓更直接；高级大床房两晚含税价格接近 Adina 的可取消档。",
    summaryEn:
      "A conventional hotel with a 9.4 location score and a competitive king-room total.",
    access:
      "CBD 步行范围；前往 Queen Street、Commercial Bay 和 Britomart 均方便",
    accessEn: "Walkable to Queen Street, Commercial Bay and Britomart",
    parking: "市中心停车通常收费；预订前向酒店确认当日住客停车价格。",
    parkingEn: "Central-city parking is usually paid; confirm the guest rate.",
    nearbyAttractions: [
      {
        name: "Commercial Bay",
        distance: "约 450 米",
        travelTime: "步行约 6 分钟",
        destinationQuery: "Commercial Bay Auckland",
      },
      {
        name: "Queen Street",
        distance: "约 350 米",
        travelTime: "步行约 5 分钟",
        destinationQuery: "Queen Street Auckland",
      },
      {
        name: "Britomart 交通中心",
        distance: "约 700 米",
        travelTime: "步行约 9 分钟",
        destinationQuery: "Britomart Transport Centre",
      },
      {
        name: "Newmarket",
        distance: "约 4 公里",
        travelTime: "公交或打车约 15—20 分钟",
        destinationQuery: "Newmarket Auckland",
      },
    ],
    strengths: ["明确提供高级大床房", "位置评分 9.4", "标准酒店服务"],
    cautions: ["停车费用待平台详情确认", "22 m²，空间小于 Adina 尊贵一室公寓"],
    ratings: [
      { platform: "Booking.com", score: "8.9 / 10", reviews: "3,232 条" },
    ],
    roomTypes: [
      {
        rateKey: "superior-king",
        name: "高级特大号床间",
        size: "22 m²",
        bed: "1 张大号双人床",
        facilities: [
          "高层",
          "城市景",
          "庭院景",
          "私人浴室",
          "空调",
          "免费 Wi-Fi",
        ],
        images: [],
      },
      {
        rateKey: "deluxe-harbour-king",
        name: "Deluxe King Harbour View",
        size: "22 m²",
        bed: "1 张大号双人床",
        facilities: [
          "高层",
          "海景",
          "私人浴室",
          "空调",
          "咖啡机",
          "免费 Wi-Fi",
        ],
        images: [],
      },
    ],
    hotelImages: [],
    rateSnapshots: {
      "2026-10-07/2026-10-09": {
        roomRates: {
          "superior-king": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "superior-king",
              room: "高级特大号床间 · 22 m²",
              nonRefundableNzd: 398,
              refundableNzd: 410,
              cancelUntil: "2026-10-06",
              payment: "可取消档无需预付、到店付款",
              breakfast: "早餐另加 NZD 39.50/人",
              quotedAt: "2026-07-27",
            },
          },
          "deluxe-harbour-king": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "deluxe-harbour-king",
              room: "Deluxe King Harbour View · 22 m²",
              nonRefundableNzd: 440,
              refundableNzd: 454,
              cancelUntil: "2026-10-06",
              payment: "可取消档无需预付、到店付款",
              breakfast: "早餐另加 NZD 39.50/人",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    officialUrl:
      "https://www.grandchancellorhotels.com/hotel-grand-chancellor-auckland",
    bookingUrl:
      "https://www.booking.com/hotel/nz/grand-chancellor-auckland.html",
    agodaUrl:
      "https://www.agoda.com/hotel-grand-chancellor-auckland/hotel/auckland-nz.html",
    position: [-36.8467, 174.7598],
    mapQuery: "Hotel Grand Chancellor Auckland",
  },
  {
    id: "holiday-inn-express-auckland-city",
    name: "Holiday Inn Express Auckland City Centre",
    recommendation: "含早可取消",
    recommendationEn: "Breakfast and flexibility",
    summary:
      "市景超大床房含早餐、可免费取消且到店付款；位置评分 9.5，适合希望条款更稳、早上不用找早餐的人。",
    summaryEn:
      "A city-view king room with breakfast, free cancellation and pay-at-property terms.",
    access: "Queen Street 与 Commercial Bay 步行范围；位置评分 9.5",
    accessEn: "Walkable to Queen Street and Commercial Bay; location score 9.5",
    parking: "市中心付费停车；本段无租车需求。",
    parkingEn:
      "Paid central-city parking; no rental car is needed during this stay.",
    nearbyAttractions: [
      {
        name: "Queen Street",
        distance: "约 100 米",
        travelTime: "步行约 1—2 分钟",
        destinationQuery: "Queen Street Auckland",
      },
      {
        name: "Commercial Bay",
        distance: "约 350 米",
        travelTime: "步行约 5 分钟",
        destinationQuery: "Commercial Bay Auckland",
      },
      {
        name: "Britomart 交通中心",
        distance: "约 600 米",
        travelTime: "步行约 8 分钟",
        destinationQuery: "Britomart Transport Centre",
      },
      {
        name: "Newmarket",
        distance: "约 3.5 公里",
        travelTime: "公交或打车约 12—20 分钟",
        destinationQuery: "Newmarket Auckland",
      },
    ],
    strengths: ["房价包含早餐", "明确免费取消", "无需预付、到店付款", "超大床"],
    cautions: ["两晚总价高于 Adina", "最便宜大床房仅 20 m²"],
    ratings: [
      { platform: "Booking.com", score: "8.7 / 10", reviews: "3,788 条" },
    ],
    roomTypes: [
      {
        rateKey: "city-view-super-king",
        name: "市景超级特大号床间 · 含免费早餐",
        size: "28 m²",
        bed: "1 张超大号双人床",
        facilities: ["城市景", "含早餐", "私人浴室", "空调", "免费 Wi-Fi"],
        images: [],
      },
      {
        rateKey: "standard-queen",
        name: "标准大号床间 · 含免费早餐",
        size: "20 m²",
        bed: "1 张大号双人床",
        facilities: ["城市景", "含早餐", "私人浴室", "空调", "免费 Wi-Fi"],
        images: [],
      },
      {
        rateKey: "standard-king",
        name: "标准特大号床间 · 含免费早餐",
        size: "20 m²",
        bed: "1 张超大号双人床",
        facilities: ["城市景", "含早餐", "私人浴室", "空调", "免费 Wi-Fi"],
        images: [],
      },
    ],
    hotelImages: [],
    rateSnapshots: {
      "2026-10-07/2026-10-09": {
        roomRates: {
          "city-view-super-king": {
            booking: {
              source: "Booking.com",
              roomKey: "city-view-super-king",
              room: "市景超级特大号床间 · 28 m²",
              nonRefundableNzd: null,
              refundableNzd: 556,
              cancelUntil: "2026-09-07",
              payment: "无需预付、到店付款；当前剩 2 间",
              breakfast: "已含早餐；另有 10 月 6 日前取消档 NZD 668",
              quotedAt: "2026-07-27",
            },
          },
          "standard-queen": {
            booking: {
              source: "Booking.com",
              roomKey: "standard-queen",
              room: "标准大号床间 · 20 m²",
              nonRefundableNzd: null,
              refundableNzd: 558,
              cancelUntil: "2026-10-06",
              payment: "无需预付、到店付款",
              breakfast: "已含早餐",
              quotedAt: "2026-07-27",
            },
          },
          "standard-king": {
            booking: {
              source: "Booking.com",
              roomKey: "standard-king",
              room: "标准特大号床间 · 20 m²",
              nonRefundableNzd: null,
              refundableNzd: 588,
              cancelUntil: "2026-10-06",
              payment: "无需预付、到店付款",
              breakfast: "已含早餐",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    officialUrl:
      "https://www.ihg.com/holidayinnexpress/hotels/us/en/auckland/aklct/hoteldetail",
    bookingUrl:
      "https://www.booking.com/hotel/nz/holiday-inn-express-auckland-city-centre-an-ihg.html",
    agodaUrl:
      "https://www.agoda.com/holiday-inn-express-auckland-city-centre/hotel/auckland-nz.html",
    position: [-36.8474, 174.7638],
    mapQuery: "Holiday Inn Express Auckland City Centre",
  },
];
