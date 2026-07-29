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
    summary:
      "国际航站楼正对面，深夜抵达后步行入住，不用等接驳车。三晚拆住仍最省精力。",
    summaryEn:
      "Directly opposite the international terminal, making it the lowest-friction choice after a late arrival.",
    access: "国际航站楼外步行即到",
    accessEn: "Walk from the international terminal",
    parking: "使用机场付费停车；下单前核对当日停车价",
    parkingEn: "Paid airport parking; re-check the current rate",
    nearbyAttractions: [
      {
        name: "奥克兰国际航站楼",
        distance: "约 100 米",
        travelTime: "步行约 1—2 分钟",
        destinationQuery: "Auckland Airport International Terminal",
      },
      {
        name: "奥克兰国内航站楼",
        distance: "约 1 公里",
        travelTime: "航站楼巴士或步行约 10—15 分钟",
        destinationQuery: "Auckland Airport Domestic Terminal",
      },
    ],
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
        photosVerified: true,
        facilities: [
          "浴缸",
          "空调",
          "私人浴室",
          "隔音",
          "平板电视",
          "免费 Wi-Fi",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-1.jpg",
            label: "特大号床间卧室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-2.jpg",
            label: "特大号床间浴室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-3.jpg",
            label: "特大号床间床尾视角",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/novotel-booking-king-room-4.jpg",
            label: "特大号床间休息区",
            source: "Booking.com",
          },
        ],
      },
      {
        rateKey: "executive-king-26",
        name: "行政特大号床间",
        size: "26 m²",
        bed: "1 张超大号双人床",
        facilities: [
          "空调",
          "私人浴室",
          "隔音",
          "咖啡机",
          "迷你吧",
          "免费 Wi-Fi",
        ],
        images: [],
      },
      {
        rateKey: "superior-suite-52",
        name: "高级套房",
        size: "52 m²",
        bed: "1 张超大号双人床",
        facilities: [
          "私人套房",
          "空调",
          "私人浴室",
          "隔音",
          "咖啡机",
          "迷你吧",
          "免费 Wi-Fi",
        ],
        images: [],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/novotel-agoda-exterior.jpg",
        label: "酒店外观",
        source: "Agoda",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/novotel-agoda-reception.jpg",
        label: "酒店前台",
        source: "Agoda",
      },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        roomRates: {
          "superior-king-26": {
            official: {
              source: "Novotel 官网",
              roomKey: "superior-king-26",
              room: "Superior Room King-size Bed · 26 m²",
              nonRefundableNzd: 335.2,
              refundableNzd: 419,
              cancelUntil: "2026-09-27 23:59",
              payment: "不可退档在线付款；灵活价无需预付",
              breakfast: "不可退含双早官网价 NZD 388；灵活含双早 NZD 485",
              memberNote: "ALL 会员价：不可退 NZD 318.44；灵活价 NZD 398.05",
              quotedAt: "2026-07-28",
            },
            booking: {
              source: "Booking.com",
              roomKey: "superior-king-26",
              room: "高级特大号床间 · 26 m²",
              nonRefundableNzd: 335,
              refundableNzd: 419,
              cancelUntil: "2026-09-27",
              payment: "可免费取消价在 9 月 25 日前（不含当日）零付款",
              breakfast: "早餐另加 NZD 35/人",
              quotedAt: "2026-07-27",
            },
            agoda: {
              source: "Agoda",
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
          "executive-king-26": {
            booking: {
              source: "Booking.com",
              roomKey: "executive-king-26",
              room: "行政特大号床间 · 26 m²",
              nonRefundableNzd: 383,
              refundableNzd: 545,
              cancelUntil: "2026-09-27",
              payment:
                "可取消档在 9 月 25 日前（不含当日）零付款；可取消档包含早餐",
              breakfast: "不可退款档早餐另加 NZD 35/人",
              quotedAt: "2026-07-27",
            },
          },
          "superior-suite-52": {
            booking: {
              source: "Booking.com",
              roomKey: "superior-suite-52",
              room: "高级套房 · 52 m²",
              nonRefundableNzd: 525,
              refundableNzd: 722,
              cancelUntil: "2026-09-27",
              payment: "可取消档在 9 月 25 日前（不含当日）零付款；当前剩 1 间",
              breakfast: "可取消档包含早餐",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-07-28 已在 Novotel 官网实际带入 2026 年 9 月 28—29 日、2 人 1 间：5 种房型可订；Superior King 的含税公开价、早餐和退改条款均已展开核验。",
    officialStatusEn:
      "Verified on 28 Jul 2026 for 28–29 Sep 2026, two adults and one room; five room categories were available and the Superior King tax-inclusive rates and terms were opened.",
    officialVerifiedAt: "2026-07-28",
    officialUrl: "https://all.accor.com/hotel/7485/index.en.shtml",
    officialHotelCode: "7485",
    bookingUrl:
      "https://www.booking.com/hotel/nz/novotel-auckland-airport.html",
    agodaUrl:
      "https://www.agoda.com/en-sg/novotel-auckland-airport-hotel/hotel/auckland-nz.html",
    position: [-37.0075, 174.7839],
    mapQuery: "Novotel Auckland Airport",
  },
  {
    id: "pullman-auckland-airport",
    name: "Pullman Auckland Airport",
    recommendation: "舒适升级",
    recommendationEn: "Premium upgrade",
    summary:
      "国际航站楼旁的一分钟步行五星级选择，房间与餐饮体验更好，适合愿意为舒适度加预算。",
    summaryEn:
      "A premium five-star stay about a minute from the international terminal.",
    access: "国际航站楼旁约 1 分钟步行",
    accessEn: "About a one-minute terminal walk",
    parking: "官网 FAQ：代客泊车 NZD 69/天，预订前复核",
    parkingEn:
      "Official FAQ: valet parking NZD 69/day; re-check before booking",
    nearbyAttractions: [
      {
        name: "奥克兰国际航站楼",
        distance: "约 100 米",
        travelTime: "步行约 1 分钟",
        destinationQuery: "Auckland Airport International Terminal",
      },
      {
        name: "奥克兰国内航站楼",
        distance: "约 1 公里",
        travelTime: "航站楼巴士或步行约 10—15 分钟",
        destinationQuery: "Auckland Airport Domestic Terminal",
      },
    ],
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
        photosVerified: true,
        facilities: [
          "空调",
          "私人浴室",
          "步入式淋浴",
          "隔音",
          "平板电视",
          "咖啡机",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-1.jpg",
            label: "高级特大号床间卧室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-2.jpg",
            label: "高级特大号床间休息区",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-3.jpg",
            label: "高级特大号床间床铺",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-4.jpg",
            label: "高级特大号床间浴室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-5.jpg",
            label: "高级特大号床间窗边",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-6.jpg",
            label: "高级特大号床间细节",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-7.jpg",
            label: "高级特大号床间全景",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/pullman-booking-king-room-8.jpg",
            label: "高级特大号床间淋浴区",
            source: "Booking.com",
          },
        ],
      },
      {
        rateKey: "executive-king-30",
        name: "行政特大号床间",
        size: "30 m²",
        bed: "1 张超大号双人床",
        facilities: ["景观", "空调", "私人浴室", "隔音", "咖啡机"],
        images: [],
      },
      {
        rateKey: "executive-king-suite-60",
        name: "行政特大号床套房",
        size: "60 m²",
        bed: "1 张大号双人床",
        facilities: [
          "私人套房",
          "景观",
          "浴缸",
          "空调",
          "私人浴室",
          "隔音",
          "咖啡机",
        ],
        images: [],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-1.jpg",
        label: "酒店外观",
        source: "Booking.com",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-2.jpg",
        label: "酒店大堂",
        source: "Booking.com",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-3.jpg",
        label: "酒店公共区域",
        source: "Booking.com",
      },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        roomRates: {
          "superior-king-30": {
            official: {
              source: "Pullman 官网",
              roomKey: "superior-king-30",
              room: "Superior Room with 1 king bed · 30 m²",
              roomEn: "Superior Room with 1 king bed · 30 m²",
              nonRefundableNzd: 351.2,
              refundableNzd: 439,
              rateLabel:
                "官网一晚含税总价 · Hotel Sale · 不含早餐 · 不可退款 · 在线付款",
              rateLabelEn:
                "Direct tax-inclusive one-night total · Hotel Sale · room only · non-refundable · online payment",
              refundableRateLabel:
                "官网一晚含税总价 · Flexible · 不含早餐 · 2026 年 9 月 27 日 18:00（酒店当地时间）前免费取消 · 无需预付",
              refundableRateLabelEn:
                "Direct tax-inclusive one-night total · Flexible · room only · free cancellation until 6:00 p.m. hotel local time on 27 Sep 2026 · no prepayment",
              cancelUntil: "2026-09-27 18:00（酒店当地时间）",
              cancelUntilEn: "6:00 p.m. hotel local time on 27 Sep 2026",
              payment:
                "Hotel Sale 须在线付款且不可退款；Flexible 无需预付，并可在 9 月 27 日 18:00（酒店当地时间）前免费取消",
              paymentEn:
                "Hotel Sale requires online payment and is non-refundable; Flexible requires no prepayment and may be cancelled free until 6:00 p.m. hotel local time on 27 Sep",
              breakfast:
                "上述 NZD 351.20 与 NZD 439 均为不含早餐价；含早餐替代档为 Hotel Sale 公开含税价 NZD 429.20（不可退款、在线付款）及 Flexible 公开含税价 NZD 517（同一免费取消截止时间、无需预付）",
              breakfastEn:
                "The NZD 351.20 and NZD 439 rates above are room-only; breakfast-inclusive alternatives are Hotel Sale at NZD 429.20 public tax-inclusive (non-refundable, online payment) and Flexible at NZD 517 public tax-inclusive (same cancellation deadline, no prepayment)",
              memberNote:
                "ALL 会员含税价：Hotel Sale 不含早餐 NZD 333.64、含早餐 NZD 407.74；Flexible 不含早餐 NZD 417.05、含早餐 NZD 491.15；需登录会员账户",
              memberNoteEn:
                "ALL member tax-inclusive rates: Hotel Sale NZD 333.64 room-only or NZD 407.74 with breakfast; Flexible NZD 417.05 room-only or NZD 491.15 with breakfast; sign-in required",
              quotedAt: "2026-07-28",
            },
            booking: {
              source: "Booking.com",
              roomKey: "superior-king-30",
              room: "高级特大号床间 · 30 m²",
              nonRefundableNzd: 351,
              refundableNzd: 439,
              cancelUntil: "2026-09-27",
              payment: "免费取消价无需预付、到店付款",
              breakfast: "早餐另加 NZD 45/人",
              quotedAt: "2026-07-27",
            },
            agoda: {
              source: "Agoda",
              roomKey: "superior-king-30",
              room: "Superior Room with 1 King Bed · 30 m²",
              nonRefundableNzd: 306,
              refundableNzd: null,
              cancelUntil: null,
              payment: "仅核验到不可退款价；未进入可取消档结算页",
              breakfast: "早餐另加 NZD 45/人",
              quotedAt: "2026-07-26",
            },
          },
          "executive-king-30": {
            booking: {
              source: "Booking.com",
              roomKey: "executive-king-30",
              room: "行政特大号床间 · 30 m²",
              nonRefundableNzd: 511,
              refundableNzd: 717,
              cancelUntil: "2026-09-27",
              payment: "可取消档无需预付、到店付款；可取消档包含早餐",
              breakfast: "不可退款档早餐另加 NZD 45/人",
              quotedAt: "2026-07-27",
            },
          },
          "executive-king-suite-60": {
            booking: {
              source: "Booking.com",
              roomKey: "executive-king-suite-60",
              room: "行政特大号床套房 · 60 m²",
              nonRefundableNzd: 655,
              refundableNzd: 897,
              cancelUntil: "2026-09-27",
              payment: "可取消档无需预付、到店付款；当前剩 1 间",
              breakfast: "可取消档包含早餐",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    availabilityNote:
      "Pullman 官网已按 2026 年 9 月 28—29 日、2 人 1 间核验：6 种房型可订；Superior King 30 m² 的 Hotel Sale 不含早餐公开含税价 NZD 351.20、不可退款且在线付款，Flexible 不含早餐公开含税价 NZD 439、9 月 27 日 18:00 前免费取消且无需预付；含早与 ALL 会员替代价也已分别核验并展示。Booking 同房型不可退 NZD 351、可取消 NZD 439；Agoda 不可退 NZD 306，渠道条款分别展示。",
    availabilityNoteEn:
      "The Pullman direct site was checked for 28–29 Sep 2026, two adults and one room: six room categories were available. For the 30 m² Superior King, the room-only Hotel Sale public tax-inclusive rate is NZD 351.20, non-refundable with online payment; the room-only Flexible public tax-inclusive rate is NZD 439, cancellable free until 6:00 p.m. on 27 Sep with no prepayment. Breakfast-inclusive and ALL member alternatives were also verified and are shown separately. Booking.com lists NZD 351 non-refundable and NZD 439 cancellable, while Agoda lists NZD 306 non-refundable; each channel's terms are shown separately.",
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-07-28 已在 Pullman Auckland Airport 的 Accor 官方预订页带入 2026 年 9 月 28—29 日、2 位成人、1 间。页面明确显示 6 种房型可订，Superior Room with 1 king bed 为 30 m²、1 张 King；Hotel Sale 与 Flexible 的不含早/含早公开价、ALL 会员价、退改及付款方式均已逐档展开核验，页面标注税费已含。",
    officialStatusEn:
      "Verified on 28 Jul 2026 in Pullman Auckland Airport's official Accor engine for 28–29 Sep 2026, two adults and one room. Six categories were available; the Superior Room with one king bed is 30 m². Public and ALL member Hotel Sale and Flexible rates, both room-only and breakfast-inclusive, were opened and checked individually together with their cancellation and payment terms; the page marks taxes and fees as included.",
    officialVerifiedAt: "2026-07-28",
    officialUrl: "https://www.pullmanaucklandairport.com/",
    officialHotelCode: "A8U9",
    bookingUrl:
      "https://www.booking.com/hotel/nz/pullman-auckland-airport.html",
    agodaUrl:
      "https://www.agoda.com/pullman-auckland-airport-opening-december-2023/hotel/auckland-nz.html",
    position: [-37.0067, 174.7825],
    mapQuery: "Pullman Auckland Airport",
  },
  {
    id: "jetpark-auckland-airport",
    name: "JetPark Hotel Auckland Airport",
    recommendation: "性价比",
    recommendationEn: "Best value",
    summary:
      "不能从航站楼步行，但提供 24 小时免费机场接驳；能接受等车时，是评分与成本更均衡的选择。",
    summaryEn:
      "A strong-value option with a complimentary 24-hour airport shuttle instead of a terminal walk.",
    access: "24 小时免费机场接驳车",
    accessEn: "Complimentary 24-hour airport shuttle",
    parking:
      "Agoda 标注免费停车；Booking 房型说明称过夜停车需预约且可能收费，下单前向酒店确认",
    parkingEn:
      "Agoda lists free parking; Booking notes that overnight parking may require advance booking and a fee, so confirm with the hotel.",
    nearbyAttractions: [
      {
        name: "奥克兰国际航站楼",
        distance: "约 4.5 公里",
        travelTime: "免费接驳约 10—15 分钟（候车时间另计）",
        destinationQuery: "Auckland Airport International Terminal",
      },
      {
        name: "奥克兰国内航站楼",
        distance: "约 4 公里",
        travelTime: "免费接驳约 10—15 分钟（候车时间另计）",
        destinationQuery: "Auckland Airport Domestic Terminal",
      },
    ],
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
        photosVerified: true,
        facilities: [
          "空调",
          "私人浴室",
          "步入式淋浴",
          "隔音",
          "平板电视",
          "免费 Wi-Fi",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-1.jpg",
            label: "高级特大号床间卧室",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-2.jpg",
            label: "高级特大号床间床铺",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-3.jpg",
            label: "高级特大号床间休息区",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-booking-superior-king-room-4.jpg",
            label: "高级特大号床间浴室",
            source: "Booking.com",
          },
        ],
      },
      {
        rateKey: "deluxe-king-31",
        name: "豪华特大号床间",
        size: "31 m²",
        bed: "1 张超大号双人床",
        facilities: ["空调", "私人浴室", "隔音", "免费 Wi-Fi"],
        images: [],
      },
      {
        rateKey: "executive-king-28",
        name: "行政特大号床间",
        size: "28 m²",
        bed: "1 张超大号双人床",
        facilities: [
          "景观",
          "空调",
          "私人浴室",
          "隔音",
          "咖啡机",
          "免费 Wi-Fi",
        ],
        images: [],
      },
      {
        rateKey: "executive-suite-59",
        name: "行政套房",
        size: "59 m²",
        bed: "1 张超大号双人床",
        facilities: [
          "私人套房",
          "私人小厨房",
          "空调",
          "私人浴室",
          "隔音",
          "咖啡机",
          "免费 Wi-Fi",
        ],
        images: [],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-exterior.webp",
        label: "酒店外观",
        source: "Agoda",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-restaurant.webp",
        label: "酒店餐厅",
        source: "Agoda",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/jetpark-agoda-pool.webp",
        label: "室外泳池",
        source: "Agoda",
      },
    ],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        roomRates: {
          "superior-king-23": {
            official: {
              source: "JetPark Auckland 官网",
              roomKey: "superior-king-23",
              room: "Superior King · 23 m² · 1 张 King 床",
              roomEn: "Superior King · 23 m² · one king bed",
              nonRefundableNzd: 196.56,
              refundableNzd: 234,
              rateLabel:
                "官网一晚总价 · Jet Saver Non Refundable · 含 15% GST；税费页房费 NZD 196.56、信用卡服务费 NZD 0",
              rateLabelEn:
                "Direct one-night total · Jet Saver Non Refundable · includes 15% GST; tax-and-fee panel shows NZD 196.56 room charge and NZD 0 card service fee",
              refundableRateLabel:
                "官网一晚总价 · Flexi · 含 15% GST；2026 年 9 月 27 日 14:00（酒店当地时间）前取消不收罚金",
              refundableRateLabelEn:
                "Direct one-night total · Flexi · includes 15% GST; cancel without penalty by 2:00 p.m. hotel local time on 27 Sep 2026",
              rateOptions: [
                {
                  label: "会员价",
                  labelEn: "Members Rate",
                  nzd: 198.9,
                  detail:
                    "官网显示原价 NZD 234、会员价 NZD 198.90，含 15% GST；需满足会员资格；有效银行卡仅作担保、不扣款，可免费改期；9 月 27 日 14:00（酒店当地时间）前取消不收罚金，逾期取消或未入住收取一晚房费",
                  detailEn:
                    "The direct engine shows NZD 234 struck through and a NZD 198.90 member rate including 15% GST; membership eligibility applies; a valid card guarantees the booking without charge, changes carry no penalty, cancellation is penalty-free by 2:00 p.m. hotel local time on 27 Sep, and late cancellation or no-show incurs one night",
                },
                {
                  label: "JetPark Winter Special",
                  labelEn: "JetPark Winter Special",
                  nzd: 198.9,
                  detail:
                    "官网显示的一晚价格；页面未展开可复现的取消、扣款和早餐规则",
                  detailEn:
                    "One-night price shown by the direct engine; reproducible cancellation, payment and breakfast terms were not expanded",
                },
              ],
              cancelUntil: "2026-09-27 14:00（酒店当地时间）",
              cancelUntilEn: "2:00 p.m. hotel local time on 27 Sep 2026",
              payment:
                "Jet Saver 须预订时全额预付，取消不退款，改期按个案处理；Flexi 与会员价用有效银行卡担保但不扣款，可免费改期，9 月 27 日 14:00（酒店当地时间）后取消或未入住收取一晚房费",
              paymentEn:
                "Jet Saver requires full prepayment and is non-refundable, with changes considered case by case; Flexi and Members Rate use a valid card as a no-charge guarantee, allow penalty-free changes, and charge one night for cancellation after 2:00 p.m. hotel local time on 27 Sep or no-show",
              breakfast:
                "官网未标明这些房价包含早餐；页面仅出现儿童早餐价格，不能据此推断成人早餐或含早",
              breakfastEn:
                "The direct engine does not state that these rates include breakfast; child breakfast pricing alone does not establish adult breakfast pricing or inclusion",
              memberNote:
                "本次房价页面另明确列出免费机场接驳、过夜停车、Wi-Fi 与最多 10 天存车",
              memberNoteEn:
                "The verified rate page also lists complimentary airport shuttle, overnight parking, Wi-Fi and up to ten days of car storage",
              quotedAt: "2026-07-28",
            },
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "superior-king-23",
              room: "高级特大号床间 · 23 m²",
              nonRefundableNzd: 197,
              refundableNzd: 211,
              cancelUntil: "2026-09-27",
              payment: "免费取消价无需预付、到店付款",
              breakfast: "早餐另加 NZD 34/人",
              quotedAt: "2026-07-27",
            },
            agoda: {
              source: "Agoda",
              roomKey: "superior-king-23",
              room: "Superior King · 23 m²",
              nonRefundableNzd: 157,
              refundableNzd: null,
              cancelUntil: null,
              payment: "仅核验到不可退款价；未进入可取消档结算页",
              breakfast: "早餐另加 NZD 34/人",
              quotedAt: "2026-07-27",
            },
          },
          "deluxe-king-31": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "deluxe-king-31",
              room: "豪华特大号床间 · 31 m²",
              nonRefundableNzd: 215,
              refundableNzd: 229,
              cancelUntil: "2026-09-27",
              payment: "免费取消价无需预付、到店付款",
              breakfast: "早餐另加 NZD 34/人",
              quotedAt: "2026-07-27",
            },
          },
          "executive-king-28": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "executive-king-28",
              room: "行政特大号床间 · 28 m²",
              nonRefundableNzd: 248,
              refundableNzd: 261,
              cancelUntil: "2026-09-27",
              payment: "免费取消价无需预付、到店付款",
              breakfast: "早餐另加 NZD 34/人",
              quotedAt: "2026-07-27",
            },
          },
          "executive-suite-59": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "executive-suite-59",
              room: "行政套房 · 59 m²",
              nonRefundableNzd: 333,
              refundableNzd: 347,
              cancelUntil: "2026-09-27",
              payment: "免费取消价无需预付、到店付款；当前剩 3 间",
              breakfast: "早餐另加 NZD 34/人",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    availabilityNote:
      "JetPark 官网已按 2026 年 9 月 28—29 日、2 人 1 间核验 Superior King（23 m²、1 张 King 床）：Jet Saver Non Refundable NZD 196.56，会员价 NZD 198.90（原价 NZD 234）、Winter Special NZD 198.90、Flexi NZD 234，均含 15% GST。Jet Saver 须全额预付且取消不退款；Flexi 与会员价以银行卡担保但不扣款，可免费改期，并可在 9 月 27 日 14:00（酒店当地时间）前无罚金取消，逾期取消或未入住收取一晚。Winter Special 条款尚未核验，官网也未标明含早餐。",
    availabilityNoteEn:
      "The JetPark direct engine was checked for 28–29 Sep 2026, two adults and one room. The 23 m² Superior King with one king bed showed Jet Saver Non Refundable at NZD 196.56, Members Rate at NZD 198.90 (NZD 234 struck through), Winter Special at NZD 198.90 and Flexi at NZD 234, all including 15% GST. Jet Saver requires full prepayment and is non-refundable. Flexi and Members Rate use a card guarantee without charge, allow penalty-free changes, and may be cancelled without penalty by 2:00 p.m. hotel local time on 27 Sep; late cancellation or no-show incurs one night. Winter Special terms remain unverified and breakfast inclusion was not stated.",
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-07-28 已从 JetPark Auckland 官网进入其官方 TravelClick 预订引擎，带入 2026 年 9 月 28—29 日、2 位成人、1 间。页面明确显示 Superior King（23 m²、1 张 King 床）及四档一晚含 15% GST 价格。Jet Saver Non Refundable 为 NZD 196.56，须全额预付、取消不退款；Flexi NZD 234 与会员价 NZD 198.90 均以有效银行卡担保但不扣款、可免费改期，并可在抵达日前 24 小时的 14:00 前取消（本次为 9 月 27 日 14:00 酒店当地时间），逾期取消或未入住收取一晚。Winter Special 条款及早餐包含情况未作推断。",
    officialStatusEn:
      "Verified on 28 Jul 2026 via JetPark Auckland's official TravelClick engine for 28–29 Sep 2026, two adults and one room. The page explicitly showed a 23 m² Superior King with one king bed and four one-night prices including 15% GST. Jet Saver Non Refundable was NZD 196.56, fully prepaid and non-refundable. Flexi at NZD 234 and Members Rate at NZD 198.90 use a valid card guarantee without charge, allow penalty-free changes, and can be cancelled without penalty by 2:00 p.m. hotel local time 24 hours before arrival (27 Sep for this stay); late cancellation or no-show incurs one night. Winter Special terms and breakfast inclusion were not inferred.",
    officialVerifiedAt: "2026-07-28",
    officialUrl: "https://www.jetparkauckland.co.nz/",
    officialBookingUrl:
      "https://reservations.jetparkauckland.co.nz/10854?Adults=2&Children=0&DateIn=09/28/26&DateOut=09/29/26&hotelid=10854&LanguageID=1",
    bookingUrl:
      "https://www.booking.com/hotel/nz/jet-park-airport-conference-centre.html",
    agodaUrl:
      "https://www.agoda.com/en-sg/jet-park-airport-hotel/hotel/auckland-nz.html",
    position: [-36.9985, 174.8037],
    mapQuery: "JetPark Hotel Auckland Airport",
  },
  {
    id: "ibis-budget-auckland-airport",
    name: "ibis budget Auckland Airport",
    recommendation: "预算优先",
    recommendationEn: "Budget choice",
    summary:
      "距离航站楼约 800 米，房间配置基础但动线明确，适合只睡一晚且愿意精简住宿体验。",
    summaryEn:
      "A basic, walkable option roughly 800 metres from the terminal for budget-focused stays.",
    access: "约 800 米，可步行或乘机场巴士",
    accessEn: "About 800 m; walk or use the airport bus",
    parking: "Accor 官网：入住当晚免费停车；机场接驳另收费",
    parkingEn:
      "Accor: complimentary parking for the night of the stay; airport shuttle costs extra.",
    nearbyAttractions: [
      {
        name: "奥克兰国际航站楼",
        distance: "约 800 米",
        travelTime: "步行约 10—12 分钟",
        destinationQuery: "Auckland Airport International Terminal",
      },
      {
        name: "奥克兰国内航站楼",
        distance: "约 1.2 公里",
        travelTime: "步行约 15 分钟或乘机场巴士",
        destinationQuery: "Auckland Airport Domestic Terminal",
      },
    ],
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
        photosVerified: true,
        facilities: [
          "空调",
          "私人浴室",
          "步入式淋浴",
          "遮光帘",
          "平板电视",
          "免费 Wi-Fi",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/ibis-accor-budget-queen-room-1.jpg",
            label: "Budget Queen 客房",
            source: "Accor 官网",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/ibis-room-3.jpg",
            label: "Budget Queen 客房全景",
            source: "Accor 官网",
          },
        ],
      },
    ],
    hotelImages: [],
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        roomRates: {
          "budget-queen-12": {
            official: {
              source: "ibis budget 官网",
              roomKey: "budget-queen-12",
              room: "Budget Room with 1 Queen Bed · 12 m²",
              roomEn: "Budget Room with 1 Queen Bed · 12 m²",
              nonRefundableNzd: 159.2,
              refundableNzd: 199,
              rateLabel:
                "官网一晚含税费总价 · Hotel Sale · 不含早餐 · 不可退款 · 在线付款",
              rateLabelEn:
                "Direct one-night total including taxes and fees · Hotel Sale · room only · non-refundable · online payment",
              refundableRateLabel:
                "官网一晚含税费总价 · Flexible · 不含早餐 · 2026 年 9 月 27 日 23:59 前免费取消 · 无需预付",
              refundableRateLabelEn:
                "Direct one-night total including taxes and fees · Flexible · room only · free cancellation until 11:59 p.m. on 27 Sep 2026 · no prepayment",
              cancelUntil: "2026-09-27 23:59",
              cancelUntilEn: "11:59 p.m. on 27 Sep 2026",
              payment:
                "Hotel Sale 须在线付款且不可退款；Flexible 无需预付，并可在 9 月 27 日 23:59 前免费取消",
              paymentEn:
                "Hotel Sale requires online payment and is non-refundable; Flexible requires no prepayment and may be cancelled free until 11:59 p.m. on 27 Sep",
              breakfast:
                "上述 NZD 159.20 与 NZD 199 均为不含早餐价；含早餐公开含税费总价为 Hotel Sale NZD 196（不可退款、在线付款）或 Flexible NZD 245（同一免费取消截止时间、无需预付）",
              breakfastEn:
                "The NZD 159.20 and NZD 199 rates above are room-only; public breakfast-inclusive totals including taxes and fees are NZD 196 for Hotel Sale (non-refundable, online payment) or NZD 245 for Flexible (same cancellation deadline, no prepayment)",
              memberNote:
                "ALL 会员 Hotel Sale 含税费总价：不含早餐 NZD 151.24，含早餐 NZD 186.20；两档均不可退款、在线付款，需登录会员账户。页面未显示会员 Flexible 价，未作推断",
              memberNoteEn:
                "ALL member Hotel Sale totals including taxes and fees: NZD 151.24 room-only or NZD 186.20 with breakfast; both are non-refundable, require online payment and require sign-in. No member Flexible price was shown or inferred",
              quotedAt: "2026-07-28",
            },
          },
        },
      },
    },
    availabilityNote:
      "Accor 官网已按 2026 年 9 月 28—29 日、2 人 1 间核验：7 种房型可订。Budget Queen 12 m² 不含早的公开含税费总价为 Hotel Sale NZD 159.20（不可退款、在线付款）或 Flexible NZD 199（9 月 27 日 23:59 前免费取消、无需预付）；含早餐公开价分别为 NZD 196 / 245。ALL 会员 Hotel Sale 为不含早 NZD 151.24、含早 NZD 186.20；页面未显示会员 Flexible 价。Booking 详情链接本次仍返回 404，因此只展示官网已核验价。",
    availabilityNoteEn:
      "The Accor direct site was checked for 28–29 Sep 2026, two adults and one room: seven categories were available. For the 12 m² Budget Queen, room-only public totals including taxes and fees were NZD 159.20 for Hotel Sale (non-refundable, online payment) or NZD 199 for Flexible (free cancellation until 11:59 p.m. on 27 Sep, no prepayment); breakfast-inclusive public totals were NZD 196 / 245. ALL member Hotel Sale totals were NZD 151.24 room-only or NZD 186.20 with breakfast; no member Flexible price was shown. The Booking.com detail link still returns an error, so only the verified direct price is shown.",
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-07-28 已在 ibis budget Auckland Airport 的 Accor 官方预订页带入 2026 年 9 月 28—29 日、2 位成人、1 间。页面明确显示 7 种房型可订，Budget Room with 1 Queen Bed 为 12 m²、1 张 Queen；Hotel Sale 与 Flexible 的不含早/含早公开含税费总价、Hotel Sale 会员价、退改及付款方式均已逐档展开核验。页面未显示会员 Flexible 价，未作推断。",
    officialStatusEn:
      "Verified on 28 Jul 2026 in ibis budget Auckland Airport's official Accor engine for 28–29 Sep 2026, two adults and one room. Seven categories were available; the Budget Room with one queen bed is 12 m². Public room-only and breakfast-inclusive Hotel Sale and Flexible totals including taxes and fees, together with Hotel Sale member prices, cancellation and payment terms, were opened and checked individually. No member Flexible price was shown or inferred.",
    officialVerifiedAt: "2026-07-28",
    officialUrl: "https://all.accor.com/hotel/7865/index.en.shtml",
    officialHotelCode: "7865",
    bookingUrl:
      "https://www.booking.com/hotel/nz/ibis-budget-auckland-airport.html",
    agodaUrl:
      "https://www.agoda.com/ibis-budget-auckland-airport/hotel/auckland-nz.html",
    position: [-37.0049, 174.7898],
    mapQuery: "ibis budget Auckland Airport",
  },
];

export const aucklandAirportStayDates = ["2026-09-28"];

export function bookingUrlForStay(hotel, checkIn, checkOut) {
  const url = new URL(hotel.bookingUrl);
  url.searchParams.set("checkin", checkIn);
  url.searchParams.set("checkout", checkOut);
  url.searchParams.set("group_adults", "2");
  url.searchParams.set("no_rooms", "1");
  return url.toString();
}

export function officialUrlForStay(hotel, checkIn, checkOut) {
  if (hotel.officialBookingUrl) return hotel.officialBookingUrl;
  if (!hotel.officialHotelCode) return hotel.officialUrl;
  const url = new URL(
    `https://all.accor.com/booking/en/accor/hotel/${hotel.officialHotelCode}`,
  );
  url.searchParams.set("compositions", "2");
  url.searchParams.set("dateIn", checkIn);
  url.searchParams.set("dateOut", checkOut);
  url.searchParams.set(
    "nights",
    String(
      Math.max(
        1,
        Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000),
      ),
    ),
  );
  url.searchParams.set("hideWDR", "false");
  url.searchParams.set("accessibleRoom", "false");
  return url.toString();
}

export function airbnbUrlForStay(checkIn, checkOut) {
  const url = new URL(
    "https://www.airbnb.com/s/Auckland-Airport--New-Zealand/homes",
  );
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
  const nights = Math.max(
    1,
    Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000),
  );
  url.searchParams.set("los", String(nights));
  return url.toString();
}
