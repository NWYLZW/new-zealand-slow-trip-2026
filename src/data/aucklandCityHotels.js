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
      "25 m² 且有小厨房",
      "无需为霍比屯往返大巴换酒店",
    ],
    strengthsEn: [
      "The 24-hour front desk supports flexible check-in",
      "The most convenient walking base for the city shopping day",
      "A 25 m² studio with a kitchenette",
      "No hotel change is needed around the Hobbiton coach day",
    ],
    cautions: [
      "距离 Newmarket 仍需乘公交或打车",
      "停车位有限且平台未显示具体收费",
      "一室公寓只能请求 King，平台明确写床型视供应；若要锁定大床应选尊贵一室 Queen",
      "10 月 8—10 日两晚精确库存、总价与退改待重新核验；旧 10 月 7—9 日两晚价格日期不同，不可用于当前行程",
    ],
    cautionsEn: [
      "Newmarket still requires a bus or taxi",
      "On-site parking is limited and the current guest price needs confirmation",
      "The standard studio only accepts a king-bed request subject to availability; choose the premier queen studio to lock in one large bed",
      "Availability, total price and terms for 8–10 Oct remain to be re-checked; the old 7–9 Oct quote cannot be reused",
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
        availabilityChecked: true,
        roomKey: "studio-king-25",
        quotedAt: "2026-08-01",
      },
      "2026-10-07/2026-10-09": {
        roomRates: {
          "studio-king-25": {
            booking: {
              source: "Booking.com · Genius 1",
              roomKey: "studio-king-25",
              room: "一室公寓 · 超大床选项 · 25 m²",
              roomEn: "Studio · king-bed option · 25 m²",
              nonRefundableNzd: 299,
              refundableNzd: 398,
              cancelUntil: "2026-10-06",
              payment: "免费取消档在 10 月 4 日前（不含当日）零付款",
              paymentEn: "Nothing is charged before 4 Oct on the free-cancellation plan",
              breakfast: "早餐另加 NZD 30/人",
              breakfastEn: "Breakfast costs an additional NZD 30 per person",
              quotedAt: "2026-07-28",
            },
          },
        },
      },
    },
    availabilityNote:
      "2026-08-01 已打开带入 10 月 8—10 日、2 人 1 间的 Adina 官方入口，但被 Incapsula 拦截，未返回可复现的库存、总价或条款。下方 10 月 7—9 日两晚记录仅是历史快照，日期不同，不能作为当前报价。",
    availabilityNoteEn:
      "The Adina direct entry was opened on 1 Aug 2026 with 8–10 Oct, two adults and one room, but Incapsula blocked it before reproducible inventory, totals or terms were returned. The saved 7–9 Oct snapshot is historical only and cannot be treated as a current quote.",
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "Adina 官网与 25 m² Studio 房型基础信息已核验。2026-08-01 打开已带入 10 月 8—10 日、2 人 1 间的官方预订入口时，Incapsula 在库存与房价出现前拦截请求；因此精确库存、含税总价、早餐、付款和退改仍未核验，日期不同的旧两晚价格不会作为当前报价。",
    officialStatusEn:
      "The Adina site and the basic 25 m² Studio details were checked. On 1 Aug 2026 the direct entry carrying 8–10 Oct, two adults and one room was blocked by Incapsula before inventory or rates appeared. Exact availability, tax-inclusive total, breakfast, payment and cancellation terms therefore remain unverified; the old two-night total is not current because its dates differ.",
    officialVerifiedAt: "2026-08-01",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的 Adina 入口",
    officialLinkLabelEn: "Open the Adina entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；若能通过安全校验，请在付款前核对含税总价、床型、早餐、取消截止时间和扣款规则。",
    officialLinkNoteEn:
      "The entry carries 8–10 Oct 2026, two adults and one room. If the security check completes, verify the tax-inclusive total, bedding, breakfast, cancellation deadline and charge terms before payment.",
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
      "2026-10-08/2026-10-10": {
        availabilityChecked: true,
        roomKey: "deluxe-harbour-king",
        quotedAt: "2026-08-01",
      },
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
      "2026-08-01 已打开带入 10 月 8—10 日、2 人 1 间的官网入口；静态响应确认 Deluxe King Harbour View 名称、8—11 层、King 床与港景，但动态库存、总价和退改没有写入可保存响应。旧官网/Booking 记录只对应 10 月 7—9 日，不能沿用。",
    availabilityNoteEn:
      "The dated direct entry was opened on 1 Aug 2026. Its static response confirms the Deluxe King Harbour View name, floors 8–11, king bed and harbour view, but dynamic inventory, total and cancellation terms were not embedded in a reproducible response. The old direct and Booking.com records cover only 7–9 Oct and cannot be reused.",
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "Hotel Grand Chancellor 官网与 Deluxe King Harbour View 房型基础信息已核验。2026-08-01 打开已带入 10 月 8—10 日、2 人 1 间的入口后，页面只返回酒店与房型静态数据，动态 TravelClick 库存、精确总价、早餐、付款和取消条款未在可保存响应中出现，因此仍需动态复查。",
    officialStatusEn:
      "The Hotel Grand Chancellor site and Deluxe King Harbour View basics were checked. On 1 Aug 2026 the entry carrying 8–10 Oct, two adults and one room returned hotel and room content, but the dynamic TravelClick inventory, exact total, breakfast, payment and cancellation terms were not embedded in a reproducible response and still require a live check.",
    officialVerifiedAt: "2026-08-01",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的酒店官网入口",
    officialLinkLabelEn: "Open the hotel entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；动态房价加载后，须核对总价是否含税、早餐、取消截止时间及扣款规则。",
    officialLinkNoteEn:
      "The entry carries 8–10 Oct 2026, two adults and one room. Once live rates load, verify whether the total includes taxes, breakfast, the cancellation deadline and charge terms.",
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
      "位置评分 9.5，当前推荐 Standard Queen 房型适合 2 人；含早、取消和到店付款记录来自 10 月 7—9 日旧快照，当前 10 月 8—10 日两晚条款需重新核验。",
    summaryEn:
      "A 9.5 location score and a Standard Queen category suited to two guests; breakfast, cancellation and pay-at-property details come from the old 7–9 Oct snapshot and need rechecking for 8–10 Oct.",
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
    cautions: ["10 月 8—10 日精确总价待重新核验，日期不同的旧两晚报价不可比较", "最便宜大床房仅 20 m²"],
    strengthsEn: [
      "A clearly identified Standard Queen category for two guests",
      "9.5 location score",
      "Walkable to Queen Street and Commercial Bay",
    ],
    cautionsEn: [
      "The exact 8–10 Oct total needs a fresh check; the old 7–9 Oct quote is not comparable",
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
      "2026-08-01 已打开带入 10 月 8—10 日、2 人 1 间的 IHG 入口，但当前网络响应被 IHG 边缘服务拒绝，未返回可复现库存、总价或条款。10 月 7—9 日的旧快照日期不同，不用于当前比较。",
    availabilityNoteEn:
      "The IHG entry carrying 8–10 Oct, two adults and one room was opened on 1 Aug 2026, but the current network response was rejected by IHG's edge service before reproducible inventory, a total or terms were returned. The old 7–9 Oct snapshot has different dates and is not used for the current comparison.",
    rateSnapshots: {
      "2026-10-08/2026-10-10": {
        availabilityChecked: true,
        roomKey: "standard-queen",
        quotedAt: "2026-08-01",
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
    officialStatus: "needs-recheck",
    officialStatusDetail:
      "IHG 官网与 Standard Queen 房型基础信息已核验。2026-08-01 打开已带入 10 月 8—10 日、2 人 1 间的 IHG 入口，但当前网络响应被 IHG 边缘服务拒绝，未取得可复现的库存、含税总价、早餐、付款或取消条款；旧记录仅对应 10 月 7—9 日。",
    officialStatusEn:
      "The IHG site and Standard Queen basics were checked. On 1 Aug 2026 the entry carrying 8–10 Oct, two adults and one room was opened, but the current network response was rejected by IHG's edge service before reproducible inventory, a tax-inclusive total, breakfast, payment or cancellation terms were returned. The old record covers only 7–9 Oct.",
    officialVerifiedAt: "2026-08-01",
    officialLinkRetainsSearch: true,
    officialLinkLabel: "打开已带入当前日期与人数的 IHG 入口",
    officialLinkLabelEn: "Open the IHG entry with current dates and guests",
    officialLinkNote:
      "入口带入 2026 年 10 月 8—10 日、2 位成人、1 间；若页面正常加载，请核对 Standard Queen 的两晚含税总价、早餐、取消截止时间和扣款规则。",
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
