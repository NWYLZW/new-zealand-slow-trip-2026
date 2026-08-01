import { completeAccommodationEnglishFields } from "./accommodationEnglishFields.js";
import { applyAccommodationRatingOverrides } from "./accommodationRatingOverrides.js";
import { applyAccommodationGalleryEnhancements } from "./accommodationGalleryEnhancements.js";

export const AUCKLAND_AIRPORT_SELECTION_KEY = "nz-trip-hotel-selections";

export const aucklandAirportOvernightGuides = [
  {
    title: "奥克兰国际机场过夜攻略",
    titleEn: "Auckland International Airport overnight guide",
    author: "吃遍新加坡的汤姆A梦",
    authorEn: "Xiaohongshu traveller",
    url: "https://www.xiaohongshu.com/explore/679644c2000000001701c538",
    note: "国际楼能找到休息位置，但夏天夜里也冷；国际、国内航站楼距离需要预留步行时间。",
    noteEn: "Resting spots are available in the international terminal, but nights can feel cold even in summer; allow enough time to walk between the international and domestic terminals.",
  },
  {
    title: "奥克兰机场买手机卡+携带药品+过夜攻略(二)",
    titleEn: "Auckland Airport SIM card, medicine and overnight guide (part 2)",
    author: "在新西兰读博的小C",
    authorEn: "Xiaohongshu traveller",
    url: "https://www.xiaohongshu.com/explore/67cfbc080000000009014ef8",
    note: "国际楼 24 小时开放，二楼木椅可充电；国内楼午夜关闭，国内楼二楼有淋浴。作者 43 小时旅程只睡约 3 小时。",
    noteEn: "The international terminal stays open 24 hours and level-two wooden seating has charging points. The domestic terminal closes at midnight but has showers upstairs. The author slept only about three hours during a 43-hour journey.",
  },
  {
    title: "奥克兰机场过夜指南～国际入境转国内",
    titleEn: "Overnight at Auckland Airport between international and domestic flights",
    author: "嘚嘚班",
    authorEn: "Xiaohongshu traveller",
    url: "https://www.xiaohongshu.com/explore/66fb00e3000000002c0176b2",
    note: "国际楼二楼有躺椅和电源；凌晨沿绿色地标步行约 15 分钟到国内楼，淋浴需自备洗漱用品。",
    noteEn: "Level two of the international terminal has reclining seats and power. The marked walk to the domestic terminal takes about 15 minutes before dawn; bring your own toiletries for the showers.",
  },
  {
    title: "奥克兰机场睡机场攻略",
    titleEn: "Sleeping at Auckland Airport",
    author: "V理想V自由",
    authorEn: "Xiaohongshu traveller",
    url: "https://www.xiaohongshu.com/explore/674f8505000000000202b9f2",
    note: "国际楼夜间人不少，二楼椅子可充电；摆渡车过早过晚可能没有，步行按绿色箭头约 10 分钟。",
    noteEn: "The international terminal remains busy overnight and level-two seats have charging points. The shuttle may not run very early or late; following the green arrows takes about ten minutes on foot.",
  },
  {
    title: "奥克兰机场过夜",
    titleEn: "Overnight at Auckland Airport",
    author: "gg",
    authorEn: "Xiaohongshu traveller",
    url: "https://www.xiaohongshu.com/explore/65c473830000000007028bf8",
    note: "座椅没有扶手，可以横躺；国内楼 3 号门附近上楼可洗热水澡。",
    noteEn: "Some armless seating allows travellers to lie down. Hot showers are upstairs near door 3 in the domestic terminal.",
  },
];

const reviewedHotelImage = (fileName, label, sourceUrl) => ({
  src: `/new-zealand-slow-trip-2026/images/hotels/${fileName}`,
  label,
  source: sourceUrl,
});

const airportAttractions = (terminalDistance, terminalTravel, secondary) => [
  {
    name: "奥克兰国际航站楼",
    distance: terminalDistance,
    travelTime: terminalTravel,
    destinationQuery: "Auckland Airport International Terminal",
  },
  secondary,
];

export const aucklandAirportHotels = [
  {
    id: "novotel-auckland-airport",
    stayType: "hotel",
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
    strengthsEn: [
      "The international terminal is only a one-to-two-minute walk away",
      "A 24-hour front desk suits the late international arrival",
      "No shuttle wait or transfer uncertainty after landing",
    ],
    cautions: ["通常不是最低价", "停车需另付费"],
    cautionsEn: [
      "It is usually more expensive than off-airport alternatives",
      "Airport parking is paid separately and should be re-checked before booking",
    ],
    ratings: [
      {
        platform: "Agoda",
        score: "8.8 / 10",
        reviews: "1,843 条",
        sourceUrl: "https://www.agoda.com/en-nz/novotel-auckland-airport-hotel/hotel/auckland-nz.html",
        reviewedAt: "2026-07-31",
      },
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
        },
      },
    },
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-07-28 已在 Novotel 官网实际带入 2026 年 9 月 28—29 日、2 人 1 间：5 种房型可订；Superior King 的含税公开价、早餐和退改条款均已展开核验。",
    availabilityNote:
      "Novotel 官网已按 2026 年 9 月 28—29 日、2 人 1 间核验；Superior King 的含税公开价、早餐与退改条款均已展开，并保留 Booking 与 Agoda 的同日独立报价供比较。",
    availabilityNoteEn:
      "Checked on the Novotel website for 28–29 Sep 2026, two adults and one room. The Superior King tax-inclusive public rates, breakfast options and cancellation terms were opened, with separate same-date Booking.com and Agoda quotes retained for comparison.",
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
    stayType: "hotel",
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
    strengthsEn: [
      "About a one-minute walk from the international terminal",
      "The most premium room and facilities among the current airport shortlist",
      "A new-build airport hotel with strong soundproofing",
    ],
    cautions: ["通常价格最高", "代客泊车成本高"],
    cautionsEn: [
      "Usually the highest-priced airport option",
      "Valet parking is expensive and should be confirmed before arrival",
    ],
    ratings: [],
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
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-1.jpg",
        label: "酒店外观",
        source: "Pullman 官网",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-2.jpg",
        label: "酒店大堂",
        source: "Pullman 官网",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/pullman-room-3.jpg",
        label: "酒店公共区域",
        source: "Pullman 官网",
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
    stayType: "hotel",
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
    strengthsEn: [
      "Complimentary 24-hour airport shuttle",
      "Consistently strong guest ratings",
      "Usually better value than the terminal-side hotels",
    ],
    cautions: ["深夜仍需等接驳", "往返时间不如步行可控"],
    cautionsEn: [
      "A late-night arrival still involves waiting for the shuttle",
      "Transfer time is less predictable than walking from a terminal-side hotel",
    ],
    ratings: [
      {
        platform: "Agoda",
        score: "8.5 / 10",
        reviews: "2,014 条",
        sourceUrl: "https://www.agoda.com/en-nz/jet-park-airport-hotel/hotel/auckland-nz.html",
        reviewedAt: "2026-07-31",
      },
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
    stayType: "hotel",
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
    strengthsEn: [
      "The lowest price threshold in the existing airport shortlist",
      "Walkable without relying on a hotel shuttle",
      "Food outlets and a supermarket are close by",
    ],
    cautions: ["房间较小且配置基础", "雨天拖行李步行不轻松"],
    cautionsEn: [
      "The 12 m² room is compact and deliberately basic",
      "Walking with luggage is uncomfortable in rain or after a long flight",
    ],
    ratings: [
      {
        platform: "Agoda",
        score: "8.3 / 10",
        reviews: "3,498 条",
        sourceUrl: "https://www.agoda.com/en-nz/ibis-budget-auckland-airport/hotel/auckland-nz.html",
        reviewedAt: "2026-07-31",
      },
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
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/ibis-budget-auckland-airport-exterior.jpg",
        label: "ibis budget Auckland Airport 酒店外观",
        source: "Accor 官网",
      },
      reviewedHotelImage(
        "ibis-budget-auckland-airport-exterior-day.jpg",
        "酒店日间外观",
        "https://www.ahstatic.com/photos/7865_ho_03_p_1024x768.jpg",
      ),
      reviewedHotelImage(
        "ibis-budget-auckland-airport-exterior-evening.jpg",
        "酒店傍晚外观",
        "https://www.ahstatic.com/photos/7865_ho_04_p_1024x768.jpg",
      ),
    ],
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
  {
    id: "naumi-auckland-airport",
    stayType: "hotel",
    name: "Naumi Hotel Auckland Airport",
    recommendation: "设计感与停车",
    recommendationEn: "Design-led stay with parking",
    summary:
      "Māngere 的设计酒店，住店期间停车免费；适合自驾抵达后想住得更有特色、又不介意搭车前往航站楼的人。",
    summaryEn:
      "A design-led Māngere hotel with complimentary parking during the stay, best for drivers who do not need a walkable terminal hotel.",
    access: "153 Kirkbride Road；距国际航站楼直线约 3.6 公里，前往机场需搭车",
    accessEn:
      "153 Kirkbride Road; about 3.6 km straight-line from the international terminal and requires a transfer",
    parking: "官网写明住店期间免费停车；退房后停车另有 NZD 5/天起的住客方案",
    parkingEn:
      "Official site states complimentary parking during the stay; post-stay guest parking starts from NZD 5/day",
    nearbyAttractions: airportAttractions("直线约 3.6 公里", "驾车或接驳；实际时长待出发前复核", {
      name: "Ambury Regional Park",
      distance: "直线约 2.9 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Ambury Regional Park",
    }),
    strengths: ["住店期间免费停车", "28 m² 房间与设计感比基础机场 motel 更舒适"],
    strengthsEn: [
      "Complimentary parking during the stay",
      "A 28 m² room and a more design-led environment than a basic airport motel",
    ],
    cautions: ["不在航站楼步行范围", "9 月 28 日精确库存、接驳方式和价格仍需在预订引擎复核"],
    cautionsEn: [
      "Not within walking distance of the terminals",
      "Exact 28 Sep inventory, transfer arrangements and price still require a booking-engine recheck",
    ],
    ratings: [{
      platform: "Agoda",
      score: "8.5 / 10",
      reviews: "2,888 条",
      sourceUrl: "https://www.agoda.com/en-nz/naumi-auckland-airport/hotel/auckland-nz.html",
      reviewedAt: "2026-07-31",
    }],
    roomTypes: [
      {
        rateKey: "habitat-two-queens-28",
        name: "Habitat",
        size: "28 m²",
        bed: "2 张 Queen 床；本次 2 人使用",
        photosVerified: true,
        facilities: ["两张 Queen 床", "遮光帘", "空调", "50 英寸电视", "雨淋花洒"],
        images: [
          reviewedHotelImage("naumi-habitat-two-queens-1.png", "Habitat 两张 Queen 床近景", "https://d18slle4wlf9ku.cloudfront.net/naumihotels.com-1365503697/cms/cache/v2/6930deb879fe9.png/1920x1080/fit/80/aa7e35d5f58b40542cf7c9719e627ab8.png"),
          reviewedHotelImage("naumi-habitat-two-queens-2.png", "Habitat 两张 Queen 床全景", "https://d18slle4wlf9ku.cloudfront.net/naumihotels.com-1365503697/cms/cache/v2/6930dec01c814.png/1920x1080/fit/80/ef5494ee45e5b2eeaef8359f0ea9a668.png"),
          reviewedHotelImage("naumi-habitat-two-queens-3.png", "Habitat 电视与书桌", "https://d18slle4wlf9ku.cloudfront.net/naumihotels.com-1365503697/cms/cache/v2/68fb3c4f15509.png/1920x1080/fit/80/7c60150623fb836dd2d12bc7ea28f2ec.png"),
        ],
      },
    ],
    hotelImages: [],
    availabilityNote:
      "2026-07-31 已打开 Naumi 官方预订入口并带入 2026 年 9 月 28—29 日、2 位成人；服务端 HTML 不返回可复核的房型库存或结算总价，因此没有记录价格，付款前必须重新查询。",
    availabilityNoteEn:
      "On 31 Jul 2026 the official Naumi booking entry was opened for 28–29 Sep 2026 and two adults. Its server-rendered response did not expose reproducible room inventory or a checkout total, so no price is recorded and the stay must be rechecked before payment.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "habitat-two-queens-28", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "2026-07-31 已打开官方入口并带入 2026 年 9 月 28—29 日、2 位成人；服务端没有返回可重复核验的库存或总价，故保持待重查且不展示价格。",
    officialStatusEn: "The official entry was opened on 31 Jul 2026 for 28–29 Sep and two adults, but it returned no reproducible inventory or total; the option remains needs-recheck with no displayed price.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://www.naumihotels.com/naumi-hotel-auckland-airport",
    officialBookingUrl: "https://bookings.naumihotels.com/aucklandairport/book/accommodations?checkin=2026-09-28&checkout=2026-09-29&adults=2",
    position: [-36.9713614, 174.7828705],
    mapQuery: "Naumi Hotel Auckland Airport",
  },
  {
    id: "sudima-auckland-airport",
    stayType: "hotel",
    name: "Sudima Auckland Airport",
    recommendation: "机场区标准酒店",
    recommendationEn: "Full-service airport hotel",
    summary:
      "Airpark Drive 的全服务酒店，Deluxe King 床型明确；Yellow Bus 可到门口，但停车和接驳都不是免费酒店专车方案。",
    summaryEn:
      "A full-service Airpark Drive hotel with an explicit Deluxe King room; Yellow Bus serves the door, but both parking and transfers are paid or independently operated.",
    access: "18 Airpark Drive；Yellow Bus 独立接驳服务在酒店门口停靠",
    accessEn:
      "18 Airpark Drive; the independently operated Yellow Bus stops at the hotel",
    parking: "官网：NZD 5 / 24 小时，抵达前联系酒店安排",
    parkingEn: "Official site: NZD 5 per 24 hours; arrange with the hotel before arrival",
    nearbyAttractions: airportAttractions("直线约 2.1 公里", "Yellow Bus 或驾车", {
      name: "Butterfly Creek",
      distance: "直线约 1.9 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Butterfly Creek Auckland",
    }),
    strengths: ["Deluxe King 明确为 1 张 King 床", "Yellow Bus 在酒店门口停靠"],
    strengthsEn: ["The Deluxe King explicitly has one king bed", "Yellow Bus stops at the hotel entrance"],
    cautions: ["停车收费", "Yellow Bus 为独立运营且 9 月 28 日精确库存与总价仍需复核"],
    cautionsEn: ["Parking is charged", "Yellow Bus is independently operated and exact 28 Sep inventory and total still need rechecking"],
    roomTypes: [
      {
        rateKey: "deluxe-king",
        name: "Deluxe King",
        size: "官网未标明",
        bed: "1 张 King 床",
        photosVerified: true,
        facilities: ["独立浴室", "Wi-Fi", "迷你冰箱", "书桌", "空调"],
        images: [
          reviewedHotelImage("sudima-airport-deluxe-king-official.jpg", "Deluxe King 客房", "https://www.sudimahotels.com/media/c2rl14zj/sudima-auckland-airport-deluxe-king.jpg"),
        ],
      },
    ],
    hotelImages: [
      reviewedHotelImage("sudima-airport-premium-king-official.jpg", "Premium King 客房参考（非推荐房型）", "https://www.sudimahotels.com/media/hoxkneyc/sudima-auckland-airport-premium-king.jpg?width=800&height=533&v=1dbf6b316e755c0"),
      reviewedHotelImage("sudima-airport-exterior-official.jpg", "酒店外观", "https://www.sudimahotels.com/media/1801/akl_airport_exterior_newbrand.jpg?width=1200&height=630&v=1d86b1d71dd9400"),
    ],
    availabilityNote:
      "2026-07-31 已用带日期参数的 Sudima 官方预订入口打开 2026 年 9 月 28—29 日、2 人；入口重定向回日期选择页，未得到可复现的库存或含税总价，因此不展示价格。",
    availabilityNoteEn:
      "On 31 Jul 2026 the official Sudima entry was opened with 28–29 Sep 2026 and two adults, but it redirected to the date-selection screen and exposed no reproducible inventory or tax-inclusive total, so no price is shown.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "deluxe-king", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "2026-07-31 已打开带日期参数的官方入口；入口重定向回日期选择页，未产生可重复核验的 9 月 28—29 日库存或总价，故保持待重查。",
    officialStatusEn: "The dated official entry was opened on 31 Jul 2026, but it redirected to date selection and produced no reproducible 28–29 Sep inventory or total, so this remains needs-recheck.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://www.sudimahotels.com/en/hotels/auckland-airport/",
    officialBookingUrl: "https://bookings.sudimahotels.com/auckland-airport/book/dates-of-stay?adults=2&checkin=2026-09-28&checkout=2026-09-29",
    position: [-36.984863, 174.783345],
    mapQuery: "Sudima Auckland Airport",
  },
  {
    id: "heartland-auckland-airport",
    stayType: "hotel",
    name: "Heartland Hotel Auckland Airport",
    recommendation: "24 小时接驳",
    recommendationEn: "24-hour shuttle",
    summary:
      "官网明确提供 24 小时机场接送，Superior King 房型宽敞；适合深夜抵达、但不想承担航站楼酒店价格的人。",
    summaryEn:
      "The official site confirms a 24-hour airport shuttle and a spacious Superior King, suiting late arrivals who do not need a terminal-side hotel.",
    access: "14 Airpark Drive；官网称距机场约 3 公里、接驳约 5—10 分钟",
    accessEn: "14 Airpark Drive; official site states about 3 km and a 5–10 minute transfer from the airport",
    parking: "住店当晚停车免费；短期与长期停车方案需按预订日期询价",
    parkingEn: "Parking for the night of the stay is complimentary; short- and long-term options require a date-specific quote",
    nearbyAttractions: airportAttractions("直线约 2.2 公里", "酒店 24 小时接驳约 5—10 分钟", {
      name: "Butterfly Creek",
      distance: "直线约 2.0 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Butterfly Creek Auckland",
    }),
    strengths: ["官网明确 24 小时机场接驳", "Superior King 为 30 m²、可选 King 床"],
    strengthsEn: ["Officially confirmed 24-hour airport shuttle", "The 30 m² Superior category offers a king-bed configuration"],
    cautions: ["不在航站楼步行范围", "9 月 28 日 King 床库存、停车方案与总价仍需查询"],
    cautionsEn: ["Not within walking distance of the terminals", "King configuration, parking plan and total for 28 Sep still require a live search"],
    ratings: [{
      platform: "Agoda",
      score: "8.3 / 10",
      reviews: "853 条",
      sourceUrl: "https://www.agoda.com/en-nz/heartland-hotel-auckland-airport/hotel/auckland-nz.html",
      reviewedAt: "2026-07-31",
    }],
    roomTypes: [
      {
        rateKey: "superior-studio-king",
        name: "Superior Studio · King configuration",
        size: "30 m²",
        bed: "该类别可选 1 张 King；下单时须确认 King 配置",
        photosVerified: true,
        facilities: ["独立浴室", "浴缸上方淋浴", "空调", "迷你冰箱", "24 小时客房服务"],
        images: [
          reviewedHotelImage("heartland-airport-superior-king-official-1.jpg", "Superior King 卧室", "https://www.scenichotelgroup.co.nz/content/uploads/2022/03/Heartland-Hotel-Auckland-Airport-SPK-Superior-King-6-regular-1-2000x1389.jpg"),
          reviewedHotelImage("heartland-airport-superior-king-official-2.jpg", "Superior King 书桌与休息区", "https://www.scenichotelgroup.co.nz/content/uploads/2022/03/Heartland-Hotel-Auckland-Airport-SPK-Superior-King-2-regular-2000x1389.jpg"),
          reviewedHotelImage("heartland-airport-superior-bathroom-official.jpg", "Superior 客房浴室", "https://www.scenichotelgroup.co.nz/content/uploads/2022/03/Heartland-Hotel-Auckland-Airport-All-Rooms-Bathroom-regular-2000x1389.jpg"),
        ],
      },
    ],
    hotelImages: [],
    availabilityNote:
      "2026-07-31 已核验官网酒店、房型、接驳和停车说明；官方预订控件未提供可由静态入口复现的 2026 年 9 月 28—29 日结果，故不记录价格。",
    availabilityNoteEn:
      "On 31 Jul 2026 the official hotel, room, shuttle and parking pages were verified. The booking widget did not expose a reproducible 28–29 Sep 2026 result through a static entry URL, so no price is recorded.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "superior-studio-king", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "2026-07-31 已核验官网房型、接驳和停车；预订控件没有提供可由静态入口复现的 9 月 28—29 日库存与总价，故保持待重查。",
    officialStatusEn: "Official room, shuttle and parking details were checked on 31 Jul 2026, but the widget exposed no reproducible 28–29 Sep inventory or total through a static entry, so this remains needs-recheck.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://www.scenichotelgroup.co.nz/auckland/heartland-hotel-auckland-airport/",
    position: [-36.9842645, 174.7832645],
    mapQuery: "Heartland Hotel Auckland Airport",
  },
  {
    id: "bks-pioneer-motor-lodge",
    stayType: "motel",
    name: "B-K's Pioneer Motor Lodge",
    recommendation: "King 床小厨房",
    recommendationEn: "King studio with kitchenette",
    summary:
      "翻新后的 King Studio 带小厨房和步入式淋浴；免费接驳覆盖下午至次日上午，适合晚到、第二天取车。",
    summaryEn:
      "A renovated king studio with kitchenette and walk-in shower; complimentary transfers run from afternoon through the following morning.",
    access: "205 Kirkbride Road；官网称距机场约 5 分钟，接驳自 14:00 起运行至次日 10:00",
    accessEn: "205 Kirkbride Road; official site states about five minutes from the airport, with shuttle service from 2 p.m. through 10 a.m.",
    parking: "住宿当晚免费停车；长期停车另收费",
    parkingEn: "Complimentary parking for the night of the stay; long-term parking costs extra",
    nearbyAttractions: airportAttractions("直线约 3.5 公里", "酒店接驳或驾车", {
      name: "Butterfly Creek",
      distance: "直线约 3.0 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Butterfly Creek Auckland",
    }),
    strengths: ["明确 1 张 King 床并带小厨房", "机场接驳和住宿当晚停车免费"],
    strengthsEn: ["Explicit one-king configuration with a kitchenette", "Airport shuttle and overnight parking are complimentary"],
    cautions: ["接驳并非全天连续运行", "长期停车收费，9 月 28 日库存与价格仍需人工查询"],
    cautionsEn: ["Shuttle service is not continuous all day", "Long-term parking is charged and 28 Sep inventory and price still require a live search"],
    roomTypes: [
      {
        rateKey: "superior-king-studio",
        name: "Superior King Studio · Shower",
        size: "官网未标明",
        bed: "1 张 King 床",
        photosVerified: true,
        facilities: ["小厨房", "微波炉", "电炉", "步入式淋浴", "空调", "智能电视"],
        images: [
          reviewedHotelImage("bks-pioneer-superior-king-kitchen-official.png", "Superior King Studio 小厨房", "https://webbox.imgix.net/images/boakbemabqqkmiww/9d371294-319f-4f8d-8c88-1c5f0f274abf.png"),
          reviewedHotelImage("bks-pioneer-superior-king-room-official.jpg", "Superior King Studio 卧室与休息区", "https://webbox.imgix.net/images/boakbemabqqkmiww/dd0e40d9-860d-4265-95ee-e6bced8d6bfb.png?auto=format,compress&fit=crop&crop=entropy"),
          reviewedHotelImage("bks-pioneer-superior-king-bed-official.jpg", "Superior King Studio King 床", "https://webbox.imgix.net/images/boakbemabqqkmiww/9a0874a7-8772-4a84-8240-1c55fef51ea2.png?auto=format,compress&fit=crop&crop=entropy&w=1600&h=600"),
        ],
      },
    ],
    hotelImages: [],
    availabilityNote:
      "2026-07-31 已核验官网房型、床型、接驳与停车说明；官网 Book Now 依赖动态控件，无法由静态 URL 复现 2026 年 9 月 28—29 日、2 人结果，因此未记录价格。",
    availabilityNoteEn:
      "On 31 Jul 2026 the official room, bed, shuttle and parking details were verified. Book Now relies on a dynamic widget and did not expose a reproducible 28–29 Sep 2026 result for two adults, so no price is recorded.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "superior-king-studio", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "2026-07-31 已核验官网房型、床型、接驳与停车；动态 Book Now 未提供可静态复现的 9 月 28—29 日库存或总价，故保持待重查。",
    officialStatusEn: "Official room, bed, shuttle and parking details were checked on 31 Jul 2026, but dynamic Book Now exposed no statically reproducible 28–29 Sep inventory or total, so this remains needs-recheck.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://www.bkspioneer.com/",
    position: [-36.9726836, 174.7870643],
    mapQuery: "B-K's Pioneer Motor Lodge",
  },
  {
    id: "auckland-airport-motel",
    stayType: "motel",
    name: "Auckland Airport Motel",
    recommendation: "简易 Queen 单间",
    recommendationEn: "Simple queen studio",
    summary:
      "Queen Studio 配小厨房且住店期间停车免费；主要短板是接驳仅在 09:00—16:00 运行，不适合依赖深夜接送。",
    summaryEn:
      "A queen studio with kitchenette and free parking during the stay; its major limitation is the 9 a.m.–4 p.m. shuttle window.",
    access: "138 McKenzie Road；官网称距机场 4.5 公里、约 8 分钟，接驳仅 09:00—16:00",
    accessEn: "138 McKenzie Road; official site states 4.5 km or about eight minutes from the airport, with shuttle only 9 a.m.–4 p.m.",
    parking: "住店期间免费现场停车",
    parkingEn: "Complimentary on-site parking during the stay",
    nearbyAttractions: airportAttractions("直线约 4.4 公里", "白天接驳或驾车", {
      name: "Ambury Regional Park",
      distance: "直线约 2.4 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Ambury Regional Park",
    }),
    strengths: ["Queen Studio 带小厨房", "住店期间现场停车免费"],
    strengthsEn: ["Queen Studio includes a kitchenette", "On-site parking is complimentary during the stay"],
    cautions: ["接驳只在 09:00—16:00 且部分节假日停运", "不是 King 床；9 月 28 日库存与总价仍需复核"],
    cautionsEn: ["Shuttle runs only 9 a.m.–4 p.m. and pauses on listed holidays", "Queen rather than king; exact 28 Sep inventory and total still need rechecking"],
    ratings: [{
      platform: "Agoda",
      score: "8.1 / 10",
      reviews: "448 条",
      sourceUrl: "https://www.agoda.com/en-nz/auckland-airport-motel/hotel/auckland-nz.html",
      reviewedAt: "2026-07-31",
    }],
    roomTypes: [
      {
        rateKey: "queen-studio",
        name: "Queen Studio",
        size: "官网未标明",
        bed: "1 张 Queen 床",
        photosVerified: true,
        facilities: ["小厨房", "微波炉", "冰箱", "独立浴室", "空调", "休息区"],
        images: [
          reviewedHotelImage("auckland-airport-motel-queen-official-1.jpg", "Queen Studio 卧室正面", "https://aucklandairportmotel.co.nz/public/img/queen1.jpg"),
          reviewedHotelImage("auckland-airport-motel-queen-official-2.jpg", "Queen Studio 卧室侧面", "https://aucklandairportmotel.co.nz/public/img/queen2.jpg"),
          reviewedHotelImage("auckland-airport-motel-queen-official-3.jpg", "Queen Studio 休息区与小厨房", "https://aucklandairportmotel.co.nz/public/img/queen3.jpg"),
        ],
      },
    ],
    hotelImages: [],
    availabilityNote:
      "2026-07-31 已打开官方 Book Direct Online 入口并带入 2026 年 9 月 28—29 日、2 人；静态页面未暴露可复核库存或含税总价，故不展示价格。",
    availabilityNoteEn:
      "On 31 Jul 2026 the official Book Direct Online entry was opened with 28–29 Sep 2026 and two adults. Its static response exposed no reproducible inventory or tax-inclusive total, so no price is shown.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "queen-studio", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "2026-07-31 已打开官方 Book Direct Online 并带入 9 月 28—29 日、2 人；静态响应没有可重复核验的库存或含税总价，故保持待重查。",
    officialStatusEn: "Official Book Direct Online was opened on 31 Jul 2026 for 28–29 Sep and two adults, but its static response exposed no reproducible inventory or tax-inclusive total, so this remains needs-recheck.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://aucklandairportmotel.co.nz/",
    officialBookingUrl: "https://book-directonline.com/properties/aucklandairportmotel?locale=en&items%5B0%5D%5Badults%5D=2&items%5B0%5D%5Bchildren%5D=0&items%5B0%5D%5Binfants%5D=0&currency=NZD&checkInDate=2026-09-28&checkOutDate=2026-09-29",
    position: [-36.9643389, 174.7865467],
    mapQuery: "Auckland Airport Motel",
  },
  {
    id: "holiday-inn-auckland-airport",
    stayType: "hotel",
    name: "Holiday Inn Auckland Airport",
    recommendation: "深夜入住的花园酒店备选",
    recommendationEn: "Garden hotel for a late arrival",
    summary:
      "位于 Māngere 的 251 间客房机场酒店，房间比多数机场 motel 更完整。Google 地图列有机场接驳，第三方房型页确认 15:00 后可入住，不设最晚入住时刻；适合 23:50 落地后预留入境与交通时间。",
    summaryEn:
      "A 251-room airport hotel in Māngere with fuller facilities than most airport motels. Google Maps lists an airport shuttle, while the reviewed room page allows check-in after 3 p.m. without a stated latest time, fitting a 23:50 arrival once immigration and transfer time are allowed.",
    access: "2 Ascot Road；约 4 公里到国际航站楼，Google 地图列有机场接驳；班次与费用须付款前确认",
    accessEn: "2 Ascot Road; about 4 km from the international terminal, with an airport shuttle listed on Google Maps; reconfirm timetable and cost before payment",
    parking: "Google 地图列免费停车；停车条件与房价适用范围须在预订页复核",
    parkingEn: "Google Maps lists free parking; reconfirm eligibility and rate conditions on the booking page",
    nearbyAttractions: [{
      name: "奥克兰国际航站楼",
      nameEn: "Auckland International Terminal",
      distance: "直线约 3.6 公里",
      distanceEn: "About 3.6 km straight-line",
      travelTime: "机场接驳或驾车；深夜班次须预先确认",
      travelTimeEn: "Airport shuttle or car; reconfirm the late-night timetable before arrival",
      destinationQuery: "Auckland Airport International Terminal",
    }, {
      name: "Ambury Regional Park",
      distance: "直线约 2.6 公里",
      travelTime: "驾车前往；实际路线待地图复核",
      destinationQuery: "Ambury Regional Park",
    }],
    strengths: ["没有 23:59 接机截止问题", "25 m² 双人房有独立卫浴和完整房型图库", "Google 地图列机场接驳与免费停车"],
    strengthsEn: ["No 11:59 p.m. pickup cutoff", "The 25 m² double room has a private bathroom and a verified room gallery", "Google Maps lists an airport shuttle and free parking"],
    cautions: ["不是航站楼步行酒店", "接驳班次与费用未在当前静态页面可靠复现", "9 月 28—29 日库存和含税总价仍需重新搜索"],
    cautionsEn: ["Not walkable from the terminal", "The current static pages do not reliably reproduce the shuttle timetable or charge", "Exact 28–29 Sep inventory and tax-inclusive total still need a live search"],
    roomTypes: [{
      rateKey: "standard-double-room",
      name: "Standard Double Room",
      nameEn: "Standard Double Room",
      size: "25 m²",
      sizeEn: "25 m²",
      bed: "1 张 Double 床",
      bedEn: "one double bed",
      photosVerified: true,
      facilities: ["空调", "私人浴室", "隔音", "冰箱", "书桌", "电视", "免费 Wi-Fi"],
      facilitiesEn: ["Air conditioning", "Private bathroom", "Soundproofing", "Refrigerator", "Desk", "TV", "Free Wi-Fi"],
      images: [
        reviewedHotelImage("holiday-inn-auckland-airport-standard-double-room.jpg", "Standard Double Room 卧室全景", "https://cdn.worldota.net/t/1024x768/content/87/02/87026ccad9ce3d641acb6ae4e73874b419dfa32f.PNG"),
        reviewedHotelImage("holiday-inn-auckland-airport-standard-double-bathroom.jpg", "Standard Double Room 独立浴室", "https://cdn.worldota.net/t/1024x768/content/bc/66/bc661daaaa66c47932fa920560e41cc39d1b202c.jpeg"),
        reviewedHotelImage("holiday-inn-auckland-airport-standard-double-seating.jpg", "Standard Double Room 休息区", "https://cdn.worldota.net/t/1024x768/content/b2/0e/b20e44d690b1130567f752866222ca19042c85df.jpeg"),
        reviewedHotelImage("holiday-inn-auckland-airport-standard-double-workspace.jpg", "Standard Double Room 工作区", "https://cdn.worldota.net/t/1024x768/content/7f/35/7f357fac211fd538ff4c35fe127a6abceb6c3ede.jpeg"),
      ],
    }],
    hotelImages: [],
    availabilityNote:
      "2026-07-31 已核验具体物业、地址、Google 地图评分和接驳/停车设施，并在 ZenHotels 具体物业页核对 Standard Double Room 的 25 m²、Double 床、房内设施、图片及 15:00 后入住规则；该页当前起价并非 9 月 28 日结果，因此不展示。",
    availabilityNoteEn:
      "On 31 Jul 2026 the exact property, address, Google Maps score and shuttle/parking facilities were checked. The specific ZenHotels property page confirms the 25 m² Standard Double Room, double bed, in-room facilities, images and check-in after 3 p.m. Its current from-price is not for 28 Sep and is not shown.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": { availabilityChecked: true, roomKey: "standard-double-room", quotedAt: "2026-07-31" },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail: "酒店身份、位置、评分、代表房型和晚到适配性已于 2026-07-31 核验；9 月 28—29 日、2 人 1 间的实时库存、含税总价、接驳班次与退改仍须重查。",
    officialStatusEn: "Identity, location, rating, representative room and late-arrival suitability were checked on 31 Jul 2026. Live inventory, tax-inclusive total, shuttle timetable and terms for 28–29 Sep, two adults and one room still require rechecking.",
    officialVerifiedAt: "2026-07-31",
    officialUrl: "https://www.ihg.com/holidayinn/hotels/us/en/auckland/aklap/hoteldetail",
    officialBookingUrl: "https://www.ihg.com/holidayinn/hotels/us/en/auckland/aklap/hoteldetail",
    bookingUrl: "https://www.booking.com/hotel/nz/holiday-inn-auckland-airport.html",
    agodaUrl: "https://www.agoda.com/holiday-inn-auckland-airport/hotel/auckland-nz.html",
    position: [-36.9731497, 174.7858429],
    mapQuery: "Holiday Inn Auckland Airport 2 Ascot Road",
  },
  {
    id: "proximity-apartments-manukau-airport",
    stayType: "home",
    name: "Proximity Apartments Manukau / Auckland Airport",
    recommendation: "机场南侧整套公寓",
    recommendationEn: "Self-contained apartment south of the airport",
    summary:
      "位于 Manukau 的 35 m² 服务式 Studio，明确容纳 2 人并配 Queen 床、完整厨房、独立浴室和房内洗烘；不是航站楼旁住宿，但适合想住公寓、次日再取车或向南出发的两人。",
    summaryEn:
      "A 35 m² serviced studio in Manukau for two guests, with a queen bed, full kitchen, en-suite and in-room washer/dryer. It is not terminal-side, but suits a couple wanting an apartment before collecting a car or heading south.",
    access:
      "17 Amersham Way, Manukau；Agoda 物业页显示距 Auckland Airport 约 8.57 公里，需驾车、出租车或网约车",
    accessEn:
      "17 Amersham Way, Manukau; Agoda lists Auckland Airport about 8.57 km away, requiring a car, taxi or ride-hail",
    parking:
      "官网：现场安全停车 NZD 12/晚/车，限高 2.1 米且必须提前预订；车位有限",
    parkingEn:
      "Official site: secure on-site parking costs NZD 12 per car per night, has a 2.1 m height limit and must be reserved in advance; spaces are limited",
    nearbyAttractions: [
      {
        name: "奥克兰国际航站楼",
        nameEn: "Auckland International Terminal",
        distance: "直线约 8.6 公里",
        distanceEn: "About 8.6 km straight-line",
        travelTime: "驾车、出租车或网约车；出发前复核实时路况",
        travelTimeEn: "Drive, taxi or ride-hail; recheck live traffic before departure",
        destinationQuery: "Auckland Airport International Terminal",
      },
      {
        name: "Westfield Manukau City",
        nameEn: "Westfield Manukau City",
        distance: "官网称位于物业对面",
        distanceEn: "Official site states it is opposite the property",
        travelTime: "步行前往",
        travelTimeEn: "Walk",
        destinationQuery: "Westfield Manukau City",
      },
    ],
    strengths: [
      "35 m² Studio 明确最多住 2 人、配 1 张 Queen 床",
      "完整厨房、独立浴室及房内洗衣机/烘干机",
      "Agoda 已复现 9 月 28—29 日、2 人 1 间的 Studio 库存和含税总价",
    ],
    strengthsEn: [
      "The 35 m² studio explicitly sleeps two and has one queen bed",
      "Full kitchen, en-suite bathroom and in-room washer/dryer",
      "Agoda inventory and a tax-inclusive Studio total were reproduced for 28–29 Sep, two adults and one room",
    ],
    cautions: [
      "距机场约 8.6 公里且没有核验到免费机场接驳",
      "周一官网前台标注 07:00—22:00，晚于 22:00 抵达必须预先取得书面入住安排",
      "官网动态预订页未返回可重复核验的同日总价，预订前仍需重查",
    ],
    cautionsEn: [
      "About 8.6 km from the airport, with no verified complimentary airport shuttle",
      "Official Monday reception hours are 7 a.m.–10 p.m.; arrivals after 10 p.m. require written arrangements in advance",
      "The direct dynamic booking page did not return a reproducible same-date total, so recheck before booking",
    ],
    ratings: [
      {
        platform: "Agoda",
        platformEn: "Agoda",
        score: "8.7 / 10",
        scoreEn: "8.7 / 10",
        reviews: "1,036 条 Agoda 住客评价",
        reviewsEn: "1,036 Agoda guest reviews",
        sourceUrl:
          "https://www.agoda.com/proximity-apartments-manukau-auckland-airport/hotel/auckland-nz.html",
        reviewedAt: "2026-08-01",
        verifiedPosition: [-36.9912682, 174.8791504],
      },
    ],
    roomTypes: [
      {
        rateKey: "studio-apartment-35",
        name: "Studio Apartment",
        nameEn: "Studio Apartment",
        size: "35 m²",
        sizeEn: "35 m²",
        bed: "1 张 Queen 床",
        bedEn: "one queen bed",
        photosVerified: true,
        facilities: [
          "完整厨房",
          "独立浴室",
          "洗衣机/烘干机",
          "空调",
          "私人阳台",
          "免费 Wi-Fi",
        ],
        facilitiesEn: [
          "Full kitchen",
          "En-suite bathroom",
          "Washer and dryer",
          "Air conditioning",
          "Private balcony",
          "Free Wi-Fi",
        ],
        images: [
          reviewedHotelImage(
            "proximity-manukau-studio-bedroom.jpg",
            "Studio Apartment Queen 床与客房全景",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2023/10/Proximity-Apartment_IMW-19-768x512.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-kitchen.jpg",
            "Studio Apartment Queen 床与入户方向",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2023/10/Proximity-Apartment_IMW-21-768x512.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-living.jpg",
            "Studio Apartment Queen 床、餐桌与阳台",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2019/06/IMG_1931-2-768x513.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-dining.jpg",
            "Studio Apartment 餐桌、电视与睡眠区",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2019/06/IMG_1937-1-768x512.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-window.jpg",
            "Studio Apartment 完整厨房",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2023/10/Proximity-Apartment_IMW-22-768x512.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-bathroom.jpg",
            "Studio Apartment 私人阳台与客房入口",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2019/06/IMG_1964-1-768x512.jpg",
          ),
          reviewedHotelImage(
            "proximity-manukau-studio-balcony.jpg",
            "Studio Apartment 阳台餐桌与城市景观",
            "https://www.proximityapartments.co.nz/wp-content/uploads/2019/06/IMG_1895-1-768x512.jpg",
          ),
        ],
      },
    ],
    hotelImages: [],
    availabilityNote:
      "2026-08-01 已在 Agoda 具体物业接口复现 2026 年 9 月 28—29 日、2 人 1 间的 Studio Apartment 库存；但接口无视 NZD 请求并以 USD 返回，官网 iHotelier 静态入口也未返回同日总价，因此不展示价格并保持 needs-recheck。官网通用“from NZD 165”不是本次日期报价。",
    availabilityNoteEn:
      "On 1 Aug 2026, Agoda's property endpoint reproduced Studio Apartment inventory for 28–29 Sep 2026, two adults and one room. However, it ignored the NZD request and returned USD, while the direct iHotelier entry returned no same-date total. No price is displayed, the property remains needs-recheck, and the website's generic “from NZD 165” is not treated as this stay's quote.",
    rateSnapshots: {
      "2026-09-28/2026-09-29": {
        availabilityChecked: true,
        roomKey: "studio-apartment-35",
        quotedAt: "2026-08-01",
      },
    },
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "2026-08-01 已带入官网 iHotelier 的 9 月 28—29 日、Studio、2 人参数，但静态入口仅返回预订外壳，未生成可重复核验的同日库存或总价；Agoda 同日库存可复现，但服务端无视 NZD 请求并返回 USD，故不展示价格，付款前须重查官网或最终结算页。",
    officialStatusEn:
      "On 1 Aug 2026 the official iHotelier entry was opened with 28–29 Sep, Studio and two-adult parameters, but its static response only returned the booking shell and no reproducible same-date inventory or total. Agoda's dated inventory was reproducible, but its server ignored the NZD request and returned USD, so no price is displayed; recheck the direct or final checkout page before payment.",
    officialVerifiedAt: "2026-08-01",
    officialUrl: "https://www.proximityapartments.co.nz/room/studio/",
    officialBookingUrl:
      "https://proximityapartments.ihotelier.com/book/accommodations?Adults=2&Children=0&DateIn=09%2F28%2F2026&DateOut=09%2F29%2F2026&RoomTypeId=450712",
    bookingUrl:
      "https://www.booking.com/hotel/nz/proximity-apartments-manukau-auckland-airport.html",
    agodaUrl:
      "https://www.agoda.com/proximity-apartments-manukau-auckland-airport/hotel/auckland-nz.html",
    position: [-36.9912682, 174.8791504],
    mapQuery: "Proximity Apartments 17 Amersham Way Manukau",
  },
];

applyAccommodationGalleryEnhancements(aucklandAirportHotels);
applyAccommodationRatingOverrides(aucklandAirportHotels);
completeAccommodationEnglishFields(aucklandAirportHotels, { fillRates: true });

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
