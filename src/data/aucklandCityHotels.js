import { aucklandCityAdditionalHotels } from "./aucklandCityAdditionalHotels.js";
import { completeAccommodationEnglishFields } from "./accommodationEnglishFields.js";
import { applyAccommodationRatingOverrides } from "./accommodationRatingOverrides.js";
import { applyAccommodationGalleryEnhancements } from "./accommodationGalleryEnhancements.js";

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
    stayType: "home",
    name: "Adina Apartment Hotel Auckland Britomart",
    recommendation: "行程最匹配",
    recommendationEn: "Best itinerary fit",
    summary:
      "10 月 8 日 15:10 抵达奥克兰后可在傍晚前进城办理入住；10 月 9 日约 06:30 离店前往 SkyCity 参加霍比屯往返大巴，返回后继续住同一酒店，10 月 10 日退房并前往机场。",
    summaryEn:
      "The 15:10 arrival on 8 Oct leaves time to reach the city and check in before evening. The same hotel can be kept after leaving around 06:30 for the SkyCity Hobbiton coach on 9 Oct.",
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
      "24 小时前台便于灵活入住",
      "购物日步行动线最佳",
      "当前可复现的 Premier Studio 为 36 m²、Queen 床",
      "无需为霍比屯往返大巴换酒店",
    ],
    strengthsEn: [
      "The 24-hour front desk supports flexible check-in",
      "The most convenient walking base for the city shopping day",
      "A currently reproducible 36 m² Premier Studio with a queen bed",
      "No hotel change is needed around the Hobbiton coach day",
    ],
    cautions: [
      "距离 Newmarket 仍需乘公交或打车",
      "停车位有限且平台未显示具体收费",
      "当前可复现的官方 Rate of The Day 要求预付；取消窗口未在加入预订前的页面展开",
      "早餐为 NZD 25/人/日加购，停车为 NZD 35 加购且抵达时仍视供应；旧 10 月 7—9 日两晚价格日期不同，不可用于当前行程",
    ],
    cautionsEn: [
      "Newmarket still requires a bus or taxi",
      "On-site parking is limited and the current guest price needs confirmation",
      "The currently reproducible direct Rate of The Day requires prepayment; its cancellation window was not expanded before the booking step",
      "Breakfast is a NZD 25 per-person, per-day add-on and parking is a NZD 35 add-on subject to availability on arrival; the old 7–9 Oct quote cannot be reused",
    ],
    ratings: [
      {
        platform: "Agoda",
        score: "8.8 / 10",
        reviews: "529 条",
        sourceUrl: "https://www.agoda.com/en-nz/adina-apartment-hotel-auckland-britomart/hotel/auckland-nz.html",
        reviewedAt: "2026-07-31",
      },
    ],
    roomTypes: [
      {
        rateKey: "premier-studio-queen",
        name: "尊贵一室公寓 · Queen 床",
        nameEn: "Premier Studio Room · queen bed",
        size: "36 m²",
        sizeEn: "36 m²",
        bed: "1 张 Queen 大号床",
        bedEn: "One queen bed",
        photosVerified: true,
        facilities: [
          "书桌",
          "客房保险箱",
          "宽敞衣柜",
          "免费 Wi-Fi",
        ],
        facilitiesEn: ["Work desk", "In-room safe", "Spacious wardrobe", "Free Wi-Fi"],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-1.jpg",
            label: "一室公寓睡眠与起居区",
            source: "Booking.com",
          },
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/adina-britomart-room-2.jpg",
            label: "一室公寓大床",
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
      "2026-10-08/2026-10-10": {
        roomRates: {
          "premier-studio-queen": {
            official: {
              source: "Adina Auckland Britomart 官方预订引擎",
              sourceEn: "Adina Auckland Britomart official booking engine",
              roomKey: "premier-studio-queen",
              room: "Premier Studio Room · Queen 床 · 36 m² · 2 晚",
              roomEn: "Premier Studio Room · queen bed · 36 m² · two nights",
              nonRefundableNzd: null,
              refundableNzd: null,
              rateOptions: [
                {
                  label: "官网 Rate of The Day · 两晚总价",
                  labelEn: "Direct Rate of The Day · two-night total",
                  nzd: 589.5,
                  detail:
                    "2026 年 10 月 8—10 日 · 2 位成人 · 1 间；结算前摘要显示 NZD 589.50，含税费；价格卡明确要求预付，但取消窗口未在此步骤展开。",
                  detailEn:
                    "8–10 Oct 2026 · two adults · one room; the pre-booking summary showed NZD 589.50 including taxes and fees. The rate card explicitly requires prepayment, while its cancellation window was not expanded at this step.",
                },
              ],
              cancelUntil: null,
              payment: "Rate of The Day 明确要求预付；未进入支付或最终预订步骤",
              paymentEn: "Rate of The Day explicitly requires prepayment; no payment or final booking step was opened",
              breakfast: "不含早餐；可加购每日自助早餐 NZD 25/人/日",
              breakfastEn: "Breakfast is not included; daily buffet breakfast is offered as a NZD 25 per-person, per-day add-on",
              memberNote: "eClub Exclusive - Winter Getaway 显示 NZD 274.12 平均每晚，含早餐、一个车位、12:00 延迟退房、10 月 7 日前免费取消且无需预付；选择后要求登录或免费加入 eClub，因此没有把该会员门槛价当作公开可订总价。停车加购显示 NZD 35，抵达时仍视供应。",
              memberNoteEn: "The eClub Exclusive - Winter Getaway displayed NZD 274.12 average nightly with breakfast, one car space, 12pm late checkout, free cancellation until 7 Oct and no prepayment; selecting it required sign-in or free eClub enrolment, so it is not presented as a public bookable total. The parking add-on displayed NZD 35 and remains subject to availability on arrival.",
              quotedAt: "2026-08-03",
            },
          },
        },
      },
    },
    availabilityNote:
      "2026-08-03 已在 Adina 官方预订引擎按 10 月 8—10 日、2 人 1 间核验：Premier Studio Room（36 m²、Queen 床）可订。公开 Rate of The Day 的结算前两晚总价为 NZD 589.50，含税费、要求预付；取消窗口未在该步骤展开。早餐另加 NZD 25/人/日，停车加购 NZD 35 且抵达时仍视供应。另有 eClub Exclusive - Winter Getaway 显示 NZD 274.12 平均每晚并含早餐、一个车位、12:00 延迟退房、10 月 7 日前免费取消与无需预付，但选择时要求登录或免费加入 eClub，不当作公开价。",
    availabilityNoteEn:
      "Adina's official booking engine was checked on 3 Aug 2026 for 8–10 Oct and two guests: a Premier Studio Room (36 m², queen bed) was available. The public Rate of The Day pre-booking total was NZD 589.50 including taxes and fees and requires prepayment; its cancellation window was not expanded at this step. Breakfast is a NZD 25 per-person, per-day add-on, and the NZD 35 parking add-on remains subject to availability on arrival. An eClub Exclusive - Winter Getaway showed NZD 274.12 average nightly with breakfast, one car space, 12pm late checkout, free cancellation until 7 Oct and no prepayment, but selecting it required sign-in or free eClub enrolment, so it is not presented as a public price.",
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-08-03 已在 Adina 官网按 10 月 8—10 日、2 人 1 间核验 Premier Studio Room（36 m²、Queen 床）：公开 Rate of The Day 结算前两晚总价 NZD 589.50，含税费、要求预付；取消窗口未在此步骤展开。eClub Exclusive - Winter Getaway 显示较低平均每晚价和含早、停车、可取消权益，但选择时要求登录或免费加入 eClub，因此未作为公开精确总价。",
    officialStatusEn:
      "Verified on Adina on 3 Aug 2026 for a Premier Studio Room (36 m², queen bed), 8–10 Oct and two guests: the public Rate of The Day pre-booking total was NZD 589.50 including taxes and fees and requires prepayment; its cancellation window was not expanded at this step. The lower eClub Exclusive - Winter Getaway displayed breakfast, parking and cancellation benefits but required sign-in or free eClub enrolment when selected, so it is not used as a public exact total.",
    officialVerifiedAt: "2026-08-03",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的 Adina 入口",
    officialLinkLabelEn: "Open the Adina entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；当前公开 Rate of The Day 要求预付，付款前请复核取消窗口；eClub 价格须先确认会员资格。",
    officialLinkNoteEn:
      "The entry carries 8–10 Oct 2026, two adults and one room. The current public Rate of The Day requires prepayment, so verify its cancellation window before payment; confirm eClub eligibility before relying on its prices.",
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
    stayType: "hotel",
    name: "Hotel Grand Chancellor Auckland",
    recommendation: "酒店型性价比",
    recommendationEn: "Hotel value",
    summary:
      "位置评分 9.4，标准酒店服务比公寓更直接；官方已明确 10 月 8—10 日、2 人 1 间无房。旧 10 月 7—9 日两晚快照仅用于了解历史房型与渠道情况，不代表当前可订。",
    summaryEn:
      "A conventional hotel with a 9.4 location score. The official result is unavailable for 8–10 Oct and one room for two; the old 7–9 Oct snapshot is historical room-and-channel context only, not current availability.",
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
    strengthsEn: [
      "A clearly specified Superior King category",
      "A 9.4 location score and an easy CBD walking base",
      "Conventional full-service hotel facilities",
    ],
    cautions: ["停车费用待平台详情确认", "22 m²，空间小于 Adina 尊贵一室公寓"],
    cautionsEn: [
      "The current guest parking charge still needs confirmation",
      "At 22 m², the room is smaller than Adina's premier studio",
    ],
    ratings: [],
    roomTypes: [
      {
        rateKey: "deluxe-harbour-king",
        name: "Deluxe King Harbour View",
        size: "22 m²",
        bed: "1 张 King 特大床（官网房型页明确标注）",
        photosVerified: true,
        facilities: [
          "高层",
          "海景",
          "私人浴室",
          "空调",
          "咖啡机",
          "免费 Wi-Fi",
        ],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-grand-chancellor-deluxe-king.jpg",
            label: "Deluxe King Harbour View",
            source: "https://image-tc.galaxy.tf/wijpeg-8a1ed4r1h4hcrdgisqjg9aeum/0e0a3061-r_standard.jpg",
          },
        ],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-grand-chancellor-room-twin.jpg",
        label: "酒店客房（双床配置参考）",
        source: "https://image-tc.galaxy.tf/wijpeg-27bevcoqmid6he23hv074r6yp/0e0a3005-r_standard.jpg",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-grand-chancellor-lobby.jpg",
        label: "酒店大堂",
        source: "https://image-tc.galaxy.tf/wijpeg-1rqudgb8egttevr925fcg9mc1/15-lobby-1-min-1.jpg",
      },
    ],
    rateSnapshots: {
      "2026-10-07/2026-10-09": {
        roomRates: {
          "deluxe-harbour-king": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "deluxe-harbour-king",
              room: "Deluxe King Harbour View · 22 m²",
              roomEn: "Deluxe King Harbour View · 22 m²",
              nonRefundableNzd: 440,
              refundableNzd: 454,
              cancelUntil: "2026-10-06",
              payment: "可取消档无需预付、到店付款",
              paymentEn: "No prepayment on the cancellable plan; pay at the property",
              breakfast: "早餐另加 NZD 39.50/人",
              breakfastEn: "Breakfast costs an additional NZD 39.50 per person",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    availabilityNote:
      "用户的 Booking.com 订单已确认入住 2026 年 10 月 8—10 日；当前订单视图仅显示入住 14:00—00:00、退房 00:00—11:00，未显示总价、取消或付款状态，均不作推断。官网曾于 2026-08-03 按同日期、2 人 1 间显示无房；这是历史官网结果，不否定已确认的用户订单。此前静态页面确认 Deluxe King Harbour View 名称、8—11 层、King 床与港景；旧官网/Booking 记录只对应 10 月 7—9 日，不能沿用。",
    availabilityNoteEn:
      "The user's Booking.com order is confirmed for 8–10 Oct 2026. The current order view shows only check-in from 14:00 to 00:00 and check-out from 00:00 to 11:00; it did not show the total, cancellation or payment status, so none is inferred. The official site had shown no availability for the same dates and two adults on 3 Aug 2026; that historical direct result does not negate the confirmed user order. Earlier static content confirms the Deluxe King Harbour View name, floors 8–11, king bed and harbour view; old direct and Booking.com records cover only 7–9 Oct and cannot be reused.",
    officialStatus: "exact-date-unavailable",
    officialStatusDetail:
      "2026-08-03 在带入 10 月 8—10 日、1 间、2 人的 Hotel Grand Chancellor 官方入口上，短暂加载后结果页明确显示“Sorry, we don’t have any availability for the dates selected”。此为该精确条件的官方无房结果；未外推至其他日期、人数或房型。",
    officialStatusEn:
      "On 3 Aug 2026, the Hotel Grand Chancellor official entry carrying 8–10 Oct, one room and two adults finished loading and explicitly displayed “Sorry, we don’t have any availability for the dates selected”. This is an official unavailable result for the exact conditions only; it is not extended to other dates, guest counts or room types.",
    officialVerifiedAt: "2026-08-03",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的酒店官网入口",
    officialLinkLabelEn: "Open the hotel entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；2026-08-03 官方结果为无房。若改日期或人数，须重新核对库存、总价、早餐、取消截止时间及扣款规则。",
    officialLinkNoteEn:
      "The entry carries 8–10 Oct 2026, two adults and one room; the official result on 3 Aug was unavailable. If dates or guests change, recheck inventory, total, breakfast, the cancellation deadline and charge terms.",
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
    stayType: "hotel",
    name: "Holiday Inn Express Auckland City Centre",
    recommendation: "含早可取消",
    recommendationEn: "Breakfast and flexibility",
    summary:
      "位置评分 9.5，当前推荐的 1 Queen Standard with Free Breakfast 适合 2 人；IHG 官网已复现 10 月 8—10 日的会员可取消套餐，总价 NZD 530.10（含税与早餐）。该价要求 IHG One Rewards 会员资格，不能当作所有访客的公开报价。",
    summaryEn:
      "A 9.5 location score and a 1 Queen Standard with Free Breakfast suited to two guests. IHG reproduced a cancellable member rate of NZD 530.10 including tax and breakfast for 8–10 Oct; it requires IHG One Rewards membership and is not presented as a public rate for every traveller.",
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
    strengths: ["Standard Queen 明确适合 2 人", "位置评分 9.5", "步行可达 Queen Street 与 Commercial Bay"],
    cautions: ["10 月 8—10 日的精确总价为 IHG One Rewards 会员专属价；非会员公开总价未在结算前复现", "最便宜大床房仅 20 m²"],
    strengthsEn: [
      "A clearly identified Standard Queen category for two guests",
      "9.5 location score",
      "Walkable to Queen Street and Commercial Bay",
    ],
    cautionsEn: [
      "The exact 8–10 Oct total is an IHG One Rewards member rate; a public non-member total was not reproduced before checkout",
      "The recommended Standard Queen room is compact at 20 m²",
    ],
    ratings: [
      {
        platform: "Agoda",
        score: "8.9 / 10",
        reviews: "594 条",
        sourceUrl: "https://www.agoda.com/en-nz/holiday-inn-express-auckland-city-centre/hotel/auckland-nz.html",
        reviewedAt: "2026-07-31",
      },
    ],
    roomTypes: [
      {
        rateKey: "standard-queen",
        name: "标准大号床间 · 含免费早餐",
        size: "20 m²",
        bed: "1 张大号双人床",
        photosVerified: true,
        facilities: ["城市景", "含早餐", "私人浴室", "空调", "免费 Wi-Fi"],
        images: [
          {
            src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-hie-queen-room.jpg",
            label: "1 Queen Standard with Free Breakfast 客房",
            source: "Agoda 酒店图库 · https://pix6.agoda.net/hotelImages/28817936/1332583720/4facf0644de81fbf8878d1b6ae6f5721.jpeg?ce=3&s=1024x768",
          },
        ],
      },
    ],
    hotelImages: [
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-hie-exterior.jpg",
        label: "Holiday Inn Express Auckland City Centre 外观",
        source: "Agoda 酒店图库 · https://pix6.agoda.net/hotelImages/28817936/0/663c950af917d3e27f1c45bbfaa8e0c9.jpg?ce=0&s=1024x768",
      },
      {
        src: "/new-zealand-slow-trip-2026/images/hotels/auckland-city-hie-restaurant.jpg",
        label: "早餐与公共餐饮区",
        source: "Agoda 酒店图库 · https://pix6.agoda.net/hotelImages/28817936/0/23c39c3d54c0595cf66d7611b9a77d57.jpg?ce=0&s=1024x768",
      },
    ],
    availabilityNote:
      "2026-08-03 已在 IHG 官网按 2026 年 10 月 8—10 日、2 人 1 间核验 1 Queen Standard With Free Breakfast：IHG One Rewards 会员专享 Best Flexible Rate 含税总价 NZD 530.10，含早餐；10 月 7 日当地时间 18:00 前可免费取消，未要求预付。页面还列出抵达时全额住宿预付款（Security Deposit）；因此“无预付”只指订房时无订金，不等于入住时不会扣款。该精确总价要求免费加入 IHG One Rewards，不能当作非会员公开价；非会员总价未在结算前复现。",
    availabilityNoteEn:
      "IHG was checked on 3 Aug 2026 for the 1 Queen Standard With Free Breakfast, 8–10 Oct 2026 and two guests. Its IHG One Rewards member-only Best Flexible Rate totalled NZD 530.10 including tax and breakfast; it is free to cancel before 6:00 pm local hotel time on 7 Oct, with no booking-time deposit required. The page also lists full accommodation prepayment on arrival as a security deposit, so no booking-time deposit does not mean no charge at arrival. This exact total requires free IHG One Rewards enrolment and is not presented as a public non-member price; a non-member total was not reproduced before checkout.",
    rateSnapshots: {
      "2026-10-08/2026-10-10": {
        roomRates: {
          "standard-queen": {
            official: {
              source: "IHG 官网 · IHG One Rewards 会员价",
              sourceEn: "IHG direct website · IHG One Rewards member rate",
              roomKey: "standard-queen",
              room: "1 Queen Standard With Free Breakfast · 2 晚",
              roomEn: "1 Queen Standard With Free Breakfast · two nights",
              nonRefundableNzd: null,
              refundableNzd: 530.1,
              cancelUntil: "2026-10-07 18:00 前（酒店当地时间）免费取消",
              cancelUntilEn: "Free cancellation before 6:00 pm local hotel time on 7 Oct 2026",
              refundableRateLabel: "IHG One Rewards 会员专享 Best Flexible Rate · 含税与早餐",
              refundableRateLabelEn: "IHG One Rewards member-only Best Flexible Rate · tax and breakfast included",
              payment: "订房时无需订金；页面另列抵达时全额住宿预付款（Security Deposit）",
              paymentEn: "No booking-time deposit; the page separately lists full accommodation prepayment on arrival as a security deposit",
              breakfast: "含早餐",
              breakfastEn: "Breakfast included",
              memberNote: "该精确总价要求免费加入 IHG One Rewards；非会员公开总价未在结算前复现。",
              memberNoteEn: "This exact total requires free IHG One Rewards enrolment; a public non-member total was not reproduced before checkout.",
              quotedAt: "2026-08-03",
            },
          },
        },
      },
      "2026-10-07/2026-10-09": {
        roomRates: {
          "standard-queen": {
            booking: {
              source: "Booking.com",
              roomKey: "standard-queen",
              room: "标准大号床间 · 20 m²",
              roomEn: "Standard Queen Room · 20 m²",
              nonRefundableNzd: null,
              refundableNzd: 558,
              cancelUntil: "2026-10-06",
              payment: "无需预付、到店付款",
              paymentEn: "No prepayment; pay at the property",
              breakfast: "已含早餐",
              breakfastEn: "Breakfast included",
              quotedAt: "2026-07-27",
            },
          },
        },
      },
    },
    officialStatus: "exact-rate-verified",
    officialStatusDetail:
      "2026-08-03 已在 IHG 官网按 2026 年 10 月 8—10 日、2 人 1 间核验 1 Queen Standard With Free Breakfast：IHG One Rewards 会员专享 Best Flexible Rate 含税总价 NZD 530.10，含早餐，10 月 7 日当地时间 18:00 前可免费取消。订房时无需订金，但页面另列抵达时全额住宿预付款。该精确总价要求免费加入 IHG One Rewards；非会员公开总价未在结算前复现。",
    officialStatusEn:
      "Verified on IHG on 3 Aug 2026 for the 1 Queen Standard With Free Breakfast, 8–10 Oct 2026 and two guests: the IHG One Rewards member-only Best Flexible Rate totalled NZD 530.10 including tax and breakfast, and is free to cancel before 6:00 pm local hotel time on 7 Oct. No booking-time deposit is required, but the page separately lists full accommodation prepayment on arrival. This exact total requires free IHG One Rewards enrolment; a public non-member total was not reproduced before checkout.",
    officialVerifiedAt: "2026-08-03",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的 IHG 入口",
    officialLinkLabelEn: "Open the IHG entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；显示的精确总价为会员价，付款前请复核会员资格、取消截止与抵达时的扣款规则。",
    officialLinkNoteEn:
      "The entry carries 8–10 Oct 2026, two adults and one room. If it loads normally, verify the Standard Queen two-night tax-inclusive total, breakfast, cancellation deadline and charge terms.",
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
  ...aucklandCityAdditionalHotels,
];

applyAccommodationGalleryEnhancements(aucklandCityHotels);
applyAccommodationRatingOverrides(aucklandCityHotels);
completeAccommodationEnglishFields(aucklandCityHotels);
