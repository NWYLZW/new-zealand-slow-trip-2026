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
    checkOut: "2026-10-09",
    label: "10月8日—9日",
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
      "10月8日22:30 左右进城仍可由 24 小时前台办理入住；第二天退房后从市区前往北岛联程接驳集合点，动线较顺。",
    summaryEn:
      "A 24-hour front desk supports the late arrival, with convenient access to central transfer meeting points the next morning.",
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
      "次日去市区接驳集合点方便",
      "25 m² 且有小厨房",
      "原两晚报价有价格优势",
    ],
    cautions: [
      "行程已改为10月8日单晚，旧报价不能继续使用，必须重新核价",
      "距离 Newmarket 仍需乘公交或打车",
      "停车位有限且平台未显示具体收费",
      "一室公寓只能请求 King，平台明确写床型视供应；若要锁定大床应选尊贵一室 Queen",
      "最便宜档不可退款",
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
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-07-28 已在 Adina 官网实际操作日期控件，带入 10 月 7—9 日、2 人 1 间；Premier Studio Room 明确为 Queen，eClub 冬季套餐含税两晚 NZD 313.88，含双早、1 个停车位、12:00 延迟退房，10 月 6 日前免费取消且无需预付。",
    officialStatusEn:
      "Verified direct for 7–9 Oct 2026, two adults and one room. The Premier Studio has a queen bed; the eClub winter package totals NZD 313.88 tax-inclusive with breakfast for two, one parking space, noon checkout and free cancellation until 6 Oct.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://adinahotels.com/en/apartments/auckland-britomart/",
    officialBookingUrl:
      "https://reservations.adinahotels.com/?adult=2&arrive=2026-10-08&chain=14687&child=0&config=SBE&currency=NZD&depart=2026-10-09&hotel=66054&level=hotel&locale=en-US&productcurrency=NZD&room=SPR&rooms=1&theme=ADISBE",
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
      "位置评分 9.4，标准酒店服务比公寓更直接；高级大床房两晚价格接近 Adina 的可取消档。",
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
      "官网与 Booking.com 出现渠道库存差异：官网精确日期查询无房，Booking.com 仍显示两种大床房可订；预订时以实际进入的渠道结算页为准。",
    availabilityNoteEn:
      "Channel inventory differs: the direct engine has no availability for the exact stay, while Booking.com still lists both king-room categories. Treat each channel's checkout as authoritative.",
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-07-28 已从 Hotel Grand Chancellor Auckland 官网进入官方预订引擎，查询 10 月 7—9 日、1 间、2 人；入住条件栏明确显示 1 room / 2 adults，结果页提示所选日期无房。官网首页的“Rates from”不是本次日期报价，未写入比较。",
    officialStatusEn:
      "Verified on 28 Jul 2026 through Hotel Grand Chancellor Auckland's direct booking engine for 7–9 Oct, one room and two adults. The occupancy control shows 1 room / 2 adults and the results state no availability for the selected dates. Generic homepage 'Rates from' prices were not used.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://www.grandchancellorhotels.com/hotel-grand-chancellor-auckland",
    officialBookingUrl:
      "https://www.grandchancellorhotels.com/hotel-grand-chancellor-auckland/book/accommodations?Adults=2&Children=0&DateIn=10/07/26&DateOut=10/09/26&HotelId=98773&LanguageID=1&Rooms=1",
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
    strengthsEn: [
      "Breakfast included",
      "Clearly stated cancellation terms",
      "No prepayment; pay at the property",
      "King-bed option",
    ],
    cautionsEn: [
      "The two-night total is higher than Adina",
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
      "IHG 官网已按 2026 年 10 月 7—9 日、2 人 1 间核验：1 King Standard With Free Breakfast（20 m²、高楼层城市景、1 张 King 床）可订。IHG 会员 Advance Saver 两晚含税费总价 NZD 428，9 月 7 日前可更改或取消；Best Flexible 会员总价 NZD 558，10 月 6 日前可更改或取消。两档均含免费早餐、无需预付并到店付款。只有这一项可与现有 20 m² 标准 King 安全映射；Standard With Free Breakfast 与 Upgraded Standard 均不保证到店房型偏好，因此未挂到 Queen 或 28 m² 市景超级特大床房。",
    availabilityNoteEn:
      "Verified on IHG for 7–9 Oct 2026, two adults and one room: 1 King Standard With Free Breakfast (20 m², high-floor city view and one king bed) was available. The two-night tax-and-fee-inclusive IHG member total was NZD 428 on Advance Saver, changeable or cancellable through 7 Sep, or NZD 558 on Best Flexible, changeable or cancellable through 6 Oct. Both include free breakfast, require no prepayment and are payable at the property. This is the only official category that can be safely matched to the existing 20 m² standard king; Standard With Free Breakfast and Upgraded Standard do not guarantee the room preference at check-in and are not mapped to the queen or 28 m² city-view super-king categories.",
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
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-07-28 已在 IHG 官网实际带入 10 月 7—9 日、2 人 1 间：已核验 1 King Standard With Free Breakfast 的含税费两晚总价、免费早餐、付款与取消条款。该官网房型为 20 m²，只与现有 standard-king 映射；两个不保证到店房型偏好的泛标准房未写入 Queen 或 28 m² 市景超级特大床房。",
    officialStatusEn:
      "Verified on IHG on 28 Jul 2026 for 7–9 Oct 2026, two adults and one room. The tax-and-fee-inclusive totals, free breakfast, payment and cancellation terms for 1 King Standard With Free Breakfast were checked. This 20 m² official category is mapped only to the existing standard-king; the two generic standard categories that do not guarantee the room preference at check-in are not assigned to the queen or 28 m² city-view super-king rooms.",
    officialVerifiedAt: "2026-07-28",
    officialUrl:
      "https://www.ihg.com/holidayinnexpress/hotels/us/en/auckland/aklcc/hoteldetail",
    officialBookingUrl:
      "https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?qDest=58%20Albert%20Street%2C%20Auckland%201010%2C%20New%20Zealand&qPt=CASH&qCiD=7&qCoD=9&qCiMy=092026&qCoMy=092026&qAdlt=2&qChld=0&qRms=1&qAAR=6CBARC&qSlH=AKLCC&qAkamaiCC=CN&srb_u=1&qExpndSrch=false&qFS=false&qSrt=sAV&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.kd.ma.sp.va.re.vx.nd.sx.we.lx.rn.sn.nu.ge.fa&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=true&qpMbw=0&qErm=false&qpMn=1&qpMbx=0&qLoSe=false&qDr=1&qSt=Holiday%20Inn%20Express%20Auckland%20City%20Centre&qRmFltr=",
    bookingUrl:
      "https://www.booking.com/hotel/nz/holiday-inn-express-auckland-city-centre-an-ihg.html",
    agodaUrl:
      "https://www.agoda.com/holiday-inn-express-auckland-city-centre/hotel/auckland-nz.html",
    position: [-36.8474, 174.7638],
    mapQuery: "Holiday Inn Express Auckland City Centre",
  },
];
