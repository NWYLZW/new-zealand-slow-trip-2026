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
    checkIn: "2026-10-08",
    checkOut: "2026-10-10",
    label: "10月8日—10日",
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
      "10 月 8 日约 23:00 进城仍可由 24 小时前台办理入住；10 月 9 日约 06:30 离店前往 SkyCity 参加霍比屯往返大巴，返回后继续住同一酒店，10 月 10 日退房并前往机场。",
    summaryEn:
      "The 24-hour front desk supports an arrival around 23:00 on 8 Oct. The same hotel can be kept after leaving around 06:30 for the SkyCity Hobbiton coach on 9 Oct.",
    access: "距 Britomart 站约 650 米；位置评分 9.5，距机场约 18 公里",
    accessEn: "About 650 m from Britomart Station; location score 9.5",
    parking:
      "官网显示 NZD 50/晚、抵达视供应分配；本段入住期间不租车，因此不构成额外成本。",
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
      "无需为霍比屯往返大巴换酒店",
    ],
    cautions: [
      "距离 Newmarket 仍需乘公交或打车",
      "停车位有限且平台未显示具体收费",
      "一室公寓只能请求 King，平台明确写床型视供应；若要锁定大床应选尊贵一室 Queen",
      "10 月 8—10 日两晚精确库存、总价与退改待重新核验；旧 10 月 7—9 日两晚价格日期不同，不可用于当前行程",
    ],
    ratings: [
      { platform: "Booking.com", score: "8.7 / 10", reviews: "4,155 条" },
      { platform: "Agoda", score: "8.9 / 10", reviews: "4,831 条" },
    ],
    roomTypes: [
      {
        rateKey: "studio-king-25",
        name: "一室公寓 · King 请求项",
        size: "25 m²",
        bed: "1 张超大号双人床或 2 张单人床（选择床型，需视供应情况）",
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
              quotedAt: "2026-07-28",
            },
          },
          "premier-studio-queen-36": {
            official: {
              source: "Adina 官网",
              roomKey: "premier-studio-queen-36",
              room: "Premier Studio Room · Queen · 36 m²",
              nonRefundableNzd: null,
              refundableNzd: 313.88,
              cancelUntil: "2026-10-06",
              payment: "eClub 专享价；无需预付",
              breakfast: "含 2 人每日自助早餐、1 个停车位和 12:00 延迟退房",
              memberNote: "官网显示含税平均 NZD 156.94/晚；两晚合计 NZD 313.88",
              quotedAt: "2026-07-28",
            },
            booking: {
              source: "Booking.com",
              roomKey: "premier-studio-queen-36",
              room: "尊贵一室公寓 · 36 m²",
              nonRefundableNzd: 338,
              refundableNzd: 450,
              cancelUntil: "2026-10-06",
              payment: "免费取消档在 10 月 4 日前（不含当日）零付款",
              breakfast: "早餐另加 NZD 30/人",
              quotedAt: "2026-07-28",
            },
          },
        },
      },
    },
    availabilityNote:
      "当前住宿为 2026 年 10 月 8—10 日两晚；下方旧日期快照仅保留 10 月 7—9 日两晚的历史核验记录。虽然晚数相同，但具体日期不同，不能作为当前报价。",
    availabilityNoteEn:
      "The current stay is two nights, 8–10 Oct 2026. The saved 7–9 Oct two-night snapshot is historical only; the night count matches but the exact dates do not, so it is not a current quote.",
    officialStatus: null,
    officialStatusDetail:
      "Adina 官网与房型基础信息已核验；2026-07-28 的价格记录仅对应旧行程 10 月 7—9 日两晚。当前 10 月 8—10 日两晚、2 人 1 间的精确库存、含税总价、早餐、付款和退改尚待重新打开官网核验，日期不同的旧两晚价格不会作为当前报价。",
    officialStatusEn:
      "The Adina website and basic room information were checked, but the saved rate applies only to 7–9 Oct. Exact availability, tax-inclusive total, breakfast, payment and cancellation terms for the current two-night stay on 8–10 Oct require a fresh direct check; the old total is not a current quote because the dates differ.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://adinahotels.com/en/apartments/auckland-britomart/",
    officialBookingUrl:
      "https://reservations.adinahotels.com/?adult=2&arrive=2026-10-08&chain=14687&child=0&config=SBE&currency=NZD&depart=2026-10-10&hotel=66054&level=hotel&locale=en-US&productcurrency=NZD&room=SPR&rooms=1&theme=ADISBE",
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
      "位置评分 9.4，标准酒店服务比公寓更直接；当前 10 月 8—10 日两晚价格尚未核验，旧 10 月 7—9 日两晚快照仅用于了解历史房型与渠道情况。",
    summaryEn:
      "A conventional hotel with a 9.4 location score; the current 8–10 Oct two-night total still needs verification.",
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
        bed: "1 张 King 特大床（官网房型页明确标注）",
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
        bed: "1 张 King 特大床（官网房型页明确标注）",
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
    availabilityNote:
      "2026-07-28 的官网无房与 Booking.com 有房记录只对应旧行程 10 月 7—9 日两晚。当前改为 10 月 8—10 日两晚，晚数相同但日期不同，所有渠道库存与总价均待重新核验。",
    availabilityNoteEn:
      "The direct-unavailable and Booking.com-available records from 28 Jul apply only to 7–9 Oct. Inventory and totals for the current 8–10 Oct two-night stay must be checked again on every channel because the exact dates differ.",
    officialStatus: null,
    officialStatusDetail:
      "Hotel Grand Chancellor 官网与房型基础信息已核验；2026-07-28 的无房结果仅对应 10 月 7—9 日两晚。当前 10 月 8—10 日两晚、2 人 1 间的官网库存和精确总价待重新查询，不能沿用不同日期的旧结论。",
    officialStatusEn:
      "The Hotel Grand Chancellor website and room basics were checked, but the no-availability result from 28 Jul applies only to 7–9 Oct. Direct availability and the exact total for the current 8–10 Oct two-night stay, two adults and one room, require a fresh search.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://www.grandchancellorhotels.com/hotel-grand-chancellor-auckland",
    officialBookingUrl:
      "https://www.grandchancellorhotels.com/hotel-grand-chancellor-auckland/book/accommodations?Adults=2&Children=0&DateIn=10/08/26&DateOut=10/10/26&HotelId=98773&LanguageID=1&Rooms=1",
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
      "位置评分 9.5，官网与平台均有明确 King 房型；含早、取消和到店付款记录来自 10 月 7—9 日旧快照，当前 10 月 8—10 日两晚条款需重新核验。",
    summaryEn:
      "A 9.5 location score and clearly identified king categories; breakfast, cancellation and pay-at-property details come from the old 7–9 Oct snapshot and need rechecking for 8–10 Oct.",
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
    strengths: ["官网与平台均有明确 King 房型", "位置评分 9.5", "步行可达 Queen Street 与 Commercial Bay"],
    cautions: ["10 月 8—10 日精确总价待重新核验，日期不同的旧两晚报价不可比较", "最便宜大床房仅 20 m²"],
    strengthsEn: [
      "Clearly identified king categories on both direct and platform pages",
      "9.5 location score",
      "Walkable to Queen Street and Commercial Bay",
    ],
    cautionsEn: [
      "The exact 8–10 Oct total needs a fresh check; the old 7–9 Oct quote is not comparable",
      "The lowest-priced king room is only 20 m²",
    ],
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
    availabilityNote:
      "IHG 官网房型基础信息已核验；2026-07-28 的可订与价格记录只对应 10 月 7—9 日两晚。当前 10 月 8—10 日两晚的库存、含税总价与退改尚待重新查询，日期不同的旧两晚总价不用于当前比较。",
    availabilityNoteEn:
      "The IHG website and room basics were checked, but the availability and prices saved on 28 Jul apply only to 7–9 Oct. Inventory, tax-inclusive total and terms for the current 8–10 Oct stay need a fresh search; the old total is not used because the exact dates differ.",
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
            official: {
              source: "IHG 官网",
              roomKey: "standard-king",
              room: "1 King Standard With Free Breakfast · 20 m²",
              roomEn: "1 King Standard With Free Breakfast · 20 m²",
              nonRefundableNzd: null,
              refundableNzd: 428,
              cancelUntil: "2026-09-07",
              refundableRateLabel: "10月7日—9日含税费总价 · Advance Saver 可更改或取消至 2026-09-07",
              refundableRateLabelEn: "Tax-and-fee-inclusive total · Advance Saver changeable or cancellable through 7 Sep 2026",
              payment:
                "IHG One Rewards 会员 Advance Saver：平均每晚 NZD 214（原价 238），两晚含税费总价 NZD 428，无需预付、到店付款；Best Flexible 会员价平均每晚 NZD 279（原价 294），两晚含税费总价 NZD 558，10 月 6 日前可更改或取消，同样无需预付、到店付款",
              paymentEn:
                "IHG One Rewards member Advance Saver: average NZD 214 per night (was NZD 238), NZD 428 total for two nights including taxes and fees, changeable or cancellable through 7 Sep, with no prepayment and payment at the property. Best Flexible member rate: average NZD 279 per night (was NZD 294), NZD 558 total for two nights including taxes and fees, changeable or cancellable through 6 Oct, also with no prepayment and payment at the property.",
              breakfast: "含免费早餐",
              breakfastEn: "Free breakfast included",
              memberNote:
                "官网房型为 20 m²、高楼层城市景的 1 King Standard，因面积与床型一致，只映射到 standard-king；不与 Booking 的 28 m² city-view-super-king 合并",
              memberNoteEn:
                "The official category is a 20 m² high-floor city-view 1 King Standard. Its size and bed type support mapping only to standard-king; it is not merged with Booking.com's 28 m² city-view-super-king.",
              quotedAt: "2026-07-28",
            },
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
    officialStatus: null,
    officialStatusDetail:
      "IHG 官网与 1 King Standard With Free Breakfast 房型基础信息已核验；2026-07-28 的价格、早餐、付款与取消记录仅对应 10 月 7—9 日两晚。当前 10 月 8—10 日两晚、2 人 1 间的精确官网结果待重新核验。",
    officialStatusEn:
      "The IHG website and the 1 King Standard With Free Breakfast room basics were checked. Prices, breakfast, payment and cancellation details saved on 28 Jul apply only to 7–9 Oct. The exact direct result for the current 8–10 Oct two-night stay, two adults and one room, still needs verification.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://www.ihg.com/holidayinnexpress/hotels/us/en/auckland/aklcc/hoteldetail",
    officialBookingUrl:
      "https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?qDest=58%20Albert%20Street%2C%20Auckland%201010%2C%20New%20Zealand&qPt=CASH&qCiD=8&qCoD=10&qCiMy=092026&qCoMy=092026&qAdlt=2&qChld=0&qRms=1&qAAR=6CBARC&qSlH=AKLCC&qAkamaiCC=CN&srb_u=1&qExpndSrch=false&qFS=false&qSrt=sAV&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.kd.ma.sp.va.re.vx.nd.sx.we.lx.rn.sn.nu.ge.fa&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=true&qpMbw=0&qErm=false&qpMn=1&qpMbx=0&qLoSe=false&qDr=1&qSt=Holiday%20Inn%20Express%20Auckland%20City%20Centre&qRmFltr=",
    bookingUrl:
      "https://www.booking.com/hotel/nz/holiday-inn-express-auckland-city-centre-an-ihg.html",
    agodaUrl:
      "https://www.agoda.com/holiday-inn-express-auckland-city-centre/hotel/auckland-nz.html",
    position: [-36.8474, 174.7638],
    mapQuery: "Holiday Inn Express Auckland City Centre",
  },
];
